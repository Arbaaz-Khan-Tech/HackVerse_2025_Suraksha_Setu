"""Face recognition for offender database.

Uses DeepFace for both detection and embedding. The detector and embedding
model are configurable via env vars so the threshold/quality tradeoff can be
tuned without code changes:

    FACE_DETECTOR_BACKEND
        mtcnn       - default. good on profile/tilt, ~300ms/frame CPU.
        opencv      - Haar cascade, fast but frontal-only (was the old default).
        ssd         - OpenCV DNN SSD face detector, fast+decent.
        mediapipe   - fast, solid quality.
        retinaface  - best quality, ~1s/frame CPU.

    FACE_EMBED_MODEL
        Facenet     - default. 128-dim. Preserves existing stored embeddings.
        Facenet512  - 512-dim, better separation. Requires re-registration.
        ArcFace     - 512-dim, state-of-the-art. Requires re-registration.

    FACE_MATCH_THRESHOLD     cosine sim cutoff (default 0.6)
    FACE_FRAME_INTERVAL      run every Nth CCTV frame (default 15)
    FACE_MIN_SIZE            ignore detected faces smaller than this many px (default 60)

Only offenders with lookout_active != False are loaded into the match cache.
"""

import os
import time
import numpy as np
import cv2
from deepface import DeepFace

DETECTOR_BACKEND = os.environ.get("FACE_DETECTOR_BACKEND", "mtcnn")
EMBED_MODEL = os.environ.get("FACE_EMBED_MODEL", "Facenet")
MATCH_THRESHOLD = float(os.environ.get("FACE_MATCH_THRESHOLD", "0.6"))
FRAME_INTERVAL = int(os.environ.get("FACE_FRAME_INTERVAL", "15"))
MIN_FACE_SIZE = int(os.environ.get("FACE_MIN_SIZE", "40"))
DEBOUNCE_SECONDS = 10

print(f"[FACE] detector={DETECTOR_BACKEND} model={EMBED_MODEL} "
      f"threshold={MATCH_THRESHOLD} frame_interval={FRAME_INTERVAL} "
      f"min_face_size={MIN_FACE_SIZE}")

_offender_cache = []      # [{"id", "name", "embedding": np.ndarray}]
_last_match_ts = {}       # offender_id -> last alert epoch
_frame_counter = 0


def _cosine(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def _face_to_uint8_bgr(face):
    """DeepFace sometimes returns float [0,1] RGB. Normalize to uint8 BGR."""
    if face.dtype != np.uint8:
        face = (face * 255).astype(np.uint8)
    # extract_faces returns RGB; represent() expects either is fine, but keep
    # consistent with OpenCV conventions.
    return cv2.cvtColor(face, cv2.COLOR_RGB2BGR)


def generate_embedding(image_path):
    """Run detection + embedding on a file path. Returns (list[float] | None, err | None).
    Raises only on catastrophic errors. If no face is found, returns (None, message)."""
    try:
        result = DeepFace.represent(
            img_path=image_path,
            model_name=EMBED_MODEL,
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=True,
            align=True,
        )
        return list(map(float, result[0]["embedding"])), None
    except Exception as e:
        return None, str(e)


def average_embeddings(embeddings):
    """Aggregate multiple embeddings of the same person into a single robust vector.

    Each face embedding is L2-normalized first so the average lies on the unit
    sphere, matching what cosine similarity expects. With n captures of slightly
    different angle / expression / lighting this produces a centroid that
    generalizes better than any single frame.
    """
    if not embeddings:
        return None
    arr = np.asarray(embeddings, dtype=np.float32)
    norms = np.linalg.norm(arr, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    unit = arr / norms
    centroid = unit.mean(axis=0)
    n = np.linalg.norm(centroid)
    if n > 0:
        centroid = centroid / n
    return [float(x) for x in centroid]


def detect_face_crop(image_path):
    """Find the largest face in an image and return it as a BGR ndarray.
    Used for Aadhar card uploads where we want to embed only the face region."""
    try:
        faces = DeepFace.extract_faces(
            img_path=image_path,
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=True,
            align=True,
        )
    except Exception as e:
        return None, str(e)
    if not faces:
        return None, "no face detected"
    biggest = max(
        faces,
        key=lambda f: f["facial_area"]["w"] * f["facial_area"]["h"],
    )
    return _face_to_uint8_bgr(biggest["face"]), None


def refresh_cache(offenders_collection):
    """Reload active-lookout offender embeddings from MongoDB into memory.
    Offenders with lookout_active == False are excluded from live matching."""
    global _offender_cache
    new_cache = []
    cursor = offenders_collection.find(
        {"lookout_active": {"$ne": False}},
        {"name": 1, "embedding": 1},
    )
    for doc in cursor:
        if not doc.get("embedding"):
            continue
        new_cache.append({
            "id": str(doc["_id"]),
            "name": doc["name"],
            "embedding": np.array(doc["embedding"], dtype=np.float32),
        })
    _offender_cache = new_cache
    print(f"[FACE] Offender cache refreshed: {len(_offender_cache)} active lookouts")
    return len(_offender_cache)


def _should_process_frame():
    global _frame_counter
    _frame_counter += 1
    return _frame_counter % FRAME_INTERVAL == 0


def match_frame(frame_bgr):
    """Detect faces in frame via DeepFace, compare embeddings to cache, return matches.

    Logs every similarity score to stdout so the threshold can be tuned.
    Runs only once every FRAME_INTERVAL frames; returns [] on skipped frames.

    Each match: {"offender_id", "name", "similarity", "bbox": [x, y, w, h]}.
    Matches are debounced per-offender for DEBOUNCE_SECONDS.
    """
    if not _offender_cache:
        return []
    if not _should_process_frame():
        return []

    frame_h, frame_w = frame_bgr.shape[:2]

    # One call: detect + align + embed at the model's correct input size.
    # Previous two-step approach (extract_faces → represent(skip)) produced wrong
    # embeddings because extract_faces defaults to VGG-Face's 224x224 target, not
    # the embedding model's expected size.
    try:
        results = DeepFace.represent(
            img_path=frame_bgr,
            model_name=EMBED_MODEL,
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=False,
            align=True,
        )
    except Exception as e:
        print(f"[FACE] represent failed: {e}")
        return []

    matches = []
    now = time.time()

    for res in results:
        fa = res.get("facial_area") or {}
        x = int(fa.get("x", 0))
        y = int(fa.get("y", 0))
        w = int(fa.get("w", 0))
        h = int(fa.get("h", 0))

        # DeepFace falls back to "whole image as face" when none detected.
        if w >= int(frame_w * 0.98) and h >= int(frame_h * 0.98):
            continue
        # Quality gate: tiny faces embed poorly and produce noise.
        if w < MIN_FACE_SIZE or h < MIN_FACE_SIZE:
            print(f"[FACE] skipping small face ({w}x{h} < {MIN_FACE_SIZE}px)")
            continue

        embedding = np.array(res["embedding"], dtype=np.float32)

        print(f"[FACE] face at ({x},{y},{w},{h}) vs {len(_offender_cache)} offenders:")
        best = None
        for off in _offender_cache:
            if off["embedding"].shape != embedding.shape:
                print(f"       - {off['name']:<30} SKIPPED (embedding dim mismatch: "
                      f"{off['embedding'].shape[0]} vs {embedding.shape[0]}, "
                      f"re-register with current model)")
                continue
            sim = _cosine(embedding, off["embedding"])
            tag = "  <-- MATCH" if sim >= MATCH_THRESHOLD else ""
            print(f"       - {off['name']:<30} sim={sim:.4f}{tag}")
            if sim >= MATCH_THRESHOLD and (best is None or sim > best["similarity"]):
                best = {
                    "offender_id": off["id"],
                    "name": off["name"],
                    "similarity": round(sim, 4),
                    "bbox": [x, y, w, h],
                }

        if best is not None:
            last = _last_match_ts.get(best["offender_id"], 0)
            if now - last >= DEBOUNCE_SECONDS:
                _last_match_ts[best["offender_id"]] = now
                matches.append(best)
            else:
                print(f"[FACE] debounced {best['name']} ({now - last:.1f}s since last alert)")

    return matches

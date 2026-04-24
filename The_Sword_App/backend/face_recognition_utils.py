"""Face recognition for offender database.

Facenet embeddings via DeepFace + Haar cascade face detection. Offender
embeddings are cached in memory; refresh_cache() must be called after any
DB mutation so the live CCTV loop sees updates immediately.

Tune MATCH_THRESHOLD via the FACE_MATCH_THRESHOLD env var.
"""

import os
import time
import numpy as np
import cv2
from deepface import DeepFace

MODEL_NAME = "Facenet"
MATCH_THRESHOLD = float(os.environ.get("FACE_MATCH_THRESHOLD", "0.6"))
FRAME_INTERVAL = int(os.environ.get("FACE_FRAME_INTERVAL", "15"))
DEBOUNCE_SECONDS = 10

_face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

_offender_cache = []      # [{"id", "name", "embedding": np.ndarray}]
_last_match_ts = {}       # offender_id -> last alert epoch
_frame_counter = 0


def _cosine(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def generate_embedding(image_path):
    """Run Facenet on an image file. Returns (list[float] | None, err_msg | None)."""
    try:
        result = DeepFace.represent(
            img_path=image_path, model_name=MODEL_NAME, enforce_detection=True
        )
        return list(map(float, result[0]["embedding"])), None
    except Exception as e:
        return None, str(e)


def _embed_array(face_bgr):
    try:
        result = DeepFace.represent(
            img_path=face_bgr, model_name=MODEL_NAME, enforce_detection=False
        )
        return np.array(result[0]["embedding"], dtype=np.float32), None
    except Exception as e:
        return None, str(e)


def detect_face_crop(image_path):
    """Find the largest face in an image and return it as a BGR ndarray.
    Useful for Aadhar card uploads where the photo contains more than the face.
    Returns (crop_ndarray | None, err_msg | None).
    """
    img = cv2.imread(image_path)
    if img is None:
        return None, "could not read image"
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = _face_cascade.detectMultiScale(gray, 1.1, 4)
    if len(faces) == 0:
        return None, "no face detected in image"
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    pad = int(0.15 * max(w, h))
    y0, y1 = max(0, y - pad), min(img.shape[0], y + h + pad)
    x0, x1 = max(0, x - pad), min(img.shape[1], x + w + pad)
    return img[y0:y1, x0:x1], None


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
    """Frame-skip gate. Returns True every FRAME_INTERVAL calls."""
    global _frame_counter
    _frame_counter += 1
    return _frame_counter % FRAME_INTERVAL == 0


def match_frame(frame_bgr):
    """Detect faces in frame, compare embeddings to cache, return matches.

    Logs every similarity score to stdout so the threshold can be tuned.
    Runs only once every FRAME_INTERVAL frames; returns [] on skipped frames.

    Each match: {"offender_id", "name", "similarity", "bbox": [x, y, w, h]}.
    Matches are debounced per-offender for DEBOUNCE_SECONDS.
    """
    if not _offender_cache:
        return []
    if not _should_process_frame():
        return []

    gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
    faces = _face_cascade.detectMultiScale(gray, 1.1, 4)
    if len(faces) == 0:
        return []

    matches = []
    now = time.time()
    for (x, y, w, h) in faces:
        crop = frame_bgr[y:y+h, x:x+w]
        embedding, err = _embed_array(crop)
        if embedding is None:
            print(f"[FACE] embedding failed at ({x},{y},{w},{h}): {err}")
            continue

        print(f"[FACE] face at ({x},{y},{w},{h}) vs {len(_offender_cache)} offenders:")
        best = None
        for off in _offender_cache:
            sim = _cosine(embedding, off["embedding"])
            tag = "  <-- MATCH" if sim >= MATCH_THRESHOLD else ""
            print(f"       - {off['name']:<30} sim={sim:.4f}{tag}")
            if sim >= MATCH_THRESHOLD and (best is None or sim > best["similarity"]):
                best = {
                    "offender_id": off["id"],
                    "name": off["name"],
                    "similarity": round(sim, 4),
                    "bbox": [int(x), int(y), int(w), int(h)],
                }

        if best is not None:
            last = _last_match_ts.get(best["offender_id"], 0)
            if now - last >= DEBOUNCE_SECONDS:
                _last_match_ts[best["offender_id"]] = now
                matches.append(best)
            else:
                print(f"[FACE] debounced {best['name']} ({now - last:.1f}s since last alert)")

    return matches

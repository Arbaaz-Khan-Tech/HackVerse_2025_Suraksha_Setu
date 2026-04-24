"""
Generate face embeddings for the offender/missing-person database.

Usage:
  Single image:
      python generate_embedding.py --image path/to/photo.jpg --name Arbaaz

  Whole folder (filename without extension becomes the person's name):
      python generate_embedding.py --folder path/to/photos

  Interactive (prompts for image path and name):
      python generate_embedding.py

Output:
  embeddings/<name>_embedding.npy   (matches app.py's load_offender_db format)
"""

import argparse
import os
import sys

import numpy as np
from deepface import DeepFace

EMBEDDINGS_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "embeddings")
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg"}
MODEL_NAME = "Facenet"

os.makedirs(EMBEDDINGS_FOLDER, exist_ok=True)


def generate_embedding(image_path: str, name: str) -> bool:
    if not os.path.isfile(image_path):
        print(f"[SKIP] File not found: {image_path}")
        return False

    name = name.strip().replace(" ", "_")
    if not name:
        print("[SKIP] Empty name.")
        return False

    try:
        result = DeepFace.represent(img_path=image_path, model_name=MODEL_NAME)
        embedding = result[0]["embedding"]
    except Exception as e:
        print(f"[FAIL] {image_path}: no face detected or error ({e})")
        return False

    out_path = os.path.join(EMBEDDINGS_FOLDER, f"{name}_embedding.npy")
    np.save(out_path, np.array(embedding))
    print(f"[OK]   {image_path}  ->  {out_path}")
    return True


def process_folder(folder: str) -> None:
    if not os.path.isdir(folder):
        print(f"Folder not found: {folder}")
        sys.exit(1)

    count = 0
    for fname in sorted(os.listdir(folder)):
        ext = os.path.splitext(fname)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            continue
        person_name = os.path.splitext(fname)[0]
        if generate_embedding(os.path.join(folder, fname), person_name):
            count += 1

    print(f"\nDone. {count} embedding(s) saved to {EMBEDDINGS_FOLDER}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Facenet embeddings for the face database.")
    parser.add_argument("--image", help="Path to a single image file")
    parser.add_argument("--name", help="Name label for the single image")
    parser.add_argument("--folder", help="Folder of images (filename becomes the name)")
    args = parser.parse_args()

    if args.folder:
        process_folder(args.folder)
        return

    if args.image and args.name:
        generate_embedding(args.image, args.name)
        return

    # Interactive fallback
    print("Face Embedding Generator")
    print("------------------------")
    image_path = input("Image path: ").strip().strip('"').strip("'")
    name = input("Name (label): ").strip()
    generate_embedding(image_path, name)


if __name__ == "__main__":
    main()

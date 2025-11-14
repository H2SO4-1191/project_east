import os
import shutil
import uuid

# Paths
ROOT = r"" # Path to the root folder that contains all.
OUTPUT = os.path.join(ROOT, "document")

os.makedirs(OUTPUT, exist_ok=True)

# Names of folders inside.
FOLDERS = [
    "scanned_upright",
    "scanned_rotated",
    "photo"
]

EXT = (".jpg", ".jpeg", ".png")

count = 0

for folder in FOLDERS:
    base_path = os.path.join(ROOT, folder, "images")

    if not os.path.exists(base_path):
        print(f"[!] Skipped missing folder: {base_path}")
        continue

    for sub in os.listdir(base_path):
        sub_path = os.path.join(base_path, sub)

        if not os.path.isdir(sub_path):
            continue

        for file in os.listdir(sub_path):
            if file.lower().endswith(EXT):
                src = os.path.join(sub_path, file)

                new_name = f"{uuid.uuid4()}.jpg"
                dest = os.path.join(OUTPUT, new_name)

                shutil.copy2(src, dest)
                print(count)
                count += 1

print(f"\nDone! Total copied images: {count}")
print(f"Output folder: {OUTPUT}")

import os
import shutil
import uuid

input_root = r"" # Path to the folder containing nested folders with images.
output_folder = r"" # Path to the folder with uncropped whole images.

os.makedirs(output_folder, exist_ok=True)

count = 0
for root, dirs, files in os.walk(input_root):
    for filename in files:
        if filename.lower().endswith((".jpg", ".jpeg", ".png")):
            src_path = os.path.join(root, filename)

            new_name = f"{uuid.uuid4()}.jpg"
            dst_path = os.path.join(output_folder, new_name)

            shutil.copy2(src_path, dst_path)
            print(count)
            count += 1

print(f"Done! Moved {count} images into one folder with random names.")
print(f"Saved to: {output_folder}")

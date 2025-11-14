import os
import uuid

folder = r"" # Path to the folder with files to rename.

count = 0
for filename in os.listdir(folder):
    old_path = os.path.join(folder, filename)

    if not os.path.isfile(old_path):
        continue 

    ext = os.path.splitext(filename)[1]
    new_name = f"{uuid.uuid4()}{ext}"
    new_path = os.path.join(folder, new_name)

    os.rename(old_path, new_path)
    print(count)
    count += 1

print("Random rename complete!")

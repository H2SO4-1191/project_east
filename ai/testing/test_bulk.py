import os
from ultralytics import YOLO

# Load your model
model = YOLO(r"") # Path to where the 'best.pt' model of the latest train exists (check: './runs/classify/train/weights/best.pt')

folder = r"" # Path to where to folder with images exists.

valid_ext = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

for filename in os.listdir(folder):
    ext = os.path.splitext(filename)[1].lower()
    if ext not in valid_ext:
        continue  

    img_path = os.path.join(folder, filename)

    results = model(img_path, verbose=False)[0]

    probs = results.probs.data.tolist()
    doc_prob = probs[0] * 100
    nondoc_prob = probs[1] * 100

    print(f"\nFile: {filename}")
    print(f"   Document:     {doc_prob:.2f}%")
    print(f"   Non-Document: {nondoc_prob:.2f}%")

from ultralytics import YOLO

model = YOLO(r"") # Path to where the 'best.pt' model of the latest train exists (check: './runs/classify/train/weights/best.pt')

img = r"" # Path to an image to predict

results = model(img)
print(results)

import torch
from ultralytics import YOLO

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Training on: {device.upper()}.")

model = YOLO("./yolo/yolov8l-cls.pt") # Path to the yolo model.
dataset_path = r'./training_dataset' # Path to the training dataset.

model.train(
    data=dataset_path,
    epochs=40,
    imgsz=224,
    batch=32,
    augment=True,
    workers=0,
    device=0 if device == "cuda" else "cpu"
)

print('Training complete!')
import torch
from ultralytics import YOLO

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🔥 Training on: {device.upper()}")

model = YOLO(r"./runs/classify/train2/weights/best.pt") # Path to where the 'best.pt' model exitst (check: './runs/classify/train3/weights/best.pt')
dataset_path = r'./training_dataset' # Path to the training dataset.

model.train(
    data=dataset_path,
    epochs=10,                     
    imgsz=224,                     
    batch=32,                    
    augment=True,                 
    workers=0,                    
    lr0=0.0005, 
    device=0 if device == "cuda" else "cpu"
)

print("Finetune complete!")

import os
import torch
from ultralytics import YOLO
from PIL import Image

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODEL_PATH = os.path.join(BASE_DIR, "ai", "models", "document_classifier_v3.pt")
model = YOLO(MODEL_PATH)
device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)

def classify_document(image_file):
    img = Image.open(image_file).convert("RGB")
    results = model(img)

    probs = results[0].probs.data.tolist()  
    document = float(probs[0])
    nondocument = float(probs[1])

    return document, nondocument

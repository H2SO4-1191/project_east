import cv2
import numpy as np
import os
import uuid

input_folder = r"" # Path to the folder with uncropped whole images.
output_folder = r"" # Path where the final folder will be saved.
os.makedirs(output_folder, exist_ok=True)

def is_valid_card(contour):
    peri = cv2.arcLength(contour, True)
    approx = cv2.approxPolyDP(contour, 0.02 * peri, True)

    if len(approx) != 4:
        return False

    x, y, w, h = cv2.boundingRect(approx)

    if w < 200 or h < 150:
        return False

    aspect = w / h
    return 1.2 < aspect < 1.8

for filename in os.listdir(input_folder):
    if not filename.lower().endswith((".jpg", ".jpeg", ".png")):
        continue

    path = os.path.join(input_folder, filename)
    img = cv2.imread(path)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)

    edges = cv2.Canny(blur, 50, 150)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    card_contours = [c for c in contours if is_valid_card(c)]

    if not card_contours:
        print("No ID card detected:", filename)
        continue

    c = max(card_contours, key=cv2.contourArea)

    x, y, w, h = cv2.boundingRect(c)
    cropped = img[y:y+h, x:x+w]

    save_name = f"{uuid.uuid4()}.jpg"
    cv2.imwrite(os.path.join(output_folder, save_name), cropped)

print("Auto cropping done!")

import os
import shutil
import random
from pathlib import Path

ROOT = Path("documents_dataset") # Path to the folder of the whole dataset.
OUT_TRAIN = ROOT / "train"
OUT_VAL = ROOT / "val"

CLASSES = ["document", "nondocument"]
SPLIT_RATIO = 0.8

for cls in CLASSES:
    (OUT_TRAIN / cls).mkdir(parents=True, exist_ok=True)
    (OUT_VAL / cls).mkdir(parents=True, exist_ok=True)

for cls in CLASSES:
    src_dir = ROOT / cls
    files = [f for f in src_dir.iterdir() if f.is_file()]

    random.shuffle(files)

    split_idx = int(len(files) * SPLIT_RATIO)
    train_files = files[:split_idx]
    val_files = files[split_idx:]

    for f in train_files:
        print('.')
        shutil.copy2(f, OUT_TRAIN / cls / f.name)

    for f in val_files:
        print('-')
        shutil.copy2(f, OUT_VAL / cls / f.name)

    print(f"Class '{cls}': {len(train_files)} train, {len(val_files)} val")

print("\nDONE. Dataset is split and ready for training!")

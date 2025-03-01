import os
import cv2
import numpy as np
from barcode import Code128
from barcode.writer import ImageWriter
from tqdm import tqdm
import random

# Set paths
background_dir = "../data/backgrounds"
test_dir = "../data/images/test"

# Ensure directories exist
os.makedirs(test_dir, exist_ok=True)

def generate_barcode_data(length=10):
    """Generate a random barcode string."""
    return ''.join(random.choices("0123456789", k=length))

def create_barcode_image(barcode_data):
    """Generate barcode image using python-barcode."""
    barcode = Code128(barcode_data, writer=ImageWriter())
    filename = "temp_barcode"
    path = barcode.save(filename)
    
    barcode_img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    
    # Remove temp files
    if os.path.exists(path):
        os.remove(path)
    if os.path.exists(path + ".png"):
        os.remove(path + ".png")
    
    return barcode_img

def place_barcode_on_background(bg_img, barcode_img, x=None, y=None, scale=1.0, angle=0):
    """Place a barcode onto a background at a specific position, scale, and rotation."""
    h, w = bg_img.shape[:2]
    barcode_resized = cv2.resize(barcode_img, (int(barcode_img.shape[1] * scale), int(barcode_img.shape[0] * scale)))

    # Rotate barcode
    center = (barcode_resized.shape[1] // 2, barcode_resized.shape[0] // 2)
    rot_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    barcode_rotated = cv2.warpAffine(barcode_resized, rot_matrix, (barcode_resized.shape[1], barcode_resized.shape[0]), borderValue=(255,255,255))
    
    bh, bw = barcode_rotated.shape[:2]
    
    # Place barcode at a fixed or random position
    if x is None:
        x = random.randint(0, w - bw)
    if y is None:
        y = random.randint(0, h - bh)
    
    bg_img[y:y+bh, x:x+bw] = barcode_rotated
    return bg_img

def add_blur(img, ksize=5):
    """Add motion blur to simulate shaky camera or movement."""
    return cv2.GaussianBlur(img, (ksize, ksize), 0)

def change_brightness(img, factor=1.2):
    """Adjust brightness of the image."""
    return cv2.convertScaleAbs(img, alpha=factor, beta=0)

def generate_test_images():
    """Generate diverse test images for model evaluation."""
    backgrounds = [os.path.join(background_dir, f) for f in os.listdir(background_dir) if f.endswith(('.jpg', '.png'))]
    
    if not backgrounds:
        print("No backgrounds found! Please add images to '../data/backgrounds'")
        return
    
    test_conditions = [
        ("baseline", 1.0, 0, None, None),  # Normal barcode
        ("far_distance", 0.3, 0, None, None),  # Small barcode
        ("blurry", 1.0, 0, "blur", None),  # Blurred barcode
        ("rotated", 1.0, 30, None, None),  # Rotated barcode
        ("complex_bg", 1.0, 0, None, "complex"),  # Barcode in complex background
        ("low_light", 1.0, 0, "dark", None),  # Dark barcode
        ("multiple", 1.0, 0, "multi", None)  # Multiple barcodes
    ]
    
    print("Generating test images...")
    
    for name, scale, angle, effect, complexity in tqdm(test_conditions):
        bg_img = cv2.imread(random.choice(backgrounds))
        if bg_img is None:
            continue
        
        barcode_data = generate_barcode_data()
        barcode_img = create_barcode_image(barcode_data)
        
        if complexity == "multi":
            # Generate multiple barcodes
            for _ in range(3):
                barcode_data = generate_barcode_data()
                barcode_img = create_barcode_image(barcode_data)
                bg_img = place_barcode_on_background(bg_img, barcode_img, scale=0.6, angle=random.randint(-15, 15))
        else:
            bg_img = place_barcode_on_background(bg_img, barcode_img, scale=scale, angle=angle)
        
        if effect == "blur":
            bg_img = add_blur(bg_img)
        elif effect == "dark":
            bg_img = change_brightness(bg_img, 0.5)
        
        test_img_path = os.path.join(test_dir, f"test_{name}.jpg")
        cv2.imwrite(test_img_path, bg_img)
    
    print("Test image generation complete!")

if __name__ == "__main__":
    generate_test_images()

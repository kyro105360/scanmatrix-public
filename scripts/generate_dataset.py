import os
import random
import string
import cv2
import numpy as np
from barcode import Code128
from barcode.writer import ImageWriter
from tqdm import tqdm

# Set seeds for reproducibility (optional)
random.seed(42)
np.random.seed(42)

def generate_random_barcode_data(length=10):
    """Generate a random string of digits (or alphanumeric) for the barcode."""

    digits = string.digits  # or string.ascii_uppercase + string.digits for variety
    return ''.join(random.choice(digits) for _ in range(length))

def create_barcode_image(barcode_data):
    """
    Use python-barcode to create a barcode image in memory (as a numpy array).
    """
    # Generate a temp filename
    temp_filename = "temp_barcode"
    
    # Generate the barcode and save as PNG
    my_code = Code128(barcode_data, writer=ImageWriter())
    saved_path = my_code.save(temp_filename) 
    
    # Read it back as OpenCV image
    barcode_img = cv2.imread(saved_path, cv2.IMREAD_UNCHANGED)
    
    # Cleanup temp file
    if os.path.exists(saved_path):
        os.remove(saved_path)
    if os.path.exists(saved_path + ".png"):
        os.remove(saved_path + ".png")
    
    return barcode_img

def place_barcode_on_background(bg_img, barcode_img):
    """
    Place barcode_img onto bg_img at a random position, random scale, random rotation.
    Returns the new image and the bounding box [x1, y1, x2, y2] in pixel coords.
    """
    bh, bw = bg_img.shape[:2]
    # Resize the barcode to a random scale
    scale_factor = random.uniform(0.3, 1.0)  # scale from 30% to 100% of original
    new_w = int(barcode_img.shape[1] * scale_factor)
    new_h = int(barcode_img.shape[0] * scale_factor)
    barcode_resized = cv2.resize(barcode_img, (new_w, new_h), interpolation=cv2.INTER_AREA)
    
    # Optional: rotate the barcode randomly
    angle = random.uniform(-20, 20)  # rotate up to +/- 20 degrees
    center = (new_w // 2, new_h // 2)
    rot_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    barcode_rotated = cv2.warpAffine(barcode_resized, rot_matrix, (new_w, new_h), borderValue=(255,255,255))
    
    # Convert any transparent areas to white if needed (python-barcode typically black/white).
    
    # Choose a random top-left in the background so the entire barcode fits
    max_x = bw - new_w
    max_y = bh - new_h
    if max_x < 0 or max_y < 0:
        # If the barcode is bigger than background, just skip or reduce scale
        return bg_img, None
    
    x1 = random.randint(0, max_x)
    y1 = random.randint(0, max_y)
    x2 = x1 + new_w
    y2 = y1 + new_h
    
    # Place the barcode on the background
    # If barcode is strictly black/white, we can just overwrite that region
    # or do alpha blending if we had alpha channel.
    new_img = bg_img.copy()
    new_img[y1:y2, x1:x2] = barcode_rotated
    
    return new_img, (x1, y1, x2, y2)

def apply_distortions(img):
    """
    Apply random distortions: blur, brightness, etc.
    """

    # Random blur
    if random.random() < 0.5:
        ksize = random.choice([3, 5])
        img = cv2.GaussianBlur(img, (ksize, ksize), 0)
    # Random brightness
    alpha = random.uniform(0.8, 1.2)  # brightness scale
    img = cv2.convertScaleAbs(img, alpha=alpha, beta=0)
    
    return img

def yolo_format(box, img_w, img_h):
    """
    Convert [x1, y1, x2, y2] in pixel coords to YOLO format [class, x_center, y_center, w, h].
    All values normalized (0 to 1).
    """
    x1, y1, x2, y2 = box
    bw = x2 - x1
    bh = y2 - y1
    x_center = x1 + bw / 2
    y_center = y1 + bh / 2
    # Normalize
    x_center_norm = x_center / img_w
    y_center_norm = y_center / img_h
    w_norm = bw / img_w
    h_norm = bh / img_h
    return f"0 {x_center_norm:.6f} {y_center_norm:.6f} {w_norm:.6f} {h_norm:.6f}"

def main():
    # Where backgrounds are stored
    background_dir = "../data/backgrounds"  
    train_dir = "../data/images/train"
    val_dir = "../data/images/val"
    train_label_dir = "../data/labels/train"
    val_label_dir = "../data/labels/val"
    
    os.makedirs(train_dir, exist_ok=True)
    os.makedirs(val_dir, exist_ok=True)
    os.makedirs(train_label_dir, exist_ok=True)
    os.makedirs(val_label_dir, exist_ok=True)
    
    # Collect all background images
    background_files = [os.path.join(background_dir, f) for f in os.listdir(background_dir)
                        if f.lower().endswith(('.jpg', '.png', '.jpeg'))]
    if not background_files:
        print("No background images found. Please add some to data/backgrounds/")
        return
    
    # How many total images to generate
    num_train = 50
    num_val = 10
    
    # Generate training images
    print("Generating training images...")
    for i in tqdm(range(num_train)):
        bg_path = random.choice(background_files)
        bg_img = cv2.imread(bg_path)
        if bg_img is None:
            continue
        
        # 1) Generate random barcode data
        barcode_data = generate_random_barcode_data(length=10)
        # 2) Create barcode image
        barcode_img = create_barcode_image(barcode_data)
        if barcode_img is None:
            continue
        
        # 3) Place the barcode on background
        new_img, box = place_barcode_on_background(bg_img, barcode_img)
        if box is None:
            continue
        
        # 4) Apply distortions
        new_img = apply_distortions(new_img)
        
        # 5) Save image + label
        img_name = f"train_{i}.jpg"
        save_path = os.path.join(train_dir, img_name)
        cv2.imwrite(save_path, new_img)
        
        # 6) Create YOLO label
        h, w = new_img.shape[:2]
        label_str = yolo_format(box, w, h)
        
        label_path = os.path.join(train_label_dir, f"train_{i}.txt")
        with open(label_path, "w") as f:
            f.write(label_str + "\n")
    
    # Generate validation images
    print("Generating validation images...")
    for i in tqdm(range(num_val)):
        bg_path = random.choice(background_files)
        bg_img = cv2.imread(bg_path)
        if bg_img is None:
            continue
        
        barcode_data = generate_random_barcode_data(length=10)
        barcode_img = create_barcode_image(barcode_data)
        if barcode_img is None:
            continue
        
        new_img, box = place_barcode_on_background(bg_img, barcode_img)
        if box is None:
            continue
        
        new_img = apply_distortions(new_img)
        
        img_name = f"val_{i}.jpg"
        save_path = os.path.join(val_dir, img_name)
        cv2.imwrite(save_path, new_img)
        
        h, w = new_img.shape[:2]
        label_str = yolo_format(box, w, h)
        
        label_path = os.path.join(val_label_dir, f"val_{i}.txt")
        with open(label_path, "w") as f:
            f.write(label_str + "\n")
    
    print("Synthetic barcode dataset generation complete!")

if __name__ == "__main__":
    main()

import os
from ultralytics import YOLO
import cv2
from pyzbar.pyzbar import decode

# Define paths
PROJECT_DIR = "/Users/reyaantrimizi/miniconda3/envs/barcode-env/synthetic_barcode_project"
MODEL_PATH = os.path.join(PROJECT_DIR, "runs/detect/train3/weights/best.pt")
TEST_IMAGE_DIR = os.path.join(PROJECT_DIR, "data/images/test")
OUTPUT_CROP_DIR = os.path.join(PROJECT_DIR, "data/images/test_crops") 

# Create output directory 
os.makedirs(OUTPUT_CROP_DIR, exist_ok=True)

def decode_barcode_from_crop(crop, image_name, index):
    """ Decodes barcodes from cropped barcode images """
    barcodes = decode(crop)
    if barcodes:
        for barcode in barcodes:
            data = barcode.data.decode("utf-8")
            print(f"Decoded Barcode from {image_name} (Region {index}): {data}")
    else:
        print(f"No barcode detected in {image_name} (Region {index})")


def run_inference_and_decode(model_path, test_folder):
    """ Runs YOLOv8 inference on all test images and decodes barcodes from detections """
    

    # Load YOLO model
    model = YOLO(model_path)
    
    # List all images in the test folder
    test_images = [f for f in os.listdir(test_folder) if f.lower().endswith(('.jpg', '.png', '.jpeg'))]
    
    for img_name in test_images:
        img_path = os.path.join(test_folder, img_name)
        print(f"\nProcessing {img_name} ...")
        
        # Run inference on the image
        results = model.predict(source=img_path, conf=0.25)
        
        # Read the original image using OpenCV
        original_img = cv2.imread(img_path)
        
        if original_img is None:
            print(f"Error: Unable to read {img_name}")
            continue

        # Process each detection in the image
        for idx, result in enumerate(results):
            for i, box in enumerate(result.boxes):
                # Get bounding box coordinates
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                
                # Crop the barcode region
                crop = original_img[y1:y2, x1:x2]
                
                # Save the crop for debugging
                crop_path = os.path.join(OUTPUT_CROP_DIR, f"{img_name}_crop_{i}.jpg")
                cv2.imwrite(crop_path, crop)

                # Decode barcode from the cropped image
                decode_barcode_from_crop(crop, img_name, i)

if __name__ == "__main__":
    run_inference_and_decode(MODEL_PATH, TEST_IMAGE_DIR)

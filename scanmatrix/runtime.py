from pathlib import Path

from .decode_pipeline import Detection


class UltralyticsDetector:
    def __init__(self, model_path):
        from ultralytics import YOLO

        self.model = YOLO(str(model_path))

    def detect(self, image_path, conf=0.25):
        results = self.model.predict(source=str(image_path), conf=conf)
        detections = []
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                confidence = float(box.conf[0]) if hasattr(box, "conf") else conf
                detections.append(Detection(bbox=(x1, y1, x2, y2), confidence=confidence))
        return detections


class Cv2ImageIO:
    def read(self, image_path):
        import cv2

        return cv2.imread(str(image_path))

    def crop(self, image, bbox):
        x1, y1, x2, y2 = bbox
        return image[y1:y2, x1:x2]

    def write_crop(self, crop_path, crop):
        import cv2

        crop_path = Path(crop_path)
        crop_path.parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(crop_path), crop)


class PyzbarDecoder:
    def decode(self, crop):
        from pyzbar.pyzbar import decode

        return [barcode.data.decode("utf-8") for barcode in decode(crop)]

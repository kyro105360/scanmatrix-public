import json
from dataclasses import asdict, dataclass, field
from pathlib import Path

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


@dataclass(frozen=True)
class Detection:
    bbox: tuple[int, int, int, int]
    confidence: float


@dataclass
class DetectionReport:
    index: int
    bbox: tuple[int, int, int, int]
    confidence: float
    crop_path: str | None
    decoded_values: list[str]


@dataclass
class ImageReport:
    image_name: str
    detections: list[DetectionReport] = field(default_factory=list)
    read_error: str | None = None


@dataclass
class PipelineReport:
    images: list[ImageReport]

    def to_dict(self):
        return {"images": [asdict(image_report) for image_report in self.images]}

    def write_json(self, report_path: Path):
        report_path = Path(report_path)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(self.to_dict(), indent=2), encoding="utf-8")


def iter_image_paths(image_dir: Path):
    image_dir = Path(image_dir)
    return sorted(path for path in image_dir.iterdir() if path.suffix.lower() in IMAGE_EXTENSIONS)


def run_directory(image_dir, detector, image_io, decoder, output_crop_dir, conf=0.25):
    output_crop_dir = Path(output_crop_dir)
    output_crop_dir.mkdir(parents=True, exist_ok=True)

    reports = []
    for image_path in iter_image_paths(image_dir):
        image = image_io.read(image_path)
        if image is None:
            reports.append(ImageReport(image_name=image_path.name, read_error="Unable to read image"))
            continue

        detections = detector.detect(image_path, conf=conf)
        image_report = ImageReport(image_name=image_path.name)

        for index, detection in enumerate(detections):
            crop = image_io.crop(image, detection.bbox)
            crop_path = output_crop_dir / f"{image_path.name}_crop_{index}.jpg"
            image_io.write_crop(crop_path, crop)
            decoded_values = decoder.decode(crop)
            image_report.detections.append(
                DetectionReport(
                    index=index,
                    bbox=detection.bbox,
                    confidence=detection.confidence,
                    crop_path=str(crop_path),
                    decoded_values=decoded_values,
                )
            )

        reports.append(image_report)

    return PipelineReport(images=reports)

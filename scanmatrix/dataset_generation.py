import json
import random
import string
import uuid
from dataclasses import asdict, dataclass
from pathlib import Path


@dataclass(frozen=True)
class DatasetConfig:
    root: Path
    background_dir: Path
    train_dir: Path
    val_dir: Path
    train_label_dir: Path
    val_label_dir: Path
    manifest_path: Path
    train_count: int
    val_count: int
    seed: int
    barcode_length: int = 10


@dataclass(frozen=True)
class SamplePlan:
    split: str
    image_name: str
    label_name: str
    barcode_data: str


def create_default_config(root: Path, train_count=50, val_count=10, seed=42, barcode_length=10):
    root = Path(root).resolve()
    data_root = root / "data"
    return DatasetConfig(
        root=root,
        background_dir=data_root / "backgrounds",
        train_dir=data_root / "images" / "train",
        val_dir=data_root / "images" / "val",
        train_label_dir=data_root / "labels" / "train",
        val_label_dir=data_root / "labels" / "val",
        manifest_path=data_root / "dataset_manifest.json",
        train_count=train_count,
        val_count=val_count,
        seed=seed,
        barcode_length=barcode_length,
    )


def generate_random_barcode_data(rng: random.Random, length=10):
    return "".join(rng.choice(string.digits) for _ in range(length))


def build_generation_plan(config: DatasetConfig):
    rng = random.Random(config.seed)
    plan = []

    for split, count in (("train", config.train_count), ("val", config.val_count)):
        for index in range(count):
            barcode_data = generate_random_barcode_data(rng, config.barcode_length)
            prefix = f"{split}_{index}"
            plan.append(
                SamplePlan(
                    split=split,
                    image_name=f"{prefix}.jpg",
                    label_name=f"{prefix}.txt",
                    barcode_data=barcode_data,
                )
            )

    return plan


def yolo_format(box, img_w, img_h):
    x1, y1, x2, y2 = box
    box_w = x2 - x1
    box_h = y2 - y1
    x_center = x1 + box_w / 2
    y_center = y1 + box_h / 2

    return f"0 {x_center / img_w:.6f} {y_center / img_h:.6f} {box_w / img_w:.6f} {box_h / img_h:.6f}"


def write_manifest(manifest_path: Path, payload):
    manifest_path = Path(manifest_path)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def create_barcode_image(barcode_data, temp_dir: Path):
    from barcode import Code128
    from barcode.writer import ImageWriter
    import cv2

    temp_dir.mkdir(parents=True, exist_ok=True)
    filename = temp_dir / f"barcode-{uuid.uuid4().hex}"
    barcode = Code128(barcode_data, writer=ImageWriter())
    saved_path = Path(barcode.save(str(filename)))
    barcode_image = cv2.imread(str(saved_path), cv2.IMREAD_UNCHANGED)
    saved_path.unlink(missing_ok=True)
    png_path = saved_path.with_suffix(".png")
    png_path.unlink(missing_ok=True)
    return barcode_image


def place_barcode_on_background(rng: random.Random, background_image, barcode_image):
    import cv2

    bg_h, bg_w = background_image.shape[:2]
    scale_factor = rng.uniform(0.3, 1.0)
    new_w = int(barcode_image.shape[1] * scale_factor)
    new_h = int(barcode_image.shape[0] * scale_factor)
    resized = cv2.resize(barcode_image, (new_w, new_h), interpolation=cv2.INTER_AREA)

    angle = rng.uniform(-20, 20)
    center = (new_w // 2, new_h // 2)
    rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(resized, rotation_matrix, (new_w, new_h), borderValue=(255, 255, 255))

    max_x = bg_w - new_w
    max_y = bg_h - new_h
    if max_x < 0 or max_y < 0:
        return background_image, None

    x1 = rng.randint(0, max_x)
    y1 = rng.randint(0, max_y)
    x2 = x1 + new_w
    y2 = y1 + new_h

    composed = background_image.copy()
    composed[y1:y2, x1:x2] = rotated
    return composed, (x1, y1, x2, y2)


def apply_distortions(rng: random.Random, image):
    import cv2

    if rng.random() < 0.5:
        kernel_size = rng.choice([3, 5])
        image = cv2.GaussianBlur(image, (kernel_size, kernel_size), 0)

    alpha = rng.uniform(0.8, 1.2)
    return cv2.convertScaleAbs(image, alpha=alpha, beta=0)


def _directories_for_split(config: DatasetConfig, split: str):
    if split == "train":
        return config.train_dir, config.train_label_dir

    return config.val_dir, config.val_label_dir


def generate_dataset(config: DatasetConfig):
    import cv2

    rng = random.Random(config.seed)
    plan = build_generation_plan(config)

    backgrounds = sorted(
        path for path in config.background_dir.iterdir() if path.suffix.lower() in {".jpg", ".jpeg", ".png"}
    )
    if not backgrounds:
        raise RuntimeError(f"No background images found in {config.background_dir}")

    for directory in (config.train_dir, config.val_dir, config.train_label_dir, config.val_label_dir):
        directory.mkdir(parents=True, exist_ok=True)

    manifest_entries = []
    temp_barcode_dir = config.root / ".barcode-temp"

    for sample in plan:
        output_dir, label_dir = _directories_for_split(config, sample.split)
        background_path = rng.choice(backgrounds)
        background_image = cv2.imread(str(background_path))
        if background_image is None:
            continue

        barcode_image = create_barcode_image(sample.barcode_data, temp_barcode_dir)
        if barcode_image is None:
            continue

        composed_image, box = place_barcode_on_background(rng, background_image, barcode_image)
        if box is None:
            continue

        composed_image = apply_distortions(rng, composed_image)
        image_path = output_dir / sample.image_name
        label_path = label_dir / sample.label_name

        cv2.imwrite(str(image_path), composed_image)
        label_path.write_text(yolo_format(box, composed_image.shape[1], composed_image.shape[0]) + "\n", encoding="utf-8")

        manifest_entries.append(
            {
                **asdict(sample),
                "background": background_path.name,
                "image_path": str(image_path.relative_to(config.root)),
                "label_path": str(label_path.relative_to(config.root)),
                "bbox": list(box),
            }
        )

    if temp_barcode_dir.exists():
        for path in temp_barcode_dir.iterdir():
            path.unlink(missing_ok=True)
        temp_barcode_dir.rmdir()

    manifest = {
        "seed": config.seed,
        "train_count": config.train_count,
        "val_count": config.val_count,
        "barcode_length": config.barcode_length,
        "samples": manifest_entries,
    }
    write_manifest(config.manifest_path, manifest)
    return manifest

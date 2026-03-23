from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class ProjectPaths:
    root: Path
    model_path: Path
    test_image_dir: Path
    output_crop_dir: Path
    report_path: Path

    @classmethod
    def from_root(cls, root: Path):
        root = Path(root).resolve()
        return cls(
            root=root,
            model_path=root / "weights" / "saved_model.pt",
            test_image_dir=root / "data" / "images" / "test",
            output_crop_dir=root / "data" / "images" / "test_crops",
            report_path=root / "results" / "decode_report.json",
        )

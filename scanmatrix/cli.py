import argparse
from pathlib import Path

from .decode_pipeline import run_directory
from .paths import ProjectPaths
from .runtime import Cv2ImageIO, PyzbarDecoder, UltralyticsDetector


def build_parser():
    parser = argparse.ArgumentParser(description="Run ScanMatrix barcode detection and decode inference.")
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1], help="Project root directory.")
    parser.add_argument("--model-path", type=Path, help="Override the detector model path.")
    parser.add_argument("--input-dir", type=Path, help="Override the directory of input test images.")
    parser.add_argument("--output-crop-dir", type=Path, help="Override where cropped detections are written.")
    parser.add_argument("--report-path", type=Path, help="Override the JSON report output path.")
    parser.add_argument("--conf", type=float, default=0.25, help="Detection confidence threshold.")
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    paths = ProjectPaths.from_root(args.root)

    model_path = args.model_path or paths.model_path
    input_dir = args.input_dir or paths.test_image_dir
    output_crop_dir = args.output_crop_dir or paths.output_crop_dir
    report_path = args.report_path or paths.report_path

    try:
        report = run_directory(
            image_dir=input_dir,
            detector=UltralyticsDetector(model_path),
            image_io=Cv2ImageIO(),
            decoder=PyzbarDecoder(),
            output_crop_dir=output_crop_dir,
            conf=args.conf,
        )
    except ModuleNotFoundError as exc:
        raise SystemExit(
            f"Missing runtime dependency '{exc.name}'. Install requirements.txt before running inference."
        ) from exc

    report.write_json(report_path)

    print(f"Processed {len(report.images)} images from {input_dir}")
    print(f"Saved crops to {output_crop_dir}")
    print(f"Wrote JSON report to {report_path}")


if __name__ == "__main__":
    main()

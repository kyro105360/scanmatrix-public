import json
import sys
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scanmatrix.cli import build_parser, main
from scanmatrix.decode_pipeline import Detection, DetectionReport, ImageReport, PipelineReport, iter_image_paths, run_directory
from scanmatrix.paths import ProjectPaths


class FakeDetector:
    def detect(self, image_path, conf=0.25):
        return [Detection(bbox=(1, 2, 6, 8), confidence=conf)]


class FakeImageIO:
    def __init__(self):
        self.written_crops = []

    def read(self, image_path):
        return {"image": image_path.name}

    def crop(self, image, bbox):
        return {"image": image["image"], "bbox": bbox}

    def write_crop(self, crop_path, crop):
        self.written_crops.append((Path(crop_path), crop))


class FakeDecoder:
    def decode(self, crop):
        return [f"decoded:{crop['image']}:{crop['bbox'][0]}"]


class DecodePipelineTests(unittest.TestCase):
    def test_project_paths_use_repo_relative_defaults(self):
        temp_dir = Path("C:/scanmatrix")

        paths = ProjectPaths.from_root(temp_dir)

        self.assertEqual(paths.model_path, temp_dir.resolve() / "weights" / "saved_model.pt")
        self.assertEqual(paths.test_image_dir, temp_dir.resolve() / "data" / "images" / "test")
        self.assertEqual(paths.output_crop_dir, temp_dir.resolve() / "data" / "images" / "test_crops")
        self.assertEqual(paths.report_path, temp_dir.resolve() / "results" / "decode_report.json")

    def test_iter_image_paths_filters_and_sorts_supported_images(self):
        temp_dir = Path("C:/dataset")
        children = [temp_dir / "zeta.jpg", temp_dir / "alpha.png", temp_dir / "notes.txt"]

        with mock.patch.object(Path, "iterdir", return_value=children):
            images = iter_image_paths(temp_dir)

        self.assertEqual([path.name for path in images], ["alpha.png", "zeta.jpg"])

    def test_run_directory_builds_a_machine_readable_report(self):
        image_dir = Path("C:/scanmatrix/data/images/test")
        output_crop_dir = Path("C:/scanmatrix/data/images/test_crops")
        image_io = FakeImageIO()

        with mock.patch("scanmatrix.decode_pipeline.iter_image_paths", return_value=[image_dir / "sample.jpg"]):
            with mock.patch.object(Path, "mkdir") as mkdir:
                report = run_directory(
                    image_dir=image_dir,
                    detector=FakeDetector(),
                    image_io=image_io,
                    decoder=FakeDecoder(),
                    output_crop_dir=output_crop_dir,
                    conf=0.42,
                )

        self.assertEqual(len(report.images), 1)
        self.assertEqual(report.images[0].detections[0].confidence, 0.42)
        self.assertEqual(report.images[0].detections[0].decoded_values, ["decoded:sample.jpg:1"])
        self.assertEqual(image_io.written_crops[0][0].name, "sample.jpg_crop_0.jpg")
        mkdir.assert_called_once()

    def test_pipeline_report_write_json_serializes_to_disk_path(self):
        report = PipelineReport(
            images=[
                ImageReport(
                    image_name="sample.jpg",
                    detections=[
                        DetectionReport(
                            index=0,
                            bbox=(1, 2, 6, 8),
                            confidence=0.33,
                            crop_path="data/images/test_crops/sample.jpg_crop_0.jpg",
                            decoded_values=["decoded:sample.jpg:1"],
                        )
                    ],
                )
            ]
        )

        with mock.patch.object(Path, "mkdir") as mkdir:
            with mock.patch.object(Path, "write_text") as write_text:
                report.write_json(Path("C:/scanmatrix/results/decode_report.json"))

        mkdir.assert_called_once()
        payload = json.loads(write_text.call_args.args[0])
        self.assertEqual(payload["images"][0]["image_name"], "sample.jpg")

    def test_main_uses_runtime_dependencies_and_writes_json_report(self):
        fake_report = mock.Mock()
        fake_report.images = [mock.Mock()]

        with mock.patch("scanmatrix.cli.UltralyticsDetector", return_value=FakeDetector()) as detector_cls:
            with mock.patch("scanmatrix.cli.Cv2ImageIO", return_value=FakeImageIO()) as image_io_cls:
                with mock.patch("scanmatrix.cli.PyzbarDecoder", return_value=FakeDecoder()) as decoder_cls:
                    with mock.patch("scanmatrix.cli.run_directory", return_value=fake_report) as run_directory_mock:
                        main(
                            [
                                "--root",
                                "C:/scanmatrix",
                                "--input-dir",
                                "C:/scanmatrix/data/images/test",
                                "--output-crop-dir",
                                "C:/scanmatrix/data/images/test_crops",
                                "--report-path",
                                "C:/scanmatrix/results/decode_report.json",
                                "--conf",
                                "0.33",
                            ]
                        )

        detector_cls.assert_called_once()
        image_io_cls.assert_called_once()
        decoder_cls.assert_called_once()
        run_directory_mock.assert_called_once()
        fake_report.write_json.assert_called_once_with(Path("C:/scanmatrix/results/decode_report.json"))

    def test_build_parser_accepts_root_override(self):
        args = build_parser().parse_args(["--root", "."])

        self.assertEqual(args.root, Path("."))


if __name__ == "__main__":
    unittest.main()

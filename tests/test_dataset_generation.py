import json
import sys
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scanmatrix.dataset_generation import build_generation_plan, create_default_config, write_manifest, yolo_format
from scanmatrix.generate_dataset_cli import build_parser, main


class DatasetGenerationTests(unittest.TestCase):
    def test_default_config_uses_repo_relative_paths(self):
        config = create_default_config(Path("C:/scanmatrix"), train_count=12, val_count=4, seed=7)

        self.assertEqual(config.train_dir, Path("C:/scanmatrix").resolve() / "data" / "images" / "train")
        self.assertEqual(config.val_label_dir, Path("C:/scanmatrix").resolve() / "data" / "labels" / "val")
        self.assertEqual(config.manifest_path, Path("C:/scanmatrix").resolve() / "data" / "dataset_manifest.json")
        self.assertEqual(config.seed, 7)

    def test_generation_plan_is_deterministic_for_a_seed(self):
        config = create_default_config(Path("C:/scanmatrix"), train_count=2, val_count=1, seed=99)

        first = build_generation_plan(config)
        second = build_generation_plan(config)

        self.assertEqual(first, second)
        self.assertEqual(first[0].image_name, "train_0.jpg")
        self.assertEqual(first[-1].label_name, "val_0.txt")

    def test_yolo_format_normalizes_bbox_coordinates(self):
        label = yolo_format((10, 20, 30, 60), img_w=100, img_h=200)

        self.assertEqual(label, "0 0.200000 0.200000 0.200000 0.200000")

    def test_write_manifest_serializes_json_payload(self):
        manifest_path = Path("C:/scanmatrix/data/dataset_manifest.json")

        with mock.patch.object(Path, "mkdir") as mkdir:
            with mock.patch.object(Path, "write_text") as write_text:
                write_manifest(manifest_path, {"seed": 42, "samples": []})

        mkdir.assert_called_once()
        payload = json.loads(write_text.call_args.args[0])
        self.assertEqual(payload["seed"], 42)

    def test_parser_accepts_reproducibility_flags(self):
        args = build_parser().parse_args(["--seed", "15", "--train-count", "5", "--val-count", "2", "--dry-run"])

        self.assertEqual(args.seed, 15)
        self.assertEqual(args.train_count, 5)
        self.assertEqual(args.val_count, 2)
        self.assertTrue(args.dry_run)

    def test_main_dry_run_writes_planned_manifest_without_generating_images(self):
        with mock.patch("scanmatrix.generate_dataset_cli.write_manifest") as write_manifest_mock:
            with mock.patch("scanmatrix.generate_dataset_cli.generate_dataset") as generate_dataset_mock:
                main(
                    [
                        "--root",
                        "C:/scanmatrix",
                        "--train-count",
                        "2",
                        "--val-count",
                        "1",
                        "--seed",
                        "11",
                        "--dry-run",
                    ]
                )

        generate_dataset_mock.assert_not_called()
        payload = write_manifest_mock.call_args.args[1]
        self.assertEqual(payload["seed"], 11)
        self.assertEqual(len(payload["samples"]), 3)


if __name__ == "__main__":
    unittest.main()

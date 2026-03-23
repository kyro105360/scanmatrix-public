import argparse
from pathlib import Path

from .dataset_generation import build_generation_plan, create_default_config, generate_dataset, write_manifest


def build_parser():
    parser = argparse.ArgumentParser(description="Generate a reproducible synthetic barcode dataset.")
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1], help="Project root directory.")
    parser.add_argument("--train-count", type=int, default=50, help="Number of training images to generate.")
    parser.add_argument("--val-count", type=int, default=10, help="Number of validation images to generate.")
    parser.add_argument("--seed", type=int, default=42, help="Seed used for deterministic barcode generation and placement.")
    parser.add_argument("--barcode-length", type=int, default=10, help="Length of the generated barcode payload.")
    parser.add_argument("--manifest-path", type=Path, help="Override where the manifest JSON is written.")
    parser.add_argument("--dry-run", action="store_true", help="Write the planned sample manifest without generating image files.")
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    config = create_default_config(
        root=args.root,
        train_count=args.train_count,
        val_count=args.val_count,
        seed=args.seed,
        barcode_length=args.barcode_length,
    )

    manifest_path = args.manifest_path or config.manifest_path
    if args.dry_run:
        payload = {
            "seed": config.seed,
            "train_count": config.train_count,
            "val_count": config.val_count,
            "barcode_length": config.barcode_length,
            "samples": [sample.__dict__ for sample in build_generation_plan(config)],
        }
        write_manifest(manifest_path, payload)
        print(f"Wrote dry-run sample plan to {manifest_path}")
        return

    manifest = generate_dataset(config)
    if manifest_path != config.manifest_path:
        write_manifest(manifest_path, manifest)

    print(f"Generated {len(manifest['samples'])} samples with seed {config.seed}")
    print(f"Manifest available at {manifest_path}")


if __name__ == "__main__":
    main()

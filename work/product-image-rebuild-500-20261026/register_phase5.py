"""Chuyển output ImageGen của giai đoạn 5 thành WebP theo index tuần tự."""

from __future__ import annotations

import hashlib
import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / "work" / "product-image-rebuild-500-20261026"
TARGET_DIR = ROOT / "public" / "products" / "ai-generated-500"
ORIGINAL_DIR = WORK / "generated-originals" / "phase-5"


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def digest(path: Path) -> str:
    sha = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            sha.update(chunk)
    return sha.hexdigest()


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: register_phase5.py INDEX SOURCE_PNG", file=sys.stderr)
        return 2
    index = int(sys.argv[1])
    source = Path(sys.argv[2]).resolve()
    items = read_json(WORK / "phase-5-items.json")["items"]
    item = next((value for value in items if int(value["index"]) == index), None)
    if item is None:
        raise ValueError(f"Index {index} không thuộc giai đoạn 5")
    if not 477 <= index <= 500:
        raise ValueError("Chỉ cho phép index 477-500")
    if not source.is_file():
        raise FileNotFoundError(source)

    ORIGINAL_DIR.mkdir(parents=True, exist_ok=True)
    TARGET_DIR.mkdir(parents=True, exist_ok=True)
    original = ORIGINAL_DIR / f"{index:04d}-{item['id']}.png"
    target = TARGET_DIR / item["targetName"]
    if source != original.resolve():
        shutil.copy2(source, original)
    with Image.open(original) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        image.save(target, "WEBP", quality=88, method=6)
    with Image.open(target) as image:
        width, height = image.size

    progress_path = WORK / "progress.json"
    progress = read_json(progress_path)
    record = {
        "index": index,
        "id": item["id"],
        "target": f"/products/ai-generated-500/{target.name}",
        "source": str(original.relative_to(ROOT)).replace("\\", "/"),
        "sha256": digest(target),
        "bytes": target.stat().st_size,
        "width": width,
        "height": height,
        "completedAt": datetime.now(timezone.utc).isoformat(),
    }
    progress["generatedInThisTurn"] = [value for value in progress.get("generatedInThisTurn", []) if int(value["index"]) != index]
    progress["generatedInThisTurn"].append(record)
    progress["generatedInThisTurn"].sort(key=lambda value: int(value["index"]))
    generated_count = len(progress["generatedInThisTurn"])
    progress["phases"][-1]["generatedNow"] = generated_count
    progress["phases"][-1]["remaining"] = 24 - generated_count
    progress["lastUpdatedAt"] = record["completedAt"]
    write_json(progress_path, progress)
    print(json.dumps(record, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

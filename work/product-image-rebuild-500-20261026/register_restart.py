"""Đóng gói từng output ImageGen mới vào thư mục 500 ảnh."""

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
ORIGINAL_DIR = WORK / "generated-originals" / "restart"


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def dump(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def digest(path: Path) -> str:
    sha = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            sha.update(chunk)
    return sha.hexdigest()


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: register_restart.py INDEX SOURCE_PNG", file=sys.stderr)
        return 2
    index = int(sys.argv[1])
    source = Path(sys.argv[2]).resolve()
    if not 11 <= index <= 500:
        raise ValueError("Index must be 11..500")
    if not source.is_file():
        raise FileNotFoundError(source)
    items = load(WORK / "restart-items.json")["items"]
    item = next(value for value in items if int(value["index"]) == index)
    ORIGINAL_DIR.mkdir(parents=True, exist_ok=True)
    TARGET_DIR.mkdir(parents=True, exist_ok=True)
    original = ORIGINAL_DIR / f"{index:04d}-{item['id']}.png"
    target = TARGET_DIR / item["targetName"]
    shutil.copy2(source, original)
    with Image.open(original) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        image.save(target, "WEBP", quality=88, method=6)
    with Image.open(target) as image:
        width, height = image.size

    path = WORK / "restart-progress.json"
    progress = load(path)
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
    progress["generatedThisRestart"] = [value for value in progress.get("generatedThisRestart", []) if int(value["index"]) != index]
    progress["generatedThisRestart"].append(record)
    progress["generatedThisRestart"].sort(key=lambda value: int(value["index"]))
    count = len(progress["generatedThisRestart"])
    for phase in progress["phases"]:
        start, end = phase["range"]
        done = sum(1 for value in progress["generatedThisRestart"] if start <= int(value["index"]) <= end)
        accepted = 10 if start == 1 else 0
        phase["generated"] = done + accepted
        phase["remaining"] = (end - start + 1) - phase["generated"]
    progress["lastUpdatedAt"] = record["completedAt"]
    dump(path, progress)
    print(json.dumps(record, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

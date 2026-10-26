"""Kiểm tra ảnh tiếp nối trước khi chạm vào manifest dùng chung."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / "work" / "product-image-rebuild-20261026"


def expected_size(item: dict) -> tuple[int, int]:
    ratio = item.get("ratio", "landscape")
    if ratio == "portrait":
        return 1024, 1536
    if ratio == "square":
        return 1200, 1200
    if ratio == "tall":
        return 1080, 1440
    return 1536, 1024


def main() -> int:
    items = json.loads((WORK / "items.json").read_text(encoding="utf-8"))["items"]
    progress = json.loads((WORK / "progress.json").read_text(encoding="utf-8"))
    records = {int(value["index"]): value for value in progress.get("generated", [])}
    failures = []
    for item in items:
        index = int(item["index"])
        target = ROOT / "public" / item["target"].lstrip("/")
        record = records.get(index)
        if record is None:
            failures.append(f"{index}: missing progress record")
            continue
        if not target.is_file():
            failures.append(f"{index}: missing target {target}")
            continue
        try:
            with Image.open(target) as image:
                dimensions = image.size
                image.verify()
        except Exception as error:  # pragma: no cover - diagnostic branch
            failures.append(f"{index}: unreadable image: {error}")
            continue
        if target.suffix.lower() != ".webp":
            failures.append(f"{index}: target is not WebP")
        if dimensions != expected_size(item):
            failures.append(f"{index}: expected {expected_size(item)}, got {dimensions}")
        if target.stat().st_size < 10_000:
            failures.append(f"{index}: target is suspiciously small")

    if failures:
        print(json.dumps({"ok": False, "checked": len(items), "errors": failures[:20], "errorCount": len(failures)}, ensure_ascii=False))
        return 1
    print(json.dumps({"ok": True, "checked": len(items), "generated": len(records), "failedRecords": len(progress.get("failed", []))}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

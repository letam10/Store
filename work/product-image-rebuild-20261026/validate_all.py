"""Kiểm tra đủ 1.000 ảnh trước khi cập nhật manifest."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / "work" / "product-image-rebuild-20261026"
OLD_WORK = ROOT / "work" / "product-image-rebuild-20261025"


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
    items = json.loads((OLD_WORK / "products.json").read_text(encoding="utf-8"))["items"]
    errors: list[str] = []
    targets = set()
    for item in items:
        target = str(item["target"])
        if target in targets:
            errors.append(f"duplicate target: {target}")
        targets.add(target)
        path = ROOT / "public" / target.lstrip("/")
        if not path.is_file():
            errors.append(f"missing: {target}")
            continue
        try:
            with Image.open(path) as image:
                dimensions = image.size
                image.verify()
        except Exception as error:  # pragma: no cover - diagnostic branch
            errors.append(f"unreadable {target}: {error}")
            continue
        if path.suffix.lower() != ".webp":
            errors.append(f"not WebP: {target}")
        if dimensions != expected_size(item):
            errors.append(f"wrong size {target}: expected {expected_size(item)}, got {dimensions}")
        if path.stat().st_size < 10_000:
            errors.append(f"suspiciously small: {target}")

    generated_count = len(list((ROOT / "public" / "products" / "ai-generated").glob("*.webp")))
    if generated_count != 1000:
        errors.append(f"ai-generated count is {generated_count}, expected 1000")
    if errors:
        print(json.dumps({"ok": False, "checked": len(items), "errors": errors[:20], "errorCount": len(errors)}, ensure_ascii=False))
        return 1
    print(json.dumps({"ok": True, "checked": len(items), "targets": len(targets), "aiGeneratedFiles": generated_count}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

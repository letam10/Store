"""Render lại lớp chữ cho đủ 1.000 ảnh, không gọi lại mô hình tạo ảnh."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageOps

from register_generated import add_banner_copy


ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / "work" / "product-image-rebuild-20261026"
OLD_WORK = ROOT / "work" / "product-image-rebuild-20261025"
OLD_ORIGINALS = OLD_WORK / "generated-originals"
NEW_ORIGINALS = WORK / "generated-originals"
TARGET_ROOT = ROOT / "public" / "products" / "ai-generated"


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def source_for(item: dict) -> Path:
    stem = Path(item["target"]).stem
    new_candidates = list(NEW_ORIGINALS.glob(f"{int(item['index']):04d}-{stem}.png"))
    if new_candidates:
        return new_candidates[0]
    old = OLD_ORIGINALS / f"{stem}.png"
    if old.is_file():
        return old
    matches = list(OLD_ORIGINALS.glob(f"*{stem}.png"))
    if matches:
        return matches[0]
    raise FileNotFoundError(f"Không tìm thấy nguồn AI cho index {item['index']}: {stem}")


def main() -> int:
    items = read_json(OLD_WORK / "products.json")["items"]
    missing_sources = []
    rendered = 0
    for item in items:
        try:
            source = source_for(item)
        except FileNotFoundError:
            missing_sources.append(int(item["index"]))
            continue
        target = ROOT / "public" / item["target"].lstrip("/")
        with Image.open(source) as image:
            prepared = add_banner_copy(ImageOps.exif_transpose(image).convert("RGB"), item)
            prepared.save(target, "WEBP", quality=88, method=6)
        rendered += 1
    if missing_sources:
        print(json.dumps({"ok": False, "rendered": rendered, "missingSources": missing_sources[:20], "missingCount": len(missing_sources)}, ensure_ascii=False))
        return 1
    print(json.dumps({"ok": True, "rendered": rendered}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

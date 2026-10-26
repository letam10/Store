"""Kiểm tra đủ 1.000 ảnh AI trước khi sửa catalog manifest."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    task = root / "work" / "product-image-rebuild-20261025"
    products = read_json(task / "products.json")["items"]
    progress = read_json(task / "progress.json")
    if len(products) != 1000:
        raise ValueError(f"products.json phải có 1000 mục, nhận {len(products)}")

    product_by_id = {item["id"]: item for item in products}
    if len(product_by_id) != 1000:
        raise ValueError("products.json có ID trùng")
    generated_by_id = {entry["id"]: entry for entry in progress.get("generated", [])}
    if len(generated_by_id) != 1000:
        raise ValueError(f"progress.json chưa đủ 1000 ảnh: {len(generated_by_id)}")

    checked = 0
    total_bytes = 0
    for product in products:
        entry = generated_by_id.get(product["id"])
        if entry is None or entry["target"] != product["target"]:
            raise ValueError(f"Thiếu hoặc sai target ở ID {product['id']}")
        target = root / "public" / product["target"].lstrip("/")
        if not target.is_file():
            raise FileNotFoundError(target)
        with Image.open(target) as image:
            width, height = image.size
            if image.format != "WEBP" or width < 640 or height < 640:
                raise ValueError(f"Ảnh không hợp lệ {target}: {image.format} {width}x{height}")
        for old_image in product["oldImages"]:
            old_path = root / "public" / old_image.lstrip("/")
            if not old_path.is_file():
                raise FileNotFoundError(f"Ảnh cũ bị thiếu: {old_path}")
        checked += 1
        total_bytes += target.stat().st_size

    print(json.dumps({"ok": True, "checked": checked, "totalBytes": total_bytes}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)

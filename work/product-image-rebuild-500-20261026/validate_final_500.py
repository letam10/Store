"""Kiểm tra manifest, 500 ảnh chính và tối đa hai ảnh phụ."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
ADMIN_ROOT = ROOT.parent / "Store-Admin"


def read(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    store = read(ROOT / "shared" / "catalog-manifest.json")
    admin = read(ADMIN_ROOT / "shared" / "catalog-manifest.json")
    errors: list[str] = []
    if len(store["products"]) != 500 or len(admin["products"]) != 500:
        errors.append("manifest count is not 500 in both projects")
    store_by_id = {str(value["id"]): value for value in store["products"]}
    admin_by_id = {str(value["id"]): value for value in admin["products"]}
    if set(store_by_id) != set(admin_by_id):
        errors.append("Store and Admin IDs differ")
    for index, product in enumerate(store["products"], start=1):
        target = str(product.get("image", ""))
        expected_prefix = "/products/ai-generated-500/"
        if not target.startswith(expected_prefix):
            errors.append(f"{index}: main image is not ai-generated-500")
        target_path = ROOT / "public" / target.lstrip("/")
        if not target_path.is_file():
            errors.append(f"{index}: missing main image {target}")
        else:
            try:
                with Image.open(target_path) as image:
                    image.verify()
            except Exception as error:  # pragma: no cover
                errors.append(f"{index}: unreadable main image: {error}")
        images = product.get("images") or []
        if len(images) > 3 or images[0] != target:
            errors.append(f"{index}: images contract invalid")
        for secondary in images[1:]:
            secondary_path = ROOT / "public" / str(secondary).lstrip("/")
            if not secondary_path.is_file():
                errors.append(f"{index}: missing secondary image {secondary}")
    store_files = list((ROOT / "public" / "products" / "ai-generated-500").glob("*.webp"))
    admin_files = list((ADMIN_ROOT / "public" / "products" / "ai-generated-500").glob("*.webp"))
    if len(store_files) != 500:
        errors.append(f"Store generated directory contains {len(store_files)} WebP files")
    if len(admin_files) != 500:
        errors.append(f"Admin generated directory contains {len(admin_files)} WebP files")
    if errors:
        print(json.dumps({"ok": False, "errors": errors[:20], "errorCount": len(errors)}, ensure_ascii=False))
        return 1
    print(json.dumps({"ok": True, "products": 500, "mainImages": 500, "adminImages": 500, "maxSecondary": 2}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

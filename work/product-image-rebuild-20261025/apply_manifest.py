"""Đặt ảnh AI làm ảnh chính và giữ toàn bộ ảnh cũ ở các vị trí phụ."""

from __future__ import annotations

import json
from pathlib import Path


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    task = root / "work" / "product-image-rebuild-20261025"
    manifest_path = root / "shared" / "catalog-manifest.json"
    manifest = read_json(manifest_path)
    products = read_json(task / "products.json")["items"]
    progress = read_json(task / "progress.json")
    generated = {entry["id"]: entry for entry in progress.get("generated", [])}
    if len(manifest.get("products", [])) != 1000 or len(generated) != 1000:
        raise ValueError("Chỉ cập nhật manifest sau khi đủ 1.000 ảnh")

    by_id = {item["id"]: item for item in products}
    for product in manifest["products"]:
        product_id = str(product["id"])
        planned = by_id.get(product_id)
        entry = generated.get(product_id)
        if planned is None or entry is None:
            raise ValueError(f"Thiếu kế hoạch hoặc ảnh đã tạo cho {product_id}")
        old_images = list(dict.fromkeys([*(product.get("images") or []), product.get("image")]))
        new_image = entry["target"]
        product["image"] = new_image
        product["images"] = [new_image, *[image for image in old_images if image != new_image]]

    write_json(manifest_path, manifest)
    print(json.dumps({"ok": True, "manifest": str(manifest_path), "products": len(manifest["products"])}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

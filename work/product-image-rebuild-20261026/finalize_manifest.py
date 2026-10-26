"""Cập nhật manifest Store/Admin sau khi đủ toàn bộ 1.000 ảnh."""

from __future__ import annotations

import json
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
ADMIN_ROOT = ROOT.parent / "Store-Admin"
OLD_WORK = ROOT / "work" / "product-image-rebuild-20261025"
PUBLIC_IMAGES = ROOT / "public" / "products" / "ai-generated"
ADMIN_IMAGES = ADMIN_ROOT / "public" / "products" / "ai-generated"
STORE_MANIFEST = ROOT / "shared" / "catalog-manifest.json"
ADMIN_MANIFEST = ADMIN_ROOT / "shared" / "catalog-manifest.json"


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def merge_images(product: dict, target: str, old_images: list[str]) -> dict:
    existing = product.get("images") if isinstance(product.get("images"), list) else [product.get("image")]
    ordered = [target, *old_images, *existing]
    images = []
    for image in ordered:
        if isinstance(image, str) and image and image not in images:
            images.append(image)
    return {**product, "image": target, "images": images}


def main() -> int:
    master = read_json(OLD_WORK / "products.json")["items"]
    store_manifest = read_json(STORE_MANIFEST)
    admin_manifest = read_json(ADMIN_MANIFEST)
    if len(store_manifest.get("products", [])) != 1000 or len(admin_manifest.get("products", [])) != 1000:
        raise ValueError("Manifest nguồn phải có đúng 1.000 sản phẩm")

    store_by_id = {str(product["id"]): product for product in store_manifest["products"]}
    admin_by_id = {str(product["id"]): product for product in admin_manifest["products"]}
    if set(store_by_id) != set(admin_by_id):
        raise ValueError("Manifest Store và Store-Admin không cùng tập ID")

    updated_store = []
    updated_admin = []
    missing_targets = []
    for item in master:
        target = str(item["target"])
        target_file = ROOT / "public" / target.lstrip("/")
        if not target_file.is_file():
            missing_targets.append(target)
            continue
        product_id = str(item["id"])
        if product_id not in store_by_id:
            raise ValueError(f"Không tìm thấy ID trong manifest: {product_id}")
        old_images = list(item.get("oldImages") or [])
        updated_store.append(merge_images(store_by_id[product_id], target, old_images))
        updated_admin.append(merge_images(admin_by_id[product_id], target, old_images))

    if missing_targets:
        raise FileNotFoundError(f"Còn {len(missing_targets)} target thiếu, ví dụ: {missing_targets[:3]}")
    if len(updated_store) != 1000 or len({product["image"] for product in updated_store}) != 1000:
        raise ValueError("Ảnh chính sau khi hợp nhất không đủ 1.000 đường dẫn duy nhất")

    ADMIN_IMAGES.mkdir(parents=True, exist_ok=True)
    copied = 0
    for source in PUBLIC_IMAGES.glob("*.webp"):
        shutil.copy2(source, ADMIN_IMAGES / source.name)
        copied += 1

    store_output = {**store_manifest, "products": updated_store}
    admin_output = {**admin_manifest, "products": updated_admin}
    write_json(STORE_MANIFEST, store_output)
    write_json(ADMIN_MANIFEST, admin_output)
    print(json.dumps({"ok": True, "products": 1000, "copiedToAdmin": copied, "storeManifest": str(STORE_MANIFEST), "adminManifest": str(ADMIN_MANIFEST)}, ensure_ascii=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

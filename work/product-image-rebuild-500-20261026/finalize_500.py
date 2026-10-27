"""Hợp nhất 500 ảnh mới và giữ tối đa hai ảnh cũ làm ảnh phụ."""

from __future__ import annotations

import json
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
ADMIN_ROOT = ROOT.parent / "Store-Admin"
STORE_MANIFEST = ROOT / "shared" / "catalog-manifest.json"
ADMIN_MANIFEST = ADMIN_ROOT / "shared" / "catalog-manifest.json"
ASSET_DIR = ROOT / "public" / "products" / "ai-generated-500"
ADMIN_ASSET_DIR = ADMIN_ROOT / "public" / "products" / "ai-generated-500"


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def load_old_manifest() -> dict[str, dict]:
    import subprocess

    result = subprocess.run(
        ["git", "show", "HEAD:shared/catalog-manifest.json"],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    value = json.loads(result.stdout)
    return {str(product["id"]): product for product in value.get("products", [])}


def existing_image_paths(product: dict, old_product: dict | None) -> list[str]:
    candidates: list[str] = []
    for value in [product.get("image"), *(product.get("images") or []), (old_product or {}).get("image"), *((old_product or {}).get("images") or [])]:
        if not isinstance(value, str) or not value:
            continue
        if "ai-generated-500" in value:
            continue
        local_path = ROOT / "public" / value.lstrip("/")
        if not local_path.is_file():
            continue
        if value not in candidates:
            candidates.append(value)
    return candidates[:2]


def main() -> int:
    store = read_json(STORE_MANIFEST)
    admin = read_json(ADMIN_MANIFEST)
    old = load_old_manifest()
    if len(store.get("products", [])) != 500 or len(admin.get("products", [])) != 500:
        raise ValueError("Store và Store-Admin phải cùng có đúng 500 sản phẩm")

    admin_by_id = {str(product["id"]): product for product in admin["products"]}
    updated_store = []
    updated_admin = []
    missing: list[str] = []
    for index, product in enumerate(store["products"], start=1):
        matches = list(ASSET_DIR.glob(f"{index:04d}-*.webp"))
        if len(matches) != 1 or matches[0].stat().st_size <= 10_000:
            missing.append(f"{index}:{product['id']}")
            continue
        target = f"/products/ai-generated-500/{matches[0].name}"
        old_images = existing_image_paths(product, old.get(str(product["id"])))
        updated = {**product, "image": target, "images": [target, *old_images]}
        updated_store.append(updated)
        admin_product = admin_by_id[str(product["id"])]
        updated_admin.append({**admin_product, "image": target, "images": [target, *old_images]})

    if missing:
        raise FileNotFoundError(f"Còn {len(missing)} ảnh thiếu: {missing[:10]}")
    if len(updated_store) != 500 or len(updated_admin) != 500:
        raise ValueError("Không đủ 500 sản phẩm sau khi hợp nhất")
    if any(len(product["images"]) > 3 for product in updated_store):
        raise ValueError("Có sản phẩm còn hơn hai ảnh phụ")

    ADMIN_ASSET_DIR.mkdir(parents=True, exist_ok=True)
    for source in ASSET_DIR.glob("*.webp"):
        shutil.copy2(source, ADMIN_ASSET_DIR / source.name)

    write_json(STORE_MANIFEST, {**store, "selectedCount": 500, "products": updated_store})
    write_json(ADMIN_MANIFEST, {**admin, "selectedCount": 500, "products": updated_admin})
    print(json.dumps({"ok": True, "products": 500, "mainImages": 500, "secondaryMax": 2, "adminCopied": len(list(ADMIN_ASSET_DIR.glob("*.webp")))}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

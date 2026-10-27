"""Khởi động lại catalog 500 ảnh từ 10 ảnh đã được người dùng duyệt."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / "work" / "product-image-rebuild-500-20261026"
MANIFEST_PATH = ROOT / "shared" / "catalog-manifest.json"
ASSET_DIR = ROOT / "public" / "products" / "ai-generated-500"
ACCEPTED = 10

STYLES = [
    ("dark graphite electronics studio, cyan edge light, modular acrylic planes", "wide 16:9, hero right, text stack left", "CÔNG NGHỆ THEO CÁCH RIÊNG", "XEM NGAY"),
    ("warm ivory architectural interior, natural wood, terracotta floor, morning sunlight", "portrait 2:3, hero left, vertical specification rail right", "GỌN HƠN MỖI NGÀY", "KHÁM PHÁ"),
    ("black velvet and brushed champagne metal, luxury macro studio", "square, macro hero center, headline upper right, price foil seal lower left", "CHI TIẾT TẠO KHÁC BIỆT", "XEM BỘ SƯU TẬP"),
    ("cream lifestyle studio, pale stone, botanical shadows, translucent accents", "portrait 4:5, hero low-right, curved copy and offset price", "CHỌN ĐÚNG NHỊP SỐNG", "XEM CHI TIẾT"),
    ("deep plum, electric blue and orange geometric acrylic blocks", "diagonal hero, circular material close-up, vertical headline left", "NỔI BẬT TỪ GÓC NHÌN", "CHỌN MẪU"),
    ("editorial café or craft studio, rich brown surfaces, warm window light", "wide 3:2, hero anchored left, diagonal detail trail, copy upper middle", "ĐẬM CHẤT RIÊNG", "THỬ NGAY"),
    ("cool blue-gray travel or work studio, brushed metal, golden horizon reflection", "wide 16:9 vanishing point, hero lower-right, title upper-left", "SẴN SÀNG ĐI XA", "LÊN ĐƯỜNG"),
    ("soft sand concrete, muted sage wall, precise sunlight rectangle", "airy portrait, hero low on bench, headline upper-right, feature cards on edge", "MANG THEO MỖI NGÀY", "CHỌN NGAY"),
]


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def dump(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def safe_text(value: object, fallback: str = "Sản phẩm Store") -> str:
    text = " ".join(str(value or "").split())
    text = re.sub(r"\b(AmazonBasics|Amazon Brand|Amazon Collection|Solimo|find\.|Symbol|The Fix|Stone & Beam|Samsung|Motorola|Lenovo|Vivo|Nokia|Gionee|Realme|Micromax)\b", "", text, flags=re.IGNORECASE)
    text = " ".join(text.split()).strip(" -,:;")
    return text[:120] or fallback


def old_reference(product: dict) -> str:
    for image in product.get("images") or []:
        if not isinstance(image, str) or not image.startswith("/products/"):
            continue
        if "ai-generated" in image:
            continue
        path = ROOT / "public" / image.lstrip("/")
        if path.is_file():
            return str(path)
    return ""


def feature(product: dict) -> str:
    for item in product.get("features") or []:
        text = safe_text(item, "")
        if text and not text.lower().startswith(("amazon", "marketplace", "loại nguồn")):
            return text[:80]
    return "Thiết kế riêng cho nhu cầu hằng ngày"


def prompt_for(index: int, product: dict) -> str:
    scene, layout, headline, cta = STYLES[(index - 1) % len(STYLES)]
    name = safe_text(product.get("name"))
    category = safe_text(product.get("category"), "SẢN PHẨM")
    price = f"{int(product.get('price', 0)):,}".replace(",", ".") + "đ"
    highlight = feature(product)
    return f"""Use case: ads-marketing
Asset type: premium e-commerce product advertising banner, sequential restart image {index} of 500
Input image role: the supplied local reference is the old image of this exact product; preserve product type, silhouette, material, color and distinctive details while redesigning the scene.
Primary request: Create a new original Store banner for listing "{name}" in category "{category}". Make the product the single hero and visibly recognizable from the reference. Use only neutral original STORE branding and do not reproduce any real-world logo.
Product data: title "{name}"; category "{category}"; price "{price}"; highlight "{highlight}".
Scene/backdrop: {scene}
Composition/framing: {layout}
Lighting/mood: premium commercial photography, realistic materials, controlled contrast, varied hierarchy for this specific product.
Exact copy: headline "{headline}"; product label "{name[:64]}"; feature "{highlight}"; price "{price}"; CTA "{cta}". Place text according to the composition; do not use a fixed centered template.
Constraints: no unrelated objects, no watermark, no third-party logo, no gibberish, no extra text, no cropped product; no people unless naturally required; no food cues unless the listed product is food or beverage; preserve product identity and realistic proportions.
Avoid: generic catalog card, repeated composition, duplicate hero, invented specifications, fake brand names."""


def main() -> int:
    manifest = load(MANIFEST_PATH)
    products = manifest.get("products") or []
    if len(products) != 500:
        raise ValueError(f"Expected 500 products, got {len(products)}")
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    accepted = []
    for index in range(1, ACCEPTED + 1):
        matches = list(ASSET_DIR.glob(f"{index:04d}-*.webp"))
        if len(matches) != 1 or matches[0].stat().st_size <= 10_000:
            raise FileNotFoundError(f"Accepted image {index} is missing or invalid")
        accepted.append(index)

    items = []
    for index in range(ACCEPTED + 1, 501):
        product = products[index - 1]
        matches = list(ASSET_DIR.glob(f"{index:04d}-*.webp"))
        target_name = matches[0].name if matches else f"{index:04d}-{product['id']}.webp"
        items.append({
            "index": index,
            "id": product["id"],
            "name": product["name"],
            "category": product.get("category", ""),
            "price": product.get("price", 0),
            "targetName": target_name,
            "reference": old_reference(product),
            "prompt": prompt_for(index, product),
        })

    now = datetime.now(timezone.utc).isoformat()
    dump(WORK / "restart-items.json", {"total": len(items), "range": [11, 500], "items": items})
    dump(WORK / "restart-progress.json", {
        "schemaVersion": 1,
        "totalProducts": 500,
        "acceptedExisting": accepted,
        "generatedThisRestart": [],
        "phases": [
            {"phase": 1, "range": [1, 100], "accepted": 10, "remaining": 90},
            {"phase": 2, "range": [101, 200], "accepted": 0, "remaining": 100},
            {"phase": 3, "range": [201, 300], "accepted": 0, "remaining": 100},
            {"phase": 4, "range": [301, 400], "accepted": 0, "remaining": 100},
            {"phase": 5, "range": [401, 500], "accepted": 0, "remaining": 100},
        ],
        "lastUpdatedAt": now,
    })
    print(json.dumps({"ok": True, "accepted": len(accepted), "remaining": len(items), "firstRemaining": items[0]["index"], "last": items[-1]["index"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

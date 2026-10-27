"""Chuẩn bị giai đoạn 5 và xác nhận các ảnh 1-476 đã tồn tại theo thứ tự."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / "work" / "product-image-rebuild-500-20261026"
MANIFEST_PATH = ROOT / "shared" / "catalog-manifest.json"
ASSET_DIR = ROOT / "public" / "products" / "ai-generated-500"


STYLE_TEMPLATES = [
    {
        "scene": "dark graphite electronics studio, cyan edge light, modular acrylic planes, clean technical reflections",
        "layout": "wide 16:9 composition with the product on the right and a left text stack with one diagonal accent line",
        "accent": "cyan with a small coral CTA accent",
        "headline": "CÔNG NGHỆ THEO CÁCH RIÊNG",
        "cta": "XEM NGAY",
    },
    {
        "scene": "warm ivory architectural interior, natural wood, soft terracotta floor, morning sunlight and long shadows",
        "layout": "portrait 2:3 composition with the product slightly left of center, specifications arranged as a vertical rail on the right",
        "accent": "olive and warm brown",
        "headline": "GỌN HƠN MỖI NGÀY",
        "cta": "KHÁM PHÁ",
    },
    {
        "scene": "luxury black velvet and brushed champagne metal, controlled bokeh, premium macro studio",
        "layout": "square composition with a macro hero near the center, headline in the upper right and price in a foil seal at lower left",
        "accent": "champagne gold",
        "headline": "CHI TIẾT TẠO KHÁC BIỆT",
        "cta": "XEM BỘ SƯU TẬP",
    },
    {
        "scene": "bright cream lifestyle studio with glass, pale stone, gentle botanical shadows and translucent product accents",
        "layout": "portrait 4:5 composition with the product low and slightly right, curved copy following the background shape",
        "accent": "sage green and amber",
        "headline": "CHỌN ĐÚNG NHỊP SỐNG",
        "cta": "XEM CHI TIẾT",
    },
    {
        "scene": "deep plum, electric blue and soft orange geometric color blocks, glossy acrylic and fashion-tech lighting",
        "layout": "diagonal product composition with a small circular material close-up, vertical headline on the left and ribbon CTA at the bottom",
        "accent": "magenta and electric blue",
        "headline": "NỔI BẬT TỪ GÓC NHÌN",
        "cta": "CHỌN MẪU",
    },
    {
        "scene": "editorial café or craft studio with rich brown surfaces, tactile materials, warm window light and controlled haze",
        "layout": "wide 3:2 composition with product anchored on the left, a diagonal trail of relevant small details, headline in upper middle",
        "accent": "roasted brown and cream",
        "headline": "ĐẬM CHẤT RIÊNG",
        "cta": "THỬ NGAY",
    },
    {
        "scene": "cool blue-gray travel or work studio with glass, brushed metal and a single golden horizon reflection",
        "layout": "wide 16:9 vanishing-point composition with the product entering from the lower right, title upper left and CTA lower right",
        "accent": "ice blue and amber",
        "headline": "SẴN SÀNG ĐI XA",
        "cta": "LÊN ĐƯỜNG",
    },
    {
        "scene": "soft sand concrete and muted sage wall, a precise rectangle of sunlight, quiet fashion editorial styling",
        "layout": "airy portrait composition with product low on a bench, headline upper right, price tag attached to the product and feature cards along one edge",
        "accent": "sand and muted olive",
        "headline": "MANG THEO MỖI NGÀY",
        "cta": "CHỌN NGAY",
    },
]


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def safe_text(value: object, fallback: str = "Sản phẩm Store") -> str:
    text = " ".join(str(value or "").split())
    text = re.sub(r"\b(AmazonBasics|Amazon Brand|Amazon Collection|Solimo|find\.|Symbol|The Fix|Stone & Beam|Samsung|Motorola|Lenovo|Vivo|Nokia|Gionee|Realme|Micromax)\b", "", text, flags=re.IGNORECASE)
    text = " ".join(text.split()).strip(" -,:;")
    return text[:120] or fallback


def short_feature(product: dict) -> str:
    for feature in product.get("features") or []:
        cleaned = safe_text(feature, "")
        if cleaned and not cleaned.lower().startswith(("amazon", "marketplace", "loại nguồn")):
            return cleaned[:80]
    return "Thiết kế riêng cho nhu cầu hằng ngày"


def prompt_for(index: int, product: dict) -> str:
    style = STYLE_TEMPLATES[(index - 1) % len(STYLE_TEMPLATES)]
    name = safe_text(product.get("name"))
    category = safe_text(product.get("category"), "SẢN PHẨM")
    price = f"{int(product.get('price', 0)):,}".replace(",", ".") + "đ"
    feature = short_feature(product)
    return f"""Use case: ads-marketing
Asset type: premium e-commerce product advertising banner, sequential phase 5 image {index} of 500
Input image role: the supplied local reference image is the exact old product image; preserve the product type, silhouette, material, colors and distinctive details while redesigning the advertising scene.
Primary request: Create a new original Store advertising image for the catalog product "{name}" in category "{category}". The product must be the single hero and must look recognizably like the reference product. Do not copy any real-world logo or trademark from the source image; use only an original neutral STORE visual identity.
Product information: title "{name}"; category "{category}"; price "{price}"; one product highlight "{feature}".
Scene/backdrop: {style['scene']}
Composition/framing: {style['layout']}
Lighting/mood: premium commercial photography, realistic materials, carefully controlled contrast, {style['accent']}.
Text layout: use different positions and hierarchy for this product; do not use a fixed template. Use exact copy: headline "{style['headline']}"; product label "{name[:60]}"; feature line "{feature}"; price "{price}"; CTA "{style['cta']}". Put the headline and CTA according to the composition above, with clear negative space and no overlap on the product.
Constraints: no people unless the product itself requires a partial lifestyle context; no unrelated objects; no food cues unless the product is food or beverage; no flames or smoke unless materially appropriate; no watermark; no third-party logo; no extra text; no gibberish; no cropped product; preserve product identity and realistic proportions.
Avoid: generic fixed catalog card, repeated centered text block, duplicate hero objects, distorted packaging, invented specifications, fake brand names."""


def main() -> int:
    manifest = read_json(MANIFEST_PATH)
    products = manifest.get("products") or []
    if len(products) != 500:
        raise ValueError(f"Manifest phải có 500 sản phẩm, hiện có {len(products)}")
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    verified_existing = []
    missing_existing = []
    for index in range(1, 477):
        matches = list(ASSET_DIR.glob(f"{index:04d}-*.webp"))
        if len(matches) == 1 and matches[0].stat().st_size > 10_000:
            verified_existing.append(index)
        else:
            missing_existing.append(index)
    if missing_existing:
        raise FileNotFoundError(f"Ảnh 1-476 còn thiếu hoặc lỗi: {missing_existing[:20]}")

    phase_items = []
    for index in range(477, 501):
        product = products[index - 1]
        matches = list(ASSET_DIR.glob(f"{index:04d}-*.webp"))
        target_name = matches[0].name if matches else f"{index:04d}-{product['id']}.webp"
        reference = ""
        for image in product.get("images") or []:
            if isinstance(image, str) and image.startswith("/products/") and "ai-generated" not in image:
                candidate = ROOT / "public" / image.lstrip("/")
                if candidate.is_file():
                    reference = str(candidate)
                    break
        phase_items.append(
            {
                "index": index,
                "id": product["id"],
                "name": product["name"],
                "category": product.get("category", ""),
                "price": product.get("price", 0),
                "targetName": target_name,
                "reference": reference,
                "prompt": prompt_for(index, product),
            }
        )

    now = datetime.now(timezone.utc).isoformat()
    write_json(WORK / "phase-5-items.json", {"phase": 5, "range": [477, 500], "items": phase_items})
    write_json(
        WORK / "progress.json",
        {
            "schemaVersion": 1,
            "totalProducts": 500,
            "phases": [
                {"phase": 1, "range": [1, 100], "status": "verified_existing", "count": 100},
                {"phase": 2, "range": [101, 200], "status": "verified_existing", "count": 100},
                {"phase": 3, "range": [201, 300], "status": "verified_existing", "count": 100},
                {"phase": 4, "range": [301, 400], "status": "verified_existing", "count": 100},
                {"phase": 5, "range": [401, 500], "status": "partially_existing", "existingCount": 76, "generatedNow": 0, "remaining": 24},
            ],
            "verifiedExistingFiles": verified_existing,
            "generatedInThisTurn": [],
            "lastUpdatedAt": now,
        },
    )
    print(json.dumps({"ok": True, "verifiedExisting": len(verified_existing), "phase5Existing": 76, "phase5Remaining": 24}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

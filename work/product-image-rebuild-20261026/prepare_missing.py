"""Chuẩn bị danh sách và prompt cho 167 ảnh sản phẩm còn thiếu."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
OLD_WORK = ROOT / "work" / "product-image-rebuild-20261025"
WORK = ROOT / "work" / "product-image-rebuild-20261026"


CATEGORY_STYLE = {
    "Điện tử": "dark graphite studio, cool cyan rim light, subtle reflective surface",
    "Linh kiện": "dark graphite macro studio, crisp detail, cyan and amber edge lighting",
    "Đồ gia dụng": "warm ivory home interior, soft natural daylight, tasteful lived-in context",
    "Làm đẹp": "bright cream bathroom or dressing-table setting, gentle peach and mint accents, soft daylight",
    "Trang phục": "warm editorial fashion studio, controlled soft shadows, neutral backdrop, visible fabric weave",
    "Trang sức": "deep charcoal velvet, warm gold highlights, shallow depth of field, refined luxury styling",
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def safe_visual_name(name: str) -> str:
    """Bỏ tên thương hiệu/nhân vật khỏi prompt để tránh mô hình tự vẽ logo."""
    scrubbed = name
    brands = (
        "AmazonBasics",
        "Amazon Brand",
        "Disney",
        "Frozen",
        "Solimo",
        "Goodthreads",
        "Mama Bear",
        "Realme",
        "Samsung",
        "Motorola",
        "Micromax",
        "Gionee",
        "Nia & Nicole",
        "Jenny Casablanca",
        "The Fix",
        "Stone & Beam",
        "Amazon Collection",
        "Amazon Essentials",
    )
    for brand in brands:
        scrubbed = re.sub(re.escape(brand), "", scrubbed, flags=re.IGNORECASE)
    scrubbed = re.sub(r"\b(Disney|Frozen|Marvel|Star Wars|Harry Potter)\b", "", scrubbed, flags=re.IGNORECASE)
    scrubbed = " ".join(scrubbed.split()).strip(" -,:;")
    return scrubbed[:280] or "a premium everyday consumer product"


def make_prompt(item: dict) -> str:
    name = safe_visual_name(" ".join(str(item["name"]).split()))
    category = str(item["category"])
    style = CATEGORY_STYLE.get(category, "clean premium commercial studio with realistic product materials")
    ratio = item.get("ratio", "landscape")
    framing = {
        "portrait": "portrait product poster, product centered slightly below the middle with generous negative space at the top",
        "square": "square product poster, balanced centered hero with generous clean space for later typography",
        "tall": "tall product poster, hero centered slightly below the middle with clean space at the top",
    }.get(ratio, "landscape advertising banner, product hero on the right and generous clean negative space on the left")
    return f"""Use case: product-mockup
Asset type: e-commerce advertising product banner
Primary request: Create a polished premium commercial product photograph for this listing: {name}. Show the correct product type, silhouette, materials, colors, and useful details suggested by the listing. Keep the product as the single clear hero and leave the designated negative space empty for typography added later.
Scene/backdrop: {style}
Subject: one realistic product matching the listing description, no people
Style/medium: photorealistic commercial product photography
Composition/framing: {framing}
Lighting/mood: cinematic but natural, high-end retail campaign, crisp product edges
Color palette: coordinated with the product and the setting, clean premium contrast
Materials/textures: realistic fabric, plastic, metal, glass, paper, leather, or gemstone surfaces as appropriate
Text (verbatim): none; do not render any wording
Constraints: no people, no body parts, no extra products, no watermark, no text, no invented labels or logos, no cropped hero, no duplicate objects; preserve the product category and recognizable form implied by the listing
Avoid: fake lettering, distorted packaging, melted geometry, generic placeholder icons, cluttered background"""


def main() -> int:
    missing = load_json(OLD_WORK / "missing-products.json")
    product_lookup = {
        int(item["index"]): item
        for item in load_json(OLD_WORK / "products.json")["items"]
    }
    items = []
    for item in missing["items"]:
        source_item = product_lookup[int(item["index"])]
        merged = {**source_item, **item}
        target_name = Path(item["target"]).name
        old_images = list(item.get("oldImages") or [])
        old_local = []
        for image_path in old_images:
            relative = str(image_path).lstrip("/").replace("/", "\\")
            old_local.append(str(ROOT / "public" / relative))
        items.append(
            {
                **merged,
                "targetName": target_name,
                "oldLocal": old_local,
                "prompt": make_prompt(item),
            }
        )

    items.sort(key=lambda value: int(value["index"]))
    now = datetime.now(timezone.utc).isoformat()
    write_json(WORK / "items.json", {"schemaVersion": 1, "total": len(items), "items": items})
    write_json(
        WORK / "progress.json",
        {
            "schemaVersion": 1,
            "total": len(items),
            "generated": [],
            "failed": [],
            "preparedAt": now,
            "lastUpdatedAt": now,
        },
    )
    print(json.dumps({"total": len(items), "firstIndex": items[0]["index"], "lastIndex": items[-1]["index"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

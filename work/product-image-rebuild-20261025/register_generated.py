"""Đăng ký một ảnh AI đã tạo và cập nhật nhật ký tiến độ."""

from __future__ import annotations

import hashlib
import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageOps


FONT_CANDIDATES = [
    Path("C:/Windows/Fonts/seguisb.ttf"),
    Path("C:/Windows/Fonts/segoeui.ttf"),
    Path("C:/Windows/Fonts/arial.ttf"),
]


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def digest(path: Path) -> str:
    sha = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            sha.update(chunk)
    return sha.hexdigest()


def format_price(value) -> str:
    try:
        amount = int(value)
    except (TypeError, ValueError):
        return ""
    return f"{amount:,}".replace(",", ".") + "đ"


def fit_font(draw, text: str, font_path: Path, max_width: int, start: int, minimum: int):
    from PIL import ImageFont

    size = start
    while size > minimum:
        font = ImageFont.truetype(str(font_path), size)
        if draw.textbbox((0, 0), text, font=font)[2] <= max_width:
            return font
        size -= 2
    return ImageFont.truetype(str(font_path), minimum)


def wrap_text(draw, text: str, font, max_width: int):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        candidate = word if not current else current + " " + word
        if draw.textbbox((0, 0), candidate, font=font)[2] <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines or [text]


def short_copy(product: dict) -> str:
    features = product.get("features") or []
    if features:
        return str(features[0]).strip()
    description = " ".join(str(product.get("description") or "").split())
    if ". " in description:
        return description.split(". ", 1)[0].strip() + "."
    return description[:180].strip()


def canvas_for(product: dict) -> tuple[int, int]:
    ratio = product.get("ratio", "landscape")
    if ratio == "portrait":
        return 1024, 1536
    if ratio == "square":
        return 1200, 1200
    if ratio == "tall":
        return 1080, 1440
    return 1536, 1024


def add_banner_copy(image: Image.Image, product: dict) -> Image.Image:
    from PIL import ImageDraw, ImageFont

    width, height = canvas_for(product)
    image = ImageOps.fit(image, (width, height), method=Image.Resampling.LANCZOS, centering=(0.58, 0.5))
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    font_path = next((candidate for candidate in FONT_CANDIDATES if candidate.exists()), None)
    if font_path is None:
        return image

    portrait = height > width * 1.15
    panel_width = int(width * 0.48) if not portrait else width
    panel_height = height if not portrait else int(height * 0.38)
    draw.rectangle((0, 0, panel_width, panel_height), fill=(7, 12, 18, 92))
    accent = (239, 112, 30, 255)
    white = (255, 255, 255, 255)
    muted = (218, 226, 230, 255)
    brand_font = ImageFont.truetype(str(font_path), 30)
    category_font = ImageFont.truetype(str(font_path), 24 if not portrait else 20)
    name_font = fit_font(draw, product["name"], font_path, panel_width - 110, 76 if not portrait else 54, 30)
    description_font = ImageFont.truetype(str(font_path), 22 if not portrait else 18)
    price_font = ImageFont.truetype(str(font_path), 44 if not portrait else 34)
    cta_font = ImageFont.truetype(str(font_path), 24 if not portrait else 20)

    x = 58
    y = 66
    draw.text((x, y), "STORE", font=brand_font, fill=accent)
    y += 60
    draw.rectangle((x, y, x + 120, y + 6), fill=accent)
    y += 48
    draw.text((x, y), product["category"].upper(), font=category_font, fill=muted)
    y += 52
    lines = wrap_text(draw, product["name"], name_font, panel_width - 110)
    line_height = int(name_font.size * 1.15)
    for line in lines[:5]:
        draw.text((x, y), line, font=name_font, fill=white)
        y += line_height
    y += 16
    description = short_copy(product)
    description_lines = wrap_text(draw, description, description_font, panel_width - 110)
    description_height = int(description_font.size * 1.2)
    for line in description_lines[:2]:
        draw.text((x, y), line, font=description_font, fill=muted)
        y += description_height
    y += 12
    draw.rectangle((x, y, x + 180, y + 4), fill=accent)
    y += 30
    draw.text((x, y), format_price(product.get("price")), font=price_font, fill=white)
    y += 68
    if y + 52 < panel_height - 22:
        draw.rounded_rectangle((x, y, x + 174, y + 52), radius=26, fill=accent)
        draw.text((x + 26, y + 12), "MUA NGAY", font=cta_font, fill=white)

    return Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: register_generated.py PRODUCT_ID SOURCE_IMAGE", file=sys.stderr)
        return 2

    root = Path(__file__).resolve().parents[2]
    product_id = sys.argv[1]
    source = Path(sys.argv[2]).resolve()
    products_path = root / "work" / "product-image-rebuild-20261025" / "products.json"
    progress_path = root / "work" / "product-image-rebuild-20261025" / "progress.json"
    original_dir = root / "work" / "product-image-rebuild-20261025" / "generated-originals"
    target_dir = root / "public" / "products" / "ai-generated"
    products = load_json(products_path)["items"]
    product = next((item for item in products if item["id"] == product_id), None)
    if product is None:
        raise ValueError(f"Unknown product id: {product_id}")
    if not source.is_file():
        raise FileNotFoundError(source)

    original = original_dir / f"{product_id}.png"
    target = root / "public" / product["target"].lstrip("/")
    original_dir.mkdir(parents=True, exist_ok=True)
    target_dir.mkdir(parents=True, exist_ok=True)
    if source != original.resolve():
        shutil.copy2(source, original)

    with Image.open(original) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        image = add_banner_copy(image, product)
        image.save(target, "WEBP", quality=88, method=6)

    with Image.open(target) as image:
        width, height = image.size
    record = {
        "id": product_id,
        "target": product["target"],
        "source": str(original.relative_to(root)).replace("\\", "/"),
        "sha256": digest(target),
        "bytes": target.stat().st_size,
        "width": width,
        "height": height,
        "completedAt": datetime.now(timezone.utc).isoformat(),
    }
    progress = load_json(progress_path)
    progress["generated"] = [entry for entry in progress.get("generated", []) if entry["id"] != product_id]
    progress["generated"].append(record)
    progress["generated"].sort(key=lambda entry: next(item["index"] for item in products if item["id"] == entry["id"]))
    progress["lastUpdatedAt"] = record["completedAt"]
    write_json(progress_path, progress)
    print(json.dumps(record, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

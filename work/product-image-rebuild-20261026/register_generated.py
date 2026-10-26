"""Đóng gói một ảnh AI thành WebP banner và ghi nhật ký theo index sản phẩm."""

from __future__ import annotations

import hashlib
import json
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / "work" / "product-image-rebuild-20261026"
FONT_CANDIDATES = [
    Path("C:/Windows/Fonts/seguisb.ttf"),
    Path("C:/Windows/Fonts/segoeui.ttf"),
    Path("C:/Windows/Fonts/arial.ttf"),
]


def read_json(path: Path):
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


def clean_display_text(value: object, fallback: str = "Sản phẩm Store") -> str:
    """Loại ký tự ngoài font Latin để banner không xuất hiện ô vuông."""
    text = " ".join(str(value or "").split())
    allowed = []
    for character in text:
        code = ord(character)
        is_latin = code < 0x300 or 0x300 <= code <= 0x24F or 0x1E00 <= code <= 0x1EFF
        is_common_symbol = character in "€£¥₫%+-–—()[]{}.,:/&'\"×"
        allowed.append(character if is_latin or is_common_symbol else " ")
    cleaned = re.sub(r"\s+", " ", "".join(allowed)).strip(" -,:;")
    return cleaned or fallback


def fit_font(draw: ImageDraw.ImageDraw, text: str, font_path: Path, max_width: int, start: int, minimum: int):
    size = start
    while size > minimum:
        font = ImageFont.truetype(str(font_path), size)
        if draw.textbbox((0, 0), text, font=font)[2] <= max_width:
            return font
        size -= 2
    return ImageFont.truetype(str(font_path), minimum)


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int):
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = word if not current else f"{current} {word}"
        if draw.textbbox((0, 0), candidate, font=font)[2] <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines or [text]


def canvas_for(item: dict) -> tuple[int, int]:
    ratio = item.get("ratio", "landscape")
    if ratio == "portrait":
        return 1024, 1536
    if ratio == "square":
        return 1200, 1200
    if ratio == "tall":
        return 1080, 1440
    return 1536, 1024


def short_copy(item: dict) -> str:
    features = [clean_display_text(value, "") for value in item.get("features") or [] if str(value).strip()]
    if features:
        return features[0]
    description = " ".join(str(item.get("description") or "").split())
    return clean_display_text(description.split(". ", 1)[0].strip()[:180], "Sản phẩm chất lượng cho nhu cầu hằng ngày")


def add_banner_copy(source: Image.Image, item: dict) -> Image.Image:
    width, height = canvas_for(item)
    image = ImageOps.fit(source, (width, height), method=Image.Resampling.LANCZOS, centering=(0.58, 0.5))
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    font_path = next((candidate for candidate in FONT_CANDIDATES if candidate.exists()), None)
    if font_path is None:
        return image

    portrait = height > width * 1.15
    panel_width = width if portrait else int(width * 0.48)
    panel_height = int(height * 0.42) if portrait else height
    draw.rectangle((0, 0, panel_width, panel_height), fill=(7, 12, 18, 108))
    accent = (239, 112, 30, 255)
    white = (255, 255, 255, 255)
    muted = (218, 226, 230, 255)
    x = 54 if portrait else 58
    y = 54 if portrait else 66
    brand_font = ImageFont.truetype(str(font_path), 28 if portrait else 30)
    category_font = ImageFont.truetype(str(font_path), 22 if portrait else 24)
    display_name = clean_display_text(item.get("name"))
    display_category = clean_display_text(item.get("category"), "SẢN PHẨM")
    name_font = fit_font(draw, display_name, font_path, panel_width - x * 2, 58 if portrait else 76, 28 if portrait else 30)
    description_font = ImageFont.truetype(str(font_path), 18 if portrait else 22)
    price_font = ImageFont.truetype(str(font_path), 36 if portrait else 44)
    cta_font = ImageFont.truetype(str(font_path), 20 if portrait else 24)

    draw.text((x, y), "STORE", font=brand_font, fill=accent)
    y += brand_font.size + 20
    draw.rectangle((x, y, x + 120, y + 6), fill=accent)
    y += 36
    draw.text((x, y), display_category.upper(), font=category_font, fill=muted)
    y += category_font.size + 18
    name_lines = wrap_text(draw, display_name, name_font, panel_width - x * 2)
    for line in name_lines[:5]:
        draw.text((x, y), line, font=name_font, fill=white)
        y += int(name_font.size * 1.12)
    y += 12
    description_lines = wrap_text(draw, short_copy(item), description_font, panel_width - x * 2)
    for line in description_lines[:2]:
        draw.text((x, y), line, font=description_font, fill=muted)
        y += int(description_font.size * 1.2)
    y += 12
    draw.rectangle((x, y, x + 180, y + 4), fill=accent)
    y += 26
    draw.text((x, y), format_price(item.get("price")), font=price_font, fill=white)
    y += price_font.size + 18
    if y + 52 < panel_height - 18:
        draw.rounded_rectangle((x, y, x + 174, y + 52), radius=26, fill=accent)
        draw.text((x + 26, y + 12), "MUA NGAY", font=cta_font, fill=white)

    return Image.alpha_composite(image.convert("RGBA"), overlay).convert("RGB")


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: register_generated.py PRODUCT_INDEX SOURCE_IMAGE", file=sys.stderr)
        return 2

    index = int(sys.argv[1])
    source = Path(sys.argv[2]).resolve()
    items = read_json(WORK / "items.json")["items"]
    item = next((value for value in items if int(value["index"]) == index), None)
    if item is None:
        raise ValueError(f"Unknown product index: {index}")
    if not source.is_file():
        raise FileNotFoundError(source)

    original_dir = WORK / "generated-originals"
    target = ROOT / "public" / item["target"].lstrip("/")
    original_dir.mkdir(parents=True, exist_ok=True)
    target.parent.mkdir(parents=True, exist_ok=True)
    original = original_dir / f"{index:04d}-{Path(item['targetName']).stem}.png"
    if source != original.resolve():
        shutil.copy2(source, original)

    with Image.open(original) as image:
        prepared = add_banner_copy(ImageOps.exif_transpose(image).convert("RGB"), item)
        prepared.save(target, "WEBP", quality=88, method=6)
    with Image.open(target) as image:
        width, height = image.size

    completed_at = datetime.now(timezone.utc).isoformat()
    record = {
        "index": index,
        "target": item["target"],
        "source": str(original.relative_to(ROOT)).replace("\\", "/"),
        "sha256": digest(target),
        "bytes": target.stat().st_size,
        "width": width,
        "height": height,
        "completedAt": completed_at,
    }
    progress_path = WORK / "progress.json"
    progress = read_json(progress_path)
    progress["generated"] = [value for value in progress.get("generated", []) if int(value["index"]) != index]
    progress["generated"].append(record)
    progress["generated"].sort(key=lambda value: int(value["index"]))
    progress["failed"] = [value for value in progress.get("failed", []) if int(value["index"]) != index]
    progress["lastUpdatedAt"] = completed_at
    write_json(progress_path, progress)
    print(json.dumps(record, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

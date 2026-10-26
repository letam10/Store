"""Chuẩn hóa ảnh AI thành WebP nhẹ, giữ tỉ lệ và nền sản phẩm."""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageOps


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: normalize_image.py SOURCE TARGET", file=sys.stderr)
        return 2

    source = Path(sys.argv[1])
    target = Path(sys.argv[2])
    target.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
        image.save(target, "WEBP", quality=88, method=6)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

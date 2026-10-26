"""Ghi lại một lượt tạo ảnh lỗi mà không sửa manifest."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: record_failure.py PRODUCT_ID MESSAGE", file=sys.stderr)
        return 2
    path = Path(__file__).resolve().with_name("progress.json")
    progress = json.loads(path.read_text(encoding="utf-8"))
    entry = {
        "id": sys.argv[1],
        "message": sys.argv[2],
        "failedAt": datetime.now(timezone.utc).isoformat(),
    }
    progress["failed"] = [item for item in progress.get("failed", []) if item["id"] != entry["id"]]
    progress["failed"].append(entry)
    progress["failed"].sort(key=lambda item: item["id"])
    progress["lastUpdatedAt"] = entry["failedAt"]
    path.write_text(json.dumps(progress, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(entry, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

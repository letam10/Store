"""Ghi lỗi từng sản phẩm mà không tạo target giả."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path


WORK = Path(__file__).resolve().parent


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: record_failure.py PRODUCT_INDEX MESSAGE", file=sys.stderr)
        return 2
    index = int(sys.argv[1])
    path = WORK / "progress.json"
    progress = json.loads(path.read_text(encoding="utf-8"))
    record = {
        "index": index,
        "message": sys.argv[2],
        "failedAt": datetime.now(timezone.utc).isoformat(),
    }
    progress["failed"] = [value for value in progress.get("failed", []) if int(value["index"]) != index]
    progress["failed"].append(record)
    progress["failed"].sort(key=lambda value: int(value["index"]))
    progress["lastUpdatedAt"] = record["failedAt"]
    path.write_text(json.dumps(progress, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(record, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

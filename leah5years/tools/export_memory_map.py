#!/usr/bin/env python3
"""Bundle mosaic layout metadata for both file:// and hosted pages."""

import argparse
import json
from pathlib import Path


def main() -> int:
    project = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description="Export the browser memory map.")
    parser.add_argument("--data-dir", type=Path, default=project / "static" / "data")
    args = parser.parse_args()

    data_dir = args.data_dir.resolve()
    layout = json.loads((data_dir / "layout.json").read_text(encoding="utf-8"))
    videos = json.loads((data_dir / "videos.json").read_text(encoding="utf-8"))
    payload = json.dumps(
        {"layout": layout, "videos": videos},
        ensure_ascii=False,
        separators=(",", ":"),
    )
    (data_dir / "memory-map.js").write_text(
        f"window.LEAH_MEMORY_MAP={payload};\n", encoding="utf-8"
    )
    print(f"wrote {data_dir / 'memory-map.js'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""Shared paths and helpers for the PlanetWalk content pipeline."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
SCHEMAS = CONTENT / "schemas"
PUBLIC = ROOT / "public"
MEDIA_DIR = PUBLIC / "media"
BUILD_DIR = PUBLIC / "content" / "v1"

# Array collections, in build order. live.json is an object and handled separately.
COLLECTIONS = ["worlds", "facts", "missions", "methods", "media"]

USER_AGENT = "PlanetWalk-content-pipeline/1.0 (+https://planetwalk.pages.dev/)"
TIMEOUT = 30  # seconds, every request


def utc_now() -> str:
    """UTC timestamp in the schema's datetime format: YYYY-MM-DDTHH:MM:SSZ."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_json(path: Path, default=None):
    """Load JSON; return `default` if the file does not exist."""
    if not path.exists():
        return default
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, data, *, indent: int | None = 2) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(data, ensure_ascii=False, indent=indent)
    path.write_text(text + "\n", encoding="utf-8")


def load_collection(name: str) -> list:
    """Load content/<name>.json as a list; a missing file is an empty list (dev convenience)."""
    data = load_json(CONTENT / f"{name}.json", default=[])
    return data if isinstance(data, list) else []


def warn(msg: str) -> None:
    sys.stdout.flush()
    print(f"WARNING: {msg}", file=sys.stderr)

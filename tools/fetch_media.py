#!/usr/bin/env python3
"""Image candidates from the NASA Image and Video Library, and media downloads.

    fetch_media.py              # write content/media_candidates.json for a human to pick from
    fetch_media.py --download   # download every media.json originalUrl into public/media/<file>

Search: https://images-api.nasa.gov/search?q=<query>&media_type=image (no key).
Confirmed 2026-10-04: {"collection": {"items": [{"data": [{nasa_id, title,
center, date_created, photographer?, secondary_creator?, ...}], "links":
[{"href", "rel": "preview"|"alternate"|"canonical", ...}]}]}}.

Download: each file is fetched once (skipped if public/media/<file> exists) and
resized to at most 1600 px on the long side as JPEG quality 80 with macOS
`sips`. Without sips the original is copied as-is (with a warning).
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import requests

from common import CONTENT, MEDIA_DIR, TIMEOUT, USER_AGENT, load_collection, utc_now, warn, write_json

SEARCH_URL = "https://images-api.nasa.gov/search"
CANDIDATES_PATH = CONTENT / "media_candidates.json"
PER_QUERY = 12
MAX_SIDE = 1600
JPEG_QUALITY = 80

# English search terms for world ids (worlds.json names are Russian). A bare
# planet name mostly returns event photos ("Mars Celebration"), so be specific.
WORLD_QUERIES = {
    "mercury": "Mercury MESSENGER",
    "venus": "Venus surface",
    "earth": "Earth from space",
    "moon": "lunar surface",
    "mars": "Mars surface",
    "jupiter": "Jupiter",
    "titan": "Titan Cassini",
    "europa": "Europa Jupiter moon",
    "pluto": "Pluto New Horizons",
    "trappist": "TRAPPIST-1",
}

session = requests.Session()
session.headers["User-Agent"] = USER_AGENT


def search(query: str) -> list[dict]:
    params = {"q": query, "media_type": "image", "page_size": PER_QUERY}
    for attempt in range(3):
        try:
            r = session.get(SEARCH_URL, params=params, timeout=TIMEOUT)
            r.raise_for_status()
            items = r.json()["collection"]["items"]
            break
        except (requests.RequestException, ValueError, KeyError) as e:
            if attempt == 2:
                raise RuntimeError(f"search '{query}': {e}") from e
            time.sleep(2 * (attempt + 1))
    out = []
    for item in items[:PER_QUERY]:
        data = (item.get("data") or [{}])[0]
        links = item.get("links") or []
        preview = next((link["href"] for link in links if link.get("rel") == "preview"), None)
        nasa_id = data.get("nasa_id")
        out.append({
            "nasa_id": nasa_id,
            "title": data.get("title"),
            "center": data.get("center"),
            "photographer": data.get("photographer"),
            "secondary_creator": data.get("secondary_creator"),
            "date": (data.get("date_created") or "")[:10] or None,
            "preview": preview,
            "detailsUrl": f"https://images.nasa.gov/details/{nasa_id}" if nasa_id else None,
            "assetsUrl": item.get("href"),
        })
    return out


def run_search() -> int:
    targets = []
    for m in load_collection("missions"):
        q = m.get("nameOriginal") or m.get("id")
        targets.append({"kind": "mission", "id": m.get("id"), "query": q})
    for w in load_collection("worlds"):
        wid = w.get("id")
        targets.append({"kind": "world", "id": wid, "query": WORLD_QUERIES.get(wid, wid.capitalize())})

    results, failed = [], 0
    for t in targets:
        try:
            cands = search(t["query"])
            print(f"{t['kind']:<8} {t['id']:<20} '{t['query']}': {len(cands)} candidate(s)")
        except RuntimeError as e:
            warn(str(e))
            cands, failed = [], failed + 1
        results.append({**t, "candidates": cands})
        time.sleep(0.3)

    write_json(CANDIDATES_PATH, {"generatedAt": utc_now(), "source": SEARCH_URL, "targets": results})
    print(f"wrote content/media_candidates.json ({len(results)} target(s), {failed} failed)")
    return 0


def image_size(path: Path) -> tuple[int, int] | None:
    out = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)], capture_output=True, text=True)
    vals = {}
    for line in out.stdout.splitlines():
        parts = line.split(":")
        if len(parts) == 2 and parts[0].strip() in ("pixelWidth", "pixelHeight"):
            vals[parts[0].strip()] = int(parts[1])
    return (vals["pixelWidth"], vals["pixelHeight"]) if len(vals) == 2 else None


def run_download() -> int:
    media = load_collection("media")
    if not media:
        warn("media.json is missing or empty — nothing to download")
        return 0
    have_sips = shutil.which("sips") is not None
    if not have_sips:
        warn("`sips` not found — images will be copied as-is, not resized")
    MEDIA_DIR.mkdir(parents=True, exist_ok=True)

    done = skipped = failed = 0
    for m in media:
        file, url = m.get("file"), m.get("originalUrl")
        if not file or not url:
            warn(f"media {m.get('id')}: no file/originalUrl")
            failed += 1
            continue
        dest = MEDIA_DIR / file
        if dest.exists():
            skipped += 1
            continue
        try:
            with tempfile.TemporaryDirectory() as tmp:
                src = Path(tmp) / ("original" + (Path(url.split("?")[0]).suffix or ".img"))
                with session.get(url, timeout=TIMEOUT * 4, stream=True) as r:
                    r.raise_for_status()
                    with src.open("wb") as f:
                        for chunk in r.iter_content(1 << 16):
                            f.write(chunk)
                if have_sips:
                    cmd = ["sips", "-s", "format", "jpeg", "-s", "formatOptions", str(JPEG_QUALITY)]
                    size = image_size(src)
                    if size is None or max(size) > MAX_SIDE:  # never upscale
                        cmd += ["-Z", str(MAX_SIDE)]
                    res = subprocess.run([*cmd, str(src), "--out", str(dest)], capture_output=True, text=True)
                    if res.returncode != 0 or not dest.exists():
                        raise RuntimeError(f"sips failed: {res.stderr.strip() or res.stdout.strip()}")
                else:
                    shutil.copyfile(src, dest)
            done += 1
            print(f"downloaded {file}")
        except Exception as e:  # noqa: BLE001 — report and continue with the next file
            dest.unlink(missing_ok=True)
            warn(f"media {m.get('id')}: {e}")
            failed += 1
        time.sleep(0.3)
    print(f"media download: {done} new, {skipped} already present, {failed} failed")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--download", action="store_true", help="download media.json originals into public/media/")
    args = ap.parse_args()
    return run_download() if args.download else run_search()


if __name__ == "__main__":
    sys.exit(main())

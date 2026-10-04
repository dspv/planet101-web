#!/usr/bin/env python3
"""Validate content/ and write public/content/v1/{content,manifest}.json.

`version` is the Unix time of the build, but only bumps when the bytes of
content.json would change: the previous version and generatedAt are re-used
and the result hashed; if the hash equals the previous manifest's sha256, the
build is a no-op. The previous manifest is read from public/content/v1/ or,
when absent (fresh CI checkout), fetched from the deployed site.

    build.py [--snapshot <path>]   # also copy content.json to <path> (iOS bundle)

Env: SITE_URL (default https://planetwalk.pages.dev) — base for media URLs and
for the deployed manifest.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import sys
import time
from pathlib import Path

import validate
from common import BUILD_DIR, COLLECTIONS, CONTENT, TIMEOUT, USER_AGENT, load_collection, load_json, utc_now, warn

SCHEMA_VERSION = 1
DEFAULT_SITE_URL = "https://planetwalk.pages.dev"


def site_url() -> str:
    return (os.environ.get("SITE_URL") or DEFAULT_SITE_URL).rstrip("/")


def render(payload: dict, version: int, generated_at: str) -> bytes:
    doc = {"schemaVersion": SCHEMA_VERSION, "version": version, "generatedAt": generated_at, **payload}
    return json.dumps(doc, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")


def previous_manifest() -> dict | None:
    local = load_json(BUILD_DIR / "manifest.json")
    if local:
        return local
    url = f"{site_url()}/content/v1/manifest.json"
    try:
        import requests

        r = requests.get(url, timeout=TIMEOUT, headers={"User-Agent": USER_AGENT})
        if r.status_code == 200:
            m = r.json()
            if isinstance(m, dict) and {"version", "sha256", "generatedAt"} <= m.keys():
                print(f"previous manifest: {url} (version {m['version']})")
                return m
        print(f"previous manifest: none at {url} (HTTP {r.status_code}) — fresh version")
    except Exception as e:  # noqa: BLE001 — no previous manifest just means a fresh version
        print(f"previous manifest: could not fetch {url} ({type(e).__name__}) — fresh version")
    return None


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--snapshot", type=Path, help="also copy content.json here (e.g. the iOS app bundle)")
    args = ap.parse_args()

    rep = validate.run()
    if rep.errors:
        print("\nbuild: aborted — fix validation errors first.", flush=True)
        return 1

    base = site_url()
    payload = {name: load_collection(name) for name in COLLECTIONS}
    payload["media"] = [{**m, "url": f"{base}/media/{m['file']}"} for m in payload["media"]]
    payload["live"] = load_json(CONTENT / "live.json", default={})

    prev = previous_manifest()
    content = None
    if prev:
        candidate = render(payload, prev["version"], prev["generatedAt"])
        if hashlib.sha256(candidate).hexdigest() == prev.get("sha256"):
            content, version, generated_at = candidate, prev["version"], prev["generatedAt"]
            print("\nbuild: content unchanged — keeping version", version)
    if content is None:
        version = int(time.time())
        if prev and isinstance(prev.get("version"), int):
            version = max(version, prev["version"] + 1)  # strictly increasing
        generated_at = utc_now()
        content = render(payload, version, generated_at)
        print(f"\nbuild: new version {version}")

    sha = hashlib.sha256(content).hexdigest()
    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "version": version,
        "sha256": sha,
        "generatedAt": generated_at,
        "contentUrl": "content.json",
    }
    BUILD_DIR.mkdir(parents=True, exist_ok=True)
    content_path = BUILD_DIR / "content.json"
    manifest_path = BUILD_DIR / "manifest.json"
    if not content_path.exists() or content_path.read_bytes() != content:
        content_path.write_bytes(content)
    manifest_bytes = (json.dumps(manifest, sort_keys=True, indent=2) + "\n").encode("utf-8")
    if not manifest_path.exists() or manifest_path.read_bytes() != manifest_bytes:
        manifest_path.write_bytes(manifest_bytes)
    print(f"wrote public/content/v1/content.json ({len(content):,} bytes, sha256 {sha[:12]}…)")
    print("wrote public/content/v1/manifest.json")

    if args.snapshot:
        dest = args.snapshot.expanduser()
        if not dest.parent.exists():
            warn(f"snapshot directory {dest.parent} does not exist — creating it")
            dest.parent.mkdir(parents=True)
        shutil.copyfile(content_path, dest)
        print(f"snapshot → {dest}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

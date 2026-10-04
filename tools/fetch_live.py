#!/usr/bin/env python3
"""Refresh content/live.json from NASA Exoplanet Archive and JPL Horizons.

Every value carries its own `fetchedAt`. When a source fails, the previous value
(with its previous `fetchedAt`) is kept from the existing live.json. A source
being down never fails the run: warnings go to stderr and the exit code is 0.

Formats confirmed 2026-10-04:
- Exoplanet Archive TAP sync, format=json -> JSON array of row objects,
  e.g. [{"count(*)": N}] and [{"pl_name": ..., "pl_rade": ..., ...}].
- Horizons API, format=json -> {"signature": {...}, "result": "<text>"}; the
  text holds the ephemeris table between $$SOE and $$EOE, one row per epoch:
  " 2026-Oct-04 00:00:00.000     <delta AU> <deldot km/s>".
"""

from __future__ import annotations

import re
import sys
import time
from datetime import datetime, timedelta, timezone

import requests

from common import CONTENT, TIMEOUT, USER_AGENT, load_json, utc_now, warn, write_json

LIVE_PATH = CONTENT / "live.json"
TAP_URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
HORIZONS_URL = "https://ssd.jpl.nasa.gov/api/horizons.api"
AU_LIGHT_SECONDS = 499.005

HORIZONS_IDS = {
    "mercury": "199",
    "venus": "299",
    "moon": "301",
    "mars": "499",
    "jupiter": "599",
    "europa": "502",
    "titan": "606",
    "pluto": "999",
}

FLOAT_RE = re.compile(r"^[-+]?\d+\.\d*(?:[eE][-+]?\d+)?$")

session = requests.Session()
session.headers["User-Agent"] = USER_AGENT


def get_json(url: str, params: dict, attempts: int = 2):
    last: Exception | None = None
    for i in range(attempts):
        try:
            r = session.get(url, params=params, timeout=TIMEOUT)
            r.raise_for_status()
            return r.json()
        except (requests.RequestException, ValueError) as e:
            last = e
            if i + 1 < attempts:
                time.sleep(2)
    raise RuntimeError(f"{url}: {last}")


def tap(query: str) -> list:
    rows = get_json(TAP_URL, {"query": query, "format": "json"})
    if not isinstance(rows, list):
        raise ValueError(f"TAP: expected a JSON array, got {type(rows).__name__}")
    return rows


def fetch_exoplanet_count() -> int:
    rows = tap("select count(*) from pscomppars")
    if len(rows) != 1 or not isinstance(rows[0], dict) or len(rows[0]) != 1:
        raise ValueError(f"TAP count: unexpected shape {rows!r:.200}")
    (value,) = rows[0].values()
    if not isinstance(value, int) or isinstance(value, bool) or value <= 0:
        raise ValueError(f"TAP count: not a positive integer: {value!r}")
    return value


def fetch_trappist1e() -> dict:
    rows = tap("select pl_name,pl_rade,pl_bmasse,pl_eqt,pl_orbper from pscomppars where pl_name='TRAPPIST-1 e'")
    if len(rows) != 1 or rows[0].get("pl_name") != "TRAPPIST-1 e":
        raise ValueError(f"TAP TRAPPIST-1 e: expected one row, got {rows!r:.200}")
    row = rows[0]

    def num(key):
        v = row.get(key)
        if v is None:
            return None
        if not isinstance(v, (int, float)) or isinstance(v, bool):
            raise ValueError(f"TAP TRAPPIST-1 e: {key} is not a number: {v!r}")
        return float(v)

    out = {
        "radiusEarth": num("pl_rade"),
        "massEarth": num("pl_bmasse"),
        "eqTempK": num("pl_eqt"),
        "periodDays": num("pl_orbper"),
    }
    if all(v is None for v in out.values()):
        raise ValueError("TAP TRAPPIST-1 e: every parameter is null")
    return out


def parse_horizons_delta(text: str) -> float:
    """Return the first-epoch observer range (delta, AU) from a Horizons QUANTITIES=20 table."""
    if "$$SOE" not in text or "$$EOE" not in text:
        # Horizons reports errors (unknown body, bad parameter) as plain text in `result`.
        snippet = " ".join(text.strip().split())[:200]
        raise ValueError(f"no $$SOE/$$EOE block: {snippet}")
    header = text[: text.index("$$SOE")]
    if "delta" not in header:
        raise ValueError("table header has no 'delta' column")
    block = text[text.index("$$SOE") + 5 : text.index("$$EOE")]
    for line in block.splitlines():
        if not line.strip():
            continue
        # Row: date, time, optional one-char flags, delta, deldot. Take the first float.
        floats = [t for t in line.split() if FLOAT_RE.match(t)]
        if not floats:
            raise ValueError(f"no numeric column in row: {line.strip()!r}")
        au = float(floats[0])
        if not (0 < au < 100):
            raise ValueError(f"delta out of range: {au}")
        return au
    raise ValueError("empty $$SOE/$$EOE block")


def fetch_distance_au(body_id: str) -> float:
    now = datetime.now(timezone.utc).replace(second=0, microsecond=0)
    params = {
        "format": "json",
        "COMMAND": f"'{body_id}'",
        "OBJ_DATA": "'NO'",
        "MAKE_EPHEM": "'YES'",
        "EPHEM_TYPE": "'OBSERVER'",
        "CENTER": "'500@399'",
        "START_TIME": f"'{now:%Y-%m-%d %H:%M}'",
        "STOP_TIME": f"'{now + timedelta(minutes=1):%Y-%m-%d %H:%M}'",
        "STEP_SIZE": "'1'",
        "QUANTITIES": "'20'",
    }
    data = get_json(HORIZONS_URL, params)
    if not isinstance(data, dict) or not isinstance(data.get("result"), str):
        err = data.get("error") if isinstance(data, dict) else None
        raise ValueError(f"Horizons: no 'result' text{f' (error: {err})' if err else ''}")
    return parse_horizons_delta(data["result"])


def main() -> int:
    prev = load_json(LIVE_PATH, default={}) or {}
    failures: list[str] = []

    live = {
        "generatedAt": utc_now(),
        "exoplanetCount": prev.get("exoplanetCount"),
        "distances": dict(prev.get("distances") or {}),
        "trappist1e": prev.get("trappist1e"),
    }

    try:
        live["exoplanetCount"] = {"value": fetch_exoplanet_count(), "fetchedAt": utc_now()}
        print(f"exoplanetCount   {live['exoplanetCount']['value']}")
    except Exception as e:  # noqa: BLE001 — any failure means "keep previous"
        failures.append("exoplanetCount")
        warn(f"exoplanet count failed, keeping previous value: {e}")

    try:
        live["trappist1e"] = {**fetch_trappist1e(), "fetchedAt": utc_now()}
        t = live["trappist1e"]
        print(f"trappist1e       R={t['radiusEarth']} M={t['massEarth']} Teq={t['eqTempK']} P={t['periodDays']}")
    except Exception as e:  # noqa: BLE001
        failures.append("trappist1e")
        warn(f"TRAPPIST-1 e failed, keeping previous value: {e}")

    for world, body in HORIZONS_IDS.items():
        try:
            au = fetch_distance_au(body)
            live["distances"][world] = {
                "au": round(au, 8),
                "lightSeconds": round(au * AU_LIGHT_SECONDS, 3),
                "fetchedAt": utc_now(),
            }
            print(f"distance {world:<8} {au:.8f} AU = {au * AU_LIGHT_SECONDS:.1f} s")
        except Exception as e:  # noqa: BLE001
            failures.append(f"distance:{world}")
            kept = "keeping previous value" if world in live["distances"] else "no previous value"
            warn(f"Horizons {world} ({body}) failed, {kept}: {e}")
        time.sleep(0.5)  # be polite to Horizons

    live["distances"] = dict(sorted(live["distances"].items()))
    write_json(LIVE_PATH, live)
    print(f"wrote {LIVE_PATH.relative_to(LIVE_PATH.parent.parent)}"
          + (f" ({len(failures)} source(s) failed: {', '.join(failures)})" if failures else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())

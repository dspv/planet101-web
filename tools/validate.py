#!/usr/bin/env python3
"""Validate content/*.json: schemas, ids, references, sheet facts, staleness.

Exit 1 on any error, 0 otherwise (warnings do not fail the run).

    validate.py           # offline checks
    validate.py --links   # also check every external URL answers 200 (weekly CI)
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
import time
from collections import Counter, defaultdict
from datetime import date

from jsonschema import Draft202012Validator
from referencing import Registry, Resource

from common import COLLECTIONS, CONTENT, MEDIA_DIR, SCHEMAS, TIMEOUT, USER_AGENT

FILES = COLLECTIONS + ["live"]
SHEET_FACTS = ["surface_temp", "gravity", "day", "atmosphere", "pressure"]
FACT_STALE_MONTHS = 12
STATUS_STALE_MONTHS = 6


class Report:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def error(self, msg: str) -> None:
        self.errors.append(msg)

    def warn(self, msg: str) -> None:
        self.warnings.append(msg)


def months_ago(today: date, months: int) -> date:
    y, m = divmod(today.year * 12 + (today.month - 1) - months, 12)
    day = min(today.day, 28)  # avoid invalid dates; a few days of slack is fine for a staleness warning
    return date(y, m + 1, day)


def load_registry() -> tuple[Registry, dict]:
    schemas = {}
    resources = []
    for path in sorted(SCHEMAS.glob("*.schema.json")):
        schema = json.loads(path.read_text(encoding="utf-8"))
        schemas[path.name] = schema
        resources.append((schema.get("$id", path.name), Resource.from_contents(schema)))
    return Registry().with_resources(resources), schemas


def describe(record) -> str:
    if isinstance(record, dict) and isinstance(record.get("id"), str):
        return f"id={record['id']}"
    return ""


def format_schema_error(name: str, data, err) -> str:
    path = list(err.absolute_path)
    where = ""
    if path and isinstance(path[0], int) and isinstance(data, list) and path[0] < len(data):
        rid = describe(data[path[0]])
        where = f"[{rid or f'#{path[0]}'}] "
        path = path[1:]
    loc = ".".join(str(p) for p in path) or "(root)"
    if err.validator in ("maxLength", "minLength") and isinstance(err.instance, str):
        limit = err.validator_value
        cmp = ">" if err.validator == "maxLength" else "<"
        msg = f"length {len(err.instance)} {cmp} {err.validator.replace('Length', '')} {limit}"
    else:
        msg = err.message
        if len(msg) > 200:
            msg = msg[:200] + "…"
    return f"{name}.json {where}{loc}: {msg}"


def load_files(rep: Report) -> dict:
    data = {}
    for name in FILES:
        path = CONTENT / f"{name}.json"
        if not path.exists():
            rep.error(f"{name}.json: file missing")
            data[name] = {} if name == "live" else []
            continue
        try:
            data[name] = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            rep.error(f"{name}.json: invalid JSON: {e}")
            data[name] = {} if name == "live" else []
    return data


def check_schemas(rep: Report, data: dict, present: set) -> None:
    registry, schemas = load_registry()
    for name in FILES:
        if name not in present:
            continue
        schema = schemas.get(f"{name}.schema.json")
        if schema is None:
            rep.error(f"{name}.json: no schema content/schemas/{name}.schema.json")
            continue
        validator = Draft202012Validator(schema, registry=registry)
        errs = sorted(validator.iter_errors(data[name]), key=lambda e: list(map(str, e.absolute_path)))
        for err in errs:
            rep.error(format_schema_error(name, data[name], err))


def records(data: dict, name: str) -> list[dict]:
    items = data.get(name)
    return [r for r in items if isinstance(r, dict)] if isinstance(items, list) else []


def check_ids(rep: Report, data: dict) -> dict[str, set]:
    ids = {}
    for name in COLLECTIONS:
        counts = Counter(r.get("id") for r in records(data, name) if isinstance(r.get("id"), str))
        for rid, n in counts.items():
            if n > 1:
                rep.error(f"{name}.json: duplicate id '{rid}' ({n}×)")
        ids[name] = set(counts)
    return ids


def check_refs(rep: Report, data: dict, ids: dict[str, set]) -> None:
    def ref(file: str, rid: str, field: str, value, target: str) -> None:
        if value is None:
            return
        if value not in ids[target]:
            rep.error(f"{file}.json [id={rid}] {field}: '{value}' not found in {target}.json")

    for f in records(data, "facts"):
        rid = f.get("id", "?")
        ref("facts", rid, "worldId", f.get("worldId"), "worlds")
        hwk = f.get("howWeKnow") or {}
        for m in hwk.get("missionIds") or []:
            ref("facts", rid, "howWeKnow.missionIds", m, "missions")
        for m in hwk.get("methodIds") or []:
            ref("facts", rid, "howWeKnow.methodIds", m, "methods")
        fid, wid = f.get("id"), f.get("worldId")
        if isinstance(fid, str) and "." in fid and isinstance(wid, str) and fid.split(".", 1)[0] != wid:
            rep.error(f"facts.json [id={fid}] id prefix does not match worldId '{wid}'")

    for m in records(data, "missions"):
        rid = m.get("id", "?")
        for w in m.get("worldIds") or []:
            ref("missions", rid, "worldIds", w, "worlds")
        for x in m.get("mediaIds") or []:
            ref("missions", rid, "mediaIds", x, "media")
        ref("missions", rid, "parentMissionId", m.get("parentMissionId"), "missions")
        if m.get("parentMissionId") == m.get("id"):
            rep.error(f"missions.json [id={rid}] parentMissionId points to itself")

    for m in records(data, "methods"):
        for x in m.get("missionIds") or []:
            ref("methods", m.get("id", "?"), "missionIds", x, "missions")

    for m in records(data, "media"):
        rid = m.get("id", "?")
        ref("media", rid, "missionId", m.get("missionId"), "missions")
        for w in m.get("worldIds") or []:
            ref("media", rid, "worldIds", w, "worlds")

    live = data.get("live")
    if isinstance(live, dict) and isinstance(live.get("distances"), dict):
        for w in live["distances"]:
            ref("live", "distances", "key", w, "worlds")


def check_sheet_facts(rep: Report, data: dict) -> None:
    facts = {f.get("id"): f for f in records(data, "facts")}
    for w in records(data, "worlds"):
        wid = w.get("id")
        missing = [k for k in SHEET_FACTS if f"{wid}.{k}" not in facts]
        if missing:
            rep.error(f"worlds.json [id={wid}] missing sheet fact(s): {', '.join(f'{wid}.{k}' for k in missing)}")
        g_fact = facts.get(f"{wid}.gravity")
        g = w.get("g")
        if g_fact is not None and isinstance(g, (int, float)):
            v = g_fact.get("value")
            if not isinstance(v, (int, float)) or not math.isclose(v, g, rel_tol=1e-9, abs_tol=1e-12):
                rep.error(f"facts.json [id={wid}.gravity] value {v!r} != worlds.json g {g!r} — scene physics and displayed figure would drift")


NUMBER = re.compile(r"\d+(?:[.,]\d+)?")


def check_survival(rep: Report, data: dict) -> None:
    """worlds.json `survival` (optional): every fact id resolves, and every number
    in helmetOff.text appears in the display of one of helmetOff.factIds — the
    one-liner may not carry a figure that no sourced fact backs."""
    facts = {f.get("id"): f for f in records(data, "facts")}
    for w in records(data, "worlds"):
        surv = w.get("survival")
        if not isinstance(surv, dict):
            continue
        wid = w.get("id", "?")
        groups = [("threats", h) for h in surv.get("threats") or []] + [("safe", h) for h in surv.get("safe") or []]
        helmet = surv.get("helmetOff") or {}
        refs = [(f"survival.{g}.factIds", fid) for g, h in groups if isinstance(h, dict) for fid in h.get("factIds") or []]
        refs += [("survival.helmetOff.factIds", fid) for fid in helmet.get("factIds") or []]
        for field, fid in refs:
            if fid not in facts:
                rep.error(f"worlds.json [id={wid}] {field}: '{fid}' not found in facts.json")
        text = helmet.get("text")
        if isinstance(text, str):
            allowed = set()
            for fid in helmet.get("factIds") or []:
                allowed |= set(NUMBER.findall((facts.get(fid) or {}).get("display") or ""))
            for n in NUMBER.findall(text):
                if n not in allowed:
                    rep.error(f"worlds.json [id={wid}] survival.helmetOff.text: number '{n}' is not in the display of any of its factIds — no source, no figure")


def check_fact_sources(rep: Report, data: dict) -> None:
    for f in records(data, "facts"):
        rid = f.get("id", "?")
        if not (f.get("source") or {}).get("url"):
            rep.error(f"facts.json [id={rid}] no source.url — no source, no fact")
        if not f.get("lastVerified"):
            rep.error(f"facts.json [id={rid}] no lastVerified")


def parse_date(s) -> date | None:
    try:
        return date.fromisoformat(s)
    except (TypeError, ValueError):
        return None


def check_staleness(rep: Report, data: dict, today: date) -> None:
    fact_cutoff = months_ago(today, FACT_STALE_MONTHS)
    for f in records(data, "facts"):
        d = parse_date(f.get("lastVerified"))
        if d and d < fact_cutoff:
            rep.warn(f"facts.json [id={f.get('id')}] lastVerified {d} is older than {FACT_STALE_MONTHS} months")
        if d and d > today:
            rep.error(f"facts.json [id={f.get('id')}] lastVerified {d} is in the future")
    status_cutoff = months_ago(today, STATUS_STALE_MONTHS)
    for m in records(data, "missions"):
        d = parse_date(m.get("statusCheckedAt"))
        if d and d < status_cutoff:
            rep.warn(f"missions.json [id={m.get('id')}] statusCheckedAt {d} is older than {STATUS_STALE_MONTHS} months")
        if d and d > today:
            rep.error(f"missions.json [id={m.get('id')}] statusCheckedAt {d} is in the future")

    by_file = {name: sum(1 for r in records(data, name) if r.get("verifiedBy") == "agent") for name in COLLECTIONS}
    total = sum(by_file.values())
    if total:
        parts = ", ".join(f"{n} {name}" for name, n in by_file.items() if n)
        rep.warn(f"{total} record(s) have verifiedBy: \"agent\" ({parts}) — they still need a human pass")


def check_media_files(rep: Report, data: dict) -> None:
    missing = [m.get("file") for m in records(data, "media") if m.get("file") and not (MEDIA_DIR / m["file"]).exists()]
    if missing:
        shown = ", ".join(missing[:8]) + (f", … (+{len(missing) - 8})" if len(missing) > 8 else "")
        rep.warn(f"{len(missing)} media file(s) not in public/media/ (run `make media-download`): {shown}")


def collect_urls(data: dict) -> dict[str, list[str]]:
    urls: dict[str, list[str]] = defaultdict(list)
    for f in records(data, "facts"):
        u = (f.get("source") or {}).get("url")
        if u:
            urls[u].append(f"facts:{f.get('id')}")
    for m in records(data, "missions"):
        for link in m.get("links") or []:
            if isinstance(link, dict) and link.get("url"):
                urls[link["url"]].append(f"missions:{m.get('id')}")
    for m in records(data, "media"):
        if m.get("sourceUrl"):
            urls[m["sourceUrl"]].append(f"media:{m.get('id')}")
    return urls


def check_links(rep: Report, data: dict, delay: float = 0.5, retries: int = 3) -> None:
    import requests

    session = requests.Session()
    session.headers["User-Agent"] = USER_AGENT
    urls = collect_urls(data)
    print(f"Checking {len(urls)} unique URL(s)…", flush=True)

    def status(url: str) -> str | int:
        last: str | int = "?"
        for attempt in range(retries):
            try:
                r = session.head(url, allow_redirects=True, timeout=TIMEOUT)
                if r.status_code == 200:
                    return 200
                # Many servers refuse or mishandle HEAD; confirm with GET.
                r = session.get(url, allow_redirects=True, timeout=TIMEOUT, stream=True)
                r.close()
                if r.status_code == 200:
                    return 200
                last = r.status_code
                if r.status_code in (404, 410):
                    return last  # permanent, no point retrying
            except requests.RequestException as e:
                last = type(e).__name__
            time.sleep(2 * (attempt + 1))
        return last

    for i, (url, used_by) in enumerate(sorted(urls.items())):
        s = status(url)
        if s != 200:
            refs = ", ".join(used_by[:5]) + (f", … (+{len(used_by) - 5})" if len(used_by) > 5 else "")
            rep.error(f"link {s}: {url}  (used by {refs})")
        if i + 1 < len(urls):
            time.sleep(delay)


def run(links: bool = False, today: date | None = None, quiet: bool = False) -> Report:
    today = today or date.today()
    rep = Report()
    data = load_files(rep)
    present = {n for n in FILES if (CONTENT / f"{n}.json").exists()}
    check_schemas(rep, data, present)
    ids = check_ids(rep, data)
    check_refs(rep, data, ids)
    if "facts" in present:  # a missing facts.json is already one error; skip 50 follow-ups
        check_sheet_facts(rep, data)
        check_survival(rep, data)
    check_fact_sources(rep, data)
    check_staleness(rep, data, today)
    check_media_files(rep, data)
    if links:
        check_links(rep, data)

    if not quiet:
        counts = ", ".join(f"{n} {len(data[n]) if isinstance(data[n], list) else ('ok' if data[n] else '-')}" for n in FILES)
        print(f"Content: {counts}")
        if rep.errors:
            print(f"\nERRORS ({len(rep.errors)})")
            for e in rep.errors:
                print(f"  ✗ {e}")
        if rep.warnings:
            print(f"\nWARNINGS ({len(rep.warnings)})")
            for w in rep.warnings:
                print(f"  ! {w}")
        verdict = "FAILED" if rep.errors else "OK"
        print(f"\nvalidate: {verdict} — {len(rep.errors)} error(s), {len(rep.warnings)} warning(s)")
    return rep


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--links", action="store_true", help="also check every external URL answers 200 (network)")
    args = ap.parse_args()
    rep = run(links=args.links)
    return 1 if rep.errors else 0


if __name__ == "__main__":
    sys.exit(main())

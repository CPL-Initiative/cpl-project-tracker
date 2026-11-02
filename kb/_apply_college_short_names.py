#!/usr/bin/env python3
"""Fold the live college short names into the committed files (S545, 2026-11-02).

The source is the Supabase table public.college_short_names, which a signed-in reviewer edits in the College Identity
tab's Short name column (kb/migrations/2026-11-02_college_short_names.sql; decision right DR-30, Sam's). The daily run's
curation sync runs this before the builders, so every builder in the same run reads the new shorts:

  kb/college_short_names.json   the records every Python builder joins through (the funding roster among them)
  college_short_names.js        window.CPL_COLLEGE_SHORT, cplCollegeShort(name, style), cplCollegeShortRecord(name)

THE RULE IT KEEPS: A NAME A JOIN KEYS ON IS A KEY (S544). The table's trigger keeps a changed short as an alias; this
also carries forward every spelling the committed file could reach (an old CAPS form, an alias), so a college no join
reached yesterday is lost today. It refuses, and leaves both files as they are, when:
  - a committed college is missing from the table (a row is never removed);
  - two colleges answer to one spelling once normalized (the resolver would hand one college's rows to the other);
  - a short is empty.
When nothing changed it writes nothing, so the daily run commits no date-only churn.

Run (daily-dashboard.yml, Sync curation overlay):  python3 kb/_apply_college_short_names.py
Offline or in a test:   python3 kb/_apply_college_short_names.py --rows ROWS.json [--json-out P] [--js-out P]
Report only:            add --check (exit 1 when the files would change, 0 when current)
Exit codes: 0 written or current (or the table could not be read: skipped, files kept); 1 --check found a change;
            3 refused (the reason on stdout as a ::warning:: line, the files kept).
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
JSON_PATH = os.path.join(HERE, "college_short_names.json")
JS_PATH = os.path.join(ROOT, "college_short_names.js")
URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY")
PAGE = 1000

_spec = importlib.util.spec_from_file_location("seed_short_names", os.path.join(HERE, "_seed_college_short_names.py"))
SEED = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(SEED)
normalize = SEED.normalize


class Refused(Exception):
    pass


def fetch_rows():
    """Every row of the table, Range-paginated (Rule 10 b), with two retries on a transient failure."""
    out, start = [], 0
    while True:
        qs = urllib.parse.urlencode({"select": "canonical,short,short_caps,aliases", "order": "canonical"})
        req = urllib.request.Request(f"{URL}/rest/v1/college_short_names?{qs}", headers={
            "apikey": KEY, "Authorization": f"Bearer {KEY}", "Accept": "application/json",
            "Range-Unit": "items", "Range": f"{start}-{start + PAGE - 1}"})
        for attempt in range(3):
            try:
                with urllib.request.urlopen(req, timeout=30) as r:
                    page = json.load(r)
                break
            except Exception:
                if attempt == 2:
                    raise
                time.sleep(2 * (attempt + 1))
        out.extend(page)
        if len(page) < PAGE:
            return out
        start += PAGE


def spellings(rec):
    return [s for s in [rec.get("canonical"), rec.get("short"), rec.get("short_caps")] + list(rec.get("aliases") or []) if s]


def fold(rows, committed):
    """The records to publish: the table's rows, every committed spelling carried forward. Raises Refused."""
    by_canon = {}
    for r in rows:
        c = str(r.get("canonical") or "").strip()
        short = " ".join(str(r.get("short") or "").split())
        if not c:
            continue
        if not short:
            raise Refused(f"{c} has an empty short name.")
        by_canon[c] = {"canonical": c, "short": short,
                       "short_caps": " ".join(str(r.get("short_caps") or short.upper()).split()),
                       "aliases": [a for a in (r.get("aliases") or []) if a]}
    missing = [rec["canonical"] for rec in committed if rec["canonical"] not in by_canon]
    if missing:
        raise Refused(f"{len(missing)} committed colleges are missing from the table ({', '.join(missing[:5])}); "
                      "a row is never removed.")
    # Carry forward: a spelling the committed file reached a college by still reaches it.
    carried = []
    for old in committed:
        rec = by_canon[old["canonical"]]
        have = {normalize(s) for s in spellings(rec)}
        for s in spellings(old):
            if normalize(s) not in have:
                rec["aliases"].append(s)
                have.add(normalize(s))
                carried.append((rec["canonical"], s))
    seen, clashes = {}, []
    for rec in by_canon.values():
        for s in spellings(rec):
            k = normalize(s)
            if k in seen and seen[k] != rec["canonical"]:
                clashes.append(f'"{s}" ({rec["canonical"]} and {seen[k]})')
            seen.setdefault(k, rec["canonical"])
    if clashes:
        raise Refused(f"two colleges answer to one spelling: {'; '.join(sorted(set(clashes))[:5])}.")
    records = []
    for c in sorted(by_canon, key=str.lower):
        rec = by_canon[c]
        rec["aliases"] = sorted(set(rec["aliases"]))
        records.append(rec)
    return records, carried


def meta_for(records, previous_meta, changed):
    meta = dict(previous_meta or {})
    meta["source"] = ("public.college_short_names (Supabase), edited in the College Identity tab's Short name column; "
                      "seeded 2026-11-02 (S545) from the curator-provided mapping (MAP@rccd.edu).")
    meta["generator"] = "kb/_apply_college_short_names.py (the daily run's curation sync)"
    meta["rule"] = ("A changed short keeps the old one as an alias (the table's trigger), and every spelling the committed "
                    "file reached a college by is carried forward, so no join loses a college.")
    meta["count"] = len(records)
    if changed or "generated" not in meta:
        meta["generated"] = date.today().isoformat()
    return meta


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--rows", help="read the table's rows from this JSON file instead of Supabase")
    ap.add_argument("--json-out", default=JSON_PATH)
    ap.add_argument("--js-out", default=JS_PATH)
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args(argv)

    committed_doc = json.load(open(a.json_out, encoding="utf-8")) if os.path.exists(a.json_out) else {"colleges": []}
    committed = committed_doc.get("colleges", [])
    if a.rows:
        rows = json.load(open(a.rows, encoding="utf-8"))
    elif not KEY:
        print("SUPABASE_SERVICE_KEY not set: the short names were not read; the committed files stay.")
        return 0
    else:
        try:
            rows = fetch_rows()
        except Exception as e:
            print(f"::warning title=College short names not read::{e}; the committed files stay.")
            return 0
    try:
        records, carried = fold(rows, committed)
    except Refused as e:
        print(f"::warning title=College short names refused::{e} The committed files stay; fix the row in the "
              "College Identity tab.")
        return 3

    def key(recs):
        return json.dumps([[r["canonical"], r["short"], r["short_caps"], sorted(r.get("aliases") or [])] for r in recs],
                          ensure_ascii=False)
    changed = key(records) != key(committed)
    js_current = os.path.exists(a.js_out) and "cplCollegeShortRecord" in open(a.js_out, encoding="utf-8").read()
    for c, s in carried:
        print(f"carried forward: {c} still answers to \"{s}\"")
    if not changed and js_current:
        print(f"college short names: {len(records)} colleges, nothing changed.")
        return 0
    if a.check:
        print(f"college short names: the files would change ({len(records)} colleges).")
        return 1
    if changed:
        doc = {"_meta": meta_for(records, committed_doc.get("_meta"), True), "colleges": records}
        with open(a.json_out, "w", encoding="utf-8") as f:
            json.dump(doc, f, indent=2, ensure_ascii=False)
            f.write("\n")
    js = SEED.JS_TEMPLATE.replace("__GENERATED__", date.today().isoformat()).replace("__COUNT__", str(len(records))) \
        .replace("__DATA__", json.dumps(records, ensure_ascii=False, separators=(",", ":")))
    with open(a.js_out, "w", encoding="utf-8") as f:
        f.write(js)
    print(f"college short names: wrote {len(records)} colleges" + (" (records changed)" if changed else " (resolver only)"))
    return 0


if __name__ == "__main__":
    sys.exit(main())

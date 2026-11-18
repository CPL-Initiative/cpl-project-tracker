#!/usr/bin/env python3
"""Apply the leftover-title decisions to kb/unified_titles.json: one raw key's link, nothing else (S678, COBIx's item 2).

Sam, 2026-11-17: "These are local exhibit titles, right? I don't change those, just canonicalized titles they sit
under." A decision is a kb_curation row `_LEFT_MAP::<raw local title>` + left_map_decision, written from the Exhibits
List's leftover-title rows (exhibits.js leftSave):

- keep: nothing changes in the file; the title stays a search name of its canonical title, and the List no longer
  shows it as waiting.
- moved:<canonical title>: that one raw key's unified_title becomes the named canonical title. No articulation is
  reminted, no credential is renamed or retired, and kb/unclassified_fold/retires.json is never written: this is
  deliberately not the fold's path (kb/_fold_unclassified.py) nor the reviewed rename apply (kb/_cred_rename_apply.py).
- removed: the raw key and its history stay (so a college entering the title again links it back rather than landing
  on the review queue); the row gains `left_map: {decision: "removed", from: <canonical>}` and the reference bake
  (excel_to_dashboard.py) leaves it out of that canonical's local titles.

Every applied row gains `left_map: {decision, from, at}`, so `git revert` of the commit undoes it, and the receipt
this script writes beside it lists every before-value.

    python3 kb/_apply_left_map.py --rows ROWS.json            # dry run: what would change
    python3 kb/_apply_left_map.py --rows ROWS.json --apply    # write unified_titles.json and the receipt
    python3 kb/_apply_left_map.py --live --apply              # the nightly: read the rows from kb_curation itself

ROWS.json is a list of {course_id, value, reviewed_at} read from kb_curation (field left_map_decision). --live reads
the same rows with SUPABASE_SERVICE_KEY (read only, Range-paged, the newest row per title kept). The script writes
repo files alone, and only when something changes: kb/unified_titles.json and kb/receipts/left_map_apply_<stamp>.json.
It writes no Supabase row.

The nightly (S679): scripts/daily_build.sh runs it in "Sync curation overlay from Supabase", after the unclassified fold
and before excel_to_dashboard.py reads kb/unified_titles.json. A failed read or write exits non-zero; the step records
LEFT_MAP_STATUS=failed and daily-dashboard.yml's last step turns the run red, so the workflow failure watch opens its
issue while the dashboard still publishes.
"""
import argparse
import datetime
import json
import os
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UT = "kb/unified_titles.json"
PREFIX = "_LEFT_MAP::"


def plan(ut, rows, canonicals):
    """[(raw, decision, before, after)] for the rows that change the file; skips with their reason."""
    out, skips = [], []
    for row in rows:
        cid, val = str(row.get("course_id") or ""), str(row.get("value") or "").strip()
        if not cid.startswith(PREFIX):
            continue
        raw = cid[len(PREFIX):]
        ent = ut.get(raw)
        if ent is None:
            skips.append((raw, "no such local title in the reference"))
            continue
        cur = ent.get("unified_title")
        prev = (ent.get("left_map") or {})
        if val == "keep":
            continue
        if val.startswith("moved:"):
            to = val[len("moved:"):].strip()
            if not to or to not in canonicals:
                skips.append((raw, "the canonical title it names is not in the reference: " + to))
                continue
            if cur == to and prev.get("decision") == "moved":
                continue
            out.append((raw, "moved", cur, to, row.get("reviewed_at")))
        elif val == "removed":
            if prev.get("decision") == "removed":
                continue
            out.append((raw, "removed", cur, cur, row.get("reviewed_at")))
        else:
            skips.append((raw, "an unknown decision: " + val))
    return out, skips


def latest(rows):
    """The newest row per title (reviewed_at, then the order read), so a later decision replaces an earlier one."""
    best = {}
    for row in rows:
        cid = str(row.get("course_id") or "")
        if not cid.startswith(PREFIX):
            continue
        if cid not in best or str(row.get("reviewed_at") or "") >= str(best[cid].get("reviewed_at") or ""):
            best[cid] = row
    return [best[k] for k in sorted(best)]


def fetch_live(page_size=1000, tries=3):
    """Every left_map_decision row, Range-paged in a stable order (CLAUDE.md Rule 10 b). Read only."""
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        raise SystemExit("--live needs SUPABASE_SERVICE_KEY in the environment")
    url = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
    endpoint = (url + "/rest/v1/kb_curation?select=course_id,field,value,reviewed_at"
                "&field=eq.left_map_decision&course_id=like." + PREFIX.replace(":", "%3A") + "%25"
                "&order=course_id.asc,reviewed_at.asc")
    rows, start = [], 0
    while True:
        req = urllib.request.Request(endpoint, headers={
            "apikey": key, "Authorization": "Bearer " + key, "Accept": "application/json",
            "Range-Unit": "items", "Range": "%d-%d" % (start, start + page_size - 1)})
        for attempt in range(tries):
            try:
                with urllib.request.urlopen(req, timeout=30) as r:
                    page = json.load(r)
                break
            except Exception:  # a transient network or TLS blip: retry, then fail loud
                if attempt == tries - 1:
                    raise
                time.sleep(2 * (attempt + 1))
        if not isinstance(page, list):
            raise RuntimeError("kb_curation answered something other than a list of rows")
        rows.extend(page)
        if len(page) < page_size:
            return rows
        start += page_size


def apply(ut, changes):
    for raw, dec, before, after, at in changes:
        ent = ut[raw]
        ent["unified_title"] = after
        ent["left_map"] = {"decision": dec, "from": before, "at": at}
    return ut


def main(argv=None):
    ap = argparse.ArgumentParser()
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument("--rows")
    src.add_argument("--live", action="store_true")
    ap.add_argument("--apply", action="store_true")
    a = ap.parse_args(argv)
    with open(os.path.join(ROOT, UT), encoding="utf-8") as f:
        ut = json.load(f)
    if a.live:
        rows = fetch_live()
        print("read %d left_map_decision rows from kb_curation" % len(rows))
    else:
        with open(a.rows, encoding="utf-8") as f:
            rows = json.load(f)
    rows = latest(rows)
    canonicals = {e.get("unified_title") for e in ut.values() if e.get("unified_title")}
    changes, skips = plan(ut, rows, canonicals)
    for raw, why in skips:
        print("skip: %r: %s" % (raw, why))
    if skips and os.environ.get("GITHUB_ACTIONS"):
        print("::warning title=Leftover-title decisions skipped::%d decision(s) name a title or canonical title the "
              "reference does not hold; see the step log." % len(skips))
    for raw, dec, before, after, _ in changes:
        print("%s: %r: %s -> %s" % (dec, raw, before, after))
    if not a.apply:
        print("dry run: %d changes, %d skips" % (len(changes), len(skips)))
        return 0
    if not changes:
        print("nothing to apply: %d skips; no file written" % len(skips))
        return 0
    # The receipt first (Rule 10 a2): a write that fails after it still leaves every before-value on disk.
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H%MZ")
    rec = os.path.join(ROOT, "kb", "receipts", "left_map_apply_" + stamp + ".json")
    os.makedirs(os.path.dirname(rec), exist_ok=True)
    with open(rec, "w", encoding="utf-8") as f:
        json.dump({"what": "kb/_apply_left_map.py", "at": stamp, "changes": [
            {"raw": r, "decision": d, "before": b, "after": t} for r, d, b, t, _ in changes]}, f, indent=1, ensure_ascii=False)
    apply(ut, changes)
    with open(os.path.join(ROOT, UT), "w", encoding="utf-8") as f:
        f.write(json.dumps(ut, indent=2, ensure_ascii=False) + "\n")
    print("applied %d; receipt %s" % (len(changes), os.path.relpath(rec, ROOT)))
    return 0


if __name__ == "__main__":
    sys.exit(main())

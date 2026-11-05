#!/usr/bin/env python3
"""Publish the Library drafts a person approved on their card (library-publish.yml).

Sam, 2026-11-05 (SkyBarnard, in session): "Build it", on revising a visual from the Library
card without a session. library-revise-draft drafts a revision of a piece's public page into
cpl_library_drafts and sets regen.ready_at and regen.draft_id on the record. When a person
presses Replace the public copy (regen.approved_at), or asked for it at once when requesting
(regen.publish == "replace"), this script, in the workflow's scheduled run:

  --write    reads every such record and its draft with the service key, writes the draft to
             library/<slug>/index.html, and writes a receipt per piece under
             kb/receipts/library_publish/ holding the record's before-values and the update
             it will make (Rule 10 a2). The workflow commits the pages and receipts to main.
  --finish   with the pushed commit: stamps each draft published, then moves each record
             (the new version Current, the one before it Replaced, Changes to make emptied,
             regen cleared), each a guarded update on the updated_at it read, so an edit made
             on the card since the read wins and the record is left for the next run.

It writes no other file and no other table. A record whose page is not a Pages copy, or whose
draft is missing, is skipped and named. Test: tests/library_publish_test.py.

    SUPABASE_SERVICE_KEY=... python3 scripts/library_publish.py --write
    SUPABASE_SERVICE_KEY=... python3 scripts/library_publish.py --finish --commit <sha>
"""
import argparse
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
PAGES = "https://cpl-initiative.github.io/cpl-project-tracker/library/"
RECEIPTS = ROOT / "kb" / "receipts" / "library_publish"
SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
BOT = "library-publish@bot"


# ── pure ──────────────────────────────────────────────────────────────────────
def due(record):
    """A record whose approved draft from the card waits to be published."""
    g = record.get("regen") if isinstance(record.get("regen"), dict) else None
    if not g or not g.get("draft_id") or not g.get("ready_at"):
        return False
    return bool(g.get("approved_at")) or g.get("publish") == "replace"


def next_version(record):
    v = str(record.get("version") or "").strip()
    return int(v) + 1 if v.isdigit() else None


# Fix 3 (Sam, 2026-11-05: "build fixes 1-3"): a draft the card's model made edits the page, never the script
# that builds it, so publishing one leaves that script behind the public copy. The version it makes carries
# source_behind, and the card's Needs attention counts it until a version built from the source replaces it.
SCRIPT = re.compile(r"\.py\b|\.mjs\b|\.js\b|build")


def source_behind(record, draft):
    """True when the model drafted the page and the record names a script that rebuilds it. Pure."""
    return bool(draft.get("model")) and bool(SCRIPT.search(str(record.get("rebuild_from") or "")))


def record_update(record, draft, today):
    """The update that makes the draft the record's current version. Pure."""
    g = record["regen"]
    n = next_version(record)
    label = f"Version {n}" if n else "Revised " + today
    versions = [dict(x) for x in (record.get("versions") or []) if isinstance(x, dict)]
    versions = [x for x in versions if not (x.get("label") == label and str(x.get("status", "")).startswith("Draft"))]
    for x in versions:
        if x.get("status") == "Current":
            x["status"] = "Replaced by " + (f"v{n}" if n else label)
    who = g.get("approved_by") or g.get("requested_by") or "the team"
    note = (draft.get("summary") or "Revised from the card.").strip()
    entry = {"url": PAGES + record["slug"] + "/", "date": today, "label": label,
             "status": f"Current: {note} Drafted from the card by {draft.get('made_by') or 'the team'} "
                       f"(draft {draft['id']}); replaced the public copy on {who}'s approval."}
    if source_behind(record, draft):
        entry["source_behind"] = True
    versions.append(entry)
    out = {"versions": versions, "refresh_note": None, "regen": None, "updated_by": BOT,
           "url": PAGES + record["slug"] + "/"}
    if n:
        out["version"] = str(n)
    return out


def receipt(record, draft, update, today):
    keys = sorted(set(update) | {"updated_at"})
    return {"_about": "Library publish receipt (scripts/library_publish.py): the record's before-values and the update "
                      "--finish makes, guarded on updated_at; cpl_library_history also files the prior row. Roll back by "
                      "writing the before-values and reverting the page's commit.",
            "at": today, "slug": record["slug"], "record_id": record["id"], "draft_id": draft["id"],
            "page": f"library/{record['slug']}/index.html",
            "before": {k: record.get(k) for k in keys}, "update": update}


# ── I/O ───────────────────────────────────────────────────────────────────────
def api(path, method="GET", body=None, headers=None):
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        sys.exit("Set SUPABASE_SERVICE_KEY (the service role key).")
    h = {"apikey": key, "Authorization": "Bearer " + key, "Content-Type": "application/json",
         "Prefer": "return=representation"}
    h.update(headers or {})
    req = urllib.request.Request(f"{URL}/rest/v1/{path}", method=method, headers=h,
                                 data=None if body is None else json.dumps(body).encode())
    with urllib.request.urlopen(req, timeout=60) as r:
        t = r.read().decode()
        return json.loads(t) if t else None


def write_phase(today):
    rows = api("cpl_library?select=id,slug,title,url,version,versions,refresh_note,rebuild_from,regen,updated_at"
               "&regen=not.is.null&retired_at=is.null")
    done, skipped = [], []
    for r in rows:
        if not due(r):
            continue
        if not SLUG.match(r.get("slug") or "") or not (ROOT / "library" / r["slug"] / "index.html").exists():
            skipped.append(f"{r.get('slug')}: no Pages copy at library/<slug>/")
            continue
        did = urllib.parse.quote(r["regen"]["draft_id"])
        d = api(f"cpl_library_drafts?id=eq.{did}&library_id=eq.{r['id']}&select=id,slug,html,summary,made_by,model,published_at")
        if not d:
            skipped.append(f"{r['slug']}: draft {r['regen']['draft_id']} not found")
            continue
        d = d[0]
        (ROOT / "library" / r["slug"] / "index.html").write_text(d["html"], encoding="utf-8")
        up = record_update(r, d, today)
        RECEIPTS.mkdir(parents=True, exist_ok=True)
        (RECEIPTS / f"{today}-{r['slug']}.json").write_text(
            json.dumps(receipt(r, d, up, today), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        done.append(r["slug"])
    print(json.dumps({"published": done, "skipped": skipped}))
    return 0


def finish_phase(today, commit):
    if not re.match(r"^[0-9a-f]{7,40}$", commit or ""):
        sys.exit("--finish needs --commit <sha>")
    left = []
    for p in sorted(RECEIPTS.glob(f"{today}-*.json")):
        rc = json.loads(p.read_text(encoding="utf-8"))
        api(f"cpl_library_drafts?id=eq.{rc['draft_id']}&published_at=is.null", "PATCH",
            {"published_at": datetime.now(timezone.utc).isoformat(), "published_commit": commit})
        guard = urllib.parse.quote(rc["before"]["updated_at"])
        got = api(f"cpl_library?id=eq.{rc['record_id']}&updated_at=eq.{guard}", "PATCH", rc["update"])
        if not got:
            left.append(rc["slug"])
    print(json.dumps({"finished": today, "left_for_next_run": left}))
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--finish", action="store_true")
    ap.add_argument("--commit")
    ap.add_argument("--date", default=datetime.now(timezone.utc).date().isoformat())
    a = ap.parse_args(argv)
    if a.write:
        return write_phase(a.date)
    if a.finish:
        return finish_phase(a.date, a.commit)
    ap.error("--write or --finish")


if __name__ == "__main__":
    sys.exit(main())

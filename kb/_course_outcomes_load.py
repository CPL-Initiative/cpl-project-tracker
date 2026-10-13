#!/usr/bin/env python3
"""Course outcomes load: the filed read into course_outcomes, insert-only, with a receipt.

Sam, Open Asks Sheet 70 card 3 (2026-10-12 20:42Z): "Every course in the loaded
records", SLOs kept by college and course. kb/_course_outcomes_read.py files what
each outline prints (kb/course_outcomes/<host>/read_<run>_p<i>of<n>.json); this
script turns each course into one row per college whose loaded program records
name it, and posts them a batch at a time to course_outcomes_load()
(chatbox/supabase_course_outcomes.sql), which inserts a block the table does not
hold and touches nothing already there. The service key is the only key it takes.

The receipt (kb/receipts/course_outcomes_<host>_<load run>.json) files every id
the load inserted and the statement that deletes them, so a load rolls back from
its receipt (Rule 10 a2).

Usage (runner): python3 kb/_course_outcomes_load.py --host rccd
                python3 kb/_course_outcomes_load.py --host rccd --dry   (counts, no post)
"""
from __future__ import annotations

import argparse
import glob
import hashlib
import json
import os
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "course_outcomes")
RECEIPTS = os.path.join(HERE, "receipts")
RECORDS = os.path.join(HERE, "program_requirements_college")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
LOAD_RPC = "rpc/course_outcomes_load"
# The college codes an integrated outline prints under College:, by host. A course
# is kept for each college its outline names; an outline that names none is kept
# for the colleges whose loaded records name it.
OFFERED_AT = {"rccd": {"RIV": "Riverside City College", "MOV": "Moreno Valley College",
                       "NOR": "Norco College"}}
# The colleges an All Fields report names as its outcome groups, by host (SDCCD keeps
# each college's SLOs under its own Group Title; trial 38350787486). A group whose
# title is not here is skipped with its reason, never guessed.
GROUPS = {"sdccd": {"City": "San Diego City College", "Mesa": "San Diego Mesa College",
                    "Miramar": "San Diego Miramar College"}}
BATCH = 200


def college_of(slug: str) -> str:
    """The registry name a college's loaded records carry."""
    for path in sorted(glob.glob(os.path.join(RECORDS, slug, "records", "*.json"))):
        name = (json.load(open(path)) or {}).get("college")
        if name:
            return name
    raise SystemExit("no loaded records name the college for %s" % slug)


def fingerprint(outcomes: list[str]) -> str:
    return hashlib.md5(json.dumps(outcomes, ensure_ascii=False).encode()).hexdigest()


def read_files(host: str) -> list[str]:
    """The newest complete read of each slice: a later run's slice replaces an earlier one."""
    best: dict[tuple, tuple] = {}
    for path in glob.glob(os.path.join(OUT_DIR, host, "read_*_p*of*.json")):
        d = json.load(open(path))
        if not d.get("complete"):
            continue
        key = (d["part"], d["of"])
        if key not in best or int(d["run"]) > int(best[key][0]):
            best[key] = (d["run"], path)
    return [p for _, p in sorted(best.values(), key=lambda x: x[1])]


def colleges_for(host: str, row: dict, names: dict) -> list[str]:
    codes = OFFERED_AT.get(host) or {}
    printed = [codes[c] for c in row.get("offered_at") or [] if c in codes]
    if printed:
        return printed
    return [names.setdefault(slug, college_of(slug)) for slug in row.get("named_by") or []]


def rows_from(paths: list[str], host: str = "") -> tuple[list[dict], list[dict]]:
    """One row per college and course; a course whose outline printed no outcomes is
    skipped with its reason. A course read as groups (SDCCD) gives one row per group,
    for the college its title names."""
    names: dict[str, str] = {}
    rows, skipped, seen = [], [], set()

    def add(college, r, block, d):
        key = (college, r["code"], r["report"], block["fingerprint"])
        if key in seen:
            return
        seen.add(key)
        rows.append({"college": college, "course_code": r["code"], "course_title": r.get("title"),
                     "heading": block.get("heading"), "lead": block.get("lead"), "outcomes": block["outcomes"],
                     "maps_to": block.get("maps_to"),
                     "shape": block["shape"], "fingerprint": block["fingerprint"], "source_url": r["report"],
                     "source_kind": "course_outline", "source_system": d.get("system", "curriqunet"),
                     "read_run": str(d["run"])})

    for path in paths:
        d = json.load(open(path))
        for r in d["rows"]:
            if r.get("status") == 200 and r.get("shape") == "groups":
                for g in r.get("groups") or []:
                    if not g.get("outcomes"):
                        continue
                    if g.get("fingerprint") != fingerprint(g["outcomes"]):
                        raise SystemExit("%s (%s): the filed fingerprint does not match its outcomes"
                                         % (r.get("code"), g.get("group")))
                    college = (GROUPS.get(host) or {}).get(g.get("group") or "")
                    if not college:
                        skipped.append({"course_code": r.get("code"), "status": r.get("status"),
                                        "shape": "groups", "group": g.get("group"),
                                        "why": "the group names no college this host maps"})
                        continue
                    add(college, r, g, d)
                continue
            if r.get("status") != 200 or r.get("shape") not in ("list", "paragraph") or not r.get("outcomes"):
                skipped.append({"course_code": r.get("code"), "status": r.get("status"), "shape": r.get("shape")})
                continue
            if r.get("fingerprint") != fingerprint(r["outcomes"]):
                raise SystemExit("%s: the filed fingerprint does not match its outcomes" % r.get("code"))
            for college in colleges_for(host, r, names):
                add(college, r, r, d)
    return rows, skipped


def _rpc(body: dict, key: str) -> dict:
    req = urllib.request.Request(
        SUPABASE_URL + "/rest/v1/" + LOAD_RPC, data=json.dumps(body).encode(),
        headers={"apikey": key, "Authorization": "Bearer " + key, "Content-Type": "application/json"},
        method="POST")
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode() or "{}")


def receipt_of(host: str, run: str, paths: list[str], rows: list[dict], skipped: list[dict],
               results: list[dict], error: str | None) -> dict:
    ids = [k["id"] for res in results for k in res.get("inserted_keys") or []]
    return {
        "what": "course_outcomes_load: course SLOs as printed, by college and course (Sheet 70 card 3)",
        "host": host, "load_run": run, "reads": [os.path.relpath(p, os.path.dirname(HERE)) for p in paths],
        "posted": len(rows), "inserted": len(ids), "kept": sum(res.get("kept", 0) for res in results),
        "skipped": len(skipped), "skipped_rows": skipped, "error": error,
        "inserted_keys": [k for res in results for k in res.get("inserted_keys") or []],
        "rollback": ("delete from public.course_outcomes where id in (%s);" % ", ".join(map(str, ids)))
                    if ids else None,
    }


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", required=True, help="the read's host folder, e.g. rccd")
    ap.add_argument("--run", default=os.environ.get("GITHUB_RUN_ID", ""))
    ap.add_argument("--dry", action="store_true")
    a = ap.parse_args(argv)
    paths = read_files(a.host)
    if not paths:
        print("no complete read filed for %s" % a.host)
        return 2
    rows, skipped = rows_from(paths, a.host)
    colleges: dict[str, int] = {}
    for r in rows:
        colleges[r["college"]] = colleges.get(r["college"], 0) + 1
    print("reads: %d; rows: %d (%s); skipped courses: %d"
          % (len(paths), len(rows), ", ".join("%s %d" % kv for kv in sorted(colleges.items())), len(skipped)))
    if a.dry:
        return 0
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        print("SUPABASE_SERVICE_KEY is not set; the load function takes only the service role.")
        return 2
    if not a.run.isdigit():
        print("a numeric run id is required (--run, or GITHUB_RUN_ID)")
        return 2
    results, error = [], None
    for i in range(0, len(rows), BATCH):
        try:
            results.append(_rpc({"p_run": a.run, "p_rows": rows[i:i + BATCH]}, key))
        except Exception as exc:  # the receipt still files what loaded before it
            error = "batch %d: %s" % (i // BATCH + 1, str(exc).splitlines()[0][:300])
            break
    receipt = receipt_of(a.host, a.run, paths, rows, skipped, results, error)
    os.makedirs(RECEIPTS, exist_ok=True)
    path = os.path.join(RECEIPTS, "course_outcomes_%s_%s.json" % (a.host, a.run))
    with open(path, "w") as f:
        json.dump(receipt, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print("load: %d posted, %d inserted, %d kept%s; receipt %s"
          % (len(rows), receipt["inserted"], receipt["kept"], "; STOPPED at " + error if error else "",
             os.path.relpath(path, os.path.dirname(HERE))))
    return 1 if error else 0


if __name__ == "__main__":
    sys.exit(main())

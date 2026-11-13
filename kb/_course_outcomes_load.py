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

--kind objective posts the objective rows only (the objectives reread, S649): the reread's SLO rows are held back
and counted in the receipt (held_back), so an SLO block that changed since its first load is never posted beside
the loaded one by an objectives load. The load is insert-only either way: an objective row never replaces an SLO row.

Usage (runner): python3 kb/_course_outcomes_load.py --host rccd
                python3 kb/_course_outcomes_load.py --host rccd --dry   (counts, no post)
                python3 kb/_course_outcomes_load.py --host rccd --kind objective   (the objectives reread)
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
KINDS = ("all", "slo", "objective")


def only_kind(rows: list[dict], kind: str) -> tuple[list[dict], int]:
    """The rows of one kind ("all" keeps every row), and how many were held back."""
    if kind == "all":
        return rows, 0
    kept = [r for r in rows if r["kind"] == kind]
    return kept, len(rows) - len(kept)


def college_of(slug: str) -> str:
    """The registry name a college's loaded records carry."""
    for path in sorted(glob.glob(os.path.join(RECORDS, slug, "records", "*.json"))):
        name = (json.load(open(path)) or {}).get("college")
        if name:
            return name
    raise SystemExit("no loaded records name the college for %s" % slug)


def fingerprint(outcomes: list[str]) -> str:
    return hashlib.md5(json.dumps(outcomes, ensure_ascii=False).encode()).hexdigest()


def read_files(host: str, slugs: list[str] | None = None) -> list[str]:
    """The newest complete read of each slice: a later run's slice replaces an earlier one. With slugs, only the
    reads whose slugs name one of them (the Coast district files three colleges under cccd: an objectives reread of
    one college must not repost the others)."""
    best: dict[tuple, tuple] = {}
    want = set(slugs or [])
    for path in glob.glob(os.path.join(OUT_DIR, host, "read_*_p*of*.json")):
        d = json.load(open(path))
        if not d.get("complete"):
            continue
        if want and not (want & set(str(d.get("slugs") or "").split(","))):
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

    def add(college, r, block, d, kind="slo"):
        key = (college, r["code"], r["report"], kind, block["fingerprint"])
        if key in seen:
            return
        seen.add(key)
        rows.append({"college": college, "course_code": r["code"], "course_title": r.get("title"), "kind": kind,
                     "heading": block.get("heading"), "lead": block.get("lead"), "outcomes": block["outcomes"],
                     "maps_to": block.get("maps_to"),
                     "shape": block["shape"], "fingerprint": block["fingerprint"], "source_url": r["report"],
                     "source_kind": d.get("source_kind", "course_outline"), "source_system": d.get("system", "curriqunet"),
                     "read_run": str(d["run"])})

    def add_objectives(colleges, r, d):
        """The course objectives a page printed (Sam, 2026-11-02), one row per college beside its SLOs; a read
        filed before the reader took them carries none and adds nothing."""
        items = r.get("objectives") or []
        if r.get("status") != 200 or not items:
            return
        if r.get("objectives_fingerprint") != fingerprint(items):
            raise SystemExit("%s: the filed objectives fingerprint does not match its objectives" % r.get("code"))
        block = {"heading": r.get("objectives_heading"), "lead": r.get("objectives_lead"), "outcomes": items,
                 "maps_to": None, "shape": "list" if len(items) > 1 else "paragraph", "fingerprint": fingerprint(items)}
        for college in colleges:
            add(college, r, block, d, kind="objective")

    for path in paths:
        d = json.load(open(path))
        for r in d["rows"]:
            if r.get("status") == 200 and r.get("objectives"):
                if r.get("shape") == "groups":
                    # A district report prints one set of objectives for the course: each college whose group it names.
                    cols = [(GROUPS.get(host) or {}).get(g.get("group") or "") for g in r.get("groups") or []]
                    add_objectives([c for c in dict.fromkeys(cols) if c], r, d)
                else:
                    add_objectives(colleges_for(host, r, names), r, d)
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


def _lit(v) -> str:
    return "'%s'" % str(v).replace("'", "''")


def rollback_by_key(sent: list[dict]) -> str | None:
    """The delete that holds when a batch's response is lost (S649 review of #3263): every row this load could have
    inserted carries one of the sent rows' (college, read_run) pairs and kinds. read_run is a column of
    course_outcomes (chatbox/supabase_course_outcomes.sql), filed from the read, so a reread's fresh run scopes it
    exactly. It also takes rows an earlier load of the same read inserted, so run it only to undo every load of
    that read."""
    sent = [r for r in sent if r.get("college") and str(r.get("read_run") or "").isdigit()]
    if not sent:
        return None
    kinds = sorted({r.get("kind") or "slo" for r in sent})
    pairs = sorted({(r["college"], str(r["read_run"])) for r in sent})
    return ("delete from public.course_outcomes where kind in (%s) and (college, read_run) in (%s);"
            % (", ".join(_lit(k) for k in kinds), ", ".join("(%s, %s)" % (_lit(c), int(run)) for c, run in pairs)))


def receipt_of(host: str, run: str, paths: list[str], rows: list[dict], skipped: list[dict],
               results: list[dict], error: str | None, kind: str = "all", held_back: int = 0,
               sent: list[dict] | None = None) -> dict:
    """sent: the rows in batches actually posted (a batch that raised is counted: it may have committed).
    Default every row."""
    sent = rows if sent is None else sent
    ids = [k["id"] for res in results for k in res.get("inserted_keys") or []]
    return {
        "what": "course_outcomes_load: course SLOs as printed, by college and course (Sheet 70 card 3)",
        "host": host, "load_run": run, "reads": [os.path.relpath(p, os.path.dirname(HERE)) for p in paths],
        "kind": kind, "held_back": held_back,
        "posted": len(sent), "inserted": len(ids), "kept": sum(res.get("kept", 0) for res in results),
        "skipped": len(skipped), "skipped_rows": skipped, "error": error,
        "inserted_keys": [k for res in results for k in res.get("inserted_keys") or []],
        "rollback": ("delete from public.course_outcomes where id in (%s);" % ", ".join(map(str, ids)))
                    if ids else None,
        "rollback_by_key": rollback_by_key(sent),
        "rollback_note": ("rollback deletes the ids the responses named. When error is set, a batch may have "
                          "committed without its response: use rollback_by_key, which takes every row of the "
                          "sent kinds and (college, read_run) pairs, including any an earlier load of the same "
                          "read inserted."),
    }


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", required=True, help="the read's host folder, e.g. rccd")
    ap.add_argument("--run", default=os.environ.get("GITHUB_RUN_ID", ""))
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--kind", default="all", choices=KINDS,
                    help="objective: post the objective rows only (the objectives reread); default every row")
    ap.add_argument("--slugs", default="", help="only the reads whose slugs name one of these (comma list)")
    a = ap.parse_args(argv)
    paths = read_files(a.host, [x for x in a.slugs.split(",") if x])
    if not paths:
        print("no complete read filed for %s" % a.host)
        return 2
    rows, skipped = rows_from(paths, a.host)
    rows, held_back = only_kind(rows, a.kind)
    if a.kind != "all" and not rows:
        # A kind= line left in .load must never turn a later ordinary load into a silent no-op.
        print("kind=%s found no %s rows in the reads of %s: nothing to load. A stale kind= line in "
              "kb/course_outcomes/.load? Remove it for an ordinary load." % (a.kind, a.kind, a.host))
        return 1
    colleges: dict[str, int] = {}
    for r in rows:
        colleges[r["college"]] = colleges.get(r["college"], 0) + 1
    print("reads: %d; rows: %d (%s); skipped courses: %d; kind %s, held back %d"
          % (len(paths), len(rows), ", ".join("%s %d" % kv for kv in sorted(colleges.items())), len(skipped),
             a.kind, held_back))
    if a.dry:
        return 0
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        print("SUPABASE_SERVICE_KEY is not set; the load function takes only the service role.")
        return 2
    if not a.run.isdigit():
        print("a numeric run id is required (--run, or GITHUB_RUN_ID)")
        return 2
    results, error, sent = [], None, []
    for i in range(0, len(rows), BATCH):
        batch = rows[i:i + BATCH]
        sent.extend(batch)  # counted before the call: a batch that raises may still have committed
        try:
            results.append(_rpc({"p_run": a.run, "p_rows": batch}, key))
        except Exception as exc:  # the receipt still files what loaded before it
            error = "batch %d: %s" % (i // BATCH + 1, (str(exc).splitlines() or [type(exc).__name__])[0][:300])
            break
    receipt = receipt_of(a.host, a.run, paths, rows, skipped, results, error, a.kind, held_back, sent)
    os.makedirs(RECEIPTS, exist_ok=True)
    path = os.path.join(RECEIPTS, "course_outcomes_%s_%s.json" % (a.host, a.run))
    with open(path, "w") as f:
        json.dump(receipt, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print("load: %d posted, %d inserted, %d kept%s; receipt %s"
          % (receipt["posted"], receipt["inserted"], receipt["kept"], "; STOPPED at " + error if error else "",
             os.path.relpath(path, os.path.dirname(HERE))))
    return 1 if error else 0


if __name__ == "__main__":
    sys.exit(main())

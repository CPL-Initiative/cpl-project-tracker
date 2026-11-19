#!/usr/bin/env python3
"""Keep the better record after a paid re-read, before step=reread posts it (S683, d-reread-keep-the-better-s683).

WHY. The reader's page checks (rules A to D, #3514) hand a new page to programs whose filed record places none of its
courses, and at Mendocino and City College of San Francisco the capture also handed other programs a window naming a
larger share of their closed list. A paid read of such a program can come back worse than the record on file
(p-capture-can-lose-passing-page-s671), and step=reread replaces the live row with whatever the newest extraction
run filed. The extraction's own guard (kept_passing) keeps a filed record that passes where the read passes less or
covers less; it never compares two records that fail, nor a placed record against one that places none.

WHAT. After extract=1 has filed a college, this script compares each record whose extracted_run is the filing's run
with the same file at origin/main and keeps the better one. The order of "better", first difference decides:
  1. score.pass true;
  2. score.coverage.pass true;
  3. score.coverage.none_placed false (places_none() where the key is missing);
  4. the higher score.coverage.share (a share either record lacks is no evidence, and the step is skipped);
  5. the arithmetic status: equal, unstated, unequal, incomplete, anything else.
A record with no score (an extraction error) loses every step. A tie keeps the re-read: it is the current catalog
text. A program with no filed record keeps its new record. A worse re-read is replaced by main's file byte for byte,
so its extracted_run is main's and step=reread, which posts only the newest run's records, leaves that row alone.
A program whose live row a person checked (--checked, from the SQL the account names) is restored the same way, so
the branch never offers a re-read over a person's reading; the reread function refuses such a row as well.

It writes <folder>/reread_keep_better.json (run, counts, the restored list with reasons, the next read's hold) and
prints one line a program. It writes nothing to Supabase and calls no model.

THE HOLD. No hold stops a paid read on the ground that a re-read came back worse: the reconcile file's `hold` keys
guard reconcile steps only, and the reader's held() lists (held_no_gain, held_worse_window, held_opens_on_list)
hold a passing filed record only where the new window names no larger share than the one it was read from. The
account says, for each restored program, whether held() holds it at the next read of the same capture
(`next_read_held`), and lists the rest as `next_read_pays` so the conductor can leave them out of a later paid read.

Run from the repo root, after extract=1 filed the college on its branch:
  python3 kb/_program_reread_keep_better.py kb/program_requirements_college/<slug> [--base origin/main]
      [--run <extraction run>] [--checked <json file>] [--dry-run]
"""
import argparse
import glob
import json
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

ACCOUNT = "reread_keep_better.json"
ARITH_ORDER = ("equal", "unstated", "unequal", "incomplete")
CHECKED_SQL = ("select json_agg(control_number order by control_number) from public.program_requirement_records "
               "where college = %s and checked = true;")


def none_placed(score: dict | None) -> bool | None:
    cov = (score or {}).get("coverage") or {}
    if "none_placed" in cov:
        return bool(cov["none_placed"])
    if not score:
        return None
    from _program_requirements_score import places_none
    return places_none(score)


def arith_rank(score: dict | None) -> int:
    status = ((score or {}).get("arithmetic") or {}).get("status")
    return ARITH_ORDER.index(status) if status in ARITH_ORDER else len(ARITH_ORDER)


def share(score: dict | None):
    v = ((score or {}).get("coverage") or {}).get("share")
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def compare(filed: dict | None, reread: dict | None) -> tuple[str, str]:
    """("filed" or "reread", why) for two scores, by the order in the module's docstring; a tie takes the re-read."""
    f, r = filed or None, reread or None
    steps = [
        ("score.pass", lambda s: (s or {}).get("pass") is True),
        ("score.coverage.pass", lambda s: ((s or {}).get("coverage") or {}).get("pass") is True),
        ("coverage.none_placed", lambda s: none_placed(s) is False),
    ]
    for name, good in steps:
        a, b = good(f), good(r)
        if a != b:
            return ("filed", "the filed record holds %s and the re-read does not" % name) if a else \
                   ("reread", "the re-read holds %s and the filed record does not" % name)
    a, b = share(f), share(r)
    if a is not None and b is not None and a != b:
        return ("filed", "the filed record covers more (share %s against %s)" % (a, b)) if a > b else \
               ("reread", "the re-read covers more (share %s against %s)" % (b, a))
    a, b = arith_rank(f), arith_rank(r)
    if a != b:
        fs, rs = (((s or {}).get("arithmetic") or {}).get("status") for s in (f, r))
        return ("filed", "the filed arithmetic reads %s, the re-read's %s" % (fs, rs)) if a < b else \
               ("reread", "the re-read's arithmetic reads %s, the filed record's %s" % (rs, fs))
    return "reread", "equal on every step: the re-read is the current catalog text"


def passes_live(score: dict | None) -> bool:
    from _program_requirements_score import passes_live as pl
    return pl(score)


def brief(score: dict | None) -> dict:
    s = score or {}
    cov = s.get("coverage") or {}
    return {"pass": s.get("pass"), "coverage_pass": cov.get("pass"), "none_placed": none_placed(score),
            "share": share(score), "placed": cov.get("placed"), "listed": cov.get("listed"),
            "arithmetic": (s.get("arithmetic") or {}).get("status"), "passes_live": passes_live(score)}


def git(cwd: str, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(["git", *args], cwd=cwd, capture_output=True)


def base_bytes(root: str, base: str, rel: str) -> bytes | None:
    got = git(root, "show", "%s:%s" % (base, rel))
    return got.stdout if got.returncode == 0 else None


def read_checked(path: str | None) -> set[str] | None:
    """The control numbers whose live row a person checked: a JSON list of numbers or of {control_number} rows."""
    if not path:
        return None
    with open(path) as fh:
        got = json.load(fh) or []
    return {str(x.get("control_number") if isinstance(x, dict) else x) for x in got}


def next_read_held(folder: str, cn: str) -> dict | None:
    """What the reader's held() says of the restored record at the next read of this capture (sources.json's entry)."""
    import _program_requirements_college as C
    try:
        with open(os.path.join(folder, "sources.json")) as fh:
            entry = {x["control_number"]: x for x in json.load(fh)}.get(cn)
    except (OSError, ValueError):
        entry = None
    if not entry:
        return None
    return C.held(os.path.join(folder, "records", cn + ".json"), entry, entry)


def keep_better(folder: str, base: str = "origin/main", run: str | None = None, checked: set[str] | None = None,
                dry_run: bool = False, out=print) -> dict:
    folder = os.path.abspath(folder)
    top = git(folder, "rev-parse", "--show-toplevel")
    if top.returncode != 0:
        raise SystemExit("%s is not inside a git checkout" % folder)
    root = top.stdout.decode().strip()
    base_sha = git(root, "rev-parse", base).stdout.decode().strip() or None
    if not base_sha:
        raise SystemExit("base %s does not resolve; fetch it by name first (git fetch --depth 30 origin main)" % base)
    if run is None:
        with open(os.path.join(folder, "capture.json")) as fh:
            run = str(json.load(fh).get("run") or "")
    run = str(run)
    if not run.isdigit():
        raise SystemExit("no extraction run: capture.json names none and --run was not given")
    acct_path = os.path.join(folder, ACCOUNT)
    earlier: dict = {}
    if os.path.isfile(acct_path):
        with open(acct_path) as fh:
            prior = json.load(fh)
        if str(prior.get("run")) == run:
            earlier = {e["control_number"]: e for e in prior.get("programs") or []}
    rows, college = [], None
    for path in sorted(glob.glob(os.path.join(folder, "records", "*.json"))):
        with open(path, "rb") as fh:
            raw = fh.read()
        rec = json.loads(raw)
        college = college or rec.get("college")
        cn = rec.get("control_number") or os.path.basename(path)[:-5]
        rel = os.path.relpath(path, root)
        if str(rec.get("extracted_run")) != run:
            if cn in earlier:   # restored by an earlier pass over this run: it stays listed as it was decided
                rows.append(earlier[cn])
            continue
        filed_raw = base_bytes(root, base, rel)
        filed = json.loads(filed_raw) if filed_raw is not None else None
        new_score, filed_score = rec.get("score"), (filed or {}).get("score")
        row = {"control_number": cn, "title": rec.get("title"), "award": rec.get("award"),
               "source_url": rec.get("source_url"), "filed_source_url": (filed or {}).get("source_url"),
               "filed_run": (filed or {}).get("extracted_run"), "reread": brief(new_score)}
        if filed is None:
            row.update(outcome="new", why="no filed record on %s" % base)
        else:
            row["filed"] = brief(filed_score)
            row["plain_reread_loses_pass"] = passes_live(filed_score) and not passes_live(new_score)
            if checked is not None and cn in checked:
                row.update(outcome="restored", why="a person checked the live row: the filed record stands")
            else:
                side, why = compare(filed_score, new_score)
                row.update(outcome="restored" if side == "filed" else "kept", why=why)
            if row["outcome"] == "restored" and not dry_run:
                with open(path, "wb") as fh:
                    fh.write(filed_raw)
        rows.append(row)
    for row in rows:
        if row["outcome"] == "restored" and "next_read_held" not in row:
            h = None if dry_run else next_read_held(folder, row["control_number"])
            row["next_read_held"] = (h or {}).get("reason")
        out("%-6s %-15s %s" % (row["control_number"], {"kept": "kept re-read", "restored": "restored filed",
                                                        "new": "new record"}[row["outcome"]], row["why"]))
    after = []
    for path in sorted(glob.glob(os.path.join(folder, "records", "*.json"))):
        with open(path) as fh:
            after.append(json.load(fh))
    kept_passing = {}
    try:
        with open(os.path.join(folder, "kept_passing.json")) as fh:
            kp = json.load(fh)
        if str(kp.get("run")) == run:
            kept_passing = {e["control_number"]: e.get("reason") for e in kp.get("programs") or []}
    except (OSError, ValueError):
        pass
    restored = [r for r in rows if r["outcome"] == "restored"]
    counts = {
        "reread": len(rows), "kept": sum(r["outcome"] == "kept" for r in rows), "restored": len(restored),
        "restored_filed_pass": sum(bool((r.get("filed") or {}).get("passes_live")) for r in restored),
        "new": sum(r["outcome"] == "new" for r in rows),
        "plain_reread_would_lose_pass": sum(bool(r.get("plain_reread_loses_pass")) for r in rows),
        "kept_by_extraction_guard": len(kept_passing),
        "run_places_none_after": sum(1 for r in rows if (r["filed"] if r["outcome"] == "restored" else r["reread"])
                                     .get("none_placed")),
        "folder_places_none_after": sum(1 for rec in after if none_placed(rec.get("score"))),
        "records_after": len(after),
    }
    acct = {
        "college": college, "run": run, "base": base, "base_sha": base_sha,
        "written": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "rule": "first difference decides: score.pass, score.coverage.pass, none_placed false, higher share, "
                "arithmetic equal/unstated/unequal/incomplete; a tie keeps the re-read; no filed record keeps the "
                "new one; a checked live row restores (d-reread-keep-the-better-s683)",
        "checked": sorted(checked) if checked is not None else None,
        "checked_sql": None if checked is not None else CHECKED_SQL % ("'%s'" % (college or "").replace("'", "''")),
        "counts": counts,
        "kept_by_extraction_guard": kept_passing,
        "next_read_pays": sorted(r["control_number"] for r in restored if not r.get("next_read_held")),
        "programs": rows,
    }
    if not dry_run:
        with open(acct_path, "w") as fh:
            json.dump(acct, fh, indent=1, ensure_ascii=False)
            fh.write("\n")
    out("%s run %s: re-read %d, kept %d, restored %d (%d filed passes), new %d; a plain reread would lose %d "
        "filed passes; the extraction's guard kept %d; places none after: %d of this run, %d of %d in the folder%s"
        % (college, run, counts["reread"], counts["kept"], counts["restored"], counts["restored_filed_pass"],
           counts["new"], counts["plain_reread_would_lose_pass"], counts["kept_by_extraction_guard"],
           counts["run_places_none_after"], counts["folder_places_none_after"], counts["records_after"],
           " (dry run: nothing written)" if dry_run else ""))
    return acct


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("folder", help="kb/program_requirements_college/<slug>, after extract=1 filed it")
    ap.add_argument("--base", default="origin/main", help="the ref holding the filed records (default origin/main)")
    ap.add_argument("--run", default=None, help="the extraction run (default: capture.json's run)")
    ap.add_argument("--checked", default=None, help="a JSON file: the control numbers whose live row is checked")
    ap.add_argument("--dry-run", action="store_true", help="print the decisions; write nothing")
    a = ap.parse_args(argv)
    keep_better(a.folder, a.base, a.run, read_checked(a.checked), a.dry_run)
    return 0


if __name__ == "__main__":
    sys.exit(main())

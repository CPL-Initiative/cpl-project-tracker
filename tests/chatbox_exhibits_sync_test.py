#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""chatbox/sync_chatbox_exhibits.py: the nightly refresh of Sierra's exhibit table.

`chatbox_exhibits` stood unrefreshed from about May 2026 until 2026-11-12, when
Malone found Las Positas at 9 noncredit exhibits on the public funding page
against 47 in MAP. What this pins:

  1. THE GRAIN IS THE TABLE'S KEY: one row per (Articulation College, Exhibit
     Title); a title two colleges share is two rows; MAP's test colleges and a
     row with no college or title never reach the table.
  2. THE MODE OF LEARNING RIDES EVERY ROW, and `courses` holds every target
     course while `sample_courses` keeps five for Sierra.
  3. A DRY RUN WRITES NOTHING, and so does --apply with no key or a short pull.
  4. STAGING IS CHUNKED; the first chunk alone truncates; a canceled chunk
     (57014) retries at half the size and never truncates twice after a success.
  5. THE PROMOTE IS ONE TRANSACTION THAT REFUSES A SHORT PULL, and both functions
     are closed to public, anon and authenticated (the migration).

Run: python3 tests/chatbox_exhibits_sync_test.py
"""
import importlib.util
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SCRIPT = os.path.join(ROOT, "chatbox", "sync_chatbox_exhibits.py")
MIGRATION = os.path.join(ROOT, "kb", "migrations", "2026-11-12_chatbox_exhibits_refresh.sql")
ROLLBACK = os.path.join(ROOT, "kb", "migrations", "2026-11-12_chatbox_exhibits_refresh_rollback.sql")

spec = importlib.util.spec_from_file_location("sync_chatbox_exhibits", SCRIPT)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

failures, checks = [], [0]


def check(label, cond, detail=""):
    checks[0] += 1
    print(("PASS  " if cond else "FAIL  ") + label + ("" if cond or not detail else f"  — {detail}"))
    if not cond:
        failures.append(label)


COLS = ["College", "ExhibitID", "Exhibit Title", "Version Number", "Articulation College", "Course",
        "Credit Recommendation", "Collaborative Type", "TOP Code", "CID Number", "Mode Of Learning",
        "CPL Mode of Learning", "CPL Type", "CPL Type Description"]
NC = "Noncredit, community education, and contract education coursework (N)"
SS = "Self-study, exam preparation, other (S)"


def row(artic, eid, title, course, mode=SS, collab="", rec="3 units", top="58", cpl="Credit By Exam"):
    return [artic, eid, title, "1", artic, course, rec, collab, top, "", "", mode, "", cpl]


ROWS = (
    [row("Alpha College", "MAPCXN-A-1-001", "Noncredit Course for AUTO A1", "AUTO A1", NC)]
    + [row("Alpha College", "MAPCXS-W-1-001", "Welding", f"WELD {i}", SS, "CCC Collaborative") for i in range(8)]
    + [row("Beta College", "MAPCXS-W-1-001", "Welding", "WLD 1", SS, "CCC Collaborative")]
    + [row("RivTest City College", "MAPCXS-T-1-001", "Test Exhibit", "X 1")]
    + [row("", "MAPCXS-N-1-001", "No College", "X 1"), row("Alpha College", "MAPCXS-N-1-002", "  ", "X 1")]
)
REPORT = [{"viewName": mod.VIEW, "columnName": COLS, "columnValue": ROWS}]


def main():
    rows = mod.build_rows(REPORT, {"58": "Engineering and Industrial Technologies"})
    by = {(r["college"], r["exhibit_title"]): r for r in rows}
    check("1a: one row per (Articulation College, Exhibit Title)",
          sorted(by) == [("Alpha College", "Noncredit Course for AUTO A1"), ("Alpha College", "Welding"),
                         ("Beta College", "Welding")], str(sorted(by)))
    check("1b: no test college, no blank college, no blank title",
          len(rows) == 3 and all(r["college"] and r["exhibit_title"].strip() for r in rows))
    a1, weld = by[("Alpha College", "Noncredit Course for AUTO A1")], by[("Alpha College", "Welding")]
    check("2a: the mode of learning rides the row", a1["learning_mode"] == NC and weld["learning_mode"] == SS)
    check("2b: courses holds every target course; sample_courses keeps five",
          len(weld["courses"]) == 8 and len(weld["sample_courses"]) == 5 and weld["rec_count"] == 8)
    check("2c: the discipline comes from the TOP lookup, the collaborative type from MAP's column",
          a1["discipline"] == "Engineering and Industrial Technologies"
          and a1["collaborative_type"] == "Local" and weld["collaborative_type"] == "CCC")
    s = mod.summarize(rows)
    check("2d: the summary counts the Noncredit rows", s["noncredit_mode_rows"] == 1 and s["noncredit_mode_colleges"] == 1)

    env = {k: v for k, v in os.environ.items() if not k.startswith("SUPABASE_")}
    with tempfile.TemporaryDirectory() as td:
        src, out = os.path.join(td, "CustomReport_latest.json"), os.path.join(td, "rows.json")
        json.dump(REPORT, open(src, "w", encoding="utf-8"))
        p = subprocess.run([sys.executable, SCRIPT, src, "--out", out], capture_output=True, text=True, env=env)
        check("3a: a dry run exits 0, says so, and writes the rows file only",
              p.returncode == 0 and "dry run" in p.stdout and len(json.load(open(out))) == 3, p.stdout + p.stderr)
        p = subprocess.run([sys.executable, SCRIPT, src, "--apply"], capture_output=True, text=True, env=env)
        check("3b: --apply on a short pull leaves the live table standing",
              p.returncode == 0 and "the live table stands" in p.stdout, p.stdout + p.stderr)
        p = subprocess.run([sys.executable, SCRIPT, os.path.join(td, "absent.json"), "--apply"],
                           capture_output=True, text=True, env=env)
        check("3c: no pull on disk is not an error", p.returncode == 0 and "not found" in p.stdout)

    big = [{"college": "A", "exhibit_title": f"t{i}"} for i in range(2500)]
    calls = []

    def rpc_ok(fn, body, key):
        calls.append((fn, len(body["p_rows"]), body["p_truncate"]))
        return len(body["p_rows"])
    n = mod.stage(big, "k", rpc=rpc_ok)
    check("4a: staging is chunked and only the first chunk truncates",
          n == 2500 and [c[1] for c in calls] == [1000, 1000, 500] and [c[2] for c in calls] == [True, False, False])

    calls.clear()
    state = {"fail": 1}

    def rpc_cancel(fn, body, key):
        if len(calls) == 1 and state["fail"]:
            state["fail"] = 0
            calls.append(("canceled", len(body["p_rows"]), body["p_truncate"]))
            raise mod._RpcError(fn, 500, '{"code":"57014","message":"canceling statement due to statement timeout"}')
        calls.append((fn, len(body["p_rows"]), body["p_truncate"]))
        return len(body["p_rows"])
    n = mod.stage(big, "k", rpc=rpc_cancel)
    check("4b: a canceled chunk retries at half the size, every row lands once, and it never truncates again",
          n == 2500 and calls[1][0] == "canceled" and calls[2][1] == 500 and not any(c[2] for c in calls[1:]),
          str(calls))

    def rpc_other(fn, body, key):
        raise mod._RpcError(fn, 403, "forbidden")
    try:
        mod.stage(big, "k", rpc=rpc_other)
        stopped = False
    except mod._RpcError:
        stopped = True
    check("4c: any other error stops the run", stopped)

    sql = open(MIGRATION, encoding="utf-8").read()
    promote = sql[sql.index("function public.chatbox_exhibits_promote"):sql.index("-- Closed to everyone")]
    check("5a: the promote refuses a short pull before it changes a row",
          promote.index("raise exception") < promote.index("delete from public.chatbox_exhibits")
          and "staged <> p_expected" in promote and "staged < live * 0.7" in promote)
    check("5b: its floor is the script's floor", f"staged < {mod.MIN_ROWS}" in promote)
    for fn in ("chatbox_exhibits_stage(jsonb, boolean)", "chatbox_exhibits_promote(integer)"):
        check(f"5c: {fn} is closed to public, anon and authenticated",
              f"revoke all on function public.{fn} from public, anon, authenticated" in sql
              and f"grant execute on function public.{fn} to service_role" in sql)
    check("5d: the table as it stood is kept, and the rollback restores from it",
          "chatbox_exhibits_pre_refresh_20261112" in sql
          and "from public.chatbox_exhibits_pre_refresh_20261112" in open(ROLLBACK, encoding="utf-8").read())

    print(f"\n{checks[0] - len(failures)}/{checks[0]} passed")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()

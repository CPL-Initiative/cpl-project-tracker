#!/usr/bin/env python3
"""The Exhibits row's machine stamp counts the last successful procedures run (#3510 C4, S683).

The "saving run has stalled" alert dated the Exhibits row by the last save or fold alone, so a quiet day with an empty
queue read as stalled while the nightly procedures run finished on time. The row now takes the newest of the three:
the last save, the last fold, and the last procedures run that finished well: kb/cer_procedures_out/latest.json
`_finished_at`, which kb/_cer_procedures.py adds after its save returns (`_generated_at` is written before the save and
the nightly commits the file even when a step fails, so it proves nothing). Guards:
  (1) a recent procedures run alone keeps the row current when the last save and fold are days old;
  (2) the stamps compare as times, never as text (a Z stamp, an offset and a bare date mix);
  (3) a stamp that does not parse is ignored, and no stamp at all is None, never a made-up time;
  (5) a run that did not finish well dates nothing: no `_finished_at`, a classifier error, or a spend gate that held a
      post each leave the row on its save and fold, so a failing nightly still reads as stalled;
  (6) kb/_cer_procedures.py stamps `_finished_at` after save_sure, never before it;
  (4) on this tree the row's stamp is no older than the procedures run's own stamp, and build_stalled does not call
      the Exhibits row stopped when that run is a few hours old.

Run from the repo root: python3 tests/commons_status_exhibit_machine_test.py
"""
import datetime as dt
import importlib.util
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("build_commons", os.path.join(ROOT, "kb", "_build_commons_status.py"))
B = importlib.util.module_from_spec(spec)
spec.loader.exec_module(B)

results = []


def check(name, cond, detail=""):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + ((" -- " + str(detail)) if (detail and not cond) else ""))


# (1) and (2)
at = B.exhibit_machine_at("2026-11-14T03:58:00Z", "2026-11-13T17:47:11+00:00", "2026-11-18T17:10:02Z")
check("(1) a recent procedures run dates the row when the save and the fold are days old", at == "2026-11-18T17:10:02Z", at)
at = B.exhibit_machine_at("2026-11-18T03:58:00Z", "2026-11-17T20:00:00-08:00", "2026-11-17")
check("(2) an offset stamp compares as a time: 20:00 PT is 04:00Z the next day, later than 03:58Z",
      at == "2026-11-17T20:00:00-08:00", at)
at = B.exhibit_machine_at("2026-11-18T03:58:00Z", None, "2026-11-17T17:10:02Z")
check("(1) the newest still wins when it is the save", at == "2026-11-18T03:58:00Z", at)

# (3)
check("(3) a stamp that does not parse is ignored", B.exhibit_machine_at("not a time", None, "2026-11-18T01:00:00Z") == "2026-11-18T01:00:00Z")
check("(3) no stamp at all is None", B.exhibit_machine_at(None, "", None) is None)

# (5) only a run that finished well
ok = {"_generated_at": "2026-11-18T17:00:00Z", "_finished_at": "2026-11-18T17:10:02Z",
      "classifier_run": {"calls": 4, "errors": [], "spend": {"limit_usd": 40.0}}}
check("(5) a finished run with no error counts, by its finish", B.procedures_run_ok_at(ok) == "2026-11-18T17:10:02Z")
check("(5) a run with no finish stamp (its save raised, or an older file) counts for nothing",
      B.procedures_run_ok_at({"_generated_at": "2026-11-18T17:00:00Z"}) is None)
refused = dict(ok, classifier_run={"calls": 0, "errors": [], "spend": {"refused": "the hard stop held 2 posts"}})
check("(5) a spend gate that held a post counts for nothing", B.procedures_run_ok_at(refused) is None)
erred = dict(ok, classifier_run={"calls": 4, "errors": ["HTTP 500"], "spend": {}})
check("(5) a classifier error counts for nothing", B.procedures_run_ok_at(erred) is None)
check("(5) no file counts for nothing", B.procedures_run_ok_at(None) is None)
stale = B.exhibit_machine_at("2026-11-14T03:58:00Z", "2026-11-13T17:47:11Z", B.procedures_run_ok_at(refused))
check("(5) a refused nightly with a fresh _generated_at still leaves four-day-old stamps", stale == "2026-11-14T03:58:00Z", stale)

# (6) the writer
with open(os.path.join(ROOT, "kb", "_cer_procedures.py"), encoding="utf-8") as f:
    src = f.read()
i_save, i_fin = src.find("save_sure(stage, report"), src.find('report["_finished_at"]')
check("(6) kb/_cer_procedures.py stamps _finished_at after save_sure", 0 < i_save < i_fin, [i_save, i_fin])

# (4) the tree
row = B.row_exhibit(ROOT)
with open(os.path.join(ROOT, "kb", "cer_procedures_out", "latest.json"), encoding="utf-8") as f:
    run_at = B.procedures_run_ok_at(json.load(f))
m = row.get("machine") or {}
check("(4) the row names the procedures run in its machine words", "procedures run" in str(m.get("what")), m)
check("(4) the row's stamp is no older than the last run that finished well", run_at is None
      or (B._when(m.get("at")) and B._when(m.get("at")) >= B._when(run_at)), [m.get("at"), run_at])

def stopped(at, hours_later):
    r = dict(row, key="exhibit", machine=dict(m, at=at))
    out = B.build_stalled([r], {}, (B._when(at) + dt.timedelta(hours=hours_later)).isoformat())
    return any(x.get("kind") == "stopped" and x.get("ref") == "exhibit" for x in out)


fresh = B.exhibit_machine_at("2026-11-14T03:58:00Z", "2026-11-13T17:47:11Z", "2026-11-18T17:10:02Z")
check("(4) a quiet day: save and fold four days old, procedures run five hours old, reads as fine",
      not stopped(fresh, 5))
old_only = B.exhibit_machine_at("2026-11-14T03:58:00Z", "2026-11-13T17:47:11Z", None)
check("(4) with no procedures run either, four-day-old stamps still read as stopped", stopped(old_only, 4 * 24 + 5))

failed = sum(1 for _, ok in results if not ok)
print("%d/%d checks passed" % (len(results) - failed, len(results)))
sys.exit(1 if failed else 0)

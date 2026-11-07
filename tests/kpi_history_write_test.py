#!/usr/bin/env python3
"""kpi_history.json cannot be wiped by a bad read (COBIx security round 1, item 11).

Guards the failure mode in `_write_kpi_history`: before 2026-11-07 a parse error
became `history = []`, today was appended, and one entry was written over the
record and committed by the cron. Rule 3's gap guard cannot catch a history with
no past.

  1. A file that does not parse stops the write and leaves the file unchanged.
  2. A file holding a non-list stops the write.
  3. A history shorter than the committed one by more than a day is refused.
  4. A normal run replaces today's entry, keeps the rest, sorts by date, and
     leaves no .tmp file behind.
  5. The committed length is read from git HEAD, so the floor works on the runner.

Imports the generator (openpyxl). Run from the repo root:

    python3 tests/kpi_history_write_test.py
"""
import json
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import excel_to_dashboard as gen

failures = []


def check(label, ok):
    print(("PASS  " if ok else "FAIL  ") + label)
    if not ok:
        failures.append(label)


def raises(fn):
    try:
        fn()
    except gen.KpiHistoryError:
        return True
    return False


snap = {"date": "2026-11-07", "students": 5}
d = tempfile.mkdtemp()
path = os.path.join(d, "kpi_history.json")

# 1. Corrupt file: stop, file untouched.
with open(path, "w") as f:
    f.write('[{"date": "2026-11-05"}, {"date": "2026-11-0')
check("corrupt file raises", raises(lambda: gen._write_kpi_history(path, snap, None)))
check("corrupt file left unchanged", open(path).read().endswith('"2026-11-0'))

# 2. Non-list.
with open(path, "w") as f:
    json.dump({"date": "2026-11-05"}, f)
check("non-list raises", raises(lambda: gen._write_kpi_history(path, snap, None)))

# 3. Sanity floor against the committed length.
with open(path, "w") as f:
    json.dump([], f)
check("empty file under a committed 300 raises",
      raises(lambda: gen._write_kpi_history(path, snap, 300)))
check("refused write leaves file unchanged", json.load(open(path)) == [])
os.remove(path)
check("missing file under a committed 300 raises",
      raises(lambda: gen._write_kpi_history(path, snap, 300)))
check("first-ever file with no committed copy writes", gen._write_kpi_history(path, snap, None) == [snap])

# 4. Normal run.
prior = [{"date": "2026-11-06", "students": 4}, {"date": "2026-11-05", "students": 3},
         {"date": "2026-11-07", "students": 1}]
with open(path, "w") as f:
    json.dump(prior, f)
out = gen._write_kpi_history(path, snap, 3)
check("today replaced, history sorted", [e["date"] for e in out] == ["2026-11-05", "2026-11-06", "2026-11-07"]
      and out[-1]["students"] == 5)
check("file on disk matches", json.load(open(path)) == out)
check("no .tmp left behind", not os.path.exists(path + ".tmp"))
check("one short of committed is allowed (a dropped day)", len(gen._write_kpi_history(path, snap, 4)) == 3)

# 5. The committed history is readable from git HEAD.
n = gen._committed_history_length(gen.HISTORY_FILE)
check(f"committed kpi_history.json length read from git ({n})", isinstance(n, int) and n > 30)

if failures:
    print(f"\n{len(failures)} failure(s)")
    sys.exit(1)
print("\nall passed")

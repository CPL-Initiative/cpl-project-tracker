"""
Nothing reads or writes workplan_goals.current again (S653b).

The per-year cur_2025_26 .. cur_2029_30 columns replaced the one-column `current`
on 2026-10-19 (S426). The S653b conductor's decision
d-workplan-drop-current-two-steps-s653b drops it in two steps: step 1 removes
every read and write of it (the loader's select, the Refresh summaries drafter,
the generator's _row_current_years); step 2 drops the column
(kb/migrations/2026-11-14_s653b_workplan_goals_drop_current.sql). A PostgREST
select that names a dropped column answers 400, and the loader then falls back
to a poorer shape and the drafter to an empty list, with no error anyone sees.
cur_2025_26 is the one source for 2025-26.

The failure this guards: a reader or writer of the table naming `current` again.
Two checks:

  1. Every code file that names workplan_goals (JS, Python, TypeScript, shell,
     workflow YAML, HTML) holds no column list with a `current` token: a
     PostgREST select string, a loader shape, a PATCH or upsert column list.
  2. The known readers hold no key read of the old column: goal.current in the
     drafter, row.get("current") in _row_current_years, any "current" key in the
     loader and the Annual Goals editor's saves.

Out of scope, with the reason: docs/, archive/ and kb/receipts/ record history;
kb/migrations/ and kb/supabase_*.sql are applied DDL (the per-year migration
reads `current` once, to copy it); tests/ build fixtures, and one of them feeds
a row with the old key to prove the generator ignores it; the daily snapshot
kb/workplan_goals_snapshot.json is data the loader writes, and loses the key on
the first run after step 1.

Each check is proved able to fail on the text step 1 removed.

Run from repo root:  python3 tests/workplan_goals_current_column_guard_test.py
"""
import inspect
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

fails = []


def check(name, cond):
    print(("PASS " if cond else "FAIL ") + name)
    if not cond:
        fails.append(name)


CODE_EXT = (".js", ".mjs", ".cjs", ".ts", ".py", ".sh", ".yml", ".yaml", ".html")
SKIP_PREFIX = ("docs/", "archive/", "kb/receipts/", "kb/migrations/", "kb/glyph_sweep/", "tests/",
               "node_modules/")
SKIP_FILES = {"kb/workplan_goals_snapshot.json"}

# A `current` token inside a PostgREST column list, which carries no spaces:
# ",current," ",current\"" "select=current" "\"current," -- the shapes a select, a
# loader shape or a column list takes. Prose and argument lists (", current ") do
# not match, and neither does a bare "current" dict key (the generator's output
# rows carry a "current" ladder of their own, which is not the column).
COLUMN_LIST = re.compile(r"(?:(?<=[,=])current(?=[,\"'`&)]|$)|(?<=[\"'`])current(?=,))", re.M)

# Key reads of the old column in the files that read the table's rows.
KEY_READS = {
    "activity_summaries.js": re.compile(r"\bgoal\s*(?:\.\s*current\b|\[\s*[\"']current[\"']\s*\])"),
    "workplan_goals.js": re.compile(r"(?:\.\s*current\b|\[\s*[\"']current[\"']\s*\]|[\"']current[\"']\s*:|\bcurrent\s*:)"),
    "kb/_load_workplan_goals.py": re.compile(r"[\"']current[\"']"),
}


def tracked_files():
    out = subprocess.run(["git", "ls-files"], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    return [p for p in out.splitlines() if p]


def scanned(paths):
    for p in paths:
        if not p.endswith(CODE_EXT) or p in SKIP_FILES or p.startswith(SKIP_PREFIX):
            continue
        if p.startswith("kb/supabase_") and p.endswith(".sql"):
            continue
        try:
            text = open(os.path.join(ROOT, p), encoding="utf-8").read()
        except (OSError, UnicodeDecodeError):
            continue
        if "workplan_goals" in text:
            yield p, text


def column_list_hits(text):
    return [text[max(0, m.start() - 40):m.end() + 20].replace("\n", " ") for m in COLUMN_LIST.finditer(text)]


# ── the detectors catch the text step 1 removed (each check can fail) ──
OLD_DRAFTER_SELECT = ('sbGet("workplan_goals?select=activity_id,kind,row_type,name,current,"\n'
                      '        + "yr_2025_26,yr_2026_27,yr_2027_28,yr_2028_29,yr_2029_30,"')
OLD_LOADER_SHAPES = ('_shapes = [\n'
                     '        _base + ",current,cur_2025_26,cur_2026_27,cur_2027_28,cur_2028_29,cur_2029_30",\n'
                     '        _base + ",current",\n')
OLD_DRAFTER_READ = 'if (current == null || current === "") current = goal.current;'
OLD_LOADER_SELECT_TAIL = 'rows = _fetch_table("workplan_goals?select=id,current")'
check("the column-list detector catches the drafter's old select", bool(column_list_hits(OLD_DRAFTER_SELECT)))
check("the column-list detector catches both of the loader's old shapes",
      len(column_list_hits(OLD_LOADER_SHAPES)) == 2)
check("the column-list detector catches a select that ends on the column",
      bool(column_list_hits(OLD_LOADER_SELECT_TAIL)))
check("the column-list detector passes the per-year columns and a ladder named current",
      not column_list_hits('select=activity_id,cur_2025_26,cur_2026_27"') and
      not column_list_hits('"current": current_dict,') and not column_list_hits('row["current"]'))
check("the drafter key-read detector catches goal.current and goal[\"current\"]",
      bool(KEY_READS["activity_summaries.js"].search(OLD_DRAFTER_READ))
      and bool(KEY_READS["activity_summaries.js"].search('x = goal["current"];')))
GENERATOR_KEY = re.compile(r"[\"']current[\"']")
check("the generator detector catches the old fallback in _row_current_years",
      bool(GENERATOR_KEY.search('            if v is None and label == "2025-26":\n'
                                '                v = _num_or_none(r.get("current"))\n')))

# ── 1. no column list names `current` in any code file that names the table ──
files = dict(scanned(tracked_files()))
check("the scan reaches the known readers (the loader, the drafter, the editor, the generator)",
      all(p in files for p in ("kb/_load_workplan_goals.py", "activity_summaries.js",
                               "workplan_goals.js", "excel_to_dashboard.py")))
hits = {p: column_list_hits(t) for p, t in files.items()}
hits = {p: h for p, h in hits.items() if h}
check("no code file that names workplan_goals lists a `current` column", not hits)
for p, h in sorted(hits.items()):
    print("   " + p + ": " + " | ".join(h[:3]))

# ── 2. the known readers hold no key read of the old column ──
for p, rx in KEY_READS.items():
    text = files.get(p, "")
    found = [text[max(0, m.start() - 40):m.end() + 20].replace("\n", " ") for m in rx.finditer(text)]
    check(p + " reads no `current` key", not found)
    for f in found[:3]:
        print("   " + f)

import excel_to_dashboard as e  # noqa: E402
src = inspect.getsource(e._row_current_years)
check("_row_current_years reads no `current` key",
      not GENERATOR_KEY.search(src.split('"""')[-1]))
check("_row_current_years ignores a row that holds only the old column",
      e._row_current_years({"current": "8"}, {"current": "8"}) == {})

print(f"\n{len(fails)} failure(s)" if fails else "\nall passed")
sys.exit(1 if fails else 0)

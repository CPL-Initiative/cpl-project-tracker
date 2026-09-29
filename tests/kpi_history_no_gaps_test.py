"""Critical Rule 3, made mechanical: kpi_history.json must have no date gaps.

WHY THIS EXISTS. The rule has been in CLAUDE.md since the beginning and nothing
checked it. On 2026-09-08 the daily cron began failing and did not run again for
three days; the history stopped at 2026-09-07 and resumed at 2026-09-10.

⚠️ THE COST IS SILENT AND IT IS NOT "A MISSING POINT ON A CHART".
`_history_lookup` resolves a period by

    [e for e in history if e.get("date", "") <= target and e.get(key, 0) > 0]

and takes the last match. With 09-08 and 09-09 absent, the "1d" delta for
2026-09-10 asks for 09-09, finds nothing at or before it except 09-07, and
reports **three days of movement labelled as one day**. Nothing errors, nothing
looks wrong, and the number on the card is simply false.

Rule 3's remedy is a backfilled entry carrying `"_interpolated": true`. This
file is the part that notices it is needed.

Run: python3 tests/kpi_history_no_gaps_test.py
"""
import datetime
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


history = json.loads((ROOT / "kpi_history.json").read_text(encoding="utf-8"))
dated = [e for e in history if isinstance(e, dict) and e.get("date")]
dates = sorted(e["date"] for e in dated)

check("every entry carries a date", len(dated) == len(history),
      f"{len(history) - len(dated)} undated entries")
check("dates are unique", len(set(dates)) == len(dates),
      "duplicates: " + ", ".join(sorted({d for d in dates if dates.count(d) > 1})))

gaps = []
for a, b in zip(dates, dates[1:]):
    da, db = (datetime.date.fromisoformat(x) for x in (a, b))
    if (db - da).days > 1:
        gaps.append(f"{a} -> {b} ({(db - da).days - 1} missing)")
check("⭐ RULE 3: no date gaps — a missed run needs an interpolated backfill",
      not gaps, "; ".join(gaps))

# ⚠️ The rule is not "fill it in", it is "fill it in AND SAY SO". An
# interpolated row that does not admit it is a measurement that never happened
# wearing the clothes of one that did.
#
# ⚠️ THE FIRST VERSION OF THE CHECK BELOW WAS INERT: it filtered rows that HAVE
# `_interpolated` and then asserted they have it. Removing the flag from a row
# simply removed it from the sample, and the check stayed green — the tautology
# this file's own neighbour (custom_report_response_test.py) warns about, in a
# different disguise. There is no way to detect an undeclared backfill from the
# file alone; what IS checkable is that a declared one is well-formed, so that
# is what this asserts.
interp = [e for e in dated if e.get("_interpolated")]
check("the interpolated flag is a real boolean, not a truthy string",
      all(e["_interpolated"] is True for e in interp),
      repr([e["date"] for e in interp if e["_interpolated"] is not True]))
# A backfill that silently drops metrics is its own bug: the row renders, the
# chart has a point, and one series has a hole nobody sees.
#
# ⚠️ AGAINST ITS NEIGHBOURS, NOT AGAINST THE WIDEST ROW IN THE FILE. The metric
# set has grown over time — `common_titles`, `ccc_common_titles` and
# `ccc_exhibits` arrived after April 2026 — so measuring every row against
# today's schema reports every old row as broken. A backfill has to match the
# era it was inserted into, which is exactly what the rows on either side of it
# carry.
ordered = sorted(dated, key=lambda e: e["date"])
thin = []
for i, e in enumerate(ordered):
    if not e.get("_interpolated"):
        continue
    before = next((x for x in reversed(ordered[:i]) if not x.get("_interpolated")), None)
    after = next((x for x in ordered[i + 1:] if not x.get("_interpolated")), None)
    era = set(before or {}) & set(after or {}) if (before and after) else set(before or after or {})
    want = era - {"_interpolated", "date"}
    if want and not want <= set(e):
        thin.append(f"{e['date']} lacks " + ", ".join(sorted(want - set(e))))
check("an interpolated row carries the metrics its neighbours carry",
      not thin, "; ".join(thin))
check("interpolation is rare — it is a repair, not a source",
      len(interp) <= max(5, len(dated) // 20),
      f"{len(interp)} of {len(dated)} entries are interpolated")

# ⭐ THE FAILURE THE GAP CAUSES, ASSERTED DIRECTLY rather than inferred from the
# absence of gaps: for the newest entry, "yesterday" must resolve to yesterday.
if len(dates) >= 2:
    newest = dates[-1]
    want = (datetime.date.fromisoformat(newest) - datetime.timedelta(days=1)).isoformat()
    key = "students"
    got = [e for e in dated if e.get("date", "") <= want and e.get(key, 0) > 0]
    resolved = got[-1]["date"] if got else None
    check("⭐ the 1d delta on the newest entry resolves to the actual previous day",
          resolved == want, f"asked for {want}, _history_lookup would take {resolved}")

# The rule lives in CLAUDE.md; if it is ever reworded away, this file is orphaned.
claude = (ROOT / "CLAUDE.md").read_text(encoding="utf-8")
check("Rule 3 still says what this file enforces",
      "kpi_history.json" in claude and "_interpolated" in claude and "date gaps" in claude)

ok = sum(1 for _, c, _ in results if c)
for name, cond, why in results:
    print(("PASS  " if cond else "FAIL  ") + name + ("" if cond or not why else "  — " + why))
print(f"\n{ok}/{len(results)} checks passed")
sys.exit(0 if ok == len(results) else 1)

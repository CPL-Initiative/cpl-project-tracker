"""The 2026-09-08 outage: a 400 on one view corrupts the LABELS of another.

WHAT HAPPENED. Pedro added six CPL lifecycle booleans to
View_StudentAggregatedValues_APIDataset on 2026-09-02; they were real, '0'/'1'
strings at 100% fill over 53,267 rows, enumerated from the API itself. By
2026-09-08 MAP had removed all six, and asking for a column a view does not
have 400s the WHOLE view:

    View_StudentAggregatedValues_APIDataset contains invalid columns:
    CPL_Docs_Verified, Ed_Plan_Created, Analysis_Completed,
    Counselor_Verified, Student_Verified, Transcribed

⭐ AND THEN THE LABELS MOVED. One invalid view in the batch and MAP labels a
neighbour's data with the invalid name: View_ProgramsofStudy_APIDataset vanished
from the response and the student view came back TWICE. `datasets` in
read_exhibit_metrics() is keyed by viewName, so the second copy replaced the
first in silence, its rows did not match its column map, and
_compute_college_last_activity died on `IndexError: list index out of range`.

⚠️ NINE CONSECUTIVE NIGHTLY RUNS, THREE DAYS DARK, AND THE FETCHER HAD ALREADY
PRINTED THE DIAGNOSIS. summarize_response() named the duplicate and the missing
view every single time. It was printed as a WARNING and the payload saved anyway,
because the split rested on a comment saying the dashboard "consumes none of the
views involved in the 2026-08-24 outage" — a claim about WHICH view MAP
mislabels, which is not ours to control. This time it landed on one the dashboard
does read.

So these guard the three places the outage passed through, not the one that
crashed.

Run: python3 tests/custom_report_duplicate_view_test.py
"""
import json
import pathlib
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import fetch_custom_report as F   # noqa: E402  (network calls are __main__-only)

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


def ds(view, cols, rows, code=None, message=None):
    d = {"viewName": view, "columnName": list(cols), "columnValue": [list(r) for r in rows]}
    if code is not None:
        d["responseCode"] = code
        d["responseMessage"] = message or ""
    return d


# ── (1) the six columns are OFF the request ──────────────────────────────────
# Confirmed gone, not renamed and not moved: probe run 34478781366 (2026-09-10)
# enumerated 19 live columns, reported "NEW vs our request+held: none", and ten
# candidate new view names all answered "is not Valid".
DEAD = ["CPL_Docs_Verified", "Ed_Plan_Created", "Analysis_Completed",
        "Counselor_Verified", "Student_Verified", "Transcribed"]
SAV = next(d for d in F.REQUEST_PAYLOAD
           if d["viewName"] == "View_StudentAggregatedValues_APIDataset")
check("(1) ⭐ no column MAP rejects is requested — asking 400s the WHOLE view",
      not [c for c in DEAD if c in SAV["columnName"]],
      "still requested: " + ", ".join(c for c in DEAD if c in SAV["columnName"]))
check("(1) …and the 19 live columns are all still asked for",
      len(SAV["columnName"]) == 19 and "Uploaded Date" in SAV["columnName"]
      and "Potential Student" in SAV["columnName"],
      f"{len(SAV['columnName'])} columns")
check("(1) the way back is recorded, so restoring is one line",
      "TO RESTORE" in (ROOT / "fetch_custom_report.py").read_text(encoding="utf-8"))

# ── (2) a repeated viewName is fatal to the FETCH, strict or not ─────────────
COLS = ["College", "Uploaded Date"]
DUP = [ds("View_ArticulatedMAPExhibits_APIDataset", COLS, [["Alpha", "1/2/2026"]]),
       ds("View_StudentAggregatedValues_APIDataset", COLS, [["Alpha", "1/2/2026"]],
          code="400", message="contains invalid columns: Counselor_Verified"),
       ds("View_StudentAggregatedValues_APIDataset", ["College"], [["Alpha"]],
          code="400", message="contains invalid columns: Counselor_Verified")]
rep = F.summarize_response(DUP, requested=[d["viewName"] for d in DUP[:2]])
check("(2) the duplicate is named on its own, not only inside the prose problems",
      rep.get("duplicated") == ["View_StudentAggregatedValues_APIDataset"],
      repr(rep.get("duplicated")))
check("(2) …and the response is unusable", not rep["usable"])
src = (ROOT / "fetch_custom_report.py").read_text(encoding="utf-8")
check("(2) ⭐ fetch_report refuses to SAVE an unkeyable payload, strict or not",
      'fatal = strict or report["duplicated"]' in src and "if fatal:" in src,
      "the warn/fail split no longer distinguishes a duplicate")
check("(2) …and the comment RETIRES the stale premise rather than still resting on it",
      "used to rest on" in src and "not ours to control" in src,
      "the premise is quoted, which is right — but it must read as retired")

# ── (3) the consumer drops BOTH copies rather than letting one win ───────────
# Neither copy can be trusted once the label is ambiguous: picking either is a
# guess about which block MAP meant.
import excel_to_dashboard as E   # noqa: E402
STUDENT = "View_StudentAggregatedValues_APIDataset"
# ⚠️ THE EXHIBITS VIEW CARRIES ITS REAL COLUMN LIST, read from the request
# payload rather than hand-typed. A nine-column stand-in fails in _parse_exhibits
# on `cm.get("CPL Type Description", 13)` — a guessed OFFSET, the same defect
# class as the crash this file is about — and a test that dies there says
# nothing about duplicate handling. (51 of those guessed offsets remain in
# excel_to_dashboard.py; only the crash site was fixed here, and the rest are
# recorded as their own work rather than swept in.)
EXH = "View_ArticulatedMAPExhibits_APIDataset"
EXH_COLS = next(d["columnName"] for d in F.REQUEST_PAYLOAD if d["viewName"] == EXH)
_exh_row = {"College": "Alpha College", "ExhibitID": "E1", "Exhibit Title": "Welding I",
            "Articulation College": "Alpha College", "Course": "WELD 1",
            "Credit Recommendation": "3 units", "Collaborative Type": "CCC",
            "TOP Code": "0956.00", "CPL Type Description": "Credit By Exam"}
payload = [
    ds(EXH, EXH_COLS, [[_exh_row.get(c, "") for c in EXH_COLS]]),
    # the real view: 19 columns, and the row is 19 wide
    ds(STUDENT,
       ["College", "Catalog Year", "Applied Credits", "Apprenticeship Credits", "Area Credits",
        "Course Credits", "CPL Mode of Learning", "CPL Type Description", "Default Area Credits",
        "Elective Credits", "Eligible Credits", "Last Updated", "MAP Internal StudentID",
        "Military Credits", "NonMilitary Credits", "Potential Student", "Test Student",
        "Transcribed Credits", "Uploaded Date"],
       [["Alpha College", "2026", "3", "0", "0", "3", "Exam", "Credit By Exam", "0",
         "0", "3", "1/2/2026", "S1", "0", "3", "No", "No", "3", "1/2/2026 8:00:00 AM"]]),
    # the neighbour's data wearing the same name: 3 columns, 3-wide rows
    ds(STUDENT, ["College", "CIP Code", "Program"],
       [["Alpha College", "48.0508", "Welding Technology"]]),
]
with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False,
                                 prefix="CustomReport_", encoding="utf-8") as fh:
    json.dump(payload, fh)
    tmp = fh.name
_saved = E.EXHIBIT_FILE
E.EXHIBIT_FILE = tmp
try:
    # ⭐ THE REGRESSION ITSELF: before 2026-09-10 this raised IndexError.
    crashed = None
    try:
        out = E.read_exhibit_metrics()
    except Exception as exc:            # noqa: BLE001 — the point is that nothing escapes
        crashed, out = exc, None
    check("(3) ⭐ an ambiguous payload does not crash the pipeline",
          crashed is None, f"{type(crashed).__name__}: {crashed}")
    check("(3) …and the ambiguous view is absent, not half-read",
          out is not None and STUDENT not in (out.get("datasets_found") or []),
          repr(out and out.get("datasets_found")))
    check("(3) …while the views that arrived cleanly are still read",
          out is not None and "View_ArticulatedMAPExhibits_APIDataset"
          in (out.get("datasets_found") or []),
          repr(out and out.get("datasets_found")))
finally:
    E.EXHIBIT_FILE = _saved
    pathlib.Path(tmp).unlink(missing_ok=True)

# ── (4) no guessed column POSITION at the crash site ─────────────────────────
esrc = (ROOT / "excel_to_dashboard.py").read_text(encoding="utf-8")
fn = esrc[esrc.index("def _compute_college_last_activity"):]
fn = fn[:fn.index("\ndef _compute_college_military_students")]
import re   # noqa: E402
# ⚠️ STRIP COMMENTS FIRST. The fix's own comment quotes `cm.get("Uploaded Date",
# 22)` as the thing it removed, and the first version of this check read that
# quotation as a live guess — a check that cannot tell code from prose about
# code reports the fix as the defect.
code_only = "\n".join(re.sub(r"#.*$", "", ln) for ln in fn.splitlines())
guesses = re.findall(r'cm\.get\("([^"]+)", *\d+\)', code_only)
check("(4) ⭐ the crash site reads columns by NAME, never at a guessed offset",
      not guesses,
      "still guessing positions for: " + ", ".join(guesses))
check("(4) …and says so when the columns it needs are not there",
      "last-activity skipped" in fn and "return {}" in fn)

ok = sum(1 for _, c, _ in results if c)
for name, cond, why in results:
    print(("PASS  " if cond else "FAIL  ") + name + ("" if cond or not why else "  — " + why))
print(f"\n{ok}/{len(results)} checks passed")
sys.exit(0 if ok == len(results) else 1)

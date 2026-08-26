"""Guard the reading of MAP's per-dataset verdict on a CustomReport response.

WHY THIS EXISTS. On 2026-08-24 MAP began answering one of the ten requested
datasets with

    responseCode 400 — "View_StudentDetailsCredits_APIDataset is not Valid"

and the nightly Supabase load failed three nights running while reporting
something else entirely: a *name mismatch*, because one invalid view in the
batch made MAP label a NEIGHBOUR's data with the invalid name, so a requested
view vanished from the response while another appeared twice. The answer was in
`responseMessage` the whole time and nothing read it. Sam found it by pulling
the report by hand.

So the guard is not "does the parser work" — it is "does MAP's own verdict reach
the log, and does a payload whose labels are known to be wrong stop the load".

Mutation-tested: each check below was confirmed to FAIL with its guard removed.

Run: python3 tests/custom_report_response_test.py
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
import fetch_custom_report as F   # noqa: E402  (network calls are __main__-only)

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


def ds(view, rows=0, count=None, code=None, message=None, key="columnValue"):
    """One dataset as MAP shapes it. `key` exists so the wrong-key case is testable."""
    d = {"viewName": view, key: [[1]] * rows}
    if count is not None:
        d["dataCount"] = count
    if code is not None:
        d["responseCode"] = code
    if message is not None:
        d["responseMessage"] = message
    return d


ALL = [d["viewName"] for d in F.REQUEST_PAYLOAD]
healthy = [ds(v, rows=3, count=3) for v in ALL]

# ── 1. A healthy response is usable, and says nothing alarming ───────────
r = F.summarize_response(healthy)
check(r["usable"], "a healthy 10-dataset response was reported unusable")
check(not r["problems"], "a healthy response produced problems")
check(all("MAP claims" not in ln for ln in r["lines"]),
      "a matching dataCount was annotated as a disagreement")

# ── 2. An ABSENT responseCode is normal and must not fail the pull ───────
# The failure mode this prevents is the worst kind: a guard that fails every
# GOOD run. Healthy datasets carry no responseCode at all.
check(F.summarize_response([ds(v, rows=3, count=3) for v in ALL])["usable"],
      "a response with no responseCode fields was reported unusable — this would "
      "fail every healthy pull")
check(F.summarize_response([ds(v, rows=3, count=3, code="200") for v in ALL])["usable"],
      "an explicit 2xx responseCode was treated as a failure")

# ── 3. MAP's own words must reach the caller, verbatim ───────────────────
# The exact payload Sam pulled by hand on 2026-08-26.
sick = [d for d in healthy if d["viewName"] != "View_StudentDetailsCredits_APIDataset"]
sick.append({"viewName": "View_StudentDetailsCredits_APIDataset",
             "columnValue": None, "responseCode": "400",
             "responseMessage": "View_StudentDetailsCredits_APIDataset is not Valid \r\n"})
r = F.summarize_response(sick)
check(not r["usable"], "a dataset returning HTTP 400 did not make the response unusable")
check(any("is not Valid" in p for p in r["problems"]),
      "MAP's responseMessage did not reach the problem list — that message is the "
      "entire point of this guard")
check(any("400" in ln and "is not Valid" in ln for ln in r["lines"]),
      "the per-dataset line did not carry MAP's code and message")

# ── 4. dataCount is a CLAIM, not a measurement ───────────────────────────
# An errored dataset carries columnValue: null and can still carry a count, so a
# claim alone cannot tell a full dataset from an empty one.
r = F.summarize_response([ds("V", rows=0, count=204491)], requested=["V"])
check("0 rows" in r["lines"][0], "parsed row count was not reported")
check("MAP claims 204,491" in r["lines"][0],
      "a dataCount disagreeing with the parsed rows was not flagged — this is how "
      "an empty dataset reported 204,491 rows for three nights")

# ── 5. A duplicate viewName is fatal ─────────────────────────────────────
# Every consumer of this payload looks datasets up by name. This is exactly the
# 2026-08-24 shape: one view listed twice, another missing entirely.
dup = [d for d in healthy if d["viewName"] != "View_CollegeExhibitCRByCatalogYear_APIDataset"]
dup.append(ds("View_StudentDetailsCredits_APIDataset", rows=3, count=3))
r = F.summarize_response(dup)
check(not r["usable"], "a duplicated viewName did not make the response unusable")
check(any("2x" in p and "StudentDetailsCredits" in p for p in r["problems"]),
      "the duplicated viewName was not named in the problems")
check(any("CollegeExhibitCRByCatalogYear" in p and "not present" in p for p in r["problems"]),
      "the requested-but-absent view was not named in the problems")

# ── 6. Rows live under columnValue — a `data`-keyed payload reads EMPTY ──
# Tolerating both spellings is what hid a wrong-key bug in Session 172. A
# renamed row key must surface as zero rows, never be quietly accepted.
r = F.summarize_response([ds("V", rows=9, count=9, key="data")], requested=["V"])
check("0 rows" in r["lines"][0],
      "a `data`-keyed payload was read as rows — the row key must stay columnValue only")

# ── 7. The strict flag is wired, and defaults to tolerant ────────────────
# daily-dashboard.yml runs this same fetcher and falls back on a non-zero exit,
# while consuming NONE of the views involved in the outage. Failing by default
# would drop the public dashboard over a dataset it never reads.
SRC = (pathlib.Path(__file__).resolve().parent.parent / "fetch_custom_report.py").read_text(encoding="utf-8")
check("def fetch_report(output_path=None, timeout=120, strict=False):" in SRC,
      "fetch_report no longer defaults to tolerant — the daily dashboard would "
      "drop to its fallback path over datasets it does not consume")
check('strict="--strict" in sys.argv' in SRC, "--strict is not wired through __main__")
check('arg.startswith("--")' in SRC,
      "the positional arg parser would read --strict as the output path")

LOAD = (pathlib.Path(__file__).resolve().parent.parent
        / ".github/workflows/map-custom-report-load.yml").read_text(encoding="utf-8")
check("--strict" in LOAD,
      "the Supabase load workflow does not pass --strict — it is the one caller "
      "that must stop rather than load a partial picture")

if failures:
    print(f"FAIL — {len(failures)} problem(s):")
    for f in failures:
        print(f"  x {f}")
    sys.exit(1)
print("OK — MAP's per-dataset verdict is surfaced; duplicate, absent and errored "
      "datasets stop a strict pull; the dashboard's tolerant path is preserved.")

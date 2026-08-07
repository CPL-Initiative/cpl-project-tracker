"""
_probe_student_detail_view.py — is the student-detail view live on the MAP API yet?

WHY THIS EXISTS
---------------
Sierra can tell a visitor which colleges have ARTICULATED a credential, but not
what has actually HAPPENED to the credit recommendations underneath it. Sam,
2026-08-07, on a live answer that hedged:

    "You should have access to student counts based on eligible, applied, and
     transcribed CPL for exhibits that match the request."

He is right that the data exists, and right that what we currently fetch is not
it. Of the nine views in fetch_custom_report.py, `View_ExhibitCRsCatalog_Dataset`
carries the credit FUNNEL (TotalStudents/Eligible/Applied/Transcribed/InReview
per CR) — but statewide per exhibit, with no college dimension and, decisively,
no `CPLStatusPlan`. **`CPLStatusPlan` appears in none of the nine.** So today we
can say "this exhibit has X eligible credits statewide" and never "at YOUR
college, these are applied and these twelve are sitting at Needs Action" — the
difference between a number and an answer someone can act on.

The grain that carries it is `StudentDetailCredits` — one row per student ×
credit recommendation. Sam supplied it on 2026-08-06 as an 11.79 MB zip on
Drive. It has now failed to come in TWICE (Session 124, and again 2026-08-07):
the Drive connector caps at 10 MB and cannot range-request, so a session simply
cannot read it. Unzipping makes it larger, not smaller.

Which is the wrong problem to keep solving, because pulling student-grain rows
through a session's context is what this project has already decided not to do
(funding/_build_cr_backlog.py: "the student grain never leaves the runner";
Session 26 / #227 was a PII forward-stop that needed a history rewrite to undo).
The runner is the right place, and the API is a better source than any file: a
daily refresh instead of a one-off, and — the part that matters most — asking
for a COLUMN SUBSET means the identity columns never leave MAP at all.

So: probe the API for the view, from the runner, requesting ONLY allowlisted
columns. Prints schema + aggregates to the run log, which Claude reads back via
the GitHub MCP. Commits nothing. Same shape as _discover_map_datasets.py, which
established this pattern for the Exhibit CRs Catalog.

WHAT IT DELIBERATELY DOES NOT ASK FOR
-------------------------------------
No student identifier of any kind — not StudentMAPID, not the masked StudentID
(an SSN field; Session 124 found it arrives masked with X's, while StudentMAPID
does NOT arrive masked). Nothing that narrows a row toward one person.

The honest consequence, which the log states plainly: WITHOUT a student
identifier we can count credit RECOMMENDATIONS and COLLEGES, not DISTINCT
STUDENTS. "How many students statewide" needs a stable per-student key to dedupe
someone who holds the same credential recommendation at two colleges, or several
CRs under one exhibit. Whether a salted hash is worth adding is Sam's call, not
a thing to quietly assume — and this probe is designed to make that decision an
informed one rather than a blocker.
"""
import json
import re
import sys
import urllib.error
import urllib.request
from collections import Counter, defaultdict

GETREPORT = "https://mapwebapinew.azurewebsites.net/api/CustomReport/getReport"

# Candidate names. funding/_build_cr_backlog.py was written against the first;
# the Exhibit CRs Catalog taught us the suffix is not always `_APIDataset`
# (it is `_Dataset` there), so try the plausible spellings before concluding
# the view is absent. A 200 with zero rows and a 404 mean different things.
CANDIDATE_VIEWS = [
    "View_StudentDetailCredits_APIDataset",
    "View_StudentDetailCredits_Dataset",
    "View_StudentDetailCredits",
]

# The Session-124 allowlist, MINUS every student identifier (see the docstring).
ALLOWLIST = ["Location", "CPL Mode", "Credit Recommendation", "College Course",
             "ExhibitID", "Source Code", "CPLStatusPlan"]

NEEDS_ACTION = "Needs Action"
SUPPRESS_BELOW = 5

# The family behind the question that prompted this. Deliberately the same shape
# as the chat synonym family so the probe answers the REAL question rather than a
# tidier one: "how many students statewide are eligible for CPL based on CPR,
# AED, or similar certs?"
CPR_FAMILY = re.compile(
    r"\b(cpr|aed|first\s*aid|basic\s*life\s*support|bls|cardiopulmonary|"
    r"defibrillat|lifesaving|life\s*saving|heartsaver)", re.I)

TEST_COLLEGES = {"RivTest City College", "MorTest City College", "Nortest City College",
                 "CA MAP INITIATIVE COLLEGE", "RivTest", "MorTest", "Nortest"}


def mask(n):
    """Small-cell suppression, matching adr-funding-priority-metrics-privacy."""
    return "<5" if 0 < n < SUPPRESS_BELOW else str(n)


def fetch(view, cols):
    body = json.dumps([{"viewName": view, "columnName": cols}]).encode()
    req = urllib.request.Request(GETREPORT, data=body,
                                 headers={"Content-Type": "application/json"},
                                 method="POST")
    with urllib.request.urlopen(req, timeout=900) as r:
        return r.read()


def probe(view):
    """Return the dataset dict for `view`, or None with the reason printed."""
    print(f"\n--- {view}")
    try:
        raw = fetch(view, ALLOWLIST)
    except urllib.error.HTTPError as e:
        print(f"    HTTP {e.code} — {e.read()[:300]!r}")
        return None
    except Exception as e:                                   # noqa: BLE001
        print(f"    ERROR: {type(e).__name__}: {e}")
        return None
    print(f"    fetched {len(raw):,} bytes")
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"    not JSON: {e}")
        return None
    ds = data[0] if isinstance(data, list) and data else data
    if not isinstance(ds, dict):
        print(f"    unexpected payload type: {type(ds).__name__}")
        return None
    cols = ds.get("columnName") or []
    rows = ds.get("columnValue") or []
    print(f"    viewName={ds.get('viewName')!r} dataCount={ds.get('dataCount')} "
          f"parsed_rows={len(rows):,}")
    print(f"    columns returned ({len(cols)}): {cols}")
    if not rows:
        print("    NO ROWS — response keys:", list(ds.keys()))
        print("    (a 200 with no rows usually means the view name is wrong, not "
              "that the view is empty)")
        return None
    return ds


def analyze(ds):
    cols = ds.get("columnName", [])
    ci = {str(c).strip(): i for i, c in enumerate(cols)}
    rows = ds.get("columnValue") or []

    missing = [c for c in ALLOWLIST if c not in ci]
    if missing:
        print(f"    ⚠ requested but NOT returned: {missing}")
    if "CPLStatusPlan" not in ci:
        print("    ⚠ CPLStatusPlan absent — this view does NOT carry the action "
              "taken, which is the whole reason we want it.")

    def cell(r, name):
        i = ci.get(name)
        if i is None or i >= len(r) or r[i] is None:
            return ""
        return str(r[i]).strip()

    status = Counter()
    colleges = set()
    cpr_status = Counter()
    cpr_colleges = set()
    cpr_by_college = Counter()
    cpr_crs = Counter()
    cpr_exhibits = set()
    seen = 0

    for r in rows:
        loc = cell(r, "Location")
        if not loc or loc in TEST_COLLEGES:
            continue
        seen += 1
        st = cell(r, "CPLStatusPlan") or NEEDS_ACTION
        status[st] += 1
        colleges.add(loc)
        cr = cell(r, "Credit Recommendation")
        course = cell(r, "College Course")
        if CPR_FAMILY.search(cr) or CPR_FAMILY.search(course):
            cpr_status[st] += 1
            cpr_colleges.add(loc)
            cpr_by_college[loc] += 1
            cpr_crs[cr[:70]] += 1
            ex = cell(r, "ExhibitID")
            if ex:
                cpr_exhibits.add(ex)

    print(f"\n    ROWS (non-test): {seen:,} across {len(colleges)} colleges")
    print("    disposition breakdown, statewide:")
    for st, n in status.most_common():
        pct = 100 * n / seen if seen else 0
        print(f"      {st or '(blank)':<28} {n:>9,}  ({pct:.1f}%)")

    print(f"\n    === THE CPR / AED / FIRST-AID FAMILY (Sam's question) ===")
    total_cpr = sum(cpr_status.values())
    print(f"    matching credit recommendations : {total_cpr:,}")
    print(f"    colleges with at least one      : {len(cpr_colleges)}")
    print(f"    distinct exhibits involved      : {len(cpr_exhibits)}")
    print("    by disposition:")
    for st, n in cpr_status.most_common():
        pct = 100 * n / total_cpr if total_cpr else 0
        print(f"      {st or '(blank)':<28} {n:>9,}  ({pct:.1f}%)")
    print("    top colleges (small cells suppressed):")
    for loc, n in cpr_by_college.most_common(15):
        print(f"      {loc[:44]:<46} {mask(n):>6}")
    print("    top credit recommendations:")
    for cr, n in cpr_crs.most_common(15):
        print(f"      {cr:<72} {mask(n):>6}")

    print("\n    NOTE ON 'HOW MANY STUDENTS': the counts above are CREDIT")
    print("    RECOMMENDATIONS, not distinct students. No student identifier was")
    print("    requested (by design), so one person holding a CPR recommendation")
    print("    at two colleges — or several CRs under one exhibit — counts more")
    print("    than once. A distinct headcount needs a stable per-student key;")
    print("    that is a decision for Sam, not an assumption for this probe.")


def main():
    print("=" * 78)
    print("MAP student-detail view probe — does the disposition grain exist on the API?")
    print("Requesting ONLY:", ALLOWLIST)
    print("NO student identifier is requested. Commits nothing.")
    print("=" * 78)
    for view in CANDIDATE_VIEWS:
        ds = probe(view)
        if ds:
            analyze(ds)
            print("\n" + "=" * 78)
            print(f"FOUND: {view}")
            print("Next: put this name in fetch_custom_report.py (allowlisted columns")
            print("only) and funding/_build_cr_backlog.py already parses this shape.")
            print("=" * 78)
            return 0
    print("\n" + "=" * 78)
    print("NOT FOUND under any candidate name.")
    print("Next: ask Malone for the published view name, or fall back to the runner")
    print("pulling the Drive export directly (the file is the wrong door for a")
    print("session; it is a fine door for the runner).")
    print("=" * 78)
    return 0


if __name__ == "__main__":
    sys.exit(main())

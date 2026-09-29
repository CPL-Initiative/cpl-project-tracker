"""
_probe_confirmed_custom_reports.py — the three viewNames are KNOWN. Serve-check them.

Sam pasted the three report headers on 2026-08-19, which ends the guessing:

  View_CollegeExhibitCR_APIDataset               11 cols   dataCount 174,223
  View_CollegeExhibitCRByCatalogYear_APIDataset  13 cols   dataCount 211,005
  View_StudentDetailsCredits_APIDataset          30 cols   dataCount 591,820

TWO THINGS THE DISCOVERY SWEEP GOT WRONG, both worth keeping
------------------------------------------------------------
1. **The 500 WAS the hit.** `View_StudentDetailsCredits_APIDataset` is the one
   candidate in run 1 that answered HTTP 500 while the other fifty answered a
   clean `400 … is not Valid`. The probe printed it as `✗` and the verdict said
   "NONE exposed". It was a real view all along, erroring on `columnName: []`.
   The anomaly was the signal, and the sweep's own summary line buried it.
   **A response that differs in KIND from every other rejection is not noise to
   be counted with them.** Discovery code must surface the odd one out rather
   than fold it into the tally.

2. **`CR`, not `CreditRecommendations`.** The sweep tried
   `CollegeExhibitCreditRecommendations`, `…Recommendation`, and
   `CollegeExhibitCRs` — every form but the singular abbreviation the platform
   actually uses. The display name ("College Exhibit Credit Recommendations")
   is expanded; the viewName is not. One character.

WHY THIS RUN STILL EXISTS
-------------------------
A header pasted from the Custom Report BUILDER proves the report exists in the
builder. It does NOT prove the same viewName is served by
`mapwebapinew.azurewebsites.net/api/CustomReport/getReport`, which is the
endpoint the daily cron pulls and the only one that makes these self-refreshing.
Those are different systems, and the whole "three lines in REQUEST_PAYLOAD vs a
real integration" question turns on the second, not the first. So: ask the API,
by name, from the runner.

WHAT IS DELIBERATELY NOT REQUESTED FROM THE STUDENT VIEW
--------------------------------------------------------
`StudentMAPID` and `Notes`. Both are HELD, not dropped — and for different
reasons, each of which needs a human answer before any load:

  StudentMAPID  arrives as 64 hex characters — a SHA-256, so MAP implemented the
                opaque-key ask in docs/map_dataset_sql_for_malone.md. But that
                same document warns, in its own words: "A bare SHA2_256 of a
                student ID is not anonymous: the ID space is small enough to
                enumerate, so anyone with the hashes can recover every ID by
                hashing all candidates." A hash cannot be told from a salted
                hash by looking at it. Until Pedro or Malone confirms a secret
                salt was used and kept on their side, this column is a student
                identifier of unknown strength, and we asked for it precisely so
                it would not be one.
  Notes         free text, at student grain, written by staff. Unbounded, and
                nothing downstream reads it. The cheapest PII surface to decline
                is the one nobody asked for.

Everything else in the 30 is an attribute of the CREDIT, not the person.

Runs on the GitHub Actions runner (a session's egress is denied for this host).
Prints to the log. Commits nothing.
"""
import json
import re
import sys
import urllib.error
import urllib.request

GETREPORT = "https://mapwebapinew.azurewebsites.net/api/CustomReport/getReport"
PEEK = 384 * 1024

# Sam's headers, verbatim — the API's own account of each report.
REPORTS = [
    {
        "view": "View_CollegeExhibitCR_APIDataset",
        "builder_count": 174_223,
        "ours": ("map_college_cr_unit, catalog_year + course_type collapsed", 171_723),
        "columns": ["CollegeID", "Source Code", "ExhibitID", "Credit Recommendation",
                    "College Course", "CPLStatusPlan", "Student Count",
                    "Potential Credits", "Articulated Credits", "Applied Credits",
                    "Transcribed Credits"],
        "hold": [],
    },
    {
        "view": "View_CollegeExhibitCRByCatalogYear_APIDataset",
        "builder_count": 211_005,
        "ours": ("map_college_cr_unit", 204_714),
        "columns": ["CollegeID", "Source Code", "ExhibitID", "Credit Recommendation",
                    "College Course", "CPLStatusPlan", "Catalog Year", "Course Type",
                    "Student Count", "Potential Credits", "Articulated Credits",
                    "Applied Credits", "Transcribed Credits"],
        "hold": [],
    },
    {
        "view": "View_StudentDetailsCredits_APIDataset",
        "builder_count": 591_820,
        "ours": ("map_student_credit", 537_908),
        # 28 of 30. See the module docstring for why the other two are held.
        "columns": ["CollegeID", "Location", "CPL Mode", "CPL Program", "Program",
                    "ProgramGoal", "Transfer Destination", "Catalog Year",
                    "Course Type", "Status", "Credit Recommendation",
                    "College Course", "ExhibitID", "Source Code", "PotentialCredits",
                    "CreditsInReview", "AppliedCredits", "MilitaryCredits",
                    "NonMilitaryCredits", "ApprenticeshipCredits", "ArticulatedCredits",
                    "CourseCredits", "AreaCredits", "ElectiveCredits",
                    "DefaultAreaCredits", "TranscribedCredits", "CPLStatusPlan",
                    "CPLPlanStatus"],
        "hold": ["StudentMAPID (unknown salt — see docstring)", "Notes (free text)"],
    },
]


def peek(payload, cap=PEEK, timeout=600):
    body = json.dumps(payload).encode()
    req = urllib.request.Request(GETREPORT, data=body,
                                 headers={"Content-Type": "application/json"},
                                 method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read(cap).decode("utf-8", errors="replace"), None
    except urllib.error.HTTPError as e:
        return e.code, e.read(4096).decode("utf-8", errors="replace"), None
    except Exception as e:                                       # noqa: BLE001
        return None, "", f"{type(e).__name__}: {e}"


def head(text):
    g = lambda p, c=None: (lambda m: m.group(1) if m else None)(re.search(p, text, c or 0))
    cm = re.search(r'"columnName"\s*:\s*\[(.*?)\]', text, re.S)
    return {
        "viewName": g(r'"viewName"\s*:\s*"([^"]*)"'),
        "responseCode": g(r'"responseCode"\s*:\s*"?(\d+)"?'),
        "responseMessage": g(r'"responseMessage"\s*:\s*"([^"]*)"'),
        "dataCount": (lambda v: int(v) if v else None)(g(r'"dataCount"\s*:\s*(\d+)')),
        "columns": re.findall(r'"((?:[^"\\]|\\.)*)"', cm.group(1)) if cm else [],
    }


def main():
    print("=" * 78)
    print("The three viewNames are known. Does the API SERVE them?")
    print("A builder header proves the report exists in the BUILDER. Only this")
    print("endpoint answering makes them self-refreshing on the daily cron.")
    print("=" * 78)

    served = []
    for r in REPORTS:
        view, cols = r["view"], r["columns"]
        print(f"\n### {view}")
        if r["hold"]:
            print(f"    HELD, not requested — {len(r['hold'])} column(s):")
            for h in r["hold"]:
                print(f"      · {h}")
        print(f"    requesting {len(cols)} column(s)")
        status, text, err = peek([{"viewName": view, "columnName": cols}])
        if err:
            print(f"    ✗ {err}")
            continue
        h = head(text)
        print(f"    HTTP {status} · responseCode={h['responseCode']} "
              f"· dataCount={h['dataCount']} · {len(h['columns'])} columns echoed")
        if h["responseMessage"]:
            print(f"    message: {h['responseMessage'].strip()[:90]!r}")

        # The echo is a mirror (cpl_memory: map-api-echoes-requested-columns), so
        # the columns coming back prove nothing. dataCount and rows do.
        if status == 200 and h["dataCount"]:
            served.append(view)
            label, ours = r["ours"]
            api, builder = h["dataCount"], r["builder_count"]
            print(f"    ✅ SERVED on the API.")
            print(f"       API {api:,} vs builder {builder:,}"
                  + ("  (agree)" if api == builder else
                     f"  ⚠ DIFFER by {api - builder:+,} — the builder and the API"
                     f" are not the same cut"))
            print(f"       vs ours ({label}) {ours:,} → {api - ours:+,} "
                  f"({100.0 * (api - ours) / ours:+.2f}%)")
        else:
            print(f"    ✗ not served here (this is the 'ask Pedro to expose it' case)")

    print("\n" + "=" * 78)
    print("VERDICT")
    print("=" * 78)
    if len(served) == len(REPORTS):
        print("  ⇒ ALL THREE are on the endpoint the daily cron already pulls.")
        print("    Wiring is three entries in REQUEST_PAYLOAD — a config change.")
        print("    The ITPI push offer can be declined on the merits, not on posture.")
    elif served:
        print(f"  ⇒ {len(served)} of {len(REPORTS)} served: {served}")
        print("    The rest exist in the BUILDER but are not exposed on the API —")
        print("    that, specifically, is the ask for Pedro.")
    else:
        print("  ⇒ NONE served by the API, though all three exist in the builder.")
        print("    The reports are real; the API exposure is the gap.")
    print("\n  Regardless: no column is loaded anywhere until the StudentMAPID salt")
    print("  question is answered. A hash of a small ID space is not a pseudonym.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

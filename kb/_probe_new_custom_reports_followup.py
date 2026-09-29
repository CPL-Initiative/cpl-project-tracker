"""
_probe_new_custom_reports_followup.py — control the sweep, and chase the 500.

Run 1 (2026-08-19) swept 51 candidate viewNames for Sam's three new Custom
Reports. Every one came back `400 … is not Valid`, which reads as a clean
"none of these exist". Two things have to be settled before that is reportable.

1. **THE SWEEP HAD NO POSITIVE CONTROL.** Every verdict rested on the premise
   that `columnName: []` is a valid request that a REAL view answers with its
   schema. That premise came from a probe run on 2026-08-14, not from run 1. If
   the API has since started rejecting empty column lists, then all 51 rejections
   say nothing about the views and everything about the request — and the finding
   inverts from "ask Pedro for three names" to "the sweep was broken".
   A negative result is only as good as the control that proves the instrument
   was working. So: ask a KNOWN-GOOD view (one the daily cron pulls every
   morning) the exact same question, in the same run, over the same connection.

2. **ONE CANDIDATE ANSWERED HTTP 500, NOT 400.** `View_StudentDetailsCredits_
   APIDataset` alone broke the pattern. 400 "is not Valid" is the API declining
   to recognise a name; 500 is the API trying and failing. Those mean different
   things, and the second one is the more interesting: a view that exists but
   errors on an empty column list would look exactly like this. It is equally
   possible it was a transient blip. The way to tell is repetition plus a
   control — is the 500 attached to the NAME, or to the moment?

Prints to the run log. Commits nothing. No student identifier requested.
"""
import json
import re
import sys
import urllib.error
import urllib.request

GETREPORT = "https://mapwebapinew.azurewebsites.net/api/CustomReport/getReport"
PEEK = 256 * 1024

# Views the daily cron pulls every morning — these unambiguously exist.
KNOWN_GOOD = [
    "View_CollegeCourses_APIDataset",
    "View_ExhibitCRsCatalog_Dataset",     # the one that enumerated 27 fields on 2026-08-14
]
THE_500 = "View_StudentDetailsCredits_APIDataset"
NEIGHBOURS = [
    "View_StudentDetailsCredit_APIDataset",
    "View_StudentDetailsCredits_APIDataSet",
    "View_StudentDetailsCredits_API",
]
REPEATS = 4


def ask(view, cols, cap=PEEK, timeout=180):
    body = json.dumps([{"viewName": view, "columnName": cols}]).encode()
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


def describe(view, cols, label):
    status, text, err = ask(view, cols)
    if err:
        print(f"    {label:<26} ERROR {err}")
        return None
    code = re.search(r'"responseCode"\s*:\s*"?(\d+)"?', text)
    msg = re.search(r'"responseMessage"\s*:\s*"([^"]*)"', text)
    cm = re.search(r'"columnName"\s*:\s*\[(.*?)\]', text, re.S)
    names = re.findall(r'"((?:[^"\\]|\\.)*)"', cm.group(1)) if cm else []
    print(f"    {label:<26} HTTP {status} · responseCode={code.group(1) if code else None} "
          f"· {len(names)} columns · {len(text):,} bytes"
          f" · {str(msg.group(1) if msg else '').strip()[:44]!r}")
    return names


def main():
    print("=" * 78)
    print("Follow-up: is the sweep's instrument sound, and what was the 500?")
    print("=" * 78)

    print("\n[A] POSITIVE CONTROL — does `columnName: []` still enumerate a REAL view?")
    print("    If these come back empty, run 1's 51 rejections prove NOTHING about")
    print("    the three reports and the sweep must be redone with another method.")
    control_ok = False
    for v in KNOWN_GOOD:
        print(f"  {v}")
        names = describe(v, [], "columnName: []")
        if names:
            control_ok = True
            print(f"      → enumerated: {names[:14]}{' …' if len(names) > 14 else ''}")
        # A named column proves the view is reachable at all, independent of
        # whether the empty-list trick works — so we can tell "view is gone"
        # from "empty list no longer enumerates".
        describe(v, ["College"] if "CollegeCourses" in v else ["ExhibitID"], "one named column")

    print("\n  VERDICT ON THE INSTRUMENT: "
          + ("✅ empty columnName still enumerates a real view — run 1's negatives STAND."
             if control_ok else
             "❌ empty columnName no longer enumerates. Run 1's 51 'not Valid' results are"
             "\n      UNSAFE to read as absence — the instrument, not the views, may be the"
             "\n      finding. Re-sweep using a named-column request per candidate instead."))

    print(f"\n[B] THE 500 — is it attached to the NAME or to the MOMENT?")
    print(f"    {THE_500} answered HTTP 500 in run 1 while all 50 others answered 400.")
    codes = []
    for i in range(REPEATS):
        status, text, err = ask(THE_500, [])
        codes.append(status if not err else err)
        print(f"    attempt {i + 1}: HTTP {status}" + (f" · {err}" if err else "")
              + (f" · {text.strip()[:70]!r}" if text else ""))
    distinct = set(str(c) for c in codes)
    if distinct == {"500"}:
        print("    → REPRODUCIBLE 500, tied to this NAME. A view that exists but errors")
        print("      looks exactly like this. Worth naming to Pedro specifically — it is")
        print("      a different question from 'what are the view names'.")
    elif "500" in distinct:
        print(f"    → INTERMITTENT ({sorted(distinct)}). Not a reliable signal on its own.")
    else:
        print(f"    → did NOT reproduce ({sorted(distinct)}). Run 1's 500 was transient;")
        print("      treat this name as rejected like the other 50.")

    print("\n    …and the same names with a NAMED column, in case the empty list is what")
    print("    the server chokes on:")
    for v in [THE_500] + NEIGHBOURS:
        describe(v, ["CollegeID"], v.replace("View_", "")[:26])

    print("\n" + "=" * 78)
    print("Both answers go to the session; nothing is written.")
    print("=" * 78)
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""
_probe_new_custom_reports.py — are the three NEW MAP Custom Reports on the API?

WHY THIS EXISTS
---------------
Sam, 2026-08-19, pointing at https://customreportingmodule.azurewebsites.net/
(the report BUILDER UI) with a screenshot of three reports he built from the
Access DB steps:

    College Exhibit Credit Recommendations                  (11 fields)
    College Exhibit Credit Recommendations By Catalog Year  (13 fields)
    Student Details and Credits                             (30 fields)

The whole question this run answers: **are they exposed on the API endpoint we
already pull from** (mapwebapinew.azurewebsites.net/api/CustomReport/getReport)?
If yes, wiring them is three entries in fetch_custom_report.py's REQUEST_PAYLOAD
— a config change on a cron that already runs. If no, it is a real integration
and a conversation with Pedro.

Runs ON THE GITHUB ACTIONS RUNNER. A Claude session's container is denied by the
egress policy (verified 2026-08-19: the agent proxy answers 403 to CONNECT for
mapwebapinew.azurewebsites.net:443). Prints to the run log, which Claude reads
back via the GitHub MCP. Commits nothing.

THE TWO TRAPS THIS PROBE IS BUILT AROUND
----------------------------------------
1. **The API mirrors your request.** `cpl_memory: map-api-echoes-requested-columns`
   — a previous probe "validated" nine column names by checking whether each came
   back in the response's columnName array. All nine passed, including a
   misspelling and a bare "Evidence". Worse, a request for an UNKNOWN VIEW
   returned responseCode=400 "is not Valid" **and still echoed all seven
   requested columns**. So a bad column and a bad view look identical, and the
   echo proves nothing about either.

   The way out is to **request nothing**: with `columnName: []` there is no
   request to mirror, so any column list that comes back is the API's own. This
   is how the Exhibit CRs Catalog gave up all 27 of its fields
   (`cpl_memory: exhibit-crs-catalog-has-27-fields`). It makes view validity a
   clean binary: real schema returned ⇒ the view exists.

2. **That same trick asks for the WHOLE dataset.** An enumerating request is not
   a metadata call — the Exhibit CRs Catalog answers it with ~128 MB. Sweeping a
   few dozen candidate names that way would move gigabytes to learn a name. So
   every discovery request here is **read-bounded**: take the first PEEK_BYTES
   off the socket, pull the header fields out of the partial JSON, and hang up.
   The header (`viewName`, `responseCode`, `responseMessage`, `columnName`) is
   emitted before `columnValue`, so a truncated read still answers the question.

WHAT IT DELIBERATELY DOES NOT ASK FOR
-------------------------------------
Nothing is fetched for real until a view is confirmed, and when it is, the
enumerated schema is filtered through a PII denylist (names, birth dates, SSN-ish
ids, email, phone, per-student identifiers) BEFORE the profiling request — and
the log prints exactly which columns were withheld and why. That posture is the
project's, not this file's: fetch_custom_report.py drops two contact views
entirely so staff PII never lands on the runner, and the student grain has never
left it. Discovering a 30-field student view is precisely the moment to keep it.
"""
import json
import re
import sys
import urllib.error
import urllib.request
from collections import Counter

GETREPORT = "https://mapwebapinew.azurewebsites.net/api/CustomReport/getReport"

# Enough of the response to carry the header. The dataset object is
# {viewName, columnName:[…], columnValue:[[…]]} — the schema precedes the data.
PEEK_BYTES = 512 * 1024

# ── Candidate view names ──────────────────────────────────────────────────
# The eight views we already pull establish the convention: PascalCase with the
# spaces removed, a `View_` prefix, and a suffix that is USUALLY `_APIDataset`
# but is `_Dataset` on the newest one (View_ExhibitCRsCatalog_Dataset — the
# suffix is not a rule, which is why it is swept rather than assumed).
#
# `View_ProgramsofStudy_APIDataset` is the load-bearing clue for report 3: the
# connector word is lowercased and NOT dropped. So "Student Details and Credits"
# plausibly lands on `StudentDetailsandCredits`, which no earlier probe tried.
# Sam's screenshot (2026-08-19) also shows "Student Aggregated Values · 19 fields"
# sitting in the same picker — and we already fetch
# `View_StudentAggregatedValues_APIDataset`. That is a CONFIRMED display-name →
# viewName mapping from the very same UI: strip the spaces, add `View_` and the
# suffix. It is why the first candidate for each report below is the mechanical
# transform, and why a miss on all of them is worth reporting as a real finding
# rather than a bad guess list.
#
# The card's field COUNT is carried as a cross-check, not a target: if the
# enumerated schema matches it, the card counts view fields; if it exceeds it
# (our Student Aggregated Values request alone names 19 columns while dropping
# four identity fields, so that view holds at least 23), the card counts
# something narrower — worth knowing before anyone treats "11 fields" as a spec.
EXPECTED_FIELDS = {
    "College Exhibit Credit Recommendations": 11,
    "College Exhibit Credit Recommendations By Catalog Year": 13,
    "Student Details and Credits": 30,
}

# Field names visible on the By Catalog Year card in Sam's screenshot. If the
# enumeration comes back without these, the view we matched is not the report.
CATALOG_YEAR_VISIBLE = ["CollegeID", "Source Code", "ExhibitID",
                        "Credit Recommendation", "College Course"]

BASES = {
    "College Exhibit Credit Recommendations": [
        "CollegeExhibitCreditRecommendations",
        "CollegeExhibitCreditRecommendation",
        "CollegeExhibitCRs",
        "ExhibitCreditRecommendations",
        "CollegeExhibitCreditRec",
    ],
    "College Exhibit Credit Recommendations By Catalog Year": [
        "CollegeExhibitCreditRecommendationsByCatalogYear",
        "CollegeExhibitCreditRecommendationsbyCatalogYear",
        "CollegeExhibitCreditRecommendationByCatalogYear",
        "CollegeExhibitCRsByCatalogYear",
        "ExhibitCreditRecommendationsByCatalogYear",
        "CollegeExhibitCreditRecommendationsCatalogYear",
    ],
    "Student Details and Credits": [
        "StudentDetailsandCredits",      # the ProgramsofStudy convention
        "StudentDetailsAndCredits",
        "StudentDetailsCredits",
        "StudentDetailCredits",          # tried 2026-08-07 → 400; retry, it may be published now
        "StudentDetailAndCredits",
        "StudentDetailsandCredit",
    ],
}
SUFFIXES = ["_APIDataset", "_Dataset", ""]

# Endpoints worth one shot each: if the module will list its own views, every
# future "what is it called" question is answered by a call instead of a guess.
LIST_ENDPOINTS = [
    ("POST", "https://mapwebapinew.azurewebsites.net/api/CustomReport/getViews"),
    ("GET",  "https://mapwebapinew.azurewebsites.net/api/CustomReport/getViews"),
    ("GET",  "https://mapwebapinew.azurewebsites.net/api/CustomReport/getViewList"),
    ("GET",  "https://mapwebapinew.azurewebsites.net/api/CustomReport/getReportList"),
    ("GET",  "https://mapwebapinew.azurewebsites.net/api/CustomReport/getDatasets"),
    ("GET",  "https://mapwebapinew.azurewebsites.net/api/CustomReport"),
]

# Applied to an ENUMERATED schema before anything is fetched for real.
PII_DENY = re.compile(
    r"(first\s*name|last\s*name|middle|full\s*name|birth|dob|ssn|social|"
    r"e-?mail|phone|address|street|zip|postal|studentid|student\s*id|"
    r"studentmapid|map\s*internal\s*student)", re.I)

TEST_COLLEGES = {"RivTest City College", "MorTest City College", "Nortest City College",
                 "CA MAP INITIATIVE COLLEGE", "RivTest", "MorTest", "Nortest"}


def peek(payload, cap=PEEK_BYTES, timeout=180):
    """POST and read at most `cap` bytes. Returns (partial_text, error_or_None).

    Bounded on purpose: an enumerating request returns the entire dataset, and
    this sweep issues dozens of them. We want the header, not the data.
    """
    body = json.dumps(payload).encode()
    req = urllib.request.Request(GETREPORT, data=body,
                                 headers={"Content-Type": "application/json"},
                                 method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.read(cap).decode("utf-8", errors="replace"), None
    except urllib.error.HTTPError as e:
        return e.read(4096).decode("utf-8", errors="replace"), f"HTTP {e.code}"
    except Exception as e:                                       # noqa: BLE001
        return "", f"{type(e).__name__}: {e}"


def header_of(text):
    """Pull the header fields out of a possibly-truncated dataset response.

    json.loads cannot be used — the read is cut mid-`columnValue` by design — so
    the fields are lifted individually. `columnName` is taken only when its
    closing bracket is present, so a clipped list is never read as a short one.
    """
    out = {"viewName": None, "responseCode": None, "responseMessage": None,
           "dataCount": None, "columns": None}
    m = re.search(r'"viewName"\s*:\s*"([^"]*)"', text)
    if m:
        out["viewName"] = m.group(1)
    m = re.search(r'"responseCode"\s*:\s*"?(\d+)"?', text)
    if m:
        out["responseCode"] = m.group(1)
    m = re.search(r'"responseMessage"\s*:\s*"([^"]*)"', text)
    if m:
        out["responseMessage"] = m.group(1)
    m = re.search(r'"dataCount"\s*:\s*(\d+)', text)
    if m:
        out["dataCount"] = int(m.group(1))
    m = re.search(r'"columnName"\s*:\s*\[(.*?)\]', text, re.S)
    if m:
        out["columns"] = re.findall(r'"((?:[^"\\]|\\.)*)"', m.group(1))
    return out


def try_view(view):
    """Ask `view` to enumerate itself. Returns the header dict.

    The verdict is columns-returned, not the echo: we sent `columnName: []`, so
    anything in the response is the API's own account of the view.
    """
    text, err = peek([{"viewName": view, "columnName": []}])
    h = header_of(text)
    h["error"] = err
    h["bytes"] = len(text)
    return h


def sweep():
    print("=" * 78)
    print("[1] Do the three new reports exist on the API we already pull from?")
    print("    Method: `columnName: []` per candidate — the API cannot mirror an")
    print("    empty request, so returned columns are real. Reads are capped at")
    print(f"    {PEEK_BYTES // 1024} KB (a valid view answers with the WHOLE dataset).")
    print("=" * 78)

    found = {}
    for report, bases in BASES.items():
        print(f"\n### {report}")
        hit = None
        for base in bases:
            for suf in SUFFIXES:
                view = f"View_{base}{suf}"
                h = try_view(view)
                cols = h.get("columns") or []
                code = h.get("responseCode")
                msg = (h.get("responseMessage") or "").strip()
                if cols:
                    exp = EXPECTED_FIELDS.get(report)
                    note = ""
                    if exp is not None:
                        note = (f"  (card says {exp} — MATCHES)" if len(cols) == exp
                                else f"  (⚠ card says {exp}, enumeration says "
                                     f"{len(cols)} — the card counts something else)")
                    print(f"  ✅ {view}")
                    print(f"     {len(cols)} columns{note}, dataCount={h.get('dataCount')} "
                          f"[{code}] {msg[:60]}")
                    print(f"     columns: {cols}")
                    if "CatalogYear" in base or "CatalogYear" in view:
                        miss = [c for c in CATALOG_YEAR_VISIBLE
                                if not any(c.replace(" ", "").lower()
                                           == str(x).replace(" ", "").lower() for x in cols)]
                        print("     screenshot fields present ✅" if not miss
                              else f"     ⚠ screenshot fields NOT in this view: {miss} "
                                   f"— matched the wrong view?")
                    hit = (view, h)
                    break
                flag = h.get("error") or f"[{code}] {msg[:50]}" or "no columns"
                print(f"  ✗  {view:<62} {flag}")
            if hit:
                break
        if hit:
            found[report] = hit
        else:
            print(f"  → NOT FOUND under {len(bases) * len(SUFFIXES)} candidate spellings.")
    return found


def try_list_endpoints():
    print("\n" + "=" * 78)
    print("[2] Will the module enumerate its own views? (ends the guessing for good)")
    print("=" * 78)
    for method, url in LIST_ENDPOINTS:
        try:
            req = urllib.request.Request(
                url, data=b"{}" if method == "POST" else None,
                headers={"Content-Type": "application/json"}, method=method)
            with urllib.request.urlopen(req, timeout=60) as r:
                body = r.read(200_000).decode("utf-8", errors="replace")
            names = sorted(set(re.findall(r'"(View_[A-Za-z0-9_]+)"', body)))
            print(f"  {method:<4} {url}\n       → {r.status if hasattr(r, 'status') else 200}, "
                  f"{len(body):,} bytes, {len(names)} View_ names")
            if names:
                print("       ⭐ VIEW LIST:")
                for n in names:
                    print(f"           {n}")
                return names
        except urllib.error.HTTPError as e:
            print(f"  {method:<4} {url}\n       → HTTP {e.code}")
        except Exception as e:                                   # noqa: BLE001
            print(f"  {method:<4} {url}\n       → {type(e).__name__}: {e}")
    print("  → no listing endpoint responded. Candidate sweep remains the method.")
    return []


def profile(report, view, cols):
    """Fetch a confirmed view with the PII columns withheld, and describe it."""
    print("\n" + "=" * 78)
    print(f"[3] Profiling {view}")
    print(f"    ({report})")
    print("=" * 78)

    denied = [c for c in cols if PII_DENY.search(c)]
    safe = [c for c in cols if c not in denied]
    if denied:
        print(f"    WITHHELD {len(denied)} column(s) as PII — not requested, so they")
        print(f"    never leave MAP: {denied}")
    print(f"    requesting {len(safe)} of {len(cols)}: {safe}")

    text, err = peek([{"viewName": view, "columnName": safe}],
                     cap=48 * 1024 * 1024, timeout=900)
    if err:
        print(f"    ERROR: {err}")
        return
    print(f"    read {len(text):,} chars (capped)")
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        h = header_of(text)
        print(f"    response exceeded the cap — header only: dataCount={h.get('dataCount')}, "
              f"{len(h.get('columns') or [])} columns.")
        print("    → the view is REAL and LARGE. Wire it into the daily fetch with a")
        print("      column subset rather than pulling it whole in a probe.")
        return
    ds = data[0] if isinstance(data, list) and data else data
    rows = ds.get("columnValue") or []
    rcols = [str(c).strip() for c in (ds.get("columnName") or [])]
    print(f"    dataCount={ds.get('dataCount')} parsed_rows={len(rows):,} "
          f"columns={len(rcols)}")
    if not rows:
        print("    no rows parsed.")
        return

    ci = {c: i for i, c in enumerate(rcols)}

    def cell(r, name):
        i = ci.get(name)
        if i is None or not isinstance(r, list) or i >= len(r) or r[i] is None:
            return ""
        return str(r[i]).strip()

    # Fill rate + cardinality per column: what is actually usable, before anyone
    # designs a reconciliation against it.
    print("\n    per-column fill rate and cardinality:")
    sample = rows[:60000]
    for c in rcols:
        vals = [cell(r, c) for r in sample]
        nonblank = [v for v in vals if v]
        distinct = len(set(nonblank))
        ex = sorted(set(nonblank), key=len)[:2]
        print(f"      {c[:34]:<36} fill {100.0 * len(nonblank) / len(sample):5.1f}%  "
              f"distinct {distinct:>7,}  e.g. {[e[:26] for e in ex]}")

    # Catalog Year is the dimension nothing we hold carries — say what it spans.
    ycol = next((c for c in rcols if re.search(r"catalog\s*year", c, re.I)), None)
    if ycol:
        years = Counter(cell(r, ycol) for r in rows if cell(r, ycol))
        print(f"\n    ⭐ {ycol}: {len(years)} distinct values across {sum(years.values()):,} rows")
        for y, n in sorted(years.items())[:25]:
            print(f"        {y:<14} {n:>9,}")

    ccol = next((c for c in rcols if c.strip().lower() in
                 ("college", "location", "collegeid", "college id")), None)
    if ccol:
        colleges = {cell(r, ccol) for r in rows if cell(r, ccol)}
        real = {c for c in colleges if c not in TEST_COLLEGES}
        print(f"\n    {ccol}: {len(colleges)} distinct ({len(real)} after dropping known test orgs)")


def main():
    print("=" * 78)
    print("Three new MAP Custom Reports — are they on the existing API?")
    print("Sam, 2026-08-19. Commits nothing; no student identifier requested.")
    print("=" * 78)

    listed = try_list_endpoints()
    found = sweep()

    print("\n" + "=" * 78)
    print("VERDICT")
    print("=" * 78)
    for report in BASES:
        if report in found:
            view, h = found[report]
            print(f"  ✅ {report}\n       → {view} ({len(h.get('columns') or [])} columns, "
                  f"dataCount={h.get('dataCount')})")
        else:
            print(f"  ❌ {report}\n       → not exposed under any candidate spelling")
    if len(found) == len(BASES):
        print("\n  ⇒ ALL THREE are on the endpoint the daily cron already pulls.")
        print("    Wiring = three entries in REQUEST_PAYLOAD. No new integration,")
        print("    and no reason to accept a push.")
    elif found:
        print(f"\n  ⇒ {len(found)} of {len(BASES)} exposed. The rest need their real")
        print("    viewName from Pedro — the report title is not the view name.")
    else:
        print("\n  ⇒ NONE exposed. Ask Pedro for the viewNames; do not conclude the")
        print("    reports are unavailable — a wrong guess and an absent view are")
        print("    indistinguishable from here.")
    if listed:
        print(f"\n  (the module also listed {len(listed)} views — see [2] above)")

    for report, (view, h) in found.items():
        cols = h.get("columns") or []
        if cols:
            profile(report, view, cols)

    return 0


if __name__ == "__main__":
    sys.exit(main())

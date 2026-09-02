"""
_probe_lifecycle_checks.py — did the CPL lifecycle BOOLEANS (and CollegeID2) reach the API?

WHY THIS EXISTS
---------------
Sam, 2026-09-02: Pedro (ITPI) has added new CPL lifecycle boolean checks to the
student MAP Custom Reports, and is adding a `CollegeID2` naming where a student
originated before arriving at the credit college — the key the noncredit FTES
calculation needs. The check that matters first is the COUNSELOR step: the
student met with a counselor and accepted the CPL on their plan. The funding
model's `pac` measure reads exactly that step, and
funding/_build_funding_performance.py SWEEPS six candidate spellings for it
rather than assuming one, because a guessed column name resolves to None and
silently omits the measure. This run finds the real spelling, the view it sits
on, and how the boolean is rendered on the wire — from the runner.

Runs ON THE GITHUB ACTIONS RUNNER (a session's egress is denied for this host).
Prints to the run log, which a session reads back via the GitHub MCP. Commits
nothing; writes nothing to disk.

THE FOUR TRAPS THIS IS BUILT AROUND (all paid for before; all in cpl_memory)
-------------------------------------------------------------------------
1. THE API MIRRORS THE REQUEST (`map-api-echoes-requested-columns`). A requested
   column comes back in `columnName` whether or not it exists, so the echo
   proves nothing. `columnName: []` leaves nothing to mirror — the columns that
   come back are then the API's own account of the view.
2. THAT SAME REQUEST ASKS FOR THE WHOLE DATASET. Every discovery read is capped
   at PEEK bytes; the header precedes `columnValue`, so a truncated read still
   carries the schema.
3. ONE VIEW 500s ON AN EMPTY COLUMN LIST. View_StudentDetailsCredits answered
   HTTP 500 to `[]` on 2026-08-19 while fifty bogus names answered 400 — and it
   was the real view. So enumeration falls back to a BISECT: request
   [anchor, candidate]; one bad name zeroes the response (measured 2026-08-14),
   so a name is valid IFF ROWS COME BACK. A 5xx is printed as a LEAD, never
   folded into the tally.
4. `dataCount` IS MAP'S CLAIM, NOT A COUNT. Rows are counted from columnValue.

WHAT IS AND IS NOT REQUESTED
----------------------------
Enumeration requests nothing. Profiling requests each view's keys plus the NEW
columns, after a PII denylist — the log prints what was withheld and why. On
the student-detail view `StudentMAPID` (salt-hashed and non-rotating — Pedro
via Sam, 2026-08-19 — and already fetched by the daily cron on this same
runner) is used IN MEMORY ONLY as the grouping key for the constant-within-
student test. It is never printed, never written, and no per-student figure is
emitted. A value of a new column is echoed only when at least MIN_ROWS rows
carry it.
"""
import json
import os
import re
import sys
import urllib.error
import urllib.request
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
from fetch_custom_report import REQUEST_PAYLOAD, _build_headers  # noqa: E402

GETREPORT = "https://mapwebapinew.azurewebsites.net/api/CustomReport/getReport"
PEEK = 512 * 1024
MIN_ROWS = 25      # a value is echoed to the log only when >= this many rows carry it
LOW_CARD = 12      # up to this many distinct values, a column's values are listed

STUDENT_DETAIL = "View_StudentDetailsCredits_APIDataset"
STUDENT_AGG = "View_StudentAggregatedValues_APIDataset"
STUDENT_PIT = "View_PointInTime_StudentAggregatedValues_APIDataset"
CATALOG_YEAR = "View_CollegeExhibitCRByCatalogYear_APIDataset"
VIEWS = [STUDENT_AGG, STUDENT_PIT, STUDENT_DETAIL, CATALOG_YEAR]

# Columns each view is KNOWN to carry that the daily fetch deliberately never
# requests. Named so the diff does not report them as new — "new to the
# probe" and "new on the view" are different claims.
HELD_KNOWN = {
    STUDENT_AGG: ["BirthDate", "FirstName", "LastName", "StudentID"],
    STUDENT_DETAIL: ["StudentMAPID", "Notes"],
}

# What a profile pull needs beside the new columns: the keys the cross-tabs
# are cut by. Nothing identity-shaped.
PROFILE_KEYS = {
    STUDENT_DETAIL: ["CollegeID", "Catalog Year", "CPLStatusPlan", "CPLPlanStatus",
                     "AppliedCredits", "TranscribedCredits"],
    STUDENT_AGG: ["College", "Catalog Year", "CPL Type Description",
                  "Potential Student", "Test Student", "Applied Credits",
                  "Transcribed Credits"],
    STUDENT_PIT: ["College", "Catalog Year", "Applied Credits", "Transcribed Credits"],
    CATALOG_YEAR: ["CollegeID", "Catalog Year", "CPLStatusPlan", "Student Count",
                   "Applied Credits", "Transcribed Credits"],
}
# In-memory grouping key for the constant-within-student test (see docstring).
GROUP_KEY = {STUDENT_DETAIL: "StudentMAPID"}
# A column known to exist on each view — the bisect's anchor.
ANCHOR = {STUDENT_DETAIL: "CollegeID", STUDENT_AGG: "College",
          STUDENT_PIT: "College", CATALOG_YEAR: "CollegeID"}

# Applied to NEW columns before any profiling request. Names, birth dates,
# contact details, direct student ids, free text, and anything that records
# WHO did something (a staff identity) are withheld.
PII_DENY = re.compile(
    r"(name|birth|dob|ssn|social|e-?mail|phone|address|street|zip|postal|"
    r"studentid|student\s*id|studentmapid|map\s*internal\s*student|notes?$|"
    r"comment|attest\w*by|\bby\b|user|login|created\s*by|modified\s*by|updated\s*by)",
    re.I)

# Swept ONLY when a view refuses to enumerate itself. Every shape a boolean
# for each of the six known checks — CPL Docs · Ed Plan · Analysis · Counselor
# · Student · Transcribed — plausibly takes, plus the origination pair.
LIFECYCLE_CANDIDATES = [
    "CPL Docs", "CPLDocs", "CPL Docs Uploaded", "CPLDocsUploaded", "Docs Uploaded",
    "DocsUploaded", "Upload", "Uploaded", "IsUploaded", "Documents", "CPL Documents",
    "Ed Plan", "EdPlan", "Education Plan", "EducationPlan", "IsEdPlan",
    "Analysis", "IsAnalysis", "Analysis Complete", "AnalysisComplete",
    "Counselor", "Counselor Step", "CounselorStep", "Counseling", "Counseling Step",
    "CounselingStep", "IsCounselor", "Counselor Accepted", "CounselorAccepted",
    "Counselor Approved", "CounselorApproved", "Met With Counselor", "MetWithCounselor",
    "CPL Plan Accepted", "CPLPlanAccepted", "Plan Accepted", "PlanAccepted",
    "Accepted", "IsAccepted", "Student Accepted", "StudentAccepted",
    "Student", "IsStudent", "Student Step", "StudentStep", "Student Reviewed",
    "StudentReviewed", "Student Acknowledged", "StudentAcknowledged",
    "Transcribed", "IsTranscribed", "Transcribed Step", "TranscribedStep",
]
ORIGIN_CANDIDATES = [
    "CollegeID2", "College ID2", "CollegeId2", "College ID 2", "LocID2", "LocId2",
    "Loc ID2", "LocationID2", "Location2", "Origin", "Origin College",
    "OriginCollegeID", "OriginCollege", "Origination", "OriginationCollegeID",
    "Origin LocID", "OriginLocID", "Origin Type", "OriginType", "NC CollegeID",
    "NCCollegeID", "Noncredit CollegeID", "Source College", "SourceCollegeID",
    "Submission Source", "SubmissionSource", "Entry Method", "EntryMethod",
    "Referring College", "ReferringCollegeID", "Home College", "HomeCollegeID",
]

# If the booleans landed on a NEW view rather than a new column, these are the
# spellings worth one bounded request each. A miss here proves nothing; a hit
# or a 5xx is a lead.
NEW_VIEW_CANDIDATES = [
    "View_StudentCPLPlan_APIDataset", "View_StudentCPLPlanStatus_APIDataset",
    "View_StudentPlanStatus_APIDataset", "View_StudentLifecycle_APIDataset",
    "View_StudentCPLLifecycle_APIDataset", "View_StudentDetailsCreditsV2_APIDataset",
    "View_StudentDetailsCredits2_APIDataset", "View_StudentAggregatedValuesV2_APIDataset",
    "View_StudentAggregatedValues2_APIDataset", "View_StudentPlanChecks_APIDataset",
]

TOKENS = ["CPL Docs", "Ed Plan", "Analysis", "Counselor", "Student", "Transcribed"]
TRUTHY = ("true", "yes", "y", "1", "t")
FALSY = ("false", "no", "n", "0", "f")

# The builder's sweep list, verbatim, so the verdict can say whether today's
# builder would have found the column without an edit.
BUILDER_SWEEP = ("Counselor Step", "Counselor", "CPL Plan Accepted",
                 "Plan Accepted", "Accepted", "Counseling Step")


# ── pure helpers (tested hermetically in tests/probe_lifecycle_checks_test.py) ──

def norm(s):
    return re.sub(r"\s+", " ", str(s or "").strip()).lower()


def header_of(text):
    """Header fields out of a possibly-truncated dataset response.

    json.loads cannot be used — the read is cut mid-`columnValue` by design —
    so the fields are lifted individually. `columnName` is taken only when its
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


def rows_started(text):
    """True when the (possibly truncated) response has begun emitting rows."""
    return re.search(r'"columnValue"\s*:\s*\[\s*\[', text) is not None


def truthy(v):
    if v is True:
        return True
    if v is False or v is None:
        return False
    return str(v).strip().lower() in TRUTHY


def falsy(v):
    if v is False:
        return True
    if v is True or v is None:
        return False
    return str(v).strip().lower() in FALSY


def blank(v):
    return v is None or (isinstance(v, str) and not v.strip())


def is_boolean_shaped(values):
    """A column is boolean-shaped when every non-blank value is a truthy or
    falsy spelling (or a JSON bool)."""
    seen = {v for v in values if not blank(v)}
    return bool(seen) and all(truthy(v) or falsy(v) for v in seen)


def kind_of(col):
    n = re.sub(r"[^a-z0-9]", "", col.lower())
    if re.search(r"collegeid2|locid2|locationid2|location2|origin|sourcecollege|"
                 r"referr|homecollege|entrymethod|submissionsource|nccollege", n):
        return "origin"
    if re.search(r"counsel|accept|doc|upload|edplan|educationplan|analys|"
                 r"transcri|student|step|check", n):
        return "lifecycle"
    return "other"


def checks_in(plan_status):
    """The lifecycle tokens present in a CPLPlanStatus value. Split and strip;
    never assume a trailing delimiter (29,902 rows carry a bare `Transcribed`)."""
    return {p.strip() for p in str(plan_status or "").split("|") if p.strip()}


def fmt_pct(n, d):
    return f"{100.0 * n / d:5.1f}%" if d else "  n/a"


# ── network ────────────────────────────────────────────────────────────────

def peek(payload, cap=PEEK, timeout=600):
    """POST and read at most `cap` bytes. Returns (status, text, error)."""
    body = json.dumps(payload).encode()
    req = urllib.request.Request(GETREPORT, data=body, headers=_build_headers(),
                                 method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read(cap).decode("utf-8", errors="replace"), None
    except urllib.error.HTTPError as e:
        return e.code, e.read(4096).decode("utf-8", errors="replace"), None
    except Exception as e:                                       # noqa: BLE001
        return None, "", f"{type(e).__name__}: {e}"


def fetch_full(payload, timeout=900):
    """POST and parse the whole response. Only for a confirmed column subset."""
    body = json.dumps(payload).encode()
    req = urllib.request.Request(GETREPORT, data=body, headers=_build_headers(),
                                 method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read()
    return json.loads(raw), len(raw)


# ── [0] control ────────────────────────────────────────────────────────────

def control():
    print("=" * 78)
    print("[0] CONTROL — does `columnName: []` still enumerate a KNOWN-GOOD view?")
    print("    A negative below is only as good as this control.")
    print("=" * 78)
    for v in ("View_CollegeCourses_APIDataset", "View_CreditDistributionByCollege_APIDataset"):
        status, text, err = peek([{"viewName": v, "columnName": []}])
        h = header_of(text)
        if h["columns"]:
            print(f"  OK  {v} -> {len(h['columns'])} columns (HTTP {status}). "
                  f"The instrument works.")
            return True
        print(f"  --  {v} -> HTTP {status} code={h['responseCode']} "
              f"msg={(h['responseMessage'] or err or '')[:60]!r}")
    print("  !!  NO known-good view enumerated. Every 'not Valid' below may be the")
    print("      REQUEST being rejected, not the column being absent. The bisect")
    print("      still runs — it does not depend on empty-list enumeration.")
    return False


# ── [1] enumerate ──────────────────────────────────────────────────────────

def enumerate_view(view):
    """Ask the view for its own schema three ways. Returns (columns, how, lead)."""
    attempts = [
        ("columnName: []", {"viewName": view, "columnName": []}),
        ("columnName omitted", {"viewName": view}),
        ('columnName: ["*"]', {"viewName": view, "columnName": ["*"]}),
    ]
    lead = None
    for how, payload in attempts:
        status, text, err = peek([payload])
        h = header_of(text)
        cols = h["columns"] or []
        code = h["responseCode"] or ""
        msg = (h["responseMessage"] or err or "").strip()
        if cols and cols != ["*"]:
            print(f"    enumerated via {how}: {len(cols)} columns "
                  f"(HTTP {status}, dataCount={h['dataCount']})")
            return cols, how, lead
        flag = f"HTTP {status} code={code or '-'} {msg[:70]!r}"
        print(f"    {how:<22} -> no schema  [{flag}]")
        if (status and status >= 500) or code.startswith("5"):
            lead = flag
    return [], None, lead


def known_columns(view):
    req = next((d["columnName"] for d in REQUEST_PAYLOAD if d["viewName"] == view), [])
    return list(req) + HELD_KNOWN.get(view, [])


def diff_columns(view, live_cols):
    known = {norm(c) for c in known_columns(view)}
    new = [c for c in live_cols if norm(c) not in known]
    gone = [c for c in known_columns(view) if norm(c) not in {norm(x) for x in live_cols}]
    return new, gone


# ── [2] bisect ─────────────────────────────────────────────────────────────

def bisect(view, candidates):
    """Which candidate column names does the view accept? A name is valid IFF
    rows come back beside a known-good anchor."""
    anchor = ANCHOR[view]
    status, text, err = peek([{"viewName": view, "columnName": [anchor]}])
    if not rows_started(text):
        h = header_of(text)
        print(f"    anchor {anchor!r} alone returned NO rows (HTTP {status}, "
              f"code={h['responseCode']}, {(h['responseMessage'] or err or '')[:60]!r}) "
              f"— the bisect cannot run on this view today.")
        return None
    print(f"    anchor {anchor!r} alone returns rows — sweeping {len(candidates)} "
          f"candidate names (valid IFF rows come back beside the anchor).")
    valid, leads = [], []
    for cand in candidates:
        status, text, err = peek([{"viewName": view, "columnName": [anchor, cand]}])
        if rows_started(text):
            valid.append(cand)
            print(f"      OK  {cand!r}")
        elif (status and status >= 500):
            leads.append((cand, status))
            print(f"      ??  {cand!r}  HTTP {status} — a 5xx is a LEAD, not a miss")
    if not valid:
        print("      (no candidate accepted)")
    if leads:
        print("    !!  Odd ones out — chase before reporting absence:")
        for cand, status in leads:
            print(f"        {cand!r} -> HTTP {status}")
    return valid


# ── [3] profile ────────────────────────────────────────────────────────────

def profile_rows(view, rcols, rows, new_cols, group_key=None):
    """Describe the NEW columns of a dataset. Pure: takes parsed rows, prints.

    Prints, per new column: JSON types on the wire, fill, values when low-
    cardinality (each only when >= MIN_ROWS rows carry it), and — when the
    column is boolean-shaped — its agreement with every CPLPlanStatus token,
    its split by disposition, by units, by college, and whether it is constant
    within a student. Returns a dict of the measured facts for the verdict.
    """
    ci = {norm(c): i for i, c in enumerate(rcols)}

    def col(name):
        i = ci.get(norm(name))
        if i is None:
            return None
        return [r[i] if isinstance(r, list) and i < len(r) else None for r in rows]

    n = len(rows)
    facts = {}
    plan_status = col("CPLPlanStatus")
    disposition = col("CPLStatusPlan")
    tcr = col("TranscribedCredits") or col("Transcribed Credits")
    acr = col("AppliedCredits") or col("Applied Credits")
    college = col("CollegeID") or col("College")
    potential = col("Potential Student")
    test_student = col("Test Student")
    group = col(group_key) if group_key else None
    tokens_per_row = [checks_in(v) for v in plan_status] if plan_status else None

    def units_pos(series, i):
        try:
            return float(str(series[i] or "0").strip() or 0) > 0
        except ValueError:
            return False

    # Baseline: is the EXISTING checklist constant within a student? The lane
    # asked for this re-measure before the grain changes; it costs nothing here.
    if group and plan_status:
        by = defaultdict(set)
        for g, v in zip(group, plan_status):
            if not blank(g):
                by[g].add(str(v or "").strip())
        const = sum(1 for s in by.values() if len(s) == 1)
        print(f"\n    baseline — CPLPlanStatus constant within a student: "
              f"{const:,} of {len(by):,} students ({fmt_pct(const, len(by))})")
        facts["plan_status_constant_within_student"] = (const, len(by))

    for name in new_cols:
        vals = col(name)
        print(f"\n    ── {name}")
        if vals is None:
            print("       (not present in the response — the API dropped it?)")
            continue
        types = Counter(type(v).__name__ for v in vals)
        nonblank = [v for v in vals if not blank(v)]
        print(f"       wire types: {dict(types)}")
        print(f"       fill: {len(nonblank):,} of {n:,} ({fmt_pct(len(nonblank), n)})")
        distinct = Counter(str(v).strip() for v in nonblank)
        print(f"       distinct non-blank values: {len(distinct):,}")
        if len(distinct) <= LOW_CARD:
            for v, c in distinct.most_common():
                shown = repr(v) if c >= MIN_ROWS else f"<value withheld: {c} rows>"
                print(f"         {shown:<40} {c:>9,}")
        else:
            big = [(v, c) for v, c in distinct.most_common(10) if c >= MIN_ROWS]
            if big:
                print("       top values (each carried by >= MIN_ROWS rows):")
                for v, c in big:
                    print(f"         {v[:40]!r:<42} {c:>9,}")
        f = facts[name] = {"kind": kind_of(name), "fill": len(nonblank), "n": n,
                           "types": dict(types), "boolean": is_boolean_shaped(nonblank)}

        if college is not None and f["kind"] == "origin":
            same = sum(1 for a, b in zip(vals, college)
                       if not blank(a) and str(a).strip() == str(b or "").strip())
            print(f"       equals the enrolling {('CollegeID' if 'collegeid' in ci else 'College')}"
                  f" on {same:,} of {len(nonblank):,} filled rows "
                  f"({fmt_pct(same, len(nonblank))}) — the ruled invariant is NEVER "
                  f"defaulted to the enrolling college")
            f["equals_enrolling"] = same
            zeros = sum(1 for v in nonblank if str(v).strip() in ("0", "0.0"))
            if zeros:
                print(f"       literal zero on {zeros:,} rows — a zero is not NULL; ask "
                      f"which of the two it means")

        if not f["boolean"]:
            continue

        t = [truthy(v) for v in vals]
        nt = sum(t)
        print(f"       boolean-shaped: TRUE on {nt:,} rows ({fmt_pct(nt, n)}), "
              f"FALSE on {sum(1 for v in vals if falsy(v)):,}, blank on "
              f"{n - len(nonblank):,}")
        f["true"] = nt
        if tokens_per_row is not None:
            print("       agreement with each CPLPlanStatus check "
                  "(both / TRUE-only / check-only / agreement of the union):")
            per_tok = {}
            for tok in TOKENS:
                both = sum(1 for ok, s in zip(t, tokens_per_row) if ok and tok in s)
                t_only = nt - both
                k_only = sum(1 for ok, s in zip(t, tokens_per_row) if not ok and tok in s)
                union = both + t_only + k_only
                agree = 100.0 * both / union if union else 0.0
                print(f"         {tok:<12} {both:>9,} {t_only:>9,} {k_only:>9,}   {agree:5.1f}%")
                per_tok[tok] = (agree, both, t_only, k_only)
            top = max(v[0] for v in per_tok.values())
            # A tie is reported as a tie: on a plan-level checklist several
            # checks can sit on the same rows, and picking the first would
            # name a match the data did not make.
            tied = [tok for tok, v in per_tok.items() if abs(v[0] - top) < 1e-9]
            f["best_token"] = (tied[0],) + per_tok[tied[0]]
            f["tied_tokens"] = tied
            if len(tied) > 1:
                print(f"       !! tied at {top:.1f}%: {tied} — the data does not single one out")
        if disposition is not None:
            by_disp = Counter(str(d or "").strip() for d, ok in zip(disposition, t) if ok)
            print("       TRUE rows by CPLStatusPlan (the disposition):")
            for d, c in by_disp.most_common():
                print(f"         {d or '(blank)':<28} {c:>9,}")
            f["by_disposition"] = dict(by_disp)
        if tcr is not None:
            with_tx = sum(1 for i, ok in enumerate(t) if ok and units_pos(tcr, i))
            print(f"       TRUE with transcribed units > 0: {with_tx:,} of {nt:,}")
            f["true_with_transcribed_units"] = with_tx
        if acr is not None:
            with_ap = sum(1 for i, ok in enumerate(t) if ok and units_pos(acr, i))
            print(f"       TRUE with applied units > 0:     {with_ap:,} of {nt:,}")
            f["true_with_applied_units"] = with_ap
        if potential is not None:
            pot = sum(1 for p, ok in zip(potential, t) if ok and norm(p) == "yes")
            print(f"       TRUE with Potential Student = Yes: {pot:,} of {nt:,}")
        if test_student is not None:
            ts = sum(1 for p, ok in zip(test_student, t) if ok and norm(p) == "yes")
            print(f"       TRUE on Test Student = Yes rows:   {ts:,} of {nt:,}")
        if college is not None:
            cs = {str(c).strip() for c, ok in zip(college, t) if ok and not blank(c)}
            print(f"       colleges with any TRUE: {len(cs):,}")
            f["colleges_true"] = len(cs)
        if group:
            by = defaultdict(set)
            for g, ok in zip(group, t):
                if not blank(g):
                    by[g].add(ok)
            const = sum(1 for s in by.values() if len(s) == 1)
            print(f"       constant within a student: {const:,} of {len(by):,} "
                  f"({fmt_pct(const, len(by))}) — 100% means a PLAN-level flag "
                  f"repeated per CR row; less means a per-row check")
            f["constant_within_student"] = (const, len(by))
    return facts


def profile(view, new_cols):
    denied = [c for c in new_cols if PII_DENY.search(c)]
    safe = [c for c in new_cols if c not in denied]
    if denied:
        print(f"    WITHHELD {len(denied)} new column(s) as PII-shaped — never requested, "
              f"so they never leave MAP: {denied}")
    if not safe:
        print("    nothing left to profile.")
        return {}
    keys = [k for k in PROFILE_KEYS.get(view, []) if norm(k) not in {norm(c) for c in safe}]
    group_key = GROUP_KEY.get(view)
    cols = keys + safe + ([group_key] if group_key else [])
    if group_key:
        print(f"    {group_key} is requested for IN-MEMORY grouping only (never printed).")
    print(f"    requesting {len(cols)} columns: {keys + safe}")
    try:
        data, nbytes = fetch_full([{"viewName": view, "columnName": cols}])
    except Exception as e:                                       # noqa: BLE001
        print(f"    ERROR fetching the profile pull: {type(e).__name__}: {e}")
        return {}
    ds = data[0] if isinstance(data, list) and data else {}
    rows = ds.get("columnValue") or []
    rcols = [str(c).strip() for c in (ds.get("columnName") or [])]
    print(f"    {nbytes:,} bytes · dataCount={ds.get('dataCount')} · rows parsed "
          f"{len(rows):,} · generatedAt={ds.get('generatedAt')}")
    if not rows:
        print("    no rows parsed — a requested name the API rejects zeroes the response.")
        return {}
    return profile_rows(view, rcols, rows, safe, group_key)


# ── main ───────────────────────────────────────────────────────────────────

def main():
    print("=" * 78)
    print("CPL lifecycle booleans + CollegeID2 — are they on the API the cron pulls?")
    print("Sam, 2026-09-02. Commits nothing; no student identifier printed.")
    print("=" * 78)
    control()

    print("\n" + "=" * 78)
    print("[1] The four views' LIVE schemas, diffed against what the daily fetch")
    print("    already requests (+ the columns it deliberately holds)")
    print("=" * 78)
    new_by_view, gone_by_view, unenumerated = {}, {}, []
    for view in VIEWS:
        print(f"\n### {view}")
        cols, how, lead = enumerate_view(view)
        if not cols:
            unenumerated.append(view)
            if lead:
                print(f"    !!  {lead} — the 2026-08-19 shape: a view that EXISTS but "
                      f"chokes on the request. Falling back to the bisect.")
            continue
        new, gone = diff_columns(view, cols)
        new_by_view[view], gone_by_view[view] = new, gone
        print(f"    live columns ({len(cols)}): {cols}")
        print(f"    NEW vs our request+held: {new if new else 'none'}")
        if gone:
            print(f"    !!  requested/held but NOT on the live view: {gone}")

    if unenumerated:
        print("\n" + "=" * 78)
        print("[2] BISECT the views that would not enumerate — a name is valid IFF")
        print("    rows come back beside a known-good anchor (the echo proves nothing)")
        print("=" * 78)
        for view in unenumerated:
            print(f"\n### {view}")
            valid = bisect(view, LIFECYCLE_CANDIDATES + ORIGIN_CANDIDATES)
            if valid:
                new, _ = diff_columns(view, valid)
                new_by_view[view] = new
                print(f"    accepted names not already in our request: {new if new else 'none'}")

    print("\n" + "=" * 78)
    print("[1b] Did the booleans land on a NEW view instead? (one bounded request each)")
    print("=" * 78)
    for v in NEW_VIEW_CANDIDATES:
        status, text, err = peek([{"viewName": v, "columnName": []}])
        h = header_of(text)
        if h["columns"]:
            print(f"  !!  {v} EXISTS: {len(h['columns'])} columns: {h['columns']}")
        elif status and status >= 500:
            print(f"  ??  {v} -> HTTP {status} — a 5xx is a LEAD (the 2026-08-19 shape)")
        else:
            print(f"  --  {v} -> HTTP {status} {(h['responseMessage'] or err or '')[:40]!r}")

    print("\n" + "=" * 78)
    print("[3] PROFILE the new columns (PII-denylisted; values echoed only when")
    print(f"    >= {MIN_ROWS} rows carry them)")
    print("=" * 78)
    facts = {}
    for view, new in new_by_view.items():
        if not new:
            continue
        print(f"\n### {view}")
        facts[view] = profile(view, new)

    print("\n" + "=" * 78)
    print("VERDICT")
    print("=" * 78)
    any_new = any(new_by_view.get(v) for v in VIEWS)
    if not any_new:
        print("  No new column on any of the four views today, and no new view under")
        print("  the candidate spellings. Either the additions are in the BUILDER but")
        print("  not yet exposed on this API, or they sit on a view/name not swept —")
        print("  ask Pedro for the viewName + header (the 2026-08-19 path).")
    for view in VIEWS:
        new = new_by_view.get(view) or []
        if not new:
            continue
        print(f"\n  {view}")
        for name in new:
            f = (facts.get(view) or {}).get(name)
            if not f:
                print(f"    + {name!r}  (not profiled)")
                continue
            line = f"    + {name!r}  kind={f['kind']}  fill={fmt_pct(f['fill'], f['n']).strip()}"
            if f.get("boolean"):
                line += f"  boolean TRUE={f['true']:,}"
                if f.get("best_token"):
                    tok, agree, both, t_only, k_only = f["best_token"]
                    tied = f.get("tied_tokens") or [tok]
                    line += (f"  ~ CPLPlanStatus {tied if len(tied) > 1 else repr(tok)}"
                             f" ({agree:.1f}% agreement{', TIED' if len(tied) > 1 else ''})")
                if f.get("constant_within_student"):
                    c, d = f["constant_within_student"]
                    line += f"  const-in-student={fmt_pct(c, d).strip()}"
            print(line)
            if f.get("boolean") and re.search(r"counsel|accept", name, re.I):
                hit = name in BUILDER_SWEEP
                print(f"      -> the funding builder's sweep {'ALREADY MATCHES' if hit else 'DOES NOT match'} "
                      f"this spelling{'' if hit else ' — add it to the sweep in _build_funding_performance.py'}")
                if f["types"].get("bool"):
                    print("      -> rendered as a JSON bool: the builder's "
                          "`(row[i] or '').strip()` would raise on True — fix before wiring")
    return 0


if __name__ == "__main__":
    sys.exit(main())

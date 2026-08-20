#!/usr/bin/env python3
"""Load the two new MAP Custom Report views into Supabase STAGING tables.

    python3 kb/_sync_map_custom_reports.py --dry-run          # parse + report
    python3 kb/_sync_map_custom_reports.py                    # needs SUPABASE_SERVICE_KEY

WHAT THIS IS
------------
`fetch_custom_report.py` pulls ten datasets; two of them have never been loaded:

    View_CollegeExhibitCRByCatalogYear_APIDataset  ->  stg_map_college_cr_unit
    View_StudentDetailsCredits_APIDataset          ->  stg_map_student_credit

Both have a live counterpart already (`map_college_cr_unit` 204,714 rows,
`map_student_credit` 537,908). MAP's own counts are higher — +3.07% and +10.02%
— which `cpl_memory: two-student-counts-disagree-indicator-suspected` predicts
is OUR STALENESS RESOLVING rather than a defect. That is a claim to confirm
per-college, which is why this script reports before it writes.

IT WRITES STAGING ONLY, AND THAT IS THE POINT
---------------------------------------------
The live tables are reviewer-gated, feed the Course Credit tab, the College
Action page and both published aggregates, and one of them is student grain.
Replacing them from a runner would put a destructive step somewhere a
half-finished insert leaves a live tab blank. So the swap is a separate gated
SQL step (`docs/map_custom_report_load.md`), exactly as
`docs/map_student_credit_reload.md` established. Nothing live changes here.

MINIMISATION HAPPENS TWICE
--------------------------
`fetch_custom_report.py` decides what we ASK FOR; this decides what we KEEP, and
it keeps less. The view carries student attributes the request already accepted
(Location, CPL Mode, CPL Program, Program, ProgramGoal, Transfer Destination)
and this script deliberately drops every one: nothing downstream reads them, and
a student-grain column with no consumer is pure liability. See HELD_COLUMNS.

`StudentMAPID` never lands. It is salt-hashed (Pedro Campos, ITPI, via Sam
2026-08-19) but it is still a per-student identifier, and the spec we sent MAP
is explicit about the need it serves: "we only ever count distinct students — we
never look one up." So the hash is used to DERIVE a dense surrogate inside the
pull and then discarded.

THE THREE STATUS-SHAPED FIELDS (Sam, 2026-08-19)
------------------------------------------------
Getting these wrong is plausible rather than obvious, so they are named here:

    Status           the ARTICULATION APPROVAL STAGE the row sits at.
                     Example "Initiator" — a MAP approval-cascade role.
    CPLStatusPlan    the action taken on the CR. "Needs Action",
                     "Not Applicable". THE DISPOSITION. Already held.
    CPLPlanStatus    NOT a status. The LIFECYCLE CHECKS, and there can be
                     SEVERAL, pipe-delimited: "CPL Docs |Transcribed".

`Status` and `CPLPlanStatus` are dimensions no table we hold carries, which is
the substantive reason to load this view; freshness is the lesser one.

`CPLPlanStatus` is stored VERBATIM, pipes intact. Splitting it would fix its
grain before anyone has measured it, and a multi-valued checklist is not
something you filter on until it has been given fields.

The sandbox cannot reach *.supabase.co (CLAUDE.md Rule 10c) or the MAP API, so
this is a runner path — .github/workflows/map-custom-report-load.yml.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import glob
import json
import os
import sys
import urllib.error
import urllib.request
from collections import Counter

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co")
BATCH = 5000

# How many of the lexicographically-smallest student hashes to retain as the
# salt-rotation sketch. A uniform sample of the key set, so overlap between
# consecutive pulls estimates their Jaccard similarity. 2,000 of ~42,000 is
# enough to make "stable" and "rotated" unmistakable without holding a hash per
# student.
SKETCH_N = 2000

CR_UNIT_VIEW = "View_CollegeExhibitCRByCatalogYear_APIDataset"
STUDENT_VIEW = "View_StudentDetailsCredits_APIDataset"
# The exhibit catalogue. We do not load its rows — `export_credential_reference`
# already rolls those up — we take exactly two columns from it, because they are
# the ones nothing else carries: the ACE id and what that id IS.
CATALOG_VIEW = "View_ExhibitCRsCatalog_Dataset"

# ── Column contracts ───────────────────────────────────────────────────────
# Mapped BY NAME, never by position. The API echoes the requested columnName
# array back verbatim — including for an INVALID request (cpl_memory:
# map-api-echoes-requested-columns) — so the echo is the request, and a silent
# reordering upstream would go unseen by a positional read. A missing name is a
# hard failure rather than a null column.

CR_UNIT_COLUMNS = {
    "CollegeID": "college_id",
    "Source Code": "source_code",
    "ExhibitID": "exhibit_id",
    "Credit Recommendation": "credit_rec",
    "College Course": "college_course",
    "CPLStatusPlan": "cpl_status_plan",
    "Catalog Year": "catalog_year",
    "Course Type": "course_type",
    "Student Count": "distinct_students",
    "Potential Credits": "sum_potential_credits",
    "Articulated Credits": "sum_articulated_credits",
    "Applied Credits": "sum_applied_credits",
    "Transcribed Credits": "sum_transcribed_credits",
}

STUDENT_COLUMNS = {
    "CollegeID": "college_id",
    "ExhibitID": "exhibit_id",
    "Course Type": "course_type",
    "Catalog Year": "catalog_year",
    "Credit Recommendation": "credit_rec",
    "CPLStatusPlan": "cpl_status_plan",
    "Status": "status",
    "CPLPlanStatus": "cpl_plan_status",
    "PotentialCredits": "potential_credits",
    "CreditsInReview": "credits_in_review",
    "AppliedCredits": "applied_credits",
    "TranscribedCredits": "transcribed_credits",
    "ArticulatedCredits": "articulated_credits",
    "MilitaryCredits": "military_credits",
    "NonMilitaryCredits": "non_military_credits",
    "ApprenticeshipCredits": "apprenticeship_credits",
}

STUDENT_KEY_COLUMN = "StudentMAPID"

# Fetched and deliberately NOT stored. Listed rather than merely omitted so the
# decision is visible to whoever next widens the load: every one is a student
# attribute with no consumer downstream.
HELD_COLUMNS = {
    "Location": "college name; college_id already identifies the college",
    "CPL Mode": "student attribute, no consumer",
    "CPL Program": "student attribute, no consumer",
    "Program": "student attribute, no consumer",
    "ProgramGoal": "student attribute, no consumer",
    "Transfer Destination": "student attribute, no consumer",
    "College Course": "college-entered free text; held at articulation grain already",
    "Source Code": "held at articulation grain already",
    "CourseCredits": "credit split, no consumer",
    "AreaCredits": "credit split, no consumer",
    "ElectiveCredits": "credit split, no consumer",
    "DefaultAreaCredits": "credit split, no consumer",
    STUDENT_KEY_COLUMN: "per-student identifier; used to derive a surrogate, then discarded",
}

INT_COLUMNS = {"college_id", "distinct_students", "student_key"}

# ── Blank numerics: zero-fill ONLY where the LIVE table says NOT NULL ───────
# The two live tables genuinely disagree, so the rule is per-table and each one
# mirrors its own contract rather than a house style:
#
#   map_college_cr_unit   every numeric is NOT NULL, and live holds 0
#                         (200,106 rows at sum_applied_credits = 0)
#   map_student_credit    applied_credits and transcribed_credits are NULLABLE
#                         and live HOLDS nulls (31,467 / 19,533), so a
#                         zero-fill there would be the same representation
#                         change #1252 removed, in the other direction
#
# Zero is the source's own meaning here, not an invention. The blanks are not
# scattered: on the by-catalog-year view `sum_applied_credits` is blank on
# EXACTLY the 26,953 `Not Applicable` rows and on no other disposition — the API
# omits the value precisely where the recommendation was ruled out. That is what
# map_dataset_sql_for_malone caveat 4 describes: "All four credit fields are 0 on
# unapproved rows. That is correct behaviour, not missing data."
#
# The columns left OUT of these sets are nullable live and stay nullable.
CR_UNIT_ZERO_FILL = {
    "distinct_students", "sum_potential_credits", "sum_articulated_credits",
    "sum_applied_credits", "sum_transcribed_credits",
}
STUDENT_ZERO_FILL = {
    "potential_credits", "credits_in_review", "articulated_credits",
    "military_credits", "non_military_credits", "apprenticeship_credits",
}
NUM_COLUMNS = {
    "sum_potential_credits", "sum_articulated_credits", "sum_applied_credits",
    "sum_transcribed_credits", "potential_credits", "credits_in_review",
    "applied_credits", "transcribed_credits", "articulated_credits",
    "military_credits", "non_military_credits", "apprenticeship_credits",
}


# ── Parsing ────────────────────────────────────────────────────────────────

def find_input(path: str | None) -> str | None:
    """Locate the CustomReport pull. Same resolution order the funding build uses."""
    if path and os.path.exists(path):
        return path
    latest = os.path.join(os.getcwd(), "CustomReport_latest.json")
    if os.path.exists(latest):
        return latest
    cands = sorted(glob.glob(os.path.join(os.getcwd(), "CustomReport_*.json")))
    return cands[-1] if cands else None


def ace_titles(report: list) -> list[dict]:
    """AceID -> Title, from the exhibit catalogue the daily pull already fetches.

    WHY THIS IS HERE AT ALL. `map_student_credit` keys on the ACE exhibit id
    (`MOS-42A-001`), and 4,001 of its Needs Action rows carry a recommendation
    that names no course — "Credit may be granted on the basis of an
    individualized assessment of the student", and nothing more. Sam,
    2026-08-20: *"if there is no course or discipline, it's meaningless and a
    copout on ACE's part."* He is right; the row's remaining content is the
    EXHIBIT, i.e. the training ACE reviewed. `MOS-42A-001` means nothing to a
    counsellor. "Human Resources Specialist" does.

    `fetch_custom_report.py` has asked this view for `AceID` AND `Title` since
    2026-08-14 and stored neither, so the pair has been arriving daily and being
    dropped. That is the cost side of "minimisation happens twice": a column
    kept out for having no consumer is invisible until something needs it.

    Deliberately NOT loading the catalogue's other 12 columns — the rollup owns
    those, and a second copy of a big table is how two numbers start disagreeing.
    """
    ds = dataset(report, CATALOG_VIEW)
    if ds is None:
        return []
    cols = [c.strip() for c in (ds.get("columnName") or [])]
    try:
        i_ace, i_title = cols.index("AceID"), cols.index("Title")
    except ValueError:
        # A rename upstream must not pass silently as "no titles today".
        raise SystemExit(
            f"FATAL: {CATALOG_VIEW} no longer exposes AceID and/or Title "
            f"(saw {cols}). The Cx guidance list depends on that pair; fix the "
            "column contract rather than shipping a titleless list.")

    best: dict[str, str] = {}
    for row in ds.get("data") or []:
        if not isinstance(row, list) or len(row) <= max(i_ace, i_title):
            continue
        ace, title = _clean(row[i_ace]), _clean(row[i_title])
        if not ace or not title:
            continue
        # One id, many catalogue rows (a row per credit recommendation). Titles
        # agree in practice; keep the LONGEST rather than the last so an
        # abbreviated variant cannot win by arriving later.
        if len(title) > len(best.get(ace, "")):
            best[ace] = title
    return [{"exhibit_id": k, "title": v} for k, v in sorted(best.items())]


def dataset(report: list, view_name: str) -> dict | None:
    for ds in report if isinstance(report, list) else []:
        if ds.get("viewName") == view_name:
            return ds
    return None


def _to_int(v):
    if v is None or v == "":
        return None
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return None


def _to_num(v):
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _clean(v):
    """Trim, and otherwise pass the value through — INCLUDING the empty string.

    An earlier cut mapped "" to None and called that harmless. It is not, on two
    counts, both caught by the staging gate rather than by review:

    1. BLANKNESS IS DATA. map_dataset_sql_for_malone caveat 2 asks us not to
       normalise it: the -Course variant arrives as "Default Credit", the -Area
       variant EMPTY, at least one college sends a literal "-". Collapsing ""
       into None is precisely the normalisation the caveat forbids — the
       docstring claimed to honour it while breaking it for the empty case.

    2. THE LIVE TABLE IS THE CONTRACT. map_college_cr_unit stores "" today:
       414 catalog_year, 348 exhibit_id, 196,044 college_course, 619
       source_code. Swapping in NULLs would silently change the representation
       of blankness on ~200k rows — `count(distinct catalog_year)` alone goes
       9 to 8 — in what is supposed to be a refresh. A load must reproduce its
       source, not improve it; improving it is a separate, argued change.

    Numeric columns still coerce "" to None, in _to_int/_to_num, because "" is
    not a number. That is a type conversion, not a normalisation of meaning.
    """
    if v is None:
        return None
    return str(v).strip()


def _coerce(col: str, value, zero_fill=frozenset()):
    if col in INT_COLUMNS:
        v = _to_int(value)
        return 0 if v is None and col in zero_fill else v
    if col in NUM_COLUMNS:
        v = _to_num(value)
        return 0.0 if v is None and col in zero_fill else v
    return _clean(value)


def map_rows(ds: dict, contract: dict, view_name: str, extra_needed=(),
             zero_fill=frozenset()) -> tuple[list, dict]:
    """Map positional rows to dicts via the column NAME contract.

    Returns (rows, index_of_extra_columns). A contract name absent from the
    payload raises: a silently-null column is the failure mode that survives
    review, and this is exactly the rename the spec asked MAP to flag.
    """
    names = ds.get("columnName") or []
    index = {n: i for i, n in enumerate(names)}
    missing = [n for n in contract if n not in index]
    if missing:
        raise SystemExit(
            f"FATAL: {view_name} is missing requested column(s): {missing}\n"
            f"  payload columns: {names}\n"
            "  A rename upstream is the documented risk here — do not load a "
            "null column over live data. Fix the contract, then re-run."
        )
    missing_extra = [n for n in extra_needed if n not in index]
    if missing_extra:
        raise SystemExit(f"FATAL: {view_name} is missing {missing_extra}")

    pairs = [(index[src], dst) for src, dst in contract.items()]
    rows = []
    for raw in ds.get("columnValue") or []:
        rows.append({dst: _coerce(dst, raw[i], zero_fill) for i, dst in pairs})
    return rows, index


# ── Student surrogate key ──────────────────────────────────────────────────

def assign_student_keys(ds: dict, rows: list, index: dict) -> tuple[list, dict]:
    """Replace the hashed StudentMAPID with a dense surrogate 1..N.

    The surrogate is assigned by sorted hash, so it is deterministic for a given
    pull. It is NOT stable across pulls, and does not need to be: student_key is
    only ever `count(distinct ...)` in this codebase (supabase_map_college_goal2,
    supabase_map_college_credit_summary, supabase_credential_volume), and a
    distinct-count is invariant under relabelling. Nothing joins to it and
    nothing outside map_student_credit stores it — checked, not assumed.

    That is also why the incoming keys do NOT have to line up with the current
    table's 1..42,346, which came from a different pipeline (Access tblStudentKey)
    and cannot be joined to a hash in either direction.
    """
    hcol = index[STUDENT_KEY_COLUMN]
    raw_values = [(_clean(r[hcol]) if hcol < len(r) else None)
                  for r in (ds.get("columnValue") or [])]
    distinct = sorted({h for h in raw_values if h})
    key_of = {h: i + 1 for i, h in enumerate(distinct)}

    unkeyed = 0
    for row, h in zip(rows, raw_values):
        if h:
            row["student_key"] = key_of[h]
        else:
            row["student_key"] = None
            unkeyed += 1

    stats = {
        "distinct_students": len(distinct),
        "rows_without_key": unkeyed,
        "sketch": distinct[:SKETCH_N],
        "hash_lengths": Counter(len(h) for h in distinct[:5000]),
    }
    return rows, stats


# ── Reporting ──────────────────────────────────────────────────────────────

def per_college(rows: list) -> Counter:
    return Counter(r.get("college_id") for r in rows)


def report_cr_unit(ds, rows):
    print(f"\n── {CR_UNIT_VIEW}")
    print(f"   dataCount (MAP)     {ds.get('dataCount'):,}"
          if isinstance(ds.get("dataCount"), int) else f"   dataCount {ds.get('dataCount')}")
    print(f"   rows parsed         {len(rows):,}")
    if isinstance(ds.get("dataCount"), int) and ds["dataCount"] != len(rows):
        print("   ⚠️  parsed rows != dataCount — the pull is short or padded. STOP.")
    pc = per_college(rows)
    print(f"   colleges            {len([c for c in pc if c is not None])}")
    print(f"   live table          map_college_cr_unit (204,714 rows at last count)")
    disp = Counter(r.get("cpl_status_plan") for r in rows)
    print("   CPLStatusPlan       " + ", ".join(
        f"{k or '(null)'} {v:,}" for k, v in disp.most_common(8)))
    print(f"   Moreno Valley (3)   {pc.get(3, 0):,} rows  "
          f"[live 7,963 / 8 catalog years — the reconciliation's best single test]")


def report_student(ds, rows, stats):
    print(f"\n── {STUDENT_VIEW}")
    print(f"   dataCount (MAP)     {ds.get('dataCount'):,}"
          if isinstance(ds.get("dataCount"), int) else f"   dataCount {ds.get('dataCount')}")
    print(f"   rows parsed         {len(rows):,}")
    if isinstance(ds.get("dataCount"), int) and ds["dataCount"] != len(rows):
        print("   ⚠️  parsed rows != dataCount — the pull is short or padded. STOP.")
    pc = per_college(rows)
    print(f"   colleges            {len([c for c in pc if c is not None])}")
    print(f"   distinct students   {stats['distinct_students']:,}  "
          f"[live map_student_credit holds 42,346]")
    if stats["rows_without_key"]:
        print(f"   ⚠️  rows with no StudentMAPID: {stats['rows_without_key']:,}")
    print(f"   hash lengths        {dict(stats['hash_lengths'])}  (expect 64 hex)")

    # The three status-shaped fields, reported separately and never merged.
    print("   Status (approval stage, Sam 2026-08-19):")
    for k, v in Counter(r.get("status") for r in rows).most_common(10):
        print(f"       {str(k or '(null)'):32s} {v:>9,}")
    print("   CPLStatusPlan (the disposition):")
    for k, v in Counter(r.get("cpl_status_plan") for r in rows).most_common(10):
        print(f"       {str(k or '(null)'):32s} {v:>9,}")
    print("   CPLPlanStatus (lifecycle CHECKS — multi-valued, stored verbatim):")
    combos = Counter(r.get("cpl_plan_status") for r in rows)
    print(f"       distinct combinations: {len(combos):,}")
    for k, v in combos.most_common(8):
        print(f"       {str(k or '(null)'):48s} {v:>9,}")
    checks = Counter()
    for r in rows:
        for part in (r.get("cpl_plan_status") or "").split("|"):
            part = part.strip()
            if part:
                checks[part] += 1
    print(f"       individual checks ({len(checks)} distinct):")
    for k, v in checks.most_common(12):
        print(f"           {k:44s} {v:>9,}")

    # Two signals for one concept. cpl_memory: applied-measure-fork-55-percent
    # is the standing precedent — publish both, name the gap, never silently
    # resolve. Measured here so nobody has to assume they agree.
    has_check = sum(1 for r in rows
                    if "transcribed" in (r.get("cpl_plan_status") or "").lower())
    has_units = sum(1 for r in rows if (r.get("transcribed_credits") or 0) > 0)
    both = sum(1 for r in rows
               if "transcribed" in (r.get("cpl_plan_status") or "").lower()
               and (r.get("transcribed_credits") or 0) > 0)
    print("   ⚠️  'Transcribed' is BOTH a lifecycle check and a numeric column:")
    print(f"       rows with the CHECK      {has_check:,}")
    print(f"       rows with UNITS > 0      {has_units:,}")
    print(f"       rows with both           {both:,}")
    print("       Do not treat these as one measure until Sam has ruled.")

    print(f"   Moreno Valley (3)   {pc.get(3, 0):,} rows")


# ── Supabase ───────────────────────────────────────────────────────────────

def _headers(key: str) -> dict:
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }


def _request(method: str, path: str, key: str, body=None, timeout=180):
    """PostgREST call. `Prefer: return=minimal` is set in _headers for the bulk
    inserts; the RPC needs its JSON report back, so it overrides."""
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    headers = _headers(key)
    if path.startswith("rpc/"):
        headers["Prefer"] = "return=representation"
        headers["Accept"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.status, resp.read()


CLEAR_STAGING_RPC = "rpc/map_clear_custom_report_staging"


def clear_staging(key: str) -> dict:
    """Empty BOTH staging tables, server-side, with TRUNCATE.

    This used to be a PostgREST mass DELETE per table. On 2026-08-19 that raised
    a bare `HTTP Error 500` the first time it met a FULL stg_map_student_credit,
    and the Postgres log for that second reads `canceling statement due to
    statement timeout`: 591,820 deleted rows is 591,820 dead tuples, and it does
    not fit the role's default timeout. It failed at the step BEFORE the gated
    one, so no gate could have caught it, and it would have failed every night
    from then on.

    map_promote_custom_reports() already used TRUNCATE for the live swap for
    exactly this reason. The lesson simply never travelled to the staging half.

    The RPC takes NO ARGUMENT. That is the safety property: this function used
    to take a table name and defend itself with an `assert` on the "stg_"
    prefix, which left the reviewer-gated student-grain table one bad string
    away from the pipeline's only destructive call. The two staging tables are
    named inside the SQL function body now, so there is no argument to get
    wrong. Schema of record: kb/supabase_map_custom_report_staging.sql.
    """
    try:
        _, raw = _request("POST", CLEAR_STAGING_RPC, key, {}, timeout=300)
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")[:400]
        raise SystemExit(
            f"FATAL: could not clear staging (HTTP {e.code}). NOTHING LIVE HAS "
            f"CHANGED — this runs before the promotion.\n  {detail}\n"
            "  If the function is missing, apply "
            "kb/supabase_map_custom_report_staging.sql.")
    return json.loads(raw or b"{}")


def insert(table: str, rows: list, key: str) -> int:
    sent = 0
    for i in range(0, len(rows), BATCH):
        chunk = rows[i:i + BATCH]
        try:
            _request("POST", table, key, chunk)
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", errors="replace")[:400]
            raise SystemExit(f"FATAL: insert into {table} failed at row {i}: "
                             f"HTTP {e.code} {detail}")
        sent += len(chunk)
        if sent % (BATCH * 25) == 0:
            print(f"      {table}: {sent:,}/{len(rows):,}")
    return sent


def write_sketch(sample: list, key: str, pull_date: str) -> dict:
    """Store this pull's min-hash sketch and compare with the previous one.

    Pedro Campos (ITPI), via Sam 2026-08-19: the salt does NOT rotate. This is
    therefore a REGRESSION check, not an open question — and it is worth having
    precisely because the failure it catches is silent. A rotated salt raises no
    error anywhere; distinct-student counts simply stop being comparable across
    pulls. cpl_memory: statewide-is-138-not-84 is the standing precedent for a
    correct ruling sitting unenforced because no consumer ever changed.
    """
    status, raw = _request(
        "GET", "map_student_key_sketch?select=pull_date,sample_hash"
               "&order=pull_date.desc&limit=200000", key)
    prior = json.loads(raw or b"[]")
    prior_dates = sorted({r["pull_date"] for r in prior}, reverse=True)
    prev_date = next((d for d in prior_dates if d != pull_date), None)
    prev = {r["sample_hash"] for r in prior if r["pull_date"] == prev_date}

    _request("DELETE", f"map_student_key_sketch?pull_date=eq.{pull_date}", key)
    insert("map_student_key_sketch",
           [{"pull_date": pull_date, "sample_hash": h} for h in sample], key)

    # Keep two pulls. More would be a longitudinal record of student keys, which
    # is more than a rotation detector needs.
    for old in prior_dates:
        if old not in (pull_date, prev_date):
            _request("DELETE", f"map_student_key_sketch?pull_date=eq.{old}", key)

    if prev_date is None:
        return {"verdict": "first-pull", "prev_date": None, "overlap": None}
    overlap = len(prev & set(sample)) / max(len(prev), 1)
    verdict = "stable" if overlap >= 0.5 else "ROTATED?"
    return {"verdict": verdict, "prev_date": prev_date, "overlap": overlap}


def promote(key: str) -> dict:
    """Ask Postgres to promote staging to live, gated, in ONE transaction.

    Every check lives in map_promote_custom_reports() rather than here, and that
    is the point: a gate enforced by the caller is a gate that a second caller
    skips. The function raises on any blocking failure, which rolls the whole
    transaction back — live is fully old or fully new, never partial, and the
    two aggregates rebuild inside the same transaction so the published and
    unsuppressed halves of every figure can never disagree.

    Sam, 2026-08-19: "This will run in the daily cron so just making sure I
    don't have to do a staging to live approval every day." So the human gate is
    gone and the machine gates fail closed.
    """
    try:
        _, raw = _request("POST", "rpc/map_promote_custom_reports", key, {},
                          timeout=900)
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")[:800]
        raise SystemExit(
            f"PROMOTION REFUSED (HTTP {e.code}). Live is UNCHANGED — the whole "
            f"transaction rolled back.\n  {detail}\n"
            "  A G-numbered message is a gate doing its job: fix the pull, do not "
            "loosen the gate.")
    return json.loads(raw or b"{}")


# ── Main ───────────────────────────────────────────────────────────────────

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("input", nargs="?", help="CustomReport JSON (default: CustomReport_latest.json)")
    ap.add_argument("--dry-run", action="store_true", help="parse and report, write nothing")
    ap.add_argument("--no-promote", action="store_true",
                    help="load staging but do NOT promote to live (staging is inert; "
                         "use this to inspect a pull before it lands)")
    args = ap.parse_args()

    path = find_input(args.input)
    if not path:
        print("FATAL: no CustomReport_*.json found. Run fetch_custom_report.py first.")
        return 1
    print(f"Reading {path} ({os.path.getsize(path):,} bytes)")
    with open(path, encoding="utf-8") as f:
        report = json.load(f)

    cr_ds = dataset(report, CR_UNIT_VIEW)
    st_ds = dataset(report, STUDENT_VIEW)
    titles = ace_titles(report)
    if cr_ds is None or st_ds is None:
        have = [d.get("viewName") for d in report if isinstance(d, dict)]
        print("FATAL: the pull does not carry both new views.")
        print(f"  missing: {[v for v, d in ((CR_UNIT_VIEW, cr_ds), (STUDENT_VIEW, st_ds)) if d is None]}")
        print(f"  present: {have}")
        print("  The payload change landed after the last cron run — re-fetch on a "
              "commit that carries all 10 datasets.")
        return 1

    cr_rows, _ = map_rows(cr_ds, CR_UNIT_COLUMNS, CR_UNIT_VIEW,
                          zero_fill=CR_UNIT_ZERO_FILL)
    st_rows, st_index = map_rows(st_ds, STUDENT_COLUMNS, STUDENT_VIEW,
                                 extra_needed=(STUDENT_KEY_COLUMN,),
                                 zero_fill=STUDENT_ZERO_FILL)
    st_rows, st_stats = assign_student_keys(st_ds, st_rows, st_index)
    for i, r in enumerate(st_rows, start=1):
        r["source_row_id"] = i

    report_cr_unit(cr_ds, cr_rows)
    report_student(st_ds, st_rows, st_stats)

    held = [n for n in HELD_COLUMNS if n in (st_ds.get("columnName") or [])]
    print(f"\n   fetched but NOT stored ({len(held)}): {', '.join(held)}")

    if args.dry_run:
        print("\n--dry-run: nothing written.")
        return 0

    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        print("FATAL: SUPABASE_SERVICE_KEY not set.")
        return 1

    pull_date = _dt.date.today().isoformat()
    print(f"\nWriting staging tables (pull_date {pull_date})...")
    was = clear_staging(key)
    print(f"   staging cleared (was {was.get('cr_unit_was', 0):,} + "
          f"{was.get('student_was', 0):,} rows)")
    n1 = insert("stg_map_college_cr_unit", cr_rows, key)
    print(f"   stg_map_college_cr_unit  {n1:,} rows")
    n2 = insert("stg_map_student_credit", st_rows, key)
    print(f"   stg_map_student_credit   {n2:,} rows")

    # Enrichment, not payload: a titleless run still promotes. The promotion
    # skips the title swap when staging is empty rather than replacing live
    # titles with nothing.
    n3 = insert("stg_map_ace_exhibit_titles", titles, key) if titles else 0
    print(f"   stg_map_ace_exhibit_titles {n3:,} rows"
          + ("" if n3 else "  ⚠️  no titles parsed — live titles will be LEFT ALONE"))

    sketch = write_sketch(st_stats["sketch"], key, pull_date)
    print(f"\nSalt-rotation check: {sketch['verdict']}"
          + (f" (overlap {sketch['overlap']:.3f} vs {sketch['prev_date']})"
             if sketch["overlap"] is not None else " — no previous pull to compare"))
    if sketch["verdict"] == "ROTATED?":
        print("   ⚠️  The student key set barely overlaps the previous pull. Either the "
              "salt rotated or the population changed wholesale. Distinct-student "
              "counts are NOT comparable across these two pulls until this is "
              "explained. Ask ITPI before publishing any headcount trend.")

    if args.no_promote:
        print("\nStaging loaded. --no-promote: NOTHING LIVE HAS CHANGED.")
        print("Promote with docs/map_custom_report_load.md, or re-run without the flag.")
        return 0

    print("\nPromoting staging -> live (gated, one transaction)...")
    rep = promote(key)
    cr, st, stu = rep.get("cr_unit", {}), rep.get("student", {}), rep.get("students", {})
    print(f"   map_college_cr_unit   {cr.get('was'):,} -> {cr.get('now'):,}")
    print(f"   map_student_credit    {st.get('was'):,} -> {st.get('now'):,}")
    print(f"   distinct students     {stu.get('was'):,} -> {stu.get('now'):,}")
    print("   published aggregates rebuilt in the same transaction")
    for w in rep.get("warnings") or []:
        print(f"   ⚠️  {w}")
    print("\nLive is current.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

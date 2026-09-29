"""
_probe_exhibit_evidence_fields.py — full-field census of the Exhibit CRs Catalog.

Runs ON THE GITHUB ACTIONS RUNNER. A Claude session's container cannot reach the
MAP hosts (egress allowlist), which is why this is a workflow step.

Sam, 2026-08-14: (a) does Sierra know about the EvidenceDescription /
EvidenseTypeID fields, and is EvidenceDescription truncated? (b) "analyze all 27
available fields in Exhibit CRs Catalog and let me know if we could benefit by
adding or deleting anything."

Already established WITHOUT this probe (session 153):
  * No Supabase column anywhere matches %evidence% → Sierra cannot see it.
  * No reference to either field anywhere in the repo.
  * fetch_custom_report.py requests 9 of the catalog's columns and neither
    evidence field is among them — we never ask MAP for them.

⚠️ VALIDITY TEST — READ THIS BEFORE EDITING
Run 1 of this probe reported all nine candidate names as valid, including Sam's
misspelling "EvidenseTypeID" and bare "Evidence". They are not all real. The API
**ECHOES THE REQUESTED columnName BACK REGARDLESS OF VALIDITY** — the same run's
student-detail probe got responseCode=400 "... is not Valid" and still echoed all
seven requested columns.

So a name is valid IFF THE REQUEST RETURNS ROWS. One bad name appears to zero the
entire response (run 1 asked for 13 names including bad ones and got
parsed_rows=0, while the known-good 13-column pull returned 271,783 rows).

Never validate against ds["columnName"]. It is a mirror.

METHOD
  1. Confirm a known-good baseline returns rows (guards against the API simply
     being down, which would otherwise read as "every field is invalid").
  2. Test each candidate ONE AT A TIME as [baseline_key, candidate]. Rows ⇒ the
     name is real. No rows ⇒ it is not (or is not requestable).
  3. Pull every confirmed field together and profile it: fill rate, distinct
     count, length distribution, and — for the text fields — whether the length
     distribution shows a server-side cap.
  4. Emit an ADD / KEEP / DROP recommendation against what
     fetch_custom_report.py currently requests.

COMMITS NOTHING. Prints to the run log, which Claude reads via the GitHub MCP.

PII posture (Session 34 data-minimisation): a value is echoed only when the SAME
string occurs on >= MIN_OCCURRENCES_TO_PRINT rows — a string on hundreds of rows
across many exhibits cannot be about one person. Rare values are counted, never
printed. No student identifier is requested.
"""
import json
import urllib.request
import urllib.error
from collections import Counter

GETREPORT = "https://mapwebapinew.azurewebsites.net/api/CustomReport/getReport"
VIEW = "View_ExhibitCRsCatalog_Dataset"

# Known-real (fetch_custom_report.py + _discover_map_datasets.py both pull these
# and get rows back). BASELINE is the single column every probe request carries.
BASELINE = "ExhibitID"
KNOWN_GOOD = [
    "ExhibitID", "CreditRecommendation", "Title", "CPLTypeDescription", "Issuer",
    "SkillLevel", "Level", "ExhibitType", "TotalStudentsForCR",
    "TotalEligibleCreditsForCR", "TotalTranscribedCreditsForCR",
    "TotalAppliedCreditsForCR", "TotalCreditsInReviewForCR",
]
# What the DAILY fetch currently asks for — the baseline for add/drop advice.
CURRENTLY_FETCHED = {
    "ExhibitID", "SkillLevel", "CreditRecommendation", "Title",
    "TotalEligibleCreditsForCR", "TotalTranscribedCreditsForCR",
    "TotalAppliedCreditsForCR", "TotalCreditsInReviewForCR", "TotalStudentsForCR",
}

# Sam says there are 27 available fields; 13 are known. These are candidates for
# the other ~14. Guessing is cheap now that the validity test is sound — an
# invalid name just returns no rows. Sam's own field list would beat this.
CANDIDATES = [
    # the ask
    "EvidenceDescription", "EvidenseTypeID", "EvidenceTypeID", "EvidenceType",
    "Evidence", "EvidenceCriteria", "Criteria", "CriteriaID",
    "CriteriaDescription",
    # identity / classification
    "ExhibitTitle", "ExhibitVersion", "VersionNumber", "ACEID", "AceID",
    "ExhibitCode", "CourseNumber", "CourseTitle", "Subject", "TopCode",
    "CIDNumber", "CID", "CIPCode",
    # provenance / lifecycle
    "SourceCode", "Source", "DateAdded", "CreatedOn", "LastUpdated",
    "ModifiedOn", "EffectiveDate", "ExpirationDate", "StartDate", "EndDate",
    "Status", "IsActive", "Active",
    # description / delivery
    "Description", "CourseDescription", "LearningOutcomes", "Objectives",
    "ModeOfLearning", "CPLModeOfLearning", "CPLType", "DeliveryMethod",
    "Location", "Organization", "Trainer", "TrainingAgency", "IssuingAgency",
    # measures we may be missing
    "CRUnits", "Units", "Credits", "TotalCredits", "TotalPotentialCreditsForCR",
    "TotalNotApplicableForCR", "TotalCollegesForCR", "CollegeCount",
    "ArticulationCount", "TotalArticulatedCreditsForCR",
]

MIN_OCCURRENCES_TO_PRINT = 25
MAX_ECHO_CHARS = 300
SUSPICIOUS_LENGTHS = [50, 100, 128, 200, 250, 255, 256, 500, 512,
                      1000, 1024, 2000, 2048, 4000, 4096, 8000]


def post(cols, timeout=900):
    body = json.dumps([{"viewName": VIEW, "columnName": cols}]).encode()
    req = urllib.request.Request(
        GETREPORT, data=body,
        headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def first_dataset(payload):
    if isinstance(payload, list):
        return payload[0] if payload else {}
    if isinstance(payload, dict):
        for k in ("data", "result", "datasets"):
            v = payload.get(k)
            if isinstance(v, list) and v:
                return v[0]
        return payload
    return {}


def rows_of(ds):
    return ds.get("columnValue") or ds.get("data") or []


def probe_one(name):
    """Valid IFF rows come back. The echoed columnName is a mirror — ignore it."""
    try:
        ds = first_dataset(post([BASELINE, name], timeout=300))
        n = len(rows_of(ds))
        code = str(ds.get("responseCode") or "")
        msg = str(ds.get("responseMessage") or "").strip()
        return n > 0, n, code, msg
    except urllib.error.HTTPError as e:
        return False, 0, str(e.code), "HTTPError"
    except Exception as e:
        return False, 0, "", f"{type(e).__name__}: {e}"


def length_report(label, values):
    lens = sorted(len(v) for v in values if v)
    if not lens:
        print(f"    {label}: no non-empty values.")
        return
    n = len(lens)
    counts = Counter(lens)
    mx = lens[-1]
    print(f"    lengths: min {lens[0]} · median {lens[n // 2]} · "
          f"p95 {lens[int(n * 0.95)]} · MAX {mx}")
    at_max = counts[mx]
    spikes = [(L, counts[L]) for L in SUSPICIOUS_LENGTHS
              if counts.get(L, 0) >= max(5, n * 0.005)]
    if spikes:
        print("    ⚠️  SPIKE at a cap-shaped length → SERVER-SIDE TRUNCATION:")
        for L, c in spikes:
            print(f"          length {L}: {c:,} values ({100.0 * c / n:.1f}%)")
    elif at_max >= n * 0.05 and mx >= 50:
        print(f"    ⚠️  {at_max:,} values ({100.0 * at_max / n:.1f}%) sit exactly at "
              f"the max ({mx}) → likely a cap.")
    else:
        print(f"    ✅ NO server-side truncation evident (max {mx}, lengths vary "
              f"freely). A value clipped in a JSON viewer is the VIEWER.")


def main():
    print("=" * 78)
    print("Exhibit CRs Catalog — full-field census")
    print("Sam: evidence fields + 'analyze all 27 available fields... "
          "adding or deleting anything'")
    print("=" * 78)

    print(f"\n[0] Baseline sanity check — do the known-good columns return rows?")
    ds = first_dataset(post(KNOWN_GOOD))
    base_rows = len(rows_of(ds))
    print(f"    known-good {len(KNOWN_GOOD)} columns → {base_rows:,} rows "
          f"(dataCount={ds.get('dataCount')})")
    if base_rows == 0:
        print("    ❌ BASELINE RETURNED NOTHING — the API is unhealthy right now.")
        print("       STOP: every candidate would read as invalid. Re-run later.")
        return
    print("    ✅ baseline healthy — a candidate returning 0 rows is a real signal.")

    # ── Enumerate rather than guess, if the API will let us ────────────────
    # Many report APIs return the FULL column set when columnName is empty or
    # omitted. If either works we get all 27 names for free and the candidate
    # list below becomes a fallback. Worth two requests to avoid guessing.
    print("\n[0b] Can the API just tell us every column?")
    enumerated = []
    for label, payload in (
        ("columnName: []", [{"viewName": VIEW, "columnName": []}]),
        ("columnName omitted", [{"viewName": VIEW}]),
        ("columnName: ['*']", [{"viewName": VIEW, "columnName": ["*"]}]),
    ):
        try:
            body = json.dumps(payload).encode()
            req = urllib.request.Request(
                GETREPORT, data=body,
                headers={"Content-Type": "application/json"}, method="POST")
            with urllib.request.urlopen(req, timeout=900) as r:
                d = first_dataset(json.loads(r.read()))
            n = len(rows_of(d))
            cols = d.get("columnName") or []
            # Rows AND more columns than we asked for (we asked for none) ⇒ the
            # API expanded to the full set. The echo caveat does not apply here:
            # we sent an empty list, so anything returned is the API's own.
            if n > 0 and len(cols) > 0:
                print(f"     ✅ {label} → {n:,} rows, {len(cols)} columns: {cols}")
                enumerated = [str(c).strip() for c in cols]
                break
            print(f"     ✗ {label} → {n:,} rows, {len(cols)} columns echoed "
                  f"[{d.get('responseCode')}] {str(d.get('responseMessage') or '').strip()[:60]}")
        except Exception as e:
            print(f"     ✗ {label} → {type(e).__name__}: {e}")

    if enumerated:
        print(f"\n     → FULL SCHEMA OBTAINED: {len(enumerated)} fields.")
        unknown = [c for c in enumerated if c not in KNOWN_GOOD]
        print(f"     → not previously known ({len(unknown)}): {unknown}")
        print(f"     → available but NOT in the daily fetch: "
              f"{[c for c in enumerated if c not in CURRENTLY_FETCHED]}")

    print(f"\n[1] Testing {len(CANDIDATES)} candidate field names, one at a time.")
    print("    Valid IFF rows come back (the echoed columnName is a mirror — see")
    print("    the module docstring; run 1 of this probe got that wrong).")
    # If the API enumerated itself, profile THOSE fields — they are facts, not
    # guesses. Keep the evidence candidates too, in case the enumeration is a
    # subset (e.g. the API hides columns it will still serve on request).
    probe_list = CANDIDATES
    if enumerated:
        extra = [c for c in CANDIDATES[:9] if c not in enumerated]  # evidence names
        probe_list = [c for c in enumerated if c not in KNOWN_GOOD] + extra
        print(f"    (using the ENUMERATED schema — {len(probe_list)} to check, "
              f"not the {len(CANDIDATES)}-name guess list)")

    valid, invalid = [], []
    for cand in probe_list:
        if cand in KNOWN_GOOD:
            continue
        ok, n, code, msg = probe_one(cand)
        if ok:
            valid.append(cand)
            print(f"    ✓ {cand:<30} {n:>8,} rows")
        else:
            invalid.append(cand)
            extra = f" [{code}] {msg[:60]}" if (code or msg) else ""
            print(f"    ✗ {cand:<30}        0 rows{extra}")

    print(f"\n    → {len(valid)} NEW valid field(s); {len(KNOWN_GOOD)} already known.")
    print(f"    → TOTAL CONFIRMED: {len(KNOWN_GOOD) + len(valid)} "
          f"(Sam reports 27 available)")
    if valid:
        print(f"    → newly found: {valid}")
    missing = 27 - (len(KNOWN_GOOD) + len(valid))
    if missing > 0:
        print(f"    ⚠️  {missing} field(s) still unaccounted for — the candidate")
        print("       list is guesswork. Sam's own field list would close this.")

    if not valid:
        print("\nNo new fields confirmed. Nothing further to profile.")
        return

    print(f"\n[2] Profiling the {len(valid)} confirmed new field(s)")
    ds = first_dataset(post([BASELINE, "CreditRecommendation", "Title"] + valid))
    cols = ds.get("columnName") or []
    rows = rows_of(ds)
    ci = {str(c).strip(): i for i, c in enumerate(cols)}
    print(f"    pulled {len(rows):,} rows")
    if not rows:
        print("    ⚠️  combined pull returned nothing even though each field")
        print("        validated alone — some pair is mutually exclusive.")
        return

    def cell(r, name):
        i = ci.get(name)
        if i is None:
            return None
        if isinstance(r, list):
            return r[i] if i < len(r) else None
        return r.get(name) if isinstance(r, dict) else None

    for col in valid:
        vals = [str(cell(r, col) or "").strip() for r in rows]
        nonempty = [v for v in vals if v]
        fill = 100.0 * len(nonempty) / max(1, len(vals))
        distinct = len(set(nonempty))
        print("\n" + "-" * 78)
        print(f"  {col}")
        print(f"    fill: {len(nonempty):,}/{len(vals):,} ({fill:.1f}%) · "
              f"distinct: {distinct:,}")
        if not nonempty:
            print("    → EMPTY EVERYWHERE. Do not add; it would cost payload for nothing.")
            continue
        if distinct <= 40:
            print("    → small controlled vocabulary:")
            for v, c in Counter(nonempty).most_common():
                print(f"        {c:>8,}×  {v[:MAX_ECHO_CHARS]}")
        else:
            length_report(col, nonempty)
            print(f"    most common (>= {MIN_OCCURRENCES_TO_PRINT} rows only):")
            for v, c in Counter(nonempty).most_common(10):
                if c < MIN_OCCURRENCES_TO_PRINT:
                    continue
                echo = v[:MAX_ECHO_CHARS] + (
                    f"…[+{len(v) - MAX_ECHO_CHARS} chars]" if len(v) > MAX_ECHO_CHARS else "")
                print(f"        {c:>8,}×  (len {len(v):>5})  {echo}")

    # ── Sam's case ────────────────────────────────────────────────────────
    print("\n" + "=" * 78)
    print("[3] Sam's case — AWS D1.1 / welding rows")
    hits = 0
    for r in rows:
        hay = (str(cell(r, "Title") or "") + " " +
               str(cell(r, "CreditRecommendation") or "")).lower()
        if "weld" in hay or "d1.1" in hay or "aws" in hay:
            ev = " | ".join(f"{c}={str(cell(r, c) or '')[:200]}" for c in valid)
            print(f"    {str(cell(r, 'Title'))[:50]:<50} :: {ev}")
            hits += 1
            if hits >= 20:
                print("    …(capped at 20 — a sample, not a census)")
                break
    if not hits:
        print("    no welding/AWS rows matched.")

    # ── add / keep / drop ─────────────────────────────────────────────────
    print("\n" + "=" * 78)
    print("[4] ADD / KEEP / DROP against what the daily fetch requests today")
    print(f"    currently fetched ({len(CURRENTLY_FETCHED)}): "
          f"{sorted(CURRENTLY_FETCHED)}")
    print("\n    AVAILABLE BUT NOT FETCHED:")
    for c in KNOWN_GOOD + valid:
        if c not in CURRENTLY_FETCHED:
            print(f"      · {c}")
    print("\n    Judge each on: does a consumer need it, and is it populated?")
    print("    A field that is empty everywhere costs payload and buys nothing —")
    print("    the catalog is already 37 MB for 13 columns over 271,783 rows.")
    print("\nDONE. Nothing committed.")


if __name__ == "__main__":
    main()

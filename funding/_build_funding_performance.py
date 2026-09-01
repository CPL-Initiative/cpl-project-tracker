#!/usr/bin/env python3
"""Build cpl_funding_performance.js — per-college P2/P3 actuals vs the funding
priorities, from the daily CustomReport pull.

Runs in the daily GitHub Actions workflow right after fetch_custom_report.py
(the input, CustomReport_latest.json, is TRANSIENT runner data — never
committed; it carries pseudonymous per-student rows). Local/manual:

    python3 funding/_build_funding_performance.py [CustomReport_latest.json] [--out path]

Metrics (per docs/funding_priority_metrics_scope.md; forks ratified by Sam
2026-06-11):
  P2 (access)   = distinct students with Transcribed Credits >= 6
  P3 (capacity) = distinct students with Transcribed Credits > 0  (MAP half;
                  the "and MIS" cross-check has no feed yet)
  PE (added 2026-07-06) = distinct students with Eligible Credits > 0 — credit
                  identified in MAP, whether or not transcribed yet. Serves the
                  reworded P1 "eligible for at least one course offered through
                  CPL" metric (wired in cpl_funding.js MEASURES, 2026-07-27).
  PA (added 2026-08-01 per Sam) = distinct students with Applied Credits > 0,
                  and `pa_u` their unit sum. The middle rung of MAP's funnel
                  (eligible -> APPLIED -> transcribed) and the one P1 should be
                  scored on, for two reasons:
                    1. ELIGIBLE is inflated upstream and we cannot fix it. ACE
                       JST exhibits repeat a credit recommendation under every
                       skill level, so a USMC veteran's eligibility multiplies
                       (map_data_quality 10ad9e0a, high/open — MAP's parser
                       can't easily keep only the highest level because skill
                       levels aren't canonically ordered). Our own arithmetic is
                       sound (the unit_crosscheck below reads 1.0054 against
                       MAP's published totals) — the source figure is the one
                       that's inflated. Applying credit is a per-student action
                       taken once, so it does not carry the duplication.
                    2. Eligible measures OPPORTUNITY, not performance: 98 of 102
                       colleges clear an eligible-based target, median 42x. What
                       a college controls is whether it ACTS on the eligibility.
                  Statewide the funnel is 1,354,527 eligible -> 242,559 applied
                  (18%) -> 103,139 transcribed (8%).
  PP (added 2026-07-27 per Sam) = distinct PORTAL-ORIGIN students (Potential
                  Student = Yes, Test Student != Yes) with any transcribed CPL —
                  the P3 "transcribed Credit from either CPL Student Portal or
                  CPL Landing Page" metric. Achievement-based: a college earns on
                  its actual portal count and one with none earns $0 (#906). Tiny
                  & mostly test until the Portal launches.
  VET_STAR (added 2026-07-27) = a per-college Veteran Star flag (funding-name ->
                  bool) read from veteran_jst.json (>= star_threshold, 0.75, of
                  enrolled veterans have a JST uploaded). It is NOT a student
                  count — it's the auto-computed "75% veteran JSTs" eligibility
                  qualifier for the funding tab's Elig glyph. Emitted as the
                  top-level payload key `vet_star` (+ as_of/threshold/n).

  FEEDERS.F1 (added 2026-07-27 per Sam) = per-noncredit-feeder eligible headcount
                  (distinct students with Eligible Credits > 0), keyed by the
                  feeder SHORT name (NOCE / SD Cont. Ed / Mt. SAC NC / Calbright).
                  The one measure a noncredit campus can stand up (it can't
                  transcribe — colleges do that; F2 waivers have no feed yet).
                  Emitted as top-level `feeders`; empty until campuses attach
                  exhibits to their NC student records in MAP.

  ORIGINATION / NC_* (added 2026-08-31, the N2 b gate) = the noncredit-origin
                  cut of the funnel, keyed by MAP's `LocID2` (the identity of
                  the noncredit origin — NULL when unknown, NEVER defaulted;
                  see the Malone/Pedro instructions doc, CPLBrain
                  04-projects/cpl-initiative/20260831_MAP_Custom_Reports_
                  Origination_Data_Instructions.md). Three cuts from the same
                  rows, ALL OMITTED (never zeroed) until the pull carries the
                  LocID2 column — the `pa` absent-keys pattern:
                    1. Per-college `nc_pe`/`nc_pa`/`nc_pt` (+ `_u` unit sums):
                       the receiving college's funnel among students whose
                       LocID2 names a KNOWN noncredit location. These are the
                       keys METRIC_SOURCES in cpl_funding.js declared on
                       2026-08-27 as nc_pe_u/nc_pa_u/nc_pt_u — the college
                       NC-share measures. Same first-seen dedupe + <5
                       suppression as the credit rungs.
                    2. `origination.in_scope` per origin institution: the
                       SCOPED originated funnel — the same keys, deduped per
                       (origin, student), counted only where the receiving
                       college is inside the origin's ruled scope (NOCE/SDCCE:
                       their district's credit colleges; Calbright: statewide
                       — feeder `origin_scope`/`district` in
                       cpl_funding_data.js). This is what the trio's
                       origination earn-out reads (N2 b: they draw only as
                       originated CPL posts). Computed at the student grain so
                       a suppressed college cell never subtracts from it.
                    3. `origination.by_origin` — the (origin × college)
                       matrix, for display/audit, cell-suppressed.
                  An unresolvable non-empty LocID2 lands in
                  `origination.unmatched_origins` (visible, earns nothing) —
                  never guessed onto an institution: a wrong origin now
                  misdirects funding, not just analytics. The `Origin` column
                  (Student Portal / Landing Page / Batch / College Entered) is
                  DETECTED and surfaced as a value histogram when it appears,
                  but the ppa cutover from `Potential Student` waits for
                  verified value spellings — switching the cohort logic on
                  guessed strings could silently zero an $8M priority.

  CPL_TYPES (added 2026-08-06) = per-college distinct-student counts BY
                  `CPL Type Description` for the pe/pa/p3 rungs, emitted as
                  `cpl_types` (+ `cpl_types_statewide`). Two things the
                  undifferentiated counts cannot distinguish:
                    1. A college whose CPL practice is still ONLY the military
                       lane. Uploading a JST creates the Student CPL Plan and
                       the DD-214/JST Basic Training rows auto-apply against an
                       already-articulated exhibit — so applied credit can post
                       WITHOUT the college ever performing the per-CR
                       articulation step that is the actual ask. Statewide the
                       fingerprint is stark: applied-students ≈ JSTs-uploaded at
                       a ratio of ~1.00 for the median college.
                    2. A transcribed figure that is really a BATCH. Batch
                       Cx/AP/IB uploads land already-transcribed by construction
                       (those students are in the college SIS and are merely
                       being surfaced in MAP — Sam, 2026-08-06), so scoring an
                       undifferentiated transcribed count rewards batch loading
                       and real counselling identically.
                  COUNTS ONLY, no per-type unit sums — see the block comment at
                  the accumulator for why (rows are repeats, not partitions).

  The field -> priority mapping lives in cpl_funding.js (MEASURES), not here;
  this script only emits the raw pe/p2/p3/pp counts (+ the vet_star flags +
  the per-feeder F1 eligible headcount + the cpl_types breakdown).

Privacy (docs/kb-notes/adr-funding-priority-metrics-privacy.md — RATIFIED):
  - aggregate per-college counts only; the student grain never leaves the
    runner; MAP Internal StudentID is used solely as a distinct-count set key
    (the _compute_college_military_students pattern in excel_to_dashboard.py)
  - pe/p2/p3 per-college counts 1..SUPPRESS_BELOW-1 bake as null + "<5" flag;
    `pp` is the one exception (shown raw, Sam 2026-07-27) — its privacy gate is
    the Test Student field, not <5 suppression (see NO_SUPPRESS below)
  - statewide counts are computed independently from the student grain
    (distinct across colleges), so they are NOT the sum of per-college cells —
    which also defeats recovering a suppressed cell by subtraction
  - Test Student rows and the MAP test colleges are excluded; Potential Student
    rows are routed to `pp` (not counted in pe/p2/p3)

College-name join: MAP college names resolve to the funding workbook's names
via kb/college_short_names.json (canonical/alias → short) with a normalized
fallback, then a collision-checked "College"/"Community College" STEM fallback
(see _stem); unresolved colleges are emitted under "unmatched" for visibility
(suppressed the same way).

Graceful behavior: if the input JSON or the StudentAggregatedValues view is
absent, prints a notice and exits 0 WITHOUT touching any existing artifact
(a failed fetch day keeps yesterday's numbers).
"""
import glob
import json
import os
import re
import sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
OUT_JS = os.path.join(ROOT, "cpl_funding_performance.js")
SHORT_NAMES = os.path.join(ROOT, "kb", "college_short_names.json")
FUNDING_DATA = os.path.join(ROOT, "cpl_funding_data.js")
VETERAN_JST = os.path.join(ROOT, "veteran_jst.json")  # daily Vets/JST + Veteran Star
VIEW = "View_StudentAggregatedValues_APIDataset"
SUPPRESS_BELOW = 5
P2_MIN_UNITS = 6.0

TEST_COLLEGES = {"RivTest City College", "MorTest City College", "Nortest City College",
                 "CA MAP INITIATIVE COLLEGE", "RivTest", "MorTest", "Nortest"}


def _norm(name):
    return re.sub(r"[^a-z0-9]", "", str(name).lower())


# A trailing institutional suffix, normalized: "…College" or "…Community College".
_SUFFIX_RE = re.compile(r"(?:community)?college$")


def _stem(name):
    """Normalized name with a TRAILING institutional suffix removed.

    MAP and the funding workbook disagree on "X College" vs "X Community
    College" — and in BOTH directions, so no single canonical spelling per
    college can match both (2026-07-31):

        workbook "Barstow College"              MAP "Barstow Community College"
        workbook "Lassen Community College"     MAP "Lassen College"
        workbook "Madera Community College"     MAP "Madera College"
        workbook "Southwestern Community College"  MAP "Southwestern College"

    Only a TRAILING suffix is stripped, so "College of Alameda", "College of
    Marin" and "College of the Siskiyous" are untouched, and a distinguishing
    mid-name word survives ("San Diego City College" -> "sandiegocity").
    Callers must use this through a COLLISION-CHECKED index (see
    _name_resolver) so it can never merge two distinct institutions.
    """
    n = _norm(name)
    m = _SUFFIX_RE.search(n)
    stemmed = n[:m.start()] if m else n
    return stemmed or n          # never stem a bare "College" down to ""


def _load_input(argv):
    args = [a for a in argv if not a.startswith("--")]
    path = args[0] if args else None
    if path is None:
        latest = os.path.join(os.getcwd(), "CustomReport_latest.json")
        if os.path.exists(latest):
            path = latest
        else:
            cands = sorted(glob.glob(os.path.join(os.getcwd(), "CustomReport_*.json")))
            path = cands[-1] if cands else None
    if not path or not os.path.exists(path):
        return None, None
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    for report in data if isinstance(data, list) else []:
        if report.get("viewName") == VIEW and report.get("columnValue"):
            col_map = {c: i for i, c in enumerate(report.get("columnName", []))}
            return {"rows": report["columnValue"], "col_map": col_map,
                    "generated_at": report.get("generatedAt", "")}, path
    return None, path


CREDIT_DIST_VIEW = "View_CreditDistributionByCollege_APIDataset"


def _load_credit_distribution(path, resolve):
    """MAP's OWN per-college credit totals, used purely as a CROSS-CHECK.

    We sum units from the per-student view so the population matches the counts
    exactly (Test/Potential excluded) and so portal-origin units — which only
    exist at the student grain — come from the same place as the other two.
    But that sum rests on an assumption about the view's row grain, so compare
    it against MAP's published totals and REPORT the gap rather than assume.

    The two are not expected to match exactly: this view carries no Test /
    Potential flags, so it is a slightly wider population. A small positive gap
    is the expected shape; a ~2x gap would mean our per-student rows are
    partitions and the first-seen reducer is dropping units.
    """
    if not path or not os.path.exists(path):
        return None
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, ValueError):
        return None
    for report in data if isinstance(data, list) else []:
        if report.get("viewName") != CREDIT_DIST_VIEW or not report.get("columnValue"):
            continue
        cm = {c: i for i, c in enumerate(report.get("columnName", []))}
        i_col, i_e, i_t = cm.get("College"), cm.get("Eligible Credits"), cm.get("Transcribed Credits")
        i_a = cm.get("Applied Credits")
        if i_col is None or i_e is None or i_t is None:
            return None
        out = {}
        for row in report["columnValue"]:
            name = (row[i_col] or "").strip()
            if not name or name in TEST_COLLEGES:
                continue
            target = resolve(name)
            if not target:
                continue
            try:
                e = float(row[i_e] or 0)
                t = float(row[i_t] or 0)
                a = float(row[i_a] or 0) if i_a is not None else 0.0
            except (TypeError, ValueError):
                continue
            rec = out.setdefault(target, {"pe_u": 0.0, "pa_u": 0.0, "p3_u": 0.0})
            rec["pe_u"] += e
            rec["pa_u"] += a
            rec["p3_u"] += t
        return out or None
    return None


def _name_resolver():
    """MAP college name -> funding-workbook college name (or None)."""
    with open(SHORT_NAMES, encoding="utf-8") as f:
        shorts = json.load(f)["colleges"]
    with open(FUNDING_DATA, encoding="utf-8") as f:
        m = re.search(r"window\.CPL_FUNDING = (\{.*\});\s*$", f.read(), re.S)
    funding_names = [c["college"] for c in json.loads(m.group(1))["colleges"]]
    by_norm_funding = {_norm(n): n for n in funding_names}
    _fstems = {}
    for n in funding_names:
        _fstems.setdefault(_stem(n), set()).add(n)
    by_stem_funding = {s: next(iter(v)) for s, v in _fstems.items() if len(v) == 1 and s}

    def _find_funding(*candidates):
        """First candidate spelling that names a funding college, exact-then-stem."""
        for c in candidates:
            if not c:
                continue
            hit = by_norm_funding.get(_norm(c)) or by_stem_funding.get(_stem(c))
            if hit:
                return hit
        return None

    # canonical + every alias -> the funding name whose normalized form matches
    # the entry's short (e.g. "College of Alameda" -> short "Alameda" -> "Alameda").
    # `short_caps` is tried too: the workbook sometimes carries the CAPS form in
    # title case instead of the short one, and matching on `short` ALONE silently
    # skipped the whole entry — which is why "Los Angeles Southwest College"
    # resolved to nothing (workbook "LA Swest" vs short "LA Southwest").
    lookup = {}
    for entry in shorts:
        target = _find_funding(entry.get("short"), entry.get("short_caps"), entry.get("canonical"))
        if not target:
            continue
        for alias in set([entry["canonical"], entry["short"], entry.get("short_caps")]
                         + list(entry.get("aliases", []))):
            if alias:
                lookup[_norm(alias)] = target

    # Suffix-tolerant fallback, COLLISION-CHECKED: a stem is usable only when
    # every known spelling that reduces to it points at ONE funding college. A
    # stem shared by two institutions is dropped rather than guessed, so this
    # can add matches but can never merge distinct colleges.
    stems = {}
    for key, target in list(lookup.items()) + list(by_norm_funding.items()):
        stems.setdefault(_stem(key), set()).add(target)
    by_stem = {s: next(iter(t)) for s, t in stems.items() if len(t) == 1 and s}

    def resolve(map_name):
        key = _norm(map_name)
        return (lookup.get(key) or by_norm_funding.get(key)
                or by_stem.get(_stem(key)))
    return resolve


def _feeder_resolver():
    """MAP college name -> noncredit-feeder SHORT name (or None). Feeders live
    only in cpl_funding_data.js `feeders` (they were moved out of the college
    table — they can't earn the CPL priority metrics). Matches on the feeder's
    full name or its short. Supports F1 (eligible headcount) — the one measure a
    noncredit campus can stand up once it attaches exhibits to its NC records."""
    with open(FUNDING_DATA, encoding="utf-8") as f:
        m = re.search(r"window\.CPL_FUNDING = (\{.*\});\s*$", f.read(), re.S)
    feeders = json.loads(m.group(1)).get("feeders", []) if m else []
    lookup = {}
    for fd in feeders:
        short = fd.get("short")
        if not short:
            continue
        for nm in (fd.get("name"), short):
            if nm:
                lookup[_norm(nm)] = short

    def resolve(map_name):
        return lookup.get(_norm(map_name))
    return resolve


NC_ORIGIN_LOCIDS = os.path.join(ROOT, "kb", "nc_origin_locids.json")


def _origin_resolver():
    """LocID2 value -> noncredit-origin SHORT name (or None).

    LocID2 is "the MAP LocID (same namespace as CollegeID)" per the ruled
    field plan — but until real values arrive we cannot know whether the pull
    will carry IDs or names. So: resolve NAMES against the feeder roster
    (full name / short, normalized), and IDs through kb/nc_origin_locids.json
    ({"<locid>": "<feeder short>"}) — a file that DOES NOT EXIST yet and is
    created the day MAP tells us the IDs. Anything unresolved is surfaced in
    `origination.unmatched_origins` rather than guessed: NULL-when-unknown /
    never-defaulted is the ruled invariant, and a wrong origin misdirects
    funding."""
    feeder_resolve = _feeder_resolver()
    id_map = {}
    if os.path.exists(NC_ORIGIN_LOCIDS):
        try:
            with open(NC_ORIGIN_LOCIDS, encoding="utf-8") as f:
                raw = json.load(f)
            id_map = {str(k).strip(): v for k, v in raw.items() if v}
        except (OSError, ValueError):
            id_map = {}

    def resolve(loc2):
        v = str(loc2 or "").strip()
        if not v:
            return None
        return id_map.get(v) or feeder_resolve(v)
    return resolve


def _origin_scopes():
    """Feeder short -> the set of funding-college names its origination counts
    toward, or None for statewide (Calbright). Data-driven from
    cpl_funding_data.js: each feeder's `origin_scope` ("district"|"statewide")
    and `district`, joined against the college rows' own district strings —
    the ruled scope (2026-08-31): NOCE and SDCCE wherever it lands among their
    district's credit colleges, Calbright statewide."""
    with open(FUNDING_DATA, encoding="utf-8") as f:
        m = re.search(r"window\.CPL_FUNDING = (\{.*\});\s*$", f.read(), re.S)
    d = json.loads(m.group(1)) if m else {}
    by_district = {}
    for c in d.get("colleges", []):
        by_district.setdefault(c.get("district"), set()).add(c["college"])
    scopes = {}
    for fd in d.get("feeders", []):
        short = fd.get("short")
        if not short:
            continue
        if fd.get("origin_scope") == "statewide":
            scopes[short] = None
        else:
            scopes[short] = set(by_district.get(fd.get("district"), set()))
    return scopes


def read_veteran_stars(resolve):
    """Per-college Veteran Star flag (funding-name → bool) from veteran_jst.json —
    a college where >= star_threshold (0.75) of enrolled veterans have a JST
    uploaded in MAP. This is the auto-computed "75% veteran JSTs" eligibility
    qualifier on the funding tab (Sam, 2026-07-27). Graceful if the file is
    absent (a fetch-less run keeps the tab's JST sector 'pending')."""
    if not os.path.exists(VETERAN_JST):
        return None
    try:
        with open(VETERAN_JST, encoding="utf-8") as f:
            vj = json.load(f)
    except (ValueError, OSError):
        return None
    stars, n = {}, 0
    for map_name, rec in (vj.get("colleges") or {}).items():
        fname = resolve(map_name)
        if not fname:
            continue
        met = bool(rec.get("star"))
        stars[fname] = met
        if met:
            n += 1
    if not stars:
        return None
    return {
        "colleges": stars,
        "as_of": (vj.get("scraped_at") or "").split("T")[0],
        "threshold": vj.get("star_threshold"),
        "n": n,
    }


def main():
    ds, src = _load_input(sys.argv[1:])
    out = OUT_JS
    if "--out" in sys.argv:
        out = sys.argv[sys.argv.index("--out") + 1]
    if ds is None:
        print(f"funding-performance: no CustomReport input / {VIEW} view found "
              f"(src={src}) — keeping the existing artifact, exiting 0.")
        return
    cm = ds["col_map"]
    i_col = cm.get("College", 0)
    i_tcr = cm.get("Transcribed Credits")
    i_ecr = cm.get("Eligible Credits")
    i_acr = cm.get("Applied Credits")
    i_pot = cm.get("Potential Student")
    i_test = cm.get("Test Student")
    i_sid = cm.get("MAP Internal StudentID")
    i_type = cm.get("CPL Type Description")
    i_loc2 = cm.get("LocID2")
    i_origin = cm.get("Origin")
    # The CPL lifecycle attestation (Sam -> Pedro, 2026-09-01): boolean fields
    # for the lifecycle steps, upload through transcribe. The one the funding
    # model reads is the counselor/accepted step — "either the student or the
    # counselor/coordinator/initiator could check the counseling step done, and
    # by doing so attesting that the student accepted the CPL on the plan."
    #
    # ⚠️ THE SPELLING IS NOT CONFIRMED YET, so candidates are SWEPT rather than
    # assumed — the same posture the Origin cutover takes, and for the same
    # reason: a guessed column name resolves to None and silently omits the
    # measure, which is indistinguishable from the feed simply not carrying it.
    # Sweeping and printing which one matched makes the cutover verifiable.
    i_accept = next((cm[k] for k in ("Counselor Step", "Counselor", "CPL Plan Accepted",
                                     "Plan Accepted", "Accepted", "Counseling Step")
                     if k in cm), None)
    if i_tcr is None or i_sid is None:
        print("funding-performance: required columns missing — exiting 0 without changes.")
        return

    resolve = _name_resolver()
    feeder_resolve = _feeder_resolver()
    # `pa` only exists when the pull carried the Applied Credits column. It is
    # OMITTED rather than emitted as zeros when the column is absent: a present-
    # but-all-zero `pa` would read to earnFraction() as "feed published, this
    # college posted nothing" and pay every college $0 on a column we simply
    # never asked for. Absent keys are the honest shape for absent data.
    has_applied = i_acr is not None
    # PPA (added 2026-08-27 per Sam) = APPLIED units among PORTAL-ORIGIN students
    # (Potential Student = Yes). This is the measure the Year-1 Access metric has
    # been asking for since it was written: "Applied units ... for students
    # originating from either CPL Portal, College CPL Landing Page, or batch
    # upload". Sam, 2026-08-27: "Potential Student ... is our temporary field
    # indicating it was submitted from a landing page or the portal ... count
    # every instance of Yes as meeting these metrics."
    #
    # ⚠️ IT IS NOT `pa` RESTRICTED — IT IS `pa`'s COMPLEMENT. Every other metric
    # here carries `and not is_potential`, so pe/pa/p2/p3 describe the DOCUMENTED
    # cohort and deliberately EXCLUDE portal-origin students; `pp` was the only
    # measure of that population and it is gated on TRANSCRIBED. So there was no
    # applied-among-portal-origin figure at all, and scoring Access on `pa` would
    # have measured the exact set of students the metric excludes.
    #
    # TEMPORARY BY DESIGN. MAP is replacing this Yes/No with an explicit `Origin`
    # (Student Portal / Landing Page / Batch / College Entered) plus a `LocID2`
    # naming the noncredit location a record came from. When those land, this
    # measure narrows to the named origins and the noncredit lane gets its own
    # cut of the same rung — see METRIC_SOURCES in cpl_funding.js.
    metrics = ("pe", "pa", "ppa", "p2", "p3", "pp") if has_applied else ("pe", "p2", "p3", "pp")
    if not has_applied:
        print("funding-performance: NOTE — 'Applied Credits' not in this pull; "
              "pa/pa_u omitted (not zeroed). Check fetch_custom_report.py's column list.")
    # ── the consolidated three (Sam, 2026-09-01) ─────────────────────────
    # `ppe` = ELIGIBLE units among portal-origin students, the Access band's
    # measure once Sam ruled "filter now". It needs no new column — Potential
    # Student is already in the pull — so unlike pac it emits from today's feed.
    #
    # ⚠️ IT IS pe's COMPLEMENT, NOT pe FILTERED, exactly as ppa is pa's: every
    # pe/pa/p2/p3 hit below carries `and not is_potential`. Reading ppe as a
    # narrowing of pe would score Access on the cohort its own wording excludes,
    # which is the error the ppa block above exists to document.
    metrics = metrics + ("ppe",)
    # `pac` = APPLIED units on an accepted Student CPL Plan. OMITTED (not zeroed)
    # until the pull carries the attestation column — same shape as pa and the
    # nc_* keys, because a present-but-all-zero key reads to earnFraction() as
    # "the feed published and this college posted nothing" and would pay every
    # college $0 on a column we never asked for.
    has_accept = i_accept is not None
    if has_accept:
        metrics = metrics + ("pac",)
    else:
        print("funding-performance: NOTE — no CPL lifecycle attestation column in this pull; "
              "pac/pac_u omitted (not zeroed). Awaiting the counselor-step boolean "
              "(Sam -> Pedro, 2026-09-01); srcDelivered() reads the absence as undelivered.")
    # ── ORIGINATION (2026-08-31, the N2 b gate) ──────────────────────────
    # The nc_* keys exist only when the pull carries `LocID2` — the same
    # OMITTED-not-zeroed shape as `pa`: srcDelivered() in cpl_funding.js asks
    # the artifact whether a key is there, and an absent key is what keeps the
    # noncredit shares at the honest "no feed yet" $0 rather than a measured
    # zero. The day the column lands these keys appear and the 2026-08-27
    # METRIC_SOURCES wiring starts returning real values with no consumer edit.
    has_loc2 = i_loc2 is not None
    if has_loc2:
        metrics = metrics + ("nc_pe", "nc_pa", "nc_pt")
        print("funding-performance: 'LocID2' is in this pull — emitting the "
              "nc_* origination measures and the origination block.")
    else:
        print("funding-performance: NOTE — 'LocID2' not in this pull; the nc_* "
              "origination measures and the origination block are omitted (not "
              "zeroed). They appear the day MAP ships the origination fields.")
    if i_origin is not None:
        print("funding-performance: NOTE — an 'Origin' column arrived. Its value "
              "histogram is emitted as `origin_values` for verification; the ppa "
              "cutover from 'Potential Student' to named origins stays PENDING "
              "until the value spellings are confirmed (a guessed match could "
              "silently zero the Access priority).")
    resolve_origin = _origin_resolver() if has_loc2 else None
    origin_scopes = _origin_scopes() if has_loc2 else {}
    seen = {m: set() for m in metrics}          # per-(college,sid) dedupe
    state_seen = {m: set() for m in metrics}    # statewide distinct (cross-college dedupe by sid)
    counts = {}                                 # funding-name -> {pe,p2,p3,pp}
    unmatched = {}
    state = {m: 0 for m in metrics}
    # ── UNIT sums (2026-07-31) ───────────────────────────────────────────
    # The FTES priority metrics need UNITS, not student counts. The unit value
    # rides the SAME first-seen-per-(college,sid) guard as its count, so a unit
    # sum and its student count always describe exactly the same set of students
    # — which is what makes "units per student" meaningful and lets one
    # suppression decision cover both.
    #
    # Grain caveat: the source view requests dimensional columns (Catalog Year,
    # CPL Mode of Learning, CPL Type Description) alongside the student id, so a
    # student MAY have several rows. Taking the FIRST row per (college, sid)
    # matches the existing count semantics exactly and can only ever UNDER-count;
    # a naive sum would silently DOUBLE-count if the rows are redundant repeats
    # (which is what the test fixture assumes). MAP's own per-college totals are
    # read below as an independent cross-check so the real grain is measured
    # rather than assumed.
    UNIT_METRICS = tuple(m for m in ("pe", "pa", "ppa", "ppe", "pac", "p3", "pp",
                                     "nc_pe", "nc_pa", "nc_pt") if m in metrics)
    unit_of = {"pe": "ecr", "pa": "acr", "ppa": "acr", "ppe": "ecr", "pac": "acr",
               "p3": "tcr", "pp": "tcr",
               "nc_pe": "ecr", "nc_pa": "acr", "nc_pt": "tcr"}
    units = {}                                  # funding-name -> {pe_u,p3_u,pp_u}
    unmatched_units = {}
    state_units = {m: 0.0 for m in UNIT_METRICS}
    feeder_counts = {}                          # feeder-short -> {pe}  (F1 eligible headcount)
    feeder_seen = set()                         # per-(feeder,sid) dedupe
    # ── ORIGINATION accumulators (only fed when has_loc2) ────────────────
    ORIG_RUNGS = (("pe", "ecr"), ("pa", "acr"), ("pt", "tcr"))
    orig_matrix = {}        # origin short -> receiving funding name -> {pe,pe_u,pa,pa_u,pt,pt_u}
    orig_seen = set()       # per-(origin, college, sid, rung) dedupe
    orig_tot = {}           # origin short -> {nc_pe..nc_pt_u} — SCOPED, student grain
    orig_tot_seen = set()   # per-(origin, sid, rung) dedupe
    unmatched_origins = {}  # raw LocID2 value -> distinct-student set (masked on emit)
    origin_values = {}      # raw Origin value -> row count (verification only)
    # ── CPL TYPE split (2026-08-06) ──────────────────────────────────────
    # Per-college distinct-student counts BY `CPL Type Description`, for the
    # funnel rungs pe/pa/p3. Two questions it answers, neither of which the
    # undifferentiated counts can:
    #   1. Is a college's CPL practice still ONLY the military/JST lane? (The
    #      JST upload creates the CPL Plan and the DD-214/JST Basic Training
    #      rows auto-apply against an already-articulated exhibit, so a college
    #      can post applied credit without ever performing the per-CR
    #      articulation step it is actually being asked to do.)
    #   2. Is a transcribed figure real lifecycle work, or a BATCH? Batch
    #      Cx/AP/IB uploads land already-transcribed by construction (the
    #      students are in the college SIS and are merely being surfaced in
    #      MAP — Sam, 2026-08-06), so an undifferentiated transcribed count
    #      rewards batch loading and real counselling identically.
    #
    # COUNTS ONLY — deliberately no unit sums per type. Each source row carries
    # the student's TOTAL credit figures, not that type's portion (the
    # unit_crosscheck below reads ~1.005 against MAP's own totals, i.e. the
    # extra rows are redundant REPEATS, not partitions). Summing units per type
    # would therefore attribute a student's whole total to every type they
    # carry. Distinct-student counts are safe under repeats; unit sums are not.
    has_type = i_type is not None
    if not has_type:
        print("funding-performance: NOTE — 'CPL Type Description' not in this pull; "
              "cpl_types omitted (not zeroed). Check fetch_custom_report.py's column list.")
    TYPE_METRICS = tuple(m for m in ("pe", "pa", "p3") if m in metrics)
    type_counts = {}                            # funding-name -> type -> {pe,pa,p3}
    type_seen = set()                           # per-(college,type,sid,metric) dedupe
    state_types = {}                            # type -> {pe,pa,p3}
    state_type_seen = set()                     # per-(type,sid,metric) dedupe
    rowno = 0
    for row in ds["rows"]:
        rowno += 1
        college = (row[i_col] or "").strip()
        if not college or college in TEST_COLLEGES:
            continue
        if i_test is not None and (row[i_test] or "").strip().lower() == "yes":
            continue
        # pe/p2/p3 count DOCUMENTED students (Potential excluded, as before); the
        # new `pp` counts PORTAL-ORIGIN students (Potential Student = Yes) with
        # transcribed CPL — the "from the CPL Student Portal / Landing Page"
        # metric (added 2026-07-27 per Sam; a tiny, mostly-test cohort until the
        # Portal launches). We no longer skip Potential rows outright — we route
        # them to pp instead.
        is_potential = i_pot is not None and (row[i_pot] or "").strip().lower() == "yes"
        # The lifecycle attestation. MAP has not confirmed how the boolean is
        # rendered on the wire, so every truthy spelling a boolean column
        # plausibly carries is accepted — and nothing else is, so an unexpected
        # value reads False and shows up as a missing measure rather than as a
        # silently inflated one.
        accepted = i_accept is not None and (row[i_accept] or "").strip().lower() in (
            "true", "yes", "y", "1", "t")
        # `Origin` value histogram — verification only, so the ppa cutover to
        # named origins can be made on CONFIRMED spellings, never guessed ones.
        if i_origin is not None:
            _ov = (row[i_origin] or "").strip()
            if _ov:
                origin_values[_ov] = origin_values.get(_ov, 0) + 1
        try:
            tcr = float((row[i_tcr] or "0").strip() or 0)
        except ValueError:
            continue
        try:
            ecr = float((row[i_ecr] or "0").strip() or 0) if i_ecr is not None else 0.0
        except ValueError:
            ecr = 0.0
        try:
            acr = float((row[i_acr] or "0").strip() or 0) if has_applied else 0.0
        except ValueError:
            acr = 0.0
        if tcr <= 0 and ecr <= 0 and acr <= 0:
            continue
        sid = (row[i_sid] or "").strip()
        # Origination (2026-08-31): `LocID2` names the noncredit origin. Only a
        # RESOLVED known location feeds the money-bearing nc_* measures; an
        # unknown value is surfaced in unmatched_origins, never guessed onto an
        # institution (NULL-when-unknown / never-defaulted is the ruled
        # invariant — a wrong origin misdirects funding).
        loc2 = (row[i_loc2] or "").strip() if has_loc2 else ""
        nc_origin = resolve_origin(loc2) if loc2 else None
        if loc2 and not nc_origin:
            unmatched_origins.setdefault(loc2, set()).add(sid or f"row{rowno}")
        fname = resolve(college)
        if not fname:
            # Not a funding college — is it a noncredit FEEDER campus? If so, count
            # its F1 eligible headcount (distinct students with eligible units in
            # MAP; same "eligible" measure as `pe`, Potential/Test excluded) and
            # DON'T route it to `unmatched`. Empty until campuses attach exhibits.
            fshort = feeder_resolve(college)
            if fshort:
                if ecr > 0 and not is_potential:
                    fk = (fshort, sid) if sid else (fshort, f"row{rowno}")
                    if fk not in feeder_seen:
                        feeder_seen.add(fk)
                        feeder_counts.setdefault(fshort, {"pe": 0})["pe"] += 1
                continue
        bucket = counts if fname else unmatched
        ubucket = units if fname else unmatched_units
        key = fname or college
        rec = bucket.setdefault(key, {m: 0 for m in metrics})
        urec = ubucket.setdefault(key, {m + "_u": 0.0 for m in UNIT_METRICS})
        for metric, hit in (("pe", ecr > 0 and not is_potential),
                            # `pa` is guarded by has_applied via acr staying 0.0
                            # when the column is absent, so the hit never fires.
                            ("pa", acr > 0 and not is_potential),
                            ("p3", tcr > 0 and not is_potential),
                            ("p2", tcr >= P2_MIN_UNITS and not is_potential),
                            ("pp", tcr > 0 and is_potential),
                            # The mirror of `pa` on the other side of the
                            # partition: same rung, opposite cohort.
                            ("ppa", acr > 0 and is_potential),
                            # ELIGIBLE on the portal side of the same partition
                            # — the Access band's measure (Sam, 2026-09-01).
                            ("ppe", ecr > 0 and is_potential),
                            # The accepted Student CPL Plan. Guarded by `accepted`
                            # staying False when the column is absent, so the hit
                            # never fires then (the `pa` pattern). Deliberately NO
                            # is_potential condition: the attestation is a thing
                            # done for one student regardless of how they arrived,
                            # so it spans BOTH cohorts rather than picking a side.
                            ("pac", acr > 0 and accepted),
                            # Noncredit-origin cut (2026-08-31): the receiving
                            # college's funnel among students whose LocID2
                            # resolves to a known noncredit location. Guarded by
                            # nc_origin staying None when the column is absent,
                            # so the hits never fire then (the `pa` pattern).
                            # Deliberately NO is_potential condition — Origin/
                            # LocID2 are what replace that temporary flag.
                            ("nc_pe", ecr > 0 and nc_origin is not None),
                            ("nc_pa", acr > 0 and nc_origin is not None),
                            ("nc_pt", tcr > 0 and nc_origin is not None)):
            if not hit:
                continue
            k = (key, sid) if sid else (key, f"row{rowno}")
            if k not in seen[metric]:
                seen[metric].add(k)
                rec[metric] += 1
                # Units ride the SAME guard as the count — same students, so the
                # two are always describing the same set.
                if metric in UNIT_METRICS:
                    val = {"ecr": ecr, "acr": acr, "tcr": tcr}[unit_of[metric]]
                    urec[metric + "_u"] += val
                    # STATEWIDE units are a plain SUM of the per-college sums, NOT
                    # sid-deduped like the counts: units are awarded per college, so
                    # a student with CPL at two colleges legitimately contributes
                    # both. (Measured on the live feed: cross-college overlap is
                    # ~12 students in 43,000, so the two readings barely differ --
                    # but summing is the semantically correct one.)
                    state_units[metric] += val
            # Statewide COUNTS keep their own cross-college dedupe by student id.
            sk = sid if sid else f"row{rowno}"
            if sk not in state_seen[metric]:
                state_seen[metric].add(sk)
                state[metric] += 1
        # Origination matrix + scoped totals (funding colleges only — the
        # receiving side of an originated record is a credit college). The
        # SCOPED totals are computed here at the student grain, deduped per
        # (origin, student, rung), so a <5-suppressed matrix cell never
        # subtracts from the figure the trio's earn-out reads.
        if nc_origin is not None and fname:
            _sk = sid if sid else f"row{rowno}"
            _scope = origin_scopes.get(nc_origin, set())
            _scoped = _scope is None or fname in _scope
            for _rung, _field in ORIG_RUNGS:
                _val = {"ecr": ecr, "acr": acr, "tcr": tcr}[_field]
                if _val <= 0:
                    continue
                _mk = (nc_origin, fname, _sk, _rung)
                if _mk not in orig_seen:
                    orig_seen.add(_mk)
                    _cell = orig_matrix.setdefault(nc_origin, {}).setdefault(
                        fname, {r + s: 0 for r, _f in ORIG_RUNGS for s in ("", "_u")})
                    _cell[_rung] += 1
                    _cell[_rung + "_u"] += _val
                if _scoped:
                    _tk = (nc_origin, _sk, _rung)
                    if _tk not in orig_tot_seen:
                        orig_tot_seen.add(_tk)
                        _tot = orig_tot.setdefault(nc_origin, {
                            "nc_" + r + s: 0 for r, _f in ORIG_RUNGS for s in ("", "_u")})
                        _tot["nc_" + _rung] += 1
                        _tot["nc_" + _rung + "_u"] += _val
        # CPL-type split — funding colleges only (the `unmatched` bucket already
        # exists for name-join visibility and doesn't need a type breakdown).
        # A student carrying rows of two types counts once under EACH; the
        # dedupe key is (college, type, sid, metric), so repeated rows of the
        # same type still count once.
        if has_type and fname:
            ctype = (row[i_type] or "").strip()
            if ctype:
                trec = type_counts.setdefault(fname, {}).setdefault(
                    ctype, {m: 0 for m in TYPE_METRICS})
                srec = state_types.setdefault(ctype, {m: 0 for m in TYPE_METRICS})
                sid_key = sid if sid else f"row{rowno}"
                for metric, hit in (("pe", ecr > 0 and not is_potential),
                                    ("pa", acr > 0 and not is_potential),
                                    ("p3", tcr > 0 and not is_potential)):
                    if not hit or metric not in TYPE_METRICS:
                        continue
                    tk = (fname, ctype, sid_key, metric)
                    if tk not in type_seen:
                        type_seen.add(tk)
                        trec[metric] += 1
                    stk = (ctype, sid_key, metric)
                    if stk not in state_type_seen:
                        state_type_seen.add(stk)
                        srec[metric] += 1

    # `pp` (portal-origin) is shown RAW, not <5-suppressed (Sam, 2026-07-27):
    # the privacy gate for it is the Test Student field (Test = Yes already
    # excluded above), and the small portal count itself IS the signal to
    # surface per college. pe/p2/p3 keep the ratified <5 suppression (real
    # students — adr-funding-priority-metrics-privacy.md).
    # `ppa` joins `pp` because it describes the SAME PEOPLE (Potential Student =
    # Yes) at a different rung — a college's portal cohort is already visible
    # through `pp`, so suppressing `ppa` would hide nothing that is not already
    # shown while costing small-portal colleges their Access money (a suppressed
    # cell reads to earnFraction() as "not yet credited", f=0). Consistency here
    # is both the privacy-neutral and the funding-correct choice.
    NO_SUPPRESS = {"pp", "ppa"}

    def suppress(bucket, ubucket=None):
        outb = {}
        for name, rec in sorted(bucket.items()):
            o = {}
            urec = (ubucket or {}).get(name, {})
            for metric in metrics:
                n = rec.get(metric, 0)
                hide = metric not in NO_SUPPRESS and 0 < n < SUPPRESS_BELOW
                if hide:
                    o[metric] = None
                    o[metric + "_suppressed"] = True
                else:
                    o[metric] = n
                # A unit sum is suppressed by its STUDENT COUNT, never by its own
                # magnitude: privacy is about how many people a cell describes,
                # and 40 units held by 2 students is exactly the cell the <5 rule
                # exists to hide. Keying off the units would both leak that cell
                # and needlessly hide a large-cohort one.
                uk = metric + "_u"
                if uk in urec:
                    if hide:
                        o[uk] = None
                        o[uk + "_suppressed"] = True
                    else:
                        o[uk] = round(urec[uk], 2)
            outb[name] = o
        return outb

    def suppress_feeders(bucket):
        out = {}
        for short, rec in sorted(bucket.items()):
            n = rec.get("pe", 0)
            if 0 < n < SUPPRESS_BELOW:
                out[short] = {"pe": None, "pe_suppressed": True}
            else:
                out[short] = {"pe": n}
        return out

    def _suppress_type_rec(rec):
        o = {}
        for metric in TYPE_METRICS:
            n = rec.get(metric, 0)
            if 0 < n < SUPPRESS_BELOW:
                o[metric] = None
                o[metric + "_suppressed"] = True
            else:
                o[metric] = n
        return o

    def suppress_type_map(types):
        # Drop all-zero types: a row can register a type while hitting none of
        # pe/pa/p3 (a Potential-Student row routes to `pp` only), which would
        # otherwise emit an empty cell that reads as a measured zero.
        live = {t: r for t, r in sorted(types.items())
                if any(r.get(m, 0) for m in TYPE_METRICS)}
        out = {t: _suppress_type_rec(r) for t, r in live.items()}
        # COMPLEMENTARY SUPPRESSION (the privacy ADR's subtraction threat).
        # A lone suppressed cell is recoverable: subtract the visible types from
        # the college's own count and the hidden one falls out. Multi-type
        # students blunt that (the types deliberately over-count, so the residual
        # is an upper bound rather than an equality) — but a college where no
        # student holds two types leaks the cell exactly. So whenever a metric
        # has exactly ONE suppressed type, hide the smallest visible one too.
        for metric in TYPE_METRICS:
            hidden = [t for t, r in live.items()
                      if 0 < r.get(metric, 0) < SUPPRESS_BELOW]
            if len(hidden) != 1:
                continue
            visible = [(r.get(metric, 0), t) for t, r in live.items()
                       if r.get(metric, 0) >= SUPPRESS_BELOW]
            if not visible:
                continue                     # nothing to subtract from; no leak
            _, t = min(visible)
            out[t][metric] = None
            out[t][metric + "_suppressed"] = True
        return out

    def suppress_types(bucket):
        out = {}
        for name, types in sorted(bucket.items()):
            rec = suppress_type_map(types)
            if rec:
                out[name] = rec
        return out

    payload = {
        "as_of": (ds["generated_at"] or "").split("T")[0] or date.today().isoformat(),
        "basis": ("MAP " + VIEW + " — distinct students per college; "
                  "Test students and test colleges excluded; "
                  "P2 = transcribed CPL units >= 6, P3 = any transcribed CPL, "
                  "PE = any eligible CPL units identified, "
                  "PA = any APPLIED CPL units (the middle funnel rung: eligible -> applied "
                  "-> transcribed; unlike eligible it does not carry the ACE/JST skill-level "
                  "duplication, and unlike eligible it is an action the college took), "
                  "PP = portal-origin (Potential Student = Yes) with any transcribed CPL "
                  "(the CPL Student Portal / Landing Page metric; small & mostly test until launch), "
                  "PPA = APPLIED units among those same portal-origin students — the measure the "
                  "Access metric asks for, and NOT a subset of PA: pe/pa/p2/p3 all EXCLUDE "
                  "Potential Student = Yes, so PA and PPA describe disjoint cohorts (per MAP). "
                  "NC_PE/NC_PA/NC_PT = the same three rungs among students whose LocID2 "
                  "resolves to a known noncredit origin (present only when the pull carries "
                  "LocID2; see the `origination` block for the per-origin scoped cuts). "
                  "*_u keys are UNIT sums over exactly the same students as their count "
                  "(first row per college+student, matching the count dedupe); statewide "
                  "unit sums are the plain sum of the per-college sums, NOT sid-deduped, "
                  "because units are awarded per college"),
        "suppress_below": SUPPRESS_BELOW,
        "statewide": dict(state, **{m + "_u": round(state_units[m], 2) for m in UNIT_METRICS}),
        "colleges": suppress(counts, units),
        "unmatched": suppress(unmatched, unmatched_units),
        # F1 (noncredit feeder eligible headcount) — per-feeder short -> {pe}.
        # Empty until the feeders attach exhibits to their NC records in MAP.
        "feeders": suppress_feeders(feeder_counts),
    }
    # CPL-type split — OMITTED (not zeroed) when the pull lacks the column, the
    # same shape `pa` uses: an all-zero breakdown would read as "measured, this
    # college has no non-military CPL" on a column we never asked for.
    if has_type:
        payload["cpl_types"] = suppress_types(type_counts)
        payload["cpl_types_statewide"] = suppress_type_map(state_types)
        payload["cpl_types_note"] = (
            "Distinct-student counts per college per `CPL Type Description`, for the "
            "funnel rungs pe/pa/p3. COUNTS ONLY — no unit sums, because each source row "
            "carries the student's TOTAL credits rather than that type's portion, so a "
            "per-type unit sum would attribute the whole total to every type a student "
            "carries. A student holding two types counts once under each, so the types "
            "do NOT sum to the college's undifferentiated count. Batch Cx/AP/IB uploads "
            "arrive already-transcribed by construction (students already in the college "
            "SIS, surfaced in MAP), so read p3 by type before treating a transcribed "
            "figure as lifecycle work.")
    # Origination block — OMITTED (not zeroed) when the pull lacks LocID2, the
    # same shape `pa` uses. The per-college nc_* keys and the statewide nc_*
    # sums already rode the ordinary machinery above; this block adds the
    # per-origin cuts the one-pool model and its audit surfaces read.
    if has_loc2:
        def _suppress_orig_rec(rec, keys):
            o = {}
            for bk in keys:
                n = rec.get(bk, 0)
                hide = 0 < n < SUPPRESS_BELOW
                o[bk] = None if hide else n
                if hide:
                    o[bk + "_suppressed"] = True
                uk = bk + "_u"
                if uk in rec:
                    o[uk] = None if hide else round(rec[uk], 2)
                    if hide:
                        o[uk + "_suppressed"] = True
            return o

        payload["origination"] = {
            "note": ("Noncredit-origin cuts keyed by MAP LocID2 (2026-08-31, the N2 b gate). "
                     "in_scope = each origin institution's originated funnel counted only where "
                     "the receiving college is inside its ruled scope (NOCE/SDCCE: their "
                     "district's credit colleges; Calbright: statewide) — computed at the "
                     "student grain, deduped per (origin, student, rung), so a suppressed "
                     "matrix cell never subtracts from it. This is what the noncredit-only "
                     "institutions' origination earn-out reads: they draw only as originated "
                     "CPL posts, no advances. by_origin = the (origin x receiving college) "
                     "matrix for audit, cell-suppressed per the privacy ADR. Only LocID2 "
                     "values resolving to a KNOWN noncredit location count; unresolved values "
                     "are surfaced in unmatched_origins, never guessed onto an institution."),
            "scopes": {short: ({"scope": "statewide", "colleges": None} if s is None
                               else {"scope": "district", "colleges": sorted(s)})
                       for short, s in origin_scopes.items()},
            "in_scope": {short: _suppress_orig_rec(rec, ("nc_pe", "nc_pa", "nc_pt"))
                         for short, rec in sorted(orig_tot.items())},
            "by_origin": {short: {cn: _suppress_orig_rec(cell, ("pe", "pa", "pt"))
                                  for cn, cell in sorted(cols.items())}
                          for short, cols in sorted(orig_matrix.items())},
            "unmatched_origins": {v: (len(sids) if len(sids) >= SUPPRESS_BELOW
                                      else "<" + str(SUPPRESS_BELOW))
                                  for v, sids in sorted(unmatched_origins.items())},
        }
    if i_origin is not None:
        payload["origin_values"] = dict(sorted(origin_values.items()))
        payload["origin_values_note"] = (
            "Row counts per raw `Origin` value — verification only. The ppa cutover from "
            "'Potential Student' to named origins is made on these CONFIRMED spellings, "
            "never guessed ones.")
    # Cross-check our per-student unit sums against MAP's OWN published per-college
    # totals. Reported, never used to overwrite: a gap is information about the
    # source view's grain, and silently "correcting" to it would mix populations
    # (that view has no Test/Potential filter).
    xcheck = _load_credit_distribution(src, resolve)
    if xcheck:
        # Only cross-check keys we actually produced this run (`pa_u` is absent
        # when the pull carried no Applied Credits column).
        xkeys = tuple(k for k in ("pe_u", "pa_u", "p3_u")
                      if any(k in u for u in units.values()))
        ours = {k: sum(u.get(k, 0.0) for u in units.values()) for k in xkeys}
        theirs = {k: sum(v.get(k, 0.0) for v in xcheck.values()) for k in xkeys}
        payload["unit_crosscheck"] = {
            "source": CREDIT_DIST_VIEW,
            "note": ("MAP's own per-college totals, which include Test/Potential rows we "
                     "exclude — so a small positive gap is expected. A ratio near 2.0 would "
                     "mean our per-student rows are partitions, not repeats, and the "
                     "first-seen reducer is dropping units."),
            "ours": {k: round(v, 2) for k, v in ours.items()},
            "map": {k: round(v, 2) for k, v in theirs.items()},
            "ratio": {k: (round(theirs[k] / ours[k], 4) if ours[k] else None) for k in ours},
        }
        print("funding-performance: unit cross-check vs " + CREDIT_DIST_VIEW + " — "
              + ", ".join("%s ours=%s map=%s ratio=%s" % (
                  k, f"{ours[k]:,.0f}", f"{theirs[k]:,.0f}",
                  (f"{theirs[k]/ours[k]:.3f}" if ours[k] else "n/a")) for k in xkeys))
    else:
        print("funding-performance: unit cross-check unavailable ("
              + CREDIT_DIST_VIEW + " not in the pull) — unit sums unverified this run.")

    # Veteran Star (>=75% of enrolled veterans' JSTs uploaded) — the auto-computed
    # eligibility qualifier for the funding tab's Elig glyph (Sam, 2026-07-27).
    vet = read_veteran_stars(resolve)
    if vet:
        payload["vet_star"] = vet["colleges"]
        payload["vet_star_as_of"] = vet["as_of"]
        payload["vet_star_threshold"] = vet["threshold"]
        payload["vet_star_n"] = vet["n"]
    with open(out, "w", encoding="utf-8") as f:
        f.write(
            "// CPL funding priority-metric actuals (P2/P3 + the PE eligible-students\n"
            "// context column) — generated daily by\n"
            "// funding/_build_funding_performance.py from the transient CustomReport\n"
            "// pull. Aggregate, small-cell-suppressed counts ONLY (see\n"
            "// docs/kb-notes/adr-funding-priority-metrics-privacy.md). Do not hand-edit.\n"
            "window.CPL_FUNDING_PERF = " + json.dumps(payload, indent=1, ensure_ascii=False) + ";\n"
        )
    sup = sum(1 for r in payload["colleges"].values() for m in ("p2", "p3") if r.get(m) is None)
    print(f"wrote {os.path.normpath(out)}: {len(payload['colleges'])} colleges "
          f"({sup} suppressed cells), {len(payload['unmatched'])} unmatched, "
          f"{len(payload['feeders'])} feeders (F1 eligible), "
          + (f"origination: {len(orig_tot)} origins in scope, "
             f"{len(unmatched_origins)} unmatched LocID2 values, " if has_loc2 else "")
          + f"statewide pe={state['pe']:,} "
          + (f"pa={state['pa']:,} " if has_applied else "")
          + f"p2={state['p2']:,} p3={state['p3']:,} "
          f"pp={state['pp']:,} "
          + (f"ppa={state['ppa']:,} " if has_applied else "")
          + "| units "
          + " ".join(f"{m}_u={state_units[m]:,.0f}" for m in UNIT_METRICS)
          + f", as_of {payload['as_of']}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""_build_commons_data_status.py — the Commons data dashboard's figures, college by college (#3215, slice 1).

Sam, 2026-11-13, relayed by COBIx on #3215: a Commons dashboard for each college's datasets we pull, with
completeness and confidence, known gaps and the asks that would improve them, in the Funding Follow-up
Dashboard's pattern (tiles that filter, a college list, later a side panel). Slice 1 is the tiles and the
college list at #commons/data (commons_data.js draws them from the file this writes).

WHAT IT READS, committed files only (it writes no table and calls no network):
  kb/college_identity/<newest>/crosswalk.json     the universe, through kb/_college_identity_latest.py: every
                                                   college and continuing-education campus, by district (the two
                                                   partner entities stay off this page).
  kb/program_requirements_college/<slug>/          each harvested college's capture (capture.json "started", or
                                                   capture_preview.json on a pull request branch), its filed
                                                   records' scores and summary.json (cost_usd and the programs that
                                                   passed the machine checks at read time).
  kb/_harvest_gap_census.py                        its committed-files functions, imported and never restated: the
                                                   universe the captures listed, the tab's passing test, and one
                                                   cause for each program without a passing record.
  kb/course_outcomes/queue.json                    the colleges whose course SLO read is none, held or parser.
  kb/harvest_scouting/scout-*.json                 COBIx's source scouts: recommendation, access challenge, date.
  kb/spot_checks/*.check.json                      COBIx's spot-check receipts, filed byte for byte as he posted
                                                   them (schema 1: a top-level "tally" keyed by college name, a
                                                   top-level "checked_at", "records", "holds").
  kb/spot_checks/*.later.json                      ours, beside a receipt: a later settlement COBIx posted without
                                                   JSON (kb/spot_checks/README.md names each source comment).

ONE BASIS. Every program figure here is the committed files' own view (the census's --committed-only
universe: the programs each capture listed). It is not the live table's Active count, which the Program
Requirements tab reads; the page says so beside the figure and never mixes the two.

A figure no committed file supplies is null with its reason in "tba", and the page shows TBA (the house rule
for an unmeasured metric), never a zero and never a stand-in.

FOUR MORE TOP-LEVEL KEYS (S647, #3215 and #3220), the contract with the view's later slices (commons_data.js):

  "live"        the live counts per college, basis "live", never mixed with the committed-files figures above.
                Written by kb/_commons_data_live.py in the census workflow's live-counts job (main only, the
                live-counts environment's service key, counts only; its docstring names every table and column it
                reads), handed to the census job as an artifact and taken in here with --live PATH. Shape:
                  {"basis": "live", "state": "read" | "not read yet", "read_at": UTC | null, "run_id": str | null,
                   "source", "tables": {figure: table}, "rule": {...}, "reads": {"counts", "pages"},
                   "statewide": {"colleges", "programs": {...}, "records": {...}, ...}, "unmatched": [COCI names],
                   "colleges": {"<crosswalk college_id>": {
                       "names": [COCI spellings],
                       "programs": {"active", "teachout", "approved"},
                       "records": {"total", "checked", "active", "active_passing", "active_with_plos", "teachout",
                                   "teachout_passing", "teachout_with_plos", "approved", "approved_passing",
                                   "approved_with_plos"},
                       "program_courses": {"rows", "active_courses"},
                       "outcomes": {"slo_courses", "slo_courses_on_active", "slo_loaded_at", "objective_courses",
                                    "objective_courses_on_active", "objective_loaded_at"},
                       "registry": {"row", "catalog_link", "course_outline_link", "sequence_source",
                                    "sequence_checked"}}},
                   "last_attempt": {"at", "run_id", "ok", "error_class", "http_status", "counts",
                                    "accepted_by_override"} | null,
                   "override": {"accepted_by_override": "accept_active_shift", "active", "previous_active",
                                "run_id"} | null,
                   "flag": "internal"}
                Until the first run: {"basis": "live", "state": "not read yet", "read_at": null, "colleges": {}, ...}
                (LIVE_NOT_READ). FAIL SOFT: a failed read, a missing file, a block that is not counts only, or a
                short read (the floors at COLLEGE_SHARE, ACTIVE_BAND and ACTIVE_FLOOR, documented there) keeps the
                previous committed block whole and records the attempt in last_attempt (ok false, one class from
                ERROR_CLASSES, the HTTP status, and for a short read the counts it saw; never an exception's or an
                export's text), so the page shows the older read_at. With no --live the previous block is carried unchanged, so
                --check holds between census runs.
  "overall"     each college's overall completeness, from "live" alone, basis "live". COBIx's rule on #3215
                (comment 1, "Rules Sam may revisit"), quoted: "Overall = (catalog source + program requirements
                passing + (SLOs + PLOs)/2) / 3, the whole-collection rule. Unread parts count as zero. Objectives,
                descriptions, CPL, PPM, MIS, COE and every Planned bar are left out." and "Catalog source bar: checks
                done out of 3 (catalog link, curriculum view, program maps)." The parts here: catalog = (catalog
                link + curriculum view held + program maps checked) / 3 (the registry records a curriculum view
                only when one is seen, so "checked" reads as "held" there); requirements = Active passing / Active;
                SLOs = SLO courses on Active programs / courses on Active programs; PLOs = Active records with PLOs
                / Active. Each part is clamped to 0..1, and a part with no denominator counts as zero.
                  {"basis": "live", "state", "read_at", "rule", "flag": "shareable",
                   "statewide": {"mean", "colleges"},
                   "colleges": {"<college_id>": {"value": 0..1,
                                                 "parts": {"catalog", "requirements", "slos", "plos"}}}}
                A college the live read did not hold is absent (unread), never zero.
  "dictionary"  one entry per dataset of docs/reference/data_dictionary.md, parsed from the doc (the one source):
                  {"source", "flag": "internal", "errors": [...], "datasets": [{"name", "group", "stage", "owner",
                   "procedure_today", "planned_improvement", "link", "evidence", "evidence_cited",
                   "repo_verifiable", "evidence_missing", "unverified_claims"}]}
                evidence_cited is evidence in the doc family (DOC_FAMILY), a citation and no check; repo_verifiable
                is false when nothing else backs the entry, and then its external claims carry the doc's mark.
  "apis"        the doc's API connection checklist: each API, whether a connection is needed, its status and the
                evidence in the repo for it. A row whose evidence is missing, or a connected or in-progress row
                whose evidence is only cited (the doc family), reads status "unverified", never the status it
                claims (kept as "claimed").
                  {"source", "flag": "internal", "connected", "total", "by_status": {...},
                   "rows": [{"api", "holder", "needed", "status", "claimed", "priority", "evidence",
                             "evidence_cited", "evidence_missing", "note"}]}

Usage, from the repo root:
  python3 kb/_build_commons_data_status.py [--root DIR] [--out PATH] [--live PATH] [--check] [--quiet]
Refresh: the harvest gap census workflow runs it after the census and the live export (fails soft). Guards:
tests/commons_data_status_build_test.py and tests/commons_data_live_test.py; the view's guard is
tests/commons_data.test.js.
"""
from __future__ import annotations

import argparse
import datetime as dt
import glob
import json
import os
import re
import sys

SCHEMA = 1
OUT = "kb/status/commons_data.json"
CROSSWALK_DIR = "kb/college_identity"   # the newest dated baseline, asked of kb/_college_identity_latest.py
COLLEGE_DIR = "kb/program_requirements_college"
SLO_QUEUE = "kb/course_outcomes/queue.json"
SCOUTS = "kb/harvest_scouting/scout-*.json"
SPOT_CHECKS = "kb/spot_checks/*.check.json"
SPOT_LATER = ".later.json"   # ours, beside <name>.check.json
SPOT_README = "kb/spot_checks/README.md"   # names each receipt's source comment: the tie-break on checked_at
STRONG_AT = 5                # strong needs this many checked records at the college, all agreeing
HOLD_AT = 2                  # this many differing records hold the college's display (the spot-check contract, #3111)
IN_SCOPE = ("college", "continuing_education")

# The age cue on a stamp, in days, in one place (Sam, 1:23 AM PT on #3215): fresh within 7, recent within 30,
# stale after. The page reads these from the file and never restates them.
AGE_DAYS = {"fresh": 7, "recent": 30}

# Every field a college row carries, flagged for the College view (a later slice draws only "shareable").
FIELDS = {
    "id": "shareable", "name": "shareable", "district": "shareable", "kind": "shareable",
    "harvested": "shareable", "programs": "shareable", "passing": "shareable", "gap": "shareable",
    "read_at": "shareable", "read_kind": "internal", "slug": "internal", "causes": "internal",
    "cost_usd": "internal", "passed_at_read": "internal", "slo_queue": "internal", "scout": "internal",
    "spot_check": "internal", "confidence": "shareable",
    # slice 2 (the expanding row and the side panel): what the college's read receipt says about its read
    "listed_closed": "shareable", "found": "shareable", "extracted": "shareable", "errors": "internal",
    "failed_checks": "internal", "platform": "shareable", "catalog_year": "shareable", "catalog_url": "shareable",
    "read_seconds": "internal", "run": "internal", "levers": "internal",
    # the field list the slice 2 read figures take from a harvested college (None, never a zero, when unread)
}

# The figures slice 1 cannot read from a committed file, each with its reason (shown as TBA on the page).
TBA = {
    "confidence": "No spot-check receipt is committed yet (kb/spot_checks/). COBIx's tallies sit on the wave pull "
                  "requests; confidence reads strong, partial or limited once a receipt is filed.",
    "overall": "The overall bar averages catalog source, program requirements and outcomes (SLOs and PLOs "
               "averaged), from live counts per college. It waits on the first live read of the census workflow.",
    "teachout_approved": "Teachout and Approved programs are counted apart from Active in the live COCI table; "
                         "the counts wait on the first live read of the census workflow.",
    "apis": "The checklist is filed in the data dictionary; this tile shows it in the next slice of the page.",
    "jst": "The JST funnel waits on an authorized-student feed from CCCStart; counts only, when it exists.",
    # slice 2: the side panel's sections with no committed source per college, each with its reason
    # "slo" and "objectives" are written by outcome_reasons() from what kb/course_outcomes/ holds, so the count
    # in the words is the count on disk.
    "plo": "Program outcomes are filed with each committed program record (record.program.outcomes in "
           "kb/program_requirements_college/<slug>/records/), not yet read per college here.",
    "catalog_registry": "The catalog link, curriculum view and program map checks are rows in the live program "
                        "source registry, which this file does not carry.",
    "ppm": "Program Pathways Mapper has no official export; 4 pilot term maps are committed "
           "(kb/program_requirements_pilot/sequences/), not yet read per college here.",
    "descriptions": "Usable course descriptions per college come from the description classifier (#3219), whose "
                    "counts are not a committed file yet.",
    "cpl": "MAP exhibits per college are a live sync, and no completeness denominator for CPL is defined yet.",
    "mis": "The Fall 2025 MIS course file is committed but not yet joined to each college here.",
    "coe": "The regional labor market crosswalk (kb/regional_cpl_out/) is committed but not yet read per college here.",
    # The load time only (Sam, Nov 13, on #3229: downfocus whether a person reviewed something; the reason now
    # names the load time alone).
    "loaded": "The load time is a column of the live program requirements table, which this file does not carry.",
    "owners": "The gap census names the change that would move each program, not who makes it; an owner joins each "
              "ask when the asks are filed with one.",
}

RULE = {
    "basis": "committed files only: the programs each college's capture listed (the gap census's committed universe)",
    "passing": "coverage and invented true, arithmetic equal or unstated (the Program Requirements tab's own test)",
    "overall": "catalog source + program requirements passing + (SLOs + PLOs) / 2, divided by 3 (the whole-collection "
               "rule), from the live counts (key overall, basis live); unread parts count as zero",
    "confidence": "strong = 5 or more spot-checked records at the college, all agreeing; partial = 5 or more "
                  "checked with one differing, or 5 agree beside an unreachable page; limited = machine checks only, "
                  "fewer than 5 checked whatever they found (a cross-college check), or 2 or more differ (display "
                  "held). An unreachable page is not a checked record; the newest receipt by checked_at counts, and "
                  "on a tie the receipt with the later source comment (kb/spot_checks/README.md)",
    # The Confidence card's one line on the College Data Collection page (#3229), from the same thresholds as
    # confidence() below, so the page never types a threshold of its own.
    "confidence_card": "Strong: %d or more spot-checked records at the college, all agreeing. Partial: %d or more "
                       "checked with one differing, or %d agreeing beside an unreachable page. Limited: machine checks "
                       "only, fewer than %d checked, or %d or more differing (display held)."
                       % (STRONG_AT, STRONG_AT, STRONG_AT, STRONG_AT, HOLD_AT),
    "age_days": AGE_DAYS,
}


DICTIONARY_DOC = "docs/reference/data_dictionary.md"
DICT_SECTION = "## The datasets"
API_SECTION = "## API connection checklist"
DICT_LABELS = {   # the doc's labels, each on one line, to the key the page reads (None: required, not emitted)
    "Group": "group", "Stage": "stage", "Purpose": None, "Owner / steward": "owner", "Grain": None, "Refresh": None,
    "How we procure or connect today": "procedure_today", "Access and terms": None,
    "Planned improvements": "planned_improvement", "Confidence method": None, "Evidence in the repo": "evidence",
}
GROUPS = ("Harvested", "Connected", "Planned")
STAGES = ("Found", "Assessed", "Asked", "Connected", "Scheduled")   # the register's (docs/reference/data_sources.md)
API_STATUSES = ("connected", "in progress", "planned", "not needed")
UNVERIFIED_MARK = "not verified in the repo"

LIVE_NOT_READ = {"basis": "live", "state": "not read yet", "read_at": None, "run_id": None,
                 "source": "kb/_commons_data_live.py in the live-counts job of harvest-gap-census.yml (the live-counts environment)",
                 "statewide": {}, "unmatched": [], "colleges": {}, "last_attempt": None, "flag": "internal"}
LIVE_GROUPS = ("programs", "records", "program_courses", "outcomes", "registry")


def iso_now() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load(root: str, rel: str):
    with open(os.path.join(root, rel), encoding="utf-8") as f:
        return json.load(f)


def norm(s: str | None) -> str:
    s = (s or "").replace("Ã±", "ñ").lower()
    s = re.sub(r"\s+(non-credit|noncredit|credit)$", "", s.strip())
    return re.sub(r"[^a-z0-9ñ]+", " ", s).strip()


def display_name(name: str) -> str:
    """Calbright's crosswalk name carries COCI's credit split ("Calbright College Non-Credit"); the page names
    the college once."""
    return re.sub(r"\s+(Non-Credit|Credit)$", "", name)


class Resolver:
    """Every spelling a committed file uses for a college, to its crosswalk entity: the name, its variants and
    its short name, compared without a trailing Credit or Non-Credit (COCI lists Calbright and the two
    continuing-education campuses twice)."""

    def __init__(self, entities: list[dict]):
        self.by = {}
        for e in entities:
            for n in [e.get("college_name"), e.get("short")] + list(e.get("variants") or []):
                if n:
                    self.by.setdefault(norm(n), e["college_id"])

    def __call__(self, name: str | None):
        return self.by.get(norm(name))


def harvest(root: str):
    """Per harvested college, from the committed files through the census's own functions."""
    sys.path.insert(0, os.path.join(root, "kb"))
    import _harvest_gap_census as G  # noqa: E402  (the census's functions, never restated)
    committed = G.read_committed(os.path.join(root, COLLEGE_DIR))
    universe = G.universe_from_committed(committed)
    r = G.census(universe, committed, None, {})
    listed = {}
    for u in universe:
        listed[u["college"]] = listed.get(u["college"], 0) + 1
    out = {}
    for slug, c in committed.items():
        d = os.path.join(root, COLLEGE_DIR, slug)
        summary = _maybe(os.path.join(d, "summary.json")) or {}
        cap = _maybe(os.path.join(d, "capture.json"))
        prev = _maybe(os.path.join(d, "capture_preview.json"))
        acct = cap or prev or {}
        name = c.get("college") or summary.get("college") or acct.get("college")
        causes = dict(r["per_college"].get(name) or {})
        levers = {}
        for g in r["programs"]:
            if g["college"] == name:
                levers[g["lever"]] = levers.get(g["lever"], 0) + 1
        programs = listed.get(name, 0)
        gap = sum(causes.values())
        out[slug] = {
            "name": name, "programs": programs, "passing": programs - gap, "gap": gap, "causes": causes,
            "read_at": acct.get("started"), "read_kind": "capture" if cap else ("capture_preview" if prev else None),
            "cost_usd": summary.get("cost_usd"), "passed_at_read": summary.get("passed_machine_checks"),
            "listed_closed": summary.get("with_closed_list"), "found": summary.get("found"),
            "extracted": summary.get("extracted"), "errors": summary.get("errors"),
            "failed_checks": summary.get("failed"), "platform": acct.get("platform"),
            "catalog_year": acct.get("catalog_year"), "catalog_url": acct.get("catalog_url"),
            "read_seconds": acct.get("seconds"), "run": summary.get("run") or acct.get("run"),
            "levers": dict(sorted(levers.items(), key=lambda x: (-x[1], x[0]))),
        }
    return out, r


def _maybe(path: str):
    if not os.path.exists(path):
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def crosswalk_path(root: str) -> str:
    """The newest identity baseline, asked of the one helper (never a dated folder named here)."""
    sys.path.insert(0, os.path.join(root, "kb"))
    import _college_identity_latest as CL  # noqa: E402
    return CL.latest_crosswalk_path(os.path.join(root, CROSSWALK_DIR))


def receipt_comments(root: str) -> dict:
    """{file name: source comment id} from kb/spot_checks/README.md's table, the tie-break when two receipts for
    one college share a checked_at. A file the README does not name ranks below one it does."""
    text = _read_text(os.path.join(root, SPOT_README))
    return {m.group(1): int(m.group(2))
            for m in re.finditer(r"`([^`]+\.check\.json)` \| \[#\d+ comment (\d+)\]", text)}


def _read_text(path: str) -> str:
    if not os.path.exists(path):
        return ""
    with open(path, encoding="utf-8") as f:
        return f.read()


def read_spot_checks(root: str, resolve, unmatched: list) -> dict:
    """Each college's newest spot-check, read as COBIx posts it: a top-level "tally" keyed by college name and a
    top-level "checked_at". A later settlement of ours (<name>.later.json, beside the receipt) moves a record's
    unreachable count to agrees, and says so. When a college has more than one receipt, the newest by checked_at
    counts; on a tie, the later source comment id the README names (COBIx on PR 3222), never the file order."""
    spot = {}
    comments = receipt_comments(root)
    for path in sorted(glob.glob(os.path.join(root, SPOT_CHECKS))):
        rel = os.path.relpath(path, root)
        s = load(root, rel)
        later = _maybe(path[:-len(".check.json")] + SPOT_LATER) or {}
        settled = {}
        for r in later.get("records") or []:
            settled.setdefault(r.get("college"), []).append(r)
        for name, t in (s.get("tally") or {}).items():
            cid = resolve(name)
            if cid is None:
                unmatched.append({"file": rel, "name": name})
                continue
            if not isinstance(t, dict):
                continue
            agrees, differs, unreachable = int(t.get("agrees") or 0), int(t.get("differs") or 0), int(t.get("page_unreachable") or 0)
            notes = []
            for r in settled.get(name) or []:
                if r.get("was") == "page_unreachable" and r.get("now") == "agrees" and unreachable > 0:
                    unreachable -= 1
                    agrees += 1
                    notes.append(r.get("control_number"))
            entry = {"agrees": agrees, "differs": differs, "unreachable": unreachable,
                     "checked_at": s.get("checked_at"), "file": rel, "pr": s.get("pr"),
                     "comment": comments.get(os.path.basename(path)), "settled_later": notes or None,
                     "held": differs >= HOLD_AT}
            old = spot.get(cid)
            if old is None or _rank(entry) > _rank(old):
                spot[cid] = entry
    return spot


def _rank(e: dict) -> tuple:
    """A receipt's place among one college's receipts: checked_at, then the source comment id (0 when unnamed)."""
    return (e.get("checked_at") or "", e.get("comment") or 0)


def confidence(spot: dict | None, harvested: bool):
    """Sam's three levels (#3111, 2026-11-11), as COBIx's review of #3222 reads them. None for an unread college."""
    if not harvested and not spot:
        return None
    if not spot:
        return {"level": "limited", "why": "machine checks only; no spot-check yet"}
    a, d, u = spot["agrees"], spot["differs"], spot["unreachable"]
    checked = a + d
    said = "%d agree, %d differ, %d unreachable" % (a, d, u)
    if spot.get("settled_later"):
        said += " (record %s agreed later against the captured text)" % ", ".join(spot["settled_later"])
    if d >= HOLD_AT:
        return {"level": "limited", "why": said + "; display held"}
    # A thin tally reads limited whatever it found (COBIx on PR 3222): a 1-of-1 that differs never outranks one that agrees.
    if checked < STRONG_AT:
        return {"level": "limited", "why": said + "; fewer than %d records checked at this college" % STRONG_AT}
    if d == 1 or u:
        return {"level": "partial", "why": said}
    return {"level": "strong", "why": said}


SLICE2 = ("listed_closed", "found", "extracted", "errors", "failed_checks", "platform", "catalog_year", "catalog_url",
          "read_seconds", "run", "levers")


def slice2_fields(h: dict | None) -> dict:
    """A college's slice 2 read figures: its harvest's, or None for each when the college is unread."""
    return {k: (h.get(k) if h else None) for k in SLICE2}


OUTCOMES = "kb/course_outcomes"


def outcome_hosts(root: str) -> dict:
    """{"slo": [host], "objectives": [host]}: the hosts whose committed outline reads (read_*.json, trial runs left
    out) hold at least one course with outcomes, or with objectives."""
    out = {"slo": set(), "objectives": set()}
    for path in glob.glob(os.path.join(root, OUTCOMES, "*", "read_*.json")):
        host = os.path.basename(os.path.dirname(path))
        if host.startswith("trial_"):
            continue
        with open(path, encoding="utf-8") as f:
            d = json.load(f)
        for r in d.get("rows") or []:
            if not isinstance(r, dict):
                continue
            if r.get("outcomes"):
                out["slo"].add(host)
            if r.get("objectives"):
                out["objectives"].add(host)
    return {k: sorted(v) for k, v in out.items()}


def outcome_reasons(hosts: dict) -> dict:
    s, o = hosts["slo"], hosts["objectives"]
    return {
        "slo": "Course SLO reads are committed for %d host%s under %s/<host>/, not yet read per college here; the SLO "
               "queue's state shows where the queue holds a college." % (len(s), "" if len(s) == 1 else "s", OUTCOMES),
        "objectives": ("Course objectives are committed for %d host%s (%s) under %s/<host>/, not yet read per college "
                       "here." % (len(o), "" if len(o) == 1 else "s", ", ".join(o), OUTCOMES)) if o else
                      "No committed outline read holds course objectives yet.",
    }


def census_words() -> dict:
    """The census's own words for each cause and lever (its CAUSES and LEVER_WORDS), never restated here."""
    import _harvest_gap_census as G  # noqa: E402  (harvest() put kb/ on the path)
    return {"causes": dict(G.CAUSE_WORDS),
            "levers": {k: {"kind": v[0], "what": v[1]} for k, v in G.LEVER_WORDS.items()}}


def github_anchor(heading: str) -> str:
    """The anchor GitHub gives a heading: lower case, punctuation dropped, each space a hyphen."""
    return re.sub(r"[^\w\- ]", "", heading.strip().lower()).replace(" ", "-")


def _section(text: str, head: str) -> str:
    i = text.find("\n" + head + "\n")
    if i < 0:
        return ""
    rest = text[i + len(head) + 2:]
    j = re.search(r"^## ", rest, re.M)
    return rest[:j.start()] if j else rest


def evidence_items(cell: str | None) -> list[str]:
    return [x for x in re.findall(r"`([^`]+)`", cell or "") if x.strip()]


def evidence_ok(root: str, item: str) -> bool:
    """A repo path that exists; `path::text` must also contain the text."""
    path, _, needle = item.partition("::")
    full = os.path.join(root, path.strip())
    if not os.path.exists(full):
        return False
    if not needle:
        return True
    if os.path.isdir(full):
        return False
    with open(full, encoding="utf-8", errors="replace") as f:
        return needle in f.read()


# The doc family: evidence that points here is a citation of what this PR's own docs say, never a check of an
# external claim (the review of #3232, finding 4).
DOC_FAMILY = ("docs/reference/data_dictionary.md", "docs/reference/data_sources.md")


def cited(item: str) -> bool:
    return item.partition("::")[0].strip() in DOC_FAMILY


def parse_dictionary(root: str) -> tuple[dict, dict]:
    """The data dictionary's datasets and its API checklist, from the doc alone."""
    path = os.path.join(root, DICTIONARY_DOC)
    errors = []
    if not os.path.exists(path):
        return ({"source": DICTIONARY_DOC, "flag": "internal", "errors": ["the doc is missing"], "datasets": []},
                {"source": DICTIONARY_DOC, "flag": "internal", "connected": 0, "total": 0, "by_status": {}, "rows": []})
    with open(path, encoding="utf-8") as f:
        text = f.read()
    datasets = []
    for block in re.split(r"^### ", _section(text, DICT_SECTION), flags=re.M)[1:]:
        name, _, body = block.partition("\n")
        name = name.strip()
        got = {}
        for label, val in re.findall(r"^- \*\*(.+?):\*\* (.*)$", body, re.M):
            got[label] = val.strip()
        missing = [lb for lb in DICT_LABELS if lb not in got]
        if missing:
            errors.append("%s: no %s" % (name, ", ".join(missing)))
        if got.get("Group") not in GROUPS:
            errors.append("%s: group %r is not one of %s" % (name, got.get("Group"), ", ".join(GROUPS)))
        if got.get("Stage") not in STAGES:
            errors.append("%s: stage %r is not one of the register's stages" % (name, got.get("Stage")))
        ev = evidence_items(got.get("Evidence in the repo"))
        e = {"name": name}
        for label, key in DICT_LABELS.items():
            if key and key != "evidence":
                e[key] = got.get(label)
        e.update({"link": DICTIONARY_DOC + "#" + github_anchor(name), "evidence": ev,
                  "evidence_cited": [x for x in ev if cited(x)],
                  "repo_verifiable": any(not cited(x) for x in ev),
                  "evidence_missing": [x for x in ev if not evidence_ok(root, x)],
                  "unverified_claims": block.count(UNVERIFIED_MARK)})
        datasets.append(e)
    rows = []
    for line in _section(text, API_SECTION).splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")] if line.startswith("|") else []
        if len(cells) != 7 or cells[0] in ("API", "") or set(cells[0]) <= set("-: "):
            continue
        api, holder, needed, claimed, priority, evidence, note = cells
        ev = evidence_items(evidence)
        miss = [x for x in ev if not evidence_ok(root, x)]
        if claimed not in API_STATUSES:
            errors.append("API %s: status %r is not one of %s" % (api, claimed, ", ".join(API_STATUSES)))
        # A connection is a fact about the repo: it needs evidence outside the doc family. A plan may rest on the
        # register's line (a citation), the record that the plan exists.
        repo_ev = [x for x in ev if not cited(x)]
        held = bool(ev) and not miss and (bool(repo_ev) or claimed in ("planned", "not needed"))
        rows.append({"api": api, "holder": holder, "needed": needed,
                     "status": claimed if held else "unverified", "claimed": claimed,
                     "priority": priority.lower() == "priority", "evidence": ev,
                     "evidence_cited": [x for x in ev if cited(x)], "evidence_missing": miss, "note": note})
    by_status = {}
    for r in rows:
        by_status[r["status"]] = by_status.get(r["status"], 0) + 1
    dictionary = {"source": DICTIONARY_DOC, "flag": "internal", "errors": errors, "datasets": datasets}
    apis = {"source": DICTIONARY_DOC + "#" + github_anchor(API_SECTION[3:]), "flag": "internal",
            "connected": by_status.get("connected", 0), "total": len(rows), "by_status": by_status, "rows": rows}
    return dictionary, apis


def counts_only(block: dict) -> str | None:
    """Why a live block is not counts only, or None. Every college figure is an int or a boolean, a *_at stamp,
    or the college's COCI spellings; anything else (a row, a URL, a person's name) refuses the block."""
    if block.get("basis") != "live" or block.get("state") != "read" or not _STAMP.fullmatch(str(block.get("read_at") or "")):
        return "not a read live block (basis %r, state %r)" % (block.get("basis"), block.get("state"))
    cols = block.get("colleges")
    if not isinstance(cols, dict):
        return "no colleges"
    allowed = set(LIVE_GROUPS) | {"names"}
    for cid, e in cols.items():
        if not isinstance(e, dict) or set(e) - allowed:
            return "college %s carries %s" % (cid, sorted(set(e) - allowed) if isinstance(e, dict) else type(e).__name__)
        if not all(isinstance(n, str) for n in e.get("names") or []):
            return "college %s: names" % cid
        for g in LIVE_GROUPS:
            if not isinstance(e.get(g) or {}, dict):
                return "college %s: %s is not a group of counts" % (cid, g)
            for k, v in (e.get(g) or {}).items():
                if k.endswith("_at"):
                    ok = v is None or (isinstance(v, str) and len(v) <= 40)
                else:
                    ok = isinstance(v, (bool, int)) or v is None
                if not ok:
                    return "college %s: %s.%s is not a count" % (cid, g, k)
    return None


def live_block(live_path: str | None, previous: dict | None, universe: int | None = None,
               accept_active_shift: bool = False) -> dict:
    """The live key: a new read, or the previous committed block kept whole (fail soft). `accept_active_shift`
    (the census workflow's dispatch input of the same name, default false) takes, for that one run, a read whose
    only fault is its Active count (outside ACTIVE_BAND, or under ACTIVE_FLOOR with no previous block), so a real,
    lasting change in COCI cannot hold the block at "short read" forever (COBIx, 6857150335). It never takes a read
    short of the college floor, nor an empty one, and the block records that it was taken by override, with the two
    counts and the run id."""
    prev = previous if isinstance(previous, dict) and previous.get("basis") == "live" else dict(LIVE_NOT_READ)
    if not live_path:
        return prev
    try:
        new = _maybe(live_path)
    except ValueError:   # a half-written export
        new, cls = None, "other"
    else:
        cls = "not read" if new is None else None
    counts = None
    if new is not None and not isinstance(new, dict):
        new, cls = None, "other"
    if new is None:
        pass
    elif new.get("state") == "failed":
        cls = new.get("error_class") if new.get("error_class") in ERROR_CLASSES else "other"
    elif counts_only(new) is not None:
        print("the live export is not counts only: %s" % counts_only(new))   # the run's log, never the file
        cls = "not counts only"
    else:
        counts = short_read(new, prev, universe)
        if counts is not None:
            cls = "short read"
    override = None
    if cls == "short read" and accept_active_shift and counts["colleges"] > 0 and counts["coverage_ok"] \
            and counts["active"] > 0:
        override = {"accepted_by_override": "accept_active_shift", "active": counts["active"],
                    "previous_active": counts["previous_active"], "run_id": _run_id(new.get("run_id"))}
        print("::notice::the Commons live counts: a read outside the Active band was accepted by override "
              "(%d Active, previous %s, run %s)" % (counts["active"], counts["previous_active"], override["run_id"]))
        cls = None
    if cls is None:
        out = {"basis": "live", "state": "read"}
        out.update({k: v for k, v in new.items() if k not in ("schema", "state", "basis", "error", "error_class",
                                                              "http_status", "override")})
        out["run_id"] = _run_id(new.get("run_id"))
        out["override"] = override
        out["last_attempt"] = {"at": new["read_at"], "run_id": out["run_id"], "ok": True, "error_class": None,
                               "http_status": None, "counts": counts if override else None,
                               "accepted_by_override": bool(override)}
        out["flag"] = "internal"
        return out
    status = (new or {}).get("http_status")
    at = (new or {}).get("at")
    kept = dict(prev)
    kept["last_attempt"] = {"at": at if isinstance(at, str) and _STAMP.fullmatch(at) else iso_now(),
                            "run_id": _run_id((new or {}).get("run_id")), "ok": False, "error_class": cls,
                            "http_status": status if isinstance(status, int) else None, "counts": counts}
    return kept


# The builder's own last_attempt classes: the export's ERROR_CLASSES (kb/_commons_data_live.py) and its two of its
# own. No text from an export or an exception is ever copied into the status file (the review of #3232, finding 1).
ERROR_CLASSES = ("unauthorized", "upstream 5xx", "timeout", "bad header", "count moved", "short read",
                 "no service key", "other", "not read", "not counts only")
_STAMP = re.compile(r"\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ")

# The floors a read must clear to replace the previous block (the review of #3232, finding 2). The export takes
# its whole college universe from coci_college_programs, whose daily replace deletes the table and reloads it in
# chunks, each its own transaction; a stopped sync leaves it short, and stably so, until the next day, so the
# pager's before-and-after count agrees with itself and cannot see it. A read is kept as "read" only when:
#   colleges   it holds at least COLLEGE_SHARE of the crosswalk's colleges (90%: 107 of 118 today). COCI lists
#              programs at every college and campus on the crosswalk, so a full read holds nearly all of them; ten
#              percent leaves room for a college COCI lists under a spelling the crosswalk lacks (named in
#              "unmatched"), and a sync stopped after its first chunks holds far fewer;
#   Active     its Active program count is within ACTIVE_BAND of the previous good block's (85% to 125%). Programs
#              come and go by the dozen in a day, never by the thousand, so a drop past 15% is a short table; the
#              wider top allows a COCI catch-up load;
#   floor      with no previous good block, at least ACTIVE_FLOOR Active programs (15,000: the live census read
#              20,282 on 2026-11-13, #3215; 15,000 is about three quarters of it).
# Otherwise the previous block stays, and last_attempt records "short read" with the counts it saw. The band
# compares with the last GOOD block, so a real, lasting shift would hold the block at "short read" on every later
# run; a person accepts the new level with the census dispatch's accept_active_shift input (live_block), which takes
# that one read and records the override in the block, and never waives the college floor or an empty read.
COLLEGE_SHARE = 0.90
ACTIVE_BAND = (0.85, 1.25)
ACTIVE_FLOOR = 15000


def _run_id(v):
    return str(v) if v is not None and re.fullmatch(r"\d{1,20}", str(v)) else None


def _active(block: dict) -> int:
    return sum(int(((e or {}).get("programs") or {}).get("active") or 0) for e in (block.get("colleges") or {}).values())


def short_read(new: dict, prev: dict, universe: int | None) -> dict | None:
    """None when the read clears the floors; else the counts that failed them."""
    colleges, active = len(new.get("colleges") or {}), _active(new)
    prev_active = _active(prev) if prev.get("state") == "read" else None
    need = int(-(-COLLEGE_SHARE * universe // 1)) if universe else 1
    coverage_ok = colleges >= need
    if prev_active:
        active_ok = ACTIVE_BAND[0] * prev_active <= active <= ACTIVE_BAND[1] * prev_active
    else:
        active_ok = active >= ACTIVE_FLOOR
    if coverage_ok and active_ok:
        return None
    return {"colleges": colleges, "colleges_needed": need, "coverage_ok": coverage_ok, "active": active,
            "previous_active": prev_active, "active_ok": active_ok,
            "active_band": list(ACTIVE_BAND) if prev_active else None, "active_floor": None if prev_active else ACTIVE_FLOOR}


def _share(n, d) -> float:
    return 0.0 if not d or n is None else max(0.0, min(1.0, n / d))


def overall_block(live: dict) -> dict:
    """Each college's overall bar from the live counts (the rule is quoted in the module docstring)."""
    out = {"basis": "live", "state": live.get("state"), "read_at": live.get("read_at"), "rule": RULE["overall"],
           "flag": "shareable", "statewide": {"mean": None, "colleges": 0}, "colleges": {}}
    for cid, e in sorted((live.get("colleges") or {}).items(), key=lambda kv: (len(str(kv[0])), str(kv[0]))):
        p, r, pc, o, g = (e.get(k) or {} for k in LIVE_GROUPS)
        act = p.get("active")
        parts = {
            "catalog": round((int(bool(g.get("catalog_link"))) + int(bool(g.get("course_outline_link")))
                              + int(bool(g.get("sequence_checked")))) / 3, 4),
            "requirements": round(_share(r.get("active_passing"), act), 4),
            "slos": round(_share(o.get("slo_courses_on_active"), pc.get("active_courses")), 4),
            "plos": round(_share(r.get("active_with_plos"), act), 4),
        }
        val = (parts["catalog"] + parts["requirements"] + (parts["slos"] + parts["plos"]) / 2) / 3
        out["colleges"][str(cid)] = {"value": round(val, 4), "parts": parts}
    vals = [v["value"] for v in out["colleges"].values()]
    out["statewide"] = {"mean": round(sum(vals) / len(vals), 4) if vals else None, "colleges": len(vals)}
    return out


def build(root: str, live_path: str | None = None, previous: dict | None = None, accept_active_shift: bool = False) -> dict:
    cw_path = crosswalk_path(root)
    cw = load(root, os.path.relpath(cw_path, root))
    entities = [e for e in cw.get("colleges") or [] if e.get("entity_kind") in IN_SCOPE]
    resolve = Resolver(entities)
    unmatched = []

    harvested, census = harvest(root)
    by_id = {}
    for slug, h in harvested.items():
        cid = resolve(h["name"])
        if cid is None:
            unmatched.append({"file": COLLEGE_DIR + "/" + slug, "name": h["name"]})
            continue
        by_id[cid] = dict(h, slug=slug)

    sys.path.insert(0, os.path.join(root, "kb"))
    import _program_requirements_college as PC  # noqa: E402  (the harvest's one slug rule)
    slo = {}
    q = _maybe(os.path.join(root, SLO_QUEUE)) or {}
    slug_to_id = {h["slug"]: cid for cid, h in by_id.items()}
    for e in entities:
        slug_to_id.setdefault(PC.slug_of(e["college_name"]), e["college_id"])
        slug_to_id.setdefault(PC.slug_of(display_name(e["college_name"])), e["college_id"])
    for slug, v in (q.get("colleges") or {}).items():
        cid = slug_to_id.get(slug)
        if cid is None:
            unmatched.append({"file": SLO_QUEUE, "name": slug})
            continue
        slo[cid] = {"state": v.get("state"), "why": v.get("why"), "on": v.get("on")}

    scouts = {}
    for path in sorted(glob.glob(os.path.join(root, SCOUTS))):
        s = load(root, os.path.relpath(path, root))
        for c in s.get("colleges") or []:
            cid = resolve(c.get("college"))
            if cid is None:
                unmatched.append({"file": os.path.relpath(path, root), "name": c.get("college")})
                continue
            cu = c.get("catalog_url") if isinstance(c.get("catalog_url"), dict) else {}
            scouts[cid] = {"recommendation": c.get("recommendation"), "challenge": (c.get("access") or {}).get("challenge"),
                           "checked_at": c.get("checked_at"), "wave": s.get("wave"),
                           "platform": c.get("platform"), "catalog_year": cu.get("catalog_year"), "catalog_url": cu.get("found")}

    spot = read_spot_checks(root, resolve, unmatched)

    colleges = []
    for e in sorted(entities, key=lambda x: display_name(x["college_name"])):
        cid = e["college_id"]
        h = by_id.get(cid)
        colleges.append({
            "id": cid, "name": display_name(e["college_name"]), "district": e.get("district"),
            "kind": e.get("entity_kind"), "harvested": h is not None, "slug": h["slug"] if h else None,
            "programs": h["programs"] if h else None, "passing": h["passing"] if h else None,
            "gap": h["gap"] if h else None, "causes": h["causes"] if h else None,
            "read_at": h["read_at"] if h else None, "read_kind": h["read_kind"] if h else None,
            "cost_usd": h["cost_usd"] if h else None, "passed_at_read": h["passed_at_read"] if h else None,
            "slo_queue": slo.get(cid), "scout": scouts.get(cid), "spot_check": spot.get(cid),
            "confidence": confidence(spot.get(cid), h is not None),
            **slice2_fields(h),
        })

    hv = [c for c in colleges if c["harvested"]]
    costed = [c for c in hv if c["cost_usd"] is not None and c["passed_at_read"]]
    statewide = {
        "colleges": len(colleges),
        "continuing_education": sum(1 for c in colleges if c["kind"] == "continuing_education"),
        "districts": len({c["district"] for c in colleges if c["district"]}),
        "harvested": len(hv), "unread": len(colleges) - len(hv),
        "programs": sum(c["programs"] for c in hv), "passing": sum(c["passing"] for c in hv),
        "gap": sum(c["gap"] for c in hv), "with_gap": sum(1 for c in hv if c["gap"]),
        "cost_usd": round(sum(c["cost_usd"] for c in costed), 2),
        "passed_at_read": sum(c["passed_at_read"] for c in costed), "cost_receipts": len(costed),
        "slo_waiting": len(slo), "scouted": len(scouts),
        "scout_barrier": sum(1 for v in scouts.values() if (v.get("challenge") or "none") != "none" or v.get("recommendation") == "blocked"),
        "spot_checked": len(spot),
        "confidence": {lv: sum(1 for c in colleges if c["confidence"] and c["confidence"]["level"] == lv)
                       for lv in ("strong", "partial", "limited")},
    }
    if previous is None:
        previous = _maybe(os.path.join(root, OUT)) or {}
    live = live_block(live_path, previous.get("live"), len(entities), accept_active_shift)
    dictionary, apis = parse_dictionary(root)
    tba = dict(TBA if not spot else {k: v for k, v in TBA.items() if k != "confidence"}, **outcome_reasons(outcome_hosts(root)))
    if live.get("state") == "read":
        tba = {k: v for k, v in tba.items() if k not in ("overall", "teachout_approved")}
    return {
        "schema": SCHEMA,
        "written_at": iso_now(),
        "sources": {"universe": os.path.relpath(cw_path, root), "harvest": COLLEGE_DIR + "/<slug>/", "census": "kb/_harvest_gap_census.py (committed-files functions)",
                    "slo_queue": SLO_QUEUE, "scouts": SCOUTS, "spot_checks": SPOT_CHECKS, "spot_check_comments": SPOT_README},
        "rule": dict(RULE, causes=census_words()["causes"], levers=census_words()["levers"]), "fields": FIELDS,
        "tba": tba,
        "statewide": statewide,
        "census_check": {"universe": census["universe"], "passing": census["passing"], "gap": census["gap"]},
        "unmatched": unmatched,
        "colleges": colleges,
        "live": live,
        "overall": overall_block(live),
        "dictionary": dictionary,
        "apis": apis,
    }


def dumps(d: dict) -> str:
    return json.dumps(d, indent=1, ensure_ascii=False, sort_keys=False) + "\n"


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--root", default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    ap.add_argument("--out", default=None)
    ap.add_argument("--live", default=None, help="the live export (kb/_commons_data_live.py's out file); without it "
                                                  "the previous committed live block is kept")
    ap.add_argument("--accept-active-shift", action="store_true",
                    help="take, this once, a read whose only fault is its Active count (never one short of the "
                         "college floor, never an empty one); the block records the override")
    ap.add_argument("--check", action="store_true", help="exit 1 when the committed file differs (written_at aside)")
    ap.add_argument("--quiet", action="store_true")
    a = ap.parse_args(argv)
    d = build(a.root, a.live, accept_active_shift=a.accept_active_shift)
    out = a.out or os.path.join(a.root, OUT)
    if a.check:
        old = _maybe(out) or {}
        same = {k: v for k, v in old.items() if k != "written_at"} == json.loads(dumps({k: v for k, v in d.items() if k != "written_at"}))
        print("commons_data.json " + ("current" if same else "STALE: rerun kb/_build_commons_data_status.py"))
        return 0 if same else 1
    with open(out, "w", encoding="utf-8") as f:
        f.write(dumps(d))
    if not a.quiet:
        s = d["statewide"]
        print("%d colleges, %d harvested; %d of %d programs passing; %d unmatched names; live %s (%s); "
              "%d datasets, %d of %d APIs connected -> %s"
              % (s["colleges"], s["harvested"], s["passing"], s["programs"], len(d["unmatched"]), d["live"]["state"],
                 d["live"]["read_at"] or "no read", len(d["dictionary"]["datasets"]), d["apis"]["connected"],
                 d["apis"]["total"], os.path.relpath(out, a.root)))
    la = d["live"].get("last_attempt")
    if la and not la["ok"]:
        print("::warning::the Commons live counts were not taken (%s); the previous block stands" % la["error_class"])
    return 0


if __name__ == "__main__":
    sys.exit(main())

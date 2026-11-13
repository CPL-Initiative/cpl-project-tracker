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

Usage, from the repo root:
  python3 kb/_build_commons_data_status.py [--root DIR] [--out PATH] [--check] [--quiet]
Refresh: the harvest gap census workflow runs it after the census (fails soft). Guard:
tests/commons_data_status_build_test.py; the view's guard is tests/commons_data.test.js.
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
               "averaged). Catalog source, SLOs and PLOs per college are live tables, read in a later slice.",
    "teachout_approved": "Teachout and Approved programs are counted apart from Active in the live COCI table, "
                         "which this slice does not read.",
    "apis": "The API connection checklist (#3220) is not a committed file yet.",
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
    "loaded": "The load time and a person's confirmation are columns of the live program requirements table, which "
              "this file does not carry.",
    "owners": "The gap census names the change that would move each program, not who makes it; an owner joins each "
              "ask when the asks are filed with one.",
}

RULE = {
    "basis": "committed files only: the programs each college's capture listed (the gap census's committed universe)",
    "passing": "coverage and invented true, arithmetic equal or unstated (the Program Requirements tab's own test)",
    "overall": "catalog source + program requirements passing + (SLOs + PLOs) / 2, divided by 3 (the whole-harvest "
               "rule); TBA until the three parts are read per college",
    "confidence": "strong = 5 or more spot-checked records at the college, all agreeing; partial = 5 or more "
                  "checked with one differing, or 5 agree beside an unreachable page; limited = machine checks only, "
                  "fewer than 5 checked whatever they found (a cross-college check), or 2 or more differ (display "
                  "held). An unreachable page is not a checked record; the newest receipt by checked_at counts, and "
                  "on a tie the receipt with the later source comment (kb/spot_checks/README.md)",
    "age_days": AGE_DAYS,
}


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


def build(root: str) -> dict:
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
    return {
        "schema": SCHEMA,
        "written_at": iso_now(),
        "sources": {"universe": os.path.relpath(cw_path, root), "harvest": COLLEGE_DIR + "/<slug>/", "census": "kb/_harvest_gap_census.py (committed-files functions)",
                    "slo_queue": SLO_QUEUE, "scouts": SCOUTS, "spot_checks": SPOT_CHECKS, "spot_check_comments": SPOT_README},
        "rule": dict(RULE, causes=census_words()["causes"], levers=census_words()["levers"]), "fields": FIELDS,
        "tba": dict(TBA if not spot else {k: v for k, v in TBA.items() if k != "confidence"}, **outcome_reasons(outcome_hosts(root))),
        "statewide": statewide,
        "census_check": {"universe": census["universe"], "passing": census["passing"], "gap": census["gap"]},
        "unmatched": unmatched,
        "colleges": colleges,
    }


def dumps(d: dict) -> str:
    return json.dumps(d, indent=1, ensure_ascii=False, sort_keys=False) + "\n"


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--root", default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    ap.add_argument("--out", default=None)
    ap.add_argument("--check", action="store_true", help="exit 1 when the committed file differs (written_at aside)")
    ap.add_argument("--quiet", action="store_true")
    a = ap.parse_args(argv)
    d = build(a.root)
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
        print("%d colleges, %d harvested; %d of %d programs passing; %d unmatched names -> %s"
              % (s["colleges"], s["harvested"], s["passing"], s["programs"], len(d["unmatched"]), os.path.relpath(out, a.root)))
    return 0


if __name__ == "__main__":
    sys.exit(main())

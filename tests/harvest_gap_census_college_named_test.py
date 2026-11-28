#!/usr/bin/env python3
"""S748: the gap census reads a college's own named-gap files (f-census-ignores-college-named-gaps-s727).

WHY. Since S714 a program held for a person with no record is collected as a named gap in its college's own file
(kb/program_requirements_college/<slug>/named_gaps_*.json: its reason and note, no live row, no write). The census
counts a row collected with a gap only by checks.gaps on its live row, so every such program stayed among the active
programs with no passing record and each fresh census relisted it for a read that had already been made (Napa
Valley's three under paid_read, found_not_extracted). kb/_harvest_gap_census.py now reads those files
(college_named_gaps) and main() hands them to census(), which collects each by its reason, marked college_named.

Pinned here:
  * the loader on the committed files: one key a (college, control number), each reason a key of its own file's
    reasons; a later file's entry stands over an earlier one's; a file that names no college, an entry with no
    control number and an entry whose reason the file does not define are left out;
  * one relisted program moves: Napa Valley 19126, which the committed census lists with no passing record, is
    collected with a named gap (no_own_page_found) once the files are read, and counted so by name;
  * what comes first: a passing live row stays passing, and a discontinued flag stays a flag, though a file names
    the program; a row collected by its own checks.gaps keeps those gaps;
  * a caller that hands in no files reads exactly as before (the Commons builder's call);
  * the statewide count, on the committed census's own list of programs with no passing record: every one of them
    stays in the gap without the files, and with them the gap falls by exactly the programs a file names, each
    listed under collected_with_gaps with college_named.

Run from repo root: python3 tests/harvest_gap_census_college_named_test.py
"""
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _harvest_gap_census as G  # noqa: E402

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)
        print("FAIL: " + msg)


NAPA, CN, REASON = "Napa Valley College", "19126", "no_own_page_found"

# ── the loader ────────────────────────────────────────────────────────────
named = G.college_named_gaps()
check(len(named) >= 70 and named.get((NAPA, CN)) == REASON,
      "the committed files name %d programs, Napa Valley 19126 among them under %s" % (len(named), REASON))
check(all(isinstance(k, tuple) and len(k) == 2 and k[1] == G.norm_cn(k[1]) and v for k, v in named.items()),
      "each key is a college and a control number, each value a reason")
with tempfile.TemporaryDirectory() as base:
    def put(slug, name, body):
        os.makedirs(os.path.join(base, slug), exist_ok=True)
        with open(os.path.join(base, slug, name), "w", encoding="utf-8") as fh:
            fh.write(body if isinstance(body, str) else json.dumps(body))
    put("a", "named_gaps_s1.json", {"college": "A College", "reasons": {"r1": "one", "r2": "two"},
                                    "programs": [{"control_number": "00001", "reason": "r1"},
                                                 {"control_number": "00002", "reason": "r1"},
                                                 {"control_number": "00003", "reason": "nowhere"},
                                                 {"reason": "r1"}, "a string"]})
    put("a", "named_gaps_s2.json", {"college": "A College", "reasons": {"r2": "two"},
                                    "programs": [{"control_number": "00002", "reason": "r2"}]})
    put("b", "named_gaps_s1.json", {"reasons": {"r1": "one"}, "programs": [{"control_number": "00009", "reason": "r1"}]})
    put("c", "named_gaps_s1.json", "{ not json")
    put("d", "other.json", {"college": "D College", "reasons": {"r1": "one"},
                            "programs": [{"control_number": "00008", "reason": "r1"}]})
    got = G.college_named_gaps(base)
check(got == {("A College", "00001"): "r1", ("A College", "00002"): "r2"},
      "the later file stands; no college, no control number, an undefined reason, a broken file and another file "
      "name are left out (%r)" % got)

# ── one relisted program moves ────────────────────────────────────────────
with open(os.path.join(ROOT, "kb", "status", "harvest_gap_census.json"), encoding="utf-8") as fh:
    filed = json.load(fh)
committed = G.read_committed()
one = [{"college": NAPA, "control_number": CN}]
before = G.census(one, committed, {}, {})
after = G.census(one, committed, {}, {}, college_named=named)
check((before["gap"], before["collected_with_gaps"]["programs"]) == (1, 0),
      "without the files Napa Valley 19126 is a program with no passing record")
check((after["gap"], after["passing"], after["collected_with_gaps"]["programs"],
       after["collected_with_gaps"]["college_named"]) == (0, 0, 1, 1)
      and after["collected_with_gaps"]["members"] == [{"college": NAPA, "control_number": CN, "gaps": [REASON],
                                                       "college_named": True}]
      and after["collected_with_gaps"]["by_gap"] == {REASON: 1},
      "with them it is collected with a named gap, %s, marked college_named" % REASON)
check(after["universe"] == after["passing"] + after["gap"] + after["collected_with_gaps"]["programs"]
      + after["discontinued"]["programs"], "the universe still adds up")
if filed.get("written_at") == "2026-11-28 00:44Z":
    check((filed["programs_by_college"].get(NAPA) or {}).get(CN) == "found_not_extracted",
          "the census of 00:44Z relists it under found_not_extracted")

# ── what comes first ──────────────────────────────────────────────────────
passing = {CN: {"college": NAPA, "control_number": CN,
                "checks": {"coverage": True, "invented": True, "arithmetic": "equal"}}}
r = G.census(one, committed, passing, {}, college_named=named)
check((r["passing"], r["gap"], r["collected_with_gaps"]["programs"]) == (1, 0, 0), "a passing live row stays passing")
gapped = {CN: {"college": NAPA, "control_number": CN,
               "checks": {"coverage": True, "invented": True, "arithmetic": "unequal", "gaps": ["total_differs"]}}}
r = G.census(one, committed, gapped, {}, college_named=named)
check(r["collected_with_gaps"]["members"] == [{"college": NAPA, "control_number": CN, "gaps": ["total_differs"]}]
      and r["collected_with_gaps"]["college_named"] == 0, "a row collected by its own checks.gaps keeps those gaps")
r = G.census(one, committed, {}, {}, discontinued={(NAPA, CN): {"how": "test", "source_line": "x"}}, college_named=named)
check((r["discontinued"]["programs"], r["collected_with_gaps"]["programs"], r["gap"]) == (1, 0, 0),
      "a discontinued flag stays a flag")

# ── a caller that hands in no files ───────────────────────────────────────
check(G.census(one, committed, {}, {}) == G.census(one, committed, {}, {}, college_named=None)
      == G.census(one, committed, {}, {}, college_named={}), "no files handed in: the census reads as before")

# ── the statewide count ───────────────────────────────────────────────────
universe = [{"college": c, "control_number": cn} for c, progs in sorted(filed["programs_by_college"].items())
            for cn in sorted(progs)]
check(len(universe) == filed["gap"], "the committed census lists %d programs with no passing record" % filed["gap"])
relisted = sorted(k for k in named if (filed["programs_by_college"].get(k[0]) or {}).get(k[1]))
state_before = G.census(universe, committed, {}, {})
state_after = G.census(universe, committed, {}, {}, college_named=named)
check(state_before["gap"] == len(universe) and state_before["collected_with_gaps"]["programs"] == 0,
      "without the files each of them stays in the gap (%d)" % state_before["gap"])
check(state_after["gap"] == len(universe) - len(relisted)
      and state_after["collected_with_gaps"]["college_named"] == len(relisted) >= 1
      and sorted((m["college"], m["control_number"]) for m in state_after["collected_with_gaps"]["members"]) == relisted,
      "with them the gap falls by the %d programs a file names (%d to %d)"
      % (len(relisted), state_before["gap"], state_after["gap"]))
if filed.get("written_at") == "2026-11-28 00:44Z":
    check((len(universe), len(relisted), state_after["gap"]) == (3927, 78, 3849),
          "the census of 00:44Z: 3,927 with no passing record, 78 of them college-named, 3,849 after (%d, %d, %d)"
          % (len(universe), len(relisted), state_after["gap"]))

print("statewide: %d with no passing record, %d college-named, %d after"
      % (len(universe), len(relisted), state_after["gap"]))
print("%d checks, %d failures" % (checks[0], len(failures)))
sys.exit(1 if failures else 0)

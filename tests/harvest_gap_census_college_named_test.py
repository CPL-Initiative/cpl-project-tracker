#!/usr/bin/env python3
"""The gap census reads a college's own named-gap files, with its reader's three fixes (S748's change, redone in S750;
f-census-ignores-college-named-gaps-s727).

WHY. Since S714 a program held for a person with no record is filed as a named gap in its college's own file
(kb/program_requirements_college/<slug>/named_gaps_*.json: its reason and note, no live row, no write). The census
knew nothing of those files, so each fresh census relisted the program for a read that had already been made. S748's
first change moved each such program out of the gap as collected; its second reader stopped it (none of the 78 had a
live row or checks.gaps, so the Commons would have counted 78 more programs as passing than the table holds). The
three fixes, each pinned here so that removing it turns this test red:

  1. A named program STAYS IN THE GAP under its own cause, sub-cause and lever, with a label (college_named: its
     reason). Passing, the gap and collected-with-gaps count exactly as they do without the files.
  2. The label is given only where NO LIVE ROW exists: a failing live row a file names takes none, and on the
     committed files alone a failing filed record whose live state is unknown takes none.
  3. main() hands the files in: a run on the committed files writes the labels to the census's own JSON and page.

Also pinned: the loader on the committed files and on made-up ones; a passing row, a discontinued flag and a row
collected by its own checks.gaps come first; a caller that hands in no files (the Commons data build) reads exactly
as before, with no new key; a labeled program is left out of the next wave's count, and its lever says so.

Run from repo root: python3 tests/harvest_gap_census_college_named_test.py
"""
import contextlib
import io
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
    put("e", "named_gaps_s1.json", ["a list"])
    got = G.college_named_gaps(base)
check(got == {("A College", "00001"): "r1", ("A College", "00002"): "r2"},
      "the later file stands; no college, no control number, an undefined reason, a broken file, a list and another "
      "file name are left out (%r)" % got)


def counts(r):
    return (r["universe"], r["passing"], r["gap"], r["collected_with_gaps"]["programs"], r["discontinued"]["programs"])


# ── fix 1: a named program stays in the gap under its own cause ───────────
committed = G.read_committed()
one = [{"college": NAPA, "control_number": CN}]
before = G.census(one, committed, {}, {})
after = G.census(one, committed, {}, {}, college_named=named)
b, a = before["programs"][0], (after["programs"] or [{}])[0]
check(counts(before) == counts(after) == (1, 0, 1, 0, 0),
      "Napa Valley 19126 is a program with no passing record with the files and without: %s, %s" % (counts(before), counts(after)))
check(a == dict(b, college_named=REASON) and "college_named" not in b and b["cause"] in G.CAUSE_IDS,
      "with the files it keeps its cause (%s), sub-cause and lever (%s), and gains the label alone" % (b["cause"], b["lever"]))
check(after["statewide_by_cause"] == before["statewide_by_cause"] and after["per_college"] == before["per_college"]
      and json.loads(G.dumps(after))["programs_by_college"] == json.loads(G.dumps(before))["programs_by_college"],
      "the causes by college, and the committed file's list of programs, are the same")
check(after["collected_with_gaps"] == before["collected_with_gaps"] and after["collected_with_gaps"]["members"] == [],
      "it is not counted as collected with a gap")
check(after["college_named_gaps"]["programs"] == 1 and after["college_named_gaps"]["members"] == [[NAPA, CN, REASON]]
      and after["college_named_gaps"]["by_reason"] == {REASON: 1} and after["college_named_gaps"]["by_cause"] == {b["cause"]: 1},
      "the census lists it by name, reason and cause")
lev_b = next(x for x in before["levers"] if CN in x["members"])
lev_a = next(x for x in after["levers"] if CN in x["members"])
check({k: v for k, v in lev_a.items() if k != "college_named"} == lev_b and lev_a.get("college_named") == 1
      and "college_named" not in lev_b, "its lever keeps its members and estimate, and says one of them is a named gap")
if b["lever"] in ("first_read", "paid_read", "capture_and_read", "reader_page_assignment", "capture_rerun_closed_list_now_filed"):
    check(sum(w["programs"] for w in before["next_wave"]) == 1 and after["next_wave"] == [],
          "the next wave counts it without the files and leaves it out with them: a read already made")
check("named as a gap in their college's own file" in G.render_md(dict(after, written_at="x"), "x")
      and "named as a gap in their college's own file" not in G.render_md(dict(before, written_at="x"), "x"),
      "the census's page says so in one line")

# ── what comes first ──────────────────────────────────────────────────────
passing = {CN: {"college": NAPA, "control_number": CN,
                "checks": {"coverage": True, "invented": True, "arithmetic": "equal"}}}
r = G.census(one, committed, passing, {}, college_named=named)
check(counts(r) == (1, 1, 0, 0, 0) and r["college_named_gaps"]["programs"] == 0, "a passing live row stays passing")
gapped = {CN: {"college": NAPA, "control_number": CN,
               "checks": {"coverage": True, "invented": True, "arithmetic": "unequal", "gaps": ["total_differs"]}}}
r = G.census(one, committed, gapped, {}, college_named=named)
check(r["collected_with_gaps"]["members"] == [{"college": NAPA, "control_number": CN, "gaps": ["total_differs"]}]
      and r["college_named_gaps"]["programs"] == 0, "a row collected by its own checks.gaps keeps those gaps")
r = G.census(one, committed, {}, {}, discontinued={(NAPA, CN): {"how": "test", "source_line": "x"}}, college_named=named)
check(counts(r) == (1, 0, 0, 0, 1) and r["college_named_gaps"]["programs"] == 0, "a discontinued flag stays a flag")

# ── fix 2: only where no live row exists ──────────────────────────────────
failing = {CN: {"college": NAPA, "control_number": CN,
                "checks": {"coverage": False, "invented": True, "arithmetic": "equal"}}}
r = G.census(one, committed, failing, {}, college_named=named)
check(counts(r) == (1, 0, 1, 0, 0) and "college_named" not in r["programs"][0] and r["programs"][0]["cause"] == "coverage_fails"
      and r["college_named_gaps"]["programs"] == 0 and all("college_named" not in x for x in r["levers"]),
      "a failing live row a file names takes no label: its own checks decide it")
key = {(NAPA, CN): REASON}
check(G.college_named_reason(key, (NAPA,), CN, None, "found_not_extracted", None) == REASON
      and G.college_named_reason(key, ("Another", NAPA), CN, None, "places_none", None) == REASON
      and G.college_named_reason(key, (NAPA,), CN, None, "parked_college", "places_none") == REASON,
      "with no live row the label is the file's reason, under either name of the college, parked or not")
check(G.college_named_reason(key, (NAPA,), CN, {"checks": {}}, "coverage_fails", None) is None
      and G.college_named_reason(key, (NAPA,), CN, None, "unknown_without_live", "coverage_fails") is None
      and G.college_named_reason(key, (NAPA,), CN, None, "parked_college", "unknown_without_live:coverage_fails") is None
      and G.college_named_reason(key, (NAPA,), "00000", None, "places_none", None) is None
      and G.college_named_reason(None, (NAPA,), CN, None, "places_none", None) is None,
      "no label on a live row, on a filed record whose live state is unknown (parked or not), on a program no file "
      "names, or with no files")

# ── a caller that hands in no files ───────────────────────────────────────
check(G.census(one, committed, {}, {}) == G.census(one, committed, {}, {}, college_named=None)
      and "college_named_gaps" not in before and G.dumps(before) == G.dumps(G.census(one, committed, {}, {}, college_named=None)),
      "no files handed in: the census reads as before, with no new key (the Commons data build's call)")
check(G.census(one, committed, {}, {}, college_named={})["college_named_gaps"]["programs"] == 0,
      "an empty hand-in labels none")

# ── the statewide count, on the committed census's own list ───────────────
with open(os.path.join(ROOT, "kb", "status", "harvest_gap_census.json"), encoding="utf-8") as fh:
    filed = json.load(fh)
universe = [{"college": c, "control_number": cn} for c, progs in sorted(filed["programs_by_college"].items())
            for cn in sorted(progs)]
check(len(universe) == filed["gap"], "the committed census lists %d programs with no passing record" % filed["gap"])
relisted = sorted(k for k in named if (filed["programs_by_college"].get(k[0]) or {}).get(k[1]))
state_before = G.census(universe, committed, {}, {})
state_after = G.census(universe, committed, {}, {}, college_named=named)
check(counts(state_before) == counts(state_after) == (len(universe), 0, len(universe), 0, 0),
      "with the files and without, every one of them stays in the gap: %s, %s" % (counts(state_before), counts(state_after)))
check(state_after["statewide_by_cause"] == state_before["statewide_by_cause"]
      and [dict(g, college_named=None) for g in state_after["programs"]] == [dict(g, college_named=None) for g in state_before["programs"]],
      "each keeps its cause, sub-cause and lever")
check(sorted((m[0], m[1]) for m in state_after["college_named_gaps"]["members"]) == relisted and len(relisted) >= 70
      and sum(x.get("college_named", 0) for x in state_after["levers"]) == len(relisted)
      and sum(state_after["college_named_gaps"]["by_cause"].values()) == len(relisted),
      "the labeled programs are exactly those a file names (%d), counted once on their levers and once by cause"
      % len(relisted))
check(sum(w["programs"] for w in state_before["next_wave"]) >= sum(w["programs"] for w in state_after["next_wave"]),
      "the next wave counts no more programs with the files than without")

# ── fix 3: main() hands the files in ──────────────────────────────────────
with tempfile.TemporaryDirectory() as out:
    j, m = os.path.join(out, "census.json"), os.path.join(out, "census.md")
    with contextlib.redirect_stdout(io.StringIO()):
        rc = G.main(["--committed-only", "--json", j, "--md", m, "--when", "test"])
    with open(j, encoding="utf-8") as fh:
        written = json.load(fh)
    with open(m, encoding="utf-8") as fh:
        page = fh.read()
want = G.census(G.universe_from_committed(committed), committed, None, {}, None, outside={}, discontinued=G.D.keys(),
                college_named=named)
bare = G.census(G.universe_from_committed(committed), committed, None, {}, None, outside={}, discontinued=G.D.keys())
check(rc == 0 and written.get("college_named_gaps") == want["college_named_gaps"]
      and written["college_named_gaps"]["programs"] >= 1 and "named as a gap in their college's own file" in page,
      "a run of main() on the committed files writes the labels (%d) to the census's JSON and page"
      % (written.get("college_named_gaps") or {}).get("programs", -1))
check((written["passing"], written["gap"], written["collected_with_gaps"]["programs"])
      == (bare["passing"], bare["gap"], bare["collected_with_gaps"]["programs"]),
      "and its passing, gap and collected counts are those of a run with no files")

print("statewide, on the committed census's own list: %d with no passing record with the files and without; "
      "%d of them labeled (%s)" % (len(universe), len(relisted), state_after["college_named_gaps"]["by_cause"]))
print("%d checks, %d failures" % (checks[0], len(failures)))
sys.exit(1 if failures else 0)

#!/usr/bin/env python3
"""S714, lane 2's cheap piles at East Los Angeles College: five free readings, a named gap, and their plan.

The census (kb/status/harvest_gap_census.json, run 45161770730) lists 24 East Los Angeles programs under the
reconcile_steps lever. Each is read by hand below (HAND_HELD) against the 2026-2027 General Catalog PDF as two free
page reads printed it (college-page-read 45173124249, the 16 degrees, and 45173349853, the rest); each record's own
section, from its plan line to the next program's, is committed as tests/fixtures/ela_s714_sections.json.

READING 1, THE PLAN LINE (kb/_program_requirements_reconcile.py own_heading_end). The PDF prints every program's
title and then its plan line, "Associate in Arts in · Journalism for Transfer · (Academic Plan E032980G)". Where the
capture opened on the plan line, the reader completed the heading from the description ("Associate in Arts in
Journalism for Transfer Degree (Academic Plan E032980G)"), which the text never prints whole, so S644's electives
sentence (COMPLETE ADDITIONAL CSU UNITS, IF NEEDED, TO REACH 60 CSU TRANSFERABLE UNITS) was never filed and the
scorer's electives guard failed the degree. A heading ending in its plan line reads from that line.

READING 2, DOUBLE COUNTING (the college's ge_overlap step). A local degree's own section prints "Note: 9 units of
major courses may be double counted in LACCD General Education Areas 3, 4b, and 5": the overlap College of the
Redwoods, Las Positas and Hartnell file the same way.

READING 3, THE HIGH-UNIT WAIVER (the college's ge_units step with was). "The following LACCD GE Area 4a (3 units)
and Area 7 (3 units) are waived for this degree": the LACCD plan's 27 units come to 21 (22 + 17 + 21 = 60). Never
"Student may choose to waive either", and only where the section prints no double counting.

READING 4, A COURSE TAKEN TWICE (the college's repeat step). "COMPLETE THE FOLLOWING COURSE TWICE 4" over TECTHTR 348
(2 units).

READING 5, TWO PRINTED CODES (the college's course_renumbers). BRDSCTG 015 (a transposed prefix of BRDCSTG 15) and
ESL NC 045 (the file's ESL NC 45CE).

THE NAMED GAP. Recording and Sound Design 45602 prints ten courses that add to 27 under "Total 24":
kb/program_total_differs.json lists it, and the record takes total_differs.

The free reconcile run (program-requirements-college.yml, step=reconcile, extract=0) RUN filed the readings on the
branch; the plan compares each record's load image at BASE (main) with the branch's and writes only rows whose
verdict moves (d-plan-rows-change-a-verdict-s713), full-row (record, checks, run), guarded as S713's general
education steps are (kb/_program_ge_plan_s713.py).

THE SELF-RECALL (p-self-recall-reads-rule-fields-s703): the held answer is the hand reading; each reading runs on
the record as filed at BASE and its committed section; the claim check reads the record's notes, the reader's own
words, apart from the fields the readings read (sources.json, today's capture, holds no page text:
p-claim-check-reads-current-capture-s713); boundary readings move one word or figure across each edge.

    python3 kb/_program_piles_s714_ela.py --dry-run   # the counts and the self-recall; writes nothing
    python3 kb/_program_piles_s714_ela.py --tag s714e # the receipt and the migration files

Guard: tests/program_piles_s714_ela_test.py.
"""
from __future__ import annotations

import argparse
import collections
import copy
import json
import os
import re
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _program_ge_plan_s713 as GP  # noqa: E402
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s713 as P  # noqa: E402
import _program_requirements_reconcile as R  # noqa: E402
import _program_requirements_score as S  # noqa: E402

ROOT = os.path.dirname(HERE)
COLLEGE = "East Los Angeles College"
SLUG = "east_los_angeles"
LEVER = "reconcile_steps"
CENSUS = NG.CENSUS
BASE = "3cc69ffc2ef439edc63daa3eef843ee8bed8c67d"   # main when the branch left it
RUN = "45176404274"                                 # the free reconcile run that filed the readings
FIXTURE = os.path.join(ROOT, "tests", "fixtures", "ela_s714_sections.json")
PAGE_READS = {"degrees": "45173124249", "the rest": "45173349853"}

ELEC = "passes: the electives sentence after its own plan line (own_heading_end)"
OVER = "passes: its own section prints double counting (ge_overlap)"
WAIVE = "passes: its own section waives LACCD GE Areas 4a and 7 (ge_units 21)"
TWICE = "passes: TECTHTR 348 is completed twice (repeat)"
REN = "passes: the printed code is the file's row (course_renumbers)"
GAP = "gap total_differs: the page's courses add to 27 under 'Total 24'"
NESTED = ("held: the major prints '%s' as one line with no courses, the record leaves it out, and electives would "
          "fill the units it lost; held from the electives sentence by name until the record carries the line")
HAND_HELD = {
    "32902": ELEC, "32980": ELEC, "33382": ELEC, "37923": ELEC, "37956": ELEC, "42672": ELEC,
    "35309": OVER, "37965": OVER, "37969": OVER, "46461": OVER,
    "21174": WAIVE, "32193": WAIVE,
    "14869": TWICE,
    "44624": REN,
    "45602": GAP,
    "02430": NESTED % "Skills Certificate in Architectural Design . .12 (inside the Certificate of Achievement's 21)",
    "08252": NESTED % "Certificate of Achievement in Architectural Technology . . . 22",
    "21157": ("held: 'Skills Certificate in Architectural Technology . . . 14' prints as one line whose courses sit in "
              "the skills certificate's own section; the record keeps it as an empty block stated 14, which the "
              "scorer adds as nothing (8 against 22): a nested-certificate step"),
    "02456": ("held: the core prints 'Completion of Intermediate Algebra or its equivalent or higher Math course "
              "....3-5' with no course, which the record leaves out (45 against 48-50); unit_line reads one figure, "
              "not a range"),
    "31017": ("held: the movement-based list prints '(minimum 3 units) Select a maximum of one (1) course from any "
              "three (3) of the following areas' and the record reads three courses at up to 4 units each, so the "
              "major reads 20-33 against the printed 20-27 and the degree 54-67 against 60: a reread of that list"),
    "33013": ("held: the page's own figures (Subtotal 9-10, List A 3, List B 6, List C 3-4) add to 21-23 under "
              "'TOTAL UNITS FOR MAJOR: 22-24', and the record reads 21-24: for a person"),
    "41231": ("held: the record's low end reads 39 against 'CHOOSE OPTION 1 OR OPTION 2 AND ALL COURSES LISTED BELOW "
              "41-45' (a sequence read one course short): a reread"),
    "38168": ("held: the last list's heading prints 'COMPLETE FOUR UNITS FROM THE FOLLOWING' over the figure 2-3, a "
              "misprint the reader's note names; the lists add to 17-19 as read against 19-20: for a person"),
    "37510": ("held: ESL NC 045 renames to the file's ESL NC 45CE (course_renumbers), so coverage and invented "
              "pass; the arithmetic reads 'unstated' (the page prints 0 units for each noncredit course and no "
              "hours). program_record_machine_pass and the Commons count 'unstated' as passing, so the committed "
              "record passes there once posted; this plan's verdict is S.passes_live (arithmetic 'equal'), which it "
              "does not reach, so it takes no row here and the college's next reread posts its committed record"),
}
# Records the reconcile run restamped with no reading (its fresh score re-laid a ruling-1 rescore: the program check
# first and the degree nested, where Sam's 2026-11-17 local-overlap rescore wrote the degree first with the major
# nested), both passing before and after: put back as main filed them, so the ruling's marker keeps its own layout
# (tests/program_requirements_rulings_2026_11_17_test.py reads the major there) and no row moves.
REVERTED_TO_BASE = {
    "39823": "restamped by the reconcile run, no reading; a ruling-1 rescore's layout; passes before and after",
    "40042": "restamped by the reconcile run, no reading; a ruling-1 rescore's layout; passes before and after",
}
READING_OF = {ELEC: "plan_line", OVER: "ge_overlap", WAIVE: "ge_waiver", TWICE: "repeat", REN: "course_renumbers",
              GAP: "total_differs"}


# ── the records ───────────────────────────────────────────────────────────
def census_members(path: str = CENSUS) -> list[str]:
    with open(path, encoding="utf-8") as fh:
        d = json.load(fh)
    for lv in d.get("levers") or []:
        if lv.get("lever") == LEVER and lv.get("scope") == COLLEGE:
            return list(lv.get("members") or [])
    return []


def _rel(cn: str) -> str:
    return "kb/program_requirements_college/%s/records/%s.json" % (SLUG, cn)


def at_base(cn: str) -> dict:
    """The record as main filed it at BASE (before the reconcile run), kept in the fixture beside its section so the
    self-recall needs no git history (CI's checkout is shallow)."""
    return copy.deepcopy(sections()[cn]["filed"])


def now(cn: str) -> dict:
    with open(os.path.join(ROOT, _rel(cn)), encoding="utf-8") as fh:
        return json.load(fh)


_SECTIONS: dict = {}


def sections(path: str = FIXTURE) -> dict:
    if path not in _SECTIONS:
        with open(path, encoding="utf-8") as fh:
            _SECTIONS[path] = json.load(fh)["sections"]
    return _SECTIONS[path]


def hand_answer(cn: str) -> str:
    w = HAND_HELD.get(cn, "")
    return "passes" if w.startswith("passes") else "gap" if w.startswith("gap") else "none"


def reading_of(cn: str) -> str | None:
    return READING_OF.get(HAND_HELD.get(cn, ""))


# ── one record under the readings, on its committed section ───────────────
def renumbers(steps: dict | None = None) -> dict:
    table = R.prefix_aliases(COLLEGE, steps) or {}
    return {S.norm_code(k): S.norm_code(v) for k, v in table.items() if re.search(r"\d", k)}


def read(filed: dict, text: str, steps: dict | None = None, total_differs: dict | None = None) -> dict:
    """{"answer", "notes", "score"}: the record as filed, reconciled on its section text by the college's steps
    (steps: a stand-in config for a boundary), its arithmetic rescored on that text, its codes renamed by the
    college's course_renumbers over the filed coverage, and the named gap judged where it still fails."""
    cn = str(filed["control_number"])
    new, notes = R.reconcile(filed["record"], text, COLLEGE, filed.get("award"), steps=steps, control_number=cn,
                             title=filed.get("title"))
    sc = copy.deepcopy(filed.get("score") or {})
    sc["arithmetic"] = S.score(new, [], text, filed.get("award"), R.prefix_aliases(COLLEGE, steps))["arithmetic"]
    table = renumbers(steps)
    rn = P.rescore_common_numbers(dict(filed, record=new, score=sc), name_of=lambda c: table.get(S.norm_code(c)),
                                  key="course_renumbers")
    if rn and rn["exact"]:
        sc = rn["score"]
    answer = "passes" if S.passes_live(sc) else "none"
    if answer == "none":
        listed = NG.total_differs_list() if total_differs is None else total_differs
        if NG.total_differs(dict(filed, record=new, score=sc), listed):
            answer = "gap"
    return {"answer": answer, "notes": [n["field"] for n in notes], "score": sc, "record": new}


def precision(census_path: str = CENSUS) -> dict:
    out = {"read": 0, "right": 0, "wrong": 0, "not_hand_held": 0, "no_section": 0,
           "by_answer": collections.Counter(), "wrong_keys": []}
    secs = sections()
    for cn in census_members(census_path):
        if cn not in HAND_HELD:
            out["not_hand_held"] += 1
            continue
        if cn not in secs:
            out["no_section"] += 1
            continue
        got, truth = read(at_base(cn), secs[cn]["text"])["answer"], hand_answer(cn)
        out["read"] += 1
        out["by_answer"][truth] += 1
        if got == truth:
            out["right"] += 1
        else:
            out["wrong"] += 1
            out["wrong_keys"].append({"control_number": cn, "hand": truth, "rule": got})
    out["by_answer"] = dict(out["by_answer"])
    out["held_by_name"] = held_by_name()
    return out


def held_by_name() -> dict:
    """The records the electives step holds by name (its hold), read with the hold lifted: the plan-line reading
    alone passes each one, which the hand holds (the record leaves out a nested certificate's line)."""
    def lift(conf):
        for st in conf["steps"]:
            st.pop("hold", None)
    steps, secs, out = _steps_with(lift), sections(), {}
    for st in R.load_steps()[COLLEGE]["steps"]:
        for cn in st.get("hold") or {}:
            out[cn] = {"without_the_hold": read(at_base(cn), secs[cn]["text"], steps=steps)["answer"],
                       "hand": hand_answer(cn)}
    return out


def plan_line_anchor() -> dict:
    """For each plan-line row, whether its section prints the reader's heading whole (main's _heading_end finds it,
    so main's code reads the sentence too) or only its plan line (own_heading_end's anchor is what moves it)."""
    out = {}
    for cn, w in HAND_HELD.items():
        if w != ELEC:
            continue
        f, t = at_base(cn), sections()[cn]["text"]
        h = f["record"]["program"].get("section_heading")
        out[cn] = "heading prints whole (main passes it too)" if R._heading_end(t, h) is not None \
            else "plan line only (the anchor moves it)"
    return out


# ── the claim checks: the reader's notes, apart from the fields the readings read ──
CLAIMS = {
    "plan_line": re.compile(r"additional\s+(?:CSU|degree[-\s]+applicable)\s+(?:transferable\s+)?units|"
                            r"additional\s+CSU[-\s]+transferable\s+units|to\s+reach\s+60", re.I),
    "ge_overlap": re.compile(r"double[-\s]+count", re.I),
    "ge_waiver": re.compile(r"\bwaived\b", re.I),
    "repeat": re.compile(r"\btwice\b|\btaken\s+two\s+times\b", re.I),
    "course_renumbers": re.compile(r"\bBRDSCTG\b|\bESL\s+NC\s+0?45\b(?!CE)", re.I),
    "total_differs": re.compile(r"\bsum\s+to\s+27\b|\btotal\s+24\b", re.I),
}
AGAINST = re.compile(r"\bnot\s+waived\b|\bmay\s+not\s+be\s+double|\bonce\s+only\b", re.I)


def claim(filed: dict, reading: str) -> str:
    notes = [str(n) for n in (filed.get("record") or {}).get("notes") or []]
    said = [n for n in notes if CLAIMS[reading].search(n)]
    if any(AGAINST.search(n) for n in said):
        return "against"
    return "stands" if said else "silent"


def claim_checks(census_path: str = CENSUS) -> dict:
    out = collections.defaultdict(collections.Counter)
    keys = []
    for cn in census_members(census_path):
        reading = reading_of(cn)
        if reading is None:
            continue
        c = claim(at_base(cn), reading)
        out[reading][c] += 1
        if c != "stands":
            keys.append([cn, reading, c])
    return {"by_reading": {k: dict(v) for k, v in out.items()}, "not_standing": keys}


# ── the boundary readings: one word or figure across each edge ───────────
def _steps_with(edit) -> dict:
    steps = copy.deepcopy(R.load_steps())
    edit(steps[COLLEGE])
    return steps


def _first(text: str, pattern: str) -> re.Match:
    m = re.search(pattern, text, re.I)
    assert m, pattern
    return m


def boundaries(census_path: str = CENSUS) -> dict:
    """Each reading at its edges on every record it passes, each variant's expected answer beside it:
    plan_line: the plan line's control number one digit off (no anchor: none), the sentence cut from the section
    (none); ge_overlap: the note's verb 'double counted for' (none), the note moved under the next program's plan line
    (none); ge_waiver: 'Student may choose to waive either' (none), ge_units 26 in place of the plan's 27 (none);
    repeat: the heading's word 'TWICE' read as 'ONCE' (none), the course at 3 units against the stated 4 (none);
    course_renumbers: the file lists the printed code itself (no rename: none), the printed code one letter off
    (none); total_differs: the record's total read 27 (the sum: no gap), the file's entry withdrawn (no gap)."""
    secs = sections()
    out, wrong = collections.Counter(), []

    def tally(name, got, want, cn):
        ok = got == want
        out["%s %s" % (name, "right" if ok else "wrong")] += 1
        if not ok:
            wrong.append([cn, name, got])

    for cn in census_members(census_path):
        reading = reading_of(cn)
        if reading is None or cn not in secs:
            continue
        f, t = at_base(cn), secs[cn]["text"]
        if reading == "plan_line":
            plan = _first(t, r"\(\s*Academic\s+Plan\s+E0%s[A-Z]*\s*\)" % cn)
            off = cn[:-1] + str((int(cn[-1]) + 1) % 10)
            t2 = t[:plan.start()] + plan.group(0).replace(cn, off) + t[plan.end():]
            # the reader's heading names the plan line; with the page's off by one, only the title words could anchor
            tally("plan line one digit off", read(f, t2)["answer"], "none", cn)
            sent = _first(t, r"ADDITIONAL\s+(?:CSU|DEGREE[-\s]+APPLICABLE)\s+UNITS,?\s+IF\s+NEEDED,?\s+TO\s+REACH\s+60"
                             r"(?:\s+CSU\s+TRANSFERABLE)?\s+UNITS")
            tally("sentence cut from the section", read(f, t[:sent.start()] + t[sent.end():])["answer"], "none", cn)
            # The S714 second reader's case: the record's own sentence cut, and a later program's plan line and the
            # same sentence after it. The later program's words are never this one's (own_section_end).
            later = t[:sent.start()] + t[sent.end():] + "\n(Academic Plan E099999C)\n" + sent.group(0) + "\n"
            tally("a later program's sentence", read(f, later)["answer"], "none", cn)
        if reading == "ge_overlap":
            note = _first(t, r"double[-\s]+counted\s+(?:in|towards?)")
            t2 = t[:note.start()] + note.group(0).split()[0] + " counted for" + t[note.end():]
            tally("verb 'double counted for'", read(f, t2)["answer"], "none", cn)
            nxt = re.search(r"\(\s*Academic\s+Plan\s+E0(?!%s)\d" % cn, t)
            line_start = t.rfind("Note:", 0, note.start())
            line_end = t.find("\n", note.end())
            line_end = len(t) if line_end < 0 else line_end
            moved = t[:line_start] + t[line_end:]
            moved = (moved + "\n(Academic Plan E099999C)\n" + t[line_start:line_end]) if not nxt else moved.replace(
                nxt.group(0), nxt.group(0) + "\n" + t[line_start:line_end].replace("(", "[").replace(")", "]"), 1)
            tally("note under the next plan line", read(f, moved)["answer"], "none", cn)
        if reading == "ge_waiver":
            # The section's own note, after its plan line (the 300 characters above it can hold the program before's).
            own = _first(t, r"\(\s*Academic\s+Plan\s+E0%s" % cn).end()
            w = re.compile(r"The\s+following\s+LACCD\s+GE\s+areas?\s+4a", re.I).search(t, own)
            assert w, cn
            t2 = t[:w.start()] + "Student may choose to waive either LACCD GE Area 4a" + t[w.end():]
            tally("'may choose to waive either'", read(f, t2)["answer"], "none", cn)
            f2 = copy.deepcopy(f)
            f2["record"]["program"]["ge_units"] = {"min": 26, "max": 26}
            tally("ge_units 26, not the plan's 27", read(f2, t)["answer"], "none", cn)
        if reading == "repeat":
            f2 = copy.deepcopy(f)
            for b in f2["record"]["blocks"]:
                b["name"] = b["name"].replace("TWICE", "ONCE")
            tally("heading 'ONCE'", read(f2, t.replace("COURSE TWICE", "COURSE ONCE"))["answer"], "none", cn)
            f3 = copy.deepcopy(f)
            for b in f3["record"]["blocks"]:
                for c in b.get("courses") or []:
                    if c.get("code") == "TECTHTR 348":
                        c["units"] = 3
            tally("course 3 against the stated 4", read(f3, t)["answer"], "none", cn)
        if reading == "course_renumbers":
            listed = copy.deepcopy(f)
            sc = listed["score"]
            printed = [k for k in sc["invented"]["codes"] if k in renumbers()]
            sc["invented"]["codes"] = [k for k in sc["invented"]["codes"] if k not in printed]
            sc["coverage"]["missing"] = list(sc["coverage"]["missing"]) + printed
            tally("file lists the printed code", read(listed, t)["answer"], "none", cn)

            def one_off(conf):
                conf["course_renumbers"] = {k[:-1] + ("X" if k[-1] != "X" else "Y"): v
                                            for k, v in conf["course_renumbers"].items()}
            tally("printed code one letter off", read(f, t, steps=_steps_with(one_off))["answer"], "none", cn)
        if reading == "total_differs":
            f2 = copy.deepcopy(f)
            f2["record"]["program"]["total_units"] = {"min": 27, "max": 27}
            tally("total read 27", read(f2, t)["answer"], "passes", cn)
            tally("entry withdrawn", read(f, t, total_differs={})["answer"], "none", cn)
    return {"counts": dict(out), "wrong": wrong}


# ── the named gap, filed on the committed record as kb/_program_named_gaps.py run() files one ──
def file_gaps(write: bool) -> list[dict]:
    """The hand's gap records whose committed record still fails and names no gap: score.gaps and score.confidence
    as NG.run writes them (the record itself unchanged)."""
    out = []
    for cn, w in HAND_HELD.items():
        if not w.startswith("gap"):
            continue
        path = os.path.join(ROOT, _rel(cn))
        filed = now(cn)
        if (filed.get("score") or {}).get("gaps"):
            g = filed["score"]["gaps"][0]
            out.append({"control_number": cn, "gap": g.get("gap"), "words": g.get("words"),
                        "confidence": filed["score"].get("confidence"), "filed_earlier": True})
            continue
        words = NG.total_differs(filed)
        if not words:
            continue
        src, year = NG._sources(path)
        e = src.get(cn) or {}
        conf = NG.confidence(filed, "total_differs", e.get("method"), (e.get("catalog_year") or year) == year)
        out.append({"control_number": cn, "gap": "total_differs", "words": words, "confidence": conf})
        if write:
            filed["score"]["gaps"] = [{"gap": "total_differs", "label": NG.GAPS["total_differs"], "words": words}]
            filed["score"]["confidence"] = conf
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(filed, fh, ensure_ascii=False, indent=1)
                fh.write("\n")
    return out


# ── the plan: rows whose verdict moves, full-row ──────────────────────────
def plan(base: str = BASE) -> dict:
    before, after = GP.images_at(base, COLLEGE), GP.images_now(COLLEGE)
    rows, same_verdict, counts_only, restamped, unplanned_moves = [], [], [], [], []
    for cn in sorted(after):
        b, a = before.get(cn), after[cn]
        if b is None:
            continue
        if b["record"] == a["record"] and b["checks"] == a["checks"]:
            if b["extracted_run"] != a["extracted_run"]:
                restamped.append(cn)
            continue
        pb, pa = GP._passes(b), GP._passes(a)
        gb, ga = (b.get("checks") or {}).get("gaps") or [], (a.get("checks") or {}).get("gaps") or []
        moves = pb != pa or (not pa and bool(ga) != bool(gb))
        if not moves:
            (counts_only if b["record"] == a["record"] else same_verdict).append(
                [cn, pa, (a.get("checks") or {}).get("arithmetic")])
            continue
        want = hand_answer(cn)
        got = "passes" if pa else "gap" if ga else "none"
        if want != got:
            unplanned_moves.append({"control_number": cn, "hand": want, "after": got,
                                    "why": HAND_HELD.get(cn, "outside the census lever")})
            continue
        rows.append({"college": COLLEGE, "control_number": cn, "award": a.get("award"), "passes_before": pb,
                     "passes_after": pa, "gaps_after": ga, "reading": reading_of(cn),
                     "before_image": {k: b[k] for k in GP.KEYS}, "after_image": {k: a[k] for k in GP.KEYS}})
    for i, r in enumerate(rows, 1):
        r["i"] = i
    return {"rows": rows, "record_written_verdict_same_not_planned": same_verdict,
            "checks_only_verdict_same_not_planned": counts_only, "restamped_not_planned": restamped,
            "moved_against_the_hand_not_planned": unplanned_moves}


# ── the compact pre-read: md5 of the jsonb text, hashed on a local Postgres ──
def md5s(rows: list[dict]) -> dict:
    """{i: (before record md5, before checks md5, after record md5, after checks md5)}, each the md5 of the value's
    jsonb text as Postgres 16 prints it (p-compact-preread-by-md5-s713), from a local psql."""
    vals = []
    for r in rows:
        for img in (r["before_image"], r["after_image"]):
            for k in ("record", "checks"):
                vals.append(json.dumps(img[k], ensure_ascii=False, sort_keys=True, separators=(",", ":")))
    sql ="select h from (select row_number() over () as ord, md5(v::jsonb::text) as h from (values %s) t(v)) x " \
          "order by ord;" % ", ".join("(%s)" % GP._q(v) for v in vals)
    p = subprocess.run(["psql", "-X", "-At", "-q", "-v", "ON_ERROR_STOP=1", "-f", "-"], input=sql, text=True,
                       capture_output=True, env=dict(os.environ, PGDATABASE=os.environ.get("PGDATABASE", "postgres")))
    if p.returncode:
        raise SystemExit("local psql: " + p.stderr[-400:])
    hs = p.stdout.split()
    assert len(hs) == 4 * len(rows), (len(hs), len(rows))
    return {r["i"]: tuple(hs[4 * j:4 * j + 4]) for j, r in enumerate(rows)}


def pre_read_md5_sql(rows: list[dict], hashes: dict) -> str:
    v = ",\n  ".join("(%d, %s, %s, %d, %s, %s, %s, %s)" % (
        r["i"], GP._q(r["college"]), GP._q(r["control_number"]), int(r["before_image"]["extracted_run"]),
        GP._q(hashes[r["i"]][0]), GP._q(hashes[r["i"]][1]), GP._q(hashes[r["i"]][2]), GP._q(hashes[r["i"]][3]))
        for r in rows)
    return ("with v(i, college, control_number, before_run, rec_md5, chk_md5, after_rec_md5, after_chk_md5) as "
            "(values\n  %s)\n"
            "select json_build_object(\n"
            "  'listed', (select count(*) from v),\n"
            "  'on_run', count(*) filter (where r.extracted_run = v.before_run),\n"
            "  'both_before', count(*) filter (where r.extracted_run = v.before_run and md5(r.record::text) = "
            "v.rec_md5 and md5(r.checks::text) = v.chk_md5),\n"
            "  'already_after', count(*) filter (where md5(r.record::text) = v.after_rec_md5 and md5(r.checks::text) "
            "= v.after_chk_md5),\n"
            "  'checked_now', count(*) filter (where r.checked),\n"
            "  'latest_confirm', count(*) filter (where lv.verdict = 'confirm'),\n"
            "  'confirm_on_before', count(*) filter (where lv.verdict = 'confirm' and lv.requirements_fp = "
            "public.program_record_fp(r.record)))\n"
            "  from v join public.program_requirement_records r\n"
            "    on r.college = v.college and r.control_number = v.control_number\n"
            "  left %s;" % (v, GP.LATEST))


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--tag", default="s714e")
    a = ap.parse_args(argv)
    pr, cc, bd = precision(), claim_checks(), boundaries()
    print("precision against the hand reading: read %d, right %d, wrong %d (%s); not hand-held %d; no section %d"
          % (pr["read"], pr["right"], pr["wrong"], ", ".join("%s %d" % kv for kv in sorted(pr["by_answer"].items())),
             pr["not_hand_held"], pr["no_section"]))
    for w in pr["wrong_keys"]:
        print("  wrong: %(control_number)s hand %(hand)s, rule %(rule)s" % w)
    print("claim checks: %s" % json.dumps(cc))
    print("boundaries: %s" % json.dumps(bd))
    if pr["wrong"] or pr["not_hand_held"] or pr["no_section"] or bd["wrong"] or cc["not_standing"]:
        raise SystemExit("the self-recall reads a wrong answer: no gap is filed and no plan is written")
    gaps = file_gaps(write=not a.dry_run)
    print("named gaps filed: %s" % json.dumps([[g["control_number"], g["gap"]] for g in gaps]))
    res = plan()
    rows = res["rows"]
    by = dict(collections.Counter("%s: %s" % (r["reading"], "passes" if r["passes_after"] else "gap") for r in rows))
    print("plan: %d rows (%s); record written, verdict same: %d; checks only: %d; restamped: %d; against the hand: %s"
          % (len(rows), json.dumps(by), len(res["record_written_verdict_same_not_planned"]),
             len(res["checks_only_verdict_same_not_planned"]), len(res["restamped_not_planned"]),
             json.dumps(res["moved_against_the_hand_not_planned"])))
    stop = [k for k, bad in (("precision", pr["wrong"] or pr["not_hand_held"] or pr["no_section"]),
                             ("boundaries", bd["wrong"]), ("claim checks", cc["not_standing"]),
                             ("moved against the hand", res["moved_against_the_hand_not_planned"])) if bad]
    if stop:
        raise SystemExit("the self-recall reads a wrong answer (%s): no plan is written" % ", ".join(stop))
    if a.dry_run or not rows:
        return 0
    day = time.strftime("%Y-%m-%d", time.gmtime())
    hashes = md5s(rows)
    path = os.path.join(HERE, "receipts", "program_requirement_records_piles_ela_%s_%s.json" % (day, a.tag))
    rel = os.path.relpath(path, ROOT)
    base = os.path.join(HERE, "migrations", "%s_%s_prreq_piles_" % (day, a.tag))
    body = {"rule": ("S714 lane 2's cheap piles at East Los Angeles College: the plan line, double counting, the "
                     "high-unit waiver, a course taken twice, two printed codes, and one named gap"),
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "college": COLLEGE, "base": BASE, "run": RUN,
            "page_reads": PAGE_READS,
            "census": {"file": os.path.relpath(CENSUS, ROOT), "lever": LEVER, "members": census_members()},
            "hand_held": HAND_HELD, "precision": pr, "claim_checks": cc, "boundaries": bd,
            "claim_check_reads": ("The claim checks read the record's notes as filed at BASE: the reader's own words "
                                  "from the read behind the record. The readings read the page text, committed as "
                                  "tests/fixtures/ela_s714_sections.json from the two page reads; sources.json "
                                  "describes today's capture and commits no page text "
                                  "(p-claim-check-reads-current-capture-s713)."),
            "by": by, "rows": len(rows), "records": rows, "reverted_to_base": REVERTED_TO_BASE,
            "named_gaps_filed": gaps,
            **{k: v for k, v in res.items() if k != "rows"},
            "follow_verdict": ("The record changes, so a confirm given on the old record no longer matches. The apply "
                               "aborts, writing nothing, if any row's latest verdict is a confirm matching the new "
                               "record's fingerprint, or one given on the old record the reread would carry over "
                               "(Sheet 82 card 1)."),
            "pre_read_md5": pre_read_md5_sql(rows, hashes), "pre_read": GP.pre_read_sql(rows),
            "apply": GP.apply_sql(rows, a.tag + " piles"), "rollback": GP.rollback_sql(rows, a.tag + " piles")}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(body, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    hdr = ("-- %s lane 2's cheap piles at East Los Angeles College, %d full-row rows (%s): record, checks and run to\n"
           "-- the reconcile run %s's filing. Receipt: %s.\n" % (a.tag.upper(), len(rows), json.dumps(by), RUN, rel))
    parts = {
        "preread_md5.sql": ("-- Compact pre-read, read-only: one SELECT, one JSON value. md5 of each value's jsonb text, "
                            "hashed on a local\n-- Postgres 16 (p-compact-preread-by-md5-s713); the full values are in "
                            "the _preread.sql beside it.\n-- A clean read: on_run = both_before = listed, already_after "
                            "0, checked_now 0, latest_confirm 0.\n" + body["pre_read_md5"]),
        "preread.sql": "-- Pre-read, read-only: one SELECT, one JSON value.\n" + body["pre_read"],
        "apply.sql": ("-- Guarded UPDATE; aborts unless %d rows less those a person checked, and unless no confirm "
                      "matches the new record.\n" % len(rows) + body["apply"]),
        "rollback.sql": ("-- Rollback, NOT applied: the before-image back where the row holds the after-image. Revert "
                         "the record files too.\n" + body["rollback"]),
    }
    for name, text in parts.items():
        with open(base + name, "w", encoding="utf-8") as fh:
            fh.write(hdr + text + "\n")
    print("receipt %s" % rel)
    return 0


if __name__ == "__main__":
    sys.exit(main())

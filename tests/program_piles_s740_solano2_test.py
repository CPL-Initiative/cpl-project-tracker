#!/usr/bin/env python3
"""S740, lane 1 at Solano after the reconcile's reread: Social Work and Human Services A.A.-T 42041, its gap named.

WHY. kb/_program_piles_s740_solano2.py reads 42041 again once the reread of the free reconcile 45840125172 posted its
row. The reconcile reads its course list, and it still names no total: its section prints none. The shared checks are
tests/program_piles_s739_common.py's; the key is one of s740c2's holds, read from its committed receipt.

Pinned here beside them:
  * the row is at the reconcile's run, and the committed reread receipt posted that run for it;
  * the page's own words (college-page-read run 45835049303, PDF page 303, as pypdf prints it): the A.A.-T's section
    prints its lists and no total, and the Human Services section below it on the same page prints its own;
  * the own-page guard: the page is shared with the Human Services and Social Work A.A. 08337, a program of the same
    words in another order; the record's heading names the transfer degree and not the A.A., so the section is its own;
  * the record rule names total_not_printed from kb/program_total_not_printed.json.

Run from repo root: python3 tests/program_piles_s740_solano2_test.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402

import _program_piles_s739 as B  # noqa: E402
import _program_piles_s740_solano2 as M  # noqa: E402

W = M.W
S, NG = B.S, B.NG
ROWS = {"42041": "total_not_printed"}
t = T.run(W, rows=ROWS, held={}, scores={"total_not_printed": 40}, day="2026-11-26", boundaries=3,
          own={"42041": "own_heading"})
check = t.check

with open(os.path.join(B.ROOT, M.REREAD), encoding="utf-8") as fh:
    reread = json.load(fh)
posted = {str(k) for k in (reread.get("replaced_keys") or []) + (reread.get("carried_keys") or [])}
f = W.load("42041")
check(str(f["extracted_run"]) == M.RECONCILE == str(reread["extracted_run"]) and "42041" in posted,
      "42041 is at the reconcile's run, and the committed reread receipt posted it")
check(not {"20973", "36420", "42205"} & posted,
      "the three records keep-better restored from main are not in the reread")

PAGE_303 = """302 · Human Services and Social Work
Associate in Arts in Social Work and Human Services for Transfer (ADT: A.A.-T)
Program DescripƟ on
REQUIRED COURSES ..............................................Units
HSW 001 IntroducƟ on to Human Services
and Social Work ......................................................... 3
STAT C1 000 IntroducƟ on to StaƟ sƟ cs ............................. 4
PSYC C1000 IntroducƟ on to Psychology ......................... 3
SOCI C1000 IntroducƟ on to Sociology ............................ 3
COUN 064 Human Services and Social Work Seminar 1.5
COUN 064P Human Services and
Social Work PracƟ cum .......................................... 2
List A: Biology (select one course)
BIOL 004 Human Anatomy ............................................. 5
List B: Economics (select one course)
ECON C2002 Principles of Macroeconomics .................. 3
List C: ElecƟ ves (select two coursres)
SOCI 002 Social Issues and Problems ............................. 3
Consult with your counselor for guidance on custom course pathwayr
"""
BELOW = """CerƟ ﬁ cate o f Achievement and Associate in Arts
REQUIRED COURSES ..............................................Units
Required Major Total Units .................................18.5
Associate Degree Required Major Total Units .....24.5
"""
check("Total" not in PAGE_303 and "Required Major Total Units .................................18.5" in BELOW,
      "42041: the A.A.-T's section prints its lists and no total; the section below it prints its own")
entry = NG.total_not_printed_list().get((M.COLLEGE, "42041")) or {}
check(entry.get("page") == 303 and entry.get("run") == "45835049303" and entry.get("words") in PAGE_303,
      "42041 is listed with its page, its run and its section's heading as the page prints it")
bare = dict(f, score={k: v for k, v in f["score"].items() if k not in ("gaps", "confidence")})
check(NG.answer(bare) == ("total_not_printed", NG.total_not_printed(bare)) and "PDF p.303" in NG.total_not_printed(bare),
      "42041: the record rule names total_not_printed, with its page")
check(bare["score"]["arithmetic"]["why"] == [NG.NO_TOTAL_WHY] and NG.collectable(bare["score"]),
      "42041: its course list is read, and its one arithmetic reason is that it names no total")

# ── the own-page guard ─────────────────────────────────────────────────────
e = M.REVIEWED["42041"]
mate = W.load("08337")
check(W.shared_with("42041") == ["08337"] and set(B._words(mate["title"])) == set(B._words(f["title"])),
      "42041 shares its page with 08337, a program of the same words in another order")
check(B.kinds_named(e["own_heading"]) == {"transfer"} and B.award_kind(f["award"]) == "transfer"
      and B.award_kind(mate["award"]) == "arts",
      "the heading names the transfer degree and not the A.A.")
check(mate["record"]["program"]["section_heading"] != f["record"]["program"]["section_heading"],
      "08337's record carries another heading")
sys.exit(t.done())

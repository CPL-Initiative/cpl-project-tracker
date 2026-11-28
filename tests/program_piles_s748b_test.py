#!/usr/bin/env python3
"""S748, lane 2's cheap piles, batch s748b: two records at two colleges, each collected with its gap named, in one
plan (kb/_program_piles_s748b.py, kb/_program_piles_s748.py, kb/_program_piles_s748_<college>.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with the gap
named, never held. COBIx's brief of 2026-11-28: name the gap rather than paying for a third reread. S741 held Orange
Coast 03993 because no note of its own names its gap, and S720 to S742 held East Los Angeles 41231 for a reread; free
page reads print each page line for line, and each gap is true on its page. The shared checks are
tests/program_piles_s739_common.py's, run once a college. Pinned here:

  * the batch: two piles under one tag, the rows numbered 1 and 2 across them; each college's receipt names its own
    row and the batch's two members and carries the batch's one pre-read, one guarded UPDATE (expecting 2) and one
    rollback, the same text the four SQL files hold;
  * Orange Coast 03993 (figure_within_variable_units): the page's own line, 'DANC A211 Repertoire I 1-4', committed
    in the page read's plan file under its run, read from the address the record was read from; the record holds
    that course at 1-4 and every other core course at a fixed figure; with it at 3 the courses add to the printed
    20; with the course at one figure, another run or another quoted line, nothing is named;
  * East Los Angeles 41231 (total_differs): listed in kb/program_total_differs.json with its page's two figures from
    the page read's run; the page read's lines print MATH 261 (5) OR MATH 261S (3) under the '41-45' line, and the
    record holds both courses at those units as alternatives; the record rule names the gap in its own words;
    unlisted, it never takes the gap;
  * the holds: each carries its reason; East Los Angeles 31017 carries no gap; the coverage lever's count, over
    every filed record.

Run from repo root: python3 tests/program_piles_s748b_test.py
"""
import copy
import glob
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s742 as B9  # noqa: E402
import _program_piles_s748 as B10  # noqa: E402
import _program_piles_s748b as M  # noqa: E402

B, NG, S = B10.B, B10.NG, B10.S
ROOT = T.ROOT
DAY = "2026-11-28"
OCC, ELA = M.OCC, M.ELA
PILES = [OCC.W, ELA.W]
ROWS = [("Orange Coast College", "03993", "figure_within_variable_units"),
        ("East Los Angeles College", "41231", "total_differs")]
N = len(ROWS)

t = T.Checks()
check = t.check
T.run(OCC.W, rows={"03993": "figure_within_variable_units"},
      held={"08663": ["45999669017", "the conductor's"], "08670": ["60-63.5"], "36032": ["55-64", "both sides"],
            "42331": ["closed-list rescore"], "43100": ["PSYC A160", OCC.PAGE_READ]},
      scores={"figure_within_variable_units": 60}, day=DAY, boundaries=5, t=t, batch_rows=N)
T.run(ELA.W, rows={"41231": "total_differs"}, held={"31017": ["both sides", "list_minimum_units", ELA.PAGE_READ]},
      scores={"total_differs": 50}, day=DAY, boundaries=2, t=t, batch_rows=N)

# ── the batch ──
check(M.BATCH.tag == M.TAG == "s748b" and M.BATCH.piles == PILES and all(w.tag == M.TAG for w in PILES)
      and M.BATCH.session == "S748", "one batch of two piles under one tag, under S748's name")
receipts = []
for w in PILES:
    with open(w.receipt_path(DAY), encoding="utf-8") as fh:
        receipts.append(json.load(fh))
members = [[c, cn, i] for i, (c, cn, _) in enumerate(ROWS, 1)]
check(all(r["batch"]["tag"] == M.TAG and r["batch"]["rows"] == N and r["batch"]["members"] == members
          and r["batch"]["colleges"] == [w.college for w in PILES] and ". S748: " in r["rule"] for r in receipts),
      "every receipt names the batch's two members, numbered across the piles, and S748")
check([[x["college"], x["control_number"], x["i"], x["moves_to"]] for r in receipts for x in r["records"]]
      == [[c, cn, i, g] for i, (c, cn, g) in enumerate(ROWS, 1)],
      "each receipt holds its own college's row, at its number in the batch")
for part, key in (("apply", "apply"), ("preread", "pre_read"), ("preread_md5", "pre_read_md5"), ("rollback", "rollback")):
    with open(os.path.join(ROOT, "kb", "migrations", "%s_%s_prreq_piles_%s.sql" % (DAY, M.TAG, part)),
              encoding="utf-8") as fh:
        sql = fh.read()
    check(len({r[key] for r in receipts}) == 1 and sql.endswith(receipts[0][key] + "\n"),
          "%s: one text, in the file and in every receipt" % part)
    check(all("'%s'" % cn in sql for _, cn, _ in ROWS) and all(c.replace("'", "''") in sql for c, _, _ in ROWS),
          "%s names the two rows and their colleges" % part)
with open(os.path.join(ROOT, "kb", "migrations", "%s_%s_prreq_piles_apply.sql" % (DAY, M.TAG)), encoding="utf-8") as fh:
    apply_sql = fh.read()
check(apply_sql.count("e(expect) as (values (%d))" % N) == 1 and "r.checked is not true" in apply_sql
      and "r.extracted_run = v.extracted_run and r.checks = v.before_checks and r.record = v.before_record" in apply_sql,
      "the one UPDATE expects the batch's two rows, each on its run, its before-image and no person's check")


def bare(f):
    g = copy.deepcopy(f)
    g["score"].pop("gaps", None)
    g["score"].pop("confidence", None)
    return g


# ── Orange Coast 03993 ──
W = OCC.W
f, e = W.load("03993"), OCC.REVIEWED["03993"]
g = bare(f)
with open(os.path.join(ROOT, OCC.PLAN), encoding="utf-8") as fh:
    plan = json.load(fh)
quoted = plan["_quoted"][OCC.PAGE_READ]
check(any(p["url"] == g["source_url"] and p.get("capture_view") is True for p in plan["pages"])
      and quoted["repertoire"] == OCC.REPERTOIRE == e["words"] and quoted["major"] == "Program Major Units 20"
      and OCC.REPERTOIRE in quoted["core"],
      "03993: the page read's plan reads the record's own address and holds the page's lines under its run")
words = f["score"]["gaps"][0]["words"]
check(words == W.page_words(g, e) and OCC.REPERTOIRE in words and OCC.PAGE_READ in words
      and W.gap_noted(g) == ("figure_within_variable_units", words) and NG.answer(g) is None,
      "03993: the words filed are the page's line with its page read, and no record rule names another kind")
rows = B.course_rows(g, "DANC A211")
core = next(b for b in g["record"]["blocks"] if b["name"] == "Core Courses")
fixed = [S._num(c.get("units")) for c in core["courses"] if c is not rows[0]]
check(len(rows) == 1 and S._num(rows[0]["units"]) == 1 and S._num(rows[0]["units_max"]) == 4
      and len(fixed) == 7 and sum(fixed) == 13 and all(c.get("units_max") is None for c in core["courses"] if c is not rows[0])
      and B.same(g["score"]["arithmetic"]["computed"], [18, 21]) and B.same(g["score"]["arithmetic"]["stated"], [20, 20]),
      "03993: seven core courses add to 13, DANC A211 carries 1-4, and with the four elective units the record reads "
      "18-21 around the printed 20")
check(OCC.variable_course(g, e) and B.closes(g, B.apply_ops(g, e["ops"])),
      "03993: the variable course's range holds the printed total, and at 3 units the courses add to the printed 20")
h = copy.deepcopy(g)
B.course_rows(h, "DANC A211")[0]["units_max"] = None
check(not OCC.variable_course(h, e), "03993: with the course at one figure the shape names nothing")
check(W.page_words(g, dict(e, page_read=dict(e["page_read"], run="45953358884"))) is None
      and W.page_words(g, dict(e, page_read=dict(e["page_read"], line="major"))) is None
      and W.page_words(g, dict(e, page_read=dict(e["page_read"], plan="kb/college_reads/no_such_plan.json"))) is None,
      "03993: another run, another quoted line or a missing plan files no words")
check(not any("A211" in n for n in B.notes(g)), "03993: no note of the record names the course's range (S741's hold)")
check(not W.shared_with("03993"), "03993: no other record was read from its page")

# ── East Los Angeles 41231 ──
W = ELA.W
with open(os.path.join(ROOT, "kb", "program_total_differs.json"), encoding="utf-8") as fh:
    listed = json.load(fh)["colleges"][ELA.COLLEGE]
check(sorted(listed) == ["41231", "45602"], "the file lists East Los Angeles's two programs and no other")
f, e, x = W.load("41231"), ELA.REVIEWED["41231"], listed["41231"]
words = f["score"]["gaps"][0]["words"]
g = bare(f)
a = g["score"]["arithmetic"]
with open(os.path.join(ROOT, ELA.PLAN), encoding="utf-8") as fh:
    plan = json.load(fh)
quoted = plan["_quoted"][ELA.PAGE_READ]
check(x["run"] == ELA.PAGE_READ and ELA.PAGE_READ in x["evidence"] and os.path.basename(ELA.PLAN) in x["evidence"]
      and g["source_url"] == plan["pages"][0]["url"] + "#page=%d" % x["page"]
      and plan["pdf_span"][0] <= x["page"] <= plan["pdf_span"][1],
      "41231: the file's entry names the page read, its plan and the PDF page the record was read from")
check(quoted["choose"].endswith("41-45") and quoted["math_261"].split(" | ")[1] == "OR"
      and quoted["math_261"].startswith("MATH 261*") and quoted["math_261"].rstrip().endswith("3")
      and "MATH 261S Calculus I With Support" in quoted["math_261"] and quoted["math_261"] in
      quoted["section"].replace("\n", " | ") and quoted["section"].startswith(quoted["choose"]),
      "41231: the page read's lines print MATH 261 (5) OR MATH 261S (3) under the '41-45' line")
calc = B.course_rows(g, "MATH 261")
check(len(calc) == 1 and S._num(calc[0]["units"]) == 5
      and [(al["code"], S._num(al["units"])) for al in calc[0]["alternatives"]] == [("MATH 261S", 3)],
      "41231: the record holds MATH 261 at 5 with MATH 261S at 3 as its alternative, as the page prints them")
check(B.same(a["computed"], x["printed_sum"]) and B.same(a["stated"], x["printed_total"])
      and B.same(e["computed"], x["printed_sum"]) and B.same(e["stated"], x["printed_total"])
      and a["against"] == "program",
      "41231: the record holds the two figures the file lists (39-45 against the printed 41-45)")
h = B.apply_ops(g, [("alt_units", "MATH 261", "MATH 261S", 5)])
check(h is not None and B.closes(g, h), "41231: with MATH 261S at MATH 261's 5 the rows add to the printed 41-45")
check(NG.answer(g) is not None and NG.answer(g)[0] == "total_differs" and NG.total_differs(g) == words
      and W.gap_noted(g) == ("total_differs", words) and ELA.PAGE_READ in words,
      "41231: the record rule names total_differs, and the gap files the rule's own words")
check(NG.total_differs(g, {}) is None, "41231: a record the file does not list never takes the gap")
check(g["record"]["program"]["section_heading"] == "(Academic Plan E041231H)" and not W.shared_with("41231"),
      "41231: its heading is its own plan line, and no other record was read from its page")

# ── the holds ──
f = ELA.W.load("31017")
check(not f["score"].get("gaps") or S.passes_live(f["score"]),
      "31017: the record carries no gap (or passes, once its reconcile step's reread posts it)")
alone = found_none = 0
for d in sorted(glob.glob(os.path.join(NG.COLLEGE_DIR, "*"))):
    try:
        with open(os.path.join(d, "sources.json"), encoding="utf-8") as fh:
            src = {str(s.get("control_number")): s for s in json.load(fh)}
    except (OSError, ValueError):
        src = {}
    for p in glob.glob(os.path.join(d, "records", "*.json")):
        with open(p, encoding="utf-8") as fh:
            r = json.load(fh)
        sc = r.get("score") or {}
        cov = sc.get("coverage") or {}
        if S.passes_live(sc) or cov.get("pass") or cov.get("none_placed") or not cov.get("unexplained") \
                or not (sc.get("invented") or {}).get("pass"):
            continue
        alone += 1
        found = {S.norm_code(c) for c in (src.get(str(r.get("control_number"))) or {}).get("codes_found") or []}
        found_none += all(S.norm_code(c) not in found for c in cov["unexplained"])
print("coverage lever: %d records fail coverage on unexplained listed courses alone; the capture finds none of them "
      "on the page at %d" % (alone, found_none))
check(0 < found_none <= alone and "second reader" in M.COVERAGE_LEVER,
      "the coverage lever names a reading with its second reader, over records the count finds")

sys.exit(t.done())

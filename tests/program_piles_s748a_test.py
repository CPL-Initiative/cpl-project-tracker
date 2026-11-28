#!/usr/bin/env python3
"""S748, lane 2's cheap piles, batch s748a: two records at two colleges, each collected with its gap named, in one
plan (kb/_program_piles_s748a.py, kb/_program_piles_s748.py, kb/_program_piles_s748_<college>.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with the gap
named, never held. COBIx's brief of 2026-11-28: name the gap rather than paying for a third reread. S742's rereads
put Butte 14583 on its own page and Santa Barbara City 43553 at its page's own figures, each still failing; the lane
left both as gap plans. The shared checks are tests/program_piles_s739_common.py's, run once a college. Pinned here:

  * the batch: two piles under one tag, the rows numbered 1 and 2 across them; each college's receipt names its own
    row and the batch's two members and carries the batch's one pre-read, one guarded UPDATE (expecting 2) and one
    rollback, the same text the four SQL files hold; the receipts are S748's, by name and by rule;
  * the live run: each row's reread receipt posts it at the run its committed record holds, later than the
    conductor's live read of 2026-11-27 13:44Z, which holds the row at the run before;
  * Butte 14583 (noted_section_cut_off): read from its own pinned page, which no other record was read from; its own
    note says the text stops after the second outcome and the requirements table is not in it; the record states no
    total; the record rule names no other kind, and with the note's sentence gone the gap names nothing;
  * Santa Barbara City 43553 (total_differs): listed in kb/program_total_differs.json with its page's two figures,
    from the page read's run, whose plan reads the address the record was read from; the record's two lists carry
    the page's 26-29 and 6-8; the record rule names the gap in its own words; unlisted, it never takes the gap;
  * the holds: Santa Barbara City 30746 fails coverage on PSY 200 alone; East Los Angeles 31017 carries no gap, no
    record rule names one, its sum sits on both sides of the printed 60, and its lever (the movement list at its
    printed minimum) passes today's scorer.

Run from repo root: python3 tests/program_piles_s748a_test.py
"""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s742 as B9  # noqa: E402
import _program_piles_s748 as B10  # noqa: E402
import _program_piles_s748a as M  # noqa: E402

B, NG, S = B10.B, B10.NG, B10.S
ROOT = T.ROOT
DAY = "2026-11-28"
BUTTE, SBCC = M.BUTTE, M.SBCC
PILES = [BUTTE.W, SBCC.W]
ROWS = [("Butte College", "14583", "noted_section_cut_off"), ("Santa Barbara City College", "43553", "total_differs")]
N = len(ROWS)

t = T.Checks()
check = t.check
T.run(BUTTE.W, rows={"14583": "noted_section_cut_off"}, held={}, scores={"noted_section_cut_off": 20}, day=DAY,
      boundaries=3, t=t, batch_rows=N)
T.run(SBCC.W, rows={"43553": "total_differs"}, held={"30746": ["coverage fails", "PSY 200", SBCC.PAGE_READ]},
      scores={"total_differs": 50}, day=DAY, boundaries=2, t=t, batch_rows=N)

# ── the batch ──
check(M.BATCH.tag == M.TAG == "s748a" and M.BATCH.piles == PILES and all(w.tag == M.TAG for w in PILES)
      and isinstance(M.BATCH, B9.Batch) and M.BATCH.session == "S748" and B9.Batch.session == "S742",
      "one batch of two piles under one tag, S742's Batch under S748's name")
receipts = []
for w in PILES:
    check(os.path.basename(w.receipt_path(DAY)).startswith("program_requirement_records_piles_s748_"),
          "%s: the receipt is S748's by name" % w.name)
    with open(w.receipt_path(DAY), encoding="utf-8") as fh:
        receipts.append(json.load(fh))
members = [[c, cn, i] for i, (c, cn, _) in enumerate(ROWS, 1)]
check(all(r["batch"]["tag"] == M.TAG and r["batch"]["rows"] == N and r["batch"]["members"] == members
          and r["batch"]["colleges"] == [w.college for w in PILES] for r in receipts),
      "every receipt names the batch's two members, numbered across the piles")
check(all(". S748: " in r["rule"] and B10.RULING_S748 in r["rule"] and ". S742: " not in r["rule"] for r in receipts),
      "every receipt's rule names S748 and its brief")
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
try:
    B10.Batch(tag="s748a", piles=[BUTTE.W, BUTTE.W])
    two = False
except SystemExit:
    two = True
try:
    B10.Batch(tag="s748z", piles=PILES)
    other = False
except SystemExit:
    other = True
check(two and other, "a batch refuses two piles of one college, and a pile under another tag")

# ── the live run ──
with open(os.path.join(NG.RECEIPTS, "program_requirements_reread_s742_piles_checked.json"), encoding="utf-8") as fh:
    live = json.load(fh)
for w, cn, reread, run, before in ((BUTTE.W, "14583", "46013543943", BUTTE.RUN, "42973457189"),
                                   (SBCC.W, "43553", "46015714377", SBCC.RUN, "38670933359")):
    f = w.load(cn)
    with open(os.path.join(NG.RECEIPTS, "program_requirement_records_college_reread_%s_%s.json" % (w.slug, reread)),
              encoding="utf-8") as fh:
        rr = json.load(fh)
    check(str(f["extracted_run"]) == run and str(rr["extracted_run"]) == run and cn in json.dumps(rr["replaced_keys"])
          and not rr["error"] and not rr["held_keys"],
          "%s: its reread's receipt posts the row at run %s, the committed record's" % (cn, run))
    check(str(live["live_runs"][w.college][cn]) == before and live["read_at"] < rr["at"],
          "%s: the conductor's 13:44Z live read holds the run before, and the reread is later" % cn)
    posted = w.prior.posted_runs((M.TAG,)).get(cn) or []
    check(bool(posted) and max(posted)[1] == run, "%s: the latest post of the row is run %s" % (cn, run))
    other = B10.LiveRead(w.college, w.slug)
    other.live_read = lambda cn=cn: {cn: [("2026-11-28T00:00:00Z", "1")]}
    check(not other.on_live_run(f, skip=(M.TAG,)), "%s: a later live read naming another run refuses the row" % cn)


def bare(f):
    g = copy.deepcopy(f)
    g["score"].pop("gaps", None)
    g["score"].pop("confidence", None)
    return g


# ── Butte 14583 ──
W = BUTTE.W
f, e = W.load("14583"), BUTTE.REVIEWED["14583"]
g = bare(f)
src = W.sources()["14583"]
check(f["source_url"] == src["source"]["url"] and src["source"].get("pinned") is True
      and src["source"]["h1"] == "AS Degree in Registered Nursing" == g["record"]["program"]["section_heading"]
      and src["coverage"] == 1.0 and not W.shared_with("14583"),
      "14583: read from its own pinned page, under its own heading, and no other record was read from it")
a = g["score"]["arithmetic"]
check(a["status"] == "incomplete" and a["stated"] is None and B.same(a["computed"], [0, 0])
      and "the record names no total" in a["why"] and B.shape_cut(g, e),
      "14583: the record states no total and adds to nothing, the kind's own shape")
words = f["score"]["gaps"][0]["words"]
check(e["words"] in words and "requirements table" in words and "not in the provided text" in words
      and words in B.notes(g) and W.gap_noted(g) == ("noted_section_cut_off", words),
      "14583: the gap files the record's own note, which says the requirements table is not in the text")
check(NG.incomplete_read(g) is not None and ("Butte College", "14583") in NG.HELD_INCOMPLETE and NG.answer(g) is None,
      "14583: its note holds it out of no_units_read, and no record rule names another kind")
h = copy.deepcopy(g)
h["record"]["notes"] = [n for n in h["record"]["notes"] if e["words"] not in n]
check(W.gap_noted(h) is None, "14583: with the note's sentence gone the gap names nothing")
h = copy.deepcopy(g)
h["record"]["program"]["total_units"] = {"min": 70, "max": 70}
h["score"]["arithmetic"] = dict(a, stated=[70.0, 70.0], computed=[70.0, 70.0])
check(W.gap_noted(h) is None, "14583: a record that states a total and adds to it is not the entry's record")
check(f["score"]["confidence"]["unit_arithmetic"] == 20 and src["text_chars"] < 4000,
      "14583: its unit arithmetic scores 20, and the capture's text of the page is under 4,000 characters")

# ── Santa Barbara City 43553 ──
W = SBCC.W
with open(os.path.join(ROOT, "kb", "program_total_differs.json"), encoding="utf-8") as fh:
    listed = json.load(fh)["colleges"][SBCC.COLLEGE]
check(sorted(listed) == ["43553"], "the file lists Santa Barbara City's one program and no other")
f, e, x = W.load("43553"), SBCC.REVIEWED["43553"], listed["43553"]
words = f["score"]["gaps"][0]["words"]
g = bare(f)
a = g["score"]["arithmetic"]
with open(os.path.join(ROOT, SBCC.PLAN), encoding="utf-8") as fh:
    plan = json.load(fh)
check(x["run"] == SBCC.PAGE_READ and SBCC.PAGE_READ in x["evidence"] and os.path.basename(SBCC.PLAN) in x["evidence"]
      and plan["pages"][0]["url"] == f["source_url"] and plan["pages"][0].get("capture_view") is True
      and f["source_url"] in x["where"],
      "43553: the file's entry names the page read and its plan, which reads the record's own address as the capture does")
check(B.same(a["computed"], x["printed_sum"]) and B.same(a["stated"], x["printed_total"])
      and B.same(e["computed"], x["printed_sum"]) and B.same(e["stated"], x["printed_total"])
      and a["against"] == "program",
      "43553: the record holds the two figures the file lists (32-37 against the printed 35-41)")
blocks = g["record"]["blocks"]
check(len(blocks) == 2 and blocks[0]["name"] == "Required Core" and B.same(B.pair(blocks[0]["stated"]), [26, 29])
      and blocks[1]["name"].startswith("List A") and B.same(B.pair(blocks[1]["stated"]), [6, 8])
      and B.same(B.pair(g["record"]["program"]["total_units"]), [35, 41])
      and "26-29" in x["words"] and "6-8" in x["words"] and "35.00-41.00" in x["words"],
      "43553: its two lists carry the page's 26-29 and 6-8, and its total the page's 35-41")
check(NG.answer(g) is not None and NG.answer(g)[0] == "total_differs" and NG.total_differs(g) == words
      and W.gap_noted(g) == ("total_differs", words) and SBCC.PAGE_READ in words,
      "43553: the record rule names total_differs, and the gap files the rule's own words")
check(NG.total_differs(g, {}) is None, "43553: a record the file does not list never takes the gap")
h = copy.deepcopy(g)
h["score"]["arithmetic"]["computed"] = [30.0, 37.0]
check(NG.total_differs(h) is None, "43553: at the 30-37 S740 held it on, the rule names nothing")
check(not W.shared_with("43553"), "43553: no other record was read from its page")

# ── the holds ──
f = SBCC.W.load("30746")
cov = f["score"]["coverage"]
if not cov.get("pass"):
    check(not NG.collectable(f["score"]) and "PSY200" in json.dumps(cov.get("missing") or cov.get("unexplained") or [])
          .replace(" ", "") and not f["score"].get("gaps"),
          "30746: coverage fails on PSY 200, and the record carries no gap")
ELA = B10.Pile(college="East Los Angeles College", slug="east_los_angeles", tag="held", name="East Los Angeles",
               prior=B10.LiveRead("East Los Angeles College", "east_los_angeles"), keys=("31017",), reviewed={},
               hand={"31017": "held: no filed kind"}, held_by="")
f = ELA.load("31017")
if not B.S.passes_live(f["score"]) and str(f.get("extracted_run")) == "45176404274":
    a = B.arithmetic(f)
    check(not f["score"].get("gaps") and NG.answer(bare(f)) is None,
          "31017: the record carries no gap, and no record rule names one")
    check(a["against"] == "degree" and a["status"] == "unequal" and a["major"]["pass"]
          and a["computed"][0] < a["stated"][0] < a["computed"][1] and B.same(a["stated"], [60, 60]),
          "31017: the major passes, and the degree's sum sits on both sides of the printed 60")
    lever = B.apply_ops(f, M.ELA_31017_LEVER)
    check(lever is not None and B.closes(f, lever, verdict=True) and not B.closes(f, lever),
          "31017: with the movement list at its printed minimum today's scorer passes it, short of the printed "
          "subtotal's high end: a reading for a reconcile step, no gap")
    check(ELA.precision()["right"] == 1, "31017: no entry stands for it")

sys.exit(t.done())

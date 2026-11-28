#!/usr/bin/env python3
"""S742, lane 2's cheap piles, batch s742a: four records at four colleges, each collected with its gap named, in one
plan (kb/_program_piles_s742a.py, kb/_program_piles_s742.py, kb/_program_piles_s742_<college>.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with the gap
named, never held. The S742 conductor's brief: a gap is named only where it is true on the page, in a guarded plan
batched over a few colleges. S740 held Santa Monica 21026, Cabrillo 45306 and Gavilan 08464 for a live run no
committed receipt posted, and Butte 01312 for a kind; the conductor's live read of 2026-11-27 07:31Z proves the runs,
and free page reads show each gap on its page. The shared checks are tests/program_piles_s739_common.py's, run once a
college. Pinned here:

  * the batch: four piles under one tag, the rows numbered 1 to 4 across them; each college's receipt names its own
    row and the batch's four members and carries the batch's one pre-read, one guarded UPDATE (expecting 4) and one
    rollback, the same text the four SQL files hold;
  * the live run: the live read holds each row at the run its committed record holds; for the three S740 held on the
    run, the receipts alone post none;
  * Santa Monica 21026 (total_differs): listed in kb/program_total_differs.json with its page's two figures, from
    the page read's run; the record rule names the gap in its own words; one section serves both Cosmetology awards,
    so the heading alone shows neither sister its own and the showing is the record's note (own_section);
  * Butte 01312 (degree_electives_not_printed): S721's degree_rest; with an electives figure, or a word that
    electives fill the degree, the shape names nothing;
  * Cabrillo 45306 (lists_not_closed): the Electives list's figure depends on the Required list's, and the two
    figures are the record's own;
  * Gavilan 08464 (lists_not_closed): the page's sentence, committed in the page read's plan file under its run, read
    from the address the record was read from; a sentence that names no minimum, a list of two courses, or another
    plan's run names nothing;
  * the holds: the four Cabrillo degrees headed 'Recommended' pass today's scorer with their lists read as units to
    choose (their lever, pinned while the records still hold such a list), and each hold carries no gap or is no
    longer the record its hold was written on.

Run from repo root: python3 tests/program_piles_s742a_test.py
"""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s742 as B9  # noqa: E402
import _program_piles_s742a as M  # noqa: E402

B, NG, S = B9.B, B9.NG, B9.S
ROOT = T.ROOT
DAY = "2026-11-27"
SMC, BUTTE, CABRILLO, GAVILAN = M.SMC, M.BUTTE, M.CABRILLO, M.GAVILAN
PILES = [SMC.W, BUTTE.W, CABRILLO.W, GAVILAN.W]
ROWS = [("Santa Monica College", "21026", "total_differs"), ("Butte College", "01312", "degree_electives_not_printed"),
        ("Cabrillo College", "45306", "lists_not_closed"), ("Gavilan College", "08464", "lists_not_closed")]
N = len(ROWS)

t = T.Checks()
check = t.check
_REC = ["Recommended", "reconcile step"]
T.run(SMC.W, rows={"21026": "total_differs"}, held={"43767": ["37548804006", "heading_not_in_text"]},
      scores={"total_differs": 50}, day=DAY, boundaries=3, own={"21026": "own_section"}, t=t, batch_rows=N)
T.run(BUTTE.W, rows={"01312": "degree_electives_not_printed"}, held={"14583": ["site_pages", "paid read"]},
      scores={"degree_electives_not_printed": 50}, day=DAY, boundaries=4, t=t, batch_rows=N)
T.run(CABRILLO.W, rows={"45306": "lists_not_closed"},
      held={"06352": _REC, "06380": _REC, "06381": _REC, "44992": _REC, "11293": ["49-58", "second look"]},
      scores={"lists_not_closed": 30}, day=DAY, boundaries=4, t=t, batch_rows=N)
T.run(GAVILAN.W, rows={"08464": "lists_not_closed"}, held={"45357": ["a reread"]},
      scores={"lists_not_closed": 30}, day=DAY, boundaries=5, t=t, batch_rows=N)

# ── the batch ──
check(M.BATCH.tag == M.TAG == "s742a" and M.BATCH.piles == PILES and all(w.tag == M.TAG for w in PILES),
      "one batch of four piles under one tag")
receipts = []
for w in PILES:
    with open(w.receipt_path(DAY), encoding="utf-8") as fh:
        receipts.append(json.load(fh))
members = [[c, cn, i] for i, (c, cn, _) in enumerate(ROWS, 1)]
check(all(r["batch"]["tag"] == M.TAG and r["batch"]["rows"] == N and r["batch"]["members"] == members
          and r["batch"]["colleges"] == [w.college for w in PILES] for r in receipts),
      "every receipt names the batch's four members, numbered across the piles")
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
          "%s names the four rows and their colleges" % part)
with open(os.path.join(ROOT, "kb", "migrations", "%s_%s_prreq_piles_apply.sql" % (DAY, M.TAG)), encoding="utf-8") as fh:
    apply_sql = fh.read()
check(apply_sql.count("e(expect) as (values (%d))" % N) == 1 and "r.checked is not true" in apply_sql
      and "r.extracted_run = v.extracted_run and r.checks = v.before_checks and r.record = v.before_record" in apply_sql,
      "the one UPDATE expects the batch's four rows, each on its run, its before-image and no person's check")
try:
    B9.Batch(tag="s742a", piles=[SMC.W, SMC.W])
    two = False
except SystemExit:
    two = True
try:
    B9.Batch(tag="s742z", piles=PILES)
    other = False
except SystemExit:
    other = True
check(two and other, "a batch refuses two piles of one college, and a pile under another tag")

# ── the live run ──
with open(os.path.join(NG.RECEIPTS, "program_requirements_reread_s741_piles_checked.json"), encoding="utf-8") as fh:
    live = json.load(fh)
for w, cn in ((SMC.W, "21026"), (BUTTE.W, "01312"), (CABRILLO.W, "45306"), (GAVILAN.W, "08464")):
    f = w.load(cn)
    run = str(f["extracted_run"])
    check(str(live["live_runs"][w.college][cn]) == run and live["read_at"].startswith("2026-11-27T"),
          "%s: the conductor's live read holds its row at run %s, the committed record's" % (cn, run))
    row = next(r for r in live["rows"] if r["college"] == w.college and r["cn"] == cn)
    check(row["checked"] is False and not row["gaps"] and row["arithmetic"] == "unequal",
          "%s: at the read the live row was unchecked, failing as unequal and carried no gap" % cn)
    other = B9.LiveRead(w.college, w.slug)
    other.live_read = lambda cn=cn: {cn: [("2026-11-27T07:31:18Z", "1")]}
    check(not other.on_live_run(f, skip=(M.TAG,)) or B.LiveRuns(w.college, w.slug).on_live_run(f, skip=(M.TAG,)),
          "%s: a live read naming another run does not prove its run" % cn)
for w, cn in ((SMC.W, "21026"), (CABRILLO.W, "45306"), (GAVILAN.W, "08464")):
    check(not B.LiveRuns(w.college, w.slug).on_live_run(w.load(cn), skip=(M.TAG,)),
          "%s: the committed receipts alone post no run for it (S740's hold)" % cn)


def bare(f):
    g = copy.deepcopy(f)
    g["score"].pop("gaps", None)
    g["score"].pop("confidence", None)
    return g


# ── Santa Monica 21026 ──
W = SMC.W
with open(os.path.join(ROOT, "kb", "program_total_differs.json"), encoding="utf-8") as fh:
    listed = json.load(fh)["colleges"][SMC.COLLEGE]
check(sorted(listed) == ["21026"], "the file lists Santa Monica's one program and no other")
f, e, x = W.load("21026"), SMC.REVIEWED["21026"], listed["21026"]
words = f["score"]["gaps"][0]["words"]
g = bare(f)
a = g["score"]["arithmetic"]
with open(os.path.join(ROOT, "kb", "college_reads", "s741_piles_santa_monica_cosmetology.json"), encoding="utf-8") as fh:
    plan = json.load(fh)
check(x["run"] == SMC.PAGE_READ and SMC.PAGE_READ in x["evidence"]
      and "s741_piles_santa_monica_cosmetology.json" in x["evidence"]
      and f["source_url"] == plan["pages"][0]["url"] + "#page=%d" % x["page"]
      and plan["pdf_span"][0] <= x["page"] <= plan["pdf_span"][1],
      "21026: the file's entry names the page read, its plan and the PDF page the record was read from")
check(B.same(a["computed"], x["printed_sum"]) and B.same(a["stated"], x["printed_total"])
      and B.same(e["computed"], x["printed_sum"]) and B.same(e["stated"], x["printed_total"]),
      "21026: the record holds the two figures the file lists (27.5 against the printed 26.5)")
check(NG.answer(g) is not None and NG.answer(g)[0] == "total_differs" and NG.total_differs(g) == words
      and W.gap_noted(g) == ("total_differs", words) and SMC.PAGE_READ in words,
      "21026: the record rule names total_differs, and the gap files the rule's own words")
check(NG.total_differs(g, {}) is None, "21026: a record the file does not list never takes the gap")
units = [S._num(c.get("units")) for b in g["record"]["blocks"] if b["rule"] == "all" for c in b["courses"]]
salon = [b for b in g["record"]["blocks"] if b["rule"] == "choose_units"]
check(len(units) == 23 and sum(units) == 25.5 and len(salon) == 1 and salon[0]["minimum"] == 2
      and B.same(B.pair(g["record"]["program"]["total_units"]), [26.5, 26.5]),
      "21026: 23 required courses add to 25.5, the Salon list asks 2 more, and the printed total is 26.5")
heading = g["record"]["program"]["section_heading"]
sister = W.load("03302")
check("03302" in W.shared_with("21026") and sister["title"] == f["title"]
      and sister["record"]["program"]["section_heading"] == heading
      and W.own(g, {"gap": "total_differs", "own_heading": heading}) is None,
      "21026: the Cosmetology A.S. was read from the same section under the same heading, which shows neither its own")
check(W.own(g, e) == "own_section" and any(e["own_section"] in n for n in B.notes(g)),
      "21026: its own note names the section as serving both awards")

# ── Butte 01312 ──
W = BUTTE.W
f, e = W.load("01312"), BUTTE.REVIEWED["01312"]
g = bare(f)
a = g["score"]["arithmetic"]
check(a["against"] == "degree" and a["major"]["status"] == "equal" and B.same(a["major"]["computed"], [39, 40])
      and B.same(a["ge"], [21, 21]) and B.same(a["computed"], [60, 61]) and B.same(a["stated"], [62, 69]),
      "01312: the major adds to its printed 39-40, general education is 21, and the two add to 60-61 under 62-69")
check(BUTTE.degree_rest(g, e) and W.gap_noted(g) is not None and W.gap_noted(g)[0] == "degree_electives_not_printed"
      and NG.answer(g) is None,
      "01312: S721's degree_rest stands, and no record rule names another kind")
h = copy.deepcopy(g)
h["record"]["program"]["electives_fill_degree"] = True
check(not BUTTE.degree_rest(h, e), "01312: with a word that electives fill the degree the shape names nothing")
h = copy.deepcopy(g)
h["record"]["program"]["degree_elective_units"] = {"min": 2, "max": 2}
check(not BUTTE.degree_rest(h, e), "01312: with an electives figure the shape names nothing")
words = f["score"]["gaps"][0]["words"]
check(e["words"] in words and e["also_words"] in words and " | " in words,
      "01312: both notes are filed, the map's total and its 2-unit Graduation Requirement line")
check(not W.shared_with("01312"), "01312: no other record was read from its page")

# ── Cabrillo 45306 ──
W = CABRILLO.W
f, e = W.load("45306"), CABRILLO.REVIEWED["45306"]
g = bare(f)
blocks = {b["name"]: b for b in g["record"]["blocks"]}
check(sorted(blocks) == ["Electives", "Required"] and B.same(B.pair(blocks["Required"]["stated"]), [13, 15])
      and B.same(B.pair(blocks["Electives"]["stated"]), [1, 3])
      and B.same(g["score"]["arithmetic"]["computed"], [14, 18]) and B.same(g["score"]["arithmetic"]["stated"], [16, 16]),
      "45306: two lists print 13-15 and 1-3, which add to 14-18 around the printed 16")
check(B.shape_depends(g, e) and W.gap_noted(g) is not None and W.gap_noted(g)[0] == "lists_not_closed"
      and NG.answer(g) is None,
      "45306: the Electives list's figure depends on the other choice, and no record rule names another kind")
words = f["score"]["gaps"][0]["words"]
check(e["words"] in words and e["also_words"] in words, "45306: both notes on the two figures are filed")
check(not W.shared_with("45306"), "45306: no other record was read from its page")

# ── Gavilan 08464 ──
W = GAVILAN.W
f, e = W.load("08464"), GAVILAN.REVIEWED["08464"]
g = bare(f)
with open(os.path.join(ROOT, GAVILAN.PLAN), encoding="utf-8") as fh:
    plan = json.load(fh)
check(not B.notes(g), "08464: the record carries no note, so its gap stands on the page's sentence")
check(plan["pages"][0]["url"] == g["source_url"] and plan["pages"][0].get("cq_view") is True
      and plan["_quoted"][GAVILAN.PAGE_READ]["remainder"] == GAVILAN.REMAINDER == e["words"],
      "08464: the page read's plan reads the record's own address and holds the sentence under its run")
words = f["score"]["gaps"][0]["words"]
check(words == W.page_words(g, e) and GAVILAN.REMAINDER in words and GAVILAN.PAGE_READ in words
      and W.gap_noted(g) == ("lists_not_closed", words) and NG.answer(g) is None,
      "08464: the words filed are the page's sentence with its page read, and no record rule names another kind")
check(GAVILAN.one_from_each(g, e) and len(g["record"]["blocks"]) == 5
      and B.same(g["score"]["arithmetic"]["computed"], [14, 20]) and B.same(g["score"]["arithmetic"]["stated"], [19, 19]),
      "08464: five lists of one course each print figures that add to 14-20 under the printed 19")
check(not GAVILAN.one_from_each(g, dict(e, words="Complete one course from each area.")),
      "08464: a sentence that names no minimum of 19 units names nothing")
h = copy.deepcopy(g)
h["record"]["blocks"][0]["minimum"] = 2
check(not GAVILAN.one_from_each(h, e), "08464: a list of two courses is another shape")
check(W.page_words(g, dict(e, page_read=dict(e["page_read"], run="45961506725"))) is None
      and W.page_words(g, dict(e, page_read=dict(e["page_read"], plan="kb/college_reads/no_such_plan.json"))) is None
      and W.page_words(g, dict(e, page_read=dict(e["page_read"], line="areas"))) is None
      and B9.page_quote(None) is None,
      "08464: another run, a missing plan or another quoted line files no words")
check(not W.shared_with("08464"), "08464: no other record was read from its page")

# ── the holds ──
for cn in ("06352", "06380", "06381", "44992"):
    f = CABRILLO.W.load(cn)
    rec = [b for b in f["record"]["blocks"] if b.get("rule") == "recommended"]
    if not rec:
        continue    # a later reconcile read the lists as units to choose: the lever was taken
    g = copy.deepcopy(f)
    for b in g["record"]["blocks"]:
        if b.get("rule") == "recommended":
            b["rule"], b["minimum"] = "choose_units", (b.get("stated") or {}).get("min")
    check(not f["score"].get("gaps") and B.C.fresh_score(g)["arithmetic"]["status"] == "equal",
          "%s: no gap filed, and with its Recommended lists read as units to choose today's scorer passes it" % cn)
for w, cn, run in ((SMC.W, "43767", "39567439681"), (BUTTE.W, "14583", "42973457189"),
                   (CABRILLO.W, "11293", "44090886950"), (GAVILAN.W, "45357", "38948144064")):
    f = w.load(cn)
    check(str(f["extracted_run"]) != run or not f["score"].get("gaps"),
          "%s: the record its hold was written on carries no gap" % cn)

sys.exit(t.done())

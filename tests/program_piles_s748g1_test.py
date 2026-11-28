#!/usr/bin/env python3
"""S748, worker gaps, batch s748g1: nine records at Allan Hancock and Mt. San Antonio, each collected with its gap
named, in one plan (kb/_program_piles_s748g1.py, kb/_program_piles_s748_hancock.py, kb/_program_piles_s748_mtsac.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record with a true gap is collected with the
gap named, never held. The gap census of 2026-11-28 00:44Z (run 46089216929) counts 31 filed records at the two
colleges as failing; no cheap-piles plan had read them (kb/collection_lane.py has held Allan Hancock out of every
plan since S681). The shared checks are tests/program_piles_s739_common.py's, run once a college. Pinned here:

  * the batch: two piles under one tag, the rows numbered 1 to 9 across them; each college's receipt names its own
    rows and the batch's nine members and carries the batch's one pre-read, one guarded UPDATE and one rollback;
  * THE GUARDED UPDATE, rebuilt here from two sources the SQL file is not: each row's before-image from its
    college's receipt, and its after-image from the load's own image of the committed record. The rebuilt text must
    be the file's, to the byte. The same comparison is then run against the file with one thing changed (a guard
    clause dropped, expect moved, an after-image's score moved, a before-image moved, the confirm guard dropped)
    and must fail each time: a test that passes on a changed guard, expect or after-image is the failure S748's
    reader found in a sibling plan's test;
  * the live run: the committed load and reread receipts post each row at the run its committed record holds;
  * the keys: the census's failing filed records at each college, 17 and 14;
  * each row's kind, by its own check: the four the record rules name in their own words, the two notes that quote
    both figures, the sum inside the printed range, the note that says no total is printed, and the list whose
    figure depends on another choice;
  * the holds: the eight Mt. San Antonio records today's scorer passes carry no gap (a free reconcile is their
    lever), and Viticulture Levels 2 and 3 place none of their courses.

Run from repo root: python3 tests/program_piles_s748g1_test.py
"""
import copy
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import program_piles_s739_common as T  # noqa: E402
import _program_piles_s742 as B9  # noqa: E402
import _program_piles_s748g1 as M  # noqa: E402

B, NG, S = B9.B, B9.NG, B9.S
P = B.P
ROOT = T.ROOT
DAY = "2026-11-28"
HANCOCK, MTSAC = M.HANCOCK, M.MTSAC
PILES = [HANCOCK.W, MTSAC.W]
AHC, MSAC = "Allan Hancock College", "Mt. San Antonio College"
ROWS = [(AHC, "05874", "ge_units_not_read"), (AHC, "12129", "noted_figures_differ"),
        (AHC, "19928", "lists_past_their_figure"), (AHC, "30363", "noted_figures_differ"),
        (AHC, "30934", "hours_total_differs"), (AHC, "31093", "hours_total_differs"),
        (AHC, "40003", "units_within_printed_range"),
        (MSAC, "37603", "lists_not_closed"), (MSAC, "44520", "noted_no_total")]
N = len(ROWS)

t = T.Checks()
check = t.check
_PAGE = ["free page read"]
T.run(HANCOCK.W, rows={cn: g for c, cn, g in ROWS if c == AHC},
      held={"07176": _PAGE, "18574": _PAGE, "19904": _PAGE, "19936": ["reconcile step"], "32611": _PAGE,
            "33594": _PAGE, "40002": _PAGE, "42487": ["repeat_read_once"], "42208": ["places none"],
            "42210": ["places none"]},
      scores={"ge_units_not_read": 50, "noted_figures_differ": 40, "lists_past_their_figure": 60,
              "hours_total_differs": 30, "units_within_printed_range": 50},
      day=DAY, boundaries=22, prior_held=set(HANCOCK.KEYS), t=t, batch_rows=N)
T.run(MTSAC.W, rows={cn: g for c, cn, g in ROWS if c == MSAC},
      held=dict({cn: ["today's scorer passes it", "free reconcile"] for cn in MTSAC.RESCORE},
                **{"10180": ["reconcile step"], "18242": ["pool_figure_not_read"], "31865": ["repeat_read_once"],
                   "38731": ["pool_figure_not_read"]}),
      scores={"lists_not_closed": 30, "noted_no_total": 40},
      day=DAY, boundaries=8, prior_held=set(MTSAC.KEYS), t=t, batch_rows=N)

# ── the batch ──
check(M.BATCH.tag == M.TAG == "s748g1" and M.BATCH.piles == PILES and all(w.tag == M.TAG for w in PILES),
      "one batch of two piles under one tag")
receipts = []
for w in PILES:
    with open(w.receipt_path(DAY), encoding="utf-8") as fh:
        receipts.append(json.load(fh))
members = [[c, cn, i] for i, (c, cn, _) in enumerate(ROWS, 1)]
check(all(r["batch"]["tag"] == M.TAG and r["batch"]["rows"] == N and r["batch"]["members"] == members
          and r["batch"]["colleges"] == [w.college for w in PILES] for r in receipts),
      "every receipt names the batch's nine members, numbered across the piles")
check([[x["college"], x["control_number"], x["i"], x["moves_to"]] for r in receipts for x in r["records"]]
      == [[c, cn, i, g] for i, (c, cn, g) in enumerate(ROWS, 1)],
      "each receipt holds its own college's rows, at their numbers in the batch")
MIG = os.path.join(ROOT, "kb", "migrations", "%s_%s_prreq_piles_%%s.sql" % (DAY, M.TAG))
for part, key in (("apply", "apply"), ("preread", "pre_read"), ("preread_md5", "pre_read_md5"), ("rollback", "rollback")):
    with open(MIG % part, encoding="utf-8") as fh:
        sql = fh.read()
    check(len({r[key] for r in receipts}) == 1 and sql.endswith(receipts[0][key] + "\n"),
          "%s: one text, in the file and in every receipt" % part)
    check(all("'%s'" % cn in sql for _, cn, _ in ROWS) and all(c.replace("'", "''") in sql for c, _, _ in ROWS),
          "%s names the nine rows and their colleges" % part)

# ── the guarded UPDATE, rebuilt from the receipts' before-images and the load's own after-images ──
with open(MIG % "apply", encoding="utf-8") as fh:
    apply_sql = fh.read()
images = NG._load_images({AHC, MSAC})
rebuilt_rows = []
for r in (x for rc in receipts for x in rc["records"]):
    img = images[(r["college"], r["control_number"])]
    rebuilt_rows.append({"i": r["i"], "college": r["college"], "control_number": r["control_number"],
                         "extracted_run": img["extracted_run"],
                         "before_image": {"record": r["before_image"]["record"], "checks": r["before_image"]["checks"]},
                         "after_image": {"checks": img["checks"]}})
REBUILT = P.confirm_guarded_apply(rebuilt_rows, M.TAG + " piles")
GUARDS = ("r.extracted_run = v.extracted_run", "r.checks = v.before_checks", "r.record = v.before_record",
          "r.checked is not true", "e(expect) as (values (%d))" % N, "when s.n = e.expect - c.n",
          "when f.n > 0", "lv.verdict = 'confirm' and lv.requirements_fp = public.program_record_fp(r.record)")


def body(sql: str) -> str:
    """The SQL below the file's comment header."""
    return "".join(ln for ln in sql.splitlines(True) if not ln.startswith("--"))


def stands(sql: str) -> bool:
    """The file is the plan: the rebuilt UPDATE to the byte, and each guard clause in it exactly once."""
    return body(sql) == REBUILT + "\n" and all(sql.count(g) == 1 for g in GUARDS)


check(stands(apply_sql), "the apply file is the UPDATE rebuilt from the receipts' before-images and the load's "
                         "after-images, with every guard clause once")
check([r["i"] for r in rebuilt_rows] == list(range(1, N + 1))
      and all(str(r["extracted_run"]) == str(images[(r["college"], r["control_number"])]["extracted_run"])
              for r in rebuilt_rows), "the nine rows are numbered 1 to 9, each on its committed record's run")
for r in rebuilt_rows:
    before, after = r["before_image"]["checks"], r["after_image"]["checks"]
    kind = next(g for c, cn, g in ROWS if (c, cn) == (r["college"], r["control_number"]))
    check(not before.get("gaps") and "confidence" not in before and after.get("gaps") == [kind]
          and after["confidence"]["unit_arithmetic"] == NG.ARITH_SCORE[kind]
          and {k: v for k, v in after.items() if k not in ("gaps", "confidence")} == before,
          "%s: the after-image is the before-image with its one gap and its scores added, nothing else moved"
          % r["control_number"])
first = rebuilt_rows[0]
moved_after = copy.deepcopy(first)
moved_after["after_image"]["checks"]["confidence"]["unit_arithmetic"] += 1
moved_before = copy.deepcopy(first)
moved_before["before_image"]["checks"]["arithmetic"] = "equal"
CHANGED = {
    "the run guard dropped": apply_sql.replace("r.extracted_run = v.extracted_run and ", ""),
    "the before-checks guard dropped": apply_sql.replace(" and r.checks = v.before_checks", ""),
    "the before-record guard dropped": apply_sql.replace(" and r.record = v.before_record", ""),
    "the person's-check guard dropped": apply_sql.replace("   and r.checked is not true\n", ""),
    "expect moved": apply_sql.replace("e(expect) as (values (%d))" % N, "e(expect) as (values (%d))" % (N - 1)),
    "the count test dropped": apply_sql.replace("when s.n = e.expect - c.n", "when true"),
    "the confirm guard dropped": apply_sql.replace("when f.n > 0", "when false"),
    "an after-image's score moved": apply_sql.replace(NG._values([first]), NG._values([moved_after])),
    "a before-image moved": apply_sql.replace(NG._values([first]), NG._values([moved_before])),
    "a row dropped": apply_sql.replace(NG._values([rebuilt_rows[-1]]), NG._values([rebuilt_rows[-2]])),
}
for what, sql in CHANGED.items():
    check(sql != apply_sql, "%s: the change lands on the file's text" % what)
    check(not stands(sql), "%s: the test fails on it" % what)
with open(MIG % "rollback", encoding="utf-8") as fh:
    rollback_sql = fh.read()
check(rollback_sql.endswith("\n" + NG.rollback_sql(rebuilt_rows, M.TAG + " piles rollback") + "\n"),
      "the rollback file is the rollback rebuilt from the same before-images and after-images")
try:
    B9.Batch(tag="s748g1", piles=[HANCOCK.W, HANCOCK.W])
    two = False
except SystemExit:
    two = True
try:
    B9.Batch(tag="s748zz", piles=PILES)
    other = False
except SystemExit:
    other = True
check(two and other, "a batch refuses two piles of one college, and a pile under another tag")

# ── the live run and the keys ──
for w, cns in ((HANCOCK.W, [cn for c, cn, _ in ROWS if c == AHC]), (MTSAC.W, [cn for c, cn, _ in ROWS if c == MSAC])):
    posted = B.LiveRuns(w.college, w.slug).posted_runs(skip=(M.TAG,))
    for cn in cns:
        f = w.load(cn)
        check(bool(posted.get(cn)) and max(posted[cn])[1] == str(f["extracted_run"]),
              "%s: the committed load and reread receipts post its row at run %s, the committed record's"
              % (cn, f["extracted_run"]))
check(len(HANCOCK.KEYS) == 17 and len(MTSAC.KEYS) == 14 and len(MTSAC.RESCORE) == 8
      and set(MTSAC.RESCORE) < set(MTSAC.KEYS), "the keys are the census's 17 and 14 failing filed records")


def bare(f):
    g = copy.deepcopy(f)
    g["score"].pop("gaps", None)
    g["score"].pop("confidence", None)
    return g


# ── Allan Hancock ──
W = HANCOCK.W
for cn, kind in (("05874", "ge_units_not_read"), ("19928", "lists_past_their_figure"),
                 ("30934", "hours_total_differs"), ("31093", "hours_total_differs")):
    f = W.load(cn)
    g = bare(f)
    words = f["score"]["gaps"][0]["words"]
    check(NG.answer(g) is not None and NG.answer(g) == (kind, words) and W.gap_noted(g) == (kind, words),
          "%s: the record rule names %s, and the gap files the rule's own words" % (cn, kind))
g = bare(W.load("05874"))
check(g["score"]["arithmetic"]["major"]["status"] == "equal" and g["record"]["program"]["ge_pattern"]
      and g["score"]["arithmetic"].get("ge") is None,
      "05874: the major adds to its printed total, a pattern is named, and no units were read for it")
for cn in ("30934", "31093"):
    check(W.load(cn)["record"]["program"]["measure"] == "hours", "%s: the program is measured in hours" % cn)
for cn in ("12129", "30363"):
    f, e = W.load(cn), HANCOCK.REVIEWED[cn]
    g = bare(f)
    note = next(n for n in B.notes(g) if e["words"] in n)
    check(e["quotes"]["stated"] in note and e["quotes"]["computed"] in note and B.shape_note_quotes(g, e)
          and W.gap_noted(g) == ("noted_figures_differ", note) and NG.answer(g) is None,
          "%s: one note quotes both figures, the record states one and adds to the other, and no record rule "
          "names another kind" % cn)
    h = copy.deepcopy(g)
    h["score"]["arithmetic"]["computed"] = h["score"]["arithmetic"]["stated"]
    check(not B.shape_note_quotes(h, e), "%s: a record that adds to the stated figure is another shape" % cn)
f, e = W.load("40003"), HANCOCK.REVIEWED["40003"]
g = bare(f)
check(NG.units_within_printed_range(g) is not None and B.same(g["score"]["arithmetic"]["computed"], [22, 22])
      and B.same(g["score"]["arithmetic"]["stated"], [21, 22]) and e["words"] in f["score"]["gaps"][0]["words"]
      and W.gap_noted(g) is not None and W.gap_noted(g)[0] == "units_within_printed_range",
      "40003: the sum of 22 sits inside the printed 21-22 above its low end, and the note that says why is filed")
for cn in ("42208", "42210"):
    f = W.load(cn)
    check(not f["score"]["coverage"]["pass"] and f["score"]["coverage"]["placed"] == 0 and not f["score"].get("gaps")
          and not NG.collectable(f["score"]), "%s: places none of its courses, so no gap collects it" % cn)

# ── Mt. San Antonio ──
W = MTSAC.W
f, e = W.load("44520"), MTSAC.REVIEWED["44520"]
g = bare(f)
check(g["score"]["arithmetic"]["stated"] is None and B.shape_no_total(g, e)
      and B.pair(g["record"]["program"]["total_units"]) is None
      and W.gap_noted(g) is not None and W.gap_noted(g)[0] == "noted_no_total" and NG.answer(g) is None,
      "44520: the record states no total, its note says the catalog states none, and no record rule names another")
f, e = W.load("37603"), MTSAC.REVIEWED["37603"]
g = bare(f)
blocks = {b["name"]: b for b in g["record"]["blocks"]}
check(sorted(blocks) == ["Core Course", "List A", "List B"] and blocks["List B"]["rule"] == "choose_units"
      and B.same(B.pair(blocks["List B"]["stated"]), [6, 10]) and B.shape_depends(g, e)
      and B.same(g["score"]["arithmetic"]["computed"], [17, 22]) and B.same(g["score"]["arithmetic"]["stated"], [18, 22])
      and W.gap_noted(g) is not None and W.gap_noted(g)[0] == "lists_not_closed" and NG.answer(g) is None,
      "37603: List B prints 6-10, its figure depends on the List A choice, and the lists add to 17-22 under 18-22")
words = f["score"]["gaps"][0]["words"]
check(e["words"] in words and e["also_words"] in words and " | " in words,
      "37603: both notes are filed, the HRM 52 rule and List B taking List A's unused courses")
for cn in MTSAC.RESCORE:
    f = W.load(cn)
    if S.passes_live(f["score"]):
        continue    # a later reconcile rescored it: the lever was taken
    check(not f["score"].get("gaps") and B.arithmetic(f).get("status") == "equal" and W.gap_noted(f) is None,
          "%s: no gap filed, and today's scorer passes the committed record against the state's list" % cn)

sys.exit(t.done())

#!/usr/bin/env python3
"""S748, lane 2's cheap piles, batch s748c: a new named reading, state_course_not_on_page, and its first plan
(kb/_program_named_gaps.py, kb/_program_piles_s748c.py).

WHY. Sam's ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17): a record is collected, never held for a reread
that brings nothing. Thirty-odd filed records fail on coverage alone: the state's list names a course the record
neither places nor explains, and the committed capture of the program's own page finds that course on no line. S720
held them as 'coverage fails'. The reading names the course from the capture's finding, and the plan rescores
coverage with the course explained, as a reader's own 'not in the text' explains one. Pinned here:

  * the reading: its name and sentence; it is no gap kind (a passing score carries no gap) and no record rule (a
    reviewed list alone files it);
  * the self-recall over every filed record, against answers the readers hold (NG.state_course_recall). The recall
    can report a wrong, and does: a placed course the capture finds on no line is a wrong. Its counts are bounded
    here (wrong under 0.2% of the placed courses asked; at least 5,000 of the readers' 'not in the text' agreed
    with; the reading's fires on held answers under 6% wrong), and a made-up record shows each answer;
  * the evidence's edges, 9 readings a row: the capture finds the course, read another address, or reached its cap;
    a placed course it does not find; the record explains the course; invented or the units check failing; a note
    that the list is cut off; an entry naming another course;
  * the plan: three rows at two colleges under one batch; each row's before-image fails coverage alone and its
    after-image is the load's image of the committed record: coverage true and nothing else moved, no gap, the
    record unchanged, the row passing as the live table counts it; the reconcile's keep_named_gaps leaves each
    committed score as it is; the four SQL files are the receipts' own, the UPDATE expects 3, a second run plans
    none;
  * the holds: City College of San Francisco 32079 (the own-page guard) and 41315 (the capture finds the course);
  * where the evidence stands statewide on a record still failing, by college, for the conductor to assign.

Run from repo root: python3 tests/program_piles_s748c_test.py
"""
import collections
import glob
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_piles_s748c as M  # noqa: E402
import _program_requirements_college as PRC  # noqa: E402

B, NG, S, C = M.B, M.NG, M.S, M.C
DAY = "2026-11-28"
READING = "state_course_not_on_page"
ROWS = [("Orange Coast College", "43100", "PSYC A160"), ("Fullerton College", "18749", "THEA 231 F"),
        ("Fullerton College", "36863", "PE 108 F")]
N = len(ROWS)
PILES = {"Orange Coast College": M.OCC, "Fullerton College": M.FULLERTON}
checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


# ── the reading ──
check(M.READING == NG.STATE_COURSE == READING and "does not print" in NG.STATE_COURSE_SENTENCE,
      "the reading has its name and sentence")
check(READING not in NG.GAPS and READING not in NG.ARITH_SCORE and READING not in [n for n, _ in NG.RECORD_RULES],
      "it is no gap kind and no record rule: a reviewed list files it, and a passing score carries no gap")

# ── the self-recall, over every filed record ──
every, sources = [], {}
for d in sorted(glob.glob(os.path.join(NG.COLLEGE_DIR, "*"))):
    recs = []
    for p in glob.glob(os.path.join(d, "records", "*.json")):
        with open(p, encoding="utf-8") as fh:
            f = json.load(fh)
        if isinstance(f, dict) and isinstance(f.get("record"), dict):
            recs.append(M.as_scored(f))
    if not recs:
        continue
    college = recs[0].get("college")
    try:
        with open(os.path.join(d, "sources.json"), encoding="utf-8") as fh:
            for x in json.load(fh):
                sources[(college, str(x.get("control_number")))] = x
    except (OSError, ValueError):
        pass
    every += recs
rc = NG.state_course_recall(every, sources, C.closed_list)
asked = rc["on_page_right"] + rc["on_page_wrong"]
fires = rc["not_on_page_right"] + rc["on_page_wrong"]
print("self-recall: %d records; held 'on the page': right %d, wrong %d (%.3f%%); held 'not on the page': right %d, "
      "missed %d; of %d fires on held answers %d are wrong (%.1f%%)"
      % (rc["records"], rc["on_page_right"], rc["on_page_wrong"], 100.0 * rc["on_page_wrong"] / asked,
         rc["not_on_page_right"], rc["not_on_page_missed"], fires, rc["on_page_wrong"],
         100.0 * rc["on_page_wrong"] / fires))
check(rc["records"] > 15000 and asked > 150000 and 0 < rc["on_page_wrong"] < 0.002 * asked,
      "the capture misses a placed course on under 0.2%% of those asked, and the recall reports each: %d of %d"
      % (rc["on_page_wrong"], asked))
check(rc["not_on_page_right"] >= 5000 and rc["not_on_page_right"] > 5 * rc["not_on_page_missed"]
      and rc["on_page_wrong"] < 0.06 * fires,
      "the capture agrees with at least 5,000 of the readers' 'not in the text', and under 6% of the reading's fires "
      "on held answers are wrong")
# A made-up record shows each answer: a placed course the capture misses (a wrong), then every placed course found
# and a course the reader calls not in the text that the capture does not find (a right).
toy = {"college": "Toy College", "control_number": "00001", "source_url": "https://toy/p",
       "record": {"missing_explained": [{"code": "ABC 3", "why": "not in the text"}]},
       "score": {"coverage": {"missing": ["ABC3"]}}}
toy_closed = [{"code": "ABC 1"}, {"code": "ABC 2"}, {"code": "ABC 3"}]
toy_src = {("Toy College", "00001"): {"source": {"url": "https://toy/p"}, "text_chars": 900, "codes_found": ["ABC1"]}}
t1 = NG.state_course_recall([toy], toy_src, lambda *_: toy_closed)
check(t1.get("on_page_right", 0) == 0 and t1["on_page_wrong"] == 1 and t1.get("not_on_page_right", 0) == 0
      and t1["wrong_by_college"] == {"Toy College": 1},
      "a placed course the capture finds on no line is reported as a wrong")
toy_src[("Toy College", "00001")]["codes_found"] = ["ABC1", "ABC2"]
t2 = NG.state_course_recall([toy], toy_src, lambda *_: toy_closed)
check(t2["on_page_right"] == 2 and not t2.get("on_page_wrong") and t2["not_on_page_right"] == 1,
      "with every placed course found, the reader's 'not in the text' the capture agrees with is a right")

# ── the evidence's edges ──
for w in PILES.values():
    bd = w.boundaries()
    rows = [r for r in ROWS if r[0] == w.college]
    check(not bd["wrong"] and sum(bd["counts"].values()) == 9 * len(rows) and len(bd["counts"]) == 9,
          "%s: every one of the 9 boundary readings a row passes nothing: %s" % (w.name, bd))

# ── the plan ──
check(M.BATCH.tag == "s748c" and M.BATCH.piles == [M.OCC, M.FULLERTON] and M.BATCH.session == "S748",
      "one batch of two piles under one tag")
receipts = {}
for w in PILES.values():
    with open(w.receipt_path(DAY), encoding="utf-8") as fh:
        receipts[w.college] = json.load(fh)
members = [[c, cn, i] for i, (c, cn, _) in enumerate(ROWS, 1)]
check(all(r["batch"]["members"] == members and r["batch"]["rows"] == N and r["representation"] == M.REPRESENTATION
          and "checks.coverage to true" in r["representation"] and r["by"] == {B.PASSES: r["moved"]}
          and r["gaps"] == {} and not r["held"] for r in receipts.values()),
      "every receipt names the batch's three members, files no gap, and says what the plan writes to checks.coverage")
images = NG._load_images(set(PILES))
for i, (college, cn, code) in enumerate(ROWS, 1):
    w = PILES[college]
    r = next(x for x in receipts[college]["records"] if x["control_number"] == cn)
    bc, ac = r["before_image"]["checks"], r["after_image"]["checks"]
    check(r["i"] == i and r["moves_to"] == B.PASSES and r["reading"] == READING and r["own"] == "its page is its own"
          and not w.shared_with(cn),
          "%s: the row is the batch's number %d, under the reading's name, on a page no other record was read from"
          % (cn, i))
    check(bc.get("coverage") is False and bc.get("invented") is True and bc.get("arithmetic") == "equal"
          and not bc.get("gaps"), "%s: before, the row fails on coverage alone and carries no gap" % cn)
    check(ac == dict(bc, coverage=True) and not ac.get("gaps"),
          "%s: after, coverage is true and nothing else in the checks moves; no gap" % cn)
    check(B.F.row_passes(ac) and S.counts_passing_on_tab(ac) and not S.counts_passing_on_tab(bc),
          "%s: the row passes as the live table counts it once applied, and did not before" % cn)
    f = w.load(cn)
    img = images[(college, cn)]
    check(img["checks"] == ac and img["record"] == r["before_image"]["record"],
          "%s: the load's image of the committed record is the receipt's after-image, the record unchanged" % cn)
    cov = f["score"]["coverage"]
    check(cov["pass"] is True and cov["unexplained"] == [] and [S.norm_code(c) for c in cov["not_on_page"]]
          == [S.norm_code(code)] and cov["as_scored"] == {"pass": False, "unexplained": cov["not_on_page"]}
          and cov["rescored"] == M.RESCORED and not f["score"].get("gaps") and S.passes_live(f["score"]),
          "%s: the committed score passes, carries no gap and keeps the scorer's own coverage beside the rescored one"
          % cn)
    kept = PRC.keep_named_gaps(cn, f["score"], dict(f["score"]), f)
    check(kept == f["score"], "%s: the reconcile's keep_named_gaps leaves the committed score as it is" % cn)
    g = M.as_scored(f)
    fresh = C.fresh_score(g)["coverage"]
    check(g["score"]["coverage"]["pass"] is False and not S.passes_live(g["score"]) and fresh["pass"] is False
          and [S.norm_code(c) for c in fresh["unexplained"]] == [S.norm_code(code)],
          "%s: today's scorer still reads %s as the one unexplained course" % (cn, code))
    ev = w.evidence(g)
    got = w.passing_score(g)
    check(ev is not None and ev["not_on_page"] == [code] and got is not None and got[0] == f["score"]
          and got[1] == r["words"] and code in r["words"] and "on no line" in r["words"] and NG.answer(g) is None,
          "%s: the capture's evidence stands on the record as scored, the rescore is the committed score, the words "
          "name %s, and no record rule names a gap" % (cn, code))
    check(w.on_live_run(f) and w.on_live_run(f, skip=(M.TAG,)), "%s: the row is on its live run" % cn)
for part, key in (("apply", "apply"), ("preread", "pre_read"), ("preread_md5", "pre_read_md5"), ("rollback", "rollback")):
    with open(os.path.join(ROOT, "kb", "migrations", "%s_%s_prreq_piles_%s.sql" % (DAY, M.TAG, part)),
              encoding="utf-8") as fh:
        sql = fh.read()
    bodies = {r[key] for r in receipts.values()}
    check(len(bodies) == 1 and sql.endswith(bodies.pop() + "\n") and "checks.coverage to true" in sql,
          "%s: one text, in the file and in every receipt, under a header that names the coverage rescore" % part)
    check(all("'%s'" % cn in sql for _, cn, _ in ROWS), "%s names the three rows" % part)
with open(os.path.join(ROOT, "kb", "migrations", "%s_%s_prreq_piles_apply.sql" % (DAY, M.TAG)), encoding="utf-8") as fh:
    apply_sql = fh.read()
check(apply_sql.count("e(expect) as (values (%d))" % N) == 1 and "r.checked is not true" in apply_sql
      and "r.extracted_run = v.extracted_run and r.checks = v.before_checks and r.record = v.before_record" in apply_sql,
      "the one UPDATE expects the batch's three rows, each on its run, its before-image and no person's check")
check(all(w.plan(write=False)["rows"] == [] for w in PILES.values()), "a second run plans none")

# ── the holds ──
W = M.CCSF
f = W.load("32079")
check(W.evidence(M.as_scored(f)) is not None and W.own(f, {"gap": "total_differs"}) is None
      and "46300" in W.shared_with("32079") and "own-page guard" in W.hand["32079"] and not S.passes_live(f["score"]),
      "32079: the capture finds MATH 115 on no line, and the own-page guard refuses the record (a page 46300 shares)")
f = W.load("41315")
check(W.evidence(M.as_scored(f)) is None and "PSYC23" in {S.norm_code(c) for c in W.sources()["41315"]["codes_found"]}
      and W.hand["41315"].startswith("held") and not S.passes_live(f["score"]),
      "41315: the capture finds PSYC 23 in its window, so the reading does not stand")

# ── where the evidence stands statewide, on the records as scored ──
stands = collections.defaultdict(list)
for f in every:
    key = (f.get("college"), str(f.get("control_number")))
    if NG.state_course_evidence(f, sources.get(key), C.closed_list(*key)):
        stands[key[0]].append(key[1])
mine = {c: sorted(v) for c, v in stands.items() if c in PILES or c == W.college}
print("the evidence stands at: %s" % "; ".join("%s %s" % (c, ", ".join(sorted(v))) for c, v in sorted(stands.items())))
check(mine == {"Orange Coast College": ["43100"], "Fullerton College": ["18749", "36863"], W.college: ["32079"]},
      "at this lane's colleges the evidence stands on the plan's three rows and on 32079, which the own-page guard "
      "holds: %s" % mine)

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)

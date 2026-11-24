#!/usr/bin/env python3
"""S721, lane 1: one figure printed over several lists together, read as one pool, and the plan s721p
(kb/_program_requirements_score.py pooled_figures and pool_span; kb/_program_pooled_s721.py).

WHY. S720 filed the named gap pool_figure_not_read on records whose notes name one parent figure over several lists
(f-pool-figure-gaps-pass-when-pooled-s720) and held Modesto Junior's plan s720j for the rule
(d-modesto-held-pooled-rule-s720). A record today's scorer passes is never gap-filed (p-scorer-passes-guard-s720), so a
record the pooled reading passes loses the gap through the rescore. Pinned here:

  * the reading on built records: a heading split over sub-lists, lists named by letter, a figure equal to the
    program's total, the sentences that name no pool, two figures over the same parts, a cut-off read, parts that
    cannot reach a fixed figure, and the switch;
  * the held answers (S720's #3756 negatives, Modesto's eight, the sixteen applied rows) through the module's own
    classify, against the records the plan rescored;
  * the self-recall, live (#3764's second reader): the reading over every committed record against a hand answer for
    each record it fires on (POOLS_HELD; right, wrong and the pinned misses), the flips over every record it fires on
    (no pass-to-fail; the 28 fail-to-pass the fixture pins, each naming the sentence that prints its figure), and the
    sentences the second reader found misread, refused on built records;
  * the plan: the rows and held keys pinned in the fixture (tests/fixtures/pooled_figure_s721.json, never the live
    census), named exactly by the receipt and the four SQL files, the confirm guard, a second run plans none, and the
    load's image of each committed record is its receipt's after-image.

Run from repo root: python3 tests/program_pooled_figure_s721_test.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIXTURE = os.path.join(ROOT, "tests", "fixtures", "pooled_figure_s721.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-24_s721p_prreq_pooled_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_pooled_s721 as W  # noqa: E402
import _program_requirements_score as S  # noqa: E402

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


def blk(name, rule, minimum=None, stated=None, units=(), group=None):
    return {"name": name, "rule": rule, "minimum": minimum, "option_group": group, "stated": stated,
            "courses": [{"code": "X %d" % i, "units": u} for i, u in enumerate(units)]}


def rec(blocks, notes, total):
    return {"program": {"measure": "units", "total_units": {"min": total[0], "max": total[1]}},
            "blocks": blocks, "notes": notes}


def units(r):
    return S.program_units(r, {})


# ── the reading on built records ──────────────────────────────────────────
breadth = [blk("CAREER - COMPLETE 5 UNITS", "all", units=(5,)),
           blk("SCIENCE BREADTH COURSES", "choose_units", 6, {"min": 6, "max": 9}, (3, 3, 3)),
           blk("SCIENCE BREADTH COURSES", "choose_units", 0, {"min": 0, "max": 3}, (3, 3)),
           blk("MAJOR - COMPLETE 12 UNITS", "all", units=(6, 6))]
note = "The Science Breadth section requires 9 units total, split as 6-9 units and 0-3 units."
r = rec(breadth, [note], (26, 26))
check(units(rec(breadth, [], (26, 26)))[0] == (23.0, 29.0), "with no note, the parts add up (23-29)")
check(units(r)[0] == (26.0, 26.0), "a heading split over two sub-lists reads its 9 once (26)")
check(S.score(r, [], "")["arithmetic"]["status"] == "equal", "the pooled record passes")
check(S.score(r, [], "")["arithmetic"]["pooled"][0]["figure"] == [9.0, 9.0], "the score names the pool it read")
check(units(rec(breadth, ["The Science Breadth section is printed as two lists of 6-9 and 0-3 units."], (26, 26)))[0]
      == (23.0, 29.0), "a sentence printing no figure over its parts reads no pool")
check(units(rec(breadth, ["The Science Breadth section requires 9 units total."], (26, 26)))[0] == (23.0, 29.0),
      "a figure with no word saying the parts are taken together reads no pool")
check(units(rec(breadth, [note, "The Science Breadth section requires 8 units total, split as two lists."],
                (26, 26)))[0] == (23.0, 29.0), "two figures over the same parts read no pool")
cut = rec(breadth, [note, "The Category C list is cut off after 'X 4' with no units printed; further courses may "
                         "follow on the full page."], (26, 26))
cut["missing_explained"] = [{"code": "X 9", "why": "not in the text read"}]
check(S.window_cut(cut) and units(cut)[0] == (23.0, 29.0),
      "a reader's note saying the list is cut off refuses the pool (Fullerton 18166)")
lists = [blk("Required", "all", units=(33,)), blk("List A: Select 3 to 5 units", "choose_units", 3, {"min": 3, "max": 5}),
         blk("List B: Select 3 to 9 units", "choose_units", 3, {"min": 3, "max": 9}),
         blk("List C: May select 3 or 6 units", "choose_units", 0, {"min": 3, "max": 6})]
check(units(rec(lists, ["Lists B and C together require a total of 9 units: List B 3-9 units."], (45, 47)))[0]
      == (45.0, 47.0), "lists named by letter read their one figure (45-47)")
check(units(rec(lists, ["Lists B and D together require a total of 9 units."], (45, 47)))[0] == (42.0, 53.0),
      "a letter no block carries reads no pool")
fill = [blk("Required Core", "all", units=(5,)), blk("a minimum of 4 units (List A)", "choose_units", 4),
        blk("a minimum of 3 units (List B)", "choose_units", 3)]
fn = "Additional courses from List A or List B must be completed to achieve 18 total units."
check(units(rec(fill, [fn], (18, 18)))[0] == (18.0, 18.0), "the program's printed total over its lists fills it (18)")
check(units(rec(fill, [fn], (20, 20)))[0] == (12.0, 12.0), "a figure apart from the printed total and its parts reads none")
check(units(rec(fill, ["Additional courses must be completed to achieve 18 total units."], (18, 18)))[0]
      == (12.0, 12.0), "a total figure naming no list, area or group reads none")
check(S.pool_span((9, 9), False, 1, 6, False) is None, "parts that cannot run past their figures never reach 9")
check(S.pool_span((9, 9), False, 10, 12, False) == (10, 10), "a part's own floor still binds past the figure")
check(S.pool_span((6, 6), True, 3, 10, False) == (6, 10), "a minimum lets the parts' high end stand")
check(S.pool_span((18, 22), False, 4, 10, True) == (18, 22), "open lists reach a printed range")
S.POOLED_ON = False
check(units(r)[0] == (23.0, 29.0), "POOLED_ON off reads no pool")
S.POOLED_ON = True

# ── the held answers ──────────────────────────────────────────────────────
ha = W.held_answers()
check(ha["read"] == len(W.HELD_ANSWERS) == 29 and ha["right"] == ha["read"] and not ha["wrong"],
      "the held answers, %d of %d: %s" % (ha["right"], ha["read"], ha["wrong"]))
check(set(W.REVIEWED_S720J) == {cn for (c, cn), v in W.HELD_ANSWERS.items() if c == W.MODESTO}
      and not set(W.HELD_S720J) & set(W.REVIEWED_S720J) and len(W.HELD_S720J) == 13,
      "Modesto's eight are pinned and its 13 held stay apart")

# ── the self-recall, live (#3764's second reader, finding 1) ──────────────
# Every committed record the reading fires on, read against the hand answer each holds (POOLS_HELD): no figure read
# that the hand reading lacks, no record fired on without a hand answer, and the misses pinned.
every = W.every_record()
scan = W.live_scan(every)
check(scan["read"] == len(W.POOLS_HELD) == 55 and scan["fired"] == 38,
      "the scan reads the 55 hand-held records, 38 of them firing (%d, %d)" % (scan["read"], scan["fired"]))
check(scan["right"] == 55 and not scan["wrong"], "the live recall: %d right, wrong %s" % (scan["right"], scan["wrong"]))
check({tuple(m) for m in scan["missed"]} == W.POOLS_MISSED, "the misses are the four pinned: %s" % scan["missed"])
flips = W.live_flips(every)
with open(FIXTURE, encoding="utf-8") as fh:
    fx = json.load(fh)
check(not flips.get("pass_to_fail"), "no pass-to-fail, live: %s" % flips.get("pass_to_fail"))
check([{"college": c, "control_number": cn} for c, cn in flips.get("fail_to_pass") or []]
      == sorted(fx["fail_to_pass"], key=lambda m: (m["college"], m["control_number"])),
      "the live fail-to-pass members are the fixture's 28 (%d)" % len(flips.get("fail_to_pass") or []))
for c, cn in flips.get("fail_to_pass") or []:
    pools = S.pooled_figures(W.load(c, cn)["record"])
    check(pools and all(p["words"] and S._pool_figure(p["words"]) for p in pools),
          "%s %s: its pool names the sentence that prints its figure" % (c, cn))
# The second reader's sentences, refused on built records.
lists2 = [blk("Core", "all", units=(5,)), blk("a minimum of 4 units (List A)", "choose_units", 4),
          blk("a minimum of 3 units (List B)", "choose_units", 3)]
for words in ("The block's stated total of 12 units is taken from 'Total Required Units: 12.0', which covers the whole "
              "Major Field list.",
              "The required course list continues across a page break; the total of 12 units was read from page 92.",
              "Block minimums fall short of the stated total of 12 units; how the rest are chosen is not stated (likely "
              "from either list).",
              "Lists A and B are not combined toward the total of 12 units."):
    check(not S.pooled_figures(rec(lists2, [words], (12, 12))), "refused: %s" % words[:60])
check(S.pooled_figures(rec(lists2, ["Additional courses from List A or List B must be completed to achieve 12 total "
                                    "units."], (12, 12))), "a completing sentence still fills the total")
swapped = [blk("CAREER - COMPLETE 5 UNITS", "all", units=(5,)),
           blk("SCIENCE BREADTH COURSES", "choose_units", 6, {"min": 6, "max": 9}, (3, 3, 3)),
           blk("SCIENCE BREADTH COURSES", "choose_units", 0, None, (3, 3)),
           blk("MAJOR COURSES", "all", units=(6, 6)), blk("MAJOR COURSES", "all", units=(3,))]
two = ("Container headings 'MAJOR COURSES - COMPLETE 15 UNITS' (Total 15) and 'SCIENCE BREADTH COURSES - COMPLETE 9 "
       "UNITS' (Total 9) hold no courses directly; their sub-blocks are recorded.")
check(not S.pooled_figures(rec(swapped, [two], (29, 29))), "a sentence printing two headings' figures reads none")
check([p["figure"] for p in S.pooled_figures(rec(swapped, ["'SCIENCE BREADTH COURSES - COMPLETE 9 UNITS' is a container "
                                                           "over two nested blocks."], (29, 29)))] == [(9.0, 9.0)],
      "a heading's figure binds to its own heading")

# ── the plan, read from the fixture ───────────────────────────────────────
with open(os.path.join(ROOT, fx["receipt"]), encoding="utf-8") as fh:
    rcpt = json.load(fh)
check(set(rcpt["elsewhere_left_for_next_run"]) == {"Cuyamaca College", "Golden West College", "Rio Hondo College"}
      and not set(rcpt["elsewhere_left_for_next_run"]) & set(W.LANE), "flips outside the eight are left, counted")

rows = {(r["college"], r["control_number"]): r["moves_to"] for r in fx["rows"]}
got = {(r["college"], r["control_number"]): r["moves_to"] for r in rcpt["records"]}
check(got == rows and rcpt["moved"] == len(rows) == 15, "the receipt names the fixture's 15 rows")
check(sum(1 for v in rows.values() if v == "passes") == 14 and rows[(W.MODESTO, "06642")] == W.GAP,
      "14 rows pass, and Modesto 06642 takes pool_figure_not_read")
check({(h["college"], h["control_number"]) for h in rcpt["held"]}
      == {(h["college"], h["control_number"]) for h in fx["held"]}, "the receipt holds the fixture's keys")
check(set(rcpt["colleges"]) == set(W.LANE) and all(c in W.LANE for c, _ in rows), "rows at the eight colleges only")
for part in ("apply", "preread", "preread_md5", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        sql = fh.read()
    check(all("'%s'" % cn in sql for _, cn in rows)
          and not any("'%s'" % h["control_number"] in sql for h in fx["held"]), "%s names exactly the 15" % part)
    if part == "apply":
        check("confirm guard" in sql and "e(expect) as (values (15))" in sql, "the apply guards a confirm")
check(not os.path.exists(os.path.join(ROOT, "kb", "migrations", ".apply"))
      or "s721p" not in open(os.path.join(ROOT, "kb", "migrations", ".apply"), encoding="utf-8").read(),
      "the plan does not write .apply (d-conductor-owns-applies-s720)")
check(W.plan(write=False)["rows"] == [], "a second run plans none")
images = NG._load_images(set(W.LANE) & {c for c, _ in rows})
pages = {(r["college"], r["control_number"]): r["page"] for r in fx["rows"]}
for r in rcpt["records"]:
    k = (r["college"], r["control_number"])
    img = images[k]
    check(img["checks"] == r["after_image"]["checks"], "%s %s: the load posts the receipt's after-image" % k)
    want = r["before_image"]["record"]
    if r.get("ge_overlap"):
        # Sam's ruling 1 of 2026-11-17 passes it: the record takes ge_overlap and the statewide note, nothing else.
        want = dict(want, program=dict(want["program"], ge_overlap=True))
        check(k == ("Ventura College", "06957") and any(n.get("statewide") == "local_degree_ge_overlap"
                                                        for n in W.load(*k).get("reconciled") or []),
              "%s %s: ruling 1's field carries its statewide note" % k)
    check(img["record"] == want and img["source_url"] == pages[k], "%s %s: the record and its page are unchanged" % k)
    if r["moves_to"] == "passes":
        check(img["checks"]["arithmetic"] == "equal" and not img["checks"].get("gaps"), "%s %s: passes with no gap" % k)
    else:
        check(img["checks"].get("gaps") == [W.GAP] and img["checks"]["arithmetic"] == "unequal",
              "%s %s: still failing, its one gap" % k)
    check(W.on_live_run(W.load(*k)), "%s %s: on its live run" % k)

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)

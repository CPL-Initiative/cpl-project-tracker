#!/usr/bin/env python3
"""S731, lane 1 (pooled): the pooled reading's next records at four colleges, the plan s731p
(kb/_program_piles_s731_pooled.py; the scorer change POOLED_S731 in kb/_program_requirements_score.py).

WHY. S727's s727p held El Camino 02513, 02515 and 02517, Modesto Junior's 8 other s720j holds and Cuyamaca 18635, and
found real pools the reading refused at Porterville and Cuyamaca (f-porterville-cuyamaca-real-pools-refused-s727).
The reading now takes four more figure shapes, "N combined units from" as completing words, a list heading's closing
count, a continued heading, and no run inside an option group. Pinned here:

  * the reading on built records: each new shape, the switch, a continued heading, a closing count, an option group;
  * the self-recall, live (the S652 review rule): POOLED_S731 off against on over every committed record differs on
    the 18 hand-held records (right 18, wrong 0, missed 0), no pass-to-fail, and every verdict it moves is a key of
    this plan at these four colleges;
  * the hand reading of each passes row, each gap row's kind and note, and each hold;
  * the plan: the rows and held keys pinned in the fixture (tests/fixtures/pooled_s731.json, never the live census),
    named exactly by the receipt and the four SQL files, the confirm guard, .apply untouched, a second run plans
    none, and the load's image of each committed record is its receipt's after-image, its record and page unchanged.

Run from repo root: python3 tests/program_piles_s731_pooled_test.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIXTURE = os.path.join(ROOT, "tests", "fixtures", "pooled_s731.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-25_s731p_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s731_pooled as M  # noqa: E402
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


def figs(r):
    return [(p["blocks"], p["figure"]) for p in S.pooled_figures(r)]


def off(fn):
    saved = S.POOLED_S731
    S.POOLED_S731 = False
    try:
        return fn()
    finally:
        S.POOLED_S731 = saved


# ── the reading on built records ──────────────────────────────────────────
groups = [blk("Group I - Biological Sciences", "choose_units", 4, None, (4, 5, 5)),
          blk("Group II - Physical Sciences", "choose_units", 4, None, (4, 4, 5))]
for words in ("Major requires at least 18 combined units from Groups I and II, with at least one course from each group.",
              "Rule: choose a minimum of 18 units total; at least 4 units from each list; the remaining 10 units may "
              "come from either list.",
              "The area of emphasis requires 'a minimum of 18 units': at least 4 units from each list; the remaining "
              "10 units may come from either list."):
    r = rec(groups, [words], (18, 18))
    check(figs(r) == [("all", (18.0, 18.0))], "the program's 18 over its groups: %s" % words[:50])
    check(S.score(r, [], "")["arithmetic"]["status"] == "equal", "the groups add to 18: %s" % words[:50])
    check(off(lambda: figs(r)) == [], "with POOLED_S731 off, none: %s" % words[:50])
check(figs(rec(groups, ["Major requires at least 18 combined units, with at least one course from each group."],
               (18, 18))) == [], "18 combined units from nothing named reads no pool")
check(figs(rec(groups, ["Each group requires a minimum of 18 combined units."], (18, 18))) == [],
      "each group's own figure is no pool")
lista = [blk("REQUIRED CORE - COMPLETE 6 UNITS", "all", units=(3, 3)),
         blk("LIST A - SELECT THREE", "choose_units", 0, {"min": 0, "max": 3}, (3, 3)),
         blk("LIST A", "choose_units", 6, {"min": 6, "max": 9}, (3, 3, 3)),
         blk("LIST B (SELECT ONE)", "choose_units", 3, {"min": 3, "max": 3}, (3, 3))]
note = ("LIST A is printed as a parent group totaling 9 units containing two sub-lists: 'LIST A - SELECT THREE' "
        "(0-3 units) and a second 'LIST A' (6-9 units).")
check(figs(rec(lista, [note], (18, 18))) == [([1, 2], (9.0, 9.0))], "a closing count joins LIST A's two sub-lists")
check(S.program_units(rec(lista, [note], (18, 18)), {})[0] == (18.0, 18.0), "and the program adds to 18")
check(off(lambda: figs(rec(lista, [note], (18, 18)))) == [], "with POOLED_S731 off, none")
cont = [blk("REQUIRED - COMPLETE 12 UNITS", "all", units=(3, 3, 3, 3)),
        blk("ELECTIVE COURSES", "choose_units", 3, {"min": 3, "max": 6}, (3, 3, 3)),
        blk("ELECTIVES CONTINUED - CHOOSE 3", "choose_units", 0, {"min": 0, "max": 3}, (1, 1, 1))]
note = ("The two elective blocks sit under a parent group 'ELECTIVE COURSES - COMPLETE 6 UNITS' (Total 6): students "
        "complete 6 elective units combined.")
check(figs(rec(cont, [note], (18, 18))) == [([1, 2], (6.0, 6.0))], "a continued heading goes on the heading before it")
check(off(lambda: figs(rec(cont, [note], (18, 18)))) == [], "with POOLED_S731 off, none")
check(figs(rec(cont[:2] + [blk("Degree Requirements (continued)", "choose_units", 0, {"min": 0, "max": 3}, (1, 1))],
               [note], (18, 18))) == [],
      "a continued heading under another heading's first word joins nothing")
check(figs(rec(groups, ["At least 18 combined units from Groups I and II must be completed in residence."],
               (18, 18))) == [], "a residency sentence names no pool")
check(figs(rec(groups, ["Choose a minimum of 18 units from either list; the remaining 10 units may be taken at the "
                        "college."], (18, 18))) == [], "a sentence on where units are taken names no pool")
series = [blk("Biology - select one series (A)", "all", units=(5, 5), group="series"),
          blk("Biology - select one series (B)", "all", units=(5, 5, 5), group="series")]
check(figs(rec(series, ["The Biology requirement prints a combined total of 10-15 units for 'select one series'."],
               (10, 15))) == [], "an option group's alternatives are never a pool (College of Marin 46068)")

# ── the self-recall, live ─────────────────────────────────────────────────
rc = M.self_recall()
check(rc["differ"] == len(M.S731_FIRES) == 18 and rc["right"] == 18 and not rc["wrong"] and not rc["missed"],
      "the reading differs on the 18 hand-held records, every one right: %s %s" % (rc["wrong"], rc["missed"]))
check(all(M.S731_FIRES[k] for k in M.S731_FIRES), "every hand answer is a real pool")
cj = M.continued_joins()
check(cj["right"] == 4 and not cj["wrong"] and cj["refused"] == 27,
      "a continued heading joins only a heading with its first word: 4 right, 0 wrong, 27 refused (%s)" % cj)
check(not rc["pass_to_fail"] and not rc["moved_outside"], "no pass-to-fail, no move outside the plan: %s"
      % rc["moved_outside"])
check({(c, cn) for c, cn, _, _ in rc["moved"]} == {(M.CUY, "18628"), (M.MODESTO, "38869"), (M.MODESTO, "43164"),
                                                   (M.POR, "06773"), (M.POR, "30235")},
      "the verdicts it moves are the plan's: %s" % sorted({(c, cn) for c, cn, _, _ in rc["moved"]}))
for k in (("Grossmont College", "19608"), ("Grossmont College", "19822"), ("Grossmont College", "19824")):
    f = None
    for path in [os.path.join(NG.COLLEGE_DIR, "grossmont", "records", k[1] + ".json")]:
        if os.path.isfile(path):
            with open(path, encoding="utf-8") as fh:
                f = json.load(fh)
    check(f is not None and not M.W.verdict(f, M.arithmetic(f)["on_none"]),
          "%s %s: reads its 18 and still fails (no move outside the four colleges)" % k)

# ── the fixture, the rows and the holds ───────────────────────────────────
with open(FIXTURE, encoding="utf-8") as fh:
    fx = json.load(fh)
rows = {(r["college"], r["control_number"]): r for r in fx["rows"]}
held = {(h["college"], h["control_number"]) for h in fx["held"]}
check(set(M.REVIEWED) | set(M.GAP_ROWS) == set(rows) and len(rows) == 7, "the rows are the fixture's 7")
check(set(M.HELD) == held and len(held) == 15 and not held & set(rows), "the holds are the fixture's 15")
check(set(M.LANE) == {M.MODESTO, M.ELC, M.CUY, M.POR}, "the four colleges")
for key, hand in sorted(M.REVIEWED.items()):
    f = M.load(key)
    pools = S.pooled_figures(f["record"])
    check([p["figure"][0] for p in pools] == [float(x) for x in hand["pools"]],
          "%s %s: the reading takes the page's figures, %s" % (key + (hand["pools"],)))
    check(all(any(p["words"] in str(n) for n in f["record"].get("notes") or []) for p in pools),
          "%s %s: the pool's sentence is the record's own note" % key)
    a = M.arithmetic(f)
    t = float(hand["total"])
    check(a["on"].get("computed") == [t, t] and a["on"].get("stated") == [t, t] and a["on"] == a["on_none"],
          "%s %s: the pooled sum is its printed total, with no fill (%s)" % (key + (a["on"].get("computed"),)))
    check(a["off"].get("computed") != a["on"].get("computed"), "%s %s: with the reading off the sum differs" % key)
    check(f["score"]["arithmetic"] == a["on_none"] and S.passes_live(f["score"]) and not f["score"].get("gaps"),
          "%s %s: rescored, passing with no gap" % key)
    check(rows[key]["moves_to"] == "passes", "%s %s: a passes row" % key)
for key, (gap, words) in sorted(M.GAP_ROWS.items()):
    f = M.load(key)
    g = f["score"].get("gaps") or []
    check([x["gap"] for x in g] == [gap] and words in g[0]["words"] and g[0]["words"] in f["record"]["notes"],
          "%s %s: collected with %s, its words the record's own note" % (key + (gap,)))
    check(rows[key]["moves_to"] == gap and f["score"].get("confidence"), "%s %s: a %s row with its scores" % (key + (gap,)))
    check(not M.scorer_passes(f), "%s %s: today's scorer does not pass it" % key)
for key in sorted(M.HELD):
    f = M.load(key)
    check(f is not None and not S.passes_live(f["score"]), "%s %s: held, and its live score does not pass" % key)
f = M.load((M.POR, "06773"))
check([g["gap"] for g in f["score"].get("gaps") or []] == ["pool_figure_not_read"]
      and not f["score"]["arithmetic"].get("pooled"),
      "Porterville 06773: held, it keeps s721c's gap (d-porterville-06773-keeps-s721c-gap-s731)")
# A reconcile's rescore keeps that gap although the fresh score passes (NG.GAP_HELD read by keep_named_gaps), and
# drops it from any record no decision holds.
import _program_requirements_college as RC  # noqa: E402
fresh = M.fresh(f, None)
check(RC.pass_grade(fresh), "Porterville 06773: today's scorer passes it fresh")
kept = RC.keep_named_gaps("06773", f["score"], fresh, f)
check([g["gap"] for g in kept.get("gaps") or []] == ["pool_figure_not_read"]
      and kept.get("confidence") == f["score"].get("confidence") and kept["arithmetic"] == fresh["arithmetic"],
      "Porterville 06773: a reconcile keeps its gap and confidence")
other = dict(f, control_number="99999")
check(not RC.keep_named_gaps("99999", f["score"], fresh, other).get("gaps"),
      "a passing fresh score on a record no decision holds carries no gap")
for cn in ("18634", "18635", "18636"):
    a = M.arithmetic(M.load((M.CUY, cn)))["on"]
    check((a.get("major") or {}).get("status") == "equal" and a.get("computed") == [52.0, 52.0]
          and a.get("stated") == [60.0, 60.0], "Cuyamaca %s: the major reads 18, the degree 52 of 60" % cn)

# ── the plan, read from the fixture ───────────────────────────────────────
with open(os.path.join(ROOT, fx["receipt"]), encoding="utf-8") as fh:
    rcpt = json.load(fh)
got = {(r["college"], r["control_number"]): r["moves_to"] for r in rcpt["records"]}
check(got == {k: r["moves_to"] for k, r in rows.items()} and rcpt["moved"] == 7, "the receipt names the fixture's 7")
check({(h["college"], h["control_number"]) for h in rcpt["held"]} == held, "the receipt holds the fixture's 15")
check(rcpt["self_recall"]["differ"] == fx["self_recall"]["differ"] and not rcpt["self_recall"]["moved_outside"],
      "the receipt carries the self-recall")
for part in ("apply", "preread", "preread_md5", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        sql = fh.read()
    check(all("'%s'" % cn in sql for _, cn in rows) and not any("'%s'" % cn in sql for _, cn in held),
          "%s names exactly the 7" % part)
    if part == "apply":
        check("confirm guard" in sql and "e(expect) as (values (7))" in sql, "the apply guards a confirm")
apply_marker = os.path.join(ROOT, "kb", "migrations", ".apply")
check(not os.path.exists(apply_marker) or "s731p" not in open(apply_marker, encoding="utf-8").read(),
      "the plan does not write .apply (d-conductor-owns-applies-s720)")
check(M.plan(write=False)["rows"] == [], "a second run plans none")
images = NG._load_images({c for c, _ in rows})
for r in rcpt["records"]:
    k = (r["college"], r["control_number"])
    img = images[k]
    check(img["checks"] == r["after_image"]["checks"], "%s %s: the load posts the receipt's after-image" % k)
    check(img["record"] == r["before_image"]["record"] and img["source_url"] == rows[k]["page"],
          "%s %s: the record and its page are unchanged" % k)
    want = [] if r["moves_to"] == "passes" else [r["moves_to"]]
    check((img["checks"].get("gaps") or []) == want, "%s %s: the image carries its gap or none" % k)
    check(M.on_live_run(M.load(k)), "%s %s: on its live run" % k)

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)

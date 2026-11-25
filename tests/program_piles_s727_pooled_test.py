#!/usr/bin/env python3
"""S727, lane 1 (pooled): the rest of what #3764's pooled reading opens beyond s721p, the plan s727p
(kb/_program_piles_s727_pooled.py, over kb/_program_pooled_s721.py's classify).

WHY. #3764 taught the scorer to read one figure printed over several named lists as one pool, and plan s721p applied
15 rows at eight colleges. Five Modesto Junior records S720's s720j held (f-modesto-s720j-holds-pass-pooled-s721) and
six flips at Rio Hondo, Cuyamaca and Golden West (f-pooled-flips-elsewhere-s721) pass under it; El Camino 02513, 02515
and 02517 pass only on a degree electives fill their page text must check. Pinned here:

  * the hand reading of each row (REVIEWED, read from each record's own notes, never from the receipt): the pool the
    reading takes is the one figure the page prints over the lists, the record then adds to its printed total, and
    s721p's classify gives "passes" both before and after this plan's write (rescored already, after);
  * the holds: El Camino's three, Cuyamaca 18635 and Modesto 08109 do not pass under the reading, and Modesto's seven
    other s720j holds are unmoved and not passed by today's scorer;
  * the plan: the rows and held keys pinned in the fixture (tests/fixtures/pooled_s727.json, never the live census),
    named exactly by the receipt and the four SQL files, the confirm guard, a second run plans none, and the load's
    image of each committed record is its receipt's after-image, with its record and page unchanged.

Run from repo root: python3 tests/program_piles_s727_pooled_test.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIXTURE = os.path.join(ROOT, "tests", "fixtures", "pooled_s727.json")
MIG = os.path.join(ROOT, "kb", "migrations", "2026-11-25_s727p_prreq_piles_%s.sql")
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s727_pooled as M  # noqa: E402
import _program_requirements_score as S  # noqa: E402

checks, failures = [0], []


def check(cond, msg):
    checks[0] += 1
    if not cond:
        failures.append(msg)


with open(FIXTURE, encoding="utf-8") as fh:
    fx = json.load(fh)
rows = {(r["college"], r["control_number"]): r for r in fx["rows"]}
held = {(h["college"], h["control_number"]) for h in fx["held"]}

# ── the hand reading of each row, live ────────────────────────────────────
check(set(M.REVIEWED) == set(rows) and len(rows) == 11, "the reviewed rows are the fixture's 11")
check(not set(M.REVIEWED) & held and set(M.HELD) | {(M.MODESTO, cn) for cn in M.UNMOVED_S720J} == held,
      "the holds are the fixture's 12, apart from the rows")
check(set(M.LANE) == {"Modesto Junior College", "El Camino College", "Rio Hondo College", "Cuyamaca College",
                      "Golden West College"}, "the five colleges")
for key, hand in sorted(M.REVIEWED.items()):
    f = M.load(key)
    pools = S.pooled_figures(f["record"])
    check([p["figure"][0] for p in pools] == [float(x) for x in hand["pools"]],
          "%s %s: the reading takes the page's figures over the lists, %s" % (key + (hand["pools"],)))
    check(all(any(p["words"] in str(n) for n in f["record"].get("notes") or []) for p in pools),
          "%s %s: the pool's sentence is the record's own note" % key)
    tu = S._span((f["record"].get("program") or {}).get("total_units"))
    check(tu == (float(hand["total"]), float(hand["total"])), "%s %s: the printed total is %s" % (key + (hand["total"],)))
    what, off, on, _ = M.outcome(key)
    check(what == "passes", "%s %s: passes under the reading (%s)" % (key + (what,)))
    check(on.get("computed") == [float(hand["total"])] * 2 and on.get("stated") == [float(hand["total"])] * 2,
          "%s %s: the pooled sum is its printed total (%s)" % (key + (on.get("computed"),)))
    check(off.get("computed") != on.get("computed"), "%s %s: with the reading off the sum differs" % key)

# ── the holds ─────────────────────────────────────────────────────────────
for key in sorted(M.HELD):
    check(M.outcome(key)[0] != "passes", "%s %s: does not pass under the reading alone" % key)
for cn in M.UNMOVED_S720J:
    f = M.load((M.MODESTO, cn))
    check(M.outcome((M.MODESTO, cn))[0] == "unmoved" and not M.scorer_passes(f),
          "Modesto %s: the reading moves nothing and today's scorer does not pass it" % cn)
for key in ((M.ELC, "02513"), (M.ELC, "02515"), (M.ELC, "02517")):
    check(M.outcome(key)[0] == "passes_untexted_fill", "%s %s: passes only on an untexted electives fill" % key)

# ── the plan, read from the fixture ───────────────────────────────────────
with open(os.path.join(ROOT, fx["receipt"]), encoding="utf-8") as fh:
    rcpt = json.load(fh)
got = {(r["college"], r["control_number"]): r["moves_to"] for r in rcpt["records"]}
check(got == {k: r["moves_to"] for k, r in rows.items()} and rcpt["moved"] == 11, "the receipt names the fixture's 11")
check({(h["college"], h["control_number"]) for h in rcpt["held"]} == held, "the receipt holds the fixture's 12")
check(set(rcpt["colleges"]) == set(M.LANE) and all(c in M.LANE for c, _ in got), "rows at the five colleges only")
for part in ("apply", "preread", "preread_md5", "rollback"):
    with open(MIG % part, encoding="utf-8") as fh:
        sql = fh.read()
    check(all("'%s'" % cn in sql for _, cn in rows) and not any("'%s'" % cn in sql for _, cn in held),
          "%s names exactly the 11" % part)
    if part == "apply":
        check("confirm guard" in sql and "e(expect) as (values (11))" in sql, "the apply guards a confirm")
apply_marker = os.path.join(ROOT, "kb", "migrations", ".apply")
check(not os.path.exists(apply_marker) or "s727p" not in open(apply_marker, encoding="utf-8").read(),
      "the plan does not write .apply (d-conductor-owns-applies-s720)")
check(M.plan(write=False)["rows"] == [], "a second run plans none")
images = NG._load_images({c for c, _ in rows})
for r in rcpt["records"]:
    k = (r["college"], r["control_number"])
    img = images[k]
    check(img["checks"] == r["after_image"]["checks"], "%s %s: the load posts the receipt's after-image" % k)
    check(img["record"] == r["before_image"]["record"] and img["source_url"] == rows[k]["page"],
          "%s %s: the record and its page are unchanged" % k)
    check(img["checks"]["arithmetic"] == "equal" and not img["checks"].get("gaps"), "%s %s: passes with no gap" % k)
    with M.lane():
        check(M.W.on_live_run(M.load(k)), "%s %s: on its live run" % k)

print("%d checks, %d failures" % (checks[0], len(failures)))
for m in failures:
    print("FAIL:", m)
sys.exit(1 if failures else 0)

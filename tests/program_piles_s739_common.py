#!/usr/bin/env python3
"""S739, lane 2's cheap piles: the checks every college's plan test shares (kb/_program_piles_s739.py).

Not a test of its own: tests/program_piles_s739_<college>_test.py calls run() with the plan's pinned answers. WHY. Sam's
ruling of 2026-11-17 (sam-collect-with-gaps-2026-11-17) and his routine prompt of 2026-11-25: a record held for a gap is
collected with its gap named and a lower score, never held, unless the record is not the program's own. Pinned for each
plan:

  * each kind the plan files carries a sentence and a unit-arithmetic score in kb/_program_named_gaps.py;
  * the keys are the earlier plan's holds, by key, from its committed receipt;
  * precision against the hand reading: every key right, every claim stands, every boundary reading names no gap;
  * each named gap's own check stands (its reading closes the record at the printed total under today's scorer, or its
    shape holds), today's scorer does not pass the row, and the own-page guard shows the record's section its own;
  * the holds: each held key has no entry and carries its reason;
  * the plan: the rows named exactly by the receipt and the four SQL files, the confirm guard, a second run plans
    none; the load's image of each committed record is its receipt's after-image, the record unchanged; each SQL
    file is the receipt's own SQL, and the apply, the pre-read and the rollback carry every row's before-image and
    after-image as the receipt has them (S739's third reader: an after-check or an md5 that differs from the receipt
    fails here);
  * every row is on its live run both as the receipts stood before this plan's own apply (skip) and after it, so the
    test holds before and after the conductor's apply (p-test-reads-own-apply-receipt-s721);
  * a row the applied plan wrote and a later rollback took back (rolled_back; Orange Coast 41373): the receipt and
    the four SQL files still name it, as the record of what was written; it is a hold now, with no entry; and its
    committed record is back at the receipt's before-image, carrying no gap, so no later load posts the gap again.
    Where a later plan files another kind on that row (refiled; S740's s740b), the committed record carries that
    kind alone over the receipt's before-image.
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _program_named_gaps as NG  # noqa: E402
import _program_piles_s739 as B  # noqa: E402


class Checks:
    def __init__(self):
        self.n, self.failures = 0, []

    def check(self, cond, msg):
        self.n += 1
        if not cond:
            self.failures.append(msg)

    def done(self) -> int:
        print("%d checks, %d failures" % (self.n, len(self.failures)))
        for m in self.failures:
            print("FAIL:", m)
        return 1 if self.failures else 0


def run(W, *, rows: dict, held: dict, scores: dict, day: str, boundaries: int, prior_held: set | None = None,
        own: dict | None = None, t: Checks | None = None, rolled_back: dict | None = None,
        refiled: dict | None = None, later_flags: dict | None = None) -> Checks:
    """rows: {key: its kind, or B.PASSES}; held: {key: words its reason carries}; scores: {kind: its unit-arithmetic
    score}; boundaries: the count of boundary readings; prior_held: the earlier receipt's held keys (default: read
    from W.held_by); own: {key: the own-page guard's form} for rows read from a shared page; rolled_back: {key:
    its kind} for a row the applied plan wrote and a later rollback took back (it is in held too); refiled: {key:
    the kind a later plan files on a rolled-back row} (S740's s740b on Orange Coast 41373): the committed record
    then carries that kind alone, over this receipt's before-image; later_flags: {key: {program field: value}} for a
    row a later reconcile step re-filed with a flag on its program (S741's degree floor on Copper Mountain 16657):
    the committed record is then the receipt's before-image with those fields alone added, in either state."""
    t = t or Checks()
    check = t.check
    receipt = W.receipt_path(day)
    mig = os.path.join(ROOT, "kb", "migrations", "%s_%s_prreq_piles_%%s.sql" % (day, W.tag))
    gaps = {cn: g for cn, g in rows.items() if g != B.PASSES}
    n = len(rows)
    rolled = dict(rolled_back or {})
    named = dict(rows, **rolled)
    check(set(rolled) <= set(held) and not set(rolled) & set(rows), "a rolled-back row is a hold, and no row")

    for g, score in scores.items():
        check(g in NG.GAPS and NG.ARITH_SCORE.get(g) == score, "%s has its sentence and score" % g)
    check(set(gaps.values()) == set(scores), "every kind filed is pinned")

    check(set(W.keys) == set(rows) | set(held) and not set(rows) & set(held), "the keys are the rows and the holds")
    if prior_held is None:
        with open(os.path.join(ROOT, W.held_by), encoding="utf-8") as fh:
            prior_held = {str(h["control_number"]) for h in json.load(fh)["held"]
                          if h.get("college", W.college) == W.college}
    check(set(W.keys) <= prior_held, "every key is one the earlier plan held: %s" % sorted(set(W.keys) - prior_held))
    check(set(W.hand) == set(W.keys), "every key has its hand answer")

    pr = W.precision()
    check(pr["read"] == len(W.keys) and pr["right"] == len(W.keys) and not pr["wrong"] and not pr["not_hand_held"],
          "precision %d of %d: %s" % (pr["right"], len(W.keys), pr["wrong"]))
    cc = W.claim_checks()
    check(cc["counts"] == ({"stands": n} if n else {}) and not cc["not_standing"], "%d claims stand: %s" % (n, cc))
    bd = W.boundaries()
    check(not bd["wrong"] and sum(bd["counts"].values()) == boundaries,
          "every one of the %d boundary readings names no gap: %s" % (boundaries, bd))

    for cn, g in gaps.items():
        f = W.load(cn)
        e = W.reviewed[cn]
        check(e["gap"] == g and W.kind_closes(f, e), "%s: its kind's own check stands" % cn)
        check(not B.scorer_passes(f) and B.arithmetic(f).get("status") != "equal",
              "%s: today's scorer does not pass it" % cn)
        check(NG.collectable(f["score"]), "%s: coverage and invented pass" % cn)
    for cn in rows:
        f = W.load(cn)
        e = W.reviewed.get(cn) or W.passed.get(cn)
        check(W.own(f, e) == (own or {}).get(cn, "its page is its own"),
              "%s: the own-page guard reads %s" % (cn, W.own(f, e)))
        check(bool(W.shared_with(cn)) == (cn in (own or {})), "%s: its page is shared only where pinned" % cn)
    for cn, words in held.items():
        check(cn not in W.reviewed and cn not in W.passed, "%s: a hold has no entry" % cn)
        check(W.hand[cn].startswith("held") and all(w in W.hand[cn] for w in words),
              "%s: its hold carries its reason" % cn)

    check(all(W.on_live_run(W.load(cn)) for cn in rows), "every row is on its live run")
    check(all(W.on_live_run(W.load(cn), skip=(W.tag,)) for cn in rows), "every row is on its live run before the apply")
    check(W.precision(skip=(W.tag,))["right"] == len(W.keys), "precision holds on the receipts before the apply")

    with open(receipt, encoding="utf-8") as fh:
        rec = json.load(fh)
    got = {r["control_number"]: r["moves_to"] for r in rec["records"]}
    check(got == named and rec["moved"] == len(named), "the receipt names the %d rows and their kinds" % len(named))
    check({h["control_number"] for h in rec["held"]} == set(held) - set(rolled),
          "the receipt holds the %d" % (len(held) - len(rolled)))
    check(rec["keys"]["members"] == list(W.keys), "the receipt's keys are the plan's")
    check(set(rec["shared_pages"]) == set(own or {}), "the receipt names the rows read from a shared page")
    for r in rec["records"]:
        if r["moves_to"] in scores:
            check(r["confidence"]["unit_arithmetic"] == scores[r["moves_to"]],
                  "%s: its arithmetic score is its kind's" % r["control_number"])
            check(all(v is None or 0 <= v <= 100 for v in r["confidence"].values()),
                  "%s: every score is on the 0-100 bar" % r["control_number"])
        check(r["own"] == (own or {}).get(r["control_number"], "its page is its own"),
              "%s: the receipt says how its section is its own" % r["control_number"])
    for part in ("apply", "preread", "preread_md5", "rollback"):
        with open(mig % part, encoding="utf-8") as fh:
            sql = fh.read()
        check(all("'%s'" % cn in sql for cn in named) and not any("'%s'" % cn in sql for cn in held if cn not in rolled),
              "%s names exactly the %d" % (part, len(named)))
        if part == "apply":
            check("confirm guard" in sql and "e(expect) as (values (%d))" % len(named) in sql,
                  "the apply guards a confirm")
        body = rec["pre_read_md5" if part == "preread_md5" else "pre_read" if part == "preread" else part]
        check(sql.endswith(body + "\n"), "%s is the receipt's own SQL, md5s and all" % part)
        if part != "preread_md5":
            check(all(NG._values([r]) in sql for r in rec["records"]),
                  "%s carries each row's run, before-image and after-image as the receipt has them" % part)
    check(W.plan(write=False)["rows"] == [], "a second run plans none")
    images = NG._load_images({W.college})
    for r in rec["records"]:
        img = images[(W.college, r["control_number"])]
        if r["control_number"] in rolled:
            later = (refiled or {}).get(r["control_number"])
            if later and img["checks"].get("gaps"):
                # A later plan files another kind on the rolled-back row: that kind alone, over this receipt's
                # before-image, and never the kind the rollback took back.
                check(img["checks"]["gaps"] == [later] and later != r["moves_to"]
                      and {k: v for k, v in img["checks"].items() if k not in ("gaps", "confidence")}
                      == r["before_image"]["checks"] and img["record"] == r["before_image"]["record"],
                      "%s: rolled back, then refiled as %s over the receipt's before-image"
                      % (r["control_number"], later))
                continue
            check(img["checks"] == r["before_image"]["checks"] and not img["checks"].get("gaps")
                  and img["record"] == r["before_image"]["record"],
                  "%s: rolled back, the load posts the receipt's before-image, with no gap" % r["control_number"])
            continue
        want = [] if r["moves_to"] == B.PASSES else [r["moves_to"]]
        check(img["checks"] == r["after_image"]["checks"],
              "%s: the load posts the receipt's after-image" % r["control_number"])
        check((img["checks"].get("gaps") or []) == want, "%s: the image carries its gap, or none" % r["control_number"])
        flags = (later_flags or {}).get(r["control_number"]) or {}
        rec_now = dict(img["record"], program={k: v for k, v in img["record"]["program"].items()
                                               if not (k in flags and v == flags[k]
                                                       and k not in r["before_image"]["record"]["program"])})
        check(rec_now == r["before_image"]["record"],
              "%s: the record is unchanged%s" % (r["control_number"], ", a later step's flag aside" if flags else ""))
        bc, ac = r["before_image"]["checks"], r["after_image"]["checks"]
        if r["moves_to"] == B.PASSES:
            check(not B.F.row_passes(bc) and B.F.row_passes(ac) and not bc.get("gaps") and not ac.get("gaps"),
                  "%s: the row did not pass, and its after-image passes with no gap" % r["control_number"])
        else:
            check(bc.get("coverage") is True and bc.get("invented") is True and not bc.get("gaps"),
                  "%s: the row was collectable and carried no gap" % r["control_number"])
            check({k: v for k, v in ac.items() if k not in ("gaps", "confidence")} == bc,
                  "%s: the after-image adds the gap and its scores and moves nothing else" % r["control_number"])
    return t

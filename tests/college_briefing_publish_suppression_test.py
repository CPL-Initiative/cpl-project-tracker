#!/usr/bin/env python3
"""The My College public layer must not let subtraction pin a withheld value.

⭐ WHY THIS FILE EXISTS, AND WHY IT TESTS A PROPERTY. The ADR
(adr-student-detail-aggregate-disclosure-control, point 9) says it plainly:
`assert cell is None` passes on a broken implementation. What matters is that no
published grain lets the reader recover a value that was withheld.

The table this guards is the sharpest one in the tab. Measured 2026-09-17:
map_college_cr_unit holds 210,171 rows, 202,618 of them below k=10, and 145,554
describe exactly ONE student at a named college, named course and named credit
recommendation — carrying that student's exact credit total. The slice the page
reads is 622 rows over 74 colleges, of which 338 describe a single student.

Pure stdlib, no network, no database.
Run from repo root: python3 tests/college_briefing_publish_suppression_test.py
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "kb"))
import importlib

pub = importlib.import_module("_publish_college_briefing")

FAILS = []


def check(cond, why):
    if not cond:
        FAILS.append(why)


def row(rec, course, credits, students, ctype="Elective credit"):
    return {"credit_rec": rec, "college_course": course, "course_type": ctype,
            "sum_articulated_credits": credits, "distinct_students": students}


K = pub.K
check(K == 10, "the ADR's threshold is 10 for every student-detail surface")

# ── 1. A withheld headline publishes no breakdown at all ────────────────────
# Publishing the parts of a withheld whole hands back what suppression removed.
plan = pub.plan_waiting([row("A", "X", 30, 40), row("B", "Y", 20, 25)], headline_suppressed=True)
check(plan is None, "a college whose headline is suppressed must publish no breakdown")

# ── 2. Nothing thin → everything publishes, and no remainder is invented ────
rows = [row("A", "X", 30, 40), row("B", "Y", 20, 25)]
plan = pub.plan_waiting(rows, False)
check(plan is not None and len(plan) == 2, "two healthy rows publish as two rows")
check(all(p["withheld_recommendations"] is None for p in plan), "no remainder row when nothing is held")

# ── 3. ⭐ No published row is ever below k ──────────────────────────────────
# ⚠ The thin rows must sum to k students between them, or rule 6 (below)
# correctly refuses the whole college — which is what the first draft of this
# fixture did, and it read like a bug in the planner rather than in the fixture.
rows = [row("A", "X", 30, 40), row("B", "Y", 20, 25), row("C", "Z", 5, 6), row("D", "W", 4, 8)]
plan = pub.plan_waiting(rows, False)
check(plan is not None, "a mix of healthy and thin rows still publishes")
shown = [p for p in (plan or []) if p["withheld_recommendations"] is None]
check(all((p["distinct_students"] or 0) >= K for p in shown),
      "every published row stands for at least k students")

# ── 4. ⭐ THE SUBTRACTION PROPERTY ──────────────────────────────────────────
# The headline is the total of every row. A reader knows it, and knows every
# published row. What is left over must never be ONE row's value.
def remainder_stands_for(rows_in):
    p = pub.plan_waiting(rows_in, False)
    if p is None:
        return None
    rem = [x for x in p if x["withheld_recommendations"] is not None]
    return rem[0]["withheld_recommendations"] if rem else 0

for label, rows_in in [
    ("one thin row beside two healthy", [row("A", "X", 30, 40), row("B", "Y", 20, 25), row("C", "Z", 7, 4)]),
    ("one thin row beside one healthy", [row("A", "X", 30, 40), row("C", "Z", 7, 4)]),
    ("several thin rows", [row("A", "X", 30, 40), row("C", "Z", 7, 4), row("D", "W", 3, 5), row("E", "V", 2, 6)]),
]:
    n = remainder_stands_for(rows_in)
    check(n is None or n == 0 or n >= 2,
          f"{label}: a remainder must stand for 2+ recommendations, got {n} — "
          "standing for one publishes that one row exactly")

# ── 4b. ⚠ …and the borrow is what keeps the college from going dark ────────
# Mutation-tested: deleting the complementary-suppression loop leaves the
# len(held) < 2 guard doing the safety work, so the planner stays SAFE and every
# check above still passes — it just publishes nothing where it could have
# published. The loop is a UTILITY property, and a privacy assertion cannot see
# it. Assert it directly, or the loop can be deleted in silence.
plan = pub.plan_waiting([row("A", "X", 30, 40), row("B", "Y", 20, 25), row("C", "Z", 7, 4)], False)
check(plan is not None, "one thin row beside two healthy must still publish, not go dark")
if plan:
    rem = [x for x in plan if x["withheld_recommendations"] is not None]
    check(len(rem) == 1 and rem[0]["withheld_recommendations"] == 2,
          "the smallest healthy row joins the lone thin one, so the remainder stands for 2")
    check(len([x for x in plan if x["withheld_recommendations"] is None]) == 1,
          "…leaving one row published on its own merits")

# ── 5. ⭐ A lone thin row with nothing to borrow publishes NOTHING ──────────
plan = pub.plan_waiting([row("C", "Z", 7, 4)], False)
check(plan is None, "a single thin row and no healthy row to pair it with must publish nothing")

# ── 6. ⭐ The remainder must stand for at least k students ──────────────────
# Two thin rows of 1 and 2 students is still a cell of at most 3 people.
plan = pub.plan_waiting([row("C", "Z", 7, 1), row("D", "W", 3, 2)], False)
check(plan is None, "a remainder covering fewer than k students must publish nothing")

# ── 7. ⭐ Reconciliation — the published rows still sum to the headline ─────
# The breakdown sits under the headline figure; a list that does not add up to
# the number above it would be worse than no list.
rows = [row("A", "X", 30, 40), row("B", "Y", 20, 25), row("C", "Z", 7, 6), row("D", "W", 3, 8)]
plan = pub.plan_waiting(rows, False)
check(plan is not None, "this shape must publish")
if plan:
    total_in = sum(r["sum_articulated_credits"] for r in rows)
    total_out = sum(p["sum_articulated_credits"] for p in plan)
    check(abs(total_in - total_out) < 1e-9,
          f"published credits must reconcile to the headline: {total_out} vs {total_in}")

# ── 8. ⭐ No withheld row's identity leaks ──────────────────────────────────
if plan:
    names = {p["credit_rec"] for p in plan if p["credit_rec"] is not None}
    check("C" not in names and "D" not in names,
          "a withheld recommendation's NAME must not appear in the published rows")
    rem = [p for p in plan if p["withheld_recommendations"] is not None]
    check(rem and rem[0]["credit_rec"] is None and rem[0]["college_course"] is None
          and rem[0]["distinct_students"] is None,
          "the remainder carries no recommendation, no course and no headcount")

# ── 9. The other two published shapes ───────────────────────────────────────
cs = pub.publish_credit_summary({"college_id": 1, "students": 3, "suppressed": True,
                                 "dormant_credits": None, "articulated_waiting": None,
                                 "applied_credits": None, "transcribed_credits": None})
check(cs["students"] is None, "a suppressed headline must not publish its exact headcount")
check(cs["suppressed"] is True, "…but the row survives, so existence is still visible")

cs2 = pub.publish_credit_summary({"college_id": 2, "students": 250, "suppressed": False,
                                  "dormant_credits": 10, "articulated_waiting": 5,
                                  "applied_credits": 3, "transcribed_credits": 2})
check(cs2["students"] == 250 and cs2["dormant_credits"] == 10,
      "an unsuppressed headline publishes unchanged")

c = pub.publish_contact({
    "college": "Example College", "cpl_coordinator": "A Person",
    "cpl_coordinator_email": "a@example.edu", "landing_page_url": "https://x",
    "ceo": "The President", "ceo_email": "ceo@example.edu",
    "vpaa": "VP", "vpaa_email": "vpaa@example.edu",
    "senate_president": "Senate", "certifying_official_email": "vso@example.edu",
})
leaked = [k for k in ("ceo", "ceo_email", "vpaa", "vpaa_email", "senate_president",
                      "certifying_official_email") if k in c]
check(not leaked, f"the executive directory must not reach the public contact row: {leaked}")
check(c["cpl_coordinator_email"] == "a@example.edu", "the routing contact does publish")

if FAILS:
    print("FAIL — college briefing public layer")
    for f in FAILS:
        print("  -", f)
    sys.exit(1)
print(f"ok — college briefing public layer ({23 - len(FAILS)} checks)")

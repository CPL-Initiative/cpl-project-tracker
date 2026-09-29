#!/usr/bin/env python3
"""Build the PUBLIC layer behind the My College tab.

WHY THIS EXISTS
---------------
Sam opened My College to "colleges / the public internet" (2026-09-17). Four of
the tab's tables were gated on `is_allowed_reviewer() OR team_pass_ok()`, and
three of them cannot simply have that gate removed:

  map_college_cr_unit          210,171 rows; 202,618 below k=10; 145,554 rows
                               describe exactly ONE student at a named college,
                               named course and named credit recommendation,
                               carrying that student's exact credit total.
  map_college_credit_summary   measures are nulled on suppressed rows, but the
                               exact small headcount is not — three colleges
                               publish `students = 1`.
  map_college_contacts         a statewide CCC staff directory: CEO, VPAA, VPSS,
                               senate president, certifying official, with
                               emails. Routing a student needs none of that.

So this follows the ratified ADR rather than the RLS switch:
`adr-student-detail-aggregate-disclosure-control` — **two objects, not one**.
Every base table stays exactly as gated as it is today and is never written to.
This builds separate `*_pub` tables carrying only what may be public, and the
page reads those. Rolling back is `drop table`; nothing is destroyed to get here.

⚠ SUPPRESSION HAPPENS HERE, AT BUILD TIME — NEVER AT RENDER TIME. The ADR's
point 3: if the page holds real rows and hides them on display, anything it can
sum it can also subtract. The tab has carried exactly that render-time guard on
the waiting breakdown, which was sound only while the table was gated.

USAGE
    python3 kb/_publish_college_briefing.py --dry-run
    python3 kb/_publish_college_briefing.py            # needs SUPABASE_SERVICE_KEY

The sandbox cannot reach *.supabase.co, so this runs on a GitHub Actions runner
(.github/workflows/college-briefing-publish.yml) — the same shape as the other
service-key sync jobs.

The suppression logic below is PURE and is the single implementation. Its
properties are tested without a database by
tests/college_briefing_publish_suppression_test.py, which asserts that
subtraction cannot pin a withheld value — not merely that a flag is set.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

# The ADR's threshold for every student-detail surface. Not a dial.
K = 10

# What a college's routing contact is. Everything else in map_college_contacts
# is an executive directory and stays gated — publishing it would put a
# statewide administrator mailing list behind one URL.
CONTACT_PUBLIC_FIELDS = (
    "college",
    "cpl_coordinator",
    "cpl_coordinator_email",
    "cpl_counselor",
    "cpl_counselor_email",
    "landing_page_url",
)


def publish_contact(row: dict) -> dict:
    """Routing fields only. A missing field publishes as null, never as a guess."""
    return {f: row.get(f) for f in CONTACT_PUBLIC_FIELDS}


def publish_credit_summary(row: dict) -> dict:
    """The headline figures, with the exact sub-threshold headcount removed.

    The base already nulls the four credit measures on a suppressed row. It does
    NOT null `students`, so a suppressed row still publishes "this college has
    exactly 1 CPL student" — which is the disclosure the ADR's option (b) was
    chosen to avoid: existence, not breakdown. `suppressed` already carries the
    existence; the count itself goes.
    """
    out = dict(row)
    if out.get("suppressed"):
        out["students"] = None
        for m in ("dormant_credits", "articulated_waiting", "applied_credits", "transcribed_credits"):
            out[m] = None
    return out


def plan_waiting(rows: list, headline_suppressed: bool, k: int = K) -> list | None:
    """Plan ONE college's published waiting breakdown.

    Returns the rows to publish, or None to publish nothing for this college.

    ⚠ The breakdown must still reconcile to the headline it sits under — a list
    that does not add up to the number above it is worse than no list — so the
    withheld rows are not dropped. They collapse into ONE remainder row carrying
    their summed credits and how many recommendations it covers, with no
    recommendation, no course and no headcount.

    The rules, each from the ADR:

    * A college whose HEADLINE is suppressed gets no breakdown at all. Publishing
      the parts of a withheld whole hands back exactly what suppression removed.
    * A remainder standing for a SINGLE row discloses that row exactly, so the
      smallest published row joins it (complementary suppression, point 5). With
      nothing left to borrow, the college publishes nothing.
    * The remainder must itself stand for at least k students. Students dedupe
      and these rows cannot be deduped here, so the gate uses their SUM, which is
      an upper bound on the distinct count: under k by the sum is certainly under
      k in truth. Conservative in the direction that matters.
    """
    if headline_suppressed:
        return None

    shown = [r for r in rows if (r.get("distinct_students") or 0) >= k]
    held = [r for r in rows if (r.get("distinct_students") or 0) < k]

    if not held:
        return [_shown_row(r) for r in shown]

    # A remainder that stands for one row IS that row. Borrow the smallest shown
    # row until it stands for at least two.
    shown.sort(key=lambda r: (_num(r.get("sum_articulated_credits")), _num(r.get("distinct_students"))))
    while len(held) < 2 and shown:
        held.append(shown.pop(0))

    if len(held) < 2:
        return None
    if sum(_num(r.get("distinct_students")) for r in held) < k:
        return None

    out = [_shown_row(r) for r in shown]
    out.append({
        "credit_rec": None,
        "college_course": None,
        "course_type": None,
        "sum_articulated_credits": sum(_num(r.get("sum_articulated_credits")) for r in held),
        "distinct_students": None,
        "withheld_recommendations": len(held),
    })
    return out


def _shown_row(r: dict) -> dict:
    return {
        "credit_rec": r.get("credit_rec"),
        "college_course": r.get("college_course"),
        "course_type": r.get("course_type"),
        "sum_articulated_credits": _num(r.get("sum_articulated_credits")),
        "distinct_students": r.get("distinct_students"),
        "withheld_recommendations": None,
    }


def _num(x) -> float:
    try:
        return float(x or 0)
    except (TypeError, ValueError):
        return 0.0


# ── the loader ───────────────────────────────────────────────────────────────
# Everything above is pure and tested without a database. Everything below moves
# bytes. Keep it that way: a privacy rule that lives down here is a privacy rule
# with no test.

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co")
PAGE = 1000


def _headers(key: str, extra: dict | None = None) -> dict:
    h = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    h.update(extra or {})
    return h


def read_all(table: str, select: str, key: str, query: str = "") -> list:
    """Range-paginated read. A silent 1,000-row ceiling is how a published total
    quietly becomes a partial one, so page until a short page arrives."""
    out, offset = [], 0
    while True:
        url = f"{SUPABASE_URL}/rest/v1/{table}?select={select}{query}"
        req = urllib.request.Request(url, headers=_headers(
            key, {"Range-Unit": "items", "Range": f"{offset}-{offset + PAGE - 1}"}))
        with urllib.request.urlopen(req, timeout=120) as resp:
            chunk = json.loads(resp.read().decode("utf-8"))
        out.extend(chunk)
        if len(chunk) < PAGE:
            return out
        offset += PAGE


def _write(method: str, path: str, key: str, body=None, prefer: str = "return=minimal"):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{path}",
        data=None if body is None else json.dumps(body).encode("utf-8"),
        method=method,
        headers=_headers(key, {"Prefer": prefer}),
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            if resp.status not in (200, 201, 204):
                raise SystemExit(f"FATAL: {method} {path}: HTTP {resp.status}")
    except urllib.error.HTTPError as exc:
        raise SystemExit(f"FATAL: {method} {path}: HTTP {exc.code} {exc.read()[:400]!r}")


def upsert(table: str, rows: list, on_conflict: str, key: str) -> None:
    for i in range(0, len(rows), 500):
        _write("POST", f"{table}?on_conflict={on_conflict}", key, rows[i:i + 500],
               prefer="resolution=merge-duplicates,return=minimal")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dry-run", action="store_true", help="read and plan, write nothing")
    args = ap.parse_args()

    key = os.environ.get("SUPABASE_SERVICE_KEY", "")
    if not key:
        print("FATAL: SUPABASE_SERVICE_KEY is unset. This runs on the Actions runner "
              "(.github/workflows/college-briefing-publish.yml); the sandbox cannot "
              "reach *.supabase.co.", file=sys.stderr)
        return 2

    summary = read_all("map_college_credit_summary",
                       "college_id,students,suppressed,dormant_credits,articulated_waiting,"
                       "applied_credits,transcribed_credits", key)
    goal2 = read_all("map_college_goal2", "college_id,dest,students,rows_n,suppressed,reason", key)
    contacts = read_all("map_college_contacts", ",".join(CONTACT_PUBLIC_FIELDS), key)
    waiting = read_all("map_college_cr_unit",
                       "college_id,credit_rec,college_course,course_type,"
                       "sum_articulated_credits,distinct_students", key,
                       query="&cpl_status_plan=eq.Needs%20Action&sum_articulated_credits=gt.0")

    held_headline = {r["college_id"] for r in summary if r.get("suppressed")}

    by_college: dict = {}
    for r in waiting:
        by_college.setdefault(r["college_id"], []).append(r)

    planned, dark = {}, 0
    for cid, rows in by_college.items():
        plan = plan_waiting(rows, cid in held_headline)
        if plan is None:
            dark += 1
            continue
        planned[cid] = [dict(p, college_id=cid) for p in plan]

    pub_summary = [publish_credit_summary(r) for r in summary]
    pub_contacts = [publish_contact(r) for r in contacts]
    flat = [r for rows in planned.values() for r in rows]
    remainders = sum(1 for r in flat if r["withheld_recommendations"] is not None)

    print(f"credit summary : {len(pub_summary)} rows "
          f"({sum(1 for r in pub_summary if r['suppressed'])} suppressed, counts removed)")
    print(f"goal 2         : {len(goal2)} rows")
    print(f"contacts       : {len(pub_contacts)} rows (routing fields only)")
    print(f"waiting        : {len(waiting)} source rows -> {len(flat)} published "
          f"across {len(planned)} colleges ({remainders} remainder rows); "
          f"{dark} colleges publish no breakdown")

    if args.dry_run:
        print("dry run — nothing written")
        return 0

    upsert("map_college_credit_summary_pub", pub_summary, "college_id", key)
    upsert("map_college_goal2_pub", goal2, "college_id,dest", key)
    upsert("map_college_contacts_pub", pub_contacts, "college", key)

    # cr_waiting has no natural key (a remainder row carries no recommendation),
    # so it is replaced per college. The window where one college has no rows is
    # a single round trip; doing it table-wide would blank every college at once.
    for cid, rows in planned.items():
        _write("DELETE", f"map_college_cr_waiting_pub?college_id=eq.{cid}", key)
        _write("POST", "map_college_cr_waiting_pub", key, rows)
    for cid in set(by_college) - set(planned):
        _write("DELETE", f"map_college_cr_waiting_pub?college_id=eq.{cid}", key)

    print("published.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

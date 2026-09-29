#!/usr/bin/env python3
"""Build cpl_funding_cr_backlog.js — the per-college CREDIT-RECOMMENDATION backlog.

The funding tab could measure how much CPL a college had *posted*, but not how
much of the work sitting in its students' CPL Plans it had actually WORKED. This
builder closes that, from MAP's student-detail-credits report: one row per
student x credit recommendation, carrying `CPLStatusPlan` — the disposition a
college sets on each CR (Applied to CPL Plan / Not Applicable / In Process /
Needs Action).

WHY THE DISPOSITION RATE IS THE RIGHT MEASURE (Sam, 2026-08-06)
--------------------------------------------------------------
Uploading a JST creates the Student CPL Plan and the DD-214/JST Basic Training
rows auto-apply against an already-articulated exhibit. So a college can post
applied credit WITHOUT ever performing the per-CR step that is the actual ask:
setting each listed recommendation to Applied, Denied, or N/A, and creating an
articulation where one is needed. Every volume metric we tried (applied
students, applied-per-1,000, applied/eligible units) ranked the colleges Sam
knows to be adept in the middle of the pack. The disposition rate put all three
in the top eleven of eighty-four against a MEDIAN OF 5.1% — the first measure
that agreed with the people who work with these colleges daily.

Crucially it is also the FAIR measure. Scoring on "applied" alone punishes a
college that reviewed every recommendation and correctly marked most of them
Not Applicable — the right answer for an Orienteering hour that does not fit the
student's education plan. Counting N/A and In Process as work done removes that
unfairness, which is exactly the objection a college would (rightly) raise if
this reached them uncorrected.

PRIVACY
-------
Institutional aggregates ONLY. The source is per-student; the student grain
never leaves the runner. No StudentMAPID, no program, no catalog year — those
would narrow a cell toward one person. Per-college counts below SUPPRESS_BELOW
bake as null + a `_suppressed` flag, matching
docs/kb-notes/adr-funding-priority-metrics-privacy.md.

GRACEFUL BEHAVIOUR
------------------
Exits 0 WITHOUT touching any existing artifact when the input or the view is
absent, so a partial daily run never blanks the sidecar (same contract as
_build_funding_performance.py / _build_funding_ess.py).

Usage:
    python3 funding/_build_cr_backlog.py [CustomReport_latest.json | detail.json] [--out path]

Reads either the daily CustomReport pull (once Malone publishes the view — set
VIEW below to its name) or a standalone export of the same shape.
"""
import glob
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
OUT_JS = os.path.join(ROOT, "cpl_funding_cr_backlog.js")

# The MAP view name, once it lands in the Custom Reports module. Until then the
# builder also accepts a standalone array export of the same rows, so the
# artifact can be produced from a manual pull without waiting on the wiring.
VIEW = "View_StudentDetailCredits_APIDataset"

SUPPRESS_BELOW = 10  # raised 5 → 10 (Sam, 2026-08-10) — one floor for every
                     # student headcount a public surface can reach. See
                     # excel_to_dashboard.py: SERVED_SUPPRESS_BELOW.

# The four dispositions MAP writes. Anything other than NEEDS_ACTION counts as
# work done — see the fairness note above.
NEEDS_ACTION = "Needs Action"
DISPOSITIONS = ("Applied to CPL Plan", "Not Applicable", "In Process", NEEDS_ACTION)
# The three that mean "a human acted". They are known to sum to `acted`, which
# is what makes complementary suppression necessary — see _suppression_plan.
ACTED_DISPOSITIONS = tuple(d for d in DISPOSITIONS if d != NEEDS_ACTION)

# ACE says outright that no credit is recommended for these, yet they sit in
# student plans as Needs Action. They are unarticulable BY CONSTRUCTION — no
# college will ever act on one — so counting them in a backlog overstates every
# college's queue and makes the disposition rate look worse than the practice is.
# Carved out and reported separately rather than silently dropped: the count is
# itself a finding (10,178 rows / 2.3% of the backlog on the 2026-08-06 export),
# and it is a free win — auto-dispositioning them to N/A shrinks every worklist
# with no judgement required.
NOT_RECOMMENDED = re.compile(r"credit\s+is\s+not\s+recommended", re.I)

TEST_COLLEGES = {"RivTest City College", "MorTest City College", "Nortest City College",
                 "CA MAP INITIATIVE COLLEGE", "RivTest", "MorTest", "Nortest"}

TOP_N_PER_COLLEGE = 8      # how many stranded exhibits/CRs to name per college


def _load_resolver():
    """Reuse the funding roster name-join (canonical/alias/stem, collision-checked)."""
    sys.path.insert(0, HERE)
    from _build_funding_performance import _name_resolver     # noqa: E402
    return _name_resolver()


def _iter_rows(path):
    """Stream records out of either a CustomReport payload or a bare array.

    The export is ~530MB, so the rows are yielded rather than materialised; only
    the aggregates are held.
    """
    with open(path, encoding="utf-8") as f:
        text = f.read()
    dec = json.JSONDecoder()
    start = text.find("[")
    if start == -1:
        return
    # CustomReport shape: [ {viewName, columnName[], columnValue[[]]}, ... ]
    head = text[:4000]
    if '"viewName"' in head:
        data = json.loads(text)
        for report in data if isinstance(data, list) else []:
            if report.get("viewName") != VIEW or not report.get("columnValue"):
                continue
            cols = report.get("columnName", [])
            for row in report["columnValue"]:
                yield dict(zip(cols, row))
        return
    # Bare array of objects (the manual export).
    i = start + 1
    n = len(text)
    while True:
        while i < n and text[i] in " \n\r\t,":
            i += 1
        if i >= n or text[i] == "]":
            return
        obj, i = dec.raw_decode(text, i)
        yield obj


def _num(v):
    try:
        return float(v or 0)
    except (TypeError, ValueError):
        return 0.0


def _suppress(n):
    return (None, True) if 0 < n < SUPPRESS_BELOW else (n, False)


def _suppression_plan(c):
    """Which disposition cells must be hidden for the hiding to actually hold.

    PRIMARY suppression is the obvious part: any non-zero cell below
    SUPPRESS_BELOW.

    COMPLEMENTARY suppression is the part that was missing, and without it the
    primary suppression is decoration. The published record also carries
    `total` and `acted`, and the three acted dispositions are known to sum to
    `acted` — so if exactly ONE of them is hidden, a reader recovers it by
    subtraction. This was live: the 2026-08-06 build published Allan Hancock as

        total 47 | Applied null (_suppressed) | Not Applicable 6
        In Process 30 | Needs Action 10 | acted 37

    and 47 - (6+30+10) = 1, confirmed twice over by 37 - (6+30) = 1. The null
    protected nothing. Hiding a second cell leaves two unknowns against one
    equation, which is genuinely underdetermined.

    The complement is the SMALLEST remaining acted cell, including a zero —
    hiding a zero costs the least analytically and adds a real unknown, and it
    also breaks the "suppressed therefore 1..4" inference a reader would
    otherwise be entitled to make.

    KNOWN RESIDUAL, stated rather than papered over: `Needs Action` is NOT
    protected and cannot be, because backlog == total - acted and the
    disposition rate is acted/total. Any two of {total, acted, backlog, rate}
    give the third. That trio IS the deliverable — a funding view whose whole
    purpose is "how big is your backlog" cannot hide the backlog. The row-level
    floor in main() is what covers the thin colleges instead: a college with
    fewer than SUPPRESS_BELOW rows in total is not broken out at all.
    """
    hidden = {d for d in DISPOSITIONS if 0 < c.get(d, 0) < SUPPRESS_BELOW}
    if len(hidden & set(ACTED_DISPOSITIONS)) == 1:
        remaining = sorted(
            (d for d in ACTED_DISPOSITIONS if d not in hidden),
            key=lambda d: (c.get(d, 0), d),
        )
        if remaining:
            hidden.add(remaining[0])
    return hidden


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    out = OUT_JS
    if "--out" in sys.argv:
        out = sys.argv[sys.argv.index("--out") + 1]
    path = args[0] if args else None
    if path is None:
        for cand in ("CustomReport_latest.json",):
            p = os.path.join(os.getcwd(), cand)
            if os.path.exists(p):
                path = p
                break
        else:
            hits = sorted(glob.glob(os.path.join(os.getcwd(), "CustomReport_*.json")))
            path = hits[-1] if hits else None
    if not path or not os.path.exists(path):
        print(f"cr-backlog: no input found (looked for {VIEW}) — keeping the existing "
              "artifact, exiting 0.")
        return

    resolve = _load_resolver()

    per = defaultdict(Counter)                       # college -> disposition -> rows
    backlog_ex = defaultdict(Counter)                # college -> ExhibitID -> stranded rows
    backlog_cr = defaultdict(Counter)                # college -> CR text  -> stranded rows
    backlog_credits = Counter()                      # college -> stranded potential credits
    not_rec = Counter()                              # college -> unarticulable rows carved out
    in_review = Counter()                            # college -> rows with credits in review
    state = Counter()
    state_ex = Counter()
    state_cr = Counter()
    state_not_rec = 0
    unmatched = Counter()
    rows_seen = 0

    for o in _iter_rows(path):
        loc = (o.get("Location") or "").strip()
        if not loc or loc in TEST_COLLEGES:
            continue
        rows_seen += 1
        name = resolve(loc)
        if not name:
            unmatched[loc] += 1
            continue
        status = (o.get("CPLStatusPlan") or "").strip() or NEEDS_ACTION
        cr = (o.get("Credit Recommendation") or "").strip()
        # Carve out the unarticulable rows BEFORE they reach any rate or backlog.
        if NEEDS_ACTION == status and NOT_RECOMMENDED.search(cr):
            not_rec[name] += 1
            state_not_rec += 1
            continue
        per[name][status] += 1
        state[status] += 1
        if _num(o.get("CreditsInReview")) > 0:
            in_review[name] += 1
        if status == NEEDS_ACTION:
            ex = (o.get("ExhibitID") or "").strip()
            if ex:
                backlog_ex[name][ex] += 1
                state_ex[ex] += 1
            if cr:
                backlog_cr[name][cr] += 1
                state_cr[cr] += 1
            backlog_credits[name] += _num(o.get("PotentialCredits"))

    colleges = {}
    for name, c in sorted(per.items()):
        total = sum(c.values())
        stuck = c.get(NEEDS_ACTION, 0)
        acted = total - stuck
        # ROW-LEVEL FLOOR. A college with fewer than SUPPRESS_BELOW credit
        # recommendations in total is too thin to break out at all: every cell
        # in it is small by construction, and its disposition rate is noise
        # (one row moving swings it by whole percentage points). Publish its
        # existence and nothing else. This is what protects `Needs Action`,
        # which cell-level suppression provably cannot — see _suppression_plan.
        if total < SUPPRESS_BELOW:
            # Keep the SHAPE consistent with a published row (every key present,
            # all nulled) so consumers can read it without special-casing —
            # a suppressed row that omits keys turns a privacy control into a
            # KeyError downstream.
            colleges[name] = {"total": None, "total_suppressed": True,
                              "row_suppressed": True, "acted": None,
                              "disposition_rate": None, "backlog": None,
                              "backlog_credits": None, "in_review_rows": None,
                              "not_recommended_carved": None,
                              "top_exhibits": [], "top_recommendations": []}
            for d in DISPOSITIONS:
                colleges[name][d] = None
                colleges[name][d + "_suppressed"] = True
            continue

        rec = {"total": total}
        hidden = _suppression_plan(c)
        for d in DISPOSITIONS:
            if d in hidden:
                rec[d] = None
                rec[d + "_suppressed"] = True
            else:
                rec[d] = c.get(d, 0)
        # The RATE is derived from the two unsuppressed totals, never from the
        # suppressed cells — a summary must share the unit of its detail, and a
        # rate rebuilt from hidden parts would silently disagree with them.
        rec["acted"] = acted
        rec["disposition_rate"] = round(acted / total, 4) if total else None
        rec["backlog"] = stuck
        rec["backlog_credits"] = round(backlog_credits.get(name, 0.0), 2)
        rec["in_review_rows"] = in_review.get(name, 0)
        rec["not_recommended_carved"] = not_rec.get(name, 0)
        rec["top_exhibits"] = [{"exhibit": e, "rows": n}
                               for e, n in backlog_ex[name].most_common(TOP_N_PER_COLLEGE)]
        rec["top_recommendations"] = [{"cr": t, "rows": n}
                                      for t, n in backlog_cr[name].most_common(TOP_N_PER_COLLEGE)]
        colleges[name] = rec

    total_rows = sum(state.values())
    stuck_rows = state.get(NEEDS_ACTION, 0)
    payload = {
        "as_of": date.today().isoformat(),
        "source": f"MAP {VIEW} — one row per student x credit recommendation",
        "basis": (
            "DISPOSITION RATE = share of a college's listed credit recommendations that "
            "carry a disposition (Applied to CPL Plan / Not Applicable / In Process) "
            "rather than sitting at 'Needs Action'. Not Applicable counts as WORK DONE: "
            "reviewing a recommendation and correctly ruling it out is the job, and "
            "scoring only 'applied' would penalise a college for doing it properly. "
            "Rows whose recommendation is 'Credit Is Not Recommended' are excluded from "
            "both the rate and the backlog (unarticulable by construction) and reported "
            "separately as `not_recommended_carved`. Institutional aggregates only; "
            "per-college counts below 5 are suppressed."),
        "suppress_below": SUPPRESS_BELOW,
        "statewide": {
            "rows": total_rows,
            "backlog": stuck_rows,
            "acted": total_rows - stuck_rows,
            "disposition_rate": round((total_rows - stuck_rows) / total_rows, 4) if total_rows else None,
            "not_recommended_carved": state_not_rec,
            "top_exhibits": [{"exhibit": e, "rows": n} for e, n in state_ex.most_common(20)],
            "top_recommendations": [{"cr": t, "rows": n} for t, n in state_cr.most_common(20)],
        },
        "colleges": colleges,
        "unmatched": {k: v for k, v in sorted(unmatched.items())},
    }

    body = json.dumps(payload, indent=1, ensure_ascii=False)
    with open(out, "w", encoding="utf-8") as f:
        f.write("// Per-college CREDIT-RECOMMENDATION backlog + disposition rate —\n"
                "// generated by funding/_build_cr_backlog.py from the daily CustomReport\n"
                "// pull. Aggregate, small-cell-suppressed counts ONLY (the source is\n"
                "// per-student; that grain never leaves the runner). Do not hand-edit.\n"
                "window.CPL_FUNDING_CR_BACKLOG = " + body + ";\n")

    med = sorted(c["disposition_rate"] for c in colleges.values()
                 if c["disposition_rate"] is not None)
    print(f"cr-backlog: {rows_seen:,} rows -> {len(colleges)} colleges")
    print(f"  backlog {stuck_rows:,} of {total_rows:,} rows "
          f"({100 * stuck_rows / total_rows:.1f}% awaiting action)" if total_rows else "  no rows")
    print(f"  median college disposition rate: "
          f"{100 * med[len(med) // 2]:.1f}%" if med else "  no rates")
    print(f"  '{NOT_RECOMMENDED.pattern}' rows carved out: {state_not_rec:,}")
    if unmatched:
        print(f"  unmatched college names: {len(unmatched)} "
              f"({sum(unmatched.values()):,} rows) — {list(unmatched)[:4]}")
    print(f"  wrote {out}")


if __name__ == "__main__":
    main()

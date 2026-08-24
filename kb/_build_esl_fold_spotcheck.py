#!/usr/bin/env python3
"""ESL fold spot-check — every 2026-08-24 fold re-checked against course DESCRIPTIONS.

READ-ONLY. Writes only a receipt under kb/esl_beginning_worklist/<date>/.

WHY THIS EXISTS
---------------
The 2026-08-24 ESL packaging fold (Session 187) folded 1,990 identities into
seven comprehensives. 543 of those folds carried signal `default-beginning`:
the title had no level word, no numeric ladder and no carve-out, so the doctrine's
CPL-safe under-claim sent them to Beginning ESL (517 landed in Beginning, 26 were
later carved into Enrichment).

Session 188's handoff scoped the spot-check to the 543 `default-beginning` folds
and called them "the truly evidence-free pile" with no surface to review on.
All three parts of that were wrong, and this script is why:

  * There IS more evidence. The classifier only ever read the identity's modal
    TITLE. The COCI export carries a CatalogDescription for 670 of the 731 member
    courses, and those descriptions state the level outright — "at the advanced
    ESL level", "for high-intermediate ESL learners", "this low-intermediate
    level course". 109 of 543 rows carry a description-level finding; 102 of them resolve to a
    concrete re-level proposal.
  * There IS a repair, available today. Every one of these folds is a
    `merge_into` row owned by the fold cohort, so re-leveling is an UPDATE of
    that row's target (one level survivor -> another). It needs none of the
    three missing verbs the handoff lists.
  * The `default-beginning` lane is NOT where most of the risk lives. Running the
    same check across ALL 1,990 folds CALIBRATES each fold signal by how often it
    disagrees with the college's own catalog description:

        signal / confidence        disagrees  agrees  unchecked  wrong rate
        combo/medium                       2       0          3      100.0%
        default-beginning/medium         102      31        384       76.7%
        numeric/medium                    94      97        241       49.2%
        combo/high                         1       7         24       12.5%
        word/high                         23     345        455        6.2%

    The ratified NUMERIC pinning (1-2 Beginning / 3-4 Intermediate / 5+ Advanced)
    is close to a COIN FLIP wherever a description can check it. The handoff
    ranked that lane BELOW `default-beginning` on the grounds that a number in a
    title "is weak evidence, but IS evidence"; measured, it is 94 more rows of
    work of the same kind. `word` at 6.2% is the only signal that behaves like a
    high-confidence one, which is what it was labelled. `combo/medium` is 2 of 2
    wrong, which is too few rows to conclude from but is at least consistent with
    the doctrine's own hedge — the Beginning-Advanced span was pinned to the
    midpoint and explicitly marked "review".
    ⚠️ The wrong rate is over rows a description can CHECK, not over the lane —
    241 of 434 numeric folds carry no description assertion either way.

⚠️ WHAT THIS DELIBERATELY DOES NOT DO — the local course NUMBER is not a level.
    A calibrated ladder was built and REJECTED: anchor each college+subject's
    numbers against the siblings whose titles DO carry a level word, then place
    the unlabelled member. It fails, and not marginally. A college runs SEVERAL
    parallel numbering schemes at once — Santa Rosa's EMLS anchors land at 30
    (Advanced), 371/372 (Intermediate) and 701/702 (Beginning), because the 700s
    are the noncredit mirror of the 300s, not a higher rung. And courses that sit
    OFF the ladder entirely still carry numbers: Hartnell's `ENGM 190A` "English
    in the Lab A" placed against a 158 Intermediate anchor purely by proximity.
    Nearest-number would have proposed re-levels for 325 rows on an ordinal that
    does not exist. Same shape as the TOP-code doctrine (Rule 7): a field that
    looks ordinal, is faculty-entered, and means different things per college is
    a fuzzy aid, never a determination.

SIGNAL TIERS (a level assertion about THIS course, not its prerequisite)
  A  explicit band phrase — "at the advanced ESL level", "high-intermediate ESL
     learners", "this low-intermediate level course", "course for beginning..."
  B  strand adjective — "advanced writing", "intermediate speaking". Weaker: it
     can describe the TOPIC rather than the cohort, so it is ranked below A and
     never merged with it.
  P  prerequisite-only — a level named inside a "Prerequisite:/Advisory:" clause.
     This is evidence the course sits ABOVE that level, not AT it, so it is
     reported and never turned into a proposal.

⚠️ Prerequisite clauses are STRIPPED before tier A/B matching. Reading "Advisory:
   completion of Intermediate ESL" as an intermediate-level assertion would invert
   the finding on exactly the rows most worth getting right.
⚠️ "Basic Skills Level:" is catalog boilerplate (a COCI field name), not a claim
   that the course is basic, so it is stripped too. MEASURED: only 2 member
   descriptions carry the field today and both read "Open Curriculum", which
   matches nothing — the strip is FORWARD INSURANCE against a college writing a
   band into that field, not a fix for a live defect. Its test case is written
   against a band-valued field for that reason; a case written against the live
   value would pass with the strip removed and guard nothing.

Run from repo root:
    python3 kb/_build_esl_fold_spotcheck.py [--date YYYY-MM-DD]
                                            [--scope all|default-beginning]

Writes: kb/esl_fold_spotcheck/<date>/worklist.json
        kb/esl_fold_spotcheck/<date>/report.md
"""
from __future__ import annotations

import argparse
import collections
import datetime
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

APPLY_PLAN = "kb/esl_package_out/2026-08-24/esl_apply_plan.json"
CLASS_PLAN = "kb/esl_package_out/2026-07-15/esl_package_plan.json"
XLSX = "kb/reference/coci_course_list.xlsx"

# the fold cohort that owns every row this worklist may propose against
FOLD_COHORT = "package-esl-s187@bot"

# survivors, by band — the re-level targets
SURVIVOR = {
    "Beginning": "ESOL M9168",
    "Intermediate": "ESOL M9256",
    "Advanced": "ESOL M1141",
}

# ⚠️ Only these buckets are LEVEL buckets. Enrichment / Civic / Vocational ESL are
#    PURPOSE carve-outs, and a level assertion inside one says the level is
#    different, NOT that the carve-out is wrong. Re-pointing an Enrichment row at
#    Advanced ESL would silently strip the carve-out that put it there, so those
#    rows are REPORTED and never proposed.
LEVEL_BUCKETS = {"Beginning ESL", "Intermediate ESL", "Advanced ESL"}

# a level bucket -> the band it asserts, so a fold in ANY lane can be checked
BUCKET_BAND = {"Beginning ESL": "Beginning",
               "Intermediate ESL": "Intermediate",
               "Advanced ESL": "Advanced"}

# ── description hygiene ──────────────────────────────────────────────────────
_WS = re.compile(r"\s+")
# "Basic Skills Level:" is a COCI FIELD NAME in the description blob, not a level
# strip the WHOLE clause, not just the field name — a band written into the
# field VALUE ("Basic Skills Level: Beginning ESL") still matches tier A
# otherwise, which is the same mistake as stripping "Prerequisite" and leaving
# the course it names. Bounded like PREREQ so it cannot swallow the description.
BOILERPLATE = re.compile(r"basic skills level\s*:[^;.\n]{0,40}", re.I)
# a prerequisite names the rung BELOW this course — strip before matching
PREREQ = re.compile(
    r"(?:prerequisite|prereq|advisory|advisories|recommended preparation"
    r"|corequisite)s?\b[^.;]{0,160}", re.I)

_L = r"(?:high[- ]?|low[- ]?)?(beginning|beginner|intermediate|advanced|literacy)"

TIER_A = [re.compile(p, re.I) for p in (
    rf"at the {_L}[ -]?(?:esl |english )?level",
    rf"{_L}[ -]level (?:esl|english|course|student|learner|speaker)",
    rf"for {_L}[ -](?:esl |english |level )?(?:student|learner|speaker|adult)",
    rf"{_L} (?:esl|english language learner|english learner|ell)\b",
    rf"(?:this is a|this) (?:very )?{_L} (?:course|class|level)",
    rf"course for {_L}\b",
)]
TIER_B = [re.compile(
    rf"{_L} (?:reading|writing|listening|speaking|grammar|conversation"
    rf"|pronunciation|vocabulary)", re.I)]
PREREQ_LEVEL = re.compile(_L, re.I)

BAND = {"beginning": "Beginning", "beginner": "Beginning", "literacy": "Beginning",
        "intermediate": "Intermediate", "advanced": "Advanced"}


def fix_moji(s: str) -> str:
    """Repair the double-encoded text the COCI export carries (CaÃ±ada, oneÃ¢â‚¬â„¢s)."""
    if s and "Ã" in s:
        try:
            return s.encode("latin-1").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            return s
    return s


def clean_desc(s: str) -> str:
    if not s:
        return ""
    return _WS.sub(" ", fix_moji(s.replace("_x000D_", " "))).strip()


def assess(desc: str) -> dict:
    """Level evidence in ONE member's catalog description."""
    text = clean_desc(desc)
    if not text:
        return {"a": [], "b": [], "prereq": []}
    body = BOILERPLATE.sub(" ", text)
    prereq_text = " ".join(m.group(0) for m in PREREQ.finditer(body))
    body = PREREQ.sub(" ", body)
    return {
        "a": [(BAND[m.group(1).lower()], m.group(0)[:80])
              for p in TIER_A for m in p.finditer(body)],
        "b": [(BAND[m.group(1).lower()], m.group(0)[:80])
              for p in TIER_B for m in p.finditer(body)],
        "prereq": sorted({BAND[m.group(1).lower()]
                          for m in PREREQ_LEVEL.finditer(prereq_text)}),
    }


def majority(found) -> str | None:
    """Modal band across matches; 'CONFLICT' on a tie between two bands."""
    counts = collections.Counter(b for b, _ in found).most_common()
    if not counts:
        return None
    if len(counts) == 1 or counts[0][1] > counts[1][1]:
        return counts[0][0]
    return "CONFLICT"


def categorize(ev_a, ev_b, ev_p, current_band="Beginning"):
    """(category, proposed_band_or_None), relative to the band the fold ASSIGNED.

    `current_band` defaults to Beginning because that is the `default-beginning`
    lane this started as; pass the fold's own band to check any other lane.
    """
    band_a, band_b = majority(ev_a), majority(ev_b)
    if band_a == "CONFLICT":
        return "conflict", None
    if band_a:
        return ("contradicts", band_a) if band_a != current_band else ("confirms", None)
    if band_b == "CONFLICT":
        return "conflict", None
    if band_b:
        return (("weak-contradicts", band_b) if band_b != current_band
                else ("confirms", None))
    if ev_p:
        return "prereq-only", None
    return "no-signal", None


RANK = {"contradicts": 0, "conflict": 1, "weak-contradicts": 2,
        "level-in-purpose-bucket": 3, "prereq-only": 4, "confirms": 5,
        "no-signal": 6}


def load_members():
    """control_number -> member course record, for every ESL fold member."""
    memberships = json.load(open(os.path.join(ROOT, "kb/coci_minted_memberships.json"),
                                 encoding="utf-8"))["memberships"]
    singletons = json.load(open(os.path.join(ROOT, "kb/coci_minted_singletons.json"),
                                encoding="utf-8"))["courses"]
    return memberships, singletons


def read_coci(wanted):
    """control_number -> {college, subject, num, title, credit, units, desc}."""
    import openpyxl
    ws = openpyxl.load_workbook(os.path.join(ROOT, XLSX), read_only=True).worksheets[0]
    it = ws.iter_rows(values_only=True)
    ix = {h: i for i, h in enumerate(next(it))}
    out = {}
    for row in it:
        cn = row[ix["CourseControlNumber"]]
        if cn not in wanted:
            continue
        out[cn] = {
            "cn": cn,
            "college": fix_moji(row[ix["College"]]),
            "subject": row[ix["Subject"]],
            "num": str(row[ix["Course_Number"]] or ""),
            "title": fix_moji(row[ix["CourseTitle"]] or ""),
            "units": row[ix["UnitValue"]],
            "credit": row[ix["CreditType"]],
            "desc": row[ix["CatalogDescription"]] or "",
        }
    return out


def build(date, scope="all"):
    plan = json.load(open(os.path.join(ROOT, APPLY_PLAN), encoding="utf-8"))
    classified = {r["id"]: r for r in json.load(
        open(os.path.join(ROOT, CLASS_PLAN), encoding="utf-8"))["identities"]}
    curations = json.load(open(os.path.join(ROOT, "kb/coci_curation.json"),
                               encoding="utf-8"))["curations"]
    memberships, singletons = load_members()

    folds = plan["folds"]
    if scope == "default-beginning":
        folds = [f for f in folds if f.get("sig") == "default-beginning"]

    def members_of(ident):
        if ident in memberships:
            return [{"college": m.get("college"), "subject": m.get("subject"),
                     "num": m.get("course_number"), "cn": m.get("control_number")}
                    for m in memberships[ident]]
        if ident in singletons:
            s = singletons[ident]
            return [{"college": s.get("college"), "subject": s.get("subject"),
                     "num": s.get("course_number"), "cn": s.get("control_number")}]
        return []

    fold_members = {f["id"]: members_of(f["id"]) for f in folds}
    wanted = {m["cn"] for ms in fold_members.values() for m in ms if m["cn"]}
    coci = read_coci(wanted)

    rows, skipped_not_cohort = [], []
    for f in folds:
        ident = f["id"]
        cur = curations.get(ident) or {}
        owner = cur.get("reviewed_by", "")
        # ⚠️ Rule 10: never propose against a row a human curator owns.
        if cur.get("merge_into") and owner != FOLD_COHORT:
            skipped_not_cohort.append({"id": ident, "reviewed_by": owner})
            continue

        ev_a, ev_b, ev_p, members = [], [], [], []
        for m in fold_members[ident]:
            rec = coci.get(m["cn"])
            a = assess(rec["desc"] if rec else "")
            ev_a += a["a"]
            ev_b += a["b"]
            ev_p += a["prereq"]
            members.append({
                "college": m["college"], "subject": m["subject"],
                "number": m["num"], "control_number": m["cn"],
                "local_title": (rec or {}).get("title"),
                "credit_type": (rec or {}).get("credit"),
                "has_description": bool(rec and rec["desc"].strip()),
                "level_quotes": [q for _, q in a["a"]] + [q for _, q in a["b"]],
            })

        current = BUCKET_BAND.get(f["bucket"])
        category, proposed = categorize(ev_a, ev_b, ev_p,
                                        current_band=current or "Beginning")
        # a level assertion inside a PURPOSE carve-out is not a re-level proposal
        if proposed and current is None:
            category, proposed = "level-in-purpose-bucket", None
        meta = classified.get(ident, {})
        rows.append({
            "id": ident,
            "identity_title": meta.get("title", ""),
            "fold_signal": f.get("sig"),
            "fold_confidence": f.get("conf"),
            "current_band": current,
            "src": meta.get("src"),
            "credit_status": meta.get("credit_status"),
            "units": meta.get("units"),
            "top_code": meta.get("top_code"),
            "folded_into": f["into"],
            "bucket": f["bucket"],
            "category": category,
            "proposed_band": proposed,
            "proposed_target": SURVIVOR[proposed] if proposed else None,
            "evidence_tier": "A" if ev_a else ("B" if ev_b else ("P" if ev_p else None)),
            "prereq_levels": sorted(set(ev_p)),
            "members": members,
        })

    rows.sort(key=lambda r: (RANK[r["category"]], -len(r["members"]), r["id"]))
    counts = collections.Counter(r["category"] for r in rows)
    by_band = collections.Counter(
        r["proposed_band"] for r in rows if r["proposed_band"])

    # ⭐ calibration: how often does each FOLD SIGNAL disagree with the college's
    #    own description, over the rows a description can actually check?
    calib = {}
    for r in rows:
        if r["current_band"] is None:
            continue
        # ⚠️ key on signal AND confidence — `combo` carries BOTH high and medium
        #    rows, so a signal-only key would label the lane with whichever
        #    confidence happened to be read first.
        sig = f"{r['fold_signal'] or '(none)'}/{r['fold_confidence'] or '?'}"
        c = calib.setdefault(sig, {"signal": r["fold_signal"],
                                   "confidence": r["fold_confidence"],
                                   "disagrees": 0, "agrees": 0, "unchecked": 0})
        if r["category"] in ("contradicts", "weak-contradicts"):
            c["disagrees"] += 1
        elif r["category"] == "confirms":
            c["agrees"] += 1
        else:
            c["unchecked"] += 1
    # ⭐ the numeric lane's mis-fires are DIRECTIONAL, which is the diagnosis:
    #    at the bottom of the ladder the doctrine under-claims, at the top it
    #    over-claims. That is what happens when colleges run ladders of
    #    different LENGTHS — a college with a 1-3 ladder has "2" as its MIDDLE
    #    rung while the pinning assumes 1-2 is still Beginning.
    ORDER = {"Beginning": 0, "Intermediate": 1, "Advanced": 2}
    direction = collections.Counter()
    for r in rows:
        if r["fold_signal"] != "numeric" or not r["proposed_band"]:
            continue
        if r["current_band"] is None:
            continue
        delta = ORDER[r["proposed_band"]] - ORDER[r["current_band"]]
        direction["doctrine_under_claimed" if delta > 0
                  else "doctrine_over_claimed"] += 1

    for c in calib.values():
        checked = c["disagrees"] + c["agrees"]
        # ⚠️ over rows a description can CHECK, never over the whole lane
        c["checked"] = checked
        c["wrong_rate"] = round(c["disagrees"] / checked, 3) if checked else None

    return {
        "_status": "WORKLIST — read-only measurement. No curation write performed.",
        "_date": date,
        "_source_plan": APPLY_PLAN,
        "_fold_cohort": FOLD_COHORT,
        "_survivors": SURVIVOR,
        "_signal": "member CatalogDescription level assertions (COCI course list)",
        "_rejected_signal": (
            "local course NUMBER ladder — a college runs parallel numbering "
            "schemes (credit vs noncredit mirrors) and off-ladder labs carry "
            "numbers too, so nearest-anchor placement is not an ordinal. "
            "325 rows would have been proposed on it."),
        "_scope": scope,
        "counts": dict(counts),
        "signal_calibration": calib,
        "numeric_ladder_direction": dict(direction),
        "proposed_by_band": dict(by_band),
        "description_coverage": {
            "members_total": sum(len(r["members"]) for r in rows),
            "members_with_description": sum(
                1 for r in rows for m in r["members"] if m["has_description"]),
        },
        "skipped_curator_owned": skipped_not_cohort,
        "rows": rows,
    }


def report_md(w):
    c = w["counts"]
    head = (c.get("contradicts", 0) + c.get("conflict", 0)
            + c.get("weak-contradicts", 0))
    n = len(w["rows"])
    scoped = w["_scope"] == "default-beginning"
    lede = (
        f"**{n} folds** carried signal `default-beginning` — no level word, no "
        "numeric ladder, no carve-out — so the doctrine's CPL-safe under-claim "
        "sent them to Beginning ESL."
        if scoped else
        f"**All {n} folds** from the 2026-08-24 ESL packaging pass, each "
        "re-checked against the catalog DESCRIPTIONS of its member courses — "
        "evidence the fold classifier never read, because it only ever looked "
        "at the identity's modal title.")
    lines = [
        "# ESL fold spot-check",
        "",
        f"_Generated {w['_date']} · read-only · scope `{w['_scope']}` · "
        f"source `{w['_source_plan']}`_",
        "",
        lede,
        "",
        f"**{head} of them carry description evidence that disagrees with the "
        f"band the fold assigned.** {c.get('no-signal', 0)} carry no level "
        "assertion either way, and there is nothing to review on those.",
        "",
        "| Category | Rows | What it means |",
        "|---|---:|---|",
        f"| `contradicts` | {c.get('contradicts', 0)} | An explicit band phrase "
        "in the member description says a different level. **Work these first.** |",
        f"| `conflict` | {c.get('conflict', 0)} | Members assert different bands "
        "— needs a human. |",
        f"| `weak-contradicts` | {c.get('weak-contradicts', 0)} | Only a strand "
        "adjective (\"advanced writing\") — may describe the topic, not the "
        "cohort. |",
        f"| `level-in-purpose-bucket` | {c.get('level-in-purpose-bucket', 0)} | "
        "The description names a level, but the row sits in a PURPOSE carve-out "
        "(Enrichment/Civic/Vocational). Re-pointing it would strip the "
        "carve-out, so it is reported, never proposed. |",
        f"| `prereq-only` | {c.get('prereq-only', 0)} | A level appears only in a "
        "prerequisite clause — evidence the course sits ABOVE it, never a "
        "proposal. |",
        f"| `confirms` | {c.get('confirms', 0)} | Description agrees with the "
        "assigned band. Accept. |",
        f"| `no-signal` | {c.get('no-signal', 0)} | No level assertion anywhere. "
        "The fold's own signal stands by doctrine. |",
        "",
        "Proposed re-levels: " + (", ".join(
            f"**{v} → {k}**" for k, v in sorted(w["proposed_by_band"].items()))
            or "none"),
        "",
    ]

    if w.get("signal_calibration"):
        lines += [
            "## ⭐ Which fold signal actually held up",
            "",
            "How often each signal disagrees with the college's own catalog "
            "description. ⚠️ The rate is over rows a description can **check** — "
            "`unchecked` rows assert nothing either way and are excluded, not "
            "counted as agreement.",
            "",
            "| Signal / confidence | Disagrees | Agrees | Unchecked | Wrong rate |",
            "|---|---:|---:|---:|---:|",
        ]
        for sig, cal in sorted(w["signal_calibration"].items(),
                               key=lambda kv: -(kv[1]["wrong_rate"] or 0)):
            rate = ("n/a" if cal["wrong_rate"] is None
                    else f"{cal['wrong_rate']:.1%}")
            lines.append(f"| `{sig}` | {cal['disagrees']} | {cal['agrees']} | "
                         f"{cal['unchecked']} | **{rate}** |")
        lines.append("")

    d = w.get("numeric_ladder_direction") or {}
    if d:
        up, down = d.get("doctrine_under_claimed", 0), d.get("doctrine_over_claimed", 0)
        lines += [
            "### Why the numeric lane fails: ladders are different LENGTHS",
            "",
            f"The mis-fires are **directional, not random** — {up} under-claim, "
            f"{down} over-claim. The ratified pinning (1-2 Beginning / 3-4 "
            "Intermediate / 5+ Advanced) assumes every college runs a ladder of "
            "the same length. A college with a **1-3** ladder has `2` as its "
            "MIDDLE rung, so \"Listening and Speaking 2\" is *intermediate* in "
            "its own catalog while the pinning reads it as Beginning.",
            "",
            f"⚠️ **The {down} over-claims are the ones to look at first**, even "
            f"though the {up} under-claims are far more numerous. Under-claiming "
            "is the direction the doctrine deliberately chose (award at the entry "
            "band rather than over-claim); over-claiming is the direction it "
            "exists to prevent.",
            "",
        ]

    lines += [
        "## The repair is available today",
        "",
        "Every row here is a `merge_into` owned by `" + w["_fold_cohort"] +
        "`, so a re-level is an UPDATE of that row's target — one level "
        "survivor for another (" +
        " · ".join(f"{k} `{v}`" for k, v in sorted(w["_survivors"].items())) +
        "). It needs none of the three missing verbs (un-merge, "
        "relabel-island, re-home-inside-a-merged-identity).",
        "",
        "## What was rejected",
        "",
        w["_rejected_signal"],
        "",
        "## Head of the queue",
        "",
    ]
    for r in w["rows"]:
        if r["category"] not in ("contradicts", "conflict"):
            continue
        arrow = (f" — folded **{r['current_band']}**, description says "
                 f"**{r['proposed_band']}** (`{r['proposed_target']}`)"
                 if r["proposed_band"] else
                 f" — folded **{r['current_band']}**, members disagree; "
                 "**needs a human**")
        lines.append(f"### `{r['id']}` — {r['identity_title']}{arrow}")
        lines.append(f"_fold signal: `{r['fold_signal']}` "
                     f"({r['fold_confidence']} confidence)_")
        for m in r["members"]:
            q = "; ".join(f"_\u201c{x}\u201d_" for x in m["level_quotes"][:2])
            if not q:
                continue
            lines.append(f"- {m['college']} · {m['subject']} {m['number']} — "
                         f"{m['local_title']}  \n  {q}")
        lines.append("")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=datetime.date.today().isoformat())
    ap.add_argument("--scope", default="all",
                    choices=["all", "default-beginning"])
    args = ap.parse_args()

    w = build(args.date, args.scope)
    outdir = os.path.join(ROOT, "kb", "esl_fold_spotcheck", args.date)
    os.makedirs(outdir, exist_ok=True)
    with open(os.path.join(outdir, "worklist.json"), "w", encoding="utf-8") as fh:
        json.dump(w, fh, indent=1, ensure_ascii=False)
    with open(os.path.join(outdir, "report.md"), "w", encoding="utf-8") as fh:
        fh.write(report_md(w))

    print(f"scope: {w['_scope']}   rows: {len(w['rows'])}")
    for k, v in sorted(w["counts"].items(), key=lambda kv: -kv[1]):
        print(f"  {v:5d}  {k}")
    print(f"proposed re-levels: {w['proposed_by_band']}")
    print("signal calibration (over rows a description can CHECK):")
    for sig, c in sorted(w["signal_calibration"].items(),
                         key=lambda kv: -(kv[1]["wrong_rate"] or 0)):
        rate = "n/a" if c["wrong_rate"] is None else f"{c['wrong_rate']:.1%}"
        print(f"  {sig:<26s} "
              f"disagrees {c['disagrees']:4d}  agrees {c['agrees']:4d}  "
              f"unchecked {c['unchecked']:4d}  wrong {rate}")
    cov = w["description_coverage"]
    print(f"description coverage: {cov['members_with_description']} of {cov['members_total']} members")
    if w["skipped_curator_owned"]:
        print(f"skipped (curator-owned, Rule 10): {len(w['skipped_curator_owned'])}")
    print(f"wrote {outdir}/worklist.json + report.md")


if __name__ == "__main__":
    main()

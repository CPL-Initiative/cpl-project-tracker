#!/usr/bin/env python3
"""Beginning-ESL spot-check worklist — the 543 folds that carried NO level signal.

READ-ONLY. Writes only a receipt under kb/esl_beginning_worklist/<date>/.

WHY THIS EXISTS
---------------
The 2026-08-24 ESL packaging fold (Session 187) folded 1,990 identities into
seven comprehensives. 543 of those folds carried signal `default-beginning`:
the title had no level word, no numeric ladder and no carve-out, so the doctrine's
CPL-safe under-claim sent them to Beginning ESL (517 landed in Beginning, 26 were
later carved into Enrichment).

Session 188's handoff called this "the truly evidence-free pile" and said the
spot-check had no surface. Both halves were wrong, and this script is why:

  * There IS more evidence. The classifier only ever read the identity's modal
    TITLE. The COCI export carries a CatalogDescription for 670 of the 731 member
    courses, and those descriptions state the level outright — "at the advanced
    ESL level", "for high-intermediate ESL learners", "this low-intermediate
    level course". 109 of 543 rows carry a description-level finding; 102 of them resolve to a
    concrete re-level proposal.
  * There IS a repair, available today. Every one of these folds is a
    `merge_into` row owned by the fold cohort, so re-leveling is an UPDATE of
    that row's target (Beginning survivor -> Intermediate or Advanced survivor).
    It needs none of the three missing verbs the handoff lists.

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
    python3 kb/_build_esl_beginning_worklist.py [--date YYYY-MM-DD]

Writes: kb/esl_beginning_worklist/<date>/worklist.json
        kb/esl_beginning_worklist/<date>/report.md
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


def categorize(ev_a, ev_b, ev_p):
    """(category, proposed_band_or_None) — tier A wins outright over tier B."""
    band_a, band_b = majority(ev_a), majority(ev_b)
    if band_a == "CONFLICT":
        return "conflict", None
    if band_a and band_a != "Beginning":
        return "contradicts", band_a
    if band_a == "Beginning":
        return "confirms", None
    if band_b == "CONFLICT":
        return "conflict", None
    if band_b and band_b != "Beginning":
        return "weak-contradicts", band_b
    if band_b == "Beginning":
        return "confirms", None
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


def build(date):
    plan = json.load(open(os.path.join(ROOT, APPLY_PLAN), encoding="utf-8"))
    classified = {r["id"]: r for r in json.load(
        open(os.path.join(ROOT, CLASS_PLAN), encoding="utf-8"))["identities"]}
    curations = json.load(open(os.path.join(ROOT, "kb/coci_curation.json"),
                               encoding="utf-8"))["curations"]
    memberships, singletons = load_members()

    folds = [f for f in plan["folds"] if f.get("sig") == "default-beginning"]

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

        category, proposed = categorize(ev_a, ev_b, ev_p)
        # a level assertion inside a PURPOSE carve-out is not a re-level proposal
        if proposed and f["bucket"] not in LEVEL_BUCKETS:
            category, proposed = "level-in-purpose-bucket", None
        meta = classified.get(ident, {})
        rows.append({
            "id": ident,
            "identity_title": meta.get("title", ""),
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
        "counts": dict(counts),
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
    head = c.get("contradicts", 0) + c.get("conflict", 0) + c.get("weak-contradicts", 0)
    lines = [
        "# Beginning-ESL spot-check worklist",
        "",
        f"_Generated {w['_date']} · read-only · source `{w['_source_plan']}`_",
        "",
        f"**{len(w['rows'])} folds** carried signal `default-beginning` — no level "
        "word, no numeric ladder, no carve-out — so the doctrine's CPL-safe "
        "under-claim sent them to Beginning ESL.",
        "",
        f"**{head} of them carry description evidence that contradicts Beginning.** "
        f"The remaining {c.get('no-signal', 0)} are evidence-free at the "
        "description layer too, and there is nothing to review on them.",
        "",
        "| Category | Rows | What it means |",
        "|---|---:|---|",
        f"| `contradicts` | {c.get('contradicts', 0)} | An explicit band phrase in the "
        "member description says a different level. **Work these first.** |",
        f"| `conflict` | {c.get('conflict', 0)} | Members assert different bands — needs a human. |",
        f"| `weak-contradicts` | {c.get('weak-contradicts', 0)} | Only a strand adjective "
        "(\"advanced writing\") — may describe the topic, not the cohort. |",
        f"| `level-in-purpose-bucket` | {c.get('level-in-purpose-bucket', 0)} | The "
        "description names a level, but the row sits in a PURPOSE carve-out "
        "(Enrichment/Civic/Vocational). Re-pointing it would strip the carve-out, "
        "so it is reported, never proposed. |",
        f"| `prereq-only` | {c.get('prereq-only', 0)} | A level appears only in a "
        "prerequisite clause — evidence the course sits ABOVE it, never a proposal. |",
        f"| `confirms` | {c.get('confirms', 0)} | Description confirms Beginning. Accept. |",
        f"| `no-signal` | {c.get('no-signal', 0)} | No level assertion anywhere. Beginning stands by doctrine. |",
        "",
        "Proposed re-levels: " + ", ".join(
            f"**{v} → {k}**" for k, v in sorted(w["proposed_by_band"].items())) or "none",
        "",
        "## The repair is available today",
        "",
        "Every row here is a `merge_into` owned by `" + w["_fold_cohort"] + "`, so a "
        "re-level is an UPDATE of that row's target — "
        f"`{w['_survivors']['Beginning']}` → `{w['_survivors']['Intermediate']}` or "
        f"`{w['_survivors']['Advanced']}`. It needs none of the three missing verbs "
        "(un-merge, relabel-island, re-home-inside-a-merged-identity).",
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
        arrow = f" → **{r['proposed_band']}** (`{r['proposed_target']}`)" if r["proposed_band"] else " → **needs a human**"
        lines.append(f"### `{r['id']}` — {r['identity_title']}{arrow}")
        for m in r["members"]:
            q = "; ".join(f"_“{x}”_" for x in m["level_quotes"][:2]) or "—"
            lines.append(
                f"- {m['college']} · {m['subject']} {m['number']} — "
                f"{m['local_title']}  \n  {q}")
        lines.append("")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=datetime.date.today().isoformat())
    args = ap.parse_args()

    w = build(args.date)
    outdir = os.path.join(ROOT, "kb", "esl_beginning_worklist", args.date)
    os.makedirs(outdir, exist_ok=True)
    with open(os.path.join(outdir, "worklist.json"), "w", encoding="utf-8") as fh:
        json.dump(w, fh, indent=1, ensure_ascii=False)
    with open(os.path.join(outdir, "report.md"), "w", encoding="utf-8") as fh:
        fh.write(report_md(w))

    print(f"rows: {len(w['rows'])}")
    for k, v in sorted(w["counts"].items(), key=lambda kv: -kv[1]):
        print(f"  {v:5d}  {k}")
    print(f"proposed re-levels: {w['proposed_by_band']}")
    cov = w["description_coverage"]
    print(f"description coverage: {cov['members_with_description']} of {cov['members_total']} members")
    if w["skipped_curator_owned"]:
        print(f"skipped (curator-owned, Rule 10): {len(w['skipped_curator_owned'])}")
    print(f"wrote {outdir}/worklist.json + report.md")


if __name__ == "__main__":
    main()

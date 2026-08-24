#!/usr/bin/env python3
"""ESL re-level DRY-RUN — apply Sam's ratified level bands to the landed 2026-08-24 fold.

READ-ONLY. Writes nothing to kb_curation, nothing to Supabase. Emits a receipt under
kb/esl_relevel_out/<date>/ so the effect can be reviewed before any apply.

SAM'S RULING (2026-08-24, in session, twice):
    "Level 6 ESL can go in Advanced"
    "For ESL with Levels indicated: 0-2 = Beginning; 3-5 = Intermediate; 6-10 = Advanced"

This SUPERSEDES the P-4 pinning (1-2 / 3-4 / 5+) for numeric titles. Two things change:
the Intermediate band gains rung 5, and the reader must see 0 and 8-10 at all.

⚠️ WHY THE MEASURED "WRONG RATE" GOES UP AND THAT IS NOT AN OBJECTION.
    Against the colleges' own catalog descriptions Sam's bands disagree MORE than the old
    pinning (54.5% vs 49.2% of the rows a description can decide) — because 16 Level-5
    courses are called "advanced" in their own catalogs and now file as Intermediate.
    That number is BLAST RADIUS, not a verdict. The catalogs are ~116 colleges disagreeing
    with EACH OTHER (at rung 1 they split 47% Beginning / 44% Intermediate), and a
    statewide canonical mapping exists precisely to override local variance. The right use
    of the measurement is to know who will see their course filed below their own wording.

    What the colleges' catalogs actually call each rung (checkable rows only):
        0-1  Beginning 47% · Intermediate 44% · Advanced  9%   <- no usable majority
        2    Beginning 18% · Intermediate 63% · Advanced 20%
        3    Beginning  3% · Intermediate 73% · Advanced 24%
        4    Beginning  4% · Intermediate 54% · Advanced 42%
        5                    Intermediate 27% · Advanced 73%
        6                    Intermediate  9% · Advanced 91%   <- Sam's call, corroborated
        7                                       Advanced 100%

READER GUARDS — a naive 0-10 reader misfires immediately, so all three of these are
required, and each was found in live data, not imagined:

  1. A LEVEL WORD BEATS A NUMBER. `ESOL M90WL` "Beginning Skills 9" would file as
     Advanced on its number while its own title says Beginning. Precedence is preserved
     from the original classifier: word -> numeric -> default.
  2. A GRADE RANGE IS NOT A LEVEL. `ESOL M90DB` "ESL Parent Involvement in K-12" reads as
     level 12. `K-\\d+` is stripped before any number is read.
  3. ROMAN NUMERALS STOP AT VII. `ESOL M90WH` "Beginning Skills 2 X" would read the
     trailing X as roman 10 -> Advanced. A bare trailing X/IX/VIII is far more often a
     section marker than a rung, and rungs that high are already vanishingly rare, so the
     roman reader keeps its original I-VII range and never grew.

Run from repo root:
    python3 kb/_esl_relevel_dryrun.py [--date YYYY-MM-DD]

Writes: kb/esl_relevel_out/<date>/plan.json
        kb/esl_relevel_out/<date>/report.md
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
SPOTCHECK = "kb/esl_fold_spotcheck/2026-08-24/worklist.json"
FOLD_COHORT = "package-esl-s187@bot"

SURVIVOR = {"Beginning": "ESOL M9168",
            "Intermediate": "ESOL M9256",
            "Advanced": "ESOL M1141"}
LEVEL_BUCKETS = {"Beginning ESL", "Intermediate ESL", "Advanced ESL"}
BUCKET_BAND = {"Beginning ESL": "Beginning",
               "Intermediate ESL": "Intermediate",
               "Advanced ESL": "Advanced"}

# ── Sam's bands ─────────────────────────────────────────────────────────────
BANDS = ((0, 2, "Beginning"), (3, 5, "Intermediate"), (6, 10, "Advanced"))


def band_for(n):
    """Sam's ruling. Returns None outside 0-10 — a number that large is not a rung."""
    if n is None:
        return None
    for lo, hi, band in BANDS:
        if lo <= n <= hi:
            return band
    return None


# ── the reader, with the three guards ───────────────────────────────────────
GRADE_RANGE = re.compile(r"\bK\s*-\s*\d{1,2}\b", re.I)   # guard 2
LEVEL_NUM = re.compile(r"\b(?:level|stage|step|esl|part)\s*[-:]?\s*(\d{1,2})\b", re.I)
ROMAN = re.compile(r"\b(VII|VI|IV|V|III|II|I)\b")        # guard 3 — stops at VII
ROMAN_MAP = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7}
TRAIL_INT = re.compile(r"\b(\d{1,2})\b(?!\s*[A-Za-z])")

BEG = re.compile(r"\bbeginning\b|\bbeginner\b|\bbasic\b|\bliteracy\b|\bfoundation"
                 r"|\bintroductory\b|\bintro\b|\belementary\b|\bnovice\b|\bsurvival\b"
                 r"|\blow-?beginning\b|\bhigh-?beginning\b", re.I)
INT = re.compile(r"\bintermediate\b|\blow-?intermediate\b|\bhigh-?intermediate\b", re.I)
ADV = re.compile(r"\badvanced\b|\bhigh-?advanced\b", re.I)


def read_level(title):
    """(number_or_None, why). Applies guard 2 and guard 3; guard 1 lives in classify()."""
    t = GRADE_RANGE.sub(" ", title or "")          # guard 2
    m = LEVEL_NUM.search(t)
    if m:
        return int(m.group(1)), "level-word-number"
    m = ROMAN.search(t)
    if m:
        return ROMAN_MAP[m.group(1)], "roman"
    m = TRAIL_INT.search(t)
    if m:
        return int(m.group(1)), "trailing-integer"
    return None, None


def classify(title):
    """(band, signal) under Sam's bands. Guard 1: a level WORD outranks a number."""
    t = title or ""
    has_b, has_i, has_a = bool(BEG.search(t)), bool(INT.search(t)), bool(ADV.search(t))
    if has_i and has_a:
        return "Advanced", "combo"
    if has_b and has_i:
        return "Beginning", "combo"
    if has_b and has_a:
        return "Intermediate", "combo"
    if has_a:
        return "Advanced", "word"
    if has_i:
        return "Intermediate", "word"
    if has_b:
        return "Beginning", "word"
    n, _ = read_level(t)
    band = band_for(n)
    if band:
        return band, "numeric"
    return None, "no-signal"


def build(date):
    plan = json.load(open(os.path.join(ROOT, APPLY_PLAN), encoding="utf-8"))
    spot = json.load(open(os.path.join(ROOT, SPOTCHECK), encoding="utf-8"))
    catalog = {r["id"]: r for r in spot["rows"]}

    changes, unchanged, skipped = [], 0, []
    for f in plan["folds"]:
        bucket = f["bucket"]
        if bucket not in LEVEL_BUCKETS:
            # a PURPOSE carve-out is not a level bucket — never re-band it
            skipped.append({"id": f["id"], "bucket": bucket, "why": "purpose carve-out"})
            continue
        row = catalog.get(f["id"], {})
        title = row.get("identity_title", "")
        now = BUCKET_BAND[bucket]
        want, signal = classify(title)
        if want is None or want == now:
            unchanged += 1
            continue
        cat = (row.get("proposed_band")
               if row.get("category") in ("contradicts", "weak-contradicts")
               else (now if row.get("category") == "confirms" else None))
        n, how = read_level(GRADE_RANGE.sub(" ", title))
        changes.append({
            "id": f["id"], "title": title, "from": now, "to": want,
            "target": SURVIVOR[want], "signal": signal, "level": n, "read_by": how,
            "catalog_says": cat,
            "catalog_agrees": None if cat is None else (cat == want),
            "was_over_claim": bool(cat and ["Beginning", "Intermediate", "Advanced"].index(cat)
                                   < ["Beginning", "Intermediate", "Advanced"].index(now)),
        })

    agree = sum(1 for c in changes if c["catalog_agrees"] is True)
    disagree = sum(1 for c in changes if c["catalog_agrees"] is False)
    return {
        "_status": "DRY-RUN — read-only. No curation write performed.",
        "_date": date,
        "_ruling": ("Sam, 2026-08-24: 'For ESL with Levels indicated: 0-2 = Beginning; "
                    "3-5 = Intermediate; 6-10 = Advanced' (and 'Level 6 ESL can go in "
                    "Advanced'). Supersedes the P-4 pinning 1-2 / 3-4 / 5+."),
        "_ruling_by": "Sam Lee (map@rccd.edu)",
        "_bands": [{"from": lo, "to": hi, "band": b} for lo, hi, b in BANDS],
        "_guards": [
            "a level WORD outranks a number (ESOL M90WL 'Beginning Skills 9')",
            "a grade range is not a level (ESOL M90DB 'K-12')",
            "roman numerals stop at VII (ESOL M90WH 'Beginning Skills 2 X')",
        ],
        "_fold_cohort": FOLD_COHORT,
        "counts": {
            "folds_considered": len(plan["folds"]),
            "purpose_carve_outs_skipped": len(skipped),
            "unchanged": unchanged,
            "re_levels": len(changes),
            "catalog_agrees": agree,
            "catalog_disagrees": disagree,
            "catalog_silent": len(changes) - agree - disagree,
        },
        "by_move": dict(collections.Counter(f"{c['from']} -> {c['to']}" for c in changes)),
        "skipped_purpose_buckets": skipped[:20],
        "changes": sorted(changes, key=lambda c: (c["from"], c["to"], c["id"])),
    }


def report_md(p):
    c = p["counts"]
    L = [
        "# ESL re-level — dry-run against Sam's bands",
        "",
        f"_Generated {p['_date']} · **read-only, nothing written** · ruling by {p['_ruling_by']}_",
        "",
        "> " + p["_ruling"],
        "",
        f"**{c['re_levels']} of {c['folds_considered']} landed folds change band.** "
        f"{c['unchanged']} stay put; {c['purpose_carve_outs_skipped']} are purpose "
        "carve-outs (Enrichment/Civic/Vocational) and are never re-banded.",
        "",
        "| Move | Rows |",
        "|---|---:|",
    ]
    for k, v in sorted(p["by_move"].items()):
        L.append(f"| {k} | {v} |")
    L += [
        "",
        f"Against the colleges' own catalog descriptions, these changes **agree "
        f"{c['catalog_agrees']}** times and **disagree {c['catalog_disagrees']}** times "
        f"({c['catalog_silent']} have no catalog opinion).",
        "",
        "⚠️ That disagreement count is **blast radius, not a verdict** — it names the "
        "colleges that will see a course filed below their own wording. The catalogs "
        "disagree with each other; a statewide mapping exists to override that.",
        "",
        "## Guards in the reader",
        "",
    ]
    for g in p["_guards"]:
        L.append(f"- {g}")
    L += ["", "## Every change", "",
          "| Identity | Title | From | To | Rung | Catalog |", "|---|---|---|---|---:|---|"]
    for ch in p["changes"]:
        cat = ch["catalog_says"] or "—"
        mark = "" if ch["catalog_agrees"] is None else (" ✓" if ch["catalog_agrees"] else " ⚠")
        L.append(f"| `{ch['id']}` | {ch['title'][:52]} | {ch['from']} | **{ch['to']}** | "
                 f"{ch['level'] if ch['level'] is not None else '—'} | {cat}{mark} |")
    return "\n".join(L)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=datetime.date.today().isoformat())
    args = ap.parse_args()
    p = build(args.date)
    outdir = os.path.join(ROOT, "kb", "esl_relevel_out", args.date)
    os.makedirs(outdir, exist_ok=True)
    json.dump(p, open(os.path.join(outdir, "plan.json"), "w", encoding="utf-8"),
              indent=1, ensure_ascii=False)
    open(os.path.join(outdir, "report.md"), "w", encoding="utf-8").write(report_md(p))
    c = p["counts"]
    print(f"re-levels: {c['re_levels']}   unchanged: {c['unchanged']}   "
          f"carve-outs skipped: {c['purpose_carve_outs_skipped']}")
    for k, v in sorted(p["by_move"].items()):
        print(f"  {k}: {v}")
    print(f"catalog agrees {c['catalog_agrees']} / disagrees {c['catalog_disagrees']} "
          f"/ silent {c['catalog_silent']}")
    print(f"wrote {outdir}/plan.json + report.md")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Classify every noncredit program in the COCI export by what its record already
tells us, and write a receipt.

This is the measurement behind docs/noncredit_cip_category_scope.md, made
reproducible: the split moves as colleges work their programs, and a receipt that
regenerates is the only way to see that happen.

WHAT IT DOES NOT DO: decide a category. It reports which rung each program is on —
i.e. how much of the answer the record already carries — and that is deliberately
where it stops. The category is a curator judgment (Short-Term Vocational vs
Workforce Preparation is a statement about what a program DOES, and the CO's own
table gives both "any vocational code"), so proposing one from data would be the
blanket-32.0111 mistake again, one layer along.

THE RUNGS

  R1a  on a Noncredit CIP that names exactly ONE of the CO's categories
  R1b  on a Noncredit CIP that names TWO — 34.010x is Health and Safety AND
       Parenting, so the code can never resolve alone
  R2   on a Noncredit CIP the CO's page does not list at all
  R3   on a CREDIT CIP — under Short-Term Vocational that code is not an error,
       it is the SECONDARY credit CIP the category requires
  R4   no CIP at all
  R5   a retired/reserved/unknown code

MEMBERSHIP IS THE COCI `AWARD` FIELD, verbatim — the same fact the "Noncredit
program" chip renders. Not the TOP (which cannot decide a category even when
correct) and not the title (colleges write "ELDV …", "… NC: …", or no marker at
all, so three programs in one family can carry three naming conventions).

Run from repo root:  python3 kb/_classify_noncredit_programs.py [--date YYYY-MM-DD]
"""
import argparse
import collections
import csv
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
CATS = os.path.join(HERE, "noncredit_cip_categories.json")
CROSSWALK = os.path.join(REPO, "cip_crosswalk_data.js")
EXPORT = os.path.join(REPO, "tmc", "source_data", "coci_program_export_2026-06-17.csv")
NONCREDIT_AWARD = "Noncredit program"

RUNGS = [
    ("R1a", "Noncredit CIP names exactly one category"),
    ("R1b", "Noncredit CIP names two (34.010x is shared)"),
    ("R2", "Noncredit CIP the CO page does not list"),
    ("R3", "Credit CIP — the secondary code Short-Term Vocational needs"),
    ("R4", "No CIP at all"),
    ("R5", "Retired / reserved / unknown code"),
]


def load_catalog():
    src = open(CROSSWALK, encoding="utf-8").read()
    body = src[src.index("{"):src.rstrip().rstrip(";").rindex("}") + 1]
    d = json.loads(body)
    return {r["code"]: r for r in d["rows"]}


def code_of(v):
    return (v or "").strip().split(" ", 1)[0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default="2026-08-14", help="receipt directory (YYYY-MM-DD)")
    args = ap.parse_args()

    catalog = load_catalog()
    cats = json.load(open(CATS, encoding="utf-8"))

    # CIP -> the categories that list it. Built from the generated file so the two
    # can never drift; a code in two categories stays in two.
    by_code = collections.defaultdict(list)
    for cat in cats["categories"]:
        if cat.get("any_noncredit_cip"):
            continue   # populations, not content — never inferable from a code
        for entry in cat["cips"]:
            if entry.get("credit_expected"):
                continue
            for c in entry["codes"]:
                if cat["id"] not in by_code[c]:
                    by_code[c].append(cat["id"])

    rows = list(csv.DictReader(open(EXPORT, newline="", encoding="utf-8-sig", errors="replace")))
    nc = [r for r in rows if (r.get("AWARD") or "").strip() == NONCREDIT_AWARD]

    rung_of, per_rung, per_college = {}, collections.Counter(), collections.defaultdict(collections.Counter)
    r2_codes, r3_cat = collections.Counter(), collections.Counter()
    r3_corroborated = 0
    topcip = json.loads(open(CROSSWALK, encoding="utf-8").read()
                        [open(CROSSWALK, encoding="utf-8").read().index("{"):
                         open(CROSSWALK, encoding="utf-8").read().rstrip().rstrip(";").rindex("}") + 1]
                        )["topcip"]

    for r in nc:
        cip = code_of(r.get("CIP CODE"))
        top = code_of(r.get("TOP CODE")).rstrip("*")
        college = (r.get("COLLEGE") or "").strip()
        cat_row = catalog.get(cip)
        kind = cat_row.get("cat") if cat_row else None

        if not cip:
            rung = "R4"
        elif kind == "Noncredit":
            names = by_code.get(cip, [])
            if len(names) == 1:
                rung = "R1a"
            elif len(names) > 1:
                rung = "R1b"
            else:
                rung = "R2"; r2_codes[cip] += 1
        elif kind in ("CTE", "Non-CTE", "Both"):
            rung = "R3"; r3_cat[kind] += 1
            # Does the TOP corroborate the credit CIP the college already chose? This is
            # the number that makes a TOP-repair project unnecessary — neither signal is
            # trusted alone, but they agree almost everywhere.
            xw = [x[0] for x in (topcip.get(top, {}).get("c") or [])]
            if cip in xw:
                r3_corroborated += 1
        else:
            rung = "R5"

        rung_of[(college, code_of(r.get("CONTROL NUMBER")))] = rung
        per_rung[rung] += 1
        per_college[college][rung] += 1

    total = len(nc)
    outdir = os.path.join(HERE, "noncredit_cip_out", args.date)
    os.makedirs(outdir, exist_ok=True)

    lines = []
    a = lines.append
    a("# Noncredit programs by rung — %s\n" % args.date)
    a("Source: `%s`  \n" % os.path.relpath(EXPORT, REPO))
    a("Categories: `%s` (%s)\n" % (os.path.relpath(CATS, REPO), cats["_source"]))
    a("\n**%d noncredit programs across %d colleges.** Membership is the COCI `AWARD` "
      "field verbatim.\n" % (total, len(per_college)))
    a("\n> This reports how much of the answer each record already carries. It does **not** "
      "propose a category — that is a curator judgment the export cannot supply.\n")
    a("\n| Rung | What the record gives us | Programs | Share |")
    a("|---|---|---:|---:|")
    for key, desc in RUNGS:
        n = per_rung[key]
        a("| **%s** | %s | %s | %.1f%% |" % (key, desc, "{:,}".format(n), 100.0 * n / total))
    a("\n## R3 — the secondary credit CIP\n")
    a("Under Short-Term Vocational the credit CIP these programs already hold is not an "
      "error; it is the secondary code the category requires.\n")
    a("\n- **%s of %s (%.1f%%)** sit inside their own TOP's crosswalk — TOP and the college's "
      "own assignment corroborate each other, so neither has to be trusted alone.\n"
      % ("{:,}".format(r3_corroborated), "{:,}".format(per_rung['R3']),
         100.0 * r3_corroborated / max(1, per_rung["R3"])))
    a("- Certified category of that secondary code: " +
      " · ".join("**%s** %s" % (k, "{:,}".format(v)) for k, v in r3_cat.most_common()) + "\n")
    a("\n⚠️ A CTE secondary CIP does **not** prove a program is Short-Term Vocational — some "
      "of these are ESL or Basic Skills programs mis-coded onto a credit CIP. Category is "
      "confirmed first; CTE follows. CTE noncredit qualifies for funding that non-CTE does not.\n")
    if r2_codes:
        a("\n## R2 — noncredit codes in use that the CO page does not list\n")
        a("\n| CIP | Title | Programs |")
        a("|---|---|---:|")
        for c, n in r2_codes.most_common():
            a("| `%s` | %s | %d |" % (c, catalog.get(c, {}).get("t", "?"), n))
        a("\nOutstanding with the CO as of 2026-08-14 — fold into a category, or must these move?\n")
    a("\n## By college\n")
    a("\n| College | " + " | ".join(k for k, _ in RUNGS) + " | Total |")
    a("|---" * (len(RUNGS) + 2) + "|")
    for college, ctr in sorted(per_college.items(), key=lambda kv: -sum(kv[1].values())):
        a("| %s | %s | %d |" % (college, " | ".join(str(ctr[k]) for k, _ in RUNGS), sum(ctr.values())))

    with open(os.path.join(outdir, "receipt.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    summary = {
        "_built_by": "kb/_classify_noncredit_programs.py",
        "_date": args.date, "_source": os.path.relpath(EXPORT, REPO),
        "total": total, "colleges": len(per_college),
        "rungs": {k: per_rung[k] for k, _ in RUNGS},
        "r3_top_corroborated": r3_corroborated,
        "r3_secondary_cip_category": dict(r3_cat),
        "r2_codes": dict(r2_codes),
    }
    with open(os.path.join(outdir, "summary.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
        f.write("\n")

    for key, desc in RUNGS:
        print("  %-4s %-52s %5d (%.1f%%)" % (key, desc, per_rung[key], 100.0 * per_rung[key] / total))
    print("\n  R3 corroborated by its own TOP's crosswalk: %d of %d" % (r3_corroborated, per_rung["R3"]))
    print("  wrote %s" % os.path.relpath(outdir, REPO))


if __name__ == "__main__":
    main()

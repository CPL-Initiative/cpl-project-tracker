#!/usr/bin/env python3
"""The COCI program export's two unread signals — and the claims made about them.

⭐ WHY. `chatbox/build_coci_offerings.py` read TITLE, AWARD and TOP CODE from the
program export and dropped `CIP CODE` on the floor, while `split_top` left the
Taxonomy manual's CTE asterisk on the front of every marked title. Both shipped
into `coci_college_programs`, where nothing read them, so neither was visible:
14,740 of 22,335 live rows carried a `top_title` beginning "* ".

⚠️ WHAT THIS GUARDS, in two tiers, because they fail for different reasons.

STRUCTURAL — must hold on ANY export, now or in five years. These are the claims
`chatbox/supabase_search_college_programs.sql` rests its design on. If the
title-only or the code-only set ever empties, "match both surfaces, gate on
neither" has stopped being a measurement and become a habit.

PINNED — the exact figures quoted in that file's header and in the cpl_memory
row `cip-load-do-not-gate`, asserted only against the export they were measured
on. A refreshed export SKIPS these with a message naming what to re-measure,
rather than turning CI red for a data refresh nobody broke.

Imports the builder's OWN split_top / split_cip. A copy of a parser in a test
guards the copy (`alias_chain_single_source_test.py` is this repo's standing
lesson on that).

Pure stdlib, no network. Run from repo root: python3 tests/coci_program_cip_test.py
"""
import csv
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "chatbox"))
from build_coci_offerings import split_cip, split_top  # noqa: E402

# The status set build_programs() keeps — what a college currently offers.
ACTIVE = ("Active", "Approved", "Active - Teachout Only")
PINNED_EXPORT = "coci_program_export_2026-06-17.csv"

results = []


def check(name, cond, why=""):
    results.append((name, bool(cond), why))


def main():
    paths = sorted(glob.glob(os.path.join(ROOT, "tmc", "source_data", "coci_program_export_*.csv")))
    if not paths:
        check("an export is present", False, "no tmc/source_data/coci_program_export_*.csv")
        return report()
    path = paths[-1]
    name = os.path.basename(path)
    rows = list(csv.DictReader(open(path, encoding="utf-8-sig", newline="")))
    act = [r for r in rows if (r.get("STATUS") or "").strip() in ACTIVE]
    check("(0) the export parses and has active rows", len(act) > 0)

    # ── STRUCTURAL ───────────────────────────────────────────────────────────
    top_blank = sum(1 for r in act if not (r.get("TOP CODE") or "").strip())
    cip_blank = sum(1 for r in act if not (r.get("CIP CODE") or "").strip())
    check("(1) TOP is never blank — which is why it stays the coverage floor",
          top_blank == 0, f"{top_blank} active rows have no TOP CODE")
    check("(1) ⚠ CIP IS blank on some rows — the reason CIP is loaded, never gated",
          cip_blank > 0,
          "if CIP ever reaches full coverage that is NEWS: re-read Rule 7's "
          "corroborate-do-not-gate posture before changing anything, and do not "
          "let a test failure be the argument")

    # The parsers, against the real corpus rather than a hand-picked string.
    star_titles = [split_top(r.get("TOP CODE"))[1] for r in act
                   if "*" in (r.get("TOP CODE") or "")]
    check("(2) ⚠ split_top strips the CTE asterisk from every marked title",
          star_titles and not any(t.startswith("*") for t in star_titles),
          "the marker is not part of the name; it reached 14,740 live rows and "
          "was invisible until something searched and displayed top_title")
    check("(2) …and still returns a title for those rows",
          all(t for t in star_titles))
    codes = {split_top(r.get("TOP CODE"))[0] for r in act}
    check("(2) every active TOP code parses to ####.##",
          codes and all(re.fullmatch(r"\d{4}\.\d{2}", c) for c in codes))

    cip_pairs = [split_cip(r.get("CIP CODE")) for r in act if (r.get("CIP CODE") or "").strip()]
    check("(3) every nonblank CIP parses to ##.####",
          cip_pairs and all(re.fullmatch(r"\d{2}\.\d{4}", c) for c, _ in cip_pairs))
    check("(3) split_cip drops the source's trailing period",
          not any(t.endswith(".") for _, t in cip_pairs),
          "'Accounting.' is the export's punctuation, not the discipline's name")
    check("(3) a blank CIP parses to empty, never to a guess",
          split_cip("") == ("", "") and split_cip(None) == ("", ""))

    # ── THE DESIGN CLAIM: neither surface alone decides ──────────────────────
    def norm(s):
        return re.sub(r"\s+", " ", (s or "").strip()).lower()

    title_hit, code_hit = set(), set()
    for r in act:
        college = (r.get("COLLEGE") or "").strip()
        if re.search(r"\blvn\b|vocational nurs", norm(r.get("TITLE"))):
            title_hit.add(college)
        if re.search(r"vocational nurs|practical nurs",
                     norm(r.get("TOP CODE")) + " " + norm(r.get("CIP CODE"))):
            code_hit.add(college)
    title_only = title_hit - code_hit
    code_only = code_hit - title_hit

    check("(4) ⚠ the LVN question finds colleges NO code finds",
          len(title_only) > 0,
          "these are the LVN-to-RN bridges, coded Registered Nursing in both "
          "taxonomies — a code-gated search loses them")
    check("(4) ⚠ …and colleges NO title finds",
          len(code_only) > 0,
          "a title-only search loses programs whose name states a specialty and "
          "whose code names the field")
    check("(4) so the union exceeds either surface alone",
          len(title_hit | code_hit) > max(len(title_hit), len(code_hit)))

    # ── PINNED to the measured export ────────────────────────────────────────
    if name != PINNED_EXPORT:
        print(f"  note  export is {name}, not the pinned {PINNED_EXPORT} — "
              "skipping the exact figures.")
        print("        RE-MEASURE and update: the header of "
              "chatbox/supabase_search_college_programs.sql, the PROGRAMS_RULE "
              "'one in eight' phrasing in cpl-chat/index.ts, and the cpl_memory "
              "row cip-load-do-not-gate.")
        return report()

    check("(5) 22,335 active rows", len(act) == 22335, f"got {len(act)}")
    check("(5) 2,986 of them have no CIP (13.4%)", cip_blank == 2986, f"got {cip_blank}")
    check("(5) 53 colleges by program title", len(title_hit) == 53, f"got {len(title_hit)}")
    check("(5) 44 colleges by either code", len(code_hit) == 44, f"got {len(code_hit)}")
    check("(5) 56 colleges in union", len(title_hit | code_hit) == 56,
          f"got {len(title_hit | code_hit)}")
    check("(5) 12 title-only", len(title_only) == 12, f"got {len(title_only)}")
    check("(5) 3 code-only", len(code_only) == 3, f"got {len(code_only)}")
    # The 14.1% in cpl_memory is the "Active"-only denominator; both readings are
    # real and the SQL header says so. Pinned here so neither drifts unnoticed.
    strict = [r for r in rows if (r.get("STATUS") or "").strip() == "Active"]
    strict_blank = sum(1 for r in strict if not (r.get("CIP CODE") or "").strip())
    check("(5) 14.1% CIP-blank on the 'Active'-only denominator",
          round(100.0 * strict_blank / len(strict), 1) == 14.1,
          f"got {round(100.0 * strict_blank / len(strict), 1)}% of {len(strict)}")
    return report()


def report():
    failed = [r for r in results if not r[1]]
    for nm, ok, why in results:
        print(("  ok   " if ok else "  FAIL ") + nm + ("" if ok or not why else "\n        " + why))
    print(f"\ncoci_program_cip_test.py: {len(results) - len(failed)}/{len(results)} checks passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())

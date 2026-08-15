#!/usr/bin/env python3
"""Build kb/noncredit_cip_categories.json — the CCCCO's ten noncredit categories
and the CIP codes each one may use.

SOURCE OF TRUTH is the CCCCO "TOP to CIP Noncredit Mapping" page, updated
2026-05-26, confirmed by Jenni Abbott 2026-08-14. NOT a relay of it.

  ⚠ WHY THAT DISTINCTION IS LOAD-BEARING. A Teams summary of the Basic Skills row
  merged 32.0101 + 32.0104 onto one line, which shifted every label/code pair
  after it — Developmental/Remedial Math would have been built as 32.0105, which
  is Job-Seeking/Changing Skills. Nothing about that is visible by inspection: the
  codes are all real, all in the right family, all plausible beside their labels.
  It was caught only by checking ALL SEVEN pairs against the certified catalog,
  which is why validate() below runs on every rebuild instead of once. Same
  failure shape as the MIS LocationID column (see
  docs/kb-notes/methodology-validate-a-code-column-by-its-structural-invariant.md).

Three structural facts the consumer must respect, all encoded here rather than
left to the reader:

  1. CDCP IS PER-CODE, NOT PER-CATEGORY. Elementary & Secondary Basic Skills is a
     CDCP category, but 32.0201 carries "SUPERVISED TUTORING may use this CIP;
     however, it is not CDCP eligible". A category-level flag would tell a college
     the opposite of the truth about one of its own codes, and CDCP is
     funding-bearing.
  2. 34.010x NAMES TWO CATEGORIES. Health and Safety and Parenting share all four
     codes, so a code in that range can never resolve to a single category.
  3. TWO CATEGORIES ARE POPULATIONS, NOT CONTENT. The page says so explicitly of
     Substantial Disabilities and Courses for Older Adults: "CIP codes focus
     primarily on content, not populations". They can carry any noncredit CIP, so
     they are never inferable from a code and must come from a curator.

TOP ranges are recorded for DISPLAY AND CORROBORATION ONLY, never to decide a
category. Measured against the 3,187 noncredit programs in the COCI export, the
page's own ranges claim exactly one category for just 28.8% of them: Short-Term
Vocational and Workforce Preparation are both "any vocational code", Parenting
(1305.00-1399.00) and Home Economics (1301.00-1399.00) almost entirely overlap,
and Basic Skills (4930.09-4930.60) overlaps Workforce Prep (4930.10-4930.72).
`determinative: false` says that in the data so no consumer has to rediscover it.

Run from repo root:  python3 kb/_build_noncredit_cip_categories.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
CROSSWALK = os.path.join(REPO, "cip_crosswalk_data.js")
OUT = os.path.join(HERE, "noncredit_cip_categories.json")

SOURCE = ("CCCCO 'TOP to CIP Noncredit Mapping', updated 2026-05-26; "
          "Basic Skills pairing confirmed by Jenni Abbott (CO consultant), 2026-08-14")

# ── The page, transcribed ────────────────────────────────────────────────────
# `cips` entries: {code|prefix|range} + the page's own label. `cdcp` on a code
# OVERRIDES the category's flag; `note` is rendered to the curator verbatim.
CATEGORIES = [
    {
        "id": "esl", "label": "English as a Second Language", "cdcp": True,
        "top_ranges": [["4930.84", "4931.00"]],
        "cips": [
            {"code": "32.0109", "label": "Second Language Learning"},
            {"code": "32.0112", "label": "Accent Reduction/Modification",
             "note": "Rarely used (Jenni, 2026-08-14)."},
        ],
    },
    {
        "id": "short_term_vocational", "label": "Short-Term Vocational", "cdcp": True,
        "top_ranges": [["*", "any vocational code"]],
        "secondary_credit_cip": True,
        "cips": [
            {"code": "32.0111", "label": "Workforce Development and Training",
             "note": "These will include specific training & skills that prepare students for a job."},
        ],
        # Jenni, 2026-08-14, ahead of publication: this category takes 32.0111 PLUS a
        # secondary CREDIT CIP aligning with the program subject matter, and "if the
        # secondary CIP code is a CTE course AND the CIP is 32.0111 … the NC CIP is CTE."
        # Neither sentence is on the page yet, so the consumer must label it as CO
        # guidance rather than something a college can point to.
        "unpublished_guidance": (
            "Takes 32.0111 plus a secondary CREDIT CIP aligning with the program subject "
            "matter. Where that secondary CIP is a CTE course, the noncredit program is CTE. "
            "CO guidance ahead of publication (Jenni, 2026-08-14) — not yet on the page."
        ),
    },
    {
        "id": "workforce_preparation", "label": "Workforce Preparation", "cdcp": True,
        "top_ranges": [["*", "any vocational code"], ["4930.10", "4930.72"]],
        "cips": [
            {"code": "32.0107", "label": "Career Exploration/Awareness",
             "note": "These will be preparatory or exploratory courses — not primary job skills."},
        ],
    },
    {
        "id": "basic_skills",
        "label": "Elementary & Secondary Basic Skills",
        "sublabel": "supplemental instruction, supervised tutoring",
        "cdcp": True,
        "top_ranges": [["1501.00", "1702.00"], ["4930.09", "4930.60"]],
        "cips": [
            {"prefix": "53.", "label": "High School Diploma/Equivalency"},
            {"code": "32.0101", "label": "Basic Skills & Developmental/Remed Ed./Study Skills"},
            {"code": "32.0104", "label": "Developmental/Remedial Math"},
            {"code": "32.0105", "label": "Job-Seeking/Changing Skills"},
            {"code": "32.0108", "label": "Developmental/Remedial English"},
            {"code": "32.0110", "label": "Basic Computer Skills"},
            # The exception that makes CDCP per-code. Verbatim from the page.
            {"code": "32.0201", "label": "Exam Prep & Test-Taking Skills", "cdcp": False,
             "note": "SUPERVISED TUTORING may use this CIP; however, it is not CDCP eligible."},
        ],
    },
    {
        "id": "immigrant_education", "label": "Immigrant Education", "cdcp": False,
        "top_ranges": [["2201.20", "2207.00"], ["4930.90", "4930.90"]],
        "cips": [
            {"range": ["33.0101", "33.0199"], "label": "Citizenship Activities",
             "note": "Citizenship education, community awareness, community involvement, "
                     "personal emergency preparedness."},
        ],
    },
    {
        "id": "health_and_safety", "label": "Health and Safety", "cdcp": False,
        "top_ranges": [["0835.10", "0899.00"], ["1299.00", "1299.00"]],
        "shares_codes_with": "parenting",
        # The page gives this row ONE label — "Health-Related Knowledge & Skills" — followed by a
        # parenthetical naming four sub-topics, then four codes. The sub-topics ARE in code order;
        # the row label is not one of them. Transcribing the row label as 34.0102's own label (and
        # sliding the rest) is precisely the shift this file exists to prevent, and the first cut of
        # this script did exactly that until validate()'s title column showed 34.0102 reading
        # "Health-Related Knowledge & Skills" against a catalog title of "Birthing and Parenting".
        "cips": [
            {"code": "34.0102", "label": "Birthing & Parenting"},
            {"code": "34.0103", "label": "Personal Health Improvement"},
            {"code": "34.0104", "label": "Addiction Prevention"},
            {"code": "34.0105", "label": "Meditation"},
        ],
    },
    {
        "id": "substantial_disabilities", "label": "Substantial Disabilities", "cdcp": False,
        "top_ranges": [["*", "any TOP code"]],
        "population_not_content": True,
        "any_noncredit_cip": True,
        "cips": [
            # The page's one deliberate CREDIT reference; credit_expected stops validate()
            # from failing it for not being cat == "Noncredit".
            {"prefix": "13.10", "label": "Special Education (credit CIP codes may be applicable)",
             "credit_expected": True},
        ],
        "note": "CIP codes focus primarily on content, not populations.",
    },
    {
        "id": "parenting", "label": "Parenting", "cdcp": False,
        "top_ranges": [["1305.00", "1399.00"]],
        "shares_codes_with": "health_and_safety",
        "cips": [
            {"code": "34.0102", "label": "Birthing & Parenting Knowledge & Skills"},
            {"code": "34.0103", "label": "Personal Health Improve & Maintenance"},
            {"code": "34.0104", "label": "Addiction Prevention & Treatment"},
            {"code": "34.0105", "label": "Meditation/Mind-Body Wellness"},
        ],
    },
    {
        "id": "home_economics", "label": "Home Economics", "cdcp": False,
        "top_ranges": [["1301.00", "1399.00"]],
        "cips": [
            # "36.01xx (Others)" on the page. The family is MIXED: 36.0119 Aircraft Pilot
            # (Private) is a CTE code sitting inside an otherwise-Noncredit range, so a
            # blanket prefix would offer a credit code under a noncredit category.
            {"prefix": "36.01", "label": "Leisure & Recreational Activities",
             "exclude": ["36.0119"],
             "note": "36.0119 Aircraft Pilot (Private) is excluded — it is a CTE code inside "
                     "an otherwise-noncredit family."},
            {"code": "36.0105", "label": "Home Maintenance & Improvement"},
            {"code": "36.0112", "label": "Cooking & Other Domestic Skills"},
            {"code": "36.0123", "label": "Master Gardener/Gardening"},
        ],
    },
    {
        "id": "older_adults", "label": "Courses for Older Adults", "cdcp": False,
        "top_ranges": [["*", "any TOP code"]],
        "population_not_content": True,
        "any_noncredit_cip": True,
        "cips": [],
        "note": "CIP codes focus primarily on content, not populations.",
    },
]

# Noncredit CIP codes colleges actually use that the page does not list. Recorded so
# the gap is visible rather than silently absorbed into a neighbouring category —
# question outstanding with Jenni as of 2026-08-14.
OFF_LIST = [
    {"code": "32.0199", "programs": 60,
     "question": "Basic Skills and Developmental/Remedial Education, Other — fold into Basic Skills, or must these move?"},
    {"code": "35.0101", "programs": 16,
     "question": "Interpersonal and Social Skills, General — which category, if any?"},
]


def load_catalog():
    src = open(CROSSWALK, encoding="utf-8").read()
    body = src[src.index("{"):src.rstrip().rstrip(";").rindex("}") + 1]
    d = json.loads(body)
    return {r["code"]: r for r in d["rows"]}, d.get("_source", "")


def expand(entry, catalog):
    """Resolve a cips[] entry to the concrete codes it names."""
    ex = set(entry.get("exclude") or [])
    if "code" in entry:
        return [entry["code"]] if entry["code"] not in ex else []
    if "prefix" in entry:
        return sorted(c for c in catalog if c.startswith(entry["prefix"]) and c not in ex)
    if "range" in entry:
        lo, hi = entry["range"]
        return sorted(c for c in catalog if lo <= c <= hi and c not in ex)
    return []


def validate(catalog):
    """Every code the page names must EXIST and be Noncredit, unless the page
    deliberately points at a credit family (Substantial Disabilities -> 13.10).

    This is the guard that catches a shifted label/code pairing. It cannot check
    that a LABEL is right — only a human reading the page can — so it also emits
    the catalog's own title beside each code, which is what makes a shift visible
    to the next reader instead of only to the one who went looking.
    """
    errors, warnings, table = [], [], []
    for cat in CATEGORIES:
        for entry in cat["cips"]:
            codes = expand(entry, catalog)
            if not codes:
                errors.append("%s: '%s' resolves to no CIP code at all" % (cat["id"], entry.get("label")))
                continue
            for code in codes:
                row = catalog.get(code)
                if not row:
                    errors.append("%s: %s is not in the CIP catalog" % (cat["id"], code))
                    continue
                is_nc = row.get("cat") == "Noncredit"
                if entry.get("credit_expected"):
                    if is_nc:
                        warnings.append("%s: %s was expected to be a CREDIT code but is Noncredit"
                                        % (cat["id"], code))
                elif not is_nc:
                    errors.append("%s: %s is '%s', not Noncredit (page lists it under a noncredit category)"
                                  % (cat["id"], code, row.get("cat")))
            if "code" in entry:
                row = catalog.get(entry["code"], {})
                table.append((cat["id"], entry["code"], entry.get("label", ""), row.get("t", "")))
        warnings.extend(shift_check(cat, catalog))
    return errors, warnings, table


def _toks(s):
    keep = {"basic", "skills", "knowledge", "and", "of", "the", "general", "other"}
    return {w for w in "".join(ch.lower() if ch.isalnum() else " " for ch in (s or "")).split()
            if len(w) > 2 and w not in keep}


def shift_check(cat, catalog):
    """Flag a label paired with a code whose catalog title it shares NO content word with.

    This is the mechanical version of reading the title column, and it exists because
    reading it only works if someone does. It catches both shapes seen so far:

      - A CLEAN SHIFT (the relayed Basic Skills table): "Developmental/Remedial Math"
        against 32.0105, whose title is "Job-Seeking/Changing Skills" — no shared word.
      - A PARTIAL MISPAIRING (this script's own first cut): the Health and Safety row
        label "Health-Related Knowledge & Skills" landed on 34.0102 "Birthing and
        Parenting Knowledge and Skills", while the two codes between it were correct.
        A rotation-based check was written first and MISSED this, because nothing was
        rotated — only the ends were wrong. Per-pair catches it; rotation did not.

    Deliberately a WARNING. Page labels are legitimately abbreviated ("Career
    Exploration/Awareness" for "…Awareness Skills"), so a miss is a prompt to look,
    not proof of a defect. Structural words are dropped from both sides first, or
    "Knowledge"/"Skills" alone would make a wrong pair look right — which is exactly
    how the Health and Safety mispairing read as plausible.
    """
    out = []
    for e in cat["cips"]:
        code = e.get("code")
        if not code or code not in catalog:
            continue
        lbl, title = e.get("label", ""), catalog[code]["t"]
        a, b = _toks(lbl), _toks(title)
        if a and b and not (a & b):
            # Does this label fit a DIFFERENT code in the same category? That names the fix.
            better = [c2["code"] for c2 in cat["cips"]
                      if c2.get("code") in catalog and c2.get("code") != code
                      and (_toks(lbl) & _toks(catalog[c2["code"]]["t"]))]
            out.append("%s: label %r is paired with %s (%r) but shares no content word with it%s"
                       % (cat["id"], lbl, code, title,
                          " — it fits %s instead" % ", ".join(better) if better else ""))
    return out


def main():
    catalog, cw_source = load_catalog()
    errors, warnings, table = validate(catalog)

    print("Label -> code pairs, beside the catalog's own title (read these):")
    for cid, code, page_label, cat_title in table:
        print("  %-22s %-9s %-46s | %s" % (cid, code, page_label[:44], cat_title[:52]))
    print()
    for w in warnings:
        print("WARN  " + w)
    if errors:
        for e in errors:
            print("ERROR " + e)
        sys.exit("\n%d validation error(s) — refusing to write %s" % (len(errors), OUT))

    out = []
    for cat in CATEGORIES:
        cips = []
        for entry in cat["cips"]:
            codes = expand(entry, catalog)
            cips.append({
                "label": entry.get("label"),
                "codes": codes,
                # Per-code CDCP: the entry's own flag wins over the category's.
                "cdcp": entry.get("cdcp", cat["cdcp"]),
                "note": entry.get("note"),
                "credit_expected": entry.get("credit_expected", False),
                "titles": {c: catalog[c]["t"] for c in codes if c in catalog},
            })
        out.append({
            "id": cat["id"], "label": cat["label"], "sublabel": cat.get("sublabel"),
            "cdcp": cat["cdcp"],
            "population_not_content": cat.get("population_not_content", False),
            "any_noncredit_cip": cat.get("any_noncredit_cip", False),
            "shares_codes_with": cat.get("shares_codes_with"),
            "secondary_credit_cip": cat.get("secondary_credit_cip", False),
            "unpublished_guidance": cat.get("unpublished_guidance"),
            "note": cat.get("note"),
            # Display + corroboration ONLY. See the module docstring for the measurement.
            "top_ranges": cat["top_ranges"], "top_determinative": False,
            "cips": cips,
        })

    payload = {
        "_built_by": "kb/_build_noncredit_cip_categories.py",
        "_source": SOURCE,
        "_crosswalk_source": cw_source,
        "_note": ("The CO page calls these codes EXAMPLES: 'can be used by colleges to identify "
                  "the most appropriate CIP code that aligns with an existing TOP code.' The "
                  "college is the decider; this file is what the picker offers, never what it "
                  "concludes."),
        "_invariants": [
            "cdcp is PER-CODE — a category flag can be overridden by a code (32.0201).",
            "34.010x belongs to Health and Safety AND Parenting; never auto-pick between them.",
            "population_not_content categories are never inferable from a code.",
            "top_determinative is false everywhere: the page's TOP ranges claim exactly one "
            "category for only 28.8% of noncredit programs.",
        ],
        "categories": out,
        "off_list_codes_in_use": OFF_LIST,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
        f.write("\n")

    ncat = len(out)
    ncodes = len({c for cat in out for e in cat["cips"] for c in e["codes"]})
    print("categories: %d | distinct CIP codes: %d | off-list codes in use: %d"
          % (ncat, ncodes, len(OFF_LIST)))
    print("wrote %s" % OUT)


if __name__ == "__main__":
    main()

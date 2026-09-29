#!/usr/bin/env python3
"""Derive the CLEAN text of 5 CCR 55050 / 55051 as adopted by the Board of
Governors on 2026-08-12, from the final-revisions redline PDF.

Why this script exists
----------------------
The BOG-adopted document is a REDLINE: struck text and inserted text sit side
by side, and `pdftotext` drops the formatting, so the two run together as plain
characters (`at leastminimum`, `standardized examsexaminations`, `(ab)`).
Sam, 2026-08-26: *"disregard all the strikethrough language as that will be
pulled off when the reg is published on the web."*

That resolution is a JUDGMENT, so it is written here as an explicit, reviewable
edit list applied to the extracted source — not retyped prose. Anyone can check
a single row against the PDF.

Output: docs/reference/statute/t5_55050_clean_after_2026-08-12.txt
"""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / "docs/reference/statute/t5_55050_55051_final_reg_text_2026-08-12.txt"
OUT = ROOT / "docs/reference/statute/t5_55050_clean_after_2026-08-12.txt"

# Lines that are page furniture, not regulation text.
FURNITURE = re.compile(
    r"^(A11Y \d|XXX$|Final Revisions to Title 5|Related to Credit for Prior Learning|Articulation$)"
)

# ── 1. inline redline resolutions ────────────────────────────────────────────
# Each row: (raw substring in the extraction, clean replacement, why).
# "struck" = the half with a line through it in the PDF; it goes away.
INLINE = [
    ("(ab) The governing board", "(b) The governing board",
     "subdivision letter re-lettered a -> b"),
    ("published at leastminimum in college catalogs", "published at minimum in college catalogs",
     "'least' struck, 'minimum' inserted"),
    ("industry-recognized credential documentation certifications and documented trainings",
     "industry-recognized certifications and documented trainings",
     "'credential documentation' struck"),
    ("standardized examsexaminations", "standardized examinations",
     "'exams' struck, 'examinations' inserted"),
    ("(bf) The governing board may grant credit", "(f) The governing board may grant credit",
     "subdivision letter re-lettered b -> f"),
    ("mastery of the course contentoutcomes as set", "mastery of the course outcomes as set",
     "'content' struck, 'outcomes' inserted -- in (f) ONLY; (h) keeps 'course content'"),
    ("(ch) The nature and content", "(h) The nature and content",
     "subdivision letter re-lettered c -> h"),
    ("(ei) Credit by Examination", "(i) Credit by Examination",
     "subdivision letter re-lettered e -> i"),
    ("(gj) Grading shall be", "(j) Grading shall be",
     "subdivision letter re-lettered g -> j"),
    ("(ik) A district may charge", "(k) A district may charge",
     "subdivision letter re-lettered i -> k"),
    ("(lm) The governing board", "(m) The governing board",
     "subdivision letter re-lettered l -> m"),
    ("credit for prior learning policy policies every three years",
     "credit for prior learning policies every three years",
     "'policy' struck, 'policies' inserted"),
    ("Reference: Sections 70901, and 70902, and 88782, Education Code.",
     "Reference: Sections 70901, 70902, and 88782, Education Code.",
     "'and' before 70902 struck; ', and 88782' inserted -- 88782 IS the adopted citation"),
    # -- 55051 --
    ("High School Course Articulation Agreements of High School Courses.",
     "Articulation Agreements of High School Courses.",
     "'High School Course' struck from the section heading"),
    ("the term “articulated high school course articulation agreement” means",
     "the term “high school course articulation agreement” means",
     "'articulated' struck; 'high school course articulation agreement' is the adopted term"),
    ("a formal agreement that a high school course or courses that the faculty in the appropriate discipline, using course outlines of record policies and procedures approved",
     "a formal agreement that a high school course or courses that the faculty in the appropriate discipline, using policies and procedures approved",
     "'course outlines of record' struck, 'policies and procedures' inserted"),
    ("may adopt policies to permit articulated high school courses with articulation agreements to be applied",
     "may adopt policies to permit high school courses with articulation agreements to be applied",
     "'articulated' struck"),
    ("Articulated These high school courses with articulation agreements high school courses may be accepted",
     "These high school courses with articulation agreements may be accepted",
     "'Articulated' struck; trailing 'high school courses' struck"),
    ("(c) Articulated A high school courses accepted for credit through a high school course articulation agreement used to partially satisfy",
     "(c) A high school course accepted for credit through a high school course articulation agreement used to partially satisfy",
     "'Articulated' and plural forms struck"),
    ("as defined in section 5575355050(i)", "as defined in section 55050(i)",
     "'55753' struck, '55050(i)' inserted -- this is why 55050 must not be re-lettered"),
    ("The requirement of section 5506355061", "The requirement of section 55061",
     "'55063' struck, '55061' inserted"),
]

# ── 2. whole paragraphs struck in the redline ────────────────────────────────
# Identified by (leading marker, a phrase unique to that paragraph).
DELETE_PARAS = [
    ("(d)", "California Intersegmental General Education Transfer Curriculum",
     "old (d) replaced by the new Cal-GETC (c)"),
    ("(f)", "credit was earned by assessment of prior learning",
     "old (f) moved and reworded as the new (l)"),
    ("(h)", "shall not be counted in determining the 12 semester hours",
     "old (h) replaced by the new (d), which says units MAY be counted"),
    ("(j)", "if the student is a veteran or an active-duty member",
     "old (j) replaced by the new (e)"),
    ("(k)", "in cases of credit by exam, pursuant to sections 55021",
     "old (k) replaced by the new (g), which says 'credit by examination'"),
    ("(m)", "incorporate policies pursuant to section 55052 on College Board Advanced Placement",
     "old (m) struck"),
    ("(n)", "By December 31, 2020, the district shall certify",
     "old (n) struck -- the deadline has passed"),
]


def paragraphs(text):
    """Split the extraction into paragraphs, dropping page furniture."""
    lines = [l for l in text.splitlines() if not FURNITURE.match(l.strip())]
    out, cur = [], []
    starter = re.compile(r"^(\([a-z]{1,2}\)|\(\d\)|NOTE:|§|SECTION \d+)")
    for l in lines:
        if not l.strip():
            continue
        if starter.match(l.strip()) and cur:
            out.append(" ".join(cur)); cur = [l.strip()]
        else:
            cur.append(l.strip())
    if cur:
        out.append(" ".join(cur))
    return [re.sub(r"\s+", " ", p).strip() for p in out]


def main():
    raw = SRC.read_text(encoding="utf-8")
    paras = paragraphs(raw)

    # drop struck paragraphs
    kept, dropped = [], []
    for p in paras:
        hit = None
        for marker, phrase, why in DELETE_PARAS:
            if p.startswith(marker) and phrase in p:
                hit = (marker, why); break
        if hit:
            dropped.append(hit)
        else:
            kept.append(p)
    if len(dropped) != len(DELETE_PARAS):
        got = {m for m, _ in dropped}
        missing = [(m, w) for m, _, w in DELETE_PARAS if m not in got]
        sys.exit(f"FAIL: struck paragraph(s) not found in the source: {missing}")

    body = "\n\n".join(kept)

    # apply inline resolutions
    for raw_s, clean_s, why in INLINE:
        if raw_s not in body:
            sys.exit(f"FAIL: inline edit did not match the source -> {why}\n  looked for: {raw_s!r}")
        body = body.replace(raw_s, clean_s, 1)

    # nothing may survive that still looks like a run-together redline
    leftovers = re.findall(r"\((?:[a-z]{2})\)", body)
    if leftovers:
        sys.exit(f"FAIL: unresolved run-together subdivision markers: {leftovers}")

    header = (
        "5 CCR 55050 and 55051 - CLEAN TEXT AS ADOPTED 2026-08-12\n"
        "========================================================\n\n"
        "Derived by kb/_derive_55050_clean.py from the Board of Governors final-revisions\n"
        "redline (docs/reference/statute/t5_55050_55051_final_reg_text_2026-08-12.txt).\n"
        "Strikethrough text is removed and inserted text kept -- i.e. this is how the\n"
        "section will read once the regulation is published on the web.\n"
        "Sam Lee, 2026-08-26: \"disregard all the strikethrough language as that will be\n"
        "pulled off when the reg is published on the web.\"\n\n"
        "This file is the BASELINE any further amendment is drafted against. It is\n"
        "generated, not typed: re-run the script to reproduce it.\n\n"
        + "-" * 76 + "\n\n"
    )
    OUT.write_text(header + body + "\n", encoding="utf-8")
    subs = re.findall(r"^\(([a-z])\)", body, flags=re.M)
    print(f"OK  wrote {OUT.relative_to(ROOT)}")
    print(f"    {len(paras)} source paragraphs -> {len(kept)} kept, {len(dropped)} struck")
    print(f"    {len(INLINE)} inline redline resolutions applied")
    print(f"    55050 subdivisions after adoption: {' '.join('(%s)' % s for s in subs[:13])}")


if __name__ == "__main__":
    main()

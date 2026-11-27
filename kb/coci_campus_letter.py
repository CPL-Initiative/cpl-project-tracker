"""Fold a campus letter COCI glued onto a subject code back onto the course number (S744).

Cerro Coso numbers every course with a C after the subject (its schedule prints PHED C103, EMTC C070), and
Porterville with a P (BIOL P118). COCI stores most of those courses that way and some with the letter glued to the
subject instead: `PHEDC 103`, `EMTCC 070`, `BIOLP 118`. The glued codes are not subjects; they read as untitled local
subject codes on the Subjects card and split one course into two keys.

The lists are explicit, never a rule, because real subjects end in the same letters (Cerro Coso's PSYC MUSC EDUC PHSC
SOSC PTEC FRCC EMTC; Porterville's HOSP). Source: `f-cerro-coso-porterville-letter-glued-to-subject-s736`, checked
against Cerro Coso's Long-Term Schedule Effective Fall 2024 (Sam, 2026-11-27; vault
`raw/2026-11-27-cerro-coso-long-term-schedule-fall-2024.md`). ICC (one Cerro Coso row, *Intro Library Research*)
stays: no IC subject exists and the schedule does not list it (`d-icc-not-folded-s744`).

Only kb/_build_coci_lookup.py applies it, so every reader of coci_lookup_data.js sees the folded code. The builders
that read kb/reference/coci_course_list.xlsx directly key on the control number and are left alone.
"""

# College name exactly as COCI writes it -> (campus letter, glued subject codes).
GLUED = {
    "Cerro Coso Community College": ("C", frozenset(
        "ADMJC ANTHC ARTC ASLC BIOLC BSADC BSOTC CHDVC CSCIC DMAC EDUCC EMTCC ENGLC FRENC GEOLC HCRSC HMSVC LATNC "
        "MATHC MUSCC PARAC PHEDC PHSCC PHYSC POLSC SPANC".split())),
    "Porterville College": ("P", frozenset("BIOLP CMRTP ENGLP FIREP HLEDP MATHP".split())),
}

# The Subjects pages' college slug for the same two colleges (kb/_build_local_subject_titles.py college slugs).
SLUG = {"cerro_coso_community": "Cerro Coso Community College", "porterville": "Porterville College"}


def base_code(slug, code):
    """The subject a glued code folds to for a college slug (`cerro_coso_community`, `ADMJC` -> `ADMJ`), else the
    code. kb/subject_decisions.py uses it so a person's save on a glued code carries to the folded one."""
    spec = GLUED.get(SLUG.get(slug, ""))
    su = (code or "").strip().upper()
    return su[:-1] if spec and su in spec[1] else code


def fold(college, subject, number):
    """Return (subject, number) with a glued campus letter moved onto the number; anything else unchanged.

    `PHEDC`, `103` -> `PHED`, `C103`. A number that already carries the letter keeps it (`HCRSC C134` ->
    `HCRS C134`)."""
    spec = GLUED.get(college)
    if not spec:
        return subject, number
    letter, codes = spec
    su = (subject or "").strip().upper()
    if su not in codes:
        return subject, number
    num = (number or "").strip()
    if not num.upper().startswith(letter):
        num = letter + num
    return su[:-1], num

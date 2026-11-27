"""Fold the letters COCI glued onto a subject code back onto the course number (S744; Chabot S745).

Cerro Coso numbers every course with a C after the subject (its schedule prints PHED C103, EMTC C070), and
Porterville with a P (BIOL P118). COCI stores most of those courses that way and some with the letter glued to the
subject instead: `PHEDC 103`, `EMTCC 070`, `BIOLP 118`. The glued codes are not subjects; they read as untitled local
subject codes on the Subjects card and split one course into two keys.

Chabot has the same defect with longer letters (S745). Its course numbers lead with letters (ATHL BB13, PEAC LSF1,
HEAG BY50, DANC JD1), and COCI stores some of them glued: `ATHLBB 13`, `PEACLSF 2`, `HEAGBY 50`, `DANCJD 4`. The
evidence is COCI's own rows: PEAC LSF1 and LSF3 sit under the base subject beside the glued PEACLSF 2 and 4, and ATHL
BB13, MT19, WS14 and PEAC SPM1, SWM4, WEI3 are listed both ways. Chabot's catalog lists ATHL, DANC, HEAG and PEAC as
subjects and none of the glued codes (its subject list, read on runs 46060688269 and 46061067072 from Sam's training
note of 2026-11-27).

The lists are explicit, never a rule, because real subjects end in the same letters (Cerro Coso's PSYC MUSC EDUC PHSC
SOSC PTEC FRCC EMTC; Porterville's HOSP; at Chabot a code that starts with a real subject is not always that subject
plus letters). Source: `f-cerro-coso-porterville-letter-glued-to-subject-s736`, checked against Cerro Coso's Long-Term
Schedule Effective Fall 2024 (Sam, 2026-11-27; vault `raw/2026-11-27-cerro-coso-long-term-schedule-fall-2024.md`).
ICC (one Cerro Coso row, *Intro Library Research*) stays: no IC subject exists and the schedule does not list it
(`d-icc-not-folded-s744`). Chabot's PHEACJUD (one row, *Beginning Judo*) stays: it splits two ways (PHEA CJUD or PHEAC
JUD) and the catalog lists no PHEA subject (`d-pheacjud-not-folded-s745`). MICR, PHSI and PHEA are retired codes with
no catalog subject and are not glued; they stay as COCI writes them.

Only kb/_build_coci_lookup.py applies it, so every reader of coci_lookup_data.js sees the folded code. The builders
that read kb/reference/coci_course_list.xlsx directly key on the control number and are left alone.
"""


def _suffix(letter, codes):
    """One letter cut off the end of each code: Cerro Coso's and Porterville's shape."""
    return {c: (c[:-1], letter) for c in codes.split()}


def _lead(base, letters):
    """Chabot's shape: the base subject and the letters that lead the course number."""
    return {base + x: (base, x) for x in letters.split()}


# College name exactly as COCI writes it -> {glued subject code: (base subject, letters moved to the number)}.
GLUED = {
    "Cerro Coso Community College": _suffix("C",
        "ADMJC ANTHC ARTC ASLC BIOLC BSADC BSOTC CHDVC CSCIC DMAC EDUCC EMTCC ENGLC FRENC GEOLC HCRSC HMSVC LATNC "
        "MATHC MUSCC PARAC PHEDC PHSCC PHYSC POLSC SPANC"),
    "Porterville College": _suffix("P", "BIOLP CMRTP ENGLP FIREP HLEDP MATHP"),
    "Chabot College": {**_lead("ATHL", "BB MB MT SM SW WB WS"), **_lead("DANC", "JD"),
                       **_lead("HEAG", "BY FN SF SW WA WE"),
                       **_lead("PEAC", "BTC FUN LSF PLF SBB SBM SBW SPM SWM WEI WSC")},
}

# The Subjects pages' college slug for the same colleges (kb/_build_local_subject_titles.py college slugs).
SLUG = {"cerro_coso_community": "Cerro Coso Community College", "porterville": "Porterville College",
        "chabot": "Chabot College"}


def base_code(slug, code):
    """The subject a glued code folds to for a college slug (`cerro_coso_community`, `ADMJC` -> `ADMJ`; `chabot`,
    `PEACLSF` -> `PEAC`), else the code. kb/subject_decisions.py uses it so a person's save on a glued code carries to
    the folded one."""
    spec = GLUED.get(SLUG.get(slug, ""), {})
    su = (code or "").strip().upper()
    return spec[su][0] if su in spec else code


def fold(college, subject, number):
    """Return (subject, number) with the glued letters moved onto the number; anything else unchanged.

    `PHEDC`, `103` -> `PHED`, `C103`; `PEACLSF`, `2` -> `PEAC`, `LSF2`. A number that already carries the letters
    keeps them once (`HCRSC C134` -> `HCRS C134`)."""
    spec = GLUED.get(college)
    if not spec:
        return subject, number
    su = (subject or "").strip().upper()
    if su not in spec:
        return subject, number
    base, letters = spec[su]
    num = (number or "").strip()
    if not num.upper().startswith(letters):
        num = letters + num
    return base, num

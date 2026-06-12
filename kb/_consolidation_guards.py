"""
Shared title-safety guards for the consolidation-candidate lanes
(kb/_desc_consolidation_dryrun.py + kb/_title_consolidation_dryrun.py).

Extracted Session 46 so the two re-runnable receipt builders can't drift.
The guard suite is the accumulated damage-control from reading naive runs:

  * LEVEL marks are TWO AXES (Session 46 — the Portuguese collision):
    word-levels (beginning/elementary=1, intermediate=2, advanced=3 ...) and
    digit-levels (digits, roman numerals, cardinal word-numbers, A/B section
    suffixes) gate SEPARATELY, then the combined set gates too. A flat set
    let "Elementary Portuguese 2" pair with "Intermediate Portuguese -
    Level 1" (both {1,2}); per-axis comparison blocks it, while still
    letting "Basic Peer Support" {W:1} block against "Peer Support
    Training II" {D:2} via the combined-set test.
  * Cardinal word-numbers ("Smog Level One and Level Two") count as digit
    marks — the AUTO/smog lesson.
  * 4-digit YEARS are edition marks ("2019 Smog Check Update" vs "2021 ...";
    "US History to 1865" vs "... 1877 to Present") — equality-gated when
    both titles carry any.
  * VARIANT-TYPE marks gate at STRICT equality (asymmetric possession
    blocks): a Refresher/Update/Supplemental/Instructor/Supervisor/Module/
    Bridge/Honors course is a different course from its base — "EMT-I
    Refresher" never pairs with "EMT-I", but pairs fine with another
    "EMT 1 Refresher Training".
  * GENDER + SPORT marks (the athletics template-description trap, desc
    lane Session 45) — both-present-and-different blocks; sports use
    subset-or-equal ("Cross Country" pairs with "Cross Country, Men").

All mark extractors are pure functions of the title string.
"""
import re

ROMAN = {"i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5, "vi": 6, "vii": 7,
         "viii": 8, "ix": 9, "x": 10}
# Cardinal word-numbers — digit-axis marks (the smog "Level One and Level
# Two" lesson). Spelled ordinals (first/second/...) stay WORD-axis below.
WORDNUM = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6,
           "seven": 7, "eight": 8, "nine": 9, "ten": 10}
LEVEL_WORDS = {"beginning": 1, "elementary": 1, "introductory": 1, "first": 1,
               "basic": 1, "intermediate": 2, "second": 2, "advanced": 3,
               "third": 3, "fourth": 4}
# Variant-type vocabulary — course flavors that are NEVER the base course.
# STRICT-equality gated (possession on one side only blocks the pair).
VARIANT_WORDS = {"refresher", "recertification", "recert", "supplemental",
                 "update", "instructor", "supervisor", "module", "modular",
                 "bridge", "honors"}
GENDER = {"men": "m", "mens": "m", "male": "m", "women": "w", "womens": "w",
          "female": "w"}
# closed-ish list of sport nouns whose off-season/varsity template
# descriptions are interchangeable — titles naming DISJOINT sports never pair
SPORTS = {"baseball", "softball", "basketball", "volleyball", "soccer",
          "football", "wrestling", "tennis", "golf", "swimming", "diving",
          "badminton", "track", "country", "polo", "cheerleading",
          "lacrosse", "rowing", "crew"}


def title_marks(title, vocab):
    """Marks from a closed vocabulary (set -> the word; dict -> its value)."""
    out = set()
    for w in re.split(r"[^a-z]+", str(title or "").lower()):
        if w in vocab:
            out.add(vocab[w] if isinstance(vocab, dict) else w)
    return out


def title_levels(title):
    """Level markers as (word_axis, digit_axis) frozensets.

    word axis:  beginning/elementary/basic=1, intermediate/second=2, ...
    digit axis: digits <=2 chars, roman numerals, cardinal word-numbers,
                trailing A/B section suffixes (digit AND letter: "2B" -> {2,'b'}).
    """
    t = str(title or "").lower()
    word, digit = set(), set()
    for w in re.split(r"[^a-z0-9]+", t):
        if not w:
            continue
        if w.isdigit() and len(w) <= 2:
            digit.add(int(w))
        elif w in ROMAN:
            digit.add(ROMAN[w])
        elif w in WORDNUM:
            digit.add(WORDNUM[w])
        elif w in LEVEL_WORDS:
            word.add(LEVEL_WORDS[w])
    m = re.search(r"\b([1-9])?([ab])\b\s*$", t)
    if m:
        if m.group(1):
            digit.add(int(m.group(1)))
        digit.add(m.group(2))
    # section/module letters beyond A/B when context-marked ("Honda IST
    # Session C" vs "Session A" — Session 46's same-college damage read).
    for m in re.finditer(r"\b(?:session|module|part|unit|phase)\s+([a-h])\b", t):
        digit.add(m.group(1))
    return frozenset(word), frozenset(digit)


def title_years(title):
    """4-digit year edition/period marks. 15xx-20xx so history-period
    boundaries count too ("US History to 1865" vs "... 1877 to Present"),
    not just catalog editions ("2019 Smog Check Update")."""
    return frozenset(int(w) for w in re.split(r"[^0-9]+", str(title or ""))
                     if re.fullmatch(r"(1[5-9]|20)\d{2}", w))


def extract_marks(title):
    """All guard marks for one title, as a dict (cache per row)."""
    word, digit = title_levels(title)
    return {
        "lvl_w": word, "lvl_d": digit,
        "years": title_years(title),
        "variant": frozenset(title_marks(title, VARIANT_WORDS)),
        "gender": frozenset(title_marks(title, GENDER)),
        "sports": frozenset(title_marks(title, SPORTS)),
    }


def marks_conflict(ma, mb):
    """Rejection label when two titles' marks make pairing unsafe, else None.
    ma/mb are extract_marks() dicts. Pure title-safety — callers add their
    own credit/units/corroboration gates."""
    wa, wb = ma["lvl_w"], mb["lvl_w"]
    da, db = ma["lvl_d"], mb["lvl_d"]
    if wa and wb and wa != wb:
        return "level_risk"
    if da and db and da != db:
        return "level_risk"
    fa, fb = wa | da, wb | db
    if fa and fb and fa != fb:
        return "level_risk"
    ya, yb = ma["years"], mb["years"]
    if ya and yb and ya != yb:
        return "year_risk"
    if ma["variant"] != mb["variant"]:
        return "variant_risk"
    ga, gb = ma["gender"], mb["gender"]
    if ga and gb and ga != gb:
        return "gender_risk"
    sa, sb = ma["sports"], mb["sports"]
    if sa and sb and not (sa <= sb or sb <= sa):
        return "sport_risk"
    return None

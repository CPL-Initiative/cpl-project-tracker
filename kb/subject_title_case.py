#!/usr/bin/env python3
"""Title Case for a local subject title (Sam, 2026-11-21, in session: "make sure all titles are saved in Title
case, not all caps").

A catalog prints its subject headings in capitals (ADMINISTRATION OF JUSTICE) or in mixed case with every word
capitalized (Anatomy And Physiology). A local subject title is saved one way: each word capitalized, the small
joining words in lower case inside the title, and the short forms a catalog writes in capitals kept (ESL, CAD,
HVAC), and a code in parentheses keeps its capitals (formerly COTR). The words as printed stay beside the title wherever a file keeps its evidence. One function, imported by
the headings filer and the local subject titles builder; never copied.
"""
import re

SMALL = {"a", "an", "and", "as", "at", "by", "for", "from", "in", "of", "on", "or", "the", "to", "with"}
# Short forms kept in capitals. A word in capitals that is not here is read as an ordinary word.
KEPT = {"ESL", "ESOL", "CAD", "CADD", "HVAC", "HVACR", "GED", "EMT", "ASL", "CNC", "IT", "TV", "ROTC", "STEM",
        "CIS", "CSIT", "GIS", "DSPS", "EOPS", "VESL", "ABE", "NC", "LGBTQ", "LGBTQ+", "CTE", "CPR", "RN", "LVN", "HIV",
        "AIDS", "USA", "US", "UC", "CSU", "CCN", "ID", "CA", "PE", "DE", "AI", "3D", "2D"}
ROMAN = re.compile(r"^(?=[IVX])(X{0,3})(IX|IV|V?I{0,3})$")


def _word(w, first, coded=False):
    core = w.strip("()[],;:.–—")
    if not core:
        return w
    up = core.upper()
    if coded and (core.isupper() and len(core) >= 2 or core.islower()):
        out = core                      # inside parentheses a code and a note word stay as printed: "(formerly COTR)"
    elif up in KEPT or ROMAN.match(up) and len(up) <= 4 and core.isupper():
        out = up
    elif core.lower() in SMALL and not first:
        out = core.lower()
    elif "-" in core or "/" in core:
        out = re.sub(r"[^-/]+", lambda m: _word(m.group(0), True), core)
    elif not core.isupper() and any(c.isupper() for c in core[1:]):
        out = core                      # a word printed with capitals inside it (HiSET) stays as printed
    else:
        out = core[0].upper() + core[1:].lower()
    return w.replace(core, out, 1)


def title_case(s):
    """The title in Title Case; an empty or missing title comes back as it is."""
    if not s or not str(s).strip():
        return s
    words = str(s).split()
    out = []
    depth = 0
    for i, w in enumerate(words):
        first = i == 0 or out[-1].endswith((":", "–", "—")) or out[-1] in ("-", "–", "—")
        # A word written in capitals inside parentheses is a subject code (Sam, 2026-11-23: Clovis's "Work Experience
        # Education (formerly COTR)" could not be saved while COTR read as Cotr); it keeps its capitals.
        coded = depth > 0 or w.startswith("(")
        out.append(_word(w, first, coded))
        depth = max(0, depth + w.count("(") - w.count(")"))
    return " ".join(out)

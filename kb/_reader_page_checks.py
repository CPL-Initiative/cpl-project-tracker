#!/usr/bin/env python3
"""The reader's page checks: a program's catalog page is the one that prints the program's own title with its award.

WHY. The College Data Collection pile "read, but no courses placed" held 725 programs on 2026-11-17 (the harvest
gap census, cause places_none). The Courses bot read all of them (issue #3480, Source 7; the classifier and the
rule tests are file set 1 on #3510): in 731 of 737 records the extractor placed nothing because the page the reader
handed it was not the program's own. It held a sister award's section, a general-education list, or the catalog's
course descriptions. The reader took such a page because it prints half the listed course codes
(P.ACCEPT_SHARE, kb/_program_requirements_pilot.py), whether or not it prints the program's heading. These rules
choose the page by the heading:

  Rule B  A course-descriptions page or a general-education page is never a program's page. Checked first.
  Rule A  A page counts as the program's own only when one of its lines prints every word of the program's title,
          with its award type within three lines ("Geology, A.S."; a certificate's word on that line or the next).
          Matching course codes alone are not enough. The line must print no other program beside the title: no
          other word before it, between its words or after it before the award, and no option the award introduces
          ("Wildland Fire Technology AS", "Accounting: Bookkeeping - Certificate of Achievement", "Automotive
          Technology Certificate - Engine Specialist"). An A.S. or A.A. never reads a transfer degree's award line, a
          credit certificate never reads a certificate of completion, and a bare "AS" counts only beside the title or
          punctuation ("courses such as GEOL 1" names none). A table-of-contents line, a "(p. 250)" cross-reference
          or a breadcrumb never counts. On a PDF, a heading at a page's foot reads its award on the next page's first
          lines, past the catalog's running header and footer (furniture()). Among the pages that pass, the one whose window (that page and the next)
          prints the most listed codes is the page. Self-recall: tests/reader_page_checks_recall_test.py.
  Rule C  On a site catalog, the page is read with every tab, and rule A's title check still applies (a subject's
          landing page can hold course descriptions in its courses tab).
  Rule D  Behind its own switch, off by default (CPL_RULE_D_NOT_PRINTED=1): a PDF catalog in which no line prints
          the program's title (a line joined with the next counts, so a title wrapped onto a second line, in either
          column, is printed) gives the program the named gap "not printed in the <year> catalog". The program is
          read from no page, so no reread is aimed at it, and kb/_program_discontinued.py lists it for the
          discontinued-program check (a prior-year read confirms or clears it).

SCOPE. The rules apply only to a program whose committed record places none of its listed courses
(S.places_none on records/<cn>.json), and never to a general-education pattern program (its page is a pattern
page by definition). Every other program reads exactly as before: a record that places courses keeps the
picker that placed them. Programs share pages, so a marked program could move an unmarked one; it never does:
assign() gives every unmarked program the page it gets with no program marked, and a marked program claims an
unmarked holder's page only where page_winners() keeps the holder beside it; pdf_unproven() takes its control-number
share over the picks as they were without the checks (pdf_basis). capture() marks the programs (mark());
candidates(), capture_pdf() and the link search read the mark. CPL_READER_PAGE_CHECKS=0 turns rules A to C off for every program, as a kill switch.

A curator's pin (pdf_pages in the reconcile file), a catalog that heads its programs with codes
(pdf_code_assign) and a catalog read by its printed control numbers (numbers_after) keep their own binding:
each already names the program's page by something stronger than its codes.

Guard: tests/reader_page_checks_test.py. Plan of the rereads: kb/program_requirements_reread_plan_s683.json.
"""
from __future__ import annotations

import json
import os
import re
import urllib.parse

import _program_requirements_pilot as P

SWITCH_ABC = "CPL_READER_PAGE_CHECKS"     # "0" turns rules A to C off; any other value, or none, leaves them on
SWITCH_D = "CPL_RULE_D_NOT_PRINTED"       # "1" turns rule D on; off by default
MARK = "page_checks"                      # the program dict's key capture() sets

# Words a heading need not print (COBIx's STOP list, file set 1).
STOP = {"and", "the", "for", "with", "of", "in", "to", "a", "an", "degree", "certificate", "program", "studies"}
HEADING_REACH = 3            # lines: the award prints within this many lines of the title's line
HEADING_SLACK = 60           # characters a heading line may run past the title
TOC_LINE = re.compile(r"\.{4,}|\(p\.\s*\d+\)|\bp\.\s*\d+\b", re.I)

# Rule B's page types (COBIx, Source 7 section 6): course descriptions print their fields entry by entry; a
# general-education page names its patterns and areas again and again.
DESC_FIELD = re.compile(r"\b(?:Prerequisites?|Advisory|Transfers?:|Repeatability|Grading)\b")
DESC_HEADER = re.compile(r"course\s+descriptions?", re.I)
UNITS_LINE = re.compile(r"^\s*[A-Z]{2,6}\s?-?\d{1,4}[A-Z]?\s.*\b\d+(?:\.\d+)?\s*(?:units?|hours?)\b", re.I | re.M)
GE_MENTION = re.compile(r"\bIGETC\b|\bCal[\s-]?GETC\b|\bCSU\s?GE\b|general\s+education\s+(?:pattern|requirements|breadth)"
                        r"|\bArea\s+[1-7][A-D]?\b", re.I)
DESC_FIELDS_MIN, DESC_UNITS_MIN, GE_MIN = 4, 3, 4
DESC_PATH = re.compile(r"course[-_ ]?descriptions?", re.I)

# Each award's words as a heading prints them. A bare abbreviation must be capitals, next to the title or punctuation
# (", AS", "(AS)", at the line's end), so "courses such as GEOL 1" never names an A.S.; a local degree's words never
# stand for a transfer degree (heading_line refuses an A.S. or A.A. award line that prints a transfer degree's words);
# a credit certificate's word never stands for a noncredit certificate of completion or competency.
_ABBR_END = r"(?=\s*(?:$|[),;:.\]]|(?i:degree)\b|-\s*(?![Tt]\b)))"
AWARD_WORDS = {
    "adt": re.compile(r"(?i:\bfor\s+transfer\b|\b(?:aa|as)\s?-\s?t\b|\ba\.\s?[as]\.\s?-\s?t\b|\ba[as]t\b|\btransfer\s+degree\b)"),
    "as": re.compile(r"(?i:associate\s+(?:in|of)\s+science)(?!\s+(?i:degree\s+)?(?i:for\s+transfer))"
                     r"|\bA\.\s?S\.(?!\s?-\s?T)|\bAS\b" + _ABBR_END),
    "aa": re.compile(r"(?i:associate\s+(?:in|of)\s+arts)(?!\s+(?i:degree\s+)?(?i:for\s+transfer))"
                     r"|\bA\.\s?A\.(?!\s?-\s?T)|\bAA\b" + _ABBR_END),
    "coa": re.compile(r"(?i:certificate(?!\s+of\s+(?:completion|competency))|\bcert\b|\bcoa\b)|\bCA\b" + _ABBR_END),
    "noncredit": re.compile(r"certificate\s+of\s+(?:completion|competency)|\bnoncredit\b", re.I),
    "bs": re.compile(r"(?i:bachelor|baccalaureate|\bB\.\s?[SA]\.?)|\bB[SA]\b" + _ABBR_END),
}
COA_REACH = 1                # a certificate's word prints on the heading line or the line after it
NAV_LINE = re.compile(r"\s>\s|\u00bb|\u203a")   # a breadcrumb ("Home > Degrees & Certificates > Accounting")

# Words a heading may print beside the title (award words, the STOP words, filler). Any other word before the title,
# between its words, or after it before the award names a sister program ("Wildland Fire Technology", "Accounting:
# Bookkeeping", "Mathematics with Physics Emphasis"), and the line is not the program's heading.
HEADING_FILLER = STOP | {
    "degrees", "certificates", "achievement",
    "accomplishment", "completion", "competency", "proficiency", "recognition", "transfer", "as", "aa", "ast", "aat",
    "ba", "bs", "bachelor", "baccalaureate", "noncredit", "credit", "cert", "coa", "ca", "major", "programs", "requirements",
    "required", "units", "unit", "total", "fall", "spring", "summer", "catalog", "year", "code", "home", "overview",
}
AWARD_PHRASE = re.compile(r"\bassociates?\s+(?:in|of)\s+(?:science|arts)\b|\bassociates?\s+degree\b"
                          r"|\bbachelors?\s+of\s+(?:science|arts)\b")
AWARD_TOKENS = {"degree", "certificate", "achievement", "accomplishment", "completion",
                "competency", "proficiency", "transfer", "as", "aa", "ast", "aat", "ba", "bs", "bachelor",
                "baccalaureate", "noncredit", "cert", "coa", "ca"}
TOKEN = re.compile(r"[a-z0-9]+")
# "science" and "arts" are filler only inside an award's phrase ("Associate in Science"), which _sister_words reads as
# one award word: "Public Health Science Associate in Science" prints Public Health Science, and "History Associate
# in Arts" never prints Art History. "Associate" alone is no award and no filler ("Associate Teacher Certificate").


def abc_on() -> bool:
    return os.environ.get(SWITCH_ABC, "1").strip() != "0"


def d_on() -> bool:
    return os.environ.get(SWITCH_D, "").strip() == "1"


def applies(program: dict) -> bool:
    """Whether rules A to C read this program: capture() marked it, and the switch is on."""
    return bool(program.get(MARK)) and abc_on()


def _ge_title(title: str | None) -> bool:
    import _program_requirements_college as C   # the reader's own pattern test; imported late (C imports this)
    return C.ge_pattern(title)


def places_none_filed(folder: str) -> set[str]:
    """The control numbers whose committed record (folder/records/<cn>.json) places none of its listed courses."""
    from _program_requirements_score import places_none
    out: set[str] = set()
    rec_dir = os.path.join(folder, "records")
    if not os.path.isdir(rec_dir):
        return out
    for name in sorted(os.listdir(rec_dir)):
        if not name.endswith(".json"):
            continue
        try:
            with open(os.path.join(rec_dir, name), encoding="utf-8") as fh:
                rec = json.load(fh)
        except (OSError, ValueError):
            continue
        if isinstance(rec, dict) and places_none(rec.get("score")):
            out.add(str(rec.get("control_number") or name[:-5]))
    return out


def mark(programs: list[dict], folder: str) -> int:
    """Mark each program the rules read (MARK): its committed record places none, and it is no general-education
    pattern program. Returns how many were marked."""
    scope = places_none_filed(folder)
    n = 0
    for p in programs:
        p[MARK] = bool(p.get("closed_list")) and p.get("control_number") in scope and not _ge_title(p.get("title"))
        n += p[MARK]
    return n


# ── the tests on a page's text ──────────────────────────────────────────────────────────────────────────────────
def title_words(title: str | None) -> list[str]:
    """The title's words a heading must print: lowercase, three letters or more, the STOP words and a version left out;
    a parenthesized acronym may be left out when words remain."""
    t = (title or "").lower().replace("2.0", " ")
    bare = re.sub(r"\([^)]*\)", " ", t)
    for src in (bare, t):
        words = [w for w in re.findall(r"[a-z0-9]+", src) if w not in STOP and len(w) > 2]
        if words:
            return list(dict.fromkeys(words))
    return []


def award_pattern(award: str | None) -> re.Pattern | None:
    """The words a heading prints for the program's award, or None when the award names no kind a heading prints."""
    kind = P.award_kind(award)
    if kind in AWARD_WORDS:
        return AWARD_WORDS[kind]
    if "certificate" in (award or "").lower():
        return AWARD_WORDS["coa"]
    return None


def page_type(text: str | None) -> str:
    """Rule B: "descriptions", "ge" or "other"."""
    t = text or ""
    if len(DESC_FIELD.findall(t)) >= DESC_FIELDS_MIN or (
            DESC_HEADER.search(t[:400]) and len(UNITS_LINE.findall(t)) >= DESC_UNITS_MIN):
        return "descriptions"
    if len(GE_MENTION.findall(t)) >= GE_MIN:
        return "ge"
    return "other"


def _segment(line: str, words: list[str]) -> str:
    """The stretch of a line (columns split on three spaces or more) naming the most title words."""
    parts = re.split(r"\s{3,}|\t", line.strip().lower())
    return max(parts, key=lambda x: sum(1 for w in words if re.search(r"\b" + re.escape(w), x)), default="")


C_LEVEL = re.compile(r"\blevel\s*-?\s*(\d+|[ivx]+)\b", re.I)   # the reader's LEVEL (kb/_program_requirements_college.py)
ROMAN_END = re.compile(r"\b(i{1,3}|iv|vi{0,3}|ix|x)\s*$", re.I)


def _level(text: str) -> str | None:
    """A title's level ("Level 2", "Spanish II"): two levels of one field are two programs (the reader's LEVEL)."""
    m = C_LEVEL.search(text or "")
    if m:
        return m.group(1).lower()
    m = ROMAN_END.search(re.sub(r"\([^)]*\)", " ", text or "").strip())
    return m.group(1).lower() if m else None


ACRONYM = re.compile(r"\(\s*[a-z0-9.&/-]{1,8}\s*\)")
ABBR = re.compile(r"\b([a-z])\.\s?([a-z])\b\.?")      # "a.s." and "b.a" read as "as" and "ba"
SEP = re.compile(r"[a-z0-9]+|:|(?<=\s)[-\u2013\u2014]|[-\u2013\u2014](?=\s)")   # a dash beside a space; "Media-Web" is one name


def _heading_tokens(text: str) -> list[str]:
    t = ABBR.sub(r"\1\2", ACRONYM.sub(" ", (text or "").lower().replace("2.0", " ")))
    return SEP.findall(AWARD_PHRASE.sub(" degree ", t.replace("(", " ").replace(")", " ")))


def _sister_words(seg: str, words: list[str], title: str | None) -> bool:
    """Whether the segment prints another program beside the title, so it is not the program's heading: a word of the
    title missing (a parenthesized emphasis, a level's "1" or "B"), or a word that is neither the title's own, an
    award word nor filler before the title, between its words, after it before the award, or in an option the award
    introduces with a dash or colon ("Automotive Technology Certificate - Engine Specialist")."""
    need = [t for t in _heading_tokens(title) if t not in ":-\u2013\u2014" and t not in STOP]
    own = set(need) | set(_heading_tokens(title))
    toks = _heading_tokens(seg)
    at = []
    for w in dict.fromkeys(need or words):
        j = next((k for k, t in enumerate(toks)
                  if (t == w if len(w) <= 2 else t.startswith(w) and (t == w or t not in AWARD_TOKENS))), None)
        if j is None:
            return True       # a title word prints nowhere, or only inside an award's words: not its heading
        at.append(j)
    start, end = min(at), max(at)
    ok = HEADING_FILLER | own

    def plain(t, lead=False):
        return (t in ok or t in ":-\u2013\u2014" or (t.isdigit() and (lead or len(t) >= 3))
                or (lead and len(t) == 1))

    if not all(plain(t, lead=True) for t in toks[:start]) or not all(
            plain(t) for k, t in enumerate(toks[start:end + 1], start) if k not in at):
        return True
    awarded = option = False
    for t in toks[end + 1:]:
        if t in AWARD_TOKENS:
            awarded, option = True, False
        elif t in ":-\u2013\u2014":
            option = awarded or option
        elif awarded and not option:
            return False      # prose after the award: the heading ended
        elif not plain(t):
            return True
    return False


def _prints_title(line: str, words: list[str], title_len: int, toc_ok: bool = False,
                  level: str | None = None, title: str | None = None) -> bool:
    if not toc_ok and TOC_LINE.search(line):
        return False
    seg = _segment(line, words)
    if not (all(re.search(r"\b" + re.escape(w), seg) for w in words) and len(seg) <= title_len + HEADING_SLACK):
        return False
    if title is not None and _sister_words(seg, words, title):
        return False
    if level is not None:
        lv = C_LEVEL.search(seg)
        if lv:
            return lv.group(1).lower() == level
        return bool(re.search(r"\b%s\b" % re.escape(level), seg))
    return True


def heading_line(lines: list[str], title: str | None, award: str | None) -> int:
    """Rule A: the index of the first line printing every title word, with no other program's words beside them,
    and the award within HEADING_REACH lines (a certificate's word within COA_REACH), or -1. A table-of-contents
    line, a page cross-reference or a breadcrumb never counts, and an A.S. or A.A. never reads a transfer degree's
    award line."""
    words = title_words(title)
    if not words:
        return -1
    arx = award_pattern(award)
    kind = P.award_kind(award)
    reach = COA_REACH if arx is AWARD_WORDS["coa"] else HEADING_REACH
    tlen, level = len(title or ""), _level(title)

    def names_award(x: str) -> bool:
        if not x or NAV_LINE.search(x) or not arx.search(x):
            return False
        if kind in ("as", "aa") and AWARD_WORDS["adt"].search(x):
            return False      # a transfer degree's award line is never a local degree's
        return not (arx is AWARD_WORDS["coa"] and AWARD_WORDS["noncredit"].search(x))

    for i, ln in enumerate(lines):
        if not ln or NAV_LINE.search(ln) or not _prints_title(ln, words, tlen, level=level, title=title):
            continue
        if arx is None or any(names_award(x) for x in lines[max(0, i - reach): i + reach + 1]):
            return i
    return -1


FURNITURE_EDGE = 2           # a page's first and last lines that may be its running header or footer
FURNITURE_SHARE = 0.05       # a line at a page's edge on this share of pages (at least 3) is the catalog's furniture


def _furniture_key(line: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"\d+", "#", line.strip().lower()))


def furniture(pages: list[str]) -> set[str]:
    """The catalog's running headers and footers: a line (its digits read as one) at a page's top or foot on
    FURNITURE_SHARE of the pages, and on 3 at least."""
    seen: dict[str, int] = {}
    for txt in pages:
        lines = [x for x in (txt or "").split("\n") if x.strip()]
        for k in {_furniture_key(x) for x in lines[:FURNITURE_EDGE] + lines[-FURNITURE_EDGE:]}:
            seen[k] = seen.get(k, 0) + 1
    least = max(3, FURNITURE_SHARE * len(pages))
    return {k for k, n in seen.items() if n >= least}


def heading_at(text: str, title: str | None, award: str | None, next_text: str | None = None,
               furn: set[str] | None = None) -> int:
    """heading_line() on a page's text: the character offset where the heading's line starts, or -1. With the next
    page's text, the award may print on that page's first lines (a heading at the foot of a page whose award line
    opens the next), read past the page's blank lines and the catalog's running header and footer (furn); the heading
    itself must sit on this page."""
    lines = (text or "").split("\n")
    n = len(lines)
    ahead = []
    if next_text:
        furn = furn or set()
        while n and (not lines[n - 1].strip() or _furniture_key(lines[n - 1]) in furn):
            n -= 1        # the page's foot spends none of the reach
        ahead = [x for x in next_text.split("\n") if x.strip()]
        while ahead and _furniture_key(ahead[0]) in furn:
            ahead.pop(0)  # nor does the next page's running header
        ahead = ahead[:HEADING_REACH]
    i = heading_line(lines[:n] + ahead, title, award)
    if i < 0 or i >= n:
        return -1
    return sum(len(x) + 1 for x in lines[:i])


def title_printed(pages: list[str], title: str | None) -> bool:
    """Rule D's test: whether any line of the catalog, or any line joined with the next, prints every title word (any
    award, contents lines too)."""
    words = title_words(title)
    if not words:
        return True     # a title with no words to look for is never called unprinted
    tlen, level = len(title or ""), _level(title)
    for txt in pages:
        low = (txt or "").lower()
        if not all(w in low for w in words):
            continue
        lines = [ln for ln in low.split("\n") if ln.strip()]
        if any(_prints_title(ln, words, tlen, toc_ok=True, level=level) for ln in lines):
            return True
        if any(_prints_title(a + " " + b, words, tlen, toc_ok=True, level=level)
               for x, y in zip(lines, lines[1:]) for a in _columns(x) for b in _columns(y)):
            return True       # a title wrapped onto a second line, in either column of a two-column page
    return False


def _columns(line: str) -> list[str]:
    """A line's column segments (split on three spaces or more, as _segment splits them)."""
    return [x for x in re.split(r"\s{3,}|\t", line.strip()) if x]


def not_printed_gap(year: str | None) -> str:
    return "not printed in the %s catalog" % (year or "current")


# ── a PDF catalog ───────────────────────────────────────────────────────────────────────────────────────────────
def pdf_page(pages: list[str], program: dict, year: str | None = None) -> dict:
    """Rules B then A (and D when its switch is on) over a PDF catalog's pages, for one program:
    {"heading": {"page", "at"}, "share", "rule"} for the page found, else {"heading": None, "why", "rule", "gap"?}.
    The heading dict is pdf_best()'s own (kb/_program_requirements_college.py): the window runs from that page."""
    courses = program.get("closed_list") or []
    words = title_words(program.get("title"))
    title, award = program.get("title"), program.get("award")
    found, refused_b, furn = [], 0, None
    for i, txt in enumerate(pages):
        low = (txt or "").lower()
        if not words or not all(w in low for w in words):
            continue
        if furn is None:
            furn = furniture(pages)
        at = heading_at(txt, title, award, pages[i + 1] if i + 1 < len(pages) else None, furn)
        if at < 0:
            continue
        if page_type(txt) != "other":
            refused_b += 1      # rule B: the heading sits on a descriptions or general-education page
            continue
        window = txt + "\n" + (pages[i + 1] if i + 1 < len(pages) else "")
        share = P.coverage(P.find_codes(window, courses), courses)
        found.append((share, -i, i, at))
    if found:
        share, _, i, at = max(found)
        return {"heading": {"page": i, "at": at}, "share": round(share, 3), "rule": "A",
                "page_number": i + 1, "refused_b": refused_b}
    out = {"heading": None, "rule": "A", "refused_b": refused_b,
           "why": ("rule B then A: the pages printing the program's title with its award are course descriptions or "
                   "general-education pages" if refused_b else
                   "rule A: no page prints the program's title with its award")}
    if d_on() and not title_printed(pages, title):
        out.update(rule="D", gap=not_printed_gap(year),
                   why="rule D: no line of the catalog prints the program's title")
    return out


# ── a site catalog ──────────────────────────────────────────────────────────────────────────────────────────────
def _slug_words(url: str | None) -> str:
    path = urllib.parse.unquote(urllib.parse.urlparse(url or "").path)
    seg = path.rstrip("/").split("/")[-1] if path.strip("/") else ""
    return re.sub(r"[-_]+", " ", seg)


def site_page(pg: dict, program: dict, text: str, found: dict, field: str) -> tuple[tuple | None, str | None]:
    """Rules B, C and A on one site page for one program: ((text, found, field), None) when the page stands, the text
    read with every tab (rule C), else (None, why)."""
    courses = program.get("closed_list") or []
    got = pg.get("got") or {}
    body = got.get("body") or pg.get("body") or ""
    if DESC_PATH.search(urllib.parse.urlparse(pg.get("url") or "").path) or page_type(body) != "other":
        return None, "rule B: a course-descriptions or general-education page"
    tabs = P.hidden_tabs_text(got)
    if tabs and field == "innerText":
        both = body + "\n\n" + tabs
        fb = P.find_codes(both, courses)
        if len(fb) >= len(found):
            text, found, field = both, fb, "innerText+tabs"
    lines = [pg.get("h1") or got.get("h1") or "", (pg.get("title") or got.get("title") or "").split("|")[0],
             _slug_words(pg.get("url"))] + (text or "").split("\n")
    if heading_line(lines, program.get("title"), program.get("award")) < 0:
        return None, "rule A: the page does not print the program's title with its award"
    return (text, found, field), None

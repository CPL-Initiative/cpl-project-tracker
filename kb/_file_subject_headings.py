#!/usr/bin/env python3
"""File each catalog's subject headings from a headings read (S698, #3655).

WHY. A local subject title comes only from the catalog's subject heading (Sam's rule on #3655). The filed
catalogs (kb/hand_filed_catalogs/courses/) keep each course from its heading line down, so six colleges held no
subject heading at all. A headings read (kb/_college_page_read.py, plan key subject_context) prints the lines
above each subject's first course; this script reads that job log and files, per college,
kb/hand_filed_catalogs/subjects/<slug>.json: one entry per subject code with the heading it took, the rule
that took it, and the lines it was taken from, as printed. A code whose lines hold no heading is filed with
heading null and its lines, so a person or a later rule can settle it; nothing is guessed.

The heading is read by three rules, in order:
  named    a line "Accounting (ACCTG)": a name followed by the code in parentheses (two codes: "(MATH & STAT)").
  caps     the block of capital-letter lines nearest the course, read through the notes under it. A college
           whose headings carry its department (STYLE: Los Angeles Mission prints "ACCOUNTING – BUSINESS AND
           LAW", or the department on a second line) gives the part ahead of the dash, or the first line.
  fits     a short line in mixed case with no code beside it ("Anatomy"), taken only when the code's letters
           run in order through it.
  section  a code that opens inside another subject's listing (ENGL C1000 among ENGLISH) takes that listing's
           heading when its letters run through it and it opens with the code's first three letters (four letters
           or more: ART is not read into ARCHITECTURE).
  none     no line reads as a heading. `candidate` then holds the nearest short line, for a reviewer and
           the recommender; it is never a title by itself.
A heading in capitals or mixed case is saved as the title only when the code's letters run in order through it
(ACCTG in ACCOUNTING); otherwise it is kept as the `candidate`, A named heading carries its code and needs no such test.

A college whose catalog is one page per subject lists them on an index, each label a heading with its code:
`--index` files those, with each subject's own address.

A former code the index names ("ANTHROPOLOGY (ANTH, Formerly ANTHRO)") belongs to the college's code history
(kb/subject_code_history.py), never to this file. A curator may file an index by hand from a source the reader cannot reach (Clovis, S715: Sam's reading of the
catalog PDF's table of contents); the file names the person, the date and the page as its `read_by` and `source`.

Usage: python3 kb/_file_subject_headings.py <job log with timestamps stripped> --run <run id> [--index] [--write]
       python3 kb/_file_subject_headings.py --check      (the committed files parse and name their runs)
"""
import argparse
import glob
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from subject_title_case import title_case  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join("kb", "hand_filed_catalogs", "subjects")

# The college a "college page read:" line names -> its slug (slug_of in kb/_program_requirements_college.py).
SLUGS = {
    "El Camino College": "el_camino",
    "Los Angeles Mission College": "los_angeles_mission",
    "Los Angeles Pierce College": "los_angeles_pierce",
    "Los Angeles Trade-Technical College": "los_angeles_trade_technical",
    "West Los Angeles College": "west_los_angeles",
    "Los Angeles Valley College": "los_angeles_valley",
    "Los Angeles Southwest College": "los_angeles_southwest",
    "Los Angeles City College": "los_angeles_city",
    "Cerritos College": "cerritos",
    "Long Beach City College": "long_beach_city",
    "Monterey Peninsula College": "monterey_peninsula",
    "Southwestern College": "southwestern",
    "North Orange Continuing Education": "north_orange_continuing_education",
}
# How a college prints a heading that carries its department.
STYLE = {
    "los_angeles_mission": {"department": True},
}

NAMED = re.compile(r"^(?P<name>[A-Za-z][^()]{1,80}?)\s*\((?P<codes>[A-Z][A-Z0-9 &/.,\-]{0,30})\)$")
FURNITURE = re.compile(r"(?i)^(course descriptions?( - .*)?|credit courses|noncredit courses|courses|"
                       r".*\bcatalog\b.*|.*\bpage \d+ of \d+.*|and programs of study|\d{1,4})$")
DASH = re.compile(r"\s+[–—-]\s+")


def code_key(s):
    return re.sub(r"[^A-Z0-9]", "", str(s or "").upper())


def is_caps(line):
    """A heading in capitals: mostly capital letters, no closing period, short, and not page furniture."""
    letters = [c for c in line if c.isalpha()]
    if len(letters) < 3 or len(line) > 70 or line.rstrip().endswith((".", ":", ";")) or re.search(r"[\d:]", line) \
            or len(line.split()) > 8:
        return False
    if FURNITURE.match(line.strip()):
        return False
    return sum(1 for c in letters if c.isupper()) / len(letters) >= 0.85


def is_note(line):
    """A line a catalog prints between a heading and its first course: a note or a sentence."""
    t = line.strip()
    return bool(re.match(r"(?i)^(note|see |see:|\(see|formerly|prerequisite|students? )", t)) or t.endswith(".") or \
        (sum(1 for c in t if c.islower()) > 0.6 * max(1, sum(1 for c in t if c.isalpha())) and len(t.split()) >= 5)


def fits(code, heading):
    """The code's letters, in order, through the heading's letters (ACCTG in ACCOUNTING)."""
    want, have = code_key(code), code_key(heading)
    i = 0
    for ch in have:
        if i < len(want) and ch == want[i]:
            i += 1
    return bool(want) and i == len(want)


def candidate(before):
    """The nearest short line that reads as a heading where no rule took one: for a reviewer and the
    recommender, never a title by itself (El Camino prints "Sign Language/Interpreter Training" above ASL)."""
    for line in reversed([b.strip() for b in before if b.strip()][-3:]):
        if len(line.split()) <= 6 and not re.search(r"[\d.:;]", line) and line[:1].isupper() and not FURNITURE.match(line) \
                and not is_note(line):
            return line
    return None


def take(subj, before, style=None):
    """(heading, rule, codes) from the lines above a subject's first course."""
    style = style or {}
    lines = [b.strip() for b in before if b.strip()]
    for line in reversed(lines):
        m = NAMED.match(line)
        if m:
            codes = [c.strip() for c in re.split(r"\s*(?:&|,|/| and )\s*", m.group("codes")) if c.strip()]
            keys = {code_key(c) for c in codes} | {code_key(m.group("codes"))}
            if code_key(subj) in keys:
                return m.group("name").strip(), "named", (codes if code_key(m.group("codes")) != code_key(subj) else [subj])
    for line in reversed(lines[-3:]):
        # A short line in mixed case with no code beside it (Pierce prints "Anatomy", "Cinema"): taken only when
        # the code's letters run through it, so a line of a course description is never read as a heading.
        if not is_caps(line) and len(line.split()) <= 4 and not re.search(r"[\d.:;,]", line) and fits(subj, line) \
                and line[:1].upper() == code_key(subj)[:1] and line[:1].isupper():
            return line, "fits", [subj]
    k = len(lines) - 1
    while k >= 0 and not is_caps(lines[k]) and (is_note(lines[k]) or FURNITURE.match(lines[k]) or ":" in lines[k]):
        k -= 1
    if k < 0 or not is_caps(lines[k]):
        return None, "none", [subj]
    block = [lines[k]]
    while k - 1 >= 0 and is_caps(lines[k - 1]) and len(block) < 3:
        k -= 1
        block.insert(0, lines[k])
    if style.get("department"):
        joined = " ".join(block)
        if DASH.search(joined):
            return DASH.split(joined)[0].strip(), "caps", [subj]
        return block[0].strip(), "caps", [subj]
    return " ".join(block).strip(), "caps", [subj]


def parse_log(text):
    """[{college, url, subjects: [{subj, page, line, before}]}] from a headings read's job log."""
    out, cur, entry = [], None, None
    for raw in text.splitlines():
        line = raw.rstrip("\n")
        m = re.match(r"^college page read: (.+?), \d+ pages", line)
        if m:
            cur = {"college": m.group(1), "urls": [], "subjects": []}
            out.append(cur)
            entry = None
            continue
        if cur is None:
            continue
        if line.startswith("url: "):
            cur["urls"].append(line[5:].strip())
        m = re.match(r"^\[subject (.+?) · page (\d+)\]$", line)
        if m:
            entry = {"subj": m.group(1), "page": int(m.group(2)), "before": [], "line": ""}
            # A source read in parts (El Camino's three) may name a code twice: the first with a heading wins later.
            cur["subjects"].append(entry)
            continue
        if entry is not None and line.startswith("  | "):
            entry["before"].append(line[4:])
        elif entry is not None and line.startswith("  > "):
            entry["line"] = line[4:]
            entry = None
        elif line.startswith("=== COLLEGE PAGE READ JSON"):
            entry = None
    return out


def build(text, run):
    files = {}
    for c in parse_log(text):
        slug = SLUGS.get(c["college"])
        if not slug:
            raise SystemExit("no slug for %r: add it to SLUGS" % c["college"])
        style = STYLE.get(slug)
        by = {}
        section = None      # the last heading a rule took, in page order: the section the next courses sit in
        for s in c["subjects"]:
            heading, rule, codes = take(s["subj"], s["before"], style)
            cand = None
            if heading and rule != "named" and not fits(s["subj"], heading):
                # Capitals above the course that the code's letters do not run through (a C-ID line, another
                # subject's heading): kept for a reviewer, never saved as the title.
                heading, rule, cand = None, "none", heading
            if heading:
                section = heading
            elif section and len(code_key(s["subj"])) >= 4 and code_key(section).startswith(code_key(s["subj"])[:3]) \
                    and fits(s["subj"], section):
                # A code that opens inside another subject's listing (the common course numbers: ENGL C1000
                # among ENGLISH) takes that listing's heading when its letters run through it.
                heading, rule = section, "section"
            if not heading:
                cand = cand or candidate(s["before"])
            rec = {"code": s["subj"], "heading": title_case(heading), "heading_printed": heading, "rule": rule, "codes": codes,
                   "candidate": None if heading else title_case(cand),
                   "page": s["page"], "above": s["before"], "first_course": s["line"]}
            old = by.get(code_key(s["subj"]))
            if old is None or (old["heading"] is None and heading):
                by[code_key(s["subj"])] = rec
        rows = sorted(by.values(), key=lambda r: r["code"])
        files[slug] = {
            "_what": "The subject heading %s's catalog prints above each subject's first course, read for the local "
                     "subject titles (Sam's rule on #3655: a local subject title comes only from the catalog's subject "
                     "heading). Filed by kb/_file_subject_headings.py from a headings read; `heading` is saved in Title Case (Sam, 2026-11-21) with "
                     "`heading_printed` as the catalog prints it; `above` holds the lines as printed, `rule` how the heading was taken (named, caps, fits or none), and `code_fits` whether the code's "
                     "letters run in order through the heading, a second signal that decides nothing." % c["college"],
            "college": c["college"], "run": str(run), "source": sorted(set(c["urls"])),
            "subjects": len(rows), "with_heading": sum(1 for r in rows if r["heading"]),
            "rows": rows,
        }
    return files


LABEL_PART = re.compile(r"(?P<name>[^()]+?)\s*\((?P<codes>[^()]+)\)(?:\s+and\s+|\s*$)")


def index_entries(label):
    """[(name, [codes])] from one index label. "Mathematics (MATH & STAT)" names two codes under one heading;
    "Mathematics (MATH) and Statistics (STAT)" (Monterey Peninsula) is two headings on one page; an ampersand
    or a slash inside a code (A&P, RA&T, ES/A) is part of the code. A label with no code gives nothing."""
    label = " ".join(str(label or "").replace("\u200b", "").split())
    out = []
    for m in LABEL_PART.finditer(label):
        codes = [c.strip() for c in re.split(r"\s+(?:&|or)\s+", m.group("codes")) if c.strip()]
        if codes and all(re.match(r"^[A-Z0-9][A-Z0-9&/_. \-]{0,11}$", c) for c in codes):
            out.append((m.group("name").strip(), codes))
    return out


def build_index(text, run):
    """A college's subject headings from its course-descriptions index: each link's label and its address
    (kb/_college_page_read.py prints "- <label> -> <address>" under the plan's links pattern)."""
    files, cur = {}, None
    for raw in text.splitlines():
        m = re.match(r"^college page read: (.+?), \d+ pages", raw)
        if m:
            cur = {"college": m.group(1), "index": None, "links": []}
            files[m.group(1)] = cur
            continue
        if cur is None:
            continue
        if raw.startswith("url: ") and cur["index"] is None:
            cur["index"] = raw[5:].strip()
        m = re.match(r"^- (.+) -> (https?://\S+)$", raw)
        if m:
            cur["links"].append((m.group(1), m.group(2)))
    out = {}
    for college, c in files.items():
        slug = SLUGS.get(college)
        if not slug:
            raise SystemExit("no slug for %r: add it to SLUGS" % college)
        rows, no_code = [], []
        for label, href in c["links"]:
            clean = " ".join(label.replace("\u200b", "").split())
            got = index_entries(label)
            if not got:
                no_code.append({"label": clean, "address": href})
            for name, codes in got:
                for code in codes:
                    rows.append({"code": code, "heading": title_case(name), "heading_printed": name, "rule": "index",
                                 "codes": codes, "candidate": None, "label": clean, "address": href})
        rows.sort(key=lambda r: r["code"])
        out[slug] = {
            "_what": "The subjects %s's course-descriptions index lists: each subject's heading, its code or codes, and "
                     "the address of its page, as the index links it (Sam's rule on #3655: a local subject title comes "
                     "only from the catalog's subject heading). Filed by kb/_file_subject_headings.py --index; `heading` "
                     "is saved in Title Case with `heading_printed` and the whole `label` as the index prints them. A "
                     "subject's page is read at `address`, never at an address made from its code." % college,
            "college": college, "run": str(run), "source": [c["index"]] if c["index"] else [],
            "subjects": len(rows), "with_heading": sum(1 for r in rows if r["heading"]),
            "links_without_a_code": no_code, "rows": rows,
        }
    return out


def dump(obj):
    return json.dumps(obj, indent=1, ensure_ascii=False) + "\n"


def check(root=ROOT):
    bad = []
    for path in sorted(glob.glob(os.path.join(root, OUT, "*.json"))):
        d = json.load(open(path, encoding="utf-8"))
        rows = d.get("rows") or []
        if not d.get("run") or not d.get("college") or d.get("subjects") != len(rows):
            bad.append("%s: run, college or count" % os.path.basename(path))
        if d.get("with_heading") != sum(1 for r in rows if r.get("heading")):
            bad.append("%s: with_heading" % os.path.basename(path))
        for r in rows:
            if r.get("rule") not in ("named", "caps", "fits", "section", "index", "code_address", "search_page", "schedule", "none") or bool(r.get("heading")) != (r.get("rule") != "none"):
                bad.append("%s: %s rule" % (os.path.basename(path), r.get("code")))
    return bad


def main(argv):
    ap = argparse.ArgumentParser()
    ap.add_argument("log", nargs="?")
    ap.add_argument("--run")
    ap.add_argument("--index", action="store_true", help="the log is an index read: each link's label and address")
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args(argv)
    if a.check:
        bad = check()
        for b in bad:
            print("FAIL " + b)
        print("subject headings files: %s" % ("ok" if not bad else "%d problem(s)" % len(bad)))
        return 1 if bad else 0
    if not a.log or not a.run:
        ap.error("a log and --run")
    files = (build_index if a.index else build)(open(a.log, encoding="utf-8").read(), a.run)
    for slug, d in sorted(files.items()):
        rules = {}
        for r in d["rows"]:
            rules[r["rule"]] = rules.get(r["rule"], 0) + 1
        print("%-34s %3d subjects, %3d with a heading %s, %d more with a candidate" % (
            slug, d["subjects"], d["with_heading"], rules, sum(1 for r in d["rows"] if not r["heading"] and r["candidate"])))
        if a.write:
            os.makedirs(os.path.join(ROOT, OUT), exist_ok=True)
            with open(os.path.join(ROOT, OUT, slug + ".json"), "w", encoding="utf-8") as f:
                f.write(dump(d))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

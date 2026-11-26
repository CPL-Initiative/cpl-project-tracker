#!/usr/bin/env python3
"""LACCD's class schedule search, read for local subject titles: a runner's log -> one title hunt find per college (S736).

WHY. Sam, 2026-11-26 (r-schedule-tool-first-for-subject-titles-sam-2026-11-26): read each college's class schedule
search for its local subject titles before guessing one. The Los Angeles Community College District's PeopleSoft guest
class search opens a "select subject" lookup that lists, letter by letter, every subject code beside its title
(A S L, American Sign Language; OLD ADL, Older Adults). The lookup is the district's (Institution LACCD), so one table
titles all nine colleges. kb/college_reads/laccd_schedule_subjects.json is the read; the runner's log carries it.

WHAT IT WRITES. kb/subject_title_hunt/found/<slug>.json for each of the nine colleges: a title for each code the college
holds (a row of kb/status/local_subject_titles.json), with its source (the search's results address for that code at
that campus, which prints "Course Subject: <title>"), where (class schedule), method (subject lookup), the date and the
finder. kb/_file_found_subject_titles.py then files them; a heading already filed, from the catalog or a person, stands,
and a person's saved decision wins in the Subjects build whatever is filed (kb/subject_decisions.py). A code the lookup
lists under two titles, or one the college does not hold, is never filed.

Usage:  python3 kb/_laccd_schedule_subjects.py LOG RUN_ID [--read-at YYYY-MM-DD]
Pure stdlib, no network.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from _file_found_subject_titles import code_key  # noqa: E402

FOUND = os.path.join(ROOT, "kb", "subject_title_hunt", "found")
TITLES = os.path.join(ROOT, "kb", "status", "local_subject_titles.json")
PLAN = "kb/college_reads/laccd_schedule_subjects.json"
TERM = "2268"
SEARCH = ("https://mycollege-guest.laccd.edu/psc/classsearchguest/EMPLOYEE/HRMS/c/COMMUNITY_ACCESS.CLASS_SEARCH.GBL"
          "?Campus={campus}&strm={term}&subj={subj}&")
# The search's Campus list (probe 1, run 45867183517): each college's code, as the search takes it.
CAMPUS = {"los_angeles_city": ("LACC", "Los Angeles City College"),
          "east_los_angeles": ("ELAC", "East Los Angeles College"),
          "los_angeles_harbor": ("LAHC", "Los Angeles Harbor College"),
          "los_angeles_mission": ("LAMC", "Los Angeles Mission College"),
          "los_angeles_pierce": ("LAPC", "Los Angeles Pierce College"),
          "los_angeles_southwest": ("LASC", "Los Angeles Southwest College"),
          "los_angeles_trade_technical": ("LATTC", "Los Angeles Trade-Technical College"),
          "los_angeles_valley": ("LAVC", "Los Angeles Valley College"),
          "west_los_angeles": ("WLAC", "West Los Angeles College")}
LOG_PREFIX = re.compile(r"^.*?\d{4}-\d\d-\d\dT[\d:.]+Z ?")


def log_lines(text):
    """A job log's lines without the runner's job, step and timestamp columns."""
    return [LOG_PREFIX.sub("", ln, count=1) for ln in text.splitlines()]


def lookup_pairs(lines):
    """(code, title) for every subject the lookup pages print. A page's text reads 'Select a Subject · CODE · Title ·
    Select · CODE · Title · Select · … · Close'; the reader folds short lines with ' · ' and keeps a long one whole, so
    the parse splits on both. A code and its title always come just before a 'Select'."""
    pairs, page = [], []
    for ln in lines + ["##### PAGE end"]:
        if ln.startswith("##### PAGE") or ln.startswith("=== COLLEGE PAGE READ JSON"):
            body = " · ".join(page)
            if "Select a Subject" in body:
                toks = [t.strip() for t in re.split(r" · |\n", body.split("Select a Subject", 1)[1])]
                toks = [t for t in toks if t]
                for i, t in enumerate(toks):
                    if t == "Select" and i >= 2 and toks[i - 2] != "Select" and toks[i - 1] != "Select":
                        pairs.append((toks[i - 2], toks[i - 1]))
            page = []
            continue
        page.append(ln)
    return pairs


def district_table(pairs):
    """code key -> (code, title); a code printed under two titles maps to None, for a person."""
    out = {}
    for code, title in pairs:
        k = code_key(code)
        if not k:
            continue
        if k in out and out[k] and out[k][1] != title:
            out[k] = None
        elif k not in out:
            out[k] = (code, title)
    return out


def college_codes(titles):
    cols = titles["columns"]
    i = cols.index("code")
    return {c["slug"]: [r[i] for r in c.get("rows") or []] for c in titles.get("colleges") or [] if c["slug"] in CAMPUS}


def finds(table, codes, run, read_at):
    out = {}
    for slug, (campus, college) in CAMPUS.items():
        rows = []
        for code in codes.get(slug) or []:
            hit = table.get(code_key(code))
            if not hit:
                continue
            rows.append({"code": code, "title": hit[1], "printed_code": hit[0],
                         "url": SEARCH.format(campus=campus, term=TERM, subj=hit[0].replace(" ", "%20")),
                         "where": "class schedule", "method": "subject lookup", "rule": "schedule", "found_on": read_at,
                         "found_by": "COBI, a runner read of LACCD's class search (run %s)" % run})
        held = len(codes.get(slug) or [])
        out[slug] = {"college": college, "campus": campus, "term": TERM, "catalog_year": None,
                     "read_at": read_at + "T00:00:00Z", "run": str(run), "plan": PLAN,
                     "source": "LACCD's class schedule search (PeopleSoft guest), its select subject lookup",
                     "district_subjects": sum(1 for v in table.values() if v), "codes_held": held,
                     "titles": rows, "not_read": None if rows else "no code the college holds is in the lookup"}
    return out


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 2
    log, run = argv[0], argv[1]
    read_at = argv[argv.index("--read-at") + 1] if "--read-at" in argv else None
    with open(log, encoding="utf-8", errors="replace") as f:
        lines = log_lines(f.read())
    if not read_at:
        m = next((re.search(r"(\d{4}-\d\d-\d\d)T", ln) for ln in open(log, encoding="utf-8", errors="replace")), None)
        read_at = m.group(1) if m else None
    pairs = lookup_pairs(lines)
    table = district_table(pairs)
    with open(TITLES, encoding="utf-8") as f:
        codes = college_codes(json.load(f))
    out = finds(table, codes, run, read_at)
    os.makedirs(FOUND, exist_ok=True)
    split = sum(1 for v in table.values() if v is None)
    print("lookup: %d lines read, %d subjects, %d printed under two titles" % (len(pairs), len(table), split))
    for slug, d in out.items():
        with open(os.path.join(FOUND, slug + ".json"), "w", encoding="utf-8") as f:
            json.dump(d, f, indent=1, ensure_ascii=False)
            f.write("\n")
        print("%-30s %s  held %3d  titled by the lookup %3d" % (slug, d["campus"], d["codes_held"], len(d["titles"])))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

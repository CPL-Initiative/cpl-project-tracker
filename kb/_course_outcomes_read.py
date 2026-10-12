#!/usr/bin/env python3
"""Course outcomes read: each course's SLOs, exactly as printed, from its public outline.

Sam, Open Asks Sheet 70 card 3 (2026-10-12 20:42Z): "Every course in the loaded
records". The harvest reads each course's student learning outcomes exactly as
printed and keeps them by college and course; they are what the industry
credential skills get matched against, and what faculty read when they assess a
CPL request. The course outline index (kb/_course_outline_index.py) names each
course's public outline report; this script opens those reports.

It reads the courses the loaded program records name at the host's colleges
(record_codes), looks each one up in the newest index file for the host, and opens
the outline report with the census's polite Reader (robots first, a delay before
every load, the user agent that names the CPL Initiative). Pages only; no model
call, no table write.

--trial N: N reports spread across the subjects, each page's whole text and its
HTML filed under kb/course_outcomes/trial_<run>/, so the parser is written against
what the host prints rather than a guess.

--part I --of N: the I-th of N slices of the wanted courses, in code order. The
result is filed as kb/course_outcomes/<host>/read_<run>_p<I>of<N>.json, written
every SAVE_EVERY loads so a slice that runs out of time keeps what it read.

Usage (runner): python3 kb/_course_outcomes_read.py --index kb/course_outline_index/index_38313849383.json --trial 12
                python3 kb/_course_outcomes_read.py --index ... --part 1 --of 4
"""
from __future__ import annotations

import argparse
import gzip
import hashlib
import importlib.util
import json
import os
import re
import sys
import urllib.parse
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "course_outcomes")
SAVE_EVERY = 25


def _load(name: str, file: str):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, file))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# The census holds the polite Reader and the line-start SLO heading rule; the index
# holds norm_code and record_codes. One copy of each.
census = _load("program_source_census", "_program_source_census.py")
cor = _load("course_outline_census", "_course_outline_census.py")
index_mod = _load("course_outline_index", "_course_outline_index.py")

# The page's whole text (the Reader keeps 6,000 characters; an outline's outcomes
# often sit past that).
FULL_BODY_JS = cor.FULL_BODY_JS

# The outline's own section headings: the outcomes end where the next one starts.
STOP = re.compile(
    r"^[ \t]*(course content|content|lecture content|lab(oratory)? content|course objectives|objectives|"
    r"methods? of (instruction|evaluation)|instructional methods|assignments|out[- ]of[- ]class|"
    r"(representative |required )?text(book)?s?|instructional materials|other materials|supplies|"
    r"course description|catalog description|schedule description|requisites?|prerequisites?|corequisites?|"
    r"advisor(y|ies)|entrance skills|distance education|repeatability|grading|units|hours|"
    r"discipline|minimum qualifications|library|approvals?|effective|course outline)\b[^\n]{0,60}:?[ \t]*$",
    re.I | re.M)
# A list marker the outline prints before an outcome: 1. 1) a. a) • - – *
MARKER = re.compile(r"^[ \t]*(?:\(?\d{1,2}[.)]|\(?[a-zA-Z][.)]|[•●▪·\-–*])[ \t]+")
# The lead-in a college prints between the heading and the list.
LEAD = re.compile(r"(upon (successful )?completion|students? (will|should) be able|by the end of)[^\n]*",
                  re.I)


def outcomes_of(text: str) -> dict:
    """The outcomes block as printed: the heading line, the lead-in, and each outcome
    with only its list marker removed. shape is list, paragraph or none."""
    m = cor.SLO_HEADING.search(text or "")
    if not m:
        return {"shape": "none", "heading": None, "lead": None, "outcomes": []}
    start = text.rfind("\n", 0, m.start()) + 1
    lines = text[start:].split("\n")
    heading = lines[0].strip()
    lead, items, rest = None, [], lines[1:]
    lm = LEAD.search(heading)
    if lm:
        lead = heading[lm.start():].strip()
        heading = heading[:lm.start()].strip(" :") or heading
    for line in rest[:200]:
        s = line.strip()
        if not s:
            continue
        if STOP.match(s) or cor.SLO_HEADING.match(s) and items:
            break
        if lead is None and not items and LEAD.match(s):
            lead = s
            continue
        items.append(MARKER.sub("", s, count=1).strip())
    items = [x for x in items if x]
    shape = "list" if len(items) > 1 else ("paragraph" if items else "none")
    return {"shape": shape, "heading": heading, "lead": lead, "outcomes": items}


def fingerprint(outcomes: list[str]) -> str:
    return hashlib.md5(json.dumps(outcomes, ensure_ascii=False).encode()).hexdigest()


def host_slug(url: str) -> str:
    return urllib.parse.urlparse(url).netloc.split(".")[0].lower()


def wanted_courses(index: dict, slugs: list[str]) -> list[dict]:
    """Each course the loaded records name that has an outline report, once, with the
    colleges (by slug) whose records name it."""
    by_code: dict[str, list[str]] = {}
    for slug, codes in index_mod.record_codes(slugs).items():
        for c in codes:
            by_code.setdefault(c, []).append(slug)
    out = []
    for code in sorted(by_code):
        entries = index["index"].get(code) or []
        reports = [r for e in entries for r in e.get("reports") or []]
        if reports:
            out.append({"code": code, "title": entries[0].get("title"), "course_id": entries[0].get("course_id"),
                        "report": reports[0], "named_by": sorted(by_code[code])})
    return out


def read_one(reader, course: dict) -> dict:
    page = cor.load_full(reader, course["report"])
    body = page.get("body") or ""
    got = outcomes_of(body)
    return {**course, "status": page.get("status"), "final_url": page.get("final_url"),
            "access": cor.access_of(page), "title_printed": (page.get("title") or "")[:160],
            "chars": len(body), **got, "fingerprint": fingerprint(got["outcomes"]) if got["outcomes"] else None}


def spread(items: list, n: int) -> list:
    """n items spread across the list (one per subject where it can)."""
    if n >= len(items):
        return items
    by_subject: dict[str, dict] = {}
    for it in items:
        by_subject.setdefault(it["code"].split(" ")[0], it)
    firsts = list(by_subject.values())
    step = max(1, len(firsts) // n)
    return firsts[::step][:n]


def summarize(rows: list[dict]) -> dict:
    shapes: dict[str, int] = {}
    for r in rows:
        shapes[r.get("shape") or "unread"] = shapes.get(r.get("shape") or "unread", 0) + 1
    return {"read": len(rows), "shapes": shapes,
            "status_not_200": sum(1 for r in rows if r.get("status") != 200),
            "outcomes": sum(len(r.get("outcomes") or []) for r in rows)}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--index", required=True, help="kb/course_outline_index/index_<run>.json")
    ap.add_argument("--slugs", default="riverside_city,moreno_valley,norco")
    ap.add_argument("--trial", type=int, default=0)
    ap.add_argument("--part", type=int, default=1)
    ap.add_argument("--of", type=int, default=1)
    ap.add_argument("--delay", type=int, default=int(os.environ.get("CENSUS_DELAY_MS", "3000")))
    a = ap.parse_args(argv)
    index = json.load(open(a.index))
    courses = wanted_courses(index, [s for s in a.slugs.split(",") if s])
    if a.trial:
        todo = spread(courses, a.trial)
    else:
        todo = [c for i, c in enumerate(courses) if i % a.of == a.part - 1]
    run = os.environ.get("GITHUB_RUN_ID", "local")
    host = host_slug(index["url"])
    print("wanted %d courses with an outline; this run reads %d" % (len(courses), len(todo)), flush=True)

    out_dir = os.path.join(OUT_DIR, "trial_%s" % run) if a.trial else os.path.join(OUT_DIR, host)
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, "read.json" if a.trial else "read_%s_p%dof%d.json" % (run, a.part, a.of))
    head = {"run": run, "index": os.path.relpath(a.index, os.path.dirname(HERE)), "host": index["url"],
            "slugs": a.slugs, "part": a.part, "of": a.of, "wanted": len(courses), "slice": len(todo)}
    rows: list[dict] = []

    def save(done: bool):
        out = {**head, "at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "complete": done,
               "summary": summarize(rows), "rows": rows}
        with open(path, "w") as f:
            json.dump(out, f, indent=1, ensure_ascii=False)

    from playwright.sync_api import sync_playwright  # runner only
    with sync_playwright() as p:
        browser = p.chromium.launch()
        probe = browser.new_page()
        ua = probe.evaluate("navigator.userAgent").replace("HeadlessChrome", "Chrome")
        probe.close()
        ctx = browser.new_context(user_agent=ua + " " + census.UA_SUFFIX, accept_downloads=False)
        reader = census.Reader(ctx.new_page(), ctx.request, a.delay)
        for n, course in enumerate(todo, 1):
            row = read_one(reader, course)
            rows.append(row)
            print("%4d %-10s %s %-9s %d" % (n, course["code"], row["status"], row["shape"], len(row["outcomes"])),
                  flush=True)
            if a.trial:
                stem = re.sub(r"[^A-Za-z0-9]+", "_", course["code"])
                with open(os.path.join(out_dir, stem + ".txt"), "w") as f:
                    f.write(reader.page.evaluate(FULL_BODY_JS) or "")
                with gzip.open(os.path.join(out_dir, stem + ".html.gz"), "wt") as f:
                    f.write(reader.page.content())
            if n % SAVE_EVERY == 0:
                save(False)
        browser.close()
    save(True)
    print(json.dumps(summarize(rows), indent=1))
    print("wrote", os.path.relpath(path, os.path.dirname(HERE)))
    return 0


if __name__ == "__main__":
    sys.exit(main())

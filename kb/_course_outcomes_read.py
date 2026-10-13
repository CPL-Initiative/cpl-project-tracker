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
import html.parser
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
# The SLO heading proper. RCCD prints Course Objectives first, under the same
# lead-in ("Upon successful completion of the course, students should be able to
# demonstrate the following activities:"), so the lead-in alone is no SLO heading
# (S374 trial 38317539422 read the objectives that way on all twelve pages).
SLO_TITLE = re.compile(r"^[ \t]*(student|course) learning outcomes?\b", re.I | re.M)
# A list marker the outline prints before an outcome: 1. 1) a. a) • - – *
MARKER = re.compile(r"^[ \t]*(?:\(?\d{1,2}[.)]|\(?[a-zA-Z][.)]|[\u2022\u25cf\u25aa\u00b7\-\u2013*])[ \t]+")
# The lead-in a college prints between the heading and the list.
LEAD = re.compile(r"(upon (successful )?completion|students? (will|should) be able|by the end of)[^\n]*",
                  re.I)
# The colleges an RCCD integrated outline names as offering the course.
OFFERED = re.compile(r"^College:[ \t]*\n((?:[ \t]*[A-Z]{3}[ \t]*\n)+)", re.M)


def _ws(text: str) -> str:
    """Rendered text: whitespace runs (and no-break spaces) print as one space."""
    return re.sub(r"\s+", " ", (text or "").replace("\xa0", " ")).strip()


class _Node:
    def __init__(self, tag, attrs, parent):
        self.tag, self.attrs, self.parent, self.kids = tag, dict(attrs), parent, []

    def text(self, skip=()) -> str:
        out = []
        for k in self.kids:
            if isinstance(k, str):
                out.append(k)
            elif k.tag not in skip:
                out.append(" " if k.tag == "br" else "")
                out.append(k.text(skip))
        return "".join(out)

    def find(self, pred):
        for k in self.kids:
            if not isinstance(k, str):
                if pred(k):
                    yield k
                yield from k.find(pred)


VOID = {"br", "img", "hr", "meta", "link", "input", "col", "area", "base", "source", "wbr"}


class _Tree(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = _Node("#root", [], None)
        self.cur = self.root

    def handle_starttag(self, tag, attrs):
        node = _Node(tag, attrs, self.cur)
        self.cur.kids.append(node)
        if tag not in VOID:
            self.cur = node

    def handle_startendtag(self, tag, attrs):
        self.cur.kids.append(_Node(tag, attrs, self.cur))

    def handle_endtag(self, tag):
        n = self.cur
        while n is not self.root and n.tag != tag:
            n = n.parent
        if n is not self.root:
            self.cur = n.parent

    def handle_data(self, data):
        self.cur.kids.append(data)


def outcomes_from_html(page_html: str) -> dict | None:
    """The SLO block of a curriQunet integrated outline (RCCD's report 97): the area
    whose sub-title reads Student (or Course) Learning Outcomes; the lead-in printed
    before its list; each top-level item's own text as printed; and the institutional
    outcomes an item maps to (the nested list RCCD prints under it) as maps_to.
    None when the page has no such area, so the text reader takes over."""
    tree = _Tree()
    tree.feed(page_html or "")
    for title in tree.root.find(lambda n: "subTitle" in (n.attrs.get("class") or "")):
        heading = _ws(title.text())
        if not SLO_TITLE.match(heading):
            continue
        area = title.parent
        lead_parts, lists = [], []
        seen_title = False
        for k in area.kids:
            if k is title:
                seen_title = True
                continue
            if not seen_title:
                continue
            if isinstance(k, str):
                if not lists:
                    lead_parts.append(k)
            elif k.tag in ("ol", "ul"):
                lists.append(k)
            elif not lists and k.tag not in ("br",):
                lead_parts.append(k.text())
        items, maps = [], []
        for lst in lists[:1]:
            for li in [k for k in lst.kids if not isinstance(k, str) and k.tag == "li"]:
                own = _ws(li.text(skip=("ol", "ul")))
                if not own:
                    continue
                items.append(MARKER.sub("", own, count=1).strip())
                nested = [_ws(x.text()) for x in li.find(lambda n: n.tag == "li")]
                maps.append([x for x in nested if x])
        lead = _ws(" ".join(lead_parts)) or None
        if not items and lead and not LEAD.match(lead):
            items, lead = [lead], None
        shape = "list" if len(items) > 1 else ("paragraph" if items else "none")
        return {"shape": shape, "heading": heading.rstrip(":").strip(), "lead": lead, "outcomes": items,
                "maps_to": maps if any(maps) else None, "parsed_from": "html"}
    return None


def _has_class(node, name: str) -> bool:
    return name in (node.attrs.get("class") or "").split()


def _field_part(field, name: str):
    return next(iter(field.find(lambda n: _has_class(n, name))), None)


def groups_from_html(page_html: str) -> list[dict] | None:
    """Each college's SLOs in a curriQunet All Fields report (SDCCD's report 4, trial
    38350787486): the section headed Student Learning Outcomes holds a list whose
    entries are groups. A group's own panel names it (Group Title: City, Mesa, Miramar)
    and may carry an Outcome Text of its own; its child entries each hold an Outcome
    Text and a list of the institutional outcomes it maps to. Each group is kept with
    its own outcomes as printed, an empty field skipped (PHOT 100 prints one ahead of
    its title). The Student Learning Objectives printed after the section are never
    read (SDCCD's Course Outline Report, 493, prints those alone). None when the page
    has no such section; an empty list when the section holds no group."""
    tree = _Tree()
    tree.feed(page_html or "")

    def kids(node, cls):
        return [k for k in node.kids if not isinstance(k, str) and _has_class(k, cls)]

    def fields(node, label):
        out = []
        for f in node.find(lambda n: _has_class(n, "iq-data-field")):
            lab, val = _field_part(f, "field-label"), _field_part(f, "field-value")
            if lab and _ws(lab.text()) == label:
                out.append(_ws(val.text()) if val else "")
        return out

    def ilos(node):
        lists = list(node.find(lambda n: _has_class(n, "iq-bridge-list")))
        return [x for b in lists[:1] for x in (_ws(k.text()) for k in b.kids if not isinstance(k, str)) if x]

    for h3 in tree.root.find(lambda n: n.tag == "h3" and SLO_TITLE.match(_ws(n.text()))):
        section = h3
        while section is not None and not _has_class(section, "meta-section"):
            section = section.parent
        if section is None:
            continue
        top = next(iter(section.find(lambda n: _has_class(n, "iq-data-list"))), None)
        groups = []
        for entry in kids(top, "iq-list-entry") if top is not None else []:
            own = kids(entry, "iq-panel")
            title = [t for p in own for t in fields(p, "Group Title")]
            items, maps = [], []
            for p in own:
                for text in fields(p, "Outcome Text"):
                    if text:
                        items.append(text)
                        maps.append([])
            for box in kids(entry, "iq-list-children"):
                for child in kids(box, "iq-list-entry"):
                    for text in fields(child, "Outcome Text"):
                        if text:
                            items.append(text)
                            maps.append(ilos(child))
            groups.append({"group": title[0] if title else None, "heading": "Student Learning Outcomes",
                           "lead": None, "outcomes": items, "maps_to": maps if any(maps) else None,
                           "shape": "list" if len(items) > 1 else ("paragraph" if items else "none"),
                           "fingerprint": fingerprint(items) if items else None})
        return groups
    return None


def outcomes_of(text: str) -> dict:
    """The outcomes block as printed in the page's text, when the HTML reader finds
    no SLO area: the SLO heading proper first, the lead-in alone only on a page with
    no SLO heading and no objectives section before it."""
    m = SLO_TITLE.search(text or "")
    if not m:
        m = cor.SLO_HEADING.search(text or "")
        before = (text or "")[:m.start()] if m else ""
        last = [ln.strip() for ln in before.split("\n") if ln.strip()][-1:] if m else []
        if not m or (last and re.match(r"((course|student learning) )?objectives|entrance skills", last[0], re.I)):
            return {"shape": "none", "heading": None, "lead": None, "outcomes": [], "maps_to": None,
                    "parsed_from": "text"}
    start = text.rfind("\n", 0, m.start()) + 1
    lines = text[start:].split("\n")
    heading = lines[0].strip()
    lead, items = None, []
    lm = LEAD.search(heading)
    if lm:
        lead = heading[lm.start():].strip()
        heading = heading[:lm.start()].strip(" :") or heading
    for line in lines[1:200]:
        s = line.strip()
        if not s:
            continue
        if STOP.match(s) or (SLO_TITLE.match(s) and items):
            break
        if lead is None and not items and LEAD.match(s):
            lead = s
            continue
        items.append(MARKER.sub("", s, count=1).strip())
    items = [x for x in items if x]
    shape = "list" if len(items) > 1 else ("paragraph" if items else "none")
    return {"shape": shape, "heading": heading.rstrip(":").strip(), "lead": lead, "outcomes": items,
            "maps_to": None, "parsed_from": "text"}


def offered_at(text: str) -> list[str] | None:
    """The college codes an integrated outline prints under College: (RIV, MOV, NOR)."""
    m = OFFERED.search(text or "")
    return [x.strip() for x in m.group(1).split("\n") if x.strip()] if m else None


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


def parse_page(page_html: str, text: str) -> dict:
    """The outcomes a page prints: each college's group (SDCCD's All Fields report), else
    the SLO area of an integrated outline (RCCD), else the text reader."""
    groups = groups_from_html(page_html)
    if groups is not None:
        found = [g for g in groups if g["outcomes"]]
        return {"shape": "groups" if found else "none", "heading": "Student Learning Outcomes", "lead": None,
                "outcomes": [], "maps_to": None, "groups": groups, "parsed_from": "html",
                "fingerprint": None}
    got = outcomes_from_html(page_html) or outcomes_of(text)
    return {**got, "fingerprint": fingerprint(got["outcomes"]) if got["outcomes"] else None}


def read_one(reader, course: dict) -> dict:
    page = cor.load_full(reader, course["report"])
    body = page.get("body") or ""
    got = parse_page(page.get("html") or "", body)
    return {**course, "status": page.get("status"), "final_url": page.get("final_url"),
            "access": cor.access_of(page), "title_printed": (page.get("title") or "")[:160],
            "chars": len(body), "offered_at": offered_at(body), **got}


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
            "outcomes": sum(len(r.get("outcomes") or []) for r in rows)
                        + sum(len(g["outcomes"]) for r in rows for g in r.get("groups") or [])}


def reparse(folder: str) -> int:
    """A trial's rows parsed again from the pages it filed, with no load: the parser
    is checked against what the host printed, and the filed rows say which parser
    read them."""
    path = os.path.join(folder, "read.json")
    d = json.load(open(path))
    for row in d["rows"]:
        stem = re.sub(r"[^A-Za-z0-9]+", "_", row["code"])
        page_html = gzip.open(os.path.join(folder, stem + ".html.gz"), "rt").read()
        text = open(os.path.join(folder, stem + ".txt")).read()
        row.pop("groups", None)
        row.update(parse_page(page_html, text), offered_at=offered_at(text))
    d["summary"] = summarize(d["rows"])
    d["reparsed_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    d["reparsed_note"] = ("The filed pages parsed again by parse_page, the read's own parser at the time of the "
                          "reparse (S374: RCCD's objectives read as SLOs; S376: SDCCD's groups by college).")
    with open(path, "w") as f:
        json.dump(d, f, indent=1, ensure_ascii=False)
    print(json.dumps(d["summary"], indent=1))
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--index", default="", help="kb/course_outline_index/index_<run>.json")
    ap.add_argument("--slugs", default="riverside_city,moreno_valley,norco")
    ap.add_argument("--trial", type=int, default=0)
    ap.add_argument("--part", type=int, default=1)
    ap.add_argument("--of", type=int, default=1)
    ap.add_argument("--delay", type=int, default=int(os.environ.get("CENSUS_DELAY_MS", "3000")))
    ap.add_argument("--reparse", default="", help="a trial folder: parse its filed pages again, no load")
    a = ap.parse_args(argv)
    if a.reparse:
        return reparse(a.reparse)
    if not a.index:
        ap.error("--index FILE (or --reparse FOLDER)")
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
            "system": cor.system_of(index["url"]) or "other",
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

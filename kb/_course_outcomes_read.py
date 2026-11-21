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
                python3 kb/_course_outcomes_read.py --catalog cabrillo --trial 12   (course pages by code: no index)
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
    r"^[ \t]*(course content|contents?|lecture content|lab(oratory)? content|(specific )?course objectives|objectives|"
    r"methods? of (instruction|evaluation)|instructional methods|assignments|out[- ]of[- ]class|"
    r"(representative |required )?text(book)?s?|instructional materials|other materials|supplies|"
    r"course description|catalog description|schedule description|requisites?|prerequisites?|corequisites?|"
    r"advisor(y|ies)|entrance skills|distance education|repeatability|grading|units|hours|"
    r"discipline|minimum qualifications|library|approvals?|effective|course outline)\b[^\n]{0,60}:?[ \t]*$",
    re.I | re.M)
# City College of San Francisco's report 28 prints CONTENTS after its STUDENT LEARNING OUTCOMES (COBIx's read of AAPS
# 100, #3533): the plural is a heading too, or every CCSF page files it as its last outcome (S690).
# The SLO heading proper. RCCD prints Course Objectives first, under the same
# lead-in ("Upon successful completion of the course, students should be able to
# demonstrate the following activities:"), so the lead-in alone is no SLO heading
# (S374 trial 38317539422 read the objectives that way on all twelve pages).
# Chabot's All Fields report (347) numbers it as a field of its Assignments section, "3. Student Learning
# Outcomes", after its "Measurable Objectives:" section; without the number the old rule fell back to the lead-in and
# filed Chabot's objectives as its SLOs (full read 44264136885, all 1,013 rows; S681).
SLO_TITLE = re.compile(r"^[ \t]*(?:\d{1,2}[.)][ \t]+)?(student|course) learning outcomes?\b", re.I | re.M)
# The number a heading carries in front of it (Chabot's "3. "), never part of the heading as filed.
HEAD_NUMBER = re.compile(r"^[ \t]*\d{1,2}[.)][ \t]+")
# A list marker the outline prints before an outcome: 1. 1) a. a) • - – *
MARKER = re.compile(r"^[ \t]*(?:\(?\d{1,2}[.)]|\(?[a-zA-Z][.)]|[\u2022\u25cf\u25aa\u00b7\-\u2013*])[ \t]+")
# The lead-in a college prints between the heading and the list. Las Positas prints "Upon the completion of this
# course, the student should be able to:" (S664: 505 live SLO rows had filed it as their first outcome).
LEAD = re.compile(r"(upon (the )?(successful )?completion|at the conclusion of|students? (will|should) be able|by the end of)[^\n]*",
                  re.I)
# The column header a report's SLO table prints above its rows, a line of its own that is never an outcome (S689).
# Feather River's report 485 prints "Learning Outcomes" under its Student Learning Outcomes heading (read 44535960153
# filed it as 336 of its 2,072 SLOs, one per page); Palomar's report 99 prints "Outcome" (trial 44536105509, 12 of 12).
SLO_COLUMN_HEAD = re.compile(r"^(?:(?:student|course) )?(?:learning )?outcomes?:?$", re.I)
# How a lead-in line ends: a colon, or "able to" / "the following" with no outcome after it. A line that LEAD starts
# and that goes on to state the outcome is the first outcome (Feather River's PHSC 120 prints "Students will be able
# to explain in general terms the evolution and life cycles of stars..." as its first SLO, trial 44534888428).
LEAD_ENDS = re.compile(r"(?::|\b(?:able to|the following))[ \t]*$", re.I)
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
        if top is None:
            # Not a grouped report: the heading's section holds the heading alone and the outcomes follow
            # in plain fields (Santa Ana's report 267, trial 41436124244). The text reader takes over, also
            # when another section of the page holds a data list (Cuesta's All Fields outline, trial
            # 42573515439: 12 pages printed SLOs and all 12 read as none, S616).
            return None
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


def _heads_section(text: str, m) -> bool:
    """Whether an SLO_TITLE match heads the section: the line ends at the heading, goes on after a colon, or goes on
    with a lead-in. A line that goes on with other words names something else: Feather River's ENVR 241 prints
    "Student Learning Outcome Pre-test;" in its course content, above the section (read 44535960153, S689)."""
    end = text.find("\n", m.end())
    rest = text[m.end():end if end >= 0 else len(text)].strip()
    rest = re.sub(r"^\(s\)", "", rest).strip()
    return not rest or rest.startswith(":") or bool(LEAD.match(rest))


def outcomes_of(text: str) -> dict:
    """The outcomes block as printed in the page's text, when the HTML reader finds
    no SLO area: the SLO heading proper first, the lead-in alone only on a page with
    no SLO heading and no objectives section before it."""
    found = list(SLO_TITLE.finditer(text or ""))
    m = next((x for x in found if _heads_section(text, x)), found[0] if found else None)
    if not m:
        m = cor.SLO_HEADING.search(text or "")
        before = (text or "")[:m.start()] if m else ""
        last = [ln.strip() for ln in before.split("\n") if ln.strip()][-1:] if m else []
        if not m or (last and re.match(r"((course|student learning|measurable) )?objectives|entrance skills", last[0],
                                       re.I)):
            return {"shape": "none", "heading": None, "lead": None, "outcomes": [], "maps_to": None,
                    "parsed_from": "text"}
    start = text.rfind("\n", 0, m.start()) + 1
    lines = text[start:].split("\n")
    heading = HEAD_NUMBER.sub("", lines[0].strip(), count=1)
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
        if SLO_COLUMN_HEAD.match(s):
            continue
        if lead is None and not items and LEAD.match(s) and LEAD_ENDS.search(s):
            lead = s
            continue
        items.append(MARKER.sub("", s, count=1).strip())
    items = [x for x in items if x]
    shape = "list" if len(items) > 1 else ("paragraph" if items else "none")
    return {"shape": shape, "heading": heading.rstrip(":").strip(), "lead": lead, "outcomes": items,
            "maps_to": None, "parsed_from": "text"}


# Course objectives (Sam, 2026-11-02, S551: "we should grab course objectives and store them as well. They are often
# richer descriptions of course content than any other element of the COR"). The heading as each host prints it:
# RCCD and Las Positas "Course Objectives:", Santa Ana and the Coast district "Course Objectives", SDCCD's outline
# report "STUDENT LEARNING OBJECTIVES:" and its All Fields report "Student Learning Objectives" with a field label
# "Objective Text" before each item. Chabot's All Fields report (347) prints "Measurable Objectives:" (S681). Palomar's
# report 99 prints "Specific Course Objectives" right after its SLOs, then an "Objective" column header (S689).
OBJ_TITLE = re.compile(r"^[ \t]*(course|specific course|student learning|learning|performance|measurable)? ?objectives"
                       r"[ \t]*:?[ \t]*$", re.I)
# A field label a report prints before each item, never an objective itself.
OBJ_LABEL = re.compile(r"^(objective text|objective)$", re.I)
# The same label printed inline, before the objective on its own line (Cuesta).
OBJ_INLINE = re.compile(r"^objective\s+(?=\S)", re.I)
# Section headings the outcomes' STOP list does not name, where the objectives end: SDCCD's outline report goes on
# to "Section II" and "1. COURSE OUTLINE AND SCOPE:", its All Fields report to "Disciplines" and "Minimum
# Qualification".
OBJ_STOP = re.compile(r"^(section [ivx\d]+|disciplines?|minimum qualifications?|course outline and scope:?)$", re.I)

# What is collected from every course outline of record, in the one pass (Sam, 2026-11-13: "add objectives to the
# collection list of data from cors. they should be collected when slos are collected"). parse_page files both on
# every read path; a read's head carries this list, and the loader posts each as its own course_outcomes.kind.
COR_COLLECTS = ("slo", "objective")
# Whether each outline system's public page prints a Course Objectives section: kb/_objectives_by_system.py holds it,
# the one source the College Data Collection builder reads too (S650, COBIx on #3286). Never a copy here.
_OBJ_RECORD = _load("objectives_by_system", "_objectives_by_system.py")
OBJECTIVES_BY_SYSTEM = _OBJ_RECORD.OBJECTIVES_BY_SYSTEM
# A report whose template prints no objectives section (Feather River's 485): the same one source, never a copy.
prints_objectives = _OBJ_RECORD.prints_objectives
NO_OBJECTIVES = {"objectives": [], "objectives_heading": None, "objectives_lead": None, "objectives_fingerprint": None}


def _obj_ends(s: str) -> bool:
    bare = MARKER.sub("", s, count=1).strip()
    return bool(OBJ_TITLE.match(s) or STOP.match(s) or SLO_TITLE.match(s) or CCCD_SLO_HEAD.match(s)
                or OBJ_STOP.match(s) or OBJ_STOP.match(bare) or (bare.isupper() and STOP.match(bare)))


def objectives_of(text: str) -> dict:
    """The first Course Objectives section that holds items, as printed: its heading, the lead-in, and each line
    up to the next section heading (the outcomes' own STOP list, or an SLO heading). A heading that a page lists
    in its contents with no items under it is passed over (Las Positas prints one in its DE section). Each item
    keeps its words; only a list marker is removed."""
    lines = (text or "").split("\n")
    for i, line in enumerate(lines):
        if not OBJ_TITLE.match(line):
            continue
        lead, items = None, []
        for raw in lines[i + 1:i + 200]:
            s = raw.strip()
            if not s or OBJ_LABEL.match(s):
                continue
            if _obj_ends(s):
                break
            if not items and LEAD.match(s):
                lead = lead or s
                continue
            items.append(MARKER.sub("", s, count=1).strip())
        items = [x for x in items if x]
        inline = [OBJ_INLINE.sub("", x, count=1).strip() for x in items if OBJ_INLINE.match(x)]
        if inline:
            # Cuesta's All Fields outline prints each objective as "Objective <text>" with its assessment
            # methods and content lines between (trial 42573515439, S616): the labeled lines are the objectives.
            items = [x for x in inline if x]
        if items:
            return {"objectives": items, "objectives_heading": line.strip().rstrip(":").strip(),
                    "objectives_lead": lead, "objectives_fingerprint": fingerprint(items)}
    return {"objectives": [], "objectives_heading": None, "objectives_lead": None, "objectives_fingerprint": None}


def objectives_from_html(page_html: str) -> list[str] | None:
    """Each Objective Text field a curriQunet All Fields report prints (SDCCD's report 4), its value as one item:
    the page's text breaks a long field across lines, the field keeps it whole (CISC 106, trial 38350787486).
    None when the page prints no such field."""
    if "Objective Text" not in (page_html or ""):
        return None
    tree = _Tree()
    tree.feed(page_html)
    out = []
    for f in tree.root.find(lambda n: _has_class(n, "iq-data-field")):
        lab, val = _field_part(f, "field-label"), _field_part(f, "field-value")
        if lab and _ws(lab.text()) == "Objective Text" and val and _ws(val.text()):
            out.append(_ws(val.text()))
    return out or None


def objectives_block(page_html: str, text: str, report: str | None = None) -> dict:
    """The objectives as parse_page files them: the text reader's heading and lead-in, with the All Fields
    report's own fields as the items where it prints them. None from a report whose template prints no
    objectives section (REPORTS_WITHOUT_OBJECTIVES)."""
    if not prints_objectives(report):
        return dict(NO_OBJECTIVES)
    got = objectives_of(text)
    fields = objectives_from_html(page_html)
    if fields:
        got = {**got, "objectives": fields, "objectives_fingerprint": fingerprint(fields)}
    return got


def offered_at(text: str) -> list[str] | None:
    """The college codes an integrated outline prints under College: (RIV, MOV, NOR)."""
    m = OFFERED.search(text or "")
    return [x.strip() for x in m.group(1).split("\n") if x.strip()] if m else None


def fingerprint(outcomes: list[str]) -> str:
    return hashlib.md5(json.dumps(outcomes, ensure_ascii=False).encode()).hexdigest()


def host_slug(url: str) -> str:
    return urllib.parse.urlparse(url).netloc.split(".")[0].lower()


# An eLumen catalog prints each course's SLOs on the course's own catalog page, which
# loads through the same light call the program read uses (college page read
# 38504338656, S387: Cabrillo ASTRO 3, Modesto AG 115, Palo Verde ACC 101; Palo Verde
# moved to Acalog for 2026-2027, S451). A program
# page links its courses at <catalog>/course/<code in lower case, no space>, so the
# index is built from the codes, with no listing to read.
EL_COURSE = "https://api-prod.elumenapp.com/catalog/sites/publish/content/%s,course,%s?tenant=%s"


def elumen_index(slug: str) -> dict:
    """The course index for an eLumen college, in the shape wanted_courses() reads:
    each course the college's loaded records name, its catalog course page as the one
    report. The catalog and host come from the college's capture."""
    cap = json.load(open(os.path.join(HERE, "program_requirements_college", slug, "capture.json")))
    catalog = (cap.get("elumen") or {}).get("catalog")
    host = urllib.parse.urlparse(cap.get("catalog_url") or "").netloc
    if not catalog or not host.endswith("elumenapp.com"):
        raise SystemExit("%s: the capture names no eLumen catalog" % slug)
    index = {}
    for code in index_mod.record_codes([slug])[slug]:
        path = re.sub(r"[^a-z0-9]", "", code.lower())
        index[code] = [{"title": None, "course_id": None,
                        "reports": [EL_COURSE % (catalog, path, host)]}]
    return {"url": cap["catalog_url"], "index": index}


# The Coast district's CourseLeaf catalog serves each course's Course Outline of
# Record at /courses/<subject>-<number>/, its SLOs under Course Level Student
# Learning Outcome(s) (college page read 38507237083, S387: Coastline ACCT C116 and
# BUS C100). Golden West and Orange Coast share the host.
CCCD_COURSE = "https://catalog.cccd.edu/courses/%s/"
CATALOG_COURSE_HOSTS = {"catalog.cccd.edu": "courseleaf"}


def cccd_index(slug: str) -> dict:
    """The course index for a Coast district college: each course its loaded records
    name, its outline of record addressed by code (ACCT C116 at acct-c116)."""
    cap = json.load(open(os.path.join(HERE, "program_requirements_college", slug, "capture.json")))
    if urllib.parse.urlparse(cap.get("catalog_url") or "").netloc != "catalog.cccd.edu":
        raise SystemExit("%s: the capture names no Coast district catalog" % slug)
    index = {}
    for code in index_mod.record_codes([slug])[slug]:
        path = "-".join(re.sub(r"[^a-z0-9 ]", "", code.lower()).split())
        index[code] = [{"title": None, "course_id": None, "reports": [CCCD_COURSE % path]}]
    # Filed under the district (the first label of catalog.cccd.edu names nothing).
    return {"url": cap["catalog_url"], "host": "cccd", "index": index}


# Mt. San Antonio's SLO pages (S683; the Courses area's ask 5 on #3533): its CourseLeaf
# catalog prints no SLOs (queue.json, S387), and the college's own SLO site prints a
# course's outcomes at /slo/index.html?course=<SUBJ NUM>, listing 1,605 courses on /slo.
# The page is addressed by code, so the index is built from the loaded records' codes.
# No load has proved the page: a full read waits on the self-recall count below.
MTSAC_SLO = "https://www.mtsac.edu/slo/index.html?course=%s"
MTSAC_SLUG = "mt_san_antonio"
MTSAC_RECALL = os.path.join(HERE, "course_outcomes", "mtsac_recall.json")
# The share of hand-read filed pages whose parse must match by eye, on at least this many pages.
MTSAC_RECALL_PAGES, MTSAC_RECALL_SHARE = 12, 0.9


def mtsac_index(slug: str = MTSAC_SLUG) -> dict:
    """Mt. San Antonio's course index: each code its loaded records name, its SLO page
    as the one report. Filed under host mtsac (the first label of www.mtsac.edu names nothing)."""
    index = {}
    for code in index_mod.record_codes([slug])[slug]:
        index[code] = [{"title": None, "course_id": None,
                        "reports": [MTSAC_SLO % urllib.parse.quote(code)]}]
    return {"url": "https://www.mtsac.edu/slo/", "host": "mtsac", "index": index}


def mtsac_recall(path: str = MTSAC_RECALL, out_dir: str = OUT_DIR) -> dict:
    """The self-recall count: each filed trial page a person read by eye, its outcomes
    and objectives counted, against what parse_page reads from the same filed page.
    The file names the trial and, per course code, {"slo": n, "objective": n, "by": who}."""
    if not os.path.exists(path):
        return {"pages": 0, "right": 0, "wrong": [], "ok": False, "why": "no hand-read pages filed yet"}
    want = json.load(open(path))
    folder = os.path.join(out_dir, "trial_%s" % want["trial"])
    right, wrong = 0, []
    for code, eye in sorted(want["pages"].items()):
        stem = re.sub(r"[^A-Za-z0-9]+", "_", code)
        html, txt = os.path.join(folder, stem + ".html.gz"), os.path.join(folder, stem + ".txt")
        if not (os.path.exists(html) and os.path.exists(txt)):
            # A hand count for a page the trial never filed counts as wrong, so the gate's
            # message names it rather than stopping on a missing file (COBIx on #3537).
            wrong.append((code, {"slo": eye["slo"], "objective": eye["objective"]}, "page not filed"))
            continue
        got = parse_page(gzip.open(html, "rt").read(), open(txt).read(), "other")
        seen = {"slo": len(got.get("outcomes") or []), "objective": len(got.get("objectives") or [])}
        if seen == {"slo": eye["slo"], "objective": eye["objective"]}:
            right += 1
        else:
            wrong.append((code, {"slo": eye["slo"], "objective": eye["objective"]}, seen))
    pages = len(want["pages"])
    ok = pages >= MTSAC_RECALL_PAGES and right >= MTSAC_RECALL_SHARE * pages
    return {"pages": pages, "right": right, "wrong": wrong, "ok": ok,
            "why": None if ok else "%d of %d hand-read pages parse right; a full read needs %d%% of at least %d"
            % (right, pages, int(MTSAC_RECALL_SHARE * 100), MTSAC_RECALL_PAGES)}


def catalog_index(slug: str) -> dict:
    """The course index for a college whose catalog addresses each course page by its
    code: eLumen, the Coast district's outlines, or Mt. San Antonio's SLO pages."""
    if slug == MTSAC_SLUG:
        return mtsac_index(slug)
    cap = json.load(open(os.path.join(HERE, "program_requirements_college", slug, "capture.json")))
    host = urllib.parse.urlparse(cap.get("catalog_url") or "").netloc
    return cccd_index(slug) if host == "catalog.cccd.edu" else elumen_index(slug)


def page_system(url: str) -> str:
    """The system a course page belongs to, for the parser: the census's outline
    systems, or the catalog host that serves outlines itself."""
    return (cor.system_of(url) or CATALOG_COURSE_HOSTS.get(urllib.parse.urlparse(url or "").netloc)
            or "other")


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


# An eLumen course page prints its outcomes inside the accordion its heading opens, in
# the college's own template (trials 38505894485 and 38506174617, all 24 pages):
#   Modesto:  Learning Outcomes > a field label "SLO:" > a numbered list (<ol><li>)
#   Cabrillo: Learning Outcomes > a lead-in label "Upon successful completion of this
#             course, students should be prepared to:" > a table, one outcome a row,
#             each row numbered in its own text ("1. Analyze ...")
# The text reader takes neither heading as an SLO heading, and on Cabrillo it read the
# accordion's next "Toggle" as an outcome.
EL_SLO_HEAD = re.compile(r"^(?:(?:student|course) )?(?:learning )?outcomes?:?$|^slos?:?$", re.I)
EL_HEAD_TAGS = {"h2", "h3", "h4", "h5", "h6", "strong", "b", "dt", "label"}


def elumen_outcomes_from_html(page_html: str) -> dict | None:
    """The SLO block of an eLumen catalog course page: the first heading or field label
    that names the outcomes, and within the box that holds it (the accordion) the
    lead-in label, then each item of the first list, or else each row of the first
    table, as printed with its number removed. None when the page names no outcomes or
    its box holds none."""
    tree = _Tree()
    tree.feed(page_html or "")
    heads = list(tree.root.find(lambda n: n.tag in EL_HEAD_TAGS and EL_SLO_HEAD.match(_ws(n.text()))))
    if not heads:
        return None
    head = heads[0]
    box = head.parent
    items = []
    lists = list(box.find(lambda n: n.tag in ("ol", "ul")))
    if lists:
        items = [_ws(li.text(skip=("ol", "ul"))) for li in lists[0].kids
                 if not isinstance(li, str) and li.tag == "li"]
    else:
        tables = list(box.find(lambda n: n.tag == "table"))
        if tables:
            items = [_ws(tr.text()) for tr in tables[0].find(lambda n: n.tag == "tr")]
    items = [x for x in (MARKER.sub("", i, count=1).strip() for i in items) if x]
    if not items:
        return None
    lead = [_ws(n.text()) for n in box.find(lambda n: n.tag in ("h5", "h6", "p") and n is not head)
            if not EL_SLO_HEAD.match(_ws(n.text())) and LEAD.match(_ws(n.text()))]
    return {"shape": "list" if len(items) > 1 else "paragraph",
            "heading": _ws(head.text()).rstrip(":").strip(), "lead": lead[0] if lead else None,
            "outcomes": items, "maps_to": None, "parsed_from": "html"}


# The Coast district's outline of record prints its SLOs as a heading followed by the
# list, then Course Objectives (trial 38508460207: <h3>Course Level Student Learning
# Outcome(s)</h3><ol><li>...). The text reader does not take that heading.
CCCD_SLO_HEAD = re.compile(r"^course level student learning outcomes?(?:\(s\))?:?$", re.I)
# A sub-heading a CourseLeaf outline prints as the list's first item. Golden West prints "Course outcomes:" there
# (S665: 3 live SLO rows had filed it as outcome 1), so it is the lead, never an outcome.
CCCD_SUBHEAD = re.compile(r"^course (?:learning )?outcomes?:$", re.I)


def cccd_outcomes_from_html(page_html: str) -> dict | None:
    """The list that follows the outline's Course Level Student Learning Outcome(s)
    heading, before the next heading; each item as printed. None when the page has
    no such heading or no list under it."""
    tree = _Tree()
    tree.feed(page_html or "")
    for head in tree.root.find(lambda n: n.tag in ("h2", "h3", "h4") and CCCD_SLO_HEAD.match(_ws(n.text()))):
        sibs = [k for k in head.parent.kids if not isinstance(k, str)]
        for k in sibs[sibs.index(head) + 1:]:
            if k.tag in ("h2", "h3", "h4"):
                break
            if k.tag in ("ol", "ul"):
                items = [MARKER.sub("", _ws(li.text(skip=("ol", "ul"))), count=1).strip()
                         for li in k.kids if not isinstance(li, str) and li.tag == "li"]
                items = [x for x in items if x]
                lead = items.pop(0) if items and CCCD_SUBHEAD.match(items[0]) else None
                if items:
                    return {"shape": "list" if len(items) > 1 else "paragraph",
                            "heading": _ws(head.text()), "lead": lead, "outcomes": items,
                            "maps_to": None, "parsed_from": "html"}
        return None
    return None


# Mt. San Antonio's SLO page prints the course it was asked for after an anchor, <a id="slo_course_results">: Course
# Name, Course Number, then "Outcomes:" and a list, each item an SLO as printed. Its text also carries the site's
# course listing under the page's own "Student Learning Outcomes" title, which the text reader filed as 19 SLOs on
# every page of trial 44687943107 (S689). A page whose block is empty prints no SLOs for that course (6 of those 12).
MTSAC_RESULTS = "slo_course_results"


def mtsac_outcomes_from_html(page_html: str) -> dict | None:
    """The list under Outcomes: in Mt. San Antonio's course results block; an empty result when the block prints
    none, so the text reader never reads the course listing; None when the page has no such block."""
    if MTSAC_RESULTS not in (page_html or ""):
        return None
    tree = _Tree()
    tree.feed(page_html)
    anchor = next(iter(tree.root.find(lambda n: n.tag == "a" and n.attrs.get("id") == MTSAC_RESULTS)), None)
    if anchor is None:
        return None
    sibs = anchor.parent.kids
    items, seen_head = [], False
    for k in sibs[sibs.index(anchor) + 1:]:
        if isinstance(k, str):
            continue
        if k.tag == "div":
            break
        if k.tag == "strong" and _ws(k.text()).rstrip(":").lower() == "outcomes":
            seen_head = True
        elif seen_head and k.tag in ("ul", "ol"):
            items = [_ws(li.text(skip=("ol", "ul"))) for li in k.kids if not isinstance(li, str) and li.tag == "li"]
            break
    items = [x for x in items if x]
    return {"shape": "list" if len(items) > 1 else ("paragraph" if items else "none"),
            "heading": "Outcomes" if items else None, "lead": None, "outcomes": items, "maps_to": None,
            "parsed_from": "html"}


def parse_page(page_html: str, text: str, system: str | None = None, report: str | None = None) -> dict:
    """The outcomes a page prints (_parse_outcomes) and, beside them, its course objectives (Sam, 2026-11-02)."""
    return {**_parse_outcomes(page_html, text, system, report), **objectives_block(page_html, text, report)}


def _parse_outcomes(page_html: str, text: str, system: str | None = None, report: str | None = None) -> dict:
    """The outcomes a page prints: each college's group (SDCCD's All Fields report), else
    the SLO area of an integrated outline (RCCD), else an eLumen course page's block,
    else the text reader. Mt. San Antonio's course results block comes first wherever it prints,
    and a Mt. San Antonio SLO page whose HTML holds no block files none: its text is the site's course
    listing, never a course's SLOs (full read 44695707506, S689)."""
    got = mtsac_outcomes_from_html(page_html)
    if got is None and (report or "").startswith(MTSAC_SLO.split("?")[0]):
        got = {"shape": "none", "heading": None, "lead": None, "outcomes": [], "maps_to": None,
               "parsed_from": "html", "why_none": "no course results block in the page's HTML"}
    if got is not None:
        return {**got, "fingerprint": fingerprint(got["outcomes"]) if got["outcomes"] else None}
    if system in ("elumen", "courseleaf"):
        own = elumen_outcomes_from_html if system == "elumen" else cccd_outcomes_from_html
        got = own(page_html) or outcomes_of(text)
        return {**got, "fingerprint": fingerprint(got["outcomes"]) if got["outcomes"] else None}
    groups = groups_from_html(page_html)
    if groups is not None:
        found = [g for g in groups if g["outcomes"]]
        return {"shape": "groups" if found else "none", "heading": "Student Learning Outcomes", "lead": None,
                "outcomes": [], "maps_to": None, "groups": groups, "parsed_from": "html",
                "fingerprint": None}
    got = outcomes_from_html(page_html) or outcomes_of(text)
    return {**got, "fingerprint": fingerprint(got["outcomes"]) if got["outcomes"] else None}


# The Reader keeps 400,000 characters of a page's HTML. Mt. San Antonio's SLO page prints its course results block
# past 671,000 (trial 44687943107), so full read 44695707506 parsed the text instead and filed the site's course
# listing on every page (S689). A page cut at that length is parsed from the browser's whole HTML.
READER_HTML_CAP = 400000


def page_html_of(reader, page: dict) -> str:
    """The page's HTML as the parser reads it: the Reader's copy, or the browser's whole page where that copy was
    cut at READER_HTML_CAP."""
    html_ = page.get("html") or ""
    if len(html_) >= READER_HTML_CAP:
        try:
            return reader.page.content() or html_
        except Exception:
            return html_
    return html_


# The page's whole text as load_full reads it stops at this many characters (FULL_BODY_JS). A row says whether its
# page reached either limit, so a trial shows whether it parsed what the full read will see (S690).
TEXT_CAP = 80000

# Outline hosts whose report pages name people (curriculum staff, originators), where a read files parsed outcomes
# only: the course, each outcome and objective as parsed, and the report's address; never the page's text or HTML, in
# a trial or a full read (d-ccsf-outline-trial-no-staff-names-s689). City College of San Francisco's report 28 names
# its curriculum staff (second reader on #3586, S689).
# Saddleback's and Irvine Valley's host and Rio Hondo's (S691) are read the same way from their first trial: a
# curriQunet report can name its originator, and no page from either has been filed to show otherwise.
OUTCOMES_ONLY_HOSTS = {"ccsf.curricunet.com", "saddleback.curriqunet.com", "riohondo.curriqunet.com"}
# The fields a row filed from such a host keeps. Each is the index's, the load's status, or a parsed field; the
# page's title and any text the parser did not take as an outcome or objective stay out.
OUTCOMES_ONLY_KEYS = (
    "code", "title", "course_id", "report", "named_by", "status", "final_url", "access", "chars", "text_cut",
    "html_chars", "html_cut", "offered_at", "shape", "heading", "lead", "outcomes", "maps_to", "groups",
    "parsed_from", "why_none", "fingerprint", "objectives", "objectives_heading", "objectives_lead",
    "objectives_fingerprint", "section_heads")
# The page files a trial keeps elsewhere, for a person to read the parser against: never from such a host.
PAGE_FILE_ENDS = (".txt", ".html.gz", ".html")


def outcomes_only(url: str) -> bool:
    """Whether a read of this report or host files parsed outcomes only."""
    return urllib.parse.urlparse(url or "").netloc.lower() in OUTCOMES_ONLY_HOSTS


def section_heads(text: str) -> list[str]:
    """The section headings a page prints, in order, as the parser's own patterns name them: the heading words alone
    (the outcomes' STOP list, the objectives heading, the SLO heading), never a line's other words. A person reads
    the parse of an outcomes-only page against these: which sections the page prints, and where each block ended."""
    out = []
    for line in (text or "").split("\n"):
        s = line.strip()
        if not s:
            continue
        if OBJ_TITLE.match(s):
            out.append(s.rstrip(":").strip().upper())
            continue
        m = SLO_TITLE.match(s)
        if m:
            out.append(HEAD_NUMBER.sub("", m.group(0)).strip().upper())
            continue
        m = STOP.match(s)
        if m:
            out.append(m.group(1).strip().upper())
    return out


def file_row(row: dict) -> dict:
    """The row as a read files it: whole for most hosts, cut to OUTCOMES_ONLY_KEYS for an outcomes-only host."""
    if not outcomes_only(row.get("report") or ""):
        return row
    return {k: row[k] for k in OUTCOMES_ONLY_KEYS if k in row}


def read_one(reader, course: dict) -> dict:
    page = cor.load_full(reader, course["report"])
    body = page.get("body") or ""
    html_ = page.get("html") or ""
    parsed_html = page_html_of(reader, page)
    got = parse_page(parsed_html, body, page_system(course["report"]), course["report"])
    # html_chars is what the parser read; html_cut is true only when that is the Reader's copy cut at its cap (the
    # browser's whole page could not be read in its place). CCSF's report 28 pages run past 400,000 characters of
    # HTML around 5,000 to 15,000 of text (trial 44738175152), so the whole page stands in on every one.
    row = {**course, "status": page.get("status"), "final_url": page.get("final_url"),
           "access": cor.access_of(page), "title_printed": (page.get("title") or "")[:160],
           "chars": len(body), "text_cut": len(body) >= TEXT_CAP, "html_chars": len(parsed_html),
           "html_cut": len(html_) >= READER_HTML_CAP and len(parsed_html) <= len(html_),
           "offered_at": offered_at(body), **got}
    if outcomes_only(course["report"]):
        row["section_heads"] = section_heads(body)
    return file_row(row)


def file_trial_page(reader, out_dir: str, course: dict) -> list[str]:
    """A trial's copy of the page it read, for a person to read the parser against: its whole text and HTML, except
    from an outcomes-only host, whose trial files the parsed row alone. Returns the files written."""
    if outcomes_only(course.get("report") or ""):
        return []
    stem = re.sub(r"[^A-Za-z0-9]+", "_", course["code"])
    txt, html_gz = os.path.join(out_dir, stem + ".txt"), os.path.join(out_dir, stem + ".html.gz")
    with open(txt, "w") as f:
        f.write(reader.page.evaluate(FULL_BODY_JS) or "")
    with gzip.open(html_gz, "wt") as f:
        f.write(reader.page.content())
    return [txt, html_gz]


def strip_page_files(root: str = OUT_DIR) -> list[str]:
    """Each page file in a read folder whose read names an outcomes-only host, removed before the workflow keeps or
    commits the folder; the paths removed. The guard behind file_trial_page, run by course-outcomes-read.yml."""
    gone = []
    for folder, _dirs, files in os.walk(root):
        hosts = set()
        for f in files:
            if not (f.endswith(".json") and (f == "read.json" or f.startswith("read_"))):
                continue
            try:
                d = json.load(open(os.path.join(folder, f)))
            except (OSError, ValueError):
                continue
            hosts.add(d.get("host") or "")
            hosts.update(r.get("report") or "" for r in d.get("rows") or [])
        if not any(outcomes_only(h) for h in hosts):
            continue
        for f in sorted(files):
            if f.endswith(PAGE_FILE_ENDS):
                os.remove(os.path.join(folder, f))
                gone.append(os.path.join(folder, f))
    return gone


# An outcomes-only host's self-recall count. Its trial files no pages, so the counts come from a reading of each page
# that does not go through the parser: a person reads the page's SLO section as printed (slo_excerpt, which the trial
# prints to its job log and never files) and records each count, where it came from and when. The gate compares them
# with the trial's own rows, which read_one filed through the same Reader copy and caps as a full read
# (p-reader-cap-hides-mtsac-results-s689), and refuses a trial filed by another parser than the current one, a row
# that did not answer 200, a trial that parsed outcomes on fewer than half its pages, and a count with no source
# (second reader on #3601, S690).
CCSF_RECALL = os.path.join(HERE, "course_outcomes", "ccsf_recall.json")
RECALL_BY_HOST = {"ccsf.curricunet.com": CCSF_RECALL}
# The SLO section of a report 28 page, cut by its two printed headings alone, never by the parser's patterns.
EXCERPT_FROM, EXCERPT_TO, EXCERPT_LINES = "STUDENT LEARNING OUTCOMES", "CONTENTS", 60
# Each outcomes-only host's two printed headings around its SLO section, as a person read them off the host's own
# first trial (its filed section_heads). A host not listed here logs no excerpt until its pair is recorded (S691).
EXCERPT_BY_HOST = {"ccsf.curricunet.com": (EXCERPT_FROM, EXCERPT_TO)}


def slo_excerpt(text: str, host: str = "ccsf.curricunet.com") -> list[str] | None:
    """The lines a page prints between its SLO heading and the heading after it (the host's pair in EXCERPT_BY_HOST;
    City College of San Francisco's STUDENT LEARNING OUTCOMES and CONTENTS), as printed; None when the host has no
    pair, either heading is missing or the section runs past EXCERPT_LINES, so nothing past the section is shown. A
    person counts the outcomes in it by eye, apart from the parser."""
    pair = EXCERPT_BY_HOST.get((host or "").lower())
    if not pair:
        return None
    first, after = pair
    lines = [ln.rstrip() for ln in (text or "").split("\n")]
    bare = [ln.strip().upper() for ln in lines]
    if first not in bare:
        return None
    start = bare.index(first) + 1
    end = next((i for i in range(start, min(len(bare), start + EXCERPT_LINES + 1)) if bare[i] == after), None)
    return None if end is None else [ln for ln in lines[start:end] if ln.strip()]


def excerpt_log(code: str, excerpt: list[str] | None, host: str = "ccsf.curricunet.com") -> str:
    """The excerpt as the trial's log prints it, one numbered line each, between two markers."""
    if excerpt is None:
        first, after = EXCERPT_BY_HOST.get((host or "").lower(), ("(no heading pair recorded for this host)", "-"))
        return "EXCERPT %s: no section between %s and %s within %d lines" % (code, first, after, EXCERPT_LINES)
    return "\n".join(["EXCERPT %s BEGIN (%d lines)" % (code, len(excerpt))]
                     + ["  %02d| %s" % (i, ln) for i, ln in enumerate(excerpt, 1)] + ["EXCERPT %s END" % code])


# The code that turns a page into outcomes and objectives. Its fingerprint goes into every trial's head, and a
# self-recall count passes only for a trial filed by the parser that would run the full read.
PARSER_PARTS = ("parse_page", "_parse_outcomes", "outcomes_of", "_heads_section", "outcomes_from_html",
                "groups_from_html", "elumen_outcomes_from_html", "cccd_outcomes_from_html", "mtsac_outcomes_from_html",
                "objectives_block", "objectives_of", "objectives_from_html", "_obj_ends", "page_html_of", "read_one",
                "file_row", "section_heads")
PARSER_PATTERNS = ("STOP", "SLO_TITLE", "HEAD_NUMBER", "MARKER", "LEAD", "SLO_COLUMN_HEAD", "LEAD_ENDS", "OBJ_TITLE",
                   "OBJ_LABEL", "OBJ_INLINE", "OBJ_STOP", "EL_SLO_HEAD", "CCCD_SLO_HEAD", "CCCD_SUBHEAD")


def parser_fingerprint() -> str:
    """md5 over the parser's functions' source, its patterns, and the reports recorded as printing no objectives."""
    import inspect
    g = globals()
    parts = [inspect.getsource(g[n]) for n in PARSER_PARTS if n in g]
    parts += ["%s=%r/%d" % (n, g[n].pattern, g[n].flags) for n in PARSER_PATTERNS if n in g]
    parts.append(json.dumps(sorted(_OBJ_RECORD.REPORTS_WITHOUT_OBJECTIVES)))
    return hashlib.md5("\n".join(parts).encode()).hexdigest()


def rows_recall(path: str, out_dir: str = OUT_DIR) -> dict:
    """Each counted trial row's {"slo": n, "objective": n}, read off the page apart from the parser, against the
    outcomes and objectives the row filed. Wrong: a row not filed, not answering 200, reaching a cap, or with a count
    that names no source. Not ok: a trial filed by another parser, or one that parsed outcomes on fewer than half
    its pages, whatever the counts."""
    def refuse(why, pages=0, right=0, wrong=()):
        return {"pages": pages, "right": right, "wrong": list(wrong), "ok": False, "why": why}
    if not os.path.exists(path):
        return refuse("no counted rows filed yet")
    want = json.load(open(path))
    trial = os.path.join(out_dir, "trial_%s" % want["trial"], "read.json")
    if not os.path.exists(trial):
        return refuse("trial %s is not filed" % want["trial"])
    filed = json.load(open(trial))
    if filed.get("parser_fingerprint") != parser_fingerprint():
        return refuse("trial %s was filed by parser %s; the current parser is %s: run the trial again and count it"
                      % (want["trial"], filed.get("parser_fingerprint"), parser_fingerprint()))
    rows = {r["code"]: r for r in filed["rows"]}
    right, wrong = 0, []
    for code, eye in sorted(want["pages"].items()):
        count = {"slo": eye["slo"], "objective": eye["objective"]}
        r = rows.get(code)
        if r is None:
            wrong.append((code, count, "row not filed"))
        elif r.get("status") != 200:
            wrong.append((code, count, "status %s" % r.get("status")))
        elif r.get("text_cut") or r.get("html_cut"):
            wrong.append((code, count, "page reached a cap"))
        elif not eye.get("from") or not eye.get("at") or eye.get("from") == "row":
            wrong.append((code, count, "the count names no source apart from the parser"))
        else:
            seen = {"slo": len(r.get("outcomes") or []) + sum(len(g.get("outcomes") or [])
                                                              for g in r.get("groups") or []),
                    "objective": len(r.get("objectives") or [])}
            if seen == count:
                right += 1
            else:
                wrong.append((code, count, seen))
    pages = len(want["pages"])
    parsed = sum(1 for r in filed["rows"] if r.get("status") == 200 and r.get("outcomes"))
    if 2 * parsed < len(filed["rows"]):
        return refuse("trial %s parsed outcomes on %d of %d pages" % (want["trial"], parsed, len(filed["rows"])),
                      pages, right, wrong)
    ok = pages >= MTSAC_RECALL_PAGES and right >= MTSAC_RECALL_SHARE * pages
    return {"pages": pages, "right": right, "wrong": wrong, "ok": ok,
            "why": None if ok else "%d of %d counted rows parse right; a full read needs %d%% of at least %d"
            % (right, pages, int(MTSAC_RECALL_SHARE * 100), MTSAC_RECALL_PAGES)}


def read_courses(reader, todo: list[dict], rows: list[dict], after=None) -> list[dict]:
    """The full read's loop, apart from the browser so a test can drive it: each course read by read_one and filed
    into rows as read (SLOs and objectives both, S649); after(n, course, row) runs once a row is filed."""
    for n, course in enumerate(todo, 1):
        row = read_one(reader, course)
        rows.append(row)
        print("%4d %-10s %s %-9s %d" % (n, course["code"], row["status"], row["shape"], len(row["outcomes"])),
              flush=True)
        if after:
            after(n, course, row)
    return rows


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
        row.update(parse_page(page_html, text, page_system(row.get("report") or ""), row.get("report")),
                   offered_at=offered_at(text))
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
    ap.add_argument("--catalog", "--elumen", dest="catalog", default="",
                    help="a college whose catalog addresses course pages by code (eLumen, the Coast district): no index file")
    ap.add_argument("--slugs", default="riverside_city,moreno_valley,norco")
    ap.add_argument("--trial", type=int, default=0)
    ap.add_argument("--part", type=int, default=1)
    ap.add_argument("--of", type=int, default=1)
    ap.add_argument("--delay", type=int, default=int(os.environ.get("CENSUS_DELAY_MS", "3000")))
    ap.add_argument("--reparse", default="", help="a trial folder: parse its filed pages again, no load")
    ap.add_argument("--strip-page-files", default="", help="a folder: remove page files from outcomes-only reads")
    a = ap.parse_args(argv)
    if a.strip_page_files:
        gone = strip_page_files(a.strip_page_files)
        print("removed %d page file(s) from outcomes-only reads" % len(gone))
        return 0
    if a.reparse:
        return reparse(a.reparse)
    if a.catalog == MTSAC_SLUG and not a.trial:
        rc = mtsac_recall()
        if not rc["ok"]:
            raise SystemExit("mt_san_antonio: no full read before the self-recall count passes (%s). Run a trial, "
                             "count its filed pages by eye into kb/course_outcomes/mtsac_recall.json, then "
                             "python3 tests/mtsac_slo_read_test.py." % rc["why"])
    if a.catalog:
        index, a.slugs = catalog_index(a.catalog), a.catalog
    elif a.index:
        index = json.load(open(a.index))
    else:
        ap.error("--index FILE or --catalog SLUG (or --reparse FOLDER)")
    if outcomes_only(index["url"]) and not a.trial:
        recall = RECALL_BY_HOST.get(urllib.parse.urlparse(index["url"]).netloc.lower())
        rc = rows_recall(recall) if recall else {"ok": False, "why": "the host has no recall file recorded"}
        if not rc["ok"]:
            raise SystemExit("%s: no full read before the self-recall count passes (%s). Run a trial, count its "
                             "parsed rows by eye into the host's recall file, then python3 "
                             "tests/ccsf_outcomes_only_test.py." % (index["url"], rc["why"]))
    courses = wanted_courses(index, [s for s in a.slugs.split(",") if s])
    if a.trial:
        todo = spread(courses, a.trial)
    else:
        todo = [c for i, c in enumerate(courses) if i % a.of == a.part - 1]
    run = os.environ.get("GITHUB_RUN_ID", "local")
    host = index.get("host") or host_slug(index["url"])
    print("wanted %d courses with an outline; this run reads %d" % (len(courses), len(todo)), flush=True)

    out_dir = os.path.join(OUT_DIR, "trial_%s" % run) if a.trial else os.path.join(OUT_DIR, host)
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, "read.json" if a.trial else "read_%s_p%dof%d.json" % (run, a.part, a.of))
    head = {"run": run, "index": ("catalog:" + a.catalog) if a.catalog else os.path.relpath(a.index, os.path.dirname(HERE)),
            "host": index["url"],
            "system": page_system(index["url"]),
            # A row read from the catalog's own course page (eLumen) is a catalog row; the
            # Coast district's catalog page is the outline of record itself.
            "source_kind": "catalog" if a.catalog and page_system(index["url"]) == "elumen" else "course_outline",
            "slugs": a.slugs, "part": a.part, "of": a.of, "wanted": len(courses), "slice": len(todo),
            # Both kinds in the one pass (Sam, 2026-11-13), and whether this system's page prints objectives.
            "collects": list(COR_COLLECTS),
            "objectives_printed": (OBJECTIVES_BY_SYSTEM.get(page_system(index["url"]) or "") or {}).get("printed"),
            # The parser that filed these rows; a self-recall count passes only for the current one.
            "parser_fingerprint": parser_fingerprint()}
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

        def after(n, course, row):
            if a.trial:
                file_trial_page(reader, out_dir, course)
                if outcomes_only(course["report"]):
                    # The SLO section as printed, for a count by eye apart from the parser: in the job's log, never
                    # in a filed page (S690).
                    where = urllib.parse.urlparse(course["report"]).netloc.lower()
                    print(excerpt_log(course["code"], slo_excerpt(reader.page.evaluate(FULL_BODY_JS) or "", where),
                                      where), flush=True)
            if n % SAVE_EVERY == 0:
                save(False)

        read_courses(reader, todo, rows, after)
        browser.close()
    save(True)
    print(json.dumps(summarize(rows), indent=1))
    print("wrote", os.path.relpath(path, os.path.dirname(HERE)))
    return 0


if __name__ == "__main__":
    sys.exit(main())

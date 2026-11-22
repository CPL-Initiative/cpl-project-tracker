#!/usr/bin/env python3
"""File the course descriptions of three large noncredit catalogs (S700, 2026-11-22, #3655).

WHY. Sam's order of 2026-11-21, relayed by COBIx on #3655 (comment 7069586791): every noncredit subject title and
common-code recommendation waits until the catalogs of the four large noncredit programs are filed and their titles
parsed. North Orange Continuing Education was filed in S690; this script files the other three into
kb/hand_filed_catalogs/courses/<slug>.json.gz, in the same row shape, from the job logs of college-page-read.yml.
subject_name is the catalog's own subject heading for the course's section, as printed: the point of the filing.
Nothing is inferred. A course whose heading the parse cannot read is counted under missed_upper_bound and left out.

THE RULES, one per college.

  san_diego_of_continuing_education  (SDCCE 2026-2027 catalog PDF, pages 83 to 134)
    The course pages run from the page after the one that prints only "Course / Descriptions" to the page before
    "Contract Faculty"; the program pages ahead of them print "SUBJ NNN Title" lines that are never read as courses.
    A course is anchored on its fee line: a line that is "Fee" or "Non-Fee" (with an optional "/..." such as
    "Non-Fee/High School Credit Only"), alone or after the code on the same line. The code ("SUBJ NNN") ends the line
    just above the fee line, or is that whole line, or splits "... SUBJ" / "NNN" over two lines, or ends the line
    above a short last word of the title ("Infant/Toddler Outdoor HMDV 590" / "Enrichment"). Where the code stands
    alone the line above is title. The title then reaches up one or two more lines that close no sentence and are no
    alternate title, provided the line above them closes (ends in . ) ! ? : or a closing quote, is a fee line, or ends
    an alternate-title list). An alternate-title list opens on "Alternate Title(s):" and runs on while its line ends in
    ; , or - or is too full (53 characters) to have held the next line's first word. A subject heading is a line
    "Name (SUBJ)" (or "(SUBJ)" whose name wraps onto the line above, never an alternate-title line, and an
    alternate-title list never runs on into a heading) that sits directly above a course's title and
    whose SUBJ is that course's subject; it names every course of that subject under it. A parenthetical that closes
    a description or a title ("(AWS)", "(ENSA)") is no heading: its code is not the next course's subject or the line
    is the course's own title. The entry runs from the fee line to the next course's title or heading. Lines opening
    Advisory, Prerequisite or Corequisite are requisites (to the line that ends in a period, at most four lines); the
    alternate-title list is alternate_titles; the rest is the description. Page headers ("San Diego College of
    Continuing Education * 2026-2027 NN") are dropped. The catalog prints no hours or units; fee is the fee line as
    printed (Fee marks a fee-based community education class, Non-Fee a noncredit course).

  santa_ana  (Santa Ana College 2026-27 catalog PDF, the School of Continuing Education's course list, pages 435 to 464)
    The SCE course list opens on the line "NONCREDIT COURSES" (PDF page 435, printed 429) and ends with the last page
    of the run that prints a "Credit(s):" line (page 464; page 465 is the Centennial Education Center's map). Nothing
    before it is read, so the credit course pages and the SCE program pages are never filed. A course opens on a line
    that is only its code, "SUBJ NNN" (2 to 6 capitals, a space, digits and an optional letter), followed within four
    lines by its measure line; the lines between are its title (a "Formerly:" line is kept as formerly). A course
    whose measure line reads "Unit(s):" is a credit course and is never filed; a noncredit course's reads
    "Credit(s): 0 .000 Class Hours: ...". A code line with no measure line is counted in missed_upper_bound (most are
    a requisite's course printed on a line of its own) and ends the entry above it unless it continues a requisite. A
    subject heading is a line "Name (SUBJ)" directly above a course's code line with that SUBJ. The entry runs to the
    next course or heading. A requisite line (Prerequisite, Corequisite, Recommended Preparation, Advisory,
    Limitation(s) of or on Enrollment) runs on while it ends in a hyphen, a comma, a joining word or a bare subject
    code, or the next line opens in lower case, a digit or a course code (at most six lines). "Open Entry/Open Exit"
    is kept as schedule; the rest is the description.

  mt_san_antonio  (Mt. San Antonio College 2026-2027 catalog, the noncredit Adult & Continuing Education courses)
    One CourseLeaf page per subject, at the address the A to Z page links
    (/programs/noncredit-programs/adult-continuing-coursesaz/<subj>/). The subject heading is the page's own title
    ("Access (ACCS) < Mt. San Antonio College"), which is the heading the A to Z page lists. A course opens on a line
    "SUBJ NUM  Title" (two or more spaces before the title; SUBJ is the page's own code, NUM letters and digits) whose
    next line is "<n> Units"; a code line with no Units line is counted in missed_upper_bound. Its entry runs to
    "Course Schedule" or the next course. Lines opening Lecture, Lab, Activity or Clinical are hours; requisite lines
    are kept whole; the rest is the description. The navigation list of the eight subjects is never read as a course.

PDF pages print with pypdf's spacing ("36 .000"); hours keeps the measure with that spacing folded ("36.000").
Each row carries the run whose log holds its page and that page's read time.

Usage:
  python3 kb/_file_noncredit_catalogs.py <slug> <run id>=<clean log> [...] [--write]
  A clean log is the job log with each line's timestamp stripped and the "##### PAGE" lines carrying
  " · read_at: <time>". Without --write it prints a summary and writes nothing.
"""
import gzip
import hashlib
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from _file_missed_subject_pages import pages as html_pages, clean  # noqa: E402

COURSES = os.path.join("kb", "hand_filed_catalogs", "courses")
FETCHED_BY = "Sky (S700 worker)"
ORDER = ("Sam's order of 2026-11-21, relayed by COBIx on #3655 (comment 7069586791): the four large noncredit "
         "programs' catalogs are filed and their titles parsed before any noncredit subject title or common-code "
         "recommendation is made.")


# ── reading a log ───────────────────────────────────────────────────────────
def pdf_pages(log_text):
    """{pdf page number: (lines, url, read_at)} for each PDF page a clean log printed."""
    out, url, read_at, cur = {}, None, None, None
    for line in log_text.split("\n"):
        m = re.match(r"^##### PAGE \d+ .*?(?:read_at: (\S+))?$", line)
        if m:
            read_at, cur = m.group(1), None
            continue
        if line.startswith("url: "):
            url = line[5:].strip()
            continue
        m = re.match(r"^\[pdf page (\d+)\]$", line)
        if m:
            cur = int(m.group(1))
            out[cur] = ([], url, read_at)
            continue
        if line.startswith("=== COLLEGE PAGE READ JSON"):
            cur = None
        if cur is not None:
            out[cur][0].append(line)
    return out


def merged_pdf(logs):
    """[(page, line, run, url, read_at)] in page order across several runs' logs; a page printed twice is kept once."""
    seen = {}
    for run, text in logs:
        for n, (lines, url, read_at) in pdf_pages(text).items():
            seen.setdefault(n, (lines, str(run), url, read_at))
    out = []
    for n in sorted(seen):
        lines, run, url, read_at = seen[n]
        for l in lines:
            out.append((n, l, run, url, read_at))
    return out, sorted(seen)


def norm(s):
    return re.sub(r"\s+", " ", s.replace("\t", " ").replace("​", "")).strip()


def join(lines):
    """Lines of one paragraph joined: a line that ends in a hyphen or slash runs on without a space."""
    out = ""
    for l in lines:
        if not l:
            continue
        if out and (out.endswith("-") or out.endswith("/")):
            out += l
        else:
            out = (out + " " + l) if out else l
    return out


# ── SDCCE ───────────────────────────────────────────────────────────────────
SD_HEADER = re.compile(r"San Diego College of Continuing e[Dd]u[Cc]ation\s*•")
SD_FEE = r"(Non-Fee|Fee)(/[^ ]+(?: [^ ]+)*)?"
SD_SUBJ, SD_NUM = r"[A-Z]{2,5}", r"\d{2,4}[A-Z]{0,3}"
SD_FEE_ALONE = re.compile(r"^%s$" % SD_FEE)
SD_CODE_FEE = re.compile(r"^(%s) (%s) %s$" % (SD_SUBJ, SD_NUM, SD_FEE))
SD_CODE_END = re.compile(r"^(.*?)\s*\b(%s) (%s)$" % (SD_SUBJ, SD_NUM))
SD_NUM_ALONE = re.compile(r"^(%s)$" % SD_NUM)
SD_SUBJ_END = re.compile(r"^(.*?)\s*\b(%s)$" % SD_SUBJ)
SD_HEADING = re.compile(r"^(.*?)\s*\((%s)\)$" % SD_SUBJ)
SD_REQ = re.compile(r"^(Advisory|Prerequisites?|Corequisites?|Recommended Preparation)\s*:", re.I)
SD_ALT = re.compile(r"^Alternate Title\(s\)\s*:", re.I)
TERMINAL = re.compile(r"""[.)!?:”"]$""")


def sd_lines(logs):
    """The course pages' lines, page headers dropped: from the page after the "Course / Descriptions" divider to
    the page before "Contract Faculty"."""
    allp, nums = merged_pdf(logs)
    by = {}
    for n, l, run, url, read_at in allp:
        by.setdefault(n, []).append((l, run, url, read_at))
    start = end = None
    for n in nums:
        body = [norm(l) for l, *_ in by[n] if norm(l) and not SD_HEADER.search(l)]
        if start is None and body == ["Course", "Descriptions"]:
            start = n + 1
        if start is not None and n >= start and "Contract Faculty" in body:
            end = n - 1
            break
    if start is None:
        return [], None
    if end is None:
        end = nums[-1]
    out = []
    for n in range(start, end + 1):
        for l, run, url, read_at in by.get(n, []):
            t = norm(l)
            if not t or t == "(blank)" or SD_HEADER.search(t):
                continue
            out.append({"page": n, "text": t, "run": run, "url": url, "read_at": read_at})
    return out, (start, end)


SD_WIDTH = 53   # characters: an alternate-title line this long plus the next line's first word could not have held it


def sd_code_at(T, i):
    """(subject, number, lead, code line, fee) for a fee line at i, or None when it is not one; (None,) when the fee
    line has no code the rule reads."""
    t = T[i]
    m = SD_CODE_FEE.match(t)
    if m:
        return m.group(1), m.group(2), "", i, m.group(3) + (m.group(4) or "")
    if not (SD_FEE_ALONE.match(t) and i > 0):
        return None
    m1, m2 = SD_CODE_END.match(T[i - 1]), SD_NUM_ALONE.match(T[i - 1])
    if m1:
        return m1.group(2), m1.group(3), m1.group(1), i - 1, t
    if m2 and i > 1 and SD_SUBJ_END.match(T[i - 2]):
        m3 = SD_SUBJ_END.match(T[i - 2])
        return m3.group(2), m2.group(1), m3.group(1), i - 2, t
    m4 = SD_CODE_END.match(T[i - 2]) if i > 1 else None
    if m4 and m4.group(1) and len(T[i - 1]) <= 20 and not TERMINAL.search(T[i - 1]) and \
            not SD_CODE_END.match(T[i - 1]):
        # "Infant/Toddler Outdoor HMDV 590" / "Enrichment": the title's last word printed under its code
        return m4.group(2), m4.group(3), m4.group(1) + " " + T[i - 1], i - 2, t
    return (None,)


def sd_alt_blocks(T, stops):
    """The lines of each "Alternate Title(s):" list. The list runs on while its line ends in ; , or - or is too full
    to have held the next line's first word (SD_WIDTH), and never into a course's code or fee line."""
    out = set()
    for i, t in enumerate(T):
        if not SD_ALT.match(t):
            continue
        out.add(i)
        j = i
        while j + 1 < len(T) and j + 1 not in stops and not SD_HEADING.match(T[j + 1]):
            cur, nxt = T[j], T[j + 1]
            if cur.endswith((";", ",", "-")) or len(cur) + 1 + len(nxt.split()[0]) > SD_WIDTH:
                j += 1
                out.add(j)
            else:
                break
    return out


def parse_sdcce(lines):
    """(rows, info) from the course pages' lines (see the module's rule)."""
    T = [l["text"] for l in lines]
    found_at = {i: sd_code_at(T, i) for i in range(len(T))}
    stops = set()
    for i, x in found_at.items():
        if x and x[0]:
            stops.update(range(x[3], i + 1))
        elif x:
            stops.add(i)
    alt_at = sd_alt_blocks(T, stops)

    def fin(i):
        """Whether line i closes what came before it, so the next line can open a title."""
        if i is None or i < 0:
            return True
        if i in alt_at:
            return i + 1 not in alt_at
        t = T[i]
        return bool(TERMINAL.search(t) or SD_FEE_ALONE.match(t) or SD_CODE_FEE.match(t))

    def title_start(c, lead):
        """Where the code stands alone the line above is title; then the title reaches up one or two more lines that
        do not close a sentence and are no alternate title, provided the line above them closes."""
        k = c - (0 if lead else 1)
        for j in (k - 1, k - 2):
            if j < 0:
                break
            if any(fin(x) or x in alt_at for x in range(j, k)):
                break
            if fin(j - 1):
                return j
        return k

    courses = []
    for i, t in enumerate(T):
        x = found_at[i]
        if not x:
            continue
        if x[0] is None:
            courses.append({"anchor": i, "missed": True})
            continue
        subj, num, lead, c, fee = x
        k = title_start(c, lead)
        title_lines = T[k:c] + ([lead] if lead else [])
        title = norm(join(title_lines))
        courses.append({"anchor": i, "code_at": c, "title_at": k, "subject": subj, "num": num, "fee": fee,
                        "title": title})
    rows, missed, headings = [], 0, {}
    current = {}
    found = [x for x in courses if not x.get("missed")]
    missed = sum(1 for x in courses if x.get("missed"))
    for n, x in enumerate(found):
        k = x["title_at"]
        # a heading directly above the title
        if k >= 1:
            h = SD_HEADING.match(T[k - 1])
            if h and h.group(2) == x["subject"]:
                name = h.group(1)
                if k >= 2 and not fin(k - 2) and fin(k - 3) and k - 2 not in alt_at and not SD_ALT.match(T[k - 2]):
                    name = norm(T[k - 2] + " " + name)   # a heading wrapped onto two lines
                if name:
                    current[x["subject"]] = name
                    headings.setdefault(x["subject"], name)
        nxt = found[n + 1]["title_at"] if n + 1 < len(found) else len(T)
        # the next course's heading sits above its title: stop the entry there
        if n + 1 < len(found):
            j = nxt - 1
            if j > x["anchor"] and SD_HEADING.match(T[j]) and SD_HEADING.match(T[j]).group(2) == found[n + 1]["subject"]:
                nxt = j
                if j - 1 > x["anchor"] and not fin(j - 1) and fin(j - 2) and j - 1 not in alt_at and \
                        not SD_ALT.match(T[j - 1]):
                    nxt = j - 1
        body = T[x["anchor"] + 1:nxt]
        reqs, alt, desc, k2 = [], [], [], 0
        while k2 < len(body):
            l = body[k2]
            if alt or SD_ALT.match(l):
                alt.append(l)
            elif SD_REQ.match(l):
                req = [l]
                while not l.endswith(".") and k2 + 1 < len(body) and len(req) < 4:
                    k2 += 1
                    l = body[k2]
                    req.append(l)
                reqs.append(join(req))
            else:
                desc.append(l)
            k2 += 1
        src = lines[x["code_at"]]
        row = {"subject": x["subject"], "subject_name": current.get(x["subject"]),
               "code": "%s %s" % (x["subject"], x["num"]), "title": x["title"], "fee": x["fee"],
               "requisites": reqs, "description": join(desc)}
        if alt:
            row["alternate_titles"] = join(alt)
        row.update({"pdf_page": src["page"], "source_url": src["url"], "read_at": src["read_at"], "run": src["run"]})
        rows.append(row)
    return rows, {"anchors_without_code": missed, "headings": headings}


# ── Santa Ana ───────────────────────────────────────────────────────────────
SA_HEADER = re.compile(r"Santa Ana College 2026-27 Catalog")
SA_CODE = re.compile(r"^([A-Z]{2,6}) (\d{2,4}[A-Z]?)$")
SA_MEASURE = re.compile(r"^(Credit\(s\)|Unit\(s\)):\s*(.*)$")
SA_HOURS = re.compile(r"Class Hours:\s*(.*?)\s*(Lecture|Lab|Laboratory|total|$)")
SA_HEADING = re.compile(r"^(.+?) \(([A-Z]{2,6})\)$")
SA_REQ = re.compile(r"^(Prerequisites?|Corequisites?|Recommended Preparation|Advisory|Limitations? (of|on) Enrollment)"
                    r"\s*:", re.I)
SA_SCHED = re.compile(r"^Open Entry/Open Exit\s*\.?$", re.I)


def sa_lines(logs):
    """The SCE course list's lines: from the line "NONCREDIT COURSES" to the end of the last page of the run of
    pages that print a "Credit(s):" line (the page after it is the Centennial Education Center's map)."""
    allp, nums = merged_pdf(logs)
    by = {}
    for n, l, run, url, read_at in allp:
        by.setdefault(n, []).append((norm(l), run, url, read_at))
    out, on, first, last = [], False, None, None
    for n in nums:
        texts = [t for t, *_ in by[n]]
        if on and not any(t.startswith("Credit(s):") for t in texts):
            break
        for t, run, url, read_at in by[n]:
            if not t or t == "(blank)" or SA_HEADER.search(t):
                continue
            if t == "NONCREDIT COURSES":
                on, first = True, n
                continue
            if on:
                out.append({"page": n, "text": t, "run": run, "url": url, "read_at": read_at})
        if on:
            last = n
    return out, ((first, last) if first else None)


SA_CONT_END = re.compile(r"(-|,|\b(and|or|in|to|of|the|a|with)|\b[A-Z]{2,6})$")
SA_CONT_NEXT = re.compile(r"^([a-z0-9(]|[A-Z]{2,6} \d)")


def sa_requisite_runs_on(cur, nxt):
    """Whether a requisite line continues on the next line: it ends in a hyphen, a comma, a joining word or a bare
    subject code, or the next line opens in lower case, a digit or a course code."""
    return bool(SA_CONT_END.search(cur.rstrip()) or SA_CONT_NEXT.match(nxt))


def fold(s):
    """pypdf's space ahead of a period folded: "36 .000" is 36.000, "students ." is "students."."""
    return re.sub(r" \.(\s|$|\))", r".\1", re.sub(r"(\d) \.(\d)", r"\1.\2", s))


def parse_santa_ana(lines):
    T = [l["text"] for l in lines]
    starts, missed, credit_skipped = [], 0, 0
    for i, t in enumerate(T):
        if not SA_CODE.match(t):
            continue
        meas = None
        for j in range(i + 1, min(i + 6, len(T))):
            if SA_CODE.match(T[j]):
                break
            if SA_MEASURE.match(T[j]):
                meas = j
                break
        if meas is None:
            missed += 1
            continue
        if SA_MEASURE.match(T[meas]).group(1) != "Credit(s)":
            credit_skipped += 1
            continue
        starts.append((i, meas))
    rows, current, headings = [], {}, {}
    for n, (i, meas) in enumerate(starts):
        subj, num = SA_CODE.match(T[i]).groups()
        if i >= 1:
            h = SA_HEADING.match(T[i - 1])
            if h and h.group(2) == subj:
                current[subj] = h.group(1)
                headings.setdefault(subj, h.group(1))
        between = T[i + 1:meas]
        formerly = [l for l in between if l.lower().startswith("formerly")]
        title = join([l for l in between if not l.lower().startswith("formerly")])
        end = starts[n + 1][0] if n + 1 < len(starts) else len(T)
        if n + 1 < len(starts):
            h = SA_HEADING.match(T[end - 1])
            if h and h.group(2) == SA_CODE.match(T[end]).group(1):
                end -= 1
        body = T[meas + 1:end]
        reqs, desc, sched, cur = [], [], [], None
        for l in body:
            if SA_CODE.match(l) and not (cur is not None and sa_requisite_runs_on(cur[-1], l)):
                break       # a code line with no measure line (counted in missed_upper_bound) ends this entry
            if SA_REQ.match(l):
                cur = [l]
                reqs.append(cur)
            elif SA_SCHED.match(l):
                sched.append(l)
                cur = None
            elif cur is not None and len(cur) < 6 and sa_requisite_runs_on(cur[-1], l):
                cur.append(l)
            else:
                cur = None
                desc.append(l)
        measure = T[meas]
        hm = SA_HOURS.search(measure)
        row = {"subject": subj, "subject_name": current.get(subj), "code": "%s %s" % (subj, num),
               "title": fold(norm(title)), "hours": fold(hm.group(1)) if hm else None,
               "measure_printed": fold(measure), "requisites": [fold(join(r)) for r in reqs],
               "description": fold(join(desc))}
        if formerly:
            row["formerly"] = join(formerly)
        if sched:
            row["schedule"] = sched[0]
        src = lines[i]
        row.update({"pdf_page": src["page"], "source_url": src["url"], "read_at": src["read_at"], "run": src["run"]})
        rows.append(row)
    return rows, {"codes_without_measure": missed, "credit_measures_skipped": credit_skipped, "headings": headings}


# ── Mt. San Antonio ─────────────────────────────────────────────────────────
MT_HEAD = re.compile(r"^([A-Z]{2,5}) ([A-Z0-9][A-Z0-9.]*)\s{2,}(\S.*)$")
MT_UNITS = re.compile(r"^(\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?) Units?$")
MT_HOURS = re.compile(r"^(Lecture|Lab|Laboratory|Activity|Clinical|Work Experience)\s*:\s*\S")
MT_END = re.compile(r"^(Course Schedule|Print Options|Back to top)$")
MT_REQ = re.compile(r"^(Prerequisites?|Corequisites?|Advisory|Recommended Preparation|Limitation on Enrollment)"
                    r"\s*:", re.I)


def mt_subject_name(title):
    """(name, code) from a subject page's title, "Access (ACCS) < Mt. San Antonio College"."""
    m = re.match(r"^(.+?)\s*\(([A-Z]+)\)\s*(<|\||$)", clean(title or ""))
    return (m.group(1).strip(), m.group(2)) if m else (None, None)


def parse_mtsac_page(lines, page_title):
    """(subject name, subject code, rows, missed) for one subject page. A course opens on a line "SUBJ NUM  Title"
    (two or more spaces before the title, as CourseLeaf prints it), SUBJ the page's own code, whose next line is
    "<n> Units"; a code line with no Units line is counted in missed."""
    raw = [l.replace("​", "").rstrip() for l in lines]
    raw = [l for l in raw if l.strip() and l.strip() != "(blank)"]
    name, code = mt_subject_name(page_title)
    starts, missed = [], 0
    for i, l in enumerate(raw):
        m = MT_HEAD.match(l.strip())
        if not m or (code and m.group(1) != code):
            continue
        if i + 1 < len(raw) and MT_UNITS.match(clean(raw[i + 1])):
            starts.append(i)
        else:
            missed += 1
    rows = []
    for n, i in enumerate(starts):
        end = starts[n + 1] if n + 1 < len(starts) else len(raw)
        for k in range(i + 1, end):
            if MT_END.match(clean(raw[k])):
                end = k
                break
        m = MT_HEAD.match(raw[i].strip())
        subj, num, title = m.group(1), m.group(2), clean(m.group(3))
        units = MT_UNITS.match(clean(raw[i + 1])).group(1)
        hours, reqs, desc = [], [], []
        for l in (clean(x) for x in raw[i + 2:end]):
            if MT_HOURS.match(l) and len(l) < 60:
                hours.append(l)
            elif MT_REQ.match(l):
                reqs.append(l)
            else:
                desc.append(l)
        rows.append({"subject": subj, "subject_name": name, "code": "%s %s" % (subj, num), "title": title,
                     "units": units, "hours": "; ".join(hours) or None, "requisites": reqs,
                     "description": " ".join(desc)})
    return name, code, rows, missed


# ── filing ─────────────────────────────────────────────────────────────────
COLLEGES = {
    "san_diego_of_continuing_education": {
        "college": "San Diego College of Continuing Education", "catalog_year": "2026-2027",
        "source_url": "https://www.sdccd.edu/docs/ISPT/instsrv/Catalogs/MetaFiles/2026_2027/CECatalog2026-2027.pdf",
        "source": "runner PDF",
    },
    "santa_ana": {
        "college": "Santa Ana College", "catalog_year": "2026-2027",
        "source_url": "https://www.sac.edu/admissions/catalogarchive/SAC_2026-27_Catalog_11_03_26.pdf",
        "source": "runner PDF", "scope": "School of Continuing Education",
    },
    "mt_san_antonio": {
        "college": "Mt. San Antonio College", "catalog_year": "2026-2027",
        "index_url": "https://catalog.mtsac.edu/programs/noncredit-programs/adult-continuing-coursesaz/",
        "source": "runner HTML", "scope": "Adult & Continuing Education (noncredit)",
    },
}


def build_rows(slug, logs):
    """(rows in file shape, info) for one college from its runs' clean logs."""
    meta = COLLEGES[slug]
    info = {}
    if slug == "san_diego_of_continuing_education":
        lines, span = sd_lines(logs)
        rows, info = parse_sdcce(lines)
        info["span"] = span
    elif slug == "santa_ana":
        lines, span = sa_lines(logs)
        rows, info = parse_santa_ana(lines)
        info["span"] = span
    else:
        rows, info, missed = [], {"pages": [], "headings": {}}, 0
        for run, text in logs:
            for p in html_pages(text):
                if p["status"] != "200" or "/adult-continuing-coursesaz/" not in (p["url"] or "") or \
                        p["url"].rstrip("/").endswith("adult-continuing-coursesaz"):
                    if p["url"] and p["url"].rstrip("/").endswith("adult-continuing-coursesaz"):
                        continue
                    info["pages"].append({"url": p["url"], "status": p["status"], "run": str(run), "courses": 0})
                    continue
                name, code, prow, miss = parse_mtsac_page(p["lines"], p["title"])
                missed += miss
                if code and name:
                    info["headings"][code] = name
                for r in prow:
                    r.update({"source_url": p["url"], "read_at": p["read_at"], "run": str(run)})
                rows += prow
                info["pages"].append({"url": p["url"], "status": p["status"], "run": str(run), "courses": len(prow)})
        info["missed"] = missed
    out, seen, twice = [], set(), []
    for r in rows:
        if r["code"] in seen:
            twice.append(r["code"])
            continue
        seen.add(r["code"])
        full = {"college": meta["college"], "catalog_year": meta["catalog_year"]}
        full.update(r)
        out.append(full)
    info["codes_printed_twice"] = sorted(set(twice))
    return out, info


def coci_overlap(root, college_names, rows):
    """How many of the filed codes the state list carries under any of the college's names, each course once."""
    src = open(os.path.join(root, "coci_lookup_data.js"), encoding="utf-8").read()
    j = json.loads(src[src.index("{"):src.rindex("}") + 1])
    idx = {i for i, n in enumerate(j.get("colleges") or []) if n in college_names}
    state = {("%s %s" % (r[2], r[3])).upper() for r in j.get("rows") or [] if r[0] in idx}
    filed = {r["code"].upper() for r in rows}
    return len(filed & state), len(state)


def write(slug, logs, doc_extra, root=ROOT, dry=False):
    meta = COLLEGES[slug]
    rows, info = build_rows(slug, logs)
    runs = sorted({str(run) for run, _ in logs})
    read_at = max((r["read_at"] for r in rows if r.get("read_at")), default=None)
    doc = {"_what": None, "fetched_by": FETCHED_BY, "fetched_at": read_at, "college": meta["college"],
           "catalog_year": meta["catalog_year"]}
    if "source_url" in meta:
        doc["source_url"] = meta["source_url"]
    else:
        doc["index_url"] = meta["index_url"]
    doc.update(doc_extra(rows, info, runs))
    doc["runs"] = runs
    doc["courses"] = len(rows)
    doc["codes_printed_twice"] = info["codes_printed_twice"]
    doc["rows"] = rows
    body = json.dumps(doc, ensure_ascii=False, indent=1) + "\n"
    if dry:
        return doc, info
    path = os.path.join(root, COURSES, slug + ".json.gz")
    with open(path, "wb") as f:
        f.write(gzip.compress(body.encode("utf-8"), compresslevel=9, mtime=0))
    idx_path = os.path.join(root, COURSES, "index.json")
    with open(idx_path, encoding="utf-8") as f:
        idx = json.load(f)
    entry = {"slug": slug, "file": slug + ".json.gz", "college": meta["college"], "catalog_year": meta["catalog_year"],
             "source": meta["source"], "runs": runs, "courses": len(rows),
             "missed_upper_bound": doc.get("missed_upper_bound"),
             "sha256_uncompressed": hashlib.sha256(body.encode("utf-8")).hexdigest(), "read_at": read_at}
    if meta.get("scope"):
        entry["scope"] = meta["scope"]
    idx["colleges"] = [c for c in idx["colleges"] if c["slug"] != slug] + [entry]
    idx["colleges"].sort(key=lambda c: c["slug"])
    with open(idx_path, "w", encoding="utf-8") as f:
        json.dump(idx, f, indent=1, ensure_ascii=False)
        f.write("\n")
    return doc, info


def header(slug):
    """The header fields that say how one college's file was read and parsed."""
    rule = __doc__.split("  " + slug + "  ")[1].split("\n\n")[0]
    parsed = " ".join(l.strip() for l in rule.split("\n")[1:])

    def extra(rows, info, runs):
        meta = COLLEGES[slug]
        if slug == "san_diego_of_continuing_education":
            a, b = info["span"]
            missed = info["anchors_without_code"]
            what = ("San Diego College of Continuing Education's 2026-2027 course descriptions, one row per course its "
                    "catalog PDF prints (pages %d to %d): college, subject, the catalog's subject heading, code, title, "
                    "fee as printed, requisites, description, alternate titles, source, read time." % (a, b))
            how = ("college-page-read.yml on a GitHub runner: the census Reader fetched the college's own catalog PDF "
                   "(robots.txt first, 4 s between loads, the user agent naming the CPL Initiative) and printed its pages "
                   "line for line (pypdf; plan keys pdf_span, pdf_page_cap, pdf_unfolded). Plans sdcce_catalog_courses_1 "
                   "(pages 1 to 50, run 44968521109: front matter and programs), _2 (51 to 100, run 44968975726) and _3 "
                   "(101 to 144, run 44968979994); the course pages are 83 to 134.")
            not_read = ("The catalog prints no hours or units for a course. Fee (community education, fee-based) "
                        "classes are filed beside Non-Fee (noncredit) courses and marked by fee. %d fee lines had no code "
                        "the rule reads (missed_upper_bound). The program pages (51 to 81) are the harvest's own read. "
                        "The state list carries this college twice, as San Diego College of Continuing Education and San "
                        "Diego College of Continuing Education Credit (the same inventory); this file names the first, "
                        "which the Subjects builder matches, and each course is filed once." % missed)
            pages = [{"url": meta["source_url"], "status": "200", "pdf_pages": [a, b], "run": r,
                      "courses": sum(1 for x in rows if x["run"] == r)} for r in runs if any(x["run"] == r for x in rows)]
        elif slug == "santa_ana":
            a, b = info["span"]
            missed = info["codes_without_measure"]
            what = ("Santa Ana College's School of Continuing Education 2026-27 course descriptions, one row per course "
                    "the SCE section of the catalog PDF prints after its NONCREDIT COURSES line: college, subject, the "
                    "catalog's subject heading, code, title, hours as printed, requisites, description, source, read "
                    "time. Credit courses are not in this file.")
            how = ("college-page-read.yml on a GitHub runner: the census Reader fetched the college's own catalog PDF "
                   "(robots.txt first, 4 s between loads, the user agent naming the CPL Initiative) and printed its pages "
                   "line for line (pypdf; plan keys pdf_span, pdf_page_cap, pdf_unfolded). Plan santa_ana_sce_probe "
                   "(pages 401 to 406, run 44968040723: the credit list ends on 405, 406 is the campus map); plans "
                   "santa_ana_sce_courses_1 (407 to 440), _2 (441 to 474) and _3 (475 to 506), runs %s. The SCE section "
                   "opens on PDF page 407 and its course list runs from page 435 to 464; pages 465 on print the "
                   "Centennial map, district policies, administrators and faculty (run 44970020478's log reads back "
                   "from page 482, the 5,000-line limit, and prints no Credit(s) line)." % ", ".join(runs))
            not_read = ("Only the School of Continuing Education's courses are filed; the college's credit courses "
                        "(PDF pages before 406) are not read here, so a credit subject absent from this file is not "
                        "absent from the catalog. %d code lines printed no Credit(s) line (missed_upper_bound), and %d "
                        "measure lines in the section read Unit(s) and were left out as credit."
                        % (missed, info["credit_measures_skipped"]))
            pages = [{"url": meta["source_url"], "status": "200", "pdf_pages": [a, b], "run": r,
                      "courses": sum(1 for x in rows if x["run"] == r)} for r in runs if any(x["run"] == r for x in rows)]
        else:
            missed = info["missed"]
            what = ("Mt. San Antonio College's 2026-2027 noncredit (Adult & Continuing Education) course descriptions, "
                    "one row per course its eight noncredit subject pages print: college, subject, the subject heading, "
                    "code, title, hours as printed, requisites, description, source, read time. Credit courses are not "
                    "in this file.")
            how = ("college-page-read.yml on a GitHub runner, through the census Reader (robots.txt first, 4 s between "
                   "loads, the user agent naming the CPL Initiative), each subject page printed line for line by the "
                   "capture view. Plans mt_san_antonio_noncredit_probe and _index (the A to Z page, runs 44968040723 "
                   "and 44968519282: its course list is not in the page's static text), then "
                   "mt_san_antonio_noncredit_courses_1 (the A to Z page's own subject links and seven subject pages) and "
                   "_2 (Vocational), runs %s." % ", ".join(runs))
            not_read = ("Only the noncredit Adult & Continuing Education subjects are filed; the college's credit "
                        "courses (/programs/coursesaz/) are not read here, so a credit subject absent from this file is "
                        "not absent from the catalog. %d code lines printed no Units line (missed_upper_bound). The "
                        "pages print no requisites for most courses and no outcomes." % missed)
            pages = info["pages"]
        return {"_what": what + " Filed by " + FETCHED_BY + " under " + ORDER, "mark": "Sky can read 2026-27 catalog",
                "how_read": how, "parsed_by": parsed + " Parsed by kb/_file_noncredit_catalogs.py.",
                "subject_headings": dict(sorted(info["headings"].items())), "missed_upper_bound": missed,
                "not_read": not_read, "pages": pages}
    return extra


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    if len(args) < 2 or args[0] not in COLLEGES:
        print(__doc__)
        return 2
    logs = []
    for a in args[1:]:
        run, path = a.split("=", 1)
        with open(path, encoding="utf-8") as f:
            logs.append((run, f.read()))
    doc, info = write(args[0], logs, header(args[0]), dry="--write" not in argv)
    rows = doc["rows"]
    names = [COLLEGES[args[0]]["college"]]
    if args[0] == "san_diego_of_continuing_education":
        names.append(names[0] + " Credit")
    both, state = coci_overlap(ROOT, names, rows)
    print("%s: %d courses, %d subjects with a heading, missed_upper_bound %s, printed twice %s"
          % (args[0], len(rows), len(doc["subject_headings"]), doc["missed_upper_bound"], doc["codes_printed_twice"]))
    print("codes also in the state list: %d of %d filed (state list holds %d)" % (both, len(rows), state))
    print("no heading: %d" % sum(1 for r in rows if not r.get("subject_name")))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

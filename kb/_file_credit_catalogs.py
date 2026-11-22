#!/usr/bin/env python3
"""File the credit course descriptions of Santa Ana College and Mt. San Antonio College (S701, 2026-11-22, #3655).

WHY. Collection comes first (r-collection-first-sam-2026-11-20: data waves before fixes). Session 700 filed only these
two colleges' noncredit sections (kb/_file_noncredit_catalogs.py, PR #3662), so their credit subject codes read
"Not read yet" on the Subjects page (#commons/subjects). This script adds each college's credit courses to the same
file, kb/hand_filed_catalogs/courses/<slug>.json.gz, in the same row shape, from the job logs of college-page-read.yml.
subject_name is the catalog's own subject heading, as printed (Sam, 2026-11-21, #3655: a local subject title comes only
from the catalog's subject heading; program titles never stand as one; never drop an untitled row). Nothing is
inferred. A course whose heading the parse cannot read is filed with subject_name null and counted.

The noncredit rows already filed stay as they are, field for field and in their order; the credit rows follow them.
The noncredit header's own words move under "noncredit" and the credit read's under "credit"; the top-level fields
describe the whole file. The index entry loses its "scope": the whole catalog is read.

THE RULES, one per college.

  santa_ana  (Santa Ana College 2026-27 catalog PDF, the credit course list, pages 236 to 405)
    The credit course list is the run of consecutive pages that print a "Unit(s):" line, from the first such page
    (PDF page 236, printed 230, opening on "Accounting (ACCT)") to the last before the School of Continuing Education
    section (page 405; page 406 is the campus map, page 407 opens the SCE section the noncredit filer reads). The
    program pages ahead of it print "SUBJ NNN Title N.0" lines, which are never read as courses. A course opens on a
    line that starts with its code, "SUBJ NUM" (2 to 6 capitals, a space, then an optional capital, one to four
    digits, up to two capitals and an optional "-00"), alone or followed by a C-ID parenthetical, and is followed
    within six lines by its measure line ("Unit(s): ..."). A C-ID parenthetical that does not close on the code line
    runs on to the line that closes it. The lines between are the title, up to a "Formerly:" line, which with the
    lines after it is kept as formerly. A code line with no measure line is counted in missed_upper_bound (most are a
    requisite's course printed on a line of its own) and ends the entry above it unless it continues a requisite. A
    course whose measure line reads "Credit(s):" is a noncredit course and is never filed here. A subject heading is
    a line "Name (SUBJ)" directly above a course's code line with that SUBJ; it names every course of that subject
    under it. The entry runs to the next course or heading. A requisite line (Prerequisite, Corequisite, Recommended
    Preparation, Advisory, Limitation(s) of or on Enrollment) runs on as the noncredit rule reads it. A last line
    "CSU/UC", "CSU" or "UC" is kept as transfer, "Open Entry/Open Exit" as schedule; the rest is the description.

  mt_san_antonio  (Mt. San Antonio College 2026-2027 catalog, the credit courses A to Z)
    One CourseLeaf page per subject, at the address the credit A to Z page (/programs/coursesaz/) links. The subject
    heading is the page's own title ("Anatomy & Physiology (ANAT) < Mt. San Antonio College"), which is the heading
    the A to Z page lists. A course opens on a line "SUBJ NUM  Title" (two or more spaces before the title; SUBJ is
    the page's own code) whose next line is "<n> Units", alone or with a parenthetical; a code line with no Units line is counted in
    missed_upper_bound. The entry runs to "Course Schedule" or the next course. Lines opening Lecture, Lab, Activity
    or Clinical are hours; requisite lines are kept whole; the rest is the description. The noncredit filer's page
    parse, with what the credit pages add: the Units line's parenthetical (transfer, C-ID) is units_note, a subject code may
    hold a hyphen (DN-T), a course number a small letter (ANIM 99i), and a flag line ("UC Credit Limitation") is notes.

Usage:
  python3 kb/_file_credit_catalogs.py <slug> <run id>=<job log> [...] [--write]
  A job log is the run's log as `gh run view <id> --log` prints it (or a clean log, its timestamps stripped).
  Without --write it prints the summary and the self-recall against the state list, and writes nothing.
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
import _file_noncredit_catalogs as NC  # noqa: E402
from _file_missed_subject_pages import pages as html_pages  # noqa: E402

COURSES = NC.COURSES
FETCHED_BY = "Sky (S701 worker)"
ORDER = ("collection first (r-collection-first-sam-2026-11-20), issue #3655: the credit subject codes read Not read yet "
         "until the credit courses are filed with the catalog's own subject headings.")
SECTION = "credit"


# ── reading a log ───────────────────────────────────────────────────────────
GH_LINE = re.compile(r"^[^\t]*\t[^\t]*\t\ufeff?(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d)(?:\.\d+)?Z ?(.*)$")


def clean_log(text):
    """A `gh run view --log` log as a clean log: each line's job, step and timestamp stripped, and each "##### PAGE"
    line carrying " · read_at: <its timestamp to the second>". A clean log passes through unchanged."""
    lines = text.split("\n")
    if not any(GH_LINE.match(l) for l in lines[:50]):
        return text
    out = []
    for l in lines:
        m = GH_LINE.match(l.rstrip("\r"))
        if not m:
            continue
        ts, t = m.groups()
        if t.startswith("##### PAGE") and "read_at:" not in t:
            t += " · read_at: " + ts + "Z"
        out.append(t)
    return "\n".join(out) + "\n"


# ── Santa Ana ───────────────────────────────────────────────────────────────
SA_CODE = re.compile(r"^([A-Z]{2,6}) ([A-Z]?\d{1,4}[A-Z]{0,2}(?:-\d{1,2})?)(?:\s*\.)?(?:\s+(\(.*))?$")
SA_TRANSFER = re.compile(r"^(CSU/UC|CSU|UC)$")


def sa_credit_lines(logs):
    """The credit course list's lines: the run of consecutive pages that print a "Unit(s):" line, from the first."""
    allp, nums = NC.merged_pdf(logs)
    by = {}
    for n, l, run, url, read_at in allp:
        by.setdefault(n, []).append((NC.norm(l), run, url, read_at))
    out, first, last = [], None, None
    for n in nums:
        texts = [t for t, *_ in by[n]]
        has = any(t.startswith("Unit(s):") for t in texts)
        if first is None and not has:
            continue
        if first is not None and (not has or n != last + 1):
            break
        first = n if first is None else first
        last = n
        for t, run, url, read_at in by[n]:
            if not t or t == "(blank)" or NC.SA_HEADER.search(t):
                continue
            out.append({"page": n, "text": t, "run": run, "url": url, "read_at": read_at})
    return out, ((first, last) if first else None)


def sa_code(t, loose=False):
    """(SUBJ, NUM, the parenthetical after it or None) when a line is a course code and nothing else. Strict, the
    only parenthetical is a C-ID one and no period follows; loose (a course's own code line, which its measure line
    confirms), any parenthetical ("SOC 150 (SOCI 150)") and a stray period ("DNCE 115A .")."""
    m = SA_CODE.match(t)
    if not m:
        return None
    if not loose and (re.search(r"\.\s*($|\()", t[m.end(2):]) or (m.group(3) and not m.group(3).startswith("(C-"))):
        return None
    return m.groups()


def sa_measureless_course(T, i):
    """Whether a code line with no measure line is a course the catalog prints without one (ART 198 Topics): the
    line above is a transfer line or that subject's heading, and the line below is a title, no requisite or code."""
    if i + 1 >= len(T) or i < 1:
        return False
    above, below = T[i - 1], T[i + 1]
    h = NC.SA_HEADING.match(above)
    if not (SA_TRANSFER.match(above) or (h and h.group(2) == sa_code(T[i])[0])):
        return False
    return bool(below and below[0].isupper() and len(below) <= 70 and not NC.SA_REQ.match(below)
                and not sa_code(below) and not below.endswith("."))


def parse_santa_ana_credit(lines):
    T = [l["text"] for l in lines]
    starts, missed, noncredit_skipped, measureless = [], 0, 0, 0
    for i, t in enumerate(T):
        if not sa_code(t, loose=True):
            continue
        meas = None
        for j in range(i + 1, min(i + 7, len(T))):
            if sa_code(T[j]):
                break
            if NC.SA_MEASURE.match(T[j]):
                meas = j
                break
        if meas is None:
            if not sa_code(t):
                continue        # a sentence that ends on a code ("... DNCE 212B.") is no course line
            if sa_measureless_course(T, i):
                measureless += 1
                starts.append((i, None))
            else:
                missed += 1
            continue
        if NC.SA_MEASURE.match(T[meas]).group(1) != "Unit(s)":
            noncredit_skipped += 1
            continue
        starts.append((i, meas))
    rows, current, headings = [], {}, {}
    for n, (i, meas) in enumerate(starts):
        subj, num, note = sa_code(T[i], loose=True)
        if i >= 1:
            h = NC.SA_HEADING.match(T[i - 1])
            if h and h.group(2) == subj:
                current[subj] = h.group(1)
                headings.setdefault(subj, h.group(1))
        between = T[i + 1:meas] if meas is not None else T[i + 1:i + 2]
        if note and note.count("(") > note.count(")"):
            while between and note.count("(") > note.count(")"):
                note = note + " " + between.pop(0)
        title_l, formerly = [], []
        for l in between:
            if formerly or l.lower().startswith("formerly"):
                formerly.append(l)
            else:
                title_l.append(l)
        end = starts[n + 1][0] if n + 1 < len(starts) else len(T)
        if n + 1 < len(starts):
            h = NC.SA_HEADING.match(T[end - 1])
            if h and h.group(2) == sa_code(T[end], loose=True)[0]:
                end -= 1
        body = T[(meas if meas is not None else i + 1) + 1:end]
        transfer = None
        if body and SA_TRANSFER.match(body[-1]):
            transfer = body.pop()
        reqs, desc, sched, cur = [], [], [], None
        for l in body:
            # A code line with no measure line (counted in missed_upper_bound) stays in the entry: it is a
            # requisite's course or a sentence's, and the next course opens only on its own code and measure lines.
            if NC.SA_REQ.match(l):
                cur = [l]
                reqs.append(cur)
            elif NC.SA_SCHED.match(l):
                sched.append(l)
                cur = None
            elif cur is not None and len(cur) < 6 and NC.sa_requisite_runs_on(cur[-1], l):
                cur.append(l)
            else:
                cur = None
                desc.append(l)
        measure = NC.fold(T[meas]) if meas is not None else None
        um = re.match(r"^Unit\(s\):\s*(\S+(?:\s*-\s*\S+)?)", measure or "")
        hm = NC.SA_HOURS.search(measure or "")
        row = {"subject": subj, "subject_name": current.get(subj), "code": "%s %s" % (subj, num),
               "title": NC.fold(NC.norm(NC.join(title_l))), "units": um.group(1).replace(" ", "") if um else None,
               "hours": NC.fold(hm.group(1)) if hm else None, "measure_printed": measure,
               "requisites": [NC.fold(NC.join(r)) for r in reqs], "description": NC.fold(NC.join(desc))}
        if note:
            row["cid" if note.startswith("(C-") else "code_note"] = NC.norm(note.strip()[1:].rstrip(")").strip())
        if formerly:
            row["formerly"] = NC.join(formerly)
        if transfer:
            row["transfer"] = transfer
        if sched:
            row["schedule"] = sched[0]
        src = lines[i]
        row.update({"section": SECTION, "pdf_page": src["page"], "source_url": src["url"], "read_at": src["read_at"],
                    "run": src["run"]})
        rows.append(row)
    return rows, {"codes_without_measure": missed, "noncredit_measures_skipped": noncredit_skipped,
                  "measureless_courses": measureless, "headings": headings}


# ── Mt. San Antonio ─────────────────────────────────────────────────────────
MT_CREDIT = "/programs/coursesaz/"
MT_HEAD = re.compile(r"^([A-Z][A-Z-]{0,5}) ([A-Z0-9][A-Za-z0-9.]*)\s{2,}(\S.*)$")
MT_UNITS = re.compile(r"^(\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?) Units?(?:\s*\((.*)\))?$")
MT_NOTE = re.compile(r"^(UC Credit Limitation|Pass/No Pass Only|Credit by Exam)$", re.I)


def mt_subject_name(title):
    """(name, code) from a subject page's title, "Dance: Theory (DN-T) < Mt. San Antonio College"."""
    m = re.match(r"^(.+?)\s*\(([A-Z][A-Z-]*)\)\s*(<|\||$)", NC.clean(title or ""))
    return (m.group(1).strip(), m.group(2)) if m else (None, None)


def parse_mtsac_credit_page(lines, page_title):
    """(subject name, subject code, rows, missed) for one credit subject page. The noncredit page parse
    (kb/_file_noncredit_catalogs.py parse_mtsac_page) with what the credit pages add: a Units line that carries its
    transfer and C-ID note in parentheses ("4 Units (Degree Applicable, CSU, UC, C-ID #: BIOL 110B)", kept as
    units_note), a code with a hyphen or of one letter, and a short flag line ("UC Credit Limitation") kept as notes."""
    raw = [l.replace("​", "").rstrip() for l in lines]
    raw = [l for l in raw if l.strip() and l.strip() != "(blank)"]
    name, code = mt_subject_name(page_title)
    starts, missed = [], 0
    for i, l in enumerate(raw):
        m = MT_HEAD.match(l.strip())
        if not m or (code and m.group(1) != code):
            continue
        if i + 1 < len(raw) and MT_UNITS.match(NC.clean(raw[i + 1])):
            starts.append(i)
        else:
            missed += 1
    rows = []
    for n, i in enumerate(starts):
        end = starts[n + 1] if n + 1 < len(starts) else len(raw)
        for k in range(i + 1, end):
            if NC.MT_END.match(NC.clean(raw[k])):
                end = k
                break
        m = MT_HEAD.match(raw[i].strip())
        subj, num, title = m.group(1), m.group(2), NC.clean(m.group(3))
        um = MT_UNITS.match(NC.clean(raw[i + 1]))
        hours, reqs, desc, notes = [], [], [], []
        for l in (NC.clean(x) for x in raw[i + 2:end]):
            if NC.MT_HOURS.match(l) and len(l) < 60:
                hours.append(l)
            elif NC.MT_REQ.match(l):
                reqs.append(l)
            elif MT_NOTE.match(l):
                notes.append(l)
            else:
                desc.append(l)
        row = {"subject": subj, "subject_name": name, "code": "%s %s" % (subj, num), "title": title,
               "units": um.group(1), "hours": "; ".join(hours) or None, "requisites": reqs,
               "description": " ".join(desc)}
        if um.group(2):
            row["units_note"] = um.group(2)
        if notes:
            row["notes"] = notes
        rows.append(row)
    return name, code, rows, missed


def mtsac_credit(logs):
    rows, info, missed = [], {"pages": [], "headings": {}}, 0
    for run, text in logs:
        for p in html_pages(text):
            url = p["url"] or ""
            if MT_CREDIT not in url or url.rstrip("/").endswith("coursesaz") or "noncredit" in url:
                continue
            if p["status"] != "200":
                info["pages"].append({"url": url, "status": p["status"], "run": str(run), "courses": 0})
                continue
            name, code, prow, miss = parse_mtsac_credit_page(p["lines"], p["title"])
            missed += miss
            if code and name:
                info["headings"][code] = name
            for r in prow:
                r.update({"section": SECTION, "source_url": url, "read_at": p["read_at"], "run": str(run)})
            rows += prow
            info["pages"].append({"url": url, "status": p["status"], "run": str(run), "courses": len(prow),
                                  "heading": name})
    info["missed"] = missed
    return rows, info


# ── filing ─────────────────────────────────────────────────────────────────
COLLEGES = {
    "santa_ana": {"college": "Santa Ana College", "catalog_year": "2026-2027", "source": "runner PDF",
                  "source_url": "https://www.sac.edu/admissions/catalogarchive/SAC_2026-27_Catalog_11_03_26.pdf"},
    "mt_san_antonio": {"college": "Mt. San Antonio College", "catalog_year": "2026-2027", "source": "runner HTML",
                       "index_url": "https://catalog.mtsac.edu/programs/coursesaz/"},
}
# The noncredit header fields whose words describe that section alone; they move under "noncredit".
NONCREDIT_OWN = ("_what", "fetched_by", "fetched_at", "mark", "how_read", "parsed_by", "subject_headings",
                 "missed_upper_bound", "not_read", "pages", "runs", "courses", "codes_printed_twice")


def build_credit(slug, logs):
    meta = COLLEGES[slug]
    logs = [(str(run), clean_log(text)) for run, text in logs]
    if slug == "santa_ana":
        lines, span = sa_credit_lines(logs)
        rows, info = parse_santa_ana_credit(lines)
        info["span"] = span
        info["missed"] = info["codes_without_measure"]
    else:
        rows, info = mtsac_credit(logs)
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


def split_existing(doc):
    """(noncredit header, noncredit rows) of a filed document, whether or not credit rows were filed into it yet."""
    if "noncredit" in doc:
        head = doc["noncredit"]
    else:
        head = {k: doc[k] for k in NONCREDIT_OWN if k in doc}
    return head, [r for r in doc.get("rows") or [] if r.get("section") != SECTION]


def texts(slug, rows, info, runs):
    meta = COLLEGES[slug]
    if slug == "santa_ana":
        a, b = info["span"]
        how = ("college-page-read.yml on a GitHub runner: the census Reader fetched the college's own catalog PDF "
               "(robots.txt first, 4 s between loads, the user agent naming the CPL Initiative) and printed pages 1 to "
               "406 line for line (pypdf; plan santa_ana_credit_courses_1, keys pdf_span, pdf_page_cap, pdf_unfolded), "
               "run %s, its job log read back whole with gh. The credit course list runs from PDF page %d to %d."
               % (", ".join(runs), a, b))
        not_read = ("%d code lines in the credit list printed no Unit(s) line (missed_upper_bound; most are a "
                    "requisite's course on a line of its own), and %d printed a Credit(s) line and were left to the "
                    "noncredit section." % (info["missed"], info["noncredit_measures_skipped"]))
        pages = [{"url": meta["source_url"], "status": "200", "pdf_pages": [a, b], "run": r, "section": SECTION,
                  "courses": sum(1 for x in rows if x["run"] == r)} for r in runs]
    else:
        how = ("college-page-read.yml on a GitHub runner, through the census Reader (robots.txt first, 4 s between "
               "loads, the user agent naming the CPL Initiative), each credit subject page printed line for line by "
               "the capture view at the address the credit A to Z page links (plan mt_san_antonio_credit_index, run "
               "44991606237), in plans mt_san_antonio_credit_courses_1 to _3, runs %s, their job logs read back whole "
               "with gh." % ", ".join(runs))
        bad = [p for p in info["pages"] if p["status"] != "200"]
        not_read = ("%d code lines printed no Units line (missed_upper_bound). %d subject pages did not answer 200."
                    % (info["missed"], len(bad)))
        pages = [dict(p, section=SECTION) for p in info["pages"]]
    return how, not_read, pages


def write(slug, logs, root=ROOT, dry=False):
    meta = COLLEGES[slug]
    path = os.path.join(root, COURSES, slug + ".json.gz")
    with gzip.open(path, "rt", encoding="utf-8") as f:
        old = json.load(f)
    nc_head, nc_rows = split_existing(old)
    rows, info = build_credit(slug, logs)
    runs = sorted({str(r["run"]) for r in rows})
    nc_codes = {r["code"] for r in nc_rows}
    both = sorted(r["code"] for r in rows if r["code"] in nc_codes)
    rows = [r for r in rows if r["code"] not in nc_codes]      # a code filed in both sections stays the noncredit row
    how, not_read, pages = texts(slug, rows, info, runs)
    parsed = " ".join(l.strip() for l in __doc__.split("  " + slug + "  ")[1].split("\n\n")[0].split("\n")[1:])
    read_at = max((r["read_at"] for r in rows if r.get("read_at")), default=None)
    headings = dict(nc_head.get("subject_headings") or {})
    for k, v in info["headings"].items():
        headings.setdefault(k, v)
    no_heading = sum(1 for r in rows if not r.get("subject_name"))
    credit = {"fetched_by": FETCHED_BY, "fetched_at": read_at, "how_read": how,
              "parsed_by": parsed + " Parsed by kb/_file_credit_catalogs.py.",
              "subject_headings": dict(sorted(info["headings"].items())), "missed_upper_bound": info["missed"],
              "not_read": not_read, "runs": runs, "courses": len(rows), "no_heading": no_heading,
              "codes_printed_twice": info["codes_printed_twice"], "codes_in_both_sections": both}
    all_runs = sorted(set(nc_head.get("runs") or []) | set(runs))
    missed = (nc_head.get("missed_upper_bound") or 0) + info["missed"]
    what = ("%s's 2026-2027 course descriptions, credit and noncredit, one row per course its catalog prints: college, "
            "subject, the catalog's subject heading, code, title, units or hours as printed, requisites, description, "
            "source, read time. The noncredit rows come first, as Session 700 filed them (kb/_file_noncredit_catalogs.py; "
            "their header is under noncredit); the credit rows follow, each marked section credit (kb/_file_credit_"
            "catalogs.py; header under credit). Filed by %s under %s" % (meta["college"], FETCHED_BY, ORDER))
    doc = {"_what": what, "fetched_by": nc_head.get("fetched_by") + "; " + FETCHED_BY,
           "fetched_at": max(x for x in (nc_head.get("fetched_at"), read_at) if x), "college": meta["college"],
           "catalog_year": meta["catalog_year"]}
    for k in ("source_url", "index_url"):
        if k in old:
            doc[k] = old[k]
    doc.update({"mark": "Sky can read 2026-27 catalog", "subject_headings": dict(sorted(headings.items())),
                "missed_upper_bound": missed,
                "not_read": "The whole catalog's course list is read, credit and noncredit. " + not_read,
                "pages": nc_head.get("pages") or [], "pages_added": pages, "runs": all_runs,
                "courses": len(nc_rows) + len(rows),
                "codes_printed_twice": sorted(set(nc_head.get("codes_printed_twice") or []) |
                                              set(info["codes_printed_twice"])),
                "noncredit": nc_head, "credit": credit, "rows": nc_rows + rows})
    body = json.dumps(doc, ensure_ascii=False, indent=1) + "\n"
    if dry:
        return doc, info
    with open(path, "wb") as f:
        f.write(gzip.compress(body.encode("utf-8"), compresslevel=9, mtime=0))
    idx_path = os.path.join(root, COURSES, "index.json")
    with open(idx_path, encoding="utf-8") as f:
        idx = json.load(f)
    for c in idx["colleges"]:
        if c["slug"] == slug:
            c.pop("scope", None)
            c.update({"runs": all_runs, "courses": doc["courses"], "missed_upper_bound": missed,
                      "sha256_uncompressed": hashlib.sha256(body.encode("utf-8")).hexdigest(),
                      "read_at": doc["fetched_at"]})
    with open(idx_path, "w", encoding="utf-8") as f:
        json.dump(idx, f, indent=1, ensure_ascii=False)
        f.write("\n")
    return doc, info


def code_match_key(code):
    """A course code as the self-recall compares it: upper case, the number's leading zeros and a "-00" section
    suffix dropped (the catalog prints ACCT 010 and CMPR 198-00; the state list carries ACCT 10 and CMPR 198)."""
    subj, _, num = str(code).upper().partition(" ")
    num = re.sub(r"-\d\d$", "", num.replace(" ", ""))
    m = re.match(r"^([A-Z]?)0*(\d.*)$", num)
    return "%s %s" % (subj, (m.group(1) + m.group(2)) if m else num)


def self_recall(root, college, rows):
    """Codes and subjects of the filed credit rows beside the state list's credit courses (mark C) for the college."""
    src = open(os.path.join(root, "coci_lookup_data.js"), encoding="utf-8").read()
    j = json.loads(src[src.index("{"):src.rindex("}") + 1])
    idx = {i for i, n in enumerate(j.get("colleges") or []) if n == college}
    st = {code_match_key("%s %s" % (r[2], r[3])) for r in j.get("rows") or [] if r[0] in idx and r[6] == "C"}
    st_subj = {c.split(" ")[0] for c in st}
    filed = {code_match_key(r["code"]) for r in rows}
    f_subj = {r["subject"].upper() for r in rows}
    return {"courses_matched": len(filed & st), "courses_catalog_only": len(filed - st),
            "courses_state_only": len(st - filed), "subjects_matched": len(f_subj & st_subj),
            "subjects_catalog_only": sorted(f_subj - st_subj), "subjects_state_only": sorted(st_subj - f_subj)}


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
    doc, info = write(args[0], logs, dry="--write" not in argv)
    cr = [r for r in doc["rows"] if r.get("section") == SECTION]
    c = doc["credit"]
    print("%s: %d credit courses, %d subjects with a heading, no heading %d, missed_upper_bound %s, printed twice %s, "
          "in both sections %s" % (args[0], len(cr), len(c["subject_headings"]), c["no_heading"],
                                   c["missed_upper_bound"], c["codes_printed_twice"], c["codes_in_both_sections"]))
    print("rows in file: %d (noncredit %d)" % (len(doc["rows"]), len(doc["rows"]) - len(cr)))
    print("self-recall vs state list credit courses:", json.dumps(self_recall(ROOT, COLLEGES[args[0]]["college"], cr)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

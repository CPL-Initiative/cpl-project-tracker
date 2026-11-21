#!/usr/bin/env python3
"""File the courses of the subject pages a catalog's first read missed (S700, #3655).

WHY. Four colleges' course descriptions (kb/hand_filed_catalogs/courses/) were read from addresses made from the
subject code in lower case. Where the catalog's index links a subject at another address (Cerritos Mathematics
at /math/ for MATH and STAT, Long Beach City Social Work at /social-work/), the page was never read, so the
Subjects page counted it under pages not read. The read plans kb/college_reads/<slug>_course_descriptions_missed*
take each address from the index's own link (kb/hand_filed_catalogs/subjects/<slug>.json); this script parses
those job logs and adds the courses to the college's file, in the file's own row shape.

A course opens on its heading, by college:
  cerritos            "SUBJ NNN", then "<n> UNITS", then the title.
  southwestern        "SUBJ NNN", then the title, then "<n> UNITS".
  long_beach_city     "SUBJ NNN <units> unit(s)" (a C-ID mark may sit between), the title on the next line.
  monterey_peninsula  "SUBJ NNN - Title (<units> unit(s))", its grading and hours on the same line.
Its entry runs to the next course or the page's closing line. Requisite lines are kept whole; the first hours
line is hours_printed; a line "Label: text" that is not a requisite goes under other; the rest is the
description. A course whose code the file already holds is left as filed (a page that lists a course the first
read took is not a second course). Nothing is inferred: a page that printed no course adds a pages entry with
courses 0.

Usage: python3 kb/_file_missed_subject_pages.py <slug> <run id>=<job log> [<run id>=<job log> ...] [--write]
  A job log is the run's log with each line's timestamp stripped, the "##### PAGE" lines carrying
  " · read_at: <time>". Without --write it prints what it would add.
"""
import gzip
import hashlib
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
COURSES = os.path.join("kb", "hand_filed_catalogs", "courses")

SUBJ = r"[A-Z][A-Z&/_ ]{0,9}[A-Z]|[A-Z]"
NUM = r"C?\d[\w.]*"
UNITS = r"\d+(?:\.\d+)?(?:\s*(?:-|–|to)\s*\d+(?:\.\d+)?)?"
REQ = re.compile(r"^(Prerequisite|Corequisite|Pre/Corequisite|Recommended Preparation|Recommendation|Advisory|"
                 r"Limitation on Enrollment|Recommended Concurrent Enrollment)s?(\(s\))?\s*:", re.I)
HOURS = re.compile(r"^(Total Contact Hours:|(Lecture|Laboratory|Lab)\b.*\bhours?\b|\d+(\.\d+)? hours? (lecture|lab))", re.I)
GRADING = re.compile(r"^(Grade Only|Pass/No Pass.*|Letter Grade.*)$", re.I)
LABEL = re.compile(r"^[A-Z][A-Za-z /\-]{1,30}:\s")
END = re.compile(r"^(Back to top|©|Catalog Program Pages Referencing)", re.I)

STYLES = {
    "cerritos": {"head": re.compile(r"^(%s) (%s)$" % (SUBJ, NUM)), "units_at": 1, "title_at": 2,
                 "units": re.compile(r"^(%s) UNITS?$" % UNITS, re.I)},
    "southwestern": {"head": re.compile(r"^(%s) (%s)$" % (SUBJ, NUM)), "units_at": 2, "title_at": 1,
                     "units": re.compile(r"^(%s) UNITS?$" % UNITS, re.I)},
    "long_beach_city": {"head": re.compile(r"^(%s) (%s)\b.*?(%s) units?$" % (SUBJ, NUM, UNITS), re.I), "inline": True,
                        "title_at": 1},
    "monterey_peninsula": {"head": re.compile(r"^(%s) (%s) - (.+?) \((%s) units?\)(.*)$" % (SUBJ, NUM, UNITS)),
                           "inline_title": True},
}


def pages(log_text):
    """[(url, status, read_at, lines)] for each page a log printed."""
    out, cur = [], None
    for line in log_text.split("\n"):
        m = re.match(r"^##### PAGE \d+ .*?(?:read_at: (\S+))?$", line)
        if m:
            cur = {"url": None, "status": None, "read_at": m.group(1), "lines": [], "text": False, "title": ""}
            out.append(cur)
            continue
        if cur is None:
            continue
        if cur["text"]:
            cur["lines"].append(line)
        elif line.startswith("url: "):
            cur["url"] = line[5:].strip()
        elif line.startswith("status: "):
            cur["status"] = line[8:].strip()
        elif line.startswith("title: "):
            cur["title"] = line[7:].strip()
        elif line.startswith("--- the capture's text"):
            cur["text"] = True
    return out


def clean(line):
    return re.sub(r"\s+", " ", line.replace("​", "")).strip()


def subject_name(page_title):
    """The subject's name from the page's own title, "Design (DSGN) | LBCC": the text ahead of its code."""
    m = re.match(r"^(.+?)\s*\(([^()]*)\)\s*([|<]|$)", clean(page_title or ""))
    return m.group(1).strip() if m else None


def parse_page(slug, lines, page_title=""):
    """(subject_name, [course dict]) from one page's printed lines."""
    st = STYLES[slug]
    ls = [clean(l) for l in lines]
    ls = [l for l in ls if l and l != "(blank)"]
    starts = []
    for i, l in enumerate(ls):
        m = st["head"].match(l)
        if not m:
            continue
        if st.get("inline") or st.get("inline_title"):
            starts.append(i)
        elif i + st["units_at"] < len(ls) and st["units"].match(ls[i + st["units_at"]]):
            starts.append(i)
    name = subject_name(page_title)
    if not name and starts:   # a page whose title names the catalog alone: the heading just above its first course
        for l in ls[max(0, starts[0] - 6):starts[0]]:
            name = subject_name(l) or name
    out = []
    for n, i in enumerate(starts):
        end = starts[n + 1] if n + 1 < len(starts) else len(ls)
        for k in range(i + 1, end):
            if END.match(ls[k]):
                end = k
                break
        m = st["head"].match(ls[i])
        subj, num = m.group(1).strip(), m.group(2)
        row = {"subject": subj, "code": "%s %s" % (subj, num)}
        if st.get("inline_title"):
            row["title"], units = m.group(3).strip(), m.group(4)
            body = ([m.group(5).strip()] if m.group(5).strip() else []) + ls[i + 1:end]
            row["units_line"] = re.search(r"\((%s units?)\)" % UNITS, ls[i]).group(0)
        elif st.get("inline"):
            row["title"], units, body = ls[i + 1], m.group(3), ls[i + 2:end]
            row["units_line"] = re.search(r"(%s units?)$" % UNITS, ls[i], re.I).group(1)
        else:
            row["title"] = ls[i + st["title_at"]]
            units = st["units"].match(ls[i + st["units_at"]]).group(1)
            body = ls[i + 3:end]
        row["units"] = re.sub(r"\s*(–|to)\s*", "-", units).replace(" ", "")
        reqs, other, desc = [], [], []
        for l in body:
            if REQ.match(l):
                reqs.append(l)
            elif "hours_printed" not in row and HOURS.match(l):
                row["hours_printed"] = l
            elif slug == "southwestern" and "grading" not in row and GRADING.match(l):
                row["grading"] = l
            elif LABEL.match(l) and len(l) < 200:
                other.append(l)
            else:
                desc.append(l)
        if reqs:
            row["requisites"] = reqs
        row["description"] = " ".join(desc)
        if other:
            row["other"] = other
        if st.get("inline") or st.get("inline_title"):
            row["entry_printed"] = " ".join(body)
        out.append(row)
    return name, out


def add(slug, logs, write=False, root=ROOT):
    path = os.path.join(root, COURSES, slug + ".json.gz")
    with gzip.open(path, "rt", encoding="utf-8") as f:
        doc = json.load(f)
    have = {r["code"] for r in doc["rows"]}
    first = doc["rows"][0]
    report, new_rows, new_pages = [], [], []
    for run, text in logs:
        for p in pages(text):
            name, rows = parse_page(slug, p["lines"], p["title"]) if p["status"] == "200" else (None, [])
            kept = []
            for r in rows:
                if r["code"] in have:
                    continue
                have.add(r["code"])
                full = {"college": first["college"], "catalog_year": first["catalog_year"], "subject": r.pop("subject")}
                if "subject_name" in first and name:
                    full["subject_name"] = name
                full.update(r)
                full.update({"source_url": p["url"], "read_at": p["read_at"], "run": str(run)})
                kept.append(full)
            new_rows += kept
            new_pages.append({"url": p["url"], "status": p["status"], "courses": len(kept),
                              "already_filed": len(rows) - len(kept), "run": str(run)})
            report.append("%s  status %s  %d printed, %d added  (%s)" % (p["url"], p["status"], len(rows), len(kept),
                          ", ".join(sorted({r["subject"] for r in kept})) or "none"))
    if write and new_pages:
        doc["rows"] += new_rows
        doc["courses"] = len(doc["rows"])
        if isinstance(doc.get("pages"), list):
            doc["pages"] += new_pages
        else:
            doc["pages_added"] = (doc.get("pages_added") or []) + new_pages
        runs = sorted({str(run) for run, _ in logs})
        doc["missed_pages"] = ("S700 (2026-11-21, #3655): %d subject pages the index links at their own addresses, "
                               "read in runs %s and parsed by kb/_file_missed_subject_pages.py; %d courses added."
                               % (len(new_pages), ", ".join(runs), len(new_rows)))
        body = json.dumps(doc, ensure_ascii=False, indent=1) + "\n"
        idx_path = os.path.join(root, COURSES, "index.json")
        idx = json.load(open(idx_path, encoding="utf-8"))
        with open(path, "wb") as f:
            f.write(gzip.compress(body.encode("utf-8"), compresslevel=9, mtime=0))
        for c in idx["colleges"]:
            if c["slug"] == slug:
                c["courses"] = len(doc["rows"])
                c["runs"] = sorted(set(c["runs"]) | set(runs))
                c["sha256_uncompressed"] = hashlib.sha256(body.encode("utf-8")).hexdigest()
        with open(idx_path, "w", encoding="utf-8") as f:
            json.dump(idx, f, indent=1, ensure_ascii=False)
            f.write("\n")
    return report, new_rows


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    if len(args) < 2:
        print(__doc__)
        return 2
    logs = []
    for a in args[1:]:
        run, path = a.split("=", 1)
        logs.append((run, open(path, encoding="utf-8").read()))
    report, rows = add(args[0], logs, write="--write" in argv)
    print("\n".join(report))
    print("%d courses %s" % (len(rows), "added" if "--write" in argv else "would be added"))
    for r in rows[:3]:
        print(json.dumps(r, ensure_ascii=False)[:400])
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

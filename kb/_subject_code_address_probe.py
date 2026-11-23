#!/usr/bin/env python3
"""Read a subject's catalog page at its code's address when the catalog's index leaves it out (S718).

WHY. Sam, 2026-11-23, in session: the Subjects tab listed Cerritos's INST (one COCI course, INST 273 Mental Health
Worker Field Experience) with no title. A web search found
https://cerritos-public.courseleaf.com/degrees-certificates-courses/course-descriptions/inst/ , headed
"Interdisciplinary Studies (INST)" with four courses. Our procedure read only the subjects the course-descriptions
index links (S698: "a subject's page is read at the address the index gives and never at one made from its code"),
and Cerritos's index links no INST (run 45269415030 read it: nothing under I). S698's rule stays for every code the
index lists. A code the state list carries and the index omits is read once at its code's address, and its heading
is filed only when the page names that code in parentheses ("Interdisciplinary Studies (INST)"); a 404 or a page that
names another code files nothing and is recorded as tried.

Two steps:
  plan   writes kb/college_reads/<slug>_code_address_probe.json for each college whose catalog is one page per subject
         (an index filed by kb/_file_subject_headings.py --index), listing the untitled codes COCI carries and the
         catalog does not. A push of the plans runs college-page-read.yml on the runner (the session cannot reach
         college sites).
  file   reads that job's log and adds each confirmed heading to kb/hand_filed_catalogs/subjects/<slug>.json as rule
         code_address, with the run, and each code tried without a match under code_address_tried.

  python3 kb/_subject_code_address_probe.py plan [--write]
  python3 kb/_subject_code_address_probe.py file <job log> --run <run id> [--write]
"""
import argparse
import glob
import json
import os
import posixpath
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from subject_title_case import title_case  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUBJECTS = os.path.join("kb", "hand_filed_catalogs", "subjects")
TITLES = os.path.join("kb", "status", "local_subject_titles.json")
PLANS = os.path.join("kb", "college_reads")
RULE = "code_address"
SEARCH_RULE = "search_page"
SEARCHES = os.path.join("kb", "reference", "subject_web_searches.json")
TS = re.compile(r"^\d{4}-\d\d-\d\dT[\d:.]+Z ?")


def code_key(s):
    return re.sub(r"\s+", "", str(s or "")).upper()


def slug_of_code(code):
    return re.sub(r"[^a-z0-9]", "", str(code).lower())


def load(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return json.load(f)


def index_base(rows):
    """The directory the index's subject addresses share (…/course-descriptions/)."""
    addrs = [r["address"] for r in rows if r.get("rule") == "index" and r.get("address")]
    if not addrs:
        return None
    bases = {posixpath.dirname(a.rstrip("/")) + "/" for a in addrs}
    return sorted(bases, key=lambda b: -sum(1 for a in addrs if a.startswith(b)))[0]


def plans():
    t = load(TITLES)
    cols = t["columns"]
    by = {c["slug"]: (c["college"], [dict(zip(cols, r)) for r in c["rows"]]) for c in t["colleges"]}
    out = {}
    for path in sorted(glob.glob(os.path.join(ROOT, SUBJECTS, "*.json"))):
        slug = os.path.basename(path)[:-5]
        d = json.load(open(path, encoding="utf-8"))
        rows = d.get("rows") or []
        base = index_base(rows)
        if not base or slug not in by:
            continue
        tried = {code_key(x.get("code")) for x in d.get("code_address_tried") or []}
        have = {code_key(r.get("code")) for r in rows}
        college, trows = by[slug]
        codes = [r["code"] for r in trows if not r["printed_name"] and r["side"] == "state"
                 and code_key(r["code"]) not in have and code_key(r["code"]) not in tried]
        if not codes:
            continue
        out[slug] = {
            "_readme": "S718 (SkyPetrel), 2026-11-23: the codes COCI carries at %s that its course-descriptions index "
                       "does not list, each read once at its code's address (kb/_subject_code_address_probe.py). A "
                       "heading is filed only when the page names the code in parentheses. No model call." % college,
            "college": college,
            "questions": {"code_" + slug_of_code(c): "Does %s's catalog print a %s page, and under what heading?" % (college, c) for c in codes},
            "keywords": [re.escape(c) for c in codes],
            "pages": [{"url": base + slug_of_code(c) + "/", "answers": ["code_" + slug_of_code(c)]} for c in codes],
        }
    add_search_pages(out, by)
    return out


def add_search_pages(out, by):
    """A web search a session filed (kb/reference/subject_web_searches.json) that found a page and recorded no title:
    Cerritos's INST search of 2026-11-21 found the INST catalog page, and the search result did not show its heading,
    so no one read it. Each such page is read once, under the same test: its heading must name the code."""
    srch = load(SEARCHES).get("searches") or []
    for x in srch:
        if x.get("title") or not x.get("result_url") or x.get("college") not in by:
            continue
        slug, code, url = x["college"], x["local_code"], x["result_url"]
        url = re.sub(r"^http://", "https://", url)    # a plan reads https only (tests/college_page_read_test.py)
        path = os.path.join(ROOT, SUBJECTS, slug + ".json")
        d = json.load(open(path, encoding="utf-8")) if os.path.exists(path) else {}
        done = {(code_key(t.get("code")), t.get("address")) for t in (d.get("code_address_tried") or [])}
        done |= {(code_key(r.get("code")), r.get("address")) for r in (d.get("rows") or [])}
        if (code_key(code), url) in done or (code_key(code), re.sub(r"^https://", "http://", url)) in done:
            continue
        p = out.setdefault(slug, {
            "_readme": "S718 (SkyPetrel), 2026-11-23: pages for %s read by kb/_subject_code_address_probe.py. A heading "
                       "is filed only when the page names the code in parentheses. No model call." % by[slug][0],
            "college": by[slug][0], "questions": {}, "keywords": [], "pages": []})
        q = "code_" + slug_of_code(code)
        p["questions"][q] = "Does this page name %s's %s, and under what heading?" % (by[slug][0], code)
        if re.escape(code) not in p["keywords"]:
            p["keywords"].append(re.escape(code))
        if not any(pg["url"] == url for pg in p["pages"]):
            p["pages"].append({"url": url, "answers": [q], "source": "web_search"})


def parse_log(text):
    """Each page the read printed: url, status, and its whole-page text."""
    pages, cur, in_text = [], None, False
    for raw in text.splitlines():
        line = TS.sub("", raw)
        if line.startswith("##### PAGE"):
            cur = {"text": []}
            pages.append(cur)
            in_text = False
            continue
        if cur is None:
            continue
        if line.startswith("=== COLLEGE PAGE READ JSON"):
            cur, in_text = None, False
            continue
        if in_text:
            cur["text"].append(line)
        elif line.startswith("url: "):
            cur["url"] = line[5:].strip()
        elif line.startswith("final_url: "):
            cur["final_url"] = line[11:].strip()
        elif line.startswith("status: "):
            cur["status"] = line[8:].strip()
        elif line.startswith("--- text (whole page) ---"):
            in_text = True
    return pages


HEAD = re.compile(r"^\s*(.+?)\s*\(([A-Z0-9/&,.\s]+)\)\s*$")


def heading_for(page, code):
    """The page's heading when it names `code` in parentheses; else None. A page may open with its breadcrumb or the
    site's menu (Long Beach City: "Home› · Course Descriptions› · Creative Arts (CART)"), so the first segments that
    read "Name (CODE)" are searched, and the first that names this code wins."""
    segs = [x.strip().rstrip("›").strip() for x in " ".join(page.get("text") or []).split(" · ")][:40]
    for seg in segs:
        m = HEAD.match(seg)
        if m and code_key(code) in [code_key(x) for x in re.split(r"[&,]", m.group(2)) if x.strip()]:
            return m.group(1), seg
    named = next((x for x in segs if HEAD.match(x)), None)
    return None, (named or (segs[0] if segs else ""))[:80]


def file_log(text, run, write):
    pages = parse_log(text)
    by_url = {p.get("url"): p for p in pages}
    plan_set = plans_on_disk()
    report = []
    for slug, plan in sorted(plan_set.items()):
        path = os.path.join(ROOT, SUBJECTS, slug + ".json")
        d = json.load(open(path, encoding="utf-8")) if os.path.exists(path) else {
            "_what": "%s's subject headings, filed by kb/_subject_code_address_probe.py from pages read one by one "
                     "(no course-descriptions index is filed for this college)." % plan["college"],
            "college": plan["college"], "run": run, "source": [], "subjects": 0, "with_heading": 0, "rows": []}
        changed = False
        for pg in plan["pages"]:
            code = next(k for k, v in plan["questions"].items() if k == pg["answers"][0])
            code = [c for c in plan["keywords"] if "code_" + slug_of_code(c.replace("\\", "")) == code][0].replace("\\", "")
            p = by_url.get(pg["url"])
            if not p:
                continue
            ok = str(p.get("status")) == "200"
            heading, seen = heading_for(p, code) if ok else (None, None)
            if heading:
                d["rows"].append({"code": code, "heading": title_case(heading), "heading_printed": heading, "rule": SEARCH_RULE if pg.get("source") == "web_search" else RULE,
                                  "codes": [code], "candidate": None, "label": seen, "address": pg["url"], "run": run})
                report.append("%s %s: %s" % (slug, code, title_case(heading)))
            else:
                d.setdefault("code_address_tried", []).append({"code": code, "address": pg["url"], "status": p.get("status"),
                                                               "first_line": seen, "run": run})
                report.append("%s %s: no heading (status %s%s)" % (slug, code, p.get("status"), ", reads " + seen if seen else ""))
            changed = True
        if changed:
            d["rows"].sort(key=lambda r: code_key(r.get("code")))
            d["subjects"] = len(d["rows"])
            d["with_heading"] = sum(1 for r in d["rows"] if r.get("heading"))
            if write:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(json.dumps(d, ensure_ascii=False, indent=1) + "\n")
    return report


def plans_on_disk():
    out = {}
    for path in glob.glob(os.path.join(ROOT, PLANS, "*_code_address_probe.json")):
        out[os.path.basename(path)[:-len("_code_address_probe.json")]] = json.load(open(path, encoding="utf-8"))
    return out


def main(argv):
    ap = argparse.ArgumentParser()
    ap.add_argument("step", choices=["plan", "file"])
    ap.add_argument("log", nargs="?")
    ap.add_argument("--run")
    ap.add_argument("--write", action="store_true")
    a = ap.parse_args(argv)
    if a.step == "plan":
        P = plans()
        for slug, p in sorted(P.items()):
            print("%s: %d codes (%s)" % (slug, len(p["pages"]), ", ".join(k.replace("\\", "") for k in p["keywords"])))
            if a.write:
                with open(os.path.join(ROOT, PLANS, slug + "_code_address_probe.json"), "w", encoding="utf-8") as f:
                    f.write(json.dumps(p, ensure_ascii=False, indent=1) + "\n")
        return 0
    if not a.log or not a.run:
        ap.error("file needs a log and --run")
    for line in file_log(open(a.log, encoding="utf-8").read(), a.run, a.write):
        print(line)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

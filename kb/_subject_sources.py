#!/usr/bin/env python3
"""Every college's local subject titles by source: one row per college, a status for each way to look (S717).

Sam, 2026-11-23 (S715, the Subjects card mock's Colleges artboard): the Subjects tab lists each college's own subject
titles and each way we look for them, in the order we try them, with a status word for each attempt. The ways are
the ladder of d-subject-title-sources-ladder-s712: the catalog's course descriptions, the catalog system's public data
(curriQunet, eLumen), the class schedule (HTML or PDF), and a department list. COCI and the MIS reports carry no
subject names, so neither is a way.

Inputs, all committed:
  - kb/status/commons_data.json: the 118 colleges, each one's slug, name and catalog platform;
  - kb/status/statewide_subject_codes.json: each college's codes in the state course list (its college-and-code pairs);
  - kb/status/local_subject_titles.json: the colleges whose catalog is read, each one's titled codes, its codes not
    read yet and not in the catalog, and the rows a department list titled;
  - kb/reference/subject_source_attempts.json: the attempts the titles file cannot show (a probe sent, a way blocked,
    a read by hand), newest last.

Status words, per way: Read, Probing, To try, Blocked, Not needed, No system. A way is Read when the titles file or
the register says so. The catalog system way is No system unless the catalog platform is curriQunet or eLumen. Once
the catalog is read, every other way with no attempt of its own is Not needed. Next names the attempt under way, else the first
way left in the ladder's order. Writes kb/status/subject_sources.json; --if-changed leaves it untouched when nothing but the stamp
moved. Pure stdlib, no network, no model call.
"""
import argparse
import hashlib
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = "kb/status/subject_sources.json"
COLLEGES = "kb/status/commons_data.json"
STATEWIDE = "kb/status/statewide_subject_codes.json"
TITLES = "kb/status/local_subject_titles.json"
ATTEMPTS = "kb/reference/subject_source_attempts.json"

WAYS = ("catalog", "system", "schedule", "department")
WAY_WORDS = {"catalog": "Catalog", "system": "Catalog system", "schedule": "Class schedule", "department": "Department list"}
SYSTEMS = ("curriqunet", "elumen")
STATUS_WORDS = {"read": "Read", "probing": "Probing", "to_try": "To try", "blocked": "Blocked",
                "not_needed": "Not needed", "no_system": "No system"}
DEPT_SOURCE = "the college's department list"
PLATFORM_WORDS = {"courseleaf": "CourseLeaf", "pdf": "PDF", "curriqunet": "curriQunet", "elumen": "eLumen",
                  "custom_html": "Own pages", "acalog": "Acalog", "coursedog": "Coursedog", "smartcatalog": "SmartCatalog"}


def load(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return json.load(f)


def fix_name(s):
    """A college name some exports carry as UTF-8 read as Latin-1 ("CaÃ±ada"), put back; any other name as is."""
    try:
        t = s.encode("latin-1").decode("utf-8")
        return t if t != s else s
    except (UnicodeEncodeError, UnicodeDecodeError):
        return s


def pairs_by_college(sw):
    n = {}
    for c in sw.get("codes") or []:
        for x in c.get("colleges") or []:
            name = fix_name(x[0])
            n[name] = n.get(name, 0) + 1
    return n


def titles_by_slug(t):
    cols = t.get("columns") or []
    src = cols.index("title_source") if "title_source" in cols else None
    out = {}
    for c in t.get("colleges") or []:
        rows = c.get("rows") or []
        dept = sum(1 for r in rows if src is not None and r[src] == DEPT_SOURCE)
        out[c["slug"]] = {"named": c.get("named") or 0, "codes": c.get("codes") or len(rows),
                          "not_read": c.get("not_read") or 0, "blocked": c.get("blocked") or 0,
                          "not_in_catalog": c.get("not_in_catalog") or 0, "department_rows": dept,
                          "read_at": c.get("read_at"), "catalog_year": c.get("catalog_year")}
    return out


def plural(n, one, many):
    return f"{n:,} {one if n == 1 else many}"


def next_step(platform, status, tc):
    """The first step left, in plain words. A read catalog with codes still untitled says what is left of them."""
    if tc:
        if tc["not_read"]:
            return plural(tc["not_read"], "code", "codes") + " not read yet: read their catalog pages"
        if tc["blocked"]:
            return plural(tc["blocked"], "code is", "codes are") + " blocked: a person's hand-over"
        if tc["not_in_catalog"]:
            return plural(tc["not_in_catalog"], "code", "codes") + " not in the catalog: a person's title"
        return "Every code has a title"
    for w in WAYS:   # an attempt under way comes first: its answer may settle the rest
        if status[w]["status"] == "probing":
            d = status[w].get("date") or ""
            return f"Read the catalog system's subject list (probe sent {d})" if w == "system" else f"Finish the {WAY_WORDS[w].lower()} read (started {d})"
    for w in WAYS:
        if status[w]["status"] == "to_try":
            if w == "catalog":
                if platform == "pdf":
                    return "Read the course section of the catalog PDF"
                if platform == "courseleaf":
                    return "Read the CourseLeaf course descriptions pages"
                return "Read the catalog's course descriptions"
            if w == "system":
                return "Read the catalog system's subject list"
            if w == "schedule":
                return "Read the class schedule's subject list"
            return "Find the college's department list"
    return "Every way is blocked: a person's hand-over"


def build(colleges, sw, titles, attempts):
    pairs = pairs_by_college(sw)
    tby = titles_by_slug(titles)
    reg = (attempts or {}).get("colleges") or {}
    rows, totals = [], {"colleges": 0, "titled": 0, "titles_needed": 0,
                        "by_way": {w: {k: 0 for k in STATUS_WORDS} for w in WAYS}}
    for c in colleges.get("colleges") or []:
        slug, name = c["slug"], c["name"]
        platform = c.get("platform") or ""
        tc = tby.get(slug)
        mine = reg.get(slug) or {}
        status = {}
        for w in WAYS:
            hist = mine.get(w) or []
            last = hist[-1] if hist else None
            if w == "catalog" and tc:
                s = {"status": "read", "date": (tc.get("read_at") or "")[:10] or None, "note": f"{tc.get('catalog_year') or ''} catalog read".strip()}
            elif w == "department" and tc and tc["department_rows"]:
                s = {"status": "read", "date": None, "note": plural(tc["department_rows"], "code", "codes") + " titled from it"}
            elif last:
                s = {"status": last["status"], "date": last.get("date"), "note": last.get("note")}
            elif w == "system" and platform not in SYSTEMS:
                s = {"status": "no_system", "date": None, "note": None}
            elif tc:
                s = {"status": "not_needed", "date": None, "note": None}
            else:
                s = {"status": "to_try", "date": None, "note": None}
            if hist:
                s["attempts"] = len(hist)
            status[w] = s
            totals["by_way"][w][s["status"]] += 1
        named = tc["named"] if tc else 0
        rows.append({"slug": slug, "college": name, "kind": c.get("kind"), "platform": platform,
                     "platform_words": PLATFORM_WORDS.get(platform, platform or "Not known"),
                     "codes": pairs.get(name, 0), "titled": named, "catalog_on_file": bool(tc),
                     "ways": status, "next": next_step(platform, status, tc)})
        totals["colleges"] += 1
        totals["titled" if tc else "titles_needed"] += 1
    rows.sort(key=lambda r: (r["catalog_on_file"], -r["codes"], r["college"]))
    return {"_what": "Every college's local subject titles by source: one row per college, a status for each way to look, "
                     "in the ladder's order, and the next step. Written by kb/_subject_sources.py; nothing here is a decision.",
            "_rule": "A way is Read when the titles file or the attempts register says so. The catalog system way is No system "
                     "unless the platform is curriQunet or eLumen. Once the catalog is read, a way with no attempt of its own is "
                     "Not needed. COCI and the MIS reports carry no subject names, so neither is a way.",
            "_sources": {"colleges": COLLEGES, "codes": STATEWIDE, "titles": TITLES, "attempts": ATTEMPTS},
            "ways": [[w, WAY_WORDS[w]] for w in WAYS], "status_words": STATUS_WORDS,
            "totals": totals, "colleges": rows}


def dump(doc):
    return json.dumps(doc, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n"


def fingerprint(doc):
    body = {k: v for k, v in (doc or {}).items() if k not in ("fingerprint",)}
    return hashlib.sha256(dump(body).encode("utf-8")).hexdigest()


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--out", default=os.path.join(ROOT, OUT))
    ap.add_argument("--if-changed", action="store_true", help="leave the file untouched when nothing changed")
    ap.add_argument("--check", action="store_true", help="exit 1 when the committed file is not what a build writes")
    a = ap.parse_args(argv)
    doc = build(load(COLLEGES), load(STATEWIDE), load(TITLES), load(ATTEMPTS))
    doc["fingerprint"] = fingerprint(doc)
    text = dump(doc)
    old = None
    if os.path.exists(a.out):
        with open(a.out, encoding="utf-8") as f:
            old = f.read()
    if a.check:
        if old != text:
            print(f"[subject_sources] {OUT} is stale: run python3 kb/_subject_sources.py")
            return 1
        return 0
    if a.if_changed and old == text:
        print(f"[subject_sources] unchanged; {OUT} left as built")
        return 0
    with open(a.out, "w", encoding="utf-8") as f:
        f.write(text)
    t = doc["totals"]
    print(f"[subject_sources] {t['colleges']} colleges: {t['titled']} with a catalog read, {t['titles_needed']} still to title")
    return 0


if __name__ == "__main__":
    sys.exit(main())

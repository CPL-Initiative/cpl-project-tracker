#!/usr/bin/env python3
"""The noncredit subject title list, from the four large noncredit programs' catalog headings (S700, #3655).

WHY. Sam, 2026-11-21 (relayed by COBIx on #3655, comment 7069586791): hold every noncredit subject title and common
code until the catalogs of the four large noncredit programs are filed, "build the noncredit subject title list from
those, then line the smaller programs up with it". The four are North Orange Continuing Education, San Diego College
of Continuing Education, Mt. San Antonio College's noncredit program and Santa Ana College's School of Continuing
Education (kb/hand_filed_catalogs/courses/). This script reads ONLY those four files' subject headings, groups the
headings that name one subject, and says for each which noncredit category its courses sit under in the COCI export
and which noncredit MQ discipline and common subject code that category has. It files
kb/status/noncredit_subject_titles.json. The titles stand on Sam's word of 2026-11-22 ("Looks good ... Can we go with
it and I can look more closely tomorrow and reverse or change anything that looks wrong?",
r-noncredit-title-list-go-sam-2026-11-22) and are his to change; the recommender lines the smaller programs'
noncredit codes up with it. The four categories with no common code keep none and show by name
(d-noncredit-four-categories-no-code-s701, Sky's call, his to revise).

WHAT IT DOES NOT GUESS.
  The category of a heading is counted, never inferred from its words: the COCI export's Non_Credit_Category of the
  noncredit courses under that college's code (kb/status/noncredit_categories.json), most courses first, with the
  share. A code COCI does not hold (North Orange's Kids College) has none.
  Two headings are one title only when they are equal after folding case, "&", punctuation and a trailing campus
  mark ("Music - NOCE"), or when SYNONYMS names them. SYNONYMS holds the four pairs the brief names and their
  plain variants; nothing else is merged, so a reader sees each remaining heading under its category and decides.
  A category's MQ discipline and common code come from MQ, below: the five noncredit disciplines that hold a
  common code today, and the categories that have none, named and marked as having no code yet (Sam, 2026-11-21).

No clock is read; the same inputs write the same bytes.

Usage: python3 kb/_build_noncredit_subject_titles.py            (write the file)
       python3 kb/_build_noncredit_subject_titles.py --check    (fail if the committed file is stale)
"""
import gzip
import json
import os
import re
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from subject_title_case import title_case  # noqa: E402

CATALOGS = os.path.join("kb", "hand_filed_catalogs", "courses")
CATEGORIES = os.path.join("kb", "status", "noncredit_categories.json")
OUT = os.path.join("kb", "status", "noncredit_subject_titles.json")

PROGRAMS = ["north_orange_continuing_education", "san_diego_of_continuing_education", "mt_san_antonio", "santa_ana"]

# The pairs the brief names (COBIx on #3655: "ESL Classes with English as a Second Language, Adult Basic Education
# with Basic Skills, Parenting with Parent Education, and Emeritus with Older Adult"), each with its plain variants.
SYNONYMS = {
    "English as a Second Language": ["esl classes", "english as a second language", "esl"],
    "Basic Skills": ["adult basic education", "basic skills"],
    "Parent Education": ["parenting", "parent education"],
    "Older Adults": ["emeritus", "older adult", "older adults"],
}

# A COCI noncredit category -> the noncredit MQ discipline and its common subject code. The five with a code are in
# kb/discipline_canonical_subj4.json; the rest have no common code yet and are shown by name (Sam, 2026-11-21).
MQ = {
    "English as a Second Language (ESL)": ("English as a Second Language (ESL): Noncredit", "ESLN"),
    "Elementary and Secondary Basic Skills": ("Interdisciplinary-Basic Skills: Noncredit", "BSKL"),
    "Courses for Older Adults": ("Older Adults: Noncredit", "OLAD"),
    "Parenting": ("Parent Education: Noncredit", "PARN"),
    "Short-term Vocational": ("Vocational", "VOCE"),
    "Citizenship for Immigrants": ("Citizenship: Noncredit", None),
    "Health & Safety": ("Health and Safety: Noncredit", None),
    "Home Economics": ("Home Economics: Noncredit", None),
    "Courses for Persons with Substantial Disabilities": ("Disabled Student Programs and Services: Noncredit", None),
    "Workforce Preparation": (None, None),
}
NO_CATEGORY = "(no category in the export)"


def norm(t):
    t = (t or "").lower().replace("&", " and ")
    t = re.sub(r"\s*[-–]\s*(noce|cec)\s*$", "", t)        # a trailing campus mark: "Music - NOCE", "Counseling - CEC"
    return re.sub(r"[^a-z0-9]+", " ", t).strip()


def college_key(s):
    return re.sub(r"[^a-z0-9]+", " ", (s or "").lower()).strip()


def group_title(heading):
    """(key, title): the synonym group a heading belongs to, else the heading itself."""
    n = norm(heading)
    for title, names in SYNONYMS.items():
        if n in names:
            return norm(title), title
    shown = re.sub(r"\s*[-–]\s*(NOCE|CEC)\s*$", "", heading or "", flags=re.I)
    return n, title_case(shown)


def read_program(root, slug):
    with gzip.open(os.path.join(root, CATALOGS, slug + ".json.gz"), "rt", encoding="utf-8") as f:
        d = json.load(f)
    by = defaultdict(Counter)
    for r in d.get("rows") or []:
        by[str(r.get("subject") or "").strip().upper()][str(r.get("subject_name") or "").strip()] += 1
    out = []
    for code in sorted(by):
        names = Counter({k: v for k, v in by[code].items() if k})
        heading = sorted(names.items(), key=lambda kv: (-kv[1], kv[0]))[0][0] if names else None
        out.append({"code": code, "heading": heading, "catalog_courses": sum(by[code].values())})
    return out


def build(root=ROOT):
    cats = json.load(open(os.path.join(root, CATEGORIES), encoding="utf-8"))
    cat_by = {}
    for c in cats["colleges"]:
        for code, _cr, nc, parts in c["codes"]:
            cat_by[(college_key(c["college"]), code)] = (nc, parts)
    index = json.load(open(os.path.join(root, CATALOGS, "index.json"), encoding="utf-8"))
    names = {c["slug"]: c["college"] for c in index["colleges"]}     # the college's name as the state list writes it
    programs, headings, groups = [], [], {}
    for slug in PROGRAMS:
        college, rows = names[slug], read_program(root, slug)
        programs.append({"slug": slug, "college": college, "subject_codes": len(rows),
                         "with_heading": sum(1 for r in rows if r["heading"])})
        for r in rows:
            nc, parts = cat_by.get((college_key(college), r["code"]), (0, []))
            named = [(n, k) for n, k in parts if n != NO_CATEGORY]
            top = sorted(named, key=lambda p: (-p[1], p[0]))[0] if named else None
            h = {"college": slug, "code": r["code"], "heading": r["heading"], "catalog_courses": r["catalog_courses"],
                 "noncredit_courses_in_coci": nc, "category": top[0] if top else None,
                 "category_courses": top[1] if top else 0,
                 "other_categories": [[n, k] for n, k in sorted(named, key=lambda p: (-p[1], p[0]))[1:]]}
            headings.append(h)
            if not r["heading"]:
                continue
            key, title = group_title(r["heading"])
            g = groups.setdefault(key, {"title": title, "printed": Counter(), "members": [], "cats": Counter(), "courses": 0})
            g["printed"][r["heading"]] += 1
            g["members"].append({"college": slug, "code": r["code"], "heading": r["heading"]})
            g["courses"] += r["catalog_courses"]
            for n, k in named:
                g["cats"][n] += k
    titles = []
    for key in sorted(groups):
        g = groups[key]
        ranked = sorted(g["cats"].items(), key=lambda kv: (-kv[1], kv[0]))
        cat = ranked[0][0] if ranked else None
        total = sum(g["cats"].values())
        mq, code = MQ.get(cat, (None, None)) if cat else (None, None)
        titles.append({
            "title": g["title"],
            "printed_as": [k for k, _ in sorted(g["printed"].items(), key=lambda kv: (-kv[1], kv[0]))],
            "programs": len({m["college"] for m in g["members"]}),
            "members": g["members"], "catalog_courses": g["courses"],
            "category": cat, "category_share": round(ranked[0][1] / total, 3) if total else None,
            "categories": [[n, k] for n, k in ranked],
            "mq_discipline": mq, "common_code": code,
            "state": ("no noncredit course in COCI" if not cat else
                      "one category" if len(ranked) == 1 or ranked[0][1] / total >= 0.9 else "several categories"),
        })
    order = {c: i for i, c in enumerate(MQ)}
    titles.sort(key=lambda t: (order.get(t["category"], 99), -t["programs"], -t["catalog_courses"], t["title"]))
    by_cat = Counter(t["category"] or "none in COCI" for t in titles)
    return {
        "_what": ("The noncredit subject title list, drafted from the subject headings of the four large noncredit "
                  "programs' catalogs only (Sam, 2026-11-21, relayed by COBIx on #3655). Each title lists the headings "
                  "printed for it, the programs that print it, and the COCI noncredit category its courses sit under, "
                  "counted from the export, with that category's noncredit MQ discipline and common subject code "
                  "where one exists. The titles stand on Sam's word of 2026-11-22 (r-noncredit-title-list-go-sam-"
                  "2026-11-22) and are his to change; a category with no common code keeps none and shows by name. "
                  "The recommender lines the smaller programs' noncredit codes up with it. Built by "
                  "kb/_build_noncredit_subject_titles.py; no clock is read."),
        "_rule": ("Two headings are one title when they are equal after folding case, '&', punctuation and a trailing "
                  "campus mark, or when the synonym list names them: " + "; ".join(
                      "%s (%s)" % (t, ", ".join(n)) for t, n in SYNONYMS.items()) + ". Nothing else is merged. "
                  "state says one category where 90% or more of a title's noncredit courses sit under one category, "
                  "several categories otherwise."),
        "mq": {c: {"mq_discipline": d, "common_code": k, "note": None if k else "no common subject code yet"}
               for c, (d, k) in MQ.items()},
        "programs": programs,
        "totals": {"headings": sum(1 for h in headings if h["heading"]), "codes": len(headings), "titles": len(titles),
                   "titles_in_two_or_more_programs": sum(1 for t in titles if t["programs"] >= 2),
                   "with_common_code": sum(1 for t in titles if t["common_code"]),
                   "category_without_code": sum(1 for t in titles if t["category"] and not t["common_code"]),
                   "no_noncredit_course_in_coci": sum(1 for t in titles if not t["category"]),
                   "several_categories": sum(1 for t in titles if t["state"] == "several categories"),
                   "by_category": dict(sorted(by_cat.items()))},
        "titles": titles,
        "headings": headings,
    }


def dump(doc):
    return json.dumps(doc, indent=1, ensure_ascii=False) + "\n"


def main(argv):
    text = dump(build())
    path = os.path.join(ROOT, OUT)
    if "--check" in argv:
        if not os.path.exists(path) or open(path, encoding="utf-8").read() != text:
            print("STALE: %s. Run python3 kb/_build_noncredit_subject_titles.py" % OUT)
            return 1
        print("ok: %s is current" % OUT)
        return 0
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    print("wrote %s: %s" % (OUT, json.loads(text)["totals"]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

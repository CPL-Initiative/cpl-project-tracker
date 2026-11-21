#!/usr/bin/env python3
"""Local subject titles, Step b of the Commons' curation order (S694).

Sam, 2026-11-20 (r-subjects-card-on-the-commons-sam-2026-11-20): "don't we need a commons card for subjects to house
the common subjects and local subject titles we'll be establishing from catalog data?" Under his delegation the same
day (d-step-b-owner-courses-bot-2026-11-20) the Courses bot drafts each local subject title from the state subject
code and the catalog's subject heading, and a curator settles the codes that disagree.

Reads (all committed):
  kb/hand_filed_catalogs/courses/index.json and each <slug>.json.gz   the printed catalogs: per row college, subject,
                                                                       sometimes subject_name, code, title.
  coci_lookup_data.js (window.CPL_COCI_LOOKUP)                         the state list: colleges, and rows of
                                                                       [college index, control number, subject, ...].
  kb/reference/subject_discipline_map.json                             local subject code -> MQ discipline.
  kb/discipline_canonical_subj4.json                                   MQ discipline -> its common SUBJ.
Writes kb/status/local_subject_titles.json: per college, each subject code the catalog prints or the state list
carries, the catalog's printed name (the draft local subject title) or null (TBA), the courses it heads on each side,
which side prints it, and the common subject code where the two maps give one. Never from a TOP code (CLAUDE.md
Rule 7). Nothing is written to any table.

Deterministic: no clock is read. A rerun on the same inputs writes the same bytes.

  python3 kb/_build_local_subject_titles.py           write the file
  python3 kb/_build_local_subject_titles.py --check   exit 1 if the committed file is behind its inputs
"""
import gzip
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOGS = os.path.join("kb", "hand_filed_catalogs", "courses")
STATE = "coci_lookup_data.js"
SUBJECT_MAP = os.path.join("kb", "reference", "subject_discipline_map.json")
CANONICAL = os.path.join("kb", "discipline_canonical_subj4.json")
OUT = os.path.join("kb", "status", "local_subject_titles.json")

COLUMNS = ["code", "printed_name", "catalog_courses", "state_courses", "side", "common", "discipline"]
RULE = ("A catalog's subject code and the state list's are the same code when they are equal after trimming and "
        "upper-casing; nothing looser. A college is the same college when its names are equal after lower-casing and "
        "folding every run of other characters to one space (Los Angeles Trade-Technical College is Los Angeles Trade "
        "Technical College). The common subject code is read from the subject map (its keys: upper case, letters and "
        "digits only) and the discipline's canonical SUBJ; where either has nothing, it is blank. A TOP code is never read.")


def code_key(s):
    return str(s or "").strip().upper()


def college_key(s):
    return re.sub(r"[^a-z0-9]+", " ", str(s or "").lower()).strip()


def map_key(s):
    return re.sub(r"[^A-Z0-9]", "", code_key(s))


def read_json(root, rel):
    with open(os.path.join(root, rel), encoding="utf-8") as f:
        return json.load(f)


def read_state(root):
    src = open(os.path.join(root, STATE), encoding="utf-8").read()
    j = json.loads(src[src.index("{"):src.rindex("}") + 1])
    return j


def build(root=ROOT):
    index = read_json(root, os.path.join(CATALOGS, "index.json"))
    state = read_state(root)
    smap = read_json(root, SUBJECT_MAP).get("map", {})
    canon = read_json(root, CANONICAL).get("disciplines", {})

    state_by_college = {}
    names = state.get("colleges") or []
    by_name = {college_key(n): i for i, n in enumerate(names)}
    for r in state.get("rows") or []:
        state_by_college.setdefault(r[0], {})
        k = code_key(r[2])
        if k:
            state_by_college[r[0]][k] = state_by_college[r[0]].get(k, 0) + 1

    def common_of(code):
        disc = smap.get(map_key(code))
        sub = (canon.get(disc) or {}).get("canonical_subj4") if disc else None
        return (sub or None), (disc or None)

    out_colleges = []
    T = {"colleges": 0, "courses": 0, "codes": 0, "catalog_codes": 0, "named": 0, "both": 0, "catalog_only": 0,
         "state_only": 0, "with_common": 0, "colleges_named": 0, "colleges_not_in_state_list": 0}
    for c in sorted(index.get("colleges") or [], key=lambda x: x["slug"]):
        with gzip.open(os.path.join(root, CATALOGS, c["file"]), "rt", encoding="utf-8") as f:
            rows = json.load(f).get("rows") or []
        cat = {}
        for r in rows:
            k = code_key(r.get("subject"))
            if not k:
                continue
            e = cat.setdefault(k, {"n": 0, "names": {}})
            e["n"] += 1
            nm = str(r.get("subject_name") or "").strip()
            if nm:
                e["names"][nm] = e["names"].get(nm, 0) + 1
        si = by_name.get(college_key(c["college"]))
        st = state_by_college.get(si, {}) if si is not None else {}
        out = []
        for k in sorted(set(cat) | set(st)):
            e = cat.get(k)
            # The name the catalog prints most often under the code (ties: A to Z); the files read today print one.
            name = None
            if e and e["names"]:
                name = sorted(e["names"].items(), key=lambda kv: (-kv[1], kv[0]))[0][0]
            side = "both" if (e and k in st) else ("catalog" if e else "state")
            common, disc = common_of(k)
            out.append([k, name, e["n"] if e else 0, st.get(k, 0), side, common, disc])
        n = {"codes": len(out), "catalog_codes": len(cat), "named": sum(1 for r in out if r[1]),
             "both": sum(1 for r in out if r[4] == "both"), "catalog_only": sum(1 for r in out if r[4] == "catalog"),
             "state_only": sum(1 for r in out if r[4] == "state"), "with_common": sum(1 for r in out if r[5])}
        out_colleges.append({"slug": c["slug"], "college": c["college"], "catalog_year": c.get("catalog_year"),
                             "read_at": c.get("read_at"), "in_state_list": si is not None,
                             "courses": len(rows), **n, "rows": out})
        T["colleges"] += 1
        T["courses"] += len(rows)
        for k2 in n:
            T[k2] += n[k2]
        T["colleges_named"] += 1 if n["named"] else 0
        T["colleges_not_in_state_list"] += 0 if si is not None else 1

    return {
        "_what": ("Step b of the Commons' curation order: each college's local subject codes, from its printed catalog "
                  "(kb/hand_filed_catalogs/courses/) beside the state list (coci_lookup_data.js). printed_name is the "
                  "catalog's subject heading and the draft local subject title (owner: the Courses bot, state: drafted); "
                  "null reads TBA. side says who prints the code: both, catalog (the catalog only) or state (the state "
                  "list only). The codes on one side only are the curator's list. common is the common subject code "
                  "(Step a) where the subject map and the canonical SUBJ give one. Built by kb/_build_local_subject_titles.py; "
                  "no clock is read, so read_at is each catalog's own."),
        "_rule": RULE,
        "_sources": {"catalogs": CATALOGS.replace(os.sep, "/") + "/index.json", "state_list": STATE,
                     "state_list_built_at": state.get("_built_at"), "subject_map": SUBJECT_MAP.replace(os.sep, "/"),
                     "canonical_subj": CANONICAL.replace(os.sep, "/")},
        "draft": {"owner": "Courses bot", "state": "drafted", "settled_by": "a curator, for the codes that disagree"},
        "totals": T,
        "columns": COLUMNS,
        "colleges": out_colleges,
    }


def dump(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"), sort_keys=False) + "\n"


def main(argv):
    text = dump(build())
    path = os.path.join(ROOT, OUT)
    if "--check" in argv:
        cur = open(path, encoding="utf-8").read() if os.path.exists(path) else ""
        if cur != text:
            print(OUT + " is behind its inputs: run python3 kb/_build_local_subject_titles.py")
            return 1
        print(OUT + " is current")
        return 0
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    t = json.loads(text)["totals"]
    print(OUT + ": " + json.dumps(t))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

"""The local courses behind each MQ discipline's local subject counts, by code.

Sam, 2026-11-04, on the Common Subjects List: Electromechanical Technology's panel read "ECONMT, 55 courses", and the
code looked like economics. "Add a hover over on the 55 so I can see the 55 course titles. If they truly are econ, this
is an opportunity to improve our procedure that produced these alignments." The panel's counts come from
kb/_seed_canonical_subj4.py; this file names the courses behind them, so a person can read what a count holds
without leaving the page.

The walk is the seed's own: a corroborated minted M-ID's members (titled by the M-ID's common title, since a member row
carries none) and each corroborated singleton, grouped by discipline and the college's raw subject code (strip and
upper). TOP-only rows are held out, as the seed holds them out of the count (kb/_top_gate.py), so every list here
has exactly the count the panel shows beside it.

Output: one file per MQ discipline, kb/discipline_local_courses/<slug>.json (about 43 KB each; the whole set is 5.7 MB,
too much for a panel that wants one discipline), and index.json naming each discipline's file.
  <slug>.json: { "discipline", "colleges": [name, ...], "by": { code: [[college_index, course_number, title,
                 control_number], ...] } }
Read by canonical_subj4.js the first time a panel's count is opened. Rebuild when the seed is rebuilt:
    python3 kb/_build_discipline_local_courses.py           # writes the file
    python3 kb/_build_discipline_local_courses.py --check   # fails when the file is stale
"""
from __future__ import annotations

import json
import os
import sys
from collections import defaultdict
from datetime import date

from _top_gate import discipline_is_corroborated

HERE = os.path.dirname(os.path.abspath(__file__))
COURSES = os.path.join(HERE, "coci_minted_courses.json")
SINGLETONS = os.path.join(HERE, "coci_minted_singletons.json")
MEMBERSHIPS = os.path.join(HERE, "coci_minted_memberships.json")
OUT_DIR = os.path.join(HERE, "discipline_local_courses")


def slug(d):
    out = "".join(ch.lower() if ch.isalnum() else "-" for ch in d)
    while "--" in out:
        out = out.replace("--", "-")
    return out.strip("-")


def _norm_subject(s):
    if not s:
        return None
    s = s.strip().upper()
    return s or None


def _load(path, key):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f).get(key) or {}


def build():
    courses = _load(COURSES, "courses")
    singletons = _load(SINGLETONS, "courses")
    memberships = _load(MEMBERSHIPS, "memberships") if os.path.exists(MEMBERSHIPS) else {}
    by = defaultdict(lambda: defaultdict(list))
    colleges, cidx = [], {}

    def college(name):
        name = name or ""
        if name not in cidx:
            cidx[name] = len(colleges)
            colleges.append(name)
        return cidx[name]

    for course_id, rec in courses.items():
        if rec.get("id_system") != "M-ID" or not discipline_is_corroborated(rec):
            continue
        d = rec.get("discipline")
        if not d:
            continue
        for m in memberships.get(course_id, []) or []:
            s = _norm_subject(m.get("subject"))
            if s:
                by[d][s].append([college(m.get("college")), m.get("course_number") or "", rec.get("common_title") or "",
                                 m.get("control_number") or ""])
    for rec in singletons.values():
        if not discipline_is_corroborated(rec):
            continue
        d = rec.get("discipline")
        s = _norm_subject(rec.get("subject"))
        if d and s:
            by[d][s].append([college(rec.get("college")), rec.get("course_number") or "", rec.get("common_title") or "",
                             rec.get("control_number") or ""])

    def num_key(row):
        n = row[1]
        digits = "".join(ch for ch in n if ch.isdigit())
        return (colleges[row[0]], int(digits) if digits else 0, n)

    files, index = {}, {}
    for d in sorted(by):
        own, oidx, out = [], {}, {}
        for code, rows in sorted(by[d].items()):
            conv = []
            for row in sorted(rows, key=num_key):
                name = colleges[row[0]]
                if name not in oidx:
                    oidx[name] = len(own)
                    own.append(name)
                conv.append([oidx[name]] + row[1:])
            out[code] = conv
        f = slug(d) + ".json"
        index[d] = f
        files[f] = {"discipline": d, "colleges": own, "by": out}
    files["index.json"] = {
        "_about": "The local courses behind each MQ discipline's local subject counts, by the college's code, one file per "
                  "MQ discipline. Built by kb/_build_discipline_local_courses.py over the seed's own walk (corroborated rows only).",
        "_built_from": ["kb/coci_minted_courses.json", "kb/coci_minted_singletons.json", "kb/coci_minted_memberships.json"],
        "files": index,
    }
    return files


def dump(doc):
    return json.dumps(doc, ensure_ascii=False, separators=(",", ":"), sort_keys=False) + "\n"


def main(argv):
    files = build()
    have = set(os.listdir(OUT_DIR)) if os.path.isdir(OUT_DIR) else set()
    if "--check" in argv:
        stale = sorted(f for f in files if not os.path.exists(os.path.join(OUT_DIR, f))
                       or open(os.path.join(OUT_DIR, f), encoding="utf-8").read() != dump(files[f]))
        stale += sorted(f for f in have - set(files) if f.endswith(".json"))
        if stale:
            print("kb/discipline_local_courses/ is STALE (%d files): run python3 kb/_build_discipline_local_courses.py" % len(stale))
            return 1
        print("kb/discipline_local_courses/ is current")
        return 0
    os.makedirs(OUT_DIR, exist_ok=True)
    for f in have - set(files):
        if f.endswith(".json"):
            os.remove(os.path.join(OUT_DIR, f))
    for f, doc in files.items():
        with open(os.path.join(OUT_DIR, f), "w", encoding="utf-8") as fh:
            fh.write(dump(doc))
    n = sum(len(r) for f, d in files.items() if f != "index.json" for r in d["by"].values())
    print("wrote kb/discipline_local_courses/: %d courses under %d MQ disciplines (%s)" % (n, len(files) - 1, date.today().isoformat()))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

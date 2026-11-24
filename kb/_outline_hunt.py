#!/usr/bin/env python3
"""The 50 course outlines worth finding by hand, so the M-ID outcomes comparison can read the most CTE courses (S711).

Sam, 2026-11-23, in session: "add to the SLO, objective card on commons a prioritized list of 50 course cors to
manually find and drop to you later for SLOs and objectives that would strengthen the mid analysis for the top 50 most
impactful courses? Thinking these would not be cid or ccn courses, since we can pretty reliably put aligned courses in
those. Probably needing the CTE courses that are common and don't already have cid."

WHAT IT LISTS. kb/_mid_outcomes_compare.py compares an M-ID's members on their outlines' outcomes and objectives, and
it needs two districts that print enough outcome text (one district is one voice) before it can say Confirmed or
Split; below that the M-ID reads "Not enough text". This file names, for the most-shared CTE M-IDs short of two such
districts, the one course whose outline would close the gap, and a second where none prints any yet.

  in      an M-ID (SUBJ Mxxxx), never a C-ID or CCN identity; CTE by the TOP manual's asterisk (kb/coci_minted_courses.json
          `cte`, stamped by kb/_join_cte_from_top.py: the CTE flag is one of the two places TOP is authoritative);
          credit; at least MIN_DISTRICTS districts; fewer than two districts print enough outcome text; not a shell
          title (work experience, internship, special or selected topics, independent or directed study, practicum).
  rank    districts reached per outline needed, most first (an M-ID one outline from comparable counts its whole reach
          for that one outline); ties by districts, then by id.
  pick    per M-ID, a member in a district that prints no outcome text for it yet, whose own outline prints none: first
          at a college whose outlines the reader already holds (the reader could not reach this one, so only a person's
          find adds it; a college not read yet is the collection routine's), then the title nearest the M-ID's common
          title (title_jaccard), then the college A to Z. Two picks sit in two districts.

It reads the newest committed comparison (kb/status/mid_outcomes_compare_<date>.json[.gz]) and the committed members
(unified_courses_members.js); it writes kb/status/outline_hunt.json and nothing else. No stored id is compared: the
members file and the comparison share the current era, so kb/alias_chain.py has nothing to resolve. No clock is read
beyond the inputs' own dates, so a rerun on the same inputs writes the same bytes.

    python3 kb/_outline_hunt.py              write the file
    python3 kb/_outline_hunt.py --stdout     print the list, write nothing
    python3 kb/_outline_hunt.py --check      exit 1 if the committed file is behind its inputs; write nothing
"""
import argparse
import gzip
import importlib.util
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join("kb", "status", "outline_hunt.json")
CATALOG = os.path.join("kb", "coci_minted_courses.json")
LIMIT = 50
MIN_DISTRICTS = 5
NEEDED = 2
MID_RE = re.compile(r"^[A-Z]{3,5} M[0-9A-Z]{4}$")
SHELL_RE = re.compile(r"\b(work experience|internship|special topics?|selected topics?|independent study|directed study|"
                      r"practicum|cooperative|co-op|occupational work|field experience|externship)\b", re.I)


def _compare_module():
    spec = importlib.util.spec_from_file_location("_mid_outcomes_compare_h", os.path.join(HERE, "_mid_outcomes_compare.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def newest_compare(root=ROOT):
    """(relative path, document) of the newest committed comparison, or (None, None)."""
    d = os.path.join(root, "kb", "status")
    names = sorted(n for n in os.listdir(d) if re.match(r"^mid_outcomes_compare_\d{4}-\d{2}-\d{2}\.json(\.gz)?$", n))
    if not names:
        return None, None
    n = names[-1]
    p = os.path.join(d, n)
    opener = gzip.open if n.endswith(".gz") else open
    with opener(p, "rt", encoding="utf-8") as f:
        return os.path.relpath(p, root).replace(os.sep, "/"), json.load(f)


def load_catalog(root=ROOT):
    with open(os.path.join(root, CATALOG), encoding="utf-8") as f:
        rows = json.load(f).get("courses") or {}
    if isinstance(rows, dict):
        return {k: v for k, v in rows.items() if isinstance(v, dict)}
    return {r["course_id"]: r for r in rows if isinstance(r, dict) and r.get("course_id")}


def build(members, compare, catalog, voice, jaccard, members_at=None, compare_path=None, limit=LIMIT):
    """The document. members: {mid: [{college, code, title, units, top}]}; compare: the comparison document;
    catalog: {course_id: minted row}; voice: college -> district; jaccard: title_jaccard."""
    cmids = (compare or {}).get("mids") or {}
    # Colleges whose outlines the reader already holds: a course missing there is one the reader could not reach, so a
    # person's find adds what no read will; a college not read yet is the collection routine's, a whole college at once.
    read = {t[0] for c in cmids.values() for t in (c.get("members_with_text") or []) if t}
    cands, skipped = [], {"not an M-ID": 0, "not CTE": 0, "not credit": 0, "shell title": 0, "few districts": 0,
                          "already comparable": 0}
    for mid, rows in members.items():
        if not MID_RE.match(mid):
            skipped["not an M-ID"] += 1
            continue
        cat = catalog.get(mid) or {}
        if cat.get("c_id") or cat.get("ccn_id"):
            skipped["not an M-ID"] += 1
            continue
        if cat.get("cte") is not True:
            skipped["not CTE"] += 1
            continue
        if cat.get("credit_status") and cat.get("credit_status") != "Credit":
            skipped["not credit"] += 1
            continue
        title = cat.get("common_title") or (cmids.get(mid) or {}).get("title") or (rows[0]["title"] if rows else "")
        if SHELL_RE.search(title or ""):
            skipped["shell title"] += 1
            continue
        districts = {voice(r["college"]) for r in rows if r.get("college")}
        if len(districts) < MIN_DISTRICTS:
            skipped["few districts"] += 1
            continue
        c = cmids.get(mid) or {}
        texted = c.get("members_with_text") or []
        enough = [(t[0], t[1]) for t in texted if len(t) > 5 and t[5]]
        any_text = {(t[0], t[1]) for t in texted}
        text_districts = {voice(col) for col, _code in enough}
        needed = NEEDED - len(text_districts)
        if needed <= 0:
            skipped["already comparable"] += 1
            continue
        pool = [r for r in rows if r.get("college") and voice(r["college"]) not in text_districts
                and (r["college"], r["code"]) not in any_text]
        pool.sort(key=lambda r: (r["college"] not in read, -(jaccard(r["title"], title) or 0), r["college"], r["code"]))
        picks, used = [], set()
        for r in pool:
            v = voice(r["college"])
            if v in used:
                continue
            picks.append(r)
            used.add(v)
            if len(picks) == needed:
                break
        if not picks:
            continue
        cands.append({"mid": mid, "title": title, "discipline": cat.get("discipline"), "top": cat.get("top_code"),
                      "members": len(rows), "districts": len(districts), "districts_with_text": len(text_districts),
                      "needed": needed, "reach_per_outline": round(len(districts) / needed, 2),
                      "class_now": c.get("cls") or "Not enough text", "picks": picks})
    cands.sort(key=lambda x: (-x["reach_per_outline"], -x["districts"], x["mid"]))
    out, rank = [], 0
    for x in cands:
        for p in x["picks"]:
            if rank >= limit:
                break
            rank += 1
            why = ("one more district's outline makes this M-ID comparable" if x["districts_with_text"] == 1
                   else "no district's outline prints outcomes for this M-ID yet; this is one of two")
            out.append({"rank": rank, "college": p["college"], "college_read": p["college"] in read,
                        "code": p["code"], "course_title": p["title"],
                        "units": p.get("units"), "mid": x["mid"], "mid_title": x["title"], "discipline": x["discipline"],
                        "districts": x["districts"], "members": x["members"],
                        "districts_with_text": x["districts_with_text"], "class_now": x["class_now"], "why": why})
        if rank >= limit:
            break
    return {
        "_what": ("The course outlines of record worth finding by hand, so kb/_mid_outcomes_compare.py can read the "
                  "most-shared CTE M-IDs it cannot read today. Written by kb/_outline_hunt.py, read by the Commons "
                  "SLOs and objectives view (commons_data.js). Sam's ask, 2026-11-23 (S711)."),
        "_rule": ("M-IDs only, never C-ID or CCN; CTE by the TOP manual's asterisk; credit; at least %d districts; "
                  "fewer than two districts print enough outcome text; no shell titles. Ranked by districts reached "
                  "per outline needed. Each course is a member in a district with no outcome text for its M-ID yet, at a "
                  "college already read where one is, nearest the M-ID's title." % MIN_DISTRICTS),
        "_sources": {"members": "unified_courses_members.js generated %s" % members_at, "compare": compare_path,
                     "compare_date": (compare or {}).get("date"), "cte": CATALOG.replace(os.sep, "/")},
        "totals": {"listed": len(out), "mids": len({r["mid"] for r in out}), "candidate_mids": len(cands),
                   "skipped": skipped},
        "courses": out,
    }


def dump(doc):
    return json.dumps(doc, ensure_ascii=False, indent=1) + "\n"


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--stdout", action="store_true")
    ap.add_argument("--check", action="store_true", help="exit 1 if the committed file is behind its inputs; write nothing")
    a = ap.parse_args(argv)
    comp = _compare_module()
    members, members_at = comp.load_members(ROOT)
    districts, _ = comp.load_districts(ROOT)
    path, compare = newest_compare(ROOT)
    doc = build(members, compare, load_catalog(ROOT), comp.voice_of(districts), comp.title_jaccard, members_at, path)
    if a.stdout:
        for r in doc["courses"]:
            print("%2d  %-34s %-12s %-40s %s (%d districts, %d with text)" % (
                r["rank"], r["college"][:34], r["code"], r["course_title"][:40], r["mid"], r["districts"],
                r["districts_with_text"]))
        print(json.dumps(doc["totals"]))
        return 0
    text = dump(doc)
    p = os.path.join(ROOT, OUT)
    if a.check:
        try:
            was = open(p, encoding="utf-8").read()
        except OSError:
            was = None
        if was != text:
            print("[outline_hunt] %s is stale: run python3 kb/_outline_hunt.py" % OUT)
            return 1
        print("[outline_hunt] %s is current" % OUT)
        return 0
    try:
        if open(p, encoding="utf-8").read() == text:
            print("[outline_hunt] %d courses; unchanged" % len(doc["courses"]))
            return 0
    except OSError:
        pass
    with open(p, "w", encoding="utf-8") as f:
        f.write(text)
    print("[outline_hunt] %d courses across %d M-IDs; written %s" % (len(doc["courses"]), doc["totals"]["mids"], OUT))
    return 0


if __name__ == "__main__":
    sys.exit(main())

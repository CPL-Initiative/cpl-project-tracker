#!/usr/bin/env python3
"""The read-only "Side by side" views (COBIx's item 7 on #3464, S678): one record next to every source behind it.

Two asks, one builder, two small files the browser reads only when a person opens the view:

  kb/side_by_side.json            the Courses List's "Side by side" fold (courses/ask-sky-side-by-side.md). Per
                                  control number: the state's course status (kb/reference/coci_program_course_file
                                  .csv.gz); per TOP code: its official title (kb/reference/top_categories.json) and
                                  the discipline our TOP table gives it (kb/top_discipline_map.json); per subject
                                  code: the discipline our subject map gives it (kb/reference/subject_discipline_map
                                  .json). Per seedless card (a minted card whose discipline is the first machine
                                  guess, never re-checked): what our own tables make of it (its own subject code, its
                                  colleges' subject codes, their TOP codes), and, where the scorer's memberships file
                                  (kb/coci_minted_memberships.json) and the List's file (unified_courses_members.js)
                                  hold different college courses, the control numbers the scorer reads.
  kb/exhibit_side_by_side.json    the Exhibits tab's side by side (exhibits/ask-sky-side-by-side.md). Per MAP
                                  exhibit: its canonical title, its CPL type (MAP's cpl_type_description from
                                  kb/coci_articulations.json, or the path in the exhibit id, kb/exhibit_paths.py, when
                                  MAP's type is not on the record), the official source (the issuer's official
                                  certification name from kb/exhibit_cert_links.json, or the official C-ID, CCN or
                                  common course title the exhibit articulates to), and a college course the Review
                                  builder set aside (kb/exhibits_review.json course_title_set_aside).

Independent of the scorer. The discipline confidence scorer (kb/_ccr_confidence_score.py, PR #3467) is not imported:
this file reads the committed memberships file as the scorer reads it today. `--scores CSV` (the scores.csv that
`kb/_ccr_confidence_score.py --out DIR` writes) adds the scorer's band, score and agreeing-signal count to each card;
without it the fold says the scorer's reading is not in this build. Once the scorer reads the List's memberships
(`--fill-members`), the "scorer reads N; the List shows M" notes for the filled cards go away; the builder reports
how many cards that is.

Read-only: it writes no curation row, changes no discipline and edits no local MAP title.

Run from the repo root:
  python3 kb/_build_side_by_side.py                 # writes both files
  python3 kb/_build_side_by_side.py --scores DIR/scores.csv
  python3 kb/_build_side_by_side.py --fill-members  # once the scorer reads the List's rows for cards with none
  python3 kb/_build_side_by_side.py --check         # exits non-zero when a committed file is out of date
"""
import argparse
import csv
import gzip
import io
import json
import os
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import exhibit_paths  # noqa: E402

OUT_COURSES = "kb/side_by_side.json"
OUT_EXHIBITS = "kb/exhibit_side_by_side.json"
PATH_WORDS = {k: v[0][0].upper() + v[0][1:] for k, v in exhibit_paths.PATHS.items()}
# Which CPL types are graded credit (a college's own assessment) and which rest on a certification or an exam body.
GRADED = {"cx", "pr"}
CERT_BASED = {"ic", "sa"}
TYPE_KIND = {"Credit By Exam": "graded", "Credit by Exam": "graded", "Portfolio": "graded",
             "Industry Certification": "cert-based", "Standardized Exam": "cert-based",
             "Standardized Assessment": "cert-based"}


def path(rel):
    return os.path.join(ROOT, rel)


def load(rel):
    with open(path(rel), encoding="utf-8") as f:
        return json.load(f)


def load_js(rel):
    with open(path(rel), encoding="utf-8") as f:
        src = f.read()
    i = src.index("=", src.index("window.")) + 1
    return json.loads(src[i:].strip().rstrip(";"))


def blank(v):
    return v is None or (isinstance(v, str) and v.strip() in ("", "None", "null"))


# ── courses ─────────────────────────────────────────────────────────────────────────────────────────────────────────

def list_members():
    """unified_courses_members.js as {card: [(college, control number, subject code, TOP code)]}."""
    doc = load_js("unified_courses_members.js")
    colleges = doc.get("colleges") or []
    out = {}
    for mid, rows in (doc.get("members") or {}).items():
        conv = []
        for r in rows or []:
            c = r.get("c")
            subj = " ".join(str(r.get("n") or "").split()).partition(" ")[0]
            conv.append((colleges[c] if isinstance(c, int) and 0 <= c < len(colleges) else "",
                         r.get("cn") or "", subj, str(r.get("p") or "")))
        out[mid] = conv
    return out, doc.get("topmap") or {}


def scorer_members():
    """kb/coci_minted_memberships.json, the file the scorer reads, as {card: [(college, control number, subject, TOP)]}."""
    mem = load("kb/coci_minted_memberships.json")
    mem = mem.get("memberships", mem)
    out = {}
    for mid, rows in mem.items():
        if mid.startswith("_") or not isinstance(rows, list):
            continue
        out[mid] = [(r.get("college") or "", r.get("control_number") or "", r.get("subject") or "",
                     str(r.get("top_code") or "").split(":")[0].strip()) for r in rows]
    return out


def course_status():
    """{control number: the state's course status}, from the program course file (one status per course; where the
    file carries two, both, joined)."""
    by = defaultdict(Counter)
    with gzip.open(path("kb/reference/coci_program_course_file.csv.gz"), "rt", encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            cn = (r.get("CourseControlNumber") or "").strip()
            st = (r.get("CourseStatus") or "").strip()
            if cn and st and st != "NULL":
                by[cn][st] += 1
    return {cn: " or ".join(s for s, _n in c.most_common()) for cn, c in by.items()}


def own_tables():
    subj = load("kb/reference/subject_discipline_map.json")["map"]
    top = load("kb/top_discipline_map.json")["map"]
    titles = {c: v.get("title") for c, v in load("kb/reference/top_categories.json")["codes"].items()}
    return subj, top, titles


def vote(values, guess):
    """A signal's plain reading: agrees, points elsewhere (and to what), or missing."""
    named = [v for v in values if v]
    if not named:
        return ["missing", None]
    tally = Counter(named)
    if tally.get(guess):
        return ["agrees", None] if tally[guess] * 2 >= len(named) else ["split", tally.most_common(1)[0][0]]
    return ["elsewhere", tally.most_common(1)[0][0]]


def read_scores(csv_path):
    out = {}
    with open(csv_path, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            mid = r.get("mid") or r.get("id")
            if not mid:
                continue
            rec = {"band": r.get("band") or None}
            for k in ("score", "agree"):
                v = r.get(k)
                if v not in (None, ""):
                    try:
                        rec[k] = int(float(v))
                    except ValueError:
                        pass
            if r.get("reasons"):
                rec["reasons"] = r["reasons"]
            out[mid] = rec
    return out


def build_courses(scores=None, fill_members=False):
    courses = load("kb/coci_minted_courses.json")["courses"]
    cur = load("kb/coci_curation.json").get("curations", {})
    lm, topmap = list_members()
    sm = scorer_members()
    status_all = course_status()
    subj, top, top_titles = own_tables()

    def seedless(cid, rec):
        return (isinstance(rec, dict) and not cid.startswith("_") and rec.get("discipline")
                and blank(rec.get("discipline_source")) and not (cur.get(cid) or {}).get("discipline"))

    cards, ctrls, tops, subjects = {}, set(), set(), set()
    counts = Counter()
    for mid, rows in lm.items():
        for _c, cn, s, t in rows:
            if cn:
                ctrls.add(cn)
            if t:
                tops.add(t)
            if s:
                subjects.add(s)
    for cid, rec in courses.items():
        if not seedless(cid, rec):
            continue
        counts["seedless"] += 1
        c = cur.get(cid) or {}
        listed = lm.get(cid)
        if c.get("merge_into"):
            counts["merged_away"] += 1
            continue
        if listed is None:
            counts["not_openable"] += 1
            continue
        guess = rec["discipline"]
        read = sm.get(cid, [])
        if fill_members and not read:
            # The scorer's membership fix (kb/_ccr_confidence_score.py --fill-members, PR #3467): a card with no
            # membership entry reads the List's rows. Mirrored here, never imported.
            read = listed
            counts["filled_from_list"] += 1
        # In SIGNALS order; each reading is "agrees", "missing", "unmapped", or "elsewhere|Field" / "split|Field".
        reading = [
            vote([subj.get(rec.get("subject") or "")], guess) if subj.get(rec.get("subject") or "") else ["unmapped", None],
            vote([subj.get(s) for _c, _n, s, _t in read], guess),
            vote([top.get(t) for _c, _n, _s, t in read], guess),
        ]
        reading = [w if not o else w + "|" + o for w, o in reading]
        card = {"g": guess, "r": reading}
        if not blank(rec.get("description")):
            d = " ".join(str(rec["description"]).split())
            card["d"] = d if len(d) <= 200 else d[:200].rsplit(" ", 1)[0] + "…"
        a, b = {n for _c, n, _s, _t in read}, {n for _c, n, _s, _t in listed}
        if a != b:
            counts["scorer_and_list_differ"] += 1
            if not read:
                counts["scorer_reads_none"] += 1
            card["s"] = sorted(a)
            for _c, cn, s, t in read:
                if cn:
                    ctrls.add(cn)
                if t:
                    tops.add(t)
                if s:
                    subjects.add(s)
        if scores and cid in scores:
            card["v"] = scores[cid]
        cards[cid] = card
    counts["openable"] = len(cards)
    # The state's status, grouped: {status: [control numbers]} (a control number with no row is in none).
    groups = defaultdict(list)
    for cn in sorted(ctrls):
        if cn in status_all:
            groups[status_all[cn]].append(cn)
    status_groups = {k: groups[k] for k in sorted(groups, key=lambda k: (-len(groups[k]), k))}
    return {
        "schema": "side_by_side/1",
        "_about": ("The Courses List's read-only Side by side fold. Built by kb/_build_side_by_side.py from committed "
                   "files; it writes nothing and edits no local MAP title. 'status' lists the control numbers "
                   "under each state course status; 'tops' is a TOP code's official title and the discipline our TOP "
                   "table gives it; 'subjects' is the discipline our subject map gives a subject code; 'cards' holds "
                   "each openable seedless card: g its discipline, d its own description (its first 200 "
                   "characters), r what our tables make of it, in the order of 'signals' (agrees, missing, "
                   "unmapped, or elsewhere|field and split|field), s the "
                   "control numbers the scorer's memberships file holds where they differ from the List's, v the "
                   "scorer's band, score and agreeing signals when the build was given its scores."),
        "built_by": "kb/_build_side_by_side.py",
        "sources": ["kb/coci_minted_courses.json", "kb/coci_minted_memberships.json", "unified_courses_members.js",
                    "kb/coci_curation.json", "kb/reference/coci_program_course_file.csv.gz",
                    "kb/reference/top_categories.json", "kb/top_discipline_map.json",
                    "kb/reference/subject_discipline_map.json"],
        "scorer_reading": bool(scores),
        "fill_members": bool(fill_members),
        "counts": dict(sorted(counts.items())),
        "signals": ["own_subject", "college_subjects", "top"],
        "status": status_groups,
        "tops": {t: [top_titles.get(t) or topmap.get(t) or None, top.get(t)] for t in sorted(tops)},
        "subjects": {s: subj[s] for s in sorted(subjects) if s in subj},
        "cards": dict(sorted(cards.items())),
    }


# ── exhibits ────────────────────────────────────────────────────────────────────────────────────────────────────────

def official_course(sys_, cid, titles):
    t = titles.get(cid)
    return (t + " (" + (sys_ + " " if sys_ and sys_ != "M-ID" else "") + cid + ")") if t else cid


def build_exhibits():
    adopt = load("kb/exhibits_adoption.json")["credentials"]
    arts = load("kb/coci_articulations.json")["articulations"]
    ut = load("kb/unified_titles.json")
    links = load("kb/exhibit_cert_links.json")
    review = load("kb/exhibits_review.json")
    minted = {}
    for rel in ("kb/coci_minted_courses.json", "kb/coci_minted_singletons.json"):
        for k, v in load(rel)["courses"].items():
            if isinstance(v, dict) and v.get("common_title"):
                minted[k] = v["common_title"]
    for d in load("kb/reference/cid_descriptors.json")["descriptors"]:
        if d.get("descriptor") and d.get("title"):
            minted[d["descriptor"]] = d["title"]
    for d in load("kb/reference/ccn_courses.json")["courses"]:
        if d.get("ccn") and d.get("title"):
            minted[d["ccn"]] = d["title"]

    def certs_for(canon):
        L = (links.get("links") or {}).get(canon) or {}
        out = []
        for code in L.get("certs") or []:
            c = (links.get("certs") or {}).get(code) or {}
            name = c.get("catalog_name") or c.get("name")
            if name:
                out.append([name + (" (" + c["code"] + ")" if c.get("code") and c["code"] not in name else ""),
                            c.get("issuer") or None])
        return out

    rows = {}
    for canon, rec in adopt.items():
        for x in rec.get("x") or []:
            if x and x[0]:
                rows[x[0]] = {"l": x[1] or "", "c": canon}
    mtype, courses = {}, defaultdict(list)
    for a in arts:
        ex = a.get("exhibit_id")
        if not ex:
            continue
        rows.setdefault(ex, {"l": a.get("exhibit_title") or "", "c": a.get("unified_title") or ""})
        if a.get("cpl_type_description"):
            mtype.setdefault(ex, a["cpl_type_description"].strip())
        if a.get("course_id"):
            s = official_course(a.get("identity_system"), a["course_id"], minted)
            if s not in courses[ex]:
                courses[ex].append(s)
    aside = {}
    for h in review.get("held") or []:
        # A Review card's exhibits: the local title is the card's, the canonical the proposed name.
        for ex in h.get("ids") or []:
            rows.setdefault(ex, {"l": h.get("raw") or "", "c": h.get("title") or ""})
        sa = h.get("course_title_set_aside")
        if not sa:
            continue
        who = " ".join(x for x in (h.get("course_college"), h.get("course")) if x)
        line = ((who + " " if who else "") + "(" + sa.get("title", "") + ")" if sa.get("title") else who).strip()
        line = (line or "A college course") + " was set aside: this exhibit is an " + (sa.get("why") or "industry certification") + "."
        for ex in h.get("ids") or []:
            aside[ex] = line
    counts = Counter()
    out = {}
    for ex in sorted(rows):
        r = rows[ex]
        canon = r["c"] or ((ut.get(r["l"]) or {}).get("unified_title") if isinstance(ut.get(r["l"]), dict) else "") or ""
        p = exhibit_paths.path_of(ex)
        if ex in mtype:
            t, ts = mtype[ex], "map"
            kind = TYPE_KIND.get(t, "graded" if p in GRADED else "cert-based" if p in CERT_BASED else "")
        elif p:
            t, ts = PATH_WORDS[p], "id"
            kind = "graded" if p in GRADED else "cert-based" if p in CERT_BASED else ""
        else:
            t, ts, kind = "", "", ""
        rec = {"l": r["l"], "c": canon, "t": t, "ts": ts, "k": kind}
        certs = certs_for(canon) if kind == "cert-based" or p in CERT_BASED else []
        if certs:
            rec["o"] = certs
            counts["official_certification"] += 1
        elif courses.get(ex):
            rec["oc"] = courses[ex]
            counts["official_course"] += 1
        else:
            counts["no_official_source"] += 1
        if kind == "cert-based" and not certs:
            rec["n"] = 1
            counts["certification_name_not_on_file"] += 1
        if ex in aside:
            rec["a"] = aside[ex]
            counts["course_set_aside"] += 1
        counts["type_from_" + (ts or "none")] += 1
        out[ex] = rec
    counts["exhibits"] = len(out)
    return {
        "schema": "exhibit_side_by_side/1",
        "_about": ("The Exhibits tab's read-only side by side, one row per MAP exhibit. Built by "
                   "kb/_build_side_by_side.py; it writes nothing and edits no local MAP title. Per exhibit id: l the "
                   "local title as the college entered it, c the canonical title, t the CPL type and ts where it came "
                   "from (map: MAP's cpl_type_description; id: the path in the exhibit id), k graded or cert-based, "
                   "o the issuer's official certification names [name (code), issuer], oc the official courses it "
                   "articulates to, n when a certification's official name is not on file, a a college course the "
                   "Review builder set aside."),
        "built_by": "kb/_build_side_by_side.py",
        "sources": ["kb/exhibits_adoption.json", "kb/coci_articulations.json", "kb/unified_titles.json",
                    "kb/exhibit_cert_links.json", "kb/exhibits_review.json", "kb/coci_minted_courses.json",
                    "kb/coci_minted_singletons.json", "kb/reference/cid_descriptors.json",
                    "kb/reference/ccn_courses.json", "kb/exhibit_paths.py"],
        "counts": dict(sorted(counts.items())),
        "exhibits": out,
    }


def dump(doc):
    return json.dumps(doc, ensure_ascii=False, separators=(",", ":"), sort_keys=False) + "\n"


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--scores", help="scores.csv from kb/_ccr_confidence_score.py --out DIR")
    ap.add_argument("--fill-members", action="store_true",
                    help="read the List's rows for a card with no membership entry, as the scorer's --fill-members does")
    ap.add_argument("--check", action="store_true", help="exit non-zero when a committed file is out of date")
    args = ap.parse_args(argv)
    scores = read_scores(args.scores) if args.scores else None
    docs = {OUT_COURSES: build_courses(scores, args.fill_members), OUT_EXHIBITS: build_exhibits()}
    stale = []
    for rel, doc in docs.items():
        text = dump(doc)
        if args.check:
            try:
                with open(path(rel), encoding="utf-8") as f:
                    if f.read() != text:
                        stale.append(rel)
            except FileNotFoundError:
                stale.append(rel)
            continue
        with open(path(rel), "w", encoding="utf-8") as f:
            f.write(text)
        print("%s: %s bytes; %s" % (rel, format(len(text.encode("utf-8")), ","), json.dumps(doc["counts"])))
    if stale:
        print("out of date: " + ", ".join(stale) + " (run python3 kb/_build_side_by_side.py)", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

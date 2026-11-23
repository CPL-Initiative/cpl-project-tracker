#!/usr/bin/env python3
"""Which M-IDs in a re-mint's scope are ready, by the draft gate, and why each of the rest is held (#3655).

Sam, 2026-11-22 (r-subjects-before-remint-sam-2026-11-22): finish the common subject and local subject titles before
re-minting M-IDs, and "you can help me establish when we have a sufficient collected and curated dataset". The draft
gate is S707's, his to set (d-remint-ready-gate-draft-s707). This file applies it, so the Subjects page and the re-mint
dry run read one answer. It writes kb/status/mid_readiness.json and nothing else: no table, no M-ID.

THE GATE, three tests per M-ID:
  1. Every member's code has a settled common code. Settled means Confident (Sam, 2026-11-23,
     r-confidence-not-person-settled-sam-2026-11-23: "Let's work based on levels of confidence. sometimes a person will
     be needed to boost the confidence, other times, the data will be enough"; it supersedes
     d-readiness-map-is-not-settled-s709). In order, the first that answers settles a member: a person's move of that
     one course (CRS:, the Subjects panel's Move), a person's save for that college's code (credit:
     Decisions.for_course; noncredit: Decisions.for_noncredit_course, under the course's own category), a person's
     statewide filing for the code (credit courses only), the common code of the course's COCI noncredit category (a
     noncredit course; the four noncredit codes, r-noncredit-four-mq-codes-sam-2026-11-22), or the code's call in
     kb/status/statewide_subject_codes.json at Confident, 90% or more (a credit course; kb/_statewide_subject_codes.py,
     whose top band was right 96.7% of the time on the codes whose peers agree). A college whose catalog is not filed
     gives its course's band and category from the state course list. A member is held as one of: college not read
     (neither its catalog nor the state list holds it), course not found (the college is read and its state list has
     no course of that code and number), call below Confident (the call and its confidence are shown), no settled code
     (no call at all; the subject map's code, where it has one, is shown beside it), category has no common code (a
     noncredit category whose MQ discipline takes a title only, d-noncredit-four-categories-no-code-s701), or no
     noncredit category (the export names none).
  2. The settled codes give the shape: one code, or a split along the codes. Both pass; the shape is what the dry run
     mints.
  3. The outcomes comparison ran on the current reads: the newest kb/status/mid_outcomes_compare_<date>.json counts
     the same rows the committed reads under kb/course_outcomes/ hold now (one copy of that reader: the compare's
     outcome_rows_from_files). A strong or partial Split there holds the M-ID until a person answers it; no answer
     store exists yet, so every such split holds. Not enough text and a limited split pass: a missing SLO counts
     against no one, and an SLO never decides alone (Sam, 2026-11-09, on #2962).

KEYS. Members come from unified_courses_members.js, rebuilt nightly in the current era, and the compare reads the same
file, so a current compare shares its keys; a stale compare fails test 3 for every M-ID before any key is looked up.
No stored id is compared, so kb/alias_chain.py has nothing to resolve here.

SCOPES. A scope is every M-ID that holds a member under one college's local code. The first is AED at Cerritos
(f-aed-electricity-gave-elec-m90-s707). Add a scope to SCOPES.

    python3 kb/_mid_readiness.py            # writes kb/status/mid_readiness.json
    python3 kb/_mid_readiness.py --check    # exit 1 when the committed file is stale
    python3 kb/_mid_readiness.py --stdout   # print the summary, write nothing

Standard library only.
"""
from __future__ import annotations

import glob
import gzip
import importlib.util
import json
import os
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERE = os.path.join(ROOT, "kb")
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import subject_decisions as sd  # noqa: E402

OUT = os.path.join("kb", "status", "mid_readiness.json")
CALLS = os.path.join("kb", "status", "statewide_subject_codes.json")
CONFIDENT = 0.9   # Confident: the level that settles (r-confidence-not-person-settled-sam-2026-11-23)
COURSES_DIR = os.path.join("kb", "status", "subject_courses")
CATALOG_INDEX = os.path.join("kb", "hand_filed_catalogs", "courses", "index.json")
SUBJECT_MAP = os.path.join("kb", "reference", "subject_discipline_map.json")
COMPARE_GLOBS = (os.path.join("kb", "status", "mid_outcomes_compare_*.json"),
                 os.path.join("kb", "status", "mid_outcomes_compare_*.json.gz"))

SCOPES = {
    "aed": {"college": "Cerritos College", "code": "AED",
            "why": "AED (Adult Education) gave 45 shared M-IDs an ELEC prefix through the subject map "
                   "(f-aed-electricity-gave-elec-m90-s707); AED is unmapped since #3693."},
}

HELD_MEMBER = ("college not read", "course not found", "call below Confident", "no settled code",
               "category has no common code", "no noncredit category")
SPLIT_HOLDS = ("strong", "partial")


def _compare_module():
    spec = importlib.util.spec_from_file_location("_mid_outcomes_compare", os.path.join(HERE, "_mid_outcomes_compare.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def split_code(code):
    """('AED', 'CR10') for 'AED CR10'; a subject that holds a space ('LABR ST 101') keeps it."""
    s = " ".join(str(code or "").split())
    if " " not in s:
        return s.upper(), ""
    subj, num = s.rsplit(" ", 1)
    return subj.upper(), num.upper()


def load_courses(root=ROOT):
    """{slug: {(CODE, NUMBER): (band, category)}} from the per-college files the Subjects panel reads."""
    out = {}
    for path in sorted(glob.glob(os.path.join(root, COURSES_DIR, "*.json"))):
        with open(path, encoding="utf-8") as f:
            doc = json.load(f)
        cols = doc["columns"]
        i_num, i_band, i_cat = cols.index("number"), cols.index("band"), cols.index("category")
        table = {}
        for code, rows in (doc.get("codes") or {}).items():
            for r in rows:
                if r[i_band]:
                    table[(sd.code_key(code), str(r[i_num]).strip().upper())] = (r[i_band], r[i_cat] or sd.NO_CATEGORY)
        out[doc["slug"]] = table
    return out


def load_calls(root=ROOT):
    """{code in map_key form: {"credit": (common, confidence) or None, "noncredit": (common, confidence) or None}} from
    the statewide list: a credit course reads the code's credit call, and a noncredit course with no category in the
    export reads the code's noncredit call (its leading category). {} when the file is missing."""
    path = os.path.join(root, CALLS)
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8") as f:
        doc = json.load(f)
    out = {}
    for c in doc.get("codes") or []:
        rec, cc = c.get("recommend") or {}, c.get("credit_call") or {}
        credit = (cc.get("common"), cc.get("confidence")) if c.get("class") == "noncredit" else (rec.get("common"), rec.get("confidence"))
        noncredit = (rec.get("common"), rec.get("confidence")) if c.get("class") == "noncredit" else (None, None)
        out[c["code"]] = {"credit": credit if credit[0] else None, "noncredit": noncredit if noncredit[0] else None}
    return out


def _fold(name):
    """A college's name less COCI's " Credit" suffix (North Orange Continuing Education Credit is one college)."""
    name = (name or "").strip()
    return name[:-len(" Credit")] if name.endswith(" Credit") else name


def load_state(root=ROOT):
    """{(college key, CODE, NUMBER): (band, category)} for every course in the state course list, so a college whose
    catalog is not filed still gives its course's band and noncredit category."""
    import _build_subject_courses as B
    try:
        st = B.read_state(root)
    except (OSError, ValueError):
        return {}
    cats = B.read_categories(root)
    names = [sd.college_key(_fold(n)) for n in st["colleges"]]
    out = {}
    for r in st["rows"]:
        band = r[6] if r[6] in ("C", "N", "E") else ("N" if r[6] else "")
        if not band:
            continue
        cat = (cats.get(str(r[1]).strip()) or sd.NO_CATEGORY) if band in sd.NONCREDIT_MARKS else sd.NO_CATEGORY
        out.setdefault((names[r[0]], sd.code_key(r[2]), str(r[3]).strip().upper()), (band, cat))
    return out


def load_slugs(root=ROOT):
    with open(os.path.join(root, CATALOG_INDEX), encoding="utf-8") as f:
        idx = json.load(f)
    return {sd.college_key(c["college"]): c["slug"] for c in idx.get("colleges") or [] if c.get("slug")}


def load_map(root=ROOT):
    """{code in map_key form: the common code of the discipline the subject map names} (a draft, never settled)."""
    with open(os.path.join(root, SUBJECT_MAP), encoding="utf-8") as f:
        doc = json.load(f)
    with open(os.path.join(root, sd.CANONICAL), encoding="utf-8") as f:
        _by_code, by_disc = sd.canonical_codes(json.load(f))
    return {sd.map_key(k): by_disc.get(v) for k, v in (doc.get("map") or {}).items() if not k.startswith("_")}


def newest_compare(root=ROOT):
    """(path, doc) of the newest compare by its date, plain or gzipped (the compare gzips past the 5 MB file limit)."""
    paths = [p for g in COMPARE_GLOBS for p in glob.glob(os.path.join(root, g))]
    if not paths:
        return None, None
    path = max(paths, key=lambda p: os.path.basename(p).split(".")[0])
    opener = gzip.open if path.endswith(".gz") else open
    with opener(path, "rt", encoding="utf-8") as f:
        return os.path.relpath(path, root).replace(os.sep, "/"), json.load(f)


def compare_rows(doc):
    inv = (doc or {}).get("inventory") or {}
    rows = inv.get("rows") or {}
    return sum(v for v in rows.values() if isinstance(v, int))


def member_status(m, slugs, courses, decisions, subject_map, nc_codes, calls=None, state=None):
    """(status, common code or None, detail) for one member. calls and state are optional: without them a member
    settles only by a person's decision, as the gate read before r-confidence-not-person-settled-sam-2026-11-23."""
    ckey = sd.college_key(sd_clean(m["college"]))
    slug = slugs.get(ckey) or slugs.get(sd.college_key(_fold(sd_clean(m["college"]))))
    subj, num = split_code(m["code"])
    moved = decisions.for_course_move(slug, subj, num)
    if moved:
        return "settled", moved["common_code"], {"by": "course move", "key": moved["key"]}
    read = bool(slug) and slug in courses
    found = courses[slug].get((subj, num)) if read else None
    if not found and state:
        found = state.get((sd.college_key(_fold(sd_clean(m["college"]))), subj, num))
    if not found:
        return ("course not found" if read else "college not read"), None, {}
    band, category = found
    if band in sd.NONCREDIT_MARKS:
        r = decisions.for_noncredit_course(slug, subj, band, category) if read else None
        if r:
            return "settled", r["common_code"], {"by": "person", "key": r["key"]}
        if category == sd.NO_CATEGORY:
            # No category in the export: the code's leading category stands when its call is Confident.
            nc = ((calls or {}).get(sd.map_key(subj)) or {}).get("noncredit")
            if nc and nc[1] >= CONFIDENT:
                return "settled", nc[0], {"by": "the code's leading category", "confidence": nc[1]}
            return "no noncredit category", None, {"category": category, "map": subject_map.get(sd.map_key(subj))}
        if category in nc_codes and not nc_codes.get(category):
            return "category has no common code", None, {"category": category}
        if calls is not None and nc_codes.get(category):
            return "settled", nc_codes[category], {"by": "category", "category": category}
        return "no settled code", None, {"category": category, "map": subject_map.get(sd.map_key(subj))}
    r = decisions.for_course(slug, subj, band) if read else None
    if r:
        return "settled", r["common_code"], {"by": "person", "key": r["key"]}
    s = decisions.statewide_for(subj)
    if s:
        return "settled", s["common_code"], {"by": "filing", "key": s["key"]}
    call = ((calls or {}).get(sd.map_key(subj)) or {}).get("credit")
    if call and call[1] >= CONFIDENT:
        return "settled", call[0], {"by": "confident call", "confidence": call[1]}
    if call:
        return "call below Confident", None, {"call": call[0], "confidence": call[1], "map": subject_map.get(sd.map_key(subj))}
    return "no settled code", None, {"map": subject_map.get(sd.map_key(subj))}


def sd_clean(name):
    name = (name or "").strip()
    if "Ã" in name:
        try:
            name = name.encode("latin-1").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            pass
    return name


def build(root=ROOT, members=None, members_at=None, reads_rows=None):
    comp = _compare_module()
    if members is None:
        members, members_at = comp.load_members(root)
    if reads_rows is None:
        reads_rows = len(comp.outcome_rows_from_files(root)[0])
    slugs, courses = load_slugs(root), load_courses(root)
    calls, state = load_calls(root), load_state(root)
    decisions, subject_map, nc_codes = sd.load(root), load_map(root), sd.nc_codes_table()
    cmp_path, cmp_doc = newest_compare(root)
    cmp_rows = compare_rows(cmp_doc)
    current = bool(cmp_doc) and cmp_rows == reads_rows
    cmp_mids = (cmp_doc or {}).get("mids") or {}

    scopes = {}
    for name, sc in SCOPES.items():
        in_scope = sorted(mid for mid, rows in members.items()
                          if any(sd_clean(x["college"]) == sc["college"] and split_code(x["code"])[0] == sc["code"]
                                 for x in rows))
        mids, tally, held_codes = {}, Counter(), Counter()
        for mid in in_scope:
            rows = members[mid]
            st = Counter()
            codes = Counter()
            held = []
            for x in rows:
                status, common, detail = member_status(x, slugs, courses, decisions, subject_map, nc_codes, calls, state)
                st[status] += 1
                if common:
                    codes[common] += 1
                else:
                    held.append([sd_clean(x["college"]), x["code"], status])
                    if status != "college not read":
                        held_codes[(sd_clean(x["college"]), split_code(x["code"])[0], status,
                                    detail.get("category") or "credit", detail.get("map"))] += 1
            subjects_ok = st["settled"] == len(rows)
            entry = cmp_mids.get(mid) if current else None
            cls, level = (entry or {}).get("cls"), (entry or {}).get("level")
            outcomes_hold = bool(entry) and cls == "Split" and level in SPLIT_HOLDS
            reasons = []
            for h in HELD_MEMBER:
                if st[h]:
                    reasons.append("%d %s" % (st[h], h))
            if not current:
                reasons.append("the outcomes comparison has not run on the current reads")
            elif outcomes_hold:
                reasons.append("a %s outcomes split waits on a person's answer" % level)
            ready = subjects_ok and current and not outcomes_hold
            tally["ready" if ready else "held"] += 1
            mids[mid] = {"ready": ready, "members": len(rows), "settled": st["settled"],
                         "held_members": {h: st[h] for h in HELD_MEMBER if st[h]},
                         "codes": dict(codes.most_common()),
                         "shape": None if not codes else ("one code" if len(codes) == 1 else "splits along code"),
                         "outcomes": {"class": cls, "level": level} if entry else None,
                         "reasons": reasons, "held": held[:40]}
        member_tally = Counter()
        for v in mids.values():
            member_tally["settled"] += v["settled"]
            for h, n in v["held_members"].items():
                member_tally[h] += n
        scopes[name] = {
            "college": sc["college"], "code": sc["code"], "why": sc["why"],
            "mids": len(in_scope), "ready": tally["ready"], "held": tally["held"],
            "members": sum(v["members"] for v in mids.values()),
            "member_status": {k: member_tally[k] for k in ("settled",) + HELD_MEMBER if member_tally[k]},
            "fully_settled_mids": sum(1 for v in mids.values() if v["settled"] == v["members"]),
            "codes_to_settle": [{"college": c, "code": k, "band": b, "status": s, "subject_map_draft": mp, "members": n}
                                for (c, k, s, b, mp), n in sorted(held_codes.items(),
                                                                  key=lambda t: (-t[1], [str(x) for x in t[0]]))],
            "by_mid": mids,
        }

    return {
        "_what": "Which M-IDs in a re-mint's scope pass the draft readiness gate (d-remint-ready-gate-draft-s707, Sam's "
                 "to set), and why each of the rest is held. Read by the Subjects page and the re-mint dry run. "
                 "Written by kb/_mid_readiness.py; nothing here is a decision.",
        "_gate": ["every member's code is Confident (r-confidence-not-person-settled-sam-2026-11-23): a person's move of "
                  "that course, a person's save for that college's code (noncredit under its own category), a person's "
                  "statewide filing, a noncredit course's COCI category code, or the code's statewide call at 90% or more",
                  "the settled codes give one code or a split along the codes; both pass",
                  "the outcomes comparison ran on the current reads, and no strong or partial split waits on an answer"],
        "_sources": {"members": "unified_courses_members.js generated %s" % members_at,
                     "courses": COURSES_DIR.replace(os.sep, "/") + "/<slug>.json",
                     "decisions": sd.STATUS.replace(os.sep, "/"),
                     "subject_map": SUBJECT_MAP.replace(os.sep, "/"),
                     "calls": CALLS.replace(os.sep, "/"), "confident_from": CONFIDENT,
                     "state_list": "coci_lookup_data.js (band and category where a catalog is not filed)",
                     "outcomes_compare": cmp_path, "outcomes_compare_rows": cmp_rows,
                     "outcomes_reads_rows": reads_rows, "outcomes_current": current},
        "scopes": scopes,
    }


def summary(doc):
    lines = []
    s = doc["_sources"]
    lines.append("outcomes compare %s: %d rows against %d in the reads (%s)" % (
        s["outcomes_compare"], s["outcomes_compare_rows"], s["outcomes_reads_rows"],
        "current" if s["outcomes_current"] else "not current"))
    for name, sc in doc["scopes"].items():
        lines.append("%s (%s %s): %d M-IDs, %d ready, %d held; %d members %s; %d M-IDs fully settled" % (
            name, sc["college"], sc["code"], sc["mids"], sc["ready"], sc["held"], sc["members"],
            json.dumps(sc["member_status"]), sc["fully_settled_mids"]))
        for c in sc["codes_to_settle"][:12]:
            lines.append("  %s %s (%s): %s, %d members%s" % (
                c["college"], c["code"], c["band"], c["status"], c["members"],
                ", subject map drafts %s" % c["subject_map_draft"] if c["subject_map_draft"] else ""))
    return "\n".join(lines)


def dump(doc):
    return json.dumps(doc, ensure_ascii=False, indent=1, sort_keys=False) + "\n"


def main(argv):
    doc = build()
    text = dump(doc)
    path = os.path.join(ROOT, OUT)
    if "--stdout" in argv:
        print(summary(doc))
        return 0
    if "--check" in argv:
        if not os.path.exists(path) or open(path, encoding="utf-8").read() != text:
            print("STALE: %s. Run python3 kb/_mid_readiness.py" % OUT)
            return 1
        print("ok: %s is current" % OUT)
        return 0
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    print(summary(doc))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

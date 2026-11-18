#!/usr/bin/env python3
"""The titles that have left MAP, each with what Sam needs to act on it from one row (S678, COBIx's item 2).

Sam, 2026-11-17: "Need a way to take action on them." "These are local exhibit titles, right? I don't change those,
just canonicalized titles they sit under." "I need to have the Cpl type for each canon and local title nearby."
"Keep Cx and portfolio together since they function the same and result in a letter grade."

Reads committed files only and writes kb/exhibit_left_map.json, which exhibits.js reads for the leftover-title list:

- `titles`: each old local title the auditor tags stale_kb_entry (and not unclassified_in_map), keyed by the raw title
  as unified_titles.json holds it, with its canonical title, its CPL type and group, whether anything still points at
  it (`used`, with where), its live near-twin (`twin`), whether Sam reviewed its link (`reviewed`), and whether it is the
  only local title still under its canonical (`only_local`).
- `canonicals`: every canonical title's CPL type label and group, from all of its local titles (official wording when
  known, else the exhibit-id path), for the labels in the Move search box and the combine picker.

The reviewer's identity never leaves this script: a title is `reviewed` when its reviewed_by is the Senior Advisor's
reviewer identity, read from the environment variable LEFT_MAP_REVIEWER or, by default, the most frequent human
reviewer among the leftover titles (2026-11-17: 112 titles). Bot cohorts (an address ending @bot) never count.

    python3 kb/_build_left_map.py           # write kb/exhibit_left_map.json
    python3 kb/_build_left_map.py --check   # exit 1 if the committed file is stale
"""
import argparse
import collections
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import exhibit_paths as XP  # noqa: E402  (the one reader of a MAP id's path)

OUT = "kb/exhibit_left_map.json"
GRADED = ("Credit By Exam", "Portfolio Review")
CERT = ("Industry Certification", "Standardized Assessment", "Military", "Other")
# A MAP id's path, in MAP's own six CPL Type Description words (exhibit_paths.py's keys).
PATH_TYPE = {"ic": "Industry Certification", "cx": "Credit By Exam", "pr": "Portfolio Review",
             "sa": "Standardized Assessment", "other": "Other"}


def _load(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return json.load(f)


def group_of(types):
    """'graded', 'cert', 'mixed' (both groups) or '' from a set of CPL type words."""
    g = {"graded" if t in GRADED else "cert" for t in types if t in GRADED or t in CERT}
    return "mixed" if len(g) > 1 else (g.pop() if g else "")


def label(types):
    """One type, a mixed label that lists them, or 'CPL type not recorded'."""
    ts = [t for t in GRADED + CERT if t in types]
    if not ts:
        return "CPL type not recorded"
    if len(ts) == 1:
        return ts[0]
    return ", ".join(ts[:-1]) + " and " + ts[-1] + " (mixed)"


def norm(s):
    """Wording with extra spaces, punctuation and case ignored."""
    return re.sub(r"[^a-z0-9]+", " ", str(s or "").lower()).strip()


def kind(s):
    """noncredit, industry or '' from a title's wording, so a noncredit title is never a twin of an industry one."""
    n = norm(s)
    if n.startswith("noncredit"):
        return "noncredit"
    if n.startswith("industry"):
        return "industry"
    return ""


def official_types(arts):
    """raw local title (stripped) -> the set of MAP CPL Type Description words on its course-credit listings."""
    out = collections.defaultdict(set)
    for a in arts:
        t, ty = (a.get("exhibit_title") or "").strip(), (a.get("cpl_type_description") or "").strip()
        if t and ty:
            out[t].add(ty)
    return out


def path_types(entry, extra_ids=()):
    return {PATH_TYPE[k] for k in (XP.path_of(i) for i in list(entry.get("source_exhibit_ids") or []) + list(extra_ids)) if k}


def build():
    ut = _load("kb/unified_titles.json")
    audit = _load("kb/exhibit_audit/latest.json")
    arts = _load("kb/coci_articulations.json").get("articulations") or []
    gone = [c for c in audit.get("title_cards") or []
            if "stale_kb_entry" in (c.get("tags") or []) and "unclassified_in_map" not in (c.get("tags") or [])]
    gone_raw = {c.get("raw_title") for c in gone}
    live = [r for r in ut if r not in gone_raw]
    off = official_types(arts)

    def types_of(raw):
        e = ut.get(raw) or {}
        o = off.get(raw.strip())
        return set(o) if o else path_types(e)

    # Where an old title still appears: a course-credit listing (exhibit_title), or a Common CR worklist row.
    on_listing = {(a.get("exhibit_title") or "").strip() for a in arts}
    cr_rows = set()
    try:
        crw = _load("kb/cr_reference_worklist.json")
        blob = json.dumps(crw, ensure_ascii=False)
    except (OSError, ValueError):
        blob = ""

    # Canonical -> its local titles; and the twin indexes over the titles still in MAP.
    locals_of = collections.defaultdict(list)
    for r, e in ut.items():
        if (e or {}).get("unified_title"):
            locals_of[e["unified_title"]].append(r)
    live_by_canon = collections.defaultdict(list)
    live_by_norm = collections.defaultdict(list)
    for r in live:
        e = ut.get(r) or {}
        live_by_canon[e.get("unified_title")].append(r)
        live_by_norm[norm(r)].append(r)

    reviewers = collections.Counter((ut.get(c["raw_title"]) or {}).get("reviewed_by") for c in gone)
    who = os.environ.get("LEFT_MAP_REVIEWER") or next(
        (w for w, _ in reviewers.most_common() if w and not w.endswith("@bot")), None)

    def twin(raw, canon):
        n, k = norm(raw), kind(raw)
        same = [r for r in live_by_norm.get(n, []) if r != raw]
        if same:
            return {"title": same[0].strip(), "how": "the same wording"}
        under = [r for r in live_by_canon.get(canon, []) if kind(r) == k]
        if under:
            return {"title": sorted(under, key=lambda x: x.strip())[0].strip(), "how": "already under the same title"}
        # A clearly longer form of the same path: one title's words are the other's, in order, with words added.
        words = n.split()
        if len(words) >= 3:
            for r in live:
                rn = norm(r)
                if kind(r) == k and rn != n and rn.startswith(words[0]) and _subseq(words, rn.split()):
                    return {"title": r.strip(), "how": "a longer form of the same wording"}
        return None

    titles = {}
    for c in gone:
        raw = c.get("raw_title")
        e = ut.get(raw) or {}
        canon = e.get("unified_title") or c.get("unified_title")
        ty = types_of(raw)
        where = []
        if raw.strip() in on_listing:
            where.append("course-credit listing")
        if blob and json.dumps(raw.strip(), ensure_ascii=False)[1:-1] in blob:
            where.append("Common CR worklist")
        titles[raw] = {
            "canonical": canon, "type": label(ty), "group": group_of(ty),
            "used": bool(where), "where": where, "twin": twin(raw, canon),
            "reviewed": bool(who) and e.get("reviewed_by") == who,
            "only_local": len(locals_of.get(canon, [])) == 1,
        }

    canonicals = {}
    for canon, raws in locals_of.items():
        ty = set()
        for r in raws:
            ty |= types_of(r)
        canonicals[canon] = {"type": label(ty), "group": group_of(ty)}

    def count(f):
        return sum(1 for t in titles.values() if f(t))
    counts = {
        "titles": len(titles),
        "credentials": len({t["canonical"] for t in titles.values()}),
        "nothing_points": count(lambda t: not t["used"]),
        "still_used": count(lambda t: t["used"]),
        "reviewed": count(lambda t: t["reviewed"]),
        "nothing_points_with_twin": count(lambda t: not t["used"] and t["twin"] and not t["reviewed"]),
        "nothing_points_no_twin": count(lambda t: not t["used"] and not t["twin"] and not t["reviewed"]),
        "nothing_points_no_twin_only_local": count(lambda t: not t["used"] and not t["twin"] and not t["reviewed"] and t["only_local"]),
        "with_twin": count(lambda t: t["twin"]),
    }
    return {"schema": 1, "built_from": {"audit": audit.get("_generated_at"), "unified_titles": len(ut)},
            "rule": {"graded": list(GRADED), "cert_based": list(CERT),
                     "used": "the old title still appears on a course-credit listing or a Common CR worklist row",
                     "twin": "a title still in MAP with the same wording once spaces and punctuation are ignored, "
                             "or already under the same canonical title, or a longer form of the same wording; "
                             "a noncredit title is never a twin of an industry title"},
            "counts": counts, "titles": {k: titles[k] for k in sorted(titles)},
            "canonicals": {k: canonicals[k] for k in sorted(canonicals)}}


def _subseq(a, b):
    it = iter(b)
    return len(b) > len(a) and all(w in it for w in a)


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args(argv)
    data = build()
    text = json.dumps(data, indent=1, ensure_ascii=False) + "\n"
    path = os.path.join(ROOT, OUT)
    if a.check:
        try:
            cur = open(path, encoding="utf-8").read()
        except OSError:
            cur = ""
        print(OUT + (" is current" if cur == text else " is STALE: run python3 kb/_build_left_map.py"))
        return 0 if cur == text else 1
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    print("wrote " + OUT + ": " + json.dumps(data["counts"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())

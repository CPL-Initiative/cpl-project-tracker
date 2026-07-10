#!/usr/bin/env python3
"""Stratified calibration sample for the CCR Merge/Mint Doctrine mind-meld.

Reads the committed suggested-merges payload (unified_courses_suggestions.js),
computes doctrine-trigger features per group (the same features the worklist's
🧠 Mind-meld panel computes client-side), assigns each group to its first
matching stratum (priority order below), and draws a seeded, reproducible
sample per stratum.

The sample is the calibration instrument (kb/merge_doctrine.md Part V):
an AI pass pre-decides every sampled group against Doctrine v0 with cited
rules + confidence; Sam voice-reviews the calls (agree / disagree + why) and
disagreements become doctrine edits. When a FRESH sample agrees >=90%, the
doctrine graduates and the full batch pass is authorized.

Read-only: mutates nothing, writes only to kb/doctrine_out/<date>/.

Run from repo root:  python3 kb/_doctrine_calibration_sample.py [--per-stratum 6]
"""
import argparse
import json
import os
import random
import re

SD = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SD)
SEED = 20260710          # fixed — the sample must be reproducible (fresh sitting, Session 111)
DATE = "2026-07-10"

LEVEL_WORDS = {"beginning", "beginner", "elementary", "introductory", "basic",
               "intermediate", "advanced", "first", "second", "third", "fourth"}
ROMAN = {"i", "ii", "iii", "iv", "v", "vi", "vii", "viii"}
WORDNUM = {"one", "two", "three", "four", "five", "six", "seven", "eight"}
VARIANT_WORDS = {"honors", "lab", "laboratory", "refresher", "recertification",
                 "update", "instructor", "supervisor", "module", "bridge"}
GENERIC_PAT = re.compile(
    r"\b(special topics?|selected topics?|independent stud|directed stud|"
    r"work experience|internship|practicum|seminar in|topics in)\b", re.I)
STRAND_PAT = re.compile(
    r"\b(reading|writing|grammar|conversation|listening|speaking|"
    r"pronunciation|vocabulary)\b", re.I)
ACTIVITY_DISCS = {"Kinesiology", "Dance", "Music", "Drama/Theater Arts"}


def _tokens(t):
    return re.findall(r"[a-z0-9]+", (t or "").lower())


def level_marks(title):
    """Set of level marks in a title — digits, romans, word-numbers, level words."""
    marks = set()
    for tok in _tokens(title):
        if tok.isdigit() and 1 <= int(tok) <= 12:
            marks.add(int(tok))
        elif tok in ROMAN:
            marks.add(len(tok) if set(tok) == {"i"} else {"iv": 4, "v": 5,
                      "vi": 6, "vii": 7, "viii": 8}.get(tok, 0))
        elif tok in WORDNUM:
            marks.add(list(WORDNUM).index(tok) + 1)
        elif tok in LEVEL_WORDS:
            marks.add("W:" + tok)
    return marks


def features(g, lane):
    """Doctrine-trigger features for one worklist group (pure function)."""
    mems = g.get("members", [])
    titles = [m.get("t") or "" for m in mems]
    units = [m.get("u") for m in mems if m.get("u") is not None]
    discs = {m.get("d") for m in mems if m.get("d")}
    f = set()
    # level ladder: >=3 members carrying distinct level marks
    per = [level_marks(t) for t in titles]
    distinct = set()
    for s in per:
        distinct |= s
    if len([s for s in per if s]) >= 3 and len(distinct) >= 3:
        f.add("level_ladder")
    if len(mems) >= 3 and sum(1 for t in titles if STRAND_PAT.search(t)) >= 2:
        f.add("skill_strands")
    if units and min(units) == 0 and max(units) > 0:
        f.add("credit_noncredit_mix")
    bands = {m["id"].split()[-1][0] for m in mems
             if re.match(r"^[A-Z]{2,4} [MZ]\d", m.get("id") or "")}
    if len(bands) >= 2:
        f.add("credit_noncredit_mix")
    if len(units) >= 2 and (max(units) - min(units)) >= 2:
        f.add("units_spread")
    if g.get("same_college"):
        f.add("same_college")
    if len(discs) >= 2:
        f.add("cross_discipline")
    if any(GENERIC_PAT.search(t) for t in titles):
        f.add("generic_title")
    vsets = [set(_tokens(t)) & VARIANT_WORDS for t in titles]
    if any(vsets) and not all(vsets):
        f.add("honors_variant")
    if (discs & ACTIVITY_DISCS) and ("level_ladder" in f or len(mems) >= 4):
        f.add("activity_ladder")
    if discs & {"English as a Second Language", "Foreign Languages"}:
        f.add("esl_language")
    if len(mems) >= 6:
        f.add("big_group")
    if lane == "evidence":
        f.add("evidence_lane")
    return f


# Stratum priority — a group lands in its FIRST matching stratum.
STRATA = [
    ("level_ladder",       lambda f, lane: "level_ladder" in f),
    ("skill_strands",      lambda f, lane: "skill_strands" in f),
    ("credit_noncredit",   lambda f, lane: "credit_noncredit_mix" in f),
    ("activity_ladder",    lambda f, lane: "activity_ladder" in f),
    ("generic_title",      lambda f, lane: "generic_title" in f),
    ("honors_variant",     lambda f, lane: "honors_variant" in f),
    ("same_college",       lambda f, lane: "same_college" in f),
    ("cross_discipline",   lambda f, lane: "cross_discipline" in f),
    ("units_spread",       lambda f, lane: "units_spread" in f),
    ("evidence_lane",      lambda f, lane: lane == "evidence"),
    ("plain_anchored",     lambda f, lane: lane == "anchored"),
    ("plain_singleton",    lambda f, lane: lane == "singleton"),
    ("plain_similarity",   lambda f, lane: lane in ("title", "desc", "family")),
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--per-stratum", type=int, default=6)
    args = ap.parse_args()

    raw = open(os.path.join(ROOT, "unified_courses_suggestions.js"),
               encoding="utf-8").read()
    start = raw.index("{", raw.index("CPL_UC_SUGGESTIONS"))
    data = json.loads(raw[start:raw.rindex("}") + 1])

    lanes = [("anchored", "groups"), ("singleton", "singleton_groups"),
             ("family", "family_groups"), ("desc", "desc_groups"),
             ("title", "title_groups"), ("evidence", "evidence_groups")]
    buckets = {name: [] for name, _ in STRATA}
    n_groups = 0
    for lane, key in lanes:
        for g in data.get(key) or []:
            if len(g.get("members", [])) < 2:
                continue
            n_groups += 1
            f = features(g, lane)
            for name, test in STRATA:
                if test(f, lane):
                    buckets[name].append((lane, g, sorted(
                        x for x in f if isinstance(x, str))))
                    break

    rng = random.Random(SEED)
    sample = []
    for name, _ in STRATA:
        pool = buckets[name]
        take = pool if len(pool) <= args.per_stratum \
            else rng.sample(pool, args.per_stratum)
        for lane, g, f in sorted(take, key=lambda x: x[1].get("sig") or ""):
            sample.append({
                "stratum": name, "lane": lane, "features": f,
                "sig": g.get("sig"), "score": g.get("score"),
                "same_college": bool(g.get("same_college")),
                "credential": g.get("credential"),
                "members": g.get("members"),
            })

    odir = os.path.join(SD, "doctrine_out", DATE)
    os.makedirs(odir, exist_ok=True)
    out = {
        "generated_from": data.get("generated_at"),
        "seed": SEED, "per_stratum": args.per_stratum,
        "universe_groups": n_groups,
        "stratum_sizes": {k: len(v) for k, v in buckets.items()},
        "sample": sample,
    }
    with open(os.path.join(odir, "calibration_sample.json"), "w",
              encoding="utf-8") as fh:
        json.dump(out, fh, indent=1, ensure_ascii=False)

    print(f"universe: {n_groups} groups; sampled {len(sample)}")
    for k, v in buckets.items():
        print(f"  {k:20s} pool={len(v):5d} sampled={min(len(v), args.per_stratum)}")
    print(f"→ {odir}/calibration_sample.json")


if __name__ == "__main__":
    main()

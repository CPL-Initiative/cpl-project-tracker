#!/usr/bin/env python3
"""Similar-course FAMILY consolidation dry-run (Session 57, Sam 2026-06-16).

The level-safe worklist signature (`_sug_sig`) keeps "X 1" / "X 2" / "Advanced X"
apart ON PURPOSE — so Calculus I never fuses with Calculus II. But for CPL
(Title 5 §55050: a college may grant credit for prior learning *similar* to a
course's objectives) those level variants are usually ONE common course, and
under-merging fragments a credential across many M-IDs (CompTIA A+ → 24 M-IDs),
hurting portability. Sam's call (2026-06-16): "better to over-merge than
under-merge … merge every reasonably similar course."

This lane is the inverse of the level-safe signature: it COLLAPSES the level axis
(exactly the marks `_consolidation_guards` treats as level_risk — beginning /
intermediate / advanced / I-IX / digits / section letters) and groups the
remaining SAME-SUBJECT tokens into a course FAMILY. So "Beginning Voice",
"Intermediate Voice", "Advanced Voice 1-2", "Elementary Voice 1-2" all surface as
ONE curator-confirmable group. Gender ("Men's"/"Women's"), sport, and
variant-type ("Refresher"/"Lab") words are NOT level marks, so they stay as
distinguishing tokens — the signature separates them naturally (a belt-and-
suspenders gender/sport check is applied anyway).

MEASURE-FIRST: writes a receipt + prints a quality report; NEVER auto-applies.
Wiring a "similar family" worklist lane is a FOLLOW-UP, after the quality here is
reviewed. Mirrors the title/desc lanes: committed receipt, re-run manually, the
generator only JOINS it (validating live mergeable rows) so the daily cron stays
flat.

Scope: minted M-IDs (coci_minted_courses.json) + Stand-Alone singletons
(coci_minted_singletons.json) — the synthetic tier only. Official C-ID/CCN
anchors are never members (authoritative); a later generator join can attach one
as the ★ merge target when it shares the family signature.

Run from repo root: python3 kb/_similar_family_dryrun.py
"""
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime as _dt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _consolidation_guards as G  # noqa: E402

SD = os.path.dirname(os.path.abspath(__file__))


def kb(p):
    return os.path.join(SD, p)


# The level vocabulary we COLLAPSE = exactly the guard suite's level axis, so
# this lane is the precise inverse of level_risk. A couple of obvious synonyms
# the guard set omits are added; ambiguous markers (high/low/upper/lower) are
# deliberately NOT collapsed — "High Voltage"/"High School" aren't levels.
LEVEL_WORDS = set(G.LEVEL_WORDS) | {"beginner", "introduction", "intro",
                                    "preparatory", "prep", "developmental"}
ROMAN = set(G.ROMAN)
WORDNUM = set(G.WORDNUM)
ARTICLES = {"the", "of", "to", "and", "for", "with", "in", "a", "an", "on",
            "at", "as", "or", "by"}
SECTION = re.compile(r"^[a-h]$")  # bare section letters a..h


def level_sig(title):
    """Same-subject FAMILY key: substantive tokens with the level axis removed.

    Drops level words (begin/interm/adv…), roman/word/digit ordinals, bare
    section letters, and articles; lowercases; sorts unique tokens. KEEPS every
    other token (so gender/sport/variant/topic words still distinguish)."""
    t = re.sub(r"\([^)]*\)", " ", str(title or "").lower())
    t = re.sub(r"[^a-z0-9 ]+", " ", t)
    keep = []
    for w in t.split():
        if w in ARTICLES or w in LEVEL_WORDS or w in ROMAN or w in WORDNUM:
            continue
        if w.isdigit():            # any numeric level/sequence
            continue
        if SECTION.match(w):       # bare a..h section letter
            continue
        keep.append(w)
    return " ".join(sorted(set(keep)))


def _num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def main():
    # ---- collect minted parents + singletons into one member pool ----------
    members = {}   # id -> dict(title, subj4, units, disc, credit, standalone, colleges:set)
    parents = json.load(open(kb("coci_minted_courses.json")))["courses"]
    for cid, rec in parents.items():
        members[cid] = {
            "title": rec.get("common_title"), "subj4": rec.get("subject_4letter") or cid.split(" ")[0],
            "units": _num(rec.get("typical_units")), "disc": rec.get("discipline") or "",
            "credit": rec.get("credit_status") or "", "standalone": False,
            "ncol": rec.get("source_college_count") or len(rec.get("corroboration_members") or []) or 2,
            "college": None,
        }
    sings = json.load(open(kb("coci_minted_singletons.json")))["courses"]
    for cid, rec in sings.items():
        members[cid] = {
            "title": rec.get("common_title"), "subj4": rec.get("subject_4letter") or cid.split(" ")[0],
            "units": _num(rec.get("typical_units")), "disc": rec.get("discipline") or "",
            "credit": rec.get("credit_status") or "", "standalone": True,
            "ncol": 1, "college": rec.get("college"),
        }

    # ---- group by (subj4, level_sig) ---------------------------------------
    groups = defaultdict(list)
    for cid, m in members.items():
        if not m["title"]:
            continue
        s = level_sig(m["title"])
        if not s:
            continue
        groups[(m["subj4"], s)].append(cid)

    out_groups = []
    gender_sport_blocked = 0
    for (subj4, sig), ids in groups.items():
        if len(ids) < 2:
            continue
        # belt-and-suspenders: drop a family whose members carry conflicting
        # gender or sport marks (the signature should already separate them).
        marks = [G.extract_marks(members[i]["title"]) for i in ids]
        genders = {g for mk in marks for g in mk["gender"]}
        sports = {s2 for mk in marks for s2 in mk["sports"]}
        if len(genders) > 1 or len(sports) > 1:
            gender_sport_blocked += 1
            continue
        us = [members[i]["units"] for i in ids if members[i]["units"] is not None]
        umin, umax = (min(us), max(us)) if us else (None, None)
        spread = (umax - umin) if us else None
        # colleges: singletons carry one; parents are inherently multi-college.
        cols = set()
        has_parent = False
        for i in ids:
            if members[i]["standalone"]:
                if members[i]["college"]:
                    cols.add(members[i]["college"])
            else:
                has_parent = True
        same_college = (not has_parent) and len(cols) <= 1 and not (len(cols) == 0)
        discs = Counter(members[i]["disc"] for i in ids if members[i]["disc"])
        disc_modal = discs.most_common(1)[0][0] if discs else ""
        disc_agree = (discs.most_common(1)[0][1] / len(ids)) if discs else 0.0
        units_agree = (sum(1 for u in us if umin is not None and abs(u - umin) < 0.5) / len(ids)) if us else 0.0
        score = round(0.4 * disc_agree + 0.3 * units_agree + 0.3 * min(len(ids), 10) / 10.0, 3)
        out_groups.append({
            "subj4": subj4, "sig": sig, "n": len(ids),
            "score": score, "units_min": umin, "units_max": umax,
            "units_spread": spread, "same_college": same_college,
            "has_parent": has_parent, "disc_modal": disc_modal,
            "disc_agree": round(disc_agree, 2),
            "members": [{"id": i, "standalone": members[i]["standalone"],
                         "t": members[i]["title"], "u": members[i]["units"],
                         "d": members[i]["disc"]} for i in sorted(ids)],
        })
    out_groups.sort(key=lambda g: (g["same_college"], -g["score"], -g["n"]))

    # ---- receipt -----------------------------------------------------------
    # Fixed path (no date subdir) matching the title/desc lanes, so a future
    # generator JOIN can read it predictably. Provenance is in generated_at.
    odir = kb("similar_family_out")
    os.makedirs(odir, exist_ok=True)
    json.dump({"generated_at": _dt.now().isoformat(),
               "method": "level-collapsing same-subject family grouping",
               "status": "DRY-RUN",
               "count": len(out_groups),
               "groups": out_groups},
              open(os.path.join(odir, "candidates.json"), "w"),
              ensure_ascii=False, indent=1)

    # ---- quality report ----------------------------------------------------
    tot_ids = sum(g["n"] for g in out_groups)
    def bucket(pred):
        return sum(1 for g in out_groups if pred(g))
    size = Counter("2" if g["n"] == 2 else "3-5" if g["n"] <= 5 else "6-10" if g["n"] <= 10 else "11+"
                   for g in out_groups)
    spreads = [g for g in out_groups if g["units_spread"] is not None]
    print(f"Similar-course FAMILY dry-run — {_dt.now():%Y-%m-%d %H:%M}")
    print(f"  families (>=2 members): {len(out_groups):>6}")
    print(f"  identities they cover : {tot_ids:>6}")
    print(f"  gender/sport-blocked  : {gender_sport_blocked:>6}")
    print("  by size:        " + "  ".join(f"{k}:{size[k]}" for k in ("2", "3-5", "6-10", "11+")))
    print(f"  cross-college   : {bucket(lambda g: not g['same_college']):>6}"
          f"   same-college: {bucket(lambda g: g['same_college'])}")
    print(f"  contains a parent (already multi-college M-ID): {bucket(lambda g: g['has_parent'])}")
    print(f"  discipline unanimous (agree==1.0): {bucket(lambda g: g['disc_agree'] == 1.0)}")
    if spreads:
        print("  unit spread:    " +
              f"0u:{sum(1 for g in spreads if g['units_spread'] == 0)}  "
              f"<=1u:{sum(1 for g in spreads if 0 < g['units_spread'] <= 1)}  "
              f"<=2u:{sum(1 for g in spreads if 1 < g['units_spread'] <= 2)}  "
              f">2u:{sum(1 for g in spreads if g['units_spread'] > 2)}")
    print("\n  CLEAN sample (cross-college, units uniform, >=3 members, disc unanimous):")
    clean = [g for g in out_groups if not g["same_college"] and g["n"] >= 3
             and (g["units_spread"] in (0, None)) and g["disc_agree"] == 1.0]
    for g in clean[:8]:
        print(f"    {g['subj4']:5} \"{g['sig']}\" ({g['n']}, {g['disc_modal']}, {g['units_min']}u) "
              + " / ".join(repr(m['t']) for m in g['members'][:3]))
    print("\n  REVIEW-NEEDED sample (wide unit spread >2u — possible bad merge):")
    wide = [g for g in out_groups if g["units_spread"] is not None and g["units_spread"] > 2]
    for g in wide[:8]:
        print(f"    {g['subj4']:5} \"{g['sig']}\" ({g['n']}, {g['units_min']}-{g['units_max']}u) "
              + " / ".join(repr(m['t']) + f"[{m['u']}u]" for m in g['members'][:4]))
    print(f"\n  receipt -> {os.path.relpath(odir, SD)}/candidates.json")
    print("  DRY-RUN only — wiring the worklist lane is a follow-up after review.")


if __name__ == "__main__":
    main()

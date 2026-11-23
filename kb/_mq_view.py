#!/usr/bin/env python3
"""The MQ view: every Minimum Qualifications discipline with its list type, its Title 5 provisions, its common subject
code and what our data holds under it (S717).

Sam, 2026-11-23: "we may need an mq view that integrates our subj codes and decisions to we can troubleshoot anything
moving forward. I was originally thinking we only needed the 4-character codes for each discipline, but to properly
assign the local subjects to the canonical subject codes, we need more information it seems."

One row per discipline in kb/reference/mq_handbook_20th.json (kb/_mq_handbook_parse.py), joined to:
  - kb/discipline_canonical_subj4.json: the common subject code (through CANON_ALIAS where our name differs);
  - kb/coci_minted_courses.json: the M-IDs under the discipline, credit and noncredit, and the share of credit M-IDs
    whose TOP code the TOP manual marks vocational (kb/_join_cte_from_top.py's `cte`; TOP is authoritative for that
    flag, and the vocational flag marks a course's MQ type, master's or experience-based (Sam, 2026-11-23,
    r-top-vocational-flag-sets-mq-type-sam-2026-11-23); it never sets a discipline);
  - kb/status/statewide_subject_codes.json: the local subject codes whose call or statewide filing names the code;
  - kb/status/local_subject_titles.json noncredit_mq: the COCI noncredit categories that land on it.
Gaps say what to look at: no common subject code, our name differs from the handbook's, new in the 20th edition, a
noncredit category with no discipline, a vocational share that disagrees with the list type. Pure stdlib.
"""
import argparse
import json
import os
import re
import sys
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = "kb/status/mq_view.json"
HANDBOOK = "kb/reference/mq_handbook_20th.json"
CANON = "kb/discipline_canonical_subj4.json"
MINTED = "kb/coci_minted_courses.json"
STATEWIDE = "kb/status/statewide_subject_codes.json"
TITLES = "kb/status/local_subject_titles.json"
SECTIONS_19 = "kb/reference/mq_sections.json"
ALIASES = "kb/discipline_aliases.json"   # our discipline -> the other MQ names it answers to (Kinesiology <- Physical Education)

# Our discipline names that differ from the 20th edition's (the handbook name -> ours).
CANON_ALIAS = {
    "Specialized Instruction (Disabled Student Programs and Services): Noncredit": "Disabled Student Programs and Services: Noncredit",
    "Drafting/CADD (Computer Aided Drafting/Design), CAD (Computer Aided Design), CAD (Computer Aided Drafting)": "Drafting/CADD",
    "English as a Second Language (ESL)": "English as a Second Language",
    "Learning Assistance or Learning Skills Coordinators or Instructors, and Tutoring Coordinators": "Learning Assistance or Learning Skills",
    "Physical Education (Adapted): Disabled Student Programs and Services": "Physical Education Disabled Students",
    "Vocational (short-term): Noncredit": "Vocational", "Work Experience Instructors or Coordinators": "Work Experience Instructors",
    "Counseling: Extended Opportunity Programs and Services (EOPS)": "Counseling: Extended Opportunity",
    "Health Services Director/Health Services Coordinator/College Nurse": "Health Services Director/Health",
    "Specialized Instruction (Disabled Student Programs and Services): Vocational Noncredit": "Specialized Instruction: Vocational Noncredit",
}
# One discipline printed under two names in the index: the second points to the first.
SAME_AS = {"Theater Arts": "Drama/Theater Arts", "Speech Communication": "Communication Studies",
           "Media Production": "Broadcasting Technology", "Dietetics/Nutritional Science": "Nutritional Science/Dietetics"}
# A code's confidence: an assigned code carries its own (kb/_csr_assign_codes.py); a person's pick or an authority's
# code is Confident at 100% (r-confidence-not-person-settled-sam-2026-11-23: a person is one way to raise confidence).
LEVELS = ((0.90, "Confident"), (0.75, "Likely"), (0.50, "Leaning"), (0.0, "Unsure"))
TYPE_WORDS = {"masters": "Master's", "specific": "Specific degree", "any": "Any degree"}


def load(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return json.load(f)


def norm(s):
    return re.sub(r"[^a-z0-9]", "", str(s or "").lower().replace("’", "'"))


def build(hb, canon, minted, sw, titles, sec19, aliases=None):
    cd = canon.get("disciplines") or {}
    cby = {norm(k): k for k in cd}
    for ours, others in ((aliases or {}).get("aliases") or {}).items():
        if ours in cd:
            for o in others or []:
                cby.setdefault(norm(o), ours)
    hd = hb["disciplines"]
    by_name = {norm(v["name"]): k for k, v in hd.items()}
    old19 = {norm(re.sub(r"\s*\([^)]*\)\s*$", "", k)) for k in (sec19.get("disciplines") or {})} | {norm(k) for k in (sec19.get("disciplines") or {})}
    # M-IDs by our discipline name
    mids = defaultdict(Counter)
    mc = minted.get("courses") or []
    for r in (mc.values() if isinstance(mc, dict) else mc):
        d = r.get("discipline")
        cs = str(r.get("credit_status") or "")
        mids[d]["noncredit" if cs.startswith("Noncredit") else "credit"] += 1
        if not cs.startswith("Noncredit") and r.get("cte") is not None:
            mids[d]["voc_known"] += 1
            mids[d]["voc"] += 1 if r.get("cte") else 0
    # local codes by the common code their call or filing names
    codes = defaultdict(lambda: {"confident": 0, "other": 0, "filed": 0, "colleges": 0, "examples": []})
    for c in (sw.get("codes") or []):
        rec, fil = c.get("recommend") or {}, c.get("filing") or {}
        k = fil.get("common") or rec.get("common")
        if not k:
            continue
        e = codes[k]
        if fil.get("common"):
            e["filed"] += 1
        elif (rec.get("confidence") or 0) >= 0.9:
            e["confident"] += 1
        else:
            e["other"] += 1
        e["colleges"] += len(c.get("colleges") or [])
        if len(e["examples"]) < 6:
            e["examples"].append(c.get("code"))
    nc_cat = defaultdict(list)
    no_disc_cats = []
    for cat, m in ((titles.get("noncredit_mq") or {}).items()):
        if m.get("common_code"):
            nc_cat[m["common_code"]].append(cat)
        else:
            no_disc_cats.append(cat)
    rows = []
    for key, d in hd.items():
        name = d["name"]
        same = SAME_AS.get(name)
        ours = CANON_ALIAS.get(key) or CANON_ALIAS.get(name)
        ck = cby.get(norm(ours)) if ours else (cby.get(norm(key)) or cby.get(norm(name)))
        if not ck and same:
            ck = cby.get(norm(same))
        c = cd.get(ck) or {}
        code = c.get("canonical_subj4") or ""
        m = (mids.get(ck) if ck else None) or Counter()
        voc = round(m["voc"] / m["voc_known"], 2) if m["voc_known"] else None
        lc = codes.get(code) if code else None
        gaps = []
        conf = c.get("confidence") if c.get("source") == "assigned" else (1.0 if code else None)
        if not code:
            gaps.append("No common subject code" + (f"; the index's other name for {same}" if same else ""))
        if ck and norm(ck) != norm(name) and norm(ck) != norm(key):
            gaps.append(f"Our name is {ck}")
        if norm(name) not in old19 and norm(key) not in old19 and not any(norm(key).startswith(o) for o in old19 if len(o) > 5):
            gaps.append("New since the 19th edition")
        if voc is not None and m["voc_known"] >= 10:
            if d["types"] == ["masters"] and voc >= 0.5:
                gaps.append(f"Master's list, but {round(voc * 100)}% of its credit M-IDs carry a vocational TOP code, which takes the experience qualifications; check whether they belong to a vocational discipline")
            if "masters" not in d["types"] and d["types"] and voc < 0.5:
                gaps.append(f"Experience list, but only {round(voc * 100)}% of its credit M-IDs carry a vocational TOP code; check the TOP map and the courses placed here")
        if d.get("why"):
            gaps.append(d["why"])
        if not d["types"]:
            gaps.append("The index gives no list type")
        rows.append({"key": key, "name": name, "areas": d.get("areas") or "", "types": d["types"],
                     "type_words": " and ".join(TYPE_WORDS[t] for t in d["types"]) or "Not given",
                     "noncredit": d.get("noncredit", False), "provisions": d.get("provisions") or [],
                     "cite": d.get("code") or "", "pages": d.get("pages") or "",
                     "code": code, "our_name": ck or "", "same_as": same or "",
                     "confidence": conf, "level": (next(w for t, w in LEVELS if conf >= t) if conf is not None else None),
                     "code_source": ("assigned" if c.get("source") == "assigned" else "a person's pick" if code else None),
                     "code_note": c.get("_notes") if c.get("source") == "assigned" else (c.get("_notes") or ""),
                     "mids_credit": m["credit"], "mids_noncredit": m["noncredit"], "vocational_share": voc,
                     "local_codes": ({k: v for k, v in lc.items()} if lc else None),
                     "noncredit_categories": nc_cat.get(code, []) if code else [], "gaps": gaps})
    # The check on a changed code (Sam, 2026-11-23: "a small process for you to check that I haven't stepped on an
    # existing code"): one code on two disciplines, unless the index prints one discipline under two names or an
    # umbrella holds it; a code that is another discipline's C-ID or CCN prefix.
    owners = defaultdict(set)
    for r in rows:
        if r["code"] and not r["same_as"]:
            owners[r["code"]].add(r["our_name"] or r["name"])
    attributed = {}
    for k, e in cd.items():
        for x in (e.get("cid_subject_codes") or []) + ([e["ccn_subject_code"]] if e.get("ccn_subject_code") else []):
            attributed.setdefault(x, set()).add(k)
    for r in rows:
        if not r["code"] or r["same_as"]:
            continue
        mine = r["our_name"] or r["name"]
        others = sorted(owners[r["code"]] - {mine})
        if others:
            r["gaps"].append(f"{r['code']} is also the common subject code of {', '.join(others)}")
        elsewhere = sorted(attributed.get(r["code"], set()) - {mine})
        if elsewhere:
            r["gaps"].append(f"{r['code']} is a C-ID or CCN subject code attributed to {', '.join(elsewhere)}")
    rows.sort(key=lambda r: r["name"].lower())
    t = Counter()
    for r in rows:
        for x in r["types"]:
            t[x] += 1
    totals = {"disciplines": len(rows), "by_type": dict(t), "with_code": sum(1 for r in rows if r["code"]),
              "without_code": sum(1 for r in rows if not r["code"] and not r["same_as"]), "assigned": sum(1 for r in rows if r.get("code_source") == "assigned"), "noncredit": sum(1 for r in rows if r["noncredit"]),
              "with_gaps": sum(1 for r in rows if r["gaps"])}
    return {"_what": "Every Minimum Qualifications discipline (20th edition) with its list type, Title 5 provisions, common subject code and what our data holds under it. Written by kb/_mq_view.py; nothing here is a decision.",
            "_sources": {"handbook": HANDBOOK, "codes": CANON, "mids": MINTED, "local_codes": STATEWIDE, "noncredit_categories": TITLES},
            "types": hb.get("types"), "provisions": hb.get("provisions"), "noncredit_categories_without_discipline": no_disc_cats,
            "totals": totals, "rows": rows}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--out", default=os.path.join(ROOT, OUT))
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args(argv)
    doc = build(load(HANDBOOK), load(CANON), load(MINTED), load(STATEWIDE), load(TITLES), load(SECTIONS_19), load(ALIASES))
    text = json.dumps(doc, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n"
    old = open(a.out, encoding="utf-8").read() if os.path.exists(a.out) else None
    if a.check:
        return 0 if old == text else 1
    if old != text:
        with open(a.out, "w", encoding="utf-8") as f:
            f.write(text)
    t = doc["totals"]
    print(f"[mq_view] {t['disciplines']} disciplines, {t['with_code']} with a common subject code, {t['without_code']} without, {t['with_gaps']} with something to look at")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Build cpl_pathways_ccr_data.js — the Common Course Reference (CCR) enrichment
for the CPL Pathways tab's per-baccalaureate cards.

Keyed by "<NORMCOLLEGE>|<top4>" (one entry per baccalaureate program in
cpl_baccalaureates_data.js), it carries everything the redesigned pathway
section needs, in BOTH the student and college views:

  articulated[]  — courses the college already grants CPL for, each with:
      subj/num, the course title, unit value, the LOCAL cert name(s) a student
      presents (the searchable exhibit titles), the course's CCR reference
      (C-ID / CCN / minted M-ID) + kind, and the field-agreement peer list
      (other colleges that articulate the SAME CCR reference in this field).
      A `flag` is attached when the CCR reference is a cross-discipline
      over-merge (member_top_divergence — e.g. AUTO 116B folded into a
      Construction identity).

  opportunities[] — courses the college TEACHES (in catalog) but has not
      articulated, that a PEER articulates under the same CCR reference: the
      course-grain adoption gap. Collapsed to one row per reference.

Freshness: computed from the CURRENT kb/coci_minted_memberships.json +
kb/coci_minted_courses.json + kb/coci_articulations.json + the COCI catalog, so
every mint / re-mint / merge in the CCR pipeline ripples onto the pathways on
the next daily rebuild — no separate sync (per Sam, 2026-07-15). Contacts
(CPL coordinator + landing page) are fetched CLIENT-SIDE from map_college_contacts
and are NOT baked here.

Run: python kb/_build_cpl_pathway_ccr.py   (writes ./cpl_pathways_ccr_data.js)
"""
import json
import os
import re
from collections import defaultdict, Counter, OrderedDict

SCRIPT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KB = os.path.join(SCRIPT_DIR, "kb")

# Placeholder tokens that are NOT real identifiers (guard against matching on them).
_BAD_ID = {"", "none", "nan", "n/a", "na", "null", "not applicable", "0", "tbd", "pending"}


def _clean(v):
    v = ("" if v is None else str(v)).strip()
    return v if v.lower() not in _BAD_ID else ""


def _nnum(x):
    return re.sub(r"\.0+$", "", str(x).strip()).upper()


def _norm(c):
    return str(c or "").strip().upper()


def _top4(t):
    return str(t or "").strip()[:4]


def _load_json(name):
    p = os.path.join(KB, name)
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def _load_catalog():
    """(college, subj, num) -> {title, units, cid, ccn, top4}; plus college->top4->[(subj,num)]."""
    import openpyxl
    p = os.path.join(KB, "reference", "coci_course_list.xlsx")
    wb = openpyxl.load_workbook(p, read_only=True, data_only=True)
    ws = wb.active
    rows = ws.iter_rows(values_only=True)
    hdr = [(_clean(c) or "") for c in next(rows)]
    H = {h: i for i, h in enumerate(hdr)}
    cat = {}
    by_college_top = defaultdict(list)
    for row in rows:
        col = _clean(row[H["College"]])
        if not col:
            continue
        subj = _clean(row[H["Subject"]])
        num = _nnum(row[H["Course_Number"]])
        top4 = _top4(row[H["TopCode"]])
        try:
            units = float(row[H["UnitValue"]])
        except (TypeError, ValueError):
            units = None
        key = (_norm(col), subj.upper(), num)
        cat[key] = {
            "title": _clean(row[H["CourseTitle"]]),
            "units": units,
            "cid": _clean(row[H["CIDNumber"]]),
            "ccn": _clean(row[H["CommonCourseNumber"]]),
            "top4": top4,
        }
        if top4:
            by_college_top[(_norm(col), top4)].append((subj.upper(), num))
    return cat, by_college_top


def build():
    # cpl_baccalaureates_data.js is a JS asset at repo root; parse the object.
    bacc_raw = open(os.path.join(SCRIPT_DIR, "cpl_baccalaureates_data.js"), encoding="utf-8").read()
    bacc = json.loads(bacc_raw[bacc_raw.index("{"):bacc_raw.rindex("}") + 1])
    programs = bacc.get("programs", [])
    # The (college, top4) pairs we must enrich (one per baccalaureate program).
    wanted = OrderedDict()
    for p in programs:
        c = _norm(p.get("cer_college") or p.get("coci_college") or p.get("college"))
        t = _top4(p.get("top4") or p.get("top"))
        if c and t:
            wanted[(c, t)] = True

    # ---- membership reverse index + minted-course lookups ----
    mem = _load_json("coci_minted_memberships.json")["memberships"]
    mid_of = {}
    for mid, members in mem.items():
        for m in members:
            mid_of[(_norm(m["college"]), str(m["subject"]).upper(), _nnum(m["course_number"]))] = mid
    minted = _load_json("coci_minted_courses.json")["courses"]

    def ref_of(college, subj, num):
        """Resolve a course's Common Course Reference: prefer official C-ID/CCN,
        else the minted M-ID. Returns (kind, id, title, ref_top4, discipline).
        The over-merge flag is program-relative, so it's computed by the caller."""
        key = (_norm(college), str(subj).upper(), _nnum(num))
        mid = mid_of.get(key)
        rec = minted.get(mid) if mid else None
        if not rec:
            return (None, None, "", "", "")
        ccn = _clean(rec.get("ccn_id"))
        cid = _clean(rec.get("c_id"))
        title = _clean(rec.get("common_title"))
        ref_top4 = _top4(rec.get("top_code"))
        disc = _clean(rec.get("discipline"))
        if ccn:
            return ("CCN", ccn, title, ref_top4, disc)
        if cid:
            return ("C-ID", cid, title, ref_top4, disc)
        return ("CCR", mid, title, ref_top4, disc)

    def merge_flag(ref_top4, disc, t4):
        """A likely cross-field over-merge: the course's Common Course Reference
        sits in a DIFFERENT TOP field than this program's (e.g. Santa Ana's
        automotive AUTO 116 folded into a Construction reference at TOP 0957)."""
        if ref_top4 and t4 and ref_top4 != t4:
            return {
                "kind": "cross_field_merge",
                "detail": ("Reference sits in TOP %s%s, not this program's TOP %s — "
                           "a likely over-merge for the curation queue."
                           % (ref_top4, (" (" + disc + ")") if disc else "", t4)),
            }
        return None

    # ---- articulation index: local certs per (college,course) + who articulates each ref
    # NOTE: coci_articulations stamps the 2-digit TOP *division* ("58"), not the
    # 4-digit "0948", so we do NOT field-filter here — the program's field comes
    # from the CATALOG (correct 4-digit TOP) at assembly time.
    arts = _load_json("coci_articulations.json")["articulations"]
    artic_certs = defaultdict(OrderedDict)   # (col,subj,num) -> OrderedDict(exhibit_title -> True)
    articulators = set()                     # (col,subj,num) the college actually articulates
    ref_colleges = defaultdict(set)          # ref_id -> {colleges that articulate a course with that ref}
    GENERIC = {"credit by exam"}
    for a in arts:
        cols = [_norm(c) for c in (a.get("earned_by_colleges") or []) if _clean(c)]
        if not cols:
            continue
        exhibit = _clean(a.get("exhibit_title"))
        is_generic = _clean(a.get("unified_title")).lower() in GENERIC
        for lc in (a.get("local_courses") or []):
            subj = str(lc.get("subject", "")).upper()
            num = _nnum(lc.get("number", ""))
            if not subj or not num:
                continue
            for col in cols:
                k = (col, subj, num)
                articulators.add(k)
                if exhibit and not is_generic:
                    artic_certs[k].setdefault(exhibit, True)
    for (col, subj, num) in articulators:
        rid = ref_of(col, subj, num)[1]
        if rid:
            ref_colleges[rid].add(col)

    cat, by_college_top = _load_catalog()

    # Feeder fields: a multidisciplinary program (e.g. a management BS) draws CPL
    # from lower-division feeder disciplines coded under OTHER TOP codes than the
    # program's own. Each program's pathway is assembled across its own field PLUS
    # its declared feeders (kb/pathway_feeder_fields.json — the interim committed
    # form of the planned Supabase program-supplement store). Keyed
    # "<NORMCOLLEGE>|<top4>".
    try:
        feeder_cfg = (_load_json("pathway_feeder_fields.json") or {}).get("feeders", {})
    except (IOError, ValueError):
        feeder_cfg = {}

    # ---- assemble per-program payload, DRIVEN FROM THE CATALOG (current courses,
    # correct 4-digit field) ----
    out = OrderedDict()
    for (college, t4) in wanted:
        pkey = "%s|%s" % (college, t4)
        feeders = list((feeder_cfg.get(pkey) or {}).get("feeder_top4", []))
        courses = []
        seen = set()
        for f in [t4] + feeders:
            for (subj, num) in by_college_top.get((college, f), []):
                if (subj, num) in seen:
                    continue
                seen.add((subj, num))
                courses.append((subj, num))

        # pass 1 — articulated rows + the set of refs the college already holds
        art_rows, art_refs, units_total = [], set(), 0.0
        for (subj, num) in courses:
            if (college, subj, num) not in articulators:
                continue
            kind, rid, rtitle, ref_top4, disc = ref_of(college, subj, num)
            meta = cat.get((college, subj, num), {})
            # The over-merge flag compares the reference's field to the COURSE'S OWN
            # catalog field (not the program's) — so a Fire course legitimately in
            # TOP 2133 under a 2199 program is not flagged, but AUTO 116 → a
            # Construction reference still is.
            flag = merge_flag(ref_top4, disc, meta.get("top4") or t4)
            units = meta.get("units")
            if isinstance(units, (int, float)):
                units_total += units
            peers = sorted(ref_colleges.get(rid, set()) - {college}) if rid else []
            if rid:
                art_refs.add(rid)
            art_rows.append({
                "subj": subj, "num": num, "title": meta.get("title", ""),
                "units": units,
                "certs": list(artic_certs.get((college, subj, num), {}).keys()),
                "ref": {"kind": kind, "id": rid, "title": rtitle} if rid else None,
                "agree": len(peers),
                "peers": [c.title() for c in peers],
                "flag": flag,
            })
        art_rows.sort(key=lambda r: (-r["agree"], r["subj"], r["num"]))

        # pass 2 — opportunities: catalog courses the college does NOT articulate,
        # whose CCR reference a peer DOES articulate (collapsed one row per reference)
        opp_by_ref = OrderedDict()
        for (subj, num) in courses:
            if (college, subj, num) in articulators:
                continue
            kind, rid, rtitle, ref_top4, disc = ref_of(college, subj, num)
            if not rid or rid in art_refs:
                continue
            peers = ref_colleges.get(rid, set()) - {college}
            if not peers:
                continue
            meta = cat.get((college, subj, num), {})
            o = opp_by_ref.setdefault(rid, {
                "ref": {"kind": kind, "id": rid, "title": rtitle},
                "title": rtitle or meta.get("title", ""),
                "my_courses": [], "agree": len(peers),
                "peers": sorted(c.title() for c in peers),
            })
            label = "%s %s" % (subj, num)
            if label not in o["my_courses"]:
                o["my_courses"].append(label)
        opps = sorted(opp_by_ref.values(), key=lambda o: -o["agree"])

        out[pkey] = {
            "articulated": art_rows,
            "units_total": round(units_total, 1),
            "opportunities": opps,
            **({"feeders": feeders} if feeders else {}),
        }

    return out


def main():
    from datetime import datetime, timezone
    data = build()
    payload = {
        "_generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "_generated_by": "kb/_build_cpl_pathway_ccr.py",
        "_note": ("CCR enrichment for CPL Pathways cards, keyed '<NORMCOLLEGE>|<top4>'. "
                  "Rebuilt daily from the minted-identity + articulation + catalog sources "
                  "so mints/re-mints/merges stay fresh."),
        "count": len(data),
        "pathways": data,
    }
    out_js = os.path.join(SCRIPT_DIR, "cpl_pathways_ccr_data.js")
    with open(out_js, "w", encoding="utf-8") as f:
        f.write("window.CPL_PATHWAY_CCR = ")
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    print("wrote %s — %d pathways" % (out_js, len(data)))


if __name__ == "__main__":
    main()

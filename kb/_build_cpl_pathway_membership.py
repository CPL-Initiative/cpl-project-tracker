#!/usr/bin/env python3
"""Build cpl_pathways_membership_data.js — the AUTHORITATIVE, membership-driven
data for the CPL Pathways cards, replacing the TOP-proxy guess with the real
program->course join from the CCCCO Program Course File (program_course_graph.json).

For each CPL-Pathways baccalaureate (cpl_baccalaureates_data.js) this emits:
  · the BS's OWN course list (from the master file) + per-course POTENTIAL CPL —
    does this college already articulate it (✓), which local certs a student
    presents, the course's Common Course Reference, and how many PEER colleges
    give CPL for the same course (potential CPL even where the home college has
    not articulated it);
  · its QUALIFYING associate credentials (A.S. / A.A. / Certificate at the SAME
    college, in the BS's field + any declared feeder fields) — the lower-division
    credentials where the dense CPL actually lives. Each carries its own course
    list + per-course CPL, EMBEDDED-certificate nesting (cert.courses ⊆ AS/AA),
    and an inferred required-core ordering.

WHY (the 2026-07-16 run-through, StarMora): CCC baccalaureates are upper-division
programs whose own (new) courses carry ~0 CPL. The CPL lives in the qualifying
associate degree, and that lower-division credit is accepted toward BS access with
NONE of the CSU/UC transfer limits (Sam: "the real power … transfer mobility").
The old TOP-proxy swept EVERY catalog course in the field onto the BS card — only
~34% were really in the program, and every CPL mark shown sat on a NON-BS
(associate-degree) course. See docs/cpl_pathways_lessons.md and
docs/kb-notes/methodology-top-is-a-last-in-line-signal.md.

REQUIRED vs. ELECTIVE is NOT in COCI's data (it lives only in local catalogs —
see the graph builder's docstring). We INFER a required-core ordering from the
program's own structure, clearly LABELLED as inferred (`core_source`), never
presented as authoritative:
  · a course that sits in an EMBEDDED Certificate of Achievement is a required
    skill-block course (the cert is itself a required, standalone credential);
  · `core_freq` = how many credentials in the college's field family contain the
    course — foundational courses recur, niche electives don't.
The renderer lists inferred-core first, then the remaining program courses.

NO-OPs gracefully when kb/program_course_graph.json is absent (regenerate it with
kb/_build_program_course_graph.py — ~67 MB, not committed). Run AFTER that builder.

Run: python3 kb/_build_cpl_pathway_membership.py   (writes ./cpl_pathways_membership_data.js)
"""
import json
import os
import re
from collections import defaultdict, Counter, OrderedDict

SCRIPT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KB = os.path.join(SCRIPT_DIR, "kb")
GRAPH = os.path.join(KB, "program_course_graph.json")
OUT = os.path.join(SCRIPT_DIR, "cpl_pathways_membership_data.js")

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
    with open(os.path.join(KB, name), encoding="utf-8") as f:
        return json.load(f)


def award_kind(award):
    """Bucket a COCI AWARD string into the pathway roles we group on."""
    a = (award or "").upper()
    if "BACCAL" in a:
        return "BS"
    if "CERTIFICATE" in a:
        return "CERT"
    if ("A.S." in a or "A.A." in a or "ASSOCIATE" in a
            or "A.S-T" in a or "A.A-T" in a or "A.S- T" in a or "A.A- T" in a):
        return "AS"
    if "NONCREDIT" in a:
        return "NC"
    return "OTHER"


def _degree_of(award):
    a = (award or "")
    if "A.S-T" in a.upper() or "A.S- T" in a.upper():
        return ("Associate in Science for Transfer", "A.S.-T")
    if "A.A-T" in a.upper() or "A.A- T" in a.upper():
        return ("Associate in Arts for Transfer", "A.A.-T")
    if "A.S." in a.upper():
        return ("Associate of Science", "A.S.")
    if "A.A." in a.upper():
        return ("Associate of Arts", "A.A.")
    if "CERTIFICATE" in a.upper():
        return ("Certificate of Achievement", "Cert.")
    if "BACCAL" in a.upper():
        if "ARTS" in a.upper() or "B.A." in a.upper():
            return ("Bachelor of Arts", "B.A.")
        return ("Bachelor of Science", "B.S.")
    return (award or "", "")


def course_set(node):
    return set((c["subj"], c["num"]) for c in node["courses"]
               if c.get("subj") and c.get("num"))


# ── CPL index (adapted from kb/_build_cpl_pathway_ccr.py) ────────────────────

def build_cpl_index():
    """Return closures for per-course CPL resolution:
      ref_of(college, subj, num)  -> (kind, id, title)   Common Course Reference
      is_artic(college, subj, num)-> bool                this college grants CPL
      certs_of(college, subj, num)-> [local exhibit titles]
      peers_of(ref_id, exclude)   -> [colleges that articulate the same reference]
    Colleges are matched on _norm (upper) — articulation/membership sources use CER
    full names ("Santa Ana College"); the pathway directory carries the aligned
    cer_college, so norm() bridges them.
    """
    mem = _load_json("coci_minted_memberships.json")["memberships"]
    minted = _load_json("coci_minted_courses.json")["courses"]
    mid_of = {}
    for mid, members in mem.items():
        for m in members:
            mid_of[(_norm(m["college"]), str(m["subject"]).upper(), _nnum(m["course_number"]))] = mid

    def ref_of(college, subj, num):
        mid = mid_of.get((_norm(college), str(subj).upper(), _nnum(num)))
        rec = minted.get(mid) if mid else None
        if not rec:
            return (None, None, "")
        ccn = _clean(rec.get("ccn_id"))
        cid = _clean(rec.get("c_id"))
        title = _clean(rec.get("common_title"))
        if ccn:
            return ("CCN", ccn, title)
        if cid:
            return ("C-ID", cid, title)
        return ("CCR", mid, title)

    arts = _load_json("coci_articulations.json")["articulations"]
    artic_certs = defaultdict(OrderedDict)
    articulators = set()
    ref_colleges = defaultdict(set)
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
                articulators.add((col, subj, num))
                if exhibit and not is_generic:
                    artic_certs[(col, subj, num)].setdefault(exhibit, True)
    for (col, subj, num) in articulators:
        rid = ref_of(col, subj, num)[1]
        if rid:
            ref_colleges[rid].add(col)

    def is_artic(college, subj, num):
        return (_norm(college), str(subj).upper(), _nnum(num)) in articulators

    def certs_of(college, subj, num):
        return list(artic_certs.get((_norm(college), str(subj).upper(), _nnum(num)), {}).keys())

    def peers_of(ref_id, exclude):
        return sorted(ref_colleges.get(ref_id, set()) - {_norm(exclude)})

    return ref_of, is_artic, certs_of, peers_of


def course_cpl(college, subj, num, ref_of, is_artic, certs_of, peers_of):
    """Per-course CPL object, or None if we know of no CPL for this course
    anywhere. `articulated` = the home college grants it (a hard ✓); `agree`>0
    with articulated=False = POTENTIAL CPL (peers grant the same course)."""
    kind, rid, rtitle = ref_of(college, subj, num)
    artic = is_artic(college, subj, num)
    certs = certs_of(college, subj, num) if artic else []
    peers = peers_of(rid, college) if rid else []
    if not artic and not peers:
        return None
    peers_disp = [c.title() for c in peers]
    return {
        "articulated": artic,
        "certs": certs,
        "ref": ({"kind": kind, "id": rid, "title": rtitle} if rid else None),
        "agree": len(peers),
        "peers": peers_disp,
    }


# ── assemble ─────────────────────────────────────────────────────────────────

def build():
    graph = _load_json("program_course_graph.json")["programs"]
    ref_of, is_artic, certs_of, peers_of = build_cpl_index()

    # index the graph by (college_norm, control) and by college for family search
    by_col = defaultdict(list)          # college_norm -> [(control, node)]
    node_of = {}                        # control -> node
    for key, node in graph.items():
        col = key.split("|", 1)[0]
        control = key.split("|", 1)[1]
        by_col[col].append((control, node))
        node_of[control] = node

    # feeder fields (multidisciplinary programs draw qualifying credentials from
    # other TOP fields). Keyed "<NORM cer_college>|<top4>".
    try:
        feeder_cfg = (_load_json("pathway_feeder_fields.json") or {}).get("feeders", {})
    except (IOError, ValueError):
        feeder_cfg = {}

    # the 45 baccalaureate pathways (source of truth for which programs to build +
    # the CER-aligned college name for the CPL join).
    btxt = open(os.path.join(SCRIPT_DIR, "cpl_baccalaureates_data.js"), encoding="utf-8").read()
    bacc = json.loads(btxt[btxt.index("{"):btxt.rindex("}") + 1])

    def emit_courses(node, cpl_college, core_freq=None, incert_map=None):
        """Course rows with per-course CPL + (optional) inferred core signal."""
        rows = []
        n_cpl = 0
        for c in node["courses"]:
            subj, num = c.get("subj"), c.get("num")
            cpl = None
            if subj and num:
                cpl = course_cpl(cpl_college, subj, num, ref_of, is_artic, certs_of, peers_of)
                if cpl:
                    n_cpl += 1
            row = {
                "subj": subj, "num": num,
                "code": ("%s %s" % (subj, num)) if subj and num else _clean(c.get("course_id")),
                "title": c.get("title", ""),
                "units": c.get("units"),
                "cid": _clean(c.get("cid")),
                "resolved": bool(c.get("resolved")),
                "cpl": cpl,
            }
            if core_freq is not None and subj and num:
                key = (subj, num)
                incert = sorted(incert_map.get(key, [])) if incert_map else []
                row["core_freq"] = core_freq.get(key, 0)
                row["in_certs"] = incert
                row["tier"] = "core" if incert else "option"
            rows.append(row)
        # order: inferred-core first (by descending family frequency), then the
        # rest (also by frequency), then unresolved. Alpha within ties.
        if core_freq is not None:
            rows.sort(key=lambda r: (
                0 if r.get("tier") == "core" else 1,
                -(r.get("core_freq") or 0),
                r.get("subj") or "~", int(re.sub(r"\D", "", r.get("num") or "0") or 0)))
        else:
            rows.sort(key=lambda r: (0 if r["resolved"] else 1,
                                     r.get("subj") or "~",
                                     int(re.sub(r"\D", "", r.get("num") or "0") or 0)))
        return rows, n_cpl

    out = OrderedDict()
    stats = Counter()

    for p in bacc["programs"]:
        bctrl = p.get("control")
        bnode = node_of.get(bctrl)
        if not bnode:
            stats["bs_unmatched"] += 1
            continue
        stats["bs_matched"] += 1
        col_norm = _norm(bnode["college"])
        # CER-aligned college for the CPL join (falls back to the graph college)
        cpl_college = p.get("cer_college") or bnode["college"]
        t4 = _top4(bnode.get("top") or p.get("top4") or p.get("top"))
        feeders = list((feeder_cfg.get("%s|%s" % (_norm(p.get("cer_college")
                       or p.get("coci_college") or ""), t4)) or {}).get("feeder_top4", []))
        fields = set(f for f in ([t4] + feeders) if f)

        # ---- qualifying credentials at the same college in the BS field(s) ----
        fam = []   # (control, node, kind)
        for control, node in by_col.get(col_norm, []):
            if control == bctrl:
                continue
            nt4 = _top4(node.get("top"))
            if nt4 not in fields:
                continue
            k = award_kind(node.get("award"))
            if k in ("AS", "CERT"):
                fam.append((control, node, k))

        # family-frequency core signal (over the AS/AA/certs + the BS itself)
        fam_sets = {c: course_set(n) for c, n, _ in fam}
        fam_sets[bctrl] = course_set(bnode)
        core_freq = Counter()
        for s in fam_sets.values():
            for cc in s:
                core_freq[cc] += 1

        # embedded certs: cert.courses ⊆ some AA/AS.courses
        as_ctrls = [c for c, n, k in fam if k == "AS"]
        cert_ctrls = [c for c, n, k in fam if k == "CERT"]
        embeds_of = defaultdict(list)     # AS control -> [embedded cert controls]
        embedded_in = defaultdict(list)   # cert control -> [AS controls it nests in]
        for cc in cert_ctrls:
            cs = fam_sets[cc]
            if not cs:
                continue
            for ac in as_ctrls:
                if cs <= fam_sets[ac]:
                    embeds_of[ac].append(cc)
                    embedded_in[cc].append(ac)

        # per-course "in which embedded cert" map (for required-core ordering) —
        # a course is inferred-core if it belongs to an embedded certificate.
        incert_map = defaultdict(list)
        for cc in cert_ctrls:
            for course in fam_sets[cc]:
                incert_map[course].append(cc)

        def program_record(control, node, kind, is_bs=False):
            degree, abbr = _degree_of(node.get("award"))
            use_core = None if is_bs else core_freq
            use_incert = None if is_bs else incert_map
            rows, n_cpl = emit_courses(node, cpl_college, use_core, use_incert)
            rec = {
                "control": control,
                "college": node["college"],
                "cer_college": p.get("cer_college"),
                "coci_college": p.get("coci_college"),
                "title": node.get("title") or (p.get("program") if is_bs else ""),
                "award": node.get("award") or "",
                "kind": kind,
                "degree": degree, "degree_abbr": abbr,
                "top": node.get("top") or "", "top4": _top4(node.get("top")),
                "cip": node.get("cip") or "",
                "field": p.get("field") if is_bs else "",
                "units": node.get("units_resolved"),
                "status": (p.get("status") if is_bs else None),
                "n_courses": node.get("n_courses"),
                "n_resolved": node.get("n_resolved"),
                "n_cpl": n_cpl,
                "courses": rows,
            }
            return rec

        bs_rec = program_record(bctrl, bnode, "BS", is_bs=True)

        # qualifying-credential summaries (nested on the BS) + their own records
        qualifying = []
        for control, node, kind in fam:
            rec = program_record(control, node, kind)
            rec["embeds"] = sorted(embeds_of.get(control, []))
            rec["embedded_in"] = sorted(embedded_in.get(control, []))
            out[control] = rec
            qualifying.append({
                "control": control,
                "title": rec["title"], "award": rec["award"],
                "kind": kind, "degree_abbr": rec["degree_abbr"],
                "units": rec["units"],
                "n_courses": rec["n_resolved"],
                "n_cpl": rec["n_cpl"],
                "n_embedded_certs": len(embeds_of.get(control, [])),
                "embedded_in": sorted(embedded_in.get(control, [])),
            })
        # sort qualifying: degrees first (AS/AA), then certs; CPL-richest first
        qualifying.sort(key=lambda q: (0 if q["kind"] == "AS" else 1, -(q["n_cpl"] or 0), q["title"]))
        bs_rec["qualifying"] = qualifying
        bs_rec["feeders"] = sorted(fields - {t4})
        out[bctrl] = bs_rec

        stats["qualifying"] += len(qualifying)
        stats["bs_own_cpl"] += bs_rec["n_cpl"]
        stats["qual_cpl"] += sum(q["n_cpl"] for q in qualifying)

    return out, stats


def main():
    from datetime import datetime, timezone
    if not os.path.exists(GRAPH):
        print("NO-OP: %s absent — run kb/_build_program_course_graph.py first." % GRAPH)
        return
    data, stats = build()
    payload = {
        "_generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "_generated_by": "kb/_build_cpl_pathway_membership.py",
        "_source": "program_course_graph.json (CCCCO Program Course File join) ⋈ "
                   "coci_minted_memberships/courses + coci_articulations",
        "_note": ("Authoritative membership-driven CPL Pathways data. BS programs carry "
                  "their OWN course list + per-course potential CPL + qualifying associate "
                  "credentials (AS/AA/Cert, same college + field/feeders) where the dense "
                  "CPL lives. required/elective is INFERRED (core_source below), not in COCI."),
        "_core_source": ("inferred: a course in an embedded Certificate of Achievement is a "
                         "required skill-block course; core_freq counts credentials in the "
                         "college's field family that contain it. Catalog is authoritative."),
        "count": len(data),
        "programs": data,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("// CPL Pathways — AUTHORITATIVE membership-driven data (auto-generated).\n")
        f.write("// Generated by kb/_build_cpl_pathway_membership.py from the program->course\n")
        f.write("// master file. Do NOT hand-edit — re-run the builder (needs the graph).\n")
        f.write("window.CPL_PATHWAY_MEMBERSHIP = ")
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    print("wrote %s" % OUT)
    print("  BS matched: %d (unmatched %d) | qualifying credentials: %d"
          % (stats["bs_matched"], stats["bs_unmatched"], stats["qualifying"]))
    print("  per-course CPL — BS own courses: %d | qualifying-credential courses: %d"
          % (stats["bs_own_cpl"], stats["qual_cpl"]))
    print("  total program records emitted: %d" % len(data))


if __name__ == "__main__":
    main()

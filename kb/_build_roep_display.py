#!/usr/bin/env python3
"""Build each harvested program's display facts: one build, two readers.

Sam, 2026-10-04 (~17:20Z, vault braindump 2026-10-04 17:20): the harvest tab runs
the reading, and CPL Pathways shows the ROEP record "graphically to the colleges
and public". His sheet 32 (17:33Z): a program shows "up to" (the CPL course taken
in every choice), plus the recommended path's figure where a map is read, and each
course carries CPL in three kinds. Then, of Sierra: "make sure she's wired to
understand all the included data and considerations".

Sierra and the page must say the same thing, so neither computes its own: this
builder writes the facts once, to
  cpl_pathways_roep_data.js                       (window.CPL_PATHWAYS_ROEP, the page)
  kb/receipts/program_requirement_records_display_<date>.sql
                                                  (the `display` column Sierra reads)
and every program's facts carry the same `build` stamp in both.
tests/roep_display_test.py fails when the two disagree.

THE THREE KINDS OF CPL ON A COURSE (DEFINITIONS below say them in full):
  here      MAP holds a credit recommendation this college articulated to the course
            (kb/program_requirements_pilot/map_cr_by_course.json, a dated read of
            map_college_cr_unit: counts and exhibit titles, never a student column),
            or MAP's articulated-exhibit feed names the course at this college
            (kb/coci_articulations.json: industry certifications, credit by exam).
  adopt     another college articulated a credential to a course of the same
            identity, and this college has not articulated that credential to it.
            Never across a cross-disciplinary identity (the minted record's
            `cross_disciplinary`, e.g. WEXP M1001 Work Experience Education, one
            outline under 717 subjects): a peer's Police Work Experience is no lead
            for Cerritos's community health worker work experience.
  consider  a credential whose statewide credit recommendation names the course's
            C-ID (kb/_build_credential_recs.py statewide_sets, the Fact Sheet's own
            parse), not articulated here. The CER lists 384 credentials with no
            articulation; none of them names a course yet (measured 2026-10-04), so
            the statewide C-ID lines are the only source today.

IDENTITY never compares a stored id. A course's identity is what the Common Course
Reference shows for it today: unified_courses_members.js (rebuilt every morning) by
control number where the state's file names one, else by college and code, with the
kind and title from unified_courses_index.js. An articulation's identity is the
membership of the course it names at the college that articulated it, so no alias
chain applies (CLAUDE.md Rule 7): nothing here reads an id out of a stored file and
looks it up in the live set. Until S332 this read kb/coci_minted_memberships.json,
which holds only identities with two or more members: every stand-alone course and
every C-ID or Common Course Numbering identity read as none. Build bbbbfb611f15 named
an identity for 149 of the pilot's 289 course entries and 81691460ba18 for 285; could
adopt rose from 53 entries to 133 (Cerritos's IWAP 40.63 and 41.07 gained American
River's Iron Workers apprenticeship articulations) and for consideration from 0 to 15.
A course can sit under several ids (1,066 control numbers carry a C-ID and its CCN
id): it shows the strongest (CCN, then C-ID, then the CCR id) and could-adopt reads
across all of them.

THE FIGURE is the mock-up's plan() ported line for line
(docs/visuals/2026-10-04-cpl-pathways-roep-mockup.html): inside every choice take
the course with CPL first; among whole options take the one with more CPL. Only
the "here" kind counts toward it: it is what a learner could clear at this college
today.

    python3 kb/_build_roep_display.py            # write both outputs
    python3 kb/_build_roep_display.py --print    # summary only, write nothing
"""
from __future__ import annotations

import argparse
import glob
import hashlib
import json
import os
import re
import subprocess
import sys
from collections import OrderedDict, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import _program_requirements_load as loader  # noqa: E402  (checked logic, one place)

PILOT = os.path.join(HERE, "program_requirements_pilot")
MAP_READ = os.path.join(PILOT, "map_cr_by_course.json")
REGISTRY_READ = os.path.join(PILOT, "registry_read.json")
ARTICS = os.path.join(HERE, "coci_articulations.json")
LIVE_MEMBERS = os.path.join(ROOT, "unified_courses_members.js")
LIVE_INDEX = os.path.join(ROOT, "unified_courses_index.js")
MINTED = os.path.join(HERE, "coci_minted_courses.json")
UNIFIED = os.path.join(HERE, "unified_titles.json")
CER = os.path.join(ROOT, "credential_reference_data.js")
OUT_JS = os.path.join(ROOT, "cpl_pathways_roep_data.js")
RECEIPTS = os.path.join(HERE, "receipts")

SHAPE_VERSION = 1

PLATFORM = {"courseleaf": "CourseLeaf", "curriqunet": "CurriQunet META", "elumen": "eLumen",
            "acalog": "Acalog", "pdf": "PDF catalog", "custom_html": "college's own catalog pages",
            "smartcatalog": "SmartCatalog", "coursedog": "Coursedog"}

# Said once, here; the page shows them and Sierra's rules quote them.
DEFINITIONS = OrderedDict([
    ("here", "Articulated here: the college has articulated CPL to this course. MAP holds a credit "
             "recommendation for it at this college (military, industry or exam credit), or MAP's "
             "articulated-exhibit feed names the course at this college."),
    ("adopt", "Could adopt: another college has articulated this credential to a course of the same "
              "identity (its C-ID, Common Course Numbering id or Common Course Reference id), and this "
              "college has not. The college decides; the listing is a lead for its faculty."),
    ("consider", "For consideration: a credential whose statewide credit recommendation names this "
                 "course's C-ID, which this college has not articulated. No articulation exists until "
                 "the college's faculty approve one."),
    ("up_to", "Up to: the most units (hours, for a noncredit program) of the program a learner could "
              "meet through CPL this college has articulated, taking the CPL course in every choice and "
              "the option with more CPL. It counts only the first kind. Where a college's pathway map is "
              "read, the map's recommended path gives a second figure."),
])

GENERIC_TITLES = {"credit by exam"}
STALL = loader.STALL


# ── course keys ─────────────────────────────────────────────────────────────────
def ck(code: str) -> str:
    """'IWAP 40.5' and 'IWAP 40.50' are one course (harvest lesson 23); the mock-up's ck().
    A hyphen reads as a space: Riverside's catalog prints 'ADJ-1' where MAP prints 'ADJ 1'.
    Leading zeros drop: West LA's catalog prints 'ANATOMY 001' where the state's file
    lists 'ANATOMY 1' (16 West LA courses lost their title and identity without it)."""
    s = re.sub(r"\s+", " ", str(code or "").upper().replace("-", " ")).strip()
    m = re.match(r"^(.*?)\s*([0-9]+)(\.([0-9]+))?([A-Z]*)$", s)
    if not m:
        return s.replace(" ", "")
    dec = "" if m.group(4) is None else "." + (m.group(4) + "0" if len(m.group(4)) == 1 else m.group(4))
    return m.group(1).replace(" ", "") + (m.group(2).lstrip("0") or "0") + dec + m.group(5)


def norm_college(c: str) -> str:
    return re.sub(r"\s+", " ", str(c or "")).strip().upper()


def _clean(v) -> str:
    v = "" if v is None else str(v).strip()
    return "" if v.lower() in {"", "none", "nan", "n/a", "na", "null", "0", "tbd", "pending"} else v


# ── sources ─────────────────────────────────────────────────────────────────────
def load_js_object(path: str, var: str) -> dict:
    out = subprocess.run(
        ["node", "-e", "global.window={};require(process.argv[1]);"
                       "process.stdout.write(JSON.stringify(window[process.argv[2]]))", path, var],
        check=True, capture_output=True, text=True)
    return json.loads(out.stdout)


class Identity:
    """A course's ids in the Common Course Reference as it stands today (the live
    members and index files), with the minted record's C-ID and CCN beside a CCR id.
    Pass `members` and `index` (the two payloads) to build one from a fixture."""

    KIND_ORDER = {"CCN-ID": 0, "C-ID": 1, "Course": 2, "Stand-Alone": 3}

    def __init__(self, members: dict | None = None, index: list | None = None, minted: dict | None = None):
        mem = members if members is not None else load_js_object(LIVE_MEMBERS, "CPL_UC_MEMBERS")
        idx = index if index is not None else load_js_object(LIVE_INDEX, "CPL_UC_INDEX")
        self.generated_at = mem.get("generated_at")
        self.live = {r[0]: {"title": r[1], "kind": r[3]} for r in idx}
        self.minted = minted if minted is not None else json.load(open(MINTED))["courses"]
        self.by_control: dict[str, set] = defaultdict(set)
        self.by_code: dict[tuple, set] = defaultdict(set)
        cols = mem["colleges"]
        for mid, members_ in mem["members"].items():
            for m in members_:
                if m.get("cn"):
                    self.by_control[str(m["cn"])].add(mid)
                self.by_code[(norm_college(cols[m["c"]]), ck(m["n"]))].add(mid)

    def _order(self, ids) -> list[str]:
        return sorted(ids, key=lambda i: (self.KIND_ORDER.get((self.live.get(i) or {}).get("kind"), 9), i))

    def ids(self, college: str, code: str, control: str | None = None) -> list[str]:
        """Every id the course holds, strongest first."""
        if control and control in self.by_control:
            return self._order(self.by_control[control])
        return self._order(self.by_code.get((norm_college(college), ck(code))) or ())

    def mid(self, college: str, code: str, control: str | None = None) -> str | None:
        ids = self.ids(college, code, control)
        return ids[0] if ids else None

    def cross_disciplinary(self, mid: str | None) -> bool:
        return bool((self.minted.get(mid) or {}).get("cross_disciplinary")) if mid else False

    def ref(self, mid: str | None, also=()) -> dict | None:
        """The shown identity. `also` is every id the course holds, so a CCN id
        carries the C-ID beside it."""
        if not mid:
            return None
        live = self.live.get(mid) or {}
        kind = live.get("kind")
        cid_also = next((i for i in also if (self.live.get(i) or {}).get("kind") == "C-ID"), None)
        if kind == "CCN-ID":
            return {"kind": "CCN", "id": mid, "title": live.get("title"), "ccr": mid, "cid": cid_also}
        if kind == "C-ID":
            return {"kind": "C-ID", "id": mid, "title": live.get("title"), "ccr": mid, "cid": mid}
        rec = self.minted.get(mid) or {}
        ccn, cid = _clean(rec.get("ccn_id")), _clean(rec.get("c_id"))
        title = _clean(rec.get("common_title")) or live.get("title")
        cid = cid or cid_also
        if ccn:
            return {"kind": "CCN", "id": ccn, "title": title, "ccr": mid, "cid": cid or None}
        if cid:
            return {"kind": "C-ID", "id": cid, "title": title, "ccr": mid, "cid": cid}
        if not rec and not live:
            return None
        return {"kind": "CCR", "id": mid, "title": title, "ccr": mid, "cid": None}


def articulation_index(ident: Identity):
    """From MAP's articulated-exhibit feed: what each college articulated to each of
    its courses, and, per identity, which colleges articulated which credentials."""
    feed = json.load(open(ARTICS))
    here = defaultdict(OrderedDict)                      # (college, ck) -> {label: True}
    by_identity = defaultdict(lambda: defaultdict(set))  # mid -> label -> {college}
    for a in feed["articulations"]:
        cols = [c for c in (a.get("earned_by_colleges") or []) if _clean(c)]
        if not cols:
            continue
        ut = _clean(a.get("unified_title"))
        label = "Credit by exam" if ut.lower() in GENERIC_TITLES else (ut or _clean(a.get("exhibit_title")))
        if not label:
            continue
        for lc in a.get("local_courses") or []:
            subj, num = str(lc.get("subject", "")).strip(), str(lc.get("number", "")).strip()
            if not subj or not num:
                continue
            code = "%s %s" % (subj, num)
            for col in cols:
                here[(norm_college(col), ck(code))].setdefault(label, True)
                for mid in ident.ids(col, code):
                    by_identity[mid][label].add(col)
    stamp = feed.get("_authority_recode_applied_at") or feed.get("_generated_by")
    return here, by_identity, stamp


def statewide_cid_index():
    """C-ID -> the statewide credentials whose recommendation names it, from the
    Fact Sheet's own parse (kb/_build_credential_recs.py, imported, never re-parsed)."""
    import _build_credential_recs as cr
    sets = cr.statewide_sets(cr.load_artifact())
    out = defaultdict(list)
    for ut, rows in sets.items():
        for r in rows:
            for cid in re.split(r"\s*,\s*", r.get("cid") or ""):
                cid = re.sub(r"\s+", " ", cid).strip().upper()
                if cid:
                    out[cid].append({"credential": ut, "credit": r.get("credit")})
    return out


def cer_adopters() -> tuple[dict, str | None]:
    """unified title -> how many colleges have articulated it (the CER, rebuilt daily)."""
    cer = load_js_object(CER, "CPL_CREDENTIAL_REFERENCE")
    n = {}
    for u in cer.get("unified_titles") or []:
        cols = set()
        for a in u.get("articulations") or []:
            for lc in a.get("local") or []:
                cols.update(lc.get("colleges") or [])
        n[u["ut"]] = len(cols)
    return n, cer.get("_generated_at")


# ── the figure: the mock-up's plan(), ported ────────────────────────────────────
def courses_of(block):
    return block.get("courses") or []


def plan(blocks: list, has, units_of=None) -> dict:
    def units(c):
        if units_of:
            return units_of(c)
        try:
            return float(c.get("units") or 0)
        except (TypeError, ValueError):
            return 0.0

    def best(c):
        opts = [c] + list(c.get("alternatives") or [])
        with_cpl = [o for o in opts if has(o)]
        return with_cpl[0] if with_cpl else c

    def block_plan(b):
        picks, cpl, req = [], 0.0, 0.0
        if b.get("rule") == "all":
            for c in courses_of(b):
                p = best(c)
                picks.append(p)
                req += units(p)
                if has(p):
                    cpl += units(p)
        else:
            ranked = sorted((best(c) for c in courses_of(b)),
                            key=lambda p: (-(1 if has(p) else 0), -units(p)))
            if b.get("rule") == "choose_courses":
                for p in ranked[: (b.get("minimum") or 1)]:
                    picks.append(p)
                    req += units(p)
                    if has(p):
                        cpl += units(p)
            else:
                need = float(b.get("minimum") or 0) or float(((b.get("stated") or {}).get("min")) or 0)
                got = 0.0
                for p in ranked:
                    if got >= need:
                        break
                    picks.append(p)
                    got += units(p)
                    if has(p):
                        cpl += min(units(p), need - (got - units(p)))
                req += need or got
        return {"picks": picks, "cpl": cpl, "req": req}

    total, seen, pick_codes = 0.0, set(), []
    for b in blocks:
        g = b.get("option_group")
        if g:
            if g in seen:
                continue
            seen.add(g)
            lanes = [block_plan(x) for x in blocks if x.get("option_group") == g]
            lanes.sort(key=lambda lp: -lp["cpl"])
            chosen = lanes[0]
        else:
            chosen = block_plan(b)
        total += chosen["cpl"]
        pick_codes.extend(p["code"] for p in chosen["picks"] if has(p))
    return {"cpl": round(total, 2), "picks": pick_codes}


# ── gaps: the mock-up's gapsFor(), ported ───────────────────────────────────────
def gaps_for(college: str, platform: str, award: str, measure: str, filed: dict, verdict: str | None,
             total: dict) -> list:
    rec, score = filed["record"], filed.get("score") or {}
    proc = "%s's %s reading procedure" % (college, PLATFORM.get(platform, platform or "catalog"))
    state = "%s's program record in the state's curriculum inventory" % college
    g = []
    for m in rec.get("missing_explained") or []:
        g.append({"kind": "Catalog and state file differ", "owner": "college", "where": state,
                  "text": "The state's Program Course File lists %s; the reader found it %s." % (m["code"], m["why"])})
    adds = [x["code"] for b in rec["blocks"] for c in courses_of(b)
            for x in [c] + list(c.get("alternatives") or []) if x.get("catalog_addition")]
    if adds:
        g.append({"kind": "Catalog and state file differ", "owner": "college", "where": state,
                  "text": "The catalog prints %s for this program; the state's Program Course File does not list %s."
                          % (", ".join(adds), "it" if len(adds) == 1 else "them")})
    arith = score.get("arithmetic") or {}
    if arith.get("status") and arith["status"] != "equal":
        if total.get("min") is not None:
            comp = arith.get("computed") or [None, None]
            g.append({"kind": "Check not met", "owner": "procedure", "where": proc,
                      "text": "The blocks add to %s; the catalog prints %s."
                              % (amount(comp[0], comp[1], measure), amount(total["min"], total.get("max"), measure))})
        else:
            g.append({"kind": "No printed total", "owner": "procedure", "where": proc,
                      "text": "The catalog prints no program total, so the units cannot be checked against one."})
    if re.search(r"noncredit", award or "", re.I) and measure != "hours":
        g.append({"kind": "Possible misread", "owner": "procedure", "where": proc,
                  "text": "A noncredit program recorded in %s; noncredit programs count hours." % measure})
    if verdict == "fix":
        g.append({"kind": "Fixed by a rerun", "owner": "procedure", "where": proc,
                  "text": "A person's reading found a misread; the fix went into the procedure, and the rerun's record is the one shown."})
    for n in rec.get("notes") or []:
        g.append({"kind": "Reader's note", "owner": "procedure", "where": proc, "text": n})
    return g


def amount(lo, hi, unit) -> str:
    if lo is None:
        return ""
    f = lambda n: str(int(n)) if float(n).is_integer() else str(round(float(n), 2))
    return f(lo) + ("-%s" % f(hi) if hi is not None and hi != lo else "") + " " + unit


# ── the map's status: the registry's sequence columns ───────────────────────────
def map_status(college: str, reg: dict) -> dict:
    access, src = reg.get("sequence_access"), reg.get("sequence_source")
    base = {"host": reg.get("sequence_host"), "url": reg.get("sequence_url"),
            "checked_run": reg.get("sequence_checked_run") or reg.get("census_run_id")}
    if access in ("refused", "not_read", "open"):
        return dict(base, status=access, text=reg.get("sequence_note") or "")
    if src and src != "none_found":
        return dict(base, status="not_read", text="The census recorded a map source (%s) that has not been read." % src)
    return dict(base, status="none",
                text="The weekly census found no published term-by-term program map on %s's site (census run %s)."
                     % (college, reg.get("census_run_id")))


# ── assemble ─────────────────────────────────────────────────────────────────────
def build() -> dict:
    map_read = json.load(open(MAP_READ))
    registry = json.load(open(REGISTRY_READ))
    ident = Identity()
    # MAP's credit recommendations carry the title a college typed; the feed and the
    # statewide lines carry the CER's unified title. "Already here" compares both, or
    # Riverside's "CompTIA Security+ (CIS-27)" left CompTIA Security+ "for consideration"
    # on the course that holds it (S332).
    unified = {k: v.get("unified_title") for k, v in json.load(open(UNIFIED)).items()
               if isinstance(v, dict) and v.get("unified_title")}
    feed_here, by_identity, feed_stamp = articulation_index(ident)
    statewide = statewide_cid_index()
    adopters, cer_at = cer_adopters()
    review = json.load(open(loader.REVIEW))
    verdicts = review.get("verdicts") or {}
    loaded = {(r["college"], r["control_number"]): r for r in loader.rows()}

    programs = []
    for path in sorted(glob.glob(os.path.join(PILOT, "records", "*.json"))):
        key = os.path.splitext(os.path.basename(path))[0]
        filed = json.load(open(path))
        src = json.load(open(os.path.join(ROOT, filed["source_file"])))
        college, control = filed["college"], filed["control_number"]
        row = loaded[(college, control)]
        reg = registry["colleges"].get(college) or {}
        listed = {ck(c["code"]): c for c in src.get("closed_list") or []}
        crs = map_read["colleges"].get(college) or {}
        crs = {ck(k): v for k, v in crs.items()}
        program, blocks = filed["record"]["program"], filed["record"]["blocks"]
        measure = program.get("measure") or "units"

        courses = OrderedDict()
        for b in blocks:
            for c in courses_of(b):
                for x in [c] + list(c.get("alternatives") or []):
                    k = ck(x["code"])
                    if x["code"] in courses:
                        continue
                    lc = listed.get(k) or {}
                    ids = ident.ids(college, x["code"], lc.get("ccn"))
                    mid = ids[0] if ids else None
                    ref = ident.ref(mid, ids)
                    entry = OrderedDict()
                    entry["title"] = lc.get("title")
                    if x.get("units") is None and lc.get("units") is not None:
                        entry["units_from_state_file"] = lc["units"]
                    entry["identity"] = {k2: v for k2, v in (ref or {}).items() if k2 in ("kind", "id", "title")} or None
                    # here
                    mr = crs.get(k) or {}
                    labels = OrderedDict()
                    for t in mr.get("titles") or []:
                        labels.setdefault(t["title"], True)
                    for t in feed_here.get((norm_college(college), k), {}):
                        labels.setdefault(t, True)
                    here_set = {t.lower() for t in labels} | {unified[t].lower() for t in labels if t in unified}
                    if mr.get("recs") or labels:
                        entry["here"] = {"recs": mr.get("recs") or 0, "credentials_n": len(labels),
                                         "credentials": list(labels)[:4]}
                    # could adopt
                    pooled = defaultdict(set)
                    for i in ids:
                        if not ident.cross_disciplinary(i):
                            for label, cols in by_identity.get(i, {}).items():
                                pooled[label] |= cols
                    if pooled:
                        adopt = []
                        for label, cols in sorted(pooled.items()):
                            others = sorted(c for c in cols if norm_college(c) != norm_college(college))
                            if others and label.lower() not in here_set:
                                adopt.append({"credential": label, "colleges": others})
                        adopt.sort(key=lambda a: (-len(a["colleges"]), a["credential"]))
                        if adopt:
                            peer_set = sorted({c for a in adopt for c in a["colleges"]})
                            entry["adopt"] = {"credentials_n": len(adopt), "colleges_n": len(peer_set),
                                              "credentials": adopt[:4]}
                    # for consideration
                    cids = {re.sub(r"\s+", " ", v).strip().upper() for v in
                            (lc.get("cid"), (ref or {}).get("cid")) if v}
                    consider, seen_c = [], set()
                    for cid in sorted(cids):
                        for s in statewide.get(cid, []):
                            if s["credential"].lower() in here_set or s["credential"] in seen_c:
                                continue
                            seen_c.add(s["credential"])
                            consider.append({"credential": s["credential"], "credit": s["credit"], "cid": cid,
                                             "colleges_n": adopters.get(s["credential"], 0)})
                    if consider:
                        entry["consider"] = consider
                    courses[x["code"]] = entry

        def has(c):
            e = courses.get(c["code"]) or {}
            return bool(e.get("here"))

        def units_of(c):
            """The catalog's units; where it prints none beside a course, the state file's."""
            if c.get("units") is not None:
                return float(c["units"])
            return float(((listed.get(ck(c["code"])) or {}).get("units")) or 0)

        pl = plan(blocks, has, units_of)
        total = {"min": program.get("total_units", {}).get("min") if program.get("total_units") else None,
                 "max": program.get("total_units", {}).get("max") if program.get("total_units") else None}
        verdict = (verdicts.get(key) or {}).get("v")
        score = filed.get("score") or {}
        cov = score.get("coverage") or {}
        adds = sum(1 for b in blocks for c in courses_of(b) for x in [c] + list(c.get("alternatives") or [])
                   if x.get("catalog_addition"))
        display = OrderedDict()
        display["v"] = SHAPE_VERSION
        display["figure"] = {"up_to": pl["cpl"], "measure": measure, "total": total, "picks": pl["picks"],
                             "path": None,
                             "path_why": "No pathway map has been read for this program."}
        display["counts"] = {"courses": len(courses),
                             "here": sum(1 for e in courses.values() if e.get("here")),
                             "adopt": sum(1 for e in courses.values() if e.get("adopt")),
                             "consider": sum(1 for e in courses.values() if e.get("consider"))}
        display["courses"] = courses
        display["gaps"] = gaps_for(college, reg.get("catalog_platform") or src.get("platform"), row.get("award") or "",
                                   measure, filed, verdict, total)
        display["map"] = map_status(college, reg)
        display["checks"] = {"checked": row["checked"], "coverage": {"placed": cov.get("placed"), "listed": cov.get("listed")},
                             "additions": adds, "arithmetic": (score.get("arithmetic") or {}).get("status"),
                             "reviewer": verdict}
        programs.append(OrderedDict([
            ("key", key), ("college", college), ("control_number", control),
            ("title", row["program_title"]), ("award", row["award"]), ("catalog_year", row["catalog_year"]),
            ("source_url", row["source_url"]), ("platform", reg.get("catalog_platform") or src.get("platform")),
            ("measure", measure), ("record", row["record"]), ("display", display)]))

    inputs = OrderedDict([
        ("records", len(programs)),
        ("map_read_at", map_read.get("_read_at")),
        ("registry_read_at", registry.get("_read_at")),
        ("articulations", feed_stamp),
        ("memberships", ident.generated_at),
        ("cer", cer_at),
    ])
    stamp = hashlib.sha256(json.dumps([p["display"] for p in programs], sort_keys=True,
                                      ensure_ascii=False).encode()).hexdigest()[:12]
    built = max(d for d in (map_read.get("_read_at"), registry.get("_read_at")) if d)
    for p in programs:
        p["display"]["build"] = stamp
        p["display"]["built"] = built
    return {"build": stamp, "built": built, "inputs": inputs, "programs": programs}


def js_text(b: dict) -> str:
    payload = OrderedDict([
        ("_generated_by", "kb/_build_roep_display.py"),
        ("_note", "Each harvested program's catalog record and its display facts: CPL in three kinds per "
                  "course, the up-to figure, the gaps and the map's status. The same facts sit in "
                  "program_requirement_records.display, where Sierra reads them; both carry this build stamp. "
                  "Do not edit; rerun the builder."),
        ("build", b["build"]), ("built", b["built"]), ("inputs", b["inputs"]),
        ("definitions", DEFINITIONS), ("programs", b["programs"])])
    return "window.CPL_PATHWAYS_ROEP = " + json.dumps(payload, ensure_ascii=False, indent=1) + ";\n"


def q(v) -> str:
    return loader.q(v)


def sql_text(b: dict, prior: str | None = None) -> str:
    """One statement per program, in the form the load used (S326): an insert that
    conflicts on the key and sets only `display`. A bare UPDATE is held by the
    Supabase connector for a confirmation a remote session cannot answer, and times
    out writing nothing (measured 2026-10-04, twice). The insert selects the row it
    updates, so it never adds a program the load did not."""
    lines = ["-- Generated by kb/_build_roep_display.py (build %s, built %s). Do not edit; rerun the builder."
             % (b["build"], b["built"]),
             "-- Writes program_requirement_records.display for %d programs." % len(b["programs"])]
    if prior:
        lines.append("-- It replaces the build in %s: re-applying that receipt rolls this one back." % prior)
    else:
        lines.append("-- The column was added empty, so setting display back to null for these keys rolls this back.")
    lines.append("-- The page reads the same facts from cpl_pathways_roep_data.js (same build stamp).")
    for p in b["programs"]:
        lines.append(
            "insert into public.program_requirement_records (college, control_number, program_title, measure, record, checks, display) "
            "select r.college, r.control_number, r.program_title, r.measure, r.record, r.checks, %s::jsonb "
            "from public.program_requirement_records r where r.college = %s and r.control_number = %s "
            "on conflict (college, control_number) do update set display = excluded.display;"
            % (q(json.dumps(p["display"], ensure_ascii=False, sort_keys=True, separators=(",", ":"))),
               q(p["college"]), q(p["control_number"])))
    return "\n".join(lines) + "\n"


def jsonb_text(v) -> str:
    """The text Postgres prints for a jsonb value: keys shortest first, then bytewise;
    ', ' and ': ' between items. md5 of it equals md5(display::text) on a row the
    receipt wrote, which is how --verify-sql proves the table holds this build."""
    if isinstance(v, dict):
        keys = sorted(v, key=lambda k: (len(k.encode()), k.encode()))
        return "{" + ", ".join(json.dumps(k, ensure_ascii=False) + ": " + jsonb_text(v[k]) for k in keys) + "}"
    if isinstance(v, list):
        return "[" + ", ".join(jsonb_text(x) for x in v) + "]"
    return json.dumps(v, ensure_ascii=False)


def verify_sql(b: dict) -> str:
    rows = ",\n  ".join("(%s, %s, %s)" % (q(p["college"]), q(p["control_number"]),
                                          q(hashlib.md5(jsonb_text(p["display"]).encode()).hexdigest()))
                        for p in b["programs"])
    return ("-- Read-only. Every row must say match; a row that says differs or missing holds another build.\n"
            "select v.college, v.control_number, case when r.display is null then 'missing' "
            "when md5(r.display::text) = v.md5 then 'match' else 'differs' end as state\n"
            "from (values\n  %s\n) v(college, control_number, md5)\n"
            "left join public.program_requirement_records r using (college, control_number)\n"
            "order by 3, 1, 2;\n" % rows)


def receipt_path(b: dict) -> str:
    """Dated, and named by build from S332: two builds on one read date each keep their
    receipt, so the earlier one stays the later one's rollback."""
    stamped = os.path.join(RECEIPTS, "program_requirement_records_display_%s_%s.sql" % (b["built"], b["build"]))
    first = os.path.join(RECEIPTS, "program_requirement_records_display_%s.sql" % b["built"])
    if not os.path.exists(stamped) and os.path.exists(first) and ("build %s," % b["build"]) in open(first).readline():
        return first
    return stamped


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--print", action="store_true", help="print the summary; write nothing")
    ap.add_argument("--verify-sql", action="store_true",
                    help="print a read-only query proving the table holds this build; write nothing")
    args = ap.parse_args(argv)
    b = build()
    if args.verify_sql:
        print(verify_sql(b), end="")
        return 0
    for p in b["programs"]:
        d = p["display"]
        print("%-16s %-44s up to %-6s of %-11s here %2d adopt %2d consider %2d gaps %2d map %s"
              % (p["key"], p["title"][:44], d["figure"]["up_to"],
                 amount(d["figure"]["total"]["min"], d["figure"]["total"]["max"], p["measure"]) or "no total",
                 d["counts"]["here"], d["counts"]["adopt"], d["counts"]["consider"], len(d["gaps"]),
                 d["map"]["status"]))
    print("build %s, built %s" % (b["build"], b["built"]))
    if args.print:
        return 0
    prior = None
    same_build = False
    if os.path.exists(OUT_JS):
        was = load_js_object(OUT_JS, "CPL_PATHWAYS_ROEP")
        same_build = was.get("build") == b["build"] and os.path.exists(receipt_path(b))
        if was.get("build") != b["build"] and os.path.exists(receipt_path(was)):
            prior = os.path.relpath(receipt_path(was), ROOT)
    sql = sql_text(b, prior)
    hit = STALL.search(sql)
    if hit:
        print("REFUSING: the display SQL names %r, which stalls the Supabase connector." % hit.group(0))
        return 2
    open(OUT_JS, "w").write(js_text(b))
    if same_build:
        # The display is unchanged (a record gained outcomes, say): its receipt
        # already holds this build and names its rollback, so it stays as written.
        print("wrote %s; build %s unchanged, its receipt %s kept" % (
            os.path.relpath(OUT_JS, ROOT), b["build"], os.path.relpath(receipt_path(b), ROOT)))
        return 0
    open(receipt_path(b), "w").write(sql)
    print("wrote %s and %s" % (os.path.relpath(OUT_JS, ROOT), os.path.relpath(receipt_path(b), ROOT)))
    return 0


if __name__ == "__main__":
    sys.exit(main())

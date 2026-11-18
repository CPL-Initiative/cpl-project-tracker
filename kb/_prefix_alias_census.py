#!/usr/bin/env python3
"""Which subject prefixes a college's catalog prints otherwise than the state's file: per-college prefix_aliases (S652).

WHY. Issue #3299, slice C (COBIx; Sam's go of 2026-11-14, "nothing stops the collection bus from rolling"):
many coverage failures are one course printed under two prefixes. Riverside City's catalog prints HIST 14 where
the Program Course File lists HIS 14; College of the Canyons prints PSYC, POLS and COMM for PSYCH, POLISC and COMS.
The scorer already reads a college's prefix_aliases (kb/program_requirements_reconcile.json, applied by
with_prefix_aliases in kb/_program_requirements_score.py), but only three colleges carry any. The direction flips
between colleges (Solano's catalog prints SOCI for the file's SOC, Merced's SOC for the file's SOCI), so an alias is
one college's and never statewide.

THE RULE (the S652 conductor's, from the issue). A pair (file prefix F, catalog prefix C) at one college is proposed
only on positive evidence in that college's own filed records:
  * at least MIN_EVIDENCE distinct courses where a filed record misses the file's F n and places the catalog's C n,
    the same number including any suffix, AND the two carry the same title (case, punctuation and "&"/"and" folded);
  * no counterexample: no number n where F n and C n are both named at that college with different titles (and no
    control number in common: one control number under two titles is one course whose title a source shortens).
A pair short of the evidence, or with a counterexample, is held with its reason. A college whose catalog side has no
title in committed files is held whole: numbers alone never make a pair. Suffix-letter differences (KPEA 105A vs
KPEA 105), glued codes (CHEM 49549300), common-course numbers (PSYC C1000 vs PSYCH 104) and weak number matches
(BIO 102 vs BIO 1) are excluded by rule and listed as held.

WHERE THE TITLES COME FROM (committed files only; the filed records carry no titles and the page text stays in each
run's artifact):
  file side     the closed list's own code and title: each course control number the college's programs list in
                kb/reference/coci_program_course_file.csv.gz (the Data Mart Program Course File), named as the COCI
                course list (coci_lookup_data.js) names that control number, which is how
                chatbox/build_program_courses.py writes coci_program_courses; also the file's own CrsId and Title.
  catalog side  the code the catalog printed, wherever the college's own records name it: its public course
                outlines read into kb/course_outcomes/<host>/read_*.json (the curriculum system its catalog is
                published from), the Program Course File's CrsId (which often already prints the catalog's prefix:
                HIST14 at Riverside City where the course list still says HIS 14), its MIS course records
                (kb/reference/cb_course_basic_fall2025.csv, CB_COURSE_ID and CB_TITLE), and the COCI course list
                naming the printed code at the college. Each evidence title pair records which source gave it, and the
                control number where both sides carry the same one.

WHAT IT MEASURES (no table written). Every filed record under kb/program_requirements_college/<slug>/records/ is
re-read through the scorer's own with_prefix_aliases, placed_codes and repeated, before (the committed config
without this census's pairs) and after (with them). The closed list is rebuilt from the record's own score (its
placed, non-invented codes plus its missing ones), so coverage, invented and repeated are recomputed exactly; the
arithmetic and outcomes stay as filed, and a renamed course that carries no units of its own is named (its units
would come from the closed list on a rescore). Any record that changes in a direction other than coverage fail to
pass is reported, and a pass that would turn to a fail holds the pair that causes it.

    python3 kb/_prefix_alias_census.py            # write the plan, print the summary
    python3 kb/_prefix_alias_census.py --check    # fail when the committed plan is stale

Output: kb/program_requirements_reconcile_out/prefix_aliases_2026-11-14/plan.json (withheld from Pages by
kb/*_out). Guard: tests/program_requirements_pilot_test.py (the prefix-alias fixtures).
"""
from __future__ import annotations

import argparse
import collections
import csv
import glob
import gzip
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import _program_requirements_score as S  # noqa: E402
from _program_requirements_pilot import norm_code  # noqa: E402

RECORDS = os.path.join(HERE, "program_requirements_college", "*", "records", "*.json")
RECONCILE = os.path.join(HERE, "program_requirements_reconcile.json")
PCF = os.path.join(HERE, "reference", "coci_program_course_file.csv.gz")
MIS = os.path.join(HERE, "reference", "cb_course_basic_fall2025.csv")
COCI = os.path.join(ROOT, "coci_lookup_data.js")
OUTLINES = os.path.join(HERE, "course_outcomes", "*", "read_*.json")
# The live gap census's per-college programs (written 2026-11-13 18:04Z): which Active programs fail coverage live.
LIVE = os.path.join(HERE, "status", "commons_data_programs", "%s.json")
OUT_DIR = os.path.join(HERE, "program_requirements_reconcile_out", "prefix_aliases_2026-11-14")
OUT = os.path.join(OUT_DIR, "plan.json")
TAG = "S652"
UNITS: dict = {}   # slug -> {listed code: the course list's units}, filled by build() for the measurement

# Pairs a second reader of #3301 held (S652, 2026-11-14), (college, catalog prefix, file prefix) -> why.
_LOS_RIOS_ENGL = ("Los Rios's ENGL takes in literature as well as writing (COCI lists Sacramento City ENGL 494 "
                  "Topics in Literature), and numbers clash across the old prefixes (ENGLT 303 Short Story against "
                  "ENGWR 303 Argumentative Writing; ENGRD and ENGWR 110; American River 299, 495 and 499). The census "
                  "first missed it because MIS writes these ids with a record id after the number (ENGL304-2507).")
SECOND_READER_HOLDS = {("American River College", "ENGL", "ENGWR"): _LOS_RIOS_ENGL,
                       ("Sacramento City College", "ENGL", "ENGWR"): _LOS_RIOS_ENGL}
MIN_EVIDENCE = 3

# The scorer's own split of a normalized code (with_prefix_aliases): the letters, then the number from its first digit.
# Greedy, as the scorer reads it, so a common-course number's C stays with the prefix (PSYCC1000 is PSYCC, 1000).
SPLIT = re.compile(r"([A-Z&]+)(\d.*)$")
CCN = re.compile(r"^[A-Z&]+C\d{4}[A-Z]?$")
GLUED = re.compile(r"\d{6,}")


def split(code: str) -> tuple[str, str] | None:
    m = SPLIT.match(code or "")
    return (m.group(1), m.group(2)) if m else None


def title_key(title: str | None) -> str:
    """A title folded for comparison: case, punctuation and "&" against "and"."""
    t = (title or "").lower().replace("&", " and ")
    return " ".join(re.sub(r"[^a-z0-9]+", " ", t).split())


# ── Committed sources ──────────────────────────────────────────────────────────────────────────────

def _fix(name: str) -> str:
    """The COCI course list's college names were written as Latin-1 bytes of UTF-8 (CaÃ±ada)."""
    try:
        return name.encode("latin1").decode("utf8")
    except (UnicodeDecodeError, UnicodeEncodeError):
        return name


def load_pcf(path: str = PCF) -> tuple[dict, dict, dict]:
    """(CollegeCode -> {norm CrsId: {(control, title)}}, CollegeCode -> its program control numbers,
    CollegeCode -> the course control numbers its programs list)."""
    titles = collections.defaultdict(lambda: collections.defaultdict(set))
    programs = collections.defaultdict(set)
    courses = collections.defaultdict(set)
    with gzip.open(path, "rb") as fh:
        for r in csv.DictReader(io.TextIOWrapper(fh, encoding="utf-8-sig")):
            cc = (r.get("CollegeCode") or "").strip()
            programs[cc].add((r.get("ProgramControlNumber") or "").strip())
            ctl = (r.get("CourseControlNumber") or "").strip()
            courses[cc].add(ctl)
            k = norm_code((r.get("CrsId") or "").strip())
            if k and r.get("Title"):
                titles[cc][k].add((ctl, " ".join(r["Title"].split())))
    return titles, programs, courses


# A MIS course id the college writes with its own record id after the course number: Los Rios's "ENGL304-2507"
# Introduction to Poetry and "ENG303-26954" (American River), 6,332 of the four colleges' 6,599 Fall 2025 ids.
# Normalized whole, it reads ENGL3042507 and never meets ENGL 304, so the counterexample rule could not see it
# (S652 second reader). A number must stand before the hyphen: Southwestern's "NC-1001" is a subject and a number.
# One reading, kept in kb/_course_id_route.py since S653, which reads the Program Course File's ids the same way.
from _course_id_route import MIS_ID_SUFFIX, mis_code  # noqa: E402,F401


def load_mis(path: str = MIS) -> dict:
    out = collections.defaultdict(lambda: collections.defaultdict(set))
    with open(path, encoding="utf-8-sig") as fh:
        for r in csv.DictReader(fh):
            k = mis_code(r.get("CB_COURSE_ID"))
            if k and (r.get("CB_TITLE") or "").strip():
                out[r["CB_COLLEGE_ID"].strip()][k].add((r["CB_CONTROL_NUMBER"].strip(), " ".join(r["CB_TITLE"].split())))
    return out


def load_coci(path: str = COCI) -> tuple[dict, dict]:
    """(college -> {norm code: {(control, title)}}, control -> {(norm code, title, units)}) from the COCI course
    list, the list the closed lists take each course's code, title and units from, by control number
    (chatbox/build_program_courses.py)."""
    with open(path, encoding="utf-8") as fh:
        s = fh.read()
    d = json.loads(s[s.index("{"):s.rstrip().rstrip(";").rindex("}") + 1])
    cols = [_fix(c) for c in d["colleges"]]
    out = collections.defaultdict(lambda: collections.defaultdict(set))
    by_ctl = collections.defaultdict(set)
    for r in d["rows"]:
        k = norm_code("%s %s" % (r[2], r[3]))
        if k and r[4]:
            t = " ".join(str(r[4]).split())
            out[cols[r[0]]][k].add((r[1], t))
            by_ctl[r[1]].add((k, t, r[5] if isinstance(r[5], (int, float)) else None))
    return out, by_ctl


def load_outlines(pattern: str = OUTLINES) -> dict:
    """slug -> {norm code: {title}} from the public course outlines the SLO reads filed."""
    out = collections.defaultdict(lambda: collections.defaultdict(set))
    for p in sorted(glob.glob(pattern)):
        with open(p, encoding="utf-8") as fh:
            d = json.load(fh)
        for r in d.get("rows") or [] if isinstance(d, dict) else []:
            if isinstance(r, dict) and r.get("code") and r.get("title"):
                for slug in r.get("named_by") or []:
                    out[slug][norm_code(r["code"])].add(("", " ".join(str(r["title"]).split())))
    return out


def load_records(pattern: str = RECORDS) -> dict:
    """slug -> [(path name, filed record)], in path order."""
    out = collections.defaultdict(list)
    for p in sorted(glob.glob(pattern)):
        with open(p, encoding="utf-8") as fh:
            out[p.split(os.sep)[-3]].append((os.path.basename(p), json.load(fh)))
    return out


# ── The rule ───────────────────────────────────────────────────────────────────────────────────────

def near_miss(missing: str, invented: list[str]) -> list[tuple[str, str]]:
    """(kind, invented code) for each code the record places that a missing code nearly names. kind is
    "prefix" (the same number under another prefix: the only kind an alias may cover), or one excluded by rule:
    "suffix_letter", "glued", "common_course", "weak_number"."""
    out = []
    m = split(missing)
    if not m:
        return out
    for inv in invented:
        i = split(inv)
        if not i or inv == missing:
            continue
        if i[1] == m[1] and i[0] != m[0]:
            out.append(("prefix", inv))
        elif i[0] == m[0] and re.sub(r"[A-Z]+$", "", i[1]) == re.sub(r"[A-Z]+$", "", m[1]):
            out.append(("suffix_letter", inv))
        elif i[0] == m[0] and (GLUED.search(m[1]) or GLUED.search(i[1])) and (m[1].startswith(i[1]) or i[1].startswith(m[1])):
            out.append(("glued", inv))
        elif (bool(CCN.match(missing)) != bool(CCN.match(inv))) and m[0][:3] == i[0][:3]:
            out.append(("common_course", inv))
        elif i[0] == m[0] and (m[1].startswith(i[1]) or i[1].startswith(m[1])):
            out.append(("weak_number", inv))
    return out


def decide(pair: tuple[str, str], evidence: set, file_titles, catalog_titles, numbers: set) -> dict:
    """One college's verdict on (file prefix F, catalog prefix C). evidence: the numbers n where a filed record
    misses F n and places C n. file_titles(code) and catalog_titles(code) give {(control, title, source)} at that
    college. numbers: every n either side names at the college under F or C, for the counterexample scan.
    Returns {"verdict": "propose" | "hold", "reason", "evidence": [...], "counterexamples": [...]}."""
    F, C = pair
    matched, counter, untitled, abbreviated = [], [], [], []

    def row(n, ft, ct):
        fk, ck = {title_key(t) for _, t, _ in ft}, {title_key(t) for _, t, _ in ct}
        fc = {c for c, _, _ in ft if c}
        shared = sorted(fc & {c for c, _, _ in ct if c})
        best = sorted(fk & ck)
        # A course the printed code names under another title and another control number is a different course
        # (Sacramento City's ATC 300 is both CCC000516825 Basic Terminal Procedures, the file's ATCAD 300, and
        # CCC000653071 Basic Air Traffic Control Part 1): a counterexample even where a same-titled one also exists.
        other = sorted((t, s) for c, t, s in ct if title_key(t) not in fk and not (c and c in fc))
        pick = lambda side, keys: sorted(t for _, t, _ in side if not keys or title_key(t) in keys)[0]
        r = {"file": "%s %s" % (F, n), "catalog": "%s %s" % (C, n), "file_title": pick(ft, best),
             "catalog_title": other[0][0] if other else pick(ct, best),
             "catalog_source": other[0][1] if other else sorted({s for _, t, s in ct if not best or title_key(t) in best})[0],
             "control": shared[0] if shared else None}
        return r, bool(best), bool(other)

    for n in sorted(evidence):
        ft, ct = file_titles(F + n), catalog_titles(C + n)
        if not ft or not ct:
            untitled.append({"n": n, "file_title": bool(ft), "catalog_title": bool(ct)})
            continue
        r, same_title, conflict = row(n, ft, ct)
        # Different titles under one control number are one course whose title a source shortens
        # (Los Angeles Valley's MIS record "Bsc Mach Shp Thry&Pr" for TM 27): neither evidence nor a counterexample.
        (counter if conflict else matched if same_title else abbreviated).append(r)
    for n in sorted(numbers - evidence):
        ft, ct = file_titles(F + n), catalog_titles(C + n)
        if ft and ct:
            r, same_title, conflict = row(n, ft, ct)
            if conflict:
                counter.append(r)
    out = {"file_prefix": F, "catalog_prefix": C, "evidence": matched, "counterexamples": counter,
           "untitled": untitled, "same_control_title_differs": abbreviated, "evidence_numbers": len(evidence)}
    if counter:
        return dict(out, verdict="hold", reason="counterexample")
    if not matched and untitled and all(not u["catalog_title"] for u in untitled):
        return dict(out, verdict="hold", reason="no_catalog_title")
    if not matched and untitled and all(not u["file_title"] for u in untitled):
        return dict(out, verdict="hold", reason="no_file_title")
    if len(matched) < MIN_EVIDENCE:
        return dict(out, verdict="hold", reason="fewer_than_%d" % MIN_EVIDENCE)
    return dict(out, verdict="propose", reason="same number and title, %d courses" % len(matched))


# ── Re-reading a filed record (no table) ───────────────────────────────────────────────────────────

def rebuilt_list(filed: dict, aliases: dict | None) -> dict:
    """The record's closed list as its own score names it: placed codes the scorer did not call invented, plus
    the missing ones. Units are not known here (None)."""
    sc = filed.get("score") or {}
    table = {norm_code(k): norm_code(v) for k, v in (aliases or {}).items()}
    invented = set((sc.get("invented") or {}).get("codes") or [])
    listed = {k: None for k in (sc.get("coverage") or {}).get("missing") or []}
    for k, _, _ in S.placed_codes(filed.get("record") or {}):
        if k in invented:
            continue
        # A code the scorer did not call invented was listed as printed, or renamed by the college's own
        # renumbers or aliases (with_prefix_aliases): the listed course is the one it was read as.
        s = split(k)
        if k in table and re.search(r"\d", k):
            k = table[k]
        elif s and s[0] in table:
            k = table[s[0]] + s[1]
        listed[k] = None
    return listed


def reread(filed: dict, listed: dict, aliases: dict | None) -> dict:
    """coverage, invented and repeated, as score() computes them, for the record under these aliases, and the
    blocks' sum (program_units) with the course list's units for listed courses, to tell whether a rename would
    move the arithmetic."""
    rec0 = filed.get("record") or {}
    rec = S.with_prefix_aliases(rec0, listed, aliases)
    try:
        units = S.program_units(rec, listed)
    except Exception as exc:   # one record the sum cannot read never stops the census
        units = ("error", str(exc)[:80])
    placed = [(S.listed_key(e.get("code"), listed), e) for _, e, _ in S.placed_codes(rec)]
    keys = {k for k, _ in placed}
    missing = sorted(k for k in listed if k not in keys)
    explained = {norm_code(m.get("code")): m.get("why") for m in rec0.get("missing_explained") or [] if m.get("code")}
    unexplained = [k for k in missing if not explained.get(k)]
    invented = sorted({k for k, _ in placed if k not in listed})
    flagged = {k for k, e in placed if k not in listed and e.get("catalog_addition")}
    none_placed = bool(listed) and len(missing) == len(listed)
    renamed = [(e.get("printed_code"), e.get("code"), e.get("units")) for _, e, _ in S.placed_codes(rec) if e.get("printed_code")]
    return {"coverage": not unexplained and not none_placed, "unexplained": unexplained,
            "invented": not [k for k in invented if k not in flagged], "invented_codes": invented,
            "repeated": not S.repeated(rec), "renamed": renamed, "units": json.dumps(units, default=str)}


def checks_pass(filed: dict, r: dict) -> tuple[bool, bool]:
    """(score pass, the tab's count) with the filed arithmetic and outcomes."""
    sc = filed.get("score") or {}
    arith = sc.get("arithmetic") or {}
    outs = (sc.get("outcomes") or {}).get("pass", True)
    full = r["coverage"] and r["invented"] and bool(arith.get("pass")) and r["repeated"] and outs is not False
    tab = S.counts_passing_on_tab({"coverage": r["coverage"], "invented": r["invented"], "arithmetic": arith.get("status")})
    return full, tab


# ── The census ─────────────────────────────────────────────────────────────────────────────────────

def build() -> dict:
    with open(RECONCILE, encoding="utf-8") as fh:
        conf = json.load(fh)["colleges"]
    pcf, pcf_programs, pcf_courses = load_pcf()
    (coci, by_ctl), mis, outlines, records = load_coci(), load_mis(), load_outlines(), load_records()

    plan = {"_what": ("Per-college prefix_aliases proposed by kb/_prefix_alias_census.py (%s, issue #3299 slice C). "
                      "Read-only over committed files; no table written. The rescore that applies them is the "
                      "conductor's to dispatch after review." % TAG),
            "rule": {"min_evidence": MIN_EVIDENCE, "same_number": "including suffix (the scorer's greedy split)",
                     "title": "case, punctuation and &/and folded", "counterexample": "F n and C n named at the college "
                     "with different titles and no control number in common",
                     "excluded_by_rule": ["suffix_letter", "glued", "common_course", "weak_number"]},
            "sources": {"file": ["closed_list: kb/reference/coci_program_course_file.csv.gz control numbers, named by "
                                 "coci_lookup_data.js", "program_course_file_crsid", "coci_course_list (fallback)"],
                        "catalog": ["course_outline: kb/course_outcomes/*/read_*.json (public course outlines)",
                                    "program_course_file_crsid: kb/reference/coci_program_course_file.csv.gz CrsId",
                                    "mis_course_record: kb/reference/cb_course_basic_fall2025.csv",
                                    "coci_course_list: coci_lookup_data.js naming the printed code at the college"]},
            "colleges": {}, "held_by_rule": {}, "existing": {}}
    held_rule = collections.defaultdict(lambda: collections.Counter())
    held_rule_examples = collections.defaultdict(list)

    for slug in sorted(records):
        recs = records[slug]
        college = recs[0][1].get("college")
        ctrls = {f.get("control_number") for _, f in recs}
        cc = max(pcf_programs, key=lambda c: len(pcf_programs[c] & ctrls)) if ctrls else None
        conf_c = conf.get(college) or {}
        # The pairs an earlier run of this census wrote are its own output, read again as proposals, so the plan
        # stays the same once they are in the config (--check); every other alias is the college's own.
        mine = {norm_code(c.get("printed")) for c in conf_c.get("prefix_aliases_cited") or [] if c.get("session") == TAG}
        existing = {k: v for k, v in (conf_c.get("prefix_aliases") or {}).items() if norm_code(k) not in mine}

        # The closed list's code and title for each course the college's programs list, as the build takes
        # them from the COCI course list by control number (a program may list a sister college's course).
        listed_names = collections.defaultdict(set)
        listed_units = collections.defaultdict(set)
        for ctl in pcf_courses.get(cc, ()):
            for k, t, u in by_ctl.get(ctl, ()):
                listed_names[k].add((ctl, t))
                listed_units[k].add(u)
        UNITS[slug] = {k: next(iter(v)) for k, v in listed_units.items() if len(v) == 1}

        def file_titles(code, cc=cc, college=college, listed_names=listed_names):
            got = {(c, t, "closed_list") for c, t in listed_names.get(code, ())}
            got |= {(c, t, "program_course_file_crsid") for c, t in pcf.get(cc, {}).get(code, ())}
            return got or {(c, t, "coci_course_list") for c, t in coci.get(college, {}).get(code, ())}

        def catalog_titles(code, cc=cc, college=college, slug=slug):
            got = set()
            for src, table in (("course_outline", outlines.get(slug, {})),
                               ("program_course_file_crsid", pcf.get(cc, {})),
                               ("mis_course_record", mis.get(cc, {})), ("coci_course_list", coci.get(college, {}))):
                got |= {(c, t, src) for c, t in table.get(code, ())}
            return got

        evidence = collections.defaultdict(set)
        records_by_pair = collections.defaultdict(set)
        for name, f in recs:
            sc = f.get("score") or {}
            cov = sc.get("coverage") or {}
            inv = (sc.get("invented") or {}).get("codes") or []
            for miss in cov.get("missing") or []:
                for kind, code in near_miss(miss, inv):
                    if kind == "prefix":
                        F, n = split(miss)
                        C = split(code)[0]
                        evidence[(F, C)].add(n)
                        if miss in (cov.get("unexplained") or []):
                            records_by_pair[(F, C)].add(f.get("control_number"))
                    elif cov.get("pass") is False and miss in (cov.get("unexplained") or []):
                        held_rule[kind][college] += 1
                        if len(held_rule_examples[kind]) < 12:
                            held_rule_examples[kind].append({"college": college, "record": f.get("control_number"),
                                                             "file": miss, "catalog": code})
        # The numbers either side names at the college, per prefix, for the counterexample scan.
        names = collections.defaultdict(set)
        for table in (listed_names, pcf.get(cc, {}), mis.get(cc, {}), coci.get(college, {}), outlines.get(slug, {})):
            for k in table:
                s = split(k)
                if s:
                    names[s[0]].add(s[1])
        verdicts = []
        for (F, C), nums in sorted(evidence.items()):
            if C in {norm_code(k) for k in existing}:
                continue   # the college's config already names this printed prefix; the census never removes one
            v = decide((F, C), nums, file_titles, catalog_titles, names.get(F, set()) & names.get(C, set()))
            v["records_affected"] = sorted(records_by_pair[(F, C)])
            verdicts.append(v)
        # A second reader's hold, by name, with its reason: the pair stays held whatever the rule finds.
        for v in verdicts:
            note = SECOND_READER_HOLDS.get((college, v["catalog_prefix"], v["file_prefix"]))
            if note:
                v["second_reader"] = note
                if v["verdict"] == "propose":
                    v.update(verdict="hold", reason="second_reader")
        # One printed prefix maps to one file prefix: two proposals for the same C hold both.
        by_c = collections.Counter(v["catalog_prefix"] for v in verdicts if v["verdict"] == "propose")
        for v in verdicts:
            if v["verdict"] == "propose" and by_c[v["catalog_prefix"]] > 1:
                v.update(verdict="hold", reason="one_printed_prefix_two_file_prefixes")
        # The three colleges configured before S652: does the rule reproduce each pair?
        if existing:
            rep = {}
            for C, F in existing.items():
                Cn, Fn = norm_code(C), norm_code(F)
                nums = set()
                for _, f in recs:
                    for _, e, _ in S.placed_codes(f.get("record") or {}):
                        s = split(norm_code(e.get("code")))
                        if s and s[0] == Cn:
                            nums.add(s[1])
                v = decide((Fn, Cn), nums & names.get(Fn, set()), file_titles, catalog_titles,
                           names.get(Fn, set()) & names.get(Cn, set()))
                rep[C] = {"file_prefix": F, "verdict": v["verdict"], "reason": v["reason"],
                          "evidence": len(v["evidence"]), "untitled": len(v["untitled"]),
                          "counterexamples": v["counterexamples"][:3]}
            plan["existing"][college] = rep
        # A pair one number links and no title supports is a coincidence (ENGL 1 missing beside MATH 1 placed):
        # counted, not listed.
        listed_held = [v for v in verdicts if v["verdict"] == "hold" and (v["evidence_numbers"] > 1 or v["evidence"])]
        coincidences = sum(1 for v in verdicts if v["verdict"] == "hold" and v not in listed_held)
        if verdicts:
            plan["colleges"][college] = {
                "slug": slug, "college_code": cc, "coincidences": coincidences,
                "pairs": [v for v in verdicts if v["verdict"] == "propose"],
                "held": [{k: v[k] for k in ("file_prefix", "catalog_prefix", "reason", "evidence_numbers",
                                             "records_affected")}
                         | {"evidence": v["evidence"][:4], "counterexamples": v["counterexamples"][:4],
                            "untitled": len(v["untitled"]), "same_control_title_differs":
                            len(v["same_control_title_differs"])}
                         | ({"second_reader": v["second_reader"]} if v.get("second_reader") else {})
                         for v in listed_held]}

    for kind in sorted(held_rule):
        plan["held_by_rule"][kind] = {"records_codes": sum(held_rule[kind].values()),
                                      "colleges": dict(sorted(held_rule[kind].items())),
                                      "examples": held_rule_examples[kind]}
    measure(plan, records, conf)
    eff = plan["effect"]
    filed = [f for recs in records.values() for _, f in recs if (f.get("score") or {}).get("coverage")]
    plan["statewide"] = {
        "filed_records": len(filed),
        "filed_coverage_fails": sum(1 for f in filed if f["score"]["coverage"].get("pass") is False),
        "filed_coverage_newly_pass": sum(len(e["coverage_newly_pass"]) for e in eff.values()),
        "filed_newly_pass_tab": sum(e["tab_after"] - e["tab_before"] for e in eff.values()),
        "live_coverage_fails": sum(len(live_coverage_fails(slug)) for slug in records),
        "live_coverage_newly_pass": sum(len(e["live_coverage_newly_pass"]) for e in eff.values()),
        "live_newly_pass_tab": sum(len(e["live_newly_pass_tab"]) for e in eff.values()),
        "live_census_at": "2026-11-13 18:04Z (kb/status/commons_data_programs)"}
    return plan


def proposed_aliases(plan: dict, college: str) -> dict:
    return {p["catalog_prefix"]: p["file_prefix"] for p in (plan["colleges"].get(college) or {}).get("pairs") or []}


def measure(plan: dict, records: dict, conf: dict) -> None:
    """Before and after, by college, for every college this census proposes a pair at. Before is the committed
    config without the census's pairs; after adds them. A pass that turns to a fail holds the pair that causes it,
    and the college is measured again."""
    eff = {}
    for college, entry in plan["colleges"].items():
        if not entry["pairs"]:
            continue
        conf_c = conf.get(college) or {}
        base = {k: v for k, v in (conf_c.get("prefix_aliases") or {}).items()
                if not any(norm_code(k) == p["catalog_prefix"] for p in entry["pairs"])}
        base.update(conf_c.get("course_renumbers") or {})
        while entry["pairs"]:
            after = dict(base)
            after.update(proposed_aliases(plan, college))
            res = _measure_college(records[entry["slug"]], base or None, after, live_coverage_fails(entry["slug"]),
                                   UNITS.get(entry["slug"]))
            bad = [r for r in res["other_direction"] if r["kind"] == "pass_to_fail"]
            if not bad:
                break
            # Hold the pair whose rename the first such record carries.
            culprit = next((p for p in entry["pairs"] for r in bad for pc, _, _ in r["renamed"]
                            if split(norm_code(pc)) and split(norm_code(pc))[0] == p["catalog_prefix"]), entry["pairs"][0])
            entry["pairs"].remove(culprit)
            entry["held"].append({"file_prefix": culprit["file_prefix"], "catalog_prefix": culprit["catalog_prefix"],
                                  "reason": "pass_to_fail", "evidence_numbers": culprit["evidence_numbers"],
                                  "records_affected": culprit["records_affected"], "evidence": culprit["evidence"][:4],
                                  "counterexamples": [], "untitled": len(culprit["untitled"]),
                                  "failed": [r["record"] for r in bad]})
        if entry["pairs"]:
            eff[college] = res
    plan["effect"] = eff


def live_coverage_fails(slug: str) -> set:
    """The control numbers the live census names coverage_fails at the college (kb/status/commons_data_programs)."""
    try:
        with open(LIVE % slug, encoding="utf-8") as fh:
            progs = json.load(fh).get("programs") or []
    except OSError:
        return set()
    return {p.get("cn") for p in progs if p.get("cause") == "coverage_fails"}


def _measure_college(recs: list, before: dict | None, after: dict, live: set | None = None,
                     units: dict | None = None) -> dict:
    live, units = live or set(), units or {}
    out = {"live_coverage_fails": len(live), "live_coverage_newly_pass": [], "live_newly_pass_tab": [], "records": 0,
           "coverage_fails_before": 0, "coverage_fails_after": 0, "pass_before": 0, "pass_after": 0,
           "tab_before": 0, "tab_after": 0, "newly_pass": [], "coverage_newly_pass": [], "other_direction": [],
           "renamed_without_units": [], "arithmetic_may_move": [], "reconstruction_mismatch": 0}
    for name, f in recs:
        sc = f.get("score") or {}
        if not sc or not isinstance(f.get("record"), dict):
            continue
        out["records"] += 1
        listed = {k: units.get(k) for k in rebuilt_list(f, before)}
        b, a = reread(f, listed, before), reread(f, listed, after)
        if b["units"] != a["units"]:
            # The blocks' sum moves once a renamed course takes the list's units: the rescore decides the
            # arithmetic, so this record's newly passing is not counted on the filed arithmetic alone.
            out["arithmetic_may_move"].append(f.get("control_number"))
        if (b["coverage"] != (sc.get("coverage") or {}).get("pass")
                or b["invented"] != (sc.get("invented") or {}).get("pass")):
            out["reconstruction_mismatch"] += 1
        pb, tb = checks_pass(f, b)
        pa, ta = checks_pass(f, a)
        out["coverage_fails_before"] += not b["coverage"]
        out["coverage_fails_after"] += not a["coverage"]
        out["pass_before"] += pb
        out["pass_after"] += pa
        out["tab_before"] += tb
        out["tab_after"] += ta
        cn = f.get("control_number")
        new_renames = [x for x in a["renamed"] if x not in b["renamed"]]
        if not b["coverage"] and a["coverage"]:
            out["coverage_newly_pass"].append(cn)
            if cn in live:
                out["live_coverage_newly_pass"].append(cn)
                if ta:
                    out["live_newly_pass_tab"].append(cn)
        if not pb and pa:
            out["newly_pass"].append({"record": cn, "renamed": [[x[0], x[1]] for x in new_renames[:4]]})
        if pb and not pa or tb and not ta:
            out["other_direction"].append({"record": cn, "kind": "pass_to_fail", "renamed": new_renames,
                                           "repeated": not a["repeated"], "invented": a["invented_codes"][:6]})
        elif b["coverage"] and not a["coverage"] or b["invented"] and not a["invented"] or b["repeated"] and not a["repeated"]:
            out["other_direction"].append({"record": cn, "kind": "check_to_fail", "renamed": new_renames})
        elif pb and new_renames:
            out["other_direction"].append({"record": cn, "kind": "passing_record_renamed", "renamed": new_renames})
        for pc, code, own_units in new_renames:
            if own_units is None:
                out["renamed_without_units"].append({"record": cn, "printed": pc, "listed": code})
    return out


def summary(plan: dict) -> list[str]:
    pairs = [(c, p) for c, e in plan["colleges"].items() for p in e["pairs"]]
    held = collections.Counter(h["reason"] for e in plan["colleges"].values() for h in e["held"])
    eff = plan.get("effect") or {}
    lines = ["pairs proposed: %d at %d colleges" % (len(pairs), len({c for c, _ in pairs})),
             "pairs held: %d (%s)" % (sum(held.values()), ", ".join("%s %d" % kv for kv in sorted(held.items()))),
             "held by rule (codes in coverage-fail records): %s" % ", ".join(
                 "%s %d" % (k, v["records_codes"]) for k, v in plan["held_by_rule"].items()),
             "coverage fails before/after at those colleges: %d/%d" % (
                 sum(e["coverage_fails_before"] for e in eff.values()), sum(e["coverage_fails_after"] for e in eff.values())),
             "records newly passing (score): %d; on the tab's count: %d" % (
                 sum(len(e["newly_pass"]) for e in eff.values()),
                 sum(e["tab_after"] - e["tab_before"] for e in eff.values())),
             "other-direction changes: %d (pass to fail %d)" % (
                 sum(len(e["other_direction"]) for e in eff.values()),
                 sum(1 for e in eff.values() for r in e["other_direction"] if r["kind"] == "pass_to_fail")),
             "reconstruction mismatches: %d" % sum(e["reconstruction_mismatch"] for e in eff.values()),
             "statewide: %s" % json.dumps({k: v for k, v in plan["statewide"].items() if k != "live_census_at"})]
    for c, p in pairs:
        lines.append("  %s: %s -> %s (%d courses)" % (c, p["catalog_prefix"], p["file_prefix"], len(p["evidence"])))
    return lines


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true", help="fail when the committed plan is stale")
    args = ap.parse_args(argv)
    plan = build()
    text = json.dumps(plan, indent=1, sort_keys=True, ensure_ascii=False) + "\n"
    if args.check:
        try:
            with open(OUT, encoding="utf-8") as fh:
                same = fh.read() == text
        except OSError:
            same = False
        print("prefix alias plan %s" % ("current" if same else "STALE: python3 kb/_prefix_alias_census.py"))
        return 0 if same else 1
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(text)
    print("\n".join(summary(plan)))
    print("wrote %s" % os.path.relpath(OUT, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())

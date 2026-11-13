#!/usr/bin/env python3
"""Re-clustering, the six cases and the Honors rule: a DRY RUN that writes a plan and nothing else (S648).

WHAT IT CARRIES OUT, ON PAPER. Two rulings of Sam's, both verified cpl_memory rows:
  sam-sheet-186-six-cases-as-recommended-2026-11-13  Open Asks Sheet 186 card 6, 13:16Z 2026-11-13, "All six as
      recommended": AJ 160 split, FIRE 130 X with FIRE M1274 merge, REAL M1038 with M1040 merge, MATH M1036 with
      M1044 merge, MUS 130 split, BUSI M1228 split, as kb/status/mid_outcomes_compare_2026-11-12.md proposes.
  sam-honors-own-mid-2026-11-13  Sheet 191 card 1, 14:08Z: an Honors course gets its own M-ID, with a declared
      equivalence to its base course.

WHAT IT WRITES. kb/reclustering_s648_out/<date>/plan.json (every count and id), plan.md (the same, for a reader)
and honors_worklist.json (every Honors row the rule reads, nothing dropped: Sam's ruling 5, 2026-09-05). It writes
no kb file, no generated file, no Supabase row, and it dispatches nothing. The apply is a later step the conductor
runs after review; plan.md names it.

THE DOCTRINE IT RUNS UNDER (CLAUDE.md Rule 7, docs/coursecontrolnumber_remint.md, docs/reference/mid_lifecycle.md):
  * Every named id resolves through kb/alias_chain.py before it meets the live set. The ids were named on
    2026-11-12 and 2026-11-13, after the newest applied map (2026-11-08), so the baseline is that map, no map is
    pending, and each id resolves to itself; the script asserts each is live rather than assuming it.
  * A C-ID or CCN identity is an external authority and never re-keyed. A split of AJ 160 or MUS 130 moves
    members out of the official row; the id stays. A member whose place under the official row comes from the
    college's own COCI claim, or from an ASCCC approval, is held for a person: kb/reference/cid_claim_holds.json
    sets a claim aside only on its four signals, and this script reports which a member meets.
  * Units never split an identity (Sam, 2026-09-27): a merge shows the unit range it joins.
  * TOP is shown and gates nothing.
  * One district is one voice on splits and merges (d-reclustering-district-guard-s643): each moved group and
    merge pair carries its district count.

THE HONORS RULE, as this script reads it (each gate is pinned by tests/reclustering_honors.test.js, which runs
`--selftest` and proves every fixture flips when its gate is dropped with `--drop-gate`):
  title_word        a course is Honors when its title carries the word Honors or Honor as a whole word
                    ("Honoring Diversity" is not).
  code_not_enough   a code ending in H is never enough alone: De Anza, Rio Hondo, Santa Monica and others use
                    the suffix for other things (AUTO 060H, CARP 050H, COUNS 12H).
  program_course    a title that is only the honors program's own course (Honors Colloquium, Honors Forum,
                    Honors Seminar, Honor Society) has no base course; it keeps its own identity.
  same_college      the base course sits at the same college.
  base_not_honors   the base is itself not an Honors course.
  code_and_title    a base found by code (the honors code with its H removed: 1AH to 1A, 102HF to 102F,
                    CHEMH 206 to CHEM 206) must agree on title too, once Honors is struck (stem overlap 0.5).
  unique_title      a base found by title alone must be the only course at that college with that title.

Run (from repo root):
  python3 kb/_reclustering_s648_dryrun.py               # writes kb/reclustering_s648_out/<date>/
  python3 kb/_reclustering_s648_dryrun.py --selftest    # the Honors fixtures as JSON (the test reads it)
  python3 kb/_reclustering_s648_dryrun.py --selftest --drop-gate title_word
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import date
from functools import lru_cache

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

OUT_ROOT = os.environ.get("RECLUSTER_S648_OUT") or os.path.join(HERE, "reclustering_s648_out")
REPORT_JSON = "kb/status/mid_outcomes_compare_2026-11-12.json"
COHORT = "reclustering-s648@bot"

RULINGS = {
    "six": {"memory": "sam-sheet-186-six-cases-as-recommended-2026-11-13",
            "said": "All six as recommended", "where": "Open Asks Sheet 186 card 6", "at": "2026-11-13T13:16Z"},
    "honors": {"memory": "sam-honors-own-mid-2026-11-13",
               "said": "an Honors course gets its own M-ID, with a declared equivalence to its base course",
               "where": "Open Asks Sheet 191 card 1, reply 'two'", "at": "2026-11-13T14:08Z"},
}

# The six, as the report names them. For a merge the survivor is named here and the reason is in `why`; for a
# split the group that stays is derived (most districts, then the title most members carry) and asserted.
CASES = [
    {"n": 1, "op": "split", "ids": ["AJ 160"]},
    {"n": 2, "op": "merge", "ids": ["FIRE 130 X", "FIRE M1274"], "survivor": "FIRE 130 X",
     "why": "an official C-ID row is never folded into an M-ID; the M-ID folds into it"},
    {"n": 3, "op": "merge", "ids": ["REAL M1038", "REAL M1040"], "survivor": "REAL M1040",
     "why": "the larger identity (70 members) with the wider credit-by-exam reach (6 earning colleges)"},
    {"n": 4, "op": "merge", "ids": ["MATH M1036", "MATH M1044"], "survivor": "MATH M1036",
     "why": "the larger identity (44 members); MATH M1044's three members are one district"},
    {"n": 5, "op": "split", "ids": ["MUS 130"]},
    {"n": 6, "op": "split", "ids": ["BUSI M1228"]},
]

# The report's quoted recommendation, one line per case (kb/status/mid_outcomes_compare_2026-11-12.md).
REPORT_LINE = {
    1: "AJ 160, Community and the Justice System: proposed split (partial). 99 members, 95 colleges, units 0 to 4. "
       "outcomes and the descriptions say the groups differ; the titles do not.",
    2: "FIRE 130 X and FIRE M1274: proposed merge (strong). ... The closest pair across two districts: FST 6 Building "
       "Construction for Fire Protection, Las Positas College and FIPT 104 Building Construction for Fire Protection, "
       "San Diego Miramar College, outcomes 0.87, descriptions 0.64, titles 1.00; 4 course pairs reach the merge line.",
    3: "REAL M1038 and REAL M1040: proposed merge (partial). ... The two titles each name something the other lacks "
       "(Real Estate Practice, Real Estate Principles), so before a merge a person checks whether a student takes "
       "both, as two required courses or two steps of one sequence; word overlap cannot tell.",
    4: "MATH M1036 and MATH M1044: proposed merge (partial). ... The closest pair across two districts: MATH G115 "
       "College Algebra, Golden West College and MATH 116 College and Matrix Algebra, San Diego Miramar College, "
       "outcomes 0.57, descriptions 0.27, titles 0.67; 2 course pairs reach the merge line.",
    5: "MUS 130, Music Theory II: proposed split (partial). 90 members, 88 colleges, units 3 to 5. outcomes and the "
       "descriptions say the groups differ; the titles do not.",
    6: "BUSI M1228, International Documentation and Supply Chain Management: proposed split (partial). 24 members, "
       "21 colleges, units 0 to 3. outcomes, descriptions and titles say the groups differ, but each college sits in "
       "one group, so different wording of one course is not ruled out.",
}

# Files whose ids are history (applied receipts) or this plan's own output are not "touched".
SCAN_SKIP_DIRS = ("_out", "receipts", "remint_dryrun", "subj4_apply", "row_audit", "docs_audit", "memory_audit",
                  "reclustering_s648_out", "course_outcomes")
SCAN_MAX_BYTES = 60_000_000


# ── The Honors rule ──────────────────────────────────────────────────────────────────────────────────────────────

GATES = ("title_word", "code_not_enough", "program_course", "same_college", "base_not_honors", "code_and_title",
         "unique_title")
HONORS_WORD = re.compile(r"\bhonou?rs?\b", re.I)
HONORS_LOOSE = re.compile(r"honou?r", re.I)
HONORS_NUM = re.compile(r" \S*\d[A-Z]?H[A-Z]?$")  # a course number ending in the H marker (1AH, 102HF)
PROGRAM_WORDS = {"colloquium", "forum", "seminar", "program", "society", "project", "research", "scholars",
                 "scholar", "independent", "study", "studies", "special", "topics", "topic", "phi", "theta", "kappa",
                 "contract", "directed", "and", "in", "the", "of", "a", "for", "to", "i", "ii", "iii", "iv", "1", "2",
                 "3", "4", "humanities", "sciences", "social", "natural", "biological", "applied", "interdisciplinary",
                 "leadership", "transfer", "capstone", "course"}
STOP = {"and", "of", "the", "in", "to", "for", "a", "an", "with", "on", "honors", "honor", "honours", "honour"}


def _words(title):
    return [w for w in re.sub(r"[^a-z0-9]+", " ", (title or "").lower()).split() if w]


def strip_honors(title):
    """The title with the Honors word struck, normalized: the base course's expected title."""
    return " ".join(w for w in _words(HONORS_WORD.sub(" ", title or "")) if w)


def stems(title):
    return {w.rstrip("s") for w in _words(title) if w not in STOP and len(w) > 1}


def title_agree(a, b):
    sa, sb = stems(a), stems(b)
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)


@lru_cache(maxsize=None)
def is_honors(title, code, drop=()):
    """(kind, reason): kind is 'honors', 'program' (an honors-program course with no base) or None."""
    t = title or ""
    if "title_word" in drop:
        hit = bool(HONORS_LOOSE.search(t))
    else:
        hit = bool(HONORS_WORD.search(t))
    if not hit and "code_not_enough" in drop and honors_code_base(code):
        hit = True
    if not hit:
        return None, "no Honors word in the title"
    if "program_course" not in drop:
        rest = [w for w in _words(HONORS_WORD.sub(" ", t))]
        if not rest or all(w in PROGRAM_WORDS for w in rest):
            return "program", "an honors-program course: the title names no subject beside the program"
    return "honors", "the title carries the word Honors"


def honors_code_base(code):
    """The base course's code: the honors code with its H marker removed, or None when the code carries none.
    'ENGL 1AH' -> 'ENGL 1A'; 'ACCT 102HF' -> 'ACCT 102F'; 'CHEMH 206' -> 'CHEM 206'; 'HIST 484' -> None."""
    c = " ".join((code or "").split()).upper()
    if " " not in c:
        return None
    subj, num = c.rsplit(" ", 1)
    m = re.match(r"^(.*\d[A-Z]?)H([A-Z]?)$", num)
    if m and m.group(1):
        return f"{subj} {m.group(1)}{m.group(2)}"
    if subj.endswith("H") and len(subj) > 2:
        return f"{subj[:-1]} {num}"
    return None


def code_key(code):
    """A code compared across one college's own spellings: 'ECON 001' and 'ECON 1' are one course."""
    c = " ".join((code or "").split()).upper()
    if " " not in c:
        return c
    subj, num = c.rsplit(" ", 1)
    return subj.replace(" ", "") + " " + (re.sub(r"^0+(?=\d)", "", num))


def find_base(row, college_rows, drop=()):
    """The base course of an Honors row among the rows of a set of colleges. row and each entry are dicts with
    college, code, title. Returns (base_or_None, how)."""
    pool = college_rows if "same_college" in drop else [r for r in college_rows if r["college"] == row["college"]]
    pool = [r for r in pool if not (r["code"] == row["code"] and r["college"] == row["college"])]
    if "base_not_honors" not in drop:
        pool = [r for r in pool if is_honors(r["title"], r["code"])[0] is None]
    want_code = honors_code_base(row["code"])
    if want_code:
        by_code = [r for r in pool if code_key(r["code"]) == code_key(want_code)]
        if "code_and_title" not in drop:
            by_code = [r for r in by_code if title_agree(strip_honors(row["title"]), r["title"]) >= 0.5]
        if len(by_code) >= 1:
            return by_code[0], "code"
    want_title = strip_honors(row["title"])
    if not want_title:
        return None, "no title left once Honors is struck"
    by_title = [r for r in pool if " ".join(_words(r["title"])) == want_title]
    if len(by_title) == 1 or (by_title and "unique_title" in drop):
        return by_title[0], "title"
    if len(by_title) > 1:
        return None, f"ambiguous: {len(by_title)} courses at the college carry the base title"
    return None, "no base course at the college"


FIXTURES = [
    # (name, gate it pins, input, expected)
    ("an Honors title is Honors", "title_word",
     {"kind": {"title": "Honoring Diversity in Early Childhood", "code": "ECE 40"}}, {"kind": None}),
    ("a code ending in H alone is not Honors", "code_not_enough",
     {"kind": {"title": "Advanced Drivability and Onboard Diagnostics", "code": "AUTO 060H"}}, {"kind": None}),
    ("an honors-program course has no base", "program_course",
     {"kind": {"title": "Honors Colloquium", "code": "HONORS 1"}}, {"kind": "program"}),
    ("the base sits at the same college", "same_college",
     {"base": {"row": {"college": "A", "code": "ENGL 1AH", "title": "Honors Freshman Composition"},
               "pool": [{"college": "B", "code": "ENGL 1A", "title": "Freshman Composition"}]}}, {"base": None}),
    ("the base is not itself Honors", "base_not_honors",
     {"base": {"row": {"college": "A", "code": "ENGL 1AH", "title": "Honors Composition"},
               "pool": [{"college": "A", "code": "ENGL 1A", "title": "Composition - Honors"}]}},
     {"base": None}),
    ("a code match must agree on title", "code_and_title",
     {"base": {"row": {"college": "A", "code": "ENGL 1AH", "title": "Honors Freshman Composition"},
               "pool": [{"college": "A", "code": "ENGL 1A", "title": "Creative Writing Workshop"}]}},
     {"base": None}),
    ("a title-only base must be unique at the college", "unique_title",
     {"base": {"row": {"college": "A", "code": "HIST 499", "title": "History of the United States - Honors"},
               "pool": [{"college": "A", "code": "HIST 17A", "title": "History of the United States"},
                        {"college": "A", "code": "HIST 17B", "title": "History of the United States"}]}},
     {"base": None}),
]
# Positive controls: the rule finds what it should, whatever gate is dropped.
CONTROLS = [
    ("a code base with an agreeing title", {"row": {"college": "A", "code": "ENGL 1AH", "title": "Honors Freshman Composition"},
                                            "pool": [{"college": "A", "code": "ENGL 1A", "title": "Freshman Composition"}]},
     "ENGL 1A"),
    ("the Fullerton form, 102HF to 102F", {"row": {"college": "F", "code": "ACCT 102HF", "title": "Honors Financial Accounting"},
                                           "pool": [{"college": "F", "code": "ACCT 102F", "title": "Financial Accounting"}]},
     "ACCT 102F"),
    ("the subject form, CHEMH 206 to CHEM 206", {"row": {"college": "V", "code": "CHEMH 206", "title": "Honors Organic Chemistry"},
                                                 "pool": [{"college": "V", "code": "CHEM 206", "title": "Organic Chemistry"}]},
     "CHEM 206"),
    ("leading zeros fold, ECON 001H to ECON 1", {"row": {"college": "D", "code": "ECON 001H", "title": "Principles of Macroeconomics - HONORS"},
                                                 "pool": [{"college": "D", "code": "ECON 1", "title": "Principles of Macroeconomics"},
                                                          {"college": "D", "code": "ECON C2002", "title": "Principles of Macroeconomics"}]},
     "ECON 1"),
    ("a title base when the code carries no H", {"row": {"college": "S", "code": "HIST 484", "title": "History of the United States - Honors"},
                                                 "pool": [{"college": "S", "code": "HIST 410", "title": "History of the United States"}]},
     "HIST 410"),
]


def selftest(drop=()):
    out = []
    for name, gate, inp, exp in FIXTURES:
        if "kind" in inp:
            got = {"kind": is_honors(inp["kind"]["title"], inp["kind"]["code"], drop)[0]}
        else:
            b, _ = find_base(inp["base"]["row"], inp["base"]["pool"], drop)
            got = {"base": b["code"] if b else None}
        out.append({"name": name, "gate": gate, "expected": exp, "got": got, "pass": got == exp})
    for name, inp, code in CONTROLS:
        b, how = find_base(inp["row"], inp["pool"], drop)
        got = b["code"] if b else None
        out.append({"name": "control: " + name, "gate": None, "expected": code, "got": got, "pass": got == code})
    return out


# ── Loading ──────────────────────────────────────────────────────────────────────────────────────────────────────

def nrm(x):
    return " ".join(str(x).split()).upper() if x is not None else ""


def jload(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return json.load(f)


def load_raw(root=ROOT):
    """(college, code) -> raw COCI row facts, from the committed kb/reference/coci_course_list.xlsx."""
    from openpyxl import load_workbook
    import _mid_outcomes_compare as cmp
    wb = load_workbook(os.path.join(root, "kb", "reference", "coci_course_list.xlsx"), read_only=True)
    ws = wb[wb.sheetnames[0]]
    it = ws.iter_rows(values_only=True)
    next(it)
    out = {}
    nullish = {"", "NULL", "N/A", "NA", "NONE", "NOT APPLICABLE", "NOT APPLICABLE.", "TBD", "-"}
    for r in it:
        college, subj, num = r[0], r[2], r[3]
        if not college:
            continue
        code = nrm(f"{subj} {num}" if subj is not None else (num if num is not None else ""))
        cid = nrm(r[9]); ccn = nrm(r[11])
        out.setdefault((cmp.clean_college(str(college)), code), []).append({
            "control_number": nrm(r[1]), "title": r[4], "units": r[5], "top": (str(r[8] or "")[:7]),
            "coci_cid": None if cid in nullish else cid, "coci_ccn": None if ccn in nullish else ccn})
    return out


def merge_chain_end(merge_into, src):
    tgt, seen = merge_into.get(src), {src}
    while tgt in merge_into and tgt not in seen:
        seen.add(tgt)
        tgt = merge_into[tgt]
    return tgt


class World:
    """Every committed input the plan reads, loaded once."""

    def __init__(self, raw=None):
        import _mid_outcomes_compare as cmp
        import alias_chain
        self.cmp = cmp
        self.members, self.members_at = cmp.load_members(ROOT)
        self.index = cmp.load_index(ROOT)
        self.cat = jload("kb/coci_minted_courses.json")["courses"]
        self.sg = jload("kb/coci_minted_singletons.json")["courses"]
        self.memships = jload("kb/coci_minted_memberships.json")["memberships"]
        cur = jload("kb/coci_curation.json")
        self.cur, self.cur_synced = cur["curations"], cur.get("_synced_at")
        self.promotions = jload("kb/promotions.json")["promotions"]
        self.articulations = jload("kb/coci_articulations.json")
        self.crnc = (jload("kb/crnc_mirrors.json") or {}).get("mirrors", {})
        self.holds = {nrm(h["control_number"]): h for h in jload("kb/reference/cid_claim_holds.json").get("holds", [])}
        self.cid_desc = {str(d.get("descriptor") or "").strip(): d.get("title")
                         for d in jload("kb/reference/cid_descriptors.json").get("descriptors", [])}
        joins = jload("kb/cid_articulation_joins.json").get("joins", [])
        self.approvals = defaultdict(list)
        for j in joins:
            self.approvals[nrm(j.get("control_number"))].append({"cid": j.get("cid"), "disposition": j.get("disposition")})
        self.raw = raw if raw is not None else load_raw()
        districts, self.districts_from = cmp.load_districts(ROOT)
        self.voice = cmp.voice_of(districts)
        self.merge_into = {k: v["merge_into"] for k, v in self.cur.items() if v.get("merge_into")}
        # control number -> the leaf identities (memberships / singletons) that hold it
        self.leaf_of = defaultdict(list)
        for mid, plist in self.memships.items():
            for p in plist:
                self.leaf_of[nrm(p.get("control_number"))].append(mid)
        for sid, sv in self.sg.items():
            if sv.get("control_number"):
                self.leaf_of[nrm(sv["control_number"])].append(sid)
        # the alias chain, from the era the ids were named in (after the newest applied map)
        pending, _ = alias_chain.pending_maps(None, baseline_through=alias_chain.ALIAS_MAPS[-1])
        self.pending_maps = pending
        maps = alias_chain.load_maps(pending)
        self.resolve = lambda i: alias_chain.resolve_id(i, maps)
        self.newest_map = alias_chain.ALIAS_MAPS[-1]

    def id_system(self, i):
        if i in self.cat:
            return self.cat[i].get("id_system") or "M-ID"
        if i in self.sg:
            return "M-ID (stand-alone)"
        if re.match(r"^[A-Z]{1,6} [MZ]\d", i):
            return "M-ID"
        if re.match(r"^[A-Z]+ C\d{4}", i):
            return "CCN-ID"
        return "C-ID"

    def discipline(self, i):
        rec = self.cat.get(i) or self.sg.get(i)
        if rec and rec.get("discipline"):
            return rec["discipline"]
        c = self.cur.get(i) or {}
        if c.get("discipline"):
            return c["discipline"]
        return "(official C-ID or CCN: no M-ID discipline)" if self.id_system(i) in ("C-ID", "CCN-ID") else "(none)"

    def provenance(self, identity, college, code):
        """Why a member sits under `identity` in the nightly export: the facts, never a guess."""
        rr = self.raw.get((college, nrm(code))) or []
        out = {"college": college, "code": code, "raw_rows": len(rr)}
        if not rr:
            out["finding"] = "not in the committed COCI list"
            return out
        r = rr[0]
        cn = r["control_number"]
        out.update({"control_number": cn, "title": r["title"], "units": r["units"], "top": r["top"],
                    "coci_cid": r["coci_cid"], "coci_ccn": r["coci_ccn"]})
        appr = self.approvals.get(cn) or []
        out["asccc_approvals"] = appr
        out["claim_hold"] = cn in self.holds
        leaves = self.leaf_of.get(cn) or []
        out["leaf_ids"] = leaves
        out["cn_rehome"] = (self.cur.get("CN:" + cn) or {}).get("merge_into")
        out["leaf_merge_into"] = {l: merge_chain_end(self.merge_into, l) for l in leaves if l in self.merge_into}
        out["leaf_promotion_targets"] = {l: sorted((self.promotions.get(l) or {}).get("official_targets", {}).keys())
                                         for l in leaves if (self.promotions.get(l) or {}).get("official_targets")}
        idn = nrm(identity)
        if r["coci_cid"] and r["coci_cid"] == idn and cn not in self.holds:
            how = "coci_cid_claim"
        elif any(a["cid"] and nrm(a["cid"]) == idn and a["disposition"] in ("new_authority", "compatible_multi",
                                                                               "already_claimed") for a in appr):
            how = "asccc_approval"
        elif out["cn_rehome"]:
            how = "cn_rehome"
        elif any(v == identity for v in out["leaf_merge_into"].values()):
            how = "leaf_merge_into"
        elif any(t in ("C-ID:" + identity, "CCN:" + identity)
                 for ts in out["leaf_promotion_targets"].values() for t in ts):
            how = "leaf_phase_b_fold"
        elif identity in leaves:
            how = "own_leaf"
        else:
            how = "unexplained"
        out["sits_by"] = how
        return out


# ── The six ──────────────────────────────────────────────────────────────────────────────────────────────────────

def identity_facts(w, i):
    rows = w.members.get(i) or []
    units = sorted({r["units"] for r in rows if isinstance(r.get("units"), (int, float))})
    return {"id": i, "id_system": w.id_system(i), "title": (w.index.get(i) or {}).get("title"),
            "minted_title": (w.cat.get(i) or w.sg.get(i) or {}).get("common_title"),
            "discipline": w.discipline(i), "members": len(rows), "colleges": len({r["college"] for r in rows}),
            "districts": len({w.voice(r["college"]) for r in rows}),
            "units": [units[0], units[-1]] if units else None,
            "in_cid_catalog": i in w.cid_desc, "curation": w.cur.get(i),
            "merge_into_chain_end": merge_chain_end(w.merge_into, i) if i in w.merge_into else None,
            "pointed_at_by": sorted(k for k, v in w.merge_into.items() if v == i)}


def keeper_group(groups, rows):
    """The group that keeps the identity: most districts, then the title most of the identity's members carry."""
    def carried(g):
        return sum(1 for r in rows if title_agree(r["title"], g["title"]) >= 0.5)
    ranked = sorted(range(len(groups)), key=lambda k: (-groups[k]["districts"], -carried(groups[k]), k))
    return ranked[0], {k: carried(groups[k]) for k in range(len(groups))}


def plan_case(w, case, report, alloc):
    named = {i: w.resolve(i) for i in case["ids"]}
    live = {i: (r in w.members) for i, r in named.items()}
    out = {"n": case["n"], "op": case["op"], "report_says": REPORT_LINE[case["n"]],
           "named_ids": named, "all_live": all(live.values()),
           "identities": {r: identity_facts(w, r) for r in named.values()}, "blockers": [], "notes": []}
    if not out["all_live"]:
        out["blockers"].append("a named id is not live after the alias chain: " + json.dumps(live))
        return out
    rep = report["mids"]
    if case["op"] == "split":
        i = named[case["ids"][0]]
        r = rep[i]
        groups = r["groups"]
        keep, carried = keeper_group(groups, w.members[i])
        out["groups"] = [{"title": g["title"], "districts": g["districts"], "colleges": g["colleges"],
                          "members": g["members"], "members_carrying_its_title": carried[k],
                          "stays": k == keep} for k, g in enumerate(groups)]
        moves = []
        canon_doc = jload("kb/discipline_canonical_subj4.json").get("disciplines", {})
        for k, g in enumerate(groups):
            if k == keep:
                continue
            for college, code in g["members"]:
                p = w.provenance(i, college, code)
                disc = w.discipline(i)
                if w.id_system(i) in ("C-ID", "CCN-ID"):
                    disc = _discipline_of_member(w, p) or modal_leaf_discipline(w, i) or disc
                hold = p.get("sits_by") in ("coci_cid_claim", "asccc_approval")
                # Its own leaf identity, when it holds this course alone, is the home it returns to: no new id.
                own = [l for l in p.get("leaf_ids") or [] if len(w.memships.get(l) or [None]) == 1]
                leaf_facts = {l: {"title": (w.cat.get(l) or w.sg.get(l) or {}).get("common_title"),
                                  "members_in_its_own_record": len(w.memships.get(l) or [1]),
                                  "live_row": l in w.members,
                                  "merge_into": (w.cur.get(l) or {}).get("merge_into"),
                                  "merge_into_by": (w.cur.get(l) or {}).get("reviewed_by"),
                                  "merge_into_at": (w.cur.get(l) or {}).get("reviewed_at")}
                              for l in p.get("leaf_ids") or []}
                new_id = None
                bot_fold = [l for l, v in leaf_facts.items() if v["merge_into"] == i]
                if hold:
                    target, how = (own[0] if own else None), "held: the official claim or approval stands"
                    mech = ("HELD for a person: the member sits under the official id by "
                            + ("the college's own COCI C-ID claim" if p.get("sits_by") == "coci_cid_claim"
                               else "an ASCCC C-ID approval (kb/cid_articulation_joins.json, routed by the export)")
                            + ". kb/reference/cid_claim_holds.json sets a COCI claim aside only on its four signals, "
                              "none of which a split by outcomes supplies, and no mechanism sets an ASCCC approval "
                              "aside")
                elif bot_fold:
                    # The course's own record already folds into this identity by a saved row. The clean route
                    # removes that row (Sam's word: deleting a saved row is on the hold list, whoever wrote it).
                    # The insert-only route leaves residue (the S648 review of #3245), so neither is planned here.
                    f = bot_fold[0]
                    lf = leaf_facts[f]
                    target, how = f, "held: returns to its own record only when Sam allows removing one saved row"
                    mech = (f"HELD for Sam's word. Route A (clean): remove the row ({f}, merge_into, {i}) that "
                            f"{lf['merge_into_by']} saved at {lf['merge_into_at']}, its before-value written to the "
                            f"receipt first so a re-INSERT undoes it; the course returns to {f}, its own record. "
                            f"Route B (insert-only): a CN:{p.get('control_number')} row re-homing the course onto a "
                            f"newly minted stand-alone. Route B leaves residue: {f} stays a merge member of {i} "
                            f"through the bot's row, so {i} keeps the course's title variant, count and aggregates, "
                            f"and a second identity is minted beside a live sibling record ({f})")
                    hold = True
                elif own:
                    target, how = own[0], "returns to its own stand-alone record"
                    mech = (f"kb_curation row CN:{p.get('control_number')} merge_into {target}, INSERT-only under "
                            f"{COHORT}")
                else:
                    canon = (canon_doc.get(disc) or {}).get("canonical_subj4")
                    if canon:
                        new_id, _ = alloc.place(f"{canon} M10AA", canon, prefer_keep=False,
                                                reason=f"split out of {i} (S648 plan)")
                    target, how = new_id, ("a new stand-alone M-ID" if new_id
                                           else "HELD: no canonical code for its discipline")
                    mech = (f"kb_curation row CN:{p.get('control_number')} merge_into {target}, INSERT-only under "
                            f"{COHORT}, plus the new stand-alone record")
                mv = {"group_title": g["title"], "group_districts": g["districts"], **p,
                      "to": how, "target_id": target, "proposed_new_id": new_id, "proposed_discipline": disc,
                      "leaf_facts": leaf_facts, "held": hold, "mechanism": mech}
                if p.get("sits_by") in ("coci_cid_claim", "asccc_approval"):
                    mv["claim_hold_signals"] = claim_hold_signals(w, i, p)
                moves.append(mv)
        out["moves"] = moves
        out["stays_count"] = len(w.members[i]) - len(moves)
        out["alias_map_entries"] = []
        out["alias_note"] = "none: the identity keeps its id, and no move is planned for this apply"
        off = [m for m in moves if m.get("sits_by") in ("coci_cid_claim", "asccc_approval")]
        if off:
            out["blockers"].append(f"{len(off)} of {len(moves)} moved members sit under {i} by an official claim "
                                   "or approval: a person rules whether outcomes may override it")
        bf = [m for m in moves if m["held"] and m not in off]
        if bf:
            m = bf[0]
            f = m["target_id"]
            out["blockers"].append(f"Needs Sam's word: {m['college']} {m['code']} returns to its own record {f} only "
                                   f"by removing the row ({f}, merge_into, {i}) that "
                                   f"{m['leaf_facts'][f]['merge_into_by']} saved at "
                                   f"{m['leaf_facts'][f]['merge_into_at']}; the insert-only route leaves the residue "
                                   "named in the move")
        if w.id_system(i) in ("C-ID", "CCN-ID"):
            out["notes"].append(f"{i} is an official identity: it is never re-keyed, and it keeps every member "
                                "the split does not move")
    else:
        a, b = (named[x] for x in case["ids"])
        surv = named[case["survivor"]]
        gone = b if surv == a else a
        out["survivor"], out["folds"], out["survivor_why"] = surv, gone, case["why"]
        fa, fb = out["identities"][surv], out["identities"][gone]
        us = [u for f in (fa, fb) if f["units"] for u in f["units"]]
        out["unit_range_after"] = [min(us), max(us)] if us else None
        prov = Counter()
        claims = Counter()
        for row in w.members[gone]:
            p = w.provenance(gone, row["college"], row["code"])
            prov[p.get("sits_by", p.get("finding"))] += 1
            if p.get("coci_cid"):
                claims[p["coci_cid"]] += 1
        out["folded_members_by_provenance"] = dict(prov)
        out["folded_members_official_claims"] = dict(claims)
        dist_a = {w.voice(r["college"]) for r in w.members[surv]}
        dist_b = {w.voice(r["college"]) for r in w.members[gone]}
        out["districts"] = {surv: len(dist_a), gone: len(dist_b), "shared": len(dist_a & dist_b)}
        out["mechanism"] = (f"kb_curation row ({gone}, merge_into, {surv}), INSERT-only under {COHORT}; the export "
                            "folds every member, articulation and curation pointer of the folded id through it")
        out["alias_map_entries"] = []
        out["alias_note"] = (f"none: a merge_into fold re-keys nothing; {gone} stays a reserved id that resolves to "
                             "itself, and deleting the cohort row undoes the merge. A re-key merge (alias "
                             f"{gone} -> {surv}) is the alternative only between two M-IDs, and it would move every "
                             "id-keyed class below")
        cur_gone = w.cur.get(gone) or {}
        idents = w.articulations.get("identities") or {}
        if gone not in idents:
            out["notes"].append(f"the adopter and potential college lists on {surv}'s row do not follow the merge: "
                                f"{gone} has no entry in kb/coci_articulations.json identities, so the export's "
                                "rollup skips it. Queued as a lane follow-up: rebuild the identities map")
        if cur_gone and not str(cur_gone.get("reviewed_by") or "").endswith("@bot"):
            out["notes"].append(f"after the sync, {gone}'s overlay entry reads as {COHORT}'s (the newest row wins "
                                "reviewed_by and reviewed_at in kb/_apply_curation.py), while "
                                f"{cur_gone.get('reviewed_by')}'s {cur_gone.get('reviewed_at', '')[:10]} "
                                f"{', '.join(k for k in cur_gone if k not in ('reviewed_by', 'reviewed_at'))} row "
                                "itself stays untouched in the table")
            out["notes"].append(f"{gone} carries a person's curation ({', '.join(k for k in cur_gone if k not in ('reviewed_by', 'reviewed_at'))} "
                                f"by {cur_gone.get('reviewed_by')}); the merge_into row sits in its own slot, so it "
                                "lands beside that row and the survivor's title shows")
        for other in (rep.get(gone) or {}).get("merge_with", []) + (rep.get(surv) or {}).get("merge_with", []):
            if other["mid"] not in (gone, surv) and other["level"] == "strong":
                out["notes"].append(f"the report also pairs this case with {other['mid']} (strong, best outcomes "
                                    f"{other['best_out']}); that pair is outside the ruling and outside this plan")
        if cur_gone.get("merge_into"):
            out["blockers"].append(f"{gone} already holds merge_into {cur_gone['merge_into']} "
                                   f"({cur_gone.get('reviewed_by')}): the slot is taken, so an INSERT cannot land")
        out["pointers_into_folded"] = []
        for k in fb["pointed_at_by"]:
            rec = w.cat.get(k) or w.sg.get(k) or {}
            c = w.cur.get(k) or {}
            out["pointers_into_folded"].append({
                "row": [k, "merge_into", gone], "reviewed_by": c.get("reviewed_by"), "reviewed_at": c.get("reviewed_at"),
                "course": f"{rec.get('college')} {rec.get('subject')} {rec.get('course_number')} {rec.get('common_title')}",
                "fate": (f"unchanged. {gone} stays a live catalog record (no alias map is written and nothing is "
                         "re-keyed, so kb/alias_chain.py never moves this row), and the export follows the row's "
                         f"pointer through {gone}'s own merge_into to {surv} (flatten_merge_chains): the course "
                         f"shows under {surv}, and deleting the cohort row returns it to {gone}")})
        if fb["pointed_at_by"]:
            out["notes"].append(f"{len(fb['pointed_at_by'])} curation pointers already fold into {gone} ("
                                + "; ".join(f"{p['row'][0]} by {p['reviewed_by']}" for p in out["pointers_into_folded"])
                                + f"); each stays as saved and the export follows it on to {surv}")
        if surv in w.merge_into:
            out["blockers"].append(f"the survivor {surv} itself folds into {w.merge_into[surv]}")
        if w.id_system(surv) == "C-ID" and surv not in w.cid_desc:
            out["notes"].append(f"{surv} is not in kb/reference/cid_descriptors.json, so the export titles it "
                                "from its claimants")
        inh = inherited_articulations(w, gone, surv)
        out["inherited_articulations"] = inh
        sus = [x for x in inh if x["suspect"]]
        if sus:
            x = sus[0]
            out["blockers"].append(
                f"{gone} carries the articulation of exhibit {x['exhibit_id']} *{x['exhibit_title']}* ("
                f"{x['cpl_type']}, earned at {', '.join(x['earned_by_colleges'])}), whose unified title is "
                f"*{x['unified_title']}* while its credit recommendation reads '{x['credit_recommendation']}' and "
                f"its local course is {x['local_course']}: the title names another subject, so the record looks "
                f"mis-filed at the title's unification (a college-wide credit-by-exam exhibit given one course's "
                f"name). The merge would carry that title's {x['eligible_credits']} eligible credits and "
                f"{x['students']} students into {surv}. Settled when the Exhibit Reference re-titles "
                f"{x['exhibit_id']} by its credit recommendations (or the articulation moves off {gone}); then "
                "the merge proceeds")
        if case["n"] == 3:
            out["blockers"].append(
                "the report's own condition: a person checks whether a student takes both. Both minted records "
                "say the course is required for the California real estate salesperson license (REAL M1038: "
                "'required for the educational requirement for the California real estate salesperson license'; "
                "REAL M1040: 'A State of California required course for the Real Estate Sales License exam'). "
                "Read that way, a student takes both and the merge does not proceed; a person confirms")
    return out


_CR_TOTALS = {}


def cr_totals():
    """unified title -> (eligible credits, students served), from credential_reference_data.js (what the export's
    CPL-impact columns read)."""
    if not _CR_TOTALS:
        with open(os.path.join(ROOT, "credential_reference_data.js"), encoding="utf-8") as f:
            src = f.read()
        doc = json.loads(src[src.index("{"):src.rindex("}") + 1])
        for u in doc.get("unified_titles") or []:
            _CR_TOTALS[u.get("ut")] = (u.get("eligible_credits"), u.get("students_served"))
    return _CR_TOTALS


def inherited_articulations(w, gone, surv):
    """The articulation records a merge carries from the folded id into the survivor, with the CPL-impact figures
    the survivor's row would add. A credit-by-exam record whose unified title shares no word with its own credit
    recommendation is a suspect: an exam is named for the course it awards."""
    arts = w.articulations.get("articulations", [])
    have = {a.get("unified_title") for a in arts if a.get("course_id") == surv}
    tot = cr_totals()
    out = []
    for a in arts:
        if a.get("course_id") != gone:
            continue
        ut = a.get("unified_title")
        cr = (a.get("credit_recommendations") or [""])[0]
        crt = re.sub(r"^\s*[\d.]+\s*(semester\s+)?(hours?|units?)\s+in\s+", "", cr, flags=re.I)
        cbe = (a.get("cpl_type_description") or "") == "Credit By Exam"
        el, st = tot.get(ut, (None, None))
        out.append({"exhibit_id": a.get("exhibit_id"), "exhibit_title": a.get("exhibit_title"), "unified_title": ut,
                    "cpl_type": a.get("cpl_type_description"), "credit_recommendation": cr,
                    "local_course": ", ".join(f"{c.get('subject')} {c.get('number')} {c.get('title')}"
                                              for c in a.get("local_courses") or []),
                    "earned_by_colleges": a.get("earned_by_colleges") or [],
                    "eligible_credits": el, "students": st, "new_to_survivor": ut not in have,
                    "suspect": cbe and title_agree(ut or "", crt) == 0.0})
    return out


def _discipline_of_member(w, p):
    for leaf in p.get("leaf_ids") or []:
        d = (w.cat.get(leaf) or w.sg.get(leaf) or {}).get("discipline")
        if d:
            return d
    return None


def modal_leaf_discipline(w, identity):
    """The discipline most of an official identity's members carry on their own leaf records."""
    c = Counter()
    for r in w.members.get(identity) or []:
        rr = w.raw.get((r["college"], nrm(r["code"]))) or []
        for leaf in (w.leaf_of.get(rr[0]["control_number"]) if rr else None) or []:
            d = (w.cat.get(leaf) or w.sg.get(leaf) or {}).get("discipline")
            if d:
                c[d] += 1
                break
    return c.most_common(1)[0][0] if c else None


def claim_hold_signals(w, identity, p):
    """The four signals kb/reference/cid_claim_holds.json requires, read for one member: which hold."""
    others = [r for r in w.members[identity] if not (r["college"] == p["college"] and r["code"] == p["code"])]
    subj = (p["code"] or "").split(" ")[0]
    other_subj = {(r["code"] or "").split(" ")[0] for r in others}
    other_top2 = {str(r.get("top") or "")[:2] for r in others}
    best_title = max((title_agree(p.get("title") or "", r["title"]) for r in others), default=0.0)
    approved = any(nrm(a["cid"]) == nrm(identity) for a in p.get("asccc_approvals") or [])
    return {"no_asccc_approval": not approved,
            "subject_disagrees_with_every_other_member": subj not in other_subj,
            "top_family_disagrees": str(p.get("top") or "")[:2] not in other_top2,
            "title_shares_no_word": best_title == 0.0,
            "qualifies": (not approved) and subj not in other_subj and str(p.get("top") or "")[:2] not in other_top2
            and best_title == 0.0}


# ── Touches: every committed file that names an affected id ──────────────────────────────────────────────────────

def scan_files(ids, producers):
    pats = {i: '"' + i + '"' for i in ids}
    found = defaultdict(dict)
    cands = []
    for base in ("kb", "kb/reference", "kb/status", "prototype", "."):
        d = os.path.join(ROOT, base)
        for f in sorted(os.listdir(d)):
            if not (f.endswith(".json") or (base == "." and f.endswith(".js"))):
                continue
            cands.append(os.path.normpath(os.path.join(base, f)))
    for rel in cands:
        if any(s in rel for s in SCAN_SKIP_DIRS):
            continue
        p = os.path.join(ROOT, rel)
        if os.path.getsize(p) > SCAN_MAX_BYTES:
            continue
        with open(p, encoding="utf-8", errors="replace") as fh:
            txt = fh.read()
        for i, pat in pats.items():
            n = txt.count(pat)
            if n:
                found[i][rel] = n
    out = {}
    for i, files in found.items():
        out[i] = [{"file": f, "occurrences": n, "written_by": producers.get(f, "not in the dependency map")}
                  for f, n in sorted(files.items())]
    return out


def producers_of():
    d = jload("kb/dependency_map.json").get("datasets", {})
    out = {}
    for k, v in d.items():
        if not k.startswith("file:"):
            continue
        pr = v.get("producers") or []
        out[k[5:]] = ", ".join(sorted({p.get("by", "") for p in pr})) or "no producer (stored)"
    return out


# ── Honors measurement ───────────────────────────────────────────────────────────────────────────────────────────

def measure_honors(w):
    by_college = defaultdict(list)
    for ident, rows in w.members.items():
        for r in rows:
            by_college[r["college"]].append({"college": r["college"], "code": r["code"], "title": r["title"],
                                             "identity": ident, "units": r["units"]})
    rows_out, counts = [], Counter()
    code_only = 0
    new_by_ident = defaultdict(list)
    xlist = Counter((r["college"], " ".join(_words(r["title"]))) for rs in by_college.values() for r in rs
                    if is_honors(r["title"], r["code"])[0] == "honors")
    for college, rs in by_college.items():
        for r in rs:
            kind, why = is_honors(r["title"], r["code"])
            if kind is None:
                if HONORS_NUM.search(" ".join((r["code"] or "").split()).upper()):
                    code_only += 1
                continue
            rec = {"identity": r["identity"], "id_system": w.id_system(r["identity"]),
                   "discipline": w.discipline(r["identity"]), "college": college, "code": r["code"],
                   "title": r["title"], "units": r["units"], "kind": kind,
                   "district": w.voice(college),
                   "cross_listed": xlist[(college, " ".join(_words(r["title"])))] > 1}
            if kind == "program":
                rec["fate"] = "honors-program course: keeps its identity, no base, no equivalence"
                counts["program"] += 1
                rows_out.append(rec)
                continue
            counts["honors"] += 1
            base, how = find_base(r, rs)
            if base is None:
                rec["fate"] = "no base at the college: " + how
                counts["no_base" if how.startswith("no base") else "ambiguous_or_untitled"] += 1
            else:
                rec.update({"base_code": base["code"], "base_title": base["title"], "base_identity": base["identity"],
                            "base_found_by": how, "base_units": base["units"]})
                if base["identity"] == r["identity"]:
                    rec["fate"] = "shares its base's identity: leaves for the identity's Honors M-ID"
                    counts["shares_base_identity"] += 1
                    new_by_ident[r["identity"]].append(rec)
                else:
                    rec["fate"] = "already apart from its base: needs only the declared equivalence"
                    counts["apart_from_base"] += 1
            rows_out.append(rec)
    all_honors = []
    for ident, rows in w.members.items():
        ks = [is_honors(r["title"], r["code"])[0] for r in rows]
        if rows and all(k == "honors" for k in ks):
            all_honors.append(ident)
    new_ids = []
    for ident, recs in sorted(new_by_ident.items()):
        us = sorted({x["units"] for x in recs if isinstance(x["units"], (int, float))})
        new_ids.append({"from_identity": ident, "id_system": w.id_system(ident), "discipline": w.discipline(ident),
                        "honors_members": len(recs), "colleges": len({x["college"] for x in recs}),
                        "districts": len({x["district"] for x in recs}),
                        "units": [us[0], us[-1]] if us else None,
                        "shape": "corroborated (2+ colleges)" if len({x["college"] for x in recs}) > 1
                        else "stand-alone (1 college)"})
    official_prov = Counter()
    for ident, recs in new_by_ident.items():
        if w.id_system(ident) in ("C-ID", "CCN-ID"):
            for x in recs:
                p = w.provenance(ident, x["college"], x["code"])
                x["sits_by"] = p.get("sits_by", p.get("finding"))
                official_prov[x["sits_by"]] += 1
    pairs = Counter((r["identity"], r["base_identity"]) for r in rows_out
                    if r.get("base_identity") and r["base_identity"] != r["identity"])
    by_disc = Counter()
    by_disc_official = Counter()
    for n in new_ids:
        if n["id_system"] in ("C-ID", "CCN-ID"):
            by_disc_official[n["from_identity"].split(" ")[0]] += 1
        else:
            by_disc[n["discipline"]] += 1
    summary = {
        "honors_rows": counts["honors"], "honors_program_rows": counts["program"],
        "code_H_without_the_word_not_counted": code_only,
        "shares_base_identity": counts["shares_base_identity"],
        "apart_from_base": counts["apart_from_base"],
        "no_base_at_college": counts["no_base"], "ambiguous_or_untitled": counts["ambiguous_or_untitled"],
        "cross_listed_rows": sum(1 for r in rows_out if r.get("cross_listed")),
        "identities_all_honors": len(all_honors),
        "new_mids_if_ruled": len(new_ids),
        "new_mids_from_m_ids": sum(1 for n in new_ids if n["id_system"] not in ("C-ID", "CCN-ID")),
        "new_mids_from_official_ids": sum(1 for n in new_ids if n["id_system"] in ("C-ID", "CCN-ID")),
        "honors_rows_leaving_official_ids": sum(n["honors_members"] for n in new_ids
                                                if n["id_system"] in ("C-ID", "CCN-ID")),
        "honors_rows_under_official_ids_by_why_they_sit_there": dict(official_prov.most_common()),
        "equivalence_pairs_already_apart": len(pairs),
        "honors_rows_leaving_m_ids": sum(n["honors_members"] for n in new_ids
                                         if n["id_system"] not in ("C-ID", "CCN-ID")),
        "new_mid_shape": dict(Counter(n["shape"] for n in new_ids)),
        "new_mids_by_discipline_m_id": dict(by_disc.most_common()),
        "new_mids_by_official_subject": dict(by_disc_official.most_common()),
        "new_mids_one_district": sum(1 for n in new_ids if n["colleges"] > 1 and n["districts"] == 1),
        "ccn_honors_identities": sorted(i for i in w.members if w.id_system(i) == "CCN-ID" and i.endswith("H")),
    }
    return summary, new_ids, rows_out, all_honors


# ── The plan ─────────────────────────────────────────────────────────────────────────────────────────────────────

def build(raw=None, today=None):
    import _authority_recode_dryrun as rec
    w = World(raw)
    report = jload(REPORT_JSON)
    used = set(w.cat) | set(w.sg) | set(w.cur) | set(w.members)
    import alias_chain
    for p in alias_chain.ALIAS_MAPS:
        m = alias_chain.load_alias(p)
        used |= set(m)
        used |= {alias_chain.step(v) for v in m.values() if alias_chain.step(v)}
    alloc = rec.Allocator(used, {})
    cases = [plan_case(w, c, report, alloc) for c in CASES]
    for c in cases:
        c["ready"] = not c["blockers"]
    affected = sorted({i for c in cases for i in c["identities"]} |
                      {m["target_id"] for c in cases for m in c.get("moves", []) if m.get("target_id")})
    touches = scan_files([i for c in cases for i in c["identities"]], producers_of())
    # kb_curation rows the plan reads: on an affected id, pointing at one, or a CN: row for a moved member.
    cns = sorted({m["control_number"] for c in cases for m in c.get("moves", []) if m.get("control_number")})
    ids = sorted({i for c in cases for i in c["identities"]})
    cur_rows = {k: v for k, v in w.cur.items() if k in ids or k in {"CN:" + c for c in cns}}
    cur_pointing = sorted(k for k, v in w.merge_into.items() if v in ids)
    humans = Counter((w.cur[k].get("reviewed_by") or "") for k in cur_pointing)
    honors_summary, honors_new, honors_rows, all_honors = measure_honors(w)
    plan = {
        "_about": ("S648 dry run for the six re-clustering cases and the Honors rule. Written by "
                   "kb/_reclustering_s648_dryrun.py. Nothing here is applied: no kb file, generated file or "
                   "Supabase row was written. Proposed new ids are allocated against every id ever minted and are "
                   "re-allocated at apply against a fresh reserved set."),
        "date": today or date.today().isoformat(),
        "rulings": RULINGS,
        "alias_chain": {"baseline": w.newest_map, "pending_maps": w.pending_maps,
                        "note": "the ids were named after the newest applied map; each resolves to itself"},
        "inputs": {"members": f"unified_courses_members.js (generated {w.members_at})",
                   "curation_overlay_synced_at": w.cur_synced, "districts": w.districts_from,
                   "report": REPORT_JSON},
        "cases": cases,
        "affected_ids": affected,
        "id_keyed_touches": touches,
        "curation_overlay": {"rows_on_affected_keys": cur_rows, "pointers_into_affected": len(cur_pointing),
                             "pointers_into_affected_by_reviewer": dict(humans)},
        "kb_curation_selects": selects(w, cases),
        "honors": {"rule": honors_rule_text(), "summary": honors_summary, "new_mids": honors_new,
                   "identities_all_honors": all_honors, "questions_for_a_person": honors_questions(honors_summary)},
        "apply_sequence": apply_sequence(),
    }
    return plan, honors_rows


def honors_rule_text():
    return {
        "marks_honors": "the word Honors (or Honor) in the title, as a whole word. A code ending in H corroborates "
                        "and finds the base, and never marks a course alone.",
        "honors_program_courses": "a title naming only the honors program (Colloquium, Forum, Seminar, Society) has "
                                  "no base: it keeps its own identity and declares nothing.",
        "base_course": "the same college's course whose code is the honors code with its H removed and whose title "
                       "agrees once Honors is struck (stem overlap 0.5); else the one course at that college "
                       "whose title equals the honors title with Honors struck. Never itself Honors.",
        "new_identity": "the Honors members of one identity whose bases sit in that identity leave it together for "
                        "one new Honors M-ID under the same discipline's canonical code; corroborated shape at two "
                        "or more colleges, stand-alone at one.",
        "equivalence": "stored as a kb_curation row (honors_id, field 'honors_of', value base identity), the "
                       "field kb/_apply_curation.py must first learn (FIELDS), mirrored to kb/coci_curation.json; "
                       "an id-keyed value that the alias chain and supabase-rekey.yml re-key at every later apply.",
        "units": "units never split an identity: the Honors M-ID shows the range of what it joins; a unit "
                 "difference between an Honors course and its base is shown and decides nothing.",
        "district_guard": "the rule is structural (title and code), so it needs no outcome vote; where outcome "
                          "text is offered as evidence of equivalence, a pair inside one district is one voice "
                          "(RCCD's BIO 1 and BIO 1H share one outline).",
        "top": "TOP is read by nothing.",
    }


def honors_questions(s):
    return [
        f"Honors courses that share an official C-ID or CCN with their base ({s['honors_rows_leaving_official_ids']} "
        f"rows across {s['new_mids_from_official_ids']} official identities; why each sits there: "
        f"{s['honors_rows_under_official_ids_by_why_they_sit_there']}; Santa Ana CJ 109H claims AJ 160 in COCI). "
        "Does the ruling pull a course its college filed under a C-ID out to a new M-ID, or does an official id "
        "keep its Honors sections, with the rule applied to M-IDs only?",
        "Is the declared equivalence one-way (Honors satisfies the base) or both ways (either satisfies the other)?",
        "A code ending in H without the word Honors in the title: never Honors (this plan), or Honors where the "
        "college says so?",
        f"An Honors course with no base at its college ({s['no_base_at_college']} rows): its own Honors M-ID with an "
        "equivalence to the identity its title names statewide, or left where it is?",
        f"New Honors M-IDs whose colleges are all one district ({s['new_mids_one_district']}): corroborated "
        "numbering (by colleges, the numbering rule) or stand-alone (by voices, the district guard)?",
        f"The Common Course Numbers already give Honors its own id with an H suffix ({len(s['ccn_honors_identities'])} "
        "in the live set, such as PSYC C1000H beside PSYC C1000). Does a new Honors M-ID take its base's number plus "
        "H the same way (MATH M1036H), which breaks the four-character M-ID shape, or the next free number in its "
        "bucket with the equivalence alone linking it?",
    ]


READY_CASES = (2,)  # the conductor, 2026-11-13: case 2 alone (4: a mis-filed articulation; 6: needs Sam)


def selects(w, cases):
    """The pre-apply SELECTs for the one merge this apply writes (case 2), aggregates only, each with what the
    committed overlay says to expect, and one after. Run them immediately before the .apply push (Rule 10a)."""
    (c,) = [c for c in cases if c["n"] in READY_CASES and c["ready"]]
    src, surv = c["folds"], c["survivor"]
    q = lambda x: "'" + x.replace("'", "''") + "'"
    bot = lambda who: str(who or "").endswith("@bot")
    by_field = Counter()
    for k in (src, surv):
        for f in (w.cur.get(k) or {}):
            if f not in ("reviewed_by", "reviewed_at"):
                by_field[(k, f, bot(w.cur[k].get("reviewed_by")))] += 1
    ptr = sorted(k for k, v in w.merge_into.items() if v == src)
    dismissed = sum(1 for k, v in w.cur.items() if v.get("merge_dismissed")
                    and (src in str(v["merge_dismissed"]) or surv in str(v["merge_dismissed"])))
    return {
        "pre": [
            {"sql": f"select course_id, field, (reviewer_email like '%@bot') as bot, count(*) from public.kb_curation "
                    f"where course_id in ({q(src)}, {q(surv)}) group by 1, 2, 3 order by 1, 2, 3;",
             "expect": {f"{k} | {f} | {'bot' if b else 'person'}": n for (k, f, b), n in sorted(by_field.items())},
             "if_different": f"a row a person or procedure saved on {src} or {surv} since the overlay sync: read it "
                             "before applying, and a merge_into row on either holds the apply"},
            {"sql": f"select count(*) from public.kb_curation where field = 'merge_into' and course_id = {q(src)};",
             "expect": 0,
             "if_different": f"{src} already folds somewhere: the INSERT would be skipped; hold"},
            {"sql": f"select course_id, (reviewer_email like '%@bot') as bot from public.kb_curation "
                    f"where field = 'merge_into' and value = {q(src)} order by 1;",
             "expect": [[k, bot(w.cur[k].get("reviewed_by"))] for k in ptr],
             "if_different": f"another pointer into {src}: it follows the fold to {surv} too; read it before applying"},
            {"sql": f"select count(*) from public.kb_curation where field = 'merge_dismissed' "
                    f"and (value like {q('%' + src + '%')} or value like {q('%' + surv + '%')});",
             "expect": dismissed,
             "if_different": "a person chose 'Keep as-is' on a group naming one of the two: their choice wins; hold"},
            {"sql": f"select count(*) from public.kb_curation where reviewer_email = '{COHORT}';",
             "expect": 0,
             "if_different": "the cohort already wrote (P0): read its rows before anything else"},
        ],
        "dropped": ("unified_title_merge_confirm is not read: credential_reference.js writes those rows under "
                    "_CREDENTIAL_REVIEW::<unified title> keys for credential renames, so a course id never "
                    "appears there and the read returns 0 by construction"),
        "post": {"sql": f"select course_id, field, value from public.kb_curation where reviewer_email = '{COHORT}' "
                        "order by 1;",
                 "expect": [list(r) for r in _cohort_rows(cases)],
                 "if_different": "no row: the slot was taken and the INSERT skipped; nothing landed, nothing to undo"},
    }


def _cohort_rows(cases):
    out = []
    for c in sorted(cases, key=lambda c: c["n"]):
        if c["n"] not in READY_CASES or not c["ready"]:
            continue
        if c["op"] == "merge":
            out.append((c["folds"], "merge_into", c["survivor"]))
    return sorted(out)


def apply_sequence():
    mig = "kb/migrations/2026-11-13_s648_reclustering_cohort.sql"
    rb = "kb/migrations/2026-11-13_s648_reclustering_cohort_rollback.sql"
    return [
        {"step": "i", "when": "a window clear of 06:17, 09:17 and 12:17 UTC; steps i to iv within minutes of each "
                              "other, and no merge stands between the read and the write",
         "what": "the conductor runs the five pre-apply SELECTs (Supabase MCP), each against its expected result",
         "receipt": "kb/reclustering_s648_out/2026-11-13/fresh_read.json (the five results, with the time)",
         "undo": "nothing written"},
        {"step": "ii", "what": f"within minutes, on this branch, set kb/migrations/.apply to file={mig} and "
                               "name=s648_reclustering_cohort, commit, push. supabase-migrate.yml applies the file "
                               "on that claude/** push; it needs nothing on main",
         "receipt": "the push", "undo": f"set .apply to file={rb}, name=s648_reclustering_cohort_rollback, push"},
        {"step": "iii", "what": "the runner commits its receipt to the branch: "
                                "kb/receipts/migration_s648_reclustering_cohort_<run>.json, whose response holds the "
                                "RETURNING row",
         "receipt": "that file", "undo": "the rollback names the one row; its own receipt lands beside it"},
        {"step": "iv", "what": "the post-apply SELECT, against its expected result",
         "receipt": "kb/reclustering_s648_out/2026-11-13/post_read.json", "undo": "-"},
        {"step": "v", "what": "the PR merges on a green test (code, plan, migration pair, .apply, receipts)",
         "receipt": "the merge commit", "undo": "git revert (the data row is undone by step ii's undo)"},
        {"step": "vi", "what": "dispatch daily-dashboard.yml once: kb/_apply_curation.py folds the row into "
                               "kb/coci_curation.json and the export rebuilds; read the members file against "
                               "post_apply_simulated.json",
         "receipt": "the runner's commit", "undo": "step ii's undo, then one more dispatch"},
    ]


def sim_section(md_path):
    """The locally simulated post-apply state, when post_apply_simulated.json sits beside the plan."""
    p = os.path.join(os.path.dirname(md_path), "post_apply_simulated.json")
    if not os.path.exists(p):
        return []
    with open(p, encoding="utf-8") as f:
        sim = json.load(f)
    L = ["## After the apply, simulated", "", sim["how"], ""]
    for r in sim["identities"]:
        a, b = r["after"], r["before"]
        shown = (f"shown as {a['id_system']} *{a['title']}*" if a["in_browser_row"] else "no row of its own (folded)")
        L.append(f"- `{r['id']}`: members {b['members']} to {a['members']}, units {b['units']} to {a['units']}; {shown}.")
    L += [""] + [f"- {n}" for n in sim.get("display_notes", [])]
    L += ["", "Committed files the nightly build changes: " + "; ".join(sim["files_changed"]) + ".", "",
          "Tests: " + sim["tests"], ""]
    return L


def sheet_section(plan):
    by = {c["n"]: c for c in plan["cases"]}
    h = plan["honors"]["summary"]
    why = h["honors_rows_under_official_ids_by_why_they_sit_there"]
    m1 = {m["college"]: m for m in by[1]["moves"]}
    m5 = by[5]["moves"][0]
    return [
        "## For the sheet", "",
        "Six questions for Sam. Case 2 goes forward on his ruling.", "",
        "**1. Honors under an official C-ID or CCN.** He ruled that an Honors course gets its own M-ID with a declared "
        f"equivalence to its base. Of the {h['shares_base_identity']} Honors courses that share an identity with their "
        f"base, {h['honors_rows_leaving_official_ids']} sit under {h['new_mids_from_official_ids']} official C-ID or "
        f"CCN identities ({why.get('coci_cid_claim', 0)} because the college entered that C-ID in COCI, "
        f"{why.get('asccc_approval', 0)} by an ASCCC approval) and {h['honors_rows_leaving_m_ids']} share an M-ID. "
        f"Another {h['equivalence_pairs_already_apart']} Honors and base pairs already sit apart and need only the "
        f"equivalence. Options: (a) the rule for M-IDs only, {h['new_mids_from_m_ids']} new M-IDs and the equivalence "
        f"for every pair; (b) Honors also leaves official ids, {h['new_mids_if_ruled']} new M-IDs, against the "
        "colleges' own C-ID entries. Recommended: (a). C-ID and CCN already decide Honors for their own courses "
        f"(CCN gives Honors its own number, {len(h['ccn_honors_identities'])} such as PSYC C1000H), and an official "
        "id is never re-keyed.", "",
        "**2. AJ 160: move two courses out of the C-ID?** Modesto ADJU 205 *Community Relations* is entered as AJ 160 "
        "in COCI, and Golden West CJ G137 *Community Relations And Special Issues In Criminal Justice* holds an "
        f"ASCCC approval for AJ 160 ({m1['Golden West College']['asccc_approvals'][0]['disposition']}). Only the "
        "outcome scores separate them, at partial confidence, and neither meets the four signals a C-ID claim hold "
        "needs. Options: (a) keep both under AJ 160; (b) move them out against the entry and the approval. "
        "Recommended: (a).", "",
        f"**3. MUS 130: move San Diego Mesa {m5['code']} out?** *{m5['title']}* holds an ASCCC approval for MUS 130 "
        "and carries the C-ID's title. Its outline reads differently because San Diego Mesa writes each outcome as an "
        "institutional skill, and word overlap cannot see past the phrasing. Options: (a) keep it under MUS 130; "
        "(b) move it out against the approval. Recommended: (a).", "",
        "**4. REAL M1038 with REAL M1040: merge?** The report merges them only if students do not take both. Both "
        "records say the course is required for the California real estate salesperson license, which asks for Real "
        "Estate Principles and Real Estate Practice as two courses. Options: (a) keep them apart; (b) merge into "
        "REAL M1040 (units 0 to 4). Recommended: (a).", "",
    ] + _sheet_case4(by[4]) + _sheet_case6(by[6])


def _sheet_case6(c):
    held = [m for m in c.get("moves") or [] if m["held"] and m.get("sits_by") not in ("coci_cid_claim", "asccc_approval")]
    if not held:
        return []
    m = held[0]
    f = m["target_id"]
    lf = m["leaf_facts"][f]
    return [
        f"**6. Needs your word: remove one row the title-matching bot saved.** The row is ({f}, merge_into, "
        f"BUSI M1228), saved by {lf['merge_into_by']} at {lf['merge_into_at'][:16].replace('T', ' ')}Z. Removing it "
        f"carries out your split of BUSI M1228: {m['college']} {m['code']} *{m['title']}* returns to its own "
        f"record {f}, and the row's before-value goes into the receipt so a re-insert undoes it. The insert-only "
        f"route leaves {f} folded into BUSI M1228, so BUSI M1228 keeps the course's title, count and aggregates, "
        "and a second record is minted beside the first. Options: (a) remove the row; (b) the insert-only route; "
        "(c) leave the course in BUSI M1228. Recommended: (a).", "",
    ]


def _sheet_case4(c):
    sus = [x for x in c.get("inherited_articulations") or [] if x["suspect"]]
    if not sus:
        return []
    x = sus[0]
    return [
        "**5. MATH M1044 into MATH M1036: merge once the mis-filed articulation is settled?** The outcomes say "
        "*College and Matrix Algebra* (San Diego Mesa, Miramar and City, one district) repeats *College Algebra*. "
        f"MATH M1044 carries exhibit {x['exhibit_id']}, *{x['exhibit_title']}*, unified under the title "
        f"*{x['unified_title']}* though its credit recommendation reads '{x['credit_recommendation']}'; that title "
        f"totals {x['eligible_credits']:,.0f} eligible credits and {x['students']} students, so the merge would move "
        "College Algebra's eligible credits from 19 to 4,866. Options: (a) re-title the exhibit on the Exhibit "
        "Reference by its credit recommendation first, then merge; (b) merge now and carry the figure; (c) keep "
        "the two apart. Recommended: (a).", "",
    ]


def write_md(plan, path):
    L = [f"# Re-clustering, the six cases and the Honors rule: dry-run plan ({plan['date']})", "",
         "Written by `kb/_reclustering_s648_dryrun.py`. Nothing was applied. Every count and id is in `plan.json` "
         "beside this file; every Honors row the rule reads is in `honors_worklist.json`.", "",
         f"Rulings: {RULINGS['six']['memory']} ({RULINGS['six']['where']}, {RULINGS['six']['at']}) and "
         f"{RULINGS['honors']['memory']} ({RULINGS['honors']['where']}, {RULINGS['honors']['at']}).", "",
         f"Alias chain: baseline `{plan['alias_chain']['baseline']}`, {len(plan['alias_chain']['pending_maps'])} "
         "maps pending, every named id resolves to itself and is live. Members file: "
         f"{plan['inputs']['members']}; curation overlay synced {plan['inputs']['curation_overlay_synced_at']}.", "",
         "DECIDED (the S648 conductor, 2026-11-13, on #3245, after its review): this apply is case 2 alone, one "
         "row. Held: cases 1, 3 and 5 (for Sam); case 4 until its mis-filed articulation is settled; case 6 until "
         "Sam allows removing one row the title-matching bot saved (the insert-only route leaves residue). Nothing "
         "is minted for Honors.", "",
         "## The six", ""]
    for c in plan["cases"]:
        ids = ", ".join(c["identities"])
        L.append(f"### {c['n']}. {c['op']}: {ids} ({'ready' if c['ready'] else 'held'})")
        L.append("")
        L.append(f"Report: {c['report_says']}")
        L.append("")
        for i, f in c["identities"].items():
            L.append(f"- `{i}` ({f['id_system']}, {f['discipline']}): {f['title']}; {f['members']} members, "
                     f"{f['colleges']} colleges, {f['districts']} districts, units {f['units']}; "
                     f"{len(f['pointed_at_by'])} curation pointers fold into it; own curation row: "
                     f"{'yes' if f['curation'] else 'none'}.")
        if c["op"] == "split":
            for g in c["groups"]:
                L.append(f"- group *{g['title']}* ({g['districts']} districts, {len(g['members'])} members with text, "
                         f"{g['members_carrying_its_title']} of the identity's members carry its title): "
                         f"{'stays' if g['stays'] else 'moves'}")
            for m in c["moves"]:
                L.append(f"- moves: {m['college']} {m['code']} *{m.get('title')}* (control {m.get('control_number')}, "
                         f"units {m.get('units')}, COCI C-ID {m.get('coci_cid') or 'none'}, ASCCC approvals "
                         f"{[a['cid'] + ' ' + a['disposition'] for a in m.get('asccc_approvals') or []] or 'none'}, "
                         f"sits by {m.get('sits_by')}, own leaf {m.get('leaf_ids') or 'none'}) to "
                         f"{m.get('target_id') or '-'} ({m['to']}). {'HELD. ' if m['held'] else ''}{m['mechanism']}.")
            L.append(f"- stays: {c['stays_count']} members.")
        else:
            L.append(f"- operation: `{c['folds']}` folds into `{c['survivor']}` ({c['survivor_why']}); units after "
                     f"{c['unit_range_after']}; districts {c['districts']}.")
            L.append(f"- folded members by why they sit there: {c['folded_members_by_provenance']}; their COCI "
                     f"C-ID claims: {c['folded_members_official_claims'] or 'none'}.")
            L.append(f"- mechanism: {c['mechanism']}.")
            new = [x for x in c.get("inherited_articulations") or [] if x["new_to_survivor"]]
            L.append(f"- articulations it carries: {len(c.get('inherited_articulations') or [])} records, "
                     f"{len({x['unified_title'] for x in new})} titles new to {c['survivor']}: "
                     + ("; ".join(sorted({f"*{x['unified_title']}* ({x['cpl_type']}, {x['eligible_credits']} eligible "
                                          f"credits, {x['students']} students, CR '{x['credit_recommendation']}'"
                                          + (", SUSPECT" if x["suspect"] else "") + ")" for x in new})) or "none")
                     + ".")
            for p in c.get("pointers_into_folded") or []:
                L.append(f"- a saved pointer into {c['folds']}: {p['row'][0]} ({p['course']}), by {p['reviewed_by']} "
                         f"at {p['reviewed_at']}: {p['fate']}.")
        L.append(f"- alias map: {c['alias_note']}.")
        for b in c["blockers"]:
            L.append(f"- BLOCKS: {b}.")
        for n in c["notes"]:
            L.append(f"- note: {n}.")
        L.append("")
    L += ["## Files that name an affected id", "",
          "Each id-keyed file, the occurrences, and its writer from `kb/dependency_map.json` (a file the daily "
          "build writes follows the overlay at the next run; a stored file moves only by an apply).", ""]
    for i, fs in sorted(plan["id_keyed_touches"].items()):
        L.append(f"- `{i}`: " + "; ".join(f"{x['file']} {x['occurrences']} ({x['written_by']})" for x in fs))
    L += ["", "## kb_curation (run these; this plan made no Supabase call)", ""]
    co = plan["curation_overlay"]
    L.append(f"This apply writes one row, case 2's. Across all six cases the committed overlay holds "
             f"{len(co['rows_on_affected_keys'])} rows keyed on an affected id and {co['pointers_into_affected']} "
             "merge_into pointers onto one (plan.json, curation_overlay); the reads below cover case 2 alone.")
    L.append("")
    sel = plan["kb_curation_selects"]
    L += ["Before the apply, five aggregates (expected from the committed overlay, which mirrors seven fields only):", ""]
    for k, s in enumerate(sel["pre"], 1):
        L += [f"{k}. Expect `{json.dumps(s['expect'])}`. If different: {s['if_different'].rstrip('.')}.", "", "```sql", s["sql"],
              "```", ""]
    L += [f"After the apply. Expect `{json.dumps(sel['post']['expect'])}`. If different: {sel['post']['if_different']}.",
          "", "```sql", sel["post"]["sql"], "```", "", f"Not read: {sel['dropped']}.", ""]
    L += sim_section(path)
    L += sheet_section(plan)
    h = plan["honors"]
    L += ["## The Honors rule", "",
          "Nothing is minted for Honors (the S648 conductor, 2026-11-13): whether an Honors course leaves a C-ID is "
          "Sam's call, on the sheet above. This branch holds the detection rule, its tests and the worklist.", ""]
    for k, v in h["rule"].items():
        L.append(f"- {k.replace('_', ' ')}: {v}")
    L += ["", "Measured on the members file:", ""]
    for k, v in h["summary"].items():
        L.append(f"- {k.replace('_', ' ')}: {v}")
    L += ["", "Questions only a person can rule:", ""]
    for q in h["questions_for_a_person"]:
        L.append(f"- {q}")
    L += ["", "## Apply sequence (after review)", "",
          "The order is merge-free: the migration applies on the branch push, so the fresh read sits "
          "immediately before that push, and the PR merges only after the write and its read-back (Rule 10a).", ""]
    for s in plan["apply_sequence"]:
        if "step" in s:
            L.append(f"({s['step']}) {s['what']}. Receipt: {s['receipt']}. Undo: {s['undo']}."
                     + (f" Window: {s['when']}." if s.get("when") else ""))
        else:
            L.append(f"Note: {s['note']}")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(L) + "\n")


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--selftest", action="store_true", help="print the Honors fixtures' results as JSON")
    ap.add_argument("--drop-gate", action="append", default=[], choices=GATES,
                    help="selftest only: run with one gate removed, to prove its fixture fails")
    ap.add_argument("--date", help="the output folder's date (default today)")
    a = ap.parse_args()
    if a.selftest:
        print(json.dumps({"gates": list(GATES), "results": selftest(tuple(a.drop_gate))}))
        return 0
    if a.drop_gate:
        ap.error("--drop-gate is for --selftest only")
    plan, rows = build(today=a.date)
    out = os.path.join(OUT_ROOT, plan["date"])
    os.makedirs(out, exist_ok=True)
    with open(os.path.join(out, "plan.json"), "w", encoding="utf-8") as f:
        json.dump(plan, f, indent=1, ensure_ascii=False, sort_keys=False)
        f.write("\n")
    with open(os.path.join(out, "honors_worklist.json"), "w", encoding="utf-8") as f:
        json.dump({"_about": "Every Honors row the S648 rule reads, with its base and fate. Nothing dropped.",
                   "rows": sorted(rows, key=lambda r: (r["identity"], r["college"], r["code"]))},
                  f, indent=0, ensure_ascii=False)
        f.write("\n")
    write_md(plan, os.path.join(out, "plan.md"))
    print(f"wrote {os.path.relpath(out, ROOT)}/plan.json, plan.md, honors_worklist.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""kb/_authority_recode_dryrun.py — the allocator on a synthetic fixture.

The rules the 2026-09-03 recode must keep, each a measured failure or a ruling:

  1. keep the number — THEA M1001 -> THTR M1001 (the POLS pattern, no re-sequence)
  2. no cascade — one taken key gap-fills ONE row, not every row after it
     (the first run shifted 554 Computer Science ids from one taken key)
  3. fan-in — Media Production never keeps a number FTVE already holds for Film
  4. ghosts — a key that exists only in the articulation identities map does
     not block (the S110 pre-fold ghosts kb/_pols_remint.py healed)
  5. the Z namespace moves with its M-IDs (THEA Z1001 -> THTR Z1001)
  6. item 10 — a ruled language takes the ruled code; a language whose dominant
     local code is another language's (Nahuatl's SPAN) keeps the CSR code; a
     language with no four-letter dominant code keeps the CSR code, flagged
  7. item 14 — two signals decide a family; TOP alone never does; viticulture
     stays residual; a residual row keeps its own discipline's code
  8. the plan tables are checked against the rulings record

Run from repo root: python3 tests/authority_recode_dryrun_test.py
"""
import importlib.util
import json
import os
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
spec = importlib.util.spec_from_file_location(
    "recode", os.path.join(ROOT, "kb", "_authority_recode_dryrun.py"))
recode = importlib.util.module_from_spec(spec)
spec.loader.exec_module(recode)

failures = []


def check(label, cond):
    print(("PASS  " if cond else "FAIL  ") + label)
    if not cond:
        failures.append(label)


def row(title, disc, subject=None, top=None):
    return {"common_title": title, "discipline": disc, "subject": subject, "top_code": top}


# ── fixture ────────────────────────────────────────────────────────────────
courses = {
    "THEA M1001": row("Acting I", "Drama/Theater Arts"),
    "THEA M1002": row("Stagecraft", "Drama/Theater Arts"),
    "CISC M1001": row("Programming I", "Computer Science"),
    "CISC M1002": row("Programming II", "Computer Science"),
    "CISC M1003": row("Data Structures", "Computer Science"),
    "COMP M1001": row("A stray already under COMP", "Computer Science"),
    "FIMS M1001": row("Film History", "Film and Media Studies"),
    "FIMP M1001": row("Video Production", "Media Production"),
    "FLSP M1001": row("Elementary Spanish I", "Foreign Languages", top="1105.00"),
    "FLNA M1001": row("Nahuatl I", "Foreign Languages"),
    "FLKO M1001": row("Elementary Korean", "Foreign Languages", top="1117.30"),
    "AGRI M1001": row("Introduction to Animal Science", "Agriculture"),
    "AGRI M1002": row("Agriculture Orientation", "Agriculture"),
    "AGRI M1003": row("Agricultural Leadership", "Agriculture"),
    "AGRI M1004": row("Introduction to Viticulture", "Agriculture"),
    "AGPR M1001": row("Farm Records", "Agricultural Production"),
    "MATH M1001": row("Calculus", "Mathematics"),
}
singletons = {
    "THEA M10AA": row("Puppetry", "Drama/Theater Arts"),
    "FLSP M10AA": row("Spanish for Nurses", "Foreign Languages", subject="SPAN", top="1105.00"),
    "AGRI M10AA": row("Tractor Operation", "Agriculture", subject="AGME", top="0116.00"),
}
memberships = {
    "THEA M1001": [{"subject": "THEA"}], "THEA M1002": [{"subject": "THEA"}],
    "CISC M1001": [{"subject": "CS"}], "CISC M1002": [{"subject": "CS"}], "CISC M1003": [{"subject": "CS"}],
    "COMP M1001": [{"subject": "COMP"}],
    "FIMS M1001": [{"subject": "FILM"}], "FIMP M1001": [{"subject": "MEDIA"}],
    "FLSP M1001": [{"subject": "SPAN", "top_code": "1105.00"}, {"subject": "SPAN", "top_code": "1105.00"}],
    "FLNA M1001": [{"subject": "SPAN"}, {"subject": "SPAN"}],
    "FLKO M1001": [{"subject": "KOREAN", "top_code": "1117.30"}, {"subject": "KOR", "top_code": "1117.30"}],
    # subject family + TOP agree -> AS
    "AGRI M1001": [{"subject": "ANSC", "top_code": "0102.00"}],
    # TOP alone -> stays residual
    "AGRI M1002": [{"subject": "AG", "top_code": "0103.00"}],
    # title + subject agree -> AB
    "AGRI M1003": [{"subject": "AGAB", "top_code": "0101.00"}],
    # viticulture: subject + TOP agree but no C-ID family -> residual, flagged
    "AGRI M1004": [{"subject": "VWT", "top_code": "0104.00"}],
    # title + TOP agree -> AB, on the OTHER agriculture discipline
    "AGPR M1001": [{"subject": "AGR", "top_code": "0112.00"}],
    "MATH M1001": [{"subject": "MATH"}],
}
curations = {
    "THEA Z1001": {"unified_title": "Acting cluster"},
    "THEA M1002": {"merge_into": "THEA Z1001"},
    "AGRI Z1001": {"unified_title": "Animal cluster"},
    "AGRI M1001": {"merge_into": "AGRI Z1001"},
}
identities = {"THTR M1001": {"discipline": "Drama/Theater Arts"},   # a pre-fold ghost at the destination
              "THEA M1001": {"discipline": "Drama/Theater Arts"}}
canon_doc = {"disciplines": {d: {"canonical_subj4": c} for d, c in [
    ("Drama/Theater Arts", "THEA"), ("Computer Science", "CISC"), ("Film and Media Studies", "FIMS"),
    ("Media Production", "FIMP"), ("Foreign Languages", "FLNG"), ("Agriculture", "AGRI"),
    ("Agricultural Production", "AGPR"), ("Mathematics", "MATH"),
    ("Child Development/Early Childhood Education", "ECED"), ("Computer Information Systems", "CSIS"),
    ("Office Technologies", "OTEC")]}}
fl_doc = {"languages": {
    "Spanish": {"subj4": "FLSP", "top": ["1105.00"], "subjects": ["SPAN"], "title": ["spanish"]},
    "Korean": {"subj4": "FLKO", "top": ["1117.30"], "subjects": ["KOR", "KOREAN"], "title": ["korean"]},
    "Nahuatl": {"subj4": "FLNA", "top": [], "subjects": [], "title": ["nahuatl"]},
}, "residual_subj4": "FLNG"}
rulings = json.load(open(os.path.join(ROOT, "kb", "csr_authority_codes_rulings_2026-09-03.json"), encoding="utf-8"))


class FLDry:
    """The June classifier's two entry points, on this fixture's file."""
    def __init__(self, doc):
        self.top = {t: l for l, d in doc["languages"].items() for t in d["top"]}
        self.subj = {s: l for l, d in doc["languages"].items() for s in d["subjects"]}
        self.title = {l: d["title"] for l, d in doc["languages"].items()}

    def _title(self, t):
        t = (t or "").lower()
        return next((l for l, kws in self.title.items() if any(k in t for k in kws)), None)

    def classify_mid(self, mid, rec):
        tv = Counter(self.top.get(str(m.get("top_code") or "")[:7]) for m in memberships.get(mid, []))
        tv.pop(None, None)
        if tv:
            return tv.most_common(1)[0][0], "member_top"
        lt = self._title(rec.get("common_title"))
        if lt:
            return lt, "title"
        sv = Counter(self.subj.get((m.get("subject") or "").upper()) for m in memberships.get(mid, []))
        sv.pop(None, None)
        return (sv.most_common(1)[0][0], "member_subject") if sv else (None, "residual")

    def classify_singleton(self, rec):
        lt = self.top.get(str(rec.get("top_code") or "")[:7])
        if lt:
            return lt, "top"
        lt = self._title(rec.get("common_title"))
        return (lt, "title") if lt else (None, "residual")


plan = recode.compute_plan(courses, singletons, memberships, curations, identities, canon_doc,
                           fl_doc, rulings, reservations={}, fldry=FLDry(fl_doc))
A = plan["alias"]
M = plan["moves"]

check("8. the plan tables agree with the rulings record", plan["problems"] == [])
check("1. keep the number: THEA M1001 -> THTR M1001, the singleton too",
      A.get("THEA M1001") == "THTR M1001" and A.get("THEA M10AA") == "THTR M10AA")
check("4. a ghost at the destination does not block (THTR M1001 exists only in identities)",
      M["THEA M1001"]["how"] == "kept number"
      and "THTR M1001" in plan["identities_ghosts"]["healed_by_this_recode"])
check("5. the Z namespace moves: THEA Z1001 -> THTR Z1001", A.get("THEA Z1001") == "THTR Z1001")
check("2. no cascade: the one taken key (COMP M1001) gap-fills one row; the rest keep their numbers",
      A.get("CISC M1002") == "COMP M1002" and A.get("CISC M1003") == "COMP M1003"
      and A.get("CISC M1001") not in ("COMP M1001", "COMP M1002", "COMP M1003")
      and M["CISC M1001"]["how"] == "gap-filled")
check("2. the gap-fill lands on the first free number after the stray and the kept ones",
      A.get("CISC M1001") == "COMP M1004")
check("3. fan-in: Film keeps FTVE M1001, Media Production gap-fills",
      A.get("FIMS M1001") == "FTVE M1001" and A.get("FIMP M1001") == "FTVE M1002"
      and M["FIMP M1001"]["kind"] == "fan-in")
check("the untouched discipline does not move", "MATH M1001" not in A and "COMP M1001" not in A)
fc = plan["fl_codes"]
check("6. Spanish takes SPAN as ruled; the rows move and keep their numbers",
      fc["Spanish"]["code"] == "SPAN" and A.get("FLSP M1001") == "SPAN M1001" and A.get("FLSP M10AA") == "SPAN M10AA")
check("6. Nahuatl keeps FLNA: its dominant local code is Spanish's",
      fc["Nahuatl"]["code"] == "FLNA" and "another language" in fc["Nahuatl"]["basis"] and "FLNA M1001" not in A)
check("6. Korean keeps FLKO as ruled, flagged", fc["Korean"]["code"] == "FLKO" and "flagged" in fc["Korean"]["basis"])
ag = plan["ag_class"]
check("7. subject + TOP agree -> AGAS (and the row keeps its number)",
      ag["AGRI M1001"]["family"] == "AS" and A.get("AGRI M1001") == "AGAS M1001")
check("7. TOP alone never decides: a TOP-only row stays residual with a proposal",
      ag["AGRI M1002"]["family"] is None and "proposed PS by top" in ag["AGRI M1002"]["why"] and "AGRI M1002" not in A)
check("7. title + subject agree -> AGAB", ag["AGRI M1003"]["family"] == "AB" and A.get("AGRI M1003") == "AGAB M1003")
check("7. viticulture with two agreeing signals stays residual, flagged",
      ag["AGRI M1004"]["family"] is None and ag["AGRI M1004"]["why"].startswith("viticulture") and "AGRI M1004" not in A)
check("7. title + TOP agree on the other agriculture discipline -> AGAB too",
      ag["AGPR M1001"]["family"] == "AB" and A.get("AGPR M1001") == "AGAB M1001"
      or ag["AGPR M1001"]["family"] == "AB" and A.get("AGPR M1001", "").startswith("AGAB M1"))
check("7. a singleton with subject + TOP -> AGMA, letters kept", A.get("AGRI M10AA") == "AGMA M10AA")
check("5. an agriculture Z target takes its members' modal family", A.get("AGRI Z1001") == "AGAS Z1001")
v = plan["validation"]
check("every gate passes on the fixture", all(x["pass"] for x in v.values()))
check("the alias is invertible and disjoint from untouched keys",
      len(set(A.values())) == len(A) and not (set(A.values()) & (set(courses) | set(singletons) | set(curations)) - set(A)))

print(f"\n{len(failures)} failure(s)")
sys.exit(1 if failures else 0)

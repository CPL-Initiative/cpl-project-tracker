#!/usr/bin/env python3
"""The title in use, and the Review proposal that follows it (Sam, in session, 2026-11-12).

Two rulings, verbatim:
  (1) "also think about how you could apply this to your intelligence moving forward...being able to suggest the best
      canonical title based on what's in use..." (cpl_memory `sam-classifier-suggests-title-in-use-2026-11-12`)
  (2) "The MID title works well for cx because those are single course exhibits...but many if not most industry certs
      like Firefighter 1, POST, Real Estate Sales, Comptia Network+ have several CRs and need a non-course based
      canonical title that best aligns with the official name of the cert or license or training program..."
      (`sam-cert-title-official-name-not-mid-2026-11-12`)

Guarded here:
  - kb/title_in_use.py gives every case in tests/fixtures/title_in_use_cases.json its expected answer and holds the
    fixture's constants (exhibits.js is pinned to the same file by tests/title_in_use_parity.test.js);
  - the builder (kb/_build_exhibits_review.py): American River's Firefighter Recruit Academy Certificate (SFT),
    proposed "Firefighter Academy" from M-ID FIRE M1219, proposes joining Firefighter 1, with its reason recorded;
    the three SFT Fire Academy variants never get Fire Inspector 1A; a single-CR credit-by-exam exhibit keeps its
    M-ID title; a multi-CR certification never takes one; a certification with nothing in use takes its cert_naming
    official name when its family is known, the catalog's spelling when the catalog lists it, else is flagged
    needs_official_name; TOP is never read.

Run from the repo root: python3 tests/title_in_use_test.py
"""
import importlib.util
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.environ.get("TITLE_IN_USE_DIR") or os.path.join(ROOT, "kb"))   # a fail-first run points it elsewhere
import title_in_use as T  # noqa: E402
sys.path.insert(1, os.path.join(ROOT, "kb"))

spec = importlib.util.spec_from_file_location("build_exhibits_review", os.environ.get("BUILD_EXHIBITS_REVIEW") or os.path.join(ROOT, "kb", "_build_exhibits_review.py"))
B = importlib.util.module_from_spec(spec)
spec.loader.exec_module(B)

results = []


def check(name, cond, detail=""):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + ((" — " + str(detail)) if (detail and not cond) else ""))


# ── 1. the rule, against the shared fixture ──
with open(os.path.join(ROOT, "tests", "fixtures", "title_in_use_cases.json"), encoding="utf-8") as f:
    FX = json.load(f)
C = FX["constants"]
check("the constants are the fixture's (POPULAR_MIN, STATEWIDE_LEAD, the local issuer)",
      (T.POPULAR_MIN, T.STATEWIDE_LEAD, T.LOCAL_ISSUER) == (C["popular_min"], C["statewide_lead"], C["local_issuer"]),
      (T.POPULAR_MIN, T.STATEWIDE_LEAD, T.LOCAL_ISSUER))
check("the stop words are the fixture's", sorted(T.STOP) == sorted(C["stop_words"]), sorted(set(T.STOP) ^ set(C["stop_words"])))
index = T.index_from_related(FX["related"])
statewide = set(FX["statewide"])
for case in FX["cases"]:
    try:
        if case.get("own_issuer"):
            got = T.in_use(index, statewide, case["title"], case["raw"], case["issuer"], own_issuer=True)
        else:
            got = T.in_use(index, statewide, case["title"], case["raw"], case["issuer"])
    except TypeError as e:
        got = {"kind": "error", "o": {"t": str(e)}}
    want = case["expect"]
    have = {"kind": got["kind"], "title": got["o"]["t"]} if got else None
    check("rule: " + case["why"], have == want, have)
    if case.get("expect_order"):
        rows = [x["o"]["t"] for x in T.related(index, case["title"], case["raw"], T.issuer_for(case["title"], case["issuer"]))["rows"]]
        check("order: " + case["why"], rows[:len(case["expect_order"])] == case["expect_order"], rows[:6])
check("level tokens: 1A, II as 2, Level 4, an ASE code names none",
      (T.level_tokens("Firefighter 1A"), T.level_tokens("Firefighter II"), T.level_tokens("Level 4"), T.level_tokens("ASE A5"))
      == ({"1A"}, {"2"}, {"4"}, set()) if hasattr(T, "level_tokens") else False)

# ── 2. the builder ──
SFT = "California State Fire Training (SFT)"
ASE = T.ASE_ISSUER
FIRE = "Firefighter Recruit Academy Certificate"
ACAD = ["Fire Academy", "Fire Academy Conditioning", "Kern County Fire Recruit Academy"]
CBE = "Credit by Exam - ACADEMIC PLANNING"
UNION = "Plumbers Pipefitters Union Steamfitter Apprenticeship Level 1"
P1 = "Noncredit for AUTO P1"
ELEV = "Elevators Training Center Apprenticeship Level 1"
WATCH = "Cisco CCNA exam evidence"
TOPCARD = "Welding Shop Practice by TOP"
AUTOCX = "Noncredit Course for AUTO A5"
AJ61 = "Industry Training Evidence for AJ 61"
FST1 = "Industry Training Evidence for FST 1"
CCC = "California Community Colleges"
SELFCARD = "FIRE 1 academy local, new"
UNKNOWN = "Some Exam With No Exhibit Record"


def need(raw, title, issuer, **kw):
    return dict({"raw_title": raw, "why": "the classifier is unsure (0.70)", "colleges": ["American River College"],
                 "proposal": {"title": title, "issuer": issuer, "confidence": 0.7}}, **kw)


FIX = {
    "kb/cer_procedures_out/latest.json": {"_generated_at": "2026-11-12T07:47:00Z", "needs_you": [
        need(FIRE, "Firefighter 1 Academy", SFT)] + [need("COBIx " + t, t, SFT) for t in ACAD] + [
        need(CBE, "Academic Planning Exam", "California Community Colleges"),
        need(UNION, "UA Steamfitter Apprenticeship — Level 1", "United Association (UA)"),
        need(P1, "Automotive Technology (ASE P1 Medium-Heavy Truck Parts Specialist certification)", "California Community Colleges"),
        need(ELEV, "Elevator Constructor Apprenticeship — Level 1", "National Elevator Industry Educational Program"),
        need(WATCH, "cisco ccna", "Cisco"),
        need(TOPCARD, "Welding Shop Practice", "California Community Colleges"),
        need(AUTOCX, "Brakes (ASE A5)", CCC), need(AJ61, "Administration of Justice (AJ 61)", CCC),
        need(FST1, "Principles of Emergency Services", CCC), need(SELFCARD, "Firefighter 1", SFT),
        need(UNKNOWN, "Some Exam Title", "Some Board")]},
    "kb/unclassified_suggestions.json": {"_generated_at": "2026-11-12T06:20:00Z", "aligned": {
        FIRE: {"kind": "mid", "id": "FIRE M1219", "title": "Firefighter Academy", "code": "FIRE 1500", "college": "American River College"},
        CBE: {"kind": "mid", "id": "COUN M1004", "title": "Academic Planning", "code": "COUN 1", "college": "Irvine Valley College"},
        UNION: {"kind": "mid", "id": "STMF M1010", "title": "Union Heritage", "code": "STMF 10", "college": "American River College"},
        ELEV: {"kind": "local", "id": "the course ELEVA 108", "title": "Advanced Topics in Elevators", "code": "ELEVA 108",
               "college": "American River College"},
        UNKNOWN: {"kind": "mid", "id": "XMPL M1000", "title": "Example Course", "code": "XMPL 1", "college": "Norco College"},
        AJ61: {"kind": "cid", "id": "AJ 124", "title": "Legal Aspects of Evidence", "code": "AJ 61", "college": "Cosumnes River College"}}},
    "kb/unified_titles.json": dict(
        [("FF1 local %d" % i, {"unified_title": "Firefighter 1"}) for i in range(11)]
        + [("FF1A local %d" % i, {"unified_title": "Firefighter 1A"}) for i in range(2)]
        + [("FF1 Academy local %d" % i, {"unified_title": "Firefighter 1 Academy"}) for i in range(2)]
        + [("FI1A local %d" % i, {"unified_title": "Fire Inspector 1A"}) for i in range(2)]
        + [("FI1B local %d" % i, {"unified_title": "Fire Inspector 1B"}) for i in range(2)]
        + [("ASE A5 local %d" % i, {"unified_title": "ASE A5 — Brakes"}) for i in range(14)]
        + [("PES local", {"unified_title": "Principles of Emergency Services"})]
        + [("PFES local %d" % i, {"unified_title": "Principles of Fire and Emergency Services Safety and Survival"}) for i in range(8)]),
    "kb/credentials.json": {
        "Firefighter 1": [{"issuing_agency": SFT}], "Firefighter 1A": [{"issuing_agency": SFT}],
        "Firefighter 1 Academy": [{"issuing_agency": SFT}], "Fire Inspector 1A": [{"issuing_agency": SFT}],
        "Fire Inspector 1B": [{"issuing_agency": SFT}], "ASE A5 — Brakes": [{"issuing_agency": ASE}],
        "Principles of Emergency Services": [{"issuing_agency": CCC}],
        "Principles of Fire and Emergency Services Safety and Survival": [{"issuing_agency": CCC}]},
    "kb/exhibit_audit/latest.json": {"generated_at": "2026-11-12T06:10:00Z", "title_cards": [
        {"raw_title": r, "unified_title": None, "tags": ["unclassified_in_map"]}
        for r in [FIRE, CBE, UNION, P1, ELEV, WATCH, TOPCARD, AUTOCX, AJ61, FST1, SELFCARD, UNKNOWN] + ["COBIx " + t for t in ACAD]]},
    "kb/it_ai_credential_catalog.json": {"credentials": [
        {"issuer": "Cisco", "name": "Cisco CCNA"},
        {"issuer": "National Elevator Industry Educational Program", "name": "Certified Elevator Technician"}]},
}
EX = [
    # Firefighter: an industry certification (MAPIC... id) with one CR, aligned to an M-ID: the M-ID is set aside.
    {"exhibit_ids": ["MAPICA-FRAC-1-001"], "raw_titles": [FIRE], "adopter_names": ["American River College"],
     "cpl_type": "Industry Certification", "credit_recs": [{"course": "FIRE 1500", "credit": "8 hours in Firefighter Academy"}]},
    # A single-CR credit by exam: the M-ID title stands.
    {"exhibit_ids": ["MAPCXS-CBE-19-1-001"], "raw_titles": [CBE], "adopter_names": ["Irvine Valley College"],
     "cpl_type": "Credit By Exam", "credit_recs": [{"course": "COUN 1", "credit": "1.5 hours in ACADEMIC PLANNING"}]},
    # A union apprenticeship with several CRs: never its M-ID's course title.
    {"exhibit_ids": ["MAPICI-UASA-1-001"], "raw_titles": [UNION], "adopter_names": ["American River College"],
     "cpl_type": "Industry Certification", "credit_recs": [{"course": "STMF 10", "credit": "1 hour in Union Heritage"},
                                                           {"course": "STMF 11", "credit": "3 hours in Steam Systems"},
                                                           {"course": "STMF 12", "credit": "3 hours in Piping"}]},
    {"exhibit_ids": ["MAPICI-P1-1-001"], "raw_titles": [P1], "adopter_names": ["Las Positas College"], "cpl_type": "Industry Certification",
     "credit_recs": [{"course": "AUTO 60", "credit": "3 hours"}, {"course": "AUTO 61", "credit": "2 hours"}]},
    {"exhibit_ids": ["MAPICI-ETC-1-001"], "raw_titles": [ELEV], "adopter_names": ["American River College"], "cpl_type": "Industry Certification",
     "credit_recs": [{"course": "ELEVA 108", "credit": "3 hours"}, {"course": "ELEVA 109", "credit": "3 hours"}]},
    {"exhibit_ids": ["MAPICI-CCNA-1-001"], "raw_titles": [WATCH], "adopter_names": ["Norco College"], "cpl_type": "Industry Certification",
     "credit_recs": [{"course": "CIS 81", "credit": "3 hours"}]},
    # TOP codes ride on every exhibit record; the proposal must not read them (Rule 7).
    {"exhibit_ids": ["MAPCXS-WSP-1-001"], "raw_titles": [TOPCARD], "adopter_names": ["Norco College"], "cpl_type": "Credit By Exam",
     "credit_recs": [{"course": "WELD 1", "credit": "3 hours"}], "top_codes": ["0956.50"]},
    # A college's noncredit course for an ASE test, credit by exam by its MAPCX id (the review of #3168, item 3).
    {"exhibit_ids": ["MAPCXN-NFAB-1-001"], "raw_titles": [AUTOCX], "adopter_names": ["Las Positas College"], "cpl_type": "Credit By Exam",
     "credit_recs": [{"course": "AUTO 905", "credit": "0 hours in Brakes"}]},
    # A college-issued industry-evidence exhibit: its C-ID course title stands (item 4).
    {"exhibit_ids": ["MAPICI-IFA61-1-001"], "raw_titles": [AJ61], "adopter_names": ["Cosumnes River College"], "cpl_type": "Industry Certification",
     "credit_recs": [{"course": "AJ 61", "credit": "3 hours in Evidence"}]},
    {"exhibit_ids": ["MAPICI-IFF1-1-001"], "raw_titles": [FST1], "adopter_names": ["Cosumnes River College"], "cpl_type": "Industry Certification",
     "credit_recs": [{"course": "FST 1", "credit": "3 hours"}]},
] + [{"exhibit_ids": ["MAPICA-FA%d-1-001" % i], "raw_titles": ["COBIx " + t], "adopter_names": ["Kern County"],
      "cpl_type": "Industry Certification", "credit_recs": []} for i, t in enumerate(ACAD)]
STATEWIDE = {"generated_at": "2026-11-12T06:00:00", "exhibits": EX}
RECS = {"Firefighter 1": [{"t": "3 hours", "id": "MAPICI-FF1-1-001"}], "Firefighter 1A": [], "Fire Inspector 1A": [],
        "Fire Inspector 1B": [], "ASE A5 — Brakes": []}


def write(root, rel, obj, js=None):
    path = os.path.join(root, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write("window.%s = %s;\n" % (js, json.dumps(obj)) if js else json.dumps(obj))


def build(fix=FIX, ex=EX):
    with tempfile.TemporaryDirectory() as root:
        for rel, obj in fix.items():
            write(root, rel, obj)
        write(root, "statewide_data.js", dict(STATEWIDE, exhibits=ex), js="CPL_STATEWIDE")
        write(root, "unified_courses_members.js", {"colleges": [], "members": {}}, js="CPL_UNIFIED_MEMBERS")
        write(root, "fact-sheet/statewide_recs.js", RECS, js="CPL_STATEWIDE_RECS")
        data = B.build(root)[0]
    return {h["raw"]: h for h in data["held"]}


held = build()
f = held[FIRE]
check("Firefighter Recruit Academy Certificate (SFT) proposes joining Firefighter 1",
      f["title"] == "Firefighter 1" and f["issuer"] == SFT, (f["title"], f["issuer"]))
check("its reason is recorded: in_use_statewide and the counts, so the card need not recompute",
      f["proposal_source"] == "in_use_statewide" and f["in_use"] == {"title": "Firefighter 1", "locals": 11, "adopted": 0}, f)
check("and the card's source line says it in words", f["from"] == "the statewide exhibit in use (11 local titles)", f["from"])
check("the classifier's title stays beside it; the M-ID's course title is set aside, not offered",
      f.get("alternates") == ["Firefighter 1 Academy"] and "Firefighter Academy" not in (f.get("alternates") or []), f.get("alternates"))
check("the set-aside course title and why are kept for the record",
      f.get("course_title_set_aside", {}).get("title") == "Firefighter Academy"
      and f["course_title_set_aside"]["basis"] == "M-ID FIRE M1219"
      and "industry certification" in f["course_title_set_aside"]["why"], f.get("course_title_set_aside"))
check("the joined title exists in the reference", f.get("exists") is True)
for t in ACAD:
    h = held["COBIx " + t]
    check("the SFT %s card never gets Fire Inspector 1A" % t, h["title"] == t and "Fire Inspector 1A" not in (h.get("alternates") or [])
          and h["proposal_source"] == "classifier", (h["title"], h.get("alternates")))

c = held[CBE]
check("a single-CR credit-by-exam exhibit keeps its M-ID title", c["title"] == "Academic Planning" and c["from"] == "M-ID COUN M1004"
      and c["proposal_source"] == "course" and "course_title_set_aside" not in c, (c["title"], c["from"]))
u = held[UNION]
check("a multi-CR certification never takes an M-ID title", u["title"] == "UA Steamfitter Apprenticeship — Level 1"
      and u["proposal_source"] == "classifier" and u["course_title_set_aside"]["why"] == "industry certification, not credit by exam",
      (u["title"], u.get("course_title_set_aside")))
check("and with no official name on file it is flagged for the card to say so", u.get("needs_official_name") is True)

p1 = held[P1]
check("a certification with nothing in use takes its cert_naming official name when the family is known",
      p1["title"] == "Medium/Heavy Truck Parts Specialist (ASE P1)" and p1["proposal_source"] == "official_name"
      and not p1.get("needs_official_name"), (p1["title"], p1["proposal_source"]))
check("its issuer on the card is the certification's (the box reads ASE)", T.issuer_for(p1["title"], p1["issuer"]) == ASE)

w = held[WATCH]
check("a title the credential watch's catalog lists takes the issuer's own spelling", w["title"] == "Cisco CCNA"
      and w["proposal_source"] == "official_name" and not w.get("needs_official_name"), (w["title"], w["proposal_source"]))
e = held[ELEV]
check("a college course title (not only an M-ID) is set aside for an industry certification too",
      e["title"] == "Elevator Constructor Apprenticeship — Level 1" and e["course_title_set_aside"]["basis"] == "the course ELEVA 108",
      (e["title"], e.get("course_title_set_aside")))
check("a catalog name that is a different credential is never put in its place", e.get("needs_official_name") is True)
check("a local credit-by-exam title is never flagged for an official name", not held[TOPCARD].get("needs_official_name")
      and not c.get("needs_official_name"))

a5 = held[AUTOCX]
check("a credit-by-exam noncredit AUTO card keeps its proposal and its college issuer (never moved to ASE)",
      (a5["title"], a5["issuer"], a5["proposal_source"]) == ("Brakes (ASE A5)", CCC, "classifier") and "in_use" not in a5, a5)
aj = held[AJ61]
check("a college-issued exhibit keeps its C-ID course title (AJ 61, Legal Aspects of Evidence)",
      aj["title"] == "Legal Aspects of Evidence" and aj["from"] == "C-ID AJ 124" and aj["proposal_source"] == "course"
      and "course_title_set_aside" not in aj, (aj["title"], aj["from"]))
fs1 = held[FST1]
check("FST 1 keeps its own reference title; no longer title takes it", fs1["title"] == "Principles of Emergency Services"
      and "in_use" not in fs1, (fs1["title"], fs1.get("in_use")))

sc = held[SELFCARD]
check("a proposal that is itself a statewide exhibit says so on its source line, as a join does (COBIx, #3168)",
      sc["proposal_source"] == "in_use_statewide" and sc["from"] == "the statewide exhibit in use (11 local titles)", sc["from"])
un = held[UNKNOWN]
check("with no exhibit record, a course title is not set aside on no evidence (COBIx, #3168)",
      un["title"] == "Example Course" and un["proposal_source"] == "course" and "course_title_set_aside" not in un,
      (un["title"], un["proposal_source"]))

# TOP is never consulted: changing every exhibit's TOP codes changes no proposal.
ex2 = [dict(x, top_codes=["9999.99"], top_division="99") for x in EX]
held2 = build(ex=ex2)
check("TOP is never consulted: other TOP codes give the same proposals",
      all((held2[r]["title"], held2[r]["proposal_source"]) == (held[r]["title"], held[r]["proposal_source"]) for r in held), "")
src = open(os.path.join(ROOT, "kb", "title_in_use.py"), encoding="utf-8").read()
code_only = "\n".join(l for l in src.splitlines() if not l.lstrip().startswith("#"))
code_only = code_only.split('"""', 2)[-1]
check("the rule's code names no TOP field", "top_code" not in code_only.lower() and "top_division" not in code_only.lower())

# The change is to the proposal only: the builder writes nothing but its own three files (no Supabase, no reference).
bsrc = open(os.path.join(ROOT, "kb", "_build_exhibits_review.py"), encoding="utf-8").read()
check("the builder makes no network call and writes no curation row",
      "urllib" not in bsrc and "requests" not in bsrc and "supabase" not in bsrc.lower().replace("supabase-free", "")
      and "kb_curation" not in bsrc)

n_ok = sum(1 for _, ok in results if ok)
print("%d/%d checks passed" % (n_ok, len(results)))
sys.exit(0 if n_ok == len(results) else 1)

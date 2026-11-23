#!/usr/bin/env python3
"""Proposed common subject codes for the MQ disciplines that have none (S717).

Sam, 2026-11-23: "we don't need a course to reach this table to assign a 4-character code to them. note, we have
acct for accounting"; then "go on the 95". The Common Subjects Reference was seeded per M-ID discipline
(kb/discipline_canonical_subj4.json), so an MQ discipline no M-ID used never got a row. Sam, 2026-11-04
(sam-common-subj-model-2026-11-04): the Common SUBJ is a four-letter code for every MQ discipline, adopted where an
official code exists, minted otherwise, with colleges' local codes the third voice.

Each proposal names its basis, in this order:
  cid      - a C-ID descriptor prefix that belongs to the discipline (ACCT for Accounting);
  college  - a local subject code colleges already use for the subject, read from the statewide list, with the
             colleges and courses behind it (LING at 24 colleges);
  minted   - four letters from the discipline's name, on the house patterns (a trailing N for a noncredit
             discipline, as ESLN and BSKL; DS for a DSPS specialty, as DSPS and DSPN).
Every proposal is checked: four capital letters, no code already in the Common Subjects Reference, no C-ID or CCN
prefix that belongs elsewhere, no two proposals alike. Nothing is written to the reference; a person confirms each
on the Common Subjects Reference tab. Writes kb/status/csr_proposed_codes.json. Pure stdlib.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = "kb/status/csr_proposed_codes.json"

# discipline (the handbook's name, areas left off) -> (code, basis, words)
PROPOSALS = {
    "Accounting": ("ACCT", "cid", "C-ID's ACCT descriptors (ACCT 110, 120); ACCT is the local code at 50 colleges and ACCTG at 18"),
    "Adapted Computer Technology: Disabled Students Programs and Services": ("DSAC", "minted", "DSPS specialty: Adapted Computer"),
    "Addiction Paraprofessional Training": ("ADST", "college", "C-ID's ADS (Addiction Studies) in four letters, as CRIM holds C-ID's AJ; ADST is the code at 2 colleges, ADDICST at 5 and AODS at 2"),
    "Aeronautics": ("AERO", "college", "AERO is the local code at 7 colleges"),
    "Agricultural Engineering": ("AGEN", "minted", "Agricultural Engineering"),
    "Animal Training and Management": ("ANTM", "minted", "Animal Training and Management"),
    "Appliance Repair": ("APLR", "minted", "Appliance Repair; APPL is a local code our call reads as CNST"),
    "Archaeological Technology": ("ARCT", "minted", "Archaeological Technology"),
    "Athletic Training": ("ATTR", "minted", "Athletic Training"),
    "Banking and Finance": ("FINA", "college", "the first four letters of FINANCE, the code at 9 colleges; FIN at 5 and BANK at 2"),
    "Bicycle Repair": ("BICY", "minted", "Bicycle"),
    "Bookbinding": ("BOOK", "minted", "Bookbinding"),
    "Brewing,Fermentation and Distillery Sciences": ("BREW", "minted", "Brewing"),
    "Building Maintenance": ("BLDM", "minted", "Building Maintenance"),
    "Business Education": ("BUSE", "college", "BUSE is the local code at 3 colleges"),
    "Business Machine Technology": ("BMTC", "minted", "Business Machine Technology"),
    "Cardiovascular Technology": ("CVTC", "minted", "Cardiovascular Technology; CVT at 2 colleges"),
    "Ceramic Technology": ("CRMT", "minted", "Ceramic Technology; CERT would read as certificate"),
    "Classics": ("CLAS", "college", "CLAS is the local code at 1 college"),
    "Coaching": ("COAC", "minted", "Coaching"),
    "Community College Counselor of Students with Disabilities": ("DSCS", "minted", "DSPS specialty: Counselor of Students; DSCO would read as disco"),
    "Computer Service Technology": ("CSRV", "minted", "Computer Service"),
    "Counseling: Extended Opportunity Programs and Services": ("EOPS", "college", "EOPS is the program's own name, and the local code at 1 college"),
    "Counseling: Mental Health": ("CNMH", "minted", "Counseling, Mental Health"),
    "Court Interpreting": ("CINT", "minted", "Court Interpreting; INTR at 3 colleges"),
    "Deaf and Hearing Impaired: Disabled Students Programs and Services": ("DSDH", "minted", "DSPS specialty: Deaf and Hearing Impaired"),
    "Developmental Disabilities: Disabled Students Programs and Services": ("DSDD", "minted", "DSPS specialty: Developmental Disabilities"),
    "Dietetic Technician": ("DIET", "college", "DIET is the local code at 1 college"),
    "Ecology": ("ECOL", "college", "ECOL is the local code at 6 colleges"),
    "Electromicroscopy": ("EMIC", "minted", "Electromicroscopy"),
    "Electroplating": ("EPLT", "minted", "Electroplating"),
    "Engineering Support": ("ENSP", "minted", "Engineering Support; ENGSUP at 1 college"),
    "Estimating": ("ESTI", "minted", "Estimating; ESTM is one college's code for solar and clean energy courses"),
    "Fabric Care": ("FABC", "minted", "Fabric Care"),
    "Flight Attendant Training": ("FATR", "minted", "Flight Attendant Training; FLAT would read as a word and FLTA is the Foreign Languages code for Filipino"),
    "Fluid Mechanics Technology": ("FLMT", "minted", "Fluid Mechanics Technology"),
    "Folk Dance": ("FDNC", "minted", "Folk Dance"),
    "Health Services Director/Health Services Coordinator/College Nurse": ("HSDR", "minted", "Health Services Director"),
    "Homeland Security": ("HSEC", "college", "HSEC is the local code at 2 colleges"),
    "Hotel and Motel Services": ("HOSP", "cid", "C-ID's HOSP descriptors; HOSP is the local code at 20 colleges"),
    "Industrial Design": ("INDD", "minted", "Industrial Design"),
    "Insurance": ("INSR", "minted", "Insurance; INSUR at 1 college"),
    "Janitorial Services": ("JANI", "minted", "Janitorial"),
    "Jewelry": ("JEWL", "minted", "Jewelry"),
    "Labor Relations": ("LBRL", "minted", "Labor Relations; LABR is Industrial Relations' code"),
    "Learning Disabilities: Disabled Student Programs and Services": ("DSLD", "minted", "DSPS specialty: Learning Disabilities"),
    "Learning Disabilities: Specialist": ("DSLS", "minted", "DSPS: Learning Disabilities Specialist"),
    "Linguistics": ("LING", "college", "LING is the local code at 24 colleges"),
    "Locksmithing": ("LOCK", "minted", "Locksmithing"),
    "Marine Diving Technology": ("MDVT", "minted", "Marine Diving Technology; MDIV would read as Master of Divinity"),
    "Marine Engine Technology": ("MENG", "minted", "Marine Engine"),
    "Martial Arts/Self-Defense": ("MRTL", "minted", "Martial Arts; MART is a 47-course local code our call reads as ARTS"),
    "Mass Communication": ("MCOM", "college", "MCOM is the local code at 4 colleges"),
    "Materials Testing Technology": ("MTST", "minted", "Materials Testing"),
    "Mathematics-Basic Skills: Noncredit": ("MTHN", "minted", "Mathematics, noncredit (as ESLN, HLSN)"),
    "Medical Instrument Repair": ("MIRP", "minted", "Medical Instrument Repair"),
    "Military Studies": ("MILS", "minted", "Military Studies"),
    "Mining and Metallurgy": ("MINE", "minted", "Mining"),
    "Motorcycle Repair": ("MOTO", "college", "MOTO is the local code at 1 college"),
    "Music Management": ("MUSM", "college", "MUSM is the local code at 4 colleges"),
    "Music Merchandising": ("MUSD", "minted", "Music Merchandising"),
    "Musical Instrument Repair": ("MUIR", "minted", "Musical Instrument Repair"),
    "Nanotechnology": ("NANO", "minted", "Nanotechnology"),
    "Nursing Science/Clinical Practice": ("NRSC", "minted", "Nursing Science"),
    "Peace Studies": ("PCST", "minted", "Peace Studies"),
    "Photographic Technology/ Commercial Photography": ("PHTC", "college", "PHTC is the local code at 3 colleges"),
    "Physical Disabilities: Disabled Student Programs and Services": ("DSPD", "minted", "DSPS specialty: Physical Disabilities"),
    "Piano Tuning and Repair": ("PIAN", "minted", "Piano"),
    "Plastics": ("PLAS", "minted", "Plastics"),
    "Printing Technology": ("PRNT", "college", "PRNT is the local code at 3 colleges"),
    "Private Security": ("PSEC", "minted", "Private Security"),
    "Prosthetics and Orthotics": ("PROS", "minted", "Prosthetics"),
    "Public Relations": ("PREL", "minted", "Public Relations; PUBREL at 4 colleges"),
    "Radiation Therapy": ("RTHR", "minted", "Radiation Therapy"),
    "Reading-Basic Skills: Noncredit": ("RDGN", "minted", "Reading, noncredit (as ESLN, HLSN)"),
    "Registered Behavior Technician": ("RBTC", "minted", "Registered Behavior Technician"),
    "Rehabilitation Technician": ("REHB", "minted", "Rehabilitation"),
    "Religious Studies": ("RLST", "college", "RLST is the local code at 5 colleges (RELS and RELG at 4 each)"),
    "Respiratory Technician": ("RSPC", "college", "RSPC is the code at 1 college; a trailing N would read as noncredit, as ESLN and MTHN"),
    "Retailing": ("RETL", "minted", "Retailing"),
    "Sanitation and Public Health Technology": ("SANI", "minted", "Sanitation; SANT would read as saint"),
    "Search and Rescue": ("SRCH", "minted", "Search and Rescue"),
    "Sheet Metal": ("SHME", "college", "SHME is the local code at 1 college"),
    "Ship and Boat Building and Repair": ("SHIP", "minted", "Ship and Boat Building"),
    "Shoe Rebuilding": ("SHOE", "minted", "Shoe Rebuilding"),
    "Small Engine Mechanics": ("SENG", "minted", "Small Engine"),
    "Specialized Instruction (Disabled Student Programs and Services): Vocational Noncredit": ("DSVN", "minted", "DSPS: vocational noncredit (beside DSPN)"),
    "Speech Language Pathology: Disabled Student Programs and Services": ("DSSL", "minted", "DSPS specialty: Speech Language Pathology"),
    "Supply Chain Technology": ("SCMT", "minted", "Supply Chain"),
    "Telecommunication Technology": ("TELC", "minted", "Telecommunication"),
    "Travel Services": ("TRVL", "minted", "Travel"),
    "Uncrewed Aircraft System (UAS) Technology": ("UASY", "minted", "Uncrewed Aircraft Systems; UAS at 1 college"),
    "Vision Care Technology": ("VISN", "minted", "Vision Care"),
    "Watch and Clock Repair": ("WTCH", "minted", "Watch and Clock"),
    "Writing-Basic Skills: Noncredit": ("WRTN", "minted", "Writing, noncredit (as ESLN, HLSN)"),
}


# Confidence, on the levels Sam ruled for subject calls (r-confidence-not-person-settled-sam-2026-11-23): Confident 90%
# or more, Likely 75 to 90%, Leaning 50 to 75%, Unsure under 50%. It measures the choice of the four letters: authority,
# local norms, connotation. Every code is assigned whatever its level (Sam, 2026-11-23: "I still don't want to indicate
# that the code needs a human touch, just the ability for me to change it and maybe add a note as to why and a small
# process for you to check that I haven't stepped on an existing code"); a lower level carries its reason as a note.
#   cid      0.97: the authority's own prefix for the discipline.
#   college  by the colleges using the code with titles that name the subject: 5 or more 0.95, 3 or 4 0.90, 2 0.85,
#            1 0.80.
#   minted   0.82: four letters from the name, collision-free, read for connotation (no word it says by accident, no
#            trailing N outside noncredit), and checked against the codes colleges file the subject's courses under
#            (their course titles searched for the subject's words); no authority or college code agrees or differs.
# ADJUST holds the reads a person can check: a code whose colleges' titles are mixed, or name a broader subject.
LEVELS = ((0.90, "Confident"), (0.75, "Likely"), (0.50, "Leaning"), (0.0, "Unsure"))
ASSIGN_AT = 0.0   # every code is assigned; the confidence informs, it never holds a code (Sam, 2026-11-23)
ADJUST = {
    "Ecology": (0.60, "ECOL's six colleges put Human Ecology beside Music Appreciation, Choral Ensemble and Creative Writing for Seniors, so the local code reads as an older-adults catch-all there."),
    "Hotel and Motel Services": (0.65, "C-ID's HOSP descriptors sit with Culinary Arts/Food Technology by majority (20 M-IDs, against 3 under Hotel and Motel Services and 3 under Restaurant Management), and HOSP is Culinary's primary C-ID chip. HOSP moves to Hotel and Motel Services as its code; Culinary keeps CULN."),
    "Uncrewed Aircraft System (UAS) Technology": (0.65, "Colleges file drone courses under DRON, DRONE and UAS (one college each); the MQ says Uncrewed Aircraft System. UASY follows the MQ's words; DRON would follow the colleges and the common word."),
    "Aeronautics": (0.86, "AERO also prefixes nine Air Force ROTC M-IDs with no discipline (AS100 Heritage and Values); they belong with Military Studies (MILS)."),
    "Business Education": (0.78, "BUSE's three colleges use it for general business courses (Introduction to Business, Business Law), not for business teacher preparation."),
    "Motorcycle Repair": (0.80, "MOTO's one college mixes motorcycle courses with bicycle and custom metal work."),
    "Mass Communication": (0.86, "MCOM's four colleges use it for journalism and public relations courses, which Mass Communication covers."),
}


def level(c):
    return next(w for t, w in LEVELS if c >= t)


def confidence(name, basis, colleges):
    if name in ADJUST:
        return ADJUST[name]
    if basis == "cid":
        return 0.97, ""
    if basis == "college":
        if name.startswith("Counseling: Extended Opportunity"):
            return 0.95, ""
        n = colleges or 0
        return (0.95 if n >= 5 else 0.90 if n >= 3 else 0.85 if n == 2 else 0.80), ""
    return 0.82, ""


def load(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return json.load(f)


def KEY_OF(name):
    """The Common Subjects Reference key for a handbook name (kb/_csr_assign_codes.py KEY)."""
    return {"Counseling: Extended Opportunity Programs and Services": "Counseling: Extended Opportunity",
            "Health Services Director/Health Services Coordinator/College Nurse": "Health Services Director/Health",
            "Specialized Instruction (Disabled Student Programs and Services): Vocational Noncredit": "Specialized Instruction: Vocational Noncredit"}.get(name, name)


def mid_prefixes():
    """{four-letter M-ID prefix: {"ids": n, "disciplines": {discipline or None}}} over the minted files."""
    out = {}
    for rel in ("kb/coci_minted_courses.json", "kb/coci_minted_singletons.json"):
        if not os.path.exists(os.path.join(ROOT, rel)):
            continue
        d = load(rel)
        recs = d.get("courses") or d.get("singletons") or {}
        items = recs.items() if isinstance(recs, dict) else ((r.get("course_id"), r) for r in recs)
        for key, r in items:
            m = re.match(r"^([A-Z]{4}) M", key or "")
            if m:
                e = out.setdefault(m.group(1), {"ids": 0, "disciplines": set()})
                e["ids"] += 1
                e["disciplines"].add(r.get("discipline") if isinstance(r, dict) else None)
    return out


def build():
    view = load("kb/status/mq_view.json")
    canon = load("kb/discipline_canonical_subj4.json")["disciplines"]
    used = {v["canonical_subj4"]: k for k, v in canon.items()}
    for k, v in canon.items():
        for u in v.get("umbrella_codes") or []:   # an umbrella's split codes (Foreign Languages' FLSP, FLTA ...)
            used.setdefault(u, k + " (umbrella)")
    prefixes = mid_prefixes()
    cid = {}
    for d in load("kb/reference/cid_descriptors.json")["descriptors"]:
        cid.setdefault(d["descriptor"].split()[0], d["title"])
    sw = {c["code"]: c for c in load("kb/status/statewide_subject_codes.json")["codes"]}
    # A discipline with no code, or with the code this step assigned (kb/_csr_assign_codes.py): the file stays the
    # record of how each assigned code was chosen.
    need = [r for r in view["rows"] if not r["same_as"] and (not r["code"] or r.get("code_source") == "assigned")]
    rows, problems, seen, changed = [], [], {}, []   # changed: a code a person has since changed; never a problem
    for r in need:
        p = PROPOSALS.get(r["name"])
        if not p:
            problems.append(f"no proposal for {r['name']}")
            continue
        code, basis, words = p
        if not re.fullmatch(r"[A-Z]{4}", code):
            problems.append(f"{code} for {r['name']} is not four capital letters")
        if code in used and (r.get("code_source") != "assigned" or used[code] != KEY_OF(r["name"])):
            problems.append(f"{code} for {r['name']} is already {used[code]}'s common code")
        if code in prefixes and prefixes[code]["disciplines"] - {None, KEY_OF(r["name"])}:
            problems.append(f"{code} for {r['name']} already prefixes M-IDs of {sorted(d for d in prefixes[code]['disciplines'] if d)}")
        if r.get("code_source") == "assigned" and r["code"] != code:
            changed.append({"discipline": r["name"], "now": r["code"], "assigned": code})
        if code in seen:
            problems.append(f"{code} proposed twice: {seen[code]} and {r['name']}")
        if basis != "cid" and code in cid:
            problems.append(f"{code} for {r['name']} is a C-ID prefix ({cid[code]})")
        seen[code] = r["name"]
        lc = sw.get(code)
        conf, why = confidence(r["name"], basis, len(lc["colleges"]) if (lc and basis == "college") else 0)
        rows.append({"discipline": r["name"], "key": r["key"], "types": r["types"], "code": code, "basis": basis, "words": words,
                     "confidence": conf, "level": level(conf), "assign": conf >= ASSIGN_AT, "note": why,
                     "local_code_now": ({"colleges": len(lc["colleges"]), "courses": lc["courses"],
                                         "called": (lc.get("recommend") or {}).get("common"), "filed": bool(lc.get("filing"))} if lc else None)})
    for name in PROPOSALS:
        if name not in {r["name"] for r in need}:
            problems.append(f"a proposal names {name}, which needs none")
    return {"_what": "Proposed common subject codes for the MQ disciplines with none. Written by kb/_csr_propose_codes.py; nothing here is a decision until a person confirms a code on the Common Subjects Reference.",
            "_rule": "Basis in order: a C-ID prefix that belongs to the discipline; a local code colleges already use; four letters minted from the name. Each is four capital letters, unused in the Common Subjects Reference, no C-ID prefix belonging elsewhere, and proposed once.",
            "count": len(rows), "assigned": sum(1 for x in rows if x["assign"]), "by_basis": {b: sum(1 for x in rows if x["basis"] == b) for b in ("cid", "college", "minted")},
            "problems": problems, "changed_by_a_person": changed, "rows": rows}


def main(argv=None):
    doc = build()
    if "--check" in (argv or sys.argv[1:]):
        old = open(os.path.join(ROOT, OUT), encoding="utf-8").read() if os.path.exists(os.path.join(ROOT, OUT)) else None
        return 0 if old == json.dumps(doc, ensure_ascii=False, indent=1, sort_keys=True) + "\n" else 1
    with open(os.path.join(ROOT, OUT), "w", encoding="utf-8") as f:
        f.write(json.dumps(doc, ensure_ascii=False, indent=1, sort_keys=True) + "\n")
    print(f"[csr_propose_codes] {doc['count']} proposals ({doc['by_basis']}); {len(doc['problems'])} problems")
    for p in doc["problems"]:
        print("  " + p)
    return 1 if doc["problems"] else 0


if __name__ == "__main__":
    sys.exit(main())

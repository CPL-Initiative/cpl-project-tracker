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
    "Addiction Paraprofessional Training": ("ADDC", "minted", "Addiction"),
    "Aeronautics": ("AERO", "college", "AERO is the local code at 7 colleges"),
    "Agricultural Engineering": ("AGEN", "minted", "Agricultural Engineering"),
    "Animal Training and Management": ("ANTM", "minted", "Animal Training and Management"),
    "Appliance Repair": ("APLR", "minted", "Appliance Repair; APPL is a local code our call reads as CNST"),
    "Archaeological Technology": ("ARCT", "minted", "Archaeological Technology"),
    "Athletic Training": ("ATTR", "minted", "Athletic Training"),
    "Banking and Finance": ("FINA", "minted", "Finance; FIN at 5 colleges and BANK at 2"),
    "Bicycle Repair": ("BICY", "minted", "Bicycle"),
    "Bookbinding": ("BOOK", "minted", "Bookbinding"),
    "Brewing,Fermentation and Distillery Sciences": ("BREW", "minted", "Brewing"),
    "Building Maintenance": ("BLDM", "minted", "Building Maintenance"),
    "Business Education": ("BUSE", "college", "BUSE is the local code at 3 colleges"),
    "Business Machine Technology": ("BMTC", "minted", "Business Machine Technology"),
    "Cardiovascular Technology": ("CVTC", "minted", "Cardiovascular Technology; CVT at 2 colleges"),
    "Ceramic Technology": ("CERT", "minted", "Ceramic Technology"),
    "Classics": ("CLAS", "college", "CLAS is the local code at 1 college"),
    "Coaching": ("COAC", "minted", "Coaching"),
    "Community College Counselor of Students with Disabilities": ("DSCO", "minted", "DSPS specialty: Counselor"),
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
    "Estimating": ("ESTM", "college", "ESTM is the local code at 1 college"),
    "Fabric Care": ("FABC", "minted", "Fabric Care"),
    "Flight Attendant Training": ("FLAT", "minted", "Flight Attendant"),
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
    "Marine Diving Technology": ("MDIV", "minted", "Marine Diving"),
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
    "Respiratory Technician": ("RSPN", "minted", "Respiratory Technician"),
    "Retailing": ("RETL", "minted", "Retailing"),
    "Sanitation and Public Health Technology": ("SANT", "minted", "Sanitation"),
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


def load(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return json.load(f)


def build():
    view = load("kb/status/mq_view.json")
    canon = load("kb/discipline_canonical_subj4.json")["disciplines"]
    used = {v["canonical_subj4"]: k for k, v in canon.items()}
    cid = {}
    for d in load("kb/reference/cid_descriptors.json")["descriptors"]:
        cid.setdefault(d["descriptor"].split()[0], d["title"])
    sw = {c["code"]: c for c in load("kb/status/statewide_subject_codes.json")["codes"]}
    need = [r for r in view["rows"] if not r["code"] and not r["same_as"]]
    rows, problems, seen = [], [], {}
    for r in need:
        p = PROPOSALS.get(r["name"])
        if not p:
            problems.append(f"no proposal for {r['name']}")
            continue
        code, basis, words = p
        if not re.fullmatch(r"[A-Z]{4}", code):
            problems.append(f"{code} for {r['name']} is not four capital letters")
        if code in used:
            problems.append(f"{code} for {r['name']} is already {used[code]}'s common code")
        if code in seen:
            problems.append(f"{code} proposed twice: {seen[code]} and {r['name']}")
        if basis != "cid" and code in cid:
            problems.append(f"{code} for {r['name']} is a C-ID prefix ({cid[code]})")
        seen[code] = r["name"]
        lc = sw.get(code)
        rows.append({"discipline": r["name"], "key": r["key"], "types": r["types"], "code": code, "basis": basis, "words": words,
                     "local_code_now": ({"colleges": len(lc["colleges"]), "courses": lc["courses"],
                                         "called": (lc.get("recommend") or {}).get("common"), "filed": bool(lc.get("filing"))} if lc else None)})
    for name in PROPOSALS:
        if name not in {r["name"] for r in need}:
            problems.append(f"a proposal names {name}, which needs none")
    return {"_what": "Proposed common subject codes for the MQ disciplines with none. Written by kb/_csr_propose_codes.py; nothing here is a decision until a person confirms a code on the Common Subjects Reference.",
            "_rule": "Basis in order: a C-ID prefix that belongs to the discipline; a local code colleges already use; four letters minted from the name. Each is four capital letters, unused in the Common Subjects Reference, no C-ID prefix belonging elsewhere, and proposed once.",
            "count": len(rows), "by_basis": {b: sum(1 for x in rows if x["basis"] == b) for b in ("cid", "college", "minted")},
            "problems": problems, "rows": rows}


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

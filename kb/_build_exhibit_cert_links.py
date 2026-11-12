#!/usr/bin/env python3
"""The exhibit-to-cert link: which certifications each canonical exhibit title holds, by the catalog's own ids.

Sam, 2026-11-01: "Do we have a separate canonical list of just our certs, apart from how they might be bundled in an
exhibit? This brings me back to my DB dev days of normalizing", then "build the ASE slice first. Seems like we will
need that cert table, especially with the expanded cert schedule run we have going. Maybe we already have it?"

We do: kb/it_ai_credential_catalog.json, which the weekly industry-credential watch fills (7,335 credentials on
2026-11-01, each with a stable id, ASE's tests among them from CareerOneStop). What it lacked is the link, so a bundle
(one MAP exhibit, one canonical title) could say which certs it holds. This file is that link table:

    cert (the catalog's id)  <-many-to-many->  canonical exhibit title (credential_reference_data.js `ut`)

First family: ASE. A title that is an ASE certification or bundle ("ASE A5 Brakes", "ASE Bundle — A4, A5",
"ASE C1 or G1 — ...") HOLDS the tests it names, all of them, or any one where the title says "or". A local course
that names a test in parentheses ("Automotive Technology (ASE A5 Brakes)", Sam's 2026-10-31 form) is ALIGNED to it:
the college issues that course, and ASE issues only the test (Sam, 2026-10-31). A token that is not an ASE test code
("SP/2 HD", "Snap-on 604", "MACS/609", "Cummins ISX") is kept as unresolved, for the next family to claim, and so is an
ASE credential the catalog does not list (Master Automobile Technician, xEV, the G1 test).

Second family: the exams colleges award credit for by examination, College Board's AP and CLEP and the IB's Diploma
Programme subjects (S546, 2026-11-02). The catalog lists each official exam (kb/_build_it_ai_credential_catalog.py reads
the fold readers' lists), and the reference names its AP, CLEP and IB titles by those same official names (Sam's fold
rulings, 2026-10-31 and Open Asks Sheet 150). So a title that is an official exam HOLDS that exam; a title naming two
joined by "or" ("AP English Literature and Composition or AP English Language and Composition") holds either, rule
"any"; a title the readers hold back as naming no one exam ("AP Physics") is kept as unresolved.

Third family: the IT vendors, CompTIA, Cisco and Microsoft (S548, 2026-11-02). Their reference titles share no code
the way ASE's do, and the catalog spells the same cert several ways (one row a version: "Microsoft Office Specialist:
Microsoft Word 2016", "...Word Associate (Office 2019)"), so VENDOR is a hand-checked table from each reference title to
the catalog's names, looked up by name and issuer when the file builds (an id is never written here). A title that
names no version holds any of the cert's versions, rule "any"; a title naming two certs joined by "and" holds both; one
naming either by "or" holds any. A title naming no one cert ("CompTIA Certification (unspecified)", "Microsoft Office
Specialist (generic)") is kept as unresolved, and so are the local courses ("Microsoft Excel 1", "Microsoft Word
Beginning", "Using Microsoft Windows"), which the table leaves out: a college issues those, and no vendor does.

Fourth family: the FAA's airman certificates and ratings (S568, 2026-11-04), by the same hand table (FAA below). The
catalog lists the FAA under two spellings ("Federal Aviation Administration" and "... (FAA)") and some names twice, so
a name is looked up across both and keeps its lowest id. A title naming a certificate without its category ("FAA
Instrument Rating", "FAA Pilot Certificate — Helicopter Rating") holds any of the catalog's ratings that fit it. Left
out: the flight labs and ground schools, which a college teaches toward the certificate (as "Microsoft Excel 1" is
left out); "FAA Certified Flight Instructor (CFI)" and the Part 137 operator certificate, which the catalog does not
list yet; and the Part 107 and POST Basic bundle, whose POST half no catalog issuer holds.
ASE's test names come from kb/_sweep_exhibit_titles.py's ASE table (imported, never copied). Writes
kb/exhibit_cert_links.json; the daily run rebuilds it after the credential reference; the Exhibits List's finder and
title drawer read it. Standard library only.

    python3 kb/_build_exhibit_cert_links.py           # write
    python3 kb/_build_exhibit_cert_links.py --check   # exit 1 when the file on disk is stale
"""
import importlib.util
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CATALOG = ROOT / "kb" / "it_ai_credential_catalog.json"
REFERENCE = ROOT / "credential_reference_data.js"
OUT = ROOT / "kb" / "exhibit_cert_links.json"
ASE_ISSUER = "National Institute for Automotive Service Excellence"


def ase_names():
    spec = importlib.util.spec_from_file_location("sweep", ROOT / "kb" / "_sweep_exhibit_titles.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.ASE


def load_reference():
    text = REFERENCE.read_text(encoding="utf-8")
    data = json.loads(text[text.index("{"):text.rstrip().rstrip(";").rindex("}") + 1])
    return data["unified_titles"], data.get("_generated_at")


def catalog_ase():
    """ASE's tests in the catalog, by test code; a code listed twice keeps its lowest id and names the rest."""
    rows = json.loads(CATALOG.read_text(encoding="utf-8"))["credentials"]
    by_code, dupes = {}, {}
    for r in sorted(rows, key=lambda r: (len(r["id"]), r["id"])):
        if not r.get("issuer", "").startswith(ASE_ISSUER):
            continue
        m = re.search(r" - ([A-Z]{1,3}\d{1,2})\b", r.get("name", ""))
        if not m:
            continue
        code = m.group(1)
        if code in by_code:
            dupes.setdefault(code, [by_code[code]["id"]]).append(r["id"])
            continue
        by_code[code] = {"id": r["id"], "name": r["name"], "issuer": r["issuer"]}
    return by_code, dupes


EXAM_PREFIX = re.compile(r"^(AP|CLEP|IB) ")


def catalog_exams():
    """The catalog's AP, CLEP and IB exams, by name (the kind the catalog builder gives them)."""
    rows = json.loads(CATALOG.read_text(encoding="utf-8"))["credentials"]
    out = {}
    for r in sorted(rows, key=lambda r: (len(r["id"]), r["id"])):
        if r.get("kind") == "exam" and EXAM_PREFIX.match(r.get("name", "")):
            out.setdefault(r["name"], {"id": r["id"], "name": r["name"], "issuer": r["issuer"],
                                       "status": r.get("status")})
    return out


# Reference title -> (rule, the catalog's names). Issuer is the vendor named first in the title. Hand-checked
# against kb/it_ai_credential_catalog.json on 2026-11-02 (S548). A name missing from the catalog shows as unresolved.
_MOS = "Microsoft Office Specialist: "
MOS_EXCEL = [_MOS + "Excel Associate (Microsoft 365 Apps)", _MOS + "Microsoft Excel Associate (Office 2019)",
             "Microsoft Office Specialist (MOS): Microsoft Excel 2016"]
MOS_EXCEL_EXPERT = [_MOS + "Microsoft Excel Expert (Excel and Excel 2019)", _MOS + "Microsoft Excel 2016 Expert"]
MOS_WORD = [_MOS + "Word Associate (Office 2019)", _MOS + "Microsoft Word 2016"]
MOS_WORD_EXPERT = [_MOS + "Microsoft Word Expert (Office 2019)", _MOS + "Microsoft Word 2016 Expert",
                   _MOS + "Word 2013 Expert"]
MOS_ACCESS_EXPERT = [_MOS + "Microsoft Access Expert (Access and Access 2019)"]
VENDOR = {
    "CompTIA A+": ("all", ["CompTIA A+ Certification"]),
    "CompTIA Cloud Essentials+": ("all", ["CompTIA Cloud Essentials"]),
    "CompTIA Cloud+": ("all", ["CompTIA Cloud+"]),
    "CompTIA CySA+": ("all", ["CompTIA Cybersecurity Analyst"]),
    "CompTIA IT Fundamentals (ITF+)": ("all", ["CompTIA Tech+"]),  # ITF+ renamed Tech+ (comptia.org, 2026-11-09)
    "CompTIA Linux+": ("all", ["CompTIA Linux+"]),
    "CompTIA Network+": ("all", ["CompTIA Network+"]),
    "CompTIA PenTest+": ("all", ["CompTIA PenTest+"]),
    "CompTIA Project+": ("all", ["CompTIA Project+"]),
    "CompTIA Security+": ("all", ["CompTIA Security+"]),
    "CompTIA Server+": ("all", ["CompTIA Server+"]),
    "CompTIA Tech+": ("all", ["CompTIA Tech+"]),
    "CompTIA Certification (unspecified)": ("all", []),
    "Cisco Certified Network Associate (CCNA)": ("all", ["CCNA"]),
    "Cisco Certified Network Associate Wireless (CCNA Wireless)": ("all", ["Cisco Certified Network Associate Wireless (CCNA Wireless)"]),
    "Cisco Certified Network Professional (CCNP) Security": ("any", ["Cisco Certified Network Professional (CCNP) Security",
                                                                     "CCNP Security Certification"]),
    "Cisco IT Essentials": ("all", ["Cisco IT Essentials"]),
    "Cisco Networking Academy — Networking Essentials": ("all", ["Cisco Networking Academy — Networking Essentials"]),
    "Microsoft Certified Solutions Associate (MCSA) — Windows Server": ("all", ["Microsoft Certified Solutions Associate (MCSA) — Windows Server"]),
    "Microsoft Certified: Azure Administrator Associate": ("all", ["Microsoft Certified: Azure Administrator Associate"]),
    "Microsoft Certified: Azure Administrator Associate (AZ-104)": ("all", ["Microsoft Certified: Azure Administrator Associate"]),
    "Microsoft Certified: Azure AI Fundamentals": ("all", ["Microsoft Certified: Azure AI Fundamentals"]),
    "Microsoft Certified: Azure Fundamentals (AZ-900)": ("all", ["Microsoft Certified: Azure Fundamentals"]),
    "Microsoft Certified: Endpoint Administrator Associate (MD-102)": ("all", ["Microsoft 365 Certified: Endpoint Administrator Associate"]),
    "Microsoft Certified: Microsoft 365 Administrator Expert": ("all", ["Microsoft Certified: Microsoft 365 Administrator Expert"]),
    "Microsoft Certified: Power BI Data Analyst Associate": ("all", ["Microsoft Certified: Power BI Data Analyst Associate"]),
    "Microsoft Technology Associate (MTA) Database Fundamentals": ("all", ["Microsoft Technology Associate (MTA) Database Fundamentals"]),
    "Microsoft Office Specialist": ("all", []),
    "Microsoft Office Specialist (generic)": ("all", []),
    "Microsoft Office Specialist — Access": ("any", [_MOS + "Access (Office 2016)"]),
    "Microsoft Office Specialist — Access Expert": ("any", MOS_ACCESS_EXPERT),
    "Microsoft Office Specialist — Excel": ("any", MOS_EXCEL),
    "Microsoft Office Specialist — Excel Expert": ("any", MOS_EXCEL_EXPERT),
    "Microsoft Office Specialist — Excel or Excel Expert": ("any", MOS_EXCEL + MOS_EXCEL_EXPERT),
    "Microsoft Office Specialist — Excel Expert and Access Expert (Office 2019)": ("all", MOS_EXCEL_EXPERT[:1] + MOS_ACCESS_EXPERT),
    "Microsoft Office Specialist — Outlook": ("any", [_MOS + "Outlook Associate (Office 2019)", _MOS + "Microsoft Outlook 2016"]),
    "Microsoft Office Specialist — PowerPoint": ("any", [_MOS + "PowerPoint Associate (Office 2019)",
                                                        _MOS + "Microsoft PowerPoint 2016", _MOS + "PowerPoint Associate 2019"]),
    "Microsoft Office Specialist — Word": ("any", MOS_WORD),
    "Microsoft Office Specialist — Word Expert": ("any", MOS_WORD_EXPERT),
    "Microsoft Office Specialist — Word or Word Expert": ("any", MOS_WORD + MOS_WORD_EXPERT),
}
VENDOR_ISSUERS = ("CompTIA", "Cisco", "Microsoft")

# The FAA's certificates and ratings, hand-checked against the catalog on 2026-11-04 (S568).
FAA_ISSUER = "Federal Aviation Administration (FAA)"
FAA_ISSUER_SPELLINGS = ("Federal Aviation Administration", FAA_ISSUER)
FAA_PRIVATE = ["Private Pilot", "Private Pilot Certificate"]
FAA = {
    "FAA Certified Flight Instructor — Instrument (CFII)": ("all", ["Certified Flight Instrument Instructor Rating"]),
    "FAA Commercial Pilot Certificate": ("all", ["Commercial Pilot"]),
    "FAA Instrument Rating": ("any", ["Airplane Instrument Rating", "Instrument-Helicopter Rating",
                                      "Instrument - Powered-lift Rating"]),
    "FAA Mechanic Certificate — Airframe and Powerplant (A&P)": ("all", ["Mechanic (Airframe & Powerplant)"]),
    "FAA Mechanic Certificate — Airframe or Powerplant Rating": ("any", ["Aviation Airframe Mechanic",
                                                                        "Aviation Powerplant Mechanic"]),
    "FAA Mechanic Certificate — Airframe Rating": ("all", ["Aviation Airframe Mechanic"]),
    "FAA Mechanic Certificate — Powerplant Rating": ("all", ["Aviation Powerplant Mechanic"]),
    "FAA Pilot Certificate — Helicopter Rating": ("any", ["Private Pilot, Helicopter Rating",
                                                          "Commercial Pilot, Helicopter Rating", "Helicopter Class Rating"]),
    "FAA Private Pilot Certificate": ("any", FAA_PRIVATE),
    "Private Pilot Certificate": ("any", FAA_PRIVATE),
    "FAA Remote Pilot Certificate (Part 107)": ("any", ["Remote Pilot Certificate", "Drone Pilot Certification"]),
}


# Fifth to seventh families (S569, 2026-11-04), hand-checked against the catalog the same way. Each issuer is spelled
# two ways in the catalog, so the spellings fold to one. Only a title that names a certification the catalog lists is
# linked: a level short of journey (NCCER Electrician Level 1 to 3) holds no catalog row, "Autodesk Certified
# Professional" names no one certification, "Fire Inspector 1" mixes ICC, SFT and NFPA exhibits, and the ASME welder
# qualifications are not in the catalog yet. Courses (AutoCAD Beginning, Autodesk Revit) stay out.
HAND = {
    "Autodesk": (("Autodesk", "Autodesk, Inc."), {
        "Autodesk Certified User": ("all", ["Autodesk Certified User"]),
        "Autodesk Certified User/Professional — AutoCAD": ("any", [
            "Autodesk Associate (Certified User) AutoCAD", "AutoCAD Certified User", "AutoCAD Certified Professional",
            "Autodesk Certified Professional in AutoCAD for Design and Drafting"]),
        "Autodesk Certified User/Professional — Revit Architecture": ("any", [
            "Autodesk Certified User - Revit", "Autodesk Certified Professional in Revit for Architectural Design"]),
    }),
    "NCCER": (("National Center for Construction Education and Research",
               "National Center for Construction Education and Research (NCCER)"), {
        "NCCER Commercial Carpenter Journey Level": ("all", ["Commercial Carpenter"]),
        "NCCER Industrial Carpenter Journey Level": ("all", ["Industrial Carpenter"]),
        "NCCER Commercial Electrician Level 4/Journey Level": ("any", ["Commercial Electrician", "NCCER Commercial Electrician"]),
        "NCCER Industrial Electrician Level 4/Journey Level": ("all", ["Industrial Electrician"]),
        "NCCER Construction Foreman Management": ("all", ["Construction Foreman"]),
        "NCCER Construction Superintendent Management": ("all", ["Construction Superintendant Certification"]),
        "NCCER CORE Curriculum - Introduction to Basic Construction Skills": ("all", ["NCCER Core Credential"]),
        "NCCER HVACR Level 1": ("all", ["NCCER HVAC, Level 1"]),
        "NCCER Welding Level 1": ("all", ["Level 1 - Welding"]),
    }),
    "ASME": (("American Society of Mechanical Engineers (ASME)", "American Society of Mechanical Engineers International"), {
        "ASME GDTP Y14.5 Certification": ("any", [
            "Geometric Dimensioning & Tolerancing Professional - Technologist",
            "GDTP (Y14.5) Geometric Dimensioning & Tolerancing Professional Certification - 2009 Technologist Level",
            "GDTP (Y14.5) Geometric Dimensioning & Tolerancing Professional Certification - 2009 Senior Level"]),
    }),
    # Eighth to eleventh families (S570, 2026-11-04): PMI, ICC, CDPH and EMSA, one catalog spelling each. Left out:
    # PgMP and PfMP (not in the catalog), ICC's California code titles and the INSPEC courses, the Acute Care Nursing
    # Assistant course, EMR (not in the catalog), the EMT courses, "EMT-2 Certification" (California's old EMT-II has
    # no catalog row) and "EMT Certification", whose exhibits name EMSA, NREMT and ACE.
    "PMI": (("PMI",), {
        "Certified Associate in Project Management (CAPM)": ("all", ["Certified Associate in Project Management (CAPM)"]),
        "Project Management Professional (PMP)": ("all", ["Project Management Professional"]),
        "PMI Agile Certified Practitioner (PMI-ACP)": ("all", ["PMI Agile Certified Practitioner"]),
        "PMI Professional in Business Analysis (PMI-PBA)": ("all", ["PMI Professional in Business Analysis"]),
        "PMI Risk Management Professional (PMI-RMP)": ("all", ["PMI Risk Management Professional"]),
    }),
    "ICC": (("International Code Council",), {
        "Building Plans Examiner": ("all", ["Building Plans Examiner"]),
        "Certified Building Official": ("all", ["Certified Building Official"]),
        "Commercial Building Inspector": ("all", ["Commercial Building Inspector"]),
        "Commercial Mechanical Inspector": ("all", ["Commercial Mechanical Inspector"]),
        "Mechanical Plans Examiner": ("all", ["Mechanical Plans Examiner"]),
        "Residential Building Inspector": ("all", ["Residential Building Inspector"]),
        "Residential Mechanical Inspector": ("all", ["Residential Mechanical Inspector"]),
        "Residential Plans Examiner": ("all", ["Residential Plans Examiner"]),
    }),
    "CDPH": (("California Department of Public Health",), {
        "Certified Nurse Assistant (CNA) Certification": ("all", ["Certified Nurse Assistant"]),
        "Certified Nursing Assistant (CNA)": ("all", ["Certified Nurse Assistant"]),
    }),
    "EMSA": (("California Emergency Medical Services Authority",), {
        "Emergency Medical Technician (EMT) Certification": ("all", ["Emergency Medical Technician (EMT)"]),
        "Paramedic License": ("all", ["Paramedic License (EMT-P)"]),
    }),
    # Twelfth and thirteenth families (S571, 2026-11-04): the American Welding Society and Amazon Web Services, one
    # catalog spelling each, both written "AWS" in titles. A D1.1 or D9.1 welder qualification holds the catalog's row for
    # its code. Left out: D1.3, D1.5, D1.8, D17.1 and the B2.2 brazing qualification (no catalog row), "AWS Welder
    # Qualification — D1.1/D1.3/D17.1" (two of its three codes have no row), the LA City certified-welder titles (the
    # City issues them), and the welding-process courses and Light Gage titles.
    "AWS-Welding": (("American Welding Society",), {
        "AWS D1.1 FCAW Qualified Welder": ("all", ["AWS D1.1 Structural Steel"]),
        "AWS D1.1 SMAW Qualified Welder": ("all", ["AWS D1.1 Structural Steel"]),
        "AWS D1.1 Structural Welder Qualification": ("all", ["AWS D1.1 Structural Steel"]),
        "AWS D1.1 Structural Welding Certification — FCAW (E71T-8)": ("all", ["AWS D1.1 Structural Steel"]),
        "AWS D1.1 Structural Welding Certification — SMAW (E7018)": ("all", ["AWS D1.1 Structural Steel"]),
        "AWS D9.1 GMAW Qualified Welder": ("all", ["AWS D9.1 Sheet Metal Welding"]),
    }),
    "Amazon": (("Amazon Web Services",), {
        "AWS Certified Cloud Practitioner": ("all", ["AWS Certified Cloud Practitioner"]),
        "AWS Certified Developer — Associate": ("all", ["AWS Certified Developer - Associate"]),
        "AWS Certified Solutions Architect — Associate": ("all", ["AWS Certified Solutions Architect - Associate"]),
        "AWS CloudOps Engineer - Associate": ("all", ["AWS Certified CloudOps Engineer - Associate"]),
    }),
    # Fourteenth and fifteenth families (S572, 2026-11-04): NWCG and the State Water Resources Control Board, one catalog
    # spelling each. The Board's catalog rows carry no grade, so a title whose exhibits name a grade (D2, T3, wastewater
    # grade II) holds its operator row, as a D1.1 qualification holds the code's row; a title naming certifications
    # joined by "or" holds any of them. Left out: "Water Treatment Facilities" (its exhibits name two issuers) and every
    # NWCG course title but S-212. The S-130/S-190 course is the training for Firefighter Type 2, and the position also
    # needs a task book, so no course title is pointed at the position.
    "NWCG": (("National Wildfire Coordinating Group",), {
        "Wildland Fire Chainsaws (S-212)": ("all", ["Wildland Fire Chainsaws"]),
    }),
    "SWRCB": (("California State Water Resources Control Board",), {
        "Wastewater Treatment 1": ("all", ["Wastewater Treatment Plant Operator"]),
        "Wastewater Treatment 2": ("all", ["Wastewater Treatment Plant Operator"]),
        "Water Treatment 1": ("all", ["Water Treatment Operator"]),
        "Water Treatment 2": ("all", ["Water Treatment Operator"]),
        "Water Treatment Operator Grade T2": ("all", ["Water Treatment Operator"]),
        "Water Distribution Operator 2": ("all", ["Distribution System Operator"]),
        "Water Distribution Operator Grade D2": ("all", ["Distribution System Operator"]),
        "Water Distribution Operator Grade D2, D3, D4, or D5": ("all", ["Distribution System Operator"]),
        "Water Treatment Operator Grade T3 / Distribution Grade D3": ("all", ["Water Treatment Operator",
                                                                               "Distribution System Operator"]),
        "Water and Wastewater Mathematics 1": ("any", ["Water Treatment Operator", "Distribution System Operator",
                                                       "Wastewater Treatment Plant Operator"]),
        "Water/Wastewater Operator Certification": ("any", ["Water Treatment Operator", "Distribution System Operator",
                                                            "Wastewater Treatment Plant Operator"]),
    }),
    # Sixteenth to eighteenth families (S573, 2026-11-04): the International Association for Identification, Intuit and
    # the California Department of Real Estate. Each IAI certification holds the catalog's row for its discipline (the
    # catalog lists the discipline, not the CCSI/CSCSA level). Left out: the ESCO Master Specialist titles (the catalog
    # lists the professional-level exams and the Hands-On credential, never the written Master Specialist), the NFPA
    # titles (their exhibits name Cal-JAC, ICC and SFT too), "Intuit QuickBooks Online Certified User" (no catalog row
    # for the Online exam), and the QuickBooks and real estate course titles, which a college issues.
    "IAI": (("International Association for Identification", "International Association for Identification (IAI)"), {
        "Certified Bloodstain Pattern Analyst (CBPA)": ("all", ["Bloodstain Pattern Examiner Certification"]),
        "Certified Crime Scene Investigator (CCSI)": ("all", ["Crime Scene Certification"]),
        "Certified Footwear Examiner (CFE)": ("all", ["Footwear Certification"]),
        "Certified Forensic Photographer (CFP)": ("all", ["Forensic Photography & Imaging Certification"]),
        "Certified Latent Print Examiner (CLPE)": ("all", ["Latent Print Certification"]),
    }),
    "Intuit": (("Intuit", "Intuit, Inc."), {
        "Intuit Certified Bookkeeping Professional": ("all", ["Intuit Certified Bookkeeping Professional"]),
        "Intuit QuickBooks Certified User": ("all", ["Intuit QuickBooks Certified User"]),
    }),
    "DRE": (("California Department of Real Estate",), {
        "California Real Estate Broker License": ("all", ["Real Estate Broker License"]),
        "California Real Estate Salesperson License": ("all", ["Real Estate Salesperson"]),
    }),
}
HAND_ISSUER = {sp: fam for fam, (spellings, _) in HAND.items() for sp in spellings}
HAND_TITLE = {ut: fam for fam, (_, table) in HAND.items() for ut in table}


def catalog_vendor():
    """The catalog's CompTIA, Cisco, Microsoft, FAA and HAND rows (each issuer's spellings as one), by (issuer, name); a name listed twice keeps its lowest id."""
    rows = json.loads(CATALOG.read_text(encoding="utf-8"))["credentials"]
    out = {}
    for r in sorted(rows, key=lambda r: (len(r["id"]), r["id"])):
        issuer = FAA_ISSUER if r.get("issuer") in FAA_ISSUER_SPELLINGS else HAND_ISSUER.get(r.get("issuer"), r.get("issuer"))
        if issuer in VENDOR_ISSUERS + (FAA_ISSUER,) + tuple(HAND):
            out.setdefault((issuer, r["name"]), {"id": r["id"], "name": r["name"], "issuer": issuer})
    return out


CODE = re.compile(r"\b([A-Z]{1,3}\d{1,2})\b")
FILLER = {"certification", "any", "bundle", "and"}
RANGE = re.compile(r"\b([A-Z]{1,2})(\d{1,2})\s*[–-]\s*(?:[A-Z]{1,2})?(\d{1,2})\b")


def build():
    names = ase_names()
    by_code, dupes = catalog_ase()
    exams = catalog_exams()
    vendor = catalog_vendor()
    rows, generated = load_reference()
    certs, links = {}, {}
    unmatched_codes = set()

    def cert_for(code):
        c = by_code.get(code)
        if not c:
            unmatched_codes.add(code)
            return None
        certs[c["id"]] = {"code": code, "name": names.get(code) or c["name"], "catalog_name": c["name"],
                          "issuer": ASE_ISSUER, "family": "ASE"}
        return c["id"]

    for r in rows:
        ut = r.get("ut") or ""
        if ut in VENDOR or ut in FAA or ut in HAND_TITLE:
            if ut in HAND_TITLE:
                issuer = HAND_TITLE[ut]
                rule, wanted = HAND[issuer][1][ut]
            else:
                rule, wanted = VENDOR[ut] if ut in VENDOR else FAA[ut]
                issuer = FAA_ISSUER if ut in FAA else next(v for v in VENDOR_ISSUERS if ut.startswith(v))
            ids, unresolved = [], []
            for name in wanted:
                c = vendor.get((issuer, name))
                if c:
                    certs[c["id"]] = {"code": None, "name": c["name"], "catalog_name": c["name"],
                                      "issuer": HAND[issuer][0][-1] if issuer in HAND else issuer,
                                      "family": "FAA" if issuer == FAA_ISSUER else issuer}
                    if c["id"] not in ids:
                        ids.append(c["id"])
                else:
                    unresolved.append(name + " (not in the catalog)")
            if not wanted:
                unresolved.append(ut + " (names no one certification)")
            links[ut] = {"relation": "holds", "rule": rule if len(ids) > 1 else "all", "certs": ids}
            if unresolved:
                links[ut]["unresolved"] = unresolved
            continue
        fam = EXAM_PREFIX.match(ut)
        if fam:
            parts = [p.strip() for p in re.split(r"\s+or\s+(?=(?:AP|CLEP|IB) )", ut)]
            ids, unresolved = [], []
            for part in parts:
                # The catalog keys a row by its core name, so an IB Language A exam written in another
                # language is the same row as the exam itself; the reference keeps the split, the link
                # points both at the one exam.
                e = exams.get(part) or exams.get(part.replace(" (Non-English)", ""))
                if e:
                    certs[e["id"]] = {"code": None, "name": e["name"], "catalog_name": e["name"],
                                      "issuer": e["issuer"], "family": fam.group(1)}
                    ids.append(e["id"])
                else:
                    unresolved.append(part + " (names no one official exam)" if len(parts) == 1 else part)
            links[ut] = {"relation": "holds", "rule": "any" if len(parts) > 1 else "all", "certs": ids}
            if unresolved:
                links[ut]["unresolved"] = unresolved
            continue
        if re.match(r"^ASE\b", ut):
            body = re.sub(r"^ASE\s*(Bundle)?\s*[—–-]?\s*", "", ut)
            # The tests named: ranges first (A1–A8 is A1 to A8), then single codes, anywhere in the title.
            found, rest = [], body
            for m in RANGE.finditer(body):
                found += [m.group(1) + str(n) for n in range(int(m.group(2)), int(m.group(3)) + 1)]
            rest = RANGE.sub(" ", body)
            found += [m.group(1) for m in CODE.finditer(rest)]
            ids, unresolved = [], []
            for code in dict.fromkeys(found):
                if code not in names:
                    continue
                cid = cert_for(code)
                if cid:
                    if cid not in ids:
                        ids.append(cid)
                else:
                    unresolved.append(code + " (an ASE test the catalog does not list)")
            # Words in the code list that name no ASE test: another family's cert, kept for that family.
            head = re.split(r"\s+[—–]\s+", body)[0]
            for part in re.split(r"[,+()]|\bor\b", RANGE.sub(" ", head)):
                part = part.strip(" .")
                if part and not CODE.search(part) and part.lower() not in FILLER:
                    unresolved.append(part + " (not in the catalog)" if not ids and part == head.strip() else part)
            if ids or unresolved:
                links[ut] = {"relation": "holds", "rule": "any" if re.search(r"\b(?:or|any)\b", head) else "all", "certs": ids}
                if unresolved:
                    links[ut]["unresolved"] = unresolved
            continue
        m = re.search(r"\(ASE\s+([A-Z]{1,3}\d{1,2})\b([^)]*)\)", ut)
        if m and m.group(1) in names:
            cid = cert_for(m.group(1))
            if cid:
                # "Brakes (ASE A5)", the certification's name first and nothing after the code (Sam's ruling of
                # 2026-11-11, kb/cert_naming.py), is the certification: it holds the test. A course name with the
                # test and its words in parentheses is the older aligned form.
                links[ut] = {"relation": "aligned" if m.group(2).strip() else "holds", "rule": "all", "certs": [cid]}

    holds = [u for u, l in links.items() if l["relation"] == "holds"]
    bundles = [u for u in holds if len(links[u]["certs"]) > 1]
    return {
        "schema": 1,
        "_what": "Which certifications each canonical exhibit title holds (or is aligned to), by the industry credential "
                 "catalog's ids. Built by kb/_build_exhibit_cert_links.py; its docstring states the rules. Families: ASE, AP, CLEP, IB, CompTIA, Cisco, Microsoft, FAA, Autodesk, NCCER, ASME, PMI, ICC, CDPH, EMSA, AWS-Welding, Amazon.",
        "_reference_generated_at": generated,
        "counts": {"certs_linked": len(certs), "titles_linked": len(links), "holds": len(holds), "bundles": len(bundles),
                   "aligned": len(links) - len(holds), "codes_not_in_catalog": sorted(unmatched_codes)},
        "catalog_duplicates": dupes,
        "certs": dict(sorted(certs.items())),
        "links": dict(sorted(links.items())),
    }


def main():
    data = build()
    text = json.dumps(data, ensure_ascii=False, indent=1) + "\n"
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != text:
            print("kb/exhibit_cert_links.json is STALE — run: python3 kb/_build_exhibit_cert_links.py")
            sys.exit(1)
        print("kb/exhibit_cert_links.json ok")
        return
    OUT.write_text(text, encoding="utf-8")
    c = data["counts"]
    print(f"wrote {OUT.relative_to(ROOT)}: {c['titles_linked']} titles to {c['certs_linked']} certs "
          f"({c['holds']} hold, {c['bundles']} bundles, {c['aligned']} aligned); not in the catalog: {c['codes_not_in_catalog']}")


if __name__ == "__main__":
    main()

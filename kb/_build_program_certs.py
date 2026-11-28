#!/usr/bin/env python3
"""The industry certifications a program connects to, for CPL Pathways' catalog-record view (Sam, 2026-11-27).

WHY. Sam, 2026-11-27: "when you find that there are also stackable industry certs associated with a program though a
CPL exhibit or becasue the program teaches to a cert like CompTIA or both, can you note it with a chip that clicks to a
sidebar for deatils?" The catalog-record view fetches one small file per college, kb/status/program_certs/<slug>.json,
and shows the words "Industry certs" on the program card when the program has either group below.

THE RECORDS. The record set and skip rules of kb/_build_program_ladders.py (every usable record under
kb/program_requirements_college/<slug>/records/, the pilot's records standing in for their college folder's copy), and
its course set: every course code in the blocks, alternatives included, through file_code.

THE TWO GROUPS, per program.
  earns_cpl_here  A credential on the public adoption page (library/adopt/adopt_data.json, settled credentials only)
                  whose CPL types include "Industry Certification" and whose credit lines at THIS college name a course
                  in the program's course set. The course codes come from the credential's full lines in
                  kb/exhibits_adoption.json (matched by credential title and college name), and from the adoption
                  page's own ";"-joined lines where that file lacks them; each code goes through file_code, so
                  "Computer Information Systems (CIS) 062A" reads CIS 062A. Codes compare with spaces removed and
                  leading zeros of the number dropped (CIS 062A = CIS 62A; CYBR 106 F = CYBR 106F). An entry: title t,
                  issuer i, the program's matched courses, and the credential's exhibit codes built at this college
                  (adopt_data's m rows whose college index is this college) that pass MAP's ?Exhibit= pattern
                  (EXHIBIT_CODE, the same test cpl_pathways.js applies; docs/kb-notes/
                  reference-map-landing-page-exhibit-parameter.md). A code that fails it is left out.
  prepares_for    A certification the program's catalog text names: the record's program outcomes and careers, the
                  words the catalog printed. The extractor's own notes are never read. A closed list (CERTS below) of
                  certification names, each a regular expression with word boundaries and its upper-case acronym
                  matched case-sensitively (ASE never inside ASEAN, CNA never inside CNAME). A name that is also a job
                  title (EMT, Paramedic, Pharmacy Technician, phlebotomist) counts only when the same line also says
                  certif-, licens- or registry; a body whose standards a line can cite without naming its
                  certification (AWS, ASE, I-CAR, the Board of Barbering and Cosmetology, POST, the Department of Real
                  Estate) counts only when the line also names a certification, license, exam or test. NATEF is not on
                  the list: it accredits the program, and its lines cite its standards. The matched line is quoted
                  verbatim, trimmed to about 200 characters around the match.
  trained_by      The agencies that train a credential giving credit at THIS college on a course in the program's
                  course set (any CPL type): kb/credentials.json's training_agency on the credential's first record,
                  a training committee only (TRAINER_OK), the credit lines read as for earns_cpl_here. An entry: name a, chip words s, each credential t with
                  its matched courses, and the courses together. See read_trainers and trained_by below.
  both            A certification in both groups. The test: the closed list's pattern for a prepares_for entry also
                  matches the earned credential's issuer and title ("CompTIA" + "CompTIA A+ ..." matches the A+
                  entry). Both entries carry "both": true.

THE MEASURE (S652's matcher rule) is kb/status/program_certs/_measure.md: the counts, the hand-checked sample of hits
and of misses, and the precision and recall they give. Re-measure when CERTS changes.

Each file: {"college", "slug", "programs": {control_number: {"earns_cpl_here", "prepares_for", "trained_by"}}}, only
programs with an entry. kb/status/program_certs/index.json maps each college's name to its slug. No clock is read, so
the same inputs write the same bytes.

Usage: python3 kb/_build_program_certs.py            (write every file)
       python3 kb/_build_program_certs.py --check    (fail if a committed file is stale or missing)
"""
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import _build_program_ladders as L  # noqa: E402  (the record set, its skip rules and its course set)
from _program_requirements_college import file_code  # noqa: E402  (the one rewrite of a stored code)

ADOPT = os.path.join("library", "adopt", "adopt_data.json")
ADOPTION = os.path.join("kb", "exhibits_adoption.json")
CREDENTIALS = os.path.join("kb", "credentials.json")
OUT_DIR = os.path.join("kb", "status", "program_certs")
INDUSTRY = "Industry Certification"
QUOTE = 200
# MAP's own test for its landing page's ?Exhibit= value (cpl_pathways.js EXHIBIT_CODE, read from MAP's bundle, S744).
EXHIBIT_CODE = re.compile(r"^[A-Za-z0-9]+(?:-[A-Za-z0-9]+){2,}$")
# The context a line must also carry for a name that is also a job title (EMT, Paramedic, Pharmacy Technician), or a
# body whose standards a line can cite without naming its certification (AWS, ASE, the Board of Barbering and
# Cosmetology, POST). A line that names only the body's standards or symbols is no hit.
CONTEXT = re.compile(r"certif|licens|\bexam|registry|\bboard exam", re.I)
TESTED = re.compile(r"certif|licens|\bexam|\btests?\b|qualif|study guide", re.I)
WELD_TESTED = re.compile(r"(?=.*weld)(?=.*(?:certif|licens|\bexam|\btests?\b|qualif))", re.I | re.S)
LICENSED = re.compile(r"certif|licens|registry|\bNREMT\b|National Registry", re.I)

I = re.I


def _c(pattern, flags=0):
    return re.compile(pattern, flags)


# The closed list: key, the name shown, the issuer, the pattern, and the context the same line must also carry (None
# for a name that is a certification by itself). A key with a family prefix ("comptia") is dropped when a more
# specific key of that family ("comptia_aplus") matched; SUPERSEDED drops a key when the named other key matched.
CERTS = [
    ("comptia_aplus", "CompTIA A+", "CompTIA", _c(r"\bCompTIA\s+A\+|\bA\+(?=[^.;]{0,40}(?:certif|exam|Network\+|Security\+))", I), None),
    ("comptia_network", "CompTIA Network+", "CompTIA", _c(r"\bNetwork\+", I), None),
    ("comptia_security", "CompTIA Security+", "CompTIA", _c(r"\bSecurity\+", I), None),
    ("comptia_linux", "CompTIA Linux+", "CompTIA", _c(r"\bLinux\+", I), None),
    ("comptia_cloud", "CompTIA Cloud+", "CompTIA", _c(r"\bCloud\+", I), None),
    ("comptia_cysa", "CompTIA CySA+", "CompTIA", _c(r"\bCySA\+", I), None),
    ("comptia_server", "CompTIA Server+", "CompTIA", _c(r"\bServer\+", I), None),
    ("comptia_project", "CompTIA Project+", "CompTIA", _c(r"\bProject\+", I), None),
    ("comptia_itf", "CompTIA IT Fundamentals (ITF+)", "CompTIA", _c(r"\bITF\+|\bIT Fundamentals\+", I), None),
    ("comptia", "CompTIA certification", "CompTIA", _c(r"\bCompTIA\b", I), None),
    ("cisco_ccna", "Cisco CCNA", "Cisco", _c(r"\bCCNA\b|\bCCENT\b|\bCisco Certified\b"), None),
    ("microsoft_mos", "Microsoft Office Specialist", "Microsoft",
     _c(r"\bMicrosoft Office Specialist\b|\bMOS\b(?= (?:certification|exam))|\bMicrosoft Certified\b|\bMCSA\b|\bMCSE\b", I), None),
    ("aws_cloud", "AWS Certified (cloud)", "Amazon Web Services",
     _c(r"\bAWS (?:Certified )?(?:Cloud Practitioner|Solutions Architect|Developer|SysOps)|\bAWS Certified\b(?! Weld)|\bAmazon Web Services\b[^.;]{0,40}certif", I), None),
    ("salesforce", "Salesforce certification", "Salesforce",
     _c(r"\bSalesforce\b[^.;]{0,40}\bcertif|\bcertif\w*[^.;]{0,40}\bSalesforce\b", I), None),
    ("quickbooks", "QuickBooks Certified User", "Intuit",
     _c(r"\bQuickBooks (?:Certified User|certification|ProAdvisor)\b|\bIntuit (?:Certified|QuickBooks Certified)", I), None),
    ("adobe", "Adobe Certified Professional", "Adobe", _c(r"\bAdobe Certified\b|\bACA\b(?= (?:certification|exam))", I), None),
    ("autodesk", "Autodesk Certified", "Autodesk", _c(r"\bAutodesk Certified\b", I), None),
    ("solidworks", "SOLIDWORKS certification (CSWA, CSWP)", "Dassault Systemes",
     _c(r"\bCSWA\b|\bCSWP\b|\bSolidWorks (?:certification|Associate|Professional)\b", I), None),
    ("leed", "LEED Green Associate", "U.S. Green Building Council",
     _c(r"\bLEED\b[^.;]{0,30}(?:Green Associate|AP\b|exam|accredit)|\bbecom\w* LEED\b", I), None),
    ("gisp", "GIS Professional (GISP)", "GIS Certification Institute", _c(r"\bGISP\b"), None),
    ("ase", "ASE certification", "National Institute for Automotive Service Excellence (ASE)",
     _c(r"\bASE\b|\bAutomotive Service Excellence\b"), TESTED),
    ("icar", "I-CAR training credential", "I-CAR", _c(r"\bI-CAR\b", I), TESTED),
    ("smog", "Smog Check Inspector or Repair Technician license", "California Bureau of Automotive Repair",
     _c(r"\bsmog\b[^.;]{0,40}\b(?:licens|certif|inspector|technician)|\bBureau of Automotive Repair\b|(?-i:\bBAR\b)(?= (?:licens|certif|exam))", I), None),
    ("epa608", "EPA Section 608 certification", "U.S. Environmental Protection Agency",
     _c(r"\bEPA\b[^.;]{0,25}\b608\b|\bSection 608\b|\b(?:EPA|Environmental Protection Agency)\b[^.;]{0,40}certif|\bRefrigerant (?:Transition and )?Recovery Certification\b", I),
     _c(r"certif|licens|\bexam|\btests?\b", I)),
    ("nate", "NATE certification (HVAC)", "North American Technician Excellence", _c(r"\bNATE\b"), None),
    ("aws_weld", "AWS welding certification", "American Welding Society",
     _c(r"\bAmerican Welding Society\b|(?-i:\bAWS\b)(?! (?:Certified )?(?:Cloud|Solutions|Developer|SysOps))|\bD1\.1\b", I), WELD_TESTED),
    ("nccer", "NCCER credential", "NCCER", _c(r"\bNCCER\b"), None),
    ("electrician", "California General Electrician certification", "California Division of Apprenticeship Standards",
     _c(r"\bjourney(?:man|level)\b[^.;]{0,60}\b(?:certif|exam|licens)|\b(?:General|State Certified) Electrician\b|\bElectrician Certific\w*\b", I), None),
    ("appraiser", "Real estate appraiser license", "California Bureau of Real Estate Appraisers",
     _c(r"\bBREA\b|\bBureau of Real Estate Appraisers\b|\b(?:Trainee|Residential|Certified Residential|Certified General) (?:Appraiser )?License\b|\boffice of Real Estate Appraisers\b", I), None),
    ("fcc", "FCC General Radiotelephone Operator License", "Federal Communications Commission",
     _c(r"\bFCC\b[^.;]{0,60}\blicens|\bGeneral Radiotelephone\b", I), None),
    ("food_safety", "Food safety certification (HACCP, PCQI)", "a food safety certifying body",
     _c(r"\bHACCP\b[^.;]{0,80}\bcertif|\bcertif\w*[^.;]{0,60}\bHACCP\b|\bPCQI\b"), None),
    ("cpr", "CPR and First Aid certification", "American Heart Association or American Red Cross",
     _c(r"\b(?:CPR|BLS|ACLS|PALS)\b[^.;]{0,40}\bcertif|\bcertif\w*[^.;]{0,30}\b(?:CPR|BLS|ACLS|PALS)\b|\bcardio(?:vascular)? life support certif", I), None),
    ("osha", "OSHA 10- or 30-hour card", "U.S. Occupational Safety and Health Administration",
     _c(r"\bOSHA[- ]?(?:10|30)\b|\bOSHA\b[^.;]{0,30}\b(?:10|30)[- ]hour|\bOSHA\b[^.;]{0,20}\b(?:card|certification)\b", I), None),
    ("faa_drone", "FAA Part 107 Remote Pilot certificate", "Federal Aviation Administration",
     _c(r"\bPart 107\b|\bremote pilot\b|\b(?:sUAS|drone|unmanned)\b[^.;]{0,80}\b(?:licens|certif|exam)|\bFAA\b[^.;]{0,140}\b(?:sUAS|drone|unmanned)\b", I), None),
    ("faa_ap", "FAA Airframe and Powerplant certificate", "Federal Aviation Administration",
     _c(r"\bAirframe and Powerplant\b|\bA&P\b(?=[^.;]{0,40}(?:certif|licens|exam|test|mechanic))|\bFAA\b[^.;]{0,60}(?:certif|licens|exam|test)", I), None),
    ("uscg", "U.S. Coast Guard license", "U.S. Coast Guard",
     _c(r"\bCoast Guard\b[^.;]{0,40}\b(?:licens|credential|certif)", I), None),
    ("cdl", "Commercial Driver License", "California DMV", _c(r"\bCommercial Driver'?s?'? License\b|\bCDL\b", I), None),
    ("servsafe", "ServSafe certification", "National Restaurant Association", _c(r"\bServSafe\b|\bFood Protection Manager\b", I), None),
    ("dss", "Dietetic Service Supervisor", "California Department of Public Health",
     _c(r"\bDietetic Service Supervisor\b|\bDSS\b(?=[^.;]{0,30}(?:certif|licens|requirement))", I), None),
    ("water", "Water treatment or distribution operator certificate", "California State Water Resources Control Board",
     _c(r"\b(?:water|wastewater)\b[^.;]{0,50}\b(?:licens|certif|operator exam)|\blicens\w*[^.;]{0,60}\bwater (?:industry|treatment|distribution)\b|\bState Water Resources Control Board\b|\b(?:Treatment|Distribution) Operator\b", I), CONTEXT),
    ("pesticide", "Pesticide applicator license", "California Department of Pesticide Regulation",
     _c(r"\bpesticide (?:applicator|advisor|adviser)\b|\bpest management\b[^.;]{0,80}\blicens|\bDepartment of Pesticide Regulation\b|\bQualified Applicator\b", I), _c(r"certif|licens|\bexam|applicator", I)),
    ("nremt", "NREMT certification", "National Registry of Emergency Medical Technicians",
     _c(r"\bNREMT\b|\bNational Registry\b", I), None),
    ("emt", "EMT certification", "California EMS Authority",
     _c(r"\bEMTs?(?:-B|-Basic|-1)?\b|\bEmergency Medical Technicians?\b"), LICENSED),
    ("paramedic", "Paramedic license", "California EMS Authority", _c(r"\bParamedics?\b", I), LICENSED),
    ("ecg", "ECG or telemetry technician certification", "a national certifying body",
     _c(r"\b(?:ECG|EKG|telemetry)\b[^.;]{0,50}\bcertif", I), None),
    ("nclex_rn", "NCLEX-RN (Registered Nurse license)", "National Council of State Boards of Nursing",
     _c(r"\bNCLEX(?:-RN)?\b(?!-[PV]N)"), None),
    ("nclex_pn", "NCLEX-PN (Licensed Vocational Nurse)", "National Council of State Boards of Nursing",
     _c(r"\bNCLEX-[PV]N\b|\bLicensed Vocational Nurs(?:es?|ing)\b|\bLVN licens", I), None),
    ("cna", "Certified Nursing Assistant (CNA)", "California Department of Public Health",
     _c(r"\bCNAs?\b|\bCertified Nurs(?:e|ing) Assistants?\b|\bNurse Assistant Certification\b|\b[Nn]urse [Aa]ssistant\b[^.;]{0,40}certif"), None),
    ("hha", "Home Health Aide certification", "California Department of Public Health",
     _c(r"\bCertified Home Health Aides?\b|\bHome Health Aide\b[^.;]{0,30}certif|\bHHA\b"), None),
    ("phlebotomy", "Certified Phlebotomy Technician (CPT)", "California Department of Public Health",
     _c(r"\bPhlebotom(?:y|ist)\b|\bCPT[- ]?(?:I|1)\b", I), LICENSED),
    ("pharm_tech", "Pharmacy Technician (PTCB)", "Pharmacy Technician Certification Board",
     _c(r"\bPTCB\b|\bPTCE\b|\bCPhT\b|\bPharmacy Technicians?\b"), LICENSED),
    ("medical_assistant", "Certified Medical Assistant", "American Association of Medical Assistants",
     _c(r"\bCertified (?:Clinical |Administrative )?Medical Assistants?\b|\bRegistered Medical Assistants?\b|\bCCMA\b|\bCAMA\b|\bAAMA\b"), None),
    ("rda", "Registered Dental Assistant (RDA)", "Dental Board of California",
     _c(r"\bRegistered Dental Assistants?\b|(?-i:\bRDA\b)(?!EF)|\blicensed dental assistants?\b", I), None),
    ("rdh", "Registered Dental Hygienist license", "Dental Hygiene Board of California",
     _c(r"\bRegistered Dental Hygienists?\b|\bRDH\b|\bdental hygiene\b[^.;]{0,40}\blicens", I), None),
    ("pta", "Physical Therapist Assistant license (NPTE)", "Physical Therapy Board of California",
     _c(r"\bNPTE\b|\bPhysical Therapist Assistant\b[^.;]{0,40}\blicens"), None),
    ("cota", "Certified Occupational Therapy Assistant (COTA)", "NBCOT",
     _c(r"\bCOTA\b|\bCertified Occupational Therapy Assistants?\b|\bNBCOT\b"), None),
    ("athletic_trainer", "Certified Athletic Trainer (BOC)", "Board of Certification for the Athletic Trainer",
     _c(r"\bCertified Athletic Trainers?\b|\bBOC\b(?=[^.;]{0,30}(?:exam|certif))"), None),
    ("paralegal", "Certified Paralegal (NALA)", "NALA", _c(r"\bNALA\b|\bCertified Paralegal\b(?= Exam)"), None),
    ("radiologic", "ARRT certification", "American Registry of Radiologic Technologists", _c(r"\bARRT\b"), None),
    ("respiratory", "NBRC credential (CRT, RRT)", "National Board for Respiratory Care",
     _c(r"\bNBRC\b|\bRRT\b|\bCRT\b(?= (?:exam|credential))"), None),
    ("coding", "Medical coding certification (CPC, CCS)", "AAPC or AHIMA", _c(r"\bAAPC\b|\bAHIMA\b|\bCPC\b|\bCCS\b(?!-)"), None),
    ("cosmetology", "Barbering and Cosmetology license", "California Board of Barbering and Cosmetology",
     _c(r"\bBoard of Barber(?:ing)? and Cosmetology\b|\b(?:cosmetology|esthetic|esthetician|barber|barbering|manicurist)\b[^.;]{0,40}\blicens", I), CONTEXT),
    ("real_estate", "Real estate license", "California Department of Real Estate",
     _c(r"\breal estate (?:salesperson|broker)'?s?'? (?:license|licensing|exam)|\bDepartment of Real Estate\b|\bDRE\b", I), CONTEXT),
    ("firefighter", "State Fire Training certification (Firefighter I, Fire Officer)", "California State Fire Marshal",
     _c(r"\bState Fire Marshal\b|\bFire ?fighter (?:I|1)\b(?! ?I)|\bIFSAC\b|\bPro Board\b|\b(?:Chief |Company )?Fire (?:Company )?Officer\b[^.;]{0,60}\b(?:certif|Training Standard)|\bcertified\W{1,3}Fire Officer\b|\bState Fire Training\b[^.;]{0,60}(?:certif|standard)", I), None),
    ("post", "POST certificate", "California Commission on Peace Officer Standards and Training",
     _c(r"\bPOST\b|\bPeace Officer Standards and Training\b"), _c(r"certif|academy|Basic Course|eligib", I)),
    ("cadc", "Alcohol and drug counselor certification (CADC)", "CCAPP or CAADE",
     _c(r"\bCADC\b|\bCATC\b|\bCAADE\b|\bCCAPP\b|\bCertified (?:Alcohol and Drug|Addiction Treatment) Counselor\b"),
     _c(r"certif|licens|\bexam|registr", I)),
    ("shrm", "SHRM certification (SHRM-CP, SHRM-SCP)", "Society for Human Resource Management", _c(r"\bSHRM\b"), None),
    ("cpa", "Certified Public Accountant (CPA)", "California Board of Accountancy",
     _c(r"\bCertified Public Account\w*\b|\bCPA\b(?=[^.;]{0,30}(?:exam|licens|certif))"), None),
    ("google", "Google Career Certificate", "Google", _c(r"\bGoogle (?:Career )?Certificates?\b|\bGoogle\b[^.;]{0,30}\bcertif", I), None),
    ("fitness", "Personal trainer certification (NASM, ACE, NSCA)", "NASM, ACE or NSCA",
     _c(r"\bNASM\b|\bNSCA\b|\bACSM\b|\bACE\b(?=[^.;]{0,40}(?:certif|exam|trainer))"), None),
    ("clca", "CLCA Certified Landscape Technician", "California Landscape Contractors Association",
     _c(r"\bCLCA\b|\bCertified Landscape Technician\b"), None),
    ("acf", "ACF culinary certification (CEC, CC)", "American Culinary Federation",
     _c(r"\bAmerican Culinary Federation\b|\bACF\b|\bCertified Executive Chef\b|\bCertified (?:Sous )?Chef\b|\bCertified Culinarian\b"), None),
    ("medgas", "Medical gas certification (NITC, ASSE 6010)", "NITC or ASSE",
     _c(r"\bNITC\b|\bNational Inspection Testing Certification\b|\bASSE\b[- ]?60\d\d"), None),
    ("cdm", "Certified Dietary Manager (CDM)", "Certifying Board for Dietary Managers",
     _c(r"\bCertifying Board for Dietary Managers\b|\bCertified Dietary Manager\b|\bCDM\b(?=[^.;]{0,30}(?:exam|certif|credential))"), None),
    ("child_permit", "Child Development Permit", "California Commission on Teacher Credentialing",
     _c(r"\bChild Development (?:Associate Teacher |Teacher |Master Teacher |Site Supervisor |Program Director )?Permit\b|\b(?:Assistant|Associate|Master) Teacher Permit\b", I), None),
    ("court_reporter", "Certified Shorthand Reporter (CSR)", "Court Reporters Board of California",
     _c(r"\bCertified Shorthand Reporters?\b|\bCourt Reporters Board\b|\bCSR\b(?=[^.;]{0,30}(?:exam|licens|certif))", I), None),
    ("cfe", "Certified Fraud Examiner (CFE)", "Association of Certified Fraud Examiners",
     _c(r"\bCertified Fraud Examiners?\b|\bCFE\b"), None),
    ("red_cross", "American Red Cross instructor or lifeguard certification", "American Red Cross",
     _c(r"\bAmerican Red Cross\b[^.;]{0,60}\b(?:certif|instructor|lifeguard)|\bcertified\b[^.;]{0,40}\bRed Cross\b", I), None),
    ("ipc", "IPC certification (electronics)", "IPC", _c(r"\bIPC[- ]?(?:A-?610|J-STD|7711|certif)", I), None),
    ("ets_cet", "Electronics Technician certification (ETA)", "ETA International",
     _c(r"\bETA International\b|\bCertified Electronics Technician\b", I), None),
]
SUPERSEDED = {"faa_ap": "faa_drone"}
CERT_BY_KEY = {c[0]: c for c in CERTS}


def find_certs(line):
    """[(key, start, end)] for each closed-list certification this line names, a family's general key dropped when
    a specific one of that family matched."""
    text = str(line or "")
    hits = []
    for key, _name, _issuer, pat, needs in CERTS:
        m = pat.search(text)
        if not m:
            continue
        if needs is not None and not needs.search(text):
            continue
        hits.append((key, m.start(), m.end()))
    keys = {k for k, _, _ in hits}
    return [h for h in hits if not any(o != h[0] and o.startswith(h[0] + "_") for o in keys)
            and SUPERSEDED.get(h[0]) not in keys]


def quote(line, start, end):
    s = re.sub(r"\s+", " ", str(line)).strip()
    if len(s) <= QUOTE:
        return s
    # Re-find the span in the collapsed text (spaces folded): the match's own words.
    word = re.sub(r"\s+", " ", str(line)[start:end]).strip()
    at = max(0, s.find(word))
    lo = max(0, at - (QUOTE - len(word)) // 2)
    hi = min(len(s), lo + QUOTE)
    lo = max(0, hi - QUOTE)
    if lo > 0:
        sp = s.find(" ", lo)
        lo = sp + 1 if 0 <= sp < at else lo
    if hi < len(s):
        sp = s.rfind(" ", at + len(word), hi)
        hi = sp if sp > 0 else hi
    return ("…" if lo > 0 else "") + s[lo:hi].strip() + ("…" if hi < len(s) else "")


def prepares_for(program):
    """The closed-list certifications a program's outcomes and careers name, the first line naming each quoted."""
    out, seen = [], set()
    for field in ("outcomes", "careers"):
        for line in program.get(field) or []:
            if not isinstance(line, str):
                continue
            for key, a, b in find_certs(line):
                if key in seen:
                    continue
                seen.add(key)
                _k, name, issuer, _p, _n = CERT_BY_KEY[key]
                out.append({"key": key, "name": name, "issuer": issuer, "from": field, "quote": quote(line, a, b)})
    return out


# ── Course codes ──────────────────────────────────────────────────────────────────────────
def compact(code):
    """A code with spaces removed and the number's leading zeros dropped: CIS 062A, CIS62A -> CIS62A."""
    k = re.sub(r"\s+", "", str(file_code(code) or "").strip().upper())
    return re.sub(r"(?<=[A-Z&/])0+(?=\d)", "", k)


MORE = re.compile(r"^\s*and \d+ more\s*$", I)


def line_codes(text):
    """The course codes in an adoption page line: 'CIS 75: 3 hours in ...; Computer Information Systems (CIS) 062A:
    ...; and 2 more' -> ['CIS 75', 'CIS 062A']."""
    out = []
    for part in str(text or "").split(";"):
        if MORE.match(part) or ":" not in part:
            continue
        code = file_code(part.split(":", 1)[0].strip())
        if code and re.search(r"\d", code):
            out.append(re.sub(r"\s+", " ", code.strip()))
    return out


def read_programs(root):
    """{slug: {"college": name, "programs": {control: {"codes": {compact: printed}, "outcomes", "careers"}}}} over the
    ladders' record set and skip rules."""
    colleges, slug_of = {}, {}
    for cap in sorted(glob.glob(os.path.join(root, L.COLLEGE_RECORDS, "*", "capture.json"))):
        folder = os.path.dirname(cap)
        slug = os.path.basename(folder)
        progs, name = {}, None
        for path in sorted(glob.glob(os.path.join(folder, "records", "*.json"))):
            filed = json.load(open(path, encoding="utf-8"))
            name = name or filed.get("college")
            if L.usable(filed):
                progs[str(filed["control_number"])] = filed
        name = name or json.load(open(cap, encoding="utf-8")).get("college")
        if not name:
            continue
        colleges[slug] = {"college": name, "filed": progs}
        slug_of[name] = slug
    for path in sorted(glob.glob(os.path.join(root, L.PILOT_RECORDS, "*.json"))):
        filed = json.load(open(path, encoding="utf-8"))
        slug = slug_of.get(filed.get("college"))
        if slug and L.usable(filed):
            colleges[slug]["filed"][str(filed["control_number"])] = filed
    out = {}
    for slug, c in colleges.items():
        progs = {}
        for ctl, f in c["filed"].items():
            prog = (f["record"].get("program") or {})
            codes = {}
            for k in sorted(L.course_set(f["record"])):
                codes.setdefault(compact(k), k)
            progs[ctl] = {"codes": codes, "outcomes": prog.get("outcomes") or [], "careers": prog.get("careers") or []}
        out[slug] = {"college": c["college"], "programs": progs}
    return out


def read_earnable(root, lines=None):
    """{college name: [{"t", "i", "codes": [printed], "exhibits": [code]}]} for the adoption page's Industry
    Certification credentials."""
    lines = read_lines(root) if lines is None else lines
    return {college: [{k: e[k] for k in ("t", "i", "codes", "exhibits")} for e in rows if e["industry"]]
            for college, rows in lines.items() if any(e["industry"] for e in rows)}


def read_lines(root):
    """{college name: [{"t", "i", "codes": [printed], "exhibits": [code], "industry": bool}]} for every settled
    credential on the adoption page, each with its credit lines at that college."""
    path = os.path.join(root, ADOPT)
    if not os.path.exists(path):
        return {}
    d = json.load(open(path, encoding="utf-8"))
    types = d.get("types") or []
    ind = {i for i, t in enumerate(types) if t == INDUSTRY}
    names = [c[0] for c in d.get("colleges") or []]
    full = {}
    try:
        adoption = json.load(open(os.path.join(root, ADOPTION), encoding="utf-8"))
        anames = adoption.get("colleges") or []
        for ut, e in (adoption.get("credentials") or {}).items():
            for k, v in (e.get("a") or {}).items():
                lines = v[1] if isinstance(v, list) and len(v) > 1 else []
                codes = [file_code(str(row[0]).strip()) for row in lines or [] if row and row[0]]
                full[(ut, anames[int(k)])] = [re.sub(r"\s+", " ", c.strip()) for c in codes if c and re.search(r"\d", c)]
    except (OSError, ValueError, IndexError):
        full = {}
    out = {}
    for cr in d.get("credentials") or []:
        industry = bool(ind.intersection(cr.get("y") or []))
        for row in cr.get("a") or []:
            ci = row[0]
            if not (isinstance(ci, int) and 0 <= ci < len(names)):
                continue
            college = names[ci]
            codes = full.get((cr.get("t"), college)) or line_codes(row[2] if len(row) > 2 else "")
            ex = []
            for m in cr.get("m") or []:
                xid = str(m[0] or "").strip()
                if len(m) > 1 and m[1] == ci and EXHIBIT_CODE.match(xid) and xid not in ex:
                    ex.append(xid)
            out.setdefault(college, []).append({"t": cr.get("t") or "", "i": cr.get("i") or "", "codes": codes,
                                                "exhibits": ex, "industry": industry})
    return out


# ── Trained by (Sam, 2026-11-27: "yes, this is what we could want to show: Trained by Ironworker JATC").
# kb/credentials.json names a training agency on a credential's first record (training_agency). A program is trained by
# an agency when a credential it trains gives credit at the college on a course in the program's course set. A value
# that names no one ("varies by academy") is left out. Two spellings of one body fold to one entry (Ironworker and
# Ironworkers Joint Apprenticeship Training Committee, with or without "and"), shown in the spelling more credentials
# carry. The short name is the chip's words: a trailing parenthesized acronym (CAL FIRE), else the committee words
# folded to JATC (Ironworker JATC), else the name.
# ONLY TRAINING COMMITTEES (S746). The training_agency field also names one college's site on a credential many colleges
# articulate (AP Biology "trained by" Mater Dei High School at Glendale; Microsoft Office Specialist Excel by the U.S.
# Armed Forces), and neither its confidence nor its source separates those from the sound ones. An apprenticeship's
# training committee trains its own credential wherever it is articulated, so the chip names only an agency whose name
# says it is one (TRAINER_OK); the rest wait on a cleaned field (f-trainer-field-names-one-site-s746).
TRAINER_OK = re.compile(r"\bapprenticeship\b|\btraining committee\b|\bJATC\b", I)
GENERIC = re.compile(r"^\s*Joint Apprenticeship (?:and )?Training Committee(?:\s*\(JATC\))?\s*$", I)
NO_ONE = re.compile(r"^\s*(varies|various|unknown|n/?a\b|none\b|tbd\b)", I)
JATC_WORDS = re.compile(r"\bJoint Apprenticeship (?:and )?Training Committee\b", I)
ACRONYM = re.compile(r"\(([A-Z][A-Z0-9 &.\-]{1,14})\)\s*$")


def read_trainers(root):
    """{credential title: training agency} from kb/credentials.json's first record, names only."""
    try:
        creds = json.load(open(os.path.join(root, CREDENTIALS), encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    out = {}
    for t, recs in creds.items():
        first = recs[0] if isinstance(recs, list) and recs and isinstance(recs[0], dict) else {}
        a = re.sub(r"\s+", " ", str(first.get("training_agency") or "")).strip()
        if a and GENERIC.match(a):
            a = qualified(a, re.sub(r"\s+", " ", str(first.get("issuing_agency") or "")).strip())
        if a and not NO_ONE.match(a) and TRAINER_OK.search(a):
            out[t] = a
    return out


def qualified(generic, issuer):
    """A bare "Joint Apprenticeship Training Committee (JATC)" says whose committee through the issuer: the issuer's
    acronym (IBEW Joint Apprenticeship Training Committee), else the issuer when it is a training committee itself
    (the Carpenters Training Committee for Northern California), else the bare name."""
    m = ACRONYM.search(issuer)
    if m:
        return m.group(1).strip() + " Joint Apprenticeship Training Committee"
    if TRAINER_OK.search(issuer):
        return issuer
    return generic


def spellings(trainers):
    """{agency_key: the spelling most credentials carry}, so a body reads the same on every program card."""
    n = {}
    for a in trainers.values():
        n.setdefault(agency_key(a), {}).setdefault(a, 0)
        n[agency_key(a)][a] += 1
    return {k: sorted(v.items(), key=lambda kv: (-kv[1], kv[0]))[0][0] for k, v in n.items()}


def agency_key(name):
    """Ironworkers Joint Apprenticeship and Training Committee = Ironworker Joint Apprenticeship Training Committee."""
    words = re.findall(r"[a-z0-9]+", name.lower())
    return " ".join(re.sub(r"(?<=[a-z]{3})s$", "", w) for w in words if w != "and")


def short_name(name):
    """The chip's words. Two committees named as one ("Carpenters Training Committee for Northern California /
    Southern California Carpenters Joint Apprenticeship") read as what they share: Carpenters Training Committee."""
    m = ACRONYM.search(name)
    if m:
        return m.group(1).strip()
    if " / " in name:
        head = re.match(r"^(.*?\btraining committee)\b", name.split(" / ")[0], I)
        if head:
            return head.group(1).strip()
    return JATC_WORDS.sub("JATC", name).strip()


def trained_by(p, rows, trainers, spelled=None):
    """The program's training agencies: [{"a": name, "s": short name, "creds": [{"t", "courses"}], "courses"}]."""
    groups = {}
    for e in rows:
        a = trainers.get(e["t"])
        if not a:
            continue
        hit = []
        for code in e["codes"]:
            printed = p["codes"].get(compact(code))
            if printed and printed not in hit:
                hit.append(printed)
        if not hit:
            continue
        g = groups.setdefault(agency_key(a), {"creds": {}})
        have = g["creds"].setdefault(e["t"], [])
        for h in hit:
            if h not in have:
                have.append(h)
    out = []
    spelled = spellings(trainers) if spelled is None else spelled
    for key, g in groups.items():
        name = spelled[key]
        creds = [{"t": t, "courses": c} for t, c in sorted(g["creds"].items(), key=lambda kv: kv[0].lower())]
        courses = []
        for c in creds:
            for h in c["courses"]:
                if h not in courses:
                    courses.append(h)
        out.append({"a": name, "s": short_name(name), "creds": creds, "courses": sorted(courses)})
    out.sort(key=lambda x: (-len(x["courses"]), x["a"].lower()))
    return out


def same_cert(key, earned):
    """Whether the closed list's pattern for key matches an earned credential's issuer and title."""
    c = CERT_BY_KEY.get(key)
    if not c:
        return False
    text = (earned.get("i") or "") + " " + (earned.get("t") or "")
    return bool(c[3].search(text))


def build(root=ROOT, programs=None, earnable=None, lines=None, trainers=None):
    programs = read_programs(root) if programs is None else programs
    if lines is None:
        lines = read_lines(root) if earnable is None else {}
    earnable = read_earnable(root, lines) if earnable is None else earnable
    trainers = read_trainers(root) if trainers is None else trainers
    spelled = spellings(trainers)
    stats = {"programs": 0, "earns": 0, "prepares": 0, "both": 0, "earn_entries": 0, "prep_entries": 0,
             "prep_by_key": {}, "trained": 0, "trained_entries": 0}
    docs = {}
    for slug in sorted(programs):
        c = programs[slug]
        mine = earnable.get(c["college"]) or []
        out = {}
        for ctl in sorted(c["programs"]):
            p = c["programs"][ctl]
            stats["programs"] += 1
            earns = []
            for e in mine:
                hit = []
                for code in e["codes"]:
                    printed = p["codes"].get(compact(code))
                    if printed and printed not in hit:
                        hit.append(printed)
                if hit:
                    earns.append({"t": e["t"], "i": e["i"], "courses": hit, "exhibits": e["exhibits"]})
            earns.sort(key=lambda x: (x["t"].lower(), x["i"].lower()))
            prep = prepares_for(p)
            any_both = False
            for pe in prep:
                for ee in earns:
                    if same_cert(pe["key"], ee):
                        pe["both"] = ee["both"] = True
                        any_both = True
            trained = trained_by(p, lines.get(c["college"]) or [], trainers, spelled)
            stats["trained"] += bool(trained)
            stats["trained_entries"] += len(trained)
            if not earns and not prep and not trained:
                continue
            for pe in prep:
                stats["prep_by_key"][pe["key"]] = stats["prep_by_key"].get(pe["key"], 0) + 1
            stats["earns"] += bool(earns)
            stats["prepares"] += bool(prep)
            stats["both"] += any_both
            stats["earn_entries"] += len(earns)
            stats["prep_entries"] += len(prep)
            entry = {}
            if earns:
                entry["earns_cpl_here"] = earns
            if prep:
                entry["prepares_for"] = prep
            if trained:
                entry["trained_by"] = trained
            out[ctl] = entry
        if out:
            docs[slug] = {"college": c["college"], "slug": slug, "programs": out}
    index = {"colleges": {d["college"]: s for s, d in sorted(docs.items())}}
    return docs, index, stats


def dump(doc):
    return json.dumps(doc, ensure_ascii=False, separators=(",", ":"), sort_keys=False) + "\n"


def main(argv):
    docs, index, stats = build()
    files = {os.path.join(OUT_DIR, s + ".json"): dump(d) for s, d in docs.items()}
    files[os.path.join(OUT_DIR, "index.json")] = dump(index)
    out = os.path.join(ROOT, OUT_DIR)
    os.makedirs(out, exist_ok=True)
    stray = sorted(p for p in glob.glob(os.path.join(out, "*.json")) if os.path.relpath(p, ROOT) not in files)
    if "--check" in argv:
        stale = [p for p, t in files.items() if not os.path.exists(os.path.join(ROOT, p))
                 or open(os.path.join(ROOT, p), encoding="utf-8").read() != t]
        stale += [os.path.relpath(p, ROOT) for p in stray]
        if stale:
            print("STALE: %d files under %s (%s). Run python3 kb/_build_program_certs.py"
                  % (len(stale), OUT_DIR, ", ".join(sorted(stale)[:5])))
            return 1
        print("ok: %d files under %s are current" % (len(files), OUT_DIR))
        return 0
    for p in stray:
        os.remove(p)
    for p, t in files.items():
        with open(os.path.join(ROOT, p), "w", encoding="utf-8") as f:
            f.write(t)
    print("wrote %d files under %s" % (len(files), OUT_DIR))
    print("  programs %(programs)d; earns CPL here %(earns)d (%(earn_entries)d entries); prepares for %(prepares)d "
          "(%(prep_entries)d entries); both %(both)d; trained by %(trained)d (%(trained_entries)d agencies)" % stats)
    print("  prepares for by certification: " + ", ".join("%s %d" % kv for kv in sorted(
        stats["prep_by_key"].items(), key=lambda kv: -kv[1])))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

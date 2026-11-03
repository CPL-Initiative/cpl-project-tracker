#!/usr/bin/env python3
"""Build the OpenClassrooms Medical Assistant -> CCC CPL crosswalk.

Ashley's ask (2026-11-03): a statewide CPL crosswalk for the OpenClassrooms Medical
Assistant Registered Apprenticeship (degree-granting), shaped like the Digital
Marketer one (kb/_build_openclassrooms_crosswalk.py, 2026-09-29) -- MAP first, then
every college's COCI courses, "including courses that are not currently listed in
MAP". A separate project: new files only, nothing of the Digital Marketer build is
read for writing or changed.

WHAT THE TRAINING IS (Appendix A work process schedule + the degree-path syllabus):
O*NET-SOC 31-9092.00 Medical Assistants, RAPIDS 1085CB. Competency-based and
degree-granting; 24 work processes carrying 28 competencies; 400 hours of related
instruction in eight online projects (front-office reception and triage 74 h,
specialty care pathways and refill operations 105 h, revenue cycle and EHR 84 h,
practice operations and facility management 74 h, clinical preparation and infection
control 18 h, clinical care and procedures 21 h, diagnostic testing 14 h, onboarding
10 h). The degree path adds four General Education modules and a 250-hour workplace
project. Credential: DOL Certificate of Completion of Apprenticeship; OpenClassrooms
(WSCUC-accredited) may award an associate degree.

SHAPE: one training x every college (the Futuro/HTH and Digital Marketer shape).

SOURCES (committed or MAP-owned; nothing scraped):
  * coci_lookup_data.js + coci_lookup_desc_*.js -- COCI course list and catalog
    descriptions (built 2026-07-09) -- the "beyond MAP" universe.
  * kb/reference/cb_course_basic_fall2025.csv -- MIS Fall 2025 inventory (active check).
  * coci_programs_data.js -- COCI program inventory.
  * statewide_data.js -- every MAP exhibit, its credit recommendations and adopters.
  * kb/openclassrooms_ma_ace_recs.json -- MAP's military (ACE) credit recommendations
    in the same subjects, read from Supabase 2026-11-03 (read-only).
  * kb/reference/swp_region_roster.json -- college -> Strong Workforce region.
  * kb/program_requirements_pilot/registry_read.json -- each college's catalog URL.

MATCHING GATE (two signals): a TITLE lens hit AND a TOP code in a health / medical
office family, or a "medical assistant" phrase in the catalog description AND a
medical-assisting TOP. TOP corroborates and never decides (CLAUDE.md Rule 7).
Match strength then comes from how many of the competency groups the title and
description evidence.

Run:  python3 kb/_build_oc_medical_assistant_crosswalk.py
"""
import collections
import csv
import glob
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
OUT = os.path.join(HERE, "oc_medical_assistant_out")

TITLE = "Medical Assistant (O*NET-SOC 31-9092.00)"
CERT = "OpenClassrooms Medical Assistant Registered Apprenticeship, Degree Path (RAPIDS 1085CB)"

# ------------------------------------------------------------- work processes ---
# Appendix A's 24 work processes (28 competencies: four carry an A and a B).
WORK_PROCESSES = [
    ("WP1", "Assess physical conditions of patients to aid in diagnosis or treatment", "A"),
    ("WP2", "Clean medical equipment", "A"),
    ("WP3", "Dispose of biomedical waste in accordance with standards", "A"),
    ("WP4", "Interview patients to gather medical information", "A"),
    ("WP5", "Record vital statistics or other health information", "A, B"),
    ("WP6", "Explain technical medical information to patients", "A"),
    ("WP7", "Clean patient rooms or patient treatment rooms", "A"),
    ("WP8", "Collect biological specimens from patients", "A"),
    ("WP9", "Prepare patient treatment areas for use", "A"),
    ("WP10", "Give medications or immunizations", "A, B"),
    ("WP11", "Administer basic health care or medical treatments", "A"),
    ("WP12", "Assist practitioners to perform medical procedures", "A"),
    ("WP13", "Move patients to or from treatment areas", "A"),
    ("WP14", "Prepare patients physically for medical procedures", "A"),
    ("WP15", "Conduct diagnostic tests to determine patient health", "A"),
    ("WP16", "Process medical billing information", "A, B"),
    ("WP17", "Greet customers, patrons, or visitors", "A"),
    ("WP18", "Perform clerical work in medical settings", "A"),
    ("WP19", "Provide customer service to clients or users", "A"),
    ("WP20", "Control prescription refills or authorizations", "A"),
    ("WP21", "Apply bandages, dressings, or splints", "A"),
    ("WP22", "Schedule patient procedures or appointments", "A, B"),
    ("WP23", "Inventory medical supplies or equipment", "A"),
    ("WP24", "Operate medical equipment", "A"),
]

# The eight related-instruction projects (Appendix A p. A-10) and the degree path's
# workplace project (syllabus Project 13).
PROJECTS = [
    ("P1", "Set Yourself Up for Success as a Medical Assistant", 10),
    ("P2", "Manage Front-Office Reception and Triage", 74),
    ("P3", "Understand Clinical Patient Preparation and Infection Control Protocols", 18),
    ("P4", "Coordinate Specialty Care Pathways and Refill Operations", 105),
    ("P5", "Learn about Basic Clinical Care and Procedures", 21),
    ("P6", "Master Diagnostic Operations: Testing, Cardiac Monitoring, and Specimen Logistics", 14),
    ("P7", "Manage Revenue Cycle Operations and EHR Informatics", 84),
    ("P8", "Ensure Smooth Medical Practice Operations and Facility Management", 74),
    ("WPJ", "Workplace Project (degree path, ~250 h, supervisor-validated skill checklists)", 0),
]
PNAME = {k: n for k, n, _ in PROJECTS}

# Competency groups: the evidence a course description must show.
# (group, work processes, projects, regex)
COMPETENCIES = [
    ("Patient intake, interview & vital signs", "WP1, WP4, WP5", "P2, P5",
     r"vital signs?|patient (history|intake|interview)|medical histor|blood pressure|temperature|pulse|height and weight|measurements"),
    ("Exam-room & patient preparation; assisting the provider", "WP7, WP9, WP11, WP12, WP13, WP14", "P3, P5",
     r"exam(ination)? room|prepar\w* (the )?patients?|assist\w* (the |with )?(physician|provider|practitioner|doctor)|physical exam|minor (office )?surg|positioning|draping|instrument"),
    ("Infection control, sterilization & biohazard", "WP2, WP3", "P3",
     r"infection control|asepsis|aseptic|steriliz|disinfect|autoclave|biohazard|\bosha\b|standard precautions|universal precautions|bloodborne|sanitiz"),
    ("Medication administration & injections", "WP10", "P4, P5",
     r"injection|medication administration|administ\w* (of )?medication|immuniz|vaccin|parenteral|dosage|drug calculation|pharmacolog"),
    ("Specimen collection & lab testing", "WP5, WP8, WP15", "P6",
     r"specimen|venipuncture|phlebotom|capillary|urinalysis|laborator|\bclia\b|point[- ]of[- ]care|waived test|blood (draw|collection)|hematolog"),
    ("EKG & diagnostic equipment", "WP15, WP24", "P6",
     r"electrocardio|\bekg\b|\becg\b|spirometr|diagnostic (test|procedure|equipment)|cardiac monitor|vision (test|screen)|audiometr"),
    ("Wound care & dressings", "WP21", "P5",
     r"wound|dressing|bandag|suture|staple removal|splint|first aid"),
    ("Patient education & communication", "WP6, WP19", "P2, P4",
     r"patient (education|teaching|instruction)|teach[- ]back|therapeutic communication|communicat|interpersonal|cultural|patient relations|customer service"),
    ("Front office: reception, scheduling & telephone", "WP17, WP18, WP19, WP22", "P2, P8",
     r"appointment|schedul|reception|telephone|front[- ]office|greet|patient registration|check[- ]?in|clerical|office procedures|correspondence|mail"),
    ("Billing, insurance & coding", "WP16", "P7",
     r"billing|insurance|\bcoding\b|\bicd|\bcpt\b|hcpcs|claims?\b|reimburse|bookkeep|collections|accounts receivable|revenue cycle|cms[- ]?1500|third[- ]party payer"),
    ("Health records & EHR", "WP5, WP18", "P2, P7",
     r"medical records?|health records?|\behr\b|\bemr\b|electronic (health|medical)|charting|documentation|practice management|health information"),
    ("Prescriptions, referrals & authorizations", "WP20", "P4",
     r"prescription|refill|referral|prior authori|pre-?authori|precertif|pharmacy"),
    ("Supplies, inventory & practice operations", "WP23", "P8",
     r"inventory|supplies|equipment (maintenance|care)|office management|practice operations|purchas|ordering|facility"),
    ("Law, ethics, HIPAA & scope of practice", "cross-cutting", "P2, P5, P7",
     r"hipaa|confidential|legal|\blaws?\b|ethic|scope of practice|compliance|privacy|liabilit"),
]

# ------------------------------------------------------------------- lenses ---
# (lens, title regex, kind, projects). kind: core (can reach High), cap (Medium at
# most), low (Low at most). Order matters: the first lens that matches wins.
LENSES = [
    ("Medical Assisting Externship / Practicum", r"externship|practicum|clinical experience|work experience|internship|work-based", "core", "WPJ"),
    ("Medical Billing, Insurance & Coding", r"billing|insurance|coding|\bicd|\bcpt\b|procedural terminology|reimburs|revenue cycle|claims", "core", "P7"),
    ("Electronic Health Records & Health Information", r"electronic (health|medical) record|\behr\b|\bemr\b|health information|medical records|health records|practice management|computeri[sz]ed medical|medical (office )?computer|computers? (in|for) (the )?(medical|health)", "core", "P2, P7"),
    ("Clinical Medical Assisting & Procedures", r"clinical (medical|procedure|skill|competenc|assist)|back office|exam(ination)? room|injection|medication admin|minor surg|assist\w* clinical|clinical\b.*medical assist", "core", "P3, P5, P6, WPJ"),
    ("Administrative Medical Assisting / Front Office", r"medical (office|front office|reception|secretar|admin|clerical|clerk)|front office|administrative medical|assist\w* administrative|health ?care (office|admin)|patient (registration|access|intake)|unit (clerk|secretary|coordinator)|ward clerk", "core", "P2, P8"),
    ("Medical Assisting Laboratory Procedures", r"(medical assist\w*|medical office|physician'?s? office) lab|laboratory (procedures|skills|techniques)|office lab", "cap", "P6"),
    ("Phlebotomy & Specimen Collection", r"phlebotom|venipunct|specimen", "cap", "P6"),
    ("Electrocardiography (EKG / ECG)", r"electrocardio|\bekg\b|\becg\b|cardiac monitor|telemetry", "cap", "P6"),
    ("Pharmacology & Medication Math for Medical Assistants", r"pharmacolog|medication|drug (calc|math)|dosage", "cap", "P4, P5"),
    ("Medical Law, Ethics & Compliance", r"medical (law|ethic)|law,? (and )?ethics|legal (and|&) ethical|hipaa|compliance", "cap", "P2, P7"),
    ("Healthcare Communication & Patient Relations", r"(medical|health ?care|patient) communication|communication (in|for) (the )?health|patient relations|health literacy|cultural (competen|humility).*health", "cap", "P2, P4"),
    ("Medical Office Management & Operations", r"(medical|health ?care) office management|medical practice management|health ?care (management|supervision)", "cap", "P8"),
    ("Infection Control & Basic Patient Care", r"infection control|asepsis|basic patient care|patient care skills", "cap", "P3, P5"),
    ("Medical Terminology", r"(medical|health).*terminolog|terminolog.*(medical|health)|^\s*terminology", "low", "P1-P8 (assumed throughout; no stand-alone module)"),
    ("Anatomy, Physiology & Disease", r"anatomy|physiology|disease|patholog", "low", "none (OpenClassrooms has no anatomy module)"),
    ("Medical Assisting (comprehensive)", r"medical assist|\bmed(ical)? asst|\bccma\b|\bcma\b review", "core", "P1-P8, WPJ"),
]

# Ordered from most to least specific; the lens a course is filed under.
NOISE = re.compile(r"independent stud|directed stud|special (topics|projects)|career exploration|"
                   r"veterinar|dental|optometr|pharmacy tech|court report|radiolog|sonograph|nursing\b(?!.*assist)|"
                   r"respiratory|surgical tech|psychiatric|paramedic|\bemt\b|emergency medical|echocardio|home health|"
                   r"\bcpr\b|first aid|heartsaver|cardiopulmonary|business terminology|legal terminology", re.I)

MA_TOP = re.compile(r"^12(08|23)")                       # Medical Assisting; Health Information
HEALTH_TOP = re.compile(r"^(12\d\d|0514)")              # any health; office technology


def top_ok(top4, title):
    if not top4:
        return False
    if MA_TOP.match(top4) or top4 in ("0514", "1201", "1205", "1215", "1213", "1299", "1260"):
        return True
    if top4.startswith("0514") and re.search(r"medical|health", title, re.I):
        return True
    if top4 == "1230" and re.search(r"medical assist", title, re.I):   # a CNA-coded MA course
        return True
    return False


def loadjs(path):
    s = open(path, encoding="utf-8").read()
    i = s.index("{", s.index("="))
    return json.loads(s[i:s.rstrip().rstrip(";").rindex("}") + 1])


def fix(s):
    try:
        return s.encode("latin-1").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return s


def norm_college(s):
    s = fix(s or "").lower().replace("ñ", "n").replace("&", "and")
    s = re.sub(r"\b(the|of|college|community|junior|ccd|district)\b", " ", s)
    s = s.replace("l.a.", "los angeles").replace("east l a", "east los angeles")
    return re.sub(r"[^a-z0-9]", "", s)


def norm_course(s):
    return re.sub(r"[^A-Z0-9]", "", (s or "").upper()).lstrip("0")


def build_college_index():
    idx = {}
    cw = json.load(open(os.path.join(HERE, "college_identity", "2026-08-23", "crosswalk.json")))
    for c in cw["colleges"]:
        canon = c["college_name"]
        for v in [canon, c.get("short"), c.get("mis_name")] + (c.get("variants") or []):
            if v:
                idx[norm_college(v)] = canon
    idx[norm_college("SAN FRANCISCO CITY")] = "City College of San Francisco"
    for v in ("Calbright College Credit", "Calbright College Non-Credit", "CALBRIGHT"):
        idx[norm_college(v)] = "Calbright College"
    return idx


def build_region():
    r = json.load(open(os.path.join(HERE, "reference", "swp_region_roster.json")))
    out = {}
    for reg in r["regions"].values():
        for c in reg["colleges"]:
            out[norm_college(c)] = reg["name"]
    return out


def competencies_hit(text):
    return [(n, wp, pj) for n, wp, pj, pat in COMPETENCIES if re.search(pat, text, re.I)]


def strength(kind, lens, hits, evidence, title=""):
    """High = a course about what the apprenticeship teaches whose title + description
    evidence three or more competency groups. Narrow specialties (phlebotomy, EKG,
    pharmacology) top out at Medium: the apprenticeship covers them in a 14-21 hour
    project plus workplace validation, short of a stand-alone course. Medical
    terminology and anatomy are Low: OpenClassrooms has no module for either."""
    n = len([h for h in hits if not h[0].startswith("Law, ethics")])
    n_all = len(hits)
    ma_title = bool(re.search(r"medical assist|clinical medical|medical office|for (the )?medical assistant", title, re.I))
    if kind == "low":
        return "Low"
    if evidence == "Catalog description":
        return "Medium" if n >= 3 else "Low"
    if kind == "cap":
        # law and communication run through every OpenClassrooms project
        if lens.startswith(("Medical Law", "Healthcare Communication")):
            return "Medium" if n_all >= 1 and re.search(r"medic|health|patient", title, re.I) else "Low"
        return "Medium" if (n >= 2 or ma_title) else "Low"
    if n >= 3:
        return "High"
    if lens.startswith("Medical Billing") and n >= 2 and re.search(r"billing|insurance", title, re.I) \
            and re.search(r"coding", title, re.I):
        return "High"
    if lens.startswith("Medical Assisting") and n >= 2:
        return "High"
    if n >= 1 or ma_title:
        return "Medium"
    return "Low"


def note_for(lens):
    return {
        "Phlebotomy & Specimen Collection": "California phlebotomy certification (CPT 1) requires a CDPH-approved training program; "
            "CPL for a state-approved phlebotomy course would need the college's program director to confirm.",
        "Electrocardiography (EKG / ECG)": "OpenClassrooms covers EKG in a 14-hour diagnostic project plus workplace validation; "
            "a stand-alone EKG course likely needs a skills demonstration.",
        "Pharmacology & Medication Math for Medical Assistants": "OpenClassrooms covers medications within scope (refills, DEA schedules, "
            "administration) but no dosage-calculation module was found in the syllabus; verify against the course outline.",
        "Medical Terminology": "No stand-alone terminology module in the OpenClassrooms syllabus; credit by exam is the usual CPL route "
            "and is already the most common MAP pathway for this course.",
        "Medical Assisting Externship / Practicum": "The apprenticeship's on-the-job learning (about 18 months) and supervisor-validated "
            "skill checklists are the closest match to an externship; colleges often award externship CPL for documented work hours.",
        "Clinical Medical Assisting & Procedures": "California limits injections and venipuncture by medical assistants to those with "
            "documented training (16 CCR 1366.1); the college will want the apprenticeship's skill-check records.",
    }.get(lens, "")


def main():
    os.makedirs(OUT, exist_ok=True)
    cidx = build_college_index()
    region = build_region()

    def canon(name):
        return cidx.get(norm_college(name), fix(name))

    def region_of(name):
        c = canon(name)
        if c.startswith("Calbright"):
            return "Statewide (online college)"
        if c.upper() == "SANTA BARBARA CED":
            return "South Central Coast"
        return region.get(norm_college(c), "")

    reg = json.load(open(os.path.join(HERE, "program_requirements_pilot", "registry_read.json")))["colleges"]
    catalog = {canon(k): v.get("catalog_url") or "" for k, v in reg.items()}

    sdm = json.load(open(os.path.join(HERE, "reference", "subject_discipline_map.json")))["map"]
    PLAUSIBLE = {"Health Care Ancillaries", "Office Technologies", "Health", "Nursing", "Biological Sciences",
                 "Business", "Computer Information Systems"}
    sdm = {k: v for k, v in sdm.items() if v in PLAUSIBLE}

    def discipline(subj, top):
        s = re.sub(r"[^A-Z0-9]", "", (subj or "").upper())
        if s in sdm:
            return sdm[s]
        t = (top or "")[:4]
        if t.startswith("1208") or t in ("1205", "1215", "1213", "1201", "1299"):
            return "Health Care Ancillaries (from TOP; verify)"
        if t.startswith("1223"):
            return "Health Care Ancillaries / Health Information (from TOP; verify)"
        if t.startswith("0514"):
            return "Office Technologies (from TOP; verify)"
        return f"{top} (TOP; verify)" if top else ""

    active = set()
    with open(os.path.join(HERE, "reference", "cb_course_basic_fall2025.csv"), encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            active.add(row["CB_CONTROL_NUMBER"].strip())

    L = loadjs(os.path.join(REPO, "coci_lookup_data.js"))
    colleges = L["colleges"]
    D = {}
    for p in glob.glob(os.path.join(REPO, "coci_lookup_desc_*.js")):
        s = open(p, encoding="utf-8").read()
        i = s.index("= {") + 2
        D.update(json.loads(s[i:s.rstrip().rstrip(";").rindex("}") + 1]))

    coci_by_key = {}
    coci_by_col = collections.defaultdict(list)
    for r in L["rows"]:
        col = canon(colleges[r[0]])
        coci_by_key[(col, norm_course(f"{r[2]}{r[3]}"))] = r
        coci_by_col[col].append(r)

    def active_of(ctrl):
        if not ctrl:
            return "Course not found in COCI - verify"
        return "Yes - in MIS Fall 2025 course inventory" if ctrl in active else "Not in MIS Fall 2025 - verify in catalog"

    def evidence_row(col, code, cr_row, fallback_title):
        title = cr_row[4] if cr_row else fallback_title
        desc = D.get(cr_row[1], "") if cr_row else ""
        hits = competencies_hit(f"{title} {desc}")
        lens, kind, projs = "Medical Terminology" if re.search("terminolog", title, re.I) else "", "", ""
        for name, pat, k, pj in LENSES:
            if re.search(pat, title, re.I):
                lens, kind, projs = name, k, pj
                break
        return title, desc, hits, lens or "Related health course", kind or "cap", projs

    # ------------------------------------------- MAP civilian exhibits ---
    sw = loadjs(os.path.join(REPO, "statewide_data.js"))["exhibits"]
    EXH = re.compile(r"medical assist|medical terminology|medical insurance|medical (billing|coding|office)|ecg|ekg|"
                     r"electrocardio|phlebotom|medical core|patient care intermediate|health information", re.I)
    SKIP = re.compile(r"veterinar|surgical nursing|dental", re.I)
    map_rows, on_map, data_flags = [], {}, []
    for e in sw:
        if not EXH.search(e["title"]) or SKIP.search(e["title"]):
            continue
        adopters = [canon(a) for a in e.get("adopter_names") or []]
        if not adopters:
            data_flags.append(f"MAP exhibit '{e['title']}' ({e['exhibit_id']}) carries a credit recommendation "
                              f"but no adopting college.")
            continue
        for cr in e.get("credit_recs") or []:
            code = (cr.get("course") or "").strip()
            cr_words = set(re.findall(r"[a-z]{4,}", cr["credit"].lower())) - {"hours", "hour", "introduction", "principles"}
            if not re.search(r"medic|health|ecg|ekg|cardi|clinic|patient|coding|billing|terminolog|assist|phleb", cr["credit"], re.I):
                data_flags.append(f"MAP exhibit '{e['title']}' ({e['exhibit_id']}) at {', '.join(adopters)} lists "
                                  f"'{cr['credit']}' ({code}) -- a media / film course under a medical title. Excluded; "
                                  f"the MAP record looks mis-titled.")
                continue
            hits_c = [a for a in adopters if (a, norm_course(code)) in coci_by_key and
                      cr_words & set(re.findall(r"[a-z]{4,}", (coci_by_key[(a, norm_course(code))][4] or "").lower()))]
            if not hits_c and len(adopters) == 1:
                hits_c = adopters
            for col in hits_c:
                cr_row = coci_by_key.get((col, norm_course(code)))
                title, desc, hits, lens, kind, projs = evidence_row(
                    col, code, cr_row, re.sub(r"^\d[\d.\-]* hours? in ", "", cr["credit"]))
                st = strength(kind, lens, hits, "Course title", title)
                map_rows.append({
                    "source": "MAP exhibit", "college": col, "course_id": code,
                    "course_title": title, "ctrl": cr_row[1] if cr_row else "",
                    "units": cr_row[5] if cr_row else "", "top": cr_row[7] if cr_row else "",
                    "discipline": discipline(cr_row[2] if cr_row else code.split()[0], cr_row[7] if cr_row else ""),
                    "exhibit_id": " | ".join(e.get("exhibit_ids") or [e["exhibit_id"]]),
                    "exhibit_title": e["title"], "credit_rec": cr["credit"],
                    "issuer": e.get("issuing_agency", ""), "cpl_type": e.get("cpl_type", ""),
                    "map_status": "Adopted in MAP (articulated)", "lens": lens, "projects": projs,
                    "strength": st, "hits": hits, "description": desc,
                    "note": f"Approved CPL for {e['title']} ({e.get('cpl_type', '')}); the course already accepts CPL. "
                            f"Not yet approved for OpenClassrooms. {note_for(lens)}".strip(),
                })
                on_map.setdefault((col, norm_course(code)), f"{e['title']} ({e.get('cpl_type', '')})")

    # ------------------------------------------- MAP military (ACE) recs ---
    ace = json.load(open(os.path.join(HERE, "openclassrooms_ma_ace_recs.json")))["recs"]
    CRSE = re.compile(r"^\s*([A-Z][A-Z &]*?)[- ]([A-Z]?\d+[A-Z]*)\s+(.*?)\((\d+(?:\.\d+)?)\)\s*$")
    for rec in ace:
        for c in rec["colleges"]:
            if not c["course"] or c["status"] not in ("Applied to CPL Plan", "In Process"):
                continue
            m = CRSE.match(c["course"])
            if not m or m.group(1) == "CPL":
                continue
            col = canon(c["college"])
            code = f"{m.group(1).strip()} {m.group(2)}"
            if not re.search(r"terminolog|coding|pharmacolog", m.group(3), re.I):
                continue
            if re.search(r"nursing", m.group(3), re.I):
                continue
            cr_row = coci_by_key.get((col, norm_course(code)))
            title, desc, hits, lens, kind, projs = evidence_row(col, code, cr_row, m.group(3).title())
            key = (col, norm_course(code), rec["exhibit_id"])
            if any((r["college"], norm_course(r["course_id"]), r["exhibit_id"]) == key for r in map_rows):
                continue
            map_rows.append({
                "source": "MAP military (ACE) credit recommendation", "college": col, "course_id": code,
                "course_title": title, "ctrl": cr_row[1] if cr_row else "",
                "units": cr_row[5] if cr_row else m.group(4), "top": cr_row[7] if cr_row else "",
                "discipline": discipline(m.group(1), cr_row[7] if cr_row else ""),
                "exhibit_id": rec["exhibit_id"], "exhibit_title": rec["exhibit_title"] + " (military, ACE)",
                "credit_rec": rec["credit_rec"], "issuer": "American Council on Education (ACE)", "cpl_type": "Military",
                "map_status": "Applied to CPL plan" if c["status"] == "Applied to CPL Plan" else "In process in MAP (not yet applied)",
                "lens": lens, "projects": projs, "strength": strength(kind, lens, hits, "Course title", title),
                "hits": hits, "description": desc,
                "note": f"Approved CPL for military {rec['exhibit_title']} training ({c['status']}); the course already "
                        f"accepts CPL. Not yet approved for OpenClassrooms. {note_for(lens)}".strip(),
            })
            on_map.setdefault((col, norm_course(code)), f"{rec['exhibit_title']} (military, ACE)")

    # ------------------------------------------------------- COCI courses ---
    courses = []
    for r in L["rows"]:
        ci, ctrl, subj, num, title, units, credit, top = r[:8]
        title = fix(title or "")
        top4 = (top or "")[:4].replace(".", "")
        if NOISE.search(title) or not top_ok(top4, title):
            continue
        desc = D.get(ctrl, "") or ""
        lens = kind = projs = None
        evidence = "Course title"
        for name, pat, k, pj in LENSES:
            if re.search(pat, title, re.I):
                lens, kind, projs = name, k, pj
                break
        # an externship / work-experience course counts only when it is a medical-assisting one
        if lens == "Medical Assisting Externship / Practicum" and not (
                re.search(r"medical assist|clinical medical|medical office", f"{title} {desc}", re.I) or top4.startswith("1208")):
            continue
        # pharmacology for MAs only, never nursing or pharmacy-tech pharmacology
        if lens and lens.startswith("Pharmacology") and not (top4.startswith("1208") or re.search(r"medical assist|medical office", f"{title} {desc}", re.I)):
            continue
        if not lens and MA_TOP.match(top4) and re.search(r"medical assist", desc, re.I):
            lens, kind, projs, evidence = "Medical Assisting (comprehensive)", "core", "P1-P8, WPJ", "Catalog description"
        if not lens or lens.startswith("Anatomy"):   # A&P is not in the training: no alignment
            continue
        hits = competencies_hit(f"{title} {desc}")
        col = canon(colleges[ci])
        code = f"{subj} {num}".strip()
        st = strength(kind, lens, hits, evidence, title)
        courses.append({
            "college": col, "region": region_of(col), "course_id": code, "course_title": title,
            "ctrl": ctrl, "units": units,
            "credit": {"C": "Credit", "N": "Noncredit", "E": "Noncredit (enhanced)"}.get(credit, credit or ""),
            "top": top, "discipline": discipline(subj, top), "lens": lens, "projects": projs,
            "evidence": evidence, "strength": st, "hits": hits, "description": fix(desc),
            "active": active_of(ctrl), "on_map": on_map.get((col, norm_course(code)), ""),
            "note": note_for(lens),
        })

    for c in map_rows:
        c["region"] = region_of(c["college"])
        c["active"] = active_of(c["ctrl"])

    # ------------------------------------------------------------ programs ---
    P = loadjs(os.path.join(REPO, "coci_programs_data.js"))
    PROG = re.compile(r"medical assist|medical office|medical (billing|coding|insurance|administrative|front|records|secretar)|"
                      r"health information|clinical medical|phlebotom|electrocardio|\bekg\b|\becg\b|medical receptionist|"
                      r"health ?care (office|admin)|patient care technician", re.I)
    programs = []
    for r in P["rows"]:
        ci, ctrl, title, top, cip, ai, si = r[:7]
        status = P["statuses"][si]
        if status not in ("Active", "Approved", "Active - Teachout Only") or not PROG.search(title or ""):
            continue
        col = canon(P["colleges"][ci])
        fit = ("Medical assisting program" if re.search(r"medical assist|clinical medical", title, re.I) else
               "Medical office / billing / health information" if re.search(r"office|billing|coding|insurance|records|information|admin|front|reception|secretar", title, re.I)
               else "Related allied-health skill (phlebotomy, EKG, patient care)")
        programs.append({
            "college": col, "region": region_of(col), "program": fix(title), "award": P["awards"][ai],
            "top": top, "cip": cip, "status": status, "units": r[7], "fit": fit,
        })

    order = {"High": 0, "Medium": 1, "Low": 2}
    courses.sort(key=lambda c: (order[c["strength"]], c["region"], c["college"], c["course_id"]))
    map_rows.sort(key=lambda c: (c["region"], c["college"], c["course_id"]))
    all_cols = sorted({canon(c) for c in colleges})
    out = {
        "_built_by": "kb/_build_oc_medical_assistant_crosswalk.py",
        "_built_at": __import__("datetime").date.today().isoformat(),
        "coci_built_at": L.get("_built_at"),
        "title": TITLE, "certificate": CERT,
        "work_processes": [{"id": i, "name": n, "competencies": c} for i, n, c in WORK_PROCESSES],
        "projects": [{"id": i, "name": n, "hours": h} for i, n, h in PROJECTS],
        "competency_groups": [{"group": n, "work_processes": wp, "projects": pj} for n, wp, pj, _ in COMPETENCIES],
        "colleges_reviewed": all_cols, "catalog": catalog,
        "map_rows": map_rows, "courses": courses, "programs": programs, "ace_recs": ace,
        "data_flags": sorted(set(data_flags)),
    }
    json.dump(out, open(os.path.join(OUT, "crosswalk.json"), "w"), indent=1, ensure_ascii=False)
    cnt = collections.Counter(c["strength"] for c in courses)
    print(f"colleges in COCI: {len(all_cols)}")
    print(f"MAP rows: {len(map_rows)} at {len({c['college'] for c in map_rows})} colleges "
          f"{dict(collections.Counter(c['source'] for c in map_rows))}")
    print(f"COCI courses: {len(courses)} {dict(cnt)} at {len({c['college'] for c in courses})} colleges; "
          f"on MAP already: {sum(1 for c in courses if c['on_map'])}")
    print(f"lenses: {dict(collections.Counter(c['lens'] for c in courses))}")
    print(f"programs: {len(programs)}  ACE recs: {len(ace)}")
    print("unregioned:", sorted({c['college'] for c in courses + map_rows + programs if not c['region']}))
    print("flags:", *out["data_flags"], sep="\n  ")


if __name__ == "__main__":
    main()

"""
IT, cybersecurity, data and AI credential catalog -> kb/it_ai_credential_catalog.json

Sam, 2026-09-30: "I am interested in all certs, but particularly emerging ones
from the tech giants ... Not just certs, but courses that result in badges or
certs as well." The catalog answers the input side of the CPL question for one
field: which industry credentials a student may walk in holding, who issues
each one, and whether any California community college has articulated it in
MAP yet. A credential no college has articulated is an opportunity, stated in
the terms a faculty member already uses.

Three sources, joined on (issuer, core name):

  kb/reference/cos_certifications.json
      CareerOneStop Certification Finder, the national list (USDOL ETA, data by
      Minnesota DEED), synced monthly by cos-authority-sync.yml. The broadest
      source and the one with the certifying organization on every row.
      Display requires the attribution in ATTRIBUTION below.
  kb/reference/credential_registry_national_sample.json
      Credential Engine's National Certification Collection, the 974-of-6,738
      hand capture Sam made on 2026-09-16. Adds issuers COS lacks.
  kb/reference/industry_credential_watch.json
      What the issuers themselves publish now: certifications, course
      certificates and badges, each verified against the issuer's own page on
      the date it records. The registries lag the issuers by a year or more on
      AI credentials; this file is what closes that gap, and it is the file the
      industry-credential watch agent keeps current.

  kb/reference/industry_credential_skills.json
      The skills and competencies each issuer publishes for a credential:
      Microsoft's "skills measured", AWS and CompTIA exam domains with their
      weights, the courses inside a Google Career Certificate. Faculty compare
      these against course outcomes. Harvested from the issuer's own exam guide,
      one exam version at a time; the watch agent extends coverage each run.

and one MAP side:

  credential_reference_data.js  (the CER, rebuilt daily)
      Every unified title with its issuer and its articulations, which carry
      the colleges and units. A catalog row joins to MAP when a unified title
      from the same issuer carries the same core name, or when ALIASES names
      the pairing outright.

Run from the repo root:
  python3 kb/_build_it_ai_credential_catalog.py            # write the JSON
  python3 kb/_build_it_ai_credential_catalog.py --xlsx PATH  # and a workbook

The output is a dated snapshot, not a guarded artifact: the CER it reads is
rebuilt every morning, so a committed catalog trails MAP by however many days
have passed since its `_inputs.cer_generated_at`. Rerun before citing a count.
"""
import argparse
import json
import os
import re
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
COS = os.path.join(HERE, "reference", "cos_certifications.json")
CE = os.path.join(HERE, "reference", "credential_registry_national_sample.json")
WATCH = os.path.join(HERE, "reference", "industry_credential_watch.json")
SKILLS = os.path.join(HERE, "reference", "industry_credential_skills.json")
CIP_CSV = os.path.join(HERE, "reference", "CIPCode2020.csv")
CER_JS = os.path.join(ROOT, "credential_reference_data.js")
OUT = os.path.join(HERE, "it_ai_credential_catalog.json")

ATTRIBUTION = ("CareerOneStop (www.careeronestop.org), sponsored by the U.S. "
               "Department of Labor, Employment and Training Administration; "
               "data maintained by the Minnesota Department of Employment and "
               "Economic Development. Credential Engine Registry "
               "(credentialfinder.org), National Certification Collection.")

TECH_GIANTS = ["Google", "Microsoft", "Amazon Web Services", "IBM", "Oracle",
               "Cisco", "NVIDIA", "Salesforce", "Meta", "Apple"]

# (pattern on the source's organization string, canonical issuer, scope)
# scope "all": every credential the issuer offers is in the catalog.
# scope "it":  the issuer spans fields, so only credentials whose name places
#              them in an IT domain come in (Pearson's IT Specialist series,
#              not its Agriscience Foundations).
ISSUERS = [
    (r"^google|google cloud|grow with google", "Google", "all"),
    (r"microsoft", "Microsoft", "all"),
    (r"amazon", "Amazon Web Services", "all"),
    (r"^ibm\b|international business machines", "IBM", "all"),
    (r"^oracle|^mysql", "Oracle", "all"),
    (r"^cisco", "Cisco", "all"),
    (r"nvidia", "NVIDIA", "all"),
    (r"salesforce", "Salesforce", "all"),
    (r"^meta\b", "Meta", "all"),
    (r"^apple", "Apple", "all"),
    (r"comptia|computing technology industry", "CompTIA", "all"),
    (r"international information systems? security|\bisc2\b|\(isc\)", "ISC2", "all"),
    (r"information systems audit|\bisaca\b", "ISACA", "all"),
    (r"ec-council", "EC-Council", "all"),
    (r"global information assurance|\bgiac\b|sans giac", "GIAC", "all"),
    (r"linux foundation", "Linux Foundation", "all"),
    (r"linux professional institute", "Linux Professional Institute", "all"),
    (r"red hat", "Red Hat", "all"),
    (r"juniper", "Juniper Networks", "all"),
    (r"vmware", "VMware", "all"),
    (r"broadcom", "Broadcom", "all"),
    (r"citrix", "Citrix", "all"),
    (r"^f5$", "F5", "all"),
    (r"check point", "Check Point", "all"),
    (r"certified wireless network", "CWNP", "all"),
    (r"mile2", "Mile2", "all"),
    (r"certnexus", "CertNexus", "all"),
    (r"international association of privacy", "IAPP", "all"),
    (r"institute for operations research", "INFORMS", "all"),
    (r"sas institute", "SAS", "all"),
    (r"servicenow", "ServiceNow", "all"),
    (r"databricks", "Databricks", "all"),
    (r"snowflake", "Snowflake", "all"),
    (r"splunk", "Splunk", "all"),
    (r"python institute", "Python Institute", "all"),
    (r"institute for (the )?certification of computing", "ICCP", "all"),
    (r"cloud credential council", "Cloud Credential Council", "all"),
    (r"network appliance|netapp", "NetApp", "all"),
    (r"storage networking industry", "SNIA", "all"),
    (r"^suse", "SUSE", "all"),
    (r"teradata", "Teradata", "all"),
    (r"wireshark", "Wireshark", "all"),
    (r"certified internet web", "CIW", "all"),
    (r"ieee computer society", "IEEE Computer Society", "all"),
    (r"software testing qualifications", "ASTQB", "all"),
    (r"hewlett packard", "Hewlett Packard Enterprise", "all"),
    (r"^dell", "Dell Technologies", "all"),
    (r"^sap\b", "SAP", "all"),
    (r"^certiport", "Certiport", "it"),
    (r"^pearson", "Pearson", "it"),
    (r"international institute of business analysis", "IIBA", "it"),
    (r"eta international", "ETA International", "it"),
    (r"adobe", "Adobe", "it"),
    (r"project management institute|cognilytica", "PMI", "it"),
    (r"^opentext", "OpenText", "it"),
    (r"^codehs", "CodeHS", "it"),
    (r"isograd", "Isograd", "it"),
    (r"^treccert", "TRECCERT", "it"),
    (r"^sisa$", "SISA", "it"),
    (r"scaled agile", "Scaled Agile", "it"),
    (r"rocheston", "Rocheston", "it"),
    (r"disaster recovery institute", "DRI International", "it"),
    (r"smart automation certification alliance", "SACA", "it"),
]
_ISSUER_RX = [(re.compile(p, re.I), name, scope) for p, name, scope in ISSUERS]

# First match wins. AI before cyber ("AI Security Management" is an AI
# credential for this audience), cyber before data, business applications
# before cloud (an Oracle Fusion "Cloud Implementation Professional" is an ERP
# credential), data center before data.
DOMAINS = [
    ("AI and machine learning",
     r"artificial intelligence|machine learning|\bai\b|\bai-|generative|\bgenai|"
     r"watsonx|\bllms?\b|large language|prompt|agentforce|agentic|copilot|"
     r"vector search|deep learning|computer vision|\bml\b|mist ai|ai-native"),
    ("Cybersecurity",
     r"secur|cyber|hack|forensic|penetration|pentest|threat|incident|privacy|"
     r"\bsoc\b|defender|vulnerab|malware|encryption|intrusion|cissp|\bcism\b|"
     r"\bcisa\b|crisc|ccsp|sscp|cysa|resilience|cyberops|information assurance"),
    # "risk", "audit" and "governance" alone are not security words (PMI's Risk
    # Management Professional is a project credential); the security issuers'
    # risk and audit credentials arrive through SECURITY_ISSUERS instead.
    ("Business applications and productivity",
     r"implementation|functional consultant|dynamics 365|s/4hana|successfactors|"
     r"accounting|financials|\bhcm\b|procurement|supply chain|sales cloud|"
     r"service cloud|marketing|\berp\b|order management|payroll|human capital|"
     r"warehouse management|revenue management|inventory|office specialist|"
     r"\bexcel\b|\bword\b|outlook|powerpoint|\baccess\b|quickbooks|"
     r"power platform|power apps|power automate|workspace|\bic3\b|"
     r"digital literacy|key applications|living online|administrator\b.*salesforce|"
     r"salesforce certified|business analysis|product ownership|project management|"
     r"\bproject\+|scrum|agile"),
    ("Cloud, networks and systems",
     r"data center|datacenter"),
    ("Data and analytics",
     r"\bdata|analytic|database|\bsql\b|\bbi\b|business intelligence|power bi|"
     r"tableau|big data|warehouse|fabric|cognos|mysql|\bdb2\b|statistic|"
     r"predictive|snowpro|lakehouse|\bdatasys"),
    ("Cloud, networks and systems",
     r"cloud|azure|\baws\b|network|\bccna\b|\bccnp\b|\bccie\b|\bccde\b|\bccst\b|"
     r"\bcct\b|linux|unix|server|kubernetes|devops|virtual|vmware|storage|"
     r"wireless|routing|switching|administrator|system|infrastructure|"
     r"\baplus\b|a\+|it support|hardware|technician|endpoint|windows|devnet|"
     r"automation|hybrid|openshift|openstack|ansible|mainframe|z/os|"
     r"operating|\bdevice|messaging|teams|exchange|cloudnetx|meraki|citrix|"
     r"\bit fundamentals\b|\btech\+|\bitf\b|essentials"),
    ("Software development",
     r"develop|programm|java|python|javascript|html|css|c\+\+|software|\bweb\b|"
     r"coding|\bcode|\bapp\b|application|testing|tester|quality|computational|"
     r"blockchain|internet of things|\biot\b|unity|computer scien|\bux\b|"
     r"user experience"),
]
_DOMAIN_RX = [(name, re.compile(p, re.I)) for name, p in DOMAINS]
OTHER_IT = "Other IT"
# The domains a mixed-field issuer (scope "it") must land in to be catalogued.
IT_DOMAINS = {"AI and machine learning", "Cybersecurity", "Data and analytics",
              "Cloud, networks and systems", "Software development"}

# Issuers whose every credential is a security credential unless it is an AI
# one (a GIAC "Python Coder" is taught and tested as a security skill).
SECURITY_ISSUERS = {"GIAC", "ISC2", "EC-Council", "Mile2", "IAPP", "ISACA"}

# CIP sector (the two-digit CIP family) and the CIP 2020 code under it. Sam's
# ruling for the Exhibit Adoption view (2026-09-25) governs: "CIP sector is
# best ... We only need the CIP sector on this tab for filter and quick
# categorization ... I don't want to get sucked into the top/CIP black hole."
# So the sector is assigned here from the credential's domain and name, never
# voted from TOP, and it decides nothing about identity. First rule in the
# credential's domain whose pattern matches wins; the last rule of each domain
# is its default. Every code is checked against CIPCode2020.csv at build time.
CIP_RULES = {
    "AI and machine learning": [
        (r"secur|audit|governance|risk|privacy", "11.1003"),
        (r".", "11.0102"),
    ],
    "Cybersecurity": [
        (r"forensic|investigat", "43.0403"),
        (r".", "11.1003"),
    ],
    "Data and analytics": [
        (r"scien", "30.7001"),
        (r"database|\bsql\b|\bdba\b|data engineer|warehous|\bdb2\b|mysql|datasys|"
         r"lakehouse|snowpro|data integration|big data|cosmos|data platform", "11.0802"),
        (r"business (data )?analy", "30.7102"),
        (r".", "30.7101"),
    ],
    "Cloud, networks and systems": [
        (r"cloud|azure|\baws\b|devops|kubernetes|openshift|openstack|hybrid|"
         r"cloudnetx|solutions architect", "11.0902"),
        (r"network|\bccna\b|\bccnp\b|\bccie\b|\bccde\b|routing|switching|wireless|"
         r"meraki|junos|telecom|\b5g\b|data center", "11.0901"),
        (r"support|\ba\+|aplus|help desk|\btech\+|it fundamentals|\bitf\b|technician|"
         r"hardware|endpoint|device", "11.1006"),
        (r".", "11.1001"),
    ],
    "Software development": [
        (r"\bweb\b|html|css|javascript", "11.0801"),
        (r".", "11.0201"),
    ],
    "Business applications and productivity": [
        (r"office specialist|excel|\bword\b|outlook|powerpoint|\baccess\b|\bic3\b|"
         r"digital literacy|key applications|living online|publisher|workspace", "11.0601"),
        (r"project|scrum|agile", "11.1005"),
        (r".", "52.1201"),
    ],
    OTHER_IT: [(r".", "11.0103")],
}
_CIP_RX = {d: [(re.compile(p, re.I), c) for p, c in rules] for d, rules in CIP_RULES.items()}


def load_cip_titles(path):
    """code -> title for every live CIP 2020 code; a code the 2020 edition
    moved away or deleted is absent, so a rule naming one fails the build."""
    import csv
    titles = {}
    with open(path, encoding="utf-8-sig") as fh:
        for r in csv.DictReader(fh):
            if r["Action"].strip().lower() in ("moved from", "deleted"):
                continue
            code = r["CIPCode"].strip('="')
            titles[code] = r["CIPTitle"].strip().rstrip(".")
    return titles


def cip_of(name, domain):
    for rx, code in _CIP_RX[domain]:
        if rx.search(name):
            return code
    return None


def sector_title(t):
    small = {"and", "or", "of", "the", "in", "for"}
    words = t.lower().split()
    return " ".join(w if (i and w in small) else w[:1].upper() + w[1:]
                    for i, w in enumerate(words))


# ── Fields outside IT (Sam, 2026-10-30: "widen the process to any industry,
# sector, professional licensure") ───────────────────────────────────────────
# A non-IT row takes its CIP from, in order: the Registry's own
# ceterms:instructionalProgramType when the record carries one (the better
# source, credential_watch_agent.md), the SOC major group of its CTDL
# occupation, then the name rules below. A row none of them places reads
# "Not yet assigned" and stays out of every sector count; the build never
# guesses a code. Sam's 2026-09-25 ruling holds: sector is a filter, never TOP.
NO_FIELD = "Not yet assigned"
FIELD_RULES = [
    (r"weld", "48.0508"), (r"machin|\bcnc\b|milling|lathe", "48.0501"),
    (r"carpent", "46.0201"), (r"plumb", "46.0503"), (r"mason|bricklay", "46.0101"),
    (r"electrician|\belectrical\b|lineman", "46.0302"),
    (r"hvac|refrigerat|air.condition|\bepa 608|heating", "47.0201"),
    (r"diesel", "47.0605"), (r"aircraft|airframe|powerplant|avionics", "47.0607"),
    (r"\bauto\b|automotive|automobile|collision|\base\b", "47.0604"),
    (r"industry 4\.0|robot|mechatronic", "15.0405"),
    (r"drone|unmanned|pilot", "49.0102"), (r"\bcdl\b|truck driv|commercial driver", "49.0205"),
    (r"phlebot", "51.1009"), (r"\bekg\b|\becg\b|cardiograph", "51.0901"),
    (r"emergency medical|\bemt\b|\bemr\b|paramedic|first responder", "51.0904"),
    (r"nurs|\bcna\b", "51.3902"), (r"patient care|home health", "51.2602"),
    (r"pharmacy|pharmacist|\bcpht\b", "51.0805"), (r"dental", "51.0601"),
    (r"medical assist|\bccma\b|\bcma\b", "51.0801"),
    (r"coder|coding|billing", "51.0713"), (r"medical admin|medical office|\bcmaa\b", "51.0710"),
    (r"central service|sterile|dialysis", "51.1011"), (r"massage", "51.3501"),
    (r"radiolog|x-ray", "51.0911"), (r"laborator", "51.1004"),
    (r"child development|\bcda\b|early childhood|child care|preschool", "19.0709"),
    (r"teacher|paraprofessional|teaching", "13.1501"),
    (r"personal train|fitness|exercise|strength", "31.0507"),
    (r"servsafe|food (handler|protection|safety)|culinary|cook|barista", "12.0500"),
    (r"cosmetolog|esthetic|nail", "12.0401"), (r"barber", "12.0402"),
    (r"real estate|property apprais", "52.1501"), (r"insurance|adjuster", "52.1701"),
    (r"account|bookkeep|tax prepar|enrolled agent", "52.0302"),
    (r"project management|\bcapm\b|\bpmp\b", "52.0211"),
    (r"marketing|social media|advertis|sales", "52.1401"),
    (r"human resource|\bhr\b|\bphr\b|\bshrm", "52.1001"),
    (r"logistic|supply chain|warehouse|forklift", "52.0203"),
    (r"animal|veterin|livestock|equine|dairy", "01.0901"), (r"agricultur|crop|farm|horticult", "01.0399"),
    (r"ecology|conservation|wildlife|fisher|forest", "03.0601"),
    (r"fire ?fight|fire (inspector|officer|science|fighter)", "43.0203"),
    (r"police|law enforcement|peace officer|corrections|security (guard|officer)|bail", "43.0107"),
    (r"safety|osha|hazmat|hazardous", "15.0701"),
    (r"construction|building inspector|nccer core|\bnccer\b", "46.0401"),
    (r"cad\b|cadd|drafting|solidworks|autodesk", "15.1302"),
    (r"social work|case manag|community health", "44.0701"),
    (r"counsel|behavioral|substance|addiction", "51.1508"),
    (r"attorney|paralegal|legal", "22.0301"), (r"notary", "22.0301"),
]
# Where the credential's own name says nothing, the issuer's name often places
# it (a board of radiology certifies radiology). Tried after the name rules.
ISSUER_FIELD_RULES = [
    (r"radiolog|sonograph|imaging|nuclear medicine|mammograph", "51.0911"),
    (r"nurs", "51.3801"), (r"dental|orthodon", "51.0601"), (r"pharmac", "51.0805"),
    (r"emergency medical|paramedic", "51.0904"), (r"optomet|ophthalm|optic", "51.1801"),
    (r"physical therap|occupational therap|speech|audiolog", "51.2306"),
    (r"psychiatr|psycholog|counsel|behavior", "51.1508"),
    (r"medical|medicine|osteopath|surgery|surgeons|physician|pediatric|cardio|"
     r"anesthes|dermatolog|neurolog|oncolog|pathology|health|clinical|hospital|"
     r"allied|therap|chiropract|podiatr|veterinar", "51.0000"),
    (r"weld", "48.0508"), (r"carpenter|ironworker|mason|pipe ?fitter|plumb|"
     r"sheet metal|electrical|elevator|construction|\\bbuilders", "46.0401"),
    (r"automotive|auto(mobile)? ", "47.0604"), (r"aviation|aircraft|airline|airport", "49.0102"),
    (r"fire|police|sheriff|corrections|law enforcement|security", "43.0107"),
    (r"restaurant|culinary|food|beverage|bartend|sommelier", "12.0500"),
    (r"real estate|appraisal|realtor", "52.1501"), (r"insurance|underwrit", "52.1701"),
    (r"account|bookkeep|auditor|tax|financ|bank|credit union|investment|"
     r"securities|actuar|treasury", "52.0801"),
    (r"human resource|personnel", "52.1001"), (r"marketing|sales|advertis", "52.1401"),
    (r"project management", "52.0211"), (r"logistic|supply chain|transportation|trucking",
     "52.0203"),
    (r"teacher|education|school|educational testing|literacy|instruct", "13.1501"),
    (r"agricultur|crop|horticult|landscape|turf|forest|arborist|farm|nursery",
     "01.0399"),
    (r"animal|equine|veterinar|dog|pet ", "01.0901"),
    (r"environment|water|wastewater|energy|solar|petroleum|geolog|hydrolog",
     "03.0104"),
    (r"safety|hazard|industrial hygiene|occupational", "15.0701"),
    (r"engineer|technician|technolog", "14.0101"),
    (r"law|legal|paralegal|court|notary", "22.0301"), (r"social work|human services", "44.0701"),
    (r"fitness|exercise|athletic|strength|yoga|sport|swim", "31.0507"),
    (r"cosmetolog|beauty|barber|esthetic|massage|spa ", "12.0401"),
    (r"library|archiv|museum", "25.0101"), (r"funeral|mortuary|embalm", "12.0301"),
    (r"design|graphic|photograph|film|game|animation|music|art ", "50.0402"),
]
_ISSUER_FIELD_RX = [(re.compile(p, re.I), c) for p, c in ISSUER_FIELD_RULES]
_FIELD_RX = [(re.compile(p, re.I), c) for p, c in FIELD_RULES]
# SOC major group (first two digits of a CTDL occupation code) -> a CIP code,
# only where the group names one field.
SOC_MAJOR_CIP = {"11": "52.0101", "13": "52.0101", "21": "44.0701", "29": "51.0000",
                 "31": "51.0000", "33": "43.0107", "35": "12.0500", "41": "52.1401",
                 "47": "46.0401", "49": "47.0303", "53": "49.0205"}


def field_cip(name, ctdl=None, issuer=""):
    """(code, source) for a credential outside IT, or (None, None)."""
    ipt = (ctdl or {}).get("instructional_program_type") or []
    for o in ipt:
        code = (o.get("code") or "").strip()
        if re.fullmatch(r"\d{2}\.\d{4}", code):
            return code, "Credential Engine (CTDL instructionalProgramType)"
    for rx, code in _FIELD_RX:
        if rx.search(name):
            return code, "rule (name)"
    for rx, code in _ISSUER_FIELD_RX:
        if rx.search(issuer or ""):
            return code, "rule (issuer name)"
    for o in (ctdl or {}).get("occupation_type") or []:
        code = SOC_MAJOR_CIP.get((o.get("code") or "")[:2])
        if code:
            return code, "rule (SOC major group)"
    return None, None


# MAP unified title -> the catalog name it is, where the names differ in more
# than punctuation, vendor prefix or an exam-code parenthetical. Each pairing
# was read by a person; never add one on a token overlap alone.
ALIASES = {
    ("Cisco", "Cisco Certified Network Associate (CCNA)"): "CCNA Certification",
    ("CompTIA", "CompTIA CySA+"): "CompTIA Cybersecurity Analyst",
    ("CompTIA", "CompTIA Cloud Essentials+"): "CompTIA Cloud Essentials",
    ("Amazon Web Services", "AWS Certified SysOps Administrator"):
        "AWS Certified SysOps Administrator - Associate",
    ("Linux Professional Institute", "LPIC-1 Linux Administrator"):
        "Linux Server Professional Certification - Level 1",
    ("Oracle", "Oracle Database SQL Certified Associate (1Z0-071)"):
        "Oracle Database SQL",
    ("Oracle", "Oracle Database PL/SQL Developer Certified Professional (1Z0-149)"):
        "Oracle Database Program with PL/SQL",
    ("Google", "Google IT Support Professional Certificate"):
        "Google IT Support Professional Certificate",
    # Microsoft Office Specialist editions (2016, 2019, 365) are one credential
    # for CPL purposes; MAP titles name the application, COS names the edition.
    ("Microsoft", "Microsoft Office Specialist — Excel"):
        "Microsoft Office Specialist: Excel Associate (Excel and Excel 2019)",
    ("Microsoft", "Microsoft Office Specialist — Word"):
        "Microsoft Office Specialist: Word Associate (Word and Word 2019)",
    ("Microsoft", "Microsoft Office Specialist — Outlook"):
        "Microsoft Office Specialist: Outlook Associate (Outlook and Outlook 2019)",
    ("Microsoft", "Microsoft Office Specialist — PowerPoint"):
        "Microsoft Office Specialist: PowerPoint Associate (PowerPoint and PowerPoint 2019)",
    ("Microsoft", "Microsoft Office Specialist — Excel Expert"):
        "Microsoft Office Specialist: Microsoft Excel Expert (Excel and Excel 2019)",
    ("Microsoft", "Microsoft Office Specialist — Word Expert"):
        "Microsoft Office Specialist: Microsoft Word Expert (Word and Word 2019)",
    ("Microsoft", "Microsoft Office Specialist — Access Expert"):
        "Microsoft Office Specialist: Microsoft Access Expert (Access and Access 2019)",
    ("Microsoft", "Microsoft Office Specialist — Access"):
        "Microsoft Office Specialist: Microsoft Access 2016",
}

# MAP titles that name a family rather than one credential. They stay out of
# the per-credential join and are counted apart, so a college's "CompTIA
# Certification (unspecified)" never lands on A+ by guesswork.
MAP_GENERIC = {"CompTIA Certification (unspecified)", "GIAC Certification",
               "Microsoft Office Specialist (generic)", "Microsoft Office Specialist"}

# Vendor prefixes and filler that differ between sources for one credential.
_PREFIX = re.compile(
    r"^(microsoft 365 certified|microsoft certified|microsoft|comptia|"
    r"aws certified|amazon web services|aws|google cloud certified|google cloud|"
    r"google|ibm certified|ibm|oracle certified|oracle|cisco certified|cisco|"
    r"red hat certified|red hat|nvidia certified|nvidia|salesforce certified|"
    r"salesforce|ec council|giac|isc2)\b[: -]*")


def norm(s):
    s = (s or "").lower()
    s = re.sub(r"[‐-―−]", "-", s)
    s = s.replace("&", " and ")
    s = re.sub(r"\([^)]*\)", " ", s)
    s = s.replace("+", "plus")
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return " ".join(s.split())


def core(name):
    """The name with vendor prefix, exam-code parentheticals and trailing
    'certification' stripped -- 'Microsoft Certified: Azure AI Fundamentals
    (AI-900)' and 'Microsoft Azure AI Fundamentals' share one core."""
    n = norm(name)
    for _ in range(2):
        n = _PREFIX.sub("", n).strip()
    n = re.sub(r"\b(certification|certificate|certified|exam)$", "", n).strip()
    return n


def issuer_of(org):
    for rx, name, scope in _ISSUER_RX:
        if rx.search(org or ""):
            return name, scope
    return None, None


def domain_of(name, issuer):
    text = name + " " + ("aws" if issuer == "Amazon Web Services" else "")
    for dname, rx in _DOMAIN_RX:
        if rx.search(text):
            if issuer in SECURITY_ISSUERS and dname != "AI and machine learning":
                return "Cybersecurity"
            return dname
    return "Cybersecurity" if issuer in SECURITY_ISSUERS else OTHER_IT


# Credential Engine top-50 CTID -> the catalog rows it is, where the names differ
# in more than punctuation or a vendor prefix (a person read each pairing). A
# Certiport/Pearson pair of one IT Specialist exam carries the CTID on both rows.
# Credentials the catalog lacks (PCEP, CAPM, the trades) stay in
# kb/reference/credential_engine_top50.json with no catalog row.
CE_TOP50_ALIASES = {
    "ce-969da20e-c127-4175-93f3-0722063ca7fc": ["AWS Certified Cloud Practitioner"],
    "ce-b9eb2864-f5a6-4c55-b048-3b5aa7bc8c4c": ["CCNA Certification"],
    "ce-9b80b165-9629-409c-8d6c-e7de0d22a973": [
        "IT Specialist - HTML5 Application Development",
        "Information Technology Specialist - HTML5 Application Development"],
    "ce-af9f9fa7-63bc-43cd-899c-ebc3a464103b": ["Information Technology Specialist - HTML and CSS"],
    "ce-60a4069d-d037-4ed1-b7ef-f3f70ff7de01": [
        "Information Technology Specialist - Device Configuration and Management"],
}


def ctdl_owner(t):
    """The Registry record's owner, or its offerer when it names no owner."""
    a = (t.get("owned_by") or t.get("offered_by") or [{}])[0]
    return a.get("name")


def ctdl_block(t):
    """The CTDL terms a catalog row carries from its Registry record."""
    keep = ("ctdl_type", "status", "audience_level", "occupation_type", "industry_type",
            "instructional_program_type", "estimated_duration", "renewal_frequency",
            "subject_webpage", "registry_url", "same_as", "requires_credential_ctids",
            "requires_conditions")
    b = {k: t[k] for k in keep if t.get(k) not in (None, "", [])}
    b["owned_by"] = [{"ctid": a["ctid"], "name": a["name"]} for a in t.get("owned_by", [])]
    b["collection_count"] = t["collection_count"]
    b["rank"] = t["rank"]
    return b


def load_json(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def load_js_object(path):
    with open(path, encoding="utf-8") as fh:
        src = fh.read()
    return json.loads(src[src.index("{"):src.rindex("}") + 1])


def _add(rows, index, issuer, name, fields, source):
    key = (issuer, core(name))
    code = (fields.get("code") or "").upper().strip()
    hit = index.get(key) or (index.get((issuer, "#" + code)) if code else None)
    if hit is None:
        hit = {"issuer": issuer, "name": name, "sources": []}
        rows.append(hit)
    for k, v in fields.items():
        if v not in (None, "", []) and hit.get(k) in (None, "", []):
            hit[k] = v
    if source not in hit["sources"]:
        hit["sources"].append(source)
    index[key] = hit
    if code:
        index[(issuer, "#" + code)] = hit
    acr = norm(fields.get("acronym") or "")
    if acr:
        index.setdefault((issuer, "~" + acr), hit)
    return hit


def build(root=ROOT):
    cos = load_json(os.path.join(root, "kb", "reference", "cos_certifications.json"))
    ce = load_json(os.path.join(root, "kb", "reference",
                                "credential_registry_national_sample.json"))
    watch_path = os.path.join(root, "kb", "reference", "industry_credential_watch.json")
    watch = load_json(watch_path) if os.path.exists(watch_path) else {"credentials": []}
    skills_path = os.path.join(root, "kb", "reference", "industry_credential_skills.json")
    skills = load_json(skills_path) if os.path.exists(skills_path) else {"credentials": []}
    top_path = os.path.join(root, "kb", "reference", "credential_engine_top50.json")
    top50 = load_json(top_path) if os.path.exists(top_path) else {"credentials": []}
    lic_path = os.path.join(root, "kb", "reference", "california_occupational_licenses.json")
    licenses = load_json(lic_path) if os.path.exists(lic_path) else {"licenses": []}
    cip_titles = load_cip_titles(os.path.join(root, "kb", "reference", "CIPCode2020.csv"))
    for rules in CIP_RULES.values():
        for _p, code in rules:
            if code not in cip_titles:
                raise SystemExit(f"CIP_RULES names {code}, which is not a live CIP 2020 code")
    for _p, code in FIELD_RULES + ISSUER_FIELD_RULES:
        if code not in cip_titles:
            raise SystemExit(f"FIELD_RULES names {code}, which is not a live CIP 2020 code")
    for code in SOC_MAJOR_CIP.values():
        if code not in cip_titles:
            raise SystemExit(f"SOC_MAJOR_CIP names {code}, which is not a live CIP 2020 code")
    cer = load_js_object(os.path.join(root, "credential_reference_data.js"))

    rows, index = [], {}

    # The issuers' own pages first, so their current official names win.
    for w in watch.get("credentials", []):
        if not w.get("verified"):
            continue
        issuer, _ = issuer_of(w["issuer"])
        issuer = issuer or w["issuer"]
        hit = _add(rows, index, issuer, w["name"], {
            "code": w.get("code"), "kind": w.get("kind") or "certification",
            "level": w.get("level"), "status": w.get("status"),
            "launched": w.get("launched"), "emerging": bool(w.get("emerging")),
            "url": w.get("url"), "platform": w.get("platform"),
            "hours": w.get("hours"), "cost": w.get("cost"),
            "ace_credit": w.get("ace_credit"), "formerly": w.get("formerly"),
            "domain_hint": w.get("domain"), "notes": w.get("notes"),
            "verified_on": watch.get("_verified_on"),
        }, "issuer site")
        # A renamed credential keeps its old names as keys, so the registry
        # row and the MAP exhibit filed under the old name land on this row
        # (Cisco CyberOps Associate is CCNA Cybersecurity since 2026-02-03).
        for former in w.get("formerly") or []:
            index[(issuer, core(former))] = hit

    for c in cos["certifications"]:
        if not c.get("name"):
            continue
        issuer, scope = issuer_of(c.get("org"))
        if not issuer:
            continue
        if scope == "it" and domain_of(c["name"], issuer) not in IT_DOMAINS:
            continue
        _add(rows, index, issuer, c["name"], {
            "kind": "certification", "acronym": c.get("acronym"),
            "cos_type": c.get("type"), "url": c.get("url"), "cos_id": c.get("id"),
        }, "CareerOneStop")

    for c in ce["credentials"]:
        issuer, scope = issuer_of(c.get("provider"))
        if not issuer or c.get("provider_confidence") == "low":
            continue
        if scope == "it" and domain_of(c["name"], issuer) not in IT_DOMAINS:
            continue
        _add(rows, index, issuer, c["name"], {"kind": "certification"},
             "Credential Engine")

    # Every other field (the widening of 2026-10-30). The IT sources above stay
    # scoped by issuer; these come in whole, and each row is marked `wide` until
    # its field is assigned below. Same key (issuer, core name) as everything
    # else, so a credential two sources list is one row.
    it_cores = {core(r["name"]) for r in rows}

    def add_wide(issuer, name, fields, source, ctdl=None):
        before = len(rows)
        hit = _add(rows, index, issuer, name, {"kind": "certification", **fields}, source)
        if len(rows) > before:
            hit["wide"] = True
            if ctdl:
                hit["_ctdl_src"] = ctdl
        return hit

    top_kind = {"Certification": "certification", "Certificate": "certificate",
                "BasicTechnicalCertificate": "certificate"}
    for t in top50.get("credentials", []):
        if t["ctid"] in CE_TOP50_ALIASES or core(t["name"]) in it_cores:
            continue          # an IT row; the CTID join below attaches it
        owner = ctdl_owner(t) or "Credential Engine"
        issuer = issuer_of(owner)[0] or owner
        add_wide(issuer, t["name"], {"kind": top_kind.get(t["ctdl_type"].split(":")[-1], "certification"),
                                     "url": t.get("subject_webpage"),
                                     "status": (t.get("status") or "").lower() or None},
                 "Credential Engine", ctdl=t)
    for lic in licenses.get("licenses", []):
        add_wide(lic.get("issuer") or "California licensing agency", lic["name"],
                 {"kind": "license"}, "Credential Engine (California licenses)")
    for c in cos["certifications"]:
        if not c.get("name") or not c.get("org"):
            continue
        issuer = issuer_of(c["org"])[0] or c["org"].strip()
        if (issuer, core(c["name"])) in index:
            continue
        add_wide(issuer, c["name"], {"kind": "certification", "acronym": c.get("acronym"),
                                     "cos_type": c.get("type"), "url": c.get("url"),
                                     "cos_id": c.get("id")}, "CareerOneStop")
    for c in ce["credentials"]:
        if c.get("provider_confidence") == "low" or not c.get("provider"):
            continue
        issuer = issuer_of(c["provider"])[0] or c["provider"].strip()
        if (issuer, core(c["name"])) in index:
            continue
        add_wide(issuer, c["name"], {"kind": "certification"}, "Credential Engine")

    # Domain: the watch file's own call where it made a specific one, else the
    # name. Its broad "IT" and "Productivity" calls defer to the name, which
    # tells a UX design certificate from an IT support one.
    hint_map = {"AI": "AI and machine learning", "Data": "Data and analytics",
                "Cyber": "Cybersecurity", "Cloud": "Cloud, networks and systems"}
    for r in rows:
        if r.get("wide"):
            r["domain"] = None        # set from the CIP below
        else:
            r["domain"] = hint_map.get(r.pop("domain_hint", None)) or domain_of(r["name"], r["issuer"])
        r["tech_giant"] = r["issuer"] in TECH_GIANTS
        r.setdefault("emerging", False)
        r.setdefault("kind", "certification")

    # ---- MAP side ---------------------------------------------------------
    catalog_issuers = {name for _p, name, _s in ISSUERS}
    map_generic, map_unmatched = [], []
    wide_by_core = defaultdict(list)
    for r in rows:
        if r.get("wide"):
            wide_by_core[core(r["name"])].append(r)
    wide_joined = 0
    for u in cer["unified_titles"]:
        issuer, scope = issuer_of(u.get("issuer"))
        if issuer not in catalog_issuers:
            # Outside IT the catalog adds no row for an exhibit nothing else
            # lists; it joins an exhibit to the one row whose core name it
            # shares, and skips an ambiguous name.
            cands = wide_by_core.get(core(u["ut"]), [])
            if len(cands) == 1:
                colleges, units = set(), []
                for a in u.get("articulations", []):
                    for loc in a.get("local", []):
                        colleges.update(loc.get("colleges", []))
                        if loc.get("u"):
                            units.append(float(loc["u"]))
                hit = cands[0]
                m = hit.setdefault("map", {"titles": [], "colleges": [], "units": [],
                                           "articulation_lines": 0})
                m["titles"].append(u["ut"])
                m["colleges"] = sorted(set(m["colleges"]) | colleges)
                m["units"] += units
                m["articulation_lines"] += u.get("n_articulation_lines") or 0
                if "MAP" not in hit["sources"]:
                    hit["sources"].append("MAP")
                wide_joined += 1
            continue
        title = u["ut"]
        if scope == "it" and domain_of(title, issuer) not in IT_DOMAINS:
            continue
        if title in MAP_GENERIC:
            map_generic.append(title)
            continue
        colleges, units = set(), []
        for a in u.get("articulations", []):
            for loc in a.get("local", []):
                colleges.update(loc.get("colleges", []))
                if loc.get("u"):
                    units.append(float(loc["u"]))
        alias = ALIASES.get((issuer, title))
        hit = (index.get((issuer, core(alias))) if alias else None) \
            or index.get((issuer, core(title))) \
            or index.get((issuer, "~" + norm(re.sub(r"^.*?\(([^)]+)\)\s*$", r"\1", title))))
        if hit is None:
            # A MAP credential no registry lists (CompTIA Linux+, a retired
            # Microsoft exam, a Networking Academy course). It still belongs in
            # the catalog: colleges articulated it.
            hit = _add(rows, index, issuer, title, {"kind": "certification"}, "MAP")
            hit["domain"] = domain_of(title, issuer)
            hit["tech_giant"] = issuer in TECH_GIANTS
            hit["emerging"] = False
            map_unmatched.append(title)
        m = hit.setdefault("map", {"titles": [], "colleges": [], "units": [],
                                   "articulation_lines": 0})
        m["titles"].append(title)
        m["colleges"] = sorted(set(m["colleges"]) | colleges)
        m["units"] += units
        m["articulation_lines"] += u.get("n_articulation_lines") or 0
        if "MAP" not in hit["sources"]:
            hit["sources"].append("MAP")

    # Issuer-published skills: joined like everything else, on (issuer, exam
    # code) first and (issuer, core name) second.
    skills_attached = 0
    for sk in skills.get("credentials", []):
        if not sk.get("verified") or not sk.get("skills"):
            continue
        issuer, _ = issuer_of(sk["issuer"])
        issuer = issuer or sk["issuer"]
        code = (sk.get("code") or "").upper().strip()
        hit = (index.get((issuer, "#" + code)) if code else None) \
            or index.get((issuer, core(sk["name"])))
        if hit is None:
            continue
        hit["skills"] = {"kind": sk.get("skills_kind"), "exam_version": sk.get("exam_version"),
                         "domains": sk["skills"], "source_url": sk.get("source_url"),
                         "harvested_on": skills.get("_harvested_on")}
        skills_attached += 1

    # Credential Engine's most-referenced credentials: the Registry's CTID and
    # CTDL terms ride on the catalog row they are, joined on the core name and
    # then on the reviewed aliases above. One CTID may mark two rows.
    ctid_attached = set()
    by_name = defaultdict(list)
    for r in rows:
        by_name[r["name"]].append(r)
        by_name["~" + core(r["name"])].append(r)
    for t in top50.get("credentials", []):
        hits = [h for n in CE_TOP50_ALIASES.get(t["ctid"], []) for h in by_name.get(n, [])] \
            or by_name.get("~" + core(t["name"]), [])
        owner = issuer_of(ctdl_owner(t))[0] or ctdl_owner(t) or "Credential Engine"
        for h in hits:
            # A row from the open-ended sources carries the CTID only when its
            # issuer is the Registry record's owner (two boards' "Certified
            # Dental Assistant" are two credentials).
            if h.get("wide") and h["issuer"] != owner:
                continue
            h["ctid"] = t["ctid"]
            h["ctdl"] = ctdl_block(t)
            if "Credential Engine" not in h["sources"]:
                h["sources"].append("Credential Engine")
            ctid_attached.add(t["ctid"])

    for r in rows:
        if r.get("wide"):
            code, src = field_cip(r["name"], r.pop("_ctdl_src", None), r["issuer"])
            if code is None:
                r["domain"] = NO_FIELD
                r["cip"] = {"code": None, "title": None, "sector": None,
                            "sector_title": NO_FIELD, "source": None}
            else:
                r["domain"] = sector_title(cip_titles[code[:2]])
                r["cip"] = {"code": code, "title": cip_titles[code], "sector": code[:2],
                            "sector_title": r["domain"], "source": src}
            r.pop("wide")
        else:
            code = cip_of(r["name"], r["domain"])
            r["cip"] = {"code": code, "title": cip_titles[code],
                        "sector": code[:2], "sector_title": sector_title(cip_titles[code[:2]]),
                        "source": "rule (domain and name)"}
        m = r.get("map")
        if m:
            u = m.pop("units")
            m["colleges_n"] = len(m["colleges"])
            m["units_min"] = min(u) if u else None
            m["units_max"] = max(u) if u else None
            r["map_status"] = "articulated" if m["colleges_n"] else "exhibit, not yet articulated"
        else:
            r["map_status"] = "not in MAP"

    rows.sort(key=lambda r: (r["domain"], not r["tech_giant"], r["issuer"],
                             -(r.get("map") or {}).get("colleges_n", 0), r["name"]))
    for i, r in enumerate(rows, 1):
        r["id"] = f"ITC{i:04d}"

    by_domain = defaultdict(Counter)
    for r in rows:
        by_domain[r["domain"]][r["map_status"]] += 1
    return {
        "_about": ("IT, cybersecurity, data and AI credentials -- certifications, "
                   "course certificates and badges -- by issuer, joined to MAP. "
                   "DERIVED by kb/_build_it_ai_credential_catalog.py; never edit "
                   "by hand. A 'not in MAP' row is an opportunity: a credential "
                   "students can hold that no college has an exhibit for."),
        "_attribution": ATTRIBUTION,
        "_inputs": {
            "cos_synced_at": cos.get("_synced_at"),
            "credential_engine_captured_on": ce.get("_captured_on"),
            "credential_engine_coverage": ce.get("_coverage"),
            "watch_verified_on": watch.get("_verified_on"),
            "cer_generated_at": cer.get("_generated_at"),
            "ce_top50_fetched_on": top50.get("_fetched_on"),
        },
        "_stats": {
            "credentials": len(rows),
            "issuers": len({r["issuer"] for r in rows}),
            "tech_giant_credentials": sum(r["tech_giant"] for r in rows),
            "emerging": sum(bool(r["emerging"]) for r in rows),
            "in_map": sum(r["map_status"] != "not in MAP" for r in rows),
            "articulated": sum(r["map_status"] == "articulated" for r in rows),
            "with_issuer_skills": skills_attached,
            "wide_rows_joined_to_map": wide_joined,
            "not_yet_assigned": sum(r["domain"] == NO_FIELD for r in rows),
            "with_ctid": sum(bool(r.get("ctid")) for r in rows),
            "ce_top50_in_catalog": len(ctid_attached),
            "ce_top50_total": len(top50.get("credentials", [])),
            "by_cip_sector": dict(Counter(f'{r["cip"]["sector"]} {r["cip"]["sector_title"]}'
                                          for r in rows).most_common()),
            "by_domain": {d: dict(c) for d, c in sorted(by_domain.items())},
            "map_titles_generic": sorted(map_generic),
            "map_titles_without_registry_row": sorted(map_unmatched),
        },
        "credentials": rows,
    }


def write_xlsx(cat, path):
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill
    from openpyxl.utils import get_column_letter

    head_fill = PatternFill("solid", fgColor="002F6D")
    head_font = Font(bold=True, color="FFFFFF")
    wb = Workbook()
    ws = wb.active
    ws.title = "Read me"
    s = cat["_stats"]
    lines = [
        ("IT, cybersecurity, data and AI credentials by issuing agency", True),
        ("CPL Initiative, California Community Colleges Chancellor's Office", False),
        ("", False),
        (f"{s['credentials']:,} credentials from {s['issuers']} issuers. "
         f"{s['in_map']} are in MAP; colleges have articulated {s['articulated']}.", False),
        ("A row marked 'not in MAP' is a credential students can hold that no "
         "college has an exhibit for yet. Faculty decide the credit; the catalog "
         "names the evidence.", False),
        ("", False),
        ("Reading the columns", True),
        ("Domain and CIP sector group the credentials for filtering. The CIP sector is the "
         "two-digit CIP 2020 family and the CIP code the six-digit program code beneath it, "
         "both assigned from the credential's field and name; neither is an issuer's claim.", False),
        ("Emerging marks a credential launched or rebuilt since 2024, or one built for AI. "
         "Status comes from the issuer's own page: active, new, beta, retiring or retired. A "
         "retired credential stays listed because students still hold it.", False),
        ("MAP status reads 'articulated' when at least one college has articulated the "
         "credential, 'exhibit, not yet articulated' when MAP holds an exhibit no college has "
         "used, and 'not in MAP' otherwise.", False),
        ("Issuer-published skills are the exam domains, with the issuer's weights, or the "
         "courses inside a certificate, as the issuer states them.", False),
        ("", False),
        ("Sources", True),
        (f"CareerOneStop Certification Finder, synced {(cat['_inputs']['cos_synced_at'] or '')[:10]}", False),
        (f"Credential Engine National Certification Collection, sample captured "
         f"{cat['_inputs']['credential_engine_captured_on']}: 974 of its 6,738 members", False),
        (f"Issuer websites, checked {cat['_inputs']['watch_verified_on']}", False),
        (f"MAP platform articulated exhibits (CPL Credential Reference), "
         f"{(cat['_inputs']['cer_generated_at'] or '')[:10]}", False),
        ("", False),
        ("Attribution: " + cat["_attribution"], False),
        ("A snapshot. The live catalog rebuilds from the tracker repository "
         "(kb/_build_it_ai_credential_catalog.py).", False),
    ]
    for i, (t, bold) in enumerate(lines, 1):
        c = ws.cell(row=i, column=1, value=t)
        c.font = Font(bold=bold, size=14 if i == 1 else 11)
        c.alignment = Alignment(wrap_text=True, vertical="top")
    ws.column_dimensions["A"].width = 110

    cols = [("Domain", 26), ("CIP sector", 30), ("CIP code", 40),
            ("Issuer", 22), ("Credential", 58), ("Exam or code", 13),
            ("Kind", 20), ("Level", 16), ("Tech giant", 10), ("Emerging", 10),
            ("Status", 10), ("MAP status", 26), ("Colleges articulating", 12),
            ("Units (range)", 13), ("MAP title", 44), ("Colleges", 60),
            ("Sources", 34), ("Official page", 48), ("Issuer-published skills", 90),
            ("Skills source", 48), ("Notes", 50), ("CTID", 44), ("CTDL occupation", 40)]

    def sheet(title, rows):
        w = wb.create_sheet(title)
        for j, (h, width) in enumerate(cols, 1):
            c = w.cell(row=1, column=j, value=h)
            c.fill, c.font = head_fill, head_font
            c.alignment = Alignment(wrap_text=True, vertical="top")
            w.column_dimensions[get_column_letter(j)].width = width
        for i, r in enumerate(rows, 2):
            m = r.get("map") or {}
            units = ""
            if m.get("units_min") is not None:
                lo, hi = m["units_min"], m["units_max"]
                units = f"{lo:g}" if lo == hi else f"{lo:g}-{hi:g}"
            sk = r.get("skills") or {}
            skill_text = "; ".join(
                d["name"] + (f" ({d['weight']})" if d.get("weight") else "")
                for d in sk.get("domains", []))
            cip = r["cip"]
            vals = [r["domain"], f'{cip["sector"]} {cip["sector_title"]}' if cip["code"] else NO_FIELD,
                    f'{cip["code"]} {cip["title"]}' if cip["code"] else "",
                    r["issuer"], r["name"], r.get("code") or r.get("acronym") or "",
                    r.get("kind", ""), r.get("level") or r.get("cos_type") or "",
                    "yes" if r["tech_giant"] else "", "yes" if r["emerging"] else "",
                    r.get("status") or "", r["map_status"], m.get("colleges_n") or "",
                    units, "; ".join(m.get("titles", [])), "; ".join(m.get("colleges", [])),
                    ", ".join(r["sources"]), r.get("url") or "", skill_text,
                    sk.get("source_url") or "", r.get("notes") or "", r.get("ctid") or "",
                    "; ".join(f'{o["code"]} {o["name"]}' for o in (r.get("ctdl") or {}).get("occupation_type", []))]
            for j, v in enumerate(vals, 1):
                w.cell(row=i, column=j, value=v)
        w.freeze_panes = "F2"
        w.auto_filter.ref = f"A1:{get_column_letter(len(cols))}{len(rows) + 1}"
        return w

    rows = cat["credentials"]
    sheet("Tech giants, emerging",
          [r for r in rows if r["tech_giant"] and r["emerging"]])
    sheet("All credentials", rows)
    sheet("In MAP", sorted([r for r in rows if r.get("map")],
                           key=lambda r: -r["map"]["colleges_n"]))
    sheet("Not in MAP (opportunities)", [r for r in rows if not r.get("map")])

    w = wb.create_sheet("By issuer")
    hdr = ["Issuer", "Tech giant", "Credentials", "Emerging", "In MAP", "Articulated"]
    for j, h in enumerate(hdr, 1):
        c = w.cell(row=1, column=j, value=h)
        c.fill, c.font = head_fill, head_font
    agg = defaultdict(lambda: [0, 0, 0, 0])
    for r in rows:
        a = agg[r["issuer"]]
        a[0] += 1
        a[1] += bool(r["emerging"])
        a[2] += r["map_status"] != "not in MAP"
        a[3] += r["map_status"] == "articulated"
    for i, (iss, a) in enumerate(sorted(agg.items(), key=lambda kv: -kv[1][0]), 2):
        for j, v in enumerate([iss, "yes" if iss in TECH_GIANTS else ""] + a, 1):
            w.cell(row=i, column=j, value=v)
    w.column_dimensions["A"].width = 32
    w.freeze_panes = "A2"
    wb.save(path)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--xlsx", help="also write a workbook to this path")
    args = ap.parse_args(argv)
    cat = build()
    text = json.dumps(cat, indent=1, ensure_ascii=False) + "\n"
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(text)
    s = cat["_stats"]
    print(f"wrote {os.path.relpath(OUT, ROOT)}: {s['credentials']} credentials, "
          f"{s['issuers']} issuers, {s['in_map']} in MAP, {s['articulated']} articulated")
    if args.xlsx:
        write_xlsx(cat, args.xlsx)
        print(f"wrote {args.xlsx}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

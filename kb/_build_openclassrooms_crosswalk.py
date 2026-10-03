#!/usr/bin/env python3
"""Build the OpenClassrooms Digital Marketer -> CCC CPL crosswalk.

The question, in Ashley's words (2026-09-29): *"identify potential CPL opportunities
across the California Community Colleges"* for the OpenClassrooms Digital Marketer
Registered Apprenticeship -- MAP first (statewide credit recommendations, exhibits,
articulations), then the wider COCI course universe, "including courses that have
never been added to MAP."

WHAT THE TRAINING IS (Appendix A work process schedule + the program syllabus):
O*NET 13-1161.01 Search Marketing Strategists, RAPIDS 2077CB. Competency-based, 27
work-process competencies (A-AA), 400 hours of related instruction in seven online
projects (paid ads / Google Ads, SaaS app design + wireframes + A/B, social media
strategy, market research + personas, SEO audit + content calendar, landing pages +
email nurture + CRM + financial modeling). Credential: DOL Certificate of Completion
of Apprenticeship.

SHAPE: one training x every college -- the Futuro/HTH shape
(`_build_futuro_hth_crosswalk.py`), not the occupation engine. No occupation
vocabulary to reconcile.

SOURCES (committed or MAP-owned; nothing scraped):
  * coci_lookup_data.js + coci_lookup_desc_*.js -- COCI course list (141,738 rows,
    catalog descriptions) -- the "beyond MAP" universe.
  * kb/reference/cb_course_basic_fall2025.csv -- MIS Fall 2025 course inventory;
    presence there is the "currently active" check.
  * coci_programs_data.js -- COCI program inventory (certificates / degrees).
  * statewide_data.js -- every MAP exhibit with its credit recommendations + adopters.
  * kb/openclassrooms_map_ace_recs.json -- MAP's ACE (military) credit
    recommendations in the same subjects, read from Supabase 2026-09-29.
  * kb/reference/swp_region_roster.json -- college -> Strong Workforce region.
  * kb/college_identity/2026-08-23/crosswalk.json -- every college spelling.

MATCHING GATE (the Futuro lesson): a course needs TWO signals -- a TITLE lens hit
AND a TOP code in a business / media / IT family -- or, found by description, a
strong digital-marketing phrase in the catalog description AND that TOP family.
TOP is only the corroborating filter here, never the determination (CLAUDE.md
Rule 7 TOP caveat). Alignment strength then comes from how many of the 27
competencies the title + description actually evidence.

Run:  python3 kb/_build_openclassrooms_crosswalk.py
"""
import collections
import csv
import glob
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
OUT = os.path.join(HERE, "openclassrooms_out")

TITLE = "Digital Marketer (O*NET 13-1161.01 Search Marketing Strategists)"
CERT = ("OpenClassrooms Digital Marketer Registered Apprenticeship (RAPIDS 2077CB) "
        "- DOL Certificate of Completion of Apprenticeship")

# ------------------------------------------------------------- competencies ---
# The 27 Appendix A work processes, grouped where OpenClassrooms' own projects
# group them. Each group carries the phrases that evidence it in a course.
COMPETENCIES = [
    ("Digital marketing strategy & campaigns", "A, O",
     r"digital marketing|online marketing|internet marketing|marketing strateg|marketing plan|campaign|content strateg|multi-?channel|omni-?channel|integrated marketing"),
    ("Paid search, display & social ads", "A, S, T",
     r"pay[- ]per[- ]click|\bppc\b|paid (search|social|media|advertising)|google ads|adwords|display ad|banner|search engine marketing|online advertis|digital advertis|affiliate|sponsorship"),
    ("Web analytics, KPIs & reporting", "B, C, D, Q, U",
     r"analytics|web metrics|key performance|\bkpis?\b|click-?through|conversion|traffic|marketing metrics|measur(e|ing) (campaign|marketing)|return on (ad|marketing|investment)|\broi\b"),
    ("Search engine optimization (SEO)", "C, G, R",
     r"search engine|\bseo\b|keyword|search ranking|organic search"),
    ("Social media marketing & influencers", "I, A",
     r"social media|influencer|social network|facebook|instagram|tiktok|linkedin|youtube"),
    ("Market research, personas & competition", "F, M",
     r"market(ing)? research|persona|target (audience|market|customer)|segment|consumer behavior|buyer behavior|competit(or|ive)|survey"),
    ("Content, copy & brand-consistent media", "A, H, J",
     r"content (marketing|creation|calendar)|copywrit|storytelling|brand|blog|graphic|visual content|multimedia"),
    ("UX, wireframes & A/B testing", "F, G, J, V",
     r"user experience|\bux\b|user interface|wirefram|prototyp|mock-?up|usability|a/b|split test|landing page"),
    ("E-commerce & conversion optimization", "E, V, W",
     r"e-?commerce|electronic commerce|online (store|retail|sales)|shopping cart|checkout|conversion rate"),
    ("CRM, email & lead generation", "T, Z",
     r"customer relationship|\bcrm\b|email marketing|e-?mail campaign|lead generation|lifetime value|growth hack|nurtur|customer (experience|retention|service)"),
    ("Budgeting & financial modeling", "X",
     r"budget|forecast|financial model|pricing"),
    ("Regulation, privacy & ethics", "K, Y",
     r"privacy|regulat|legal|ethic|law\b"),
    ("Web code (HTML/XML)", "AA, L",
     r"\bhtml\b|\bxml\b|\bcss\b|web page|web development|content management system"),
]

# ------------------------------------------------------------------- lenses ---
# (lens, title regex, core?) -- core lenses are the heart of the apprenticeship.
LENSES = [
    ("Digital / Internet Marketing", r"digital market|internet market|online market|e-?market|web market|marketing (in|for) (a |the )?digital|marketing online|mobile market", True),
    ("Social Media Marketing", r"social media|social network|influencer", True),
    ("Search Engine Optimization / Search Marketing", r"search engine|\bseo\b|search marketing|pay.per.click|google ad", True),
    ("Marketing & Web Analytics", r"(marketing|web|digital|social media|google) analytics|marketing metrics|marketing data", True),
    ("Content Marketing & Copywriting", r"content (marketing|strategy|creation)|copywrit|writing for (the )?(web|digital|social|online)|marketing content", True),
    ("CRM, Email & Growth Marketing", r"customer relation|\bcrm\b|email marketing|growth hack|marketing automation|salesforce|hubspot", True),
    ("E-Commerce", r"e-?commerce|electronic commerce|online business|internet business|selling online", False),
    ("Advertising", r"advertis", False),
    ("Marketing Research & Consumer Behavior", r"market(ing)? research|consumer behavior|buyer behavior", False),
    ("Marketing Strategy & Management", r"marketing (strateg|management|plan|communication|campaign)|integrated marketing|strategic marketing", False),
    ("Principles of Marketing", r"principles of marketing|marketing principles|intro(duction)?( to)? marketing|^\s*marketing\s*$|fundamentals of marketing|marketing fundamentals|marketing essentials", False),
    ("UX / UI Design & Prototyping", r"user experience|\bux\b|\bui\b|user interface|wirefram|interaction design|user-centered", False),
    ("Branding & Public Relations", r"\bbrand(ing)?\b|public relations|reputation", False),
]

# Bakersfield College's APPR B73 series is the OpenClassrooms Digital Marketer
# curriculum course-for-course: each description restates one project's brief
# (read against the syllabus 2026-09-29). Recorded as a ruling, not inferred.
DIRECT = {
    ("Bakersfield College", "APPR B73A"): "Project 1 - Dive into your Digital Marketer Apprenticeship (soft skills)",
    ("Bakersfield College", "APPR B73B"): "Project 2 - Paid ad campaign for a luxury fragrance (Google Ads)",
    ("Bakersfield College", "APPR B73C"): "Project 3 - Improve the design and launch of a SaaS invoicing app",
    ("Bakersfield College", "APPR B73D"): "Project 5 - Identify target customer groups (market research)",
    ("Bakersfield College", "APPR B73E"): "Project 4 - Ocean Heaven social media strategy",
    ("Bakersfield College", "APPR B73F"): "Project 6 - SEO audit and editorial calendar",
    ("Bakersfield College", "APPR B73G"): "Project 7 - Landing pages, email nurture and lifetime value",
}

# Strong digital-marketing phrases that find a course by its DESCRIPTION when the
# title is generic ("Marketing in Today's World").
DESC_PHRASES = [
    ("Digital / Internet Marketing", r"digital marketing|internet marketing|online marketing"),
    ("Search Engine Optimization / Search Marketing", r"search engine optimization|search engine marketing|pay-per-click"),
    ("Social Media Marketing", r"social media marketing"),
    ("Marketing & Web Analytics", r"google analytics|web analytics|marketing analytics"),
    ("CRM, Email & Growth Marketing", r"email marketing|marketing automation"),
]

NOISE = re.compile(r"work exp|internship|intern\b|cooperative|co-?op\b|independent stud|directed stud|"
                   r"special (topics|projects)|career exploration|occupational work", re.I)

# TOP families that corroborate a marketing / digital-media / IT course.
def top_ok(top4):
    if not top4:
        return False
    if top4[:2] in ("05", "06", "07"):
        return True
    return top4 in ("1012", "1030", "1099", "4930", "1303", "1307")

BUSINESS_MEDIA = re.compile(r"^(05|06|07)")


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
    # spellings the crosswalk does not carry (COCI program file, Calbright's split)
    idx[norm_college("SAN FRANCISCO CITY")] = "City College of San Francisco"
    idx[norm_college("Calbright College Credit")] = "Calbright College"
    idx[norm_college("Calbright College Non-Credit")] = "Calbright College"
    idx[norm_college("CALBRIGHT")] = "Calbright College"
    return idx


def build_region():
    r = json.load(open(os.path.join(HERE, "reference", "swp_region_roster.json")))
    out = {}
    for reg in r["regions"].values():
        for c in reg["colleges"]:
            out[norm_college(c)] = reg["name"]
    return out


def competencies_hit(text):
    hits = []
    for name, letters, pat in COMPETENCIES:
        if re.search(pat, text, re.I):
            hits.append((name, letters))
    return hits


MARKETING_TOP = ("0509", "0506", "0501")


def strength(lens, core, hits, evidence, top4, market_signal=True):
    """Strong = the course is about what the apprenticeship teaches AND its title +
    description evidence at least three competency groups. A course found only by
    its description (a web-design course that mentions SEO) tops out at Moderate
    unless it sits in a marketing / business TOP family."""
    n = len([h for h in hits if h[0] not in ("Regulation, privacy & ethics", "Budgeting & financial modeling")])
    if lens in ("Branding & Public Relations", "UX / UI Design & Prototyping"):
        return "Moderate" if n >= 4 else "Partial"
    if evidence == "Catalog description":
        if top4 not in MARKETING_TOP:
            return "Moderate" if n >= 2 else "Partial"
        return "Strong" if n >= 5 else "Moderate"
    if lens == "Social Media Marketing" and not market_signal:
        return "Moderate" if n >= 2 else "Partial"
    if (core and n >= 3) or n >= 5:
        return "Strong"
    if core or n >= 2 or top4 in MARKETING_TOP:
        return "Moderate"
    return "Partial"


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
        return region.get(norm_college(c), "")

    # discipline: the MQ discipline map where the subject is unambiguous;
    # otherwise the TOP title, flagged for verification (TOP displays, never decides).
    sdm = json.load(open(os.path.join(HERE, "reference", "subject_discipline_map.json")))["map"]
    # A subject code means different things at different colleges (Bakersfield's
    # APPR is not Auto Body). Keep a mapped discipline only when it is one a
    # marketing / media / IT course could plausibly carry.
    PLAUSIBLE = {"Business", "Marketing", "Management", "Computer Information Systems", "Computer Science",
                 "Multimedia", "Journalism", "Communication Studies", "Office Technologies", "Art",
                 "Fashion and Related Technologies", "Film and Media Studies", "Media Production",
                 "Photography", "Broadcasting Technology", "Interior Design", "English"}
    sdm = {k: v for k, v in sdm.items() if v in PLAUSIBLE}

    # MIS Fall 2025 = "currently active" check
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

    coci_by_key = {}   # (college, normcourse) -> row
    for r in L["rows"]:
        coci_by_key[(canon(colleges[r[0]]), norm_course(f"{r[2]}{r[3]}"))] = r

    # ------------------------------------------------ MAP exhibits (civilian) ---
    sw = loadjs_list(os.path.join(REPO, "statewide_data.js"))
    EXH_T = re.compile(r"market|advertis|social media|e-?commerce|user experience|\bux\b|user-centered|"
                       r"content|wordpress|web design|web page|web publishing|digital media|salesforce|crm|html", re.I)
    CR_T = re.compile(r"market|advertis|social|commerce|user|content|web|wordpress|digital media|crm|html", re.I)
    NOT = re.compile(r"calculus|statistic|linux|welding|excel|power bi|aws|google it", re.I)
    map_rows = []
    on_map = {}   # (college, normcourse) -> exhibit title
    statewide_found = []
    for e in sw:
        blob = e["title"] + " " + " ".join(c.get("credit", "") for c in e.get("credit_recs") or [])
        if not EXH_T.search(blob) or NOT.search(blob) or e.get("cpl_type", "").startswith("Standardized") and "market" not in blob.lower():
            continue
        adopters = [canon(a) for a in e.get("adopter_names") or []]
        if e.get("collaborative_type") == "CCC Collaborative":
            statewide_found.append(e["title"])
        for cr in e.get("credit_recs") or []:
            if not CR_T.search(cr.get("credit", "")):
                continue
            code = cr.get("course", "")
            if re.search(r"^(CPL|Degree|CSU|Local GE|GE)\b", code):
                continue
            if re.match(r"CLEP\b", code):
                continue
            # the adopter's course with that code must be ABOUT the recommendation --
            # merged exhibit records carry one college's BUS 20 (Principles of
            # Marketing) beside another college's BUS 20 (Business Mathematics).
            cr_words = set(re.findall(r"[a-z]{4,}", cr["credit"].lower())) - {"hours", "hour", "introduction", "principles"}
            hits = [a for a in adopters if (a, norm_course(code)) in coci_by_key and
                    cr_words & set(re.findall(r"[a-z]{4,}", (coci_by_key[(a, norm_course(code))][4] or "").lower()))]
            if not hits and len(adopters) == 1:
                hits = adopters
            for col in hits:
                cr_row = coci_by_key.get((col, norm_course(code)))
                title = cr_row[4] if cr_row else re.sub(r"^\d[\d.\-]* hours? in ", "", cr["credit"])
                map_rows.append({
                    "college": col, "course_id": code.strip(), "course_title": title,
                    "exhibit_id": " | ".join(e.get("exhibit_ids") or [e["exhibit_id"]]),
                    "exhibit_title": e["title"], "credit_rec": cr["credit"],
                    "cpl_type": e.get("cpl_type", ""), "ctrl": cr_row[1] if cr_row else "",
                    "units": cr_row[5] if cr_row else "", "top": cr_row[7] if cr_row else "",
                    "subj": cr_row[2] if cr_row else code.split()[0],
                })
                on_map.setdefault((col, norm_course(code)), e["title"])

    # -------------------------------------------------------- COCI courses ---
    courses = []
    for r in L["rows"]:
        ci, ctrl, subj, num, title, units, credit, top = r[:8]
        title = title or ""
        top4 = (top or "")[:4].replace(".", "")
        if NOISE.search(title) or not top_ok(top4):
            continue
        desc = D.get(ctrl, "") or ""
        lens = core = None
        evidence = "Course title"
        for name, pat, c in LENSES:
            if re.search(pat, title, re.I):
                lens, core = name, c
                break
        if not lens and BUSINESS_MEDIA.match(top4):
            for name, pat in DESC_PHRASES:
                if re.search(pat, desc, re.I):
                    lens, core, evidence = name, True, "Catalog description"
                    break
        if not lens:
            continue
        text = f"{title} {desc}"
        hits = competencies_hit(text)
        if not hits and (col_name := canon(colleges[ci]), f"{subj} {num}".strip()) not in DIRECT:
            continue
        # Branding/PR and UX need a marketing or digital signal to count at all.
        if lens in ("Branding & Public Relations", "UX / UI Design & Prototyping") and len(hits) < 2:
            continue
        # A social-media / advertising course outside business & media (e.g. a
        # design studio) must show a marketing signal in its description.
        if lens in ("Social Media Marketing", "Advertising") and not BUSINESS_MEDIA.match(top4) and \
                not re.search(r"market|campaign|audience", desc, re.I):
            continue
        col = canon(colleges[ci])
        code = f"{subj} {num}".strip()
        key = (col, norm_course(code))
        st = strength(lens, core, hits, evidence, top4,
                      bool(re.search(r"market|business|brand|campaign|strateg", text, re.I)))
        proj = DIRECT.get((col, code))
        if proj:
            st, evidence = "Direct match", f"Course mirrors OpenClassrooms {proj}"
        subjn = re.sub(r"[^A-Z0-9]", "", (subj or "").upper())
        disc = sdm.get(subjn) or (f"{top} (TOP; verify)" if top else "")
        courses.append({
            "college": col, "region": region_of(col), "course_id": code, "course_title": title,
            "ctrl": ctrl, "units": units, "credit": {"C": "Credit", "N": "Noncredit", "E": "Noncredit (enhanced)"}.get(credit, credit or ""),
            "top": top, "discipline": disc, "lens": lens, "evidence": evidence,
            "strength": st, "competencies": "; ".join(f"{n} ({l})" for n, l in hits),
            "n_comp": len(hits), "description": desc,
            "active": "Yes - in MIS Fall 2025 course inventory" if ctrl in active else "Not in MIS Fall 2025 - verify in catalog",
            "on_map": on_map.get(key, ""),
        })

    # --------------------------------------------------------- programs ---
    P = loadjs(os.path.join(REPO, "coci_programs_data.js"))
    PROG = re.compile(r"digital market|internet market|online market|social media|e-?commerce|marketing|advertis|"
                      r"content (creat|market)|user experience|\bux\b|digital media market|brand", re.I)
    programs = []
    for r in P["rows"]:
        ci, ctrl, title, top, cip, ai, si = r[:7]
        status = P["statuses"][si]
        if status not in ("Active", "Approved", "Active - Teachout Only") or not PROG.search(title or ""):
            continue
        if not top_ok((top or "")[:4].replace(".", "")):
            continue
        col = canon(P["colleges"][ci])
        core = bool(re.search(r"digital|internet|online|social|e-?commerce|content|analytic|seo|search", title, re.I))
        programs.append({
            "college": col, "region": region_of(col), "program": title, "award": P["awards"][ai],
            "top": top, "cip": cip, "status": status, "units": r[7], "cte": "Yes" if r[9] else "",
            "fit": "Digital-marketing focused" if core else "Marketing / related",
        })

    ace = json.load(open(os.path.join(HERE, "openclassrooms_map_ace_recs.json")))["recs"]

    for c in map_rows:
        c["region"] = region_of(c["college"])
        subjn = re.sub(r"[^A-Z0-9]", "", (c["subj"] or "").upper())
        c["discipline"] = sdm.get(subjn) or (f"{c['top']} (TOP; verify)" if c["top"] else "")
        c["active"] = ("Yes - in MIS Fall 2025 course inventory" if c["ctrl"] in active
                       else ("Not in MIS Fall 2025 - verify in catalog" if c["ctrl"] else "Course not found in COCI - verify"))

    order = {"Direct match": -1, "Strong": 0, "Moderate": 1, "Partial": 2}
    courses.sort(key=lambda c: (order[c["strength"]], c["lens"], c["region"], c["college"], c["course_id"]))
    out = {
        "_built_by": "kb/_build_openclassrooms_crosswalk.py",
        "title": TITLE, "certificate": CERT,
        "statewide_credit_recs": statewide_found,
        "map_rows": map_rows, "courses": courses, "programs": programs, "ace_recs": ace,
        "competencies": [{"group": n, "letters": l} for n, l, _ in COMPETENCIES],
    }
    json.dump(out, open(os.path.join(OUT, "crosswalk.json"), "w"), indent=1, ensure_ascii=False)
    cnt = collections.Counter(c["strength"] for c in courses)
    print(f"MAP articulation rows: {len(map_rows)}  statewide CRs: {len(statewide_found)}")
    print(f"COCI courses: {len(courses)} {dict(cnt)}  colleges: {len({c['college'] for c in courses})}")
    print(f"programs: {len(programs)}  ACE recs: {len(ace)}")
    print("unregioned:", sorted({c['college'] for c in courses + map_rows + programs if not c['region']}))


def loadjs_list(path):
    s = open(path, encoding="utf-8").read()
    i = s.index("{", s.index("="))
    obj = json.loads(s[i:s.rstrip().rstrip(";").rindex("}") + 1])
    return obj["exhibits"]


if __name__ == "__main__":
    main()

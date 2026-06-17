#!/usr/bin/env python3
"""Parse the 45 official ASCCC Transfer Model Curriculum PDFs in tmc/source_pdfs/
into tmc_templates.js (the fixed left-side C-ID course lists for the TMC Builder).

Sam supplied the official PDFs (the C-ID site Cloudflare-blocks automated fetch);
they're committed under tmc/source_pdfs/ for provenance so this is re-runnable.

Strategy that makes the parse robust:
  - C-IDs are extracted from the table cells and validated against the authoritative
    kb/reference/cid_descriptors.json. For any VERIFIED C-ID we use the descriptor's
    official title (so PDF column/line noise in titles is irrelevant — the C-ID is
    what drives the Builder's auto-match anyway).
  - C-IDs that look like a C-ID but AREN'T in the descriptor set are kept and
    flagged `cid_unverified: true` — a deliberate DISCREPANCY SIGNAL (per Sam:
    "an indicator that perhaps C-ID needs to be updated, or otherwise"), often a
    newer 2026 TMC whose codes post-date our descriptor extract.
  - "Any course not used…" rows become non-C-ID slots; "OR …" lines fold into the
    prior slot's alternates.

Output status: every parsed TMC ships as `draft` (real data from the official
template, pending faculty verification); a TMC that yields no sections stays a
`planned` stub. Run from repo root:  python3 tmc/_parse_tmc_pdfs.py
"""
import fitz, json, re, os
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDFDIR = os.path.join(ROOT, "tmc", "source_pdfs")
OUT = os.path.join(ROOT, "tmc_templates.js")
DESC = json.load(open(os.path.join(ROOT, "kb/reference/cid_descriptors.json")))["descriptors"]
CIDS = {re.sub(r"\s+", " ", d["descriptor"].strip().upper()) for d in DESC}
TITLE = {re.sub(r"\s+", " ", d["descriptor"].strip().upper()): d.get("title", "").strip() for d in DESC}

# id -> official-template PDF url (from Sam's TMC-download doc)
SOURCES = {
 "administration-of-justice":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Administration_of_Justice_TMC_r.pdf",
 "african-american-studies":"https://c-idsystem.org/wp-content/uploads/2025/08/2025_Jun_African_American_Studies_TMC_v2_r.pdf",
 "agriculture-animal-sciences":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Agriculture_Animal_Sciences_TMC_r.pdf",
 "agriculture-business":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Agriculture_Business_TMC_r.pdf",
 "agriculture-plant-sciences":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Agriculture_Plant_Sciences_TMC_r.pdf",
 "american-indian-studies":"https://c-idsystem.org/wp-content/uploads/2025/08/2025_Jun_American_Indian_Studies_TMC_r2.pdf",
 "anthropology":"https://c-idsystem.org/wp-content/uploads/2025/06/2025_Jan_Anthropology_TMC_r.pdf",
 "art-history":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Art_History_TMC_r.pdf",
 "asian-american-studies":"https://c-idsystem.org/wp-content/uploads/2025/08/2025_Jun_Asian_American_Studies_TMC_r.pdf",
 "biology":"https://c-idsystem.org/wp-content/uploads/2026/01/TMC_Biology_2-0_-260121_r.pdf",
 "business-administration":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Business_Administration_TMC_r.pdf",
 "chemistry":"https://c-idsystem.org/wp-content/uploads/2026/01/TMC_Chemistry_260121_r.pdf",
 "chicana-o-studies-latina-o-studies":"https://c-idsystem.org/wp-content/uploads/2025/06/2024_Jun_Chicano_Studies_TMC_r.pdf",
 "child-and-adolescent-development":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Child_and_Adolescent_Development_TMC_r.pdf",
 "communication-studies":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Communication_Studies_TMC_r.pdf",
 "computer-science":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Computer_Science_TMC_r.pdf",
 "early-childhood-education":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Early_Chilhood_Education_TMC_r.pdf",
 "economics":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Economics_TMC_r.pdf",
 "elementary-teacher-education-integrated-programs":"https://c-idsystem.org/wp-content/uploads/2025/06/2025_Jan_Elementary_Teacher_Education_Integrated_Programs_TMC_r.pdf",
 "english":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_English_TMC_r.pdf",
 "environmental-science":"https://c-idsystem.org/wp-content/uploads/2026/01/TMC_Environmental_Science_2-0_260121_r.pdf",
 "film-television-and-electronic-media":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Film_Television_and_Electronic_Media_TMC_r.pdf",
 "geography":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Geography_TMC_r.pdf",
 "geology":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Geology_TMC_r.pdf",
 "global-studies":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Global_Studies_TMC_r.pdf",
 "history":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_History_TMC_r.pdf",
 "hospitality-management":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Hospitality_Management_TMC_r.pdf",
 "journalism":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Journalism_TMC_r.pdf",
 "kinesiology":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Kinesiology_TMC_r.pdf",
 "law-public-policy-and-society":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Law_Public_Policy_and_Society_TMC_r.pdf",
 "mathematics":"https://c-idsystem.org/wp-content/uploads/2025/06/2025_Jan_Mathematics_TMC_r.pdf",
 "music":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Music_TMC_r.pdf",
 "music-industry-studies":"https://c-idsystem.org/wp-content/uploads/2026/01/TMC_Music_Industry_Studies_260121_r.pdf",
 "nutrition-and-dietetics":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Nutrition_and_Dietetics_TMC_r.pdf",
 "philosophy":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Philosophy_TMC_r.pdf",
 "physics-2-0":"https://c-idsystem.org/wp-content/uploads/2026/03/2025_Physics_2.0_TMC_03_25_26_r.pdf",
 "political-science":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Political_Science_TMC_r.pdf",
 "psychology":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Psychology_TMC_r.pdf",
 "public-health":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Public_Health_TMC_r.pdf",
 "social-justice-studies":"https://c-idsystem.org/wp-content/uploads/2025/06/2024_Sep_Social_Justice_Studies_TMC_r.pdf",
 "social-work-and-human-services":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Social_Work_and_Human_Services_TMC_r.pdf",
 "sociology":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Sociology_TMC_r.pdf",
 "spanish":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Spanish_TMC_r.pdf",
 "studio-art":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Studio_Art_TMC_r.pdf",
 "theatre-arts":"https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Theatre_Arts_TMC_r.pdf",
}
# (pdf filename, id, display discipline)
CATALOG = [
 ("2023_Nov_Administration_of_Justice_TMC_r.pdf","administration-of-justice","Administration of Justice"),
 ("2025_Jun_African_American_Studies_TMC_v2_r.pdf","african-american-studies","African American Studies"),
 ("2023_Nov_Agriculture_Animal_Sciences_TMC_r.pdf","agriculture-animal-sciences","Agriculture Animal Sciences"),
 ("2023_Nov_Agriculture_Business_TMC_r.pdf","agriculture-business","Agriculture Business"),
 ("2023_Nov_Agriculture_Plant_Sciences_TMC_r.pdf","agriculture-plant-sciences","Agriculture Plant Sciences"),
 ("2025_Jun_American_Indian_Studies_TMC_r2.pdf","american-indian-studies","American Indian Studies"),
 ("2025_Jan_Anthropology_TMC_r.pdf","anthropology","Anthropology"),
 ("2023_Nov_Art_History_TMC_r.pdf","art-history","Art History"),
 ("2025_Jun_Asian_American_Studies_TMC_r.pdf","asian-american-studies","Asian American Studies"),
 ("TMC_Biology_2-0_-260121_r.pdf","biology","Biology 2.0"),
 ("2023_Nov_Business_Administration_TMC_r.pdf","business-administration","Business Administration 2.0"),
 ("TMC_Chemistry_260121_r.pdf","chemistry","Chemistry"),
 ("2024_Jun_Chicano_Studies_TMC_r.pdf","chicana-o-studies-latina-o-studies","Chicana/o Studies, Latina/o Studies"),
 ("2023_Nov_Child_and_Adolescent_Development_TMC_r.pdf","child-and-adolescent-development","Child and Adolescent Development"),
 ("2023_Nov_Communication_Studies_TMC_r.pdf","communication-studies","Communication Studies 2.0"),
 ("2023_Nov_Computer_Science_TMC_r.pdf","computer-science","Computer Science"),
 ("2023_Nov_Early_Chilhood_Education_TMC_r.pdf","early-childhood-education","Early Childhood Education"),
 ("2023_Nov_Economics_TMC_r.pdf","economics","Economics"),
 ("2025_Jan_Elementary_Teacher_Education_Integrated_Programs_TMC_r.pdf","elementary-teacher-education-integrated-programs","Elementary Teacher Education: Integrated Programs"),
 ("2023_Nov_English_TMC_r.pdf","english","English"),
 ("TMC_Environmental_Science_2-0_260121_r.pdf","environmental-science","Environmental Science"),
 ("2023_Nov_Film_Television_and_Electronic_Media_TMC_r.pdf","film-television-and-electronic-media","Film, Television and Electronic Media"),
 ("2023_Nov_Geography_TMC_r.pdf","geography","Geography"),
 ("2023_Nov_Geology_TMC_r.pdf","geology","Geology"),
 ("2023_Nov_Global_Studies_TMC_r.pdf","global-studies","Global Studies"),
 ("2023_Nov_History_TMC_r.pdf","history","History"),
 ("2023_Nov_Hospitality_Management_TMC_r.pdf","hospitality-management","Hospitality Management"),
 ("2023_Nov_Journalism_TMC_r.pdf","journalism","Journalism"),
 ("2023_Nov_Kinesiology_TMC_r.pdf","kinesiology","Kinesiology"),
 ("2023_Nov_Law_Public_Policy_and_Society_TMC_r.pdf","law-public-policy-and-society","Law, Public Policy, and Society"),
 ("2025_Jan_Mathematics_TMC_r.pdf","mathematics","Mathematics 2.0"),
 ("2023_Nov_Music_TMC_r.pdf","music","Music"),
 ("TMC_Music_Industry_Studies_260121_r.pdf","music-industry-studies","Music Industry Studies"),
 ("2023_Nov_Nutrition_and_Dietetics_TMC_r.pdf","nutrition-and-dietetics","Nutrition and Dietetics"),
 ("2023_Nov_Philosophy_TMC_r.pdf","philosophy","Philosophy"),
 ("2025_Physics_2.0_TMC_03_25_26_r.pdf","physics-2-0","Physics 2.0"),
 ("2023_Nov_Political_Science_TMC_r.pdf","political-science","Political Science"),
 ("2023_Nov_Psychology_TMC_r.pdf","psychology","Psychology"),
 ("2023_Nov_Public_Health_TMC_r.pdf","public-health","Public Health"),
 ("2024_Sep_Social_Justice_Studies_TMC_r.pdf","social-justice-studies","Social Justice Studies"),
 ("2023_Nov_Social_Work_and_Human_Services_TMC_r.pdf","social-work-and-human-services","Social Work and Human Services"),
 ("2023_Nov_Sociology_TMC_r.pdf","sociology","Sociology"),
 ("2023_Nov_Spanish_TMC_r.pdf","spanish","Spanish"),
 ("2023_Nov_Studio_Art_TMC_r.pdf","studio-art","Studio Art"),
 ("2023_Nov_Theatre_Arts_TMC_r.pdf","theatre-arts","Theatre Arts"),
]

def norm(s): return re.sub(r"\s+", " ", str(s).strip().upper())
NUM = re.compile(r"^\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?$")
GE = re.compile(r"^(?:[1-7][A-C]?|C\d|[A-C])$")
GECHUNK = re.compile(r"^(?:[1-7][A-C]?|C\d)(?:\s*/\s*(?:[1-7][A-C]?|C\d))*$", re.I)
CIDLIKE = re.compile(r"^[A-Z][A-Z&\-]{1,6}\s*\d{2,3}\s*[A-Z]?$")
PLACE = re.compile(r"^[A-Z]{2,4}$")
SELWORD = {"one":1,"two":2,"three":3,"four":4,"five":5,"1":1,"2":2,"3":3,"4":4,"5":5}

def canon_cid(c):
    c = norm(c)
    if c in CIDS: return c, True
    m = re.match(r"^(.*\d)\s*([A-Z])$", c)
    if m and norm(m.group(1) + " " + m.group(2)) in CIDS: return norm(m.group(1) + " " + m.group(2)), True
    return c, False

def clean_units(u):
    u = re.sub(r"\s*units?\b.*$", "", str(u), flags=re.I).strip()
    return re.sub(r"\s*[-–]\s*", "-", u)

def strip_ge_prefix(t):
    words = t.split()
    while words and (GECHUNK.match(words[0]) or words[0].lower() == "or" or GE.match(words[0])):
        words = words[1:]
    return " ".join(words).strip()

def secname(l): return re.sub(r"^\s*Courses:\s*", "", l, flags=re.I)

def parse_body(body):
    start = 0
    for j, l in enumerate(body[:22]):
        if re.search(r"counting$", l, re.I): start = j + 1; break
    body = body[start:]; rows = []; cur = []; i = 0; n = len(body)
    while i < n:
        l = body[i].strip()
        if not l: i += 1; continue
        cid_real = norm(l) in CIDS; cid_shape = bool(CIDLIKE.match(l)); place = bool(PLACE.match(l)) and not cid_real
        if cid_real or cid_shape or place or NUM.match(l):
            cid = ""; known = False; units = ""
            if cid_real or cid_shape: cid, known = canon_cid(l); i += 1
            elif place: i += 1
            if i < n and NUM.match(body[i].strip()): units = body[i].strip(); i += 1
            elif NUM.match(l) and not (cid_real or cid_shape or place): units = l; i += 1
            if i < n and GE.match(body[i].strip()): i += 1
            ptitle = strip_ge_prefix(" ".join(cur).strip()); cur = []
            slot = {}
            if cid:
                slot["cid"] = cid
                slot["title"] = (TITLE.get(cid) or ptitle) if known else ptitle
                if not known: slot["cid_unverified"] = True
            else:
                slot["title"] = ptitle; slot["noncid"] = True
            u = clean_units(units)
            if u: slot["units"] = u
            rows.append(slot)
        else:
            cur.append(l); i += 1
    folded = []
    for r in rows:
        t = r["title"]
        if t[:3].lower() == "or " and folded:
            if r.get("cid") and r["cid"] != folded[-1].get("cid"):
                folded[-1].setdefault("alts", []).append(r["cid"])
            continue
        folded.append(r)
    seen = set(); out = []
    for r in folded:
        key = r.get("cid") or ("NC:" + r["title"][:40].lower())
        if not r.get("title") and not r.get("cid"): continue
        if key in seen: continue
        seen.add(key)
        if "alts" in r:
            r["alts"] = [a for a in dict.fromkeys(r["alts"]) if a != r.get("cid")]
            if not r["alts"]: r.pop("alts")
        out.append(r)
    return out

def parse(path):
    doc = fitz.open(path); lines = []
    for pg in doc: lines += pg.get_text().split("\n")
    lines = [l.strip() for l in lines]
    cut = len(lines)
    for i, l in enumerate(lines):
        if re.match(r"TOTAL\s+MAJOR\s+UNITS", l, re.I) or re.match(r"TOTAL\s+UNITS\s+FOR", l, re.I): cut = i; break
    lines = lines[:cut]; text = "\n".join(lines)
    dm = re.search(r"A[AS]-T", text); degree = dm.group(0) if dm else ""
    tm = re.search(r"Total Minimum Semester Units for (?:Major|Area)[^:]*:\s*([\d\s\-–]+)", text)
    total = clean_units(tm.group(1)) if tm else ""
    am = re.findall(r"[A-Z][a-z]+ \d{1,2},? \d{4}", text)
    version = (am[-1] if am else "official template")
    sec_re = re.compile(r"^(Required Core|List\s+[A-Z])\b", re.I)
    idxs = [i for i, l in enumerate(lines) if sec_re.match(secname(l))]
    sections = []
    for k, i in enumerate(idxs):
        raw = secname(lines[i]); end = idxs[k + 1] if k + 1 < len(idxs) else len(lines)
        nm = re.match(r"(Required Core|List\s+[A-Z])", raw, re.I).group(1).title()
        sm = re.search(r"Select\s+(\w+)", raw, re.I)
        select = "all" if nm.lower().startswith("required") else (SELWORD.get(sm.group(1).lower(), "all") if sm else "all")
        un = re.search(r"\(([^)]*?units[^)]*?)\)", raw, re.I)
        sl = parse_body(lines[i + 1:end])
        if sl:
            sec = {"name": nm, "select": select, "slots": sl}
            if un: sec["units"] = clean_units(un.group(1))
            sections.append(sec)
    return degree, total, version, sections

def main():
    templates = []
    rpt = []
    for fn, tid, disc in CATALOG:
        p = os.path.join(PDFDIR, fn)
        degree, total, version, sections = parse(p)
        ncid = sum(1 for s in sections for x in s["slots"] if x.get("cid"))
        unv = sum(1 for s in sections for x in s["slots"] if x.get("cid_unverified"))
        t = {"id": tid, "discipline": disc}
        if degree: t["degree"] = degree
        if total: t["total_units"] = total
        t["version"] = version
        t["status"] = "draft" if sections else "planned"
        if sections: t["sections"] = sections
        templates.append(t)
        rpt.append((disc, degree, total, len(sections), ncid, unv, t["status"]))

    payload = {
        "_meta": {
            "draft": True,
            "generated": datetime.now(timezone.utc).date().isoformat(),
            "generated_by": "tmc/_parse_tmc_pdfs.py (from tmc/source_pdfs/*.pdf)",
            "source": "Official ASCCC C-ID Transfer Model Curriculum PDFs (c-idsystem.org/transfer-efforts)",
            "note": ("Per-TMC status: 'official' (faculty-verified) / 'draft' (parsed from the "
                     "official template, faculty-verify) / 'planned' (catalog only). Slots with "
                     "cid_unverified:true carry a C-ID not in our descriptor extract — a discrepancy "
                     "signal that C-ID (or our reference) may need updating. Titles for verified "
                     "C-IDs come from kb/reference/cid_descriptors.json."),
            "sources": SOURCES,
        },
        "templates": templates,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("// AUTO-GENERATED by tmc/_parse_tmc_pdfs.py from the official ASCCC TMC PDFs\n")
        f.write("// (tmc/source_pdfs/*.pdf). Re-run after refreshing a PDF. DRAFT — faculty-verify;\n")
        f.write("// cid_unverified flags are intentional C-ID-discrepancy signals (see _meta.note).\n")
        f.write("window.CPL_TMC_TEMPLATES = ")
        json.dump(payload, f, ensure_ascii=False, indent=1)
        f.write(";\n")

    drafted = sum(1 for r in rpt if r[6] == "draft")
    print(f"wrote {OUT}: {len(templates)} TMCs ({drafted} draft, {len(templates)-drafted} planned)")
    print("%-44s %-5s %-7s sec cid unv status" % ("DISCIPLINE", "DEG", "TOTAL"))
    for disc, deg, tot, ns, nc, uv, st in rpt:
        print("%-44s %-5s %-7s %3d %3d %3d %s" % (disc[:44], deg, tot, ns, nc, uv, st))

if __name__ == "__main__":
    main()

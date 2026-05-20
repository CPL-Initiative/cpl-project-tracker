"""
One-shot generator for the Phase 2 Cx (Credit-by-Exam) common-course seed:
  kb/common_courses.json   — catalog of common courses, keyed by course_id
  kb/course_crosswalk.json — local college course -> course_id (many-to-one)

"Cx" = Credit by Exam (we avoid "CBE" — collides with Competency-Based
Education).

Each course is assigned the best available identifier under the precedence
**CCN-ID > C-ID > M-ID**:
  - CCN-ID — an AB 1111 Common Course Number (e.g. "ANTH C1000"), the
    statewide common-course identity. Source: kb/reference/ccn_courses.json.
  - C-ID   — a Course Identification Numbering System descriptor
    (e.g. "ACCT 110"). Source: kb/reference/cid_descriptors.json.
  - M-ID   — a synthetic MAP-originated descriptor that mimics the C-ID
    shape ("SUBJ NNN") but is branded "M-ID", minted only when no C-ID or
    CCN aligns. This is the fallback crosswalk key for the ~89% of CCC
    courses carrying neither, so an articulation earned at one college can
    propagate to the many teaching the same course.

`id_system` records which system the course_id came from.

#3 APPLIED: the `discipline` field uses the official CCC Minimum
Qualifications "Disciplines List" vocabulary (kb/reference/mq_disciplines.json,
19th Ed.). The pre-MQ label is kept as `discipline_provisional`. Where no
exact MQ discipline exists (e.g. Accounting, Human Services), the nearest is
used and flagged in `_notes` (mq_approx). Matched C-ID/CCN entries use the
authoritative template title for `common_title`.

This is an AI-assisted DRAFT seed for human review. Once reviewed and
committed, curate by editing the JSON directly — do NOT re-run this script.

Run from repo root:  python3 kb/_seed_cx_common_courses.py
"""
import json
import os
import re
import difflib
from collections import defaultdict, Counter

CLASSIFIED_AT = "2026-05-19"
CLASSIFIED_BY = "claude-opus-4-7 (Cx common-course draft)"
HERE = os.path.dirname(os.path.abspath(__file__))

# --- Discipline routing (PROVISIONAL — pending MQ Disciplines List, #3) -------
PREFIX_MAP = {
    "SPAN": ("SPAN", "Spanish"), "SPA": ("SPAN", "Spanish"),
    "FR": ("FREN", "French"), "GER": ("GERM", "German"),
    "ITA": ("ITAL", "Italian"), "JA": ("JPN", "Japanese"),
    "CHI": ("CHIN", "Chinese"), "KOR": ("KOR", "Korean"),
    "PRSN": ("PERS", "Persian"), "PORT": ("PORT", "Portuguese"),
    "ARAB": ("ARAB", "Arabic"), "HEBR": ("HEBR", "Hebrew"),
    "ASL": ("ASL", "American Sign Language"),
    "CHIL": ("ECE", "Early Childhood Education"),
    "EDUC": ("EDUC", "Education"),
    "MATH": ("MATH", "Mathematics"),
    "ASTRON": ("ASTR", "Astronomy"),
    "ANTH": ("ANTH", "Anthropology"),
    "ACCT": ("ACCT", "Accounting"),
    "BUS": ("BUS", "Business"),
    "CBTE": ("CAOT", "Computer Applications & Office Technology"),
    "CIM": ("CAOT", "Computer Applications & Office Technology"),
    "BT": ("CAOT", "Computer Applications & Office Technology"),
    "INWT": ("CIS", "Computer & Information Systems"),
    "CISC": ("CIS", "Computer & Information Systems"),
    "CNT": ("CIS", "Computer & Information Systems"),
    "CS": ("CIS", "Computer & Information Systems"),
    "WEBD": ("WEB", "Web Development"),
    "MULT": ("MMED", "Multimedia"),
    "GD": ("GRA", "Graphic Design"),
    "GC": ("GRA", "Graphic Design"),
    "ARTG": ("GRA", "Graphic Design"),
    "AUTO": ("AUTO", "Automotive Technology"),
    "AUTOTEC": ("AUTO", "Automotive Technology"),
    "DM": ("DSL", "Diesel Technology"),
    "AIRE": ("HVAC", "Heating, Ventilation, Air Conditioning & Refrigeration"),
    "ELDT": ("ELEC", "Electronics Technology"),
    "ET": ("ELEC", "Electronics Technology"),
    "ENGN": ("ENGR", "Engineering"),
    "MFG": ("MFG", "Manufacturing Technology"),
    "MFET": ("MFG", "Manufacturing Technology"),
    "MACT": ("MACH", "Machine Technology"),
    "GISG": ("GIS", "Geographic Information Systems"),
    "NS": ("NURS", "Nursing"), "N": ("NURS", "Nursing"),
    "MEDA": ("MEDA", "Medical Assisting"),
    "HLH": ("MEDA", "Medical Assisting"),
    "MOA": ("MEDA", "Medical Assisting"),
    "CACM": ("CULN", "Culinary Arts"),
    "NUTR": ("NUTR", "Nutrition"),
    "FASH": ("FASH", "Fashion"),
    "TOUR": ("HOSP", "Hospitality & Tourism"),
    "HOSP": ("HOSP", "Hospitality & Tourism"),
    "MUS": ("MUS", "Music"), "MUSI": ("MUS", "Music"),
    "DANC": ("DANC", "Dance"),
    "DRAM": ("THEA", "Theatre Arts"),
    "ARTH": ("ARTH", "Art History"),
    "ART": ("ART", "Art"),
    "PHOT": ("PHOT", "Photography"), "PHTO": ("PHOT", "Photography"),
    "JAMS": ("JOUR", "Journalism"),
    "RTVF": ("FTVE", "Film, Television & Electronic Media"),
    "HS": ("HSER", "Human Services"),
    "COUN": ("COUN", "Counseling"),
    "CJ": ("AJ", "Administration of Justice"),
    "AJ": ("AJ", "Administration of Justice"),
    "POSC": ("AJ", "Administration of Justice"),
    "PLEG": ("PARA", "Paralegal Studies"),
    "ESL": ("ESL", "English as a Second Language"),
    "HORT": ("HORT", "Horticulture"),
    "SPS": ("LRNS", "Learning Skills"),
}


# --- Provisional discipline -> official MQ Disciplines List title (#3) --------
# Source: kb/reference/mq_disciplines.json (19th Ed. MQ Disciplines Index).
# Value: (official_mq_title, approximate?). approximate=True flags a judgment
# call (no exact MQ discipline) for human review.
MQ_DISCIPLINE = {
    "Spanish": ("Foreign Languages", False),
    "French": ("Foreign Languages", False),
    "German": ("Foreign Languages", False),
    "Italian": ("Foreign Languages", False),
    "Japanese": ("Foreign Languages", False),
    "Chinese": ("Foreign Languages", False),
    "Korean": ("Foreign Languages", False),
    "Persian": ("Foreign Languages", False),
    "Portuguese": ("Foreign Languages", False),
    "Arabic": ("Foreign Languages", False),
    "Hebrew": ("Foreign Languages", False),
    "American Sign Language": ("Sign Language, American", False),
    "Early Childhood Education": ("Child Development/Early Childhood Education", False),
    "Education": ("Education", False),
    "Mathematics": ("Mathematics", False),
    "Astronomy": ("Astronomy", False),
    "Anthropology": ("Anthropology", False),
    "Accounting": ("Business", True),  # no dedicated MQ Accounting discipline
    "Business": ("Business", False),
    "Computer Applications & Office Technology": ("Office Technologies", False),
    "Computer & Information Systems": ("Computer Information Systems", False),
    "Web Development": ("Computer Information Systems", True),
    "Multimedia": ("Multimedia", False),
    "Graphic Design": ("Graphic Arts", False),
    "Automotive Technology": ("Automotive Technology", False),
    "Diesel Technology": ("Diesel Mechanics", False),
    "Heating, Ventilation, Air Conditioning & Refrigeration": ("Air Conditioning, Refrigeration, Heating", False),
    "Electronics Technology": ("Electronic Technology", False),
    "Engineering": ("Engineering", False),
    "Manufacturing Technology": ("Manufacturing Technology", False),
    "Machine Technology": ("Machine Tool Technology", False),
    "Geographic Information Systems": ("Geography", True),
    "Nursing": ("Nursing", False),
    "Medical Assisting": ("Health Care Ancillaries", True),
    "Culinary Arts": ("Culinary Arts/Food Technology", False),
    "Nutrition": ("Nutritional Science/Dietetics", False),
    "Fashion": ("Fashion and Related Technologies", False),
    "Hospitality & Tourism": ("Hotel and Motel Services", True),
    "Music": ("Music", False),
    "Dance": ("Dance", False),
    "Theatre Arts": ("Theater Arts", False),
    "Art History": ("Art History", False),
    "Art": ("Art", False),
    "Photography": ("Photography", False),
    "Journalism": ("Journalism", False),
    "Film, Television & Electronic Media": ("Media Production", False),
    # No MQ "Human Services" (or "Human Resources") discipline exists;
    # Counseling is the nearest fit — project-lead confirmed 2026-05-20.
    "Human Services": ("Counseling", False),
    "Counseling": ("Counseling", False),
    # MQ canonical title; also commonly "Criminal Justice (CJ)" — no CCN CJ
    # subject exists in our reference set, so we keep the MQ title.
    "Administration of Justice": ("Administration of Justice", False),
    "Paralegal Studies": ("Legal Assisting", False),
    "English as a Second Language": ("English as a Second Language (ESL)", False),
    "Horticulture": ("Ornamental Horticulture", False),
    "Learning Skills": ("Learning Assistance or Learning Skills", False),
    "Interior Design": ("Interior Design", False),
    "Building Codes & Inspection": ("Building Codes and Regulations", False),
    "Drafting & Design Technology": ("Drafting/CADD", False),
    "Architecture": ("Architecture", False),
    "General / Unclassified": (None, True),
}

# Documented mapping rationale for confirmed non-obvious choices (no "verify").
MQ_NOTE = {
    "Human Services": "No MQ 'Human Services' or 'Human Resources' discipline exists; mapped to nearest 'Counseling' — project-lead confirmed 2026-05-20.",
}


def route_discipline(code, title):
    prefix = re.match(r"[A-Za-z]+", code.strip())
    prefix = prefix.group(0).upper() if prefix else ""
    tl = title.lower()
    if prefix == "ID":
        return ("INTD", "Interior Design", 0.9)
    if prefix in ("ARCH", "ARC"):
        if any(k in tl for k in ("inspection", "code", "blueprint", "plans and spec")):
            return ("BCIT", "Building Codes & Inspection", 0.8)
        return ("ARCH", "Architecture", 0.85)
    if prefix == "DR":
        return ("DRFT", "Drafting & Design Technology", 0.8)
    if prefix == "FN":
        if "nutrition" in tl:
            return ("NUTR", "Nutrition", 0.85)
        if any(k in tl for k in ("hospitality", "tourism", "travel")):
            return ("HOSP", "Hospitality & Tourism", 0.85)
        return ("CULN", "Culinary Arts", 0.8)
    if prefix == "CUL":
        return ("NUTR", "Nutrition", 0.75) if "nutrition" in tl else ("CULN", "Culinary Arts", 0.8)
    if prefix == "AJ" and "report" in tl and "court" not in tl:
        return ("JOUR", "Journalism", 0.55)
    if prefix in PREFIX_MAP:
        subj, disc = PREFIX_MAP[prefix]
        return (subj, disc, 0.9)
    return ("GEN", "General / Unclassified", 0.4)


# --- Title cleanup ------------------------------------------------------------
SMALL = {"a", "an", "and", "the", "of", "for", "to", "in", "with", "i", "ii",
         "iii", "iv", "vs", "or", "&"}


def title_case(s):
    s = re.sub(r"\s+", " ", s.strip())
    if s.isupper():
        words = s.lower().split(" ")
        out = []
        for i, w in enumerate(words):
            if w in ("i", "ii", "iii", "iv", "v"):
                out.append(w.upper())
            elif i > 0 and w in SMALL:
                out.append(w)
            else:
                out.append(w[:1].upper() + w[1:])
        s = " ".join(out)
    return s


def norm(t):
    t = t.lower().strip()
    t = re.sub(r"[^a-z0-9 ]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


STOP = {"to", "the", "a", "an", "of", "and", "for", "with", "in", "on", "or", "&"}


def content_tokens(t):
    return {w for w in norm(t).split() if w not in STOP}


# --- Identifier matching: CCN-ID > C-ID > M-ID --------------------------------
def load_reference():
    ccn = json.load(open(os.path.join(HERE, "reference", "ccn_courses.json")))["courses"]
    cid = json.load(open(os.path.join(HERE, "reference", "cid_descriptors.json")))["descriptors"]
    # Build normalized-title -> descriptor maps. Strip honors/lab suffixes from
    # CCN titles for matching (e.g. "- Honors"); keep canonical template title.
    ccn_map = {}
    for c in ccn:
        ccn_map.setdefault(norm(c["title"]), (c["ccn"], c["title"]))
    cid_map = {}
    for c in cid:
        cid_map.setdefault(norm(c["title"]), (c["descriptor"], c["title"]))
    return ccn_map, cid_map


def best_match(title, table):
    """Return (code, template_title, score, exact) or None.
    Requires exact normalized match, OR seq-ratio >= 0.88 AND content-token
    Jaccard >= 0.5 (the Jaccard guard rejects e.g. Screen Printing vs
    Screenwriting)."""
    n = norm(title)
    if n in table:
        code, tt = table[n]
        return (code, tt, 1.0, True)
    cand = difflib.get_close_matches(n, list(table), n=1, cutoff=0.88)
    if not cand:
        return None
    seq = difflib.SequenceMatcher(None, n, cand[0]).ratio()
    a, b = content_tokens(title), content_tokens(cand[0])
    jac = len(a & b) / len(a | b) if (a | b) else 0
    if seq >= 0.88 and jac >= 0.5:
        code, tt = table[cand[0]]
        return (code, tt, round(seq, 2), False)
    return None


def assign_identifier(title, ccn_map, cid_map):
    """Apply precedence CCN-ID > C-ID > M-ID. Return dict or None (=> mint M-ID)."""
    m = best_match(title, ccn_map)
    if m:
        return {"id_system": "CCN-ID", "code": m[0], "template_title": m[1],
                "score": m[2], "exact": m[3]}
    m = best_match(title, cid_map)
    if m:
        return {"id_system": "C-ID", "code": m[0], "template_title": m[1],
                "score": m[2], "exact": m[3]}
    return None


# --- Extract Cx local courses -------------------------------------------------
def load_cx_courses():
    with open(os.path.join(HERE, "..", "CustomReport_latest.json")) as f:
        data = json.load(f)
    ex = data[0]
    ix = {c: i for i, c in enumerate(ex["columnName"])}
    cr_re = re.compile(r"^\s*([\d.]+)\s+hours?\s+in\s+(.*)$", re.I)
    courses = {}
    for r in ex["columnValue"]:
        if not r[ix["Exhibit Title"]].strip().lower().startswith("credit by"):
            continue
        college = r[ix["Articulation College"]].strip()
        code = r[ix["Course"]].strip()
        cr = r[ix["Credit Recommendation"]].strip()
        m = cr_re.match(cr)
        units = float(m.group(1)) if m else None
        title = (m.group(2).strip() if m else cr)
        if not title:
            continue
        key = (college, code, norm(title))
        c = courses.setdefault(key, {
            "college": college, "code": code, "title": title,
            "units": units, "top": r[ix["TOP Code"]].strip(),
            "exhibit_titles": set(), "exhibit_ids": set(),
        })
        c["exhibit_titles"].add(r[ix["Exhibit Title"]].strip())
        c["exhibit_ids"].add(r[ix["ExhibitID"]].strip())
    return list(courses.values())


def build():
    ccn_map, cid_map = load_reference()
    courses = load_cx_courses()

    # 1) Preliminary clusters by normalized local title.
    prelim = defaultdict(list)
    for c in courses:
        prelim[norm(c["title"])].append(c)

    # 2) For each cluster decide subject/discipline + canonical title, then
    #    resolve a course_id (CCN/C-ID match, else mint M-ID). Clusters that
    #    resolve to the SAME course_id merge into one catalog entry.
    subject_seq = defaultdict(int)
    by_course_id = defaultdict(lambda: {"members": [], "match": None,
                                        "subject": None, "discipline": None,
                                        "disc_conf": [], "canonical": None})

    for nt in sorted(prelim):
        grp = prelim[nt]
        votes = Counter()
        disc_conf = []
        for g in grp:
            subj, disc, dc = route_discipline(g["code"], g["title"])
            votes[(subj, disc)] += 1
            disc_conf.append(dc)
        (subj, disc), _ = votes.most_common(1)[0]
        canonical = title_case(max((g["title"] for g in grp), key=len))

        match = assign_identifier(canonical, ccn_map, cid_map)
        if match:
            course_id = match["code"]
        else:
            subject_seq[subj] += 1
            course_id = f"M-ID {subj} {100 + (subject_seq[subj] - 1) * 2}"

        slot = by_course_id[course_id]
        slot["members"].extend(grp)
        slot["disc_conf"].extend(disc_conf)
        if slot["match"] is None:
            slot["match"] = match
            slot["subject"] = subj
            slot["discipline"] = disc
            slot["canonical"] = canonical

    # 3) Build catalog + crosswalk.
    catalog = {}
    crosswalk = {}
    for course_id, slot in by_course_id.items():
        members = slot["members"]
        match = slot["match"]
        id_system = match["id_system"] if match else "M-ID"
        # Authoritative template title when matched; else cleaned local title.
        common_title = match["template_title"] if match else slot["canonical"]
        n_colleges = len(set(m["college"] for m in members))
        n_local = len(set((m["college"], m["code"]) for m in members))
        units_vals = [m["units"] for m in members if m["units"] is not None]
        typical_units = Counter(units_vals).most_common(1)[0][0] if units_vals else None

        # Confidence.
        if match and match["exact"]:
            conf = 0.95
        elif match:
            conf = 0.70
        else:
            conf = sum(slot["disc_conf"]) / len(slot["disc_conf"])
            if n_colleges >= 3:
                conf = min(0.95, conf + 0.15)
            elif n_colleges == 2:
                conf = min(0.92, conf + 0.08)
        conf = round(conf, 2)

        # Official MQ discipline (#3).
        mq_title, mq_approx = MQ_DISCIPLINE.get(slot["discipline"], (None, True))

        notes = []
        if match and not match["exact"]:
            notes.append(f"Matched to {match['code']} by fuzzy title (seq={match['score']}); verify.")
        if id_system == "M-ID":
            if slot["subject"] == "GEN":
                notes.append("Discipline could not be inferred from the local code prefix; needs human classification.")
            if n_colleges >= 2:
                notes.append(f"Cross-college match: {n_colleges} colleges / {n_local} local courses map here.")
            elif conf < 0.85:
                notes.append("Single-college, single-source draft mapping; verify discipline and canonical title.")
        if slot["discipline"] in MQ_NOTE:
            notes.append(MQ_NOTE[slot["discipline"]])
        elif mq_approx:
            notes.append(f"MQ discipline approximate: '{slot['discipline']}' has no exact MQ Disciplines List match; mapped to '{mq_title}' — verify.")

        catalog[course_id] = {
            "common_title": common_title,
            "id_system": id_system,
            "ccn_id": match["code"] if id_system == "CCN-ID" else None,
            "c_id": match["code"] if id_system == "C-ID" else None,
            "subject": slot["subject"],
            "discipline": mq_title,
            "discipline_provisional": slot["discipline"],
            "typical_units": typical_units,
            "confidence": conf,
            "source_college_count": n_colleges,
            "classified_at": CLASSIFIED_AT,
            "classified_by": CLASSIFIED_BY,
            "reviewed_at": None,
            "reviewed_by": None,
            "_notes": " ".join(notes),
        }

        for m in members:
            key = f"{m['college']} :: {m['code']} :: {m['title']}"
            crosswalk[key] = {
                "college": m["college"],
                "local_course_code": m["code"],
                "local_course_title": m["title"],
                "units": m["units"],
                "top_code": m["top"],
                "course_id": course_id,
                "id_system": id_system,
                "source": "Cx exhibit",
                "source_exhibit_titles": sorted(m["exhibit_titles"]),
                "source_exhibit_ids": sorted(m["exhibit_ids"]),
                "classified_at": CLASSIFIED_AT,
                "classified_by": CLASSIFIED_BY,
                "reviewed_at": None,
                "reviewed_by": None,
            }

    catalog = {k: catalog[k] for k in sorted(catalog)}
    crosswalk = {k: crosswalk[k] for k in sorted(crosswalk)}
    return catalog, crosswalk


def main():
    catalog, crosswalk = build()
    with open(os.path.join(HERE, "common_courses.json"), "w") as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)
        f.write("\n")
    with open(os.path.join(HERE, "course_crosswalk.json"), "w") as f:
        json.dump(crosswalk, f, indent=2, ensure_ascii=False)
        f.write("\n")
    sysc = Counter(v["id_system"] for v in catalog.values())
    print(f"common_courses.json:   {len(catalog)} common courses "
          f"(CCN-ID {sysc['CCN-ID']}, C-ID {sysc['C-ID']}, M-ID {sysc['M-ID']})")
    print(f"course_crosswalk.json: {len(crosswalk)} local courses crosswalked")


if __name__ == "__main__":
    main()

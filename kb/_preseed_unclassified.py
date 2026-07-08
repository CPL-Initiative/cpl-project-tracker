"""
CER unclassified-triage PRE-SEED — brand-family assignments for the obvious rows.

Sam (2026-07-07, looking at the 451-row triage queue): "it would be helpful to
have a procedure that pre-seeds the common exhibit titles and issuing agencies
-- all the APs should be an easy win, right?" Measured: the queue is 38 AP +
125 CLEP = 163 rows (36%) of College Board exams whose HOUSE FAMILIES already
exist in kb/unified_titles.json (49 AP + 42 CLEP unified titles). This script
maps each raw queue title to its existing family by DETERMINISTIC normalization
and emits worklist assignments — exactly what a curator would type, in bulk.

Doctrine honored (Session 101 triage QA): when a house family exists, retarget
to it VERBATIM — consistency with the house family outranks authority-verbatim
naming. This script therefore NEVER invents a unified title: a raw that doesn't
resolve to an EXISTING family is reported (`no_match` / `ambiguous`), never
seeded. Zero new credentials are minted; the fold (kb/_fold_unclassified.py)
sees only clean assignments into existing families.

Pipeline position:
  kb/exhibit_audit/latest.json  (the unclassified queue)
    -> THIS SCRIPT (dry-run default)  -> kb/preseed_out/<date>/plan.json receipt
    -> --apply: upsert Supabase kb_curation _UNCLASSIFIED::<raw> rows
       (unified_title_assignment + issuing_agency_assignment,
        reviewer_email 'preseed-v1@bot' — the automerge-v1@bot cohort pattern:
        queryable provenance, reviewable/clearable in the worklist)
    -> the daily cron's _apply_unclassified_triage.py sync + _fold_unclassified.py
       fold them like any curator assignment (V-gates still apply).

The worklist shows pre-seeds immediately (it reads Supabase live) with the ✕
un-assign affordance, so Sam has a review window before the next cron folds.

Apply lanes:
  - runner / local with the service key:
      SUPABASE_SERVICE_KEY=... python3 kb/_preseed_unclassified.py --apply
  - agent sandbox (egress-blocked from *.supabase.co): generate the plan here,
    then upsert via the Supabase MCP from plan.json (same rows).

Run from repo root:
  python3 kb/_preseed_unclassified.py            # dry-run: table + receipt
  python3 kb/_preseed_unclassified.py --apply    # write assignments to Supabase
"""
import json
import os
import re
import sys
from datetime import date, datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
AUDIT_PATH = os.path.join(HERE, "exhibit_audit", "latest.json")
UT_PATH = os.path.join(HERE, "unified_titles.json")
OVERLAY_PATH = os.path.join(HERE, "unclassified_assignments.json")
OUTDIR = os.path.join(HERE, "preseed_out", date.today().isoformat())

REVIEWER = "preseed-v1@bot"
KEY_PREFIX = "_UNCLASSIFIED::"
FIELD_TITLE = "unified_title_assignment"
FIELD_ISSUER = "issuing_agency_assignment"

# v1 scope: the College Board exam brands. Each family = (detector on the
# CLEANED title, issuer). Extend the table for future brands (IB, DSST, ...).
FAMILIES = {
    "AP": {"detect": re.compile(r"^AP\b", re.I), "issuer": "College Board"},
    "CLEP": {"detect": re.compile(r"^CLEP\b", re.I), "issuer": "College Board"},
}

# ── cleanup: strip the decoration colleges wrap around the exam name ─────────

# Parentheticals that are decoration, not identity. Groups:
#   score bands  — "(Score 3-5)", "(Score of 3, 4 or 5)", "(Score of 50)"
#   policy notes — "(F09 or prior)", "(only if taken before F11)",
#                  "(max of 10 units awarded)", "(IGETC)", CSU admission notes
#   local course — "(BIOSCI 101)", "(MATH-100)" — the target-course trap
#                  _suggest_unclassified.py documented: NEVER treat the
#                  parenthetical course code as the credential's identity.
_PAREN_SCORE = re.compile(r"^scores?\b|^score of\b", re.I)
_PAREN_POLICY = re.compile(
    r"^(?:only\s+if|if\s+taken|prior|before|after|until|(?:fa|sp|f|s)\d{2}\b"
    r"|max(?:imum)?\s+of|igetc|csu\b|taken)", re.I)
_PAREN_COURSE = re.compile(r"^[A-Z]{2,10}[-\s]?\d{1,4}[A-Z]?$")
# A parenthetical that names MULTIPLE levels makes the row ambiguous (which
# exam level earned the credit?) — report, never guess.
_PAREN_MULTILEVEL = re.compile(r"^levels?\s+\d+\s+and\s+\d+", re.I)

_FOOTNOTE_BRACKET = re.compile(r"\[\d+\]")
_DASHES = dict.fromkeys(map(ord, "‐‑‒–—―−"), "-")


def _pre_norm(t):
    """The ONE dash/nbsp normalizer - shared by cleanup() (brand lanes) and
    _norm_ws() (staged lanes) so a future tweak can't drift between them."""
    return (t or "").translate(_DASHES).replace(" ", " ")


def cleanup(raw):
    """Normalize whitespace/punctuation decoration and strip non-identity
    parentheticals. Returns (clean_title, notes, ambiguous_reason)."""
    notes, ambiguous = [], None
    t = _pre_norm(raw)
    if _FOOTNOTE_BRACKET.search(t):
        t = _FOOTNOTE_BRACKET.sub(" ", t)
        notes.append("footnote-bracket")
    # trailing footnote stars/daggers on any token ("French**", "II*")
    if re.search(r"[*†]", t):
        t = re.sub(r"[*†]+", "", t)
        notes.append("footnote-mark")
    # parentheticals
    def _paren(m):
        nonlocal ambiguous
        inner = m.group(1).strip()
        if _PAREN_MULTILEVEL.match(inner):
            ambiguous = f"multi-level parenthetical ({inner!r})"
            return " "
        if _PAREN_SCORE.match(inner):
            notes.append(f"score-band ({inner})")
            return " "
        if _PAREN_POLICY.match(inner):
            notes.append(f"policy-note ({inner})")
            return " "
        if _PAREN_COURSE.match(inner):
            notes.append(f"local-course ({inner})")
            return " "
        notes.append(f"kept-parenthetical ({inner})")
        return m.group(0)
    t = re.sub(r"\(([^()]*)\)", _paren, t)
    # bare trailing score clauses without parens ("Score of 4 or 5")
    t2 = re.sub(r"[,\s-]*\bScore of [\d,\s\w]+$", " ", t, flags=re.I)
    if t2 != t:
        notes.append("bare-score-clause")
        t = t2
    # "Complete both" riders make the row span two exams → ambiguous
    if re.search(r"\bcomplete both\b", t, re.I):
        ambiguous = ambiguous or "spans multiple exams ('Complete both')"
    t = re.sub(r"\s+", " ", t).strip(" -–,;:")
    return t, notes, ambiguous


# ── normalized match key ─────────────────────────────────────────────────────

_ABBREV = {
    "lit": "literature",
    "interp": "interpreting",
    "trig": "trigonometry",
    "civ": "civilization",
    "devel": "development",
    "princ": "principles",
    "intro": "intro", "introduction": "intro", "introductory": "intro",
    "macroecon": "macroeconomics", "microecon": "microeconomics",
    "&": "and",
    "exam": "", "exams": "",
}
# Dropped from keys entirely — colleges include/omit them freely ("History of
# the United States I" / "History, U.S. I" / "Intro to Sociology").
_STOPWORDS = {"of", "the", "to"}
# 'll' / 'lll' = the lowercase-L typo for roman II/III seen in MAP data.
_LEVEL_TOKENS = {"1": "i", "2": "ii", "3": "iii", "one": "i", "two": "ii",
                 "three": "iii", "i": "i", "ii": "ii", "iii": "iii",
                 "ll": "ii", "lll": "iii"}
_CLEP_LANGS = ("french", "spanish", "german")


def normalize_key(title):
    """Reduce a cleaned title to a comparison key: lowercase, punctuation to
    spaces, abbreviations expanded, US spellings folded, 2-D/3-D unified,
    'Level 2'→'level ii'. Deterministic — the same key from either side of the
    raw↔family comparison means the same exam."""
    t = title.lower()
    t = re.sub(r"\b([23])[\s-]?d\b", r"\1d", t)          # 2-D / 2 D / 2D → 2d
    t = re.sub(r"\bunited states\b", "us", t)
    t = t.replace("u.s.", "us")
    # a digit glued to a CLEP language word is a footnote artifact ("German1")
    t = re.sub(rf"\b({'|'.join(_CLEP_LANGS)})\d\b", r"\1", t)
    t = re.sub(r"[:,/\-–—]+", " ", t)
    toks = []
    for tok in t.split():
        tok = _ABBREV.get(tok.rstrip("."), tok.rstrip("."))
        if tok and tok not in _STOPWORDS:
            toks.append(tok)
    # fold "level <n>" (and a bare trailing level token after a CLEP language);
    # join split econ compounds ("Micro Economics")
    out = []
    i = 0
    while i < len(toks):
        tok = toks[i]
        if tok in ("level", "levels") and i + 1 < len(toks) and toks[i + 1] in _LEVEL_TOKENS:
            out.append("level")
            out.append(_LEVEL_TOKENS[toks[i + 1]])
            i += 2
            continue
        if tok in ("micro", "macro") and i + 1 < len(toks) and toks[i + 1] == "economics":
            out.append(tok + "economics")
            i += 2
            continue
        if tok == "pre" and i + 1 < len(toks) and toks[i + 1] == "calculus":
            out.append("precalculus")
            i += 2
            continue
        out.append(tok)
        i += 1
    # bare trailing numeral = a level in the CLEP language families
    # ("CLEP French Language: 2" → level ii)
    if (len(out) >= 2 and out[-1] in _LEVEL_TOKENS and out[-1] not in ("i",)
            and any(l in out for l in _CLEP_LANGS) and "level" not in out):
        out = out[:-1] + ["level", _LEVEL_TOKENS[out[-1]]]
    key = " ".join(out)
    key = re.sub(r"\b(\w+)( \1\b)+", r"\1", key)          # collapse word repeats
    return key


# Irreducible raw-key → family-key aliases (authored; receipted per row).
# These bridge gaps normalization can't close: short exam names colleges use
# for the College Board's longer official name, retired names (the Session-101
# AP art fold canonicals), and word-order flips.
ALIASES = {
    "ap english language": "ap english language and composition",
    "ap english literature": "ap english literature and composition",
    "ap government and political us": "ap us government and politics",
    "ap government and politics us": "ap us government and politics",
    "ap us government and political": "ap us government and politics",
    "ap government and politics comparative": "ap comparative government and politics",
    "ap studio art 2d design": "ap 2d art and design",
    "ap studio art 3d design": "ap 3d art and design",
    "ap studio art drawing": "ap drawing",
    # "CLEP United States I/II" = the History of the United States exams
    "clep us i": "clep history us i",
    "clep us ii": "clep history us ii",
    # "Spanish AND Writing" = the "Spanish with Writing" exam
    "clep spanish and writing level ii": "clep spanish with writing level ii",
    "clep spanish and writing level i": "clep spanish with writing level i",
}


def _with_language(key):
    """CLEP colleges often drop the word 'Language' ('CLEP French Level II');
    retry the key with it inserted after the language word."""
    for lang in _CLEP_LANGS:
        pat = rf"^clep {lang}\b(?! language)"
        if re.match(pat, key):
            return re.sub(rf"^clep {lang}", f"clep {lang} language", key, count=1)
    return None


def _truncate_after_roman(key):
    """Colleges append the exam's era subtitle after the roman numeral
    ('History of the United States I: Early Colonization to 1877', 'Western
    Civilization II: 1648 to Present') — the family name ends at the numeral.
    Returns the truncated key, or None if there is nothing to truncate."""
    m = re.match(r"^(.*?\b(?:i|ii|iii))\s+\S.*$", key)
    return m.group(1) if m else None


# ── planning ─────────────────────────────────────────────────────────────────

def load_families():
    """Existing unified titles + their raw-variant counts (the twin-pick
    weight) from kb/unified_titles.json."""
    ut = json.load(open(UT_PATH, encoding="utf-8"))
    titles = ut.get("titles") or ut
    weight = {}
    for _raw, entry in titles.items():
        if isinstance(entry, dict) and entry.get("unified_title"):
            u = entry["unified_title"]
            weight[u] = weight.get(u, 0) + 1
    return weight


def index_families(weight, family_detectors=None):
    """key -> [family titles]. Only titles belonging to a FAMILIES brand are
    indexed (we never retarget across brands)."""
    detectors = family_detectors or FAMILIES
    idx = {}
    for title in weight:
        if not any(f["detect"].match(title) for f in detectors.values()):
            continue
        idx.setdefault(normalize_key(title), []).append(title)
    return idx


def pick_target(cands, weight, exact_hits):
    """Deterministic twin resolution: most raw variants (boosted by this run's
    exact-tier hits, so key-tier rows converge on the same twin the verbatim
    raws anchor), then shortest title, then alphabetical."""
    ranked = sorted(cands, key=lambda t: (
        -(weight.get(t, 0) + exact_hits.get(t, 0)), len(t), t))
    return ranked[0], (ranked[1:] if len(ranked) > 1 else [])


def build_plan(queue, weight, assigned_raws, family_detectors=None):
    detectors = family_detectors or FAMILIES
    idx = index_families(weight, detectors)
    exact = {t: t for t in weight
             if any(f["detect"].match(t) for f in detectors.values())}
    plan = {"seeded": [], "ambiguous": [], "no_match": [], "skipped_assigned": []}

    # Pass 1 — classify every row; exact-tier seeds resolve immediately and
    # their targets feed the twin-pick boost for pass 2.
    exact_hits, key_rows = {}, []
    for raw in queue:
        clean, notes, ambiguous = cleanup(raw)
        fam = next((name for name, f in detectors.items() if f["detect"].match(clean)), None)
        if not fam:
            continue  # not a brand this pass covers
        if raw in assigned_raws:
            plan["skipped_assigned"].append({"raw": raw, "family": fam})
            continue
        if ambiguous:
            plan["ambiguous"].append({"raw": raw, "family": fam, "reason": ambiguous})
            continue
        rec = {"raw": raw, "family": fam, "issuer": detectors[fam]["issuer"],
               "stripped": notes}
        if clean in exact:
            rec.update(target=clean, via="exact")
            plan["seeded"].append(rec)
            exact_hits[clean] = exact_hits.get(clean, 0) + 1
            continue
        key_rows.append((rec, clean))

    # Pass 2 — key-tier resolution through the alias/language/subtitle ladder.
    for rec, clean in key_rows:
        key = normalize_key(clean)
        key = ALIASES.get(key, key)
        cands = idx.get(key)
        if not cands:
            lk = _with_language(key)
            if lk:
                cands = idx.get(ALIASES.get(lk, lk))
        if not cands:
            tk = _truncate_after_roman(key)
            if tk:
                tk = ALIASES.get(tk, tk)
                lk = _with_language(tk)
                cands = idx.get(tk) or (idx.get(ALIASES.get(lk, lk)) if lk else None)
        if cands:
            target, twins = pick_target(cands, weight, exact_hits)
            rec.update(target=target, via="key")
            if twins:
                rec["twins_passed_over"] = twins
            plan["seeded"].append(rec)
        else:
            plan["no_match"].append({"raw": rec["raw"], "family": rec["family"],
                                     "clean": clean, "key": key})
    return plan


def load_queue():
    audit = json.load(open(AUDIT_PATH, encoding="utf-8"))
    return [c["raw_title"] for c in audit.get("title_cards", [])
            if "unclassified_in_map" in (c.get("tags") or [])]


def load_assigned():
    try:
        overlay = json.load(open(OVERLAY_PATH, encoding="utf-8"))
        return set(overlay.get("assignments", {}))
    except (FileNotFoundError, ValueError):
        return set()


# ── v2 STAGED lanes (Session 103, 2026-07-07) ────────────────────────────────
# Sam: "For pre-seeded items, leave them ready to save but not yet saved."
# These lanes NEVER write to Supabase. `--stage` emits kb/unclassified_preseed.json
# (committed); the CER worklist PREFILLS each staged row's title/issuer inputs so
# the curator reviews and clicks Save — the human keeps the trigger. Unlike the
# brand lane (which only retargets to existing families), staged lanes may
# PROPOSE a new title (Rule 5c course-content naming, apprenticeship/NCCER
# authority naming) — that's why they stay stage-only: proposal ≠ assignment.
#
# Issuing-agency authority sources (see the skill's "Authority sources" section +
# docs/kb-notes/reference-issuing-agency-authority-sources.md):
#   DIR DAS:  https://www.dir.ca.gov/databases/das/aigstart.asp
#             carpenter detail: .../results_aigdetail.asp?varOccId=2180
#   NCCER:    https://www.nccer.org/assessments/  (journey-level assessments)
# Both hosts 403 the agent sandbox — verify names via a browser or a runner.

STAGE_PATH = os.path.join(HERE, "unclassified_preseed.json")

ISSUER_CCC = "California Community Colleges"          # Rule 5c.3 — Cx/portfolio/HS-articulation
# Verbatim Sam 2026-07-07 (from the DIR DAS carpenter page, varOccId=2180):
ISSUER_SW_JATC = "Southwest Carpenter And Affiliated Trade J.A.T.C."
# Northern-CA counterpart (CTCNC covers the 46 northern counties; the bare
# "<Trade> Apprenticeship" raws are Cabrillo College = Northern CA):
ISSUER_CTCNC = "Carpenters Training Committee for Northern California (CTCNC)"
ISSUER_NCCER = "NCCER"  # Sam's house precedent ('NCCER Welding Level 1' family)

# "Journeyman Certificate- Apprenticeship Carpentry, <trade>, AS|CA [(Active …)]"
# → Sam's family = the prefix + trade (award suffix + active-note stripped).
_JOURNEYMAN = re.compile(
    r"^Journeyman Certificate-\s*Apprenticeship Carpentry,\s*(?P<trade>.+?),\s*"
    r"(?:AS|CA)\b\s*(?:\(Active from [^)]*\))?\s*$", re.I)

# Bare "<Trade> Apprenticeship" raws that are Carpenters-family trades (CTCNC's
# published roster: Carpenters, Millwrights, Pile Drivers, Drywall/Lathers,
# Insulators, Scaffolders, Floorlayers, Shinglers, Cabinetmakers, Modular).
CTCNC_TRADES = {
    "Cabinetmaker": "Cabinetmaker",
    "Carpentry": "Carpenter",
    "Drywall Applicator": "Drywall Applicator",
    "Hardwood Floor Layer": "Hardwood Floor Layer",
    "Insulator": "Insulator",
    "Millwright": "Millwright",
    "Modular Installer": "Modular Installer",
    "Pile Driver": "Pile Driver",
    "Scaffold Erector": "Scaffold Erector",
    "Shingler": "Shingler",
}

# "Reinforcing Apprenticeship 416: Period N" / "Structural Apprenticeship 433:
# Period N" — Ironworkers Locals 416/433 (Cerritos College area). Sam's IW-*
# assignments carry NO issuer, so these stage title-only.
_IRONWORKER = re.compile(
    r"^(?P<kind>Reinforcing|Structural) Apprenticeship (?P<local>416|433):\s*"
    r"Period (?P<period>\d+)$", re.I)

# Cx mechanism decoration (Rule 5c) — stripped from the title, never kept.
_CX_LEAD = re.compile(r"^credit\s*by\s*exam\s*[:,\s-]*", re.I)
_CX_TRAIL = re.compile(r"[\s,:-]*credit\s*by\s*exam\s*$", re.I)
_CX_CBE = re.compile(r"[\s,:-]*\bCBE\b[\s,:-]*", re.I)
_PORTFOLIO_LEAD = re.compile(r"^portfolio(?:\s+review)?\s*[:,\s-]+", re.I)
_PORTFOLIO_TRAIL = re.compile(r"[\s,:-]*(?:-\s*)?portfolio(?:\s+review)?\s*$", re.I)
# leading local course code(s): "AUTO 60D", "WWT 100", "ACCTG 022", "SPAN-031",
# "MUSIC 265-1" (dashed sub-number = a DISTINCT course — absorbed so levels
# never converge)
_COURSE_CODE = re.compile(
    r"^(?P<subj>[A-Z]{2,10})\s*-?\s*(?P<num>\d{1,4}[A-Z]{0,2}(?:-\d)?)\b[\s:,.-]*")

# HS-articulation decoration: school-name segments + section/IS-code riders.
# A school-name segment must be FOLLOWED BY a separator ([-:]) so bare course
# words are never deleted ('Unified Modeling Language', 'High School
# Equivalency Preparation' stay intact; separator-less school prefixes like
# 'BIOL-424 High School Anatomy...' converge via their code group instead).
_HS_SCHOOL_SEG = re.compile(
    r"(?:^|[\s:,-]+)(?:[A-Z][A-Za-z.'’-]*\s+){0,4}?"
    r"(?:HIGH SCHOOL|High School|Adult School|ROP|Unified(?: School District)?|"
    r"Joint Union|Learn 4 Life|Jurupa Hills High|Fontana High|Kaiser HS|Rancho Cucamonga HS)"
    r"\s*[:-]+\s*", )
_HS_LEAD_WORDS = re.compile(r"^(?:High School(?: Articulation)?)\s*[:-]+\s*", re.I)
_IS_CODES = re.compile(r"\(?\bIS\d+\w*(?:\s*/\s*IS\d+\w*)?\)?")
_SECTION_RIDER = re.compile(r"\s*(?:\d[A-Z]\s*/\s*\d[A-Z]|H\s*1&2|1&2)\s*$")
_HONORS = re.compile(r"\s*\(?\bHonors\b\)?\s*$", re.I)
_PLTW = re.compile(r"\bPLTW\b\s*", re.I)

# Authored judgment singles — rows no mechanical lane covers honestly. Each is
# a PROPOSAL (staged, curator-reviewed), receipted with its reasoning.
JUDGMENT_SINGLES = {
    "Credit By Exam Miramar": {
        "title": "Generic Credit by Exam — San Diego Miramar College",
        "issuer": ISSUER_CCC, "confidence": 0.5,
        "note": "Rule 5 generic bucket (7 adopting colleges); follows the existing "
                "'Generic Credit by Exam — <college>' family shape."},
    "Credit by Exam - WATER 140": {
        "title": "Water Distribution Operator I",
        "issuer": ISSUER_CCC, "confidence": 0.75,
        "note": "COCI course title for WATER 140 at College of the Canyons "
                "(the adopting college) — Rule 5c course-content naming."},
    "Portfolio Review - ART 125B": {
        "title": "Intermediate Drawing",
        "issuer": ISSUER_CCC, "confidence": 0.7,
        "note": "COCI course title for ART 125B at College of the Canyons "
                "(the adopting college) — Rule 5c course-content naming."},
    "MC3 Pre-Apprenticeship Essentials": {
        "title": "Multi-Craft Core Curriculum (MC3) Pre-Apprenticeship",
        "issuer": "North America's Building Trades Unions (NABTU)", "confidence": 0.65,
        "note": "MC3 is NABTU's multi-craft pre-apprenticeship curriculum."},
    "Construction Craft Laborer Apprenticeship": {
        "title": "Construction Craft Laborer Apprenticeship",
        "issuer": "Laborers' International Union of North America (LiUNA)", "confidence": 0.6,
        "note": "Construction Craft Laborer is LiUNA's registered trade; the CA "
                "program sponsor is verifiable via DIR DAS occupational search."},
    "Commercial Electrical Apprenticeship": {
        "title": "Commercial Electrical Apprenticeship",
        "issuer": "", "confidence": 0.55,
        "note": "Electrical trade — identify the sponsoring JATC/program via the "
                "DIR DAS occupational search (Electrician) before setting an issuer."},
    "Residential Electrical Apprenticeship": {
        "title": "Residential Electrical Apprenticeship",
        "issuer": "", "confidence": 0.55,
        "note": "Electrical trade — identify the sponsoring JATC/program via the "
                "DIR DAS occupational search (Electrician) before setting an issuer."},
    # ── Session-104 singles (the statewide-pass residual sweep, 2026-07-07) ──
    "Fire Company Officer 3 Certification (IFSAC or ProBoard Certifications)": {
        "title": "Fire Company Officer 3",
        "issuer": "International Fire Service Accreditation Congress (IFSAC) / Pro Board",
        "confidence": 0.5,
        "note": "SFT-ladder ambiguity: Company Officer certs are level 2 and the "
                "level-3 tier is Chief Fire Officer — confirm with Santa Ana "
                "which certification '3' means before folding."},
    "Fire Inspector 2 (IFSAC/ProBoard)": {
        "title": "Fire Inspector II",
        "issuer": "International Fire Service Accreditation Congress (IFSAC) / Pro Board",
        "confidence": 0.6,
        "note": "Parallels the existing 'Fire Inspector I' family shape (full "
                "level, not the SFT 2A–2D modules); issuer from the raw's "
                "accreditor parenthetical."},
    "Fire Fighter 1: Haz Mat + WMD": {
        "title": "Firefighter 1 — Haz Mat + WMD",
        "issuer": "", "confidence": 0.5,
        "note": "FF1 curriculum embeds HazMat FRO + WMD; verify with Santa Ana "
                "whether this is a distinct award or the 'Firefighter 1' family."},
    "Cal Fire Fire Control 4A: Ignitable Liquids and Gases Awareness/Operations": {
        "title": "Fire Control 4A — Ignitable Liquids and Gases Awareness/Operations",
        "issuer": "California State Fire Training (SFT)", "confidence": 0.6,
        "note": "House 'Fire Control 3B — …' shape; CAL FIRE is the deliverer, "
                "SFT certifies the Fire Control curriculum."},
    "National Wildfire Coordinating Group-S-190 Introduction to Windland Fire Behavior": {
        "title": "NWCG S-190 — Introduction to Wildland Fire Behavior",
        "issuer": "National Wildfire Coordinating Group (NWCG)", "confidence": 0.7,
        "note": "House NWCG shape; 'Windland' typo fixed; S-code kept (Rule 8b)."},
    "S-339 Division/Group Supervisor- ALL RISK (Wildland Fire Fighter)": {
        "title": "NWCG S-339 — Division/Group Supervisor (All-Risk)",
        "issuer": "National Wildfire Coordinating Group (NWCG)", "confidence": 0.6,
        "note": "NWCG position course S-339; house NWCG shape, code kept."},
    "NIMS ICS All-Hazards Incident Commander (ICT3)": {
        "title": "NIMS ICS All-Hazards Incident Commander (ICT3)",
        "issuer": "U.S. Federal Emergency Management Agency (FEMA)", "confidence": 0.55,
        "note": "NIMS position credential (ICT3 code kept, Rule 8b); delivery "
                "varies by agency — verify the certifying body."},
    "California Certified Public Accountant (CPA) License, issued by the California Board of Accountancy (CBA).": {
        "title": "California Certified Public Accountant (CPA) License",
        "issuer": "California Board of Accountancy (CBA)", "confidence": 0.85,
        "note": "Issuer self-declared in the raw title; issuance clause stripped."},
    "California State Water Resources Control Board D2, D3, D4, or D5 certification": {
        "title": "Water Distribution Operator Grade D2, D3, D4, or D5",
        "issuer": "California State Water Resources Control Board (SWRCB)",
        "confidence": 0.6,
        "note": "House per-grade families exist ('Water Distribution Operator "
                "Grade D2'); the OR-span kept as one exhibit per the 'ASE C1 or "
                "G1' statewide precedent — split if Sam prefers per-grade."},
    "Biocom Institute Technician Certification (BioTC) - This certification has no expiration": {
        "title": "Biocom Institute Technician Certification (BioTC)",
        "issuer": "Biocom California Institute", "confidence": 0.7,
        "note": "No-expiration rider stripped; BioTC is the Biocom California "
                "Institute's life-science technician credential."},
    "FCC General Radiotelephone Operator License Preparation": {
        "title": "FCC General Radiotelephone Operator License (GROL)",
        "issuer": "U.S. Federal Communications Commission (FCC)", "confidence": 0.65,
        "note": "Prep exhibits name the credential they prepare for — Sam's "
                "'A+ Certification Preparation' → 'CompTIA A+' precedent."},
    "Microsoft Office Specialist (MOS): Excel Associate or Microsoft Office Specialist (MOS): Excel Expert Certification.": {
        "title": "Microsoft Office Specialist — Excel or Excel Expert",
        "issuer": "Microsoft", "confidence": 0.6,
        "note": "OR-span kept as one exhibit per the 'ASE C1 or G1' statewide "
                "precedent; the house also has separate Excel / Excel Expert "
                "families if Sam prefers a split."},
    "Microsoft Office Specialist (MOS): Word Associate or MOS: Word Expert Certification.": {
        "title": "Microsoft Office Specialist — Word or Word Expert",
        "issuer": "Microsoft", "confidence": 0.6,
        "note": "OR-span kept as one exhibit per the 'ASE C1 or G1' statewide "
                "precedent; separate Word / Word Expert families also exist."},
    "Emergency Care and Safety Institute": {
        "title": "Emergency Care and Safety Institute", "issuer":
        "Emergency Care and Safety Institute (ECSI)", "confidence": 0.4,
        "note": "The raw names the certifying BODY, not a credential — ask "
                "Chaffey which ECSI certification (CPR/First Aid/BLS…) this is."},
    "Emergency Management Experience (LD)": {
        "title": "Emergency Management Experience (Lower Division)",
        "issuer": ISSUER_CCC, "confidence": 0.55,
        "note": "Work-experience credit instrument (title 5 §55050) — LD/UD "
                "division markers expanded; issuer CCC per Rule 5c.3."},
    "Emergency Management Experience (UD)": {
        "title": "Emergency Management Experience (Upper Division)",
        "issuer": ISSUER_CCC, "confidence": 0.55,
        "note": "Work-experience credit instrument (title 5 §55050) — LD/UD "
                "division markers expanded; issuer CCC per Rule 5c.3."},
    "Clinical Embalming (MORT 482 C)": {
        "title": "Clinical Embalming", "issuer": "", "confidence": 0.5,
        "note": "Course code MORT 482C stripped (Rule 5c); typed Industry "
                "Certification at Cypress — certifying body unidentified "
                "(possibly CFB/ABFSE); verify before setting an issuer."},
    "Industry Credentials for Introduction to Computers": {
        "title": "Introduction to Computers", "issuer": "", "confidence": 0.4,
        "note": "'Industry Credentials for <course>' names the course, not the "
                "credential — the suspect_course_as_exhibit pattern; ask LA "
                "Pierce which credential this accepts."},
    "Discipline Exam - ADM JUS 001": {
        "title": "Introduction to Administration of Justice",
        "issuer": ISSUER_CCC, "confidence": 0.75,
        "note": "COCI course title for ADM JUS 001 at Los Angeles Mission "
                "College (the adopting college) — Rule 5c course-content naming."},
    "Internship and Work Experience": {
        "title": "Internship and Work Experience", "issuer": ISSUER_CCC,
        "confidence": 0.45,
        "note": "Rule-5-adjacent generic bucket (Cabrillo CBE); issuer CCC per "
                "Rule 5c.3 — consider a more specific award name with the college."},
    "California Building Code Certification": {
        "title": "California Building Code Certification",
        "issuer": "International Code Council (ICC)", "confidence": 0.6,
        "note": "Statewide CCC-collaborative exhibit kept verbatim; ICC "
                "administers California-code certification exams — verify."},
    "California Residential Code Certification": {
        "title": "California Residential Code Certification",
        "issuer": "International Code Council (ICC)", "confidence": 0.6,
        "note": "Statewide CCC-collaborative exhibit kept verbatim; ICC "
                "administers California-code certification exams — verify."},
    "CLEP French Level III": {
        "title": "CLEP French Language Level III", "issuer": "College Board",
        "confidence": 0.5,
        "note": "Extends the existing 'CLEP French Language Level I/II' ladder — "
                "Santa Rosa awards a third credit tier for higher scores; verify "
                "before folding."},
    "CLEP German Level III": {
        "title": "CLEP German Language Level III", "issuer": "College Board",
        "confidence": 0.5,
        "note": "Extends the existing 'CLEP German Language Level I/II' ladder — "
                "Santa Rosa awards a third credit tier for higher scores; verify "
                "before folding."},
}


def _norm_ws(t):
    return re.sub(r"\s+", " ", _pre_norm(t)).strip()


def stage_journeyman(raw):
    """Sam's 'Journeyman Certificate- Apprenticeship Carpentry, <trade>' family
    (Southwest Carpenters JATC — the DIR DAS carpenter page, varOccId=2180)."""
    m = _JOURNEYMAN.match(_norm_ws(raw))
    if not m:
        return None
    trade = m.group("trade").strip()
    return {"title": "Journeyman Certificate- Apprenticeship Carpentry, " + trade,
            "issuer": ISSUER_SW_JATC, "via": "journeyman", "confidence": 0.9,
            "note": "Mirrors Sam's 2026-07-07 family pattern (award suffix + "
                    "active-note stripped); issuer per DIR DAS occ 2180."}


def stage_carpenters_trade(raw):
    """Bare '<Trade> Apprenticeship' (Cabrillo College — Northern CA) → the
    'Carpenters Apprenticeship — <Trade>' house shape + CTCNC as issuer."""
    m = re.match(r"^(?P<trade>[A-Za-z ]+?) Apprenticeship$", _norm_ws(raw))
    if not m or m.group("trade") not in CTCNC_TRADES:
        return None
    trade = CTCNC_TRADES[m.group("trade")]
    return {"title": "Carpenters Apprenticeship — " + trade,
            "issuer": ISSUER_CTCNC, "via": "carpenters", "confidence": 0.7,
            "note": "House 'Carpenters Apprenticeship — <trade>' shape; Cabrillo "
                    "(Northern CA) → CTCNC per its published trade roster + DIR "
                    "DAS occ 2180. Sam's Acoustical Installer family used a "
                    "combined north/south issuer — adjust if preferred."}


def stage_ironworker(raw):
    m = _IRONWORKER.match(_norm_ws(raw))
    if not m:
        return None
    kind = m.group("kind").capitalize()
    return {"title": "Ironworker Apprenticeship — %s, Period %s" % (kind, m.group("period")),
            "issuer": "", "via": "ironworker", "confidence": 0.6,
            "note": "Ironworkers Local %s program (Cerritos College area); house "
                    "'Ironworker Apprenticeship — <topic>' shape, PERIOD kept "
                    "(Rule 8b analog). Issuer left blank to match Sam's IW-* "
                    "precedent; program name verifiable via DIR DAS." % m.group("local")}


def stage_nccer(raw):
    """NCCER rows keep their (already NCCER-catalog) naming verbatim; issuer =
    'NCCER' per Sam's 'NCCER Welding Level 1' family precedent."""
    t = _norm_ws(raw)
    if not re.match(r"^NCCER\b", t, re.I):
        return None
    return {"title": t, "issuer": ISSUER_NCCER, "via": "nccer", "confidence": 0.85,
            "note": "NCCER catalog naming kept verbatim (nccer.org/assessments; "
                    "curriculum levels + journey-level assessments are distinct "
                    "credentials — never folded)."}


def stage_cx(raw, families=None):
    """Credit-by-Exam / Portfolio rows (Rule 5c): strip the mechanism phrase +
    the leading local course code; the remaining content is the title; issuer =
    California Community Colleges. Prefers an EXISTING family when the content
    key matches one."""
    t = _norm_ws(raw)
    if not re.search(r"credit\s*by\s*exam|\bCBE\b|portfolio", t, re.I):
        return None
    stripped = []
    for pat, tag in ((_CX_LEAD, "cx-lead"), (_CX_TRAIL, "cx-trail"), (_CX_CBE, "cbe"),
                     (_PORTFOLIO_LEAD, "portfolio-lead"), (_PORTFOLIO_TRAIL, "portfolio-trail")):
        t2 = pat.sub(" ", t).strip(" -–,;:")
        if t2 != t:
            stripped.append(tag)
            t = t2
    lead_school = _HS_SCHOOL_SEG.match(t)
    if lead_school and lead_school.start() == 0:
        stripped.append("school name")
        t = t[lead_school.end():].strip(" -–,;:")
    code = None
    m = _COURSE_CODE.match(t)
    if m:
        code = "%s %s" % (m.group("subj"), m.group("num"))
        t = t[m.end():].strip(" -–,;:")
    t = re.sub(r"\s+", " ", t).strip()
    if not t:
        return None  # code-only → JUDGMENT_SINGLES or residual
    rec = {"title": t, "issuer": ISSUER_CCC, "via": "cx", "confidence": 0.75,
           "note": "Rule 5c: mechanism phrase" + (" + course code %s" % code if code else "")
                   + " stripped; issuer = CCC (title 5 §55050 system instrument)."}
    fam = (families or {}).get(normalize_key(t))
    if fam:
        rec["title"] = fam
        rec["confidence"] = 0.85
        rec["note"] += " Matched the existing family %r." % fam
    return rec


def stage_hs(raw, families=None):
    """College-course-code-led rows (incl. high-school / ROP articulations):
    strip the code + school-name decoration + section riders; the course-content
    title remains; issuer = CCC (the college grants the credit).

    ⚠ Rule 5f (Sam, 2026-07-08 — SKILL.md): when the stripped school/trainer is
    IDENTIFIABLE, the school — not CCC — should be staged as issuer AND trainer
    (both default the same). The unclassified queue was empty when the rule
    landed, so this lane still stages CCC; on the next queue drop with
    school-led rows, capture the school segment this function already strips
    and stage it per the local-trainer lane in kb/_preseed_null_issuers.py."""
    t = _norm_ws(raw)
    if re.match(r"^(?:OSHA|NCCER|IC-)", t, re.I):
        return None  # other lanes / other issuers
    codes = []
    # leading school form ("San Gorgonio High School - EGTECH-10: …")
    lead_school = _HS_SCHOOL_SEG.match(t)
    if lead_school and lead_school.start() == 0:
        t = t[lead_school.end():].strip(" :-")
    while True:
        m = _COURSE_CODE.match(t)
        if not m:
            break
        codes.append("%s %s" % (m.group("subj"), m.group("num")))
        t = t[m.end():].strip(" :,-")
        joiner = re.match(r"^(?:and|/|&)\s*", t, re.I)
        if joiner and _COURSE_CODE.match(t[joiner.end():]):
            t = t[joiner.end():]
            continue
        break
    if not codes:
        return None
    notes = []
    t2 = _HS_LEAD_WORDS.sub("", t)
    if t2 != t:
        notes.append("high-school prefix")
        t = t2
    t2 = _HS_SCHOOL_SEG.sub(" ", t)
    if t2 != t:
        notes.append("school name")
        t = t2
    t2 = _IS_CODES.sub(" ", t)
    if t2 != t:
        notes.append("IS-codes")
        t = t2
    t = re.sub(r"\s+", " ", t).strip(" :,-")
    t2 = _SECTION_RIDER.sub("", t)
    if t2 != t:
        notes.append("section rider")
        t = t2
    t2 = _HONORS.sub("", t)
    if t2 != t:
        notes.append("Honors marker")
        t = t2
    t2 = _PLTW.sub("", t).strip()
    if t2 != t and t2:
        notes.append("PLTW brand token")
        t = t2
    t = re.sub(r"\s+", " ", t).strip(" :,-")
    if len(t) < 4:
        return None  # nothing usable left — residual
    rec = {"title": t, "issuer": ISSUER_CCC, "via": "hs", "confidence": 0.7,
           "code": codes[0],
           "note": "Course-content title for %s (stripped: %s); issuer = CCC."
                   % ("/".join(codes), ", ".join(notes) if notes else "course code only")}
    fam = (families or {}).get(normalize_key(t))
    if fam:
        rec["title"] = fam
        rec["confidence"] = 0.8
        rec["note"] += " Matched the existing family %r." % fam
    return rec


def build_family_index(weight, live_values=None):
    """normalize_key(family) → family, over kb/unified_titles.json families ∪
    verified live assignment values (Sam's not-yet-folded picks) — so staged
    rows converge on his verbatim titles. First writer wins per key
    (higher-raw-count families indexed first)."""
    idx = {}
    for title in sorted(weight, key=lambda t: (-weight.get(t, 0), t)):
        idx.setdefault(normalize_key(title), title)
    for v in sorted(set((live_values or {}).values())):
        idx.setdefault(normalize_key(v), v)
    return idx


# ── v3 STATEWIDE-CATALOG + FAMILY lanes (Session 104, 2026-07-07) ────────────
# Sam: "I want to see if you can use the MAP statewide CRs to match some of the
# exhibits. Example IC-Welding Level I — the college used IC to indicate
# industry certification and then listed the NCCER certificate title … take
# another pre-seed pass throughout all the exhibits to get all possible
# populated." Sources: statewide_data.js (the committed daily EACR dataset —
# every exhibit record carries issuing_agency + cpl_type + collaborative_type;
# the 133 `CCC Collaborative` records ARE the map.rccd.edu/statewidecpl
# catalog) + kb/credentials.json (the curated issuer authority). All lanes
# below are STAGE-ONLY (Rule 5e): proposals into kb/unclassified_preseed.json,
# never Supabase.

STATEWIDE_JS = os.path.join(os.path.dirname(HERE), "statewide_data.js")

# cp1252-mojibake em-dash family seen in statewide titles + 3 KB families —
# normalize before keying so decorated raws still land on their family.
_MOJIBAKE = (("â€”", "—"), ("â€“", "–"), ("â€™", "'"), ("â€œ", '"'), ("â€\x9d", '"'))


def _demoji(t):
    for bad, good in _MOJIBAKE:
        t = (t or "").replace(bad, good)
    return t


def load_statewide():
    """Parse statewide_data.js → (ccc_roster, raw_meta). Soft-fails to
    ([], {}) when the artifact is absent (the lanes then simply stage less).
    ccc_roster: [{title, issuer}] — the statewide CCC-collaborative catalog.
    raw_meta: raw exhibit title → {cpl_type, collab} across ALL exhibits (the
    CPL-Type router for stage_cx_type)."""
    try:
        raw = open(STATEWIDE_JS, encoding="utf-8").read()
        start = raw.index("{", raw.index("window.CPL_STATEWIDE"))
        data = json.loads(raw[start:raw.rstrip().rstrip(";").rfind("}") + 1])
    except (OSError, ValueError):
        return [], {}
    roster, meta = [], {}
    for e in data.get("exhibits", []):
        rec_meta = {"cpl_type": e.get("cpl_type") or "",
                    "collab": e.get("collaborative_type") or ""}
        for rt in (e.get("raw_titles") or []) + [e.get("title") or ""]:
            if rt:
                meta.setdefault(rt, rec_meta)
        if e.get("collaborative_type") == "CCC Collaborative":
            title = _demoji((e.get("unified_title") or e.get("title") or "").strip())
            if title:
                roster.append({"title": title,
                               "issuer": (e.get("issuing_agency") or "").strip()})
    return roster, meta


def load_credential_issuers():
    """unified_title → curated issuing agency (best record by confidence) from
    kb/credentials.json — the same authority the dashboard generator reads."""
    try:
        creds = json.load(open(os.path.join(HERE, "credentials.json"), encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    out = {}
    for title, recs in creds.items():
        if isinstance(recs, list) and recs:
            best = max(recs, key=lambda r: r.get("confidence_issuer") or 0)
            iss = (best.get("issuing_agency") or "").strip()
            if iss:
                out[title] = iss
    return out


def stage_key(title):
    """normalize_key + staged-lane folds: trailing credential words dropped
    ('NCCER Welding Level 1 Certification' ≡ 'NCCER Welding Level 1'),
    'fire fighter' ≡ 'firefighter'. Kept SEPARATE from normalize_key so the
    brand-lane behavior (pinned by the verify harness) never drifts."""
    toks = normalize_key(_demoji(title)).split()
    while toks and toks[-1] in ("certification", "certifications", "certificate"):
        toks.pop()
    out, i = [], 0
    while i < len(toks):
        if toks[i] == "fire" and i + 1 < len(toks) and toks[i + 1] == "fighter":
            out.append("firefighter")
            i += 2
            continue
        out.append(toks[i])
        i += 1
    return " ".join(out)


# Irreducible staged-lane aliases (authored; each receipted by the match note).
STAGE_ALIASES = {
    # roman-numeral house family vs arabic raw ('Fire Inspector I' family)
    "fire inspector 1": "fire inspector i",
    # spelled-out brand → the acronym family
    "peace officer standards and training basic academy": "post basic academy",
    # word-order flip on the ACE statewide exhibit
    "military basic training": "basic military training",
    # Sam's precedent: 'A+ Certification Preparation' → 'CompTIA A+' (prep
    # exhibits name the credential they prepare for)
    "network+ certification preparation": "comptia network+",
}

# Acronym-echo parentheticals — '(CNA)', '(MOS)', '(FF1)', '(BioTC)' — are
# decoration on the raw side; families may carry them, so indexes carry BOTH
# keys (with and without) via _stage_keys.
_ACRONYM_PAREN = re.compile(r"\(\s*[A-Za-z][A-Za-z&.\-]{1,11}\d{0,2}\s*\)")
# Fire-service accreditor parentheticals name the CERTIFYING system — captured
# as the issuer, stripped from the title (Rule 4: same credential, issuer
# discriminates).
_ACCREDITOR_PAREN = re.compile(r"\(([^()]*(?:IFSAC|Pro\s*Board)[^()]*)\)", re.I)
_CERT_LEAD = re.compile(r"^certif(?:ication|icate)s?\s*[:,-]+\s*", re.I)


def _accreditor_issuer(hint):
    h = hint.lower()
    ifsac = "ifsac" in h
    pro = re.search(r"pro\s*board", h)
    if ifsac and pro:
        return "International Fire Service Accreditation Congress (IFSAC) / Pro Board"
    if pro:
        return "Pro Board (National Board on Fire Service Professional Qualifications)"
    if ifsac:
        return "International Fire Service Accreditation Congress (IFSAC)"
    return None


def _stage_keys(title):
    """The stage_key plus (when different) the acronym-paren-stripped twin."""
    k1 = stage_key(title)
    yield k1
    stripped = _ACRONYM_PAREN.sub(" ", title)
    if stripped != title:
        k2 = stage_key(stripped)
        if k2 != k1:
            yield k2


def build_stage_indexes(weight, live_values, roster):
    """(sw_index, fam_index): stage_key → canonical title. The statewide index
    also carries a brand-stripped alias when the title's lead token appears in
    the record's issuer ('NCCER Welding Level 1' + issuer '…(NCCER)' ⇒ key
    'welding level i') — the IC-Welding→NCCER bridge. First writer wins,
    deterministic ordering."""
    fam_index = {}
    for title in sorted(weight, key=lambda t: (-weight.get(t, 0), t)):
        for k in _stage_keys(title):
            fam_index.setdefault(k, title)
    for v in sorted(set((live_values or {}).values())):
        for k in _stage_keys(v):
            fam_index.setdefault(k, v)
    sw_index = {}
    for rec in sorted(roster, key=lambda r: r["title"]):
        title, issuer = rec["title"], rec.get("issuer") or ""
        keys = list(_stage_keys(title))
        first = title.split()[0] if title.split() else ""
        if first and issuer and first.lower() in issuer.lower():
            rest = title[len(first):].strip()
            if rest:
                keys += list(_stage_keys(rest))
        for k in keys:
            sw_index.setdefault(k, title)
    return sw_index, fam_index


_IC_LEAD = re.compile(r"^IC\s*-\s*", re.I)


def stage_ic(raw, sw_index, fam_index, issuer_of):
    """'IC-<content>' rows — one college's 'Industry Certification' prefix
    wrapping the credential name. Statewide/family match preferred (Sam's
    IC-Welding Level I → NCCER Welding Level 1 example); unmatched content is
    staged title-only for the curator."""
    t = _norm_ws(raw)
    m = _IC_LEAD.match(t)
    if not m:
        return None
    content = t[m.end():].strip(" -–,;:")
    if not content:
        return None
    key = stage_key(content)
    key = STAGE_ALIASES.get(key, key)
    hit = sw_index.get(key)
    if hit:
        return {"title": hit, "issuer": issuer_of(hit) or "", "via": "statewide",
                "confidence": 0.85,
                "note": "'IC-' (industry certification) prefix wraps the statewide "
                        "credential %r — Sam's IC-Welding → NCCER example "
                        "(2026-07-07, map.rccd.edu/statewidecpl)." % hit}
    hit = fam_index.get(key)
    if hit:
        return {"title": hit, "issuer": issuer_of(hit) or "", "via": "family",
                "confidence": 0.8,
                "note": "'IC-' (industry certification) prefix stripped; the "
                        "content matches the existing house family %r — "
                        "retarget-to-family doctrine (S101)." % hit}
    return {"title": content, "issuer": "", "via": "ic", "confidence": 0.5,
            "note": "'IC-' prefix stripped; no statewide/family match — likely an "
                    "ASE Education Foundation entry-level or local automotive "
                    "certification; identify the certifying body before setting "
                    "an issuer."}


ISSUER_CSLB = "Contractors State License Board (CSLB)"
_CSLB = re.compile(r"^(?:C-\d{1,2}\s.*\bContractor|Class\s[AB](?:-2)?\sContractor\sLicense)$", re.I)


def stage_cslb(raw):
    """CSLB contractor-license classifications (C-##/Class A/B/B-2) — statewide
    CCC-collaborative exhibits whose titles ARE the credential names (Rule 8b:
    the classification code is identity — keep verbatim); the pre-seed adds the
    issuer. Authority: cslb.ca.gov Licensing_Classifications."""
    t = _norm_ws(raw)
    if not _CSLB.match(t):
        return None
    return {"title": t, "issuer": ISSUER_CSLB, "via": "cslb", "confidence": 0.85,
            "note": "CSLB license classification kept verbatim (Rule 8b — the "
                    "C-#/Class code is the credential's identity; "
                    "cslb.ca.gov/About_Us/Library/Licensing_Classifications). "
                    "A statewide CCC-collaborative exhibit."}


def stage_family(raw, sw_index, fam_index, issuer_of):
    """Match a residual raw against the statewide CCC catalog, then ALL existing
    house families, after stripping non-identity decoration ('Certification:'
    lead, acronym-echo + accreditor parentheticals). Issuer = the catalog's /
    the family's curated issuer; an explicit IFSAC/Pro Board accreditor
    parenthetical on the raw overrides it (Rule 4 — issuer discriminates)."""
    t = _norm_ws(_demoji(raw))
    stripped, issuer_hint = [], None
    m = _ACCREDITOR_PAREN.search(t)
    if m:
        issuer_hint = _accreditor_issuer(m.group(1))
        t = (t[:m.start()] + " " + t[m.end():]).strip()
        stripped.append("accreditor parenthetical (%s)" % m.group(1))
    t2 = _CERT_LEAD.sub("", t)
    if t2 != t:
        stripped.append("'Certification:' lead")
        t = t2
    t2 = _ACRONYM_PAREN.sub(" ", t)
    if t2 != t:
        stripped.append("acronym parenthetical")
        t = t2
    t = re.sub(r"\s+", " ", t).strip(" -–,;:.")
    key = stage_key(t)
    key = STAGE_ALIASES.get(key, key)
    hit, via = sw_index.get(key), "statewide"
    if not hit:
        hit, via = fam_index.get(key), "family"
    if not hit:
        return None
    issuer = issuer_hint or issuer_of(hit) or ""
    if hit == _norm_ws(_demoji(raw)) and not issuer:
        return None  # self-match with nothing to add — leave for the curator
    conf = 0.85 if via == "statewide" else 0.8
    if issuer_hint:
        conf = min(conf, 0.7)
    note = ("Matched the %s %r"
            % ("statewide CCC-collaborative catalog entry" if via == "statewide"
               else "existing house family", hit))
    if stripped:
        note += " (stripped: %s)" % ", ".join(stripped)
    if issuer_hint:
        note += ". Issuer from the raw's accreditor parenthetical — the family "
        note += "default may differ; both certify the same credential (Rule 4)."
    else:
        note += "; issuer from the curated credential KB." if issuer else "."
    return {"title": hit, "issuer": issuer, "via": via, "confidence": conf,
            "note": note}


# MAP CPL Types whose mechanism lives in the TYPE column, not the title — the
# Session-103 cx lane (which triggers on mechanism PHRASES) couldn't see them.
_CX_TYPES = {"Credit By Exam": "Credit by Exam", "Portfolio Review": "Portfolio Review"}

# Receipted single-title typo repairs (applied by stage_cx_type only).
TYPO_FIXES = {
    "Combinded Processes I": "Combined Processes I",
    "Introduciton to UNIX/Linux": "Introduction to UNIX/Linux",
    "Introduction to CNC Programing": "Introduction to CNC Programming",
    "Introduction to Mechanical Principals": "Introduction to Mechanical Principles",
}


def stage_cx_type(raw, families=None, raw_meta=None):
    """Rows whose MAP CPL Type is Credit By Exam / Portfolio Review but whose
    title carries NO mechanism phrase (the mechanism lives in the CPL Type
    column — the Mt. SAC / Santa Ana / Cabrillo pattern). Rule 5c: the title
    already IS the course content; issuer = CCC."""
    meta = (raw_meta or {}).get(raw) or (raw_meta or {}).get(raw.strip())
    if not meta or meta.get("cpl_type") not in _CX_TYPES:
        return None
    t = _norm_ws(raw)
    note_bits = []
    fixed = TYPO_FIXES.get(raw) or TYPO_FIXES.get(t)
    if fixed:
        note_bits.append("typo fixed (%r)" % t)
        t = fixed
    m = _COURSE_CODE.match(t)
    if (m and not t[m.end():].strip()) or len(t) < 4:
        return None  # code-only / degenerate → judgment single or residual
    mech = _CX_TYPES[meta["cpl_type"]]
    rec = {"title": t, "issuer": ISSUER_CCC, "via": "cx", "confidence": 0.7,
           "note": "MAP CPL Type = %s — the mechanism lives in the type column "
                   "and the title is already the course content (Rule 5c); "
                   "issuer = CCC." % mech
                   + ((" " + "; ".join(note_bits) + ".") if note_bits else "")}
    fam = (families or {}).get(normalize_key(t))
    if fam:
        rec["title"] = fam
        rec["confidence"] = 0.8
        rec["note"] += " Matched the existing family %r." % fam
    return rec


def build_stage_plan(queue, families, assigned_raws, sw_index=None, fam_index=None,
                     issuer_of=None, raw_meta=None):
    """Run every staged lane over the queue. Returns (staged{raw→rec}, residual[]).
    The v3 params (statewide/family indexes + issuer resolver + per-raw MAP
    metadata) default to empty so the v2 harness fixtures stay valid."""
    sw_index = sw_index or {}
    fam_index = fam_index or {}
    issuer_of = issuer_of or (lambda t: "")
    raw_meta = raw_meta or {}
    staged, residual = {}, []
    # group hs rows by primary code so same-course variants converge on ONE title
    hs_groups = {}
    for raw in queue:
        if raw in assigned_raws:
            continue
        rec = None
        for lane in (stage_journeyman, stage_carpenters_trade, stage_ironworker, stage_nccer):
            rec = lane(raw)
            if rec:
                break
        if not rec and raw in JUDGMENT_SINGLES:
            rec = dict(JUDGMENT_SINGLES[raw], via="single")
        if not rec:
            rec = stage_ic(raw, sw_index, fam_index, issuer_of)
        if not rec:
            rec = stage_cslb(raw)
        if not rec:
            rec = stage_family(raw, sw_index, fam_index, issuer_of)
        if not rec:
            rec = stage_cx(raw, families)
        if not rec:
            rec = stage_hs(raw, families)
            if rec:
                # normalize the FIRTEC typo so it groups with FIRETEC
                gcode = rec["code"].replace("FIRTEC", "FIRETEC")
                hs_groups.setdefault(gcode, []).append((raw, rec))
                continue
        if not rec:
            rec = stage_cx_type(raw, families, raw_meta)
        if rec:
            staged[raw] = rec
        else:
            residual.append(raw)
    # per-code convergence: modal title wins (existing-family matches outrank)
    for gcode, rows in hs_groups.items():
        counts = {}
        for _raw, rec in rows:
            key = rec["title"]
            counts[key] = counts.get(key, 0) + (10 if "existing family" in rec["note"] else 1)
        winner = sorted(counts.items(), key=lambda kv: (-kv[1], len(kv[0]), kv[0]))[0][0]
        for raw, rec in rows:
            if rec["title"] != winner:
                rec["note"] += " Converged on %r (modal title for %s)." % (winner, gcode)
                rec["title"] = winner
                rec["confidence"] = min(rec["confidence"], 0.65)
            rec.pop("code", None)
            staged[raw] = rec
    return staged, residual


def write_stage(staged, residual, queue_count):
    payload = {
        "_about": ("STAGED pre-seed suggestions for the CER unclassified-triage "
                   "worklist (kb/_preseed_unclassified.py --stage). NOT saved to "
                   "Supabase: credential_reference.js PREFILLS each row's assign "
                   "inputs from this file; the curator reviews and clicks Save "
                   "(or 'Save all pre-filled'). Regenerate after queue/family "
                   "changes; rows with a live assignment are never prefilled."),
        "_generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "_queue_count": queue_count,
        "_counts": {"staged": len(staged), "residual": len(residual)},
        "_residual": sorted(residual),
        "staged": {raw: staged[raw] for raw in sorted(staged)},
    }
    with open(STAGE_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=1, ensure_ascii=False)
        f.write("\n")
    return STAGE_PATH


# ── apply lane (service key; the sandbox uses the Supabase MCP instead) ──────

def apply_plan(seeded):
    import urllib.request
    url = os.environ.get("SUPABASE_URL",
                         "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        sys.exit("Set SUPABASE_SERVICE_KEY to apply (or upsert plan.json via the "
                 "Supabase MCP from an agent session).")
    # Fresh-read at write time (the Rule-7 lesson): skip raws that gained a live
    # assignment since the plan was generated — a curator pick always wins.
    req = urllib.request.Request(
        f"{url}/rest/v1/kb_curation?select=course_id"
        f"&course_id=like.{KEY_PREFIX}%25&field=eq.{FIELD_TITLE}",
        headers={"apikey": key, "Authorization": f"Bearer {key}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        live = {row["course_id"][len(KEY_PREFIX):] for row in json.load(r)}
    rows = []
    skipped = 0
    for rec in seeded:
        if rec["raw"] in live:
            skipped += 1
            continue
        for field, value in ((FIELD_TITLE, rec["target"]), (FIELD_ISSUER, rec["issuer"])):
            rows.append({"course_id": KEY_PREFIX + rec["raw"], "field": field,
                         "value": value, "reviewer_email": REVIEWER})
    for i in range(0, len(rows), 100):
        chunk = rows[i:i + 100]
        req = urllib.request.Request(
            f"{url}/rest/v1/kb_curation", method="POST",
            data=json.dumps(chunk).encode(),
            headers={"apikey": key, "Authorization": f"Bearer {key}",
                     "Content-Type": "application/json",
                     "Prefer": "resolution=merge-duplicates,return=minimal"})
        urllib.request.urlopen(req, timeout=60).read()
    print(f"applied {len(rows)} kb_curation rows "
          f"({len(rows) // 2} assignments; {skipped} skipped — already live)")


# ── main ─────────────────────────────────────────────────────────────────────

def load_assigned_md5():
    """Optional --assigned-md5 <file>: newline/comma-separated md5(raw) hashes of
    LIVE-assigned raws (fetched via the Supabase MCP when the sandbox can't reach
    Supabase directly). Falls back to the committed overlay when absent."""
    if "--assigned-md5" not in sys.argv:
        return None
    import hashlib
    path = sys.argv[sys.argv.index("--assigned-md5") + 1]
    hashes = set(re.split(r"[\s,]+", open(path).read().strip()))
    return hashes, hashlib


def main():
    apply = "--apply" in sys.argv
    stage = "--stage" in sys.argv
    queue = load_queue()
    weight = load_families()
    assigned = load_assigned()
    md5set = load_assigned_md5()
    if md5set:
        hashes, hashlib_mod = md5set
        assigned = assigned | {r for r in queue if hashlib_mod.md5(
            r.encode("utf-8")).hexdigest() in hashes}

    if stage:
        # newest committed live-values receipt (not just today's) — a re-run on
        # a later day must not silently drop the verified curator titles from
        # family matching; say loudly which receipt (if any) was used.
        out_root = os.path.join(os.path.dirname(STAGE_PATH), "preseed_out")
        candidates = sorted(
            p for p in (os.path.join(out_root, d, "live_values.json")
                        for d in (os.listdir(out_root) if os.path.isdir(out_root) else []))
            if os.path.exists(p))
        live_values = {}
        if candidates:
            live_values = json.load(open(candidates[-1], encoding="utf-8"))
            print(f"live-values receipt: {candidates[-1]} ({len(live_values)} verified titles)")
        else:
            print("live-values receipt: NONE — family matching uses committed "
                  "kb/unified_titles.json only (fetch + verify a fresh receipt "
                  "via the Supabase MCP for best convergence)")
        families = build_family_index(weight, live_values)
        roster, raw_meta = load_statewide()
        issuers_cred = load_credential_issuers()
        sw_issuer = {r["title"]: r["issuer"] for r in roster if r.get("issuer")}

        def issuer_of(t):
            return sw_issuer.get(t) or issuers_cred.get(t) or ""
        sw_index, fam_index = build_stage_indexes(weight, live_values, roster)
        print(f"statewide catalog: {len(roster)} CCC-collaborative records | "
              f"raw-meta {len(raw_meta)} | curated issuers {len(issuers_cred)}")
        staged, residual = build_stage_plan(queue, families, assigned,
                                            sw_index, fam_index, issuer_of, raw_meta)
        by_via = {}
        for rec in staged.values():
            by_via[rec["via"]] = by_via.get(rec["via"], 0) + 1
        print(f"queue: {len(queue)} | already-assigned: {len(assigned & set(queue))} | "
              f"STAGED: {len(staged)} {by_via} | residual: {len(residual)}")
        for raw in sorted(staged):
            rec = staged[raw]
            print(f"  STAGE [{rec['via']:10}] {raw!r}\n"
                  f"        → {rec['title']!r} · {rec['issuer'] or '(no issuer)'} · {rec['confidence']}")
        for raw in sorted(residual):
            print(f"  RESIDUAL {raw!r}")
        print("staged file:", write_stage(staged, residual, len(queue)))
        return

    plan = build_plan(queue, weight, assigned)

    print(f"queue: {len(queue)} unclassified | seeded: {len(plan['seeded'])} | "
          f"ambiguous: {len(plan['ambiguous'])} | no-match: {len(plan['no_match'])} | "
          f"already-assigned: {len(plan['skipped_assigned'])}")
    for rec in plan["seeded"]:
        twin = f"  (twins passed over: {rec['twins_passed_over']})" if rec.get(
            "twins_passed_over") else ""
        print(f"  SEED [{rec['via']:5}] {rec['raw']!r}\n"
              f"        → {rec['target']!r} · {rec['issuer']}{twin}")
    for rec in plan["ambiguous"]:
        print(f"  AMBIG {rec['raw']!r} — {rec['reason']}")
    for rec in plan["no_match"]:
        print(f"  NOMATCH {rec['raw']!r} (clean={rec['clean']!r} key={rec['key']!r})")

    os.makedirs(OUTDIR, exist_ok=True)
    receipt = os.path.join(OUTDIR, "plan.json")
    with open(receipt, "w", encoding="utf-8") as f:
        json.dump({
            "_about": ("Pre-seed plan for the CER unclassified-triage worklist: "
                       "brand-family raws mapped to EXISTING house families by "
                       "deterministic normalization (kb/_preseed_unclassified.py). "
                       "Applied rows carry reviewer_email 'preseed-v1@bot' in "
                       "kb_curation's _UNCLASSIFIED:: namespace."),
            "_generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "queue_count": len(queue),
            "counts": {k: len(v) for k, v in plan.items()},
            **plan,
        }, f, indent=1, ensure_ascii=False)
        f.write("\n")
    print(f"receipt: {receipt}")

    if apply:
        apply_plan(plan["seeded"])
    else:
        print("dry-run — review the receipt, then --apply (or upsert via MCP).")


if __name__ == "__main__":
    main()

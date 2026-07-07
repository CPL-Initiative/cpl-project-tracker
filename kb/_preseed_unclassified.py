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
    title remains; issuer = CCC (the college grants the credit)."""
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


def build_stage_plan(queue, families, assigned_raws):
    """Run every staged lane over the queue. Returns (staged{raw→rec}, residual[])."""
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
            rec = stage_cx(raw, families)
        if not rec:
            rec = stage_hs(raw, families)
            if rec:
                # normalize the FIRTEC typo so it groups with FIRETEC
                gcode = rec["code"].replace("FIRTEC", "FIRETEC")
                hs_groups.setdefault(gcode, []).append((raw, rec))
                continue
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
        staged, residual = build_stage_plan(queue, families, assigned)
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

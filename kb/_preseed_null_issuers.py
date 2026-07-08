"""
CER issuer-lane PRE-SEED — staged title/issuer/trainer suggestions for
classified credentials that still need agency triage.

Sam (2026-07-08, Session 105): "I would expect all the exhibits that don't have
an issuing agency to pop on the Triage list … take a run through them to see if
you can pre-seed." The CER's missing-issuer triage lane
(credential_reference.js renderIssuerLaneInto) lists every classified
credential with a null issuer; this script writes kb/issuer_preseed.json —
STAGED prefills for that lane, mirroring the kb/unclassified_preseed.json
contract exactly: **prefill-only, ZERO Supabase writes, the curator's click
saves** (Rule 5e). A save writes the standard issuing_agency_override (plus
unified_title_override / training_agency_override when the plan stages them),
which Modes A2/A3 (kb/_apply_credential_review.py) promote into
kb/credentials.json on the daily sync.

Session 106 (Sam's Rule 5f, 2026-07-08): trainer-named local pathway exhibits
— high school, ROP, adult school, noncredit — that earn credit via Credit By
Exam or Portfolio get the TRAINER STRIPPED FROM THE TITLE and set as BOTH the
issuing agency and the training agency (defaults the same). Example:
"AB MILLER HIGH SCHOOL- Business and Finance" → title "Business and Finance",
issuer + trainer "AB Miller High School". This supersedes the Session-105
local-hs ""-verdict lane AND outranks the cx→CCC lane whenever a school/trainer
is identifiable. Rows that ALREADY carry an issuer (e.g. PLTW via a ROP) keep
it — the plan stages only the title/trainer cleanup and marks the entry
`resurface: true` so the lane shows it even though its issuer is set.

Plan schema v2 (additive — v1 consumers keep working):
  staged[ut] = {
    issuer:  str        stage this issuing agency ("" = explicit no-formal-issuer
                        verdict; null = DON'T change the issuer — title/trainer only)
    title:   str?       staged unified-title override (Rule 5f school-strip)
    trainer: str?       staged training agency (Rule 5f: defaults same as issuer)
    via / confidence / note   provenance (as v1)
    resurface: true?    row already carries an issuer; surfaced for cleanup only
  }

Lanes, in precedence order (first hit wins):
  local-trainer     Rule 5f — a school/ROP/adult-school trainer is identifiable
                    (credential trainer field, raw-variant title, or unified-
                    title decoration) → strip it from the title, stage it as
                    issuer + trainer.
  statewide         normalized-title match into statewide_data.js's CCC-
                    collaborative catalog whose record carries an issuer.
  family            the row's DISTINCTIVE leading token matches issuer-carrying
                    siblings in kb/credentials.json that are UNANIMOUS about
                    one issuer (receipted: the note names a sibling). Generic
                    leading words (Advanced/Basic/Certified/…) never match.
  cx                every cpl_type is Credit By Exam / Portfolio Review and NO
                    school/trainer is identifiable → "California Community
                    Colleges" (Sam's Session-103 rule: the mechanism lives in
                    the type column; issuer = CCC).
  course-as-exhibit quality_flag == suspect_course_as_exhibit (and not cx-
                    typed) → "" — a course with no credential has no issuer.

Deliberately RESIDUAL (reported, never staged):
  - apprenticeship-articulation rows ("… (Norco IBEW/Carpenters Articulation)")
    — trade attribution needs the DIR DAS occupation lookup
    (docs/kb-notes/reference-issuing-agency-authority-sources.md); the
    Ironworkers precedent left issuers blank pending DIR confirmation.
  - Military / Standardized Assessment / Other-typed rows — ACE / service-
    branch judgment calls.

An entry whose issuer is "" stages the explicit no-formal-issuer verdict; the
lane UI renders it as "⚡ pre-seed · no formal issuer" and the bulk save counts
it separately in its confirm.

Run from repo root:
  python3 kb/_preseed_null_issuers.py           # writes kb/issuer_preseed.json
Verify:
  python3 kb/_verify_issuer_preseed.py
"""
import json
import os
import re
import sys
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
CRD_JS = os.path.join(os.path.dirname(HERE), "credential_reference_data.js")
OUT = os.path.join(HERE, "issuer_preseed.json")

sys.path.insert(0, HERE)
from _preseed_unclassified import (  # noqa: E402
    load_statewide, load_credential_issuers, _pre_norm, _demoji, STATEWIDE_JS)
# Rule 5c title machinery (Session 106 follow-up) — ONE definition, shared with
# the unclassified worklist's 💡 suggestions so the two scripts never drift.
from _suggest_unclassified import (  # noqa: E402
    build_coci_index, parse_course_refs, norm_subj, norm_num, norm_college, tokens)
from collections import Counter  # noqa: E402

CCC = "California Community Colleges"

# cpl_type families whose mechanism IS the type column (Rule 5c) — when a row
# carries ONLY these, the issuer is the system itself.
CX_TYPES = {"Credit By Exam", "Portfolio Review"}

# Rule 5f applies to Cx/Portfolio-mechanism rows; blank and "Other" types ride
# along when the title itself says pathway/articulation (HS rows predate the
# type column's discipline — the curator confirms every prefill anyway).
TRAINER_OK_TYPES = CX_TYPES | {"Other"}

# Leading tokens that can never anchor a family match — course-catalog generic.
GENERIC_LEAD = {
    "advanced", "basic", "beginning", "intro", "introduction", "introductory",
    "intermediate", "general", "applied", "fundamentals", "fundamental",
    "principles", "certified", "certificate", "certification", "professional",
    "master", "elementary", "essential", "essentials", "the", "a", "an",
    "level", "course", "program", "california", "american", "national",
    "occupational", "digital", "clinical", "medical", "business", "computer",
    "engineering", "industrial", "technical", "construction", "automotive",
    "welding", "fire", "emergency", "health", "food", "early", "adult",
    "high", "military", "college", "work", "workplace",
}


def norm_title(t):
    """Loose title key for the statewide lane: case/space/dash-insensitive."""
    t = _pre_norm(t or "").casefold()
    t = re.sub(r"[^a-z0-9]+", " ", t)
    return " ".join(t.split())


def load_rows():
    """Every baked CER row the lanes need:
    [{ut, display, issuer, trainer, cpl_types, quality_flag, raws, colleges}].
    colleges = the articulating colleges from the baked articulations — the
    Rule 5c COCI lookup's college scope (for a local single-college Cx exhibit
    the articulating college IS the college whose catalog names the course)."""
    raw = open(CRD_JS, encoding="utf-8").read()
    start = raw.index("{", raw.index("window.CPL_CREDENTIAL_REFERENCE"))
    data = json.loads(raw[start:raw.rstrip().rstrip(";").rfind("}") + 1])
    out = []
    for r in data.get("unified_titles", []):
        ut = r.get("ut") or ""
        if not ut:
            continue
        colleges = []
        for a in (r.get("articulations") or []):
            for lc in ((a or {}).get("local") or []):
                for c in ((lc or {}).get("colleges") or []):
                    if c and c not in colleges:
                        colleges.append(c)
        out.append({
            "ut": ut,
            "display": r.get("display_title") or ut,
            "issuer": (r.get("issuer") or "").strip(),
            "trainer": (r.get("trainer") or "").strip(),
            "cpl_types": r.get("cpl_types") or [],
            "quality_flag": r.get("quality_flag") or None,
            "raws": [v.get("r") or "" for v in (r.get("raw_variants") or [])],
            "colleges": colleges,
        })
    return out


def lead_tokens(title, n=2):
    """First n word tokens of the cleaned title."""
    t = _pre_norm(title).strip()
    toks = re.findall(r"[A-Za-z][A-Za-z&.'/-]*", t)
    return toks[:n]


# One-word brands that may anchor a family alone even though they're not
# acronym/mixed-case shaped. Everything else needs a BIGRAM anchor — the
# single-token version matched "Child…" → the CDA council and "Database…" →
# ACE (generic catalog words are never a brand signal).
BRAND_LEADS = {
    "ironworker", "ironworkers", "microsoft", "adobe", "autodesk", "cisco",
    "servsafe", "comptia", "nccer", "osha", "solidworks", "oracle", "kuder",
    "firefighter",
}


def brand_shaped(tok):
    """Acronym (ALL-CAPS ≥3) or mixed-case brand ("ServSafe") or allowlisted."""
    if tok.casefold() in BRAND_LEADS:
        return True
    if len(tok) >= 3 and tok.isupper():
        return True
    return bool(re.search(r"[a-z][A-Z]", tok))


def build_family_index(issuer_of):
    """Two indexes over issuer-carrying credentials:
    mono: brand-shaped leading token → {issuers, sample}
    bi:   leading-bigram (casefolded)  → {issuers, sample}"""
    mono, bi = {}, {}
    for title, iss in issuer_of.items():
        toks = lead_tokens(title)
        if not toks:
            continue
        t0 = toks[0]
        if t0.casefold() not in GENERIC_LEAD and len(t0) >= 3 and brand_shaped(t0):
            rec = mono.setdefault(t0.casefold(), {"issuers": set(), "sample": title})
            rec["issuers"].add(iss)
        if len(toks) == 2 and _bigram_ok(toks):
            key = (toks[0].casefold(), toks[1].casefold())
            rec = bi.setdefault(key, {"issuers": set(), "sample": title, "n": 0})
            rec["issuers"].add(iss)
            rec["n"] += 1
    return {"mono": mono, "bi": bi}


_STOPWORD2 = {"of", "and", "the", "for", "in", "to", "with", "i", "ii", "iii", "iv"}


def _bigram_ok(toks):
    """A bigram anchor must carry real signal: a generic lead word followed by
    a stopword ("Fundamentals of", "Principles of") anchors nothing."""
    return not (toks[0].casefold() in GENERIC_LEAD
                and toks[1].casefold() in _STOPWORD2)


APPR_RX = re.compile(r"\([^)]*articulation[^)]*\)\s*$", re.I)

# ── Apprenticeship sponsors by region (Sam, 2026-07-08) ────────────────────
# The DIR DAS program-sponsor search is not exact, so these are BEST-OPTION
# prefills by college region (Sam: "prepopulating with best option is good
# for now"). Norco + Santiago Canyon apprenticeship exhibits:
#   carpentry (the default — "This will be the case for Norco and Santiago
#   Canyon"): Southwest Carpenter And Affiliated Trade J.A.T.C. (the existing
#   house spelling, 9 records) — DAS occId=82.
#   electrician: Riverside Area Electrical J. A. C. — DAS occId=490.
# ⚠ "IBEW" alone is NOT an electrical signal here: the Norco "IBEW/Carpenters
# Articulation" rows are CARPENTRY (curated correction, 2026-05-20) — the
# electrical branch requires an electric token AND no carpentry token.
CARPENTERS_JATC = "Southwest Carpenter And Affiliated Trade J.A.T.C."
RIVERSIDE_ELEC_JAC = "Riverside Area Electrical J. A. C."
_DAS_URL = "https://www.dir.ca.gov/databases/das/results_aigdetail.asp?varOccId="

_APPR_BLOB = re.compile(r"apprentice", re.I)
_APPR_PAREN = re.compile(
    r"\s*\([^)]*(?:apprenticeship|articulation)[^)]*\)\s*$", re.I)
_ELEC_RX = re.compile(r"electric|IBEW|conduit|wir(?:e|ing)\b|volt", re.I)
_CARP_RX = re.compile(r"carpent", re.I)
_NORCO_RX = re.compile(r"\bNorco\b", re.I)
_SANTIAGO_RX = re.compile(r"Santiago\s+Canyon", re.I)


def stage_apprenticeship(row):
    """Norco / Santiago Canyon apprenticeship exhibits: strip the
    college/program decoration from the title and prefill the DIR-DAS-
    registered sponsor as issuer + trainer. Returns an entry or None."""
    blob = row["ut"] + " " + " ".join(row["raws"])
    if not (_APPR_BLOB.search(blob) or _APPR_PAREN.search(row["display"])):
        return None
    if _NORCO_RX.search(blob) or "Norco College" in row["colleges"]:
        region = "Norco"
    elif _SANTIAGO_RX.search(blob) or "Santiago Canyon College" in row["colleges"]:
        region = "Santiago Canyon"
    else:
        return None
    if _ELEC_RX.search(blob) and not _CARP_RX.search(blob):
        sponsor, occ, trade = RIVERSIDE_ELEC_JAC, "490", "electrician"
    else:
        sponsor, occ, trade = CARPENTERS_JATC, "82", "carpentry"
    entry = {"issuer": sponsor, "trainer": sponsor, "via": "apprenticeship",
             "confidence": 0.6}
    clean = _APPR_PAREN.sub("", row["display"]).strip(" -–—:,")
    note_bits = []
    if clean and clean != row["display"]:
        entry["title"] = clean
        note_bits.append("college/program decoration stripped from the title")
    entry["note"] = ("DIR DAS " + trade + " program sponsor for the " + region
                     + " apprenticeships (Sam, 2026-07-08): " + sponsor
                     + " — " + _DAS_URL + occ + ". Best-option prefill by "
                     "college region (the DAS search is not exact)"
                     + ("; " + "; ".join(note_bits) if note_bits else "") + ".")
    return entry


def is_apprenticeship_residual(ut):
    """The '(… Articulation)' parenthetical marks the DIR-pending apprenticeship
    residual family — EXCEPT when the parenthetical names a school ('(High
    School Articulation)', '(Arroyo Valley HS Articulation)'): those are Rule
    5f's, not apprenticeship."""
    m = APPR_RX.search(ut)
    if not m:
        return False
    seg = m.group(0)
    return not re.search(r"high\s*school|\bHS\b|adult\s+(school|education|ed)|"
                         r"\bROP\b|\bROC\b", seg, re.I)

# ── Rule 5f — trainer-named local pathway exhibits ──────────────────────────
# A "school" is a HS / ROP / adult-school / continuing-ed provider. Bare "HS"
# counts only after a capitalized word and never before a digit ("Basic
# Arrhythmias HS 081 Cx" — HS = Health Science, a course code, not a school).
_SCHOOL_WORDS = (r"(?:High\s+School|Adult\s+School|Adult\s+Education|"
                 r"Continuing\s+Education|Regional\s+Occupational\s+"
                 r"(?:Program|Center)|ROP|ROC/P|ROC)")
_SCHOOL_SHAPE = re.compile(
    r"(?:[A-Z][A-Za-z.'’&-]*[ .]+){0,5}" + _SCHOOL_WORDS + r"\b", re.I)
_HS_ABBREV = re.compile(r"\b([A-Z][A-Za-z.'’-]{2,})\s+HS\b(?!\s*\d)")

# Leading "SUMMIT HIGH SCHOOL- Business and Finance" (separator required).
_LEAD_SCHOOL = re.compile(
    r"^((?:[A-Z][A-Za-z.'’&-]*\s+){0,5}" + _SCHOOL_WORDS + r")\s*[-–—:]+\s*", re.I)
# Trailing "Art of Graphic Design I - Canyon High School" / "… — Baldy View ROP"
_TAIL_SCHOOL = re.compile(
    r"\s*[-–—]+\s*((?:[A-Z][A-Za-z.'’&-]*\s+){0,5}" + _SCHOOL_WORDS + r")\s*$", re.I)
# Trailing "Administration of Justice — Lemoore HS Articulation" (abbrev + rider)
_TAIL_HS_ABBREV = re.compile(
    r"\s*[-–—]+\s*((?:[A-Z][A-Za-z.'’-]{2,}\s+){1,4}HS)(?:\s+Articulation)?\s*$")

# Unified-title decorations the strip pass removes (the existing unified titles
# are already clean course names + decoration — safer to derive the staged
# title from them than to re-parse the raw).
_DECOR_PARENS = re.compile(
    r"\s*\((?:[^()]*(?:High\s+School|HS\s+Articulation|Adult\s+School|"
    r"Adult\s+Education|Continuing\s+Education|ROP|ROC/P|ROC)[^()]*)\)\s*", re.I)
_DECOR_LEAD = re.compile(
    r"^(?:High\s+School\s+Articulation|Adult\s+School)\s*[-–—:]+\s*", re.I)
_DECOR_PATHWAY = re.compile(
    r"^((?:[A-Z][A-Za-z.'’&-]*\s+){0,5}" + _SCHOOL_WORDS + r")\s+Pathway\s*[-–—:]+\s*",
    re.I)
_DECOR_TAIL_ARTIC = re.compile(
    r"\s*[-–—]+\s*(?:(?:[A-Z][A-Za-z.'’&-]*\s+){0,5}" + _SCHOOL_WORDS + r")"
    r"(?:\s+(?:Articulation|Pathway))?\s*$", re.I)
_DECOR_TAIL_HS = re.compile(
    r"\s*[-–—]+\s*(?:[A-Z][A-Za-z.'’-]{2,}\s+){1,4}HS(?:\s+Articulation)?\s*$")
# "(Rancho Cucamonga HS)" — proper-noun words + bare HS inside parens
# (case-SENSITIVE so a legit "(hs)" token in course content never strips).
_DECOR_PARENS_HS = re.compile(r"\s*\((?:[A-Z][A-Za-z.'’-]{1,}\s+){1,4}HS\)\s*")


def _canon_school(s):
    """Deterministic cleanup of an extracted school string: collapse space,
    title-case ALL-CAPS words (initials ≤3 chars stay), expand trailing 'HS'."""
    s = " ".join((s or "").split()).strip(" -–—:")
    if not s:
        return ""
    words = []
    for w in s.split(" "):
        if w.isupper() and len(w) > 3:
            words.append(w.title())
        else:
            words.append(w)
    s = " ".join(words)
    s = re.sub(r"\bHS$", "High School", s)
    return s


def _school_from_raw(raw):
    """One raw variant's embedded school, or ""."""
    m = _LEAD_SCHOOL.match(raw or "")
    if m:
        return _canon_school(m.group(1))
    m = _TAIL_SCHOOL.search(raw or "")
    if m:
        return _canon_school(m.group(1))
    m = _TAIL_HS_ABBREV.search(raw or "")
    if m:
        return _canon_school(m.group(1))
    m = _HS_ABBREV.search(raw or "")
    if m:
        return _canon_school(m.group(0))
    return ""


def school_of(row):
    """Rule 5f school extraction, precedence: the credential's existing trainer
    (when school-shaped) > UNANIMOUS raw-variant title parse > unified-title
    decoration. A credential whose raw variants name DIFFERENT schools (the
    EMT-405 case: Fontana HS + Kaiser HS + Baldy View ROP + Learn 4 Life under
    one identity) gets NO school — one trainer would be wrong for the row's
    grain. Returns (school, source) or ("", "")."""
    tr = row["trainer"]
    if tr and _SCHOOL_SHAPE.search(tr) and "varies" not in tr.casefold():
        return tr, "trainer"
    per_raw = [_school_from_raw(r) for r in row["raws"]]
    named = sorted({s for s in per_raw if s})
    if per_raw and all(per_raw) and len(named) == 1:
        return named[0], "raw"
    if len(named) > 1:
        return "", "raw-conflict"
    if named:
        # some variants named a school, others none — partial signal is not
        # a per-credential trainer (the EMT-405 case: the extractor may simply
        # be blind to the other variants' schools)
        return "", "raw-partial"
    t = row["display"]
    m = _DECOR_PATHWAY.match(t)
    if m:
        return _canon_school(m.group(1)), "title"
    m = _TAIL_SCHOOL.search(t)
    if m:
        return _canon_school(m.group(1)), "title"
    m = _TAIL_HS_ABBREV.search(t)
    if m:
        return _canon_school(m.group(1)), "title"
    return "", ""


def strip_title(display):
    """Rule 5f title strip: remove school/mechanism decoration from the
    EXISTING unified/display title; the course or pathway content remains.
    Returns the stripped title, or "" when nothing usable remains."""
    t = " ".join((display or "").split())
    t = _DECOR_PATHWAY.sub("", t)
    t = _DECOR_LEAD.sub("", t)
    t = _DECOR_TAIL_ARTIC.sub("", t)
    t = _DECOR_TAIL_HS.sub("", t)
    t = _DECOR_PARENS.sub(" ", t)
    t = _DECOR_PARENS_HS.sub(" ", t)
    t = " ".join(t.split()).strip(" -–—:,")
    # A strip that consumed the whole title (or left only school words) failed.
    if not t or _SCHOOL_SHAPE.fullmatch(t):
        return ""
    return t


def title_is_decorated(row):
    """True when the display title still carries school/pathway decoration."""
    return strip_title(row["display"]) not in ("", row["display"])


def stage_local_trainer(row):
    """Rule 5f: returns a staged entry or None."""
    types = set(row["cpl_types"])
    if "Military" in types:
        return None   # ACE/service-branch judgment — never a school default
    school, src = school_of(row)
    decorated = title_is_decorated(row)
    if not school and not decorated:
        return None
    # Type gate: mechanism must be Cx/Portfolio (blank + Other ride along when
    # the title itself is school-decorated — the curator confirms).
    if types and not (types <= TRAINER_OK_TYPES
                      or (decorated and types & CX_TYPES)):
        if not decorated:
            return None
    clean = strip_title(row["display"]) or None
    entry = {"via": "local-trainer", "confidence": 0.7 if school else 0.6}
    note_bits = []
    if clean and clean != row["display"]:
        entry["title"] = clean
        note_bits.append("title stripped of the school/pathway decoration (Rule 5f)")
    if school:
        entry["trainer"] = school
        if row["issuer"]:
            entry["issuer"] = None      # keep the existing issuer (e.g. PLTW)
            entry["resurface"] = True
            note_bits.append("existing issuer kept; trainer = " + school)
        else:
            entry["issuer"] = school
            note_bits.append("issuer & trainer default to the school: " + school
                             + " (from " + (src or "?") + ")")
    else:
        entry["issuer"] = None          # decorated title, school unknown —
        entry["resurface"] = bool(row["issuer"])  # title cleanup only
        note_bits.append("raw variants disagree (or are inconsistent) about the "
                         "school — set issuer/trainer per your judgment"
                         if src in ("raw-conflict", "raw-partial")
                         else "school/trainer not identifiable — title cleanup only")
    if not entry.get("title") and entry.get("issuer") is None \
            and (not school or school == row["trainer"]):
        # nothing would change (title already clean, issuer kept, trainer
        # already the school) — converged, don't stage
        if not (school and not row["issuer"]):
            return None
    raw0 = row["raws"][0] if row["raws"] else ""
    entry["note"] = ("Rule 5f (Sam 2026-07-08): trainer-named local pathway "
                     "exhibit — " + "; ".join(note_bits)
                     + (". Raw: “" + raw0 + "”" if raw0 else "") + ".")
    return entry


# ── Rule 5c title enrichment (Session 106 follow-up — Sam, 2026-07-08:
# "make it as easy and simple as possible for prospective students to find CPL
# that matches their experience"). For Cx exhibits, stage a SEARCHABLE title:
#   a. course-identity lookup — parse the local course code from the raw
#      variant ("ADM JUS 049"), join it COLLEGE-SCOPED into COCI, and take the
#      CCN title > C-ID descriptor title > the local COCI course title.
#      M-ID titles are deliberately EXCLUDED until Sam declares that layer
#      stable (many M-IDs aren't merged with common titles yet — Rule 5c).
#   b. discipline-prefix strip — "<MQ discipline> — <content>" sheds the
#      discipline decoration ("Administration of Justice — Community
#      Relations" → "Community Relations"); the discipline stays on the row's
#      metadata, not in the student-facing title.
# Prefill-only like everything else here (Rule 5e). ────────────────────────

MQ_PATH = os.path.join(HERE, "reference", "mq_disciplines.json")
CID_PATH = os.path.join(HERE, "reference", "cid_descriptors.json")
CCN_PATH = os.path.join(HERE, "reference", "ccn_courses.json")
SUBJ_MAP_PATH = os.path.join(HERE, "reference", "subject_discipline_map.json")

# Type gate for title enrichment: the Cx/Portfolio mechanism family (blank +
# "Other" ride along — the code-titled AoJ rows predate the type column).
TITLE_OK_TYPES = CX_TYPES | {"Other"}


def _load_json_soft(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def load_title_authorities():
    """(mq set, ccn_titles, cid_titles, coci idx, coci college-scoped idx,
    inverse subject map) — every piece soft-fails so the issuer lanes still
    run without them. The inverse subject map (discipline name → candidate
    COCI subject codes, from kb/reference/subject_discipline_map.json)
    resolves discipline-NAME-led course refs — the CCSF pattern
    'Administration of Justice 68' whose real COCI subject is ADMJ."""
    mq = set()
    d = _load_json_soft(MQ_PATH)
    if d:
        mq = {x.casefold() for x in d.get("disciplines", []) if x}
    ccn_titles, cid_titles = {}, {}
    d = _load_json_soft(CCN_PATH)
    if d:
        ccn_titles = {c["ccn"].strip().upper(): c["title"]
                      for c in d.get("courses", []) if c.get("ccn")}
    d = _load_json_soft(CID_PATH)
    if d:
        cid_titles = {x["descriptor"].strip().upper(): x["title"]
                      for x in d.get("descriptors", []) if x.get("descriptor")}
    inv_subj = {}
    d = _load_json_soft(SUBJ_MAP_PATH)
    if d:
        for code, v in (d.get("map") or {}).items():
            disc = v if isinstance(v, str) else (
                v.get("discipline") if isinstance(v, dict) else None)
            if disc:
                inv_subj.setdefault(disc.casefold(), set()).add(code)
    try:
        idx, cidx = build_coci_index()
    except Exception:
        idx, cidx = {}, {}
    return mq, ccn_titles, cid_titles, idx, cidx, inv_subj


_SMALL_WORDS = {"a", "an", "and", "as", "at", "by", "for", "in", "of", "on",
                "or", "the", "to", "with"}
_CAPS_KEEP = {"CPR", "EMT", "EMS", "EMR", "HVAC", "CNC", "CNA", "RN", "LVN",
              "OSHA", "ASE", "AWS", "GIS", "CAD", "CIS", "IT", "ESL", "EKG",
              "ICU", "BLS", "ACLS", "MIG", "TIG", "AC", "DC"}


def _polish_title(t):
    """SHOUTING-CASE COCI catalog titles ('NARCOTICS AND VICE CONTROL') read
    poorly as a student-facing prefill — title-case them (small words lowered,
    roman numerals + known acronyms preserved). Mixed-case titles pass through
    verbatim."""
    letters = [c for c in (t or "") if c.isalpha()]
    if not letters or sum(1 for c in letters if c.isupper()) / len(letters) < 0.8:
        return t
    out = []
    for i, w in enumerate(t.split()):
        core = re.sub(r"[^A-Za-z]", "", w)
        if core in _CAPS_KEEP or re.fullmatch(r"[IVX]{1,4}", core or " "):
            out.append(w)
            continue
        lw = w.lower()
        out.append(lw if (i > 0 and lw in _SMALL_WORDS)
                   else lw[:1].upper() + lw[1:])
    return " ".join(out)


# ── Rule 5g — student-searchable title styling (Sam, 2026-07-08) ──
# A leading level word buries the subject in alphabetical browsing, so it
# moves to the END ("Advanced Floral Design" → "Floral Design Advanced").
# "Introduction…" titles stay as-is; the abbreviation "Intro" expands to
# "Introduction" (word-boundary — "Introduction"/"Introductory" untouched).
_LEVEL_LEAD = re.compile(r"^(Beginning|Intermediate|Advanced)\s+(.+)$", re.I)
# Official proper names where the level word IS the credential's name —
# Rule 8b outranks 5g. Extend as cases surface.
_LEVEL_KEEP = re.compile(
    r"^Advanced\s+(?:Placement\b|EMT\b|Cardiac\b|Cardiovascular\b)", re.I)
_INTRO_ABBREV = re.compile(r"\bIntro\b\.?", re.I)


def restyle_title(t):
    """Rule 5g styling. Returns the (possibly unchanged) title."""
    if not t:
        return t
    out = _INTRO_ABBREV.sub("Introduction", t)
    m = _LEVEL_LEAD.match(out)
    if m and not _LEVEL_KEEP.match(out):
        out = m.group(2).strip() + " " + m.group(1).strip().capitalize()
    return " ".join(out.split())


_DISC_PREFIX = re.compile(r"^(.{3,60}?)\s+—\s+(.+)$")


def strip_discipline_prefix(title, mq):
    """'<MQ discipline> — <content>' → content, or "" when it doesn't apply.
    Guards: the prefix must be an EXACT MQ discipline; the content must carry
    real words (a bare course number never becomes a title); school-decorated
    content stays Rule 5f's business."""
    m = _DISC_PREFIX.match(title or "")
    if not m:
        return ""
    disc, content = m.group(1).strip(), m.group(2).strip()
    if disc.casefold() not in mq:
        return ""
    if not re.search(r"[A-Za-z]{3}", content):
        return ""
    if _SCHOOL_SHAPE.search(content):
        return ""
    return content


# Trailing CPL-mechanism decoration on raw titles ("Administration of Justice
# 68-Industry Certification") — stripped before code parsing; the CPL Type
# column already carries the mechanism (Rules 1/2).
_MECH_TRAIL = re.compile(
    r"\s*[-–—]?\s*(?:Industry Certification|Portfolio Review|"
    r"Credit\s*by\s*Exam|CBE|Cx)\s*$", re.I)
# Trailing "(CCSF)"-style college parenthetical on display titles.
_PAREN_TAIL = re.compile(r"\s*\([^()]{1,30}\)\s*$")

_NAME_LED_REF = re.compile(
    r"^([A-Za-z][A-Za-z /&'.,-]{4,50}?)\s+(\d{1,4}[A-Za-z]{0,2})\s*$")


def name_led_refs(texts, inv_subj):
    """Course refs whose 'subject' is a full DISCIPLINE NAME (the CCSF
    pattern: 'Administration of Justice 68' — real COCI subject ADMJ).
    Resolves the name to candidate subject codes via the inverse subject map;
    the college-scoped join later picks the code the college actually uses.
    Returns [(candidate_codes, num, name)]."""
    out = []
    for t in texts:
        t = _MECH_TRAIL.sub("", _PAREN_TAIL.sub("", " ".join((t or "").split())))
        m = _NAME_LED_REF.match(t)
        if not m:
            continue
        name, num = m.group(1).strip(" ,.-"), m.group(2)
        codes = inv_subj.get(name.casefold())
        if codes:
            out.append((sorted(codes), num, name))
    return out


def coci_title_lookup(row, idx, cidx, ccn_titles, cid_titles, inv_subj=None):
    """Rule 5c course-identity title for a Cx row whose raw variant embeds a
    local course code. College-scoped ((College, SUBJ, NUM) — the articulating
    college's own catalog row) with the global (SUBJ, NUM) view as the
    authority fallback. Falls through to discipline-NAME-led refs (CCSF
    pattern), which are COLLEGE-SCOPED ONLY — resolving a spelled-out
    discipline to a subject code is safe only inside one college's catalog.
    Returns (title, tier, receipt) or ("", "", "")."""
    for raw in row["raws"]:
        for subj, num, rest in parse_course_refs(raw):
            key = (norm_subj(subj), norm_num(num))
            e = idx.get(key)
            if not e:
                continue
            scoped = None
            for cname in row["colleges"]:
                sub = cidx.get((norm_college(cname), key[0], key[1]))
                if sub:
                    scoped = scoped or {"cids": set(), "ccns": set(),
                                        "titles": Counter()}
                    scoped["cids"] |= sub["cids"]
                    scoped["ccns"] |= sub["ccns"]
                    scoped["titles"].update(sub["titles"])
            ccn_set = set(scoped["ccns"]) if scoped else set(e["ccns"])
            cid_set = set(scoped["cids"]) if scoped else set(e["cids"])
            pool = (scoped["titles"] if scoped and scoped["titles"]
                    else e["titles"])
            modal, modal_n = (pool.most_common(1) or [("", 0)])[0]
            # Title-sanity guard (the CCR membership-join hazard): descriptive
            # text beyond the code must overlap the COCI title, else this
            # (SUBJ, NUM) is a different course and the join is noise.
            rt = tokens(rest)
            if rt and modal and not (rt & tokens(modal)):
                continue
            code = subj.upper().strip() + " " + num.upper()
            where = (" at " + row["colleges"][0]
                     if scoped and len(row["colleges"]) == 1 else "")
            # CCN > C-ID (unanimity-gated, so the authority tiers are safe
            # even without a college scope) > the local COCI course title
            # (scoped, or unscoped only when it clearly dominates).
            if len(ccn_set) == 1:
                t = ccn_titles.get(next(iter(ccn_set)).upper())
                if t:
                    return t, "ccn", ("CCN " + next(iter(ccn_set))
                                      + " statewide title, aligned to local course "
                                      + code + where)
            if len(cid_set) == 1:
                t = cid_titles.get(next(iter(cid_set)).upper())
                if t:
                    return t, "cid", ("C-ID " + next(iter(cid_set))
                                      + " descriptor title, aligned to local course "
                                      + code + where)
            if modal and scoped:
                return modal, "course", ("COCI local course title for " + code + where)
            if modal and not row["colleges"]:
                share = modal_n / max(1, sum(pool.values()))
                if share >= 0.6:
                    return modal, "course", ("modal COCI title for " + code + " ("
                                             + str(round(share * 100))
                                             + "% of colleges teaching it)")

    # ── discipline-NAME-led refs (the CCSF pattern) — college-scoped ONLY ──
    if inv_subj and row["colleges"]:
        for codes, num, name in name_led_refs(row["raws"] + [row["display"]],
                                              inv_subj):
            hits = []
            for code in codes:
                key = (norm_subj(code), norm_num(num))
                for cname in row["colleges"]:
                    sub = cidx.get((norm_college(cname), key[0], key[1]))
                    if sub and sub["titles"]:
                        hits.append((code, cname, sub))
            # exactly ONE (code, college) resolution — ambiguity never guesses
            if len(hits) != 1:
                continue
            code, cname, sub = hits[0]
            modal, _n = sub["titles"].most_common(1)[0]
            full_code = code + " " + num.upper()
            where = " at " + cname
            if len(sub["ccns"]) == 1:
                t = ccn_titles.get(next(iter(sub["ccns"])).upper())
                if t:
                    return t, "ccn", ("CCN " + next(iter(sub["ccns"]))
                                      + " statewide title, aligned to local course "
                                      + full_code + where
                                      + " (subject resolved from “" + name + "”)")
            if len(sub["cids"]) == 1:
                t = cid_titles.get(next(iter(sub["cids"])).upper())
                if t:
                    return t, "cid", ("C-ID " + next(iter(sub["cids"]))
                                      + " descriptor title, aligned to local course "
                                      + full_code + where
                                      + " (subject resolved from “" + name + "”)")
            return modal, "course", ("COCI local course title for " + full_code
                                     + where + " (subject resolved from “"
                                     + name + "”)")
    return "", "", ""


def enrich_titles(rows, staged, residual, counts):
    """Stage Rule 5c titles onto Cx-family rows: add `title` to entries the
    issuer lanes already staged, and mint title-only `course-title` entries
    (issuer: null) for queue rows no issuer lane matched — those keep their
    `_residual` record (the issuer still needs judgment; only the title is
    staged). Skips Military rows, resurface entries, and anything Rule 5f
    already titled."""
    mq, ccn_titles, cid_titles, idx, cidx, inv_subj = load_title_authorities()
    if not idx and not mq:
        return 0
    residual_uts = {r["ut"] for r in residual}
    enriched = 0
    for row in rows:
        ut = row["ut"]
        types = set(row["cpl_types"])
        if "Military" in types:
            continue
        # Cx/Portfolio mechanism family — PLUS the suspect course-as-exhibit
        # cohort regardless of type (Sam's CCSF rows: an IC-typed exhibit
        # that IS a course gets the Rule 5c course title, 2026-07-08).
        if not (types <= TITLE_OK_TYPES
                or row["quality_flag"] == "suspect_course_as_exhibit"):
            continue
        entry = staged.get(ut)
        if entry and (entry.get("title") or entry.get("resurface")):
            continue
        if not entry and ut not in residual_uts:
            continue  # not in triage at all (issuer already set, nothing staged)
        title, tier, receipt = coci_title_lookup(row, idx, cidx,
                                                 ccn_titles, cid_titles, inv_subj)
        title = _polish_title(title)
        via_bits = tier
        if not title and mq:
            title = strip_discipline_prefix(row["display"], mq)
            via_bits = "discipline-strip"
            receipt = ("the leading MQ discipline is row metadata, not part of "
                       "the student-facing credential name")
        if not title or title == row["display"]:
            continue
        note = ("Title staged per Rule 5c (" + via_bits + "): " + receipt + ".")
        if entry:
            entry["title"] = title
            entry["note"] += " " + note
        else:
            staged[ut] = {"issuer": None, "title": title, "via": "course-title",
                          "confidence": 0.7,
                          "note": note + " Issuer still needs judgment (no "
                                  "issuer lane matched — see _residual)."}
            counts["course-title"] = counts.get("course-title", 0) + 1
        enriched += 1
    return enriched


# ── Statewide CCC-collaborative exhibits with a BLANK statewide issuer ──
# The statewide dataset's issuing_agency comes from kb/credentials.json — the
# very credentials sitting in this null-issuer queue (circular), so those
# records can't seed themselves. The MAP Faculty Collaborative Recommendation
# PDFs (map.rccd.edu/statewidecpl — the AGENCY row) name the agency; curated
# pattern → issuer rules resolve them. Sam 2026-07-08: the welding Cx family's
# agency is the American Welding Society (the PDF's "America Welding Society"
# is a source typo; house canonical per Rule 6 + the existing AWS D1.x family).
STATEWIDE_BLANK_ISSUERS = [
    (re.compile(r"\((?:GTAW|GMAW|SMAW|FCAW)\)", re.I),
     "American Welding Society (AWS)",
     "the MAP Faculty Collaborative welding recommendations "
     "(map.rccd.edu/statewidecpl/#welding)"),
]


def statewide_blank_issuer(ut):
    for rx, issuer, receipt in STATEWIDE_BLANK_ISSUERS:
        if rx.search(ut):
            return issuer, receipt
    return None, None


# ── Curated certification families (Sam, 2026-07-08 — the FAA pass) ──
# Cx/Portfolio exhibits that are the COURSE SIDE of a recognized
# certification family: the exam/portfolio evidence behind them is that
# family's own credential, so the certifying body pre-seeds as issuer (the
# welding/AWS precedent). FAA: the Part-147 AMT curriculum (airframe /
# powerplant), pilot ground school + flight training (Parts 61/141), and
# remote-pilot (Part 107) rows join the existing 12-row FAA house family in
# kb/credentials.json. "drone pilot" NOT bare "drone" — "Drone Photography"
# is a photography course, not an FAA certification.
CERT_FAMILIES = [
    (re.compile(r"airframe|powerplant|aircraft|aeronaut|avionic|"
                r"flight\s+training|\bflght\b|\bpilot|drone\s+pilot", re.I),
     "Federal Aviation Administration (FAA)",
     "the FAA airman/mechanic certification family (14 CFR Parts 61/65/107/147; "
     "house FAA family in kb/credentials.json)"),
]


def cert_family_issuer(ut):
    for rx, issuer, receipt in CERT_FAMILIES:
        if rx.search(ut):
            return issuer, receipt
    return None, None


def load_statewide_blank_titles():
    """Every statewide-dataset exhibit (ANY collaborative type) whose record
    carries a blank issuer — the corroboration set for the curated
    STATEWIDE_BLANK_ISSUERS rules. The collab label is NOT the gate (MAP
    types the FCAW Cx record 'Local' while its process siblings are CCC
    Collaborative); presence in the statewide dataset is. Soft-fails empty."""
    try:
        raw = open(STATEWIDE_JS, encoding="utf-8").read()
        start = raw.index("{", raw.index("window.CPL_STATEWIDE"))
        data = json.loads(raw[start:raw.rstrip().rstrip(";").rfind("}") + 1])
    except (OSError, ValueError):
        return set()
    out = set()
    for e in data.get("exhibits", []):
        if not (e.get("issuing_agency") or "").strip():
            t = _demoji((e.get("unified_title") or e.get("title") or "").strip())
            if t:
                out.add(norm_title(t))
    return out


def restyle_pass(rows, staged, residual, counts):
    """Rule 5g pass (runs LAST): restyle every already-staged title, then
    stage title-only `title-style` entries for triage rows whose display
    title changes under the rule (leading level word to the end / "Intro" →
    "Introduction"). Scope = the triage cohort only (staged entries + the
    null-issuer residual) — already-issuered rows are never mass-resurfaced
    for styling alone. Military rows stay unstaged."""
    residual_uts = {r["ut"] for r in residual}
    n = 0
    for entry in staged.values():
        t = entry.get("title")
        if t:
            styled = restyle_title(t)
            if styled != t:
                entry["title"] = styled
                entry["note"] += (" Styled per Rule 5g (level word to the "
                                  "end / “Intro” → “Introduction”).")
                n += 1
    note = ("Title styled per Rule 5g: leading level word moved to the end / "
            "“Intro” expanded, so subject families sort together for "
            "student browsing (Sam, 2026-07-08).")
    for row in rows:
        ut = row["ut"]
        if "Military" in set(row["cpl_types"]):
            continue
        entry = staged.get(ut)
        if entry is not None and entry.get("title"):
            continue  # already titled (restyled above)
        if entry is None and ut not in residual_uts:
            continue  # not in triage
        if entry is None and is_apprenticeship_residual(ut):
            continue  # DIR-pending — titles strip WITH the sponsor resolution
        if restyle_title(row["display"]) == row["display"]:
            continue  # Rule 5g itself changes nothing — never stage a
            # polish-only case tweak (the ESL 108C → "108c" trap)
        styled = restyle_title(_polish_title(row["display"]))
        if not styled or styled == row["display"]:
            continue
        if entry is not None:
            entry["title"] = styled
            entry["note"] += " " + note
        else:
            staged[ut] = {"issuer": None, "title": styled, "via": "title-style",
                          "confidence": 0.75,
                          "note": note + " Issuer still needs judgment (see "
                                  "_residual)."}
            counts["title-style"] = counts.get("title-style", 0) + 1
        n += 1
    return n


def stage_all(rows, sw_roster, issuer_of):
    sw_index = {}
    for rec in sw_roster:
        if rec.get("issuer"):
            sw_index.setdefault(norm_title(rec["title"]), rec["issuer"])
    sw_blank = load_statewide_blank_titles()
    fam_index = build_family_index(issuer_of)

    staged, residual, counts = {}, [], {}

    def put(ut, entry):
        staged[ut] = entry
        counts[entry["via"]] = counts.get(entry["via"], 0) + 1

    def put_issuer(ut, issuer, via, conf, note):
        put(ut, {"issuer": issuer, "via": via, "confidence": conf, "note": note})

    queue = [r for r in rows if not r["issuer"]]

    # ── Rule 5f pass over ALL rows (null-issuer AND issuer-carrying) ──
    for row in rows:
        ut = row["ut"]
        if is_apprenticeship_residual(ut):
            continue  # apprenticeship parentheticals are the residual family
        entry = stage_local_trainer(row)
        if entry:
            put(ut, entry)
            # A 5f title-cleanup entry that stages NO issuer on a null-issuer
            # row keeps a residual record — the local trainer exists but is
            # unidentifiable, so the issuer still needs the curator's judgment
            # (staging CCC would contradict Rule 5f's spirit).
            if entry.get("issuer") is None and not entry.get("resurface"):
                residual.append({"ut": ut, "why": "Rule 5f school-decorated row "
                                 "with an unidentifiable school — title staged; "
                                 "issuer needs judgment"})

    # ── the null-issuer lanes (skip rows Rule 5f already claimed) ──
    for row in queue:
        ut = row["ut"]
        if ut in staged:
            continue
        types = set(row["cpl_types"])

        # Norco / Santiago Canyon apprenticeship exhibits — sponsor known
        # (Sam, 2026-07-08); MUST run before the DIR-pending residual routing
        # and before cx (these rows are Cx-typed but the sponsor, not CCC,
        # is the issuer).
        appr = stage_apprenticeship(row)
        if appr:
            put(ut, appr)
            continue

        # deliberate residual families — never staged
        if is_apprenticeship_residual(ut):
            residual.append({"ut": ut, "why": "apprenticeship-articulation — resolve the "
                             "sponsor via DIR DAS (authority-sources kb-note); Ironworkers "
                             "precedent keeps issuer blank pending confirmation"})
            continue
        if types & {"Military"}:
            residual.append({"ut": ut, "why": "Military-typed — ACE/service-branch judgment"})
            continue

        # 1. statewide catalog match
        sw = sw_index.get(norm_title(ut))
        if sw:
            put_issuer(ut, sw, "statewide", 0.8,
                       "Title matches the statewide CCC-collaborative catalog record "
                       "carrying this issuer (statewide_data.js).")
            continue

        # 1b. statewide CCC record with a BLANK issuer — the statewide
        # dataset's issuer is circular with this queue, so resolve via the
        # curated Faculty-Collaborative agency rules (Sam, 2026-07-08).
        if norm_title(ut) in sw_blank:
            iss, receipt = statewide_blank_issuer(ut)
            if iss:
                put_issuer(ut, iss, "statewide-agency", 0.75,
                           "Statewide CCC-collaborative exhibit whose statewide "
                           "record carries no issuer yet; agency per " + receipt
                           + " — Sam, 2026-07-08.")
                continue

        # 2. family with a unanimous issuer — brand-shaped leading token, else
        #    a leading-BIGRAM anchor (a bare generic word never anchors)
        toks = lead_tokens(ut)
        fam, anchor = None, ""
        if toks and brand_shaped(toks[0]) and toks[0].casefold() not in GENERIC_LEAD:
            fam = fam_index["mono"].get(toks[0].casefold())
            anchor = toks[0]
        if not fam and len(toks) == 2 and _bigram_ok(toks):
            cand = fam_index["bi"].get((toks[0].casefold(), toks[1].casefold()))
            # a bigram family needs ≥2 issuer-carrying siblings — one lone
            # sibling agreeing with itself is not corroboration
            if cand and cand["n"] >= 2:
                fam = cand
                anchor = " ".join(toks)
        if fam and len(fam["issuers"]) == 1:
            iss = next(iter(fam["issuers"]))
            put_issuer(ut, iss, "family", 0.65,
                       "Sibling credentials led by “" + anchor + "” already carry this "
                       "issuer in kb/credentials.json (e.g. “" + fam["sample"] + "”).")
            continue

        # 3. curated certification families — the exam/portfolio behind these
        #    course-side rows IS a known certifying body's credential (the
        #    welding/AWS precedent; the FAA pass — Sam, 2026-07-08). Runs
        #    BEFORE cx so the family's body, not CCC, prefills.
        cf_iss, cf_receipt = cert_family_issuer(ut)
        if cf_iss:
            put_issuer(ut, cf_iss, "cert-family", 0.7,
                       "Course-side exhibit of " + cf_receipt
                       + " — Sam, 2026-07-08.")
            continue

        # 4. cx-typed rows with NO identifiable trainer — the mechanism lives
        #    in the type column; issuer = CCC
        if types and types <= CX_TYPES:
            put_issuer(ut, CCC, "cx", 0.7,
                       "Every MAP CPL Type on this credential is "
                       + " / ".join(sorted(types))
                       + " — the mechanism lives in the type column and no local "
                       "trainer is identifiable; issuer = CCC "
                       "(Sam's Session-103 credit-by-exam rule).")
            continue

        # 5. flagged course-as-exhibit — a course with no credential has no issuer
        if row["quality_flag"] == "suspect_course_as_exhibit":
            put_issuer(ut, "", "course-as-exhibit", 0.6,
                       "Flagged suspect_course_as_exhibit — a local course entered as an "
                       "exhibit; no formal issuing body.")
            continue

        residual.append({"ut": ut, "why": "no lane matched (types: "
                         + (", ".join(sorted(types)) or "none") + ")"})

    # ── Rule 5c title pass over the triage cohort ──
    enrich_titles(rows, staged, residual, counts)

    # ── Rule 5g styling pass (LAST — restyles 5c/5f/DAS titles too) ──
    n_restyled = restyle_pass(rows, staged, residual, counts)

    n_titles = sum(1 for v in staged.values() if v.get("title"))
    return staged, residual, counts, len(queue), n_titles, n_restyled


def main():
    rows = load_rows()
    sw_roster, _meta = load_statewide()
    issuer_of = load_credential_issuers()
    staged, residual, counts, queue_n, n_titles, n_restyled = stage_all(
        rows, sw_roster, issuer_of)

    n_resurface = sum(1 for v in staged.values() if v.get("resurface"))
    payload = {
        "_about": "STAGED pre-seeds for the CER issuer-lane triage "
                  "(credential_reference.js). Prefill-only — NOTHING here is saved; "
                  "the curator reviews and clicks Save, which writes the standard "
                  "issuing_agency_override (+ unified_title_override / "
                  "training_agency_override when staged) that Modes A2/A3 promote "
                  "into kb/credentials.json on the daily sync. issuer == \"\" stages "
                  "the explicit no-formal-issuer (local exhibit) verdict; issuer == "
                  "null stages NO issuer change (title/trainer cleanup only — the "
                  "Rule-5f resurface cohort). Titles are staged per Rule 5c — "
                  "course-identity precedence (CCN > C-ID > local COCI course "
                  "title; M-IDs excluded until stable) + the MQ-discipline-prefix "
                  "strip; `course-title` entries stage ONLY a title (their issuer "
                  "stays in _residual for judgment). Every staged title is then "
                  "styled per Rule 5g (leading Beginning/Intermediate/Advanced "
                  "moves to the END; \"Intro\" expands to \"Introduction\"; "
                  "official proper names like Advanced Placement / Advanced EMT / "
                  "ACLS exempt); `title-style` entries stage ONLY that styling. "
                  "Generated by kb/_preseed_null_issuers.py; verify with "
                  "kb/_verify_issuer_preseed.py.",
        "_generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "_queue_count": queue_n,
        "_counts": {k: counts[k] for k in sorted(counts)},
        "_resurface_count": n_resurface,
        "_titles_staged": n_titles,
        "_restyled": n_restyled,
        "_residual_count": len(residual),
        "_residual": sorted(residual, key=lambda r: r["ut"]),
        "staged": {ut: staged[ut] for ut in sorted(staged)},
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=1)
        f.write("\n")

    print(f"rows: {len(rows)}  null-issuer queue: {queue_n}")
    print(f"staged: {len(staged)}  " + json.dumps(payload["_counts"]))
    print(f"  resurface (issuer kept, title/trainer cleanup): {n_resurface}")
    print(f"  titles staged (all rules): {n_titles}")
    print(f"  Rule 5g restyles applied: {n_restyled}")
    print(f"residual: {len(residual)}")
    for r in payload["_residual"][:12]:
        print("  ·", r["ut"], "—", r["why"])
    print(f"→ {os.path.relpath(OUT)}")


if __name__ == "__main__":
    main()

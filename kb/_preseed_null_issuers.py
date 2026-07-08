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
from _preseed_unclassified import load_statewide, load_credential_issuers, _pre_norm  # noqa: E402

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
    [{ut, display, issuer, trainer, cpl_types, quality_flag, raws}]."""
    raw = open(CRD_JS, encoding="utf-8").read()
    start = raw.index("{", raw.index("window.CPL_CREDENTIAL_REFERENCE"))
    data = json.loads(raw[start:raw.rstrip().rstrip(";").rfind("}") + 1])
    out = []
    for r in data.get("unified_titles", []):
        ut = r.get("ut") or ""
        if not ut:
            continue
        out.append({
            "ut": ut,
            "display": r.get("display_title") or ut,
            "issuer": (r.get("issuer") or "").strip(),
            "trainer": (r.get("trainer") or "").strip(),
            "cpl_types": r.get("cpl_types") or [],
            "quality_flag": r.get("quality_flag") or None,
            "raws": [v.get("r") or "" for v in (r.get("raw_variants") or [])],
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


def stage_all(rows, sw_roster, issuer_of):
    sw_index = {}
    for rec in sw_roster:
        if rec.get("issuer"):
            sw_index.setdefault(norm_title(rec["title"]), rec["issuer"])
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

    # ── the null-issuer lanes (skip rows Rule 5f already claimed) ──
    for row in queue:
        ut = row["ut"]
        if ut in staged:
            continue
        types = set(row["cpl_types"])

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

        # 3. cx-typed rows with NO identifiable trainer — the mechanism lives
        #    in the type column; issuer = CCC
        if types and types <= CX_TYPES:
            put_issuer(ut, CCC, "cx", 0.7,
                       "Every MAP CPL Type on this credential is "
                       + " / ".join(sorted(types))
                       + " — the mechanism lives in the type column and no local "
                       "trainer is identifiable; issuer = CCC "
                       "(Sam's Session-103 credit-by-exam rule).")
            continue

        # 4. flagged course-as-exhibit — a course with no credential has no issuer
        if row["quality_flag"] == "suspect_course_as_exhibit":
            put_issuer(ut, "", "course-as-exhibit", 0.6,
                       "Flagged suspect_course_as_exhibit — a local course entered as an "
                       "exhibit; no formal issuing body.")
            continue

        residual.append({"ut": ut, "why": "no lane matched (types: "
                         + (", ".join(sorted(types)) or "none") + ")"})

    return staged, residual, counts, len(queue)


def main():
    rows = load_rows()
    sw_roster, _meta = load_statewide()
    issuer_of = load_credential_issuers()
    staged, residual, counts, queue_n = stage_all(rows, sw_roster, issuer_of)

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
                  "Rule-5f resurface cohort). Generated by "
                  "kb/_preseed_null_issuers.py; verify with kb/_verify_issuer_preseed.py.",
        "_generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "_queue_count": queue_n,
        "_counts": {k: counts[k] for k in sorted(counts)},
        "_resurface_count": n_resurface,
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
    print(f"residual: {len(residual)}")
    for r in payload["_residual"][:12]:
        print("  ·", r["ut"], "—", r["why"])
    print(f"→ {os.path.relpath(OUT)}")


if __name__ == "__main__":
    main()

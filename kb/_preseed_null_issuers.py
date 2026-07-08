"""
CER missing-issuer PRE-SEED — staged issuer suggestions for classified
credentials whose issuing agency is still null.

Sam (2026-07-08, Session 105): "I would expect all the exhibits that don't have
an issuing agency to pop on the Triage list … take a run through them to see if
you can pre-seed." The CER's new missing-issuer triage lane
(credential_reference.js renderIssuerLaneInto) lists every classified
credential with a null issuer; this script writes kb/issuer_preseed.json —
STAGED prefills for that lane, mirroring the kb/unclassified_preseed.json
contract exactly: **prefill-only, ZERO Supabase writes, the curator's click
saves** (Rule 5e). A save writes the standard issuing_agency_override, which
Mode A2 (kb/_apply_credential_review.py) promotes into kb/credentials.json on
the daily sync.

Queue source = the baked credential_reference_data.js (the same rows Sam sees
— `issuer` null), which also carries each row's cpl_types + quality_flag.

Lanes, in precedence order (first hit wins):
  statewide         normalized-title match into statewide_data.js's CCC-
                    collaborative catalog whose record carries an issuer.
  family            the row's DISTINCTIVE leading token matches issuer-carrying
                    siblings in kb/credentials.json that are UNANIMOUS about
                    one issuer (receipted: the note names a sibling). Generic
                    leading words (Advanced/Basic/Certified/…) never match.
  local-hs          "High School Pathway / Articulation" exhibits → "" — the
                    explicit "no formal issuer (local exhibit)" verdict.
  cx                every cpl_type is Credit By Exam / Portfolio Review →
                    "California Community Colleges" (Sam's Session-103 rule:
                    the mechanism lives in the type column; issuer = CCC).
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


def load_queue():
    """The CER's null-issuer rows from the baked payload:
    [{ut, cpl_types, quality_flag}] — the exact queue the lane renders."""
    raw = open(CRD_JS, encoding="utf-8").read()
    start = raw.index("{", raw.index("window.CPL_CREDENTIAL_REFERENCE"))
    data = json.loads(raw[start:raw.rstrip().rstrip(";").rfind("}") + 1])
    out = []
    for r in data.get("unified_titles", []):
        if not r.get("issuer"):
            out.append({
                "ut": r.get("ut") or "",
                "cpl_types": r.get("cpl_types") or [],
                "quality_flag": r.get("quality_flag") or None,
            })
    return [r for r in out if r["ut"]]


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


HS_RX = re.compile(r"high\s+school\s+(pathway|articulation)", re.I)
APPR_RX = re.compile(r"\([^)]*articulation[^)]*\)\s*$", re.I)


def stage_all(queue, sw_roster, issuer_of):
    sw_index = {}
    for rec in sw_roster:
        if rec.get("issuer"):
            sw_index.setdefault(norm_title(rec["title"]), rec["issuer"])
    fam_index = build_family_index(issuer_of)

    staged, residual, counts = {}, [], {}

    def put(ut, issuer, via, conf, note):
        staged[ut] = {"issuer": issuer, "via": via, "confidence": conf, "note": note}
        counts[via] = counts.get(via, 0) + 1

    for row in queue:
        ut = row["ut"]
        types = set(row["cpl_types"])

        # local high-school pathway/articulation — checked BEFORE the
        # apprenticeship residual (its parenthetical also says "Articulation")
        if HS_RX.search(ut):
            put(ut, "", "local-hs", 0.6,
                "Local high-school pathway articulation — the pathway is the "
                "mechanism; no formal issuing body.")
            continue

        # deliberate residual families — never staged
        if APPR_RX.search(ut):
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
            put(ut, sw, "statewide", 0.8,
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
            put(ut, iss, "family", 0.65,
                "Sibling credentials led by “" + anchor + "” already carry this "
                "issuer in kb/credentials.json (e.g. “" + fam["sample"] + "”).")
            continue

        # 4. cx-typed rows — the mechanism lives in the type column; issuer = CCC
        if types and types <= CX_TYPES:
            put(ut, CCC, "cx", 0.7,
                "Every MAP CPL Type on this credential is "
                + " / ".join(sorted(types))
                + " — the mechanism lives in the type column; issuer = CCC "
                "(Sam's Session-103 credit-by-exam rule).")
            continue

        # 5. flagged course-as-exhibit — a course with no credential has no issuer
        if row["quality_flag"] == "suspect_course_as_exhibit":
            put(ut, "", "course-as-exhibit", 0.6,
                "Flagged suspect_course_as_exhibit — a local course entered as an "
                "exhibit; no formal issuing body.")
            continue

        residual.append({"ut": ut, "why": "no lane matched (types: "
                         + (", ".join(sorted(types)) or "none") + ")"})

    return staged, residual, counts


def main():
    queue = load_queue()
    sw_roster, _meta = load_statewide()
    issuer_of = load_credential_issuers()
    staged, residual, counts = stage_all(queue, sw_roster, issuer_of)

    payload = {
        "_about": "STAGED issuer pre-seeds for the CER missing-issuer triage lane "
                  "(credential_reference.js). Prefill-only — NOTHING here is saved; "
                  "the curator reviews and clicks Save, which writes the standard "
                  "issuing_agency_override that Mode A2 promotes into "
                  "kb/credentials.json on the daily sync. issuer == \"\" stages the "
                  "explicit no-formal-issuer (local exhibit) verdict. Generated by "
                  "kb/_preseed_null_issuers.py; verify with kb/_verify_issuer_preseed.py.",
        "_generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "_queue_count": len(queue),
        "_counts": {k: counts[k] for k in sorted(counts)},
        "_residual_count": len(residual),
        "_residual": sorted(residual, key=lambda r: r["ut"]),
        "staged": {ut: staged[ut] for ut in sorted(staged)},
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=1)
        f.write("\n")

    print(f"queue (null-issuer credentials): {len(queue)}")
    print(f"staged: {len(staged)}  " + json.dumps(payload["_counts"]))
    print(f"residual: {len(residual)}")
    for r in payload["_residual"][:12]:
        print("  ·", r["ut"], "—", r["why"])
    print(f"→ {os.path.relpath(OUT)}")


if __name__ == "__main__":
    main()

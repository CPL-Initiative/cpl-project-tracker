"""
One-shot generator for the Phase 2 hand-curated seed of kb/unified_titles.json
and kb/credentials.json.

Run from repo root:  python3 kb/_seed_top50.py

This script encodes the human-curated mapping decisions for the 50
most-frequent raw exhibit titles in CustomReport_latest.json (Phase 2
quality anchor). It is intentionally a one-shot — once it has been run
and the resulting JSON committed, future curation happens by editing
the JSON directly, NOT by re-running this script. Re-running would
overwrite human edits.

The script is kept under kb/ so the curation history is discoverable,
but it has no role in the daily pipeline.
"""
import json
import os
from collections import defaultdict

CLASSIFIED_AT = "2026-05-19"
CLASSIFIED_BY = "hand-curated seed (Phase 2)"

# --- Issuing agencies (canonical names per skill Rule 6) ----------------------
A_COLLEGE_BOARD = "College Board"
A_IBO = "International Baccalaureate Organization (IBO)"
A_POST = "California Commission on Peace Officer Standards and Training (POST)"
A_SFT = "California State Fire Training (SFT)"

# --- Hand-curated mappings ----------------------------------------------------
# Each tuple: (raw_title, unified_title, issuing_agency, confidence_title, notes)
# Notes are mandatory when confidence < 0.85.
MAPPINGS = [
    # ---------- AP (College Board) — sciences ----------
    ("AP Biology (score 3-5): Cal-GETC Area 5B and 5C",
     "AP Biology", A_COLLEGE_BOARD, 0.98, None),
    ("AP Chemistry (score 3-5): Cal-GETC Area 5A and 5C",
     "AP Chemistry", A_COLLEGE_BOARD, 0.98, None),
    ("AP Environmental Science (score 3-5): Cal-GETC Area 5A and 5C",
     "AP Environmental Science", A_COLLEGE_BOARD, 0.98, None),
    ("AP Physics 1: Algebra-Based (score 3-5): Cal-GETC Area 5A and 5C",
     "AP Physics 1", A_COLLEGE_BOARD, 0.96,
     "Skill Rule 1: stripped algebra-based/score/area qualifiers; College Board now markets the exam as 'AP Physics 1' alone (Algebra-Based is implicit)."),
    ("AP Physics 2: Algebra-Based (score 3-5): Cal-GETC Area 5A and 5C",
     "AP Physics 2", A_COLLEGE_BOARD, 0.96,
     "Skill Rule 1: stripped algebra-based/score/area qualifiers (see AP Physics 1)."),
    ("AP Physics C: Mechanics (score 3-5): Cal-GETC Area 5A and 5C",
     "AP Physics C: Mechanics", A_COLLEGE_BOARD, 0.98, None),
    ("AP Physics C: Electricity/Magnetism (score 3-5): Cal-GETC Area 5A and 5C",
     "AP Physics C: Electricity and Magnetism", A_COLLEGE_BOARD, 0.95,
     "Normalized 'Electricity/Magnetism' → 'Electricity and Magnetism' (College Board's current canonical phrasing)."),

    # ---------- AP — humanities / social sciences ----------
    ("AP Psychology (score 3-5): Cal-GETC Area 4",
     "AP Psychology", A_COLLEGE_BOARD, 0.98, None),
    ("AP European History (score 3-5): Cal-GETC Area 3B or 4",
     "AP European History", A_COLLEGE_BOARD, 0.98, None),
    ("AP U.S. History (score 3-5): Cal-GETC Area 3B or 4",
     "AP U.S. History", A_COLLEGE_BOARD, 0.98, None),
    ("AP World History: Modern (score 3-5): Cal-GETC Area 3B or 4",
     "AP World History: Modern", A_COLLEGE_BOARD, 0.97, None),
    ("AP U.S. Government & Politics (score 3-5): Cal-GETC Area 4",
     "AP U.S. Government & Politics", A_COLLEGE_BOARD, 0.97, None),
    ("AP Comparative Government & Politics (score 3-5): Cal-GETC Area 4",
     "AP Comparative Government & Politics", A_COLLEGE_BOARD, 0.97, None),
    ("AP Human Geography (score 3-5): Cal-GETC Area 4",
     "AP Human Geography", A_COLLEGE_BOARD, 0.98, None),
    ("AP Macroeconomics (score 3-5): Cal-GETC Area 4",
     "AP Macroeconomics", A_COLLEGE_BOARD, 0.98, None),
    ("AP Microeconomics (score 3-5): Cal-GETC Area 4",
     "AP Microeconomics", A_COLLEGE_BOARD, 0.98, None),
    ("AP Art History (score 3-5): Cal-GETC Area 3A or 3B",
     "AP Art History", A_COLLEGE_BOARD, 0.98, None),

    # ---------- AP — math ----------
    ("AP Calculus AB (score 3-5): Cal-GETC Area 2",
     "AP Calculus AB", A_COLLEGE_BOARD, 0.98, None),
    ("AP Calculus BC (score 3-5): Cal-GETC Area 2",
     "AP Calculus BC", A_COLLEGE_BOARD, 0.98, None),
    ("AP Calculus BC/ AB sub score (score 3-5): Cal-GETC Area 2",
     "AP Calculus AB", A_COLLEGE_BOARD, 0.70,
     "Judgment call: the 'BC/AB sub score' refers to the AB subscore reported on the BC exam, which demonstrates AB-level competency. Skill Rule 3 (don't split sub-results) applies — unified with AP Calculus AB. Confidence below 0.85 because this could plausibly also be modeled as a separate credential."),
    ("AP Statistics (score 3-5): Cal-GETC Area 2",
     "AP Statistics", A_COLLEGE_BOARD, 0.98, None),

    # ---------- AP — languages ----------
    ("AP Chinese Language & Culture (score 3-5): Cal-GETC Area 3B",
     "AP Chinese Language & Culture", A_COLLEGE_BOARD, 0.98, None),
    ("AP French Language & Culture (score 3-5): Cal-GETC Area 3B",
     "AP French Language & Culture", A_COLLEGE_BOARD, 0.98, None),
    ("AP German Language & Culture (score 3-5): Cal-GETC Area 3B",
     "AP German Language & Culture", A_COLLEGE_BOARD, 0.98, None),
    ("AP Italian Language & Culture (score 3-5): Cal-GETC Area 3B",
     "AP Italian Language & Culture", A_COLLEGE_BOARD, 0.98, None),
    ("AP Japanese Language & Culture (score 3-5): Cal-GETC Area 3B",
     "AP Japanese Language & Culture", A_COLLEGE_BOARD, 0.98, None),
    ("AP Latin (score 3-5): Cal-GETC Area 3B",
     "AP Latin", A_COLLEGE_BOARD, 0.97, None),
    ("AP Spanish Language & Culture (score 3-5): Cal-GETC Area 3B",
     "AP Spanish Language & Culture", A_COLLEGE_BOARD, 0.98, None),
    ("AP Spanish Literature & Culture (score 3-5): Cal-GETC Area 3B",
     "AP Spanish Literature & Culture", A_COLLEGE_BOARD, 0.98, None),

    # ---------- AP — English ----------
    ("AP English Language/Composition (score 3-5): Cal-GETC Area 1A",
     "AP English Language & Composition", A_COLLEGE_BOARD, 0.96,
     "Normalized 'Language/Composition' → 'Language & Composition' (College Board's canonical phrasing)."),
    ("AP English Literature/Composition (score 3-5): Cal-GETC Area 1A or 3B",
     "AP English Literature & Composition", A_COLLEGE_BOARD, 0.96,
     "Normalized 'Literature/Composition' → 'Literature & Composition' (College Board's canonical phrasing)."),

    # ---------- IB — sciences ----------
    ("IB Biology HL (score 5-7): Cal-GETC Area 5B",
     "IB Biology HL", A_IBO, 0.97, None),
    ("IB Chemistry HL (score 5-7): Cal-GETC Area 5A",
     "IB Chemistry HL", A_IBO, 0.97, None),
    ("IB Physics HL (score 5-7): Cal-GETC Area 5A",
     "IB Physics HL", A_IBO, 0.97, None),

    # ---------- IB — math (genuinely two distinct courses post-2019) ----------
    ("IB Mathematics: Applications and Interpretation HL (score 5-7): Cal-GETC Area 2 (may not be at all UC)",
     "IB Mathematics: Applications and Interpretation HL", A_IBO, 0.93,
     "Skill Rule 4: this is the post-2019 IB Maths AI course — distinct from IB Mathematics: Analysis and Approaches. Kept separate. UC-applicability caveat stripped from the unified title."),
    ("IB Mathematics: Analysis and Approaches HL (score 5-7): Cal-GETC Area 2",
     "IB Mathematics: Analysis and Approaches HL", A_IBO, 0.95, None),

    # ---------- IB — humanities / social ----------
    ("IB History (any region) HL (score 5-7): Cal-GETC Area 3B or 4",
     "IB History HL", A_IBO, 0.93,
     "Stripped the '(any region)' qualifier — the parenthetical clarifies that any IB History regional variant qualifies, but the credential identity is the same."),
    ("IB Geography HL (score 5-7): Cal-GETC Area 4",
     "IB Geography HL", A_IBO, 0.97, None),
    ("IB Economics HL (score 5-7): Cal-GETC Area 4",
     "IB Economics HL", A_IBO, 0.97, None),
    ("IB Psychology HL (score 5-7): Cal-GETC Area 4",
     "IB Psychology HL", A_IBO, 0.97, None),
    ("IB Theatre HL (score 5-7): Cal-GETC Area 3A",
     "IB Theatre HL", A_IBO, 0.97, None),

    # ---------- IB Language A — keep three variants separate per Rule 4 ----------
    ("IB Language A: Literature (any language, except English) HL (score 5-7): Cal-GETC Area 3B",
     "IB Language A: Literature (non-English)", A_IBO, 0.82,
     "Skill Rule 4: IB offers Language A: Literature in many languages. The 'except English' variant is materially different from the English variant for articulation, so kept as its own unified title. Renamed parenthetical to '(non-English)' for brevity."),
    ("IB Language A: Literature (any language) HL (score 5-7): Cal-GETC Area 3B",
     "IB Language A: Literature", A_IBO, 0.85,
     "Skill Rule 4: 'Language A: Literature' is a distinct IB DP course from 'Language A: Language and Literature'. Kept separate from the '(non-English)' variant because the '(non-English)' wording flags a different articulation pathway."),
    ("IB Language A: Language and Literature (any language, except English) HL (score 5-7): Cal-GETC Area 3B",
     "IB Language A: Language and Literature (non-English)", A_IBO, 0.82,
     "Skill Rule 4: paired with the all-language variant below — non-English flag preserved because articulation pathway differs."),
    ("IB Language A: Language and Literature (any language) HL (score 5-7): Cal-GETC Area 3B",
     "IB Language A: Language and Literature", A_IBO, 0.85,
     "Skill Rule 4: distinct IB DP course from Language A: Literature; the 'any language' (no exclusion) form is the broader articulation pathway."),

    # ---------- POST ----------
    ("Peace Officer Standards and Training Basic Academy Certificate (POST) ",
     "POST Basic Academy", A_POST, 0.97,
     "Trailing whitespace in raw title is preserved as the cache key but stripped from the unified title."),

    # ---------- SFT ----------
    ("SFT State Fire Officer Certification",
     "California State Fire Officer Certification", A_SFT, 0.92,
     "Expanded the 'SFT' acronym into the unified title per Skill Rule 1 (titles should read cleanly without context); issuer captured separately."),

    # ---------- Generic CBE buckets — Rule 5 ----------
    ("Credit By Exam at Saddleback College",
     "Generic Credit by Exam — Saddleback College", None, 0.55,
     "Skill Rule 5: administrative bucket — Saddleback registers multiple CBE awards under one MAP ExhibitID. Not a single credential; flagged for review."),
    ("Credit By Exam at Mesa",
     "Generic Credit by Exam — San Diego Mesa College", None, 0.50,
     "Skill Rule 5: administrative bucket. 'Mesa' interpreted as San Diego Mesa College (the only CCC named 'Mesa'). Confidence 0.50 because the abbreviation 'Mesa' is ambiguous on its face."),
    ("Credit By Exam San Diego City College",
     "Generic Credit by Exam — San Diego City College", None, 0.55,
     "Skill Rule 5: administrative bucket — San Diego City registers multiple CBE awards under one MAP ExhibitID. Not a single credential; flagged for review."),
]

assert len(MAPPINGS) == 50, f"expected 50 mappings, got {len(MAPPINGS)}"


# --- Credential-level details, keyed by (unified_title, issuing_agency) -------
# Confidence_title lives in unified_titles.json; here we record per-credential
# issuer/trainer confidence and notes. Defaults: confidence_issuer=0.95,
# confidence_trainer=1.0 (no separate trainer), training_agency=None.
# Override per entry only where the credential warrants it.
CRED_DETAILS = {
    # POST: training varies by academy
    ("POST Basic Academy", A_POST): {
        "training_agency": "varies by academy",
        "confidence_issuer": 0.98,
        "confidence_trainer": 0.75,
        "_notes": "Skill Rule 7: California POST sets curriculum and certifies graduates, but academies are run by individual colleges, sheriff's departments, and private providers. Sentinel string 'varies by academy' tells the pipeline to badge cards with a 'Multiple training providers' indicator.",
    },
    # SFT
    ("California State Fire Officer Certification", A_SFT): {
        "training_agency": None,
        "confidence_issuer": 0.95,
        "confidence_trainer": 1.0,
        "_notes": "Cal-OES State Fire Training certifies; training delivered by SFT-accredited regional/college academies — captured under 'varies by academy' in future entries if/when raw titles disambiguate.",
    },
    # Generic CBE — same notes pattern for all three
    ("Generic Credit by Exam — Saddleback College", None): {
        "training_agency": None,
        "confidence_issuer": 0.55,
        "confidence_trainer": 0.55,
        "_notes": "Administrative bucket used by Saddleback to register multiple Credit-by-Exam awards under one MAP ExhibitID. Not a single credential; flagged for human review under Skill Rule 5.",
    },
    ("Generic Credit by Exam — San Diego Mesa College", None): {
        "training_agency": None,
        "confidence_issuer": 0.50,
        "confidence_trainer": 0.50,
        "_notes": "Administrative bucket used by San Diego Mesa College to register multiple Credit-by-Exam awards under one MAP ExhibitID. Not a single credential; flagged for human review under Skill Rule 5.",
    },
    ("Generic Credit by Exam — San Diego City College", None): {
        "training_agency": None,
        "confidence_issuer": 0.55,
        "confidence_trainer": 0.55,
        "_notes": "Administrative bucket used by San Diego City College to register multiple Credit-by-Exam awards under one MAP ExhibitID. Not a single credential; flagged for human review under Skill Rule 5.",
    },
}


# --- Build unified_titles.json ------------------------------------------------
# Load source ExhibitIDs from CustomReport_latest.json so source_exhibit_ids
# is grounded in real data.
def load_exhibit_ids():
    here = os.path.dirname(os.path.abspath(__file__))
    src = os.path.join(here, "..", "CustomReport_latest.json")
    with open(src) as f:
        data = json.load(f)
    ex = data[0]
    cols = ex["columnName"]
    ix = {c: i for i, c in enumerate(cols)}
    eids = defaultdict(set)
    for r in ex["columnValue"]:
        eids[r[ix["Exhibit Title"]]].add(r[ix["ExhibitID"]])
    return {k: sorted(v) for k, v in eids.items()}


def build_unified_titles():
    eids = load_exhibit_ids()
    out = {}
    for raw, unified, _issuer, conf, notes in MAPPINGS:
        out[raw] = {
            "unified_title": unified,
            "confidence_title": conf,
            "classified_at": CLASSIFIED_AT,
            "classified_by": CLASSIFIED_BY,
            "reviewed_at": None,
            "reviewed_by": None,
            "source_exhibit_ids": eids.get(raw, []),
            "_notes": notes,
        }
    return out


def build_credentials():
    out = defaultdict(list)
    seen = set()
    for _raw, unified, issuer, _conf_t, _notes in MAPPINGS:
        key = (unified, issuer)
        if key in seen:
            continue
        seen.add(key)
        detail = CRED_DETAILS.get(key, {})
        record = {
            "issuing_agency": issuer,
            "training_agency": detail.get("training_agency"),
            "confidence_issuer": detail.get("confidence_issuer", 0.95),
            "confidence_trainer": detail.get("confidence_trainer", 1.0),
            "classified_at": CLASSIFIED_AT,
            "classified_by": CLASSIFIED_BY,
            "reviewed_at": None,
            "reviewed_by": None,
            "_notes": detail.get("_notes"),
        }
        out[unified].append(record)
    # Sort top-level for stable diffs
    return {k: out[k] for k in sorted(out.keys())}


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    uni = build_unified_titles()
    cred = build_credentials()
    with open(os.path.join(here, "unified_titles.json"), "w") as f:
        json.dump(uni, f, indent=2, ensure_ascii=False)
        f.write("\n")
    with open(os.path.join(here, "credentials.json"), "w") as f:
        json.dump(cred, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"wrote {len(uni)} raw-title mappings → unified_titles.json")
    print(f"wrote {len(cred)} unified titles ({sum(len(v) for v in cred.values())} issuer records) → credentials.json")


if __name__ == "__main__":
    main()

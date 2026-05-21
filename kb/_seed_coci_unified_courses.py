"""
One-shot generator for the course variant-unification crosswalk (STAGING):
  kb/coci_unified_courses.json

WHAT THIS IS
The minted M-ID layer (kb/coci_minted_courses.json + kb/coci_minted_singletons.json)
groups courses only by EXACT (case/punctuation-normalized) title. So spelling /
word-order / abbreviation variants of the same course land in DIFFERENT M-IDs —
e.g. "Introduction to Psychology", "Intro to Psychology", and "Psychology
Introduction" each become their own M-ID, and the same course taught under
MUS vs MUSC gets two M-IDs. This pass unifies those variants.

It is an ADDITIVE crosswalk: it GROUPS existing M-IDs into unified clusters and
writes a separate file. It does NOT modify the minted catalog/singletons/
memberships, and it does NOT touch the curated common_courses.json /
course_crosswalk.json. Purely reversible.

CONSERVATIVE FIRST CUT — deterministic canonicalization only:
  canonical title = lowercase -> punctuation to space -> expand a small set of
  unambiguous abbreviations (intro->introduction, mgmt->management, ...) ->
  drop filler words (to/of/the/and/...) -> SORT the remaining tokens -> join.
  This merges word-order, filler-word, punctuation, and abbreviation variants.
  It deliberately does NOT do semantic/synonym merging (e.g. "General
  Psychology" == "Introduction to Psychology") — that is a named follow-on.
  LEVEL words/numbers (beginning/intermediate/advanced, 1/2/I/II, A/B) are
  PRESERVED so course levels never collapse together.

Merge key (prevents cross-discipline false merges):
  - discipline known  -> (canonical_title, discipline)  [merges across subject
    codes within one discipline — this is the subject-code-canonicalization win]
  - discipline null   -> (canonical_title, normalized subject)  [same subject
    only — conservative, since we can't confirm the discipline]

Only clusters that actually unify >=2 distinct M-IDs are emitted; an M-ID that
doesn't merge with anything is already its own identity and is left implicit.

TITLE/DESCRIPTION SYNTHESIS (deterministic, included here): each cluster also
gets a synthesized_title and synthesized_description. These are NOT LLM-authored
prose — the title is the best existing member variant (prefer human mixed-case,
then frequency, then length) with casing/whitespace normalized; the description
is the most complete member description (None if no member carries one). The raw
modal title is preserved in canonical_title for traceability.

EXPLICIT FOLLOW-ONS (not done here):
  - semantic/synonym merging (general~intro~principles; LLM-assisted)
  - roman<->arabic level unification ("Spanish I" == "Spanish 1")
  - generative (LLM-authored) title/description synthesis vs deterministic selection
  - merge into curated common_courses.json + the articulation crosswalk

This is an AI-assisted DRAFT for human review. Kept for provenance.

Run from repo root:
  python3 kb/_seed_coci_unified_courses.py
"""
import json
import os
import re
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
CATALOG = os.path.join(HERE, "coci_minted_courses.json")
SINGLETONS = os.path.join(HERE, "coci_minted_singletons.json")
OUT = os.path.join(HERE, "coci_unified_courses.json")

GENERATED_AT = "2026-05-21"
GENERATED_BY = "claude-opus-4-7 (course variant-unification draft)"

FILLER = {"to", "of", "the", "a", "an", "and", "for", "in", "with", "on", "at",
          "de", "del", "la", "el"}
# Small, unambiguous abbreviation expansions (token-level).
ABBREV = {
    "intro": "introduction", "info": "information", "mgmt": "management",
    "mgt": "management", "prin": "principles", "prins": "principles",
    "fund": "fundamentals", "funds": "fundamentals", "fundamentals": "fundamentals",
    "lab": "laboratory", "labs": "laboratory", "prep": "preparation",
    "tech": "technology", "admin": "administration", "dev": "development",
    "sys": "systems",
}


def normsubj(s):
    return re.sub(r"[^A-Z0-9]", "", str(s).upper())


def canon_title(title):
    """Aggressive-but-safe canonical form: order/filler/abbrev-insensitive."""
    t = re.sub(r"[^a-z0-9 ]", " ", str(title).lower())
    toks = [ABBREV.get(w, w) for w in t.split()]
    toks = [w for w in toks if w not in FILLER]
    toks.sort()
    return " ".join(toks)


# --- Deterministic title/description synthesis ---------------------------------
# This is NOT generative: it SELECTS the best existing variant and normalizes its
# casing/whitespace. LLM-authored novel titles/descriptions are a named follow-on.
SMALL_WORDS = {"a", "an", "and", "as", "at", "but", "by", "for", "from", "in",
               "into", "of", "on", "or", "the", "to", "vs", "with"}
# Tokens to force UPPER in a re-cased title. Roman numerals are included because
# both readings (level IV / intravenous IV) want caps.
ACRONYMS_UPPER = {"ASL", "CPR", "AED", "EMT", "EMS", "EKG", "ECG", "HVAC", "CAD",
                  "CADD", "CNC", "GIS", "SQL", "HTML", "CSS", "TV", "RN", "LVN",
                  "ESL", "GED", "OSHA", "DMV", "DUI", "USA", "STEM", "ROTC", "DNA",
                  "RNA", "2D", "3D", "4D", "API",
                  "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"}
TITLE_ABBREV = {"intro": "Introduction", "lab": "Laboratory", "labs": "Laboratories"}


def _clean_ws(s):
    """Strip Excel control-char artifacts (e.g. _x000D_) and collapse whitespace."""
    s = re.sub(r"_x00[0-9A-Fa-f]{2}_", " ", str(s))
    return re.sub(r"\s+", " ", s).strip()


def _cap_word(w):
    return re.sub(r"[A-Za-z]+", lambda m: m.group(0)[:1].upper() + m.group(0)[1:].lower(), w)


def smart_title_case(s):
    words = s.split()
    out = []
    for i, w in enumerate(words):
        bare = re.sub(r"[^A-Za-z0-9]", "", w).upper()
        if bare in ACRONYMS_UPPER:
            out.append(w.upper())
        elif w.lower() in SMALL_WORDS and 0 < i < len(words) - 1:
            out.append(w.lower())
        else:
            out.append(_cap_word(w))
    return " ".join(out)


def synth_title(title_counts):
    """Pick the best variant (prefer human mixed-case, then frequency, then length)
    and normalize casing/whitespace. Returns the cleaned canonical display title."""
    def has_lower(t): return any(c.islower() for c in t)
    def has_upper(t): return any(c.isupper() for c in t)
    # rank: mixed-case first, then by count, then by length
    best = max(title_counts.items(),
               key=lambda kv: (has_lower(kv[0]) and has_upper(kv[0]), kv[1], len(kv[0])))[0]
    s = _clean_ws(best)
    # re-case only if the chosen variant is ALL-CAPS or all-lowercase
    if not (has_lower(s) and has_upper(s)):
        s = smart_title_case(s)
    # expand a tiny set of whole-word abbreviations for display
    s = " ".join(TITLE_ABBREV.get(w.lower(), w) for w in s.split())
    return s


def synth_description(descriptions):
    """Select the most complete member description (longest after whitespace
    cleanup; tie-break most common). None if no member carries one."""
    if not descriptions:
        return None
    cleaned = [_clean_ws(d) for d in descriptions if d and d.strip()]
    cleaned = [d for d in cleaned if d]
    if not cleaned:
        return None
    counts = Counter(cleaned)
    return max(cleaned, key=lambda d: (len(d), counts[d]))


def load_courses():
    """Yield (course_id, common_title, subject, discipline, description) per M-ID."""
    cat = json.load(open(CATALOG))["courses"]
    for cid, v in cat.items():
        yield cid, v["common_title"], v["subject"], v.get("discipline"), v.get("description")
    sg = json.load(open(SINGLETONS))["courses"]
    for cid, v in sg.items():
        yield cid, v["common_title"], v["subject"], v.get("discipline"), v.get("description")


def main():
    groups = defaultdict(list)  # merge key -> [(course_id, common_title, subject, discipline, description)]
    n_total = 0
    for cid, title, subject, disc, desc in load_courses():
        n_total += 1
        ct = canon_title(title)
        if len(ct) < 3:
            continue
        key = (ct, disc) if disc else (ct, "S:" + normsubj(subject))
        groups[key].append((cid, title, subject, disc, desc))

    # keep only clusters that unify >=2 DISTINCT M-IDs
    merged = {k: v for k, v in groups.items() if len({m[0] for m in v}) >= 2}

    unified = {}
    n_mids_merged = 0
    for i, (key, members) in enumerate(
            sorted(merged.items(), key=lambda kv: (kv[0][0], str(kv[0][1]))), start=1):
        uid = f"UC-{i:05d}"
        member_ids = sorted({m[0] for m in members})
        title_counts = Counter(m[1] for m in members)
        rep_title = title_counts.most_common(1)[0][0]
        subjects = sorted({m[2] for m in members})
        disc = key[1] if not str(key[1]).startswith("S:") else None
        n_mids_merged += len(member_ids)
        synth = synth_title(title_counts)
        desc = synth_description([m[4] for m in members])
        unified[uid] = {
            "unified_id": uid,
            "synthesized_title": synth,
            "canonical_title": rep_title,
            "synthesized_description": desc,
            "synthesized_by": ("deterministic — best-variant selection + casing/whitespace "
                               "normalization (NOT LLM-generated)"),
            "discipline": disc,
            "subjects": subjects,
            "cross_subject": len({normsubj(s) for s in subjects}) > 1,
            "member_count": len(member_ids),
            "members": member_ids,
            "title_variants": sorted(title_counts),
            "reviewed_at": None,
            "reviewed_by": None,
        }

    n_cross = sum(1 for v in unified.values() if v["cross_subject"])
    n_recased = sum(1 for v in unified.values()
                    if v["synthesized_title"] != v["canonical_title"])
    n_desc = sum(1 for v in unified.values() if v["synthesized_description"])
    out = {
        "_source": "Derived from kb/coci_minted_courses.json + kb/coci_minted_singletons.json",
        "_status": "STAGING — additive variant-unification crosswalk over the minted M-IDs.",
        "_method": ("Conservative first cut: deterministic canonical title (lowercase, "
                    "punctuation->space, small abbreviation expansion, filler-word removal, "
                    "token sort; LEVEL words/numbers preserved). Merge key (canonical_title, "
                    "discipline) when discipline known, else (canonical_title, subject). Only "
                    "clusters unifying >=2 distinct M-IDs are emitted. NO semantic/synonym "
                    "merging — that is a follow-on."),
        "_synthesis_method": ("synthesized_title/synthesized_description are DETERMINISTIC, not "
                              "LLM-generated: the title is the best member variant (prefer human "
                              "mixed-case, then frequency, then length) with casing/whitespace "
                              "normalized and a tiny abbreviation expansion; the description is the "
                              "most complete member description (none if no member carries one). "
                              "canonical_title keeps the raw modal title for traceability."),
        "_follow_ons": [
            "semantic/synonym merging (general~intro~principles; LLM-assisted)",
            "roman<->arabic level unification (Spanish I == Spanish 1)",
            "generative (LLM-authored) title/description synthesis vs deterministic selection",
            "merge into curated common_courses.json + articulation crosswalk",
        ],
        "_generated_by": "kb/_seed_coci_unified_courses.py",
        "_generated_at": GENERATED_AT,
        "_classified_by": GENERATED_BY,
        "minted_mids_scanned": n_total,
        "unified_clusters": len(unified),
        "mids_unified": n_mids_merged,
        "cross_subject_clusters": n_cross,
        "clusters_with_synthesized_description": n_desc,
        "clusters_title_recased_or_normalized": n_recased,
        "clusters": unified,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"wrote {OUT}")
    print(f"  minted M-IDs scanned: {n_total}")
    print(f"  unified clusters (>=2 M-IDs): {len(unified)}")
    print(f"  M-IDs folded into a cluster: {n_mids_merged}")
    print(f"  cross-subject clusters: {n_cross}")
    print(f"  clusters with a synthesized description: {n_desc}")
    print(f"  clusters whose title was re-cased/normalized: {n_recased}")


if __name__ == "__main__":
    main()

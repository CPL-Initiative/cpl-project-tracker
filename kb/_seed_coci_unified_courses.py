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

EXPLICIT FOLLOW-ONS (not done here):
  - semantic/synonym merging (general~intro~principles; LLM-assisted)
  - roman<->arabic level unification ("Spanish I" == "Spanish 1")
  - title/description synthesis for the unified cluster
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


def load_courses():
    """Yield (course_id, common_title, subject, discipline) for every minted M-ID."""
    cat = json.load(open(CATALOG))["courses"]
    for cid, v in cat.items():
        yield cid, v["common_title"], v["subject"], v.get("discipline")
    sg = json.load(open(SINGLETONS))["courses"]
    for cid, v in sg.items():
        yield cid, v["common_title"], v["subject"], v.get("discipline")


def main():
    groups = defaultdict(list)  # merge key -> [(course_id, common_title, subject, discipline)]
    n_total = 0
    for cid, title, subject, disc in load_courses():
        n_total += 1
        ct = canon_title(title)
        if len(ct) < 3:
            continue
        key = (ct, disc) if disc else (ct, "S:" + normsubj(subject))
        groups[key].append((cid, title, subject, disc))

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
        unified[uid] = {
            "unified_id": uid,
            "canonical_title": rep_title,
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
    out = {
        "_source": "Derived from kb/coci_minted_courses.json + kb/coci_minted_singletons.json",
        "_status": "STAGING — additive variant-unification crosswalk over the minted M-IDs.",
        "_method": ("Conservative first cut: deterministic canonical title (lowercase, "
                    "punctuation->space, small abbreviation expansion, filler-word removal, "
                    "token sort; LEVEL words/numbers preserved). Merge key (canonical_title, "
                    "discipline) when discipline known, else (canonical_title, subject). Only "
                    "clusters unifying >=2 distinct M-IDs are emitted. NO semantic/synonym "
                    "merging — that is a follow-on."),
        "_follow_ons": [
            "semantic/synonym merging (general~intro~principles; LLM-assisted)",
            "roman<->arabic level unification (Spanish I == Spanish 1)",
            "title/description synthesis for the unified cluster",
            "merge into curated common_courses.json + articulation crosswalk",
        ],
        "_generated_by": "kb/_seed_coci_unified_courses.py",
        "_generated_at": GENERATED_AT,
        "_classified_by": GENERATED_BY,
        "minted_mids_scanned": n_total,
        "unified_clusters": len(unified),
        "mids_unified": n_mids_merged,
        "cross_subject_clusters": n_cross,
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


if __name__ == "__main__":
    main()

"""
Seed kb/discipline_canonical_subj4.json from the current data-modal SUBJ4
per M-ID discipline.

The 2026-05-22 CourseControlNumber re-mint synthesized each M-ID's SUBJ4
from its modal local college subject code. The same discipline can therefore
end up with many SUBJ4 variants across colleges — the canonical example
being 92 "Sign Language, American" M-IDs spread across 10 SUBJ4 codes
(ASL/AMSL/DEAF/SIGN/INT/INTR/ACCS/MULT/SL/SNLA). Phase 1e re-mints to enforce
the Rule 7 invariants:

  1. SUBJ portion is exactly 4 letters.
  2. Within id_system == "M-ID", all rows sharing a discipline share a SUBJ4.

This script produces the SEED canonical map: per discipline, the data-modal
SUBJ4 (or blank when the modal isn't 4 letters — those need a curator-chosen
4-letter expansion). Curators review + edit via the Canonical SUBJ4 tab
(writes to Supabase kb_curation with course_id namespace "_CANON_SUBJ4::<discipline>");
kb/_apply_canonical_subj4.py folds those edits back into this file.

Output: kb/discipline_canonical_subj4.json

Run: python3 kb/_seed_canonical_subj4.py
"""
from __future__ import annotations

import json
import os
import re
from collections import Counter, defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
COURSES = os.path.join(HERE, "coci_minted_courses.json")
SINGLETONS = os.path.join(HERE, "coci_minted_singletons.json")
TOP_REF = os.path.join(HERE, "reference", "top_categories.json")
OUT = os.path.join(HERE, "discipline_canonical_subj4.json")
SUBJ4_RE = re.compile(r"^[A-Z]{4}$")


def _load_top_ref():
    """Returns (codes_by_6digit, categories_by_2digit). Missing file is
    tolerated — disciplines just don't get TOP/CTE aggregates in that case."""
    if not os.path.exists(TOP_REF):
        return {}, {}
    with open(TOP_REF, encoding="utf-8") as f:
        ref = json.load(f)
    return ref.get("codes", {}), ref.get("categories_2digit", {})


def _cte_flag_from_share(share: float, n: int) -> str:
    """Bucket the CTE share into a quick-read flag for the UI:
       all (≥0.95) / most (≥0.6) / mixed (≥0.05) / none (<0.05).
    n is the discipline's total M-IDs — if 0, we return 'none' to avoid
    a divide-by-zero result."""
    if n == 0:
        return "none"
    if share >= 0.95:
        return "all"
    if share >= 0.6:
        return "most"
    if share >= 0.05:
        return "mixed"
    return "none"


def main():
    with open(COURSES, "r", encoding="utf-8") as f:
        data = json.load(f)
    courses = data["courses"]
    with open(SINGLETONS, "r", encoding="utf-8") as f:
        singletons = json.load(f)["courses"]
    top_codes_ref, top_cats_ref = _load_top_ref()

    # Per-discipline SUBJ4 distribution across all M-ID rows (minted + singletons).
    # Both files share the M-ID id family and need one canonical SUBJ4 per
    # discipline; walking only minted misses singleton-only disciplines.
    # Also collect TOP code distribution + CTE flag per row, so each discipline
    # entry carries summary aggregates the Common Subject Code tab can render.
    per_disc_subj4 = defaultdict(Counter)
    per_disc_topcode = defaultdict(Counter)       # discipline -> Counter of 6-digit TOP codes
    per_disc_top4digit = defaultdict(Counter)     # discipline -> Counter of 4-digit TOP prefixes
    per_disc_cte_counts = defaultdict(lambda: {"cte": 0, "non_cte": 0, "unknown": 0})

    def _ingest(rec, src):
        if src == "minted" and rec.get("id_system") != "M-ID":
            return
        d = rec.get("discipline")
        s4 = rec.get("subject_4letter") or ""
        if not d:
            return
        if s4:
            per_disc_subj4[d][s4] += 1
        top = (rec.get("top_code") or "").strip()
        if top:
            per_disc_topcode[d][top] += 1
            per_disc_top4digit[d][top.split(".")[0]] += 1
        cte = rec.get("cte")
        if cte is True:
            per_disc_cte_counts[d]["cte"] += 1
        elif cte is False:
            per_disc_cte_counts[d]["non_cte"] += 1
        else:
            per_disc_cte_counts[d]["unknown"] += 1

    for rec in courses.values():
        _ingest(rec, "minted")
    for rec in singletons.values():
        _ingest(rec, "singleton")

    # Preserve curator-reviewed entries from an existing seed file so re-running
    # this generator after the canonical map has been edited doesn't wipe human
    # work. A "curator-touched" entry is one whose reviewed_at OR validated_at
    # is non-null (both stages count as work to preserve).
    existing_reviewed = {}
    if os.path.exists(OUT):
        try:
            with open(OUT, "r", encoding="utf-8") as f:
                prev = json.load(f)
            for d, e in (prev.get("disciplines") or {}).items():
                if (e or {}).get("reviewed_at") or (e or {}).get("validated_at"):
                    existing_reviewed[d] = e
        except (OSError, json.JSONDecodeError):
            pass

    today = date.today().isoformat()
    disciplines = {}
    for d, cnt in per_disc_subj4.items():
        items = sorted(cnt.items(), key=lambda kv: (-kv[1], kv[0]))
        data_modal = items[0][0]
        total = sum(cnt.values())
        modal_is_4 = bool(SUBJ4_RE.match(data_modal))
        # When the data-modal is itself 4 letters AND comprises a strong
        # majority, default canonical = data-modal and pre-mark reviewed (still
        # editable by a curator). Otherwise the canonical is blank and the
        # entry needs explicit curator action.
        modal_share = items[0][1] / total
        seed_default = modal_is_4 and modal_share >= 0.6 and len(cnt) >= 1
        canonical = data_modal if seed_default else None
        source = "data_modal" if seed_default else None
        needs_review = not seed_default
        # Variants_observed: frozen at seed time so re-runs of _apply (after
        # curator edits) can sanity-check that the underlying data hasn't
        # drifted in a way that invalidates the curator's choice.
        variants = {s: n for s, n in items}

        # TOP / CTE aggregates. Modal 6-digit TOP code wins; pull its 4-digit
        # prefix + 2-digit category for grouping in the UI. CTE share is the
        # fraction of M-IDs in the discipline with cte=true (among those with
        # a known cte flag — unknowns are excluded from the denominator so a
        # legacy TOP code doesn't dilute the picture).
        top_items = sorted(per_disc_topcode[d].items(), key=lambda kv: (-kv[1], kv[0]))
        top_modal_6d = top_items[0][0] if top_items else None
        top4_items = sorted(per_disc_top4digit[d].items(), key=lambda kv: (-kv[1], kv[0]))
        top_modal_4d = top4_items[0][0] if top4_items else None
        top_cat_2d = top_modal_4d[:2] if top_modal_4d else None
        top_cat_title = (top_cats_ref.get(top_cat_2d) or {}).get("title") if top_cat_2d else None
        top_modal_title = (top_codes_ref.get(top_modal_6d) or {}).get("title") if top_modal_6d else None

        cte_buckets = per_disc_cte_counts[d]
        cte_known = cte_buckets["cte"] + cte_buckets["non_cte"]
        cte_share = (cte_buckets["cte"] / cte_known) if cte_known else 0.0
        cte_flag = _cte_flag_from_share(cte_share, cte_known)

        entry = {
            "canonical_subj4": canonical,
            "source": source,
            "data_modal": data_modal,
            "data_modal_is_4letter": modal_is_4,
            "data_modal_share": round(modal_share, 3),
            "variants_observed": variants,
            "total_mids": total,
            # TOP / category aggregates (per the 2023 CCC Taxonomy of Programs Manual)
            "top_modal_6digit": top_modal_6d,
            "top_modal_4digit": top_modal_4d,
            "top_modal_title": top_modal_title,
            "top_category_2digit": top_cat_2d,
            "top_category_title": top_cat_title,
            # CTE designation derived from M-ID-level cte flags
            "cte_share": round(cte_share, 3),
            "cte_flag": cte_flag,
            "cte_known_n": cte_known,
            "cte_unknown_n": cte_buckets["unknown"],
            # CIP placeholder — CCCCO is moving from TOP to CIP; field reserved
            # so the dashboard can carry it once the mapping is finalized.
            "cip_code": None,
            # Curation state
            "needs_review": needs_review,
            "reviewed_at": None,
            "reviewed_by": None,
            "validated_at": None,
            "validated_by": None,
            "_notes": None,
        }
        # Curator decisions win: preserve all curator-owned fields from the
        # existing file, but refresh the data-driven fields (variants_observed,
        # total_mids, TOP/CTE aggregates, etc.) so the audit trail reflects
        # the latest snapshot.
        prev = existing_reviewed.get(d)
        if prev:
            for k in ("canonical_subj4", "source", "_notes",
                       "reviewed_at", "reviewed_by",
                       "validated_at", "validated_by"):
                if k in prev:
                    entry[k] = prev[k]
            if prev.get("canonical_subj4"):
                entry["needs_review"] = False
        disciplines[d] = entry

    needs_review_count = sum(1 for e in disciplines.values() if e["needs_review"])
    multi_subj4 = sum(1 for d, cnt in per_disc_subj4.items() if len(cnt) > 1)

    out = {
        "_about": ("Curator-confirmed canonical SUBJ4 per M-ID discipline. Consumed by "
                   "the Phase 1e re-mint (kb/_subj4_dryrun.py / kb/_subj4_apply.py) "
                   "to fold same-discipline SUBJ4 variants. Every canonical_subj4 "
                   "MUST be exactly 4 letters [A-Z]{4}. Seeded from data-modal where "
                   "the modal is 4 letters and comprises ≥60% of the discipline's "
                   "M-IDs; otherwise blank pending curator review. Edited via the "
                   "Canonical SUBJ4 tab (Supabase kb_curation, course_id namespace "
                   "'_CANON_SUBJ4::<discipline>'); kb/_apply_canonical_subj4.py "
                   "folds Supabase edits back into this file."),
        "_seeded_at": today,
        "_seeded_by": "kb/_seed_canonical_subj4.py",
        "_invariant": "every canonical_subj4 must match ^[A-Z]{4}$",
        "_counts": {
            "total_disciplines": len(disciplines),
            "multi_subj4_disciplines": multi_subj4,
            "needs_review": needs_review_count,
            "seeded_default": len(disciplines) - needs_review_count,
        },
        "disciplines": dict(sorted(disciplines.items())),
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"wrote {OUT}")
    print(f"  total disciplines:          {len(disciplines)}")
    print(f"  with multi-SUBJ4 spread:    {multi_subj4}")
    print(f"  pre-seeded (data_modal):    {len(disciplines) - needs_review_count}")
    print(f"  needs curator review:       {needs_review_count}")


if __name__ == "__main__":
    main()

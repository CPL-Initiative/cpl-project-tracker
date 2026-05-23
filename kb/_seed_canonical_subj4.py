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
OUT = os.path.join(HERE, "discipline_canonical_subj4.json")
SUBJ4_RE = re.compile(r"^[A-Z]{4}$")


def main():
    with open(COURSES, "r", encoding="utf-8") as f:
        data = json.load(f)
    courses = data["courses"]
    with open(SINGLETONS, "r", encoding="utf-8") as f:
        singletons = json.load(f)["courses"]

    # Per-discipline SUBJ4 distribution across all M-ID rows (minted + singletons).
    # Both files share the M-ID id family and need one canonical SUBJ4 per
    # discipline; walking only minted misses singleton-only disciplines.
    per_disc = defaultdict(Counter)
    for rec in courses.values():
        if rec.get("id_system") != "M-ID":
            continue
        d = rec.get("discipline")
        s4 = rec.get("subject_4letter") or ""
        if not d or not s4:
            continue
        per_disc[d][s4] += 1
    for rec in singletons.values():
        # singletons file has no id_system field; every row is an M-ID by construction.
        d = rec.get("discipline")
        s4 = rec.get("subject_4letter") or ""
        if not d or not s4:
            continue
        per_disc[d][s4] += 1

    # Preserve curator-reviewed entries from an existing seed file so re-running
    # this generator after the canonical map has been edited doesn't wipe human
    # work. A "reviewed" entry is one whose reviewed_at is non-null.
    existing_reviewed = {}
    if os.path.exists(OUT):
        try:
            with open(OUT, "r", encoding="utf-8") as f:
                prev = json.load(f)
            for d, e in (prev.get("disciplines") or {}).items():
                if (e or {}).get("reviewed_at"):
                    existing_reviewed[d] = e
        except (OSError, json.JSONDecodeError):
            pass

    today = date.today().isoformat()
    disciplines = {}
    for d, cnt in per_disc.items():
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
        entry = {
            "canonical_subj4": canonical,
            "source": source,
            "data_modal": data_modal,
            "data_modal_is_4letter": modal_is_4,
            "data_modal_share": round(modal_share, 3),
            "variants_observed": variants,
            "total_mids": total,
            "needs_review": needs_review,
            "reviewed_at": None,
            "reviewed_by": None,
            "_notes": None,
        }
        # Curator decisions win: preserve canonical_subj4 / source / _notes /
        # reviewed_{at,by} from the existing file, but refresh the data-driven
        # fields (variants_observed, total_mids, data_modal, etc.) so the audit
        # trail reflects the latest snapshot.
        prev = existing_reviewed.get(d)
        if prev:
            for k in ("canonical_subj4", "source", "_notes", "reviewed_at", "reviewed_by"):
                if k in prev:
                    entry[k] = prev[k]
            if prev.get("canonical_subj4"):
                entry["needs_review"] = False
        disciplines[d] = entry

    needs_review_count = sum(1 for e in disciplines.values() if e["needs_review"])
    multi_subj4 = sum(1 for d, cnt in per_disc.items() if len(cnt) > 1)

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

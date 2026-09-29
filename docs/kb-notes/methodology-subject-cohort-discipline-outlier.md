---
title: "Detecting mis-disciplined minted identities via subject-code cohort outliers + a two-signals-agree gate"
created: 2026-07-13
kb-status: published
tags: [methodology, discipline, auditor, mis-mint, curation, ccr]
artifacts:
  - kb/_row_audit.py (_classify_subject_discipline_outlier, _build_subject_disc_dist)
  - tests/row_audit_subject_outlier_test.py
  - kb/mismint_out/2026-07-13/
related:
  - "[[docs/subject_discipline_cleanup_lessons]]"
  - "[[CLAUDE]]"
---

# Subject-code cohort outliers catch mis-disciplined mints

> **One-sentence summary** — a minted identity is probably mis-disciplined when
> its discipline is a small minority of its local subject-code cohort **and** a
> second independent signal (TOP code or a subject→discipline lexicon) endorses
> the same cohort-implied correction; the two-signals-agree gate is what makes
> the flag trustworthy and covers singletons that corroboration-gated rules miss.

## Context

Title-keyword discipline inference mislabels a course when a word in its title
names a **different** field than the course actually belongs to. Worked example:
a diesel course titled "Heavy Duty Heating, Ventilation, and Air Conditioning
(HVAC)" was minted into an **HVAC** discipline because "HVAC" appears in the
title — even though its local subject code (`DIESLTK`) and TOP code (`0947.00`,
Diesel) both say otherwise. Rules that require ≥2 corroborating members (e.g.
`top_discipline_disagreement`) skip **single-member** identities, which is
exactly where this error class concentrates. Discovered Session 113; see
[`docs/subject_discipline_cleanup_lessons.md`](../subject_discipline_cleanup_lessons.md).

## The claim

Detect the error with a **cohort + corroboration** shape:

1. **Build each local subject code's discipline distribution** across all minted
   rows. Use the **effective** (curated-overlay) discipline, so a curator's fix
   reshapes the cohort and is never re-flagged.
2. **Flag a row** when its assigned discipline is a small minority (**≤15%,
   ≤3 rows**) of a cohort (**≥4 rows**) that has a **dominant (≥40%),
   different, non-sister-pair** discipline. The cohort's modal discipline is
   the `suggested_fix`.
3. **Require an independent second signal** — the row's **TOP code** *or* the
   curated **subject→discipline lexicon** — to corroborate the **same**
   cohort-modal correction (not merely disagree with the assigned one). This
   two-signals-agree bar is the safety gate.
4. **Skip curator-set rows.** A human decision is ground truth, not an outlier.

The same shape serves two jobs: **correcting** mis-mints (assigned ≠ cohort
modal, second signal agrees) and **seeding** blank disciplines (assign the
cohort modal **only** when a second signal agrees).

## How we got here

Shipped as the `subject_discipline_outlier` rule in `kb/_row_audit.py`
(Session 113, PR #761): ~302 live flags, penalty 0.20, each with a
`suggested_fix`. The rule runs over **both** clusters (via `_tags_for_mid`)
**and** a dedicated **singleton** pass — Phase 1a is otherwise cluster-only, but
singletons are where this class lives. The 42 tightest candidates were curated
into Supabase under a dedicated reviewer with an INSERT-only receipt
(`kb/mismint_out/2026-07-13/`).

## When this applies (and when it doesn't)

- **Why two signals, and the false positives it prevents:**
  - **Cohort-only mislabels wellness-under-a-dance-code.** `DANCFOLK`'s cohort
    modal was "Dance," but its member titles are wellness ("Mind Body Health",
    "Wealth & Wellness"). A code-only or cohort-only seed would stamp Dance;
    requiring TOP/lexicon agreement on the **same** target rejects it.
  - **Close-MQ-sibling conflicts get dropped.** `MCOM`'s blank rows *imply*
    "Mass Communication," but its existing disciplined rows are Broadcasting
    Technology / Journalism — a near-sibling disagreement, not a clean modal.
    Dropped.
  - **Ambiguous subject codes are the reason for the bar.** `OT` = Office
    Technology vs Occupational Therapy: the cohort might be dominated by one
    while the row is legitimately the other. Only a second signal endorsing the
    cohort's target promotes the flag.
- **Sister-pair disciplines** (curated near-synonyms) must be excluded from the
  "different discipline" test, or the rule fires on harmless naming variants.
- **Complements, doesn't replace, `top_discipline_disagreement`** — that rule
  covers multi-member clusters with strong TOP corroboration; this one covers
  the **singletons** it skips, and adds the lexicon as a second corroborator.
- Not a bulk auto-apply tool. The flags are curation candidates; apply only the
  tightest (two strong signals) under the Rule-9 write discipline, human-review
  the rest.

## See also

- `[[docs/subject_discipline_cleanup_lessons]]` — the workstream that produced this
- `kb/_row_audit.py` — `_classify_subject_discipline_outlier`, `_build_subject_disc_dist`
- `tests/row_audit_subject_outlier_test.py` — pins the detector's thresholds + gate
- `kb/mismint_out/2026-07-13/` — the first applied batch's receipt
- PRs `#761` (detector + apply), `#762` (triage-tab wiring), `#763` (blank pre-seed)

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*

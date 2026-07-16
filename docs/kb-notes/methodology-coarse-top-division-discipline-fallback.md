---
title: Coarse TOP-division discipline fallback — make the orphan tail visible without faking precision
created: 2026-06-09
updated: 2026-06-09
tags: [methodology, discipline-inference, top-code, csr, curation, data-pipeline]
kb-status: published
kb-type: methodology
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[reference-cpl-eligibility-and-exhibit-cr-catalog]]"
artifacts:
  - kb/_infer_disciplines_from_top_division.py
  - kb/top_division_discipline_map.json
  - kb/_verify_top_division_inference.py
---

# Coarse TOP-division discipline fallback

> **One-sentence summary** — When the precise discipline-inference passes leave a
> long tail blank because the courses' TOP codes are the catch-all buckets those
> passes *deliberately* skip, fill them with the **2-digit TOP division's** broad
> umbrella discipline at a distinct **low, flagged** confidence tier — honest but
> coarse, reversible, and refineable — rather than either faking 6-digit precision
> or leaving the tail invisible.

## The problem it solves

The discipline-grain **Common Subjects Reference (CSR)** shows one row per MQ
discipline; a course with **no discipline attaches to no row**, so it's invisible
there. The precise passes (`subject_map` / `title_keyword` / `description` /
`top_code`) had left ~7.2k single-college courses blank — and **0** of them were
fixable by re-running, because their 6-digit TOP codes are exactly the
`*99.00 Other` / `* General` / `4930.xx` Interdisciplinary catch-alls that
`top_discipline_map.json` **omits on purpose** (mapping them precisely is
impossible; a 6-digit "Other" code names no discipline).

## The lever: the 2-digit division is the granularity that *is* knowable

Every MAP TOP code's first two digits maps to a **CCC division** whose *label* is
well-defined (`TOP_Code_Lookup.xlsx` → `CCC Discipline Code`/`Title`) — note it's
the label that's stable, not the guarantee the course was assigned the right code
(TOP is faculty-entered without a gatekeeper; see
[[methodology-top-is-a-last-in-line-signal]]). A division maps to a
broad-but-honest umbrella discipline: `49`→Interdisciplinary Studies, `12`→Health,
`09`→Industrial Technology, `05`→Business, `15`→Humanities, … A division-level fill
is **coarse-but-plausible** (a 09xx code *suggests* industrial technology) and
still low-confidence (0.4, blanks-only, reviewer-verifiable) — welding and drafting
both land in Industrial Technology.

## The rules that keep it honest

1. **A distinct, lowest confidence tier.** `discipline_source="top_division"`,
   confidence **0.4** (below the 0.5 `top_code` tier), its own `⚙ TOP-div` badge +
   "by TOP division" Generated-by filter, and added to the bulk-verify "risky"
   set. A reviewer can find *exactly* these fills and refine them — they never
   masquerade as precise.
2. **Only map divisions with a defensible, MQ-verified umbrella; skip the rest.**
   Media & Communications, Fine/Applied Arts, and Commercial Services have **no**
   single honest umbrella in the MQ vocabulary (they fragment into Journalism vs
   Multimedia, Theater vs Graphic Arts, Cosmetology vs Culinary). Those stay
   **blank** — a wrong lump is worse than a blank. (Here: 19 divisions mapped,
   5 skipped, ~580 honestly-blank residual.)
3. **The pass aborts if any map target isn't a real MQ discipline** — a typo can't
   silently corrupt the fill. (`kb/_verify_top_division_inference.py` guards this.)
4. **Idempotent, blank-only, skip reviewed/curated** — same contract as every
   sibling inference pass. Re-running fills 0.

## Two consequences to expect and document

- **It relaxes a documented guardrail.** The "leave catch-alls blank so they don't
  get a misleading lump-discipline" rule was deliberate. Relaxing it is a curator
  call (here: Sam, "whole tail please") — make the relaxation **loud and reversible**
  (delete a map row + re-run; or Verify/override in the tab), not silent.
- **It can re-trip a downstream cleanliness invariant.** Assigning a discipline
  *without* re-keying the course's synthetic SUBJ4 to that discipline's canonical
  re-introduced `subject_collision_signal` (0→1,091 in the auditor). That's
  **expected and honest** — the coarse fills are new candidates for a future
  canonical-SUBJ4 fold; you canonicalize SUBJ4 *after* a curator confirms the
  (coarse) discipline, not before. Don't "fix" it by force-re-keying a low-confidence
  guess.

## The wiring checklist (so the fill actually surfaces)

- New `discipline_source` value → add it to **both** the producer (it passes
  through `_add_prov` automatically) **and** the consumer `unified_courses.js`
  (badge label, tooltip, the `state.prov`→enum map in *two* places, the filter
  option list, the risky-set) **and** the auditor `kb/_row_audit.py`
  `_classify_mid_discipline` (or it falls through to a **`seed-untouched`
  mislabel** — the gotcha that bit here).
- **Re-seed the CSR**: `python3 kb/_seed_canonical_subj4.py` after the fill — the
  daily cron applies Supabase overlays but does **not** re-seed, so newly-disciplined
  courses won't reach the CSR's discipline/variant rows until you re-seed.

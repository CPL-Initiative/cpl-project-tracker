---
title: "Dethroning TOP — from gatekeeper to last-in-line signal (lessons)"
date: 2026-07-16
tags: [lessons, top-code, discipline, subj4, identity, data-quality, auditor, cip, starboard]
artifacts:
  - kb/_top_gate.py
  - kb/_top_fold_gate_dryrun.py
  - kb/_seed_canonical_subj4.py
  - kb/_row_audit.py
  - docs/kb-notes/methodology-top-is-a-last-in-line-signal.md
related:
  - "[[methodology-top-is-a-last-in-line-signal]]"
  - "[[methodology-subject-cohort-discipline-outlier]]"
  - "[[cip_crosswalk_lessons]]"
---

# Dethroning TOP — from gatekeeper to last-in-line signal

Workstream scratchpad. StarBoard side-lane (2026-07-16), commissioned by Sam:
*"unburden our schema from the tyranny of TOP … TOP is notoriously unreliable
because the codes are assigned in COCI by faculty … no reliable gatekeeper at
time of data entry … it should not be used for gatekeeping or primary
determinations. It serves as a last-in-line signal that can nudge edge-case
courses into one discipline or SUBJ4 … helpful for searches and quick filtering
but only fuzzily."*

## 2026-07-16 — the audit + the two-PR remediation

### What we learned

- **The doctrine was already ~80% built.** A confidence/source ladder exists
  (`discipline_source` + `discipline_confidence`); TOP fills are blanks-only,
  never override curation, and are weighted **0.10** in the trust score. The
  gap was **wording + two real leaks**, not a teardown.
- **The blast radius is 24%.** 17,059 of 71,076 disciplined rows reach their
  `discipline` via a TOP guess (10,392 `top_code` @ 0.5 + 6,667 `top_division`
  @ 0.4). That's how much of the identity layer stood on the least reliable
  signal.
- **The real leak was laundering into IDENTITY.** `_seed_canonical_subj4.py`
  computed each discipline's canonical SUBJ4 by modal vote across *all* rows
  carrying that discipline — **without reading `discipline_source`.** So a
  0.4–0.5 TOP guess both voted on, and was folded into, the M-ID SUBJ4 identity
  key. The provenance was recorded upstream and dropped at the identity step.
- **The auditor over-trusted TOP.** `_row_audit.py` scored a `top_code`-sourced
  discipline `inferred-high (0.80)` — the same tier as the curator-anchored
  `subject_map`, above title/description.
- **PARA is a cautionary tale for the parallel Miramar lane** — "verify before
  you recommend": PARA looked like a missing "Paramedic" feeder but is
  **Paralegal** (TOP 1402). Checking the data before recommending saved a bad
  call. (Same instinct that motivated this whole workstream.)

### The headline finding (why the fix is safe)

Re-running the gated seed changed **0 of 146 canonical SUBJ4 values.** The
corroborated rows (`subject_map` / title / curator) already carried every
discipline's anchor — **TOP's 17,059 votes were redundant.** So gating TOP out
of the identity vote is provably non-disruptive; its value is (a) preventing
*future* TOP-vote pollution and (b) making TOP-dependency visible. Of the 146
disciplines, **130 keep a corroborated anchor**; **16 rest entirely on TOP**
(Industrial Technology 852, Family & Consumer 493, Social Science 296, …) — all
16 already carry a **curator-picked** SUBJ4, now flagged `top_only:true`.

### What shipped (both merged)

- **PR A (#799)** — doctrine + trust-score. New anchor KB note
  `methodology-top-is-a-last-in-line-signal.md`; a standing TOP caveat in
  `CLAUDE.md §7`; ~8 prose passages softened from "authoritative/pins/genuinely
  is/~100%" → corroborator language; `_row_audit.py` TOP demoted
  `inferred-high`→`inferred-low`; `merge_flag` relabeled a low-confidence
  single-signal hint; fixed the `_overmerge_apply.py` hardcoded `"top_code"`
  source mislabel. Test `row_audit_top_source_score_test.py` (8/8).
- **PR B (#800)** — the identity gate (Sam's "gate identity, keep display"
  ruling). New shared predicate `kb/_top_gate.py`
  (`discipline_is_corroborated`); `_seed_canonical_subj4.py` excludes TOP-sourced
  rows from the canonical-SUBJ4 vote + adds `top_only`/`corroborated_voters`
  fields; read-only dry-run `kb/_top_fold_gate_dryrun.py` + receipt
  `kb/top_gate_out/2026-07-16/`. Test `top_gate_test.py` (13/13). The curated
  identity map was **not** regenerated (Rule 9 curator-gated).

### Strategic roadmap

1. **Fold/re-key enforcement (the second half of the ruling).** Apply scripts
   (`_subj4_apply.py`, `_apply_canonical_subj4.py`, `_overmerge_apply.py`, the
   convergence applies) should skip a row where `not
   discipline_is_corroborated(rec)`, so a TOP-only row waits un-folded until
   corroborated. The predicate is built; wiring it in is a **dry-run-first,
   dispatched apply per Rule 7** — not a casual re-key. Low urgency (the gate
   already showed 0 value changes; the risk is future automated folds).
2. **`excel_to_dashboard.py` TOP→discipline fallback label** (EACR statewide
   card, ~L4626) — the audit's lowest-severity item: a *fallback* label with an
   arbitrary alphabetical-first tie-break. Use the modal TOP + a low-confidence
   label. Small; not yet done.
3. **Public KB caveat (curation-gated).** `cpl-knowledge-base` is clean; one
   optional enhancement — append to `playbooks/map-exhibit-analysis.md` (L29/L62)
   that TOP-match surfaces *candidates for faculty validation*, and that TOP→CIP
   transitions this fall. Route through `CURATION.md`, never a checkpoint.
4. **CIP is the systemic exit.** Fall-2026 TOP→CIP cutover (SkyLoft's crosswalk
   lane). Apply the same "corroborate, don't gate" posture to CIP until it earns
   trust — TOP→CIP is one-to-many (~9% 1:1), so CIP won't be a clean key either.

### Next concrete step

Return to the **parked Miramar comparison** (the AskUserQuestion fork on how to
present CPL magnitude on the pathway card — units are inflated by
mutually-exclusive academies), then, if desired, item 1 (fold enforcement) or
item 2 (excel fallback).

### Method notes that worked

- **4 parallel read-only audit agents** (identity machinery · pathways/CCR ·
  tracker doctrine · CPLBrain+KB) built the classified inventory fast; I verified
  the crux (provenance-respect + the 24% laundering) myself in parallel.
- **Measure before touching identity** (Rule 7): the read-only dry-run's
  "0 canonical values changed" is what made PR B safe to ship without a re-key.
- Side-lane discipline: left `cpl_todos.json` + the numbered
  `session_<N>_handoff.md` to the CCR mainline (StarMarcus, #118).

---
title: Methodology — Umbrella-discipline SUBJ4 split (when one MQ discipline holds many subjects)
created: 2026-06-09
updated: 2026-06-09
tags: [methodology, remint, rule-7, subj4, foreign-languages, mq-disciplines, kb]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/fl_subj4_remint_scope]]"
  - "[[docs/ccr_cluster_cleanup_lessons]]"
artifacts:
  - kb/foreign_language_subj4.json
  - kb/_apply_fl_subj4_remint.py
  - kb/_row_audit.py
---

# Methodology — Umbrella-discipline SUBJ4 split

> **One-sentence summary** — when the authoritative MQ discipline is *coarser* than
> the subject a student actually enrolls in (one MQ discipline = many subjects),
> split the SUBJ4 per subject while the **discipline stays the MQ value** — the
> Rule-7 invariant "one discipline → one SUBJ4" refines to "one **SUBJECT** → one
> SUBJ4," not breaks.

## Context

The MQ discipline vocabulary (`kb/reference/mq_disciplines.json`) is authoritative
and we can't invent disciplines. But it has umbrella entries: **"Foreign
Languages"** with no Spanish/French/etc. The Rule-7 structural invariant forces all
M-IDs of one discipline into one SUBJ4, so every language collapsed into `FLNG` — a
jumble that made consolidation impossible (the CCR impact columns surfaced it via
the `SPAN 100`/`FLNG M1019`/`FLNG M1272` "Elementary Spanish I" collision). Session
37 split it (`docs/fl_subj4_remint_scope.md`).

## The claim

**SUBJ4 tracks the SUBJECT a student enrolls in; the discipline tracks the MQ
category.** They coincide for ~every discipline; an *umbrella* discipline (a parent
over many distinct subjects) is the exception and earns **per-subject SUBJ4s**. Four
parts make the split clean + safe:

1. **The discipline does NOT change.** Only the SUBJ4 (and id) re-keys. The MQ value
   stays authoritative. (V-gate: discipline unchanged per identity.)
2. **Re-prefix, don't re-sequence.** If the old ids are already globally unique
   (`FLNG M1019` is unique), just swap the 4-letter prefix and **keep the number**
   (`FLNG M1019 → FLSP M1019`). Collision-free (the new prefixes didn't exist; the
   numbers were already unique), and it dodges the whole deterministic-renumbering
   risk surface. No re-sequence needed.
3. **Classify from a self-describing code where one genuinely exists (a rare
   exception).** The CCC **TOP-11xx taxonomy labels the language** in the code
   *title itself* (`"1105.00: Spanish"`) — an unusually self-describing
   sub-taxonomy, so here TOP → language reached **99.5%**, *confirmed* by title +
   local-subject (two corroborating signals, not TOP alone). This is a special
   case, not license to classify from TOP generally — everywhere else TOP is a
   last-in-line corroborator only (see [[methodology-top-is-a-last-in-line-signal]]).
4. **Exempt the umbrella in the auditor.** `subject_collision_signal` (which flags a
   discipline spanning >1 SUBJ4) will fire ~N false findings post-split. Add an
   `UMBRELLA_DISCIPLINES` set and skip it in the per-discipline-modal-SUBJ4 builder,
   so it gets no modal → the rule can't fire. Keeps the 0-count *honest* (the
   umbrella is *supposed* to span many SUBJ4s), not by mis-sharing a SUBJ4.

## How we got here

Sam's call (2026-06-09): "separate these in the CSR table to FLSP, FLFR…." Dry-run
(`kb/_fl_subj4_dryrun.py`) classified 1,452 FL identities to 17 languages at 99.5%
via the TOP taxonomy; the apply (`kb/_apply_fl_subj4_remint.py`, V1–V4 green)
re-prefixed them + re-keyed 115 articulations; `subject_collision_signal` verified 0
post-apply via the `UMBRELLA_DISCIPLINES` exemption. `discipline_canonical_subj4.json`
("the CSR data") now models "Foreign Languages" as an umbrella with the per-language
set.

## When this applies (and when it doesn't)

- **Applies** when an MQ discipline is genuinely a *parent over distinct subjects a
  student picks between* (you enroll in Spanish OR French). Foreign Languages is the
  lone umbrella found; re-evaluate if another emerges.
- **Does NOT apply** to a discipline that's just *broad* (Biological Sciences spans
  Marine Bio/Microbiology but they share BIOL fine — sub-areas, not distinct
  enrollment subjects), nor to single-subject MQ disciplines that merely have many
  *local-code variants* (ASL → many local codes but ONE SUBJ4 `SLNA` — that's the
  *opposite*, a collapse, handled by `subject_collision_signal` normally).
- **Re-prefix-keep-the-number only works** when the old ids are already globally
  unique; if not, you need the deterministic per-(SUBJ4,band) re-sequence (§10).

## See also

- `[[docs/fl_subj4_remint_scope]]` — the full scope + dry-run
- `[[docs/coursecontrolnumber_remint]]` — the re-mint playbook
- PRs `#327` (scope+dry-run) / `#328` (apply) · CLAUDE.md Rule 7 structural invariants

---

*Authoring check: durable (the umbrella pattern recurs for any coarse-MQ subject),
reusable (any SUBJ4 re-mint / peer system), distilled (one concept: SUBJ4 = subject,
discipline = MQ category), self-contained.*

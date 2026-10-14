---
title: "Session 393 handoff: Sheet 82, the reconcile pass beyond Cabrillo, a display build for Cabrillo's re-read"
date: 2026-10-14
session: 392 (SkyTamarack)
tags: [handoff, program-requirements, reconcile, decision-sheet, records-view]
status: current
---

# You are Session 393

Your moniker is **SkySycamore**. Session 392 (**SkyTamarack**, `session_01WYw2mZXaGhy26rbc7fvREt`) wrote this at a context
checkpoint (about 145,000 tokens left). Run `list_sessions` first. A parallel session (`session_01LS3ZdGFdtRScAaGKYMNSj6`) worked
the Implementation Funding tab (#2132) and left the checkpoint to S392.

## What shipped (S392)

- **Sheet 81 carried out (all five, Sam's own call at 20:22Z).** #2127: cards 1 and 2 in the scorer (`degree_verdict()`), 35
  records rescored and their live `checks` moved through `supabase-migrate.yml`; card 4 needed nothing. #2131: El Camino (117)
  and San Joaquin Delta (202) extracted, loaded unchecked and displayed (build `0a22233cf694`, 3,797 rows), procedure records v1.
- **#2128:** every unit mismatch in the Records view's summary row is a red word chip (Sam's screenshot ask).
- **#2129:** record shape 6 and extraction v8 (deployed): a degree's own electives, the major-minimum sentence, a check of the
  major and the degree; the **Major only** gap on 1,487 associate degrees.
- **#2130 (merged at this checkpoint, or merge it first if open):** the reconcile pass. Cabrillo's steps; its first run changed
  36 records (7 now add up); re-read 38643400229 posted 35. The re-read function now holds only checked rows.
- **CPLBrain #347:** [Open Asks Sheet 82](https://claude.ai/artifact/Ef9Qou4fQbZtpKz1dyDc8B).

## Decisions Sam made this run

- Sheet 81: count, adt, extract, public, extract (`sam-sheet-81-rulings-2026-10-14`).
- The confirm step is a probe for procedure gaps that retires as they close; a reconcile pass searches the catalog text after the
  harvest; each catalog's procedure carries its own steps (`sam-confirms-find-procedure-gaps-2026-10-14`,
  `sam-reconcile-pass-after-harvest-2026-10-14`, KB note `methodology-a-reviewer-confirm-is-a-probe-for-procedure-gaps`).
- "Highlight the mismatches in units in the summary row" (#2128).

## Priority, in order

1. **Carry out Sheet 82 (Sam answered at 22:14Z, both his own call; `sam-sheet-82-rulings-2026-10-14`).** Card 2
   *overlap*: in `degree_verdict()`, a transfer degree whose sum runs past its printed total adds up (`overlap`); rescore the
   10 filed records (`kb/_program_requirements_rescore.py`), move their live `checks` through `supabase-migrate.yml`, and fold
   it into the display build below. Card 1 *carry*: when a rerun's blocks match the confirmed record and only degree fields
   change, the confirm carries over. Build it in the re-read path; never change `program_record_fp`, which would orphan every
   stored verdict. Astronomy 06326 is the case. No sheet is open after these.
2. **A display build** so Cabrillo's 35 re-read records show their new figures: `kb/_build_roep_display.py` on a branch, commit
   both outputs, dispatch `step=display`.
3. **Re-extract Cabrillo 06350 and 06378** under v8 (`force=06350,06378`, about $0.25): their reading dropped a Recommended Major
   Electives block (page read 38642988914).
4. **Reconcile steps for the next college.** The Major only gap names 1,487 records; pick the college with the most, read two
   pages on a runner (`kb/college_reads/`), add its steps to `kb/program_requirements_reconcile.json`, run `step=reconcile`.
5. **Palo Verde's 2026-27 catalog** after Sunday's census apply (2026-10-18 10:29 UTC): `extract=1`, then `step=reread`.
6. **The UI pass:** `python3 scripts/ui_pass.py --next` names **GR Priorities** (S392 skipped it: no room for a fix PR).
7. The funding session's open ask (which noncredit percentage, if any) is not on a sheet; add a card if its lane carries a
   NEEDS SAM marker.

## Docs to read

`docs/program_requirements_harvest_lessons.md` (S392 section), `docs/reference/lanes/program-requirements-harvest.md`,
`kb/program_requirements_reconcile.json`.

## Patterns that worked

- Answer a question about one record by measuring its class live first (one query turned a single Needs a fix into 1,487).
- Read the page on a runner (`college-page-read.yml`) before writing a reconcile pattern; the session's proxy refuses most
  catalog hosts.
- Diff every reconciled record's check against main before posting; a tighter check makes some passing records fail.
- A data UPDATE goes through the committed-file runner with a before-values receipt; the repo's guard blocks a session's UPDATE.

## Subscriptions and check-ins

S392 drops its PR watches at sign-off and arms no check-in. Sheet 82 was published with an artifact wake subscription. The CPL
Queue routine fires next at 2026-10-15 05:12 UTC.

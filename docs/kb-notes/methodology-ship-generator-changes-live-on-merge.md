---
title: Ship generator changes live-on-merge when the artifact regenerates from committed inputs
created: 2026-06-02
updated: 2026-06-02
tags: [methodology, generator, dashboard, ci, live-on-merge]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/eacr_consolidation_lessons]]"
  - "[[docs/kb-notes/reference-daily-dashboard-data-pipeline]]"
artifacts:
  - excel_to_dashboard.py
  - kb/_build_aligned_exhibits.py
  - kb/_build_cpl_by_discipline.py
---

# Ship generator changes live-on-merge when the artifact regenerates from committed inputs

> **One-sentence summary** — A producer change to a generated dashboard artifact is
> *live on merge* (not next-cron) **iff** every input to that artifact is committed to
> the repo: regenerate locally, commit the result, and the feature ships the moment the
> PR merges (GitHub Pages serves it from `main`).

## Context

The dashboard's generated files split into two classes by their inputs. Knowing which
class an artifact is in tells you whether a producer change ships immediately or has to
wait for the next daily cron (≈10:17 UTC) — which changes how you build, test, and set
expectations on the PR. This surfaced in Session 29: the CER enrichment (#262) touched
`export_credential_reference()` and shipped live-on-merge, while the parallel EACR
asks (#1/#3) are stuck waiting for the cron because `statewide_data.js` needs the raw
MAP pull.

## The claim

**An artifact is "live-on-merge-able" iff all of its inputs are committed.** Then a
producer change ships immediately by regenerating the file locally and committing it.
If *any* input is a non-committed live pull (raw MAP CustomReport, scraped metrics),
you cannot reproduce the file locally → the change only materializes on the next cron.

| Artifact | Inputs | Class |
|---|---|---|
| `credential_reference_data.js` (CER) | `kb/*.json` only (committed) | **live-on-merge** |
| `unified_courses_aligned.js`, `kb/discipline_cpl_rollup.json` | `kb/coci_articulations.json` + minted catalogs (committed) | **live-on-merge** |
| `statewide_data.js` (EACR) | raw MAP exhibit pull (not committed, PII-adjacent) | **next-cron** |
| `CPL_Data.js` / headline KPIs | Excel + `live_metrics.json` (scraped) | **next-cron** |

## How to do it safely

1. **Factor the build behind a callable** (`export_credential_reference()`, a `_write_*`
   helper) so a standalone script and the daily `main()` share one code path → the
   committed file is byte-identical to what the cron will produce.
2. **Regenerate locally**; commit the artifact alongside the producer + consumer in one
   PR. Add it to the daily-workflow `git add` if it's new.
3. **Prove additive/clean** with a structural old-vs-new diff: same row/key set, only
   the new keys added, **0 existing-value changes** (a `_generated_at` timestamp is the
   only allowed delta). This is the proof the PR doesn't silently move other data.
4. **Determinism**: no timestamp → regen is byte-identical → next cron is a no-op diff.
   With a timestamp (CER has `_generated_at`), the cron rewrites one line — harmless.
5. **The daily cron is a mid-flight hazard.** If it regenerates your artifact on `main`
   while the PR is open, the PR flips to `dirty`. Don't hand-merge a minified one-liner:
   rebase onto main, **re-run your producer** to regenerate the file, re-verify
   additive-only vs the *new* main, force-push. (Session 29 #262 hit exactly this.)

## Watch-outs

- **Consumer adapters can drop new fields.** If the consumer normalizes the payload
  through a whitelist (CER's `adaptBakedRow`), new producer fields are silently absent
  at render until added to the adapter too. Grep the consumer for the field before
  assuming it flows through.
- **A consumer-only change is *always* live-on-merge** — no producer/cron question.
  Prefer consumer-side when the data already carries what you need (or can be joined
  from another committed lazy file, e.g. `statewide_prescriptive.js`).

## When it doesn't apply

Next-cron artifacts: build producer + consumer, verify with a standalone join/test on
committed data + a `kb/_verify_*.py`, but expect the visible change only after the cron
(dispatch the workflow to see it sooner). Don't commit a hand-faked version of a
non-reproducible artifact.

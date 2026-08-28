---
title: Minimization happens twice — what you request, and what you keep
created: 2026-08-19
updated: 2026-08-19
tags: [methodology, privacy, pii, data-pipeline, map-api, supabase, minimization]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/map_custom_report_load]]"
  - "[[docs/map_custom_reports_lessons]]"
artifacts:
  - fetch_custom_report.py
  - kb/_sync_map_custom_reports.py
  - tests/map_custom_report_sync_test.py
---

# Minimization happens twice — what you request, and what you keep

> **One-sentence summary** — a pipeline that fetches and then stores has *two*
> independent minimization boundaries, and treating the fetch as the only one
> quietly makes every fetched column a stored column.

## Context

`fetch_custom_report.py` is guarded as "the PII boundary": its minimization is
the *absence* of entries in `REQUEST_PAYLOAD`, and a test pins it. That framing
is right about the file and wrong about the system. A second boundary exists
wherever the fetched data lands, and nothing had ever named it.

## The claim

**The request boundary and the storage boundary are different decisions, made
for different reasons, and each needs its own guard.**

- The **request** boundary answers *what may cross the network into our hands.*
  It is set by what the source will release and what the job plausibly needs.
- The **storage** boundary answers *what we are still holding tomorrow.* It is
  set by what has a consumer.

They are not nested by default — code written without the distinction stores
whatever it fetched, so the request boundary silently becomes the storage
boundary, at its own looser standard.

**Corollaries that make it operational:**

1. **A stored column with no consumer is pure liability.** It cannot produce a
   wrong answer, because nothing reads it; it can only ever leak.
2. **List what you drop, do not merely omit it.** An omission is invisible to
   the next person, who reads the narrower contract as an oversight and widens
   it helpfully. A named `HELD_COLUMNS` map with a reason per entry turns a
   silent gap into a decision someone has to argue with.
3. **A derived-then-discarded identifier is a third option**, and usually the
   right one. You often need an identifier to *compute* something (distinct
   counts, dedupe) without needing to *keep* it. Derive the surrogate, drop the
   identifier, and the stored artifact answers the question without carrying
   the person.
4. **Test the drop, not just the keep.** The failure mode is a held column
   drifting into the stored contract months later, in a change that looks like
   an enrichment.

## How we got here

`View_StudentDetailsCredits_APIDataset` was fetched with 29 columns. The
existing `map_student_credit` had 16. Writing the loader forced the question of
what the other 13 were for, and the answer was: nothing. `Location`, `CPL Mode`,
`CPL Program`, `Program`, `ProgramGoal`, `Transfer Destination` and four credit
splits had no consumer anywhere in the codebase — they were in the payload
because the payload was written to characterise the view, not to feed a table.

`StudentMAPID` is the sharpest case. It is salt-hashed with a stable salt, so
keeping it would have been *defensible* — and the spec we ourselves sent MAP
says why it should not be kept anyway: *"we only ever count distinct students —
we never look one up."* The need is a count, so the loader ranks the distinct
hashes into a dense surrogate and discards the hash. Nothing downstream can tell
the difference, because `student_key` is only ever `count(distinct …)`.

## When this does not apply

When the fetched artifact *is* the stored artifact — a raw archive kept
deliberately for provenance. Then there is one boundary, and it belongs at the
request. Say so explicitly rather than letting it be the default.

## See also

- [`methodology-a-guard-test-must-not-be-able-to-fire-the-guarded-action`](methodology-a-guard-test-must-not-be-able-to-fire-the-guarded-action.md)
- `docs/map_dataset_sql_for_malone.md` — the spec whose stated need decided this

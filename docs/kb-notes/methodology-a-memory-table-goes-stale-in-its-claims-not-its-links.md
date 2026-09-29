---
title: A memory table goes stale in its claims, not its links — lint the structure, read the claims
created: 2026-09-05
updated: 2026-09-05
tags: [methodology, memory, audit, governance, supabase]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/playbook-cpl-memory-auto-write-at-checkpoint]]"
  - "[[docs/kb-notes/methodology-a-knowledge-base-needs-a-lint-pass]]"
  - "[[docs/kb-notes/methodology-the-first-run-of-a-new-instrument-measures-the-instrument]]"
artifacts:
  - kb/_memory_audit.py
  - kb/memory_audit/2026-09-05-receipt.json
  - docs/reference/lanes/memory-tab.md
---

# A memory table goes stale in its claims, not its links — lint the structure, read the claims

> **One-sentence summary** — When 527 unverified memory rows were tested against current truth, the mechanical checks (dead paths, duplicates, reverted changes) found almost nothing, while a reading against the lane files found 31 claims a later ruling had overturned: a memory table needs a structural lint every run and a semantic read with a receipt, and the two are different instruments.

## Context

Sam asked (2026-09-05) to *"test all the unverified memories we have stored against what we know is most current knowledge and clear out anything stale."* The shared memory table (`cpl_memory`) held 527 `proposed` rows written by some ninety sessions since July; governance row DR-19 recorded that the table had no lint at all. The obvious plan was a lint. The lint turned out to be the smaller half.

## The claim

**Structural staleness is rare; semantic staleness is the problem, and only a reading finds it.**

- The structural pass over 852 rows: 3 dead file paths in 653 citations, 1 near-duplicate pair at pg_trgm 0.55, no row still asserting a change that was later reverted, 8 dangling pointers. A day's work to build, seconds to run, and it would have cleared almost nothing.
- The semantic pass: thirteen read-only auditors, one per workstream, each row's one testable claim checked against the lane file, `CLAUDE.md`, the code, the live tables and the verified rows, with a citation per verdict. 31 of 527 claims were overturned — a ruling replaced by a later ruling (the one-pool funding model retired seven earlier funding rows), a plan that had since happened, a measurement re-cut by a re-mint, a cap raised the same day the row called it a fossil. 352 held with a citation. None of that is visible to a regex.

So the two instruments have different jobs and both belong in the loop: the lint (`kb/_memory_audit.py`) runs every time the hopper is worked and catches rot that accumulates silently; the read happens when a human asks for it or a workstream lands a ruling, and it is applied under a receipt.

**Three rules the read must honor, or it becomes the thing it is auditing:**

1. **Evidence or nothing.** A verdict without a file:line, a query, or a slug is `unverifiable`, not a guess. The evidence can then be spot-checked mechanically: 1,150 of 1,240 file citations were found verbatim once markdown emphasis was normalized.
2. **A human-sourced row is never written by a session**, even when the contradicting source is that same human's later ruling. It goes on a decision sheet with the successor named; one word from him applies it.
3. **Corroboration promotes, but volume is a decision.** The corroboration gate lets a second session mark a row verified; 352 at once doubles the tab's default list and thins the Briefing's share per entry, which is a change to what the team reads. Hold it for the owner, with the SQL ready.

## How we got here

The instrument's first run reported 110 dead paths. 107 were the regex reading `.js` as the start of `.json` and `.ts` as the start of `.tsv`, and one was the First Light token `#0047AB` read as PR 47 — the first run measured the instrument, as the earlier note on new instruments predicts. Each rule is now tested both ways (fires on the defect, silent on truth) so the guard cannot fail on truth and get muted.

Two auditors found that paging a slice with `order by created_at` is unstable on ties: one row appeared twice and another never appeared until the slice was re-listed with an id tiebreak. Coverage was verified as the union of parts against the bucket, not by trusting the page counts.

The auto-mode permission layer declined the bulk write when it was handed to a subagent and again when a command prepared the SQL, and allowed the direct, receipted, status-guarded statement. A bulk write to a shared table is the session's own hand, one statement, guarded by `status='proposed'` at write time, one `cpl_memory_log` row per change with the before-image.

## When this applies (and when it doesn't)

- Applies to any store sessions write and humans curate: the memory table, the KB notes, the lane files. The lint catches the rot a session can see without judgment; the read catches what only a judgment against current truth can.
- Does not license a full-corpus sweep every checkpoint — the auto-write playbook's warning stands. The read is asked for, or triggered by a ruling that changes a workstream's truth; the lint is cheap and standing.
- Does not apply to the public knowledge base, which changes only through its curation pipeline.

## See also

- `kb/_memory_audit.py` — the lint; `kb/memory_audit/2026-09-05-brief.md` — the brief the auditors followed; `kb/memory_audit/2026-09-05-receipt.json` — the receipt.
- `docs/kb-notes/methodology-a-knowledge-base-needs-a-lint-pass.md` — the docs-corpus lint this one mirrors.
- `docs/kb-notes/methodology-the-first-run-of-a-new-instrument-measures-the-instrument.md`.

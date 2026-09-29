---
title: Data-write rollback — undoing a bulk write to a shared Supabase table
created: 2026-08-30
tags: [reference, supabase, rollback, curation-safety, rule-10]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
---

# Data-write rollback — undoing a bulk write to a shared Supabase table

PULL-side procedure for `CLAUDE.md` Rule 10 (a2). Read this BEFORE a bulk
write (the receipt you commit is what makes rollback possible) and AGAIN
before rolling one back. Remediation C of the 2026-08-29 matched-pair
findings (`cpl_memory`: `sam-approved-five-doctrine-remediations-2026-08-29`):
`git revert` covers code; **nothing covers data unless the receipt does.**

## The invariant

**Every bulk write must be reversible from its committed receipt alone** — a
session that did not perform the write, reading only the repo, must be able
to undo it. If the receipt you are about to commit does not contain enough
to do that, the write is not ready.

What each write shape requires of its receipt:

| Shape | Receipt must contain | Rollback |
|---|---|---|
| INSERT-only cohort (`ON CONFLICT DO NOTHING`) | the cohort `reviewer_email` (`<lane>-s<N>@bot`), row count, target table | delete (or mark superseded, where the table has a status column) by `reviewer_email` |
| Guarded UPDATE (reviewed plan only) | per-row key + BEFORE-value of every changed column | re-apply the before-images |
| DELETE | sessions do not bulk-delete; a reviewed plan that authorizes one must put FULL row images in the receipt | re-insert the row images |

## The procedure

1. **Fresh live read first — the rollback is itself a bulk write**, so all of
   Rule 10 (a) applies to it: Sam curates live beside sessions, and his rows
   always win, including rows he has touched SINCE the write you are undoing.
2. **Diff live state against the receipt.** Three buckets:
   - rows still exactly as the write left them → roll back;
   - rows changed since the write (curator activity) → **hold them out**, and
     list them for Sam — undoing a row a human has since curated is
     overwriting the curator, the exact failure Rule 10 exists to prevent;
   - rows already gone or already restored → note and skip.
3. **Apply the rollback under its own cohort** (`<lane>-rollback-s<N>@bot`
   pattern) so it is itself attributable and reversible.
4. **Verify counts** — rolled back + held out + skipped must equal the
   receipt's count. A mismatch means the receipt or the diff is wrong; stop
   and reconcile before continuing.
5. **Commit a rollback receipt** beside the original (what was undone, what
   was held out and why, the counts), and land it in one cron window if the
   table feeds the dashboard (`docs/reference/mid_lifecycle.md` has the
   worked atomic-land pattern).

## Boundaries

- **`cpl_memory` rows are never rolled back by delete** — supersede, or file
  a corrected row; a human-sourced row is never silently superseded (Rule 8).
- **MAP is read-only** (system of record) — nothing here applies to it.
- All Supabase access goes through the MCP tools (Rule 10 (c)).
- Worked receipt examples:
  [`playbook-trail-crew-method-magic-audit`](../kb-notes/playbook-trail-crew-method-magic-audit.md).

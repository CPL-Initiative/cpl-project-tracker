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
| Nightly procedure save (INSERT-only, `cer-procedure-<id>@bot`; `kb/_cer_procedures.py --save on`) | the receipt in `kb/cer_procedures_out/saved/` (every row, its cohort, the live rows that held) | `kb/_cer_procedures.py --undo <id>`: one DELETE by that procedure's cohort, receipted; a row the daily fold already carried into `kb/unified_titles.json` carries the cohort as `reviewed_by`, and the fold commit that carried it is reverted |
| Credential fold issuer resolution (INSERT one row per folded target, field `issuer_resolution`, cohort `cred-fold-s638@bot`; `kb/_cred_fold_resolution_write.py`, a step of `cred-rename-apply.yml`) | `kb/cred_rename_out/<fold>/alias_map.json` `resolution_rows` (each value, its fold id) and `resolution_log*.json` (each insert, and the before-value of any earlier cohort row a later fold onto the same target replaced) | `kb/_cred_rename_undo.py <receipt> --apply --supabase-plan`: the JSON undo, `undone.json` (the nightly ignores the fold at once), and SQL that deletes the cohort's rows for that fold and moves the folded rows back, each statement guarded and raising when it matches nothing. No issuer row a person wrote is changed by the fold, so none needs restoring |
| Sierra's ghost rows (DELETE from `chatbox_credentials` of titles `credential_reference_data.js` no longer holds; Sam, Open Asks Sheet 183 card 6; `kb/_chatbox_ghost_delete.py`, `chatbox-ghost-delete.yml`) | `kb/receipts/chatbox_ghost_delete_<UTC>/plan.json`: every ghost's full row, numerics as read; `apply_log.json` (written before the first delete) and `applied.json` (a fresh read after) | `chatbox-ghost-delete.yml` `mode=undo plan_dir=<that directory>`: re-inserts the absent before-rows ON CONFLICT DO NOTHING, so a title the sync re-created stays as the sync wrote it, then files `undone.json` from a fresh read |
| Program display build (PATCH of `program_requirement_records.display` alone; `step=display` of `program-requirements-college.yml`, `kb/_program_requirements_display_apply.py`) | the applied record `kb/receipts/program_requirement_records_display_<date>_<build>.applied_<run>.json` (each planned row's before-build) and, from S680, the receipt itself in the private bucket `cpl-receipts`, named with its size, sha256 and row count in its own file `kb/receipts/index/<receipt name>.json` (`kb/_receipt_store.py`; the apply refuses bytes whose sha256 differs) | for each build in the record's `rollback.reapply`, dispatch `step=display` on the branch holding the record with `force=<that build's receipt name> <the applied record's path>` (for example `force=program_requirement_records_display_2026-11-13_cdd185495ce4.sql.gz kb/receipts/program_requirement_records_display_2026-11-18_<build>.applied_<run>.json`): the runner reads that receipt from the bucket, checks its sha256, and writes it back to those keys only, filing its own applied record. A receipt committed before S680 and not yet stored is re-applied the same way once the move indexes it. Set `display` to null for `to_null` keys by a guarded UPDATE plan. To read a stored receipt from a session, dispatch `step=fetch` with `force=<receipt name>` and run `gh run download <run> -n receipt-<run>`; the runner checks it against the index sha256 first |
| Row audit reports past the newest 14 (a move of committed files to the private bucket `cpl-receipts`, `row_audit/`; `kb/_row_audit_prune.py`, from the daily dashboard and `row-audit-store.yml`) | its entry `kb/receipts/index/row_audit_<date>.md.json` (object, bytes, sha256), written after the read-back matches and before git removes the file | `git revert` of the commit that removed the file brings it back from history; on a runner, `python3 kb/_receipt_store.py fetch row_audit_<date>.md --out kb/row_audit` reads it from the bucket, refused unless its sha256 is the entry's, then rename it to `<date>.md` |

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

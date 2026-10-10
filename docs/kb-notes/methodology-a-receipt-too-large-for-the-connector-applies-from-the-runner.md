---
title: A receipt too large for the connector applies from the runner
created: 2026-10-10
updated: 2026-10-10
tags: [methodology, supabase, data-write, rollback, ci]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[program_requirements_harvest_lessons]]"
  - "[[methodology-rebuild-a-jsonb-from-receipts-and-check-its-md5]]"
  - "[[playbook-deploy-an-edge-function-from-the-runner]]"
artifacts:
  - kb/_program_requirements_display_apply.py
  - .github/workflows/program-requirements-college.yml
  - tests/program_requirements_display_apply_test.py
---

# A receipt too large for the connector applies from the runner

> **When a reviewed data write is megabytes, run it in a dispatch-only job that holds the service key and applies the committed receipt exactly as written, reading each row's prior value first and committing those values as the rollback; prove the result with one combined hash.**

## Context

A session reaches Supabase only through the MCP connector, so every byte of an `apply_migration` is a byte the session writes out. That held for small receipts. The program requirements display receipt grew from 185 KB (22 programs, which already timed out in one migration) to 2.2 MB (Cerritos) and 4.5 MB (Mt. San Antonio added), and every college adds more. Details: [[program_requirements_harvest_lessons]], S356.

## The claim

### Apply the receipt, never a rebuild of it

The receipt is the artifact that was reviewed and that the go was given for. The job parses it and writes what it says, so what lands is what was approved. The parser refuses anything it does not recognize: a line of another shape stops it rather than being skipped, a quote inside a SQL literal is unescaped (`''` is `'`), and every statement must carry the build the page carries.

### Read before you write, and commit what you read

Rule 10(a2) asks that a data write be reversible from its receipt. For a write that replaces values, the before-values are the rollback, so the job reads each row's current value immediately before writing it and commits the set beside the receipt. Here: `<receipt>.applied_<run>.json`, naming which rows go back to null and which go back by an older build's own receipt.

### Write only the column the receipt owns

A PATCH of `display` alone, filtered to one key, leaves every other column and every person's verdict untouched. The table's `BEFORE UPDATE` trigger re-applies the latest verdict from `record` and `checks`, which the write does not change. Check what else fires on the table before trusting this.

### Prove it with one combined hash

A 605-row verify query is 44 KB of SQL, one more megabyte-shaped payload. Instead, compute in the database

```sql
select md5(string_agg(college||'|'||control_number||'|'||md5(display::text), ','
       order by college collate "C", control_number collate "C"))
from program_requirement_records where display is not null;
```

and the same string locally from the receipt's values (serialized the way `jsonb::text` prints, per [[methodology-rebuild-a-jsonb-from-receipts-and-check-its-md5]]). Equal hashes mean every row holds exactly what the receipt prints. `collate "C"` makes both sides sort by bytes.

### Two runner facts that shape the job

- **A workflow file dispatches only once it is on the default branch.** Adding a job to an existing workflow lets it run from a feature branch before merge.
- **A commit the workflow pushes with its own token triggers no CI.** The PR head it creates carries no checks; merge the base or push the next real change on top before waiting on `test`.

## How we got here

S356 (2026-10-10) applied display build `5be53871ebf4` to 292 rows and `153ead0ce992` to 605, each in under ten minutes from the college workflow's `display` job, and both combined hashes matched their receipts exactly. The database has no `pg_net` or `http` extension, so a fetch-and-execute inside Postgres was not available, and enabling one is not a session's decision.

## When this does not apply

A small write (a few statements, kilobytes) is cheaper through `apply_migration` with its receipt. A write to a table the service role cannot update, or one that must run as a person (a reviewer's verdict), belongs to its own security-definer function, not a service-key PATCH.

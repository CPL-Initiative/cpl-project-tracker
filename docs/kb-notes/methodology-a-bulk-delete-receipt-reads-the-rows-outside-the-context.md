---
title: "A bulk delete's receipt reads the rows outside the session's context"
created: 2026-10-23
updated: 2026-10-23
type: methodology
kb-status: published
tags: [methodology, supabase, data-write-rollback, receipts]
related:
  - "[[docs/reference/data_write_rollback]]"
  - "[[docs/program_requirements_harvest_lessons]]"
---

# A bulk delete's receipt reads the rows outside the session's context

**The rule it serves.** A data write must be reversible from its receipt (Rule 10 a2): a delete's
receipt holds every row as it was read live, and the delete is guarded by each row's md5 so a row
anyone touched since the read is left alone.

**The problem.** Seventeen program records (Sheet 115 card 1, 2026-10-23) ran to 779 KB of
`to_jsonb(r)::text`. A session cannot carry that through its context, and a row a model retypes
from its reading is no receipt. The migrate runner records at most 4,000 characters of a response,
so the runner cannot carry the before-values either.

**The method.**

1. Read the rows through the Supabase MCP as `to_jsonb(r)::text` with `md5(to_jsonb(r)::text)`,
   in queries whose answers exceed the tool-result cap. The harness saves such an answer to a file
   and hands the session the path, so the rows never enter the context. A small row lands in the
   context; pair it with a large one.
2. A script parses each saved file, checks `md5(row_text)` against Postgres's `row_md5` for every
   row, and refuses on a mismatch.
3. The same script writes the receipt (`rows` with `row_text` and `row_md5`, the reason per row,
   the rollback as `jsonb_populate_record` over each `row_text`) and the md5-guarded delete, and
   `kb/migrations/.apply` sends the delete through `supabase-migrate.yml`.
4. After the apply, a live count of the keys reads 0, and the runner's receipt carries the count
   removed.

**Worked example.** `kb/receipts/program_requirement_records_older_build_removed_2026-10-23_s456.{json,sql}`,
applied by run 39968114807 (removed 17). Lessons: `docs/program_requirements_harvest_lessons.md` S456.

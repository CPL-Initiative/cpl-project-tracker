---
title: A file generated for a public page carries past the table's read gate
created: 2026-10-11
updated: 2026-10-11
tags: [methodology, privacy, supabase, rls, generated-files, program-requirements]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/program_requirements_harvest_lessons]]"
  - "[[docs/kb-notes/adr-student-detail-aggregate-disclosure-control]]"
artifacts:
  - kb/_build_roep_display.py
  - cpl_pathways_roep_data.js
  - program_requirements.js
---

# A file generated for a public page carries past the table's read gate

> **One-sentence summary.** A builder that reads a table with the service role and writes a file for a public page
> publishes everything it read, whatever the table's own policy lets the public see, so check the read policy before
> widening what such a file carries.

## Context

`program_requirement_records` let anon read checked records only, and a reviewer all, until Sam opened its read to
every row on Open Asks Sheet 67 (2026-10-12), each unchecked record marked on the page. CPL Pathways read the same
facts from `cpl_pathways_roep_data.js`, which `kb/_build_roep_display.py` writes from every filed record. The lane's
next step was to widen that file from the pilot's 22 records to all 1,515, split per college. Measured on 2026-10-11
(S365): 29 of the 1,515 were checked, so the split would have put 1,486 unchecked records on the public site, past the
gate the table enforces. The pilot's file already carried two unchecked records.

## The claim

The policy on a table governs only reads of that table. A generated file is a second door to the same rows, and it
opens with the builder's privileges: the service role, or a committed copy of the data. Nothing about the file says
which rows the table would have refused. So:

1. **Before widening what a generated file carries, read the source table's policy** (`pg_policies`) and count the rows
   the public could not read there. A non-zero count is a disclosure question, not a size question.
2. **Prefer the page reading the table itself** when the table already gates what it should. The public then sees
   what the policy allows, a signed-in reviewer sees the rest, and the gate needs no second copy that can drift.
3. **When a file must stay** (offline pages, tests, a sweep that aborts the network), filter it by the same predicate the
   policy uses, in the builder, with a test that fails when a row the policy would refuse reaches the file.

The gate can be about quality rather than privacy, as here: the records are public catalog data, and `checked` means a
person confirmed the reading. The rule holds either way, because the file still shows the public what the table holds
back.

## Evidence

- `program_requirement_records_read`: roles anon and authenticated, `using (checked)`; a second policy lets an allowed
  reviewer read all (read 2026-10-11).
- Measured on display build `344441813b01`: 1,515 records, 29 checked at six colleges, 18.2 MB of compact JSON for all
  of them (lessons, S365).
- The Program Requirements tab reads the table directly (`program_requirements.js`, `RECORD_SELECT`), so it
  showed the public checked records only.
- The decision went to Sam as Open Asks Sheet 65 card 2.

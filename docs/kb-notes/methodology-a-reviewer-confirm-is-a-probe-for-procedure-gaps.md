---
title: A reviewer's confirm is a probe for procedure gaps, and it retires as they close
created: 2026-10-14
updated: 2026-10-14
tags: [methodology, program-requirements, harvest, review, procedure, audit]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/reference/lanes/program-requirements-harvest]]"
  - "[[docs/program_requirements_harvest_lessons]]"
artifacts:
  - kb/_program_requirements_reconcile.py
  - kb/program_requirements_reconcile.json
  - kb/_program_requirements_score.py
---

# A reviewer's confirm is a probe for procedure gaps, and it retires as they close

## The idea

A harvest that reads thousands of catalog pages cannot ask a person to confirm every record. Sam named the alternative on
2026-10-14, after confirming one Cabrillo record and marking its neighbor Needs a fix:

> "I'm thinking to just use the confirm process to find gaps in our procedures and as we close those, I won't need the confirm
> step. We'll let the colleges unearth the anomalies as we go and continue to adjust our procedures until we get stable enough
> to use the data as our best estimation of program pathways based on available data."

A confirm is a sample. When it finds a miss, it asks what in the reading procedure let the miss through, and which other records
share it.

## The loop

1. **A person's note names one miss.** Biology A.S.: "missing the Cabrillo College General Education credits required: 24 and
   the 6 units of Elective."
2. **Measure the class, not the record.** One live query found about 1,560 associate degrees, 77 of them with a degree total. The
   gap was the procedure's (records read before the prompt asked for the degree), and it was everywhere.
3. **Turn the class into a check that runs without a person.** The degree check and its Major only gap flagged 1,487 records on
   the next display build. Nobody has to confirm a record to find that gap again.
4. **Close what the page text can close, per catalog.** "A secondary search of the catalog text to see if we can reconcile after
   the initial PR harvest": each college's procedure carries reconcile steps that fill a figure the record lacks and name the
   words it came from ("Cabrillo's procedure might require steps that others do not").
5. **Read what the new check surfaces.** Cabrillo's first reconcile fixed 7 records and exposed 4 the old check had passed: two
   transfer degrees whose courses count twice, and two pages whose reading dropped a whole block. Each is a new procedure gap or
   a ruling, and the loop starts again.
6. **Retire the confirm for a class once its check holds.** What remains for people is the anomaly the colleges surface.

## What makes it work

- **A rerun is the fix.** A record a person marked Needs a fix must be replaceable by the rerun that carries the procedure fix;
  a store that holds every record a person has read blocks the loop it exists to serve.
- **Every automatic change names its words.** A reconcile that fills a figure records the text it matched, so a reader can audit
  the procedure rather than trust it.
- **A tighter check makes some passing records fail, and that is the point.** Diff each changed record's check against the
  previous run before posting, and sort the new failures into procedure gaps and questions for the curator.

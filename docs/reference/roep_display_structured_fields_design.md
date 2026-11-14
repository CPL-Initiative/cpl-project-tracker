---
title: "ROEP display gaps from structured fields — design"
created: 2026-11-14
tags: [reference, program-requirements, roep-display, design]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
related:
 - "[[docs/reference/lanes/program-requirements-harvest]]"
 - "[[docs/program_requirements_harvest_lessons]]"
---

# ROEP display gaps from structured fields: design

A design only (S652, the lane's NEXT 3). Nothing here changes a builder, a record or a display row.
It answers the decision `d-display-rule-withdrawn-structured-fields-s651`: the display states a figure
from fields a step or a curator wrote, and it never quotes `reconciled[].words` or edits a reader's note.
A second reader reads this design before any builder change.

## What the code does today

`kb/_build_roep_display.py` builds `display.gaps` in `gaps_for()` from the filed record in
`kb/program_requirements_college/<slug>/records/<control>.json`. Most kinds are templates over fields
(*Check not met*, *No printed total*, *Major only*, *Catalog and state file differ*). One kind is free
text: every string in `record.notes`, the extraction model's working notes, becomes a *Reader's note*
gap verbatim. The table's `record` column holds only `program` and `blocks` (`record_read()` in
`kb/_program_requirements_load.py`), so the reader's notes and `reconciled[]` live only in the filed
record, and the notes reach the public only through `display.gaps`.

The reconcile (`kb/_program_requirements_reconcile.py`) fills an empty field and appends a note
`{field, was, now, words}`. What `words` holds depends on the step:

| Step | `words` |
|---|---|
| `fill` | the regex match on the program page: verbatim page text, often only a fragment ("Cabrillo College General Education 24") |
| `set` | the match on the program page (often only "Cal-GETC"), then ` (<source>: <source_words>)`, where `source_words` is the curator's text in `kb/program_requirements_reconcile.json` |
| `statewide_cal_getc` | the section's words, then the ruling; the note also carries `statewide`, `standing` and `basis` |
| others (`semester_sum`, `course_units`, pools) | a sentence the code composes |

So the source link and the curator's text arrive inside one string, and `source_words` is sometimes a
verbatim quotation (Lassen's "Cal-GETC General Education Certificate of Achievement requires 34
Units.") and sometimes a curator's account ("SUMMED FROM THE AREAS, no total is printed: ..." or a
line ending in a session and decision id). The note does not record which step wrote it. The withdrawn
rule (`28f190a8`, reverted by `7f0f1b91`) parsed that string, presented its tail as "the catalog's
words", and pruned clauses out of reader's notes by regex. Its defects follow from that design.

## Measured (commit `5278e928`, display build `a83667f9fa0d`)

Read-only, from the committed display receipt and the filed records (script kept outside the repo).

| Measure | Rows | Colleges |
|---|---|---|
| Display rows | 18,205 | 118 |
| Rows with any gap | 18,201 | 118 |
| Rows with a *Reader's note* (89,098 notes) | 18,125 | 118 |
| *Catalog and state file differ* (21,768 entries) | 6,934 | 118 |
| *Major only* / *Check not met* / *No printed total* / *Possible misread* | 5,117 / 1,974 / 740 / 570 | 95 / 115 / 68 / 46 |

Reader's notes that say a figure is not printed (a regex count; approximate): GE units 3,500 rows at
107 colleges, GE pattern 2,211 at 98, degree total 1,832 at 88, elective units 1,160 at 96, major or
program total 682 at 81.

Notes that contradict a figure the row now holds (the Lassen class):

| Class | Rows | Colleges | Sampled true of 12 |
|---|---|---|---|
| GE units "not printed", figure filled by a reconcile | 456 | 23 | 10 |
| GE units "not printed", the reader's own figure | 238 | 32 | about 2 |
| Other fields (degree total 15, major total 48, electives 37, pattern 4) | 104 | 4 to 21 per field | mostly false matches |

The second class is mostly a reader explaining where it took a figure ("ge_units of 34 comes from the
ADT sentence; the table line prints no units"), so a regex cannot fail a build on it.

Rows that hold a GE figure a reconcile filled from empty: **770 rows at 26 colleges**, with a
structured source of this kind:

| Basis, derived from the step | Rows | Colleges |
|---|---|---|
| printed in the college's own catalog (`set`, page link) | 474 (314 a range) | 16 |
| printed on the program's own page (`fill`) | 64 | 4 |
| summed from areas (`set`, "SUMMED FROM THE AREAS") | 104 | 3 |
| borrowed: Monterey Peninsula's catalog cited at another college | 125 | 7 |
| statewide (`statewide_cal_getc`) | 3 | 1 |

All 703 `set` notes match a step in their own college's config by source link; 89 differ in words from
the config as it stands (the config changed after the run); 123 carry internal markers (run ids,
session or sheet names). On Lassen 30947, 31015, 31037, 31379 and 32083 the record holds GE 34 and a
reader's note still says Cal-GETC is named with no units printed; the display carries no page 72 link.

## 1. The fields

Evidence moves out of the string into named fields. The curator writes them once per step in the
reconcile config; the reconcile copies them onto each note it writes; the builder reads only them.

| Field | Type | Written by |
|---|---|---|
| `record.program.<field>` (`ge_units`, `ge_pattern`, `total_units`, `degree_total`, elective units) | figure `{min, max}` or name | the reader, or a reconcile step |
| `record.notes[]` | string | the reader; never edited |
| step `basis` | `printed`, `program_page`, `summed`, `statewide` or `borrowed` | curator, in the config |
| step `pattern` | one pattern name ("Cal-GETC", "LPC-GE"); a step names one | curator |
| step `document` | `{college, title, catalog_year, url, pdf_page, printed_page}` | curator; `url` and `pdf_page` derive from today's `source` |
| step `quote` | verbatim catalog text, or null; allowed only for `printed` | curator; checked as below |
| step `quote_checked` | `{how: "match in <committed text path>" or "person", by, at}` | the check, or the person who read the page |
| step `parts` | `[{label, units}]`, for `summed` only | curator |
| step `ruling` | a decision id, for `statewide` only; internal | curator |
| step `note` | curator's free text (today's non-verbatim `source_words`) | curator; never displayed |
| `reconciled[].evidence` | the step's fields above plus `step` (`<college>/<field>/<index>`) and `config_sha` | the reconcile, at write; a backfill once for filed notes |
| `reconciled[].evidence` on a `fill` | `basis: program_page`, `quote` = the regex match, verbatim | the reconcile; the match is page text by construction |
| `display.figures[]` | `{field, pattern, figure, basis, text, source}` | the builder |
| `display.superseded_notes[]` | `{text, field, by}`, the reader's note verbatim | the builder |

A range that spans two patterns (Monterey Peninsula's 24-34 for MPC GE or Cal-GETC; Los Angeles Valley's
27-34) becomes two steps, one per pattern, each with its own figure. The record's single `ge_units`
span stays as the reconcile writes it, and the display states the two patterns on two lines.

`source_words` retires. The backfill moves each into `quote` where it is verbatim and into `note`
otherwise; an entry is verbatim only once `quote_checked` is set.

## 2. What the display says

The builder writes one figure statement per evidence entry, by template, into `display.figures`. The
page and Sierra show it above the gaps. Lassen 30947 reads:

> General education: Cal-GETC, 34 units, as the 2026-2027 catalog prints it on page 70: "Cal-GETC
> General Education Certificate of Achievement requires 34 Units." (link to PDF page 72)

| Basis | Template |
|---|---|
| `printed` | "{label}: {pattern}, {figure}, as the {catalog_year} catalog prints it on page {printed_page}: "{quote}"" plus the link |
| `printed`, no checked quote | "{label}: {pattern}, {figure}, printed in the {catalog_year} catalog, page {printed_page}" plus the link |
| `program_page` | "{label}: {pattern}, {figure}, printed on this program's page: "{quote}"" |
| `summed` | "{label}: {pattern}, {figure}, the sum of the areas the catalog prints on page {printed_page} ({parts}); the catalog prints no total" |
| `statewide` | "{label}: Cal-GETC, 34 units, the statewide figure; this catalog names Cal-GETC and prints no figure for it" |
| `borrowed` | "{label}: {pattern}, {figure}, as {document.college}'s catalog prints it; this college's catalog prints none" plus the link |
| field empty, pattern named | "{label}: {pattern}; the catalog prints no unit figure for it, as read" |
| field empty, no pattern | no statement; the existing gaps stand |

The statement never names a run, a session, a sheet card or a decision id: those stay in `ruling`,
`note` and the filed record, and the harvest tab may show them to the team.

**`words` and `note` are not displayed at all.** The display is public (CPL Pathways and Sierra), and
the measured `words` carry internal markers in 123 of 703 `set` notes and present sums as quotations
in 104. A curator's account belongs in COBI's internal harvest tab, which reads the filed record. A
labeled "curator's note" on a public page would still publish those markers.

**A superseded reader's note moves; its text never changes.** When the record holds a figure that a
step filled with evidence, and a reader's note says that field is not printed, the builder moves the
whole note, verbatim, out of `gaps` into `display.superseded_notes` with the field and the step that
superseded it. The page shows these folded under "The reader's notes from before the figure was found".
A note that also says something else keeps every word, so no clause and no figure is lost. A note about
a field the record still lacks (the "no GE pattern is named" notes with `ge_pattern` null) stays in
`gaps`. The page change is small: `roepGaps()` in `cpl_pathways.js` and the record panel in
`program_requirements.js` each read `figures` and `superseded_notes`.

## 3. The contradiction guard

`contradictions(display, filed)` runs at the end of every build, beside the existing build-stamp check.
For each guarded field the record holds, it reads each *Reader's note* still in `gaps` against that
field's not-printed pattern (one table, `NOT_PRINTED`, beside `gaps_for`).

1. **Fails the build** when the field carries `evidence` and such a note is still in `gaps`: the move
   in section 2 regressed. The message names college, control number, field and note.
2. **Fails the build** when a `figures` statement quotes text whose evidence is not `printed` or
   `program_page`, or whose `quote_checked` is empty, or whose quote matches the internal-marker
   pattern (`run \d{8,}`, `S\d{3}`, `Sheet \d+`, `d-...-s\d+`).
3. **Flags, never fails,** when the field is the reader's own figure (no evidence): it writes
   `kb/status/roep_display_contradictions.json` (count by college and field) and prints the count with
   `--print`. The count may not rise from build to build; a rise fails the test in section 5. The
   measured precision of this class (about 2 of 12) rules out failing on it.

## 4. Migration

No step needs a paid reread. Each step is one PR; rollback at each is named.

| Step | What | Who | Shared data | Rollback |
|---|---|---|---|---|
| 1 | Add `basis`, `pattern`, `document`, `quote`, `parts`, `ruling`, `note` to Lassen's one `set` step; Lassen's `source_words` is verbatim and its `why` gives printed page 70 | curator, by hand | none (repo file) | `git revert` |
| 2 | Reconcile copies a step's fields onto each note as `evidence`; a repo-only backfill attaches `evidence` to filed notes by matching college, field, value and source link, and lists every note it cannot match | code | none (filed JSON in the repo) | `git revert` |
| 3 | Builder: `figures`, `superseded_notes`, the guard; page code reads both; local build, receipt diff, a second reader on the diff (counts by class) | code | none until applied | `git revert` |
| 4 | Display apply for Lassen only (`step=display`, `display_college=Lassen College`, 59 rows; first case 30947, 31015, 31037, 31379, 32083) | conductor, through a reviewed plan | **writes `program_requirement_records.display`** | re-apply the Lassen rows of receipt `a83667f9fa0d`, or a display run on the reverted `main` |
| 5 | Derive the other 25 colleges' step fields mechanically: `url` and `pdf_page` from `source`; `basis` `summed` from "SUMMED FROM THE AREAS"; `borrowed` where the host is another college's; `program_page` for every `fill` | code, then curator review | none | `git revert` |
| 6 | Per college, a curator confirms `quote` (verbatim) or moves the text to `note`, writes `parts` for the three summed colleges, and splits two-pattern ranges into two steps | curator | none | `git revert` |
| 7 | Whole-build display apply, after Lassen's record is confirmed (`d-display-first-run-one-college-s645`) | conductor, reviewed plan | **writes `program_requirement_records.display`** (all rows) | re-apply receipt `a83667f9fa0d` |

A quote is checked free where a committed page text holds it (a string match); Lassen's page read
(run 43570566375) kept its text only as a run artifact, so Lassen's check is a person reading PDF page
72, or that artifact. Steps 4 and 7 are the only shared-data writes and go through a reviewed plan
(Rule 10); both use the existing display route and receipt. Splitting a range (step 6) changes no record
figure, so no reread follows. The 89 notes whose `words` differ from today's config attach to the step
by source link and carry today's fields; the backfill lists them for the curator.

## 5. Tests

All in `tests/roep_display_test.py`, each on a fixture under `tests/fixtures/roep_display/`.

| Failure mode | Fixture | Assertion |
|---|---|---|
| A note contradicts the record (the Lassen class) | Lassen 30947 as filed: `ge_units` 34, `evidence` printed p.72, note "Cal-GETC pattern named with no units printed; remaining units to 60 from electives numbered 1-49, no elective units printed." | no gap matches `NOT_PRINTED["ge_units"]`; the note is in `superseded_notes`, byte-equal; `figures[0]` carries the quote and the page 72 link; the guard fails a hand-built display that leaves the note in `gaps` |
| A curator note shown as the catalog's words | a Las Positas-shaped step, `basis` summed, `note` "SUMMED FROM THE AREAS ... (S6xx)"; a second step with `basis` printed and a quote containing "run 43581021827" | no display string contains the note or a quotation mark around it; the statement says "the sum of the areas"; the marker quote fails the build |
| A borrowed source shown as the college's own | Redwoods' Cal-GETC step citing `catalog.mpc.edu` | the statement names Monterey Peninsula College's catalog and never "the catalog prints it on page" |
| A pruned sentence loses its figure | the compound note "Cal-GETC is named but no GE unit figure is printed; major total 18 from 'Required Core Courses: 18 units'." | every reader's note appears byte-equal in `gaps` or `superseded_notes`; the multiset of numbers across them equals the record's; 18 survives |
| A true note removed | "No GE pattern is named" with `ge_pattern` null and `ge_units` filled | the note stays in `gaps` |
| One figure on two patterns | a 24-34 range from two steps (MPC GE 24, Cal-GETC 34) | two statements, each one pattern and one figure |
| The flagged class grows | the committed `roep_display_contradictions.json` | a build whose count rises fails |

## 6. Open questions

1. **Borrowed sources (125 rows at 7 colleges cite Monterey Peninsula's Cal-GETC page).** Re-base them
   as `statewide` where the college's own catalog prints no figure, or keep `borrowed` and name the
   other catalog? Recommendation: re-base each as `statewide` once its config quotes the college's own
   words showing no figure (the evidence `d-calgetc-34-per-college-evidence-s648` asks for); until then
   show `borrowed`. COBIx's call.
2. **Superseded notes on the public page.** Show them folded, or keep them in the filed record only?
   Recommendation: folded on CPL Pathways, left out of Sierra's reading; the reader's working note is
   evidence of how the record was read, and folding keeps it from contradicting the figure.
3. **Who checks a quote.** Recommendation: a string match against committed page text where it exists;
   otherwise COBIx's spot-check on the first college of each platform, then the curator.
4. **A structured "not printed" from the reader.** Should the extraction schema gain
   `program.unprinted: [field]` so future reads state absence as a field? Recommendation: yes, at the
   next schema change, never as its own paid reread; the flag-only guard covers existing rows.
5. **Other fields.** Apply the same evidence to degree total, major total and elective units now, or
   after GE? Recommendation: after GE; their measured contradictions are few (104 rows, most false
   matches), and the `fill` steps that write them already hold verbatim page text.

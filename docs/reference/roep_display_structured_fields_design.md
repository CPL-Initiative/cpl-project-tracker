---
title: "ROEP display gaps from structured fields — design"
created: 2026-11-14
updated: 2026-11-14
tags: [reference, program-requirements, roep-display, design]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
related:
 - "[[docs/reference/lanes/program-requirements-harvest]]"
 - "[[docs/program_requirements_harvest_lessons]]"
---

# ROEP display gaps from structured fields: design

This is a design only (S652, the lane's NEXT 3). Nothing here changes a builder, a config, a record or a
display row. It answers the decision `d-display-rule-withdrawn-structured-fields-s651`: the display states a figure
from fields that a step or a curator wrote. It never quotes `reconciled[].words` and never edits a reader's note.
Revision 2 takes in the second reader's findings on #3296.

## What the code does today

`gaps_for()` in `kb/_build_roep_display.py` builds `display.gaps` from the filed record. Most gap kinds are templates.
One is free text: every string in `record.notes` (the extraction model's working notes) becomes a *Reader's note*
gap, verbatim. The table's `record` column holds only `program` and `blocks` (`record_read()` in
`kb/_program_requirements_load.py`), so the notes and `reconciled[]` live only in the filed record.

The reconcile (`kb/_program_requirements_reconcile.py`) fills an empty field and appends `{field, was, now, words}`.
A step's `pattern` is the regex the reconcile runs (`re.search(st["pattern"], scope)`, line 862; Lassen's is
`Cal-?\s?GETC`), so no display name may go in that key. For a `set` step, `words` is that match followed by
` (<source>: <source_words>)` (line 935). `source_words` is curator text in `kb/program_requirements_reconcile.json`.
Sometimes it is a verbatim quotation and sometimes an account ("SUMMED FROM THE AREAS ..." or a session id). It also
feeds the `course_units`, `course_hours`, `or_units` and `and_units` notes (lines 574-682). No note records the step
that wrote it. The withdrawn rule (`28f190a8`, reverted by `7f0f1b91`) parsed that string, presented its tail as the
catalog's words, and pruned clauses by regex.

## Measured (commit `5278e928`, display build `a83667f9fa0d`)

These are read-only counts from the committed display receipt joined to the filed records. Each count names its rule.

| Count | Rule | Rows | Colleges |
|---|---|---|---|
| Display rows | lines of the receipt | 18,205 | 118 |
| Rows with a *Reader's note* | at least one gap of that kind (89,098 notes) | 18,125 | 118 |
| GE filled by a reconcile | displayed row; a `reconciled` note on `ge_units` whose `now` equals the record's `ge_units` and whose `was` is empty | 764 | 26 |
| of them, the step is `set` with `source` | config step, same college, field and value | 698 | 22 |
| of them, `set` with no `source` (Pierce, East Los Angeles, Orange Coast) | as above | 35 | 3 |
| of them, `statewide_cal_getc` | the note's `statewide` key | 3 | 1 |
| of them, no matching step in today's config | none of the above | 28 | 2 |
| of the 764, `ge_pattern` null | Cerritos 89, Los Angeles City 39, Los Angeles Valley 34, Redwoods 18 and two more | 196 | 6 |
| Lassen class: of the 764, a reader's note matches `NOT_PRINTED_GE_UNITS` (below) | regex on the gap text | 490 | 23 |
| Reader's own GE figure (no reconcile note) and a note matches `NOT_PRINTED_GE_UNITS` | as above | 125 | 13 |
| Notes on the 764 rows that name GE but do not match | `CANDIDATE` and not `NOT_PRINTED_GE_UNITS` | 506 notes | 408 rows |

The second reader's plain regex counted 364 rows at 24 colleges for the Lassen class. The two rules differ, so this
design commits its own rule. Revision 1 reported 770 and 456. The 770 counted filed records outside the display and
the 456 used an earlier regex; both are withdrawn. Among the 698 `set` notes, 123 carry internal markers in the
curator text and 104 present a sum.

```python
GE = r"(?:GE|general\s+education|Cal-?GETC|IGETC|CSU[- ]GE)"
CANDIDATE = re.compile(r"\b%s\b|ge_units" % GE, re.I)
NOT_PRINTED_GE_UNITS = re.compile(
    r"\b(?:no|without)\b[^.;]{0,40}?\b%s\b[^.;]{0,30}?\b(?:units?|figure|total)\b" % GE
    + r"|\b%s\b[^.;]{0,40}?\b(?:no|without)\b[^.;]{0,25}?\b(?:units?|figure|total|printed)\b" % GE
    + r"|\b%s\s+units?\b[^.;]{0,25}?\b(?:is|are)\s+not\s+(?:printed|stated|given)" % GE
    + r"|\bge_units\b[^.;]{0,25}?\b(?:null|empty)\b", re.I)
NOT_PRINTED_GE_PATTERN = re.compile(
    r"\bno\s+(?:specific\s+)?(?:GE|general\s+education)\s+pattern\b"
    r"|\bwithout\s+naming\s+a\s+(?:specific\s+)?(?:GE\s+)?pattern|\bge_pattern\b[^.;]{0,25}?\b(?:null|empty)\b", re.I)
```

**Recall, hand-labeled.** I drew 50 `CANDIDATE` notes on the 764 rows (seed 3296) and labeled each by reading it.
27 say the GE unit figure is not printed. The regex finds 24 of them (recall 89%), and 24 of its 25 hits are true
(precision 96%). All three misses describe a combined figure ("prints 'General Education and Elective Courses 21'
... so ge_units ... left null"). The false hit names a sample map's units. It matches Los Angeles City 02739 ("No
general education pattern or GE units printed").

## 1. The fields

The curator writes evidence once per step in the config. The reconcile copies it onto each note, and the builder
reads only these fields.

| Field | Type | Written by |
|---|---|---|
| `record.program.<field>` | figure `{min, max}` or name | the reader, or a reconcile step |
| `record.notes[]` | string | the reader; never edited |
| step `pattern` | regex; unchanged | curator (today's meaning) |
| step `pattern_label` | the display name, one pattern ("Cal-GETC"); `grep -rn pattern_label kb tests *.js` finds nothing today | curator |
| step `basis` | `printed`, `summed`, `statewide` or `borrowed` | curator |
| step `qualifier` | `exact`, `at_least`, `up_to` or `range` | curator; Berkeley City's 18 is `at_least`, Orange Coast's `{null, 27}` is `up_to` |
| step `document` | `{college, title, catalog_year, url, pdf_page, printed_page}` or null | curator; `url` and `pdf_page` come from today's `source` |
| step `quote` | verbatim catalog text, or null; only with `printed` | curator |
| step `quote_checked` | `{how, text_ref, by, at}` or null | the check, or the person who read the page |
| step `parts` | `[{label, units}]`, with `summed` only | curator |
| step `ruling` | a decision id, with `statewide` only; internal | curator |
| step `note` | the curator's account; never displayed | curator |
| step `source_words` | unchanged for `course_units`, `course_hours`, `or_units` and `and_units`; on a `set` step it splits into `quote` and `note`, and the reconcile reads `note` there | curator |
| `reconciled[].evidence` | the step's fields plus `step` (`<college>/<field>/<index>`) and `config_sha` | the reconcile at write; a backfill once for filed notes |
| `reconciled[].evidence` on a `fill` | `quote` = the regex match; `quote_checked.how = "reconcile match"`, `text_ref` = the record's `extracted_run` and `source_sha` | the reconcile; the match is page text by construction |
| `display.figures[]` | `{field, pattern_label, figure, qualifier, basis, text, source}`; omitted when empty | the builder |
| `display.superseded_notes[]` | `{text, fields, by}`, the note verbatim; omitted when empty | the builder |
| gap `superseded_for` | field names, on a reader's note that stays in `gaps` | the builder |

**What verifies a quote.** Three things count as a verifying text. One is page text a capture or page read committed
as its output, named by path and `source_sha`. Another is that run's artifact, named by run id and sha. The third is
a person reading the page, named with the date. The reconcile config, filed records, apply and calgetc plans,
receipts, lessons, lanes and this design never count, because each holds a curator's copy. Lassen's p.72 text sits
only in the artifact of page read run 43570566375, so Lassen's quote stays unchecked until a person or that artifact
checks it.

**A step with no `source`** (25 of the 65 `set` steps; 35 rows at Pierce, East Los Angeles and Orange Coast) gets a
null `document`. Its statement names the basis and no page, link or quote. The backfill matches its notes by college,
field and value, never by link, and lists every note it cannot match (today the 28 rows at two colleges).

A range over two patterns (Monterey Peninsula's 24-34; Los Angeles Valley's 27-34; Pierce's 21-34) becomes two
steps, each with one `pattern_label` and one figure.

## 2. What the display says

The builder writes one statement per evidence entry into `display.figures`. Lassen 30947, once its quote is checked,
reads: *General education: Cal-GETC, 34 units, as the 2026-2027 catalog prints it on page 70: "Cal-GETC General
Education Certificate of Achievement requires 34 Units."* The statement links to PDF page 72.

| Evidence | Template (`{figure}` keeps the qualifier: "at least 18 units", "up to 27 units", "21-34 units") |
|---|---|
| `printed`, quote checked | "{label}: {pattern_label}, {figure}, as the {catalog_year} catalog prints it on page {printed_page}: "{quote}"" + link |
| `printed`, quote unchecked or null | "{label}: {pattern_label}, {figure}, printed in the {catalog_year} catalog, page {printed_page}" + link |
| `printed`, no `document` | "{label}: {pattern_label}, {figure}, printed in this college's catalog" |
| `fill` | "{label}: {pattern_label}, {figure}, printed on this program's page: "{quote}"" |
| `summed` | "{label}: {pattern_label}, {figure}, the sum of the areas the catalog prints on page {printed_page} ({parts}); the catalog prints no total" |
| `statewide` | "{label}: Cal-GETC, 34 units, the statewide figure; this catalog names Cal-GETC and prints no figure for it" |
| `borrowed` | "{label}: {pattern_label}, {figure}, as {document.college}'s catalog prints it; this college's catalog prints none" + link |

No statement names a run, a session, a sheet card or a decision id. **`words`, `note` and `source_words` are not
displayed.** The display is public (CPL Pathways and Sierra), and that text carries internal markers. COBI's harvest
tab reads the filed record for the team.

**A reader's note is never edited; it moves whole or stays whole.** For each note, the builder lists the fields it
says are not printed (by label first, then the regexes above). A note moves to `superseded_notes` only when every
field it names is now held with evidence. Otherwise it stays in `gaps` and carries `superseded_for` with the fields
it names that are now held. The page shows such a note with one line under it: "Found after this note: general
education units, above." Berkeley City's "no GE pattern is named and no separate GE units are printed" therefore stays
in `gaps` for the pattern and is marked superseded for the units. `roepGaps()` in `cpl_pathways.js` and the record
panel in `program_requirements.js` read `figures`, `superseded_notes` and `superseded_for`.

**Invariant.** A row with no evidence and no superseded note renders identically to today, except for `display.build`.
`figures` and `superseded_notes` are omitted when empty.

## 3. The contradiction guard

`contradictions(display, filed)` runs at the end of every build.

1. **Fails** when a field is held with evidence and a note that names it as not printed sits in `gaps` without that
   field in `superseded_for`.
2. **Fails** when a statement quotes text whose `quote_checked` is null, whose `text_ref` points at an excluded
   source, or whose quote matches the internal-marker pattern (`run \d{8,}`, `S\d{3}`, `Sheet \d+`, `d-...-s\d+`).
   A `fill` quote passes on `how = "reconcile match"` with a `text_ref`.
3. **Catches a regex miss with labels.** On a row with evidence, every `CANDIDATE` note the regexes do not match goes
   to `kb/status/roep_display_note_review.json`. A curator labels each note once in
   `kb/program_requirements_note_labels.json`, keyed by college, control number and the note's md5, as
   `supersedes: [fields]` or `stands`. The builder reads the label before the regex. A college's display apply waits
   until its unlabeled count is zero. The baseline is 506 notes on 408 rows (`5278e928`).
4. **Flags, never fails,** where the field is the reader's own figure. It writes
   `kb/status/roep_display_contradictions.json`. The baseline is pinned at **125 rows at 13 colleges** (commit
   `5278e928`, `NOT_PRINTED_GE_UNITS`), and a build that raises it fails the test.

## 4. Migration

No step needs a paid reread. Each step is one PR.

| Step | What | Shared data | Rollback |
|---|---|---|---|
| 1 | Lassen's one `set` step gains `pattern_label`, `basis`, `qualifier`, `document` (printed page 70, PDF 72), `quote`, `note`; its regex `pattern` is untouched | none | `git revert` |
| 2 | The reconcile copies evidence onto notes; a repo-only backfill attaches it to filed notes (by link, or by college, field and value without one) and lists the misses | none | `git revert` |
| 3 | Builder: `figures`, `superseded_notes`, `superseded_for`, the guard, the labels; page code; a local build; a second reader on the receipt diff | none until applied | `git revert` |
| 4 | Lassen's notes labeled; its quote checked by a person or run 43570566375's artifact; display apply for Lassen only (59 rows; first 30947, 31015, 31037, 31379, 32083) | **writes `program_requirement_records.display`** | restore each row from that apply receipt's `before` map (`rollback.reapply`, build by row) |
| 5 | Derive the other 25 colleges' step fields: `url` and `pdf_page` from `source`; `summed` from "SUMMED FROM THE AREAS"; `borrowed` where the host is another college's; qualifiers from the value's shape | none | `git revert` |
| 6 | Per college: quotes checked or moved to `note`, `parts` for the three summed colleges, two-pattern ranges split, notes labeled | none | `git revert` |
| 7 | The whole-build apply after Lassen is confirmed (`d-display-first-run-one-college-s645`) | **writes `program_requirement_records.display`** (all rows) | restore each row from that apply's `before` map |

The table holds mixed builds today: `bef8ef819af7` everywhere, then per-college applies at Desert, Glendale, Cerro
Coso, Cosumnes River, Grossmont, Lassen and others. So no single receipt is a rollback. Each apply receipt's
`before` map names the build each row held, and `rollback.reapply` groups the rows by that build. Steps 4 and 7 are
the only shared-data writes, and both go through a reviewed plan (Rule 10). Splitting a range changes no record
figure.

## 5. Tests

All tests go in `tests/roep_display_test.py`, each on a fixture under `tests/fixtures/roep_display/`.

| Failure mode | Fixture | Assertion |
|---|---|---|
| The Lassen contradiction | 30947 as filed, with evidence p.72 | no gap names `ge_units` as not printed outside `superseded_for`; the note is in `superseded_notes`, byte-equal; the guard fails a display that leaves it bare in `gaps` |
| A half-superseded note | Berkeley City 01101: `ge_pattern` null, `ge_units` 18 `at_least` | the note stays in `gaps`, byte-equal, `superseded_for: ["ge_units"]`; the statement says "at least 18 units" |
| A curator note shown as the catalog's words | a `summed` step whose `note` reads "SUMMED FROM THE AREAS ... (S6xx)"; a `printed` quote holding "run 43581021827"; a quote whose `text_ref` is the config | no display string contains the note; the marker quote and the config-checked quote fail the build |
| A borrowed source as the college's own | Redwoods' Cal-GETC step citing `catalog.mpc.edu` | the statement names Monterey Peninsula College's catalog |
| A step with no source | East Los Angeles 34 | no page, link or quotation in the statement |
| A pruned sentence loses its figure | "Cal-GETC is named but no GE unit figure is printed; major total 18 from 'Required Core Courses: 18 units'." | every note appears byte-equal in `gaps` or `superseded_notes`; the multiset of numbers is unchanged |
| A regex miss | the three missed notes of the sample | each lands in the review file until labeled, then follows its label |
| Unchanged rows | a row with no evidence | the display equals the `a83667f9fa0d` fixture except `build`, with no `figures` or `superseded_notes` key |
| The flagged class grows | the committed contradictions file | a count above 125 fails |
| `pattern` stays a regex | Lassen's step after step 1 | the reconcile fills the same five records as run 43581021827 |

## 6. Open questions

1. **Borrowed sources** (Monterey Peninsula's Cal-GETC page cited at seven colleges). Recommendation: re-base each
   one as `statewide` once its config quotes the college's own words showing no figure
   (`d-calgetc-34-per-college-evidence-s648`), and show `borrowed` until then. COBIx's call.
2. **Superseded notes on the public page.** Recommendation: fold them on CPL Pathways and leave them out of Sierra.
3. **Who labels the 506 notes and checks quotes.** Recommendation: the curator, college by college before each apply,
   with COBIx spot-checking the first college.
4. **A structured "not printed" from the reader.** Recommendation: add `program.unprinted: [field]` at the next
   extraction schema change, never as its own paid reread.
5. **Other fields** (degree total, major total, electives). Recommendation: after GE, with the same labels file.

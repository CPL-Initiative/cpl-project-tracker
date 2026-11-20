# What a person handed over for a course (S693)

`courses.json` holds what a signed-in reviewer handed over in the hand-over box (`commons_handover.js`) once a session
has filed it: pasted course data under `entries`, and findings that are no data under `notes`.

Sam, 2026-11-20, worked all 12 still-taught courses of the blocked-catalog hunt
(`kb/reference/blocked_catalog_hunt.json`): he pasted the catalog description and the units or hours for eight, and
found that Ohlone's four Radio Broadcast Lab courses are not in the 2026-2027 catalog (*"they are not in the catalog,
but there is no place for me to note that"*; the box takes a note since that day).

## What a row holds

An entry: `control_number`, `college`, `slug`, `course`, `title` (the state course list's), `mid_card_at_filing`,
`description` and `units_or_hours` as the person typed them, `source_url`, `entered_by`, `entered_at`, `handover` (the
hand-over row id's first eight characters) and `catalog_row`: the same course in the catalog rows the runner filed
(`../courses/<slug>.json.gz`), its printed title and measure, and whether the two descriptions agree.

A note: the same course fields, `not_in_catalog`, `catalog_year`, `source_url` (where the person looked), `noted_by`
and `noted_on`.

## The rules

- **A person's entry wins over a later machine read of the same course.** A reader that holds both keeps this one.
- **Join on `control_number`**, which a re-mint never changes. `mid_card_at_filing` is a stored id: resolve it through
  `kb/alias_chain.py` before comparing it to the live set.
- **A note sets nothing aside by itself.** `not_in_catalog` is the catalog factor of the no-longer-offered check, which
  needs every factor to agree (`r-no-longer-offered-sam-2026-11-20`).
- **A course filed here is off the hunt's to-do.** Its row in the hunt file carries `answered`, and
  `kb/_blocked_catalogs.py` lists it as answered. Its outcomes are still missing until its outline is in hand; that is
  the outline reader's to collect, never a second ask of the same person.

## Who reads it

The M-ID description pipeline (an M-ID card with no description) and the no-longer-offered check. The plain session
and COBIx wire them in.

## How a hand-over gets here

A session reads the waiting rows (`docs/kb-notes/reference-commons-hand-over.md`, *Reading what waits*), files each
pasted entry and note here, marks the course `answered` in the hunt file, and answers each row `filed` through
`commons_handover_mark()` on the migrate runner, with the values it replaced in the receipt.

# College Dashboard mockup harness (S302)

Draws the College Dashboard with the product's own code in headless Chromium, answers every
Supabase call from fixtures, opens each shown row's drill-in, and captures the section's markup
plus every CSS rule that matches it (the method in `docs/kb-notes/methodology-mock-up-from-the-running-code.md`).

    node prototype/mockup_harness/capture.mjs <repo tree> today.json 13   # main
    node prototype/mockup_harness/capture.mjs <branch tree> mock.json 13  # the round's branch
    python3 prototype/mockup_harness/assemble.py                           # Mockup + Today page

- Launch Chromium at `/opt/pw-browsers/chromium`: the npm package's own browser path does not exist here.
- `fixtures.json` sits beside the scripts and is NEVER committed: it holds MAP directory names.
  Pull it through the Supabase MCP (read-only): the `cpl_funding_config` row, `cpl_funding_participation`,
  `map_coordinator_summary()`, `map_college_contacts` (college, cpl_coordinator, primary_contact,
  landing_page_url), and the `budget_funding` rows with a `model_field`.
- `assemble.py` reads the previous round's frame CSS from `frame.css` (cut from the published mockup).

## My CPL Funding (S310)

The same method for the one-institution block the Public view and My College share
(`college_briefing.js` `fundingBlockHtml`):

    node prototype/mockup_harness/capture_mycpl.mjs <repo tree> today.json Coastline <fixtures.json>
    python3 prototype/mockup_harness/assemble_mycpl.py today.json out.html "<stamp>"

- `capture_mycpl.mjs` opens the tab's Public view (`?fundview=public`), switches the College
  Dashboard to My CPL Funding, picks the institution (or a district, `"Coast CCD"`), and writes
  the section's markup, its matching CSS, its text, and a screenshot at 1440 and 390px.
- Its fixtures are smaller than round 8's: the `cpl_funding_config` row (md5-check it against
  Postgres, `md5(config::text)`) and `map_coordinator_summary()` as `[college, coordinator,
  primary, page]` rows. Booleans only; still never committed.
- `assemble_mycpl.py` holds round 1's language changes (the Revised and Today views, a card per
  change, reply chips into `replies`, in-place edits into `edits`). Published as
  https://claude.ai/artifact/C5crxcr1KY7t1JgX3HTXMx; the copy of record is
  `docs/visuals/2026-10-01-my-cpl-funding-language.html`.
- Measure it with `scripts/a11y.js --config <dir>/a11y.config.js` over a copy without the Google
  Fonts link (the sweep cannot read a cross-origin sheet and fails rather than pass).

## The "model" sweep (S311)

Sam, 2026-10-01: *"Yes replace model on other surfaces as well"*, widening the My CPL Funding
card 14 ruling to the explainer and the tab's public text.

    node prototype/mockup_harness/capture_model_words.mjs <repo tree> hits.json <fixtures.json>
    python3 prototype/mockup_harness/assemble_model_words.py out.html "<stamp>"

- `capture_model_words.mjs` renders the explainer (`funding-model/`) and the tab's Public view
  (`?fundview=public`) on the published scenario, opens every fold and one drill-in, and lists
  every visible "model" in text, `title`, `aria-label`, `alt` and `placeholder`. Measured
  2026-10-01 over config md5 `0f3c6c8e…`: 412 hits, 40 distinct sentences. Strings that show only
  in other states (a failed load, an open goal, the CSV, the memo) come from reading the source,
  where `publicMode()` separates them from the curator-only text.
- `assemble_model_words.py` holds the round's cards as data (no drawn view: the sentences span
  two long pages), with reply chips into `replies` and in-place edits into `edits`. Published as
  https://claude.ai/artifact/T2MTd4n2cP2LXZXRXvbBQ6; the copy of record is
  `docs/visuals/2026-10-01-model-sweep.html`.

## The Fact Sheet on First Light (S352)

Sam, Open Asks Sheet 56 card 1 (2026-10-09): *"Mock it up"*. The whole public page, restyled.

    node prototype/mockup_harness/capture_fact_sheet.mjs <repo tree> <out dir> <overrides.json>
    python3 prototype/mockup_harness/assemble_fact_sheet.py <repo tree> <out dir>/capture.json out.html

- `overrides.json` is the `factsheet_overrides` rows for page `fact-sheet` (`block_key, html,
  hidden`), read through the Supabase MCP. The capture answers the page's anon read with them, so
  the mock-up carries the curator's live edits (eight rows on 2026-10-09; Funding hidden).
- `capture_fact_sheet.mjs` loads `fact-sheet/index.html` with its own scripts, waits for the
  figures, and writes the body (scripts removed) and the four style blocks its scripts inject.
  The story photos come from `staging2.map.rccd.edu`, which the sandbox cannot reach.
- `assemble_fact_sheet.py` puts two stylesheets on one page: `prototype/fact_sheet_first_light.css`
  (the proposal, and what a port copies over `fact-sheet/factsheet.css`) and today's
  `factsheet.css`, switched by the strip's Look control, with a Theme control beside it. An
  artifact loads nothing from another host, so the fonts and the page's images are data URIs and
  the story photos are left out with a note. Published as
  https://claude.ai/artifact/VLgB5mNnRCYVYdhneEeLus.
- Measure it with `scripts/a11y.js --config` over a copy wrapped in `<html lang="en"><body>` (an
  artifact page is written without the document tags), with three targets: light, dark (seed
  `data-theme="dark"`) and Today (seed the two `<style>` elements' `media`). Prove the dark target
  first: a sub-AA `--muted` in its dark block must fail it.

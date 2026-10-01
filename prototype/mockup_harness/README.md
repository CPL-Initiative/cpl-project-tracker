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

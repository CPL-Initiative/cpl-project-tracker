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

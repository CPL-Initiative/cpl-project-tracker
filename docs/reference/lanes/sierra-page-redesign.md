---
title: "Sierra's page redesign (after america.gov) — lane state"
created: 2026-10-08
updated: 2026-10-08
tags: [reference, roadmap-lane, sierra, first-light]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
  - "[[sierra-retrieval-corpus]]"
---

# Sierra's page redesign (after america.gov)

**What it is.** Sam, 2026-10-08: *"Sierra is a little busy on the UI and should have fewer boxes. Should open full screen when possible and be maximally clean and simple, removing all distractions possible. I like the look of the new America.gov site. I do think it's useful to keep the chips that adjust the reposes to the audience type though. Maybe we cycle through our First Light plein air artwork like America.gov cycles through pics of americana."* Verbatim capture: `CPLBrain/03-professional/braindumps/braindump-2026-10-08-1945-sierra-clean-and-a-ui-pass-at-checkpoint.md`.

**State: the port is live (S348).** The public page follows the approved mock-up ([Sierra Redesign](https://claude.ai/artifact/JZQhzzC1w2LtoFbSvtjT83), `prototype/sierra_redesign_mockup.html`). Sam on it: *"Love the Sierra mock up. Make the CPL Initiative logo a link to map@rccd.edu"* (built as a link to `https://map.rccd.edu`, the MAP site the old header linked; Sam ruled *Site*, Sheet 53 card 2, 22:44Z), then *"Yes, painting folds away as you designed"*.

**The page, as built** (`sierra/index.html`, `sierra.css`, `sierra.js`).
- **Arriving** (`<body data-view="arriving">`): the CPL Initiative logo (the link to MAP, new tab, said in words) and *About Sierra*; a Playfair greeting (*Hello, I'm Sierra* and one line beneath); the painting in a framed card (16:10 desktop, 4:5 phone) with the question bar on its top edge: the box, *Ask*, and *Answering for* with the five audience words; on a phone one *Answering for: …* control opens the row. The box's placeholder carries a starter question per painting (*Try: …*). Under the card: the caption (artist, *title*, year) and *Previous*, *Pause*, *Next*.
- **Asking**: the greeting (kept as the page's h1, clipped) and the card fold away; the conversation takes a centered column on paper, the question as a tinted line, the answer as plain text under her name and her Whitney roundel; the bar docks beneath it (sticky), with *Answering for: …* and *New question*. The page scrolls, not the log.
- **Her logo stays** (Sam, 2026-10-08, on the port: *"If you can preserve sierras logo, keep it in. I like the mountain line:)"*; then *"a dark blue ghosted font with a much thicker same color mountain line"*; then *"Keep the ridgeline mostly above Sierra. Can you just use the current logo expanded?"*). *Sierra* in the greeting and the reading header is one ghosted dark blue (`--sierra-ghost`: seal blue at 70% over paper, #4A6A93, 5.03:1; dark #6885AE, 4.84:1). Above it stands `whitney-mark.svg` as drawn, ridge and snow, inline in the same color, expanded with its foot at the letters' tops; its stroke scales with it. It stays out of the S (*"Keep the ridgeline out of the S"*): the S's ink ends at 18.9% of the word, so the drawing is trimmed before it, square to the line, and rises from just right of the S's top. The dot over the i sits lower than the font's (*"If you move the dot over the i down lower it won't interfere with the ridgeline"*): the word is set with a dotless i and a drawn dot 0.05em lower (the font's runs 0.627-0.772em, the stem stops at 0.528em); a screen reader hears a clipped plain *Sierra*. A halo in the page color keeps the letters clear where the foot meets them. Tried first and set aside in S348: a thin ridge behind ink letters, then a stem-weight ridge through the word. The roundel (`SIERRA_MARK`, shared with the COBI tab and the Fact Sheet drawer) sits beside her name on each answer.
- **One footer line**, the introduction and the beta note behind *About Sierra*.
- **Paintings**: seven California works from First Light's set in `sierra/art/` (`manifest.json`; `scripts/fetch_sierra_art.py`, `sierra-art-fetch.yml`, #1916). The list in `sierra.js` mirrors the manifest (`tests/sierra_redesign.test.js` fails a drift). Only the painting shown and the next are fetched. The cycle (9 s) runs only when the browser reports no reduced-motion preference, and stops for good at the reader's first keystroke or return to the box, and when the conversation starts.
- **First Light, self-contained**: tokens under Sierra's own names with First Light's values, every hex in a `:root` block; dark by the `cpl_theme.js` contract (the OS, or the reader's COBI choice read from `cpl_theme` in `<head>`); Playfair Display and Source Sans 3 self-hosted in `sierra/fonts/` (OFL, from Fontsource), so the page sends nothing to a third party.
- **Verified**: `npm run a11y -- sierra sierra-dark sierra-asking sierra-asking-dark`, nine widths each: AA (13 painted pairs arriving, 17 asking), 24px targets, focus rings, keyboard (End reaches the latest answer, the docked bar stays on screen, the h1 survives), reduced motion.

**Where the build differs from the mock-up, and why.**
- **The audience words keep the shared labels** (*Student / future student*, *Employer / industry*): the COBI CPL Assistant shows the same list under the same saved key, and `sierra_surfaces_aligned`, `cpl_chat_audience` and the My College tests pin it. Sam ruled *Keep* (Sheet 53 card 1, 22:44Z, his own call).
- **The footer keeps the privacy line** (*Please don't enter personal information; questions are logged anonymously*): a reader about to type must not have to open a panel to learn what is logged (`sierra_header_about`).
- **The box is a one-row textarea that grows**: a phone cut the *Try:* starters off mid-word, and the program question CPL Pathways sends in `?ask=` showed a fraction of itself. Enter sends; Shift+Enter is a new line.
- **New question starts over**: the landing returns and the conversation and its history clear.
- **The audience pick is still required** before the first send (Sam, 2026-07-01), so no word starts selected; a send without one opens the folded row and says where it is.

NEEDS SAM (Sheet 54 card 1): full screen for the docked Sierra on My College and Program Requirements. Sam, 2026-10-08: *"What do you think about having Sierra expand full screen for when responding?"* The proposal: the box expands in place, over the tab, when Sierra starts answering, keeping the tab's college (`scope`), its surface and a signed-in reviewer's session or the team phrase (`credentialHeaders`), none of which the public page sends; *Back to the tab* or Escape returns it, and a reader who goes back stays docked for that conversation until they choose *Full screen* again. The alternative, opening the public page with the thread, answers follow-ups as the public page.

**NEXT.** ③ The docked Sierra on Program Requirements and My College stays compact and gains *Open full screen*, built once Sheet 54 card 1 says which kind. ④ The checkpoint's UI pass audits the new page (its hold in `kb/ui_pass_ledger.json` is lifted).

**The next public page: the veteran map (UI pass, S347).** `veteran-sprint-map/ca_cpl_map_selfcontained.html` passes AA, the 24px targets (its pins through the two directories) and the keyboard at nine widths, and is not First Light: its own palette (navy, CO blue, crimson, gold), 30 raw hex values outside `:root`, the system font stack, no dark mode. Its builder is `veteran-sprint-map/build_selfcontained.py`. After Sierra's port lands, the same order: a mock-up with real assets for Sam, then the port in the builder.

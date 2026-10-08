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

**State: the design is locked; the port is next.** Sam on the mock-up ([Sierra Redesign](https://claude.ai/artifact/JZQhzzC1w2LtoFbSvtjT83), `prototype/sierra_redesign_mockup.html`): *"Love the Sierra mock up. Make the CPL Initiative logo a link to map@rccd.edu"* (built as a link to `https://map.rccd.edu`, the MAP site today's header links; switch to the team email only if he says so), then *"Yes, painting folds away as you designed"*.

**The design, as approved.**
- **Arriving:** a Playfair greeting (*Hello, I'm Sierra* and one line beneath), then the painting in a framed card (rounded, 16:10 desktop, 4:5 phone) with the question bar on its top edge: the input, an Ask button, and the audience chips as words (*Answering for* Student, Faculty, College administrator, Employer, Civic leader; on a phone, one *Answering for: Student* control that opens the row). The placeholder carries a question to try, one per painting. Under the card: the caption (artist, title, year) and Previous, Pause, Next as words. Cycling every 9 s, stopped at the first focus on the input and off under reduced motion.
- **Asking:** the greeting and card fold away; the conversation takes a centered column on paper, the question as a tinted line, the answer as plain text with its sources beneath; a docked bar with *Answering for* and *New question*.
- **Kept out:** the navy header band, the suggestion pills, the bordered audience panel, the two-line footer. The introduction and the beta note live behind *About Sierra*; one footer line remains.
- **Paintings:** seven California works from First Light's set, public domain on Commons, copied by a runner into `sierra/art/` (`manifest.json`, `scripts/fetch_sierra_art.py`, `.github/workflows/sierra-art-fetch.yml`, #1916), so the page sends nothing to a third party.

**NEXT.** ① ✅ #1916 merged. ② Port into `sierra/index.html`, `sierra.css` and `sierra.js`: keep every behavior the tests pin (the audience values sent to cpl-chat, `?ctx=external`, the About control's hover, tap, Escape and outside-click rules, feedback, copy answer, markdown); First Light tokens; `npm run a11y -- sierra` light and dark at four widths; update `tests/sierra_page.test.js` and `sierra_header_about.test.js` for the new structure, never by deleting a check. ③ The docked Sierra on Program Requirements and My College stays compact and gains *Open full screen*, carrying the thread to the standalone page. ④ Then lift Sierra's hold in `kb/ui_pass_ledger.json` so the checkpoint's UI pass audits the new page.

**The next public page: the veteran map (UI pass, S347).** `veteran-sprint-map/ca_cpl_map_selfcontained.html` passes AA, the 24px targets (its pins through the two directories) and the keyboard at nine widths, and is not First Light: its own palette (navy, CO blue, crimson, gold), 30 raw hex values outside `:root`, the system font stack, no dark mode. Its builder is `veteran-sprint-map/build_selfcontained.py`. After Sierra's port lands, the same order: a mock-up with real assets for Sam, then the port in the builder.

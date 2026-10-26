---
title: "Session 491 handoff: Regenerate in the Library, the CPL Opportunity page under library/"
date: 2026-10-26
session: 490 (SkyGooseberry)
tags: [handoff, library, cpl-opportunity, regenerate, funding-model]
status: current
---

# You are Session 491

Your moniker is **SkySalmonberry**. Session 490 (**SkyGooseberry**) was Sam's own session on 2026-10-26, about 13:50Z
to 15:45Z. Its checkpoint was **full** (two Rule 10 receipts, lane state changed). It skipped `kb/README.md` (no KB
structure change) and the Pipeline tab (no roadmap or auditor move). Read, in order: this file, the library lane's
*Regenerate* section (`docs/reference/lanes/library.md`), then `docs/library_lessons.md` S490.

## Who else is working

One other session ran beside S490 on an unrelated topic (*Student-centered CCR classification*, branch
`claude/quirky-brown-o0iogt`, `list_sessions` at 13:54Z). The CPL queue routine's next firing is 05:12Z 2026-10-27.

## What shipped

- **Regenerate** on every Library record (#2472): what to change, the documents to work from (`sources`, a link or pasted
  text), and the request (`regen`), with *Replace the public copy* on a ready draft. Start a piece takes documents.
  Schema applied by supabase-migrate run 40344549167. `scheduled_sessions.md` step 6 says how a run works each request.
- **The CPL Opportunity page moved** to `library/cpl-opportunity/` (Sam, Sheet 131 card 2); `cpl-opportunity/` forwards with
  `?college=` and `#section`. A college page shows the MAP team's notes from `library/cpl-opportunity/notes/<slug>.json`,
  a draft at `<slug>.draft.json` with `?draft=1`.
- **Funding page** (a fork of S490, #2471, merged): the noncredit outcome titles and the five sub-headings are renamable
  on the public page; the noncredit strategy bullets take the credit cards' size. Sam's "NC Priority 1" label lives only
  in his browser's what-if copy: he retypes it with Edit this page.
- **Open Asks Sheet 131** (https://claude.ai/artifact/6SM1HwKbvPWLt5534vhcyV) published and answered; no card is open.

## Decisions Sam made this run

- Sheet 131, 14:55-14:56Z, each his own call: 1 *two-hours* (a daytime Library run), 2 *move*, 3 *keep*, 4 *keep*.
- *"We need to hold on the 365 connector until I can get admin approval from RCCD."*
- To do later: *"make sure the numbers on all tabs on the commons match the commons summaries"* (commons lane).
- Braindump: outcomes as the CCR's richer alignment source, a CER skills catalog on The Commons (vault
  `03-professional/braindumps/braindump-2026-10-26-1445-...`). All later.
- All in `cpl_memory` (`sam-sheet-131-rulings-2026-10-26` and seven beside it, receipt
  `kb/receipts/cpl_library_regenerate_sheet131_2026-10-26_s490.sql`).

## Open work, in order

1. **#2472: merge** (squash) once `test` passes on its head, if S490 did not. Then, once
   `https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=Norco%20College` serves the page,
   apply `kb/receipts/cpl_library_opportunity_urls_library_2026-10-26_s490.sql` on a sibling branch (`kb/migrations/.apply`)
   and read back 12 rows at the new address.
2. **The daytime Library run waits on Sam.** A session's `create_trigger` attaches no repos or connectors here, so he
   creates it on claude.ai's routines page with the paste in `scheduled_sessions.md`, *The daytime Library run*. Once it
   exists, record its trigger id in the library lane.
3. **The funding film** (Sam's item 3: piano in place of the synthesizer, horn and drums kept, the narration added): a
   fork of S490 works it on `claude/funding-film-piano`. If its PR is open, finish it; the lane records the cut.
4. **The UI pass: Privacy** (`privacy.html`) for the first scheduled session of 2026-10-27 UTC.
5. **Hartnell's last reader changes:** CalGETC 45096 (area totals over sub-areas), then Music 43887's repeat counts, then
   RN 03570 on Fable's guarded reading (lessons S488).
6. **Later, Sam's:** the Commons figures to-do (start with the 500 his screenshot showed on `coci_college_programs`; an SQL
   read at 15:30Z returned 20,282 active programs, so the fault is the browser's read); the outcomes braindump.
   **Sierra names tabs the public cannot open** (Sam, ~15:30Z): his instruction `sierra_guidance` 910ebe25 tells her to
   check *COCI Lookup* and the *Catalog Commons*, and she sent a reader there. The sierra-false-absences lane holds his
   words, the two steps and a proposed rewording.
7. **Waiting, as before:** the Coordinator Guide comments; the two S448 offers; the Noncredit CPL Lead; the Baking and
   Nursing JPEGs; Sierra's logo link; one *utilize* in the proposed §55050 text; the two summit refresh notes. The
   implementation-funding lane reads 20,949 bytes against 20,000: move a finished section when that lane next moves.

## Lessons to honor

- **A record's public link moves only after Pages serves the new address** (S490 split the receipt for that).
- **Every folder under `library/` is a copied page to `tests/library_pages.test.js`**, except `cpl-opportunity`.
- **Menu changes save only with a reviewer sign-in**; COBI reads `cobi_nav` on every load, so no deploy is needed.
- **`npm install --ignore-scripts` works in this sandbox** (jsdom installs), so the jsdom tests run locally.

## Let go

S490 held a PR subscription on #2472 and a watch on Sheet 131; both are dropped at sign-off, and this file names
any that were not.

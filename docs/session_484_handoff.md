---
title: "Session 484 handoff: DSP Credit Starting Points Version 2 on the agency template, Open Asks Sheet 129"
date: 2026-10-26
session: 483 (SkyCoyoteMint)
tags: [handoff, library, dsp, agency-visual, decision-sheets]
status: current
---

# You are Session 484

Your moniker is **SkyToyon**. Session 483 (**SkyCoyoteMint**) was opened by hand by Sam at 03:10Z on 2026-10-26 and
checkpointed at about 03:35Z, then carried out Sam's Sheet 129 answers (03:53Z) and refreshed this file at about 03:58Z.
Its checkpoint was **full** (three Rule 10 receipts applied). It skipped `kb/README.md`, `README.md` and the Pipeline tab:
nothing they describe moved. Read, in order: this file, then the item you act on.
[Open Asks Sheet 129](https://claude.ai/artifact/PkU8ut6YUpy6CixkUU84j8) is answered and no card is open.

## Who else is working

No other session ran beside S483. The routine's next firing is 2026-10-26 05:12Z (`trig_01L8K64ZKYb5eALdT4HW6NAV`);
S483 signs off before it, so that firing is the next writer.

## What shipped

- **DSP Credit Starting Points, Version 2** (Sam's S482 ask: redo the DSP visual the way the ELL one was). The hand-built
  page moved onto the agency template: `CPLBrain/04-projects/cpl-initiative/dsp-training/make_brief.py` writes the brief,
  `agency-visual/build.py` paints it. Five cards (Taft and Porterville; Pasadena, West Valley and the HLTH M1053
  medication administration course at 12 colleges), each ending in up to six rows of Training · College · Course ·
  Basis, every line opening on what a DSP *could count toward*. MAP holds no DSPT exhibit (0 of 2,952), so every basis
  is a matching course, with the common course's reach where the CCR names one. Draft:
  https://claude.ai/artifact/K2h4XZQ9oRb2AXbPSJYbPa (CPLBrain#487).
- **ELL IET and DSP Version 2 are the public copies** (Sam, Sheet 129 cards 2 and 3, *replace*): both
  `library/<slug>/` pages rewritten by `scripts/library_page.py` from the v2 pages, both records at version 2 (receipt
  `kb/receipts/cpl_library_v2_public_2026-10-26_s483.sql`).
- **Open Asks Sheet 129**, three cards: 128's two at the same positions, then the DSP public copy. Published with an
  empty store, answered in full at 03:53Z, carried out; the builder holds no card. The Library's series record `open-asks-sheets` moved from 123 to 129 (sheets 124 to 128 had
  skipped it; receipt `kb/receipts/cpl_library_open_asks_sheet129_2026-10-26_s483.sql`, run 40264078101, read back).
- **The library lane under its 20,000-byte budget:** the finished GitHub Pages and Changes to make sections moved
  verbatim to `docs/library_lessons.md`. `agency-visual/build.py` no longer leaves `__pycache__` in the vault.

## Decisions Sam made this run

- `sam-sheet-129-rulings-2026-10-26` (verified): Sheet 129, 03:53Z, each his own call: 1 *proposed* (he pastes the
  memo's opening on the funding tab), 2 *replace* (ELL IET Version 2 public), 3 *replace* (DSP Version 2 public).

## Open work, in order

0. **The memo's opening waits on Sam's paste** (Sheet 129 card 1, *proposed*). Check `cpl_funding_config`
   (`updated_at` read 01:23:35Z at 03:55Z) before saying it is done; the text to paste is `MEMO_LEAD_PROPOSED_128` in
   the vault's sheet builder. Nothing else waits on him from this run.
1. **The UI pass: Privacy** (`privacy.html`), for the first scheduled session of 2026-10-27 UTC.
2. **The Coordinator Guide** waits on Sam's comments under Changes to make (handoff 482 item 2 stands).
3. **The harvest's catalog sweep** when items 0 to 2 wait (114 of 118 colleges complete; 20,282 active, 13,173
   complete, read 03:30Z).
4. **Waiting, as before:** Sam's two passages in the old words (`nc_rules`, `college_intro`; `nc_rules` still names a
   strike team); the Noncredit CPL Lead on the landing pages; the Baking and Nursing JPEGs; Sierra's logo link; one
   *utilize* inside the proposed §55050 text; the two summit refresh notes until someone names the summit's date. DSP:
   the DSPT guides' text and the Medication Administration Skill Check Guide still unread (dds.ca.gov does not resolve
   from a session); online and CVC delivery unconfirmed.

## Lessons to honor

- **Read the clock before you stamp a time.** S483 wrote read times from a guessed clock (~03:55Z for a read at 03:16Z)
  into two receipts and the sheet register, and corrected them before merge. `date -u` costs nothing.
- **Each new open-asks sheet updates the series record** `open-asks-sheets`; five sheets in a row skipped it.
- **The CCR names a college with a trailing space** (`Cypress College `); strip names before comparing. The COCI
  lookup's common-course ids date from July, so take ids from `unified_courses_members.js` and use the COCI list only
  for a course the CCR does not hold (PSYT P020F).
- **A field-facing page leads with what is possible** (Sam, S482); a card with no MAP precedent says the first college
  sets the precedent others adopt.

## Let go

S483 drops its PR subscriptions at sign-off (#2458 and CPLBrain#487 merged; the follow-up PR once merged) and set no
check-in. The two artifacts it published (DSP v2, Sheet 129) carry wake subscriptions from their publish.

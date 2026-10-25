---
title: "Session 471 handoff: the noncredit attestation is live on the funding page; every public Library piece opens on GitHub Pages; the Veteran map passed its UI review"
date: 2026-10-25
session: 470 (SkyBlueCurls)
tags: [handoff, implementation-funding, noncredit, attestation, library, ui-pass]
status: current
---

# You are Session 471

Your moniker is **SkyPenstemon**. Session 470 (**SkyBlueCurls**) was opened by hand by Sam at 04:25Z on 2026-10-25 and
ran a **full checkpoint** (a Rule 10 data receipt and two lanes moved). It skipped `kb/README.md` (no KB structure
changed), `README.md` (no new tab) and the Pipeline tab (the pipeline did not move). Read, in order: this file, then
`docs/reference/lanes/implementation-funding.md` (the noncredit paragraph), then the S470 section of
`docs/cpl_funding_lessons.md`, then the item you act on.

## Who else is working

At 04:26Z `list_sessions` showed this session alone. The CPL Queue routine (`trig_01L8K64ZKYb5eALdT4HW6NAV`) fired at
05:12Z, found S470 working and stood down; its next firing is 06:12Z, then hourly until 13:12Z (06:12 Pacific). If it starts first, it is
SkyPenstemon, and a session Sam opens later agrees one writer with it per `docs/reference/scheduled_sessions.md`.

## What shipped (all merged to `main`)

- **#2432:** the ironworker film's Library record links its Pages address (guarded UPDATE, receipt
  `kb/receipts/cpl_library_ironworker_pages_url_2026-10-25_s470.sql`, run 40162123856, read back). Every publicly listed
  piece now opens at cpl-initiative.github.io. Sam's two edits of that record only listed it; the old link was the
  seed's. Also the **Veteran map's UI pass**: clean in light, dark and embed, tokens only, Light-first as #2428 meant;
  nothing to fix (ledger recorded).
- **#2433, the noncredit attestation** (Sam's Sheets 113 and 114): `kb/supabase_cpl_funding_nc_attestation.sql`, one
  row per college and fiscal year, attest-first, the CO's Reject then Re-confirm or Remove. *Attest for the noncredit
  share* sits under each noncredit share's Minimum Conditions, for everyone, the public page too. The `_pub` view
  publishes the coordinator's name and title for this fiscal year and the next; `cpl_funding_nc_attestation_review()`
  gives the CO the attestor, the reported award count (1 to 9 masked for the team phrase), the portfolio course and the
  exhibits. No coordinator email (the equity test's PII guard). Folded into DR-09. Guard
  `tests/cpl_funding_nc_attestation.test.js` (23). **Applied 05:50Z** (run 40166859960, after the code reached Pages)
  and read back: anon holds the eight published columns, no email; empty. **#2436** carries the receipt and returns
  `kb/migrations/.apply` to main's content.
- **#2434:** `docs/ccr_atlas_lessons_archive.md` fits its 150 KB budget (five sections moved verbatim to archive 2).
- **#2435, this checkpoint:** the funding lessons (S470), the oldest funding lesson to archive 2, the lane's finished
  S468 clause to the lessons, the native-Postgres path in the PGlite playbook, four `cpl_memory` rows
  (`kb/receipts/cpl_memory_2026-10-25_s470.sql`), this handoff, CPLBrain's session note.

## Decisions Sam made this run

None: S470 carried out Sheets 113 and 114 and the handoff's queue. The calls inside the build (the form public, as the
opt-in's is; no coordinator email; the year lapsing on July 1) follow his rulings, and the lessons record each.

## Open work, in order

0. **Sam sees it live.** The funding page (Scenario 4): each institution with a noncredit share reads *Strike-team
   attestation not yet on file* and offers *Attest for the noncredit share*. Fix what he finds first.
1. **The noncredit builder** (the lane's NEXT): `nc_exh` through the four channels, `nc_cdcp` for every roster
   institution, `nc_course` from the attested control number confirmed in COCI, in `funding/_build_funding_performance.py`.
   The attestation's `attested_exhibits` and `portfolio_course` are reviewer-only: the builder reads the table with the
   service role. Then *How to meet it* for the two noncredit conditions, and the memo's noncredit paragraph.
2. **The UI pass:** `python3 scripts/ui_pass.py --next` names the next view.
3. **`oversized_doc`, 3 left:** `roadmap_archive.md` 4.98x, `cpl_funding_lessons_archive.md` 2.8x, the harvest lane
   1.34x. The archives split the way #2434 did: move whole sections verbatim, oldest stays first.
4. **Waiting:** the NC CPL Lead on the landing pages; Sheet 121 card 2 (Sam's four Coordinator Guide files); Baking and
   Nursing until their JPEGs reach the Drive folder *Photos*. Sierra's logo still links to map.rccd.edu (his Sheet 53
   call): ask before switching it. `house_voice` flags one *utilize* in `docs/t5_55050_amendment_package_draft.md`.

## Lessons to honor

- **The migrate receipt commit runs no CI.** The workflow's own token starts no workflow, so the PR head has no `test`;
  and any later push re-applies while `.apply` differs from main's. The next commit carries the PR's real follow-up and
  sets `.apply` back to main's content (#2436).
- **A schema a page reads goes live after the page's code.** Push the `.apply` branch once the new JS is on Pages
  (`curl` the file and grep for a new symbol).
- **`tests/run.js` takes no file argument**; it runs the whole suite. Run one file with `node tests/<file>.test.js`.
- The sandbox's Postgres 16 works with its cluster under `/var/tmp` (`su postgres`); the scratchpad's permissions reset
  mid-run. Playbook: `docs/kb-notes/playbook-test-a-database-function-locally-with-pglite.md`.
- `cpl_memory.summary` is capped at 400 characters; longer text goes in `detail` (4,000).
- CLAUDE.md sits at about 59,970 bytes against its 60,000 budget: measure before adding a word.

## Let go

S470 drops its watches on #2435 and #2436 at their merges (#2432, #2433 and #2434 were dropped at theirs). No check-in
is scheduled and no artifact watch is held.

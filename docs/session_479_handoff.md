---
title: "Session 479 handoff: the funding page in two columns and the library look; the Noncredit CPL Lead"
date: 2026-10-25
session: 478 (SkyTidyTips)
tags: [handoff, implementation-funding, noncredit, sierra, public-page, ci]
status: current
---

# You are Session 479

Your moniker is **SkyMilkmaids**. Session 478 (**SkyTidyTips**) was opened by hand by Sam at 14:06Z on 2026-10-25
with five funding-page asks and two more mid-turn. It shipped all of them in #2446 (squash 6ed85331, merged 16:49Z).
Its checkpoint was **light**: no Roadmap row moved, no re-mint, no Rule 10 write (six `cpl_memory` rows, receipt
`kb/receipts/cpl_memory_2026-10-25_s478.sql`). It skipped `kb/README.md`, `README.md`, the KB notes, the Pipeline tab,
the CLAUDE.md row and the sheet rebuild (Sheet 127 is unchanged and current: no replies at 14:10Z). Read, in order:
this file, `docs/session_475_handoff.md` (its open work 0, 2, 3 and 5 still stand), then the item you act on.

## Who else is working

No other session ran beside S478. The routine's next firing is 2026-10-26 05:12Z.

## What shipped (#2446)

- **Two funding columns.** The College table shows Max Funds and Curr Funds; each priority and noncredit outcome row
  carries its own figure there, hovers and Unit sources with it. The CR/NC split waits in the Columns menu (store
  `cplfund_cols_v3`); the CSV keeps it. The drill-in's "Reported, not funded" line and the headcount and Census
  sources left the table. Base/Cap chips hang left of the amount in regular weight; Confirm links sit at the
  Institution cell's right edge.
- **The Noncredit CPL Lead.** The condition, the attestation form and the How to meet it passage name the Lead; the
  strike-team condition retires (`ncTeamShown()` off unless a layer restores it). The attestation affirms the Lead
  meets regularly with the CPL Coordinator.
- **The Report fold.** The Reporting box opens folded behind a Report word naming the nearest report deadline not met
  (`nextReportDue`, from the timeline's report milestones). The timeline renders in date order everywhere
  (`timingOrder`); edits keep the stored position.
- **Sierra's side bar** opens Light beside the funding page; in the bar her header row (About Sierra) stands down;
  her links and starters read in regular weight.
- **funding-model/ in the library look**: palette, Georgia/system type, the public header (links, no theme words), the
  gold rule, the navy foot, a three-column Contents whose fixed links a curator renames (`pubLinks`, `data-plink`).
  a11y clean at 9 widths and with Sierra open. Guard `tests/cpl_funding_s478_asks.test.js`.

## Decisions Sam made this run (all `cpl_memory`, verified)

- `sam-noncredit-cpl-lead-strike-team-retired-2026-10-25`: "use the term Noncredit CPL Lead"; his first condition now
  reads "CPL Coordinator and Noncredit CPL Lead assigned (on MAP and the configured college CPL Landing Page) and
  meeting regularly"; he struck the strike-team checkbox.
- `sam-funding-table-two-columns-2026-10-25`, `sam-report-fold-timeline-order-2026-10-25`,
  `sam-funding-page-library-look-sierra-light-2026-10-25`.
- `sam-funding-page-light-only-2026-10-25`: "Let's just leave it light only". No dark palette for the funding page.

## Open work, in order

0. **Read Sheet 127's replies** (https://claude.ai/artifact/VfX9JnaA5j3ESubzHKYc3A, `replies`), as handoff 475 item 0.
1. **The UI pass: the Fact Sheet**, as the first scheduled session of 2026-10-26 UTC (handoff 475 item 3).
2. **Sam's two saved passages still use the old words** (his to edit on the tab, never SQL): `nc_rules` ("noncredit
   CPL coordinator ... CPL Strike Team") and `college_intro` ("Max CR Funds and Max NC Funds"). Say so once if he asks.
3. **One memory UPDATE still waits** on a person's confirmation (handoff 478 item 2), guarded and safe to rerun.
4. **Waiting:** as handoff 475 item 5 and handoff 476 item 3.

## Lessons to honor

- **A local render of the funding page shows the baked defaults** ($75,000 base, Confirm by 11-01-26). Serve the
  newest `tests/fixtures/cpl_funding_config_*.json` to `/rest/v1/cpl_funding_config` before showing Sam a picture
  (`procedure-render-funding-page-with-live-config-2026-10-25`).
- **A failing CI shard can end its log with no summary**: `tests/run.js` reports by `console.log` to a pipe, then
  `process.exit` drops the tail. Run that shard's likely suites locally (`pitfall-run-js-summary-lost-on-ci-shard`).
- **A renamed label breaks pins in twenty files.** Grep the tests for the old words before pushing, then run them
  four at a time; each funding suite takes 60 to 90 s here.

## Let go

S478 holds no PR subscription, no check-in and no artifact watch.

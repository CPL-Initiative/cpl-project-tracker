---
title: Session 308 handoff — build the Reporting box's college half on MAP's two contacts
date: 2026-09-30
session: 307 (SkyGusset)
tags: [handoff, implementation-funding, reporting-box, public-view, my-college, style-guide, decision-sheet]
status: current
---

# You are Session 308

⚠️ **Two chains, two handoffs (Sam, 2026-09-30).** A parallel session on Sierra's data carries
`session_309_handoff.md`. This file is the **funding chain's**; if the greeting names 308 and 309 exists,
read this one for the funding work and leave 309 to the Sierra chain.

Your moniker is **SkyBracket**. SkyGusset (S307) shipped the Reporting box's reviewer half (#1782), took
Sam's four Public view asks plus a fifth (the published scenario opens) into #1783, and filed the CO style
guide. Check #1783 on its current head before anything else: merge it on green `test` if S307 did not.

## First, in this order

1. **The Reporting box's college half** (Sam, sheet 7 card 1, 17:09Z: *MAP's two contacts*). A person MAP
   lists as a college's CPL coordinator or primary CPL contact signs in with the reviewer email link
   (`reviewer_signin.js` already sends `create_user: true`) and sees that college's reports on My College,
   read only, for every college MAP lists the address under. Build a SECURITY DEFINER read, e.g.
   `cpl_funding_my_reports()`, that matches `auth.jwt() ->> 'email'` against `map_college_contacts`
   (`cpl_coordinator_email`, `primary_contact_email`, lowercased, trimmed) and returns only those colleges'
   rows. ⚠️ Rule 10 b2: `revoke execute ... from public` (name `public`), then grant to `authenticated`,
   and check `has_function_privilege('service_role', …)` first. ⚠️ The college key: `map_college_contacts.college`
   is MAP's name; the funding roster's is short (`window.cplCollegeShort` maps them). Governance: a new
   read surface for college staff is a decision-rights change (Rule 10 a3) — record it under DR-09 in
   `kb/governance_surface_map.json` and say so in the PR. Measured 2026-09-30: 105 of 123 colleges list an
   address (49 coordinator, 99 primary); three district staff are listed for three or four colleges.
2. **Sheet 8 is answered** (Sam, 18:52Z: *curate*). The curated page is CPL-Initiative/cpl-knowledge-base#24,
   a draft Sam reviews and merges; never merge it from a session. Answer any review comment there. The
   public MAP brand page's CCCCO palette differs from Brand Basics; it is flagged in #24 as a separate call.
3. **Card 1 of sheet 6** still waits on Sam's rewritten Scenario 2 script (ElevenLabs, then rebuild `n2`).

## Sam's decisions this run

- **Sheet 7 card 1:** college staff see their reports through MAP's two contacts (`cpl_memory`
  `sam-college-staff-see-reports-map-contacts-2026-09-30`).
- **The published scenario opens** every visit (*"make the published scenario the default view that opens"*).
- **As colleges see it** in the Public view; **My CPL Funding at the top** of the Public view and the
  explainer, by college or district, with **a PDF on every My CPL Funding view**; the margin audit; the videos
  link back.
- **The CO style guide** governs our writing and CO colors and identity, with **no UI change from it**
  (verbatim in `cpl_memory` `sam-cccco-style-guide-governs-writing-2026-09-30`).

## What shipped (S307)

- **#1782:** `cpl_funding_reports` (INSERT-only; reviewer RLS; UPDATE/DELETE revoked; recorder stamped by
  trigger; its own Data API grants) and the box in the drill-in. Guard `cpl_funding_reporting_box.test.js`.
- **#1783:** `loadSelection()` no longer restores the scenario; `state.publicEye`; `?fundview=public`;
  `showMyFunding()`; the `d:<district>` choice; `CPL_COLLEGE_BRIEFING.printPanel`; the explainer's header
  gutter and the COBI-only phone padding; three a11y targets; the videos' two links; the style guide note and
  its `CLAUDE.md` pointer. Guard `cpl_funding_public_view_asks.test.js`; `refresh_sources` 6b now counts
  the Institutions group.
- Vault: samueltlee/CPLBrain#202 (the guide, the palette, the session note).
- KB notes: [`reference-cccco-style-guide`](kb-notes/reference-cccco-style-guide.md),
  [`methodology-an-a11y-sweep-does-not-measure-alignment`](kb-notes/methodology-an-a11y-sweep-does-not-measure-alignment.md).

## Read in order

1. This file. 2. [`implementation-funding`](reference/lanes/implementation-funding.md). 3. The S307 section of
[`cpl_funding_lessons`](cpl_funding_lessons.md). 4. `funding/supabase_cpl_funding_reports.sql`.
5. [`reference-cccco-style-guide`](kb-notes/reference-cccco-style-guide.md) before any outward prose.

## Patterns that worked

- **Mutation-check every new test,** one break at a time, each with its own backup file.
- **Probe edges in Chromium** for a layout ask; the a11y sweep does not measure alignment. Remove
  `.cplfl-overlay` first; give a lazy-loaded view 3 seconds.
- **Run the lints job's Python steps locally** before a push that adds a table: `supabase_table_grants_test.py`
  caught the missing grants on #1782's first push.

## Safety patterns

- ⚠️ The repo's SQL guard blocks any statement containing INSERT outside `cpl_memory`, rolled back or not;
  verify a gate from `pg_policy` and `has_table_privilege` instead.
- ⚠️ The funding lane (19,880 of 20,000 bytes) and lessons doc (~119,700 of 120,000) are at their caps:
  move settled text out before adding. `CLAUDE.md` is at 59,984 of 60,000.
- ⚠️ A branch deleted on merge rejects `--force-with-lease`; push plainly.
- ⚠️ `scripts/check_generated.sh` after the last edit, then the push.

## Carryover

- Still Sam's, in the tab: Priority 1's new wording (sheet 6 card 7); When and Where on the two reported
  cards; card 7 of sheet 3's two old lines; the Supabase tool setting question.
- The style guide's rendered-text divergences (bare *CCC* on the fact sheet, *$35M*, ISO dates) wait with every
  other UI change; they are listed in the note.
- Not refreshed: `kb/README.md`, `README.md` (no structure change); the Pipeline tab (the pipeline did not move).

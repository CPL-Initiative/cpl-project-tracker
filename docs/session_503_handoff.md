---
title: "Session 503 handoff: My Institution hidden, the funding review gate in CI, Sierra's deploy held on its A/B"
date: 2026-10-27
session: 502 (SkyHuckleberry)
tags: [handoff, implementation-funding, funding-public, sierra-page-redesign]
status: current
---

# You are Session 503

Your moniker is **SkyElderberry**. Session 502 (**SkyHuckleberry**) ran 2026-10-27 ~16:40Z to ~19:10Z on Sam's
priority, the public funding page. This checkpoint was **full** but compact (context at ~108K): it skipped
`kb/README.md`, `README.md`, the Pipeline tab and the `kb/status` run logs (none moved); no KB note crossed the bar.

**The 7th Annual CPL Summit is Friday 2026-10-30.** Nothing on the public funding page may regress before then.

## What shipped (all merged unless marked)

- **#2513 My Institution hidden, code kept** (Sam: *"hide the My Institution and save the code"*; *"hiding the Step 1 and
  2 at the top and any other link to it"*). One switch, `oneViewOn()` in `cpl_funding.js`
  (`window.CPL_FUNDING_ONE_VIEW === true`, read by `college_briefing.js` too). Off: no Step 1 or 2, PDF prints at once,
  every way in opens the institution's row. The view's suites and the `funding-model-mycpl` a11y target turn it on.
- **#2515 main's `pii_guard` red fixed.** The daily run had baked a reviewer's sign-in address into
  `credential_reference_data.js` as `curated_by`; `_public_curator()` in `excel_to_dashboard.py` now writes cohort ids,
  the team mailbox, or "reviewer".
- **#2499** (narrated cut, Draft 4), **#2511** (Sierra: no header, links, reads the asker), **CPLBrain#514** (Sheet 136
  answered) merged.
- **#2514 the review gate, OPEN, in CI** (branch `claude/funding-request-review`, head after a main merge). The database
  half is **live**: `cpl_funding_college_map` (select only for anon/authenticated), `cpl_funding_email_domains()`,
  `cpl_funding_email_domain_ok()`, and the domain check on `cfp_insert_self` and `cna_insert_self` (receipts
  `kb/receipts/migration_s500_funding_request_review*_4055*.json`; grants applied as `s500_funding_college_map_grants`).
  Verified live: Norco's domains are norcocollege.edu, rcc.edu, rccd.edu; rccd.edu passes, gmail fails. ⚠️ **Until #2514
  merges, the live page still counts a request on submit** (both tables were empty when checked).

## Decisions Sam made (in `cpl_memory`)

`sam-funding-hide-my-institution-ruled-2026-10-27` and `-scope-` (built, #2513);
`sam-funding-public-domain-check-csm-accept-2026-10-27`, `-review-magic-link-` (built, #2514). No new ruling this run.

## Open work, in order

1. **Merge #2514 on a passing `test`.** Its last two reds were this PR's own and are fixed: `cpl_funding_equity`'s guard
   (no `coordinator_email` in `cpl_funding.js`; Accept's mail now goes to the requester alone, a reviewer copies the
   coordinator by hand) and `cpl_funding_row_legibility` (the Confirm chip's condition). If a shard dies with no summary,
   find the file locally (lessons, S502): compute the shard with `tests/lib/shard.js`, run the suites that load
   `cpl_funding.js`, four at a time. After merge, check the lane's size (`oversized_doc`): #2514 adds a paragraph.
2. **Sierra's deploy is held.** A/B 40557355204 found 4 regressions (7q, 7v twice, 7x) and 3 fixes; a re-run (attempt 2,
   same id) was dispatched at ~19:00Z. If it comes back with no regressions, dispatch `cpl-chat-deploy.yml` with
   `confirm=DEPLOY` (the standing A/B authorization), then `cpl-chat-smoke.yml`. If 7v and 7q fail again, read the
   candidate's answers (the artifact) for READER_RULE's plain wording dropping course numbers; do not deploy; bring
   Sam a sheet card if the fix is a wording call. Delete the preview function once a candidate ships.
3. **Friday morning (10-30):** `npm run a11y` on the ten public targets (they passed on 82ea5ce5 and, for the three
   funding targets, on #2513's head this run).
4. **The recorded piano** (handoff 502 item 6): Salamander samples, a new 46 s sample to Sam before any re-render.

## Lessons to honor

- **Read the source-scan guards a change touches before writing it** (`cpl_funding_equity`, `row_legibility`).
- **A bot's push starts no CI**; a real change (a base merge) gives CI a head. Never an empty commit.
- **New tables here get ALL privileges by default**; every migration carries its own revoke and grant.

## Let go

Subscriptions held at sign-off: #2514 (watch it to merge). Check-ins armed: none beyond what the next session arms.

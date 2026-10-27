---
title: "Session 495 handoff: Sierra's MAP links live, COBI's menu is navigation, axe joins the accessibility runner"
date: 2026-10-27
session: 494 (SkyWhortleberry)
tags: [handoff, my-college-action-page, sierra-retrieval-corpus, implementation-funding, accessibility]
status: current
---

# You are Session 495

Your moniker is **SkySalmonberry**. Session 494 (**SkyWhortleberry**) was Sam's own session, 2026-10-27 ~00:50Z to
~03:00Z. Its checkpoint was **full** (two lanes moved, a memory receipt). Skipped: `kb/README.md` (no KB structure
change), `README.md` (no new surface), the Pipeline tab (the M-ID pipeline did not move), a new KB note (the axe
learnings went into `methodology-geometry-is-half-an-accessibility-audit`). Read, in order: this file, the
implementation-funding lane (*WCAG 2.2 AA FOR THE CPL SUMMIT*), the my-college-action-page lane (*Sierra carries it
too*), `docs/cpl_funding_lessons.md` S494, `docs/college_action_page_lessons.md` S494.

**The 7th Annual CPL Summit is Friday 2026-10-30.** Nothing on the public funding page may regress before then.

## What shipped

- **#2490** S493's checkpoint. Its memory receipt had failed twice on apply (a null `related`, then a 438-character
  summary against the 400 limit); S494 fixed both and read the four rows and the Library's Sheet 134 record back.
- **samueltlee/CPLBrain#506** Sheet 134 retired, S493's session note (its coverage check passed once the tracker PRs
  merged).
- **#2491 Sierra's MAP links** (Sheet 134 card 2, the second part), deployed 01:44Z (cpl-chat-deploy run 40434182175):
  a question naming a college lists, under each credential it could adopt, one link per building college. Smoke mode 17
  (Norco) passed on production twice.
- **#2493** the lints race: git's detached auto-maintenance raced `rmtree` in `docs_audit_test.py`'s temporary repos.
- **#2494 COBI's side menu is navigation** (axe critical, every COBI route): no tab roles, `aria-current="page"` on the
  open button, the panes no longer self-named tabpanels. Guard `tests/cobi_nav_semantics.test.js`.
- **Sam's side session 01V74v72G5Sou1WaWEsnL9aN** (*CPL Initiative Workplan Update draft*) shipped **#2486** (the
  Library record for the Workplan Update, Accomplishments - November 2026, built from the May report) and **#2489**
  (Library: *File it* on the In development card moves a brief to Draft; a dateless record takes the day). It holds
  nothing; its last word to Sam: set the Workplan record's Status to Draft in Edit to put it back at step 2.

- **#2492 axe in `scripts/a11y.js`** (merged 02:5xZ): axe-core 4.10.2 pinned, run once per route before the
  focus-ring loop, an `axeDisable` reason required, a throwing target fails without ending the sweep. `npm install`
  before `npm run a11y` in a fresh container, or the runner stops and says axe is missing.

**Open at sign-off, mine:** **#2495 the first axe fixes** (the dashboard's and TMC Builder's unnamed selects,
SkyView's grip value, the public veteran map's directory rows as native buttons inside list items). Its `test` was
re-running after a push that moved `public_pages_a11y.test.js` to pin the new rows (57/57 locally). Merge on `test`.

## Decisions Sam made this run

None; he started the session with the queue. No card is open (Sheet 134 answered and retired).

## Open work, in order

1. **Merge #2495** on a green `test`, if S494 did not.
2. **The narrated funding film:** re-read scene 8 (Minimum conditions: a CPL coordinator and a Noncredit CPL Lead) in
   Sierra's voice (`prototype/funding_video/README.md`), keep the other ten reads (`voice_s2/`), rebuild n2 on v11,
   offer the narrated cut beside the music film (Sheet 133 card 1).
3. **The morning of 10-30:** `npm run a11y -- funding-model funding-model-sierra funding-model-mycpl funding-model-howto
   funding-public funding-memo funding-film fact-sheet public-library sierra` on main. All ten passed on 2026-10-27, and
   with axe once #2494 merged; `npm run a11y` carries axe since #2492. ⚠️ Never leave out `funding-model-mycpl`.
4. **The rest of the axe findings** (internal tabs; the whole sweep ran in two batches, 129 targets, *The axe sweep*
   below). Critical, unnamed selects: the CCR list view (10, `#uc-kind` and its neighbors), the Common Subjects
   table (`#cs-filter`), MAP Users' roster (`.mapu-select`). Serious: TMC Builder's rows (`role="button"` holding
   controls, 45), EACR's `summary` targets (59 on the matrix, 1 on the table), Program Requirements' filter target
   (1), the funding section summary holding a control (1, curator views too), the Activities metric units' contrast
   (7), Memory's record status contrast (2). CER Procedures' two targets timed out in their seed under load; run
   them alone. Work them with `/a11y-pass`, triage first; a select's fix is an `aria-label` or a tied `<label>`.
5. Carried: Malone's tab parameter for `mapLink()` (MAP reads `exhibit`, `Exhibit`, `search` only); Sierra 7q (*"an
   inactive COCI record"*), Hartnell CalGETC 45096, the daytime Library run, Music 43887 and RN 03570, the Commons
   figures to-do, the harvest lane file's size (`oversized_doc`, 20,753 of 20,000).

## The axe sweep (S494)

The first full `scripts/a11y.js` run with axe crashed at target 47 of 129 (governance-editor's seed timed out under
load; it passes alone). The runner now fails such a target and goes on; the remaining 82 ran in a second batch
(18 failed checks across 81 routes, all listed in open work 4; two of them CER Procedures' seed timeouts).
Findings are in the open work above. Production smoke after the Sierra deploy: attempt 1 failed only 7x (the ELL IET
answer named one grantee), attempt 2 only mode 9 (`Search failed`, a vector-search timeout before the new code runs).
Neither mode reaches the change; `cpl_memory` `risk-smoke-7x-and-9-load-flakes-2026-10-27`.

## Lessons to honor

- **A receipt's summary has a 400-character limit and `related` is not null.** Coalesce `related` to `'{}'` and
  measure every summary before `.apply`; the repo's Supabase guard blocks a rolled-back dry run, so read the schema.
- **Run axe before anything that scrolls** (the focus-ring loop leaves tables under sticky headers).
- **Two Sierra tests lift a long span of `index.ts`**; keep network fetchers beside `fetchStatewideCatalog`.
- **A PR that changes what a script reads changes the dependency map**: run `scripts/check_generated.sh` on every
  branch before its push (#2492's lints failed on it once).
- **Trace a smoke failure's route before re-running**: 7x names no college, so it could not reach the MAP index.

## Another session

None live. The CPL queue routine fires next at 05:12Z and reads this file.

## Let go

S494 drops its subscriptions on #2492 and #2495 at sign-off. No check-ins or artifact watches were set.

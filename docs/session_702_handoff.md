---
title: "Session 702 handoff (from SkyMurre, S701, Sam's plain session of 2026-11-22: Subjects Edit and Save, the noncredit hold lifted, two credit catalogs, the build honors saves)"
created: 2026-11-22
updated: 2026-11-22
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing.** This handoff is for Sam's next plain session. A CPL Queue routine firing follows
`docs/session_699_handoff.md`, never this file.

# You are SkyRazorbill (Session 702)

From SkyMurre (S701), Sam's plain session of 2026-11-22 from 03:09Z, on Fable 5.2 with Opus workers. A **full
checkpoint**: the run wrote a Rule 10 data write (Sam's 30 Cerritos subject decisions into `kb_curation`). Skipped:
steps 2 and 3 (no KB or README surface moved), 7 (no re-mint, no Roadmap row), 9 (its own queue item) and, in 12,
`kb/status/program-requirements.json` (the routine's run log). `kb/status/subjects.json` is restamped.

## Open with the standing block (COBIx on #3358, 21:20Z 2026-11-18, corrected 21:36Z; Sam's rule for the next two or three sessions)

0. **COBIx's brief is on issue #3358**: read it, and comment 7064588752 (Sam's two rulings of 2026-11-21). **Then
   read issue #3655 whole**, the Subjects brief. No new `<!-- cobix -->` comment since the 2026-11-21 brief as of
   08:51Z on 2026-11-22; issue #3665 holds COBIx's sources for that brief and asks nothing. This session posted no
   status comment on #3655.
1. **Restart the COBIx watcher:** `bash scripts/cobix_watch.sh [state dir]` in the background, and read its output
   yourself every few turns. It stops at the two-hour background limit; after that, poll with `COBIX_WATCH_ONCE=1`.
   Act on each new `<!-- cobix -->` comment.
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1` when history is not needed),
   never a full clone, for every session and worker.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from
   `main` right before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints
   match. COBIx reviews do not gate a merge (`r-cobix-review-never-gates-merge-sam-2026-11-21`).
2a. **Sam's work order (2026-11-20):** collection comes first, data waves before fixes, and a fix goes ahead of the
   next wave only when it blocks it or would file wrong rows (`r-collection-first-sam-2026-11-20`). Collection serves
   the M-IDs, so its fixes are ranked by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
3. **Merge order:** #3666, #3667, #3669 and #3670 are merged; #3671 below; this checkpoint's PR merges at sign-off.
   Dependabot's #3383 waits.

## What shipped (squash-merged, `test` green on each head)

- **#3666 `2dee2143`:** Edit and Save on the Subjects page (`commons_subjects.js`): one `kb_curation` row per
  decision, `field` `subject_decision`, key `SUBJ:<college>|<code>|<band>` (`credit` or `whole`), value JSON with
  `local_title` and or `common_code`. *Take it back* removes only the signed-in reviewer's own save. Governance entry
  `field:kb_curation.subject_decision` maps to DR-25. **The data write:** applied 2026-11-22T04:45Z, 0 `SUBJ:` rows
  before, 30 inserted under cohort `subjects-s701@bot` (29 credit, AP `whole`, ATH as KINE), md5 equal to the
  committed file's; receipt `kb/migrations/2026-11-22_s701_subject_decisions_receipt.json`, rollback beside it.
- **#3667 `b9bf7661`:** the noncredit hold lifted on Sam's word; the 54 held rows are ordinary rows; noncredit and
  noncredit enhanced shown apart. Two of four measured title conditions feed a recommendation (the lane has the counts).
- **#3669 `792c1043`:** Santa Ana's and Mt. San Antonio's credit catalogs filed (`kb/_file_credit_catalogs.py`); Not
  read yet 388 to 156, titled 1,412 to 1,636, courses 18,966 to 22,278. Two issuer-tag entries fixed a red
  `issuer_tags.test.js` on main.
- **#3670 `990af42a`:** the daily build reads saved decisions (`kb/_sync_subject_decisions.py`,
  `kb/subject_decisions.py`); codes with a common code 888 to 918. Shell titles stay held; the mint plan equals main's.

## PR #3671

Open at this writing, head `8f825be4`: noncredit saves keyed `SUBJ:<college>|<code>|nc:<category slug>`; 275 codes
get a noncredit form, 64 span several categories, 37 have no category on file. It waits on a second reader's verdict.

## Decisions Sam made (in session)

1. **2026-11-22, on the draft noncredit title list:** *"Looks good. Based on a quick check on my phone. Can we go
   with it and I can look more closely tomorrow and reverse or change anything that looks wrong?"*
   (`r-noncredit-title-list-go-sam-2026-11-22`).
2. **2026-11-22:** *"Coci has a credit, noncredit, noncredit enhanced indicator"*
   (`f-coci-credit-status-three-values-sam-2026-11-22`).
3. **2026-11-22, on progress:** *"keep rolling. All looks good to me!"* (no row).
4. **About 2026-11-22T10:00Z, three asks with a screenshot of `#commons/subjects`**, your FIRST Subjects work
   (`r-subjects-edit-counts-full-width-sam-2026-11-22`); he said *"do not make any changes on these; just advise and
   add them to be addressed in the next session"*, so nothing changed for them:
   *"I don't see how I can take action on subjects that need edit, such as all the AEDs that are in ELEC erroneously.
   need to be able to take action easily when signed in from all subject surfaces"*, corrected at about 10:05Z:
   *"cobi header has a sign in control so the page doesn't need it"*; *"on the main tab, there is no
   sidebar to view the courses assigned to the subjects for the counts, which should be clickable"*; *"the subjects
   surfaces should use the full width of window, which is a design standard"*. The session's advice is the starting
   design, his to change (open work item 1).

## Decisions the session made (each his to revise)

The four categories with no common code keep none (`d-noncredit-four-categories-no-code-s701`); a title condition
measured under half right feeds no recommendation; a shell title is never routed by a person's subject decision; a
code's local title lives on its dominant noncredit category's row. The memory rows are drafted in
`kb/migrations/2026-11-22_s701_cpl_memory_rows.sql` (11 rows, rollback beside it).

## Open work, from the lanes' NEXT lines

1. **`commons`, the Subjects page (#3655), in order.** First, Sam's three asks of about 10:00Z:
   (a) **Edit from every surface.** Today Edit is reachable only in the course panel, from a local code on one
   college's view, and no row says so. Build an Edit word on every row of every Subjects surface (all subjects, a
   college's list, codes with no title, held codes, the noncredit list), with the form opening in the panel wherever
   the row is. The surfaces read the session from COBI's header control (Sam, about 10:05Z: *"cobi header has a sign
   in control so the page doesn't need it"*); a signed-out row's Edit says to sign in from the header. For a code wrong at several colleges (AED
   reads Electricity because `kb/reference/subject_discipline_map.json` is keyed by code alone,
   `f-subject-map-ignores-credit-band-s698`), one action that lists every college using the code and saves the
   decision for each, or changes the statewide default by the DR-25 route; AED is noncredit, so this rides on #3671.
   (b) **The panel and clickable counts on the main list.** `panelDraw` draws only when the view is a college, so a
   press there moves to the college's view. Build the panel over any Subjects surface, and make every count open what
   it counts (CLAUDE.md, *A figure card opens what it counts*): the college table's Subject codes, Local titles, Both,
   Catalog only and COCI only, the stamp's figures, each row's Courses count.
   (c) **Full width.** The Subjects surfaces sit in the Commons' centered column; give them the window's width
   (`--cpl-measure: none`; tables keep `table-layout:fixed` and scroll in their own container when narrow), checked
   with `npm run a11y`. Also check, from his screenshot: Los Angeles Pierce College shows 69 subject codes in the
   catalog and 88 local titles, more titles than codes.
   Then: (1) #3671's noncredit saves, above; (2) the 8 pages a web search found on a college's catalog read; (3) the
   code spellings the searches surfaced (LATTC LABR is LABR ST, REAL is REAL ES; El Camino E DEV is EDEV) as sibling
   codes; (4) the stale Common SUBJ in the state list's M-ID column (THEA, ECED, FLKO) taken from the identity file;
   (5) the common-code list with the noncredit MQ disciplines.
2. **`commons`, the rest:** the hand-over box's 503 on `handover-try-link`, then its seven later steps; a per-college
   credential count for the College Data Collection card; `commons_handover_summary()` carrying the term our reader
   names; the pile mint's 168 other tutoring titles, then *Propose a new M-ID*; Jev as the second stage; the three
   Collect cards from Sam's locked mock.
3. **`cer-procedures`:** the pair apply (rebuild, dry run, reviewed apply, then the 71 `left_map_keep` rows); #3524 and
   #3522; `_fold_unclassified.py` stops writing a high school as issuer. The lane is 20,344 bytes: compact it first.
4. **`repo-size`:** dispatch `receipt-slim.yml` (`mode=apply`) outside the cron windows; the spreadsheet export and the
   videos out of the tree; the timed workflows' commits capped; `START_HERE.md` and the `CLAUDE.md` cut. Part 5 waits
   on Sam's go.
5. **`common-subjects-reference`:** ECONMT and Electricity's adult-education codes; the Commons card's second count
   synced to a committed file; the two ENVR merge candidates wait for a faculty reviewer.
6. **`library`:** deploy #3600, then part 4, then part 3.
7. **`program-requirements-harvest`** is the routine's (handoff 699).

## Not answered by Sam

- **The 192 Cerritos courses whose M-ID sits under another Common SUBJ** than his decision (ATH's 84 under ATHL
  against KINE; ordinary titles agree 253 of 440). Aligning them is a re-mint under
  `docs/coursecontrolnumber_remint.md`; on no reply nothing is re-minted.
- The TBA figures on the College Data Collection card, and the Plan card's phases (handoff 698).
- He said he would look at the noncredit title list more closely on 2026-11-22 and may change it.

## Pitfalls from this run

- **A worker's worktree and the main checkout on one branch name** leave the main checkout's files stale and fire the
  stop hook: workers take a local branch of another name and push to the session branch.
- **The Supabase guard refuses a statement containing the word replace**, in a comment too.
- **`cpl_memory.summary` is capped at 400 characters;** check lengths with a script before applying.
- **The COBIx watcher stops at the two-hour background limit;** then poll with `COBIX_WATCH_ONCE=1`.
- **Raw GitHub Actions listings return whole commit messages** and fill the context: a helper reads them.
- **A table's DELETE policy can be wider than the page's promise:** filter on the owner
  ([`methodology-a-page-promise-narrower-than-its-delete-policy`](kb-notes/methodology-a-page-promise-narrower-than-its-delete-policy.md)).

## Let go

Dropped: the PR subscriptions on #3666, #3667, #3669 and #3670 at their merges. The COBIx watcher is stopped. No
check-in is scheduled. No artifact is watched. One stash in the main checkout, `s701-stale-main-checkout-0552`,
holds only stale files and may be dropped.

Spend: not available; 2026-11-22T03:09Z to <end, leave for the conductor>.

Opening line: *Greetings, you are SkyRazorbill (Session 702), see SkyMurre's handoff — `docs/session_702_handoff.md` — let's keep rolling with our queue.*

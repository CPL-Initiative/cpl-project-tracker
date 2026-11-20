---
title: "Session 694 handoff (from SkyKittiwake, the plain session of 2026-11-20 that put the M-IDs first)"
created: 2026-11-20
updated: 2026-11-20
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing.** A CPL Queue routine firing follows `docs/session_691_handoff.md` (S690, the conductor's), never this
file. This handoff is for Sam's next plain session on the Commons build.

# You are SkyPetrel (Session 694)

From SkyKittiwake (Session 693), Sam's plain session of 2026-11-20, about 19:50Z to 21:05Z. A **full checkpoint** (the
commons lane moved; the run applied two migrations through the runner and applies a third, #3613's answer-as-filed
write). Skipped: steps 2 and 3 (no KB structure change; the README lists no Commons view), 7 (no M-ID pipeline move)
and 9 (the UI pass is its own queue item; no ledger change beyond what the PRs carry).
`kb/status/program-requirements.json` was left alone (the routine's run log); `kb/status/course.json` was refreshed.
The commons lane is over 20,000 bytes and was not compacted here: #3613 and #3614 carry its edits, so compact it after
they merge.

## Open with the standing block (COBIx on #3358; Sam's rule for the next two or three sessions)

1. **Restart the COBIx watcher:** `bash scripts/cobix_watch.sh [state dir]` in the background; act on each new
   `<!-- cobix -->` comment. Read a PR's whole thread before you merge it or apply what it carries.
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1`), never a full clone.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from
   `main` right before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints match.
2a. **Sam's work order (2026-11-20):** collection comes first, data waves before fixes
   (`r-collection-first-sam-2026-11-20`); collection serves the M-IDs, its fixes ranked by the M-ID cards they unblock
   (`r-collect-for-mids-work-order-sam-2026-11-20`).
3. **Merge order:** #3613 (its write applied first), then #3614, then this checkpoint's PR. #3602 is the conductor's;
   dependabot's #3383 waits.

## What shipped

- **#3610 (`e0b90801`):** every hand-over box takes a note (`kb/migrations/2026-11-20_commons_handover_note.sql`,
  run 44809080341), a signed-in reviewer sees each thing handed over by name, Try the link names why the reader did
  not start. Five memory rows applied (run 44809393820). The latest `cpl-chat-deploy` run (44813057068, on
  `e0b90801`) ended in success; the function redeploy rode it.
- **#3612 (`ad5ce4e6`):** No M-ID and No identity are one chip, Needs an M-ID (2,508; the 36 with a C-ID or CCN left);
  titles underlined as links into the panel.
- **Sam's first real hand-overs:** 3 links (all read with no challenge, run 44806543827, started by the session after
  his three Try the link presses each got 503), 8 pasted catalog descriptions, 7 term report CSVs, each its own object
  (run 44808354149: 251,470 rows, 18 columns with Term, Control Number, Sections Count).
- **Open:** #3613 (the 8 entries and 4 Ohlone notes filed in `kb/hand_filed_catalogs/handed_over/courses.json`; the 12
  hunt courses answered; a guarded 11-row write through `commons_handover_mark()`, second read MERGE yes, APPLY yes);
  #3614 (Closest M-ID, head `85a36ff4`: `kb/_closest_mid.py`, `kb/coci_closest_mid.json`, a column and a panel section).
- **Memory:** 11 rows drafted with this checkpoint, `kb/migrations/2026-11-20_s693_checkpoint_memory_rows.sql`
  (the session adds it to `.apply`).

Read in order: this file; the NEXT lines of [`commons`](reference/lanes/commons.md) (the Needs an M-ID, Closest M-ID
and hand-over paragraphs); `docs/commons_lessons.md`, *S693*; [`reference-commons-hand-over`](kb-notes/reference-commons-hand-over.md);
the rows dated 2026-11-20 in [`sam_rulings`](reference/sam_rulings.md).

## Priority work, in order

1. **Assign from the panel.** The save is `kb_curation` `CN:<control number>` `merge_into`. The daily build fills a
   re-homed course's fields from the identity file alone (`cn_fields`), so first change the build to place a course
   outside it with its fields, dry-run it, take a second read, then ship the control.
2. **Jev as the recommender's second stage:** a same-course yes or no on the top candidates (`kb/_jev_harvest.py` is
   the repo's caller).
3. **A daily rebuild of `kb/coci_closest_mid.json`** beside the identity file, and SLOs and objectives in its score
   where `course_outcomes` holds them.
4. **The Subjects card on the Commons front:** common subjects, and local subject codes with printed names from
   `kb/hand_filed_catalogs/courses/` (16 colleges).
5. **Read the 7 term reports for their terms** and file a compact per-term course list for the no-longer-offered
   check. The files are in the private bucket: read them on a runner with the service key. The four Ohlone BRDC notes
   wait on it and on a runner page read of Ohlone's chapter 7, which a session's network cannot reach.
6. **Why `handover-try-link` answered 503:** read its log after the next press (`not_configured` or `token_refused`),
   then set or renew `HANDOVER_DISPATCH_TOKEN`.
7. **The earlier queue:** the three Collect cards from Sam's locked mock; the M-ID census builder on one base.

Also open in the lanes: the commons lane's #3570 gaps, the Rule G dry run then apply with its own `--expect`, and the
Common Subjects lane's (`common-subjects-reference`) ECONMT and Electricity codes, which item 4 sits beside. `program-requirements-harvest` is the conductor's (handoff 691);
`library` and `common-cr-reference` are plain-session work after the Commons slices, unless Sam names them first.

## Decisions Sam made (verbatim in `sam_rulings` and the vault braindump of 21:00)

- M-IDs first, then course-based exhibit titles (`r-mids-first-then-course-exhibit-titles-sam-2026-11-20`).
- A Closest M-ID column with a confidence and a link to curate (`r-closest-mid-column-sam-2026-11-20`).
- Needs an M-ID leaves out a C-ID or CCN; titles open the panel (`r-needs-an-mid-leaves-out-cid-ccn-sam-2026-11-20`).
- A Subjects card on the Commons (`r-subjects-card-on-the-commons-sam-2026-11-20`).
- Jev for fast yes-or-no at scale (`r-jev-for-binary-decisions-at-scale-sam-2026-11-20`).
- The hand-over takes a note and lists each drop (`r-handover-note-sam-2026-11-20`, `r-handover-list-sam-2026-11-20`).

## Decisions the session made (each his to revise)

- A course a person answered leaves the to-do, stays listed, its outcomes still missing (`d-answered-course-leaves-the-to-do-2026-11-20`).
- Assign from the panel waits on the build change, a dry run and a second read (`d-assign-from-panel-waits-on-the-build-2026-11-20`).
- A note's catalog box is its own field (`d-note-catalog-box-is-its-own-field-2026-11-20`).

## Patterns that worked

Building each fix the hour Sam's own use found it; measuring the recommender on held-out known courses before showing
its number (`f-closest-mid-measured-2026-11-20`: 0.75 or more right 93%; most of the pile needs new M-IDs); dispatching
the pickup by hand when the page's button failed.

## Safety patterns to honor

- Never cat the npm test log; it prints every check. Tail it.
- List workflow runs with perPage 1 to 3; a wide listing returns whole commit messages.
- The privacy plugin refuses a Bash call that names the daily dashboard generator: read it with the Read tool, keep
  its name out of shell commands and heredocs (`p-privacy-hook-names-a-script-2026-11-20`).
- A test must not read a live worklist; give it a fixture tied to the builder (`p-test-tied-to-a-live-worklist-2026-11-20`).
- Launch a worktree-isolated agent from the tracker; it starts in the repo of the session's working directory
  (`p-isolated-agent-starts-in-the-session-directory-2026-11-20`).
- Never add a read policy to the `commons-handover` bucket; a course outline can name faculty.
- The migrate runner's receipt commit starts no CI: push a commit of your own after the last receipt, then gate on `test`.

## Arrived after the documents were written (S693, about 21:05Z to 21:40Z)

- **Three levels, and Propose a new M-ID** (COBIx's note, relayed by Sam): shipped in #3614. Strong match was right
  for 2,266 of 2,438 known courses (93%), Possible match for 805 of 1,872 (43%), No strong match for 297 of 1,687
  (18%). On the pile: 82, 287 and 2,139. The level names are the session's; Sam may rename them.
- **Sort the pile by exhibits unlocked** (COBIx, relayed by Sam: *"so Group Communication, with 67 links, comes
  first"*): not built. It needs the count of course-based exhibit links per course; no committed file holds it by
  control number. It is NEXT (0) in the commons lane's Closest M-ID paragraph.
- **Sam's question on exhibit titles** (*"a set of exhibit titles that got renamed to older names with I II and
  course numbers in them"*): the session found no revert in `kb_curation`. The 13 saves at 8:27 AM PT were the CER
  procedures run (44772850637) naming 13 new raw titles, insert only; none is among the 16 held; since November 10 no
  saved title carries a Roman numeral or a course number except four of Sam's own. The session asked him for one
  example title. Open until he names one.
- **CI caught one thing on #3613:** the College Data Collection page writes every date in words, and the answered
  list printed an ISO date (`tests/cdc_plain_words.test.js`). Run the tests that read a page after the last page
  change, not before it.
- **Main went red at the daily build (`04d1aee6`):** `tests/issuer_tags.test.js` failed because the 8:27 procedures
  run named two issuers with no entry in `kb/reference/issuer_tags.json` (Tracy High School, ISACA). The entries are
  added in this checkpoint's PR. A procedures run that names a new issuer needs its tags entry the same day.
- **This checkpoint ended near the emergency line** (about 60,000 tokens left): the commons lane was not compacted
  (26 KB against 20 KB; do it first), and the Open Asks sheet was not rebuilt.

## Ledger and let go

| PR or branch | State | Next |
|---|---|---|
| #3610 | merged (`e0b90801`) | none |
| #3612 | merged (`ad5ce4e6`) | none |
| #3613 | merged (`a2b0de7c`); its 11-row write applied by run 44816461613 | none |
| #3614 (Closest M-ID, three levels) | merged (`18ef351a`) | none |
| this checkpoint (`claude/s693-checkpoint`) | open, draft | merge at sign-off if `test` is green |

The session updates this table at sign-off. It drops its PR watches at sign-off; no scheduled check-in and no
artifact watch is held. The COBIx watcher ends with the session (restarted once after the 30-minute background limit;
no COBIx comment arrived).

Spend: not available; 2026-11-20T19:50Z to 2026-11-20T21:45Z.

Opening line: *Greetings, you are SkyPetrel (Session 694), see SkyKittiwake's handoff — `docs/session_694_handoff.md` — let's keep rolling with our queue.*

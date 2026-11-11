---
title: "Session 637 handoff: Butte 87 to 138 of 164 and displayed, the reconcile's address guard, a stale-issuer report"
date: 2026-11-11
session: 636 (SkyAntennae, Sam's session on handoff 636, 2026-11-11 04:03Z to ~10:45Z)
tags: [handoff, program-requirements-harvest, cer-procedures, library, csm-workspace, commons]
status: current
---

# You are Session 637

Your moniker is **SkyPorpoise** (galaxy names; the Porpoise Galaxy, NGC 2936). A **full** checkpoint: the run made Rule 10
data writes with receipts. Not refreshed, as not moved: the pipeline view, `kb/README.md`, `README.md`, a KB note, the
four other references' run logs.

## At the start

Sam opened on handoff 636 from his phone and did not write again; every step below went on the session's own call
(decide, carry out, record). All three repos were attached, plus `cpl-program-records`. `list_sessions` showed no
other session working; #2894 was the only open PR. The CPL Queue routine fired hourly through the run and stood down
each time.

## What shipped (one PR, #3100)

1. **`program-requirements-harvest`, the lane under its budget:** 19,936 bytes (was 23,576). Five paragraphs keep
   their state and rulings; the originals are verbatim in the lessons, *Moved from the lane (S636)*.
2. **Butte College: 87 to 138 of 164 passing, live and displayed.** 72 failures were degrees naming a pattern and the
   total with no units for the pattern. Five free page reads (`kb/college_reads/butte_*.json`) reached the catalog's
   General Education guides, which print both totals: Local *a minimum of 21 semester units*, Cal-GETC *a minimum of
   34*. Four reconcile steps. Reconciles 42973457189 (88 changed) and 42985449223 (8); rereads 42998334970 (84
   replaced) and 42998339612 (8), 0 errors; display build 052fb9eac1b5 applied by run 42999415016: 17,557 of 17,560
   written, 0 errors (the job reads *failure* on the 3 Monterey Peninsula rows the table no longer holds).
3. **The reconcile's moved-page guard:** `same_address` in `kb/_program_requirements_college.py` reads one address
   spelled with another letter case or a doubled slash as the same page, where the fresh text still prints the
   record's own heading. Butte's first reconcile (42962429245) had changed 0 of 165 for that reason.
4. **`cer-procedures`:** `stale_override_issuers` in `kb/_apply_credential_review.py` reports an issuer a changed
   override leaves in `kb/credentials.json`; it removes nothing. Live: 166 appended records, none stale. Test
   `tests/credential_review_stale_issuer_test.py`, in `js-tests.yml`.

## Beside this run: the CPL Queue routine's firings (their notes on #3100)

- **06:12Z (S636b):** dispatched `daily-dashboard.yml`; the UI pass on funding-model (#3101 merged: the print page's
  white is `--print-paper`); the credential watch (#3103: 25 added, 1 retired, Oracle OCI 2025 GenAI Professional;
  `cpl_memory` `oracle-retires-oci-2025-genai-professional-2026-11-11`); #3102 wrote Shasta's curriQunet index run.
- **09:12Z (S636c):** wrote nothing. Shasta's index is filed (run 42972399224) and `next_slo_colleges.py` gives
  Shasta as *trial* (`trial=12`): the trial is the next UTC day's SLO run. No new Library request (DSP v3 waits on
  Sam's approval of its draft; IACA waits on Crystal's note), no CER rule request, no re-analysis request open.

## After the first checkpoint: the session went on (Sam: "keep going see cobix 3096 comments")

A second, lighter checkpoint at 12:45Z 2026-11-11, written at the context warning (108,832 tokens left). All of this is
on draft **#3105**, not merged. Sam's words this stretch, verbatim: *"can you see the de anza solution cobix has and
let me know if you have or can implement it? i beleive it will unblock much of the stuck cpl queue work"*; *"good, and
try testing a scenario where you can't reach the doc needed in t he queue and you ping cobix to try and if he succeeds,
test that you can access what he provides to see if the loop is closed and the throughput works"*.

1. **The blocked-source procedure is in the rules:** `docs/reference/blocked_sources.md` (COBIx's seven steps from
   #3083, on Sam's words of 2026-11-10), pointed to from `CLAUDE.md`, step 12 of `scheduled_sessions.md` and the lane.
   One condition: the harvest's own reads keep naming the CPL Initiative.
2. **COBIx's rulings relay (#3096, 11:38Z):** Sam, *"yes to all recommendations"*: a hand-filed `copy_url` may point at
   the college's own open address; COBIx is "the person" for a challenge or user-agent block; Program Mapper gets a
   vendor note first (COBIx drafts, Sam sends); Cañada's robots.txt reads by longest match. Relayed, not heard here:
   Sam was asked in session to say if it is not his.
3. **The loop test (Sam's ask).** Block proved: American River's catalog answers the reader 404 (page read
   43014049067). Ask posted on #3096 at 11:51Z; COBIx answered at 11:53Z: the file answers the harvest's hand-filed-copy
   user agent at the college's own address (8,010,776 bytes, sha256 `a8b53fe3f121ab04c44a2b439f336725da5641ee8a667fa5c9c71d31f367d708`).
   `kb/hand_filed_catalogs/american_river.json` now points there with no hash; a dispatched run
   (`step=reconcile`, American River, ~12:22Z) pins it. **Open: read the pinned sha256 in that file, compare, report on
   #3096 and to Sam, add the Los Rios row to `blocked_sources.md`.** If it matches, tell COBIx to post the other three
   Los Rios packets and the next five colleges' source packets (its section 4, which Sky adopts).
4. **Redwoods: 59 of 73 on the branch (was 53).** Three local steps on the college's CRGE sheet (21) and its pages' own
   words; reconcile 43018781168 changed 18. Reread dispatched ~12:31Z. **Open: read its receipt, verify live, merge
   `main`, run `kb/_build_roep_display.py`, commit, dispatch `step=display`.**
5. **De Anza waits on Sam's word** (asked in session at 12:02Z; the lane carries no sheet marker, so if he has not
   answered by your start, put it on Open Asks Sheet 181 with the lane's marker restored). Its 2026-2027 catalog on eLumen is verified (read 43013608134). The registry correction is
   staged, not applied (`kb/migrations/2026-11-11_de_anza_catalog_2026_27.sql`): the session's permission check
   refused the push that would apply it, and it supersedes Sam's correction of 2026-10-17. On his "go De Anza": name the
   file in `kb/migrations/.apply`, move `kb/hand_filed_catalogs/de_anza.json` to `retired/`, push, then a free capture
   (`extract=0`), extraction under the $40 go, load, a `ge_units` step from the `daweb2` GE pages (COBIx: Local GE
   29-41 quarter units, Cal-GETC 45-58; verify), display.
6. **Not started, from #3096's list for Sky:** Diablo Valley's `programs` to department to program route (0 of 244
   records), the registry fixes in its section 3, `course-outline-index.yml` discovery on the five curriQunet hosts.
   **#3083 has no reply from Sky yet**; the answer sits on #3096. Post a short pointer there.

## Decisions to honor

- Sam, this run: the opening line only. No card was asked or answered; no sheet was built.
  [Open Asks Sheet 180](https://claude.ai/artifact/2TG7xiCzNcAHyq5bQ1LL2F) is the last sheet, answered in full, none open.
- Session calls, `cpl_memory` `d-butte-ge-units-own-words-s636` (author `SkyAntennaeS636`) and a DECIDED line in the
  lane: Butte's local degrees take the Local pattern's 21 and its transfer degrees Cal-GETC's 34; the map's elective
  note sets `electives_fill_degree`; *Meets Area N* beside a course of the major sets `ge_overlap` on a local degree
  (weaker than Hartnell's and Las Positas's double-count sentence; delete Butte's entry to reverse); the local
  graduation requirement's 2 units stay out.
- Not built, a person's call: a retire path that removes an issuer.
- Left for Sam, his own row (carried): *Clinical Psychology Ph.D.* (Los Angeles Pierce) sits under the credential
  *Clinical Counseling Laws and Ethics*, the name of a course it awards.

## Read first

- `docs/reference/lanes/program-requirements-harvest.md` (Butte), `docs/program_requirements_harvest_lessons.md` S636.
- `docs/reference/lanes/cer-procedures.md` (the re-analysis paragraph), `docs/reference/lanes/library.md` (NEXT 0).

## Open work, in order (built from the lanes)

1. **`program-requirements-harvest`:** the sweep's next college (step 12), listed live first. By failing records
   after Glendale (parked): De Anza first (it no longer waits on Sam: COBIx's #3083 and #3096 give `daweb2.deanza.edu`
   and a 2026-2027 eLumen catalog), then Orange Coast 72, Los
   Angeles City 67, Victor Valley 60, San Bernardino Valley 54, Berkeley City 54. Butte's 27 left stand as filed
   (25 read `unequal` inside the map's printed range). The nightly SLO read runs as `--next` names it.
2. **`library` NEXT 0:** Sam's List publicly for request `71931018`, and the link from the public funding dashboard
   his brief asks for. Owed to COBIx on the next Library change: the lane's *Owed* line.
3. **`cer-procedures`:** the next re-analysis request runs the checks, then the Jev runner. Pierce's university: a
   question for its CSM.
4. **`csm-workspace` NEXT 0 and 1:** Malone's four questions stay open with him; then the hover cards and every
   landing-page role (asks 10 and 6), then the denial email (ask 15). `npm run a11y` is owed on the sign-in box from
   a machine with open network.
5. **`commons` NEXT:** Teach a rule on every reference, the Course auditor's count, the `--cmn` tokens.
6. **`implementation-funding`:** the sender waits on RCCD IT's mailbox grant; its lane is 24.2 KB against 20 (compact
   it). **`college-district-identity`, `reviewer-session-lifetime`:** carried, their NEXT lines stand.
7. **#2894** (COBIx inbox, draft) is Sam's to review.

## Patterns that worked

- **List the failing colleges live and group one college's failures by cause** before any read: 72 of 77 shared one.
- **A catalog section three levels down:** read `_getNavigation?id=<catalog>&navigationtypeId=1` as a plain page,
  then `&parentId=<node>` per level, then `cq_view` on `.../iq/<root>/<list>/<item>`, which prints the tabs whole.
- **Hand a long job log to a subagent** with the exact lines wanted; a page read's log runs past a thousand lines.
- **Simulate the steps with the scorer on the filed records** before a dispatch, and check them on a page the read
  printed.
- **Work a second queue item during a 90-minute capture** and push it: the runner's commit step rebases and retries.

## Safety patterns to honor

- A reconcile that changes nothing: read its last line (`on another page`) before doubting the steps.
- A reread posts one run's records. Records changed by two reconciles need two rereads (`force=<run>` for the older).
- `git add`, then `scripts/check_generated.sh`, and read its last line before the commit: a chained `&&` after
  `| tail` commits past a stale file.
- Never run the display build with a merge conflict open. `npm run a11y` hangs in the cloud container.
- `cpl_memory.summary` is capped at 400 characters, and `kind` is required.

## Let go

#3100 merged and its subscription is dropped. #3105 is watched by this session until it merges or the session ends; a
next session subscribes again. The check-ins this run scheduled have all fired but one (11:12Z, the
display apply), which finds the work done. CPLBrain's session note is a draft PR, Sam's to merge; its subscription is
dropped at sign-off. No artifact watch was registered.

> *Greetings, you are SkyPorpoise (Session 637), see SkyAntennae's handoff — `docs/session_637_handoff.md` — let's keep rolling with our queue.*

---
title: "Session 715 handoff (from SkyPuffin, S712, Sam's plain session of 2026-11-23: subjects by confidence, the statewide code list, the gate that reads confidence)"
created: 2026-11-23
updated: 2026-11-23
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_719_handoff.md
---

**Routing.** This handoff is for Sam's next plain session. A CPL Queue routine firing follows `docs/session_699_handoff.md`
and the routine's own newest handoff, never this file. **Numbering.** The routine ran as S713 (SkyKittiwake, #3704), and
its checkpoint writes `docs/session_714_handoff.md`, so this plain handoff takes 715. If 715 is taken when you start,
take the next free number and say so in your handoff.

# You are SkyAlbatross (Session 715)

From SkyPuffin (S712), Sam's plain session of 2026-11-23, 01:53Z to 02:41Z and 09:35Z to 11:30Z. **Read
`docs/session_708_handoff.md` first for the standing block; the open work in handoffs 709 to 712 still stands**, except
what this run closed or reframed below.

A **light checkpoint**: the commons lane moved, with its PRs and the `cpl_memory` rows; no re-mint and no data receipt.
Steps 2, 3, 5, 7 and 9 were skipped: no KB structure, nav, re-mint or pipeline change. The one new generator,
`kb/_statewide_subject_codes.py`, is wired into `scripts/daily_build.sh` and the lane. Also skipped: step 4 (the retired
Subjects paragraph went verbatim to `docs/roadmap_archive_7.md`) and step 12 (no status file's run log moved). The docs
lint (`kb/docs_audit/2026-11-23.md`) flags only the standing oversized files.

## Open with the standing block (unchanged from handoff 703), with one change

Handoff 708 carries it. **Sam, 2026-11-23 01:53Z:** *"No need for the Cobix check ins for now"*. This run started no
COBIx watcher; start one only when Sam asks.

## What Sam wants next (his words, 2026-11-23 ~11:15Z)

*"next session I will want to make sure on the subjects tab that when I make edits or decisions, they are immediately
reflected in the numbers (going in the right direction) shown in the links. Then I will want to apply the same process
and principles to the other commons cards"*

So:

1. **The Subjects tab answers its own edits.** Today a save writes `kb_curation`, and most counts move only after the
   nightly build. Make each figure a Subjects link carries read the live saves on top of the committed file:
   - the statewide view's level counts;
   - the held codes;
   - the per-college title and code counts;
   - the card on the Commons front.

   A save must move its number the right way at once. Guard it with a jsdom test that saves, then reads the figure.
2. **The Subjects card from the mock** (https://claude.ai/artifact/YARPmNSUbDBk8AG3jrjpE7, two artboards):
   - four checks;
   - Confident levels;
   - a "Where to act" line on each check;
   - the Subjects tab's college list by source (each way to look, with its status word).
3. **The same process on every other Commons card:** confidence levels, Collect / Curate / Connect checks, a "Where to
   act" line on each, and the figures answering their own edits.

## What shipped

- **#3702** (`7afc5cb6`):
  - the 50 outlines to find by hand open in place at `#collect/slos/outline/<college>-<code>`;
  - College Data Collection's panel and the front page's course panel resize and keep their top row frozen.
- **#3711** (`e7e1cdf7`):
  - `kb/_statewide_subject_codes.py` → `kb/status/statewide_subject_codes.json`, nightly.
    - Scale: 2,924 codes (3,019 spellings) at 118 colleges; COCI's "… Credit" names are folded.
    - Evidence: the draft; the peers (M-IDs at three or more colleges, never TOP-only, never the M-ID a code named); a
      calibrated title model; a noncredit code's COCI category.
    - Result: a call, a confidence and a runner-up for every code. 7,769 of 10,162 pairs are Confident, covering 83% of
      courses.
  - The view `#commons/subjects/statewide`, with Confirm and bulk confirm as the statewide filing.
- **#3712** (open at sign-off; merge it on a green `test` if this session did not):
  - the readiness gate reads confidence: AED is 75 of 127 ready, up from 34;
  - a credit call for noncredit codes that hold credit courses;
  - today's outcomes comparison (49,404 rows);
  - the outline hunt reranked: 12 of Sam's 50 courses left because they reached two districts with text;
  - the subject-list probes, rounds 1 and 2.

## Decisions Sam made (verbatim in `cpl_memory`)

- `r-confidence-not-person-settled-sam-2026-11-23`: settled means Confident; *"settled by a person is no longer a
  milestone"*. It supersedes `d-readiness-map-is-not-settled-s709`.
- `r-statewide-codes-every-college-sam-2026-11-23`: every college counts; *"always provide a recommendation... and
  always provide a confidence score, even if it's 5%"*.

## Decisions the session made (each Sam's to revise)

`d-outline-hunt-handover-in-place-s712`, `d-gate-reads-confidence-s712`, `d-subject-title-sources-ladder-s712`.

## Findings

- `f-unread-aed-members-mostly-noncredit-s712`.
- `f-elumen-courses-view-lists-subjects-s712`: one public call per eLumen college lists every subject as "Name - CODE".
- Sam checked, and COCI and the MIS reports carry no subject names. He will look in the full COCI dataset.

## Open work

1. Sam's three asks above, in order.
2. **Probe round 2:** read the runs of `kb/college_reads/s712_allan_hancock_subject_list_2.json` and
   `s712_antelope_valley_subject_list_2.json`, both pushed at 11:13Z.
   - Then write the filer for eLumen (15 colleges) and curriQunet (27), then CourseLeaf (24).
   - Then extend `kb/_build_local_subject_titles.py` to a college whose subjects are filed with no course file.
3. **The mint takes Confident calls:** 1,025 of the 1,341 held courses release. Reconcile with the pile mint's 98%
   floor first.
4. **Raise the 787 Unsure codes** with their titles and a web lookup. Fan-out fits here, since a hit is cheap to check
   against the titles.
5. **Two rulings for Sam:** do foreign languages fold into FLNG or keep SPAN, FREN and so on; does Athletics fold into
   KINE?
6. Sam's twelve AED titles, then one re-mint (handoff 712, item 1). The dry run reads the new gate.
7. `commons` lane: 16,971 bytes after this checkpoint moved the old Subjects paragraph to archive 7.
8. **The other lanes, as handoff 712 item 4 lists them:**
   - `cer-procedures`: compact it below 20,000 bytes at the next full checkpoint.
   - `repo-size` and `my-college-action-page`: wait, as their NEXT lines say.
   - `program-requirements-harvest`: the routine's.

## Pitfalls from this run

- **`cpl_memory.kind` takes `fact`, never `finding`.**
- **A new `kb/status/` file needs its line in `.github/pages_allowlist.txt`** (`publish` when a page reads it). Without
  it, `lints` and one suite shard fail.
- **A new outcomes comparison makes `kb/status/outline_hunt.json` stale.** Rerun `kb/_outline_hunt.py` in the same PR.
- **A Python `set` breaks ties in a different order on every run.** Sort before taking a `max`, or a `--check` fails
  on a rerun.
- **Sign off in the same turn as the last merge,** with the checkpoint and the opening line. On the first stretch Sam
  had to ask.

## Memory and vault

Seven `cpl_memory` rows by `SkyPuffin (S712)`, one S709 row superseded: `kb/migrations/2026-11-23_s712_cpl_memory_rows.sql`
(rollback in its header). Vault: a session note and a braindump of the confidence ruling, on a draft PR in
samueltlee/CPLBrain.

## Let go

Dropped: #3702 and #3711 (merged), their check-ins, and #3711's watch. At sign-off: #3712's watch if merged, and the
vault PR's. No COBIx watcher ran. The mock artifact holds no watch from this session that needs keeping.

Opening line: *Greetings, you are SkyAlbatross (Session 715), see SkyPuffin's handoff — `docs/session_715_handoff.md` — let's keep rolling with our queue.*

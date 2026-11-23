---
title: "Session 717 handoff (from SkyAlbatross, S715, Sam's plain session of 2026-11-23: the Subjects figures answer their own edits, and the Subjects card from the mock)"
created: 2026-11-23
updated: 2026-11-23
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing.** This handoff is for Sam's next plain session. A CPL Queue routine firing follows `docs/session_699_handoff.md`
and the routine's own newest handoff, never this file. **Numbering.** The routine's open checkpoint (#3713, S714
SkyFulmar) writes `docs/session_716_handoff.md`, so this plain handoff takes 717. If 717 is taken when you start, take
the next free number and say so in your handoff.

# You are SkyGannet (Session 717)

From SkyAlbatross (S715), Sam's plain session of 2026-11-23, 14:20Z to about 15:20Z. **Read
`docs/session_708_handoff.md` first for the standing block; the open work in handoffs 709 to 715 still stands**, except
what this run closed below. As in 715, Sam said no COBIx check-ins for now: start no COBIx watcher unless he asks.

A **light checkpoint**: the commons lane moved, with its PRs and two `cpl_memory` rows; no re-mint and no data receipt.
Skipped: steps 2, 3, 5, 7 and 9 (no KB structure, nav, re-mint or pipeline change), step 4 (no retired text), step 12
(no status file's run log moved). The docs lint (`kb/docs_audit/2026-11-23.md`) flags only the standing oversized files.

## What Sam asked for (2026-11-23, carried from handoff 715)

1. **The Subjects tab answers its own edits.** Done in #3717.
2. **The Subjects card from the mock** (https://claude.ai/artifact/YARPmNSUbDBk8AG3jrjpE7). The Main artboard is done
   in #3718. The Colleges artboard, the tab's college list by source, is open (Open work 1).
3. **The same process on every other Commons card.** Open (Open work 2).

## What shipped

- **#3717**, the Subjects figures answer their own edits:
  - every figure counts the rows plus the live saves, by the same test the list it opens applies: the front stamp,
    each college's titled count, the no-title list, the held codes, the statewide levels and the Commons card;
  - the code is `figures`, `commonSaves`, `heldNow` and `liveFigures` in `commons_subjects.js`;
  - with no save since the build, each figure equals the file's totals (1,637 titled, 918 with a common code, 317
    with no title).
- **#3718**, the Subjects card from the mock:
  - the headline is 83% of courses under a Confident code;
  - four checks under Collect, Curate and Connect, each with a "Where to act" line;
  - `levels()` is shared with the statewide view;
  - re-mint readiness comes from `kb/status/mid_readiness.json`, and the platform counts from `commons_data.json`;
  - the card is drawn open (`cmf-checks`).
- If either PR is still open when you start, merge it on a green `test`: #3717 first, then update #3718 from `main`.

## Decisions and findings (in `cpl_memory`, receipt `kb/migrations/2026-11-23_s715_cpl_memory_rows.sql`)

- `d-subjects-figures-live-s715` (Sam's to revise): every Subjects figure counts the rows with the live saves on top,
  by its list's own test, and the Commons card reads `liveFigures`, never a count of its own.
- `f-decision-releases-ordinary-titles-only-s715`: the mint's route p releases only ordinary-title credit courses
  under a saved code. A shell title stays held, and a statewide filing decides no M-ID. Shell titles are 1,337 of the
  1,341 held courses, so a decision barely moves the held count. The page's old line, "Deciding a code releases every
  held course under it", was wrong.

## Open work

1. **The mock's Colleges artboard:** the Subjects tab's colleges by source.
   - One row per college (118): the catalog platform (`commons_data.json` `platform`), codes (the statewide pairs),
     titled, then a status word per way to look (catalog, catalog system, class schedule, department list) and Next.
   - Status words: Read, Probing, To try, Blocked, Not needed, No system.
   - The missing source is a small register of attempts per college. Today only the catalog read (titles file) and
     the probes (`kb/college_reads/s712_*subject_list*`) say anything.
2. **Sam's ask 3:** the same process on every other Commons card. That means confidence levels, Collect / Curate /
   Connect checks, a "Where to act" line on each, figures that answer their own edits, and the card drawn open.
   `subjectsParts` in `commons_front.js` is the pattern. A fan-out per card fits, since each card is its own file of
   figures.
3. **From handoff 715 (unchanged):** probe round 2 and the eLumen / curriQunet / CourseLeaf filers; the mint takes
   Confident calls (reconcile with the 98% floor, and note the finding above); raise the 787 Unsure codes; Sam's two
   rulings (FLNG, Athletics into KINE); his twelve AED titles, then one re-mint.

## Pitfalls from this run

- **The page-clarity test bans coder words in card text** (`queue`, `fold`). "Nightly data collection queue" failed it.
- **`cpl_memory.summary` refuses a text of about 600 characters** (`cpl_memory_summary_check`). Keep a summary near 400.
- **A tall card needs `cmf-unclamped`** to stay out of the row-height basis. `cmf-checks` keeps it open when its method
  line toggles.
- **The permission check refused a background `http.server`** for a screenshot. One node script that serves, shoots
  and exits ran fine.

## Let go

At sign-off: the watches on #3717 and #3718, and the vault PR's. No COBIx watcher ran.

Opening line: *Greetings, you are SkyGannet (Session 717), see SkyAlbatross's handoff — `docs/session_717_handoff.md` — let's keep rolling with our queue.*

---
title: Session 373 handoff — Mesa's load, the course outline census, the gallery picks
date: 2026-10-12
session: 372 (SkyRedwood)
tags: [handoff, program-requirements, san-diego-mesa, course-outlines, first-light, sierra]
status: current
superseded: true
superseded_by: session_380_handoff.md
---

# You are Session 373

Your moniker is **SkyCypress**. Session 372 (**SkyRedwood**, `session_015nY8WFCHjbF5TsKafPJveP`) ran with Sam present and
checkpointed at about 140k tokens left, with two runner jobs still going.

## First, in this order

0. **One writer.** `list_sessions`; Sam's routine fires 05:12Z (`trig_01L8K64ZKYb5eALdT4HW6NAV`). Merge this checkpoint PR
   (`claude/s372-checkpoint`) and the vault note PR on `test`.
1. **Rule 8:** `cpl_memory` tags `program-requirements-harvest`, `course-outlines`, `san-diego-mesa`, `first-light`, `sierra`.
2. **Read Sheet 70's replies** (https://claude.ai/artifact/XH8PbTs4mCyZ8kVfRh1S3D, collection `replies`) before acting on
   the course outline work. Card 1: five `cor_*` registry fields by migration (the `sequence_*` pattern in
   `kb/supabase_program_source_registry.sql`, columns the census never writes). Card 2: sign-in systems recorded, no
   request to the college. Card 3: SLOs of articulated courses at the nine loaded colleges first.
3. **The course outline census, run 2 (all 118)** runs on `claude/s372-cor-census` (draft #2042). When its commit
   lands (`Course outline census (run ...)`): pull, run `python3 kb/_build_dependency_map.py` (the map was stale at
   20be854; do not push while the job runs), commit, push, read `kb/course_outline_census/census_<run>.json`
   (`summary`, then the rows with hosts). The sample found catalog hosts and one outline system (Cabrillo's Coursedog,
   sign-in). A catalog host is not proof of a public outline: the next step is a per-platform probe of one course's
   outline and its SLOs (curriQunet `Catalog/Export?...outlineId=` as at Chabot; eLumen course pages).
4. **Mesa's read** runs on `claude/s372-mesa-read` (run 38282023973, dispatched 17:06Z with extraction). When it files:
   `step=load`, merge `origin/main` in, add Mesa to the builder's dated reads (`kb/program_requirements_pilot/`; Mesa is
   not a pilot college), `python3 kb/_build_roep_display.py`, commit, `step=display`, read back after the job's
   applied-record commit lands (the job applies in batches), lane line, PR, merge on `test`.
5. **The gallery picks.** When Sam says he has marked: `ArtifactData list picks` on
   https://claude.ai/artifact/21o45k6MbPKsPMgNQk69hn, apply to `tools/first_light_selection.json` (rebuild with
   `tools/build_first_light_manifest.mjs`) and `sierra/art/manifest.json`, each new entry with our own blurb and alt text.

## What shipped (S372)

#2039 and vault #319 (S371's checkpoint) · #2037 Mesa's registry row applied 17:06Z (Sheet 69 item 1) · #2040 Sierra v91:
the 7c precedent line names the course's program (A/B clean, deployed 17:27Z, smoke 341 green with NURVN 414 cited) ·
#2038 the painting gallery (521 thumbnails, artifact published, `picks` empty) · #2041 Miramar read, loaded (106 plus 4
kept) and displayed (`427f93eaf03d`, 2,015 rows, 31 checked) · vault #320 Sheet 69's source filed · Sheet 70 published ·
#2042 draft, the course outline census. `cpl-chat-preview` is gone (confirmed).

## Decisions Sam made this run

- Sheet 69 (16:39-16:40Z): item 1 *Apply as a migration* (Mesa), item 2 *Apply as a migration* (spelling, S371 applied),
  item 3 *Tune it* (7c). All carried out.
- ~18:00Z in chat: capture each college's course outline of record system link, so the harvest reads course SLOs for
  the industry credential skills match and for faculty assessment of CPL (`sam-capture-cor-system-link-2026-10-12`).

## Patterns that worked

- **Read the A/B's answers, not only its grid:** the production side showed the 7c misreading word for word
  (`methodology-a-course-title-reads-as-its-level`).
- **A tool-call timeout is not a lock:** `pg_locks` showed none, and Mesa's migration applied on the third try.
- **A sample before a 118-college crawl:** 12 colleges showed the homepage-only discovery missed half.

## Safety patterns

- A runner commits back to its branch: never push there while the job runs. A merge of main carries path-filtered
  trigger files (`.thumbs-run`); restore main's `tools/first_light_gallery/index.json` if a thumbnail run commits.
- An artifact version holds at most 511 files; the gallery is at 509.
- Pipe exit codes: `check_generated.sh | tail` hides a failure; read the log before committing.

## Not refreshed this checkpoint

UI pass (no room for a fix PR; `python3 scripts/ui_pass.py --next` names the view); Pipeline tab (the M-ID pipeline did
not move); `kb/README.md`, `README.md`. Watches: #2042 subscribed; the gallery and Sheet 70 artifacts watched; a
check-in `trig_01DDrFDZPWqZKiSwRJFmHCUm` (18:24Z). S372 drops these at sign-off.

## Sign-off line for Sam

Greetings, you are SkyCypress (Session 373), see SkyRedwood's handoff — `docs/session_373_handoff.md` — let's keep rolling with our queue.

---
title: Session 372 handoff — load Miramar, finish the painting gallery, Mesa's registry row
date: 2026-10-12
session: 371 (SkyMaple)
tags: [handoff, program-requirements, san-diego-miramar, san-diego-mesa, first-light, sierra]
status: current
superseded: true
superseded_by: session_380_handoff.md
---

# You are Session 372

Your moniker is **SkyRedwood**. Session 371 (**SkyMaple**, `session_017jaoT4tiFmJhpBq5SzNodc`) ran with Sam present and
checkpointed at the context warning (about 109k left).

## First, in this order

0. **One writer.** `list_sessions`; Sam's routine fires 05:12Z (`trig_01L8K64ZKYb5eALdT4HW6NAV`). Merge this checkpoint PR
   (`claude/s371-checkpoint`) and the vault note PR on `test`.
1. **Rule 8:** `cpl_memory` tags `program-requirements-harvest`, `san-diego-miramar`, `san-diego-mesa`, `sierra`, `first-light`.
2. **Miramar is reading** (Sam, 2026-10-12: *"go ahead with Miramar and Mesa extraction"*). Run on `claude/s371-miramar-read`
   (dispatched ~16:20Z, `extract=1`; the capture-only run 38272961125 was canceled for it). When it files: `step=load`,
   merge `origin/main` in, `python3 kb/_build_roep_display.py`, commit, `step=display`, read the build back (every row
   carries the new build), add the lane line, open the PR and merge on `test`. Miramar already had 4 checked pilot
   records (05100, 18207, 35030, 41496); the load is insert-only and keeps them.
3. **Mesa needs its registry row first.** PR #2037 (draft) files the receipt
   `kb/receipts/program_source_registry_mesa_catalog_2026-10-12_s371.sql`: Mesa's row points at
   `https://sdccd.curriqunet.com/catalog/alias/mesa26-27` as curriqunet (the host's `_getCatalogs` names Mesa 70). The
   `execute_sql` guard blocked it; S371 asked Sam how to apply it (migration route, as S345/S359 did, or he pastes it) and
   he dismissed the question. **Ask once more; do not route around the guard.** Then dispatch Mesa's read like Miramar's.
4. **The painting gallery** (Sam: *"build the painting gallery"*). Branch `claude/s371-painting-gallery`, draft PR #2038.
   Step 1 is pushed (41 new California painter categories, `tools/.art-run` run 4, the thumbnail fetcher and its
   workflow). **Step 2 is committed locally only if the container survived — check `git log origin/claude/s371-painting-gallery`;
   S371 pushed it at sign-off if the runner had finished.** Then: wait for `first-light-art.yml` to commit the re-sourced
   `tools/first_light_candidates.json`, write `tools/first_light_gallery/.thumbs-run` and push (runs
   `first-light-gallery-thumbs.yml`), pull the thumbnails, and publish `tools/first_light_gallery/gallery.html` as an
   artifact with `capabilities: {db: {}}`, files `index.json` and `thumbs/<key>.webp` (at most 255 files a publish, so
   two publishes). Verify with one `ArtifactData` list of `picks`. Hand Sam the link. His marks live in collection
   `picks` (doc id = painting key: `v` keep/drop/add/skip, `sierra`, `note`); applying them edits
   `tools/first_light_selection.json` (rebuild with `tools/build_first_light_manifest.mjs`) and `sierra/art/manifest.json`
   (runs `sierra-art-fetch.yml`), each new entry with our own blurb and alt text.

**Emergency amendment (S371, ~16:40Z, context line):** the gallery page commit (2adf1d9) is on branch `claude/s371-gallery-page`, not yet on `claude/s371-painting-gallery`: once `first-light-art.yml` has committed the re-sourced pool there, cherry-pick 2adf1d9 onto it. The preview A/B (run 38272978495) deleted `cpl-chat-preview` (confirmed), but its compare step failed: read which mode differs before anything else on Sierra. The decision sheet was not built.

**Sam answered Open Asks Sheet 69 (https://claude.ai/artifact/UVT389V1HEN68MmASVjua1):** item 1 apply Mesa's registry row as a migration (it timed out twice at 16:4xZ and did NOT apply; read the row back, then apply once Miramar's read is done, and dispatch Mesa's read); item 2 the map_colleges spelling (APPLIED, 2 rows read back); item 3 tune Sierra's 7c precedent line so it names the LVN program the course belongs to, A/B before any deploy. Sheet 69's source is not yet in the vault (`decision-sheets/`).

## Next in the queue

1. **Decision sheet.** Three calls wait on Sam (`kb/queue_status.json` `calls`): Mesa's registry write, the
   `map_colleges` spelling write (receipt `kb/receipts/map_colleges_mis_absent_why_american_spelling_2026-10-12_s371.sql`),
   and Sierra 7c (tune the precedent wording or accept an occasional miss). No sheet was built this run.
2. **UI pass:** `python3 scripts/ui_pass.py --next` names the next view (College Identity was done, #2035).
3. **Sierra 7c precedent:** the miss is model variance, not retrieval (lane and lessons). Change nothing until Sam rules.

## What shipped (S371)

#2033 and vault #318 (S370's checkpoint) · #2034 San Diego City read, loaded and displayed (164; build `0f4e4158a2df`,
1,909 rows read back) · #2035 College Identity UI pass (seeded roster targets; 49px sideways scroll at 320 and colliding
columns at 390 fixed; placeholder codes named) · #2036 MAP Users: a signed-out roster says to sign in (Sam's report) ·
#2037 draft, Mesa registry receipt · #2038 draft, painting gallery step 1. Smoke on main (run 38269835553): 99 of 100;
7c's opening fix holds. The preview function cleanup ran (cpl-chat-preview-ab, cleanup=true); confirm
`list_edge_functions` no longer shows `cpl-chat-preview`.

## Decisions Sam made this run

- *"go ahead with Miramar and Mesa extraction"* (16:10Z).
- *"build the painting gallery"* (16:15Z), after *"Where do I access the catalog of paintings! I want to curate it a bit
  and see if we can add some more CA Plein Air paintings"*.
- Dismissed the question on how to apply the two guard-held writes; ask again, do not assume.

## Patterns that worked

- **Read `chat_interactions` before blaming retrieval.** Identical `context_chars` and uncached input across a passing and a
  failing turn showed the 7c miss was the model (`methodology-same-context-size-means-the-model-varied`).
- **An anon 200 with `[]` is a gate, not lost data:** the edge log's `request.sb.jwt.authorization.payload.role` and
  `content_length` answered Sam's MAP Users report in two queries.
- **Look for the feature before building it:** the hidden `almanac` reviewer still works (type it on any COBI tab).

## Safety patterns

- The `execute_sql` guard blocks UPDATEs; a receipt plus Sam's word is the path. Never re-route through `apply_migration`
  on your own.
- A runner commits back to the branch: never push to that branch while its job is running (the bot's push would fail).
- Two smokes or an A/B beside a display write read timeouts as failures; run one at a time.

## Not refreshed this checkpoint

Pipeline tab (the M-ID pipeline did not move); `kb/README.md`, `README.md`; the decision sheet (no room; first item above).
Subscriptions: #2037 and #2038 watched; the 16:19Z check-in has fired. S371 drops them at sign-off.

## Sign-off line for Sam

Greetings, you are SkyRedwood (Session 372), see SkyMaple's handoff — `docs/session_372_handoff.md` — let's keep rolling with our queue.

---
title: Library — side-lane handoff (SkyMeadow, beside the CPL Queue routine)
date: 2026-11-07
tags: [handoff, library, credential-catalog, cpl-pathways, decision-sheet, side-lane]
related:
  - "[[docs/reference/lanes/cer-procedures]]"
  - "[[docs/reference/lanes/my-college-action-page]]"
  - "[[docs/reference/lanes/local-course-cr-alignment]]"
  - "[[docs/reference/lanes/library]]"
  - "[[docs/library_lessons]]"
---

# Library — side-lane handoff

> Side-lane handoff; it does not replace the numbered `session_<N>_handoff.md`. **Light checkpoint** (SkyMeadow,
> 2026-11-07, ~01:15Z): no lane's Roadmap row moved and no re-mint or data write ran. Written: the lane edits (each rode
> its PR), `docs/library_lessons.md`, `kb/status/exhibit.json`, this handoff, the vault note
> (`CPLBrain/07-session-notes/2026-11-07-skymeadow-sheet-163-pathways-hero-quick-adopt.md`). Skipped: `cpl_memory` (the
> one durable finding is Sheet 163 card 4 and the lessons entry; a row waits on Sam's answer), the KB-note pass, the
> INDEX rebuild beyond the generated check, `README.md` and the Pipeline tab (nothing moved).

Your moniker is **SkyFern**. You pick up after SkyMeadow on the **Credential Catalog**, **CPL Pathways**, the **C-ID
claim holds** and the Library ([`library`](reference/lanes/library.md)).

## What shipped (SkyMeadow, 2026-11-07)
- **Open Asks Sheet 163** (https://claude.ai/artifact/DdQQznv6bP1owM69KEtJNg, current, fresh store empty at publish;
  cpl-project-tracker#2865 marked the lanes, CPLBrain#696 the builder). Four held cards: (1) does a recommendation's
  C-ID need two peer colleges (536 take one from a peer row, 259 from one college alone); (2) the note to Moreno Valley
  about HES 1's COCI C-ID, drafted, outward; (3) Sierra's wording floor (*MUS 4A Advanced Ear Training* for *Advanced
  Strength Training*, 0.61); (4) seven of Sam's 2026-11-01 triage titles: four whole-college Credit by Exam exhibits
  under one course's title (*Plant Propagation*, *Basic Computer Keyboarding*, *Basic Refrigeration & AC Lab*, *Water
  Supply*) and CompTIA A+, Network+, Server+ under Security+. Sheet 162 is answered and built; never republish onto it.
- **#2863 and #2864** (SkyHarbor's): merged.
- **#2866** the CPL Pathways statewide head carries the Catalog's photos (cycles only on screen, Pause photos, still
  under reduced motion; `tests/cpl_pathways_hero.test.js`).
- **#2867** the Catalog panel's CPL-AI list offers Request Quick Adopt beside a Strong evidence course at a college
  that does not award it.

## Decisions Sam made this run
None in session (he was away). Sheet 162's answer, read from its store: *"Reframe it as a public request to prioritize
review of a credential... without promising any one person that we would evaluate their credential"* (15:16Z
2026-11-06), already built.

## Open work, in order
1. **Read Sheet 163's replies first** (`ArtifactData` list `replies` on its URL) and carry out each answer in the same
   PR as its lane marker. Card 4, if *correct*: a CER decisions plan under `kb/cer_decisions_out/` re-pointing the seven
   `kb/unified_titles.json` rows (the four to *Credit by Exam*, the three CompTIA exams to their own titles), applied
   with `kb/_cer_decision_apply.py` and its receipt, then `cred-rename-apply.yml`. Card 3, if *tighten*: a migration
   through `supabase-migrate.yml` changing `cx_align_tokens()` and the scorer's floor (`kb/supabase_alignment_routes.sql`),
   then `tests/sierra_alignment.test.js`. Card 2 is Sam's to send.
2. **SkyHarbor's check, still due:** after the next daily run and the 13:20Z `credential-catalog-sync.yml`, read
   `credential_alignment_for_college('Basic Military Training','Sierra College')` and confirm no HIST 50 row.
3. **The Department of Insurance's license types** (`data_sources`): insurance.ca.gov is outside this environment's
   network (proxy 403; the fetch agent cannot resolve it). Either a session with that host allowed, or a reader that
   runs in the daily workflow, following `official_exam_lists()` in `kb/_build_it_ai_credential_catalog.py`.
4. **Sierra's CPL-AI answers** (`cer-procedures` Next): a cpl-chat change, deployed through `cpl-chat-deploy.yml`.
5. **`reviewer-session-lifetime`:** CPL Pathways' own sign-in gate (`program_requirements.js` `session()`); the main
   queue's file, agree one writer.
6. **The Commons' NEXT** and its Exhibits List in the Catalog's shape; offered, unanswered: let the team phrase mark a
   Commons decision done.
7. The Library lane's standing *Next*.

## Watching
Nothing. Every PR this run opened is merged (#2865, #2866, #2867, CPLBrain#696, #697); no check-in is scheduled. Sheet
163's artifact watch was armed at publish; drop it if it is listed.

> *Greetings, you are SkyFern, a Library side session beside the CPL Queue routine, see SkyMeadow's handoff —
> `docs/library_handoff.md` — let's keep rolling with our queue.*

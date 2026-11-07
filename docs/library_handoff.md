---
title: Library — side-lane handoff (SkyFern, beside the CPL Queue routine)
date: 2026-11-07
tags: [handoff, library, credential-catalog, sierra, cpl-ai, decision-sheet, side-lane]
related:
  - "[[docs/reference/lanes/sierra-retrieval-corpus]]"
  - "[[docs/reference/lanes/cer-procedures]]"
  - "[[docs/reference/lanes/local-course-cr-alignment]]"
  - "[[docs/reference/lanes/library]]"
  - "[[docs/library_lessons]]"
---

# Library — side-lane handoff

> Side-lane handoff; it does not replace the numbered `session_<N>_handoff.md`. **Light checkpoint** (SkyFern,
> 2026-11-07, ~02:20Z, refreshed ~03:45Z after the deploy): no lane's Roadmap row moved and no re-mint or data write ran. Written: the two lane edits (they
> rode #2869), this handoff, the vault note (`CPLBrain/07-session-notes/2026-11-07-skyfern-sierra-cpl-ai-sheet-164.md`).
> Skipped: `cpl_memory` (the one durable fact, Sierra's CPL-AI section, is in the lane and waits on Sam's deploy call),
> the KB-note pass, `kb/status/exhibit.json`, `README.md` and the Pipeline tab (nothing moved).

Your moniker is **SkyBramble**. You pick up after SkyFern on the **Credential Catalog**, **CPL Pathways**, **Sierra's
CPL-AI answers** and the Library ([`library`](reference/lanes/library.md)).

## What shipped (SkyFern, 2026-11-07)
- **Sierra's CPL-AI answers are live (Sam, in session: *"Deploy Sierra's CPL-AI answers"*).** #2870 fixed what the
  preview A/B found: the section keyed on the routes' first match, which for Sacramento City's Security+ question was
  *LA City Certified Welder* (on "city"), and Security+ reached the routes only through the volume lookup. `cplAiPick`
  now reads every route's matches. The A/B workflow also needed `--yes` (the Supabase CLI's new prompt). Preview A/B
  42333759325: preview all modes OK, no regressions. Deploy 42334534191 on 36ddc5b4, byte-verified.
- **#2869 Sierra reads CPL-AI's course ratings.** When the strongest-matched credential is one CPL-AI
  rated, cpl-chat reads `library/adopt/adopt_ai.json` (an hour's cache; `CPL_AI_URL` overrides it) and adds a section:
  the named college's Strong evidence courses, then Faculty interpretation, with Limited evidence as a count. With no
  college named, it gives the colleges with the most Strong evidence courses. Its own rule: a rating is evidence for
  faculty review, a MAP award comes first, the source is credited. `kb/_build_adopt_page.py` now writes `colleges` into
  that file; until the daily run carries it, the section names no college and claims no absence.
  `tests/sierra_cpl_ai.test.js` (31), smoke mode 18. State: [`sierra-retrieval-corpus`](reference/lanes/sierra-retrieval-corpus.md).
- **Open Asks Sheet 165** (https://claude.ai/artifact/72EWWRRWa9cA5gq3vzHEH9, current, fresh store empty at publish;
  CPLBrain#699): Sheet 163's four cards at their places. Sheet 164 (https://claude.ai/artifact/SYPCVGbH8HqsWWsdHcvqGw)
  had card 5, the deploy, answered in session; Sheet 163 (https://claude.ai/artifact/DdQQznv6bP1owM69KEtJNg) held no
  reply. Both are superseded; a later reply on either still counts for its cards. Never republish onto them.
- Two lane files moved an older record verbatim to their lessons docs to stay under the 20 KB budget.

## Decisions Sam made this run
- *"Deploy Sierra's CPL-AI answers"* (in session, 2026-11-07, Sheet 164 card 5): deployed after a preview A/B.

## Open work, in order
1. **Read Sheet 165's replies first, then 164's and 163's** (`ArtifactData` list `replies` on each URL). Carry out each
   answer in the same PR as its lane marker: card 4's CER plan under `kb/cer_decisions_out/`, card 3's migration through
   `supabase-migrate.yml`; card 2 is Sam's to send.
   **The deploy's smoke run** (job in run 42334534191) finished after sign-off if this line is still here: read its
   warnings, and re-check mode 18 alone (`cpl-chat-smoke.yml`, `modes=18`) only if it failed.
   **A finding for `local-course-cr-alignment`:** Route ALIGN uses the same first match, so on Sacramento City's
   Security+ question it built the articulation worklist for *LA City Certified Welder*. The answer ignored it, but the
   ranking (statewide probes on "city" from a college's name) wants the same fix: pick the match the question names.
2. **SkyHarbor's check, still due:** after the next daily run and the 13:20Z `credential-catalog-sync.yml`, read
   `credential_alignment_for_college('Basic Military Training','Sierra College')` and confirm no HIST 50 row.
3. **The Department of Insurance's license types** (`data_sources`): insurance.ca.gov is outside this network. It needs a
   session with that host allowed, or a reader in the daily workflow following `official_exam_lists()`.
4. **`reviewer-session-lifetime`:** CPL Pathways' own sign-in gate (`program_requirements.js` `session()`). The file belongs
   to the main queue, so agree one writer first.
5. **The Commons' NEXT** and its Exhibits List in the Catalog's shape. Still unanswered from earlier: an offer to let the
   team phrase mark a Commons decision done.
6. The Library lane's standing *Next*.

## Watching
Dropped at sign-off: every PR subscription (#2869, #2870, CPLBrain#698, #699, all merged) and the artifact watches on
Sheets 164 and 165. No check-in is scheduled.

> *Greetings, you are SkyBramble, a Library side session beside the CPL Queue routine, see SkyFern's handoff —
> `docs/library_handoff.md` — let's keep rolling with our queue.*

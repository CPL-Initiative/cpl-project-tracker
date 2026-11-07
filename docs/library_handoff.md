---
title: Library — side-lane handoff (SkyBramble, beside the CPL Queue routine)
date: 2026-11-07
tags: [handoff, library, credential-catalog, sierra, alignment, cer, decision-sheet, side-lane]
related:
  - "[[docs/reference/lanes/local-course-cr-alignment]]"
  - "[[docs/reference/lanes/cer-procedures]]"
  - "[[docs/reference/lanes/sierra-retrieval-corpus]]"
  - "[[docs/reference/lanes/library]]"
  - "[[docs/library_lessons]]"
---

# Library — side-lane handoff

> Side-lane handoff; it does not replace the numbered `session_<N>_handoff.md`. **Light checkpoint** (SkyBramble,
> 2026-11-07, ~04:50Z): no Roadmap row moved. Written: the two lane edits, this handoff, the vault note
> (`CPLBrain/07-session-notes/2026-11-07-skybramble-sheet-164-rulings.md`), Open Asks Sheet 166. The run wrote one
> migration (the scorer) and one CER plan; both have receipts beside them. Skipped: `cpl_memory` (each ruling is in its
> lane and in Sheet 164's store), the KB-note pass, `kb/status/exhibit.json`, `README.md`, the Pipeline tab.

Your moniker is **SkyThistle**. You pick up after SkyBramble on the Library side lanes: alignment, the CER, Sierra.

## What happened (SkyBramble, 2026-11-07)
- **Sam had answered all five of Sheet 164's cards** at 02:21-02:23Z, not only the deploy. SkyFern read card 5 in
  session and published Sheet 165 re-asking 1 to 4. **Read every superseded sheet's store before building on it.**
  His answers: 1 *keep one peer*; 2 *do not send*, with *"I don't think MVC has it articulated with History — I think
  it's some mistake we should track down on our end — add it to our queue"*; 3 *tighten*; 4 *correct all seven*.
- **Card 2, tracked down.** MAP's exhibit rows carry the articulating course's COCI C-ID, so Basic Military Training's
  statewide *Principles of Health Education* kept `HIST 150` after SkyHarbor's hold, and Sierra College's `HIST 50`
  matched it at the C-ID rung. `_build_statewide_adoption` now reads the holds (`tests/statewide_cid_hold_test.py`, in
  CI's EACR step). The peer table took the hold on a catalog sync I dispatched at 04:07Z (the first, 04:02Z, timed out
  on the college-courses upsert while my heavy SQL ran; the peer step had already landed). The Sierra College answer
  clears once the daily run regenerates `credential_reference_data.js` and the 13:20Z sync carries it.
- **Card 3:** `kb/migrations/2026-11-07_alignment_level_words.sql` (rollback beside it), applied 04:24Z
  (`kb/receipts/migration_alignment_level_words_42338146882.json`); Advanced Strength Training at Sierra College now
  offers only KIN 5B Strength Training.
- **Card 4:** `kb/cer_decisions_out/2026-11-07/plan.json`, cohort `exhibits-s596@bot`. Validated by the applier; the
  local fold preview gave 7 revise, 0 held, V2 and V3 OK. **Dispatch `cer-decision-apply.yml` on `main` with that
  plan_dir, dry-run then commit,** once this PR merges.
- **Route ALIGN** takes the matched credential the question names (`askedTitlePick`). Built, not deployed.
- **Open Asks Sheet 166** (https://claude.ai/artifact/3FsBDnx8buBKwoZUxzQAa4, current, fresh store): 1, CompTIA alone as
  issuer of the four ECHT exhibits; 2, deploy Route ALIGN's pick. Sheets 163, 164 and 165 are answered or superseded.

## Open work, in order
1. **Read Sheet 166's replies** (`ArtifactData` list `replies`). Card 1 *comptia*: a CER plan replacing the four ECHT
   `issuing_agency_assignment` rows, and the second issuer off the four credentials in `kb/credentials.json`. Card 2
   *deploy*: preview A/B, then `cpl-chat-deploy.yml`.
2. **If this PR's apply has not run:** dispatch `cer-decision-apply.yml` (dry-run, then commit) on
   `kb/cer_decisions_out/2026-11-07`. The scorer migration is applied (04:24Z) and read back.
3. **After the daily run and the 13:20Z sync:** `credential_alignment_for_college('Basic Military Training','Sierra College')`
   holds no `HIST 50` row and no `MUS 4A`.
4. **The claim audit's 10 findings** (`kb/cid_claim_audit.json`, content-based since Sam's 2026-11-07 word): each is
   a team item, hold it with its sister colleges' home or clear it. Add course SLOs, SOC and course CIP to the
   content test when a source carries them (`data_sources`).
5. The Department of Insurance's license types (`data_sources`; outside this network), CPL Pathways' sign-in gate
   (agree one writer with the main queue), the Commons' NEXT, the Library lane's standing *Next*.
6. `tests/statewide_kpi_test.py` fails on `main` before this change (a card shows *Issuer/type variants*); not ours.

## Watching
The PR subscription and the Sheet 166 watch drop at sign-off; the handoff names them.

> *Greetings, you are SkyThistle, a Library side session beside the CPL Queue routine, see SkyBramble's handoff —
> `docs/library_handoff.md` — let's keep rolling with our queue.*

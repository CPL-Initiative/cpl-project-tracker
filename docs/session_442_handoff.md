---
title: "Session 442 handoff: the CLAUDE.md pass waits on Sheet 109; S440's harvest PR merged; two tests fixed"
date: 2026-10-21
session: 441 (SkyIronbark)
tags: [handoff, claude-md-pass, governance-team-enablement, program-requirements-harvest]
status: current
superseded: true
superseded_by: session_445_handoff.md
---

# You are Session 442

Your moniker is **SkyManzanita**. Session 441 (**SkyIronbark**) was started by the CPL Queue routine at 10:14Z on
2026-10-21. If the routine started you, follow `docs/reference/scheduled_sessions.md` first.

## What happened this run

- **No `list_sessions` again.** The fallback found S440's PR #2306 open, draft, every check green, with handoff 441
  on its branch and no writer note after 09:23Z. S441 marked it ready and squash-merged it (3f8ca4a6).
- **The CLAUDE.md pass went to Sam as [Open Asks Sheet 109](https://claude.ai/artifact/FJ2UbqDiaCfc6adgrTjynE)
  (current, published ~10:20Z, store empty at publish).** Five cards, all pre-selected to the recommendation, nothing
  applied: 1 a light checkpoint tier; 2 the UI pass leaves the checkpoint and becomes one queue item a night; 3 the
  auto-mark rule in CLAUDE.md with one hold list (three holds added on Fable's advice); 4 say when other sessions are
  not visible; 5 two pulls to bring CLAUDE.md (60,810 bytes) under its 60,000 budget. Every rule's tag and evidence:
  `CPLBrain/decision-sheets/claude-md-pass/2026-10-21-claude-md-pass.md`. The governance lane carries the NEEDS SAM.
- **Handoff 441's item 6 is done:** `tests/workplan_description_drafts_test.py` read the two landed drafts as stale
  (`landed()` in `kb/_draft_workplan_descriptions.py` now keeps them as the record and `--sql` skips them), and
  `kb/_test_activity_card_current.py` still named Apprentice 3.1.2a, re-keyed 3.1.3 on 2026-07-21. Both pass. CI runs
  neither (it needs `openpyxl`); wiring them in is small.

## Priority

1. **Read Sheet 109's replies first** (`ArtifactData` list, collection `replies`, url above; then `replies/done`).
   Apply each verdict as its card words it, in one tracker PR plus one vault PR (tracker first): CLAUDE.md, the
   checkpoint command, `scheduled_sessions.md` pointing at the one hold list, the governance lane's marker gone, and
   the five cards out of the builder. Card 5 "both" writes a reference note for the funding vocabulary's quotes
   (keep every ban inline) and moves the seven parked rows to `docs/reference/mid_lifecycle.md`. No reply: the
   sheet waits; go on to 2.
2. **The harvest's next colleges** (handoff 441 item 2): list the thin ones live (active COCI programs against
   records, under 60%; Golden West, Reedley, Sierra, Moorpark, Oxnard, Skyline and College of the Canyons sat
   between 12% and 53%), capture-only first, extraction under the $40 go, one run waiting per branch.
3. **The Course Progress view** (Commons lane NEXT), as handoff 440 item 2 describes.
4. **Grok:** nothing until Sam says the key is in.

## Headline (read live about 10:22Z)

20,282 active programs, 12,132 complete, 114 colleges; 15,180 records in all.

## Lessons to honor

- When a PR from the previous session sits draft with every check green and its handoff on the branch, that
  session signed off without merging; merge it after confirming `test` succeeded on its head.
- A fixture or a check keyed by ids rots when the ids re-key, and a test CI does not run rots unseen.
- Fable, asked once, turned a light-tier proposal into a better question (move the UI pass) and caught three holds
  the draft list lacked.

## Not refreshed

Light in practice: the UI pass (card 2 asks to move it out of the checkpoint; the ledger keeps `cpl-opportunity`
due), the Pipeline tab (nothing moved), `kb/README.md`, `README.md`, no KB note, the Commons run logs (no reference
touched).

## Let go

S441 holds no PR subscription, no check-in and no artifact watch (remote sessions cannot watch). The routine's next
firing is 11:12Z.

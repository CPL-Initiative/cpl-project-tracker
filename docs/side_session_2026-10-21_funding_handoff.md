---
title: "Side session beside S442/S443, 2026-10-21: the funding page's Sierra, the guidance memo, the Sierra funding note, the narrated film"
date: 2026-10-21
session: side session (session_01XQMmTq7rSj2Q4Q3fSJyV1m), beside S442 SkyManzanita and S443 SkyToyon
tags: [handoff, implementation-funding, sierra-retrieval-corpus, funding-video, library]
status: current
---

# Funding-page side session, 2026-10-21

Not a numbered handoff: S443 SkyToyon holds the numbered line (`session_443_handoff.md`). This file carries one
side session's open thread so the next session can pick it up.

## Landed (all merged unless noted)

- **#2311** The funding page's Sierra drawer: the reader's question reads white on navy (`--on-seal` in the drawer's
  scoped block). Header "As of: <last save, Pacific> Ver. <scenario number>" (`_scenario().savedAt`, payload `saved_at`).
- **#2314** `funding-model/memo/`: the public guidance memo, built from the published scenario (`_buildMemo("memo")`),
  linked as the first Contents tail item, never called a draft. Report view: a status per document, Draft / Final /
  Tabled (`DOC_STATUS`, saved with the scenario; Tabled withdraws the public memo and its Contents link). Library record
  `cpl-funding-guidance-memo` (unlisted; listing is Sam's reviewer call). `scripts/funding_sierra_note.js`.
- **samueltlee/CPLBrain#423, #425** `funding-note.yml`: daily 13:41 UTC (and on dispatch) writes
  `04-projects/cpl-initiative/resources/cpl-funding-model-live.md` from the live config and indexes the vault (CPU torch;
  a dispatch always indexes). First index 18:13Z, 38 sections.
- **#2319** The stopgap `sierra_guidance` row (`sierra-s443@bot`) deactivated 18:23Z; the note replaced it.
- **#2323 (OPEN, green on 9dacdf3, new head 72e733d carries the corrected MP4)** Narrated film draft 4: Sam's edited
  script (`20261021_CPL_Funding_in_Motion_Narration_Script_Sierra.docx`), ten scenes re-read by Sierra (Bella
  `hpp4J3VqNfWAUOO0d1Us`, `eleven_multilingual_v2`, flow `DORtbrSu16j7ETeqaSkB`), n2 now built from `figures.json` like s2
  (it had kept Scenario 2's 34.5 FTES / 4,366.7 frames). `20260930_CPL_Funding_in_Motion_Scenario_2_Narrated_Draft_4.mp4`.
  Draft 5 superseded it; see below.

## Done since: the pronunciation re-read (Draft 5)

Sam picked sample C (2026-10-21): *"C is the best... when referring to 1 FTES, it does need to be spelled out as
F-T-E-S. When multiple, it's F-T-Es"*, and cut scene 6 to *"Outcomes are measured in FTES and funded at half the
reimbursement rate."* A scene may now carry `say` (the voice, `text_sha1` and alignment read it; captions keep `text`):
CPL is said `C.P.L.`, one FTES `F.T.E.S.`, more than one `FTEs`. Nine scenes re-read; 40 cues pinned, 6 skipped.
`20260930_CPL_Funding_in_Motion_Scenario_2_Narrated_Draft_5.mp4` (2:41) went to Sam. Merge #2323 once `test` passes.

## Also waiting on Sam
- List the memo in the public Library (Library tab, a reviewer's click) and set the memo Final in the Report view.
- The name for the program-data effort (S442 holds the CPL Pathways status panel; recommended "Common Pathways Reference").

## Subscriptions
PR #2323 is watched by this session; drop it when merged.

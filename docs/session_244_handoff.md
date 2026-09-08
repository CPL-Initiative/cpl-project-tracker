---
title: "Session 244 handoff — nine disagreements that never printed, and 19 COBI tabs still red"
created: 2026-09-08
updated: 2026-09-08
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 244

Your moniker is **SkyExit**. The name is the job: this run's central finding was
a message that rode one exit out of four, so it was computed correctly and never
reached a reader. Predecessors: SkyClear S241 → SkyTrue S242 → **SkyGate S243**
(this run).

## What this run did

One PR: [#1520](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1520).
No decisions from Sam this run — he was not in session.

**Two defects of one family: a value computed correctly that never reached the
reader.**

## ⭐ THE THINGS TO CARRY FORWARD

1. ⭐ **A MESSAGE MUST RIDE EVERY EXIT.** `standingHtml()` built the
   edge-overrules-the-vote note and appended it to **one of four returns** — the
   branch for a subject that IS its home's Common SUBJ. A disagreeing subject is
   by construction usually not that, so it left by the umbrella or not-its-code
   exit, both of which dropped it; the two largest cases returned earlier still,
   at the no-seed-entry guard. **Nine disagreements, zero printed.** The question
   is never "does the message read correctly" — it is **"which exits carry it,
   and which cases take those exits?"**
   [`methodology-a-message-must-ride-every-exit`](kb-notes/methodology-a-message-must-ride-every-exit.md)
2. ⚠️ **IT IS NINE, NOT FOUR — AND WRONG IN THE SAFE DIRECTION IS WHY IT
   SURVIVED.** Four does not look like a bug; it looks like a small problem. The
   lane file, the code comment and the handoff all carried it. **Count the cases
   a message is FOR, then count the ones that print it** — that is one script,
   and no amount of reading finds it.
3. ⚠️ **A UNANIMOUS VOTE OF ONE IS NOT A VOTE.** HUMN's single voting identity
   is *Music for Video Games and Film* (→ Music); its three blanks are
   popular-culture titles. Filling from that reading files three humanities
   courses under Music. **37 of the 93 blanks' 50 subject codes have no other
   identity carrying the prefix at all** — there is nothing to corroborate
   against, and inventing a discipline from one title is indistinguishable on
   every surface from one a curator chose.
4. ⚠️ **A FAULT IN SHARED CHROME IS A FAULT ON EVERY ROUTE.** `input#cplfl-optout`
   at 182.1 × 19.9 was the SOLE fault on 17 of COBI's 38 tabs and one fault line
   on all 38, because `first_light.js` paints on every one. Two declarations took
   the sweep **38/38 failing → 19**. ⚠️ **The 24px floor belongs on the LABEL**:
   the engine measures the hit area, and a wrapping label replaces its control's
   box, so growing the 15px checkbox would have moved a number nothing reads.
5. ⚠️ **A BACKGROUND MEASUREMENT AND A FOREGROUND EDIT OF THE SAME FILE CANNOT
   BOTH BE TRUSTED.** My first "after" sweep still showed the fault at 390px and
   I started theorizing a narrow-width override. There was none: my
   revert-verification `sed` had run *while the sweep was in flight*. One direct
   Playwright probe settled it. Same shape as S242's revert harness overwriting
   its own backup.
6. ⚠️ **A BOT PUSHES `[skip ci]` COMMITS ONTO YOUR BRANCH.**
   `first-light-art.yml` pushed `chore(first-light): art candidates …
   [skip ci]` onto this PR's head seconds after it opened, so the `test` run
   that DID pass is on a superseded sha and the current head has no run. Check
   `head_sha` against the PR head before you trust a green check — and note the
   fix is your next real commit, never an empty one.

## The nine, for whoever rules them

| SUBJ4 | the map says | its courses sit under | agreement |
|---|---|---|---|
| ATHL | Physical Education | Kinesiology | 1,101 of 1,101 |
| THTR | Theater Arts | Drama/Theater Arts | 1,093 of 1,109 |
| ESCI | Earth Science | Environmental Technologies | 465 of 476 |
| ELEC | Electronics | Electricity | 342 of 353 |
| MUSC | Music | Commercial Music | 127 of 134 |
| ETHN | Ethnic Studies | Chicano Studies | 34 of 35 |
| PHTO | Photography | Multimedia | 3 of 12 |
| ESLN | English as a Second Language | …Noncredit 53412 | 5 of 5 |
| ENVS | Environmental Technologies | Biological Sciences | 1 of 1 |

## YOUR PRIORITY

1. **READ THE DECISION SHEET'S REPLIES FIRST** — nine numbered calls on the
   subject–discipline edge, live at
   https://claude.ai/code/artifact/14c480c9-53e1-41eb-b530-60a1f53d479b
   (source: `docs/visuals/2026-09-08-the-subject-discipline-edge-nine-and-five.html`).
   ⚠️ **The artifact carries NO wake subscription** — the service refused one for
   S243's session — so nothing will tell you a reply landed. **Read it with the
   Artifact tool's `read_db`, collection `replies`, before doing anything else on
   this lane.** Items 1–5 are five map entries (BSOT, HUMA, GRAF, BCST, BARB);
   6 is HOSP; 7–9 are the nine disagreements, ESLN's data defect, and the 37
   uncorroborated codes.
2. **The 19 COBI tabs still failing `npm run a11y cobi`** — sized, not fixed: 71
   distinct failing selectors, 5,332 sub-24px target instances, 22
   keyboard-unreachable scrollers. `our-process` is six faults from two tokens
   (`--op-ink-faint` #6C8188 at 3.49:1 → #4F646B; `--op-amber` #B9772A at 3.13:1
   → #925003 for its TEXT uses, keeping the accent for decoration, which is the
   `--mustard` / `--mustard-text` pattern the design system already has);
   `pipeline` is ten. ⚠️ **This is the fan-out shape** — many surfaces, each hit
   cheap to verify by re-running the sweep. Say so before you start.
3. **DR-24's write surface** — the curate phrase and the propose/second gate.
   The register row exists with Sam as owner; the phrase's SCOPE is open.
4. `docs/skyview_backlog.md`.

## NEEDS SAM

① Where agency skill statements come from when the three sources disagree.
② Which disciplines are grab bags besides Vocational and the no-discipline pile.
③ The three legacy anchors with no seed discipline (`M-ID HOSP 100`, `104`, `102`).
④ Whether 60 is the right search depth; whether an emptied discipline ghosts.
⑤ The right-edge glyph rail from his Obsidian screenshot.
⑥ His eye on the CPL face (`#skyview/cpl`).
⑦ His eye on the Sky at the new frame rate (~21.7 fps headless).
⑧ His eye on the live-session banner now Pages has deployed.
⑨ **The nine subject–discipline disagreements** — on the sheet above.

## Read these, in this order

1. This file.
2. `docs/reference/lanes/skyview-ccr-interface.md` — items ② and ③ under NEXT
   carry the measured state of the 93 and the nine.
3. `docs/ccr_atlas_lessons.md`, the 2026-09-08 S243 section.
4. `docs/kb-notes/methodology-a-message-must-ride-every-exit.md`.

## Safety patterns to honor

- **`./scripts/check_generated.sh` LAST before every push.** It caught a stale
  dependency map on this run after `npm test` passed 313/313.
- ⚠️ **Never edit a file while a background sweep or suite is reading it.**
- ⚠️ **`npm test` proves nothing about layout** — run `npm run a11y <target>`.
  It takes ~100 s for COBI's 38 routes × 2 widths.
- ⚠️ **Verify a guard by REVERTING its fix**, check by check. This run's new
  suite fails exactly four of nine reverted, which is the shape to want.
- ⚠️ **A figure is only wrong relative to the payload it names.** The nine were
  measured on `prototype/ccr_universe.json` against the map file `EDGE_URLS`
  fetches — the same rule the page applies, against the same file.
- ⚠️ **The sandbox cannot reach `*.supabase.co`** (Rule 10c). Use the MCP tools.
- Never force-push `main` (Rule 5). Squash-merge on a green `test` whose
  `head_sha` matches the PR head.

---

Greetings, you are SkyExit (Session 244), see SkyGate's handoff —
`docs/session_244_handoff.md` — let's keep rolling with our queue.

---
title: "Session 243 handoff — the frame budget is bought; the subject–discipline edge has no owner"
created: 2026-09-08
updated: 2026-09-08
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 243

Your moniker is **SkyLedger**. The name is the job: this run's findings were all
about a *record* that quietly disagreed with itself — a memo that never hit, a
warning erased by its own writer, a discipline that exists in the repo and never
reaches the payload. Predecessors: SkyGlobe S239 → SkyDome S240 → SkyClear S241
→ **SkyTrue S242** (this run).

## What this run did

One PR: [#1517](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1517),
three commits. ⚠️ **It was still in CI when the session ended — check it first.**

**The frame budget (the lane's NEXT ⓪, now done).** Measured back-to-back on the
served page, same machine, same minute: a median frame **81 ms → 46 ms**, about
**12.3 → 21.7 fps**. Three defects, one shape — a value that DRIFTS used as
though it were stable, and work done for points nobody could see.

**Sam's question, answered mid-run.** `PSYC C1000` *does* carry Psychology. The
map is right that the payload does not. Then he pushed further — is the model
recursive or conflicted? — and asked for a decision sheet. It is out and
unanswered.

## ⭐ THE THINGS TO CARRY FORWARD

1. ⭐ **FIXING A COST CAN MOVE IT RATHER THAN REMOVE IT.** `measureText` was
   11.2% of the profile; the memo fix took its calls 15.4 → 0.17 a frame and
   **`strokeText` went 0.6% → 9.6%**. Chromium builds a font at its first USE,
   so removing one caller promotes the next. Nothing had been saved. **Stopping
   at "it left the profile" would have shipped a wash and reported a win.**
   [`note`](kb-notes/methodology-fixing-a-cost-can-move-it-rather-than-remove-it.md)
2. ⭐ **A MEMO KEYED ON A VALUE THAT DRIFTS IS NOT A MEMO.** The key was
   `ctx.font` + the string; an island label is sized off its drawn radius, so
   every frame asked a question it had never asked. It is now measured once at
   `TW_REF` and scaled.
3. ⚠️ **A ROUND IS A THRESHOLD.** `labelSize()` rounds the drawn size to whole
   pixels **with a 0.6px dead band** — a bare `Math.round` on a drifting value
   flips 18↔19 every frame, a worse shimmer than the one being fixed. Third time
   this lane has paid for a bare threshold (`NODE_ZOOM_KEEP`; the tint that
   became the sky).
4. ⚠️ **THE FIRST DRAFT OF THE GUARD PASSED WITH EVERY FIX REVERTED.** Both
   fixture islands sat at the label-size clamp (no size could be fractional or
   drift) and all three points sat mid-canvas (no dot could be off screen).
   Fixed with `__ccrTextStep(0)` and a point 4,000 units out; **one check was
   deleted as unfailable**, and each survivor was verified by reverting its fix.
   **Revert your guard before you trust it.**
5. ⚠️ **THE REVERT HARNESS OVERWROTE ITS OWN BACKUP** (`cp file $GOOD` after an
   earlier failed run had already reverted the file). For two rounds the "good"
   state under test was missing `labelSize`. The suite caught it.
6. ⚠️ **`npm run test:floor` ERASED ITS OWN SAFETY WARNING** — the `_note`
   carrying "an interrupted run has written a LOWER floor before, so diff for
   LOWERED numbers before committing." Restoring it by hand was worthless, since
   the next run would erase it again; `tests/run.js` now carries the note
   through. **A file whose safety instruction is deleted by its own writer loses
   it silently.**
7. **The three above are one lesson**: a fix verified against the property it
   changed rather than the outcome it was for. S241 said it about correctness vs
   appearance; this run hit it three more times.

## Sam's question — and the sheet he asked for

`PSYC C1000` carries `"discipline": "Psychology"` in
`kb/reference/coci_courses.json` (classified 2026-05-20) and `disc:null` in the
payload. **Two minting paths, one inference pipeline**: all five inference passes
read `kb/coci_minted_courses.json` — **19,568 records, every one an M-ID** — and
`excel_to_dashboard.py` loads the C-ID/CCN reference but reads **only
`description`** from it.

- Blank rate **0.4% M-ID against 47.5% C-ID / 49.1% CCN**. A gap that tracks
  *where a row came from* rather than *what the row is* is a plumbing gap.
- **233 of the 326 fillable** from stores already held (199 identifier
  reference · 177 subject map · **143 of 143 agreement** where both have an
  opinion, zero disagreements). 93 would remain.
- ⚠️ **Not TOP's job** — 219 of the 326 carry a TOP code; Rule 7 keeps it a
  corroborator. The reference's discipline comes from the identifier's own
  subject prefix against the MQ list.
- Joins agree direct and through `kb/alias_chain.py` (199 both ways) — current-era.

Then his sharper question: *"could our procedures be recursive or conflicted?"*

- **Conflicted: no**, measured. **Recursive: yes**, in the display layer. COBI's
  CCR list says it verbatim — *"Common SUBJ is a function of discipline, so it
  stays blank until one is assigned"* — so no discipline means no Common SUBJ,
  and nothing derives the discipline from the `PSYC` prefix sitting on the id.
- SkyView's subject table votes: a subject's home discipline is the modal
  discipline of its identities. **148 of 344 subjects vote blank**; our own map
  file names a discipline for 11 (AERO→Aviation, PHTO→Photography,
  STAT→Mathematics…). ⚠️ **PSYC is NOT one of them** (268 to 2) — two separate
  defects that look like one.
- **28 of the 326 are firewalled locked anchors** (all CCN-ID); 298 are editable
  today. Sam filed the only `anchor_discipline_proposal` in the table at 14:05
  on 2026-09-08 — *Psychology*, on `PSYC C1000` — and **nothing consumes it**.
- **No register row exists for the subject–discipline edge.** DR-04 covers M-ID
  canonical SUBJ4, DR-03 TOP, DR-17 CR wording; all three have `owner: null`.

**THE SHEET IS OUT AND UNANSWERED** — five calls:
https://claude.ai/code/artifact/2f42d0a6-4d71-43ab-a8be-f4506e5f7c2c
(`docs/visuals/2026-09-08-subjects-disciplines-and-who-decides.html`).
⚠️ **Read the replies FIRST** with the Artifact tool's `read_db`, collection
`replies`. ⚠️ This session could NOT register a wake subscription on it
(`subscribe_forbidden`, 403) — so nobody is notified; you must go and look.

## YOUR PRIORITY

1. **PR #1517** — CI was still running at session end. Re-read `get_check_runs`
   on the CURRENT head (`ebc7292` or later), squash-merge on green, fix and push
   if red. A `send_later` check-in was armed for 15:31Z 2026-09-08; if it never
   fired, do this by hand.
2. **The sheet's replies.** Items 2 and 3 are buildable the moment he rules;
   item 5 (who owns the subject–discipline edge) is the one only he can answer.
3. **Sam's eye on the Sky at 21.7 fps** — still open from S241/S242. The
   remaining named JS is the per-node loop (14%) and the island loop (10%), the
   irreducible walk. **Fewer points per frame is the lever that has worked three
   times running.**
4. Then the standing queue: **DR-24's write surface** (the register row exists,
   owner Sam; the phrase's SCOPE is what is open), the skills layer's fetch
   problem (NEEDS SAM ①), and `docs/skyview_backlog.md`.

## NEEDS SAM

① Where agency skill statements come from when the three sources disagree.
② Which disciplines are grab bags besides Vocational and the no-discipline pile.
③ The live-session banner — what link, which tabs.
④ The three legacy anchors with no seed discipline (`M-ID HOSP 100`, `104`, `102`).
⑤ Whether 60 is the right search depth; whether an emptied discipline vanishes
or ghosts.
⑥ The right-edge glyph rail from his Obsidian screenshot — his call.
⑦ His eye on the CPL face (`#skyview/cpl`).
⑧ His eye on the Sky as culled AND at the new frame rate.
⑨ **The five calls on the subject–discipline sheet** (2026-09-08) — new.

## Read these, in this order

1. This file.
2. `docs/reference/lanes/skyview-ccr-interface.md` — the invariants; the S242
   block and the rewritten NEXT are at the top of their sections.
3. `docs/ccr_atlas_lessons.md`, the 2026-09-08 S242 section.
4. `docs/kb-notes/methodology-fixing-a-cost-can-move-it-rather-than-remove-it.md`
   and `methodology-a-discipline-can-exist-in-the-repo-and-never-reach-the-payload.md`.

## Safety patterns to honor

- **The page must be SERVED, not opened** — `file://` blocks the payload fetch.
- **Edit the SOURCES** (`prototype/ccr_universe.js`, `prototype/ccr_atlas_v1.html`)
  and rebuild with `python3 prototype/build_ccr_atlas.py`.
- **`npm test` sees none of the layout.** Drive a real browser; run
  `npm run a11y skyview`.
- ⚠️ **A performance claim needs a BACK-TO-BACK measurement.** Before/after taken
  minutes apart drifted 20% on this machine from load alone; the honest 81→46 ms
  came from stashing and re-measuring in the same minute.
- Never force-push `main` (Rule 5). Squash-merge on green `test`.

## Not done this run

⚠️ **This was NOT a full `/checkpoint`** — Rule 9's 13 artifacts were not all
refreshed. Written: this handoff, the lane file, the lessons doc, two KB notes,
`docs/INDEX.md`, the `cpl_memory` row, the decision sheet. **Not refreshed:** the
To-Do feed, `CLAUDE.md` §11's narrative, and the rest of the 13. Offer
`/checkpoint` early.

---

Greetings, you are SkyLedger (Session 243), see SkyTrue's handoff —
`docs/session_243_handoff.md` — let's keep rolling with our queue.

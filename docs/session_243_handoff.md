---
title: "Session 243 handoff — the frame budget is bought, DR-25/26 are owned, and the banner is live"
created: 2026-09-08
updated: 2026-09-08
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_245_handoff.md
---

# You are Session 243

Your moniker is **SkyGate**. The name is the job: this run's three hardest
mistakes were all about WHO or WHAT is allowed through — a memo whose key let
everything through, a fill reading the wrong field, and an access gate that took
three passes to name the right 42 people. Predecessors: SkyDome S240 →
SkyClear S241 → **SkyTrue S242** (this run).

## What this run did

One PR, merged: [#1517](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1517)
— 17 commits, 36 files, squashed to `152ecd71`. Plus CPLBrain #126.

**The frame budget.** Median frame **81 ms → 46 ms** (~12.3 → 21.7 fps),
measured back-to-back on one machine in one minute.

**Sam's five rulings**, all `yes`, all built: DR-25, the edge fill (326 → 93
blanks), SkyView's subject table reading the map instead of voting.

**The COBI header**: seal hidden, and **DR-26 — the live-session banner**, live
and pointing at a shared session.

## ⭐ THE THINGS TO CARRY FORWARD

1. ⭐ **FIXING A COST CAN MOVE IT RATHER THAN REMOVE IT.** `measureText` was
   11.2% of the profile; the memo fix took it to zero and **`strokeText` went
   0.6% → 9.6%**. A font is built at its first USE, so removing one caller
   promotes the next. **Stopping at "it left the profile" would have shipped a
   wash and reported a win.** Re-profile, and compare TOTALS, not entries.
2. ⭐ **A MEMO KEYED ON A VALUE THAT DRIFTS IS NOT A MEMO**, and **a bare round
   is a threshold** — `labelSize()` has a 0.6px dead band because 18↔19 every
   frame is a worse shimmer than the one being fixed.
3. ⚠️ **`row["subj"]` IS THE LOCAL COLLEGE CODES, NOT THE SUBJ4.** Freehand and
   multi-valued (`AEROST`, `ARTHIST`, `DANCE (DANCE)`). The canonical code is
   the **id prefix**. Caught only by chasing a 3-row gap between 233 predicted
   and 230 produced — **a near-match is not a match**.
4. ⚠️ **"NOT SIGNED IN" AND "ONLY THESE PEOPLE" CANNOT BOTH HOLD.** Identity
   comes from a credential. Three passes to get the audience right; the note is
   [`methodology-not-signed-in-and-only-these-people-cannot-both-hold`](kb-notes/methodology-not-signed-in-and-only-these-people-cannot-both-hold.md).
   ⚠️ **Count the group before you gate on it** — an allowlist of 10 for an
   audience of 42.
5. ⚠️ **MAP Users ≠ Team & RACI.** MAP Users is the COLLEGE roster
   (`map_college_users`, 2,801). The MAP TEAM is `team_members` (42, org MAP) on
   **Team & RACI**. I got this wrong and Sam corrected it.
6. ⚠️ **A GUARD'S FIRST DRAFT PASSED WITH EVERY FIX REVERTED.** Both fixture
   islands sat at the label-size clamp; all three points sat mid-canvas.
   **Revert your guard before you trust it.**
7. ⚠️ **THREE CI CYCLES WENT TO STALE GENERATED FILES**, each the same shape: a
   generator run BEFORE the last edit. **Run `./scripts/check_generated.sh` LAST
   before every push** — `node tests/run.js` covers none of them and passed
   310/310 while two were stale. ⚠️ And the script shipped incomplete itself,
   missing `cobi_admin_surface.js`. It covers four now.

## Decisions Sam made this run

- **All five subjects-and-disciplines calls: `yes`**, no notes (sheet
  `docs/visuals/2026-09-08-subjects-disciplines-and-who-decides.html`).
- **"Hide the CO logo on the COBI header… We'll just leave it plain COBI."**
- **Banner option A**: announce only a session already shared.
- **"Limit the folks who can use the banner link to MAP Team Users."** Then:
  **"they wouldn't need to be signed in… just ensure that they are on the team
  table"** → the phrase is the trade.
- ⭐ **VOICE, standing rule:** *"no mannerly language, avoiding adjective
  phrases, metaphors, and redundant asides. Mannerly language is irritating
  because it seeks to draw attention to the writer rather than the reader."*
  His two examples of mine: *"Worth saying out loud though."* → **"Note:"**;
  *"I would rather build that as its own PR than bolt it onto this one."* →
  **"I'm making a PR for it."** In `CLAUDE.md` house voice, `cpl_memory`, and
  the CPLBrain braindump. **Applies to explainers AND replies to Sam.**

## YOUR PRIORITY

1. **Sam's eye on the banner** once Pages deployed — and on the Sky at ~21.7 fps.
2. **DR-24's write surface** — the curate phrase and the propose/second gate.
   The register row exists with Sam as owner; the phrase's SCOPE is open.
3. **The 93 blanks the edge could not fill** — 15 null in the identifier
   reference, 78 with a SUBJ4 the map does not carry. One map entry fills a
   whole subject.
4. **The four subjects where the edge overrules a real vote** — ETHN (34
   identities under Chicano Studies), ESLN (a malformed discipline name). The
   row prints both; someone should decide.
5. `docs/skyview_backlog.md`.

## NEEDS SAM

① Where agency skill statements come from when the three sources disagree.
② Which disciplines are grab bags besides Vocational and the no-discipline pile.
③ ~~The live-session banner~~ — **ANSWERED** (DR-26, built and live).
④ The three legacy anchors with no seed discipline (`M-ID HOSP 100`, `104`, `102`).
⑤ Whether 60 is the right search depth; whether an emptied discipline ghosts.
⑥ The right-edge glyph rail from his Obsidian screenshot.
⑦ His eye on the CPL face (`#skyview/cpl`).
⑧ His eye on the Sky at the new frame rate.
⑨ **The four edge/vote disagreements** (new).
⑩ **`npm run a11y cobi` fails 38 of 38 routes on PRE-EXISTING faults** —
`input#cplfl-optout` is 182×20 against the 24×24 minimum, and `p.tphx-intro`
measures 3.24:1 against 4.5. Confirmed pre-existing by stashing and re-running.
Not mine, not fixed, worth fixing.

## Read these, in this order

1. This file.
2. `docs/reference/lanes/skyview-ccr-interface.md` — invariants + NEXT.
3. `docs/reference/lanes/governance-team-enablement.md` — DR-25/26 and why the
   audience took three passes.
4. `docs/ccr_atlas_lessons.md`, the 2026-09-08 S242 section.

## Safety patterns to honor

- **`./scripts/check_generated.sh` LAST before every push.** Four generators.
- **The page must be SERVED, not opened**; edit the SOURCES and rebuild with
  `python3 prototype/build_ccr_atlas.py`.
- **`npm test` sees no layout and no generated file.** `npm run a11y skyview`.
- ⚠️ **A performance claim needs a BACK-TO-BACK measurement** — before/after
  minutes apart drifted 20% on this machine from load alone.
- ⚠️ **The sandbox cannot reach `*.supabase.co`** (Rule 10c). All Supabase work
  goes through the MCP tools; a browser probe of a live read fails with
  `ERR_TUNNEL_CONNECTION_FAILED`, which is the sandbox, not the code.
- Never force-push `main` (Rule 5). Squash-merge on green `test`, and check the
  job's `head_sha` matches the PR head — five superseded runs went by today.

---

Greetings, you are SkyGate (Session 243), see SkyTrue's handoff —
`docs/session_243_handoff.md` — let's keep rolling with our queue.

---
title: Session 193 handoff — SkyView leads now, and the work surface behind it is 1.2% built
created: 2026-08-25
updated: 2026-08-25
tags: [handoff, session-193, skyview, ccr, curation, memory]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/ccr_atlas_lessons]]"
  - "[[docs/kb-notes/methodology-a-write-key-must-name-exactly-one-thing]]"
  - "[[docs/kb-notes/methodology-a-view-must-not-fly-where-it-cannot-draw]]"
superseded: true
superseded_by: session_197_handoff.md
---

# Session 193 handoff

You are **Session 193**. Session 192 ran as **SkyCruise** (Sam's name for it —
*"Cruising to the moon!"*). It was a live session: Sam drove SkyView in a browser
throughout and reported defects as he found them, so most of what shipped came
from him watching it work rather than from a plan.

⚠️ Sam runs several sessions at once. `git log origin/main` before assuming your
branch is the only work in flight.

---

## Read this first

**PR #1329** is open, ready and watched — everything below is in it. A self
check-in was armed to squash-merge it on green. ⚠️ **Verify it actually merged**
rather than assuming: a `check_suite.completed` event on this repo routinely
names a SUPERSEDED head, and this session got one naming a commit two pushes old.

⚠️ **`npm test` is 267 files / ~40 minutes and cannot complete in this sandbox's
command budget.** Session 192 claimed it green in the PR body before checking,
and corrected it. Run the targeted suites locally and let CI own the full one.

✅ **The Memory Briefing is CONFIRMED** — Sam read it in a browser, 2026-08-25:
*"I checked the Memory Briefing and it looks great!"* That closes the last open
carryover from Session 192. **Do not re-ask.**

⭐ **And reading it is what found the defect.** His very next message: the
briefing named **Sierra College** as the college with wrong data when the college
was **Moreno Valley** in RCCD. Sierra College is a genuine CCC (Sierra Joint CCD,
MIS 271), so that is a false statement about a real institution, not loose
wording. **25 active `cpl_memory` rows use "Sierra" to mean the assistant and
none of them says so.** Recorded as `sierra-the-assistant-is-not-sierra-college`
(verified, sourced to Sam).

⚠️ **NOT fixed in code.** The obvious fix is a `sierra_guidance` rule, but it
would reach every surface including the public one and change what the live
assistant says. **That is Sam's call, not a session's — ask before writing it.**
(A `surface` column now exists on `sierra_guidance`, so it *could* be scoped.)

## What shipped

| | |
|---|---|
| **The write-key guard** | `CN:<control number>` does not name one course on 3,634 draggable rows. SkyView refuses those moves and says why; back-ported to the decision view, which was a second unguarded write path. |
| **`kb/_audit_control_number_claims.py`** | New, READ-ONLY, dated receipt. Derives the taxonomy so the number is measured, not remembered. |
| **Search** | Lands where its hits can be seen; a subject name goes to that subject; one search box, in the header. |
| **Labels** | Course names stopped stacking — 344 queued, 54 fit, 290 were painted over each other. |
| **Decision view** | Ranked cards, card-to-card drag, pan/zoom on the graph, a group review status. |
| **The flip** | SkyView is the landing view; the subject list is a button on it — shipped with keyboard operation of the canvas, which did not exist. |

## ⭐ The three findings worth carrying

**1. A CourseControlNumber is not a unique course key.** 1,814 of 139,834 name
more than one course as the artifacts build them; **462** do in the source once
the declared fold is applied. Split by required repair: **73** two real courses
on one number (12 institutions, **93 at San Jose City College**), 112 two
institutions, 132 the CCN cutover, 145 one course written two ways. The rest —
**1,352** — are one institution entered under two roster names. Nothing has gone
wrong yet: **zero `CN:` rows exist.**

**2. A declared fold reaches only the roster that consults it.**
`map_college_roster_rules.json` is applied where names enter the EACR payload and
**never** by the member roster. `CaÃ±ada College` renders that way in the member
list today. ⚠️ The mojibake is not the duplicate-entry case — the raw COCI export
carries **only** the broken spelling, 678 times, so there is nothing to fold
*from*; it needs repair at source.

**3. The work surface is 1.2% built.** The grouped decision view Sam likes exists
for **5 of 159 subjects — 593 of 49,907 identities**. Now that the map leads, a
curator clicks into somewhere with nothing to open most of the time. The button
says so instead of doing nothing.

## 🔭 Your priority

**Decision packs per discipline, fetched on demand.** This is the single change
that takes the work surface from 1.2% of the corpus to all of it, and it is the
bottleneck behind every UI tweak that shipped today — polishing a surface
reachable for 5 subjects is worth less than making it reachable.

~39 MB inline for all 159, so it cannot be inlined. **The pattern already
exists**: `kb/_build_ccr_universe.py --desc-dir` writes 302 per-discipline
description shards fetched on demand by `loadDesc()`, with the blocked/missing
states already handled. `kb/_build_ccr_atlas_extract.py` builds the packs today
for a hardcoded demo list; widening it and sharding the output is a walked path,
not a new one.

⚠️ **Serve the page, do not open it** — `python3 -m http.server 8000`; `fetch`
is blocked under `file://` and a shard that cannot load must SAY so.

## Carryover

| Item | Status |
|---|---|
| Sam reads the Memory Briefing | ✅ **DONE 2026-08-25** — do not re-ask |
| The Sierra / Sierra College rule | recorded in memory; **a guidance rule needs Sam's go** |
| PR #1329 | open, **ready** (not draft), watched. A self check-in was armed to squash-merge on green; **verify it actually landed** before building on it |
| Sam drives the flipped view | open — density and the drop affordance are his calls |
| 73 two-real-course control numbers | worklist exists, 93 rows at San Jose City College |
| Member roster fold / `CaÃ±ada` at source | open |
| One ESL stray (`English as a Second Language (ESL)`, 9) | open |
| `cpl-chat-preview-ab.yml` | built, never run — use on the NEXT cpl-chat change |
| 30 closing-paren assertions | `_prios`/`srcIdx`/`earnedSubHtml`×2 left from S192 |
| `CLAUDE.md` 2.46× its lint budget | standing |

## Patterns that worked

- **Measure before you build.** The handoff called the duplicate-claim set a
  worklist of 1,122; measuring turned it into four unrelated conditions and a
  real worklist of 73 with a named owner.
- **Perturb every guard on its own.** The first perturbation this session did
  **not** go red, which is what revealed that two guards existed and only one was
  reachable through the UI.
- **Believe the screenshot.** Sam's said 12%; the perturbation reproduces exactly
  `0.120`. A reported symptom you can reproduce to the digit is a fixed bug.
- **Answer the question that was asked, with data.** "Is the CCR the source of
  the 4 ESL names?" was answerable in two file reads, and the answer (no — two
  are official MQ titles, one is a local subject string) changed what to do.

## Safety patterns to honor

- Rule 10: fresh read at write time; the sandbox reaches Supabase only via MCP.
- Never force-push `main`. Restart your branch after every squash-merge.
- ⚠️ **Never `git checkout --` a file holding uncommitted work.** Commit first,
  then perturb — this session perturbed four times and restored from a backup
  copy each time, never from git.
- The sandbox is egress-blocked from `*.supabase.co` and from the published
  site, so **the last verification step is always Sam's.**

**Moniker:** SkyCruise signing off. Next is **Session 193** —
`docs/session_193_handoff.md`. Take **Sky193** or coin your own.

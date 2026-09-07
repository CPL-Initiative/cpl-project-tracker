---
title: "Session 237 handoff — the deferred commit landed; the two CPL views are still unbuilt"
created: 2026-09-07
updated: 2026-09-07
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 237

Your moniker is **SkyFacet II** — S236's priority was the map read as CPL rather
than as courses, and it is still unbuilt, so the name carries. Predecessors:
SkyOutline S232 → SkyBuild S233 → S234 → SkyOutline II S235 → **SkyFacet S236**
(this run).

⚠️ **S236 ran TWICE, in two places.** Sam ran a local desktop session first
(against a **v4** screen recording that is NOT in this repo — see below — and with no
repo handoff reachable), which pushed
`claude/video-project-2-frames` and left a mid-session note,
[`docs/deferred_commit_handoff.md`](deferred_commit_handoff.md). This cloud run
picked that up. **Read the mid-session note as history, not as instructions —
two of its three technical claims are wrong and are corrected below.**

## What this run did

Everything here is [PR #1503](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1503).

**The local branch is merged.** It had no PR and had branched from `78545b5`,
before #1501 and #1502 landed — so both sides had independently changed the same
search dropdown from the same day's review. Resolved as a synthesis: main's
masthead fix, `runSearch()` and `markSug()` id-addressing; the branch's whole
deferred-commit model and its pending counter. They agreed once combined.

**Ticking collects; Enter applies.** A tick writes to a pending set and repaints
ONE row. Enter commits the set and closes, Escape abandons, and a choosing
session spans every term the reader types.

**The open bug is fixed, and it was worse than reported** — see below.

## ⭐ THE THING TO CARRY FORWARD

**Intent is RECORDED, never derived by subtraction.** Removals used to be
`have − pendKeys`, and `pendKeys` is seeded once per session — so any token
committed outside that seed was absent from the snapshot, and absence read as
intent is a deletion. Enter destroyed a chip nobody unticked. The reported
symptom ("a pick is silently lost") understated it: an **already-committed** pick
was destroyed by a commit the reader thinks is purely additive.

`pendOff` now holds explicit unticks, `pendItem` explicit ticks, and one
`pendingEdit()` feeds the footer **and** the commit, so the counter cannot
promise what the commit will not do.

## ⚠️ Two claims in the mid-session note are WRONG — do not act on them

1. **`.filter(Boolean)` was not the cause, and `keyOf()` cannot disagree with
   `tokenFromSuggestion().key`** — `window.__ccrTokenKey` *is* that call. One
   `console.error` in `commitPending()` showed both items present with distinct
   keys and nothing dropped. Had the named fix been applied it would have changed
   nothing, looked right in review, and left data being destroyed.
2. **The dropdown is NOT triplicated by hand.** `prototype/skyview.html` is
   GENERATED — `prototype/build_ccr_atlas.py` inlines `ccr_universe.js` and the
   payloads into `ccr_atlas_v1.html`. Resolve the sources, then regenerate.
   Editing three copies by hand is how they drift.

## Verified, in Chromium — not just jsdom

jsdom returns zeroes for every rectangle, and the original complaint is a layout
one, so the page was served and driven:

- Tick a row visible at `scrollTop` 800 → stays 800, 60 rows still listed.
- Deep in a revealed second page → 120 rows before and after, `scrollTop`
  847 → 847. **That is the S233 collapse, gone.**
- **Four consecutive ticks → `#u-bar` 30 → 30, `#sug` top 75.0 → 75.0, 60 → 60
  rows.** The chip-row wrap that dropped a row height **cannot fire while the
  reader is picking**, because no chip exists until Enter. That closes the second
  axis of *"jumping again, driving me nuts"* for the selection path. The
  `.sugwrap` layout finding still holds for chips that land.
- An explicit untick still removes on Enter (3 → 2) — the fix did not just
  disable removals.

Suites: `ccr_skyview_universe` 222/222 · `ccr_skyview_search_show` 130/130 ·
`docs_index_build` 31/31 · `docs_audit` 140/140.

## YOUR PRIORITY — unchanged from S236, and still unbuilt

⚠️ **S236 spent itself on the merge and the bug. Neither CPL view was started.**

② **A CPL vs Course/Discipline toggle** — *"so the CPL exhibits and CRs are the
focus more than the Courses."*
③ **A show-articulations toggle on normal SkyView** — *"reveal to users where
existing artics are and where they differ for the same course college to
college."*

Sam asked for a **sketch before a build** on both, and called them closely
linked himself.

⭐ **RULED, so build to it rather than deciding it again:** the articulations
toggle **lights only what has a number** and leaves everything else drawn as it
is — no gray, no hollow, no "none" marker, because each reads as a finding.
⚠️ **Only 1,490 of 49,896 points (3.0%) carry an articulation count**, so on this
feed "none recorded" and "we did not look" are the same value.

Then, still open from S235 and untouched here: the outline's **skills layer**
(ruled, now a fetch problem — we hold zero agency skill text) and the **curate
phrase** (ruled, not built; Rule 10 a3 routes it through Governance first).

## ⛔ THE GOVERNING REVIEW IS A **v4** RECORDING, AND IT IS NOT IN THIS REPO

**Sam, 2026-09-07: "The local session had a new video v4, not the other."**

The local run watched a **v4 recording**. Nothing from it — no video-context
directory, no transcript, no findings doc — was ever committed. Verified two
ways: `git ls-tree -r origin/main` and the branch tree hold only
`.video-context/video-project-2/`, and the committed v2 transcript contains
**none** of the rulings the deferred commit was built on — "wait on that step",
"dismiss the box", "multiple options" and "firing the routine" all return **zero
hits**. What v2 *does* contain is the earlier, different ruling ("after I click
enter, I really think it should close this"), which #1502 already shipped.

⚠️ **So `docs/skyview_video2_findings.md` is NOT your queue.** It is a complete,
correct review of a DIFFERENT, EARLIER recording. Its items 1–3 are fixed and its
4–6 are v2's loose ends, not v4's.

⚠️ **`docs/deferred_commit_handoff.md` says "this was item 2 only. The remaining
items have not been worked."** That numbered list is v4's, and **nobody in this
repo has ever seen it.** Item 2 is what shipped in #1503; items 1 and 3-onward
are unknown here.

**FIRST ACTION: ask Sam for the v4 recording or its review.** It lives on his
machine. Do not infer v4's items from v2's findings — they are different
recordings of a UI that changed in between, and guessing at a review you have not
read is how a session ships the wrong fix confidently. The `video-context` skill
runs locally and needs a mount, so this is a local-session job or a paste.

## v2's own loose ends — still open, still worth a REPRO

From [`docs/skyview_video2_findings.md`](skyview_video2_findings.md), items 1-3
fixed, 4-6 reported but never reproduced:

- **Click-to-expand stops working** — part is understood behavior (standalone
  orbits) and part may not be.
- **Drag-and-drop to rehome did not work** — he ran out of time and never
  demonstrated it, so there is no evidence of the failure mode. Scope:
  `docs/skyview_drag_rehome_scope.md`.
- **Sort mode is not obvious** — the footer names the order; he was still unsure.

⚠️ **Sam RETRACTED a finding on camera in v2** (the hover/identity card passage).
Read a recording to the end before fixing anything.

## NEEDS SAM — carried forward from S235, none answered this run

① The live-session banner — what link, which tabs?
② Whether 60 is the right search depth; whether an emptied discipline vanishes
or ghosts.
③ The right-edge glyph rail from his Obsidian screenshot — his call under his
own glyph rule.
④ The three legacy anchors with no seed discipline (`M-ID HOSP 100`, `104`,
`102`) need one of the 146 MQ disciplines.
⑤ Any island besides Interdisciplinary Studies that belongs on the grab-bag list.

## Housekeeping

- ⚠️ **The SkyView lane is 14,234 B against a 12,000 B advisory budget (1.19×)**,
  up from S235's 1.06×. What went in is invariants; the compressible narrative
  already moved to `ccr_atlas_lessons.md`. If you need to trim, trim there first.
- ⚠️ **`.video-context/` is gitignored AND main keeps two files inside it.**
  #1501 made a per-file call — frames out, transcript in. An earlier revision of
  this branch removed the directory wholesale and deleted a file main holds; CI
  caught it. Check `git ls-tree origin/main` before removing a path.
- The description shards 404 in the cloud (`ccr_desc/*.json`) — known and
  documented; `python3 kb/_build_ccr_universe.py --shards-only` builds them
  locally, ~2 min.
- `npm test` in full takes longer than a 600 s tool timeout here; run the
  suites you touched directly and let CI run the rest.
- Browser verification is cheap in this environment: Chromium is at
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, `playwright` resolves
  with `NODE_PATH=<repo>/node_modules`, and `python3 -m http.server 8777` serves
  the prototype. **Use it — the last three rounds of this lane were all decided
  by layout that jsdom cannot see.**

## `cpl_memory` rows written this run

`sam-ticking-collects-enter-applies-2026-09-06` (verified_by Sam) ·
`a-snapshot-cannot-be-the-authority-on-intent` ·
`an-inherited-handoff-names-a-hypothesis-not-a-finding` ·
`a-gitignored-directory-can-hold-files-main-keeps`

## Read these first, in order

1. [`docs/reference/lanes/skyview-ccr-interface.md`](reference/lanes/skyview-ccr-interface.md)
2. [`docs/skyview_video2_findings.md`](skyview_video2_findings.md) — v2's review
   (read to the end) — but see the v4 warning above: it is NOT the governing one
3. `tests/ccr_skyview_search_show.test.js` §11a and §16 — the model, as assertions

Then run **`python3 kb/doctrine.py --read <files>`** before concluding anything
from the data, and **query `cpl_memory` before you work** (Rule 8).

---

*Greetings, you are SkyFacet II (Session 237), see SkyFacet's handoff —
`docs/session_237_handoff.md` — let's keep rolling with our queue.*

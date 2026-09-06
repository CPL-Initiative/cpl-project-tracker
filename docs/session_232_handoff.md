---
title: "Session 232 handoff — build the course outline, and find the agency skills"
created: 2026-09-05
updated: 2026-09-05
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_234_handoff.md
---

# You are Session 232

Your moniker is **SkyOutline**. Predecessors: SkyQuiet S228 → SkyGrain S229 →
SkyKeep S230 → **SkyReply S231**.

## What S231 did

**Two PRs (#1486, #1488)** plus the checkpoint (#1487), with a long design
conversation in the middle that shipped no code on purpose.

1. **Two SkyView reports, and neither control was broken.** The search dropdown
   had carried `overflow-y:auto` since it was written — it was asked for
   **8** suggestions out of 200+ matches, so there was nothing below the fold.
   Now 60, with a rebalanced budget (the old split reserved "all but four" for
   disciplines, fine at 8 and starving at 60), a candidate pool raised 400 →
   3,000 (that cap truncates by island order, not relevance), a sticky footer,
   and arrow keys that carry the viewport. The **Show switches** moved a label
   and a count and nothing on the canvas: courses only draw past `NODE_ZOOM`
   (0.20) and SkyView opens at **k = 0.100**. Fixed by letting the filter reach
   what IS drawn — an emptied discipline stops being drawn — and `pick()` now
   honors the same filter.
2. ⚠️ **The Chromium sweep earned its keep twice.** It caught `skyview.html`
   shipped one edit stale (the build is part of the change, not a step after
   it), and a second-order gap the fix itself created: a discipline pick landing
   on ground the filter had just cleared. `healIsland` / `healHits` close it,
   **and only when nothing passes** — a filter that is working is left alone.

3. **The search sorts by name, and the map reads as a sky (#1488, after the
   checkpoint).** Sam drove both from the live page. The dropdown's depth was
   never the problem — the **sort** was: after the relevance tier it orders by
   member count, so a duplicate of a well-adopted course is buried by
   construction. ⚠️ The window must be **centered on the anchor** (sort the whole
   set by name and take the first N and you get the titles starting with "A").
   And ⭐ **the glow is the membership signal, not decoration** — a point
   colleges have joined emits light, a stand-alone reflects it, so the map
   answers *has anyone agreed this is the same course?* without a word. Plus
   short college names throughout, the parent's name inside the big circle, no
   label transecting a disc, system-colored titles and a darker canvas.

## ⚠️ Read the eleven open rulings BEFORE anything else

**Sam ruled all eleven on 2026-09-05 (21:50–21:54).** Sheet:
`docs/visuals/2026-09-05-ten-open-rulings.html` · artifact
<https://claude.ai/code/artifact/fdd4d6a0-609b-4cb3-b0b9-b9e2a5f02761>
(re-read the `replies` collection with the Artifact tool's `read_db` before you
start, in case he added notes after this was written). **This is your execution
plan — do not re-ask what he has already answered.**

| # | Ruling | What you do |
|---|---|---|
| 4 | yes | **Start here.** Re-key `kb/cr_reference_worklist.json` and `kb/coci_articulations.json` through the 15 applied alias maps. Everything else waits on it. |
| 5 | yes | Then the genuinely dead remainder — 19 CR ids, 504 identities carrying 875 records — as a **worklist, never a silent drop**. Follows 4, not concurrent with it. |
| 8 | yes, **including (c)** | One shared `kb/alias_chain.py`; a CI guard failing any file that declares its own `ALIAS_MAPS`; **one PUSH line in `CLAUDE.md`** (he did not take the offered veto); a `cpl_memory` row as the weakest layer. |
| 11 | yes | Write the skill (fires on its *description*, so it triggers without being remembered) **and** give `kb/doctrine.py` a read-side mode — it reads the diff today, so it misses errors made in analysis. |
| 3 | yes | The three interface fixes, as one small PR: focus stays put on multi-select; full title on hover for the filter chips; **recenter on the current selection** (`↺` and Fit all already go to the whole universe — that is the point). |
| 1 | yes | Articulation counts on the map, **after 4**: the count on the identity plus a Show switch for "has articulations". |
| 6 | yes | Queue `WELD M1109` (24) · `M1106` (2) · `M10VQ` (1) as merge candidates with **M1109 surviving**, the identical-titled SMAW pair behind them. ⚠️ The merge itself waits for a faculty reviewer — sufficiency is a curriculum judgment. |
| 2 | yes | The admin re-mint view is a **queue, never a fire button**: candidates with reasons, he approves, the approved set lands through Rule 7's playbook on the next cron window. Route it through Governance + the privacy ADRs first (Rule 10 a3). |
| 7 | yes | Premise accepted: written memory is advisory; anything that must not be got wrong belongs in code or CI. |
| 9 | **edit: "All three"** · follow up | Agency skill statements come from published agency standards **and** ACE exhibits **and** team-entered by the MAP team — not a single source. This unblocks the outline. He flagged it for follow-up, so come back to him on how the three are reconciled when they disagree. |
| 10 | yes | An **AWS welding certification** is the pilot — one certification, not one discipline. |

**Order (Sam, 2026-09-05 — "leave at top for SkyOutline to worry about"):**
**8 → 4 → 5 → 11 → 3 → 1 → 6 → 2**, with 9 and 10 feeding the outline build in
parallel once 4 is in.

⚠️ **8 comes before 4 on purpose.** The shared `kb/alias_chain.py` is the tool
the re-key should be performed *with*, not a tidy-up afterwards — writing the
resolver once and then using it is how the re-key gets done right the first
time. Do not hand-roll a chain walk inside the re-key script; that is the exact
duplication ruling 8 exists to end.

## Two things S231 measured that change how you read the data

- ⚠️ **Resolve a stored id through the alias chain before comparing it to the
  live set.** Direct lookups say welding CR ids are 44% dead and articulation
  identities 36%; through the 15 applied maps (158,470 pairs) it is **19 of 70
  (27%)** and **504 of 2,319 (22%)**. Neither `kb/cr_reference_worklist.json`
  nor `kb/coci_articulations.json` has been re-keyed since September. The chain
  is copy-pasted into two files that have already drifted (15 maps vs 7), under
  a comment saying they must not.
- ⭐ **Articulation runs opposite to adoption.** `coci_articulations.json` joins
  on identity id; in Welding the weight sits on one-college identities
  (`M10AN` 21 articulations on 1 college) while `M1109` (24 colleges) carries 7
  and `M1057` (7 colleges) carries 0. The map draws the articulated courses as
  its dimmest points.

**Sam's correction to honor (2026-09-05):** a statewide CR is titled from C-ID or
CCN where one exists and neutrally where none does, *so no local college title
wins*; local CRs match their local title and number. A worklist group's
`courses` list is therefore **uptake** — the local courses colleges articulated
that recommendation against — never the recommendation naming an identity. All
512 Welding identities are M-IDs, no C-ID and no CCN, so welding is exactly the
case the rule exists for.

## Your priority: build the course outline

Sam asked for it, then drove the design through six messages. **Read
[`docs/reference/lanes/skyview-ccr-interface.md`](reference/lanes/skyview-ccr-interface.md)
first** — the whole picture is there — then
[`docs/ccr_atlas_lessons.md`](ccr_atlas_lessons.md) (2026-09-05 evening) and
[`reference-the-cpl-guiding-question`](kb-notes/reference-the-cpl-guiding-question.md).
Prototype (real WELD M1109 data):
https://claude.ai/code/artifact/f04e8f30-8cf5-4731-9da7-849335d7102f

**His rulings, all binding:**

- A synthetic description may be shown **"as long as it is clearly labeled
  MAP-Generated for faculty consideration and revision before use"** — his
  words, verbatim, travelling with each generated field.
- **Layered from the start** — *"layered is more manageable and scalable."*
  MAP exhibits and military credit recommendations are the next layers.
- Reviewers **edit titles and re-subject**, but *"only when verified and given
  admin permission should they be reminted."* Discipline change = ordinary
  `kb_curation` row; SUBJ4 change = re-key, so it queues.
- Thin skills are **included with a confidence chip**, not dropped.
- **A proficiency level on the course and on each skill** — Beg / Int / Adv.
  Seed it from the text (70% of welding CRs and 44% of Welding course titles
  carry a level word), leave the rest to a curator. ⚠️ Course level and skill
  level are different axes — a beginning course teaches safety to full
  proficiency — so carry both and derive neither from the other.

**What is already true and saves you the discovery:** `kb_curation` carries
`unified_title`, `discipline`, `canonical_subj4`/`subj_override` with real
rows, and `validated_at`/`validated_by` exist and are **unused across all
34,000 rows** — Sam confirmed *"we have not used this with real faculty yet."*
Double-click is **taken** (it opens the discipline work surface); split it — a
course opens the outline, empty island ground keeps today's behavior. The CO's
course-basic file joins on `"CCC"+cn.zfill(9)`.

## The one thing blocked on Sam

⚠️ **Where agency skill statements come from.** For welding we hold **57
published credit recommendations across 129 credential links** and **zero
skill statements** — checked field by field in `kb/credentials.json` and
`kb/cr_reference_worklist.json`. A recommendation names where credit *lands*,
never what the holder can *do*. Every other part of the outline can be built
from data we already hold; the comparison cannot. He also owes a pick for
**which certification goes first** — the unit of work is one certification, not
one discipline.

## Decisions Sam made this run

- **Direction:** the evaluation runs **certification → courses** — one
  certification examined for which course or courses it aligns with *enough*.
  Sufficiency, never equivalence.
- **The guiding question**, and the acceptance test for every screen:
  *"Would I want this person to have to take my class when they already know
  this stuff?"*
- **The premise correction:** CTE programs *already* teach to industry
  standards; nobody has examined it one certification at a time or cataloged it
  for learners. So expect broad correspondence, and the deliverable is the
  **learner-facing catalog**, not a gap report.
- **The comparison runs both ways** — build the gap panel neutral, never as an
  audit of colleges.
- **The destination:** verified skills on Californians' Career Passports.

## Patterns that worked

- **Reproduce at the user's state, not a convenient one.** Both bugs were
  invisible at any zoom or corpus size a developer would naturally pick.
- **Hash the rendered output, not the control.** Asserting the checkbox toggled
  confirmed the half never in doubt.
- **Drive the real page in Chromium after the suite is green.** 302 green jsdom
  files sat beside a stale artifact and a regression.
- **Capture Sam's words the moment they arrive.** Six braindumps in the vault
  (`03-professional/braindumps/`, 19:00–20:15), each with the design
  consequence worked out, not just the quote.

## Safety patterns to honor

Rule 10 at any write: fresh live read, one statement keyed on `id`, guarded by
status, one `cpl_memory_log` row per change, never delegated. A **new write
surface** (the outline's edits) routes through Governance and the privacy ADRs
*before* it ships — map or dismiss it in `kb/governance_surface_map.json`.
Artifact policy: code-only PRs; let the runner publish regenerated artifacts.

---

*Greetings, you are SkyOutline (Session 232), see SkyReply's handoff —
`docs/session_232_handoff.md` — let's keep rolling with our queue.*

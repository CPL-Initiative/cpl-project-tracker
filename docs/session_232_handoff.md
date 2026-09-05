---
title: "Session 232 handoff — build the course outline, and find the agency skills"
created: 2026-09-05
updated: 2026-09-05
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 232

Your moniker is **SkyOutline**. Predecessors: SkyQuiet S228 → SkyGrain S229 →
SkyKeep S230 → **SkyReply S231**.

## What S231 did

**One PR (#1486)**, then a long design conversation that shipped no code on
purpose.

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

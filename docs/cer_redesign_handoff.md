---
title: "CER redesign handoff: the Exhibits tab's Review queue built; the credential panel next"
date: 2026-10-31
session: CER redesign build, side session after S531 (SkyRowanberry)
tags: [handoff, cer, eacr, catalog-commons, exhibits]
status: current
---

# You are SkyBunchberry, the Exhibits tab's next build

SkyRowanberry ran the CER redesign queue on 2026-10-31 from about 00:58Z to 02:00Z, alone (no other session live, no
open PR at start). This is a **full checkpoint** for the CER lane (a tab joined the nav); this file carries it, and
`docs/session_532_handoff.md` points here.

## What shipped

- **#2602 (Exhibits tab, Review):** COBI tab `#exhibits` (`exhibits.js`), in Reference & Curation after the Commons, and
  *Open Exhibits* on the Commons' CER row. The drawn card of mock-up version 26: the *What is it called?* tiles, the
  step tiles as filters with their hovers, *Go to an exhibit*, and one card per held title. Its data come from
  `kb/_build_exhibits_review.py` (`kb/exhibits_review.json`, and `kb/exhibits_review_courses.json` loaded on a
  could-adopt click), run nightly at the end of `cer-procedures.yml` and daily. Code-only PR: **the files do not exist
  on main until the daily run after the merge** (dispatched at merge; see the lane file).
- **`exhibit_title_students(p_keys, p_ids)`**, applied 2026-10-31 through the MCP
  (`kb/migrations/2026-10-31_exhibit_title_students.sql`, rollback beside it): distinct students in
  `map_student_credit` per held title, allowed reviewers only, k=10 inside the function. Verified live: 442, 398,
  suppressed, 0; no rows for a non-reviewer; no execute for anon. Governance: `rpc:exhibit_title_students` dismissed
  with its reason, `tab:exhibits` mapped to DR-07.
- **cpl_memory:** `exhibits-review-queue-built-2026-10-31`, `exhibit-title-students-function-2026-10-31`, each logged.

## Read first

`docs/reference/lanes/cer-procedures.md` (*The redesign*, its Review paragraph, and NEXT), `docs/cer_v2_redesign_lessons.md`
(2026-10-31, SkyRowanberry), the mock-up `docs/visuals/2026-10-30-cer-exhibits-redesign-mockup.html` (version 26).

## Open work, in order

1. **Read the first published `kb/exhibits_review.json`** (written by the daily run dispatched at merge; then each
   night after the procedures run at 07:47Z). Expect about 413 held once the `high-school-rop` save lands, the step
   counts, and `settled_since_run`. Open `#exhibits` and look at it; then read Sam's first saves
   (`kb_curation` rows under `_UNCLASSIFIED::` with his email after 2026-10-31).
2. **Watch the first nightly save of `high-school-rop`** (expected about 55, cohort `cer-procedure-high-school-rop@bot`);
   read its receipt in `kb/cer_procedures_out/saved/`.
3. **The credential panel** (Sheet 147 order, step 2): issuer and training sites editable, many sites per issuer. A
   site for an existing credential saves as `training_agency_override` on `_CREDENTIAL_REVIEW::<title>`; a site for a
   title the fold has not added yet needs a field the fold reads (map that write before building it, Rule 10 a3).
4. **The *Held titles by group* table** from version 26 (one rule, accept as a group, 25 at a time) if Sam asks for it.
5. Then EACR folds in, and the public adoption page (settled credentials only, Malone's CPL/AI look, its name Sam's).
6. Carried: the college short-name editor (college-district-identity lane NEXT); the CPL-AI snapshot refreshed by hand
   (`python3 kb/_build_cpl_ai.py --fetch`) until Sam picks a schedule.

## Lessons to honor

- Suppress where the figure is made: a reviewer may SELECT the base table, which is why the page reads a function.
- The fold moves under the queue; the builder drops what it settled since the run and counts it.
- Drafts live in the tab's state: a re-render must not cost an edit.
- `git add`, then `bash scripts/check_generated.sh`, before every push; a new tab stales `cobi_admin_surface.js`.

## Let go

At sign-off this session drops its watch on the PR. No check-ins are scheduled and no artifact is watched.

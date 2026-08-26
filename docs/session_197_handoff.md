---
title: Session 197 handoff — from SkyRule (Session 196)
created: 2026-08-26
updated: 2026-08-26
tags: [handoff, session-197, gr, title-5, 55050, sb135, memory]
kb-status: internal
obsidian-folder: cpl-project-tracker
---

# You are Session 197

SkyRule here. Session 196 was one long day on **Title 5 §55050** — getting a
draft to the Chancellor's Office that conforms the regulation to the new
Education Code Article 9 — plus a morning on the **memory table**. Ten PRs
landed (#1338–#1347). Nothing is half-finished; what remains is Sam's.

## Read these, in this order

1. **`docs/t5_55050_lessons.md`** — the workstream story. Start here.
2. **`docs/t5_55050_cover_argument.md`** — the Tier 1/Tier 2 call and the order
   to raise things in. This is the doc Sam takes into the room.
3. **`docs/reference/statute/README.md`** — ⚠️ **read before touching §55050.**
   It tells you which file is the baseline and why the raw extraction is a trap.
4. `CLAUDE.md` §11 — the **Title 5 §55050 → Ed. Code Article 9** row.
5. `docs/cobi_memory_tab_lessons.md` — the briefing-ordering half of the day.

## What shipped

**§55050 (#1339, #1341–#1352).** Sam asked for a fresh redraft based on
SB 135. It is the wrong shape, and finding that out *was* the work:

- A final §55050 **already exists** — adopted by the Board of Governors
  **2026-08-12** — and **its renumbering is Sam's own November 2025 work**. So it
  is not a competing structure; it is the same section with its substance
  missing. The deliverable became **restore, not redraft**.
- **Nobody erred.** The accessibility stamp reads 6/19/26; Article 9 took effect
  7/13/26. Lead with that and the package is a conformity amendment rather than
  a criticism.
- **⚠️ Nothing re-letters.** Adopted §55051(d) reads *"as defined in section
  55050(i)"* — a pointer the *same* rulemaking created, so it is invisible to a
  search of the operative text. New material appends as **(n)**. If you are ever
  tempted to tidy the lettering, this is why you must not.
- ⭐ **SB 135 is wider than Article 9.** `EC §75013` is **Sec. 14 of the same
  chapter** (Article 9 is Sec. 16) and its (b) opens *"As part of the Credit for
  Prior Learning Initiative"* — CO + ASCCC **shall** make CPL recommendations
  **per program**, **the same systemwide**, by **2027-07-01**, colleges **strongly
  encouraged to award consistent with them**. Every scoping doc we wrote reads
  §§78093–78093.2 and stops. **The boundary drawn was a section-number range
  rather than a statutory scheme.** It promotes the program-level/GE-area
  broadening from Tier 2 to Tier 1 and repairs the weaker of the two stretches.
- ✅ **§88782 confirmed as the Career Passport Program**, and it does three jobs:
  settles the citation, **names MAP in the Education Code**, and makes CPL a
  **named input to the Passport** — which is the argument for keeping the
  academic-record annotation in (l).
- **Delivered: `exports/…_TrackedChanges_v3.docx`** — 27 insertions / 12
  deletions, 86 checks. Sam ruled on all five open calls, revised twice, and v3
  merges his cleaned-up line with the v2 changes he had not seen. ⚠️ **His
  "cleaned up version" was built on the FIRST draft, not v2** — check which
  ancestor a returned file has before merging.
- **`docs/t5_55050_vs_gr_register.md`** — the draft against all 16 CPL register
  rows.

**The memory table (#1338, #1340).** The Briefing was reading **34 of 188**
verified entries, chosen by whichever had been edited most recently, and it was
sending `summary` where the screen shows `plain` — so **every plain-language
pass that table ever had never reached the model**. Fixed with a proportional
band interleave (49 entries, all seven kinds) and 202 row rewrites.

## Priority workstream

**None is running.** §55050 is delivered and every open item is Sam's. Do not
start work on it speculatively — read the four items below and see whether he
has answered any.

## Carryover — Sam's, and none of it is drafting

**All five of his §55050 rulings are in** (2026-08-26): (m) demographics restored ·
(b) keeps the documents list · competencies restored · Cal-GETC deliberately NOT
restored (the generic *"local or transfer general education area"* is his
anti-staleness mechanism) · independent institutions kept. What is left:

| # | item | status |
|---|---|---|
| 1 | ✅ **Row #9 SETTLED 2026-08-26 — struck.** Sam asked whether the Ed. Code requires the annotation; it does not (§78093.2(b)(2) binds the *receiving* campus, §88782(a)(1) binds the CO). The earlier keep-it argument was about enforceability, not law, and is withdrawn. Register and draft now agree. ⚠️ **#10 wants a second look** — it was #9's counterweight. | **done** |
| 2 | **Three v4 changes he has not ruled on**: §75013(b) as a fourth recommendation source in (c); §75013 in the NOTE Reference; CPL expanded in (b)(4) | open |
| 2b | ⚠️ **His v4 reverted (f) to "course content"** — the BOG adopted **"course outcomes"** on 2026-08-12. Kept as adopted in the merge; confirm the revert was not deliberate. | **needs a word** |
| 3 | **Register row #2** still asks for enacted law and is still ranked second | open |
| 4 | **Register row #16's instrument says `§55050(d)`** — the 2026-08-12 adoption moved that clause to **(c)**. One-field fix a CO reader would catch. | open |
| 5 | ⭐ **Row #7 has a venue it did not have** — §75013(a)'s CBE-to-FTES workgroup must report to the **Department of Finance** by 2028-10-01, which is row #7's own named obstacle. Two candidate new rows from §75013. | open |
| 6 | ✅ **Executive Sponsor: James Todd, Vice Chancellor of Academic Affairs** (Sam, 2026-08-26). **Staff Lead** and the **2026–27 timeline** still blank | partly done |
| 7 | **Whether Tier 2 gets a companion action** — recommend yes, separately; the fee amendment (ASCCC Res. 103.04) is the strongest candidate, and it now has a second anchor in §88782(c)(3) *"no or low cost"* | open |

⚠️ **§88782 is settled** — it IS the Career Passport Program, so the adopted NOTE
is right and November's §88792(b)(1) was a transposition. Whether §88782 is
*correctly* that program in the code is a separate, unverified question; if it is
wrong that is a defect in the adopted regulation and its own action. **Do not fold
a citation correction into a conformity amendment.**

## Carryover — engineering

- ⚠️ **The MAP custom-report nightly load FAILED** — MAP returned
  `View_StudentDetailsCredits_APIDataset` **twice** and omitted
  `View_CollegeExhibitCRByCatalogYear_APIDataset`, so the gate stopped the run
  rather than publishing a partial picture. **Reported, not acted on.** Check
  whether the report was renamed on MAP's side.
- ⚠️ **The GR register cites Article 9 nowhere** (0 of 20 rows) and **row #2 asks
  the Legislature for something already enacted**. The Sky195 sweep proposes the
  fixes; nothing has been written.
- **Memory:** one row carries a false verification stamp (`stale` +
  `verified_by='curator'`) awaiting Sam's go; 26 verified rows name no verifier.
  ⚠️ **Never sweep the 11 `proposed` rows whose `verified_by` is Sam or Jenni** —
  that is real attribution.
- Deferred by Sam ("keep the scope tight"): the `coci_college_offerings`
  8-course/900-char caps; syncing `statewide_prescriptive.js` into a `chatbox_*`
  table; refreshing `chatbox_college_profiles`.
- ⚠️ **Seven test files print no readable check count**, so `tests/run.js` can
  record no floor for them and their checks are **not protected against silently
  disappearing** — the exact failure mode this repo keeps re-learning. 266 of 274
  files are covered; these seven are not: `ccr_skyview_first`, `cobi_identity`,
  `cpl_memory_curate_actions`, `cpl_session_return_tab`, `gr_deep_analysis`,
  `gr_revision_edit`, `sierra_model_choice`. The fix is a final
  `N/M checks passed` line in each, then `npm run test:floor` — a small, tidy
  first task. (Full suite is green: **274/274 files** as of 2026-08-26.)

## Patterns that worked

- **Ask what the document already is before drafting words.** Two texts
  (the adopted final revision, and Sam's November proposal) reshaped the whole
  deliverable, and reading them cost less than a paragraph of drafting would have.
- **Resolve a redline as an edit list, never as retyped prose.** 21 inline
  resolutions + 7 struck paragraphs, each with its reason, applied by script.
  Two free structural checks fall out — contiguous lettering, and no surviving
  run-together tokens — and the contiguity check is what confirmed the seven
  unmarked deletions.
- **Reject-all must reproduce the source.** `kb/_verify_55050_redline.py`,
  71 checks. It found a deleted `" and"` that had orphaned its comma, which is
  invisible in the redline view.
- **Perturb every guard.** Four deliberate breakages, each producing a named FAIL
  with the count still registering — the S193 lesson (a crashed suite reads as
  0 FAIL) is real and it keeps paying.

## Safety patterns to honor

- **Never draft §55050 against the raw PDF extraction.** Use
  `docs/reference/statute/t5_55050_clean_after_2026-08-12.txt`; re-generate it
  with `kb/_derive_55050_clean.py` rather than editing it.
- ⚠️ **The same phrase resolves two ways in one section** — `course
  contentoutcomes` → (f) *"course outcomes"*, while the identical phrase sits
  **unstruck** in (h) → *"course content"*. Deliberate. Do not "fix" it.
- **Restart the branch onto `main` as the LAST STEP OF MERGING**, not the first
  step of the next PR, and clear the stale remote-tracking ref in the same
  breath. This trap was hit twice this session before the habit stuck:
  `git fetch origin main -q && git checkout -B <branch> origin/main -q && git branch --unset-upstream; git update-ref -d refs/remotes/origin/<branch>`
- Stop-hook nags in remote sessions are false positives — verify
  `HEAD == origin/main` and move on. Never amend.

## Moniker

I took **SkyRule** — the day was regulation. Yours is open: take what Sam's
greeting names, or coin your own. Sign off with the moniker **and the next
handoff number**, so he can paste it straight into the following session.

**Next is Session 198 — `docs/session_198_handoff.md`.**

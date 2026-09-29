---
superseded: true
superseded_by: session_132_handoff.md
---

# Session 92 handoff — you are Session 92

You are **Session 92** of the CPL Project Tracker (COBI) build. Session 91
(**SkyGOAT**) gave the TMC Builder both C-ID authorities + "OR" alternatives.
Pick your own moniker (Sky/Star streak).

## What SkyGOAT shipped (2 PRs, both merged + live on `main`)

Two TMC Builder asks from Sam's Saddleback Administration-of-Justice screenshot
(many NULL right-side alignments):

- **#639 — right-side C-ID coverage doubled.** Auto-match keyed only on COCI's
  `CIDNumber`, which colleges **under-report**. Wired in the already-in-repo but
  **unused** c-id.net authority `kb/reference/cid_articulations.json` (official
  approved-courses export). `tmc/_build_college_courses.py` now **unions** both
  per course, joined on `(college,subject,number)` exact + a leading-zero fallback;
  `sequence:true` rows excluded. **10,627 → 21,300** college×C-ID pairs (+100%);
  **9,924** courses gained a C-ID; 961 carry ≥2 → `tmc_college_courses.js` rows get
  an optional 6th element `xcid[]`. Consumer (`tmc_builder.js`) matches a slot vs
  `{cid}∪xcid` (`courseCids`/`matchedCid`), indexes a course under each C-ID, and
  `autoMatch` **used-tracks** so one course can't fill two slots.
- **#640 — "X OR Y" alternatives on the left side.** The consumer already rendered
  + matched per-slot `alts[]` — but **0/756 slots had any**, because the PDFs render
  "OR" as a multi-column layout that `fitz` text-extraction scrambles. Extracted the
  OR-groups by a **visual PDF read**: a Workflow fanned an extractor + an independent
  **adversarial verifier** over all 45 PDFs → curated overlay
  `tmc/tmc_or_groups.json` (80 groups, each with an evidence quote). The parser folds
  each into one slot (`cid` + `alts[]`). **77/80 folded**, structural diff = zero
  drift; 3 skipped-and-logged (`_meta.or_groups.skipped`): LPPS `COMM 120` overlap,
  studio-art `ARTS 280/281/282` missing line.

Honest limits (documented): ~24% of c-id.net keys have no COCI course row to attach
to, and **genuine-absence slots stay blank** (no dataset fills them; we do NOT hold
the MIS Master Program/Course table, and MIS carries CB-codes/transfer flags, not
C-ID). Suite **117 files green** (+`tmc_cid_articulations.test.js` 16,
`tmc_or_alternatives.test.js` 13; updated an AAS assertion in
`tmc_templates_structure.test.js`). Both `tmc_college_courses.js` (7.9 MB) +
`tmc_templates.js` are STATIC artifacts (not daily-cron) → committed directly.

## Read these first (in order)
- `docs/tmc_builder_lessons.md` (the two 2026-07-01 sections) — the full story of
  both PRs + the "read the PDF, don't parse the text" lesson.
- `docs/kb-notes/reference-tmc-adt-data-model.md` — the C-ID union + the OR-fold
  (updated S91) · `docs/kb-notes/methodology-visual-pdf-read-for-layout-encoded-facts.md`
  (NEW — the reusable extraction methodology).
- `CLAUDE.md` §7d (TMC Builder — auto-match/alts bullets updated) + the
  `tmc_college_courses.js` / `tmc_or_groups.json` file-inventory rows.
- `docs/session_91_handoff.md` — the Sierra / CCR-CER recommender context (still the
  substantive cross-session workstream).

## TMC follow-ups SkyGOAT left (small, optional)
- **The 3 skipped OR-groups** (in `tmc_templates.js` `_meta.or_groups.skipped`) each
  need a small manual curation call: studio-art `ARTS 280/281/282` = the parser
  missed the whole line → add a List B slot; LPPS `COMM 120` appears in two OR-lines
  → decide how one course maps to two requirements (our one-slot-per-cid model can't
  hold it cleanly). Faculty-verify territory — surface to Sam, don't guess.
- **Overlay is authored/editable:** correct any OR-group in `tmc/tmc_or_groups.json`
  then re-run `python3 tmc/_parse_tmc_pdfs.py` (regenerates `tmc_templates.js`).
- **Rebuild the college index** only on a fresh COCI/c-id.net extract:
  `python3 tmc/_build_college_courses.py` (soft-fails without the c-id.net file).

## Priority workstream — finish the CCR/CER recommender (M1)
Unchanged from S90/S91: Sierra has the **offerings** gate (S89 COCI catalog,
`cpl-chat` v20/v21). Next wire: **CER credential layer** + **CCR course-identity
crosswalk** + **adoption-leverage / `statewide_prescriptive`** so a request resolves
end-to-end. Scope: `docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`.
Pattern: slim recommendation-shaped dataset → shared Supabase table (periodic ETL) →
parallel lookup + context builder + prompt rule → careful redeploy of the SHARED
`cpl-chat` (capture live version, keep `verify_jwt:false`, smoke ALL modes on a
runner via `cpl-chat-smoke.yml`).

## Carryover (waiting on Sam, then you)
- **Try Sierra** on a detailed trades question — tune routing (To-Do top item).
- Optional Sierra: carry the Whitney mark into the favicon + in-chat avatar (🏔️).
- **MAP login URL** for the refresh-nudge link (`map_users.js`).
- **Reference-tab header bands** (CCR/CSR/CER dark-navy sticky headers) — flip light?
- **Public KB PR #15** (Veterans) — Sam's sign-off.
- Standing lanes: unverified-M-ID renumber (`docs/unverified_mid_renumber_scope.md`);
  TMC **Phase-2 acceptance engine** (`docs/kb-notes/tmc-co-review-scope.md`) — the
  next natural TMC build (per-slot verdicts from `flexible`/`flexibility` + the OR
  alts now in place).

## Patterns that worked (reuse them)
- **Read the PDF visually for layout-encoded facts.** When a fact lives in *where
  things are on the page* (columns, OR-adjacency) and `get_text()` scrambles it,
  a per-item **visual Read** + an **adversarial verifier** beats more text regex.
  The verify stage was load-bearing (caught "Select-N list ≠ OR-group" +
  "flexible proviso ≠ C-ID OR"). Land curated facts as an **overlay**, not inline.
- **Workflow for fan-out + verify.** `pipeline(items, extract, verify)` over 45 PDFs;
  bake large item lists into the script file (`scriptPath`) rather than hand-inlining
  args; top-level StructuredOutput schema must be an `object` (not `array`).
- **Measure before you build.** Quantified the coverage uplift (+100%) and gap types
  (reporting/subject-relabel/genuine-absence) BEFORE wiring, so the PR was scoped +
  honest about what it can't fix.
- **Prove zero drift** on a regenerated artifact with a structural diff old→new
  (only the intended field changed) before committing a 400+-line-diff generated file.

## Safety patterns to honor
- **Rule 4** (`CPL_Dashboard.html` === `index.html`) · **Rule 5** (never force-push
  main) · **Rule 8** (checkpoint). Merge on `unstable` once TruffleHog is green.
- **Static TMC artifacts are committed, not cron-published** (`tmc_college_courses.js`,
  `tmc_templates.js`, `tmc_college_adts.js`) — nothing else publishes them.
- **Restart the branch from a freshly-fetched `origin/main` for each new change** —
  a merged-PR branch can't be reused. Sibling `claude/<desc>` branches OK for
  independent PRs (S91 used two: the designated branch for #639, a sibling for #640).
- **`cpl-chat` is SHARED + LIVE** (map.rccd.edu widget): capture the running version,
  keep `verify_jwt:false`, smoke all modes on a runner before/after any redeploy.

## Moniker
Session 91 was **SkyGOAT**. Claim your own (Sky/Star streak continues).

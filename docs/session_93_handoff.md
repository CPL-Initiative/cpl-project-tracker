# Session 93 handoff — you are Session 93

You are **Session 93** of the CPL Project Tracker (COBI) build. Session 92
(**StarFab**) made every c-id.net approval land in the TMC Builder and mapped
the data for the CO confidence-score goal. Pick your own moniker (Sky/Star
streak).

## The strategic reframe (Sam, 2026-07-01 — READ THIS FIRST)

Sam stated the TMC Builder's true purpose: the CO curriculum office has a
**200+ ADT-submission backlog that must clear before the Curriculum Institute
in mid-July** (a make-or-break with statewide faculty leadership). Staff
manually compare each submitted course to the template — number, title,
contact hours, units, description — and sign off or return. The Builder's two
jobs: ① give colleges an **on-the-fly alignment check + confidence score**;
② let CO staff **triage low-confidence entries**. Best case: a college
**cannot submit an incomplete/misaligned application** — near-auto-approvable.
COCI has a submission interface but the CO has no resources to build checking
there ("old school for now") — **this tool is the de-facto procedure layer**.

The full data map for that goal is
**`docs/kb-notes/reference-tmc-confidence-data-requirements.md`** (NEW, S92):
the five CO checks scored against data in hand, the tiers, the build order.
Headlines: **contact hours are the only true data gap** (ask Sam re: COCI
export hours columns; else capture on the submission form); descriptions are
IN HAND (COCI `CatalogDescription` + 495 C-ID descriptor texts) but not wired;
a **fresh COCI extract** is the top data ask (ours is stale mid-CCN —
1,986 approved courses have no row).

## What StarFab shipped (PR #642, merged + live)

- **The join ladder.** After S91's union, a c-id.net approval whose course had
  no COCI row **vanished silently** — 3,684 unattached approvals = **1,195
  visible wrong blanks across 114 colleges** (Saddleback SOCI 110 = the
  motivating case; the CCN transition is the driver). Now every non-sequence
  approval lands (receipts in `_meta.cidnet_join_lanes`): exact 18,157 ·
  zero-norm 1,903 · **squashed code 629** · **strict unique-title 915** ·
  **synthesized flagged rows 1,986**. Plus comma-joined `CIDNumber` split (46
  unmatchable primaries fixed).
- **Graded provenance per C-ID** (the confidence-score foundation): hard →
  `✓ aligned`; title-inferred → `tcid[]` 8th element, renders `≈ … verify` +
  `≈ c-id.net title` chip, NEVER COCI-grade; synth → 7-element row, `per
  c-id.net` badge, units `?`. `autoMatch` prefers hard > title > synth;
  save/resume round-trips `course_cids/course_tcids/course_src`.
- **Adversarial verify caught a real blocker pre-merge** (2 rounds, 4 agents):
  the draft title lane stripped 'honors'/'a' → approvals captured by SIBLING
  courses (A/B halves, honors-of-the-other-half). Strict equality fixed it;
  regression pinned (West Valley HIST 017BH). Round 2 PASS.
- Suite **118 test files green** (+`tests/tmc_cidnet_synth.test.js`, 31).
- Also verified S91's OR-fold is live (77/638 slots carry `alts[]`; AJ's
  SOCI 125 "or MATH 110" renders — visible in Sam's own screenshot).

## Read these first (in order)
- `docs/kb-notes/reference-tmc-confidence-data-requirements.md` — the goal map.
- `docs/tmc_builder_lessons.md` (the S92 section) — the ladder + the
  title-stripping lesson ("every token you strip is a dimension a sibling can
  hide in").
- `docs/kb-notes/tmc-co-review-scope.md` — Phase 2 = the engine to build;
  honest-limits updated (C-ID coverage limiter CLOSED).
- `docs/kb-notes/reference-adt-acceptance-rules.md` — the ruleset the engine
  implements.

## Priority workstream — the confidence engine (mid-July clock)

Build order (from the data-requirements note):
1. **Submission gates + per-slot tiers** (1/1b/1c/2) — all data shipped as of
   #642. Extend `tmc_submissions.status` → `approved|denied|returned`.
2. **CO triage queue** — rank ⏳ In-progress (college, TMC) pairs (already in
   `tmc_college_adts.js`) by computed coverage; per-slot ✓/≈/✗ panel = the
   review screen.
3. **Description-similarity precompute** (build-time score vs descriptor text;
   ship scores, lazy text).
4. **Hours** — the moment Sam sources them (or the form captures them).

Known cosmetic follow-up: directory `coverageFor` counts verify-tier carriers
same as hard (inflates the coverage column slightly) — fold into step 2.

## Carryover (waiting on Sam, then you)
- **COCI export with hours columns? + a FRESH COCI extract** (top data ask).
- **The pending-submissions list** (college, TMC) — else use In-progress proxy.
- The 3 skipped OR-groups (Studio Art missing line; LPPS COMM 120 in two
  lines) — faculty-verify calls.
- Try Sierra on a trades question · MAP login URL for the nudge link ·
  reference-tab header bands · public KB PR #15 · Fact Sheet redirect URL.
- Standing lanes: Sierra CER/adoption-leverage wire
  (`docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`);
  unverified-M-ID renumber (`docs/unverified_mid_renumber_scope.md`).

## Patterns that worked (reuse them)
- **Adversarial verify before merge on data-inference code.** Both rounds paid:
  round 1 found the sibling-capture blocker; round 2 quantified the residual
  (18 title joins, all correctly downgraded). Prompt the verifiers to REFUTE
  with concrete cases from the real data, not to review style.
- **Precedence ladder + graded provenance** for joining an authority dataset
  to an incomplete extract: exact → normalized → squashed → strict-title →
  synthesize-flagged. Never let a fallback lane masquerade as the top lane.
- **Strict title equality for identity joins** — word-stripping = sibling
  capture when the true owner is absent (which is the only time the lane runs).
- **Audit-first**: measure the gap class statewide (counts per cause) before
  designing; the fix wrote itself from the four cause buckets.

## Safety patterns to honor
- **Rule 4** (both HTMLs) · **Rule 5** (never force-push main) · **Rule 8**
  (checkpoint). Merge on `unstable` once TruffleHog is green.
- **Static TMC artifacts are committed, not cron-published**
  (`tmc_college_courses.js`, `tmc_templates.js`, `tmc_college_adts.js`).
- **Restart the branch from freshly-fetched `origin/main`** after a merge.
- **`cpl-chat` is SHARED + LIVE** — capture version, `verify_jwt:false`,
  runner smoke-tests, if you touch Sierra.

## Moniker
Session 92 was **StarFab**. Claim your own (Sky/Star streak continues).

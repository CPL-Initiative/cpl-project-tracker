# Session 93 handoff — you are Session 93

**Session 92 ran TWICE in parallel on 2026-07-01** — **StarFab** (TMC Builder:
every c-id.net approval lands + the confidence-score data map) and **StarLab**
(Sierra: required audience selector + 👍/👎 feedback + `cpl-chat` v22 + the
Training-tab scope). This handoff covers both. Pick your own moniker (Sky/Star
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

## What StarLab shipped (PR #644 + a live cpl-chat v22 deploy)

- **`sierra_feedback`** (Supabase, live; schema-of-record
  `chatbox/supabase_sierra_feedback.sql`): 👍/👎 + optional note per assistant
  turn on BOTH chat surfaces (`sierra/sierra.js` + `cpl_chat.js`); client-uuid
  `turn_id`, UPSERT (`Prefer: resolution=merge-duplicates`) — thumb logs
  immediately, note/rating-switch updates the same row. Anon INSERT+UPDATE,
  **SELECT = reviewer/team-phrase** (the Training tab's read path is open).
- **Audience selector** — REQUIRED single-select (Student/future student ·
  Faculty · College administrator · Employer/industry · Civic leader) on both
  surfaces; shared same-origin localStorage key **`cplSierraAudience.v1`**;
  sent as the optional `audience` body field.
- **`cpl-chat` v22** (deployed via MCP, `verify_jwt:false` preserved):
  `AUDIENCE_RULES` per population appended to the system prompt — the student
  rule bans system inside-baseball. Absent/unknown audience → default voice;
  **the production map.rccd.edu widget is untouched.** `audience` also logs to
  `chat_interactions` (new column) + `chat_interactions` gained a
  reviewer/team-phrase SELECT (was write-only) for log-informed gap mining.
- Tests: `tests/sierra_page.test.js` (33) + `tests/cpl_chat_audience.test.js`
  (17). Smoke modes **10–12** (student audience, unknown-key no-500, the
  feedback REST upsert + anon-SELECT-returns-[] RLS assertion).
- **Training-tab recommendation** (the decision doc Sam is reviewing):
  `docs/sierra_training_tab_scope.md` — YES, phased (P1 review queue + gap
  miner · P2 `sierra_guidance` prompt knob · P3 RAG-corpus ingestion, never
  the public KB) + the **Malone guardrails lane** (durable rate limit, daily
  cost breaker, CORS tightening) pre-"Credit for Being Me".

## Read these first (in order)
- `docs/kb-notes/reference-tmc-confidence-data-requirements.md` — the TMC goal map.
- `docs/tmc_builder_lessons.md` (S92 section) — the ladder + the
  title-stripping lesson.
- `docs/sierra_training_tab_scope.md` — the Sierra decision doc.
- `docs/cpl_assistant_lessons.md` (S92 section) — the feedback/audience patterns.
- `docs/kb-notes/tmc-co-review-scope.md` + `reference-adt-acceptance-rules.md`.

## Priority workstreams

**Steps 1 + 2 SHIPPED same-session** (Sam: "Let's build:)"). Live now: per-slot
verdict tiers (✓ auto / ≈ verify / 📎 evidence / ⚠ review per the ASCCC ladder),
submit gates (select-N · per-list units floors · ≥18 major units with a
units-capture remedy for unknown-units synth courses), hours-placeholder +
flexible-slot evidence capture (all round-trip save/resume), and the CO review
queue: readiness-ranked submissions, expandable five-check panel, **server-gated
Approve/Return** (`tmc_review_submission` RPC — `is_allowed_reviewer()`,
JWT-stamped; 2 migrations applied + mirrored in
`tmc/supabase_tmc_submissions.sql`), and the ⏳ In-progress backlog proxy ranked
by computed coverage. The adversarial verify caught 2 blockers pre-merge (stored
XSS via anon-writable `_readiness`; anon-forgeable approvals) — read the S92
lessons sections before touching this surface.

Still open, in order:
1. **Description-similarity precompute** (build-time score per candidate vs the
   C-ID descriptor text; ship scores, lazy text — data all in hand).
2. **Hours** — wire for real the moment Sam's COCI master report lands
   (prefill + compare; the placeholder inputs become verification).
3. **Directory `coverageFor`** still counts verify-tier carriers same as hard
   (cosmetic inflation) — distinguish or annotate.
4. **Quarter-college units gate** — the ≥18 gate uses local unit values
   (quarter colleges under-gated; wording is honest). Needs a college→calendar
   signal we don't hold; ask Sam if precision matters for the Institute.
5. Evidence is free text (CO reads it, not auto-trusted) — a URL-shape nudge or
   ASSIST deep-link picker would strengthen tier 2.

**Sierra lane (StarLab), also open:**
1. **Sierra Training tab Phase 1** (on Sam's go) — team-only review queue +
   gap miner over `sierra_feedback` + `chat_interactions` (thumbs-down
   clusters · `top_similarity` < ~0.55 · "I don't know" fallbacks · sliced by
   audience). Add a reviewer-writable `status` column for triage.
2. **Guardrails with Malone** — durable rate limit + daily cost breaker in
   `cpl-chat`, drop the `"null"` CORS origin, Portal-side bot friction. Get
   thresholds from Malone. The cost breaker should land BEFORE the Portal
   publicizes the endpoint.

## Carryover (waiting on Sam, then you)
- **COCI export with hours columns? + a FRESH COCI extract** (top data ask).
- **The pending-submissions list** (college, TMC) — else use In-progress proxy.
- The 3 skipped OR-groups (Studio Art missing line; LPPS COMM 120 in two lines).
- Sierra: try the audience/feedback flow · the Training-tab Phase-1 go/no-go ·
  the Malone intro.
- MAP login URL for the nudge link · reference-tab header bands · public KB
  PR #15 · Fact Sheet redirect URL.
- Standing lanes: Sierra CER/adoption-leverage wire
  (`docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`);
  unverified-M-ID renumber (`docs/unverified_mid_renumber_scope.md`).

## Patterns that worked (reuse them)
- **Adversarial verify before merge on data-inference code** — prompt the
  verifiers to REFUTE with concrete cases from the real data.
- **Precedence ladder + graded provenance** when joining an authority dataset
  to an incomplete extract; never let a fallback lane masquerade as the top lane.
- **Strict title equality for identity joins** — word-stripping = sibling capture.
- **Feedback-as-upsert** (client-uuid PK + merge-duplicates) beats
  feedback-as-append: log on click, enrich on note, correct on switch — one row.
- **Same-origin surfaces share one localStorage preference key** — pick once,
  both remember.
- **Audit-first**: measure the gap class statewide before designing.

## Safety patterns to honor
- **Rule 4** (both HTMLs) · **Rule 5** (never force-push main) · **Rule 8**
  (checkpoint). Merge on `unstable` once TruffleHog is green.
- **Static TMC artifacts are committed, not cron-published.**
- **Restart the branch from freshly-fetched `origin/main`** after a merge —
  TWO sessions collided on the checkpoint files today; expect siblings.
- **`cpl-chat` is SHARED + LIVE** — capture version first, `verify_jwt:false`
  explicit, runner smoke-tests after every deploy. Audience keys must stay in
  sync across `AUDIENCE_RULES` (index.ts) + `AUDIENCES` (sierra.js,
  cpl_chat.js) + the smoke test.

## Moniker
Session 92 was StarFab ∥ StarLab. Claim your own (Sky/Star streak continues).

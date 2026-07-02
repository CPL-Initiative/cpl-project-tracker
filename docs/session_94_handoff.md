# Session 94 handoff — you are Session 94

**Session 93 (SkyReach, 2026-07-01/02)** was the Sierra quality session: the
CPR retrieval miss diagnosed + fixed live (PR #646), then Sam's "Let's go
green on the Training Tab" shipped Phase 1 the same night (PR #647). Both
squash-merged; suite 121 test files green; cpl-chat **v24 ACTIVE**. Pick your
own moniker (Sky/Star streak).

## What shipped (read the receipts before touching Sierra)

**① The CPR miss (PR #646 + live migration + cpl-chat v24).** Sam asked Sierra
about CPR CPL; she surfaced ONE exhibit while `chatbox_exhibits` held 16. His
two 👎 notes in `sierra_feedback` described it precisely — the day-old
feedback loop's first real catch. Replay against the live RPC found:
- `search_exhibits_by_topic` was `ORDER BY rec_count DESC LIMIT 200` — **no
  relevance ranking**; 76% of exhibits carry rec_count=1 → unfindable once a
  query matched >200 rows (Sam's matched 729; CPR rows at positions 285–677).
- `cpl_type`/`collaborative_type` sat INSIDE the searched tsvector ("certs"
  matched every Industry Certification row).
- Meta words ("already exist map", "check") beat the v18 refinement fold and
  matched junk ("Truck-Check").

Fixes: migration `search_exhibits_by_topic_relevance_rank` (ts_rank_cd over
title-A/discipline-B, rec_count = tiebreaker only; **schema of record now
committed** at `chatbox/supabase_search_exhibits_by_topic.sql` — the function
had never been in the repo, which is how the defect survived ~20 sessions);
v24 adds the CPR/First-Aid synonym family + meta stop-words. Verified: CPR
rows now positions 2–8; regression probes (real estate / NCCER / firefighter)
unchanged; smoke 13/13 green (mode 13 = Sam's literal question).

**② Sierra Training tab Phase 1 (PR #647).** New team-only `#sierra-training`
tab (`sierra_training.js`, the `map_users.js` gate pattern; RLS does the real
gating): the **feedback queue** (filters; triage new→triaged→addressed via
the SECURITY DEFINER RPC `sierra_feedback_set_status` — migration
`sierra_feedback_triage_status`, mirrored in
`chatbox/supabase_sierra_feedback.sql`) + the **gap miner** (newest 500
`chat_interactions`: low-sim < 0.55/null, punts, themes strip, audience
slice). Punt signatures were MEASURED from the logs (a bare MAP@rccd.edu
mention is NOT a punt — 174/298 answers carry it as routine routing), and the
regexes are curly-apostrophe-safe (the model writes "don’t"; the committed
test caught a straight-quote-only miss). Tests:
`tests/sierra_training.test.js` (38 checks).

## Read these first (in order)
- `docs/cpl_assistant_lessons.md` — BOTH Session 93 sections (the CPR
  diagnosis + the Training tab).
- `docs/sierra_training_tab_scope.md` — Phase 1 marked SHIPPED; Phases 2/3 +
  the Malone guardrails lane still scoped there.
- `docs/kb-notes/methodology-capped-retrieval-ranks-by-relevance.md` +
  `methodology-live-db-functions-need-committed-schema.md` (new, this session).
- `docs/kb-notes/reference-tmc-confidence-data-requirements.md` — the TMC
  lane's goal map (untouched this session; the mid-July Institute clock runs).

## Priority workstreams
1. **Sam + team are hacking on the Training tab today (2026-07-02).** Expect
   feedback → fold it fast. Likely asks: bulk triage, a "copy question to
   test in Sierra" affordance, date filters, linking a feedback row to its
   chat_interactions turn.
2. **Sierra Training Phase 2** (after the team has used P1): the
   `sierra_guidance` table — short rule text + active flag, reviewer/team-
   phrase write; `cpl-chat` fetches active rows (top ~10, hard char cap) into
   the system prompt. Same-minute tuning without a redeploy. Remember the
   function is SHARED — guidance steers the production widget too.
3. **Malone guardrails lane** (before the Student Portal publicizes the
   endpoint): durable rate limit + daily cost breaker in `cpl-chat`, drop the
   `"null"` CORS origin. Needs Malone's thresholds — intro pending (To-Do).
4. **TMC lane (StarFab's thread):** description-similarity precompute · wire
   real hours when Sam's COCI master report lands · verify-tier annotation in
   directory `coverageFor` · fresh COCI extract (top data ask).
5. **Standing:** Sierra CER/adoption-leverage wire
   (`docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`);
   `chatbox_exhibits` is stale + near-duplicated (Modesto tab-vs-space title
   twins = 12 rows for ~4 exhibits; Evergreen KINS 025 missing entirely) —
   the CER unified-title wire is the durable fix; unverified-M-ID renumber
   (`docs/unverified_mid_renumber_scope.md`).

## Carryover (waiting on Sam)
- Training-tab field reports from the team session.
- Malone intro (guardrail thresholds: req/min, daily budget, launch date).
- COCI export with hours columns + a FRESH COCI extract.
- The pending-ADT-submissions list (college, TMC) — else the In-progress proxy.
- MAP login URL for the nudge link · reference-tab header bands · public KB
  PR #15 · Fact Sheet redirect URL · the 3 skipped OR-groups.

## Patterns that worked (reuse them)
- **Mine the logs before guessing.** The whole CPR diagnosis came from
  `chat_interactions` + `sierra_feedback` replayed against the live RPC via
  the Supabase MCP — minutes, not speculation.
- **Measure signatures before encoding them** (the MAP@rccd.edu non-punt).
- **Fetch live definitions before editing inherited DB surfaces**
  (`pg_get_functiondef` / `get_edge_function`); a missing repo file is itself
  the finding.
- **Byte-verify deploys**: `get_edge_function` after `deploy_edge_function`,
  diff against the repo copy.
- **The committed test caught two real bugs pre-ship** (curly apostrophes;
  the straight-quote miss). Keep writing tests at that fidelity.

## Safety patterns to honor
- **`cpl-chat` is SHARED + LIVE** (v24): capture first, `verify_jwt:false`,
  runner smoke after every deploy (13 modes now).
- **Rule 4** (both HTMLs — `cp CPL_Dashboard.html index.html` after edits) ·
  **Rule 5** (never force-push main) · **Rule 8** (checkpoint).
- Merge on `unstable` once TruffleHog is green; restart the branch from
  freshly-fetched `origin/main` after each merge (same branch name).
- The Training tab NEVER writes to the public `cpl-knowledge-base` — that
  stays behind its human-gated CURATION.md pipeline.

## Moniker
Session 93 was SkyReach. Claim your own (Sky/Star streak continues).

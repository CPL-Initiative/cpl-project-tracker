# Session 95 handoff — you are Session 95

**Session 94 (SkySierra, 2026-07-02)** was the Sierra polish + Training-tab
completion day: Sam opened with praise for the v24 fixes ("much improved!")
and three asks — real branding, elegant answer formatting, and "continue on
with P1 & P2." All three landed the same day: PRs **#649/#650/#651**, all
squash-merged; cpl-chat **v26 ACTIVE**; suite **124** test files green. Pick
your own moniker (Sky/Star streak).

## What shipped (read the receipts before touching Sierra)

**① The Sierra mark + full markdown (#649).** The 🏔️/🎓 emoji avatars are
gone — the Whitney ridge in a navy roundel (`SIERRA_MARK`, a self-contained
inline SVG) now brands the COBI rail anchor (both HTMLs, Rule 4), the
sierra/ page, the COBI tab, and the Fact Sheet drawer. The markdown-lite
renderer in all THREE self-contained chat surfaces (`sierra/sierra.js`,
`cpl_chat.js`, `fact-sheet/factsheet_sierra.js`) now renders ##/### headings,
GFM pipe tables, --- rules, 1. numbered lists, italics, and mixed
paragraph+list blocks — escape-FIRST unchanged, re-run per streamed delta.
`tests/sierra_markdown.test.js` pins the three renderers **byte-identical**;
keep them in sync when tuning any one.

**② Training-tab P1 (#650).** 🧪 Test-in-Sierra (sessionStorage
`cplSierraTestQ.v1` → #chatbot input PREFILL, never auto-send) + ⧉ copy on
every feedback/gap row; 24h/7d/30d date filters; bulk triage; and the
feedback→chat-turn link (normalized-question + nearest-time match → KB
similarity / topic-match / gap chips inline). **Bug fixed along the way:**
`cpl-tab-activated` dispatches on WINDOW (tabs.js:75) but sierra_training.js
+ map_users.js listened on document — a listener that could never fire.
Copy `card_updates.js` (window) for any new tab consumer.

**③ The guidance layer (#651 — Phase 2 SHIPPED).** `sierra_guidance` table
(migration `sierra_guidance_layer`; schema of record
`chatbox/supabase_sierra_guidance.sql`): team-gated SELECT/INSERT/UPDATE,
**no delete policy** (deactivate = the audit trail). cpl-chat
`fetchTeamGuidance()` (6th parallel lookup) appends the newest **10 active**
rules (~2,500-char cap, fails soft) as a TEAM GUIDANCE block that wins on
conflict. The tab's 🧭 pane: composer, Deactivate/Reactivate, honest
"active · sent" vs "beyond top-10, not sent" chips. End-to-end proven with a
temporary marker rule visible in the smoke run, then deactivated.

**⚠ The deploy footgun (memorize this):** the MCP `deploy_edge_function`
tool **silently defaults `verify_jwt` to TRUE**. The v25 deploy omitted it →
the shared function briefly required a JWT (~40 min; first-party callers send
the anon Bearer, so likely invisible — but never rely on that). v26 (same
`ezbr_sha256`) restored `false`. **Pass `verify_jwt: false` explicitly in
EVERY cpl-chat deploy call**, then byte-verify (`get_edge_function` → diff
vs the repo copy) and re-run the smoke. A 55KB deploy payload can also drop
mid-flight ("permission stream closed") — `list_edge_functions` to see what
landed, then retry.

## Read these first (in order)
- `docs/cpl_assistant_lessons.md` — the Session 94 section (this session's
  full story) + both Session 93 sections.
- `docs/sierra_training_tab_scope.md` — Phases 1 + 2 marked SHIPPED; Phase 3
  (artifact ingestion) + the Malone guardrails lane still scoped there.
- `docs/kb-notes/playbook-deploy-shared-supabase-edge-function.md` — now
  doubly load-bearing (the verify_jwt default).

## Priority workstreams
1. **The team authors real guidance rules.** The 🧭 pane is live — the
   CPR/First-Aid learning is a natural first rule. Watch `sierra_feedback`
   for how rules land; fold feedback fast.
2. **Sierra Training Phase 3** (after the gap miner shows what's missing):
   artifact ingestion into the RAG corpus (`cpl_documents` /
   `cpl_document_sections`, `gte-small` embeddings — must match the query
   model), with a test-it box + per-document retire. The heaviest phase;
   scope in `docs/sierra_training_tab_scope.md`.
3. **Malone guardrails lane** (before the Student Portal publicizes the
   endpoint): durable rate limit + daily cost breaker in `cpl-chat`, drop the
   `"null"` CORS origin. Needs Malone's thresholds — intro still pending.
4. **TMC lane (StarFab's thread):** description-similarity precompute · real
   hours when Sam's COCI master report lands · verify-tier annotation in
   directory `coverageFor` · fresh COCI extract (top data ask).
5. **Standing:** Sierra CER/adoption-leverage wire
   (`docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`);
   `chatbox_exhibits` stale + near-duplicated (the CER unified-title wire is
   the durable fix); unverified-M-ID renumber
   (`docs/unverified_mid_renumber_scope.md`).

## Carryover (waiting on Sam)
- Guidance-rule field reports once the team starts writing them.
- Malone intro (guardrail thresholds: req/min, daily budget, launch date).
- COCI export with hours columns + a FRESH COCI extract.
- The pending-ADT-submissions list (college, TMC) — else the In-progress proxy.
- MAP login URL for the nudge link · reference-tab header bands · public KB
  PR #15 · Fact Sheet redirect URL · the 3 skipped OR-groups.

## Patterns that worked (reuse them)
- **Byte-verify every deploy**: `get_edge_function` after deploy, python-diff
  vs the repo copy (caught nothing this time — but the verify_jwt flip was
  caught by reading the deploy RESPONSE; read it, don't just check ok).
- **Prove a prompt-layer wire with a marker rule**, not by eyeballing: a
  temporary detectable directive + the smoke's mode-1 grep = positive
  end-to-end proof in one run; deactivate after.
- **Keep the three chat renderers byte-identical** and let the committed test
  enforce it — divergence is silent otherwise.
- **Restart the branch from origin/main after every squash-merge** (same
  branch name); prune first if GitHub auto-deleted the remote branch
  (`--force-with-lease` fails "stale info" otherwise).

## Safety patterns to honor
- **`cpl-chat` is SHARED + LIVE** (v26): capture first, **`verify_jwt:false`
  EXPLICITLY**, byte-verify, runner smoke after every deploy (13 modes).
- **Guidance rows steer the production widget too** — the write gate
  (reviewer/team-phrase) is the security boundary; never widen to anon;
  never add a delete policy.
- **Rule 4** (both HTMLs) · **Rule 5** (never force-push main) · **Rule 8**
  (checkpoint). Merge on `unstable` once TruffleHog is green.
- The Training tab NEVER writes to the public `cpl-knowledge-base` — that
  stays behind its human-gated CURATION.md pipeline.

## Moniker
Session 94 was SkySierra. Claim your own (Sky/Star streak continues).

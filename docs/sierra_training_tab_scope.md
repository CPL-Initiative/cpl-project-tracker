---
title: Sierra Training tab — recommendation + phased scope
created: 2026-07-01
updated: 2026-08-12  # Sam's usability pass: plain language + the silent cap
tags: [scope, sierra, cpl-assistant, training, feedback, rag, guardrails]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[docs/cpl_assistant_lessons]]"
  - "[[docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope]]"
  - "[[docs/kb-notes/playbook-deploy-shared-supabase-edge-function]]"
artifacts:
  - chatbox/supabase_sierra_feedback.sql
  - chatbox/supabase/functions/cpl-chat/index.ts
  - sierra/sierra.js
  - cpl_chat.js
---

# Sierra Training tab — recommendation + phased scope

**The ask (Sam, 2026-07-01, Session 92):** should COBI get a "Sierra Training"
tab where the team can add artifacts/data to the KB and provide guidance on
response enhancements? Follow-ups the same session: it should be **informed by
log entries to see where gaps might be**, and — down the road — **Malone (MAP
tech director) will need guardrails** (security, IP-based usage limits for cost
control, spam protection) before Sierra ships inside the **CPL Student Portal
("Credit for Being Me")**.

## Recommendation: YES — build it, as a thin console over live tables, in 3 phases

A Training tab earns its place because the improvement loop already exists but
has no working surface: every turn is logged (`chat_interactions`), every answer
is now rateable (`sierra_feedback`, Session 92), and response behavior is tuned
by editing the shared `cpl-chat` Edge Function. What's missing is the place
where a **team member** (not a Claude session) sees the gaps and feeds the fix.
Build it lean — a lazy, static tab renderer (the `map_users.js` pattern:
public-safe default view, reviewer/team-phrase gate for the real data), NOT a
heavyweight app.

**One governance boundary, stated up front:** the Training tab writes to the
**Sierra RAG corpus** (Supabase `cpl_documents` / `cpl_document_sections`) and
to prompt-guidance tables. It must **never** write to the public
`cpl-knowledge-base` repo — that store is reached only through its human-gated
`CURATION.md` pipeline. "Adding an artifact to Sierra's knowledge" and
"publishing to the public KB" are different acts with different gates.

## What Session 92 already laid down (the tab's foundations)

- **`sierra_feedback`** — 👍/👎 + note per answer, with audience, page, and the
  Q/A snapshot. Anon write-only; **SELECT gated** `is_allowed_reviewer() OR
  team_pass_ok()` — i.e. the Training tab can already read its queue.
- **`chat_interactions`** gained an `audience` column AND the same
  reviewer/team-phrase SELECT policy (it was write-only before) — the log-mining
  read path Sam asked for.
- **Audience selector** on both Sierra surfaces → every logged turn now carries
  who was asking, so gaps can be sliced per population.

## Phase 1 — Review queue + gap miner ✅ SHIPPED (2026-07-02, Session 93 SkyReach)

**Sam green-lit Phase 1 on 2026-07-01 ("Let's go green on the Training Tab")
and it shipped the same session** as the `#sierra-training` tab (nav label
"Sierra Training", right under CPL Assistant): renderer `sierra_training.js`
(static, lazy, the `map_users.js` pattern), reviewer/team-phrase gated
server-side by the existing RLS SELECT policies. Both panes below as scoped,
plus: punt signatures measured from the live logs (a bare "MAP@rccd.edu"
mention is NOT a punt — it appears in 174/298 answers as routine routing;
curly-apostrophe-safe regexes), a recurring-themes strip over the gap rows,
and an honest "your sign-in doesn't unlock the logs" state (RLS returns
200+[] rather than an error). The `status` column + the reviewer/team-phrase
`sierra_feedback_set_status` RPC landed in migration
`sierra_feedback_triage_status` (schema of record:
`chatbox/supabase_sierra_feedback.sql`). Tests:
`tests/sierra_training.test.js` (38 checks). Original Phase-1 scope kept
below for reference.

One tab, two panes, all read-only over the two tables (reviewer/team-phrase
gated, the shared `cpl_sb` session):

1. **Feedback queue** — `sierra_feedback` newest-first; filters rating /
   audience / page / has-note; each row expands to the full Q + A + note.
2. **Gap miner over `chat_interactions`** — the log-informed view:
   - **thumbs-down clusters** (join `sierra_feedback` on question text /
     session) — what people rated down, grouped by recurring keywords;
   - **low-similarity turns** (`top_similarity` below ~0.55 or null) — the RAG
     corpus had nothing close: the single best "what artifact is missing" signal;
   - **"no answer" responses** (response LIKE the "I don't have…/contact
     MAP@rccd.edu" fallbacks) — where Sierra explicitly punted;
   - counts by `audience` so student-facing gaps rank first.

Add a small `status` column (`new / triaged / addressed`) on `sierra_feedback`
(reviewer-writable) so the queue drains instead of re-reading forever.

## Phase 2 — Guidance layer ✅ SHIPPED (2026-07-02, Session 94 SkySierra)

**Shipped as scoped** (PR #651 + migration `sierra_guidance_layer` + cpl-chat
v25/v26): the `sierra_guidance` table (rule 3–500 chars + active flag + note +
author + timestamps; SELECT/INSERT/UPDATE gated `is_allowed_reviewer() OR
team_pass_ok()`, **no delete policy** — deactivate instead), a third
**🧭 Guidance pane** on the Training tab (composer + toggle + honest
"sent / beyond top-10, not sent" chips), and `fetchTeamGuidance()` in the
function's parallel fan-out appending a bounded TEAM GUIDANCE block (newest
**10 active** rules, ~2,500-char cap, fails soft) to every system prompt.
Schema of record: `chatbox/supabase_sierra_guidance.sql`. Tests:
`tests/sierra_guidance.test.js` (23 checks); end-to-end proven with a
temporary marker rule + the runner smoke. ⚠ Deploy footgun found: the MCP
`deploy_edge_function` tool **silently defaults `verify_jwt` to true** — v25
briefly carried it; v26 (same sha) restored `false`. Always pass it
explicitly. Original Phase-2 scope kept below for reference.

A `sierra_guidance` table (short rule text + active flag + author + timestamp;
reviewer/team-phrase write, service-role read). The `cpl-chat` function fetches
the active rows (bounded: top ~10, hard char cap) and appends them to the system
prompt alongside STATEWIDE/CREDIT/OFFERINGS/AUDIENCE rules.

- **Why:** today every wording tweak = a session editing + redeploying the
  shared function. A guidance table gives the team a same-minute knob, with the
  committed rules staying the stable spine.
- **Eyes open:** the function is shared — guidance rows steer the **production
  map.rccd.edu widget too** (that's the point, but the team must know); a
  guidance row is prompt text, so the write gate (reviewer/team-phrase) is the
  security boundary — never widen it to anon; keep an audit trail (no hard
  deletes, `active=false` instead).

## Phase 3 — Artifact ingestion into the RAG corpus (the "add data to the KB" half)

Upload/paste a document in the tab → chunk → embed (`gte-small`, the same model
the function queries with — embeddings must match) → insert into
`cpl_documents` + `cpl_document_sections`, tagged with source + uploader.
Mechanics: an `ingest` Edge Function (service-role, reviewer-gated caller) or a
runner workflow (the KB Portal composer pattern). Include a "test it" box (ask
Sierra a question, see whether the new sections surface) and a per-document
retire/rollback. This is the heaviest phase — build it after Phase 1 proves
which artifacts are actually missing.

## Guardrails / hardening lane (for Malone — pre-"Credit for Being Me")

Current state, honestly assessed (all in `cpl-chat` v22):

| Guard | Today | Gap |
|---|---|---|
| Rate limit | 20 req/min/IP, **in-memory Map** | Per-isolate + resets on cold start — under real load or a multi-instance scale-out it's porous. Needs a durable counter (Postgres table / KV) or an edge WAF in front. |
| Cost ceiling | none | No daily token/request budget. A scripted flood = an open Anthropic bill. Add a global daily counter → friendly 503 "Sierra is resting" past the cap + an alert. |
| CORS | allowlist, but includes `"null"` (file://) | The `"null"` origin was for local testing and is flagged "REMOVE before production" in-code — remove before Portal launch. (CORS never stops curl anyway; the anon key is public by design — the real controls are the two rows above.) |
| Abuse/spam content | 1000-char cap, nothing else | Consider simple heuristics (repeat-identical-query throttle, min interval per session) and, at the Portal layer, Turnstile/em>captcha on the widget boot. |
| Logging | anon `chat_interactions` (now reviewer-readable) | Good enough for forensics; add a weekly usage/cost digest so anomalies get seen. |

Recommended shape: a **`sierra-guardrails` workstream with Malone** — durable
rate limiting + daily budget breaker inside the function (no infra change), CORS
tightening, and Portal-side bot friction. None of it blocks the Training tab;
the budget breaker is the one piece worth landing **before** the Portal
publicizes the endpoint.

## Sequencing + effort (honest sizing)

| Phase | Size | When |
|---|---|---|
| 1 — Review queue + gap miner | ~1 session | ✅ SHIPPED (Session 93) |
| Guardrails: budget breaker + durable rate limit | ~1 session (with Malone for thresholds) | Before Portal launch |
| 2 — Guidance table | ~½ session | ✅ SHIPPED (Session 94) |
| 3 — Artifact ingestion | 1–2 sessions | After the gap miner shows which artifacts are missing |

**Decisions:** Phase 1 ✅ SHIPPED (2026-07-01/02, Session 93) — plus the P1
team-session affordances (2026-07-02, Session 94: test-in-Sierra, date
filters, bulk triage, feedback→log-turn link). Phase 2 (guidance table)
✅ SHIPPED (2026-07-02, Session 94). Still open: introduce a session to
Malone for the guardrails thresholds (rate, daily budget, launch date);
Phase 3 (artifact ingestion) waits for the gap miner to show which
artifacts are missing.

---

## 2026-08-12 — Sam used it, and two things were wrong

Sam worked the tab directly for the first time in a while and reported: *"the
Sierra Training tab uses a bunch of jargon I don't understand"*, *"when I click
Triage, there's no prompt for me to add any adjustments — not sure what it or
Addresses is doing"*, and *"I don't need all your smoke tests in the training
(CI) — though I don't know what CI stands for."* Shipped **#1138**; the language
pass is in the PR. Two findings outlast it.

### ⭐ The composer was silently eating his instructions

`maxlength="500"` on the textarea, and an independent `.slice(0, 500)` in
`cpl-chat`. Three rules written that morning were cut — two at exactly 500, one
at 499 ending mid-table (`| ASE A1 –`). Nothing told him. He only found out by
asking, separately, why his instructions did not seem to be taking effect.

Raised to **1,500 on both sides** (raising one alone only relocates the
truncation) and made visible with a live counter. `cpl-chat` deployed **v39**.
Full lesson, including the *identical-length fingerprint* that catches this:
[`docs/kb-notes/methodology-a-silent-cap-eats-work-and-a-paired-cap-drifts.md`](kb-notes/methodology-a-silent-cap-eats-work-and-a-paired-cap-drifts.md).

⚠️ The **total** budget fails the same silent way and is now surfaced too: past
it the function stops adding rules and the *oldest* stop reaching Sierra — and
the oldest is the naming rule the whole platform depends on.

### ⭐ A queue that tracks attention but not remedy reports itself complete

This is the sibling lesson to the cap, and the more general one. `new → triaged
→ addressed` recorded **that a human looked**, never **what was done**. Marking
an item "addressed" changed nothing about how Sierra answers — yet the queue
then reported itself clear. Both panes needed to fix it sat on the same screen,
unconnected: the finding above, the instruction composer below.

Sam's instinct on clicking Triage — *where do I type the adjustment?* — was the
correct product instinct, and the tab had no answer.

Fixed by relabelling the buttons as bookkeeping ("Mark this:", each stating
outright that it does not change how Sierra answers) and adding **"✍️ Write an
instruction about this"**, which seeds the composer from the question and
scrolls to it. It deliberately writes nothing: only a human knows what the right
answer was.

**Generalise it:** when a workflow has a *status* lane and a *remedy* lane, the
status lane must either link to the remedy or refuse to close without it.
Otherwise "done" measures attention, and attention is not outcome — the same
shape as the disposition-rate finding on the $50k tab, and as
`contact-refresh-cadence-never-run`.

### Phase status, corrected

Phase 2 (guidance → Sierra) has been wired since Session 94 and **does** reach
every surface, including the Sierra AI section of My College — `fetchTeamGuidance`
runs per request with no cache. The tab now says so in plain words instead of
naming phases at the reader. Phase 3 (artifact ingestion) is still the open one.


---

## 2026-08-13 — SkyRef: the hand-off was typing into a hidden box

Sam, mid-triage: *"tried to use Try it With Sierra button but it didn't copy the
question into Sierra and when I tried to copy and paste the question, it doesn't
the training tab doesn't allow it."*

Three defects, and the reason this needed a report rather than a code read is
that **all three fail silently** — a button that does nothing is
indistinguishable from a button that was never wired.

1. **Wrong target.** `cpl_chat.js` keeps `inputEl` at module scope. My College
   mounts the *same* widget via `mountInto()`, and `build()` re-points `inputEl`
   at that pane's input; `mount()` is idempotent, so returning to `#chatbot`
   never re-points it back. **After one visit to My College, every hand-off for
   the rest of the session typed into a hidden pane.** The consumer now resolves
   the `#chatbot` pane's own input from the DOM.
2. **The key was burned on failure.** `removeItem` ran *before* the guard that
   could abort, so a consume that could not deliver also destroyed the pending
   question — the retry was gone too. It is now removed only after the value
   lands, so a failed hand-off stays pending and completes on the next
   activation.
3. **Selecting the question collapsed the row.** The question sits inside
   `.sit-row-head`, which carries the open/close click handler, so releasing the
   mouse after a drag re-rendered the row and destroyed the selection
   milliseconds after it was made. The text was never unselectable — it was being
   thrown away. The toggle now ignores a click that ended a selection inside that
   row, and `.sit-q` is explicitly `user-select:text`.

Two more silent no-ops in the same file: the `[data-qact]` handler returned
silently when a row carried no question, and `copyText()` passed an **empty
rejection handler** to `navigator.clipboard.writeText` — which rejects in
entirely ordinary situations (unfocused document, permissions policy, non-secure
context), so "⧉ Copy question" could do nothing and say nothing. Both now report
on the button.

`tests/sierra_test_handoff.test.js` — 18 checks, and **verified against the
pre-fix file**: 5 fail there. A test written after a fix that passes on both
versions guards nothing. The test has to reproduce the *two-mount* condition; the
single-mount happy path passed throughout.

Durable: [`methodology-a-one-shot-handoff-must-not-consume-what-it-cannot-deliver`](kb-notes/methodology-a-one-shot-handoff-must-not-consume-what-it-cannot-deliver.md).
PR #1166. Front-end only — shipped with Pages, no cpl-chat deploy.

**Still open:** Phase 3 (documents in her knowledge). Sam had already triaged the
feedback backlog 25 → **5** himself; three of those five are now fixed in code
and can be cleared.

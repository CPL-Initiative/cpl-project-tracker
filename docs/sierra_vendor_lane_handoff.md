---
title: Sierra vendor-integration lane — session handoff
created: 2026-07-03
updated: 2026-07-03
tags: [handoff, sierra, integration, vendor-facing]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[sierra_maturity_roadmap]]"
  - "[[sierra_iframe_implementation_guide]]"
  - "[[sierra_integration_analysis]]"
  - "[[sierra_technical_reference]]"
---

# Sierra Vendor Lane — Handoff

You are the next session picking up the **Sierra vendor-integration lane**.
This handoff is lane-scoped (like `cpl_funding_handoff.md`), NOT a numbered
`session_<N>_handoff.md` — the numbered lane belongs to the parallel
Session-97 workstream (TEAM-ONLY Supabase attachments, PR #656) that was
active while this lane ran. **Do not renumber; reconcile below.**

## Who was in the room

Sam (product owner, "I play a techie on TV") + **Malone** (technical owner —
the "Malone guardrails" are literally named for him; he drives next steps on
this lane). The vendor's platform hosts an Azure-AI-Foundry-based bot today;
their developers raised unspecified security concerns about replacing it —
coexistence (Sierra iframe + their bot reading our data) is the working
architecture, not a rip-and-replace.

## The clock that matters

**Guardrails committed within ~5 days of 2026-07-02; a vendor integration
live within ~9 days.** The iframe path satisfies the 9-day goal with zero
vendor-blocking work from us; the guardrails (roadmap Phase 1) are the real
build.

## What shipped in this lane (both merged to main, both LIVE)

1. **PR #654 — the vendor doc trio:** `docs/sierra_technical_reference.md`
   (how Sierra is built; full API contract), `docs/sierra_integration_analysis.md`
   (benefits/risks/preconditions; risk register), `docs/sierra_integration_guide.md`
   (link/iframe/native/proxy paths). Plus INDEX rows + a CLAUDE.md §7c pointer.
2. **PR #657 — cpl-chat v27, the fail-open external contacts gate** —
   DEPLOYED and byte-verified (`verify_jwt:false` passed explicitly; live
   sha == repo sha). Opt-in body field `ctx:"external"` suppresses the
   college-staff `CPL Contact: name (email)` line from the college context;
   absent/unknown = byte-identical prior behavior (third opt-in field on the
   v17-`history`/v22-`audience` convention). `sierra/?ctx=external` passes it
   through, so the vendor iframe needs zero vendor code.
   `tests/sierra_ctx.test.js` (11 checks; suite 129 files green) +
   **smoke mode 14a/b** (San Diego Mesa anchor: default MUST name the
   coordinator, external MUST NOT — both asserted green on live v27).
3. **This closing PR:** `docs/sierra_iframe_implementation_guide.md` (vendor
   day-one recipe), `docs/sierra_maturity_roadmap.md` (Malone's
   scope-and-sequence to end-state), this handoff, INDEX rows.

## Decisions LOCKED (do not relitigate)

- **Fail-open now** (Malone, explicit): `ctx` absent/unknown = contacts
  included; only external embeds opt out. The **fail-closed flip is Phase 2.1
  of the roadmap and needs Sam's call** (it strips contacts from the
  production widget unless that widget is updated).
- **Supabase-first for the vendor's own bot** (Sam): their bot gets our
  *structured data* (exhibits/profiles/offerings); the prose corpus comes
  later, gated on the KB re-point. "KB alone" was evaluated and rejected —
  the KB repo covers only the prose slice; the runtime brain is Supabase +
  `live_metrics.json` from this repo.
- **Iframe now, native later** — the iframe is explicitly interim; the
  graduation sequence is the roadmap's critical path.
- **Sierra persona rename stays deferred** to the Student Portal (Sam);
  interim fix is only the "on map.rccd.edu" host line (roadmap 2.2).

## Live state you inherit

- `cpl-chat` **v27 ACTIVE**, `verify_jwt:false`, model `claude-sonnet-4-6`.
  Source of record byte-matches `chatbox/supabase/functions/cpl-chat/index.ts`.
- Vendor iframe URL (shareable today):
  `https://cpl-initiative.github.io/cpl-project-tracker/sierra/?ctx=external`
- Verified access facts (2026-07-02, live introspection): `chatbox_exhibits`
  + `chatbox_college_profiles` are **service-role only** (anon gets zero rows
  through the invoker-rights search RPCs); `coci_college_offerings/programs`
  + `college_geo` are anon-readable; the RAG corpus tables are locked (RLS
  on, no policies, invoker-rights RPC). Any vendor-bot data access requires
  the roadmap-4.2 unlock (definer RPCs or the `cpl-data-api` façade —
  **exclude the `contacts` column from anything vendor-facing**).

## Your priority queue (in order)

1. **Phase 1 guardrails** (`sierra_maturity_roadmap.md` §Phase 1): durable
   rate limit → daily cost breaker → CORS hygiene (remove `"null"`,
   exact-match, add vendor origins when Malone supplies them) → usage digest.
   ~4 days of the 5-day commitment; everything downstream waits on this.
2. **Roadmap 2.2 + 2.3** on the same deploy: neutralize the persona host
   line; log `ctx` to `chat_interactions`.
3. **When the vendor confirms iframe launch:** collect their page URL +
   traffic estimate; add their top scenario as a smoke mode (2.4).
4. **Tee up Sam's two decisions:** fail-closed flip (2.1) and corpus
   re-point timing (3.1). Don't build 4.3 (prose endpoint) before 3.1 lands.

## Patterns that worked (keep doing these)

- **Capture-before-edit, byte-verify-after** on the shared function: fetch
  live via `get_edge_function` (result overflows → saved file → hash-compare
  in python), park the capture in scratchpad as rollback.
- **Opt-in body fields** for any behavior change — absent = prior behavior;
  the production widget has survived 14 versions this way.
- **Smoke assertions anchored on verified data**: pick the anchor row by
  querying live (San Diego Mesa had a populated coordinator AND a landing
  URL that can't collide with the negative grep). Assert BOTH directions.
- **Conflict-check before touching shared surfaces**: list open PRs + diff
  main since your last merge + grep the delta for your file paths. Two other
  sessions were active this day; zero collisions because the lanes were
  verified disjoint first.
- **Docs promise → docs delivered**: the vendor docs carry a standing
  "keep in sync with contract changes" note — v27 updated all of them in the
  same PR. Hold that line.

## Safety rails (violations have bitten before)

- The MCP `deploy_edge_function` tool **requires** `verify_jwt` now — it is
  ALWAYS `false` for `cpl-chat` (v25 shipped `true` for ~40 min once; the
  widget 401s). Byte-verify after every deploy.
- Every `cpl-chat` deploy + every `sierra_guidance` row hits the **production
  map.rccd.edu widget** and (soon) the vendor's page. There is no staging
  tier (roadmap 6.4 proposes one).
- The sandbox is egress-blocked from `*.supabase.co` / map.rccd.edu / the
  Azure hosts — smoke-test on the runner (push touching
  `index.ts`/`smoke_test.sh` auto-triggers it), diagnose via the Supabase MCP.
- Never widen `sierra_guidance` / feedback / contacts gates toward anon.

## Bookkeeping notes for the next NUMBERED session

This lane deliberately did **not** touch `kb/cpl_todos.json`, the §11
narrative budget, or `docs/INDEX.md`'s session-handoff table beyond adding
its own docs — the parallel Session 97 owns that checkpoint state and
same-day races on those files are exactly what Rule 6 warns about. At the
next numbered checkpoint: fold this lane's status into the To-Do feed
("guardrails build" for Fable; "fail-closed + re-point decisions" for Sam)
and treat `sierra_maturity_roadmap.md` as the lane's authoritative plan.

## Read-in order (cold start)

1. `docs/sierra_maturity_roadmap.md` — the plan; your queue is Phase 1.
2. `docs/sierra_technical_reference.md` §3/§8/§9 — contract + security + ops.
3. `docs/cpl_assistant_lessons.md` (v27 section at the bottom) — the gate's
   story + receipts.
4. `docs/sierra_integration_analysis.md` §5 — the preconditions checklist you
   are executing.
5. CLAUDE.md §7c — the operational invariants (shared function, deploy
   playbook links, v27 blurb).

Moniker suggestion: **SkyGate** is taken; this lane has been flying unnamed —
claim something Sierra-flavored if you like (Whitney? Sherpa? Basecamp — you
are, after all, building the camps on the way up). The door's open.

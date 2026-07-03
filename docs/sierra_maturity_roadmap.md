---
title: Sierra maturity roadmap — scope and sequence from iframe to end-state
created: 2026-07-03
updated: 2026-07-03
tags: [roadmap, sierra, cpl-assistant, integration, guardrails, architecture]
kb-status: published
obsidian-folder: cpl-project-tracker
related:
  - "[[sierra_integration_analysis]]"
  - "[[sierra_technical_reference]]"
  - "[[sierra_iframe_implementation_guide]]"
  - "[[sierra_training_tab_scope]]"
  - "[[co_platform_strategy]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
---

# Sierra Maturity Roadmap — Scope & Sequence

> **Audience:** Malone (technical owner) + Sam. The complete set of changes
> between today's state (v27, iframe embed imminent) and a **mature Sierra**
> — every guardrail, content fix, integration graduation, and platform
> hardening item, sequenced with dependencies, effort, and owner. Explicitly
> **excluded by design:** the continual training loop (feedback triage, gap
> mining, guidance authoring) — that is steady-state operations that persists
> at every maturity level, not a maturity milestone.
>
> Statuses reflect 2026-07-03. Effort estimates are engineering-days for one
> person familiar with the stack; a Claude session typically compresses the
> small ones to same-day.

---

## 0. Where we are (baseline, done)

| Done | What |
|---|---|
| ✅ | `cpl-chat` v27 live: streaming RAG, 6-lookup pipeline, multi-turn, audience voice, guidance layer, feedback loop, 14-mode smoke battery |
| ✅ | **External contacts gate** (`ctx:"external"`, fail-open) + `sierra/?ctx=external` — the vendor iframe is policy-compliant today |
| ✅ | Vendor doc set (technical reference · integration analysis · integration guide · iframe day-one guide) |
| ✅ | Deploy discipline codified (capture-before-redeploy, explicit `verify_jwt:false`, byte-verify, smoke-on-push) |

**Definition of mature** (the end-state this roadmap reaches): *any approved
surface — ours or a partner's — can embed Sierra or query its data through a
stable, cost-bounded, abuse-resistant, content-clean contract, with no
private-provenance content, no per-deploy human heroics, and observable
usage/cost/quality.* Everything below is the delta.

---

## Phase 1 — Guardrails (this week; blocks everything downstream)

The "Malone guardrails." No external traffic growth should land before these.

| # | Item | Scope | Effort | Notes / dependencies |
|---|---|---|---|---|
| 1.1 | **Durable rate limit** | Replace the in-memory per-isolate `Map` with a durable counter — recommended: a Postgres table + `SECURITY DEFINER` bump-and-check function (the stack already lives there; no new infra), keyed by IP hash, 60s window. Keep the in-memory check as a cheap first pass. | 1 d | The current limiter resets on cold start and doesn't span isolates — porous exactly when traffic spikes. |
| 1.2 | **Daily cost breaker** | Global daily token/request budget in Postgres, incremented per turn (`response_tokens` is already measured); at cap → friendly 503 ("Sierra is resting — back tomorrow") + alert email. Manual reset switch. | 1 d | The single highest-severity risk in the analysis doc: an open Anthropic bill. Must land before any traffic-multiplying launch. |
| 1.3 | **CORS hygiene** | Remove `"null"` (file://) from `ALLOWED_ORIGINS`; switch prefix-match to exact-origin match; add vendor prod + staging origins (needed for Phase 3 anyway). | 0.5 d | One redeploy covers all three. Localhost entries stay for dev. |
| 1.4 | **Usage/cost digest** | Weekly summary from `chat_interactions` (turns, tokens, top sessions/prefixes, audience mix, low-similarity rate) → email or a Training-tab pane. | 0.5–1 d | Makes 1.1/1.2 observable instead of silent. |
| 1.5 | **Abuse throttles (light)** | Min-interval per session, repeat-identical-query throttle. Defer captcha/Turnstile until evidence of need. | 0.5 d | Cheap now, riding the same deploy. |

**Phase 1 exit:** a scripted flood costs at most one day's budget; limits
survive cold starts; the origin list is exact and includes the vendor.

---

## Phase 2 — Contract & policy hardening (days; can overlap Phase 1)

| # | Item | Scope | Effort | Notes / dependencies |
|---|---|---|---|---|
| 2.1 | **Fail-closed contacts flip** | Default becomes contacts-SUPPRESSED; internal surfaces opt in (`ctx:"internal"` from the COBI tab). **Requires coordinating the production map.rccd.edu widget** (it can't easily send a field) — decide: update the widget, or accept it losing contacts, or keep fail-open permanently. Smoke mode 14 flips accordingly. | 0.5 d + a decision | Parked deliberately at v27. The defensible end-state posture — contacts are reviewer-gated everywhere else on the platform. **Sam decision required.** |
| 2.2 | **Persona/host line fix** | The prompt still opens "You are the CPL Chatbox, a helpful assistant on map.rccd.edu…" — wrong on every non-widget surface. Minimum: neutralize the host claim. Full: the **Sierra persona rename**, which Sam has deliberately deferred to land with the Student Portal — do the minimum now, the rename on his signal. | 0.25 d | One line + redeploy + smoke. |
| 2.3 | **Attribution plumbing** | Log `ctx` (and optionally a free-form `src` tag) to `chat_interactions`; document the vendor `session_id` prefix convention as required, not suggested. | 0.5 d | Makes the digest (1.4) able to split vendor vs first-party traffic. One column + one insert field. |
| 2.4 | **Vendor smoke modes** | Add the vendor's top 1–2 real user scenarios to `smoke_test.sh` once they share them. | 0.25 d | Standing offer in the guides; do it at iframe launch. |

---

## Phase 3 — Content maturity (1–2 weeks; the biggest credibility lever)

| # | Item | Scope | Effort | Notes / dependencies |
|---|---|---|---|---|
| 3.1 | **RAG corpus re-point** (private vault → public `cpl-knowledge-base`) | Audit/prune the 41 current docs; promote public-appropriate content through the KB's curation pipeline; stand up the indexing workflow in that repo (`gte-small`, same model as query-time); snapshot → clear → re-index. **Global content swap — flips the production widget too**; decisions were locked in the integration scope (fork D, F-shared). | 2–3 d + curation time | The standing privacy item: ~half the current corpus is internal drafts reachable from public surfaces. Gates any external prose access (4.3). |
| 3.2 | **`chatbox_exhibits` refresh pipeline** | The topic corpus is a stale external extract with no committed sync (Modesto tab-vs-space near-duplicate rows, a missing Evergreen exhibit). Build a committed regeneration from the tracker's daily MAP data; longer-term, re-point the grain to the CER unified-title layer so title drift collapses. | 2 d (sync) / +3–5 d (CER grain) | The sync is mechanical; the CER re-point is the durable fix and feeds 5.1. |
| 3.3 | **College-profile depth** | Profiles carry only ~8 sample exhibits (sort-order-skewed) — college-only answers are blind to the rest. Widen the sample or make it query-aware. | 1 d | Quality, not privacy. |
| 3.4 | **Landing pages from the Custom Report** | When Sam's MAP change lands, retire `scrape_landing_pages.py` + its weekly workflow; source URLs from `fetch_custom_report.py` on the daily cron. | 0.5 d | Blocked on the MAP-side change; the interim scraper works. |

---

## Phase 4 — Integration graduation (vendor-paced; our side is small)

| # | Item | Scope | Effort | Notes / dependencies |
|---|---|---|---|---|
| 4.1 | **Native embed** (replaces the iframe) | Vendor builds Sierra into their design system against the documented API (or forks `sierra.js`). Our side: origins (done in 1.3), the week-by-week plan in the integration guide, joint QA. Optionally first: finish `cpl_chat.js` self-containment (bundle its base CSS) so the embed unit is truly drop-in. | Us: ~1 d support (+1 d self-containment) · vendor: 1–3 wk | Needs Phases 1 + 2.1/2.2. This is the iframe's end-state successor for *presenting Sierra*. |
| 4.2 | **Data access for the vendor's own bot** (Foundry) | Their bot queries our structured data. Recommended shape: **Path 2 façade** — a read-only `cpl-data-api` Edge Function (exhibits-search / college-profile / offerings-search modes) with the same gating pattern as `cpl-chat`, returning column-safe payloads (profiles WITHOUT `contacts`). Alternative fast path: SECURITY-DEFINER flips of the two search RPCs + a safe `get_college_profile()` (SQL-only, an afternoon). | Façade 1–2 d · SQL-only 0.5 d | Sam's locked direction (Supabase-first). The exhibits/profiles tables are service-role-only today — verified 2026-07-02 — so *some* unlock is required either way. |
| 4.3 | **Prose search endpoint** (`cpl-kb-search`) | Retrieval-as-a-service over the RAG corpus: `{query, k}` → embeds server-side → `match_document_sections` → chunks + similarity. Becomes a mode on the 4.2 façade. | 0.5–1 d | **Gated on 3.1** (never expose the private-provenance corpus). Fulfills "context at its disposal" for the vendor bot. |

---

## Phase 5 — Retrieval & recommendation depth (the recommender ladder; weeks, incremental)

Already-scoped work (decisions D1–D5 locked in the CCR/CER recommendation
scope); offerings slice shipped in v20. Order within the phase:

| # | Item | Scope | Effort | Notes |
|---|---|---|---|---|
| 5.1 | **CER credential layer wire** | Sierra resolves a credential to its unified identity + issuing agency (kills raw-title fragmentation in answers). | 2–3 d | Pairs with 3.2's CER grain. |
| 5.2 | **CCR course-identity crosswalk wire** | Local course ↔ C-ID/CCN/M-ID resolution in answers ("your EMT cert maps to EMS 350 at Modesto = C-ID EMS 100 elsewhere"). | 2–3 d | |
| 5.3 | **Adoption-leverage / prescriptive layer** | The ~48k "should-articulate" opportunities surfaced college-by-college (over-merge-flagged clusters withheld). | 2 d | Data exists (`statewide_prescriptive`); it's a wire + prompt work. |
| 5.4 | **Multi-college detection** | Detect ALL named colleges in a query, not the first alias hit. | 1 d | Known limitation since v21. |
| 5.5 | **M3 demand signal** | Aggregate "students are asking for X at college Y" panel (privacy ADR first; small-cell suppression). | 2–3 d | Product decision + ADR before build. |
| 5.6 | **M2 benchmark battery** | Score Sierra vs the Student Portal's own bot on a rubric. | 2 d | **Blocked on portal-bot access.** |

---

## Phase 6 — Platform & operations maturity (background; finish before "done")

| # | Item | Scope | Effort | Notes |
|---|---|---|---|---|
| 6.1 | **Regression eval suite** | Beyond smoke: a scored answer-quality battery (the `preflight` pattern, rubric-scored) run on a schedule; catches drift, not just breakage. | 2 d | Named table-stakes in the CO-platform strategy. |
| 6.2 | **PII-output guard** | Post-generation check that answers never emit emails/phones outside an allowlist (MAP@rccd.edu, landing URLs) — the mechanical backstop to the contacts gate. | 1 d | Cheap once 1.x exists; also protects against future context additions. |
| 6.3 | **Observability** | Structured tracing (e.g. Langfuse or plain Postgres): per-turn mode/lookup timings/model usage; error alerting on 5xx rate. | 1–2 d | The digest (1.4) is the v1; this is the grown-up version. |
| 6.4 | **Versioning/staging posture** | Today: one shared function, no staging tier. Decide: (a) accept + keep the smoke-gate discipline, (b) a `cpl-chat-staging` slug for pre-prod soak, or (c) per-surface pinning (heavier). Recommendation: (b) — cheap, ends the "every deploy is production" tightrope. | 0.5 d + decision | |
| 6.5 | **Sierra persona rename** | The full rename (prompt persona + any remaining "Chatbox" strings) on Sam's Student-Portal signal. | 0.25 d | Deliberately deferred by Sam; do not do piecemeal. |
| 6.6 | **Governance hygiene** | Periodic team-phrase rotation (it gates `sierra_guidance`, which steers ALL surfaces incl. the vendor's); documented deploy sign-off (Malone) — already practice, write it down. | 0.25 d recurring | |

---

## Sequencing at a glance

```
Week 1  ── Phase 1 (guardrails 1.1–1.5)  +  2.2 persona-line  +  2.3 attribution
         └─ vendor ships the IFRAME (needs nothing from these, but they cap its risk)
Week 2  ── 2.1 fail-closed decision+flip · 2.4 vendor smoke · start 3.1 corpus audit
Weeks 2–3 ─ Phase 3 content (3.1 re-point → unlocks 4.3; 3.2 exhibits sync)
Weeks 3+ ── Phase 4 graduation (4.1 native embed vendor-paced; 4.2 data façade;
            4.3 prose endpoint after 3.1)
Ongoing ── Phase 5 recommender wires (independent, incremental)
Background ─ Phase 6 (6.1/6.2 soon after Phase 1; 6.3/6.4 before declaring mature)
```

**Critical path to "vendor fully served":** 1.1 → 1.2 → 1.3 → (2.1, 2.2) →
4.1/4.2 → (3.1 → 4.3). Everything in Phase 5–6 deepens quality but does not
block the vendor.

**The three decisions only humans make** (everything else is executable as
sequenced): ① fail-closed contacts flip vs permanent fail-open (2.1, Sam);
② corpus re-point timing + what survives the audit (3.1, Sam + curation);
③ staging-slug vs shared-function-forever (6.4, Malone).

---

## Effort totals (rough)

Phases 1+2: **~5 engineering-days.** Phase 3: **~5–8 d** + curation. Phase 4
(our side): **~3–4 d.** Phases 5+6: **~12–15 d**, incremental. A dedicated
Claude session typically lands Phases 1–2 in two working sessions given the
existing deploy/smoke rails.

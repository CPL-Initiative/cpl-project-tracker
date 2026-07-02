---
title: Sierra on a vendor platform — benefits, risks, and challenges
created: 2026-07-02
updated: 2026-07-02
tags: [analysis, sierra, cpl-assistant, integration, vendor-facing, governance]
kb-status: published
obsidian-folder: cpl-project-tracker
related:
  - "[[sierra_technical_reference]]"
  - "[[sierra_integration_guide]]"
  - "[[sierra_training_tab_scope]]"
  - "[[co_platform_strategy]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
---

# Integrating Sierra on Another Site — Benefits, Risks, Challenges

> **Audience:** Sam + CPL Initiative decision-makers, and the vendor's
> technical lead. This is the decision-support companion to
> [`sierra_technical_reference.md`](sierra_technical_reference.md) (how it's
> built) and [`sierra_integration_guide.md`](sierra_integration_guide.md)
> (how to implement). Accurate as of 2026-07-02, `cpl-chat` v26.

---

## Executive summary

Integrating Sierra into a vendor-built page is **technically low-risk and
low-effort** — the architecture was explicitly designed for reuse (one shared
Edge Function, thin self-contained clients, opt-in fields that don't break
older callers; the production map.rccd.edu widget has been exactly this kind
of "external" consumer for months). The standalone `sierra/` page can be
linked or iframed **today with zero backend changes**; a native embed needs
only a one-line CORS addition plus a careful redeploy.

The real considerations are **operational and governance-level**, not
engineering-level:

1. **Cost rides on CPL's Anthropic key with no spend ceiling today.** Vendor
   traffic = CPL's bill. A daily budget breaker and a durable rate limit
   should land before (or with) any traffic-multiplying integration.
2. **One shared brain.** Every prompt change, guidance rule, and redeploy
   instantly changes behavior on the vendor's page too — and vice-versa
   applies pressure on us: their launch raises the stakes of every deploy.
3. **Content exposure widens.** The RAG corpus currently indexes ~41 docs
   from a private working vault (roughly half internal notes). This is
   already live on the public widget, but a new surface widens the audience —
   the planned re-point to the curated public knowledge base should be
   scheduled accordingly.

**Recommendation:** phase it. Link or iframe the standalone Sierra page now
(zero backend change, full functionality, minimal coupling); graduate to a
native embed after the cost/rate-limit guardrails land and traffic
expectations are agreed. Details in the implementation guide.

---

## 1. What "integration" can mean (four options at a glance)

| Option | What it is | Backend change needed | Effort (vendor) | Fidelity / control |
|---|---|---|---|---|
| **A. Link out** | Button/banner → `…/cpl-project-tracker/sierra/` (new tab) | none | ~zero | Full Sierra UX, but off-site |
| **B. Iframe embed** | `<iframe>` of the standalone Sierra page | none | hours | Full Sierra UX in-page; limited styling control |
| **C. Native embed** | Vendor UI (or an adapted first-party client) calls the `cpl-chat` API directly from their origin | **CORS origin add + redeploy (by us)** | days–weeks | Full styling/UX control; vendor owns the front end |
| **D. Server-side proxy** | Vendor backend relays to `cpl-chat`, re-streams to their client | none (works today) | days | Full control + vendor-side throttling/logging; adds latency; all traffic shares one IP rate-limit bucket unless coordinated |

All four hit the same brain, the same data, the same guardrails, and the same
logging/feedback loop.

---

## 2. Benefits

- **Reuse of a proven, in-production system.** Sierra is not a prototype: it
  already serves four surfaces including the public map.rccd.edu widget, has
  a 13-mode regression smoke battery, committed jsdom test suites, and a
  documented history of production bugs found *and fixed* (each one now a
  regression guard). The vendor gets months of hardening for free.
- **Zero AI infrastructure for the vendor.** No model keys, no RAG stack, no
  embeddings pipeline, no prompt engineering — one HTTPS endpoint. The
  reference clients are dependency-free vanilla JS they can read in an
  afternoon.
- **Live, authoritative, centrally-maintained data.** Answers draw on the
  earned-exhibit set, 128 college profiles with landing-page links (synced
  weekly), the 16k-row "what colleges teach" catalog, and live statewide KPI
  numbers. Data refreshes flow to the vendor surface with **no vendor
  release** — table-backed content is read live at query time.
- **Consistent answers across every CPL property.** One prompt, one policy
  set (never invent landing pages, never attribute statewide standards to one
  college, never claim credit is guaranteed). A student gets the same answer
  on the vendor's page as on ours — that consistency *is* the product, and a
  second bot built independently would put it at risk.
- **A live steering wheel.** The team-guidance layer lets the CPL team adjust
  Sierra's wording/behavior in minutes via a gated table — no redeploy, and
  the fix reaches the vendor surface simultaneously. Vendor-reported issues
  can often be addressed same-day.
- **A built-in improvement loop.** Every turn is logged with retrieval
  similarity; the 👍/👎 feedback RPC and the Sierra Training tab (feedback
  queue, gap miner) mean the vendor's users automatically make Sierra better
  for everyone. (The first real user feedback found and fixed a retrieval bug
  within one day.)
- **Safety discipline is already engineered.** Escape-first rendering (model
  output can never inject HTML), http(s)-only links, audience-aware voice
  (students get plain language), and the "never assert absence / never
  guarantee credit" rules are all product guarantees the vendor inherits.

---

## 3. Risks (with severity and mitigation)

| # | Risk | Severity | Notes / mitigation |
|---|---|---|---|
| 1 | **Cost exposure — no spend ceiling.** Vendor traffic bills to CPL's Anthropic key; there is no daily token/budget breaker today, and the rate limit (20/min/IP) is in-memory and porous under scale-out. A scripted flood is an open bill. | **High** | Land the durable rate limit + daily budget breaker (already the flagged pre-Portal guardrail) **before** a traffic-multiplying launch. Get a traffic estimate from the vendor; agree who pays / what happens at the cap. |
| 2 | **Shared blast radius.** One function serves the vendor page, our dashboard, and the public widget. Any redeploy, prompt change, or guidance rule changes the vendor surface instantly — no per-surface versioning, no staging tier. Conversely, a bad vendor-driven change request would ship to *our* surfaces. | **High** (likelihood low, impact broad) | Keep the deploy playbook discipline (capture-before-redeploy, explicit `verify_jwt:false`, smoke suite). Add a vendor-scenario smoke mode. Agree a change-notification channel. If the vendor needs isolation, a dedicated function fork (`cpl-chat-vendor`) is possible — at the cost of divergence and double maintenance; **not recommended** unless their requirements diverge materially. |
| 3 | **RAG content exposure.** ~41 corpus docs are indexed from a private working vault; ~half are internal drafts/strategy notes. Already reachable via the public widget, but a vendor embed widens the audience. | **Medium-high** | Complete (or schedule) the planned re-point to the curated public `cpl-knowledge-base`; or audit/prune the current corpus before launch. |
| 4 | **The endpoint is effectively public.** CORS is browser-enforced only; the anon key is public by design; anyone can script the API today regardless of the allowlist. An embed doesn't create this exposure but raises its profile. | **Medium** | Accept (the data is public-facing CPL info); the real exposure is cost → see #1. Tighten before scale: remove the `"null"` (file://) origin, switch prefix-matching to exact-origin matching. |
| 5 | **PII in logs.** Questions are logged verbatim to `chat_interactions`; end users may type personal information on the vendor's page. | **Medium** | The vendor UI must carry the same "please don't enter personal information" notice our surfaces do; agree log-retention expectations; keep the reviewer-gated SELECT posture. |
| 6 | **Answer correctness / data staleness.** The topic corpus (`chatbox_exhibits`) is an external extract with no committed refresh pipeline, known duplicate rows, and at least one missing exhibit. Two long-tail retrieval bugs have already been found in production (both fixed, both now regression-guarded). | **Medium** | Ship the feedback bar on the vendor surface (it's how the last bug was caught in a day); keep the Training-tab triage loop running; prioritize the unified-title re-point on the roadmap. |
| 7 | **No formal SLA.** Supabase Edge Functions + Anthropic + a GitHub-raw fetch; no uptime guarantee. Precedent: a pinned model id retired upstream caused a 4-day outage (since fixed by using an alias — the class of failure is now understood). | **Medium** | Vendor client must degrade gracefully (the reference clients do: friendly errors, empty-stream fallback). Agree an incident contact path. Don't promise uptime we don't control. |
| 8 | **Persona/branding mismatch.** The system prompt still self-identifies as "the CPL Chatbox … on map.rccd.edu"; the Sierra persona rename is deliberately deferred. On a vendor page the bot could misdescribe where it lives. | **Low-medium** | A one-line prompt update (or an interim guidance rule) before vendor launch; agree branding rules for the Sierra name/mark on the vendor page. |
| 9 | **Governance of the steering wheel.** Guidance rules and prompt changes steer the vendor surface too; writes are gated to the reviewer allowlist + shared team phrase. A leaked phrase would let someone steer a bot on the vendor's site. | **Low-medium** | Keep the write gate tight (rotate the team phrase periodically); guidance table is deliberately no-delete (audit trail). Never widen writes to anon. |
| 10 | **Support burden and accountability.** Vendor users' complaints about answers land on the CPL/MAP team; the vendor will field UI bugs. Ambiguity about who owns what slows both sides. | **Low** | Write down the split: CPL owns answers/data/API; vendor owns their UI/hosting/accessibility. Route answer-quality issues through the feedback bar (it lands in the Training queue automatically). |

---

## 4. Challenges (things that take work, not things that go wrong)

- **CORS + redeploy coordination (Option C only).** Adding the vendor origin
  is a one-line change, but it rides the shared-function deploy discipline —
  including the known deploy-tool footgun (`verify_jwt` silently defaulting
  to true, which once broke all callers for ~40 minutes). This is exactly why
  the playbook exists; budget a careful hour, not five minutes. Remember to
  allowlist the vendor's **staging** origin too.
- **No per-client credentials or quotas.** The API has no API-key-per-partner
  concept: server-side we can't distinguish vendor traffic except by IP or by
  convention. Mitigation is cheap and worth doing: have the vendor prefix
  their `session_id` (e.g. `vendorname-<uuid>`) so their traffic is
  attributable in `chat_interactions`.
- **SSE through vendor infrastructure.** If the vendor fronts the call with
  their own proxy/CDN (Option D, or an over-eager WAF in Option C), streaming
  responses must not be buffered — a buffering proxy turns token-by-token
  streaming into a long blank wait. Needs a checkbox in their infra review.
- **Rendering safety on their side.** If the vendor builds their own UI, they
  must reproduce the escape-first markdown discipline (escape *before*
  markdown, http(s)-only links, `rel="noopener noreferrer"`). Easiest path:
  reuse our reference renderer verbatim — it's dependency-free and
  test-covered.
- **Iframe constraints (Option B).** Fixed height (no auto-resize today — a
  postMessage resize hook could be added on request), third-party storage
  partitioning in some browsers (the audience pick may not persist across
  visits inside an iframe), and the vendor page's CSP must allow
  `frame-src https://cpl-initiative.github.io`.
- **Testing loop asymmetry.** Our dev sandbox is egress-blocked from
  Supabase, so our side tests via a GitHub Actions runner (the smoke
  battery) rather than ad-hoc curl — turnaround on joint debugging is
  minutes-to-hours, not seconds. Plan integration testing sessions
  accordingly.
- **Accessibility ownership.** Our surfaces carry a11y affordances
  (aria roles, reduced-motion support); in a native embed the vendor owns
  WCAG compliance for their UI. Should be named in the agreement — CCC-adjacent
  public surfaces are held to WCAG 2.1 AA.

---

## 5. Preconditions checklist (before a native embed goes live)

Ordered; the first three are the ones that matter.

1. ☐ **Cost guardrail:** daily token/spend breaker on the function (friendly
   503 + alert at the cap) — the flagged "Malone guardrail."
2. ☐ **Durable rate limit:** move the 20/min/IP counter to Postgres/KV (or
   front with a WAF) so it survives cold starts and scale-out.
3. ☐ **Traffic + cost agreement with the vendor:** expected volume, what
   happens at the cap, who is notified.
4. ☐ **CORS hygiene:** add vendor prod + staging origins; remove `"null"`;
   switch prefix-match to exact-match.
5. ☐ **Content audit or KB re-point:** resolve the private-vault RAG corpus
   question (re-point to the public knowledge base, or prune).
6. ☐ **Persona line fix:** stop self-identifying as "on map.rccd.edu"
   (one-line prompt change or guidance rule).
7. ☐ **Vendor smoke mode:** add the vendor's top user scenario to
   `smoke_test.sh` so their use case is regression-guarded on every deploy.
8. ☐ **PII notice + session_id prefix convention** on the vendor UI.
9. ☐ **Change-notification channel** (we ping them before redeploys that
   change behavior; they ping us before launches that change traffic).

For Option A (link) and Option B (iframe), only items 3, 5 (advisable), and
9 apply — which is precisely why phasing through them first is attractive.

---

## 6. Decision points for Sam

1. **Which option, which order?** Recommended: B (iframe) now → C (native)
   later if the vendor needs deeper UX integration. A (link) is the free
   fallback either way.
2. **Shared function vs a dedicated fork for the vendor?** Recommended:
   shared (consistency + one steering wheel + one improvement loop). Fork
   only if their requirements diverge (different persona, different corpus,
   different rate/cost envelope).
3. **Branding on the vendor page:** does it present as *Sierra* (name + mark
   + "CPL Sherpa" framing), or white-labeled? Affects the persona-line fix
   and the mark's usage rules. (Note the Student Portal is slated to have its
   own bot with Sierra as benchmark — worth keeping the vendor story
   consistent with that plan.)
4. **Audience default:** if the vendor platform serves a known population
   (e.g. students), should their integration pin `audience:'student'`? Big
   answer-quality win; one line of code for them.
5. **Cost arrangement:** absorb vendor traffic on the CPL key, meter it (via
   the session-id convention + `response_tokens` logging), or require them to
   proxy with their own controls (Option D)?

---

## 7. Bottom line

Sierra was built to be embedded — self-contained clients, opt-in API fields,
a shared brain that already serves an external production widget. The
engineering risk of putting it on a vendor page is genuinely small, and the
fastest path (link/iframe of the standalone page) requires no backend change
at all. The things to take seriously are the **operating agreements**: cost
ceilings, change control on a shared function, content provenance for the
RAG corpus, and clear ownership of user-facing issues. Land the short
preconditions list above and this is a low-drama integration with a high
payoff: one consistent, continuously-improving CPL brain everywhere students
encounter the program.

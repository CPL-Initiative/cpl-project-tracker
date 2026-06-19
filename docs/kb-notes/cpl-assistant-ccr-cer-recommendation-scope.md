---
title: CPL Assistant — CCR/CER-grounded recommendations, real-time benchmark & landing-site demand signal
date: 2026-06-19
kb-status: published
type: scope
tags: [cpl-assistant, chatbot, ccr, cer, eacr, adoption-leverage, demand-signal, student-portal, supabase]
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts   # the shared Edge Function (this bot + map.rccd.edu widget)
  - unified_courses_data.js                          # CCR — course identity + local↔unified crosswalk
  - credential_reference_data.js                     # CER — unified credential + issuing agency
  - statewide_prescriptive.js                        # adoption engine (window.CPL_STATEWIDE_PRESCRIPTIVE)
  - kb/coci_articulations.json                       # adoption_leverage (the "should-articulate" lists)
  - fetch_custom_report.py                           # daily pull of the richer MAP Custom Reports (9 cat / 151 fields)
related:
  - docs/kb-notes/cpl-chatbox-integration-scope.md
  - docs/kb-notes/eacr-consolidation-scope.md
  - docs/kb-notes/adr-funding-priority-metrics-privacy.md
---

# CPL Assistant — CCR/CER-grounded recommendations, benchmark & landing-site demand signal

**Status: SCOPE / kickoff (2026-06-19, Bruh Startripper). Decisions locked with Sam in-session; build not yet started.**

## Why

The **MAP Student CPL Portal** (imminent) is where prospective students will run
inquiries and assemble portfolio docs for CPL requests — it has its **own** AI bot.
This dashboard's **CPL Assistant** (the `cpl-chat` Edge Function, shared with the
public `map.rccd.edu` widget) is **not** the student-facing destination. Its role is
sharpened to two things:

1. **A real-time-data benchmark** — a yardstick the portal's bot is measured against,
   so the portal ships the *best* recommendations grounded in live data.
2. **The CCR/CER-grounded recommendation reference** — the place where a student
   request resolves end-to-end into *"here's the credential, here's where it's
   articulated, here's the local course, and here's the adoption path for your
   college,"* so **adoptions across the system get simpler and more intuitive.**

The data to do this **already exists in the project**; the work is mostly *plumbing
it into the conversational surface*, not new analysis.

## Current state (what the bot retrieves today)

`cpl-chat` runs 4 parallel lookups: pgvector RAG over `cpl_documents` (prose), college
detection → `chatbox_college_profiles`, a topic search → `chatbox_exhibits` (~2,397
rows ≈ the EACR card set), and a live `live_metrics.json` fetch. It does **not** see:

- the **CCR course-identity crosswalk** (which local course == which unified C-ID/CCN/M-ID),
- the **CER credential layer** (unified credential + issuing/training agency),
- the **adoption-leverage / prescriptive layer** (per credential: which colleges *could*
  adopt + the likely local course they already teach).

Those live in the dashboard's generated artifacts (`unified_courses_*.js`,
`credential_reference_data.js`, `statewide_prescriptive.js`, `kb/coci_articulations.json`)
and `kb_curation` — **nowhere the bot can reach.**

## Opportunity — the richer MAP Custom Reports feed (Sam, 2026-06-19)

The dashboard's real-time numbers come from **two** MAP sources, not one:

- the public **MAP CPL dashboard** potential-savings API → `live_metrics.json` (the 6
  headline KPIs — thin), and
- the **MAP Custom Reports** module, pulled daily by `fetch_custom_report.py` → the
  transient `CustomReport_latest.json` (**9 categories / 151 fields — much richer**;
  today it feeds the dashboard + `cpl_funding_performance.js`, **not** the bot).

This is the assistant's real edge as a benchmark — it can ground recommendations in
Custom Reports detail (per-college CPL detail, eligibility, discipline breakdowns,
**College Contacts**) that a bot working off the public dashboard alone can't see. Two
concrete wires:

- **Richer M1 recommendations** — per-college eligibility / detail beyond the 6 KPIs.
- **Contacts → routing (M3).** The **College Contacts** category (long-pending
  *fetched-but-unused*) names each college's CPL coordinator — exactly the routing
  target for the landing-site demand view (*"students are asking FCC for X → here's
  Diane"*). Today the bot only has the coarse `contacts` field on
  `chatbox_college_profiles`.

**Privacy caveat (important):** Custom Reports is richer **and more sensitive** — it
includes College Contacts and **Users & Roles**, and potentially student-grain
eligibility detail. Wiring it requires a **field-level classification** —
*public-safe* (the student bot may cite) / *coordinator-only* (gated landing-site) /
*off-limits* (never surfaced) — with no student-grain PII reaching the public bot or
any aggregate coordinator view. Fold into the D4 privacy ADR.

## Locked decisions (Sam, 2026-06-19)

- **D1 — Role.** This assistant = benchmark + CCR/CER reference recommender. The
  portal (its own bot) is the student destination. Not re-pointing this one to be the
  public student face.
- **D2 — Coordinator demand view lives on the college CPL Landing Sites.** Every
  college already has a customizable CPL Landing Site; the per-college "what are
  students asking us for" view is surfaced *there* (college-scoped), not as a new
  gated dashboard tab. The function already carries each college's `landing_page_url`.
- **D3 — One shared source of truth = Supabase.** CCR/CER/adoption reference data is
  landed into **shared Supabase tables** (a daily ETL from the existing generated
  artifacts), so the portal bot, this bot, *and* the landing-site demand views all read
  from one source and stay in sync. (Chosen over per-request GitHub-raw fetches of the
  large artifacts.)
- **D4 — Privacy: aggregate-only.** Coordinator-visible demand is aggregate counts per
  (college, credential, recency) with small-cell suppression (reuse the ratified
  `adr-funding-priority-metrics-privacy.md` pattern). **Never** raw question text or any
  student PII in a coordinator surface. A short ADR precedes M3 capture going live.
- **D5 — Corpus hygiene folded into M1.** The 41 RAG docs in `cpl_documents` are indexed
  from the private CPLBrain vault; ~half are internal (drafts, strategy frameworks, a
  college-specific update, design notes) and are already reachable via the public
  `map.rccd.edu` widget. Re-point to public-safe content (public `cpl-knowledge-base` +
  the vetted public subset) as part of M1.

## The three moves

### M1 · Ground recommendations in CCR/CER (the keystone)

Wire credential (CER) + course-identity (CCR) + adoption-leverage into the bot's
retrieval so a request resolves end-to-end:

```
student query
  → detect credential (CER)  + college  + topic
  → credential articulated WHERE? (EACR / coci_articulations)
  → the unified course it maps to (CCR)  + each college's local course
  → asking college:
       • ARTICULATED  → "yes — at <college>, via <local course> (<units>)"
       • UNMET        → adoption recommendation from statewide_prescriptive /
                        adoption_leverage: "<college> already teaches <local course>,
                        which maps to <CCR course>; this credential is articulated at
                        <N> peer colleges → here's the adoption path"
  → stamp (college, credential, unmet?, adoption_target) onto the demand log
```

One wiring delivers **both** "best real-time recommendations" **and** "simpler
adoptions." Also do the D5 corpus cleanup here.

### M2 · Stand up the benchmark / comparison

A fixed battery of representative student inquiries — general, college-specific,
topic, **real-time-sensitive**, and **unmet** cases — run through both this bot and the
portal's, scored on a rubric (accuracy, real-time correctness, actionable next step,
no over-promising). The empty **`chat_analysis`** table is the substrate.
**BLOCKED on portal-bot access** (see open items).

### M3 · Close the loop to adoptions

The CCR/CER-keyed demand stamp from M1 → per-college aggregation (small-cell
suppressed) → a **"students are asking us for…"** panel on each college's CPL Landing
Site, framed as *opportunity* (same tone rule as the college reports — never "you're
behind"). Each row pairs demand with the concrete adoption target:
*"students want **[credential]** → adopt **[credential → course articulation]**."*

## Build sequence

1. **ETL** — land a slim, recommendation-shaped CCR/CER/adoption dataset into shared
   Supabase tables; extend the daily cron (precedent: `_apply_curation.py` sync,
   `supabase-rekey.yml`). *No live bot change yet.*
2. **M1 wiring** — add the CCR/CER/adoption lookups to `cpl-chat`'s parallel retrieval
   + recommendation synthesis, and re-point the RAG corpus (D5). **Careful redeploy of
   the shared function** (capture the running version first; smoke-test all 4 modes +
   the widget — §7c invariants).
3. **M3 capture** — the demand stamp into `chat_analysis` (or a purpose-built
   `cpl_demand_signals` table). Privacy ADR (D4) lands first.
4. **M3 view** — the landing-site demand panel (aggregate, suppressed).
5. **M2 harness** — once portal-bot access exists.

## Open items / decisions still needed

- **Portal bot** — stack (same `cpl-chat` or separate?) and how to call/observe its
  outputs, so M2 is a real comparison. *(Gates M2 only.)*
- **Landing-site integration mechanics** — how a demand panel embeds in the
  college-customizable CPL Landing Site (iframe? a data feed the site renders? a
  per-college JSON the site fetches?).
- **Corpus policy final** — public `cpl-knowledge-base` only, or public-KB **+** a
  vetted subset of the current docs (I'll propose the keep/drop list).
- **Custom Reports field classification** — which of the 9 categories / 151 fields are
  public-safe vs coordinator-only vs off-limits (resolves the long-pending College
  Contacts + Users & Roles "drop-or-wire" question, now with a concrete use: contacts
  → coordinator routing).
- **Demand table shape** — reuse the empty `chat_analysis` or define
  `cpl_demand_signals` (leaning new table — keeps the raw log separate from the derived,
  coordinator-readable signal, simpler RLS).

## Guardrails to honor

- `cpl-chat` is **SHARED + LIVE** (the production `map.rccd.edu` widget calls it). Any
  redeploy follows §7c: capture the running version, `verify_jwt` stays `false`,
  smoke-test all 4 modes after.
- Coordinator surfaces are **aggregate-only, PII-free, small-cell-suppressed** (D4).
- Recommendations **never guarantee credit** — always route the student to the college
  to actually request review.

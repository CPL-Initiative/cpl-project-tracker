---
title: COBI → CO Platform — Long-Term Strategy & Plan of Attack
created: 2026-06-28
updated: 2026-06-28
author: Session 83 (Bruh StarNova) — drafted for Sam + Malone (Director of Technology)
status: DRAFT FOR REVIEW — this is INPUT for Sam + Malone, not a decision
tags: [strategy, roadmap, governance, accounts-migration, knowledge-architecture, accessibility, security, humans-principles, scaling, co-platform]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/reference-humans-principles]]"
  - "[[docs/kb-notes/reference-codebase-audit-2026-06-01]]"
  - "[[docs/kb-notes/reference-daily-dashboard-data-pipeline]]"
  - "[[docs/session_83_handoff]]"
---

# COBI → a Governed, Team-Scalable CO Platform — Plan of Attack

> **What this is.** Sam asked for "a basic plan of attack" to move COBI + the CPL
> knowledge base into a long-term, team-based structure (with Director of Tech
> Malone), positioned to scale to the whole Chancellor's Office — and explicitly
> asked for pushback. This document is the answer: an operating model, a phased
> roadmap, a first-90-days checklist, the decisions only humans can make, a candid
> pushback section, and a scorecard mapping every one of Sam's asks to a
> recommendation, a first step, and a horizon.
>
> **How it was produced.** A 12-agent research-and-synthesis workflow:
> five parallel web-research threads (Anthropic enterprise/edu/gov tiers; GitHub /
> Supabase / Cloudflare / Obsidian; CA public-sector accessibility law; CCC data
> governance + sanctioned data paths; architecture & integration patterns) →
> six design sections → one integrated synthesis. Current-account facts were
> verified live against GitHub + Supabase, not assumed.
>
> **Read this as a draft for you + Malone to mark up — not "the plan."** That is
> itself the core governance principle in action: *AI proposes; a named human
> disposes* (HUMANS principle 1).
>
> ⚠️ **Confirm before relying on external facts.** Vendor pricing, plan tiers, and
> the legal/compliance deadlines below are accurate to mid-2026 to the best of the
> research, but each is flagged for confirmation with counsel / procurement /
> the vendor. Treat dollar figures and legal deadlines as "verify," not "decided."

> **✅ STATUS UPDATE (2026-06-29) — the "Priority Zero" PII item below is RESOLVED.**
> After this doc was drafted, the student-PII exposure was confirmed remediated.
> The raw `CustomReport_latest.json` is gitignored and absent from the working tree
> (forward-stop), and the git history was **deliberately rewritten with the old
> branches deleted** (confirmed by Sam). Live verification on `main` (2026-06-29):
> the file is **not referenced anywhere in `main`'s commit history**, 404s at `main`,
> and the repo has **0 forks** (so no fork network retains old blobs). Residual risk
> is now low and self-resolving (GitHub garbage-collects unreachable blobs; an
> optional one-line note to GitHub Support force-expires any cached view). **The
> remaining work is preventive, not remedial:** keep the forward-stop as a *required
> CI guard* so it can never recur (it's a NOW task in Mission Control). Read the
> "Priority Zero / OPEN incident" language below as *the guardrail that keeps this
> closed*, not as an open breach.

---

## 0. Table of contents

1. [TL;DR — the thesis and the three things that must happen first](#1-tldr)
2. [Current state, verified](#2-current-state-verified)
3. [The operating model — team + AI + governance](#3-operating-model)
4. [Phased roadmap — Now / Next / Later (+ a parallel procurement track)](#4-phased-roadmap)
5. [First 90 days — concrete checklist](#5-first-90-days)
6. [Knowledge architecture — the CO KB with "knowledge lanes"](#6-knowledge-architecture)
7. [Accounts & platform migration — personal → institution-owned](#7-accounts-migration)
8. [Integration & API — de-scrape, two-way MAP/WordPress, harden the AI surface](#8-integration-api)
9. [Governance, security, accessibility & HUMANS-by-design](#9-governance)
10. [Decisions only you / Malone / the CO can make](#10-decisions)
11. [Candid pushback, force-ranked focus, what to defer](#11-pushback)
12. [Anything else you should want (the gaps in the ask)](#12-gaps)
13. [Scorecard — your ~14 asks → approach → first step → horizon](#13-scorecard)

---

<a id="1-tldr"></a>
## 1. TL;DR — the thesis and the three things that must happen first

**The thesis.** COBI works *extraordinarily well* — and it works because one person
(Sam) drives an AI engineering capability (Claude Code) that builds, tests, and
documents nearly everything. That is a genuine, rare asset. The goal of this plan
is to **keep that velocity while removing the three things that make it
un-scalable**: a single point of *human* failure, a single point of *account*
ownership, and an *open* student-data-privacy incident. You do **not** need a
rewrite or a big reorg. You need to do the unglamorous governance work first,
insert a few precisely-placed human-accountability gates, and let the AI keep
building everywhere it already does.

**The three things that MUST happen first — and most are NOT engineering:**

1. **Close the student-PII incident. ✅ RESOLVED — verified clean on `main`, 2026-06-29 (see the status note up top); the steps below are now the *guardrail that keeps it closed*, not open remediation.** First+last names on
   ~48,419 rows, StudentIDs on ~30k, and **BirthDates on 22,791** were committed to the
   *public* GitHub git history and are re-cloned by anyone who clones the repo. The
   forward-stop (gitignore + `rm --cached` + stopping the fetch, PR #227) is real
   but does **not** close it. Two parallel tracks: **(a)** a Cal. Civ. Code §1798.29
   breach-notifiability assessment with RCCD/CCCCO counsel **now** (you are far over
   the 500-resident AG threshold — plan as if notifiable), and **(b)** the
   coordinated `git filter-repo` history purge (the one sanctioned Rule-5
   `main`-rewrite) **before** Malone or any CO user clones — otherwise scaling the
   team *institutionalizes* the breach.

2. **De-personalize ownership of the stack (the bus factor).** Today the entire
   platform is owned by individuals, not the institution: the Cloudflare Worker +
   the runtime `ANTHROPIC_API_KEY` live on Sam's *personal* Cloudflare account;
   `CPLBrain` is a *personal* GitHub repo; the Supabase org (`LiveOak`) is
   personally tied. Transfer each to an **institution-owned identity** (a *role
   mailbox*, not a person). Ownership transfer is fast and self-serve; it is
   *decoupled* from the slow plan-tier procurement, so this de-risks now without
   waiting on a purchase order.

3. **Make Malone able to actually own the codebase.** A 15,500-line HTML monolith +
   an 11,000-line string-surgery generator + ~51 JS modules + auth reimplemented
   ~8–12× means a new Director of Tech can *watch* but not *own*. The cheap
   precondition: consolidate the drifted auth into one `cobi-auth.js`, evict the
   ~180 MB of daily-committed generated artifacts from git, and stand up real
   environments (Cloudflare Pages PR previews). Re-architecture (phased) is then a
   *background lane*, not a someday-item.

**The operating-model shift.** Sam stops being the engineer-of-record. Engineering
and infra accountability move to **Malone**; Claude Code becomes a capability
Malone *supervises*, not a peer that self-approves. The brilliant auto-merge-on-green
culture **stays for ~80% of work** (docs, UI, generators, tests) and **tightens to
required human review for the ~20% that is irreversible or sensitive** (schema/RLS/
auth, M-ID re-mints, PII-touching code, the shared `cpl-chat` Edge Function, the
daily-cron workflow, public-KB publishing). That is HUMANS principle 1 written into
branch protection, not left as a vibe.

**The honest framing.** This is ~14 ambitions and a team of two (one not yet
started). Pursued all at once, you do all of them badly. **Force it down to ~5
active lanes:** governance/PII · ownership transfer · auth consolidation ·
sanctioned-data paperwork · the accessibility CI gate. Everything labeled "serve
the whole CO" is the *destination* and is gated on a **named executive sponsor**, an
**ownership decision (RCCD vs CCCCO)**, and a **written charter** — none of which
exist yet. Build for the lanes that have signed up; secure the mandate before
building for divisions that haven't asked. And treat "build APIs not scraping"
honestly: it is **~80% a data-sharing agreement (~6 months) and ~20% code** — an API
over data you have no agreement to consume is just scraping with better manners.

---

<a id="2-current-state-verified"></a>
## 2. Current state, verified

Checked live against the accounts, not assumed:

| Service | Reality today | Why it matters |
|---|---|---|
| **GitHub** | Authenticated owner is the **personal** account `samueltlee`. The `CPL-Initiative` org exists but has **zero teams defined**. `CPLBrain` lives on the personal account. No SSO/SCIM/audit. | No institutional ownership; no team structure for Malone to join; institutional memory partly on a personal repo. |
| **Supabase** | Org **`LiveOak`** on the **Pro** plan (not Team/Enterprise; not institution-named), holding **two** projects: `Work Plan` (main COBI DB) + `cpl-budget-support`. Both `us-west-1` (US region — good). | Personally-tied org; **two** projects to move, not one; no dashboard SSO/audit/PITR. |
| **Cloudflare** | Worker `cpl-proxy` on Sam's **personal** account `slee-548`, holding the runtime `ANTHROPIC_API_KEY` + `SCRAPE_SECRET`. | The single biggest runtime exposure sits on a personal account + key. |
| **Anthropic** | Claude Code dev appears to run on a personal subscription; runtime API uses the personal key above. Commercial-vs-consumer terms **unverified**. | Possible training-on-data + no DPA until confirmed; dev and runtime spend are not separated or capped. |
| **Auth** | Supabase magic-link gated by an `allowed_reviewers` email allowlist; writes gated by `is_allowed_reviewer()` RLS. No SSO/RBAC. | Fine for a handful of curators; nowhere near user-level access at CO scale. |
| **Data path** | Daily KPIs **scraped** from the CCCCO Azure dashboard via the Worker; other sources via "runner-as-proxy" GitHub Actions (the agent sandbox is egress-blocked). | Fragile *and* not a sanctioned data path — the real fix is an agreement, not code. |
| **Knowledge** | Three lanes: PUBLIC `cpl-knowledge-base` (CC BY, human-gated curation only) · INTERNAL `docs/kb-notes` (auto-synced, no gate) · PERSONAL `CPLBrain` (personal Obsidian vault). | Strong design already; the personal-account dependency is the liability. |

**The throughline:** the platform is owned by *individuals*, runs an *open* PII
incident, and is *operable only by Sam + Claude*. Those three facts — not ambition —
are what gate scaling.

---

<a id="3-operating-model"></a>
## 3. The operating model — team + AI + governance

### The core shift
Sam holds ~6 roles today (product, engineer-of-record, security officer, data
steward, curator, CO liaison). The model **splits these and consciously sheds
engineering/infra accountability to Malone** so the platform survives Sam taking
two weeks off — which today it cannot. Claude Code stays the primary builder; what
changes is *who is accountable* and *where a second human signs off*.

### Roles

| Role | Who | Accountable for | Does NOT own |
|---|---|---|---|
| **Product / Strategy Owner** | Sam (`map@rccd.edu`) | Roadmap priority, CO narrative, what ships & why, final sign-off on architecturally-significant merges | Day-to-day infra; the merge button on routine PRs |
| **Director of Technology** | Malone | Infra ownership transfer, environments/CI, **human review of AI PRs on gated paths**, secrets custody, on-call/runbooks, security posture, the PII-purge as change-controlled work | Product priority; curation judgment calls |
| **AI Engineering Capability** | Claude Code sessions | Implementation, tests, generators, checkpoint/handoff/lessons docs, **proposing** strategy/scope (dry-runs, ADRs) | **Approving** anything on a gated path; merging schema/auth/PII/re-mint PRs without a human gate |
| **Faculty / Curator Reviewers** | `allowed_reviewers` cohort | Discipline assignments, Suggested-merges, TMC/CER/EACR curation — the human judgment the auditor can't make | Engineering/infra; the public-KB sensitivity gate |
| **Future hires** | TBD | A 2nd engineer; a **named accessibility owner**; a data-governance/privacy analyst | Anything until onboarded via the handoff docs + an RLS role grant |
| **CO Executive Sponsor** | A division head (must be named) | DSA/MOU sponsorship, the RCCD-vs-CCCCO ownership decision, the public-KB sensitivity gate, the breach-notification call (with counsel), budget for org accounts | Implementation; daily cadence |

### RACI sketch
`R` = does · `A` = single human sign-off · `C` = consulted · `I` = informed.
**Claude Code is `R` almost everywhere and `A` nowhere — that is principle 1 made structural.**

| Surface | Claude | Malone | Sam | Reviewers | CO Sponsor |
|---|---|---|---|---|---|
| Daily pipeline (`daily-dashboard.yml`) | R | **A** | C | I | I |
| Supabase schema / RLS / auth | R (proposes) | **A** | C | C | I |
| KB — internal (`docs/kb-notes`) | R | C | **A** | I | I |
| KB — public (`cpl-knowledge-base`) | R (draft PR) | C | C | C | **A** |
| Public frontend | R | **A** | C | I | I |
| `cpl-chat` Edge Function (shared prod) | R (proposes) | **A** | C | I | I |
| M-ID re-mint *apply* dispatch | R (dry-run) | **A** | C | C | I |
| Security / PII purge / DSA | R (scans, drafts) | R | C | I | **A** (+ counsel) |
| Roadmap priority | C | C | **A** | C | I |

### Where human sign-off is MANDATORY (enforce in tooling: `CODEOWNERS` + "require 1 approving review")
1. Any Supabase **schema / RLS / auth** change (`is_allowed_reviewer()`, `*.sql`, magic-link config) → **Malone**.
2. Any **`cpl-chat` redeploy** → **Malone** (it is live on the production map.rccd.edu widget; the smoke test is the automated half, the human is the accountable half).
3. Any **M-ID re-mint apply dispatch** → **Malone** (irreversible at scale; the apply is human-triggered, never unattended cron).
4. Any **publish into the public KB** → **CO Sponsor / curator** (the draft-PR review *is* the FERPA/sensitivity audit; never a checkpoint side-effect).
5. The **PII history purge + breach-notification decision** → **CO Sponsor + counsel** (a legal call, not engineering).
6. Any change that **fetches/commits/ships a student-PII column** → blocked by a required CI guard; re-enabling needs Sponsor + counsel + a DSA.
7. **Roadmap priority / what ships to the CO** → **Sam**.

Everywhere else, **auto-merge-on-green stands.** The art is that the gates are *few
and precisely placed* — accountability is unambiguous, velocity is untouched on the
80% that doesn't need a human.

### "AI proposes, a named human disposes" — operationalized (this is the answer to ask #11)
- Every AI *strategy* output (roadmaps, re-mint plans, schema changes) lands as a
  **draft PR/doc with a named human approver + captured rationale** in the PR body.
  That rationale is *also* your audit trail when the CO asks "who decided this and
  why" — which they will.
- A **human-owned decision log / lightweight ADR process**, distinct from the
  auto-flowing kb-notes. Principle 2 (transparency) is not satisfied by "the AI
  wrote it down."
- AI surfaces (`cpl-chat`/Sierra, the report-gens, the RACI "✨ write it up") emit a
  visible **"AI-drafted — model `<id>`, reviewed by `<human>`"** label and log the
  model version. Pin **unversioned model aliases**, never dated snapshots.

### Governance cadence (lightweight — a small team, not a PMO)
- **Async daily:** the `kb/cpl_todos.json` feed *is* the standup; Malone reads it + open PRs each morning (the "always watch PRs" discipline).
- **Weekly (Sam + Malone, 30 min):** reconcile the §11 roadmap vs what shipped; pick the week's lane; clear CODEOWNERS-gated PRs awaiting sign-off; confirm on-call.
- **CO steering (monthly/quarterly, Sponsor-led):** Vision 2030 alignment, DSA/MOU progress, vendor/security posture (principle 6), accessibility conformance + the 2027 deadline, budget for the account transitions.

---

<a id="4-phased-roadmap"></a>
## 4. Phased roadmap — Now / Next / Later

> **Design rule:** ownership transfer (fast, self-serve) is **decoupled** from plan
> upgrade (slow, procurement). Move resources to institution-owned *free/lowest*
> accounts now; upgrade the tier on that already-institutional account when
> procurement clears. **A parallel procurement track runs alongside all three
> phases so feature/governance work never stalls on a PO.**

### NOW (0–90 days) — Govern + de-risk. Mostly NOT engineering.
- **Governance/PII:** §1798.29 notifiability assessment with counsel (parallel, not blocked by the purge); coordinated `git filter-repo` history purge → force-push `main` → all sessions re-clone; **rotate** `ANTHROPIC_API_KEY` + `SCRAPE_SECRET` (any key ever in history is compromised); ask GitHub to expire caches + audit forks.
- **Accounts (ownership half):** create the institutional **role-mailbox owner identity** (the dependency under everything); org Cloudflare account + redeploy the Worker via Wrangler with fresh org secrets; transfer **both** Supabase projects out of personal `LiveOak` (decouple Supabase login from the personal GitHub identity *first*); move CPLBrain's *institutional* content into an org repo; org-owned Anthropic org + a capped `cobi-runtime` Workspace key swapped onto the Worker + `cpl-chat`.
- **CI gates:** required blocking **PII-column-schema guard** (alongside TruffleHog) + org **secret scanning / push protection**; a **required accessibility check** (`a11y.yml`: axe-core/Playwright + pa11y) with an axe **baseline** so it fails only NEW violations; promote `check_contrast.py --live` to a required gate; gate the **daily cron** ("violations → no publish").
- **Architecture (cheap structural wins):** consolidate auth into one `cobi-auth.js`; **evict ~180 MB generated artifacts** from the daily `git add`; stand up Cloudflare Pages staging + PR previews; decouple the data cron from prod-HTML deploys.
- **Integration:** author the **internal DSA** (FERPA school-official framing — start now, it's the long pole) + a one-page KPI→source lineage table (which KPIs are already public/aggregate via Data Mart / DataVista).
- **Operating model:** `CODEOWNERS` + required-review on the gated ~20%; a `docs/ONBOARDING.md` for a human engineer.
- **GATE to Next:** PII history purged + counsel ruling documented; stack institution-owned + secrets rotated; required PII + a11y CI checks green; `cobi-auth.js` shipped. *Do not onboard CO users or start divisional lanes until these are done.*

### NEXT (3–9 months) — Lay the foundation everything CO-scale needs.
- **Accounts (plan upgrades, via procurement):** Claude **Team Premium** seats for Sam + Malone (the bridge) → start the **Enterprise** conversation; **GitHub Enterprise Cloud** (SSO/SCIM/audit are Enterprise-only) with `cpl-project-tracker` transferred in, EMU via *commercial* Entra; **Supabase Team** (~$599/mo) + **PITR** (skip the HIPAA add-on — FERPA ≠ PHI), US region pinned.
- **Auth:** Entra **SSO alongside magic-link**; migrate the tiny reviewer cohort **by verified email**; begin replacing binary `is_allowed_reviewer()` with **role/attribute-driven RLS** (Entra app-role + group claims).
- **Integration:** retire `potential-savings` scraping to **Data Mart / DataVista** where possible; get the Entra service-credential + egress allowlist for the MAP API, move runner tokens to org Actions secrets; confirm **aggregate-only payloads** (no student fields).
- **Architecture:** **Astro islands** migration begins (most-edited tabs first); `excel_to_dashboard.py` becomes a **JSON data producer** (which deletes the whole idempotency-cruft bug class).
- **AI safety (MISSING from the ask list — table stakes):** self-hosted **Langfuse** observability; a **regression eval suite** for `cpl-chat`'s 4 modes; a **PII-output guardrail**; runtime spend capped + separate from dev seats.
- **Accessibility:** a shared **accessible component library** (ARIA APG) for the ~40 tabs; per-module `jest-axe` assertions; non-drag alternatives (SC 2.5.7) for the KPI/Fact-Sheet drag-reorder; 24×24 targets (2.5.8); **tagged-PDF** exports; produce a **VPAT 2.5 ACR**.
- **Governance:** the 4-tier data-classification + a living data-inventory register; RLS hardening (Security Advisors, column-level privileges, publishable/secret-key model); raise small-cell suppression `<5` → `<10` with complementary suppression; the vendor/DPA register (principle 6).
- **GATE to Later:** GHEC + Supabase Team live with SSO/audit; ABAC RLS in place for reviewers; a sanctioned aggregate-KPI path replacing the scrape for non-student data; Langfuse + eval suite running; **a named executive sponsor + a written charter** for the CO mandate.

### LATER (9–18 months) — Scale-out. Gated on Next + a CO mandate.
- **API-first + WordPress:** versioned `api_v1_*` read views behind a Cloudflare gateway (rate-limit/keys at the edge); WP REST **two-way** (replace the `/cplstories/` Chromium scrape with a JSON pull; COBI→WP push via Edge Function/webhook, killing the stale `mapfyCollegeUrls` blob); Entra as the **shared IdP** for WP + COBI.
- **Knowledge lanes:** `lane` as a first-class **RLS + frontmatter dimension** (NOT a repo-per-lane); one INTERNAL `co-knowledge` repo + one PUBLIC repo with per-lane directories + CODEOWNERS + per-lane curation manifests; new `/intake`, `/promote` (draft-PR-only), `/lane-digest` procedures; permissioned *organizational* knowledge on **M365/SharePoint** (Entra SSO + audit, already procured) — **demote Obsidian to personal**.
- **CO KB + Sierra:** lane-aware RAG ingestion (PUBLIC + access-gated INTERNAL, **never** personal CPLBrain); the Sierra student portal federating to **OpenCCC/CCCID** (not a parallel login).
- **MAP promotion:** promote the first proven view (**TMC Builder** is the clearest candidate) into MAP over a **versioned API contract + a promotion ADR** — a contract, not a copy-paste handoff.
- **GATE:** each prior gate held; the ownership decision (RCCD→CCCCO if applicable) executed as a *second* transfer, not a rebuild; the state security framework (StateRAMP / Cal-Secure) confirmed (likely no FedRAMP / Bedrock-GovCloud needed).

### PARALLEL PROCUREMENT TRACK (start Day 1, lands across Next/Later)
Open the Enterprise/Team conversations *immediately* (they take 3–9+ months) and
request **DPA + VPAT + SOC 2** from each vendor in the first email. Confirm an
accepted **contract vehicle** (CMAS/NASPO/sole-source, or RCCD's existing
agreements) per vendor *before* depending on a paid tier. Budget on **gov pricing**,
not the nonprofit/edu free tiers (a community-college district is generally not a
501(c)(3)). The CCCCO restricted-data **MOU (Research@CCCCO.edu) takes ~6 months** —
start it the day you decide you need any student-level data.

---

<a id="5-first-90-days"></a>
## 5. First 90 days — concrete checklist

Owner-hints: **Sam** (product/authorizes) · **Malone** (Dir Tech/executes) ·
**Claude** (AI sessions) · **CO** (sponsor/counsel). Items 1–8 are fast-track (no
procurement) and retire the top risks.

### Weeks 1–2 — Priority Zero + the owner identity
- [ ] **(CO + counsel)** Convene the **§1798.29 breach-notifiability assessment** — RCCD/CCCCO counsel + the CCC Information Security Center + RCCD's records/privacy officer. With ~30k StudentIDs + 22,791 DOBs you are over the 500-resident AG threshold → plan as notifiable; **document the decision either way** (store privately, never the public KB).
- [ ] **(Sam + RCCD IT)** Create the **institutional owner identity** — a role mailbox (e.g. `cobi-admin@rccd.edu`) + a shared vault entry. *This is the dependency under the GitHub/Supabase/Cloudflare moves.*
- [ ] **(Malone)** Turn on **GitHub org secret scanning + push protection** (buyable even on Team; ~1 active committer = cheap).

### Weeks 2–4 — The purge + de-personalization
- [ ] **(Sam authorizes; Claude/Malone execute)** **PII history purge** (the Rule-5-sanctioned rewrite): pause ALL writing crons (`daily-dashboard`, `cpl-news`, `cpl-landing-pages`, `cpl-stories`, `first-light-art`); mirror-backup to org cold storage; enumerate tainted paths (TruffleHog + PII-schema scan over full history); `git filter-repo --invert-paths`; **force-push `main`**; **every session/clone re-clones, never merges old history back**; ask GitHub Support to expire caches; audit forks.
- [ ] **(Malone)** **Rotate** `SCRAPE_SECRET` + `ANTHROPIC_API_KEY` onto **org-owned** keys.
- [ ] **(Sam/Malone)** Decouple **Supabase login from the personal GitHub identity** (do this BEFORE any GitHub personal-account change — documented lockout risk); transfer **both** projects (`Work Plan` + `cpl-budget-support`) to the institutional org Owner; verify both stay in a **US region**.
- [ ] **(Malone)** Create the org **Cloudflare** account; redeploy the Worker via Wrangler with fresh org secrets; schedule the route flip **outside** the 06:17/09:17/12:17 UTC cron windows; retire the personal `slee-548` Worker.
- [ ] **(Sam/Malone)** Create the org **Anthropic** org + a capped `cobi-runtime` Workspace key; swap it onto the Worker + `cpl-chat`; **revoke** the old personal key.
- [ ] **(Claude)** Move CPLBrain's *institutional* content into an org-owned repo (the vault becomes a mirror, never the owner); leave genuinely personal notes in CPLBrain.

### Weeks 4–8 — Required CI gates + cheap structural wins
- [ ] **(Malone/Claude)** A required **PII-column-schema CI guard** (blocking, alongside TruffleHog); audit the daily `git add` list against the 4-tier classification.
- [ ] **(Malone/Claude)** `a11y.yml` (axe-core/Playwright + pa11y) as a **required** check with an axe **baseline** (fails only NEW violations); promote `check_contrast.py --live` to required; gate the daily cron ("violations → no publish").
- [ ] **(Claude)** **Consolidate auth → one `cobi-auth.js`** (kills the ~12-file drift; Malone-reviewable in an afternoon; the precondition for SSO).
- [ ] **(Malone/Claude)** **Evict ~180 MB generated artifacts** from the daily commit (rebuild on demand / data branch / object storage); shrink `.git`.
- [ ] **(Malone)** Cloudflare **Pages staging + PR previews**; decouple the data cron from prod-HTML deploys.

### Weeks 6–12 — Operating model + paperwork started
- [ ] **(Sam + Malone)** Add `CODEOWNERS` + "require 1 review" on the gated ~20% (schema/RLS/auth, PII paths, `cpl-chat`, re-mint scripts, workflow files); add the one-sentence auto-merge tightening to `CLAUDE.md`.
- [ ] **(Malone)** A required **`cpl-chat-smoke.yml`** gate + a named approver on Edge Function deploys; codify version-capture-before-deploy.
- [ ] **(Claude)** Write `docs/ONBOARDING.md` (human-for-human, not the AI-handoff lessons) + the one-page **KPI→sanctioned-source lineage** table.
- [ ] **(Sam → CO + counsel)** Author the **internal DSA** (FERPA school-official framing); confirm aggregate-only ingestion.
- [ ] **(Sam + CO)** **Start the parallel procurement track:** open the GitHub Enterprise / Supabase Team / Claude Team→Enterprise conversations; request DPA+VPAT+SOC 2; confirm contract vehicles; if any student-level data is needed, email **Research@CCCCO.edu** to start the ~6-month MOU.
- [ ] **(Malone)** Pair-review the first ~2 weeks of gated PRs with Sam for context transfer; then own engineering accountability outright.

---

<a id="6-knowledge-architecture"></a>
## 6. Knowledge architecture — the CO KB with "knowledge lanes"

COBI already runs a **three-lane knowledge system**; the design below grows it into a
CO-wide KB *without breaking the one boundary that matters* (the human-gated public
curation gate).

### The lane model — `lane` is a metadata DIMENSION, not a repo-per-lane
Six divisions (CPL, CCC Baccalaureate, Apprenticeships, Internships, MIS, Student
Services) × three lifecycle lanes = 18 silos if you spin up repos. **Don't.** Carry
a `lane:` frontmatter key + a folder convention; let CODEOWNERS give each lane an
owner. (This mirrors the architecture finding: "one platform, `lane` as an RLS
dimension," and keeps cross-lane search/RAG trivial.)

```yaml
lane: cpl            # cpl | baccalaureate | apprenticeships | internships | mis | student-services | co-wide
tags: [reference, c-id, ccn]
kb-status: published # published | archived | internal
data_class: INTERNAL # PUBLIC | INTERNAL | RESTRICTED | PII
```
`co-wide` is the shared-governance lane (HUMANS principles, data-classification
policy, the curation procedure itself, the glossary, vendor evaluations). A note
with no `lane:` defaults to `co-wide`.

| Lifecycle lane | CPL today | CO-wide target | Mechanism |
|---|---|---|---|
| **INTERNAL** (working memory) | tracker `docs/kb-notes/` | one **org-owned `co-knowledge` repo**, per-lane subfolders `kb-notes/<lane>/` | git, PR-reviewed; internal reads gated by **Cloudflare Access (Entra)** when published |
| **PUBLIC** (audience-facing) | `cpl-knowledge-base` (one CC BY repo) | **keep ONE public repo**; add top-level `<lane>/` sections + per-lane CODEOWNERS + per-lane manifest sections | the existing `curation_assistant.py` pipeline, generalized |
| **PERSONAL** | `CPLBrain` (personal acct) | stays personal, but **demoted** (below) | Obsidian + the COG skills |

**Why one public repo, not six:** the curation gate, the CC BY license, the
`curation_assistant.py` tool, and the `using-with-ai-assistants.md` priming
contract are all repo-level. Splitting into six multiplies the human-review surface
and the RAG ingestion config sixfold for zero benefit. A `baccalaureate/` directory
+ a manifest block + a CODEOWNERS line is the whole change. **Federated governance,
central guardrails:** one `CURATION.md` + one data-classification policy in
`co-wide/`, inherited by every lane; only the manifest sections + CODEOWNERS are
per-lane. A lightweight **KB Council** (Malone + the lane owners) adjudicates
cross-lane taxonomy on the existing "re-curate quarterly" cadence.

### The PERSONAL / INTERNAL / PUBLIC boundary — and CPLBrain's evolution (the question Sam most needs answered)

| | PERSONAL (CPLBrain) | INTERNAL (`co-knowledge`) | PUBLIC (`cpl-knowledge-base`) |
|---|---|---|---|
| **Owner** | Sam (individual) | Org (RCCD/CCCCO) | Org (RCCD/CCCCO) |
| **Contents** | braindumps, daily briefs, college-updates, watchlist, session notes, half-formed ideas | distilled durable team knowledge: methodology/ADR/playbook/reference, lessons, handoffs, governance | audience-facing, CC BY, no PII, metrics → dashboards |
| **Data class** | INTERNAL + (occasionally) RESTRICTED | INTERNAL only — never PII | PUBLIC only |
| **Review gate** | none (it's one person's brain) | PR-reviewed for quality; **never PII** by policy | **human draft-PR = the sensitivity audit** |
| **Write path** | COG skills (`braindump`, `archive-session`) | `/checkpoint` (Rule 8) + the new procedures below | `curation_assistant.py` + manifest |

**The load-bearing rule (already half-true — make it explicit):** *institutional
knowledge must NOT depend on a personal vault.* Today `/checkpoint` writes to the
tracker's `docs/`, which sync INTO CPLBrain — so the durable record already lives in
an org-owned repo and CPLBrain is a *mirror reader*. Keep it that way and harden it:
the source of truth for INTERNAL knowledge is the org-owned `co-knowledge` repo;
CPLBrain syncs FROM it for Sam's convenience but is never the only copy.

**How CPLBrain evolves (grow ask #2 *and* fix the bus factor):** Obsidian is the
wrong primary tool for a *team* KB (no SSO, no RBAC, no audit, no compliance; Sync is
single-player; Publish is one site-wide password). So **do not try to make CPLBrain
the CO KB.** Instead: **(1) demote, don't migrate** — declare CPLBrain a personal
productivity tool; institutional knowledge promotes via `/checkpoint` into
`co-knowledge`. **(2) split framework from content** — the COG skills + `.claude/`
framework are reusable team tooling and move to an org-owned home; the personal
content stays in CPLBrain. **(3) a 2nd contributor gets their OWN vault** — multi-user
Obsidian = merge conflicts; both vaults *contribute* to the shared org KB through the
same procedures. **(4) org-owned, eventually CO-owned** — when GitHub goes Enterprise,
the KB repos live under the org with SSO; CPLBrain stays personal because it's
personal — which is *correct*, not a liability, once the institutional copy no longer
depends on it.

### Every project & session contributing — `/checkpoint` + THREE new procedures
Generalize `/checkpoint` (Rule 8) to every lane (each lane gets its own project
memory + `kb-notes/<lane>/` + INDEX row; the commit body stamps the `lane:`), and add:
- **`/intake`** (the front door, before checkpoint): classify a raw human input (a CO memo, an ESS bulletin, a transcript) by `lane` + data-class, drop a stub into `kb-notes/<lane>/` (status `internal`), queue it for distillation. Makes "every project contributes" mechanical, not aspirational.
- **`/promote`** (the explicit INTERNAL → PUBLIC step): confirms public-eligibility, appends the right manifest section, runs `curation_assistant.py`, opens the **draft PR** assigned to the lane CODEOWNER. **It never merges.** Kept *separate* from `/checkpoint` precisely so a checkpoint can never accidentally publish.
- **`/lane-digest`** (cross-lane synthesis): per quarter, rolls each lane's new notes + open decisions into `co-wide/digests/<quarter>.md` for the KB Council.

**Governance invariants (restate in `co-wide/`):** `/checkpoint` + `/intake` write
*only* to INTERNAL + personal — never to any PUBLIC repo. `/promote` is the *only*
path to PUBLIC and stops at a draft PR. A **PII guard as a required CI check on every
repo** (the `standing-pii-guard` note already exists for the tracker) — extend it to
`co-knowledge` and `cpl-knowledge-base`.

### The KB as grounding for Sierra (RAG) AND for Claude-Code sessions (the payoff)
- **Sierra:** extend `cpl-chat`'s pgvector ingestion to crawl the lane-tagged KB and store `lane` + `data_class` + `source` per chunk. **Scope retrieval by lane + audience**: the public widget + student-facing Sierra retrieve **PUBLIC-lane chunks only** — never an INTERNAL note, never a draft; an internal COBI-tab Sierra (behind Cloudflare Access) may retrieve INTERNAL chunks for the signed-in lane(s). **Never index PERSONAL.** Citations carry the lane + defer metrics to the dashboards (principle 2 made literal).
- **Claude-Code sessions:** the `claude/CLAUDE.md` priming contract already exists in the public KB — **generalize it per lane**. A session that primes on its lane's KB before proposing, then writes the proposal as a *draft doc/PR with a named approver*, produces **grounded strategy instead of depending on a team member for direction**. That is exactly ask #11: the KB is the grounding; the draft-PR gate is the accountability.

### Accessibility + governance of KB content
The KB is markdown → rendered HTML, so accessibility is an authoring + render-time
concern: real heading hierarchy, real lists/tables with `<th scope>`+`<caption>`,
meaningful link text, **alt text on every image** — add these to the frontmatter
contract and the `curation_assistant.py` checks. When the internal KB gets a rendered
site (a git-backed docs site — MkDocs/Docusaurus on Cloudflare Pages, gated by
Cloudflare Access), run **axe-core/pa11y in CI as a required check**. Every note
carries `data_class`; **PII never enters any KB lane**. A dated accessibility
statement + remediation contact lives on the public KB site.

---

<a id="7-accounts-migration"></a>
## 7. Accounts & platform migration — personal → institution-owned

### Two clocks running at different speeds
- **Fast track (self-serve, days–weeks, no procurement):** *create* an org-owned account, *transfer* resources, *rotate* a secret. **Most of the bus-factor risk is retired here. Do not wait on procurement for any of it.**
- **Slow track (procurement, 3–9+ months):** *upgrade a plan tier*. Needs a contract vehicle + DPA/security review + budget. The long pole.

A hard prerequisite gating the GitHub *and* Supabase moves: **an institutional
identity to own things** — a role/service mailbox (e.g. `cobi-admin@rccd.edu`) that
survives Sam leaving. IT can usually create a shared mailbox in days. **Stand it up
first.**

### "Do these before anything else" shortlist (all fast-track, ~first two weeks)
1. **Institutional owner identity** (role mailbox + shared vault). *Sam + RCCD IT.*
2. **Rotate the runtime `ANTHROPIC_API_KEY`** (treat as compromised) + stand up an **org-owned Anthropic** account with a capped `cobi-runtime` Workspace; swap the new key onto the Worker. *Sam.*
3. **Org-owned Cloudflare** account; redeploy the Worker via Wrangler with re-created secrets; cut the route; retire the personal worker. *Sam/Malone.*
4. **Transfer both Supabase projects** out of personal `LiveOak` — and **decouple Supabase login from the personal GitHub identity first** (lockout risk). *Sam.*
5. **Move CPLBrain's institutional content** into an org repo; keep CPLBrain personal-only. *Sam/Claude.*
6. **Turn on GitHub Secret Protection** (push-protection secret scanning) on `CPL-Initiative` — the cheapest mitigation for the leak *class*; precedes the history purge. *Sam.*
7. **Open the slow-track procurement conversations in parallel** — request DPA + VPAT + SOC 2 from each vendor in the same email. *Sam + procurement.*

> The PII git-history purge is the #1 governance item overall, but it's a coordinated
> `main`-rewrite (the one Rule-5 exception) and belongs in the data-governance track
> (§9). Item 6 (secret scanning) is its accounts-track prerequisite. **Do not let the
> accounts migration imply the PII incident is closed.**

### Per-service targets (summary; full migration steps + risks in the workflow appendix)

| Service | Current | Target | Notes |
|---|---|---|---|
| **Anthropic — runtime** | personal key on personal Worker | org Anthropic Org → capped `cobi-runtime` Workspace key | separate runtime spend from dev seats so a runaway session can't drain either |
| **Anthropic — dev** | personal subscription (terms unverified) | org **Team Premium** seats (Sam+Malone) → **Enterprise** when SSO/SCIM/audit first needed | confirm consumer-vs-commercial **now**; treat as consumer until proven |
| **GitHub** | personal `samueltlee`; org has 0 teams; `CPLBrain` personal | **GHEC** (SSO/SCIM/audit are Enterprise-only) + EMU via *commercial* Entra; repos transferred; `CPLBrain` institutional content → org repo | EMU is **one-way/disruptive** — plan the cutover. A CC district is generally not a 501(c)(3): don't budget on the free nonprofit org tier. **GitHub Pages is the wrong production host** (TOS forbids commercial/SaaS use, no WAF/SLA) → move prod frontend to Cloudflare Pages. |
| **Supabase** | personal `LiveOak`, **Pro**, **2** projects | institution org, **Team** (~$599/mo) + **PITR**; both projects transferred, US region | **skip HIPAA** (FERPA ≠ PHI); PITR would have made the PII incident cleanly recoverable; the anon-key/always-true-write/8×-auth exposure is an *architecture* fix, not solved by the ownership move |
| **Cloudflare** | personal `slee-548` | org Cloudflare Org (Workers Paid); + WAF/rate-limit; **Cloudflare Access (Zero Trust)** to gate internal tools | rotate `SCRAPE_SECRET` too; flip the route outside the cron windows |
| **Obsidian** | personal vault doubling as institutional memory | **stays personal**; org KB = git repo + (permissioned org content) **M365/SharePoint** (Entra SSO, already owned) | the blocker is capability, not licensing — don't try to make Obsidian institutional |

### Decide the owner before you transfer
**RCCD-owned** (FERPA + §1798.29 + the CCC Information Security Standard; faster — RCCD
IT can create identities) vs **CCCCO-owned** (IPA + SAM/SIMM/NIST 800-53 + AB 434; the
long-term destination; heavier). **Recommendation: RCCD-owned now**, structured so a
later hand-up to CCCCO is a *second* transfer, not a rebuild (org-level accounts +
role-based billing throughout). Confirm the eventual owner with CCCCO/CDT early — it
drives the security-control framework the whole platform is measured against.

---

<a id="8-integration-api"></a>
## 8. Integration & API — de-scrape, two-way MAP/WordPress, harden the AI surface

- **"Build APIs not scraping" is ~80% paperwork.** The blocker is a **data-sharing
  agreement / MOU**, not code. Start the internal DSA (FERPA school-official framing)
  + the CCCCO restricted-data MOU (`Research@CCCCO.edu`, ~6 months) *now*; keep the
  runner-scrape as **named, owned, expiry-dated tech debt** until the sanctioned path
  exists. Where data is already public/aggregate, retire the scrape to **Data Mart /
  DataVista**. Produce a one-page **KPI → sanctioned-source lineage** table so it's
  obvious which KPIs can move now vs which need an agreement.
- **API-design stance:** stay on **Supabase Postgres + PostgREST + Edge Functions**;
  expose **versioned `api_v1_*` read views** behind a **Cloudflare gateway** (keys +
  rate-limit at the edge). Don't buy a dedicated API-management gateway — premature at
  one consumer (WordPress).
- **Two-way COBI ↔ map.rccd.edu (WordPress):** consume via the **WP REST API**
  (replace the `/cplstories/` Chromium scrape with a JSON pull; this also kills the
  stale inline `mapfyCollegeUrls` blob); push COBI data into WP via an Edge
  Function/webhook; make **Entra the shared IdP** so a user signs in once.
- **Promote COBI tools INTO MAP over a contract, not a copy-paste.** Honor Sam's
  "prototype on COBI, promote proven views to MAP later" — define a **"promotion
  readiness" gate (an ADR template)** and a **versioned API contract**. **TMC Builder
  is the clearest first candidate.** This is the *destination* (#10) — gated on
  ownership + DSA + sponsorship; don't pull it forward.
- **Harden the runtime AI surface.** `cpl-chat` is shared with the **live**
  map.rccd.edu widget — a redeploy affects production. Keep `verify_jwt: false`
  (it does its own gating), capture the running version before every deploy, smoke-test
  all 4 modes on a runner, and add the **eval suite + PII-output guardrail** (§9).

---

<a id="9-governance"></a>
## 9. Governance, security, accessibility & HUMANS-by-design

This track wraps everything else.

1. **PRIORITY ZERO — remediate the PII-in-public-git-history exposure.** It is OPEN.
   Two parallel tracks: **(a)** the §1798.29 breach assessment with counsel (assume
   the data is already in the wild; the purge does *not* moot notification), and
   **(b)** the coordinated `git filter-repo` history purge (pause crons → mirror
   backup → enumerate tainted paths → invert-paths → force-push `main` → all sessions
   re-clone → expire caches → audit forks). **Sign-off: CO Sponsor + counsel.**
2. **A data-classification + governance scaffold.** Four tiers (PUBLIC / INTERNAL /
   RESTRICTED / PII); a living **data inventory** register; **least-privilege RLS**
   (move off always-true write policies; column-level privileges; the
   publishable/secret-key model); **secrets management** (org secret store, rotation);
   **audit logging**; an **incident-response path**; a **vendor/DPA register** (HUMANS
   principle 6). Raise small-cell suppression `<5` → `<10` with complementary
   suppression for public reporting.
3. **Accessibility from the get-go (ask #13).** Driver: the DOJ ADA Title II final
   rule adopts **WCAG 2.1 AA** for state/local government web content, with a
   compliance deadline of **April 26, 2027** for larger entities *(verify the entity
   size + date with counsel)*; plus Section 508, CA Gov Code 7405 / AB 434, and the
   CCC accessibility standard. **Build to WCAG 2.2 AA.** Make a11y a **required CI
   check at the TruffleHog tier** (axe-core/pa11y + the existing `check_contrast.py
   --live`), with an axe **baseline** so it fails only NEW violations; **fix in the
   generator, not the HTML**; accessible component library; tagged-PDF/Word exports;
   produce a **VPAT 2.5 ACR** + a dated accessibility statement.
4. **User-level auth & access maturity path (ask #7).** `cobi-auth.js` consolidation
   (now) → **Entra SSO alongside magic-link** → **role/attribute RLS** (app-role +
   group claims, replacing binary `is_allowed_reviewer()`) → per-college/per-role →
   the student-facing Sierra federating to **OpenCCC/CCCID** (not a parallel login).
5. **Each HUMANS principle → a checkable SDLC practice (not a slogan):**

| HUMANS principle | Checkable practice |
|---|---|
| 1 — Human agency & accountability | `CODEOWNERS` + required review on the gated ~20%; a human-owned decision log; AI is `R`, never `A` |
| 2 — Transparency & explainability | "AI-drafted, human-reviewed, model `<id>`" labels; rationale captured in every PR; metrics cite the dashboard |
| 3 — Privacy & data protection | the required PII-column CI guard; data classification; RLS least-privilege; the DSA before any student-level data |
| 4 — Bias mitigation & harm reduction | a regression **eval suite** for `cpl-chat`/Sierra + the recommender; document known limits |
| 5 — Inclusive design & accessibility | the required a11y CI gate; WCAG 2.2 AA; VPAT; accessibility statement |
| 6 — Evaluation of vendors & partners | a vendor file per service (DPA, SOC 2, VPAT, data residency, sub-processors) before depending on a paid tier |

---

<a id="10-decisions"></a>
## 10. Decisions only you / Malone / the CO can make

Each is framed as options + a recommendation. These are the things this document
*cannot* decide for you.

1. **Breach notifiability (counsel only).** (a) Notify · (b) document a no-notify determination · (c) delay pending analysis. **→ Plan as (a) until counsel rules otherwise; document either way.** Sam authorizes the technical scrub; counsel authorizes notification.
2. **Ownership regime: RCCD vs CCCCO.** **→ RCCD-owned now, structured so a later hand-up to CCCCO is a second transfer, not a rebuild.** Confirm the eventual owner with CCCCO/CDT early.
3. **CO mandate + executive sponsor.** Is COBI chartered as the CO's BI platform, or a CPL-team tool others may adopt? **→ Get a named sponsor + a written charter BEFORE building divisional lanes.** Building lane infrastructure for divisions that haven't signed up is speculative.
4. **Auto-merge policy for a team.** **→ Require human review on the high-stakes set (schema/RLS/auth, re-mints, PII paths, the curation gate, daily-cron, `cpl-chat`); auto-merge the rest.** Requiring review on everything kills the velocity that makes this work; reviewing nothing is a governance defect at CO scale.
5. **Claude subscription terms.** **→ Confirm whether `map@rccd.edu`'s current Claude Code subscription is consumer or commercial immediately; treat as consumer until proven; move dev onto org-owned commercial seats urgently** (the no-training/DPA guarantee).
6. **Anthropic retention posture.** (a) Enterprise custom retention · (b) full ZDR · (c) default 30-day. **→ (a).** ZDR disables your best model (Fable 5) and buys little (no PII in prompts; chat logs live in Supabase, not Anthropic).
7. **Security control framework.** **→ Confirm StateRAMP / Cal-Secure with CCCCO/CDT before buying any gov-cloud path.** FedRAMP is *federal*; you're *state* — you probably need none of the Bedrock-GovCloud migration.
8. **Supabase tier + add-ons.** **→ Team (~$599/mo) + PITR; skip HIPAA** (FERPA ≠ PHI).
9. **GitHub tier + identity model.** **→ GitHub Enterprise Cloud is the floor, not a luxury** (SSO/SCIM/audit are Enterprise-only); EMU via *commercial* Entra (confirm RCCD isn't on Entra Government Cloud). EMU is one-way — plan the cutover window.
10. **Surface freeze during transition.** ~51 JS modules shipped by one fast builder become maintenance debt the moment delegation starts. **→ Slow net-new-tab velocity; be willing to freeze/retire low-value surfaces** (parts of First Light, brand winks) — each surface needs a11y + security + a maintainer.

---

<a id="11-pushback"></a>
## 11. Candid pushback, force-ranked focus, what to defer

*(You asked for this — "All pushback is greatly appreciated!!!")*

### The three things most likely to actually sink this
1. **The PII history is an OPEN incident and scaling makes it worse.** Onboarding Malone, moving to a GitHub org, and inviting CO users all *clone* the tainted history. **Scale the team before the purge and you have institutionalized the breach.** And the purge does not moot the §1798.29 notification question — that assessment runs in parallel, with counsel, now.
2. **Ask #11 ("let Claude provide strategy rather than depend on team members") collides head-on with HUMANS principle 1.** In an AI-built public-sector system, "reduce human dependency" reads to any auditor as "reduce human accountability." The resolution is *AI proposes, a named human disposes* — written into branch protection + a human-owned decision log. **Read this very document as input to Sam+Malone, not "the plan."** #11 means "Claude drafts; the Director of Tech owns and decides" — not "replace the Director with Claude."
3. **The monolith is the bus factor, and re-architecture is the PRECONDITION for the hire, not a later item.** Malone cannot meaningfully own 15,500 lines of HTML mutated by 11,000 lines of string-surgery + 51 JS modules + auth drift + 180 MB of daily-committed artifacts. "Keep shipping features" *widens the gap he must cross* every day.

### Sequencing traps — what NOT to do first
- **Trap A: "Build APIs not scraping" as an engineering sprint.** It's ~80% paperwork (DSA/MOU). A pretty API over data you have no agreement to consume is *scraping with better manners.* Start the paperwork now; keep the scrape as owned, expiry-dated debt.
- **Trap B: Enterprise procurement before institutional ownership.** Buying Enterprise tiers while the Worker/key/CPLBrain/Supabase are personally owned just gilds a personal stack. Ownership transfer is cheaper, faster, higher-leverage.
- **Trap C: an Astro/modular rewrite before the purge + ownership move.** You'd rewrite on top of tainted history, into a personal account. Order matters.

### Force-ranked focus (drop ~14 ambitions → ~5 active lanes)
- **NOW:** PII purge + counsel · de-personalize ownership · required PII+a11y CI gates · `cobi-auth.js` + artifact eviction · start the DSA paperwork.
- **NEXT:** Claude/GitHub/Supabase tier upgrades · Entra SSO + ABAC RLS · the sanctioned aggregate-KPI source · Astro begins · **AI evals/observability (missing from your list — table stakes)**.
- **LATER (gated on a sponsor + mandate):** API-first read views + WP two-way · knowledge lanes · CO-KB build-out · Sierra/OpenCCC.

### DEFER / DON'T (yet)
- **Full ZDR** (disables Fable 5, no marginal benefit — logs live in Supabase).
- **Supabase HIPAA add-on** (FERPA ≠ PHI — wrong frame).
- **Bedrock GovCloud / FedRAMP** (a *federal* program; you're *state* — confirm StateRAMP first; you likely need none of it).
- **A dedicated API-management gateway** (premature at one consumer).
- **"Integrate COBI tools INTO MAP" (#10)** — the destination; dependent on ownership + DSA + sponsorship all landing. Don't pull it forward.
- **Don't make Obsidian the CO KB** (no SSO/RBAC/audit — a personal tool forever).
- **Don't spin up a repo per knowledge lane** (sixfolds the curation + RAG surface for zero gain — `lane` is a frontmatter + RLS dimension).

### The bottom line
The direction is largely correct — the research backs it. The constraint is
**sequencing and accountability, not ambition.** Do governance + ownership +
auth-consolidation first; enforce AI-proposes/human-disposes as a hard rule; treat
re-architecture as the precondition for delegating to Malone; cut to ~5 lanes; secure
a sponsor + ownership decision before building for divisions that haven't asked. The
two failure modes to bet on if nothing changes: **(a)** the PII history becomes a
*notified* breach during scale-up because it was treated as handled, and **(b)**
Malone can't take ownership because the system is only operable by Sam + Claude. Both
are preventable; both are more urgent than any feature.

---

<a id="12-gaps"></a>
## 12. Anything else you should want (the gaps in the ask)

Genuinely missing from the 14 asks, in rough priority:

- **Evals + a regression gate + a PII-output guardrail for `cpl-chat`** (it's live on production map.rccd.edu — an untested prompt change is a production change).
- **Observability** (self-hosted **Langfuse**) for the runtime AI — you can't govern what you can't see.
- **Disaster recovery / backups** — Supabase **PITR** (would have made the PII incident cleanly recoverable); a tested restore.
- **A records-retention / public-records posture** — a CPRA + Title 5 §59020 retention schedule (a public entity's records are discoverable).
- **A human-owned decision log / ADR process** — distinct from the auto-flowing kb-notes; principle 2 isn't satisfied by "the AI wrote it down."
- **A named governance RACI** — an accessibility owner and a privacy/IR owner, not just an engineering owner.
- **A vendor-evaluation file** (principle 6) — collect DPA/SOC 2/VPAT/residency once per vendor; reuse across procurement.
- **Change management & adoption** — the entire *demand* side is absent. A feature shipped ≠ adopted; a lane no division champions is dead infrastructure. Plan faculty/college/CO-staff outreach (CVC-OEI / @ONE / DSPS channels) and a per-division champion.
- **Succession** — a second human who can operate the stack, and a documented "if Sam is unavailable" runbook. (This is the bus factor restated as a deliverable.)

---

<a id="13-scorecard"></a>
## 13. Scorecard — your ~14 asks → approach → first step → horizon

| # | Ask | Recommended approach | First concrete step | Horizon |
|---|---|---|---|---|
| 1 | KB: all projects/sessions contribute via checkpoint + new procedures | Keep `/checkpoint`; add `/intake` (front door), `/promote` (draft-PR-only), `/lane-digest`; generalize per lane | Write the `/promote` procedure spec (separate from checkpoint; stops at a draft PR) | Later |
| 2 | Grow CPLBrain personal knowledge in parallel | **Keep CPLBrain personal; demote it** — institutional content moves to an org-owned `co-knowledge` repo it mirrors | Move durable institutional docs out of CPLBrain into an org repo | Now→Next |
| 3 | Move Claude Code to a Team/Enterprise account | Separate **dev seats** (Team Premium→Enterprise) from **runtime API** (capped org Workspace key) | Confirm current sub is consumer vs commercial; mint the org `cobi-runtime` key | Now (key) / Next (seats) |
| 4 | Transition Git/Supabase/Obsidian to org accounts | Ownership transfer (fast) decoupled from tier upgrade (slow); role-mailbox owner; **two** Supabase projects; Obsidian stays personal | Create the institutional role-mailbox owner identity | Now (transfer) / Next (tier) |
| 5 | Build real APIs instead of MCP + scraping | ~80% paperwork: internal **DSA** + service credential; retire KPIs to **Data Mart/DataVista**; keep the scrape as owned debt until then | KPI→sanctioned-source lineage table + start the DSA | Now (paperwork) / Next (cutover) |
| 6 | Two-way integration with map.rccd.edu | WP REST both directions; **Entra as the shared IdP**; embed via the standalone-page pattern behind `api_v1_*` | Replace the `/cplstories/` Chromium scrape with a WP REST JSON pull | Later |
| 7 | User-level auth & access over time | One `cobi-auth.js` FIRST → Entra SSO alongside magic-link → **ABAC RLS** → Sierra→OpenCCC/CCCID | Consolidate the ~12-file auth into `cobi-auth.js` | Now (consolidate) / Next (SSO) / Later (student) |
| 8 | Scale to serve the CO & her division | **Mandate first** — named sponsor + written charter; one platform, `lane` as an RLS dimension | Secure the executive sponsor + charter | Later (gated) |
| 9 | Grow into a CO KB with knowledge lanes | `lane` = frontmatter + RLS dimension; one INTERNAL + one PUBLIC repo + per-lane CODEOWNERS; M365 for permissioned org knowledge | Add a `lane:` key to the kb-notes frontmatter contract | Later |
| 10 | Integrate COBI-built tools with MAP | Promote over a **versioned API contract + a promotion ADR**, not copy-paste; **TMC Builder** is the first candidate | Define the "promotion readiness" gate (ADR template) | Later (destination) |
| 11 | Let Claude proactively provide strategy | **AI proposes, a named human disposes** — draft PR/doc + named approver + rationale; human-owned decision log | Add `CODEOWNERS` + required review on the gated ~20% | Now |
| 12 | Embed HUMANS + automate/simplify | Turn each principle into a **checkable SDLC gate** (CI guards, labels, evals, vendor register) | Add the required PII-schema CI guard (principle 3) | Now (ongoing) |
| 13 | Accessibility from the get-go | **Required a11y CI** at the TruffleHog tier; fix in the GENERATOR not the HTML; target **WCAG 2.2 AA**; VPAT | Ship `a11y.yml` (axe-core + pa11y) with an axe baseline | Now (gate) / Next (VPAT) |
| 14 | Security & data governance maintained | **Priority Zero**: §1798.29 assessment + history purge; 4-tier classification; RLS hardening; suppression `<5`→`<10` | Convene the counsel breach assessment + execute the purge | Now |
| + | *(Missing) AI evals/observability/guardrails* | Self-hosted **Langfuse** + a regression suite for `cpl-chat`'s 4 modes + a PII-output guardrail | Commit a 4-mode regression suite to `cpl-chat-smoke.yml` | Next |
| + | *(Missing) Change management / adoption* | Demand side: per-division champion; faculty outreach via CVC-OEI/@ONE/DSPS; a human onboarding doc | Write `docs/ONBOARDING.md` for a new human engineer | Now→Next |

---

## Appendix — provenance & caveats

- **Produced by** Session 83 (Bruh StarNova) via a 12-agent research-and-synthesis
  workflow (5 web-research threads → 6 design sections → 1 synthesis), grounded in
  `CLAUDE.md`, the Session-26 codebase audit, the HUMANS-principles reference, the
  public KB's `CURATION.md`, and live current-state checks against GitHub + Supabase.
- **Caveat:** vendor pricing/tiers and the legal/compliance deadlines (ADA Title II
  date + entity-size thresholds, §1798.29, the CCCCO MOU timeline) are accurate to
  mid-2026 to the best of the research but **must be confirmed with counsel,
  procurement, and each vendor** before they drive a contract or a notification
  decision. Dollar amounts are directional, not quotes.
- **This is a draft for Sam + Malone to mark up — not a decision.** That is the
  governance model in miniature.

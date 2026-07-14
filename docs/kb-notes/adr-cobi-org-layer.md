---
title: COBI org layer — one platform, "site" as a view dimension (not a repo/site per org)
created: 2026-07-14
updated: 2026-07-14
tags: [adr, cobi, org-layer, co-platform, multi-tenant, site-switcher, team-phrase]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[co_platform_orglayer_lessons]]"
  - "[[co_platform_strategy]]"
artifacts:
  - cobi_orgs.js
  - raci/supabase_raci.sql
---

# COBI org layer — one platform, "site" as a view dimension

> **One-sentence summary** — when a second CO team wanted "their own COBI," we
> gave them a metadata-scoped *view* of the single app (a masthead site-switcher
> + a per-cohort curation phrase), **not** a separate deployment.

## Context

The CO Curriculum & Instruction team asked for their own COBI (C&I) site
(2026-07-14). The tempting reading is a second repo/Pages deployment per org.
Our own platform plan (`docs/co_platform_strategy.md`, Session 83) had already
decided against that.

## The claim

**Model an "org/site" as a metadata + view dimension over the one app — never a
repo or deployment per org.** Concretely, for a low-stakes pilot:

- **View = a runtime switcher, not a wall.** `cobi_orgs.js` injects a masthead
  `<select>`; picking a site sets a per-site identity tag (reusing the existing
  wordmark superscript) and **filters the nav** to that site's tabs (hiding
  others + emptied groups). It's **cosmetic** — deep-links still resolve, there's
  no gating. A `?org=<id>` query param makes each site a shareable link.
- **Adding a site = one config entry.** A new object in `ORGS[]` (label, tag,
  `tabs[]`, `home`), plus — if it curates — one `team_access` row. No new
  deployment, cron, or Pages target.
- **Per-cohort curation phrase, cheaply.** Each site can have its own team
  phrase (`ci-team-2026`) by adding a `team_access` row and having
  `team_pass_check` match **any** cohort's secret. This buys cohort separation +
  independent rotation with **zero client change** (the client sends one
  `x-team-pass` header).
- **Regen-safe by construction.** The switcher is runtime-injected (the
  `cobi_brand`/`kpi_cards` pattern): only a `<script>` tag is mirrored in the two
  HTMLs; the daily generator can never strand it.

## How we got here

Two recon agents mapped the tab/nav/brand wiring and pulled up the platform plan
before any code. The plan's exact words: *"one platform, `lane` as an RLS
dimension … Don't [spin up repos per lane]."* We applied that as the pilot.
Shipped in PRs **#766** (switcher), **#767** (masthead), **#768** (the C&I
phrase). Full story: `[[co_platform_orglayer_lessons]]`.

## When this applies (and when it doesn't)

- **Applies** to presentation-level, low-stakes multi-org where the tabs are
  already-public dashboards and you want speed + one codebase.
- **Does NOT** give data isolation. A cosmetic view is not a security boundary
  (a URL-editor sees the "hidden" tabs), and a shared cohort phrase that matches
  *any* secret unlocks the *same* tables. Real "org B can't see/curate org A's
  data" needs an app login-gate (per the plan, that's GitHub-Enterprise / SSO
  territory) + per-site RLS: parameterize `team_pass_check(site)`, make the
  client site-aware, gate each table by site. Defer that until a mandate needs it.

## See also

- `[[co_platform_orglayer_lessons]]` — the workstream that produced this
- `[[co_platform_strategy]]` — the "Malone plan" this implements (one platform, org as a dimension)
- PRs `#766` (switcher) · `#767` (masthead) · `#768` (C&I phrase)

---

*Authoring check: durable (the one-platform decision holds), reusable (any future
CO area/site reuses the pattern), distilled (one decision), self-contained.*

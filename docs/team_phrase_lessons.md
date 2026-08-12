---
title: Team phrase & site access — workstream lessons
created: 2026-08-12
updated: 2026-08-12
tags: [lessons, auth, team-phrase, rls, org-layer, supabase, cobi]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/team_phrase_expansion_plan]]"
  - "[[docs/kb-notes/methodology-a-shared-credential-can-only-scope-to-an-exclusive-surface]]"
  - "[[docs/kb-notes/methodology-server-enforced-shared-password-gate]]"
artifacts:
  - team_phrase.js
  - team_phrase_header.js
  - team_phrases.js
  - contracts.js
  - kb/supabase_site_phrase_fin.sql
  - tests/team_phrase_sites.test.js
  - tests/team_phrases.test.js
---

# Team phrase & site access — workstream lessons

The scratchpad for how COBI's shared phrases work, what they gate, and the
decisions still open. The distilled, reusable half lives in
[`methodology-a-shared-credential-can-only-scope-to-an-exclusive-surface`](kb-notes/methodology-a-shared-credential-can-only-scope-to-an-exclusive-surface.md).

---

## 2026-08-12 — Session 146 (SkyFund): the header control, and what site-awareness actually meant

### What Sam asked

> *"Look at each COBI tab and make sure there is a place to enter the team phrase
> wherever needed… It might be more efficient to just add it to the main header as
> long as it would reliably work for each tab that requires it. Since we select
> from the Site drop down initially, it would have to be aware of that and respond
> to the correct team phrase for the site."*

### What was measured first

Across all 34 tabs:

| | Count | Tabs |
|---|---:|---|
| Had its own phrase box | 11 | Team & RACI, Annual Workplan, Budget, Memory, MAP Data Quality, TMC Builder, Implementation Funding, Add project, Project lifecycle, GR Priorities, Mission Control |
| **Needed the phrase, offered none** | **7** | Contracts, Governance, MAP Users, NC/Learning Partners, Sierra Training, MAP Queue, College Briefing |
| Magic-link only | 5 | Credential Reference, Unified Courses, Canonical SUBJ4, Projects Editor, CPL News |

All 7 rendered *"sign in on the **Team & RACI** tab … and re-open this tab."* Two
of them gate a **read**, so the bounce cost the whole tab, not just the pen.

### ⭐ The premise in the question was wrong, and the app already knew

Selecting a site did **nothing** to auth. `cobi_orgs.js` is presentation-only and
says so in its own header. Worse, `team_pass_check()` is
`exists (select 1 from team_access where secret = p)` — it matches **any** row's
secret. So all three phrases (`ci`, `gr`, `raci`) already opened every
`team_pass_ok()` table, and **there was no `cpl` phrase at all** — what everyone
calls "the CPL phrase" is the `raci` row.

The real constraint: **a tab can require a site phrase only if it is EXCLUSIVE to
that site.** Every other gated tab is *also* a CPL tab, so demanding the org
phrase there locks out CPL users. `cobi_orgs.js` already carried that list
(`EXCLUSIVE`). Exactly two tabs qualify — `gr-priorities` (shipped long ago) and
`contracts`. And **C&I and CIP have zero Supabase-backed tables of their own**, so
their phrase protects nothing. An empty set, not an oversight.

Sam's steer closed it: *"so if they show up on two tabs, allow either…"* — which
costs nothing to implement, because the shared check already matches every secret.
That collapsed a job I had sized as "~45 tables, a judgment call per table" into
one function, one row, twelve policies and an unlock box.

### What shipped

- **`team_phrase_header.js`** — masthead control that follows the Site dropdown
  and names the scope it will unlock. Fixes all 7 bounce tabs by re-dispatching
  `cpl-tab-activated` for the live tab, reusing wiring 5 of them already had.
- **`team_phrase.js`** — site-scoped API. Each site phrase gets its **own** slot
  (`cpl_gr_pass` / `cpl_fin_pass`), generalising what `gr_priorities.js` had done
  since it shipped, so holding Finance never costs you the shared phrase.
- **`team_phrases.js`** — 🔑 Team Phrases tab (see below).
- **`fin_pass_ok()`** + the `fin` row, applied additively.

### Bugs found on the way, all the same shape

- **Contracts' reload check tracked only the reviewer JWT**, so a *phrase* unlock
  left the "could not read the register" pane on screen until a manual reload.
- **The ⚙ phrase admin was hardcoded to `id=eq.raci`** — a site phrase would have
  had **no rotation path at all**. A credential you cannot change is one you
  cannot un-share when someone leaves.
- **NC/Learning Partners had no `cpl-tab-activated` listener**, so nothing entered
  anywhere else ever reached it.
- **The header popover kept its state in the DOM**, so a re-render arriving
  mid-typing (rAF, tab switch, site change) swallowed both the half-typed phrase
  and the error line — the control looked like it had ignored the click.

### 🔑 Team Phrases as a tab

Sam, later the same session: *"I lost track of where Manage team phrases is."*
Of course he had — it was a modal behind a button that only rendered for a
signed-in reviewer, inside one of 34 tabs. Now a listed tab, contents on a
magic-link reviewer sign-in.

⚠️ **The failure that tab exists to get right:** `team_access` RLS **filters** a
non-reviewer to zero rows and returns `200 + []`, not `403`. Rendering that as
"no phrases configured" tells a locked-out person the exact opposite of the
truth. Not-signed-in / not-a-reviewer / read-failed are three distinct renders.
Same on write — a policy-filtered `PATCH` answers `200` with an empty body, so a
save must prove it touched a row.

## Current state

| Phrase | Row | Gates | Client slot |
|---|---|---|---|
| Shared ("the CPL phrase") | `raci` | every `team_pass_ok()` table | `cpl_team_pass` |
| C&I | `ci` | nothing of its own | — |
| Government Relations | `gr` | `gr_content` + all shared | `cpl_gr_pass` |
| Finance | `fin` | **contracts** (`fin_pass_ok`, live 2026-08-12) + all shared | `cpl_fin_pass` |

## Open — needs Sam

1. ~~The Contracts policy swap~~ — ✅ **APPLIED 2026-08-12.** Sam rotated the
   Finance phrase himself on the new tab (confirming it works end to end), then
   authorised the cutover. 12 policies on `fin_pass_ok()`, DELETE still
   reviewer-only, `team_pass_ok()` gone from the register. **The sequencing was
   the whole point** — applying before the phrase was distributed would have
   darkened a working register for everyone holding only the shared phrase.
2. **Is a site phrase meant to be a superset?** Under "allow either" it opens its
   own tabs *plus* every shared one. Safe only while every holder is trusted with
   all shared CPL data. **Decide before the Finance phrase reaches anyone in
   Finance**: the split is a `scope` column, with `team_pass_check()` matching
   only `scope='shared'`.
3. **The three deep curation tabs still cannot take a phrase** — `kb_curation`'s
   INSERT policy binds `reviewer_email` to the JWT, so CER / Unified Courses /
   Canonical SUBJ4 are attribution-bound by design. That is Phase 2 of
   `docs/team_phrase_expansion_plan.md`, still unexecuted, and it needs the
   `team:<name>` stamp decision first.
4. **Projects Editor is a free win** — `projects` INSERT/UPDATE is already
   `is_allowed_reviewer() OR team_pass_ok()`, yet the tab offers magic-link only.

## Next concrete step

Settle the superset question (open item 2) before the Finance phrase spreads
beyond the core team, then take the Projects Editor win — `projects` already
accepts `team_pass_ok()` and the tab offers magic-link only.

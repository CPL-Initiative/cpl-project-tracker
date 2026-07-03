---
title: Team-phrase auth expansion — recommendation + execution plan
created: 2026-07-03
tags: [auth, team-phrase, magic-link, supabase, rls, plan]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[docs/kb-notes/methodology-server-enforced-shared-password-gate]]"
  - "[[CLAUDE]]"
---

# Team-phrase auth expansion — recommendation + plan

**Sam's ask (2026-07-03):** "We've transitioned to using the Team Phrase for auth
access to many procedures but not all. I'm thinking most of the remaining magic
link email auths (to map@rccd.edu) could be switched to phrase — recommendation
and plan to execute."

## TL;DR recommendation

Widen **most** remaining write gates to `is_allowed_reviewer() OR team_pass_ok()`
— the same pattern the RACI surface pioneered (Session 83). The phrase is
server-enforced (validated inside Postgres), rotatable in one click (⚙ Manage
team phrase), and has run clean since June. **Keep four gates reviewer-only**:

1. **`tmc_review_submission` RPC** — a CO *authority claim* (approve/return a
   college's ADT submission). An approval receipt should always carry a named,
   verified identity, not a shared secret.
2. **`team_access` manage (`ta_select`/`ta_update`)** — phrase holders must not
   be able to read or rotate the phrase itself (that's the boundary that makes
   rotation meaningful).
3. **`projects` DELETE** — destructive; Table/Archive (soft-delete) is already
   phrase-enabled, which is the everyday path.
4. **`allowed_reviewers` / auth config** — obviously.

One surface needs a decision rather than a default: the **public Fact Sheet
Curate layer** (`factsheet_overrides` + the `factsheet-images` bucket) edits a
*public-facing* page. The phrase is a shared secret held by ~24 people; a leak
defaces a public artifact with no per-person attribution. Recommendation:
**hold at reviewer-only for now**, revisit if the magic-link friction actually
blocks a teammate from curating it.

### The one real cost: attribution

Magic-link writes stamp `reviewed_by`/`edited_by` with a verified email. The
curation lanes *use* that (e.g. the auto-merge cohort is tracked by
`reviewer_email='automerge-v1@bot'`; batch-verify provenance). Phrase writes
have no identity. Mitigation (Phase 2): when a phrase user saves in a curation
tab, prompt once per session for a display name and stamp
`reviewed_by = 'team:<name>'` — honest, greppable, clearly distinct from
verified emails. This is the only client-side work beyond copying the RACI
unlock UI.

## Inventory — what's still magic-link-only

| Surface | Store / gate | Risk tier | Recommendation |
|---|---|---|---|
| CCR/CSR/CER curation (disciplines, descriptions, merges, verify) | `kb_curation` writes | internal staging data, but attribution-bearing | **Widen in Phase 2** (with the `team:<name>` stamp) |
| Annual Workplan "Current" + titles | `workplan_goals` UPDATE, `projects.name` PATCH | internal numbers | **Widen — Phase 1** |
| Budget inline editor | `budget_funding`, `budget_expenditures`, `personnel` | internal numbers | **Widen — Phase 1** |
| TMC curator notes | `tmc_curator_notes` | advisory notes | **Widen — Phase 1** |
| Curated KPI default order | `kpi_order` | cosmetic | **Widen — Phase 1** |
| Fact Sheet Curate (text/boxes/images) | `factsheet_overrides`, `factsheet-images` | **public-facing** | **Hold** (revisit on demand) |
| TMC CO review (approve/return) | `tmc_review_submission` RPC | authority claim | **Keep reviewer-only** |
| Team-phrase management | `team_access` (`ta_select`/`ta_update`) | the boundary itself | **Keep reviewer-only** |
| Project hard delete | `projects` DELETE | destructive | **Keep reviewer-only** |

(Already phrase-enabled, for reference: `item_raci`, `team_members`,
`item_updates`, `liftoff_state`, `project_lifecycle`, `projects`
INSERT/UPDATE, KB Portal, MAP Users roster/nudges, Sierra Training +
`sierra_guidance`, `sierra_feedback` triage.)

## Execution plan

Each phase = one Supabase migration (via MCP, schema-of-record `.sql` updated
in-repo) + client unlock wiring + a jsdom test. The client side is copy-paste
of the proven `raci.js` pattern: validate the typed phrase against
`rpc/team_pass_ok` BEFORE storing (the #598 lesson), send `x-team-pass` on
writes, drop + re-prompt on a 401/403 from a rotated phrase, and share the
same `cpl_team_pass` localStorage key so one unlock covers every tab.

- **Phase 1 — low risk, no attribution dependency** — ✅ **EXECUTED 2026-07-03**
  (Sam: "Go phase 1"). Migrations `team_phrase_widen_p1` +
  `team_phrase_widen_p1_associations` APPLIED + verified:
  `workplan_goals`, `budget_funding`, `budget_expenditures`, `personnel`
  INSERT/UPDATE → `is_allowed_reviewer() OR team_pass_ok()`;
  `tmc_curator_notes` write/update policies RECREATED for `anon, authenticated`
  (they were `authenticated`-only, so a phrase user — anon role — never even
  reached the predicate) with the widened gate; every content-bearing DELETE
  stays reviewer-only. **One documented DELETE exception:**
  `workplan_activity_associations` (waa_insert/update/**delete**) — it's a
  reversible JOIN table where "delete" is the popover's everyday un-check
  action (re-checking recreates the identical row, no data loss), so a phrase
  user who can add a link can also remove one; schema-of-record appendix in
  `kb/supabase_activity_associations_add_primary.sql`, pinned by
  `tests/team_phrase_p1.test.js`. **`kpi_order` dropped from scope — the table
  was never built** (the roadmap's "curated default KPI order" is still a later
  add; gate it at birth when it lands). Client: `workplan_goals.js`,
  `budget_editor.js`, `assoc_editor.js`, `tmc_builder.js` (notes) gained the
  shared phrase-unlock affordance (`team_phrase.js`, the validated raci.js
  pattern). Post-ship adversarial review (3 lenses): the 5 core invariants
  hold; fixes landed for its low findings (assoc stale-phrase recovery, real
  HTTP status threaded to the phrase-drop check, no x-team-pass on read-only
  GETs). Known Phase-2 item it surfaced: `tmc_curator_notes.reviewer_email` is
  client-asserted — a phrase holder could label a note with any byline; the
  Phase-2 `team:<name>` stamp should move attribution server-side (trigger:
  stamp from the JWT when present, force a `team:` prefix on phrase writes).
- **Phase 2 — curation lanes with the `team:<name>` stamp** (one PR):
  migration `team_phrase_widen_kb_curation`; `unified_courses.js` (+ CSR/CER
  consumers) gain phrase unlock + the one-time display-name prompt; the
  `reviewed_by` convention (`team:<name>`) documented in `kb/README.md` so
  audits can distinguish verified vs phrase writes.
- **Phase 3 — revisit the holds** with Sam: Fact Sheet Curate (public-facing),
  and nothing else unless friction shows up.

Rollback for any phase = re-tighten the policy to `is_allowed_reviewer()`
(one `ALTER POLICY`/`CREATE OR REPLACE` migration); no data changes involved.

**Effort estimate:** Phase 1 is a half-session; Phase 2 a full session (the
name-stamp touches save paths in the CCR's big consumer). Nothing blocks on
Sam beyond ratifying the keep-reviewer-only list and the Fact Sheet hold.

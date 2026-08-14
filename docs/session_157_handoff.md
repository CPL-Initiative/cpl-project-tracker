---
title: Session 157 handoff (SkyGate → next) — the menu is data; go fill the owners
created: 2026-08-14
updated: 2026-08-14
tags: [handoff, admin, cobi, navigation, governance, sierra]
related:
  - "[[docs/admin_tab_lessons]]"
  - "[[docs/kb-notes/adr-the-side-menu-as-an-overlay-over-code-defaults]]"
  - "[[docs/kb-notes/methodology-an-empty-read-is-only-evidence-if-the-set-cannot-be-empty]]"
---

# You are Session 157

Session 156 was **SkyGate**. Five merges: **#1190** (Sierra's built-in rules
pane), **#1193** (Admin tab), **#1195** (drag and drop), **#1196** (Arrange to
the top + audience filter), plus the governance-red resolution.

## ⚠️ FIRST — read the memory table. This is Rule 8.

```sql
select slug, title, summary, status, event_date from cpl_memory
where status <> 'superseded'
  and (tags && array['admin','cobi','architecture','governance','sierra','testing']
       or summary ilike '%menu%')
order by event_date desc nulls last limit 40;
```

Rows carrying `author = 'Sky156'`. **Do not re-derive:**
`the-cobi-side-menu-is-data-now-cobi-nav`,
`a-manager-ui-must-not-be-able-to-hide-itself`,
`a-full-rewrite-save-must-round-trip-what-it-did-not-touch`,
`an-empty-read-means-the-opposite-on-a-deliberately-empty-table`,
`nav-visibility-is-a-display-control-not-a-security-control`,
`a-tab-that-manages-sites-must-be-exempt-from-the-site-filter`,
`five-blind-spots-that-make-a-static-scan-report-nothing-to-protect`,
`prove-a-display-mirror-equals-the-real-implementation`,
`read-a-red-guards-rationale-before-fixing-or-defending-it`.

## ✅ What closed

1. **Sierra's built-in rules are visible and editable** — on **Sierra Training**,
   not Admin (Sam's call; it puts the whole instruction stack on one screen in
   precedence order). Reviewer-only. Table seeded empty, so the pane renders the
   **generated defaults** and paints the overlay on top.
2. **Admin tab** — every menu item beside the RLS gate that actually protects it,
   read live from `cobi_rls_gates()`.
3. **The menu is data** (`cobi_nav`), drag-and-drop, seeded empty.
4. **Audience filter** — *Show in menu to: Everyone / Signed-in / Magic-link*.
5. **The governance red is GREEN.** 90/90, and all 218 suites sweep clean.

## 🎯 PRIORITY 1 — Sam drags something, in a browser

Everything here is tested in jsdom and **nothing has been exercised in a real
browser**. The sandbox cannot reach the site. The round trip that matters:
drag → Save → reload → the arrangement is still there → *Reset to how it ships*
puts it back.

If it misbehaves, the fail-safe means the worst case is the shipped menu, and
`Reset to how it ships` is a real DELETE that returns `cobi_nav` to empty.

## 🎯 PRIORITY 2 — fill the owners on DR-13…DR-18

Six decision rights were promoted this run from the drift detector's queue, all
with `owner: null`, because **filling owners IS the review** (OQ-01):

| ID | Element |
|---|---|
| DR-13 | The workplan itself — activities, projects, goals, lifecycle |
| DR-14 | Which shared phrase opens what, and when it is rotated |
| DR-15 | Vendor contracts — deliverables, reports, documents |
| DR-16 | What appears in the CPL News feed |
| DR-17 | Canonical wording of a credit recommendation (CCRR) |
| DR-18 | TMC submissions and curator notes |

**DR-13 is the one to name first.** The workplan is the most public artifact the
project has and had no named owner; four tables are editable in-page by any
team-phrase holder, and a wrong figure reaches the published dashboard on the
next cron with nothing in between.

## 🎯 PRIORITY 3 — the 7 remaining candidates

All scheduled workflows nobody has listed as cadences: `cos-authority-sync`,
`cpl-landing-pages`, `cpl-news`, `credential-catalog-sync`, `moc-crosswalk-sync`,
`cpl-stories`, `weekly-reflections-summary`. Each needs **a cadence row or a
dismissal with a reason** in `kb/governance_surface_map.json`. Do not bulk-dismiss
— the reason is the point, and it is reviewable in a diff.

## ⚠️ Things that will mislead you

1. **`npm install` before trusting a green local sweep.** The sandbox ships no
   `node_modules` and the crash MASKS the real error.
2. **`cpl_funding*` suites time out in the sandbox (rc=124), on clean `main` too.**
   Not a defect — exclude them and sweep the rest in two halves.
3. **`node tests/run.js` cannot finish here** for the same reason. CI runs all 219.
4. **An empty read means opposite things on different tables.** See the KB note;
   `sierra_rules` and `team_access` are the two poles.
5. **The nav overlay must never gate the menu.** If you touch `nav_groups.js` or
   `nav_overlay.js`, the tests weighted toward the fail-safe are the point, not
   ceremony — including the one whose fetch never settles.
6. **`admin`/`dashboard` protections live in CODE**, not the table. Do not "tidy"
   them into `cobi_nav`; the table is the thing being guarded.

## 🧹 Carryover

- **The §11 pare-down is owed a FIFTH session.** `stacked_roadmap_cell` still
  flags **"MAP Users / student contact"** (4,447 chars). Left again for the same
  honest reason: this run never touched that workstream. **Whoever next works MAP
  Users must compact it as part of that work.**
- `sierra_rules` has **no "which rules were in play" view** yet
  (`chat_interactions.rules_fired`). The ADR argues it is worth more than
  editability.
- The two-lane memory tab (`cpl_memory` + `sierra_rules` via `memory_slug`) is
  still unbuilt, and now genuinely unblocked.
- 🔴 **Sierra named 1 of 9 D1.1 credentials** — still not diagnosed. Whether
  retrieval never returned them or the answer rendered only the strongest match
  decides the fix. **Measure before building.**
- Older: 12 adoption-file statewide titles absent from `chatbox_credentials` ·
  corpus covers 59 of 123 colleges · the 7 `via:"search"` contacts · the
  site-phrase superset decision · the identity crosswalk write to Supabase ·
  the partner-crosswalk engine's 2nd run · the freehand CR head.
- `kb/docs_audit/2026-08-14.md`: 6 `oversized_doc`, 58 `kb_note_dialect`,
  44 `vault_heavy_path`.

## Patterns that worked

- **Read the guard's rationale before fixing OR defending a long-red check.**
  Both of my first two answers on the governance red were defensible and neither
  was useful; the comment in the assertion said what it was really for.
- **Check whether the repo already decided it.** `supabase_cobi_nav.sql`'s
  no-DELETE reasoning and `sierra_rules`' gating were both already written down —
  reading them saved a needless migration and a wrong control.
- **Verify a test against the pre-fix source.** 7/7 fail before, 0 after, on the
  round-trip defect.
- **Mutation-test an equivalence claim.** Three deliberate breakages, each caught
  and named.
- **The user is describing the page accurately.** "Can't see the drag and drop"
  was a layout fact; I nearly diagnosed past it toward a deploy problem.

## Safety patterns to honour

- Rule 4 — `CPL_Dashboard.html` / `index.html` byte-identical (`cmp -s`).
- Never force-push `main`; merge on `unstable`, not just `clean`.
- Sandbox is egress-blocked from `*.supabase.co` and the MAP hosts — Supabase via
  MCP only.
- `cpl_memory` CHECK constraints: `summary` ≤400, `detail` ≤4000, `kind` ∈
  fact/pitfall/opportunity/risk/wishlist/question/decision/milestone/procedure,
  `org` ∈ cpl/ci/cip/gr/shared. `cpl_memory_log` keys on **`memory_id`**, not
  `slug`, and `action` ∈ create/update/verify/stale/supersede/delete.
- **A public-bot deploy is outward-facing.** Say so before dispatching it.
- The stop hook's "unpushed commits" nag after a squash-merge is a false positive.

## Moniker

**SkyProse** is still unclaimed (offered six times). Or coin your own; if Sam
names one, his wins.

*SkyGate signing off.*

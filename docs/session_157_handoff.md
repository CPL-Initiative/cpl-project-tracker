---
title: Session 157 handoff (SkyGate → next) — the menu is data; go fill the owners
created: 2026-08-14
updated: 2026-08-14
tags: [handoff, admin, cobi, navigation, governance, sierra, cip, noncredit]
related:
  - "[[docs/admin_tab_lessons]]"
  - "[[docs/kb-notes/adr-the-side-menu-as-an-overlay-over-code-defaults]]"
  - "[[docs/kb-notes/methodology-an-empty-read-is-only-evidence-if-the-set-cannot-be-empty]]"
  - "[[docs/noncredit_cip_category_scope]]"
superseded: true
superseded_by: session_159_handoff.md
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

## ⚠️ Addendum — a second workstream landed after this handoff was written

**SkyCode, same day, working with Sam and Jenni on the CIP tab.** This section was
appended after SkyGate wrote the rest, so nothing above mentions it.

**Merged:** #1191 (`EITHER` badge + tooltip · Browse/Find nav entries hidden ·
Program/Award/CIP-Sector multi-select pickers · TOP unbolded, CIP labelled) ·
#1192 **reverted by** #1194 · #1198 (the scope doc).

⭐ **Read [`docs/noncredit_cip_category_scope.md`](noncredit_cip_category_scope.md)
before touching noncredit CIP work.** Headline: **the TOP is not load-bearing.**
Jenni's Short-Term Vocational rule is `32.0111` **plus a secondary credit CIP
aligning with the subject**, and the **1,796** noncredit programs sitting on a
"wrong" credit CIP are not errors — that code *is* the secondary. **1,789 of them
(99.6%) already sit inside their own TOP's crosswalk**, so TOP and the college's
own assignment corroborate each other and neither is trusted alone.

⚠️ **#1192 is the cautionary tale, and it was live for 20 minutes.** Sam relayed
"all noncredit programs get 32.0111"; it shipped; Jenni then clarified **only
Short-Term Vocational** — ESL, Job Prep and some Basic Skills are CDCP-eligible on
*other* codes, and other noncredit is leisure. The blanket rule was wrong for the
majority of 3,187 programs. **The guards from it survive the revert and belong in
whatever replaces it:** computed never stored (a rule-driven default must not be
written as 3,187 curator revisions nobody made); a proposal says `proposed · COCI
has X` and never borrows *"changed from"*, which claims a human decision; and a
proposed code must appear in the row's own option list.

⚠️ **A relayed code table had its labels shifted by one, and it was silent.**
Jenni's Teams summary merged `32.0101 + 32.0104` onto one line, moving every pair
after it — *Developmental/Remedial Math* would have been built as `32.0105`, which
is *Job-Seeking/Changing Skills*. Caught only by checking **all seven pairs**
against the CO's certified catalog; the published page agrees with the catalog.
Same shape as the MIS `LocationID` column. **The scope encodes the published page,
and the validator that caught it runs on every rebuild, not once.**

⚠️ **CTE here is the funding line** (Sam: CTE noncredit qualifies for funding
non-CTE does not). So **category is confirmed BEFORE CTE is concluded** — a CTE
secondary CIP does not prove a program is Short-Term Vocational. And do **not**
ship the "noncredit TOP must start with 49" error flag yet: it would flag 1,970
programs, **1,601 of them `GOAL = CTE`**, and moving them off an asterisked TOP can
strip the marker carrying that designation.

**Blocked on Jenni** (§6 of the scope): confirm the Basic Skills pairing (this one
alone unblocks build phases 1–3) · `32.0199` (60 programs) and `35.0101` (16) are
in use but absent from her list · is our **2026-07-15** crosswalk cut the locked
one · is the secondary CIP being published as a COCI field · **can non-CDCP
categories be CTE at all** (~1,300 programs).
**Blocked on Sam:** where a confirmed category persists — `localStorage` is wrong
for a funding-relevant determination; recommend a gated Supabase table with
who/when, as with `cr_reference_decisions`.

## Moniker

**SkyProse** is still unclaimed (offered six times). Or coin your own; if Sam
names one, his wins.

*SkyGate signing off.*

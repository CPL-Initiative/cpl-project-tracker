---
title: Session 77 handoff — you are Session 77
created: 2026-06-26
updated: 2026-06-26
tags: [handoff, session-77, raci, nudges, activities-projects, annual-report, veterans-sprint]
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/cobi_raci_nudge_lessons]]"
---

# You are Session 77

Session 76 (**SkyTrek**) finished the Team & RACI **navigation + hierarchy** work and dual-published
two strategic plans. Read `docs/cobi_raci_nudge_lessons.md` (the two 2026-06-26 sections) first, then
this. Everything below shipped to `main` (tracker) / merged (vault); one public-KB PR awaits Sam.

## What shipped (Session 76)

| PR | Repo | What |
|---|---|---|
| **#550** | tracker | RACI matrix **Activity/search filter** + per-card **`👥 RACI` deep-links** (cards set `sessionStorage['cpl_raci_focus']` → `#raci`; consumer flashes the row). |
| **#552** | tracker | The **CI-poll-via-MCP** learning elevated into CLAUDE.md's CI-gate section (sandbox `curl`/`GH_TOKEN` has no GitHub access — poll via `pull_request_read`/`actions_list`, never curl). |
| **#553** | tracker | The **3-tier RACI matrix**: Activity → sub-activity → project/work item, built from `window.CPL_DATA` (`activity_kpis` ids + `projects`' dotted-id nesting), each row RACI-able; hierarchical `<optgroup>` scope filter; **no RACI-key migration** (rows stay `item_type:"project"`). 38 rows, 30 jsdom checks, suite 89/89. **Live on merge** (raci.js is static — no regen). |
| **#10, #11** | CPLBrain (vault) | **Veterans Sprint plan** + **Military Base CPL Demonstration plan** (full, names + RACI + tables), cross-linked, in PROJECT-OVERVIEW → Plans, session note written. |
| **#15** | cpl-knowledge-base | **Scrubbed public mirrors** of both plans (`overview/`). **DRAFT — left for Sam:** per `CURATION.md` the human review IS the sensitivity audit, so the session does NOT self-merge the public KB. |

## How the RACI tab works now (so you don't re-derive it)
- `raci.js` is **static + lazy** (no Rule-4 HTML mirror; only nav/pane/boot are mirrored). It reads
  `window.CPL_DATA` — no generator change needed for matrix content.
- **3-tier tree** via `buildItems()`: `activity_kpis` = the official **sub-activity** ids (drive the
  `sub-activity` tag + filter); `projects`' **dotted ids** encode nesting (`idParent` = longest
  non-digit-boundary id prefix; `4.1`→`4.1.1`, `3.1.2`→`3.1.2a`; `5.x` → directly under their Activity).
- **Stable keys:** non-Activity rows keep `item_type:"project"` → existing RACI assignments survive.
  The sub/project split is visual + filter-only. Don't change item_type (see the KB note below).
- Scope filter: `all` / `act:N` / `sub:ID`; search keeps a match + its `ancestors` chain.

## Carry-over (priority order)

**TOP / READY TO BUILD — Copy-RACI (Sam asked for it, loves the tab):** add a
"copy one row's R/A/C/I to other rows" action to the matrix. Design is fully
specced (worked out from the code at Session-76 end), `raci.js` only, ~1 modal +
a button + CSS + tests, low risk:
- **Affordance:** in `fillMatrixTable`, when `canEdit` AND the source row has ≥1
  assignment (`hasAny(raciFor(item))`), append a small `⧉ copy` button to the
  **item cell** (the first `<td>` — it has no click handler, so no conflict with
  the RACI cells' `openRoleEditor`).
- **`openCopyRaci(sourceItem)` modal:** show the source's R/A/C/I as chips
  (confirm what's copied); a "Copy to:" target list = **all other rows** in tree
  order, depth-indented, each a checkbox (reuse `.raci-pick` styling); a **search
  box** filtering id/name; a **"select all shown"** master checkbox (so you can
  search `4.` → select all → copy an Activity's RACI to its whole subtree); a
  warning line *"replaces each selected row's current R/A/C/I"*; footer **"Copy to
  N rows"** (disabled until ≥1 checked) + Cancel.
- **Confirm:** `Promise.all(targets.map(t => saveRaci(t, JSON.parse(JSON.stringify(raciFor(source))))))`
  then `closeModal(); render();`. `saveRaci` already upserts `item_raci` on
  `(item_type,item_id)`, so each target is one write. Reuse `showModal`, `raciFor`,
  `saveRaci`, `chip`.
- **Tests (`tests/raci.test.js`):** the `⧉ copy` button shows only when signed-in
  AND populated; clicking it + selecting a target + confirm POSTs the source's raci
  to the target's key (mock the `item_raci` POST and assert the body). Keep suite green.
- v1 = **replace** (not merge); a merge mode can come later. No RACI-key change,
  no generator change, static asset → live on merge.

**DECISION-GATED — ask Sam, don't guess:**
1. **Nudge SEND channel (#2)** — `nudges/build_nudges.py` only drafts today. Pick: Outlook (zero infra),
   Teams Power Automate webhook (`TEAMS_NUDGE_WEBHOOK`), or Graph `sendMail`. (In the To-Do feed.)
2. **3 leads → `allowed_reviewers` (#3)** — needs the actual emails (Crystal Nasio, Terence Nelson,
   Calvin/Gloria) + Sam's go; Sam also to add his own `slee@cccco.edu` via the editable Email cell.
3. **`update_log` (#5/P1)** — ⚠ product-gated: §11 records Sam **parked** the Update-Log decision
   (2026-06-01). Don't build without his explicit go. **#6 (Annual Report tab) depends on it** for fresh content.

**AUTONOMOUS (no decision):**
4. **Annual Report TAB (#6/P5)** — capstone; draft structure delivered (Session 75). Reuse
   `report_generator.js` (✨AI draft) + `college_report_generator.js` `buildDocx` (⬇Word). Blocked on #5 for *fresh* content but the shell can be built.
5. **Activity-4 sub-lanes (#7)** — now partly subsumed by the 3-tier matrix idea; revisit whether the
   Activities & Projects *cards* should also group by sub-activity. Pure refactor.

**Public KB #15** — follow through: when Sam reviews, mark ready + merge (or apply his scrub edits).

## Standing lanes (beyond RACI — still open)
- Fact-Sheet snapshot live-wire + tech-landscape → live HTML (`docs/fact_sheet_lessons.md`).
- Unverified-M-ID renumber re-mint (`docs/unverified_mid_renumber_scope.md`) — dry-run, Sam's go.
- TMC Phase-2 acceptance engine (`docs/kb-notes/tmc-co-review-scope.md`).
- CPL-Assistant CCR/CER recommender ETL (`docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`).

## Patterns that worked
- **Static-asset feature = live on merge** (raci.js); no cron dispatch needed. Generator-touching
  features still use the code-only-PR + post-merge dispatch.
- **Dual-publish** internal docs: full → vault (direct merge, names intact); scrubbed → public KB
  (draft PR, human review = sensitivity audit, manifest row for provenance). Never self-merge the public KB.
- **Poll CI via MCP `github` tools, not curl** (a curl Monitor silently times out — no GitHub access).
- After a squash-merge with auto-delete-branch ON, the feature branch is gone on origin → plain
  `git push -u origin <branch>` recreates it (force-with-lease fails "stale info").

## New KB note this session
`docs/kb-notes/methodology-tree-from-dotted-ids-stable-keys.md` — build a tree from dotted ids by
id-prefix parenting; re-tier the UI visually but keep the persisted key stable (no data migration).

## A moniker for you
SkyTrek kept the Sky streak (and made Mr. Spock proud 🖖). Claim your own or carry it forward.

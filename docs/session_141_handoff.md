---
title: Session 141 handoff (SkyBridge → next) — My College is built; the last section needs MAP, not code
created: 2026-08-11
updated: 2026-08-11
tags: [handoff, my-college, funding, entity-resolution, sierra, eacr]
related:
  - "[[docs/college_action_page_lessons]]"
  - "[[docs/kb-notes/methodology-reuse-the-model-not-its-formula]]"
  - "[[docs/kb-notes/methodology-a-safe-fallback-is-caller-specific]]"
  - "[[docs/session_139_handoff]]"
---

# You are Session 141

Session 140 ran as **SkyBridge**. Sam's opening was *"continue our work on COBI
College Briefing tab"*; the work was handoff 139's Priority 1.

⚠️ **There is no `session_140_handoff.md`.** Session 139 shipped #1115 and #1116
and ended without checkpointing, so §11 carries no S139 narrative and the
numbering skips. Nothing is lost — #1115's commit body is unusually complete —
but don't hunt for a file that was never written.

## ⚠️ FIRST — read the memory table. This is Rule 8.

```sql
select slug, title, summary, status, event_date from cpl_memory
where status <> 'superseded'
  and (tags && array['funding','college-action-page','entity-resolution']
       or summary ilike '%allocation%' or summary ilike '%college%')
order by event_date desc nulls last limit 40;
```

## ✅ What shipped — #1117

**My College is 7 of 8 sections.** Funding box · 72-district picker · Ask Sierra.
`tests/college_briefing.test.js` **49 → 87**.

| | |
|---|---|
| $50K seed grant | ESS 25-82, with `declined` as a real state (not $0) |
| ESS outcomes | **fractions, not ticks** — *"2 articulated of the 84 statewide credit recommendations · 3 more available to adopt"* |
| Implementation funding | the allocation **cap**, with floor / rural allowance / participation gate each named |
| District picker | 72 districts; a district's colleges listed **alphabetically, never ranked** |
| Ask Sierra | deep link reusing `cpl_chat.js`'s `cplSierraTestQ.v1` prefill — **one chat instance, and the question is not sent** |

## 🎯 PRIORITY 1 — the last section needs MAP, not code

**Student CPL request uploads.** Designed in #1086, still blocked: **no portal
feed exists in Supabase.** This is an ask to the MAP team, not a build. Until
that feed exists there is nothing to render, and rendering a plausible
placeholder is exactly the failure the rest of this tab is built to avoid.

## 🎯 PRIORITY 2 — EACR's prescriptive layer → Supabase

Sam's catch, now carried over **three** sessions unbuilt.
`statewide_prescriptive.js` knows *the likely local course each college already
teaches*, which turns "adopt CompTIA A+" into "adopt it against CIS-25, which you
already run" — on **both** the My College tab and Sierra. Sync it the way
`kb/_sync_credential_catalog.py` syncs the catalogue. CER is already in; EACR is
not.

## ⚠️ Four things that will mislead you if you skip them

**1. NEVER re-derive a college's allocation.** Call
`CPL_FUNDING_TAB._alloc(shortName)`. The $35M split is an **iterative floor
waterfall**: 50 of 115 colleges are pinned at the $150K minimum, and the floor's
**$1,999,687** cost comes out of the same pool — so `share × pool` is wrong for
the floored colleges *and for the ones the floor never touches*. Bakersfield is
not floored and the flat number is still off by $11,340; Mt. San Antonio by
$250,630. **$426K is plausible, and that is what makes it dangerous.**
Cross-check any allocation work against Mt. SAC = **$522,239** (agrees with the
Sep-BOG reconciliation by a different route).

**2. Load the funding model through its own `boot()`** (`ensureLoaded()`), never
by pulling `cpl_funding_data.js` alone. The Budget ledger **overrides** the baked
pool figures, and it lands async — hence `onModelChange()`. A surface that reads
once at mount shows the pre-ledger number forever and nothing fails.

**3. The funding roster keys on SHORT names, MAP on full names.** Join both sides
through `cplCollegeShort()`. Measured: **115 of 116, 0 collisions, 0 orphans**;
the residue is Calbright, a noncredit feeder genuinely off the credit roster. The
committed assertions run against the **real** rosters, so drift fails in CI — do
not swap them for fixtures.

**4. A "safe fallback" is safe only for its original caller.**
`cplCollegeShort()` returns the input unmatched — correct for a chip, silently
wrong for a money join. That fallback hid a real bug: the resolver **could not
round-trip its own output** (`"LA Swest"` → fallback → LA Southwest lost), fixed
2026-08-11. **`f(f(x)) == f(x)` is a cheap, strong test for any normaliser you
join through.**

## Patterns that worked

- **Measure the join before building on it.** Three passes: 110 → 114 → 115. The
  step to 114 came from normalising *both* sides with the same function instead
  of comparing normalised to raw; the step to 115 exposed the resolver bug.
- **Run the model and print the table.** The floor's effect on *unfloored*
  colleges was not something I predicted from the rule — it fell out of a
  five-line probe.
- **Cross-check against a figure derived by another route.** Mt. SAC agreeing
  with Sep-BOG was worth more than re-reading the formula.
- **Assert the contract, not the text.** A "no money is attributed" check first
  failed against the *program name* "$50k ESS 25-82"; asserting the absence of
  the `.cb-fbig` element is what actually means it.

## Safety patterns to honour

- Aggregates only; **`StudentMAPID` must never reach Supabase.**
- Never commit a MAP export — this repo is public.
- Merge on `clean` OR `unstable`; **never force-push `main`.**
- **Deploy `cpl-chat` only via `cpl-chat-deploy.yml`** (`workflow_dispatch`,
  input `confirm: DEPLOY`). Merging does **not** deploy.
- Sandbox cannot reach `*.supabase.co` (MCP only) or college domains.
- ⚠️ The container's clone is **shallow (`--depth 50`)**, so `git fetch` can
  report a *"forced update"* on `main` and `merge-base --is-ancestor` can answer
  wrongly across the graft boundary. Confirm with `git branch -a --contains
  <sha>` before concluding anything about a history rewrite.
- ⚠️ `tests/cpl_funding.test.js` alone takes **>4 minutes** — budget for it, and
  don't read a wrapper `timeout` as a test failure.
- ⚠️ Bash cwd resets to `/home/user` — `cd` in the same command.
- ⚠️ `actions_list` returns enormous payloads; parse the saved tool-result file
  with python, never inline.

## Carryover

| # | Item | State |
|---|---|---|
| 1 | **Student CPL request uploads** — the 8th My College section | blocked on a MAP portal feed |
| 2 | **EACR `statewide_prescriptive.js` → Supabase** | Sam's catch, unbuilt across 3 sessions |
| 3 | Malone's Q2 / Q3 / `TblSTU_EXH_BUNDLE` answers | waiting on him |
| 4 | Ask MAP for a **durable row id** (`TblSOURCE.ID` is an Access autonumber) | raised, not asked |
| 5 | COLLEGE·CRED (Mt. SAC Request-Review language) | queued |
| 6 | k=10 revisit — breadth vs volume | Sam flagged, measured |
| 7 | 6 real Sierra feedback rows untriaged | from S135 |
| 8 | `docs/INDEX.md` **4.57×** budget, `roadmap_archive.md` 2.4× | lint, still untouched |

## Moniker

**SkyLedger** — the money is on the page and reads from one model; the next run
should make the *advice* beside it as specific as the numbers now are.

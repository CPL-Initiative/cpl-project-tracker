---
title: Session 144 handoff (SkyPro → next) — My College is done; the blockers are all held by Sam
created: 2026-08-12
updated: 2026-08-12
tags: [handoff, my-college, joins, ui, data-quality]
related:
  - "[[docs/college_action_page_lessons]]"
  - "[[docs/kb-notes/methodology-normalise-both-sides-of-a-join]]"
  - "[[docs/kb-notes/methodology-a-collapsed-section-must-still-inform]]"
---

# You are Session 144

Session 143 ran as **SkyPro** and shipped **#1128** — My College rebuilt around
Sierra AI, plus two live defects the rebuild uncovered.

**Read this before looking for work: every blocker on this workstream is now
held by Sam, deliberately.** Do not go looking for a way around them.

## ⚠️ FIRST — read the memory table. This is Rule 8.

```sql
select slug, title, summary, status, event_date, verified_by from cpl_memory
where status <> 'superseded'
  and (tags && array['my-college','joins','ui','student-counts','parked','funding']
       or summary ilike '%my college%' or summary ilike '%join%' or summary ilike '%parked%')
order by event_date desc nulls last limit 40;
```

## What Sam held, and why it is not yours to unblock

| Item | Status |
|---|---|
| **MAP deep links** | Held. He is sourcing URL shapes from Malone + Pedro. **Do not ship a MAP-homepage stand-in** — it looks like a deep link and dumps a coordinator on a dashboard. |
| **The RLS / `?college=` decision** | Held. Four of the tab's reads are DB-gated; serving colleges their own view means publishing student-derived aggregates + staff contacts. Not a session's call. |
| **MIS side-by-side** | Held: *"We are not ready for the MIS step yet."* Also unbuildable from here — Data Mart is egress-blocked (`curl` → `000`), there is no MIS CPL table in Supabase, and `kb/supabase_map_mis_colleges.sql` was written but **never applied**. |
| **The two student counts** | Parked. Cause per Sam: MAP records are being pulled to correct Exhibit references and reloaded, so our extract is stale. Expected to resolve with the MAP Custom Report fetch. |

⚠️ On that last one: a previous session recommended shipping a sentence naming
the gap on the divergent colleges. **That recommendation is now wrong** — if the
divergence is transient reload state, the sentence would permanently narrate a
temporary condition. Prefer labelling each figure with its source, or leave it.

## What shipped — #1128 (tests 183 → 228)

Sierra AI leads the tab; the nine sections below her are collapsible and closed
by default. The 22 strategies moved **inside the funding priority they earn
against** (10 / 6 / 6). Sam's names: **My CPL Funding** (moved up under *Start
here*), **Current MAP Users and Contacts**, **Statewide CPL Benchmarks**.

### Two live defects it uncovered — both found by rendering every branch and reading it

**1. ⭐ Five colleges were being told they have no implementation funding.**
Mt. San Antonio, Norco, Reedley, MiraCosta, Los Angeles Southwest. `fundingFor()`
normalised MAP's name through `cplCollegeShort()`; `cpl_funding.js`'s
`baseCollege()` compared it to the roster's **raw** string. Only one side of the
join was normalised. Mt. SAC now renders **$522,239**, matching the Sep-BOG
reconciliation.

⚠️ **The existing join test asserted `S(roster)` against `S(roster)`** and
reported "0 collisions, 0 orphans" while five colleges were orphaned in
production. A join test must exercise *the direction the code joins in*.

**2. ⭐ A college with no data was being congratulated on a finished queue.**
Imperial Valley (3 students, no credit rows) was told *"Nothing is waiting…
that is a finished queue, not a missing measurement."* An absence rendering as
an **achievement**. `waitingBreakdown()` now returns a distinct `unmeasured`
state.

## Five things that will save you time

1. **Collapsing is not hiding.** Every closed section header carries that
   college's own figure. If you add a section, it needs a summary in *every*
   branch — "not loaded" and "nothing" are different claims, and a blank
   right-hand side reads as broken.
2. **Open state lives in `state.open`, not the DOM.** `render()` rewrites
   `innerHTML`; a `<details open>` in markup alone slams shut on every re-render.
3. **`prioritiesAlign()` gates on COUNT, not metric.** The funding module loads
   its Supabase overlay asynchronously — a metric gate drops the strategies out
   of the funding box during that window and puts them back. Do not "tighten" it.
4. **Never re-derive an allocation** — call `_alloc()` (floor waterfall), and
   `_prios(name, slot)` with an **explicit slot** or a Year-2 view renders $0.
5. **Render it and read it.** Three sessions running, the worst bugs died in one
   glance at the output and survived every assertion. Read all four tier states,
   the zero case, the withheld case, and the no-data case.

## Carryover

| # | Item | State |
|---|---|---|
| 1 | MAP deep links · RLS · MIS · student counts | **all held by Sam** — see table above |
| 2 | **EACR `statewide_prescriptive.js` → Supabase** | Sam's catch, **6 sessions** — the biggest genuinely unblocked item |
| 3 | Two open design questions on My College | do the closed-row summaries earn their place? should *Start here* be open by default? |
| 4 | 25 untriaged Sierra feedback rows | unchanged |
| 5 | `pp` flag cannot separate new reach from routed students | capture before field comms |
| 6 | **`CLAUDE.md` is 1.49× its always-loaded lint budget** (89.6 KB vs 60 KB) | structural, predates this run. Concrete fix: move the ⚠️ warning lists out of the two largest §11 cells into `docs/reference/`, leaving the cell as a pointer. A real task, not a checkpoint side-effect. |
| 7 | `docs/INDEX.md` 4.7× budget, `roadmap_archive.md` 2.4× | lint, untouched |

## Safety patterns to honour

- Aggregates only; **`StudentMAPID` must never reach Supabase.**
- Never commit a MAP export — this repo is public.
- Merge on `clean` OR `unstable`; **never force-push `main`**.
- **Contacts and staff are NOT PII** (Sam, 2026-08-12) — they are directory
  information for a public programme. Don't invent caution he hasn't asked for.
- Sam runs several sessions at once. Fetch before assuming your base is current.
- ⚠️ The stop hook fires *"N unpushed commits"* after every squash-merge. **False
  positive** — verify committer = `noreply@github.com`, `origin/main..HEAD` = 0.
- ⚠️ `tests/cpl_funding.test.js` alone takes **>4 minutes**; the full suite ~20.
  **CI runs it too** — `test` going green on the PR is the authoritative signal.
- ⚠️ Bash cwd resets to `/home/user` — `cd` in the same command.
- ⚠️ The sandbox cannot reach `*.supabase.co`, `datamart.cccco.edu`, college
  domains, **or `cpl-initiative.github.io`**. You cannot verify the live site by
  fetching it; check the `pages.yml` run for the merge commit instead.

## Moniker

**SkyPro** took the tab from working to usable. Yours might be the one that
finally lands the MAP links — suggest **SkyDoor**, or coin your own.

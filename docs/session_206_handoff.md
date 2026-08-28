---
title: Session 206 handoff — from SkyLens (Session 203, the Funding lane)
created: 2026-08-28
updated: 2026-08-28
tags: [handoff, session-206, cpl-funding, ed-code-78093, noncredit, ci]
kb-status: internal
obsidian-folder: cpl-project-tracker
---

# You are Session 206

SkyLens here, on the **Funding lane**. Sam ran a second session in parallel on
the Obsidian lane (SkySolidare, Session 204 → `docs/session_205_handoff.md`); the two
did not touch each other's files. **Read this one for funding, 205 for the docs
corpus.**

## 🔀 READ BOTH HANDOFFS — two sessions ran in parallel

`docs/session_205_handoff.md` (SkySolidare, the Obsidian/docs-corpus lane) and
this one (SkyLens, the Funding lane) are **peers, not a sequence.** Neither
supersedes the other, and the "highest-numbered handoff is authoritative" rule
in `CLAUDE.md` will mislead you here — it would hand you the funding lane and
hide the docs lane entirely.

**The two lanes touch in exactly one place: `CLAUDE.md` §11.** SkySolidare is
consolidating that file; I rewrote the funding cell inside it this run. What
follows is measured input for his consolidation, put here because it came out of
my run:

### §11 measurement, for the CLAUDE.md consolidation

`CLAUDE.md` is **148,817 B — 2.48× its 60,000 B budget**, and the §11 roadmap
rows are **59% of the whole file** (88,278 B across 29 large rows). So the lever
is those rows; trimming prose elsewhere cannot get there.

| | Rows | Bytes |
|---|---|---|
| ✅ done, **no** open NEXT / NEEDS SAM / BLOCKED — retirable to `docs/reference/finished_workstreams.md` | 5 | **14,379** |
| 🔨 in progress | 5 | 10,363 |
| ✅ but with open work — must stay inline | 19 | 63,536 |

The five retirable rows, largest first: **Sierra: false absences** (4,131 B) ·
**Partner crosswalks** (3,474) · **Disposition grain / student detail** (3,287) ·
**Governance & team enablement** (2,389) · **NC / Learning Partners** (1,098).
No judgment calls — the file already documents that mechanism and the rule
("when a row's NEXT step is done and nothing is pending, move it").

⚠️ **The remaining 63,536 B cannot go to an archive** — those workstreams are
live and a session needs them. The pattern that fits is the 2026-07-10
pare-down: a `docs/reference/<workstream>.md` holding the detail, with a
two-line status and a *"read this before touching X"* pointer left inline.
That already worked for `pipeline_reference` · `kb_build_status` ·
`mid_lifecycle`.

⚠️ **My funding cell is now the single largest at 5,095 B.** I archived a
1,850 B narrative to make room, so the file went down slightly on net, but the
cell grew ~500 B. It is a fair candidate for the `docs/reference/` treatment —
its detail already lives in `docs/cpl_funding_lessons.md`, so moving it loses
nothing.

## ✅ SETTLED — do not re-derive any of these

**Sam's three relabels are IN SUPABASE.** He clicked Publish; config md5 moved
`9cf58b99…` → `c95e78aa…`. `yearPriorities` year 1 holds `Access: Outreach`
(src 0) · `Completion` (src 1) · `Access: Statewide` (src 2); with
`priorityOrder [2,0,1]` that displays as P1/P2/P3. **The curator round trip is
proven end to end** — the item three handoffs called unproven.

**Curating this tab now needs a magic-link reviewer, not the team phrase**
(#1372, merged). ⚠️ **`cfp_insert_self` stays open on purpose** — it is the
college self-attestation door (a VPAA/VPSS/CEO attests participation). A blunt
"narrow the auth" kills it and nobody notices until a college tries to attest.
Live RLS verified: 12 policies, 9 on `is_allowed_reviewer`, **0** mentioning
`team_pass_ok`.

## What shipped

| PR | |
|---|---|
| **#1372** | magic-link-only curation; writes stamp `curatorEmail()`, not `(team)` |
| **#1375** | the **Ed. Code §78093.2(d)(1) spine** + Timing as its own collapsible section |
| **#1378** | `NC $` column retired; every institution paired as CR + NC rows |

**The spine.** Four goal cards read live from the model, superscript ᴬᴮᶜᴰ links
from the priority cards and pool boxes.
⭐ **FUNDED and MEASURED are two axes and are never merged** — (C) is funded
(the project pool) and has no campus measure; one status forces that into a
green that lies or a red that denies the money.
⭐ **A priority's goal derives from its MEASURE's milestone, never its title**
(`measureOf()`), so the caption and the dollars cannot disagree.

**The NC rows.** Three shapes: in-lane · below-threshold · **`none on record`**
(7 colleges). Sam's reason for the last one is the good one: *"if they disagree
and say, Yes, we have NC, we can find the error and fix it."*

## Sam's rulings this run

| Ruling | |
|---|---|
| The Workplan register's goals are **not** a rival vocabulary | set before §78093.2, aligned with Vision 2030 + the Workplan; they **deliver** these outcomes. A statutory tag is ADDITIVE, never a correction |
| The alignment stack | Vision 2030 · CA Master Plan for Career Education · CPL Workplan · Ed. Code §§78092–78093.2 |
| A no-NC row is a **data-quality instrument** | a college that never appears cannot be contradicted |
| Timing gets its own collapsible section | it was buried inside priorities |
| Take over #1372 and drive it to green | done, merged |

## ⚠️ Corrections I made to the inherited handoff — check claims, don't inherit them

1. **CI was never broken.** The 203 handoff said no workflow had run repo-wide
   and proposed three causes (Actions disabled / quota / incident). All three
   would have come back clean. The real cause: **a conflicted PR cannot produce
   a `pull_request` run** — GitHub tests the merge commit and a `dirty` PR has
   none. Resolving the conflict made CI appear at once.
   → [`methodology-a-conflicted-pr-cannot-produce-a-ci-run`](kb-notes/methodology-a-conflicted-pr-cannot-produce-a-ci-run.md)
2. **The story corpus is 32 educational / 3 job destinations**, not "5". The
   arrow's shape (`role → credential`) is the real finding: it evidences (B).
3. **The project pool has NO breakdown.** The ledger holds `CPL Projects — $35M
   share` as one row with no children and no project's `budget_source` names the
   $35M. So "split it into named projects, nearly free" is true of the mechanism
   and **false of the amounts** — that is Sam's input.
4. **I was wrong about the CSV** and said so: it keeps its noncredit column,
   because the export has no NC rows and deleting it removes the figure.

## Your queue

1. **Sticky header + frozen SYSTEM rows** — Sam asked; recommended. ⚠️ Two-level
   sticky needs the second `top` to equal the header's *rendered* height —
   measure into a CSS variable, don't hardcode px.
   ⛔ **Lazy-loading recommended AGAINST** (I put this to Sam): 115 colleges is
   ~230 rows, the EACR matrix paints 51,000 cells in 1.6s, and virtualization
   breaks browser Ctrl-F and the what-you-see-is-what-exports contract.
2. **Goal-tagged project line items** — the mechanism is built (`poolGoals`,
   `projectGoals`); blocked on Sam supplying the $8.96M split.
3. **The threshold/floor coupling** — 400 FTES is the last feasible step at the
   $50k floor. Unruled since SkyLane.
4. **The optional Combined award row** (Mt. SAC $400,000 + $100,000 = $500,000).

## Patterns this run earned

- ⚠️ **When two implementations agree on your live data, your test is not
  distinguishing them.** A title-matching mutation passed *every* first-draft
  assertion because titles and milestones agree on the live config. Build the
  divergent case deliberately.
- ⚠️ **A guard that passes because the feature did not run** is
  indistinguishable from one that passes because it worked — the harness does
  not load `window.CPL_STORIES`, so the (C) assertion proved nothing until the
  corpus was loaded.
- ⚠️ **Don't broaden an existing class.** Putting `.cplfund-ncrow` on the SYSTEM
  row broke three assertions written about college rows. New kind of row → new
  class.
- ⚠️ **Invert an assertion, don't delete it.** Two encoded rules Sam changed;
  both were rewritten to guard the *new* invariant, one with a distinctness
  check because a bare count would miss the real failure.
- ⚠️ **A post-squash merge hunk can have no correct side** — either choice left
  two `promoteBtn` blocks, binding Publish twice.

## Safety patterns to honor

- **Never read the config — call `_effective()` / `_alloc()` / `_nc()` / `_prios()`.**
- Live config writes: fresh read, guard the UPDATE on the before-md5, commit a receipt.
- **Never hand-apply Sam's data.** *"I don't want you to fix it; I want the tab to save it."*
- Never force-push `main`. Merge on `clean` OR `unstable`.
- ⚠️ A `check_suite` wake names a routinely superseded `head_sha` — re-read the
  current head.

## Moniker

I kept **SkyLens** (inherited the lane mid-flight). Yours is open.

**Next is Session 207 — `docs/session_207_handoff.md`.**

---
title: Session 188 handoff — the CCR has an interface and an arithmetic; two decisions are Sam's
created: 2026-08-24
updated: 2026-08-24
tags: [handoff, session-188, ccr, atlas, esl, packaging, curation]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/ccr_atlas_lessons]]"
  - "[[docs/session_187_handoff]]"
---

# Session 188 handoff

You are **Session 188**. Session 187 ran as **SkyView** — Sam took a left turn to
the CCR and asked for an Obsidian-style graph view, then named the real target:
*"cluster 142k local courses down to 2k-2.5k common courses … a sea change for
higher education credit mobility."*

⚠️ Sam frequently runs several sessions at once. `git log origin/main` before
assuming your branch is the only work in flight.

---

## Read this first: the finding that should govern the lane

**Grinding the entire 6,056-decision merge queue to perfection lands at 35,937
identities — 14.4× short of 2,500.**

Merging can only compare what already exists, and the lanes propose only 6,056
collapses. That is the whole supply. **Packaging** — deciding what the catalog
should *contain*, then mapping into it — is the only mechanism with the right
shape. The ESL dry-run already proved it at 10.7:1 inside one discipline.

Design target that falls out: **2,500 ÷ 144 disciplines ≈ 17 common courses
each.** ESL's own plan lands at ~221, still 13× over its share — so even
packaging needs a second pass. Do not let anyone (including yourself) restart
"work the queue" without re-reading
[`measure-your-mechanism-ceiling`](kb-notes/methodology-measure-your-mechanism-ceiling-before-working-the-queue.md).

## What shipped

| PR | |
|---|---|
| #1309 | CCR Atlas prototype + the decision-component measurement |
| #1310 | Hero graph, identity-system coloring, ESL re-validation, midnight CI fix |
| #1311 | The ESL fold rendered as a proposal, then APPLIED; the universe view |
| #1312 | `flatten_merge_chains()` — 340 folded identities were still rendering |

**The Atlas** — `prototype/ccr_atlas_v1.html`, built with
`python3 prototype/build_ccr_atlas.py`, verified by
`node prototype/check_ccr_atlas.js` (37 checks, deliberately NOT in `npm test`).
Also published as an artifact Sam can click.

Three views: **158 discipline cells** → **one discipline's decisions** → **one
decision as a 2–12 node graph**, with local courses movable onto any identity by
drag *or* a keyboard-reachable Move button. Plus the **ESL packaging proposal**.

## ✅ The ESL fold is APPLIED — seven comprehensives, 1,997 rows

Landed 2026-08-24, cohort `package-esl-s187@bot`, receipt
`kb/esl_package_out/2026-08-24/esl_apply_plan.json` (restamped DRY-RUN → APPLIED).

| | id | folds in |
|---|---|---:|
| Beginning ESL | `ESOL M9168` | 1,079 |
| Intermediate ESL | `ESOL M9256` | 463 |
| Advanced ESL | `ESOL M1141` | 267 |
| Vocational ESL | `ESOL M9023` | 114 |
| Civic ESL | `ESOL M9177` | 35 |
| Enrichment ESL | `ESOL M1152` | 34 |
| Vocational ESL — Healthcare | `ESOL M91IL` | 5 |

⭐ **Survivors, not new ids.** The code decides this: `merge_into_orphan`
self-trusts only `UC-CUR-*`, and Session 56 re-minted all 4,053 of those away
(live count 0), so a Z-scheme id would flag as an orphan forever.

⚠️ **`ON CONFLICT DO NOTHING` blocked three of the seven RENAMES.** The merges
landed; the names did not. **1,994 landed where 1,997 was planned, and that
three-row gap was the entire story** — a write reporting only "no error" would
have left three comprehensives wearing their old titles while a thousand courses
folded into them. **Check the count against the plan, always.** One blocker was
Sam's own row (`ESOL M9177`), superseded explicitly per Rule 8; prior values are
in the receipt and restorable with one statement.

✅ **Published by the cron at 15:16 UTC 2026-08-24 and verified in the artifact** — all seven
titles and member counts present. **ESL went 2,300 identities → 27**, far past the 10.7:1 the
dry-run projected. Sam confirmed the Civic ESL rename over his own title the same day, so the
Rule 8 supersede is settled.

**Still open: the 794 default-Beginning rows** — folded on an assumption (no
level word in the title), not on evidence. Now correctable by dragging.

## Carryover

- ✅ **The universe view is BUILT** (#1312) — all 17,321 identities on canvas,
  precomputed stable layout, keyword fly-to, draggable islands, cross-area
  course moves. Sam reversed the earlier design call and his reason was right:
  a per-decision view **structurally cannot show a cross-area move**.
- 🔴 **Re-home `FIMS M1018` — the first real use of the drag.** *"Film and American
  Culture"* (film studies, TOP 0612.00) was bot-merged into `ESOL M1152` *"American
  Culture and Film"* (credit ESL, TOP 4930.87) — same words reordered, two different
  courses. ⭐ **Packaging HID it**: it was 1 of 2 members and conspicuous, and is now
  **1 of 35** inside Enrichment ESL and unremarkable. **Audit a survivor's existing
  members BEFORE the next packaging pass** — afterwards the evidence is diluted by
  design.
- 🔴 **An island cannot be relabeled, only its courses moved.** 2,731 of 10,170
  judgeable merges cross a discipline, but the top pairs are siblings (CIS↔CS 107,
  Law↔Legal Assisting 67, Art↔Photography 53) — a **vocabulary** signal, not an
  over-merge one. The one non-sibling pair, Ethnic Studies↔Kinesiology (73), turned
  out to be **right merges under a wrong label** (`ETHS M1227` is "Intercollegiate
  Women's Flag Football"). ⚠️ **A cross-discipline merge is ambiguous between a wrong
  MERGE and a wrong DISCIPLINE, and the repairs are opposite.** Moving those courses
  would be exactly wrong.
- 🟢 **The Atlas shows the fold** — extract, universe and preview all rebuilt from
  post-fix data (decisions 6,056 → 5,697; universe 16,484 in 158 islands) and the
  artifact republished to the same URL.
- 🟡 **The one-college-many-numbers audit rule** — 3,320 candidates measured,
  proposed for `kb/_row_audit.py` beside `unit_anomaly`. A flag, never an
  auto-unmerge.
- 🟡 **The 3,001 no-discipline decisions** (8,065 identities) — half the queue,
  and a *different* job. Needs its own tool.
- 🟡 **The transfer-level 8** that survive, plus whether the 9 already folded
  should be unwound (one row each to reverse).
- 🔴 **18 of the 20 `tests/*_test.py` run NOWHERE, and two of them are RED on
  `main` right now.** `npm test` discovers only `*.test.js`; `js-tests.yml`
  names just `supabase_function_grants_test.py` and `doctrine_lookup_test.py`.
  So a Python guard is written, passes once, and is never executed again — this
  repo has a KB note literally called *a check that never registers can never
  fail*. `merge_chain_flatten_test.py` is now wired in (#1312) because a guard
  nothing runs is not a guard. **The other two failures were confirmed
  pre-existing by running them against `main`'s generator, not assumed:**
  `statewide_kpi_test.py` — the statewide-exhibits card breakdown grew an
  `Issuer/type variants: 4` key the assertion does not expect;
  `eacr_matrix_payload_test.py` — *"3 fold pairs, got 4"*, a fourth roster fold
  pair appeared. **Neither is merge-related.** Deliberately NOT wired into CI
  while red — a permanently red non-required check trains people to ignore it.
  Fix them, then wire the rest in one pass.
- 🟢 `docs/INDEX.md` is **6.48× its size budget** (254KB) — the KB-notes section
  alone is 136KB of long rows. Worth a compaction pass of its own.
- 🟢 Docs lint long tail: `american_spelling` 171, `kb_note_dialect` 60.

## ⚠️ The trap that has now cost this workstream four times

*Ask whether the list you read can contain the thing you are counting.* Four
instances in two days: the carve-out card reporting "22 of 22 standing" when 8
stood; a survivor check reading two pools as empty; the identity lint publishing
zero findings; and — the one that mattered — checking for merge chains by asking
whether the seven **survivors** were sources. Empty result, so I recorded "no
chains." The question was the mirror image: whether my 1,990 **sources** were
targets. **96 were.**

## Patterns that worked

- **Compute the ceiling before committing to the mechanism.** One afternoon of
  arithmetic reframed a workstream that had stalled and been re-attempted for
  months.
- **Check whether the repo already built it.** The drag-and-drop verb Sam wanted
  shipped in Session 54, was tested and reversible, and had **zero uses**. The
  best catch of the run came from reading a committed test, not writing one.
- **Show, don't describe.** Every correction Sam made came from clicking the
  prototype, not from reading a plan.
- **Break your own check.** The date fix was proven both ways — perturb content
  → fails, perturb only the date → passes.

## Safety patterns to honor

- **Rule 5**: never force-push `main`.
- **Rule 10**: fresh live read before any bulk `kb_curation` write; Sam's rows
  always win (39 of his are in the ESL skip list).
- ⚠️ **A happy-path selector cannot see a dead end.** The Atlas check passed on a
  broken landing page because it clicked `.cell.demo`.
- ⚠️ **A clean bill of health from a question the data cannot answer.** Twice
  this run: the carve-out card read fold-scoped skip lists and reported "22 of 22
  standing" (true: 8). Ask whether your source can even express the answer.
- ⚠️ **Merge on `unstable`, but name what the green covered.**

## Moniker

**SkyFold** is going if you want it — this run ended by landing one. Take it, take your own, or use whatever Sam
names in his greeting.

**Next is Session 189 — `docs/session_189_handoff.md`.**

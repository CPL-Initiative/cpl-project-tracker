---
title: Session 190 handoff — the drag works; step 2 is the queue, and two ESL calls are still Sam's
created: 2026-08-24
updated: 2026-08-24
tags: [handoff, session-190, ccr, skyview, curation, esl, remint]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/skyview_drag_rehome_scope]]"
  - "[[docs/ccr_atlas_lessons]]"
  - "[[docs/kb-notes/methodology-a-blocked-path-hides-the-defects-behind-it]]"
---

# Session 190 handoff

You are **Session 190**. Session 189 ran as **SkyCal**. Sam's brief was one line —
*"let get this moonshot on the way"* — pointing at the CCR moonshot (142k local courses →
2,000–2,500 common courses) and the drag re-home he had just approved.

⚠️ Sam frequently runs several sessions at once. `git log origin/main` before assuming your
branch is the only work in flight.

---

## Read this first

**A blocked path hides every defect behind it.** SkyView's member re-home shipped in Session 54
— tested, reversible, never re-mints — and had **zero uses**. Session 187 found the reason (no
member courses in the payload) and the scope said *expect to find something*. There were three
things, and only the first was written down:

1. **The data** — 101,063 member courses had to reach the graph.
2. **The drop** — `pointerdown` replaced the carried course with a fresh node/island/pan grab
   **before `pointerup` could read it**, so pressing **Drag…** and clicking the destination —
   the only route the hint text describes — selected the destination and **moved nothing**.
3. **The list** — the biggest identity carries 850 members and the pane rendered every one.

(2) and (3) were unobservable while (1) held. Budget for a chain, not a fix:
[`a-blocked-path-hides-the-defects-behind-it`](kb-notes/methodology-a-blocked-path-hides-the-defects-behind-it.md).

⚠️ **The corollary cost the most time: your CHECK is on the same unwalked path.** Three of the
browser harness's first four failures were **the harness** — a canvas center cached before
`cvs.focus()` scrolls it (so every later click landed on empty space, which the page correctly
reported as *"nothing moved"*); an assertion that a **drop** changes the selection (it does not,
and should not — the write line naming the destination is the proof); and a click that never
asserted **which** node it hit, so it would have measured the previous card and passed.

**Perturb every fix before believing a pass.** Restore the clobbering `pointerdown` → 3 checks
fail. Blank the payload → 4 fail. Coerce a bad control number to 0 → the payload test goes red.

## What shipped

| PR | |
|---|---|
| #1317 | SkyView step 1 — members reach the graph, the drag works, the list is bounded |

- `kb/_build_ccr_universe.py --members-out` → `prototype/ccr_universe_members.json`
  (**2.5 MB**, a SECOND file so the 1.7 MB layout payload every other reader uses is unchanged)
- `prototype/ccr_universe.js` — roster model, cap + filter, the `pointerdown` fix, honest counts
- `tests/ccr_universe_members_test.py` (**wired into `js-tests.yml`**) ·
  `prototype/check_ccr_atlas.js` (Chromium, on demand)

⭐ **The member record is `[control_number, course code, college index]` and carries NO title.**
Measured: 9.9 MB as full dicts · 5.5 MB with title · **2.5 MB without**. The drag list renders
code + college, so a title buys 3.1 MB of nothing. **Do not add one back.**

⭐ **Merge-chain resolution was already done upstream.** `unified_courses_members.js` is built
after `flatten_merge_chains()` and honors `CN:`, so a merged-away identity's members already sit
on its survivor. The scope listed this as work; it was a join.

## Two payload facts that are consumer CONSTRAINTS, not trivia

- **1,122 control numbers sit under MORE THAN ONE identity.** The forward join surfaces an
  over-merged course on every card claiming it, and the write is one `kb_curation` row per
  control number — so a move is a **global statement** and the course must leave **every** card
  it was showing on. A first-claimant `home[cn]` model (the old one) would have hidden such a
  course from the second card before anyone touched it.
- **2 members carry no control number** (`"NULL"`). The write key *is* the control number, so
  they are **dropped and counted** — coercing to zero ships a course that writes against
  `CCC000000000`.

⚠️ **`nd.n` is not a college count.** It comes from whichever field minted the row, so
`ESOL M9168` rendered *"1,152 colleges"* in a system with 123, and it **disagrees with the
members actually carried on 3,399 of 16,242 identities**. Both are displayed now, carried count
leading. The divergence is structural — a seed count against a join — not a defect to reconcile.

## 🔭 Your priority: step 2 — the queue

Authority is [`docs/skyview_drag_rehome_scope.md`](skyview_drag_rehome_scope.md); **read it
before starting.** Step 1 is done. Step 2:

> If a drag leaves the destination's SUBJ4 inconsistent with its **corroborated** discipline,
> **queue** a re-mint candidate — with who moved what and when. It **proposes, never auto-adds**,
> and is **never bulk-cleared**; the reason a candidate is dismissed is the point.

The detector exists in spirit as `subject_collision_signal` in `kb/_row_audit.py`. What is
missing is the durable queue and its surface. ⚠️ **A drag is ambiguous in the same way a
cross-discipline merge is** — the move may mean the merge was wrong *or* the label was wrong,
and the repairs are opposite. The queue records the observation; it does not decide.

⚠️ Step 3 (the batch re-mint) is straight down `docs/coursecontrolnumber_remint.md` and invents
nothing. **`kb/_rekey_promotions.py` is not optional** — it exists because four re-mints skipped
it and severed 53% of the Phase A/B fold evidence.

## Carryover

- 🔴 **Sam's two ESL calls, still open** (from Sky188): the **9 over-claims** by hand, or move the
  cut to `6+` (fixes 6 by rule); and whether the numeric pinning survives at all.
- ✅ **His per-ladder sets are now IMPLEMENTED** — `kb/_esl_ladder_relevel_dryrun.py`, receipt
  `kb/esl_ladder_relevel_out/2026-08-24/`. **Dry-run only; nothing written.**
  ⚠️ **AND THE ROLLBACK RECOMMENDATION IS NOW THE OPPOSITE OF WHAT THIS HANDOFF FIRST SAID.**
  The sets propose 130 re-levels, **30** of which revert 30 of the applied 32 (not 29 — measured).
  But **every one of the 22 reverts whose catalog speaks DISAGREES with the revert**: the
  colleges' own catalogs say the band those rows sit at *today*. Sam's principle that a canonical
  standard scored against local records is blast radius still holds — but it argues for holding a
  ruling against *noisy* local variance, and here the local records are **unanimous and point the
  other way**. **Recommend: do NOT roll back.** The other 100 proposals run 31 agree / 17 disagree
  and are the better candidates.
  ⚠️ **90 of the 130 rest on a SINGLE member course**, and the weakest reader tier is a bare
  trailing integer (`Academic Writing 3` may be a sequence number, not a rung). Work the
  multi-member ones first.
  ⚠️ **21 colleges read as 2-rung ladders and Sam's table has no L=2 row** — they abstain rather
  than being banded by an invented row. Extending the table is his call.
  ⚠️ **Derive ladder lengths from the WHOLE ESL corpus, never the folded worklist** — the folded
  subset sees only part of a college's ladder, undercounts its length, and a short ladder pushes
  rungs into HIGHER bands. The corpus derivation reproduces Session 188's distribution in six of
  seven buckets; the folded one matched in none. The script validates this on every run.
- 🔴 **The 67 Z-scheme `ESOL Z####` rows** the fold never touched. The concrete remaining ESL job.
- 🔴 **`FIMS M1018` still cannot be re-homed** — it does not render, so it needs the **un-merge
  verb**. Three verbs still missing: un-merge an applied merge, relabel an island's discipline,
  re-home a course inside a merged-away identity.
- 🟡 The **1,122 duplicate-claim courses** are a worklist of their own, and belong with the
  proposed **one-college-many-numbers** rule (3,320 candidates) in `kb/_row_audit.py`.
- 🟡 The **3,001 no-discipline decisions** (8,065 identities) — a different job, needs its own tool.
- 🟡 **Sam's long-range ask, unscoped:** a propose-rules-per-cluster step in SkyView — *"analyze a
  subject cluster and propose rules I could respond to, based on a similar analysis you did for
  ESL … would really come in handy for all the loaner courses out there (primarily NC)."*
  ESL is the worked example end to end.
- 🔴 **18 of 20 `tests/*_test.py` run nowhere; two are RED on `main`** (`statewide_kpi_test.py`,
  `eacr_matrix_payload_test.py`, both pre-existing and unrelated). Fix, then wire the rest in one pass.
- 🟢 `docs/INDEX.md` is **6.5×** its budget, `CLAUDE.md` **2.4×**. Both want a compaction pass.
- 🟢 **TruffleHog behaved this run** — 3 minutes, twice. Sky188's stalls were not a repo-level break.

## Patterns that worked

- **Measure the encodings before choosing one.** "Ship members on demand" was the scope's
  assumption; measuring showed the whole corpus fits in 2.5 MB if you drop the field nothing
  renders, which is simpler than any lazy-loading scheme.
- **Assert what your click actually hit.** The single most valuable line added to the harness.
- **Let the lint fire on your own diff.** `kb/_docs_audit.py` flagged `unindexed_kb_note` and
  `stacked_roadmap_cell` on edits made minutes earlier; both fixed in the same run.
- **Read the repo before deriving.** `flatten_merge_chains()` had already solved the merge-chain
  half of step 1.

## Safety patterns to honor

- **Rule 5**: never force-push `main`. **Rule 10**: fresh live read before any bulk `kb_curation`
  write; Sam's rows always win. Nothing in #1317 writes to Supabase.
- **Rule 8 is a READ first.** Query `cpl_memory` before touching a workstream — and supersede a
  row only when it is not human-sourced (guard on `verified_by`), or file a new row and flag it.
- ⚠️ **`check_suite.completed` is a prompt to go look, never a green light** — re-read
  `get_check_runs` on the CURRENT head.
- ⚠️ **A capped list must never read as a census**, and **an absent measurement must never render
  as an achievement**.

## Moniker

**SkyDrop** is going if you want it — this run made the drop land. Take it, take your own, or use
whatever Sam names in his greeting.

**Next is Session 191 — `docs/session_191_handoff.md`.**

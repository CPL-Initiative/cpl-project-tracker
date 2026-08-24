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

## ⭐ ALSO YOURS — put the description shards in Supabase

**Sam, 2026-08-24: *"I expect we'll put the shards on supabase but will leave that to 190."***
A **lean**, not a settled design — he named the destination and deferred the rest.

**Why it matters:** SkyView's graph and drag now work on the **deployed** site, via the committed
`prototype/skyview.html` (599 KB, payloads fetched at runtime) reached from a button top-right on
the CCR tab. **Only descriptions still need the served-locally route** — 302 per-discipline
shards, **127,523 descriptions, 45.7 MB** — which cannot be committed (this repo is cloned into
his Obsidian vault) and cannot be inlined (the built page is already 9.9 MB).

**What he did NOT rule on — decide these before building:**
1. **Table or Storage bucket?** A table gives RLS and PostgREST; a bucket gives plain files and no
   row overhead for what is really 302 blobs.
2. **Public-read?** It is college catalog text, so probably — but that is an RLS decision under
   **Rule 10**, and the table belongs in the `docs/reference/pipeline_reference.md` §8 inventory.
3. **Stand-alones too?** 33,423 of the 49,907 identities are stand-alone, and their descriptions
   are arguably the *most* valuable — a curator dragging an unclustered course is exactly who
   needs to know what it is.
4. ⚠️ **The client barely changes.** `loadDesc()` in `prototype/ccr_universe.js` already fetches
   per shard, caches, and **degrades honestly** across three distinct states (loading ·
   blocked-by-`file://` · missing). **Only the URL moves — do not rewrite the loader**, and keep
   the honest empty state: an empty description is indistinguishable from a course that genuinely
   has none, and plenty genuinely have none.

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

- ✅ **SAM RULED ALL FOUR ESL CALLS, 2026-08-24 (Session 189).** All recorded in `cpl_memory`
  with him named, all `verified`:
  1. **The over-claims: LEAVE THEM — the statewide standard wins** over local catalog wording.
     ⚠️ Reconciliation: the *"9 over-claims"* are the **numeric lane's** (85 under + 9 over = that
     lane's 94 disagreements). Across ALL lanes it is **14–16**. His per-ladder sets resolve
     **none** of them and push 7 further up.
  2. **Do NOT roll back the 32.** The rollback offer open since Session 188 is CLOSED.
  3. **Apply the per-ladder re-levels only where ≥2 members agree** — the single-voter rows stay
     a worklist, never applied silently.
  4. **L=2 is `L1=Intermediate, L2=Advanced`** — no Beginning band. ⚠️ **This is NOT an extension
     of the L≥3 pattern and must not be "regularised" to `1=Beginning`.** He ruled it after being
     shown the 21 two-rung colleges are large providers (De Anza, Santa Ana, Saddleback, NOCE),
     so a 2-rung read is a PARTIAL VIEW of a longer ladder — a "1" there is not the bottom of
     anything. A domain judgment about specific institutions.
- ✅ **His per-ladder sets are IMPLEMENTED and all his rulings are in** —
  `kb/_esl_ladder_relevel_dryrun.py`, receipt `kb/esl_ladder_relevel_out/2026-08-24/`.
  **DRY-RUN ONLY; nothing is written to Supabase, and no apply script exists for this lane.**
  ✅ **STAGED AND AWAITING HIS GO: 122 re-levels** (multi-member, reverts excluded).
  📊 Visual briefing: <https://claude.ai/code/artifact/083f1d41-d1fa-487e-a2d3-9280c4c2220f>
  (⚠️ its figures are the pre-NC-ruling cut — **the receipt is authoritative**, not the artifact).

  **His seven calls, all in `cpl_memory` with him named:** ① over-claims STAY (statewide standard
  wins) · ② do NOT roll back the 32 · ③ apply only where **≥2 members agree** · ④ **L=2 =
  `L1 Intermediate, L2 Advanced`** · ⑤ Chabot *Advanced ESL Reading and Composition 1/2* = both
  Advanced · ⑥ NOCE *ESL for Academic Success I/II* = Beginning/Intermediate · ⑦ **"Scope it to
  NC not just NOCE."**

  ⚠️ **L=2 IS NOT AN EXTENSION OF THE PATTERN ABOVE IT** — no Beginning band, ruled after he was
  shown the 21 two-rung colleges are large providers (De Anza, Saddleback, NOCE), so a "1" there
  is not the bottom of anything. **Never regularise it to `1=Beginning`.**

  ⭐ **THE CORRECTION THAT MATTERED MOST — Sam: "You should have data for each course as credit
  or noncredit."** He was right. The first NC rule keyed on the spot-check worklist's derived
  `credit_type`, **blank on 24% of members including the exact NOCE courses he had just ruled
  on** — so it failed his own example, and it was propped up with a hand-listed set of noncredit
  institutions. The authoritative per-course field was in the COCI staging files all along:
  **`credit_status` across `coci_minted_memberships.json` ∪ `coci_minted_singletons.json['courses']`,
  joined on `control_number` — 118,195 control numbers, 100% ESL coverage, NOCE clean at 94
  Noncredit.** The workaround list is DELETED. **A rule that needs a hand-maintained list to
  cover its own subject is usually reading the wrong field.**

  ⚠️ **MEASURE THE OUTPUT, NOT THE COMPONENT.** Member-grain word-first changes **775
  member-vote answers** in isolation and **exactly ONE** final band end to end, because
  `decide()` consults member votes only when the identity title has no level word and **894 of
  1,990** are decided there first. The component figure was reported to Sam as an impact number
  and was wrong — the third overstated figure of the session, all the same shape.
  ⚠️ **Derive ladder lengths from the WHOLE ESL corpus, never the folded worklist** — the subset
  undercounts a ladder and a short ladder pushes rungs HIGHER, the over-claiming direction.
  Corpus reproduces Session 188 in 6 of 7 buckets; the folded subset in none.

- ✅ **SKYVIEW GREW TWO THINGS SAM ASKED FOR** (#1319). **Stand-alones are in the graph** —
  33,423 single-college rows as **144 per-discipline islands** (`Music · stand-alone`), drawn
  **HOLLOW** because a stand-alone asserts no equivalence yet and must not read as a weaker
  claim. **Course descriptions drill down** — 302 per-subject shards, **127,523 descriptions**,
  fetched on demand.
  ⚠️ **THE PAGE MUST BE SERVED, NOT OPENED** — descriptions are 34.8 MB stored and 11.6 MB even
  at 120 chars, so inlining was never possible and `file://` blocks `fetch`. Sam took that trade
  knowingly:
  ```
  python3 kb/_build_ccr_universe.py && python3 prototype/build_ccr_atlas.py
  python3 -m http.server 8000   # http://localhost:8000/prototype/ccr_atlas_v1.built.html
  ```
  ⚠️ **When a shard cannot load the pane SAYS SO and names the command** — an empty description
  is indistinguishable from a course that has none, and plenty genuinely have none.
  ⚠️ **`prototype/ccr_desc/` (45.7 MB) is GITIGNORED** — derived output, and this repo is cloned
  into Sam's Obsidian vault. Regenerate it before serving.

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

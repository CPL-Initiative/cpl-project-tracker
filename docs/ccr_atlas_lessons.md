---
title: CCR Atlas — lessons & state
date: 2026-08-24
session: 188 (Sky188)
tags: [ccr, atlas, graph, visualization, curation, esl, packaging, prototype]
artifacts:
  - kb/_build_ccr_atlas_extract.py
  - kb/_esl_package_actionable.py
  - kb/_build_esl_fold_preview.py
  - prototype/ccr_atlas_v1.html
  - prototype/ccr_atlas_graph.js
  - prototype/ccr_atlas_esl.js
  - prototype/check_ccr_atlas.js
  - kb/esl_package_out/2026-08-24/revalidation.md
  - kb/_build_esl_fold_spotcheck.py
  - kb/esl_fold_spotcheck/2026-08-24/report.md
  - tests/esl_fold_spotcheck_test.py
related:
  - "[[CLAUDE]]"
  - "[[docs/ccr_convergence_strategy]]"
  - "[[docs/kb-notes/methodology-measure-your-mechanism-ceiling-before-working-the-queue]]"
  - "[[docs/kb-notes/methodology-calibrate-a-signal-before-you-rank-the-queue]]"
  - "[[docs/kb-notes/methodology-the-unit-of-curation-work-is-the-component-not-the-suggestion]]"
  - "[[docs/kb-notes/methodology-one-college-many-course-numbers-is-an-over-merge-signal]]"
---

# CCR Atlas — lessons & state

Running record for the CCR interactive-interface workstream. Sam's ask
(2026-08-24): *"an interactive interface something like my graph view in
Obsidian … see the common courses categorized by subject … and all their
constituent local courses … drag and drop a local course into another cluster.
Every time I open the CCR to work, I get overwhelmed at the enormity of the
curation task and a bit lost in the process."*

## 2026-08-24 — Session 187 (SkyView)

### The moonshot, stated (Sam)

> *"I want to cluster 142k local courses down to 2k-2.5k common courses. If we
> can do it in the CCCs, we can extend to the CSUs and UCs and privates and then
> nationwide. It would be a sea change for higher education credit mobility."*

That target is the frame for everything below.

### ⭐ The arithmetic that should govern the workstream

Grinding the **entire** 6,056-decision queue to perfection lands at **35,937
identities — 14.4× short of 2,500**. Merging cannot reach the goal; it only
compares what exists. **Packaging** — deciding what the catalog should contain —
is the only mechanism with the right shape, and the ESL dry-run already proved
it at 10.7:1 inside one discipline.

Design target that falls out: **2,500 ÷ 144 disciplines ≈ 17 common courses per
discipline.** ESL's plan lands at ~221 → still 13× over its share, so even
packaging needs a second pass.

Durable: [[methodology-measure-your-mechanism-ceiling-before-working-the-queue]].

### ⭐ The corpus is 6,056 decisions, not 17,321 rows

Collapsing all six suggestion lanes into connected components: **6,056
decisions, 97.1% ≤12 identities, modal size 2**. 144 disciplines carry work,
**median 12 decisions**, and **118 of 144 have ≤40** — a sitting each.
Automotive Technology is 57. Welding is 35.

**3,001 of the 6,056 are in the no-discipline pile** (8,065 identities) — a
*different* job (assign a discipline first) and half the queue. Kept separate,
never blended. Durable:
[[methodology-the-unit-of-curation-work-is-the-component-not-the-suggestion]].

### ⭐ The drag-and-drop verb already existed and had never been used

Member re-home shipped **Session 54**: a curation row keyed `CN:<control number>`
pulls one college course out of the family that minted it and lands it at the
target. `excel_to_dashboard.py` honors it in three places,
`tests/uc_member_rehome.test.js` covers it, deleting the row undoes it, and
**it never re-mints an M-ID** — the source identity keeps its id, so Rule 7's
playbook is not engaged.

**Zero `CN:` rows exist in `kb_curation`** against 28,797 identity-level rows.
The write path was built and cold. You cannot drag a course into a cluster you
cannot see, and the existing ⤴ affordance opens a search box that assumes you
already know the destination. **The visual was the missing half of a shipped
feature, not a new feature.**

### The graph: what Sam asked for vs what works

His own Obsidian screenshot is the argument against the global view — ~500 nodes
and the center is already unreadable. The CCR equivalent is 17,321 identities
over 135,484 courses.

**Forest is a map, trees are graphs.** 158 discipline cells (bounded, countable)
→ one discipline's decisions → one decision as a 2–12 node graph. The hairball
never exists.

⚠️ **The graph must be on the FIRST screen.** It shipped two clicks down with
the grid sorted by decision count — so the top cells were Kinesiology, ESL, Art,
none of which had sample data. Sam clicked the obvious thing and got a dead end:
*"Visual looks good but I don't see the graph view."* Now a live decision renders
in a hero, and disciplines that can be opened sort first.

⚠️ **A happy-path selector cannot see a dead end.** The check passed because it
clicked `.cell.demo` — the class that selects a discipline *with* data. It now
clicks `.cell` and asserts the first one reaches real decisions.

### Color carries the identity system (Sam's call)

> *"if there is a CID, CCN, OR MID, color code it differently"*

★ C-ID cobalt · ◆ CCN mustard · ✳ M-ID violet · ○ unified gray. **State moved to
a separate rim dot** (crimson flagged / hunter reviewed) rather than the fill —
folding state into the fill would mean a **flagged C-ID stopped looking
official**, which is the one thing that must never be ambiguous.

### The ESL re-validation — verdict: do not apply as written

| | |
|---|---:|
| plan claims folds (2026-07-15) | 2,149 |
| **would write today** | **1,846** |
| already curated (skipped by `ON CONFLICT`) | 297 |
| …of which are Sam's own decisions | 39 |
| no longer a row | 6 |

⚠️ **The bucket the plan called riskiest had already been consumed.** It flagged
transfer-level ESL for individual confirmation because it awards *real
transferable credit*. Of 22, only **8 still stand** — 8 curated away (mostly
`automerge-titlelane-v1`, 2026-06-13), 6 vanished with no curation row
explaining them. The review gate closed before anyone opened it.

⚠️ **The dry-run cannot be re-run fresher.** Its inputs
(`coci_minted_courses.json`, `coci_minted_singletons.json`) are the AI-drafted
**baseline** and are deliberately static (`_generated_at 2026-05-22`); curation
is an **overlay** applied at export time, which is what makes curation
regen-safe. Re-running reproduces itself byte for byte. The staleness lives in
the gap between baseline and the 28,797 curation decisions on top of it, which
is what `kb/_esl_package_actionable.py` now closes reproducibly.

⚠️ **Every row's `target` is `null`.** The plan sorts identities into buckets but
the three comprehensive rows **do not exist**. Minting them is not a Rule 7
re-mint (no existing M-ID changes) but it is a real step with a naming decision
in it, and it blocks the apply entirely.

⚠️ **53% of what would write is medium confidence** — and it is concentrated:
**765 of the 1,079 landed Beginning rows (71%) are medium confidence**, and only
**517 of those got there by pure default** (no level word
in the title). Beginning is simultaneously the biggest bucket and the least
certain.

### The fold, rendered

Sam: *"Go for the fold and I'll check it out in atlas."* Built as a **proposal**,
nothing written — three circles sized by local courses with a **crimson wedge for
the medium-confidence share**, and per-bucket spot-check lists with medium rows
first, each naming its signal in plain words.

⚠️ **A clean bill of health from a question the data cannot answer.** The first
cut read the skipped-id lists out of the actionable receipt — which is scoped to
the three *fold* buckets — so no carve-out id appeared in them and every
carve-out reported *"22 of 22 still standing"*. True figure: 8. Same shape as the
identity lint that emptied itself (Session 185). Both sets now derive from
authoritative sources, and a check asserts the transfer-level card reports what
it lost.

### A confirmed over-merge, found on the way

`ESOL Z9023` folds **five distinct Orange Coast courses** (`A045N`–`A049N`:
Reading and Vocabulary, Sentence Structure, Spelling, Advanced Pronunciation,
Advanced Grammar) under one row named for one of them. The tell generalizes:
**members all from ONE college but carrying DIFFERENT course numbers**.
Corpus-wide: **3,320 identities / 7,915 local courses**. A signal, not a verdict
— variable-topic courses share the shape. Durable:
[[methodology-one-college-many-course-numbers-is-an-over-merge-signal]].

### Also fixed (unrelated, was blocking everyone)

`tests/college_identity_lint_guard.test.js` asserted byte-for-byte reproduction
of an artifact that stamps its own build date — **red at 00:00 UTC on every
branch**, and `main` did go red. Fixed by normalizing the date field only, with
a second check pinning that the exemption stays narrow, and proven to still fail
on real content drift.

### Current state

- **Atlas prototype live** as an artifact + `prototype/ccr_atlas_v1.html`
  (build: `python3 prototype/build_ccr_atlas.py`). 37 checks green.
- **Nothing written** to `kb_curation` this run.
- PRs #1309, #1310 merged.

## 2026-08-24 (later) — the fold published, and it exposed a modeling defect

The cron ran at 15:16 UTC. The fold is live: seven comprehensives carrying their
titles, member counts matching the plan exactly.

### ⭐ ESL collapsed 2,300 identities → 27

Far past the 10.7:1 the dry-run projected. 2,273 of 2,300 ESL identities now
carry a `merge_into` (1,990 written this session, 283 already there). Against a
design target of ~17 comprehensives per discipline, **ESL is essentially done.**

### ⭐ But the tab showed 169 rows, not 27 — and that was a real defect

The gap is what made this run worth having. **91 of the 169 rendered rows carried
a `merge_into` and were rendering anyway.**

The overlay stores merges as **one hop per row**. A curator merges X into Y; a
later pass merges Y into a comprehensive. Y is then simultaneously a source and a
target. `export_unified_courses` skips a source, but its merge-**target** loop
never skipped a target that was itself a source — so Y rendered as its own row
while also being folded away, and X's members stayed attributed to Y instead of
reaching the comprehensive.

**340 identities were in this state; only 96 are mine.** 180 come from the title
lane and 60 from Sam's own curation, and **248 of the 340 are not ESL at all** —
Kinesiology 42, Fire Technology 14, English 14, Art 12, Foreign Languages 11.
The fold did not cause this. It made it visible at a scale worth chasing.

Fixed in `flatten_merge_chains()`: ESL **169 → 77**, all rows **16,824 → 16,484**
(exactly the 340), **0 rows appeared**, comprehensives absorbed their stranded
members (Beginning 1,080 → 1,152).

### ⚠️ This looks like it contradicts a standing rule, and does not

The Common CR Reference rule is *"grouping is by KEY, NEVER transitive."* That is
about **similarity** edges, which are measurements and do not compose. A
`merge_into` is a **decision**: a person asserted sameness, and sameness composes.
Refusing to close there does not preserve curator intent, it discards half of it.
Written up as
[`methodology-transitive-closure-is-right-for-decisions-and-wrong-for-similarity`](kb-notes/methodology-transitive-closure-is-right-for-decisions-and-wrong-for-similarity.md).

### ⚠️ My first fix wrote a self-merge, and the test caught it

On a cycle the walk terminated by writing `merge_into[src] = src` — the row
becomes a member of itself, **worse** than the stale edge because a stale edge is
visible in the data and a self-membership is not. The docstring already promised
to keep the recorded hop; the code did not. Measured first: 22,538 direct, 490
two-hop, 18 three-hop, **0 cycles**.

### ⚠️ The fold-scoped list trap, a FOURTH time

Before applying, I checked for chains by asking whether any of the seven
**survivors** was a merge source. Empty result, so I recorded "no chains." The
question that mattered was the mirror image — whether any of my 1,990 **sources**
was a merge target — and the answer was 96. *Asking whether a list can contain
what you are counting* has now cost this workstream four times in two days.

### ⭐ Packaging both hides and reveals — and the hiding is the dangerous half

`FIMS M1018` *"Film and American Culture"* (film studies, TOP 0612.00) was merged
by `automerge-v1@bot` into `ESOL M1152` *"American Culture and Film"* (credit ESL,
TOP 4930.87) — the same words reordered, two genuinely different courses.

Before the fold that stray was 1 of 2 members and conspicuous. **After the fold it
is 1 of 35 inside "Enrichment ESL"**, and nothing about it looks anomalous any
more. A packaging pass should audit a survivor's EXISTING members before folding,
because afterwards the evidence is diluted by design.

It is also the exact repair Sam wanted the universe view for, sitting inside the
fold he just approved.

### Cross-discipline merges: 2,731, and mostly not defects

Of 10,170 merges where both ends carry a discipline, 2,731 (26.9%) cross one. But
the top pairs are overwhelmingly sibling disciplines — CIS↔Computer Science 107,
Law↔Legal Assisting 67, Business↔Office Technologies 55, Art↔Photography 53,
Carpentry↔Construction Technology 38. **That is a discipline-vocabulary signal,
not an over-merge signal.**

The one pair with no parent/child relation was Ethnic Studies↔Kinesiology (73) —
and inspecting it, the *merges are right and the label is wrong*: `ETHS M1227` is
titled "Intercollegiate Women's Flag Football". ⚠️ **A cross-discipline merge is
ambiguous between a wrong merge and a wrong discipline on one end, and the two
have opposite repairs.** Dragging the course elsewhere would be exactly wrong
here; the island needs relabeling. The universe view has a verb for the first and
none for the second.

### ⚠️ The map has ONE verb, and the stray needs a different one

I was about to tell Sam to drag `FIMS M1018` back to Film and Media Studies, and
checked whether he could first. **He cannot: it is not on the map.** A
merged-away identity does not render — correctly, that is the #1312 fix — so
only its survivor `ESOL M1152` "Enrichment ESL" appears as a node.

The universe view moves a **local course** between identities (`CN:<control
number>`). That is the whole vocabulary. Three verbs are missing:

1. **Un-merge an applied identity merge.** `merge_dismissed` declines a
   *suggested* merge; there is no verb anywhere for undoing an applied one.
2. **Relabel an island's discipline** — the Ethnic Studies / Kinesiology case,
   where the merges are right and the label is wrong.
3. **Re-home a local course that sits inside a merged-away identity** — reachable
   only through the survivor.

**Check that the repair you are about to recommend is actually available.** The
finding was right; the instruction attached to it would have made a working tool
look broken.

### Next

- **Sam:** the Beginning spot-check is still open — and it is **517 rows, not 794**.
  765 medium = 517 `default-beginning` (no signal) + 248 `numeric` (weak signal).
  ⚠️ It has **no surface**: merged-away identities do not render, so they cannot be
  dragged, and the Atlas card shows a 90-row sample. A worklist is the prerequisite.
- Re-home `FIMS M1018` out of Enrichment ESL — the first real use of the drag.
- A survivor-member audit before the next packaging pass (the dilution problem).
- Candidate audit rule: an island whose members' disciplines outvote its own label.
- The whole-universe level-of-detail view, and the one-college-many-numbers rule.


---

## 2026-08-24 (later still) — Session 188: the spot-check, and the queue ranked backwards

Sam's ask was two things: find the *"CPL Initiative Dashboard Daily Update"* Routine so he
could toggle it off, then **"continue the queue."**

### The Routine — confirmed independent, then deleted

An agent can neither disable nor delete it (`created_via: "http_api"`; I tried, and the API
refused in as many words). Sam asked the right question before deleting: *is this our daily
cron?* Four independent checks say no, and the fourth is the one that settles it:

1. The real cron is **in the repo** — `.github/workflows/daily-dashboard.yml`, on GitHub's
   scheduler. A claude.ai Routine cannot touch it.
2. Times don't match: Routine `0 11 * * *` vs the 3-cron ladder `17 6` / `17 9` / `17 12` UTC.
3. The Routine had **no `last_run` ever recorded** and a `next_run_at` frozen at 2026-04-18.
4. **It was already Paused and the dashboard updated anyway** — three `Daily dashboard update`
   commits per day on `main` through the week, which is the ladder firing.

⭐ **Proof by observation beat proof by reading.** Points 1–3 are inference from config; point
4 is the system demonstrably working without it. When someone is nervous about deleting
something, find the observation, not another argument.

### The four wrong claims in the handoff

Session 188's handoff scoped the spot-check to the 543 `default-beginning` folds, called them
*"the truly evidence-free pile"*, said they had **no surface** to review on, and ranked them
**above** the 248 `numeric` rows. All four were wrong, and the reason is one sentence:

> **The fold classifier only ever read the identity's modal TITLE.**

`kb/reference/coci_course_list.xlsx` carries a `CatalogDescription` for **3,002 of 3,123
member courses (96%)**, and those descriptions state the level outright. The very first row in
the "evidence-free" pile — `ESOL M9082` *"Academic Reading and Writing for ESL"*, folded to
Beginning — has **both** members saying *"at the advanced ESL level."*

### The finding that outgrew the task: calibrate the signal

Running the same check across **all 1,990 folds** measures each fold signal against an
independent adjudicator, over the rows that adjudicator can actually **decide**:

| Signal / confidence | Disagrees | Agrees | Unchecked | Wrong rate |
|---|---:|---:|---:|---:|
| `combo/medium` | 2 | 0 | 3 | 100.0% |
| `default-beginning/medium` | 102 | 31 | 384 | **76.7%** |
| `numeric/medium` | **94** | 97 | 241 | **49.2%** |
| `combo/high` | 1 | 7 | 24 | 12.5% |
| `word/high` | 23 | 345 | 455 | **6.2%** |

⭐ **`numeric` is a coin flip, and it was ranked BELOW the lane to work first** — on the
reasoning that a number in a title *"is weak evidence, but IS evidence."* That is a
sensible-sounding argument that nothing could check without a second source. 94 rows were
about to be skipped. `word/high` at 6.2% is the only signal behaving like the confidence label
it carries — the stamps encoded how convincing each rule *felt*, which is a different quantity
from how often it is right.

⚠️ **The denominator is the rows the source can DECIDE.** 1,217 folds assert nothing either
way; they are excluded, never counted as agreement. Fold them in and `default-beginning` reads
20% instead of 77% and the finding evaporates. This is the local instance of the standing
trap — *ask whether the list you read can contain what you are counting.*

⚠️ **Key on every axis the label varies over.** My first cut keyed calibration on the signal
name alone, so `combo` got whichever confidence was read first. Split properly the halves are
**12.5%** and **100%** — one name over two different things.

### Directional error beats aggregate error

The numeric mis-fires are **not random: 85 under-claim, 9 over-claim.** The pinning assumes
every college runs a ladder of the same **length**; a college with a 1–3 ladder has `2` as its
*middle* rung, so Contra Costa's `ESL 126 Listening and Speaking 2` is intermediate in its own
catalog while the rule reads Beginning.

⭐ **The small half matters more.** Under-claiming is the direction the doctrine deliberately
chose (award at the entry band); over-claiming is the one it exists to prevent. So **9** rows
outrank **85**. An aggregate rate says *"unreliable"*; the split says *"systematically
conservative, with nine exceptions that break its own safety property."*

All 9 share one cause — **"high-intermediate" / "high-beginning" rounded up**, i.e. the
`5+ → Advanced` cut sitting one rung too low for 6-rung ladders. `ESOL M1211` (8 colleges) and
`ESOL M1217` (7) are the LACCD *College ESL V* series: a **district convention**, not a
one-off, which is the cleanest confirmation of the ladder-length diagnosis available.
⚠️ `ESOL M1217` is **not unanimous** — six members say high-intermediate, LA Mission says
*"low-advanced"*. Majority resolved it; it is the row to eyeball first.

### What was rejected, and why it matters that it was

A **calibrated course-number ladder** was built and thrown away: anchor a college's numbers
against its own level-worded siblings, then place the unlabeled member. It fails structurally
— Santa Rosa `EMLS` anchors land at **30 (Advanced), 371/372 (Intermediate), 701/702
(Beginning)** because the 700s are the *noncredit mirror* of the 300s, and off-ladder courses
(Hartnell `ENGM 190A` *"English in the Lab A"*) still carry numbers. Nearest-anchor would have
proposed **325** re-levels on an ordinal that does not exist.

⭐ Note this is the **same root cause** as the numeric lane's failure, seen from the other
side: local numbering is not comparable across colleges *or* across one college's own schemes.
An independent source has to be independent **and** meaningful — Rule 7's standard for TOP.

### The repair was available all along

Every one of the 1,990 folds is a `merge_into` row owned by `package-esl-s187@bot`, so a
re-level is an **UPDATE of that row's target**. It needs none of the three missing verbs. The
handoff's own rule — *check that the repair you recommend is actually available before you
recommend it* — applied in the opposite direction: it **was** available, and the handoff said
it wasn't.

⚠️ **A purpose bucket is not a level bucket.** 45 rows name a level inside Enrichment / Civic /
Vocational ESL. Those are carve-outs by *purpose*; a level assertion there says the level is
different, not that the carve-out is wrong. Re-pointing would silently strip it.

### Survivor-member audit — closed, clean

The carryover said to audit a survivor's existing members *before* the next packaging pass,
because folding dilutes the evidence by design. Done, and **verified against live
`kb_curation`**, not just the committed file: **7** pre-existing members across all 7
survivors, **1** non-ESL (`FIMS M1018`, already known). The four big level survivors had
**zero** — so the dilution risk was concentrated entirely in the three small carve-out
survivors. One pre-existing merge is `map@rccd.edu`'s own and was left alone.

### My own guards were wrong before the code was

⚠️ The first boilerplate check **passed while perturbed** — it could not fail. Only 2 live
descriptions carry `Basic Skills Level:` and both read *"Open Curriculum"*, matching nothing.
Rewriting it against a **band-valued** field then exposed a real defect: the strip took the
field **NAME** and left its **VALUE**, so `Basic Skills Level: Beginning ESL` still matched —
the same mistake as stripping *"Prerequisite"* and leaving the course it names.

⚠️ My CI step also nearly inherited an invisible dependency: it runs two steps after another
step does `pip install openpyxl`. Blocking `openpyxl` outright proved the test stands alone
(the builder's import is function-local) — and proved the blocker itself bites.

### Four CI wakes, four useless

⚠️ **`check_suite.completed` is a prompt to go look, never a green light.** Three of four named
**superseded heads**; the fourth named the current head but reported a suite I had just
**canceled** as *"completed"*. Session 187 hit this twice and wrote it into its check-in
prompts; four-for-four here made it worth putting in `CLAUDE.md` beside the polling rule.

#1315 merged on `unstable` with the secret scan **stalled twice at zero log output** (22 min,
then a fresh re-run) while the JS suite completed in 11 min on the same commit and runner pool
— action-side, not the diff. The diff was scanned locally instead (0 credential-shaped
strings across code, docs and the 1.66 MB artifact) and **what the green did and did not cover
is named in the merge commit**. If TruffleHog stalls again, treat it as repo-level.

### Next

1. **Sam's two calls:** the 9 over-claims by hand, or move the cut to `6+` (resolves 6 of the
   8 Advanced ones by rule); and whether the numeric pinning survives at all.
2. The **67 Z-scheme `ESOL Z####`** rows the fold never touched — the concrete remaining ESL job.
3. `FIMS M1018` still cannot be re-homed: it does not render, so it needs the **un-merge verb**.
4. Run the same calibration on the **next discipline's** packaging pass *before* ranking its queue.

---

## 2026-08-24 — SkyCal (Session 189): the drag is reachable, and it never worked

Step 1 of [`docs/skyview_drag_rehome_scope.md`](skyview_drag_rehome_scope.md), the shape Sam
approved. The scope predicted *"expect to find something"*. It was right three times over, and
the durable version is
[`a-blocked-path-hides-the-defects-behind-it`](kb-notes/methodology-a-blocked-path-hides-the-defects-behind-it.md).

### The members reached the payload — as a SECOND file

`prototype/ccr_universe_members.json`, **101,063 member courses over 16,240 identities, 2.5 MB**.
Separate from `ccr_universe.json` (1.7 MB) on purpose: every other reader of the layout keeps the
file it already had, and *"the members cost 2.5 MB"* stays a legible fact rather than a silent
doubling of a file nobody re-measures. Built by `kb/_build_ccr_universe.py --members-out`,
inlined by `build_ccr_atlas.py` (a `fetch()` is blocked under `file://`, and the built page has
to open there).

⭐ **The record is `[control_number, course code, college index]` and carries NO title.** The
drag list renders code + college, so a title adds **3.1 MB to show nothing** — measured, not
assumed: full dicts 9.9 MB · with title 5.5 MB · without 2.5 MB.

⭐ **Merge-chain resolution was already done upstream.** `unified_courses_members.js` is built
after `flatten_merge_chains()` and honors `CN:`, so a merged-away identity's members already sit
on the survivor. The scope listed this as work; it was a join, not a build.

### ⚠️ THE VERB COULD NOT BE COMPLETED WITH A MOUSE

`pointerdown` replaced the carried course with a fresh node/island/pan grab **before**
`pointerup` could read it. Pressing **Drag…** and then clicking the destination — the only route
the hint text describes — **selected the destination and moved nothing**. The keyboard path in
the *other* view was tested and green the whole time, which is why nothing ever said so.

This is what zero `CN:` rows actually meant. It was invisible because the missing data made it
unreachable: no course on screen, no drop to attempt.

### ⚠️ THREE OF THE HARNESS'S FIRST FOUR FAILURES WERE THE HARNESS

- It cached the canvas center once, and **`cvs.focus()` scrolls the canvas**, so every later
  click landed on empty space — which the page correctly reported as *"nothing moved"*, and
  which read as a broken drag for three checks running. Re-measure per interaction.
- It asserted a **drop** changes the selection. It does not and should not — the pane keeps
  showing the card you came from. What proves a drop landed is **the write line naming the
  destination**.
- It clicked the canvas and never asserted **which** node it hit. Nodes overlap; a click can
  land on a neighbour and the check would measure the previous card and pass. `__ccrUniverseState()`
  now exposes `sel` for exactly this, and the assertion caught a wrong landing on its first run.

Both page fixes were **perturbed and proven red** (restore the clobbering `pointerdown` → 3 fail;
blank the payload → 4 fail), and so was the payload test (coerce a bad control number to 0 → red).

### ⚠️ The count on a node is not a college count

`nd.n` comes from whichever field minted the row — `corroboration_members`, a cluster's
`member_count`, a C-ID anchor's `source_college_count` — and the pane rendered all of them as
*"N colleges"*. `ESOL M9168` read **"1,152 colleges"**, in a system with 123. It also **disagrees
with the members actually carried on 3,399 of 16,242 identities**. Both are now shown and neither
is preferred: the carried count leads (it is what a curator can pick up), the row count follows
with the reason it differs.

### ⚠️ Two payload facts the consumer must handle, not just report

- **2 members carry no control number** (`"NULL"`). The write key *is* the control number, so
  they are **dropped and counted** — coercing to zero ships a course that writes against
  `CCC000000000`.
- **1,122 control numbers sit under MORE THAN ONE identity** (the forward join surfaces an
  over-merged course on every card claiming it). The write is one row per control number, so a
  move is **global**: `movedTo[cn]` is the only home that counts once set, and the course leaves
  **every** card it was showing on. `home[cn]`-as-first-claimant, the old model, would have
  hidden such a course from the second card before anyone touched it.

### Also

850 members rendered unbounded; now capped at 200 with a filter and *"Showing 200 of 850"* — a
capped list must never read as a census. `membersOf()` was **O(|courses| × |identities|)** (a
full scan of 101k records per row rendered); rosters are keyed now. `nodeById()` scanned all 158
islands per call; indexed.

### Next

1. **Sam drives it in a browser** — no session can (egress-blocked); density and the drop
   affordance are his calls.
2. **Step 2, the queue**: a drag that leaves the destination's SUBJ4 inconsistent with its
   corroborated discipline should QUEUE a re-mint candidate. Proposes, never auto-adds.
3. The **1,122 duplicate-claim courses** are a worklist in their own right — each is an identity
   claiming a course another identity also claims.
4. Still open from Sky188: the 9 ESL over-claims, the 67 `ESOL Z####` rows, `FIMS M1018`.

---

## 2026-08-25 — Session 192 (SkyCruise): the write key, and everything Sam found in a browser

Two threads. One was a latent correctness problem in the verb SkyCal made work
last session; the other was Sam driving the view and reporting what he saw.

### ⭐ A CourseControlNumber is not a unique course key

The re-home writes `CN:<control number>` **and nothing else**, and every layer
below assumes the number names exactly one course. It does not.

`kb/_audit_control_number_claims.py` (new, READ-ONLY, receipt in
`kb/control_number_audit/<date>.md`) measures it against the COCI course list:

| | |
|---:|---|
| 139,834 | distinct control numbers |
| **1,814** | resolve to more than one row **as the artifacts build them** |
| **462** | name more than one course **in the source, after the declared institution fold** |

⭐ **Both numbers are true and they answer different questions** — the first is
what a consumer sees and what the write key must cope with, the second is what
the data says. The receipt states both rather than picking the alarming one.

The 462 split into classes wanting **different repairs**, which is the whole
point of not reporting one headline:

- **73** two real courses on one number — 12 institutions, **93 of them at San
  Jose City College**. A per-college data-entry pattern, so it is a worklist with
  an owner.
- **112** two institutions on one number — statewide uniqueness violated.
- **132** one course carrying both its local code and its CCN (`ANTH 101` /
  `ANTH C1001`) — the cutover, working as intended.
- **145** one course written two ways (`KFIT 6.2` / `KFIT 62`).

⚠️ **The consequence.** Both receiving ends resolve an ambiguous key by picking
the first match — the generator through `cn_rows[cn][0]`, the page through
`byCn[cn]` — and `member_extract` is keyed on the bare control number, so a
`CN:` write removes it from **every** native identity. Dragging one of a
collided pair moved whichever course was indexed first and took the other out
of its own card on the way past. **3,634 draggable rows** carry such a key.

Zero `CN:` rows exist, so nothing has gone wrong yet. SkyView refuses those
moves now, flagging the row **before** the click as well as refusing at it — a
curator who picks a course up, hunts the map for a destination and is refused on
arrival has done the hard part for nothing.

⚠️ **The first perturbation did not go red.** Neutering `canMove` left every
check green, because the pickup guard short-circuits before `applyMove` is ever
reached. Two guards, only one reachable through the UI, and the deeper one was
untested — a future path that starts a carry another way would have walked
straight past it. Each has its own assertion now and each goes red alone.

### ⚠️ A declared fold reaches only the roster that consults it

`kb/reference/map_college_roster_rules.json` folds four college spellings.
`excel_to_dashboard.py` applies it at every point a name enters the **EACR**
payload. The **member** roster (`mcolleges`, built by `_mc()` straight from the
raw COCI names) never consults it. So **1,352** control numbers read as naming
two institutions when they name one, and all four names reach a curator as
typed — **`CaÃ±ada College` renders that way in the member list today**.

⭐ The mojibake case is worth separating: the raw COCI export carries **only**
the broken spelling, **678 times**, so unlike the duplicate-entry cases there is
no correct spelling in the source to fold from. The generator is right to
reproduce its source faithfully; the repair belongs at the roster layer.

### ⚠️ A view must not fly where it cannot draw

Sam, in a browser: searching `english as a second` said *"19 match across 9
subjects … Ringed in red"* and drew **nothing**, at zoom 12%.

Both halves were real. `draw()` renders nodes only above `k=0.20`; `doSearch`
flew to *fit all the hits*, which for hits scattered across nine subjects
computes to about **0.12**. **The search was choosing a zoom the renderer
refuses to draw at, and then reporting rings.** Removing the floor again
reproduces it at exactly `0.120` — the number in his screenshot.

The threshold is one constant read by both now. When the hits genuinely cannot
be framed together at a drawable zoom, the view goes to the densest subject and
says so.

⭐ **A subject name now takes you to that subject.** The old order only
considered the subject when there were *no* course hits at all, so a subject
name that also appeared in a few course titles scattered the view. An **exact**
discipline name wins outright — it has to, because the corpus carries three ESL
discipline names that contain one another.

⭐ **Course names stopped stacking.** Flying into a crowded island queued **344**
titles and **54** fit — 290 were being painted on top of each other. Island
names had had collision rejection since they were written; course titles never
did, and the file already called an unreadable pile *"the exact failure of a
global graph view"*.

### The four ESL discipline names — the CCR is not their source

| Island | What it is |
|---|---|
| `English as a Second Language` (77) | official MQ discipline; CSR `ESOL`, curator-confirmed 2026-05-23 |
| `English as a Second Language Noncredit 53412` (4) | **also** an official MQ title — the TOP code is genuinely part of it; CSR `ESLN` |
| `English as a Second Language (ESL)` (9) | **not in the vocabulary** — the only stray |
| `… · stand-alone` (5) | SkyView's own display suffix, not a discipline |

⭐ The stray's origin is in our own data: `ENGLISH AS A SECOND LANGUAGE (ESL)`
appears in the `ESOL` record's `local_subject_variants` at **21 courses** —
colleges typed the whole discipline name into the *subject* field.

⭐ **Sam's CSR-supersedes idea holds, and the layer is nearly complete:**
**157 of 159** disciplines on the map are valid MQ titles, only two are not
(`(no discipline yet)` at 1,613 and the ESL stray at 9), and **48,244 of 49,907
identities (96.7%)** already sit under a discipline carrying a CSR entry. 14
have no CSR entry, but 12 of those are legitimate MQ titles the CSR has not
reached — so the direction is **12 missing, not any surplus to delete**.

### Sam's UI asks, and the one that bit back

Ranked cards, card-to-card drag, a pannable/zoomable decision graph, a group
review status, and the map/list flip.

⚠️ **"Sorted descending by the ones with the most colleges" had no single figure
that could express it.** The reported count is uncapped but disagrees with what
is carried on about a fifth of identities and can **understate** — `FCSH M1020`
reports 10 and carries 14. The carried count is truthful about what is embedded
but **saturates at the pack's `--max-members` cap of 14**, so a 54-member
identity and a 10-member one both read 14 and sort level: ranking on it ranks
nothing at precisely the top of the list, which is where ranking is for. The key
is the larger of the two — a lower bound — and both print when they disagree.

⚠️ The card had been calling the reported count **"N colleges"**. It is not one,
and the first honest render produced *"10 member courses · 14 colleges among
them"*, which is impossible on its face. That is the disagreement made visible
rather than averaged away.

### The flip, and the condition it shipped under

Sam: *"SkyView should be the initial CCR tab and the current detailed tab should
be a button on SkyView … more manageable and less intimidating."*

⚠️ **The canvas could not be operated without a mouse.** Its keydown handler
panned with the arrows and zoomed with `+`/`-` and had **no key that reached a
subject or an identity**. Survivable while the DOM list was the way in; not
survivable when the map is the tab's front door. Keyboard selection landed in
the same change: Tab through subjects, Enter into one, Tab through its
identities, Escape back out — and entering a subject zooms past the threshold
that draws it, the same floor the search had to clear.

⚠️ **Deriving the level from "have we got an identity yet" made Enter unable to
enter** — at subject level there is no identity by definition, so the test
meaning *move between subjects* also swallowed the keypress meant to go inside
one. The mode is held explicitly; restoring the derivation turns three of five
new checks red.

⭐ **The measurement that reframes the tweaks:** the grouped work surface exists
for **5 of the 159 subjects** — **593 of 49,907 identities (1.2%)**. Leading
with the map means clicking into somewhere with nothing to open most of the
time. The button says so rather than doing nothing, and a double-click
accelerator follows it rather than being the mechanism. All 159 is **~39 MB**
inline, which is exactly the shape the per-discipline description shards already
solve on demand.

### Next

1. **Sam drives the flipped view** — density, the drop affordance, and whether
   the map is the right front door in practice are his calls.
2. **Decision packs per discipline, fetched on demand** — the single change that
   takes the work surface from 1.2% of the corpus to all of it.
3. The **73 two-real-courses control numbers**, starting with San Jose City
   College's 93 rows.
4. Apply the roster fold to the member roster, or repair `CaÃ±ada` at source.
5. The one ESL stray (`English as a Second Language (ESL)`, 9 identities).

---

## 2026-08-25 — SkyFixer S193: the search landed where the term never pointed

Sam drove SkyView in a browser and reported five things. All five shipped in
#1331. This section also absorbs the roadmap cell's accumulated history, which
had reached 6,114 characters and was flagged by `stacked_roadmap_cell` — §11 now
states current truth only.

### The search

Typing **`english as a second`** flew to **Interdisciplinary Studies**.

The term is a PREFIX of three real spellings of one subject — `English as a
Second Language`, `… (ESL)`, `… Noncredit 53412`. `doSearch` flew to a subject
only when the matches collapsed to **one** base name; three did not, so it fell
through to the course-title hits and picked the subject carrying the most
*incidental* ones. Interdisciplinary Studies had four.

⭐ **A subject-name match must outrank a course-title match.** Tiers now decide:
exact → prefix → contains, best non-empty tier wins, and titles choose the
destination only when no subject name matches at all.

⭐ **Variants that EXTEND one another are one subject** and fold to the shortest,
which is the one the others qualify. `Biology` vs `Biological Sciences` is not
that — neither extends the other — so it stays an honest ambiguity.

⚠️ **Refusing to pick is not automatically the honest choice.** The old rule
declined to choose among several matching subjects, which sounded principled and
shipped a worse guess: a subject the term had not named at all. Now it goes to
the biggest and NAMES the others.

⭐ **The real fix was the suggestion list.** Typeahead — subjects first, then
course identities, each labeled with which kind it is — means a term naming
several subjects needs nothing to guess. The tie-break above is only what
happens when the curator does not pick.

### The two screens that were not what their labels said

**"Browse subjects as a list"** opened the work-packaging page: a different
question (how the corpus decomposes into sittings) wearing the same words. It
now opens an actual subject list, filterable, **seeded live from the search box**
so typing without pressing Enter still carries across. The packaging view keeps
its own, differently-named door.

**The CCR tab opened on the table.** Session 192's flip made SkyView the landing
view *inside the prototype page*, while the COBI tab kept opening on the list
with a launcher in the corner — two surfaces, one sentence, one of them flipped.
⭐ Flipping the tab is also **cheaper**: the map is an iframe that fetches its
own payloads, so the table's ~7 MB is deferred until someone asks for the table.
⚠️ Except a curator returning from a magic link — that is intent to curate.

### Carried forward from the S192 cell (history, not current state)

- The mechanism arithmetic: grinding the whole queue perfectly lands at 35,937,
  14.4× short of 2,500. Packaging is the only mechanism with the right shape;
  ESL proved it at 85:1. Target ≈17 per discipline.
- The corpus is ~5,700 decisions, not 17,321 rows — 97.1% are ≤12 identities,
  modal 2. 3,001 carry no discipline (8,065 identities) and are a different job.
- Stand-alones draw HOLLOW because a stand-alone asserts no equivalence.
- The page must be SERVED, not opened: `file://` blocks `fetch`, and a shard
  that cannot load has to say so.
- `CN:<control number>` names more than one course on 1,814 of 139,834 numbers
  (462 in the source after the declared fold). Refused now. The real worklist is
  73 two-real-course rows, 93 of them at San Jose City College.
- A declared fold reaches only the roster that consults it: `CaÃ±ada College`
  renders that way in the member list, and the raw export carries only the
  broken spelling, 678×.
- A view must not fly where it cannot draw — `draw()` renders nodes only above
  zoom 0.20, and the search reported rings at 0.120.

### Method note

⚠️ **`check_ccr_atlas.js` asserted the OLD search behavior and correctly went
red.** The assertion was rewritten with its reasoning rather than deleted — a
contract change belongs in the guard that encoded the old contract.

⚠️ **A pre-existing failure was measured, not assumed.** `"a shard fetches and
holds descriptions"` fails because `prototype/ccr_desc/` is gitignored and
absent. Confirmed by stashing the diff, rebuilding, and getting the identical
failure on the unmodified prototype.

---

## 2026-09-03 — SkyOrbit (Session 223): the five goals, the orbits, and the shards on Supabase

Sam opened with the funding queue and, finding nothing a session could act on
(dials unset, `CollegeID2` absent on all four views by a fresh probe, only
dependabot PRs open), pivoted: *"the CCR SkyView, which is not yet working as
intended."* Five goals, verbatim: see the whole CCR universe · keyword to jump
to any cluster or course or subject area · course and cluster details on click
or hover, *"including course descriptions on click of a course title … we need
the full number and title and units and if it is a MID, CID, CCN showing on the
course info as you zoom in"* · *"have unassigned course individually in orbit
around the cluster they are most aligned to (rather than having them all sit in
a huge cluster as they are now)"* · *"have SkyView open full screen so users have
more work space and allow scroll down to see the other info you provide now."*

### ⭐ The blob was our own design

Every discipline had a second "· stand-alone" island — Kinesiology's held 2,400
points in one disc. That IS the huge cluster he described, and it was a choice
made for a good reason (a stand-alone asserts no equivalence, so mixing 33k of
them into the clustered islands would bury the 16k identities the merge queue is
about). The orbit keeps the reason and drops the blob: a stand-alone stays a
hollow point, but it sits on a ring around the identity it is most aligned to,
tethered, with the inspector saying WHY. **30,274 of 33,423 found a parent;
3,149 sit on the rim; 327 no-discipline courses matched corpus-wide.**

### ⭐ Corroborators must not outvote the primary signal

The first weighting gave a shared local subject code 3.0, TOP 1.0, units 0.3 and
credit 0.2 beside title 4 × Dice — and *"Swim Training for Competition"* landed
on *"Aerobic Weight Training"* over a swimming identity, because the stack of
cheap agreements (1.5 points) beat a title gap of 0.68. Rule 7's TOP doctrine
generalizes: **a signal that is cheap to satisfy inside one discipline (every
KINE row shares KINE; half share a TOP code) must corroborate, never decide.**
Rebalanced to title 8 × Dice, subject 1.5, TOP 0.5, units 0.15, credit 0.05 —
a full stack is 2.2, which a title gap of 0.28 Dice overturns. ⚠️ **The test had
to pin BOTH directions**: a clearly better title wins, and a marginal gap (0.40
vs 0.33) legitimately yields to shared subject + TOP + units. A guard on one side
lets the pendulum swing past the middle unnoticed.

### ⭐ Key a side table by the write key, never by position

The description shards were `{identity: [text per member, by position]}`, and
the members payload DROPS a member with no control number (2 do). Every later
description on that identity shifts onto the wrong course, silently — the
drill-down looks fine. Re-keyed to `{control number digits: [description, title,
units]}`: the key the write uses is the key the lookup uses, a drop is harmless,
and a layout rebuild cannot invalidate a shard. Titles and units ride along, so
the member record stays `[cn, code, college]` (the 3.1 MB measurement still
holds) and the inspector still shows a course's full name once its shard loads.
KB note: [`methodology-key-a-side-table-by-the-write-key-not-by-position`](kb-notes/methodology-key-a-side-table-by-the-write-key-not-by-position.md).

### The shards went to Supabase Storage

Sam's lean of 2026-08-24 (*"I expect we'll put the shards on supabase"*) is
delivered as the public bucket `ccr-desc`: 159 shards, 50 MB, published by
`scripts/publish_skyview_desc_shards.sh` from a manual workflow and from the
daily run when the unified-courses artifacts changed. Why not commit them: the
48 MB `unified_courses_member_desc.js` already changes in every daily commit, so
committed shards would add 50 MB of churn a day to the repo and every vault
clone. The client tries `./ccr_desc/` first and the bucket second, and the jsdom
suite asserts that order with a mocked 404. ⚠️ **The bucket is empty until the
first dispatch after the merge.**

### ⚠️ Things the harnesses caught, in order

- **A filter that outlived its selection.** A college-course search sets the
  inspector's filter to the code; a later canvas click on an 850-course identity
  kept it, and the card read *"Showing 0 of 0 matching (850 carried)"*. The
  browser harness's cap check went red on `.mv` = 0. `showNode()` now resets the
  filter unless the caller that set it says to keep it.
- **The harness's own sequencing.** Its description check picked the first
  described member on a card — the very course its cross-area-move section had
  moved away three sections earlier. And its shared-key click matched two
  buttons because a collided key can put BOTH its courses on one card (KIN 62C /
  KINES 62C at Santa Rosa). Neither was a page defect; both were the harness
  assuming a state it had itself changed.
- **Two objects, one fixture.** The jsdom suite handed the page nodes from the
  TEST's copy of the fixture, and `selNode === nd` inside the client could never
  hold. The page parses its own copy; the suite now reads it back.
- **Boot is asynchronous in jsdom.** The template boots on DOMContentLoaded,
  which fires after the constructor returns — half the suite ran against a page
  that had not booted, then the boot re-rendered the map under the other half.
- **Two identity ids appear twice in the export** (`ENGL 100`, `ITIS 160`, both
  CCNs), which drew three extra points. The builder keeps the first and names
  the duplicates in its log.

### Verification

`tests/ccr_universe_orbits_test.py` (38 checks: the alignment floor, both
weight directions, ring geometry with no overlaps, shard keying, the committed
payload) · `tests/ccr_skyview_universe.test.js` (66 checks, the REAL template
and client over a six-point fixture: full bleed, one search field, all four
suggestion kinds, member-code jump, orbit card and accept, parent's orbit list,
shard base order, description toggle, rim, shared-key refusal, carry and Escape,
the three label bands, tooltip, hollow-point drag, full screen, inspector fold)
· `prototype/check_ccr_atlas.js` in Chromium, extended for the orbits, the
quick look, the first-screen geometry, the label bands and the member-code
search.

### Next

1. **Sam drives it** — density, inspector width, label bands, the rim.
2. Dispatch `skyview-desc-shards.yml` once the PR merges; the bucket is empty
   until then.
3. Decision packs per discipline on demand; the queue for SUBJ4 breakage.
4. Whether the daily run should rebuild the layout too (NEEDS SAM ②).

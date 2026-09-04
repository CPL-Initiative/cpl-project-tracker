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

### ⭐ Sam's example turned into a rule: orbits cross disciplines

Sam, the same afternoon: *"We have in our CCR queue Business courses that are
assigned to the Business subject while others are assigned to Vocational subject
(a noncredit practice), but there is a small business discipline MQ that would
probably be a better fit for the vocational business courses--so I would want
them to orbit around business or small business (if there are any). Note that
vocational is a big grab bag of noncredit courses and many need to stay there
and some need to be moved to a MID course in another discipline."*

The first build could not do that: a stand-alone was scored only against the
identities of its OWN island (corpus-wide only for the no-discipline pile).
Measured before changing anything: *Small Business Development* is a real MQ
discipline (25 identities, 71 stand-alones); of Vocational's 381 stand-alones,
**264 had a clearly better parent in another discipline** ("Entrepreneur
Start-Up and Business Registration" → a Business identity, "Entertainment
Business – Contracts" → "The Business of Entertainment", "Basic Excel 2" →
Office Technologies' "Beginning Excel"); and **1,882 of the 3,149 rim courses**
had a strong title match somewhere else.

Two rules, both pinned in the builder test. A course filed under a **grab bag**
(`GRAB_BAG` = Vocational, the no-discipline pile) is scored against the whole
reference with a bonus of 0.4 for staying home — his *"many need to stay there"*
— so it leaves only for a clearly better parent. Any other course looks outside
its subject only when nothing at home qualified, and then needs a title Dice of
0.5 or more AND at least two shared title words, because leaving your own subject
on a weak match is how a map starts lying — the first cut let one word carry a
course across ("Mediation Skills" onto "Study Skills Lab"; the `D` of "3-D"
matching any title with a `D`), so one-character tokens are dropped too. A cross-discipline satellite is drawn in its parent's island carrying `h`,
the discipline it is filed under, and both the tooltip and the inspector say so.
Result: **31,350 of 33,423 orbit (1,521 across a discipline line); the rim fell
from 3,149 to 2,073.** Which other disciplines are grab bags is Sam's call
(Interdisciplinary Studies is the obvious candidate) — one line each.

### Also captured, on the fly

- Sam wants **a banner on COBI while he is working with a session** — *"so they
  can drop in and observe and learn how we are working together on COBI."* Filed
  as a to-do with a proposed shape: one presence row a session writes through
  the MCP at start and clears at sign-off, read by every COBI page; a new write
  surface, so it routes through the governance map first.
- Sam's **sign-off template**: the outgoing session writes the exact line he
  pastes into the next session — *"Greetings, you are Sky[next], see Sky[you]
  handoff [link], let's keep rolling with our queue"* — and assigns the next
  moniker. Encoded in `CLAUDE.md`; two additions offered for his veto (the
  session number beside the moniker, the repo path beside the link).

### Verification

`tests/ccr_universe_orbits_test.py` (49 checks: the alignment floor, both
weight directions, ring geometry with no overlaps, shard keying, the committed
payload) · `tests/ccr_skyview_universe.test.js` (69 checks, the REAL template
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

### Later the same day — Sam's three questions, measured (2026-09-03)

Sam read the orbit story and sent three things at once. **The loners.** He wants
the rim courses to orbit on a signal that also reads title and description. A
scratch probe on the committed payload: 2,073 rim courses, 1,600 with a catalog
description, only 20 with generic titles — the loners are real CTE titles with no
identity in their island using the same words. A TF-IDF cosine against each
identity's member descriptions places 130 well inside the home island (≥ 0.40)
and 346 plausibly (≥ 0.30); below 0.30 the matches read wrong. Where the
title-based parent is known, the description's top choice agrees with it 20% of
the time (39% within three), so the description is a gap-filler and never a
tie-breaker over a title. Corpus-wide scoring inflates by chance — college
boilerplate ("competently, directed, repetition") matched Snowshoeing to
Snowboarding — so boilerplate must be stripped and a cross-island match held
higher. The rim concentrates in CTE islands (Industrial Technology 103, Health
94, Dietetics 86, Public Safety 65, Kinesiology 63); a loner with no parent at
any signal is often the seed of a NEW identity, a mint decision the map should
present as one. **Subject vs Discipline.** He believed one subject can carry
several disciplines; the methodology says the reverse (each Common SUBJ belongs
to exactly one discipline; a discipline may carry several subjects, the
umbrellas), measured again at the canonical layer: 146 disciplines, 146 distinct
codes, none shared. His example — "FLNG with Spanish, French, etc." — sits on
the seam between two uses of the word: C-ID calls SPAN a discipline, the MQ list
has only Foreign Languages, and all 265 FL* identities sit under it as subjects.
The cure is labels that name the grain (NEXT ⑧). **Queued messages.** He does
not get read early: Enter queues, the turn's end delivers, Escape interrupts.
Captured verbatim in the vault (CPLBrain #84, #85) and as four `cpl_memory`
rows; two to-dos filed.

Two more from Sam the same afternoon. **"Go with the established CID and CCN subject
codes rather than minting new ones for CSR"** — the CSR minted its own for two June
rulings (the four-letter shape, which 20 of the 62 C-ID codes fail; the not-a-CCN-claim
stance on the language codes), and 122 of 146 canonical codes are overrides for that
reason. **"Retire the use of Z codes… Everything that isn't a CID or CCN should be a
MID"** — the 4,024 Z ids are the machine-built variant clusters Session 56 re-keyed
from `UC-CUR-AUTO*`, not the loners; they fit the M number space by gap-filling and
re-key 4,083 curation rows plus 10,704 merge targets through the alias-map path that
already exists. Both went onto one decision sheet (22 items,
`docs/visuals/2026-09-03-csr-authority-codes.html`). ⚠️ **The sheet's github.io link
returned a 404**: `pages.yml` prunes `docs/` from the deployed site, so a decision sheet
is handed over as a Claude artifact link; the committed file is the record, not the
page.

**Ruled the same evening.** Sam replied by number on all 22 items of the authority-codes
sheet. The sticky one was the shape rule, and his version is better than the one
proposed: *"use CCN if available; if not, stay with 4-characters and add a CID chip with
the verbatim CID code showing; eliminate hyphens."* It keeps the invariant, the parsers,
the fold and the tests exactly as they are, and moves the authority's code to where a
reader looks for it — a chip beside ours — instead of into the identifier. Eleven code
changes, the Z band retired, the legacy ids folded, one re-mint series to run; the plan
is `kb/csr_authority_codes_rulings_2026-09-03.json`. ⭐ **A decision sheet that returns
verdicts the same day is the fastest curation loop this repo has had** — the measured
context was already on the card, so each verdict took him one line.

## 2026-09-03 — SkyTune (Session 224): the chips, the two dry runs, and the allocator that was the wrong tool

Sam's rulings from the evening before were the queue: eleven code changes, the
Z band retired, the C-ID chip, one re-mint series. The day produced three pull
requests and nothing applied — which is the playbook working, not stalling.

### The chip is data plus a display

Rule 3 as Sam shaped it keeps the four-letter invariant and moves the
authority's code to where a reader looks for it. `kb/_seed_authority_codes.py`
attributes every C-ID and CCN subject code to a discipline from the promotions
evidence in precedence order — ruled, then the discipline whose canonical IS the
code, then the corpus majority above item 17's floor of four rows, then a small
name-home table — and a code with a ruled or canonical home never spills onto
the discipline its mis-filed rows sit under (C-ID ARTH's 25 rows under Art stay
with Art History). Measured: 12 disciplines sit on a CCN code, 14 on a C-ID
code, 120 are CSR proposals, 29 show a chip. ⚠️ **One pair the rulings and the
evidence disagree on**: item 17 dismissed `PH` under Health as mis-filed, and the
promotions file carries 30 `PH` rows there. Kept as ruled, listed as unhomed,
put to Sam — a human-sourced ruling is not superseded by a session's count
(Rule 8). The three displays read the same seed fields; SkyView reads the seed
live so the map never lags it and no layout rebuild was needed.

### ⭐ The June allocator is a re-sequencer, and a rename is not a re-sequence

The first instinct was to point `kb/_subj4_dryrun.py` at a scratch seed carrying
THTR, CDEV, ITIS, BSOT, FTVE and COMP. Measured first with the seed exactly as
committed: **62,638 of 70,946 ids would move to change nothing**, all but 148 of
them fate `no_change`. The allocator numbers every bucket by title order, the
title-normalization passes since June changed the sort keys, and the catalog is
no longer at that tool's fixpoint. The rulings' own measured plan had said
"7,921 plain prefix re-keys" — the POLS pattern of July, letters changed and the
number kept — and that is what `kb/_authority_recode_dryrun.py` does for the
whole ruled set: 10,292 ids move, 10,039 keep their number, 253 gap-fill (202 of
them Media Production entering FTVE after Film keeps its numbers), 539 Z ids move
with their namespace. KB note:
[`methodology-a-code-change-is-a-prefix-rekey-not-a-resequence`](kb-notes/methodology-a-code-change-is-a-prefix-rekey-not-a-resequence.md).

### ⚠️ Two allocator defects, one run each

- **One pass cascades.** One stray already keyed `COMP M1001` made `CISC M1001`
  take `M1002`, which was `CISC M1002`'s number, and so on: 554 Computer Science
  ids shifted from one taken key. Two passes — everyone who can keep a number
  keeps it, then the rest gap-fill — and the same input gap-fills one row.
- **Ghosts are not occupants.** The articulation doc's identities map still holds
  pre-fold keys (the S110 class); counting them as taken gap-filled rows for
  nothing. They are reported, 54 of them healed by the move.

Both are pinned on a fixture in `tests/authority_recode_dryrun_test.py`.

### The languages and the families, by rule

Item 10 mechanically: a ruled language takes the code the ruling names; any
other takes its dominant local code when that code is four letters and no other
language holds it; else it keeps the CSR code, flagged. The rule caught its own
edge case: Nahuatl's rows carry `SPAN` (taught in Spanish departments) and would
have taken Spanish's code. Korean, Tagalog, Hebrew, Persian (a tie), Punjabi,
Hmong, Greek and Nahuatl keep their CSR codes; eleven stray prefixes the file
does not know (ARME 18 rows, ARAM, ARMN, HUPA …) are listed for Sam. Item 14 by
two agreeing signals with TOP last in line: 498 rows take a family, 517 stay
residual with the reason on the row, 121 of them viticulture / enology, which has
no C-ID family — a reading.

### ⭐ Retiring the Z band is a gap-fill, and Kinesiology credit has three numbers left

Keeping a Z number was never possible: both sequences started at 1, so 3,836 of
4,053 Z numbers are already M numbers in the same bucket — and the collision
surface is every catalog key, because a merged-away member keeps its id (its
curation rows point at it). `kb/_zband_retire_dryrun.py` gap-fills in
Z-sequence order, composes with the recode receipt (`--after-recode`), folds
218 of the 221 legacy May anchors (122 of which duplicate a catalog identity: a
merge worklist), and reports capacity: **KINE M1 lands at 996 of 999**. The
corroborated shape has no room for the next Kinesiology mint; a continuation
band digit is proposed, Sam's call. The apply must also settle whether these
identities stay curation-only or are materialized into the catalog.

### ⚠️ The dependency map scans `git ls-files`

Both code PRs went red on `--check` once: the map was rebuilt before the new
files were added, so the runner's map had edges the committed one lacked.
Rebuild after `git add`.

### Verification

`tests/authority_codes_seed_test.py` (17) · `tests/csr_authority_chip.test.js`
(18) · `tests/ccr_subject_authority_label.test.js` (10) · five checks added to
`tests/ccr_skyview_universe.test.js` (74) · `tests/authority_recode_dryrun_test.py`
(20) · `tests/zband_retire_dryrun_test.py` (17).

## 2026-09-03 — SkyTune (Session 224), the land

### Sam said yes to all, and the two rules that changed were re-run first

The fourteen readings came back *"Yes to all"* in the afternoon. Two of them
change a rule rather than confirm one: card 9 puts Armenian into
`kb/foreign_language_subj4.json` as `ARME` (its `ARMN` rows fold in), card 10
takes `(PH, Health)` out of the item-17 dismissals. Both dry runs were re-run on
the ruled state before anything was built on them (#1452): the recode grew by
four ids to 10,296, the retirement did not move.

### The applies: apply == spec, gated three ways

Each apply recomputes the plan through the dry run's `compute_plan()` and
refuses to proceed unless it equals the frozen receipt Sam's yes was given
against (P1), unless the overlay is fresh at write-time (P3), and unless ten
conservation gates pass after the mutation (counts, untouched rows byte for
byte, key == course_id, exact keyset permutations, articulation multisets,
overlay integrity, stamps, disjoint key spaces). The retirement materializes
each retired identity as an M-ID record from its members' aggregate and gives
it **no membership entry**, so a college course is never counted twice. Card 2
said the FTVE pair would go in `kb/discipline_aliases.json`; that file folds an
alternate name away in every inference pass, and item 13 keeps both names, so
the pair is recorded on the seed as `fan_in_with` — the deviation is stated in
#1453.

### ⭐ Rehearse on a scratch copy

A copy of `kb/` under the scratchpad ran the whole land first: recode,
retirement, promotions, seed, chips, audit, fold-verify. It showed the
retirement can only verify after the recode is applied (the recode frees
`AGPR M1003`, which the retirement takes), and it printed the numbers the real
run then matched line for line.

### ⚠️ A freshness count must use the sync's own field list

The five-field overlay list the June apply carried reads six fresh
`merge_dismissed`-only entries as deletions (30,688 vs 30,694). A prefix
drill-down named them (`PARN M9003`, `M9004`, `M9015` among them). The apply
now imports `FIELDS` from `kb/_apply_curation.py`.

### What the land moved, and what it surfaced

Recode: 10,296 ids (2,170 minted, 7,587 singletons, 539 Z ids), 491
articulations, 13 identities with one ghost healed, 3,832 overlay keys and
2,842 pointers, 23 counters, seven codes, three umbrellas, twelve language
codes. Retirement: 4,053 materialized, 10,704 pointers, 218 anchors, 254
crosswalk references. Afterwards fold-verify wants 285 re-keys (148 before) and
the audit tags 153 `subject_collision_signal` rows (0 before): 137 materialized
records sit on the June prefix their members' discipline no longer owns
(`ITIS` under Computer Science, `HVAC` under the trades, `ARTS` under Art
History). Materializing made a latent inconsistency visible; the next
keep-number prefix re-key is its fix.

### The Supabase re-key's pace, measured

`supabase-rekey.yml` patches one pair at a time (two PostgREST requests per
pair). Measured on 2026-09-03 against the database's own clock: about two pairs
a second, so the recode's 10,296 pairs take about 85 minutes and the
retirement's 4,271 about 36, run back to back under the workflow's concurrency
group. Read the clock from the database (`select now()`) before judging a
run's pace; a wall-clock guess from the session ran twenty minutes fast and
briefly made the run look ten times slower than it was. A bulk path (a
Postgres function taking the pairs as JSON, called in chunks) would make a
re-key a matter of minutes; it is a NEXT, not a need.

### ⚠️ An alias map can chain, and a naive verify reads the chain as a leftover

The recode re-key (run 33802936877) PATCHed all 10,296 pairs and then failed its
own verify: *old self-keys left: 2*. Nothing was wrong. The map carried
`ARME M10AJ → FLNG M10AJ` (a residual Foreign Languages record that sat on the
ARME prefix since June) beside `ARMN M10AJ → ARME M10AJ` (an Armenian record
moving onto the ruled code). Sorted order applied the first before the second,
so every row landed where the map put it; the verify then counted rows on the
old keys and found two on `ARME M10AJ`, which is also a new key. Two readings had
to be separated to see it: after both runs, 35 of the recode's old keys were
still present on `kb_curation`, and 33 of them were numbers the Z-band
retirement minted after the recode freed them (`AGRI M1001` was `AGRI Z1001`;
the landed overlay carries the same keys, 30,694 in both places). The other two
were the chain. `kb/_rekey_kb_curation_supabase.py` now applies a map
vacate-first (`order_pairs`; a swap aborts) and verifies over the old keys that
are not also new keys (`verify_surface`); `tests/rekey_kb_curation_chain_test.py`
pins it, and that PR also wires the two apply guards from #1453 into CI, where
they had run nowhere (#1455). **A verify has to be written against the shape of
the map, not against the assumption that old and new keys are disjoint** — the
collision surface forbids a target that exists, but the same map can vacate one.

### The fold worklist, measured against the planner of record

The land's "137 materialized records on a prefix their discipline no longer
owns" was read off the audit. Measured against fold-verify (`kb/_subj4_dryrun.py`),
the planner of record, the worklist is 285 rows: 139 materialized records and
146 older strays. Three readings shaped the dry run (`kb/_prefix_fold_dryrun.py`,
#1458). First, a seed-only measure over-counts: 88 Kinesiology records under
`ATHL` are inside a documented span (`KINE`/`ATHL`, made in June so KINE's 999
numbers would not burst), and fold-verify's allowances, not the seed's
`canonical_subj4` alone, define what is off-code; the dry run imports the same
allowances and proves parity (V8). Second, the 146 legacy strays are not
curator rows: their disciplines were set in July by the trail-crew and mismint
cohorts under reviewed plans, and the prefix never followed — the CCR tab has
shown one discipline and the id another for two months. Third, Rule 7 has to
be applied to the evidence, not the row: a materialized record's discipline is
its members' modal, and for seven of them every member was disciplined from
TOP alone, so they are held and listed rather than moved. The allocator is the
recode's, unchanged: 153 of 278 keep their number, 125 gap-fill, none needs a
continuation band, and 30 keys are vacated and taken in the same plan, which
#1455's vacate-first order makes safe. The sheet for Sam is generated from the
receipt, so no number on it is typed by hand.

### Eight notes from Sam's drive, and the faculty view

Sam drove the deployed SkyView the same evening and wrote eight notes as he
went (verbatim in the lane file's NEEDS SAM ①); all eight shipped in #1460.
Three of them changed how the map thinks, not just how it looks. First, the
zoom buttons zoom ABOUT an anchor — the searched subject, the selection, the
last fly — and bring it back to the centre if it drifted off the canvas, so
"search, then zoom" no longer loses the subject. Second, the label leads with
the title and the units in his short form (`Advanced Welding · 3u`); the
number waits for the full band and the hover. That made the search rings a
problem of their own: a subject search had always ringed every course whose
title carried the word, and with titles leading, a Welding search painted 408
red names. A term that names a subject now rings nothing; the term is the
subject. Third, his vision — *"zoom in on a single CCR and see the local
courses that belong to it … so they can feel confident that we associated
their course with the correct CCR course"* — is a fourth kind of point: an
identity OPENS when selected or hovered, its college courses ring it as
squares on spokes over a white halo, each named by code and college radiating
outward, and a square drags like a hollow point does. Opening every identity
at once in a dense island put a neighbor's ring over the identity you meant
to click, so below 4.2× only the selected and the hovered one open, and a
pointer inside the nearest circle always means that circle. The served page
had not been rebuilt since #1441, so the deployed SkyView had been missing
the chip code from #1447 for a day; the harness caught one more gap on the
way — a course just moved onto `MUS 180` (850 courses) landed after the
200-row page cap, on a page nobody opens — so a moved-in course now leads
its card.

### Verification

`tests/authority_recode_apply_test.py` (21) · `tests/zband_retire_apply_test.py`
(16) · the dry-run tests re-run · `tests/uc_zscheme_recognition.test.js` (9,
now pinning the row-less M-ID shape) · the rehearsal on the scratch copy.

## 2026-09-04 — SkyFold (Session 225): the fold apply, rehearsed, and the sixth id-keyed class

The queue's head was the fold worklist the land surfaced (#1458, seven items on
Sam's sheet, unruled at session start), so the session built the apply a reply
by number lands, and rehearsed it end to end on a scratch copy of `kb/`.

### The verdicts are the dry run's flags

Item 2's "hold" is `--scope materialized`; item 3's "fold them" is
`--ruled-held "<who, when: what>"`, which moves the TOP-only rows with the
ruling appended to each row's evidence as the second signal (a row with NO
evidence stays held under any ruling). `kb/_prefix_fold_apply.py` recomputes
the plan under the same flags and P1 refuses a receipt cut under different
ones; `--apply` needs `--ruling`. P0 is per receipt (the receipt's own stamp
plus an era list `_prefix_fold_applied` on each doc) because the held rows are
the NEXT fold's worklist — the recode's never-twice P0 would have locked the
door on the second fold.

### What a fold touches that the recode did not

The materialized records' `_machine_cluster_members` lists (one today:
`AUTD M1040` lists `HVAC M10PR`) — gate G11. The articulation doc's
`identities` map: none of the 278 old ids is a key there, but eight of the new
keys are S110 ghosts (`CARP M10ET` still says "Structural Framing" while
`CNSC M10AS`, "Millwright General Skills - B", arrives). The catalog already
overrides identities-sourced metadata in `excel_to_dashboard.py`'s
`course_meta`, so a ghost is inert for display, but `over_merged` is read
from it — so a ghost on a landing key is dropped and counted, G12. The stamp
is `_prefix_fold_from`, beside the earlier ones: a row can carry
`_authority_recode_from` from the day before, and reusing the recode's stamp
(the planner's first draft said to) would have overwritten provenance.

### ⚠️ A leftover sweep must know a chained key

G13 ("no old id left on any keyed surface") failed on the real tree at the
first verify: 30 keys are vacated and refilled in the same plan
(`ANTH M1099 → SOCI M1099` beside `SOCS M1014 → ANTH M1099`), so `ANTH M1099`
is legitimately live afterward, occupied by the arriving row. The sweep now
covers the old ids that are not also new ids, and G4–G6 (exact permutation,
articulation multiset, overlay keys and pointers) prove the chained ones. The
Supabase verify learned the same thing in #1455, one layer up.

### The rehearsal (scratch copy of `kb/` and `tests/`, 2026-09-04 01:04 UTC)

Apply: 278 aliases, P1 ✓ against #1458's frozen receipt (a fresh dry run on
today's tree reproduces it with zero drift despite the cron's seed edits),
13 of 13 gates; ripple minted 245 · singletons 33 · memberships 113 ·
articulations 54 · curation keys 278 · pointers 404 · member lists 1 · ghosts
dropped 8. Chain: promotions 24 re-keyed (V1–V5 pass), csr-seed, authority
(no chip or canonical code changes — the receipt is byte-identical apart from
stamps), audit `subject_collision_signal` 153 → 113, fold-verify `re_key` 7 =
the held rows, which is what a fold leaves by design; the apply prints that
number so the chain's line is checkable. The planner re-run on the copy plans
0 moves and holds 7. The real land needs only the MCP fresh read and the
ruling text.

### ⭐ The sixth id-keyed artifact class was outside the chain

Scanning every file that names one of the 278 old ids turned up
`kb/crnc_mirrors.json` — 2,836 identity-keyed CR/NC mirror classes, read by
`excel_to_dashboard.py`'s `flags_of()` for the D-3 suppression — with 398 keys
on ids the 2026-09-03 recode retired: the suppression had silently stopped for
those identities. It cannot be regenerated (eleven curated cross-college
mirrors were folded in on 2026-07-12), so `kb/_rekey_crnc_mirrors.py` re-keys
it through the alias chain with `_rekey_promotions.py`'s semantics (one lookup
per map, chronological, `_rekeyed_through` era list, `--baseline-through` on a
first run), gated V1 count conserved · V2 every key live in memberships · V3
idempotent, and runs as step `crnc-mirrors` of the chain. Measured: 398 moved,
one hop each, none converging, none dead afterward; on the rehearsal copy with
the fold pending, 427. Seen and NOT changed: `kb/cid_articulation_joins.json`'s
`current_home` carries 1,068 recode-old ids — nothing reads that field (the
routing uses disposition, control number and cid), and regenerating would
re-derive dispositions from a raw list that has moved since June, which is a
routing decision rather than hygiene. Filed as a to-do.

### Verification

`tests/prefix_fold_apply_test.py` (41 checks: a chained pair, the ruled-held
path, a G11 and a G13 leftover caught, P0 twice, P1 scope and ruling
mismatches, the receipt on disk) · `tests/prefix_fold_dryrun_test.py` (22) ·
`tests/rekey_crnc_mirrors_test.py` (16, the committed file included) — all
wired into `js-tests.yml`.

### Next

1. Sam's reply by number on the fold sheet → one window; the apply's NEXT
   print is the order.
2. The identities map carries 1,605 pre-fold ghost keys (68% of its entries);
   a chain-aware re-key of that map is a cleanup of its own.
3. The `current_home` regeneration decision above.

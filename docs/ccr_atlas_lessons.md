---
title: CCR Atlas — lessons & state
date: 2026-08-24
session: 187 (SkyView)
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
related:
  - "[[CLAUDE]]"
  - "[[docs/ccr_convergence_strategy]]"
  - "[[docs/kb-notes/methodology-measure-your-mechanism-ceiling-before-working-the-queue]]"
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
**794 of the 1,110 Beginning rows (72%)** got there by *default* (no level word
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

- **Sam:** the 794 default-Beginning rows spot-check is still open.
- Re-home `FIMS M1018` out of Enrichment ESL — the first real use of the drag.
- A survivor-member audit before the next packaging pass (the dilution problem).
- Candidate audit rule: an island whose members' disciplines outvote its own label.
- The whole-universe level-of-detail view, and the one-college-many-numbers rule.

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

> ⚠️ **August 2026 sections (Sessions 187–193) moved to**
> [`docs/ccr_atlas_lessons_archive.md`](ccr_atlas_lessons_archive.md)
> **on 2026-09-05** when this doc passed its budget. Nothing was edited
> in the move.

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

### The land (2026-09-04, 01:56–02:30 UTC)

Sam replied *"Yes to all recommendations"* — the seven items as proposed, so
the frozen receipt applied unchanged (scope all, nothing ruled held;
`kb/prefix_fold_rulings_2026-09-04.json`, the sheet stamped Ruled). The
window, in order: the MCP count query (30,694 entries, newest 2026-08-24
18:27:59, equal to the committed overlay); the apply with `--ruling` (P1 ✓,
13 of 13 gates, the same ripple as the rehearsal to the row); the receipt into
`ALIAS_MAPS`; the chain once (promotions 24, **crnc mirrors 29** — the step
added that morning, doing its first real work — no chip or canonical code
changes, audit 153 → 113, fold-verify `re_key` 7); #1463 merged at 02:17;
`supabase-rekey.yml` in 65 seconds (278 self-key and 278 pointer filters
patched, the 30 chained keys applied vacate-first and named, 0 old keys left
over the 248); `daily-dashboard.yml` for the artifacts; SkyView rebuilt on
them. One tool defect surfaced by running the chain twice in a day: the crnc
re-key wrote its receipt to a per-day path, so the evening run would have
overwritten the morning's 398-key receipt — it suffixes now
(`rekey_receipt_2.json`) and the first receipt was restored from main.

Two measurements rode the CI waits. The identities map's 1,597 ghost keys
resolve best from the FIRST map in the chain, the May re-mint: 1,422 land on
live rows (titles agree on 1,254; the rest are normalization variants such as
"Academy I" / "Academy 1"), 175 are dead, 7 converge, 44 land on keys that
already have an entry — so the cleanup is a rebuild-from-baseline re-key with
its own receipt, not a chain step. And `kb/_join_cid_articulations.py`
reproduces the committed dispositions exactly (21,108 joins: 10,741 already
claimed, 9,676 new authority, 615 compatible, 76 conflicts), so a regeneration
changes no routing and only refreshes the unread `current_home`; it was
regenerated on the folded catalog in the follow-up.

### Next

1. The 122 legacy-anchor duplicates as a merge worklist on the CCR tab; the
   promote step for `UC-CUR-*` placeholders; the seven held rows when a second
   signal arrives.
2. The identities map's rebuild-from-baseline re-key (measured above), with a
   dry run and a receipt.
3. Sam's second drive of SkyView; the three HOSP anchors.
## 2026-09-04 — SkyLand (Session 226): the duplicates become a lane, and the twenty were never missing

The queue's head was the fold's aftermath: a check that the first scheduled
cron kept the fold (baseline read on main at 03:50 UTC — 278 fold keys in the
overlay, 0 old ids, 0 pointers on an old id, the audit at 113, SkyView on the
new codes; a check-in armed for 06:45 UTC), the twenty "missing" identities to
measure, and the 130 legacy-anchor duplicates to turn into a worklist.

### The twenty were never missing

The handoff read 31 of the 278 folded ids with no entry in
`unified_courses_members.js` and called 20 of them an export gap to measure.
Measured: all 31 have memberships or a curated `merge_into`; 19 of the 20 are
not rows in `unified_courses_data.js` at all, and every one of them appears in
some C-ID descriptor row's `consolidated_from` — `ARTH M1151` (Modern Art)
under `ARTH 150`, `WMST M1069` under `SJS 120`, `THES M1295` (Stagecraft) under
`THTR 171`. They are Phase B folds: the export's auto-fold consumes an M-ID
whose promotions evidence names one official id and lists it under the
descriptor row, so the members table is keyed by the descriptor and the M-ID
has none of its own. The twentieth, `THES M1087`, is a row whose three member
control numbers all route to descriptors (`_routed_live`), so its member table
is empty by the routing rule. Nothing to fix; `_row_ents` loses nothing.
SkyView draws the export's rows, so the 31 it does not draw are these.

### A receipt measures a worklist once; a lane recomputes it every build

`duplicates.json` was a JSON file the retirement wrote at dry-run time. The
anchors it names render on the CCR tab as locked, read-only rows beside their
twins, and no suggestion lane could pair them: the anchored lane's grouping
skips locked rows on purpose. So the worklist became a lane of its own
(`legacy_anchor_duplicate_groups`, #1465), recomputed from the live catalog on
every build. One group per M-ID anchor of `kb/common_courses.json`, the live
twin(s) first and the anchor last; the match is a STRICT title key (case,
punctuation and whitespace only — the worklist's level-safe signature would
pair Accounting I with Accounting II, which is exactly what a duplicate is
not) on the discipline the tab displays, with a trailing parenthetical dropped
and `kb/discipline_aliases.json` resolving spellings, as the dry run did. A
twin merged away resolves through the flattened `merge_into` map (the lane runs
after Phase B and the routing folds) to the row that displays; a twin that
resolves to the anchor is dropped; an anchor carrying `merge_into` leaves.

The receipt and the live lane disagree on exactly one anchor, and the
disagreement is the point. `THTR M1377` (Beginning Stagecraft) matched
`THEA M1087` in the receipt on the record's own discipline; the fold re-keyed
that twin to `THES M1087`, and the trailcrew-ccr1-s111 bot cohort had written
`discipline: Stagecraft` on it in July — a name outside the MQ list — so the
tab shows the two under different disciplines and the lane, which follows the
tab, does not pair them. The receipt was right about the record; the lane is
right about the display; the bot row is the thing to look at. One pair the
receipt lacked (`PHOT M10RG`) surfaces from the live catalog. 130 groups today
either way; the "122" in two handoffs was a count from before the recode.

### The direction is the survivor rule the worklist already has

Which side survives was the design question. The catalog twin carries the
memberships, articulations, promotions evidence and mirror classes, all keyed
by its id; the anchor carries Sam's May review and no college courses. Folding
the anchor into the twin leaves every keyed artifact untouched and retires a
memberless duplicate row — and the generator already honors it: the anchor
loop skips an anchor with `merge_into`, and the anchor becomes a title variant
on the twin. The tab's `targetMemberOf` picks the first non-Stand-Alone member
by CCN > C-ID > M-ID, so listing the twin first makes it the star with no new
rule. When the only twin is a single-college Stand-Alone (31 of 130) the same
rule makes the anchor the survivor: the stand-alone folds in, the anchor gains
its first college course, and the merge-target loop synthesizes the row from
the anchor file (`_member_v` reads `cc`). The curator can flip the star. The
lane is exempt from the cohesion slider — an exact duplicate is not a
similarity score — and its badge is words on First Light tokens.

### Verification

`tests/legacy_anchor_duplicates_test.py` (27 checks: the strict key, the
discipline gate, the alias and parenthetical resolution, the live-target
chain, the member order that IS the merge direction, and the committed files —
every receipt anchor offered, merged, or explained by a curated discipline)
runs in `js-tests.yml` beside the merge-chain lint; `tests/uc_worklist_legacy_anchor_lane.test.js`
(21: the lane leads, the words-only badge, the star on the twin, Confirm
writing `merge_into` on the anchor and never the twin, the stand-alone case
writing on the stand-alone, the slider exemption, the hand-off into the
anchored lane). All 27 existing worklist and CCR jsdom files green.

### Next

1. The promote step for `UC-CUR-*` placeholders (mint M numbers from
   `Buckets`; 0 exist today); the identities map's rebuild-from-baseline re-key
   as a dry run with a receipt; the seven held rows when a second signal
   arrives.
2. Measure how many curated `discipline` values sit outside the MQ list (the
   `Stagecraft` row is one); the audit may already tag them.
3. Sam drives the new lane: the first 130 groups of Suggested merges are his
   May anchors; his confirms drain it.

### The promote step, built before the first placeholder

The Z-band retirement left one door open: a client mint on the CCR tab
(`doConsolidate`) and the auto-merge bot both still write a transient
`UC-CUR-*` target into kb_curation, and the Z scheme that used to number them
is retired. `kb/_uc_cur_promote.py` closes it in the retirement's own shape:
a placeholder becomes a real M-ID record (Sam, card 12), the discipline's
canonical SUBJ4 (an umbrella keeps the members' split code), band 9 noncredit
or 1 credit, the lowest free number with every id ever minted reserved —
courses, singletons, curation keys, identities, the anchors, every id any
ALIAS_MAPS receipt ever named, the CCN and C-ID reservations — and the
continuation band when a bucket is full (card 11). The record is the
retirement's aggregate re-stamped (`_promoted_from`; origin `curator mint`, or
`machine cluster` for a `UC-CUR-AUTO` target; a client mint keeps its curator
as `reviewed_by`), with no membership entry of its own. What it will not do is
guess: one pointer (a mint is a merge), no discipline on the row or the
members, no four-letter code, no readable band — each is held and reported.
Dry run by default with a receipt; `--apply` needs the receipt and a fresh
read, and the same P0 · P1 · P3 gates plus eight post-mutation gates the
retirement used. Thirty-two fixture checks, including the 004-taken-by-an-
alias-map case and the full WELD bucket continuing to `M2001`. Zero
placeholders exist today; the tool exits saying so.

### The identities map, planned

The third build of the session is the dry run the handoff asked for:
`kb/_identities_rekey_dryrun.py` resolves each of the 1,597 ghost keys in
`kb/coci_articulations.json`'s `identities` map through the full ALIAS_MAPS
chain with `_rekey_promotions.resolve` (one lookup per map, in order) and
dispositions every one: 1,369 re-key onto a live id that has no entry; 44 land
on a live id that already carries one and drop (the live entry was computed on
the current catalog); 16 converge on 7 targets, where the ghost whose title
agrees with the catalog wins, then the one with more colleges, then the
alphabetical first (9 drop); 175 nothing names again, and nothing can display
them. Titles agree on 1,217 of the 1,369; the 152 that differ are "I" versus
"1" and their kin, which the catalog overrides anyway. The apply exists in the
same file and needs the receipt and a ruling; the receipt is committed
(`kb/identities_rekey_out/2026-09-04/`) and its report carries the five-item
sheet Sam will see. It is not an ALIAS_MAPS receipt: it re-keys a side table
and mints nothing. Twenty-three fixture checks, including the chained
resolution and the three tie-breaks — the first cut recorded the first
criterion the winner satisfied rather than the one that decided, and the test
caught it.

### The check-in, 06:46 UTC

Run 446 (the dispatch after #1465 merged) rebuilt the overlay from Supabase
and every fold invariant held on its main: 278 fold keys, 0 old ids, 0
pointers on an old id, the audit at 113, all 2,836 mirror keys live, SkyView on
the new codes, members 247 — and `legacy_count` 130 in the published
suggestions payload, the lane's first publication. The 06:17 UTC rung of the
cron ladder had not fired by 06:46, nor had any rung by 10:17; the day before,
GitHub had slipped all three by four to five hours. One correction to the
first draft of this note: `kpi_history.json` is keyed by Pacific date, so run
446 (21:42 PDT on the 3rd) refreshed the 3rd's entry rather than writing the
4th's — today's entry needs a run after 07:00 UTC, and a dispatch before the
Pacific day ends is the Rule 3 fallback if the schedule never fires. The
fold's proof is the invariants, which a scheduled run reproduces by the same
steps a dispatch does.
## 2026-09-04 — SkyMint (Session 227): item 2 was a grain error, not a missing link

Sam's SkyView queue item ② read *"Add CCR List View link + clarify existing
labels."* Both halves turned out to be about the same confusion.

### "CCR list view" names a view that is not in this prototype

The candidates inside SkyView were `__ccrDiscipline` (the discipline card) and
`__ccrSubjectList` (the list) — and neither is the CCR *list view*. That is
**COBI's Common Course Reference tab**, which is the page this map is embedded
in: `unified_courses.js` mounts `prototype/skyview.html` as an iframe beside the
list. So the link is a link **out** (`../index.html#unified-courses`, new tab),
and it has to disappear when framed:

```js
var cl=document.getElementById("u-ccr-list");
if(cl && window.top!==window.self) cl.remove();   // the list is already the page around this frame
```

⚠️ Same rule as the ESL link's `ne.remove()`, one step further: **never offer a
door onto nothing — and never offer one onto the room you are standing in.**
Inside the CCR tab the link would open a second copy of the page the reader is
already looking at, which is worse than absent because it looks like it worked.

### "Subjects as a list" listed disciplines

`__ccrSubjectList` maps `U.islands` and reads `I.d` — the **discipline** name.
So the two links differed only in FORM: "All disciplines" showed the same things
as cards. And the word was already spent elsewhere: COBI's **Common Subjects
Reference** tab is about SUBJ4 codes (`ENGL`, `WELD`), a different grain
entirely, so a curator reading "subjects" in SkyView had every reason to expect
codes and got disciplines.

Every rendered use is now "discipline" — the nav link, the view's heading and
filter, the legend, the hint, the keyboard announcements, the details panel, the
suggestion rows. Two things deliberately did NOT change:

- **`kind:"subject"` stays** as the internal branch key (`s.kind==="subject"` has
  readers); only `kindWord`, which is what a reader sees, became "discipline".
  The test asserts both, so the two cannot drift into one another.
- **"subject code" stays** wherever it means SUBJ4 — the C-ID chip title, the
  orbit reason, the rim explanation. Sweeping a word is not the same as
  sweeping a sense, and this file's own rule about `american_spelling` applies:
  scan prose, never blind-replace.

This closes the SkyView half of the lane's queued NEXT ⑧; the CCR tab's dropdown
labels (Subject as `CODE — title — discipline`) are still open.

### The sweep caught the link I had just added

`npm run a11y` reported all four `.linkish` controls in the top row at
**21.3px** against WCAG 2.2 SC 2.5.8's 24px floor — including `#u-ccr-list`,
written minutes earlier. The inline-target exception covers a link inside a
sentence; a nav row of view switchers is not one. `display:inline-flex` is what
lets a `min-height` apply to an inline-level control at all.

It also reported an `h1 → h3` skip: the two panels below the map are headed
`<h3>` under the page's `<h1>`, with no `<h2>` between. Fixed as `<h2>` with the
size pinned to what the `h3` measured (18.4px/700), so the correction is to the
outline a screen reader walks and not to the page. SkyView now passes the sweep
clean at every width.

⚠️ **Both were found by running the instrument on my own change, in the same
session that shipped it.** That is the second time in two days
([`public_pages_a11y_lessons`](public_pages_a11y_lessons.md)) — which is the
argument for the command being cheap rather than for anyone being more careful.

### The top row, and the search that was never broken (same session, later)

Sam's items 1-5, 10 and 11 (PR #1476). Item 11 read like a bug report about a
widget — *"the keyword search in full SkyView has a bug and doesn't allow me to
click into it"* — and the widget was fine. **The page's one search field lived in
the masthead, and browser full screen paints only the element you asked it to
paint.** `#u-full` is the map section, so in full SkyView the box was not hard to
reach; it did not exist. Its own note:
[`methodology-ask-which-container-before-you-debug-the-control`](kb-notes/methodology-ask-which-container-before-you-debug-the-control.md).

Three things worth carrying:

- **`innerHTML =` detaches, it does not destroy.** The map now BORROWS the
  page's one search form so the page still carries exactly one. Every other view
  replaces `#view` wholesale, which would take the borrowed form with it — and a
  detached node nobody references is gone, listeners and all. `homeSearch()`
  returns it first, and it is wrapped **centrally** around the five view entry
  points rather than called from each: they live in three files, and a missed
  call site is invisible until someone navigates.
- **A closed `<details>` still LAYS OUT its contents in Chromium.** It declines
  to paint them; it does not remove them from layout or from a forced `focus()`.
  `npm run a11y` measured all four menu items escaping the viewport at 390px and
  reported them as focusables with no ring. `display:none` on
  `.u-views:not([open]) .u-views-menu` is the difference between a hidden menu
  and a hidden keyboard trap.
- **A fitted zoom makes its own readout meaningless.** The old subject fly used
  `Math.min(3.2, 190/I.r)`, so the same gesture landed at a different
  magnification on every discipline and the percentage in the corner told the
  reader nothing. Item 10 asks for exact figures — 1000% for a course, 150% for
  a discipline — and exact is what makes the number worth showing.

⚠️ **Reverted within the hour: hiding the search's submit button** as "redundant
beside a live suggestion list". The row has slack at every width that fits one
row, Sam never asked for it gone, and a control present in the DOM but invisible
at desktop widths is one a harness clicks and a person cannot. The harness caught
it in the same run that introduced it.

⚠️ **And the title came back.** A title in this row was tried on 2026-09-03 and
removed, because it pushed the view links under the MASTHEAD's absolutely
positioned suggestion list and Chromium reported them unclickable. It returns
only because the same edit moves the search into the row — the dropdown now
belongs to this row, so there is nothing above the links to hide under. The test
pins **that pairing**, not the title's absence: a guard written against the old
symptom would have blocked the fix.
## 2026-09-05 — SkyQuiet (Session 228): what he saw, not what we changed

Sam opened with three asks, and the first carried a verdict on three sessions
of work: *"Make sure the CCR menu button opens the full screen SkyView, not the
version it currently opens to. I've made several requests for this so far and
none of them have worked."*

### Three attempts, three mechanisms, one unchanged screen

He was right, and the pattern is worth naming. 2026-08-25, "SkyView should be
the initial CCR tab": Session 192 made the iframe the tab's landing view.
2026-09-03, "have SkyView open full screen": `allow="fullscreen"` on the frame,
so the map's own button stopped being refused. 2026-09-04, "open Skyview from
CCR side menu link directly to the full window version of SkyView, not another
view": a separate side-menu link to the page. Each was a real change and each
was plausible from inside the code. What the tab SHOWED when he clicked it never
moved: a boxed frame under a beta banner, a heading with a launcher, a toggle
row and a note, and inside the frame a masthead, then the map, then panes.
Nothing in that picture is "full screen".

The third ask supplied the definition the first two attempts lacked: *"The full
screen SkyView (which I would like to henceforth refer to as SkyView, but I
haven't because it keeps apparently getting confused with the original
SkyView)."* Full screen, to him, is what the Full screen button paints: `#u-full`
and nothing else. "The original SkyView" (masthead, map, panes) is now **the
comprehensive view**, reachable from the Views menu and never the default.

⚠️ The lesson generalizes, and it is in `CLAUDE.md`'s naming section and its
own KB note: when an ask comes back a third time with "none of them worked",
diff what the reader SEES against what they asked for, not what the code does.
Three sessions verified mechanisms; one screenshot would have failed all three.

### Solo is a class, not a second render

`body.u-solo` hides the masthead, the crumbs row, `#u-below` and the footer; the
canvas takes `innerHeight` minus the top row and the legend strip, the same
arithmetic `fitCanvas` already used for browser full screen. The comprehensive
view is the SAME render with the class off, and that is the point: switching
keeps the zoom, the selection and the moves, because nothing is rebuilt. A
`__ccrUniverse({solo})` call on a page already showing the map only toggles the
class; a bare `__ccrUniverse()` keeps the frame you were in, so the list's row
click and the suggestion jump come back where you left. Narrow screens keep
scrolling (the details panel docks under the canvas there and needs the room);
`overflow:hidden` applies from 700px up.

### One menu builder, and the item that is not offered

Item 9, every view reachable from every other, was two menus in two files until
it was one function. `viewsMenuInto(host)` renders the same `<details>` into the
map's top row and into the crumbs row of every other view; the view you are on
is a muted name with `aria-current="page"`, not a button, because a menu item
that leads where you already are is a control that appears to do nothing.
Framed inside COBI, the "CCR table view" item becomes a button that posts to
the page around the frame, and an "Open in its own tab" link appears.
Stand-alone, the link out points at `#unified-courses/list`: the tab itself now
lands on the map, so a link to the bare tab would have opened a second map.

### "Subject" is the SUBJ4 grain, and now it has a view

SkyMint's handoff carried the constraint that made item 6 more than a rename:
"All disciplines" and "Disciplines as a list" both listed disciplines, and his
"view by subject" is the four-letter Common SUBJ code an identity is keyed by.
After the 2026-09-03 recode those codes ARE the identity ids' prefixes, so the
subject rows are read off the map itself, 344 codes across 159 islands, and
joined to the seed for the standing column: *the Common SUBJ of Business* (with
its C-ID chip), *an umbrella code under Foreign Languages*, or *not Business's
code (its Common SUBJ is BUSI)*. TOP plays no part (Rule 7). The three legacy
anchors read `M-ID HOSP 102` and take the second token. *On the map* flies to
the discipline that carries most of the code at 150% and rings its identities
up to 150; past that the count in the hint says more than the rings would,
which is the 408-red-rings lesson of 2026-09-03 applied to a second grain.

### The harness found the search box dying, one click in

The moment the harness reached a discipline cell under the comprehensive map,
`#gq` was gone. The embedded forest's cells call the template's own
`discipline()`, not the wrapped `window.__ccrDiscipline`, so the view was
replaced without the borrowed search form going home, and `innerHTML =`
detaches, so the page's one search field simply ceased to exist. Latent since
the box moved into the top row on 2026-09-04; never seen because the harness
had only ever reached those cells from the stand-alone forest. The fix is not
another wrapper: `setCrumbs()` is the one call every view makes before it
renders, so it now sends the box home and names the view being entered. The
wrapper stays as the belt to that brace.

### The solo view had no heading

`npm run a11y -- skyview` on the new default: *headings start at h—(none)*. The
page's h1 lived in `#u-below`, which solo does not paint. The row's "SkyView"
title is the h1 now, sized to the row; the panes' headings step down under it
(h2, h3), and the embedded forest's hero heading steps down with them. Five
routes swept, all green.

### COBI's tab, and what the frame is allowed to be

Map mode adds `uc-map-on` to the pane: the beta banner, the heading with its
launcher and the toggle row hide, the container's padding and 1400px cap lift,
and the frame takes `innerHeight` minus its own top. Measured, not assumed,
because the COBI header's height is not the tab's to know, and measured AGAIN
after the frame and the fonts load, because the first measurement caught the
header before it settled and the frame ended 142px short until it did. Close
and "CCR table view" arrive as `postMessage` from the frame and are honored
only when `e.source` is our frame's window. The list keeps its toggle and
launcher, and `#unified-courses/list` is the hash that lands on it.

### Verification

`tests/ccr_skyview_universe.test.js` 131 → 157 (solo and its hash, the menu's
current marker, routing, the workspace on both grains, the subject index, the
rings); `tests/ccr_skyview_first.test.js` 26 → 37 (the map-mode chrome, the
message hand-off honoring only our frame, the `/list` hash both ways);
`npm test` 300 files green; `prototype/check_ccr_atlas.js` rewritten for the
workspace, the comprehensive view and solo geometry, every check green in
Chromium with the shards built locally (`--shards-only`, 24 s, gitignored);
`npm run a11y -- skyview` green on all five routes. The CCR tab's only sweep
finding is First Light's 15px greeting opt-out checkbox, chrome-wide and in
the backlog. PR #1479.

### Next

Sam drives the three asks. His reaction to the standing column is the thing to
watch: it is the first SUBJ4 view a curator has had, and every "not X's code"
row is either a stray the fold missed or an umbrella the seed does not know.
## 2026-09-05 — SkyKeep (Session 230): the second list, and a class toggle is not a re-render

Sam's second SkyView list arrived with two screenshots marked YES (the map
alone, no COBI header) and NO (the map inside COBI's chrome), then a third of
the OS window controls, then a fourth of Obsidian's canvas controls with the
note *"These are nice controls from obsidian"*, and mid-run: *"add a hamburger
menu glyph in upper left that can open the COBI side bar — should be default
collapsed on open."* One PR (#1481).

### What shipped, in his order

The full window on the CCR click: `body.cpl-skyview-solo` takes COBI's header,
rail, hamburger and To-Do button out and gives the frame the viewport; the rail
becomes the slide-over it already was below 900px, at every width, and opens
from the frame's ☰ by `postMessage` (menu · dock · undock · ready, answered
with `skyview-host {docked, menu}`). The window controls are three states and
two steps: 0 the page or COBI around the map, 1 the map alone, 2 the browser's
full screen; the left control steps down, the middle steps up, the close is the
same close. The Full screen chip went; the Hide legend chip went (the legend
folds from the map's own corner, the word unbold with a fold mark); Details
reads Sidebar; the Search label is the placeholder; the zoom label stacks over
its percentage; every chip in the row is 30px with a 6px corner, the search box
and its button included. Show is a menu of twelve switches. Views is Go To and
carries How SkyView works. The search became a selection of chips. And a dark
canvas.

### A class toggle is not a re-render

The window controls painted their state in `wire()`, once per render. But
`__ccrUniverse({solo:false})` on a page already showing the map does not
re-render: it toggles `body.u-solo` through `setSolo()`, keeping the zoom, the
selection and the moves (S228's design). So stepping down left the old
control's state on screen — the jsdom check saw state 0, `u-solo` off, and a
down control still enabled. The fix is one line: `setSolo()` calls
`paintWins()`. The rule underneath is the 2026-09-04 one ("paint the state,
never hardcode it in the markup") with its second half: paint it from EVERY
path that changes the state, and a class toggle is such a path.

### A dimmed inert control fails the sweep twice

The first cut disabled the down control at state 0 with `opacity:.45`.
`npm run a11y` failed the comprehensive route on it twice over: 2.04:1 for the
glyph, and "focusable with no ring", because the checker reasons from the tag.
Not painting it at all (`hidden`) passes both and is what Sam's glyph rule asks
for anyway: a mark that cannot say what it is for should not be there. And the
`hidden` attribute needs its own CSS line when the element's display is set by
a class — `.u-top .u-win{display:inline-flex}` overrides the user agent's
`[hidden]{display:none}`.

### A search means a search

"Make it multi-select capable" had one design question: what does Enter do
once picks accumulate? A pick from the list ADDS a chip; Enter REPLACES the
selection with one term chip. One chip behaves exactly as a single pick or
search always did — the 157 existing checks kept passing untouched — and
several chips ring every course, outline every discipline and fit them all.
Backspace in an empty box drops the last chip, the token-input convention.

### The canvas palette is CSS tokens

First Light says `var(--token)`, never a raw hex; a canvas cannot read CSS. So
`readPal()` asks the body's computed style for each `--sky-*` token at draw
time, `body.u-dark` redefines the set, and the legend swatches moved from
inline colors to classes on the same tokens — one rule set colors the chrome,
the legend and the canvas. jsdom answers "" for every custom property, so the
light values are the fallback and every existing check kept its colors. The
dark ground is opt-in and remembered per browser; every text pair on `#1E1E1C`
is measured (ink 13.9:1, body 11.0, muted 6.9, the on-dark cobalt 6.5).

### The harness met COBI's greeting

The first Chromium drive of the framed page timed out clicking ☰: First
Light's first-visit greeting dialog (`.cplfl-overlay`) sat over the frame and
intercepted the pointer. A harness that drives COBI has to do what a
first-time visitor does — dismiss the greeting — before it can reach anything.
Recorded because it will meet the next harness too.

### What the Obsidian screenshot gave, and what it did not

Taken: the trio of window controls in the title row, a sidebar toggle at the
top left, a dark ground. Left: the right-edge vertical rail of glyphs (zoom in,
reset, fit, zoom out, undo, redo, help). The row already carries those as
words, and a second copy as glyphs is exactly the noise his glyph rule names;
whether the words should BECOME the rail is his call, and the lane file asks.

### Verification

`tests/ccr_skyview_universe.test.js` 157 → 188 (the row, the Show switches,
the legend fold, the window states, the tokens, the dark canvas, the
explainer); `tests/ccr_skyview_first.test.js` 37 → 51 (the full-window class,
the menu / dock / undock / ready messages, the source check, leaving the tab);
`npm test` green; `prototype/check_ccr_atlas.js` green with the shards built
(`--shards-only`); `npm run a11y -- skyview` green on six routes at three
widths; a Chromium drive of `index.html#unified-courses` confirmed the full
window, the rail from ☰, the outside click, dock, undock and close.

### The header's second cut: the header's own vocabulary

Mid-run Sam sent a screenshot of Claude's own header — small ghosted icons at
the left, a title in a rounded field, expand and close at the right — with
*"If you can further simplify and complete SkyView header components by
incorporating features like your own header, please do it."* So the row lost
three word chips (Go To, Sidebar, Dark) to ONE More menu that holds *Go to*
(every other view, rendered flat under a heading rather than as a menu inside a
menu), *Show or hide* (Sidebar, Legend, Dark canvas, each a row with an on/off
word) and the doors out; Out / In / Reset became − % + ↺ in one bordered
group; the title became a field; expand (⤢, ⤡ in full screen) took the middle
window control. Every icon carries words as its accessible name and tooltip,
and the text controls stay words in boxes — the icons are his ask, twice over
(the OS trio on 2026-09-05 morning, the header that afternoon), which is what
the glyph rule requires: a mark that proves its worth.

⚠️ **One id collision cost twenty minutes.** The menu was `id="u-more"`, and
`#u-more` already existed: the forest's host under the map. `getElementById`
returned the menu, and the comprehensive view rendered the entire forest inside
it. The check that caught it was "the details panel starts hidden", failing
with *no element* — the sidebar row had been overwritten. A new element takes a
new id, and a grep for the id before minting it is cheaper than the debugging.
## 2026-09-05 — SkyKeep (Session 230), the same afternoon: the third list, and Obsidian as the reference

Sam drove the second cut within the hour and sent a third list, then two
screenshots of Obsidian's graph view: *"See how obsidian uses dots for item,
which we could do since we don't put info in the course circles, and see how
it spreads more"* · *"color-coded dots to match our legend"* · *"Note how when
you click on an entity, it shows the connections in contrast to unclicked."*

### What "Show: 1 of 12" was

His first screenshot read "Show: 1 of 12" in the row: eleven switches off,
which is exactly the state in which an identity's hub and its spokes draw and
no course does. A drive of the same pick landed with every switch on, and the
menu's clicks, keyboard, "Show everything" and a row re-render all behaved;
how his got there is not known. What changed: a pick now switches on what it
needs to be seen (the point's credit status, its system, its kind; for an
identity the college courses and the orbit) and the hint says which, and the
row's tooltip names what is hidden. A pick that lands on a hidden point was a
ring around nothing.

### The rest of the list, in one pass

- The sidebar hides from its own bar (*Hide*) and resizes from a grip on its
  edge — dragged, or nudged with the arrow keys, Home resets — remembered per
  browser as a custom property the CSS reads for the flex basis.
- Every suggestion row carries a checkbox, the list is `aria-multiselectable`,
  a pick from the list toggles, and the list stays open with the term still in
  the box, so a second pick is one more click. ⚠️ The toggle belongs to the
  LIST only: `__ccrGoSuggestion` is what the workspace and the sidebar call to
  go somewhere, and making it toggle broke five tests that open a discipline
  twice. Two entry points now: `__ccrToggleSuggestion` for the rows.
- *Clear* looked like a large underlined link because `.linkish`, defined
  later in the stylesheet at the same specificity, overrode the chip rule.
  *Clear* and *Fit all* are `.u-tokens .u-tok-act` chips at the tokens' size.
- The title is a word, not a box. The Search button is gone; the one field
  submits on Enter, and the harness presses Enter where it clicked.
- The newest pick gets the focus (the single-pick fly and details) and every
  pick stays ringed; *Fit all* is the word for the union. Fitting all three of
  his picks had landed at 26%, three unmarked circles on a whole map.
- Rings are thin at every zoom (`ringWidth`).

### Dots, spread, and the click highlight

The builder packs every point with a footprint (`nodeRad`); the mark drawn is
now a DOT inside it (`dotRad`: 0.66 of the footprint for an identity, 0.62
for a stand-alone), so nothing moves and the air between points is the
difference. Identities are solid dots in their system's color; stand-alones
are smaller, lighter dots (alpha 0.6); noncredit keeps its broken ring, drawn
just outside the dot. The islands spread apart once at load (`spreadUniverse`,
×1.22 about the map's center; radii unchanged, nodes translated with their
island, bounds rescaled) — in the client rather than the builder because the
layout payload is a committed 7 MB file no workflow regenerates, and a factor
in the client is a knob. ⚠️ The jsdom tests flew to typed fixture coordinates
(`-120, 0`); they now READ positions from the page's copy (`AT(id)`,
`AT_I(discipline)`), because a coordinate in a fixture is where a point was
packed, not where it is drawn.

The click highlight is Obsidian's: a selected identity lights its orbit ties
solid in the selection color and every other point fades to 0.3; a selected
stand-alone lights its identity; a click on empty ground drops it and keeps
the panel. Our edges are the orbit ties and the college courses under an
identity — Sam's own reading of Obsidian's (*"it uses the generated tags from
our .md artifacts"*) maps onto them.

Verified: jsdom 210 checks, the Chromium harness, `npm run a11y -- skyview`
(six routes, three widths), and a drive of the pick, the grip and Hide.

### Two more, at the session's end

Sam, signing off: *"need to add a Deselect All option on the Show:All drop
down AND need to be able to zoom to 7k — needed when working on a single
course."* Both shipped before the session closed: **Deselect all** beside
Show everything (every switch off, then tick the one or two wanted; the row
reads "0 of 12" and the hint counts what is hidden), and `K_MAX` 60 → 70. The
radius taper above `RAD_KNEE` is what makes 7,000% usable: the dot stays a
dot while the positions keep spreading.
## 2026-09-05 — SkyReply S231: two reports, and neither control was broken

Sam, opening the session: *"1. Search box only delivers a short set of options
and should show all or at least allow scroll to show others. 2. Show:All box
does not respond when making changes. 3. Test other functionality to make sure
everything works."*

**Both were true, and neither was the control's fault.** That is the reusable
part: a control reported as broken is worth ten minutes in a real browser
before it is worth a line of code, because the two cases below would each have
attracted a plausible fix that changed nothing.

### The search box was already scrollable

`.sug` has carried `max-height` + `overflow-y:auto` since it was written. The
fault was one number in the caller: `__ccrSuggest(term, 8)`. Measured in
Chromium, "art" rendered **8 rows against 200+ matches** — there was never
anything below the fold to scroll to, so the box Sam was asking for already
existed and had nothing to show him.

⚠️ **Raising the limit alone would have half-fixed it.** The budget inside
`suggest()` was written for a list of eight — disciplines took `limit-4`,
courses `limit-2` of the rest — and read at sixty it starves the tail: a term
matching many disciplines pushes every course off the end. The budget's JOB
changed when the list became scrollable. It is no longer there to keep the
dropdown short; it is there to stop any one kind from crowding the other two
out of the TOP of it. So each kind gets a share with a floor and **whatever a
kind cannot fill flows to the others** — otherwise a term with no college
courses returns 45 rows and a gap, which is the original complaint again.

Two more that only appear at depth: the candidate pool (`pts`) was capped at
400 and that cap **truncates by island order, not by relevance**, so at a limit
of 8 it never mattered and at 60 it decides the list — raised to 3,000, which
costs nothing because a term matching little walks the whole corpus either way.
And the arrow keys had to start carrying the viewport (`scrollIntoView({block:
"nearest"})`): a cursor walking off the bottom edge of a still list reads
exactly like a list that has stopped responding.

### The Show switches were never inert — the map was

Courses are only drawn past `NODE_ZOOM` (0.20). **SkyView opens at k = 0.100**,
three zoom steps below it, because 49,896 dots at 10% are a smear and the
disciplines are what is worth reading there. So every switch changed its label,
changed the count in the hint, and moved **nothing whatever** on the canvas.
Measured, stepping the zoom up from the opening view:

| k | 0.100 | 0.141 | 0.197 | 0.276 | 0.386 |
|---|---|---|---|---|---|
| a filter change alters the canvas | ✗ | ✗ | ✗ | ✓ | ✓ |

⭐ **The fix is not to draw the dots — it is to let the filter reach what IS
drawn.** A discipline holding no course that passes the switches is no longer
drawn (`islandPass`, memoized on a signature of the twelve switches, because
`draw()` runs every pan and zoom frame). Deselect all now empties the map at
the zoom it opens on. `pick()` honors the same filter — filtering to noncredit
and clicking where a credit course sat was opening the inspector on an
invisible point, the filter honored by the eye and not by the hand.

⚠️ **And that created a second-order problem the sweep caught, not a test.**
Dropping an empty discipline means picking that discipline from the search list
lands on nothing at all. `healShow` had answered this for a COURSE pick; the
discipline branch called `healShow(null)`, which turns on `ident` and nothing
else, and a typed search never healed from either of its branches.
`healIsland` / `healHits` close it — **and only when NOTHING passes.** A filter
the reader set stands as long as it still leaves them something to look at;
healing a filter that is working is how a control starts fighting the person
holding it. Pinned in both directions in the test.

### What testing everything else was actually worth

The sweep — 32 checks driving the real page, 14 more inside COBI's CCR tab —
found two things a green suite did not:

1. **`skyview.html` shipped one edit stale.** The built page is an artifact
   assembled by `build_ccr_atlas.py`; the jsdom tests read `ccr_universe.js`
   directly and passed, while the served page had never seen the last edit.
   **The build is part of the change, not a step after it.**
2. The heal gap above.

And two that looked like bugs and are not, recorded so nobody "fixes" them:
**Clear and Fit all only render past ONE chip** (with one, its own × is the
clear), and **the side rail closes on a click outside it**, not on a second
press of ☰ — it is a slide-over with a full-viewport scrim, so the second press
lands on the scrim and closes it anyway. A harness that clicks through frames
has to drive both from the parent page.

⚠️ One thing found and NOT fixed: in COBI's CCR tab the First Light greeting
(`.cplfl-overlay.open`, `z-index:12000`) covers the whole SkyView frame until
dismissed. It is a modal greeting with a working close button and it greets a
browser once a day, so it is behaving as designed — but a harness meets it on
every fresh profile, and a click on anything in the map times out until it is
cleared.
## 2026-09-05 (evening) — SkyReply S231: the course outline, planned not built

Sam, after the two bug fixes: *"I would like the courses on double-click to open
a basic course outline with real data you pull from CID, CCD, or the MID data we
have plus a synthetic course description you create on the fly … editable and
then verifiable by faculty reviewers in this process. Plan and recommend before
taking action."* What followed was six more messages that turned a feature
request into the lane's purpose. Nothing was built; the prototype is a Claude
artifact on live **WELD M1109** data (Introduction to Welding, 24 member
colleges).

### The three sources are not comparable, and that shapes everything

The ask names C-ID, CCN and M-ID as if they were three flavors of the same
thing. Measured:

| Source | Clustered identities | What it gives |
|---|---:|---|
| C-ID | 484 (473 with a descriptor) | Official approved descriptor prose |
| CCN | 57 | Title and number — **no descriptor text exists** |
| M-ID | 15,937 | No authority text at all |

So **97% of the corpus has no authority prose** and the outline is built from
member catalog descriptions plus the CO's course-basic file. That file joins on
`"CCC" + control_number.zfill(9)` — the first join attempt returned 0 of 24
because SkyView stores the digits stripped — and on the test course matched 22
of 24, giving units, TOP, credit status, transfer and SAM. ⚠️ It carries
**units but not hours**, so three MC slots (`lecture_hours`, `lab_hours`,
`outside_of_class_hours`) stay unsourced even with it.

### The synthesis works, and its evidence base varies by an order of magnitude

For WELD M1109 all 24 members carry a description and they converge hard —
17 name SMAW, 15 safety, 15 oxy-fuel, 15 GMAW. A description drafted from that
is defensible and every clause traces to a count. But across the corpus:
**90.4%** of clustered identities have ≥2 descriptions, **46.4%** ≥3, **23.5%**
≥5, and all **33,418** stand-alones have exactly one. The same "synthesized"
badge on a 24-source draft and a 1-source tidy-up would overclaim on the
second. Provenance had to become the page's structure rather than a footnote:
[`methodology-provenance-is-the-spine-of-a-generated-document`](kb-notes/methodology-provenance-is-the-spine-of-a-generated-document.md).

### Sam's rulings, in the order he gave them

1. **Interactive popup**, not a markdown file (he proposed the file, then
   corrected himself in the same breath).
2. **A synthetic description may be shown** *"as long as it is clearly labeled
   MAP-Generated for faculty consideration and revision before use."* His words
   are on the page verbatim, travelling with each generated field rather than
   sitting once at the top.
3. **Layered from the start** — *"layered is more manageable and scalable"* —
   because MAP exhibits and military credit recommendations are coming as
   further layers on the same identity.
4. **Editable titles and re-subjecting**, but *"only when verified and given
   admin permission should they be reminted."* A discipline change is an
   ordinary `kb_curation` row; a SUBJ4 change re-keys the identity and queues.
5. **Include the thin skills with a confidence chip** — *"More is better as
   long as we don't stretch too far."* Twelve became fifteen.

### The competency list, and what it cost to make honest

Fifteen competencies drafted from the 24 descriptions, each carrying the number
of colleges whose own text supports it, ordered by that count. Two caveats had
to go on the page because both are true and neither is obvious: **no college
gave us an outcome** (catalog descriptions say what a course *covers*, not what
a student can *do*), and **no proficiency standard is attached** — for a CPL
decision, "can operate SMAW" is not enough without to what standard, in which
positions, on what material. That second gap is on the critical path to the
Career Passport, not a nicety.

⭐ **Including the thin three was the right call, and the data proved it within
the hour.** *Interpret welding symbols* sat at 5 of 24 and was nearly dropped —
and it turns out to carry its own published credit recommendation from three
credentials. Had the list stopped at twelve, the one row where the two
vocabularies most visibly disagree would not have been on the page.

### The agency column is empty, and everything runs through it

`kb/credentials.json` and `kb/cr_reference_worklist.json` were both checked
field by field. For welding they hold **57 published credit recommendations
across 129 credential links**, including real ASME BPVC Section IX welder
qualifications — and **zero skill statements**. A recommendation names where
credit *lands* ("3-4 hours in Introduction to SMAW"), never what the holder can
*do*. The agency side of the comparison cannot be filled from anything we hold.

### Sam reframed it twice, and both corrections changed the design

**First:** the comparison runs **both ways**. *"Think of the impact to both
constituents if we can adjust each other's training to align."* A
one-directional panel reads as an audit of colleges and invites defensiveness
from the people whose cooperation the thing needs. The data supported the
reciprocal read immediately — 7 of the 15 competencies have no agency
counterpart, including *work safely in a welding shop* at 17 of 24, the joint
most-taught item on the page.

**Second, and this one corrected a premise the session had been working from:**
*"CCC CTE programs already teach to industry standards, but we have never
examined it one certification at a time and have certainly not reported on it or
cataloged it for our learners benefit."* Alignment is the design intent and
largely the practice. So the expected finding is broad correspondence, the
deliverable is the **learner-facing catalog** rather than a gap report, and the
welding result may be a **division of labor** — agencies certify the narrow
assessable specialty, colleges teach the whole occupational package with safety
at the front — rather than misalignment. ⚠️ Both readings fit the data equally
well, and the session had settled it on its own. That is exactly what the
faculty verify step is for.

### And the direction was wrong

The outline was built course-first. The real evaluation runs **certification →
courses**: one certification examined for which course or courses it aligns with
**enough** for CPL — a sufficiency test, never equivalence. The guiding question
the whole process answers, and the acceptance test for every screen this lane
ships: *"Would I want this person to have to take my class when they already
know this stuff?"*
[`reference-the-cpl-guiding-question`](kb-notes/reference-the-cpl-guiding-question.md).

Sam's six statements are captured verbatim in the `CPLBrain` vault
(`03-professional/braindumps/`, 2026-09-05 19:00 through 20:15), including the
Career Passport destination, the equity framing, and *"with foreknowledge"* —
which inverts the whole transaction from *will you count this?* to *this
already counts, and here is what for.*

## 2026-09-05 (late) — SkyReply S231: the sort, the sky, and a rule that never fired

**#1488 shipped after the checkpoint**, so the lane, the handoff and the feed were
one PR behind until this pass. Worth naming on its own: *a checkpoint is a
snapshot, and work that lands after it is invisible to the next session unless
someone goes back.* The fix is cheap; noticing is the hard part.

### The sort, not the depth

Sam saw a duplicate he had missed and blamed the list length. The list was
already sixty deep. What buried the twin was the **order**: after the relevance
tier the list sorts by member count descending, and a duplicate of a
well-adopted course is almost by definition the *less*-adopted one. So the
ranking hides precisely the thing the reader is hunting.

⚠️ **The first fix was wrong and the harness caught it.** Sorting the whole match
set by name and taking the first N returns the titles beginning with "A" — both
welding intro courses vanished. The window has to be **centered on the anchor**:
rank by relevance, take the best match, re-sort by name, then slide a window
with the anchor about a third of the way down.

### The glow is a claim, not a decoration

Sam's two sentences did the design work: members become muted stars, every
circle gets a gentle glow, and *"leave all the loners and nonmembers without the
halo effect — haven't earned their wings yet and are still moons."* That last
clause turns an ornament into an assertion — **a lit point is one colleges have
agreed on** — so a reader who never learns the rule still sees the settled
identities as the bright ones.

### A rule at the best possible address that was untrue the day it was written

Checking whether a stored id still names a live course, I compared ids directly
against the identity set and reported 44% and 36% dead. Through the 15 applied
alias maps the real figures are **27%** and **22%**. Rule 7 documents the
resolution semantics — on the PULL side, triggered by *"you read them when you
are re-minting, which you already know you are doing."* **I was not re-minting.**
That is the whole failure: the trigger assumed a self-awareness the task did not
produce.

Then the same shape again, one layer down. The chain is copy-pasted into two
files — 15 maps in `kb/_rekey_promotions.py`, **7** in
`kb/_analyze_official_fold_evidence.py`, which carries the comment *"Must stay in
lockstep with kb/_rekey_promotions.py ALIAS_MAPS"*. That comment was added
2026-09-03 **to a list that already omitted the 2026-06-12 and 2026-07-10 maps**,
and `kb/README.md` calls the script a "read-only drift detector". The drift
detector has drifted.

⭐ **The lesson is about mechanism, not diligence.** A written instruction sat at
the strongest address available — inside the file, at the point of use — and was
false on arrival. In the same session CI's dependency-map check caught me
**twice**, unread and unasked. What fires is code and CI; what needs a decision
to invoke does not fire in the case that matters, because the failure mode is
**confidence, not doubt**. `kb/doctrine.py` already reaches for this and says so
in its own docstring; it would still have missed here, because it reads the
*diff* and this error was in analysis — files read, none written.

### Believe the curator over the inference

I reported that the statewide "Introduction to Welding" recommendation pointed at
a 2-college identity rather than the 24-college one. Sam corrected the premise:
statewide CRs are titled from C-ID or CCN where one exists and neutrally where
none does, *precisely so no local college title wins*; local CRs match local
titles. The worklist is built from `chatbox_peer_articulations`, so a group's
`courses` list is **uptake** — who articulated against the recommendation — not
the recommendation naming a course. `introduction welding` reads 3 rows at 1
college: one college's uptake. Confirmed alongside it that all **512** Welding
identities are M-IDs, no C-ID and no CCN, which makes welding exactly the case
his rule exists for. The merge candidate survives, on the titles alone.

## 2026-09-05 (night) — SkyOutline S232: one chain, and the re-key that mostly should not happen

Sam's rulings 8, 4 and 5, in his order. Ruling 8 first because the shared resolver
is the tool the re-key is performed *with*, and that turned out to matter more
than expected: writing the resolver forced the question *what is the live set*,
and the answer overturned most of ruling 4.

**The chain is declared once now.** `kb/alias_chain.py` holds the one
`ALIAS_MAPS`, the one `resolve`, the one era guard. It had been copy-pasted into
`kb/_analyze_official_fold_evidence.py` under a comment reading *"Must stay in
lockstep with kb/_rekey_promotions.py ALIAS_MAPS"* while carrying seven maps
against the real fifteen — eight applies behind, for months, failing nothing.
⭐ **A comment promising lockstep is not a mechanism, and it fails silently in
the one direction nobody checks.** `tests/alias_chain_single_source_test.py`
now fails a second declaration under that name or any other, a copied resolver
in a chain-aware file, and a chain that is duplicated, missing or out of order —
all four perturbation-tested, because a guard nobody has seen fail is a guess.

**Then ruling 4 mostly evaporated, and executing it literally would have done
damage.** The instruction was to re-key `kb/cr_reference_worklist.json` and
`kb/coci_articulations.json` through the fifteen maps. Measured:

| surface | what the ruling assumed | what it is |
|---|---|---|
| `cr_reference_worklist.json` (2,006 M-IDs) | stale since September | **0 dead** — `daily-dashboard.yml` rebuilds it every morning from `coci_articulations.json`, so it cannot go stale. Re-keying would have **moved 1,197 live ids** off their rows. |
| `articulations[].course_id` (2,319) | stale | **already current-era**: 2,299 of them equal a *resolved* identity key. Re-resolving is a double-applied permutation. |
| `identities` side map (2,346) | — | **the one stale surface**: 1,597 ghost keys, 1,369 re-keyed, 2,290 entries now all live. |

⭐ **The tell for which era a stored id is in is the DIRECTION the number moves.**
Resolving an old-era key *heals* it (dead falls: identities went 1,597 → 175);
resolving a current-era key *moves* it onto a live but unrelated row (dead rises:
welding course ids went 44% → 50%). One file held both eras at once, which is
exactly the state `alias_chain`'s docstring calls unrecoverable in place — except
here the two eras were in two different fields, so each was recoverable alone.

⚠️ **S231's death figures were an artifact of the measuring stick.**
`unified_courses_data.js` declares `count_total: 76,008` and ships
`count_inbrowser: 16,480`, so "not in the browser payload" read as "dead" and
over-reported it about fourfold. Welding CR ids: 19 of 70 reported, **0 of 70**
against the real catalog. **A display payload is not a catalog** — and the number
was reproduced exactly (44%) before it was corrected, which is what made the
correction safe to assert.

⭐ **The near-miss worth remembering: a liveness set narrower than the identity
space condemns an entire identity system.** 175 of the identities are
`identity_system: C-ID`, keyed by the C-ID code itself (`ACCT 110`), which can
never appear in an M-ID minted catalog. S229's dry run tested against minted ∪
singletons, so every one of them came out `drop_dead` **by construction** — 172
live identities carrying 662 articulation records, one `--apply` away, and all
five of its gates would still have passed, because the gates check that the
*post-state* is consistent, not that the *plan* was sane. Sam's ruling 5 ("a
worklist, never a silent drop") is what turned a silent deletion into a thing
that had to be written down and therefore looked at.

The liveness set now includes `kb/reference/coci_courses.json` — the same C-ID/CCN
reference the seed builder resolves them against. Dead remainder: **175 → 3**, and
those three are malformed keys (`AG-AB 108 108`, `AG-PS 128 128 L`, `NULL`) — a
seed-join defect, not a retirement. They land in `dead_worklist.md` beside the
receipt. The 2026-09-04 receipt is marked `SUPERSEDED` rather than deleted, since
it is the evidence of what was nearly applied.

**Patterns that carried over from S231 and earned it again:** reproduce at the
user's state, not a convenient one (the C-ID bug is invisible unless you look at
*which* ids are dead, not how many); and hash the rendered output, not the control
— here, the plan's counts, not the fact that the script ran.

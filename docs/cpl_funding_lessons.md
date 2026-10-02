---
title: CPL Implementation Funding tab — workstream lessons
created: 2026-06-11
updated: 2026-10-01
tags: [lessons, funding, implementation-funding, dashboard-tab, parallel-session]
artifacts:
  - CPL_Dashboard.html / index.html (tab shell — PR #352)
  - funding/CPL_Funding_Model_2026.xlsx (committed source workbook)
  - funding/_build_funding_data.py (one-shot extractor)
  - cpl_funding_data.js (static data artifact, window.CPL_FUNDING)
  - cpl_funding.js (renderer, window.CPL_FUNDING_TAB)
  - tests/cpl_funding_*.test.js (nine suites; split 2026-08-20)
  - tests/lib/cpl_funding_harness.js
  - tests/cpl_funding_reorder.test.js
  - prototype/funding_model_explainer.html (the audience-facing explainer)
  - prototype/build_funding_model_explainer.js (regenerates its data)
  - tests/cobi_prose_measure.test.js (the full-width prose rule, COBI-wide)
  - college_briefing.js (My College funding box — the identity join)
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-standing-pii-guard]]"
  - "[[docs/cpl_funding_handoff]]"
---

# CPL Implementation Funding tab — lessons

Workstream scratchpad for the **Implementation Funding** dashboard tab
(hash `#implementation-funding`), built 2026-06-11 in a session running
**parallel to an active CCR session** — hence the unusual constraint set:
shell-first, then new-files-only.

> **Earlier sections archived.** The 2026-06-11 → **2026-08-06** build-out — the tab
> itself, the Chancellor-facing 2-year rework, the equity refinements
> (front-load · floor · rural allowance · eligibility badges), the
> achievement-based cap-and-earn model, the $35M reframe, the Budget-tab ledger
> reconciliation and the move to credit FTES — moved verbatim to
> [`cpl_funding_lessons_archive.md`](cpl_funding_lessons_archive.md) on
> 2026-08-20, the 2026-08-01 → 2026-08-06 sections (the units answer, the
> per-priority price factor, the NC decision, the opt-in v1 and the $50k
> groundwork) on **2026-08-27**, and the 2026-08-22 → 2026-08-23 sections (the
> explainer rework, the maximum allocation, the rural carve-out's retirement,
> the noncredit lane's first shape, Sam's dial-moving day and the docx
> migration) on **2026-09-01**, and the 2026-08-31 → 2026-09-01 sections (the
> one-pool port, its test family and the deck run: S215–S217) on **2026-09-24**, and the 2026-09-01 section on
the two consolidations (Session 219) on **2026-09-30** (S306), and the 2026-09-02 explainer audit (S219) on
> **2026-09-30** (S307), and the 2026-09-02 calm pass (S220) on **2026-09-30** (S308) — each time because the doc crossed its size
> budget and the checkpoint needed to append. Those phases are shipped and settled; read the archive only for the
> reasoning behind a decision you are about to change.

## 2026-09-09 — the text surfaces, three curator affordances, and two dead guards

**PR [#1528](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1528)**, merged
as `1570fa6`. Sam prepared the Implementation Funding tab for debut: he was editing the
introduction live and wanted the language revised against the new draft Title 5 §55050.
The run produced a decision sheet, nine verdicts, and three features he asked for
mid-stream.

### What Sam ruled, in his words

- **The banking sense of "draw" is out.** *"'draws' is a business term tied to banking
  and I don't want that connotation."* Fourteen rendered sites became **earn**; the
  baseline gate became **receive**, because that sentence releases funding a college has
  already earned.
- **Expended and allocated are not interchangeable.** *"expended should be kept if I am
  referring to the colleges spending the funds. Allocated should be used if I am
  referring to the CO awarding or dispensing the funds to colleges."* This narrowed a
  sweep that would otherwise have run too wide — the memo sentence in question follows
  *"each institution's CIO must submit…"*, so its subject is the colleges, and
  *expended* stayed. Only `utilize` → `use` there.
- **Active voice, and name the actor.** *"avoid mannerly language, using instead active
  voice, avoidance of adjective phrases and asides, and… plain language or language
  consistent with the terminology used in the T5 revision."* On funding prose the
  recurring failure is a passive that hides the model: *is measured*, *are then
  applied*, *is produced by*. Also: say **model**, not *engine*.
- **The outcomes are not the model's.** Mid-turn: *"the outcomes are not draw from the
  model, they are drawn from Ed Code."* The introduction had said the model "calculates
  the priority outcomes from records in MAP", which reads as the model producing them.
  It now says **"the priority outcomes required by Ed. Code §78093.2(d)(1)"** — the
  phrasing the tab's own section heading already used.

### The blockquote, and why a lossless round trip turned out to be load-bearing

The prose blocks store plain text and escape it on render — that is what keeps a page
every visitor reads free of markup an author can inject. It also meant the statute Sam
was quoting rendered at exactly the weight of the page's own sentences, and the block's
one formatting affordance (a blank line starts a paragraph) could not say otherwise.
Leading spaces cannot either: `plainNormalize()` strips them by design so a paste keeps
its shape, which I verified by running his text through the real painter rather than
guessing.

A paragraph whose EVERY line opens `>` now renders inside a `<blockquote>`. All-or-
nothing on purpose: a rule that fired on any `>` would silently reformat ordinary prose
containing "3 > 2", and the author's only clue would be an indent they did not ask for.

⭐ **The reverse mapping (`htmlToPlain` → `> ` lines) looked like future-proofing until
item 7 landed.** Baking Sam's approved introduction as `ABOUT_DEFAULT_HTML` put a
`<blockquote>` in the DEFAULT — and `setText()` decides whether to store an override by
comparing what was typed against `htmlToPlain(default)`. A lossy round trip would mean
opening Edit and pressing Save without typing anything stores an override that renders
the statute as body prose. The test that pins it (`saving the default back UNCHANGED
stores no override`) guards a failure with no visible symptom at the moment it happens.

### One resolver, because two would drift

Rename and Hide ride `sectionShell()`, the one function every section on every subview
passes through, which is why they reached the model page, the $50K view, the Report and
the standalone public page in one change. The explainer is a different shape — seven
hand-written sections — so it reads `T.sectionCuration()`, the tab's own resolver over
the same `titles` / `secHidden` maps, rather than a second copy of the lookup. Same
lesson as `one-resolver-for-two-surfaces-that-describe-the-same-thing` (2026-09-01): two
surfaces describing one section would eventually disagree and neither would look wrong
alone.

⚠️ **And that is exactly why item 9 stopped being tidiness.** Hiding rides
`sectionShell()`, which only `cpl_funding_public.html` passed through — so a section the
CO held back stayed visible on `funding-model/`. Two public renderings of one model is a
correctness problem the moment either becomes curatable. The old page is now a
meta-refresh + canonical redirect; Pages cannot issue a 301 and the URL had gone to
colleges, so a stub beats a 404.

### Two dead guards, and a reporting failure of my own

⚠️ **`detail_trim`'s T1d counted a phrase that the sweep deleted.** It asserted *at most
one* occurrence of "qualifying later still lets it draw". After the sweep it matched
nothing, counted zero, passed, and guarded nothing — reading exactly like a clean
result. The count must tolerate zero (that fixture's college is not always gated), so
the phrase is now asserted against the module source instead: reword it and the test
fails, pointing at the count that needs re-aiming. **Third occurrence** of
`a-test-coupled-to-position-or-wording-breaks-on-correct-work`, and the first found by a
change that happened to walk past it rather than by looking.

⚠️ **`cobi_prose_measure` broke on the redirect, and I predicted it would pass.** Its
list of "every file that carried a prose measure" asserted each still has one; gutting
the page's stylesheet left nothing to find. The stub is off the list now, with a check
that it IS still a stub — so restoring content there fails loudly instead of escaping
the sweep.

⭐ **`npm test 2>&1 | tail -14` reports TAIL's exit status, not the suite's.** I read
"exit code 0" off that pipeline and told Sam the full suite was clean, twice. The second
of those runs had a failure in it, printed in the very text I was tailing. Running
`npm test > log 2>&1; echo "REAL_EXIT=$?"` caught a genuine `exit 1` on the next run.
A pipeline's status is its LAST command's, and `tail` almost always succeeds.

### State at the end of the run

All 318 test files pass (verified with the exit status captured directly). New:
`cpl_funding_prose_blockquote` 27, `cpl_funding_section_titles` 24. Raised:
`funding_model_page` 37 → 44, `gate_ledger_public` 57 → 58, `detail_trim` 20 → 21,
`cobi_prose_measure` 15 → 16. `cpl_funding_calm`'s vocabulary guard now bans the draw
stem and *unspent* alongside pool / money / apportion / the advance concept.

Open: the explainer's footer (whether *sources* splits from the "not adopted policy"
disclaimer so the first becomes hideable), and sweeping the rest of the memo builder
against the expended/allocated rule.

## 2026-09-12 — Session 258 (SkyList): four asks, an unreachable resolver, and a class that was an API

Sam's four asks — movable sections, the outcomes section carrying measurable
*and* non-measurable priorities, a box for goal (C) with designated projects,
and the changes reaching the public view — all shipped in PR #1563.
[Lane state](reference/lanes/implementation-funding.md).

**Six of the explainer's seven sections could never be curated, and the test
proved the wrong half.** Rename and Hide ride `sectionShell()`; the explainer
hand-writes its markup and asks `T.sectionCuration()` by `data-fsec` id. Only
`timing` appears in both id sets, and by coincidence of naming — so for six of
seven, a section the CO held back stayed visible on the page colleges read.
`funding_model_page.test.js` had a whole block on this, and every assertion in
it wrote `{ titles: { qualify } }` into the shared map and then read it back.
That proves the resolver resolves. It cannot notice that **no control anywhere
emits `qualify`**, because the test supplied the id itself. The fix declares the
page's sections (`PUBLIC_SECTIONS`) and asserts the declaration equals the
markup, in membership and order — an assertion whose input comes from the
system, not from the test.

Deliberately **not** aliased onto the tab's sections: `lede` and `choices` have
no tab twin and `allocation` spans two, so an alias would make one hide mean two
different things on two pages and be wrong in a way neither page could show.

**A styling class is an API.** `reportedPrioHtml()` rendered its box as
`<div class="p cplfund-rprio">` to inherit the priority-card look.
`.cplfund-prio .p` is counted or indexed by eleven assertions across five
suites, so the box became a priority card to every selector in the codebase —
the exact thing the paragraph directly above that line says it must never be.
CI went red on seven files from one class attribute. The paragraph was right
about the design and blind to the attribute implementing it.

**And the guard was watching the wrong half.** The new suite asserted the box
carries no `data-priocard` attribute — true the whole time, and not what other
code selects on. It now pins the `.cplfund-prio .p` count against the
`data-priocard` count. Two failures of the same shape in one run: an assertion
can be about the right subject and still test nothing that would move.

**When a suite fails in a full run and passes alone, re-run it alone at the
current tree before reaching for an environmental explanation.** I read these
seven failures as memory pressure — `lead_with_the_table` had passed standalone
and the harness documents heap aborts in exactly these suites. It had passed
because I ran it *before* the edits that broke it. Two later confusions were
also self-inflicted: `render` looked hung under three of my own overlapping
background runs, and one clean re-run died at exit 144 because
`pkill -f cpl_funding_render` matched the wrapper shell that had just launched
it.

**The register is inline, not a script tag.** `registerProjects()` reads
`window.CPL_DATA`, and `CPL_Data.js` (228 KB) is generated and deployed but
loaded by *no* HTML — both dashboards carry the object inline, `projects` array
included. Worth knowing before adding a consumer: the picker works on the tab
for that reason, and the public explainer has no register at all, which is why a
designated project's NAME travels in the config and its weekly-changing STATUS
deliberately does not.

`registerProjects()` copies named fields, so reading one it does not copy
(`activity`, `pct`, `update`) silently groups every project under "Other" —
the shape of [`a-feature-test-on-a-missing-method-fails-silent`](kb-notes/methodology-a-feature-test-on-a-missing-method-fails-silent.md).

## 2026-09-13 — SkyGuard (S259): every sentence opens with the positive, and the word earn is retired

**Sam's ask, verbatim:** *"Do a sweep and revise all text that starts with a
negative statement and just start with the positive"*, naming *"the nos and
nothings and informal terminology like baked, scored, earned, falling back, pin
it."* His two examples became the pattern: the (C) box reads *Funded through
the statewide project allocation and reported based on the aligned
activities.* and the metric-wiring paragraph opens *Data used to measure
real-time outcomes.*

**What moved.** Eighteen sentence-initial negatives and every mid-sentence
"nothing" a reader meets; `inheriting baked default` became *hand-maintained
default*; *no data yet* became **awaiting measurement** (the 2026-09-01
plain-absence ruling kept, facing forward); a bad `metric_src` reads *awaiting
a known measure*; *none on record* became *credit only*; *Nothing is withheld
yet* became *All of the max award remains available*. Guard: `cpl_funding_calm`
§5 now bans the stems and checks sentence starts (*Not Applicable*, a MAP
status, exempt). The suites that pinned the old words were re-pinned.

⚠️ **"Earn" is retired too** — *"Earned still smacks of banking... measured...
or... qualified for"* — reversing 2026-09-09's *earns*. It is 93 rendered sites
and 31 suites, so it is the next session's, with the proposed map (counts
toward · qualifies for · demonstrated · remaining) awaiting his word.
Identifiers keep the old stem; prose never.

---

## 2026-09-13 — S260 (SkyKey): the sweep, the a11y pass, and a number that had never been near the engine

**Shipped.** PR #1570 retired "earn" across the tab, the CSV export and the public
explainer (69 sites) and cleared the funding target-size findings; PR #1571 landed ask 2;
PR #1572 corrected two stale lines in this lane.

### The lesson that cost the most: a lane file is a summary of a measurement, not the measurement

Asked to prototype ask 1, I drew the priority shares from this lane's own `NEEDS SAM ⓪`
line — *"starting set Eligible 40% · Accepted 25% · Transcribed 35%"* — and published
them. Sam's reply was one question: *"Did you read the values and metrics from config or
the live funding tab — they don't seem to line up to me."* They did not. The live
Scenario 1 is **33 / 33 / 34**, titles **Outreach · Completion · Awards**, all at factor
0.5, displayed `[0, 2, 1]`, Awards pinned to `ppa_u`.

The line I trusted was a **proposal he never applied**. Nothing in the lane marked it as
one, and a session reading top-to-bottom cannot tell a proposed dial from a live one.
`CLAUDE.md` already says *never read the config, call the accessors*, and
`scripts/funding_effective.js` **refuses to run** without a live config, printing that
baked defaults are stale by design. I walked past both by reading prose instead.

Two corrections followed from actually reading the config, neither of which any amount of
re-reading the lane would have produced:

- **`pac`/`pac_u` are back in the bake.** The lane said OMITTED since 2026-09-08; Pedro
  restored the lifecycle booleans on 2026-09-10 and the daily bake picked them up.
  Measured on `as_of 2026-09-13`: `pac_u` 24,777.95 statewide across 110 college rows.
- **(C) has four designated projects, not three.** The config's own `projectGoals` carries
  4.3 Strategic Partnerships, which Sam designated himself — what his 2026-09-12 "Hold,
  no action" on LWDA left room for.

### The finding that matters most for ask 1

`prioGoals()` resolves the `accepted` milestone to **(B) AND (C)** — Sam's 2026-09-01
ruling that the advising step is the part of career attainment a campus controls. That is
**the only path to a campus measure for goal (C)**. The live Awards priority is pinned to
`ppa_u`, whose `applied` milestone resolves to (A) alone, so the Counselor step sits in
Awards' *strategies* as prose while its *metric* points elsewhere. Sam, 2026-09-13:
*"I included the Counselor step in the Award priority, so it should be wired there."*

⚠️ **And this is why the (B)+(C) band is merged.** Wire Awards to the accepted measure and
one card serves two goals; `bandsHtml` assigns each card to the FIRST band it matches, so
a four-band split needs a rule for that card. The proposal put to Sam: show it once under
(B) where its funding sits, and give (C) a **reference card** naming it with no figure
restated — no double-count reading. Unanswered at session end; ask 1 is not ported until
it is.

### A rendered-text ban covers only the branches a fixture paints

Extending `cpl_funding_calm` §5 with the earn stems looked sufficient. Mutating the source
to check proved it was not: reintroducing *"They still earn normally"* into the orphan-band
note left the suite **57/57 green**, because that note renders only when a milestone fails
to resolve and the fixture has no such priority. Hence `cpl_funding_earn_retired`, which
reads every quoted string in the SOURCE — and which is what caught `"Earned <window>"`
still sitting in the **CSV column header**, reader-facing text no DOM test can ever see.

`detail_trim` already carried this lesson from 2026-09-09, in almost the same words: a
guard counted a phrase, the phrase left the vocabulary, and *"it counted 0 and passed
forever while guarding nothing."* Two sessions found it independently; that is an argument
for reading the comments before writing the guard.

### The a11y pass: every number was measured, not chosen

245 findings collapsed to **six causes** — one selector was 118 of them, so reading the
report top-to-bottom would have started with the least important thing. Four details worth
keeping:

- `padding: 1px` cleared 1440px and left 118 targets at 21.6px **below 561px**, where the
  table font is smaller. And **Taft** — four characters, the shortest college name in the
  state — fails on *width* alone, cleared at 2px on the explainer and still failed at 23.5
  on the tab. One college in 118 sets that number, and it had to be measured on **both**
  surfaces.
- **The floor goes on whichever box the engine measures, and it differs per control.** A
  wrapping `<label>` REPLACES its checkbox's box, so the 13×13 column checkbox is measured
  as its 156×21.7 label; the opt-in label is a flex COLUMN that already clears the floor
  while its input did not. Opposite fixes, same rule.
- **Fixing the rule you found is not fixing the rule that applies.** A first `min-height`
  measured *exactly* the same 21.7px — an identical selector was declared later in the
  same array.
- ⚠️ **A `.tablebox:focus-visible` rule I added named `--gold-accent`, which the explainer
  does not define.** Being more specific than the page's global `:focus-visible`, it made
  the declaration invalid and REMOVED the ring (137→139). "Use `var(--token)`" is not
  satisfied by naming a token; it has to be one **that page** defines.

⚠️ **The curate-only controls are invisible to the public sweep.** They render only for a
signed-in curator, so `a11y funding-model` reported zero while the tab failed — and one
`a11y cobi` run does not enumerate them either (fixing the four it named surfaced two
more). The rule therefore floors a **family** of 26 classes; do not trim it to what a
sweep last named.

### Process notes

- **Running 45 jsdom suites at `-P 6` starved every one of them** — `cpl_funding_render`
  sat at 3:17 with no progress. Not slowness; contention. Run the suites that pin the
  changed surface, and let CI run the 331.
- **`grep -cE "^FAIL"` read `cpl_funding_public_dollars` as clean** while it was failing:
  it prints indented ` FAIL D2:` and `4/10 passed`. The harness, not the code — and it is
  how a red branch reached CI.
- **Rebuild `kb/dependency_map.json` LAST.** It records line numbers, so the 24 lines of
  a11y comments invalidated a map rebuilt three commits earlier. CI caught it.
- **A test coupled to POSITION breaks on correct work** — fourth occurrence. Ask 2 gave
  earlier bands a `.cplfund-prio` grid, so `querySelector(".cplfund-prio")` moved off the
  band under test. Instrumenting the failing test (rather than two hand-built probes that
  never reproduced the state) showed the carryover line was never missing.


## 2026-09-14 — S262 (SkySave): the band wrapper retires, and a double claim surfaces

**PR #1574.** Sam's asks arrived as a marked-up screenshot and four numbered lines, after
S261 "went off the rails a little" by building past the brief. The corrective was to build
the mockup FIRST and let him rule on it — which he did, five times, mid-turn.

- **VERIFY AN ASK AGAINST THE SCREEN, NOT YOUR READING OF IT.** The red arrow ran from the
  `(A) Access` band head into the top of the Priority 1 card. I read that as "put a picker
  on the card" and moved the band's other content — the citation, the statute quote — off
  to a totals row and a fold. His one-line correction ("The bands are included on the
  priority cards and illustrated on the screenshot") was the whole design: the band goes
  **on** the card, all four pieces. One mockup round cost minutes; building it would have
  cost the session.
- **A FIGURE TAGGED TO TWO OWNERS IS CLAIMED TWICE.** The project allocation was tagged to
  (C) AND (D), and `goalFunding()` pushed its FULL amount into each — $17.9M of reporting
  against an $8.96M allocation. Every row was correct in isolation and nothing ever summed
  the goals, which is precisely why it survived. Found only because Sam asked for a
  split — the feature request exposed the defect, not an audit.
  → [`methodology-a-figure-tagged-to-two-owners-is-claimed-twice`](kb-notes/methodology-a-figure-tagged-to-two-owners-is-claimed-twice.md)
- **A SUITE WRITTEN AGAINST A STRUCTURE IS PROTECTING AN INVARIANT.** `cpl_funding_statutory_bands.test.js`
  was 26 assertions of `.cplfund-band`, and its header said what it was really for: no
  priority may go missing, because an invisible priority still qualifies for funding
  against a target nobody can see. Rewritten, not deleted. One inherited check had become
  VACUOUS while still passing — "the account and the band agree" is trivially true once
  there is one renderer — which is the harder failure to notice.
  → [`methodology-retiring-a-structure-means-rewriting-its-guard`](kb-notes/methodology-retiring-a-structure-means-rewriting-its-guard.md)
- **MEASURE A11Y AGAINST THE BASE, DON'T CLAIM IT.** Sam asked for AA and mobile "as you
  build". The tab reported FAIL — but a worktree run of `main` reported the same findings
  plus three more. Every finding was pre-existing; this PR removed three (the raised-letter
  goal markers) and added none. A baseline turns "the sweep fails" into "the sweep fails
  identically, minus three", which is a completely different report to give.
- **THE DEPENDENCY MAP RECORDS LINE NUMBERS.** CI went red on `dependency map is STALE`
  while all 331 files passed locally. Several hundred lines moved in `cpl_funding.js`. The
  standing note says rebuild it as the genuinely LAST step, and it was right. The diff was
  15 line numbers and nothing else — which doubles as proof the rework added no new data
  dependency.
- **`unlocked()` DECIDES WHERE A WRITE LANDS, NOT WHETHER A CONTROL RENDERS.** I added
  `!unlocked()` gates to the Add-strategy button and the outcome picker, which would have
  taken a control away from signed-out viewers who have it today. `edText`/`edNum` gate on
  `publicMode()` alone. Caught by a crash in `cpl_funding_render`, not by review.
- **A GUARD CATCHES THE PROSE YOU CANNOT SEE.** Two of my own rendered sentences broke
  house rules — one opened with "No" (positive-first), and the totals row borrowed the
  account's phrase for a goal's evidence state. Both were caught by `cpl_funding_calm`,
  neither by re-reading. The second is the subtler: two different claims wearing one
  phrase, which is how near-duplicates drift.
- **THE LANE FILE FIGHTS BACK.** `oversized_doc` flagged it at 1.19x. Two rounds of
  "compaction" REWROTE text at the same length and one actually grew the file. What worked
  was deleting settled history outright and pointing at the KB notes instead of retelling
  them. Ended at 1.09x while absorbing a run's worth of new state.

## 2026-09-15 — S263 SkyOrder: a column-hide rule that reached into the drill-in, and two builds Sam stopped

**Shipped:** #1577 (statewide expand, one detail renderer, true-ratio percent, printed names, parity guard) ·
#1578 (the column-hide CSS leak) · #1580 (revert the target rate, correct a stale MEASURES comment).
#1579 was built and reverted the same day.

**⚠️ THE DEFECT THAT MATTERED FIRED ON THE SHIPPED DEFAULT.** `colHideStyleHtml()` emitted DESCENDANT
combinators, so hiding the main table's District column (main col 3) also hid NC funding (detail col 3)
inside the nested per-priority table. `COL_PREFS` defaults to `{district:true, working_adults:true}`, so
this was never a setting anyone chose — **every reader** of COBI and the public explainer saw the
noncredit cell vanish, later cells slide one column left under the wrong headers, and Total Possible
render empty. Reported as "NC funding shows FTES" because the Target cell landed under that header.
The `:not(.cplfund-detail)` looked like it covered this: it excludes the detail ROW, while the damage
is to rows INSIDE it. Note: `methodology-a-guard-on-the-wrong-generation-of-descendant-is-not-a-guard`.

**⚠️ AND NO DOM-READING TEST COULD HAVE CAUGHT IT.** The markup was always correct — every row emits all
eight cells, and the parity guard written the day before passes on this exact defect because it counts
`<td>`s. The corruption is at PAINT and jsdom does no layout. The guard asks the one question jsdom can
answer: `Element.matches()` against the generated selector.

**TWO BUILDS SAM STOPPED, both of which I had justified to myself first.**
1. The per-priority target rate (#1579). He asked *"why do I need the Target factor when I can adjust
   the FTES factor and get the same effect"* — and the maths is exact: `rate = k/factor` reproduces
   every target because `prioEntitlement` is proportional to size share. One degree of freedom, two
   parameterizations, and this repo already rules against a second dial over one number.
2. A combined `pa_u + ppa_u` source to match the MAP dashboard's 84. **Awards is already pinned to
   `ppa_u`**, so that would have counted portal-origin units twice — re-creating the double claim S262
   fixed. Note: `methodology-before-building-a-whole-check-whether-the-halves-are-already-assigned`.

His tell both times was the same sentence: *"This was not an issue in any of the previous dozens of
funding sessions."* A problem appearing suddenly in a mature system, with no corresponding change, is
usually a problem in the current reading. It was said twice before it landed.

**⚠️ A STALE CAUSAL CLAIM I REPEATED AS JUSTIFICATION.** The `MEASURES` comment said eligible is
"inflated upstream by the ACE/JST skill-level duplication". `roadmap_archive` records that exact claim
being corrected — the gap is mostly correct applicability filtering, and a producer cross-check against
MAP's own totals measured 1.0054. The correction never reached the file. Corrected in #1580.

**THE VOCABULARY COLLISION, measured from Sam's spot-check.** MAP's dashboard labels its APPLIED column
"Eligible": Alameda 84 = `pa_u` 78 + `ppa_u` 6, 14 students = `pa` 13 + 1 portal-origin; statewide 220k =
220,020. Our `pe_u` is 1,407,508 / 529. Same word, 6.4x apart — and `live_metrics.json` already carries
the scraped figure per college (115 colleges, fractional precision, Σ 220,370.65), rendered on College
Activity as "Eligible Units". So COBI itself carried both readings.

**Patterns that worked.** Reproducing the screenshot cell-for-cell before theorizing — it killed three
wrong hypotheses (stale cache, truncated git history, a missing data field) and found the CSS. Mutating
every new guard to prove it fails on the real defect. Baselining a11y against a `main` worktree before
reporting. And treating the user's "this was never a problem" as evidence.

---

## 2026-09-15 — S264 (SkyMantis): the counselor step becomes a measure, and the last dial gets a control

**What shipped.** Four PRs: #1582 (the counselor step as a measure + the measure picker), #1583
(the builder's retired causal story + the decision sheet), #1584 (Credit FTES locked as the only
allocation basis), #1585 (measure options named by route).

### The defect Sam found by describing his own tab

He said the counselor lifecycle check was on P2. It was — **in the metric text**. The pin was
`ppa_u`, applied units among portal-origin students, which never reads the counselor field. The
priority carrying the largest share (34%) promised a condition its measure did not apply, and
nothing on screen said so, because the diagnostic that compares a metric's rung to its measure's
rung had no `accepted` branch to compare WITH. Two seams, one missing concept.

⚠️ **I had it backwards first.** I read "I added the counselor lifecycle check to P1" and built an
entire mockup on P1 before he corrected me. The correction cost a rebuild; the lesson is that his
FIRST description of a change is a description, and the live config is the fact. I did read the live
config — and still let his sentence override what it said.

### The control that did not exist

`metric_src` was the last funding dial with no control: share, factor, title, metric text, goals,
pool figures and strategies were all curator edits; the measure could only be changed by a session
writing to the shared Supabase row. ⚠️ **The lane file and two handoffs called it "one dial in the
tab, zero code", so I told Sam twice that the control existed before checking the screen.** That is
the failure `methodology-verify-an-ask-against-what-the-reader-sees` was written for, committed by
the session that had just read that note.

**The picker's load-bearing detail is the un-pin.** `firstDefined()` skips null and undefined, so
clearing a pin by DELETING the key lets a lower override layer's pin resurface — a curator would
appear to un-pin and silently inherit someone else's measure. Storing `""` is what prevents it, and
the mutation that deletes instead reds four assertions including the one that catches `ppa_u`
coming back.

### Sam's resolution beat the one I was about to build

Asked for a measure carrying counselor AND origin, I was going to declare a combined `ppac_u`
(undeliverable today — `Origin` is not in the feed). He instead **split the elements across two
priorities**: origin onto P1, the counselor step onto P2. P2's text and measure now match exactly.
Simpler, buildable today, and it made the S263 "do not build a combined source" caution moot rather
than needing to be worked around.

### Two verification failures, same shape

⚠️ **A PIPE DISCARDS A COMMAND'S VERDICT.** Twice in one day:

  * `node tests/run.js 2>&1 | grep -E "FAIL|passed"` — the grep swallowed the failing file's NAME
    and replaced npm's exit code with grep's, so a genuinely red run printed "exited with code 0".
    I reported the suite green and pushed on it. The unfiltered rerun named the file in seconds.
  * `python3 kb/_build_dependency_map.py --check 2>&1 | tail -1 && git push` — same mechanism: the
    exit code became `tail`'s, "dependency map is STALE" printed on screen, and the `&&` chain
    pushed anyway.

**Rule: never put a gate behind a pipe.** Run it bare, read the exit code, then act. Both were
caught, but the first cost a cycle and a false report to Sam.

### CI knows things `npm test` does not

`test` went red on #1582 with **`dependency map is STALE`** — not a test failure. My local
`node tests/run.js` passed 334/334 at the same commit. "Local suite green" and "CI green" were
never the same claim, and I had been treating them as equivalent. `python3 kb/_build_dependency_map.py --check`
is now part of the pre-push routine.

### Retiring a behavior means inverting its tests, not deleting them

Locking the allocation basis broke six assertions in `cpl_funding_basis` that PROVED the switch
worked. Each became an absence guard naming the ruling; Part D's proportional-split maths was
**retargeted** onto credit+noncredit FTES rather than dropped, and still holds to under $1 — which
independently confirms the one-pool sizing formula. The suite went 38 → 39 assertions.

⚠️ **And one sweep of mine went too far.** I removed the per-student rate card's "this year's
metrics are headcount-denominated" as part of the basis removal. `cpl_funding_render` failed,
correctly: that sentence describes the METRIC, not the basis, and is true on the baked Scenario-2
path. The guard is now scoped to the basis claim rather than the bare word, because asserting on the
word would re-break a true sentence on every future run.

### What Sam ruled

  * **The counselor check is on P2, not P1** — and he split origin onto P1 rather than combining.
  * **"Don't worry about measurable but for the moment stranded funding."** P1 measures 666.5 units
    against an ~88,000-unit target and 0 of 118 institutions reach it; he accepts that because the
    origination element is coming. His pin is forward-correct: `ppa_u` is the key the cut lands on.
  * **"Include batch in P1"** — the dropdown label names three routes though the measure counts two,
    written for what the measure becomes.
  * **"Effective" is retired vocabulary** — "we don't use it anymore". Its absence from all three
    repos is correct, not a gap.
  * **Eligible is the whole JST by design** — the parse decision from the early military-CPL days,
    and industry CPL avoids the problem because colleges only adopt an exhibit when they hold a
    course to articulate with it.

**Patterns that worked.** Measuring before advising, every time — the Headcount removal became
obvious when it was "69 of 118 awards, largest swing $110,391" rather than "dead policy". Asking the
model instead of re-deriving. Mutating every new guard. And reading the builder before advising on
P1 a second time, which is what showed his pin was already right and my advice aimed at the wrong
horizon.

## 2026-09-15 — S265 (SkyPublius): the explainer stops describing a model it no longer runs

Sam gave the public explainer a pass: make its language consistent with the model, cut the
redundancies, integrate the priorities and the timeline, fold the strategies, fix a table that ran
off the window, and add a PDF link. Four of those are editorial. The one that mattered was not.

### A description keyed on a name that changed

The priority cards carried a hand-written plain-language sentence each, held in a map keyed on the
priority TITLE:

    var plain = { "Access": "…", "Outreach": "…", "Success": "…" };
    m.textContent = plain[p.title] || p.metric;

The live titles have been **Outreach · Completion · Awards** since Sam set the dials. So two of the
three cards fell through the `||` to `p.metric` — the raw measure string, which is not a sentence —
and the third, "Outreach", still matched its key and printed a description of **eligible** units
under a priority that now measures **applied units from the portal, landing page and batch upload**.

Nothing rendered wrong. No figure was stale, no guard went red, and the card that lied was the only
one that looked normal. **A lookup keyed on a display name fails silently the day the name is
curated, and it fails hardest on the entry that still matches.** The model already carries a
`description` per priority, edited on the same tab as the share and the measure; that is what the
card says now, and the guard renames a priority and requires the sentence to survive.

The baseline requirements were the same defect with higher stakes. The page typed its own three,
and the first read *"A CPL Coordinator or Counselor listed in MAP"* while the live model read
*"Primary CPL Contact listed in MAP and the college public CPL Landing Page"*. A college reading the
public page was being told to meet a requirement the model does not check. They come from
`_requirements()` now — the same accessors the tab's eligibility section renders — and so does the
participation deadline, which sat in the choices table as the typed string "1 Nov 2026" against a
model holding `2026-11-01`. The page's two figure guards look for currency and for
thousands-separated numbers; **a date is neither**, which is why it survived every audit.

### Three vocabulary guards, none of which could see the page

`cpl_funding_calm` §5 bans the retired funding words in RENDERED text — it reads the tab's mount.
`cpl_funding_earn_retired` reads `cpl_funding.js`'s SOURCE, which is what caught the CSV header no
DOM test could see. Between them they are described as "the whole guard".

They are not, because the explainer is a THIRD file: hand-written markup in `funding-model/`. Two
days after Sam retired "earn" it still said *"What it earns tracks the prior-learning credit…"* and
*"the priority's share is earned with fewer units"* — on the one surface colleges actually read.
**A ban is only as wide as the files it opens.** The page suite scans its own prose now, for the
earn stems and for pool / money / draw / unspent / the advance concept, and reports the word with
its surrounding sentence rather than a bare fail.

### The print stylesheet is the PDF's design, and it deleted the institution names

"Download PDF" prints the page rather than serving a file, because a file built once is the
snapshot page this one was retired for. That makes the print rules the artifact, not an
afterthought, and they have real work to do: five folds and three strategy lists are closed
`<details>` (a headless print-to-PDF never runs our `beforeprint` handler, so CSS has to open them
on its own), the tab's sticky header parks over the body from page two onward, and the controls
print as dead boxes.

Hiding the controls is where it went wrong. The first draft swept `.cplfund-caret` in with the
toolbar and the search box — and **the caret IS the institution's name**: the calm pass turned the
row toggle into the name as a real button. The PDF came out as 119 rows of figures with an empty
Institution column and nothing to say whose they were. It was invisible in the markup, invisible in
jsdom, and obvious in one screenshot. **Rendering is the only test for a rendering change**; the
guard now asserts that print never hides that class, and says why in the assertion text.

### What the window measurement showed, and what Sam's screenshot showed

Sam reported that the college table "doesn't fit the window width". Measured in Chromium: the
table needed **1,039px inside a 942px box** with the District column shown, so the last column ran
into a sideways scroll. The cause was not the table — it was that the page capped everything,
including the tab's full-width app, at its 1000px prose column. The heading stays in the prose wrap
and only the table widens (`.wrap.wide`, 1320px), which is his "you can widen the table if
helpful".

Then he added the finding nobody had the measurement for: *"the column selector drop down stays up
after opening — not sure how to close it."* A bare `<details>` closes on exactly one gesture, a
second click on its own summary, and that is not where a hand goes. Staying open across a
checkbox toggle is deliberate — several columns in one visit — so the fix adds only the two
gestures that mean done: a click outside, and Escape with focus returned to the summary. **The
listeners are torn down per render**, because the mount is rewritten whole on every render and a
document-level listener with no teardown stacks one deep per render, each holding a dead panel.
That last part is the half no interaction can reveal, so the guard asserts on the mechanism.

### 138 focus rings that were never drawn

`npm run a11y funding-model` failed on both the old page and the new one: **138 focusable controls
with no visible focus ring**. `cpl_funding.js` writes every ring as
`outline: 2px solid var(--gold-accent)`, and `--gold-accent` lives in COBI's `:root`, not here. An
undefined `var()` invalidates the whole declaration at computed-value time, so `outline` fell back
to its initial value and drew nothing — the search box, the Columns menu, Download as Excel, and
every institution name in the table. `.cplfund-toolbar input:focus` was worse: it sets
`outline: none` and trades it for `border-color: var(--navy-secondary)`, a second undefined token,
so the trade gave nothing back.

Mapped to the page's own `--focus-ring` rather than to the gold hex it names, because
`prototype/check_contrast.py` puts #E3B341 at **1.74:1 on paper** and 1.95:1 on white — under the
3:1 WCAG 2.2 SC 1.4.11 asks of a focus indicator — while cobalt measures 7.54:1 and 8.44:1. The
target passes clean now. **A token that resolves on one page and not another is not a styling
detail; it is a control with no visible state, and only the sweep says so.**

### A shared section id is a shared control

Sam then asked for the section titles to use the model's language, which is how the worst defect of
the run got found — by reading the tab's own section names beside the explainer's.

The tab's sections are `about · college · window · pools · formula · eligibility · priorities ·
timing`. The new section I had just shipped was **`priorities`**. Curation is id-keyed:
`sectionCuration(id)` resolves `titles[id]` and `secHidden[id]` out of the shared config, and the
config carries a **live** `titles.priorities` — Sam's own rename of the tab's section to *"Funding
Outcomes of Ed. Code §78093.2(d)(1)"*. So the explainer's h2 was being replaced by the tab's title,
and hiding the tab's priorities section would have hidden the explainer's. Reproduced against the
stored value before renaming it to `outcomes`.

The rule was already written down. `cpl_funding.js` carries a long comment explaining why the
explainer's ids are **not** aliased onto the tab's — *"a semantic alias would make one hide mean two
different things on two pages and be wrong in a way nobody could see from either"* — and names
`timing` as the one deliberate collision. I read that comment while adding the section and still
picked a colliding id, because the comment argues against *deliberate* aliasing and an accidental
one looks like neither.

**A documented invariant with no guard is a convention, and conventions lose to autocomplete.** The
check now reads `SECTION_HOUSE_ORDER` out of the source rather than copying it (a third copy would
go stale exactly when the tab adds a section), lists `timing` as the single exemption so a second
one has to be typed in and justified, and asserts that the scan can see a collision at all.

Mutation notes, because two of them were instructive: renaming a section id in the markup alone
fails four *other* assertions before mine, so the guard had to be tested on the path it is actually
for — markup, declaration and the suite's own list all renamed together. And renaming
`SECTION_HOUSE_ORDER` in the source to break the read is too destructive to be a mutation at all: it
breaks the module. The realistic drift is a **reformat** — single quotes instead of double — which
leaves the code working and the regex matching nothing, and that one the guard catches by name.

### Patterns that worked

- **Measuring the complaint before designing the fix.** "Doesn't fit" became "1,039 in 942 with
  District shown", which named both the cause and the size of the remedy.
- **Screenshotting the print media.** Two defects — the empty Institution column and the re-stacked
  figure grids — existed only at paint, in a medium no test renders by default.
- **Mutating every new guard.** Nine mutations across three suites; one of them found that the
  requirements guard *died* rather than failing when the payload key went missing, which is the
  S219 lesson reproduced inside a guard written after it.
- **Reading the redirect before answering the question.** Sam asked whether to keep this page as
  the public view; `cpl_funding_public.html` already carries the answer, and the reason is a
  disclosure bug rather than a preference.
- **Taking the small ask seriously.** "Align the section titles with the model's language" reads
  like a copy-edit. Doing it meant listing the tab's section names beside the page's, which is the
  only reason the id collision was ever seen.

## 2026-09-16 — S265 (SkyPublius), second pass: main went red with nobody's hands on it

Sam, closing out an unrelated session: *"I told it not to handle this matter but leave it to you."*
The matter was `main` red on `test`, found by the SJCOE crosswalk session, which correctly refused
to fix funding tests inside a crosswalk branch.

### Three assertions that described yesterday's data

| Suite | Assertion | Pinned | Now |
|---|---|---|---|
| `cpl_funding_measure_picker` | `4c` | `826.8 CPL FTES` | `pac_u` 24,804.45 → 24,847.45 = **828.2** |
| `cpl_funding_metric_pin` | `7b` | "at most the **3** `pp_u` carriers" | **4** |
| `cpl_funding_metric_pin` | `7b2` | `25 units` | `pp_u` 25 → **63.5**, printed 64 |

All three read `cpl_funding_performance.js`, which the daily dashboard workflow rewrites. Three
consecutive `Daily dashboard update` commits regenerated it. The measures moved by ordinary
amounts; the assertions moved by nothing.

**Bisected before blaming anything**, because the explainer merge had landed hours earlier and was
the obvious suspect: both suites are green at `d906cf2` (before it) and green at `4a00bd9` (the
merge itself), red only after the cron. The code was never wrong, and neither was the crosswalk
branch — which is what its session had already established from the other side.

### What it cost somebody else

The crosswalk session reproduced the failure against `origin/main` in a worktree, diffed its own
branch to prove it touched no funding file, wrote the finding up on its PR and stood down. That is
the right call and it is an hour of work that existed only because a test lied about what was
broken. Red `main` is a tax on every PR opened while it lasts: the first duty on a red check is to
prove it is not yours, and here that proof took a bisect.

### Deriving without making the test vacuous

The fix is to compute each expectation from the same artifact the code reads. The obvious objection
— that this can only ever pass — is answered by keeping three properties:

1. the expectation is keyed to a SPECIFIC measure, so reading the wrong one still fails;
2. the rival measure's figure is asserted ABSENT, not merely unmentioned;
3. `chosen !== rival` is asserted outright, because if the two lanes ever agreed the comparison
   would pass regardless of what the code read — and a check that cannot fail should say so rather
   than wait to be trusted.

For `7b`'s carrier COUNT the same shape applies structurally: the non-zero column must equal the
`pp_u` carrier count derived from the artifact, and the portal lane must be several times thinner
than the applied lane — which is the claim the assertion was always making ("the prose landed on
the thin lane"), in a form the daily run cannot move.

This file's own suite already did this for its option SET — it rebuilds `METRIC_SOURCES` out of the
consumer "rather than a copy that can drift from it". The values simply never got the same
treatment.

### ⚠️ A mutation that changes nothing proves nothing

Verifying the rewrite, I forced `earnFraction`'s statewide lookup to a fixed key expecting `4c` to
fail. It passed — and my first reading was that the rewritten assertion was weak. It was not: that
particular figure is rendered from a different path, so the mutation never moved the thing under
test. The decisive mutation was neutering the picker's own write path, which fails `4c` by name
along with 4b, 4e and three of section 5; pointing the portal prose rule at the applied lane fails
`7b` and `7b2` by name.

**Check that a mutation actually changed the output before drawing any conclusion from a green
run** — in either direction. A no-op mutation looks exactly like a passing guard.

## 2026-09-22 — S283 (SkyFund): the leadership-review pass

Sam's last content edits before he reviews the tab with CO leadership, shipped in #1660; the four
calls still his ride the [funding review sheet](https://claude.ai/artifact/9MfbN6jqio8as9mY4LwPB2).

### "$0 demonstrated" was true of one number and false of the program

In Sam's signed-in scenario every institution was gated (0 of 118 confirmed), so `winEarned` read
$0 while $2,174,757 sat in `winHeld`: funding MAP had demonstrated, reserved until confirmation. The
Summary printed *"$0 demonstrated so far"* over a reserve bullet saying the opposite. The allocation
bullet now counts `winEarned + winHeld` as demonstrated and ends on local confirmation, which is the
one fact the reserve line carried. **A figure that excludes gated funding reads as nothing
happened.**

### One word, two figures

The formula box called the per-priority ceiling *"the cap"*, and the next bullet called the
$400,000 bound *"Cap"*. A leadership reader has no way to tell them apart. The per-priority figure is
now the **max award**, Sam's own term for it (2026-09-01), and *cap* names the bound alone.

### The fifth identity-join miss

The baseline counts ran over `base().colleges` (115) and so left out Calbright, which Sam counts as a
college (116). The coordinator match had the same blind spot: its roster came from the same list, so
no noncredit-only row could ever match, and MAP spells the institution *"Calbright College Credit"*
and *"Calbright College Non-Credit"*. It changed nothing today (neither has a coordinator), which is
exactly how a join failure stays invisible. `eligColleges()` is the one list now.

### Ten suites pinned phrasing, not facts

A style ruling (positive-first, no "this, not that") broke ten suites, because each asserted the
retired sentence: *"not its targets"*, *"placed on the table"*, *"rather than a carve-out line"*,
*"the annual tranche buys"*. Each now asserts the FACT the phrase carried (*targets stay proportional
to the pre-cap share*), so the next wording ruling costs a sentence, not a suite.

### Verify against Sam's screen

The local render runs on baked defaults (no remote config on localhost), so it showed $10.9M
demonstrated where Sam's scenario showed $0 and a reserve line. His screenshots were the ground
truth for every Summary edit; the local render verified layout only. The tab's a11y failures were
measured against `origin/main` in a worktree before any were called pre-existing.


## 2026-09-23 — S283 (SkyFund), second pass: a fourth priority, and a button that saved nothing

Sam's P2/P3/P4 asks, shipped in #1662. The detail is in the lane file and the PR.

### A count typed as three broke eighteen suites and two live surfaces

Adding Priority 4 broke every test that had assumed three priorities, and it would also have broken two
live surfaces the tests did not cover. The briefing's count gate would have sent every college's steps to
the standalone list. The explainer typed "three" in three sentences. Sam's stored `[0, 2, 1]` failed
`isPermutation(v, 4)` and fell back to the natural order, which swaps P2 and P3 with nothing on screen to
say so. **An order written before a priority existed is extended, not reset**, in `cpl_funding.js` and
`college_briefing.js` alike. Tests count from `NPRIO`.

### Read the request log before the handler

Sam said the (D) card's Designate button did nothing. In jsdom the code worked. The edge logs showed nine
200 PATCHes, the last four his releases, and **no request after them**, so the click never reached a
save. The likeliest cause is that nothing was selected in the list when he clicked, and the button returned
without a word. It now says what it needs. The log split the problem in two (the client never sent a
request, or the server refused it) before any code was read.
[note](kb-notes/methodology-a-control-that-does-nothing-read-the-request-log-first.md)

### A ruling superseded by the same person is replaced, and says so

The (C) note quoted Sam's 2026-08-30 *"not measurable at this time, and may never be"*, and a test pinned
it. His 2026-09-22 EDD ruling replaces it on the page with both dates named, and `cpl_memory` records the
supersession explicitly.

### Three rulings, built the same hour

He held P4 at 0% until the first import, let CO research define the outcome, and took the drill-in
consolidation as proposed. The follow-up PR shipped the one-line Baseline and the import receiver.

## 2026-09-23 — S284 (SkyWage): Scenario 3, a base that read $149k, and a scenario nobody published

**What Sam asked.** Scenario 3 matches the statute's four outcomes: delete the second completion priority, number
Career attainment P3, retitle the (D) card "Innovation Projects" as P4, a per-card "show on college rows" toggle,
an editable Measured-from list, plain-language Metric wiring, the NOCE/Calbright unmatched note, the ~$149k at the
base, a tighter drill-in, and a check that a new scenario stays wired to every surface. Shipped as #1664.

- **The ~$149k was a label on the wrong figure.** All 51 institutions at the base receive exactly $150,000; the
  table showed only the credit share ($149,321 at Clovis) beside "(at base)" and the NC share beside it. The base
  binds the COMBINED award, so the fix is a Max award column carrying the bound word and the one qualifying line.
  It brings back a combined column R6/R7 retired on 2026-08-31, so it is item 4 on his sheet.
  [note](kb-notes/methodology-label-a-bound-where-it-binds.md)
- **A new scenario was NOT wired to the public.** Every surface read the scenario the viewer's browser had
  selected: a college (no selection) saw Scenario 1 on the explainer, Sam's browser showed his working scenario
  there, and `college_briefing.js` named "Scenario 1" in code. A stored `published` name per project now decides
  what the explainer, the briefing and an unchosen browser read, with a Publish control on the strip; unset keeps
  Scenario 1. The report writer says when it drafts from an unpublished scenario.
- **A deleted share must move.** An award is W times the SUM of the shares, so a share deleted in place removes
  that part of the funding from every award; Delete asks which priority takes it, and the totals row now warns
  whenever the shares stop adding up to 100%. Sam, mid-session: *"I want to put the 33% into Career Attainment"*
  (not into Completion). Measured on Scenario 3, the statewide Current Total goes from $2,613,990 to $1,354,241,
  because Career attainment waits on the first EDD import; the sheet proposes holding Scenario 1 published until then.
- **His NC base/cap idea is the live model.** Per-lane bounds proportional to each institution's NC FTES share,
  the NC base taken from the CR base, reproduce every award to $0.00. NC gets parity (7.12% of FTES, 7.07% of the
  funding); the cap on the combined award trims Mt. SAC's NC share to $115,102 against $237,441 proportional.
  A weight is the clean lever (x1.25 gives $2,106,330). Calbright's data file says 21,438 NC FTES, which is 8.6 per
  student and stays behind the 1,000 stand-in.
- **The unmatched note was a lane-word gap in the builder.** MAP spells the credit locations "North Orange
  Continuing Education Credit" and "Calbright College Credit"; `_feeder_resolver` now folds the trailing word, as
  the shared identity file already does. The artifact moves on the next daily run.
- **One numbering, two card kinds.** A reported card is still no entry in `priorities(slot)`; the label reads a
  STORED unified order (`cardOrder` + an explicit `reportedCards`), because deriving the reported set inside
  `priorities()` recurses. `priorityOrder()` stays the truth for the measured cards' relative order.
- **Tests read columns by header now.** Thirteen suites indexed drill-in and row cells by position; the Max award
  column and the six-column drill-in broke them for layout reasons alone.
- **Supabase notice (Sam, 2026-09-23):** from 2026-10-30 a NEW table in `public` needs explicit grants for the Data
  API. Next session: grants in every table-creating SQL file, and a lint beside the function-grants one.

## 2026-09-24 — S285 (SkyGrant): the config after the stale save, and the briefing's funding box

**What Sam asked.** Nothing new in the tab; the queue was SkyWage's handoff, and two of its items touched this lane.

- **The config had not moved since the stale-window save.** Read 2026-09-24 00:2x UTC: `updated_at` 2026-09-23 21:30:12,
  `projects.cpl-implementation.published` unset, Scenario 1 Year 1 slot 3 (Career attainment) at share 0.33, factor 0.5,
  six strategies; slot 2 (Completion) seven. Both of Sam's evening-sheet edits (press Publish on Scenario 1 again, move
  the six strategies to Completion) remain his, and colleges see Scenario 1 by the unset-marker fallback. The read went
  through the JSON path this lane records, with each `strategies` array reduced to its length so one query answered.
- **The briefing's funding box carried the retired words** (handoff carryover; #1675): *earns against*, *drawable*, *the
  dollars*, *money*, *pool*, *modelled*. The two guards that hold the funding tab read the tab's DOM and `cpl_funding.js`;
  the briefing is a third file neither opens, the shape S265 met on the explainer. Swept by Sam's map: the measures count
  toward the figure; a capped college qualifies for funding at the same rate; the funding rolls forward and the college
  receives its demonstrated funding once it confirms; only noncredit results count toward the noncredit share; *What
  counts toward it*; reaching a target qualifies the college for the whole share. Three sentences restated positively
  (the base note, the off-roster note, the failed-load notice). *Credit students have earned that has not been acted on*
  stays, by the subject test. Guard: `tests/college_briefing_earn_retired.test.js` reads the source with the
  identifier-sparing lookarounds and one named exemption; two checks in `college_briefing.test.js` that pinned the old
  sentences now pin the new ones. Text only inside an existing box, so no a11y re-measure.
- **Four unfloored files got floors** by hand from isolated runs, twice each: the new guard at 9, and S284's
  delete_confirm 11, press_hold 11, save_over_newer 15. The first commit wrote them beside `_readme` and `_note`; the
  ledger reads `files`, so a second commit moved them. Read a JSON ledger's shape before writing to it.
- **Sam's ruling on the SQL prompts,** recorded here because the config read spent two of the dozen: stop working the
  swarm and budget the calls. The approval doc carries it verbatim; this lane's reads are one statement each from now on.

## 2026-09-24 — S286 (SkyTally) and S287 (SkyLane): the review sheet, the lane tables, and a suite cut to seven minutes

**What Sam asked.** S286 opened the tab to him as a review sheet — the tab as its live config paints it, every section an
item, every line tagged N.k, with reply chips and, at his ask (*"revise the text in, say, 3.1 in the 3.1 box"*), edits in
place. He reviewed through item 7. S286 shipped two PRs from it and left a third in draft; S287 landed the third and,
between the two, halved the wait every PR pays.

- **From the sheet, on main the same day.** #1677: a gold Veteran Star beside the 59 flagged college names, the drill-in
  headers over their columns (the outer `.cplfund-table th` and `tr.cplfund-detail td` rules had reached the nested cells;
  three rules at `(0,2,1)+` restate the geometry), the tabs renamed *2026-28 Funding* and *2025-26 Funding*. #1678: the
  Baseline line reads *60 of 116 colleges meet this. 59 hold the Veteran Star* (Calbright meets it with certificates); the
  Timeline closes with his note as a `TEXT_BLOCKS` entry; MAP partner agencies (`entity_kind: "partner"`: Launch
  Apprenticeship, Futuro Health) are skipped at the row by the builder, since they are not colleges and belong nowhere on
  the CCC funding model; first column left, the rest centered — his house format for tables.
- **The lane tables and the one-line card head (#1679).** One table per lane in his six columns, Outcomes · Max FTES ·
  Max Funds · Actual FTES · Actual Funds · Difference, credit first, then noncredit or a *Credit only* line, so *"the NCs
  [don't] get lost in the shuffle"*; the card head reads *Priority N · (A) Access* with the pickers inline and the law on one
  line. Seven suites had pinned the old surface. The rewrite kept every check in force and moved each to where its fact now
  lives: the percent that sat in the Actual cell rides the Actual FTES hover; *To go* is the Difference column with the FTES
  gap in its hover; the CR/NC split that the Total Possible hover carried is the second table. Two crashes were selector
  faults rather than assertion failures: `colOf(dtl, "Actual")` found no column named that, and `.cplfund-dtl-table tr`
  returned the noncredit table's header row as a priority row — a suite that reads the drill-in selects the lane table.
  Floors raised by hand for the four suites whose counts grew (statewide_expand 37 → 40). `npm run a11y` unchanged: the
  pre-existing four small targets and the 390px prose line.
- **The suite cut from twenty minutes to seven (#1682).** Sam: *"would it make sense to chunk our npm tests for
  git--they're taking 20 mins + each now ... It's probably suite growth."* Timed file by file, this lane's family is
  **56 files and 87% of the suite's 3,592 s** of serial work (28 files and 78% on 2026-08-28), and the runner was already
  at one machine's memory ceiling, so the suite now runs as four shards on four runners fanned into the one check named
  `test`. The cost that matters here: the next twenty `cpl_funding_*` files cost more than the next two hundred elsewhere,
  and a slower boot in `tests/lib/cpl_funding_harness.js` moves every shard at once. The note:
  [`methodology-a-memory-bound-suite-scales-across-machines-not-workers`](kb-notes/methodology-a-memory-bound-suite-scales-across-machines-not-workers.md).
- **Two sessions, one number.** The EACR session ran beside this lane's and also called itself S287; it wrote handoff 288
  and took the receipt name `cpl_memory_2026-09-24_s287.sql`. This session's handoff is 289 and its receipt carries a
  `_skylane` suffix; the four rows S286 staged (partners outside the model; the six columns; the house table format; edits
  in place) are written and logged, creates = 1 each, in one `execute_sql` call.
- **Still Sam's, in the tab.** The config had no save after 2026-09-23 21:30 UTC: the two section renames, the five
  timeline edits from the sheet's `edits` store, Publish on Scenario 1, and the six carried strategies to Completion in
  Year 1. Items 8 to 10 of the sheet carry no verdict.

## 2026-09-25 — S291 (SkyReel): a guide video for colleges, in three drafts

Sam asked for a 30-second whimsical stipple explainer. That became a funding guide built on screenshots, and then a 90-second guide in animated text alone. He preferred the text, saying it explains more than a screenshot does. Three lessons:

- **Pasted images reach the session as files only when they come in a message of their own.** Screenshots pasted into a message that arrived while a turn was running never reached the disk. A full-page capture arrives at thumbnail width (319 px) and can't be read.
- **The preview panel would not play a 1.8 MB self-contained HTML file.** A 166 KB file played. Screenshots embedded as PNGs inflated the page, and recompressing them to WebP did not rescue it. The text-only version is 75 KB and plays.
- **Rendering an MP4 from a page.** Drive Chromium over DevTools, seek the clock and capture each frame (about 15 frames per second), and render the Web Audio score with an OfflineAudioContext. Pull the 29 MB base64 WAV back in 1 MB slices, because one large DevTools message stalls without an error. Playwright's bundled ffmpeg has only VP8, so use the `imageio-ffmpeg` wheel for libx264 and aac. Details are in [`methodology-render-an-html-animation-to-mp4`](kb-notes/methodology-render-an-html-animation-to-mp4.md).

Sam's rulings are in the lane file: Sample College, no releveling, and the figures and link cleared for his walk-through.

## 2026-09-26 — S294 (SkyCadence): the narration reads naturally, and the narrated draft is built

Sam heard the v2 narration as stilted, "especially when sounding out C-P-L rather than just saying it quickly--same with sounding out the year numbers." Three lessons:

- **A spelling is measured in its sentence.** Unspaced `CPL` reads as one quick word, but unspaced `FTES` reads as the word "eftess", and `EDD` and `MAP` read differently alone and inside a sentence. `narrate.py` fixes what spelling cannot at the phoneme level, requires every fix to fire, and fails a run that carries a reading Sam rejected. Durable version: [`methodology-hear-a-synthetic-voice-through-a-recognizer`](kb-notes/methodology-hear-a-synthetic-voice-through-a-recognizer.md).
- **A recognizer hears what the phonemes hide.** `faster-whisper` heard "the 2627 year" (a comma fixed it) and "do November first" ("by", the headline's word, fixed it). Its word timings put each "CPL" at 570 ms against v2's 702 ms.
- **One film clock, mapped, makes a narrated cut.** Every picture in the introduction is a function of one film time, so the narrated cut maps the player's time into it scene by scene (`ft()`), and the score keeps its tempo by arriving section by section just ahead of each stretched scene. Rewriting the score's bar-numbered rules as positions within a section reproduced all 1,293 events of the introductions' score.

### Moved verbatim from the lane file (2026-09-26 compaction)

✅ **THE INTRODUCTION VIDEO: CPL Funding in Motion** (S291 SkyReel #1691/#1694; S292 SkyRelay #1697/#1698; S293 SkyBeam). A 90-second **introduction** for colleges in `prototype/funding_video/`, one per scenario from ONE source (`funding_in_motion.src.html` + `CONFIG` in `build.py`), each an HTML page and a 1080p MP4 (`20260926_*`). ⭐ **An introduction, not a guide** (Sam, 2026-09-26: *"a guide would be much longer and more detailed"*): the explainer's header link reads "Watch the 90-second introduction" beside a downloadable MP4, and switches to Scenario 2's page and MP4 when the explainer shows Scenario 2 (`VIDEOS` in its painter). A real guide is a separate, longer piece. The player opens filling the window, with Full screen and Download MP4, and every scene is sized to fill the frame. The CPL Initiative logo leads with the MAP wordmark beneath it at three-fifths the width (Sam: CPL Initiative most prominent, MAP second fiddle with special treatment). The MAP logo's red arrow flies every scene (Sam: *"like a student searching for its pathway and CPL helps it speed and find its direction home"*), shoots down five pixel barriers to CPL at scene seams (*"like the old Space Invaders arcade game... have to be sly with it"*), and nests back into the A at the close; its keyframes are measured from the scene elements. The orchestral score builds over one theme to a key change (*"should build rather than just repeat"*). ⚠️ **ITS FIGURES ARE TYPED IN, NOT READ LIVE:** Scenario 1 (config read 2026-09-24) gives Sample College $345,220 and an Access target of 44.3 FTES / $112,484; Scenario 2 (stored 2026-09-25) is 50/50 with Career attainment and innovation projects as a reported card, Access target 67.1 FTES / $170,431, computed in jsdom by adopting the stored config through a stubbed config fetch. If the dials move, edit `CONFIG` and run `render.sh [s2]`, about 5 minutes each. ⭐ **Sam's rulings (2026-09-25):** Sample College stands in for Chaffey and may keep Chaffey's real numbers. Year-one funding **carries forward to year two for the same college** and **is NOT releveled**; releveling happens only in a possible year 3 and isn't mentioned. The explainer link and the dollar figures are cleared for his sunshine walk-through with colleges. ⚠️ **The explainer timeline still reads "Undispersed Funds Rolled to Year 2 and Releveled" (Aug 2027), which contradicts that ruling.** Its wording is a curator edit on the tab. `tests/funding_video_page.test.js` guards the naming, the controls, the download targets, the barriers and the narration's spoken form; details in `prototype/funding_video/README.md`. ⭐ **The narrated draft is built, awaiting Sam's OK on the read and the cut** (S294, 2026-09-26): variant `n1`, `funding_in_motion_n1.html` and `20260926_CPL_Funding_in_Motion_Narrated_Draft_2.mp4`, three minutes. The Heart voice (Kokoro-82M, run locally) reads `narration_s1.json` through `narrate.py`, whose phoneme fixes and bans answer his v2 note (*"stilted, especially when sounding out C-P-L... same with sounding out the year numbers"*); the narration drives the clock, each reveal lands on the word that names it (draft 2, 2026-09-29: Sam's 2026-09-27 ask, `cues` in `narration_s1.json` pinned by `cues.py`), the score is a bed under the voice, and captions ride the page and the MP4. It is not linked from the explainer until he approves it.

⓪a ✅ Sam ran the [receipt SQL](../../../kb/receipts/cpl_funding_config_titles_timing_2026-09-24_s287.sql) in the SQL editor 2026-09-24 20:15 UTC (rows_updated 1): both stored scenarios now read "Introduction", "Minimum Conditions", *Confirmation Deadline*, no " in MAP". Still his in the tab: Publish on Scenario 1 (optional; an unset marker falls back to it) and moving the six carried strategies to Completion in Year 1.

## 2026-09-28 (S296 SkyBeacon) — the Annual view compares a year with a year

Sam's funding asks card 1 (year against year) landed in #1721: under Annual funding
each award cell set one year's tranche over the whole window's qualifying figure, so
a college could read 191%. `collegeAlloc` now keeps held and lane figures per year,
`cellFig()` reads the viewed year's, and the district and SYSTEM rows add them alike.
**A sheet's measured premise must know the fix's shape:** card 1's predicate read the
new `cellFig(row, "earned_total")` call as the old window read, so it would have kept
the answered card on the sheet; it left with the card (#1722). The timeline default
dropped "Releveled"; the live label is Sam's saved wording (To-Do
`s296-sam-timeline-label`), since no session writes `cpl_funding_config`.

## 2026-09-29 — S301 (SkyShuttle): draft 3 of the narrated video, and the tab's last small targets

- **A retired word survives on every rendered surface nobody swept.** The brief said minimum conditions on 28 September (#1736), and the video still said *baseline* in the picture of all three pages and in the narrated voice. #1745 fixed both, and `tests/funding_video_page.test.js` now fails on the word in any narration, cue, caption or rendered text.
- **A longer heading takes a smaller type, not a second line.** "Meet the minimum conditions by November 1, 2026" wrapped into the first row at 5.2cqw; at 3.9cqw it keeps the old heading's width on one line.
- **Re-versioning a file breaks every link to it.** The explainer linked the introductions' MP4s by name, so the `_v2` files moved the links in the same change, and the test fails on a link to a missing file.
- **Re-read only the scene that changed.** The other nine clips came out sample-identical, so the cue pass carried over (39 pinned, 33 on their word).
- **NEXT ③, measured with `npm run a11y` before and after:** four targets under 24px, fixed with the house patterns (`padding-block`; padding with negative margins for a raised letter; `min-height` on a wrapping label). Every dead class was checked across the repo and against names built by concatenation before 22 rules went.
- ⚠️ **A test loop with a 120-second cap reports false failures on this tab.** `cpl_funding_calm` alone takes 2 min 11 s; run the funding suites uncapped and read each file's exit code.

## 2026-09-29 — S302 (SkyWeft): sheet 3's funding verdicts, in the cards' own words

Sam answered all eighteen cards of sheet 3 ([XzQMks96QszUDAyXADP3Ag](https://claude.ai/artifact/XzQMks96QszUDAyXADP3Ag), `replies/done` through 18
at 12:39Z). The lane records each ruling; the words the cards proposed, which the work
uses verbatim, are here.

- **Card 4, *demonstrated*.** Each Priority Outcomes card reads *Demonstrated: $X of $Y
  Total Possible*. Demonstrated is the statute's verb, §78093.2(d)(2); the Curr columns
  keep the qualifying figure.
- **Card 5, *use*.** The thank-you: *"Thank you. Your participation is confirmed, and your
  college counts as participating from today."* The form's note: *"Your name and email are
  recorded for the Chancellor's Office and are not shown publicly."*
- **Card 6, a note with no chip.** *"The explainer is wrong. Colleges will be funded for FTES
  that meet the priority outcomes. The full outcomes-based funding is available within the
  two-year window once minimum conditions are met."* The card had proposed *"Every
  institution keeps its full max award. The model counts every outcome an institution
  demonstrates toward that award, and the institution receives the funding once it meets
  all three minimum conditions."* and the heading *Funding by institution*; his note
  replaces the premise, so the rewrite starts from his words.
- **Card 7, *write*.** The timeline's August 2027 entry becomes *"Remaining Funds Carried
  Forward to Year 2"*; the Minimum Conditions introduction becomes *"Minimum conditions to
  qualify for implementation funding:"*. Both scenarios, a receipt of the before-values.
- **Card 16, as proposed.** Re-read the Timing scene with its first two sentences swapped, so
  the voice names the release dates first and the two-year amount second.
- **Card 17, as proposed.** After the quarter-system line: *"Sample College's Access target,
  for example, is about forty-four FTES, behind about a hundred twelve thousand dollars."*
- **Card 18, *keep them all*.** The counter on *million*, the barriers' own pace, the years
  and *One-time funding for 2026–27* arriving about 3 and 3.7 seconds early, the Minimum
  conditions heading typing in on its words, the eased motion, and the arrow pointing about
  2 seconds before its figure.

**Moved verbatim from the lane (S302), the 2026-09-24 dial read:**

⭐ **THE DIALS (config read 2026-09-24 00:2x UTC; unchanged since the 21:30 UTC save of 2026-09-23).** **Scenario 1 is the published scenario** (a stale window's 21:30 save cleared the marker; unset falls back to it): P1 Access `ppa_u` 33% · P2 Completion `ptc_u` 34%, outcome B · P3 Career attainment `ca_u` 33%, factor 0.5, carrying the six transcription strategies of the deleted slot 1 (`prioRemoved: [1]`) · (D) Innovation Projects. The 115 maximum awards total the $24,757,639 allocation. Scenario 3 sums to 133%, unpublished. ⭐ Do not build a combined ORIGIN+counselor source (Sam split them 2026-09-15; `pa_u` + `ppa_u` buys 0.3%).

## 2026-09-29 — S302 (SkyWeft): round 8 of the College Dashboard, and a write that needs Sam's permission

**What worked.**
- **Draw the mockup from the running code again, and keep the harness this time.** `prototype/mockup_harness/` renders the tab in Chromium with Supabase answered from fixtures, opens every shown drill-in and captures markup plus matching CSS. The priority rows became rows of the college table itself, so they line up by construction and the Columns menu hides them with the same child-combinator rules.
- **Look for a published copy before building a new read.** The CPL Coordinator's name was already public in `map_college_contacts_pub` (My College reads it); only the primary contact needs the reviewer-gated table.
- **Measure what a condition's wording claims against what its check reads.** Sam defined the first condition as three parts; the check reads the coordinator alone (49 against 43).

**What bit.**
- ⚠️ **A new workflow that writes Supabase with the service key is refused by the session's permission check.** Card 7's applier is built; its workflow is Sam's call. Ask before building one.
- **The live config moves while a session plans a write** (Sam saved at 13:58Z, after the plan's read). The applier guards every path on its before-value and writes only over the version it reads.
- **The npm Playwright's browser path does not exist in this container**; launch at `/opt/pw-browsers/chromium`.

**Moved verbatim from the lane (S302, to stay under the 20,000-byte budget):**

⚠️ **THE ORIGINATION CUTOVER IS ASYMMETRIC.** The **NC side** (`LocID2`) is wired downstream and lands once a session adds the column to the daily fetch (`fetch_custom_report.py` asks MAP for a fixed list; a column a view lacks fails the whole view). The **credit side waits on a person**: the builder prints *"the ppa cutover … stays PENDING"* with an `origin_values` histogram, so the switch is made on CONFIRMED spellings. ⚠️ **A lane file is a summary of a measurement, not the measurement** (`scripts/funding_effective.js`; [note](../../kb-notes/methodology-a-lane-file-is-a-summary-of-a-measurement.md)). Full text before the S300 compaction: the lessons archive.

✅ **The explainer is titled "2026-2028 CPL Initiative Funding: How It Works"** (S292), with a statutory intro (SB 135; Ed. Code §78093–78093.2); three suites pin the tab's own link text. ⚠️ `funding_model_page.test.js`'s vocabulary scan lifts the statute's "advancing career attainment" out before scanning; every other *advance* stays banned.

✅ **SCENARIO 3'S CONTROLS (#1664, 2026-09-23).** A **published scenario** per project (`projects.<pid>.published`) is what the explainer, the college briefing and an unchosen browser read; unset keeps Scenario 1. ⚠️ **A window saves only over the version it read** (the PATCH names `updated_at`; [note](../../kb-notes/methodology-a-window-saves-only-over-the-version-it-read.md)). Add/Delete a priority (`prioRemoved`, `prioAdded`; ⚠️ **a deleted share must move**, so Delete asks which priority takes it). One numbering for reported cards (`cardOrder`, `reportedCards`; ⚠️ the label inside `priorities()` reads stored data only). ⚠️ **A redraw during a press swallows the click**: `render()` waits while a press begun in the mount is open (`cpl_funding_press_hold`). Full text before the S300 compaction: the lessons archive.

## 2026-09-29 — S302 close-out: the lessons doc that one line erased

- ⚠️ **`open(p, 'w').write(rd(p) + more)` erases the file before it reads it.** Python opens, and truncates, before it evaluates the argument, so the S302 checkpoint wrote 847 bytes over this 113,895-byte doc. `docs_index_build_test`'s frontmatter-less check caught it: the doc lost its frontmatter, so its title fell back to its slug. The doc was rebuilt from main plus the S302 passages, recovered verbatim from the session transcript. Read into a variable first, or append with mode `'a'`, and compare a doc's size after any scripted write.
- **Sam allowed `funding-config-edit-apply.yml` (2026-09-29): *"Allow workflow and I'll type in myself."*** The workflow landed for reviewed config edits (#1757); he types card 7's two lines himself, and a dry run confirms them. The permission check passed the same file once he had said so.
- **A Dependabot PR's runs get no repository secrets.** #854's red `sync` check read `SUPABASE_SERVICE_KEY unset`; setup-python v7 itself installed and ran. Merging a bump that touches a workflow triggered by its own file runs that workflow on main with the real key (`coci-offerings-sync.yml` writes).

## 2026-09-29 — S303 (SkyWarp): round 9, sheet 4, and a card that asked about a setting nothing reads

**What worked.**
- **The live `<details>` is the truth, not its `toggle` event.** The Introduction reopened after Hide because a browser fires `toggle` as a queued task: a redraw landing between the click and that task (a remote load, or the press-hold redraw) rebuilt the section from state that had not heard of the click. `render()` now reads every section's open state from the DOM first. Reproduced in Chromium by holding the button down and redrawing mid-press; it reopened and stayed open (#1761, `tests/cpl_funding_round9.test.js`).
- **Bake no percent beside a masked count.** The veteran line shows veterans, JSTs and the percent (`vet_jst`, `vet_jst_counts()`); a count of 1–9 bakes as `<10` and the builder then bakes no percent, because a percent beside a masked count gives the count back.
- **A gray figure never enters a total.** Gated Curr cells show the held figure by lane (`held_cr`, `held_nc`, `earned_withheld`; Sam: *"should not be 0"*); subtotals and the Statewide row still add qualifying funding alone.
- **Answer a public check with booleans.** The first condition's three parts (card 1) live partly in a reviewer-only column; `map_coordinator_summary()` answers each part as a boolean, so the public page and the tab run one check and no name leaves the table. A return type change needs DROP + CREATE; restate the grant (#1765).

**What bit.**
- ⚠️ **Sheet 4 card 5 asked Sam to rule on a stored block the model never reads.** Its premise came from a `cpl_memory` row that read `yearPriorities["2"]`; `mirrorYears` is on in both scenarios, so `prioSlot()` gives every year Year 1's priorities. Scenario 2's Year 2 already followed P1 and P2. Read what the model computes (`_effective()`, `scripts/funding_effective.js`), never the stored dial, before writing a card about it.
- **A retired-word lint that matches substrings flags the house's own wording**: "rolled" inside "enrolled veteran". Whole words, with a check that each retired word is still caught.
- **Decision sheets carry just the items** (Sam, 2026-09-29): no framing, count line or how-to box.

**State.** Round 9 live (#1761); sheet 4 answered 22:26Z, nine of nine his own call; cards 4 and 6 done (#1764; the config write at 22:53Z, receipt on main), card 5 already true, card 1 in #1765 (the RPC is live). Next: card 3 (0 hours reads noncredit), card 9 (Grossmont's four to ATHL), then the P3/P4 mockup (7), the Scenario 2 narrated draft (8) and the Reporting box (2, Governance first).


The funding lane's S303 relocations moved on to the [archive](cpl_funding_lessons_archive.md) at S305.


## S304 (2026-09-30, SkyHinge): card 7, P3 and P4 as reports

**State.** Sam approved the card 7 mockup (*"go ahead with the card 7 mockup"*, artifact `RRTSSiTW1k6jk6gvxUAQ1D`) and #1771 ported it: a scenario setting, `reportedAsReports`, makes a reported card a report (a Reported word, a description, What is reported, When reading TBA, Where left off the public card until set; no Metric block, no Project allocation, no detail row). Scenario 1 derives its reported cards and keeps the card it had. The Scenario 2 write (`kb/funding_config_edits_out/2026-09-30/`) removes the measured 0%-share Career Attainment card (`prioRemoved` [1] → [1,3]), splits the combined reported card into C and D, and turns the setting on. It is the first plan to add a key: the applier now takes `"create": true` with a null `before`, an undeclared new key still refuses, and rollback removes a created key.

**Lesson.** Card 7 said "a reported card that is also a funding priority still enters every sum"; the live read showed the real shape: Scenario 2 carried a *measured* Career Attainment card at a 0% share beside a *reported* card whose title also said Career Attainment. Read the stored scenario before designing the fix: the answer was to remove a card, not to change the sums.

## S305 (2026-09-30, SkyLatch): card 8's narrated Scenario 2 draft, and the Reporting box through Governance

**State.** Card 7's Scenario 2 write read back live (03:56Z, unchanged since). Card 3's rename landed on the corpus (seven groups *(noncredit)*, three ranges; A30 holds). Card 8: the Scenario 2 narrated draft, variant `n2`, 3:06 (#1774), eight scenes as draft 4 and two of Scenario 2's own, waiting on Sam and unlinked until the Chancellor finalizes Scenario 2. Card 2: `cpl_funding_reports` folds into DR-09, and the mockup ([BV2Xqt49vCYicX5xdEKP5E](https://claude.ai/artifact/BV2Xqt49vCYicX5xdEKP5E)) records quarterly expenditures in NOVA's eight categories (#1773); the build waits on three calls on sheet 5.

**What worked.**
- **A copied config is safe once its hash matches.** `funding_effective.js` warns against transcribing the config, and the sandbox cannot reach Supabase. The session copied the Scenario 2 block from an MCP read, then compared its md5 with Postgres's `md5(... ::text)` of the same jsonb before the model read it. A match means the copy is byte for byte the stored text, so `T._alloc('Chaffey')` answers for the live config.
- **Reuse a script and change only what the figures change.** Eight of ten scenes kept draft 4's words because the model gave them the same figures under Scenario 2; the recognizer and the cue pins then only had two new scenes to prove.
- **Keep the scenario out of the voice.** The picture says Scenario 2; the voice does not, so the read survives the Chancellor's finalizing it.

**What bit.**
- ⚠️ **A typed figure slipped a decimal.** The Scenario 2 introduction showed 67.1 FTES; the model gives 67.17 (67.2). 44.3 × 50/33 = 67.12 is the likely source: another scenario's rounded figure, scaled. Read every figure from the model.
- ⚠️ **A helper that builds a filename hides the read from the dependency map.** `narration('s1')` formatting `narration_%s_layout.json` dropped `build.py`'s read from `kb/dependency_map.json`; the literal filename at each call keeps it.
- ⚠️ **`check_generated.sh` is the last step before a push, after every edit.** #1773's first push ran it before a lane trim changed the `updated:` date, and `lints` failed on the stale catalog.

## S306 (2026-09-30, SkyRivet): P1 on `pa_u`, Refresh everything, and where the units come from

**State.** Sam moved P1 (Access) from `ppa_u` to `pa_u` in both scenarios (his save, 13:41Z) and asked whether Chaffey's Curr CR of 634.0 FTES was a calculation error. It is not: 19,020 applied units ÷ 30 = 634.0, and the priority counts up to its 67.2-FTES target, so Chaffey qualifies for the whole $170,431. The model reproduced his screenshot to the dollar (total $345,220). Under `pa_u`, 49 of 115 colleges reach the P1 target (0 under `ppa_u`); 7 reach P2. His Sierra reading holds: Chaffey's applied units are mostly AP exams (MAPSAS exhibits), a use he called *"valid and useful"*. Shipped in one PR: the drill-in hovers, the frozen header, Refresh everything and its splash, My College following the model, My CPL Funding beside the table on the public renderings, and Unit sources.

**What worked.**
- **Reproduce the screenshot through the model before judging a figure.** A minimal Scenario 2 config (the dials, not the whole row) reproduced every figure in Sam's screenshot, which is what made "the arithmetic is right" a finding rather than an opinion.
- **Measure the grain before adding a table's units.** `map_college_cr_unit` sums Chaffey's applied units to 19,405 against the measure's 19,020, so its rows carry each row's own units and add by exhibit and by recommendation. Student counts do not add (a student sits on several rows), so the panel shows units only.
- **Measure a proxy against the flag it stands in for.** The credit report has no military column. "ACE source or a military course type" agrees with MAP's own MilitaryCredits flag on 99.5% of applied units statewide (1,193 of 238,043 differ), so the split carries its rule in its label.

**What bit.**
- ⚠️ **Subscribers heard the model before its caches cleared.** `render()` called `notifyModel()` first and cleared the caches only past the mount guard; a subscriber reading `_alloc()` in its handler got the previous model. My College escaped only because `fundingFor()` calls `_model()` first.
- ⚠️ **My College kept its own copy of the config.** The box read the module on every paint, but its strategies came from the copy read at load and the scenario chosen then; after a publish it showed Scenario 2's funding and dropped every strategy. It now adopts the module's config on every model change, once the module has read the shared one.
- ⚠️ **A frozen header never froze.** The header was `sticky` since 2026-08-30, inside a wrap whose `overflow-x: auto` made it the scroll container, and a wrap with no height never scrolls up and down. A 75vh cap fixed it; print releases the cap.
- ⚠️ **A control in a figure cell broke the harness's reading of the figure.** `readCells()` takes the figure as the cell's text less its FTES line; the Unit sources word came after the line. The harness now drops `.cplfund-srclink` before reading.
- ⚠️ **`:scope > tbody > tr`, not `tbody tr`, inside a nested table.** The outer table's tbody is an ancestor of the inner header row too.

**Sheet 6, answered at 15:26Z (all seven).** Yearly reports, all eight categories, each college sees its own; Scenario 2 final; reword P1; the two My College figures renamed (built). Card 1: Sam rewrites the Scenario 2 script and voices it with ElevenLabs. ⚠️ **A parallel session read the same Chaffey figure from Sierra's side** (#1776): the credit report's applied column equals the articulated units on every row, whatever the plan status (74,697 units statewide at Needs Action), so Unit sources now splits by plan status. Read `main` before pushing: a sibling session can land beside yours on the same question.

**Moved from the funding lane at the S306 checkpoint (verbatim):**

✅ **COLLEGE DASHBOARD ROUNDS 8 AND 9 ARE LIVE** (S302–S303, Sam: *"mockup looks good!"*): gray Curr figures until an institution meets all its minimum conditions, showing what its measures compute to; the drill-in in the row's own columns; the coordinator, primary contact and landing page under the met first condition; the veteran count, JST count and percent beside the third. Guards: `tests/cpl_funding_round8.test.js`, `tests/cpl_funding_round9.test.js`; harness `prototype/mockup_harness/`. Detail moved verbatim to the [lessons archive](../../cpl_funding_lessons_archive.md) (S305). ⭐ **Sheet 4 rulings (Sam, 2026-09-29, all nine his own call):** the first condition's check reads **all three parts**, and the Reporting box starts with **spending** (a new write surface: Governance first). ⭐ **Card 2, S305: Governance done, mockup with Sam. NEEDS SAM (sheet 5, cards 2–4).** `cpl_funding_reports` folds into DR-09 beside `cpl_funding_notes` (`kb/governance_surface_map.json` and the register row, 2026-09-30); a report is an institution's dollars with no student record, so the student-detail disclosure boundary does not reach it, and it is reviewer-gated like the note. The mockup ([BV2Xqt49vCYicX5xdEKP5E](https://claude.ai/artifact/BV2Xqt49vCYicX5xdEKP5E), `prototype/cplfund_reporting_box_v1.html`) records a college's reported expenditures per quarter in NOVA's categories (object codes 1000 to 7000 and indirect costs), totals them to date beside the maximum award, keeps who reported and who recorded, and treats a correction as a new report. The build waits on three calls: quarterly or yearly, all eight categories, and whether a college sees its own figures on My College. ✅ **Card 1 built (S303):** `map_coordinator_summary()` answers `has_coordinator`, `has_primary_contact` and `has_landing_page` as booleans, never a name, so the public page and the tab run one check (live 2026-09-29: 49 coordinators, 43 all three); an unmet line names the missing part. Guard: `tests/cpl_funding_first_condition.test.js`.

**Moved from the funding lane at the S306 checkpoint (verbatim):** Moved verbatim to the [lessons](cpl_funding_lessons.md) (S302): the origination cutover's asymmetry and the explainer's title.

## S307 (2026-09-30, SkyGusset): the Reporting box's reviewer half

- **Built on Sam's sheet 6 calls:** `cpl_funding_reports`, INSERT-only, reviewer-gated on read and write, the recorder
  stamped by trigger from the session (the body's `recorded_by` is overwritten: a reviewer cannot record in another's
  name). Re-keyed from the mockup's quarters to fiscal years; the window's years plus the close-out year, since funds
  close out the year after the window.
- **Reversible without SQL.** INSERT-only rules out an edit, so a mistaken entry needed a way back that a reviewer can
  take from the tab: **Withdraw** is itself a newer row (`withdrawn`, no figures), after which the year counts as
  unreported. The table's CHECKs make a withdrawal empty and a report name its reporter.
- **The repo's Supabase guard blocks any statement containing INSERT,** even in a rolled-back transaction as a role
  test. The live gate was verified from the catalog instead (`pg_policy` expressions, `has_table_privilege`) and
  matches `cpl_funding_notes`; the first reviewer save is the live proof, and the tab's re-read confirms it (#598).
- ⚠️ **Two mutation runs against one file, sharing one backup path, raced.** A foreground run copied the file while a
  background run held its mutation, and both restored from that copy: the print-clone line vanished from the source
  and every test still passed. Found by re-grepping the mutated lines after both finished. Give each run its own
  backup, and never run two against the same file at once.
- **Open (sheet 7 card 1):** how a college's staff sign in to see their own. MAP lists a CPL coordinator or primary
  contact address for 105 of 123 colleges (49 and 99); three district staff are listed for three or four colleges.
- **Sam's Public view asks (same day):** the published scenario opens every visit; *As colleges see it* flips the
  curator choices off in the Public view; My CPL Funding at the top of both public renderings, by college or district,
  with Save as PDF through one printer (`printPanel`). The margin audit measured edges in Chromium: the a11y sweep
  passed every page while the explainer's header ran flush to a phone's edge, because a `padding` shorthand's 0 sides
  erased the `.wrap` gutter. **A sweep that measures contrast and targets does not measure alignment; probe the edges.**
- ⚠️ **A district's blocks never named their institution:** `fundingPanel` omits the name because the chooser carries it
  in the one-college view. Only the screenshot showed it; each member now sits under its name.
- **The dashed frame around the tab is COBI's placeholder on 18 tab roots:** measure a pattern's reach before calling it
  one tab's defect.

### Moved from the funding lane at S307 (verbatim)

✅ **S306 (Sam, 2026-09-30):** the drill-in hovers say how each figure is reached (label: goal, measure, share, price; Max: funding × share, target = proportional funding ÷ price; Curr: units ÷ units per FTES, fraction × Max); the college table scrolls inside a 75vh wrap under a frozen header; **Refresh everything** (Internal view) re-reads the saved model here and in every other window of the browser (BroadcastChannel `cpl-funding-model`; a save posts it too) and lists what it reached, what is built when opened, and what is not live; My College adopts the module's config on every model change; **My CPL Funding** sits beside the table on the public renderings (`fundingPanel`, one renderer); **Unit sources** (reviewer, Internal only) reads `map_college_cr_unit`: military (ACE or a military course type, 99.5% agreement with MAP's flag) vs non-military, the exhibits and the recommendations. Guards: `cpl_funding_refresh_sources.test.js`, `college_briefing_funding_sync.test.js`.

⭐ **SCENARIO 2 IS FINAL AND PUBLISHED (Sam, 2026-09-30, sheet 6 card 6; chosen 2026-09-29 after the CO demo):** *"We're going with Scenario 2."* College funding follows P1 and P2 (Year 1: 50% each); *"I will be reporting on P3 Career Attainment together with P4 projects using more qualitative data rather than tying it to FTES."* **Ruled on sheet 4 (cards 5–8):** Year 2 follows P1 and P2 at 50% each (already true: `mirrorYears` gives Year 2 Year 1's priorities, so no write; the stored Year-2 block is inert); both of Scenario 1's phrases carry to Scenario 2 (✅ written 2026-09-29 by `funding-config-edit-apply.yml`; receipt in `kb/funding_config_edits_out/2026-09-29/`); P3 and P4 get a mockup before any port (✅ **approved 2026-09-30**, *"go ahead with the card 7 mockup"*, artifact `RRTSSiTW1k6jk6gvxUAQ1D`: in Scenario 2 the measured 0%-share Career Attainment card leaves, and Career Attainment (C) and Innovation Projects (D) are reported cards that say what is reported, when (TBA) and where, with no target, FTES or funding line; `reportedAsReports` turns the shape on per scenario, so Scenario 1 keeps its card; ✅ written 2026-09-30, receipt in `kb/funding_config_edits_out/2026-09-30/`, the first plan to declare a new key, `"create": true`, and read back live in S305: `prioRemoved` [1,3], `reportedCards` [C,D], the two titles, `reportedAsReports` true); ✅ the Scenario 2 narrated draft is built (card 8, below). Card 1 (Sam, sheet 6): *"I want to rewrite it and then use the ElevenLabs connector to add a natural narration voiceover."* Unlinked until his rewrite is voiced.

## S308 (2026-09-30, SkyBracket, joined with S309 SkyCensus): the Public view reads as text, and the Reporting box's college half

**Sam's four asks, verbatim:** *"1. For all text views possible on this tab eliminate the gray background box to simplify visually 2. Eliminate any unnecessary line breaks or font size changes with text to enhance readability 3. Delete the 2 marked chips 4. Fix the dates so they are appropriately spaced."* Shipped as #1788.

- **The dates were a DOM bug, not a spacing choice.** In public mode `edText()` returns the bare value, and two bare text nodes inside a flex row join into ONE anonymous flex item, so the label and date printed as "Funding Model FinalizedSep 2026" with the row's `justify-content` doing nothing. The curator view never showed it (its inputs are elements). Any public-mode emitter that returns text into a flex row needs its own element.
- **Box removal went to both views;** the chips left the Public view only (the memo and brief are curator tools). The priority cards kept their boxes (a grid needs edges); sheet 10 card 3 asks.
- **The size change met a July ruling.** C9e in `cpl_funding_rollup.test.js` pinned the Timeline to the cards' .8rem (Sam, 2026-07-23, when it sat under the cards). CI's shard 4 caught it; the newer ruling governs, the assertion now pins .92rem and says why, and sheet 10 card 2 lets Sam reverse it. ⚠️ A local run of 69 funding suites takes ~50 minutes serially; `xargs -P 4` with a 1-hour background limit finished them.
- **The Minimum Conditions status runs into its requirement** in the Public view (`reqItem()`), with the deadline read into the text through `partReqText()` ("Local confirmation on file by 2026-11-01.").

**The college half (#1790, Sam's sheet 7 card 1: MAP's two contacts).**
- **Names meet through `map_colleges`, never through each other.** Reports carry the roster's short name, contacts carry MAP's; both resolve to a `college_id` (canonical first, then a variant, trimmed). 112 of 115 roster names resolve; *LA Swest*, *Mt San Antonio* and *MiraCosta* fail closed until the identity crosswalk carries them.
- **A contact field is a list.** 26 of 148 filled fields held two or more addresses (comma and newline); each is split before matching. Measured as a caller through `request.jwt.claims`, printing counts only: a four-college address reached 4, an unlisted one 0.
- **Return one row per listed college even with no report,** or the page cannot tell "none yet" from "not listed".
- ⚠️ **`revoke ... from public` left `anon=X`.** This project's default privileges grant anon and authenticated by name on every new function; the function stayed callable until the revoke named anon. Rule 10 b2 now says so, and the grants lint's docstring. Exposure check: no rebuild, replace or clear function is anon-callable.
- **The page never decides who sees what.** My College only asks `cpl_funding_my_reports()` with the person's own token; the team phrase is not a person and gets the sign-in. `markReports()` is the one "newest counts" rule for both views.
- **The seeded a11y sweep found the Resources links at 15px** (SC 2.5.8); they are 24px now. A section behind the scope question needs its own seeded target, one per state, because the sweep seeds once per width.

## S310 (2026-10-01, SkyTandem): My CPL Funding in Sam's words

**Sam's ask, verbatim:** *"See screenshot for My CPL Funding view and make a mockup with revised language that follows the norms and examples in our rules and memory. Show me in the mockup your revisions before we make any changes to prod."* Round 1 #1797 (artifact C5crxcr1KY7t1JgX3HTXMx, 16 cards); the port #1798.

- **The Today half came from the product.** `prototype/mockup_harness/capture_mycpl.mjs` renders the Public view with the tab's own scripts and answers Supabase from a fixture whose config is md5-checked against Postgres; the same harness verified the port (Coastline read as approved).
- **His replies were the spec.** A note-only reply stores `v: ""` and the note is the verdict; his Follow up flags (cards 1, 2, 4, 7, 8, 12, 14) meant "use my wording". He wrote eight of the sixteen sentences himself.
- **The mockup found a dead line.** Do this next never showed the implementation step: `topStrategy()` read `pr.strategies`, `buildBriefing()` carries `pr.items`, and the test fed it the config's field name ([note](kb-notes/methodology-a-guard-that-supplies-its-own-input-tests-only-half.md)).
- **The conditions list reads the module's own list.** `_conditions()` builds on `eligReqList`, so the block, the pie and the drill-in agree.
- ⚠️ **Six tests pinned the retired sentences, and the local run missed one.** CI's shard 2 caught `cpl_funding_refresh_sources`. Before pushing a wording change, grep `tests/` for a fragment of every sentence it retires.
- **Rulings (verbatim in `cpl_memory`):** no "funding model" in college-facing text (*"as it's finalized, it's no longer a model but now a procedure"*), extended the same day to the explainer and the tab's public text (*"Yes replace model on other surfaces as well"*); "through apportionment" for the seed grant only; the 84 are CER credentials, and MAP's statewide set is 134 exhibits with 354 recommendations; the seed grant's expend-by date stays off (*"Leave this off"*).

## 2026-10-01 — S312 (SkyLantern): the explainer takes the Fact Sheet's layout, and the average replaces the typical

**What Sam asked.** The explainer, "likely the main view for the colleges," in the Fact Sheet's layout (a link per section that opens it), Ask Sierra, projects and staff in one box, and "the average funding rather than typical" in the explainer and the video. Shipped as #1806; the sheet 14 rulings followed the same evening (#1807 ports the "model" sweep).

**What we learned.**
- **A token the page adds can switch on a rule the embedded tab wrote.** Defining `--seal-blue` on the explainer's `:root` painted the institution table's header navy behind body text (1.13:1); `cpl_funding.js` reads it with a fallback the page relied on. Scope page tokens to the page's chrome (`.actionbar, .masthead, .fs-sra-drawer`). The mirror of the 2026-09-29 lesson (a token the page lacks paints nothing).
- **The average splits by averaging each institution's own shares** (`avgCr = avg − avgNc`, so the pair sums to the printed average): $213,901 = $198,542 + $15,359 under config md5 `e21658f9`. The median stays in one sentence, because most institutions sit below the average.
- **The video's preview font is narrower than the render's.** "The average allocation splits in two" fit the Playwright preview and wrapped into the figures in the MP4 (fontsource Playfair 900). Check a heading change on `build.py <v> --render` before a five-minute render.
- **Keep a voiced draft frame-identical by config, not by leaving it alone.** `SAMPLE` / `SPLIT_THREE` keep the narrated drafts on Sample College while the introductions show the average; a rebuild proves it (same frames at every sampled time, seek order held constant).
- **A sheet's "port" answer can be a page change, not a link.** Card 6 ("bring the progress over") replaced giving colleges a second page; the FAQ already came over in #1806 through `T.publicFaqHtml()`.
- **`pkill -f` on a pattern your own command line contains kills your shell** (exit 144, twice). Match with a bracketed first character.

**Open.** Card 6's port (statewide progress per priority and the condition counts on the explainer); the video round (Sam's four asks of 2026-10-01 evening, in the S313 handoff); the confirmation deadline (Timeline Dec 30, 2026 against `participationDeadline` 2026-11-01).

## 2026-10-01 — S313 (SkyReel): the video round, and the explainer carries the Public view's progress

**Sam's asks** (the S312 evening round, sheet 14 card 6 "port", sweep card 25), shipped in #1809.

**What we learned.**
- **A film's figures come from the engine over a hashed config, and the hash is the proof of the copy.** The sandbox cannot reach Supabase's REST endpoint, so the stored config came through the MCP and was transcribed to a file; a jsonb-order encoder reproduced Postgres's `md5(config::text)` exactly (`e21658f9`, 23,594 characters), which proves every character. The copy is committed as `tests/fixtures/cpl_funding_config_e21658f9.json`; booting the tab over it with `T._setConfig()` and reading the Public view's own cards gave every figure the slide prints.
- **The statewide division is exact; the per-institution one is not.** $12,620,154 ÷ $2,824.82 = 4,467.6 FTES statewide. An institution's target rides its size while its award is clamped between base and cap, so the average target (34.49) is not the average funding over the price (35.14), and the 118 targets sum to 4,366.66. The slide and the explainer state only the statewide division (`cpl_memory` `statewide-target-exceeds-institution-sum-2026-10-01`).
- **A new scene shifts the clock, and a shift function named `L` was shadowed.** `buildK` declares its own `var L`; inside it, `L(48.2)` threw in Chromium (a blank film), and a missed `.map(L)` silenced the score. jsdom never runs `buildK`'s measured path (zero-width stage) or the offline score, so test `m0` reads the source; `render.mjs` now stops on a score with no length rather than capture five minutes of frames over an empty WAV.
- **Prove "frame-identical" with the DOM, not screenshots.** `main`'s build against itself differed at 11 of 41 JPEG frames; the stage's `outerHTML` after each seek matched 82 of 82, and the one real difference it found (a `white-space:nowrap` the narrated kick did not need) was made conditional.
- **Check a layout change on the render page with the render fonts**, every scenario: Scenario 1's third box and its slide's two-line closing sentence overflowed where Scenario 2's fit.
- **`earnAgg()` caches per render.** An API read between a config change and the render that clears the cache returns the old model; `_publicProgress()` clears all three caches first.
- **Student headcount is never a metric** (Sam, 2026-09-15): the baked defaults still carry legacy headcount priorities, so the explainer prints a target only for an FTES priority with a target above zero.

**Rulings (Sam).** The video round's asks are verbatim in the S312 chat and the S313 handoff; card 6's "port"; card 25's wording, adapted to the film's true length (100 seconds, since the slide took it past 90).

**Open.** The confirmation deadline (sheet 15) re-renders the Timing and conditions scenes; Sam's Scenario 2 script for the ElevenLabs voice; the 2.3% gap between the statewide target and the institutions' sum.

---
title: "SkyView / CCR Atlas lessons — archive 2"
created: 2026-10-24
updated: 2026-10-25
tags: [lessons, archive, ccr, skyview]
kb-status: internal
obsidian-folder: cpl-project-tracker/lessons
related:
  - "[[CLAUDE]]"
  - docs/ccr_atlas_lessons.md
  - docs/ccr_atlas_lessons_archive.md
---

# SkyView / CCR Atlas lessons — archive 2

> Sections moved verbatim out of [`docs/ccr_atlas_lessons.md`](ccr_atlas_lessons.md) when it passed its
> 120 KB budget again (S467, 2026-10-24). The first archive,
> [`docs/ccr_atlas_lessons_archive.md`](ccr_atlas_lessons_archive.md), is past its own budget, so this file
> takes the next sections. Nothing here was edited on the way across.
>
> The first archive's last five sections, S233's later rulings through S234's measured recording,
> moved here verbatim (S470, 2026-10-25) so the first archive fits its 150 KB budget; they come first
> because they come first in time.

## 2026-09-06 (later) — SkyBuild S233: Sam drove it, and five reports became five fixes

Sam used SkyView while the audit fixes were landing and reported as he went.
Every one was real, and two of them were **not** what the report said they were —
which is why each was measured before it was touched.

⭐ **"THE HOVER SHOWED THE SAME DESCRIPTOR FOR THE WELDING DISCIPLINE INSTEAD OF
COURSE DETAILS."** Not the discipline card — the **identity** card, repeated. An
opened identity's ring SPREADS (`drawMembers`, `spread` up to 70px), so its own
college-course stars sit over its neighbors, and `pick()`'s rule that "a
pointer inside the nearest identity's circle means that identity" took them.
Measured with the pointer exactly on each drawn star: **16 of 30 gave the course
card, 14 gave an identity's**. Reading those courses is the entire purpose of
the ring, so a focused identity's own members now outrank the circle they happen
to overlap — `lastFocus` is the set `draw()` just used, so hit-testing and
painting cannot disagree about what is open. ⚠️ `pickMember` also returned the
FIRST star scanned rather than the NEAREST, so an unrelated neighbor's course
could shadow the one under the pointer; it takes the nearest now and accepts a
filter. 30 of 30 after.

⭐ **"THE BACKGROUND CHANGES TO PURPLE… CHANGES WHEN A SEARCH ITEM IS
SELECTED."** Two mechanisms, and the first one found was the smaller. The focus
disc is tinted with the identity's system color and grows with the member count;
capping it was right but did not explain the report, because at the zoom a
search pick flies to, the disc is not even drawn. **It is the membership glow.**
`haloAround()` paints a radial gradient out to `r*2.6` where `r` is the DRAWN
radius, so opening a well-adopted identity threw its system color across the
whole viewport at 30% alpha — measured at **983px on a 960×600 canvas**. The
glow is Sam's own signal (*"haven't earned their wings yet"*) and reads fine at
a fraction of that, so its reach is bounded. ⚠️ **Neither cap was testable on
the existing fixture** — 6 identities and 11 members never make a ring that
overlaps or a disc that clamps — and both perturbations passed until a fixture
built for the purpose replaced them (`tests/ccr_skyview_hover_disc.test.js`,
120 identities packed two units apart, one carrying 30 college courses). A test
that survives deleting the code it covers is a decoration.

⭐ **"TRY 'weldi' AFTER YOU INITIALLY TRY 'weld' AND THERE IS NO INTRO COURSE IN
THE LIST."** Reproduced on the real payload: `weld` returns *Introduction to
Welding* **first**, `weldi` returns it **nowhere**. The tiers were tested
against the STRING start only, and `weld` prefix-matches every Welding
identity's **id** (`weld m1109`) — so all 549 sit in tier 1 and sort by
adoption, and the 24-college intro course wins. One more character and the id
stops matching: only the **109** titles beginning "Weldi…" are tier 1, they fill
all 60 slots, and the **299** titles where the word appears later never reach
the list. ⭐ **The invariant is that typing more of a word must not delete a
match the shorter term found**, so a term beginning a WORD now ranks with one
beginning the string; which word of the title it is was never a relevance
signal. `weld`, `weldi`, `weldin` and `welding` return the same first course
now. A match *inside* a word stays tier 2, which is the distinction that was
actually wanted. ⚠️ Sam withdrew this report mid-session (*"seems to be working
now, maybe transient"*) and then reproduced it precisely; the first measurement
had already shown the ranking was sound, which is exactly why the second one was
worth taking at face value.

⭐ **"THE SIDE BAR UNHID, AND DOES SO EVERY TIME I ADD A COURSE."**
`openInspector()` fires on every selection, so Hide survived exactly until the
next pick. Hide is an instruction about the workspace, not about one course. The
content still follows the selection underneath, so reopening shows the right
card. ⚠️ A test asserted the OLD behavior (*"selecting something opens it
again"*) — it now asserts the new contract, because the reader's instruction
outranks the convenience.

⭐ **"CAN WE MAKE THE LIST LONGER THAN 60? MAYBE WITH LAZY LOAD?"** 60 is the
PAGE now, not the list: the ranking is computed once to `SUG_MAX` (300) and
revealed a page at a time as the reader reaches the bottom. ⚠️ **It has to be
ranked once, not re-ranked per page.** `suggest()` gives each kind a share of
the LIMIT (30/45/25), so asking for 120 instead of 60 does not append — it
re-cuts, and row 19 changes from a course to a discipline under the reader's
eyes. The footer says "Showing 60 of 408 — scroll for more", and the scroll
position and the highlighted row both survive a reveal.

⭐ **"SHOW COURSES SIMILAR TO THE SELECTED COURSE IN ORDER — ALL THE BEG INTROS
FOLLOWED BY INT INTROS."** The identity panel gains a **Similar courses**
section: same discipline, Dice over the same lightly stemmed title tokens the
builder scores orbits with, grouped into Beginning → Intermediate → Advanced
with the unmarked last, adoption ordering within a rung. ⚠️ **The level word
must not drive the similarity** — with "Beginning" and "Advanced" counted as
title words, the two rungs of one course score as LESS alike than two unrelated
beginning courses, and the ladder is the whole point; they are stripped before
scoring and read back after. ⚠️ **And every rung needs a share of the cap.** The
first cut filled 24 slots in order, the fixture's 24 beginning courses took all
of them, and the reader never learned an advanced version existed — the same
"a budget written for eight starves the tail at sixty" failure as the suggestion
list, three weeks later in a different function. A floor each, then the slack
flows. Levels are read from the title because that is the only place we hold
them (44% of Welding's 512 titles carry one), and a course whose title does not
say is listed last rather than guessed at — course level and skill level are
different axes and neither is derived from the other.


## 2026-09-06 (morning after) — SkyBuild S233: seven rulings, and three numbers of mine that were wrong

Sam asked for a decision sheet covering the payload-rebuild question and the five
SkyView calls left with him, answered all seven `yes` in one sitting with no edits
and no follow-ups, and they shipped as PR #1494. The engineering is in the commit;
what belongs here is what **measuring for the sheet** turned up.

⭐ **THREE CLAIMS DID NOT SURVIVE BEING MEASURED, AND TWO OF THEM I HAD ALREADY TOLD
SAM.** The sheet's rule is that every item carries measured context rather than a
guess, and applying that rule to my own carryover is what caught them:

- **"The map and the discipline tables can differ by 43 on one screen."** They
  cannot. `disciplineRows()` takes its identity and stand-alone counts from the
  **universe** payload; the stale atlas file supplies only the Decisions column, the
  work-surface offer and a provenance tooltip. The claim had been written into the
  lane, the handoff, `CLAUDE.md`, the To-Do feed and the brief before anyone read
  the function. ⚠️ **The staleness was still real and still worth the ruling** — it
  just cost something else: of the 593 identity ids in the five embedded decision
  packs, **89 (15%) resolve to nothing** through the alias chain, worst in Fire
  Technology at 32 of 136. A curator could be offered a decision about a course that
  no longer exists under that id. The right finding was one function away from the
  wrong one, and the wrong one was more alarming, which is presumably why it stuck.
- **"The canvas sits behind 217 tab stops."** 39, and it already carried
  `tabindex="0"`. Inherited from the observation log and repeated without counting.
- **"Dropping `fetch-depth: 0` saves ~650 min/month."** Mine, from first principles,
  and the job log disproved it in one read: TruffleHog was already scanning
  `base → head`, 45 chunks, 66 KB. The 3 minutes are 75s of `git fetch`, 8s of
  `docker pull` and 88s of detector startup — none of it scan depth. Narrowing the
  fetch would have saved ~60s and risked leaving `BASE` unreachable, at which point
  the scanner covers nothing and still reports green.

⚠️ **`ALIAS_MAPS` IS A LIST OF PATHS, AND PASSING IT UNLOADED FAILS SILENTLY.**
`resolve_id(id, ALIAS_MAPS)` does not error; it resolves nothing. The tell was in the
output and nearly went past me: direct and chained liveness agreed **EXACTLY** at 440.
Two numbers produced by two different code paths do not land on the same integer.
`load_maps()` first gives 504 live / 89 dead. Rule 7 already says resolve through the
chain before comparing to the live set; it now also matters *how*.

⭐ **A FILTER MUST BE TESTED IN BOTH DIRECTIONS, AGAINST REAL COMMITS.** The
`paths-ignore` draft for CodeQL looked obviously right and was wrong twice: it missed
`reports/**` and `veteran_jst.json`, so it would never have fired on an actual cron
push and would have saved nothing; and a bare `kb/**` skipped
`kb/_build_ccr_universe.py` and `kb/alias_chain.py` — real Python source, and a
genuine coverage regression. Both were found by replaying the globs over the last
cron pushes AND over a list of files that must still be analyzed. Asserting the
globs would have caught neither. The same shape as the fixture lesson from the night
before: a check that only ever runs the case you expect confirms your expectation.

⚠️ **AND THE FAILURE MODE UNDERNEATH ALL OF IT.** Three times in one run I read one
thing carefully and missed the adjacent field that falsified it — the payload figure
(right for the file it named), `mergeable_state` (sitting in a PR payload I had
already fetched twice while diagnosing missing CI as a dropped webhook, when Sam's
screenshot showed a merge conflict), and the `fetch-depth` theory. The reading was
careful each time. What was missing was the second look at what sat beside it.

⚠️ **AND ONE PROCEDURAL GAP, FOUND BY CHECKING RATHER THAN BY FAILING.** The
previous night's checkpoint wrote 8 `cpl_memory` rows, said so in its commit body,
and logged **none** of them to `cpl_memory_log`. The log is a separate
`insert ... select`, so skipping it is invisible from the `cpl_memory` side, and no
test can see it — the sandbox cannot reach `*.supabase.co`, so the suite has no
view of that table at all. It was found only because this run happened to group the
log by slug. Backfilled with late-entry notes, and the playbook now carries a
one-query verification as part of step 6. **A step whose omission produces no error
and no failing test is not a step; it is a hope.**

⭐ **AND THE ONE THAT CAME BACK TO BITE THE SAME DAY: `test` went red on a file
this run had not touched, and it was ours.** `ccr_skyview_search_show.test.js`
exited 1 on CI while passing 116/116 here — standalone, in a full 303-file
concurrent suite, and on CI forty minutes earlier on byte-identical content.
Every cheap hypothesis was wrong: not the check-floor raise in the same push
(`tests/run.js:231` consults the ledger only when the child exited 0, and a floor
violation prints *"check count fell"*, not `exit 1`), not memory (`exit 134` /
`SIGABRT`), not dependency drift (jsdom pinned exactly), and **not the Node 20 vs
22 gap I flagged — I installed Node 20 and it passed 116/116 there too.**

⚠️ **The CI log was unreadable, and the fix for that was not to try harder to read
it.** `get_job_logs` caps its window at roughly the last minute of a nine-minute
run, and the full-log blob on `results-receiver.actions.githubusercontent.com` is
refused by this environment's egress policy. So the failing assertion was never
visible. **Running the file 24 times CONCURRENTLY reproduced it in one command** —
7 failures, and `grep ^FAIL | sort | uniq -c` named all three failing checks. The
missing variable was contention, and a re-run does not vary it.

⭐ **The product was right; the test was racing a deadline the product owns.**
`gqEl.addEventListener("blur", function(){ setTimeout(closeSug, 120); })` closes
the suggestion list 120ms after the search box blurs — deliberate, so a click
elsewhere dismisses it. The test focuses that box at §11; §15 then clicks a row,
a move control and a destination, each scheduling that close. `tick()` is ONE
macrotask, so an idle machine finishes inside 120ms and a loaded runner does not.
All three failures were in §15's Enter block — **ruling 6, shipped that morning.**
Before: 7 of 24. After: 24 of 24 at 116/116. New KB note:
[`methodology-a-test-that-only-fails-under-load-is-racing-a-timer`](kb-notes/methodology-a-test-that-only-fails-under-load-is-racing-a-timer.md).


---

## 2026-09-06 — S234: a screen recording, measured in a browser

Sam recorded 6m50s of driving the deployed SkyView and narrating. The recording
was processed entirely on his machine by the new `video-context` skill
(`kb/_video_context.py`): 23 scene-aware frames and a 138-segment faster-whisper
transcript, no audio or frames leaving the laptop. Triage:
[`skyview_video2_findings`](skyview_video2_findings.md).

### The two defects, and why one of them survived its own fix

⭐ **A FIX CAN BE RIGHT ABOUT THE COMPLAINT AND WRONG ABOUT THE AXIS.** Ruling 3
(2026-09-05) fixed "the list jumps when I pick" by preserving `sugEl.scrollTop`
across a pick, with a careful comment explaining why `scrollIntoView` does not
undo it. That fix works — measured, `scrollTop` holds at 300 through three
picks. Sam still said *"jumping again, driving me nuts."*

Measured in Chromium at 1440px: on the **fourth** pick the toolbar wraps to a
second line, `#u-bar` grows 30 → 76px, `#sug`'s top goes 40 → 76, and every row
moves down **36px — almost exactly one row height**. The scroll offset is
preserved; the list's position on screen is not. `.u-tokens{display:contents}`
makes each chip a flex child of `#u-bar`, so the Nth chip reflows the bar and
everything below it.

Two lessons. **A complaint can have more than one mechanism**, and fixing the
one you found does not retire the complaint. And **a guard must assert the thing
the user experiences** — a test that pins `scrollTop` passes while the reader's
row walks out from under the pointer.

⭐ **A VIEW SWAP THAT DOES NOT MOVE THE HASH STRANDS THE USER.** `discipline()`
paints over SkyView, sets `state.v` and the crumbs, and never calls
`syncHash()`. Measured: after `__ccrDiscipline('Welding')` the canvas is gone
and `h1` reads "Welding" while `location.hash` still reads `#skyview`. Four
consequences, all of which Sam hit in sequence: Back creates no history entry;
`hashchange` cannot fire, so the router never learns; the Views menu disagrees
with the screen (*"now I'm over here in no man's land"*); and a refresh silently
returns to SkyView. Returning rebuilds the canvas, losing every pick — *"it's
going to reset sky view… I have to start all over"*, said before he tested it.

⚠️ **The masthead reads "SkyView — prototype v1" (`skyview.html:714`), and that
label did real damage** — it made a view swap inside one page read as landing in
an old prototype. Both Sam and this session believed a navigation had occurred.
I told him it had left for `ccr_atlas_v1.html`; measuring corrected me.

### The retraction is a finding

Between 05:24 and 05:55 Sam reported at length that hovering a college course
returned the identity card rather than the course, with a specific expectation
(*"it should say weld 100 Fullerton, two, three units"*). At 06:08:

> *"You know what? My bad. Forget everything I said there. It's not a problem.
> There it is."*

That passage is **S233's hover fix working** — he found it a moment later. A
session reading the transcript for defects and stopping at the complaint would
have undone a shipped fix. ⭐ **When a recording is the input, the retraction
travels with the complaint and must be read to the end.** It is recorded in the
findings doc as loudly as the defects, under a "Do not act on this" heading.

### What the tooling taught

The cloud cannot do this and the reason is worth keeping: the file is on a local
machine, the egress proxy denies OneDrive, SharePoint and Drive, **and it denies
`huggingface.co` and `openaipublic.azureedge.net`, so Whisper's weights are
unreachable in principle**. ffmpeg itself works fine in a container from the
`imageio-ffmpeg` wheel — so "the cloud cannot do video" is too strong, and the
distinction matters the next time someone reaches for a cloud session.

⚠️ Two defaults shipped wrong and were caught by Sam running it, not by tests:
`python3` inside a PowerShell block (Windows has `python`; `python3` hits the
Microsoft Store alias), and `device="auto"` for faster-whisper, which selects
CUDA whenever a GPU is visible and then dies on `cublas64_12.dll` — the normal
state of a work laptop. **A Windows-facing example authored on Linux gets no
check at all**; the helper was mutation-tested, smoke-tested and CI-guarded, and
none of that touches the copy-pasteable line a human starts from.

---

## S234's triage of the 2026-09-06 recording, as written (moved from the lane, S235)

Kept verbatim because two of its readings were corrected by driving the page:
the element that wraps is `.sugwrap`, not `#u-bar`, and the picks were destroyed
leaving the map rather than returning to it.

## Measured 2026-09-06 (S234) — from Sam's screen recording

Two defects found by driving the deployed map and measured in Chromium.
Full triage: [`skyview_video2_findings`](../../skyview_video2_findings.md).

⭐ **THE DROPDOWN DROPPED A FULL ROW WHEN THE CHIP ROW WRAPPED — FIXED S235.**
⚠️ **It is `.sugwrap` that grows, NOT `#u-bar`.** S234's triage named `#u-bar`
30 → 76; walking the real ancestor chain in Chromium on the fourth pick shows
`#u-bar` **unchanged** and `.u-search-slot .sugwrap` going 30 → 66, which pushes
`#sug` 40 → 76. A `min-height` on `#u-bar` would have read as a fix and changed
nothing. Ruling 3 shipped as a two-row reserve on `.sugwrap`
(`calc(var(--u-chip-h) * 2 + 5px)` = 65px, exactly the wrapped height) plus
tighter chip padding/gap/max-width. Measured after: `#sug` top holds at 75
across five picks. ⚠️ Target size, not contrast, is the tightening constraint —
`.u-tok-x` 24×24 and `.u-tok-go` min-height 24px are on the WCAG 2.2 SC 2.5.8 AA
floor and were verified still 24 after the change.

⭐ **DOUBLE-CLICK STRANDED THE USER BECAUSE THE HASH NEVER MOVED — FIXED S235.**
`discipline()` painted over SkyView without calling `syncHash()`. ⚠️ **Measured
WORSE than triaged:** `homeSearch()` called `clearTokens()` on every view entry,
so the picks were destroyed **on the way OUT** (`__ccrTokenKeys()` reads `[]` on
the Welding surface, not on the way back), and Back left the document entirely.
Now `#work/<discipline>`, a named crumb back to SkyView, and the selection
**parked** and re-rung by `restoreTokens()` on return. History: `pushState`
stand-alone, `replaceState` framed — an entry in COBI's frame is an entry on
COBI's own back button, and that hazard still holds.

⚠️ **Sam RETRACTED a finding on camera.** He reported at length that hover
returns the identity card rather than the course, then found it working:
*"My bad. Forget everything I said there. It's not a problem."* That passage is
S233's hover fix working. **Do not act on the first half of it.**

**Praised, do not break:** Fit all; the panel moving to the selection.

---

## 2026-09-06 — S235 (SkyOutline II): the outline built, three rulings shipped

**What shipped.** The course outline of record (`#outline/<id>`), Sam's three
rulings of the morning, and the fix for the double-click stranding. PR #1502.

**The design decision worth re-reading.** The outline's description is **chosen,
never written**. It quotes the *medoid* of the member catalog descriptions — the
one with the highest mean similarity to the others, i.e. the description that
says what the rest say — and attributes it to the college that wrote it.
Composing new prose out of several catalogs would read as authoritative while
belonging to nobody, which is a worse answer than quoting the college that
already said it. Sam authorized a synthetic description "as long as it is
clearly labeled MAP-Generated for faculty consideration and revision before
use"; the label covers the ASSEMBLY (the choosing, and the shared-topic list),
not invented sentences.

**Two extraction defects, both invisible without a browser.** A Python
prototype on the same data showed the first and it was read past; Chromium made
both obvious:

1. *Fragments outscoring their parents.* Counting every n-gram length at each
   position means a fragment is credited at least as often as the name
   containing it, so a count-ordered list puts the fragment FIRST. WELD M1109
   listed "shielded metal arc", "arc welding" and "shielded metal arc welding"
   as three separate skills.
2. *N-grams crossing commas.* Catalog prose is full of enumerations, and a
   word-only tokenizer walks straight across them: "infection, thermoregulation,
   pain, tissue integrity, gas exchange" produced the skill "pain tissue
   integrity gas".

Fixed by taking the longest valid n-gram per position, segmenting on punctuation
BEFORE any n-gram is formed, and a containment guard with a ratio exception
(1.6) so a genuinely more-widespread short skill inside a longer name survives.
A function-word gate rejects grammatical fragments — without it Blueprint
Reading returned "applied to the welding" and "is placed on reading", which is
the kind of output that costs a faculty reader their trust on the first screen.
Verified clean across Welding, Nursing, Art and Accounting.

**Corpus shape for the skills layer.** 94.6% of member courses carry a catalog
description (127,274 of 134,483), but only **30.0%** of identities have two or
more (14,902 of 49,650) — the stand-alones carry exactly one each. So the
two-college corroboration tier is unreachable for most of the corpus, and each
outline has to state its own evidence rather than imply a uniform standard.
⚠️ This does not contradict the earlier 90.4% figure, which named CLUSTERED
identities only; a figure is only wrong relative to the payload it names.

**Two inherited diagnoses were wrong about WHERE.** Both are in the KB note
`methodology-a-correct-measurement-can-name-the-wrong-place`: the 36px dropdown
drop is `.sugwrap`, not `#u-bar` (which never moves), and the picks were
destroyed leaving the map rather than returning to it. In both cases the
measured number was right and the element or moment named beside it was
inference, unlabeled as such.

**Five existing assertions asserted the reversed behavior** and were rewritten
to the new rulings with the reason, rather than deleted — including the one that
asserted leaving the map *clears* the selection, which is exactly what made
double-click destructive.

### The three rulings of 2026-09-06, as shipped (moved from the lane, S235)

1. **Enter closes the search panel** — ⚠️ REVERSES ruling 6 of the same morning,
   a reversal he flagged himself. The sort control moved to the list's **top
   right** (a sticky `.sug-head`); an **Enter** button took its place in the
   bottom row; key and button are one call (`runSearch`). ⚠️ The header is a
   child of the listbox, so `markSug` addresses rows by `id`, never by child
   position. ⚠️ It did **not** touch `takeHighlighted()` — Enter on a
   highlighted row is the multi-select pick, and ruling 3 of 09-05 keeps the
   list up through it.
2. **Double-click opens the course outline** — split by what is under the
   pointer: a course opens `#outline/<id>`, empty island ground keeps the
   discipline accelerator. A panel button carries the same route, because a
   double-click is undiscoverable and unreachable from a keyboard.
3. **Reserve the chip row's space** — see the warnings above.

### The outline as built, in full (moved from the lane, S235)

`#outline/<id>`, six layers, `tests/ccr_skyview_outline.test.js` (23 checks,
both key guards mutation-tested). **The description is CHOSEN, never written:**
the medoid of the member catalog descriptions, quoted and attributed — composing
prose out of several catalogs would read as authoritative while belonging to
nobody. Sam's MAP-Generated sentence prints verbatim. **Skills are imputed** from
the colleges' own words (we hold **zero** agency skill statements); confidence is
agreement BETWEEN colleges; thin skills stay, chipped. **Two level axes, neither
derived** — the course's off its title, a skill's off its own words.

⚠️ **Two extraction defects were invisible until driven in Chromium**: every
n-gram length counted per position, so fragments outscored the names containing
them; and n-grams crossed commas in enumerations ("pain tissue integrity gas").
Fixed by longest-n-gram-per-position, a containment guard with a ratio
exception, and segmenting on punctuation first. **94.6% of member courses carry
a description, but only 30.0% of identities have 2+** — stand-alones carry
exactly one, so each outline states its own evidence.

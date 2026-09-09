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

> ⚠️ **Older sections move to
> [`docs/ccr_atlas_lessons_archive.md`](ccr_atlas_lessons_archive.md)
> whenever this doc passes its 120 KB budget** — Sessions 187–193 on
> 2026-09-05, Sessions 224–225 on 2026-09-07 (S237), Sessions 226–227 on
> 2026-09-07 (S239). Nothing is edited in the move.

## 2026-09-06 — SkyBuild S233: an observation session's findings, and the two that were wrong

Sam pointed a Claude Desktop computer-use session at the deployed SkyView with
the brief S232 wrote (#1492), then handed the log over: *"Not sure if
SkyOutline's audit caught all of them."* Sixteen findings across boundary, data
layer, navigation, fetch behavior and keyboard model. **Four were real and are
fixed; two were confidently wrong; one was right about the arithmetic and wrong
about the mechanism, and the correct mechanism is a defect nobody had noticed.**

⭐ **VERIFY EVERY REPORTED DEFECT AGAINST THE SOURCE — S231's lesson, paid
again.** Two findings dissolved on a single grep:

- *"`#u-mode-pan` and `#u-mode-move` carry neither `title` nor `aria-label`, and
  the active mode is conveyed by styling alone with no `aria-pressed`."* Both
  buttons carry `aria-pressed`, `setMode()` maintains it on every switch, and
  their visible text ("Pan", "Move") **is** their accessible name — a labeled
  button needs no `aria-label`. Nothing to fix.
- *"214 identities show `0 college courses carried` and `row count 3` side by
  side with no explanation of what `row count` means."* The count carries a
  `title` that explains exactly that, and says why the two differ. The
  explanation is there; it is on hover.

⚠️ **THE FINDING RANKED FIRST WAS THE ONE MOST WRONG.** The session reported the
brief's payload figure as off by ~4,000 and recommended correcting it. Both
number pairs are correct — they describe different files, and the one the brief
quoted belongs to a surface SkyView never loads. Applying the recommendation as
written would have put a number in the brief that described nothing. Full
worked case, and the rule it yields:
[`methodology-a-figure-is-only-wrong-relative-to-the-payload-it-names`](kb-notes/methodology-a-figure-is-only-wrong-relative-to-the-payload-it-names.md).

⭐ **THE 117-DISCIPLINE DISAGREEMENT IS A TWELVE-DAY BUILD GAP, NOT
CANONICALIZATION.** The session's arithmetic reproduced exactly (117 of 158
differ, gap 1,904, net −6, `(no discipline yet)` 955 lower in the universe) and
its proposed mechanism — universe post-canonicalization, atlas pre- — is wrong.
`_generated_from` reads `2026-08-24 15:34` on the atlas payload and `2026-09-05
15:22` on the universe: two builds spanning the authority recode, the Z-band
retirement and the prefix fold. Nothing rebuilds the atlas payload on a
schedule. So the −6 the session left open as "the only part that warrants
investigation" needed none — **but the staleness does**: the discipline tables
read the older payload while the map reads the newer one, so one screen can show
Health 43 apart. Open for Sam, alongside his standing question ② (should the
daily run rebuild the universe layout?).

### The four that were real, and what each cost

⭐ **TWO REPORTS, ONE DEFECT — the keyboard model's cursor was never set by the
mouse.** *"There is no click path from an identity back to its discipline"* and
*"Escape backs out only if you arrived by keyboard"* are the same bug.
`kbIsl`/`kbNode`/`kbInside` were set only by the Tab/Enter path, so a mouse user
pressing Escape — as the footer hint tells them to, unconditionally — hit
`if(kbInside)` and got nothing. The back path existed the whole time and was
unreachable by the route almost everyone takes. Fixed with one seam: `kbSync()`,
assigned by `wire()` and called from `showNode`/`showIsland`, so **every**
selection path points the cursor. Idempotent for the keyboard path, which sets
the same values and then calls the same functions. The panel also gains a
**Back to `<discipline>`** control, because Escape needs canvas focus and a
click in the panel does not leave it there — a word, per the glyph rule.

⭐ **RESET THE SCROLL WHERE THE DOCUMENT CHANGES, NOT WHERE IT REPAINTS.**
Opening an identity kept the panel's offset, landing the reader mid-document in
a course they had never seen, below its title, code, units and articulation line
(reproduced 2/2: 400→399, 600→627 — the inexact copy is browser scroll
anchoring, not a deliberate restore). ⚠️ **The obvious fix is a regression.**
`renderNode()` fires on every filter keystroke, description toggle and staged
move; resetting there throws the reader to the top mid-task — which is precisely
the friction Sam reported in the search list the day before (ruling 3a), whose
first cut had already been wrong once in the same way. So the reset goes in the
**entry points** — `showNode`, `showIsland` — and a test asserts a re-render
does *not* touch the scroll. jsdom does no layout, so the property is
instrumented rather than measured; that is the contract anyway.

⭐ **A BASE THAT CANNOT EXIST ON THIS HOST MUST NOT BE TRIED FIRST.**
`DESC_BASES` was the fixed pair `["ccr_desc", <bucket>]`. The shards are 50 MB
of derived text and deliberately uncommitted, so on the deployed page the first
base **can never succeed** — every discipline paid a guaranteed 404 (which
downloads a 5 KB GitHub 404 page) before the fetch that works. Measured by the
session: three disciplines, three 404s, ~350 ms of pure latency, and a network
panel that reads like a broken page to anyone debugging something else. Now
ordered by `location.hostname`: localhost and `file://` keep the local directory
first, every other host leads with the bucket. Extracted as `descBasesFor(host)`
and exposed on the debug state, so the per-host contract is testable without
standing up a second 847 KB window just to change the URL.

⭐ **THE MOST REPEATED CHIP ON THE SURFACE HAD THE LEAST TO SAY.** 13 of 16
chips in a typical panel carried no `title`. The two that did cite their ruling
and its date; the identity-system chip — the one on every identity — said
"M-ID — our working label" and nothing more. That names the system without
saying what follows from it: who may re-key it, and whether it is a statewide
claim. `SYSWHY` now carries that per system.

**All six fixes perturbation-tested red before green** — including the
regression direction: moving the scroll reset into `renderNode()` fails the test
written to forbid it, and reverting `DESC_BASES` to the fixed order shows
`ccr_desc/welding.json` fetched ahead of the bucket in the test's own output.
That is what the 404 looked like.

### Still open from the log — *all closed the next morning; see the 2026-09-06 (morning after) section*

Logged, not fixed: the token chips read as breadcrumbs but only their `×` is a
control (**§2.2** — they are a pick list, not a location, and Sam should decide
whether they become navigable); only the title is a hit target in a panel row
(**§2.4**); a carried course has no in-panel destination, so every staged move
goes through the canvas (**§2.5**); *Recenter* targets the token rather than
what the panel shows (**§1 ruling 6** — the title says so, the wording is Sam's
call); the canvas is reachable by Tab but sits behind 217 controls (**§2.3**);
and a search-box focus loss the session logged as unreproduced (**§6.3**),
which matches a non-defect S231 already diagnosed. The `⋮` menu's same-origin
link out to COBI is now named in the brief as a boundary the observer must not
cross — the single most likely accidental crossing, and the old rule did not
cover it.

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


## S236 — the deferred commit, and a removal derived instead of recorded

Sam ran this on a local desktop session against the 2026-09-06 recording, pushed
`claude/video-project-2-frames`, and it sat without a PR while `main` moved two
PRs ahead. Both sides then changed the same dropdown from the same review.

**The merge was a synthesis, not a pick-a-side.** Main kept: the masthead fix
(the branch still wrote `"prototype v1 — "` into the aria-label, so taking it
wholesale would have regressed a shipped fix), `runSearch()` so the button and
the key stay one call, and `markSug`'s id-addressing. The branch kept: the whole
deferred-commit model and the footer's pending counter. They turned out to agree
once combined — with `takeHighlighted()` meaning "commit the pending set", main's
submit handler already expressed the branch's semantics.

⚠️ **A HANDOFF'S OWN DIAGNOSIS IS A HYPOTHESIS, NOT A FINDING.** The branch's
handoff named `.filter(Boolean)` in `commitPending()` as the cause of a lost pick
and `keyOf()` vs `tokenFromSuggestion().key` as the prime suspect. Both were
wrong, and cheap to disprove: `__ccrTokenKey` **is** `tokenFromSuggestion(s).key`
— the same call, so they cannot disagree — and one `console.error` in the commit
showed `add` carrying both items with distinct keys and `.filter(Boolean)`
dropping nothing. The defect was on the other side of the commit entirely, and it
was worse than reported: not "a pick is silently lost" but "an already-committed
pick is silently destroyed". Instrument before you accept an inherited cause.

⚠️ **`.video-context/` IS GITIGNORED, AND MAIN STILL CARRIES TWO FILES FROM IT.**
#1501 made a per-file decision inside that directory — frames out, transcript in
(Sam's own words, quoted throughout the findings doc). Removing the directory
wholesale on the strength of the ignore rule deleted a file main holds, and CI
caught it. Check what `origin/main` actually holds before removing a path.

⚠️ **The triplication warning in the handoff was wrong.** It said the dropdown is
maintained by hand in three files. `prototype/skyview.html` is GENERATED —
`build_ccr_atlas.py` inlines `ccr_universe.js` and the payloads into
`ccr_atlas_v1.html`. Resolve the sources, then regenerate.

⚠️ **Ruling 1's note that it "did not touch `takeHighlighted()`" is retired.**
That was true when ticking committed on the spot; `takeHighlighted()` now commits
the pending set, and there is no immediate multi-select pick to protect.

## S237 (SkyFacet II), 2026-09-07 — a rule that is right for reading, wrong for moving

Sam reported three things, all on the curation path. Two were one-line CSS and
one-line data faults; the first was a hit test that had been correct for a
different verb.

### ① "Courses no longer responsive after 2nd drag and drop … no go"

**The report named a count and the count was a red herring.** Five consecutive
panel drags from *Introduction to Welding* onto *Introduction to the Welding
Processes* all landed, at his zoom and at a higher one, on the source path he
described. So did eight stand-alone drags, and eight click-carries. The failure
is not the second drag; it is **which destination** you aim at.

`pick()` carries a rule from S236: when an identity is open, its member stars
outrank any circle they happen to overlap. That was measured and it was right —
110 of 120 stars used to hand back the identity card instead of the course, and
reading those courses is the entire point of the ring. But the ring **spreads**,
and the same rule then eats the drop. With *Introduction to Welding* open at
296%, **six identity circles inside the viewport sat under one of its own
stars**; a drop on each of the first three resolved to the identity the course
was already in, and `applyMove()` refused it — *"That course is already there."*
— in a hint at the very foot of the window.

⭐ **The verb decides the hit test.** `pick(px,py,forDrop)` resolves circles only
while a course is carried; reading is untouched (24 of 24 drawn stars still open
the college course). The panel's own sentence was the contract all along:
*"Drag a course onto a circle on the map."*

⚠️ **A refusal nobody can see is indistinguishable from a dead control.** Two
things follow from that and both shipped: the carry now RINGS the destination and
names it beside the code (`WELD 70 → Introduction to the Welding Processes`), and
the receipt stopped saying *"Recorded below the map"* in SkyView-alone, where
`body.u-solo` does not paint that pane at all. A message that names a place the
reader cannot look is worse than no message.

### ② Duplicated skills — and the fold has to happen where the counting does

`olWords()` keeps a hyphen inside a token (`[A-Za-z][A-Za-z\-']+`), so
`flux-cored arc welding` is a 3-token phrase and `flux cored arc welding` a
4-token one. Neither containment nor length could see they were one name.
Measured over all **46,317** identities carrying a catalog description: **209**
shown rows differ from another on the same card only by a hyphen, **835** only by
a plural, **762 identities (1.6%)** show at least one pair. `WELD M1109` — the
card in his screenshot — is one of them.

⭐ **Fold the KEY at the counting step; never collapse finished rows.** The
confidence chip counts COLLEGES. A college that writes it both ways must count
once; two colleges spelling it differently must count twice. Merging rows
afterwards keeps whichever count was already wrong. The row then displays the
surface form the most colleges published — nothing is rewritten into a spelling
nobody wrote.

⚠️ **`sses` belongs in the `-es` family.** Without it the first cut left 19 pairs
standing, every one of them *process/processes*, *business/businesses*,
*class/classes* or *discuss/discusses* — the exact words a course description
reaches for. With it the corpus-wide sweep finds none.

### The curate controls, and a removal that must not be a snapshot

**Add a skill** and **Remove** stage in the browser beside the title and subject;
nothing is written from this page. A removal is stored as an explicit
`skillDrop` key and every one is restorable and named on the surface. That is
S236's lesson applied one layer up: the imputation re-runs whenever a catalog
description lands, so a surface that stored *what is left* would silently delete
every skill that arrived after the reviewer last looked.

### Two defects found on the way, both worse than what was reported

⚠️ **An outline opened by its own link had NO college courses.**
`buildMemberIndex()` ran only inside `__ccrUniverse`, so `#outline/<id>` — a
shared link, a reload, the very thing the hash routing exists for — rendered an
outline whose every layer said "none": no description to quote, no skills to
impute, an empty member list. `members: 0, memberSource: ""` on an identity
carrying 24 courses. That is not a rendering gap; it is a false statement about
the data, and it is indistinguishable from an identity that genuinely carries
nothing. `ensureCorpus()` now binds the payload for whichever view is entered
first.

⚠️ **A CLOSED `<details>` STILL MEASURES.** `npm run a11y` reported *"10
focusable with no ring"* on the outline. Every one was a `Remove` button inside
the collapsed *Named by a single college* section: Chromium hides a closed
`<details>`'s content with content-visibility rather than `display:none`, so
`getBoundingClientRect()` returns a real rect while `focus()` is a no-op and
`:focus` never matches. The `height === 0` guard the script had could not see it.
The fix is not to skip those controls — that trades a false positive for a
coverage hole — but to OPEN the sections for the measurement and put them back.

### What did not need fixing, and why that matters

The moved-row background was three characters of CSS: `.mlist li.moved` and
`.orbits li.moved` painted a raw `#EAF1E6`, which is a light green on a dark
canvas under near-white text. Four other rules were stranded the same way. What
is worth keeping is the **calibration**: the light design's tint is only 1.15:1
against the surface it sits on, so the dark counterpart was chosen to match at
1.13:1 rather than to be "visible". A tint that reads as a state is louder than
the design it belongs to. `tests/ccr_skyview_drop_target.test.js` now fails on
any rule that paints a raw hex background with no dark-canvas counterpart.

**Suites:** `ccr_skyview_drop_target` 14/14 (new) · `ccr_skyview_outline` 50/50 ·
`ccr_skyview_universe` 222/222 · `ccr_skyview_search_show` 130/130 ·
`npm run a11y skyview` 8/8 routes. The three key guards are mutation-tested:
reverting each fix reproduces the reported symptom, including the refusal text
and the two spellings side by side.

## 2026-09-07 — Session 238 (SkyFacet III): the CPL face and the articulations light

The eight rulings of the 2026-09-07 sheet became a build. Two controls sit next
to Show in SkyView's row — **Courses | CPL** and **Articulations** — and the
course outline of record gained its CPL layer.

### What was built, and what each thing reads

- **The payload** — `kb/_build_ccr_cpl.py` → `prototype/ccr_cpl.json` (509 KB,
  fetched on demand, never on first paint). The join is the articulation
  crosswalk (`kb/coci_articulations.json`), which is the same join the map's
  `ar` badge is already counted from, so the lit set and the CPL face agree by
  construction: **1,490 identities both ways**. The agencies come from the
  curated CER (`credential_reference_data.js`, daily), not from the crosswalk's
  inlined issuer — measured, the inlined issuer disagreed with the CER on
  **1,743 of 4,592 records**, mostly a null where the CER had since been curated.
  The articulated-exhibit universe is `statewide_data.js` (5,413 ids); 55
  crosswalk exhibits are no longer in today's feed and are **flagged `s:1`,
  never dropped** (Sam's ruling 5 of 2026-09-05). The daily run rebuilds the
  payload every morning (Step 4d3) because the CI guard fails on a stale file.
- **The light** — a gold glow and a thin ring (the palette's mustard, `--sky-lit`)
  on a point with `ar`; nothing on the rest. Below the course zoom a discipline
  holding a lit course carries the ring, because a control that answers only
  past the zoom the map opens on reads as broken (the Show switches, 2026-09-05).
  The Show menu keeps its articulation *filter*; the light is a different control.
- **The face** — labels lead with the credential that reaches the point ("+N"
  for more), the full band adds the issuer and the trainer where it differs, and
  **a point nothing reaches is unlabeled**. Island labels gain "· N credentials"
  only where any do. The hover, the panel and the discipline panel lead with the
  credential; search indexes the credential vocabulary (names, agencies,
  recommendations, exhibit titles) and rings every course a pick reaches.
  `#skyview/cpl` is a link to the face.
- **The outline's CPL layer** — built, uncapped, with both agencies; an empty
  layer states the ceiling in words rather than reading as finished.

### ⭐ The ruled coverage line carried two wrong numbers

*"1,490 of 6,388 exhibits reach a course on this map."* 1,490 is the count of
**identities** on the map with an articulation; the exhibits number **1,924**.
And 6,388 is the credit funnel's exhibit count — a universe that shares only
**570** ids with those 1,924, because the funnel is ACE-keyed (6,291 of 6,388)
and the crosswalk is MAP-keyed. The built line reads **"1,924 of 5,497
articulated exhibits reach a course on this map"**, computed from the payload's
counts; the fixture's numbers (4 of 777) make a literal fail the suite.
KB note: `methodology-a-coverage-line-takes-both-numbers-from-one-universe`.

### Verified — Chromium, then jsdom

Driven on the served page: the light at the opening zoom and at 88% in
Welding; the face switch with its line; the island label *Welding (170) · 46
credentials*; a vocabulary search ("american welding society" → 18 courses in
one discipline); the panel and the hover on `WELD M1109` (7 credentials, 7
exhibits); the outline's layer; the dark canvas; `#skyview/cpl` restoring the
face. `npm run a11y skyview` passes all 9 routes (the CPL face is a route now)
at 3 widths. Suites: `ccr_skyview_cpl_face` 62/62 (new), the seven existing
SkyView suites unchanged, `ccr_cpl_payload_test.py` 13/13. Six mutations each
fail the suite: the face never relabels (5), an unreached point gets a label (2),
the light never draws (1), the light marks every point (1), the line quotes a
literal (1), the trainer is dropped from the outline (2).

### Small facts worth keeping

- `shortCollege("Beta Community College")` is *Beta*: the suffix regex strips
  "Community College" whole. A test that expected *Beta Community* was wrong.
- The CER tab already renders **Issuing Agency** and **Trainer** columns (Rule
  5f), so the "credential Exhibit" half of Sam's note was already true there.
- Ids in the articulation feed can carry a literal TAB (`MAPCXS-F3\tF-1-001`);
  a space-split list survives it, a whitespace split does not.

## 2026-09-07 (S238, afternoon) — the globe: three rounds and what they taught

Sam asked, unprompted, whether the 2-D sky should become *"a 3-d 360 globe that
rotates"* to gain real estate, heard the assessment (a globe shows a hemisphere;
the room is the zoom range) and said *build it!* Three rounds followed in one
afternoon — #1509, #1510, #1511 — each a reply to his reaction, each built as a
switch on the same page. His close: *"Looks great!!!"* Generators:
`prototype/globe/` (extract → layout → build; README there).

### What the sphere taught

- **A hemisphere faces you.** The count line says it: 25,580 of 49,896 points
  at the opening view outside; 33,781 in a 240° window inside with the far sky
  squeezed to the edges. Real estate is the zoom range. KB note:
  `methodology-a-globe-shows-a-hemisphere-real-estate-is-the-zoom-range`.
- **A near-square map wrapped by longitude and latitude is 2.2 to 1 at the
  equator** (5,569 × 5,566 units onto 360° by 162°), pinched toward the poles —
  Sam saw the ovals at once. Round caps at that scale would cover 141% of the
  sphere; at 62% of it they fit with room (the spread relaxation: no overlaps,
  a mean move of 7°). Smaller and round was his own read: *"Since we can zoom
  almost infinitely, nothing lost."*
- **Inside, the disc was wrong and the window was right.** The first inside view
  sized every dot by distance, and from the center every dot is at the same
  distance — globs. An all-sky disc (azimuthal equidistant) read as a globe
  shape; a stereographic window filling the canvas reads as the night sky, keeps
  the round islands round, and takes 30° to 240° across. Stars are sized in
  pixels in both views, with a limb fade outside; a floor of 1.3 px stops a star
  flickering between pixels; the twinkle is a slow, shallow per-star phase that
  runs only while the sky turns; the turn slows in proportion to the zoom.
- **The order was the real gain.** Placed **By kind** — CTE one side, academic
  the other, the mixed and unread ones riding the boundary — the arrangement
  says something the committed layout does not. The kind is TOP's one sanctioned
  use (the manual's CTE flag on each identity's TOP code) as a share per
  discipline: 97 CTE at 0.6 or more, 50 academic at 0.4 or less, 12 between.
  Music reads CTE on 68 of 589 identities with a TOP code; treat the share as a
  prototype's reading, not a classification.
- **Answer a reaction with a switch, not a version.** Round | Wrapped, Committed
  | Spread | By kind, the color chips: he compared on one page and ruled the
  same hour (*"Now I don't think we need the wrapped option"*). KB note:
  `methodology-answer-a-reaction-with-a-switch-not-a-version`.

### Tooling pitfalls worth one line each

- `pkill -f` with a pattern that also appears later in the same shell command
  kills the shell itself (exit 144); a bracketed pattern only helps when the
  literal text does not recur in the command.
- A failing python heredoc does not stop the commands after it unless they are
  chained with `&&` — the third round's pointers went out in a second commit
  because the first chain started after the script.
- The dependency map scans tracked files only; `git add` before regenerating.

### Archived from the lane at the S238 checkpoint (verbatim)

**S237, at 296% with Introduction to Welding open:** SIX identity circles inside
the viewport sat under one of that identity's own member stars, and a drop on
each of the first three moved nothing while the hint said *"That course is
already there."* Reading is unchanged by the fix — **24 of 24 drawn stars** still
open the college course. **S238:** the CPL face, the light, the vocabulary search
and the outline layer were each driven on the served page; `npm run a11y skyview`
passes all 9 routes at 3 widths.

## 2026-09-07 — Session 239 (SkyGlobe): the sheet, the sphere as a daily artifact, the staged mark

Sam had ruled the globe in at the close of S238. His own practice puts the
design calls on one sheet before the code, so the port's code waited on his
replies and the two answer-independent items shipped (PR #1513).

### The sheet, and what measuring it turned up

`docs/visuals/2026-09-07-eight-calls-before-the-sky-goes-in.html` — artifact
https://claude.ai/code/artifact/5d683e8a-baa7-4ecc-a0b8-140ad3aee18d. Seven calls
came from the handoff; the eighth came from the measurements:

- **The day sky fails non-text contrast for three of the four legend colors.**
  Against the prototype's Day ground (#A8C3E8): silver M-IDs 1.24:1, the
  articulations light 1.08:1, CCN gold 2.85:1; the words clear it (labels 9.5:1,
  region names 4.9:1). The prototype survives by giving every dot a seal-blue
  rim by day (7.2:1) — a dot exists by its edge, and the legend's colors stop
  telling the systems apart. Night: everything at 6.3:1 or better.
- **Silver and violet are two of Sam's rulings meeting on the dark ground.** The
  map's dark canvas paints an M-ID violet (`--sky-sys0-stroke:#B28DEB`, his
  "match our legend" ruling of 2026-09-05); the globe paints it silver (his
  "Silver MIDs looks the most natural" of 2026-09-07). 49,355 of 49,896 points
  (99%) wear the M-ID color — every stand-alone is drawn in it too — so this is
  the color of the sky, not a detail. Silver on the night ground 12.3:1, violet
  6.8:1; silver on the light canvas 1.46:1 (cannot exist). Item 8.
- **By kind keeps 29% of each island's five nearest committed neighbors; 49% is
  the ceiling** (only that share of committed neighbor pairs are on the same
  side to begin with; of those, 56% survive). Spread keeps 75%. Median move 26°,
  the largest 117° (Kinesiology, the largest island, academic at 0.08).
- **The kind reading rests on 24% of the points** (11,862 of 49,896 carry a TOP
  code the manual knows); the median island's reading on a quarter of its
  points; Music sits on the CTE side on 68 of its 1,721 points at 0.9. Five
  disciplines sit within 0.05 of a threshold.
- **A turning sky needs no three.js.** A full Canvas 2D redraw of 49,896 points
  measured 34.7 ms as squares, 53.6 ms as circles, 17.9 ms with a projection
  and the far half culled — in headless software rendering. The port draws on
  the map's own canvas.
- **The opening counts, replayed off the layout file:** 27,461 outside (the
  prototype's Chromium count was 25,580 — the placement replica differs a
  little), 19,531 in the 150° window (39%), 35,395 in the 240° (the prototype:
  33,781). The sheet cites the Chromium counts and marks the 150° figure as
  replayed.

### The sphere placement as a daily artifact

`kb/_build_ccr_sky.py` → `prototype/ccr_sky.json`, 34 KB: each island's
center on the sphere three ways as longitude/latitude, the class, the share and
its base. The relaxation is ~90 s of pure Python, so the builder hashes its
inputs (geometry, classes after the hold, scale, algorithm) and rebuilds only
on a change; `--check` and the 32-check test run in half a second (Step 4d4;
KB note `methodology-a-slow-build-fingerprints-its-inputs-so-the-check-stays-cheap`).
A side is held across 0.6/0.4 by a 0.05 margin. `globe_layout.py` now imports
`relax` and `clearance` from the builder; the globe page rebuilt byte for byte
from it (layout and page both identical — the alias-chain lesson, applied).

### The staged-to-move mark (v4 item 7) — the governing review is fully shipped

The mark lives on the model — `stagedHere` / `stagedAwayFrom` / `stagedWords`,
`unstageMove` for *Put back* — and every view asks it: the destination's row
(*staged here — not saved*, never "moved here") and star; the origin's ring
(the course still drawn, a hollow dashed ghost on a ring of its own outside the
members, labeled with where it went), panel (*Staged to move away*, Put back)
and hover; the identity labels and hovers (a count); the outline's band; the
hint (*Staged to move …*). A move record keeps `home`. Twenty checks in
`tests/ccr_skyview_staged_move.test.js`; three older assertions moved with the
words (the label form allows the suffix; the emptied stand-alone says staged).
KB note `methodology-a-staged-state-lives-on-the-model-and-every-view-asks-it`.

### Measured in Chromium — the served page

A real drag from the panel's *Drag…* to a neighbor circle staged the move,
the ghost's hover read *staged to move to Introduction to the Welding Processes
— not saved (Welding). Was under WELD M1109; Put back in the panel drops the
staged move*, the destination's first row read *staged here — not saved*, and
the two outlines' bands read *6 college courses · 1 staged here — not saved* and
*23 college courses · 1 staged to move away — not saved*. `npm run a11y
skyview`: 9 of 9 routes at three widths.

⚠️ **The docked panel narrows the canvas.** Two drives dropped on empty space
because the destination's screen position had been computed from the canvas
rect before the origin was opened; opening it docks the panel, the canvas
loses its width, and the center moves. Synthetic events were not the problem
(the real mouse missed the same way). Measure after the open.

### Tooling pitfalls worth one line each

- A hover probe grid (25 points, 6 px apart) finds a circle faster than
  reasoning about why a computed point misses.
- `npm run a11y` from the wrong directory fails on a missing package.json
  after the shell's cwd resets between calls — run it from the repo root.

## 2026-09-07 (S239, evening) — SkyGlobe: the Sky goes in

Sam answered the sheet between 19:59 and 20:02 UTC: eight items, eight `yes`,
no notes, no follow-ups — then *"decisions done!"* in chat. That turned NEXT ⓪
from a plan that assumed his answers into fully specified work, and the Sky
shipped the same evening (#1514): `#skyview` opens the inside window onto
the night sky; **Sky · Globe · Map** are three words in the row and three
places to stand on the one canvas; Night by default with Day keeping the rim;
a slow turn that stops at the first touch, the twinkle only while it turns and
none of either under `prefers-reduced-motion`; drag and drop by angle on the
sphere (a Pan drag turns it); By kind as the arrangement with the two region
names riding the sky; silver M-IDs on every dark canvas. The prototype's
controls landed as the sheet tabled them — *Rotate* came, *Discipline names*
folded into More → *Show or hide*, the zoom readout reads degrees across on the
Sky, radii on the Globe and percent on the Map, and the Islands switch, the
M-ID color chips and the count line left.

**The sphere is the map through a projection.** No second renderer: each
discipline island is a locally flat disc on the sphere, `prepSphere()` computes
its projected center and Jacobian once a frame (`isl._s`), `w2s(x,y,isl)` is
one multiply-add from that cache and `pick()` reads the same cache — so the
S237 drop-target fixture ported as it was and **passed on the curve** once `w2s`
and `s2w` honored the island's Jacobian, and the label placer and the keyboard
path passed untouched. The window is stereographic (4°–240° across), the globe
orthographic from outside with x mirrored. The placement comes from
`prototype/ccr_sky.json` when it binds and from the flat map wrapped
(`wrapOf()`) until it does. KB note:
[`methodology-the-sphere-is-the-map-through-a-projection`](kb-notes/methodology-the-sphere-is-the-map-through-a-projection.md).

**Measured on the served page.** The turn ran at **5 fps** — 117 ms a draw —
because every one of 49,896 points was its own `arc()`. Batching the stars
below `ID_ZOOM` per color|alpha bucket (a `rect` at 1.8 px and under, an arc
above) took a draw to **42.5 ms**, about 13.5 rAF frames a second in headless
software rendering. Two Chromium drives: the turn, a fly, an open, a real-mouse
drag landing on the neighbor's circle, Day, the Globe and the Map, with no page
errors. `npm run a11y skyview` passes **11 of 11** routes at three widths
(`#globe` and `#map` added in `a11y.config.js`).

**Wrong on the way, in order.** (1) **The globe came out mirrored** — the sky's
basis served an outside view; `projectDir` and `unprojectDir` now flip x for
the globe, and the drag and arrow signs flip with it (sky +1, globe −1). (2)
**Opening the Sky under the existing suites broke seven of them**, since every
one assumed the flat map; the harness hook `window.CPL_SKYVIEW_OPENS = "map"`
in `beforeParse` says which projection opens, and `projKeyOf()` returns
`skyview` for the opening projection so `#skyview` and `#skyview/cpl` hold. (3)
The outline suite's source-regex guard on `var size=Math.max(11,…)*tx()` — keep
the substring, add a line. (4) **The last failing check reported a state bug
that was a missing stub**: *"globe 150% #map"* with `proj` already `globe`.
The globe's body clips the clouds by day, the fake canvas had no `clip`, and
the exception left `setProj` half done — the projection set, the readout and
the hash not. A fake context needs every method the draw path calls, and a
check that reads like inconsistent state is worth one stack trace before any
theory. (5) Two mis-sequenced checks in my own suite (a hint overwritten by a
search; a Tab check assuming no selection).

**Numbers.** `tests/ccr_skyview_sky.test.js` 50 checks; eight SkyView suites
green (`universe` 222, `search_show` 130, `cpl_face` 62, `outline` 50,
`staged_move` 20, `drop_target` 14, `hover_disc` 10, `sky` 50); draw 117 →
42.5 ms; a11y 11 of 11.

## Sam's rulings — where each landed

- **2026-09-06, eight (outline sheet):** built — text zoom, "the only college
  teaching it", `.gitattributes`; recorded — skill-source precedence, the
  toggle's treatment of absence, the curate phrase's scope, no nightly layout
  rebuild, Interdisciplinary Studies is a grab bag. Detail in the lessons doc.
- **2026-09-07, eight (CPL views, folded skills, curate governance):** items 1-3
  **built in S238** (the invariants above); 4-5 stand as shipped; 6-8 are
  **DR-24** in the governance register with **Sam as its named owner** — an
  added skill carries the reviewer's name and the day, lands `proposed`, joins
  the published outline on a second curator's agreement; a removal is symmetric
  and an unseconded one stays visible with the objection. Nothing writes from the
  page until DR-24's surface ships. ⚠️ The sheet proposed "DR-22"; that id was
  already the GR register.

---

## 2026-09-07 · S240 (SkyDome) — three screen recordings, six bugs, and a profile that moved the frame-budget lever

The first run driven entirely by **screen recordings**. Sam sent three, each one
sentence long, and none of them named its own cause. Everything below was
reproduced on the served page in Chromium before it was touched, and measured
again after — `npm test` cannot see a frame rate, a color, or a stuck pointer.

### The flicker — and the two suspects that were innocent

*"See the video screen capture and note how the skyview flickers around."*

The video is 12.3 s at 30 fps. Rather than eyeball 370 frames, a per-frame mean
absolute difference located the problem mechanically: content changed on a **two
frame cycle** for the whole clip, and one pair of frames showed the Dance and
Humanities islands with **their labels and discs drawn but every dot gone**.

Two hypotheses were built and **both were wrong**, which is the useful part:

- **The twinkle.** Rebuilt the page with `twinkleOf()` returning 1. Per-frame
  diff 18.26 → **19.46**. Not it.
- **The star-alpha bucketing** (`Math.round(alpha*8)`, an 8-step quantization
  applied to ~27,000 stars — a very plausible strobe). Rebuilt with full alpha.
  18.26 → **18.20**. Not it either.

⚠️ **A third variant looked like a cure and was an artifact.** Gating `showNodes`
on `kCenter()` instead of the per-island `k` dropped the diff to 2.69 — a 7×
"improvement" that was really `kCenter()=0.194 < NODE_ZOOM=0.20` switching *every*
dot off. An empty canvas is very stable. **A metric that only goes down when the
thing being measured stops existing is not measuring what you think.**

The controls that did settle it:

| variant | per-frame diff |
|---|---|
| as shipped, turning | 18.1 |
| as shipped, **turn stopped** | **0.000** |
| twinkle removed | 19.5 |
| alpha quantization removed | 18.2 |

Stopped is *exactly* zero, so all of it comes from the turn. Then the actual
causes, both measured live:

**1. `dt` was clamped BELOW the real frame time.** `Math.min(0.1, …)` guards a
backgrounded tab. But the draw measures 133 ms a frame at 240° across (83–267 ms),
so `dt` pinned at the clamp on every frame. Instrumenting `sph.spin` per frame:

```
dt(ms) dSpin(rad)
 257.4    -7.20e-3
 192.7    -7.20e-3
 307.5    -7.20e-3      ← identical step, wildly different elapsed time
```

A fixed angular step at an irregular cadence. It also meant the sky turned at
**0.0393 rad/s against an intended 0.0720** — 55% speed, silently, for as long as
the Sky has existed. `TURN_DT_MAX` now sits above the frame time: 29 distinct step
sizes over 139 frames, angular-velocity IQR **18% → 0%**.

**2. A bare threshold on a per-island scale.** `showNodes = k > NODE_ZOOM` is a
flat-map idea: there `k` is `view.k`, one number for the whole map, crossed
deliberately and together. On the sphere `k` is per island — `sec²(ang/2)` times
the center's — and drifts continuously as the sky turns. At 240° across, **18 of
159 islands sit within ±3% of `NODE_ZOOM`** (Dance 0.1998 against 0.2000) and 11
flipped inside 120 frames, each switching a discipline's entire dot field while
its disc and name stayed put. That is the blink in the recording, and it is why
the labels survived it. Hysteresis (`NODE_ZOOM_KEEP`), with `pick()` reading the
same memory rather than re-testing: **16 flips across 13 islands → 4 across 4**,
one crossing each.

⭐ **The general lesson: a constant tuned for a global scale becomes a flicker
gate when the scale goes per-object.** Every other band on this map (`ID_ZOOM`,
`TITLE_ZOOM`, `MEMBER_ZOOM`) has the same shape and will need the same treatment
if a reader ever parks near one.

### The frame budget — S239's carry-forward named the wrong lever

S239 recorded: *"the lever is an offscreen star layer invalidated by view change,
or a WebGL point pass behind the same `w2s` — never per-point work."* Profiled
with CDP on the served page, that is **backwards**:

| | cost |
|---|---|
| one batched path of 27,000 rects + fill | **5.9 ms** |
| `clearRect` on the whole canvas | 0.02 ms |
| `readPal()` (a full style read, every frame) | 0.03 ms |
| the frame itself | **133 ms** |

The canvas is 4% of the frame. The profile's top JS entries: **`measureText`
12.3%** (the same label strings re-measured every frame), **`emptied()` 6.7%**
(it allocated a throwaway array per point, ~50,000 times a frame — fixed this
run), `save` 7.4%, `cw()`/`ch()` 2.7% (each a `clientWidth` layout read, called
from `w2s`). An offscreen layer or a WebGL pass would buy the 5.9 ms and leave
the other 127. ⚠️ Headless, no GPU: the ORDER should hold, the absolutes will not.

### The purple sky

*"after filters applied the sky turns purple and should stay the same as was
selected (night) on opening screen"*

Sampling the recording's canvas background gave `rgb(34,29,49)`; the dark theme's
`--sky-island-sel` is `#2E2A44` = `rgb(46,42,68)` — the same hue, JPEG-scaled.
That token is the **selected island's** fill, and it reads as a highlight only
while the disc's edge is on screen. At 6° across the disc is bigger than the
window, so the tint stops being a tint and simply *is* the sky. Reproduced at 4°:
`rgb(46,42,68)`; after the fix `rgb(33,36,42)`, the plain night ground.

⭐ **A highlight is a figure-ground relationship, not a color.** When the figure
grows past the frame there is no ground left for it to read against.

### The carry that stayed stuck

*"Staged move seems to clear but I can't drag it to the new home"* — a report
that sounds like a `Put back` bug and is not.

Driving it in the browser: after Put back the Drag button **is** back in the
panel, clicking it leaves the hint reading *"Put back WLDT 107 — nothing is
staged for it now"* instead of *"Carrying…"*. The pick-up handler is guarded by
`if(!(drag && drag.kind==="course"))`, and `drag` is cleared in four places — all
of them canvas handlers. The **panel** routes (a destination click, *Move here*,
*Accept*) call `applyMove` directly, which never cleared it. So the first move
completed from the panel left the reader invisibly carrying the course, and from
that moment **every Drag button in the session was a silent no-op**.

⭐ **A guard needs an owner for its release.** `drag` had four release sites and
none of them was the function every route actually converges on. The release now
lives in `applyMove`, *after* the gates, so a refused move keeps the carry.

### The rest, from the third recording and four asks

- **Re-targeting a staged move.** *"Note how I can't move this course out of its
  previous move to a new one — the correct intro course."* The origin's *Staged
  to move away* row offered Put back and nothing else, so correcting a
  destination meant undoing the move or travelling to the identity the course had
  been staged INTO — the one place its Drag button survived. It now offers *Move
  instead…*. ⚠️ This **reversed an S239 assertion**: `ccr_skyview_staged_move`
  check (6) pinned `!q('li.away .mv')`, on the reasoning that a staged-away course
  is not a member here. The reasoning still holds; the conclusion cost the reader
  the obvious correction. The check now pins both buttons, with the old assertion
  named in a comment so it is not "fixed" back.
- **The outline as a sheet.** Sam proposed it himself — *"make the course outline
  a popup that can be closed and we never have to exit skyview"* — and it is the
  better fix than the Back button he asked for in the same sentence: a sheet has
  no state to restore because none is lost. ⭐ **The cheapest way to preserve
  state is not to leave.** Verified: yaw, pitch and half are bit-identical across
  an open-and-close.
- **Back, and the camera.** For the views he *does* switch to, `parkCamera` /
  `restoreCamera` around `__ccrUniverse`'s `resetView()`. ⚠️ A parked SELECTION
  still re-frames over the restored camera — `restoreTokens` already did that
  deliberately ("Back on X, where you left it"), so the two layer rather than
  fight. With no selection the camera is restored exactly.
- **The sidebar.** The grip clamped at 260px, so closing lived only behind the ⋮
  menu. ⚠️ Making `.closed` zero-width instead of `display:none` (so the grip
  survives to be pulled back out) put the grip's 5px straddle at the stage's right
  edge and **failed all 11 a11y routes at every width** — because the panel starts
  closed. Caught by `npm run a11y skyview`, invisible to 309 green jsdom suites.

### What this run is really about

Three one-sentence reports, six defects, and **not one of the reports named its
cause**. What worked was refusing to fix anything from the description: extract
the frames, measure the pixels, build the rival hypothesis, and let the control
kill it. Two of the most plausible explanations (the twinkle; the alpha
quantization) were wrong, and a third "fix" was an artifact of measuring an empty
canvas. The recordings were evidence, not diagnosis.

---

## 2026-09-08 · S241 (SkyClear) — the asteroid field, and a fix that made the picture worse

S240 shipped two flicker fixes and Sam still saw it. This run is the correction,
and the lesson is squarely about the previous one.

### What S240 got wrong

The `dt` clamp fix was **right and made it worse**. Time-true motion at 8 fps
takes a *bigger* step per frame than the broken half-speed one, so the per-frame
visual change went **18.59 → 21.87**. S240 verified the turn's *correctness*
(step sizes, angular-velocity IQR) and never re-measured its *appearance*.

⭐ **A correctness fix and an appearance fix are different claims and need
different measurements.** Proving `dSpin/dt` is now constant says nothing about
whether the picture looks smoother, and at a low frame rate the two can point in
opposite directions.

### The bug neither of us had found

Sam's words located it: *"an enlarged grouping that is crossing over all the
others — like a loose asteroid field spiraling around."* His screenshot showed a
hard-edged wedge over two-thirds of the window at the **default** zoom.

The sky is stereographic, so the scale at an angle `ang` off the view direction
is `sec²(ang/2)`:

| angle | scale |
|---|---|
| 60° | 1.3× |
| 120° | 4× |
| 170° | **131×** |

`projectDir` refuses only past 3.05 rad (174.8°), so an island almost directly
**behind the reader** still projects — at a hundredfold scale. And the screen
cull is a bounding box built from `isl.r * k`, so the inflated radius covers the
whole window and **the cull passes**. The island is drawn as a sprawl of its
courses over everything else, sweeping as the sky turns.

⚠️ **It was in S240's own measurements.** The island-scale probe logged Music at
`k: 2.4 → 71.5 → culled` and the run read it as an ordinary cull. A number 30×
larger than every other island in the same table was sitting in the output.

⭐ **A CULL MUST BE EXPRESSED IN THE SPACE WHERE THE CONSTRAINT LIVES.** The
constraint is angular — the window shows a finite cone — and the cull was written
in projected pixels, where a divergent projection makes "too far away" and "fills
the screen" the same thing. Testing `acos(cz) - S.th > angMax` is exact.

| | before | after |
|---|---|---|
| largest island scale | 88.4× | **1.5×** |
| frames with one over 8× | 149/150 | **0/150** |
| islands drawn at 150° across | 159/159 | 70 |
| frame interval at 150° across | 88 ms | **57 ms** (+53% fps) |

**89 of 159 islands were being drawn at the default zoom having never been
visible.** The correctness fix paid for itself twice: the artifact went away and
the frame rate rose by half, which is the thing that actually buys smoothness.

### The remainder is not a defect

With the giant island gone, the per-frame change is spread over **877 of 1008
cells** (the top 5% hold 14%) — uniform motion plus ~27,000 one-pixel stars
aliasing across pixel boundaries. Nothing to find. A dense star field moved at
~10 fps shimmers, and the lever is frame rate, not a smarter draw.

⚠️ Before understanding that, this run measured a rate sweep and nearly shipped a
slower turn (SPIN 0.045 → 0.010, per-frame change 21.87 → 7.72). That would have
been a symptom-level constant papering over a real bug, and it was reverted. **A
lever that works on the metric is not the same as a lever that fixes the cause.**

### Sam's two asks, both settled by measurement

- **"Default might look better a bit smaller...as long as the stars show up."**
  The caveat is the binding constraint, not a nicety: `NODE_ZOOM` decides per
  island whether its courses draw. Stepping the real control — 150°: 70/70 keep
  their stars (lowest scale 0.438) · **188°: 99/99 (0.313)** · 226°: 125/125
  (0.224) · 240°: 128/**124** (0.195). 226 keeps them *today* but sits a whisker
  above the line, and an island's scale drifts as the sky turns — which is
  exactly what S240's flicker was. 188 has margin.
  ⚠️ **The opening width is written in TWO places** (`sph`'s initializer and
  `resetView`), and `resetView` is the one that runs: changing only the
  initializer changed nothing, and the probe caught it.
- **"WE don't need the map view anymore."** The Map *button* goes; the Map does
  not. It is the flat renderer the sphere is a projection of, it still routes,
  and seven suites test on it. ⚠️ **The second reversal of a committed ruling in
  two days** (the first was the staged-away row). Both are named in the code and
  in the suite beside the new assertion, because a reversal that isn't recorded
  reads as a regression to the next session.

## 2026-09-08 · S242 (SkyTrue) — the frame budget, and a bill that moved instead of leaving

S241 took the frame rate up by drawing fewer islands. This run took it up again by
asking for fewer fonts and fewer dots. Back-to-back on the served page, same
machine, same minute — a median frame of **81 ms → 46 ms**, about **12.3 → 21.7
fps**.

### Three defects, one shape

A value that DRIFTS was being used as though it were stable, and work was being
done for points nobody could see.

**1 · A memo keyed on a drifting value is not a memo.** `textW` cached on
`ctx.font + "\0" + string`, and an island label is sized off the drawn radius:
`18.0263px`, `18.2506px`, `18.1185px`, a new number every frame as the sky turns.
So the cache never hit once. It was not merely useless — each miss handed
Chromium a font size it had never built, and building it is the expensive half:
**`measureText` was 11.2% of the profile while `textW` itself was 0.5%**, on
**fifteen calls a frame**. Half a millisecond each.

**2 · ⭐ FIXING A COST CAN MOVE IT RATHER THAN REMOVE IT — AND ONLY A SECOND
PROFILE SAYS WHICH.** Measuring at a reference size took `measureText` to zero:
15.4 calls a frame → 0.17. The next profile had **`strokeText` at 9.6%, up from
0.6%**. Nothing had been saved. Chromium builds a font at its first USE, and
with the measure no longer asking, the stroke was simply first in line. The
drifting size was never the memo's problem; it was the *drawing's* problem, and
the memo had only been the messenger. ⚠️ Had this run stopped at "measureText is
gone from the profile" it would have shipped a wash and reported a win — which is
S240's lesson wearing a different hat.

**3 · An island on screen is not an island whose points are on screen.** S241
settled which ISLANDS the window shows. Within one that passes, a discipline
wider than the window still spills its courses past every edge: **5,755 of 27,931
batched dots a frame — 20.6% — lay wholly outside the canvas**, each paying a
`starPush` (two string joins, a bucket lookup) and a `rect` into a path that then
rasterizes.

### What went in

| | before | after |
|---|---|---|
| median frame (served, back-to-back) | 81 ms | **46 ms** |
| `measureText` share of profile | 11.2% | absent |
| `strokeText` share of profile | 0.6% → 9.6% mid-fix | absent |
| off-screen dots batched per frame | 5,755 / 27,931 | **0** |
| distinct fonts asked for per frame | ~15 | **~0.17** |

- **`textW` measures once at `TW_REF` and scales.** One font for the life of the
  page; the key is the typeface and the string again. Not bit-exact — hinting
  moves a width up to 0.14px at these sizes — and it does not need to be: the
  width feeds a collision box already padded 3px a side, and `placeLabels` draws
  centered, so the width never positions anything.
- **`labelSize()` rounds the drawn size to whole pixels, with a 0.6px dead band.**
  `txPx()` has rounded since it was written — *"a fractional px font measures fine
  and renders soft"* — and the island labels were simply never brought under that
  rule. ⚠️ **The dead band is not optional.** A bare `Math.round` is a threshold
  on a drifting value: a raw size sitting near 18.5 would flip 18↔19 every frame,
  a worse shimmer than the one being fixed. This lane has paid for that twice
  already (`NODE_ZOOM_KEEP`; the tint that became the sky).
- **The star batch tests each point against the window.** Inside the fast branch
  only, where the node is a plain dot of radius `dr` that returns at once — no
  halo, no light, no ring, no label. ⚠️ Earlier would be wrong: a point on the
  slow path throws light up to 22% of the canvas and can legitimately light the
  window from off screen.

### The guard, and two decorations caught before they shipped

`tests/ccr_skyview_frame_budget.test.js`, 9 checks — **and the first draft's
behavioral half was worthless.** Written against the standing fixture it passed
with every fix reverted:

- Both fixture islands sit at the label-size **clamp** (`max(11, min(19, r*0.17))`),
  so no size could be fractional and no size could drift. Fixed by driving
  `__ccrTextStep(0)` — `tx()` is 0.85 there, so the clamp itself lands on 9.35.
- All three fixture points sit near the middle, so **no dot could be off screen**.
  Fixed by adding a point 4,000 units out, in an island that still passes S241's
  angular cull.

⚠️ **And one check was deleted rather than fixed:** "40 turning frames ask for few
distinct fonts" cannot fail, because once the drawn size is rounded the font is
stable however `textW` keys its memo. The comment where it stood says so. Every
remaining check was verified by reverting its fix — A: 7/9, B: 7/9, A+B: 6/9,
C: 7/9.

⚠️ **The revert harness overwrote its own backup** (`cp file $GOOD` after an
earlier failed run had already reverted the file), and for two rounds the "good"
state under test was missing `labelSize`. The suite caught it. A guard is also a
guard on the process that verifies the guard.

### The rest of the run: five rulings, a header, and a banner

Sam answered the subjects-and-disciplines sheet **five `yes`, no notes**, and
the work went in the same session.

⭐ **THE SUBJECT IS THE ID PREFIX, NOT `row["subj"]`.** The fill nearly shipped
reading the wrong field. `subj` is the LOCAL college codes — freehand and
multi-valued (`AEROST`, `ARTHIST`, `DANCE (DANCE)`) — and it mis-filed four
rows. The canonical SUBJ4 is the identifier's own prefix, which is the rule
SkyView's `subjCode()` already applied. Caught by chasing a 3-row discrepancy
between what I predicted (233) and what the fill produced (230), rather than
accepting the near-match. **326 → 93 blanks; all 28 firewalled anchors filled.**

⚠️ **A FIGURE ON THE SHEET NAMED THE WRONG FILE.** It said 148 of 344 subjects
vote blank, measured off `unified_courses_data.js`. SkyView draws
`ccr_universe.json`, a different set, where it is 75. Same lesson this repo
already holds: *a figure is only wrong relative to the payload it names.*

⭐ **THE EDGE OVERRULES A REAL VOTE ON FOUR SUBJECTS, AND SAYS SO.** ETHN reads
Ethnic Studies against 34 identities filed under Chicano Studies; ESLN against a
malformed discipline name (`English as a Second Language Noncredit 53412`). All
four look like corrections, but a silent reassignment of 34 rows is not ours to
make quietly, so the row prints both.

### The banner, and an audience that took three passes

⚠️ **"NOT SIGNED IN" AND "ONLY THE TEAM TABLE" CANNOT BOTH HOLD.** Identity comes
from a credential; with none the server cannot tell a team member from anyone
else. The three passes, each wrong differently:

1. `is_allowed_reviewer() OR team_pass_ok()` — shipped, and **read under
   `using (true)` at first**, so all 2,801 college users would have seen a link
   into a working session.
2. `is_map_team()` alone — exact, and demanded a sign-in Sam did not want.
   ⚠️ Also: `is_allowed_reviewer()` is 10 people and **34 of the 42 team members
   are not in it**, so gating on it would have locked out most of the audience.
3. `is_map_team() OR team_pass_ok()` — the phrase is the trade. A shared secret,
   wider than the roster, far narrower than the public. **Writing stays
   `is_map_team()`**: a phrase holder may see the banner and never point it.

⚠️ **I FOUND THE WRONG TAB.** Asked where MAP Team Users lives, I came back with
MAP Users — the COLLEGE roster, 2,801 people. The MAP team is `team_members`
(42, org MAP) on **Team & RACI**. Sam corrected it. The two are easy to confuse
and the gate depended on which one you mean.

### Three CI cycles, one cause

⚠️ **`node tests/run.js` COVERS NO GENERATED FILE.** It passed 310/310 while the
docs catalogs and the dependency map were both stale. Each failure was the same
shape: a generator run BEFORE the last edit of the run, so what was committed
was already behind. `scripts/check_generated.sh` now runs all of them in one
command, meant as the LAST thing before a push.

⚠️ **AND THE SCRIPT ITSELF SHIPPED INCOMPLETE.** Written around the two
generators I had tripped over, it missed `cobi_admin_surface.js` — found by
`admin_tab.test.js` in a full suite run. It covers four now. A guard existing is
not a guard being complete.

⚠️ **THE REVERT HARNESS OVERWROTE ITS OWN BACKUP** (`cp file $GOOD` after an
earlier failed run had already reverted the file), so for two rounds the "good"
state under test was missing the fix. The suite caught it.

### Sam's question, answered mid-run

*"See the grouping for no discipline… does PSYC C1000 really not have the
discipline of Psychology?"* It has one, and the map is right that the payload does
not. Root cause, counts and the fix in
[`methodology-a-discipline-can-exist-in-the-repo-and-never-reach-the-payload`](kb-notes/methodology-a-discipline-can-exist-in-the-repo-and-never-reach-the-payload.md).

## 2026-09-08 · S243 (SkyGate) — a note that never printed, and one CSS line failing 38 tabs

Two defects of the same family: **a value was computed correctly and never
reached the reader.** One in SkyView's subject table, one in COBI's chrome.

### The disagreement note printed on none of the nine

S242 built the line that fires when the subject map overrules what a subject's
courses actually say, and recorded four disagreements. Both halves were wrong in
the same direction.

**It is nine, not four.** Measured against `prototype/ccr_universe.json` — the
payload the page draws — and `kb/reference/subject_discipline_map.json`, which is
the file `EDGE_URLS` actually fetches:

| SUBJ4 | the map says | its courses sit under | agreement |
|---|---|---|---|
| ATHL | Physical Education | Kinesiology | 1,101 of 1,101 |
| THTR | Theater Arts | Drama/Theater Arts | 1,093 of 1,109 |
| ESCI | Earth Science | Environmental Technologies | 465 of 476 |
| ELEC | Electronics | Electricity | 342 of 353 |
| MUSC | Music | Commercial Music | 127 of 134 |
| ETHN | Ethnic Studies | Chicano Studies | 34 of 35 |
| PHTO | Photography | Multimedia | 3 of 12 |
| ESLN | English as a Second Language | …Noncredit 53412 | 5 of 5 |
| ENVS | Environmental Technologies | Biological Sciences | 1 of 1 |

⭐ **AND ZERO OF THE NINE PRINTED.** `standingHtml()` built `via` and appended it
to ONE of its four exits — the branch for a subject that IS its home's Common
SUBJ. A subject whose courses sit elsewhere is by construction usually not that,
so it left by the umbrella exit or the not-its-code exit, and both dropped the
note; ATHL and THTR returned earlier still, at the no-seed-entry guard, which
also dropped it. **The lane file's "the row prints both" was false**, and so was
the code comment beside it. Fixed: the note rides every exit.

⚠️ **The count was wrong in the SAFE direction, which is why it survived.** Four
does not look like a bug; it looks like a small problem. And the one exit that
worked is the one anybody checking by hand would land on.

⚠️ **`tests/ccr_subject_standing_note.test.js` has one check per EXIT**, not per
message, because the wording was never wrong. Reverting the fix fails exactly
four of nine — the four exits — and leaves the wording checks green.
[`methodology-a-message-must-ride-every-exit`](kb-notes/methodology-a-message-must-ride-every-exit.md)

### The 93 blanks are not fillable, and the payload says so

Re-measured: 326 → 93 reproduces exactly (177 from the map, 56 from the
identifier reference). The 93 span **50 subject codes**, and I looked for a
second independent signal before proposing any value:

- **37 of the 50 have no other identity carrying that prefix at all.** Nothing
  to corroborate against.
- **6 more read "unanimous" off a single row.** ⚠️ **A unanimous vote of one is
  not a vote** — HUMN's one voter is *Music for Video Games and Film* (→ Music)
  while its three blanks are *Honors Introduction to Popular Culture* and two
  more popular-culture titles. Taking that reading files three humanities
  courses under Music.
- **5 carry real weight** — BSOT (369 identities, 99% Office Technologies),
  HUMA (112, 96%), GRAF (72), BCST (54), BARB (5) — **7 of the 93 rows**.
- HOSP is genuinely split four ways across 8 identities; its 5 blanks span
  hospitality law and baking.

DR-25 names Sam the owner of the map, so those five went on a decision sheet
rather than into the file: `docs/visuals/2026-09-08-the-subject-discipline-edge-nine-and-five.html`,
nine numbered calls. ⚠️ **The artifact carries no wake subscription** (the
service refused one for this session), so a later session must READ the replies
with the Artifact tool's `read_db` rather than expect to be woken.

### One CSS line was failing every COBI tab

`npm run a11y cobi` was 38/38 routes failing. The single fault common to all of
them was `input#cplfl-optout` at **182.1 × 19.9** against WCAG 2.2 SC 2.5.8's
24px floor — the First Light opt-out checkbox, and `first_light.js` paints on
every tab. ⚠️ **The floor belongs on the LABEL, not the input**: the engine
measures the hit area, and a wrapping label replaces its control's box, so
growing the 15px checkbox would have moved a number nothing reads.

With that and `p.tphx-intro` (3.24:1 on `--text-faint`, the decorative token,
on the one paragraph that says what a team phrase opens):

**Measured back-to-back, same machine: 38 of 38 routes failing → 19.** Two
declarations, nineteen tabs.

⚠️ **The remaining 19 are a real backlog, not a residue** — 71 distinct failing
selectors, 5,332 sub-24px target instances and 22 keyboard-unreachable scrollers
across the sweep. `our-process` is six faults from two tokens
(`--op-ink-faint` #6C8188 at 3.49:1, `--op-amber` #B9772A at 3.13:1 — both
reproduce exactly in `prototype/check_contrast.py`); `pipeline` is ten. Sized,
not fixed.

⚠️ **AND I CONTAMINATED MY OWN BEFORE/AFTER ONCE.** The first "after" sweep still
showed the fault at 390px, and the theory-first reading was a narrow-width CSS
override. There was none: my revert-verification `sed` had run *while the
background sweep was in flight*, so the 390px pass read the temporarily-reverted
file. A direct Playwright probe showed 24px at both widths in one command. Same
shape as S242's revert harness overwriting its own backup — **a background
measurement and a foreground edit of the same file cannot both be trusted.**

### Later the same day — Sam ruled all nine, and one of his notes found a hazard

All nine came back `yes`. Items 1–5 put five codes into the subject map (7 rows,
**93 → 86 blanks**); item 7 moved five map values to what the courses say
(**9 → 4 disagreements**). ⭐ **Every one of the five moved the map INTO agreement
with the CSR**, and three had named a discipline the CSR does not carry at all
("Theater Arts", "Physical Education") — so the vote was never the only signal.

⭐ **HIS ONE NOTE WAS THE MOST VALUABLE THING ON THE SHEET.** Against item 7:
*"The only one to double check is ATHL, which is in Kinesiology but is
differentiated from KINE which doesn't have the restrictions athletic PE or KIN
course."* Checked, and it names a real hazard: the CSR lists **ATHL as a variant
of Kinesiology with 1,468 M-IDs**, and the CSR's own `_about` says it is consumed
by the Phase 1e re-mint **to fold same-discipline SUBJ4 variants**. Session 47
caught that fold doing exactly this — its comment still reads *"folding …
Kinesiology's ATHL athletics rows into KINE (bursting the KINE M1### 999-seq
capacity)"* — and fixed it with a literal, `{"Kinesiology": {"KINE","ATHL"}}`,
inside `load_umbrella_allowances()`.

So ATHL was safe. ⚠️ **But it was the only one of the four umbrella disciplines
whose protection was a literal rather than data** — Foreign Languages and both
Agriculture disciplines declare `is_umbrella` + `umbrella_codes` in the CSR, which
the reseeder and the Supabase sync both preserve. Declared now, so the protection
is readable by everything that reads the CSR, and SkyView's row says *an umbrella
code under Kinesiology* instead of *not Kinesiology's code* — which is the
distinction he was drawing.

⚠️ **AND ITEM 8'S PREMISE WAS WRONG IN MY OWN SHEET.** I wrote that ESLN's
discipline name was malformed and the trailing number was a TOP code. It is
neither: **`English as a Second Language Noncredit 53412` is in the MQ discipline
list**, and so are seven more carrying `53412` or `53414` — Title 5 section
numbers the 19th-edition index prints beside those titles. The tell is
`Speech Language Pathology: Disabled Student Programs and 53414 Services`, where
the number splits the phrase; no official title reads that way. So Sam's ruling
(a data defect, repair at source) is right and the source is our own PDF
extraction — but it is **eight names, 1,183 occurrences across 33 files**
including `coci_minted_courses.json` and four alias maps, not the 5-row string fix
the sheet described. Held for its own PR with a dry-run and a receipt.
**A sheet item can be ruled correctly and still have described the wrong size.**

## 2026-09-09 — Session 244 (SkyExit): Sam's five, and three ways a correct-looking change does nothing

Five asks in one message, all shipped. What they had in common is worth more than
any one of them: **three of the five most valuable findings this run were a cache
or a more specific rule quietly winning, where the code read correctly and did
nothing.**

### The five

1. **Rotation** — `SPIN` 0.045 → 0.018 rad/s, one turn in ~350 s instead of ~140.
   One constant; the per-projection rate scales it, so every projection slows
   together.
2. **A dropped course parks.** It snapped back because a member has **no position
   of its own** — `drawMembers` puts it on a spoke of its parent's ring at an
   angle derived from its index, so releasing the carry redrew it where it began.
   That also rules out the obvious fix: a screen coordinate would be walked away
   from by pan, zoom and the turn within seconds. It is stored in the **world
   frame islands already use** for `dx`/`dy`.
3. **Level proximity** — measured first, and the measurement shaped it. Only
   **12%** of 49,896 points carry a level word (2,565 beginning · 1,400
   intermediate · 2,173 advanced), though 119 of 159 islands hold ≥3. So level
   orders **within a ring** the match score already chose, as a STABLE sort:
   same-level pairs ended **19.9% closer** (15.54 → 12.44) over the same 1,990
   pairs, with the point count and bounds unchanged as the proof nothing moved
   that should not have.
4. **CTE vs academic** — 25,857 · 16,470 · **7,569 with no verdict**, and the
   third of those got its own switch.
5. **Isolate**, which is where the interesting bug was.

### ⭐ Three shapes of "correct code that does nothing"

**A memo keyed on the wrong thing.** `islandPass` caches its per-island count on
`showSig()`, a signature of the Show switches. Isolation changes which points
pass **without touching a switch**, so every island served a stale count and the
map did not change at all. The predicate was right; the cache never asked it.
Reverting the signature reproduces it exactly — `shown=3 of 3`.

**A more specific rule.** `.cpl-tab {color:#666}` was corrected during the dark
sweep and the report still said 1.74:1 on all 38 tabs, because
`.cpl-sidebar .cpl-tab {color:#444}` is what actually paints the rail. **Fixing
the rule you found is not fixing the rule that applies** — grep for every rule
setting the property, and prefer the most specific.

**A test asserting a sentence.** `(12) a drop on empty ground moves nothing and
says so` checked the HINT STRING. A hint-only assertion passes against the
snap-back it was supposed to describe, so the replacement asserts the course is
parked in **state the drawing reads**.

### ⚠️ And two bugs in my own sweep, both caught by re-reading the diff

Splitting `--seal-blue` into a text grade meant rewriting call sites. `color:`
also ends `border-color:`, so the first pass rewrote **20 border declarations**
into the text grade; and text on an explicit fill (the mustard alpha chip,
`background:#fff` cells) is not text on the ground — the on-dark grade reads
1.9–2.4:1 there. **A hit count above your estimate is a bug in the pattern, not a
windfall.** Both reverted; the final sweep is 15 sites, each checked for what it
sits on.

### The order-of-work tool that came out of it

The dark sweep opened at 38/38 routes and 511 findings, of which ~227 were six
shared-chrome selectors. `scripts/a11y_triage.js` now groups a saved report by
selector and ranks by blast radius; run against that same report it reproduces
all six in the right order in a second, against the two manual re-reads it
actually cost. See [`/a11y-pass`](../.claude/commands/a11y-pass.md).

---

## 2026-09-09 — S247 (SkyLedger): the phone, the pinch, and a question that moves the map

Sam's three asks on SkyView in one message: the header toolbar "now takes up half
the screen", pinch does not zoom on mobile, and the search box should take
questions "like Sierra handles". Shipped as PR #1530 (`6148982`).

### The number was not the number

He said half the screen. Measured in Chromium at 390×844 before building:
`#u-top` was **254px over four wrapped rows — 30%** of the viewport, and
`.u-foot` another **430px**, *more than the header*. So the honest figure was
**81% of a screenful is not the map**, and his "half" was low, not high.

⭐ **AND THE HEADER WAS ONLY HALF THE PROBLEM.** `fitCanvas()` tested
`window.innerWidth<700` BEFORE the solo test, so on a phone the canvas took
`0.62 × innerHeight` — 523px at 844, which is exactly the canvas that was there.
**Shrinking the row could not have helped: the freed pixels had nowhere to go.**
This is the shape worth remembering — a visible symptom with two independent
causes, where fixing the obvious one alone produces a smaller header and the same
map. The fix is swapping two `else if` branches.

⭐ **AND THE HEIGHT WENT STALE ANYWAY.** With both fixed, the canvas still opened
at 451px: `fitCanvas` had run while the row was still 393px tall (before the
page's search form was borrowed into its slot) and nothing re-ran it. Dispatching
one `resize` corrected it to 730px — which is the proof that **the arithmetic was
right and only the timing was wrong**. The resize listener could never have
caught it, because a phone's window does not resize. A `ResizeObserver` on
`#u-top` / `#u-foot` / `#u-face-line` is the fix, and unlike a one-shot `rAF` it
also covers the row wrapping at a breakpoint and a font landing late.

### The rail Sam proposed, and why it was refused

He asked whether the row might become a floating vertical rail down the left
edge. Refused, and the argument is geometric rather than aesthetic: a rail is
~48px of a 390px canvas, and *Rotate · Pan · Move · Articulations · Isolate* do
not stack in a 48px column — **a rail settles the plain-words rule by shape
before anyone gets to argue it**. It also reverses his own 2026-09-03 ruling that
nothing floats over the map. The answer was a horizontal row that folds behind
one word, which he approved.

⚠️ **The breakpoint moved 900 → 1100 mid-build, on a measurement.** The plan
said 900 so an iPad landscape kept its full row. Measured at 1024: a **three-line
186px header** — the wrapped zone, not the comfortable one. 1100 is where the
stylesheet already gives up `flex-wrap:nowrap`, so above it the row fits one line
and below it the row was wrapping. **The plan was wrong about which state a
tablet was in.**

### Two fingers were worse than no fingers

A 5× two-finger spread left the zoom readout on "188° across" for all eight
frames. `touch-action:none` turns the browser's own pinch off, nothing read a
second pointer, and `pointerdown` set `drag` unconditionally — so the second
finger replaced the first one's grab and **both fed the same pan**. Two fingers
did not zoom; they fought over the turn. Fixed with a `pts` registry keyed by
`pointerId`, a ratio against the LAST span (not the first — fingers keep moving
after the zoom clamps, and an absolute ratio banks that travel and springs back),
and `pointercancel`, without which a touch the OS takes away is a phantom finger
for the life of the page.

### The ask: translate, do not answer

⭐ **The reason is correctness, not taste.** `cpl-chat` retrieves from the
knowledge base; the knowledge base does not contain SkyView's payload (16,482
identities, 33,423 stand-alone courses, 159 islands). *"Which welding identities
carry no articulation?"* is a question retrieval **structurally cannot answer**,
and a prose surface would answer it anyway, fluently, from the wrong corpus. So
the model returns a SELECTION in the token grammar the map already speaks, and
the page does the counting. Sierra stays where she is.

⚠️ **A surface must be declared in five places, and the repo's guards found every
one I missed.** `KNOWN_SURFACES` → `sierra_surface` went red on the SQL CHECK
constraint; then `sierra_training_surface` on the curator's picker; then
`sierra_memory_isolation` on the vetted-owner map. Three suites, in turn, each
naming the next. **That is the system working**, and it is worth saying plainly
because the alternative failure is silent: an undeclared surface normalizes to
null and takes the 1,000-character chat cap, truncating the contract into a
grammatical fragment.

### Three defects the tests found that a reading would not have

⭐ **The affordance was invisible exactly when it mattered.** A question matches
no course title, so `openSug()` hid the list — and the footer that says "Enter
asks" hid with it. The ask was unreachable at the moment it became available.
Check (14) looked for the label and found no list at all.

⭐ **The footer disagreed with the key.** It required `!pendKeys.length`, but a
seeded key the reader never touched is inert in `pendingEdit()`, so Enter fell
through and asked while the footer read "1 selected". The condition is now
literally the same test `commitPending()` makes.

⭐ **A guard of mine could not fail.** `setIsolate(res.isolate===true &&
tokens.length>0)` sits after an early return that has already proved the
selection non-empty, so the second half is unreachable-false. Removed rather than
left implying a case that cannot happen — and the test now records what it really
covers. ⚠️ **This is handoff 247's lesson recurring within a day**, which is why
the falsification pass is now written down per check: revert each line, re-run,
and record which check went red. Two checks in the pinch suite survive either
single revert because the selection guard is deliberately doubled; that is stated
in the suite header rather than discovered later as a hole.

### Two harness gaps, both wider than this lane

⚠️ **`scripts/a11y.js` reported every DISABLED control as "focusable with no
ring".** `el.focus()` is a no-op on them, so they can never show one — the same
shape as the closed-`<details>` case handled ten lines above it. SkyView's
Isolate button (disabled until something is selected, by design) was a standing
red on five routes that no CSS could clear. **Confirmed pre-existing by running
the sweep against the stashed, unmodified prototype** before touching it — worth
the two minutes, because "is this mine?" is the question the branch policy makes
you answer before standing down. The fix reaches every view.

⚠️ **The dependency map records LINE NUMBERS, and `npm test` does not check it.**
Adding ~180 lines to `ccr_universe.js` shifted every mapped entry below them and
turned CI red on a locally-green suite. The check is
`python3 kb/_build_dependency_map.py --check`.

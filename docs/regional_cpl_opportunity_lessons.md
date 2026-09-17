---
title: Regional CPL opportunity (region occupations × colleges) — lessons
date: 2026-09-16
tags: [lessons, crosswalk, regional, occupations, colleges, cpl, coe, swp, handout]
artifacts:
  - kb/_build_regional_cpl_opportunity.py
  - kb/reference/coe_occupation_demand_2024_2029.json
  - kb/reference/bay_region_coe_demand_2024_2029.json
  - kb/regional_cpl_out/
related:
  - "[[CLAUDE]]"
  - "[[docs/delta_college_crosswalk_lessons]]"
  - "[[docs/partner_crosswalk_lessons]]"
  - "[[docs/statewide_fire_electrical_crosswalk_lessons]]"
---

# Regional CPL opportunity — lessons

Workstream scratchpad. Append a dated section every checkpoint.

---

## 2026-09-16 — the fifth instrument, and a matcher that flatters itself

### What prompted it

Sam, with **Ashley and Sigrid** in the room: scale the Delta prototype so any
college, district or Strong Workforce region can be pulled up in a regional
meeting and shown what CPL it could create or adopt.

### What we learned

**1. ⭐ TWO THIRDS OF THE ASK WAS ALREADY BUILT.** `college_briefing.js` ships a
scope-first picker with five scopes — college, district and statewide live, SWP
and ASCCC disabled with their reason. Reading the code before designing turned a
new tab into an extension.

**2. ⭐ A SHARED TOKEN IS NOT A MATCH, AND THE COUNT TELLS YOU SO.** The first
matcher returned **233** "adopt now" rows for Santa Rosa against Delta's 42 for a
comparable list. That ratio was the bug report. Requiring the shared tokens to
COVER half the occupation title cut it to 24 and killed *Medical Assisting for
Diagnostic Medical Sonographers*. ⚠️ Rarity alone is not enough: on a 150-row
program corpus a 2% threshold makes *medical* and *manufacturing* "rare" while
they carry almost no meaning.

**3. ⚠️ SOC TITLES USE "EXCEPT" AS A NEGATION.** *Dispatchers, Except Police,
Fire, and Ambulance* matched a police academy, because tokenizing the whole
string inverts the title's meaning. `clean_title()` strips `except …` and
`, all other` clauses before anything else happens.

**4. ⚠️ EXCEL MANGLES SOC CODES, LOSSILY.** The Bay-only export arrived with 8
Management codes date-parsed: `11-3071` renders as `Nov-71`. **The mangling is
not invertible** — 11-3071, 11-9071 and 11-9171 all render `Nov-71` — so repair
keys on Description, which is unique. Only SOC major group 11 is affected; 13+
exceeds 12 and was never date-parsed. The full statewide export Sam supplied is
clean, and supersedes it.

**5. ⭐ RAW DEMAND IS THE WRONG SORT KEY.** Ranked by openings the Bay list leads
with Home Health Aides, Fast Food, Cashiers and Waiters — volume with no
credential to award against. The CPL-relevant band (training beyond high school,
below a bachelor's) is **104 of 541 occupations and 47,520 of 419,820 annual
openings**. Same shape as the Delta run's degenerate coverage ranking.

**6. ⭐ THE BAY'S CPL SHAPE IS NOT SAN JOAQUIN'S.** Only **17 of 139** existing
occupation rulings match the Bay list by exact title, and all 17 are electrical
or mechanical — SJCOE's list was an IBEW and utility apprenticeship roster. The
Bay's top CPL-relevant demand is health care, early childhood and transportation.
Occupation→credential rulings do not travel between regions for free.

**7. ⭐ THE CURATOR IS IN THE ROOM.** A regional meeting reframes the judgment
problem: college staff are present and reject a bad match on sight. The tool's
job is a short checkable list with its evidence attached, which is why every row
carries the program, course and exhibit that produced it.

**8. ⚠️ A LOGO BUILT FOR A DARK HEADER DISAPPEARS ON PAPER.** The CPL Initiative
logo ships white-on-transparent for Sierra. Recolored to seal blue at full alpha
for the printable handout; the CCCCO seal needed its white box made transparent.

### Sam's rulings this run

- **"Single pick is fine"** — My College tab, single pick as the default.
- **No "it's this, not that."** *"Just make positive, active voice
  declarations."* Recorded in `CLAUDE.md`'s house-voice section, which had been
  instructing the opposite reflex.
- **Mannerly language and asides** apply to session replies, restated.
- Keep it plain: Sigrid was in the room and the jargon was excluding her.

### State

- `kb/_build_regional_cpl_opportunity.py` — workbook, screen page, print handout.
- `kb/reference/coe_occupation_demand_2024_2029.json` — 4,869 rows, nine regions.
- Matcher is roughly half right and NOT shippable.

### Next

1. Tune the matcher offline against Delta's 139 human rulings as a test set.
2. Port into the My College tab behind the existing picker.
3. `cpl_occupation_match` verdict queue — Governance first, per Rule 10(a3).
4. The college-to-region roster, which is Sam's to supply.

## 2026-09-16 (later) — the external credential registry, and a second matcher defect

Sam, Ashley and Sigrid were still in the meeting when Sam asked whether this
session could reach the Credential Registry. It cannot: `credentialfinder.org`
and `credentialengineregistry.org` are both refused by the network egress
policy, measured with curl and with WebFetch. He captured the pages himself and
passed them through Drive and the session upload, four of them in about forty
minutes.

### What a blocked domain costs, and what it does not

The instinct on a blocked domain is to report the block and stop. The better
move is to say precisely what a human capture would have to contain to be
useful, because a person with a browser is a working channel and they will
usually take one more step than you expect. Naming the four columns — credential
name, issuer, occupation code, CTID — is what turned "I can't reach it" into
four PDFs.

The corrected record matters too. Earlier in this session I said collection 151
was "almost certainly ours," meaning California's. It is the National
Certification Collection, owned by Credential Engine OPEN. Sam found the actual
California collection himself, and it is the better one.

### Capture methods are not equivalent, and the difference is large

Three methods, measured against Sam's own captures:

| Method | Reach |
|---|---|
| Browser save of the scrolled collection page | ~500 members, provider in rendered prose |
| The site's Print button, list not yet loaded | 8 members |
| The site's Print button, list loaded | ~490 members in LABELED fields |
| The site's Print button, on a credential detail page | that one credential's full record |

The loaded-list print is the best of them: `resource Name` / `resource Type` /
`provider` / `description` parse without a heuristic, where the rendered-prose
capture needed a provider vocabulary built from its own clean rows and still
left 53 rows on a word-count fallback.

The finding that makes hand capture tractable: **two captures of the same
collection overlapped on 15 rows out of roughly 490 each.** The list does not
return a stable window, so repeating the print accumulates coverage rather than
re-reading the same page. Two passes reached 974 of 6,738.

### No occupation code exists at any level

The list view, the collection print and the detail print all omit
`ceterms:occupationType`, the O\*NET-SOC code and the CIP code. That was the one
field that would have made the join exact against the 541 SOC-coded COE
occupations, and it is absent everywhere a human capture can reach.

What the detail print carries instead is better for CPL than a job code: 73 Task
statements, each with its own CTID, plus Knowledge and Skill statements. Faculty
award credit by comparing what a person can do against course outcomes, and a
task list is written in those terms. A SOC code never is. This is the same
substrate the parked Phase 4 (SLO ingestion) wants.

### California is the higher-value collection, and it is complete

369 licenses, every member, with the issuing state agency. California license
titles track occupational titles, so they join to the COE occupations by name
far better than "IBM Certified Solution Developer" ever will, and they are the
credentials a California student actually holds.

Measured join: 73 of 541 occupations matched, 115 pairs, 13%. Heating, Air
Conditioning and Refrigeration Mechanics reaches the Warm-Air Heating,
Ventilating and Air-Conditioning Contractor license cleanly.

### The join exposed a second matcher defect

`stem()` strips the agent suffixes `-er` and `-or` on any token past four
characters. **engineer** reduces to **engine**; **actor** reduces to **act**.
Eight false pairs rest on the first collision (Bus and Truck Mechanics and
Diesel Engine Specialists against *Engineer In Training*) and one on the second
(Actors against the *California Residential Mortgage Lending Act*).

This is the same family as the single-shared-token errors Sam caught earlier the
same day, and it is worth stating the general shape: **a stemmer that maps two
different words onto one token manufactures agreement that the coverage rule
then certifies.** Coverage cannot rescue it, because the collapsed token is a
genuine member of both sets by the time coverage is computed.

The plural suffixes are safe — `electricians` to `electrician` merges two forms
of one word. The agent suffixes are not, because English uses `-er` and `-or`
both to derive an agent and as ordinary word endings. The fix is measurable
rather than hand-listed: protect a token whose stem is itself a literal token
somewhere in either corpus.

Left unfixed deliberately. The same matcher drives the regional opportunity
build, whose output Sam has already reviewed, so the change gets its own run and
a look at what moves rather than riding along inside a reference-data commit.

### Sam's framing, which is the reason any of this matters

> "We've never had a table of active certificates and licenses--which is why I'm
> hyped about this:)"
>
> "Other than what we've catalogued in MAP"

MAP's 2,948 exhibits answer what the colleges have written down. A registry of
active licenses answers what a student already holds, and it grows whether or
not a college does the work. Joining the two is the interesting move: a license
with no matching MAP exhibit is an exhibit opportunity, stated in terms a
college already understands.

Captured in full at
`CPLBrain/03-professional/braindumps/braindump-2026-09-16-1420-never-had-a-table-of-active-certificates-and-licenses.md`.

## 2026-09-16 (third) — the matcher gets a score, and two fixes get rejected by it

Sam: *"yes, fix the stemmer and score it against Delta's rulings."* Both
happened, and the scoring is what made the session worth it: **two plausible
fixes were measured and thrown away**, and neither would have looked wrong in
review.

### The score, and what it says

`kb/_score_occupation_matcher.py` runs the matcher against the 139 occupations a
human ruled on in `kb/delta_offering_map.json` — 52 confirmed, 38 potential, 49
none. Two metrics, because the obvious one is not the useful one:

- **Pair level** — of the occupation-to-program pairs proposed, how many the
  human also named. Precision 0.47, recall 0.124. Harsh by construction: a human
  names the programs that best answer the question, not every program whose title
  overlaps.
- **Decision level** — for each occupation, does the tool agree with the human
  about whether this college has anything at all. **Precision 0.907, recall 0.51,
  accuracy 0.626.**

The decision number is the one to quote, because it is what the page renders. In
plain terms: **when the tool says a college has something, it is right about nine
times in ten, and it finds about half of what a human finds.** That is the right
failure shape for a page a college reads — a wrong row wastes a meeting, a missing
row is something a person in the room can still add.

### Fix one, rejected: "protect the strip when the bare word is also in play"

The stemmer strips `-er`/`-or` past four characters, so `engineer` became
`engine` and `actors` became `act`. The first rule written for it was general and
measured-sounding: if stripping an agent suffix lands on a token that is itself
present in either title, the two are different words, so leave it alone.

It removed both bad pairs. It also cost Santa Rosa three correct rows:

| Occupation | Program it stopped reaching |
|---|---|
| Roofers | Basic Roof Framing |
| Floral Designers | Floral Design |
| Data Entry Keyers | 10-Key Data Entry |

The rule had it exactly backwards. For a **true** agent noun — roofer, designer,
keyer — the bare word being present is precisely when the merge is right. What
separates `engineer` and `actor` is not a condition you can test at comparison
time: an engineer is not "one who engines," and the *act* an actor performs is not
the *Act* a legislature passes. Those are facts about English, not about the pair.

The rule that shipped names **forbidden landing points** instead — a two-member
set, each earned by a counted false pair. A strip onto one falls through to the
next suffix, so the plural strip survives: `engineers → engineer`,
`actors → actor`. Two spellings of one occupation still reach each other, and
neither reaches `engine` or `act`. The three regressions are now test cases in
`tests/occupation_matcher_stemming_test.py`, so the appealing wrong rule cannot
come back green.

### The fix exposed a homograph the bug had been hiding

With `engineers` reducing to `engineer` instead of `engine`, Santa Rosa gained
five rows pairing **Locomotive**, **Ship**, **Rail Yard**, **Stationary** and
**Operating Engineers** with its **Engineering** program. None of them is an
engineer in the academic sense. Santa Rosa moved 58 → 63 adopt rows, and four of
those five are wrong.

Worth stating plainly: **the bug had been suppressing a second bug.** Mangling
the token to `engine` kept the homograph from ever matching. Fixing the stemmer
did not create the homograph problem, it revealed it, and the count got worse on
the way to being right.

### Fix two, rejected: gate the single-token path on rarity

The remaining errors all come from one path — a single shared token counts as a
match when it is the whole of one side, which is what lets *Paralegals and Legal
Assistants* reach *Paralegal Studies*. "Engineering" is a whole title that reduces
to one token, so it collects every kind of Engineer.

`Matcher` already carries a measured rarity test, unused in the current path, and
gating on it looked principled: `paralegal` and `barber` are rare in a college's
catalog, `engineer` recurs. It fails twice.

It did not even fix the target — at 220 programs the 2% floor still calls
`engineer` rare. And it cost real rows:

| Occupation | Lost |
|---|---|
| Welders, Cutters, Solderers, and Brazers | Welding |
| Automotive Body and Related Repairers | Auto Body |
| Nursing Assistants | Nursing |

Delta's decision F1 fell 0.653 → 0.630.

The reason is worth keeping: **rarity runs backwards here.** A college with
several welding programs serves welders *more*, not less. Frequency in a catalog
measures institutional investment, and this rule needed it to measure ambiguity.
Those are different things that happen to be numbers.

Reverted, with the finding kept as a comment in the code so the next session does
not retry it blind.

### What the score says to do next

The misses are not threshold problems. *Application developer* against *Computer
Programming*, *ambulatory coder* against *Medical Office Assistant* — these share
no token at all, so no threshold reaches them. **The recall ceiling is
vocabulary.** Closing it needs a synonym layer, or the curated
`kb/occupation_credential_map.json` that already holds the human rulings.

Which is the argument for keeping the curated map. It was starting to look like
scaffolding the generic matcher would replace. The score says it is the part that
carries the meaning.

## 2026-09-17 (S267, SkyQuarry) — the register reaches the tab, and three things that had quietly disagreed

Sam opened the session asking whether S266's crosswalk work could be finished
for Sigrid's meeting with the Bay Area Strong Workforce consortium the next day,
and said he thought it "went a bit off the rails and got confused with the
session SkyPublius was handling at the same time."

**The confusion was real, and it was not cross-contamination.** The two branches
shared no code. What had happened is narrower and more interesting: S266 solved
a prerequisite late in its own run and never told the things it had written
earlier that day.

### Three statements about one fact, all dated 2026-09-16

- `identity_rows()`: *"IT CARRIES NO REGION FIELD OF ANY KIND — checked
  2026-09-16… Do not substitute the ~10-way `college_geo.region` proximity
  scheme."*
- `--region`'s help: *"NOT a Strong Workforce consortium — that roster does not
  exist in this repo yet."*
- `kb/reference/swp_region_map.json`, same day: the roster derived from county,
  **applied** to `map_colleges.swp_region`, Bay Area resolving to 28 colleges
  across 12 counties and corroborated against the Bay Region COE's own
  description of itself.

⚠️ **AND `select_colleges()` PERFORMED THE SUBSTITUTION ITS NEIGHBOUR'S
DOCSTRING FORBADE.** Measured: `--region "Bay Area"` returns **23** where the
consortium has **28**, dropping Berkeley City, Cabrillo, Cañada, Hartnell and
Monterey Peninsula — the last three because Strong Workforce puts Monterey,
Santa Cruz and San Benito counties in the Bay and the proximity scheme puts them
in Central Coast. Nothing on the page said five member colleges were missing.

Had the run gone ahead as the branch stood, Sigrid would have shown a
consortium a page silently missing five of its members. Note:
[`methodology-a-solved-prerequisite-does-not-notify-its-consumers`](kb-notes/methodology-a-solved-prerequisite-does-not-notify-its-consumers.md).

### What was actually missing was the tab, and the lane file said so

The branch changed **zero `.js` and zero `.html` files**. The lane's own "Next"
listed *"② port into the My College tab"* as queued behind matcher work. Sam's
answer settled the shape: *"I want her to be able to pick any college in the
meeting and showcase their options. She needs to be able to flip through to
other colleges as well. The tab is needed."* Then: *"We have a good prototype
with the delta college html that Ashley worked on--not the excel worksheet."*

⭐ **THE PICKER ALREADY EXISTED.** The My College tab's `college` scope ships
`ready: true` and selects any college, so live flipping needed no scope work at
all — only content. Reading the tab before designing for it removed most of the
job.

⭐ **PRECOMPUTE, BECAUSE A ROOM CANNOT WAIT ON A MATCHER.** 28 colleges took
6m30s to build. `kb/_emit_regional_opps_data.py` turns a run receipt into a
lazy-loaded data file (6,903 rows, 1,223 adopt-now, 2.8MB), so the first college
costs a fetch and every college after it costs nothing.

### Ashley's Delta page is curated; the register is matched; they paint alike

The Delta prototype is good because a human ruled all 139 occupations for Delta.
No other Bay college has an offering map. ⚠️ **A matched row and a ruled row are
indistinguishable on screen**, which is the S265 lesson in another costume — the
card that lied was the only one that looked normal. Hence the caveat above the
rows, the matched term printed on every row, and the transfer sentence below.
Note: [`methodology-a-score-measured-in-one-population-is-not-a-score-in-another`](kb-notes/methodology-a-score-measured-in-one-population-is-not-a-score-in-another.md).

### Four failures worth keeping

⚠️ **A 14-MINUTE BUILD WROTE NOTHING.** `write_workbook` ran FIRST and needs
`openpyxl`; without it the run raised before the page, handout and receipt —
none of which need it. The tip-of-branch commit had moved the import *inside*
the function "so the generator is importable without it", which made the module
importable and left the run just as fatal. Note:
[`methodology-write-the-dependency-free-output-first`](kb-notes/methodology-write-the-dependency-free-output-first.md).

⚠️ **A CLOSED DRAWER WITH A BLANK SUMMARY READS AS BROKEN.** `sec()` drops the
value span when the summary is empty, and the register returned `""` in two of
its five states. Caught by `college_briefing.test.js` (P), which only ever
exercises the no-college case — so `oppsSummaryFor` is pure now and the
register's own test walks all five.

⚠️ **THE DEPENDENCY MAP RECORDS LINE NUMBERS.** It was rebuilt, then three later
commits shifted code in `college_briefing.js` and pushed four reads down 26
lines each, turning CI red with no dataset changed. *"Rebuild it genuinely
last"* means after the last edit to any file it maps.

⚠️ **THE DOC BUDGET IS UTF-8 BYTES, NOT CHARACTERS.** Trimming the lane file by
`len(str)` read 11,966 against a 12,000 budget while the auditor read 12,168 —
these files are dense with ⚠️ and ⭐, six and three bytes each. Measure with
`len(s.encode("utf-8"))`.

### Instruments to check a claim with

**Bisect the branch's own contradictions before believing its narrative.** Every
finding above came from comparing the branch against itself — a docstring
against the function below it, a committed roster against the flag that ignored
it, a lane file's "Next" against its diff. The handoff read coherently; the code
did not agree with it.

**A superseded `head_sha` is the normal case.** A `check_suite.completed` wake
named `b5a3bdf` while the head was `90d7f9e`, and #1576 merged to main mid-CI,
turning this PR dirty. Re-read the current head every time.

**Merge-commit against squash is an add/add conflict on files nobody
disagreed about.** #1576 landed on main as a squash while this branch carried it
as a merge. Resolution was mechanical once that was understood: verify main's
copy is byte-identical to the pre-fix original, then take ours as the superset.

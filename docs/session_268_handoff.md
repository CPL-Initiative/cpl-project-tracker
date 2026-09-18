---
title: Session 268 handoff — the register reached the tab, and the roster that was solved but unwired
date: 2026-09-17
session: 267 (SkyQuarry)
tags: [handoff, partner-crosswalks, regional-cpl-opportunity, my-college, matcher]
status: current
superseded: true
superseded_by: session_274_handoff.md
---

# You are Session 268

Your moniker is **SkyBridge** — this lane's whole job is carrying a student's
credential across to a college's course, and S267 carried the instrument across
to the tab people actually open.

⚠️ **THE TWO LINEAGES HAVE CONVERGED.** 266 was the crosswalk branch, 267 the
funding one. Both are on `main` now (#1576 then #1591) and this handoff is the
single continuation. Numbering is plain again: 268 is next, no parallel lane.

Read in order:
[`lanes/partner-crosswalks.md`](reference/lanes/partner-crosswalks.md) ·
[`regional_cpl_opportunity_lessons.md`](regional_cpl_opportunity_lessons.md)
(the 2026-09-17 section) · the three KB notes below · PR #1591.

## What shipped

- ⭐ **#1591 — THE OCCUPATION OPPORTUNITY REGISTER IS IN THE MY COLLEGE TAB.**
  Built for **Sigrid's Bay Area Strong Workforce consortium meeting on
  2026-09-18**: pick any college, read what it could already give credit for,
  flip to the next. Ashley's Cal-JAC layout ported. **28 colleges, 6,903 rows,
  1,223 adopt-now**, lazy-loaded on first open of the section.
  ⭐ **The picker already existed** — the tab's `college` scope ships
  `ready: true`, so live flipping needed content, not scope work.
- ⭐ **`--region` WAS SILENTLY DROPPING 5 OF THE 28 CONSORTIUM COLLEGES.** It
  resolved against the fire/electrical proximity macro-region (23 in "Bay
  Area"), missing Berkeley City, Cabrillo, Cañada, Hartnell and Monterey
  Peninsula. `identity_rows()`'s docstring forbade that substitution while
  `select_colleges()` performed it, and the docstring's premise stopped being
  true the same day it was written. `--swp-region` now reads the resolved
  roster at `kb/reference/swp_region_roster.json` (117 colleges, 9 regions).
- **The generator wrote its `openpyxl`-dependent output FIRST**, so a machine
  without the library discarded the whole run — a 14-minute build here. Fixed.

## ⚠️ Sam's decisions this run — do not re-litigate

1. **The tab was required, not a handout.** *"I want her to be able to pick any
   college in the meeting and showcase their options… The tab is needed."*
2. **Ashley's Delta HTML is the design**, explicitly *"not the excel worksheet."*
3. **Bay Area only for now** — statewide generation was offered and declined.
4. **Standing (2026-09-16): known gaps are acceptable when disclosed.** The
   caveat is the mechanism; do not hold a view for a better matcher.

## The priority workstream

**The matcher's recall ceiling is VOCABULARY, and thresholds are exhausted.**
*Application developer* → Computer Programming and *ambulatory coder* →
Medical Office Assistant share no token, so nothing threshold-shaped reaches
them. Closing it needs a synonym layer or the curated
`kb/occupation_credential_map.json`. Two plausible fixes are **measured and
rejected** — read them in the code before trying anything: protecting the agent
strip, and gating the single-token path on `rare()`.

⚠️ **The register is MATCHED, not ruled, and the two paint identically.** The
caveat above the rows, the matched term on every row, and the transfer sentence
are all load-bearing. The measured numbers live inside the data file so a
re-score and a re-emit move together — **re-run
`kb/_score_occupation_matcher.py` and re-emit in the same commit.**

## Carryover

| Item | State |
|---|---|
| Matcher vocabulary gap | **next** — synonym layer or the curated map |
| The Engineering homograph | open — 4 wrong Santa Rosa rows, wants a sense distinction |
| California licenses as a handout column | queued; Sam has seen the shape |
| `cpl_occupation_match` verdict queue | **Rule 10(a3) — Governance first** |
| ASCCC (Academic Senate) areas | **NEEDS SAM** — no Supabase column carries them |
| Credential Engine API | **Sam + Malone own it.** Not yours |
| Statewide register (beyond the Bay) | offered, declined for now; ~1h of background generation, no design change |
| Origination cutover asymmetry | unchanged — NC lands automatically, credit side holds PENDING |
| Carried: `Counselor_Verified` in the daily fetch; 51 guessed column offsets in `excel_to_dashboard.py`; SkyView ⑩/⑪; COBI contrast 17 of 38 | open |

⚠️ **Budgets:** `roadmap_archive.md` 4.34× · `cpl_funding_lessons_archive.md`
1.92× · `exhibit_canonicalization_lessons.md` 1.26× · `lanes/cobi-dark-mode.md`
1.54× · `lanes/implementation-funding.md` 1.53× · `CLAUDE.md` at **1.01×**, so
anything added there must displace something. `lanes/partner-crosswalks.md` was
compacted back under budget this run.

## Patterns that worked

- **Bisect a branch against itself before believing its narrative.** Every
  finding came from comparing the branch to its own artifacts — a docstring
  against the function below it, a committed roster against the flag ignoring
  it, a lane's "Next" against its diff. The handoff read coherently; the code
  disagreed with it.
- **Read the consuming surface before designing for it.** The scope picker
  already did the hard part.
- **Regenerate the prototype and look at it.** Ashley's Delta page rebuilt in
  one command, which is what made the port a port rather than a guess.

## ⚠️ Safety patterns to honor

- **Measure doc budgets in UTF-8 BYTES** — `len(s.encode("utf-8"))`. These files
  are dense with ⚠️ and ⭐ (6 and 3 bytes); character counts read ~2% low.
- **The dependency map records LINE NUMBERS**, so it goes stale on any line
  shift in a file it maps. Rebuild it after the last edit, genuinely.
- **`check_floor.json`: hand-add one entry from an ISOLATED run.** Its own note
  warns six times that an interrupted or contended re-baseline has written a
  LOWER floor before. Write it at `indent=2` or the diff is unreadable.
- **A `check_suite.completed` wake routinely names a SUPERSEDED `head_sha`** —
  re-read `get_check_runs` on the current head, every time.
- **A squash on `main` against a merge commit on your branch is an add/add
  conflict** on files neither side disagreed about. Verify byte-identity, then
  take the superset.
- Rule 4 (both HTMLs) · Rule 5 (never force-push `main`) · Rule 10 (Supabase
  only through MCP) · `test` green on the CURRENT head before every merge · MAP
  read-only · the public KB untouched.

## KB notes added this run

- `methodology-a-solved-prerequisite-does-not-notify-its-consumers`
- `methodology-a-score-measured-in-one-population-is-not-a-score-in-another`
- `methodology-write-the-dependency-free-output-first`

---

*Greetings, you are Sky**Bridge** (Session 268), see Sky**Quarry**'s handoff —
`docs/session_268_handoff.md` — let's keep rolling with our queue.*

---
title: Session 266 handoff — SkyForge
date: 2026-09-16
session: 266 (SkyForge)
tags: [handoff, regional-cpl-opportunity, credential-registry, cer, matcher]
status: current
superseded: true
superseded_by: session_267_handoff.md
---

# Greetings, you are SkyForge (Session 266)

⚠️ **THE `superseded_by: session_267_handoff.md` STAMP IS NUMERIC, NOT TOPICAL.**
The auditor ranks handoffs by number and 267 is higher, so it stamped this one.
267 belongs to the **funding** lineage and says of this work: *"The crosswalk
goes to its own session, steering clear of funding work."* **This file remains
the crosswalk lane's record.** ⚠️ **PR #1576 MERGED on 2026-09-17** (`a59d886`),
and 267 (SkyQuarry) then took the crosswalk lane over at Sam's direction — the
two lineages converged rather than staying apart. Read 267 for the funding work,
this one for how the matcher and the registry got here, and 268 for the register
that now sits in the My College tab.

⭐ **SAM CONFIRMED THE NUMBERING (2026-09-16): *"You will be next to finish this
out."*** Two lineages ran in parallel today — the funding one on `main` (S263
SkyOrder, S265 written by S264 SkyMantis) and this crosswalk branch, which had
numbered itself 263 and 264. On the merge main's 263 won and this handoff
renumbered to **266** so it sits above main's highest and actually gets read.
Sam's line settles it: this lineage continues.

⚠️ **THE FUNDING BLOCKER IS NOT YOURS (Sam, same day): *"Don't worry about the
funding blocker. That's the funding session's work to resolve."*** Two tests are
red on `main` — `cpl_funding_measure_picker` (assertion 4c) and
`cpl_funding_metric_pin` (7b, 7b2) — and they block PR #1576 along with every
other open PR. Established and already reported on the PR: both fail identically
on `main`, this branch touches no funding file, and each pins a fixed figure
(826.8 CPL FTES, 25 units) against data the daily cron rewrites. The stand-down
comment is posted and the one sanctioned re-run is spent. **Do not fix them
here, and do not merge past them.** The feed carries the item for the funding
session.

You are picking up a live workstream that Sam, Ashley and Sigrid drove through
a working meeting on 2026-09-16. Read in this order:

1. `docs/reference/lanes/partner-crosswalks.md` — the lane, current truth
2. `docs/regional_cpl_opportunity_lessons.md` — the three 2026-09-16 sections
3. `docs/kb-notes/methodology-a-freehand-catalog-needs-an-authority-file-not-a-vote.md`
4. `CPLBrain/03-professional/braindumps/braindump-2026-09-16-1420-never-had-a-table-of-active-certificates-and-licenses.md`

## What shipped

A fifth crosswalk instrument went live earlier in the session:
`kb/_build_regional_cpl_opportunity.py`, which crosses a region's occupation
list against one or many colleges and writes a workbook, a screen page and a
printable handout in the Cal-JAC format. Sam reversed the COBI-tab park and
chose its home: the **My College tab**, extending the existing scope picker,
single pick by default.

Then the meeting turned to external credentials, and that is where the session
ended:

- `kb/reference/california_occupational_licenses.json` — **369 California
  occupational and professional licenses, complete**, with the issuing state
  agency.
- `kb/reference/credential_registry_national_sample.json` — **974 of 6,738**
  national industry certifications, the union of two captures.
- `kb/reference/coe_occupation_demand_2024_2029.json` — 4,869 rows, 541
  occupations across all nine regions, SOC-coded.

## Decisions Sam made this run

- **"I don't like the practice the saying, 'it's this, not that'. Just make
  positive, active voice declarations."** Now doctrine in `CLAUDE.md`'s house
  voice section. It narrows the older rule rather than replacing it.
- **Keep it simple when a new team member is in the room.** Sigrid was on the
  call: *"she's very intimidated by all this... keep it stoopid stimple."*
- **All region taxonomies belong in the Supabase college lookup** — SWP and
  Academic Senate both.
- **Sam and Malone will pursue the Credential Engine API themselves.** His
  words: *"Will work on the CE API later with Malone."* Do not plan around
  building a scraper; the real feed is a human conversation already assigned.

## The priority workstream

**The matcher now has a score, and the score changed what "next" means.**

`kb/_score_occupation_matcher.py` runs it against Delta's 139 human rulings.
**Decision level: precision 0.907, recall 0.51, accuracy 0.626** — when the tool
says a college has something it is right about nine times in ten, and it finds
about half of what a human finds. Quote the decision number, never the pair
number (0.47 / 0.124); the pair metric is harsh by construction because a human
names the best programs, not every overlapping one.

Shipped this run: the agent-suffix over-stemming guard (`NOT_AGENT_ROOTS`) plus
`tests/occupation_matcher_stemming_test.py` in CI. Both measured collisions are
gone from the license join.

⚠️ **TWO PLAUSIBLE FIXES WERE MEASURED AND REJECTED. Do not retry them blind —
both are recorded in the code.**

1. *"Protect the agent strip when the bare word is also in play."* Backwards: for
   a true agent noun that is exactly when the merge is right. Cost Santa Rosa
   Roofers/Roof, Floral Designers/Floral Design, Data Entry Keyers/10-Key. Those
   three are now test cases.
2. *Gate the single-token path on `rare()`.* Rarity runs backwards here — a
   college with several welding programs serves welders MORE. It failed to fix
   its target and cost Welders, Automotive Body Repairers and Nursing Assistants.
   Delta F1 fell 0.653 → 0.630.

⚠️ **The stem fix exposed a homograph it had been masking.** Santa Rosa gained
five rows pairing Locomotive / Ship / Rail Yard / Stationary / Operating
Engineers with its **Engineering** program (58 → 63 adopt). Four are wrong. This
needs a sense distinction, not a threshold.

⭐ **The recall ceiling is VOCABULARY, not tuning.** *Application developer* and
*Computer Programming*, *ambulatory coder* and *Medical Office Assistant* share
no token, so nothing threshold-shaped reaches them. Closing it needs a synonym
layer or the curated `kb/occupation_credential_map.json` — which the score
reframes as the part carrying the meaning rather than scaffolding to replace.

## Shipped after the score

Sam accepted the gaps rather than holding the view for a better matcher: *"we can
live with known gaps and can call those out to our colleges when we meet with
them. Maybe just add a simple caveat to the views where needed."*

`ACCURACY_HEAD` / `ACCURACY_BODY` in the generator carry the measured numbers to
**all three surfaces** — workbook notes sheet, screen page, printable handout —
from ONE constant. ⚠️ **Re-run `kb/_score_occupation_matcher.py` and update the
constant in the same commit.** A caveat quoting a stale score is worse than none.

The caveat names the recall half as well as the precision half on purpose: a
college needs to know that an occupation missing from the page is unconfirmed, so
the person in the room adds what the matcher could not reach.

Also corrected in rendered text while there: "Read these as suggestions, not
answers" used the contrastive frame Sam ruled against the same day, and carried a
British spelling of program.

## Where PR #1576 stands

**Open, ready for review, blocked on someone else's red test.** Head `374de70`,
23 commits, merged up to `main` (`2c95b36`) with no conflict. TruffleHog green.
`test` red on 2 of 337, both funding, both red on `main` untouched — see the
funding block above. A check-in re-arms hourly and **merges the moment `test`
goes green**, then unsubscribes. Do not merge past it, and do not re-run: the
one sanctioned re-run is spent and confirmed the failure stable.

⚠️ **If a THIRD file starts failing, that one is yours.** The two named above
are the known baseline; anything beyond them came from this branch.

## Ashley asked where the tab goes, and got this answer

She checked in near the end of the session. The answer given, which matches
Sam's ruling: **inside the My College tab**, behind the scope picker that tab
already carries, single pick by default with multi-select for meetings. The
reason to repeat back if asked again — a separate tab means a second copy of the
college, district and region lists, and the second copy goes stale the day
someone updates the first.

She was also told what the accuracy caveat says, and that the 369 California
licenses are the "what might this student already hold" column she asked for.

## Carryover

| Item | State |
|---|---|
| Matcher: the vocabulary gap | **next** — a synonym layer, or lean on the curated map. Thresholds are exhausted, and the views now disclose the gap |
| The Engineering homograph | open — 4 wrong Santa Rosa rows, wants a sense distinction |
| Port the regional view into My College | queued, behind the matcher |
| California licenses as a third handout column | queued — Sam has seen the Santa Rosa handout and wants this shape |
| `cpl_occupation_match` verdict queue | **Rule 10(a3) — Governance first.** A new shared human-write table is a decision-rights change, not a code detail |
| CER canonicalization against the registry | the idea Sam named; no build yet |
| Credential Engine API | **Sam + Malone own it.** Not yours |
| ASCCC (Academic Senate) areas | **NEEDS SAM** — every Supabase column matching area/senate/asccc/zone/region was searched, none carries them |
| Flip SWP scope to `ready: true` in `college_briefing.js`, add `--swp-region` | small, unblocked |
| The To-Do feed's 16 parked items | `kb/cpl_todos.json` `_deferred` — none is done; promote one back into `items` when it goes live |
| PR #1576 | merges itself once the funding lane clears its two tests |

## Patterns that worked

- **Naming what a capture must contain turned a blocked domain into four PDFs.**
  The session could not reach `credentialfinder.org`; saying which four columns
  would make an export useful got Sam to capture the pages himself. A person with
  a browser is a working channel.
- **Measuring two captures against each other found the method.** They overlapped
  on 15 rows out of ~490 each, which is what proves repeating the print
  accumulates coverage instead of re-reading one page.
- **Correcting the record early.** An earlier claim that collection 151 was
  California's was wrong; saying so plainly is what sent Sam looking for the real
  California collection, which is the better source.

## Safety patterns to honor

- **Rule 10(a3):** the verdict queue is a new write surface. Governance and the
  privacy ADRs before it ships.
- **Rule 4:** `CPL_Dashboard.html` and `index.html` stay identical.
- **Rule 5:** never force-push `main`.
- **The matcher change is not a drive-by.** Sam has already reviewed output that
  the current matcher produced.

## Next concrete step

Fix the agent-suffix over-stemming in `kb/_build_regional_cpl_opportunity.py`,
score the matcher against Delta's 139 rulings, and report the error rate with a
before/after on the Santa Rosa run.

---
title: Session 122 handoff — the partner-crosswalk engine is live and untested at scale; run it against a second list
date: 2026-08-05
tags: [handoff, partners, crosswalk, occupations, workforce, cpl, sjcoe]
related:
  - "[[docs/partner_crosswalk_lessons]]"
  - "[[docs/kb-notes/methodology-partner-occupation-crosswalk]]"
  - "[[docs/session_121_handoff]]"
  - "[[docs/map_users_lessons]]"
---

# You are Session 122.

Session 121 was **SkyWalker** (named by Sam mid-session). Claim your own moniker
or take one Sam offers.

> **Numbering.** Session 120 was SkyMail and wrote `session_121_handoff.md`. I
> took 121 and wrote this as 122. If Sam says otherwise, he wins — don't
> re-derive it.

## What shipped (PRs #995, #996 + this checkpoint — all merged)

A **reusable engine** for the question *"which of the occupations we train for
can our students already get college credit for, and where?"*

**This session started with Ashley, not Sam.** She had an occupation spreadsheet
from an employment training center and a goal in plain words: *"so they know
which college offers CPL for their work experience and industry certs."* Sam
joined twice mid-session — once to authorize a COBI tab if we thought it merited
one, then with the line that shaped the build: *"keep in mind wiring this so it
can be scaled for other similar crosswalks."*

| File | What |
|---|---|
| `kb/_build_partner_crosswalk.py` | The engine — any list in (`.xlsx/.csv/.tsv/.txt`), workbook + receipts out |
| `kb/occupation_credential_map.json` | The shared rulings — 139 occupations, 406 credential rulings, 35 curated "no CPL exists" findings |
| `kb/partner_crosswalk_regions.json` | Named college regions for `--region-preset` |
| `tests/partner_crosswalk_test.py` | **45** checks — run `python3 tests/partner_crosswalk_test.py` |

Run it:

```
python3 kb/_build_partner_crosswalk.py --input <list.xlsx> \
    --partner "Name" --slug slug --column 2 --region-preset san-joaquin
```

### Follow-ups Ashley asked for after the first delivery

- **An HTML visual** — published as an artifact (findings + searchable occupation
  table). Palettes were validated with the `dataviz` skill's checker; the first two
  attempts failed CVD/contrast and were re-stepped. Don't eyeball chart color.
- **A flat Excel extract** — now a **Flat Extract sheet** in the standard workbook
  (occupation × credit recommendation × college × course, plus MAP exhibit IDs and
  the original freehand exhibit titles). 5,060 rows for SJCOE.

The exhibit-ID work is the part with a trap in it — read the KB note's *"Exhibit IDs
attribute to a college; the obvious source for that is stale"* section before touching
it. Short version: `kb/coci_articulations.json` looks perfect and is a **PREVIEW from
2026-05-23** missing 21% of the credentials; real attribution comes from
`statewide_data.js`, which groups exhibits by `(unified_title × cpl_type)` with each
group carrying its own adopter list.

## Read these, in order

1. `docs/partner_crosswalk_lessons.md` — the full story, numbers, and roadmap.
2. `docs/kb-notes/methodology-partner-occupation-crosswalk.md` — the distilled
   method. Read this before touching the engine.
3. The `kb/_build_partner_crosswalk.py` module docstring — source semantics, and
   *why* two data files are joined.
4. `CLAUDE.md` §11 → the **Partner crosswalks** roadmap row.

## The one idea worth carrying

**The two vocabularies don't join.** Partner lists carry job and apprenticeship
titles (`RESIDENTIAL WIREMAN`, `Hydro Plant Operator`); MAP is keyed by
credential titles (`Residential Electrical Apprenticeship`, `AWS D1.1 SMAW
Qualified Welder`). No mechanical join, no authoritative crosswalk to borrow — so
the match is **judgment**, and the whole design follows from accepting that:
persist the judgment (`occupation_credential_map.json`), let the run be
disposable, and treat each run's `unmapped.json` as the curator worklist.

## Priority workstream — the second run

**Coverage-compounds is a design intention, not a demonstrated property.** One
partner has been through the engine. Run a second list — any workforce board,
AJCC, county office, or apprenticeship sponsor — and work the resulting
`unmapped.json`. That is the run that either proves the map earns its keep or
shows the normalization is too coarse. Everything else here is downstream of it.

## Carryover + status

- **COBI tab — parked, deliberately.** Sam authorized one; Ashley chose
  engine-only and that was right. When revisited: build the **regional-capacity
  view** (pure data, no judgment — *does the college nearest this partner
  actually do career CPL, or only AP and CLEP?*). Do **not** publish the
  occupation-matching layer as a live tab; it would imply more authority than
  subject-matter reasoning carries.
- **O\*NET SOC → certification spine — the real unlock, unscoped.** It would let
  each match be defended rather than asserted, and let the map grow
  semi-automatically. Scope it before any of this gets published rather than
  hand-delivered.
- **The 35-occupation gap list is a build-it backlog.** ~20 are the utility
  cluster (lineworker, substation, hydro, gas control, metering, cable splicer,
  power dispatch) with **zero** CPL system-wide. Strongest build-it case yet from
  a partner list. Pair with NC/Learning Partners — a training center is an M2/M5
  partner in that taxonomy.
- **From SkyMail (still open):** Jessica/Ashley verify the 6 web-sourced contact
  fallbacks; make the "no CPL Assistant" cut (71 colleges) a live filter; the MAP
  manage-users URL is open from S87.

- **The status vocabulary needs a fourth state.** "Local CPL only" currently covers
  both *a college offers this* and *the credential exists but nobody has adopted it* —
  very different answers for a student. `Engineering Designer` is the live example
  (2 credentials, 0 colleges). Both the artifact and the extract render it honestly,
  but the underlying status is still coarse. Split it on the second partner run, when
  re-issuing costs nothing.

## Patterns that worked

- **Candidates first, then curate by hand.** Token-overlap generation is noisy on
  generic titles (`Control Technician` → *Traffic Control Technician*), but going
  straight to hand-authoring means not knowing what's in the index. ~6 candidates
  per occupation, read the landscape, *then* author the map explicitly.
- **Parity as the safety gate.** The committed engine reproduced the hand-built
  deliverable exactly — same 139/51/53/35, same 406 matches. That's what made it
  safe to commit the generator and throw the scratchpad away.
- **Render it and look at it.** Screenshotting the artifact is what surfaced the
  `Engineering Designer` mislabel — no test would have caught it, because the status
  was internally consistent. Ship the page, open the page.
- **Chase the zero.** San Joaquin Delta showing 0 rows on the region sheet looked
  like a join bug. It wasn't — it was the finding (68 of its 69 credentials are
  AP/CLEP). Verify before assuming a bug; sometimes the empty cell *is* the
  answer.
- **Report the data disagreement.** The 138-vs-84 statewide split wasn't in the
  ask, but it changed which number was correct to use. Surface those.

## Safety patterns to honor

- Rule 5 — never force-push `main`.
- Artifact policy — code-only PRs. The crosswalk workbook is gitignored
  (`kb/partner_crosswalk_out/**/*.xlsx`); the JSON receipts are kept.
- Supabase Rule 9 — fresh read at write-time, INSERT-only under a cohort
  `reviewer_email`, MCP tools only (the sandbox can't reach `*.supabase.co`).
- Merge-on-green includes **`unstable`**, not just `clean`. Don't end the turn
  waiting.
- Python tests aren't in `npm test` (the JS runner only discovers `*.test.js`) —
  run `tests/*_test.py` by hand.

## Moniker

**SkyForge** if you want one offered — you'd be running the engine in anger for
the first time. Coin your own if you'd rather.

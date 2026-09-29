---
title: Session 296 handoff — the Annual view's year, and the ETHS re-mint landed
date: 2026-09-28
session: 296 (SkyBeacon)
tags: [handoff, implementation-funding, remint, discipline-crosslist, decision-sheets]
status: current
superseded: true
superseded_by: session_300_handoff.md
---

# You are Session 297

Your moniker is **SkyLantern**. SkyBeacon (S296) took the queue from
[`session_296_handoff.md`](session_296_handoff.md) and landed two rulings end to end.

## ⚠️ This was an EMERGENCY checkpoint (Rule 9a, 49,583 tokens left)

Refreshed: this handoff, the three lanes this run moved (implementation-funding, sierra-retrieval-corpus,
discipline-crosslist), four `cpl_memory` rows, the To-Do feed, the re-mint playbook lessons, the funding
lessons entry, and the Pipeline tab's re-mint section. **NOT refreshed — do these first:** the CPLBrain
vault session note (`07-session-notes/2026-09-28-skybeacon-s296.md`), the `docs/INDEX.md` update-history
bullet, and a KB note (none crossed the bar). `kb/README.md` and `README.md` had nothing to change.

## First thing to check

The opening line runs `python3 scripts/check_hooks_live.py --fix`; its LIVE line should end
`context meter: yes` (S296's did). The meter's WARN fired at 107K left in S296: say the number and
checkpoint, as Rule 9a says.

## What shipped

1. **#1721, funding asks card 1 (year against year).** Under Annual funding every award cell reads
   the viewed year (`collegeAlloc` keeps `ey`/`hy`/`ecy`/`eny` per year, `cellFig()` picks them; the
   district and SYSTEM rows add them alike); Combined and the CSV keep the window. The two text fixes:
   the timeline default drops "Releveled", and the ESS partial state reads the feed's floor (10).
   Card 7's cleanup (the 397 garbled titles, run 36347161832) is recorded done in the sierra lane.
2. **#1722, the ETHS re-mint's dry run** (`kb/_eths_remint.py`, `tests/eths_remint_test.py`, receipt
   `kb/eths_remint_out/2026-09-28/ruled/`), and the builder's fresh sheet `2026-09-28-open-asks`.
3. **#1723, the ETHS land** — Sam's 2026-09-22 ruling on the 31: 26 KINE, 4 ATHL, 1 PEDS; 22 in
   **continuation band 2** (`KINE M2001`–`M2022`, the first band-2 ids); 61 pointers, 23 curation keys;
   receipt in ALIAS_MAPS; the chain run; SkyView's hand-built layout re-keyed (`--rekey-skyview`).
   `supabase-rekey.yml` then re-keyed `kb_curation`: read back 0 rows on old ids, 29 + 61 on new.

## Sam's decisions, recorded

None new this session (he spoke only the opening line). Carried out: funding card 1 (2026-09-27),
open-asks card 7 (2026-09-27), the ETHS re-mint (2026-09-22, card 1 of that sheet).

## Waiting on Sam

- **The funding asks sheet** https://claude.ai/artifact/74AfMNmXPQYP5X7XKpjHfH — cards 3 and 4 (read
  `replies`, then `replies/done`; he read through card 2).
- **The timeline label** (To-Do `s296-sam-timeline-label`): Scenarios 1 and 2 still store "…and
  Releveled"; his edit on the tab (no session writes `cpl_funding_config`, DR-09).
- **The ETHS extension** — the same mix-up in 43 standing ids (40 stand-alones, 3 the title list
  misses; 3 held) and 42 merged under Kinesiology parents. Card 3 of `docs/visuals/2026-09-28-open-asks.html`.

## The queue, in order

1. **Publish the 2026-09-28 open-asks sheet** (built, NOT published): Artifact tool with
   `capabilities: {db: {}, comments: {}}` (load `artifact-capabilities` first), hand Sam the link, and
   record the URL in the builder docstring and `decision_sheets`. Its cards 1–2 repeat the 09-27
   sheet's cards 3–4: read both stores; the later answer stands.
2. **SkyView's phone opening** (To-Do `s295-fable-skyview-phone-narrow`): measure at 390px through
   `npm run a11y` first.
3. **The narrated video: cue each reveal to its word** (`s295-fable-cue-narrated-draft`).
4. On Sam's ETHS answer: `python3 kb/_eths_remint.py --scope standalone,missed` (plus
   `children,merged_elsewhere` for "all"), widen `--apply`'s admitted scope in the same PR, then the same
   land: fresh read, apply, ALIAS_MAPS, chain, `--rekey-skyview`, `supabase-rekey.yml`, one cron window.
5. ESL monthly pass after 2026-10-28 · governance for the two write surfaces · the unit-range display check.

## Read in order

1. This file. 2. [`coursecontrolnumber_remint`](coursecontrolnumber_remint.md) § Lessons (the
2026-09-28 entry). 3. The lane of whatever you carry out
([`discipline-crosslist`](reference/lanes/discipline-crosslist.md) item 3;
[`implementation-funding`](reference/lanes/implementation-funding.md)).

## Patterns that worked

- **Measure the ruled set on the kb files, not the page's rows**: the card's 31 counted corroborated
  rows only; the catalog held 85 more of the same defect.
- **A gate that blocks is working**: P3 refused on a pointer child's own title the read rightly
  skipped; the fix scoped P3 to what the write touches, and nothing had been written.
- **Fingerprint a transcribed fresh read** (an md5 in SQL and in Python over the same serialization).
- Land order inside one window: merge, dispatch `supabase-rekey.yml`, read back before the cron.

## Safety patterns

- A predicate on a sheet card must recognize the fix's shape, or the answered card stays asked.
- An older receipt's ids resolve through the maps dated after it, never the whole chain (Rule 7).
- `pkill -f "<pattern>"` matches its own shell when the pattern is in the command line: kill by PID.

## Carryover

- `docs/cpl_funding_lessons_archive.md`, `docs/roadmap_archive.md` and two lessons docs sit over budget
  (`oversized_doc`); the funding lane is 22.7K against 20K, trimmed this run below its start.
- The title-consolidation receipt had gone 24 days unregenerated; the chain refreshed it in #1723.
- Checkpoint artifacts not refreshed: `kb/README.md` (no KB structure change), `README.md` (no
  user-facing surface), no new KB note (the re-mint lessons went to the playbook).

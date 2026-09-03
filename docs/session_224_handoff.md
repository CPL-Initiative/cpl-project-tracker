---
title: "Session 224 handoff — SkyView meets the five goals; every stand-alone orbits, the shards are on Supabase, and Sam has not driven it yet"
created: 2026-09-03
updated: 2026-09-03
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 224

Your moniker is **SkyTune** (assigned by SkyOrbit at sign-off, per Sam's
2026-09-03 template): the day's work is tuning the orbits to Sam's browser
reactions and his Business / Vocational example. Predecessors: SkyLead S221 →
SkyCheck S222 → **SkyOrbit S223**.

## What S223 did

Sam's opening ask was the funding queue; it was measured empty for a session
(dials unset in `cpl_funding_config`, `CollegeID2` on none of the four MAP views
by probe run 33767273456, only dependabot PRs open) and he pivoted to SkyView
with five goals, verbatim in `cpl_memory` (`sam-skyview-five-goals-2026-09-03`).
One PR on `cpl-project-tracker` — #1441, which grew the cross-discipline orbits the same day — shipped all five:

1. **The whole universe, first screen.** The canvas is full width and
   viewport-high, a **Full screen** word-button uses the browser's own mode (the
   COBI iframe carries `allow="fullscreen"`), and the write panel plus the
   discipline forest sit one scroll below (`main.u-fullbleed`, `__ccrForestInto`).
2. **Keyword jump to anything.** The header box suggests subjects, course
   identities, stand-alones AND college courses (by code or control number), each
   kind a word; a college course lands on the identity carrying it, filtered.
3. **Hover and click.** A tooltip is the quick look (number · title · units ·
   system · courses · orbit); the inspector overlays the map (docks below on
   narrow screens); a course number is the button that opens its catalog
   description; canvas labels grow with zoom (number > 0.95, title > 1.7, units
   and system > 2.7), collision-rejected.
4. **Orbits.** Every stand-alone course is a hollow point on a ring around the
   identity it is most aligned to: 31,350 of 33,423, and **1,521 of them in
   another discipline's island** (Sam's Business / Vocational example — a
   grab-bag course looks across the whole reference with a bonus for staying
   home; any other course crosses only for a strong title match when nothing at
   home fits; the point carries `h`, the discipline it is filed under); 2,073
   with no shared signal sit on their island's rim. The twin islands are gone.
5. **Drag and drop.** A hollow point drags onto its destination; a row drags
   from the inspector; **Move here** on a parent's card accepts one orbiting
   course; Escape puts a carry back. Nothing is written — the same `CN:` rows.

**Descriptions live in the public Supabase Storage bucket `ccr-desc`** (created
this run via the MCP; schema `kb/supabase_ccr_desc_bucket.sql`), published by
`scripts/publish_skyview_desc_shards.sh` from `skyview-desc-shards.yml` and the
daily run's Step 4d. Shards are `{cn digits: [description, title, units]}`.

## Sam's decisions this run (record, don't re-derive)

1. The five goals above are his words — the spec. He did not drive the result
   in a browser during the session.
2. **Orbits cross disciplines** (his Business / Vocational example): *"vocational
   is a big grab bag of noncredit courses and many need to stay there and some
   need to be moved to a MID course in another discipline."* Shipped the same
   day; `GRAB_BAG` membership beyond Vocational is his to extend (NEEDS SAM ③).
3. **The sign-off template is his** — the outgoing session writes the exact
   opening line he pastes into the next session and assigns the next moniker.
   Encoded in `CLAUDE.md`; two additions (session number, repo path) offered for
   veto.
4. **He wants a live-session banner on COBI** so team members can drop in and
   observe — filed as a to-do with a proposed shape, not built (NEEDS SAM ④ asks
   which link observers should follow).
5. Standing from earlier and unchanged: SkyView means the GRAPH view; a drag
   re-homes membership only; SUBJ4 breakage QUEUES a re-mint; the shards belong
   on Supabase (his lean, now delivered).

## ⭐ THE THINGS WORTH CARRYING FORWARD

**An orbit is a placement suggestion, never a curation decision** — hollow,
tethered, the reason in words, and a verb that accepts ONE course. **Corroborators
must not outvote the primary signal**: the first weights let subject + TOP +
units + credit beat a clear title gap; the test now pins both directions (a clear
title wins, a marginal gap yields). **A side table keyed by position breaks the
moment the list drops one** (KB note
`methodology-key-a-side-table-by-the-write-key-not-by-position`). And the
harnesses caught a UI bug worth remembering: **a filter that outlives its
selection** read an 850-course card as empty.

## Read in order

1. `docs/reference/lanes/skyview-ccr-interface.md` — current truth, NEEDS SAM
   ①–③, NEXT ①–⑥.
2. `docs/ccr_atlas_lessons.md` §2026-09-03 — the story, what the harnesses caught.
3. `prototype/ccr_universe.js` header comment and `kb/_build_ccr_universe.py`
   docstring — the constraints, in the code.
4. `cpl_memory` — `author = 'session-223-skyorbit'` (Rule 8: query before work).
5. `docs/reference/lanes/implementation-funding.md` — unchanged except the probe
   date; NEEDS SAM ⓪–⑤ still open.

## Priority work, in order

1. **Is the bucket populated?** The first `skyview-desc-shards.yml` dispatch after
   the merge fills it; if the deployed SkyView says descriptions did not load,
   dispatch it (Actions → Publish SkyView description shards) and read the log.
2. **Sam drives it** — put the visual calls to him by number (NEEDS SAM ①):
   orbit density, inspector width, label bands, the rim, the daily-rebuild
   question (②). Each weight is one line in the builder; rebuild, commit, done.
3. **Decision packs per discipline, fetched on demand** (NEXT ①) — the bottleneck
   behind the map since S192; the shard publish path is the template.
4. **The queue** (NEXT ②): a drag that leaves the destination's SUBJ4 inconsistent
   queues a re-mint candidate, proposes never auto-adds.
5. **Funding carry-overs** unchanged: the day Pedro says `CollegeID2` landed
   (probe, `ppa` cutover, earn diagnostic); the dials are Sam's to set through
   the tab; NEEDS SAM ③④⑤ await his reactions.
6. Done, not open: the probe's stale `BUILDER_SWEEP` copy (it lacked
   `Counselor_Verified`) was fixed and pinned equal to the builder's tuple in
   #1442, merged 2026-09-03 — the next probe run's verdict line is trustworthy.

## Patterns that worked

- **Measure the queue before pivoting**: dials, probe, open PRs — one pass, then
  Sam's pivot had a clear conscience.
- **Boot the REAL template in jsdom** with a fixture and a recorder canvas: the
  contracts between header, crumbs, forest and map were tested as one page.
- **Let the browser harness change the page, then read what it changed** — two
  of its failures were its own earlier moves; one was a real bug.
- **Rebuild, measure, adjust, pin both ways.** The alignment weights moved twice;
  the second move came with a test that fails if the pendulum swings back.

## Safety patterns to honor

- `cpl_memory` rows from this session are INSERT-only under author
  `session-223-skyorbit` — rollback is `delete … where author = …`.
- The bucket `ccr-desc` is PUBLIC READ of public catalog text; its only writer is
  the runner's service role. No student or staff data may ever be shard content.
- Nothing on the SkyView page writes to Supabase; a move is a receipt.
- Never force-push `main`; the stop-hook's post-merge nag is a false positive.
- Artifact policy: the universe payloads are hand-built and committed (the daily
  run does not rebuild them); `unified_courses_*.js` stay runner-owned.

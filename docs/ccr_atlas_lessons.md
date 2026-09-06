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

### The S231 look, moved here verbatim from the lane (2026-09-05, S232 compaction)

The lane states current truth; this is the detail behind the glow ruling, kept once:

> ⭐ **THE GLOW IS THE MEMBERSHIP SIGNAL, NOT DECORATION** — Sam: *"leave all the loners and nonmembers without the halo effect — haven't earned their wings yet and are still moons."* A point colleges have joined emits light; a stand-alone reflects it, so the map answers *has anyone agreed this is the same course?* without a word. Also his, in order: members as muted stars; a darker, grayer canvas (14.81:1 strong ink, 7.77:1 muted); short college names throughout, canonical kept on `title`; the catalog description on a member's hover card; the parent's name INSIDE the big circle when it fits (an open identity's middle is the emptiest space on screen) with no leader, because position is the tie; otherwise the leader lands ON the edge (`q.rad*0.98`), not at 0.71; the disc and the title wearing the identity system's color (5.15–8.44:1 light, 6.76–9.23:1 dark), a stand-alone keeping muted ink; and **no label transecting a disc** — `discBoxes` are seeded as occupied boxes before any label is placed. Verified: 55 checks in `tests/ccr_skyview_search_show.test.js`, 302 test files, `npm run a11y -- skyview` across 6 routes, a Chromium drive per change.

## 2026-09-05 (late night) — SkyOutline S232: the other six rulings

Rulings 11, 3, 1, 6 and 2, after 8/4/5 earlier the same night. Two of them taught
something worth keeping.

⭐ **A TEST THAT PASSES WITHOUT THE FIX IS TELLING YOU THE FIX IS WRONG.** Sam's
ruling 3 said *"focus jumps back to the search bar on every selection when
picking multiple courses and should stay put."* I read "focus stays put" as *put
focus back* and made the pick re-focus the search box — which is the complaint
restated as a feature. The suite then passed **just as well with that code
deleted**, and that is the whole signal: an assertion that holds either way is
asserting a half that was never in doubt. What actually moved was the SCROLL —
`openSug()` rebuilds the list with `scrollTop = 0`, so after S231 took the
dropdown from 8 rows to 60, every tick threw the reader back to the top. Focus
never moved at all: the row's `mousedown` already calls `preventDefault()`.
⚠️ The lesson is not "read the ask more carefully" — it is that **perturbation is
what distinguishes a guard from a decoration**, and it costs one minute.

⭐ **THE FLAGGED CANDIDATE IS THE ONE THAT JUSTIFIES THE TOOL.** Ruling 6's merge
queue returns three Welding groups, and the third is `WELD M1009` / `WELD M90AI`
— identical titles ("Advanced Welding Applications"), and any title-keyed rule
would propose the merge. They cross the **band**: 1xxx credit against 9xxx
noncredit, different courses for funding and for the student. A queue that only
ever surfaced the easy merges would have been a slower way to do what the auto
lane already does; surfacing the one you must NOT do is the value.

⭐ **ARTICULATION IS ITS OWN SIGNAL AND THE MAP COULD NOT IMPLY IT.** SkyView
sizes a point by adoption, and articulation runs opposite: `WELD M1061` is taught
at 4 colleges and carries 12 articulations, `M1109` at 24 and carries 7, `M1057`
at 7 and carries none. So the most-articulated identities were the map's dimmest
points and nothing said so. ⚠️ `ar` is **absent, never 0** — "no articulation
recorded" and "we did not look" are the same on this feed, and a `0` would assert
the first. ⚠️ The join must **not** re-resolve through the alias chain; those ids
are already current-era.

⭐ **`doctrine.py --read` exists because `--changed` fires too late.** The diff
mode is silent while you are still READING, which is where this session's worst
finding was made. The read-side mode takes the files the session actually opened,
from the live transcript. ⚠️ It has to parse **Bash command text**, not just
`Read` calls — an auto-mode session opens forty files with zero `Read` calls
(this one: 86 Bash, 0 Read). And it must strip **heredoc bodies**, or a session
that writes documentation reports every path it wrote *about*; the first live run
named `cpl_chat.js`, which appears only inside the docstring that run added.

**Ruling 2 was routed, not built** — an ADR
([`adr-remint-approval-queue-decision-rights`](kb-notes/adr-remint-approval-queue-decision-rights.md))
because Sam ruled it goes through Governance and the privacy ADRs first. The
argument that settled the shape is **reversibility**: an INSERT-only cohort
reverts by `reviewer_email`; a re-mint that has rippled through the alias chain
has no undo. And this session is its worked example — five post-state gates all
passed on a plan that was one `--apply` from deleting 172 live identities.
**Gates check that the post-state is consistent, not that the plan was sane.**

**Housekeeping:** the SkyView lane was compacted (the eleven rulings, the five
asks, the "map shows only adoption" claim that #1491 made false, and the S231
look narrative, which is above). It is still ~2.6× its 12 KB budget; what is left
is live design content for an active lane, and cutting further would delete it.

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


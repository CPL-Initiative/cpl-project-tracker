# Identities map rebuild — dry run 2026-11-14

status: DRY-RUN 2026-11-14, nothing applied

Rule: the 1b entry rule (kb/_remint_apply_articulations.py) on the current catalog, for every articulated M-ID; C-ID/CCN entries pass through; M-ID entries no record names are held for a ruling. Not recomputed: the records' adoption_leverage, adoption_leverage_count, over_merged and identity_confidence. Not covered: a merge member with no articulation record gets no entry, so its college never reaches its target's potential list.

## Entries

- articulated ids: 2,319; entries now: 2,941
- fill 0 · refresh 0 · same 2,144 · C-ID/CCN kept 172
- refresh, why: 
- C-ID/CCN record ids with no entry: 2 (AG-AB 108 108, AG-PS 128 128 L); the literal NULL course_id: 1; M-ID record ids in no catalog: 0
- orphan M-ID entries held: 625 (orphan_worklist.json); C-ID/CCN entries with no record, kept: 0
- entries after --apply: 2,941; with --drop-orphans: 2,316

## Public figures (the generator's own functions on the planned map)

- over_merged flips on refresh: none; fills born over-merged: 0
- Fact Sheet "Could adopt" total: 115 to 115
- by sector: no change
- statewide_prescriptive.js credentials that change: 0

## Rows (the export on the current map and on the planned map)

- in-browser rows (unified_courses_data.js): 0 of 16,386 change; gain adopters 0, lose adopters 0, gain potential 0, lose potential 0 (every lost college became an adopter 0; a college left a stale offering 0)
- export rows (exports/unified_courses.xlsx): 0 of 75,724 change; gain adopters 0, lose adopters 0, gain potential 0, lose potential 0 (every lost college became an adopter 0; a college left a stale offering 0)
- a row loses potential colleges when a member's earning colleges join its adopters, or when a refreshed entry's stale offering gives way to the membership
- export rows are matched by kind and id, never by position: the export writes them in catalog order and builds each row's lists from that id alone, so the rebuild cannot move a row, and no export row can lose a college to its adopters (only a refreshed offering removes one)
- the held orphan entries: 371 in-browser rows show 2,327 potential colleges from entries that describe other courses; 331 of those rows carry no articulation at all

## Merge targets

- targets with an articulated member: 453
- reached by a member that had no entry: 0
- whose adopter or potential count changes: 0
- FIRE 130 X: adopters 16 to 16, potential 32 to 32

| target | members without entry before | adopted | potential |
|---|---|---|---|

## Apply and undo

1. `python3 kb/_identities_rebuild.py --apply --expect-plan <this dir>/plan.json` writes the fills and
   refreshes, keeps the orphans, and writes `apply_receipt.json` here with every key's before-value.
   It aborts when the fill, refresh or orphan sets differ from this plan.
2. Commit kb/coci_articulations.json and the receipt in one cron window; the daily run rebuilds the lists.
   It also aborts when an entry's content moved since this plan (plan.json carries a hash of each).
   The receipt is written pending, then the map, then marked applied; a run interrupted between
   them is settled by the next --apply or --undo from the map's own bytes.
3. Undo: `python3 kb/_identities_rebuild.py --undo <this dir>/apply_receipt.json`, or revert the commit.
4. `--drop-orphans --ruling "<who, when: what>"` also drops the orphans, after this worklist.

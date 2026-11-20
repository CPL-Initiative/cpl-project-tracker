---
title: "Session 690 handoff (from SkyTern, S689)"
created: 2026-11-20
updated: 2026-11-20
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyMerlin (Session 690)

From SkyTern, S689, the CPL Queue routine's 06:12Z firing of 2026-11-20 (started 06:13Z): a conductor run for
collection only under Sam's routine prompt of 2026-11-17, following the COBIx brief on #3358 as updated
2026-11-20T02:38Z. **This is the declaration stub** (S689 holds the queue); the checkpoint replaces it.

**The start.** No session was live: the only open PR was dependabot's #3383, and `main`'s newest commit was handoff
689's merge (#3583, 04:40Z). The firing dispatched `daily-dashboard.yml` on `main` at 06:15Z (no run had been created
that UTC day), restarted the COBIx watcher, and wrote this split before any worker started. No `list_sessions`,
`get_trigger` or `set_session_tags` in this session.

## Conductor settings

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 (`docs/reference/conductor_mode.md`,
*Settings*, Sam's change of 2026-11-11): two lanes, never on one college; about $750 a day for everything, $10k and
$30k running totals for the whole job; workers on Opus 5.5, cheaper models for routine reads, high effort on any
worker that writes shared data; reviews at most 9 agents; $40 per college per run for program requirements and a
separate $40 for SLOs, PLOs and course objectives, per run, never a remaining pot. The routine's form set the
conductor to Opus 5.5 tonight (Sam's switch at about 3:47 PM PT on Nov 19, relayed by COBIx): the first Opus night of
the comparison. A session Sam starts by hand works the queue itself.

## The college split (written before any worker started, 06:19Z)

Two lanes, never on one college at the same time, one writer per college; a college moves between lanes only when
its lane has nothing in flight there (`d-lane-names-only-colleges-in-flight-s681`).

**Lane 1, collection (Opus 5.5 workers, high effort).**

- **Worker `reread` (the reread plan's third ten):** Sierra, Barstow, Pasadena City, Rio Hondo, Los Angeles Harbor,
  College of San Mateo, College of the Sequoias, Fresno City, Contra Costa and Madera. $40 per college per run, keep
  the better record before posting, a load after each reread.
- **Worker `pages` (the census's free page-finding levers 3, 6, 8, 11, 12 and 14):** College of the Canyons, City
  College of San Francisco, Santa Rosa Junior, Ohlone, San Joaquin Delta and Santa Barbara City; a free page read
  first, paid extraction only for programs whose own page is found. Then Copper Mountain's 404 address to the
  discontinued check, and Cosumnes River's 29 (lever 13) only once the named-programs-only `only` input exists.
- **Worker `outlines` (course outlines):** Feather River's and Palomar's header fixes, then their trials; Mt. San
  Antonio's 12-page trial, counted by eye into `kb/course_outcomes/mtsac_recall.json`; City College of San Francisco
  by `ccsf.curricunet.com` (`route_of` accepting `curricunet.com`, a census row for that host). City College of San
  Francisco's outline load waits until worker `pages` has nothing in flight there.

**Lane 2, the cheap piles (one worker, free rule work only; starts after lane 1's workers sign off).** Rule D's
prior-year read (`CAPTURE_PRIOR`) for College of the Desert's 8; census lever 2 (the general education pattern's
units, 206, statewide) and lever 4 (the noncredit hours total, 68); levers 5, 9, 10 and 15 (catalog-wording rules at
Glendale, Santa Monica, College of the Canyons and City College of San Francisco); keep-the-better's follow-ups
(`needs_load`, the shared no-ending address rule, `slug_awards` endings); Los Medanos's 59 only if its parked decision
allows.

**The conductor's own:** the display build once, after the night's posts, then `harvest-gap-census.yml` against
5,145; merges; the checkpoint.

**Not tonight:** the Library (#3560 parts 4 and 3), repo slimming, Rule G, one credential list, the cer-procedures
pair apply and the CR exact match: the plain session's list (brief section 4).

## Ledger

| PR or branch | Worker | State |
|---|---|---|
| this declaration (`claude/awesome-fermat-cx0hdk`) | conductor | draft, refreshed each half hour |

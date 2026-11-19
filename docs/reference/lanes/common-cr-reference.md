---
title: "Common CR Reference — lane state"
created: 2026-08-28
updated: 2026-11-18
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Common CR Reference

> Relocated from `CLAUDE.md` §11 on 2026-08-28 (S206). **Always-current lane
> state, never an archive** — update it at every checkpoint that moves this lane.
> When a finding contradicts it, DELETE the superseded text.

## Status

✅ **LIVE (the List since 2026-11-04).** ⭐ **SAM'S DESIGN RULING:** *"CID is only one factor… similar to the CCR, we take into account matching factors like title, course name and number, course description, subject, etc."* — illustrative, not exhaustive. C-ID-as-key fails BOTH ways: it over-merges (`AJ 110` on two genuinely different POST lines) and under-merges badly (only ~17% of the 2,344 strings carry a C-ID at all). ⭐ **AUTOMATION REACHES ~10%, SO THIS IS A CURATION WORKBENCH, NOT A MERGE ENGINE** — rung 1 published statewide 351 lines/134 credentials · rung 2 C-ID 36 of those · rung 3 CCR course identity 40 strings · rung 4 mechanical twin ~160 · rung 5 similarity **suggests, never merges**. **~90% is curator judgment no matcher reaches** (*Racial Issues and the Police* ≡ *Community Relations* — one POST topic, unrelated words), which is what the **+ Add a wording** picker is for. ⭐ **SCOPE IS GLOBAL + a split affordance (Sam, 2026-08-13):** 407 strings (17%) span >1 credential but carry **45% of all articulation rows**, and `Introduction to FCAW` is one recommendation under all ten AWS/ASME credentials carrying it. ⚠️ **RANK BY COLLAPSE VALUE (wordings × colleges), NEVER BY CREDENTIALS SPANNED** — the widest-spreading string is `3 hours in Elective Course Credits`: 61 credentials, **1 college**, a placeholder. Credentials-spanned would have ranked the corpus's least useful string #1; collapse value sinks it to #174 with no special case. Real head: `Intro to Administration of Justice` (5 wordings/26 colleges), then Principles & Procedures, then Criminal Investigation. **30 groups carry a curator decision as of 2026-09-20 (the older "156" counted the mechanical rung ladder); top 50 strings = 49.4% of all articulations — an afternoon, not an ocean.** ⚠️ **Units never split an identity** (`SPAN 100` at 4/4.5/5): no rung holds a merge for them, and a group named by a wording states its range (cards 13–14, below). **0 hours reads as noncredit** (sheet 4, card 3, ruled 2026-09-29, ✅ built #1768): a 0 never opens a range (*Oral Radiology (2 units or noncredit)*) and an all-0 group reads *(noncredit)*; the 2026-09-30 run renamed the ten (seven *(noncredit)*, three ranges); A30 in `tests/cr_reference.test.js` holds it. ⚠️ **Grouping is by KEY, NEVER transitive** — 164 strings bridge ≥2 course identities, so components would chain `AJ 110`↔*Community Relations*↔`AJ 160`. ⚠️ **Two gates DON'T work: `attribution='per_course'`** (every poisoned `AJ 110` row carries it) **and a line-fraction/cartesian test** (`AJ 110` hits 8 of POST's 43 → reads non-cartesian → sails through). The gate that works is the credential's **COURSE count**. Decisions live in gated Supabase `cr_reference_decisions` keyed on `group_key`, so a rebuild can never overwrite a judgment. **NEXT: Sam works the head — the top ~50 groups — and we watch which rungs he overrides.** Story + the fixed-bug postmortems: [`common_cr_reference_lessons`](docs/common_cr_reference_lessons.md) · scope [`common_cr_reference_scope`](docs/common_cr_reference_scope.md).

## Progress, and what complete means (S437, 2026-10-20)

The tab carries the Commons' Progress view beside its List (`cr_progress.js`; lane
[commons](commons.md)). **Complete = a wording that resolves to a settled reference**: a rung 1 to
4 rule places it, or a curator's decision names it (confirmed or not a topic). 459 of 2,344 wordings,
5,750 of 9,413 articulations, on 2026-10-20; the head (the 50 wordings with the most articulations)
is 44 of 50. Sam kept it as built (Open Asks Sheet 108 card 5, 13:24Z 2026-10-20). The List carries *No rule or decision* (1,885) and *Name to check* (37).

**NEXT (ruled on Sheet 3 card 9, 2026-09-29, waiting on a session):** pair groups by shared course
identity behind the course-count guard; Jev runs the new pairs, the unanchored clusters and the newer
anchored pairs under the 0.85 gate, then a sheet of 40 to 60. Beside it, the six head wordings left
are Sam's to decide on the tab. The CCR's title-rung sitting (pointer at the foot of this file) is the
CCR's ladder, not this reference's. **The CR exact match (#3518, parked as issue #3523, PR closed, branch kept; `f-cr-exact-match-live-counts-s683`):**
live counts of 2026-11-18: the inventory's 29,995 rows are MAP only 3,334, an exact match 202, and a typographic or real
difference 26,459; `map_ace_catalog_cr` holds 104,688 rows over 25,742 exhibits. **NEXT:** a plain session takes the
exact match up from issue #3523 against those counts.

## ACE's own text beside MAP's (S678, 2026-11-17; COBIx item 5 on #3464)

`View_ExhibitCRsCatalog_Dataset`'s `CreditRecommendation` is now kept: one row per distinct (AceID, wording) in
`map_ace_catalog_cr`, keyed on the ACE exhibit id (never the catalog's numeric ExhibitID), filled by
`kb/_sync_map_custom_reports.py` after the nightly promotion in `map-custom-report-load.yml` (04:57 UTC). Migration
`kb/migrations/2026-11-17_s678_map_ace_catalog_cr.sql`, rollback beside it; the table, its load function and the view
`map_exhibit_cr_side_by_side` are dismissed with reasons in `kb/governance_surface_map.json` (no student data). Applied
S679, 2026-11-18 (`supabase-migrate` run 44209026812, status 201); the first fill is the next 04:57 UTC load. **DECIDED (the S679 conductor, #3468):** a failed ACE check raises `AceCheckFailed`: that night `map_ace_catalog_cr` is left alone, the MAP load goes ahead, and the run exits 1 at the end. The panel's *MAP and ACE text* section shows,
per exhibit, MAP's wordings beside ACE's lines, with a box to read one exhibit (AR-0702-0030).

The typographic rule (`kb/cr_typographic.py`, ported as `crTypoKey` in `cr_reference.js`, one shared fixture): two
wordings are one recommendation when they match after `clean_rec` plus a case-insensitive whitespace squash. It
compares and never rewrites source text. The runner log prints, from the same pull, exact + typographic only +
differs + ACE text missing = MAP pairs, and the MAP pairs the rule settles on their own exhibit. COBIx measured 859
rows for the rule and 25,984 waiting on ACE text; both re-measure from the first fill's log. Open: the truncation
and run-on rule (AR-0102-0007, 593 rows), and whether a settled state is stored anywhere beyond the log and panel.

## The List (S542, 2026-11-01)

The tab's workspace, `#cr-reference/list`, is the Catalog Commons' shared List (`commons_list.js`) with this
reference's spec in `cr_reference.js` (Sam, 2026-11-01: *"I want one now for each of our Catalog Commons groups"*): one
row per wording (2,344), with its reference, rung, decision, articulations, colleges, units, credentials, courses and
group size. The wordings sit in **read-only bands by group** (the List norms' step 3, S545): each of the 156 groups of two
or more wordings is a band named and ordered by its reference, with its facts; a group of one sits under *Single
wording*; *Bands by group* takes them off. A wording leaves its group through the panel's split, never a move between
bands, because in CR the group is the fold unit. Edit and Edit every row rename a group's reference through the
group's one write (`saveDecision`, the group's `cr_reference_decisions` row, its decision kept or deferred), so a
rename never settles a group; Confirm the group and Not a topic sit in the reference's drawer and, for an undecided rung
1 to 4 group, on its *Suggested groups* line. Your flag saves to `kb_curation` (`_CR_LIST::<wording>`, `list_flag`). No
find and replace: a replace across wordings would write one group once per wording. **A wording's title opens a side
panel** (2026-11-03, the List norms' *The List is the workspace*): the wording, one line of what it is, its group's
wordings (sortable; another's name opens its panel), Confirm the group and Not a topic with their own status line, and
the rung, credentials and courses folded; since 2026-11-04 also the group edits the worklist carried (split, name, add, note,
Defer, Clear). **The List opens first** (2026-11-04); counts and `#cr-reference/<filter>` open it. **The worklist
retired into the List on 2026-11-04**: its guards drive the List (`cr_list_worklist_port`, B1 to B16; *Decided by*
keeps the CSV's who-and-when), and `#cr-reference/worklist` opens the List. **Above it, one line of the CR row** of `kb/status/commons.json` (its two
issues set the List's *No rule or decision* and *Name to check*) and the reference's measured stance folded behind
*Hide the summary* (2026-11-03). Guards: `tests/cr_list.test.js`, `cr_list_panel`, `cr_list_line`; a11y targets
`cr-list` and `cr-list-dark` (the panel open).

## Jev on this lane — the blocking, the gate, the verdicts (S279/S280, 2026-09-20)

⚠️ **THE JUDGMENT IS ACROSS GROUPS, NEVER INSIDE ONE.** None of the 1,936 rung-5
groups holds more than one wording, so the ~90% "no matcher reaches" is not an
in-group merge: the question is always *should group A and group B be one*. Brute
force there is **1,873,080 pairs**, which is why similarity never got traction.

**The way in was blocking, not a better matcher.** Grouping by SHARED CANONICAL
cuts 1.87M pairs to **51 anchored pairs carrying 1,459 rows**, and every cluster
already contains a rung-1/2/3 anchor — a published statewide line, a C-ID or a CCR
identity — so each question is a closed yes/no against an authority. The first
run's scores are in [`common_cr_reference_lessons`](../../common_cr_reference_lessons.md), moved S302.

⚠️ **NOTHING FELL BELOW 0.32 — JEV EXPRESSES NO CONFIDENT NEGATIVES HERE.** The
`keep` bucket came back empty. The usable gate is **p ≥ 0.85 = suggest**,
everything else = a curator looks.

**THE VERDICTS LANDED (S280).** Sam answered all 51 on the
[sheet](https://claude.ai/artifact/KydcskYBqc93WAurcMEatq) (33 fold, 18 keep),
then, shown the eight anchors carrying both a fold and a keep, flipped 26, 27, 28,
29, 32, 35, 37, 38: **41 fold, 10 keep**. Written as **30 rows** in
`cr_reference_decisions` (20 anchor groups carrying folded wordings, 10 kept
groups confirmed), INSERT-only under `updated_by = cr-reference-s280@bot`,
verified member-by-member against
`kb/receipts/cr_reference_decisions_2026-09-20_s280.json`; rollback is one delete
on that `updated_by`. The table still holds exactly these 30 (read 2026-09-29).

**The magic half is one module (S281 SkyAnvil, 2026-09-21), with its triage of 2026-09-29,** moved verbatim to [`docs/roadmap_archive.md`](../../roadmap_archive.md), *Moved from lanes/common-cr-reference.md (S678 checkpoint)*.


## Moved to the lessons doc (S467, 2026-10-24)

*The gate, the band, and the battery* (S281: p ≥ 0.85 folds 25/25; nothing orders the band below it; `units`
at 0.281 is the durable lesson) and *The ladder sheet, and the ranking rule that failed on it* (S282: collapse
value is a constant between the four centers; only the CCRR has a decisions store) moved verbatim to
[`common_cr_reference_lessons.md`](../../common_cr_reference_lessons.md), *Moved from the lane (S467)*.

## RULED — a Jev next step per reference, and the unit range (Sam, 2026-09-29)

Sheet 3's cards 8–11 and 13–14, each his own call; 8–11 wait on sessions.
**8 placement (CCR):** Jev chooses among the disciplines a course's member
colleges name (title and description as evidence), scored against his 26 answers
before any card reaches him; if it agrees, the next sitting takes 50 of cross-list
kind C, most member rows first, Keep · Move · Cross-list with Jev's choice
selected. **9 course (CCRR):** pair by shared course identity behind the
course-count guard (POST's every line to AJ 110 fails it); Jev runs the new pairs,
the unanchored clusters and the newer anchored pairs under the 0.85 gate, then a
sheet of 40–60. Re-measured after card 13 (#1754), unchanged: 55 anchored pairs
(1,459 rows), 33 unanchored clusters (105 groups), course pairing 600 pairs over 465
groups, 338 at rung 5 (2,738 rows): every shared name is a C-ID title.
**10 store (CER):** a decisions store with a reason column, through Governance first (DR-07's
`maintained_in` gains the table; Rule 10(a3)); then the 38 as a Jev calibration
sitting, each issuer checked against the credential registry; mechanical fixes by
July's clean-rename path under a receipt. **11 as proposed (CSR):** *Import Body
Customizing* to Auto Body Technology, AGAB for Agricultural Business, and AUTB
M1006 re-minted under it by the playbook; then the 15 to Jev and a short ranked
sheet. **13 LANDED (#1754):** 88 groups named by topic and range, *Engine
Performance (2–5 units)*: 71 from the most colleges' wording, 16 from a published
line, 1 whose ENGL 100 title is only proposed. The 25 named by a C-ID keep their
names, his ten confirmed among them. **14 LANDED (#1754):** the rung-4 units screen
is gone; its 30 groups (182 rows; *Calculus I (4–5 units)*) merge, and no screen
holds a group today; the other five stay. All 30 decisions keep their groups.
*Pre-Calculus Mathematics* now takes MATH 155's title every build, not under 5 of
20 hash seeds ([lessons](../../common_cr_reference_lessons.md)).

## The CCR rung, and Sam's ladder design (2026-09-21, S282 SkyLedger)

The CCR's own ladder (the 1,237 askable Trust Card questions, the never-ask and rank-only tags, Sam's 2-unit rule, the seven rungs, and the next `title`-rung sitting) moved verbatim to [`docs/roadmap_archive.md`](../../roadmap_archive.md), *Moved from lanes/common-cr-reference.md (S679 checkpoint)*. It is the CCR's ladder, not this reference's; Sam's rule that the ladder is the template for the CER, CSR and CCRR stands.

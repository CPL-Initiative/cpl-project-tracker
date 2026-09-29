---
title: Session 303 handoff — sheet 3 carried out; the ETHS re-key, one setup-python bump and sheet 4 come first
date: 2026-09-29
session: 302 (SkyWeft)
tags: [handoff, decision-sheet, college-dashboard, implementation-funding, eths-remint, dependabot]
status: current
---

# You are Session 303

Your moniker is **SkyWarp**. SkyWeft (S302) took the queue from
[`session_302_handoff.md`](session_302_handoff.md) and closed out at Sam's word (*"Let's close out
and move to new session"*, ~16:00Z). Sam stopped S302's merge agent and its round 8 port agent before
they finished, so **check every PR below on its current head before you trust it.**

## First, in this order

1. **#1755, the ETHS re-mint of the 43** (40 move, 3 hold; head `d208faa8`, green, carries the
   id-reuse check). Merge it and run the chain **in one cron window, before the next 06:17 UTC run**:
   dispatch `supabase-rekey.yml` with
   `alias_map_path=kb/eths_remint_out/2026-09-29/standalone+missed/alias_map.json`, read back
   (`self_on_old, ptr_on_old, self_on_new, ptr_on_new` expected 0, 0, 4, 3), then dispatch
   `daily-dashboard.yml`. Main has moved since its checks: update the branch and re-check `test`.
2. **#854, setup-python 6 → 7**, only after step 1 (`supabase-rekey.yml` and `daily-dashboard.yml`
   use it). Head `c883ef30`: main merged in, all 30 uses on v7, `test` green. Before merging, grep
   main for `actions/setup-python@v6` again (one new site appeared within an hour on 09-29). The
   push to main runs `coci-offerings-sync.yml` with `--apply`, which truncates and replaces
   `coci_college_offerings`, `coci_college_programs` and `college_geo` from committed data, plus
   four read-only checks. v7 drops only `pip-install`, which no workflow uses.
3. **`cpl-chat-smoke` has failed every run since 2026-09-18, and the bump is not the cause.**
   `search_college_programs` hits the anon role's 3 s statement timeout (`57014`) and
   `program_typical_courses` returns 0 rows (need 30); the same errors hit a setup-python v6 run
   in the same minute. A live RPC performance problem: root-cause it. (#853, #855 and #1090
   merged on 09-29 after S302's agent tested each: `0944...`, `3c83...`, `0b21...`.)
4. **Build sheet 4** (`SHEET_ID` `2026-09-29-open-asks-4`, each card carrying its own `evidence`),
   marking each ask in its lane in the same PR:
   - Round 8 is approved (*"mockup looks good!"*); three questions stay open: gray Curr cells keep
     $0 or show the demonstrated figure; whether the first condition's check requires all three
     parts (49 meet the coordinator alone, 43 all three; `cpl_memory`
     `sam-first-condition-three-parts-2026-09-29` names the six); what a college reports in the
     sketched Reporting box (his NOVA idea, `sam-nova-reporting-idea-2026-09-29`).
   - Ten CR wordings state "0 hours", so some ranges start at 0 (*Oral Radiology (0–2 units)*):
     treat 0 as no figure?
   - Draft 4 of the narrated video (#1756) waits on his review (card 15: the explainer links it once
     he approves).
5. **Finish the round 8 port** from WIP `3890680a` on `claude/college-dashboard-round8`: most
   suites are moved to the drill-in's new rows; two College Dashboard (block 7) checks still fail.
   Then the guards and the consumers (the explainer embeds the section).
6. **Round 9, Sam's ask (2026-09-29):** *"Next to Vet JST not yet at 75%, show the college vet
   count vs. their JST count and the %."* Check it against the mask-under-10 rule
   ([adr](kb-notes/adr-funding-counts-mask-under-10-units-carry-the-money.md)).

## Card 7 is settled

Sam, ~15:55Z: *"Allow workflow and I'll type in myself."* He types both lines on the tab in both
scenarios. `funding-config-edit-apply.yml` and its applier landed (#1757) for later reviewed edits;
a dry run with `plan_dir=kb/funding_config_edits_out/2026-09-29` confirms his typing (every path
reads `after`). Do not commit that plan.

## What shipped (S302)

- **#1750** sheet 3's rulings in their lanes; evidence rides each card.
- **#1751** Sierra Training: one Try it in button where CPL Assistant is hidden.
- **#1752** the priority cards read Demonstrated; the opt-in thank-you and note in Sam's words.
- **#1753** the explainer's funding note and heading on Sam's premise (card 6).
- **#1754** CR Reference: 88 varying groups named by topic and range.
- **#1756** draft 4 of the narrated video.
- **#1757** card 7's workflow, applier and test.
- `cpl_memory`: the sheet 3 rulings, the first-condition, NOVA and round 8 rows, and Sam's
  permission for the workflow.

## Read in order

1. This file. 2. [`implementation-funding`](reference/lanes/implementation-funding.md) lane.
3. [`cpl_funding_lessons`](cpl_funding_lessons.md), the three S302 sections.
4. [`decision_sheets`](reference/decision_sheets.md), the sheet 3 paragraph.

## Patterns that worked

- **Record every ruling in its lane in one PR, and drop every card**, so verdict PRs run in
  parallel without touching the builder.
- **The mockup harness is committed** (`prototype/mockup_harness/`; fixtures never committed, they
  hold MAP names).
- **A failing lint is a finding.** The docs-index test's frontmatter check caught a script that
  had erased the lessons doc (next section).

## Safety patterns

- ⚠️ **`open(p, 'w').write(rd(p) + more)` erases the file before it reads it.** S302's checkpoint
  wrote 847 bytes over the 113,895-byte lessons doc; it was rebuilt before merge. Read into a
  variable first, and compare a doc's size after any scripted write.
- ⚠️ **A workflow that writes Supabase with the service key needs Sam's permission first.**
- ⚠️ **Sam curates live**: re-read before any write; his saves win.
- ⚠️ **`first-light-art.yml` can commit its report onto a `claude/*` PR branch with `[skip ci]`**
  (it did on #1758 after a base merge), which leaves the head with no `test` run. Push the next
  real commit on top; never an empty one. And never write that token in a commit message:
  quoting it in the body skipped CI on S302's fix commit too.
- Docs still naming the old versions: `pipeline_reference.md` line 188 and `reflections/README.md`
  line 68 (setup-python@v6), and the edge-function playbook §3 (setup-cli v1's rate limit).
- ⚠️ **Background agents are this container's**: a new session cannot see their worktrees. Push WIP
  before a session ends.

## Carryover

Not refreshed: `kb/README.md` and `README.md` (no structure change), the Pipeline tab (no re-mint
landed; #1755 will move it), KB notes (none crossed the bar). The queue after the list above: card
11 (AUTB/AGAB, its own branch after #1755), the Jev cards 8, 9 and 10, the unit range's four
surfaces (To-Do `s301-fable-unit-range-rest`), and "Save and test" in the Sierra instruction editor
(it types into the hidden CPL Assistant input on a site that hides it; same fix as #1751).

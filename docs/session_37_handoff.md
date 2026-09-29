---
title: Session 37 Hand-off Prompt
date: 2026-06-09
session: 36 → 37 hand-off
status: hand-off — paste the fenced block into Session 37's first message
tags: [handoff, session-prompt, cer, eligible-credits, exhibit-cr-catalog, perf, crossdisc-remint]
related:
  - docs/kb-notes/reference-cpl-eligibility-and-exhibit-cr-catalog.md (eligible model + the Title-bridge gotcha)
  - docs/kb-notes/methodology-lazy-load-heavy-tab-data.md (the perf fix pattern)
  - docs/kb-notes/methodology-cron-as-discovery-window.md (reach MAP data via run logs)
  - docs/research_workexp_crossdisc_remint_scope.md (the cross-disc re-mint, applied)
  - docs/eacr_consolidation_lessons.md (Session 36 section)
  - CLAUDE.md §11 "Session 36" subsection
moniker_suggestion: Session 35 was unnamed; 36 (branch claude/stoic-bardeen-voov40) shipped the perf fix + cross-disc re-mint + the CER Eligible column — claim your own
superseded: true
superseded_by: session_132_handoff.md
---

<!-- Lineage: Lucid Wozniak (34) → CER consolidation (35) → Session 36 (perf +
     cross-disc re-mint + the CER Eligible-credits column from the Exhibit CRs
     Catalog, 6 PRs). Pay it forward, 37. 🏅 -->

# Session 37 Hand-off Prompt

Session 36 fixed a sluggish dashboard, minted cross-disciplinary identities for
Research + Work Experience, and closed the **3-session CER eligible blocker** by
wiring MAP's new Exhibit CRs Catalog into an "Eligible (units)" column. Paste the
block below.

## The prompt

```
You are Session 37 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md (all of it — Critical Rules 1/2/4/5, Rule 7 re-mint playbook, the
     Branch Policy auto-merge gates [merge on green = clean OR unstable], §6a/§9
     EACR, §11 framing + the NEW "Session 36" subsection at the end of §11).
  2. docs/eacr_consolidation_lessons.md — the Session 36 section.
  3. docs/kb-notes/reference-cpl-eligibility-and-exhibit-cr-catalog.md — the
     military-vs-non-military eligibility model + the Title-bridge gotcha (the
     ONE thing that bit us this session).
  4. docs/research_workexp_crossdisc_remint_scope.md — the cross-disc re-mint
     (applied: RSCH M1001 + WKEX M1001).

WHAT SHIPPED IN SESSION 36 (all merged to main):
  - #314 PERF: lazy-load ~17 MB of per-tab data (unified_courses_data 7.1 MB +
    statewide_data 6.6 MB + credential_reference_data 2.6 MB + statewide_
    prescriptive) only on first tab-open. Default Dashboard load 17 MB → ~1 MB.
    tabs.js onActivate/loadScript helpers; consumers boot lazily (defensive eager
    fallback when CPL_TABS absent). Generator stops eager-injecting the data tags.
    tests/lazy_tab_data.test.js. Sam confirmed "super fast".
  - #315 CROSS-DISC RE-MINT (Rule 7): minted RSCH M1001 "Undergraduate Research
    Experience" (folds MATH M1262 + 17 singletons; 10 cross-listed disciplines) +
    WKEX M1001 "Work Experience Education" (net-new; 2,190 members, 105
    disciplines). Both cross_disciplinary=true / "Interdisciplinary Studies";
    auditor EXEMPTS them (kb/_row_audit.py early-return); cross_listed_disciplines
    rides the MINTED RECORD (cron-safe — coci_curation.json is rebuilt from
    Supabase) with an xdisc_of() fallback. Alias receipt kb/crossdisc_out/
    alias_map.json. kb/_apply_crossdisc_remint.py (idempotent). The STOP_PATTERNS
    in kb/_seed_coci_minted_mids.py excluded the whole shell class — that's why
    work-experience was invisible.
  - #316/#317 DISCOVERY TOOLING: kb/_discover_map_datasets.py + a
    workflow_dispatch workflow — a Claude session can't reach the MAP hosts
    (egress allowlist), but a GitHub runner can, and Claude reads run logs. This
    is the "cron-as-window" mechanism (methodology KB note). It confirmed the
    catalog's grain + the ACE skill-level structure.
  - #318/#319/#320 CER ELIGIBLE + STUDENTS COLUMNS (the headline): MAP's Exhibit
    CRs Catalog (View_ExhibitCRsCatalog_Dataset — note _Dataset, NOT _APIDataset) →
    fetch_custom_report.py pulls it (lean 9 cols) → _rollup_exhibit_cr_catalog
    de-dupes (MAX per ExhibitID×SkillLevel×CR) + sums credit UNITS to the
    credential → "Eligible (units)" column with "credit waiting to be unlocked =
    eligible − transcribed". 1,726/1,994 populate; eligible ≥ transcribed 100%
    (verified end-to-end on the cron — e.g. Military Basic Training 11,528 / 0).
    #320 also sources the STUDENTS column from the catalog's TotalStudentsForCR
    (MAX per exhibit, summed across exhibits; <5-suppressed) — populates next cron.

THE TITLE-BRIDGE GOTCHA (reuse the lesson): the catalog keys exhibits by a NUMERIC
ExhibitID and INCLUDES military/ACE; View_ArticulatedMAPExhibits (our crosswalk's
source) keys by the MAP… STRING id and EXCLUDES military. Two id namespaces — a
naive ExhibitID join baked 0. The fix joins on exhibit TITLE → unified_title
(title_to_ut from the articulations' canonical exhibit_title). When a MAP dataset
won't join on id, check the id NAMESPACE before assuming a data problem.

PRIORITY / NEXT (in order):
  1. STUDENTS COLUMN — DONE + CONFIRMED LIVE (Sam, 2026-06-09: "Student count is
     working!"). Sourced from the catalog's TotalStudentsForCR (MAX per ExhibitID,
     summed across exhibits, <5-suppressed) because
     View_ArticulatedCollegeCourses.ExhibitID is the OTHER (numeric) namespace and
     matched 0 of 37,093 — same Title-bridge gotcha as eligible. ONE soft follow-up
     left: confirm the LABEL semantics with Sam — TotalStudentsForCR is a per-CR
     cohort count; is "Students" the right header, or does he want "eligible
     students" / "students served"? Not a blocker.
  2. ACE SKILL-LEVEL CHILD-EXHIBITS — data-CONFIRMED warranted (#316 probe: 3,013
     skill-leveled exhibits, 2,428 multi-level, per-level CR sets genuinely differ;
     e.g. Navy Operations Specialist OS1=6 CRs/OS2=5/OSC=8). Scope as an identity
     change (own scope doc, like the cross-disc one) before building: military
     decomposes by SkillLevel (parent ExhibitID + SkillLevel children, derived/
     reversible); non-military stays flat (empty SkillLevel). Don't infer
     individual eligibility from exhibits — that's JST-driven (deferred).
  3. STANDING CARRYOVER: the eligible-side refinements (Sam asked MAP to add
     SkillLevel+ACE-IDs to View_StudentAggregatedValues — NOT a current blocker,
     it unlocks the deferred JST individual planner + clean distinct headcounts +
     per-college eligible-by-exhibit); the College + System audience views (System
     needs the privacy ADR finished); EACR v2 scope; the Signal-B dedup leads.

PATTERNS THAT WORKED (Session 36):
  - "Cron-as-window": ship a read-only probe behind workflow_dispatch, Sam runs
    it, read the run log via the GitHub MCP. The session can't reach MAP; the
    runner can. (methodology-cron-as-discovery-window.md)
  - "Draft blind, let cron fetch": the egress allowlist blocks MAP, so build +
    verify the rollup on a SYNTHETIC column-oriented payload (kb/_verify_*.py),
    ship with heavy cron-log diagnostics, validate from the first real cron run,
    iterate. That's how the Title-bridge bug surfaced + got fixed fast.
  - Scope-before-building for re-mint-class work (AskUserQuestion to lock
    mechanism), measure-first dry-run, atomic land, V1–V4 + alias receipt.
  - Small PRs, merge on green (clean OR unstable). After each squash-merge:
    git checkout -B claude/<branch> origin/main, force-push-with-lease the next.

SAFETY PATTERNS TO HONOR:
  - NEVER commit PII (SEC-10). The CustomReport (student PII) is gitignored +
    fetched fresh on the runner; only aggregate, <5/<2-suppressed values are
    committed. pii_guard.test.js enforces it. Credit UNITS are not headcounts → no
    suppression; student headcounts ARE suppressed.
  - Rule 4: CPL_Dashboard.html == index.html byte-identical. Rules 1/2: don't
    hand-edit regenerated sections; preserve idempotency guards. Rule 5: never
    force-push main (the "Unverified noreply@github.com" stop-hook nag on GitHub's
    own squash-merge commits is a FALSE POSITIVE — never amend a main commit).
  - Feature branch + PR; auto-merge on green; Supabase kb_curation/
    allowed_reviewers only; no destructive migrations w/o sign-off.

Pipeline viz refreshed this checkpoint (the cross-disc re-mint moved it). A
moniker is yours to claim.
```

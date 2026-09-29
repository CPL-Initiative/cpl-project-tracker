---
title: Title-similarity merge candidates — the guard suite and the licensure-spec lesson
created: 2026-06-12
updated: 2026-06-12 (Session 46 part 2 — the guards now also gate the twin auto-merge tier)
kb-status: published
tags: [methodology, kb, consolidation, worklist, m-id, title-similarity, guards, ccr, licensure, twin-merge]
artifacts:
  - kb/_consolidation_guards.py (the shared guard suite)
  - kb/_title_consolidation_dryrun.py (the title-evidence lane; receipt kb/title_consolidation_out/candidates.json)
  - kb/_desc_consolidation_dryrun.py (imports the same guards since Session 46)
  - kb/_apply_twin_merge_statewide.py (the auto-merge tier — guards as a clique gate)
  - tests/uc_title_lane.test.js
related:
  - docs/ccr_cluster_cleanup_lessons.md (Session 45 + 46 sections)
  - docs/ccr_rules_brief.md (the plain-language contract, incl. the twin tier)
  - docs/kb-notes/methodology-within-credential-identity-consolidation.md (the ordinal rule / _fam_key)
---

# Title-similarity merge candidates — the guard suite and the licensure-spec lesson

## The failure class: licensure-spec over-mints

When a course implements an **external standard** (a state licensure spec, a
POST/STC module, an NWCG/NFPA curriculum), every college teaches the *same*
course but enters a *freehand* title and picks its *own* unit packaging. The
identity layer then over-mints: California BAR's Smog Check curriculum (~5
real course types) existed as **52 identities** — "Smog Check Training Level
2" / "Level 2 Smog Technician Training" / "SMOG CHECK II" / "Smog Check
Inspection Procedures" / "Bureau of Automotive Repair (BAR) Smog Inspector
Training II" — at 1.0–7.0 units for one spec.

Three properties make these invisible to exact-signature matching:

1. **Decoration tokens** (agency: "BAR", "Bureau of Automotive Repair";
   geography: "California State") break token-set equality but carry little
   identity. You cannot fix this with a filler stoplist — "California
   History" and "State and Local Government" prove geo words are sometimes
   load-bearing. **IDF weighting** fixes it structurally: decorations are
   mid-IDF, the content tokens ("smog") dominate the cosine.
2. **Unit packaging varies by college** for externally standardized content
   (POST modular academies: the same Module I at 7–21.5 units). A units gate
   appropriate for description evidence is WRONG for title evidence — show
   the spread (`units_spread`), don't gate it. (The exact-sig title lane
   never gated units either; near-title matching inherits that posture.)
3. **The same spec level is written many ways**: "Level 2" / "Level II" /
   "Level Two" / "II". Numbers must normalize across roman numerals AND
   cardinal word-numbers before marks are compared.

## The guard suite (kb/_consolidation_guards.py)

Pure functions of the title string; shared by the desc + title lanes so the
two receipt builders cannot drift. Every rule below was earned by reading a
naive run's actual damage, not by speculation:

- **Two-axis level marks.** Word-levels (beginning/elementary/basic=1,
  intermediate/second=2, advanced=3…) and digit-levels (digits, romans,
  word-numbers, A/B suffixes, context-marked session letters) gate
  **separately**, then the combined set gates. A flat set let "Elementary
  Portuguese 2" pair with "Intermediate Portuguese - Level 1" — both {1,2}.
  Per-axis: word {1}≠{2} blocks. The combined-set test still lets
  "Basic Peer Support" {W:1} block "Peer Support Training II" {D:2}.
- **Variant-type marks at STRICT equality** (refresher, update,
  supplemental, instructor, supervisor, module, modular, bridge, honors):
  asymmetric possession blocks. A Refresher is never its base course; an
  Instructor course is never the operator course; Honors is a distinct
  course (CCN's own `H` speciality identifier). Strict equality still lets
  "EMT-I Refresher" pair with "EMT 1- Refresher Course".
- **Year edition marks** (15xx–20xx, both-present-and-different blocks):
  catalog editions ("2019 Smog Check Update" ≠ "2021 …") and history
  periods ("US History to 1865" ≠ "… 1877 to Present"). Year-less ↔ yeared
  passes vacuously so cross-college editions still group.
- **Gender + sport marks** (inherited from the desc lane's first run):
  athletics template text is interchangeable across both.

Lane-local gates on top: same credit_status; **corroboration axis** —
same discipline OR same 2-digit TOP division (either suffices: a
mis-disciplined row still joins via TOP, e.g. "SMOG CHECK II" filed under
Auto Body); **≥2 shared content tokens** (kills the short-title trap:
"Lifeguard Cadet" + "Firefighter Cadet I" pairing on the lone rare token
"cadet"); not-same-sig (sig-equal pairs belong to the exact-title lane —
keep every sig function in lockstep when you enrich one).

## Clique-consistent components (the chaining leak)

Union-find over pairwise-gated edges still merges A–B–C where the A–C pair
violates a guard, because **vacuous-pass semantics make unmarked titles
bridges**: "Smog Check Inspection Procedures" (no level mark) pairs with
both Level 1 and Level 2 titles, chaining them into one blob. Fix: at union
time, admit the merge only if **every cross-pair between the two components
passes the hard guards** (cheap at worklist scale with a size cap). A size
cap alone is the blunt fallback (the desc lane's original design).

## Posture

These lanes produce **curator queues, never applies**. That changes the
precision/recall trade: contentful-difference damage that survives the
gates ("Acoustical Ceiling **Installation**" vs "**Layout**", "Indigenous
People of **California**" vs "of **Latin America**") is acceptable because
the titles are on screen at Confirm time and the curator unchecks — while a
recall miss (the gate that would have blocked 80% of the smog corpus) is
invisible forever. Gate only on what reliably marks a DIFFERENT course;
report (units spread, same-college) what merely warrants attention.

## The auto-merge tier (Session 46 part 2 — the twin merge)

There is exactly one tier where title evidence ACTS instead of suggesting:
the **strict twin merge** (`kb/_apply_twin_merge_statewide.py`; Session-39
authorization, statewide Session 46). Its admission is much narrower than
the lane's — token-identical titles (the ordinal-rule family key), same
SUBJ4, same discipline, same credit class, same units — and the guard
suite rides it as a **clique gate**: any mark conflict inside a twin group
sends the WHOLE group back to the worklist (no partial auto-merges). That
gate is load-bearing, not decorative — the family key drops "1" as
non-distinguishing, so "X Level 1 & 2" fam-equals "X Level 2", and the
two-axis level marks are what block it; the key also strips parentheticals,
so "(MEN)" vs "(WOMEN)" athletics twins are visible ONLY to the marks.

The general rule: **a queue and an apply can share evidence machinery, but
the apply tier must be strictly narrower AND guard-clique-consistent, and
its conditions belong in the public contract** (`docs/ccr_rules_brief.md`)
with an alias-map undo path. When a curator (or the project lead, in
writing) confirms a fuzzier family the auto tier won't touch, that
confirmation is recorded as ordinary `kb_curation` merges — never by
loosening the auto tier's key.

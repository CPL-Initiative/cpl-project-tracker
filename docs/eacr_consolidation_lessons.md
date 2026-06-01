---
title: EACR Consolidation + Master-Detail Gallery — Lessons
date: 2026-06-01
session: 27
tags: [eacr, exhibit-adoption, consolidation, master-detail, gallery, credit-recs, lessons]
artifacts:
  - statewide_interactive.js (consumer: buildCreditRecsHtml, buildCredentialView, sort)
  - excel_to_dashboard.py (_build_statewide_adoption, _parse_exhibits — Local+CCC merge)
  - fetch_custom_report.py (_build_headers — MAP auth pre-stage)
  - docs/kb-notes/eacr-consolidation-scope.md (the scope + 4-phase ladder + backlog)
  - docs/map_api_auth_handoff.md (MAP auth coordination)
related:
  - "[[docs/exhibit_canonicalization_lessons.md]]" (the Session-8 EACR re-pivot that preceded this)
  - "[[docs/kb-notes/methodology-versioned-prototype-gallery.md]]"
  - "[[docs/kb-notes/playbook-prestage-optional-external-auth.md]]"
---

# EACR Consolidation + Master-Detail Gallery — Lessons

Workstream scratchpad for the EACR (Exhibit Adoption & Credit Recommendations)
refinement that started from Sam's live screenshot review (Session 27). The
durable, distilled patterns are split out into KB notes (see `related`); this is
the workstream narrative + state.

## Session 27 (2026-06-01) — first checkpoint

### What shipped (all merged to `main`)
| PR | What | Side |
|---|---|---|
| #244 | **Credit-rec consolidation** — group recs by `(course title, units)`, local codes inline, **"💡 Typical CPL: ~N units (range a–b) · not the sum"** headline. + fixed the "undefined (N)" Issuing-Agency filter label. | consumer |
| #245 | **Sort** — cluster a credential's variants together (CompTIA A+ was scattered) + **sink 105 unclassified (4%) to the bottom**. | consumer |
| #246 | **Merge Local + CCC into one card** (CCC top billing) — drop `Collaborative Type` from the EACR key; `_parse_exhibits()` KPI moves in **lockstep**. 2,456→2,406 cards; CompTIA A+ 4→2; merged card unions to 21 adopters. | generator |
| #248 | **MAP-auth pre-stage + spec sheet** — optional `MAP_API_KEY` header (no-op until set) ahead of MAP's user-auth rollout. | infra |
| #249 | **Master-detail "Credential view" (v2)** — gallery: v1 table preserved, v2 = one card per credential, CCC/synth standard on top, variants sub-listed. 2,406→2,114 credential cards. | consumer |

### What's been learned
- **Consumer-side wins for testability + speed.** The raw CustomReport isn't in
  the session container (can't regenerate `statewide_data.js`), so display logic
  (consolidation, sort, master-detail) went **consumer-side** in
  `statewide_interactive.js` → testable via `node` logic harness against the
  committed data + **live the instant the PR merges** (no regen). Only the
  identity-grain change (Local+CCC merge, PR-2) HAD to be producer-side, because it
  also moves the headline KPI — and that one waits for the daily regen.
- **When you change a grouping key in the producer, move the KPI counter on the
  SAME key in lockstep.** PR-2 dropped `Collaborative Type` from BOTH
  `_build_statewide_adoption()` (the cards) and `_parse_exhibits()` (the "MAP
  Exhibits" KPI). Verified with a synthetic unit test that asserts
  `KPI.unique_exhibits == len(cards)`. Skip the lockstep and the headline number
  silently disagrees with the table.
- **Synthetic unit test rescues a regen-untestable producer change.** PR-2 couldn't
  be regen-tested in-session, so I `import excel_to_dashboard` and called
  `_build_statewide_adoption` + `_parse_exhibits` on a handful of constructed rows,
  asserting the merge + the lockstep. (Needed `pip install openpyxl pandas` for the
  import.) Confirmed correct on the real data only after Sam's regen (2,456→2,406).
- **The versioned gallery is the right delivery vehicle for a divergent view.** v2
  (master-detail) is a different paradigm from v1 (flat table); building it
  **additively** (v1 untouched, v2 behind a collapsed `<details>`) made it
  zero-risk to merge on green and let Sam compare side-by-side. See the methodology
  note.
- **Sam's design instincts re-derived the scope live.** His "sub-list Local under
  CCC" + "synthesize a flagged standard for no-CCC" were exactly PR-3 + the
  synthesized-standard we'd scoped — validation that the scope doc was right.
- **Decisions evolve mid-run; record the evolution.** Locked decision #1 ("keep CPL
  Type separate") was revised when Sam saw CompTIA Linux+ split by CPL Type — he
  wants CPL Type as a *tag*, not a card-splitter. The v2 master-detail delivers that
  visually; the full producer-side `cpl_type`-drop is the captured "full credential
  merge" backlog item. Flagged the revision on decision #1 in the scope doc.

### Current state
- v1 (table) + v2 (master-detail Credential view) both live in the gallery, sharing
  search + filters. PR-2's Local+CCC merge is live (post-regen). MAP-auth pre-stage
  merged + inert (waiting on MAP's credential). Spec sheet sent to MAP.

### Strategic roadmap
- **Next: PR-4 — the prescriptive layer (SCOPED, producer-side).** A background
  agent confirmed the data path at checkpoint time:
  - The EACR card carries `potential_names` as **plain college-name strings only**
    — no `course_id`, no per-college course. The prescriptive data lives in
    `kb/coci_articulations.json` (`adoption_leverage` = leverage college NAMES,
    47,994 total) + `kb/coci_minted_memberships.json` (`{college, subject,
    course_number, units, …}` per `course_id`). They **join on `course_id`**:
    leverage-college ⨝ memberships → that college's local `(subject, number, units)`.
  - **M-ID leverage (17,575 slots) resolves 100%** from committed JSON (verified on
    `CNST M1029` → Palomar `AP DL 728`, Rio Hondo `CARP 050T`). **C-ID leverage
    (~30.4k, ~63%) is deferred** — those per-college courses are keyed by
    `CIDNumber` in the 24 MB raw `coci_course_list.xlsx`, a heavier add.
  - **Verdict: PRODUCER-side.** The consumer can't bridge it (`statewide_data.js`
    has no `course_id`, and one `unified_title` fans to ≤89 `course_id`s). Build a
    new lazy file `statewide_prescriptive.js` (`window.CPL_STATEWIDE_PRESCRIPTIVE`,
    keyed by `unified_title`) in `_build_statewide_adoption()`; render a collapsible
    "Colleges that could adopt → likely matching local course" block per v2 card.
  - **Guardrails:** honor **over_merge** (skip prescriptive emission for any
    `course_id` flagged `over_merged`, per §6a); membership key `(subject, number)`
    is lossy → label recs "likely"; add `statewide_prescriptive.js` to the daily
    `git add`. **The JOIN is in-session testable** against committed `kb/*.json`
    (write a standalone verify script) even though the full regen isn't.
- **Then the 3 audience views** (Student / College / System) as further gallery
  renderers over the same data (per the scope doc).
- **Backlog** (`docs/kb-notes/eacr-consolidation-scope.md`): full credential merge
  (CPL Type as tag), **CCR inverse view** (one row per course → aligned exhibits),
  **CSR rollup** (one row per discipline → CPL opportunities, for faculty),
  curate-the-unclassified (CER triage queue), per-group college counts, mojibake nit.

### Next concrete step
Read the PR-4 scoping agent's findings → decide consumer vs producer for the
prescriptive layer → build it (v2 first, then graduate). If producer, mirror the
PR-2 pattern (synthetic unit test + regen-gated, Sam verifies live).

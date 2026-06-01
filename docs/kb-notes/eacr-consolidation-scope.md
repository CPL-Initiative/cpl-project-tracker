---
title: EACR card + credit-rec consolidation (Scope)
date: 2026-06-01
kb-status: published
kb-type: playbook
tags: [eacr, exhibit-adoption, consolidation, credit-recommendations, scope, generator, statewide, seeker-view, adoption-leverage, unified-courses]
related:
  - docs/exhibit_canonicalization_lessons.md (Session 8 — the EACR re-pivot to credential-identity grouping)
  - docs/session_27_handoff.md (the build queue this feeds)
  - CLAUDE.md §6a (CPL Analytics / EACR card grid) + §9 (EACR exhibit identity) + §11 (strategic queue items 5 EACR↔CER + student-eligibility)
artifacts:
  - excel_to_dashboard.py::_build_statewide_adoption (EACR producer — grouping key + credit_recs aggregation)
  - excel_to_dashboard.py::_parse_exhibits (headline "MAP Exhibits" KPI — shares the grouping key, MUST move in lockstep)
  - statewide_interactive.js (EACR consumer — credit-rec rendering + the "undefined" filter-label bug at :563)
  - statewide_data.js (generated EACR payload — gains the grouped credit-rec fields)
  - kb/coci_articulations.json (unified-course ↔ credential ↔ colleges join; adoption_leverage = the prescriptive layer; PR-3/PR-4 wire it into the EACR producer)
  - kb/_eacr_flag_migrate.py (the _EACR_FLAG merged_id alias migration — a no-op today, 0 flags)
---

# EACR card + credit-rec consolidation (Scope)

> **One-sentence summary** — Sam wants the Exhibit Adoption & Credit
> Recommendations tab to (1) merge a credential's Local + CCC cards into one
> (CCC top billing), (2) consolidate the long per-college credit-rec list by
> course-title + units with local codes inline, and (3) make the *realistic*
> award (≈3 units, not the stacked sum) obvious. This scopes the build, locks
> the three decisions, and confirms it is a **generator change, not a re-mint**.

## Context — the "bucket of CPL" problem

The EACR card for **CompTIA A+** today shows **four separate cards** and a
13-line credit-rec list that reads like a menu a student could stack. In
reality each line is *a different college's local mapping of the same
credential*, and a student at any one college earns ~3 units, not the sum.
Sam's three asks (from the 2026-06-01 screenshot review):

1. **Merge same-title cards** that differ only by Type (Local vs CCC), with
   **CCC taking top billing**.
2. **Consolidate the credit recs** — one row per common course, with the local
   course+number variants listed on the same row.
3. **Make the realistic award apparent** — the list shouldn't imply a "bucket
   of CPL"; surface that it's ≈3–4 units.

## The root cause (measured)

The EACR producer `_build_statewide_adoption()` groups raw MAP exhibit rows on:

```
group_key = (unified_title, issuing_agency, CPL Type, Collaborative Type)
```

Because **`Collaborative Type` is in the key**, CompTIA A+ fragments into 4 cards:

| Card | Collaborative Type | CPL Type | Adopters | Credit recs |
|---|---|---|---|---|
| CompTIA A+ | **Local** | Industry Certification | 9 | 13 |
| CompTIA A+ | **CCC Collaborative** | Industry Certification | 11 | 12 |
| CompTIA A+ | **Local** | Credit By Exam | 2 | 4 |
| CompTIA A+ | **Industry** | Industry Certification | 1 | 1 |

And `credit_recs` is a flat `[{course, credit}]` list deduped only on the exact
`(course, credit)` pair — so 12 colleges that all map the credential to a
~3-unit "ICT Essentials" course render as 12 separate lines.

**Quantified (from `statewide_data.js`, 2026-06-01 build):**
- 2,456 EACR cards total; 2,406 distinct `(unified_title, issuer, cpl_type)` groups.
- **46 credential groups span >1 `Collaborative Type` → dropping it collapses ≈50 cards** (2,456 → 2,406). Small count, high-visibility credentials.
- Merging CompTIA A+'s Industry-Certification cards: 30 raw recs → 27 unique `(course,credit)` → **15 consolidated rows** by `(title, units)`. Worst-case fold: *"Information and Communication Technology Essentials @ 3 units"* = **12 local course codes → 1 row** (CIS 101, CIS 104, CIT 110, INWT 100, …).
- Unit reality for that credential: **modal 3 units, range 2–6**. A "Typical award: **3 units**" headline corrects the misimpression instantly.

## Locked decisions (Sam, 2026-06-01)

1. **Merge scope → drop `Collaborative Type` from the key, KEEP `CPL Type`.**
   New key = `(unified_title, issuing_agency, CPL Type)`. CompTIA A+ → **2
   cards** (Industry Certification + Credit-by-Exam), not 1. Genuinely-different
   earning mechanisms (present a cert vs. pass a challenge exam) and their
   different unit awards stay distinct. *Not* a full per-credential collapse.
2. **Credit-rec consolidation → group by `(normalized course title, units)`,
   local course codes inline**, plus a "Typical award: N units (range a–b)"
   headline so the list reads as **alternatives, not additive**. (The deeper
   M-ID/C-ID course-identity grouping + the CCC-anchored master-detail + the
   prescriptive potential-adoption layers are captured in **Vision enrichment**
   below — Sam expanded the vision in the same session.)
3. **Sequencing → queue + this scope doc only; do NOT build yet.** Sam reviews
   the plan before any code ships.

## This is a generator change, NOT a re-mint

Sam's explicit question: *"would it initially be just a visual change or would
we need to re-mint anything?"* — **No re-mint.** Precisely:

- **No identity layer is re-keyed.** EACR cards are recomputed from scratch from
  raw MAP rows every daily run; the grouping key lives only in generator code.
  Dropping `Collaborative Type` = a code edit; the next regen emits merged
  cards. `unified_titles.json`, `credentials.json`, and every `coci_*.json` are
  untouched — the credential names don't change, the same rows are just bucketed
  differently. (The EACR producer reads only the credential KB, never the
  M-ID/course-identity layer.)
- **The headline KPI moves in lockstep — also generator-only.**
  `_parse_exhibits()` deliberately shares this exact key so the EACR card count
  matches the "MAP Exhibits" KPI. It must drop `Collaborative Type` too, or the
  two diverge. Still just a code edit.
- **The one persisted reference is empty.** Curator stale/dup flags live in
  Supabase as `_EACR_FLAG::<merged_id>`, where `merged_id` is the sorted join of
  a card's member ExhibitIDs. Merging enlarges that set → `merged_id` changes →
  an old flag *would* orphan. **But there are 0 EACR flags today** (verified via
  Supabase 2026-06-01), so even that migration is a no-op, and
  `kb/_eacr_flag_migrate.py` + an alias map already exist if flags appear before
  ship.

**Not purely cosmetic, though** (so it's not a surprise): merged cards carry
real new *numbers* — adopters become the **union** of the old Local+CCC cards,
potential is recomputed against that union, and the KPI's CCC-vs-Local split
shifts slightly (a credential that's both statewide-collaborative *and* locally
articulated now counts once, as CCC). That's **more accurate**, not a
regression, and fully reversible by reverting the code + regenerating. The merge
is really just *"stop splitting."*

## Proposed build — two independent PRs (consolidation first)

Recommended order is **PR-1 then PR-2**: PR-1 is the higher-value, lower-risk
half (it fixes the core "bucket" misimpression with no identity/KPI/flag ripple),
and the two are independent so this order creates zero rework.

### PR-1 — Credit-rec consolidation + "typical units" (asks #2 + #3) · LOW risk

Producer (`_build_statewide_adoption`):
- Move the `"N hours in <Title>"` parse from the JS consumer **into Python**
  (extract `units: float` + `course_title`). Unparseable strings group under
  their raw text with `units=None` (kept, never dropped).
- Aggregate per card into `(normalized_title, units)` buckets, tracking the
  set of **local course codes** and the **count of adopting colleges**
  (attribute via the row's `Articulation College`, `i_artic` — do NOT dedup on
  `(course,credit)` before counting, or college counts are lost).
- Emit new fields alongside the existing `credit_recs` (keep raw for the
  Word/Excel/JSON exports, or switch exports too — decide at build):
  - `credit_recs_grouped: [{units, title, courses:[…], colleges:N}]` (sorted by colleges desc, then units)
  - `typical_units` (modal), `units_min`, `units_max`, `n_distinct_mappings`

Consumer (`statewide_interactive.js`):
- Render `credit_recs_grouped` as `"3 units — A+ Certification Prep (CIS 212, CIS 213, …) · 12 colleges"`.
- Add a card headline: **"Typical award: 3 units (range 2–6)"**, framed as *"how colleges map this credential,"* not a stackable total.
- Retire the now-vestigial client-side credit regex.
- **Fold in the adjacent bug:** the **"undefined (N)"** filter button in the screenshot is the Issuing-Agency filter — its re-label map at `statewide_interactive.js:563` is missing the `issuer` key. One-line fix (`issuer: "Issuing Agency"`).

### PR-2 — Merge Local + CCC, CCC top billing (ask #1) · MEDIUM risk

- `_build_statewide_adoption`: drop `Collaborative Type` from `group_key`.
  Card type by precedence: **CCC Collaborative if any constituent row is CCC,
  else Local**. Surface the constituent collab mix in a sub-line/tooltip if
  useful. Adopters = union; potential recomputed against the union.
- `_parse_exhibits`: **same key change in lockstep** — `grp = (ut, issuer,
  cpl_type)`; a group is CCC if any of its rows is CCC; `local = all − ccc`.
  Keeps the EACR count == the "MAP Exhibits" KPI.
- `_EACR_FLAG` flags: re-check the live count at ship time; if >0, run
  `kb/_eacr_flag_migrate.py` with a fresh alias map (no-op at 0).
- Verify by running `excel_to_dashboard.py` locally (snapshot fallbacks; no
  Supabase key needed) and confirming idempotency (regen twice → only
  timestamp diffs) per Rules 1/2/4 — mirror `index.html`.

## Vision enrichment (Sam, 2026-06-01) — the seeker view + adoption engine

A design dialogue right after the scope landed expanded the vision well beyond
de-cluttering. Captured here as the **target end-state**; the exact
representation is **proposed / iterating** (Sam: *"we can get there in
iterations"*), but the data findings and the layout model are durable.

### Audience shift

The EACR stops being only an admin adoption tracker. It becomes three lenses on
one surface:
1. **CPL-seeker view** — *"If I hold this cert, what credit would I typically
   get, and in what range?"*
2. **Adoption cockpit** — who has articulated it (unchanged).
3. **Prescriptive adoption engine** — which aligned colleges *should* articulate
   it, and *exactly which local course* to map to.

This is the literal artifact a future **Student CPL Portal** would embed, so the
seeker framing is first-class, not cosmetic.

### Layout — CCC-anchored master-detail (Sam's proposal, refined)

A credential card becomes a **header + per-pattern local cards**:
- **Header = the standard.** When a **CCC Collaborative** version exists it is
  the authoritative anchor (*"🏛 Statewide CCC standard: N units → course"*).
  Sam: *"the CCC version will be set, so key off that when there is one."*
  **Validated** — every CCC articulation for CompTIA A+ agrees on 3 units → ICT
  Essentials.
- **When there is NO CCC version** (the common case — see findings), the header
  is a **synthesized "suggested standard"** from the modal local award
  (*"⚙ Suggested standard from N colleges: ~3 units → modal course"*),
  explicitly *not-yet-official*. This doubles as a **Model-Curriculum / CIDx
  submission candidate** (CLAUDE.md §11) — same modal-course computation.
- **Local cards grouped by articulation PATTERN, not raw college** (the
  refinement to Sam's "small local card per college"): colleges that award the
  cert identically collapse into one card listing its colleges, so CompTIA A+'s
  21 colleges → ~5 pattern cards, not 21.
- **Seeker headline:** *"Typically ~3 units (1 course); range 1–N courses."*
  Anchor on the CCC value when present; cap/flag outliers (CompTIA A+ has a 22u
  tail vs. a 3u mode).

```
WITH a CCC version (≈5% of credentials) — CompTIA A+:
┌─ CompTIA A+ · CompTIA · Industry Certification ───────────────────┐
│ 🏛 STATEWIDE CCC STANDARD:  3 units → ICT Essentials              │
│ 💡 You'd typically earn ~3 units (1 course). Range: 1–3 courses.  │
│  How colleges award it:                                           │
│   ▸ 3u  · ICT Essentials ......................... 11 colleges 🏛 │
│   ▸ 6u  · A+ Cert Prep: Hardware + Software ........ 1 college    │
│   ▸ 4.5u · Technical Support Fundamentals .......... 1 college    │
│   … +N more local patterns                                        │
└───────────────────────────────────────────────────────────────────┘

LOCAL-ONLY (≈94% of credentials):
┌─ [Local Cert] · [Issuer] · Industry Certification ───────────────┐
│ ⚙ SUGGESTED STANDARD (from 6 colleges): ~3 units → [modal course]│  (→ MC/CIDx candidate, §11)
│ 💡 You'd typically earn ~3 units; range 2–4u.                     │
│   ▸ 3u · [Course X] .............................. 4 colleges     │
└───────────────────────────────────────────────────────────────────┘
```

### Prescriptive layer — status per college + recommended course

Each local-college entry carries a **status**, surfacing the existing
adoption-leverage data:

| Status | Signal (already in data) | Card shows |
|---|---|---|
| ✅ Articulated | `earned_by_colleges` | actual local course + units |
| 🎯 Potential — aligned course | `adoption_leverage` (identity match) | **"you already teach [course = the standard] — recommend articulating to it"** |
| ○ Potential — aligned program | `potential_names` (TOP/CID match only) | "aligned program area — consider" |

The strong tier is the gold: *"you already teach the course the standard maps
to — one articulation away."* Naming the specific recommended local course needs
one more join (M-ID → that college's member course); the join that *produced*
the leverage list already knows it, so it's a surfacing step, not new logic.

### Data findings that shape it (`kb/coci_articulations.json`, 2026-06-01)

- **CCC is "set":** all CompTIA A+ CCC articulations agree (3u → ICT Essentials).
- **94% local-only:** only **90 of 1,726** articulated credentials (5%) have a CCC version → the synthesized-standard header is the **main** layout, not the fallback.
- **Per-college variance is real:** of 21 CompTIA A+ colleges, **17 award 1 course, 3 award 2, 1 awards 3**; modal 3u (tail outlier 22u to cap).
- **Prescriptive fuel exists:** **2,597** articulation records carry `adoption_leverage` (~**48,000** college×cert "should-articulate" opportunities); **413** `over_merged` records correctly **withhold** leverage.
- **Identity-fragmentation caveat:** CompTIA A+ resolves to **24 distinct M-IDs**, ~10 of which are the same "ICT Essentials, 3u" minted as separate single-college M-IDs. So grouping on the raw M-ID does NOT collapse them (24 rows) — **group local cards by `(normalized title, units)` today**, carry the M-ID/C-ID as enrichment, and let the EACR's visible fragmentation **feed the Suggested-merges worklist** (curation tightens identity → the EACR tightens automatically).

### Revised iteration ladder

| Phase | What | Depends on |
|---|---|---|
| **PR-1** | `(title,units)` credit-rec consolidation + "typical units" range headline (orig. #2/#3) | nothing — works today |
| **PR-2** | Merge Local+CCC, CCC top billing (orig. #1) | KPI lockstep + flag re-check |
| **PR-3** | Master-detail expand: CCC / synthesized-standard header + per-pattern local cards + seeker range | `coci_articulations.json` join (CCC flag, modal award) |
| **PR-4** | Prescriptive status per college (articulated / potential-aligned-course / potential-aligned-program) + recommended local course | `adoption_leverage` + membership join; over-merge guardrail |
| **later** | Replace the `(title,units)` heuristic with true identity grouping as stand-alone M-IDs get curated-merged; Student CPL Portal surface | curation throughput |

PR-1/PR-2 still ship first (low risk, immediate de-clutter); PR-3/PR-4 layer the
seeker + prescriptive value on top once the `coci_articulations.json` join is
wired into the EACR producer (which today reads only the credential KB).

## When this applies (and when it doesn't)

- **Applies** to display/grouping changes on data that is *recomputed from raw
  every run*. The "is this a re-mint?" test: does the change re-key a
  **persisted** identity (M-ID, credential, curation pointer)? If the only
  output is regenerated artifacts, it's a generator change, reversible by code
  revert — never a re-mint.
- **Does NOT apply** if a future phase grounds the credit-rec grouping in the
  **M-ID/C-ID course-identity layer** instead of `(title, units)` — that reads
  `coci_articulations.json` and is a heavier, separate phase (strategic item 5).
- **Watch:** any EACR grouping-key change is shared with `_parse_exhibits()`.
  They must always move together or the headline KPI silently desyncs from the
  card count.

## See also

- `[[docs/exhibit_canonicalization_lessons.md]]` — Session 8 re-pivot to credential-identity grouping (the prior change to this exact key)
- `[[docs/session_27_handoff.md]]` — the build queue
- CLAUDE.md §6a (EACR card grid), §9 (EACR exhibit identity + future unified-title layer), §11 strategic items 5 (EACR↔CER convergence) + student-eligibility counts on EACR

---

*Authoring check: durable (the re-mint-vs-generator distinction outlives this
task), reusable (the grouping-key-shared-with-KPI trap recurs), distilled (one
workstream), self-contained (frontmatter + opener tell a stranger the plan).*

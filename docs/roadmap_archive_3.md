---
title: CPL Project Tracker — Roadmap Archive, part 3
date: 2026-10-25
tags: [archive, roadmap, project-memory, session-history]
related:
  - docs/roadmap_archive.md (part 1, where new rotations land)
status: archive
---

# Roadmap Archive, part 3

The Session 44 to 111 narratives and the July funding-lane narratives, moved verbatim and in their original order from
[`roadmap_archive.md`](roadmap_archive.md) on 2026-10-25 (S474) so each file fits the 150 KB archive
budget. Parts 2 to 6 hold the body that sat between part 1's newest rotations at the top and its
2026-09-17-onward rotations at the bottom.

## Archived session narratives (Session 44) — moved 2026-06-12 (Session 46)

### Session 44 — Statewide Exhibits KPI card + program-area categories + KPI reorder (2026-06-11)

Sam's live feature day; 3 PRs, all merged on green + dispatched. **#375** new
**Statewide Exhibits** headline KPI card (CCC Collaborative / ASCCC focus — a
NEW card, not a revision of the adoption card, per Sam): exhibits + areas +
credit recs + adoptions, total/per-area; **distinct (course,credit) recs vs
row-count adoptions** semantics locked in the popover. **#376** rollup re-keyed
from TOP disciplines to the **map.rccd.edu/statewidecpl program areas** via
curated `kb/statewide_exhibit_categories.json` (merge-preserving seeder
`kb/_seed_statewide_categories.py`; `^`-anchored pattern fallback; "Other
Statewide" review bucket — State Bar + HRCM 001 parked for Sam) + **doublewide**
card (`kpi-card-wide` rides `EXHIBIT_ANALYSIS_CSS`, no Rule-4 mirror). **#377**
login-free **KPI card drag-to-reorder** (`kpi_reorder.js`, per-browser
localStorage, label-identity re-match across regens, ↺ reset) — strategic-queue
item 2. Full story: `docs/statewide_kpi_lessons.md`; pattern distilled:
`docs/kb-notes/methodology-user-vocabulary-category-maps.md`. Checkpoint #378.

## Archived session narratives (Session 45) — moved 2026-06-12 (Session 48)

### Session 45 — CCR rules day: statewide C-ID routing + the CADM homonym + the description lane (2026-06-11)

Sam's three asks, three PRs, merged on green. **#379** C-ID router **Phase 3
statewide** (gate removed): 8,377 members under 454 descriptors, 174 M-IDs +
1,682 stand-alones rfold; 0 members vanish, 125 invisible claimants
materialize; 4 MATH∧SOCI dual-approval stats courses un-route (scope-gates
must filter AFTER assembling the full approval set — scope §9). **#381** the
screenshot's `CRIM M1003` root-caused to the `CADM` college-homonym lexicon
entry laundered by the SUBJ4 re-key → `kb/_audit_subject_map.py` (TOP-division
votes + minority-title grading), **college-scoped subject_map entries**,
**retraction propagation**; 11 homonyms scoped, ~320 rows re-filled honestly
(CRIM M1003 → Drafting/CADD). **#382** the dark 86% (13,922 M-IDs, no official
evidence): TF-IDF description lane, level/gender/sport-guarded → **474 groups
(135 cross-college)** as the worklist's 4th section (`desc_groups`, receipt
`kb/desc_consolidation_out/candidates.json`, termly re-run). Suite 29/29.
Lessons: `docs/ccr_cluster_cleanup_lessons.md` (Session 45); KB note:
`methodology-college-homonym-subject-codes.md`.

## Session 46 — the AUTO/smog over-mint case → the 🏷 title-evidence lane + the STATEWIDE twin merge (2026-06-12)

Sam's brief: refine minting/merging rules off the AUTO over-mints (smog I/II),
then statewide. One BAR state spec = **52 identities**; all lanes combined had
surfaced 3 pairs. **#385**: `kb/_title_consolidation_dryrun.py` — IDF-weighted
title cosine over dark M-IDs **+ 54k stand-alones**, discipline-OR-TOP
corroboration, **NO units gate** (licensure specs pack 1–7u by college),
clique-consistent components → 6th worklist section (🏷); shared guard suite
`kb/_consolidation_guards.py`: **two-axis level marks**, **strict-equality
variant marks** (refresher/instructor/module/honors/lab), year-edition marks,
word-number folds (also `_sug_sig`/`_fam_key`). **#386** (Sam: "consolidations
that should happen — rule sharpening"): the Session-39 twin merge taken
**STATEWIDE** (`kb/_apply_twin_merge_statewide.py`) + guard-clique gate —
**589 token-identical twins absorbed** (16,143→15,554 parents; 65 groups
guard-skipped; curator targets honored; V-gates + promotions re-key + receipts
`kb/twin_merge_out/2026-06-12/`), **plus the Sam-confirmed smog merges**:
L1&2 → `AUTO M1001`, the 12-member Level-2 family → `AUTO M1007` (Supabase
`kb_curation` + overlay). `docs/ccr_rules_brief.md` amended — the strict twin
tier is the ONE title-based auto-merge, fully condition-listed. Smog: 52
identities → 9 queue families → **2 merged rows + 8 residual queue groups**.
Suite 30/30. Lessons: `docs/ccr_cluster_cleanup_lessons.md` (Session 46 +
part 2); KB note: `methodology-title-similarity-merge-guards.md`.

### Session 47 — Bruh Supernova: SUBJ ⇄ CCR error checking, the To-Do feed, the fold dry-run (2026-06-12)

Sam's asks, four PRs, all merged on green. **#388** the CSR "✓ Check SUBJ ⇄
CCR" sweep + live Common SUBJ input feedback (collision/in-use badges,
collision-free suggestion chips, confirm-on-collision); Sam cured **all 11
shared Common SUBJ codes the same morning**. **#402** the sweep's THEA false
positive (Drama/Theater Arts ↔ its alias "Theater Arts") → **alias-family
awareness** (`kb/discipline_aliases.json` joins the umbrella exemptions as
shared SUBJ4-consumer semantics); the needless DRAM re-code reverted with an
intent note. **#389** the 📋 To-Do button on every tab (`cpl_todos.js` +
`kb/cpl_todos.json` — the handoff distilled; Rule-8 item 9). **#405** the
SUBJ4 fold DRY-RUN: seed synced, `_subj4_dryrun.py` taught the umbrella
allowances (it predated them — was folding FL** back to FLNG + ATHL to KINE,
bursting KINE M1###), **71,710 M-IDs → 10,974 re-keys, 5/5 gates PASS**;
apply gate = 19 curated-collision buckets to approve. Suite 34/34. Lessons:
`docs/ccr_cluster_cleanup_lessons.md` (Session 47); KB note:
`methodology-subj4-consumer-semantics.md`. **NEXT: the receipted apply**
(one cron window, twin-merge re-run bundled) + the CCR Subject-dropdown
grouping (Sam yes'd; spec in `docs/session_50_handoff.md`).

### Session 48 (Bruh Glasstronaut) — First Light: the design sprint (daily plein air art LIVE + the theme spec BLESSED) (2026-06-12)

Sam's "personality" brief → a design system + a live feature; **13 PRs
(#391–#404; #402 was a sibling session's) merged same-day**. **LIVE:** `first_light.js` — once-a-day PD
plein air greeting (Redmond/LACMA + 2 Paynes; Commons hotlinks + fallback),
grayscale→color reveal, read-aloud (`speechSynthesis` — Huell declined on
publicity-rights grounds), reflection box → NEW Supabase **`cpl_reflections`**
(anon write-only RLS, verified as anon). **SPEC BLESSED (v1.4.2):**
`prototype/first_light_theme_v1.html` + `check_contrast.py` (derived AA
tokens — crimson `#920000` · cobalt `#0047AB` · hunter `#2C601A` · violet
`#6D28D9`; glass=chrome/opaque=data; **GLASS-QUIET uniform chips graduated at
session close** — translucent fill/no per-chip blur, gray outline, dark accent
labels, 6.5rem + `chip-fit`; solid family archived in the Chip Studio).
**NEXT: the live-dashboard token retheme — GO** (`docs/session_49_handoff.md`;
restyle checklist includes the To-Do chips + the CSR sweep chips, per the
sibling CCR/CSR session's note).
Lessons: `docs/first_light_lessons.md`; KB notes:
`methodology-derived-aa-token-palette`, `reference-public-domain-art-sourcing`.

---

### Session 49 (Bruh Orbitron) — the First Light retheme SHIPPED to prod (2026-06-12)

The v1.6 spec painted onto the live dashboard, three PRs merged + dispatched
same-afternoon: **#407** the palette flip (`:root` value-swap in BOTH HTMLs +
legacy navy/gold aliases remapped; contextual legacy-hex sweep across the
styleblock, body, `excel_to_dashboard.py` in Rule-1 lockstep, the College
Activity template, and ~20 JS assets; canvas/SVG get literal hexes — `var()`
doesn't resolve there; `check_contrast.py --live` CI lint + 27-pin
`tests/retheme_tokens.test.js`); **#408** glass chrome (masthead/rail/KPI
hero/filter bar) + the ghosted painting (`first_light.js` `.cplfl-bg`,
opt-out-aware) + `prefers-reduced-transparency`/`contrast` honored — dark
trend/College-Activity cards deliberately stay ink; **#410** glass-quiet
chips (CCR `.uc-badge`, CSR `.cs-badge`, CER `.cr-chip` — Generated rides
VIOLET now — To-Do FAB → cobalt). Word-docx/xlsx export branding + the
Element Map deliberately untouched. Lessons: `docs/first_light_lessons.md`
(Session 49); KB note: `methodology-token-retheme-on-generated-html`.
**NEXT (design lane): `docs/session_52_handoff.md`** — Sam's screenshot
verdicts, kpi_reorder keyboard path, per-tab polish.

### Session 50 — Bruh Dawnleader: the SUBJ4 canonical fold APPLIED (2026-06-12)

The Rule-7 apply of dry-run #405, one PR, landed in the evening cron window.
**71,037-alias permutation, 48,820 id moves** (10,974 SUBJ4 re-keys + bucket
re-sequencing) across minted/singletons/memberships/articulations/curation +
**119 Supabase ops** (md5-verified, PK-order simulated); plan recomputed at
apply == frozen reviewed plan byte-identical (`compute_plan()` shared with the
dry-run); post-fold twin pass +19 (15,535 parents); chain
(`kb/_post_apply_chain.py`): promotions 1,678 re-keyed/0 unresolved/V5 clean,
CSR re-seed, audit — **`subject_collision_signal` 1,206 → 3** (documented
baseline-vs-overlay residuals), `mid_id_off_scheme` → 1; receipts re-run (415
desc / 5,581 title); fold-verify re_key 0; suite 34/34 (title-lane pins →
mechanism-style). Receipts `kb/subj4_fold_out/2026-06-12/`. Full story:
`docs/ccr_cluster_cleanup_lessons.md` (Session 50); KB note:
`methodology-apply-equals-spec-via-shared-allocator.md`. **NEXT: the CCR
Subject-dropdown grouping** (`docs/session_51_handoff.md`).

## Session 51 — Bruh Photonicus: KIN/PE pass 2 + the merging night (2026-06-12) — archived 2026-06-13 (Session 54)

Sam-interactive (his CCR/CSR screenshots + 5 live follow-ups). PRs #412–#415.
**Root cause repaired:** the 2026-06-10 fan-ins never re-pointed the inference
lexicons → re-derivation resurrected "Physical Education" (605 rows → Sam's PEDU
pin) + "Theater Arts" (147). Lexicons re-pointed (bare `intercollegiate` DROPPED),
`kb/_alias_canon.py` guards all 4 passes, `kb/_kin_pe_pass2.py` re-keyed **1,057
ids** (PEDU dissolved; refined athletics rule = modal TOP 0835.50 minus
instruction-exceptions → 552 rows to ATHL; flips stamped manual). 19,739 titles
normalized (Title Case / romans→digits / "(formerly…)" cut); **205 curation
merges** mirrored to Supabase (26 roster families + Sam's fitness set + 35
HS-title folds; analysis receipts `kb/kin_pe_pass2_out/2026-06-12/`). #415 fixed
the lost-worklist-saves bug (overlay fetched only discipline rows) + added
**Keep-as-is** + CCR Subject optgroups; #414 the CSR tweaks; #413 re-pinned the 6
post-fold-stale test files (35/35). Full story:
`docs/ccr_cluster_cleanup_lessons.md` (Session 51); KB note:
`methodology-fanin-alias-lexicon-contamination.md`.


## Session 53 — Bruh Infinitus: auto-merge pass 1 + Sam's UI batch (2026-06-12 night) — archived 2026-06-15 (Session 55)

Sam-interactive. PRs #418–#424, all squash-merged + published same-hour.
**AUTO-MERGE PASS 1 APPLIED** (Sam reviewed ~80 of 9,087 worklist groups →
"auto curate"): `kb/_auto_merge_worklist.py` planned the dependable lanes
ONLY (anchored + cross-college singletons; gates: band purity caught 325
credit/noncredit mixes, same-college 214, dismissals honored) → **2,272
groups / 5,838 rows applied 5,838-for-0-conflicts** via SHA-pinned md5-gated
server-side insert; cohort `reviewer_email='automerge-v1@bot'` (revert =
delete the cohort); receipts+apply_log `kb/automerge_out/2026-06-12/`.
Also: worklist popup chrome (#418 drag/✕/proposal framing), 4 stale test
re-pins post-regen (#419), KPI consolidation + Veteran ⭐/JST + quickstart
width (#420), mojibake repair + `kb/coci_title_corrections.json` queue +
CCR "fix in COCI" chip (#421). Lessons: `docs/ccr_cluster_cleanup_lessons.md`
(Session 53); KB note: `playbook-gated-bulk-autocuration.md`.

### Session 54 — Bruh Spaceranger: the auto-merge cohort made reviewable (2026-06-13)

PR #428 (merged + dispatched + LIVE). Follow-through on Bruh Infinitus's
auto-merge night: **verified** the overnight regen (941 `UC-CUR-AUTO*` mints +
1,331 anchored = 2,272 targets / 3,588 folds, exact match to the receipt;
worklist 9,087 → 6,583, **title lane 5,457** the big remainder; suite 43/43),
then **surfaced** the cohort for one-click review. Generator stamps each merge
target with `auto_n` (count of folds from `reviewed_by=='automerge-v1@bot'`,
>0 only, in the single `merge_members` loop); consumer renders an amber **⚙
auto-merged** chip (distinct from cobalt `⛓ merged`) + a **row-level "Auto-merged"
Triage lane** (works without sign-in/audit overlay; QS_TRIAGE deep-linkable).
Code-only PR; verified end-to-end via an isolated `export_unified_courses()`
run (2,272, 0 leakage), then artifacts restored + cron-dispatched. Pipeline tab
`#pl-section-remint` refreshed (both HTMLs). jsdom test
`tests/uc_auto_merged_chip.test.js` (14). **Correction:** the ceramic-tech
To-Do was imprecise — "Ceramic Technology" IS an MQ name; `skip_unknown_disc`
fires from the SUBJ4 fold's `discipline_canonical_subj4.json` (148) lacking it
→ a curator pick (surfaced to Sam). Lessons: `docs/ccr_cluster_cleanup_lessons.md`
(Session 54). **NEXT: `docs/session_55_handoff.md`** (title-lane pass-2 DRY-RUN
on Sam's go; per-row revert affordance; MilStudents wiring).


### Session 55 — Bruh Nebula: Suggested-merges clarity + the UC-CUR→Z scope (2026-06-15)

Sam-interactive (his two CCR worklist screenshots). PRs #434–#437, all
squash-merged. **Worklist UX, from Sam's confusion:** (#434) the surviving
identity now wears a **★ merge target** badge (§10 CCN>C-ID>M-ID>Unified pick,
live as checkboxes toggle, reference-equality so duplicate-id rows don't both
light) + a dynamic note that spells out the 2-candidate case; (#435) the
**self-merge ghost groups** — a promoted singleton re-offered as its own orphan
(member id == anchor id) — fixed in `export_unified_courses()` (skip singletons
whose id is already a payload row; **20→0** anchored ghosts, verified live), and
the **Discipline picker** now disables + explains itself (it's only written on a
fresh mint, silently ignored on a merge-into); (#436) a **"⌕ merge into a
different existing course"** search picker reusing the `⚇ Unify` index — fold the
group into ANY identity the title-signature grouping won't surface (e.g. a real
Anatomy & Physiology C-ID). Suite 44→47. **Sam's UC-CUR→Z decision (#437, SCOPE
only):** rename the 4,053 synthetic `UC-CUR-*` ids to `SUBJ Z<band><seq>` (e.g.
`BIOL Z9001`; Z = curator-minted, needs attention) — **full re-key**, but the
blast radius is **entirely inside curation** (4,053 targets + 4,053 title rows +
10,682 `merge_into` pointers; **0** articulations/promotions). Scope:
`docs/uc_cur_zscheme_remint_scope.md`.

### Session 56 — Star Treader: the UC-CUR → Z-scheme re-mint, APPLIED (2026-06-15)

PR #439 (merged + both workflows dispatched + LIVE). Built the Z-scheme dry-run,
Sam said **"Go now,"** and landed the full Rule-7 re-mint same window. The 4,053
synthetic `UC-CUR-AUTO*` ids → `SUBJ Z<band><seq:03d>` (e.g. `BIOL Z9001`;
**Z** = curator/auto-minted Unified, needs attention — parallel to `C`/`M`).
SUBJ4 = canonical of members' modal discipline **with the umbrella exception**
(FL/KIN keep their split codes, never collapse to FLNG/KINE); band 9/1 from
credit_status; persisted counter `kb/uc_cur_zseq.json` (option B). Dry-run 7/7
gates; `compute_plan()` shared by dry-run + apply (apply == spec). Surface was
**entirely inside `kb_curation`** (4,053 self-keys + 10,682 `merge_into`; **0**
articulations/promotions), **fresh-read md5-verified git…live** before writing.
Live Supabase re-keyed via a new **reusable** service-key path
(`kb/_rekey_kb_curation_supabase.py` + `.github/workflows/supabase-rekey.yml` —
the alias map is too large to hand-pass as SQL; read the committed file in
Actions), verified by md5 (0 UC-CUR, 4,053 Z); then `daily-dashboard.yml`
regenerated the overlay + `unified_courses_*.js` (4,053 Z rows, all `id_system`
Unified, 0 leakage). Coupled consumer/auditor recognition shipped in the same PR
(a `Z` target had been mis-classified as a C-ID). Tests:
`tests/uc_zscheme_recognition.test.js` (8) + `tests/uc_cur_zscheme_dryrun_test.py`
(12); suite 48 green. **Deferred** (graceful, no runs scheduled): auto-merge
mint → Z + the client-mint promote-step (new UC-CUR mints still work via dual
recognition); the auditor re-run (Z rows show no audit chip until `kb/_row_audit.py`
re-runs). Lessons: `docs/ccr_cluster_cleanup_lessons.md` (Session 56); KB note
`docs/kb-notes/playbook-rekey-shared-db-from-alias-map.md`.

## Archived session narrative (Session 57) — moved 2026-06-18 (Session 61)

### Session 57 — Bruh Skydriver: worklist polish + the consolidation loosening (2026-06-16)

Sam-interactive (his "Voice (NC)" worklist screenshot). Two merged PRs, both
dispatched + LIVE. **#441 — the worklist popup + CCR:** count "N of M" moved into
the title bar (subtitle + "drag to move" dropped); the proposed title now prefers
the ★ target's **cleaned** name (new client `cleanTitle()` strips "(NC)"); a
per-candidate **ⓘ description toggle**; the Discipline field shows the inherited
disc / **pre-selects the modal member disc** on a mint (generator emits per-member
`d`); CCR course-ID column wraps/clips instead of overlapping the title. **"(NC)"
cleanup** (data half): `_normalize_common_titles.py` gained a noncredit-paren strip
(110 singleton titles; meaningful parens like (BIM)/(FSVP) kept) — the auto-merge
worklist auto-cleans future mints via the shared `regularize_title()` — and the 13
bot-minted curated `unified_title`s carrying the noise were stripped in **Supabase
`kb_curation` + the snapshot** (all `automerge-*@bot`, no human text). **#442 — the
consolidation push:** Sam chose to **loosen the existing lanes** (over the measured
opt-in-lane option), so `_sug_sig` went **level-SAFE → level-COLLAPSING** (folds
the level axis: level words, roman/word/digit ordinals, a–h section letters) — the
worklist now merges across levels by default. Suggestions-only / curator-confirmed
/ reversible. Worklist regrouped **229→2,665 anchored, 217→2,519 singleton**
(other lanes unchanged). Measure-first evidence committed: `kb/_similar_family_
dryrun.py` (7,849 families, 99% disc-unanimous; receipt gitignored — regenerable).
Suite 48→49. **DEFERRED** (its own measured PR — `kb/README.md` mandates measuring
member-row flips first): the member-join **Jaccard 0.5→~0.4**. Lessons:
`docs/ccr_cluster_cleanup_lessons.md` + `docs/similar_course_family_scope.md`; KB
note `docs/kb-notes/adr-level-collapsing-consolidation.md`. **NEXT:
`docs/session_58_handoff.md`** — the Jaccard measurement; work the 10× bigger
worklist; title-lane pass-2 still open.

## Archived session narrative (Session 58) — moved 2026-06-18 (Session 62)

### Session 58 — Bruh Skyleader: Suggested-merges deep refinement (2026-06-16)

Sam-interactive (Algebra then ESL worklist screenshots). **Three code-only PRs**
(cron/dispatch republishes artifacts). Full story:
`docs/ccr_cluster_cleanup_lessons.md` (Session 58 + cont.).
- **#445 — override-rename + segment-fold + completion note.** Picking a
  NON-official course in "⌕ Merge into a different course" pulls its cleaned title
  in **editable** (renames the target on Confirm; official stays firewalled);
  `_SUG_SEGMENT = {part,semester,module,half,level,levels}` folds divider words so
  "Algebra 1-2, Semester 1"/"…, Part 1"/"Algebra 3-4" group under one `algebra`
  sig; new `merge_note` curation field (⚑ chip + ⓘ-modal line) for "both parts
  required for full credit" on segmented mints.
- **#446 — synonym map + keyword-gather.** `kb/synonym_map.json` normalizes
  abbreviation↔expansion (ESL≡English as a Second Language, ASL/PE/Math/AJ) in
  `_sug_sig` — **a similarity threshold can't bridge a zero-overlap synonym**
  (ESL→84, ASL→60, PE→18; global flat). The popup ➕ **keyword-gather** lets the
  curator search + multi-select extra members (the broad-family judgment).
- **PR-B — looseness slider.** 🏷 "match strength ≥ X" header slider filters the
  title lane by weakest-pair cosine; lowered the title dry-run `COSINE_MIN`
  0.62→0.50 + regenerated the receipt (5.9MB→2.0MB — it was stale), default 0.62
  = no-op, slide to 0.50 reveals ~1.3k weaker groups. The slider rides the title
  lane because it's the ONLY continuous-score lane.

Measure-first: `kb/_sug_segment_dryrun.py` (synonym-aware). Tests 48→53
(override-rename, keyword-gather, looseness-slider). **NEXT:
`docs/session_59_handoff.md`** — member-join Jaccard 0.5→0.4 (measure first).

### Session 61 — Bruh Skymarker: the per-college approved-ADT overlay (2026-06-18)

Sam-interactive. The COCI **program** export (the 2nd COCI principal set —
alongside the *course* set we already had) is now in the library as the
**authoritative approved-ADT source**. **PR #458** (merged + LIVE):
`tmc/_build_college_adts.py` → `tmc_college_adts.js` (lazy) — **3,238
(college,TMC) pairs · 115 colleges · 42 ASCCC TMCs + UCTP**, mapped **99.9%**
via TOP-code-corroborated title match. The TMC tab now stamps a per-college ADT
status onto every TMC: a directory **ADT column** (✓ Approved / ⏳ In progress /
◐ Teachout when a college is picked; the **statewide approved-college count** in
review mode), a detail **status banner** (`adtBannerEl`), and a **"this college's
approved ADTs / not yet established"** filter. **UCTP** (Chemistry/Physics *for UC
Transfer*, sub-award "A.S. UCTP Degree") = its **own instances** (`extra_tmcs`,
`renderPathwayDetail`), never folded into the Chem/Physics ADT (Sam's mid-build
call). "Approved" = STATUS ∈ {Active, Approved}; PH-Science + ETE-plain fold;
Inactive hidden. Tests 55→56 files. Sam's **taxonomy** ask → ADR: keep college
names **committed JSON**, Supabase only for live curation. Full story:
`docs/tmc_builder_lessons.md` (S61); KB notes
`adr-reference-data-committed-json-vs-supabase` +
`methodology-coded-key-over-freehand-text-join`. **NEXT:
`docs/session_62_handoff.md`** — faculty-verify the drafts + the taxonomy
follow-up (`college_short_names.json` hardening).

## Archived session narratives (Sessions 63–64) — moved 2026-06-20 (Session 66)

### Session 63 — SkyGate: the KB Portal (transplant → login-gated tab → composer) (2026-06-19)

Sam-interactive, fast loop; a side-quest off the data/TMC lanes. Five squash-merged
PRs built the **KB Portal** end-to-end: **#464** transplanted the self-contained
`kb-portal/` bundle (a Supabase-magic-link reader over the public KB) into the tracker;
**#465** wired it in as a login-gated **Knowledge Base** tab (`<iframe src="kb-portal/">`
in BOTH HTMLs per Rule 4, like Letters; `tabs.js` auto-derives it); **#466** the **✍️
New-doc composer** (draft → ✨ Claude polish → tokenless GitHub create-file deep-link,
author commits as themselves — no write token in the app); **#467** a **← Dashboard**
back button (`target="_top"` to escape the iframe); **#468** **attachment upload**
(text/PDF/Word/Excel/images → in-browser pdf.js/mammoth/SheetJS extraction + image
downscale, dodging the proxy's 256 KB cap). Gate = the bundle's own allowlist
(`slee@cccco.edu` + `malone.dunlavy@rccd.edu`; `map@rccd.edu` deliberately OFF — it can
reach private CPLBrain). Tests 56→58 files. Full story: `docs/kb_portal_lessons.md`;
2 new KB notes (embed-bundle-as-tab playbook + browser-doc-capture methodology).
**NEXT: `docs/session_64_handoff.md`** — Sam smoke-tests the 5 attachment types (fix any
esm.sh lib path); the bundle-divergence decision (backport vs canonical); then the
standing data/CCR + TMC lanes resume.

### Session 64 — Startripper: the retired-model 502 fix + the CCR/CER recommender kickoff (2026-06-19)

The CPL Assistant (and the shared `map.rccd.edu` widget) was 502ing on **every** turn —
the `cpl-chat` Edge Function called `claude-sonnet-4-20250514`, which Anthropic
**retired 2026-06-15** (404 → the `!anthropicRes.ok` guard's 502). Swapped to
**`claude-sonnet-4-6`**, **deployed live as v15** (`verify_jwt:false`), PR #471; repo
swept — no other feature on a retired id. New note:
`docs/kb-notes/playbook-edge-function-502-retired-model.md`. Then a strategy session
with Sam kicked off a workstream (scope **PR #472**): make this assistant the
**CCR/CER-grounded recommendation reference + real-time benchmark** for the MAP Student
Portal bot, + a per-college **demand signal** on the college CPL Landing Sites — full
scope + locked decisions D1–D5 in
[`docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md`](docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope.md).
Full story: `docs/cpl_assistant_lessons.md` (S64). **NEXT: `docs/session_65_handoff.md`**
— build the CCR/CER/adoption ETL into shared Supabase (green-lit), then M1; the standing
data/CCR + TMC + KB-portal lanes resume.

### Session 66 — Skylander: TMC → a CO-staff ADT review tool (split · scope · rules · template metadata) (2026-06-20)

A Sam-directed pivot into the **TMC Builder** lane, building toward a Chancellor's-Office
ADT **review/processing tool** (it replaces the manual PDF-vs-PDF course-by-course diffing
CO staff do today). Three PRs: **#477** split the COCI program status into **✓ Active**
(live in the catalog) vs **✓ Approved** (CO-approved, pending activation) — 2,867 active /
218 pending across 40 TMCs (previously invisible). **#478** the scope
([`tmc-co-review-scope.md`](docs/kb-notes/tmc-co-review-scope.md)) + the **ASCCC acceptance
ruleset** distilled ([`reference-adt-acceptance-rules.md`](docs/kb-notes/reference-adt-acceptance-rules.md));
Phase-0 joins VALIDATED on 4 colleges (PCF `Program Control Number` = 100%, course-join
90–95%, C-ID coverage 51/29/8/0% — but **non-C-ID ≠ non-compliant**). **#479** the
**acceptance metadata** on `tmc_templates.js` (`refine_slot()`): **119 flexible slots**
flagged, per-TMC **`flexibility:fixed|flexible`**, 15 embedded C-IDs recovered (African
American Studies 0→3 — the only empty template, fixed). Full story:
[`docs/tmc_builder_lessons.md`](docs/tmc_builder_lessons.md) (S66). **NEXT:
[`docs/session_67_handoff.md`](docs/session_67_handoff.md)** — build the Phase-2
**acceptance engine** (Sam: "Go for A!") + the bulk-PCF Playwright extractor.

### Session 67 — Skywatch (nick SkyMurrow): the CPL News lane (2026-06-21)

A Sam-commissioned, **unattended** CPL News tab (`#cpl-news`): the `cpl-news-harvest`
Edge Function (Google News / GDELT / CalMatters / CCCCO / Bluesky + a manual
suggest-a-story queue for closed socials via OpenGraph) → Claude triage →
`public.cpl_news`; `cpl-news.yml` cron 13:17 UTC; `cpl_news.js` live-reads it (CA-first).
First run: **12 CA items, avg rel 0.84** (Career Passport launch, CCCCO earn-and-learn, CA
budget). Capability-probe auth; harvested news also auto-flows to the CPLBrain vault digest
(`05-knowledge/cpl-news/`); the **public KB stays human-gated** (not auto-written). PRs:
**#481** (tracker), CPLBrain #9. Full story:
[`docs/cpl_news_lessons.md`](cpl_news_lessons.md) + the reusable
[`docs/kb-notes/playbook-cpl-news-aggregation.md`](kb-notes/playbook-cpl-news-aggregation.md).

### Session 68 — SkyAlizarin: spotty-cron fixes + the COBI masthead consolidation (2026-06-22)

A live UI+ops session. **Ops (both merged):** the daily refresh was "spotty" — measured
~25 runs and found GitHub's scheduler **delays** this cron 1.5–4h (not drops), so it
published mid-morning; pulled it **earlier + a 3rd cron** → the **06:17/09:17/12:17 UTC
ladder** (#485, Rule 1 + §6 updated). Then found the real miss-cause: a transient Supabase
TLS blip in `kb/_apply_curation.py` (the one unguarded sync call) aborted the *whole*
publish → **retry + non-fatal guard** (#486); today re-dispatched + current. **UI (PR #487):**
the **COBI masthead → a single-row app bar** (seal + COBI`CPL` / tagline · centered
**"Where To?"** search · subtle **ℹ About** popover + **Manually Refresh COBI**); Mamba
retired, gold CPL superscript, COBI in seal-navy. Ported **regen-safe** (anchor-parked
generator + CSS-from-JS; idempotent, −159 blank lines). Method:
[`docs/kb-notes/methodology-regen-safe-section-rework.md`](kb-notes/methodology-regen-safe-section-rework.md);
full story: [`docs/cobi_lessons.md`](cobi_lessons.md).

### Session 69 — Stargaze: TMC title-fill + the CCR polish sweep (2026-06-23)

A TMC + CCR polish sprint, Sam live throughout — 6 small tested PRs + 2 scope docs, all
merged. **TMC:** title-fill pre-fills a college's blank C-ID slots from title matches for
approved **and** in-progress ADTs (#489/#490, `≈ verify`), Status folded into the ADT
column; + the **COR-upload scope** (#491 — TMC tab as the ADT-intake that mints structured
data + the missing per-course **contact hours**; submitting-college uploads to a private
Storage bucket; [`docs/kb-notes/tmc-adt-document-upload-scope.md`](kb-notes/tmc-adt-document-upload-scope.md)).
**CCR (`unified_courses.js`):** filter bar — Search leads + wider, **"Generated by" filter
removed** (the ⚙ provenance badge stays), Subjects narrowed (#492); flag chips →
**`+ NC` / `+ CR` / `NC type`** (#493); **Disciplines legend** — local-subject rollup +
chip legend + homonym caveat (#495); **Suggested-merges search** (#496). + the
**unverified-M-ID renumber re-mint scope** ([#494](unverified_mid_renumber_scope.md) —
full Rule-7, unverified-only, close-gaps+re-sort, one pass *after the merge wave settles*)
and the live-merge durability note
([`reference-ccr-curation-sync-and-live-merge.md`](kb-notes/reference-ccr-curation-sync-and-live-merge.md)).
Full stories: [`docs/ccr_cluster_cleanup_lessons.md`](ccr_cluster_cleanup_lessons.md) +
[`docs/tmc_builder_lessons.md`](tmc_builder_lessons.md) (Session 69).

### Session 70 — PaintSky: the CCR merge workspace, leveled up (2026-06-23/24)

A long, live CCR-curation session — **9 PRs**. **First half (#500):** the **Pending-merges
tracking panel** (the `⟳ N edits awaiting sync` badge → a **📋 Review merges** click-through
with per-member/group **Undo**), a **mint → Common SUBJ preview** in the worklist, a
reviewer-gated `kb_curation` **DELETE** policy, and re-landing the **empty-squashed #499**
(KB note `methodology-stacked-pr-empty-squash.md`). **Second half — the merge workspace arc**
(Sam digging into Disciplines/Subjects/merging): **#503** re-discipline ON the merge dialog +
a **forward-looking Common SUBJ** column (curated discipline → shows its canonical `PHOT ⟲`
immediately; M-ID letters re-key at the next fold; KB note
`methodology-forward-looking-display-curate-now-rekey-later.md`); **#504** fixed the merge
search-add silently no-op'ing; **#505** Beg/Int/Adv/Lab/WkExp **band filters**; **#506** a
global **Conservative↔Aggressive slider** (replaced the title-only one; gates all scored
lanes, evidence exempt); **#507** **opt-in checkboxes** (only the ★ target pre-checked);
**#508/#509** the **morphological-variant fold** — `_sug_sig` now stems tokens
(conversation/conversational→conv, …; measure-first dry-run sized it: **+866** identities into
groups, 326 clean / 246 cross-discipline) + an amber **"⚠ Spans N disciplines"** worklist flag
for the homonym risk (workflow-dispatched live). Two architecture asks captured for the epic:
**dock the worklist as a panel** + **consolidate the two merge popups into one shared editor**.
Full story: [`docs/ccr_cluster_cleanup_lessons.md`](ccr_cluster_cleanup_lessons.md)
(Session 70). **NEXT: [`docs/session_71_handoff.md`](session_71_handoff.md)** — the
merge-workspace epic (scope-first), then the unverified-M-ID renumber re-mint + TMC engine.

### Session 71 — the CCR merge-workspace epic, completed (2026-06-24)

Executed the Session-70 epic end-to-end — **6 PRs, all merged**. The CCR had **two** merge
popups (the per-row ⚇ `openUnifyDialog` + the ✨ worklist `renderGroup`) that had **drifted**,
causing several Session-70 bugs. Now they are **one shared `buildMergeEditor(container, opts)`,
two feeders**: **#511** scope ([`docs/ccr_merge_workspace_epic_scope.md`](docs/ccr_merge_workspace_epic_scope.md));
**#512 PR-1** extract the editor, worklist embeds it (byte-identical DOM, parity); **#513 PR-2a**
hoist it to `init` scope with a `deps` contract; **#514 PR-2b** the per-row dialog adopts it
(in-row ★ model — Sam's pick; gains completion-note/band-chips/ⓘ/gather/override, keeps
re-discipline #503 via `allowRediscipline`); **#516 PR-3** the worklist is now a **right-hand
docked panel** (resize grip · » collapse-to-rail · ✕; page reflows via `body padding-right`;
`localStorage` `cplWorklistDock.v1`); **#518 PR-4** the dock **re-filters LIVE** with the CCR table
(`render()` calls an assigned `worklistRefilter`, gated on a `ccrSig()` of the carried filter fields
so a post-merge render / CCR-search keystroke never resets the queue; carry-over checkbox = off
switch). The four parameterized opts (`preCheckedIds`, `allowRediscipline`, `dismissLabel`, `deps`)
each default to the worklist's behavior, so adopting the editor regressed neither surface. A latent
bug the move surfaced: the seed member's `k` must be its id_system (§10 axis), not the display
`kind`. Full story:
[`docs/ccr_merge_workspace_lessons.md`](docs/ccr_merge_workspace_lessons.md).

### Session 72 — StarLander: the post-consolidation polish pass (2026-06-24/25)

Sam's hands-on review of the now-shared merge workspace — **13 PRs #520–#532, all merged**; because
the editor is shared, each editor-internal change landed once and BOTH surfaces (✨ worklist +
per-row ⚇ dialog) inherited it. **Wave 1/2 (#520–#525):** Cons↔Aggr slider floor 0.40→0.00 + the
opt-in **Confirm no-op fix** (disabled-until-≥2-checked); ⌕ override moved up under the title +
verbose copy → ⓘ tooltips; "Add more" → search-into-candidate-list; the **per-row ⚇ Merge opens the
docked sidebar** (single-course mode, `setBandFilter`); and the **Tight↔Loose candidate-looseness
slider** (the control Sam expected the strength bar to be). **Wave 3 (#527–#531) — 9 refinements:**
sidebar Prev/Next pager · worklist **Discipline filter** · **CCR table syncs to the sidebar's
current course** (`state.focusId` floats it + subject neighbors to top) · candidate slider defaults
**Loose** + persists (`cplCandLoosen.v1`) + auto-surfaces · editor keyword box **eliminated** (one
top Search box) · multi-term **comma=OR** search w/ ghost text · "Merge into existing" chip → section
note · the **Title-5 §55050 level convention** in `courseBands()` (ranges/words/ordinals classify;
bare numbers a curator-overridable hint). **Wave 4 (#532):** kept the human labels **Beg/Int/Adv**
(tried L1/L2/L3, reverted — internal keys stay `beg/int/adv`, no data churn). **Wave 5 (#534):**
**DECOUPLED the worklist from the CCR table filters** (dropped the "Match the CCR table filters"
checkbox — `applyCcr` now false; `rowPassesCcr` gates on it) so a **keyword surfaces ALL matching
courses** (cap 25→100, no longer CCR-gated); a **single-course RENAME** (★-checked + edited title →
"✓ Save" via `doRename()`); and **header Prev/Next** (‹ ›). 81→**88 green**. Full story:
`docs/ccr_merge_workspace_lessons.md`; KB note `docs/kb-notes/reference-course-level-convention.md`.

### Session 74 — SkyBlaster: the public CPL Fact Sheet (2026-06-25)

A self-contained product sprint with Sam in the loop. Built **`fact-sheet/`** — a
**standalone, public** page (own HTML/CSS/JS, NO COBI nav, the `kb-portal/` pattern
minus auth) that recreates the Feb-2026 journalist Fact Sheet PDF, served by Pages at
`…/fact-sheet/`, and a **`📄 CPL Fact Sheet ↗`** launch link in the COBI nav rail (a
non-tab `<a class="cpl-tab">`, no `data-tab` → `tabs.js` ignores it; both HTMLs, Rule 4).
`factsheet.js` binds the 6 headline KPIs (+ breakdowns + Veteran-Sprint figures) from
`../live_metrics.json` (baked values = fallback); the exhibit/recommendation KPI cards +
Statewide Exhibits counts are a labeled MAP Custom Reporting Module **snapshot**. Cambria
prose / Calibri data; print CSS (0.4in) → "Save as PDF" is the export. Reconciled the two
KPI cards' statewide credit-rec counts (**1,304** CCC articulation rows = **1,298**
adoptions + 6; **1,101** = distinct recs) and added a **Statewide Exhibits** section (132
exhibits / 12 program areas, expandable per-sector lists from
`kb/statewide_exhibit_categories.json`). **PRs #537 + #540, both merged + LIVE.** Full
story: [`docs/fact_sheet_lessons.md`](docs/fact_sheet_lessons.md); reusable pattern:
[`docs/kb-notes/playbook-standalone-public-page.md`](docs/kb-notes/playbook-standalone-public-page.md).

### Session 77 — StarPort: the RACI update loop, end to end (2026-06-26)

A hyperglide sprint, Sam live-testing throughout — **8 PRs #556–#562, all merged + live.** Built the
full *"nudge → braindump → CC writes it up → card"* loop on the Team & RACI tab, and fixed a real
save-persistence bug along the way. Headlines: **Copy-RACI** (#556 — `⧉ copy` a row's R/A/C/I to others);
**Annual Report tab** (#557 — `annual_report.js`, 6-section draft from live `CPL_DATA` + ✨AI/⬇Word/🖨Print);
**check-all/clear-all + manual 📣 team nudge** (#558); **🐛 the save-persistence fix** (#559 — `raci.js`
never refreshed the magic-link token, so writes 401'd silently after ~1h; `sbWrite` is now refresh-gated +
`saveRaci` rolls back on failure — plus the **nudge accountability layer**: `last_nudged_at`/
`last_response_at` + directory Last-nudged/✓responded/⏳awaiting columns); the **📝 update composer**
(#560 — braindump → CC polish → new immutable `item_updates` table; deep-link consumer
`?update=<key>#raci`); the **per-item 📣 nudge** (#561 — emails a row's R/A people, quotes the card +
links to the composer); and **📝 on every Activity/Project card** (#562 — generator deep-link; retired the
old `✎ Update` button; dispatched the daily workflow). Round-trip = **link-to-form**, no mailbox. New KB
note: [`methodology-refresh-token-before-write.md`](kb-notes/methodology-refresh-token-before-write.md).
Full story: [`cobi_raci_nudge_lessons.md`](cobi_raci_nudge_lessons.md) (Session 77).

### Session 78 — SkyMap: posted updates surface on the card face (2026-06-26)

A short, snappy follow-on to StarPort — **1 PR #564, merged + live** — closing Session-77 carryover #4
(the first half). Two RACI-update tweaks Sam flagged: **(1) the 📝 Update + 👥 RACI deep-links now render
on every SUB-ACTIVITY card** (the `activity-kpi` cards 1.1/1.2/…), not just the Activity header + Project
cards — each sub-activity is its own RACI row keyed `project:<id>`, so the composer/focus already worked
there. **(2) posted `item_updates` now show ON the card face** via a new read-only overlay
**`card_updates.js`**: the generator stamps a hidden `<div class="cpl-live-update" data-update-key="…">`
hook (keyed `activity:N`/`project:<id>`) on every Activity/sub-activity/project card; the overlay fetches
the newest `item_updates` row per key (anon read), fills it with **body + date + author**, and **hides that
card's creation-era `.cpl-static-update` line** so there's one current "Latest Update." Code-only PR
(hooks/links are regenerated sections) → dispatched the daily workflow post-merge. New KB note:
[`methodology-live-overlay-onto-generated-cards.md`](kb-notes/methodology-live-overlay-onto-generated-cards.md).
Tests: `tests/card_updates.test.js` (17). Full story:
[`cobi_raci_nudge_lessons.md`](cobi_raci_nudge_lessons.md) (Session 78).

## Archived session narratives (Session 79) — moved 2026-06-28 (Session 81)

### Session 79 — StarBender: RACI becomes the card's source of truth + statewide Fact Sheet recs (2026-06-28)

Two threads, Sam live-testing throughout — **6 PRs #567–#571, all merged + live.** **(1) RACI-driven
cards** (#567–#570): the card **Lead** now derives from the RACI **Responsible** (was the stale
`projects.lead`) via a new read-only overlay **`card_raci.js`** (the `card_updates.js` pattern) + a **hover
roster** on the 👥 button; the 27 remaining `projects.lead` values **seeded** into `item_raci` as
Responsible (Beth Kay dropped; titles' embedded orgs kept); **nudge made opt-OUT-gated**
(`itemNudgeRecipients()` drops `nudge===false` — fixed wrongful nudges to unchecked members) + cleared the
stale ⏳awaiting tags; **sortable matrix/directory columns** (tree flattens on sort, `⤺ tree view`
restores). **(2) Statewide Fact Sheet recs** (#571): each statewide credential's authoritative credit recs
(C-ID/title/units) surfaced from **our own MAP dataset, no scraping**. The key insight (a runner probe
found it): the **one authoritative statewide exhibit is the raw row with `Collaborative Type == "CCC"`** —
adopting colleges tag their *adaptations* CCC too, which had inflated POST Basic Academy to 42 recs vs the
canonical **10**. Producer adds an additive `authoritative_recs` (CCC-only); builder
`fact-sheet/_build_statewide_recs.py` → `fact-sheet/statewide_recs.js` (daily cron); 129 exhibits/329 recs
live, no-CCC list = 3 (DLPT-Russian, HRCM 001, NCCER CORE — fix in MAP). New KB note:
[`reference-authoritative-statewide-exhibit-signal.md`](kb-notes/reference-authoritative-statewide-exhibit-signal.md).
Tests: `card_raci`/`raci_sortable`/`raci_nudge_optout`/`statewide_recs_test` (51). Full stories:
[`cobi_raci_nudge_lessons.md`](cobi_raci_nudge_lessons.md) + [`fact_sheet_lessons.md`](fact_sheet_lessons.md)
(both 2026-06-28).

## Archived session narrative (Session 80) — moved 2026-06-28 (Session 82)

### Session 80 — StarMan: the public Fact Sheet becomes Curate-editable (2026-06-28)

Concurrent with StarBender (79), Sam live-testing — **1 PR #570, merged + live; he was editing within
minutes.** The standalone public **Fact Sheet** is now editable in place by a signed-in reviewer (the shared
`cpl_sb` magic-link + `is_allowed_reviewer()` gate, same as CCR/RACI/TMC). New standalone
**`fact-sheet/factsheet_edit.js`** — a content-agnostic Supabase **overlay**: it walks the DOM at load,
assigns each editable box a **stable key** (`sectionId|slug(baked text)`, stamped `data-fsk` — so
`index.html` needs no per-box markup, a tiny diff), reads `public.factsheet_overrides` (anon) and overlays
`{html,hidden}` for every visitor; a reviewer gets **✎ Curate** mode (click a box → docked raw-HTML editor →
Save/Hide/Reset-to-original). Self-contained magic-link auth (mints `cpl_sb` from the hash),
refresh-before-write, **allowlist** sanitizer (hardened after a security review closed the foreign-content
mXSS class). `index.html` diff = button + script tag + JST-card removal → **zero overlap** with StarBender's
Statewide-CRs region (editing **excludes** `#statewide-exhibits`/`#progress`/`[data-bind]`). New table
`factsheet_overrides` (public read, reviewer write). 31 jsdom tests. New KB note:
[`playbook-curate-editable-standalone-page.md`](kb-notes/playbook-curate-editable-standalone-page.md).
Full story: [`fact_sheet_lessons.md`](fact_sheet_lessons.md) (2026-06-28).

## Archived session narrative (Session 81) — moved 2026-06-29 (Session 83)

### Session 81 — StarFarout: per-row + per-card nudges + "Nudge All" (2026-06-28)

A focused RACI/nudge tweak pass Sam asked for ("tweak the RACI and Activity cards") — **1 PR #574,
squash-merged + `daily-dashboard.yml` dispatched post-merge to publish the card buttons.** Three changes:
**(1)** the per-item 📣 nudge now shows on EVERY matrix row when signed in (gate dropped from
`itemNudgeRecipients(item).length` → `canEdit` so any one item can be nudged; opt-out still enforced in
`itemNudgeRecipients`, empty-recipient case alerts gracefully); **(2)** the bulk button renamed
**"📣 Nudge for updates" → "📣 Nudge All"** (tooltip now points to a row's 📣 for a single item); **(3)** a
📣 Nudge button on every Activity / sub-activity / project **card** (generator emits a `cpl_nudge_focus`
deep-link beside the existing 📝/👥 — verified 4 Activity + 57 project = 61, `CPL_Dashboard.html` ===
`index.html`), consumed by a new `consumePendingFocus` `NUDGE_KEY` branch → `openItemNudge`. Durable lesson —
**separate affordance VISIBILITY from action ELIGIBILITY** (show the affordance everywhere; enforce
opt-out / no-recipient in the DATA/href layer; test eligibility there, not button presence) — new KB note
[`docs/kb-notes/methodology-affordance-visibility-vs-action-eligibility.md`](kb-notes/methodology-affordance-visibility-vs-action-eligibility.md);
builds on Session 79's audience-by-consent lesson. Code-only PR per the #562/#564 precedent. Tests 96/96
(`raci_card_nudge.test.js` new, `raci_nudge_optout.test.js` rewritten, `raci.test.js` updated). Full story:
[`docs/cobi_raci_nudge_lessons.md`](cobi_raci_nudge_lessons.md) (2026-06-28).

**Then (same session) — the Fact Sheet Curate arc, 3 merged PRs.** Sam: "be able to add or delete anywhere
there are boxes or images" on the public Fact Sheet. **#576** boxes — ＋ add (clones the section's box →
sample text, so a new box always matches the format) / ✕ delete (added = real delete, baked = hide) /
drag-reorder. **#578** images — 🖼 add (upload) / S·M·L·Full resize / ⤢ replace / ✕ delete, bytes in a
public-read·reviewer-write **`factsheet-images`** Storage bucket, the override storing the URL. Both ride the
**unchanged `factsheet_overrides` table** via **reserved key namespaces** (`|add|`/`|__order`/`|img|`/`|fig|`)
the overlay *materializes* — no schema migration; `index.html` untouched (the overlay injects all chrome).
**#577** a rotating **"My CPL Stories"** section (4 random) — sourced from the SiteGround-bot-protected
`map.rccd.edu/cplstories/` by **headless Chromium on a runner** (the runner-as-proxy escalated past a JS
challenge with retry + a `.card`-count `waitForFunction`, last-good on failure). Tests 99/99. New KB note:
`docs/kb-notes/methodology-reserved-key-namespaces-on-overrides-table.md`; full story in
[`docs/fact_sheet_lessons.md`](fact_sheet_lessons.md) (the three 2026-06-28 StarFarout sections). The
M-ID pipeline did NOT move — `#tab-pipeline` intentionally untouched this checkpoint.

### Session 83 — StarNova: CO-platform strategy → Mission Control → team-phrase gate (2026-06-29)

Sam's "epic quest": recommend a long-term plan to move COBI + the CPL KB into a governed, team-based,
CO-wide structure (with Director-of-Tech "Malone"), then build a tracker for the lift and drop the per-person
login wall on team edits. **4 merged PRs.**

**(1) `docs/co_platform_strategy.md` (#586, corrected #588)** — the "plan of attack." Built by a
**12-agent workflow** (5 web-research threads → 6 design sections → synthesis), grounded in the **verified**
current state (GitHub owner = Sam's personal `samueltlee`; `CPL-Initiative` org has 0 teams; Supabase =
personal `LiveOak`/Pro; Cloudflare Worker + Anthropic key on personal accounts → the platform is owned by
*individuals*, not the institution). Covers the operating model (**AI proposes, a named human disposes**), a
Now/Next/Later roadmap + a parallel procurement track, account migration off personal logins, knowledge lanes
(CPL · CCC Baccalaureate · Apprenticeships · Internships · MIS · Student Services), integration/API
(de-scrape behind data-sharing agreements), governance/security/accessibility/HUMANS, decisions only humans
make, candid pushback, and a scorecard against all ~14 asks. The PII ask was a no-op — **verified clean on
`main`** (audit's "pending" was stale; Sam had already purged history).

**(2) `kb/liftoff_plan.json` ("Lift Off") (#588, forward-only #592)** — the program-tracker data: phases
(Now/Next/Later) of **`task` + `decision` nodes**. A `decision` FORKS the work — an option `activates` its
branch tasks and `archives` the others; the choice doubles as the human decision log. **Forward-only** (31
tasks, 3 decisions; PII-incident nodes dropped per Sam — handled long ago).

**(3) `mission_control.js` ("Mission Control") (#590, #592)** — a self-contained static overlay (the
`card_updates.js`/`first_light.js` pattern) that renders the plan ⊕ a Supabase `liftoff_state` overlay as a
**collapsible `<details>` block mounted BELOW the RACI functions** in Team & RACI (mounts on
`cpl-tab-activated`; inserts `#mission-control-root` after `#raci-root`; **didn't change one line of
`raci.js`** → its 70-check suite stayed green). Anon = read-only; signed-in/team-phrase = set task status +
pick decision branches (optimistic write + rollback).

**(4) the RACI shared "team phrase" gate (#593)** — replaced the per-person magic-link *requirement* with a
shared phrase so the team can update/nudge without each signing in. **Server-enforced** (the differentiator,
not client-side theater on a public-anon-key surface): `team_access` (RLS on, **no anon policies** → not
client-readable) + **`team_pass_ok()`** reads the **`x-team-pass`** request header and widens the
`item_raci`/`team_members`/`item_updates`/`liftoff_state` write policies to `is_allowed_reviewer() OR
team_pass_ok()` — magic-link reviewers still work. Client used a **pseudo-session** (`state.sess =
{teamPass}`) so every existing `canEdit`/`state.sess` guard passed unchanged; only `sbWrite`'s header +
`load()`'s fallback changed. Temp phrase `cpl-team-2026` (Sam to rotate). **⚠ The live header path is
unverified from the sandbox** (Supabase egress-blocked) — Sam to confirm a save persists after deploy.

**(5) Team-phrase hardening — same session, Sam live-testing with Malone (PRs #595–#598 + 2 Dependabot).**
The gate shipped but Malone hit a **401 on save despite entering the phrase** — root cause: a team-phrase
session has no user token, so `headersFor` sent `Authorization: "Bearer "` (empty), which **PostgREST rejects
at the auth layer (401) BEFORE RLS/`team_pass_ok()` runs** (an RLS denial is 403 — the 401 pointed straight
at auth). **#595** fixes it (fall back to the anon key as the bearer; never an empty Bearer) + adds the phrase
box to the composer when not unlocked. **#596** makes the card 📝/📣 popups open **in place** (new
`card_actions.js` interceptor + lazy-load; the nudge email lands on `#activities-projects` now) — no redirect
to `#raci`. **#597** brings **Mission Control** to parity (same empty-Bearer fix + it now reads the team
phrase; `liftoff_state` writes widened to `team_pass_ok()`). **#598** **validates the phrase on entry** (POST
`rpc/team_pass_ok` — a wrong phrase is rejected, never stored, killing the silent-401 trap) + a reviewer-only
**⚙ Manage team phrase** admin (view/rotate `team_access.secret` via new reviewer-only `ta_select`/`ta_update`
RLS; anon still can't read it). Also merged the two pending **Dependabot** CI bumps (`setup-node` 4→6 #587,
`checkout` 6→7 #482). All static JS → live on merge; suite **107 files green**.

Durable lessons: **the build IS the operating model** (each artifact demonstrates AI-proposes/human-disposes);
the **decision-fork tracker model**; **server-enforced shared password without per-user accounts** (new KB
note [`docs/kb-notes/methodology-server-enforced-shared-password-gate.md`](kb-notes/methodology-server-enforced-shared-password-gate.md));
**repo-private ≠ site-private** (a Sam Q — Pages stays public to URL-holders; site-gating needs an app gate
or Enterprise, and Pages-from-private needs a paid plan); **an empty `Bearer ` 401s at PostgREST's auth layer
before RLS** (so on a public-anon-key surface, always send the anon key as the bearer — never `Bearer ` with
no token — and remember a *wrong-credential* RLS rejection is 403, an *auth-layer* rejection is 401); **you
can validate a secret the client can't read by calling the gate function itself as an RPC** (the same
right/wrong signal a write gives, no new exposure). Tests: `card_actions.test.js` (15), `mission_control.test.js`
(38), `raci_team_pass.test.js` (22), raci 70/70 → **107 files green**. Full stories:
[`docs/mission_control_lessons.md`](mission_control_lessons.md) +
[`docs/cobi_raci_nudge_lessons.md`](cobi_raci_nudge_lessons.md).

### Session 84 — SkyScribe: project soft-delete · lean Pages · computed progress bars (2026-06-29)

Started "refine COBI a bit more"; the team using the dashboard surfaced a run of needs. **6 merged PRs.**
- **Project soft-delete (#600)** — a reviewer / team-phrase user can **Table** (pause) or **Archive** (close)
  a project; it leaves the live priority surfaces and moves to a collapsed **"Tabled & Archived"** section,
  reversible (♻ Restore). New Supabase **`project_lifecycle`** overlay (absence of a row = active; write gated
  `is_allowed_reviewer() OR team_pass_ok()`) + the committed `kb/project_lifecycle.json` ledger (the "noted in
  the KB" record) + static `project_lifecycle.js` (the `card_updates.js` overlay pattern). **Wired across ALL
  surfaces** (#605): the generator excludes tabled from the grid, `CPL_DATA.projects`, the Annual Workplan
  tables, AND `build_activity_kpis` (so they drop from the Activity Metrics cards + the RACI matrix); the
  client live-hides each surface pre-regen (`raci.js` filters `buildItems` by the overlay).
- **Pages deploy fixed + leaned** — Sam's Jekyll build was hung on the 553 MB repo; **`.nojekyll` (#601)**
  unstuck it, then a **custom lean `pages.yml` (#602)** (`git archive` → prune internal-only `kb/` staging /
  alias maps / build inputs → assert every served path survives → upload + deploy) cut the published site to
  **~192 MB (−65%)**, validated 0 served files dropped. Sam switched Settings → Pages → Source to "GitHub
  Actions"; triggers = push + **`workflow_run` on "Daily CPL Dashboard"** (the cron's `GITHUB_TOKEN` push
  doesn't self-trigger) + dispatch — all three verified green.
- **Computed progress bars (#604)** — the Activity KPI card bar now computes **Goal (blue) + Stretch (gold)**
  from `current ÷ current-fiscal-year target` (was the manual `percent_complete`); manual fallback where no
  numeric/ladder. 1.1 reads Goal 200% ✓ / Stretch 100% ✓.
- **Scoped, build next session:** the Annual Workplan tab as the **authoritative source** — hybrid Current
  (live for the 5 `pid_to_kpi_key`-mapped, manual-editable for the rest) + editable titles (single
  `projects.name` store). Decisions locked → [`docs/annual_workplan_authoritative_scope.md`](annual_workplan_authoritative_scope.md).

Suite **109 files green**. Full story: [`docs/project_lifecycle_lessons.md`](project_lifecycle_lessons.md)
+ [`docs/pages_lean_deploy_scope.md`](pages_lean_deploy_scope.md). M-ID pipeline did NOT move
(`#tab-pipeline` untouched). **NEXT: [`docs/session_85_handoff.md`](session_85_handoff.md).**

---

### Session 86 — SkyGuy: KPI-card shelf · card-metric live sync · update-popup · KB team-phrase (2026-06-30)

Sam's six COBI refinements (PR #610, code-only → post-merge dispatch publishes the HTML):
- **KPI cards: hide + centered metric + collapse** — new static **`kpi_cards.js`** (the regen-safe
  `kpi_reorder.js` pattern, NOT a generator change): at runtime wraps each `.kpi-card`'s metric+label into a
  centered `.kc-head` + the rest into a collapsible `.kc-body`; cards open **collapsed (top half only)**, per-card
  × hides (→ "Hidden (N)" restore tray), Expand-all/Collapse-all toolbar; per-browser `localStorage`, scopes to
  `.kpi-section > .kpi-card`, coexists with `kpi_reorder.js`. `<script>` in BOTH HTMLs (Rule 4).
- **Activity-card big number = live KPI** (#5) — new post-pass `apply_live_activity_current()` (after the merges
  + `apply_live_workplan_current`) drives each Activity Metrics sub-activity card's `metric` from the live
  headline KPI (the 5 `PID_TO_KPI_KEY` rows) or an explicit `workplan_goals.current` (unmapped), mirroring the
  Session-85 hybrid; `current_manual_explicit` stamp gates the override (un-set cards unchanged). 3.1 43,630 →
  live 48,158; `_parse_metric_num` now handles `k`/`M`/`B`/`$`.
- **RACI Update popup** (#4) — was ALREADY show-all + edit/delete-any (incl. team-phrase); added a live
  `Updates (N)` count + taller viewport + fresh-save id backfill, and a test that guards it.
- **KB tab team-phrase** (#6) — the KB portal (a separate Supabase project) now unlocks + curates via the shared
  `cpl_team_pass` (validated server-side against the MAIN project's `team_pass_ok()` RPC; carries over from the
  Team & RACI tab via same-origin localStorage). Pure `KBComposer.teamPassRequest` keeps it unit-tested.
- **Light/glass theme (#611)** — flipped the dark-navy data surfaces to COBI's light look, chips/trendlines
  recolored for contrast: KPI Trends card + the shared `EXHIBIT_ANALYSIS_CSS` `.exhibit-*`/`.sw-*` families (CPL
  Analytics **+** EACR) + College Activity (`college_activity_template.html`/`.js`) + EACR `statewide_interactive.js`.
  Delta chips `--*-on-dark`→`--hunter`/`--crimson`, sparkline `#E3B341`→`#8B6800`, gold text→`--mustard-text`.
  Exhibit CSS publishes via the cron (injected only when MAP exhibit data present → source-guarded by
  `kb/_test_light_theme.py`). The CCR/CSR/CER reference tabs (light tables w/ dark header bands) left as-is.
  Reusable dark→light map: [`docs/kb-notes/methodology-dark-to-light-recolor-mapping.md`](docs/kb-notes/methodology-dark-to-light-recolor-mapping.md).
- **MAP Users — scoped (#612)** — Sam wants a tab to manage MAP college users + nudge colleges to refresh them.
  Finding: "MAP users" = `View_CollegeUsersRoles` (~2,710 rows / 11 fields = staff names+emails+roles), MAP
  category #9, **NOT in our datasets** (dropped from the fetch for PII-minimization, never committed). Built a
  **PII-safe schema probe** (`map/probe_users_schema.py` + `map-users-schema-probe.yml`, dispatch-only,
  runner-as-proxy) + a 4-phase scope ([`docs/map_users_tab_scope.md`](docs/map_users_tab_scope.md): runner sync
  → gated Supabase `map_college_users` → COBI tab → reuse the RACI nudge engine). The probe fix handles MAP's
  **column-oriented** response (`columnName`/`columnValue`, 2-pass). NEXT: dispatch it, fold the schema in, build P1.

112 JS test files + Python tests green; generator EXIT 0. Full story:
[`docs/cobi_lessons.md`](docs/cobi_lessons.md) (S86–87). **NEXT: [`docs/session_87_handoff.md`](docs/session_87_handoff.md).**

### Session 87 — StarMax: card↔KPI breakdown sync + the MAP Users tab end-to-end (2026-06-30)

Two asks. **(1) Cured the population sub-activity cards** (PR #617, code-only): 3.1.1
Working Adults / 3.1.2 Veterans / 3.1.2a Apprentice were stale because Session 86's
live-sync only wired **top-level**-KPI sub-activities; these three are **breakdown rows
WITHIN** STUDENTS SERVED. New `PID_TO_KPI_BREAKDOWN` + `_kpi_breakdown_value()` wired
through both post-passes → cards now match the headline breakdown by construction
(23,388 / 24,864 / 753). **(2) Built the MAP Users tab end-to-end** (`#map-users`,
§2/§7b/§8; PRs #618–#621): a runner probe captured the schema (the **value-signature**
method — the MAP report API pads unknown columns, so confirm a column by whether its
VALUES come back, calibrated with garbage sentinels; MAP is case-sensitive + multi-word
Contacts columns keep their **spaces**). Gated Supabase `map_college_users` (2,741 rows;
public aggregate via `map_users_summary()`, roster reviewer/team-phrase gated) +
`map_college_contacts` (121); runner sync `map/sync_map_users.py` (`map-users-sync.yml`);
the tab `map_users.js` (lazy, both HTMLs) + a 📣 **mailto nudge** to Primary Contact /
VPAA / VPSS. Gotcha: Supabase **pg-safeupdate** needs `where true` on a full-table DELETE
through the API roles. 113 JS test files green.

**(3) Nudge follow-up (PRs #623–#626).** Per Sam: a **recipient PICKER** (all pre-checked,
uncheck anyone) + **CEO** as a 4th recipient (71/121 have one) + a **last-nudged log**
(`map_college_nudges`, kept separate from the monthly-wiped contacts table) (#623); the draft
**links the college to their own MAP CPL dashboard** (`map_college_contacts.landing_page_url`,
joined in the sync from `chatbox_college_profiles`; 118/121 match) (#624); and the
**college's own user roster** rides in the email body as a **Check-All checklist** (drop a
departed staffer before sending) so leadership sees their CPL people (#626). **Architecture
call (durable):** MAP is the system of record for users and there's **no MAP write API**, so
we DON'T build a roster editor in COBI — colleges edit in MAP (deep-linked), COBI owns the
nudge → `docs/kb-notes/adr-surface-dont-edit-readonly-system-of-record.md`. Parked: the
"✓ confirmed current" attestation loop. 56 map_users checks; 113 JS test files green. Full
story: `docs/cobi_lessons.md` (S87) + `docs/map_users_tab_scope.md`.

---

### Session 88 — SkyThru: CCC-metric match · MIL/JST + Veteran Star · About z-index · MAP-Users 3 fields (2026-06-30)

Four COBI tweaks across two PRs (both merged + live). **PR #628 (code-only → daily-dispatch
publishes):** (1) **CCC Collaborative match** — KPI Trends read `ccc_collaborative`=adopting_colleges
(61) under the same label as the MAP Exhibits card's exhibit count (132). New `kpi_history` key
**`ccc_exhibits`** (= `ccc.unique_exhibits`) repoints the Trends row; legacy series kept. NEW key →
deltas read "—" until its own series accrues (no fake jump). (2) **MIL vs JST + the Veteran Star** —
new **`fetch_veteran_jst.py`** → committed **`veteran_jst.json`** (runner-as-proxy, soft-fail; the
worker scrape lacks MIL/JST + can't be redeployed from a session). `apply_veteran_jst` puts the REAL
JST + reported MIL + the 75% rule on the **Veteran Sprint card** (was a proxy); the **College
Activity** table gains a "MIL / JST" column + the ★ becomes the Veteran Star (JST≥75%MIL), gated on
`COLLEGE_HAS_JST`. ⚠ per-college star count ≈46 vs MAP's `StarCollegeCount` 50 — boundary cases, the
savings API has no per-college star flag (logged as `computed_star_colleges`). (3) **About-box
z-index** — `.header`'s `backdrop-filter` trapped the popover (z-index:300) behind the cards;
`cobi_brand.js` lifts `.header` to `z-index:150`. **PR #629 (MAP Users):** the value-signature probe
confirmed UserStatus∈{Active,Inactive}/UserDisciplines/LastUpdatedOn on the 16-field Users view;
`map_college_users` += `user_status`/`disciplines`/`last_updated_on`, `map_users_summary()` += public
`active_count` (Disciplines+Last-updated reviewer-gated). Sync FIELD_MAP + tab roster columns. Tests:
+4 new files (#628) + cobi_brand z-index guards; map_users → 70 checks; 114 JS files green. Full
story: [`docs/cobi_lessons.md`](docs/cobi_lessons.md) (S88).

### Session 89 — SkyMiles: Sierra sees what colleges TEACH (the COCI offerings catalog, v20) (2026-07-01)

Sam's ask (from a Boys & Girls Club colleague's detailed NCCER/OSHA/welding CPL
question): free Sierra to research the course/program catalog. Root cause — the
shared `cpl-chat` function could search only the **earned-exhibit** set
(`chatbox_exhibits`), never **what a college TEACHES**, so it couldn't reason
"LA Harbor hasn't articulated NCCER, but does it teach construction? if not, which
nearby college does?" (confirmed: LA Harbor **0** construction-crafts courses, El
Camino **25**, Long Beach City **14**). **Full build shipped (PR #631):** a public
COCI **offerings catalog** in Supabase (`coci_college_offerings` 16k · `coci_college_programs`
22k · `college_geo` 120; §8), built by `chatbox/build_coci_offerings.py`, loaded by
the runner sync `coci-offerings-sync.yml`; wired into **`cpl-chat` v20** (5th parallel
lookup + relevance-ranked `search_college_offerings` + core-vs-tangential gating +
nearest-college ranking + `OFFERINGS_RULE` adoption prompt; `verify_jwt` preserved
false). Smoke modes 7–8. This is the **offerings slice of the CCR/CER ETL** (CER +
adoption-leverage layers are the next wire). Full story: `docs/cpl_assistant_lessons.md`
(Session 89).

## Archived session narrative (Session 90) — moved 2026-07-01 (Session 92)

### Session 90 — SkySherpa: the standalone Sierra page gets its brand (2026-07-01)

A focused visual pass on the **standalone Sierra page** (`sierra/`, added S89 PR #633),
3 PRs all merged + live. **#635** — the header 🏔️ emoji → the official **CPL Initiative
logo** (`sierra/cpl-initiative-logo.png`, white-on-transparent, cropped to content) as a
co-brand lockup left of the wordmark. **#636** — a hand-traced **Mt Whitney ridge ghosted
behind "Sierra"** (`sierra/whitney-mark.svg`, single white stroke + a summit snowcap, 34%
opacity, flat base on the text baseline, nudged right to clear the "a") + tagline "Your
Credit for Prior Learning guide" → **"Your CPL Sherpa"** (Whitney = tallest Sierra Nevada
peak; a Sherpa guides you up). **#637** — trimmed the tagline to just "Your CPL Sherpa".
Two reusable tricks: **a pasted image isn't on disk** — recover its bytes from the
base64 `image` block in the session `.jsonl` transcript; **hand-authored SVG line-art**
beats raster for a UI mark (scalable, recolorable, ~0.5 KB). All `sierra/` files are
static (no Rule-4 mirror, not a cron artifact); merged on `unstable` (TruffleHog green).
Full story: `docs/cpl_assistant_lessons.md` (Session 90).


## Archived session narratives — Sessions 91 + 92 (moved at the Session-93 checkpoint, 2026-07-02)

### Session 91 — SkyGOAT: the TMC Builder gets both C-ID authorities + "OR" alternatives (2026-07-01)

Sam's two TMC asks (from the Saddleback Administration-of-Justice screenshot showing
many NULL right-side alignments), both shipped + merged. **PR #639 — right-side C-ID
coverage doubled:** auto-match keyed only on COCI's under-reported `CIDNumber`; wired in
the already-in-repo but **unused** c-id.net authority (`cid_articulations.json`) →
`tmc/_build_college_courses.py` unions both (join `(college,subject,number)` exact +
leading-zero fallback; `sequence:true` excluded). **10,627 → 21,300** college×C-ID pairs
(+100%); **9,924** courses gained a C-ID; 961 carry ≥2 → rows gain an optional 6th
element `xcid[]`, consumer matches `{cid}∪xcid` + `autoMatch` used-tracks. **PR #640 —
"X OR Y" alternatives:** the consumer already rendered/matched per-slot `alts[]` but
**0/756 slots had any** (the PDFs' multi-column "OR" scrambles under `fitz`). Extracted
the OR-groups by a **visual PDF read** — a Workflow fanned an extractor + adversarial
verifier over all 45 PDFs → curated `tmc/tmc_or_groups.json` (80 groups, evidence
quotes); the parser folds each into one slot (`cid` + `alts[]`). **77/80 folded**,
zero drift; 3 skipped-and-logged (LPPS overlap, studio-art missing line). Genuine-absence
slots stay honest blanks (no dataset fills them; we don't hold MIS). Consumer needed no
change for #640. Suite 117 green (+2 test files). Full story: `docs/tmc_builder_lessons.md`;
new KB note `docs/kb-notes/methodology-visual-pdf-read-for-layout-encoded-facts.md`.

### Session 92 — StarFab: every c-id.net approval lands + the confidence-score data map (2026-07-01)

Same Saddleback AJ screenshot, layer deeper. **PR #642 (merged):** a c-id.net approval
with no COCI row **vanished silently** — 3,684 unattached → **1,195 visible wrong blanks
across 114 colleges** (biggest driver: the CCN transition — Saddleback's SOCI 110 lived
on retired `SOC 1/1H`). Now a **join ladder** lands every approval (exact 18,157 ·
zero-norm 1,903 · squashed-code 629 · strict-title 915 → verify-tier `tcid[]` ·
**synthesized flagged rows 1,986**) + comma-joined `CIDNumber` split (46). **Graded
provenance** per C-ID (hard ✓ / tcid ≈ verify / synth badge; autoMatch prefers
hard>title>synth; save/resume round-trips it). 2-round adversarial verify caught a real
title-stripping blocker pre-merge. 0 wrong blanks remain; suite 118 (+31-check test).
Sam reframed the goal: **CO confidence score + can't-submit-misaligned** (200+ backlog
before the mid-July Curriculum Institute) → data scorecard + build order in
`docs/kb-notes/reference-tmc-confidence-data-requirements.md` (hours = the one true gap).
**Then Sam said "Let's build:)" — the CONFIDENCE ENGINE shipped same-day:** per-slot
verdict tiers (✓ auto / ≈ verify / 📎 evidence / ⚠ review) per the ASCCC ladder, submit
gates (select-N · per-list units · ≥18 major units w/ a units-capture remedy for synth
courses), hours-placeholder + evidence capture, and the **server-gated CO review queue**
(rank-by-readiness, per-slot five-check panel, Approve/Return via the
`tmc_review_submission` RPC — `is_allowed_reviewer()`, JWT-stamped; anon can no longer
mint approved/returned) + the ⏳ In-progress backlog proxy. The adversarial verify caught
2 more blockers pre-merge (stored XSS via anon-writable `_readiness`; forgeable
approvals). Suite 119 (+38-check test). Full story: `docs/tmc_builder_lessons.md`.
**NEXT: `docs/session_93_handoff.md`.**

### Session 92 — StarLab: Sierra audience selector + 👍/👎 feedback (v22) + the Training-tab scope (2026-07-01)

Sam's three Sierra asks, all landed. **Feedback:** new Supabase **`sierra_feedback`**
(👍/👎 + note per answer, client-uuid `turn_id`, UPSERT merge-duplicates; anon
write-only, reviewer/team-phrase SELECT; §8) with the bar on BOTH surfaces
(`sierra/sierra.js` + `cpl_chat.js`). **Audience:** a REQUIRED 5-chip primary-population
selector on both surfaces (shared key `cplSierraAudience.v1`) → optional `audience`
body field → **`cpl-chat` v22** `AUDIENCE_RULES` (students get zero inside-baseball;
widget untouched); `audience` also logs to `chat_interactions`, which gained a
reviewer SELECT for gap mining. **Training tab: recommended YES, phased** —
`docs/sierra_training_tab_scope.md` (P1 review-queue+gap-miner · P2 guidance table ·
P3 RAG-corpus ingestion · the Malone guardrails lane pre-"Credit for Being Me").
**v23** (same session): the missing-landing-page rule (never invent a link; route to
the college + MAP@rccd.edu); feedback writes hardened to the `sierra_feedback_upsert`
RPC after the smoke run caught the ON-CONFLICT-needs-SELECT RLS 401.
Tests 32+16 new checks, 118 files green; smoke modes 10–12. Full story:
`docs/cpl_assistant_lessons.md` (Session 92). **NEXT: `docs/session_93_handoff.md`.**

## Archived session narrative — Session 93 (moved at the Session-95 checkpoint, 2026-07-02)

### Session 93 — SkyReach: the CPR retrieval miss fixed (cpl-chat v24) + the Sierra Training tab ships (2026-07-01/02)

Sam's CPR question exposed that `search_exhibits_by_topic` ranked by `rec_count DESC` with NO
relevance ranking — 76% of exhibits (rec_count=1) were unfindable once a query matched >200 rows
(his 16 CPR rows sat at positions 285–677; only Cabrillo's bundle surfaced). **PR #646 (merged):**
migration `search_exhibits_by_topic_relevance_rank` (ts_rank_cd over title-A/discipline-B;
cpl_type/collab_type OUT of the searched vector; schema-of-record now committed) + **cpl-chat v24**
(CPR synonym family, meta stop-words) + smoke mode 13 — CPR rows now return at positions 2–8; smoke
13/13 green. His two 👎 notes were the trail — the day-old feedback loop's first real catch. Then Sam's
"go green": **PR #647 (merged)** shipped the **Sierra Training tab** (Phase 1 — §7b `sierra-training`;
feedback queue with `status` triage via `sierra_feedback_set_status`, gap miner over chat_interactions;
38-check test; suite 121). New KB notes: `methodology-capped-retrieval-ranks-by-relevance` +
`methodology-live-db-functions-need-committed-schema`. **NEXT: `docs/session_94_handoff.md`.**

## Archived session narrative — Session 94 (moved at the Session-96 checkpoint, 2026-07-02)

### Session 94 — SkySierra: Sierra branding + markdown + Training P1 + the GUIDANCE layer (cpl-chat v26) (2026-07-02)

Sam's three asks, all shipped same-day (PRs **#649/#650/#651**, merged): the **Whitney-roundel
Sierra mark** replaces 🏔️/🎓 everywhere (rail + all three chat avatars); the chat renderers now
handle **headings/tables/rules/ordered lists** (escape-first, byte-identical across the three
surfaces — `tests/sierra_markdown.test.js`); Training-tab **P1** (🧪 Test-in-Sierra prefill handoff,
date filters, bulk triage, feedback→chat-turn telemetry link + the **window-vs-document
`cpl-tab-activated` listener fix** in sierra_training.js/map_users.js); and **Phase 2 SHIPPED** —
`sierra_guidance` (team-gated, no-delete; `chatbox/supabase_sierra_guidance.sql`) + cpl-chat
`fetchTeamGuidance()` (newest 10 active rules, ~2.5k-char cap) + the tab's 🧭 pane, proven with a
marker rule in the smoke run. ⚠ Deploy footgun: the MCP deploy tool **defaults `verify_jwt` to
true** — always pass `false` explicitly (v25 briefly carried it; v26 = same sha, flag restored).
Full story: `docs/cpl_assistant_lessons.md` (S94). **NEXT: `docs/session_95_handoff.md`.**


## Archived session narrative — Session 95 (moved from CLAUDE.md §11 at the Session 97 checkpoint)

### Session 95 — the Activity ⇄ Project separation + the Archive-radio fix (2026-07-02)

Sam's morning mixup: he tabled **23 cards** as "redundant with Activity cards" and the Activity
cards vanished too (both are the same `projects` rows dual-rendered; Session 84 wired the overlay
to hide the Activity card deliberately). Fixes, one PR: ① the 23 mistaken `project_lifecycle` rows
DELETED (5.1's deliberate June-29 tabling kept); ② the **activity layer**
(`derive_core_activity_ids` minus `5.x` — ladder-bearing `5.1` is a REAL project, caught in A/B) is
now **IMMUNE** to table/archive at every consumer (generator scrub + `project_lifecycle.js`
`activityLayerIds()` + `raci.js`); ③ the Projects Grid **no longer duplicates** activity-layer rows
("no redundant activity or project cards") — grid = `4.1.x` sprint children + `5.x` only; the
Activity card already carried every affordance; ④ the **Archive radio bug**: the capture-phase
overlay walk closed the modal on ANY inner click, so only default-Tabled/no-reason could save —
now backdrop-only. Tests 25 → 42. **Afternoon wave (Sam's poke-around, 2nd PR):** the
Path-to-2030 charts → top of CPL Analytics (Dashboard tab); the 4.1 Sprints composite inherits the
real row's goal (no more phantom row); **`project_add.js`** — the ＋ Add-project flow (projects
INSERT/UPDATE widened to the team-phrase gate, `projects_write_team_phrase_widen`); the **AWG
Projects section** (work-item projects table at the bottom of Annual Workplan Goals, own markers
AFTER the End-AWG marker); + the grid-replace **+1-blank-line/run accretion fixed** (198 piled up —
regen now byte-idempotent modulo timestamps). Suite 125 green. Full story:
`docs/project_lifecycle_lessons.md` (both 2026-07-02 sections).


### Session 96 — SkyPress: report generators go live-data + the attach handoff (2026-07-02)

Sam's report audit, one PR: the **Custom Report** now fetches the live overlays before prompting
(newest `item_updates` + RACI lead per project + an activity-updates block); the **Master Report**
button opens a **selection modal** (same Activities & Projects tree) and builds the Workplan-style
docx **client-side** from live data (`master_report.js`; the pre-built docx = fallback). Root cause
of the staleness: the runner never had node `docx` (reports failed silently every cron) and
`reports/` was never committed — both fixed in the workflow. Pipeline now folds `item_updates` into
`projects[].update` + exports `CPL_DATA.live_updates` (`kb/_load_projects.py:load_item_updates()`).
Tweaks: 📝 composer closes after "✓ Saved."; nudge mailtos semicolon-delimited (Outlook); the
Path-to-2030 charts → BOTTOM of CPL Analytics; a first-click 📎 **attach explainer** (SharePoint
"＋ Create or upload" handoff wasn't discoverable). Parked for Sam: native Supabase-Storage
attachments (access model) + attachments→KB-md ingest. Suite 128. Full story: `docs/cobi_lessons.md` (S96).


### CCR Convergence kickoff — MindMeld: doctrine + voice mind-meld + calibration (2026-07-03)

Parallel-lane session on Sam's charge: converge the 7,716-group worklist into a
≤2,500-course CPL crosswalk via a written **Merge/Mint Doctrine** calibrated to his
judgment, then batch passes. Shipped (one PR): `docs/ccr_convergence_strategy.md`
(plan of record; two-number goal — Tier-1 ≤2,500 over a converging total space;
measured: ladders 1,533 + same-college 1,773 ≈ 43% of the worklist = 2 policy calls),
`kb/merge_doctrine.md` v0 + `kb/doctrine_questions.json` (11 open Q-*), the **🧠
Mind-meld voice panel** in the CCR worklist (→ new Supabase `merge_doctrine_notes`,
schema `kb/supabase_merge_doctrine.sql`; tests `uc_mind_meld.test.js`, 31), and the
78-group calibration sample pre-decided by 4 agents (`kb/doctrine_out/2026-07-03/`).
Next: Sam's voice pass → distill v1 → batch pass 2 + ESL packaging pass per
[`docs/ccr_convergence_handoff.md`](docs/ccr_convergence_handoff.md). Full story:
`docs/ccr_convergence_lessons.md`.


### Session 97 — BigSky: the Activities tab optimization + reports consolidation (2026-07-03)

Sam's laundry list, one PR: the **Custom Report** gains a staged **progress bar**, **per-audience
document titles**, the **Elevation slider** (0→30,000 ft detail control feeding an Altitude prompt
block), and absorbs the **Master Report** as a Report-Type option (filter-bar button retired). The
**slim actions bar** (Lead + Search + Element Map + Custom Report) moved to the TOP of the Activities
pane — the Activity/Vision/Goal/Status selects, Apply/Reset, and the bar-level Attach Doc were
retired (the generator's `<!-- Filter Bar -->` comment stays put as the injection anchor; the Lead
dropdown is now rebuilt every run — it had been frozen since first populate). **Sidebar grouped**
into 5 collapsible groups + Share (`nav_groups.js`, runtime-wrap, regen-proof) with the label renamed
**Activities**; Where To now resets after each use; **MAP naming locked** (see Naming & terminology
above) across prompts, footers, the KB repo (draft PR), and a `sierra_guidance` row; report models
de-pinned to the `claude-sonnet-4-5` alias. Team-phrase expansion plan authored:
[`docs/team_phrase_expansion_plan.md`](docs/team_phrase_expansion_plan.md) (recommendation: widen
most, keep 4 reviewer-only). Suite 132 files green (+3 new). Full story: `docs/cobi_lessons.md` (S97).


<!-- Archived at the Session-101 checkpoint (2026-07-07) per Rule 8. -->

### Session 98 — the Implementation Funding rework: Chancellor-facing scenario tool (2026-07-03)

Sam's funding-tab spec, one PR (#663, merged): **2-year selectable window** (year dropdowns; pool ÷
selected years), **year-specific priorities** (Year 1/2 filter; Sam's six metrics seeded; all text
editable), the **noncredit-feeder carve-out** ($1M editable → NOCE / SD Cont. Ed / Mt. SAC NC /
Calbright split by headcount — the 4 moved OUT of the college table), and **3-layer editing**:
per-browser scenario ⊕ shared Supabase **`cpl_funding_config`** (team-phrase write via
`team_phrase.js`; unlock promotes an explored scenario) ⊕ baked defaults — resolution
`SCENARIO ?? SHARED ?? BASE`. **Excel workbook RETIRED** (Sam: "we don't need that excel book
anymore") — `cpl_funding_data.js` is now the hand-maintained snapshot; **2025-26 headcounts applied**
(74 rows; 41 keep 2022-23 with per-row `hc_vintage` + a data-driven mixed-vintage note; roster 115,
SYSTEM 2,258,784). Suite 134 green (funding test 119 assertions). Full story:
`docs/cpl_funding_lessons.md` (Session 2); KB note
`docs/kb-notes/methodology-three-layer-scenario-config.md`.

<!-- Archived at the Session-102 checkpoint (2026-07-07) per Rule 8. -->

### Session 100 — SkyVault: the CER triage loop unstuck end-to-end (2026-07-07)

Sam's "the tab stopped working" after saving 5 triage assignments = **CER never refreshed the
magic-link token before writes** (the pre-Session-77 raci.js bug; adversarially CONFIRMED via a
4-lane workflow + jsdom repro) — ported the trio as `withFreshSession()` + single-flight refresh +
401 session-drop (`tests/cer_token_refresh.test.js`, 18). The deeper stall: the fold (PR-3) ran in
NO workflow, the exhibit audit was frozen at 2026-05-24, and all 5 raws sat under stale machine
drafts on **trailing-space twin spellings**. `kb/_fold_unclassified.py` gained SUPERSEDE (curator >
unreviewed machine, twins included, articulations re-pointed) + STALE lanes + `--apply-if-safe`;
applied: 11 supersedes, 8 art rows re-pointed, 7 orphan creds pruned, queue → 0 (receipts
`kb/unclassified_fold/2026-07-07/`). Cron now runs fold + `kb/_audit_exhibits.py` daily; Pages
asserts the 4 CER paths; skill Rule 5c = Sam's Cx/portfolio naming procedure (issuer **California
Community Colleges**). Authority-anchoring strategy (CareerOneStop/O*NET/CE):
`docs/kb-notes/reference-authority-anchored-credential-naming.md`. Full story:
`docs/exhibit_canonicalization_lessons.md` (2026-07-07).

### Session 101 — SkyAnchor: CareerOneStop authority LIVE + triage QA + the AP fold (2026-07-07)

Sam's COS credentials went live: probe → contract fixes (#676 — acronym-suffix split into both
lanes, pagination hardening + `kb/_verify_cos_sync_lanes.py`, 23 checks) → apply: **6,490
certifications, 83 CER ✓/≈ COS matches** (receipts `kb/cos_match_out/2026-07-07/`). Serving gap
fixed (#677): `pages.yml` `workflow_run: cos-authority-sync` + the `kb/cos_matches.json` assert +
the registry prune (tracker-internal per COS terms). Triage QA (all 10 fixes Sam-approved, applied
in Supabase): ASE/AP/apprenticeship assignments retargeted to EXISTING house families — the
doctrine: retarget-to-existing-family verbatim beats authority-verbatim. **AP art fold APPLIED**
(`kb/_merge_credentials.py`): 5 colon variants → College Board-current, 18 raws + 20 articulations
re-pointed, 9 families → 4. Full story: `docs/exhibit_canonicalization_lessons.md` (2026-07-07
"continued 3"); next: `docs/session_102_handoff.md` (COOL/MOC vs License Finder is Sam's queued pick).


## Archived session narrative — Session 102 (moved from CLAUDE.md §11 at the Session-104 checkpoint)

### Session 102 — SkySeed: the brand-family PRE-SEED — 158 of 451 triage rows in one pass (2026-07-07)

Sam: "pre-seed the common exhibit titles and issuing agencies — all the APs should be an easy win."
Measured: the queue is 38 AP + 125 CLEP = **163 College Board exams (36%)**, and both house families
already exist → `kb/_preseed_unclassified.py` maps each raw to its EXISTING family (cleanup →
normalized key → exact/alias/insert-Language/era-subtitle ladder; twin-pick boosted by the run's own
exact hits so same-exam raws converge; **NEVER invents a title** — residuals report for Sam).
**Applied via MCP: 158 seeded** (`preseed-v1@bot`, on-conflict-do-nothing; md5 of live rows ==
`kb/preseed_out/2026-07-07/plan.json` — the checksum caught 4 nbsp-dropped garbage rows, deleted;
lesson: generate SQL from the JSON receipt, never a terminal round-trip). 5 residuals = 3 multi-level
"Complete both" + 2 Level III (no family). Harness `kb/_verify_preseed_rules.py` (43); skill Rule 5d.
Full story: `docs/exhibit_canonicalization_lessons.md` (2026-07-07 "continued 5").

### Session 103 — Bruh SkyWay: the STAGED pre-seed + triage toggle + issuer authority sources (2026-07-07)

Sam (triaging live all evening — ~90 hand-saves landed DURING the session): "more pre-seeding …
leave them ready to save but not yet saved … a toggle [for] just the ones needing to be triaged …
preseed the credit-by-exam titles using your judgment and the issuing agency CCC."
`kb/_preseed_unclassified.py --stage` → the committed `kb/unclassified_preseed.json`: **163 rows
staged, ZERO Supabase writes** (cx 31 · hs 73 · journeyman 13 · carpenters 10 · ironworker 16 ·
nccer 13 · singles 7; 107 residual — C-##/CSLB, IC-*, fire certs). The CER worklist gained the
**Needs-triage/All toggle** (default hides saved rows), **⚡ prefilled inputs** + badge, and a
confirm-gated **"Save all pre-filled shown"** (saves what the inputs SHOW; live assignment always
wins). Authority links noted for future exhibits (DIR DAS occ 2180 → SW-JATC/CTCNC; NCCER
assessments; CSLB queued): `docs/kb-notes/reference-issuing-agency-authority-sources.md` + skill
Rule 5e. Curator VALUES fetched via MCP are now verified per-row (md5 pairs, order-independent) —
caught 2 nbsp-corrupted rows + Sam's concurrent saves. Tests: `tests/cer_worklist_preseed.test.js`
(29) + `kb/_verify_preseed_rules.py` grown to 73. QA flags for Sam: the THEATER-280 issuer slip,
SMM 4 issuer==title, 3 mojibake `â€”` Generic-CBE families. Full story:
`docs/exhibit_canonicalization_lessons.md` (2026-07-07 "continued 6"); next:
`docs/session_104_handoff.md`.


### Session 104 — Bruh SkyTime: the statewide-catalog pass — 97 of the last 100 staged + college chips + multi-issuer (2026-07-07)

Sam (live, 4 asks): statewide-CR matching ("IC-Welding Level I → NCCER"), originating-college chips,
the CCR crossover think, a blindspot pass — plus 10-Key's missing issuer edit + multi-issuer Fire +
a list-vanish bug. Queue re-measured 451→351 assigned→**100 left → 97 STAGED** (residual = the 3
CLEP "Complete both" spans): v3 lanes in `kb/_preseed_unclassified.py` — statewide/family match over
`statewide_data.js` (133 CCC records, issuers) ∪ house families, `stage_ic`, `stage_cslb` (verbatim +
CSLB), `stage_cx_type` (CPL-Type-routed), +24 receipted singles; harness 76→**100**. Auditor stamps
`colleges` on queue cards → worklist chips; `_suggest_unclassified.py` mechanism-strip (💡 19→39) +
college-scoped COCI joins (`docs/kb-notes/cer-ccr-crossover-integrations.md`). Fold gained the
**`issuer_adds`** multi-issuer lane (append distinct, never overwrite; acronym-dupe guard); Mode A2
in `_apply_credential_review.py` promotes issuer overrides into `credentials.json`; CER: "+N" issuer
chip, "＋ set" on null-issuer cells, **`appendRowSafe`** row-error isolation (+3 test files, suite
140 green). Full story: `docs/exhibit_canonicalization_lessons.md` (2026-07-07 "continued 7"); next:
`docs/session_105_handoff.md`.


### Session 105 — SkyClose: the truncated-read fix + the missing-issuer lane + the seal-blue pass (2026-07-08)

Sam's "fire certs didn't save" + "113 still showing" were ONE bug: 1,200 overlay rows vs
PostgREST's 1,000-row unordered cap — saves were fine, the READ truncated a different tail
per load. `fetchAllRows()` Range-pagination now backs both CER overlay fetchers
(`docs/kb-notes/methodology-paginate-postgrest-reads.md`). Save-All broadened to every
FILLED shown row (hand-typed included) + loud per-row failures + `wlDraft` survival + live
issuer datalists. `_CREDENTIAL_REVIEW::` held ZERO rows — Sam's 10-Key pick had never
landed; "＋ set" now opens the issuer input DIRECTLY and the pick was seeded
(`session105-skyclose@bot`, Mode A2 folds it). New **missing-issuer triage lane** (1,130
null-issuer credentials; `kb/_preseed_null_issuers.py` staged 978 → `kb/issuer_preseed.json`,
verifier 19 checks; empty-Save = explicit no-formal-issuer). COBI-wide: black ink headers →
`--seal-blue`; Curate-panel black-box bleed fixed; CER title/chip row-height pass. Suite 142
green (+2 files). Full story: lessons "continued 8"; next: `docs/session_106_handoff.md`.

### Session 106 — SkySeal: the Triage rules day — 5f / 5c-mech / 5g + four new issuer lanes + multi-issuer (2026-07-08)

Six PRs merged live against Sam's triage pass (#690–#695). **Rules:** 5f (school = issuer =
trainer, title stripped; the EMT-405 unanimity guard), 5c MECHANIZED (CCN > C-ID > COCI course
titles, discipline-prefix strip, code-led + CCSF name-led lookups), **5g** (leading
Beginning/Intermediate/Advanced → END of the title; "Intro" → "Introduction"; AP / Advanced EMT /
ACLS exempt — 68 restyled). **Lanes:** apprenticeship (Norco/Santiago DIR-DAS sponsors, occId
82/490), statewide-agency (blank statewide issuer → AWS, the 5 welding rows), **cert-family**
(FAA ×22 — Part-147 AMT + the Reedley FLGHT ladder), title-style. **Lane UX:** editable titles +
raw/college context; the save→re-edit dead-button trap FIXED (re-arm on input, `data-busy`
in-flight guard); **＋ add issuing agency** → new `issuing_agency_additional_override`, Mode A2
promotes BOTH issuer fields additively (+ Mode A3 trainer). Plan: **1,009 staged / 1,125 queue**,
284 titles, 152 residual; verifier 50 checks; suite 142 green. Full story:
`docs/exhibit_canonicalization_lessons.md` (2026-07-08 "continued 9" – "continued 11 addendum").


### Session 107 — SkyKey: the PR-5b re-key goes LIVE — 49 renames applied, the confirm-merge lane, and Sam's four evening asks (2026-07-08)

Sam's 137 Session-106-day saves folded (dispatch); the refreshed dry-run showed 49 clean
renames held hostage by his 6 merge-shaped collisions (AoJ code rows → existing C-ID-anchored
credentials — the case PR-5b/2 was deferred for). #697 made the collision queue NON-BLOCKING;
the **first production rename apply** (PR-5b/1 run #1) landed all 49 (V1–V4 green; Supabase
106 ops/0 fail; receipts `kb/cred_rename_out/2026-07-08/`). #698 shipped **PR-5b/2**: Save-time
collision detect + confirm → the new `unified_title_merge_confirm` row; a pending-merges strip
for the saved six; dry-run `merges` lane; apply FOLD with dedupe + drift abort. Sam's four
evening asks landed within the hour: unlimited ＋ agencies (#699, " | "-joined + Mode A2 split),
the hs-generic "Local High School" + ase-align lanes (#702 — 12 ASE rows whose Saves flow
through the new confirm-merge), 🔎/✨ issuer lookup via the report proxy (#701); plus the
daily-run push-race fix (#700 — unstaged regen discarded before the retry rebase). Suite 145;
verifier 56. Sam's calls pending: confirm the 6 merges · ASE/AWS/OSHA spellings · IBEW re-point.
Full story: `docs/exhibit_canonicalization_lessons.md` ("continued 12"); next: `docs/session_108_handoff.md`.

## Archived session narrative — Session 108 (moved from CLAUDE.md §11 at the Session-110 checkpoint)

### Session 108 — SkyPhilo: the big triage night — COCI code-titles, the HS rule, and the bulk-CCC close-out (2026-07-08/09)

Four merged PRs + a receipted bulk write, all beside Sam's live ~800-save pass. **#707**:
Rule 5c mech resolves code-titled exhibits from COCI (tight-hyphen "CD-005", the
subject-PREFIX hop "Cinema 24"→CINE 24, code-shaped staged titles upgraded to CCN > C-ID >
COCI) + the 🔎/✨ TITLE lookup. **#710**: Sam's **HS rule — fused CCHS tokens, dotted H.S.,
multi-school rows → "Local High School"; bare `HS ###` = subject code, never a school.
The 17-row CCC/HS audit wrote NOTHING — his split pattern had them (audit the LIVE overlay,
not the bake). **#711**: scoped bulk-CCC close-out — 339 rows as `ccc-bulk-s108@bot`,
INSERT-only, 29 lost the race to his saves as designed. Fold + rename apply landed: queue
**1,036 → 233** (200 re-prefilled). Verifier 63 (queue spots presence-conditional). Full story:
`docs/exhibit_canonicalization_lessons.md` ("continued 14"–"15 + addendum") +
`docs/kb-notes/methodology-live-curation-concurrency.md`; next: `docs/session_109_handoff.md`.

## Archived session narrative — Session 109 (moved from CLAUDE.md §11 at the SkyIron side-lane checkpoint, 2026-07-10)

### Session 109 — SkyBreak: CER v2 — one surface, edits in-cell + the MAP Export feed (2026-07-09)

Sam design-locked a morning mockup (#713; #714 made Pages serve `prototype/`) and the port
landed same-day: the CER main list now edits IN-CELL (title / issuer + unlimited ＋ agencies /
trainer → the same kb_curation overrides as the old Curate panel, merge-collision confirm
inline), with the Triage queues as **lane chips** over one full-width surface (All / 📥
Unclassified / 🏷 No issuer / ⇒ Merge confirms / ○ Not initiated / ✓ Initiated — the ⚠ Triage
button retired), a new **SUBJ** column, Students rename, audit/quality-flag columns retired to
the drawer, Variants/Conf/Elig-units behind ⚙ Columns (`cplCerCols.v1`), lean filters (+CPL
type +Discipline), and **⬇ Excel (CSV) / ⬇ JSON** live extracts. New **🗺 MAP Export tab**
(`map_export.js`) shapes every canonical credential to Malone's MAP Exhibit Module
FullExhibitJSON (sample: `kb/reference/map_full_exhibit_sample.json`) for the MAP integration.
Suite 147 (+`cer_v2_grid` 35 + `map_export`). Full story: `docs/cer_v2_redesign_lessons.md`;
next: `docs/session_110_handoff.md`.

### Session 110 — the carpentry close-out, the stale identities-map find, and the COCI Lookup tab (2026-07-09)

Sam drove live (4 mid-session messages + the decisive MAP export). **252 SUBJ/Discipline
fills** (CARP/Carpentry — 12 queue + 104 CNST-deriving CTCNC family + 10 trade programs;
cohorts `carp-*-s110@bot`) + **18 titles** from Sam's MAP export (rule: Credit Rec minus
"N hours in"; collision folds await his ✓ in the Merge-confirms lane; 707/710/713 + Work
Experience still ambiguous). **Root cause of "CARP 1203"**: `coci_articulations.json`'s
`identities` map was never re-keyed by the 2026-06-12 fold — 681/693 shared keys stale;
CER exporter now prefers the minted catalogs (`docs/kb-notes/methodology-rekey-derived-identity-maps.md`).
Plus the **CER SUBJ filter** and the **COCI Lookup tab** (`#coci-lookup` — 141,738 rows,
M-ID/C-ID/CCN chips, sortable/filterable/resizable, desc shards; `kb/_build_coci_lookup.py`).
Receipts `kb/carp_fill_out/2026-07-09/`; suite 152. Full story: `docs/cer_v2_redesign_lessons.md` (S110).

## Archived session narrative — Session 111 (moved from CLAUDE.md §11 at the Session-113 checkpoint, 2026-07-13)

### Session 111 — SkyMighty: the triple-R day (renames · re-mint · the mountain) + the truth audits (2026-07-10)

**Trail Crew fired across all three R's**: CER 103 clean renames live (#726,
`trailcrew-clean-s111@bot`) · CSR pass end-to-end (#729 — zero official-CCN
squats; **POSC→POLS re-mint APPLIED** #730, 293 ids, 3 pre-fold ghosts healed;
seeder CSR-wired #731) · **CCR wave 1** (#739 — 600 top-leverage ids, 122
agents; 56 fixes FIRED #742, `trailcrew-ccr1-s111@bot`; **wave 2 in flight**).
**Doctrine v0.2** (Sam's 7/3 mind-meld distilled — P-3 ratified, NEW P-11;
fresh calibration seed 20260710 awaits his sitting). **MQ Handbook folded into
all 3 stores** (#737 + KB #20 + vault #18; CSR 🎓/🔧 chip). Same day:
CLAUDE.md pared 2,514→~600 (#727) + 52-agent truth-audit (#728) + **NEW Rule 9**.
Receipts: `kb/{trail_crew,csr,pols_remint,ccr}_out/2026-07-10/`. Handoff: `docs/session_112_handoff.md`.

### Session 112 — SkyEmpyrean: vocational wire-up · MQ re-validation · wave 3 FIRED · Doctrine v0.6 (2026-07-11→13)

Sam asked whether the dataset needed a **new vocational identifier** — a 6-agent
audit said no (the signal already exists 3 ways: `cte` · `mq_list` ·
`noncredit_category` + CSR 🎓/🔧 chips; a `V`-prefix collides with VOCE/VETT/VIET
and bakes a mutable attribute into an immutable key). His HUM/PE catch became a
full **MQ 19th-ed re-validation** (**#746** — positional PDF re-parse; HUM/PE/PEDS
→ master's + **8 dropped disciplines restored incl. Accounting**, 240→248). The
signal wired into the CCR scanner (**#747**) and **wave 3 fired** — 137 discipline
+ 25 title corrections live (`trailcrew-ccr3-s112@bot`; 14 pre-existing titles
left intact, 6 MQ-tighteners held for faculty per D-9). **WELD-in-Carpentry
reverted** (D-10 — discipline is the FIELD, not the program). **CER multi-issuer +
C-ID pre-seed** shipped (**#757**). Capstone: a **calibration sitting** →
**Doctrine v0.6** (**#758**) — Sam's **student-repeat test** ratified as P-1,
anchored to **CA Title 5 §55050** ("similar," not identical), + learning-equivalence
+ refinements P-1a/7a/9a/10a; 30 non-CR/NC calls agreed 100%. Full story:
`docs/ccr_convergence_lessons.md`. **Next: the v0.6 calibration re-seed** (staged —
sampler + payload present). Handoff: `docs/session_113_handoff.md`.

---

---

## Implementation Funding lane — narratives archived 2026-07-31 (SkyQueue cont.)

> Verbatim move out of `CLAUDE.md` §11 per Rule 8's two-narrative budget. The
> Implementation Funding lane had accumulated **nine** inline narratives; the two
> most recent stay in CLAUDE.md, and the full story for all of them lives in
> [`cpl_funding_lessons.md`](cpl_funding_lessons.md) — written once, there.

### SkyReconcile — Implementation Funding: the Sept-2026 BOG amendment becomes the pool authority (2026-07-30)

Closed SkyHighness's queued reconciliation. Sam supplied `20260729_CPL_Amendment_Sep_BOG.xlsx` and ruled:
**amendment governs · both $1M earmarks survive · 2-year window.** The amendment splits the $35M in just two
lines (`College CPL Outcomes Awards $26,040,308` = **$25,240,308 to institutions** + `$800,000` CO staff;
`CPL Projects $8,959,692`) and names no noncredit or rural line — so the earmarks are carved **from inside**
the institution total: `35,000,000 − 800,000 − 8,959,692 = 25,240,308 − 1M feeder − 1M rural = $23,240,308`
main pool; hero **$24,240,308**, avg $210,785 / min $150,000 / max $623,871. `remaining_2025_26` → $9,040,308,
making the $15M N2N residual compute to the amendment's exact **$59,692**. **Data-only** (`cpl_funding_data.js`;
0 consumer changes — nothing downstream hardcoded a pool figure) + **Part R** pinning each line to the workbook;
Supabase Scenario 1 re-pointed ($8M → $8,959,692), Scenario 2 untouched. Tests 515 → **531**. ⚠️ **Two errors
found IN the amendment**, both reported: its `$74,000,000` grand total **double-counts the $8,959,692 project
slice** (true total **$71,000,000**), and its `Max Award $665,971` is a transposition of $665,791 — the max
over **115** colleges — while its average is that pool ÷ **119**. Method (incl. a reconciliation I got wrong
first, from a $1 coincidence that assumed its own conclusion): `docs/cpl_funding_lessons.md` ·
`docs/kb-notes/methodology-recompute-a-sources-own-summary-statistics.md` · handoff `docs/cpl_funding_handoff.md`.

**Cont. 2026-07-30 — the Budget tab becomes the CPL ledger (#938/#940/#941/#942 MERGED, LIVE).**
Sam's full funding history back to 2017 unlocked the organizing insight: **both major asks were funded
in TWO installments** — implementation one-time `$15M (2025) + $35M (2026) = the $50M requested`,
ongoing ops `$5M + $2M = $7M/yr` — and 2026-27 is the year the Legislature made good on each. His three
rulings (AskUserQuestion): one consolidated **$7M ongoing** row; the **amendment's 2-year shape governs
the $35M**; **cutoff at 2025-26, ARCHIVE don't delete**. `budget_funding` stopped being a flat source
list and became the whole ledger — **45 rows** (4 sources · 7 uses · 16 pool · 18 history) via
`description`/`archived`/`parent_id`/`section`/`sort_order`/`window_label` (receipt
`kb/supabase_budget_structure.sql`). **Nothing was deleted:** the two existing $6M rows turned out to be
the *natural parents* of the seven $6M allocations (CO 2,254,764 · RCCD 3,745,236 — they sum exactly).
New **`budget_ledger.js`** renders Sources · Uses · the $18M pool · History, each with collapsible
detail, a Summary⇄Detail preset, and **inline editing on every non-total field incl. descriptions**;
live-fetched so a curator's edit re-renders instantly. **`total` is computed = Σ years and read-only
where a row has years, editable only where the source gives no split** — that rule immediately caught
the $15M source row still carrying its old *spend* schedule (would have shown $24,040,307). Tests:
`budget_ledger` 34 + `budget_ledger_structure` 21. ⚠️ **The load-bearing rule, hit THREE times in one
day (the amendment's $74M, my first mockup, my own seed data): TOTALS SUM PARENT ROWS ONLY** —
`docs/kb-notes/methodology-parent-child-ledger-totals.md`. Sam ruled the amendment's Lightleap $1.4M is
**not** a double count (year-2 extension + more colleges) — do not re-raise. Open with Sam: the two $5M
rows. Story: `docs/cpl_funding_lessons.md` · handoff `docs/cpl_funding_handoff.md`. Side-lane — left
`cpl_todos.json`'s CCR items + the numbered handoff to the CCR mainline.

### SkyHighness cont. — Implementation Funding: the $35M reframe + the $15M Distributions view (2026-07-29, #931/#934 MERGED)

A CBO question at the CO budget workshop ("what are the factors in the allocation formula?") cascaded
into two reframes, both live. **#931 — the tab models the 2026-27 $35M apportionment only** (the
2025-26 remaining ~$9M is a separate topic): `$35M = $26,240,307 three-priority college pool (incl.
$1M rural) + $1M NC feeder + $1.2M CO Administration + $6,559,693 CPL Projects & Innovation` — ties
out to the penny. Hero **$26,240,307**, award range **avg $228,177 / min $150,000 / max $694,273**.
⚠ Sam's precise anchor is **$26,240,307**; his "~$8M for Projects & Innovation" = **admin + P&I**
($7.76M), so P&I alone is the $6.56M residual. **#934 — a third sub-view** (`[$35M Funding model |
$15M Distributions | Report]`): the **ESS 25-82** receipt ($50,000 × **118** = **$5,900,000**; 114
colleges + the **4 noncredit campuses**; **Sequoias declined**), the **$9,040,307** remaining balance
alongside (where the dropped $9M honestly lives), an honest reconciliation naming the **$59,693**
residual, and **per-recipient progress on the three ESS priority outcomes** — JSTs (`vet_star` ≥75%,
memo bar is 100% → caveat inline) · statewide recs (**new** `funding/_build_funding_ess.py` →
`cpl_funding_ess.js`, a 2.3KB sidecar off the 2.9MB CER; 84 credentials → **71 adopters**, 0
unmatched; workflow step 4a3) · proactive CPL (`pe`/`p3`). **Fail-open** marks (no feed → ⏳, never a
false "not met"); the legend says a dash is NOT a compliance finding. Live: **51 · 70 · 94**, **38
meeting all three**. Tests 490→**515**; PII guard extended; Chromium desktop+mobile clean. Method:
*read the policy PDF, don't infer it* — the memo alone gave up the CIO-certification mechanism and the
exact 100% JST bar. Story: `docs/cpl_funding_lessons.md` · handoff `docs/cpl_funding_handoff.md`.

### SkyHighness side-lane — Implementation Funding PR4: combine the floor with the rural bump + display rename (2026-07-28/29, #925 MERGED + rename PR)

Shipped SkyHigh's queued PR4 (`cpl_funding.js` + `cpl_funding_data.js` + test; **0 HTML**). Sam's
call (AskUserQuestion, grounded in the live split): **Option B — guarantee the whole $1M rural
allowance** (floor-fill + bonus, no performance gate) → let me retire the entire ≥50% rural-earning
machinery. **Mechanism = one waterfall, per-college floor:** `allocModel()` gives rural colleges a
REDUCED main-pool floor `max(0, floor − ruralPer)` ≈ $73,077, so the guaranteed rural allowance funds
the top of their $150k floor and the main pool the rest — `mainW + ruralPer ≥ floor` **always** (no
leftover top-up; the "gap > slice" edge case can't arise); `Σ mainW` still = `netCollege()`
(conservation intact), freed main-pool dollars re-split to unfloored colleges. **Guaranteed in Earned
mode:** rural added in full, only the MAIN allocation flexes (resolves the #916 advance-credit note).
Live split: floor-fill **$654,148** + bonus **$345,852** = $1M; Σ totals **$33.8M**; the 5 smallest
rural colleges land at exactly $150k (surfaced that pull-down to Sam). Rural section → **Guaranteed
allowance → Floor-fill → On-top bonus → Window total**. Tests 460→475→**490** (new Parts N/O/P); suite
173 green; Chromium clean. **The adversarial review (4-lens Workflow) earned its keep** — caught a real
Earned-mode bug (a THIRD earned site, the per-priority drill-in, still flexed the guaranteed rural to
$0) + 2 minor fixes, all pre-merge (Part O). **Follow-up: the display rename** ("West Hills Coalinga"→
Coalinga College, "Imperial"→Imperial Valley College) via a `display` field + `dispName()`, display-only,
join key kept (Part P). Story: `docs/cpl_funding_lessons.md` (SkyHighness) · handoff. Side-lane — left
`cpl_todos.json` + the numbered CCR handoff alone.

### SkyHigh side-lane — Implementation Funding: readability + equitable cells + rural fold + 13-college roster (2026-07-28, #914/#916/#921 MERGED)

Three merged PRs (JS + the data roster; **0 HTML**). **#914:** "How an allocation is computed" →
left-justified bullets; **full-width** (scoped `#tab-implementation-funding .main-container{max-width:none}`)
+ left-justify; **mobile + a11y** (keyboard sortable headers `aria-sort`, a real `<button>` caret keeping
`<tr>` semantics, `aria-pressed` toggles, table region + sr-only caption, focus restored after the
innerHTML re-render — WCAG 2.4.3, ≤640px media query); **equitable per-priority cells** — `Tgt N stu ·
$cap`/`Now N stu · $earned · %`, the per-student **rate moved OUT of the cell into the hover** (it varies
with floor/rural → reads as inequitable inline; % of target is the shared yardstick); sections default
collapsed except the college table. **#916 — rural allowance FOLDED into the rows** (`W = mainW +
ruralWindow`, assume the ≥50% unlock, disclosed in the hover): `netCollegeWithRural()` so **Σ rows == the
SYSTEM total**; `earnAgg.perPrio` stays main-pool (policy cards). Pool reconciled to **ONE number $33.8M**
with a "$32.8M main + $1M rural" note; the **rural pool card is now an earmark, not a deduction**. **#921 —
rural roster → the 13 federally-rural CCCs** (the 10 were the RCTC *demo* cohort); the per-college bump is
**derived** so it auto-became $1M/13 ≈ $76,923 (data-only flip) + a muted, larger 🌲. Tests 422→**460**;
two adversarial reviews per structural change caught the focus-restore a11y bug + the $1M pool-framing
cascade. **QUEUED (PR4, Sam's ask): combine the floor with the rural bump** — backfill rural colleges to
$150k from the carve-out first (frees ~$752k main-pool for non-floored colleges); lock the guaranteed-vs-
earned split first. Story: `docs/cpl_funding_lessons.md` (SkyHigh) · handoff `docs/cpl_funding_handoff.md`.
Side-lane — left `cpl_todos.json` + the numbered CCR handoff alone.

### SkyMore side-lane — Implementation Funding: front-load-aware formula · cell re-weight · feeder 2-batch + F1/F2 · rural per-priority earn (2026-07-27, #908/#910 MERGED)

Four curator asks, two JS-focused PRs. **#908:** (1) the **"How an allocation is computed" box now
branches on the Even ⇄ Front-load toggle** (it read as an even-tranche explainer even when front-load
was ON — one `cadenceSentence` tells each mode's whole story); (2) college-row P-cells **re-weighted**
so the earned **dollar** (`.cf-u`) is bold navy and the count + % recede (CSS only); (3) noncredit
**feeder rows show the 2-batch/yr cadence** (`feederBatchNote` "2 batches · $X ea", tied to the Timing
section). **#910 (Sam's two AskUserQuestion picks):** (4) the **rural allowance earns PER PRIORITY with
a ≥50% FLOOR** — `ruralEarned` splits each $100k by the 3 priority shares, each slice unlocks at ≥floor
then pays in proportion (reuses `earnFraction`, same engine as the main pool; kills the old binary
≥50%-of-average cliff; dead `ruralAttainment` deleted); (3b) **feeder measurables F1 + F2** — **F1
(eligible headcount) is live-wired** (builder `_feeder_resolver` + per-feeder `pe` bucketing →
`feeders:{short:{pe}}`, empty until NC campuses attach exhibits in MAP; consumer measurables ladder),
**F2 (NC-cert CPL waivers)** an honest "awaiting a data source" placeholder; ladder states what's NOT
tracked (transcription; JST/Veteran Star). Tests 390→411→**422** + builder 16→**19**; suite 173 green.
Method: *wire computation+display end-to-end but resolve to a pending state — never seed a fake count.*
Story: `docs/cpl_funding_lessons.md` (SkyMore + round 2) · `docs/cpl_funding_handoff.md`. Side-lane —
left `cpl_todos.json` + the numbered CCR handoff alone.

### SkyMoney side-lane — Implementation Funding: collapsible sections · per-student rate · P1/P3 metric wiring (2026-07-27, #901 MERGED)

Three curator asks, one PR (`cpl_funding.js` + the actuals builder + tests; **0 HTML**).
**(1) Collapsible sections** — every top-level section is a native `<details>` whose
`<summary>` is its h3 (8); `section()`/`collapseH3()` helpers, open/closed persisted
(`cplfund_sections_v1`, default open, saved on `toggle`) so it survives the re-render every
edit triggers. **(2) Per-student rate replaces "% of headcount"** — curator types `$/student`,
reach (# students / %) is DERIVED = `share × perYear ÷ per_student`; **`per_student` is the
stored source of truth and `target_rate` is derived from it at the ONE seam (`priorities()`)**,
so every downstream `target_rate` reader keeps reading it unchanged — no consumer re-wired for
the inversion (display sites were edited to *show* the rate, not to change the target math; KB
note `methodology-invert-an-input-derive-at-the-single-seam`); legacy rows fall back +
self-migrate; rate shows inside each P-cell. Sam's $61.46 confirmed. **(3) Data-gap wiring** —
P1's reworded "eligible" metric → the eligible count (`pe` ≈ **43,000**, 43,284 on the
2026-07-27 feed) **already in the feed** (matcher only, no pipeline change); P3's portal metric
→ new builder `pp` count (Potential Student = Yes + transcribed) with **`advance:true`** → a new
`earnFraction` status **`advancing`** shows the count but pays full cap so the handful of
mostly-test records (**pp = 5** post-dispatch) don't zero out P3 in Earned mode (flip off when
the Portal is live). Tests 376 → **390**; real-Chromium clean. Two judgment calls
flagged for Sam (uniform vs per-college `$/stu`; P3 advancing vs zeroing) — both 1-liners.
`pp` published via the post-merge `daily-dashboard.yml` dispatch (pp = 5). Story:
`docs/cpl_funding_lessons.md` · `docs/cpl_funding_handoff.md`. Side-lane — left
`cpl_todos.json` + the numbered handoff to the CCR mainline.

### SkyFriend side-lane — COBI Implementation Funding: uniform fonts · metric-keyed actuals · allocation-balance box (2026-07-23)

Three curator asks on the Implementation Funding tab, one JS-only PR in `cpl_funding.js`
(continuing SkyFunder). **(1) Uniform fonts** — the whole priority box (desc/nums/metric/
strategies) + Timing rows → `.8rem` (the smaller size already in use); only the priority
**title** stays 1rem (strat/timing rows had been inheriting the page base). **(2) Actuals
follow the METRIC, not the slot** — Sam reordered priorities (Access ⇄ Success) and the
position-indexed `MEASURABILITY[slot][idx]` map left the "any transcribed" ACTUAL (16,807)
pinned under the statewide-eligibility priority. Replaced with `MEASURES` = ordered
`test(metric)` predicates (portal → eligible/statewide → matched-MIS → completion → units →
any-transcribed), first match wins; the measure now travels with the metric wherever the
curator drops it (default order resolves identically — all prior assertions green). Call
sites `actualLineHtml`/`collegeDetailHtml`/`ruralAttainment` pass `p.metric`. **(3)
Allocation-balance box** in the Funding Pool area (`perYear − perYear×Σshare`, viewed-year
shares): `$0` at 100%, red **Over-allocated** > 100% (the modern N3-BALANCE cell), surplus
< 100%; Projection-% line reworded. **Confirmation Sam asked for:** the **Allocation share**
moves money; the **Projection %** is a performance target only — it does NOT cap funding
(that coupling was the pre-2026-06-11 model, removed on purpose). Tests 325 → **337**; suite
168 files green. Story: `docs/cpl_funding_lessons.md` (SkyFriend) · `docs/cpl_funding_handoff.md`.
Side-lane — left `cpl_todos.json` + the numbered handoff to the CCR mainline.

**Cont. 2026-07-24 — achievement-based funding (cap-and-earn):** the projection-% thread
surfaced that the tab funds on **headcount, not achievement** — and never did (confirmed
against Sam's actual workbook formulas). Told him plainly, then built what he confirmed
(AskUserQuestion): allocation = a **CAP**; `earned = cap × min(1, actual ÷ target)`, capped
at 100%, unearned rolls forward — so a college draws *proportional* funding (never needs the
full target) and a non-participant earns **$0** (the incentive). A **Potential ⇄ Earned**
basis toggle (default Potential) overlays pool Earned/Unearned cards, per-priority earned %,
table earned-of-cap, drill-in per-priority earned. The projection % is now the achievement
target. **Load-bearing rule** (new KB note
`methodology-achievement-based-funding-cap-and-earn.md`): the default for an *unmeasured*
cell depends on WHY — metric-gap/feed-pending → advance full cap; feed-loaded-but-college-
posted-nothing → $0; suppressed(<5) → $0 flagged. Phase-in: only Year-1 "any transcribed"
is measurable today; the rest advance and flip automatically as feeds land. Tests +20 →
**357**. Story in the lessons doc.

**Cont. 2 — column show/hide + eligibility audit:** a **⚙ Columns** menu (county hidden by
default; per-view + persisted; hide via `nth-child` CSS off `activeCols()`, sparing detail
rows; identity column never hideable) + reframed the Elig tooltip/drill-in as the
**participation gate**, separate from earned funding. Tests → **367**. **Queued** (same batch):
per-priority P1/P2/P3 columns with **stacked target/actual cells** (recommended over 2 physical
rows), column resize, and per-column multi-select filters — see the lessons doc.

**Cont. 3 — per-priority P1/P2/P3 columns + numbered Elig pie:** shipped #5+#6 — Eligible†/
Transcribed† → **three P1/P2/P3 columns**, each cell **stacks target over actual** (`target·cap`
top, `actual·earned·%` bottom, `earnFraction`-driven), header hover = goal+metric; compact
`fmtCountK`/`fmtMoneyK` keep it narrow. The Elig ✓/◐/○ glyph → a **numbered SVG pie** (one green
slice per met requirement; N-slice not forced-4 — 2 today, grows as more per-college-checkable
reqs are wired). Tests → **376**. Deferred (Sam OK'd): column resize + per-column filters.

### SkyFunder side-lane — COBI Implementation Funding tab reorg (2026-07-23, #878–#884 MERGED)

Curator-facing asks on the Implementation Funding tab across three rounds, five JS-only
PRs (all in `cpl_funding.js` — **0 HTML touched**, no Rule-4 mirror, clean of a parallel
Fact Sheet session). **#878:** Total Available Funds card ($44,040,307 = remaining + one-time, live)
· Award-range Avg/Min/Max cards · SYSTEM total row `<tfoot>`→pinned first `<tbody>` row.
**#879 — the architecture:** the 3-layer config (`SCENARIO ?? SHARED ?? BASE`) generalized
to a **shared multi-project / multi-scenario** model in the SAME `cpl_funding_config` row
(no schema change — `SHARED` became a pointer into `projects[pid].scenarios[sid]`; every
accessor unchanged). Top strip `[Project ▾ +Add · area badge][Scenario ▾ +New(clone) ✕]`;
curator-gated create/delete; `+New` clones current; `+Project` clones the CPL template +
tags a COBI area (CPL/C&I/CIP/GR via `CPL_ORGS`); backward-safe `normalizeConfig` migration.
**#880:** the 📄 **Report** sub-tab — an editable **ESS-25-82 memo** generated from the live
model (masthead·TO/FROM/RE·Funding Overview·Priority Outcomes·Allowable Use·Allocation
table·Reporting·Conclusion·cc), doc-type toggle Memo/Letter/Report/Brief, exports Copy/PDF/
**Word** (DOM→docx walker over the repo's `docx.min.js`). Pushback taken: the Letters tab is
a cross-repo iframe (KB Supabase), so the memo lives native + reuses the docx stack.
**#883 (round 2):** editable priority **titles** (Access/Success/Capacity, **year-specific** —
ride the per-slot `prioField`/`setPrio` path) · **Recommended Strategies** editable list per
priority · a **Timing** milestone list (label + optional date, add/delete, 9 seeded) · editable
Baseline-eligibility intro. **#884 (round 3):** **editable/add/delete Funding Pool boxes** —
editable labels (hover-title), ＋Add revenue/deduction + per-box kind toggle, delete-custom /
hide-core behind a `confirm()` warning + restore strip; net generalized to
Σrevenue−Σdeduction−carve-outs (**conserved** — identical to the old formula when no custom/
hidden, test-guarded); carve-outs + computed cards non-deletable; also dropped the duplicate
"% of each tranche" priority header. Tests 266→**325**; all three rounds real-Chromium verified
(0 console errors, no horizontal scroll). Full story: `docs/cpl_funding_lessons.md`. Side-lane —
left `cpl_todos.json` + the numbered handoff to the CCR mainline.

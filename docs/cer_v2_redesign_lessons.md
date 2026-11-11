---
title: CER v2 — the triage-first single-surface redesign (+ MAP Export)
date: 2026-07-09
tags: [cer, ui, redesign, triage, in-cell-editing, map-export, lessons]
artifacts:
  - credential_reference.js
  - prototype/cer_triage_redesign_v1.html
  - map_export.js
  - kb/reference/map_full_exhibit_sample.json
  - tests/cer_v2_grid.test.js
  - tests/map_export.test.js
related:
  - "[[CLAUDE]]"
  - "[[docs/exhibit_canonicalization_lessons]]"
  - "[[docs/kb-notes/reference-ui-design-system]]"
---

# CER v2 — the triage-first single-surface redesign

## Session 109 (SkyBreak), 2026-07-09

### The ask (Sam, verbatim intent)

Sam's pain with the old CER main list: edits were buried — open a row, find
the scroll bar, find ✎ Curate, open a panel, edit, close, repeat — while the
Triage lanes let him "do all my edits in-cell on the surface." His asks:

1. Combine the CER tab into the Triage aesthetic — in-cell edits on the
   surface, full drill-in on demand.
2. Kill Eligible Units; "Eligible students" → "Students"; columns hidable or
   gone (no audit chip, no quality flag on the surface).
3. SUBJ column beside Discipline.
4. Full window width; leaner filters; zero header prose.
5. (After the design lock) ⬇ extract buttons for Excel + JSON, and a view of
   the data shaped to **Malone's MAP Exhibit Module FullExhibitJSON** — MAP
   lacks the canonical layer under the locally-determined exhibit titles,
   and the CER *is* that layer.

### Process — prototype → lock → port (it worked)

`prototype/cer_triage_redesign_v1.html` (#713) was built and reviewed the
same morning; Sam blessed it ("Love it!!! Make it so!") before a line of the
real port was written. Two mid-review learnings got fixed on the spot:

- **The lean Pages deploy pruned `prototype/`** — prototype URLs 404'd. #714
  serves the gallery + asserts the mockup file in the deploy check. The
  prototype gallery is a *design-lock surface*; it must be reachable in a
  browser, not just in the repo.
- "How do I open the html in Chrome?" — GitHub's file view never renders
  HTML. Answer for the record: the Pages URL (once served), or double-click
  the file in the vault clone.

### What shipped (the port)

- **One surface, six lanes.** `state.lane` ∈ all/unc/noiss/merge/open/done —
  chips injected above the toolbar, counts live. The triage sections were
  ALREADY in-cell, so the lanes reuse them verbatim: `renderWorklist(section)`
  grew a section param ("unc" = unclassified queue only, "noiss" = the issuer
  lane w/ `skipMerges`, "merge" = the pending-merges strip). The legacy
  `openWorklist()`/`worklistOpen` combined panel still works (tests + muscle
  memory); the ⚠ Triage toolbar button is retired — its open/awaiting-fold
  count semantics moved onto the 📥 Unclassified lane chip.
- **The main grid edits in-cell** (the issuer-lane pattern promoted):
  Unified Title, Issuing agency (+ unlimited ＋ additional agencies), Trainer
  are inputs; edit → mustard dirty stripe + per-row 💾 Save + toolbar
  **💾 Save all (N)**; Enter saves, Esc reverts a field. `saveGridRowCore()`
  diffs the draft against the overlay-applied baseline and writes ONLY the
  changed fields **through the exact same kb_curation override lanes the
  Curate panel used** (`unified_title_override` w/ PR-5b/2 merge-collision
  confirm + `unified_title_merge_confirm`, `issuing_agency_override`,
  `issuing_agency_additional_override` " | "-joined, `training_agency_override`)
  — so Mode A2, the rename apply, and the fold see byte-identical curation.
  Merge collisions surface INLINE under the title input as you type.
- **Columns:** SUBJ (new — modal SUBJ4 across `articulations[].cid` first
  tokens, cached per row) · Discipline · Issuing agency · Trainer · Students
  (renamed). **Audit + Quality flag columns deleted** (both still visible/
  editable in the drawer's Curate panel); Variants/Confidence/Eligible-units
  demoted to a **⚙ Columns** picker persisted per-browser (`cplCerCols.v1`).
- **Filters:** Search · CPL type (new) · Discipline (new) · Issuer · Conf ·
  Group · ⚙ Columns · ⬇ Excel (CSV) · ⬇ JSON. Audit-tag dropdown + flag
  checkbox retired from the bar (state fields kept, inert). Header prose
  deleted from both HTMLs (Rule 4) — one summary line remains.
- **Full-bleed:** `#tab-credential-reference > .main-container{max-width:none}`
  via the injected CSS (no Rule-4 mirror needed).
- **Extracts:** live, overlay-applied. CSV (BOM + CRLF, opens in Excel; one
  row per credential w/ variants + articulated courses joined) and JSON
  (`{_meta, credentials:[…]}` incl. SUBJ, articulations w/ local courses).
- **Signed-out** views stay read-only: plain text cells, the title button
  still expands, zero inputs.

### MAP Export tab (Malone's integration feed)

`map_export.js` (new lazy tab, hash `map-export`) renders every canonical
credential in the **MAP Exhibit Module FullExhibitJSON shape** — sample
committed verbatim at `kb/reference/map_full_exhibit_sample.json` for
provenance. One record per unified title; honest nulls where we hold no
data; additive extension fields (`localVariants` = the raw college titles
with confidence/quality-flag, `trainingAgency`) documented in the export's
`_meta`. Live overlay applied (title/issuer/trainer overrides win). Search +
master-detail JSON viewer + ⬇ Download all / per-record / CSV.

### Test-fallout method (worth repeating)

12 of 20 CER test files broke on selectors, zero on behavior. The contracts
all survived — they just moved: triage-button label semantics → the
Unclassified lane chip; "＋ set" → the in-cell issuer input; hidden-by-default
columns → a localStorage pref the test seeds before boot. One genuinely
interesting one: `cer_row_error_isolation`'s poison (`quality_flag: 5`,
numeric → `.replace` throw) died with the flag column — repoisoned as
`conf_title: "bogus"` (→ `crTitleChips`' `.toFixed` throw). **When a redesign
kills a poison path, find the new nearest throw — don't delete the isolation
test.** New guard: `tests/cer_v2_grid.test.js` (35 checks: lanes, in-cell
save wiring, SUBJ, column retirement/resurrection, extracts, anon).

### Gotchas for future sessions

- `ensureWorklistData()` now runs at init (lane counts) — tests that relied
  on "preseed not yet loaded at 120ms" see the post-load counts.
- Grid re-render replaces rows — in-place row updates (dirty stripe, status
  cell) must never trigger `render()` from `oninput` or focus dies (the
  worklist's `applySavedAssignment` lesson, again).
- `renderToolbar()` ends with `renderLanes()` so every in-place save path
  that refreshed the old button count refreshes lane counts.
- The eligible-units test enables its column via
  `localStorage.setItem("cplCerCols.v1", '{"elig":true}')` pre-boot.

### Next concrete steps

- Sam drives the v2 surface for a session; tune row height / column widths
  from real use.
- Malone reviews the MAP Export shape; his deltas land in `map_export.js`'s
  mapping (one function, documented field-by-field).
- Candidate follow-ups: unclassified rows folded INTO the main grid (v2.1),
  datalist-backed trainer input, per-lane keyboard nav.

## Round 2 — same day (Sam's shakedown asks)

1. **Cream tab background** — `#tab-credential-reference{--cer-cream:#FEF9DA;
   background:var(--cer-cream)}` as a SCOPED token in the injected CSS (no
   :root/Rule-4 mirror needed for a one-tab role); the table wrap stays
   opaque white (data never sits on tint — design-system rule).
2. **Discipline + SUBJ edit in-cell** at the credential grain — NEW
   kb_curation fields `discipline_override` + `subj_override` (SUBJ
   normalizes UPPERCASE at save; discipline gets a datalist of known
   disciplines). **Overlay/display-only for now** — deliberately NOT in the
   `_apply_credential_review.py` promotion lanes (the anchor-proposal
   precedent): they persist in Supabase, render live, and ride the ⬇
   extracts + exports. Wire a promotion lane when/if Sam wants them folded
   into `kb/credentials.json`.
3. **⇆ merge-suggestion chip** — normalized-title-signature collisions
   (lowercase · parentheticals dropped · cert/license/exam-family stopwords
   dropped · roman numerals folded · tokens sorted; the exhibit-layer analog
   of the CCR's `_sug_sig`). The chip opens an inline panel listing the
   look-alikes (issuer/students/variants; ⚠ different-issuer warning when
   certifying bodies conflict — First Aid AHA vs Red Cross stays Sam's
   judgment); "⇆ Merge into this" sets the row's title to the TARGET'S KB
   KEY and routes through the standard PR-5b/2 confirm-merge flow — zero new
   merge machinery, never auto-applied.

Also: Sam asked why saved unclassified rows still show — they're "awaiting
fold" (the lane chip says so); dispatched `daily-dashboard.yml` to fold his
102 on the spot. Tests: `tests/cer_v2_round2.test.js` (25); suite 148.

## Round 3 — same day (the nine-item shakedown)

UI batch (all in `credential_reference.js`'s injected CSS/render layers):

1. **Ghosted cream** — `--cer-cream` went `#FEF9DA` → `rgba(254,249,218,.8)`
   so the First Light painting shows through the tint, matching the other
   tabs' translucency. Kept SCOPED to the CER pane (a global `--paper`
   re-theme would alter the Sam-blessed First Light v1.6 spec + the
   contrast-lint baselines — pushed back, offered as a follow-up decision).
2. **Originating-College filter** — datalist-backed input; options = union of
   each row's `collegesOf()` (audit-stamped entering colleges, falling back
   to articulating); a reserved **"CCC (statewide)"** first option filters to
   `row.statewide`.
4. **User-adjustable column widths** — a `.cr-resize` drag handle on every
   sortable th (`attachResize`); widths keyed by the column's SORT KEY
   (stable across regens), persisted in `cplCerColWidths.v1`; saved widths
   flip the table to `table-layout:fixed`; **↺ reset widths** lives in the
   ⚙ Columns panel. Handle clicks `stopPropagation()` so a resize never
   fires the th's sort.
5. **Violet → CO dark blue** — `.cr-chip-gen` / `.cr-chip-mergesug` /
   `.cr-mergesug-h` text (+ chip border) now ride `var(--seal-blue)`. The
   design system's violet = "machine-suggested" semantic cedes to the CO
   palette on this tab per Sam's call.
6. **Header row text white** — `.cr-table th{color:#fff}` (+ active sort
   indicator), replacing the gold.
7. **Initiated clarified in-product** — the ○/✓ lane chips + the Status
   column th now carry full tooltips: *Initiated = a one-time curator
   sign-off recording who checked the AI classification and when; it changes
   nothing in the data and is never required.*

Data batch (receipted INSERT-only bulk writes via the Supabase MCP, per
`docs/kb-notes/methodology-live-curation-concurrency.md`):

3. **CARP course-code titles → COCI course titles** — 132 CTCNC exhibits
   titled "…Apprenticeship — CARP NNN"; each row's own single articulation
   carries the COCI-derived course title, so resolution needed no xlsx
   lookup. **113 applied** as `unified_title_override` (cohort
   `carp-title-s109@bot`), **19 skipped with reasons**: 12 no-articulation
   (CARP numbers are CTCNC-internal, not COCI keys — unresolvable), 3
   duplicate-target ("Rigging" ×3 — folding them is a merge, Sam's call), 3
   multi-articulation ambiguous, 1 existing-key collision. Plan + SQL:
   `kb/carp_title_out/2026-07-09/`. Renames display live in the tab; the KB
   re-key rides the next PR-5b rename apply (dry-run already in the cron).
8. **Apprenticeship tagging** — new overlay-only kb_curation field
   **`cpl_type_override`** (fetched/applied/saved like discipline/subj;
   `cplTypesOf(r)` feeds chips, the CPL-type filter, and both extracts).
   "Apprenticeship" is a CER canonical-layer type, NOT in MAP's CPL-type
   vocabulary (Credit By Exam / Industry Certification / Portfolio Review /
   Military / Standardized Assessment / Other) — the raw MAP types stay in
   the data underneath, and the override REPLACES the type on this surface
   (a tagged row leaves the Industry-Certification filter). **318 applied**
   (cohort `apprentice-tag-s109@bot`): title matches /apprentice/i OR issuer
   is an apprenticeship body (JATC/CTCNC/IBEW/UA/NEIEP/…). **5
   variant-only matches receipted for review, not written** (one college's
   label doesn't reclassify a credential): BCOA + Fire In-Service rows.
   Plan + SQL: `kb/apprentice_tag_out/2026-07-09/`.

Both jobs verified in Supabase (113 + 318 rows under their cohort emails).
Plan builder committed as `kb/_carp_apprentice_plan_s109.js` (provenance).
Tests: `tests/cer_v2_round3.test.js` (24); grid + round-2 tests updated for
the ↺ reset button sharing `.cr-export-btn` (find export buttons by label,
never index). Suite 150 files green.


## 2026-07-09 (Session 110) — carpentry pass 2 CLOSED + the stale identities-map find + the COCI Lookup tab

Sam drove this one live (three mid-session messages + the decisive MAP export).

1. **SUBJ/Discipline fills (252 rows, receipted).** Sam's calls: queue rows →
   **SUBJ CARP / Discipline Carpentry** (Carpentry is a curator-reviewed CCR
   canonical: SUBJ4 `CARP`, reviewed 2026-05-23 — so the pair is
   registry-consistent), then (screenshot) the whole CTCNC family deriving
   CNST/Construction Technology → CARP/Carpentry too. Wave 1 = the 12
   zero-articulation queue rows; wave 2 = 104 CNST-deriving family rows + the
   10 blank trade-program rows (Cabinetmaker/Carpenter/Pile Driver/… — flagged
   in the receipt for spot-review, e.g. Drywall Applicator's course siblings
   derive INDT). INDT/DRAF/MACH/CNSC/ARCH/ELEC-deriving family rows kept their
   honest derivations. Cohorts `carp-subj-s110@bot` / `carp-disc-s110@bot`,
   INSERT-only, fresh-read precheck (zero collisions). Receipts:
   `kb/carp_fill_out/2026-07-09/`.
2. **The title dig ENDED — Sam's MAP export is the authority.** He pulled the
   MAP Dashboard "Collaborative Exhibits" export for American River (committed
   in the receipt dir) and gave the derivation rule: *title = Credit
   Recommendation minus the "N hours in " prefix* (the same data rides the
   daily Custom Report pull). **18 titles written** (cohort
   `carp-title-s110@bot`): the 12 unresolvables + the 3 Riggings + CARP 1203 +
   FA/C ("CPR for Carpenters Apprentices") + OSHA Training ("OSHA 10-hour
   Construction Training Course"). MAP itself does NOT differentiate the 3
   Riggings (019/312/608 are all just "Rigging" — trade-band lanes:
   0xx carpenter · 3xx scaffold erector · 6xx); collision folds (Rigging ×3,
   Blueprint Reading-Residential ×3 incl. an existing key, etc.) queue in the
   **⇒ Merge confirms lane for Sam's per-row ✓** — the PR-5b gate, never
   auto-folded. Excluded as still-ambiguous: 707/710/713 + CTCNC Work
   Experience (two distinct credit recs each in MAP). Bonus receipt:
   `ctcnc_equivalence_crosswalk.json` — ARC's catalog descriptions literally
   say "equivalent of course number NNN for the Carpenters Training
   Committee…" (86 mappings; corroborates the MAP titles).
3. **ROOT-CAUSE FIND — Sam's "where does CARP 1203 come from?"** The CER
   drawer said CNST M1009 = "Finish Carpentry", but all 3 of M1009's members
   are "Tool and Equipment Applications". The **`identities` map inside
   `kb/coci_articulations.json` was never re-keyed by the 2026-06-12 fold's
   slot-reuse permutation — 681 of its 693 catalog-shared keys still describe
   each slot's PRE-fold occupant.** Fixed generator-side in
   `export_credential_reference()`: the minted/singleton catalogs (re-keyed by
   every apply) now REPLACE identities-sourced title/discipline/TOP on
   overlap; identities still covers C-ID/CCN anchor keys. Verified: M1009 now
   derives "Tool and Equipment Applications" + TOP 0952.10. The S109 renames
   were unaffected (0/113 mismatches — their via-M-IDs postdate the fold).
   Residual: `_build_statewide_prescriptive()` reads only `over_merged` from
   the stale map (low stakes, noted); the durable fix is adding the identities
   rebuild to the re-mint post-apply chain. KB note:
   `docs/kb-notes/methodology-rekey-derived-identity-maps.md`.
4. **SUBJ Code filter (CER).** Datalist input beside Discipline over distinct
   `subjOf(r)` — override-aware (the overlay pre-seeds `_subj`, so the CARP
   fills are first-class). `tests/cer_subj_filter.test.js` (11).
5. **COCI Lookup tab** (`#coci-lookup`, Reference & Curation group) — Sam's
   ask mid-dig: the raw COCI catalog as a lookup surface. 141,738 rows ·
   120 colleges, key fields + **M-ID/C-ID/CCN chips per row** (control-number
   join via memberships + singletons; 119,977 rows carry an M-ID), catalog
   description on row expand. Sortable headers, search/College/Subject/
   identity/credit filters, drag-resizable widths (`cplCociColWidths.v1`),
   ⬇ CSV of the filtered set. Builder `kb/_build_coci_lookup.py` →
   `coci_lookup_data.js` (17 MB, lazy on first open) + 25 per-subject-letter
   description shards (56 MB, fetched per expanded row). STATIC artifacts —
   rebuild on a fresh COCI extract; NOT in the daily git add list.
   `tests/coci_lookup.test.js` (20). Suite: **152 files green**.

## 2026-07-10 (Session 110 close) — Trail Crew 🥾 runs: 239 findings adjudicated

The first full method+magic run (28 agents: 15 canon-guided adjudicators + 13
adversarial merge skeptics, 0 errors). Receipts: `kb/trail_crew_out/2026-07-10/`.

- **105 clean renames (fire-ready)** — roman→numeric levels + style fixes with
  zero key collisions ("Apparel Construction I → 1", the CLEP/DSST official
  roman stylings converted per Sam's canon-wins rule).
- **18 merge candidates** → the ⇒ Merge-confirm lane (Firefighter I/1,
  Fire Instructor II/2, Welding II/2 — notation twins that survived the
  skeptics; collisions with existing keys).
- **7 issuer canon picks** (ICC/AWS/DBC/BVNPT/NCCER/OSHA long-forms) — these
  UPDATE curator-authored override rows, so per-cluster approval.
- **7 judgment queue** — the genuinely human calls (bare "AP Physics" — the
  College Board issues no such exam, a level was stripped; bare "Spanish" vs
  its leveled siblings; "ESL 108C" all-code title).
- **102 rejected/keep** — the magic half doing its job: ASME "BPVC Section IX"
  protected as a code-section designation (never "Section 9"), "OSHA 30"
  recognized as the credential's own name (not a course code), Sam's 14 parked
  merge confirms untouched.

Nothing auto-applies — firing each lane is Sam-authorized, via the standing
bulk-write pattern. Pattern + the CCR/CSR scaling strategy:
`docs/kb-notes/playbook-trail-crew-method-magic-audit.md`. NEXT (Sam's call,
2026-07-10): **CSR pass first** ("they are used to mint MIDs… get it right now
and we have an amazing foundation") — small surface (148 curator-reviewed
entries), key-generating layer, includes the official-CCN-subject collision
check that exists nowhere else; then the CCR mountain in leverage-ordered waves.

## S411 SkySotol (2026-10-18): the procedures redesign, and a fold that stopped in July

- **Sam's ask** (~02:55Z): the next UI pass makes the tab as simple as possible, and he adds procedures that sessions
  apply, because he no longer has time to curate the list. Lane: `docs/reference/lanes/cer-procedures.md`.
- **The fold has applied nothing since 2026-07-08.** `--apply-if-safe` holds every assignment when any conflicts: 18
  conflicts, 176 clean assignments waiting (every daily report since 2026-07-15 reads the same). The tab's copy says
  saved assignments fold "automatically on the next daily refresh". A gate that holds everything for one exception
  hides its own backlog: report what it held, and hold only the exception.
- **The backlog grew from 241 (2026-07-16) to 1,498 (2026-10-17)** with no KB entry since July; the classifier that
  reads the skill as its prompt was never wired to a workflow.
- **The mock-up** (https://claude.ai/artifact/Gu6HTwqSwMYLSy4C4xRag3) reduces seven view chips to three words (Needs
  you, Procedures, Reference) and retires the Initiated sign-off and the Curate panel. Three calls went to Sheet 93.


## S416 SkyCeanothus (2026-10-18): Sheet 94's three rulings built

- **A gate that holds everything for one exception hides its own backlog; a hold per item shows it.** The fold's V1
  held 176 clean assignments behind 18 conflicts for three months, and the tab kept promising a fold on the next
  refresh. Each assignment is now folded or held on its own, the report lists `held` with the standing title, and the
  procedures run carries that list to Needs you. The test that pins it (`tests/fold_unclassified_test.py`) builds a
  four-assignment knowledge base in a temp dir and points the module's path constants at it, so the whole `main()`
  runs, receipts included.
- **The held conflicts were invisible because they are not in the queue.** The reference classifies each of the 18
  raws already, under a bulk review stamp of 2026-06-02; the worklist assignment came a day or two later. The audit
  lists only raws with no entry, so the tab never showed them. A hold needs a place to be seen: the Held lane now
  renders them with the standing title and one word, *Keep the reference's title*.
- **A nightly writer's cohort is the procedure, not a session.** `<lane>-s<N>@bot` names who ran a session's write;
  a save the procedures run makes every night has no session, and Sam's ruling is "reversible by procedure". So the
  cohort is `cer-procedure-<id>@bot`, and undo is one DELETE by cohort. The receipt still lists every row.
- **A fresh read of `kb_curation` must page.** The applier's one-shot GET is fine for a plan's few rows; the saver's
  read of every `_UNCLASSIFIED::` title row is over a thousand, past PostgREST's cap (the 2026-07-07 lesson at the
  tab's own fetch). The `Curation` client reads with `Range` headers and stops on a short page.
- **A rule's settlement is sure by the rule.** The classifier's results save at 0.85 or better; a rule procedure's
  settlement saves at the rule's word, including the course-identity rule's 0.8 (the college's own course title). The
  lane records it so Sam can say otherwise.
- **Removing a column moves a test's view.** `cer_v2_grid` found the No-issuer lane (in Needs you) and then read the
  grid's headers; the check that used to switch it back to Reference was the Not-initiated lane. When a lane leaves,
  find what else it did in the tests.
- **Two heavy local runs at once empty the box.** The full jsdom suite beside a Chromium a11y sweep killed the
  container (exit 137); run them one after the other. And `pkill -f "node tests/run.js"` matches the shell that runs
  it, so it killed the command chain that was about to commit; name the process by exact command (`pkill -x node`).
- **A `git add` of an ignored path exits non-zero and breaks an `&&` chain.** The worktree's `node_modules` symlink did
  that, so the generated-file gate never ran there and the Sierra branch's dependency map reached CI stale.

## S417 SkyManzanita (2026-10-18): shipping #2231, the save dispatch, and three instruments that read the wrong thing

- **The check ledger reads one shape.** `tests/lib/check_ledger.js` parses "N/N checks passed" and "all N checks passed"; `cer_procedures_view.test.js` printed "49 checks, 0 failed", so the floor S416 set for it read as a lost count and failed shard 1 (run 39144104428). Set a floor only after `ledgerLib.reportedTotal()` reads the file's own summary; the file prints 49/49 now.
- **The open-asks scan reads the marker's two words anywhere in a lane.** S416's NEXT sentence, "add this lane's NEEDS SAM marker", became a live ask the moment Sheet 94's cards left the builder (CPLBrain#383), and the local `check_generated.sh` gate refused the build. CI's lints job reads no vault and would have passed. Say it another way in prose.
- **YAML reads a bare `on` and `off` as booleans.** `cer-procedures.yml`'s `options: [on, preview, off]` offered true, preview, false; a dispatch with save=on was refused, and the nightly run never noticed because the schedule takes the default. Quote option words (#2232).
- **COCI marks most credit programs Approved.** Mt. SAC's LVN-to-RN option (08086) is Approved; a Sierra gate on status "Active" alone dropped its complete record and smoke 7l lost the catalog year (A/B run 39142613772). The gate mirrors the harvest's `STATUS_FILTER` (Active*, Approved) now; block 13 evaluates it. The headline's own "active" (`queue_status.py`) is status = 'Active' exactly, 20,282, a different set from the harvest's.
- **Read an A/B grid across runs, and the prose behind a regression.** Run 2 (39145439350) passed 7l and regressed 7c and 9. Mode 9's match was the phrase "El Camino's CPL coordinator (not listed in what I have)", a coordinator, not the college. 7c flipped direction between the two runs on production too, but the candidate's Orange County answer lost its specific nearest courses (VN 220 at Long Beach City) for a generic family table, which more CATALOG REQUIREMENTS blocks in the context would explain now that 11,621 records qualify where 32 did. A third run (39147745774) was dispatched to tell variance from a systematic change before any deploy.
- **A ruled question is not a card.** Fable asked for a second Sheet 96 card on the Sierra read; Sheet 95 card 2 proposed exactly that read and Sam answered quote at 14:43:28Z (its store). The sheet reports and never re-asks.

## S418 SkyMadrone (2026-10-18): the first saving run and the first fold since July

- **The first saving run (`cer-procedures.yml` run 39150222312, 17:34Z to 17:37Z).** 926 titles saved to `kb_curation` as 1,852 rows, a title row and an issuer row each, under 7 cohorts: classifier 737, course-identity 125, brand-family 53, nccer-verbatim 5, statewide-catalog 3, cslb-classification 2, apprenticeship-trades 1. None held by a live row, none a duplicate; the receipt is `kb/cer_procedures_out/saved/saved_2026-10-18T17-37-29Z.json`. The dispatch took #2232 first (the quoted option words) and three minutes of runner time; the classifier was asked nothing (0 not yet asked).
- **The fold's first apply since 2026-07-08 (daily run 39150946369, 17:44Z).** 1,102 assignments folded: the 176 that waited and the 926 just saved. 12 supersedes, 455 credential records added, the 18 conflicts held, 4,915 titles in the reference. The person's review stamps rose from 457 to 645 because the 176 waiting saves and the 12 supersedes were a curator's July saves; the cohort stamps rose from 158 to 1,084. `kb/unclassified_fold/2026-10-18/applied.json` holds every row.
- **A figure on a page is dated the moment a run lands.** The Commons mock-up read 615 of 3,813 titles stamped at 16:00Z; after the fold it reads 1,729 of 4,915, 2,441 credentials (1,986 plus the 455) and 1,825 of 2,644 credential records. Re-measure from the files the run committed, with the command beside each figure, and reconcile the deltas (645 = 457 + 176 + 12; 1,084 = 158 + 926) before publishing.
- **A sheet answered before its lane carried a marker needs none.** Sheet 96 was published at 17:11Z and answered at 17:23Z; the lane records the ruling, the builder retires the card the way every answered card left, and the vault's coverage check passes with an empty backlog (29/29) without reading a tracker marker.
- **Read the queued notifications before a Rule 8 write when another session was live.** S417 wrote Sam's Sheet 96 ruling to `cpl_memory` at 17:29Z after its sign-off and said so in two cross-session messages; those sat in this session's queue until the turn ended, and S418 wrote the same ruling at 17:43Z. The duplicate is superseded explicitly (same source, same fact; the cited row keeps the store quotes) through `supabase-migrate.yml`, because `execute_sql` holds an UPDATE for the connector's own confirmation (60 s timeout, twice) where an INSERT runs at once; the migrate route takes DML (S411's precedent) and its apply job ran without a gate.


## 2026-10-30 — the Exhibits redesign mock-up, and the Admin Save (side session beside S531)

**Sam's words, in order** (all 2026-10-30, in session): *"Have a good look at the current CER and notice how crowded it
is and not intuitive to navigate ... I want you to help me make it much more manageable and simple. let's use the
process where you produce a visual I can react to. I don't like the current color scheme or layout. advise"*; *"We might
be able to consolidate the EACR tab with CER if we are careful"*; *"Malone needs a canonical catalog of our exhibits for
the new MAP exhibit module"*; *"prioritize the work on canonicalizing based on the number of estimated students it could
touch or does touch now"*; *"make the mock the way I'd see it, without the explanations"*; *"I do like your 3
categories"*; *"if there's a M-ID title aligned show it and let it determine the proposed classifyer"*; *"change Accept to
Keep Current Title and Change the title to Changed to Proposed Title...but what if we want to edit the proposed title?"*;
*"can we shoot to a certain exhibit to set the title using a search bar?"*; *"chip showing the status of CER step"* with
a hover; *"the filters for status could be in the higher cards"*; *"add the training site ... could be multiple training
sites ... set and change both issuer and training site from here"*; *"Once a canonical title is proposed ... the main
focus with small chips for all the colleges"*; *"shouldn't the proposed canonical title always be the focus and the
differing titles below it in small print"*; *"call it Local titles"*, then *"Local titles and 1 more"*; the gray labels
inside the boxes; *"When college could adopt chips clicked they should open with the courses and Request Quick Adopt
links"* (not yet drawn). The lane file states the design; this section keeps the learning.

**What the run learned.**

- **Check the server before the code.** Sam's menu hides "did not save". The edge logs showed his Admin visits signed in
  as a reviewer (`cobi_rls_gates` 200, 123 rows) and no `cobi_nav` write after either: the page never sent one. The
  cause was a button: the ladder's **Done** only closed the editor, and Save the menu sat below the fold. Fixed in #2593
  (the editor's button reads Save and saves).
- **EACR's "potential" counts colleges, not students.** Student counts live in `map_credential_volume` (canonical titles)
  and `map_student_credit` (per exhibit). A held title has no canonical row yet, so rank held titles through their
  exhibit IDs (`statewide_data.js` records) into `map_student_credit`, aggregate only.
- **A round number earns one more look.** 3,000 distinct students on held exhibits read like a cap; the per-exhibit sum
  was 3,775 (a student holds credit on several), and the figure stood.
- **The aligned course reaches most of the queue and misnames brands.** 394 of 468 held titles articulate to a course
  with a CCN, C-ID or M-ID, but "AP Computer Science A HS-LEUSD" would become "Java Programming: Advanced Objects": AP and
  brand credentials keep their own names.
- **A course code with a leading zero misses the course lookup.** MAP's "ADJUS 023" did not find COCI's course; the
  build should fold leading zeros.
- **The CPL-AI join runs through the CER.** 31 of the 115 ASCCC/Foundation certifications matched a MAP common title by
  hand (16 exact); the rest wait on canonical titles. 2,004 college and certification pairs have a strong-evidence course
  and a builder to Request Quick Adopt from.
- **The short-name table and a naming rule disagree on 46 of 118 colleges.** Keep the table as the one source and fix
  rows there; code no exceptions (Sam). #2598 carries his four corrections.
- **Show the screens.** When Sam asked for the mock "the way I'd see it", every finding and note left the page; the design
  record lives in git history (version 8) and here.

## 2026-10-31 — Sheet 147 answered, the high school and ROP rule, the CPL-AI dialog (SkyGooseberry)

**Sam's decisions** (Open Asks Sheet 147, completed 00:06Z, all five his own call, no notes): *merge* (one Exhibits tab,
Review first), *rule* (the high school and ROP titles under one rule, AP keeping its names), *stamped* (the public
adoption page lists settled credentials only), *cpl-ai* (that page takes Malone's CPL/AI look; First Light was
proposed), *dialog* (the CPL-AI matching in the Program Requirements dialog first). Fourteen minutes from publish to
answer: the sheet was the right form for six asks that had waited a day in chat.

**What the run learned.**

- **An exhibit's credit recommendation names its course; the title often does not.** A high school articulation reads
  "Introduction to Digital Media High School Articulation"; the course (DM 1 at Cabrillo) lives on the exhibit's credit
  recommendation in `statewide_data.js`. Joining that course through the identity layer's member rows reaches its CCN,
  C-ID or M-ID.
- **A cross product of courses and colleges needs a word guard.** The exhibit names every course at every college that
  articulated it, so pairing them invents joins: "Anatomy/Physiology HS-AUSD" met an entrepreneurship course. Requiring
  one shared word cut the aligned set from 374 to 209 of 450 and removed every wrong join in a sample of fourteen. A
  guarded rule that saves without a person should err toward holding.
- **The dormant M-ID tier read the wrong field.** `_suggest_unclassified.py --with-mids` read `title` or
  `representative_title`; the minted file carries `common_title`, so the gate would have opened onto nothing. The new
  aligned path reads `common_title`.
- **The conflict guard does the rule's hardest work.** Of 84 school titles the rule could name, 29 already exist in the
  reference under another issuer (Arc Welding under California Community Colleges), and the run holds them for a person.
  A rule that names titles must still meet the reference's issuers.
- **A tally can count one decision twice.** The run tallied every classifier answer under the classifier, so a title the
  school rule replaced counted under both. A rule that replaces another's answer counts under itself alone.
- **CSS display beats the hidden attribute.** `.adoptpanel { display: grid }` showed an empty panel at load until
  `.adoptpanel[hidden] { display: none }` joined it.
- **Republishing an artifact from another session costs its whole diff.** The publish refused without a prior read and
  returned the full line diff into context (about 30 KB here). Read with `path` saves the file but does not count as
  viewing; when the live page is known to match git, expect the one refusal and publish again.


## 2026-10-31 — the Exhibits tab's Review queue (SkyRowanberry)

**What shipped.** The `#exhibits` tab on the drawn card of version 26, its builder (`kb/_build_exhibits_review.py`),
and `exhibit_title_students()`, the reviewer-only students read. The lane file states the design; this keeps the learning.

- **Two feeds of 12 and 14 MB do not join in the browser.** The held titles' exhibits live in `statewide_data.js` and
  the could-adopt courses in `unified_courses_members.js`. A nightly builder joins them into one 341 KB file, and the
  courses behind a chip (461 KB, most of the bytes) go to a second file the tab fetches on the first click, keyed by
  identity so titles that share one share the rows. One title per line keeps a nightly diff readable by title.
- **A reviewer can already read the base table, and that is why the read is a function.** RLS lets an allowed
  reviewer SELECT `map_student_credit`, so a per-exhibit PostgREST read would have worked, and it would have put
  student-grain rows in the browser. The ADR's third decision (suppress where the figure is made, never at render
  time) makes the function the shape: the page holds counts of ten or more, a suppressed flag, or zero.
- **Exhibit IDs match exactly.** 95 of the 472 held IDs are mixed case (`MAPCxH-...`); `map_student_credit` stores the
  same spelling, so the function joins on the index without `upper()`. The counts matched the mock-up's (442, 398, 316,
  160).
- **The fold moves under the queue.** The procedures run writes `needs_you` at 07:47Z and the daily fold can settle a
  held title after it, so the builder drops a title the audit no longer lists as waiting, or one a person saved since,
  and counts them (`settled_since_run`). A conflict stays: the reference already holds its raw, which is its point.
- **A re-render must not cost an edit.** Sam's "what if we want to edit the proposed title?" is answered by the box,
  and opening a college chip re-renders the card; the draft title and issuer now live in the tab's state until the
  title is decided.
- **The members file carries COCI's spellings.** *CaÃ±ada College* and *Cypress College* with a trailing space; the
  builder repairs both before a name reaches a chip.
- **Re-serializing a hand-kept JSON rewrites its escapes.** `json.dump` of `kb/governance_surface_map.json` changed two
  unrelated lines' `—` escapes; the entries went in as text, so the diff carries only them.

## 2026-10-31 — the credential panel: issuer and training sites (SkyBunchberry)

**What shipped (#2603).** *Credentials* beside *Review* in `#exhibits`, and the panel where the issuer and the training
sites are set, each site with the college it trains for. The lane file states the design; this keeps the learning.

- **Widen a field by saving its old reading beside it.** `training_agency_override` holds one trainer and five readers
  take it as one string (the bake, Mode A3, MAP export, the CER tab, the Review builder). The panel saves the list as
  `training_sites_override` and, in the same Save, the sites joined into the old field, so no reader had to change for
  the save to be right everywhere. Only the readers that want the list learned it. KB note:
  `methodology-widen-a-field-by-saving-its-old-reading-beside-it`.
- **"Later wins" alone hides the list behind its own echo.** The panel's writes are separate requests, and the trainer
  row lands a few milliseconds after the list. A rule of the newest row would read every panel save as a one-trainer
  edit. The rule compares content first: the trainer stands down the list only when it says something else and was
  saved after it (a later edit in the CER's Trainer box). Python and the tab share one table of cases in the test.
- **The public payload already suppresses students at ten.** `credential_reference_data.js` holds 144 credentials with
  a count, 391 marked under ten and 1,921 with none, so the Credentials view needs no reviewer read for students.
- **Counts differ by file.** The payload lists 2,456 credentials and 342 naming a training site; `kb/credentials.json`
  lists 2,465 and 363 (the mock-up's figure). The tiles read the payload with the live rows applied.
- **A fixed table cannot hide a column by its cells.** With `table-layout:fixed` and a five-column colgroup,
  `display:none` on the third and fifth cells slides the fourth into the third column's width. Below 560px the table
  keeps its columns and scrolls inside its own box.
- **The target-size check measures width too.** At 1024px the panel beside the table squeezed the site box to 14px wide;
  `npm run a11y` named it. Rows now wrap (flex), and the panel stacks above the table below 1200px.
- **First Light's greeting covers a review screenshot.** The a11y runner's shots showed the morning painting over the
  page; a screenshot script sets `cplFirstLight.optOut.v1` and `cplFirstLight.seen.v1` in an init script first.

## 2026-10-31 — Exhibit Adoption folded into the credential panel (SkyBayberry)

**What shipped.** Sheet 147 step 3, first part: `kb/exhibits_adoption.json` from the Review builder, the *What credit does
it carry?* and *Who could adopt it?* tiles on Credentials, and college chips in the panel that open what a college
articulated or the course it already teaches. The lane file states the design; this keeps the learning.

- **A fold carries the folded tab's rulings, not only its data.** EACR's payload holds `potential_names` (every college
  with a program under one of the exhibit's TOP codes or a course carrying one of its C-IDs), which Sam ruled off every
  EACR screen on 2026-09-24. The Review card's fallback read it anyway: 269 of 468 cards, 14,669 college pairs. The panel
  read the reference's `potential_colleges`, the M-ID `adoption_leverage` list without the over-merge hold: 15,081 pairs against EACR's 4,865.
  Both now read the prescriptive layer, and both tests fail on the broad list. KB note
  `methodology-a-fold-carries-the-folded-tabs-rulings`.
- **Two sources name the articulating colleges, and neither is whole.** The reference counts colleges with a local course
  under the credential's identity (17 for CompTIA Security+); EACR counts MAP's adopters, rows with no course identity
  included (24). The panel joins them.
- **Units across cards add by distinct line.** A credential spans several EACR cards (by CPL type), and 220 college and
  credential pairs sit in more than one. Summing each card's units would count a shared line twice; the builder sums the
  distinct lines with EACR's own leading-figure rule.
- **A file the tab reads before the runner writes it.** The PR ships code only, so the tab has to read the old review file
  (no `courses_key`) and no adoption file. An old fallback list never shows, and the tiles read *Could not be read* until
  the dispatched daily run lands.
- **The a11y seed should open what the build adds.** The Credentials seed now opens a college chip, so the box is measured
  at 390 to 1440 in both themes.

## 2026-10-31 — the AP rule, the Catalog's faculty review list, and two false absences (SkyElderberry)

**What shipped.** #2612 (the Commons' CER row opens Exhibits through `#exhibits/held`, `/conflict` and `/credentials`),
#2613 (the Credential Catalog's *Worth a faculty review*, 28 Credential Engine credentials MAP has no exhibit for),
#2614 (Sam's AP rule from the Exhibits tab, built into `brand-family`: an AP title takes College Board's official exam
name) and #2615 (the IT/AI catalog's MAP join needs the issuer to agree). The lane file states the design; this keeps
the learning.

- **A "not in MAP" mark is a lead, never an absence.** The IT/AI catalog marked 39 Credential Engine credentials *not in
  MAP*; a hand check of each against the reference's titles and issuers found 11 in MAP, the mock-up's own example (CAPM)
  among them. The join was IT-first and skipped an IT issuer's other titles. The page reads a committed hand check, and
  the catalog's join now reads it too (cpl_memory `it-ai-catalog-not-in-map-missed-11-2026-10-31`).
- **A quality gate's word list collides with official names.** The run's `residue()` reads a trailing *a* as a dangling
  connective, so seven sure answers of *AP Computer Science A* (0.94 to 0.98) waited on Needs you under *Wording check*.
  An official exam name now stands as written. Check a gate against names that end in a letter or a number.
- **Read the held reasons before writing a new rule.** Sam asked for a rule for AP titles; one already existed
  (`brand-family`). The miss was its decoration stripper (dash clauses, HISTORICAL Type notes, course and high school
  codes) and its target (whatever twin the reference held). Grouping the 19 held exam titles by reason found both in one read.
- **"Close enough" is a ruling, and it sets the defaults.** Sam: *"folding the locals under as best as is possible--it
  will be close enough and infinitely better than it is now--even if its a little wrong"*. So missing letters take
  Calculus AB and Computer Science A, and an AB subscore reads as Calculus AB, the credit it carries. Only a title naming
  two exams is held.
- **The reference holds the same twins the queue does.** 74 local titles sit under non-official AP twins (*AP U.S.
  History*, *AP Calculus BC — AB Subscore*, *AP Physics 1*), 46 stamped. The rule settles the queue; the reference fold
  re-keys reviewed entries and waits on Open Asks Sheet 149.
- **A merge in the reference needs its live rows moved too.** `kb_curation` keys on (course_id, field), so the saved
  assignments that still named a twin could not take a new row; left alone, the nightly fold would have held all 42 as
  conflicts. Move them with a guarded UPDATE pinned to the before-value, its receipt first, in the same change.
- **The guard routed the UPDATE to Sam, and he unblocked data writes for good** (#2618): *"I've run the recommended sql
  queries from you 100% of the time without editing your code ... let's unblock it"*. Schema and permission writes stay
  denied; Rule 10's receipts are unchanged.

## 2026-10-31 — the review card's Back and Accept all (SkyCloudberry)

Sam, accepting proposed titles: *"need a back button ... to go to a few previous items"* (he wanted the simpler *Anatomy and Physiology* over *Survey of Human Anatomy and Physiology*), Accept all, Change to Proposed Title first, the local title in bold (#2620; `cpl_memory` `sam-exhibits-review-back-accept-all-2026-10-31`). `kb_curation`'s key is (course_id, field) and the write merges, so a second save after Back replaces the first. Accept all skips a title with a save (`h.saved`): a bulk word must never overwrite a person's decision.

## Moved from the lane (SkyCloudberry)

- **One Exhibits tab in the Catalog Commons replaces CER and EACR** (recommended; his "we might be able to consolidate
  the EACR tab with CER if we are careful"). Three questions organize it: *What is it called? What credit does it
  carry? Who could adopt it?* ("I do like your 3 categories"). Views: Review, Credentials, Rules.
- **A status bar of tiles per question**, the Commons pattern; the **CER step tiles filter the Review queue** (All held
  468, Proposed 401, Wording check 36, Two issuers 13, Conflict with the reference 18, Saved not folded 0), each step a
  chip with a plain hover.
- **Review sorts by students** with credit (106 held exhibits carry 3,000 students; the 40 with ten or more carry at
  least 84%; Cabrillo's high school articulations lead). **The canonical title is always the focus**, editable; issuer
  and training site sit in gray-labeled boxes under it; local titles in small print, the one being decided
  highlighted and in bold, the rest *and N more*; college chips for *Articulated at* and *Could adopt* (same-identity
  course, else EACR's list). Buttons (Sam, 2026-10-31): Change to Proposed Title, Keep Current Title, Teach a rule,
  Back, Skip. **Back** reopens the cards decided or skipped this visit, newest first, naming what was saved; a new
  choice replaces it (`kb_curation`'s key is the title and the field). **Accept all proposed titles (N)** asks first,
  then saves every title in the list on screen in one merging write, a typed edit counting as its proposal; a conflict
  with the reference, or a title someone already saved, stays as it is. A search goes to any exhibit.
- **The aligned course names the proposal** (cpl_memory `sam-cer-aligned-course-names-the-exhibit-2026-10-30`): 394 of
  468 held titles articulate to a course with a CCN, C-ID or M-ID. A conflict proposes the reference's person-reviewed
  title.
- **One issuer, many training sites**, set from the panel (cpl_memory `sam-cer-issuer-and-training-sites-2026-10-30`):
  363 of 2,465 credentials name a site; 17 say only JATC.
- **Why it matters (vault braindumps of 2026-10-30):** the public adoption page and Malone's new MAP exhibit module
  both read the CER's canonical titles and issuers.

## 2026-10-31 — Another look: the sweep through every title (SkyCoralberry)

Sam, 2026-10-31 ~17:07Z, after his pass through Review (384 titles saved from 13:46Z, folded by the 17:20Z daily run):
*"I went through the Exhibits to adjust and accept the canonical titles. As I did I noticed some things I want you to build
an audit process as part of the overall procedure to look for opportunities to take another look at exhibits that look
the same but still have differences and things we can fold and correct: 1. Auto exhibits are most often aligned with ASE
cert titles and I started adding those to later exhibit titles in parens after the title--see those and make a short
list of the ones that could get the ASE parens based on the local titles and add those as the suggested titles. Note
that there are many Automotive Technology exhibits where I took off the local course number and left it just Automotive
Technology, but the local course corresponds to the ASE cert, so those should have the ASE parens 2. Many exhibits use I,
II, III and I skipped adjusting some of those to 1,2,3 for consistency. Add those to the audit procedure too 3. For
foreign lang exhibits, look for beginning labels that should be elementary (our canonical term for 1,2 or 1A,1B and
intermediate should be often 2,3 or 2A,2B 4. Look for other opportunities and bundle them for me to have another run
through them. Compare to all the exhibit titles in the whole data set and let's see if we can take another sweep through
to adjust and fold 5. Looks for any exhibits where I didn't take off the local course number and bundle those with a
suggested title"*

- **A course number in a raw title is not evidence.** The first draft read codes from the local title and stripped
  *OSHA 10*, *ICS 400*, *C-36*, *Fire Inspector 1C* and apprenticeship *Period 4* from canonical titles (253 cards). Only
  the exhibit's own college course, from its credit lines, counts, and only on a title whose primary issuer is the colleges.
- **One title over two courses is normal for an exam.** AP Calculus AB earns College Algebra at a 3 and Calculus at a 5;
  splitting by course belongs to local course exhibits only. Checking every issuer record, not the primary, let
  CompTIA Security+ through because one record names the colleges.
- **The statewide file pools a credential's credit lines once its local titles fold.** Sam's *Automotive Technology* held
  four Las Positas courses (AUTO INT, INTL, SDR, SMOG) in one entry; a line belongs to the local title that names its code.
- **His own saves held the sixth rule.** *Haz Mat Technician 1A: Basic Chemistry* saved under the 1B title, and NUTR 071A
  *Level A* under *Level C*: a level the local title names and the canonical contradicts. Las Positas's AUTO P1 is
  *Powertrains: Modifications for Performance*, so the (ASE P1 Parts Specialist) paren is wrong; the course title must
  agree with the test's name before a code counts.
- **Rule 5g put *Intermediate* last** (*Spanish I Intermediate*). Sam's words make Elementary the canonical term, and C-ID's
  descriptors lead with the level, so world-language levels are an exception (procedure `language-levels`). His saves
  today also led with *Beginning* and *Advanced* in two families; the fold rule follows the placement he chose last.
- **A test that counts a data-dependent queue breaks when the queue empties.** `cer_procedures_test.py` asserted the
  committed queue staged more than none; after the fold the queue was 1 title, so it failed on main. It now checks that
  every waiting title is proposed, held or not yet asked.

## Moved from the lane (SkyCoralberry)

**The design** (S411 mock-up https://claude.ai/artifact/Gu6HTwqSwMYLSy4C4xRag3, source
`docs/visuals/2026-10-18-cer-procedures-mockup.html`): three views, **Needs you** (the exceptions, each with
its proposal, why it came, Accept · Change · Teach a procedure), **Procedures** (each rule with who set it,
what it settled and held, See what it did · Turn off; Add a procedure with a free preview), **Reference**
(search, two filters, a Decided by column). The run's report already carries each view's numbers.

**What the S411 map found** (counts from `kb/exhibit_audit/latest.json` of 2026-10-17 and
`kb/unclassified_fold/2026-10-17/report.json`):

- **The fold has applied nothing since 2026-07-08.** `kb/_fold_unclassified.py --apply-if-safe` is all-or-nothing
  (`v1 = not conflict`): 18 conflicts hold back 176 clean saved assignments, 157 credential adds and 12 supersedes.
  The tab's copy promises they fold "automatically on the next daily refresh."
- **The backlog grows about 200 a month:** 241 unclassified (2026-07-16), 1,015 (09-25), 1,498 (10-17). No new KB
  entry since July; the last curator assignment is 2026-07-12.
- **A procedure's write shape to copy, when one may save:** `cer-decision-apply.yml` (a plan under a
  `<lane>-s<N>@bot` cohort, a fresh read that holds a curator's change, a receipt before the insert, rollback
  by cohort). `kb_curation` has no reason column; Sheet 3 card 10 (2026-09-29) asked for a CER decisions store
  routed through Governance (DR-07).

- **The first two passes (2026-10-18, runs 39097682221 and 39103573166):** $10.97 in all; 1,287 of 1,322 titles
  pre-filled and 396 held. A 30-answer sample read the sure band right. Figures and the one to watch (*Industry for
  GDDM 53*): `docs/exhibit_canonicalization_lessons.md`, its 2026-10-18 sections.

- **Code-only titles get the college's own course (#2219, landed in #2220):** the run looks a trailing code up in COCI at the
  college that entered the title and hands the title on as a hint (94 titles); a record carries its hints'
  fingerprint, so an unsure title is asked again when its hints change. The workflow installs `openpyxl`.

## 2026-10-31 — The conflict card saves, ASE names its issuer, the boxes offer names (SkyBilberry)

Sam, 2026-10-31 ~19:00Z, at the last card of his pass: *"working my way through the new list and the last one is Auto and
it seems to have a conflict and won't save. advise. Also, anything with an ASE cert in the title should auto-populate the
issuer and allow me to accept it. When I enter text in the issuer or trainer box, it should search for text matches for
existing items and present option to click with each text entry"*.

- **The block was the tab's own guard,** written before the fold had a revise lane: a conflict card refused any title
  but the reviewed one and said to tell a session. Another look already writes the safe form of that change (the title
  it replaces, applied only while that title stands), so the conflict card now writes it too.
- **The card was stale as well.** Its saved title (2026-06-02) had already left `kb_curation`, and the 10-31 fold held
  nothing; the Review file reads the procedures run's report, which is rebuilt at 07:47 UTC, so a cleared card lingers
  until then.
- **An upsert keeps a row's first `reviewed_at`** (the column defaults to `now()` on insert only), and the fold re-points
  a title only for an assignment newer than the reviewed entry. A re-pick now sends its time with the rows.
- **`var` hoisting bit the first draft:** the card function already declared `typed` for the Local titles block, so the
  issuer's "typed" flag was an element and always true. The jsdom check caught it.

## 2026-10-31 — Rules: every rule in one view, and a rule sent to the routine (SkyBilberry)

Sam, 2026-10-31 ~19:10Z, rethinking the ASE titles: *"can you add a link to a view of all the rules used to suggest or
fold exhibit titles?"* Sheet 149 card 2 (*routine*, 14:41Z) had asked for the other half: a rule added in the tab runs
without a session he drives.

- **The routine already existed.** The CPL queue routine reads `scheduled_sessions.md` before anything else, so a new kind
  of request is a numbered step there (step 7), and Sam creates no trigger. A session cannot create one with the repos
  attached anyway (Sheet 131, S490).
- **An off rule still spoke.** `load_procedures` dropped an off procedure, but its pre-seed lane still staged a proposal,
  which `settle()` handed the classifier as a hint (no owner). `off_lanes()` now quiets a lane only off procedures name.
- **A dry run on tonight's queue says little.** Sam's 384 saves left the queue at one title, so `--try` reads the reference
  too: the titles a rule's lanes read differently from their canonical title (brand-family: 44 of 1,674 tonight; the AP
  lane 0 of 930, since the AP fold landed).
- **Turn on writes a switch row, and the routine sets `on`.** The store stays the one place a procedure is on, and a
  person's word is what turns it on; the tab cannot merge.

## Moved from the lane (SkyBilberry)

**RULED (Sam, Open Asks Sheet 96 card 1, 17:23Z 2026-10-18, his own call; `cpl_memory`
`sam-sheet-96-rulings-2026-10-18`): keep.** A rule procedure's settlement saves at the rule's word, the course-identity
rule's 0.8 included (the college's own course title for a code-only title; 96 of its 125 on the preview);
`python3 kb/_cer_procedures.py --undo course-identity` stays the reversal. The sheet: https://claude.ai/artifact/Gta7x4T2NfFwbymH4nddui.

**The AP fold — applied (SkyElderberry, 2026-10-31; Sheet 149 card 1).** 14 credential merges and 7 AB-subscore
moves in the reference (77 local titles to College Board's names; `kb/credential_merges.json`, receipts in
`kb/credential_merges_out/2026-10-31/`), and 42 saved assignments moved to match under `cer-ap-fold-s536@bot` (Sam ran
the guarded UPDATE; receipt `kb_curation_update_receipt.json`).


## SkyHuckleberry (2026-10-31): the first panel-row move, and ASE's two calls

- **Sam's run through Another look reached the fold the same evening.** He saved 17 `unified_title_supersedes`
  between 18:52Z and 18:55Z; the 19:32Z fold applied them (15 revise, 8 credential moves, 2 retires). Two moves left
  Curate-panel rows under the old names (*Automotive Electrical/Electronics I* and *II*, four rows), moved by a guarded
  UPDATE of `course_id` alone with before-values and rollback SQL in
  `kb/receipts/credential_panel_move_2026-10-31_skyhuckleberry.json`. The guard refused the move if the new names
  already held a row.
- **A moved row can carry a call that a later ruling contradicts.** One of the moved rows was Sam's ASE issuer
  override (2026-10-27); his 2026-10-31 ruling narrowed ASE to titles that open with ASE. The session moved the row
  unchanged and asked, rather than drop a human row on inference (Rule 8). Sam: *"Drop the ASE override; go with the
  long form."* The two override rows were deleted (same receipt), and `kb/credentials.json` dropped the ASE record and
  named the colleges.
- **"The long form" was already the sweep's form.** `rule_ase` in `kb/_sweep_exhibit_titles.py` proposes
  *Automotive Technology (ASE A5 Brakes)* whenever the title's own words add nothing to the test's name and carry no
  level digit, so a base like *Engine Performance* becomes *Automotive Technology*, while *Automotive
  Electrical/Electronics 1* keeps its base. The ruling needed no code; it is recorded in the lane. It applies to local
  exhibits alone (the colleges as issuer: college courses, high school and Cx), which Sam confirmed: *"this is just for
  the local hs and Cx exhibits, right?"*


## SkyInkberry (2026-11-01): IB on the AP pattern, and where CLEP stops

- **The reader can prove a fold before it runs.** Run over the reference's 201 IB titles, the reader put 171 exactly
  where they already sat, every person-reviewed one among them, and read none as two exams or as not IB. That agreement
  is the evidence the names are right; the 30 it would move were then a short list to read by eye. Run a new brand's
  reader in dry run over the reference before writing its fold.
- **A merge tool moves whole credentials; a split needs its own move.** `kb/_merge_credentials.py` re-points every
  title of a loser. *IB Language A1: English HL* held three titles, two reading as Language A1 and one, *English Lit
  (A1)*, as Language A: Literature (words before letters, as Sam's own review read *Lang&Lit (A2)*). The largest group
  went by the merge and the other by itself, in `kb/_ib_fold_apply.py`, with a receipt beside the merge's.
- **Pick an issuer twin by counting the saves, the person's first.** IB carried two issuer names. Sam's own saves used
  both (two IBO, one IB) and the bot rows ran 80 to 3, so IBO won with four live rows to move, one of them his; the
  receipt and the sheet card say so. Choosing his latest save alone would have moved 82.
- **CLEP stops at a ruling.** The AP pattern reads a score band as decoration, and CLEP's levels are score bands
  (*Spanish Language (Levels 1 and 2)* is one exam), but the reference splits 92 titles by level, and College Board's
  Roman numerals meet Another look's Arabic rule. The fold would re-file stamped titles, so it waits on Sheet 150 card
  2, as the AP fold waited on Sheet 149 card 1.
- **CI's shard spread is the runner, not the table** (the handoff's open item 2). Two balanced runs with the same
  assignment (#2631's PR and main runs, 2026-10-31) took 4:52 / 7:51 / 8:35 / 4:55 / 8:07 / 8:20 and 4:25 / 8:01 /
  4:35 / 6:30 / 8:05 / 4:40 across shards 1 to 6: shard 3 ran 8:35 once and 4:35 the next, shard 6 8:20 then 4:40.
  A table re-measured on CI would inherit the same noise. The gain left is splitting the slowest files, since one file
  bounds a shard.


## SkyTeaberry (2026-11-01): CLEP folds on Sam's ruling

- **Sam ruled fold on Sheet 150 card 2 at 01:50Z, and kept the IB fold (card 1).** One credential per CLEP exam, its
  levels folded in, Arabic numerals, no period subtitle. `kb/_clep_official_titles.py` and the fold landed in #2633:
  18 merges, 110 local titles, 48 CLEP names to 35, 33 live assignments and 3 panel markers under
  `cer-clep-fold-skyteaberry@bot`.
- **When the ruling itself moves reviewed titles, the dry run's test narrows to everything else.** Five person-reviewed
  titles moved (two Level III, three prefix-less *(Levels 1 and 2)*, and Sam's *Spanish with Writing: Levels 1 and 2*),
  each because the ruling folds levels. The other eight agreed where they sat, *History I* and *History II* among them.
  Name the ruled moves one by one in the receipt, so a reviewed title never moves unannounced.
- **`kb/_merge_credentials.py` writes `report.json` and `applied.json` into the day's folder**, over an earlier fold's
  receipts from the same day. Rename the new pair (`clep_applied.json`, `clep_report.json`) and restore the old with
  `git checkout`.
- **A panel row cannot fan in.** `kb_curation`'s key is `(course_id, field)`, so two folded credentials' markers cannot
  both move to the winner. Move the one whose meaning carries (the one-exam *(Levels 1 and 2)* marker) and leave the
  other under its old key; deleting it would put a person's row on the hold list.
- **A merge leaves the nightly fold nothing to hold.** It stamps every re-pointed title today, so each saved assignment
  on one reads as already folded, or STALE until the nightly sync copies the live rows. The 38 old preseed rows that
  name Roman-numeral forms (*CLEP Spanish Language Level II*) read STALE before the fold and after; they were left alone.
- **`clep.collegeboard.org` is outside the sandbox's network.** The exam list rests on a search result (Information
  Systems is the current name of Information Systems and Computer Applications) and College Board's 34 current exams.


## SkySnowberry (2026-11-01): the CLEP fold confirmed, the Catalog sync test fixed

- **A quiet night writes no fold receipt.** With nothing to fold, `kb/_fold_unclassified.py --apply-if-safe` prints
  *Nothing to fold — receipts left untouched* and writes no `kb/unclassified_fold/<date>/`, by design (the daily
  run's no-diff, no-commit idempotency). To check rows a session moved, run the dry run locally, read the day's
  `report.json`, and delete the folder. On 2026-11-01 all 33 CLEP assignments read *already classified to the same
  target*; the 61 STALE CLEP preseed rows (Roman-numeral forms, `preseed-v1@bot`) matched the 2026-10-31 report.
- **A test can outlive the doctrine it encoded.** `tests/credential_catalog_sync_test.py` still gated a statewide
  credential on `ccc_rec` after the sierra-retrieval-corpus lane had ruled that gate wrong (`ccc_rec` comes from
  adoptions). #2634 gates on `ccc_rec`, the Fact Sheet builder's published set, or its MAP fix list: 68 of the 78
  answer through the set, and 10 sit on the fix list for MAP to give a CCC-tagged recommendation.

## SkyCheckerberry (2026-11-03): the panel rows of Sam's 11-01 and 11-02 runs

- **Read what a leftover row says before you move it.** The 11-02 and 11-03 folds left 25 Curate-panel rows under 17
  renamed or retired credentials. Ten moved by a guarded UPDATE of `course_id` (receipt
  `kb/receipts/credential_panel_move_2026-11-03_skycheckerberry.json`, before-values and rollback SQL). The other 15
  stayed. Eight issuer rows met an identical row under the new name (six Ironworker, two Spanish). Five rename rows
  were already carried out: Sam's 10-27 *Spanish 1* → *Elementary Spanish I* and its confirm, which the fold reached in
  Arabic form, so under the new key they would rename *Elementary Spanish 1* back to Roman. A `unified_title_override`
  or `unified_title_merge_confirm` is a request about the old name; it never moves.
- **A row that cannot fan in may disagree with the row it meets.** *Metal Building Erection I*'s issuer (Sam, Iron
  Workers) met a bulk run's California Community Colleges row under *1*. His row should win, but that deletes a row, so
  it went to Open Asks Sheet 161 card 2. Compare values before calling a leftover row redundant.
- **A dated ruling on the same case still leaves its deletion on the hold list.** The two Engine Performance ASE
  issuer rows are the Electrical/Electronics case Sam ruled on 10-31 (*"Drop the ASE override"*). They moved unchanged
  and the drop is Sheet 161 card 1.
- **Sam ruled an administrative bucket into a credential.** His 11-02 save filed Saddleback's *Credit by Exam* under
  *Water Supply*; its issuer row moved with it. A move like this one can look wrong when you read it cold. Check
  `reviewed_by` before you treat it as a fold error.
- Sheet 149's rulings (moved from the lane, 2026-11-03): https://claude.ai/artifact/G65n79qyqt6zioFPvKA75A, 14:41Z
  2026-10-31, his own calls (`cpl_memory` `sam-sheet-149-rulings-2026-10-31`): 1 *fold*, 2 *routine*.

## Moved from the lane (SkyInkberry)

The CER tab is retired (Open Asks Sheet 148); these two bullets described its views and moved here verbatim on 2026-11-01, when the lane passed its size budget.

- **The sign-off and the Curate panel left (card 3, `credential_reference.js`).** Reference keeps All and Industry
  credentials; the checkbox column, the bulk *Mark N initiated*, the Init button, the worklist's *Initiate all
  assigned* bar and the Curate panel are gone, with their CSS in both HTMLs. The quality flag sits at the top of the
  open row as a select for a signed-in curator (a word for a reader); the other four fields already edit in the grid's
  cells. Past sign-offs still load from the overlay for the export's Initiated columns and the Generated Title chip.
- **The tab's three views (#2221, S413; the S411 mock-up):** **Needs you** (Held, the titles the run held for a
  person, 25 at a time with why, each opening alone in Unclassified where its proposal saves; then Unclassified, No
  issuer, Merge confirms), **Procedures** (each procedure with its words, who set it and what it settled), **Reference**
  (All, Industry credentials, and the Initiated sign-off's two lanes until card 3). It opens on Held when the report
  holds titles, else on Reference; a quickstart hint opens Reference. UI pass: `docs/ui_pass_lessons.md` S413.

**RULED (Sam, Open Asks Sheet 94, 13:42-13:43Z 2026-10-18, each his own call; `cpl_memory`
`sam-sheet-94-rulings-2026-10-18`):**

1. **apply:** the fold applies the clean assignments and holds only the conflicts.
2. **save:** a result the classifier is sure of saves under its procedure, reversible by procedure; this revises his
   2026-07-07 ruling that pre-seeds stay "ready to save, not yet saved".
3. **retire:** the Initiated sign-off and the Curate panel leave the tab.

Sheet 96 card 1 (*keep*: a rule settles at its own word, course-identity's 0.8 included) is in the lessons doc.


## Moved from the lane (SkyTeaberry)

Sheet 148's ruling block moved here verbatim on 2026-11-01, when the CLEP fold took the lane past its size budget.

**Sam's rulings, Open Asks Sheet 148** (https://claude.ai/artifact/NnrRFjJVpMLd2NQt84GFX5, 12:09Z 2026-10-31, his own
calls; `cpl_memory` `sam-sheet-148-rulings-2026-10-31`): the public page is the **Credential Catalog**, linked from the
Library and the public header (SkyTwinberry); the CER and EACR tabs are retired. Sam had hidden both `cobi_nav` rows at
23:51Z 2026-10-30; they still open at `#credential-reference` and `#exhibit-adoption`, and their files stay.

## The List view and the re-analysis request (S540 SkyBunchberry, 2026-11-01)

Sam, 2026-11-01: *"can you build me a simple exhibit view in small font, alpha order with tight margins and passing. I
want to be able to scan and correct directly on the view exhibit titles next to their key information, such as status,
CIP title, Subject, Discipline, issuing agency, CPL types...and any other data you think might help. advice and
pushback welcome! If you could embed a button that fired an re-analysis routine that you and JEV work together on,
looking at any changes I make and thinking of how that affects the canonical exhibits ... Use Fable as advisor"*; then
*"new view should be part of our new Exhibit procedures on Catalog Commons"* and *"add in a comments box to the
reanalysis routine where I can add my observations or concerns or opportunities to better inform the reanalysis"*.

- **Fable's pushback, taken.** No TOP column (Rule 7). No credential carries a CIP code, so the column is *CIP family
  (from TOP)*, read-only. Discipline is the M-IDs' modal one, read-only. A title edit saves `unified_title_override`, the
  rename the reference already reads; the daily dry-run checks collisions and a reviewed apply re-keys, so no second
  rename vocabulary. Filters for the blanks: 1,482 of 2,663 credentials are unreviewed and 1,067 have no articulation.
- **Built** (`exhibits.js`, view *List*, `#exhibits/list`): 12px rows, A to Z by current title, 400 at a time, sticky
  header; Edit opens title, issuer and training sites on the row; a rename shows *pending the apply*, a collision from
  `kb/cred_rename_dryrun/collisions.json` shows *collides with*. *Re-analyze my changes* writes
  `_EXHIBIT_REANALYSIS::<when>` (`exhibit_reanalysis_request`: the credentials changed this visit and Sam's comments).
  Guard `tests/exhibits_list.test.js` (17); `a11y.config.js` `exhibits-list`, light and dark pass.
- **Jev's scope** (Fable): two questions with a verifiable answer, the same credential under two names (the 0.85
  gate) and an issuer that is really a training site. Code checks the rest. Never units, TOP, discipline or title
  quality.
- **The spreadsheet moves** (Sam, the same hour: *"sometimes I miss good ol' Excel, where I can quickly filter any
  column, sort any way ... use find and replace to fix things on the fly"*; braindump
  `braindump-2026-11-01-1545-excel-freedom-and-ceding-control`). Every header sorts (A to Z, then Z to A; blanks
  last; numbers low to high), every column has its own filter, and *Download these N as a spreadsheet* writes the
  filtered, sorted rows as a CSV Excel opens. One accessor per column serves cell, filter, sort and download.
  Find and replace, with a preview of every change before it saves, is the next build.
- **Next builds:** the routine's pass (scheduled_sessions step 9; the code checks first), the Jev runner job, and the
  findings panel in the List view with Accept and Dismiss. Until then findings reach Sam on the standing sheet.
- **Lesson.** The a11y seed must wait for the control it clicks, not for the module's data: the view row draws a
  moment after the queue loads, and a click before it finds nothing.

## The List view grows, a cert table found, the harvest moves (S541 SkyBlatusoff, 2026-11-01)

Sam drove the session live from the List mock, now a page that runs the real `exhibits.js` (`scripts/build_exhibits_list_preview.py`,
https://claude.ai/artifact/Qqcfxd9xkzdg91rkw6275A, saves kept in the page). His words, in order:

- *"wow! a find and replace will be great!"* Built (#2649): Title, Issuer or Training sites, within the rows shown or the
  selection; a preview with a check per row; Save writes only the checked rows; Undo this replace for the visit.
- Search by place (handoff 541's ask): the finder joins `college_lookup.js` (all 86 college names in the reference match).
- *"Can you add an AI-Sort button where you sort the list based on your understanding of of the exhibits (like with like in
  an alpha-like order)? This would allow me to get out of my literal sorting practice to see opportunities based on your
  expandd view of things."* Built (#2650): `kb/_build_exhibits_ai_sort.py`, TF-IDF over subject words with level words set
  aside, discipline and issuer lighter, a center check and a 60 cap; 384 groups hold 2,071 of 2,663. It reads words, so
  CPR and Basic Life Support land apart; a Claude pass grouping by meaning is the offered next step.
- *"Is there a way you can set a global Edit button that would allow me to make edits directly on any row"*: Edit every row.
- *"trying to resize the first column but not having luck"* (on his phone): under 560px the table used automatic layout,
  which sized Title to its longest title (464px on a 390px screen) and ignored a dragged width; the grip also sat half
  under the next header. Fixed layout everywhere, the grip inside its header, pointer capture, `pointercancel`.
- *"On AI sort, what do you think about offering suggested titles based on what you see?"* Tier 1 built: 22 spelling twins
  (II and 2, & and "and", a plural, a dash) inside AI sort groups; Accept writes `unified_title_override` and
  `unified_title_merge_confirm` naming the same target, the pair the rename dry-run folds on. Arabic numerals hold even for
  official names (Sheet 150 kept them on College Board's), so *Firefighter I* folds into *Firefighter 1*.
- *"for the folds already accepted I would want to be sure that we can fold to better titles"*, then *"build it all"*
  (#2651): the dry-run holds a merge whose target is itself retitled and then calls its confirm stale, so the List follows
  each pending rename to the chain's end and offers Re-point; *Folds waiting for the apply* lists them.
- *"count all canonical exhibit titles that include a statewide as based on a statewide, whether local or not. It goes with
  our adopted or adapted approach"*: Basis, *Based on statewide* (152) or *Local only* (2,511), from the Fact Sheet's
  `statewide_recs.js`. The reference's own `statewide` flag marks only 84 of the 152: it is set from colleges' articulation
  lines, so a statewide exhibit no college has articulated never sets it. No funding or ESS code reads the flag (an
  October memory row said otherwise; checked at the checkpoint); the export's fix is ordinary generator work.
- Bundles (*"maybe we don't need to separate out the bundled certs into individual exhibit titles, right? As long as we can
  recognize all the certs"*) and *"Do we have a separate canonical list of just our certs ... my DB dev days of
  normalizing"*, then *"Maybe we already have it?"*: we did. `kb/it_ai_credential_catalog.json` (7,335 credentials, stable
  ids) is the cert table; the missing piece was the link. `kb/_build_exhibit_cert_links.py` (#2652) writes the
  many-to-many, ASE first: 59 titles to 24 certs, 27 bundles, 12 aligned courses, unresolved names kept.
- *"should we add this cert catalog harvest to our Cpl queue workload and retire we weekly job ... I don't want our nightly
  jobs to collide"*, then *"Go"* (#2653): step 10 of `scheduled_sessions`, 7 issuers a night; the Monday routine disabled.

**Lessons.**
- **A drawer keyed by column position drifts.** The Confidence column, inserted after the drill-downs were written, had
  shifted every drawer from CPL types on by one place: Issuer opened Training sites, and a CPL type picked in its drawer
  filtered Confidence. Key a column's behavior by its name; a test now fails on the drift.
- **Automatic table layout ignores column widths.** A resizable grid needs `table-layout: fixed` at every width.
- **A preview built from the real code cannot drift from it.** Inlining `exhibits.js` with a fetch shim replaced a
  hand-written mock that lagged the view by six features.
- **Look before building a table.** The cert table existed under another name; the work was the link.
- **A fold is two rows.** A rename into an existing title merges only with a merge confirm naming the same target.

### Moved from the lane (S541)

Verbatim from `docs/reference/lanes/cer-procedures.md`, to bring the lane under its 20 KB budget:

2. **The high school and ROP rule — built (SkyGooseberry, 2026-10-31).** `kb/_suggest_unclassified.py` writes each queue title's aligned course under `aligned` (the course its exhibit's credit recommendation names at the college that built it; CCN, then C-ID, then M-ID, then the college's title; leading zeros fold; a join must share a word with the title; exam brands never align): 209 of 450 on 2026-10-31. Procedure `high-school-rop` (`kb/cer_procedures.json`, lane `school`) takes that title and the school, district or county office the classifier named (its trailing acronym dropped); adult schools and training centers stay with the classifier. Dry run: 55 settle, 29 held where the title already exists under another issuer; needs-you 468 to 413. The nightly run saves them under `cer-procedure-high-school-rop@bot`; `python3 kb/_cer_procedures.py --undo high-school-rop` takes them back.
5. **The CPL-AI matching in the Program Requirements dialog — built (SkyGooseberry, 2026-10-31).** `kb/_build_cpl_ai.py --fetch` reads https://map.rccd.edu/CPL-AI/preview-data/catalog.json into the dated snapshot `kb/cpl_ai/pairs.json` (33,232 pairs, 115 certifications, 121 colleges; keeps tiers 1 and 2, *Strong evidence* and *Faculty interpretation*: 20,166 pairs) with the page's credit and caveat word for word. The dialog lists a course's certifications under *CPL-AI recommendations (N)*, and a course whose only lead is a match shows its 0 as a button. Refreshed by hand (`--fetch`) until a schedule is chosen. Sierra and the public pages wait on his word.

## Groups you keep, one List engine, outcomes tested (S542 SkyTriangulum, 2026-11-01)

**Sam's words, in order.** On the AI sort's 832 Arrest group: *"it would be helpful to establish the groups and be able
to move exhibits out and into more appropriate groups where needed ... a way to do it easily from this view, which is
really helpful to give me insights into bigger picture gaps and opportunities."* Then: *"we have been harvesting course
SLOs, which might make alignments with certs and exhibits more reliable. Advise"* and *"This new list view is so helpful
that I want one now for each of our Catalog Commons groups."* Then: *"give me the flag but no find and replace"* (the CR
List), *"for exhibit and all other list views, adjust table and tab to full screen width and allow for a horizontal
scroll bar when needed"*, and the Catalog Commons asks (full width; Decision Sheet Library; a bold count, a green 0;
Completed Decision Sheets cut to one line that opens).

**What the screenshot showed was a render gap, not a grouping.** AAG, ABA and Abutments sat under 832 Arrest because the
List drew a band only over groups of two or more; the 592 titles alone ran on under the group above them. Every run now
has its band. Lesson: when a user reads a grouping as wrong, check what the screen draws before re-running the method.

**Kept groups (#2655).** `exhibit_group` on `_CREDENTIAL_REVIEW::<title>` (a group name, `_NO_GROUP`, or "" for the
night's sort), written one request per move; the view lays it over `kb/exhibits_ai_sort.json`, so a kept group holds
through rebuilds without the builder reading it. Two groups that share a name are one group, so Rename to another
group's name joins them. The move bar pins to the screen's bottom (a phone could not reach a bar under a 75vh table).

**One engine (#2656-#2660).** `commons_list.js` took the Exhibits List whole (exhibits.js lost about 660 lines) with every
Exhibits test unchanged; the CR, Subjects and Program Requirements Lists are specs on it. A background fork built the
engine and the CR List; two fresh agents built Subjects and Programs in parallel. The Subjects List added *Confirm this
pick*, the first way to confirm a pre-seeded Common SUBJ without retyping it, through the table's own save path.

**Full width (#2661).** COBI's `.main-container` caps every tab at 1400px; the engine lifts it with
`.main-container:has(#<prefix>host)`, so the cap returns when another view drops the host. The table's minimum width
comes from its columns (12px per width unit), so it fits at 1662px and scrolls in its own box at 1280. The Edit column
had taken the 1% the percent columns left and clipped; it now keeps 4%.

**The SLO test (read-only, 2026-11-01).** 746 of 2,663 credentials have an articulated course with SLOs (nine colleges).
Of distinct-course pairs at SLO similarity 0.5 or more, 36 of 113 already share an AI sort group; misses include
California Wines / French Wines (0.88) and Introduction to Corrections / Probation and Parole (0.54). 45 of 164 groups
share almost no outcomes (word-only groups such as CLEP Management with Trigonometry), though series groups score low
too. A shared course is articulation evidence, not outcome evidence; 409 shared-course pairs sit in different groups.
At the nine harvested colleges, 81 to 86% of articulated courses carry SLOs; the harvest is dispatch-only and last loaded
2026-10-14. The cert catalog carries skills for 1 of 7,335 certs, so outcome-to-cert matching waits on issuers' task
lists. Report: `CPLBrain/04-projects/cpl-initiative/20261101_SLO_Grouping_Test.md`.

**A slip worth naming.** The first commit of #2655 carried `kb/docs_audit/` files from a local lint run swept in by
`git add -A`; the merge conflict on main exposed it. Stage files by name.

## The reference's statewide flag, and S542's queue merged (S543 SkyAndromeda, 2026-11-01 to 02)

- **The statewide flag reads the Fact Sheet's set** (#2667, Sam's Sheet 154 *count*). `export_credential_reference()` seeds `statewide` from `fact-sheet/_build_statewide_recs.py`'s own `build()`: 152 credentials, up from 84 read from articulation lines; the 84 sit inside the 152 and no other field moved. Guard: `tests/credential_reference_statewide_basis_test.py`.
- **Check a handoff's "no consumer" against the code before acting on it.** Handoff 542 said no funding or ESS code read the flag. `funding/_build_funding_ess.py` builds ESS outcome 2 from it: 84 to 152 credentials, 70 to 72 colleges meeting the outcome. The finding turned a code-only fix into a card for Sam. The same session's own lesson (check a memory row against the code) applied to its handoff.
- **A PR stacked on a squash-merged PR carries the pre-squash commit.** #2664 conflicted in five files after #2663 squashed; cherry-picking its one commit onto `main` and pushing with `--force-with-lease` left a clean five-file diff.
- **Generated files conflict in every PR that regenerates them.** #2668 and #2669 each regenerated the dependency map; each needed `main` merged in and the map rebuilt (`git checkout --theirs`, then the builder), so they merge one at a time. #2668 also met #2670's engine rewrite in `commons_list.js`: only the header comment collided (both documented new hooks), and every List suite passed on the merge.


## SkyPinwheel (2026-11-02): the exam families in the catalog and the cert link

- **The authority list was already in the repo.** Handoff 546 proposed adding the College Board and the IB as issuers the
  nightly watch reads. The fold readers (`kb/_ap_official_titles.py`, `_clep_official_titles.py`, `_ib_official_titles.py`)
  already carry the official exam lists Sam ruled on, so the catalog builder imports them (`official_exam_lists`), as the
  link imports ASE's test names; the watch gains no issuer (its page keeps non-IT issuers for Sam to name). #2686.
- **152 exam rows, 98 joined to MAP:** every CLEP and IB title, 43 of 46 AP titles. The three left name two exams or one
  College Board never offered. The link holds 168 titles to 122 certs.
- **A prefix is not a match.** `startswith("IB Mathematics")` marked *IB Mathematics: Analysis and Approaches* retired;
  the retired set is now built from the reader's own (subject, level) pairs. A test pins it.
- **The catalog's core-name key folds a parenthetical.** *IB Language A1 HL (Non-English)* and *IB Language A1 HL* are
  one catalog row; the reference keeps the split, so the link points both titles at the one exam.

## SkyTadpole (2026-11-02): the IT vendor family in the cert link

- **A hand table where no code is shared.** ASE titles carry a test code and AP, CLEP and IB titles carry the official
  name, so both families match by rule. CompTIA, Cisco and Microsoft titles carry neither reliably (*CompTIA CySA+* is
  the catalog's *CompTIA Cybersecurity Analyst*; *CCNA* is *CCNA Certification*), so `VENDOR` maps each of the 41
  reference titles to the catalog's names, resolved by (issuer, name) at build time. A renamed catalog row shows as
  *not in the catalog* and the test fails, never a silent drop. #2689.
- **The catalog stores one row a version; the reference names none.** A Microsoft Office Specialist title holds any of
  that exam's versions (Excel: the Microsoft 365 Apps, Office 2019 and 2016 rows). Rows from another issuer (Certiport,
  OpenText) stay out: they deliver the exam, Microsoft issues it.
- **38 titles to 46 certs; the link holds 208 titles to 165 certs.** Three titles name no one cert and stay unresolved.
  Nine local courses (*Microsoft Excel 1*, *Using Microsoft Windows*) stay out: a college issues them.

## Moved from the lane (SkyTrue, 2026-11-03)

Sheet 161's ruling moved here verbatim from the lane's NEXT line once it was applied, with the lane at its size budget.

**Sam, Open Asks Sheet 161 (15:14Z 2026-11-03):** *drop* his Engine Performance 1 and 2 ASE issuer rows;
Metal Building Erection 1 takes his Iron Workers row (*ironworkers*). Applied 16:08Z (receipt's `then_applied`).

- **A lane line can trail the code by a merge.** The lane said *SLO hints, to build* a day after #2684 shipped them
  (`kb/_build_exhibit_slo_neighbors.py`, the List's *Outcomes match:*). Grep the code a NEXT or *to build* line names
  before you build it.

## SkyMalin (2026-11-04, S568, the CPL Queue routine): the FAA family in the cert link

- **Pick the next family by measuring the gap.** The FAA held the most reference titles with no link (37), ahead of ASE's
  local courses (10), ASME (8) and Autodesk (7). The catalog carried 48 FAA rows.
- **Most FAA titles are courses.** 26 of the 37 are flight labs, ground schools and A&P coursework that a college
  teaches toward a certificate, so they stay out, as *Microsoft Excel 1* does. The 11 that name a certificate or rating
  now hold 15 certs (#2758).
- **One issuer, two spellings.** The catalog lists *Federal Aviation Administration* and *... (FAA)*, and some names
  under both. Lookup folds the two and keeps the lowest id. Read every issuer spelling before you build a hand table.
- **Leave a title out instead of giving it a false reason.** The catalog has no plain CFI row. Marking CFI ("all", [])
  would print *names no one certification*, which is false. CFI, the Part 137 certificate and the Part 107 + POST
  bundle stay out of the table until the watch lists them.
- **Next families by gap:** ASME's pipe-welder qualifications (8 titles, 1 catalog row), Autodesk (7, 9), NFPA (7, 1)
  and NCCER (7, 13).


## SkyAntennae (2026-11-04, S569, the CPL Queue routine): Autodesk, NCCER and ASME in the cert link

- **Measure the catalog before you trust a handoff's count.** Handoff 569 gave NFPA one catalog row and ASME one; the
  catalog holds 16 NFPA rows and 9 ASME. The gap list was right about the titles and wrong about the certs.
- **One table, three issuers.** `HAND` in `kb/_build_exhibit_cert_links.py` carries each family's two catalog spellings
  and its titles, so the next family is a dict entry and no new branch. 13 titles now hold 20 certs (#2759); the link
  holds 232 titles to 200 certs.
- **A level short of journey holds nothing.** NCCER's catalog rows are the credential (*Commercial Electrician*), so only
  *Level 4/Journey Level* links; Levels 1 to 3 stay out. HVACR Level 1 and Welding Level 1 link because the catalog
  lists those levels by name.
- **A title whose exhibits name several issuers stays out.** *Fire Inspector 1* is filed under NFPA, but its raw
  titles name ICC, SFT and Cal-JAC too. NFPA's Firefighter, Fire Officer and Instructor titles name a standard that
  IFSAC or Pro Board certifies, and the catalog lists no NFPA certification for them.
- **Next:** the ASME BPVC welder qualifications and the SFT fire titles wait on the credential watch listing them.

## SkyFireworks (2026-11-04, S570, the CPL Queue routine): PMI, ICC, CDPH and EMSA in the cert link

- **The gap by issuer, measured against the catalog.** Of the unlinked titles, the California Community Colleges'
  1,334 are courses, and the apprenticeship committees (CTCNC 132, Southwest Carpenters 61, Iron Workers 52, UA 342 23,
  IBEW 23), SFT 99, DANTES 38 (the catalog holds 1 DSST row), ACE 29 and POST 16 have no catalog certs to point at.
  The issuers whose titles name a catalog cert were PMI, ICC, CDPH and EMSA. #2760 adds them: 17 titles to 16 certs (both
  CNA titles hold one cert). The link holds 249 titles to 216 certs.
- **One catalog spelling each.** These four issuers have a single spelling in the catalog, so each `HAND` entry is a
  one-item tuple. The reference spells ICC two ways, but the table keys on the title, so that split does not matter.
- **Left out:** PgMP and PfMP (no catalog rows), ICC's California code titles and the INSPEC courses, the EMT and
  nursing-assistant courses, *EMT-2 Certification* (California's old EMT-II has no catalog row), and *EMT
  Certification*, whose exhibits name EMSA, NREMT and ACE.
- **Next families:** AWS welding (19 titles, 17 catalog rows) needs a check of the D1.1 qualifications against the
  catalog's names. NWCG (17 titles, 6 rows) and SWRCB (12, 4) are small. DANTES DSST waits on the credential watch to
  list the exams.

## SkyHoags (2026-11-04, S571, the CPL Queue routine): AWS welding and Amazon Web Services in the cert link

- **"AWS" names two issuers.** The reference writes both the American Welding Society's and Amazon Web Services' titles
  as *AWS ...*, and neither family was linked. Amazon's four titles (Cloud Practitioner, Developer, Solutions Architect,
  CloudOps) match catalog rows one to one. The catalog holds 17 American Welding Society rows, but only two name a
  welding code: *AWS D1.1 Structural Steel* and *AWS D9.1 Sheet Metal Welding*.
- **#2761 adds 10 titles to 6 certs:** five D1.1 qualifications and the D9.1 one hold their code's row; the four Amazon
  titles hold theirs. The link holds 259 titles to 222 certs.
- **Left out:** D1.3, D1.5, D1.8, D17.1 and the B2.2 brazing qualification (no catalog row); *AWS Welder Qualification
  — D1.1/D1.3/D17.1* (two of three codes missing); the LA City certified-welder titles, which the City issues; the
  welding-process courses and the Light Gage titles. *Certified Welder (CW)* is AWS's umbrella program, so no title is
  pointed at it.
- **Next families:** NWCG (17 titles, 6 rows) and SWRCB (12, 4). The D1.x codes the catalog lacks wait on the
  credential watch.

## SkyBlackEye (2026-11-04, S572, the CPL Queue routine): NWCG and the State Water Resources Control Board in the cert link

- **A course title can carry a certification's words.** The Board's titles read like courses (*Water Treatment 1*,
  *Wastewater Treatment 2*), but each one's exhibits name the certification that earns the credit (*T2, T3, T4, or T5
  certification*). Read `raw_variants` before calling a title a course.
- **The Board's three catalog rows carry no grade.** A title naming a grade (D2, T3, wastewater grade II) holds its
  operator row, as a D1.1 qualification holds its code's row. Two titles name certifications joined by *or* and hold any
  of the three; *T3 / D3* holds both.
- **#2762 adds 12 titles to 4 certs:** 11 Board titles and NWCG's *Wildland Fire Chainsaws (S-212)*. The link holds 271
  titles to 226 certs.
- **Left out:** *Water Treatment Facilities* (its exhibits name two issuers); the other NWCG titles, which are courses.
  *Basic Wildland Firefighter (S-130/S-190)* is the training for the catalog's *Firefighter Type 2*, but the position also
  needs a task book, so no course title points at it. *Basic Faller* and *Helicopter Crew Member Trainee* have no title.
- **The S542 test** moved here from the lane: it is in the S542 entry above.
- **Next:** the remaining families are courses and apprenticeship committees with no catalog certs; measure the gap by
  issuer again before choosing one.

## SkyNeedle (2026-11-04, S573, the CPL Queue routine): IAI, Intuit and DRE in the cert link; the family work stops

- **Measure by issuer, across spellings.** Exact issuer matching reads zero catalog rows for issuers the catalog spells
  another way (FAA, NFPA, IAI). A keyword pass over the catalog's issuers found seven with rows and unlinked titles: NFPA,
  IAI, ESCO, Intuit, the Department of Real Estate, NEIEP and the State Fire Marshal.
- **#2763 adds 9 titles to 9 certs:** IAI's five certifications (each holds the catalog's row for its discipline, which
  carries no CCSI/CSCSA level), Intuit's Bookkeeping Professional and QuickBooks Certified User, and the DRE's broker and
  salesperson licenses. The link holds 280 titles to 235 certs.
- **Left out:** the ESCO Master Specialist titles (the catalog lists the professional-level exams and the Hands-On
  credential, never the written Master Specialist); the NFPA titles (their exhibits name Cal-JAC, ICC and SFT too);
  *Intuit QuickBooks Online Certified User* (no Online row); NEIEP's apprenticeship terms and the State Fire Marshal's
  courses (no catalog row names them); the QuickBooks and real estate course titles.
- **What remains, 2,370 titles:** California Community Colleges 1,334 (local courses), the carpenters' committees 198,
  State Fire Training 99, the Iron Workers 52, DANTES 38, ACE 29, high schools and ROPs about 60, IBEW and UA Local 342
  46, NWCG courses 16, OSHA 16, POST 16, CSLB 14, FEMA 11. None of these issuers has a catalog row that a title names.
  **The hand-family work stops here.** The next gain is in the catalog, not the link: State Fire Training (99 titles),
  POST, CSLB and FEMA issue certifications the credential watch does not read. Adding them to `_issuers_watched` is the
  credential watch lane's call, and the link rebuild picks up whatever it adds.

## Moved from the lane (SkyBeacon, 2026-11-06)

Verbatim from `docs/reference/lanes/cer-procedures.md`, when the lane passed its 20 KB budget.

**IB on the AP pattern (SkyInkberry, 2026-11-01; Sam kept it, Open Asks Sheet 150 card 1).**
`kb/_ib_official_titles.py` holds IB's `Diploma Programme` subjects, current and retired, at IB's levels, named as the
reference and the Cal-GETC IB list write them (*IB Language A: Literature HL*). A missing level takes HL, the
exam colleges award IB credit for, and an SL-only subject takes SL (*IB World Religions SL*). The exam's language folds
into the subject; a Language A exam in another language keeps *(Non-English)*. Brand-family's `ib` lane runs beside
`ap`. The fold merged 49 IB credentials into 24 (receipt `kb/credential_merges_out/2026-11-01/ib_fold_receipt.json`);
the issuer reads *International Baccalaureate Organization (IBO)* everywhere. Eight live rows moved under `cer-ib-fold-skyinkberry@bot`, one of them Sam's issuer save
(`ib_kb_curation_update_receipt.json`). Guard: `tests/ib_official_titles_test.py`.

**CLEP on the same pattern (SkyTeaberry, 2026-11-01; Sam, Sheet 150 card 2: fold; #2633).** `kb/_clep_official_titles.py`
holds College Board's 34 CLEP exams and the retired ones, one credential per exam: a language exam's levels fold in as
score bands (*CLEP Spanish Language*), the numbered exams take 1 and 2 with no period subtitle, a renamed exam takes its
current name (*CLEP Information Systems*). Brand-family's `clep` lane runs after `ib`. 48 CLEP names became 35; 33 live
assignments and 3 panel markers moved under `cer-clep-fold-skyteaberry@bot` (`clep_kb_curation_update_receipt.json`);
the two Level III markers stay under their old keys. Guard: `tests/clep_official_titles_test.py`.

## SkyUmbrella (2026-11-10, S626, the CPL Queue routine): the first exhibit re-analysis

- The request row carried an empty `changed` list and no comments, so the changes are the sender's `_CREDENTIAL_REVIEW::` saves since the button went live (2026-11-01; no earlier done row): 20 issuer overrides on 19 credentials.
- A two-word title stem is useless when its first word is generic (*Introduction to* paired Geographic Information Systems with Accounting); the checks make no stem from a generic first word or a stopword second.
- *No CPL type* fires on every credential no college has articulated yet (17 of 19 here); the findings say so, so it reads as expected rather than as curation work.
- A spelling finding that corrects Sam's own save is held for his word (Rule 8), even at 110 to 1.

## Moved from the lane (S634): Sam's rulings, Open Asks Sheet 147

**Sam's rulings, Open Asks Sheet 147** ([the sheet](https://claude.ai/artifact/XVNFzgxMW4mAiCC9YUsABB), completed 00:06Z 2026-10-31, all five his own call; cpl_memory `sam-sheet-147-rulings-2026-10-31`). Build in this order:

1. **One Exhibits tab** in the Catalog Commons replaces the CER and EACR; **Review is built first**. The two tabs stay until Exhibits carries everything they show.
2. **The high school and ROP rule — built (SkyGooseberry, 2026-10-31).** Detail moved verbatim to the lessons doc, *Moved from the lane (S541)*.
3. **The public adoption page lists settled credentials only** (a person's or a rule's stamp), so it grows as the CER finishes. Its name is still his to give; *Credentials Your College Can Adopt* holds the place.
4. **The page takes Malone's CPL/AI look**, beside the Library and Sierra (the mock-up's First Light was proposed and set aside).
5. **The CPL-AI matching in the Program Requirements dialog — built (SkyGooseberry, 2026-10-31).** Detail moved verbatim to the lessons doc, *Moved from the lane (S541)*.

## S636 SkyAntennae (2026-11-11): the apply reports an issuer a changed override leaves behind

- `promote_issuers` fills or appends and never removes, so S634's changed override for 10-Key Data Entry left the old issuer in `kb/credentials.json` until the reference was edited by hand (`cpl_memory` `p-credential-review-apply-never-removes-issuer`).
- `stale_override_issuers` (#3100) names each issuer an override once appended (`classified_by` *curator (CER issuing-agency override)*) that no current primary or additional override names, and the apply prints them. It removes nothing: one credential may rightly carry several issuers (Rule 4), and the apply cannot tell a replaced issuer from a second rightful one. A record the override filled in place carries no mark of it and is not read.
- Measured on the live files, 2026-11-11: 166 appended records, none stale. Guard: `tests/credential_review_stale_issuer_test.py`.
- **Not built:** a retire path that removes an issuer. It needs a rule for when one issuer replaces another, which is a person's call.

## S637 (SkyPorpoise, 2026-11-11): related titles, certification names, the rename batch, the canonical model

- **Sam's rulings this run, in order.** The title format (*"Use the cert's official name first and the code in
  parentheses"*; #3108). At 06:20 PT, relayed by COBIx and confirmed by him in session: *"Keep the college as issuer on
  the P1 title"*. At 06:50 PT on #3110: the canonical title carries the credential's issuer and each local exhibit its
  path and assessor, which replaced the 06:20 note; then rulings 3 to 6 (bundles, the AWS and ACE tags, trainers, the
  ITPI ask). `docs/reference/canonical_credential_model.md`, DR-34 (#3114).
- **A ruling on a model question can move within the hour.** The issuer was built, tested and recorded twice. Build
  the reversible half until the ruling is marked final (Sky's reply on #3111, item 2).
- **A test that pins a dated ruling tells you when you are about to reverse it.** `tests/exhibits.test.js` failed on
  *"a course aligned to an ASE test keeps the proposal's issuer"* (Sam, 2026-10-31) the moment the format filled ASE.
  That stopped a silent reversal in #3108; #3114 changed the same test on his word.
- **The rename path already existed.** Approving the batch writes `unified_title_override` and
  `unified_title_merge_confirm`; the dry run renames the earliest-saved title of a group and queues the rest as
  merges, so the title that leads is saved a second earlier.
- **A merge keeps every distinct issuer** (`fold_credentials` dedupes on issuer and trainer only). Folding a
  college-issued title into an ASE title leaves two issuer records. Fix that before the 16 merges apply (Sky on #3110).

## Moved from the lane (S638): the Credential Catalog port and the statewide request route, as they stood

**The Credential Catalog, ported from the mock (SkyAerial, 2026-11-06; Sam: "I think it would make a good beginning for
our credential registry", then "let's roll with this"; the mock https://claude.ai/artifact/2r9apBWRRiaYS6CNqYy3Ds, eight
versions in one morning).** `library/adopt/` now runs the full width; three figure tiles beside the title open what they
count (1,260 earn credit at a college, 101 colleges award it, 7,389 not yet evaluated; the tile count is his call, "101 is
right") and **follow every filter but Credit status** (SkyLantern, Sam 2026-11-06: Computer and Information Sciences reads
68 · 44 · 997; with a college pick the first two count what earns credit there), and a tile keeps the filters when it opens; *Start with* names five kinds of learner; every filter is a multi-select picker (College with a district heading
only where a district has more than one college; Region under *Strong Workforce* and *ASCCC*; Field; *How credit is
given*; **Credit status**, Show folded into it); the list groups under field headers, the largest work fields first and
the exams (AP, IB, CLEP, DSST) last; a **List** view drills down (issuer searches, field and type filter, the count opens
the awarding table) **one line a credential** (SkyLantern, Sam 2026-11-06): Credit status is its own column, *Ask us to
prioritize* the last column on the right (its *Ask* and the asked count), a long cell ends in an ellipsis with the whole
text in its title, and the List scrolls in a box a screen tall that **lazy-loads** the next 72 as the reader nears its end
(the cards too, against the window; Show more stays only where the browser lacks IntersectionObserver). **Worth a faculty
review sits above the results**, its 28 cards in a box about two rows tall; the matrix's cells open a side panel (**A** marks a college
that could adopt; a column heading picks the college); the panel resizes from its left edge and the browser keeps the
width; the Library's eleven photos cycle with *Pause photos*; the intro says *many*, and no public string says a bare
MAP or CPL. **Credit status in public words, the Commons' curation words beside them:** Earns credit at a college
(Awarded somewhere, 1,260) · Earns credit here / Earns credit elsewhere, could be added here (the two college-relative
values, replacing Show) · Known to a college, no credit yet (In MAP, no articulation yet, 12) · Being reviewed (Held for
title review, 1,171) · Not yet evaluated (Harvested, no exhibit yet, 7,389, the nightly watch's
`kb/it_ai_credential_catalog.json`). Data: `kb/_build_adopt_page.py` also writes `adopt_more.json` (the other statuses,
read after the first paint); `kb/_build_adopt_align.py` writes `adopt_align.json`, the **analysis for faculty** (issuer
skill areas from `kb/reference/industry_credential_skills.json` against `public.course_outcomes`, an illustrative
word-overlap score labeled so; the Foundation and ASCCC method, or a TypeSafe Jev Score per skill area, replaces it; Jev
already runs the harvest, `tests/jev_harvest_test.py`). Both run daily. Tests `public_adopt` (91),
`adopt_align_build_test.py` (9), `adopt_page_build_test.py` (32); `npm run a11y -- public-adopt public-adopt-dark
public-adopt-matrix public-adopt-list` (the last two new). **Request an evaluation** ships with the routes that exist
today: the college route through *Find your college* and *Credit for Being You* (the portal is recorded as a Found data
source, `docs/reference/data_sources.md`), and a statewide line that says the list is being set up.

**RULED and built (Sam, Open Asks Sheet 162, 15:16Z 2026-11-06, his own call, in a note; built by SkyLoop the same
afternoon): the statewide route is a public request to prioritize review, never an evaluation promise.** His words:
*"Reframe it as a public request to prioritize review of a credential. The idea is that we could collect requests to help us
better prioritize our work without promising any one person that we would evaluate their credential--that would be left to
the discretion of local colleges."* The page's word is **Ask us to prioritize this credential** (the panel's heading, every
card's chip; *Ask us to prioritize* on a List row's 0); the panel's statewide paragraph says each request raises the
credential in the Initiative's order, that evaluation rests with a college's faculty, and that no reply is sent. The form
takes the credential (fixed), an optional college (prefilled from the pick) and an optional email, and posts to **one
INSERT-only SECURITY DEFINER function**, `credential_priority_request()`, which validates, bounds, drops a repeat from the
same email within a day, and returns the count; `credential_priority_counts()` is the one public read (credential and n,
nothing else) and paints the count beside the credential on its card, its List row and the panel's heading (the count is
the signal). The table `credential_priority_requests` has no public policy; the team reads rows behind the phrase or a
reviewer sign-in; nobody deletes. Migration `kb/migrations/2026-11-06_credential_priority_requests.sql` (+ rollback), applied
16:21Z by `supabase-migrate.yml` from `kb/migrations/.apply` (receipt `kb/receipts/migration_credential_priority_requests_42251263756.json`;
the MCP's apply had waited on a confirmation and timed out, Rule 10 c); read back live: anon executes the two functions and
holds no insert on the table, RLS on. Governance before shipping (Rule 10 a3): register row **DR-31**, `table:` and `rpc:credential_priority_request`
mapped to it, the counts read dismissed with its privacy reason; the dependency map regenerated. Tests: `public_adopt`
(81). **NEXT:** the Commons Exhibits List reads the rows as a queue item with its count (below).

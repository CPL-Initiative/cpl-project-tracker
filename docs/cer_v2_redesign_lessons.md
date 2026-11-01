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

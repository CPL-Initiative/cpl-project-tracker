---
title: Exhibit Canonicalization — Decisions & Lessons (credential-identity layer)
date: 2026-05-24
last_updated: 2026-06-04
session: 6 (Bruh Hex), updated through 8 (Octaman), 10 (Sexy Dexy), 11 (Bruh El), 12 (Bruh Dec), 30–31 (CER triage), 32 (CER refinement + merge tool)
status: ACTIVE — Session 32 added the existing→existing credential MERGE tool (kb/_merge_credentials.py); CER UI refinements shipped (#284/#285/#286)
tags: [exhibit-canonicalization, credential-identity, audit, kb, eacr, rename-promotion]
artifacts:
  - kb/unified_titles.json
  - kb/credentials.json
  - kb/_audit_exhibits.py
  - kb/classify_exhibits.py
  - kb/_flag_hinky_exhibits.py
  - kb/_curation_credentials_01.py
  - .claude/skills/exhibit-canonicalization/SKILL.md
  - docs/exhibit_unification_vision.md
  - kb/exhibit_audit/{latest.json, <date>.md}
related:
  - CLAUDE.md §9 (EACR Exhibit Identity — current state, future direction)
  - kb/README.md (KB schemas + identifier precedence)
  - docs/subj4_canonicalization_remint_lessons.md (the course-identity sibling layer)
  - docs/unified_courses_audit_lessons.md (the kb/_row_audit.py pattern this auditor mirrors)
prs: [TBD — PR-A in flight, PR-B queued, PR-C deferred]
---

# Exhibit Canonicalization — Credential-Identity Layer

This is the lessons doc for the **credential-identity** workstream — the
synthetic layer above MAP's freehand exhibit titles that collapses title
drift into unified credential names. Sister workstream:
[`docs/subj4_canonicalization_remint_lessons.md`](subj4_canonicalization_remint_lessons.md)
covers the **course-identity** layer (M-IDs, C-IDs, CCN-IDs); this one
covers credentials (Industry Cert / AP / POST / IBEW apprenticeship /
JST / Cx generic buckets / …).

Design doc (the why): [`docs/exhibit_unification_vision.md`](exhibit_unification_vision.md).
Operational rules: [`.claude/skills/exhibit-canonicalization/SKILL.md`](../.claude/skills/exhibit-canonicalization/SKILL.md).

## What this is

Each raw MAP exhibit title (`View_ArticulatedMAPExhibits_APIDataset`) gets
classified into three synthetic fields with per-field confidence:

| Field | Storage | Curated key |
|---|---|---|
| `unified_title` | `kb/unified_titles.json` | `raw_title` |
| `issuing_agency` + `training_agency` | `kb/credentials.json` | `unified_title` → list of issuer records |

The classifier is `kb/classify_exhibits.py` (Phase 3 batch) — sends each
distinct raw title to Claude with the skill's decision rules as the system
prompt, caches the result, never re-classifies a row whose `reviewed_at`
is set. Quality flagger `kb/_flag_hinky_exhibits.py` adds
`quality_flag: "suspect_course_as_exhibit"` to the ~200 Modesto-JC-pattern
data-entry artifacts where colleges typed "Industry Certification" for
something that's actually a course with no associated credential.

## 2026-05-24 baseline audit (the work shipped this checkpoint)

`kb/_audit_exhibits.py` — re-runnable read-only auditor, modeled on
`kb/_row_audit.py`. Walks the credential layer, surfaces what's stale,
low-confidence, or suspect. Outputs to `kb/exhibit_audit/{latest.json,
<date>.md, <date>.full.json}` (the full breakdown is gitignored, same
pattern as row_audit).

**Headline numbers (2026-05-24):**

| Metric | Value |
|---|---|
| Raw titles classified | 3,217 |
| Distinct unified titles | 1,969 (61.2% compression) |
| Singleton unified titles (1 raw → 1 unified) | 1,575 (low compression value) |
| Credential records | 1,991 across 126 distinct issuers |
| Titles `reviewed_at` set | **0** ⚠ |
| Credentials `reviewed_at` set | 16 |
| Unclassified raw titles in current MAP | **194** (re-classification backlog) |
| Stale KB entries (no longer in MAP) | 155 |
| `suspect_course_as_exhibit` flags | 200 |
| `agency_name_collision_signal` (canonicalization opportunity) | 211 |

**Title confidence distribution:**

| band | count | % |
|---|---:|---:|
| 0.95–1.00 | 836 | 26.0% |
| 0.80–0.94 | 1246 | 38.7% |
| 0.60–0.79 | 882 | 27.4% (review queue) |
| 0.40–0.59 | 220 | 6.8% (high-priority triage) |
| <0.40 | 33 | 1.0% (lowest — usually course-code-as-title artifacts) |

**Active audit rules:**

- `low_confidence_title` / `very_low_confidence_title` — confidence_title
  in the 0.60–0.79 / 0.40–0.59 bands respectively.
- `low_confidence_issuer` / `very_low_confidence_issuer` — same for
  `confidence_issuer`.
- `low_confidence_trainer` / `very_low_confidence_trainer` — same for
  `confidence_trainer` (fired only when `training_agency` is non-null).
- `agency_name_collision_signal` — issuer-name pairs where one's token set
  is a proper subset/superset of another. Often catches the same agency
  under two spellings (e.g. `Google` vs `Google LLC`) AND genuinely
  different orgs with overlapping name patterns (e.g. American Council on
  **Exercise** (ACE) vs American Council on **Education** (ACE) —
  different orgs, same abbreviation; surfacing both is desired so a
  curator can verify before any consolidation).
- `suspect_course_as_exhibit` — pass-through from `_flag_hinky_exhibits.py`.
- `blank_unified_title` — sanity-check; should always be 0.
- `unclassified_in_map` — raw title exists in current MAP but not in KB.
- `stale_kb_entry` — KB entry no longer in current MAP data (low priority).

A `null_issuer_with_high_confidence` rule was scoped and then **dropped**
because it fired on 626 records — 99% of which are legitimate
local-college Cx / portfolio buckets where null issuer is semantically
correct, not a data quirk. The classifier confidently marks them null;
that's by design. Lesson: audit rules need to be calibrated against the
actual data shape, not the abstract idea of "what could go wrong" — a
600+ noise-tag count drowns the actionable signals.

## Current state — what's done, what's not

| Vision-doc phase | Status |
|---|---|
| 1. Skill + prompt | DONE (2026-05-18) |
| 2. KB seed (50 hand-curated) | DONE (2026-05-19) |
| 3. Full first-pass classification (3,217 titles) | DONE (2026-05-20) |
| **3.1 Audit baseline** | **DONE (2026-05-24, this checkpoint — PR-A)** |
| 4. Pipeline integration — EACR groups by unified title | **NOT DONE** (architecturally significant; deferred — see roadmap below) |
| 5. UI — curator-facing surface (Credential Reference tab) | **NOT DONE** (PR-B, queued for this session) |
| 6. Quality loop — review workflow / periodic re-classification | **PARTIAL** — the classifier supports `--reclassify` and never overwrites `reviewed_at` rows; no UI yet for marking rows reviewed |

**Pipeline coupling today.** `excel_to_dashboard.py` does NOT read
`unified_titles.json` directly when building the EACR table — that table
still groups by `(raw title, CPL Type, Collaborative Type)` per
`_build_statewide_adoption()` (~line 3944). The unified-title field is
consumed indirectly via `kb/coci_articulations.json` (Phase 3 of the
course-identity workstream inlines the unified_title there), which feeds
the "Articulations by Unified Course" CPL Analytics card. So we get the
benefit of unified-title grouping in *one* card today, but the headline
EACR cards still suffer from title drift.

**Daily-cron coupling: none.** `kb/unified_titles.json` and
`kb/credentials.json` are committed static artifacts. The classifier is
not on the daily schedule; new raw titles flowing in from MAP land in the
audit's `unclassified_in_map` queue until the classifier is run.

## Strategic roadmap (Session 6 → next)

| Phase | What | When |
|---|---|---|
| **PR-A** | Audit baseline + this lessons doc + .gitignore + classifier re-run on the 194 unclassified-in-MAP titles | **In flight (this checkpoint)** |
| **PR-B** | **Credential Reference tab** (working title) — top-level dashboard tab modeled on the CSC tab. Read-only MVP first: list every unified_title with raw-variant count, issuer, confidence band, quality_flag, "also entered as…" disclosure. Filters: confidence band, issuer, flagged-only, blank-only. Allowed-reviewers auth + synthesized `kb_curation` namespace (`_UNIFIED_TITLE::<raw_title>` / `_CREDENTIAL::<unified_title>::<issuing_agency>`) so no new Supabase tables are needed. Two-stage curation workflow (initiated → validated) added if the MVP lands clean. | Queued — Session 6 |
| **PR-C — DEFERRED** | **EACR Phase 4 re-pivot** — change `_build_statewide_adoption()` grouping key from raw title to unified title (and probably to `(unified_title, issuing_agency, …)` per vision doc §6.1). **Architecturally significant** (changes headline EACR adoption numbers; 3,274 cards → ~2,000 est.). Treated like the course-identity "Approach B" (CLAUDE.md §9) — scope before any build. Probably its own session. | Deferred |
| Phase 6 | Quality loop — make classifier runs cron-scheduled OR add a "reclassify-on-demand" button to the curator tab (reviewer-gated). Add `validated_at` two-stage curation per the CSC tab pattern. | Parked |

## Patterns to reuse from sibling workstreams

The credential layer arrives at this milestone roughly where the
course-identity layer was pre Session 5 — data laid down, no curator
surface, pipeline only partially consuming. Patterns that worked there:

1. **Curator tab UX shell.** `canonical_subj4.js` + the new `cs-*` CSS
   namespace + the toolbar/body separation (toolbar built once, body
   re-renders) gives a clean template. The Credential Reference tab
   should reuse the same pattern — filter dropdown, native-datalist
   typeahead, sortable columns, Variants modal.
2. **Synthesized key namespaces in `kb_curation`** (no DDL needed). The
   CSC tab uses `_CANON_SUBJ4::<discipline>`; mirror it with
   `_UNIFIED_TITLE::<raw_title>` for unified-title overrides and
   `_CREDENTIAL::<unified_title>::<issuing_agency>` for issuer/trainer
   edits. Both go into the existing `kb_curation` Supabase table.
3. **Two-stage curation (initiated → validated).** Same column shape as
   the CSC tab (`reviewed_at` / `reviewed_by` for stage 1,
   `validated_at` / `validated_by` for stage 2, both gated on the
   allowed-reviewers list). Now that the CSC tab's UI label is
   **"Initiated"** (not "Reviewed") — PR #112, this checkpoint — the
   Credential Reference tab should ship with the same vocabulary from
   day one.
4. **`⚙` provenance badges + `⚠ N` audit chips.** CCR rows carry both;
   Credential Reference rows should too — `⚠ N` showing the audit tag
   count, `⚙` showing the confidence-band signal.
5. **Pending-sync indicator.** The CCR tab's "⟳ N edits awaiting daily
   sync" indicator (diffed against `committed_curation`) is a curator
   trust pattern. Apply it here once the curator-write path exists.

## Risk hot-spots when picking up

- **PR-C (EACR re-pivot) changes adoption numbers.** Treat like Approach
  B in CLAUDE.md §9. Scope-first session before any build.
- **`kb/coci_articulations.json` already inlines `unified_title`.** Any
  unified-title rename (e.g. consolidating "EMT Certification" variants)
  ripples there. If we ever do a credential-layer re-mint, the same
  re-mint playbook (`docs/coursecontrolnumber_remint.md`) discipline
  applies: dry-run first, alias map committed, fresh-read at write-time,
  atomic land within one cron window.
- **Modesto JC `suspect_course_as_exhibit` (200 rows)** needs college
  outreach to resolve, not data work. Surface them in the curator tab so
  a reviewer can mark "yes this is a course, not a credential" and the
  EACR can downstream-filter or visually flag those cards.
- **194 unclassified-in-MAP titles** — re-running the classifier requires
  an `ANTHROPIC_API_KEY`. Estimated ~$1–3 with cache (system prompt
  cached after first chunk). Either set the env var in the Claude Code
  on the web env-vars panel and re-run via web session, or run
  `python3 kb/classify_exhibits.py` locally.

## Next concrete step

Land PR-A (this checkpoint), then start PR-B — the **Credential
Reference** tab, read-only MVP first. The auditor surfaces the queue;
the tab gives a curator a place to work it.

---

## 2026-05-24 through 2026-06-04 — moved to the archive

PR-B, PR-D, the Cred-Ref PR-1 through PR-5b series and Sessions 8 through 32 moved verbatim to
[`exhibit_canonicalization_lessons_archive.md`](exhibit_canonicalization_lessons_archive.md) on 2026-10-18.

## 2026-07-07 — the stuck triage session: token-expiry root cause + the fold grows a supersede lane

Sam assigned all 5 open triage items (AUTO 600/601/602 Completion, Automotive,
Inspection Portfolio Spring 2026 #1) and "the tab stopped working." Two distinct
problems, both fixed:

### Learning 1 — the tab "stopped working" because CER never refreshed the token
The 10 Supabase writes landed fine at 14:05 UTC; the breakage came AFTER. CER had
the exact pre-Session-77 raci.js bug (`docs/kb-notes/methodology-refresh-token-before-write.md`):
`getSession()` keeps an expired session alive whenever a `refresh_token` exists,
but no write path ever renewed the access token — so ~1h after the magic-link
sign-in every save 401'd silently into a dead "retry" (and the worklist "clear"
link literally no-opped on `!r.ok`), while the auth widget still showed ✓ signed-in.
Adversarially verified with an end-to-end jsdom repro (a 4-lane hypothesis workflow;
the tab-plumbing / generator-bake / Pages-artifact lanes were all exonerated with
receipts). Fix: the raci trio ported (`refreshToken` + single-flight `ensureFresh()`
+ 401/403 session-drop via `withFreshSession()` on all 5 write fns), init `.catch`
retry card, and `tests/cer_token_refresh.test.js` (18 assertions) guards it.
SINGLE-FLIGHT matters here: the worklist saves title+issuer in a `Promise.all`,
and two parallel refresh-token exchanges can kill a GoTrue session outright.

### Learning 2 — whitespace twins: the queue listed titles the KB "already had"
All 5 triaged raws were ALREADY classified — 4 under trailing-space twin
spellings (`'AUTO 600 Completion '`) that the Phase-3 batch had machine-classified
to fallback non-credentials (`AUTO 600 — Long Beach City College Auto Course`,
`Automotive (Generic)`), while the 2026-05-24 audit listed the TRIMMED spellings
as unclassified. The June fold only matched exact keys, so twins were invisible.
`kb/_fold_unclassified.py` now handles this as a class:
- **SUPERSEDE lane** — a curator assignment beats an UNREVIEWED MACHINE draft
  (reviewed_by empty + classified_by ≠ curator sentinel), across every
  whitespace-twin spelling (`.strip()` match). Human-reviewed entries still CONFLICT.
- **STALE lane** — an overlay assignment older than a curator KB decision (the 5
  strategy-2 renames from June) reports but never gates; V1 stays meaningful.
- **Ripple auto-resolution** — superseded raws' `coci_articulations.json` rows are
  re-pointed in the same apply (methodology strategy 3 made mechanical for the one
  unambiguous case); clean-lane ripples still block for the human call.
- Orphaned machine credential records prune; a machine target record with a null
  issuer gains the assignment's issuer (stamped curator).
Applied 2026-07-07: 11 supersedes (Sam's 5 + 6 June twin stragglers), 8
articulation rows re-pointed, 7 orphan records pruned, queue → 0. Receipts:
`kb/unclassified_fold/2026-07-07/`.

### Learning 3 — the pipeline was open-loop; now it closes itself
The fold was a manual PR-3 nobody ran since 2026-06-03, and NOTHING refreshed
`kb/exhibit_audit/latest.json` (the auditor was in no workflow — frozen at
2026-05-24, which is exactly why already-classified titles sat in the worklist).
Daily cron now runs `_fold_unclassified.py --apply-if-safe` (V-gates pass → fold;
conflicts/blocking ripples → report + wait for the manual path) AND
`kb/_audit_exhibits.py` after it, so triage → fold → fresh queue is a same-day
loop. The CER worklist shows OPEN counts ("✓ N awaiting fold" when done), a
queue-clear state, and the fold explainer. Pages deploy now asserts all 4
CER-fetched paths; tabs.js loadScript no longer wedges on a once-failed script.

### Cx naming procedure + issuing agency (Sam's calls, now Rule 5c in the skill)
Single-course Cx/portfolio exhibits → the course-content title (`Automotive
Lubrication Service`), code-only courses → `<Discipline> (<CODE>)`
(`Mathematics (MATH 095)`); batch Cx → the program-area umbrella; mechanism never
in the title; **issuing agency = `California Community Colleges`** (plural —
the 4 singular records from today's saves were normalized in KB + Supabase).

### State / next
- Authority-anchoring strategy (CareerOneStop certifications bulk file + CA
  License Finder + O*NET SOC codes + Credential Engine reconciliation):
  `docs/kb-notes/reference-authority-anchored-credential-naming.md` — decisions
  on Sam (COS API account, CE partnership status, attribution placement).
- Carryover stands: CPL-type-duplicate detector, 3 audience views, the ~50
  NEW-credential long tail.

### 2026-07-07 (continued) — the CareerOneStop authority lane BUILT
Sam: "Build the CareerOneStop and we'll factor in our Credential Engine
integration afterward" (the MAP↔CE partnership will CTDL-tag all MAP CPL data;
those tags canonicalize against CE later — the `cos_cert_id` anchors minted now
become the join keys). Shipped: `kb/_sync_cos_certifications.py` +
`cos-authority-sync.yml` (runner-as-proxy, probe-first, monthly cron),
`kb/_match_cos_authority.py` (join ladder with the fixture-caught precision
guards: token-subset containment NOT substring — 'firefighter i' is a substring
of 'firefighter ii'; a LEVEL GUARD; `+`→`plus` folding so CompTIA A+ never
degenerates to the stopword 'a'; ≥2-token containment floor), the CER ✓/≈ COS
chips + required USDOL/DEED attribution, `tests/cer_cos_badge.test.js` (11).
Also: today's fresh audit surfaced **481 new unclassified titles** the frozen
snapshot had hidden — the authority vocabulary is what makes that backlog
tractable. Next: probe run → header-map confirm → apply → triage with Rule 5c.

### 2026-07-07 (continued 2) — Rule 5c identity integration, Phases 1+2 SHIPPED
Sam's refinement: Cx titles anchor to C-ID/CCN titles when they exist, M-ID
titles later once that layer is declared stable. Precedence codified (CCN >
C-ID > M-ID-when-stable > local course content — mirrors CCR identifier
precedence). Measured first: **0/481 queue items have articulation rows**, so
the join parses the LOCAL COURSE CODE from the raw title →
`kb/_suggest_unclassified.py` (COCI (SUBJ,NUM) join with the membership-hazard
guards: unanimous-identity requirement, remainder-title overlap check,
exam-brand (AP/IB/CLEP) exclusions incl. the "(BIOSCI 100)" target-course
parenthetical trap) → `kb/unclassified_suggestions.json` → 💡 one-click fill
chips in the worklist (curator always confirms; `tests/cer_wl_suggestions.test.js`,
12). First real run: 28/481 direct suggestions (5 C-ID incl. ADM JUS 003 →
AJ 124 "Legal Aspects of Evidence", 23 modal-course); the COS tier joins the
same chips once the registry syncs. Phase 2: the fold stamps `title_anchor`
{system, id} on entries whose assigned title matches a CCN/C-ID suggestion —
the hook that makes the M-ID phase-in + future re-key ripples mechanical.
Phase 3 = flip `--with-mids` when Sam declares M-IDs stable.

### 2026-07-07 (continued 3) — SkyAnchor: COS authority LIVE end-to-end + triage QA + the AP art fold

Sam's credentials landed (GitHub-secret gotcha: the Name box takes ONLY
`COS_USER_ID` — no `=`, no value) → probe validated auth same-hour. **Probe
findings that changed code before the first apply (#676):** the API embeds
acronyms IN the name ("50001 Certified Professional - 50001 CP", no Acronym
field) → `split_name_acronym()` in BOTH lanes (level/digit suffixes exempt);
pagination hardened (advance by actual batch, stop at RecordCount, bail on
non-advancing startRecord) since the API is now the PRIMARY lane (bulk 403s
runners). Verified by the committed no-network harness
`kb/_verify_cos_sync_lanes.py` (23 checks, mocked api_get). **Apply: 6,490
certifications** (the `0` keyword enumerated nearly the whole registry;
empty-keyword pass fail-softed as designed) → **match ladder: 83 matches**
(44 exact · 8 acronym · 31 contains), 22 ambiguous reported, 2 issuer fills
possible; receipts `kb/cos_match_out/2026-07-07/`. **Serving gap found+fixed
(#677):** runner pushes don't fire push workflows, so `pages.yml` gained
`workflow_run: cos-authority-sync`, the `kb/cos_matches.json` served-path
assert, and the registry prune (tracker-internal per the COS terms).

**Triage QA (Sam's 33-title day, all fixes Sam-approved, applied in Supabase):**
the handoff's watch-items fired exactly as predicted — 3 ASE assignments had
invented new shapes with 3 org spellings → retargeted to the EXISTING
`ASE <code> — <content>` house family (the KB's 60+-record family beats
COS-verbatim for consistency; issuer `National Institute for Automotive
Service Excellence (ASE)`); 4 AP art assignments pointed at RETIRED College
Board names → retargeted to current (`AP 2-D/3-D Art and Design`, `AP
Drawing`); 1 double-space title (the whitespace-twin hazard); apprenticeship
→ the existing `Carpenters Apprenticeship — Acoustical Installer` family
(never CCC issuer); portfolio Cx issuer → CCC per Rule 5c (ICC issues
nothing). **Lesson: when an existing family exists, retarget to it verbatim —
consistency with the house family outranks authority-verbatim naming; the COS
chip still lands via the contains tier.**

**AP art fold APPLIED** (`kb/_merge_credentials.py`, 5 decisions appended to
`kb/credential_merges.json`): the 5 stale `AP Art and Design: *` colon
variants → the 3 College Board-current canonicals. 18 raws + 20 articulations
re-pointed, 9 AP art families → 4 (incl. AP Art History), credentials 1,969 →
1,964, all V-gates green, receipt `kb/credential_merges_out/2026-07-07/`.

**Next:** Sam continues the ~448-title queue (existing-family-first!); the
lane choice after = military COOL/MOC crosswalk (recommended — the COS
registry already carries ASE MIL1–8 as join points) vs CA License Finder;
`--apply-issuers` dry-run (2 fills) still a deliberate manual step.

### 2026-07-07 (continued 4) — the COOL/MOC crosswalk lane: registry LIVE, bridge proven

Sam: "Let's wire in the COOL/MOC crosswalk too." **Measure-first finding that
set the design:** the CER's military exhibit layer is tiny (25 raws / 16
JST-course families, ZERO occupation codes) — so the lane is the **veteran
PATHWAY bridge**, not an exhibit matcher: MOC → O*NET-SOC → certifications →
CER `cos_cert_id` anchors → colleges with articulations.

Built as `kb/_sync_moc_crosswalk.py` + `moc-crosswalk-sync.yml` (the COS
architecture verbatim; same secrets; monthly cron day-5). **Three probe
rounds pinned the contract** (#679/#680/#681): ① the O*NET crosswalks page
auto-yields `dl_files/2019/military_crosswalk.zip` → `milx0724` (40,077
change-history rows); ② O*NET-SOC codes ride in NUMBERED columns `ONET1..4`
(+ legacy `SOC1..4`), `-` is the null sentinel — a single-column HEADER_MAP
can't see them (and probe prints must NEVER truncate: round 1's 8-column
header print hid exactly the column that mattered); ③ the four guessed
CareerOneStop MOC endpoints don't exist (404), but **the cert finder takes a
dotted O*NET code as its KEYWORD** — `49-3023.00` → 75 certs, first hit an
auto-tech certification. **Bridge proven end-to-end.** Apply committed
`kb/reference/moc_crosswalk.json`: **33,874 MOC records, 17,916 (52%) with
O*NET mappings**; spot: Army 68W Combat Medic → 29-2043.00 (Paramedics) ✓.
Registry tracker-internal (pages.yml prune, the COS precedent).

**Caveat for the bridge phase:** MOC codes are REUSED across eras (Army 91B =
"Medical Specialist" historically, vehicle mechanic today) and the v1
aggregation unions all eras' SOCs per (branch, code). Refine with the
STATUS/SDATE/EDATE fields (+ the archive's Read Me.pdf branch-letter
vocabulary — 20 SVC codes, not 5) when building `moc_cos_bridge.json`.

**Next concrete step:** the bridge artifact — batch the ~distinct ONET codes
through the cert-finder keyword leg on a runner (one-shot), join returned
cert Ids to the COS registry, emit `kb/moc_cos_bridge.json`
(MOC → [cos_cert_id]) → wire the consumer (Sierra's veteran turn / a CER
military-pathway chip).

### 2026-07-07 (continued 5) — SkySeed: the brand-family PRE-SEED, 158 of the 451-row queue in one pass

Sam, looking at the triage list: "it would be helpful to have a procedure that
pre-seeds the common exhibit titles and issuing agencies — all the APs should
be an easy win, right?" Measured first: the 451-row queue is **38 AP + 125
CLEP = 163 College Board exams (36%)** — and BOTH house families already exist
(49 AP + 42 CLEP unified titles), so the whole pass is retarget-to-existing-
family (the Session-101 doctrine), zero new credentials minted.

Built `kb/_preseed_unclassified.py`: cleanup (score bands, policy notes
`(after FA15)`/`(prior F11)`, the `(BIOSCI 101)`/`(MATH-100)` local-course
parenthetical trap, footnote stars/brackets, nbsp/newline/tab collapse) →
normalized match key (stopwords of/the/to dropped; US≡U.S.≡United States;
2-D≡2D; intro≡introductory≡introduction; abbrevs civ/princ./devel./lit/trig/
macroecon; `Level 2`≡`Level II`≡the lowercase-`ll` typo; glued footnote digits
`German1`) → a match LADDER (exact → alias → insert-"Language" for CLEP
language shorthands → era-subtitle truncation after the roman numeral, e.g.
"…II: 1648 to Present"). **Twin hazard found in hand-review:** exact-tier rows
anchored one twin ("CLEP Spanish with Writing Level II") while key-tier rows
picked the other — fixed by boosting twin-pick weight with the run's own
exact hits, so every same-exam raw converges on one target (passed-over twins
receipted). NEVER-INVENT is structural: only existing families can be targets;
residuals report as `ambiguous` (3 "Levels 1 and 2 — Complete both" spans) or
`no_match` (2 "Level III" rows with no house family) for Sam.

**Applied to Supabase via MCP** (`kb_curation` `_UNCLASSIFIED::` rows,
reviewer `preseed-v1@bot` — the automerge-v1@bot cohort pattern; on-conflict
DO NOTHING so a curator row always wins). Verified byte-perfect: md5 of
`course_id→value` over the live 158 title rows == the committed plan
(`kb/preseed_out/2026-07-07/plan.json`) — which caught + cleaned a real
hazard: a terminal round-trip DROPPED a non-breaking space in two French
Language raws, minting 4 garbage rows keyed to misspelled raws (deleted;
**lesson: never round-trip raw titles through a terminal display — generate
SQL from the JSON receipt and checksum the DB against the receipt after**).
Committed no-network harness `kb/_verify_preseed_rules.py` (43 checks — run
after ANY rule edit). Worklist shows 158/451 assigned immediately; the daily
cron folds them tomorrow (Sam's review window: ✕ un-assign anything wrong
before 06:17 UTC).

### State / next
- Sam's queue: 451 → ~288 truly-manual rows (mostly high-school articulation
  course-as-exhibit rows, contractor licenses C-##, CA state certs — the next
  pre-seed candidates are NOT obvious brand families; per-row judgment).
- 5 residuals from this pass for Sam: 3× "CLEP <lang> (Levels 1 and 2) —
  Complete both" (spans two house credentials) + CLEP French/German Level III
  (no house family — new credential or fold into Level II? Sam's call).
- Pre-existing twin families surfaced by the receipts (fold candidates, NOT
  urgent): AP U.S./United States Government and Politics + History; AP
  Physics 1 / AP Physics 1: Algebra-Based; CLEP Precalculus / Pre-Calculus;
  CLEP Spanish with Writing {I,II} / {Level I,Level II}.
- MOC→COS bridge (`kb/moc_cos_bridge.json`) still the queued build; then
  `--apply-issuers` dry-run + the 22 ambiguous COS matches.

### 2026-07-07 (continued 6) — Session 103 (Bruh SkyWay): STAGED pre-seed lanes + the triage toggle + issuer authority sources

Sam's evening asks, all shipped: *"look at what I've recently saved … do more
pre-seeding … For pre-seeded items, leave them ready to save but not yet
saved … shouldn't we have a toggle [for] just the ones needing to be triaged?
… speed all the credit by exam still in the hopper — preseed the titles using
your judgment and the issuing agency CCC."*

**Queue math at build time:** 451 queue rows; ~181 live-assigned (Sam hand-
triaged ~90 more today on top of the 158 Session-102 pre-seeds — he was saving
WHILE this session ran); **163 STAGED** by the new lanes; ~107 residual.

**What shipped:**

1. **Staged lanes in `kb/_preseed_unclassified.py` (`--stage`)** → the
   committed `kb/unclassified_preseed.json`. Zero Supabase writes — proposal ≠
   assignment (Rule 5e in the skill). Lanes: `cx` (31 — mechanism + course
   code stripped, issuer CCC per Rule 5c), `hs` (73 — high-school/ROP
   articulation rows; school names / IS-codes / section + Honors riders
   stripped; same-code variants converge, existing family outranks the modal
   pick, converged rows capped at 0.65), `journeyman` (13 — Sam's verbatim
   "Journeyman Certificate- Apprenticeship Carpentry, <trade>" family +
   `Southwest Carpenter And Affiliated Trade J.A.T.C.`), `carpenters` (10 —
   Cabrillo bare trades → "Carpenters Apprenticeship — <Trade>" + CTCNC),
   `ironworker` (16 — Locals 416/433 period ladders, issuer blank per Sam's
   IW-* precedent), `nccer` (13 — NCCER naming verbatim, issuer `NCCER`),
   `single` (7 authored judgment rows incl. the COCI-resolved code-only Cx:
   WATER 140 → "Water Distribution Operator I", ART 125B → "Intermediate
   Drawing", both College of the Canyons).
2. **Worklist toggle + prefill (`credential_reference.js`)** — "Needs triage
   (N) / All (M)" chips (default hides saved rows); staged rows prefill both
   inputs with an ⚡ badge (lane + confidence + note); a confirm-gated
   **"💾 Save all pre-filled shown"** bulk button reads the VISIBLE inputs
   (what-you-see-is-what-saves — a hand-edit wins over the staged value). A
   live assignment always beats a stale preseed; missing file = soft no-op.
   Tests: `tests/cer_worklist_preseed.test.js` (29); harness grown to
   `kb/_verify_preseed_rules.py` (73).
3. **Issuer authority sources noted for future exhibits** (Sam supplied the
   links; both 403-block the sandbox — WebSearch-verified instead):
   **DIR DAS** occupation detail `results_aigdetail.asp?varOccId=2180`
   (Carpenter) → the SW-JATC + CTCNC program names; **NCCER**
   nccer.org/assessments. Card: `docs/kb-notes/reference-issuing-agency-
   authority-sources.md`; skill gained Rule 5e + an "Authority sources"
   section (CSLB queued for the C-## contractor rows).

**Methodology hardening (the Session-102 lesson, applied harder):** all live
assignment VALUES used for family matching were fetched via the MCP and
**verified per-row against server-side md5 pairs** — the concat-checksum
mismatched because Sam was actively saving between queries (row-count drift,
not corruption), and the pair-wise check isolated the 2 genuinely
transit-corrupted rows (the nbsp CLEP French Language Level 1/2 raws), which
were dropped from matching but kept in the assigned set. Never trust a
terminal round-trip; verify keys AND values independently of row order.

**QA flags for Sam (surfaced, not touched — curator rows win):**
- `THEATER 280 - Musical Theater Workshop` carries issuer *"Sustainable
  Materials Management and Zero Waste in Business"* — a copy-paste slip from
  the SMM row saved seconds later; should presumably be CCC.
- `SMM 4, Sustainable Materials Management and Zero Waste in Business` has
  issuer == its own title (SMM 2 got CCC) — worth a second look.
- `kb/unified_titles.json` holds **3 mojibake families** — `Generic Credit by
  Exam â€” Saddleback College / San Diego City College / San Diego Mesa
  College` (UTF-8 em-dash read as cp1252 somewhere in an earlier fold) —
  merge/rename candidates for a cleanup pass.

**Residual shape (~107):** C-## CSLB contractor licenses (lane ready once Sam
picks the family shape), IC-* rows (unknown "Industry Certification" issuer),
fire/IFSAC/ProBoard certs, welding course-content rows, the 5 known CLEP
residuals, one-off state certs. All still listed in the staged file's
`_residual` for hand-triage.

## 2026-07-07 (continued 7) — Session 104, Bruh SkyTime: the statewide-catalog pass — 97 of the last 100 staged, college chips, multi-issuer, live-Sam batch

**Queue state re-measured** (Sam bulk-saved the Session-103 staged rows + kept
hand-triaging): 451 queue → **351 live-assigned, 100 remaining**. Both
Session-103 QA flubs (THEATER 280 / SMM 4 issuers) confirmed corrected by Sam.
Fresh receipts written (`kb/preseed_out/2026-07-07/live_values.json` — 580
titles; `assigned_md5.txt` — the `--assigned-md5` roster), delta fetched with
per-row md5 pairs (0 mismatches — the Session-103 method held).

**The statewide-catalog + family lanes (Sam: "use the MAP statewide CRs to
match some of the exhibits … IC-Welding Level I … take another pre-seed pass
to get all possible populated"):** `statewide_data.js` (committed daily)
carries EVERY exhibit's `issuing_agency` + `cpl_type` + `raw_titles` — the 133
`CCC Collaborative` records ARE the map.rccd.edu/statewidecpl catalog, NCCER
Welding Levels 1–4 present with the NCCER issuer. All 100 remaining rows
resolved in it. Five new STAGED lanes in `kb/_preseed_unclassified.py`
(Rule 5e — zero Supabase writes):

- **statewide/family match** (`stage_family` + `build_stage_indexes`): a
  decoration-strip ladder (mojibake `_demoji`, `Certification:` lead,
  acronym-echo `(CNA)`/`(FF1)`/`(MOS)` parens, IFSAC/Pro Board accreditor
  parens → captured as the ISSUER, trailing `Certification` tokens,
  `fire fighter`≡`firefighter`) + `stage_key` matching against the statewide
  roster ∪ all 1,982 house families ∪ live values; issuers from the roster ∪
  `kb/credentials.json` (best-confidence record). Brand-stripped statewide
  aliases (`NCCER Welding Level 1` + issuer `…(NCCER)` ⇒ key `welding level i`)
  are what bridge Sam's IC-Welding example.
- **`stage_ic`**: `IC-<content>` → statewide (NCCER welding, 0.85) → family →
  title-only proposal (the MSJC automotive ladder, issuer blank + ASE-EF note).
- **`stage_cslb`**: C-##/Class A/B/B-2 kept VERBATIM (Rule 8b — the
  classification code is identity) + issuer `Contractors State License Board
  (CSLB)`; 1-2-digit guard so wildland C-190/C-290 bundles are never claimed.
- **`stage_cx_type`**: the big unlock — rows whose MAP **CPL Type** is Credit
  By Exam / Portfolio Review but whose TITLE carries no mechanism phrase (the
  Mt. SAC/Santa Ana/Cabrillo batch, ~37 rows) — the S103 cx lane triggered on
  phrases and never saw them. Title = the content verbatim (4 receipted typo
  fixes: Combinded/Introduciton/Programing/Principals), issuer CCC.
- **24 new JUDGMENT_SINGLES** (each receipted): the fire ladder
  (Fire Company Officer 3 ambiguity flagged, Fire Inspector II parallel to the
  Fire Inspector I family, Fire Control 4A house shape, NWCG S-190/S-339,
  NIMS ICT3), CPA→CBA (self-declared in the raw), SWRCB D2–D5 OR-span,
  BioTC, FCC GROL (the A+-Prep precedent), MOS Excel/Word OR-spans (the
  'ASE C1 or G1' statewide shape), ECSI (names the body, not a credential),
  Emergency Management Experience LD/UD, Clinical Embalming, the
  Industry-Credentials-for-X suspect pattern, Discipline Exam ADM JUS 001 →
  the COCI title, ICC for the CA Building/Residential Code certs, CLEP
  French/German Level III ladder extensions.

**Result: 97 of 100 staged** (`kb/unclassified_preseed.json` regenerated —
by lane: cx 37 · single 24 · statewide 10 · family 12 · cslb 11 · ic 3);
**residual = 3** (the genuinely ambiguous CLEP "Levels 1 and 2 — Complete
both" spans). Fire fully covered per Sam's "hopefully all the Fire can be
pre-seeded". Harness grown 76 → **100 checks** (v3 lane fixtures, hermetic —
no statewide_data.js dependency).

**Originating-college chips (Sam: "knowing their local title could help
determine the common course title"):** the college was dropped at exactly one
place — `kb/_audit_exhibits.py:_load_map_raw_titles()` read only the Exhibit
Title column. It now also collects the **College** column (originating college
— institutional data, no PII) and stamps `colleges` on every unclassified
card; `credential_reference.js` renders them as chips in the raw-title cell
(short name via `cplCollegeShort`, full name in the tooltip; soft-absent on
pre-104 snapshots). Data lands when the auditor next runs with a CustomReport
(post-merge dispatch). Tests: `tests/cer_worklist_college_chip.test.js` (7).

**CCR⇄CER crossover (Sam ask #4):** the Rule 5c wire already existed
(`kb/_suggest_unclassified.py` → 💡 chips) but covered only 19/451 —
**mechanism-strip before code parsing** (reusing the preseed `_CX_*` patterns)
doubled it to 39, and the new college stamps enable **college-scoped
`(College, SUBJ, NUM)` COCI joins** (unique where the global key is ambiguous
— the membership-join hazard, now bypassed at the source). Full analysis +
ranked next integrations: `docs/kb-notes/cer-ccr-crossover-integrations.md`.

**Multi-issuer (Sam live: "Some, like Fire, might have multiple issuing
agencies"):** audited the fold — **the assigned issuer was silently DROPPED
whenever the target title already had any credential record** ("existing =
authoritative"; the Fire Inspector I case would lose IFSAC/Pro Board next to
its ICC/NFPA/SFT/Cal-JAC records). `kb/_fold_unclassified.py` gained the
**`issuer_adds` lane**: append a DISTINCT issuer record (never overwrite),
deduped on normalized name + trailing-acronym + containment (the dry run
caught 'NCCER' ≈ '…(NCCER)' as a near-dupe and correctly appended only the
legitimate Construction Inspection CCC-lane second issuer); includes the SKIP
lane so an issuer added to an already-classified raw still lands; receipted as
`credential_issuer_adds`. The generator now bakes an `issuers[]` array (>1
only) and the CER renders a **"+N" chip** listing all certifying bodies.

**The 10-Key case (Sam live):** the main-tab ✎ Curate panel ALREADY had an
Issuing-agency field — but it was a display-only override (never reached
`credentials.json`), invisible at the point of need, and the table only showed
`creds[0]`. Three fixes: a **"＋ set" affordance** on every null-issuer cell
(signed-in; opens the row's Curate panel), **Mode A2 in
`kb/_apply_credential_review.py`** (promotes `issuing_agency_override` into
credentials.json — fill a null unreviewed-machine first record, else append a
distinct record; the 10-Key record is exactly the null-machine case, so Sam's
"Proctored Testing Center" will land canonically on the next cron), and the
"+N" chip above. Doctrine note for Sam: 10-Key is typed Credit By Exam — the
house Rule 5c.3 issuer would be `California Community Colleges`; his
"Proctored Testing Center" reasoning (Cal HR 5-minute proctored requirement,
no single certifier) is a legitimate curator call either way — the field is
his.

**Expand/collapse orphan bug (Sam live): NOT REPRODUCED.** An exhaustive jsdom
hunt (committed payload + real cos_matches, signed-in, caret expand/collapse,
Curate-open, ＋set, ALL 1,982 rows expanded) found no throw and no row loss.
Open QA item — needs Sam's state (search/filter/sort active? console error?
did a refresh fix it?). Tracked in the handoff.

**Ops for next session:** post-merge `workflow_dispatch` of
daily-dashboard.yml publishes the college stamps + regenerated suggestions +
the credential_reference bake with `issuers[]`; `kb/unclassified_preseed.json`
is committed in the PR itself (not a cron artifact).

## 2026-07-08 — continued 8 (Session 105, SkyClose): the truncated-read bug, the missing-issuer lane, and the glass pass

**The "didn't save" mystery — one bug, three symptoms.** Sam reported (a) a
set of hand-completed fire certs that "did not save" via Save All, (b) "113
show on the list even though they've been saved", and (c) the 10-Key "＋ set
doesn't work". Root cause for (a)+(b): **PostgREST caps every response at
1,000 rows and returns them in ARBITRARY order** — the worklist overlay had
grown to **1,200 `_UNCLASSIFIED::` rows**, so each unpaginated
`fetchUnclassOverlay()` silently dropped a *different* ~200-row tail and
already-saved assignments rendered as "needs triage". The fire certs HAD
saved. Fix: `fetchAllRows()` — Range-header pagination over a stable
`order=course_id.asc,field.asc` until a short page — wired into BOTH overlay
fetchers (the `_CREDENTIAL_REVIEW::` one would have hit the same wall the
moment the new issuer lane started writing hundreds of overrides).
`tests/cer_overlay_pagination.test.js` pins it with a 1,200-row fixture.
Durable pattern: `docs/kb-notes/methodology-paginate-postgrest-reads.md`.

**(c) was real and worse than it looked:** the `_CREDENTIAL_REVIEW::`
namespace held **ZERO rows** — Sam's Session-104 "Proctored Testing Center"
save never landed anywhere (Supabase 0, overlay `count: 0`, credentials.json
still null), even though the whole path passes in jsdom. Production cause
unrecoverable (most likely an auth-window blip during his 4-hour triage);
response: made the path *observable and direct* — "＋ set" now jumps STRAIGHT
into the Curate panel's issuer edit input (previously a click with the panel
already open did nothing = "the + doesn't work"), edit-mode scrollIntoView +
focus, and his 10-Key pick was seeded server-side
(`session105-skyclose@bot`) so Mode A2 folds it canonically on the next cron.

**Save-All contract corrected:** the old bulk read only `.cr-wl-preseeded`
rows, silently skipping hand-completed ones — exactly Sam's fire-cert
workflow. Now **"Save all filled shown"** saves every shown, still-unassigned
row with a filled title (what-you-see-is-what-saves), failures mark the row
`⚠ cr-wl-save-failed` + flip its button to *retry* (a partial batch can never
pass silently), typed-but-unsaved input survives re-renders via
`state.wlDraft`, and a newly typed issuer lands in the datalists immediately
(`addIssuerOption`) — Sam's "the list should update dynamically".

**The missing-issuer triage lane (Sam: "exhibits that don't have an issuing
agency [should] pop on the Triage list"):** the worklist gained a second
section over the **1,130 null-issuer classified credentials** (own
`cr-ni-table`/`cr-ni-row` classes so the two lanes never mix). Saves write
the standard `issuing_agency_override` → Mode A2 promotes into
credentials.json; **an empty-box Save is the explicit "no formal issuer
(local exhibit)" verdict** (button relabels to *Save "no issuer"*).
`kb/_preseed_null_issuers.py` staged **978 of 1,130** into
`kb/issuer_preseed.json` (cx→CCC 749 · course-as-exhibit "" 169 · family 31
receipted · local-hs "" 29; **residual 152** = apprenticeship-articulation
rows held for DIR DAS confirmation per the Ironworkers precedent + Military/
Standardized-Assessment judgment calls). The family lane was tightened twice
during authoring — single-token anchors only for brand-shaped tokens, bigrams
need ≥2 corroborating siblings — after "Child…"→CDA-council and
"Database…"→ACE over-reaches surfaced in the receipt. Verifier:
`kb/_verify_issuer_preseed.py` (19 checks). Bulk save in the lane saves
filled rows + only the ""-STAGED empties (mass no-issuer needs staged
intent). ⚠ el() allowlist gotcha rediscovered: a new `data-*` attribute must
be added to the builder's fixed-name list or it silently never renders
(`data-ut` cost an hour).

**The glass/light pass (Sam: "no black headers or chips; dark headers → dark
CO blue" + "the triage form is nicer than the main CER" + "rows are too
tall"):** `--navy-primary` remaps to INK (#1C1C1A) since the retheme, so
every `background:var(--navy-primary)` header rendered black — swapped to
`var(--seal-blue)` (#002F6D) across both HTMLs (CER/CCR/CSR table th, export/
action buttons, toasts, kbcs chrome, hamburger, Element-Map button), the
generator's budget-table header row, and the injected CSS of cpl_news/
map_users/sierra_training/tmc_builder (the funding tab's Session-3 precedent,
now COBI-wide). The **Curate panel's black label boxes** were the main
table's sticky `th` rule bleeding into the panel's `<th>` labels
(`.cr-table th` background + slate text = black-on-black) — neutralized via
higher-specificity injected CSS. Row height: `.cr-title-cell` max-width:32ch
lifted (min-width:30ch), title chips forced onto ONE hidden-scrollbar row,
td padding tightened. Suite: **142 files green** (2 new; preseed test
rewritten to the new bulk contract).

## 2026-07-08 — continued 9 (Session 106, SkySeal): Rule 5f — the school IS the agency, and the issuer lane grows title editing + context

**Sam's four asks (verbatim intent):** (1) edit the pre-seeded exhibit title
IN Triage — "quite a lot of trouble" to flip to the main CER, search, and
Curate; (2) see the original (raw) title and originating college in Triage so
the process completes in one place; (3) a standing rule for HS-course
Cx exhibits: strip the school from the title, make it the ISSUING agency —
and generalize to any HS / noncredit / ROP / adult-school course earning
credit via Cx or portfolio, with issuer and training agency **defaulting to
the same school**; (4) re-run the pre-seed over all such rows.

**Rule 5f codified** (SKILL.md, after Rule 5e): strip the trainer from the
title (the course/pathway remains — `AB MILLER HIGH SCHOOL- Business and
Finance` → `Business and Finance`), school = issuer = trainer by default, an
EXISTING real issuer (PLTW via an ROP) is never overwritten (school stays
trainer-only), Rule 5c's issuer-CCC line now yields to 5f whenever a school
is identifiable, and two schools entering the same course = ONE title with
issuer as the discriminator (Rule 4 multi-issuer shape). **Per-credential
grain caution baked into the rule:** a unified identity whose raw variants
span SEVERAL schools (EMT-405: Fontana HS + Kaiser HS + Baldy View ROP +
Learn 4 Life) takes NO single-school default — the first-draft extractor
"found" Fontana because it could only parse 2 of the 9 variants, a
partial-signal trap now guarded by the unanimity check (`school_of()`:
every variant must name the SAME school, else raw-conflict/raw-partial →
no default).

**The pre-seed redo (ask 4):** `kb/_preseed_null_issuers.py` rewritten to
plan schema v2 — entries may stage `title` + `trainer` beside `issuer`;
`issuer: null` = "don't touch the issuer" (the `resurface: true` cohort:
issuer-carrying rows surfaced for title/trainer cleanup only). The
Session-105 `local-hs` ""-verdict lane is RETIRED — its rows now stage the
school. Run: **989 staged** over the 1,129-row null-issuer queue —
local-trainer **74** (59 school-as-issuer+trainer, 51 title strips, 3
resurface) · cx→CCC 717 (now explicitly "no local trainer identifiable") ·
course-as-exhibit "" 167 · family 31 · residual 143. Title derivation strips
decoration from the EXISTING unified title (safer than re-parsing raws);
school extraction precedence trainer-field > unanimous-raw-parse >
title-decoration; "HS" counts only after a proper noun and never before a
digit (`Basic Arrhythmias HS 081 Cx` — Health Science, not a school).
Verifier rewritten: `kb/_verify_issuer_preseed.py` (25 checks, incl. the
issuer==trainer invariant and never-rewrite-a-real-issuer).

**The issuer lane grows up (asks 1+2, credential_reference.js):** each
`cr-ni-row` now carries an editable **unified-title input** (prefilled staged
title > current display; saves `unified_title_override` — display-only until
PR-5b), the **raw college-entered title(s)** (mono `cr-ni-rawline`), and
**originating-college chips** (auditor-stamped per raw title — classified
`title_cards` now carry `colleges` too, populating at the next auditor run
with the PII-purged CustomReport; falls back to articulation-derived earning
colleges meanwhile). One Save writes up to three overrides
(title/issuer/trainer — `laneJobsFor()`); the staged trainer FOLLOWS an
issuer edit when the plan staged them the same ("both default the same");
a resurface row's Save never writes an issuer unless Sam actually changed
it; bulk save inherits all of it and reports per-kind counts in its confirm
(empty issuers still bulk-save ONLY when ""-staged). `issuerQueue()` widened
with a convergence rule: a resurface row leaves the lane once its staged
title/trainer match reality or an override lands.

**Canonical promotion:** Mode A2 (issuer) already existed; added **Mode A3 —
trainer promotion** to `kb/_apply_credential_review.py`: fill
`training_agency` when null on the first record, never overwrite, receipted
in the run report. Title renames stay recorded-not-applied (Mode B) — the
CER shows the display rename; the real KB re-key remains PR-5b with the
re-mint playbook. Display-title duplicates across schools ("Business and
Finance" ×2 with different issuers) are the intended Rule-4 interim shape
until that re-key merges them.

**Suite: 142 files green** (`cer_issuer_lane.test.js` rewritten — 38
assertions covering title-edit save, the three-override write, the
resurface never-rewrite guard, raw/college context, and the widened queue).

## 2026-07-08 — continued 10 (Session 106, SkySeal): Rule 5c mechanized — the pre-seed now stages student-searchable TITLES

Sam, poking the new Triage equipment: "We are doing this work to make it as
easy and simple as possible for prospective students to find CPL that matches
their experience" — so the cx-lane pre-seeds should stage TITLES too, per the
Rule 5c course-identity precedence (C-ID/CCN/common-COCI title FIRST; M-IDs
still excluded — "many MIDs are not merged with common titles yet"). His four
worked examples became the spec: discipline-prefix strip ("Administration of
Justice — Community Relations" → "Community Relations"), the Lemoore HS row
validated Rule 5f, and the East-LA code rows ("Administration of Justice 049",
raw "ADM JUS 049") demanded a COCI lookup → local title or aligned C-ID/CCN.

**Built as `enrich_titles()` in `kb/_preseed_null_issuers.py`, REUSING the
`_suggest_unclassified.py` machinery** (one definition of `build_coci_index` /
`parse_course_refs` / the title-sanity guard — the two scripts can't drift):

- **COCI code lookup, college-scoped**: parse the local course code from the
  raw variant, join `(College, SUBJ, NUM)` via the row's ARTICULATING colleges
  (for a local Cx exhibit the articulating college IS whose catalog names the
  course), fall back to the global key only for unanimity-gated CCN/C-ID tiers
  or a ≥60%-dominant modal title. Tier order CCN > C-ID > local COCI title.
  SHOUTING-CASE catalog titles are title-cased (`_polish_title` — roman
  numerals + a small acronym allowlist preserved): "NARCOTICS AND VICE
  CONTROL" → "Narcotics and Vice Control".
- **Discipline-prefix strip**: `<exact MQ discipline> — <content>` sheds the
  prefix (240-name MQ vocabulary; content must carry real words; school-
  decorated content stays Rule 5f's).
- **`course-title` lane**: queue rows NO issuer lane matched (the types-none
  "Administration of Justice 102" family) still stage a title — issuer stays
  null AND the row keeps its `_residual` record (title staged; issuer still
  needs judgment). Same for 5f rows with unidentifiable schools.

Run: **131 titles staged** (111 onto existing cx/family entries + 20
course-title) — AoJ 049 → "Narcotics and Vice Control" (East LA local title),
AoJ 067 → C-ID "Community and the Justice System", AoJ 075 → C-ID
"Introduction to Corrections". Verifier grew to **32 checks** (arithmetic
redefined: issuer-STAGING entries + residual == queue; titled entries cite
their rule; staged title ≠ current display; Sam's example spot-anchors).
ZERO client changes needed — the Session-106 lane UI already prefills
`ps.title` and saves the override.

**Gotcha for future sandbox runs:** `build_coci_index()` needs `openpyxl`,
absent in a fresh sandbox — and `load_title_authorities()` deliberately
soft-fails, so a missing module silently yields 7 titles instead of 131
(`pip install openpyxl` first; the count line "Rule 5c titles staged: N" is
the tell). SKILL.md Rule 5c now carries the discipline-prefix + code-lookup
items and the mechanization note.

**Continued-10 addendum (same day):** Sam's CCSF screenshot exposed two
lookup blind spots, both fixed: (1) discipline-NAME-led course codes —
"Administration of Justice 68 (CCSF)" spells the subject as the full
discipline name while CCSF's COCI subject is ADMJ; `name_led_refs()` resolves
the name → candidate codes via the inverse `subject_discipline_map.json`
(99 disciplines → 309 codes) and accepts only an EXACTLY-ONE (code, college)
scoped resolution — ADMJ 68 → "Criminal Justice Report Writing", ADMJ 72 →
"Police Work Experience", ADMJ 85 → "P.C. 832 Arrest and Control
Certification", CS 111B → "Programming Fundamentals: Java". (2) The title
gate now includes `suspect_course_as_exhibit`-flagged rows regardless of CPL
type (rows 68/85 are IC-typed courses-as-exhibits). Titles staged 131 → 171.

**Continued-10 addendum 2 (same day):** two more live-triage rulings from Sam.
(1) **The apprenticeship lane** — Norco/Santiago Canyon apprenticeship exhibits
strip the college/program decoration from the title and prefill the DIR-DAS-
registered sponsor as issuer AND trainer: carpentry (the regional default) →
"Southwest Carpenter And Affiliated Trade J.A.T.C." (DAS occId=82, the existing
house spelling), electrician → "Riverside Area Electrical J. A. C." (occId=490).
Best-option-by-region prefills at 0.6 confidence (Sam: "the search … is not
exact, so prepopulating with best option is good for now"). ⚠ "IBEW" alone is
NOT an electrical signal — the Norco "IBEW/Carpenters Articulation" rows are
carpentry (the 2026-05-20 curated correction); electrical routes only on an
electric token with no carpentry token. 6 Norco rows staged; the residual
apprenticeship family at OTHER colleges stays DIR-pending. The 6 IBEW
Electrician rows already carry a generic IBEW issuer — the never-overwrite
guard leaves them; re-pointing them to the Riverside JAC is a curator call.
(2) **The Modesto ENGL 102 verification** — Sam expected a C-ID/CCN title on
"Advanced Composition and Introduction to Literature"; the lookup HAD staged
exactly that (C-ID ENGL 120 "Introduction to Literature", unanimous across all
4 colleges teaching ENGL 102; the AB-1111 CCN ENGL C1002 carries the SAME
title — our COCI extract is stale-mid-CCN so the C-ID tier caught it). His
screenshot predated the #691 Pages deploy, so the input wasn't yet prefilled
and he hand-saved "Introduction to Literature and Composition" — a title that
matches neither authority; flagged for his re-title call.

**Continued-10 addendum 3 (same day):** Sam found the statewide **CA
Apprenticeship Completion Dashboard** (Tableau Public — all registered CA
apprenticeship programs). Recorded in
`docs/kb-notes/reference-issuing-agency-authority-sources.md` under the DIR DAS
section. It's a statistics surface, **not yet a sponsor resolver**: it carries
no CCC-affiliation field (the join we need for the ~143 DIR-pending
apprenticeship residuals), and Tableau Public is JS-rendered so bulk use would
need runner-as-proxy or a manual export. Sam is still searching for a source
with the college affiliation; until then the per-occupation
`results_aigdetail` pages + region matching remain the path.

## 2026-07-08 — continued 11 (SkySeal): Rule 5g title styling + the unresponsive-Save trap + the welding statewide-agency lane

Three live-triage items from Sam, one wave:

**Rule 5g (SKILL.md).** Students browse the CER by SUBJECT, so a leading level
word buries it. Every staged/saved unified title: leading
Beginning/Intermediate/Advanced moves to the END ("Advanced Floral Design" →
"Floral Design Advanced"); "Introduction…" titles stay as-is; the abbreviation
"Intro" expands to "Introduction" (word-boundary — Introduction/Introductory
untouched). **Official proper names are exempt** (`_LEVEL_KEEP`): Advanced
Placement, Advanced EMT (NREMT level), Advanced Cardiac/Cardiovascular Life
Support — Rule 8b outranks 5g. Mechanized as `restyle_title()` + a LAST
`restyle_pass()` in `kb/_preseed_null_issuers.py` (restyles every staged
title including 5c/DAS ones — the authority receipt stays in the note; stages
`title-style` entries for triage rows the rule alone changes). **68 restyles**
this run. Pitfall found + guarded: gating new stagings on
`restyle_title(display) != display` — without it, `_polish_title`'s SHOUTING
detector staged a junk case-tweak ("ESL 108C" → "ESL 108c"). Scope: the triage
cohort only — already-issuered rows are never mass-resurfaced for styling.

**The unresponsive firearms Save = the save→re-edit trap.** The lane's
`applySavedLane` disables the button ("✓ Saved") but the INPUTS stay live;
`syncLabel()` on the next keystroke relabeled the still-disabled button back
to "Save" — a dead, slightly-faded button (`.cr-wl-save:disabled{opacity:.6}`
— the "light blue Save" in Sam's screenshot; Desserts had it too). Fix:
`noteDraft()` RE-ARMS the button on any edit of a saved row (re-enable, drop
`niSaved`, leave the done state) unless a save is mid-flight (`data-busy`
guards the in-flight window). jsdom repro confirmed the base flow was sound —
the trap needed save-then-re-edit in one page session. Regression:
`tests/cer_issuer_lane.test.js` "re-edit trap" block (43 assertions total).

**The welding statewide-agency lane.** The 5 welding-process Cx rows
(GTAW ×2 / GMAW / SMAW / FCAW) are statewide exhibits whose statewide record
carries a BLANK issuer — circular: `statewide_data.js` issuers come from
`kb/credentials.json`, i.e. from this very queue. Sam: the agency is the
American Welding Society (the Faculty Collaborative PDF's AGENCY row —
"America Welding Society" is a source typo; house canonical **"American
Welding Society (AWS)"** per Rule 6 + the AWS D1.x family). New curated
`STATEWIDE_BLANK_ISSUERS` rules + `load_statewide_blank_titles()` — the gate
is presence in the statewide DATASET with a blank issuer, **any collaborative
type** (MAP types the FCAW record "Local" while its process siblings are CCC
Collaborative — the label is not the gate). 5 rows staged via
`statewide-agency` at 0.75. NOTE for Sam: his hand-saved welding issuer
"American Welding Society" (no parenthetical) differs from the house
"American Welding Society (AWS)" family — worth aligning on one spelling.

Verifier now 46 checks; suite 142 files green.

**Continued-11 addendum (same day):** two more asks. (1) **The FAA
cert-family lane** — the aircraft/airframe/powerplant Cx rows ARE the course
side of the FAA certification family: the queue's 22 aviation rows (Part-147
AMT curriculum at Chaffey, the 14-course Reedley FLGHT flight-training
ladder, pilot ground school, drone-pilot Cx) sit beside an EXISTING 12-record
"Federal Aviation Administration (FAA)" house family (Mechanic A&P/Airframe/
Powerplant, pilot certs, CFI/CFII, Part-107 Remote Pilot). New generic
`CERT_FAMILIES` lane (the welding/AWS precedent, runs before cx): pattern →
certifying body; FAA staged on all 22 at 0.7. Precision guard: `drone pilot`
never bare `drone` — "Drone Photography" is a photography course (negative
spot check pins it). FAA added to the authority-sources KB note + SKILL.
Bonus: Rule 5c had already resolved several opaque FLGHT codes to real COCI
titles ("Remote Pilot Ground School for sUAS"). (2) **The "＋ add issuing
agency" affordance** — Rule 4 multi-issuer straight from Triage: a ＋ link
under the issuer input reveals a second input that saves to the NEW
`issuing_agency_additional_override` field (its own kb_curation row, so it
never clobbers the primary override), and `_apply_credential_review.py`
Mode A2 promotes BOTH fields with the same fill-or-append / never-overwrite
semantics — the second agency lands as its own credential record in
kb/credentials.json on the daily sync. Empty second input = unused; clearing
a recorded one writes "" (recorded, never promoted). Tests: the multi-issuer
block in `tests/cer_issuer_lane.test.js` (46 assertions). Verifier 50 checks.

**Session 106 close-out (Rule 8 checkpoint, 2026-07-08 evening).** The session's
full arc: six merged PRs (#690–#695) turned Sam's live triage feedback into
three codified rules (5f school-as-agency · 5c title mechanization with the
CCSF name-led extension · 5g level-to-end styling), four new pre-seed lanes
(apprenticeship / statewide-agency / cert-family / title-style), the
save→re-edit dead-button fix (KB note:
`methodology-rearm-disabled-save-on-edit.md`), and the ＋ add-issuing-agency
multi-issuer affordance (new `issuing_agency_additional_override` field; Mode
A2 promotes both issuer fields additively). Working rhythm that made it work:
Sam triages live on the deployed page → screenshots + rulings arrive →
mechanize the ruling as a rule + lane + verifier checks + jsdom test → merge on
green → Pages deploy → he continues on fresher prefills, usually within the
hour. Plan state at close: 1,009 of the 1,125-row null-issuer queue staged,
284 titles, 152 residual; verifier 50 checks; suite 142 files.

## 2026-07-08 — continued 12 (Session 107, SkyKey): the PR-5b re-key goes LIVE — 49 renames applied + the confirm-merge lane

The handoff named this session "the one that turns the recorded renames into
the PR-5b re-key," and that is exactly what happened — plus the collision case
PR-5b/2 had been deferred for finally materialized, six times at once.

**The state at pickup.** Sam saved **137 overrides** during/after Session 106
(72 issuers · 55 titles · 8 trainers · 2 uses of the brand-new ＋
additional-issuer — both `CalCERTS, Inc.`, a new-to-the-vocabulary HERS
certification body), ALL after the day's last cron bake. A dispatched
daily-dashboard run folded them (Modes A2/A3 promoted the agencies), and the
refreshed PR-5b/0 dry-run projected the batch: **49 clean renames + 6
collisions**, apply_safe=false.

**The blanket hold (#697).** `apply_safe` carried a `not collisions` term, so
Sam's 6 deliberate merge-shaped retitles (AoJ code rows → C-ID-anchored titles
that already exist as credential keys) held the other 49 renames hostage —
contradicting collisions.json's own "decision queue" policy text. Fixed:
queued collisions no longer gate the clean set (safe by construction — a
collision source always exists as a credentials key, a clean target never
does, so the sets are disjoint). Same PR: the Supabase-apply pre-fetch got
Range pagination (the Session-105 PostgREST 1,000-row lesson, applied
server-side before it bit — the slice is at 138 rows).

**The first production rename apply (PR-5b/1, run #1).** Dispatched
`cred-rename-apply.yml` → **49 renames landed**: credentials.json re-keyed,
2,000+ unified_titles values + articulations rewritten, V1–V4 gates passed,
Supabase row migration **106 ops / 0 failures** (fulfilled override rows
deleted; issuer/trainer/marker rows re-keyed to the new identities). Receipts:
`kb/cred_rename_out/2026-07-08/{alias_map.json, validation.md, supabase_log.json}`.
The batch had been semantically reviewed first: overwhelmingly Rule-5g
restyles + Rule-5c code→title lookups + school/decoration strips; "Mach Tool"
turned out to be the college's own raw truncation (kept faithfully), the
Desserts rename has no near-dup target. Watch item: five early Norco carpentry
saves kept a leading "Advanced" (saved before 5g deployed) — restylable in a
later batch.

**PR-5b/2 ships the day a curator hit it (#698).** The deferred confirm-merge
lane, end to end: the issuer lane's Save now DETECTS a typed title that
exactly matches a different credential's key and asks the curator to confirm;
accepting writes the new **`unified_title_merge_confirm`** kb_curation field
(the additional-issuer pattern — its own row, names the EXACT target) beside
the rename override. A **pending-merges strip** at the top of the triage
worklist surfaces already-saved colliding renames (Sam's six) with ✓ Confirm
merge / re-title-instead (a re-title clears a stale confirm). Pipeline: the
dry-run graduates a confirmed collision into the alias map's `merges` section
(stale confirms + chain hazards — target itself retitled in-batch — stay
queued); the apply **folds** the old title's records into the existing key
(dedupe on normalized issuer+trainer, count gate, target-drift abort) and
re-keys raws + articulations via the combined renames∪merges map (the V4
cardinality formula is additive-correct for merges); the Supabase migration
deletes the fulfilled decision rows and yields to the target's own curator
data on field conflicts. Tests: `tests/cer_merge_confirm.test.js` (17) + a
python fixture exercise (15 checks incl. idempotent re-run); suite 143 files.
KB note: `docs/kb-notes/methodology-confirmed-merge-via-decision-row.md`.

**Sam's three watched rulings, resolved or framed:**
1. **Modesto ENGL 102** — his save "Introduction to Literature and
   Composition" (matching neither the C-ID ENGL 120 nor CCN C1002 title,
   both "Introduction to Literature") STOOD and was applied in the 49. His
   curator save wins; re-titling later is one lane edit.
2. **AWS spelling** — he saved "American Welding Society" (no parenthetical)
   again on Advanced GTAW; the house family holds 13 records as "American
   Welding Society (AWS)". 13-vs-1 → recommend aligning the one row, his call.
   Same shape: 2 saves of "Occupational Safety and Health Administration
   (OSHA)" vs the 9-record house "U.S. Occupational Safety and Health
   Administration (OSHA)".
3. **IBEW Electrician re-point** — NOT done; the 6 rows keep the generic IBEW
   issuer + JATC trainer (never-overwrite holds). Still his call.

**Working note:** Sam was saving live THROUGH this session (5 more titles
20:11–20:18 while the apply ran) — the fold → dry-run → apply loop coexisted
with live triage cleanly because every step re-reads fresh state and the
collision queue absorbs timing races. The pending-merges strip reached his
deployed page within the same hour, per the Session-106 rhythm.

**Continued-12 addendum (same evening — Sam's four asks, the Session-106 rhythm
again).** Sam, mid-triage: "Note that I'm working on triage as you chug away."
Four asks, four PRs within the hour (#699–#702), plus a pipeline save (#700):

1. **Unlimited ＋ agencies (#699).** The Session-106 ＋ capped at one
   additional agency. Now each click stacks another input; all extras join
   into the SAME `issuing_agency_additional_override` row " | "-delimited
   (one kb_curation row — the (course_id, field) PK stays honest), and Mode
   A2 splits + promotes each fill-or-append. Backward compatible.
2. **hs-generic lane (#702).** "If it refers to just high school, set agency
   to 'Local High School'" — his Astronomy save set the convention. Generic
   HS wording + no named school → the placeholder agency; a proper noun
   before "High School"/"HS" is a NAMED school and keeps 5f; trainer stays
   open. SKILL.md Rule 5f item 6.
3. **ase-align lane (#702).** Auto exhibits aligned to ONE ASE cert stage
   the ASE title + the HOUSE-canonical issuer ("National Institute for
   Automotive Service Excellence (ASE)" ×55 — Sam's message said "Automotive
   Services Excellence"; flagged, house family wins pending his word).
   Context-gated (building-trades A/C never → A7; aviation stays FAA);
   ordered-subsumption collapse (A2+A3; L3 Hybrid/EV shadows A6's bare
   "electric" — caught by eyeballing the staged rows); ambiguous
   multi-competency rows stay for judgment. 12 staged — and each staged
   title IS an existing credential key, so the Save flows through the
   brand-new PR-5b/2 confirm-merge and the exhibit FOLDS under the ASE
   credential. The machinery composed the same evening it shipped.
4. **🔎 + ✨ issuer lookup (#701).** His manual workflow ("who is the agency
   that issues an Aspects of Building and Safety certificate?" → ICC) as a
   one-click 🔎 (opens the exact question, built from the CURRENT title
   input) and an ✨ AI suggestion via the existing Custom-Report Cloudflare
   proxy (`window.CPL_REPORT_PROXY_URL`; claude-sonnet-4-5; Rule-6
   long-canonical answer as a click-to-fill chip — a recommendation, never
   auto-saved; none/unknown render honestly).

**The daily-run race (#700).** The 20:23 dispatch died: #698 merged mid-run,
push rejected, and the retry loop's rebase refused on the tree's UNSTAGED
regenerated files ("You have unstaged changes"). Fix: `git checkout -- .`
before the retry rebase — that output is disposable. The race fires whenever
a PR merges during a daily run; a session that merges 5 PRs in an evening
finds it fast.

Plan state after the fresh-bake regen: queue **1,036** · staged 922
(`ase-align 12 · hs-generic 3` + the standing lanes) · titles 236 ·
residual 140 · verifier **56 checks** · suite **145 test files**.

## 2026-07-08 — continued 13 (Session 107, SkyKey evening): the fan-in night — twins, V4, and the 409s

Sam kept saving after "Sam Out!" (187+ rows between 21:00 and 22:07, then
more), and the 22:13 self check-in found 17 merge confirms waiting. Landing
them took THREE fixes, each one layer deeper into the same phenomenon:
**fan-in** — several sources converging on one target — which the rename
pipeline had never seen before PR-5b/2 made it expressible.

1. **Run #2 (22:14) — V1 FAIL, the intra-batch twins (#704).** Sam retitled
   PAIRS of rows to the same NEW name in one batch ("C++ Programming I" +
   "II" → "C++ Programming"; Choreography I/II; CD-005 + Child Growth →
   "Child Development") — Rule-3 level convergences whose target exists
   NOWHERE yet, so the collision/merge lane can't see them, and V1's
   post-rename uniqueness check blanket-held the whole batch (the #697
   lesson, one gate over). Fix: twin-group pruning BEFORE V1 — the
   earliest-saved source (by `reviewed_at`) proceeds as a plain rename, the
   rest queue as `intra_batch_same_target` with a `first_of_group` receipt.
   After the first lands + a bake, the queued twins become ORDINARY
   collisions in the CER strip → Sam's ✓ folds them. Never inferred.
   (4 twin groups by the time run #4 ran — Critical Thinking and the
   Nursing Process I/II appeared while the fix was being written.)
2. **Run #3 (22:24) — V4 FAIL, per-source cardinality (#705).** The dry-run
   now passed (54 renames + 20 merges) but the apply's V4 articulation gate
   computed `expected = old_pre + new_pre` PER SOURCE — a confirmed-merge
   fan-in (two AoJ rows ⇒ "Community and the Justice System") makes every
   source under-expect the target's post-count. The rewrite was
   cardinality-preserving all along; only the check was wrong. Fix: group
   V4 by TARGET (`expected(new) = Σ old_pre + new_pre`). A chained mapping
   (P→Q while Q→R) still aborts — V4 stays the defensive backstop. Nothing
   landed from either failed run (fail-closed; Supabase step never reached).
3. **Run #4 (22:30) — SUCCESS with 8 Supabase 409s (#706).** 56 renames +
   23 merges applied (credentials 2101→2078 = −23 exactly; 92 articulation
   rewrites; receipts `kb/cred_rename_out/2026-07-08/`). But the row
   migration's `target_fields` was a STATIC pre-fetch snapshot: the first
   fan-in source's `issuing_agency_override` PATCH created the target row,
   and every later sibling 409'd (the 4-source ASE A6 fold + the 3-source
   Community-and-the-Justice-System fold = all 8). The workflow's
   deliberate `continue-on-error` kept the run green — correct call: the
   file-side KB is the source of truth and the log is replayable. Fix:
   LIVE target-field claims (a successful PATCH claims the field; later
   siblings supersede-DELETE) + a 409→supersede-DELETE fallback for
   mid-run curator-save drift. The 8 stranded orphan rows were verified
   (5 byte-identical to the surviving target row, 3 superseded per the
   documented target-wins rule — every value preserved in the frozen alias
   map + the folded credentials.json records) and deleted directly.

**The meta-lesson:** PR-5b/2 didn't just add a confirm row — it added a
CARDINALITY class (N→1) that every downstream per-source assumption had
been free to ignore. Three of them fell in one evening: V1's uniqueness
check, V4's count formula, and the Supabase claims set. When a pipeline
gains fan-in, audit every "for each old → new" loop for hidden
one-source-per-target assumptions.

**Receipt-dir gap (noted, not fixed):** `kb/cred_rename_out/<date>/` keys
by DATE, so run #4's receipt overwrote run #1's same-day receipt at HEAD
(both recoverable from git history — the frozen alias maps are commits).
Same-day multi-apply is clearly now a real pattern; a `<date>-runN/` or
timestamp suffix is a small future hardening.

Post-fix state: 4 twins queued for the strip; a fresh bake dispatched so
the CER reflects the re-keyed KB and surfaces them. Suite 145 green;
fixtures for both fixes live in the session scratchpad (twin pruning 15,
V4 fan-in 8/8, Supabase fan-in 10/10).

## 2026-07-08 — continued 14 (Session 108, SkyPhilo): unhelpful code-titles — COCI resolution + the 🔎/✨ title lookup (#707)

Sam, mid-triage: exhibits titled by a bare course code ("CD-005 — Lemoore
High School Articulation", "Cinema 24") made him hand-search COCI — "I just
look them up with 'CD-005 West Hills Lemoore' and it gives me the title
'Child Development'. Can you add the Suggest or what is this feature here
too? If you had a routine that could look these up in COCI and pre-seed,
that would be a bonus!" Both shipped in one PR (#707), merged while he kept
saving.

**The diagnosis — three gaps in the Session-106 5c mech, one per example:**

1. **Tight-hyphen codes never parsed.** `parse_course_refs`'s lead regex
   required whitespace between subject and number, so "CD-005" yielded ZERO
   refs — the lookup never ran. Fix: a second lead alternative for the
   `SUBJ-NUM` no-whitespace form (subject ≥2 letters; the COCI join + the
   sanity guard gate anything it over-matches). Shared parser
   (`_suggest_unclassified.py`), so the 💡 worklist suggestions inherit it
   on the next cron.
2. **Decoration poisoned the title-sanity guard.** The guard demands the
   text AFTER the code overlap the COCI title — right defense for the
   MATH-31 join hazard, but "articulation Lemoore High (FA25-SU27)" and
   "- Credit by Exam" describe the PATHWAY, not the course, so every
   decorated raw failed it. Fix: pre-strip `_MECH_TRAIL` + term parens
   ("(FA25-SU27)") from the raw, and filter pathway noise + the row's own
   college/school tokens out of the remainder before the guard.
3. **The written subject isn't always a COCI subject.** CCSF enters
   "Cinema 24"; its COCI subject is `CINE`. Fix: a college-scoped
   subject-PREFIX hop — when the written subject exists NOWHERE in COCI,
   hop to the unique subject code the row's own college teaches under
   ((CINE, 24) at CCSF); unique (code, college) resolution only, both
   subjects named in the receipt. One-directional (written ⊇ code) so a
   short written subject never fans out.

Plus the blocker that hid gap 1: **`enrich_titles` skipped any entry with a
staged title** — and Rule 5f had staged the bare residue "CD-005" as the
title after stripping the school. New carve-out: a staged title that is
still CODE-SHAPED (`_CODE_SHAPED` — subject-ish + number, no real words)
never blocks the lookup; a resolved CCN > C-ID > COCI title strictly beats
the code, receipted as "Code-shaped staged title “CD-005” upgraded…".

**The receipts (same post-fold bake as #702's regen — safe mid-triage,
prefill-only + the lane skips live-assigned rows): +6 titles, 1 upgrade, 0
regressions.** CD-005 → **"Child Growth and Development"** — the authority
ladder went ONE TIER ABOVE Sam's manual find (Lemoore's CD 5 carries C-ID
CDEV 100; descriptor title > local catalog title). Cinema 24 → **"Basic
Film Production"** (CINE 24, hop receipted). Bonus catches: Hanford West
HS-005/HS-061 (Lemoore's actual `HS` Health-Science subject!) → Medical
Terminology / Nurse Assistant Training; MUS-3 → the C-ID MUS 110 descriptor
title; CUL 003 / HUMSR-147 mech-trail unlocks.

**The in-tab affordance:** the #701 issuer-lookup pattern applied to the
TITLE column of the missing-issuer lane — 🔎 "what is this?" opens the
code-plus-college search from the CURRENT title input (`"CD-005" Lemoore
College course` — Sam's exact manual flow); ✨ suggest asks Claude via the
report proxy, click-to-fill chip into the title input (re-arms Save; never
auto-saved; honest "no confident suggestion — try 🔎" on unknown). Distinct
`cr-ni-tsearch`/`cr-ni-tsuggest`/`cr-ni-tsuggest-out` hooks — the first cut
reused `.cr-ni-suggest-out` and the title column's span SHADOWED the issuer
test's row-scoped `querySelector` (test C went 9/10). Lesson repeated:
**two instances of one affordance pattern in the same row need disjoint
class hooks, sharing style via the CSS selector list, never via a shared
class.**

Verifier +5 → **61 checks** (upgrades never leave a bare code; hop receipts
name both subjects; CD-005/Cinema-24 spot checks kept PRESENCE-CONDITIONAL
so post-fold regens — where Sam's saves drop the rows — stay green). New
`tests/cer_title_lookup.test.js` (12); suite 145 files green.

## 2026-07-09 — continued 15 (Session 108, SkyPhilo): the HS pass lands + the bulk-CCC close-out

Sam's three-part late-night ask, all landed while he kept saving:

1. **The HS rule (#710, merged).** Rule 5f learned his "**HS" heuristic —
   fused tokens (BIRMINGHAM CCHS), dotted "Santa Ana H.S.", all-caps "HIGH
   SCHOOL ARTICULATION", multi-school rows → the "Local High School"
   placeholder (schools receipted, no single trainer — the EMT-405 guard
   stands), with the critical NEGATIVE: bare `HS ###` before digits is a
   SUBJECT code (Copper Mountain's Health Science — COCI-verified), never a
   school. hs-generic lane 3 → 11 on the fresh post-fold bake.
2. **The audit answered itself.** The 17 CCC-saved rows with HS signals
   turned out to be Sam's own SPLIT pattern in action — his rename/split
   pass had already minted per-school credentials ("High School Articulation
   — Anatomy and Physiology Honors (Colton-Redlands-Yucaipa ROP)", the
   Fontana Articulated-CTE family) while the aggregates stay CCC
   deliberately. NO corrections written — correcting the aggregates would
   have FOUGHT the split pattern. Lesson: **audit against the LIVE overlay,
   not the bake** — the stale bake made handled rows look like misses. Only
   2-3 variants look possibly unsplit (Crime Scene Mgmt's Summit "Cyber
   Scene Management", Auto Electricity's Summit) — reported; splits are
   curator moves.
3. **The bulk-CCC close-out (Sam's scope pick: cx + residuals +
   no-formal-issuer; Military excluded).** 368 targets → **339 INSERTed**
   (cohort `ccc-bulk-s108@bot`, receipt `kb/ccc_bulk_out/2026-07-09/`);
   29 lost the race to Sam's own saves — ON CONFLICT DO NOTHING let his
   rows win, exactly as designed. Mode-A2 semantics checked FIRST: these
   rows have no credentials.json issuer, so the fold FILLS rec0 (the
   overwrite hazard only exists for issuer-carrying rows). The 22
   HS/agency-staged lane rows (Medical Core × 5 schools, FAA, AWS…) were
   deliberately left prefilled for his review.

Also his query ask (in #710): the 🔎 who-issues-this search drops
course-lead decoration and scopes to CA — `who is the agency that issues a
"Warehouse Management" certificate in CA?`.

**The meta-lesson:** with a curator saving live, every bulk decision needs a
LAST-SECOND live diff + conflict-yielding writes. Between my first pending
count (430) and the insert, Sam had saved another ~60 rows — three snapshots
in one hour, each staler than the last. The bake is history; kb_curation is
the present.

### continued 15 addendum — the fold receipt (Session 108 close)

The dispatched daily run + Sam's confirmed-merge apply (PR-5b/1 Mode B run)
landed within minutes: null-issuer queue **830 → 233**. The 233 are almost
entirely NEW rows minted by tonight's rename/split applies (only 1 of them
had an override in the pre-fold snapshot) — retitle residue + split-out
per-school rows awaiting agencies — and the regenerated plan stages **200**
of them (cx 155 · course-as-exhibit 20 · local-trainer 10 · family 9 ·
hs-generic 3 · statewide-agency 1 · course-title 2). Verifier note: the
Ironworker family spot check went PRESENCE-CONDITIONAL (Sam folded every
Ironworker row tonight — an unconditional spot on a triage queue is a latent
failure the moment the curator finishes; the CD-005/Cinema-24 convention is
the right default for ALL queue-anchored spots).

## 2026-10-18 — Session 412 (SkyJoshua): the procedures run and the classifier

Sam, ~02:55Z: *"I want to be able to add more procedures to have you classify and complete common exhibit
titles and elements as we go."* Built and run this session (#2217, #2218, #2219):

- **The pre-fill file had stood still since 2026-07-07** (97 of 451 then). The July lanes, run on the 1,498-title
  queue, staged 642, and read badly: "Portfolio for MUS 27" became "for MUS 27", "EMT-405 Kaiser High School"
  became "Kaiser High School", and an Army course (AR-1728-0188) converged on another as a high school code.
  **A strip rule validated on one queue misreads the next.** The cx, hs and ic lanes now only hint the
  classifier; the lanes that retarget to an existing name (family, statewide, NCCER, CSLB, the trades) settle.
- **The identity join needs the college's own words.** HIST 035 *History of African Americans* had joined C-ID
  *Western Civilization II*; an identity title must now share half its words with the raw title.
- **The classifier (cer-classify Edge Function, `claude-opus-5-5`, 15 titles a call, the skill plus every
  procedure plus the 1,986 house families, ~48,000 tokens cached):** first pass 75 calls, all answered, $8.30;
  1,116 of 1,322 waiting titles pre-filled, 428 held. Sampled 30 across bands: the sure band (606) is right
  (ASE A7, PCAP, IB History HL, AP Studio Art mapped to its renamed exam); the middle band (311) is plausible
  (Colton-Redlands-Yucaipa ROP named from "HS CE(CRYROP)"); the low band (111) is mostly code-only titles.
- **A model hands back a non-breaking space as a plain one.** 105 answers were dropped by an exact match on
  `raw_title`; answers now match on the spacing-free form and are keyed by the title as asked.
- **Code-only titles need the catalog.** "Discipline Exam - CS 119" came back "Computer Science (CS 119)";
  the college's course is Programming in Python. The run now looks the code up in COCI at the college that
  entered it and hands the title on as a hint (94 titles); a record carries its hints' fingerprint, so an
  unsure title is asked again when its hints change.
- **Rule 8's read could not see this week's memory rows**: the playbook's insert left `event_date` out (186
  rows), and the read ordered by it. Fixed in the read and the template.

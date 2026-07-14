---
name: exhibit-canonicalization
description: Use when canonicalizing CPL exhibit titles in this repo — collapsing freehand college-entered titles in MAP `View_ArticulatedMAPExhibits` data into unified credential names, identifying the issuing agency and (when distinct) the training agency. Trigger phrases include "canonicalize exhibit titles", "build unified-title mapping", "classify exhibits", and any task that updates `kb/unified_titles.json` or `kb/credentials.json`. Background context lives in `docs/exhibit_unification_vision.md`.
---

# Exhibit Canonicalization

You assign three synthetic identity fields to each raw MAP exhibit title:

| Field | What it is | Example for `MUSG 101 Music Appreciation - Portfolio Review` |
|---|---|---|
| **unified_title** | The canonical, user-facing name of the credential or experience itself, stripped of college-specific course codes, formatting noise, and CPL-mechanism phrasing | `Music Appreciation` |
| **issuing_agency** | The body that issues, awards, or governs the credential | `(none — local college exhibit)` |
| **training_agency** | The body that delivers the training, when distinct from the issuer | `(none — college course)` |

Each field gets a **confidence score** between 0.0 and 1.0.

## Decision rules

These rules resolve the cases that come up most often in CCC MAP data. When in doubt, prefer **fewer** unified titles (collapse aggressively) over splitting hairs — but never collapse across the lines drawn below.

### Rule 1 — Strip the noise

From every raw title, mentally remove:

- College course prefixes and numbers (`CMPET 315`, `(CIS) 140`, `MUSG 101`, `BIOL 109L`)
- CPL-mechanism phrasing (`Credit by Exam`, `Portfolio Review`, `Industry Certification`, `Prep`, `Certificate Prep`) — the CPL Type column already carries this
- Articulation-area suffixes (`Cal-GETC Area 2`, `(score 3-5)`, `BIOL 109 and BIOL 109L`)
- Score qualifiers and version notes (`score 3-5`, `prior Fall 2025`, `effective FALL 2025`, `Version 2`)
- Whitespace/punctuation noise (stray tabs, double spaces, trailing punctuation)
- College-name suffixes when the body of the title is generic (`Credit By Exam at Saddleback College` — the credential is generic CBE, not Saddleback-specific)

What remains is the **credential itself**. That's the seed for the unified title.

### Rule 2 — Don't split mechanism variants

The CPL Type column is a separate axis. Do NOT make the unified title carry the mechanism. Same credential delivered as `Industry Certification` and `Portfolio Review` (e.g., the Norco IBEW case) gets the **same unified title** — the EACR grouping key still includes CPL Type, so the two pathways will appear as separate cards anyway, but they'll share an identity.

### Rule 3 — Don't split version/cohort variants

`POST Academy prior Fall 2025` and `POST Academy effective FALL 2025` are the same credential at two points in time. One unified title: `POST Basic Academy`. Same logic for `CompTIA A+ Core 1` vs `CompTIA A+ Core 2` — both are subtests of CompTIA A+ certification. Unify under `CompTIA A+`.

### Rule 4 — DO split when the credential is genuinely different

These look similar but are distinct credentials. Keep them separate:

- `CompTIA A+` vs `CompTIA Network+` vs `CompTIA Security+` — different certs from the same vendor.
- `POST Basic Academy` (peace officer) vs `CDCR/CPOST` (corrections officer) — different agencies, different roles.
- `AP Biology` vs `AP Chemistry` — different subject exams.
- `RN License` vs `LVN License` vs `CNA Certification` — different scopes of practice.
- `Microsoft Office Specialist — Excel` vs `Microsoft Office Specialist — Excel Expert` — separate exams at different levels, keep split.

**Same credential issued by different bodies → unify, let the issuer field discriminate.**
Fire Inspector I is certified by ICC, NFPA, California State Fire Training (SFT),
and Cal-JAC. All four cover the same competency (NFPA 1031 Level I inspector).
Unified title for all of them: `Fire Inspector I`. The `issuing_agency` field is
the discriminator — the UI can badge each row with its issuer and let viewers
filter on it. Apply the same logic to EMT certification (issued by multiple
state EMS authorities), OSHA Outreach trainers, etc.

The line between "different issuer / same credential" (unify) and "different
issuer / different credential" (split) is the **scope of competency**, not the
issuer. POST vs CDCR is a split because peace officer ≠ correctional officer
— different jobs. ICC vs NFPA Fire Inspector I is a unify because both certify
the same inspector role.

### Rule 5 — Generic-bucket titles need a separate marker

Titles like `Credit By Exam at Mesa`, `Credit By Exam at Saddleback College`, `Credit By Exam San Diego City College` are NOT credentials — they're administrative buckets a college uses to register multiple unrelated CBE awards. Set:

- `unified_title = "Generic Credit by Exam — <College Name>"` (so they stay separately addressable per college, but flagged as administrative buckets, not real credentials).
- `confidence_title ≤ 0.6` to invite human review.
- Note in `_notes` that this is a generic bucket, not a specific credential.

### Rule 5b — Prerequisite-language titles refer to the cert they describe

Some colleges enter exhibits with titles like `Current EMT Certification or
Paramedic License` or `Current NREMT certification or State of California EMT
license AND current American Heart Association BLS`. These read as prerequisite
descriptions, but they're **referring to actual credentials**. Cluster them
with the corresponding cert's unified title (e.g., `EMT Certification`),
**not** a separate "prerequisite" bucket. Use a `_notes` entry to capture
that the source title used prerequisite phrasing. Confidence should be
0.65–0.80 to flag for review, but the mapping itself unifies with the cert.

The same applies to course-section titles like `EMT 1 Module A and B` — if
the credential being referenced is identifiable, cluster with that cert.

### Rule 5c — Credit-by-Exam / Portfolio exhibits name the COURSE CONTENT (Sam's Cx procedure, 2026-07-07)

Many exhibits document a **credit-by-exam (Cx)** or **portfolio-review**
opportunity rather than an external credential. Colleges name these freely for
local reasons (`AUTO 601 Completion`, `Math 095 CBE`, `Cinema 24- Credit by
Exam`, `Inspection Portfolio Spring 2026 #1`) — that local freedom stands; the
unified title is the SEARCH layer on top, and it must read for a prospective
student who knows the subject, not the college's naming scheme:

1. **Single-course Cx/portfolio exhibit** → unified title follows the
   COURSE-IDENTITY precedence (Sam, 2026-07-07 — mirrors the CCR's
   CCN-ID > C-ID > M-ID identifier precedence):
   1. the **CCN title** when the target course carries an AB-1111 Common
      Course Number (the student-facing statewide name — the strongest
      possible search anchor);
   2. else the **C-ID descriptor title** when it carries a C-ID;
   3. else — ONCE SAM DECLARES THE M-ID LAYER STABLE, not yet — the **M-ID
      consolidated title**; until then,
   4. the plain-English subject-matter title of the target course:
      `AUTO 601 Completion` → `Automotive Lubrication Service`; when the
      course title is itself just a code, `<Discipline> (<local course code>)`:
      `Math 095 CBE` → `Mathematics (MATH 095)`.
   When an identity title (1–3) is used, note the anchoring identity in
   `_notes` (e.g. "title anchored to C-ID AJ 200") so a future C-ID/CCN/M-ID
   re-key can ripple the title mechanically. Never put the mechanism
   (`Credit by Exam`, `CBE`, `Portfolio`) in the unified title — the CPL Type
   column carries it (Rules 1/2). **Never a discipline prefix either** (Sam,
   2026-07-08): `<MQ discipline> — <content>` decoration sheds the discipline
   (`Administration of Justice — Community Relations` → `Community
   Relations`) — the discipline lives on the row's metadata, not in the
   student-facing search title. And a **code-only title invokes the lookup**:
   `Administration of Justice 049` (raw `ADM JUS 049`, East LA) → find the
   articulating college's own COCI row for that code → use its aligned CCN/
   C-ID title if one exists, else its local course title (`Narcotics and Vice
   Control`).
2. **Batch Cx exhibit** (one exhibit spanning several courses) → name the
   coherent program-area umbrella a student would search (e.g. an exhibit
   bundling brake/suspension/electrical exams → `Automotive Maintenance
   Fundamentals`), and let the credit recommendations enumerate the member
   courses. If no honest umbrella exists, it's a Rule 5 generic bucket.
3. **Issuing agency for Cx + portfolio = `California Community Colleges`**
   (Sam, 2026-07-07) — **UNLESS Rule 5f applies** (a named local trainer:
   high school, ROP, adult school, noncredit provider — then the school is
   the issuer). Cx/portfolio is a title 5 §55050 system instrument, not
   an external issuer, and a uniform issuer makes these exhibits filterable as
   one family. The AWARDING college is never lost — it lives on the
   exhibit/articulation layer. This supersedes the old "local credential →
   `issuing_agency = null`" line in Rule 6 for Cx/portfolio specifically.
   Always the plural system name — never `California Community College`.

**Mechanized (2026-07-08):** the issuer-lane pre-seed
(`kb/_preseed_null_issuers.py` — `enrich_titles()`) stages Rule-5c titles for
already-classified Cx rows using the SAME lookup machinery as the unclassified
worklist's 💡 chips (`kb/_suggest_unclassified.py` — one definition, no
drift): parse the local course code from the raw variant — including
discipline-NAME-led codes ("Administration of Justice 68" resolves to the
college's real subject via `kb/reference/subject_discipline_map.json`: ADMJ 68
@ CCSF → "Criminal Justice Report Writing"; college-scoped ONLY, exactly one
(code, college) resolution or no guess) — join it COLLEGE-SCOPED into COCI via
the articulating colleges, take CCN > C-ID > local COCI course title
(SHOUTING-CASE catalog titles get title-cased), with the title-sanity guard
against the (SUBJ, NUM) join hazard. The lookup covers the Cx/Portfolio type
family AND `suspect_course_as_exhibit`-flagged rows regardless of CPL type
(an IC-typed exhibit that IS a course gets the course title). **M-ID titles
stay excluded until Sam declares the M-ID layer stable** — many M-IDs aren't
merged with their common titles yet. Rows no issuer lane matched can still
stage a title (`via: "course-title"`, issuer left null + residual-recorded).
Prefill-only per Rule 5e; verify with `kb/_verify_issuer_preseed.py`.

### Rule 5d — Brand-family exams PRE-SEED to the existing house family (2026-07-07)

Standardized-exam brands (AP, CLEP — both College Board; extensible) don't
need per-row judgment: the raw title is the exam name wrapped in decoration
(score bands `(Score 3-5)`/`(Score of 50)`, local-course parentheticals
`(BIOSCI 101)`, policy notes `(prior F11)`, footnotes, whitespace twins).
Run `kb/_preseed_unclassified.py` (dry-run first; receipts in
`kb/preseed_out/<date>/plan.json`) — it maps each brand raw to an EXISTING
house family by deterministic normalization and writes worklist assignments
as `preseed-v1@bot`. It NEVER invents a unified title: no-family and
multi-level ("Levels 1 and 2 — Complete both") rows are reported for the
curator instead of seeded. First run (2026-07-07): 158 of 163 AP/CLEP queue
rows seeded, 36% of the 451-row backlog. When adding a brand, extend the
`FAMILIES` table + `ALIASES`, then run `kb/_verify_preseed_rules.py`
(73 checks) before applying.

### Rule 5e — STAGED pre-seed lanes: ready to save, NOT saved (2026-07-07)

Lanes that must PROPOSE a title (rather than retarget to an existing family)
never write to Supabase. `kb/_preseed_unclassified.py --stage` emits the
committed **`kb/unclassified_preseed.json`**; the CER triage worklist PREFILLS
each staged row's title/issuer inputs with an ⚡ badge (lane + confidence +
note in the tooltip), and the curator clicks Save per row — or reviews and
uses the bulk "💾 Save all pre-filled shown" button (confirm-gated; saves
exactly what the inputs show). Sam: "For pre-seeded items, leave them ready to
save but not yet saved." Lanes (Session 103):

- **cx** — Credit-by-Exam / Portfolio rows: mechanism phrase + leading course
  code stripped per Rule 5c, issuer `California Community Colleges`;
  existing-family key match preferred over the stripped content.
- **hs** — course-code-led high-school/ROP articulation rows: code + school
  names + IS-codes + section/Honors riders stripped; same-code variants
  CONVERGE on one title (existing family outranks the modal pick; converged
  rows are capped at 0.65 confidence for review); issuer CCC.
- **journeyman / carpenters / ironworker / nccer** — apprenticeship + NCCER
  rows named from the authority sources below.
- **statewide / family** (Session 104) — decoration-strip (`Certification:`
  lead, acronym-echo `(CNA)`/`(FF1)` parens, IFSAC/Pro Board accreditor parens
  → captured as the ISSUER, trailing `Certification` tokens, mojibake, `fire
  fighter`≡`firefighter`) + `stage_key` match against the statewide
  CCC-collaborative catalog (`statewide_data.js` — includes brand-stripped
  aliases like `NCCER Welding Level 1` ⇒ `welding level i`) ∪ ALL house
  families ∪ live values; issuer from the catalog ∪ `kb/credentials.json`.
- **ic** (Session 104) — `IC-<content>` rows: statewide match first (Sam's
  IC-Welding → NCCER example), then family, else a title-only proposal.
- **cslb** (Session 104) — `C-##`/`Class A|B(-2)` contractor classifications
  kept VERBATIM (Rule 8b) + issuer `Contractors State License Board (CSLB)`;
  1-2-digit guard so wildland C-190/C-290 bundles are never claimed.
- **cx-type routing** (Session 104) — rows whose MAP **CPL Type** is Credit By
  Exam / Portfolio Review but whose TITLE has no mechanism phrase (the
  mechanism lives in the type column): title = content verbatim (receipted
  typo fixes only), issuer CCC.
- **JUDGMENT_SINGLES** — authored one-offs, each with its reasoning receipted
  in the note.

A row with a live assignment is never prefilled (a curator pick always wins),
and rows no lane covers honestly stay in the file's `_residual` list for
hand-triage. Regenerate after queue/family changes; live-assigned raws can be
excluded via `--assigned-md5 <file>` (md5(raw) hashes — fetch them via the
Supabase MCP when the sandbox can't reach Supabase directly).

### Rule 5f — Trainer-named local pathway exhibits: strip the school, make it the agency (Sam, 2026-07-08)

High school, noncredit, ROP, and adult-school courses that earn college credit
via **Credit By Exam or Portfolio Review** are routinely entered with the
training provider's name embedded in the title
(`AB MILLER HIGH SCHOOL- Business and Finance`,
`SUMMIT HIGH SCHOOL- Business and Finance`,
`Baldy View ROP - Civil Engineering and Architecture`). For these:

1. **Strip the trainer/school name from the title.** What remains — the
   course or pathway — is the unified title (`Business and Finance`).
   Never carry the school, "Pathway", "(High School Articulation)", or any
   mechanism phrasing into the unified title (Rules 1/2 still apply).
2. **The school becomes the `issuing_agency` AND the `training_agency` —
   both default to the same value.** The local provider both trains and
   attests; split them only when a genuinely distinct issuer exists (e.g.
   a PLTW-branded course taught by an ROP keeps `issuing_agency = Project
   Lead The Way (PLTW)` with the ROP as `training_agency` — an existing real
   issuer is NEVER overwritten by the school default).
3. This **overrides Rule 5c item 3** (issuer = CCC) whenever a school/trainer
   is identifiable: the CCC issuer stays only for college-internal Cx rows
   with no named external trainer.
4. Two schools entering the same course stay ONE unified title with the
   issuer as the discriminator (Rule 4's multi-issuer shape): `Business and
   Finance` from A.B. Miller HS and Summit HS are two credential records under
   one title, never two title variants.
5. **Per-credential grain caution:** stamp a school as trainer only when the
   credential's raw variants are UNANIMOUS about it. A unified identity whose
   variants span several schools (the EMT-405 case: Fontana HS + Kaiser HS +
   Baldy View ROP + Learn 4 Life) takes NO single-school default — leave
   issuer/trainer for per-variant judgment.
6. **GENERIC high-school rows (Sam, 2026-07-08 evening):** when the row's
   text says "high school" WITHOUT naming one ("(High School Articulation)",
   "High School to College Articulation") and no school is identifiable,
   the issuing agency is the literal placeholder **`Local High School`**
   (Sam's Astronomy save set the convention). A proper noun immediately
   before "High School"/"HS" means a NAMED school — never genericize those,
   and a multi-school identity (item 5) stays per-variant judgment. The
   trainer stays open (the placeholder is an agency verdict, not a training
   entity). Mechanized as the `hs-generic` lane.

Mechanized in `kb/_preseed_null_issuers.py`'s **local-trainer** lane (staged
prefills for the CER issuer lane — Rule 5e contract; supersedes the retired
`local-hs` ""-verdict lane) and verified by `kb/_verify_issuer_preseed.py`.
Title changes save as `unified_title_override`; **the rename re-key is LIVE
(Session 107)** — the PR-5b/1 apply workflow (`cred-rename-apply.yml`, manual
dispatch, V1–V4 gated + receipted) re-keys clean renames into the KB, and a
rename whose target matches an EXISTING credential needs the curator's
**✓ Confirm merge** in the triage lane (writes `unified_title_merge_confirm`;
the apply then folds the records into the existing credential — see
`docs/kb-notes/methodology-confirmed-merge-via-decision-row.md`).
Issuer/trainer promote canonically via Modes A2/A3 in
`kb/_apply_credential_review.py`.

### Rule 5g — Level words move to the END of the title; "Intro" expands (Sam, 2026-07-08)

Students browse/search the CER alphabetically by SUBJECT, so a leading level
word buries the subject ("Advanced Floral Design" files under A, away from
"Floral Design"). Styling rules for every unified title we stage or save:

1. **A leading level word — `Beginning`, `Intermediate`, `Advanced` — moves to
   the END of the title**: "Advanced Floral Design" → "Floral Design Advanced";
   "Advanced Desserts and Pastry/Chocolate/Sugar" → "Desserts and
   Pastry/Chocolate/Sugar Advanced". Subject families now sort together with
   the level as the trailing differentiator.
2. **Titles that start with "Introduction" stay as-is** — "Introduction to
   Literature" is the natural (and often authority-verbatim) course name, not
   a level prefix.
3. **The abbreviation "Intro" expands to "Introduction" everywhere** ("Intro
   to Sculpture" → "Introduction to Sculpture"). Word-boundary only —
   "Introduction"/"Introductory" are never touched.
4. **Official proper names are exempt from the level move** when the level
   word is part of the credential's own name, not a course level: **Advanced
   Placement (AP)**, **Advanced EMT** (the NREMT license level), **Advanced
   Cardiac/Cardiovascular Life Support (ACLS)**. Rule 8b (verbatim official
   titles) outranks 5g; extend the exemption list (`_LEVEL_KEEP` in
   `kb/_preseed_null_issuers.py`) as cases surface.
5. Applies AFTER the Rule 5c authority lookup — a C-ID/CCN/COCI-aligned title
   is styled too (the note keeps the authority receipt verbatim, so alignment
   provenance survives the reorder).

Mechanized as `restyle_title()` + the `title-style` pre-seed lane in
`kb/_preseed_null_issuers.py` (restyles every staged title; stages title-only
entries for triage rows whose display title changes under the rule); verified
by `kb/_verify_issuer_preseed.py`. Scope: the CER triage cohort (null-issuer
queue + staged/resurface rows) — already-issuered credentials are NOT
mass-resurfaced for styling alone.

### Authority sources for exhibit + agency names

Consult these when a row has NO house family yet (full link card:
`docs/kb-notes/reference-issuing-agency-authority-sources.md`). All but COS
403-block the agent sandbox — verify via a browser or a runner:

- **CA DIR Division of Apprenticeship Standards (DAS)** — registered
  apprenticeship program sponsors (the issuer for apprenticeship exhibits):
  https://www.dir.ca.gov/databases/das/aigstart.asp — per-occupation detail at
  `results_aigdetail.asp?varOccId=<id>`. **Resolved sponsors (Sam,
  2026-07-08 — the DAS search is not exact, so these are BEST-OPTION prefills
  by college region):** Norco + Santiago Canyon **carpentry** apprenticeships
  → `Southwest Carpenter And Affiliated Trade J.A.T.C.` (occId **82**);
  Norco + Santiago Canyon **electrician** apprenticeships → `Riverside Area
  Electrical J. A. C.` (occId **490**). ⚠ "IBEW" alone is not an electrical
  signal — the Norco "IBEW/Carpenters Articulation" rows are CARPENTRY
  (curated correction 2026-05-20); route electrical only on an electric token
  with no carpentry token. Strip the college/program parenthetical from the
  title ("(Norco Apprenticeship)"). The Northern-CA carpentry counterpart is
  `Carpenters Training Committee for Northern California (CTCNC)`. Mechanized
  as the `apprenticeship` lane in `kb/_preseed_null_issuers.py`.
- **FAA — Federal Aviation Administration** (Sam, 2026-07-08): the certifying
  body behind the aviation family — Mechanic Certificate (A&P / Airframe /
  Powerplant, 14 CFR Parts 65/147), pilot certificates (Parts 61/141), Remote
  Pilot (Part 107). House spelling `Federal Aviation Administration (FAA)`
  (the existing 12-record family). The family's COURSE-SIDE rows (Part-147
  AMT curriculum, pilot ground school, FLGHT flight-training ladders,
  drone-pilot courses) pre-seed FAA via the `cert-family` lane — the
  welding/AWS precedent. Precision: `drone pilot`, never bare `drone`
  ("Drone Photography" is a photography course).
  https://www.faa.gov/licenses_certificates/airmen_certification
- **ASE — National Institute for Automotive Service Excellence** (Sam,
  2026-07-08 evening): automotive exhibits whose competency aligns with one
  ASE cert take the ASE title (Rule 8b form — `ASE A5 — Brakes`) and the
  house-canonical issuer `National Institute for Automotive Service
  Excellence (ASE)` (Rule 6 — Sam's message said "Automotive Services
  Excellence"; the 55-record house family spells it canonically). Mechanized
  as the `ase-align` lane (context-gated on automotive wording so building-
  trades A/C never maps to A7; single-competency matches only — ambiguous
  multi-competency rows stay for judgment). The staged titles are usually
  EXISTING credential keys, so the Save flows through the PR-5b/2
  confirm-merge and the exhibit folds under the ASE credential.
  https://www.ase.com/test-series
- **NCCER assessments / craft catalog** — keep NCCER's naming verbatim,
  issuer `NCCER`: https://www.nccer.org/assessments/
- **CSLB license classifications** (the future C-## contractor-license lane):
  https://www.cslb.ca.gov/About_Us/Library/Licensing_Classifications/
- **CareerOneStop** — already synced live (the Session-101 COS authority).
- **COCI course list** (`kb/reference/coci_course_list.xlsx`) — the Rule 5c
  course-content title source for Cx/portfolio/HS-articulation exhibits.

### Rule 6 — Issuing agency uses the longer recognizable canonical name

Use the **longer, full canonical name with the common abbreviation in
parentheses** so the field is unambiguous on its own and reads well in tables
and reports. Examples:

- `Amazon Web Services (AWS)` — not just `AWS`
- `Computing Technology Industry Association (CompTIA)` — only if the short
  brand `CompTIA` is genuinely common; CompTIA is well-known enough alone, so
  `CompTIA` is acceptable. When in doubt, use the longer form.
- `California Commission on Peace Officer Standards and Training (POST)`
- `International Code Council (ICC)`
- `National Fire Protection Association (NFPA)`
- `California State Fire Training (SFT)`
- `California Joint Apprenticeship Committee (Cal-JAC)`
- `National Institute for Automotive Service Excellence (ASE)`
- `International Brotherhood of Electrical Workers (IBEW)`
- `California Emergency Medical Services Authority (EMSA)`
- `California Department of Public Health (CDPH)`
- `Council for Professional Recognition` (for CDA credential)
- `U.S. Occupational Safety and Health Administration (OSHA)`
- `College Board` — short, no abbreviation
- `Google` — vendor name; `training_agency = "Coursera"` when distinct
- `Cisco` — vendor name
- `American Council on Education (ACE)` — for JST military credit recommendations

For credentials issued by a CCC college locally: Cx / portfolio-review exhibits
take `issuing_agency = "California Community Colleges"` (Rule 5c); other
genuinely local credentials keep `issuing_agency = null` with an explanation
in `_notes`.

### Rule 7 — Training agency only if distinct

Most credentials have an issuer but no separate training agency. Set
`training_agency = null` for those. Use it only when the training is delivered
by a clearly different entity:

- POST Basic Academy: issuer = California Commission on POST;
  `training_agency = "varies by academy"` (canonical sentinel string — the
  pipeline treats it as a non-null marker that means
  "different per articulating college"). When a specific academy is in
  the raw title, use the specific name instead (e.g.,
  `San Mateo County Community College District Police Academy`).
- IBEW apprenticeship: issuer = IBEW;
  training_agency = `Joint Apprenticeship Training Committee (JATC)`
  when applicable.
- JST military credit: issuer = ACE; training_agency = `U.S. Armed Forces`
  or the specific branch when known.

The canonical sentinel `varies by academy` is intentionally lowercase and
without brackets — it's a real string value, not a placeholder. The pipeline
keys on it to render a special "Multiple training providers" badge in the UI.

### Rule 8 — Confidence scoring

| Score | When to assign |
|---|---|
| **0.95–1.00** | Title clearly matches a well-known credential (POST Basic Academy, AP Biology, CompTIA A+) with no ambiguity. |
| **0.80–0.94** | Title matches a known credential but has some noise/wording to interpret. |
| **0.60–0.79** | Educated guess: title is unusual, abbreviated, or has multiple plausible canonical names. |
| **0.40–0.59** | Generic bucket (see Rule 5), or title gives only weak signal about what credential is meant. |
| **< 0.40** | Title is uninterpretable from text alone; needs human input or external context. Still ship the row — confidence flags it for review. |

Confidence is per-field. A title can be high-confidence (`POST Basic Academy`, 0.98) while its training agency is low-confidence (`varies by academy`, 0.6).

### Rule 8b — Preserve issuer-assigned numeric codes when present

Some issuers assign numeric codes that are part of the credential's
identity (OSHA Outreach codes like `030`, `035`; ASE subtest codes like
`A1`, `A2`, `A5`, `L3`). **Preserve those codes in the unified title**,
even when two raw titles describe the same underlying curriculum under
different codes. The codes carry meaning to industry consumers (the
30-hour General Industry course is a different curriculum from the
30-hour Construction course) and the credential the worker actually
holds carries the code.

Examples:

- `OSHA 030 - Federal OSHA Outreach: Construction Industry Safety` →
  unified_title `OSHA 030 — Construction Industry Outreach (30-hour)`
- `OSHA 035 - Federal OSHA Outreach: General Industry Safety` →
  unified_title `OSHA 035 — General Industry Outreach (30-hour)`
- `OSHA Outreach for General Industry-30 hour` →
  unified_title `OSHA 30 — General Industry` (no source code, fall
  back to hour-count form)
- `ASE CERTIFICATION (A2) A2 – AUTOMATIC TRANSMISSION/TRANSAXLE` →
  unified_title `ASE A2 — Automatic Transmission/Transaxle`

If two raw titles describe the same curriculum but one has a code and
one doesn't, keep them as **separate unified titles** — they may
genuinely differ (one might be the official Outreach version, the
other a local equivalent).

### Rule 8c — Credential-merge doctrine: what folds vs what stays distinct (Sam, 2026-07-14)

When collapsing a family of similar credential titles (the recurring case: the
~87 automotive titles behind TOP 0948), four calls decide each pair. Ratified
against the ASE automotive cluster; recorded in `merge_doctrine_notes`.

1. **Mechanism / assessment-method qualifiers COLLAPSE.** A trailing
   `(with Practical Assessment)`, `+ Residency Units`, or similar names HOW the
   credit is verified, not a different competency → fold into the base
   credential (Rule 2 applied to a suffix). The 10 ASE `X (with Practical
   Assessment)` variants (A1–A8, G1, L1) fold into their base ASE certs.
2. **Industry certification vs local course-Cx is a SPLIT, not a merge.** Rule 4
   ("same competency, different issuer → unify") unifies the SAME credential
   across issuers (Fire Inspector I via ICC/NFPA/SFT). It does NOT unify a
   national industry certification (`ASE A5 — Brakes`) with a local course
   credit-by-exam at the same topic (`Automotive Brake Systems`, issuer
   California Community Colleges). The **CPL basis** — industry cert vs local
   course credit — is the splitting axis. Consequence: a rich topic area
   legitimately carries BOTH the ASE cert family AND local Cx course titles;
   that count is not "redundant."
3. **Narrower competency does not fold into a broader one.** `Automotive Brake
   Inspection` ⊄ `ASE A5 — Brakes` (inspection ≠ full brake service).
4. **Typos / mis-issuers get a hygiene pass, not a competency fold.** The
   `Automative *` cluster (issuer wrongly = ASE on local `Auto NNN Completion`
   Cx rows) is fixed per-row (spelling + issuer → CCC), keeping the local-Cx
   identity — never force-folded into the ASE cert.

Applied through the PR-5b confirm-merge machinery (`unified_title_override` +
`unified_title_merge_confirm` under a cohort reviewer, Rule 9 pre-flight).

### Rule 9 — Never refuse, always classify

Every raw title gets a mapping with a confidence score. Low confidence is the signal to reviewers — there is no "skip" or "needs review" status. If you have only weak signal, ship your best guess at low confidence and explain your reasoning in `_notes`.

## Output schema (one record per raw title)

```json
{
  "raw_title": "<exact string from MAP>",
  "unified_title": "<canonical name>",
  "issuing_agency": "<canonical name or null>",
  "training_agency": "<canonical name or null>",
  "confidence_title": 0.0,
  "confidence_issuer": 0.0,
  "confidence_trainer": 0.0,
  "_notes": "<one short sentence explaining any judgment call>"
}
```

The `_notes` field is mandatory whenever any confidence < 0.85, optional otherwise.

## When invoking the prompt

Pass the raw titles in batches (50–200 per call works well). Include for each row:
- `raw_title` (string)
- `cpl_types` (list — informs whether mechanism phrasing is OK to strip)
- `articulating_colleges_sample` (≤3 names — disambiguates generic buckets and helps with training-agency inference)

Cache results in `kb/unified_titles.json` (keyed by `raw_title`). Issuer/trainer details for each distinct `unified_title` go into `kb/credentials.json` (keyed by `unified_title`).

## What this skill does NOT do

- It does not change how the EACR table is grouped — that's the pipeline's job, reading the KB output of this skill.
- It does not write to the KB on its own — Phase 1 dry-runs return tables for human review; Phase 2+ does the writes under separate task control.
- It does not modify TOP code or Career Cluster classifications.

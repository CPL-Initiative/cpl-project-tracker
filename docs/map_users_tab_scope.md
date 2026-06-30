---
title: MAP Users management tab + college-nudge — scope
date: 2026-06-30
session: 87 (SkyGuy)
status: P0 done — view names + reachability confirmed (dispatch #4); field-name capture + P1 build next
tags: [cobi, map-users, nudge, supabase, pii, scope]
artifacts:
  - map/probe_users_schema.py
  - .github/workflows/map-users-schema-probe.yml
related:
  - "[[docs/kb-notes/reference-daily-dashboard-data-pipeline]]"
  - "[[docs/kb-notes/adr-cer-student-impact-counts-privacy]]"
  - "[[docs/cobi_raci_nudge_lessons]]"
  - "[[CLAUDE]]"
---

# MAP Users management tab + college-nudge — scope

Sam (2026-06-30): *"add a COBI tab to manage those [MAP] users so we can later
automate a nudge process to the colleges to periodically update their users."*

## 1. The data — what MAP has, what we have

| | |
|---|---|
| **Source** | MAP Custom Reporting Module category #9: **"College Users & Roles"** = **`View_CollegeUsersRoles_APIDataset`** (the `_APIDataset` suffix is mandatory — the bare name returns `400 "is not Valid"`) |
| **Shape** | **~2,741 rows** = system users' **names + emails + per-college role assignments** (P0 confirmed `dataCount=2741`; the exact 11-field list still needs capture — see §1a) |
| **Companion** | **"College Contacts"** = **`View_CollegeContacts_APIDataset`** — **121 rows** (one per college; P0 confirmed `dataCount=121`). Needed for the P3 refresh **nudge** (the AO / CPL Coordinator to email). |
| **In our datasets today?** | **No.** Two reasons (both deliberate): |
| | (a) It was **dropped from the daily fetch** for staff-PII minimization (Session 34) — `fetch_custom_report.py`'s `REQUEST_PAYLOAD` no longer requests it; the code comment says *"staff PII never lands on the Action runner."* |
| | (b) The raw `CustomReport_latest.json` is **gitignored + never committed** (transient; fetched → aggregated → discarded, PR #227). So even when it *was* fetched it never entered a committed dataset. |
| **Re-enabling** | One small edit (add the `View_CollegeUsersRoles_APIDataset` block + its `columnName` list to `REQUEST_PAYLOAD`) — the MAP endpoint already returns it. **No MAP credential needed** (see §1a). |

## 1b. FIELD SCHEMA CAPTURED (probe runs #5-#7, 2026-06-30, StarMax) — value-signature method

The `_APIDataset` views have **no self-describe mode** (a no-`columnName` request
500s), and the report API **pads unknown columns into 2-wide rows** (so a
structural guess-and-confirm over-accepts — run #5 "passed" all 57 candidates).
The reliable method is **value signature**: a REAL column returns
`responseCode='000'` + actual values; a FAKE one returns `responseCode='400'` +
0 rows. Calibrated with 3 garbage sentinels (all `400`/0), the probe cleanly
separated the real fields. MAP column names are **case-SENSITIVE** (`UserName` ✓
vs `Username` ✗).

### `View_CollegeUsersRoles_APIDataset` — 7 fields · 2,741 rows (SOLVED)

| Field | Notes | P1 use |
|---|---|---|
| `College` | college name, 128 distinct | display + join |
| `CollegeId` | 128 distinct, len 1-3 | join key |
| `FirstName` | **PII**, 1,407 distinct | reviewer-gated |
| `LastName` | **PII**, 1,901 distinct | reviewer-gated |
| `Email` | **PII**, 2,435 distinct (len 12-47) | reviewer-gated; **stable per-user key** (pk) |
| `RoleName` | **7 values** (non-PII vocab): *Ambassador, Articulation Officer, CALVET, Faculty, Implementation, Initiator, Student Intake Aide* | **public role-mix aggregate** |
| `UserName` | **PII**, 2,739 distinct (login) | reviewer-gated |

P1 `columnName` = exactly these 7 (case-sensitive). The stable key is `Email`
(or `(CollegeId, Email)` since a person can appear at >1 college). **No
last-login / timestamp field exists** in the view → "stale" (open Q3) must be
tracked by OUR `synced_at` / a "last confirmed" timestamp, not a MAP field.
Public surface = per-college **counts + the 7-way RoleName mix**; names/emails/
username are reviewer-/team-phrase-gated (Sam's "aggregates only", §5 Q2).

### `View_CollegeContacts_APIDataset` — WIDE role-columns · 121 rows (1/college)

Different shape from the Users view: **one column per contact ROLE**, value = that
person's name. `College` (121 distinct) + **`CEO`** (71/121) confirmed; `President`,
`Dean`, `VPInstruction`, `VPStudentServices`, `CollegeContact`, `CPLCoordinator`,
`ArticulationOfficer` did NOT match — the real role-column spellings differ.
**P3 BLOCKER:** the nudge targets Sam named (**College Contact · VP Instruction ·
VP Student Services**, §5 Q4) are role-columns here under unknown spellings →
get the exact column list from the **MAP Custom Report Builder UI** (category
"College Contacts"). The Users-view `RoleName` vocab is MAP *platform* roles, NOT
org titles, so the nudge targets are NOT sourceable from the Users view.

## 1a. P0 PROBE RESULT (dispatch #4, 2026-06-30) — view names + reachability CONFIRMED

The `map-users-schema-probe.yml` dispatch (run #4, `View_*_APIDataset` + seed-column
classification) settled the reachability questions:

| View | Real name | Rows | Unauthenticated reachable? |
|---|---|---|---|
| College Users & Roles | **`View_CollegeUsersRoles_APIDataset`** | **2,741** | **Yes** — with an explicit `columnName` list |
| College Contacts | **`View_CollegeContacts_APIDataset`** | **121** | **Yes** — with an explicit `columnName` list |

- **The `_APIDataset` suffix is the real name.** A no-suffix / mis-spelled name returns
  the clean `400 "… is not Valid"`. The correct `_APIDataset` name returns **HTTP 500
  on a no-`columnName` request** (the server accepts the name, then errors trying to
  build the report without a column list) — that 500-vs-400 split is how we identified
  the real names. (Not cold-start: later requests to the same host returned clean 400s.)
- **No `MAP_API_KEY` needed.** A request **with** an explicit `columnName` (the probe
  seeded `["College"]`) returns `responseCode='000'` (MAP's success code) + the rows —
  for BOTH views, unauthenticated, exactly like the 8 non-PII views the daily cron
  already fetches. So the no-column 500 is "this view has no self-describe mode," **not**
  auth-gating. P1's sync needs only the service key for Supabase, **not** a MAP credential.
- **Still open — the field NAMES.** Because the no-column self-describe mode 500s, the
  probe could not enumerate the 11 fields without naming them. Two ways to get them
  (§5 Q1): **(a)** Sam reads the column list off the MAP Custom Report **Builder UI**
  (category #9 "College Users & Roles" + "College Contacts") — cleanest; or **(b)** a
  **guess-and-confirm** probe: name a batch of likely columns (College, Email, Role,
  Status, FirstName, LastName, LastLogin, …) and keep the ones the column-oriented
  response echoes back with values (real columns return data; the rest are dropped).
  Either way, fold the confirmed field list back here + into P1's `columnName`.

## 2. The hard constraint — this is staff PII

Names + emails. The whole reason it was dropped is to **keep staff PII out of the
public repo + off the Action runner's committed outputs**. So the #1 design rule:

> **MAP user data must NEVER be committed to this public repo** — not as a JS
> file, not in a snapshot, not in an Actions log. It lives only in a gated
> Supabase table, synced server-side.

This mirrors the existing privacy posture
([`adr-cer-student-impact-counts-privacy`](kb-notes/adr-cer-student-impact-counts-privacy.md),
the student-identity column minimization in `fetch_custom_report.py`).

## 3. Architecture (reuses what COBI already has)

```
MAP Custom Report API  (View_CollegeUsersRoles)
   │  runner-only (Azure egress-blocked from the sandbox)
   ▼
GitHub Actions sync workflow  ──service key──►  Supabase  public.map_college_users
   (fetch the one view, upsert by a stable key;                 (gated: anon READ
    NEVER commit / NEVER print raw PII)                          maybe withheld;
                                                                 reviewer/team-phrase
                                                                 write; RLS like
                                                                 team_members)
                                                                      │
   COBI "MAP Users" tab  ◄──anon read (or signed-in)───────────────────┘
   (per-college roster · role · last-updated · "needs refresh" flag)
                                                                      │
   Nudge engine (REUSE the RACI tab's nudge)  ──────────────────────────┘
   (email each college's contact "please refresh your MAP users";
    track last_nudged_at / last_response_at — the columns already exist
    on team_members; replicate the pattern)
```

Building blocks already in the repo to reuse:
- **Gated Supabase table pattern** — `team_members` / `allowed_reviewers` + the
  magic-link (`cpl_sb`) **and** shared team-phrase (`team_pass_ok()`) gates.
- **Server-side sync from a runner** — the daily curation sync
  (`kb/_apply_curation.py` + `SUPABASE_SERVICE_KEY`) and `cpl-landing-pages.yml`
  (runner-as-proxy to the same Azure host) are the templates.
- **Nudge engine** — `raci.js` already emails R/A people, drafts via the report
  proxy ("let CC write it up"), and tracks `last_nudged_at`/`last_response_at`.
  Story: [`docs/cobi_raci_nudge_lessons.md`](cobi_raci_nudge_lessons.md).

## 4. Phased plan

| Phase | What | Status |
|---|---|---|
| **P0 — Schema probe** | Capture the exact 11 fields + the role vocabulary, PII-safe, on a runner. `map/probe_users_schema.py` + `map-users-schema-probe.yml` (dispatch-only; masks names/emails; commits nothing). **DONE (dispatch #4, 2026-06-30 — see §1a):** real view names = **`View_CollegeUsersRoles_APIDataset`** (2,741 rows) + **`View_CollegeContacts_APIDataset`** (121 rows); both **reachable unauthenticated** with an explicit `columnName` list (no MAP credential needed). **Residual:** the 11 field NAMES (the no-column self-describe mode 500s) — get them from the MAP Builder UI or a guess-and-confirm probe (§1a / §5 Q1). | **DONE** (names + reachability); field-name capture remains |
| **P1 — Gated sync** | New Supabase `public.map_college_users` (schema informed by P0's field list) + a sync workflow that fetches `View_CollegeUsersRoles_APIDataset` **with an explicit `columnName`** on a runner and upserts via the **Supabase** service key (no MAP credential needed). Decide what (if anything) the anon role may read — likely counts/roles per college, **emails withheld** unless a signed-in/team-phrase reviewer. | not started (unblocked once the field list lands) |
| **P2 — COBI "MAP Users" tab** | Static lazy renderer (the `raci.js`/`cpl_news.js` pattern): per-college roster, role, last-updated, a "stale / needs refresh" signal. Reviewer/team-phrase-gated for any PII. | not started |
| **P3 — College nudge** | Reuse the RACI nudge: periodic "refresh your MAP users" email per college (to the AO / CPL Coordinator already in `View_CollegeContacts`), with `last_nudged_at`/`last_response_at` accountability. | not started |

## 5. Open questions — Sam's decisions (2026-06-30, Session 87 / StarMax)

1. **The field names** (and the stable per-user key — email? a MAP user-id field?).
   The no-column self-describe mode 500s, so the structural guess-and-confirm
   over-accepted (the API pads unknown columns into 2-wide rows). **Resolution:**
   a **value-signature** probe pass (calibrate the unknown-column shape with
   garbage sentinels, keep candidates whose values beat that baseline). Fold the
   confirmed list back here + into P1's `columnName`. If the server pads even
   garbage with data, fall back to the **MAP Builder UI** field list. ← in progress.
2. **What may the anon (logged-out) role see?** → **Aggregates only** (Sam): per-
   college **counts + role mix** are public; **names/emails are reviewer- /
   team-phrase-gated**. Mirrors the CER student-count privacy ADR. Drives the P1
   RLS: a public aggregate read path (counts), a gated roster read path (PII).
3. **"Stale" definition** — does the view carry a last-login / last-updated field
   we can flag on, or do we track our own "last confirmed" timestamp? (Pending the
   field list — the probe checks for `LastLogin*` / `*Date` columns.)
4. **Who gets the nudge** per college → **College Contact + VP of Instruction +
   VP of Student Services** (Sam — NOT the AO/Coordinator framing). These role
   labels must be matched in **`View_CollegeContacts_APIDataset`** (P3 maps the
   role/title field to these three).
5. **Cadence** of the refresh nudge → **each semester** (twice a year, fall +
   spring); a reviewer can still nudge any college manually anytime.

## 6. Next concrete step

P0 (view names/reachability) **and** the **Users-view field schema** (§1b) are **DONE**.
**Next = build P1** with the now-known 7-column `columnName`:
1. Supabase **`public.map_college_users`** — pk `(college_id, email)`; columns
   college, college_id, first_name, last_name, email, role_name, username,
   synced_at. RLS = **anon can read aggregates only** (a SECURITY DEFINER
   `map_users_summary()` RPC returning per-college counts + the 7-way RoleName
   mix — never raw rows), **roster rows gated** `is_allowed_reviewer() OR
   team_pass_ok()` (Sam's §5 Q2). No MAP-field "stale" → track `synced_at`.
2. **`map/sync_map_users.py`** + **`.github/workflows/map-users-sync.yml`** —
   runner fetches the 7 columns from `View_CollegeUsersRoles_APIDataset` and
   upserts via the **Supabase service key** (the `cpl-landing-pages.yml` /
   curation-sync template). Dispatch first; semester cron later (§5 Q5). **Never
   commits/prints PII.**
Then **P2** (the gated COBI tab — `raci.js`/`cpl_news.js` lazy-renderer pattern)
and **P3** (the nudge — reuse the RACI engine; **BLOCKED** on the Contacts-view
role-column spellings for College Contact / VP Instruction / VP Student Services,
§1b — get them from the MAP Builder UI). Nothing committed so far exposes PII.

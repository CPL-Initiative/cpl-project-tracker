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
| **P1 — Gated sync** | `public.map_college_users` (RLS: reviewer/team-phrase SELECT; service-role write; public aggregate `map_users_summary()`) + `map/sync_map_users.py` + `map-users-sync.yml` (dispatch + monthly cron). **DONE + LIVE (PR #619/#620)** — seeded **2,741 users / 128 colleges**. Gotcha fixed: pg-safeupdate needs `where true` on the full-table delete. | **DONE** |
| **P2 — COBI "MAP Users" tab** | `map_users.js` (static, lazy): public per-college **counts + role mix** (anon `map_users_summary()`), reviewer/team-phrase **roster drawer** (names/emails), XSS-escaped. Nav/pane/boot in BOTH HTMLs. Tests `tests/map_users.test.js` (22). **DONE + LIVE (PR #620).** | **DONE** |
| **P3 — College nudge** | The RACI nudge is a **client-side `mailto:`** (no email server). Gated `map_college_contacts` (Primary Contact / VPAA = VP Instruction / VPSS = VP Student Services + emails) fed by the same sync; a per-college 📣 button opens a pre-filled mailto to those 3 contacts. **DONE + LIVE (PR #621)** — contacts seeded **121 colleges** (99 PC / 100 VPAA / 58 VPSS emails). Contacts API names keep the **spaces** ("VPAA Email"). `Last Updated On` is all-null in MAP → no staleness signal yet. | **DONE** |

## 7. STATUS — ALL PHASES DONE (Session 87, StarMax)

The MAP Users tab is **complete + live** across PRs #618 (probe) / #619 (P1) / #620
(P2) / #621 (P3). Gated Supabase: `map_college_users` (2,741 rows, public aggregate
via `map_users_summary()`, roster reviewer-gated) + `map_college_contacts` (121 rows,
reviewer-gated). Sync: `map/sync_map_users.py` + `.github/workflows/map-users-sync.yml`
(dispatch + monthly cron, both tables in one run). Tab: `map_users.js` (lazy, in BOTH
HTMLs). **Future:** wire `Last Updated On` if MAP starts populating it (per-college
staleness); add the 3 other Contacts roles (CEO / Articulation Officer / etc.) to the
nudge if Sam wants; consider an in-app "mark nudged" log (today it's mailto-only).

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

## 7. Shipped + the nudge follow-up (Session 87, 2026-06-30)

P1–P3 all shipped (PRs #618–#621). Then Sam's follow-up on the 📣 nudge:

- **Recipient picker** (PR #623) — 📣 opens a confirm dialog listing everyone on
  file, **all pre-checked**; uncheck anyone, then **✉ Open email draft**. Still a
  draft `mailto:` (nothing auto-sends). `buildNudgeMailto(college, picks[, url])`
  now takes the chosen picks, not the whole contacts row.
- **CEO added** as a 4th nudge role (`ceo`/`ceo_email` on `map_college_contacts`;
  value-signature-confirmed labels `CEO` / `CEO Email`). 71/121 colleges have one.
- **Last-nudged log** (PR #623) — gated `map_college_nudges` (college pk,
  `last_nudged_at`/`last_nudged_by`; reviewer/team-phrase R+W), kept SEPARATE from
  the contacts table so the monthly full-refresh never wipes it. The tab upserts on
  open and shows "last nudged &lt;date&gt; by &lt;who&gt;" per row.
- **MAP dashboard deep-link** (PR #624) — new `map_college_contacts.landing_page_url`,
  joined in the sync from `chatbox_college_profiles` (the same per-college URLs the
  CPL Assistant uses; 118/121 match by exact college name). The draft email + the
  picker dialog link the college to **their own MAP CPL dashboard**.

**Decision — DON'T build a roster editor in COBI.** Sam asked about a self-service
"update only your users" link that *feeds MAP*. MAP is the system of record for
users and there is **no MAP write API** we can call (the Custom Report API is
read-only), so a COBI-side editor would be a second roster that drifts. The clean
split: colleges edit **in MAP** (deep-linked from the nudge); COBI owns the
**nudge + accountability**. True write-back would be a MAP-team endpoint — scope
separately if ever wanted.

**Parked — the attestation loop (B).** A tokenized "✓ our roster is current"
confirm page → a gated `map_college_attestations` table (anon-facing Edge Function
+ service-role write, the cpl-chat pattern). Buildable COBI-only, no MAP dependency.
Sam parked it for now (chose the deep-link only).

**Open — a deeper MAP "Manage Users" URL.** Today the deep-link points at each
college's MAP CPL **dashboard** (their MAP home). If MAP exposes a per-college
*Manage Users* screen, swapping the target is a one-line change (the column +
plumbing exist). Sam to confirm whether such a URL exists.

## 8. Roster-in-the-nudge + the 3 incoming Custom Report fields (Session 87, 2026-06-30)

**Settled process (Sam):** scheduled + manual nudges email the selected contacts a
link to the MAP login (Sam to provide the exact URL — a generic MAP login is fine
for now; today's link is each college's MAP CPL dashboard, swappable). Only staff
with MAP credentials can actually log in and edit.

**Shipped — the college roster in the nudge body.** Leadership wanted "eyes on
their CPL heroes," so the nudge dialog now renders the college's own
`map_college_users` roster as an **opt-out checklist** (all checked) with a
**Check-All master** in the header row + a checkbox per user (drop a departed
staffer before sending). Only checked users land in the email body
(`rosterEmailBlock`, sorted by role then last name; one `Name — Role — Email` line
each). The roster is the college's OWN staff shown to that college's OWN leadership
(no cross-college leak; client-side draft only, never logged). Big-college caveat:
a very long roster can hit Outlook's mailto length cap — the per-user checklist is
the escape hatch. `tests/map_users.test.js` → 56 checks.

**INCOMING — 3 new per-user Custom Report fields (Sam asked MAP to add).** When they
land in `View_CollegeUsersRoles_APIDataset`, fold them into `map_college_users`:
1. **Active/Inactive** — a per-user status. Recommend: a default "active only"
   filter on the tab + roster, surface the active count in `map_users_summary()`
   (more honest than total), and exclude inactive users from the nudge roster.
2. **Disciplines** — comma-delimited multi-value (a faculty reviewer can cover many).
   Store as text, render as chips. **High value:** lets us filter "Biology faculty
   reviewers across colleges," which feeds the §11 faculty-trust / MC pipeline
   (knowing which reviewer can ratify which discipline's cross-college articulation).
3. **Date last updated** — the per-user staleness signal we currently lack (the
   Contacts view's "Last Updated On" is all-null). Recommend: surface per-user +
   roll up to a per-college oldest/newest so the tab can flag "not refreshed in N
   months" → drives the semester nudge cadence ("nudge colleges stale since X").

**Wiring checklist when they land (don't guess names):** re-run the value-signature
probe (`map/probe_users_schema.py`) to confirm the EXACT case-sensitive column
spellings → add columns to `map_college_users` + `FIELD_MAP` + `map_users_replace`
→ extend `map_users_summary()` (active count; NO PII) → render in the tab/roster.
All three are per-USER → they live in the gated roster table, not Contacts.

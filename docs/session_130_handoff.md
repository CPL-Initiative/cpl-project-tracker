---
title: Session 130 handoff (SkyMind → next) — Sierra reaches the data; now build the page that uses it
created: 2026-08-09
updated: 2026-08-09
tags: [handoff, sierra, disposition, college-page, map-team, contacts, funding]
related:
  - "[[docs/cpl_assistant_lessons]]"
  - "[[docs/kb-notes/methodology-rls-is-not-a-gate-in-front-of-a-service-role-function]]"
  - "[[docs/kb-notes/methodology-a-guard-that-fails-on-truth-gets-muted]]"
  - "[[docs/map_custom_report_request_for_malone]]"
superseded: true
superseded_by: session_132_handoff.md
---

# You are Session 130

Previous session was **SkyMind (129)** — five PRs, all merged, one production deploy. **Sam named it at sign-off**
("Great work today, SkyMind"); it had been running as SkyWire, the name session 129's handoff suggested, and the
docs were reconciled to Sam's name so a future session searching either term lands in the same place. Take a name or
coin one.

## Read first, in order

1. This file.
2. `docs/cpl_assistant_lessons.md` § **2026-08-09 SkyMind** — the story, written once, there.
3. `docs/kb-notes/methodology-rls-is-not-a-gate-in-front-of-a-service-role-function.md` — **before touching `cpl-chat` or any gated table.**
4. `docs/kb-notes/methodology-a-guard-that-fails-on-truth-gets-muted.md` — before writing any assertion.
5. `docs/map_custom_report_request_for_malone.md` — the forwardable ask for the MAP team.

## ✅ What is live

**cpl-chat v36** — Sierra answers credit disposition, statewide and per named college. 68 committed checks
(`tests/sierra_credit_disposition.test.js`), live smoke run 55 `ALL MODES OK`, deploy byte-verified,
`verify_jwt:false` intact. #1064 · #1065 · #1066 all merged.

⭐ **There is ONE Sierra, not two.** The COBI tab, the PUBLIC map.rccd.edu widget and the Fact Sheet drawer all
POST to the same `/functions/v1/cpl-chat`. It reads with the **service-role key** — RLS does not constrain that
path — and ships `--no-verify-jwt`, so anyone can curl it. **No caller-supplied field (`audience`, `ctx`,
`Origin`) is an authorisation.** Per-college disclosure to all callers is **Sam's explicit decision, 2026-08-09**.
Do not re-litigate it; do not assume a future "internal-only" lane exists without building real JWT validation.

## ✅ PRIORITY 1 — the proposed-fills build (SHIPPED 2026-08-09, SkyMind)

Sam: *"the counseling contact is our best guess as to whom would serve as the best primary contact when the
contact is blank"* — use them as **temporary fills on the COBI side so the MAP team can adopt them if they agree.**

- `map_users.js` → `FALLBACK_CONTACTS` already holds all **71** looked-up colleges: **56 with a contact, 15
  blank-with-a-finding**, 3 curator-supplied (Jessica). `fallbackCell()` already renders provenance and the words
  *"not a MAP designation"*. The nudge picker already offers them. **Most of the mechanism exists — extend it.**
- ✅ **BUILT.** `proposedFillFor(row)` returns a suggestion **only** where `primary_contact_email` is blank; the
  counseling column renders it under a **"Proposed for MAP"** badge with provenance and source link, and stays a
  plain reference where MAP already holds a contact. Plus a `Proposed for MAP` stat box, a *show only colleges with
  a proposed fill* filter, and a **handover CSV** (`cpl-proposed-contacts-for-map.csv`) carrying source, who
  supplied it, the note, an explicit *"(nothing — this field is blank in MAP)"*, and an empty **Decision (MAP team)**
  column to work down. `tests/map_users.test.js` **133 → 152**.
- ⚠️ **No 7th column was added** — the existing counseling column became dual-state instead, per the
  no-horizontal-scroll rule. Adding a column here is what would push the table off-pane.
- ⚠️ **Never put a proposed fill inside the "Primary contact email" column.** That column means *what MAP holds*;
  a temporary fill there will eventually be exported or quoted as a MAP designation. Same failure family as
  "not in this dataset" being read as zero.
- The **15 stay visibly blank** — they need a human. 5 list individual counselors only · 6 phone/form-only ·
  **2 publish only a mental-health inbox** (Contra Costa `wellness@`, LA Harbor Life Skills) — **found and DELIBERATELY DECLINED for CPL routing; declining them is why those colleges are blank** · 2 specialized-only.

## 🎯 PRIORITY 1 (was 2) — the college action page, and the MAP-team queue

Sam's vision: **one page, not 123.** A college picks itself + a role and gets its stats, opportunities against the
goals, and to-dos. The college-facing inverse of the student landing page.

⭐ **One engine, two audiences (Sam):** colleges need *what should I do next* (a **briefing**, leads with
opportunity); the MAP team needs *what's waiting on me* (an **inbox**, leads with **age** — "sitting 34 days").
Build one engine. The MAP-team backlog is currently scattered across ≥6 surfaces with no owner and no queue:
56 proposed fills · 15 unroutable colleges · 6 open Sierra feedback rows · every governance owner unset ·
colleges 122/131 · Malone's view name. The governance tab already proved the failure mode by measuring itself —
a cadence decided in June that has never run once.

**Design calls already made** (don't re-derive): open with a **rendered briefing, not a blank chat box**; role is a
dropdown so it **tailors but never gates**; the **action library is the hard part**, seed it from the IFM P1/P2/P3
strategies rather than inventing to-dos.

⭐ **Inbound CPL requests outrank every stat on the page.** Colleges will start receiving public CPL review
requests daily, for the first time — a person is waiting. This also promotes the nightly feed from *nice-to-have*
to **prerequisite**: daily to-dos off month-old data get caught the first week.

### The goals are SOURCED, never pasted

- **ESS 25-82 ($50k), 3 outcomes** — `funding/_build_funding_ess.py`: (1) JSTs/Veteran Star ≥75%, (2) implementing
  statewide ASCCC recommendations, (3) proactive CPL.
- **$35M, 3 priorities** — resolution order: `cpl_funding_data.js` → `year_priorities` (baked, hand-maintained)
  ⊕ Supabase `cpl_funding_config.config.year_priorities` (Chancellor/team-editable, **currently empty** so
  defaults stand) ⊕ per-browser what-if. **Read at runtime.** P1 (30%) completion via CPL awards · P2 (42%)
  access via CPL · P3 (28%) capacity/visibility/documentability/interoperability/mobility. **Descriptions are
  stable; METRICS are year-specific** (Y1 P1 = headcount eligible; Y2 P1 = Units of Transcribed CPL, FTES).

## ⚠️ Things this session got wrong — do not re-inherit

1. **I shipped two guards that fired on CORRECT behavior, hours apart.** One printed `STUDENT GRAIN LEAKED` at a
   PostgREST timeout; one would have failed Sierra for being right. Read the KB note before writing assertions.
2. **Numbers: compute, never paste.** Rolling up from the published table exposed that the docs' headline was
   unsourceable. **Show BOTH totals with a suppression chip** (Sam's revision): published **1,051,870 / 63,991**,
   unsuppressed **1,052,531 / 64,074**, chip = *13 of 111 colleges withheld, each under 10 students*.
   ⚠️ **Only while ≥3 cells are suppressed** — at one, the difference IS that college's figure. Re-check after
   every refresh.
3. **The contacts were never written to MAP and can't be** — MAP is read-only for us. `map_college_contacts`
   (synced 2026-08-05) still shows the blanks. We route around them; we don't fill them.

## Patterns that worked

- **Check the premise before building on it.** Two greps refuted a claim that had survived into a handoff.
- **Measure before widening an assertion.** One SQL query stopped a regression.
- **Ask what the data says about the edge case.** "Every non-college entity is already suppressed" changed the
  risk profile more than any code did.
- **Sam's corrections beat my recommendations twice** — the opportunity framing, and showing both numbers with a
  chip. Believe him, then verify, then record it.

## Safety patterns to honour

- Never route per-student rows through a session's context. Aggregates only.
- Sandbox cannot reach `*.supabase.co` — all Supabase access via MCP.
- **Never commit any MAP export** — this repo is public.
- Merge on `clean` OR `unstable`; never force-push `main`.
- After a squash-merge, `git fetch && git reset --hard origin/main`. The stop-hook "unpushed commits" nag that
  follows is a **documented false positive** (it fired 3× this session) — verify committer + ancestry, then ignore.
- Deploying `cpl-chat` reaches production with no staging tier. Dispatch `cpl-chat-deploy.yml` (pinned `ref: main`,
  so **merge first**), then `cpl-chat-smoke.yml`. The smoke tests the LIVE function, not your branch.

## Moniker

**SkyDesk** is suggested — the next lane is the surface people actually work from.

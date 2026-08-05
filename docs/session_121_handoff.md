---
title: Session 121 handoff — the student-contact worklist is live; two colleagues are in the loop, and their verification is the next move
date: 2026-08-05
tags: [handoff, map-users, contacts, provenance, cpl, onboarding]
related:
  - "[[docs/map_users_lessons]]"
  - "[[docs/map_users_tab_scope]]"
  - "[[docs/kb-notes/methodology-route-to-a-determination-they-already-made]]"
  - "[[docs/kb-notes/methodology-provenance-is-a-field]]"
  - "[[docs/session_119_handoff]]"
---

# You are Session 121.

Session 120 was **SkyMail** (named by Sam mid-session). Claim your own moniker or
take one Sam offers.

> **Numbering note — read this once so it stops propagating.** SkyPartner wrote
> `session_119_handoff.md` *and* labelled itself `SkyPartner (119)` in
> `kb/cpl_todos.json`, which can't both be right under the N-writes-N+1 rule. I
> took **120** to avoid claiming a number already in use and wrote this as 121.
> If Sam says otherwise, he wins. Don't re-derive it.

## What shipped (PRs #991, #992, #993 — all merged + deployed)

The MAP Users tab gained a reviewer-only **⚠ No student contact** lens.

**Why it exists, in Sam's words:** *"The big goal is to have all College Landing
Pages include contact so when students request CPL, it goes to a real person who
can respond. MAP is set up to send requests to the Primary Contact using the PC
email."* **25 of 123 colleges had no Primary Contact email; 24 of those had a
live landing page.** Students asking those colleges reached nobody.

- **Cascade** (`CPL Coordinator → CPL Assistant → CPL Counselor → Articulation
  Officer → Lead Initiator → Faculty Lead`) resolves **17 of 25**. The other 8
  are *asked*, never defaulted.
- **Contact sync 11 → 24 fields.** A probe found `View_CollegeContacts_APIDataset`
  carried far more than we pulled: CPL Assistant Email 52/123, CPL Counselor 65,
  Articulation Officer 87, Faculty Lead 84, Lead Initiator 82, SCO 101.
- `map_contact_gaps` — a `security_invoker` view; RLS on the base tables gates it.
  **Verified 0 rows for anon** on the view and both base tables.
- Public headline corrected: **2,657 users / 120 colleges**, not 2,769 / 128
  (7 sandbox entries + the statewide team account). Fixed by *labelling*
  (`college_kind`), not filtering.
- `disciplines` splits on the **pipe** now — MAP never used commas; a 150-code
  value had been rendering as one 1,364-character cell for two months.
- Tests **70 → 108**; 184 files green.

## Read these first (in order)

1. [`docs/map_users_lessons.md`](map_users_lessons.md) — the full story, incl. why
   the shared-inbox design was rejected and what replaced it.
2. [`docs/kb-notes/methodology-route-to-a-determination-they-already-made.md`](kb-notes/methodology-route-to-a-determination-they-already-made.md)
   — the load-bearing idea. Read before touching the cascade.
3. [`docs/kb-notes/methodology-provenance-is-a-field.md`](kb-notes/methodology-provenance-is-a-field.md)
   — the three trust tiers and why they render differently.
4. `CLAUDE.md` §11 (SkyMail) · `map/supabase_map_contact_gaps.sql` (schema of record).

## ⚠ You have human colleagues in this session

Sam brought in **Ashley and Jessica**, who *"live in MAP on the daily"* and are
newer to Claude Code. Jessica already used the session well — she asked for a cut
of the data I hadn't built (colleges missing a **CPL Assistant**, 71 of them,
with Primary Contact as the *first* fallback) and supplied real contacts for two
colleges my web lookup couldn't resolve.

**How to work with them:**
- Plain language, no repo jargon. They know MAP far better than the codebase.
- **Their MAP knowledge outranks my inference every time.** Jessica named two
  specific Gavilan counselors — something my own sourcing rules forbade me from
  doing — and she was right.
- When they hand you a value, check it and say what you did. Jessica's SDCCE
  address arrived as `sdceecc@sdccd.ed`; I recorded `.edu` and flagged it; she
  confirmed. Flag-and-proceed beat both silently fixing and blocking.

## The priority workstream — verification, not building

**① The 6 web-sourced fallbacks need a human eye.** Siskiyous, Cosumnes River,
Feather River, Hartnell, NOCE, Calbright — I found those by web search. Gavilan
needed a human; assume at least one of the six does too. When a curator corrects
one, flip it to `via: "curator"` with their name and date (see
`FALLBACK_CONTACTS` in `map_users.js`).

**② Jessica's 71-college "no CPL Assistant" table is a chat snapshot.** It goes
stale against a monthly sync. Make it a second lens in the tab — the query is in
`docs/map_users_lessons.md` and the lens plumbing already exists (`state.lens`,
`gapsHtml()`); it's a sibling function, not a rebuild.

**③ Open carryover:** the **MAP "manage users" URL** (open since Session 87 — the
draft emails link each college's MAP CPL dashboard as an interim). And whether
the 5 leadership-only colleges should show VPAA/CEO as *context* without
auto-proposing.

## Patterns that worked (reuse them)

- **Probe, don't ask a human to recall a spelling.** Sam knew the CPL Assistant
  field existed but not its label. A runner probe answered in 90 seconds.
  `map/probe_users_schema.py` + a `workflow_dispatch`.
- **Measure before designing.** Every good decision this run came from a query.
  The 17/25 outcome came from *wiring data we already had access to*, not clever
  logic.
- **Take the constraint seriously and the design gets better.** Sam's
  local-governance objection killed my nicest idea and produced a stronger rule.
- **A two-state detector is wrong about the middle.** The probe's real/fake gate
  hid sparse-but-real columns; a third `weak` state that reports to a human fixed
  it.
- **Adjacent findings are worth more than the thing you were looking for.** The
  inflated public headline, the pipe delimiter, and the multi-email cells all
  surfaced while measuring something else.

## Safety patterns to honor

- **MAP contact/user data never enters this public repo.** It lives only in gated
  Supabase. The *one* exception is `FALLBACK_CONTACTS` in `map_users.js` —
  institutional addresses published on public .edu sites. Keep that bar; a
  personal address would violate it.
- **`security_invoker = true` on `map_contact_gaps` is load-bearing.** Removing it
  publishes every staff email to the anon key. Verify gating by *reading as anon*
  (`set local role anon`), never by reading the policy.
- **MAP has no write API.** Nothing here edits MAP; we propose and the team enters
  it. See `adr-surface-dont-edit-readonly-system-of-record`.
- Sam runs concurrent sessions — re-read live tables before any bulk write.

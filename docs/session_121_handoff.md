---
title: Session 121 handoff — the student-contact worklist and the governance starter are live; both are waiting on humans, not on code
date: 2026-08-05
tags: [handoff, map-users, contacts, governance, decision-rights, onboarding, ai-team]
related:
  - "[[docs/map_users_lessons]]"
  - "[[docs/governance_lessons]]"
  - "[[docs/working_with_claude_code]]"
  - "[[docs/kb-notes/methodology-route-to-a-determination-they-already-made]]"
  - "[[docs/kb-notes/methodology-a-governance-artifact-must-measure-itself]]"
  - "[[docs/session_119_handoff]]"
superseded: true
superseded_by: session_132_handoff.md
---

# You are Session 121.

Session 120 was **SkyMail** (named by Sam mid-session). Claim your own moniker or
take one Sam offers.

> **Numbering note — read once so it stops propagating.** SkyPartner wrote
> `session_119_handoff.md` *and* self-labeled `SkyPartner (119)` in
> `kb/cpl_todos.json`, which can't both hold under the N-writes-N+1 rule. I took
> **120** to avoid a collision and wrote this as 121. If Sam says otherwise, he
> wins. Don't re-derive it.

## ⚠ Read this first: you have human colleagues

**Ashley, Jessica and Malone** now use Claude Code directly. Most are new to it
and expert in MAP. An enterprise account is coming.

- **`docs/working_with_claude_code.md`** is their guide — send new people there.
- **`CLAUDE.md` §"Working with the MAP team"** is *your* half, and it is the
  binding one. The principle: **a habit that depends on a new user remembering
  it will fail on their first day.** Ask who's driving. Attribute what you're
  told. Offer the tab when a deliverable will drift. Explain approval requests in
  plain language. Flag cross-impact *before* acting. Offer the checkpoint.
- **Their MAP knowledge outranks your inference.** Jessica named two Gavilan
  counselors my own sourcing rules forbade me from naming — she was right, and
  the rules were right to stop *me*. When someone supplies a value that breaks a
  rule you set for yourself, check whether the rule was about *you*.
- Flag-and-proceed beats both silently fixing and blocking: Jessica's SDCCE
  address arrived as `sdceecc@sdccd.ed`; I recorded `.edu`, said so, and she
  confirmed.

## What shipped (PRs #991–#994, #997, #998 — all merged + deployed)

**① The student-contact worklist.** MAP routes a student's CPL request to a
college's Primary Contact email. **25 of 123 colleges had none; 24 of those had a
live landing page** — those requests reached nobody. New reviewer-only **⚠ No
student contact** lens on MAP Users, with a proposed contact per college.

- Cascade (`CPL Coordinator → CPL Assistant → CPL Counselor → Articulation
  Officer → Lead Initiator → Faculty Lead`) resolves **17 of 25**; the other 8
  are *asked*, never defaulted.
- **The governing rule, from Sam:** colleges are locally governed, so **every
  proposal is a person that college already designated in MAP.** We route; we
  never appoint. Leadership (VPAA/CEO) is deliberately *not* a rung.
- Contact sync **11 → 24 fields** after a probe found the view carried far more
  than we read. Public headline corrected to **2,657 users / 120 colleges**.

**② The governance starter** (#997, editable in #1000). Team-gated ⚖️ Governance
tab: decision rights, acceptance standards, cadences, open questions. **It measures
itself** — the register says the contact-refresh cadence was decided each semester;
the page reads `map_college_nudges`, finds zero rows, and prints **"never run."**
Owners are curated live into a separate `governance_owners` table that overlays the
committed register, so regenerating the JSON never wipes an assignment.

**②b The contact directory** (#1001/#1003/#1004). A 📇 lens with all five contact
columns and a CSV/Excel export, built for Jessica after Sam's steer: *a tab you
return to, not a spreadsheet that ages.*

**③ Team enablement** (#998). The guide + the standing obligations above.

Suite **185 files green**.

## Read these first (in order)

1. [`docs/map_users_lessons.md`](map_users_lessons.md) — the contact workstream.
2. [`docs/governance_lessons.md`](governance_lessons.md) — the governance
   diagnosis and the two design choices that made the register an instrument.
3. [`docs/kb-notes/methodology-route-to-a-determination-they-already-made.md`](kb-notes/methodology-route-to-a-determination-they-already-made.md)
   — read before touching the cascade.
4. [`docs/kb-notes/methodology-a-governance-artifact-must-measure-itself.md`](kb-notes/methodology-a-governance-artifact-must-measure-itself.md)
5. `CLAUDE.md` §11 (SkyMail) + §"Working with the MAP team".

## The priority work — all of it is waiting on people, not code

**① Fill the owner column** (Governance tab, OQ-01). Every `owner` is `null` by
design; who is accountable is the one thing a session cannot infer. Everything
else on that page waits on it. It's a review, not a writing task — deliberately.

**② Run the contact-refresh cadence once**, end to end, with a named owner. It
was decided in June 2026 and has never fired. The worklist it needs now exists.
*A cadence nobody runs is a document, not governance.*

**③ Work the 15 counseling blanks** (📇 Contact directory lens). All 71 colleges
without a CPL Assistant are now looked up: 56 have a counseling address, 15
publish nothing usable. **Start with Contra Costa and LA Harbor** — they publish
*only* a mental-health inbox, so the address a human would grab by eye is
actively the wrong door for a credit question. When a curator corrects one, flip
the entry to `via: "curator"` with their name and date (`FALLBACK_CONTACTS` in
`map_users.js`); the tab renders the difference.

**④ The 52 colleges that DO have a CPL Assistant have no counseling lookup** —
they were out of Jessica's scope. Same grind if wanted.

**⑤ Decide CIP's promotion criteria before the fall-2026 cutover** (OQ-03). TOP
is the cautionary tale of an input trusted by default.

**Carryover:** the **MAP "manage users" URL** (open since Session 87).

## Patterns that worked (reuse them)

- **Probe, don't ask a human to recall a spelling.** Sam knew the CPL Assistant
  field existed but not its label; a runner probe settled it in 90 seconds.
- **Measure before designing.** 17-of-25 came from wiring data we already had
  access to, not from clever logic.
- **Take the constraint seriously.** Sam's local-governance objection killed my
  nicest design and produced a stronger rule.
- **Answer strategy questions from the evidence you just collected.** The
  governance advice landed because it was five things that had happened that day,
  not a maturity model.
- **To audit a process, measure whether it ran** — don't read it. The nudge code
  was fine; the state said it had never been used.
- **A two-state detector is wrong about the middle.** The probe's real/fake gate
  hid sparse-but-real columns.

## Safety patterns to honor

- **MAP contact/user data never enters this public repo.** It lives only in gated
  Supabase. The sole exception is `FALLBACK_CONTACTS` in `map_users.js` —
  institutional addresses published on public .edu sites. A personal address
  would violate it.
- **`security_invoker = true` on `map_contact_gaps` is load-bearing.** Removing it
  publishes every staff email to the anon key. Verify by *reading as anon*
  (`set local role anon`), never by reading the policy.
- **MAP has no write API.** We propose; a human enters it in MAP.
- Sam runs concurrent sessions — re-read live tables before any bulk write.

---
title: "CIP Review — progress dashboard, editing access, and COCI submission (design note)"
date: 2026-07-18
tags: [cip, cobi, plan, adr, supabase, access-control, magic-link, coci, tech-center, side-lane]
status: proposed
related:
  - "[[cip_crosswalk_lessons]]"
  - "[[cip_crosswalk_handoff]]"
---

# CIP Review — progress, access, and submission (one-page design note)

Forward plan for turning the CIP Review tool from a per-department utility into a **statewide
rollout instrument**. Written for Sam to react to (SkyCoco, 2026-07-18). Three questions, one
shared backend: **how do we show progress**, **who may edit**, and **how do validated CIPs reach
COCI**. Side-lane doc — does not touch `kb/cpl_todos.json` or the numbered session handoff.

## 1. Two kinds of "counts" (the distinction that drives everything)

Sam's example — *"37 OK, 244 Review, Last Active 7-18-2026"* — blends two different data sources:

- **Engine baseline** — how many courses exist and how the *tool* classifies them (Ready / Review /
  Suggested / Manual). Deterministic, identical for everyone, no human input. **No backend needed.**
- **Human progress** — how many the faculty **validated** (`cipx_revok_`, #844) + **Last Active**.
  This is *work product*; today it lives only in one browser's `localStorage`. To show it per
  college / statewide / to anyone, it must live in a **shared store**. **Backend required.**

Keep these visually distinct — "engine says Review" ≠ "faculty validated." Mixing them under one
"OK/Review" label defeats the progress read.

## 2. Phase A — the baseline (backend-free) — **IN PROGRESS**

A build script (`kb/build_cip_status_counts.js`) runs the **shipped classifier** over every college's
courses via jsdom (single source of truth — no re-implementation) → emits `cip_status_counts.json`
(per-college + per-subject + system-wide Ready/Review/Suggested/Manual). The tab then shows, instantly:
- **college-open status boxes** (the whole college, before a subject is picked — Sam #1);
- **counts inline in both dropdowns** (college + subject — Sam #3, baseline half);
- a **statewide baseline line** ("~N courses · M to review across K colleges" — Sam #2, baseline half).

Precomputed because a live classify is a multi-second freeze per college and infeasible statewide
(~150k courses / ~50MB). Regenerate the JSON when the crosswalk / course / consensus inputs change.
**Phase A carries NO progress, no last-active, no auth — it's read-only baseline.**

## 3. Phase B — live progress + editing access + COCI submission (the backend)

One Supabase store powers all three. The parts:

### 3a. Progress store
A `cip_submission` table (per college × course): the **validated** CIP(s), who, when. Then the counts
become live progress ("48 validated of 281 · last active 7/18"), per college / per subject / statewide —
real rollout tracking. The tool writes here instead of (or alongside) `localStorage`.

### 3b. Editing access — the model (Sam's question, 2026-07-18)
**The real risk isn't "edits" — it's irreversible, unattributed, cross-college edits.** So design the
*defense in depth*, not just the lock:
1. **Scope (RLS):** a session for College X **cannot** write College Y's rows — enforced server-side,
   the way `is_allowed_reviewer()` / `team_pass_ok()` already gate the `cip_crosswalk_suggestion` table.
   The gate is the door; the DB is the lock.
2. **Attribution:** every change records who + when.
3. **Reversibility:** append-only / versioned — edits never overwrite, so any bad change is one-click
   revertible and auditable (the `kb_curation` INSERT-only + receipts doctrine, Rule 10, applied to CIP).

With those three, a leaked credential is a **contained, traceable, undoable** mess — not a fire — which
makes the front-door choice low-stakes:

| Option | Verdict |
|---|---|
| **Open ("just edit your own")** | ❌ One mistake → hard-to-undo cross-college damage. Rejected (Sam). |
| **COCI auth (button on COCI)** | Too narrow for the crowd — the faculty whose input you need lack COCI. **But perfect to bootstrap the one authorized *owner* (the college CIP coordinator).** |
| **Team phrase (`cip-canada-2026`)** | Good **MVP** (machinery exists: `team_pass_ok`). But a shared secret spreads, gives **no attribution**, and revocation is blunt (rotate → everyone out). |
| **Magic link** | Best **delegation**: the coordinator mints per-college links, sends to anyone at the college; link = capability scoped to that college; carries a light identity (name/email, no account) → attribution; individually revocable/expiring. Resolves the faculty-access tension. |

**Recommended layered model:** **owner** = college CIP coordinator, bootstrapped by COCI auth or a CO
grant (seed: `map_college_contacts`); **contributors** = anyone the owner invites by **magic link**
(college-scoped); **backend** enforces scope (RLS) + attribution + append-only/versioned. Ship the
**phrase as the MVP gate** (already built), layer in **magic links** for per-person attribution +
delegation before wide field release. Detail/decision: promote to `docs/kb-notes/adr-cip-editing-access.md`
once locked.

### 3c. Tech Center API/batch → COCI (Sam commissioned, "as this settles in")
Payload = the **validated set** (3a) — the human-gated codes, not the merely-assigned ones. Path:
faculty validate in the tool → land in `cip_submission` (Supabase) → a **human-gated** review by the
college owner → a **batch/API push to COCI** on the colleges' behalf (the Tech Center owns the COCI
CIP-dropdown data entry, per §7; confirm the ingest contract with Jenni / the Tech Center). Spares
colleges from entering codes course-by-course. Write the short Tech-Center-facing plan from this once
the store shape is agreed.

## Sequencing
**A (now, no backend) → B-progress store → B-access (phrase MVP → magic links) → B-COCI push.**
A is independent and shippable today; B is the moment you commit to a shared backend — which you want
anyway for COCI submission, so access + progress + submission are one project, built once.

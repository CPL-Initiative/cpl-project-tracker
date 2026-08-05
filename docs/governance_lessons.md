---
title: Governance & team enablement — lessons
date: 2026-08-05
tags: [governance, decision-rights, ways-of-working, ai-team, onboarding]
artifacts:
  - governance.js
  - kb/governance_register.json
  - docs/working_with_claude_code.md
  - tests/governance.test.js
related:
  - "[[docs/kb-notes/methodology-a-governance-artifact-must-measure-itself]]"
  - "[[docs/kb-notes/methodology-route-to-a-determination-they-already-made]]"
  - "[[docs/map_users_lessons]]"
---

# Governance & team enablement — lessons

Workstream scratchpad. Append a dated section per checkpoint.

---

## 2026-08-05 — Session 120 (SkyMail): the governance starter + the team guide

### How this started

Sam asked, mid-session: *"What do you suggest to establish or improve our
governance?"* — after the MAP Users work, not before it. That ordering is the
whole reason the answer had any substance. I'd just spent a session hitting
concrete problems, and the diagnosis wrote itself:

| Looked like | Actually was |
|---|---|
| 25 colleges with no student contact | Nobody owned that field |
| Contacts view had 24 fields, we read 11 | Nobody owned knowing the source |
| Test colleges in the public headline | Nobody owned the definition of "a college" |
| Disciplines rendering as one 1,364-char cell | Nobody owned the format contract |
| Jessica knowing things no system held | Nobody owned capturing curator knowledge |

**Every one of them was a governance gap wearing a data-quality costume.** None
was a bug in the ordinary sense; each was *"no one had a decision right or an
obligation here."* Advice grounded in five things that actually happened that day
landed very differently from a generic maturity model — Sam's reply was
*"Excellent, if uncomfortable, guidance."* The discomfort was the signal that it
was specific enough to be useful.

**Lesson: don't answer a governance question in the abstract when you have just
finished collecting evidence.** The evidence *is* the answer.

### The design decision that matters

A governance page is, by default, the most useless kind of document: a
description of intentions that drifts silently from reality and that nobody
re-reads. Two choices made it an instrument instead.

**1. Store the reasoning; measure everything else at render time.** The register
holds allocations and rules. Any *fact* the page could be wrong about is computed
live from the gated tables. The sharpest instance: the register says the
semester contact-refresh cadence was **decided** (Session 87). The page reads
`map_college_nudges`, finds **zero rows**, and prints **"never run."**

That single line is the most actionable thing on the page — and it exists *only*
because the number is measured rather than asserted. Had "state" been a stored
string, it would have said "semester" forever and the page would have been a
polite lie.

**2. Render the absence.** Every `owner` field ships as `null` and displays as
**"needs an owner"** in red, counted in the headline stat. Who is accountable on
*our* side is the one thing a session cannot infer from data. Leaving those blank
would have made the page look finished; showing them as gaps makes it a meeting
agenda. The Copy-as-Markdown export preserves both markers, so it stays honest
when it leaves the tab.

### The uncomfortable finding

The cadence had been **decided in June and never run once**. The nudge
instrument, the recipient picker, the last-nudged log — all built, all working,
zero rows.

That reframed my whole recommendation. The constraint was never tooling. **A
cadence nobody runs is a document, not governance**, and the fix is to run one
loop end-to-end with a named owner before designing any more. I'd have missed
this entirely by reading the code, because the code was fine. It only showed up
because I queried the *state*.

**Lesson: to audit governance, don't read the process — measure whether it ran.**

### Team enablement — and why the guide is the weaker half

Sam asked for onboarding material as the team grows (Ashley, Jessica, Malone;
an enterprise account coming). He supplied the best content himself, in a Teams
message to Ashley: ask for an HTML visual and iterate live; think of it as *a
tool you come back to, not a one-time Excel sheet*; ask for a COBI tab when you
like what you see.

I wrote the guide — and then wrote the more important half, which is that **the
same material belongs in `CLAUDE.md` as session obligations.** The reasoning:

> A habit that depends on a new user remembering it will fail on their first day.

Ashley shouldn't have to read a document to get attribution on her contributions
or a warning before a cross-impact write. The session should just do it. The
guide is for people who want to get *better*; the standing rules are what protect
people who haven't read anything.

### On agents — recommended NOT yet

Sam floated *"maybe need some established agents who are mindful of these
things."* I pushed back, and the reasoning generalises:

**An agent must be invoked, so it fails precisely when someone forgets — which
is the failure mode being designed against.** Standing instructions load
automatically, every session, including the first one a new person runs.

The allocation I recommended:

| Need | Tool | Why |
|---|---|---|
| Always-on habits | Standing instructions | Can't be forgotten |
| A deliberate ritual | Slash command | One keystroke, repeatable |
| A procedure for one kind of work | Skill | Loads only when relevant |
| Parallel or adversarial work | Agent | A genuine second opinion |

The one agent worth building later: a **cross-impact reviewer** — *what else
reads this, who is mid-flight, does this touch restricted data or the public
site.* That's the thing a single session is structurally worst at being honest
about, because the session is the one that wants to ship. Adversarial review is
what agents are actually for; habit enforcement is not.

### Current state

- **Governance tab** live under Sierra & Team Tools, team-gated (#997). 10
  decision rights, 8 acceptance standards, 5 cadences, 6 open questions — every
  owner deliberately unset.
- **`docs/working_with_claude_code.md`** + a `CLAUDE.md` "Working with the MAP
  team" section (#998).
- `tests/governance.test.js` (34); full suite 185 files green.

### Next concrete step

1. **Fill the owner column.** Six open questions are in the tab; OQ-01 (who owns
   each row) is the one everything else waits on. It's a review, not a writing
   task — that was deliberate.
2. **Run the contact-refresh cadence once**, end to end, with a named owner. It
   is the only loop on the page that has never fired, and the worklist it needs
   now exists.
3. **Decide CIP's promotion criteria before the fall 2026 cutover** (OQ-03).
   TOP is the cautionary tale of an input trusted by default.
4. **Cut the load-bearing list** (OQ-05) — I marked 8 of 10 as load-bearing,
   which is almost certainly too many. Governing everything is how governance
   dies.

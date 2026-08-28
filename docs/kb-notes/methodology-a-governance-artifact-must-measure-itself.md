---
title: "Methodology — a governance artifact must measure itself, and render what it lacks"
kb-status: published
created: 2026-08-05
updated: 2026-08-05
session: 120 (SkyMail)
tags: [methodology, governance, decision-rights, instruments, honesty, accountability]
related:
  - "[[docs/kb-notes/methodology-register-is-the-spine-narrative-cites-it]]"
  - "[[docs/kb-notes/methodology-dormant-asset-worklist]]"
  - "[[docs/governance_lessons]]"
---

# A governance artifact must measure itself, and render what it lacks

## The failure mode

Governance documents fail in a specific, predictable way: they describe
intentions, drift silently from reality, and are never re-read. Six months on,
the page says a review happens quarterly and nobody can tell you whether one ever
did. The document isn't wrong on purpose — it just has **no mechanism by which it
could become wrong out loud.**

Two design rules fix most of it.

## Rule 1 — store the reasoning, measure the facts

Split the artifact:

- **Stored:** allocations, rules, rationale — the things that are true because
  someone decided them. These change only when a human changes their mind.
- **Measured at render time:** anything checkable against the system. Never
  stored, because a stored fact is a fact that can quietly go stale.

The test for which side something belongs on: **could this be false without
anyone editing the file?** If yes, it must be computed.

Worked example. A register recorded a contact-refresh cadence as *"decided:
each semester."* The page reads the nudge log at render time, finds **zero rows**,
and prints **"never run."** Had `state` been a stored string it would have read
"semester" indefinitely and the artifact would have been a polite lie. That one
computed line turned out to be the most actionable fact on the page — the
instrument existed, was working, and had never once been fired.

Corollary worth internalising: **to audit governance, don't read the process —
measure whether it ran.** Reading the code would have shown a healthy nudge
system. Only querying the state revealed it had never been used.

## Rule 2 — render the absence as loudly as the presence

The instinct is to ship the artifact looking complete. Resist it. **Unfilled
fields should be visible, styled as gaps, and counted in the headline.**

In the worked example, every "who owns this" field shipped deliberately `null`,
rendering as **"needs an owner"** in red with a count in the summary stats. That
was not laziness — who is accountable is precisely the thing an automated pass
*cannot* infer from data, and the only person who can fill it is the reader.

Blank cells make a page look finished. **Marked gaps make it a meeting agenda.**
The distinction decides whether anyone ever acts on it.

Two supporting details:

- **Preserve the markers on export.** If the page has a copy/share affordance,
  the "needs an owner" and "never run" markers must survive into the exported
  text — otherwise the artifact is honest on screen and flattering in the room
  where decisions get made, which is exactly backwards.
- **Test the honesty properties directly.** Write assertions for *"a cadence with
  no recorded runs reports never-run"* and *"an unowned row renders visibly."*
  These are the properties that decay first under later edits, because every
  future contributor feels mild pressure to make the page look better.

## Why this generalises

Any artifact whose job is to describe the state of a system — a governance
register, a runbook, a compliance page, a service catalogue, a RACI — has the
same structural weakness: it is a *claim about a system*, stored *outside* that
system. Wiring the checkable parts back to the system is what converts it from a
description into an instrument.

And an instrument that reports uncomfortable things is the only kind worth
having. The measure of a good one is that its first run tells you something you
didn't want to hear.

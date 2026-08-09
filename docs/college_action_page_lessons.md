---
title: College action page & MAP-team queue — lessons
created: 2026-08-09
updated: 2026-08-09
tags: [lessons, college-action-page, map-team-queue, governance, contacts, measurement]
artifacts:
  - map_team_queue.js
  - kb/map_team_tracked.json
  - kb/supabase_sierra_feedback_ci_status.sql
  - tests/map_team_queue.test.js
  - tests/sierra_feedback_ci_rows.test.js
related:
  - "[[docs/kb-notes/methodology-a-written-backlog-decays-silently]]"
  - "[[docs/kb-notes/methodology-a-sweep-scoped-by-a-proxy-leaves-a-shadow]]"
  - "[[docs/session_132_handoff]]"
---

# College action page & MAP-team queue — lessons

The workstream Sam framed as **one engine, two audiences**: colleges need *what
should I do next* (a briefing, leads with opportunity); the MAP team needs
*what's waiting on me* (an inbox, leads with age). This doc is the scratchpad
for both halves. Append a dated section every checkpoint.

---

## 2026-08-09 — SkyTime / SkyDesk (Session 131): the inbox half, and why it measures

### What shipped

- **#1072** — CI smoke rows no longer enter the Sierra feedback queue. Fixed at
  the **write path** (`sierra_feedback_upsert` stamps `status='ci'` when
  `page='smoke'`), not at display time. 43 existing rows backfilled. Queue went
  from a 66-row headline to **23 real open · 4 addressed · 43 CI**.
- **#1073** — the **📥 MAP Team Queue** tab. `buildQueue()` is a pure engine
  (sources + `now` in, ranked items out) intended for reuse by the college half.

### ⭐ The finding that set the design

The session-130 handoff carried the MAP team's backlog as prose. Measuring all
six items first — about fifteen minutes of SQL — found **two already wrong
within two days**, and a third wrong in a way that mattered more:

| Handoff | Measured 2026-08-09 |
|---|---|
| "every governance owner unset" | **17 of 17 assigned.** Team filled them Aug 5 + 7 |
| "6 open Sierra feedback rows" | **23** real (9 thumbs-down) |
| "56 proposed contact fills" | **14.** 42 of the 56 are colleges MAP already covers |
| "15 unroutable colleges" | **11**, only **4** looked-up-and-empty |

The governance row is the sharpest: that register's own **OQ-01** asks *"who owns
each row above?"* and it had been **answered by people, in the system**, while
the document still listed it as the outstanding work. Distilled into
`methodology-a-written-backlog-decays-silently`.

**So the tab's one rule is: measure at load, never carry a list.** Items with no
live source live in `kb/map_team_tracked.json`, rendered separately **with their
staleness**, so an unconfirmed item looks unreliable rather than authoritative.

### ⭐ The seven colleges nobody had looked up

The contact sweep scoped to *"colleges without a CPL Assistant"* — a **proxy**
for the actual need, which is *"colleges where `primary_contact_email` is
blank"*. The two come apart on **7 of 25 rows (28%)**:

```
no primary_contact_email                25
  ├─ swept, contact found               14   → proposal waiting on the MAP team
  ├─ swept, nothing usable              4    → needs a human
  └─ NEVER SWEPT                        7    ← Citrus · College of the Canyons
                                              · Palomar · Saddleback · Yuba
                                              · Futuro Health · Launch Apprenticeship
```

Having a CPL Assistant does not mean MAP can route a student — different fields,
different people, different times. These are the **cheapest** items on the whole
backlog (one lookup each) and they were invisible because the sweep's artefact
counted its own batch, not the population. Distilled into
`methodology-a-sweep-scoped-by-a-proxy-leaves-a-shadow`.

### Two properties the tab turns on

- **A failed read is not an empty queue.** A source that doesn't load renders
  `unknown` and sorts to the **top** — never `0`. Collapsing those is how a
  queue quietly reports itself clear from data it could not fetch.
- **A cleared item stays visible, marked clear**, so "nothing waiting" and
  "nothing measured" never look the same.

Both are the same family as the `STUDENT GRAIN LEAKED` false positive SkyMind
shipped at a PostgREST timeout, and both have positive controls in the test.

### What I got wrong

Two assertions in `tests/sierra_feedback_ci_rows.test.js` failed on first run,
and **both were my assertions, not the code**. The instructive one: the SQL
check `/on conflict[\s\S]*?set[\s\S]*?status\s*=/` ran past the function body and
matched step 3's legitimate backfill — the *proxy-instead-of-property* mistake
`methodology-a-guard-that-fails-on-truth-gets-muted` describes, committed while
that note was open in the same session. Fixed by scoping the match to the
`ON CONFLICT` clause and adding a positive control that the clause still updates
`rating`/`note`/`audience`, so a regex matching nothing cannot pass.

Also: I wrote `CPL_TABS.show()` from memory. The real API is `navigate()`. It
would have failed **silently** into the hash fallback, which half-works — caught
only by grepping `tabs.js` before committing.

### Current state

The queue reads, against live data:

```
23  39d  Sierra reports untriaged        person waiting
14   4d  proposals for the MAP team      person waiting
 7   4d  colleges never looked up        person waiting
 4   4d  nothing usable found            person waiting
 1   2d  cadence decided, never run
 3   2d  hand-tracked (Malone's view name + 2)
 0   2d  governance owners — CLEAR
 1   1d  data age — clear
```

### Next concrete step

**The college-facing briefing**, on the same `buildQueue()` engine with
college-scoped sources and an opportunity-first renderer. Design calls already
made and not to be re-derived: open with a **rendered briefing, not a blank chat
box**; role is a dropdown that **tailors but never gates**; the **action library
is the hard part** — seed it from the IFM P1/P2/P3 strategies rather than
inventing to-dos; the $35M priorities are **read at runtime** from
`cpl_funding_data.js` ⊕ `cpl_funding_config`, never pasted.

⚠️ Its top slot — **inbound CPL requests** — needs the nightly feed, which is
blocked on Malone's view name. That blocker is now item 6 on the queue, aging in
public where somebody will see it.

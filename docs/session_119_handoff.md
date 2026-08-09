---
title: Session 119 handoff — the Noncredit / Learning-Partner instrument is live; go work it (and the CCR mainline is still open)
date: 2026-08-05
tags: [handoff, noncredit, learning-partners, cpl, ccr, esl, packaging]
related:
  - "[[docs/noncredit_cpl_lessons]]"
  - "[[docs/noncredit_cpl_thinking]]"
  - "[[docs/session_118_handoff]]"
  - "[[kb/nc_learning_partners.json]]"
superseded: true
superseded_by: session_132_handoff.md
---

# You are Session 119.

Sam (MAP@rccd.edu) runs the **CPL Initiative**. Session 118 was **SkyPartner** — a
side-lane that turned a cold research ask into a shipped, live instrument in one day:
the **Noncredit & Learning-Partner CPL** workstream (#981–#989, all merged).

⚠ **Two lanes are open. Read both, then ask Sam which he wants.**
- **This lane (new):** noncredit / Learning Partners — thinking doc + live tab + write
  layer are DONE; what's left is *using* them.
- **The CCR mainline (still open):** `docs/session_118_handoff.md` — ESL apply →
  batch-apply → the other packaging dry-runs. **That handoff was NOT superseded**; this
  session simply didn't touch it.

Claim a moniker (the "Sky…" family is current — **SkyLever**, **SkyLight**, or coin
your own).

## Read these first, in order

1. **This file.**
2. **`docs/noncredit_cpl_thinking.md`** — the workstream's brain (~1,530 lines). If
   you have ten minutes: **§0** (why it exists) → **§7a** (the five data findings) →
   **§4** (the scalability ladder) → **§12** (ranked next moves).
3. **`docs/noncredit_cpl_lessons.md`** — the 2026-08-05 section: what was learned,
   current state, roadmap, next step.
4. **`kb/nc_learning_partners.json`** — the register the tab renders (6 modes,
   12 use cases, 9 opportunities, 10 questions).
5. Durable notes from this run: `methodology-dormant-asset-worklist`,
   `methodology-register-is-the-spine-narrative-cites-it`,
   `adr-notes-alongside-the-curated-register`.

## What shipped

| PR | What |
|---|---|
| #981/#982/#983/#984 | `docs/noncredit_cpl_thinking.md` — built over four passes as Sam fed in decks, the monograph, and answers |
| **#985** | **Noncredit & Learning Partners tab** — 5 collapsible sections, jump links, expand/collapse-all, report generator (Copy · MD · Word · Print) |
| **#987** | Narrative **`[[ITEM-ID]]` cross-references** → open section, clear blocking filter, scroll, flash |
| **#988** | **Write layer** — ✎ Add insight on every card; supersede RPC; promotion packet |
| **#989** | Schema **applied** to `hvuwhnbuahrtptokpqfh`; repo copy synced to what actually landed |

Tests: `tests/nc_learning_partners.test.js` — **82**. Full suite 184 files green.

## The findings that should drive your work

- ⭐ **49 dormant statewide exhibits across 252 college-slots.** Only **30 of 84**
  statewide exhibits have EVER converted a unit — **64% have not.** CompTIA Linux+ is
  live at 16 colleges and has never produced an award. CDCR/CPOST (Rising Scholars)
  sits at 11. **This is the cheapest volume in CPL — the expensive part is done.**
- ⭐ **The four standalone noncredit institutions are at ZERO** across 1,987 credential
  titles, while ~48 entries name a specific high school. The hardest partner lane
  populated itself; the easiest is empty. **Nobody has done the data entry.**
- ⭐ **27 CCCs teach dental assisting; ONE awards RDA CPL** (West LA, 99.5%
  conversion). 26 named targets.
- **EMT converts at 75.6%** across 28 colleges — so EMS Corps is an **outreach** play,
  not an articulation-building one.

## Priority workstream — ranked by value ÷ effort

1. **Populate the 4 standalone NC institutions in MAP** (NOCE · SD Cont. Ed ·
   Mt. SAC NC · Calbright). Data entry. Unblocks every partner-recognition mechanism.
   Start with the NOCE five (Google IT Support, ECE, Electricity, Medical Assisting,
   Pharmacy Technician).
2. **EMS Corps landing page + 500-alumni outreach.** Chancellor-endorsed publicly.
   Keynote slide 20 is already the prototype (6 pathways). The page *is* the outreach
   vehicle — one link to 500 alumni.
3. **Work the dormant list** — it's live in the tab and self-refreshing.
4. **Write the mirroring playbook** — the lead recommendation has no artifact.
5. **The 26-college dental list** — named outreach, no build needed.

## Carryover + status

| Item | Status |
|---|---|
| 6 **"Needs Input"** items in-tab | **OPEN** — answerable in place now. Biggest: **HS-articulation scale** (sizes the largest-volume lane; nothing in the repos carries it) |
| 4 **"Needs research"** items | Open — the top one: *does any CA noncredit program run an instructor-guided portfolio course against CCC CPL opportunities?* If nobody does, it's the flagship proposal |
| Funding metric | **PARKED by Sam** — "don't get caught in the weeds until we have a clear grasp of the moving parts." §11 is a holding pen, not a recommendation |
| Public-facing view of the tab | Sam: "private now, field-facing later." Data shapes are already partner-safe |
| Promotion packet + Word export | Shipped but **least-exercised** — no real data ran through them yet |
| CCR mainline | Untouched this session — see `docs/session_118_handoff.md` |

## Patterns that worked

- **Prototype in an artifact, then port** (the repo convention). It caught a real bug
  pre-ship: the renderer used `--brand`/`--text`/`--link`, none of which exist in
  COBI's First Light palette.
- **Ask the setup questions first.** Four picker questions settled terminology,
  funding framing, recognition ambition, and deliverable shape — no rework after.
- **Mark confidence inline** — ⟨sourced⟩ / ⟨inferred⟩ / ⟨**NEEDS SAM**⟩. It's what
  made an unverifiable figure catchable instead of repeated as fact.
- **Re-verify arithmetic after drafting.** Re-running the FTES math caught two wrong
  table rows; the correction made the finding *stronger*.

## Safety patterns to honor

- **Rule 4** — the tab's nav/pane/boot are mirrored in BOTH HTMLs. Verify identical.
- **Rule 9c** — Supabase only via the **MCP**. Never a direct connection.
- **Verify after applying, don't assume.** Assert inside `DO` blocks so a failure
  *throws*. Test a read gate by seeding a row and confirming anon reads **0**.
- ⚠ **Never write to the public `cpl-knowledge-base`.** It changes only through its
  own `CURATION.md` human-reviewed draft PR. The promotion packet targets tracker
  lanes and says so in its own text — keep it that way.
- **Post-squash conflicts:** rebuild the branch on current `main` and re-verify;
  don't force-resolve.

## Terminology Sam settled (honor these)

**"Learning Partners"** for the actors; **"credit-eligible learning"** for programs;
**noncredit / not-for-credit** for the precise CCC categories. ⚠ **"feeder" is a code
field name only** — never external prose. **"Needs Input,"** not "Needs Sam."
**Answering never closes, just revises.**

## Next concrete step

Ask Sam which lane. If it's this one: **populate the four standalone noncredit
institutions**, and get the **HS-articulation scale** answer into `Q-1` in the tab.

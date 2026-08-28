---
title: "Governance & team enablement — lane state"
created: 2026-08-28
updated: 2026-08-28
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Governance & team enablement

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** Decision rights (who decides what), acceptance standards per input, and which cadences actually run — plus onboarding as the team grows past Sam.

## Status

✅ **LIVE — team-gated ⚖️ Governance tab: 18 decision rights · 8 acceptance standards · 5 cadences · 8 open questions** (SkyMail #997/#998; Sierra added SkyMiner #1031/#1034/#1036; expanded 12→18 SkyGate). **Every `owner` is deliberately unset — filling them IS the review (OQ-01).** The register **measures itself**: the contact-refresh cadence was decided in June and has never run (0 rows in `map_college_nudges`), and CA-06 measured Sierra feedback at *21 of 25 untriaged* until **Sam cleared the whole queue 2026-08-26 — 0 still to do, 51 of 51 handled**. Owners live in a separate gated `governance_owners` table overlaying by row id, so regenerating the JSON can never wipe an assignment; no delete policy (so `Clear owner` is a no-op on the 3 cadences carrying a register-file owner — the likeliest thing to be mistaken for a regression; 7 more reported defects unfixed). **DR-11** records what Sierra tells the public — honestly noting the decider has been Sam personally. **DR-13…DR-18** (SkyGate) cover the six surfaces nobody had recorded: **the workplan itself** (the most public artifact the project has, four tables editable in-page, no named owner), phrase rotation, contracts, CPL News, the Common CR Reference, TMC submissions. **Drift detector live + wired to the cron** (step 4a0): pure static analysis over 4 surfaces, **proposes, never auto-adds**; queue now **7**, all scheduled workflows nobody has listed as cadences — each needs a row or a reasoned dismissal. **Do not bulk-dismiss; the reason is the point.** ⚠️ A false stale flag was a **detector bug** (`\b` cannot match before a dot, so `.github/…` read as missing) — fixed with a negative lookbehind. `governance.test.js` **91/91**. **Promote-from-candidate NOT built** (needs judgment fields typed by a human). **Agents: recommended NOT yet** — an agent must be invoked, so it fails exactly when a new user forgets; standing instructions can't be. **Next:** ① fill the owner column, DR-13 first; ② run that cadence once end-to-end with a named owner; ③ decide CIP's promotion criteria BEFORE the fall-2026 cutover (OQ-03); ④ cut the load-bearing list — 8 of 10 is too many. Team guide: `docs/working_with_claude_code.md`.

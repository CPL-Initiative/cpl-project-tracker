---
title: "Org & phrase scope / auth model — lane state"
created: 2026-08-28
updated: 2026-09-19
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# Org & phrase scope / auth model

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** Which sites exist, which phrase opens which, and whether shared phrases survive at all.

## SkyView is the lane's first PUBLIC surface (2026-09-19)

⭐ **A fourth answer to "which credential opens what" now exists, and it is
`none`.** Every other surface in this lane assumes a holder — a phrase or a
reviewer session — and asks which one. `prototype/skyview.html` is the first
page deliberately shipped to people with **no credential at all**. Sam:
*"My goal is to allow public read only SkyView access but prevent any actions
to be taken that would edit or access views where edits could be done."*

That inverts the usual question. Elsewhere the work is deciding what a holder
may reach; here it is enumerating everything a NON-holder can reach and
subtracting whatever edits. Three doors were open and none was in a menu:

1. **The hash.** `#comprehensive`, `#disciplines`, `#subjects`, `#esl`,
   `#work/<discipline>` routed with no check. A gated menu item with a live URL
   behind it looks correct in a screenshot and is not a gate.
2. **A second file.** `ccr_atlas_graph.js`'s `__ccrDecision` is a complete
   drag-to-move curation surface that `curationRung()` had never seen, because
   the single-decider guard only ever read `ccr_universe.js`. ⚠️ **A
   single-decider guard is only as wide as the files it reads** — worth
   carrying into the role-column work below, where the same claim will be made
   about policies rather than modules.
3. **Markup that paints before its own gate runs.** The static `u-ro-line`
   banner hardcoded a COBI link, so the first frame of the page Sam shares
   outside the team offered a door underneath the sentence saying the reader
   was read only.

⚠️ **THE SKYVIEW RUNG IS A CONVENIENCE GATE AND CHANGES NOTHING ABOUT RLS.**
Withholding a view removes the OFFER. `pages.yml` serves `prototype/` and COBI
alike, so an address still walks in, and the **12 of 29 Everyone-rung tabs that
render live internal data to a signed-out reader** are untouched by any of it —
that remains RLS or the [public/private split](public-private-repo-split.md).

⚠️ **ONE CREDENTIAL COVERS BOTH PAGES, AND READERS DID NOT KNOW.** `cpl_sb` and
`cpl_team_pass` are `localStorage` keys and SkyView and COBI are the **same
origin**, so a phrase entered on either is held on both. Sam asked directly —
*"I'm not sure if I'm also signed in on COBI main page"* — which is a sign the
model is right and was simply never stated on screen. SkyView's band says it
now. Any future surface in this lane should assume the same question gets asked
again and answer it in place.

Ladder detail, the rung table and the gating mechanics:
[`skyview-ccr-interface`](skyview-ccr-interface.md).

## Status

🔨 **MEASURED + RECOMMENDED, NOT BUILT** (Sky160, Sky168, Sky169). ⭐ **RECOMMENDATION: magic link + ONE `role` column on `allowed_reviewers` — explicitly NOT groups.** Sam re-opened his own 2026-08-14 ruling (*"I want to keep things stupid simple"*, `cpl_memory` `sam-roles-not-groups-keep-the-phrase`, verified). Measured: magic-link ALREADY covers more of COBI than phrases — **132 policies** call `is_allowed_reviewer()` vs **83** calling `team_pass_ok()`, and **31 modules** read a reviewer session vs **22** sending `x-team-pass`. So the question is only whether the phrase half survives. One role per person (admin/team/gr/fin); **the 132 reviewer policies do not change**; transition accepts EITHER a session OR a phrase so nothing goes dark; retire `ci` first (it protects nothing), then `gr`, `fin`, `team`. ⭐ **The scaling proof is our own KB note** `exclusive-surface-scopes-a-shared-credential`: a shared credential can only scope to a surface exclusive to ONE group, and exactly **2 of 34** COBI tabs qualify — so every phrase is structurally a **superset**. ⚠️ **Phrase STRENGTH is not the weakness** (measured by shape: all four are 12–13 chars, mixed case, digits + symbols); the weaknesses are **no identity on writes, no per-person revocation, silent spread**. ✅ **Reviewer roster 5 → 10 (2026-08-19)** — Ashley, Jessica, Malone, Kristen (rccd.edu) + **Pedro Campos (ITPI CEO), the first EXTERNAL-domain reviewer**, added on Sam's explicit confirmation. This closed the gap where team members named in this file were working through shared phrases because nobody had added them. ⚠️ **Reviewer is ALL-OR-NOTHING and that now has teeth** — beyond any phrase it reaches `map_student_credit` (**537,908 rows, STUDENT GRAIN**), `map_student_credit_prev` (220,588), `kb_curation` (32,441), the `gr_*` register, and **`team_access` itself — so a reviewer can read and rotate every team phrase**. A partner who needs `kb_curation` also gets student-grain data; that is the concrete case for the role column. Revocation is one DELETE per row. ✅ **GR phrase scoped** (`team_pass_check()` excludes `gr`, #1239) — residual: a GR-only holder needs the `team` phrase. **Finance stays parked** (genuinely shares 6 of 42 tables). **NEXT: Sam's go on the role column.** Measurement: [`docs/phrase_scope_analysis.md`](docs/phrase_scope_analysis.md); story [`docs/auth_and_repo_posture_lessons.md`](docs/auth_and_repo_posture_lessons.md).

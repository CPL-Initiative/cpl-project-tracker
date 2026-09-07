---
title: "SkyView — the smaller backlog"
created: 2026-09-07
updated: 2026-09-07
tags: [reference, skyview, ccr, backlog]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
related:
  - "[[docs/reference/lanes/skyview-ccr-interface]]"
---

# SkyView — the smaller backlog

> Moved out of the lane file on 2026-09-07 (S237), which had reached 1.7x its
> 12,000 B budget. The lane keeps the **priority** and the **invariants**; this
> holds the queue behind them. The lane carries the pointer, because a store
> nobody names is a store nobody finds.

① **The outline's skills layer — UNBLOCKED, now a fetch problem.** Ruling 1
settles the precedence: **published agency standard is the text of record; an
ACE exhibit fills a gap it leaves and never overrides it; the MAP team overrides
either, attributed and dated**; a genuine conflict shows **both, each named**.
⚠️ We hold none of that text — 1,987 credentials classified, 64 welding, **zero
carrying a skill field**. Pilot: an AWS welding certification.

①b **The curate phrase — ruled, not built.** **One phrase gates anything that
leaves the browser**; reading stays open. ⚠️ First write from this surface, so
Rule 10 a3 routes it through Governance and the privacy ADRs before it ships.
DR-24 (owner Sam) governs the skills layer's writes.

①c **The CPL face, after S238 — the smaller asks.** The 55 crosswalk exhibits
not in today's feed (`kb/_build_ccr_cpl.py` prints them; flagged `s:1` on the
surface) are a worklist for the crosswalk's next re-seed, not a drop. The funnel
sidecar `kb/ccr_cpl_funnel.json` is a dated hand read — refresh it after the
next `map-custom-report-load.yml` run (the daily run cannot reach the table).
"Held by N colleges" on the face is the crosswalk's `earned_by_colleges`; the
funnel's per-exhibit college count (any course) is a different number and is
not shown. A CPL face for the **comprehensive view's panes** and the workspace
tables (a credentials column) is unbuilt.

①d **The globe prototype (Sam, 2026-09-07: "build it!").** A throwaway,
`docs/visuals/2026-09-07-skyview-globe-prototype.html` — three.js r128 from cdnjs, the committed layout wrapped onto a
sphere (x to longitude, y to latitude, islands as spherical caps), the
Articulations light, an Outside view and an Inside (planetarium) view, and a
line counting the points that face the reader: 25,580 of 49,896 at the opening
view — a hemisphere, which is the whole argument. Its data is a snapshot
inlined at build time from `prototype/ccr_universe.json`; it reads no live
payload and the daily run does not rebuild it. Nothing in `ccr_universe.js`
was touched. What a port would have to re-earn is the lane's invariant list:
the drop hit-test on a curved surface, the label placer, the keyboard path,
fixed-size text under zoom, `prefers-reduced-motion`, and the a11y run. NEEDS
SAM ⑧ decides whether any of that is wanted; artifact https://claude.ai/code/artifact/51f5249d-1884-406d-889e-259b262b86e5.
**Second round (same day).** Sam's reaction — *"I like the globe view! Love the
glow on the articulations"* — came with five asks and, from a screenshot of the
inside view, a sixth: the inside looked "globby" because every dot sat at the
same distance and got the same size, and the camera stopped at 110°. The build
answers each as a control on the page: **Spread | Committed** (the islands
relaxed apart on the sphere in `globe_layout.py`, no overlaps at 60% of the
first round's scale, a mean move of 7°, the biggest 23°), **Round | Wrapped**
(a round cap and its courses on the surface, against the flat disc wrapped —
2.2 to 1 at the equator), **M-ID color** chips (White by default, plus a custom
picker), a turn a third as fast, and **Inside** as an all-sky projection
(azimuthal equidistant in the vertex shader, 30° to 360° across, stars sized in
pixels, labels as real text that drop rather than stack, hover by angle). Sam's
own read of the ovals: *"maximizes sky space... but perhaps if you adjust
downward the relative size of your entities, circles might work. Since we can
zoom almost infinitely, nothing lost."*
**Third round (same day).** Sam's second reaction — *"Better! Tweak:"* — asked
for proximity by CTE versus academic, full use of the blank areas, the inside
view's finer dots in both views and the inside view filling the window like the
night sky (*"this may turn out to be the best view!"*), and Silver M-IDs; then
*"Rotation speed is nicer now"*, *"we don't need the wrapped option"*, and Day
versus Night with faint clouds. Built: **By kind** — the island centers relaxed
into two regions of the sphere sized by each kind's share of the cap area (CTE
101° from its pole), the mixed and unread islands riding the boundary, a
stronger even-spreading term so no blank patch is left; the kind is read from
TOP's one sanctioned use, `kb/reference/top_categories.json`'s CTE flag on each
identity's TOP code, as a share per discipline (0.6 or more CTE, 0.4 or less
academic: 97 · 50 · 12). **Inside** is a stereographic window (30° to 240°
across; round islands stay round; the count line tests every point against the
window). Both views size a dot in pixels. **Day** is a tint of the CO blue with
value-noise clouds, drawn once, ghosted; on the globe's body by day, over the
window inside. Two region names ride the sky. Committed and Spread stay one
click away; Wrapped is gone.

② **The re-mint approval queue** — routed through Governance
([`adr-remint-approval-queue-decision-rights`](../../kb-notes/adr-remint-approval-queue-decision-rights.md)),
not built: a register row owning the approval, the surface mapped in
`kb/governance_surface_map.json` at the first write, INSERT-only rollback, a
test asserting it writes approvals and nothing else.
③ **Decision packs per discipline, fetched on demand** — the bottleneck behind
every UI tweak; the shards' publish path is the template.
④ The drag that leaves SUBJ4 inconsistent queues a re-mint candidate — proposes,
never auto-adds.
⑤ The 73 two-real-course control numbers · the member-roster fold at source
(`CaÃ±ada College` ×678) · accept-all-orbits-above-a-score · the 67 `ESOL Z####`
rows and `FIMS M1018` (needs an un-merge verb) · a tool for the 3,001 with no
discipline.
⑥ **A description signal for the rim** — 1,600 of 2,073 rim courses have a
description; TF-IDF places ~130 well and agrees with the title-based parent only
20% of the time. A gap-filler that never outvotes a title.
⑦ Dropdown labels that name the grain on the CCR tab.
⑧ **After the fold:** the promote step is BUILT (`kb/_uc_cur_promote.py`); seven
held rows move on a second signal; the identities map's ghost keys have a dry run
and a receipt awaiting Sam's sheet.
⑨ Identity-level chips once members are classified.

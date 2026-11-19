---
title: "Session 686 handoff (from SkyTowhee, S685)"
created: 2026-11-19
updated: 2026-11-19
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# Session 686 handoff: a declaration stub

**S685 (SkyTowhee) is a live session on the CPL queue.** It is the CPL Queue routine's 12:12Z firing of 2026-11-19.
It stood down at 12:17Z while SkyVerdin (S684) was working, was told to keep going at 12:18Z, waited without writing
until S684's sign-off push at 12:47Z, and took the queue at 12:52Z. The Rule 9 checkpoint replaces this stub with the
full handoff.

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 and the COBIx brief on #3358 as updated
2026-11-19T02:34Z. It reads handoff 685 from S684's checkpoint (#3545).

## The college split (written before any worker starts)

Two lanes, never on one college, one writer per college. A college moves between lanes only when its lane has nothing
in flight there, and the move is recorded here (`d-lane-names-only-colleges-in-flight-s681`).

**Lane 1, the cheap piles (one worker).** The work that belongs to no college comes first: the display build, once,
and the harvest gap census. Then rule D through `rule_d` at City College of San Francisco, Santa Rosa Junior College
and College of the Desert, and the discontinued capture, once keep-the-better's second-pass fix has landed (a rule D
read is a second pass at a college the S683 wave posted). City College of San Francisco's outline index (report 28)
belongs to this lane, since the college does.

**Lane 2, collection (workers on the worker model Sam's cost rules name).**
- Keep-the-better's two open items, which belong to no college; then the second pass that re-posts the 17 re-reads
  restored on a generic heading at Ventura (4) and Evergreen Valley (13).
- Southwestern's paid read (24 programs; the free preview is 44509366154).
- The reread plan's second ten, in the plan's order: Copper Mountain, Woodland, MiraCosta, American River, Yuba,
  Cerritos, Grossmont, Imperial Valley, Modesto Junior and Skyline. Reads may start at once; keep-the-better and the
  posts wait for the generic-heading fix on a reviewed head. A third ten only after the second ten's loads have filed:
  Sierra, Barstow, Pasadena City, Rio Hondo, Los Angeles Harbor, College of San Mateo, College of the Sequoias, Fresno
  City, Contra Costa and Madera.
- Outlines: the colleges `scripts/next_slo_colleges.py --next` names, one full read per host
  (`d-one-read-per-host-funded-night-s680`), never City College of San Francisco tonight.

**Not tonight:** Long Beach City (its S683 preview looked stuck); North Orange Continuing Education (its preview would
extract none); the outline readers that need a code change (Rio Hondo, Peralta, Mt. San Antonio, Saddleback and Irvine
Valley: a plain session's); the CPL Commons page build (COBIx on #3533), which waits on Sam's word in a session
(`d-commons-build-to-a-plain-session-s684`).

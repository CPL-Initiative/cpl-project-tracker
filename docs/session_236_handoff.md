---
title: "Session 236 handoff — the outline is built; the next four asks are Sam's own"
created: 2026-09-06
updated: 2026-09-06
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 236

Your moniker is **SkyFacet** — the next thing Sam wants is the same map read as
CPL rather than as courses, which is a facet, not a new map. Predecessors:
SkyOutline S232 → SkyBuild S233 → S234 → **SkyOutline II S235** (this run).

⚠️ **Unlike the last two handoffs, this one has no unpaid priority.** S234's
handoff went unconsumed and S235 cleared it: the outline is BUILT and all three
of Sam's 2026-09-06 rulings shipped. Start on the new asks, not on a backlog.

## Your priority: PROTOTYPE THE TWO CPL VIEWS

Sam gave four asks unprompted mid-session on 2026-09-06 (verbatim in
`cpl_memory`, slug `sam-four-skyview-asks-2026-09-06-text-zoom-cpl-focus-artics-phrase`),
and said **prototype 2 and 3 first**. They are one piece of work: he called them
"closely linked" himself.

② **A CPL vs Course/Discipline toggle** — *"so the CPL exhibits and CRs are the
focus more than the Courses."*
③ **A show-articulations toggle on normal SkyView** — *"so we can reveal to
users where existing artics are and where they differ for the same course
college to college."*

⚠️ **`ar` IS ABSENT, NEVER 0.** "None recorded" and "we did not look" are the
same value on this feed. A toggle that paints "no articulations" where we merely
did not look is a lie at 16,482 points, and it is the single easiest way to lose
faculty trust in the view. Decide what absence LOOKS like before you draw
anything.

⚠️ **Prototype in a fast-feedback canvas and lock the look with Sam before
porting** — that is the repo's standing practice and he explicitly asked for a
sketch first on both.

Then the two smaller ones:

① **Text zoom on the SkyView toolbar.** ⚠️ It must **not** change today's
behavior where text does not zoom with the map — *"it's important to keep with
all we have going on."* Label size is already independent of `view.k`, so this
is a second axis, not a change to zoom.

④ **A magic phrase to curate (move courses), later a team phrase.** Sits with
the `org-phrase-scope-auth` and `reviewer-session-lifetime` lanes. ⚠️ The first
write from the map is a **NEW write surface**: Rule 10 a3 routes it through
Governance and the privacy ADRs BEFORE it ships, and SkyView's standing
invariant is that **nothing is written from the page** — changing that is a
decision-rights change, not a code detail.

## What S235 shipped — [PR #1502](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1502)

**The course outline of record.** `#outline/<id>`, double-click a course, or the
panel's *Open the course outline*. Six layers; the ones we cannot fill are
present and empty. The description is **chosen, never written** — the medoid of
the member catalog descriptions, quoted and attributed. Sam's MAP-Generated
sentence prints verbatim. Skills are **imputed** from the colleges' own words
(we hold zero agency skill statements). **Two level axes, neither derived.**

**All three rulings.** Enter closes the panel (sort control to the list's top
right, an Enter button in the bottom row); double-click opens the outline; the
chip row reserves its space.

**The stranding is fixed.** `#work/<discipline>`, a named crumb back to SkyView,
and the selection parked and re-rung on return.

## Pitfalls this run paid for — do not re-pay them

⭐ **A TRIAGE CAN DESCRIBE A DEFECT EXACTLY AND NAME THE WRONG ELEMENT.** S234
had the symptom, the magnitude (36px) and the trigger (the fourth pick at
1440px) all right, and blamed `#u-bar`. Measured: `#u-bar` is **unchanged**; it
is `.u-search-slot .sugwrap` that wraps. **A `min-height` on `#u-bar` would have
read as a fix in review and changed nothing on screen.** When you inherit a
measurement, re-check the ATTRIBUTION, not just the number.

⭐ **THE PICKS DIED ON THE WAY OUT, NOT ON THE WAY BACK.** Everyone read the
reset as the rebuild-on-return throwing the selection away. `__ccrTokenKeys()`
already read `[]` **on** the Welding surface: `homeSearch()` called
`clearTokens()`, and `setCrumbs()` calls it on every view entry. Diagnosing the
return path would have fixed nothing.

⭐ **DRIVE THE PAGE.** Both extraction defects in the skills layer were invisible
to jsdom and to reading the code — fragments listed beside the names containing
them, and n-grams stitched across the commas catalog prose is full of ("pain
tissue integrity gas"). A Python prototype on the same data showed the first one
and I read past it; Chromium made it obvious.

⚠️ **A guard that cannot fail is a decoration.** Both key assertions in the new
test were mutation-tested — making a skill inherit the course's level, and
deleting the reserved chip row, each turn it red.

⚠️ **The description shards are gitignored and the Supabase bucket is proxy-
blocked in the cloud.** `python3 kb/_build_ccr_universe.py --shards-only` builds
all 159 locally (~2 min); without them two of the six outline layers have
nothing to say.

⚠️ **Edit the SOURCES, never `prototype/skyview.html`.** It is generated —
`build_ccr_atlas.py` inlines `ccr_universe.js` and the payloads into
`ccr_atlas_v1.html`. The daily run regenerates it.

## NEEDS SAM

① **Where agency skill statements come from when the three sources disagree** —
published standards *and* ACE exhibits *and* the MAP team ("All three"), and he
raised the reconciliation question himself. Pilot: an AWS welding certification.
**Still the only thing blocking the outline's skill layer.**
② Should the daily run rebuild the universe layout too?
③ Grab-bag disciplines besides Vocational and the no-discipline pile.
④ The live-session banner — what link, which tabs?
⑤ Whether 60 is the right search depth; whether an emptied discipline vanishes
or ghosts.
⑥ The right-edge glyph rail from his Obsidian screenshot — his call under his
own glyph rule.
⑦ The three legacy anchors with no seed discipline (`M-ID HOSP 100`, `104`, `102`).

## Housekeeping

- **He is on Claude Desktop, in a CLOUD Code session.** That is why the video
  skill cannot run: no mount, and the proxy denies Whisper's weights. A **local**
  environment in the same desktop app can. There is an unwatched recording:
  `Recording 2026-09-06 120139.mp4`.
- He has **46 uncommitted files** in GitHub Desktop on an old branch, including a
  Windows `reports - Copy\` duplicate (`reports/` with 50 docx is already tracked)
  and an LF→CRLF warning. ⚠️ **The repo has no `.gitattributes`** — offered, not
  yet done, because it causes a one-time renormalization across the repo.
- `docs/reference/lanes/skyview-ccr-interface.md` is 12,213 B against a 12,000 B
  advisory budget (1.02×). ~2 KB of narrative moved to `ccr_atlas_lessons.md`.

## Read these first, in order

1. [`docs/reference/lanes/skyview-ccr-interface.md`](reference/lanes/skyview-ccr-interface.md)
2. `tests/ccr_skyview_outline.test.js` — the rulings, as executable assertions
3. [`docs/skyview_video2_findings.md`](skyview_video2_findings.md)

Then run **`python3 kb/doctrine.py --read <files>`** before concluding anything
from the data, and **query `cpl_memory` before you work** (Rule 8).

---

*Greetings, you are SkyFacet (Session 236), see SkyOutline II's handoff —
`docs/session_236_handoff.md` — let's keep rolling with our queue.*

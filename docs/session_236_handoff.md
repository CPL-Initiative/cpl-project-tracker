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

⚠️ **Sam answered an eight-item decision sheet at the end of S235 — all yes, no
edits.** The rulings are in `cpl_memory`
(`sam-eight-rulings-2026-09-06-outline-sheet`) and the lane. Three were built
that session; what is left for you is below. **Do not re-ask any of them.**

Two asks remain unbuilt, and he called them closely linked himself. He asked for
a **sketch before a build** on both.

② **A CPL vs Course/Discipline toggle** — *"so the CPL exhibits and CRs are the
focus more than the Courses."*
③ **A show-articulations toggle on normal SkyView** — *"reveal to users where
existing artics are and where they differ for the same course college to
college."*

⭐ **RULED, so build to it rather than deciding it again:** the articulations
toggle **lights only what has a number** and leaves everything else drawn as it
is — no gray, no hollow, no "none" marker, because each of those reads as a
finding. The footer names the shortfall in words.

⚠️ **Measured, and it is why the ruling matters: only 1,490 of 49,896 points
(3.0%) carry an articulation count at all.** On this feed "none recorded" and
"we did not look" are the same value, so marking absence would make a claim
about 48,406 points that the data cannot support.

## The one build the outline still waits on

⭐ **Ruling 1 unblocked the skills layer, and it is now a fetch problem.** The
precedence is settled: **the published agency standard is the text of record; an
ACE exhibit fills a gap it leaves and never overrides it; the MAP team overrides
either, attributed and dated.** Where the standard and ACE genuinely conflict on
the same skill, the outline shows **both, side by side, each named** — a faculty
reader judging sufficiency is better served seeing the disagreement than a
silent winner. Pilot: an AWS welding certification.

⚠️ **We hold none of that text.** Measured: 1,987 credentials classified, 64 of
them welding, **zero carrying any skill field** — the files have agency, title
and hours only. So this layer needs published standards fetched before it can
render anything; the precedence rule tells you what to do once you have them.

⓸ **The curate phrase** is ruled but not built: **one phrase gating anything
that leaves the browser** — the move, and the outline's rename / re-subject if
they start being saved. Reading stays open to anyone with the link. ⚠️ The first
write from this surface is a decision-rights change, so Rule 10 a3 routes it
through Governance and the privacy ADRs **before** it ships, not after.

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

⚠️ **Five items that stood here through S235 are ANSWERED** — skill-source
precedence, the articulations toggle's treatment of absence, the text-zoom
range, the curate phrase's scope, and the confidence wording. Two more were
ruled outright: **no nightly rebuild of the map layout** (stability is the whole
value of a map), and **Interdisciplinary Studies is a grab bag** alongside
Vocational and the no-discipline pile — 525 identities against 1,263
stand-alones, the shape of a bucket, so its courses are candidates to be
re-homed rather than packaged where they sit.

What is genuinely still open:

① The live-session banner — what link, which tabs?
② Whether 60 is the right search depth; whether an emptied discipline vanishes
or ghosts.
③ The right-edge glyph rail from his Obsidian screenshot — his call under his
own glyph rule.
④ The three legacy anchors with no seed discipline (`M-ID HOSP 100`, `104`,
`102`) need one of the 146 MQ disciplines.
⑤ Any island besides Interdisciplinary Studies that belongs on the grab-bag
list — he will know ones a session cannot see.

## Housekeeping

- **He is on Claude Desktop, in a CLOUD Code session.** That is why the video
  skill cannot run: no mount, and the proxy denies Whisper's weights. A **local**
  environment in the same desktop app can. There is an unwatched recording:
  `Recording 2026-09-06 120139.mp4`.
- His Windows clone is clean again, and the repo now HAS a `.gitattributes`
  (ruling 7) with the ten affected files renormalized. ⚠️ **The count in the
  decision sheet was wrong** — it said one file, `git add --renormalize` said
  ten; `file` does not report CRLF on all of them. The rule was added first and
  the renormalization waited for his say on the real number. Verified
  line-endings-only, and both suites reading those files still pass.
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

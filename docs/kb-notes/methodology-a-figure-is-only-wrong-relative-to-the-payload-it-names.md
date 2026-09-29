---
title: A figure is only wrong relative to the payload it names
created: 2026-09-06
updated: 2026-09-06
tags: [methodology, verification, measurement, pitfall, skyview, ccr]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-ask-whether-the-list-can-contain-what-you-are-counting]]"
  - "[[docs/kb-notes/methodology-a-liveness-set-must-be-able-to-contain-what-it-judges]]"
  - "[[docs/reference/lanes/skyview-ccr-interface]]"
artifacts:
  - docs/skyview_troubleshooting_brief.md
  - prototype/ccr_universe.json
  - prototype/ccr_atlas_data.json
---

# A figure is only wrong relative to the payload it names

An observation session on SkyView (2026-09-06) reported the troubleshooting
brief's course figure as wrong: *"16,478 of 71,959, not 16,480 of 76,008. The
denominator is off by ~4,000, which is the more serious half."* It ranked the
correction first of three and recommended editing the brief.

Both pairs are correct. They describe different files.

| Payload | Field | Value |
|---|---|---|
| `prototype/ccr_universe.json` | `counts.identities` | 16,478 |
| `prototype/ccr_atlas_data.json` | `totals.identities_inbrowser` / `identities_total` | 16,484 / 71,959 |
| `unified_courses_data.js` | `count_inbrowser` / `count_total` | 16,480 / 76,008 |

The session measured the first two — the payloads SkyView loads — and compared
them against a figure the brief had quoted from the third, which **SkyView never
loads at all** (it is COBI's payload; `grep -c unified_courses_data
prototype/skyview.html` is 0). Three counts of three different things, each
right, and the comparison of any two of them is meaningless.

The brief *was* wrong, but not in the way reported and not in the part that was
"corrected": it quoted a true figure about the wrong surface. Had the
recommendation been applied as written, the brief would have carried a number
that no longer described anything, and the next session would have been sent
looking for a four-thousand-row shortfall that does not exist.

## The rule

**Before correcting an inherited number, find the source it was quoting and read
that.** Not a source — *its* source. Then say which surface each number
describes. Two figures that disagree are usually two things counted correctly.

This is the companion to S232's *reproduce the inherited number before you
correct it*, which caught the same class of error from the other side: there the
inherited figure was measured against a display-capped payload and over-reported
deaths fourfold. Same shape, opposite direction — **the payload you measure
against is part of the claim, and a claim that does not name it cannot be
checked.**

## The corollary: a disagreement may be a build gap, not a defect

The same session found the universe and atlas payloads disagreeing on **117 of
158 disciplines** (total gap 1,904, net −6, with `(no discipline yet)` 955 lower
in the universe) and proposed a mechanism: the universe is post-canonicalization,
the atlas pre-. Reproduced exactly — and the arithmetic is right — but the
mechanism is not. `_generated_from` says it plainly:

```
prototype/ccr_atlas_data.json   2026-08-24 15:34
prototype/ccr_universe.json     2026-09-05 15:22
```

They are not two views of one build. They are **two builds twelve days apart**,
spanning the authority recode, the Z-band retirement and the prefix fold — every
one of which moves identities between disciplines. Nothing rebuilds the atlas
payload on a schedule; `daily-dashboard.yml` builds only the description shards.

So the residual −6 needed no investigation, and the 117 are not a defect in
either builder. **The staleness is the finding** — the discipline tables read
from the older payload while the map reads the newer one, so the same discipline
can show two counts on one screen (Health differs by 43). Read
`_generated_from` on both payloads before comparing anything derived from them.

## Where this bites

Any surface assembled from more than one generated payload — which is most of
them here. `kb/dependency_map.json` names which consumer reads which dataset;
it does not say when each was last built. Check the payload's own stamp.

---
title: Normalise both sides of a join, or the resolver is decoration
created: 2026-08-12
updated: 2026-08-12
tags: [methodology, entity-resolution, joins, data-integrity, funding, my-college]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/college_action_page_lessons]]"
  - "[[docs/kb-notes/methodology-coded-key-over-freehand-text-join]]"
  - "[[docs/kb-notes/methodology-a-safe-fallback-is-caller-specific]]"
artifacts:
  - college_briefing.js
  - cpl_funding.js
  - college_short_names.js
  - tests/college_briefing.test.js
---

# Normalise both sides of a join, or the resolver is decoration

> **One-sentence summary** — putting one side of a join through a name resolver
> and comparing the result against the *raw* other side produces a join that
> works for every row whose two spellings already agreed, which is most of them,
> and silently drops the rest.

## What happened

`CLAUDE.md` has carried the right rule for months:

> The funding roster keys on SHORT names, MAP on full names — join both sides
> through `cplCollegeShort()`.

The My College tab followed half of it. `fundingFor()` resolved MAP's full name
to a canonical short name and handed that to `cpl_funding.js`:

```js
var key = shortName(name);            // "Mt. San Antonio College" → "Mt. San Antonio"
var grant = M._grant(key);
```

and `cpl_funding.js` compares that key against the roster's own string, never
normalised:

```js
function baseCollege(name) {
  var hit = null;
  base().colleges.forEach(function (c) { if (c.college === name) hit = c; });
  return hit;                          // c.college is "Mt San Antonio" — no period
}
```

For ~110 of 115 colleges the canonical short name and the roster's raw string
are byte-identical, so the join worked. For five they are not:

| MAP name | canonical short | roster string |
|---|---|---|
| Mt. San Antonio College | `Mt. San Antonio` | `Mt San Antonio` |
| Norco College | `Norco` | `Norco College` |
| Reedley College | `Reedley` | `Reedley College` |
| MiraCosta College | `Mira Costa` | `MiraCosta` |
| Los Angeles Southwest College | `LA Southwest` | `LA Swest` |

Each of those five rendered **“is not on the 115-college funding roster”** and
was shown no implementation funding at all — including Mt. San Antonio, the
largest CPL programme in the system, whose real allocation is **$522,239**. The
roster row was present the entire time.

## Why the existing test didn't catch it

There *was* a join test, and it was a good one. It asserted that every roster row
resolves to a distinct key:

```js
ROSTER.forEach(function (c) { const k = S(c.college); (keys[k] ||= []).push(c.college); });
// 0 collisions, 0 orphans, 115 of 116 — all true
```

That checks `S(roster)` against `S(roster)`. **It never checks `S(mapName)`
against `roster`,** which is the comparison the product actually performs. A
join test has to exercise the *direction the code joins in*, not a symmetric
property of one side.

The same blind spot produced the documented claim "0 orphans" while five
colleges were orphaned in production.

## The rule

**Whatever normalisation one side gets, the other side gets too — at the point
of comparison, not somewhere upstream.** Either:

- normalise inside the module that owns the lookup (`c.college === name` becomes
  `S(c.college) === S(name)`), or
- resolve the canonical key *back* to the owning side's own spelling before
  calling in.

We took the second option, in the consumer:

```js
// The roster's OWN string, not merely the canonical short name.
function rosterKey(name) {
  var canon = shortName(name);
  ...build index of S(c.college) → c.college, first writer wins...
  return _rosterKeys[canon] || canon;
}
```

Chosen because the Implementation Funding tab passes roster-raw names internally
and works today — normalising inside `cpl_funding.js` would have changed
behaviour for a second, unrelated consumer to fix a bug in this one. **Fix the
join at the caller that has the mismatch**, unless every caller has it.

## Two details worth copying

**Rebuild the index when its source changes size.** The roster script loads
asynchronously, so an index built eagerly caches *empty* forever:

```js
if (_rosterKeys === null || _rosterKeysN !== rows.length) { ...rebuild... }
```

**First writer wins.** If two roster rows ever normalised to the same key, a
later duplicate must not steal an earlier college's money. The roster is
asserted collision-free separately; the map is written defensively anyway.

## How to test it

Assert against the **real shipped roster and the real module**, not a fixture —
drift in either file should fail in CI rather than on a college's page. And
assert the bug *directly*, so the test stops passing for the right reason:

```js
check("the canonical key alone does NOT reach the funding module: " + mapName,
  !FUND._grant(S(mapName)),
  "this is why rosterKey() exists; if this starts passing, the module normalises and rosterKey can go");
check("the roster string DOES reach the funding module: " + mapName,
  !!FUND._grant(rosterRaw));
```

Then verify the fix against a figure derived **outside** the system: Mt. SAC's
`$522,239` matches the Sep-BOG reconciliation, so a passing test means the join
is right, not merely different.

## Smell test

If you can point at a resolver and say "we join through it", ask which side of
the `===` it is applied to. If the answer is "one of them", you have this bug,
and it is invisible in exactly the proportion your two vocabularies already
agree.

---
title: "Methodology — provenance is a field, not a footnote (and a two-state detector is wrong about the middle)"
kb-status: published
created: 2026-08-05
updated: 2026-08-05
session: 120 (SkyMail)
tags: [methodology, provenance, data-quality, trust, curation, detectors, map]
related:
  - "[[docs/kb-notes/methodology-map-api-value-signature-probe]]"
  - "[[docs/kb-notes/methodology-route-to-a-determination-they-already-made]]"
  - "[[docs/map_users_lessons]]"
---

# Provenance is a field, not a footnote

## The failure this prevents

You assemble one column from several sources of different quality — a system of
record, a colleague's knowledge, a web lookup, a model's inference — and render
them identically. The column looks uniform. Downstream, nobody can tell which
values to trust, so they either trust all of them (and get burned by the weakest)
or trust none (and the work is wasted).

**The fix is not a disclaimer at the top of the table. It's a field on every
row**, rendered next to the value, that says where this particular one came from.

## Worked example

Filling a student-facing contact for colleges that had none, values arrived from
three places:

| Tier | Trust | Rendered |
|---|---|---|
| **System of record** (the college's own designation in MAP) | authoritative — the only tier allowed to auto-propose | the role name |
| **Curator-supplied** (a team member who knows the college) | strong — a human judgment | ✔ from &lt;who&gt;, &lt;when&gt; — *not a system designation* |
| **Web-sourced** (found on the institution's published pages) | starting point | link to the source page — *verify before use* |

Rendering these the same would have been a real error: a colleague's "use these
two counselors, I know them" and a script's "this inbox appeared on a webpage"
are different claims about the world.

## The rule that falls out of tiering

Once provenance is explicit, **different tiers can have different permissions** —
which is impossible when everything is one undifferentiated column.

> A web lookup may only ever yield a **department inbox**.
> A curator may name an **individual**.

Not arbitrary: naming a specific person from a webpage is a judgment the lookup
can't support (is this the right person? do they still work here? do they
actually answer?), while a curator has exactly that knowledge. The tier system
lets you *encode* who is allowed to make which kind of claim, and a test can
enforce it.

The strongest record is two tiers at once: a curator who also cites the page they
chose from — a human judgment **plus** its evidence. Store both; show both.

## Record who and when, not just what

A curator-supplied value should carry the person and the date. Not ceremony —
it's what makes the value *questionable later*. A year on, "✔ from Jessica,
2026-08-05" can be re-checked with a person; an anonymous value in a column can
only be deleted or believed.

## Corollary — a two-state detector is wrong about the middle

Same principle applied to classification. A detector that emits only REAL / FAKE
will eventually meet something genuinely real but weak-signalled, and will report
it as fake — indistinguishably from actual garbage.

Concrete case: a schema probe classified an API column real if ≥25% of rows were
populated, else fake. A **real but sparsely-populated** column sat below the
floor and was silently dropped. Sparse is not fake — *a fake column returns
nothing at all*, so "few values" and "no values" are different observations being
collapsed into one verdict. Adding a third `weak` state (clears the
garbage baseline, below the fill floor) that **reports its counts for a human
call** rather than deciding, surfaced fields the binary gate had hidden.

The general rule:

> When the cost of a false negative is *"we tell someone their data doesn't
> exist,"* the detector needs a middle state that escalates to a human instead of
> deciding.

Both halves of this note are the same idea. **Don't collapse distinctions that
the consumer needs in order to act** — not between sources of a value, and not
between degrees of confidence in a verdict. Rendering everything as equally
certain is a lossy compression of exactly the information a reviewer needs.

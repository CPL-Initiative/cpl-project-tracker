---
title: Promoted-record ghosts in candidate worklists
created: 2026-06-15
updated: 2026-06-15
tags: [methodology, worklist, data-integrity, ccr, curation]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/ccr_cluster_cleanup_lessons]]"
artifacts:
  - excel_to_dashboard.py  # export_unified_courses() — the _sug_row_ids skip
---

# Promoted-record ghosts in candidate worklists

> **One-sentence summary** — when a record can be *promoted* from a holding pool
> (singletons/orphans) into a first-class identity, the worklist that pools the
> orphans must exclude the promoted ones, or it re-offers an identity merged with
> its own ghost.

## Context

The CCR Suggested-merges worklist builds groups from two pools: payload
identities (`rows` — M-IDs / Unified / official anchors) and a singleton pool
(`sg` — single-college courses with no identity yet). A curator/auto merge can
**promote** a singleton: when a course is folded *into* a singleton's id, that id
becomes a multi-member identity row in the payload. The singleton's old record,
however, still sat in `sg`. Sam spotted the symptom: a Suggested-merge whose two
candidates were the *same id* (`BIOL M90BE` + `BIOL M90BE`), one labelled the
identity and one "Stand-Alone" — an effective duplicate, and a no-op "self-merge."

## The claim

**A worklist that pools "orphans" must drop any orphan whose key has already been
promoted to a first-class entity.** Otherwise the same key appears twice — once
as the anchor identity, once as its stale orphan — and the tool offers a merge of
an identity with itself (member id == anchor id). The fix is a one-line guard:
build the set of promoted identity keys and skip orphans already in it.

```python
_sug_row_ids = {r["id"] for r in rows}          # promoted identities
for sid, v in sg.items():                        # the singleton pool
    if sid in merge_into:    continue            # already folded away
    if sid in _sug_row_ids:  continue            # PROMOTED → not a free orphan
    ...
```

20 of 262 anchored groups were these ghosts; the guard took them to 0 (verified
on the republished payload).

## How we got here

The promotion path (curator/auto `merge_into` pointing at a singleton id) creates
a payload row for the target but never removes the source singleton record — the
two pools are joined at render time, not reconciled at write time. The signature
grouping then matched the identity against its own ghost (same normalized title,
naturally). PR #435. Root-caused by confirming `BIOL M90BE` lived ONLY in the
singleton pool (`_remint_from: "M-ID AHSD 198"`) yet rendered as a 2-member M-ID
in the payload — i.e. it had been promoted by a fold, not minted.

## When this applies (and when it doesn't)

- **Applies** to any two-pool candidate generator where one pool can be promoted
  into the other without a delete (suggestion/worklist/dedupe systems, dangling
  staging records). The cheap, durable fix is the membership guard at join time;
  the deeper fix is to prune the source pool on promotion.
- **Doesn't apply** when the pools are disjoint by construction (a record can't
  exist in both), or when self-pairs are legitimately meaningful (they aren't for
  a *merge* — folding X into X is always a no-op).

## See also

- `[[docs/ccr_cluster_cleanup_lessons]]` — Session 55 section (the full story)
- PR `#435` — the `_sug_row_ids` guard + the Discipline-picker clarity
- Related: `[[docs/kb-notes/playbook-gated-bulk-autocuration]]` — the auto-merge
  passes whose promotions created the ghosts

---

*Authoring check: durable (the join-time guard holds), reusable (any two-pool
candidate generator), distilled (one concept), self-contained.*

---
title: A conditional key breaks a bulk upsert, and it fails positionally
created: 2026-08-13
updated: 2026-08-13
kb-status: published
tags: [methodology, postgrest, supabase, sync, data-loading, pitfall, silent-failure]
obsidian-folder: cpl-project-tracker
related:
  - "[[docs/sierra_credit_recs_lessons]]"
  - "[[docs/kb-notes/playbook-rekey-shared-db-from-alias-map]]"
---

# A conditional key breaks a bulk upsert, and it fails positionally

## The claim

PostgREST rejects a bulk payload whose objects do **not all carry the same keys**
(`PGRST102 — "All object keys must match"`). A field emitted only *sometimes*
therefore fails **positionally**: whole batches succeed until the first batch that
happens to contain one, so it presents as a size or content limit rather than a
schema-shape mismatch — and it leaves the table **partly loaded**.

## What happened

`kb/_build_credential_recs.py` emitted `cid_repeats` only when a credential
actually had a repeated C-ID:

```python
if repeats:
    row["cid_repeats"] = repeats     # ← the bug
```

**Exactly one row of 2,205** has one (POST Basic Academy, where `AJ 110` appears on
two lines). The sync batches at 200. Batches 1–8 were homogeneous and succeeded;
batch 9 held that row:

```
  upserted 1600/2205
FATAL: batch 1600: HTTP 400 {"code":"PGRST102","message":"All object keys must match"}
```

The table sat at **1,600 of 2,205**.

## Why the partial load is the real damage

A half-loaded table **looks populated**. `select count(*)` returns 1,600, queries
return plausible rows, and a spot check on a common credential passes. Nothing
about the surface says "two-thirds". Had the batch containing the odd row come
first, the failure would have been obvious and total — which would have been
*better*.

Note also that the odd row is not random: it is the **most interesting** record in
the set, because interesting records are exactly the ones that trip optional
fields.

## The rule

1. **Never emit a key conditionally in a payload destined for a bulk endpoint.**
   Emit it always, `null` when empty.
2. **Normalise at the boundary as well.** Expand every row to the union of keys
   before sending, so a *future* optional field cannot reintroduce it:

   ```python
   def normalize_keys(rows):
       keys = set()
       for r in rows:
           keys.update(r.keys())
       return [{k: r.get(k) for k in sorted(keys)} for r in rows]
   ```

   Both fixes, not one: the builder's is the correct model, the sync's is the
   guard that survives the next contributor.
3. **After any bulk load, assert the row count against the dry run.** A load that
   reports success per batch can still stop early; the only honest check is
   `count(*) == expected`.
4. Log the running total per batch (`upserted N/TOTAL`) — that log is what makes
   the positional failure diagnosable at all.

## Generalises to

Any batched writer over a schema-flexible endpoint: PostgREST, BigQuery streaming
inserts, Elasticsearch `_bulk`, DynamoDB `BatchWriteItem`. The shared shape is
*heterogeneous payload accepted per-batch, validated per-batch* — so uniformity is
a property you must construct, never one you can observe from a passing batch.

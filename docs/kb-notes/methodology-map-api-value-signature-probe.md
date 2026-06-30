---
title: Probing the MAP Custom Report API for a view's real columns (value-signature method)
date: 2026-06-30
session: 87 (StarMax)
kb-status: published
type: methodology
tags: [map-api, schema-probe, runner-as-proxy, pii-safe, supabase]
artifacts:
  - map/probe_users_schema.py
  - .github/workflows/map-users-schema-probe.yml
related:
  - "[[docs/kb-notes/playbook-runner-as-external-api-proxy]]"
  - "[[docs/map_users_tab_scope]]"
---

# Probing the MAP Custom Report API for a view's real columns

**Problem.** The MAP Custom Report API (`.../api/CustomReport/getReport`) serves
each dataset (`View_*_APIDataset`) **column-oriented** (`{columnName:[…],
columnValue:[[…],…]}`), but several views have **no self-describe mode**: a request
with no `columnName` returns HTTP 500. So you can confirm a view is reachable (seed
it with one known column like `College` → it returns rows) but you can't enumerate
its fields. And the field NAMES are needed to build a sync (an unknown column in
`columnName` **400s the whole report**).

**The trap.** A structural guess-and-confirm — "request `[anchor, candidate]`, keep
it if the API doesn't reject it" — **over-accepts**, because the API **pads unknown
columns into 2-wide rows** (it doesn't drop or 500 a single bad column). Every
candidate "passes". Echoed-`columnName` and row-width heuristics both fail.

**The method — value signature.** Confirm a column by whether its **values** come
back, calibrated against known-garbage:

1. Pick a known-good anchor column (`College`).
2. **Calibrate**: probe 2–3 deliberately-fake sentinel columns (`ZqxNotAColumn1`,
   …). Record their signature — on MAP it's `responseCode='400'`, 0 rows.
3. For each candidate, request `[anchor, candidate]` and compute a PII-safe
   signature: `responseCode`, non-null count, distinct count, copies-of-anchor.
4. **Keep** a candidate iff its signature clearly beats the fake baseline: real →
   `code='000'` + non-null values + >1 distinct, not an anchor copy.

A real column returns `code='000'` with data; a fake one returns `code='400'`/0.
Clean separation once you look at values instead of structure.

**Two spelling gotchas (MAP-specific).**
- **Case-sensitive.** `UserName` ✓ but `Username` ✗ — try case variants; record the
  server's canonical spelling.
- **Builder labels ≠ API names, and multi-word columns keep their SPACES.** The MAP
  Custom Report Builder UI shows friendly labels ("CollegeID", "VPAA Email", "Primary
  Contact"); the API names are `CollegeId`, **`VPAA Email`** (with the space),
  **`Primary Contact Email`**. De-spacing to PascalCase (`VPAAEmail`) **400s**. When
  guessing from Builder labels, try the label **verbatim, spaces and all**.

**PII safety (load-bearing — these views are staff names/emails).** The probe prints
ONLY field names, counts, types, and the distinct values of **low-cardinality**
(≤25) **non-`@`** fields (role/status vocab). High-cardinality or `@`-bearing fields
are masked. Nothing is written to disk or committed. Runs `workflow_dispatch`-only on
a runner (the Azure MAP host is egress-blocked from the agent sandbox —
runner-as-proxy).

**Reuse.** `map/probe_users_schema.py` is the implementation; point its `VIEW_SETS`
+ `GUESS_COLUMNS` at any new MAP view, dispatch `map-users-schema-probe.yml`, read
the Actions log. This is how the `View_CollegeUsersRoles` (7 fields) +
`View_CollegeContacts` (23 fields) schemas were captured for the MAP Users tab.

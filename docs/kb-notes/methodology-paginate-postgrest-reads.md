---
title: "Paginate every PostgREST read that can outgrow 1,000 rows"
created: 2026-07-08
updated: 2026-10-13
kb-status: published
tags: [methodology, supabase, postgrest, pagination, overlay, cer, silent-truncation]
artifacts:
  - credential_reference.js
  - tests/cer_overlay_pagination.test.js
  - program_requirements.js
  - tests/program_requirements.test.js
related:
  - "[[docs/exhibit_canonicalization_lessons]]"
  - "[[docs/kb-notes/methodology-refresh-token-before-write]]"
---

# Paginate every PostgREST read that can outgrow 1,000 rows

## The failure mode

Supabase's PostgREST caps any single response at **1,000 rows** (the server
`max-rows` default) — and without an `order=`, the rows it keeps are
**arbitrary and can differ per request**. A plain

```js
fetch(SUPABASE_URL + "/rest/v1/kb_curation?...&course_id=like.PREFIX%25")
```

therefore works perfectly until the namespace crosses 1,000 rows, then starts
silently dropping a *different* tail on every load. No error, no warning —
the JSON is simply shorter than the table.

## How it presented (2026-07-07/08, the CER triage worklist)

The `_UNCLASSIFIED::` overlay reached 1,200 rows (~600 assignments × 2 fields).
Symptoms, none of which looked like a fetch bug:

- a set of fire certs the curator had saved rendered as **"needs triage"** —
  read as *"Save All didn't save them"*;
- on a later visit, **"113 show on the list even though they've been saved"**
  — a different dropped tail;
- re-saving rows "fixed" them (the upsert was a no-op; the next fetch just
  happened to include them).

The writes were never broken. **The read was.**

## The fix pattern

Page with `Range` headers over a **stable order** until a short page:

```js
function fetchAllRows(url) {
  var PAGE = 1000, out = [];
  url += "&order=course_id.asc,field.asc";   // stable — Range pages must not shear
  function page(from) {
    return fetch(url, { headers: { apikey: ANON,
      "Range-Unit": "items", "Range": from + "-" + (from + PAGE - 1) } })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (arr) {
        out = out.concat(arr || []);
        return (arr && arr.length === PAGE) ? page(from + PAGE) : out;
      });
  }
  return page(0).catch(function () { return out; });
}
```

- **The `order=` is load-bearing.** Range pagination over an unordered scan
  can skip or duplicate rows when pages hit different plans; order by the
  key(s) you filter on.
- **Stop on a short page**, not on a count probe — one fewer round trip and
  no `Prefer: count=exact` cost.
- Duplicates across a page boundary (a row inserted mid-pagination) are
  harmless when the consumer builds a keyed map; skips are the dangerous
  direction, and ordering prevents them.

## When to apply it

Audit every unpaginated PostgREST GET whose result set **grows with curation
activity** (overlays, logs, assignment namespaces). A read that returns
exactly 1,000 rows in production is almost certainly truncated — treat that
number as a smoke signal. Guard with a test whose fixture exceeds one page
(`tests/cer_overlay_pagination.test.js` uses 2,400 rows across 3 pages).

## Paging is not enough when each row is heavy (2026-10-13)

The Program Requirements tab read 2,840 records with their full `record` and
`display` jsonb in one request. Two faults stacked. The response stopped at
1,000 rows (the edge log showed `Content-Range: 0-999/*`), and the read as
anon answered **500**: the anon role's `statement_timeout` is **3 s**
(authenticated 8 s, set in `pg_roles.rolconfig`), and 1,000 such rows are
11.3 MB of JSON, 34 MB for all of them. Paging fixed the cap, but six 3 MB
pages in flight still timed out.

The rule that follows: **size a read by its bytes as well as its rows.**
Read a light index of every row up front (the columns the cross-row views
count, with JSON paths such as `alias:display->checks->>arithmetic`), and
read heavy columns only for the rows a reader asks for: a filter the reader
picks (`college=in.("A","B")`, values quoted), or a key a link names. Give a
5xx page one retry, and fail the whole read when a page fails twice, naming
the table, so a short list never passes for the whole one. After deploying a
changed read, check `edge_logs` for each request's status,
`response.headers.content_range` and `response.origin_time`.
Worked example: #2088, #2089, #2090; lessons S384 in
`docs/program_requirements_harvest_lessons.md`.

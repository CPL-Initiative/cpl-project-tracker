# Plan: Golden West SLO rows, the "Course Outcomes" sub-heading moved out of the outcomes (S690, 2026-11-20)

**Status: a plan, not run.** The conductor runs the pre-read, files its result as this plan's before-values, then
runs the write and files what it returns. Nothing below has touched `course_outcomes`.

**What:** a guarded UPDATE on `course_outcomes` for Golden West College's SLO rows from CourseLeaf read 41399075269
(`f-golden-west-474-header-rows-s689`: 474 live rows carry the list's sub-heading as an outcome, 470 as the first).
The filed read holds 476 such rows of 568: 472 with the line first, 4 with an ILOs block above it (CS G262, DANC
G125, MUS G261, THEA G211), and ACCT G163 with the line twice. Each row's outcomes become the items after the last
line that matches `^cour?se (learning )?outcomes?:?$`. That line moves to `lead`, which is null on every target row.
`shape` becomes `paragraph` where one outcome is left (22 rows in the filed read), else `list`. `fingerprint` is
recomputed as `md5(outcomes::text)`, the way S665's fix reproduced the loader's fingerprints. No other column, row or
table changes.

**Why in place** (the same call as `d-goldenwest-subhead-fix-in-place-s665`): the reader fix on this branch
(`CCCD_SUBHEAD` with the colon optional, the items after the last sub-heading) would otherwise make a reread insert a
second copy beside each row, since the load inserts by fingerprint. Read 44251936045 loaded objectives only
(receipt `course_outcomes_cccd_44263910106.json`), so its SLO rows are not live.

## 1. Pre-read (one SELECT, one JSON value; its `before` is this plan's before-values)

```sql
with hit as (
  select id, course_code, source_url, outcomes, lead, shape, fingerprint,
         (select max(e.i) - 1 from jsonb_array_elements_text(outcomes) with ordinality e(x, i)
           where e.x ~* '^cour?se (learning )?outcomes?:?$') as last_head
    from public.course_outcomes
   where college = 'Golden West College' and kind = 'slo' and read_run = '41399075269' and lead is null
     and exists (select 1 from jsonb_array_elements_text(outcomes) x(v) where x.v ~* '^cour?se (learning )?outcomes?:?$')
), fixed as (
  select hit.*, outcomes ->> last_head::int as new_lead,
         coalesce((select jsonb_agg(e.x order by e.i) from jsonb_array_elements(outcomes) with ordinality e(x, i)
                    where e.i - 1 > last_head), '[]'::jsonb) as new_outcomes
    from hit
)
select json_build_object(
  'rows', count(*),
  'head_first', count(*) filter (where last_head = 0),
  'fingerprint_reproduces', count(*) filter (where fingerprint = md5(outcomes::text)),
  'emptied', count(*) filter (where jsonb_array_length(new_outcomes) = 0),
  'to_paragraph', count(*) filter (where jsonb_array_length(new_outcomes) = 1),
  'collisions', (select count(*) from fixed f join public.course_outcomes c
                   on c.college = 'Golden West College' and c.kind = 'slo' and c.course_code = f.course_code
                  and c.source_url = f.source_url and c.fingerprint = md5(f.new_outcomes::text) and c.id <> f.id),
  'checksum', md5(string_agg(id || ':' || fingerprint || ':' || shape, ',' order by id)),
  'before', json_agg(json_build_object('id', id, 'outcomes', outcomes, 'lead', lead, 'shape', shape,
                                       'fingerprint', fingerprint) order by id))
from fixed;
```

**Go only when:** `rows` is 474 (or the live count the conductor re-measures at write time, Rule 10 a), every row's
`fingerprint_reproduces`, `emptied` is 0 and `collisions` is 0. A colliding row is held out by id and named here.

## 2. The write (guarded; returns one JSON value)

```sql
with hit as (
  select id,
         (select max(e.i) - 1 from jsonb_array_elements_text(outcomes) with ordinality e(x, i)
           where e.x ~* '^cour?se (learning )?outcomes?:?$') as last_head
    from public.course_outcomes
   where college = 'Golden West College' and kind = 'slo' and read_run = '41399075269' and lead is null
     and fingerprint = md5(outcomes::text)
     and exists (select 1 from jsonb_array_elements_text(outcomes) x(v) where x.v ~* '^cour?se (learning )?outcomes?:?$')
), fixed as (
  select c.id, c.outcomes ->> h.last_head::int as new_lead,
         coalesce((select jsonb_agg(e.x order by e.i) from jsonb_array_elements(c.outcomes) with ordinality e(x, i)
                    where e.i - 1 > h.last_head), '[]'::jsonb) as new_outcomes
    from hit h join public.course_outcomes c on c.id = h.id
), done as (
  update public.course_outcomes c
     set lead = f.new_lead,
         outcomes = f.new_outcomes,
         shape = case when jsonb_array_length(f.new_outcomes) > 1 then 'list' else 'paragraph' end,
         fingerprint = md5(f.new_outcomes::text)
    from fixed f
   where c.id = f.id and jsonb_array_length(f.new_outcomes) > 0
  returning c.id
)
select json_build_object('updated', count(*), 'ids', json_agg(id order by id)) from done;
-- expected: updated equals the pre-read's rows
```

## 3. Rollback (from the before-values filed by step 1)

```sql
update public.course_outcomes c
   set outcomes = b.outcomes, lead = b.lead, shape = b.shape, fingerprint = b.fingerprint
  from jsonb_to_recordset('<the pre-read''s before array>'::jsonb)
       as b(id bigint, outcomes jsonb, lead text, shape text, fingerprint text)
 where c.id = b.id and c.college = 'Golden West College' and c.kind = 'slo';
-- then the pre-read's checksum, over the same ids, must read as it did before the write
```

**Checked on a local copy (S690):** the three steps ran on a scratch Postgres 16 table loaded with read
41399075269's 568 filed SLO rows. Pre-read: 476 rows, 471 with the last sub-heading first (ACCT G163's second copy
is its last), every fingerprint reproduced, 0 emptied, 22 to paragraph, 0 collisions, checksum
`a9b72f0e65ac179b6c4ec5444d90a98e`. The write updated 476; after it no outcome matched the sub-heading and all 568
fingerprints reproduced; a second write updated 0. The rollback restored the checksum. The live counts (474, 470)
differ from the filed read's, so the conductor's pre-read is the measure.

**After the write:** read 44251936045's SLO rows carry the old parse and were never loaded as SLOs; they load as SLOs
only after a reread with this branch's reader.

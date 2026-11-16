# Receipt: Las Positas SLO rows, the lead-in moved out of the outcomes (S664, 2026-11-16)

**What:** a guarded UPDATE on `course_outcomes` for 505 Las Positas College SLO rows (`kind = 'slo'`, read run
41784805869, ids 9385 to 9889, contiguous). Each row filed the lead-in *Upon the completion of this course, the
student should be able to:* as `outcomes[0]` with `lead` null (COBIx on #3386; parser fix #3389). The UPDATE moves
that sentence to `lead`, drops it from `outcomes`, recomputes `fingerprint` (md5 of the outcomes' JSON text, the
reader's own `fingerprint()`; all 505 before-fingerprints reproduced as `md5(outcomes::text)` in SQL first), and sets
`shape` to `paragraph` where one outcome remains (59 rows). No other column, row or table changes. Collisions on the
unique key after the change, measured first: 0. Other SLO rows at the same course: 0.

**Decided** (`d-laspositas-lead-fix-in-place-s664`): the fixed parse wins. Correcting in place keeps one row per course;
a reread under the fixed parse would otherwise insert a second copy beside each, since the load only inserts.

**Before-values:** every row had `lead` null, `shape` `list`, `outcomes[0]` the lead-in above, and
`fingerprint = md5(outcomes::text)`. Checksum of the 505 before-values,
`md5(string_agg(id||':'||fingerprint||':'||shape, ',' order by id))`: `a14730c27ef0b9f1d43bed01422b4b87`.

## The write

```sql
update course_outcomes
   set lead = outcomes->>0,
       outcomes = outcomes - 0,
       fingerprint = md5((outcomes - 0)::text),
       shape = case when jsonb_array_length(outcomes) - 1 > 1 then 'list' else 'paragraph' end
 where id between 9385 and 9889 and college = 'Las Positas College' and kind = 'slo' and lead is null
   and outcomes->>0 = 'Upon the completion of this course, the student should be able to:';
-- expected: 505 rows
```

## Rollback

```sql
update course_outcomes
   set outcomes = jsonb_build_array(lead) || outcomes,
       fingerprint = md5((jsonb_build_array(lead) || outcomes)::text),
       shape = 'list',
       lead = null
 where id between 9385 and 9889 and college = 'Las Positas College' and kind = 'slo'
   and lead = 'Upon the completion of this course, the student should be able to:';
-- then check: the before checksum above must read a14730c27ef0b9f1d43bed01422b4b87 again
```

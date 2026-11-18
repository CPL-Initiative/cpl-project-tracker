# Receipt: Golden West SLO rows, the sub-heading moved out of the outcomes (S665, 2026-11-16)

**What:** a guarded UPDATE on `course_outcomes` for 3 Golden West College SLO rows (`kind = 'slo'`, CourseLeaf read
run 41399075269): ids 7540 (CS G154), 7738 (ACCT G212) and 7792 (BUS G121). Each filed the list's sub-heading
*Course outcomes:* (BUS G121: *Course Outcomes:*) as `outcomes[0]` with `lead` null (COBIx on #3389, verified live in
S664). The UPDATE moves that line to `lead`, drops it from `outcomes`, and recomputes `fingerprint` as
`md5(outcomes::text)` (all 3 before-fingerprints reproduced that way first). `shape` stays `list` (each keeps 3 or
more outcomes). No other column, row or table changes. Other SLO rows at the same courses: 0. Fingerprint collisions
after the change: 0.

**Decided** (`d-goldenwest-subhead-fix-in-place-s665`): the fixed CourseLeaf parse (`CCCD_SUBHEAD` in
`kb/_course_outcomes_read.py`) wins, corrected in place so Golden West's reread does not insert a second copy beside
each row (the load only inserts by fingerprint; the same call as `d-laspositas-lead-fix-in-place-s664`). The filed
reads `kb/course_outcomes/cccd/read_41399075269_p{1,2}of2.json` get the same change. Reparsing the 17 filed trials
under the fix changed none of them. Orange Coast's 3 colon-ending rows (MUS A111, A112, A113) are real outcomes and
stay as they are.

**Before-values:** every row had `lead` null, `shape` `list`, `outcomes[0]` matching `^course outcomes:$`
(case-insensitive), and `fingerprint = md5(outcomes::text)`. Checksum of the 3 before-values,
`md5(string_agg(id||':'||fingerprint||':'||shape, ',' order by id))`: `f7a5bf587483873698ff763bafe86133`.

## The write

```sql
update course_outcomes
   set lead = outcomes->>0,
       outcomes = outcomes - 0,
       fingerprint = md5((outcomes - 0)::text)
 where id in (7540, 7738, 7792) and college = 'Golden West College' and kind = 'slo' and lead is null
   and outcomes->>0 ~* '^course outcomes:$';
-- expected: 3 rows
```

## Rollback

```sql
update course_outcomes
   set outcomes = jsonb_build_array(lead) || outcomes,
       fingerprint = md5((jsonb_build_array(lead) || outcomes)::text),
       lead = null
 where id in (7540, 7738, 7792) and college = 'Golden West College' and kind = 'slo'
   and lead ~* '^course outcomes:$';
-- then check: the before checksum above must read f7a5bf587483873698ff763bafe86133 again
```

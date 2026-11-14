-- DRAFT, NOT IN kb/migrations/.apply. Step 1 of the Honors build (S653): the honors_of field's first rows, and the two
-- retitled base rows restamped. Design: docs/reference/honors_of_design.md (*Steps*, step 1). Drafted 2026-11-14T17:17Z.
-- Rulings: Sam, Sheet 197 card 3 (14:37Z 2026-11-14): "Build the field first, then the rows"; "Two-way: either
-- satisfies the other". COBIx's review of #3304: item 1, a pairwise hold before HUMA M10OI merges into HUMA M1110;
-- item 2, the two retitled rows still read automerge-v1@bot 2026-06-12 although S652 changed them.
-- Lands only after the code PR (claude/honors-of-field-s653) merges: kb/_apply_curation.py must fold the field first,
-- or the rows sit in Supabase unread.
--   UPDATE HUMA M1110 unified_title 'World Religions': reviewer automerge-v1@bot -> honors-s652@bot, reviewed_at -> now()
--   UPDATE LIBR M1040 unified_title 'Media & Information Literacy': the same restamp
--   INSERT HUMA M10ME honors_of 'HUMA M1110' (honors-s653@bot)
--   INSERT LIBR M10CJ honors_of 'LIBR M1040' (honors-s653@bot)
-- The two merge_dismissed rows of #3304 stay: harmless beside the pairwise hold, and their own rollback removes them.
-- One plain statement: every write hangs on one guard CTE, and a failed guard raises (the cast of a sentence to int),
-- so nothing is written. The guard: exactly the two title rows, each with its value, automerge-v1@bot and
-- 2026-06-12T22:47:01.69179+00:00, never validated; both Honors records free of any merge_into row (#3304's delete
-- stands); no honors_of row anywhere (the field is new); no row by a reviewer outside @bot on the four ids, or in
-- merge_into, unified_title_merge_confirm or merge_dismissed naming one of them.
-- RETURNING puts each update's before-image and each insert whole into the runner's receipt
-- (kb/receipts/migration_s653_honors_of_field_<run>.json). Rollback: 2026-11-14_s653_honors_of_field_rollback.sql,
-- keyed on the new stamps. ORDER: run that rollback BEFORE 2026-11-14_s652_honors_followups_rollback.sql, which
-- keys on the June stamp this statement replaces.

with expected (course_id, value) as (
  values ('HUMA M1110', 'World Religions'), ('LIBR M1040', 'Media & Information Literacy')
),
target as (
  select k.* from public.kb_curation k
  where k.field = 'unified_title' and k.course_id in (select course_id from expected)
),
honors_rows as (
  select count(*) as n from public.kb_curation h where h.field = 'honors_of'
),
leaf_merges as (
  select count(*) as n from public.kb_curation l
  where l.course_id in ('HUMA M10ME', 'LIBR M10CJ') and l.field = 'merge_into'
),
person as (
  select count(*) as n from public.kb_curation p
  where p.reviewer_email not like '%@bot'
    and (p.course_id in ('HUMA M10ME', 'LIBR M10CJ', 'HUMA M1110', 'LIBR M1040')
         or (p.field in ('merge_into', 'unified_title_merge_confirm', 'merge_dismissed')
             and (p.value like '%HUMA M10ME%' or p.value like '%LIBR M10CJ%' or p.value like '%HUMA M1110%'
                  or p.value like '%LIBR M1040%')))
),
guard as (
  select (select count(*) from target) = 2
     and (select count(*) from target t join expected e on e.course_id = t.course_id
          where t.value = e.value
            and t.reviewer_email = 'automerge-v1@bot'
            and t.reviewed_at::timestamptz = '2026-06-12T22:47:01.69179+00:00'::timestamptz
            and t.validated_at is null and t.validated_by is null) = 2
     and (select n from honors_rows) = 0
     and (select n from leaf_merges) = 0
     and (select n from person) = 0 as ok,
     (select count(*) from target) as target_rows,
     (select n from honors_rows) as honors_rows,
     (select n from leaf_merges) as leaf_merges,
     (select n from person) as person_rows
),
restamped as (
  update public.kb_curation k
  set reviewer_email = 'honors-s652@bot', reviewed_at = now()
  from guard g, target t
  where g.ok and k.course_id = t.course_id and k.field = 'unified_title'
    and k.reviewer_email = 'automerge-v1@bot'
  returning jsonb_build_object('op', 'restamp', 'row_before', to_jsonb(t),
                               'reviewer_after', k.reviewer_email, 'reviewed_at_after', k.reviewed_at) as image
),
added as (
  insert into public.kb_curation as k (course_id, field, value, reviewer_email)
  select v.course_id, 'honors_of', v.value, 'honors-s653@bot'
  from guard g cross join (values ('HUMA M10ME', 'HUMA M1110'), ('LIBR M10CJ', 'LIBR M1040')) as v (course_id, value)
  where g.ok
  on conflict (course_id, field) do nothing
  returning jsonb_build_object('op', 'insert', 'row', to_jsonb(k)) as image
)
select case when g.ok and (select count(*) from restamped) = 2 and (select count(*) from added) = 2
            then (select jsonb_agg(x.image) from (select image from restamped union all select image from added) x)
            else ('refused by the guard: title rows ' || g.target_rows || ', honors_of rows ' || g.honors_rows
                  || ', merges on the Honors records ' || g.leaf_merges || ', person rows ' || g.person_rows
                  || ', or a row differs from the plan')::int::text::jsonb
       end as changed
from guard g;

-- Read back: expect both titles under honors-s652@bot with today's stamp, and two honors_of rows under honors-s653@bot.
--   select course_id, field, value, reviewer_email, reviewed_at from public.kb_curation
--   where (course_id in ('HUMA M1110', 'LIBR M1040') and field = 'unified_title') or field = 'honors_of' order by 1, 2;

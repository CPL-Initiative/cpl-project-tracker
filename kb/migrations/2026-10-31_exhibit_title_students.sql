-- exhibit_title_students: students holding credit on each held title's exhibits, for the Exhibits tab's
-- Review queue (SkyRowanberry, 2026-10-31).
--
-- Sam, 2026-10-30: "prioritize the work on canonicalizing based on the number of estimated students it
-- could touch or does touch now." A held title has no canonical row yet, so map_credential_volume cannot
-- rank it; its exhibits can, through map_student_credit (cpl_memory sam-sheet-147-rulings-2026-10-31,
-- docs/cer_redesign_handoff.md).
--
-- The student-detail ADR (docs/kb-notes/adr-student-detail-aggregate-disclosure-control.md):
--   * The base stays reviewer-only. This function answers only an allowed reviewer (is_allowed_reviewer(),
--     the base table's own SELECT gate) and nobody else: anon and the team phrase get no rows.
--   * k = 10, applied here, so the browser never holds a count below the floor (decision 3: never at
--     render time). 1 to 9 students return students null and suppressed true; 0 returns 0, a legitimate
--     value (decision 5's cheapest complement).
--   * Distinct students, never credit sums, so no measure rides beside a suppressed count (the 2026-08-11
--     amendment).
-- The caller groups the IDs: p_keys[i] names the title p_ids[i] belongs to, and a title's students are
-- counted once across all its exhibits.
--
-- Governance: dismissed in kb/governance_surface_map.json as rpc:exhibit_title_students (a read of the
-- reviewer-only base under its own gate; no new audience, no write).
--
-- Apply by pointing kb/migrations/.apply here, or through the Supabase MCP apply_migration:
--   file=kb/migrations/2026-10-31_exhibit_title_students.sql
--   name=exhibit_title_students
-- Rollback: kb/migrations/2026-10-31_exhibit_title_students_rollback.sql (drops the function; nothing
-- else reads it).

create or replace function public.exhibit_title_students(p_keys text[], p_ids text[])
returns table(key text, students integer, suppressed boolean)
language sql
stable
security definer
set search_path = public
as $$
  with pairs as (
    select k as key, i as exhibit_id
    from unnest(p_keys, p_ids) as u(k, i)
    where k is not null and i is not null
    limit 5000
  ), counted as (
    select p.key, count(distinct m.student_key) as n
    from pairs p
    left join public.map_student_credit m on m.exhibit_id = p.exhibit_id
    group by p.key
  )
  select c.key,
         case when c.n >= 10 then c.n::integer when c.n = 0 then 0 else null end,
         c.n between 1 and 9
  from counted c
  where public.is_allowed_reviewer();
$$;

revoke all on function public.exhibit_title_students(text[], text[]) from public, anon, authenticated;
grant execute on function public.exhibit_title_students(text[], text[]) to authenticated;

comment on function public.exhibit_title_students(text[], text[]) is
  'Distinct students holding credit on each key''s exhibits (map_student_credit), allowed reviewers only, '
  'k=10: 1-9 return null with suppressed true. The Exhibits tab''s Review queue (exhibits.js).';

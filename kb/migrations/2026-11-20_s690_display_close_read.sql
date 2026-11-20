-- S690 (SkyMerlin), the display build's closing count (d-display-confirmed-by-live-count-s685).
-- Read-only: one SELECT, one JSON value; it writes nothing. Through supabase-migrate.yml, as S689 ran its close read.
-- Expected after the whole step=display run of build ac082e9d96dc (run 44774570780: 18,337 written, 156 already, no
-- errors): 18,493 rows at ac082e9d96dc, the rest at older builds; none without a display or a build key.
select json_build_object(
 'read_at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
 'statewide', (select json_object_agg(b, n) from (select coalesce(display->>'build', case when display is null then '(null display)' else '(no build key)' end) b, count(*) n from public.program_requirement_records group by 1) t),
 'no_build_key', (select count(*) from public.program_requirement_records where display is not null and not (display ? 'build')),
 'null_display', (select count(*) from public.program_requirement_records where display is null),
 'total_rows', (select count(*) from public.program_requirement_records)
) as display_close;

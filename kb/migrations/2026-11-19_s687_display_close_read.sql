-- S687 (SkyPipit), the display build: the closing count after the whole-build run 44601141904 (state confirmed).
-- Read-only: one SELECT, one JSON value; it writes nothing. Through supabase-migrate.yml.
-- Expected: 18,380 at build 3361e3aa5b7d, 15 at bef8ef819af7, 16 at 0874a3a15f22 (18,411 rows), none with no display,
-- no display without a build key; Imperial Valley College 125 at 3361e3aa5b7d.
select json_build_object(
 'read_at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
 'college', (select json_object_agg(b, n) from (select coalesce(display->>'build', case when display is null then '(null display)' else '(no build key)' end) b, count(*) n from public.program_requirement_records where college = 'Imperial Valley College' group by 1) t),
 'statewide', (select json_object_agg(b, n) from (select coalesce(display->>'build', case when display is null then '(null display)' else '(no build key)' end) b, count(*) n from public.program_requirement_records group by 1) t),
 'no_build_key', (select count(*) from public.program_requirement_records where display is not null and not (display ? 'build')),
 'total_rows', (select count(*) from public.program_requirement_records)
) as display_close;

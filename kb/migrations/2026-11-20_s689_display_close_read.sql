-- S689 (SkyTern), the display build: the closing count after the whole-build run 44718939233 (state confirmed).
-- Read-only: one SELECT, one JSON value; it writes nothing. Through supabase-migrate.yml.
-- Expected: 18,459 at build 4c57fd250cce, 15 at bef8ef819af7, 16 at 0874a3a15f22 (18,490 rows), none with no display,
-- no display without a build key; Barstow Community College 68 at 4c57fd250cce.
select json_build_object(
 'read_at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
 'college', (select json_object_agg(b, n) from (select coalesce(display->>'build', case when display is null then '(null display)' else '(no build key)' end) b, count(*) n from public.program_requirement_records where college = 'Barstow Community College' group by 1) t),
 'statewide', (select json_object_agg(b, n) from (select coalesce(display->>'build', case when display is null then '(null display)' else '(no build key)' end) b, count(*) n from public.program_requirement_records group by 1) t),
 'no_build_key', (select count(*) from public.program_requirement_records where display is not null and not (display ? 'build')),
 'total_rows', (select count(*) from public.program_requirement_records)
) as display_close;

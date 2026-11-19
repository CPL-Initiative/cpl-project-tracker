-- S685 (SkyTowhee), the display build: the closing count after the whole-build run 44535255196, whose confirming read answered HTTP 500.
-- Read-only: one SELECT, one JSON value; it writes nothing. Through supabase-migrate.yml, as S680 to S684 ran their
-- pre-reads, because the SQL tool's per-call prompt had nobody to answer it.
-- Expected: statewide 18,323 at build 3e8088e082eb, 15 at bef8ef819af7, 16 at 0874a3a15f22, none with no display,
-- no display without a build key; Evergreen Valley College 85 at 3e8088e082eb.
select json_build_object(
 'read_at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
 'college', (select json_object_agg(b, n) from (select coalesce(display->>'build', case when display is null then '(null display)' else '(no build key)' end) b, count(*) n from public.program_requirement_records where college = 'Evergreen Valley College' group by 1) t),
 'statewide', (select json_object_agg(b, n) from (select coalesce(display->>'build', case when display is null then '(null display)' else '(no build key)' end) b, count(*) n from public.program_requirement_records group by 1) t),
 'no_build_key', (select count(*) from public.program_requirement_records where display is not null and not (display ? 'build')),
 'total_rows', (select count(*) from public.program_requirement_records)
) as display_close;

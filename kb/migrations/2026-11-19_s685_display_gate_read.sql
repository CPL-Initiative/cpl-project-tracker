-- S685 (SkyTowhee), the display build's count gate (d-display-missing-threshold-s644: the job is never the gate).
-- Read-only: one SELECT, one JSON value; it writes nothing. Through supabase-migrate.yml, as S680 to S684 ran their
-- pre-reads, because the SQL tool's per-call prompt had nobody to answer it.
-- Expected after run 44531512075 (Evergreen Valley College only): that college 85 rows at build 3e8088e082eb; statewide
-- 85 at 3e8088e082eb and the rest at 545de21a6edc or with no display; no display without a build key.
select json_build_object(
 'read_at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
 'college', (select json_object_agg(b, n) from (select coalesce(display->>'build', case when display is null then '(null display)' else '(no build key)' end) b, count(*) n from public.program_requirement_records where college = 'Evergreen Valley College' group by 1) t),
 'statewide', (select json_object_agg(b, n) from (select coalesce(display->>'build', case when display is null then '(null display)' else '(no build key)' end) b, count(*) n from public.program_requirement_records group by 1) t),
 'no_build_key', (select count(*) from public.program_requirement_records where display is not null and not (display ? 'build')),
 'total_rows', (select count(*) from public.program_requirement_records)
) as display_gate;

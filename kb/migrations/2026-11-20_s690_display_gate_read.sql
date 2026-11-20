-- S690 (SkyMerlin), the display build's count gate (d-display-missing-threshold-s644: the job is never the gate).
-- Read-only: one SELECT, one JSON value; it writes nothing. Through supabase-migrate.yml, as S689 ran its gate.
-- Expected after the step=display run of build ac082e9d96dc (Laney College only, run 44773599660): that college at
-- build ac082e9d96dc; statewide its rows at ac082e9d96dc and the rest at 4c57fd250cce or older or with no display
-- (tonight's inserts); no display without a build key.
select json_build_object(
 'read_at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
 'college', (select json_object_agg(b, n) from (select coalesce(display->>'build', case when display is null then '(null display)' else '(no build key)' end) b, count(*) n from public.program_requirement_records where college = 'Laney College' group by 1) t),
 'statewide', (select json_object_agg(b, n) from (select coalesce(display->>'build', case when display is null then '(null display)' else '(no build key)' end) b, count(*) n from public.program_requirement_records group by 1) t),
 'no_build_key', (select count(*) from public.program_requirement_records where display is not null and not (display ? 'build')),
 'total_rows', (select count(*) from public.program_requirement_records)
) as display_gate;

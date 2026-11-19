-- S684 (SkyVerdin), the reread batch: the conductor's live read for kb/_program_reread_keep_better.py --checked.
-- Read-only: one SELECT, one JSON value; it writes nothing. Run through supabase-migrate.yml as S680 to S683 ran
-- their pre-reads, so the value reaches the reread worker from the receipt and no hand copies it.
--   by_college: every row a person checked (checked = true), by college, at every college.
--   live_runs:  each live row's extracted_run at the batch's ten colleges (COBIx on #3544, finding 2; #3547).
--   null_runs:  how many live rows at each of the ten colleges carry no run (they are left out of live_runs).
select jsonb_build_object(
  'read_at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  'read_by', 'S684 conductor, through supabase-migrate.yml',
  'checked_rows', (select count(*) from public.program_requirement_records where checked = true),
  'by_college', coalesce((select jsonb_object_agg(college, cns) from (
      select college, jsonb_agg(control_number order by control_number) as cns
      from public.program_requirement_records where checked = true group by college) t), '{}'::jsonb),
  'live_runs', coalesce((select jsonb_object_agg(college, runs) from (
      select college, jsonb_object_agg(control_number, extracted_run::text) as runs
      from public.program_requirement_records
      where college in ('Ventura College', 'Cañada College', 'Los Angeles City College', 'Evergreen Valley College',
                        'Solano Community College', 'Shasta College', 'Santa Barbara City College',
                        'Victor Valley College', 'Ohlone College', 'Clovis Community College')
        and extracted_run is not null
      group by college) u), '{}'::jsonb),
  'null_runs', coalesce((select jsonb_object_agg(college, n) from (
      select college, count(*) as n
      from public.program_requirement_records
      where college in ('Ventura College', 'Cañada College', 'Los Angeles City College', 'Evergreen Valley College',
                        'Solano Community College', 'Shasta College', 'Santa Barbara City College',
                        'Victor Valley College', 'Ohlone College', 'Clovis Community College')
        and extracted_run is null
      group by college) v), '{}'::jsonb)
) as live_read;

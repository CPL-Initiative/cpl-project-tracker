-- S741 lane 2's cheap piles: keep-better's live read for East Los Angeles and Santa Monica (read-only, one SELECT,
-- one JSON value). The conductor's first live read (kb/receipts/program_requirements_reread_s741_piles_checked.json)
-- shows East Los Angeles 02456, 31017 and 37510 live on runs older than the committed free reconcile 45176404274,
-- and Santa Monica 43767 live on 37548804006 where the committed record is 39567439681's. A reread posts each
-- committed record, and kb/_program_reread_keep_better.py runs first, from this read: the control numbers a person
-- checked (by_college) and every live row's run (live_runs), at both colleges. The conductor files the value whole
-- as kb/receipts/program_requirements_reread_s741_ela_smc_checked.json (keep-better's --checked file;
-- kb/_program_piles_s741.py LiveRead reads its read_at and live_runs too).
with c(college) as (values ('East Los Angeles College'), ('Santa Monica College'))
select json_build_object(
  'what', 'S741 lane 2 piles: keep-better live read, East Los Angeles and Santa Monica',
  'read_at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  'rows', (select json_object_agg(c.college, (select count(*) from public.program_requirement_records r
                                               where r.college = c.college)) from c),
  'by_college', (select json_object_agg(c.college,
                   coalesce((select json_agg(r.control_number order by r.control_number)
                               from public.program_requirement_records r
                              where r.college = c.college and r.checked), '[]'::json)) from c),
  'live_runs', (select json_object_agg(c.college,
                  coalesce((select json_object_agg(r.control_number, r.extracted_run::text)
                              from public.program_requirement_records r
                             where r.college = c.college), '{}'::json)) from c));

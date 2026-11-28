-- S748 lane 1 (readers): keep-better's live read at Cuyamaca, in the compact form (read-only, one SELECT, one JSON
-- value; the form of kb/migrations/2026-11-27_s742_readers_keep_better_live_read.sql). Free reconcile 46017556328
-- filed 18637 passing (the page's 'CSU or UC transferable units' as electives_fill_words); main files it at reread
-- 46003456131, failing as incomplete. kb/_program_reread_keep_better.py decides run 46017556328 from this read: the
-- control numbers a person checked (by_college, a list) and every live row's run.
-- live_runs comes back grouped by run, {"<college>": {"<run>": "<cn>,<cn>,..."}}, the control numbers in "C" order,
-- with the college's row count and the md5 of its "<cn>:<run>" pairs joined by commas in "C" order of control
-- number. kb/_live_read_expand.py checks the count and the md5 and writes keep-better's own shape as
-- kb/receipts/program_requirements_reread_s748_cuyamaca_checked.json.
with c(college) as (values ('Cuyamaca College')),
g as (select r.college, r.extracted_run::text as run,
             string_agg(r.control_number, ',' order by r.control_number collate "C") as cns
        from public.program_requirement_records r join c on c.college = r.college
       group by r.college, r.extracted_run)
select json_build_object(
  'what', 'S748 lane 1 readers: keep-better live read, Cuyamaca (compact: live_runs grouped by run)',
  'form', 'compact-by-run',
  'read_at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  'count', (select json_object_agg(c.college, (select count(*) from public.program_requirement_records r
                                                where r.college = c.college)) from c),
  'md5', (select json_object_agg(c.college,
            (select md5(coalesce(string_agg(r.control_number || ':' || r.extracted_run::text, ','
                                            order by r.control_number collate "C"), ''))
               from public.program_requirement_records r where r.college = c.college)) from c),
  'by_college', (select json_object_agg(c.college,
                   coalesce((select json_agg(r.control_number order by r.control_number collate "C")
                               from public.program_requirement_records r
                              where r.college = c.college and r.checked), '[]'::json)) from c),
  'live_runs', (select json_object_agg(c.college,
                  coalesce((select json_object_agg(g.run, g.cns) from g where g.college = c.college),
                           '{}'::json)) from c));

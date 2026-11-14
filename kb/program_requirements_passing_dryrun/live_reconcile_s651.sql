-- S651: the one live read that reconciles the dry run's filed counts with the table (aggregates only).
-- Run it, save the rows as JSON, then: python3 kb/_program_requirements_passing_dryrun.py --live FILE
-- live_rows and live_passing compare with the dry run's records and before (every filed record);
-- active_rows and active_passing are the headline's base (HEADLINE_SQL in scripts/queue_status.py);
-- s651_flips_live_passing counts how many of change 4's five pass-to-fail records pass live today.
with act as (select distinct college, control_number from coci_college_programs where status = 'Active')
select r.college,
       count(*) as live_rows,
       count(*) filter (where public.program_record_machine_pass(r.checks)) as live_passing,
       count(a.control_number) as active_rows,
       count(*) filter (where a.control_number is not null
                          and public.program_record_machine_pass(r.checks)) as active_passing,
       count(*) filter (where (r.college, r.control_number) in
                          (('American River College', '04544'), ('Butte College', '01329'),
                           ('College of San Mateo', '31224'), ('College of the Siskiyous', '10949'),
                           ('Cypress College', '32097'))
                          and public.program_record_machine_pass(r.checks)) as s651_flips_live_passing
from public.program_requirement_records r
left join act a on a.college = r.college and a.control_number = r.control_number
group by r.college
order by r.college;

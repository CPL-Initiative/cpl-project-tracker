-- S687 checkpoint, step 12: the headline pair and the whole-harvest row in one read-only statement returning one
-- JSON value. Both halves are the queries `python3 scripts/queue_status.py --headline-sql` and `--harvest-sql` print,
-- unchanged, each wrapped as a subquery. Read only; not pointed at by kb/migrations/.apply.
-- Then: python3 scripts/queue_status.py --stamp --next-run <next_run_at> --headline <active> <complete> <colleges>
--       python3 scripts/queue_status.py --harvest '<the harvest object as JSON>'
select json_build_object(
  'headline', (select row_to_json(h) from (
with act as (select college, control_number from coci_college_programs where status = 'Active'),
c as (select r.college from program_requirement_records r
      join act a on a.college = r.college and a.control_number = r.control_number
      where public.program_record_machine_pass(r.checks))
select (select count(*) from act) active, (select count(*) from c) complete,
  (select count(distinct college) from c) colleges
  ) h),
  'harvest', (select row_to_json(x) from (
with act as (select college, control_number from coci_college_programs where status = 'Active'),
rec as (select r.record, r.checks, r.display from program_requirement_records r
        join act a on a.college = r.college and a.control_number = r.control_number),
crs as (select distinct pc.college, upper(regexp_replace(pc.course_code, '[\s-]+', '', 'g')) code_key from coci_program_courses pc
        join act a on a.college = pc.college and a.control_number = pc.program_control_number
        where upper(regexp_replace(coalesce(pc.course_code, ''), '[\s-]+', '', 'g')) <> '')
select (select count(*) from program_source_registry) colleges,
  (select count(*) from program_source_registry where catalog_url is not null) catalog_links,
  (select count(*) from program_source_registry where cor_access is not null) cms_links,
  (select count(*) from program_source_registry where sequence_source is not null and sequence_source <> 'unknown') ppm_links,
  (select count(*) from act) active_programs,
  (select count(*) from rec where display is not null) roep_programs,
  (select count(*) from rec where checks is not null) coci_compared,
  (select count(*) from rec where record->'program' ? 'outcomes') plo_read,
  (select count(*) from rec where record->'program' ? 'careers') careers_read,
  (select count(*) from crs) program_courses,
  (select count(*) from crs c where exists (select 1 from course_outcomes o
      where o.college = c.college and upper(regexp_replace(o.course_code, '[\s-]+', '', 'g')) = c.code_key
        and o.kind = 'slo')) slo_courses
  ) x)
) as status_reads;

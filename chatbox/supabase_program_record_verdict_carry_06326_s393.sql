-- Open Asks Sheet 82 card 1 (Sam, 2026-10-14 22:14Z, "carry"), once, for the record it names:
-- Cabrillo Astronomy A.S. (06326). Sam confirmed it at 20:24Z (verdict 31) while its units check
-- failed; the reconcile pass (run 38639316727, posted by re-read 38643400229) then added the
-- degree's 60 and its general education 24 and cleared the "at least 30 units in the major" the
-- reading took for the major's total, with every block the same. The re-read function carries a
-- confirm across such a rerun from now on (chatbox/supabase_program_requirement_records_college_
-- reread.sql); this record was replaced before it could.
--
-- The guard, all of it or nothing: verdict 31 is still the latest and a confirm; its fingerprint is
-- the fingerprint of the record the re-read replaced (that record is below, from the re-read's
-- receipt, kb/receipts/program_requirement_records_college_reread_cabrillo_38643400229.json); the
-- row still holds run 38639316727, unchecked; and the live record and the replaced one have the same
-- carry basis (program_record_carry_basis). It then adds the carried confirm in the reviewer's name
-- and touches the row, so program_requirement_records_follow_verdict marks it checked (its machine
-- checks pass: coverage, nothing invented, arithmetic equal; read live 2026-10-14 ~23:30Z).
--
-- Rollback (Rule 10 a2):
--   delete from public.program_record_verdicts where college = 'Cabrillo College' and control_number = '06326'
--     and verdict = 'confirm' and note like 'Carried over from verdict 31:%';
--   update public.program_requirement_records set checked = false, checked_by = null, checked_at = null
--    where college = 'Cabrillo College' and control_number = '06326';
do $carry$
declare
  replaced jsonb := '{"blocks": [{"courses": [{"alternatives": [], "catalog_addition": false, "code": "ASTRO3", "units": 3, "units_max": null}, {"alternatives": [], "catalog_addition": false, "code": "ASTRO4", "units": 3, "units_max": null}, {"alternatives": [], "catalog_addition": false, "code": "ASTRO7", "units": 3, "units_max": null}, {"alternatives": [], "catalog_addition": false, "code": "ASTRO8A", "units": 1, "units_max": null}, {"alternatives": [], "catalog_addition": false, "code": "MATH5A", "units": 5, "units_max": null}, {"alternatives": [], "catalog_addition": false, "code": "MATH5B", "units": 5, "units_max": null}, {"alternatives": [], "catalog_addition": false, "code": "MATH5C", "units": 5, "units_max": null}, {"alternatives": [], "catalog_addition": false, "code": "PHYS4A", "units": 5, "units_max": null}, {"alternatives": [], "catalog_addition": false, "code": "PHYS4B", "units": 5, "units_max": null}, {"alternatives": [], "catalog_addition": false, "code": "PHYS4C", "units": 5, "units_max": null}], "minimum": 30, "name": "Recommended Major Requirements", "option_group": null, "rule": "choose_units", "stated": {"max": 30, "min": 30}}, {"courses": [{"alternatives": [], "catalog_addition": false, "code": "ASTRO3", "units": 3, "units_max": null}, {"alternatives": [], "catalog_addition": false, "code": "ASTRO4", "units": 3, "units_max": null}, {"alternatives": [], "catalog_addition": false, "code": "ASTRO9A", "units": 1.5, "units_max": null}, {"alternatives": [], "catalog_addition": false, "code": "ASTRO25", "units": 1, "units_max": null}, {"alternatives": [], "catalog_addition": false, "code": "CHEM1A", "units": 5, "units_max": null}, {"alternatives": [], "catalog_addition": false, "code": "CHEM1B", "units": 5, "units_max": null}, {"alternatives": [], "catalog_addition": false, "code": "CS19", "units": 4, "units_max": null}, {"alternatives": [], "catalog_addition": false, "code": "GEOL10", "units": 4, "units_max": null}, {"alternatives": [], "catalog_addition": false, "code": "MATH7", "units": 3, "units_max": null}, {"alternatives": [], "catalog_addition": false, "code": "STATC1000", "units": 5, "units_max": null}, {"alternatives": [], "catalog_addition": false, "code": "BUS9", "units": 3, "units_max": null}, {"alternatives": [], "catalog_addition": false, "code": "PSYCH2A", "units": 3, "units_max": null}], "minimum": 6, "name": "Recommended Major Electives", "option_group": null, "rule": "choose_units", "stated": {"max": 6, "min": 6}}], "program": {"careers": ["scientific computer programmer", "telescope operator", "community college instructor", "major observatory telescope operator", "university professorship", "astronaut", "space scientist", "investment finance modeling"], "ge_pattern": "Cabrillo College General Education", "measure": "units", "open_elective_units": null, "outcomes": ["Analyze and evaluate both formal hypotheses and popular-level claims using the principles of science and clear thinking, and arrive at plausible ways to test hypotheses against observations.", "Explore modern astronomy’s subfields: planetary science (including climate), stellar astronomy, cosmology (including how life constrains cosmological theory), and observational astronomical instrumentation.", "Apply basic methods of modern theoretical, computational, and observational astronomy, and perform basic instrumental data acquisition and interpretation."], "section_heading": "Astronomy - Associate in Science (A.S.)", "total_units": {"max": 30, "min": 30}}}'::jsonb;
  v   public.program_record_verdicts%rowtype;
  cur public.program_requirement_records%rowtype;
begin
  select * into cur from public.program_requirement_records
   where college = 'Cabrillo College' and control_number = '06326' for update;
  select * into v from public.program_record_verdicts
   where college = 'Cabrillo College' and control_number = '06326' order by id desc limit 1;
  if not (v.id = 31 and v.verdict = 'confirm'
          and v.requirements_fp = public.program_record_fp(replaced)
          and cur.extracted_run = 38639316727 and not cur.checked
          and public.program_record_fp(cur.record) <> v.requirements_fp
          and public.program_record_carry_basis(cur.record) = public.program_record_carry_basis(replaced)) then
    raise exception 'Astronomy 06326: the carry guard does not hold; nothing written';
  end if;
  insert into public.program_record_verdicts
    (college, control_number, verdict, note, requirements_fp, checked_after, by_email)
  values ('Cabrillo College', '06326', 'confirm',
    'Carried over from verdict 31: reconcile run 38639316727 (re-read 38643400229) changed only the totals '
      || 'and the degree''s figures, with every block the same (Open Asks Sheet 82 card 1).',
    public.program_record_fp(cur.record), public.program_record_machine_pass(cur.checks), v.by_email);
  update public.program_requirement_records set checked = checked
   where college = 'Cabrillo College' and control_number = '06326';
end
$carry$;

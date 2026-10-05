-- S333 (SkyHarbor), 2026-10-05: build 81691460ba18 -> 799bfb9a7dbf on program_requirement_records.display,
-- on Sam's go (open-asks sheet 39 card 1). The two builds differ in two paths only (measured by a JSON diff of
-- the two receipts): "build" on all 20 rows, and the one IWAP 41.09 credential label on Cerritos 42158 (the
-- Ext & Review rename). Each statement is guarded on the before-value, so it changes nothing on a row that holds
-- another build. Proof: the verify query at the foot of
-- kb/receipts/program_requirement_records_display_2026-10-04_799bfb9a7dbf.sql (every row must say match).
-- Rollback: re-apply kb/receipts/program_requirement_records_display_2026-10-04_81691460ba18.sql.
update public.program_requirement_records r
set display = jsonb_set(r.display, array['build'], to_jsonb('799bfb9a7dbf'::text))
where (r.college, r.control_number) in (values
  ('Cerritos College', '36675'),
  ('Cerritos College', '41982'),
  ('Cerritos College', '42158'),
  ('Cerritos College', '45549'),
  ('San Diego Miramar College', '05100'),
  ('San Diego Miramar College', '18207'),
  ('San Diego Miramar College', '35030'),
  ('San Diego Miramar College', '41496'),
  ('Mt. San Antonio College', '03086'),
  ('Mt. San Antonio College', '08086'),
  ('Mt. San Antonio College', '33876'),
  ('Mt. San Antonio College', '42916'),
  ('Riverside City College', '22804'),
  ('Riverside City College', '31456'),
  ('Riverside City College', '39033'),
  ('Riverside City College', '40061'),
  ('West Los Angeles College', '17111'),
  ('West Los Angeles College', '37050'),
  ('West Los Angeles College', '37839'),
  ('West Los Angeles College', '39618'))
  and r.display->>'build' = '81691460ba18';

update public.program_requirement_records r
set display = jsonb_set(r.display, array['courses','IWAP 41.09','here','credentials','0'],
                        to_jsonb('Ironworker Apprenticeship — OSHA 30/Extension Review'::text))
where r.college = 'Cerritos College' and r.control_number = '42158'
  and r.display->>'build' = '799bfb9a7dbf'
  and r.display #>> array['courses','IWAP 41.09','here','credentials','0'] = 'Ext & Review';

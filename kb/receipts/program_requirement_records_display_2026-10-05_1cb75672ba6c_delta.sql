-- S335 (SkyKeel), 2026-10-05: build 799bfb9a7dbf -> 1cb75672ba6c on program_requirement_records.display.
-- Waits on Sam's go (open-asks sheet 42 card 2). The two builds differ in two paths only (measured by a JSON
-- diff of the two builds): "build" on all 20 rows, and "gaps" on San Diego Miramar College 35030, which gains
-- two drafts for the college (MAP names AUTO 156G beside EMGM 106 and FIPT 321P; kb/_build_roep_display.py
-- second_courses). Each statement is guarded on the row's md5 under build 799bfb9a7dbf, so it changes nothing on a
-- row that holds another build (all 20 matched, read-only, 2026-10-05). Independent of sheet 41 card 1's outcomes
-- write, which guards on the record column. Proof after: python3 kb/_build_roep_display.py --verify-sql (every
-- row match). Rollback: re-apply kb/receipts/program_requirement_records_display_2026-10-04_799bfb9a7dbf.sql.

update public.program_requirement_records r
set display = jsonb_set(r.display, array['build'], to_jsonb('1cb75672ba6c'::text))
where r.college = 'Cerritos College' and r.control_number = '36675'
  and md5(r.display::text) = '716dfbe0300ea264101fccb06b3ea07c';

update public.program_requirement_records r
set display = jsonb_set(r.display, array['build'], to_jsonb('1cb75672ba6c'::text))
where r.college = 'Cerritos College' and r.control_number = '41982'
  and md5(r.display::text) = '53f9f918da1be3d3b90d62f776bf7bc3';

update public.program_requirement_records r
set display = jsonb_set(r.display, array['build'], to_jsonb('1cb75672ba6c'::text))
where r.college = 'Cerritos College' and r.control_number = '42158'
  and md5(r.display::text) = '1df2d47c60757391b6f66e8c02e70c97';

update public.program_requirement_records r
set display = jsonb_set(r.display, array['build'], to_jsonb('1cb75672ba6c'::text))
where r.college = 'Cerritos College' and r.control_number = '45549'
  and md5(r.display::text) = '624a1d3940f984424b4c305bb9b73873';

update public.program_requirement_records r
set display = jsonb_set(r.display, array['build'], to_jsonb('1cb75672ba6c'::text))
where r.college = 'San Diego Miramar College' and r.control_number = '05100'
  and md5(r.display::text) = '2b77613ca968a4db659970333abd9dc0';

update public.program_requirement_records r
set display = jsonb_set(r.display, array['build'], to_jsonb('1cb75672ba6c'::text))
where r.college = 'San Diego Miramar College' and r.control_number = '18207'
  and md5(r.display::text) = 'dc72082e6658996414e43b401e0c301e';

update public.program_requirement_records r
set display = jsonb_set(jsonb_set(r.display, array['build'], to_jsonb('1cb75672ba6c'::text)), array['gaps'], '[{"kind":"MAP names a second course","owner":"college","where":"San Diego Miramar College''s articulations in MAP","text":"MAP lists AUTO 156G Engine and Related Systems on the EMT Certification articulation (0.3 hours in Perilaryngeal Airway Adjuncts/Defibrillation Training) beside EMGM 106, the course the recommendation names."},{"kind":"MAP names a second course","owner":"college","where":"San Diego Miramar College''s articulations in MAP","text":"MAP lists AUTO 156G Engine and Related Systems on the Fire Apparatus Driver/Operator 1B articulation (0.3 hours in Driver Operator - Pumping) beside FIPT 321P, the course the recommendation names."},{"kind":"Reader''s note","owner":"procedure","where":"San Diego Miramar College''s CurriQunet META reading procedure","text":"A page break splits the supplemental business list: page 2 opens with a ''Courses / Total Units: 27.0-31.0'' header, then ACCT 102, ACCT 150 and CISC 181 before the occupational list begins. I read these three courses as a continuation of the supplemental business block (3-4 units). That reading is consistent with the stated total, 21 + 3-4 + 3-6 = 27-31. A reviewer should confirm it."},{"kind":"Reader''s note","owner":"procedure","where":"San Diego Miramar College''s CurriQunet META reading procedure","text":"I took the 27.0-31.0 ''Total Units'' printed at the page-2 header as the program total."},{"kind":"Reader''s note","owner":"procedure","where":"San Diego Miramar College''s CurriQunet META reading procedure","text":"The closed list stores ACCT 150 as ''ACCT150'' with no space. The catalog prints ''ACCT 150''; I treated these as the same course, so it is not a catalog addition."},{"kind":"Reader''s note","owner":"procedure","where":"San Diego Miramar College''s CurriQunet META reading procedure","text":"The closed list''s AVIA 101 title reads ''Private Pilot Grounded School''; the catalog prints ''Private Pilot Ground School''. These are the same course."},{"kind":"Reader''s note","owner":"procedure","where":"San Diego Miramar College''s CurriQunet META reading procedure","text":"Both ''or'' pairs, BUSE 102/BUSE 150 and BUSE 155/BUSE 157, print 3.0 units for the pair. Each pair is recorded as one required entry with an alternative."},{"kind":"Reader''s note","owner":"procedure","where":"San Diego Miramar College''s CurriQunet META reading procedure","text":"BUSE 155, BUSE 157 and BUSE 229A-D appear in both elective lists, and in the required list as well. The catalog states ''not already selected above''."},{"kind":"Reader''s note","owner":"procedure","where":"San Diego Miramar College''s CurriQunet META reading procedure","text":"The catalog states no general education pattern in this section; it notes only the 60-unit associate degree minimum."}]'::jsonb)
where r.college = 'San Diego Miramar College' and r.control_number = '35030'
  and md5(r.display::text) = '96efd6f542662569f207063e9a405dd3';

update public.program_requirement_records r
set display = jsonb_set(r.display, array['build'], to_jsonb('1cb75672ba6c'::text))
where r.college = 'San Diego Miramar College' and r.control_number = '41496'
  and md5(r.display::text) = 'fef6760f06d40f8477dd4691ab31b98b';

update public.program_requirement_records r
set display = jsonb_set(r.display, array['build'], to_jsonb('1cb75672ba6c'::text))
where r.college = 'Mt. San Antonio College' and r.control_number = '03086'
  and md5(r.display::text) = '35090f933b4b021a64e75f97fa73677a';

update public.program_requirement_records r
set display = jsonb_set(r.display, array['build'], to_jsonb('1cb75672ba6c'::text))
where r.college = 'Mt. San Antonio College' and r.control_number = '08086'
  and md5(r.display::text) = 'e51b86f6430cc77994cf6a48a4d592ce';

update public.program_requirement_records r
set display = jsonb_set(r.display, array['build'], to_jsonb('1cb75672ba6c'::text))
where r.college = 'Mt. San Antonio College' and r.control_number = '33876'
  and md5(r.display::text) = '02822acf6d94753ab07d702dac250aec';

update public.program_requirement_records r
set display = jsonb_set(r.display, array['build'], to_jsonb('1cb75672ba6c'::text))
where r.college = 'Mt. San Antonio College' and r.control_number = '42916'
  and md5(r.display::text) = '625550de7ba1dd7f34df6ff2a9176b44';

update public.program_requirement_records r
set display = jsonb_set(r.display, array['build'], to_jsonb('1cb75672ba6c'::text))
where r.college = 'Riverside City College' and r.control_number = '22804'
  and md5(r.display::text) = '9fe68a96ff7549c079770023f8ec69ec';

update public.program_requirement_records r
set display = jsonb_set(r.display, array['build'], to_jsonb('1cb75672ba6c'::text))
where r.college = 'Riverside City College' and r.control_number = '31456'
  and md5(r.display::text) = 'ac668773e3f3954579ca9416c2c18fda';

update public.program_requirement_records r
set display = jsonb_set(r.display, array['build'], to_jsonb('1cb75672ba6c'::text))
where r.college = 'Riverside City College' and r.control_number = '39033'
  and md5(r.display::text) = '076481341caba1d1b0285a1eb3ca980b';

update public.program_requirement_records r
set display = jsonb_set(r.display, array['build'], to_jsonb('1cb75672ba6c'::text))
where r.college = 'Riverside City College' and r.control_number = '40061'
  and md5(r.display::text) = 'a56628d128739cd045f3d4612feebee1';

update public.program_requirement_records r
set display = jsonb_set(r.display, array['build'], to_jsonb('1cb75672ba6c'::text))
where r.college = 'West Los Angeles College' and r.control_number = '17111'
  and md5(r.display::text) = 'c622414a5446783fb6c9e4dbdb133dc1';

update public.program_requirement_records r
set display = jsonb_set(r.display, array['build'], to_jsonb('1cb75672ba6c'::text))
where r.college = 'West Los Angeles College' and r.control_number = '37050'
  and md5(r.display::text) = '6317eccbab1715b92a92a219ec2bc1fd';

update public.program_requirement_records r
set display = jsonb_set(r.display, array['build'], to_jsonb('1cb75672ba6c'::text))
where r.college = 'West Los Angeles College' and r.control_number = '37839'
  and md5(r.display::text) = '5639d58193ab8ad8699b51266dba763f';

update public.program_requirement_records r
set display = jsonb_set(r.display, array['build'], to_jsonb('1cb75672ba6c'::text))
where r.college = 'West Los Angeles College' and r.control_number = '39618'
  and md5(r.display::text) = '34e9d332f96bf5be4155c9719878d6ae';

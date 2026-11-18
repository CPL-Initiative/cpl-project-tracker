-- S680 cheap piles, item 2: the units rules. Receipt: kb/receipts/program_requirement_records_units_rules_2026-11-18_s680.json.
-- The plan in two parts (second reader's F1): checks-only, A1 17 rows; full-row, A4 and A5 40 rows (A4 35, A5 5).
-- A6 is off (F5). The collection lane's twelve colleges are not in the list (kb/collection_lane.py).
-- Rollback of part 1, NOT applied. Provisional: all 17 A1 rows back from "equal" to "unequal", guarded on
-- the run; exact only when the pre-read showed checks_only.on_run_equal = 0. After the apply, rebuild it from the
-- returned rows: python3 kb/_program_requirements_rescore.py --rollback-from <migrate receipt> --receipt kb/receipts/program_requirement_records_units_rules_2026-11-18_s680.json.
with v(i, college, control_number, extracted_run) as (values
  (1, 'Bakersfield College', '35984', 38414480070),
  (2, 'Cabrillo College', '43652', 38442109713),
  (3, 'Cerritos College', '16721', 37961137169),
  (7, 'Cerritos College', '43693', 37961137169),
  (8, 'Chaffey College', '20677', 38242003226),
  (9, 'Chaffey College', '35060', 38242003226),
  (19, 'College of the Sequoias', '33662', 38748848139),
  (21, 'Folsom Lake College', '15377', 39046850071),
  (26, 'Long Beach City College', '31812', 38152016534),
  (27, 'Long Beach City College', '33670', 38152016534),
  (28, 'Long Beach City College', '35540', 38152016534),
  (29, 'Long Beach City College', '35914', 38152016534),
  (42, 'Modesto Junior College', '08018', 38477845911),
  (43, 'Modesto Junior College', '32782', 38477845911),
  (44, 'Modesto Junior College', '42279', 38477845911),
  (50, 'San Diego City College', '12093', 38252422845),
  (55, 'Taft College', '44343', 39100858309)),
u as (
update public.program_requirement_records r
   set checks = jsonb_set(r.checks, '{arithmetic}', '"unequal"')
  from v
 where r.college = v.college and r.control_number = v.control_number
   and r.extracted_run = v.extracted_run and r.checks->>'arithmetic' = 'equal'
returning v.i, r.college, r.control_number, r.checked)
select json_build_object('returned', count(*),
       'keys', coalesce(json_agg(u.i order by u.i), '[]'::json),
       'checked', coalesce(json_agg(u.i order by u.i) filter (where u.checked), '[]'::json)) as returned
  from u;

-- S680 cheap piles, item 2: the units rules. Receipt: kb/receipts/program_requirement_records_units_rules_2026-11-18_s680.json.
-- The plan in two parts (second reader's F1): checks-only, A1 17 rows, applied (kb/receipts/migration_s680_prreq_units_rules_apply_checks_44259625861.json returned 17); full-row, A4 and A5 39 rows (A4 34, A5 5), applied (kb/receipts/migration_s680_prreq_units_rules_apply_rows_44261575737.json returned 39).
-- A6 is off (F5). The collection lane's twelve colleges are not in the list (kb/collection_lane.py).
-- Rollback of part 1, NOT applied: the 17 rows the checks-only apply returned, back from "equal" to
-- "unequal", guarded on the run, skipping and listing a row a person checked; it aborts unless it matches
-- those rows less the checked ones (edit its expect line for a partial rollback).
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
c as (select count(*) filter (where r.checked is true) as n,
             coalesce(json_agg(v.i order by v.i) filter (where r.checked is true), '[]'::json) as keys
        from v join public.program_requirement_records r
          on r.college = v.college and r.control_number = v.control_number),
-- A partial rollback: set expect below to the smaller count you mean.
e(expect) as (values (17)),
u as (
update public.program_requirement_records r
   set checks = jsonb_set(r.checks, '{arithmetic}', '"unequal"')
  from v
 where r.college = v.college and r.control_number = v.control_number
   and r.extracted_run = v.extracted_run and r.checks->>'arithmetic' = 'equal'
   and r.checked is not true
returning v.i),
s as (select count(*) as n, coalesce(json_agg(i order by i), '[]'::json) as keys from u)
select case when s.n = e.expect - c.n
            then json_build_object('returned', s.n, 'keys', s.keys, 'skipped_checked', c.keys)
            else ('s680 checks-only rollback guard: the UPDATE matched ' || s.n || ' rows, the plan names ' || (e.expect - c.n))::int::text::json end as returned
  from s, c, e;

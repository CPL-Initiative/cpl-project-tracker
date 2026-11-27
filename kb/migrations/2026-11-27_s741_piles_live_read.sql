-- S741 lane 2's cheap piles: the live read of the held rows (read-only, one SELECT, one JSON value).
-- S740 held seven records as on no proved live run (Gavilan 08464; Cabrillo 11293, 45306; El Camino 19857; Contra
-- Costa 01400, 40761; Santa Monica 21026): the committed receipts post another run, or none, for the row. This read
-- returns, for every key lane 2 still holds at its seventeen colleges, the run its live row holds beside the run
-- the committed record holds (v.filed_run), whether a person checked it, and md5 of its record and checks as
-- jsonb text. The conductor files the value whole as
-- kb/receipts/program_requirements_reread_s741_piles_checked.json (kb/_program_piles_s741.py LiveRead reads its
-- read_at and live_runs; S727's form at College of the Canyons). A key with no live row comes back with a null run.
with v(college, control_number, filed_run) as (values
  ('Shasta College', '18625', 44513230805),
  ('Shasta College', '32162', 39006384701),
  ('American River College', '39731', 39047245752),
  ('American River College', '39732', 39047245752),
  ('Long Beach City College', '37213', 38152016534),
  ('El Camino College', '19883', 45768189197),
  ('El Camino College', '19857', 44480396671),
  ('El Camino College', '31319', 45768189197),
  ('El Camino College', '42541', 45768189197),
  ('Butte College', '14583', 42973457189),
  ('Butte College', '01312', 42973457189),
  ('Santa Monica College', '43767', 39567439681),
  ('Santa Monica College', '21026', 44739378155),
  ('Gavilan College', '08464', 44090922437),
  ('Gavilan College', '45357', 38948144064),
  ('Cabrillo College', '11293', 44090886950),
  ('Cabrillo College', '45306', 44090886950),
  ('Cabrillo College', '06352', 38639316727),
  ('Cabrillo College', '06380', 38639316727),
  ('Cabrillo College', '06381', 38639316727),
  ('Cabrillo College', '44992', 38639316727),
  ('Contra Costa College', '01400', 44687786167),
  ('Contra Costa College', '40761', 44687786167),
  ('Contra Costa College', '33660', 38979730323),
  ('Los Angeles Trade Technical College', '31280', 39115770293),
  ('Los Angeles Trade Technical College', '45285', 39054673977),
  ('Santa Barbara City College', '30746', 38670933359),
  ('Santa Barbara City College', '43553', 38670933359),
  ('Fullerton College', '18166', 38675136988),
  ('Fullerton College', '18749', 38675136988),
  ('Fullerton College', '35174', 38670930336),
  ('Fullerton College', '36798', 38675136988),
  ('Fullerton College', '36863', 38675136988),
  ('City College of San Francisco', '19037', 39047128472),
  ('City College of San Francisco', '32079', 44474797786),
  ('City College of San Francisco', '41315', 39047128472),
  ('City College of San Francisco', '17954', 45132633405),
  ('College of the Sequoias', '06770', 38748848139),
  ('College of the Sequoias', '45030', 38748848139),
  ('East Los Angeles College', '02456', 45176404274),
  ('East Los Angeles College', '31017', 45176404274),
  ('East Los Angeles College', '37510', 45176404274),
  ('East Los Angeles College', '38168', 39063389278),
  ('East Los Angeles College', '41231', 43357061643),
  ('Orange Coast College', '03993', 43136182950),
  ('Orange Coast College', '08628', 38843379313),
  ('Orange Coast College', '08663', 39726645292),
  ('Orange Coast College', '08664', 45858495107),
  ('Orange Coast College', '08670', 39726645292),
  ('Orange Coast College', '19473', 38670927724),
  ('Orange Coast College', '19474', 38670927724),
  ('Orange Coast College', '32790', 44747523200),
  ('Orange Coast College', '36032', 43136182950),
  ('Orange Coast College', '42331', 39726645292),
  ('Orange Coast College', '43100', 38670927724),
  ('Orange Coast College', '08626', 43136182950))
select json_build_object(
  'what', 'S741 lane 2 piles: the live rows of the held keys, read by the conductor',
  'read_at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  'listed', (select count(*) from v),
  'with_live_row', count(r.control_number),
  'on_filed_run', count(*) filter (where r.extracted_run = v.filed_run),
  'checked_now', count(*) filter (where r.checked),
  'live_runs', (select json_object_agg(t.college, t.runs)
                  from (select v2.college, json_object_agg(v2.control_number, r2.extracted_run) as runs
                          from v v2 left join public.program_requirement_records r2
                            on r2.college = v2.college and r2.control_number = v2.control_number
                         group by v2.college) t),
  'rows', json_agg(json_build_object(
            'college', v.college, 'cn', v.control_number, 'filed_run', v.filed_run, 'live_run', r.extracted_run,
            'checked', r.checked, 'rec_md5', md5(r.record::text), 'chk_md5', md5(r.checks::text),
            'arithmetic', r.checks->>'arithmetic', 'coverage', r.checks->'coverage', 'invented', r.checks->'invented',
            'gaps', r.checks->'gaps')
          order by v.college, v.control_number))
  from v left join public.program_requirement_records r
    on r.college = v.college and r.control_number = v.control_number;

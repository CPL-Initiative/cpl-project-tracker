-- S742 lane 2's cheap piles: the live read of the held rows and of six colleges' runs (read-only, one SELECT, one
-- JSON value). For every key lane 2 holds at its thirteen colleges (S740's and S741's holds by key, S720's and
-- S721's rest, East Los Angeles's ten records committed at the free reconcile 45176404274 and its two rows live at
-- that run under a plan-code heading) it returns the run the live row holds beside the run the committed record
-- holds (v.filed_run), whether a person checked it, the md5 of its record and checks as jsonb text, and its checks'
-- arithmetic, coverage, invented and gaps: what is true live. For keep-better, which runs before every reread
-- (kb/_program_reread_keep_better.py --checked): by_college holds the control numbers a person checked at each of
-- the thirteen colleges, and live_runs holds every live row's run at the six colleges a reread may follow at
-- (live_runs_whole: Butte, Orange Coast, Cabrillo, Santa Barbara City, Fullerton, East Los Angeles) and the listed
-- keys' runs at the other seven. The conductor files the value whole as
-- kb/receipts/program_requirements_reread_s742_piles_checked.json (kb/_program_piles_s742.py LiveRead reads its
-- read_at and live_runs; S741's form). A key with no live row comes back with a null run.
with v(college, control_number, filed_run) as (values
  ('Butte College', '14583', 42973457189),
  ('Butte College', '01312', 42973457189),
  ('Orange Coast College', '08663', 39726645292),
  ('Orange Coast College', '08626', 43136182950),
  ('Orange Coast College', '03993', 43136182950),
  ('Orange Coast College', '08670', 39726645292),
  ('Orange Coast College', '36032', 43136182950),
  ('Orange Coast College', '42331', 39726645292),
  ('Orange Coast College', '43100', 38670927724),
  ('Long Beach City College', '37213', 38152016534),
  ('Santa Monica College', '21026', 44739378155),
  ('Santa Monica College', '43767', 39567439681),
  ('Gavilan College', '08464', 44090922437),
  ('Gavilan College', '45357', 38948144064),
  ('Cabrillo College', '11293', 44090886950),
  ('Cabrillo College', '45306', 44090886950),
  ('Cabrillo College', '06352', 38639316727),
  ('Cabrillo College', '06380', 38639316727),
  ('Cabrillo College', '06381', 38639316727),
  ('Cabrillo College', '44992', 38639316727),
  ('Contra Costa College', '33660', 38979730323),
  ('Los Angeles Trade Technical College', '31280', 39115770293),
  ('Los Angeles Trade Technical College', '45285', 39054673977),
  ('Santa Barbara City College', '30746', 38670933359),
  ('Santa Barbara City College', '43553', 38670933359),
  ('Santa Barbara City College', '32775', 39782741424),
  ('Fullerton College', '33680', 38675136988),
  ('Fullerton College', '42143', 38675136988),
  ('Fullerton College', '18166', 38675136988),
  ('Fullerton College', '18749', 38675136988),
  ('Fullerton College', '36863', 38675136988),
  ('East Los Angeles College', '02456', 45176404274),
  ('East Los Angeles College', '31017', 45176404274),
  ('East Los Angeles College', '35087', 45176404274),
  ('East Los Angeles College', '35088', 45176404274),
  ('East Los Angeles College', '35888', 45176404274),
  ('East Los Angeles College', '37510', 45176404274),
  ('East Los Angeles College', '38337', 45176404274),
  ('East Los Angeles College', '41132', 45176404274),
  ('East Los Angeles College', '43725', 45176404274),
  ('East Los Angeles College', '45987', 45176404274),
  ('East Los Angeles College', '32193', 45176404274),
  ('East Los Angeles College', '37969', 45176404274),
  ('East Los Angeles College', '41231', 43357061643),
  ('City College of San Francisco', '19037', 39047128472),
  ('City College of San Francisco', '32079', 44474797786),
  ('City College of San Francisco', '41315', 39047128472),
  ('City College of San Francisco', '17954', 45132633405),
  ('College of the Sequoias', '06770', 38748848139),
  ('College of the Sequoias', '45030', 38748848139)),
whole(college) as (values ('Butte College'), ('Orange Coast College'), ('Cabrillo College'), ('Santa Barbara City College'), ('Fullerton College'), ('East Los Angeles College')),
allc(college) as (values ('Butte College'), ('Orange Coast College'), ('Long Beach City College'), ('Santa Monica College'), ('Gavilan College'), ('Cabrillo College'), ('Contra Costa College'), ('Los Angeles Trade Technical College'), ('Santa Barbara City College'), ('Fullerton College'), ('East Los Angeles College'), ('City College of San Francisco'), ('College of the Sequoias'))
select json_build_object(
  'what', 'S742 lane 2 piles: the live rows of the held keys and six colleges'' live runs, read by the conductor',
  'read_at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  'listed', (select count(*) from v),
  'with_live_row', count(r.control_number),
  'on_filed_run', count(*) filter (where r.extracted_run = v.filed_run),
  'checked_now', count(*) filter (where r.checked),
  'live_runs_whole', (select json_agg(w.college order by w.college) from whole w),
  'college_rows', (select json_object_agg(a.college, (select count(*) from public.program_requirement_records r3
                                                       where r3.college = a.college)) from allc a),
  'by_college', (select json_object_agg(a.college,
                   coalesce((select json_agg(r4.control_number order by r4.control_number)
                               from public.program_requirement_records r4
                              where r4.college = a.college and r4.checked), '[]'::json)) from allc a),
  'live_runs', (select json_object_agg(a.college,
                  coalesce((select json_object_agg(r2.control_number, r2.extracted_run::text)
                              from public.program_requirement_records r2
                             where r2.college = a.college
                               and (a.college in (select college from whole)
                                    or r2.control_number in (select v2.control_number from v v2
                                                              where v2.college = a.college))), '{}'::json))
                  from allc a),
  'rows', json_agg(json_build_object(
            'college', v.college, 'cn', v.control_number, 'filed_run', v.filed_run, 'live_run', r.extracted_run,
            'checked', r.checked, 'rec_md5', md5(r.record::text), 'chk_md5', md5(r.checks::text),
            'arithmetic', r.checks->>'arithmetic', 'coverage', r.checks->'coverage', 'invented', r.checks->'invented',
            'gaps', r.checks->'gaps')
          order by v.college, v.control_number))
  from v left join public.program_requirement_records r
    on r.college = v.college and r.control_number = v.control_number;

-- Open Asks Sheet 82 card 2 (Sam, 2026-10-14 22:14Z, "overlap"): a transfer degree whose major and
-- general education run past its total adds up, because a course counts toward both. The filed
-- records' degree arithmetic rescored by kb/_program_requirements_rescore.py (10: Cabrillo 8, Palo
-- Verde 2), and the live rows' checks.arithmetic moved from "unequal" to "equal" to match. A guarded
-- UPDATE (Rule 10 a): only where the row still holds the filed run and still reads "unequal". The
-- before-values (read live 2026-10-14 ~23:20Z: all 10 present on the filed run, "unequal") and the
-- rollback are in kb/receipts/program_requirement_records_rescore_2026-10-14_s393.json.
update public.program_requirement_records r
   set checks = jsonb_set(r.checks, '{arithmetic}', '"equal"')
  from (values
  ('Cabrillo College', '31987', 38639316727),
  ('Cabrillo College', '32200', 38565227455),
  ('Cabrillo College', '33667', 38639316727),
  ('Cabrillo College', '33673', 38565227455),
  ('Cabrillo College', '35130', 38565227455),
  ('Cabrillo College', '37915', 38565227455),
  ('Cabrillo College', '41374', 38565227455),
  ('Cabrillo College', '46340', 38565227455),
  ('Palo Verde College', '40017', 38567765687),
  ('Palo Verde College', '43196', 38567765687)) as v(college, control_number, extracted_run)
 where r.college = v.college and r.control_number = v.control_number
   and r.extracted_run = v.extracted_run and r.checks->>'arithmetic' = 'unequal'
returning r.college, r.control_number;

-- Open Asks Sheet 81 (Sam, 2026-10-14, cards 1 "count" and 2 "adt"): the filed records'
-- degree arithmetic rescored by kb/_program_requirements_rescore.py, and the live rows'
-- checks.arithmetic moved from "unequal" to "equal" to match. A guarded UPDATE (Rule 10 a):
-- only where the row still holds the filed run and still reads "unequal". The before-values
-- (read live 2026-10-14 ~20:30Z: all 35 present, unchecked, on the filed run, "unequal") and the
-- rollback are in kb/receipts/program_requirement_records_rescore_2026-10-14_s392.json.
update public.program_requirement_records r
   set checks = jsonb_set(r.checks, '{arithmetic}', '"equal"')
  from (values
  ('Cabrillo College', '06329', 38565227455),
  ('Cabrillo College', '06330', 38565227455),
  ('Cabrillo College', '06345', 38565227455),
  ('Cabrillo College', '06373', 38565227455),
  ('Cabrillo College', '06374', 38565227455),
  ('Cabrillo College', '06389', 38565227455),
  ('Cabrillo College', '06396', 38565227455),
  ('Cabrillo College', '10007', 38565227455),
  ('Cabrillo College', '12365', 38565227455),
  ('Cabrillo College', '30754', 38565227455),
  ('Cabrillo College', '30756', 38565227455),
  ('Cabrillo College', '31661', 38565227455),
  ('Cabrillo College', '31689', 38565227455),
  ('Cabrillo College', '32027', 38565227455),
  ('Cabrillo College', '32067', 38565227455),
  ('Cabrillo College', '32069', 38565227455),
  ('Cabrillo College', '32201', 38565227455),
  ('Cabrillo College', '32352', 38565227455),
  ('Cabrillo College', '32498', 38565227455),
  ('Cabrillo College', '32566', 38565227455),
  ('Cabrillo College', '33277', 38565227455),
  ('Cabrillo College', '35570', 38565227455),
  ('Cabrillo College', '35651', 38565227455),
  ('Cabrillo College', '42083', 38565227455),
  ('Cabrillo College', '42662', 38565227455),
  ('Cabrillo College', '43111', 38565227455),
  ('Cabrillo College', '44217', 38565227455),
  ('Cabrillo College', '44898', 38565227455),
  ('Cabrillo College', '45185', 38565227455),
  ('Cabrillo College', '46244', 38565227455),
  ('Palo Verde College', '30710', 38567765687),
  ('Palo Verde College', '39852', 38567765687),
  ('Palo Verde College', '39853', 38567765687),
  ('Palo Verde College', '40016', 38567765687),
  ('Palo Verde College', '40020', 38567765687)) as v(college, control_number, extracted_run)
 where r.college = v.college and r.control_number = v.control_number
   and r.extracted_run = v.extracted_run and r.checks->>'arithmetic' = 'unequal'
returning r.college, r.control_number;

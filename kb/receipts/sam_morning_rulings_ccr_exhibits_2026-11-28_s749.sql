-- S749 SkyGannet, 2026-11-28: Sam's morning-brief rulings (relayed by COBIx), decided by Sam Lee, confidence 100.
-- Four Common Course Reference doubt cards (discipline + a procedure for similar cards) and four held Exhibit titles.
-- INSERT only, ON CONFLICT DO NOTHING, cohort sam-rulings-s749@bot. Live read before writing: none of these 12 keys held a row.
-- Exhibit issuers are unchanged (ACE; Code Tenderloin). The six program-record verdicts are NOT here: the verdict
-- write (program_record_verdict_add) takes a signed-in reviewer, and only Sam has filed one.
insert into public.kb_curation (course_id, field, value, reviewer_email, reviewed_at) values
  ('KINE M1142', 'discipline', 'Health', 'sam-rulings-s749@bot', now()),
  ('_CCR_PROCEDURE_REQUEST::2026-11-28T16:00:00Z-KINE_M1142', 'ccr_procedure_request', '{"mid": "KINE M1142", "title": "First Aid and CPR", "discipline_was": "Kinesiology", "ruling": "move", "to": "Health", "words": "First Aid, CPR and AED courses go to Health, even when a college codes them under Kinesiology.", "similar": true, "decided_by": "Sam Lee", "confidence": 100, "source": "Sam''s morning-brief rulings, 2026-11-28, relayed by COBIx; filed by S749"}', 'sam-rulings-s749@bot', now()),
  ('KINE M1553', 'discipline', 'Kinesiology', 'sam-rulings-s749@bot', now()),
  ('_CCR_PROCEDURE_REQUEST::2026-11-28T16:00:00Z-KINE_M1553', 'ccr_procedure_request', '{"mid": "KINE M1553", "title": "Sport and Film", "discipline_was": "Kinesiology", "ruling": "keep", "to": null, "words": "A course about sport stays in Kinesiology when every course in the group is KIN under TOP 1270, whatever film or identity wording its title has.", "similar": true, "decided_by": "Sam Lee", "confidence": 100, "source": "Sam''s morning-brief rulings, 2026-11-28, relayed by COBIx; filed by S749"}', 'sam-rulings-s749@bot', now()),
  ('KINE M1568', 'discipline', 'Physical Education Disabled Students', 'sam-rulings-s749@bot', now()),
  ('_CCR_PROCEDURE_REQUEST::2026-11-28T16:00:00Z-KINE_M1568', 'ccr_procedure_request', '{"mid": "KINE M1568", "title": "Low Impact Conditioning Exercises", "discipline_was": "Kinesiology", "ruling": "move", "to": "Physical Education Disabled Students", "words": "Fitness courses written for students with disabilities, or coded TOP 0835.80, go to Physical Education Disabled Students.", "similar": true, "decided_by": "Sam Lee", "confidence": 100, "source": "Sam''s morning-brief rulings, 2026-11-28, relayed by COBIx; filed by S749"}', 'sam-rulings-s749@bot', now()),
  ('KINE M1762', 'discipline', 'Recreation Administration', 'sam-rulings-s749@bot', now()),
  ('_CCR_PROCEDURE_REQUEST::2026-11-28T16:00:00Z-KINE_M1762', 'ccr_procedure_request', '{"mid": "KINE M1762", "title": "Introduction to Sport and Recreation Management", "discipline_was": "Kinesiology", "ruling": "move", "to": "Recreation Administration", "words": "Courses on managing sport or recreation go to Recreation Administration, not to Hospitality and not to Kinesiology by default.", "similar": true, "decided_by": "Sam Lee", "confidence": 100, "source": "Sam''s morning-brief rulings, 2026-11-28, relayed by COBIx; filed by S749"}', 'sam-rulings-s749@bot', now()),
  ('_UNCLASSIFIED::ACE CR - Network Fundamentals', 'unified_title_assignment', 'Networking Fundamentals', 'sam-rulings-s749@bot', now()),
  ('_UNCLASSIFIED::AI-1 and AI-3 Portfolio Review KG 11/23/26', 'unified_title_assignment', 'Artificial Intelligence Portfolio Review', 'sam-rulings-s749@bot', now()),
  ('_UNCLASSIFIED::Community Health Worker Certificate-Code Tenderloin', 'unified_title_assignment', 'Community Health Worker Certificate', 'sam-rulings-s749@bot', now()),
  ('_UNCLASSIFIED::Spanish Literature for Bilinguals Examiantion', 'unified_title_assignment', 'Spanish Literature for Bilinguals', 'sam-rulings-s749@bot', now())
on conflict (course_id, field) do nothing;

-- Rollback (Rule 10 a2): delete from public.kb_curation where reviewer_email = 'sam-rulings-s749@bot';

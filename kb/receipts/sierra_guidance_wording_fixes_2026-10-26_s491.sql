-- S491 (SkySalmonberry), 2026-10-26: four switched-on Sierra instructions corrected on the recommendation (Sam's standing
-- rule of 2026-10-20: carry out a recommendation a receipt can undo; Open Asks Sheet 132 card 3 reads 'reply to reverse').
-- Found by the new wording check (sierra_wording_check.js) run on the 18 switched-on instructions, read 17:20Z:
--   858c6c87  the link read crediforbeingyou.org, which leads nowhere; the example quotation closed with a straight mark
--   98258907  the example quotation never closed, so the rest read as part of the question
--   f57638f9  cut mid-sentence at exactly 500 characters, the limit before 2026-08-12 (written 17:21Z that day)
--   6b5ae5d9  asked Sierra to scan map.rccd.edu; she cannot open a website while she answers
-- Each change is the smallest that fixes the fault; the rest of each instruction is untouched (replace() on the exact text).
-- Guarded on updated_at, so a row Sam or the team edited since the read is left alone. Sierra reads active rows on every
-- answer, no deploy. Space: 8,653 of 9,000 characters on My College before, 8,693 after (6b5ae5d9 grows 37).
-- A good result: 4 rows updated; each read back below matches AFTER.
--
-- ROLLBACK (restores each BEFORE exactly):
--   update public.sierra_guidance set rule = 'When someone asks something like “What does the Basic Kitchen Skills (Noncredit program) at Cabrillo College require, and which of its courses can a learner clear through credit for prior learning? I have a serve safe certificate." Answer with a simple table showing the courses and next to the one most aligned with serve safe, list the crediforbeingyou.org link with a note that they can request credit for it. Follow this with the CPL Coord (Sara''s) email and then any descriptive text. We want to lead with the simplest and most direct answer in table form (where possible).', note = 'From a thumbs-up on: What does the Basic Kitchen Skills (Noncredit program) at Cabrillo College require, and which of its courses can a learn', updated_by = '(team)' where id = '858c6c87-672d-4860-90be-60d459144def';
--   update public.sierra_guidance set rule = 'When someone asks something like “How much credit can someone receive for 10 years as an administrative assistant at a school district? Don''t lead with the negative. Instead lead with the possibilities. If just one college has something related available, don''t say only one college...but treat it as a positive and give possible next steps. This is a theme throughout: lead with the simplest, most direct positive options, examples, steps.', note = 'From a question Sierra struggled with: How much credit can someone receive for 10 years as an administrative assistant at a school district? Please explain tha', updated_by = 'slee@cccco.edu' where id = '98258907-2272-4234-be20-342eab36657b';
--   update public.sierra_guidance set rule = 'When referring to Transcribing CPL, note that we are not asking colleges to primarily transcribe in their local SIS. Instead, we are steering them to check the Transcribe step in the MAP Student Intake. This marks the student''s CPL Plan as ready to be transcribed in their local SIS. If infers that the student has discussed their CPL opportunities with a counselor or CPL coordinator and agrees to accept the planned CPL and that it is appropriate for their program of study and transfer destination', note = null, updated_by = '(team)' where id = 'f57638f9-75a5-4d65-ab4b-651885a70e20';
--   update public.sierra_guidance set rule = 'When someone asks something like "What is the agenda for the 2026 CPL Summit?", scan the map.rccd.edu website to information and provide links and current information.', note = 'From a question Sierra struggled with: Vision 2030 summit agenda', updated_by = '(team)' where id = '6b5ae5d9-5103-453d-b974-ac23d69af646';

update public.sierra_guidance
set rule = replace(replace(rule, 'crediforbeingyou.org', 'creditforbeingyou.org'), 'certificate."', 'certificate.”'),
    note = 'From a thumbs-up on: What does the Basic Kitchen Skills (Noncredit program) at Cabrillo College require, and which of its courses can a learn Corrected by S491, 2026-10-26: the link spelled creditforbeingyou.org; the example quotation closed.',
    updated_by = 'sierra-s491@bot (wording check)'
where id = '858c6c87-672d-4860-90be-60d459144def'
  and updated_at = '2026-10-18 17:35:36.983787+00';

update public.sierra_guidance
set rule = replace(rule, 'at a school district? Don', 'at a school district?” Don'),
    note = 'From a question Sierra struggled with: How much credit can someone receive for 10 years as an administrative assistant at a school district? Please explain tha Corrected by S491, 2026-10-26: the example quotation closed after the question.',
    updated_by = 'sierra-s491@bot (wording check)'
where id = '98258907-2272-4234-be20-342eab36657b'
  and updated_at = '2026-09-30 19:15:00.691567+00';

update public.sierra_guidance
set rule = replace(replace(rule, 'If infers that', 'It infers that'), 'transfer destination', 'transfer destination.'),
    note = 'Corrected by S491, 2026-10-26: the last sentence finished (cut at the old 500-character limit on 2026-08-12).',
    updated_by = 'sierra-s491@bot (wording check)'
where id = 'f57638f9-75a5-4d65-ab4b-651885a70e20'
  and updated_at = '2026-08-12 17:21:10.489639+00';

update public.sierra_guidance
set rule = replace(rule, 'scan the map.rccd.edu website to information and provide links and current information.', 'give the link to https://map.rccd.edu for the agenda and current information, and share any summit details you already hold.'),
    note = 'From a question Sierra struggled with: Vision 2030 summit agenda Corrected by S491, 2026-10-26: Sierra cannot open a website while she answers, so she gives the link.',
    updated_by = 'sierra-s491@bot (wording check)'
where id = '6b5ae5d9-5103-453d-b974-ac23d69af646'
  and updated_at = '2026-10-09 15:24:34.727985+00';

select left(id::text,8) id, updated_by, length(rule) n, rule from public.sierra_guidance where id in ('858c6c87-672d-4860-90be-60d459144def', '98258907-2272-4234-be20-342eab36657b', 'f57638f9-75a5-4d65-ab4b-651885a70e20', '6b5ae5d9-5103-453d-b974-ac23d69af646');

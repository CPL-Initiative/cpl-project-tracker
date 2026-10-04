-- S326 (SkyAddendum), 2026-10-04: a probe change filed on the college's record.
-- The registry-aware probe (run 37209313523, branch claude/session-326-handoff-9b6lby, 14:30Z) found Santa
-- Monica College's program maps page answering ("Program Maps - Santa Monica College", HTTP 200); probe run
-- 37198225537 had timed out on it that morning. The page is the college's own, as at Irvine Valley, so its
-- sequence source is open. Same columns and trigger as
-- kb/receipts/program_source_registry_sequence_access_2026-10-04_s326.sql (Sam, open-asks sheet 29 card 3).
--
-- Rollback (Rule 10 a2): the prior row sits in program_source_registry_history under changed_by
-- 'program-sequence-ppm run 37209313523'; restore its four sequence columns from it.

update public.program_source_registry set
  sequence_host        = 'www.smc.edu',
  sequence_access      = 'open',
  sequence_note        = 'The college publishes its program maps on its own site (Program Maps), and the page answered on 2026-10-04 (probe run 37209313523) after timing out earlier that day.',
  sequence_checked_run = 'program-sequence-ppm run 37209313523'
where college = 'Santa Monica College'
  and sequence_access = 'unreached';

-- Read back: one row, open.
select college, sequence_host, sequence_access, sequence_checked_run
from public.program_source_registry where college = 'Santa Monica College';

-- S326 (SkyAddendum), 2026-10-04: the college's record of where its course sequence can be read.
-- Sam, open-asks sheet 29 card 3 (11:59Z), on Miramar's Program Pathways Mapper refusing the reader:
--   "Note this in the record for the college. Rather than ask permission, we will make the agent aware
--    of the limitation and to continue to look for solutions or workarounds."
--
-- Four columns on program_source_registry that the census never writes (program_source_census_apply()
-- names its columns), so a note survives the weekly read:
--   sequence_host         the host the access applies to (the mapper, or the college page holding maps)
--   sequence_access       open | refused | unreached | not_read
--   sequence_note         plain words for a person, the tab and Sierra
--   sequence_checked_run  the run that measured it
-- Filled from two runs' evidence: Miramar from sequence run 37197332656, the other 24 sequence sources
-- the census filed from probe run 37198225537 (17 refused, 6 answered, 1 timed out). Count by code.
--
-- The history trigger now names sequence_checked_run when it changes, so each prior row filed here
-- carries the run that changed it.
--
-- Rollback (Rule 10 a2): set the four columns back to null on these 25 colleges; the prior rows sit in
-- program_source_registry_history under changed_by 'program-sequence-ppm run 37198225537' and
-- 'program-sequence-ppm run 37197332656'. The columns are new, so every prior value was null.

alter table public.program_source_registry
  add column if not exists sequence_host        text,
  add column if not exists sequence_access      text
    check (sequence_access in ('open', 'refused', 'unreached', 'not_read')),
  add column if not exists sequence_note        text,
  add column if not exists sequence_checked_run text;

create or replace function public.program_source_registry_keep_history()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into public.program_source_registry_history (college, changed_by, op, old_row)
  values (
    old.college,
    case when tg_op = 'UPDATE'
         then coalesce(
                case when new.corrected_at is distinct from old.corrected_at
                     then new.corrected_by end,
                case when new.sequence_checked_run is distinct from old.sequence_checked_run
                     then new.sequence_checked_run end,
                new.census_run_id)
    end,
    tg_op,
    to_jsonb(old));
  if tg_op = 'UPDATE' then
    new.updated_at := now();
    return new;
  end if;
  return old;
end
$$;

with policy as (select
  'The reader keeps its name and never retries a refusal another way. It looks for the sequence on the college''s own pages and in its catalog, and asks this host''s front page once a run whether it has opened (Sam, open-asks sheet 29 card 3, 2026-10-04).'::text as tail),
v(college, host, access, run, lead) as (values
  ('Bakersfield College', 'programmap.bakersfieldcollege.edu', 'not_read', '37198225537', null),
  ('Cañada College', 'canada.programmapper.ws', 'refused', '37198225537', null),
  ('College of the Canyons', 'canyons.programmapper.ws', 'refused', '37198225537', null),
  ('Compton College', 'programmap.compton.edu', 'refused', '37198225537', null),
  ('Contra Costa College', 'mypath.contracosta.edu', 'refused', '37198225537', null),
  ('Cuesta College', 'programmap.cuesta.edu', 'refused', '37198225537', null),
  ('Cypress College', 'programmap.cypresscollege.edu', 'refused', '37198225537', null),
  ('Hartnell College', 'pm.hartnell.edu', 'refused', '37198225537', null),
  ('Imperial Valley College', 'programmap.imperial.edu', 'refused', '37198225537', null),
  ('Irvine Valley College', 'www.ivc.edu', 'open', '37198225537', null),
  ('Las Positas College', 'las-positas.programmapper.ws', 'refused', '37198225537', null),
  ('Los Angeles Harbor College', 'la-harbor.programmapper.com', 'not_read', '37198225537', null),
  ('Madera College', 'programmap.maderacollege.edu', 'refused', '37198225537', null),
  ('Merced College', 'merced.programmapper.com', 'not_read', '37198225537', null),
  ('Moorpark College', 'programmap.moorparkcollege.edu', 'refused', '37198225537', null),
  ('Napa Valley College', 'napa-valley.programmapper.com', 'refused', '37198225537', null),
  ('Oxnard College', 'oxnard.programmapper.org', 'refused', '37198225537', null),
  ('Palo Verde College', null, 'not_read', '37198225537', 'The census''s sequence address is a ''#'' link on the homepage; no program map has been found yet.'),
  ('Reedley College', 'programmap.reedleycollege.edu', 'refused', '37198225537', null),
  ('San Diego Miramar College', 'san-diego-miramar.programmapper.com', 'refused', '37197332656', 'Miramar''s Program Pathways Mapper, linked from sdmiramar.edu/program-mapper, answered all seven of the reader''s requests 403 Forbidden on 2026-10-04 (sequence run 37197332656), and the 17 other mapper hosts probed that day did the same: the refusal is the mapper service''s. The pilot''s sequence for Fire Technology A.S. (05100) is not yet read. '),
  ('San Jose City College', 'jaguarspot.sjcc.edu', 'refused', '37198225537', null),
  ('Santa Monica College', 'www.smc.edu', 'unreached', '37198225537', null),
  ('Ventura College', 'programmap.venturacollege.edu', 'refused', '37198225537', null),
  ('West Los Angeles College', 'programmap.wlac.edu', 'not_read', '37198225537', null),
  ('West Valley College', 'programmapper.westvalley.edu', 'refused', '37198225537', null)
)
update public.program_source_registry as r set
  sequence_host        = v.host,
  sequence_access      = v.access,
  sequence_note        = case
    when v.lead is not null and v.access = 'refused' then v.lead || p.tail
    when v.lead is not null then v.lead
    when v.access = 'refused' then v.host || ' answered 403 Forbidden to the CPL Initiative''s reader on 2026-10-04, as did every program map host probed that day (17 of 17). ' || p.tail
    when v.access = 'unreached' then 'The program maps page did not load within 30 seconds on 2026-10-04; the next probe asks again.'
    when v.access = 'open' then 'The college publishes its program maps on its own site (All Program Maps), and the page answered on 2026-10-04.'
    else 'The college''s page about its program mapper answered on 2026-10-04 and links to ' || v.host || ', which has not been read. Every mapper host probed that day refused the reader.'
  end,
  sequence_checked_run = 'program-sequence-ppm run ' || v.run
from v, policy p
where r.college = v.college;

-- Read back: 25 rows; 18 refused, 5 not_read, 1 open, 1 unreached.
select sequence_access, count(*) from public.program_source_registry
where sequence_checked_run is not null group by 1 order by 1;

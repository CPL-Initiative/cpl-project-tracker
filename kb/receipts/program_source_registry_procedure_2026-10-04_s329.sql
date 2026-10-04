-- S329 (SkyRunner), 2026-10-04: Cerritos College's procedure record, the first one.
-- Sam, open-asks sheet 34 card 2 (2026-10-04 19:18Z, as proposed): one procedure record per college,
-- kept with its history on the college's registry row (hosts, platform, reading steps, refusals,
-- workarounds tried, nuances); the reader loads it before each run; a request to a college is drafted
-- only when its record shows every step tried (sheet 33 card 5). Sam's go to write it, in session
-- (2026-10-04 ~21:20Z): "apply the procedure record".
--
-- Filled from three college-page-read runs on PR #1858 (37232742985, 37233721702, 37234256967).
-- Anyone with the public key reads the registry, so the record names hosts and offices, never staff.
--
-- Rule 10: a guarded UPDATE on one row, under a reviewed plan (sheet 34 card 2) and Sam's go. Fresh read
-- before the write: Cerritos's row had corrected_by null, census_run_id census-20261004T152831Z-s3of4,
-- and no procedure columns. The columns are new, so the before-values are null; the history trigger files
-- the prior row under changed_by 'college-page-read S329'.
-- Rollback (Rule 10 a2):
--   update public.program_source_registry set procedure = null, procedure_by = null, procedure_at = null
--   where college = 'Cerritos College';
-- and, to drop the columns, alter table ... drop column procedure, procedure_by, procedure_at, then
-- restore the trigger from kb/receipts/program_source_registry_sequence_access_2026-10-04_s326.sql.

-- Migration program_source_registry_procedure_2026_10_04 (also in kb/supabase_program_source_registry.sql)
alter table public.program_source_registry
  add column if not exists procedure    jsonb,
  add column if not exists procedure_by text,
  add column if not exists procedure_at timestamptz;

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
                case when new.procedure_at is distinct from old.procedure_at
                     then new.procedure_by end,
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
revoke all on function public.program_source_registry_keep_history() from public, anon, authenticated;

-- The record (guarded: one row, only while it carries no procedure).
-- STATUS 2026-10-04 ~21:25Z: the migration above is applied; this UPDATE is NOT. Two runs through the
-- Supabase connector's apply_migration timed out at 60 s with nothing written (no lock, no running query),
-- and execute_sql's guard routes data writes away from it. Sam runs it in the SQL editor, or confirms it
-- when the connector asks.
update public.program_source_registry
   set procedure    = '{
 "v": 1,
 "college": "Cerritos College",
 "reader": "kb/_college_page_read.py (robots.txt first, 4 s between loads, the census user agent)",
 "hosts": [
  {
   "host": "www.cerritos.edu",
   "access": "open",
   "platform": "custom_html",
   "note": "The college''s own pages. Each wraps a menu, a footer and a 240-language picker; the reader reads the main region. Older /epp/, /technology/ and /releases-2026/ addresses redirect under /academics/divisions/ and /newsroom/releases/. robots.txt disallows /uploads/."
  },
  {
   "host": "cerritos-public.courseleaf.com",
   "access": "open",
   "platform": "courseleaf",
   "note": "The 2026-27 catalog. Program pages print course lists with units; course-description pages print each course''s contact hours. The department PDF under /departments/adult-education/ answers 404."
  },
  {
   "host": "secure.cerritos.edu",
   "access": "open",
   "platform": "custom_cgi",
   "note": "Schedule+ (Fall 2026 and Spring 2027). A department is chosen by form: POST /schedule/courses.cgi with Terms (1269 Fall 2026, 1273 Spring 2027) and Depts (AED, IWAP). No link reaches a department''s sections."
  },
  {
   "host": "hsarticulation.cerritos.edu",
   "access": "unreached",
   "note": "No DNS record on 2026-10-04 (run 37232742985), though search results still list its About page."
  },
  {
   "host": "regionalcte.org",
   "access": "open",
   "platform": "outside",
   "note": "The Los Angeles regional program record for the B.S. (browse/ZyxAg). Its course table renders only in a browser."
  },
  {
   "host": "web.dusd.net",
   "access": "open",
   "platform": "outside",
   "note": "Downey Unified, the partner district whose welding pathway maps to Cerritos''s WELD courses."
  }
 ],
 "steps": [
  {
   "date": "2026-10-04",
   "run": "37232742985",
   "plan": "kb/college_reads/cerritos_ironworker_ladder.json",
   "loads": 20,
   "reached": 18,
   "found": "The regional record''s B.S. course list (23 courses, 60 units) and admission rule; Cerritos''s May 2026 statement that the B.S. is approved; the Pre-Apprenticeship certificate''s 188 hours and its registered-apprentice rule. The log window (5,000 lines) cut the first two pages."
  },
  {
   "date": "2026-10-04",
   "run": "37233721702",
   "plan": "kb/college_reads/cerritos_ironworker_ladder_read2.json",
   "loads": 14,
   "reached": 12,
   "found": "The Field Ironwork page: a four-year apprenticeship, the B.S. open to graduates from Spring 2027. The IWAP course descriptions: 878 contact hours on the Reinforcing track, 898 on the Structural. The Technology division: agreements published through Statewide Career Pathways. Downey Unified''s 2023 board presentation: the Columbus High welding pathway maps to WELD 60 and WELD 100."
  },
  {
   "date": "2026-10-04",
   "run": "37234256967",
   "plan": "kb/college_reads/cerritos_ironworker_ladder_read3.json",
   "loads": 4,
   "reached": 4,
   "found": "All 26 AED 40.01-41.10 noncredit ironworker courses are in the 2026-27 catalog; WELD 60 is now WELD 160; the Schedule+ form''s fields; the Technology page names Statewide Career Pathways without a link."
  }
 ],
 "answers": [
  {
   "question": "The B.S. course list, admission rule and first cohort.",
   "status": "partly answered",
   "answer": "Proposed list and admission rule from the 2024 regional record; first entry Spring 2027 (Field Ironwork page). Open: whether the approved degree keeps the 2024 list; the 2026-27 catalog does not list it."
  },
  {
   "question": "The high school articulation list.",
   "status": "open",
   "answer": "The college publishes no list on its own site. Its agreements are published through Statewide Career Pathways; Downey Unified maps the Columbus High welding pathway to WELD 160 and WELD 100."
  },
  {
   "question": "Whether the 26 noncredit AED courses still run.",
   "status": "partly answered",
   "answer": "All 26 are in the 2026-27 catalog. Open: sections this term."
  },
  {
   "question": "The apprenticeship''s classroom hours.",
   "status": "answered",
   "answer": "878 contact hours on the Reinforcing track (622 lecture, 256 laboratory) and 898 on the Structural track (677 and 221), from the 2026-27 IWAP course descriptions; the apprenticeship runs four years."
  }
 ],
 "nuances": [
  "Articulation is faculty-driven: the Educational Partnerships & Programs office drafts each agreement on the Statewide Career Pathways template and keeps the signed original.",
  "High school credit comes by credit by exam after an articulated course, or through CCAP dual enrollment taught at the high school.",
  "Every IWAP course requires a registered state indentured apprentice; the noncredit Pre-Apprenticeship certificate requires acceptance by an apprenticeship program and registration with the State.",
  "The ironworker flyer prints 27.5 certificate units over 8 semesters; the 2026-27 catalog prints 34 and 38. The catalog of the academic year wins (sheet 23).",
  "Cerritos''s 2026 programs flyer and its 2026-27 catalog list Dental Hygiene as its only B.S.; the Field Ironworker Supervision B.S. appears on its Field Ironwork page and in its State of the College release."
 ],
 "workarounds": [],
 "open": [
  {
   "question": "Sections this term for AED 40.01-41.10 and IWAP",
   "next": "Read Schedule+ for Terms 1269 and 1273, Depts AED and IWAP (a form POST to /schedule/courses.cgi; the reader needs a form step)."
  },
  {
   "question": "Cerritos''s high school articulation agreements",
   "next": "Find the Statewide Career Pathways agreement database (SB 70) and search it for Cerritos; then the Technology Pathways roadmaps page (/academics/divisions/technology/technology-roadmaps.htm)."
  },
  {
   "question": "Whether the approved B.S. keeps the 2024 course list",
   "next": "Watch the catalog addenda and the 2027-28 catalog; the census''s addenda pass already reads Cerritos."
  }
 ],
 "request_ready": false
}'::jsonb,
       procedure_by = 'college-page-read S329',
       procedure_at = now()
 where college = 'Cerritos College'
   and procedure is null;

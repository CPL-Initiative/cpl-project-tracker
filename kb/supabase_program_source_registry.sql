-- supabase_program_source_registry.sql — Phase 0 of the program requirements
-- harvest: one row per college recording where its program requirements live
-- and how we read them best.
--
-- Lane: docs/reference/lanes/program-requirements-harvest.md. Plan (Sam's Claude
-- Doc): https://claude.ai/code/artifact/77ae8cb2-443b-45e3-b287-594c9c9b8744,
-- section "The source registry". Sam ruled the plan's eight calls "As proposed"
-- on sheet 23 (2026-10-03 15:05Z); call 5 approves reading college websites from
-- GitHub runners on a slow schedule that names the CPL Initiative. He gave the
-- go for this table, its history and its write function on 2026-10-03 (S320).
--
-- WHO WRITES
--   * The census (kb/_program_source_census.py on
--     .github/workflows/program-source-census.yml) writes ONLY through
--     program_source_census_apply(), with the service key.
--   * A person corrects a row with a direct UPDATE that sets corrected_by and
--     corrected_at. From then on the census never overwrites that row's decided
--     fields: it files what it saw in census_evidence and raises
--     census_disagrees when its reading differs (CLAUDE.md Rule 10: a human row
--     wins).
--
-- REVERSIBLE (Rule 10 a2): every UPDATE or DELETE copies the old row into
-- program_source_registry_history, with who changed it (the census run id, or
-- the person when corrected_at moves). A census run rolls back by restoring the
-- history rows whose changed_by is its run id.
--
-- READERS: the registry holds public facts about public websites (catalog
-- addresses, the vendor serving them, whether a page answered), so anon and
-- authenticated may SELECT it. No staff contact lives here; the college's
-- articulation officer joins from map_college_contacts when Phase 1 needs one.
-- The history table has no API read.
--
-- SEED: one row per college in coci_college_programs (118 on 2026-10-03: 115
-- with active credit programs, the two continuing-education colleges, and
-- Calbright). Homepages come from kb/reference/ccc_colleges_ceo_2026.json (the
-- CEO list, 2026-08-12), reduced to the https site root. Three CEO pages sat on
-- a president's or vendor host and were set to the college's own root (Marin,
-- Santa Rosa, Solano); Lemoore keeps the West Hills path and Madera the
-- maderacenter.com host the CEO list cites. The census follows redirects and
-- files where each lands, so a wrong seed shows in its evidence.
--
-- ✅ APPLIED 2026-10-03 (S320) to the "Work Plan" project (hvuwhnbuahrtptokpqfh)
-- through the Supabase MCP, as four migrations: program_source_registry (the
-- tables, trigger, RLS and grants), program_source_census_apply,
-- program_source_registry_seed, program_source_registry_close_writes. The MCP's
-- apply held the whole file for a confirmation it could not show and timed out
-- at 60 s with nothing applied, twice; the two `drop ... if exists` lines were
-- the only difference, and a fresh table needs neither, so the live apply
-- left them out. They stay here so the file re-runs cleanly. Read back after
-- apply: 118 rows (Calbright College Credit has no map_colleges id); the apply
-- function and the trigger function are closed to anon and authenticated
-- (has_function_privilege false) and open to service_role.
-- Security advisor after apply: one new INFO (rls_enabled_no_policy on the
-- history table, which is service-role only by design); no new WARN.

-- ── Tables ─────────────────────────────────────────────────────────────────
create table if not exists public.program_source_registry (
  college            text primary key,          -- coci_college_programs.college
  college_id         integer,                   -- map_colleges.college_id
  mis_college_code   text,
  homepage_url       text not null,
  catalog_url        text,                      -- the current catalog's home
  catalog_year       text,                      -- '2026-2027'
  catalog_platform   text check (catalog_platform in (
                       'courseleaf','acalog','coursedog','elumen','curriqunet',
                       'smartcatalog','cleancatalog','kuali','webcms','custom_html',
                       'pdf','flipbook','other','unknown')),
  catalog_format     text check (catalog_format in (
                       'html_per_program','single_pdf','pdf_by_section',
                       'flipbook','unknown')),
  cms_public_view    text,                      -- a public curriculum-system URL, if seen
  sequence_source    text check (sequence_source in (
                       'ppm','program_map_page','none_found','unknown')),
  sequence_url       text,
  best_method        text check (best_method in (
                       'platform_reader','pdf_extraction','inference','person','unknown')),
  access_status      text check (access_status in (
                       'ok','blocked','robots_disallow','unreachable','not_found')),
  access_notes       text,
  trust_evidence     text,                      -- Phase 1: records matched / tested, date
  census_evidence    jsonb,                     -- what the census saw, page by page
  census_run_id      text,
  census_checked_at  timestamptz,
  census_disagrees   boolean not null default false,
  corrected_by       text,
  corrected_at       timestamptz,
  correction_note    text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.program_source_registry_history (
  id          bigserial primary key,
  college     text not null,
  changed_at  timestamptz not null default now(),
  changed_by  text,                             -- census run id, or the person
  op          text not null,                    -- UPDATE or DELETE
  old_row     jsonb not null
);
create index if not exists program_source_registry_history_college
  on public.program_source_registry_history (college, changed_at desc);

-- ── History trigger ────────────────────────────────────────────────────────
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
revoke all on function public.program_source_registry_keep_history() from public, anon, authenticated;

drop trigger if exists program_source_registry_history on public.program_source_registry;
create trigger program_source_registry_history
  before update or delete on public.program_source_registry
  for each row execute function public.program_source_registry_keep_history();

-- ── RLS + grants ───────────────────────────────────────────────────────────
alter table public.program_source_registry enable row level security;
alter table public.program_source_registry_history enable row level security;

drop policy if exists program_source_registry_read on public.program_source_registry;
create policy program_source_registry_read on public.program_source_registry
  for select to anon, authenticated using (true);
-- No insert/update/delete policy: the census writes through the definer
-- function below, and a person's correction runs as the service role or in the
-- SQL editor. The history table has no API policy at all.

grant select on public.program_source_registry to anon, authenticated;
grant select, insert, update, delete on public.program_source_registry to service_role;
grant select, insert on public.program_source_registry_history to service_role;
grant usage, select on sequence public.program_source_registry_history_id_seq to service_role;
-- This project's default privileges hand anon and authenticated every table
-- privilege on a new table. RLS stops their INSERT and hides the history rows,
-- but TRUNCATE ignores RLS, so the extras are revoked outright. Read back
-- 2026-10-03: anon and authenticated hold SELECT on the registry and nothing
-- else on either table.
revoke insert, update, delete, truncate, references, trigger
  on public.program_source_registry from anon, authenticated;
revoke all on public.program_source_registry_history from anon, authenticated;
revoke all on sequence public.program_source_registry_history_id_seq from anon, authenticated;

-- ── The census writes here and nowhere else ────────────────────────────────
-- p_rows: a JSON array, one object per college, keys named as the columns
-- (college, homepage_url, catalog_url, catalog_year, catalog_platform,
-- catalog_format, cms_public_view, sequence_source, sequence_url, best_method,
-- access_status, access_notes, census_evidence). Returns the counts.
create or replace function public.program_source_census_apply(p_run_id text, p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r       jsonb;
  cur     public.program_source_registry%rowtype;
  n_upd   int := 0;
  n_held  int := 0;
  n_ins   int := 0;
  n_skip  int := 0;
begin
  if p_run_id is null or length(p_run_id) < 6 then
    raise exception 'program_source_census_apply: a run id is required';
  end if;
  for r in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    select * into cur from public.program_source_registry where college = r->>'college';
    if not found then
      if coalesce(r->>'homepage_url', '') = '' then
        n_skip := n_skip + 1;
        continue;
      end if;
      insert into public.program_source_registry (college, homepage_url)
      values (r->>'college', r->>'homepage_url');
      n_ins := n_ins + 1;
      select * into cur from public.program_source_registry where college = r->>'college';
    end if;

    if cur.corrected_by is null then
      update public.program_source_registry set
        catalog_url       = r->>'catalog_url',
        catalog_year      = r->>'catalog_year',
        catalog_platform  = r->>'catalog_platform',
        catalog_format    = r->>'catalog_format',
        cms_public_view   = r->>'cms_public_view',
        sequence_source   = r->>'sequence_source',
        sequence_url      = r->>'sequence_url',
        best_method       = r->>'best_method',
        access_status     = r->>'access_status',
        access_notes      = r->>'access_notes',
        census_evidence   = r->'census_evidence',
        census_run_id     = p_run_id,
        census_checked_at = now(),
        census_disagrees  = false
      where college = cur.college;
      n_upd := n_upd + 1;
    else
      -- A person corrected this row: keep their values, file the reading.
      update public.program_source_registry set
        census_evidence   = coalesce(r->'census_evidence', '{}'::jsonb)
                            || jsonb_build_object('census_values', r - 'census_evidence'),
        census_run_id     = p_run_id,
        census_checked_at = now(),
        census_disagrees  = (cur.catalog_url      is distinct from r->>'catalog_url'
                          or cur.catalog_platform is distinct from r->>'catalog_platform'
                          or cur.catalog_year     is distinct from r->>'catalog_year')
      where college = cur.college;
      n_held := n_held + 1;
    end if;
  end loop;
  return jsonb_build_object('run_id', p_run_id, 'updated', n_upd,
                            'held_for_person', n_held, 'inserted', n_ins,
                            'skipped', n_skip);
end
$$;
revoke all on function public.program_source_census_apply(text, jsonb) from public, anon, authenticated;
grant execute on function public.program_source_census_apply(text, jsonb) to service_role;

-- ── Seed: one row per college, homepage only ───────────────────────────────
with h(name, url) as (values
  ('Allan Hancock College', 'https://www.hancockcollege.edu/'),
  ('American River College', 'https://arc.losrios.edu/'),
  ('Antelope Valley College', 'https://www.avc.edu/'),
  ('Bakersfield College', 'https://www.bakersfieldcollege.edu/'),
  ('Barstow Community College', 'https://www.barstow.edu/'),
  ('Berkeley City College', 'https://www.berkeleycitycollege.edu/'),
  ('Butte College', 'https://www.butte.edu/'),
  ('Cabrillo College', 'https://www.cabrillo.edu/'),
  ('Calbright College Credit', 'https://www.calbright.org/'),
  ('Cañada College', 'https://canadacollege.edu/'),
  ('Cerritos College', 'https://www.cerritos.edu/'),
  ('Cerro Coso Community College', 'https://www.cerrocoso.edu/'),
  ('Chabot College', 'https://www.chabotcollege.edu/'),
  ('Chaffey College', 'https://www.chaffey.edu/'),
  ('Citrus College', 'https://www.citruscollege.edu/'),
  ('City College of San Francisco', 'https://www.ccsf.edu/'),
  ('Clovis Community College', 'https://www.cloviscollege.edu/'),
  ('Coalinga College', 'https://coalingacollege.edu/'),
  ('Coastline College', 'https://www.coastline.edu/'),
  ('College of Alameda', 'https://alameda.edu/'),
  ('College of Marin', 'https://www.marin.edu/'),
  ('College of San Mateo', 'https://collegeofsanmateo.edu/'),
  ('College of the Canyons', 'https://www.canyons.edu/'),
  ('College of the Desert', 'https://collegeofthedesert.edu/'),
  ('College of the Redwoods', 'https://www.redwoods.edu/'),
  ('College of the Sequoias', 'https://www.cos.edu/'),
  ('College of the Siskiyous', 'https://www.siskiyous.edu/'),
  ('Columbia College', 'https://www.gocolumbia.edu/'),
  ('Compton College', 'https://www.compton.edu/'),
  ('Contra Costa College', 'https://www.contracosta.edu/'),
  ('Copper Mountain College', 'https://www.cmccd.edu/'),
  ('Cosumnes River College', 'https://crc.losrios.edu/'),
  ('Crafton Hills College', 'https://www.craftonhills.edu/'),
  ('Cuesta College', 'https://www.cuesta.edu/'),
  ('Cuyamaca College', 'https://www.cuyamaca.edu/'),
  ('Cypress College', 'https://www.cypresscollege.edu/'),
  ('De Anza College', 'https://www.deanza.edu/'),
  ('Diablo Valley College', 'https://www.dvc.edu/'),
  ('East Los Angeles College', 'https://www.elac.edu/'),
  ('El Camino College', 'https://www.elcamino.edu/'),
  ('Evergreen Valley College', 'https://www.evc.edu/'),
  ('Feather River College', 'https://www.frc.edu/'),
  ('Folsom Lake College', 'https://flc.losrios.edu/'),
  ('Foothill College', 'https://foothill.edu/'),
  ('Fresno City College', 'https://www.fresnocitycollege.edu/'),
  ('Fullerton College', 'https://www.fullcoll.edu/'),
  ('Gavilan College', 'https://www.gavilan.edu/'),
  ('Glendale Community College', 'https://www.glendale.edu/'),
  ('Golden West College', 'https://www.goldenwestcollege.edu/'),
  ('Grossmont College', 'https://www.grossmont.edu/'),
  ('Hartnell College', 'https://www.hartnell.edu/'),
  ('Imperial Valley College', 'https://www.imperial.edu/'),
  ('Irvine Valley College', 'https://www.ivc.edu/'),
  ('Lake Tahoe Community College', 'https://www.ltcc.edu/'),
  ('Laney College', 'https://laney.edu/'),
  ('Las Positas College', 'https://www.laspositascollege.edu/'),
  ('Lassen College', 'https://www.lassencollege.edu/'),
  ('Lemoore College', 'https://www.westhillscollege.com/lemoore/'),
  ('Long Beach City College', 'https://www.lbcc.edu/'),
  ('Los Angeles City College', 'https://www.lacitycollege.edu/'),
  ('Los Angeles Harbor College', 'https://www.lahc.edu/'),
  ('Los Angeles Mission College', 'https://www.lamission.edu/'),
  ('Los Angeles Pierce College', 'https://www.piercecollege.edu/'),
  ('Los Angeles Southwest College', 'https://www.lasc.edu/'),
  ('Los Angeles Trade-Tech College', 'https://www.lattc.edu/'),
  ('Los Angeles Valley College', 'https://www.lavc.edu/'),
  ('Los Medanos College', 'https://www.losmedanos.edu/'),
  ('Madera Community College', 'https://www.maderacenter.com/'),
  ('Mendocino College', 'https://www.mendocino.edu/'),
  ('Merced College', 'https://www.mccd.edu/'),
  ('Merritt College', 'https://www.merritt.edu/'),
  ('MiraCosta College', 'https://www.miracosta.edu/'),
  ('Mission College', 'https://missioncollege.edu/'),
  ('Modesto Junior College', 'https://www.mjc.edu/'),
  ('Monterey Peninsula College', 'https://www.mpc.edu/'),
  ('Moorpark College', 'https://www.moorparkcollege.edu/'),
  ('Moreno Valley College', 'https://mvc.edu/'),
  ('Mt. San Antonio College', 'https://www.mtsac.edu/'),
  ('Mt. San Jacinto College', 'https://www.msjc.edu/'),
  ('Napa Valley College', 'https://www.napavalley.edu/'),
  ('Norco College', 'https://www.norcocollege.edu/'),
  ('North Orange Continuing Education', 'https://noce.edu/'),
  ('Ohlone College', 'https://www.ohlone.edu/'),
  ('Orange Coast College', 'https://orangecoastcollege.edu/'),
  ('Oxnard College', 'https://www.oxnardcollege.edu/'),
  ('Palo Verde College', 'https://www.paloverde.edu/'),
  ('Palomar College', 'https://www.palomar.edu/'),
  ('Pasadena City College', 'https://pasadena.edu/'),
  ('Porterville College', 'https://www.portervillecollege.edu/'),
  ('Reedley College', 'https://www.reedleycollege.edu/'),
  ('Rio Hondo College', 'https://www.riohondo.edu/'),
  ('Riverside City College', 'https://www.rcc.edu/'),
  ('Sacramento City College', 'https://scc.losrios.edu/'),
  ('Saddleback College', 'https://www.saddleback.edu/'),
  ('San Bernardino Valley College', 'https://www.valleycollege.edu/'),
  ('San Diego City College', 'https://www.sdcity.edu/'),
  ('San Diego College of Continuing Education', 'https://sdcce.edu/'),
  ('San Diego Mesa College', 'https://www.sdmesa.edu/'),
  ('San Diego Miramar College', 'https://sdmiramar.edu/'),
  ('San Joaquin Delta College', 'https://deltacollege.edu/'),
  ('San Jose City College', 'https://www.sjcc.edu/'),
  ('Santa Ana College', 'https://sac.edu/'),
  ('Santa Barbara City College', 'https://www.sbcc.edu/'),
  ('Santa Monica College', 'https://www.smc.edu/'),
  ('Santa Rosa Junior College', 'https://www.santarosa.edu/'),
  ('Santiago Canyon College', 'https://www.sccollege.edu/'),
  ('Shasta College', 'https://www.shastacollege.edu/'),
  ('Sierra College', 'https://www.sierracollege.edu/'),
  ('Skyline College', 'https://skylinecollege.edu/'),
  ('Solano Community College', 'https://www.solano.edu/'),
  ('Southwestern College', 'https://www.swccd.edu/'),
  ('Taft College', 'https://www.taftcollege.edu/'),
  ('Ventura College', 'https://www.venturacollege.edu/'),
  ('Victor Valley College', 'https://www.vvc.edu/'),
  ('West Los Angeles College', 'https://www.wlac.edu/'),
  ('West Valley College', 'https://www.westvalley.edu/'),
  ('Woodland Community College', 'https://wcc.yccd.edu/'),
  ('Yuba College', 'https://yc.yccd.edu/')
), p as (
  select college from public.coci_college_programs group by college
), m as (
  select college_id, college_name, variants, mis_college_code
  from public.map_colleges where not coalesce(is_test, false)
), s as (
  select p.college, m.college_id, m.mis_college_code,
         coalesce((select h.url from h where h.name = p.college),
                  (select h.url from h where h.name = m.college_name
                                          or h.name = any(m.variants) limit 1)) as homepage_url
  from p
  left join m on m.college_name = p.college or p.college = any(m.variants)
)
insert into public.program_source_registry (college, college_id, mis_college_code, homepage_url)
select college, college_id, mis_college_code, homepage_url
from s where homepage_url is not null
on conflict (college) do nothing;

-- ── Where a college's course sequence can be read (S326, 2026-10-04) ───────
-- Sam, open-asks sheet 29 card 3, on Miramar's Program Pathways Mapper
-- refusing the reader: "Note this in the record for the college. Rather than
-- ask permission, we will make the agent aware of the limitation and to
-- continue to look for solutions or workarounds." Four columns the census never
-- writes (program_source_census_apply() names its own), filled by a session from
-- the sequence pass's probe (kb/_program_sequence_ppm.py), which reads them and
-- never requests a host recorded as refused. Applied as migration
-- program_source_registry_sequence_access_2026_10_04 with its first 25 rows:
-- kb/receipts/program_source_registry_sequence_access_2026-10-04_s326.sql. The
-- history trigger above names sequence_checked_run when it changes (that
-- migration replaced it; this file's copy of the trigger is updated to match).
alter table public.program_source_registry
  add column if not exists sequence_host        text,
  add column if not exists sequence_access      text
    check (sequence_access in ('open', 'refused', 'unreached', 'not_read')),
  add column if not exists sequence_note        text,
  add column if not exists sequence_checked_run text;

-- ── The college's procedure record (S329, 2026-10-04) ───────────────────────
-- Sam, open-asks sheet 34 card 2 (2026-10-04 19:18Z, as proposed): one procedure
-- record per college, kept with its history on the college's registry row:
-- hosts, platform, reading steps, refusals, workarounds tried, nuances. The
-- reader loads it before each run (kb/_college_page_read.py load_procedure); the
-- harvest tab's Procedures view shows it; each workaround Sam suggests lands as a
-- change to it under his name and date; a request to a college is drafted only
-- when its record shows every step tried (sheet 33 card 5).
--   procedure     jsonb: {v, hosts[], steps[], nuances[], workarounds[], open[]}
--   procedure_by  who changed it last: a person, or the session and run
--   procedure_at  when
-- program_source_census_apply() names its columns, so the weekly census never
-- writes these. Anyone with the public key reads the registry, so a record names
-- offices and hosts, never staff; the only person it names is a curator who
-- suggests a workaround. Applied as migration
-- program_source_registry_procedure_2026_10_04 on Sam's go in session (S329,
-- 2026-10-04: "apply the procedure record"). Cerritos's first record is in
-- kb/receipts/program_source_registry_procedure_2026-10-04_s329.sql; its guarded
-- UPDATE timed out twice through the connector, which holds a data write for a
-- person's confirmation, so it waits for Sam to run it. The history trigger
-- names procedure_by when procedure_at changes.
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

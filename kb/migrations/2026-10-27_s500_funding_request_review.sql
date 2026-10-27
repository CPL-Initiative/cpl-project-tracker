-- The public funding page's requests wait for a MAP team reviewer (S500, 2026-10-27).
--
-- Sam, 2026-10-27, in session: "what if our current process just checked whether they had the right
-- email domain for their college or district and the next step is for a MAP team CSM to accept or
-- deny the request, which then confirms and sends an email confirmation?"; then "Before Friday" and
-- "We can use the magic link instead of team phrase if that's already wired" (cpl_memory
-- sam-funding-public-domain-check-csm-accept-2026-10-27, sam-funding-public-review-magic-link-2026-10-27).
--
-- The page's two public writes are the participation confirmation (cfp_insert_self) and the noncredit
-- attestation (cna_insert_self); every other write on it already needs is_allowed_reviewer(). This
-- adds one condition to each: the submitter's address is on a domain of that institution or its
-- district. A row still lands as 'self_attested'; the page now counts only 'confirmed' rows, and a
-- magic-link reviewer accepts (the existing cfp_update / cna_update) or denies (cfp_delete / cna_delete).
--
-- The domains come from map_college_contacts, every address MAP holds for the college: a college's own
-- domains are those in its own rows; a district's are those that appear in the rows of two or more of
-- its colleges (rccd.edu passes for Norco; Riverside City College's rcc.edu does not). Free-mail
-- domains never count. An institution with no address on file accepts any address, and the reviewer
-- decides. cpl_funding_email_domains() returns domains alone, never an address.
--
-- Rollback: restore cfp_insert_self and cna_insert_self from kb/supabase_funding_optin.sql and
-- kb/supabase_cpl_funding_nc_attestation.sql, then drop the two functions and the table.

-- 1. the funding key to MAP college map (kb/reference/funding_college_map.json) ------------------------
create table if not exists public.cpl_funding_college_map (
  key         text not null,
  map_college text not null,
  district    text,
  primary key (key, map_college)
);
alter table public.cpl_funding_college_map enable row level security;
drop policy if exists cfcm_select on public.cpl_funding_college_map;
create policy cfcm_select on public.cpl_funding_college_map for select to anon, authenticated using (true);
truncate public.cpl_funding_college_map;
insert into public.cpl_funding_college_map (key, map_college, district) values
  ('Alameda', 'College of Alameda', 'Peralta Community College District'),
  ('Allan Hancock', 'Allan Hancock College', 'Allan Hancock Joint Community College District'),
  ('American River', 'American River College', 'Los Rios Community College District'),
  ('Antelope Valley', 'Antelope Valley College', 'Antelope Valley Community College District'),
  ('Bakersfield', 'Bakersfield College', 'Kern Community College District'),
  ('Barstow', 'Barstow Community College', 'Barstow Community College District'),
  ('Berkeley City', 'Berkeley City College', 'Peralta Community College District'),
  ('Butte', 'Butte College', 'Butte-Glenn Community College District'),
  ('Cabrillo', 'Cabrillo College', 'Cabrillo Community College District'),
  ('Calbright College', 'Calbright College Credit', null),
  ('Calbright College', 'Calbright College Non-Credit', null),
  ('Calbright', 'Calbright College Credit', null),
  ('Calbright', 'Calbright College Non-Credit', null),
  ('Canada', 'Cañada College', 'San Mateo County Community College District'),
  ('Canyons', 'College of the Canyons', 'Santa Clarita Community College District'),
  ('Cerritos', 'Cerritos College', 'Cerritos Community College District'),
  ('Cerro Coso', 'Cerro Coso Community College', 'Kern Community College District'),
  ('Chabot', 'Chabot College', 'Chabot-Las Positas Community College District'),
  ('Chaffey', 'Chaffey College', 'Chaffey Community College District'),
  ('Citrus', 'Citrus College', 'Citrus Community College District'),
  ('Clovis', 'Clovis Community College', 'State Center Community College District'),
  ('Coastline', 'Coastline Community College', 'Coast Community College District'),
  ('Columbia', 'Columbia College', 'Yosemite Community College District'),
  ('Compton', 'Compton College', 'Compton Community College District'),
  ('Contra Costa', 'Contra Costa College', 'Contra Costa Community College District'),
  ('Copper Mountain', 'Copper Mountain College', 'Copper Mountain Community College District'),
  ('Cosumnes River', 'Cosumnes River College', 'Los Rios Community College District'),
  ('Crafton Hills', 'Crafton Hills College', 'San Bernardino Community College District'),
  ('Cuesta', 'Cuesta College', 'San Luis Obispo County Community College District'),
  ('Cuyamaca', 'Cuyamaca College', 'Grossmont-Cuyamaca Community College District'),
  ('Cypress', 'Cypress College', 'North Orange County Community College District'),
  ('De Anza', 'De Anza College', 'Foothill-De Anza Community College District'),
  ('Desert', 'College of the Desert', 'Desert Community College District'),
  ('Diablo Valley', 'Diablo Valley College', 'Contra Costa Community College District'),
  ('East LA', 'East Los Angeles College', 'Los Angeles Community College District'),
  ('El Camino', 'El Camino College', 'El Camino Community College District'),
  ('Evergreen Valley', 'Evergreen Valley College', 'San Jose-Evergreen Community College District'),
  ('Feather River', 'Feather River College', 'Feather River Community College District'),
  ('Folsom Lake', 'Folsom Lake College', 'Los Rios Community College District'),
  ('Foothill', 'Foothill College', 'Foothill-De Anza Community College District'),
  ('Fresno City', 'Fresno City College', 'State Center Community College District'),
  ('Fullerton', 'Fullerton College', 'North Orange County Community College District'),
  ('Gavilan', 'Gavilan College', 'Gavilan Joint Community College District'),
  ('Glendale', 'Glendale Community College', 'Glendale Community College District'),
  ('Golden West', 'Golden West College', 'Coast Community College District'),
  ('Grossmont', 'Grossmont College', 'Grossmont-Cuyamaca Community College District'),
  ('Hartnell', 'Hartnell College', 'Hartnell Community College District'),
  ('Imperial', 'Imperial Valley College', 'Imperial Community College District'),
  ('Irvine', 'Irvine Valley College', 'South Orange County Community College District'),
  ('LA City', 'Los Angeles City College', 'Los Angeles Community College District'),
  ('LA Harbor', 'Los Angeles Harbor College', 'Los Angeles Community College District'),
  ('LA Mission', 'Los Angeles Mission College', 'Los Angeles Community College District'),
  ('LA Pierce', 'Los Angeles Pierce College', 'Los Angeles Community College District'),
  ('LA Swest', 'Los Angeles Southwest College', 'Los Angeles Community College District'),
  ('LA Trade', 'Los Angeles Trade Technical College', 'Los Angeles Community College District'),
  ('LA Valley', 'Los Angeles Valley College', 'Los Angeles Community College District'),
  ('Lake Tahoe', 'Lake Tahoe Community College', 'Lake Tahoe Community College District'),
  ('Laney', 'Laney College', 'Peralta Community College District'),
  ('Las Positas', 'Las Positas College', 'Chabot-Las Positas Community College District'),
  ('Lassen', 'Lassen College', 'Lassen Community College District'),
  ('Long Beach', 'Long Beach City College', 'Long Beach Community College District'),
  ('Los Medanos', 'Los Medanos College', 'Contra Costa Community College District'),
  ('Madera', 'Madera College', 'State Center Community College District'),
  ('Marin', 'College of Marin', 'Marin Community College District'),
  ('Mendocino', 'Mendocino College', 'Mendocino-Lake Community College District'),
  ('Merced', 'Merced College', 'Merced Community College District'),
  ('Merritt', 'Merritt College', 'Peralta Community College District'),
  ('MiraCosta', 'MiraCosta College', 'MiraCosta Community College District'),
  ('Mission', 'Mission College', 'West Valley-Mission Community College District'),
  ('Modesto', 'Modesto Junior College', 'Yosemite Community College District'),
  ('Monterey', 'Monterey Peninsula College', 'Monterey Peninsula Community College District'),
  ('Moorpark', 'Moorpark College', 'Ventura County Community College District'),
  ('Moreno Valley', 'Moreno Valley College', 'Riverside Community College District'),
  ('Mt San Antonio', 'Mt. San Antonio College', 'Mt. San Antonio Community College District'),
  ('Mt. SAC NC', 'Mt. San Antonio College', 'Mt. San Antonio Community College District'),
  ('Mt. San Antonio College — Noncredit', 'Mt. San Antonio College', 'Mt. San Antonio Community College District'),
  ('Mt. San Jacinto', 'Mt. San Jacinto College', 'Mt. San Jacinto Community College District'),
  ('Napa', 'Napa Valley College', 'Napa Valley Community College District'),
  ('NOCE', 'North Orange Continuing Education', 'North Orange County Community College District'),
  ('NOCE', 'North Orange Continuing Education Credit', 'North Orange County Community College District'),
  ('Norco College', 'Norco College', 'Riverside Community College District'),
  ('North Orange Continuing Education', 'North Orange Continuing Education', 'North Orange County Community College District'),
  ('North Orange Continuing Education', 'North Orange Continuing Education Credit', 'North Orange County Community College District'),
  ('Ohlone', 'Ohlone College', 'Ohlone Community College District'),
  ('Orange Coast', 'Orange Coast College', 'Coast Community College District'),
  ('Oxnard', 'Oxnard College', 'Ventura County Community College District'),
  ('Palo Verde', 'Palo Verde College', 'Palo Verde Community College District'),
  ('Palomar', 'Palomar College', 'Palomar Community College District'),
  ('Pasadena', 'Pasadena City College', 'Pasadena Area Community College District'),
  ('Porterville', 'Porterville College', 'Kern Community College District'),
  ('Redwoods', 'College of the Redwoods', 'Redwoods Community College District'),
  ('Reedley College', 'Reedley College', 'State Center Community College District'),
  ('Rio Hondo', 'Rio Hondo College', 'Rio Hondo Community College District'),
  ('Riverside', 'Riverside City College', 'Riverside Community College District'),
  ('Sacramento City', 'Sacramento City College', 'Los Rios Community College District'),
  ('Saddleback', 'Saddleback College', 'South Orange County Community College District'),
  ('San Bernardino', 'San Bernardino Valley College', 'San Bernardino Community College District'),
  ('San Diego City', 'San Diego City College', 'San Diego Community College District'),
  ('San Diego College of Continuing Education', 'San Diego College of Continuing Education', 'San Diego Community College District'),
  ('San Diego College of Continuing Education', 'San Diego College of Continuing Education Credit', 'San Diego Community College District'),
  ('San Diego Mesa', 'San Diego Mesa College', 'San Diego Community College District'),
  ('San Diego Miramar', 'San Diego Miramar College', 'San Diego Community College District'),
  ('San Francisco', 'City College of San Francisco', 'San Francisco Community College District'),
  ('San Joaquin Delta', 'San Joaquin Delta College', 'San Joaquin Delta Community College District'),
  ('San Jose City', 'San Jose City College', 'San Jose-Evergreen Community College District'),
  ('San Mateo', 'College of San Mateo', 'San Mateo County Community College District'),
  ('Santa Ana', 'Santa Ana College', 'Rancho Santiago Community College District'),
  ('Santa Barbara', 'Santa Barbara City College', 'Santa Barbara Community College District'),
  ('Santa Monica', 'Santa Monica College', 'Santa Monica Community College District'),
  ('Santa Rosa', 'Santa Rosa Junior College', 'Sonoma County Junior College District'),
  ('Santiago Canyon', 'Santiago Canyon College', 'Rancho Santiago Community College District'),
  ('SD Cont. Ed', 'San Diego College of Continuing Education', 'San Diego Community College District'),
  ('SD Cont. Ed', 'San Diego College of Continuing Education Credit', 'San Diego Community College District'),
  ('Sequoias', 'College of the Sequoias', 'Sequoias Community College District'),
  ('Shasta', 'Shasta College', 'Shasta-Tehama-Trinity Joint Community College District'),
  ('Sierra', 'Sierra College', 'Sierra Joint Community College District'),
  ('Siskiyous', 'College of the Siskiyous', 'Siskiyou Joint Community College District'),
  ('Skyline', 'Skyline College', 'San Mateo County Community College District'),
  ('Solano', 'Solano Community College', 'Solano County Community College District'),
  ('Southwestern', 'Southwestern College', 'Southwestern Community College District'),
  ('Taft', 'Taft College', 'West Kern Community College District'),
  ('Ventura', 'Ventura College', 'Ventura County Community College District'),
  ('Victor Valley', 'Victor Valley College', 'Victor Valley Community College District'),
  ('West Hills Coalinga', 'Coalinga College', 'West Hills Community College District'),
  ('West Hills Lemoore', 'Lemoore College', 'West Hills Community College District'),
  ('West LA', 'West Los Angeles College', 'Los Angeles Community College District'),
  ('West Valley', 'West Valley College', 'West Valley-Mission Community College District'),
  ('Woodland', 'Woodland Community College', 'Yuba Community College District'),
  ('Yuba', 'Yuba College', 'Yuba Community College District');

-- 2. the domains of an institution and its district -----------------------------------------------
create or replace function public.cpl_funding_email_domains(p_key text)
returns text[]
language sql stable security definer set search_path = ''
as $fn$
  with me as (
    select m.map_college, m.district from public.cpl_funding_college_map m
    where m.key = p_key or m.map_college = p_key
  ),
  addr as (
    -- every address on file for a college, with that college's district
    select m.map_college, m.district,
           lower(split_part(btrim(x), '@', 2)) as domain
    from public.cpl_funding_college_map m
    join public.map_college_contacts c on c.college = m.map_college
    cross join lateral regexp_split_to_table(concat_ws(',',
        c.primary_contact_email, c.vpaa_email, c.vpss_email, c.ceo_email, c.cpl_coordinator_email,
        c.cpl_assistant_email, c.cpl_counselor_email, c.articulation_officer_email, c.faculty_lead_email,
        c.lead_initiator_email, c.senate_president_email, c.certifying_official_email), '[,;[:space:]]+') as x
    where btrim(x) ~* '^[^@[:space:]]+@[a-z0-9-]+(\.[a-z0-9-]+)+$'
  ),
  ok as (
    select distinct a.domain from addr a
    where a.domain not in ('gmail.com','yahoo.com','hotmail.com','outlook.com','live.com','msn.com',
                           'icloud.com','me.com','aol.com','comcast.net','att.net','sbcglobal.net',
                           'protonmail.com','proton.me','ymail.com')
      and (
        -- the institution's own domains
        a.map_college in (select map_college from me)
        -- or its district's: on file for two or more of the district's colleges
        or (a.district is not null and a.district in (select district from me where district is not null)
            and (select count(distinct a2.map_college) from addr a2
                 where a2.domain = a.domain and a2.district = a.district) >= 2)
      )
  )
  select coalesce(array_agg(domain order by domain), '{}') from ok;
$fn$;

create or replace function public.cpl_funding_email_domain_ok(p_key text, p_email text)
returns boolean
language sql stable security definer set search_path = ''
as $fn$
  with d as (select public.cpl_funding_email_domains(p_key) as list)
  select case
    when cardinality((select list from d)) = 0 then true
    else lower(split_part(btrim(coalesce(p_email, '')), '@', 2)) = any ((select list from d))
  end;
$fn$;

revoke all on function public.cpl_funding_email_domains(text) from public;
revoke all on function public.cpl_funding_email_domain_ok(text, text) from public;
grant execute on function public.cpl_funding_email_domains(text) to anon, authenticated, service_role;
grant execute on function public.cpl_funding_email_domain_ok(text, text) to anon, authenticated, service_role;

-- 3. the two public inserts take the domain check ----------------------------------------------------
drop policy if exists cfp_insert_self on public.cpl_funding_participation;
create policy cfp_insert_self on public.cpl_funding_participation
  for insert to anon, authenticated
  with check (
    status = 'self_attested' and source = 'self'
    and confirmed_at is null and confirmed_by is null and revoked_at is null
    and attestor_name  is not null and btrim(attestor_name) <> '' and char_length(attestor_name) <= 120
    and attestor_title in ('VPAA','VPSS','CEO','Other')
    and attestor_email is not null and char_length(attestor_email) <= 160
        and attestor_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    and char_length(btrim(college)) between 1 and 120
    and public.cpl_funding_email_domain_ok(college, attestor_email)
  );

drop policy if exists cna_insert_self on public.cpl_funding_nc_attestation;
create policy cna_insert_self on public.cpl_funding_nc_attestation
  for insert to anon, authenticated
  with check (
    status = 'self_attested' and source = 'self'
    and confirmed_at is null and confirmed_by is null and revoked_at is null and noted_by is null
    and fiscal_year in (public.cpl_funding_fy(current_date),
                        public.cpl_funding_fy((current_date + interval '1 year')::date))
    and char_length(btrim(college)) between 1 and 120
    and coordinator_name is not null and btrim(coordinator_name) <> ''
    and coordinator_title is not null and btrim(coordinator_title) <> ''
    and attestor_name is not null and btrim(attestor_name) <> ''
    and attestor_title in ('VPAA', 'VPSS', 'CEO', 'NCDEAN', 'Other')
    and attestor_email is not null
        and attestor_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    and public.cpl_funding_email_domain_ok(college, attestor_email)
  );

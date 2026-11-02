-- S545 SkyWhirlpool, 2026-11-02: the college short-name editor (college-district-identity lane, NEXT).
-- Sam: "I think that's what's held me up previously", and "I can make those corrections in the table so the
-- exceptions don't need to be coded". Until now the 118 shorts lived in kb/_seed_college_short_names.py, which only a
-- session could run. This table becomes their one source: the College Identity tab's Short name column writes it, and
-- the daily run's curation sync (kb/_apply_college_short_names.py) rewrites kb/college_short_names.json and
-- college_short_names.js from it.
--
-- The rule the trigger enforces for every writer: A NAME A JOIN KEYS ON IS A KEY (S544). A changed short keeps the old
-- one as an alias, because the funding roster and other builders still reach a college by its prior short (#2598
-- dropped City College of San Francisco and College of the Desert from the funding join until #2676 restored them).
-- Aliases only grow; the canonical name never changes; a short another college holds as its short or an alias is
-- refused; every change writes a log row naming who and when.
--
-- Decision right: DR-30 (kb/governance_register.json), Sam's. Writes: a signed-in reviewer (is_allowed_reviewer()),
-- never the team phrase alone. Reads: anyone, as the shorts already render on public pages. The log names reviewers,
-- so it reads only for a reviewer. No student or staff detail beyond the reviewer's own email.
-- Seed: the 118 rows of kb/college_short_names.json, inserted by S545 under the service role (receipt
-- kb/college_identity/2026-11-02_short_names_seed.md). ROLLBACK: kb/migrations/2026-11-02_college_short_names_rollback.sql.

create table if not exists public.college_short_names (
  canonical   text primary key,
  short       text not null check (length(btrim(short)) > 0),
  short_caps  text not null check (length(btrim(short_caps)) > 0),
  aliases     text[] not null default '{}',
  updated_by  text,
  updated_at  timestamptz not null default now()
);

create table if not exists public.college_short_names_log (
  id            bigserial primary key,
  canonical     text not null references public.college_short_names(canonical),
  short_before  text,
  short_after   text not null,
  alias_added   text,
  changed_by    text,
  changed_at    timestamptz not null default now()
);

alter table public.college_short_names enable row level security;
alter table public.college_short_names_log enable row level security;

drop policy if exists college_short_names_read on public.college_short_names;
create policy college_short_names_read on public.college_short_names
  for select to anon, authenticated using (true);
drop policy if exists college_short_names_update on public.college_short_names;
create policy college_short_names_update on public.college_short_names
  for update to authenticated using (public.is_allowed_reviewer()) with check (public.is_allowed_reviewer());
-- No insert or delete policy: a new college arrives through the seed under the service role, and no row is removed.

drop policy if exists college_short_names_log_read on public.college_short_names_log;
create policy college_short_names_log_read on public.college_short_names_log
  for select to authenticated using (public.is_allowed_reviewer());

-- Default privileges hand every new table to anon and authenticated whole; narrow them to what the policies use, so a
-- reviewer's write can name the short alone (the trigger sets the aliases, the CAPS form and who).
revoke all on public.college_short_names from anon, authenticated;
revoke all on public.college_short_names_log from anon, authenticated;
grant select on public.college_short_names to anon, authenticated;
grant update (short) on public.college_short_names to authenticated;
grant select on public.college_short_names_log to authenticated;

create or replace function public.college_short_names_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  who text := coalesce(nullif(auth.jwt() ->> 'email', ''), current_user);
  clash text;
  added text := null;
begin
  if new.canonical is distinct from old.canonical then
    raise exception 'A college''s canonical name is fixed (%).', old.canonical;
  end if;
  new.short := btrim(regexp_replace(new.short, '\s+', ' ', 'g'));
  if new.short = '' then
    raise exception 'A short name cannot be empty; % keeps %.', old.canonical, old.short;
  end if;
  if not (coalesce(old.aliases, '{}') <@ coalesce(new.aliases, '{}')) then
    raise exception 'Aliases only grow: % would lose one.', old.canonical;
  end if;
  if new.short is distinct from old.short then
    select c.canonical into clash
    from public.college_short_names c
    where c.canonical <> new.canonical
      and (lower(c.short) = lower(new.short) or lower(c.short_caps) = lower(new.short)
           or lower(c.canonical) = lower(new.short)
           or exists (select 1 from unnest(c.aliases) a where lower(a) = lower(new.short)))
    limit 1;
    if clash is not null then
      raise exception '% already answers to "%"; pick another short for %.', clash, new.short, old.canonical;
    end if;
    if not exists (select 1 from unnest(new.aliases) a where lower(a) = lower(old.short)) then
      new.aliases := array_append(new.aliases, old.short);
      added := old.short;
    end if;
    if new.short_caps is not distinct from old.short_caps then
      new.short_caps := upper(new.short);
    end if;
    new.updated_by := who;
    new.updated_at := now();
    insert into public.college_short_names_log (canonical, short_before, short_after, alias_added, changed_by)
    values (old.canonical, old.short, new.short, added, who);
  end if;
  return new;
end;
$$;

drop trigger if exists college_short_names_guard on public.college_short_names;
create trigger college_short_names_guard
  before update on public.college_short_names
  for each row execute function public.college_short_names_guard();

-- Rule 10 (b2): a trigger function is never called directly; close it to every role but its owner.
revoke all on function public.college_short_names_guard() from public, anon, authenticated;

-- The seed: the 118 rows of kb/college_short_names.json as committed at d03d4038 (generated 2026-11-02), insert-only, so a row
-- anyone wrote first stays. updated_by names the cohort (Rule 10 a2: it rolls back by that name).
insert into public.college_short_names (canonical, short, short_caps, aliases, updated_by) values
  ('Allan Hancock College', 'Allan Hancock', 'ALLAN HANCOCK', array['Allan Hancock College']::text[], 'short-names-s545@bot'),
  ('American River College', 'American River', 'AMERICAN RIVER', array['American River College']::text[], 'short-names-s545@bot'),
  ('Antelope Valley College', 'Antelope Valley', 'ANTELOPE VALLEY', array['Antelope Valley College']::text[], 'short-names-s545@bot'),
  ('Bakersfield College', 'Bakersfield', 'BAKERSFIELD', array['Bakersfield College']::text[], 'short-names-s545@bot'),
  ('Barstow College', 'Barstow', 'BARSTOW', array['Barstow College']::text[], 'short-names-s545@bot'),
  ('Berkeley City College', 'Berkeley City', 'BERKELEY CITY', array['Berkeley City College']::text[], 'short-names-s545@bot'),
  ('Butte College', 'Butte', 'BUTTE', array['Butte College']::text[], 'short-names-s545@bot'),
  ('Cabrillo College', 'Cabrillo', 'CABRILLO', array['Cabrillo College']::text[], 'short-names-s545@bot'),
  ('Calbright College', 'Calbright', 'CALBRIGHT', array['Calbright College']::text[], 'short-names-s545@bot'),
  ('Canada College', 'Cañada', 'CAÑADA', array['Canada College', 'CaÃ±ada College', 'Cañada College']::text[], 'short-names-s545@bot'),
  ('Cerritos College', 'Cerritos', 'CERRITOS', array['Cerritos College']::text[], 'short-names-s545@bot'),
  ('Cerro Coso Community College', 'Cerro Coso', 'CERRO COSO', array['Cerro Coso Community College']::text[], 'short-names-s545@bot'),
  ('Chabot College', 'Chabot', 'CHABOT', array['Chabot College', 'Chabot Hayward']::text[], 'short-names-s545@bot'),
  ('Chaffey College', 'Chaffey', 'CHAFFEY', array['Chaffey College']::text[], 'short-names-s545@bot'),
  ('Citrus College', 'Citrus', 'CITRUS', array['Citrus College']::text[], 'short-names-s545@bot'),
  ('City College Of San Francisco', 'City College San Francisco', 'CITY COLLEGE SAN FRANCISCO', array['City College Of San Francisco', 'San Francisco']::text[], 'short-names-s545@bot'),
  ('Clovis Community College', 'Clovis', 'CLOVIS', array['Clovis Community College']::text[], 'short-names-s545@bot'),
  ('Coastline Community College', 'Coastline', 'COASTLINE', array['Coastline Community College']::text[], 'short-names-s545@bot'),
  ('College of Alameda', 'Alameda', 'ALAMEDA', array['College of Alameda']::text[], 'short-names-s545@bot'),
  ('College Of Marin', 'Marin', 'MARIN', array['College Of Marin']::text[], 'short-names-s545@bot'),
  ('College of San Mateo', 'San Mateo', 'SAN MATEO', array['College of San Mateo']::text[], 'short-names-s545@bot'),
  ('College Of The Canyons', 'Canyons', 'CANYONS', array['College Of The Canyons']::text[], 'short-names-s545@bot'),
  ('College Of The Desert', 'College of the Desert', 'COLLEGE OF THE DESERT', array['College Of The Desert', 'Desert']::text[], 'short-names-s545@bot'),
  ('College Of The Redwoods', 'Redwoods', 'REDWOODS', array['College Of The Redwoods']::text[], 'short-names-s545@bot'),
  ('College Of The Sequoias', 'Sequoias', 'SEQUOIAS', array['College Of The Sequoias']::text[], 'short-names-s545@bot'),
  ('College Of The Siskiyous', 'Siskiyous', 'SISKIYOUS', array['College Of The Siskiyous']::text[], 'short-names-s545@bot'),
  ('Columbia College', 'Columbia', 'COLUMBIA', array['Columbia College']::text[], 'short-names-s545@bot'),
  ('Compton College', 'Compton', 'COMPTON', array['Compton College']::text[], 'short-names-s545@bot'),
  ('Contra Costa College', 'Contra Costa', 'CONTRA COSTA', array['Contra Costa College']::text[], 'short-names-s545@bot'),
  ('Copper Mountain College', 'Copper Mountain', 'COPPER MOUNTAIN', array['Copper Mountain College']::text[], 'short-names-s545@bot'),
  ('Cosumnes River College', 'Cosumnes River', 'COSUMNES RIVER', array['Cosumnes River College']::text[], 'short-names-s545@bot'),
  ('Crafton Hills College', 'Crafton Hills', 'CRAFTON HILLS', array['Crafton Hills College']::text[], 'short-names-s545@bot'),
  ('Cuesta College', 'Cuesta', 'CUESTA', array['Cuesta College']::text[], 'short-names-s545@bot'),
  ('Cuyamaca College', 'Cuyamaca', 'CUYAMACA', array['Cuyamaca College']::text[], 'short-names-s545@bot'),
  ('Cypress College', 'Cypress', 'CYPRESS', array['Cypress College']::text[], 'short-names-s545@bot'),
  ('De Anza College', 'De Anza', 'DEANZA', array['De Anza College']::text[], 'short-names-s545@bot'),
  ('Diablo Valley College', 'Diablo Valley', 'DIABLO VALLEY', array['Diablo Valley College']::text[], 'short-names-s545@bot'),
  ('East Los Angeles College', 'East LA', 'EAST LA', array['East Los Angeles College']::text[], 'short-names-s545@bot'),
  ('El Camino College', 'El Camino', 'EL CAMINO', array['El Camino College']::text[], 'short-names-s545@bot'),
  ('Evergreen Valley College', 'Evergreen Valley', 'EVERGREEN VALLEY', array['Evergreen Valley College']::text[], 'short-names-s545@bot'),
  ('Feather River College', 'Feather River', 'FEATHER RIVER', array['Feather River College']::text[], 'short-names-s545@bot'),
  ('Folsom Lake College', 'Folsom Lake', 'FOLSOM LAKE', array['Folsom Lake College']::text[], 'short-names-s545@bot'),
  ('Foothill College', 'Foothill', 'FOOTHILL', array['Foothill College']::text[], 'short-names-s545@bot'),
  ('Fresno City College', 'Fresno City', 'FRESNO CITY', array['Fresno City College']::text[], 'short-names-s545@bot'),
  ('Fullerton College', 'Fullerton', 'FULLERTON', array['Fullerton College']::text[], 'short-names-s545@bot'),
  ('Gavilan College', 'Gavilan', 'GAVILAN', array['Gavilan College']::text[], 'short-names-s545@bot'),
  ('Glendale Community College', 'Glendale', 'GLENDALE', array['Glendale Community College']::text[], 'short-names-s545@bot'),
  ('Golden West College', 'Golden West', 'GOLDEN WEST', array['Golden West College']::text[], 'short-names-s545@bot'),
  ('Grossmont College', 'Grossmont', 'GROSSMONT', array['Grossmont College']::text[], 'short-names-s545@bot'),
  ('Hartnell College', 'Hartnell', 'HARTNELL', array['Hartnell College']::text[], 'short-names-s545@bot'),
  ('Imperial Valley College', 'Imperial', 'IMPERIAL', array['Imperial Valley College']::text[], 'short-names-s545@bot'),
  ('Irvine Valley College', 'Irvine', 'IRVINE', array['Irvine Valley College']::text[], 'short-names-s545@bot'),
  ('Lake Tahoe Community College', 'Lake Tahoe', 'LAKE TAHOE', array['Lake Tahoe Community College']::text[], 'short-names-s545@bot'),
  ('Laney College', 'Laney', 'LANEY', array['Laney College']::text[], 'short-names-s545@bot'),
  ('Las Positas College', 'Las Positas', 'LAS POSITAS', array['Las Positas College']::text[], 'short-names-s545@bot'),
  ('Lassen Community College', 'Lassen', 'LASSEN', array['Lassen Community College']::text[], 'short-names-s545@bot'),
  ('Long Beach City College', 'Long Beach', 'LONG BEACH', array['Long Beach City College']::text[], 'short-names-s545@bot'),
  ('Los Angeles City College', 'LA City', 'LA CITY', array['Los Angeles City College']::text[], 'short-names-s545@bot'),
  ('Los Angeles Harbor College', 'LA Harbor', 'LA HARBOR', array['Los Angeles Harbor College']::text[], 'short-names-s545@bot'),
  ('Los Angeles Mission College', 'LA Mission', 'LA MISSION', array['Los Angeles Mission College']::text[], 'short-names-s545@bot'),
  ('Los Angeles Pierce College', 'LA Pierce', 'LA PIERCE', array['Los Angeles Pierce College']::text[], 'short-names-s545@bot'),
  ('Los Angeles Southwest College', 'LA Southwest', 'LA SWEST', array['Los Angeles Southwest College']::text[], 'short-names-s545@bot'),
  ('Los Angeles Trade Technical College', 'LA Trade', 'LA TRADE', array['Los Angeles Trade Technical College']::text[], 'short-names-s545@bot'),
  ('Los Angeles Valley College', 'LA Valley', 'LA VALLEY', array['Los Angeles Valley College']::text[], 'short-names-s545@bot'),
  ('Los Medanos College', 'Los Medanos', 'LOS MEDANOS', array['Los Medanos College']::text[], 'short-names-s545@bot'),
  ('Madera Community College', 'Madera', 'MADERA', array['Madera Community College']::text[], 'short-names-s545@bot'),
  ('Mendocino College', 'Mendocino', 'MENDOCINO', array['Mendocino College']::text[], 'short-names-s545@bot'),
  ('Merced College', 'Merced', 'MERCED', array['Merced College']::text[], 'short-names-s545@bot'),
  ('Merritt College', 'Merritt', 'MERRITT', array['Merritt College']::text[], 'short-names-s545@bot'),
  ('Miracosta College', 'Mira Costa', 'MIRA COSTA', array['Miracosta College']::text[], 'short-names-s545@bot'),
  ('Mission College', 'Mission', 'MISSION', array['Mission College']::text[], 'short-names-s545@bot'),
  ('Modesto Junior College', 'Modesto', 'MODESTO', array['Modesto Junior College']::text[], 'short-names-s545@bot'),
  ('Monterey Peninsula College', 'Monterey', 'MONTEREY', array['Monterey Peninsula College']::text[], 'short-names-s545@bot'),
  ('Moorpark College', 'Moorpark', 'MOORPARK', array['Moorpark College']::text[], 'short-names-s545@bot'),
  ('Moreno Valley College', 'Moreno Valley', 'MORENO VALLEY', array['Moreno Valley College']::text[], 'short-names-s545@bot'),
  ('Mt San Antonio College', 'Mt. San Antonio', 'MT SAN ANTONIO', array['Mt San Antonio College']::text[], 'short-names-s545@bot'),
  ('Mt San Jacinto College', 'Mt. San Jacinto', 'MT. SAN JACINTO', array['Mt San Jacinto College']::text[], 'short-names-s545@bot'),
  ('Napa Valley College', 'Napa', 'NAPA', array['Napa Valley College']::text[], 'short-names-s545@bot'),
  ('Norco College', 'Norco', 'NORCO', array['Norco College']::text[], 'short-names-s545@bot'),
  ('North Orange Continuing Education', 'North Orange Adult', 'NORTH ORANGE ADULT', array['North Orange Continuing Education']::text[], 'short-names-s545@bot'),
  ('Ohlone College', 'Ohlone', 'OHLONE', array['Ohlone College']::text[], 'short-names-s545@bot'),
  ('Orange Coast College', 'Orange Coast', 'ORANGE COAST', array['Orange Coast College']::text[], 'short-names-s545@bot'),
  ('Oxnard College', 'Oxnard', 'OXNARD', array['Oxnard College']::text[], 'short-names-s545@bot'),
  ('Palo Verde College', 'Palo Verde', 'PALO VERDE', array['Palo Verde College']::text[], 'short-names-s545@bot'),
  ('Palomar College', 'Palomar', 'PALOMAR', array['Palomar College']::text[], 'short-names-s545@bot'),
  ('Pasadena City College', 'Pasadena', 'PASADENA', array['Pasadena City College']::text[], 'short-names-s545@bot'),
  ('Porterville College', 'Porterville', 'PORTERVILLE', array['Porterville College']::text[], 'short-names-s545@bot'),
  ('Reedley College', 'Reedley', 'REEDLEY', array['Reedley College']::text[], 'short-names-s545@bot'),
  ('Rio Hondo College', 'Rio Hondo', 'RIO HONDO', array['Rio Hondo College']::text[], 'short-names-s545@bot'),
  ('Riverside City College', 'Riverside', 'RIVERSIDE', array['Riverside City College']::text[], 'short-names-s545@bot'),
  ('Sacramento City College', 'Sacramento City', 'SACRAMENTO CITY', array['Sacramento City College']::text[], 'short-names-s545@bot'),
  ('Saddleback College', 'Saddleback', 'SADDLEBACK', array['Saddleback College']::text[], 'short-names-s545@bot'),
  ('San Bernardino Valley College', 'San Bernardino', 'SAN BERNARDINO', array['San Bernardino Valley College']::text[], 'short-names-s545@bot'),
  ('San Diego City College', 'San Diego City', 'SAN DIEGO CITY', array['San Diego City College']::text[], 'short-names-s545@bot'),
  ('San Diego College of Continuing Education', 'San Diego Adult', 'SAN DIEGO ADULT', array['San Diego College of Continuing Education']::text[], 'short-names-s545@bot'),
  ('San Diego Mesa College', 'San Diego Mesa', 'SAN DIEGO MESA', array['San Diego Mesa College']::text[], 'short-names-s545@bot'),
  ('San Diego Miramar College', 'San Diego Miramar', 'SAN DIEGO MIRAMAR', array['San Diego Miramar College']::text[], 'short-names-s545@bot'),
  ('San Joaquin Delta College', 'San Joaquin Delta', 'SAN JOAQUIN DELTA', array['San Joaquin Delta College']::text[], 'short-names-s545@bot'),
  ('San Jose City College', 'San Jose City', 'SAN JOSE CITY', array['San Jose City College']::text[], 'short-names-s545@bot'),
  ('Santa Ana College', 'Santa Ana', 'SANTA ANA', array['Santa Ana College']::text[], 'short-names-s545@bot'),
  ('Santa Barbara City College', 'Santa Barbara', 'SANTA BARBARA', array['Santa Barbara City College']::text[], 'short-names-s545@bot'),
  ('Santa Monica College', 'Santa Monica', 'SANTA MONICA', array['Santa Monica College']::text[], 'short-names-s545@bot'),
  ('Santa Rosa Junior College', 'Santa Rosa', 'SANTA ROSA', array['Santa Rosa Junior College']::text[], 'short-names-s545@bot'),
  ('Santiago Canyon College', 'Santiago Canyon', 'SANTIAGO CANYON', array['Santiago Canyon College']::text[], 'short-names-s545@bot'),
  ('Shasta College', 'Shasta', 'SHASTA', array['Shasta College']::text[], 'short-names-s545@bot'),
  ('Sierra College', 'Sierra', 'SIERRA', array['Sierra College']::text[], 'short-names-s545@bot'),
  ('Skyline College', 'Skyline', 'SKYLINE', array['Skyline College']::text[], 'short-names-s545@bot'),
  ('Solano Community College', 'Solano', 'SOLANO', array['Solano Community College']::text[], 'short-names-s545@bot'),
  ('Southwestern Community College', 'Southwestern', 'SOUTHWESTERN', array['Southwestern Community College']::text[], 'short-names-s545@bot'),
  ('Taft College', 'Taft', 'TAFT', array['Taft College']::text[], 'short-names-s545@bot'),
  ('Ventura College', 'Ventura', 'VENTURA', array['Ventura College']::text[], 'short-names-s545@bot'),
  ('Victor Valley College', 'Victor Valley', 'VICTOR VALLEY', array['Victor Valley College']::text[], 'short-names-s545@bot'),
  ('West Hills College Coalinga', 'West Hills Coalinga', 'WEST HILLS COALINGA', array['Coalinga', 'Coalinga College', 'West Hills College Coalinga']::text[], 'short-names-s545@bot'),
  ('West Hills College Lemoore', 'West Hills Lemoore', 'WEST HILLS LEMOORE', array['Lemoore', 'Lemoore College', 'West Hills College Lemoore']::text[], 'short-names-s545@bot'),
  ('West Los Angeles College', 'West LA', 'WEST LA', array['West Los Angeles College']::text[], 'short-names-s545@bot'),
  ('West Valley College', 'West Valley', 'WEST VALLEY', array['West Valley College']::text[], 'short-names-s545@bot'),
  ('Woodland Community College', 'Woodland', 'WOODLAND', array['Woodland Community College']::text[], 'short-names-s545@bot'),
  ('Yuba College', 'Yuba', 'YUBA', array['Yuba College']::text[], 'short-names-s545@bot')
on conflict (canonical) do nothing;

select count(*) as rows, count(*) filter (where updated_by = 'short-names-s545@bot') as seeded from public.college_short_names;

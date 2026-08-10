-- Canonical credential layer for Sierra + route CRED-STD.
-- APPLIED LIVE 2026-08-10 via Supabase MCP (migrations create_chatbox_credentials,
-- create_search_statewide_recommendations, cred_std_tier4_similarity_floor_v2).
-- Committed so the schema is reproducible and reviewable; re-running is safe.
--
-- WHY THIS EXISTS ------------------------------------------------------------
-- cpl-chat reads eight tables and none carried a canonical credential name. Its
-- only credential source is chatbox_exhibits — the RAW freehand titles colleges
-- typed into MAP. Asked "what colleges articulate POST?" it matched the literal
-- string and answered 20 colleges; the curated record folds 16 variants (incl.
-- "Peace Officer Standardized Training Academy", which contains no "POST") and
-- knows 32 adopters.
--
-- Table + loader: kb/_sync_credential_catalog.py, .github/workflows/credential-catalog-sync.yml
-- Tests:          tests/credential_catalog_sync_test.py

-- ── Route CRED-STD ──────────────────────────────────────────────────────────
-- Three decisions, each earned by a FAILING probe rather than assumed:
--
-- 1. STATEWIDE IS A FILTER, NOT A TIE-BREAK. Someone asking for the statewide
--    recommendation only wants statewide credentials. With statewide as a
--    tie-break, "peace officer" returned "Report Writing for Peace Officers"
--    (local, no recommendation) above POST Basic Academy, because match-tier
--    outranked standing.
--
-- 2. SCORE THE BEST SINGLE NAME, NOT THE CONCATENATION. similarity() normalises
--    by haystack length, so scoring against all variants joined together made
--    the BEST-CURATED credentials rank WORST — POST's 16 variants diluted it
--    below a rival with two. Exactly backwards, and invisible without a probe.
--
-- 3. NO PURE-FUZZY MATCHES, AND A FLOOR ON TIER 4. A trigram floor over 1,987
--    rows always finds something: "cpr" returned "EMT Certification" via the
--    variant "Emergency Medical Technician NRE and CPR" — a real substring, an
--    incidental mention, the wrong credential. Measured separation:
--        cpr -> EMT Certification            best_sim 0.098   (wrong)
--        ca post academy -> POST Basic       best_sim 0.727   (right)
--        police academy certificate -> POST  best_sim 0.711   (right)
--    0.25 sits in open space between them. Tiers 1-3 need no floor.
--
-- Zero rows is a RESULT, not a failure: it means no statewide recommendation
-- exists. The caller must then use search_credentials_any() to say whether the
-- credential exists locally — "No statewide recommendation for CPR; 'First Aid,
-- CPR & AED' is in the catalogue with local articulations only" — rather than
-- naming a neighbouring credential to avoid an empty answer.

drop function if exists public.search_statewide_recommendations(text, integer);

create function public.search_statewide_recommendations(
  asked text,
  result_limit integer default 5
)
returns table (
  unified_title        text,
  issuer               text,
  ccc_rec              text,
  discipline           text,
  n_adopters           integer,
  n_articulation_lines integer,
  match_tier           integer,
  matched_via          text
)
language sql
stable
security invoker
set search_path = public, pg_catalog
as $$
  with needle as (select lower(btrim(coalesce(asked, ''))) as n)
  select
    c.unified_title, c.issuer, c.ccc_rec, c.discipline,
    cardinality(c.adopter_colleges)::integer,
    c.n_articulation_lines,
    t.tier,
    -- Surface WHICH name matched, so an incidental match is visible not silent.
    (select v from unnest(c.raw_variants || c.unified_title) v
      order by similarity(lower(v), needle.n) desc limit 1)
  from public.chatbox_credentials c
  cross join needle
  cross join lateral (
    select case
      when lower(c.unified_title) = needle.n then 1
      when exists (select 1 from unnest(c.raw_variants) v where lower(v) = needle.n) then 2
      when lower(c.unified_title) like '%' || needle.n || '%' then 3
      when exists (select 1 from unnest(c.raw_variants) v
                   where lower(v) like '%' || needle.n || '%') then 4
      else 9
    end as tier
  ) t
  cross join lateral (
    select max(similarity(lower(v), needle.n)) as best_sim
      from unnest(c.raw_variants || c.unified_title) v
  ) s
  where needle.n <> ''
    and c.statewide
    and c.ccc_rec is not null
    and t.tier < 9
    and (t.tier < 4 or s.best_sim >= 0.25)
  order by t.tier, s.best_sim desc nulls last, c.n_articulation_lines desc, c.unified_title
  limit greatest(1, least(coalesce(result_limit, 5), 25));
$$;

-- The honest second half — is the credential in the catalogue at all?
create or replace function public.search_credentials_any(
  asked text,
  result_limit integer default 5
)
returns table (
  unified_title text,
  issuer        text,
  statewide     boolean,
  ccc_rec       text,
  n_adopters    integer,
  match_tier    integer
)
language sql
stable
security invoker
set search_path = public, pg_catalog
as $$
  with needle as (select lower(btrim(coalesce(asked, ''))) as n)
  select c.unified_title, c.issuer, c.statewide, c.ccc_rec,
         cardinality(c.adopter_colleges)::integer, t.tier
  from public.chatbox_credentials c
  cross join needle
  cross join lateral (
    select case
      when lower(c.unified_title) = needle.n then 1
      when exists (select 1 from unnest(c.raw_variants) v where lower(v) = needle.n) then 2
      when lower(c.unified_title) like '%' || needle.n || '%' then 3
      when exists (select 1 from unnest(c.raw_variants) v
                   where lower(v) like '%' || needle.n || '%') then 4
      else 9
    end as tier
  ) t
  where needle.n <> '' and t.tier < 9
  order by t.tier,
           (select max(similarity(lower(v), needle.n))
              from unnest(c.raw_variants || c.unified_title) v) desc nulls last,
           cardinality(c.adopter_colleges) desc,
           c.unified_title
  limit greatest(1, least(coalesce(result_limit, 5), 25));
$$;

-- ── Probe set (expected behaviour, verified live 2026-08-10) ────────────────
--   post                       -> POST Basic Academy, Correctional Officer Core
--   peace officer              -> POST Basic Academy
--   CA POST academy            -> POST Basic Academy      (tier 4, variant)
--   police academy certificate -> POST Basic Academy      (no "POST" in the ask)
--   real estate salesperson    -> California Real Estate Salesperson License
--   emt                        -> EMT Certification, then Firefighter EMT
--   cpr                        -> (none); any() -> First Aid, CPR & AED [local only]
--   basket weaving             -> (none); any() -> (not in catalogue)

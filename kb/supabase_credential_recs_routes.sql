-- Credit-recommendation retrieval for Sierra — the consumer half of
-- chatbox_credential_recs (built by kb/_build_credential_recs.py, Session 147).
--
-- WHY THIS EXISTS ------------------------------------------------------------
-- Session 147 published 2,205 rows carrying the FULL credit-recommendation set
-- per credential (134 statewide / 351 lines; 2,071 local / 3,357). Nothing read
-- them. cpl-chat still answered from chatbox_credentials.ccc_rec — a SINGLE
-- string — so asked about POST Basic Academy Sierra named ONE course when the
-- statewide set is TEN lines (9 carrying a C-ID, 8 distinct, AJ 110 twice).
--
-- Then the second, sharper consequence, measured 2026-08-13 (Session 148):
-- ccc_rec is not merely a lossy summary, it is a RETRIEVAL GATE.
--
--   search_statewide_recommendations had `and c.ccc_rec is not null`.
--   ccc_rec is derived from ADOPTIONS — excel_to_dashboard.py builds it as
--   ccc_recs.most_common(1) over a credential's articulation rows. A statewide
--   exhibit that no college has adopted yet therefore has NO articulations,
--   hence NO ccc_rec (null, not ''), hence it fails the gate.
--
-- Measured on live data:
--   * 38 statewide credentials have zero adopters; ccc_rec is null on all 38.
--   * 36 of them have PUBLISHED recs — 75 credit-recommendation lines.
--   * search_statewide_recommendations('carpenters apprenticeship') → 0 rows,
--     for a credential with 8 published lines.
--   * college_adoption_opportunities('Bakersfield College', 50) → 0 rows with
--     zero adopters, because potential_colleges derives from adoption_leverage,
--     which derives from articulations, which do not exist yet.
--
-- So the exhibits MAP deliberately creates AHEAD of demand — the Carpenters
-- ladder (10 trades), NCCER (13 levels), the CSLB contractor licences, ICC
-- inspector/plans-examiner, OSHA 10 and 30, Commercial and Residential
-- Electrical Apprenticeship — were unreachable on every credential route.
--
-- Sam, 2026-08-13: "Sometimes there are exhibits created (statewide and local)
-- that have not yet been adopted… we create them before the student arrives to
-- make them available to the colleges for adoption. I wouldn't want them
-- excluded because of that. In fact, we want them to be prominent choices for
-- adoption." They were excluded — not ranked last, excluded.
--
-- Applied live via Supabase MCP. Committed so the schema is reproducible.

-- ── credential_recs_for_titles ──────────────────────────────────────────────
-- Batch lookup for titles a route has ALREADY resolved.
--
-- Deliberately not another search function. The credential routes each do their
-- own matching (tiers, the 0.25 tier-4 floor, best-single-name scoring); a
-- second matcher over the same vocabulary would drift from them silently and
-- Sierra would cite recommendations for a credential she did not name. Callers
-- pass the titles they matched, and get one round-trip for the whole answer.
--
-- rec_kind is settled at BUILD time and is mutually exclusive — verified live,
-- 0 titles carry both a statewide and a local row. Sam's rule ("statewide
-- exists → quote the statewide set ONLY, largely ignore the local versions")
-- is therefore already enforced by the data; this function must not re-mix it.
create or replace function public.credential_recs_for_titles(
  titles text[]
)
returns table (
  unified_title       text,
  rec_kind            text,
  recs                jsonb,
  n_recs              integer,
  n_cid_recs          integer,
  n_cid_lines         integer,
  n_non_cid_recs      integer,
  n_adopter_colleges  integer,
  cid_repeats         text[]
)
language sql
stable
security invoker
set search_path = public, pg_catalog
as $$
  select r.unified_title, r.rec_kind, r.recs, r.n_recs, r.n_cid_recs,
         r.n_cid_lines, r.n_non_cid_recs, r.n_adopter_colleges, r.cid_repeats
  from public.chatbox_credential_recs r
  where r.unified_title = any(coalesce(titles, '{}'::text[]))
  order by (r.rec_kind = 'statewide_authoritative') desc, r.n_recs desc,
           r.unified_title;
$$;

grant execute on function public.credential_recs_for_titles(text[])
  to anon, authenticated, service_role;

-- ── Route CRED-STD: stop gating retrieval on a field derived from adoption ──
-- Only the WHERE clause changes: a credential is statewide-answerable if it has
-- a ccc_rec OR a published statewide_authoritative rec set. Everything else —
-- the tier ladder, the 0.25 tier-4 floor, best-single-name scoring, statewide
-- as a FILTER not a tie-break — is unchanged and still earned by the probes
-- documented in kb/supabase_chatbox_credentials.sql.
--
-- Signature is unchanged, so this is a CREATE OR REPLACE and no caller breaks.
-- ccc_rec stays in the result and stays NULL for these rows; the caller must
-- read the recs table for the actual lines. Callers that print ccc_rec directly
-- must handle null — an empty "Statewide recommendation: " line is worse than
-- no line at all.
create or replace function public.search_statewide_recommendations(
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
    c.unified_title,
    c.issuer,
    c.ccc_rec,
    c.discipline,
    cardinality(c.adopter_colleges)::integer,
    c.n_articulation_lines,
    t.tier,
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
    -- THE FIX. Was `c.ccc_rec is not null`, which silently required the
    -- credential to have been adopted somewhere before Sierra could find it.
    and (
      c.ccc_rec is not null
      or exists (
        select 1 from public.chatbox_credential_recs r
        where r.unified_title = c.unified_title
          and r.rec_kind = 'statewide_authoritative'
      )
    )
    and t.tier < 9
    and (t.tier < 4 or s.best_sim >= 0.25)   -- the floor, tier 4 only
  order by t.tier, s.best_sim desc nulls last, c.n_articulation_lines desc, c.unified_title
  limit greatest(1, least(coalesce(result_limit, 5), 25));
$$;

grant execute on function public.search_statewide_recommendations(text, integer)
  to anon, authenticated, service_role;

-- ── Route COLLEGE-ADOPT: two bands, because they are two different claims ───
-- The old function returned one list ordered by peer-adoption count DESC. That
-- ranking is right for what it measures — "well-trodden, low risk" — but it was
-- the ONLY band, and it is reachable only through potential_colleges. A
-- credential nobody has adopted has no leverage list, so it scored no rank at
-- all: it was absent, and absence is indistinguishable from "nothing to offer".
--
-- Splitting into bands rather than re-sorting one list, because the two carry
-- claims that must not be blurred:
--
--   peer_leverage  — peer colleges already TEACH the underlying course and have
--                    not articulated it. Targeted at THIS college. The count is
--                    real evidence others found it worth doing.
--   ready_to_adopt — a statewide standard NO college has adopted yet. Not
--                    targeted at this college and not evidence of anything: it
--                    is a shelf item, adoptable as-is by any college because
--                    that is what statewide means.
--
-- Merging them into one sorted list would let Sierra say "N peers already
-- articulate it" about a credential with zero adopters, which is a fabricated
-- route — the failure kb/_sync_credential_catalog.py warns about where it keeps
-- adopter_colleges and potential_colleges disjoint.
--
-- SLOT RESERVATION, not sort priority. Sam asked for unadopted exhibits to be
-- prominent; ordering them first unconditionally would put the same 38
-- construction credentials at the head of every college's answer and crowd out
-- the targeted band. Instead ready_to_adopt gets a reserved share of the limit
-- (a third, at least 3) that peer_leverage cannot consume, and vice versa.
-- Neither band can be starved and neither can drown the other.
--
-- The band self-empties as adoption happens: it is defined as zero adopters, so
-- the first college to adopt moves that credential into peer_leverage. That is
-- the intended lifecycle, and it means the shelf shrinking is a success signal.
drop function if exists public.college_adoption_opportunities(text, integer);

create function public.college_adoption_opportunities(
  college text,
  result_limit integer default 10
)
returns table (
  unified_title         text,
  issuer                text,
  statewide             boolean,
  ccc_rec               text,
  discipline            text,
  cpl_types             text[],
  peers_already_adopted integer,
  n_articulation_lines  integer,
  students_at_peers     integer,
  band                  text,
  n_rec_lines           integer
)
language sql
stable
security invoker
set search_path = public, pg_catalog
as $$
  with target as (
    select coalesce(
      (select mc.college_name from public.map_colleges mc
        where lower(btrim(mc.college_name)) = lower(btrim(college))
           or exists (select 1 from unnest(mc.variants) v
                      where lower(btrim(v)) = lower(btrim(college)))
        limit 1),
      btrim(college)) as name
  ),
  lim as (
    select greatest(1, least(coalesce(result_limit, 10), 50)) as n
  ),
  quota as (
    -- Reserve a third of the budget for the shelf, at least 3 rows, and never
    -- more than the budget itself (result_limit can be 1).
    select n, least(n, greatest(3, ceil(n / 3.0)::integer)) as ready_n from lim
  ),
  peer as (
    select c.unified_title, c.issuer, c.statewide, c.ccc_rec, c.discipline, c.cpl_types,
           cardinality(c.adopter_colleges)::integer as peers_already_adopted,
           c.n_articulation_lines, v.students as students_at_peers,
           'peer_leverage'::text as band,
           coalesce(r.n_recs, 0)::integer as n_rec_lines,
           row_number() over (
             order by c.statewide desc, cardinality(c.adopter_colleges) desc,
                      c.n_articulation_lines desc, c.unified_title) as rn
    from public.chatbox_credentials c
    cross join target t
    left join public.map_credential_volume v on v.unified_title = c.unified_title
    left join public.chatbox_credential_recs r on r.unified_title = c.unified_title
    where t.name = any(c.potential_colleges)
  ),
  ready as (
    -- Statewide only. A LOCAL credential with no adopters has no basis to be
    -- recommended to one particular college — statewide is precisely the class
    -- that is adoptable by anyone, so scoping the band to it is what makes the
    -- claim true. The 346 unadopted local credentials stay findable by name
    -- through search_credentials_any; they are just not pitched at a college
    -- that has no connection to them.
    select c.unified_title, c.issuer, c.statewide, c.ccc_rec, c.discipline, c.cpl_types,
           0::integer as peers_already_adopted,
           c.n_articulation_lines, null::integer as students_at_peers,
           'ready_to_adopt'::text as band,
           coalesce(r.n_recs, 0)::integer as n_rec_lines,
           row_number() over (
             -- Richest offer first: a credential with 8 published rec lines is
             -- a bigger opportunity than one with 1. Nothing here ranks by
             -- adoption, because by definition there is none.
             order by coalesce(r.n_recs, 0) desc, c.unified_title) as rn
    from public.chatbox_credentials c
    cross join target t
    left join public.chatbox_credential_recs r on r.unified_title = c.unified_title
    where c.statewide
      and cardinality(c.adopter_colleges) = 0
      and not (t.name = any(coalesce(c.adopter_colleges, '{}'::text[])))
  ),
  picked as (
    select p.unified_title, p.issuer, p.statewide, p.ccc_rec, p.discipline, p.cpl_types,
           p.peers_already_adopted, p.n_articulation_lines, p.students_at_peers,
           p.band, p.n_rec_lines, p.rn
    from peer p cross join quota q
    where p.rn <= q.n - least(q.ready_n, (select count(*) from ready))
    union all
    select d.unified_title, d.issuer, d.statewide, d.ccc_rec, d.discipline, d.cpl_types,
           d.peers_already_adopted, d.n_articulation_lines, d.students_at_peers,
           d.band, d.n_rec_lines, d.rn
    from ready d cross join quota q
    where d.rn <= q.ready_n
  )
  select unified_title, issuer, statewide, ccc_rec, discipline, cpl_types,
         peers_already_adopted, n_articulation_lines, students_at_peers,
         band, n_rec_lines
  from picked
  order by band, rn
  limit (select n from lim);
$$;

grant execute on function public.college_adoption_opportunities(text, integer)
  to anon, authenticated, service_role;

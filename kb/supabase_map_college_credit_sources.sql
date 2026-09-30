-- map_college_credit_bucket + map_college_exhibit_credit — WHERE a college's
-- applied and transcribed credit comes from. PUBLISHED, suppression applied at
-- write time. Rebuilt nightly inside map_promote_custom_reports().
--
-- WHY. Sam asked Sierra for the breakdown of Chaffey's 19,405 applied units, then
-- for the military and non-military split and for the exhibits and credit
-- recommendations behind them (2026-09-30; his Sierra Training note on turn
-- 1b9230ce). She read only four college totals, so she had neither. Sheet
-- 2026-09-30-sierra-credit-source, items 4 and 5 ("build"), and his item 6
-- ruling: "I want Sierra to total for everyone using real numbers but when the
-- totals (at any level) are below 10, to show \"<10\" on the views. This should
-- happen without a governance gate."
--
-- THE RULES, from adr-student-detail-aggregate-disclosure-control:
--   · a cell backed by 1..9 distinct students shows "<10": its students AND its
--     units go (at one student the units are that student's record);
--   · a real total beside real rows lets anyone subtract, so wherever the rows
--     under a published total leave a withheld remainder, that remainder spans
--     TWO OR MORE cells and 10 OR MORE students. The smallest published cells
--     join it until it does (decision 5, iterated as its Consequences require);
--   · suppression happens here, never in Sierra's wording.
--
-- SOURCE: map_student_credit, the student view, for both units and students, so
-- the suppression test and the figure come from the same rows, and the
-- breakdowns add up to map_college_credit_summary.applied_in_plan and
-- .transcribed_student_view. Applied = 'Applied to CPL Plan' only; transcribed
-- = every status (transcription is its own step).
--
-- THE MILITARY BUCKET is MAP's CPL type code M (the exhibit catalogue's
-- CPLTypeCode, stored beside each title since 2026-09-30), plus Credit for Basic
-- Military Service, which carries no exhibit id. Where the code has not arrived
-- the exhibit id decides and `type_from_map` says so. Measured 2026-09-30: the
-- id rule matches MAP's own MilitaryCredits column on 99.8% of applied units;
-- the rest (MAPMM ids) is what the code fixes.
--
-- ⚠ SEPARATING THE BUCKETS NEVER DISCOUNTS EITHER (Sam, 2026-08-13;
-- methodology-bucket-military-and-non-military-credit-recommendations).
-- ⚠ NEVER RANK COLLEGES PUBLICLY.

-- ── A · MAP's CPL type code, beside each exhibit title ─────────────────────
alter table public.stg_map_ace_exhibit_titles add column if not exists cpl_type_code text;
alter table public.map_ace_exhibit_titles     add column if not exists cpl_type_code text;

-- ── B · the rebuild ─────────────────────────────────────────────────────────
create or replace function public.rebuild_map_college_credit_sources()
returns void language plpgsql security definer set search_path = public as $$
declare
  bad bigint;
begin
  -- Every student row, classified once.
  drop table if exists pg_temp._src;
  create temp table _src on commit drop as
  select s.college_id, s.student_key,
    coalesce(s.exhibit_id, '') as exhibit_id,
    s.credit_rec, s.course_type, s.cpl_status_plan,
    case when s.cpl_status_plan = 'Applied to CPL Plan' then coalesce(s.applied_credits, 0) else 0 end as applied,
    coalesce(s.transcribed_credits, 0)    as transcribed,
    case when s.cpl_status_plan = 'Needs Action' then coalesce(s.potential_credits, 0)   else 0 end as dormant,
    case when s.cpl_status_plan = 'Needs Action' then coalesce(s.articulated_credits, 0) else 0 end as waiting,
    case when s.cpl_status_plan = 'Applied to CPL Plan' then coalesce(s.apprenticeship_credits, 0) else 0 end as apprenticeship,
    case
      when s.course_type like 'Credit for Basic Military Service%' then 'M'
      when t.cpl_type_code is not null then t.cpl_type_code
      when s.exhibit_id ~ '^(AR|AF|MC|NV|CG|DD|SS|ACE|NWO)[-0-9]'
        or split_part(s.exhibit_id, '-', 1) in ('NER','MCE','MOS','CGR','NEC')
        or s.exhibit_id like 'MAPMM%'                         then 'M'
      when s.exhibit_id like 'MAPSA%'                         then 'SA'
      when s.exhibit_id like 'MAPCBE%' or s.exhibit_id like 'MAPCX%' then 'Cx'
      when s.exhibit_id ~ '^(MAPIC|CPLIC)'                    then 'IC'
      when s.exhibit_id like 'MAPPR%'                         then 'PR'
      else 'O'
    end as type_code,
    (t.cpl_type_code is not null or s.course_type like 'Credit for Basic Military Service%') as type_from_map
  from public.map_student_credit s
  left join public.map_ace_exhibit_titles t on t.exhibit_id = s.exhibit_id;
  -- Every later step joins on (college, exhibit); without this the checks scan
  -- the student rows once per group, which took minutes on the first run.
  create index on _src (college_id, exhibit_id);
  analyze _src;

  -- ── the military / non-military split, per college and statewide ─────────
  drop table if exists public.map_college_credit_bucket;
  create table public.map_college_credit_bucket as
  with cells as (
    select college_id, case when type_code = 'M' then 'military' else 'non_military' end as bucket,
      count(distinct student_key) filter (where dormant     > 0)::int as n_dormant,
      count(distinct student_key) filter (where waiting     > 0)::int as n_waiting,
      count(distinct student_key) filter (where applied     > 0)::int as n_applied,
      count(distinct student_key) filter (where transcribed > 0)::int as n_transcribed,
      count(distinct student_key) filter (where apprenticeship > 0)::int as n_apprenticeship,
      sum(dormant) as dormant_credits, sum(waiting) as articulated_waiting,
      sum(applied) as applied_in_plan, sum(transcribed) as transcribed,
      sum(apprenticeship) as apprenticeship_in_plan
    from _src group by 1, 2
  ),
  -- Both buckets exist for every college, so a missing bucket reads 0, never
  -- absent: "no military credit" is a fact worth stating.
  grid as (
    select c.college_id, b.bucket from (select distinct college_id from _src) c
    cross join (values ('military'), ('non_military')) b(bucket)
  ),
  full_cells as (
    select g.college_id, g.bucket,
      coalesce(n_dormant, 0) n_dormant, coalesce(n_waiting, 0) n_waiting,
      coalesce(n_applied, 0) n_applied, coalesce(n_transcribed, 0) n_transcribed,
      coalesce(n_apprenticeship, 0) n_apprenticeship,
      coalesce(dormant_credits, 0) dormant_credits, coalesce(articulated_waiting, 0) articulated_waiting,
      coalesce(applied_in_plan, 0) applied_in_plan, coalesce(transcribed, 0) transcribed,
      coalesce(apprenticeship_in_plan, 0) apprenticeship_in_plan
    from grid g left join cells c on c.college_id = g.college_id and c.bucket = g.bucket
  ),
  thin as (
    select *,
      (n_dormant     between 1 and 9) t_dormant,
      (n_waiting     between 1 and 9) t_waiting,
      (n_applied     between 1 and 9) t_applied,
      (n_transcribed between 1 and 9) t_transcribed,
      (n_apprenticeship between 1 and 9) t_apprenticeship
    from full_cells
  ),
  -- THE COMPLEMENT. Two buckets sum to the college's total, so one withheld
  -- bucket beside a published one is recoverable: both go.
  comp as (
    select t.*,
      bool_or(t_dormant)     over w as c_dormant,
      bool_or(t_waiting)     over w as c_waiting,
      bool_or(t_applied)     over w as c_applied,
      bool_or(t_transcribed) over w as c_transcribed
    from thin t window w as (partition by college_id)
  )
  select 'college'::text as scope, college_id, bucket,
    case when c_dormant     then null else n_dormant     end as students_dormant,
    case when c_dormant     then null else dormant_credits     end as dormant_credits,
    case when c_waiting     then null else n_waiting     end as students_waiting,
    case when c_waiting     then null else articulated_waiting end as articulated_waiting,
    case when c_applied     then null else n_applied     end as students_applied,
    case when c_applied     then null else applied_in_plan     end as applied_in_plan,
    case when c_transcribed then null else n_transcribed end as students_transcribed,
    case when c_transcribed then null else transcribed         end as transcribed,
    -- Apprenticeship is a line WITHIN non-military; nothing published subtracts
    -- it from anything, so it suppresses on its own group alone.
    case when bucket <> 'non_military' then null when t_apprenticeship then null else apprenticeship_in_plan end as apprenticeship_in_plan,
    array_remove(array[
      case when c_dormant     then 'dormant_credits' end,
      case when c_waiting     then 'articulated_waiting' end,
      case when c_applied     then 'applied_in_plan' end,
      case when c_transcribed then 'transcribed' end,
      case when bucket = 'non_military' and t_apprenticeship then 'apprenticeship_in_plan' end
    ], null)::text[] as withheld
  from comp;

  alter table public.map_college_credit_bucket add primary key (college_id, bucket);

  -- Real statewide totals by bucket (entity_kind = 'college'), each withheld
  -- only where the remainder behind it would be one cell or under 10 students.
  insert into public.map_college_credit_bucket
    (scope, college_id, bucket, students_dormant, dormant_credits, students_waiting, articulated_waiting,
     students_applied, applied_in_plan, students_transcribed, transcribed, apprenticeship_in_plan, withheld)
  with scope as (select college_id from public.map_colleges where entity_kind = 'college'),
  tot as (
    select case when type_code = 'M' then 'military' else 'non_military' end as bucket,
      count(distinct student_key) filter (where dormant     > 0)::int n_dormant,
      count(distinct student_key) filter (where waiting     > 0)::int n_waiting,
      count(distinct student_key) filter (where applied     > 0)::int n_applied,
      count(distinct student_key) filter (where transcribed > 0)::int n_transcribed,
      sum(dormant) dormant_credits, sum(waiting) articulated_waiting,
      sum(applied) applied_in_plan, sum(transcribed) transcribed,
      sum(apprenticeship) apprenticeship_in_plan
    from _src where college_id in (select college_id from scope) group by 1
  ),
  held as (
    select b.bucket,
      count(*) filter (where 'dormant_credits'     = any(b.withheld)) h_dormant,
      count(*) filter (where 'articulated_waiting' = any(b.withheld)) h_waiting,
      count(*) filter (where 'applied_in_plan'     = any(b.withheld)) h_applied,
      count(*) filter (where 'transcribed'         = any(b.withheld)) h_transcribed,
      count(*) filter (where 'apprenticeship_in_plan' = any(b.withheld)) h_apprenticeship
    from public.map_college_credit_bucket b where b.college_id in (select college_id from scope) group by 1
  ),
  res as (
    select case when s.type_code = 'M' then 'military' else 'non_military' end as bucket,
      count(distinct s.student_key) filter (where s.dormant > 0 and 'dormant_credits' = any(b.withheld)) r_dormant,
      count(distinct s.student_key) filter (where s.waiting > 0 and 'articulated_waiting' = any(b.withheld)) r_waiting,
      count(distinct s.student_key) filter (where s.applied > 0 and 'applied_in_plan' = any(b.withheld)) r_applied,
      count(distinct s.student_key) filter (where s.transcribed > 0 and 'transcribed' = any(b.withheld)) r_transcribed,
      count(distinct s.student_key) filter (where s.apprenticeship > 0 and 'apprenticeship_in_plan' = any(b.withheld)) r_apprenticeship
    from _src s
    join public.map_college_credit_bucket b
      on b.college_id = s.college_id and b.bucket = case when s.type_code = 'M' then 'military' else 'non_military' end
    where s.college_id in (select college_id from scope)
    group by 1
  ),
  j as (
    select t.*, coalesce(h.h_dormant, 0) h_dormant, coalesce(h.h_waiting, 0) h_waiting,
      coalesce(h.h_applied, 0) h_applied, coalesce(h.h_transcribed, 0) h_transcribed,
      coalesce(h.h_apprenticeship, 0) h_apprenticeship,
      coalesce(r.r_dormant, 0) r_dormant, coalesce(r.r_waiting, 0) r_waiting,
      coalesce(r.r_applied, 0) r_applied, coalesce(r.r_transcribed, 0) r_transcribed,
      coalesce(r.r_apprenticeship, 0) r_apprenticeship
    from tot t left join held h on h.bucket = t.bucket left join res r on r.bucket = t.bucket
  )
  select 'statewide', 0, bucket,
    case when h_dormant = 1 or r_dormant between 1 and 9 then null else n_dormant end,
    case when h_dormant = 1 or r_dormant between 1 and 9 then null else dormant_credits end,
    case when h_waiting = 1 or r_waiting between 1 and 9 then null else n_waiting end,
    case when h_waiting = 1 or r_waiting between 1 and 9 then null else articulated_waiting end,
    case when h_applied = 1 or r_applied between 1 and 9 then null else n_applied end,
    case when h_applied = 1 or r_applied between 1 and 9 then null else applied_in_plan end,
    case when h_transcribed = 1 or r_transcribed between 1 and 9 then null else n_transcribed end,
    case when h_transcribed = 1 or r_transcribed between 1 and 9 then null else transcribed end,
    case when bucket <> 'non_military' then null
         when h_apprenticeship = 1 or r_apprenticeship between 1 and 9 then null else apprenticeship_in_plan end,
    array_remove(array[
      case when h_dormant = 1 or r_dormant between 1 and 9 then 'dormant_credits' end,
      case when h_waiting = 1 or r_waiting between 1 and 9 then 'articulated_waiting' end,
      case when h_applied = 1 or r_applied between 1 and 9 then 'applied_in_plan' end,
      case when h_transcribed = 1 or r_transcribed between 1 and 9 then 'transcribed' end,
      case when bucket = 'non_military' and (h_apprenticeship = 1 or r_apprenticeship between 1 and 9) then 'apprenticeship_in_plan' end
    ], null)::text[]
  from j;

  -- ── the exhibits behind the credit, per college ──────────────────────────
  -- One row per college and exhibit that carries applied or transcribed credit,
  -- plus one roll-up row per college (exhibit_id '*') for the exhibits that show
  -- "<10": their combined units, published only when they are two or more
  -- cells and 10 or more students.
  drop table if exists pg_temp._ex;
  create temp table _ex on commit drop as
  select college_id, exhibit_id,
    max(type_code) as type_code, bool_and(type_from_map) as type_from_map, max(course_type) as course_type,
    case when max(type_code) = 'M' then 'military' else 'non_military' end as bucket,
    count(distinct student_key) filter (where applied     > 0)::int as n_applied,
    count(distinct student_key) filter (where transcribed > 0)::int as n_transcribed,
    sum(applied) as applied_in_plan, sum(transcribed) as transcribed
  from _src group by 1, 2
  having sum(applied) > 0 or sum(transcribed) > 0;
  create index on _ex (college_id, exhibit_id);

  -- THE ITERATED COMPLEMENT, once per measure and PARTITION. H(k) = the thin
  -- cells plus the k smallest published cells. The smallest k where H(k) has at
  -- least two cells and ten distinct students is how far the withholding
  -- reaches. A student's position is the earliest k at which one of their cells
  -- joins H, so H(k)'s distinct students are the students whose position is at
  -- most k.
  --
  -- ⚠ THE PARTITION FOLLOWS WHAT IS PUBLISHED ABOVE IT. Where both of a
  -- college's buckets publish the measure, each bucket total is a real total
  -- over its own exhibits, so the withholding works INSIDE each bucket (else
  -- the military total minus its published exhibits hands over a lone withheld
  -- military exhibit). Where a bucket is withheld, the college total is the
  -- only one above the exhibits, so the partition is the whole college.
  drop table if exists pg_temp._hide;
  create temp table _hide on commit drop as
  with m as (select 'applied' as measure union all select 'transcribed'),
  bpub as (
    -- does the bucket table publish this measure for BOTH buckets here?
    select college_id, m.measure,
      bool_and(case when m.measure = 'applied' then n_a not between 1 and 9
                    else n_t not between 1 and 9 end) as both_published
    from (select college_id, case when type_code = 'M' then 'military' else 'non_military' end as bucket,
            count(distinct student_key) filter (where applied > 0) as n_a,
            count(distinct student_key) filter (where transcribed > 0) as n_t
          from _src group by 1, 2) b
    cross join m
    group by 1, 2
  ),
  cell as (
    select m.measure, e.college_id, e.exhibit_id,
      case when coalesce(bp.both_published, true) then e.bucket else 'all' end as part,
      case when m.measure = 'applied' then e.n_applied else e.n_transcribed end as n
    from _ex e cross join m
    left join bpub bp on bp.college_id = e.college_id and bp.measure = m.measure
  ),
  ranked as (
    select c.*,
      (n between 1 and 9) as thin,
      case when n >= 10 then row_number() over (partition by measure, college_id, part, (n >= 10) order by n, exhibit_id) end as r
    from cell c where n > 0
  ),
  cnt as (
    select measure, college_id, part, count(*) filter (where thin) as n_thin, count(*) filter (where not thin) as n_pub
    from ranked group by 1, 2, 3
  ),
  pos as (
    select r.measure, r.college_id, r.part, s.student_key, min(case when r.thin then 0 else r.r end) as p
    from ranked r
    join _src s on s.college_id = r.college_id and s.exhibit_id = r.exhibit_id
     and ((r.measure = 'applied' and s.applied > 0) or (r.measure = 'transcribed' and s.transcribed > 0))
    group by 1, 2, 3, 4
  ),
  -- d(k), the distinct students in H(k), steps up at each position; the first
  -- position where it reaches 10 is k0. H also needs two cells, so k is at
  -- least 2 minus the thin cells. No k0 means the partition is too thin.
  dist as (select measure, college_id, part, p, count(*) as c from pos group by 1, 2, 3, 4),
  cum as (
    select measure, college_id, part, p,
      sum(c) over (partition by measure, college_id, part order by p) as d
    from dist
  ),
  k0 as (select measure, college_id, part, min(p) filter (where d >= 10) as k0 from cum group by 1, 2, 3),
  k as (
    select c.measure, c.college_id, c.part, c.n_thin, c.n_pub,
      case when k0.k0 is null then null else greatest(k0.k0, greatest(0, 2 - c.n_thin)) end as k_star
    from cnt c left join k0 on k0.measure = c.measure and k0.college_id = c.college_id and k0.part = c.part
    where c.n_thin > 0
  )
  select r.measure, r.college_id, r.part, r.exhibit_id
  from ranked r join k on k.measure = r.measure and k.college_id = r.college_id and k.part = r.part
  -- no qualifying k (the whole partition is too thin): every cell goes
  where r.thin or r.r <= coalesce(k.k_star, k.n_pub);
  create index on _hide (college_id, exhibit_id, measure);

  drop table if exists public.map_college_exhibit_credit;
  create table public.map_college_exhibit_credit as
  with crs as (
    -- The recommendations under each exhibit. Text always (existence is what a
    -- thin row may show); units per recommendation only where EVERY
    -- recommendation under that exhibit reaches 10 students, since they sum to
    -- the exhibit's own figure.
    select college_id, exhibit_id, coalesce(nullif(credit_rec, ''), '(no recommendation named in MAP)') as cr,
      count(distinct student_key) filter (where applied > 0)::int     as n_applied,
      count(distinct student_key) filter (where transcribed > 0)::int as n_transcribed,
      sum(applied) as applied_in_plan, sum(transcribed) as transcribed
    from _src where applied > 0 or transcribed > 0
    group by 1, 2, 3
  ),
  crs_ok as (
    select college_id, exhibit_id,
      bool_and(n_applied = 0 or n_applied >= 10)         as a_ok,
      bool_and(n_transcribed = 0 or n_transcribed >= 10) as t_ok,
      count(*) as n_crs
    from crs group by 1, 2
  ),
  rows_ as (
    select e.college_id, e.exhibit_id, false as is_rollup, 0 as exhibits_in_rollup, 0 as exhibits_in_rollup_transcribed,
      coalesce(nullif(t.title, ''), case when e.exhibit_id = '' then e.course_type end, e.exhibit_id) as title,
      e.type_code, e.bucket, e.type_from_map,
      exists (select 1 from _hide h where h.measure = 'applied' and h.college_id = e.college_id and h.exhibit_id = e.exhibit_id) as h_a,
      exists (select 1 from _hide h where h.measure = 'transcribed' and h.college_id = e.college_id and h.exhibit_id = e.exhibit_id) as h_t,
      e.n_applied, e.applied_in_plan, e.n_transcribed, e.transcribed
    from _ex e left join public.map_ace_exhibit_titles t on t.exhibit_id = e.exhibit_id
  )
  select r.college_id, r.exhibit_id, r.is_rollup, r.exhibits_in_rollup, r.exhibits_in_rollup_transcribed, r.title,
    r.type_code as cpl_type_code,
    case r.type_code when 'M' then 'Military' when 'IC' then 'Industry Certification'
      when 'SA' then 'Standardized Assessment' when 'Cx' then 'Credit by Exam'
      when 'PR' then 'Portfolio Review' else 'Other' end as cpl_type,
    r.bucket,
    r.type_from_map,
    case when r.h_a then null else r.n_applied end       as students_applied,
    case when r.h_a then null else r.applied_in_plan end as applied_in_plan,
    case when r.h_t then null else r.n_transcribed end   as students_transcribed,
    case when r.h_t then null else r.transcribed end     as transcribed,
    (select jsonb_agg(jsonb_build_object(
        'cr', c.cr,
        'applied_in_plan', case when not r.h_a and (o.n_crs = 1 or o.a_ok) then c.applied_in_plan end,
        'transcribed',     case when not r.h_t and (o.n_crs = 1 or o.t_ok) then c.transcribed end)
        order by case when not r.h_a and (o.n_crs = 1 or o.a_ok) then c.applied_in_plan end desc nulls last, c.cr)
     from crs c join crs_ok o on o.college_id = c.college_id and o.exhibit_id = c.exhibit_id
     where c.college_id = r.college_id and c.exhibit_id = r.exhibit_id) as credit_recs,
    array_remove(array[case when r.h_a then 'applied_in_plan' end,
                       case when r.h_t then 'transcribed' end], null)::text[] as withheld
  from rows_ r;

  -- The roll-up rows: the "<10" exhibits of each partition, combined, as
  -- exhibit_id '*military', '*non_military' or '*' (the whole college). The
  -- hidden set already reaches two cells and ten students wherever a
  -- qualifying k was found; where none was, the roll-up is withheld as well.
  insert into public.map_college_exhibit_credit
    (college_id, exhibit_id, is_rollup, exhibits_in_rollup, exhibits_in_rollup_transcribed, title,
     cpl_type_code, cpl_type, bucket, type_from_map, students_applied, applied_in_plan,
     students_transcribed, transcribed, credit_recs, withheld)
  with a as (
    select h.college_id, h.part,
      count(*) filter (where h.measure = 'applied')     as cells_a,
      count(*) filter (where h.measure = 'transcribed') as cells_t
    from _hide h group by 1, 2
  ),
  stu as (
    select h.college_id, h.part,
      count(distinct s.student_key) filter (where h.measure = 'applied' and s.applied > 0) as n_a,
      count(distinct s.student_key) filter (where h.measure = 'transcribed' and s.transcribed > 0) as n_t,
      sum(s.applied)     filter (where h.measure = 'applied')     as u_a,
      sum(s.transcribed) filter (where h.measure = 'transcribed') as u_t
    from _hide h join _src s on s.college_id = h.college_id and s.exhibit_id = h.exhibit_id
    group by 1, 2
  )
  select a.college_id, '*' || case when a.part = 'all' then '' else a.part end, true,
    a.cells_a, a.cells_t,
    'Exhibits with fewer than 10 students each', null, null,
    case when a.part = 'all' then null else a.part end, null,
    null,
    case when a.cells_a >= 2 and s.n_a >= 10 then s.u_a end,
    null,
    case when a.cells_t >= 2 and s.n_t >= 10 then s.u_t end,
    null,
    array_remove(array[case when a.cells_a > 0 and not (a.cells_a >= 2 and s.n_a >= 10) then 'applied_in_plan' end,
                       case when a.cells_t > 0 and not (a.cells_t >= 2 and s.n_t >= 10) then 'transcribed' end], null)::text[]
  from a join stu s on s.college_id = a.college_id and s.part = a.part;

  alter table public.map_college_exhibit_credit add primary key (college_id, exhibit_id);

  -- ── policies and grants: the same gate as the summary ────────────────────
  alter table public.map_college_credit_bucket enable row level security;
  create policy map_college_credit_bucket_select on public.map_college_credit_bucket
    for select to anon, authenticated using (is_allowed_reviewer() or team_pass_ok());
  alter table public.map_college_exhibit_credit enable row level security;
  create policy map_college_exhibit_credit_select on public.map_college_exhibit_credit
    for select to anon, authenticated using (is_allowed_reviewer() or team_pass_ok());
  -- EXPLICIT GRANTS: both tables are created afresh on every run, and from
  -- 2026-10-30 Supabase stops granting the API roles on a NEW table in public.
  -- Guarded by tests/supabase_table_grants_test.py.
  grant select on public.map_college_credit_bucket  to anon, authenticated, service_role;
  grant select on public.map_college_exhibit_credit to anon, authenticated, service_role;

  -- ── THE PROPERTY, re-measured from the student rows ──────────────────────
  -- Raising here rolls back the nightly promotion that called this.
  -- (1) no published figure backed by 1..9 students, at either grain;
  select count(*) into bad from public.map_college_credit_bucket
   where scope = 'college' and (
         (students_dormant     between 1 and 9) or (students_waiting between 1 and 9)
      or (students_applied     between 1 and 9) or (students_transcribed between 1 and 9));
  if bad > 0 then
    raise exception 'credit sources: % bucket row(s) publish a figure from fewer than 10 students. REFUSING to publish', bad;
  end if;
  select count(*) into bad from public.map_college_exhibit_credit
   where not is_rollup and ((students_applied between 1 and 9) or (students_transcribed between 1 and 9));
  if bad > 0 then
    raise exception 'credit sources: % exhibit row(s) publish a figure from fewer than 10 students. REFUSING to publish', bad;
  end if;
  -- (2) one bucket withheld beside a published one;
  select count(*) into bad from (
    select college_id from public.map_college_credit_bucket where scope = 'college'
    group by college_id
    having count(*) filter (where applied_in_plan is null) = 1
        or count(*) filter (where transcribed is null) = 1
        or count(*) filter (where dormant_credits is null) = 1
        or count(*) filter (where articulated_waiting is null) = 1) x;
  if bad > 0 then
    raise exception 'credit sources: % college(s) withhold one bucket beside a published one. REFUSING to publish', bad;
  end if;
  -- (3) wherever a real total sits above the exhibits (the college; each
  --     bucket, where the bucket table publishes both), the exhibits withheld
  --     under it number zero, or two or more reaching 10 distinct students.
  --     One join over the student rows, grouped, never one scan per group.
  with m as (select 'applied_in_plan' as measure union all select 'transcribed'),
  rows_m as (
    select e.college_id, e.exhibit_id, x.bucket, m.measure,
      (m.measure = any(e.withheld)) as w
    from public.map_college_exhibit_credit e
    join _ex x on x.college_id = e.college_id and x.exhibit_id = e.exhibit_id
    cross join m
    where not e.is_rollup
      and ((m.measure = 'applied_in_plan' and x.n_applied > 0)
        or (m.measure = 'transcribed' and x.n_transcribed > 0))
  ),
  bucket_pub as (
    select b.college_id, m.measure, bool_and(not (m.measure = any(b.withheld))) as pub
    from public.map_college_credit_bucket b cross join m
    where b.scope = 'college' group by 1, 2
  ),
  grouped as (
    select r.*, g.grp
    from rows_m r
    left join bucket_pub bp on bp.college_id = r.college_id and bp.measure = r.measure
    cross join lateral (
      select 'college'::text as grp
      union all
      select r.bucket where coalesce(bp.pub, false)
    ) g
  ),
  counts as (
    select college_id, measure, grp,
      count(*) filter (where w) as w_cells, count(*) filter (where not w) as p_cells
    from grouped group by 1, 2, 3
  ),
  studs as (
    select gr.college_id, gr.measure, gr.grp, count(distinct s.student_key) as w_students
    from grouped gr
    join _src s on s.college_id = gr.college_id and s.exhibit_id = gr.exhibit_id
     and ((gr.measure = 'applied_in_plan' and s.applied > 0)
       or (gr.measure = 'transcribed' and s.transcribed > 0))
    where gr.w
    group by 1, 2, 3
  )
  select count(*) into bad
  from counts c
  left join studs st on st.college_id = c.college_id and st.measure = c.measure and st.grp = c.grp
  where c.w_cells > 0 and c.p_cells > 0 and (c.w_cells < 2 or coalesce(st.w_students, 0) < 10);
  if bad > 0 then
    raise exception 'credit sources: % college measure(s) leave a withheld exhibit recoverable by subtraction. REFUSING to publish', bad;
  end if;
end $$;

revoke all on function public.rebuild_map_college_credit_sources() from public, anon, authenticated;

-- Run once when this file is applied; the nightly promotion calls it after that.
select public.rebuild_map_college_credit_sources();

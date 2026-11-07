-- 2026-11-07 (SkyBramble): a level word still scores, but never meets the one-content-word floor alone;
-- `training` joins the dropped words. Sam, Open Asks Sheet 164 card 3 (2026-11-07): "Tighten the floor".
-- The case: for Basic Military Training's "Advanced Strength Training" at Sierra College the candidate rung
-- offered MUS 4A Advanced Ear Training (0.612) on "advanced" and "training" alone. Measured live before the
-- change on six credentials at Sierra College: 10 of 18 non-C-ID candidates shared only a level word
-- (Intermediate Chinese -> Intermediate Guitar; Basic Food Safety and Sanitation -> Basic Grammar and Punctuation).
-- Level words: advanced, beginning, basic, intermediate. They stay in the score and its denominator, since they
-- separate "Introduction to FCAW" from "Advanced FCAW", two recommendations on one credential.
-- A rec whose only words are level words now gets no title candidate; the peer rows still show.
-- Grants are untouched (CREATE OR REPLACE keeps them). Python mirror: kb/_match_courses_to_ace_recs.py STOP.
-- ROLLBACK: kb/migrations/2026-11-07_alignment_level_words_rollback.sql
CREATE OR REPLACE FUNCTION public.cx_align_tokens(s text)
 RETURNS text[]
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  select coalesce(array_agg(t), '{}'::text[])
  from unnest(string_to_array(public.cx_align_norm(s), ' ')) t
  where t <> ''
    and t not in ('introduction','intro','to','the','a','an','and','or','of','for',
                  'in','on','with','from','into','i','ii','iii','iv','v',
                  'lab','laboratory','labs','course','courses','class',
                  'hour','hours','unit','units','level','part','study','studies',
                  'topics','special','selected','general','applied','elective','electives',
                  'training');
$function$;

CREATE OR REPLACE FUNCTION public.credential_alignment_for_college(credential text, college text, per_rec integer DEFAULT 4)
 RETURNS TABLE(row_kind text, credit_rec text, rec_course text, college_name text, subject text, course_number text, course_title text, units numeric, top_code text, score numeric, attribution text, match_kind text, rec_cid text, course_cid text, cid_title_divergent boolean, peer_total integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  with target as (
    select coalesce(
      (select mc.college_name from public.map_colleges mc
        where lower(btrim(mc.college_name)) = lower(btrim(college))
           or exists (select 1 from unnest(mc.variants) v
                      where lower(btrim(v)) = lower(btrim(college)))
        limit 1),
      btrim(college)) as name
  ),
  has_statewide as (
    select exists (select 1 from public.chatbox_credential_recs
                   where unified_title = credential
                     and rec_kind = 'statewide_authoritative') as yes
  ),
  recs_raw as (
    select x->>'credit' as credit_rec,
           public.cx_rec_course_name(coalesce(x->>'title', x->>'credit')) as rec_course,
           nullif(btrim(coalesce(x->>'cid','')),'') as rec_cid
    from public.chatbox_credential_recs cr
    cross join lateral jsonb_array_elements(cr.recs) x
    where cr.unified_title = credential
    union all
    select p.credit_rec, public.cx_rec_course_name(p.credit_rec),
           case when p.identity_system = 'C-ID' then nullif(btrim(p.course_id),'') end
    from public.chatbox_peer_articulations p
    cross join has_statewide h
    where p.unified_title = credential and not h.yes
  ),
  recs as (
    select credit_rec, min(rec_course) as rec_course,
           (array_agg(rec_cid) filter (where rec_cid is not null))[1] as rec_cid
    from recs_raw where coalesce(credit_rec,'') <> '' group by credit_rec
  ),
  -- A peer row may only appear under a recommendation really in this
  -- credential's set. With no statewide set, recs already carries the peer
  -- wordings, so this join is a no-op and nothing is lost.
  peers_all as (
    select p.credit_rec,
           public.cx_rec_course_name(p.credit_rec) as rec_course,
           p.college, p.subject, p.course_number, p.course_title, p.attribution
    from public.chatbox_peer_articulations p
    cross join target t
    join recs r on r.credit_rec = p.credit_rec
    where p.unified_title = credential and p.college <> t.name
  ),
  peers_ranked as (
    select pa.*,
           count(*) over (partition by pa.credit_rec)::int as peer_total,
           row_number() over (
             partition by pa.credit_rec
             order by (pa.attribution = 'group_wide'), pa.college,
                      pa.subject, pa.course_number
           ) as rn
    from peers_all pa
  ),
  scored as (
    select r.credit_rec, r.rec_course, r.rec_cid, c.college, c.subject,
           c.course_number, c.course_title, c.units, c.top_code,
           nullif(btrim(c.cid),'') as course_cid,
           case
             when r.rec_cid is not null and btrim(c.cid) = r.rec_cid then 'c_id'
             when public.cx_align_norm(c.course_title) = public.cx_align_norm(r.rec_course)
               or similarity(public.cx_align_norm(c.course_title),
                             public.cx_align_norm(r.rec_course)) >= 0.75 then 'title'
             else 'aligned'
           end as match_kind,
           round((0.45 * similarity(public.cx_align_norm(c.course_title),
                                    public.cx_align_norm(r.rec_course))
                + 0.55 * (s.shared::numeric / greatest(1, array_length(a.rw,1))))::numeric, 3) as score
    from recs r
    cross join target t
    join public.chatbox_college_courses c on c.college = t.name
    cross join lateral (select public.cx_align_tokens(r.rec_course) as rw) a
    cross join lateral (select public.cx_align_tokens(c.course_title) as cw) b
    cross join lateral (
      select count(*)::int as shared,
             -- a level word scores but never meets the floor alone (Sheet 164 card 3)
             (count(*) filter (where w not in ('advanced','beginning','basic','intermediate')))::int as content
      from unnest(a.rw) w where b.cw @> array[w]
    ) s
    where (r.rec_cid is not null and btrim(c.cid) = r.rec_cid)
       or s.content >= 1
  ),
  best as (
    select credit_rec,
           min(case match_kind when 'c_id' then 1 when 'title' then 2 else 3 end) as best_tier,
           max(score) as top_score
    from scored group by credit_rec
  ),
  picked as (
    select s.*, b.top_score,
           row_number() over (
             partition by s.credit_rec order by s.score desc, s.course_title) as rn
    from scored s join best b
      on b.credit_rec = s.credit_rec
     and b.best_tier = (case s.match_kind when 'c_id' then 1 when 'title' then 2 else 3 end)
    where s.match_kind <> 'aligned'
       or s.score >= 0.60 * b.top_score      -- the relative floor, tier 3 only
  )
  select 'peer'::text, pr.credit_rec, pr.rec_course, pr.college, pr.subject,
         pr.course_number, pr.course_title, null::numeric, ''::text, null::numeric,
         pr.attribution, null::text, null::text, null::text, null::boolean,
         pr.peer_total
  from peers_ranked pr
  where pr.rn <= greatest(6, least(coalesce(per_rec, 4) * 3, 24))
  union all
  select 'candidate'::text, p.credit_rec, p.rec_course, p.college, p.subject,
         p.course_number, p.course_title, p.units, p.top_code, p.score, null::text,
         p.match_kind, p.rec_cid, p.course_cid,
         (p.match_kind = 'c_id' and p.score < 0.25), null::integer
  from picked p
  where p.rn <= greatest(1, least(coalesce(per_rec, 4), 10))
  order by 2, 1, 10 desc nulls last, 7;
$function$;

-- sierra_feedback: keep CI smoke rows out of the human triage queue
-- ============================================================================
-- SkyDesk (Session 131), 2026-08-09.
--
-- THE PROBLEM. chatbox/smoke_test.sh mode 12 exercises the PUBLIC anon write
-- path (the RPC below) on every run — deliberately, because that path broke
-- once already: a direct PostgREST upsert 401s, since ON CONFLICT needs SELECT
-- visibility that anon does not have. The test is worth keeping exactly as it
-- is. What is NOT worth keeping is where its rows LAND.
--
-- Every run wrote 2 rows at status='new', into the same queue a human is
-- supposed to read. Measured 2026-08-09: 70 rows total, 43 of them CI — 61% of
-- the queue was our own robot, and growing daily. SkyMiner (Session 126) fixed
-- the SYMPTOM by filtering page='smoke' at DISPLAY time in governance.js. That
-- works, but it has to be re-remembered by every surface that ever reads this
-- table, and the next reader who forgets ships a headline that is 61% noise.
--
-- Anon cannot clean up after itself: it is write-only on this table BY DESIGN
-- (RLS gives it no SELECT and no DELETE), which is the correct posture for a
-- public widget and is not going to change. So the fix belongs at the point of
-- WRITE, inside the SECURITY DEFINER function that already runs with the
-- privileges to do it.
--
-- THE PREDICATE, MEASURED BEFORE IT WAS ENCODED (per
-- docs/kb-notes/methodology-a-guard-that-fails-on-truth-gets-muted.md — do not
-- encode a predicate you have not asked the data about):
--
--     SELECT page, count(*), count(*) FILTER (WHERE session_id LIKE 'smoke%')
--     FROM sierra_feedback GROUP BY page;
--
--     smoke           43   43     <- CI, both markers agree on every row
--     sierra          21    0
--     student-portal   6    0
--
-- page='smoke' and session_id LIKE 'smoke%' agree on 43 of 43 rows, and NO real
-- row carries either marker. The real front-ends send their own page values and
-- none of them is 'smoke': sierra/sierra.js -> 'sierra', cpl_chat.js ->
-- 'cobi-tab', the student portal -> 'student-portal'. So this misfiles nothing
-- that exists today.
--
-- Residual risk, stated rather than hidden: `page` is caller-supplied, so a
-- member of the public could POST page='smoke' and have their own feedback land
-- as 'ci' instead of 'new'. The only thing that buys them is hiding their own
-- comment from us, which they could equally achieve by not submitting it. There
-- is no privilege on the other side of this predicate — it sorts a queue, it
-- does not grant anything (cf.
-- docs/kb-notes/methodology-rls-is-not-a-gate-in-front-of-a-service-role-function.md:
-- a caller-supplied field is never an authorisation. It is fine as a LABEL,
-- which is all it is used for here).
--
-- Reversing this: the backfill in step 3 is recoverable — CI rows are exactly
-- `page='smoke'`, so `UPDATE ... SET status='new' WHERE page='smoke'` restores
-- the prior state, and step 2 is a plain CREATE OR REPLACE back to the old body.
-- ============================================================================

-- 1. Widen the status vocabulary. Purely additive: 'ci' is a new allowed value,
--    so no existing row can violate the new constraint. Kept as a CHECK rather
--    than an enum to match the table's existing style.
alter table public.sierra_feedback
  drop constraint if exists sierra_feedback_status_chk;

alter table public.sierra_feedback
  add constraint sierra_feedback_status_chk
  check (status = any (array['new'::text, 'triaged'::text, 'addressed'::text, 'ci'::text]));

-- 2. Stamp the status at write time.
--
--    Unchanged from the previous body: the validation, the left() truncations,
--    the note-preserving ON CONFLICT (a later rating-only upsert must not erase
--    an already-recorded note), and the fact that ON CONFLICT does NOT touch
--    `status` — a human's triage decision survives any later upsert on that
--    turn, including a re-rating by the same visitor.
create or replace function public.sierra_feedback_upsert(
  p_turn_id text,
  p_rating text,
  p_session_id text default null::text,
  p_page text default null::text,
  p_audience text default null::text,
  p_question text default null::text,
  p_response text default null::text,
  p_note text default null::text
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if p_turn_id is null or char_length(p_turn_id) < 8 or char_length(p_turn_id) > 64 then
    raise exception 'invalid turn_id';
  end if;
  if p_rating is null or p_rating not in ('up', 'down') then
    raise exception 'invalid rating';
  end if;
  insert into public.sierra_feedback
    (turn_id, session_id, page, audience, question, response, rating, note, status)
  values
    (p_turn_id, left(p_session_id, 80), left(p_page, 40), left(p_audience, 40),
     left(p_question, 4000), left(p_response, 12000), p_rating, left(p_note, 2000),
     -- CI rows never enter the human queue. See the header for why this marker
     -- and not another, and for what it deliberately does NOT protect.
     case when left(p_page, 40) = 'smoke' then 'ci' else 'new' end)
  on conflict (turn_id) do update set
    rating = excluded.rating,
    -- a later rating-only upsert must not erase an already-recorded note
    note = coalesce(excluded.note, sierra_feedback.note),
    audience = coalesce(excluded.audience, sierra_feedback.audience);
    -- `status` intentionally absent: triage is a human decision, and a visitor
    -- flipping their own rating must not send an addressed row back to 'new'.
end $function$;

-- 3. Backfill the rows already written. 43 rows as of 2026-08-09, all ours.
update public.sierra_feedback
   set status = 'ci'
 where page = 'smoke'
   and status <> 'ci';

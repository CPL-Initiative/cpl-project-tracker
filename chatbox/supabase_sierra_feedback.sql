-- ============================================================================
-- Sierra response feedback (👍/👎 + optional note) + audience logging
-- Schema of record — applied live via the Supabase MCP (Session 92, StarLab).
-- Project: hvuwhnbuahrtptokpqfh
--
-- Consumers:
--   * sierra/sierra.js + cpl_chat.js — per-answer thumbs + note, upserted here
--     with the anon key (POST with Prefer: resolution=merge-duplicates).
--   * The planned "Sierra Training" review surface reads it (reviewer/team-
--     phrase gate) alongside chat_interactions to find response gaps.
--
-- One row per assistant turn, keyed by a client-generated unguessable turn_id
-- (crypto.randomUUID). The client UPSERTs: bare rating on thumb click, again
-- when the optional note lands (or the rating is switched) — no row explosion.
--
-- RLS posture:
--   * NO anon table policies at all. The public write path is the SECURITY
--     DEFINER RPC sierra_feedback_upsert() below — a direct PostgREST upsert
--     (INSERT … ON CONFLICT DO UPDATE) requires the conflicting row to be
--     VISIBLE under a SELECT policy, which this table deliberately denies to
--     anon. (Found empirically: the first smoke run 401'd with "new row
--     violates row-level security policy".) The RPC also centralizes input
--     validation, which is tighter than open anon INSERT/UPDATE policies.
--   * SELECT: is_allowed_reviewer() OR team_pass_ok() ONLY. The public anon
--     key alone reads nothing back.
-- ============================================================================

create table if not exists public.sierra_feedback (
  turn_id text primary key
    constraint sierra_feedback_turn_id_len check (char_length(turn_id) between 8 and 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  session_id text
    constraint sierra_feedback_session_len check (session_id is null or char_length(session_id) <= 80),
  page text                                   -- 'sierra' (standalone) | 'cobi-tab'
    constraint sierra_feedback_page_len check (page is null or char_length(page) <= 40),
  audience text                               -- self-selected population key
    constraint sierra_feedback_audience_len check (audience is null or char_length(audience) <= 40),
  question text                               -- the asked question (snapshot)
    constraint sierra_feedback_question_len check (question is null or char_length(question) <= 4000),
  response text                               -- Sierra's answer (snapshot, truncated client-side)
    constraint sierra_feedback_response_len check (response is null or char_length(response) <= 12000),
  rating text not null
    constraint sierra_feedback_rating check (rating in ('up','down')),
  note text
    constraint sierra_feedback_note_len check (note is null or char_length(note) <= 2000)
);

alter table public.sierra_feedback enable row level security;

-- The ONLY policy: reviewer/team-phrase read. No anon write policies — the
-- write path is the RPC below. (The original anon INSERT/UPDATE policies were
-- dropped in the sierra_feedback_upsert_rpc migration.)
drop policy if exists sierra_fb_select on public.sierra_feedback;
create policy sierra_fb_select on public.sierra_feedback
  for select to anon, authenticated
  using (public.is_allowed_reviewer() or public.team_pass_ok());

-- ── The public write path: validated SECURITY DEFINER upsert ────────────────
-- Clients call POST /rest/v1/rpc/sierra_feedback_upsert with p_* keys
-- (sierra/sierra.js + cpl_chat.js feedbackPayload()).
create or replace function public.sierra_feedback_upsert(
  p_turn_id text,
  p_rating text,
  p_session_id text default null,
  p_page text default null,
  p_audience text default null,
  p_question text default null,
  p_response text default null,
  p_note text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_turn_id is null or char_length(p_turn_id) < 8 or char_length(p_turn_id) > 64 then
    raise exception 'invalid turn_id';
  end if;
  if p_rating is null or p_rating not in ('up', 'down') then
    raise exception 'invalid rating';
  end if;
  insert into public.sierra_feedback
    (turn_id, session_id, page, audience, question, response, rating, note)
  values
    (p_turn_id, left(p_session_id, 80), left(p_page, 40), left(p_audience, 40),
     left(p_question, 4000), left(p_response, 12000), p_rating, left(p_note, 2000))
  on conflict (turn_id) do update set
    rating = excluded.rating,
    -- a later rating-only upsert must not erase an already-recorded note
    note = coalesce(excluded.note, sierra_feedback.note),
    audience = coalesce(excluded.audience, sierra_feedback.audience);
end $$;

revoke all on function public.sierra_feedback_upsert(text, text, text, text, text, text, text, text) from public;
grant execute on function public.sierra_feedback_upsert(text, text, text, text, text, text, text, text) to anon, authenticated;

-- Keep created_at immutable + stamp updated_at on the note/rating upsert.
create or replace function public.sierra_feedback_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.created_at := old.created_at;
  return new;
end $$;

drop trigger if exists sierra_feedback_touch on public.sierra_feedback;
create trigger sierra_feedback_touch
  before update on public.sierra_feedback
  for each row execute function public.sierra_feedback_touch();

-- ── chat_interactions additions (same migration wave) ───────────────────────

-- Audience (population) the asker self-selected — logged per turn for tuning.
alter table public.chat_interactions add column if not exists audience text;

-- Reviewer/team-phrase read path over the chat logs, so the planned Sierra
-- Training surface can mine gaps (low-similarity turns, "no answer" responses,
-- thumbs-down clusters — Sam, 2026-07-01: "informed by log entries to see
-- where gaps might be"). The public anon key alone still reads nothing; the
-- anon INSERT policy is untouched.
drop policy if exists chat_interactions_reviewer_select on public.chat_interactions;
create policy chat_interactions_reviewer_select on public.chat_interactions
  for select to anon, authenticated
  using (public.is_allowed_reviewer() or public.team_pass_ok());

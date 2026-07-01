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
-- when the optional note lands (or the rating is switched) — no row explosion,
-- no UPDATE-by-guessable-key surface.
--
-- RLS posture (deliberate — mirrors the documented tmc_submissions /
-- chat_interactions stance for public, non-sensitive, uuid-keyed rows):
--   * anon INSERT + UPDATE: true. Public thumbs must work logged-out.
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

drop policy if exists sierra_fb_insert on public.sierra_feedback;
create policy sierra_fb_insert on public.sierra_feedback
  for insert to anon, authenticated with check (true);

drop policy if exists sierra_fb_update on public.sierra_feedback;
create policy sierra_fb_update on public.sierra_feedback
  for update to anon, authenticated using (true) with check (true);

drop policy if exists sierra_fb_select on public.sierra_feedback;
create policy sierra_fb_select on public.sierra_feedback
  for select to anon, authenticated
  using (public.is_allowed_reviewer() or public.team_pass_ok());

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

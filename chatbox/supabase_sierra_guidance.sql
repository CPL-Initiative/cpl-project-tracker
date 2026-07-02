-- ═══════════════════════════════════════════════════════════════════════════
-- Sierra guidance layer — Phase 2 of docs/sierra_training_tab_scope.md
-- Session 94 (SkySierra), 2026-07-02 — applied live as migration
-- `sierra_guidance_layer`. This file is the schema of record (Rule: live DB
-- functions/tables need a committed schema —
-- docs/kb-notes/methodology-live-db-functions-need-committed-schema.md).
--
-- Short, team-authored response directives that the shared `cpl-chat` Edge
-- Function (v25+) appends to EVERY system prompt: the newest 10 ACTIVE rows,
-- under a ~2,500-char hard cap — the "same-minute tuning knob without a
-- redeploy". The committed rules inside index.ts (STATEWIDE / CREDIT /
-- OFFERINGS / LANDING-PAGE / AUDIENCE) remain the stable spine; guidance rows
-- layer on top, and the block header the function builds tells the model the
-- team guidance wins on conflict.
--
-- ⚠ Guidance rows steer the PRODUCTION map.rccd.edu widget too — that is the
-- point, but it makes the write gate the security boundary:
--   • SELECT / INSERT / UPDATE gated `is_allowed_reviewer() OR team_pass_ok()`
--     (the Team & RACI magic-link / shared-team-phrase gate).
--   • NO DELETE policy — deactivate (`active = false`) instead; the table is
--     its own audit trail (per the scope doc: "no hard deletes").
--   • NEVER widen any policy to bare anon: a guidance row is prompt text.
-- The Edge Function reads with the service-role key (bypasses RLS), so the
-- gated SELECT only scopes the Training tab's read.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.sierra_guidance (
  id uuid primary key default gen_random_uuid(),
  rule text not null
    constraint sierra_guidance_rule_len check (char_length(rule) between 3 and 500),
  active boolean not null default true,
  note text                                   -- why the rule exists (optional)
    constraint sierra_guidance_note_len check (note is null or char_length(note) <= 300),
  created_by text
    constraint sierra_guidance_created_by_len check (created_by is null or char_length(created_by) <= 120),
  created_at timestamptz not null default now(),
  updated_by text
    constraint sierra_guidance_updated_by_len check (updated_by is null or char_length(updated_by) <= 120),
  updated_at timestamptz not null default now()
);

alter table public.sierra_guidance enable row level security;

-- Team-gated read (the Training tab lists rules; the public reads nothing).
drop policy if exists sierra_guidance_team_select on public.sierra_guidance;
create policy sierra_guidance_team_select on public.sierra_guidance
  for select to anon, authenticated
  using (public.is_allowed_reviewer() or public.team_pass_ok());

-- Team-gated writes. INSERT adds a rule; UPDATE toggles active / edits text.
-- No DELETE policy on purpose — deactivation preserves the audit trail.
drop policy if exists sierra_guidance_team_insert on public.sierra_guidance;
create policy sierra_guidance_team_insert on public.sierra_guidance
  for insert to anon, authenticated
  with check (public.is_allowed_reviewer() or public.team_pass_ok());

drop policy if exists sierra_guidance_team_update on public.sierra_guidance;
create policy sierra_guidance_team_update on public.sierra_guidance
  for update to anon, authenticated
  using (public.is_allowed_reviewer() or public.team_pass_ok())
  with check (public.is_allowed_reviewer() or public.team_pass_ok());

-- Keep created_at/created_by immutable + stamp updated_at on every update.
create or replace function public.sierra_guidance_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.created_at := old.created_at;
  new.created_by := old.created_by;
  return new;
end $$;

drop trigger if exists sierra_guidance_touch on public.sierra_guidance;
create trigger sierra_guidance_touch
  before update on public.sierra_guidance
  for each row execute function public.sierra_guidance_touch();

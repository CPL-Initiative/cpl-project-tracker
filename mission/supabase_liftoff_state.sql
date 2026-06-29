-- liftoff_state — the live overlay behind Mission Control (the "Lift Off"
-- program tracker in the Team & RACI tab). The committed kb/liftoff_plan.json is
-- the structure + default status; this table carries reviewer changes (task
-- status + decision choices), keyed by the plan node id. Render = file ⊕ overlay
-- (the factsheet_overrides / item_updates pattern).
--
-- Anon SELECT (the overlay is applied for every visitor); writes gated by
-- is_allowed_reviewer() OR team_pass_ok() — the shared "team phrase" gate, so a
-- team member who unlocked the Team & RACI tab can also move Mission Control
-- (same boundary as item_raci / item_updates; the public anon key alone still
-- can't write). Empty table = the plan as authored.
--
-- Applied live via the Supabase MCP (project hvuwhnbuahrtptokpqfh); this file is
-- the schema of record. The team-phrase widening landed via the
-- liftoff_state_team_phrase_gate migration (StarNova, 2026-06-29).

create table if not exists public.liftoff_state (
  id          text primary key,            -- a kb/liftoff_plan.json node id (task or decision)
  status      text,                        -- task status override: not_started|in_progress|blocked|done|skipped
  chosen      text,                        -- decision: the chosen option id (forks the downstream branch)
  note        text,                        -- optional reviewer note (reserved; not surfaced in v1)
  updated_by  text,
  updated_at  timestamptz not null default now()
);

alter table public.liftoff_state enable row level security;

-- Public read (the program board is visible to everyone; editing is gated).
drop policy if exists liftoff_state_read on public.liftoff_state;
create policy liftoff_state_read on public.liftoff_state
  for select using (true);

-- Reviewer-OR-team-phrase-gated writes (mirrors item_raci / item_updates).
drop policy if exists liftoff_state_insert on public.liftoff_state;
create policy liftoff_state_insert on public.liftoff_state
  for insert with check (is_allowed_reviewer() or team_pass_ok());

drop policy if exists liftoff_state_update on public.liftoff_state;
create policy liftoff_state_update on public.liftoff_state
  for update using (is_allowed_reviewer() or team_pass_ok())
  with check (is_allowed_reviewer() or team_pass_ok());

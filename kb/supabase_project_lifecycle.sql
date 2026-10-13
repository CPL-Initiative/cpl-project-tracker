-- ─────────────────────────────────────────────────────────────────────────
-- project_lifecycle — soft-delete (Table / Archive) overlay for the
-- Activities & Projects cards.  (SkyScribe, Session 84, 2026-06-29)
--
-- One row per project that has been **Tabled** (paused, may resume — e.g. a
-- project contingent on funding that didn't land) or **Archived** (done /
-- cancelled, kept for the record). The ABSENCE of a row means the project is
-- active. The overlay is read by:
--   • excel_to_dashboard.py — drops the project from the live priority surfaces
--     (the project grid, CPL_DATA.projects → RACI matrix / Annual Report /
--     custom reports, and the Annual Workplan Goals table) and renders it
--     instead in a collapsed "Tabled & Archived" section with the reason + date.
--   • project_lifecycle.js — applies the same overlay live (hide a just-tabled
--     card before the next daily regen) and provides the reviewer's
--     Table / Archive / Restore affordance.
--   • kb/_load_projects.py:load_project_lifecycle() — folds it into the
--     committed kb/project_lifecycle.json ledger each daily run (the "noted in
--     the KB" record that syncs to the Obsidian vault).
--
-- Reversible, never a hard delete (Restore = DELETE the row → the project
-- returns to the grid on the next daily regen). Mirrors the liftoff_state /
-- item_updates overlay pattern. Applied live via the Supabase MCP; this file is
-- the schema of record.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.project_lifecycle (
  project_id  text primary key,
  state       text not null check (state in ('tabled', 'archived')),
  reason      text,
  updated_by  text,
  updated_at  timestamptz not null default now()
);
alter table public.project_lifecycle enable row level security;

-- Anon SELECT — the overlay renders for every visitor.
drop policy if exists plc_select on public.project_lifecycle;
create policy plc_select on public.project_lifecycle for select using (true);

-- Write gated to a signed-in reviewer alone (is_allowed_reviewer()). Sam, Open
-- Asks Sheet 77 card 2, "Reviewer only on both tabs", 2026-10-13 22:25Z: taking a
-- sub-activity off the workplan is a reviewer's action on the Activities tab as on
-- Annual Goals (Sheet 75 card 3). From Session 84 until then the shared team phrase
-- (team_pass_ok(), the x-team-pass header) could write here too. Re-applying this
-- file is idempotent; the S385 apply went through supabase-migrate.yml, and its
-- rollback is the same three policies with "or team_pass_ok()" restored.
drop policy if exists plc_insert on public.project_lifecycle;
create policy plc_insert on public.project_lifecycle for insert
  with check (is_allowed_reviewer());
drop policy if exists plc_update on public.project_lifecycle;
create policy plc_update on public.project_lifecycle for update
  using (is_allowed_reviewer())
  with check (is_allowed_reviewer());
drop policy if exists plc_delete on public.project_lifecycle;
create policy plc_delete on public.project_lifecycle for delete
  using (is_allowed_reviewer());

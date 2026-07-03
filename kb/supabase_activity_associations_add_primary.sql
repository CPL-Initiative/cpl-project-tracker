-- ============================================================================
-- Activity↔Project associations — add is_primary
-- Activity↔Project editor (edit existing links) · §8 schema change
-- ============================================================================
-- NOT auto-applied. Run on Sam's go via the Supabase MCP `apply_migration`
-- (the established one-shot-DDL path, same as the Activity↔Project PR-A
-- migration + the projects RLS tighten) or the Supabase dashboard SQL editor.
--
-- WHY: the association editor lets a curator mark exactly ONE Activity as the
-- "primary" association for each Project (the lead Activity that owns it). The
-- N-to-N association table (public.workplan_activity_associations, created in
-- Activity↔Project PR-A) has no place to record that today — it carries only
-- (project_id, activity_id, created_at). This adds the boolean.
--
-- App-enforced single-primary invariant: the editor sets exactly one primary
-- per project on each save (it PATCHes the chosen row to is_primary=true and
-- PATCHes that project's OTHER association rows to is_primary=false in the same
-- save). There is no DB partial-unique index here because the editor enforces
-- it and adding one would reject a transient two-true window during the save
-- fan-out. If the invariant ever needs a DB-level guard, a deferred
-- partial-unique index is the follow-up:
--   create unique index workplan_assoc_one_primary
--     on public.workplan_activity_associations (project_id)
--     where is_primary;
-- (Deferred — not part of this migration. Would need the editor to clear-then-
-- set inside a single transaction / RPC to avoid the two-true window.)
--
-- GRACEFUL DEGRADATION: the editor reads is_primary if present and shows which
-- Activity is primary; if the column is absent (this migration unapplied) it
-- treats every association as non-primary and never crashes. PostgREST 400s on
-- an unknown column in a write body, so the editor only adds is_primary to its
-- PATCH/POST bodies once it has DETECTED the column on read (the
-- ASSOC_HAS_PRIMARY gate in workplan_goals.js). Until then it writes the
-- (project_id, activity_id) shape that works against the current schema. Once
-- this migration lands and the next daily snapshot carries is_primary, the
-- primary affordance + writes light up automatically.
--
-- PRECONDITIONS (already true on hvuwhnbuahrtptokpqfh):
--   * public.workplan_activity_associations exists (Activity↔Project PR-A)
--   * RLS is ENABLED with public-read + is_allowed_reviewer()-gated writes
--     (mirrors workplan_goals; no policy change needed here — a new column is
--     covered by the existing row policies)
-- ============================================================================

begin;

-- 1. Add the primary flag. NOT NULL + DEFAULT false so existing rows (the 27
--    backfilled-by-leading-digit associations) become non-primary immediately
--    and no row is left NULL. The curator promotes one per project via the
--    association editor.
alter table public.workplan_activity_associations
  add column if not exists is_primary boolean not null default false;

comment on column public.workplan_activity_associations.is_primary is
  'True for the single primary (lead) Activity association of a Project. '
  'App-enforced one-true-per-project by the association editor '
  '(workplan_goals.js): on save it sets the chosen row true and the '
  'project''s other association rows false in the same fan-out. No DB '
  'partial-unique index (would reject the transient two-true save window).';

commit;

-- Verify (optional):
--   select column_name, data_type, is_nullable, column_default
--   from information_schema.columns
--   where table_schema='public'
--     and table_name='workplan_activity_associations'
--   order by ordinal_position;
--
-- Backfill a sensible default primary (optional, run AFTER the column exists —
-- makes each project's lowest-id association its primary so the UI shows a
-- primary even before any curator touches it; the editor overrides freely):
--   update public.workplan_activity_associations a
--   set is_primary = true
--   where a.activity_id = (
--     select min(b.activity_id)
--     from public.workplan_activity_associations b
--     where b.project_id = a.project_id
--   );
-- (Left commented — the product owner decides whether to seed defaults or let
-- the editor assign primaries deliberately. The editor treats "no primary yet"
-- as a valid state.)


-- ============================================================================
-- 2026-07-03 (Session 97 follow-up) — team-phrase widening, Phase 1  ✅ APPLIED LIVE
-- (migration `team_phrase_widen_p1_associations`, via the Supabase MCP; plan:
--  docs/team_phrase_expansion_plan.md — Sam: "Go phase 1")
--
-- ALL THREE write policies — INSERT, UPDATE, **and DELETE** — widen to
-- reviewer OR shared team phrase. The DELETE widening is a DELIBERATE,
-- DOCUMENTED exception to the Phase-1 "DELETEs stay reviewer-only" rule:
--
--   * This is a JOIN table (project_id, activity_id links). "Delete" here is
--     the everyday UN-CHECK action in the association popover
--     (assoc_editor.js removeAssociation) — a phrase user who can check an
--     Activity box must be able to un-check it, or the editor is add-only
--     and broken for the team.
--   * Fully reversible: re-checking the box re-creates the identical row.
--     No cascade, no data loss beyond the link itself (contrast: deleting a
--     projects / budget_funding / workplan_goals row destroys content —
--     those DELETEs stay reviewer-only).
--
-- team_pass_ok() reads the x-team-pass header (raci/supabase_raci.sql).
-- Pinned by tests/team_phrase_p1.test.js.
-- ============================================================================

alter policy waa_insert on public.workplan_activity_associations
  with check (is_allowed_reviewer() or team_pass_ok());
alter policy waa_update on public.workplan_activity_associations
  using (is_allowed_reviewer() or team_pass_ok())
  with check (is_allowed_reviewer() or team_pass_ok());
alter policy waa_delete on public.workplan_activity_associations
  using (is_allowed_reviewer() or team_pass_ok());

-- Verify:
--   select policyname, cmd, qual, with_check from pg_policies
--   where schemaname='public'
--     and tablename='workplan_activity_associations' order by cmd;

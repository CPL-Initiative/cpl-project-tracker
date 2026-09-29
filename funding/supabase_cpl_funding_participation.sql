-- ⚠️ NARROWED 2026-08-28 (Sam): curating funding requires a magic-link
-- reviewer, NOT the team phrase. Live policies were altered to match; this
-- file is the SQL of record and must state the same gate.
-- ─────────────────────────────────────────────────────────────────────────
-- cpl_funding_participation — the Implementation Funding tab's baseline-
-- eligibility OPT-IN registry (2026-07-06, migration cpl_funding_participation).
--
-- Baseline requirement ② (team spec via Sam): a college must REQUEST to
-- participate in implementation funding by the deadline (default Sept 1,
-- 2026 — editable in-tab via the config layers). One row per opted-in
-- college, keyed by the funding roster's short college name; ABSENCE of a
-- row = not opted in. Institutional policy info only — no PII.
--
-- The badge is INFORMATIONAL in the current draft (dollars unchanged);
-- requirement ① (a CPL Coordinator listed in MAP) reads live from the
-- map_coordinator_summary() RPC — see map/supabase_map_contacts.sql.
--
-- RLS: anon SELECT (everyone sees the badge). INSERT/UPDATE **and DELETE**
-- gated is_allowed_reviewer() — DELETE is deliberately
-- widened (the workplan_activity_associations precedent): un-checking an
-- opt-in is the drill-in toggle's natural, reversible undo, not a
-- destructive admin action. The tab RE-FETCHES after every write (an
-- RLS-filtered DELETE returns 2xx with nothing deleted — the re-read is the
-- honest confirmation, per the #598 lesson).
--
-- Applied live via the Supabase MCP; this file is the schema of record.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.cpl_funding_participation (
  college      text primary key,
  requested_at timestamptz not null default now(),
  noted_by     text
);

alter table public.cpl_funding_participation enable row level security;

drop policy if exists cfp_select on public.cpl_funding_participation;
create policy cfp_select on public.cpl_funding_participation for select using (true);

drop policy if exists cfp_insert on public.cpl_funding_participation;
create policy cfp_insert on public.cpl_funding_participation for insert
  to anon, authenticated
  with check (is_allowed_reviewer());

drop policy if exists cfp_update on public.cpl_funding_participation;
create policy cfp_update on public.cpl_funding_participation for update
  to anon, authenticated
  using (is_allowed_reviewer())
  with check (is_allowed_reviewer());

drop policy if exists cfp_delete on public.cpl_funding_participation;
create policy cfp_delete on public.cpl_funding_participation for delete
  to anon, authenticated
  using (is_allowed_reviewer());

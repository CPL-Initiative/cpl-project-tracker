-- ============================================================================
-- Site-scoped team phrases — Finance (fin_pass_ok), generalising gr_pass_ok()
-- Sam, 2026-08-12: "if they show up on two tabs, allow either…"
-- ============================================================================
-- Applied via the Supabase MCP `apply_migration` (the established one-shot-DDL
-- path); committed here for provenance + rollback reference.
--
-- THE RULE THIS ENCODES
--   A tab that appears under ONE site only (the EXCLUSIVE list in cobi_orgs.js)
--   answers to that site's own phrase. Every SHARED tab keeps team_pass_ok(),
--   which matches ANY secret in team_access — so "allow either" on shared tabs
--   costs nothing and nobody loses access they have today.
--
--   A tab can only carry a site phrase if it is exclusive to that site, because
--   every other gated tab is ALSO a CPL tab: requiring the org phrase there
--   would lock out everyone working from the CPL site. Measured 2026-08-12,
--   exactly two tabs qualify:
--       gr-priorities  → gr_pass_ok()   (shipped earlier)
--       contracts      → fin_pass_ok()  (this migration)
--   C&I and CIP have ZERO Supabase-backed tables of their own, so there is
--   nothing for a C&I or CIP phrase to gate. That is an empty set, not an
--   oversight — which is why the `ci` secret has no server-side gate.
--
-- CONSEQUENCE, STATED PLAINLY: because team_pass_check() matches any row's
-- secret, a SITE phrase also opens every shared tab. That is intended under
-- "allow either" — a site phrase is a superset, not a narrower key. It is safe
-- only while every phrase holder is trusted with all shared CPL data. The day a
-- site phrase goes to someone outside that circle, split the scopes: give
-- team_access a `scope` column and have team_pass_check() match only
-- scope='shared' rows. That is the migration to reach for, and it is a decision
-- about WHO HOLDS A PHRASE, not about the code.
--
-- Rollback: drop fin_pass_ok()/fin_pass_check(), restore the 12 contract
-- policies to `is_allowed_reviewer() OR team_pass_ok()`, delete the `fin` row.
-- No data changes are involved in any step.
-- ============================================================================

-- ── Step 1 — ADDITIVE (applied first, alone). Nothing any existing phrase
-- holder can do changes: no policy references fin_pass_ok() yet.
-- The secret itself is NEVER committed — it is set live and rotated from the
-- ⚙ Manage team phrases dialog on the Team & RACI tab.
insert into public.team_access (id, secret)
values ('fin', '<set-live-never-committed>')
on conflict (id) do nothing;

create or replace function public.fin_pass_check(p text)
returns boolean
language sql
stable security definer
set search_path to 'public'
as $$
  select exists (select 1 from public.team_access where id = 'fin' and secret = p);
$$;

create or replace function public.fin_pass_ok()
returns boolean
language plpgsql
stable security definer
set search_path to 'public'
as $$
  declare hdr text;
  begin
    hdr := nullif(current_setting('request.headers', true)::json ->> 'x-team-pass', '');
    if hdr is null then return false; end if;
    return public.fin_pass_check(hdr);
  end;
$$;

grant execute on function public.fin_pass_check(text) to anon, authenticated;
grant execute on function public.fin_pass_ok() to anon, authenticated;

-- ── Step 2 — THE SWAP (applied only after the client shipped).
-- Sequenced deliberately: contracts.js sends the Finance phrase when held and
-- the shared phrase otherwise, so before this step both open the register and
-- after it only Finance does. Landing the swap first would have left Contracts
-- unreadable for anyone holding the shared phrase, with no unlock box deployed
-- yet to fix it.
--
-- DELETE stays reviewer-only on all four tables (the Phase-1 rule: every
-- content-bearing DELETE keeps a named, verified identity behind it).
alter policy "cpl_contracts_read"   on public.cpl_contracts
  using (is_allowed_reviewer() or fin_pass_ok());
alter policy "cpl_contracts_insert" on public.cpl_contracts
  with check (is_allowed_reviewer() or fin_pass_ok());
alter policy "cpl_contracts_update" on public.cpl_contracts
  using (is_allowed_reviewer() or fin_pass_ok());

alter policy "cpl_contract_deliverables_read"   on public.cpl_contract_deliverables
  using (is_allowed_reviewer() or fin_pass_ok());
alter policy "cpl_contract_deliverables_insert" on public.cpl_contract_deliverables
  with check (is_allowed_reviewer() or fin_pass_ok());
alter policy "cpl_contract_deliverables_update" on public.cpl_contract_deliverables
  using (is_allowed_reviewer() or fin_pass_ok());

alter policy "cpl_contract_reports_read"   on public.cpl_contract_reports
  using (is_allowed_reviewer() or fin_pass_ok());
alter policy "cpl_contract_reports_insert" on public.cpl_contract_reports
  with check (is_allowed_reviewer() or fin_pass_ok());
alter policy "cpl_contract_reports_update" on public.cpl_contract_reports
  using (is_allowed_reviewer() or fin_pass_ok());

alter policy "cpl_contract_documents_read"   on public.cpl_contract_documents
  using (is_allowed_reviewer() or fin_pass_ok());
alter policy "cpl_contract_documents_insert" on public.cpl_contract_documents
  with check (is_allowed_reviewer() or fin_pass_ok());
alter policy "cpl_contract_documents_update" on public.cpl_contract_documents
  using (is_allowed_reviewer() or fin_pass_ok());

-- NOTE: the private 'contract-docs' storage bucket is UNCHANGED and stays
-- is_allowed_reviewer()-only. The Storage API does not forward the x-team-pass
-- request header into the Postgres session, so no phrase — shared or Finance —
-- can open it. contracts.js already says "sign in to open" rather than
-- pretending otherwise.

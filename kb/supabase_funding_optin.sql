-- ============================================================================
-- Implementation Funding — self-service administrator opt-in (v1)
-- Session: SkyOptIn (2026-08-05).  Applied via the Supabase MCP to project
-- hvuwhnbuahrtptokpqfh ("Work Plan").  Committed here as the receipt.
--
-- WHAT THIS DOES
--   Turns cpl_funding_participation from a reviewer-only boolean toggle into a
--   PUBLIC self-service opt-in that captures the attesting administrator
--   (VPAA / VPSS / CEO), wired to the existing baselineGate() participation gate.
--
--   Sam's ruling (2026-08-05): ATTEST-FIRST — a self-submitted opt-in satisfies
--   the gate immediately (status 'self_attested'); the CO reviews in a lane and
--   can CONFIRM (→ 'confirmed') or REVOKE (→ 'revoked').  "Opting in only makes a
--   college eligible to earn; it moves no money by itself" — low-stakes,
--   reversible, attest-not-pre-verify (matches the model's existing philosophy).
--
-- PII POSTURE (matches the tab's norm — the coordinator name/email are already
--   reviewer-gated; only a boolean is anon):
--     * attestor_name / attestor_title / attestor_email + confirmed_by are PII →
--       NEVER exposed to anon.  Column-level SELECT is revoked from anon /
--       authenticated and re-granted only on the non-PII columns.
--     * The reviewer confirm lane reads the PII through the SECURITY DEFINER RPC
--       cpl_funding_optin_review(), which gates on is_allowed_reviewer() OR
--       team_pass_ok() INSIDE the function (the map_coordinator_summary pattern).
--     * anon can WRITE the PII (a write-only self-attestation) but cannot read it
--       back — the public form POSTs with Prefer: return=minimal and then
--       re-reads status from the non-PII columns.
--
--   college is the PRIMARY KEY (one row per college).  Re-submit after a REVOKE
--   requires the CO to Remove (DELETE) the revoked row first — the CO is in the
--   loop by definition, so this is acceptable for v1.
--
-- Idempotent: safe to re-run.
-- ============================================================================

-- 1. attestation + lifecycle columns ----------------------------------------
alter table public.cpl_funding_participation
  add column if not exists attestor_name  text,
  add column if not exists attestor_title text,
  add column if not exists attestor_email text,
  -- legacy reviewer inserts (setOptIn) carry no status → default them 'confirmed'
  add column if not exists status text not null default 'confirmed',
  add column if not exists source text not null default 'reviewer',
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmed_by text,
  add column if not exists revoked_at   timestamptz;

-- 2. value + length guards (defence-in-depth beneath the RLS WITH CHECK) -----
do $$
begin
  if not exists (select 1 from pg_constraint
                 where conrelid='public.cpl_funding_participation'::regclass
                   and conname='cfp_status_chk') then
    alter table public.cpl_funding_participation
      add constraint cfp_status_chk
      check (status in ('self_attested','confirmed','revoked'));
  end if;
  if not exists (select 1 from pg_constraint
                 where conrelid='public.cpl_funding_participation'::regclass
                   and conname='cfp_attest_len_chk') then
    alter table public.cpl_funding_participation
      add constraint cfp_attest_len_chk check (
        char_length(college) <= 120
        and (attestor_name  is null or char_length(attestor_name)  <= 120)
        and (attestor_title is null or char_length(attestor_title) <= 60)
        and (attestor_email is null or char_length(attestor_email) <= 160)
      );
  end if;
end $$;

-- 3. PII column-read protection ---------------------------------------------
--    anon/authenticated keep table-level DML (RLS is the real gate) but lose
--    blanket SELECT; only the non-PII columns are re-granted.
revoke select on public.cpl_funding_participation from anon, authenticated;
grant  select (college, status, source, requested_at, noted_by, confirmed_at, revoked_at)
  on public.cpl_funding_participation to anon, authenticated;

-- 4. constrained PUBLIC insert (the self-service opt-in) ---------------------
drop policy if exists cfp_insert_self on public.cpl_funding_participation;
create policy cfp_insert_self on public.cpl_funding_participation
  for insert to anon, authenticated
  with check (
    status = 'self_attested' and source = 'self'
    and confirmed_at is null and confirmed_by is null and revoked_at is null
    and attestor_name  is not null and btrim(attestor_name) <> '' and char_length(attestor_name) <= 120
    and attestor_title in ('VPAA','VPSS','CEO','Other')
    and attestor_email is not null and char_length(attestor_email) <= 160
        and attestor_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    and char_length(btrim(college)) between 1 and 120
  );

-- (the existing cfp_insert / cfp_update / cfp_delete reviewer policies stay:
--  reviewer manual mark = confirmed insert; CO confirm/revoke = update;
--  CO remove = delete. Permissive policies OR together.)

-- 5. reviewer-only PII read for the confirm lane ----------------------------
create or replace function public.cpl_funding_optin_review()
returns table (
  college text, attestor_name text, attestor_title text, attestor_email text,
  status text, source text, requested_at timestamptz,
  confirmed_at timestamptz, confirmed_by text, revoked_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  -- non-reviewers get zero rows — never any PII
  if not (public.is_allowed_reviewer() or public.team_pass_ok()) then
    return;
  end if;
  return query
    select p.college, p.attestor_name, p.attestor_title, p.attestor_email,
           p.status, p.source, p.requested_at, p.confirmed_at, p.confirmed_by, p.revoked_at
    from public.cpl_funding_participation p
    where p.source = 'self'
    order by (p.status = 'self_attested') desc, p.requested_at desc;
end;
$$;
revoke all on function public.cpl_funding_optin_review() from public, anon, authenticated;
grant execute on function public.cpl_funding_optin_review() to anon, authenticated;

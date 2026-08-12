-- COBI FIN › Contracts register — schema receipt (SkyFund, Session 144, 2026-08-12).
--
-- APPLIED LIVE via the Supabase MCP on 2026-08-12 in four migrations:
--   cpl_contracts_register · contract_docs_private_bucket ·
--   cpl_contracts_findings · cpl_contract_deliverable_detail
-- This file is the reviewable record of what those did. Re-running it is safe
-- (every statement is IF NOT EXISTS / idempotent), but it is a RECEIPT, not the
-- deploy path.
--
-- GATING. The register is team-gated exactly like map_data_quality and
-- governance_owners: is_allowed_reviewer() OR team_pass_ok(). Deletes are
-- reviewer-only everywhere, because removing a contract row, a recorded report
-- or a document reference destroys audit trail that a shared phrase should not
-- reach.
--
-- ⚠ THE DOCUMENT BUCKET IS STRICTER THAN THE REGISTER, DELIBERATELY. Storage RLS
-- below is is_allowed_reviewer() with NO team_pass_ok() branch. That is not an
-- oversight: team_pass_ok() reads current_setting('request.headers'), and the
-- Storage API does not forward the x-team-pass header into the Postgres session,
-- so the branch would silently evaluate false. Encoding the real constraint here
-- — and saying "sign in to open" in the UI — beats discovering it as a confusing
-- failure in the browser.

-- ── the register ──────────────────────────────────────────────────────────────
create table if not exists public.cpl_contracts (
  id             uuid primary key default gen_random_uuid(),
  agreement_no   text not null unique,
  title          text not null,
  vendor_name    text,
  vendor_short   text,
  fiscal_agent   text,
  program_name   text,
  amount_total   numeric(14,2),
  -- Three dates, deliberately separate: a cover page may ESTIMATE a start that
  -- the operative clause contradicts. V0718 estimates 2025-06-30; Section B
  -- commences on full execution, 2025-08-07. Collapsing them would hide that the
  -- real term is under 35 months while three cost lines are priced "for 3 years".
  term_start_est date,
  term_executed  date,
  term_end       date,
  status         text not null default 'executed'
                 check (status in ('draft','executed','amended','expired','terminated')),
  co_monitor     jsonb default '{}'::jsonb,
  vendor_contact jsonb default '{}'::jsonb,
  fiscal_contact jsonb default '{}'::jsonb,
  funding_ref    jsonb default '{}'::jsonb,
  invoice_cadence text,
  -- The per-deliverable reporting obligation and the clause it comes from. Held
  -- as data because it is the difference between an ask and an entitlement:
  -- V0718's Evaluation column obliges quarterly check-ins for Goal 1 only, but
  -- Section D requires a per-deliverable summary with EVERY quarterly invoice.
  report_clause      text,
  report_clause_ref  text,
  -- 'proposed' = breakdown read out of the PDF by a session, not yet confirmed
  -- by a person. The UI badges it until someone confirms.
  parse_status   text not null default 'proposed'
                 check (parse_status in ('proposed','confirmed')),
  confirmed_by   text,
  confirmed_at   timestamptz,
  -- Review findings raised at parse time — ambiguities, template artifacts,
  -- internal contradictions. Data, not hardcoded UI prose.
  findings       jsonb not null default '[]'::jsonb,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  updated_by     text
);

create table if not exists public.cpl_contract_deliverables (
  id             uuid primary key default gen_random_uuid(),
  contract_id    uuid not null references public.cpl_contracts(id) on delete cascade,
  goal_no        int  not null,
  goal_title     text,
  goal_amount    numeric(14,2),
  goal_preamble  text,   -- carried on the goal's first row, like goal_title
  goal_outcome   text,
  seq            int  not null default 0,
  -- kind is load-bearing. 'obligation' is what the VENDOR owes. 'role_duty' is
  -- what a person the vendor appoints does at a college — V0718 Goal 2 lists six
  -- of these under one vendor obligation, and scoring ASCCC against 115 people's
  -- campus work would be neither fair nor measurable. 'evaluation' is the
  -- contract's own check. Only 'obligation' counts toward progress.
  kind           text not null default 'obligation'
                 check (kind in ('obligation','role_duty','evaluation')),
  label          text not null,
  -- {verbatim, parts[], funded_by, evaluated_by, note} — the contract's own
  -- wording, revealed when a row is expanded. `label` is a shortening and must
  -- never be mistaken for the agreement.
  detail         jsonb not null default '{}'::jsonb,
  countable_target text,
  countable_unit   text,
  cadence        text check (cadence in ('quarterly','bi-annual','annual','per-workgroup','ongoing')),
  status         text not null default 'not_started'
                 check (status in ('not_started','in_progress','complete','blocked','not_applicable')),
  -- NULL means UNMEASURED, never zero. A dash in the UI must not read as
  -- "the vendor delivered nothing".
  recorded_count numeric(12,2),
  last_period    text,
  note           text,
  source_ref     text,
  updated_at     timestamptz not null default now(),
  updated_by     text
);
create index if not exists cpl_contract_deliverables_contract_idx
  on public.cpl_contract_deliverables (contract_id, goal_no, seq);

-- Holds ONLY what has been recorded. An absent row is "not recorded", which is
-- NOT the claim "not received" — the register has no knowledge of what a vendor
-- submitted before it existed. Four V0718 quarters closed before this table did.
create table if not exists public.cpl_contract_reports (
  id           uuid primary key default gen_random_uuid(),
  contract_id  uuid not null references public.cpl_contracts(id) on delete cascade,
  period_label text not null,
  period_start date,
  period_end   date,
  status       text not null default 'received'
               check (status in ('requested','received','waived','not_applicable')),
  received_on  date,
  source       text check (source in ('invoice','check-in','report','email','other')),
  summary      text,
  recorded_by  text,
  recorded_at  timestamptz not null default now(),
  unique (contract_id, period_label)
);

create table if not exists public.cpl_contract_documents (
  id           uuid primary key default gen_random_uuid(),
  contract_id  uuid not null references public.cpl_contracts(id) on delete cascade,
  kind         text not null default 'agreement'
               check (kind in ('agreement','amendment','report','invoice','other')),
  filename     text not null,
  storage_path text not null unique,
  mime         text,
  bytes        bigint,
  pages        int,
  doc_date     date,
  label        text,
  period_label text,
  uploaded_by  text,
  uploaded_at  timestamptz not null default now()
);
create index if not exists cpl_contract_documents_contract_idx
  on public.cpl_contract_documents (contract_id, kind, uploaded_at desc);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.cpl_contracts             enable row level security;
alter table public.cpl_contract_deliverables enable row level security;
alter table public.cpl_contract_reports      enable row level security;
alter table public.cpl_contract_documents    enable row level security;

do $$
declare t text;
begin
  foreach t in array array['cpl_contracts','cpl_contract_deliverables',
                           'cpl_contract_reports','cpl_contract_documents']
  loop
    if not exists (select 1 from pg_policies
                   where schemaname='public' and tablename=t and policyname=t||'_read') then
      execute format('create policy %I on public.%I for select using (is_allowed_reviewer() or team_pass_ok())', t||'_read', t);
      execute format('create policy %I on public.%I for insert with check (is_allowed_reviewer() or team_pass_ok())', t||'_insert', t);
      execute format('create policy %I on public.%I for update using (is_allowed_reviewer() or team_pass_ok()) with check (is_allowed_reviewer() or team_pass_ok())', t||'_update', t);
      execute format('create policy %I on public.%I for delete using (is_allowed_reviewer())', t||'_delete', t);
    end if;
  end loop;
end $$;

-- ── private document bucket ───────────────────────────────────────────────────
-- NOT public. The factsheet-images precedent is public because it holds
-- decorative images; these carry signature blocks, direct phone numbers and
-- personal emails, and un-publishing an indexed URL is far harder than opening
-- access later. Reads go through short-lived signed URLs minted per click.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'contract-docs', 'contract-docs', false, 26214400,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "contract docs read"   on storage.objects;
drop policy if exists "contract docs write"  on storage.objects;
drop policy if exists "contract docs update" on storage.objects;

create policy "contract docs read" on storage.objects
  for select using (bucket_id = 'contract-docs' and is_allowed_reviewer());
create policy "contract docs write" on storage.objects
  for insert with check (bucket_id = 'contract-docs' and is_allowed_reviewer());
create policy "contract docs update" on storage.objects
  for update using (bucket_id = 'contract-docs' and is_allowed_reviewer())
  with check (bucket_id = 'contract-docs' and is_allowed_reviewer());

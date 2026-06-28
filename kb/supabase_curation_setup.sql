-- ============================================================================
-- CPL KB curation backend — discipline-only MVP
-- Project: "Work Plan" (hvuwhnbuahrtptokpqfh.supabase.co)
-- Run this once in the Supabase SQL Editor.
--
-- Model: git-versioned kb/coci_*.json stays the source of truth. This captures
-- human curation edits (e.g. assigning a discipline where blank). A sync script
-- (kb/_apply_curation.py) folds these into kb/coci_curation.json in git.
--
-- Security: the dashboard is PUBLIC. Anyone may READ the overlay; only
-- authenticated users whose email is in allowed_reviewers may WRITE, and only
-- as themselves. The service-role key (sync script only) bypasses RLS.
-- ============================================================================

-- 1) Named curators ---------------------------------------------------------
create table if not exists public.allowed_reviewers (
  email     text primary key,
  added_at  timestamptz not null default now()
);

-- EDIT: add a row per reviewer. Seeded with the project mailbox; the CPL
-- Initiative leads were added 2026-06-28 (Session 82) so they can curate the CCR /
-- RACI / TMC / Fact Sheet surfaces themselves (is_allowed_reviewer() gates every
-- write; match is case-insensitive on the magic-link email).
insert into public.allowed_reviewers (email) values
  ('map@rccd.edu'),         -- project mailbox
  ('slee@cccco.edu'),       -- Samuel Lee — Senior Advisor to the Chancellor for CPL
  ('crystal.nasio@rccd.edu'),  -- Crystal Nasio — Executive Advisor, Operations & CPL Engagement
  ('terence.nelson@rccd.edu'), -- Terence Nelson — Executive Director, Pathways & Partnerships
  ('calvin.gloria@rccd.edu')   -- Calvin Gloria — Manager, Training & Military CPL
on conflict (email) do nothing;

-- 2) Curation edits (one row per course_id + field; saves upsert) -----------
create table if not exists public.kb_curation (
  course_id      text not null,
  field          text not null default 'discipline',
  value          text,
  reviewer_email text not null,
  reviewed_at    timestamptz not null default now(),
  primary key (course_id, field)
);

-- 3) Helper: is the current authenticated user an allowed reviewer? ---------
-- SECURITY DEFINER so it can read allowed_reviewers even though that table's
-- RLS denies direct client access.
create or replace function public.is_allowed_reviewer()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.allowed_reviewers
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- 4) Row-Level Security -----------------------------------------------------
alter table public.kb_curation       enable row level security;
alter table public.allowed_reviewers enable row level security;
-- (allowed_reviewers: RLS on + no policies = no client access; manage it here
--  in the SQL Editor or via the service-role key. is_allowed_reviewer() reads
--  it via SECURITY DEFINER.)

-- Anyone (incl. anonymous) may READ the curation overlay.
drop policy if exists kb_curation_read on public.kb_curation;
create policy kb_curation_read on public.kb_curation
  for select using (true);

-- Allowed reviewers may INSERT, only as themselves.
drop policy if exists kb_curation_insert on public.kb_curation;
create policy kb_curation_insert on public.kb_curation
  for insert to authenticated
  with check (
    public.is_allowed_reviewer()
    and lower(reviewer_email) = lower(auth.jwt() ->> 'email')
  );

-- Allowed reviewers may UPDATE existing rows, keeping reviewer = self.
drop policy if exists kb_curation_update on public.kb_curation;
create policy kb_curation_update on public.kb_curation
  for update to authenticated
  using (public.is_allowed_reviewer())
  with check (
    public.is_allowed_reviewer()
    and lower(reviewer_email) = lower(auth.jwt() ->> 'email')
  );

-- Allowed reviewers may DELETE rows (Session 70 — powers the CCR Pending-merges
-- panel's Undo). Same trust as UPDATE: a reviewer can already neutralize any row
-- by overwriting its value, so deleting their pending merge_into row is no
-- broader a capability. Reviewer-gated; anon stays read-only.
drop policy if exists kb_curation_delete on public.kb_curation;
create policy kb_curation_delete on public.kb_curation
  for delete to authenticated
  using (public.is_allowed_reviewer());

-- Done. Verify: select * from public.allowed_reviewers;

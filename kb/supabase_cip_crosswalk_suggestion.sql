-- cip_crosswalk_suggestion — faculty-in-the-field suggestions on the TOP↔CIP
-- crosswalk, for the Chancellor's Office to curate during the fall-2026 TOP→CIP
-- transition (ESS 26-06). Written by the CIP Crosswalk tab (cip_crosswalk.js).
--
-- Project: "Work Plan" (hvuwhnbuahrtptokpqfh.supabase.co) — same DB as
-- cpl_adoption_interest and the gate functions this migration reuses.
--
-- Pattern (mirrors kb/supabase_adoption_interest.sql): submissions are OPEN —
-- anon INSERT-only, no public SELECT — so any faculty member can suggest without
-- a login; contact info is never publicly readable. The CO reads the queue behind
-- the existing reviewer/team-phrase gate (is_allowed_reviewer() OR team_pass_ok(),
-- both already deployed via raci/supabase_raci.sql + kb/supabase_curation_setup.sql).
-- Rows are immutable to the public (no UPDATE/DELETE policy); a status-transition
-- RPC can be added later, like sierra_feedback_set_status().

create table if not exists public.cip_crosswalk_suggestion (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  suggestion_type  text not null
                     check (suggestion_type in
                       ('add-mapping','flag-mapping','better-cip','note','question')),
  top_code         text check (char_length(top_code) <= 20),
  top_title        text check (char_length(top_title) <= 200),
  cip_code         text check (char_length(cip_code) <= 20),
  cip_title        text check (char_length(cip_title) <= 200),
  suggestion       text not null check (char_length(suggestion) between 1 and 8000),
  submitter_name   text check (char_length(submitter_name) <= 120),
  submitter_email  text not null
                     check (position('@' in submitter_email) > 1
                            and char_length(submitter_email) <= 200),
  college          text check (char_length(college) <= 120),
  status           text not null default 'new'
                     check (status in ('new','reviewed','accepted','declined'))
);

alter table public.cip_crosswalk_suggestion enable row level security;

-- Anyone (anon or signed-in) may file a suggestion; they can only mint 'new'.
drop policy if exists "anon files a CIP crosswalk suggestion" on public.cip_crosswalk_suggestion;
create policy "anon files a CIP crosswalk suggestion"
  on public.cip_crosswalk_suggestion for insert
  to anon, authenticated
  with check (status = 'new');

-- Only reviewers (magic-link) or team-phrase holders read the curation queue.
drop policy if exists "team reads the CIP crosswalk queue" on public.cip_crosswalk_suggestion;
create policy "team reads the CIP crosswalk queue"
  on public.cip_crosswalk_suggestion for select
  to anon, authenticated
  using (is_allowed_reviewer() or team_pass_ok());

-- (no UPDATE / DELETE policy: rows are immutable to the public.)

create index if not exists cip_crosswalk_suggestion_created_idx
  on public.cip_crosswalk_suggestion (created_at desc);

-- cpl_adoption_interest — the ⚡ Quick Adopt intake queue (CPL Pathways tab).
--
-- v1 of Sam's "Quick Adopt" (2026-07-10): a college user viewing a pathway's
-- ⊕ adoption-option panel clicks ⚡ Quick Adopt and records an adoption
-- request — which credential→course precedent they want to adopt, who they
-- are, and where. The CPL team works the queue (contact → curriculum office →
-- MAP articulation). The button re-points at the MAP platform's own
-- authenticated adoption flow when the Exhibit Module exposes one.
--
-- RLS shape = the cpl_reflections pattern (public write-only) + the
-- sierra_feedback read gate:
--   * anon INSERT only, with CHECK bounds — the public can file a request;
--   * NO public SELECT — contact name/email must never be publicly readable
--     with the anon key;
--   * SELECT gated is_allowed_reviewer() OR team_pass_ok() — the team lane;
--   * status transitions reviewer/team-gated via UPDATE policy on status-only
--     columns is deferred to the lane build; v1 keeps rows immutable to the
--     public after insert (no anon UPDATE/DELETE).
--
-- Applied 2026-07-10 via MCP migration `cpl_adoption_interest_intake`.

create table if not exists public.cpl_adoption_interest (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  -- what they want to adopt (stamped by the tab from the pathway context)
  program_id     text not null check (char_length(program_id) between 1 and 120),
  program_label  text check (char_length(program_label) <= 200),
  course_code    text check (char_length(course_code) <= 40),
  course_title   text not null check (char_length(course_title) between 1 and 200),
  credentials    text not null check (char_length(credentials) between 1 and 600),
  precedent      text check (char_length(precedent) <= 1200),
  -- who is asking (self-declared; the team confirms before anything moves)
  adopter_college text not null check (char_length(adopter_college) between 2 and 120),
  contact_name   text check (char_length(contact_name) <= 120),
  contact_email  text not null check (position('@' in contact_email) > 1 and char_length(contact_email) <= 200),
  note           text check (char_length(note) <= 2000),
  -- team triage
  status         text not null default 'new' check (status in ('new','contacted','in-progress','adopted','declined'))
);

alter table public.cpl_adoption_interest enable row level security;

-- Public: write-only intake.
create policy "anon can file an adoption request"
  on public.cpl_adoption_interest for insert
  to anon, authenticated
  with check (status = 'new');

-- Team: read the queue (reviewer allowlist or the shared team phrase).
create policy "team reads the adoption queue"
  on public.cpl_adoption_interest for select
  to anon, authenticated
  using (is_allowed_reviewer() or team_pass_ok());

-- No public UPDATE/DELETE policies: rows are immutable to the public after
-- insert; triage transitions come later with the lane build (RPC, like
-- sierra_feedback_set_status).

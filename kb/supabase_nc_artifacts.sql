-- supabase_nc_artifacts.sql — the ARTIFACT layer and the INTEGRATION ledger
-- behind the Noncredit & Learning Partners tab. Extends the notes write layer
-- in kb/supabase_nc_partner_notes.sql (#985/#987/#988).
--
-- Requirement (Sam, 2026-08-06): "I want the page to be able to refresh based on
-- whatever notes are added along the way... we might want to attach artifacts as
-- well as notes and have you analyze and integrate through the refresh process."
--
-- ── Why artifacts are LINKS, not uploaded bytes ───────────────────────────
-- The obvious design is a Storage bucket (the repo already has one pattern:
-- fact-sheet/supabase_factsheet_images.sql). It was measured and rejected:
--
--   * A Claude session CANNOT read back what a browser uploads to Storage. The
--     sandbox cannot reach *.supabase.co (CLAUDE.md Rule 9c), the Supabase MCP
--     exposes no storage tool, and the public object URL returned 403 through
--     the agent proxy when tested 2026-08-06.
--   * So an uploaded artifact would land exactly one inch beyond the reach of
--     the thing that is supposed to analyze it — the worst possible outcome for
--     "attach it and have you analyze it."
--   * Corroborating evidence: the factsheet-images bucket shipped 2026-06-28
--     and holds 0 objects. It has never been used once.
--
-- A LINK, by contrast, is readable today: the team's Google Drive is reachable
-- from a session via the Drive MCP (verified 2026-08-06 by reading
-- "Apprenticeship CPL.docx" end to end), and public URLs are fetchable directly.
-- A link also avoids duplicating the file, imposes no size cap, leaves the
-- artifact where the team already keeps it, and asks a newcomer to paste a URL
-- rather than manage an upload. Sam confirmed the two real homes: Google Drive
-- and public web pages.
--
-- ── Doctrine carried over from the notes layer ────────────────────────────
--   1. "Answering never closes, just revises."  Nothing is ever deleted. A
--      corrected artifact SUPERSEDES its predecessor; the predecessor is kept.
--      There is no DELETE policy on any table here.
--   2. Artifacts and notes sit ALONGSIDE the curated register, never rewriting
--      it in place. kb/nc_learning_partners.json stays version-controlled and
--      reviewable. Evidence earns its way in through an INTEGRATION RUN, which
--      is a reviewable git commit — not a silent database write.
--   3. Provenance is a field (docs/kb-notes/methodology-provenance-is-a-field).
--      Who attached it and when travels with the artifact, always.
--
-- ⚠ SCOPE BOUNDARY (unchanged). "Integrated into the KB" means the TRACKER's
-- lanes — kb/nc_learning_partners.json and docs/kb-notes/. It does NOT mean the
-- public cpl-knowledge-base repo, which changes ONLY through its own CURATION.md
-- human-reviewed draft PR. Nothing here may write there.
--
-- Keyed by ITEM ID (Q-1 / OPP-3 / M2 / UC-7) so one affordance covers questions,
-- opportunities, modes and use cases — same shape as nc_partner_notes.

-- ── Artifacts ──────────────────────────────────────────────────────────────
create table if not exists public.nc_artifacts (
  id            uuid primary key default gen_random_uuid(),
  item_id       text        not null,        -- 'Q-1' | 'OPP-3' | 'M2' | 'UC-7'
  url           text        not null,
  title         text        not null,
  -- Which reader a session should use. 'drive' -> Drive MCP; 'web' -> fetch.
  source        text        not null default 'web',
  -- What the attacher believes it contains / why it matters. This is the human
  -- steer that makes analysis targeted instead of a summarize-everything pass.
  why           text,
  added_by      text,                        -- display name; provenance is a field
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Never delete: a corrected link supersedes the one it replaces.
  supersedes    uuid        references public.nc_artifacts(id),
  superseded_by uuid        references public.nc_artifacts(id),
  -- Integration state. Set by an integration run once a session has READ the
  -- artifact; drives the tab's "N awaiting integration" backlog counter.
  integrated_at timestamptz,
  integrated_by text,
  constraint nc_artifacts_source_ck  check (source in ('drive', 'web')),
  constraint nc_artifacts_url_ck     check (url ~ '^https?://' and char_length(url) between 8 and 2000),
  constraint nc_artifacts_title_ck   check (char_length(title) between 1 and 300),
  constraint nc_artifacts_why_ck     check (why is null or char_length(why) <= 4000),
  constraint nc_artifacts_item_ck    check (char_length(item_id) between 1 and 40)
);

create index if not exists nc_artifacts_item_idx
  on public.nc_artifacts (item_id, created_at desc);
-- The tab renders only live artifacts; superseded rows stay for history.
create index if not exists nc_artifacts_live_idx
  on public.nc_artifacts (item_id) where superseded_by is null;
-- The backlog query: live and not yet analyzed.
create index if not exists nc_artifacts_pending_idx
  on public.nc_artifacts (created_at) where superseded_by is null and integrated_at is null;

-- ── Notes: integration state + artifact provenance ────────────────────────
-- A note is the unit of INSIGHT whether a human wrote it or a session derived it
-- from an artifact. So analysis does not get its own storage shape: it writes a
-- NOTE that cites the artifact it came from. That keeps one rendering path, one
-- revision semantic, and one promotion path for every insight on the page.
alter table public.nc_partner_notes
  add column if not exists artifact_id   uuid references public.nc_artifacts(id),
  add column if not exists integrated_at timestamptz,
  add column if not exists integrated_by text;

create index if not exists nc_partner_notes_pending_idx
  on public.nc_partner_notes (created_at) where superseded_by is null and integrated_at is null;

-- ── Integration runs ───────────────────────────────────────────────────────
-- A governance artifact must measure itself
-- (docs/kb-notes/methodology-a-governance-artifact-must-measure-itself): the
-- contact-refresh cadence was decided in June and had never run once, and the
-- only reason anyone found out is that the register rendered the fact. Same
-- protection here. The tab reads this table to render "last integration: <when>,
-- by <who>" — so a refresh loop that quietly stops running says so on screen
-- instead of looking healthy while the backlog grows.
create table if not exists public.nc_integration_runs (
  id                 uuid primary key default gen_random_uuid(),
  ran_at             timestamptz not null default now(),
  ran_by             text        not null,   -- e.g. 'SkyLoop (Session 123)'
  notes_integrated   int         not null default 0,
  artifacts_analyzed int         not null default 0,
  -- What the run APPLIED on its own authority (routine), and what it RAISED for
  -- a human (interpretive). Sam's ruling 2026-08-06: apply routine, propose
  -- interpretive. Both halves are recorded so the split stays auditable.
  applied            text,
  proposed           text,
  commit_sha         text,
  pr_url             text,
  constraint nc_integration_runs_by_ck check (char_length(ran_by) between 1 and 120)
);

create index if not exists nc_integration_runs_recent_idx
  on public.nc_integration_runs (ran_at desc);

-- ── RLS ────────────────────────────────────────────────────────────────────
-- Identical posture to nc_partner_notes: the tab is private, artifacts point at
-- internal working documents, so there is no blanket anon read. The team phrase
-- that unlocks Team & RACI, or a signed-in reviewer.
alter table public.nc_artifacts          enable row level security;
alter table public.nc_integration_runs   enable row level security;

drop policy if exists nc_artifacts_read on public.nc_artifacts;
create policy nc_artifacts_read on public.nc_artifacts for select
  using (public.team_pass_ok() or public.is_allowed_reviewer());

drop policy if exists nc_artifacts_insert on public.nc_artifacts;
create policy nc_artifacts_insert on public.nc_artifacts for insert
  with check (public.team_pass_ok() or public.is_allowed_reviewer());

-- Updates exist to set superseded_by / integrated_at — not to rewrite history.
drop policy if exists nc_artifacts_update on public.nc_artifacts;
create policy nc_artifacts_update on public.nc_artifacts for update
  using (public.team_pass_ok() or public.is_allowed_reviewer())
  with check (public.team_pass_ok() or public.is_allowed_reviewer());

drop policy if exists nc_integration_runs_read on public.nc_integration_runs;
create policy nc_integration_runs_read on public.nc_integration_runs for select
  using (public.team_pass_ok() or public.is_allowed_reviewer());

drop policy if exists nc_integration_runs_insert on public.nc_integration_runs;
create policy nc_integration_runs_insert on public.nc_integration_runs for insert
  with check (public.team_pass_ok() or public.is_allowed_reviewer());

-- No delete policy on either table: superseded, never removed.

-- ── updated_at ─────────────────────────────────────────────────────────────
create or replace function public.nc_artifacts_touch() returns trigger
  language plpgsql set search_path = public as $$
  begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists nc_artifacts_touch_trg on public.nc_artifacts;
create trigger nc_artifacts_touch_trg before update on public.nc_artifacts
  for each row execute function public.nc_artifacts_touch();

-- ── Revise helper ──────────────────────────────────────────────────────────
-- Mirrors nc_partner_note_revise: one round trip that cannot leave a half-linked
-- pair. Correcting a bad link keeps the bad one visible in history.
create or replace function public.nc_artifact_revise(
  p_item_id text, p_url text, p_title text, p_source text,
  p_why text default null, p_added_by text default null, p_supersedes uuid default null
) returns uuid
  language plpgsql security invoker set search_path = public as $$
  declare new_id uuid;
  begin
    insert into public.nc_artifacts (item_id, url, title, source, why, added_by, supersedes)
      values (p_item_id, p_url, p_title, coalesce(p_source, 'web'), p_why, p_added_by, p_supersedes)
      returning id into new_id;
    if p_supersedes is not null then
      update public.nc_artifacts
         set superseded_by = new_id
       where id = p_supersedes and superseded_by is null;
    end if;
    return new_id;
  end;
$$;
grant execute on function public.nc_artifact_revise(text, text, text, text, text, text, uuid)
  to anon, authenticated;

-- ── Backlog view ───────────────────────────────────────────────────────────
-- One round trip for the tab's "N awaiting integration" counter and its
-- last-run line, so the Refresh button stays a single cheap read.
create or replace view public.nc_integration_backlog
  with (security_invoker = true) as
select
  (select count(*) from public.nc_partner_notes
     where superseded_by is null and integrated_at is null)  as notes_pending,
  (select count(*) from public.nc_artifacts
     where superseded_by is null and integrated_at is null)  as artifacts_pending,
  (select max(ran_at) from public.nc_integration_runs)       as last_run_at,
  (select ran_by from public.nc_integration_runs
     order by ran_at desc limit 1)                           as last_run_by;

grant select on public.nc_integration_backlog to anon, authenticated;
-- Table-level grants let anon/authenticated REACH the tables; RLS above decides
-- which rows they see. No delete grant anywhere — superseded, never removed.
grant select, insert, update on public.nc_artifacts        to anon, authenticated;
grant select, insert         on public.nc_integration_runs to anon, authenticated;

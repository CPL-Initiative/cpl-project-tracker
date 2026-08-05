-- supabase_nc_partner_notes.sql — the write layer behind the Noncredit &
-- Learning Partners tab (#985/#987).
--
-- Requirement (Sam, 2026-08-05): "On items where I want to provide new insight
-- or information (needs Input), can you build in a way for me to add it there?"
-- plus two rulings that shape the schema:
--
--   1. "Answering never closes, just revises."  A note is never deleted and an
--      item is never closed by being answered. A revision SUPERSEDES its
--      predecessor (superseded_by), so the history of how the thinking changed
--      stays readable. This is the same reason the thinking doc keeps its open
--      questions in §12 rather than in someone's memory.
--
--   2. Notes sit ALONGSIDE the curated register, never rewriting it in place.
--      kb/nc_learning_partners.json stays version-controlled and reviewable;
--      notes overlay it at render time. A note earns its way into the register
--      through PROMOTION (promoted_at / promoted_to), which is a deliberate
--      commit — the kb_curation overlay pattern, and the same shape as the
--      vault -> public-KB curation pipeline.
--
-- ⚠ SCOPE BOUNDARY. "Ends up in the KB" means the TRACKER's knowledge lanes —
-- kb/nc_learning_partners.json (the register) and docs/kb-notes/ (which sync to
-- Sam's Obsidian vault + CPLBrain). It does NOT mean the public
-- cpl-knowledge-base repo: that changes ONLY through its own CURATION.md
-- pipeline behind a human-reviewed draft PR, and nothing here may write to it.
-- Promoting a note that far is a separate, deliberate, human-gated step.
--
-- Keyed by ITEM ID (Q-1 / OPP-3 / M2 / UC-7) so one affordance covers questions,
-- opportunities, modes and use cases without a table per section.
--
-- Apply via the Supabase MCP (the sandbox cannot reach *.supabase.co directly —
-- CLAUDE.md Rule 9c). Recorded here for the audit trail.

-- ── Table ──────────────────────────────────────────────────────────────────
create table if not exists public.nc_partner_notes (
  id            uuid primary key default gen_random_uuid(),
  item_id       text        not null,        -- 'Q-1' | 'OPP-3' | 'M2' | 'UC-7'
  body          text        not null,
  author        text,                        -- display name; email stays out of the page
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- "answering never closes, just revises": a newer note points BACK at the one
  -- it replaces; the old row is retained, never deleted.
  supersedes    uuid        references public.nc_partner_notes(id),
  superseded_by uuid        references public.nc_partner_notes(id),
  -- promotion into the curated register / a KB note
  promoted_at   timestamptz,
  promoted_to   text,                        -- e.g. 'register:OPP-3.detail' or 'docs/kb-notes/<file>.md'
  constraint nc_partner_notes_body_len check (char_length(body) between 1 and 8000),
  constraint nc_partner_notes_item_len check (char_length(item_id) between 1 and 40)
);

create index if not exists nc_partner_notes_item_idx
  on public.nc_partner_notes (item_id, created_at desc);
-- The tab renders only live notes; superseded rows stay for history.
create index if not exists nc_partner_notes_live_idx
  on public.nc_partner_notes (item_id) where superseded_by is null;

-- ── RLS ────────────────────────────────────────────────────────────────────
-- The tab is PRIVATE for now, and notes carry internal thinking, so there is no
-- blanket anon read: the same team phrase that unlocks Team & RACI, or a
-- signed-in reviewer. Mirrors gr_content's posture.
alter table public.nc_partner_notes enable row level security;

drop policy if exists nc_partner_notes_read on public.nc_partner_notes;
create policy nc_partner_notes_read on public.nc_partner_notes for select
  using (public.team_pass_ok() or public.is_allowed_reviewer());

drop policy if exists nc_partner_notes_insert on public.nc_partner_notes;
create policy nc_partner_notes_insert on public.nc_partner_notes for insert
  with check (public.team_pass_ok() or public.is_allowed_reviewer());

-- Updates exist to set superseded_by / promoted_at — not to rewrite history.
drop policy if exists nc_partner_notes_update on public.nc_partner_notes;
create policy nc_partner_notes_update on public.nc_partner_notes for update
  using (public.team_pass_ok() or public.is_allowed_reviewer())
  with check (public.team_pass_ok() or public.is_allowed_reviewer());

-- No delete policy at all: notes are superseded, never removed.

-- ── updated_at ─────────────────────────────────────────────────────────────
create or replace function public.nc_partner_notes_touch() returns trigger
  language plpgsql as $$
  begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists nc_partner_notes_touch_trg on public.nc_partner_notes;
create trigger nc_partner_notes_touch_trg before update on public.nc_partner_notes
  for each row execute function public.nc_partner_notes_touch();

-- ── Revise helper ──────────────────────────────────────────────────────────
-- One round trip, and it cannot leave a half-linked pair: insert the new note,
-- point it at its predecessor, and mark the predecessor superseded.
create or replace function public.nc_partner_note_revise(
  p_item_id text, p_body text, p_author text, p_supersedes uuid default null
) returns uuid
  language plpgsql security invoker set search_path = public as $$
  declare new_id uuid;
  begin
    insert into public.nc_partner_notes (item_id, body, author, supersedes)
      values (p_item_id, p_body, p_author, p_supersedes)
      returning id into new_id;
    if p_supersedes is not null then
      update public.nc_partner_notes
         set superseded_by = new_id
       where id = p_supersedes and superseded_by is null;
    end if;
    return new_id;
  end;
$$;
grant execute on function public.nc_partner_note_revise(text, text, text, uuid) to anon, authenticated;

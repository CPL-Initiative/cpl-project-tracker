-- ═══════════════════════════════════════════════════════════════════════════
-- Sierra guidance layer — Phase 2 of docs/sierra_training_tab_scope.md
-- Session 94 (SkySierra), 2026-07-02 — applied live as migration
-- `sierra_guidance_layer`. This file is the schema of record (Rule: live DB
-- functions/tables need a committed schema —
-- docs/kb-notes/methodology-live-db-functions-need-committed-schema.md).
--
-- Short, team-authored response directives that the shared `cpl-chat` Edge
-- Function (v25+) appends to EVERY system prompt: the newest ACTIVE rows, under
-- a hard character cap — the "same-minute tuning knob without a redeploy".
-- ⚠ The caps here are stated in the CODE, not in this comment: GUIDANCE_MAX_RULES
-- / GUIDANCE_MAX_CHARS / GUIDANCE_MAX_CHARS_PER_RULE in the edge function, and
-- their mirrors in sierra_training.js. This header used to say "the newest 10
-- ACTIVE rows, under a ~2,500-char hard cap" and BOTH numbers were stale — the
-- char cap moved to 9,000 on 2026-08-12 and the row cap to 20 on 2026-08-21.
-- A number restated in prose is a number that goes wrong quietly.
-- Rows are split by `kind` (see the column below): directives and display rules
-- get separate caps and separate prompt blocks.
-- The committed rules inside index.ts (STATEWIDE / CREDIT /
-- OFFERINGS / LANDING-PAGE / AUDIENCE) remain the stable spine; guidance rows
-- layer on top, and the block header the function builds tells the model the
-- team guidance wins on conflict.
--
-- ⚠ Guidance rows steer the PRODUCTION map.rccd.edu widget too — that is the
-- point, but it makes the write gate the security boundary:
--   • SELECT / INSERT / UPDATE gated `is_allowed_reviewer() OR team_pass_ok()`
--     (the Team & RACI magic-link / shared-team-phrase gate).
--   • NO DELETE policy — deactivate (`active = false`) instead; the table is
--     its own audit trail (per the scope doc: "no hard deletes").
--   • NEVER widen any policy to bare anon: a guidance row is prompt text.
-- The Edge Function reads with the service-role key (bypasses RLS), so the
-- gated SELECT only scopes the Training tab's read.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.sierra_guidance (
  id uuid primary key default gen_random_uuid(),
  rule text not null
    -- 1500, NOT 500. THERE ARE THREE LENGTH LIMITS AND THEY MUST ALL AGREE:
    -- this constraint, GUIDANCE_RULE_MAX in sierra_training.js, and
    -- GUIDANCE_MAX_CHARS_PER_RULE in chatbox/supabase/functions/cpl-chat/index.ts.
    -- On 2026-08-12 the tab and the edge function were raised 500 -> 1500 and
    -- THIS WAS MISSED, which did not restore the feature — it converted a silent
    -- truncation into a hard save failure. A 501–1500 char rule was accepted by
    -- the textarea, counted by the live counter, and then rejected by Postgres.
    -- Raised 2026-08-14 (session 154) after Sam's adopter-names instruction —
    -- 676 chars — could not be saved. Raising any one of the three alone just
    -- relocates the failure; change all three together.
    constraint sierra_guidance_rule_len check (char_length(rule) between 3 and 1500),
  active boolean not null default true,
  -- KIND — 'directive' (prose the team writes) vs 'display' (structured output
  -- shape: table columns, labels, row order). Added 2026-08-21.
  --
  -- WHY A COLUMN AND NOT A SECOND TABLE: Sam's judgment-in-tables ADR
  -- (docs/kb-notes/adr-judgment-in-tables-mechanism-in-code.md) says move
  -- instructional VARIABLES into curatable tables. A display rule is the same
  -- kind of object as a directive — team-authored text appended to the system
  -- prompt, gated the same way, audited the same way — so a second table would
  -- duplicate the schema, the RLS and the read for no gain. One table, one read,
  -- split on a column.
  --
  -- WHY IT MATTERS: the two kinds compete for a ROW budget they should not share.
  -- The edge function sends the newest N active DIRECTIVES; a display rule is
  -- long, structured and standing, so letting it occupy a directive slot evicts
  -- the oldest prose rule (silently, and oldest-first means the naming rule).
  -- The function gives each kind its own cap and its own block.
  --
  -- DEFAULT 'directive' IS LOAD-BEARING: every one of the 13 existing rows is
  -- prose, and a migration must not change what Sierra is told. Backfilling any
  -- row to 'display' is a curator decision, made in the Training tab.
  kind text not null default 'directive'
    constraint sierra_guidance_kind_ck check (kind in ('directive', 'display')),
  -- WHICH CALLER this rule applies to. NULL = every surface, which is what all 13
  -- existing rows are, so adding this column changed no behavior by itself.
  --
  -- WHY IT EXISTS: a rule can name a fact only one surface carries. Row 15ec666b
  -- says "when using Sierra from the My College COBI tab, confine your answers to
  -- the selected institution" and shipped to ALL SIX callers, where its opening
  -- condition is unevaluable — the public page, the Fact Sheet drawer,
  -- map.rccd.edu, the college landing pages, the vendor iframe, and cpl_memory.js,
  -- which is not a conversation at all: it borrows the model to DRAFT a row.
  --
  -- ⚠ NULL IS THE DEFAULT AND MUST STAY SO. The function reads
  -- `surface is null or surface = <this one>`; an `= <this one>` would drop every
  -- unscoped rule — i.e. everything the team has ever written — silently.
  --
  -- ⚠ CONSTRAINED ON PURPOSE: a typo'd surface scopes a rule to NOTHING, and a
  -- rule that reaches no surface is invisible and unfalsifiable. This list must
  -- stay equal to KNOWN_SURFACES in the edge function; tests/sierra_surface.test.js
  -- pins them, because drift lets a curator scope a rule to a surface no caller
  -- ever sends.
  --
  -- Vocabulary is the CALLER — not the audience (`audience`) and not the contacts
  -- gate (`ctx`). Three separate axes, which is why this is a column and not a
  -- `mode` enum that would bundle them and then need exceptions.
  surface text
    constraint sierra_guidance_surface_ck check (surface is null or surface in (
      'my-college',      -- the My College tab's embedded assistant
      'cobi-assistant',  -- the dedicated CPL Assistant tab in COBI
      'public',          -- the standalone sierra/ page (incl. the ctx=external embed)
      'fact-sheet',      -- the Fact Sheet drawer
      'memory-autogen',  -- cpl_memory.js drafting a memory row: not a conversation
      'memory-briefing'  -- cpl_memory.js reading the memory rows back: also not one
    )),
  note text                                   -- why the rule exists (optional)
    constraint sierra_guidance_note_len check (note is null or char_length(note) <= 300),
  created_by text
    constraint sierra_guidance_created_by_len check (created_by is null or char_length(created_by) <= 120),
  created_at timestamptz not null default now(),
  updated_by text
    constraint sierra_guidance_updated_by_len check (updated_by is null or char_length(updated_by) <= 120),
  updated_at timestamptz not null default now()
);

alter table public.sierra_guidance enable row level security;

-- Team-gated read (the Training tab lists rules; the public reads nothing).
drop policy if exists sierra_guidance_team_select on public.sierra_guidance;
create policy sierra_guidance_team_select on public.sierra_guidance
  for select to anon, authenticated
  using (public.is_allowed_reviewer() or public.team_pass_ok());

-- Team-gated writes. INSERT adds a rule; UPDATE toggles active / edits text.
-- No DELETE policy on purpose — deactivation preserves the audit trail.
drop policy if exists sierra_guidance_team_insert on public.sierra_guidance;
create policy sierra_guidance_team_insert on public.sierra_guidance
  for insert to anon, authenticated
  with check (public.is_allowed_reviewer() or public.team_pass_ok());

drop policy if exists sierra_guidance_team_update on public.sierra_guidance;
create policy sierra_guidance_team_update on public.sierra_guidance
  for update to anon, authenticated
  using (public.is_allowed_reviewer() or public.team_pass_ok())
  with check (public.is_allowed_reviewer() or public.team_pass_ok());

-- Keep created_at/created_by immutable + stamp updated_at on every update.
create or replace function public.sierra_guidance_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.created_at := old.created_at;
  new.created_by := old.created_by;
  return new;
end $$;

drop trigger if exists sierra_guidance_touch on public.sierra_guidance;
create trigger sierra_guidance_touch
  before update on public.sierra_guidance
  for each row execute function public.sierra_guidance_touch();

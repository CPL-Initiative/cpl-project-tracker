-- cpl_memory — the unified cross-repo memory table: notable facts, observations,
-- pitfalls, opportunities, wishlist items, and timeline entries (milestone / event
-- / change) worth one canonical, queryable home with a "still true?" status.
--
-- Design: docs/kb-notes/adr-unified-memory-table.md
-- Obsidian-visible mirror (the digest): docs/memory/cpl_memory.md
--
-- Project: "Work Plan" (hvuwhnbuahrtptokpqfh.supabase.co) — the same DB as
-- kb_curation, cpl_adoption_interest, cip_crosswalk_suggestion, and the gate
-- functions is_allowed_reviewer() / team_pass_ok() this migration reuses.
--
-- ==================== APPLIED — Phase 1 (2026-07-24) ====================
-- LIVE on the "Work Plan" project via migrations: create_cpl_memory ·
-- cpl_memory_add_slug_question_slugrefs · cpl_memory_harden_function_search_path.
-- Seeded with 40 rows (receipt: kb/cpl_memory_seed.json) + a genesis audit log.
-- This file is the SCHEMA-OF-RECORD — keep it in sync with the live DDL on every
-- change (methodology-live-db-functions-need-committed-schema).
-- ========================================================================
--
-- SECURITY / PRIVACY POSTURE (Sam raised these explicitly):
--   * This table is INTERNAL working memory. It is NEVER anon/public-readable —
--     unlike the *_suggestion / *_interest intake tables, there is NO anon policy
--     here. Read is gated to the team; write is gated to reviewers.
--   * Hard content rule: NO secrets, tokens, API keys, or PII / unpublished
--     sensitive personal data in any row. Candid internal observations are fine
--     (this is the private vault layer), but nothing that would harm if the vault
--     leaked. If an entry is candid enough to warrant it, tighten read to
--     is_allowed_reviewer() only (see the SELECT policy note).
--   * This table syncs to Sam's Obsidian vault + the CPLBrain repo (no review
--     gate) but MUST NEVER be promoted to the public cpl-knowledge-base except
--     through the human-gated curation pipeline — same boundary as /checkpoint.

create table if not exists public.cpl_memory (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique,                             -- human handle (e.g. 'pr4','q1') for citation ("which rule led to this?") + related refs; sessions auto-generate
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- kind: 8, in four families. Domains (security/privacy/org-access/
  -- integration/…) are TAGS, not kinds — see the ADR. Provisional knowledge is a
  -- 'fact' with status='proposed'; 'event' folds into 'milestone'; 'change' → 'decision'.
  kind          text not null check (kind in
                  ('fact','pitfall',                          -- knowledge (what's true / to avoid)
                   'opportunity','risk','wishlist','question',-- direction (upside / downside / want / open fork awaiting a call → resolves to a decision)
                   'decision','milestone',                    -- timeline (what we set / what we reached)
                   'procedure')),                             -- operational (a ripple checklist: change X → also update Y,Z,W)

  title         text check (char_length(title) <= 120),                          -- short 3-6 word label shown bold above the prose in the Report view; optional (added 2026-07-25)
  summary       text not null check (char_length(summary) between 1 and 400),   -- col 1: plain-language, one sentence (curator + AI surface)
  detail        text check (char_length(detail) <= 4000),                       -- col 2: why it matters + the trigger ("read before X")
  plain         text check (char_length(plain) <= 2000),                         -- reader/briefing text for the 📄 Report view; NULL falls back to summary(+detail). Add an example where the summary is obtuse. (added 2026-07-25)

  org             text not null default 'cpl'             -- the owning COBI AREA (primary home) — scalability past CPL; extend the check as COBI adds areas
                    check (org in ('cpl','ci','cip','gr','shared')),
  share_across_orgs boolean not null default true,         -- DEFAULT SHARED: every area's team sees it. false = private to `org` (e.g. a sensitive GR item). Records intent now; ENFORCED once per-area RLS lands (risk r2).
  scope         text check (char_length(scope) <= 120),   -- the surface WITHIN the org: repo / tab / file / 'cross-cutting'
  tags          text[] not null default '{}',             -- topical facets incl. security | privacy | org-access | integration | history | fact-sheet | …
  source        text check (char_length(source) <= 500),  -- link/path to the KB note / PR / file holding the full record

  -- the change-impact / ripple layer (Sam's COBI pain: "update all related
  -- fields in various tabs and report engines when I make a change"):
  affects       text[] not null default '{}',             -- surfaces this entry ripples to (files/tabs/report engines) — REVERSE-queryable
  related       text[] not null default '{}',             -- slugs of related rows (an entry ↔ its 'procedure'; a 'question' ↔ the 'decision' it becomes)

  status        text not null default 'proposed'
                  check (status in ('proposed','verified','stale','superseded')),
  confidence    text check (confidence in ('low','medium','high')),
  visibility    text not null default 'internal'
                  check (visibility in ('internal','public')),  -- the PUBLIC boundary (orthogonal to share_across_orgs); 'public' NEVER auto — curation-gated only
  event_date    date,                                     -- for milestone / event / change: when it happened

  author        text not null default 'unknown',          -- col 3: user log — who wrote/last-touched it
  verified_at   timestamptz,                              -- the verification loop stamps this
  verified_by   text,
  superseded_by text                                       -- slug of the superseding entry (the 'Revise' = clone + supersede flow; supersede, don't destroy)
);

-- keep updated_at honest
create or replace function public.cpl_memory_touch_updated_at()
returns trigger language plpgsql
set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists cpl_memory_touch on public.cpl_memory;
create trigger cpl_memory_touch
  before update on public.cpl_memory
  for each row execute function public.cpl_memory_touch_updated_at();

alter table public.cpl_memory enable row level security;

-- READ — team only (reviewers via magic-link OR team-phrase holders). NO anon.
-- NOTE: if entries get candid, tighten this to `is_allowed_reviewer()` alone.
-- FUTURE per-area gate (when the COBI org layer gets real isolation — risk r2):
--   using (is_allowed_reviewer() or (team_pass_ok() and (share_across_orgs or org = current_org())))
-- i.e. default-shared rows stay team-wide; share_across_orgs=false rows fall to their own area.
drop policy if exists "team reads cpl_memory" on public.cpl_memory;
create policy "team reads cpl_memory"
  on public.cpl_memory for select
  to anon, authenticated
  using (is_allowed_reviewer() or team_pass_ok());

-- INSERT — team may capture; only 'proposed' or 'verified' can be minted directly.
drop policy if exists "team writes cpl_memory" on public.cpl_memory;
create policy "team writes cpl_memory"
  on public.cpl_memory for insert
  to anon, authenticated
  with check ((is_allowed_reviewer() or team_pass_ok())
              and status in ('proposed','verified')
              and visibility <> 'public');

-- UPDATE — reviewers only (the verification/curation loop). 'public' stays out of RLS reach.
drop policy if exists "reviewer curates cpl_memory" on public.cpl_memory;
create policy "reviewer curates cpl_memory"
  on public.cpl_memory for update
  to anon, authenticated
  using (is_allowed_reviewer())
  with check (is_allowed_reviewer() and visibility <> 'public');

-- DELETE — reviewers only (prefer status='superseded' over hard delete for history).
drop policy if exists "reviewer deletes cpl_memory" on public.cpl_memory;
create policy "reviewer deletes cpl_memory"
  on public.cpl_memory for delete
  to anon, authenticated
  using (is_allowed_reviewer());

create index if not exists cpl_memory_org_idx      on public.cpl_memory (org);   -- per-COBI-area filtering + future per-area RLS
create index if not exists cpl_memory_kind_idx     on public.cpl_memory (kind);
create index if not exists cpl_memory_status_idx   on public.cpl_memory (status);
create index if not exists cpl_memory_updated_idx  on public.cpl_memory (updated_at desc);
create index if not exists cpl_memory_tags_gin     on public.cpl_memory using gin (tags);
create index if not exists cpl_memory_affects_gin  on public.cpl_memory using gin (affects);  -- "what touches annual_report.js?"
create index if not exists cpl_memory_related_gin  on public.cpl_memory using gin (related);

-- ─────────────────────────────────────────────────────────────────────────────
-- cpl_memory_log — append-only audit trail. AUTO-WRITE is the default (sessions
-- update memory every handoff WITHOUT approval — same no-review-gate posture as
-- checkpoints/kb-notes). This log is what makes that safe + curatable: every
-- create/update/verify/supersede is recorded with actor + before/after, so Sam can
-- drop in and spot any recurring blip or divergence, and answer "which rule led to
-- this action?" from a row's history + the sessions that cited it.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.cpl_memory_log (
  id         uuid primary key default gen_random_uuid(),
  memory_id  uuid references public.cpl_memory(id) on delete set null,
  at         timestamptz not null default now(),
  actor      text not null default 'unknown',   -- session moniker (e.g. 'SkyKnow-s118') or curator email
  action     text not null check (action in ('create','update','verify','stale','supersede','delete')),
  note       text,
  before     jsonb,
  after      jsonb
);
alter table public.cpl_memory_log enable row level security;
-- READ — team only (same gate as cpl_memory).
drop policy if exists "team reads cpl_memory_log" on public.cpl_memory_log;
create policy "team reads cpl_memory_log"
  on public.cpl_memory_log for select
  to anon, authenticated
  using (is_allowed_reviewer() or team_pass_ok());
-- WRITE — reviewers via the curate pane; sessions write via the Supabase MCP
-- (service role, bypasses RLS). No anon insert. Append-only (no update/delete policy).
drop policy if exists "reviewer writes cpl_memory_log" on public.cpl_memory_log;
create policy "reviewer writes cpl_memory_log"
  on public.cpl_memory_log for insert
  to anon, authenticated
  with check (is_allowed_reviewer());
create index if not exists cpl_memory_log_mem_idx on public.cpl_memory_log (memory_id, at desc);

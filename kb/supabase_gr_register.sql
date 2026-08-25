-- supabase_gr_register.sql — the GR REGISTER: priority AREAS → REVISIONS →
-- ARTIFACTS. Applied to the "Work Plan" project (hvuwhnbuahrtptokpqfh) via MCP
-- migrations `gr_register_areas_revisions_artifacts` and
-- `gr_revisions_citations_backfill` (2026-08-18). Recorded here for the audit
-- trail; no content lives in this file.
--
-- WHY (Sam, 2026-08-18): the GR tab is being shown to CO General Counsel as a
-- possible instrument for ALL their policy and regulation reviews. It was a
-- single hardcoded document — one jsonb blob in gr_content, one topic (CPL
-- Title 5 §55050), read-only. A document scales to one topic; a register scales
-- to every priority area, and everything asked for becomes a column.
--
-- gr_content is deliberately LEFT IN PLACE as the rollback copy of the original
-- CPL briefing. The migration COPIED its 16 priorities into gr_revisions; it
-- deleted nothing.
--
-- ── GATE POSTURE (unchanged from gr_content) ────────────────────────────────
-- READ  : public.gr_pass_ok() or public.is_allowed_reviewer()
--         gr_pass_ok() is COHORT-SPECIFIC — it accepts ONLY the 'gr' secret, so
--         the ci/team phrases held by CO teams cannot read it.
-- WRITE : public.is_allowed_reviewer() ONLY. A shared phrase is a bearer
--         credential with no identity: it cannot be revoked per person and it
--         cannot say who changed a row. Anyone holding the read phrase must not
--         be able to rewrite another division's entries.
--
-- ✅ PHRASE SCOPE FIXED 2026-08-19 (migration team_pass_check_exclude_gr_cohort).
-- team_pass_check() used to match ANY secret in team_access, so the GR phrase
-- also opened every shared team tab — 83 policies across 42 tables — none of
-- which the GR site's own tab needs (measured: docs/phrase_scope_analysis.md).
-- It now excludes the 'gr' cohort:
--     where id <> 'gr' and secret = p
-- Verified before and after: exactly ONE bit changed — gr stopped opening the
-- shared tables. 'team', 'ci' and 'fin' are bit-for-bit unchanged, which is what
-- avoids the Finance lockout a naive per-site fix causes. Finance's own
-- over-reach (36 of the 42) is NOT addressed and stays parked; it genuinely
-- shares 6 tables and needs the harder split.
-- Rollback is one statement — see the migration body.

create table if not exists public.gr_areas (
  id text primary key, title text not null, division text, summary text,
  narrative jsonb not null default '{}'::jsonb,
  status text not null default 'active', sort integer,
  created_by text, created_at timestamptz not null default now(),
  updated_by text, updated_at timestamptz not null default now()
);

create table if not exists public.gr_revisions (
  id uuid primary key default gen_random_uuid(),
  area_id text not null references public.gr_areas(id) on delete cascade,
  n integer, title text not null, grp text, summary text, consideration text,
  instrument text,
  pathway text[] not null default '{}',     -- g=guidance y=title5 r=ed code
  citations text[] not null default '{}',   -- canonical 'T5 §55050' / 'EC §76004' / 'GC §11342.2'
  citations_derived boolean not null default false,
  ed_first text, status text not null default 'proposed',
  created_by text, created_at timestamptz not null default now(),
  updated_by text, updated_at timestamptz not null default now()
);
create index if not exists gr_revisions_area_idx on public.gr_revisions(area_id, n);

create table if not exists public.gr_artifacts (
  id uuid primary key default gen_random_uuid(),
  area_id text references public.gr_areas(id) on delete set null,
  revision_id uuid references public.gr_revisions(id) on delete set null,
  title text not null, url text, kind text, source text, doc_date date,
  division text,                            -- CO division tag
  why text,                                 -- the human "why it matters"; nothing is auto-analysed
  citations text[] not null default '{}',
  citations_derived boolean not null default false,
  added_by text, created_at timestamptz not null default now(),
  superseded_by uuid references public.gr_artifacts(id) on delete set null
);
create index if not exists gr_artifacts_area_idx on public.gr_artifacts(area_id);

-- ── CITATIONS ARE DATA, NOT PROSE ───────────────────────────────────────────
-- This is the load-bearing change. A "Title 5 / Ed. Code section" filter cannot
-- exist while §55050 lives only inside a sentence. The CPL area's citations were
-- machine-extracted from prose at migration and flagged `citations_derived` —
-- an extracted citation shown to a lawyer as curated fact is a credibility
-- failure, so the UI marks those until a human edits the row.
--
-- ⚠️ Code assignment is by EXPLICIT range, never "everything else". §11342.2 is
-- GOVERNMENT Code (the APA definition of "regulation"); a 5xxxx→Title 5 /
-- else→Ed. Code rule would have filed it under Ed. Code. Anything outside the
-- known ranges is left OUT rather than guessed.
create or replace function public.gr_citation_code(sec text) returns text
  language sql immutable as $$
  select case
    when sec ~ '^5[58][0-9]{3}(\.[0-9]+)?$' then 'T5'
    -- 78/79 added 2026-08-25: Ed. Code Part 48 (Community Colleges, Education
    -- Programs) runs 78015-79520, and SB 135 added ARTICLE 9, Credit for Prior
    -- Learning Initiative, at 78093-78093.2. MUST MATCH CITE_BANDS in
    -- gr_priorities.js character for character. 8xxxx stays refused: Gov. Code
    -- Title 9 occupies 81000-91014, so a bare 88790 (the CPL TBL) is ambiguous
    -- and has to be written out.
    when sec ~ '^(66|70|76|78|79)[0-9]{3}(\.[0-9]+)?$' then 'EC'
    when sec ~ '^11[0-9]{3}(\.[0-9]+)?$' then 'GC'
    else null end;
$$;

alter table public.gr_areas     enable row level security;
alter table public.gr_revisions enable row level security;
alter table public.gr_artifacts enable row level security;

drop policy if exists gr_areas_read on public.gr_areas;
create policy gr_areas_read on public.gr_areas for select
  using (public.gr_pass_ok() or public.is_allowed_reviewer());
drop policy if exists gr_revisions_read on public.gr_revisions;
create policy gr_revisions_read on public.gr_revisions for select
  using (public.gr_pass_ok() or public.is_allowed_reviewer());
drop policy if exists gr_artifacts_read on public.gr_artifacts;
create policy gr_artifacts_read on public.gr_artifacts for select
  using (public.gr_pass_ok() or public.is_allowed_reviewer());

drop policy if exists gr_areas_write on public.gr_areas;
create policy gr_areas_write on public.gr_areas for all
  using (public.is_allowed_reviewer()) with check (public.is_allowed_reviewer());
drop policy if exists gr_revisions_write on public.gr_revisions;
create policy gr_revisions_write on public.gr_revisions for all
  using (public.is_allowed_reviewer()) with check (public.is_allowed_reviewer());
drop policy if exists gr_artifacts_write on public.gr_artifacts;
create policy gr_artifacts_write on public.gr_artifacts for all
  using (public.is_allowed_reviewer()) with check (public.is_allowed_reviewer());

-- ── VERIFICATION PASS (2026-08-19) ─────────────────────────────────────────
-- A caveat is a disclosure, not a fix. The CPL area's caveat records that its
-- quoted statutory text was never checked against primary sources; a permanent
-- blanket disclaimer is indistinguishable from an unmaintained one, so these
-- turn it into a work queue the tab reports progress against ("N of M
-- verified"), letting the caveat retire on evidence rather than on say-so.
alter table public.gr_revisions add column if not exists verified_at   timestamptz;
alter table public.gr_revisions add column if not exists verified_by   text;
alter table public.gr_revisions add column if not exists verified_note text;
-- Verifying is also the ONLY event that may clear citations_derived: that flag
-- means "a machine picked this code", and a human confirming the citation
-- against the source is exactly what stops making it true.

-- ── HISTORY + SENSITIVITY (2026-08-19) ─────────────────────────────────────
-- See migration gr_register_history_and_sensitivity. gr_history is written ONLY
-- by an after-update/delete trigger and has NO write policy, so a reviewer
-- cannot edit or erase the audit trail from the browser. `sensitivity` defaults
-- to 'restricted' on revisions and artifacts, and gr_open_sections exposes only
-- (area, division, citation, status) for rows explicitly marked 'open'.
-- ⚠️ That view carries `security_invoker = on`. A Postgres view runs with the
-- DEFINER's rights by default, which would bypass RLS on the underlying tables
-- and hand out precisely what the column exists to protect.

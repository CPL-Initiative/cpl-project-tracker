-- ============================================================================
-- CPL News aggregation backend — schema of record.
-- Project: hvuwhnbuahrtptokpqfh ("Work Plan"). APPLIED 2026-06-21 via the
-- Supabase MCP (migration create_cpl_news_tables); this file is the committed
-- copy (mirrors kb/supabase_curation_setup.sql / tmc/supabase_tmc_submissions.sql).
--
--   cpl_news          — analyzed, deduped items. Inserted ONCE per url by the
--                       cpl-news-harvest Edge Function (service role). Public
--                       READ; reviewers may curate (feature / hide / note).
--   cpl_news_requests — "suggest a story" inbox (anyone may INSERT). The path
--                       closed socials (FB/IG/LinkedIn/X) enter — a human pastes
--                       a URL, the next harvest reads its OpenGraph preview.
--
-- No student PII — public news metadata, so public READ is intentional. Reuses
-- is_allowed_reviewer() + allowed_reviewers from kb/supabase_curation_setup.sql.
-- ============================================================================

create table if not exists public.cpl_news (
  id             bigint generated always as identity primary key,
  url            text not null unique,
  title          text not null,
  title_key      text,
  source         text,
  source_type    text,                      -- news | official | social | budget | manual
  publisher      text,
  published_at   timestamptz,
  summary        text,
  scope          text,                      -- ca | national | other (CA-first ordering)
  topics         jsonb default '[]'::jsonb,
  related_system text,
  relevance      numeric,
  cpl_related    boolean default true,
  image_url      text,
  raw_snippet    text,
  model          text,
  analyzed_at    timestamptz,
  featured       boolean default false,
  hidden         boolean default false,
  curator_note   text,
  curated_by     text,
  curated_at     timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists cpl_news_published_idx on public.cpl_news (published_at desc nulls last);
create index if not exists cpl_news_scope_idx     on public.cpl_news (scope);
create index if not exists cpl_news_relevance_idx on public.cpl_news (relevance desc nulls last);
create index if not exists cpl_news_titlekey_idx  on public.cpl_news (title_key);

create table if not exists public.cpl_news_requests (
  id            bigint generated always as identity primary key,
  url           text not null check (char_length(url) between 4 and 2000),
  note          text check (note is null or char_length(note) <= 2000),
  source_hint   text,
  submitted_by  text,
  status        text not null default 'pending',  -- pending | done | rejected
  processed_at  timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists cpl_news_requests_status_idx on public.cpl_news_requests (status, created_at);

alter table public.cpl_news          enable row level security;
alter table public.cpl_news_requests enable row level security;

drop policy if exists cpl_news_read on public.cpl_news;
create policy cpl_news_read on public.cpl_news for select using (true);

drop policy if exists cpl_news_curate on public.cpl_news;
create policy cpl_news_curate on public.cpl_news
  for update to authenticated
  using (public.is_allowed_reviewer())
  with check (public.is_allowed_reviewer());

drop policy if exists cpl_news_requests_insert on public.cpl_news_requests;
create policy cpl_news_requests_insert on public.cpl_news_requests
  for insert to anon, authenticated with check (true);

drop policy if exists cpl_news_requests_read on public.cpl_news_requests;
create policy cpl_news_requests_read on public.cpl_news_requests for select using (true);

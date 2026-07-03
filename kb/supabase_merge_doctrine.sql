-- merge_doctrine_notes — the CCR mind-meld capture store (added 2026-07-03,
-- CCR Convergence kickoff). One row per reasoning note Sam (or any allowed
-- reviewer) records in the Suggested-merges worklist's 🧠 Mind-meld panel:
-- the doctrine question being answered, the free transcript (voice-dictated
-- or typed), the stance taken, and a snapshot of the group it was recorded
-- against. Sessions distill these into kb/merge_doctrine.md at checkpoints
-- (service-role read), then the doctrine drives the batch merge/mint passes.
--
-- Applied live via the Supabase MCP on 2026-07-03. Schema of record.
--
-- RLS: reviewer-gated INSERT/UPDATE (is_allowed_reviewer() — same boundary
-- as kb_curation writes; the CCR tab is magic-link only, so no team-phrase
-- widening here yet), reviewer/team-phrase SELECT (a future review pane).
-- NO DELETE policy — the notes table is its own audit trail; a mistaken
-- note gets superseded, not erased.

create table if not exists public.merge_doctrine_notes (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  created_by  text,
  group_sig   text,                 -- live-member signature ("id1|id2|…")
  lane        text,                 -- anchored|singleton|family|desc|title|evidence
  question_id text,                 -- kb/doctrine_questions.json id (Q-…)
  stance      text,                 -- merge_all|merge_partial|package|mint|keep|unsure|commentary
  transcript  text not null check (char_length(transcript) between 1 and 8000),
  members     jsonb,                -- compact snapshot [{id,t,u,d},…]
  page        text default 'ccr-worklist',
  distilled_at timestamptz          -- stamped when a checkpoint folds it into the doctrine
);

alter table public.merge_doctrine_notes enable row level security;

create policy mdn_select on public.merge_doctrine_notes
  for select using (public.is_allowed_reviewer() or public.team_pass_ok());

create policy mdn_insert on public.merge_doctrine_notes
  for insert with check (public.is_allowed_reviewer());

create policy mdn_update on public.merge_doctrine_notes
  for update using (public.is_allowed_reviewer())
  with check (public.is_allowed_reviewer());

-- no delete policy: audit trail.

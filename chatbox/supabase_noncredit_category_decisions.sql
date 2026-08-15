-- noncredit_category_decisions — which of the CO's ten noncredit categories a
-- program is, once someone has decided.
--
-- WHY THIS EXISTS
-- ---------------
-- Sam, 2026-08-15: "confirmed category should persist on supabase."
--
-- Everything else the CIP tab records — a revised CIP, a CTE/Non-CTE pick on an
-- "Either" code — lives in localStorage, and that is fine for those: they are a
-- college's working draft of a code it will type into COCI itself.
--
-- This one is different, and the difference is money. Under the CO's mapping,
-- Short-Term Vocational takes 32.0111 plus a secondary credit CIP, and where that
-- secondary is a CTE course the noncredit program is CTE — and CTE noncredit
-- qualifies for funding that non-CTE does not. A determination with a funding
-- consequence cannot live in one person's browser cache, where the next person to
-- open the tab sees nothing and has no idea a decision was ever made.
--
-- ── TWO LAYERS, AND THIS IS THE CURATED ONE ──────────────────────────────────
-- Same shape as map_contact_proposals overlaying the MAP Users worklist:
--
--   localStorage  = the college's own working draft. Unchanged, still there.
--   this table    = a CONFIRMED determination, attributed, visible to everyone.
--
-- The tab reads both and shows the confirmed layer chipped with who and when. A
-- draft is never silently promoted; confirming is an explicit act.
--
-- ⚠ THE OPEN QUESTION THIS SCHEMA DELIBERATELY ANSWERS CONSERVATIVELY.
-- The CIP tab is a public faculty-facing reference with no login, so the college
-- that owns a program cannot authenticate to write its own row. Writes are
-- therefore team-phrase gated: the MAP team records the determination, the same
-- way it records contact proposals. That is narrower than "let colleges self-serve",
-- and it is the recoverable direction — widening a gate later is a policy change,
-- while un-writing anonymous rows about other people's funding is not. If colleges
-- should write directly, that needs an auth story the tab does not have yet, and
-- it should be decided before this widens.
--
-- ⚠ THIS TABLE NEVER DECIDES CTE. It records the CATEGORY a human confirmed.
-- CTE follows from the category plus the secondary credit CIP's own certified
-- designation, computed at read time from kb/noncredit_cip_categories.json. A
-- stored cte column would be a second source of truth that silently goes stale
-- the moment the CO's designations change — and it would invite writing CTE
-- without a category, which is the inversion the whole workstream is guarding
-- against (a CTE secondary CIP does NOT prove a program is Short-Term Vocational).
--
-- ⚠ CATEGORY IDS ARE VALIDATED AGAINST THE GENERATED FILE, NOT FREE TEXT. The
-- check constraint lists the ten ids emitted by kb/_build_noncredit_cip_categories.py.
-- If the CO publishes an eleventh, this constraint is the thing that must change
-- first — deliberately, so a new category cannot arrive by typo.

create table if not exists public.noncredit_category_decisions (
  -- Control numbers are unique PER COLLEGE, not globally, so the key is the pair.
  -- (cip_crosswalk.js has the same lesson in its progOpen key: college|ctrl.)
  college           text not null check (char_length(college) between 1 and 120),
  control_number    text not null check (control_number ~ '^[A-Za-z0-9._-]{1,24}$'),

  -- One of the ten ids in kb/noncredit_cip_categories.json. See the note above:
  -- this list changing is a deliberate act, not a side effect.
  category_id       text not null check (category_id in (
                      'esl', 'short_term_vocational', 'workforce_preparation',
                      'basic_skills', 'immigrant_education', 'health_and_safety',
                      'substantial_disabilities', 'parenting', 'home_economics',
                      'older_adults')),

  -- The primary noncredit CIP the category resolves to. Nullable because several
  -- categories offer more than one (Basic Skills offers seven) and the confirming
  -- curator may have settled the category before the code.
  primary_cip       text check (primary_cip is null or primary_cip ~ '^[0-9]{2}\.[0-9]{4}$'),

  -- Short-Term Vocational only: the secondary CREDIT CIP aligning with the subject.
  -- This is what carries the CTE answer. Left null for every other category, and a
  -- consumer must not infer CTE from its absence — absence means "not applicable
  -- here" or "not yet supplied", never "non-CTE".
  secondary_cip     text check (secondary_cip is null or secondary_cip ~ '^[0-9]{2}\.[0-9]{4}$'),

  -- Who and when, always. A determination with a funding consequence that cannot
  -- be attributed is one nobody can defend later.
  decided_by        text not null check (char_length(decided_by) between 1 and 120),
  decided_at        timestamptz not null default now(),
  note              text check (note is null or char_length(note) <= 1000),

  primary key (college, control_number)
);

comment on table public.noncredit_category_decisions is
  'Confirmed CO noncredit category per program. Team-phrase gated. CTE is COMPUTED from '
  'category + secondary_cip, never stored here. Source of the category vocabulary: '
  'kb/noncredit_cip_categories.json.';

alter table public.noncredit_category_decisions enable row level security;

-- READ IS PUBLIC. The determination is about a public program in a public catalog,
-- and the tab that displays it is public. Nothing here is personal data beyond the
-- curator's own name, which is the point of recording it.
drop policy if exists ncd_public_read on public.noncredit_category_decisions;
create policy ncd_public_read
  on public.noncredit_category_decisions for select
  using (true);

-- WRITES ARE TEAM-PHRASE GATED. team_pass_ok() is the shared-secret check used by
-- every other curator surface in this project.
drop policy if exists ncd_team_insert on public.noncredit_category_decisions;
create policy ncd_team_insert
  on public.noncredit_category_decisions for insert
  with check (public.team_pass_ok());

drop policy if exists ncd_team_update on public.noncredit_category_decisions;
create policy ncd_team_update
  on public.noncredit_category_decisions for update
  using (public.team_pass_ok())
  with check (public.team_pass_ok());

-- NO DELETE POLICY, deliberately — same call as governance_owners and
-- map_contact_proposals. Clearing a determination writes NULLs through the update
-- path so the row keeps its history; it does not vanish. ⚠ A consequence worth
-- knowing before it looks like a bug: an RLS-filtered write returns 200 with an
-- EMPTY body, not a 403. A client that treats "ok" as success will report a save
-- that touched no row. Check the returned row, keep the typed text on failure.

create index if not exists ncd_college_idx
  on public.noncredit_category_decisions (college);
create index if not exists ncd_category_idx
  on public.noncredit_category_decisions (category_id);

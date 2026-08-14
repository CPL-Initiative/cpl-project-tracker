-- sierra_rules — the built-in prompt rules, as data.
--
-- WHY THIS EXISTS (Sam, 2026-08-14, and the ADR it produced:
-- docs/kb-notes/adr-judgment-in-tables-mechanism-in-code.md)
--
-- Sam wrote a Sierra training instruction at 13:33 telling her to answer a
-- credential question by naming the colleges that had already articulated it.
-- He re-tested at 14:49 and got the old behaviour. The rule was active,
-- correctly authored, and well inside every budget.
--
-- Two things were wrong and BOTH WERE INVISIBLE TO HIM. The adopter names never
-- reached the prompt (#1178). And STATEWIDE_RULE — a hard-coded const saying
-- "never tell them to go to one specific college's page to access a statewide
-- credit" — was actively suppressing the answer he wanted. He could not see it,
-- could not edit it, and the prompt's promise that "the team guidance wins" is
-- A SENTENCE, NOT A MECHANISM: a specific prohibition earlier in the prompt beat
-- a general instruction appended later.
--
-- The team could see and edit sierra_guidance. The team could not see or edit
-- the ~10 rules that OUTRANK it. This table closes that.
--
-- ── THE OVERLAY RULE, WHICH IS LOAD-BEARING ──────────────────────────────────
-- This table OVERLAYS code defaults; it never replaces them. Every rule still
-- ships in index.ts. A failed read here costs the EDITS, never the GOVERNANCE —
-- Sierra ungoverned is far worse than Sierra un-tuned. Same shape as
-- FALLBACK_CONTACTS being a display-layer fallback, and the tab rule that a
-- failed read renders "unknown" at the top and never 0.
--
-- ── WHAT LIVES HERE vs WHAT STAYS IN CODE ────────────────────────────────────
-- Judgment in tables, mechanism in code. So:
--   * body        — the rule TEXT. Judgment. Curatable.
--   * sort_order  — precedence. Judgment, and the whole point: precedence has to
--                   be DATA, because as a sentence it did not hold.
--   * active      — whether it fires. Judgment, except for the protected set.
--   * applies_when— a KEY into a code-side predicate map, NOT a boolean
--                   expression. A curator picks from a known set of contexts;
--                   they never write logic into data. Flattening these to
--                   always-on would bloat every prompt and fire rules out of
--                   context, so the conditions are modelled, not dropped.
--
-- ── THE PROTECTED SET IS ENFORCED IN CODE, NOT HERE ──────────────────────────
-- Sam, 2026-08-14, choosing "yes, except a protected safety set": a few rules
-- are load-bearing for student safety — never invent a college/course/
-- articulation, the k-anonymity and student-count floors, the no-personal-info
-- guards. For those keys index.ts ALWAYS ships the code body and IGNORES
-- active=false; a table body can only ADD to them. That guarantee cannot live
-- in a table, because the table is the thing being guarded.
--
-- ── GATING (Sam, 2026-08-14) ─────────────────────────────────────────────────
-- Reviewer magic-link ONLY, for read and for write — deliberately stricter than
-- sierra_guidance, which the team phrase opens. These are the rules that OUTRANK
-- team guidance: if one phrase could edit both the guidance and the rules that
-- govern it, the precedence layer would stop being a safety boundary and become
-- two editable piles. (He was offered a team-read/reviewer-write split and did
-- not take it; granting team SELECT later is a one-policy change if the
-- visibility argument wins out.)
--
-- cpl-chat reads with the SERVICE key, so RLS never gates Sierra herself.

create table if not exists public.sierra_rules (
  key           text primary key,
  title         text not null,
  body          text not null,
  applies_when  text not null default 'always',
  sort_order    integer not null default 100,
  active        boolean not null default true,
  -- Optional link to the cpl_memory row that JUSTIFIES this rule. The why is
  -- written once, in memory; the instruction lives where it executes. This is
  -- what lets the two-lane view report "decided in memory, no Sierra rule
  -- implements it" — the failure that recurred three documented times.
  memory_slug   text,
  updated_by    text,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now(),

  constraint sierra_rules_body_len   check (char_length(body) between 3 and 8000),
  constraint sierra_rules_title_len  check (char_length(title) between 3 and 120),
  constraint sierra_rules_key_shape  check (key ~ '^[a-z][a-z0-9_]{1,48}$'),
  -- The allowed contexts. Kept as a CHECK rather than a lookup table so an
  -- unknown value cannot be saved and then silently never fire: index.ts maps
  -- each of these to a predicate, and a value here with no predicate there is a
  -- rule that quietly does nothing.
  constraint sierra_rules_applies_when check (applies_when in (
    'always', 'credential', 'credential_or_volume', 'alignment', 'volume', 'credit'
  ))
);

comment on table public.sierra_rules is
  'Overlay for cpl-chat built-in prompt rules. Code holds the defaults and the '
  'protected set; this table holds curator judgment (text, order, active). A '
  'failed read costs edits, never governance.';

alter table public.sierra_rules enable row level security;

-- Reviewer-only, read and write (Sam, 2026-08-14).
drop policy if exists sierra_rules_reviewer_select on public.sierra_rules;
create policy sierra_rules_reviewer_select on public.sierra_rules
  for select using (public.is_allowed_reviewer());

drop policy if exists sierra_rules_reviewer_insert on public.sierra_rules;
create policy sierra_rules_reviewer_insert on public.sierra_rules
  for insert with check (public.is_allowed_reviewer());

drop policy if exists sierra_rules_reviewer_update on public.sierra_rules;
create policy sierra_rules_reviewer_update on public.sierra_rules
  for update using (public.is_allowed_reviewer())
              with check (public.is_allowed_reviewer());

-- NO delete policy — same posture as sierra_guidance and governance_owners.
-- Deactivate with active=false; the row and its audit trail stay. (For a
-- protected key, active=false is ignored by index.ts by design.)

-- ── Audit trail ──────────────────────────────────────────────────────────────
-- A table edit reaches the public with no PR, no CI and no deploy. For
-- sierra_guidance that is the entire point; for the rules that GOVERN a public
-- bot it also means a bad edit reaches students with nothing in between. The
-- ADR's minimum is an audit trail and a revert, and this is both: every version
-- of every rule is kept, so reverting is a re-insert of an earlier body.
create table if not exists public.sierra_rules_log (
  id         uuid primary key default gen_random_uuid(),
  key        text not null,
  at         timestamptz not null default now(),
  actor      text,
  action     text not null check (action in ('create', 'update', 'activate', 'deactivate')),
  before     jsonb,
  after      jsonb
);

create index if not exists sierra_rules_log_key_at on public.sierra_rules_log (key, at desc);

alter table public.sierra_rules_log enable row level security;

drop policy if exists sierra_rules_log_reviewer_select on public.sierra_rules_log;
create policy sierra_rules_log_reviewer_select on public.sierra_rules_log
  for select using (public.is_allowed_reviewer());

drop policy if exists sierra_rules_log_reviewer_insert on public.sierra_rules_log;
create policy sierra_rules_log_reviewer_insert on public.sierra_rules_log
  for insert with check (public.is_allowed_reviewer());

-- Record every change automatically, so the trail cannot depend on a caller
-- remembering to write it.
create or replace function public.sierra_rules_audit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.sierra_rules_log (key, actor, action, before, after)
    values (new.key, new.updated_by, 'create', null, to_jsonb(new));
    return new;
  end if;
  insert into public.sierra_rules_log (key, actor, action, before, after)
  values (
    new.key, new.updated_by,
    case when new.active is distinct from old.active
         then (case when new.active then 'activate' else 'deactivate' end)
         else 'update' end,
    to_jsonb(old), to_jsonb(new)
  );
  return new;
end $$;

drop trigger if exists sierra_rules_audit_trg on public.sierra_rules;
create trigger sierra_rules_audit_trg
  after insert or update on public.sierra_rules
  for each row execute function public.sierra_rules_audit();

-- ── Seeding ──────────────────────────────────────────────────────────────────
-- DELIBERATELY EMPTY. The table starts with no rows, which means every rule
-- comes from the code default — i.e. seeding is a no-op change in behaviour and
-- the overlay is proven by construction on day one. Rows appear only when a
-- curator actually changes something, so `select * from sierra_rules` reads as
-- "what we have deliberately altered", not as a second copy of index.ts that can
-- drift from it. Pre-seeding all ten would create exactly the duplicate-source
-- problem the ADR's fourth test warns about.

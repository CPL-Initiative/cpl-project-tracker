-- S310 (SkyTandem) memory receipt, staged 2026-10-01: run in ONE execute_sql call.
--
-- State when staged (read at 16:45Z): the seven rows authored SkyTandem-s310 are
-- WRITTEN and UNLOGGED (cpl_memory_log holds no entry for any of them), and the
-- round-1 milestone was superseded without a log entry. Two write calls carrying
-- this SQL timed out at 60s with nothing applied, while reads answered at once.
-- The repo guard returns allow for it (checked locally), cpl_memory carries only
-- the updated_at touch trigger, and pg_stat_activity showed nothing waiting, so
-- the wait sat upstream of the database. Run it when Sam can confirm the call.
--
-- Every statement is idempotent (not-exists guards), so a second run adds nothing.
-- It (1) backfills the seven create entries as late, (2) logs the supersede as
-- late, (3) adds one pitfall row, proposed, with its create entry, (4) promotes
-- the topStrategy pitfall to verified, corroborated by merged PR 1798 and its
-- committed KB note, with a verify entry carrying the before-values, and (5)
-- reads the result: every SkyTandem-s310 row must show creates = 1.

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'SkyTandem-s310', 'create', 'checkpoint auto-write; late entry, logged after the S310 full checkpoint (the emergency checkpoint skipped the log)', to_jsonb(m)
from public.cpl_memory m
where m.author = 'SkyTandem-s310'
  and m.slug <> 'wording-change-grep-tests-for-retired-sentences-2026-10-01'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'SkyTandem-s310', 'supersede', 'late entry: superseded in S310 once Sam answered round 1; logged after the full checkpoint', to_jsonb(m)
from public.cpl_memory m
where m.slug = 'my-cpl-funding-language-mockup-round-1-2026-10-01'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'supersede');

insert into public.cpl_memory (slug, kind, org, title, summary, detail, plain, tags, source, related, status, author, event_date)
select x.slug, x.kind, 'cpl', x.title, x.summary, x.detail, x.plain, x.tags, x.source, '{}'::text[], x.status, 'SkyTandem-s310', date '2026-10-01'
from jsonb_to_recordset($json$[{"slug":"wording-change-grep-tests-for-retired-sentences-2026-10-01","kind":"pitfall","title":"Grep tests for retired wording","summary":"Before pushing a wording change, grep tests/ for a fragment of every sentence it retires. Twice the local run of the touched test files passed while CI's full shards failed on a test that pinned the old words: S308 (C9e, the Timeline size, shard 4) and S310 (cpl_funding_refresh_sources, shard 2). Each cost a CI cycle.","detail":"S310 (#1798) retired the My CPL Funding sentences; six tests pinned them and the local run covered five. A full local run of the funding suites takes about 50 minutes serially (S308), so the cheap check is the grep: one fixed-string search per retired sentence fragment across tests/, then run every file it names.","plain":"When we change the words on a page, some automated checks still expect the old words. Search the checks for each sentence you took out before sending the change, so they do not fail after it is sent. Example: renaming a label on the funding page broke a check that still looked for the old label.","tags":["testing","wording","ci","implementation-funding"],"source":"docs/cpl_funding_lessons.md (S308, S310); PR #1798","status":"proposed"}]$json$::jsonb)
  as x(slug text, kind text, title text, summary text, detail text, plain text, tags text[], source text, status text)
where not exists (select 1 from public.cpl_memory c where c.slug = x.slug);

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'SkyTandem-s310', 'create', 'checkpoint auto-write', to_jsonb(m)
from public.cpl_memory m
where m.slug = 'wording-change-grep-tests-for-retired-sentences-2026-10-01'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

update public.cpl_memory set status = 'verified', verified_at = now(),
  verified_by = 'S310 checkpoint: PR #1798 merged with its guard; KB note methodology-a-guard-that-supplies-its-own-input-tests-only-half'
where slug = 'do-this-next-implementation-step-never-rendered-2026-10-01' and status = 'proposed';

insert into public.cpl_memory_log (memory_id, actor, action, note, before, after)
select m.id, 'SkyTandem-s310', 'verify', 'corroborated: PR #1798 merged with its guard; KB note committed at the S310 checkpoint', '{"status":"proposed","verified_by":null}'::jsonb, to_jsonb(m)
from public.cpl_memory m
where m.slug = 'do-this-next-implementation-step-never-rendered-2026-10-01' and m.status = 'verified'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'verify');

select m.slug, m.status,
  count(l.id) filter (where l.action = 'create') as creates,
  count(l.id) filter (where l.action = 'verify') as verifies,
  count(l.id) filter (where l.action = 'supersede') as supersedes
from public.cpl_memory m left join public.cpl_memory_log l on l.memory_id = m.id
where m.author = 'SkyTandem-s310' group by m.slug, m.status order by m.slug;

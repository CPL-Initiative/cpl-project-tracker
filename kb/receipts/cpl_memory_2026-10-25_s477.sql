-- S477 SkyOwlsClover (opened by hand by Sam), 2026-10-25 ~13:05Z. Rule 8 ingest: INSERT-only for three new slugs,
-- author SkyOwlsClover-S477, logged; one guarded UPDATE of a session-sourced row (S476's), its before-value in the log.
-- Rollback: supersede the three slugs under actor 'SkyOwlsClover-S477-rollback'; restore the S476 row's summary from
-- the cpl_memory_log 'update' entry's before value.
-- STATUS: NOT YET APPLIED. The first apply (about 13:00Z) waited on a Supabase confirmation prompt that timed out
-- unanswered; whether any statement ran is unread. Read the four slugs back before re-running (each statement is
-- idempotent: ON CONFLICT DO NOTHING, NOT EXISTS, and the UPDATE is guarded on S476's summary text).

insert into public.cpl_memory (slug, kind, org, title, summary, plain, tags, affects, source, related, author, event_date, status)
values
('pitfall-supabase-stalls-not-cold-cache-2026-10-25', 'pitfall', 'cpl',
 'Slow Supabase calls on 2026-10-25 were stalls of 4 to 5 s, not a cold cache; a retry passes them (S477)',
 'cpl_funding_nc_counts() ran in 1.1 s or about 6 s, roughly half each over S477''s calls, with every row read from shared buffers. In one plan a seq scan of 116,815 cached rows took 4,066 ms and the next scan of the same table 59 ms. A rewrite cannot promise under 8 s (PostgREST''s limit) through such a stall, so the builder retries a 5xx (#2443).',
 'The database pauses for a few seconds now and then. A call that fails on a pause works on the second try.',
 array['supabase','postgrest','timeout','performance','funding','noncredit','pitfall']::text[],
 array['funding/_build_funding_performance.py','kb/supabase_cpl_funding_nc_counts.sql']::text[],
 'cpl-project-tracker#2445; EXPLAIN ANALYZE over the MCP, 2026-10-25 12:20Z',
 array['pitfall-postgrest-8s-ignores-function-timeout-2026-10-25']::text[], 'SkyOwlsClover-S477', '2026-10-25', 'proposed'),
('procedure-hand-opened-session-claims-with-draft-pr-2026-10-25', 'procedure', 'cpl',
 'A session Sam opens by hand inside the routine''s hours opens a draft PR in its first minutes (S477)',
 'A scheduled firing has no list_sessions and reads only open PRs updated in the last half hour. On 2026-10-25 the hand-opened S477 diagnosed for 40 minutes with no PR; the 12:14Z firing saw none and both shipped the same retry (#2443 merged, #2444 closed). docs/reference/scheduled_sessions.md, At the start, step 1.',
 'When Sam starts a session himself overnight, it opens a draft PR right away so the scheduled run can see it and step aside.',
 array['scheduled-sessions','governance-team-enablement','procedure']::text[],
 array['docs/reference/scheduled_sessions.md']::text[],
 'cpl-project-tracker#2445', array[]::text[], 'SkyOwlsClover-S477', '2026-10-25', 'proposed')
on conflict (slug) do nothing;

insert into public.cpl_memory (slug, kind, org, title, summary, plain, tags, affects, source, related, author, event_date, status, verified_by, verified_at)
values
('sam-supabase-no-constant-approvals-2026-10-25', 'decision', 'cpl',
 'Sam: sessions hold full Supabase permissions and should work without constant approvals (2026-10-25)',
 'Sam, about 12:20Z on 2026-10-25, in S477 while it diagnosed the noncredit RPC: "You have all the permissions in supabase to read, write, delete...hoping you can handle this without constant approvals". S477 read it as a go to run its Supabase reads, migrations and receipts without stopping to ask; it did not read it as reversing the hold list in CLAUDE.md (deleting data stays a hold) or Rule 10''s receipts.',
 'Sam does not want to be asked before each Supabase step.',
 array['supabase','governance-team-enablement','sam-ruling','decision']::text[],
 array['CLAUDE.md']::text[],
 'Sam, in session S477, 2026-10-25 ~12:20Z', array[]::text[], 'SkyOwlsClover-S477', '2026-10-25', 'verified', 'Sam (his words, in session)', now())
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'SkyOwlsClover-S477', 'create', 'S477 (2026-10-25)', to_jsonb(m) from public.cpl_memory m
where m.slug in ('pitfall-supabase-stalls-not-cold-cache-2026-10-25', 'procedure-hand-opened-session-claims-with-draft-pr-2026-10-25',
                 'sam-supabase-no-constant-approvals-2026-10-25')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

-- S476's row says "Warm 1.1 s, cold 6.1 s" and "the function's own 60 s": the 60 s was S477's test (reset 12:32Z) and the
-- slow calls were stalls with every row in shared buffers. Guarded on the summary as S476 wrote it.
insert into public.cpl_memory_log (memory_id, actor, action, note, before)
select m.id, 'SkyOwlsClover-S477', 'update', 'S477: the 60 s was a test, since reset; slow calls are stalls, not cold', to_jsonb(m)
from public.cpl_memory m
where m.slug = 'pitfall-postgrest-8s-ignores-function-timeout-2026-10-25' and m.summary like '%Warm 1.1 s, cold 6.1 s.%';
update public.cpl_memory
set summary = 'cpl_funding_nc_counts() returned HTTP 500 in the 2026-10-25 11:40Z daily run: "canceling statement due to statement timeout". The authenticator''s 8 s applies; a statement_timeout set on the function does not extend a running statement (S477 measured it with the function at 60 s, a test since reset). The RPC takes 1.1 s or about 6 s when the database stalls (pitfall-supabase-stalls-not-cold-cache-2026-10-25). The builder retries a 5xx (#2443).',
    related = array['nc-builder-counts-emitted-2026-10-25','pitfall-supabase-stalls-not-cold-cache-2026-10-25']::text[]
where slug = 'pitfall-postgrest-8s-ignores-function-timeout-2026-10-25' and summary like '%Warm 1.1 s, cold 6.1 s.%';

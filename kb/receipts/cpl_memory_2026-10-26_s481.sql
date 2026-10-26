-- S481 (SkyGoldfields), 2026-10-26. Two memory writes through supabase-migrate.yml, so neither waits on the
-- connector's confirmation prompt (Sam, 2026-10-25 in S477: "hoping you can handle this without constant approvals").
-- (1) The last statement of kb/receipts/cpl_memory_2026-10-25_s477.sql, unchanged: S476's row still read "Warm 1.1 s,
--     cold 6.1 s" at 00:58Z on 2026-10-26. Through execute_sql it waited on a person's confirmation in S477 and timed
--     out unanswered twice (handoff 478 item 2). Guarded on the summary as S476 wrote it, so a second run is a no-op.
-- (2) Rule 8 ingest: one proposed pitfall from S481's UI pass of the Fact Sheet (#2455).
-- Rollback: (1) restore summary and related from the cpl_memory_log row this run writes (action 'update', actor
--           SkyOwlsClover-S477, note naming S477, its `before` holds the whole row);
--           (2) delete the log row (actor SkyGoldfields-S481), then the memory row by slug.

-- (1) S477's guarded UPDATE.
insert into public.cpl_memory_log (memory_id, actor, action, note, before)
select m.id, 'SkyOwlsClover-S477', 'update', 'S477: the 60 s was a test, since reset; slow calls are stalls, not cold', to_jsonb(m)
from public.cpl_memory m
where m.slug = 'pitfall-postgrest-8s-ignores-function-timeout-2026-10-25' and m.summary like '%Warm 1.1 s, cold 6.1 s.%';
update public.cpl_memory
set summary = 'cpl_funding_nc_counts() returned HTTP 500 in the 2026-10-25 11:40Z daily run (statement timeout). PostgREST applies the authenticator''s 8 s; a statement_timeout on the function does not extend it (S477 measured it with a 60 s test setting, since reset). The RPC takes 1.1 s, or about 6 s when the database stalls. The builder retries a 5xx (#2443).',
    related = array['nc-builder-counts-emitted-2026-10-25','pitfall-supabase-stalls-not-cold-cache-2026-10-25']::text[]
where slug = 'pitfall-postgrest-8s-ignores-function-timeout-2026-10-25' and summary like '%Warm 1.1 s, cold 6.1 s.%';

-- (2) S481's pitfall.
insert into public.cpl_memory (slug, kind, org, title, summary, detail, plain, tags, affects, source, related, author, event_date, status)
values
('pitfall-a11y-sweep-reads-no-markup-unclosed-quote-2026-10-26', 'pitfall', 'cpl',
 'A clean accessibility sweep reads no markup: six Fact Sheet links had lost their labels to one unclosed quote (2026-10-26)',
 'npm run a11y passed the Fact Sheet clean at nine widths, light and dark, while six links read rel="noopener aria-label="...": the missing quote folds the label into rel, the browser drops it, and its words parse as junk attributes. tests/factsheet_a11y.test.js (h) now reads the source for an attribute value that swallows the next attribute; no other page in the repo had one (S481, #2455).',
 'Restoring the labels as written would have failed WCAG 2.5.3 (Label in Name): the face read "read full text", the label "Read the full text of...". Each link kept its words, and a clipped .sr-only span adds the context and "(opens in a new tab)", the form Sierra took for its arrow (tests/sierra_surfaces_aligned.test.js section 4). Contrast, target size and focus checks measure rendered boxes, so a UI pass also reads the HTML.',
 'A page can pass every automated check and still hide broken link labels; read the HTML too.',
 array['ui-pass','a11y','fact-sheet','pitfall']::text[],
 array['fact-sheet/index.html','tests/factsheet_a11y.test.js','docs/ui_pass_lessons.md']::text[],
 'S481 UI pass of the Fact Sheet, PR #2455', array[]::text[], 'SkyGoldfields-S481', '2026-10-26', 'proposed')
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'SkyGoldfields-S481', 'create', 'S481 (2026-10-26)', to_jsonb(m) from public.cpl_memory m
where m.slug = 'pitfall-a11y-sweep-reads-no-markup-unclosed-quote-2026-10-26'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

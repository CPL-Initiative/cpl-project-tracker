-- S321 (SkyCatalog), 2026-10-03: Rule 8 ingest - five new rows, all logged.
-- New (author 'SkyCatalog-s321'): the census reads 112 of 118 catalogs (milestone); six catalogs need a
-- person (fact); compare each full read row by row (procedure); cpl_memory's 400-character summary cap
-- (pitfall); the connector's confirmation matching words inside quoted text (pitfall).
-- The four rows whose text names no destructive SQL word ran through execute_sql in S321. The fifth
-- names them, so it waits on the connector's confirmation: run this file in the SQL editor. It is
-- idempotent: rows already written are skipped.
-- Rollback: supersede the five rows by author 'SkyCatalog-s321' under actor 'SkyCatalog-s321-rollback'.

insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status, verified_by, verified_at)
values
('census-reader-corrected-112-of-118-2026-10-03',
 'The census reads 112 of 118 college catalogs after four full reads (#1839)',
 'milestone',
 '#1839 (squash c238662, 2026-10-03): the census takes a college''s own catalog off a district page and refuses a sibling''s, probes catalog.<domain> after a failed homepage, refuses older-year, change-log and archive hops, and reads hidden menu text. Four full reads: 109 to 112 catalog addresses, 67 to 78 years, 61 to 71 at 2026-27, no college worse off.',
 'Runs 37137334059, 37139324090, 37140411314, 37141321117 (dry, four slices each). First apply on main: run 37142060932. Six colleges stay out of reach (see six-colleges-catalogs-need-a-person-2026-10-03). Lane: docs/reference/lanes/program-requirements-harvest.md; lessons 12-15 in docs/program_requirements_harvest_lessons.md.',
 'The weekly catalog reader now finds 112 of the 118 colleges'' catalogs.',
 array['program-requirements','census','registry'], array['kb/_program_source_census.py','tests/program_source_census_test.py'],
 'PR #1839; the four runs'' job logs', 'SkyCatalog-s321', '2026-10-03', 'proposed', null, null),
('six-colleges-catalogs-need-a-person-2026-10-03',
 'Six college catalogs the census cannot reach wait on a person''s entry',
 'fact',
 'The census cannot reach six catalogs: the four Los Rios colleges answer its browser 404 at the homepage, De Anza and City College of San Francisco serve Cloudflare challenges, and no catalog.<domain> host resolves for any of them. Their addresses (web search, 2026-10-03) wait on Sam as a person''s correction in the registry (open-asks sheet 24).',
 'American River, Folsom Lake and Sacramento City: <college>.losrios.edu/2026-2027-official-catalog. Cosumnes River showed its 2025-26 catalog and a 2026-27 preview, so the stable crc.losrios.edu/catalog. De Anza: deanza.edu/catalog. City College of San Francisco: PDFs by section under ccsf.edu/catalog. Receipt: kb/receipts/program_source_registry_corrections_2026-10-03_s321.sql. The census never works around a challenge, and a session never sets corrected_by from its own inference.',
 'Six colleges block the catalog reader; a person enters their catalog addresses instead.',
 array['program-requirements','census','registry'], array['kb/receipts/program_source_registry_corrections_2026-10-03_s321.sql'],
 'S321 census runs and web search, 2026-10-03', 'SkyCatalog-s321', '2026-10-03', 'proposed', null, null),
('compare-each-full-read-row-by-row-2026-10-03',
 'Compare each full read of a rule-based reader row by row before merging',
 'procedure',
 'When a rule-based reader changes, keep the last full read and compare every row against it and against the first before merging. In S321 each round raised the totals and still regressed rows outside its aim (Diablo Valley, Merced, Yuba); only the row-by-row comparison named them.',
 'KB note docs/kb-notes/methodology-a-reader-fix-moves-rows-it-was-not-aimed-at.md. Keep each read''s JSON lines, key by the stable name, compare address, year, platform and access, and read the evidence of every row that moved the wrong way before writing a rule. PR #1839.',
 'After changing a scraper, check every college it reads, not just the totals.',
 array['methodology','census','verification'], array['docs/kb-notes/methodology-a-reader-fix-moves-rows-it-was-not-aimed-at.md'],
 'KB note methodology-a-reader-fix-moves-rows-it-was-not-aimed-at; PR #1839', 'SkyCatalog-s321', '2026-10-03', 'proposed', null, null),
('cpl-memory-summary-capped-at-400-2026-10-03',
 'cpl_memory caps summary at 400 characters; one long row fails the whole statement',
 'pitfall',
 'cpl_memory.summary is capped at 400 characters and detail at 4,000 (check constraints), and one long row fails a whole multi-row INSERT. S320''s receipt carried two summaries over the cap (438 and 411), so it could not have landed from the SQL editor either; S321 moved a sentence of each into detail.',
 'Measure each summary and detail before staging a receipt: len() on the unescaped text, with '''' counted once. Constraint names: cpl_memory_summary_check, cpl_memory_detail_check; source is capped at 500 and scope at 120.',
 'Memory rows have a length limit; check it before saving a batch.',
 array['supabase','cpl-memory','process'], array['kb/receipts/cpl_memory_2026-10-03_s320.sql'],
 'S321 constraint read-back, 2026-10-03', 'SkyCatalog-s321', '2026-10-03', 'proposed', null, null),
('connector-confirm-matches-words-in-quoted-text-2026-10-03',
 'The Supabase connector asks to confirm a statement whose quoted text names a destructive SQL word',
 'pitfall',
 'The Supabase connector''s destructive-statement confirmation fires on words inside quoted prose: an INSERT into cpl_memory whose text named drop, delete, revoke or truncate waited 60 s and wrote nothing (S320 twice, S321 once), while the same INSERT without those rows ran in under a second. Keep such rows in a receipt for Sam; write the rest directly.',
 'Extends mcp-apply-migration-destructive-confirm-times-out-2026-10-02 and supabase-execute-sql-update-waits-on-confirm-2026-10-01, which saw the confirmation on statements that ran those words as SQL. Evidence: the S320 receipt (two rows naming them) hung; its three other rows, sent alone at 17:53Z on 2026-10-03, reached Postgres at once. One comparison, so the rule is supported, not proven.',
 'A memory note that mentions deleting things can stall waiting for approval; Sam runs those by hand.',
 array['supabase','mcp','approval-prompts','cpl-memory'], array['kb/receipts/cpl_memory_2026-10-03_s321.sql'],
 'S321 execute_sql attempts, 2026-10-03', 'SkyCatalog-s321', '2026-10-03', 'proposed', null, null)
on conflict do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'SkyCatalog-s321', 'create', 'S321 ingest', to_jsonb(m)
from public.cpl_memory m
where m.author = 'SkyCatalog-s321'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

select m.slug, m.status, count(l.id) filter (where l.action = 'create') as creates
from public.cpl_memory m
left join public.cpl_memory_log l on l.memory_id = m.id
where m.author = 'SkyCatalog-s321' group by m.slug, m.status order by m.slug;

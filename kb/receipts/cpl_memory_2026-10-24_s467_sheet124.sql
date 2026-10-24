-- S467 SkyHollyleaf, 2026-10-24 ~16:25Z. Rule 8 ingest through execute_sql: INSERT-only, a new slug dated today,
-- author SkyHollyleaf-S467. Rollback: supersede by slug under actor 'SkyHollyleaf-S467-rollback'.
insert into public.cpl_memory (slug, kind, org, title, summary, detail, plain, tags, affects, source, related, author, event_date, status, verified_by)
values
('sam-sheet-124-rulings-2026-10-24', 'decision', 'cpl',
 'Sam''s Sheet 124 rulings: he attaches the toolkit photos himself; the IT and AI credentials deck comes off the public library',
 'Sam, Open Asks Sheet 124, 16:20Z 2026-10-24, reviewed through 2, both his own call, no notes: card 1 attach (he attaches the career education toolkit photos to a session''s message, since no session can reach the site); card 2 unlist (the deck whose link pointed into the private vault comes off the public library until it has a public home).',
 'Card 2 rode kb/receipts/cpl_library_it_ai_deck_unlist_2026-10-24_s467.sql through supabase-migrate.yml: one guarded change of public_listed, listed_by and updated_by, with seen_by, the public summary and topics kept, so relisting is one switch once the deck has a link that opens without a sign-in. Card 1 waits on the files.',
 'Sam will send the photos for the public library himself, and the slide deck that only the team could open is off the public page for now.',
 array['library','public-library','decision-sheet','sam-ruling']::text[], array['library/index.html','cpl_library']::text[],
 'Open Asks Sheet 124 replies store (replies/1, replies/2, replies/done), read 16:21Z', array['sam-public-library-malone-look-2026-10-24','careereducationtoolkit-unreachable-from-sessions-2026-10-24']::text[],
 'SkyHollyleaf-S467', '2026-10-24', 'verified', 'Sam (sheet replies)')
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkyHollyleaf-S467', 'create', 'S467 (2026-10-24)', to_jsonb(m)
from public.cpl_memory m where m.slug in ('sam-sheet-124-rulings-2026-10-24')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

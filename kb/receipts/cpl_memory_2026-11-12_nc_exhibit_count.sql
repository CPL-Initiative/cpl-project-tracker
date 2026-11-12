-- cpl_memory rows for the noncredit exhibit count / chatbox_exhibits refresh (#3185).
-- 2026-11-12 (the first row's title and detail narrowed the same hour, COBIx's finding on #3185). INSERT-only, ON CONFLICT DO NOTHING. Rollback:
--   delete from cpl_memory where author = 'nc-exhibit-count-2026-11-12@bot';
insert into cpl_memory (kind, slug, title, summary, detail, tags, source, status, event_date, author, verified_at, verified_by) values
('decision', 'sam-malone-rolls-with-funding-calls-2026-11-12', 'Sam: Malone rolls with the noncredit exhibit count changes (2026-11-12)',
 'Sam, in session 2026-11-12: "this is Sam--let Malone roll with anything I can do he can do better:)". Asked who was driving a change to what counts toward the noncredit share on the public funding page.',
 'Said after "All 3 steps seem appropriate" on: the noncredit exhibit count reads the daily MAP pull, it reads MAP''s mode of learning, and chatbox_exhibits refreshes nightly. Scope: those three steps on the funding page''s noncredit exhibit count. The words are not a standing grant over migrations, privacy or other data calls; a later session asks again.',
 array['funding', 'governance', 'decision', 'team'], 'Sam, in session 2026-11-12 (verbatim)', 'verified', '2026-11-12', 'nc-exhibit-count-2026-11-12@bot', now(), 'Sam Lee'),
('decision', 'nc-exhibit-count-reads-map-mode-of-learning-2026-11-12', 'NC-1 counts an exhibit MAP lists with the Noncredit mode of learning (channel 5)',
 'Approved in session 2026-11-12 (Sam; finding by Malone): an exhibit MAP lists with the Noncredit (N) mode of learning counts toward NC-1, beside the four title and attestation channels; one exhibit counts once. PR #3185.',
 'cpl_funding_nc_counts() returns nc_mode (chatbox_exhibits.learning_mode ends "(N)"); funding/_build_funding_performance.py counts it. Mode N reads "Noncredit, community education, and contract education coursework", so community and contract education exhibits count on this channel.',
 array['funding', 'noncredit', 'decision'], 'Sam, in session 2026-11-12', 'verified', '2026-11-12', 'nc-exhibit-count-2026-11-12@bot', now(), 'Sam Lee'),
('pitfall', 'chatbox-exhibits-was-a-one-time-load-2026-11-12', 'chatbox_exhibits stood unrefreshed from about May 2026; the funding count read it',
 'Malone, 2026-11-12: the public funding page showed Las Positas at 9 noncredit exhibits; MAP lists 47 as Noncredit. chatbox_exhibits was a one-time load with no sync and no mode of learning. Fixed by a nightly refresh (#3185).',
 '2,397 rows at 59 colleges, no timestamp; S471 built NC-1 on it. 30 of the 47 were absent, 17 sat under old titles; the day''s MAP pull held about 11,400 college and exhibit pairs at 103 colleges. chatbox/sync_chatbox_exhibits.py now runs in the daily build. Before building a count on a Supabase table, read when it was last loaded.',
 array['funding', 'sierra', 'noncredit', 'pitfall', 'data-freshness'], 'Malone (finding), session measurement 2026-11-12', 'proposed', '2026-11-12', 'nc-exhibit-count-2026-11-12@bot', null, null),
('question', 'coci-blank-funding-category-las-positas-2026-11-12', '289 Las Positas noncredit courses carry a blank funding category in chatbox_college_courses',
 'Measured 2026-11-12: 289 Las Positas rows in chatbox_college_courses have a blank credit_type, so they are not read as CDCP; nc_cdcp reads 58 and their credit twins miss the title channels. Unmeasured statewide.',
 'NAUT A5, A7, A8, SDR and all eight NESL 220-231 are among them. Not determined whether COCI holds the category or the sync dropped it.',
 array['funding', 'noncredit', 'coci', 'question'], 'session measurement 2026-11-12', 'proposed', '2026-11-12', 'nc-exhibit-count-2026-11-12@bot', null, null)
on conflict do nothing;

-- S612 SkySunflower: four rows (one Sam decision, three proposed), INSERT-only with their log and verify. Lengths measured.
insert into public.cpl_memory (kind, slug, title, summary, detail, plain, tags, source, status, verified_by, verified_at, event_date, author, confidence) values
('decision','sam-sheet-173-descriptions-2026-11-08','Sam: confirm the CCR seed disciplines with course descriptions, SLOs and objectives, TOP alongside',
 'Sam, Open Asks Sheet 173 card 1, 22:21Z 2026-11-08, a note and no verdict: "Can''t we use course description and slos and objectives to confirm rather than top or alongside top". The seed re-check now reads COCI descriptions as the second signal (kb/_ccr_desc_signal.py) with TOP beside it; Sheet 174 asks about Kinesiology''s 627.',
 'Coverage measured that night: descriptions reach 8,286 of 12,504 uncurated seed cards, TOP votes on 5,768, SLOs (course_outcomes) 13 colleges. Answered in the card''s thread; Sheet 173 replaced by Sheet 174 (https://claude.ai/artifact/ETPrCdiUzf3iq7GUr4F9So).',
 'Sam asked to check common-course disciplines against course descriptions and outcomes rather than TOP codes alone.',
 array['commons','common-course-reference','decision-sheets','top'],'Open Asks Sheet 173 replies; cpl-project-tracker#2940','verified','Sam',now(),'2026-11-08','SkySunflowerS612','high'),
('pitfall','pitfall-pending-map-moves-another-record','A pending alias map that names a key may have moved another record that shared the id',
 'The S611 anchor dry run read AUTD M10FX and FY as re-keys: the Z-band retirement gave them to the diesel anchors on 2026-09-03, the prefix fold gave the same ids to HVAC singletons the next day, and the 2026-11-05 recode moved the singletons to DIES. A re-key onto a live record is a collision (#2938).',
 'kb/_anchor_rekey_dryrun.py now classes a re-key whose target is live as ambiguous; kb/_anchor_rekey_apply.py gates on it (V3). Both diesel entries took the lowest never-used DIES number (M10II, M10IJ). KB note: methodology-read-a-documents-era-from-its-keys (S612 section).',
 'An id reused across two re-mints can make one course look like another; check that the target id is free.',
 array['remint','alias-chain','commons','common-subjects-reference'],'cpl-project-tracker#2938','proposed',null,null,'2026-11-08','SkySunflowerS612','high'),
('fact','ccr-seed-recheck-signals-2026-11-08','The CCR seed re-check: descriptions right 88% held out at a clear margin; 1,964 cards confirmed by both signals',
 'kb/_ccr_seed_recheck_dryrun.py with kb/_ccr_desc_signal.py (stdlib TF-IDF, trained on 2,935 curator or subject-map placements, never a seed card): held out 75% right, 88% at a clear margin. Of 12,504 uncurated seed cards: 1,964 confirmed by description and TOP, 778 by description alone, 1,823 for a curator. Kinesiology 627 and 8.',
 'The subject map is not a second signal (the seed was a subject-code heuristic) and neither are the CSR local subject variants (tallied from the same cards). The model confuses a discipline with its parent (a cohort''s 22 Business-to-Accounting moves). Curator-ruled seed cards are a biased accuracy test: nearly all are changes.',
 'A text model checks the seed disciplines against course descriptions; about one card in six is confirmed by two signals.',
 array['commons','common-course-reference','top'],'cpl-project-tracker#2940','proposed',null,null,'2026-11-08','SkySunflowerS612','medium'),
('fact','funding-tests-window-getter-2026-11-08','Funding tests ran a third slower than needed on jsdom''s window getter; base() caches it',
 'Profiled 2026-11-08: loading cpl_funding.js costs 13ms, boot() and render() 5.7s each, a third in jsdom''s window getter hit by base() about a million times a render. var WIN = window at load halves both (cpl_funding_optin 4m23s to 2m13s). The rest is priorities() recomputed per college (#2939, COBIx #2927 item 2).',
 'COBIx''s premise for #2927 item 2 (reloading the 1.25 MB file per case) did not hold. Guard: tests/cpl_funding_base_cached_window.test.js. The slowest CI shard went from 10m26s to 8m41s on the next run.',
 'A one-line change halved the time of the slowest test family.',
 array['ci','implementation-funding'],'cpl-project-tracker#2939','proposed',null,null,'2026-11-08','SkySunflowerS612','high')
on conflict do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'SkySunflowerS612', 'create', 'S612 SkySunflower checkpoint', to_jsonb(m)
from public.cpl_memory m where m.slug in ('sam-sheet-173-descriptions-2026-11-08','pitfall-pending-map-moves-another-record','ccr-seed-recheck-signals-2026-11-08','funding-tests-window-getter-2026-11-08')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
select m.slug, m.status, length(m.summary) as summary_len, count(l.id) filter (where l.action='create') as creates
from public.cpl_memory m left join public.cpl_memory_log l on l.memory_id = m.id
where m.slug in ('sam-sheet-173-descriptions-2026-11-08','pitfall-pending-map-moves-another-record','ccr-seed-recheck-signals-2026-11-08','funding-tests-window-getter-2026-11-08')
group by m.slug, m.status, m.summary;

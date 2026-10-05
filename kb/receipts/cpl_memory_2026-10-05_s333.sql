-- S333 (SkyHarbor), 2026-10-05: Sam's issuer rule for a credential taught inside a college course.
-- Written through execute_sql (the guard's cpl_memory carve-out).
-- Rollback: supersede the row by slug under actor 'SkyHarbor-s333-rollback'.
insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status)
values
('sam-osha-issues-the-card-not-the-teaching-college-2026-10-05',
 'Sam: a college that teaches OSHA 30 inside its course is not the issuing agency; OSHA is',
 'decision',
 'Sam, 2026-10-05, in chat, on Cerritos IWAP 41.09: "maybe your question about Osha 30 at Cerritos may have been whether to make them the issuing agency because they teach it as part of their course. If so, they would not be the issuing agency, osha would." The issuer is the body that issues the credential, not the college that teaches toward it.',
 'Sheet 38 card 2 asked a different question: whether IWAP 41.09 teaches OSHA 30 or welding safety, which decides its CCR filing (WELD M10CA alone, or CNST M1001 beside eight OSHA 30 Construction courses); Sam''s ruling on it was later. Session reading (SkyHarbor, not Sam''s): the CER exhibit MAPCXA-E&R-1-001 is Cerritos''s credit by exam (cpl type Credit By Exam), so its evidence is the college''s own exam and the issuer Sam set on 2026-07-08 (issuing_agency_override, California Community Colleges) stands under this rule; an exhibit whose evidence is the OSHA 30 card takes OSHA as issuer. The CER names OSHA two ways: U.S. Department of Labor (OSHA 30 Card, curator 2026-07-07) and U.S. Occupational Safety and Health Administration (OSHA) (batch classify, unreviewed).',
 'When a college builds the 30-hour OSHA safety training into one of its own courses, OSHA still issues the card; the college does not become the issuer.',
 array['cer','issuing-agency','osha','cerritos','ironworker','program-requirements'],
 array['kb/credentials.json','kb_curation'],
 'Sam, in chat (S333, 2026-10-05)',
 'SkyHarbor-s333',
 '2026-10-05',
 'verified')
on conflict (slug) do nothing;

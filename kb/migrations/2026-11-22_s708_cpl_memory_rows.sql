-- cpl_memory row for SkyNoddy (S708), a side session beside SkyPrion (S707): one decision on the MAP Team Queue's
-- worklist of exhibits with no credit recommendation (PR #3695). Applied with execute_sql; INSERT-only.
-- ROLLBACK: delete from public.cpl_memory where slug = 'd-exhibits-no-cr-statewide-s708';
insert into public.cpl_memory (slug, kind, title, summary, detail, scope, tags, source, status, event_date, author, related)
values (
  'd-exhibits-no-cr-statewide-s708',
  'decision',
  'The MAP team worklist of exhibits with no credit recommendation covers every statewide exhibit',
  'S708: the MAP Team Queue''s exhibits-no-cr item lists every exhibit in statewide_data.js with no credit recommendation, not only the held review cards: one row per MAP id with its owner college from MAP''s exhibit list (map_cpl_opportunities_verified.json), colleges most-first, each list opening in place. 71 ids on 68 of 3,085 exhibits at 19 colleges (2026-11-22 tree).',
  'Carries out Sam''s ruling r-map-team-worklist-for-no-cr-exhibits-sam-2026-11-22. The session read "every statewide exhibit" as every exhibit in MAP''s statewide data (statewide_data.js), not the Fact Sheet''s statewide-collaborative catalog; the MAP id is the unit, since the team follows up exhibit by exhibit; the college is MAP''s owner, the one that entered it; the item names no tab because its list is on the item. kb/_build_exhibits_review.py writes no_cr into kb/exhibits_review.json at the nightly rebuild; until then the held cards are the fallback. Sam''s to revise.',
  'my-college-action-page',
  array['map-team-queue','exhibits-review','decision','s708'],
  'CPL-Initiative/cpl-project-tracker#3695 (SkyNoddy, S708)',
  'proposed',
  '2026-11-22',
  'SkyNoddy (S708)',
  array['r-map-team-worklist-for-no-cr-exhibits-sam-2026-11-22']
)
on conflict (slug) do nothing;

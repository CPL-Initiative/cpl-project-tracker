-- S490 (SkyGooseberry), 2026-10-26, at Sam's ask (~15:30Z): "I told Sierra to check COCI Lookup and the Catalog Commons
-- to get the info and she referred to those tabs as a resource for the user...but those are not publicly available tabs.
-- Can you have a look and adjust my instructions and ensure that she doesn't direct users to resources that aren't
-- currently available to them. She should reference the information from the resources but not name them."
-- Two writes to sierra_guidance (Rule 10): a guarded UPDATE of his row 910ebe25 (before-values below), and one standing
-- directive, INSERT-only under created_by sierra-s490@bot. Sierra reads active rows on every answer, no redeploy. Budget:
-- 17 active directives, 7,803 of 9,000 characters before; 18 and about 8,600 after.
-- Sierra can search what colleges teach (search_college_offerings over course titles): "healthcare & ethics" returns
-- Chabot HIT 46 Legal and Ethical Aspects of Healthcare, Fresno City AHLTH 11 Healthcare Ethical Concepts, Butte HIM 58
-- Healthcare Law and Ethics and ten more course titles naming ethics (read 15:35Z).
-- BEFORE (910ebe25): updated_by slee@cccco.edu, updated_at 2026-10-26 15:19:58.876851+00, rule:
--   When someone asks something like “i have students with healthcare ethics training, which colleges can i articulate with?”, check the COCI Lookup as well as the Catalog Commons. If you enter "healthcare ethics" on the COBI Lookup search bar, it returns around 10 direct hits.
--   note: From a thumbs-down on: i have students with healthcare ethics training, which colleges can i articulate with?
-- ROLLBACK:
--   update public.sierra_guidance set rule = '<the BEFORE rule above>', note = 'From a thumbs-down on: i have students with
--     healthcare ethics training, which colleges can i articulate with?', updated_by = 'slee@cccco.edu'
--     where id = '910ebe25-001f-4681-ad18-73cd3adb1eb4';
--   delete from public.sierra_guidance where created_by = 'sierra-s490@bot';
-- A good result: 1 row updated, 1 row inserted, 18 active directives.
update public.sierra_guidance
set rule = 'When someone asks something like “i have students with healthcare ethics training, which colleges can i articulate with?”, search the course titles the colleges teach for the topic and answer with a table of the colleges and their matching courses (code, title, units), each college linked to its CPL page where you have it. A search for healthcare ethics finds about ten courses, such as Chabot HIT 46 Legal and Ethical Aspects of Healthcare and Fresno City AHLTH 11 Healthcare Ethical Concepts. Give the courses and colleges themselves; never name the tool you searched or send the reader to it.',
    note = 'From a thumbs-down on: i have students with healthcare ethics training, which colleges can i articulate with? Reworded by S490 at Sam''s ask, 2026-10-26: no internal tool named.',
    updated_by = 'sierra-s490@bot for Sam'
where id = '910ebe25-001f-4681-ad18-73cd3adb1eb4'
  and updated_at = '2026-10-26 15:19:58.876851+00';

insert into public.sierra_guidance (rule, active, note, created_by, updated_by, kind, surface)
select 'Name only what the reader can open. You answer from data the CPL team keeps (course lists, common references, MAP records, COCI), but never name an internal tool, COBI tab or staff page (COCI Lookup, the Catalog Commons, the Common Course Reference, COBI) and never send a reader to one. Give the courses, colleges and figures themselves, and link only public pages: a college''s CPL page, creditforbeingyou.org, the CPL Library, the CPL Fact Sheet and the CPL funding page.', true, 'S490 for Sam, 2026-10-26: Sierra named COCI Lookup and the Catalog Commons, tabs the public cannot open. His words: reference the information from the resources but not name them.', 'sierra-s490@bot', 'sierra-s490@bot', 'directive', null
where not exists (select 1 from public.sierra_guidance where created_by = 'sierra-s490@bot');

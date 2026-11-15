-- S660 SkyPlover: one finding row (the restricted tables' measured readers). RUN about 16:35Z.
-- ROLLBACK: delete from cpl_memory_log where memory_id in (select id from cpl_memory where slug='cdc-restricted-tables-read-by-team-phrase-s660'); delete from cpl_memory where slug='cdc-restricted-tables-read-by-team-phrase-s660';
insert into cpl_memory (slug,kind,title,summary,tags,status,source,author,event_date) values
('cdc-restricted-tables-read-by-team-phrase-s660','risk','Three restricted CDC tables are readable with the team phrase','Live read 2026-11-15 16:20Z (kb/reference/restricted_table_access.json): map_college_contacts, map_college_users and map_college_nudges pass a row on is_funding_reviewer() OR team_pass_ok(), so any request with the team phrase reads them. Whether a phrase should reach staff rosters is the org-phrase-scope-auth lane''s call.',array['commons','cdc','privacy','auth','finding'],'proposed','SkyPlover (S660), live read','SkyPlover (S660)',date '2026-11-15')
on conflict (slug) do nothing;
-- plus one cpl_memory_log row (create). RUN 16:23Z, memory_id a588905d-78d9-4e0c-b392-88d3e4826be2.

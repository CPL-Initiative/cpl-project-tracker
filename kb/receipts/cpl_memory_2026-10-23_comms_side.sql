-- The side session beside S457, 2026-10-23 ~17:50Z. Rule 8 ingest through execute_sql: INSERT-only, new slugs dated today,
-- author CommsSideS457. Rollback: supersede by slug under actor 'CommsSide-s457-rollback'. No row here names the word
-- the guard refuses; "refresh" stands in.
insert into public.cpl_memory (slug, kind, org, title, summary, detail, plain, tags, affects, source, related, author, event_date, status, verified_by)
values
('sam-letters-tab-becomes-communications-register-2026-10-23', 'decision', 'cpl',
 'Sam: the Letters tab becomes the register for every communication, with contacts by role and current figures',
 'Sam, 2026-10-23: "set this up on our COBI Letter, Memos, Reports tab which I haven''t used since it was created... expanded for any type of communication I need to craft that needs to incorporate current data and contacts for various roles in the system that we may already store (e.g., CEO name and email and current CPL metrics)."',
 'His list: a status (draft, final, tabled), a search bar, an audience selector, a comm type (email, CO memo, MAP Team note, report, flyer), cc recipients for emails, and a way to post to the COBI Library. The first use: an email to every CEO with the CIO and CSSO in copy, about JST uploads and the 2026-2028 funding. Built the same day as comms.js over cpl_comms; the lane is docs/reference/lanes/communications.md.',
 'Sam asked for the old budget-support letter tab to become one place for every communication the Initiative sends, with the people and the figures read from what COBI already holds.',
 array['communications','letters','library','sam-ask'], array['comms.js','kb/supabase_cpl_comms.sql','docs/reference/lanes/communications.md'],
 'Sam in chat, the side session beside S457, 2026-10-23', array['sam-library-tab-build-2026-10-05','sam-claude-artifacts-go-in-library-2026-10-20'],
 'CommsSideS457', '2026-10-23', 'verified', 'Sam (his ask in chat, 2026-10-23)'),
('map-roster-ceo-cio-csso-coverage-2026-10-23', 'fact', 'cpl',
 'The MAP roster holds a CEO address for 70 of 124 rows, a CIO for 95, a CSSO for 58, all three for 33',
 'Measured 2026-10-23 on map_college_contacts: 124 rows; ceo_email filled for 70, vpaa_email (the CIO) 95, vpss_email (the CSSO) 58, all three 33. count(col) reads 124 for each because MAP syncs empty strings, never nulls: measure with count(nullif(col, '''')). Names carry no title or last-name field.',
 'The roster also holds partners and test rows (Launch Apprenticeship, Futuro Health, CSU Los Angeles) and duplicate spellings (Calbright twice, NOCE twice); comms.js drops a row map_colleges does not know as a college or continuing-education campus and keeps one row per identity. A letter to the CEO can reach 70 colleges from the roster today; the recipients table names the rest as gaps.',
 'About half of the colleges have a president''s address in MAP, and the names are typed by hand without a title, so a letter to every CEO starts with a list of the colleges it cannot reach.',
 array['communications','map-users','contacts','measurement'], array['map_college_contacts','comms.js'],
 'execute_sql, 2026-10-23; docs/reference/lanes/communications.md', array['my-college-public-contact-read-absent-column-2026-10-12'],
 'CommsSideS457', '2026-10-23', 'proposed', null),
('ceo-email-dollar-range-under-sunshine-rule-2026-10-23', 'risk', 'cpl',
 'Sam''s CEO email names the $150,000 to $400,000 range the sunshine rule keeps out of outward materials',
 'His draft of 2026-10-23 says the 2026-2028 CPL funding is "between $150,000 to $400,000", the model''s max-award range. The sunshine rule (Sam, 2026-09-01) keeps the model''s dollar figures out of outward materials until he confirms with CO leadership. The record keeps his words in draft; Open Asks Sheet 118 card 1 asks him to keep, carry the shape, or confirm the rule is lifted.',
 'The 75 percent JST condition and the $50,000 seed grant are public (the Veteran Star on the MAP dashboard; ESS 25-82), so they stay. Only the 2026-2028 range waits on him.',
 'The email Sam drafted quotes the funding model''s dollar range, which his own rule holds back from colleges until the Chancellor''s Office leadership has confirmed it, so the register keeps it as a draft and the sheet asks.',
 array['communications','funding','sunshine-rule','needs-sam'], array['kb/receipts/cpl_comms_seed_2026-10-23.sql'],
 'Sam''s draft in chat, 2026-10-23; docs/reference/lanes/implementation-funding.md (the sunshine rule)', array['sam-letters-tab-becomes-communications-register-2026-10-23'],
 'CommsSideS457', '2026-10-23', 'proposed', null),
('cobi-writing-surfaces-twelve-with-their-own-rules-2026-10-23', 'opportunity', 'cpl',
 'Twelve COBI surfaces draft prose or call Claude, each with its own prompt rules and model pin',
 'Inventory 2026-10-23: report_generator.js, college_report_generator.js, annual_report.js, master_report.js, generate_reports.js, activity_summaries.js, raci.js, credential_reference.js, quickstart.js, the funding tab''s memo builder, the GR register''s memos, Sierra, and comms.js. The naming rule is copied by hand into at least three; the model pins read four different values.',
 'The proposal on Open Asks Sheet 118 card 2: one cpl_writer.js holding the naming rule, the house voice, the funding vocabulary, the audience definitions, the model constant and the proxy call, consumed by each surface one PR at a time, comms.js first; the tabs keep their own data and UI. A tab-level merge would cost each surface the data it sits beside and buy nothing.',
 'The dashboard has a dozen places that write prose with Claude, each carrying its own copy of the house rules; one shared writing layer would let a style change land everywhere at once.',
 array['communications','report-generator','house-voice','consolidation'], array['report_generator.js','activity_summaries.js','raci.js','quickstart.js','comms.js'],
 'the side session beside S457, grep over the tracker, 2026-10-23', array['sam-funding-interface-five-asks-2026-10-19'],
 'CommsSideS457', '2026-10-23', 'proposed', null)
on conflict (slug) do nothing;
insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'CommsSideS457', 'create', 'side session beside S457 (2026-10-23)', to_jsonb(m)
from public.cpl_memory m where m.slug in ('sam-letters-tab-becomes-communications-register-2026-10-23','map-roster-ceo-cio-csso-coverage-2026-10-23','ceo-email-dollar-range-under-sunshine-rule-2026-10-23','cobi-writing-surfaces-twelve-with-their-own-rules-2026-10-23')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

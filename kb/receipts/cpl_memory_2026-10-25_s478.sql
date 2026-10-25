-- S478 SkyTidyTips (opened by hand by Sam), 2026-10-25. Rule 8 ingest: INSERT-only, author SkyTidyTips-S478, logged.
-- Rollback: supersede these slugs under actor 'SkyTidyTips-S478-rollback'.

insert into public.cpl_memory (slug, kind, org, title, summary, detail, plain, tags, affects, source, related, author, event_date, status, verified_by, verified_at)
values
('sam-noncredit-cpl-lead-strike-team-retired-2026-10-25', 'decision', 'cpl',
 'Sam: the noncredit condition names the Noncredit CPL Lead; the strike-team checkbox goes',
 'Sam, 2026-10-25 ~14:05Z (S478): "let''s use the term Noncredit CPL Lead instead of Coordinator. Note that I revised the 1st condition to: ''CPL Coordinator and Noncredit CPL Lead assigned (on MAP and the configured college CPL Landing Page) and meeting regularly.''" His screenshot struck "Strike team attestation not yet on file".',
 'S478 read the strike-through as retiring the strike-team condition (ncTeamShown() off unless a layer sets ncTeamHidden false) and had the annual attestation affirm the Lead meets regularly with the CPL Coordinator. Two of his saved passages still use the old words: nc_rules ("noncredit CPL coordinator ... CPL Strike Team") and college_intro ("Max CR Funds and Max NC Funds"); they are his to edit on the tab.',
 'The noncredit person is the Noncredit CPL Lead, and one noncredit condition remains.',
 array['implementation-funding','noncredit','sam-ruling','decision']::text[], array['cpl_funding.js']::text[],
 'Sam, in session S478, 2026-10-25', array['sam-sheet-113-rulings-2026-10-22']::text[],
 'SkyTidyTips-S478', '2026-10-25', 'verified', 'Sam (his words, in session)', now()),
('sam-funding-table-two-columns-2026-10-25', 'decision', 'cpl',
 'Sam: the College table keeps two funding columns, Max Funds and Curr Funds; Base/Cap chips left of the amounts; Confirm links right-aligned',
 'Sam, 2026-10-25 (S478): "consolidating the 4 CR and NC Max and Curr columns into just 2 Max and Curr columns and show the totals on the Priority rows... eliminate the Total columns." Mid-turn: "Move the base and cap chips (regular font) to the left of the amounts" and "Make the Confirm by links line up right justified".',
 'It works under Scenario 4: each credit priority carries the credit share alone and each noncredit outcome the noncredit share alone, so a row''s total is its one lane; the institution''s Max Funds is the old Total Funds. Under the origination lane (Scenarios 1 to 3) a priority row adds both lanes. The split columns stay in the Columns menu, hidden by default (store cplfund_cols_v3), and the CSV keeps them. His screenshot also struck the drill-in''s "Reported, not funded" line and the headcount and Census sources.',
 'The funding table shows two money columns: the most an institution can receive, and what it qualifies for now.',
 array['implementation-funding','college-dashboard','sam-ruling','decision']::text[], array['cpl_funding.js']::text[],
 'Sam, in session S478, 2026-10-25', array[]::text[],
 'SkyTidyTips-S478', '2026-10-25', 'verified', 'Sam (his words, in session)', now()),
('sam-report-fold-timeline-order-2026-10-25', 'decision', 'cpl',
 'Sam: the Reporting box folds behind a Report link naming the nearest unsubmitted deadline; the timeline reads in date order',
 'Sam, 2026-10-25 (S478): "Make the Report section on the College table collapsed and open up on click of the Report link... There was no way to reorder them in chronological, so please do that. Note the nearest unsubmitted report Deadline as part of the Report link".',
 'He added four timeline milestones on the tab: First to Fourth Report Deadline (Jan 31 2027, Jun 30 2027, Nov 30 2027, May 31 2028). S478 sorts every rendering by date rather than rewriting the stored list; a deadline is met by a report for its fiscal year filed after the year''s previous deadline.',
 'The report form stays closed until opened, and its link says when the next report is due.',
 array['implementation-funding','reporting','timeline','sam-ruling','decision']::text[], array['cpl_funding.js']::text[],
 'Sam, in session S478, 2026-10-25', array[]::text[],
 'SkyTidyTips-S478', '2026-10-25', 'verified', 'Sam (his words, in session)', now()),
('sam-funding-page-library-look-sierra-light-2026-10-25', 'decision', 'cpl',
 'Sam: the public funding page takes the public library''s look with a tighter, editable Contents; Sierra''s side bar opens Light without About Sierra',
 'Sam, 2026-10-25 (S478): "make sure she open in light mode by default. No need for the About Sierra button... Regular font on the links and sample questions." "Align the formatting of the public page with the new UI... (Public Library) while preserving current items. tighten up the spacing more on the TOC... make them editable".',
 'S478 shipped the look in Light only (the page names data-theme="light", so the side bar opens Light); a dark palette for the page and its embedded table is the follow-up before the public header''s Light and Dark words go on it. The Contents links that name no section (memo, Word memo, video, office hours, landing page, training video) rename on the page under pubLinks.',
 'The funding page now looks like the public library, and Sierra beside it opens in the light theme.',
 array['implementation-funding','public-page','library','sierra','sam-ruling','decision']::text[], array['funding-model/index.html','funding-model/edit_page.js','sierra/sierra.css','sierra/sidebar.js']::text[],
 'Sam, in session S478, 2026-10-25', array['sam-public-library-malone-look-2026-10-24','sam-sheet-126-rulings-2026-10-24']::text[],
 'SkyTidyTips-S478', '2026-10-25', 'verified', 'Sam (his words, in session)', now())
on conflict (slug) do nothing;

insert into public.cpl_memory (slug, kind, org, title, summary, plain, tags, affects, source, related, author, event_date, status)
values
('procedure-render-funding-page-with-live-config-2026-10-25', 'procedure', 'cpl',
 'A local render of the funding page shows the baked defaults; serve the newest config fixture to its config fetch to see live figures (S478)',
 'The sandbox cannot reach supabase.co, so funding-model/ renders cpl_funding_data.js: Scenario 1, a $75,000 base, Confirm by 11-01-26; Sam caught both in a mock-up. A Playwright route answering /rest/v1/cpl_funding_config with the newest tests/fixtures config (patched from the MCP) renders the published scenario.',
 'Before showing Sam a picture of the funding page, feed it the real settings, or it shows old numbers.',
 array['implementation-funding','procedure','screenshots']::text[], array['funding-model/index.html','tests/fixtures']::text[],
 'S478, 2026-10-25', array['procedure-live-config-by-hash-diff-2026-10-24']::text[], 'SkyTidyTips-S478', '2026-10-25', 'proposed')
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 'SkyTidyTips-S478', 'create', 'S478 (2026-10-25)', to_jsonb(m) from public.cpl_memory m
where m.slug in ('sam-noncredit-cpl-lead-strike-team-retired-2026-10-25',
                 'sam-funding-table-two-columns-2026-10-25',
                 'sam-report-fold-timeline-order-2026-10-25',
                 'sam-funding-page-library-look-sierra-light-2026-10-25',
                 'procedure-render-funding-page-with-live-config-2026-10-25')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

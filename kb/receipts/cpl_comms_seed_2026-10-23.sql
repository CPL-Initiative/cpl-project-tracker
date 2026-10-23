-- The first record in the Letters, Memos & Reports register: Sam's email to the CEOs
-- (his draft in chat, 2026-10-23, set up by the side session beside S457). INSERT-only
-- under the cohort added_by 'comms-seed-s457side@bot'; rollback is one statement:
--   update public.cpl_comms set retired_at = now(), updated_by = 'comms-seed-rollback'
--     where added_by = 'comms-seed-s457side@bot';
-- (a retire, never a delete: the history trigger keeps the row). Applied through the
-- session's execute_sql on 2026-10-23; the service role bypasses RLS.
--
-- His words are kept; four things changed and are named in the note: "Sincerly" read
-- "Sincerely"; "Veterans Sprint" reads "Veteran Sprint" (the program's name);
-- "between $150,000 to $400,000" reads "between $150,000 and $400,000" (the figure
-- itself is his, under the sunshine rule, Sheet 118 card 1); the merge fields stand
-- where his brackets stood, and one JST-figures sentence from the daily feed is new
-- (card 3). The Cc line at the foot keeps his shape and fills from the roster.
insert into public.cpl_comms
  (slug, title, comm_type, audience, status, to_roles, cc_roles, colleges, subject, body, sender, cc_note, occasion,
   figures_as_of, note, made_by, added_by)
values
  ('jst-uploads-and-the-2026-2028-funding-to-the-ceos-261023',
   'JST uploads and the 2026-2028 CPL implementation funding, to the CEOs',
   'email', 'ceos', 'draft', array['ceo'], array['vpaa', 'vpss'], null,
   'Joint Services Transcript uploads and the 2026-2028 CPL implementation funding: {college}',
   'Dear {salutation},

We are reaching out to you regarding the Chancellor''s Office CPL Initiative. The first priority in the 2025-2026 $50,000 CPL implementation funding requires colleges to upload Joint Services Transcripts (JSTs) for enrolled student veterans into the MAP platform and award service members appropriate credit for their military training. {college} received this funding based on this commitment. To be eligible for the new 2026-2028 CPL funding (between $150,000 and $400,000), your college must upload at least 75% of enrolled service member Joint Services Transcripts based on your 2024-2025 MIS reported veteran headcount.

As of {jst_as_of}, MAP holds {jst} Joint Services Transcripts for {college} against {vets} enrolled veterans reported to MIS, {jst_standing}.

With new batch upload procedures, this work can take as little as 10 minutes a week, and the Veteran Sprint team is available to support your VRC. Please let us know how we can help.

Lastly, please join us at our 7th Annual CPL Summit (https://californiacommunitycolleges.cventevents.com/event/ddc221d0-bc1b-4c56-bc71-6b05600bf538/summary), where we will discuss the new CPL funding formula and how your college can maximize its allocation.

Sincerely,
{sender}

Cc: {cio_name}, Chief Instructional Officer; {csso_name}, Chief Student Services Officer',
   'Sam Lee
Senior Advisor to the Chancellor for Credit for Prior Learning
California Community Colleges Chancellor''s Office',
   null,
   '7th Annual CPL Summit; the 2026-2028 CPL implementation funding',
   'JST figures from veteran_jst.json (the CPL dashboard feed, read daily); names and addresses from MAP''s daily roster sync',
   'Sam''s draft of 2026-10-23, set up by the side session beside S457. Before it goes (Open Asks Sheet 118): the $150,000 to $400,000 range names the model''s figures, which the sunshine rule keeps out of outward materials until Sam confirms with CO leadership; the JST sentence is new, from the daily feed; the Cc line at the foot repeats the mail header and shows a bracket where MAP holds no CIO or CSSO; the signature block is a guess at the title, edit it. Of 124 roster rows, 70 carry a CEO address: the recipients table names each college without one.',
   'Sam Lee (the draft); the side session beside S457 (the record)',
   'comms-seed-s457side@bot')
on conflict (slug) do nothing;

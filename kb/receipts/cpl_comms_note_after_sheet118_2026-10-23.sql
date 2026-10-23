-- The side session beside S457, 2026-10-23 18:50Z: Sam answered Open Asks Sheet 118 (18:44Z, all his own call), so the
-- first record's note stops asking. Rule 10: one guarded UPDATE of the seed row, applying only while nobody has edited it
-- (updated_by is null since the seed); rows_updated = 0 means someone edited it: re-read and retry.
-- BEFORE: note = 'Sam''s draft of 2026-10-23, set up by the side session beside S457. Before it goes (Open Asks Sheet 118):
--   the $150,000 to $400,000 range names the model''s figures, which the sunshine rule keeps out of outward materials until
--   Sam confirms with CO leadership; the JST sentence is new, from the daily feed; the Cc line at the foot repeats the mail
--   header and shows a bracket where MAP holds no CIO or CSSO; the signature block is a guess at the title, edit it. Of 124
--   roster rows, 70 carry a CEO address: the recipients table names each college without one.'; updated_by null.
-- ROLLBACK: set note back to that text and updated_by to null where slug below; cpl_comms_history_trg files the prior row.
update public.cpl_comms
set note = 'Sam''s draft of 2026-10-23, set up by the side session beside S457. His Sheet 118 rulings (18:44Z): keep the $150,000 to $400,000 range; keep the JST-figures sentence; President {last} for a CEO without an honorific. Still his to edit: the signature block (a guess at the title) and the Cc line at the foot, which repeats the mail header and shows a bracket where MAP holds no CIO or CSSO. Of 124 roster rows, 70 carry a CEO address: the recipients table names each college without one.',
    updated_by = 'the side session beside S457'
where slug = 'jst-uploads-and-the-2026-2028-funding-to-the-ceos-261023'
  and added_by = 'comms-seed-s457side@bot'
  and updated_by is null
returning slug, updated_by, char_length(note) as note_chars;

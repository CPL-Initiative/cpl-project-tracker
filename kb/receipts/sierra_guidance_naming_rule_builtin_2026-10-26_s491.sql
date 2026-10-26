-- S491 (SkySalmonberry), 2026-10-26: Sam, Open Asks Sheet 132 card 2, "move" (18:13Z, his own call).
-- The naming rule now lives in cpl-chat's stable prompt (NAMING_RULE), so its sierra_guidance row is
-- switched off in the same change, freeing 277 of the 9,000 characters. APPLY ONLY AFTER the deploy that
-- carries NAMING_RULE is live and its smoke run is green; before that, switching it off leaves Sierra
-- with no naming rule at all.
-- Rule 10: one guarded UPDATE (active true, updated_at as read at 18:30Z). Sierra reads active rows on
-- every answer, no redeploy.
-- BEFORE: active true, updated_by (see the read-back), note null.
-- ROLLBACK: update public.sierra_guidance set active = true, updated_by = 'session-97'
--   where id = 'cb226a48-d6a2-47ba-b42b-a47a1704d099';
-- A good result: 1 row, active false.
update public.sierra_guidance
set active = false,
    note = 'Moved into cpl-chat''s built-in instructions (NAMING_RULE) by S491, 2026-10-26, at Sam''s Open Asks Sheet 132 card 2 ("move"); switched off so the 9,000-character budget can never push it out.',
    updated_by = 'sierra-s491@bot (sheet 132)'
where id = 'cb226a48-d6a2-47ba-b42b-a47a1704d099'
  and active = true;
select left(id::text, 8) id, active, updated_by from public.sierra_guidance where id = 'cb226a48-d6a2-47ba-b42b-a47a1704d099';

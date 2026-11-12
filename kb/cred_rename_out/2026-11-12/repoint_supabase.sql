-- The kb_curation half of a credential rename's re-point (kb/_cred_rename_repoint.py). Each UPDATE
-- changes the value alone, only while the row still holds the old title under the bot that saved it.
begin;
update kb_curation set value = 'ASE Certificate Bundles: A4 + A5' where course_id = '_UNCLASSIFIED::Automotive Service Excellence (ASE) A4 and A5' and field = 'unified_title_assignment' and value = 'ASE Bundle — A4, A5' and reviewer_email = 'cer-procedure-classifier@bot';
commit;

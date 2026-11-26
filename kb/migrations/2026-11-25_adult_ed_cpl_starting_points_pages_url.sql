-- 2026-11-25, Sam in session: "I published it to the public library but it says it's being remediated and I don't
-- have any indication of progress." The record still named its claude.ai page, and the Library's check run checks
-- only a record that names its own Pages copy (scripts/library_check.py on_pages), so no check could run. Point the
-- record at library/adult-ed-cpl-starting-points/ (merged in #3861) and add the version line, as the ELL IET and DSP
-- records do. Guarded UPDATE on the address as read; Sam's other fields (status, seen_by, publish_target, project,
-- for_name, kb_note) are untouched. Before-values: url = 'https://claude.ai/artifact/8WrsvrvViQtxJWPfeVzdfP',
-- versions = the one-entry array below, updated_by = 'Sam'.
-- ROLLBACK: kb/migrations/2026-11-25_adult_ed_cpl_starting_points_pages_url_rollback.sql
update public.cpl_library
   set url = 'https://cpl-initiative.github.io/cpl-project-tracker/library/adult-ed-cpl-starting-points/',
       versions = versions || '[{"url":"https://cpl-initiative.github.io/cpl-project-tracker/library/adult-ed-cpl-starting-points/","date":"2026-11-25","label":"1, public copy","status":"Current: the public copy on the CPL Initiative site, with the certification-or-license filter added at Sam''s ask; the claude.ai page stays the editable original."}]'::jsonb,
       updated_by = 'library-adulted-2026-11-25@bot'
 where slug = 'adult-ed-cpl-starting-points'
   and url = 'https://claude.ai/artifact/8WrsvrvViQtxJWPfeVzdfP'
   and public_listed = false;

select slug, url, jsonb_array_length(versions) as versions, publish_target, public_listed
  from public.cpl_library where slug = 'adult-ed-cpl-starting-points';

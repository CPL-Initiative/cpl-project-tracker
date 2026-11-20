-- Answer Sam's first hand-overs as filed (S693, 2026-11-20). A guarded UPDATE of 11 rows of commons_handover, through
-- commons_handover_mark() alone, applied by supabase-migrate.yml (kb/migrations/.apply), never Execute SQL.
--
-- THE PLAN (docs/reference/lanes/commons.md, the hand-over's NEXT; handoff 693 priority 1): "file the hand-over into
-- its course by hand, and say on the row that it is filed (commons_handover_mark, on a runner)". The eight pasted
-- entries are filed in kb/hand_filed_catalogs/handed_over/courses.json; the three links are catalog pages the reader
-- read with no challenge (run 44806543827), kept as catalog sources.
--
-- GUARDS. A row is answered only while it still stands as this file read it (a pasted entry waiting, a link read):
-- a row a person or the reader has moved since is left alone and is absent from the result. `found` is passed back
-- unchanged, so the reader's counts on the three links stay. No other column moves: commons_handover_mark() writes
-- status, status_note, status_at, status_run and found, and never the person, the payload or the subject.
--
-- THE RECEIPT holds, for every row answered, the values it replaced (Rule 10 a2).
-- ROLLBACK: kb/migrations/2026-11-20_s693_handover_mark_filed_rollback.sql
with want(id, expect, note) as (values
  ('7a7d90f1-b2f6-4141-95cc-59c45e077669'::uuid, 'waiting', 'Filed in kb/hand_filed_catalogs/handed_over/courses.json. The course is off the to-do. Its outcomes are still missing until its outline is in hand.'),
  ('4f00e0ac-a1f3-4e5e-a72b-9fa727d7ef07'::uuid, 'waiting', 'Filed in kb/hand_filed_catalogs/handed_over/courses.json. The course is off the to-do. Its outcomes are still missing until its outline is in hand.'),
  ('09686b38-aa5a-400a-a563-03ecd3976eae'::uuid, 'waiting', 'Filed in kb/hand_filed_catalogs/handed_over/courses.json. The course is off the to-do. Its outcomes are still missing until its outline is in hand.'),
  ('634e94f2-71e9-46c2-ba7b-8a76a7c9887a'::uuid, 'waiting', 'Filed in kb/hand_filed_catalogs/handed_over/courses.json. The course is off the to-do. Its outcomes are still missing until its outline is in hand.'),
  ('ec6bdeb3-4b6f-4848-a3c4-331613aa4396'::uuid, 'waiting', 'Filed in kb/hand_filed_catalogs/handed_over/courses.json. The course is off the to-do. Its outcomes are still missing until its outline is in hand.'),
  ('6868a247-38c0-4279-902d-0de1b2a2235b'::uuid, 'waiting', 'Filed in kb/hand_filed_catalogs/handed_over/courses.json. The course is off the to-do. Its outcomes are still missing until its outline is in hand.'),
  ('69d0502f-266b-40fe-9acb-97d3365dd080'::uuid, 'waiting', 'Filed in kb/hand_filed_catalogs/handed_over/courses.json. The course is off the to-do. Its outcomes are still missing until its outline is in hand.'),
  ('38b4d0ff-d37d-4014-80c6-b5319120dd4e'::uuid, 'waiting', 'Filed in kb/hand_filed_catalogs/handed_over/courses.json. The course is off the to-do. Its outcomes are still missing until its outline is in hand.'),
  ('a7c67291-b18b-41d1-bedc-c84f158f78eb'::uuid, 'reads', 'A catalog page, read with no challenge. The course''s description is filed from the pasted entry, and the address is kept as a catalog source.'),
  ('2e50a0b2-fe3b-4cc9-87e2-71b306d84c3b'::uuid, 'reads', 'A catalog page, read with no challenge. The course''s description is filed from the pasted entry, and the address is kept as a catalog source.'),
  ('bdfc4e24-bbb9-4ecc-8741-7306a66c82a7'::uuid, 'reads', 'A catalog page, read with no challenge. The course''s description is filed from the pasted entry, and the address is kept as a catalog source.')
),
before as (
  select h.id, h.kind, h.course_code, h.status, h.status_note, h.status_at, h.status_run, h.found, w.note as new_note
    from public.commons_handover h
    join want w on w.id = h.id and h.status = w.expect
),
marked as (
  select b.id, public.commons_handover_mark(b.id, 'filed', b.new_note, 'session-693', b.found) as answer
    from before b
)
select jsonb_agg(jsonb_build_object(
         'id', b.id, 'kind', b.kind, 'course', b.course_code,
         'before', jsonb_build_object('status', b.status, 'status_note', b.status_note, 'status_at', b.status_at,
                                      'status_run', b.status_run, 'found', b.found),
         'rows', (m.answer ->> 'rows')::int) order by b.kind, b.course_code) as marked
  from before b join marked m using (id);

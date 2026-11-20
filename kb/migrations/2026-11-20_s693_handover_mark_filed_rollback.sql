-- Rollback of kb/migrations/2026-11-20_s693_handover_mark_filed.sql: each row goes back to what stood before it was
-- answered as filed, through commons_handover_mark() alone. The values are the ones the receipt recorded (a pasted
-- entry waiting with no answer; a link read by run 44806543827 with its counts). status_at takes the time of this
-- rollback: the function stamps it, and the receipt keeps the earlier time. A row that is no longer `filed` under
-- session-693 is left alone.
select jsonb_agg(public.commons_handover_mark(h.id, v.status, null, v.run, v.found)) as restored
  from public.commons_handover h
  join (values
    ('7a7d90f1-b2f6-4141-95cc-59c45e077669'::uuid, 'waiting', null::text, null::jsonb),
    ('4f00e0ac-a1f3-4e5e-a72b-9fa727d7ef07'::uuid, 'waiting', null::text, null::jsonb),
    ('09686b38-aa5a-400a-a563-03ecd3976eae'::uuid, 'waiting', null::text, null::jsonb),
    ('634e94f2-71e9-46c2-ba7b-8a76a7c9887a'::uuid, 'waiting', null::text, null::jsonb),
    ('ec6bdeb3-4b6f-4848-a3c4-331613aa4396'::uuid, 'waiting', null::text, null::jsonb),
    ('6868a247-38c0-4279-902d-0de1b2a2235b'::uuid, 'waiting', null::text, null::jsonb),
    ('69d0502f-266b-40fe-9acb-97d3365dd080'::uuid, 'waiting', null::text, null::jsonb),
    ('38b4d0ff-d37d-4014-80c6-b5319120dd4e'::uuid, 'waiting', null::text, null::jsonb),
    ('a7c67291-b18b-41d1-bedc-c84f158f78eb'::uuid, 'reads', '44806543827', '{"chars":7367,"outcomes":0,"final_host":"catalog.gcccd.edu","objectives":0,"http_status":200,"content_type":"text/html","section_heads":["LIBRARY","PREREQUISITE","COREQUISITE"]}'::jsonb),
    ('2e50a0b2-fe3b-4cc9-87e2-71b306d84c3b'::uuid, 'reads', '44806543827', '{"chars":5537,"outcomes":0,"final_host":"catalog.swccd.edu","objectives":0,"http_status":200,"content_type":"text/html","section_heads":["LIBRARY"]}'::jsonb),
    ('bdfc4e24-bbb9-4ecc-8741-7306a66c82a7'::uuid, 'reads', '44806543827', '{"chars":5537,"outcomes":0,"final_host":"catalog.swccd.edu","objectives":0,"http_status":200,"content_type":"text/html","section_heads":["LIBRARY"]}'::jsonb)
  ) as v(id, status, run, found) on v.id = h.id
 where h.status = 'filed' and h.status_run = 'session-693';

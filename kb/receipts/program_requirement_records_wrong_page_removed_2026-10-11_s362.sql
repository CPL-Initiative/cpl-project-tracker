-- S362 SkyAlder, 2026-10-11: remove the 18 program_requirement_records rows that read another program's page.
-- Sam's ruling: Open Asks Sheet 62 item 1, "remove them" (in chat to S362, ~12:55Z). Full rows, as read live just before
-- the delete, are in kb/receipts/program_requirement_records_wrong_page_removed_2026-10-11_s362.json, which also holds the
-- rollback (jsonb_populate_recordset over its rows array).
-- Guard: a row is removed only while its md5(to_jsonb(r)::text) equals the read's, it is unchecked, and no verdict
-- names it, so a row a person touched since the read is left alone. Returns the count removed.
with target(college, control_number, row_md5) as (values
  ('Cerritos College', '19163', 'eff8a76c7458857429e67caab16715d7'),
  ('Cerritos College', '41071', 'c5233a597d0ee261b9792359a1af81e0'),
  ('Cerritos College', '45259', '01c0e43c6cc27caeb77a9c319b087749'),
  ('Moreno Valley College', '30152', '805c979e407902cc218a5312bb7ab14a'),
  ('Mt. San Antonio College', '14039', 'a2d536c932329b15e5f0892762acfa31'),
  ('Mt. San Antonio College', '24058', 'af1c84d122552891ea256c98b70e1d71'),
  ('Mt. San Antonio College', '30805', '91f85285252d4c1e5d194e96cf5c7133'),
  ('Mt. San Antonio College', '38082', '8e723e17d09370e9fc0f06aebb9f4028'),
  ('Mt. San Antonio College', '38084', '14078452c0768f9a9c1f648ea775231c'),
  ('Mt. San Antonio College', '38094', '56f3df23e731d33c785afb354ff754ea'),
  ('Mt. San Antonio College', '38097', '2ae597afd23d03da8b83f1615599c1f4'),
  ('Mt. San Antonio College', '39517', 'b1031953cd7612cfc4112a3a4a7d49ab'),
  ('Mt. San Antonio College', '40142', 'bf2b5e872ce1301ae82527fe158e14e8'),
  ('Mt. San Antonio College', '41116', 'fa676c21d0566c79c95ebe7a5e56b850'),
  ('Mt. San Antonio College', '41569', '1a13a7197fe8d3ea0841ccc34fa979b7'),
  ('Mt. San Antonio College', '42726', '62a980bee2fd0d75b2db981e47ce9320'),
  ('Mt. San Antonio College', '42727', 'fc4ab2326f12c00599866cbde824f82f'),
  ('Norco College', '30056', 'afe70bf8fc75f5b09b5c281462485c7f')
), gone as (
delete from public.program_requirement_records r
using target t
where r.college = t.college and r.control_number = t.control_number
  and md5(to_jsonb(r)::text) = t.row_md5
  and r.checked = false
  and not exists (select 1 from public.program_record_verdicts v
                  where v.college = r.college and v.control_number = r.control_number)
returning 1)
select count(*) as removed from gone;

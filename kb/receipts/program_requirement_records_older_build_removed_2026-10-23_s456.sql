-- S456 SkyYarrow, 2026-10-23: remove 17 live program records under Sam's Sheet 115 card 1 ruling of
-- 2026-10-23 12:23Z (remove; cpl_memory sam-sheet-115-rulings-2026-10-23; Open Asks Sheet 116 card 1 carries the same
-- card): the live rows the current display build (b0a96907bf83, applied on main by run 39957033237) leaves out, which
-- are the S449 list's rows still live (10 page-claimed in the latest capture whose filed record a newer extraction
-- replaced, and the 6 filed records placing none of their listed courses) and Victor Valley's Nursing Licensure 20545,
-- which read a department course list. Sierra's IT: Cybersecurity 11965 and 21557 (on the S449 list) were re-extracted
-- by run 39951768339 and stay; the other 7 of the S449 list were replaced by Sierra's re-reads (S454, S455) and stay.
-- The full rows, as read live just before the delete, are in kb/receipts/program_requirement_records_older_build_removed_2026-10-23_s456.json, which also holds the rollback
-- (jsonb_populate_record over each row_text). Guard: a row is removed only while its md5(to_jsonb(r)::text) equals
-- the read's, it is unchecked, and no verdict names it, so a row a person touched since the read is left alone.
-- Returns the count removed.
with target(college, control_number, row_md5) as (values
  ('Citrus College', '11244', 'd6d03aad64e36612b0f19dbb41f8192c'),
  ('Foothill College', '06092', 'd75cfb71de5f9ef4df237ab3bebb9c8b'),
  ('Grossmont College', '32879', 'a69b056f1862884277f66394232dd61a'),
  ('MiraCosta College', '19095', '6b5053cfd832c90102b4d8c3963a89e3'),
  ('MiraCosta College', '34012', '6185379cf46846426442c52f33d39db8'),
  ('Moorpark College', '39413', '3836ef0b48597fd10b0e4e41d2d77e3a'),
  ('Moorpark College', '45352', '0ffb110b3e44b3ebe5ffb4f537ef5c91'),
  ('Orange Coast College', '22394', '0b081852d2f74362cd507b515dfdb062'),
  ('Orange Coast College', '40981', '5b503600aa0eb0acfbab48c979ee9c9f'),
  ('Oxnard College', '18130', '5fcd1aa74016b57b95ef0bcb760da0a5'),
  ('Oxnard College', '45289', 'eae492cc354604668a0fba2299e778df'),
  ('Palomar College', '16856', 'f3301a38b9bb65a5d833168485c213a0'),
  ('Santa Barbara City College', '32629', 'cc3b6a11d9c7663ea3a0e22cd90aaf89'),
  ('Sierra College', '15307', '91f6f54ca9b8b354aa6b9b52ecad8a07'),
  ('Sierra College', '21533', 'bb27b5ea0fb8db8ead85a45930ea0145'),
  ('Ventura College', '45355', 'b4133675e83cd8a4290c9b9119193f95'),
  ('Victor Valley College', '20545', '94c0d25e8a8f2afa5c974453fcbef842')
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

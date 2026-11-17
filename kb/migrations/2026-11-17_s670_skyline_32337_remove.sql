-- S670 (SkyBunting), 2026-11-17. Skyline 32337 "Asian Engine Performance Technology" was read from the Automotive
-- Advanced Engine Performance Technology page (its reader's note says so); #3423 (d600083e) dropped it from the filing
-- when Advanced Engine 10529 took its page back under the #3408 yield. Its live row stays until this delete
-- (p-yield-holder-live-row-after-filing-s668). The other five records #3423 dropped (46296, 31587, 39658, 45668, 32479)
-- hold no live row (read 2026-11-17 03:2xZ). The row's full image, read just before, is
-- kb/receipts/program_requirement_records_before_skyline_32337_s670.json; the rollback file re-inserts it.
-- Guarded: deletes only the unchecked row with that page and extraction run, and raises unless exactly one goes.
do $$
declare n int;
begin
  delete from public.program_requirement_records
   where college = 'Skyline College' and control_number = '32337' and checked = false
     and extracted_run = 39032119511
     and source_url = 'https://catalog.skylinecollege.edu/current/programs/automotive-advanced-engine-performance-technology-ca.php';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'expected to delete 1 Skyline 32337 row, matched %', n; end if;
end $$;

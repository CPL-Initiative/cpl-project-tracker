-- map_colleges.mis_absent_why: American spelling on the two partner rows (S371, 2026-10-12)
--
-- WHY. College Identity prints mis_absent_why under each row with no MIS code,
-- and the two partner rows read "A partner organisation". Sam's standing rule
-- (2026-08-21) is American spelling, rendered UI text first. No other surface
-- reads the column (grep: college_identity.js is its one reader).
--
-- BEFORE (read 2026-10-12 at write time through execute_sql: select college_id,
-- college_name, mis_absent_why from map_colleges where mis_absent_why ilike
-- '%organis%' or matches the other British forms; these two rows and no others):
--   132  Launch Apprenticeship  A partner organisation we host a CPL landing page for, not a California Community College. No MIS code exists, and none should be invented.
--   133  Futuro Health          A partner organisation we host a CPL landing page for, not a California Community College. No MIS code exists, and none should be invented.
--
-- THE WRITE. Guarded and idempotent: each row is named by id, canonical name and
-- its exact before-value, so a row someone has since edited is left alone.

update public.map_colleges
   set mis_absent_why = 'A partner organization we host a CPL landing page for, not a California Community College. No MIS code exists, and none should be invented.'
 where college_id in (132, 133)
   and college_name in ('Launch Apprenticeship', 'Futuro Health')
   and mis_absent_why = 'A partner organisation we host a CPL landing page for, not a California Community College. No MIS code exists, and none should be invented.';

-- ROLLBACK (restores the before-value on exactly the rows this write changed):
-- update public.map_colleges
--    set mis_absent_why = 'A partner organisation we host a CPL landing page for, not a California Community College. No MIS code exists, and none should be invented.'
--  where college_id in (132, 133)
--    and mis_absent_why = 'A partner organization we host a CPL landing page for, not a California Community College. No MIS code exists, and none should be invented.';

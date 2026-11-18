-- Rollback of 2026-11-18_s680_cpl_receipts_bucket.sql (S680). Removes the cpl-receipts bucket while it
-- holds no object, and changes nothing otherwise.
--
-- A bucket that holds receipts is NOT rolled back by this file: those objects are the receipts that
-- kb/receipts/index/ names, and deleting them breaks Rule 10 (a2) for every display build stored
-- there. Restore the files to kb/receipts from the bucket first (kb/_receipt_store.py, Storage.get, each
-- checked against its index sha256), commit them, then empty the bucket through the Storage API
-- (POST /storage/v1/bucket/cpl-receipts/empty, then DELETE /storage/v1/bucket/cpl-receipts, with the
-- service key). Where Supabase's storage.protect_delete trigger refuses a direct delete, use the same
-- two API calls on the empty bucket.
delete from storage.buckets b
 where b.id = 'cpl-receipts'
   and not exists (select 1 from storage.objects o where o.bucket_id = 'cpl-receipts');

-- Applied: supabase-migrate run 44255184017 created the bucket on 2026-11-18 (run finished 07:17Z; noted 2026-11-18T07:20Z).
-- Its receipt is the migration_s680_cpl_receipts_bucket_44255184017.json file the runner committed.

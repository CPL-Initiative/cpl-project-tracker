-- PROJECT: cpl-budget-support (mdxutmbpoqjtdcwjscux), NOT Work Plan. Applied through
-- kb/migrations/.apply with `project=budget-support` (the MCP tool's prompt timed out twice).
--
-- COBIx security round 1, item 10 (docs/security/cobix_round1_reply_2026-11-05.md); security
-- step 4, Sam's go on Sheet 167 card 4. S603 SkyMaffei, 2026-11-07.
--
-- logos_anon_update was `using (bucket_id = 'logos')` with a check on the campaign folder
-- alone, while logos_anon_insert also requires the file name to be an invitee id. So anyone
-- could overwrite any logo inside a known campaign slug. UPDATE now carries the INSERT's
-- full expression as both `using` and `with check`, and both policies bind the invitee to
-- the campaign whose folder it writes in (invitees.campaign_id), so one invitee's id cannot
-- write into another campaign's folder. The path is exactly <campaign slug>/<invitee id>.<ext>.
--
-- Read live before: 0 objects in the logos bucket. The client path
-- (budget-support/web/app.js: `${campaign_slug}/${invitee_id}.${ext}`, upsert) passes both.
-- Rollback: 2026-11-07_budget_logos_update_policy_rollback.sql.

drop policy if exists logos_anon_insert on storage.objects;
drop policy if exists logos_anon_update on storage.objects;

create policy logos_anon_insert on storage.objects for insert to public
with check (
  bucket_id = 'logos'
  and array_length(storage.foldername(name), 1) = 1
  and exists (
    select 1
    from public.invitees i
    join public.campaigns c on c.id = i.campaign_id
    where c.slug = (storage.foldername(objects.name))[1]
      and i.id::text = split_part(regexp_replace(storage.filename(objects.name), '\.[^.]+$', ''), '/', 1)
  )
);

create policy logos_anon_update on storage.objects for update to public
using (
  bucket_id = 'logos'
  and array_length(storage.foldername(name), 1) = 1
  and exists (
    select 1
    from public.invitees i
    join public.campaigns c on c.id = i.campaign_id
    where c.slug = (storage.foldername(objects.name))[1]
      and i.id::text = split_part(regexp_replace(storage.filename(objects.name), '\.[^.]+$', ''), '/', 1)
  )
)
with check (
  bucket_id = 'logos'
  and array_length(storage.foldername(name), 1) = 1
  and exists (
    select 1
    from public.invitees i
    join public.campaigns c on c.id = i.campaign_id
    where c.slug = (storage.foldername(objects.name))[1]
      and i.id::text = split_part(regexp_replace(storage.filename(objects.name), '\.[^.]+$', ''), '/', 1)
  )
);

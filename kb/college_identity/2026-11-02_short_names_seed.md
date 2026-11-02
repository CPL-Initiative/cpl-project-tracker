# Receipt: the college short names seeded into Supabase (S545 SkyWhirlpool, 2026-11-02)

**What.** `public.college_short_names` created and seeded with the 118 rows of `kb/college_short_names.json` as
committed at `d03d4038` (insert-only, `on conflict (canonical) do nothing`, cohort `updated_by = short-names-s545@bot`),
with `public.college_short_names_log` and the guard trigger. File: `kb/migrations/2026-11-02_college_short_names.sql`,
applied by `supabase-migrate.yml` run 41386050121 at 04:02Z (receipt
`kb/receipts/migration_s545_college_short_names_41386050121.json`, response `rows 118, seeded 118`). The MCP
`apply_migration` had timed out on a confirmation no one answered; the runner is Sam's route for that (Rule 10 c).

**Read back (04:05Z).** 118 rows, all 118 under the cohort; one md5 over `canonical|short|short_caps|aliases` in byte
order matches the committed file: `be01ce37584678d61019df44296b3118` on both sides. Policies: read for anon and
authenticated; update for an authenticated `is_allowed_reviewer()`; the log reads for a reviewer only. Grants: anon
holds no UPDATE; authenticated holds UPDATE on `short` alone (not `aliases`); nobody but the owner executes the trigger
function.

**The trigger, probed without a write.** Each probe ran an UPDATE inside a statement made to fail at its end, so the
error carried the values and the statement rolled back (the repo's guard refuses a `do` block):
- Allan Hancock to `  Hancock   `: `short=[Hancock] caps=[HANCOCK] aliases={"Allan Hancock College","Allan Hancock"}
  by=postgres`, so it trims, sets the CAPS form, and keeps the old short as an alias.
- Butte to `Desert`: refused, *College Of The Desert already answers to "Desert"; pick another short for Butte College.*
- Afterwards both rows read as seeded and the log held 0 rows.

**Rollback.** `kb/migrations/2026-11-02_college_short_names_rollback.sql` (drop the trigger, the function and both
tables); read the log first and carry any edit back into the seed script. The seeded rows alone roll back by
`updated_by = 'short-names-s545@bot'` where no reviewer has written since.

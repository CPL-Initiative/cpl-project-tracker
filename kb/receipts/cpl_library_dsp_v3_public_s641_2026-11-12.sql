-- Receipt: cpl_library, slug dsp-credit-starting-points, id b5c7659f-b711-4eb0-9916-4daa3e0123db
-- Session 641 (second firing, the conductor), 2026-11-12 11:16:56Z, through the Supabase connector.
-- Why: Sam's Revise and remediate request of 2026-11-11T15:30:36.641Z (approved 15:31:40Z in the Library tab)
-- was carried out by PR #3151: the public copy is Version 3, remediated. Step 6 of
-- docs/reference/scheduled_sessions.md ("Done: add the version, empty refresh_note and set regen to null").
--
-- THE WRITE (one guarded UPDATE, one row returned):
--   update cpl_library set versions = versions || [the entry below], version = '3',
--     refresh_note = null, regen = null, updated_by = 'library-s641@bot'
--   where slug = 'dsp-credit-starting-points' and retired_at is null
--     and updated_at = '2026-11-11 15:31:40.980059+00'
--     and regen->>'requested_at' = '2026-11-11T15:30:36.641Z';
-- Entry appended as versions[3]:
--   {"url":"https://cpl-initiative.github.io/cpl-project-tracker/library/dsp-credit-starting-points/",
--    "date":"2026-11-12","label":"Version 3, remediated","status":"Public copy replaced under the approval ..."}
-- After: version '3', 4 versions, refresh_note null, regen null, updated_at 2026-11-12 11:16:56.568998+00.
--
-- BEFORE-VALUES (read 2026-11-12, before the write): version '2'; 3 versions (the new entry is the 4th);
-- updated_by 'Sam'; updated_at '2026-11-11 15:31:40.980059+00'; refresh_note and regen as in the ROLLBACK.
--
-- ROLLBACK (restores the four fields and drops the appended version; guarded on this write's stamp).
-- It reopens the request in the Library tab. The public page itself rolls back with `git revert` of #3151.
update cpl_library set
  versions = versions - 3,
  version = '2',
  refresh_note = 'Fix what the accessibility check found: 8 links or buttons are under 24 by 24px (“Links” is 43 by 23.9px).',
  regen = $json${
    "earlier": [
      {"note": "update this using the new format and any new data as well as Request Adopt Links wherever possible and any needed links to CPL Pathways or Credential Catalog.",
       "draft_id": "23da6c87-c6de-4d71-8c8b-ea56d3729255", "ready_at": "2026-11-06T23:55:58.299Z", "documents": [], "draft_url": null, "requested_by": "Sam"},
      {"note": "Fix what the accessibility check found: 3 links or buttons are under 24 by 24px (“Links” is 38 by 23.9px).",
       "draft_id": "2eca278b-8919-4f81-b5c0-a56efeae6073", "ready_at": "2026-11-06T23:56:34.861Z", "documents": [], "draft_url": null, "requested_by": "Sam"},
      {"note": "update this using the new format (like ELL IET visual uses) and add any new data as well as Request Adopt Links wherever possible and any needed links to CPL Pathways or Credential Catalog.",
       "draft_id": "ad437f06-2256-42d4-8b46-1dda758d3b8d", "ready_at": "2026-11-06T23:58:51.245Z", "documents": [], "draft_url": null, "requested_by": "Sam"},
      {"note": "You said you needed the link to the ELL visual so I added it to the Documents to work from field, but now you're saying I'm not asking for any new changes. That's because my previous 3 attempts to make those changes have not been effective.\nupdate this using the new format (like ELL IET visual uses) and add any new data as well as Request Adopt Links wherever possible and any needed links to CPL Pathways or Credential Catalog.",
       "draft_id": "60a8a0d5-90d0-4a16-a974-5ecbda81fe99", "ready_at": "2026-11-07T12:29:38Z", "documents": ["ell iet cpl starting points"], "draft_url": "https://claude.ai/artifact/Q4k83eM8s5V6bQhrGMyJNe", "requested_by": "Sam"}
    ],
    "publish": "show",
    "draft_id": "2d2d261c-8cfb-4854-b1e3-dbf73ba3b42f",
    "ready_at": "2026-11-11T15:30:58.599Z",
    "draft_url": null,
    "drafted_by": "Sam",
    "approved_at": "2026-11-11T15:31:40.776Z",
    "approved_by": "Sam",
    "drafted_with": "library-revise-draft",
    "requested_at": "2026-11-11T15:30:36.641Z",
    "requested_by": "Sam",
    "based_on_draft": "60a8a0d5-90d0-4a16-a974-5ecbda81fe99"
  }$json$::jsonb,
  updated_by = 'Sam'
where id = 'b5c7659f-b711-4eb0-9916-4daa3e0123db'
  and updated_by = 'library-s641@bot'
  and updated_at = '2026-11-12 11:16:56.568998+00';

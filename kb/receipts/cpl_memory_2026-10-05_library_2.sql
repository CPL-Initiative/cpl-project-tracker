-- Library side session (SkyShelf, beside S336), 2026-10-05: Sam's calls 4 and 5 on where files live.
-- Human-sourced, so status verified with verified_by Sam. Rollback: supersede each row by slug.
insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status, verified_by, verified_at)
values
('sam-all-deliverables-go-to-drive-2026-10-05',
 'Sam: every deck, film and document made on this account goes to the team Drive, drafts in a Drafts subfolder, never into a repo',
 'decision',
 'Sam, 2026-10-05: "I think all artifacts like this created on this account should go to the Drive instead of the repos". Then "4 Y": drafts go to Drive too, in a Drafts subfolder the team alone opens, in place of private Claude players. The repos keep the source that rebuilds each piece; the Library links the Drive file.',
 'Drive folder 1WNtaaKMGSYsKsdJLxi4fbR24fXD4fGUZ. How a file gets there: a session on Sam''s machine saves into the Drive-synced folder; a cloud session sends Sam the file and he drops it in. Call 6, "6 y": the manual hand-off now, and an automatic upload (a workflow with a stored Google sign-in for the camapinitiative account) only if the hand-off grates. Exception: a film a public page plays stays where the page serves it (the funding explainer''s cuts). Claude artifacts (decision sheets, mockups) stay on claude.ai.',
 'From now on the decks, films and documents we make are saved in the team''s Google Drive folder, drafts included, and the code repositories keep only what rebuilds them.',
 array['library','drive','deliverables','drafts','policy'], array['library.js','docs/reference/lanes/library.md','CPLBrain/CLAUDE.md'],
 'Sam, in session, 2026-10-05', 'SkyShelf-library', '2026-10-05', 'verified', 'Sam', now()),
('sam-move-existing-deliverables-to-drive-2026-10-05',
 'Sam: move the deliverable files already in the repos to Drive, the public tracker first, then the vault',
 'decision',
 'Sam, 2026-10-05, call 5: "5 Y" to moving the files already in the repos to Drive: the public tracker first (decks, the CAC run sheet, the Title 5 tracked-changes documents, the Noncredit Summit cuts), then the vault''s binaries. Removal from main stops new downloads; git history keeps the files (no rewrite, Rule 5).',
 'Order: Sam drops each batch into the Drive folder; a session finds each file in Drive, files its link in the Library, then removes it from the repo in a PR with a guard test so a deliverable binary cannot be committed again. Pipeline outputs (reports/*.docx) and source documents under docs/reference stay; they are inputs, not deliverables.',
 'Files already saved in the code repositories move to the team Drive, starting with the public one.',
 array['library','drive','deliverables','public-repo','migration'], array['docs/reference/lanes/library.md','tests/committed_media_policy.test.js'],
 'Sam, in session, 2026-10-05', 'SkyShelf-library', '2026-10-05', 'verified', 'Sam', now());

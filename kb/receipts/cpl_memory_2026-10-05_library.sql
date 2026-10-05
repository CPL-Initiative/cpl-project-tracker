-- Library side session (SkyShelf, beside S336), 2026-10-05: Sam's three rulings on the COBI Library tab.
-- Human-sourced, so status verified with verified_by Sam. Rollback: supersede each row by slug.
insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status, verified_by, verified_at)
values
('sam-library-tab-build-2026-10-05',
 'Sam: build the COBI Library tab, a register of links to every deck, film and document',
 'decision',
 'Sam, 2026-10-05, asked: "I think I may need a COBI tab to store and retrieve artifacts like this ppt and video. Advise". After the mockup (https://claude.ai/artifact/VPpbDp7DD4acvHErVFkCqH) he answered "1 yes": build it. One record per piece, behind the team phrase; the file stays where it lives.',
 'A record holds title, kind, occasion, date, version, status, Seen by, where the file lives, who made it, the ruling, figures as of, rebuild path and versions. Links rather than uploads, measured again 2026-10-05: the session proxy rejects *.supabase.co (connect_rejected), so a Storage upload is a file no session can put or read; contract-docs and factsheet-images hold 0 objects. Same finding as the 2026-08-06 nc_artifacts design (kb/supabase_nc_artifacts.sql). The deck that prompted the ask (20261005_Noncredit_Summit_CPL_Slides_1) was in none of the three repos nor the team Drive.',
 'Sam asked for one COBI page that lists every deck, film and document we make, with a link to where each file lives and who it is for.',
 array['library','cobi','deliverables','decks','films'], array['library.js','kb/supabase_cpl_library.sql','docs/reference/lanes/library.md'],
 'Sam, in session, 2026-10-05', 'SkyShelf-library', '2026-10-05', 'verified', 'Sam', now()),
('sam-drive-is-home-for-approved-files-2026-10-05',
 'Sam: approved decks and films live in the team Drive folder; the repo keeps the source that rebuilds them',
 'decision',
 'Sam, 2026-10-05, call 2: "Drive (https://drive.google.com/drive/folders/1WNtaaKMGSYsKsdJLxi4fbR24fXD4fGUZ)". The folder already holds 20251009 Sonya Christian Noncredit Summit.pdf. A session reads Drive through the Drive connector; a person drops a large file in (a 16 MB film is too big to push through the connector).',
 'Folder id 1WNtaaKMGSYsKsdJLxi4fbR24fXD4fGUZ, owner camapinitiative@gmail.com. The Library row links the Drive file; the build source (build.py, scripts, voice clips) stays in the tracker repo.',
 'Finished decks and films go in the team''s Google Drive folder, and the Library links to them there.',
 array['library','drive','deliverables'], array['library.js','docs/reference/lanes/library.md'],
 'Sam, in session, 2026-10-05', 'SkyShelf-library', '2026-10-05', 'verified', 'Sam', now()),
('sam-no-drafts-in-the-public-repo-2026-10-05',
 'Sam: stop committing draft decks and films to the public tracker repo, and take the existing drafts off main',
 'decision',
 'Sam, 2026-10-05, call 3: "yes" to "Stop committing drafts to the public repo, and take the existing ones off main?" The tracker repo is public, so every committed film draft is downloadable from github.com. Drafts reach Sam as a private Claude player; an approved piece goes to Drive; a film a public page plays may stay where the page reaches it.',
 'At the ruling: 96.9 MB of mp4/mp3 on main in 31 files. Drafts then on main: the Noncredit Summit music and narrated cuts (v1). The funding films the public explainer plays (v4, Scenario 2 v7, narrated draft 4 approved on sheet 4 card 4) are public by design. History keeps removed files; no history rewrite (Rule 5).',
 'Unfinished videos and decks no longer go into the public code repository; Sam sees drafts privately, and only finished ones are filed.',
 array['library','drafts','public-repo','films','policy'], array['prototype/noncredit_video/README.md','tests/committed_media_policy.test.js'],
 'Sam, in session, 2026-10-05', 'SkyShelf-library', '2026-10-05', 'verified', 'Sam', now());

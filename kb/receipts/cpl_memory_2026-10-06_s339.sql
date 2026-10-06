-- S339 SkyReel, 2026-10-06: the Noncredit Summit film's re-cut (PR #1891).
-- Sam's rulings are verified (verified_by Sam). INSERT-only; rollback: supersede each row by slug.
-- Two of these rows replace earlier human-sourced rows for this film, and say so: the voice
-- (sam-ladypatty1-narrates-noncredit-film-2026-10-05 stays verified as the v1 record) and the narrator's
-- name (sam-sierra-names-every-cpl-narrator-2026-10-05 stays verified for the funding film's Sierra).
insert into public.cpl_memory (slug, title, kind, summary, detail, plain, tags, affects, source, author, event_date, status, verified_by, verified_at)
values
('sam-summit-film-voice-sarah-explains-2026-10-06',
 'Sam: the Noncredit Summit film''s v2 narrator is the ElevenLabs voice Sarah Explains',
 'decision',
 'Sam, 2026-10-06, asked for "another female voice in standard English. A little upbeat in tone--not over the top." From four auditions he chose by ear: "Let''s go with 3 voice" = Sarah Explains (Nhs7eitvQWFTQBsf0yiT), eleven_multilingual_v2.',
 'Auditioned: Vivie 2, Cassandra, Sarah Explains, the premade Sarah (flow sTzxenbdys7vMV1iEOU2). Replaces ladypatty1 for the v2 cut; sam-ladypatty1-narrates-noncredit-film-2026-10-05 stays verified as the record of v1. Sarah Explains is a library voice its owner can withdraw, so the clips are committed in prototype/noncredit_video/voice/.',
 'The Summit film''s new narrator is a standard-English voice called Sarah Explains.',
 array['noncredit-summit','film','elevenlabs','voice'], array['prototype/noncredit_video/narration.json'],
 'Sam, in session S339, 2026-10-06', 's339-2026-10-06', '2026-10-06', 'verified', 'Sam', now()),
('sam-summit-film-narrator-unnamed-2026-10-06',
 'Sam: the Noncredit Summit film''s narrator goes unnamed',
 'decision',
 'Sam, 2026-10-06: "Let''s take out naming the narrator Sierra and make her anonymous." The v2 narrated cut drops the title''s name line and the spoken introduction; the close still says the voice is synthetic ("The narrator is a synthetic voice made with ElevenLabs.").',
 'Applies to the Noncredit Summit film. sam-sierra-names-every-cpl-narrator-2026-10-05 stays verified for the funding film, which names Sierra; a later film asks Sam which rule it follows.',
 'The Summit film''s narrator has no name on screen or in the voice; the film still says the voice is synthetic.',
 array['noncredit-summit','film','narrator'], array['prototype/noncredit_video/build.py','tests/noncredit_video_page.test.js'],
 'Sam, in session S339, 2026-10-06', 's339-2026-10-06', '2026-10-06', 'verified', 'Sam', now()),
('sam-summit-film-greeting-and-celebration-2026-10-06',
 'Sam: the Noncredit Summit film opens on his greeting and a celebratory line leads the funding',
 'decision',
 'Sam, 2026-10-06: the narrated film opens on his greeting ("Start with Greetings Noncredit CPL Heroes...", thanking the legislative partners for the additional $35 million) and "Add a short celebratory phrase before announcing the funding."',
 'His words: "Start with Greetings Noncredit CPL Heroes. It''s a great day for our system as we continue to build out our shared CPL tools to serve noncredit learners. Special thanks to our legislative partners who supported the Board of Governor''s and Chancellor Christians request for an additional $35 million CPL funding..." The title clip reads his greeting, then the film''s turn line (Here''s how noncredit learning becomes college credit). The funding clip opens on "Now, something to celebrate!"',
 'The narrated film now opens with Sam''s greeting and thanks to the Legislature.',
 array['noncredit-summit','film','narration'], array['prototype/noncredit_video/narration.json'],
 'Sam, in session S339, 2026-10-06', 's339-2026-10-06', '2026-10-06', 'verified', 'Sam', now()),
('sam-summit-film-ongoing-7m-2026-10-06',
 'Sam: the Noncredit Summit film says $7 million ongoing',
 'decision',
 'Sam, 2026-10-06: "The ongoing funding in the video states $2M and should be $7M." The 2026-27 budget''s $2 million increment brings ongoing CPL operations to $7 million (m3; two-installment-funding-story). His revised deck''s funding slide says $7 million ongoing too.',
 'The film''s funding scene and narration read $35 million one-time and $7 million ongoing (PR #1891).',
 'The film now says the state provides $7 million a year in ongoing CPL funding.',
 array['noncredit-summit','film','cpl-funding'], array['prototype/noncredit_video/build.py'],
 'Sam, in session S339, 2026-10-06', 's339-2026-10-06', '2026-10-06', 'verified', 'Sam', now()),
('sam-industry-cert-credit-is-for-the-cert-2026-10-06',
 'Sam: credit colleges award CPL for the industry certification a noncredit learner earns, never for the noncredit instruction',
 'decision',
 'Sam, 2026-10-06: "credit colleges are not giving credit for the noncredit instruction but rather for the cert that students earn as a result of their NC studies. Some students will not pass the CompTIA exam and will not get credit." Nadia''s label in the Summit film is Industry certificate.',
 'His full words, on Nadia''s label: "Nadia''s should be industry cert since credit colleges are not giving credit for the noncredit instruction but rather for the cert that students earn as a result of their NC studies. Some students will not pass the CompTIA exam and will not get credit. The only exception would be if the NC class had a final exam that could be treated as Cx...but not in Nadia''s use case." A noncredit IT path reaches credit through the certification exam, so a learner who does not pass earns no CPL. A noncredit course''s own final exam could serve as credit by exam (Cx), which is a different route from Nadia''s. The film labels her path Industry certificate.',
 'Colleges give credit for the industry certification a student earns, not for the noncredit class itself.',
 array['noncredit','industry-certification','cpl-types','credit-by-exam'], array['prototype/noncredit_video/build.py','docs/noncredit_cpl_thinking.md'],
 'Sam, in session S339, 2026-10-06', 's339-2026-10-06', '2026-10-06', 'verified', 'Sam', now())
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select m.id, 's339-2026-10-06', 'create', 'S339 SkyReel, 2026-10-06', to_jsonb(m)
from public.cpl_memory m where m.author = 's339-2026-10-06'
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');

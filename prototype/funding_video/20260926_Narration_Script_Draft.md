# CPL Funding in Motion — narration script (DRAFT, not yet approved)

Drafted 2026-09-26 (S293) at Sam's request: *"make a draft version with a natural
feminine voice-over that follows a script your write... tone down the music to just
background level... slow down and lengthen the timing a bit to accommodate
readability and narration."* The 90-second introductions stay as they are; the
narrated cut is a separate draft beside them.

**Status:** the voice is chosen: Heart (`af_heart`, Kokoro-82M, Apache-2.0, run locally
in the container; the environment now allows `huggingface.co`, `*.huggingface.co` and
`*.hf.co`). The v2 read awaits Sam's OK; then the video is built to it. A human
recording can still replace it scene by scene.

**Length:** v2 measures 2:55 (164 s of speech at speed 1.0, plus about 1.1 s between scenes). The
voice carries the ideas and the screen carries the exact figures. The spoken form the voice
reads is `narration_s1.json`.

**Sam, 2026-09-26:** *"Voice Heart is a good sample to use. MAP should be read as the word
'map', not sounded out letters. Make the script more natural, less stilted."*

**Sam on v2 (2026-09-26):** *"Narration still a bit stilted, especially when sounding out
C-P-L rather than just saying it quickly--same with sounding out the year numbers--too
stilted."* Fix for v3, measured in the tokenizer: write `CPL`, `EDD`, `FTES` unspaced (one
quick word each; the spaced form gives every letter a full stress), keep `map` lowercase,
and soften the years (phoneme input with a lighter first stress, or "twenty-six to
twenty-eight"). Details in `docs/session_293_handoff.md`.

**Plan for the build:** the narration drives the clock (each scene lasts its clip
plus air); reveals are cued to the words that name them; the score plays as a bed
about 14 dB under the current mix and dips further under the voice; captions ship
on the page and as a soft subtitle track in the MP4; a one-line credit says the
narration uses a synthetic voice, if the AI voice is used.

## Scenario 1 (v2, the conversational read Sam asked for)

**Title.** Let's walk through how CPL Initiative funding works for twenty twenty-six to twenty twenty-eight, and what it means for your college.

**The funding.** The state set aside thirty-five million dollars in one-time funding for twenty twenty-six, twenty-seven. Just over twenty-five million of it goes straight to a hundred and eighteen institutions. The rest funds statewide CPL projects and technology, plus two Chancellor's Office positions that support colleges.

**Maximum allocation.** Every institution has a maximum allocation for the two years. It's based on the institution's share of instruction, credit and noncredit together, and it falls between a hundred and fifty thousand dollars and four hundred thousand. Sample College's maximum, for example, is about three hundred forty-five thousand.

**Credit and noncredit.** That maximum splits into a credit share and a noncredit share, following each institution's own mix of instruction. And only noncredit outcomes count toward the noncredit share.

**Three priorities.** Three priorities carry the funding. Access counts applied CPL units from students who start at the CPL Portal, at your college's landing page, or through a batch upload. Completion counts transcribed CPL units, with the MAP counselor step checked. And career attainment counts CPL units for students who go on to a career outcome, which the Chancellor's Office measures through EDD wage records.

**Targets.** Each priority has a target, measured in FTES. Thirty semester units of CPL make one FTES, or forty-five if you're on the quarter system. Here's the part to remember: reach half of a target, and your college qualifies for half that share. Go past the target, and the share stays where it is. It's the ceiling.

**The baseline.** Before any funding is released, your college meets a baseline, due November first, twenty twenty-six. Name a CPL coordinator, then list that person in MAP and on your college's CPL landing page. Put your local confirmation of participation on file. And make sure at least seventy-five percent of your enrolled veterans have their Joint Services Transcripts uploaded in MAP. Until the baseline is met, the funding your college demonstrates is held in reserve for it.

**Timing.** The full two-year amount is available from year one. The Chancellor's Office releases funding twice a year, based on your college's CPL to date, and whatever remains after year one carries forward to year two for your college.

**Support.** And you won't be doing this alone. Every priority comes with recommended strategies, a CPL Initiative help team supports every college, and more detailed guidance is on the way.

**Find your college.** To see your college's maximum allocation, targets, and progress, visit the CPL funding model page.

## Scenario 2 (only the priorities scene changes)

**Two priorities.** Two priorities carry the funding, at fifty percent each. Access
counts applied CPL units from students who start at the CPL Portal, a college
landing page, or a batch upload. Completion counts transcribed CPL units with the
MAP counselor step checked. The project allocation funds career attainment and
innovation projects statewide; they add nothing to an institution's allocation.

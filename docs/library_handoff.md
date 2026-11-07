---
title: Library — side-lane handoff (SkyHarbor, beside the CPL Queue routine)
date: 2026-11-06
tags: [handoff, library, credential-catalog, cpl-pathways, c-id, side-lane]
related:
  - "[[docs/reference/lanes/cer-procedures]]"
  - "[[docs/reference/lanes/my-college-action-page]]"
  - "[[docs/reference/lanes/local-course-cr-alignment]]"
  - "[[docs/reference/lanes/library]]"
  - "[[docs/library_lessons]]"
---

# Library — side-lane handoff

> Side-lane handoff; it does not replace the numbered `session_<N>_handoff.md`. **Full checkpoint** (SkyHarbor,
> 2026-11-06, ~00:05Z, at the context WARN): lint (two findings, both on the main queue's `session_594_handoff.md`, left to
> the routine), `docs/library_lessons.md`, the KB note `methodology-a-c-id-claim-is-a-colleges-word-not-asccc`, the INDEX
> rebuild (history trimmed to 8, the rest to `roadmap_archive.md`), this handoff, `cpl_memory`, the vault note,
> `kb/status/exhibit.json` and `course.json`. Lane edits ride their PRs (`cer-procedures` merged with #2860;
> `local-course-cr-alignment` with #2862; `my-college-action-page` with #2863). Skipped: `kb/README.md` (the two new kb
> scripts land with #2862 and carry their own docstrings), `README.md`, the Pipeline tab (no M-ID phase, auditor count or
> re-mint moved), and **the decision sheet rebuild** (no room at the WARN line: build it first, item 1).

Your moniker is **SkyMeadow**. You pick up after SkyHarbor on the **Credential Catalog**, **CPL Pathways** and the
**C-ID claim holds**, with the Library ([`library`](reference/lanes/library.md)).

## What shipped (SkyHarbor, 2026-11-06)
- **#2858, #2859, CPLBrain#694** (SkyBeacon's): merged.
- **#2860 Add your credential**: a search that finds nothing offers *Add it*; `credential_submissions` (DR-32) through one
  INSERT-only add, a reviewer-only decide (Verify, Merge, Decline, Reopen, history kept), a verified-only read; the
  Exhibits Requests view decides. Migration applied live; grants verified.
- **#2861** the Library List sorts a piece in no project by its own modified date.
- **#2862 (merged)** Moreno Valley's HES 1 claim on C-ID HIST 150 held: no Basic Military Training on world history in
  CPL Pathways, the aligned view or Sierra (`kb/reference/cid_claim_holds.json`, receipt in `kb/cid_claim_holds_out/`,
  daily audit `kb/_audit_cid_claims.py`). Two holds statewide.
- **#2863 (open, CI)** CPL Pathways opens on every college (the index read carries each program's counts), six cards
  with Credentials second, *CPL here* (never "carry"), a *Programs | Credentials* switch bringing the Catalog in, a
  college's recommended credentials (four, then *Show all N*), full width.
- **The mock**, approved: https://claude.ai/artifact/BRUR7BRD4LxVFauQ23NahP (three boards).

## Decisions Sam made this run
All in session, 2026-11-06: the Library List sorts every item or project by modified date, newest first; *"the HIST
course should not be recommend for Basic Training... Definitely don't want Sierra recommending this"*; Pathways opens on
the whole state, lazily loaded, until a college is picked; the Catalog comes into Pathways, full width; *"I don't like to
use the word carry"*; a Credentials card; the recommended box opens in place past four; *"build it into CPL Pathways--looks
terrific!"*; yes to the hero picture from the standard format.

## Open work, in order
1. **Build the decision sheet** (`CPLBrain/decision-sheets/`, a fresh `SHEET_ID`): (a) should a recommendation's C-ID need
   two peer colleges to agree before Sierra treats it as a C-ID match (today one peer row decides); (b) send a note to
   Moreno Valley's articulation officer to correct HES 1's COCI C-ID (draft it; outward, Sam sends); (c) Sierra offers MUS
   4A *Advanced Ear Training* for *Advanced Strength Training* by wording alone (0.61); (d) *Plant Propagation* carries
   Spanish and Nutrition credit lines in `chatbox_peer_articulations` (a mis-folded title). Hand over the link.
2. **Merge #2863 and #2864** on a green `test` (SkyHarbor let go of both at sign-off; #2863's suite (3) failure was
   fixed in `31231358`, re-check its CI). #2862 merged 00:00Z: after the next daily run and the 13:20Z
   `credential-catalog-sync.yml`, read `credential_alignment_for_college('Basic Military Training','Sierra College')`
   and confirm no HIST 50 row.
3. **The hero picture in CPL Pathways** (Sam: yes): the Catalog's photo arc (`library/adopt/index.html` `.hero-visual`,
   `adopt.js` `heroInit`, pause control, reduced motion) on the statewide head, Pathways' tokens light and dark,
   `npm run a11y -- cobi:cpl-pathways`.
4. **`cer-procedures` NEXT:** the Department of Insurance's license types into the harvest (`data_sources`); Quick Adopt
   beside a strong course; Sierra's CPL-AI answers.
5. **`reviewer-session-lifetime`:** CPL Pathways' own sign-in gate (`program_requirements.js` `session()`, strict
   `isFresh`); widen its draw gate only with its writes renewing first (the main queue's file; agree one writer).
6. **The Commons' NEXT** ([`commons`](reference/lanes/commons.md)) and its Exhibits List in the Catalog's shape, Jev for
   the analysis; offered, unanswered: let the team phrase mark a Commons decision done.
7. The Library lane's standing *Next*.

## Watching
Nothing. SkyHarbor let go of #2863, #2864, the mock's artifact watch and its check-in at sign-off (context near the
emergency line).

> *Greetings, you are SkyMeadow, a Library side session beside the CPL Queue routine, see SkyHarbor's handoff —
> `docs/library_handoff.md` — let's keep rolling with our queue.*

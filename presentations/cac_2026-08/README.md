# CAC apprenticeship-pathways slides — 13 August 2026

Rebuild of slides 6/7/8 of `20260803_CAC_CPL_Presentation.pptx` (the pre-apprenticeship →
baccalaureate pathway diagrams) for the California Apprenticeship Council, plus speaker notes
for the whole 15-minute slot.

Audience: trade representatives, employers, CCC and state staff in the apprenticeship space,
including DAS. Presented by Crystal Nasio (slides 5→end).

## What's here

| File | What it is |
|---|---|
| `spec.py` | Content + palette spec. All slide text, transcribed from the original flattened PNGs. |
| `build.py` | Builds the new slides into the source deck with `python-pptx`, then injects the click-build `<p:timing>` XML. |
| `notes.py` | Speaker notes, one entry per slide, plus the pre-apprenticeship background block. |
| `apply_notes.py` | Writes `notes.py` into the deck's notes slides. |
| `runsheet.html` | Source for the printable run sheet. Rendered with headless Chromium (`--print-to-pdf`). |
| `20260810_CAC_Crystal_Run_Sheet.pdf` | Two-page run sheet: timing ladder + numbers, page 2 the pre-apprenticeship brief. |

## What's deliberately not here

The built decks (`..._Animated_Notes.pptx`, `..._Static_Notes.pptx`) are ~27 MB each because the
source deck embeds a 23 MB MP4. They were delivered to Sam directly and are **not committed** —
this repo is cloned into the Obsidian vault, and derived binaries of that size are exactly what
[`playbook-keep-build-artifacts-out-of-the-vault`](../../docs/kb-notes/playbook-keep-build-artifacts-out-of-the-vault.md)
says to keep out.

The **source deck is also not in the repo** — it arrived as a session upload. So these scripts
document the method and hold the authored content; they are not one-command reproducible without
that file. Drop the original next to them as `source.pptx` and `python3 build.py -o out.pptx`
works again.

## Method

Full write-up:
[`methodology-rebuild-a-flattened-diagram-as-a-built-slide`](../../docs/kb-notes/methodology-rebuild-a-flattened-diagram-as-a-built-slide.md).
Narrative: [`docs/cpl_presentations_lessons.md`](../../docs/cpl_presentations_lessons.md).

Short version — the three originals were single full-bleed PNGs, so every word was pixels and the
course tables ran off the bottom edge of the slide. Rebuilt as native shapes on the deck's own
master (Cambria/Calibri, CCC navy + gold, master logo intact), with the reference tables moved to
appendix slides and each pathway slide built in three clicks: **the road → who does what → what
it's worth.** The originals are retained in the deck as hidden slides at the end.

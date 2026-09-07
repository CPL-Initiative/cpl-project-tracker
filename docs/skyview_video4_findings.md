---
title: "Video v4 — SkyView, 6m18s, 2026-09-06: the review the deferred commit came from"
created: 2026-09-07
updated: 2026-09-07
tags: [skyview, video-review, findings]
---

# Video v4 — SkyView, 6m18s, 2026-09-06

Source: `Recording 2026-09-06 120139.mp4` · 21 frames · 120 spoken segments ·
faster-whisper `small` on CPU, all processing local.

⚠️ **THIS IS NOT `skyview_video2_findings.md`.** That reviews a *different,
earlier* recording (6m50s, 138 segments). The two were conflated for most of
S236 because the local session's branch was named `video-project-2-frames` while
the run it actually worked from was this one. The committed v2 transcript
contains **zero** hits for `wait on that step`, `dismiss the box`,
`multiple options` or `firing the routine`.

⚠️ **The deferred-commit note said its work was "item 2 only" and the rest was
unworked.** Read end to end, that is too pessimistic: **most of this review was
already shipped** by #1502 and #1503. Three items remain, and one of them Sam
decided against on camera.

---

## Shipped — do not re-open

| # | What he said | Where it landed |
|---|---|---|
| 1 | Sort by name belongs **upper right**; put an **Enter button** where it was, and Enter closes the window | #1502 |
| 2 | **The list skips on every pick** — *"it shouldn't skip up into the list, which I then have to scroll back down to get to. It should stay on the list."* | #1503 |
| 3 | **Enter keeps the box open, which it shouldn't** | #1503 |
| 4 | Background switches color — *"it should really stay with that charcoal wash"* | shipped; `haloAround()` quotes this verbatim and clamps the glow |
| 5 | **Text zoom chip** by the zoom options, *"to enlarge the text if they want to"* | S235 — three steps, 0.85/1/1.25, per browser |
| 6 | **Double-click should open the course outline of record**, not the disciplines page — *"let's do that in this session if we can"* | #1502 |

## ⛔ Open — and item 7 is the substantial one

**7 · A rehome gives no staged-to-move state on the course itself.** [04:24–04:49]

> *"Now I'm moving it over here and it looks like it was moved over there. **It
> didn't really change over here**, which I would expect it to change and to give
> me a confirmation that it was moved and **to change this outline to show it was
> staged to move**. So that's a good, or that needs to be fixed, I think."*

⚠️ **THE FRAMES CORRECT THE TRANSCRIPT-ONLY READING OF THIS.** A first pass from
the words alone concluded the confirmation was missing. It is not — frame 17
shows it rendered along the bottom of the screen, verbatim:

> *Moved **WELD 098 F** (Fullerton College) to **Introduction to Welding** in
> Welding. Recorded below the map.*

So `applyMove()`'s `setHint()` fires and is on screen. Three narrower things are
actually wrong, and only the middle one is cosmetic:

1. ⭐ **The course's own mark never changes.** Nothing in `applyMove()` or the
   draw path gives a moved course a staged-to-move state. `movedTo[cn]` changes
   which identity `membersOf()` returns it under — it *relocates* — but it never
   says "staged, not saved." **This is the ask, and it is unbuilt.**
2. **The confirmation is where he was not looking** — a single line below the
   legend, below the map, while his attention was on the point he had just
   dragged. A true statement in the wrong place reads as no statement.
3. ⚠️ **"Recorded below the map" points off screen in SkyView proper.** The
   *What this would write* panel lives in `.stage`; under `body.u-solo` the panes
   below the map are hidden, so the line names a destination the reader cannot
   reach from where they are.

**8 · The legend needs a gloss on `unified`, and hovers on the ID types.** [00:01–00:43]

> *"The only one I'm really worried about is this **unified**. I don't know what
> that quite means… Although you do have that note here, which is okay. **Maybe
> add a note to Unified and that would be fine.**"* And: *"a hover over on
> M-ID, C-ID and CCN so anyone would know what those were."*

His read is exactly right, and the fix is already patterned. Today:

```
'<span><i class="u-sw s3"></i>unified</span>'                    ← bare
'<span><i class="u-sw orphan"></i>stand-alone course — a smaller,
   lighter dot in orbit around its closest match</span>'         ← has the note
```

`noncredit` and `college course under an identity` also carry notes; `unified`
carries none, and `M-ID` / `C-ID` / `CCN` carry only *"our working label"* /
*"official"*. **He offered the cheaper option himself** — a note in the existing
style rather than a hover system. Take it.

## ⚠️ Decided AGAINST on camera — do not build

**Hover on the title.** [03:29–03:48]

> *"It doesn't do that when over the title, which is kind of an intuitive place I
> would expect it to, **but I think I will leave it this way** and just let the
> user get used to hovering over the exact location… that's much more
> controllable than trying to hover over the title."*

He raised it, considered it, and rejected it in the same breath. Like the v2
retraction, **the decision is the finding** — building this would undo a choice.

## Praised — do not break

- **Fit all** — *"I like the fit all selection. So it fits all of the selected
  course CCRs in there."*
- **Focus expands, click holds it** — *"when I get focused, it's nice, it expands
  like that. And I'll click it and then it stays that way, which is very nice."*
- **Hover detail per college** — Fullerton's own information on its own star.
- **Text does not scale with zoom** — *"that preserves a lot of the important
  information on a very busy screen."* The text-zoom chip is an ADDITION to this,
  never a replacement.

## Self-resolved — no action

*"I'm not sure why that illuminated all that. Oh, I was clicking in the wrong
place."* [05:02] — and the hide behavior he checked at 04:51 he pronounced good.

---

## What the frames settled that the words could not

Sam supplied all 21 frames after the transcript. Three findings came only from
looking, and one of them reversed a conclusion:

- ⭐ **The move confirmation renders** (frame 17). The transcript reads as though
  nothing happened; the screen shows the sentence. Item 7 above is rewritten
  because of this — the fix is a mark on the course, not a message that already
  exists.
- ⭐ **The purple background was real and severe** (frames 6, 11, 17). With
  Welding open, the whole canvas is violet rather than charcoal. Shipped since —
  `haloAround()` clamps it and quotes his words — but the frames are the evidence
  of what he was reacting to.
- ⚠️ **The work surface's masthead still read `SkyView — prototype v1`**
  (frame 16, the page double-click landed on). The masthead fix was item 3 of the
  *v2* findings and shipped in #1502; **verify it covered this surface too**, not
  just the map. This recording predates that PR, so the frame is not evidence
  that it is still wrong — it is evidence of where to check.
- The dropdown in these frames still has **Sort by name at the BOTTOM** and no
  Enter button (frames 5, 7, 8), which dates the recording to before #1502 and
  confirms the sort/Enter items were correctly read as shipped.

⚠️ **This is the third round in this lane where the frames outrank the words.**
`methodology-verify-an-ask-against-what-the-reader-sees` keeps earning its place:
a triage from a transcript alone would have shipped a confirmation message that
was already on screen, and left the actual defect — the unmarked course — in
place.

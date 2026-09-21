#!/usr/bin/env python3
"""Reply controls for a decision sheet.

Sam, 2026-09-05: "add decision chips on each memory decision sheet item so I can
record my responses for you and add any clarifying notes needed. Some of the
unfinished memories are important to follow up on and I don't want to leave
them hanging while I'm in the decision flow."

One block per numbered item: the verdict chips (Yes takes the recommendation;
the rest are the words the how-to box already accepts), a Follow up toggle that
is independent of the verdict, and a note. Where the replies go:

  * Opened as a Claude artifact, the page asks for the artifact's shared store
    (`claude.use("db")`) and writes one document per item under `replies/<item>`
    -- the session reads them back with the Artifact tool's read_db, so a reply
    made on the sheet reaches the session without a paste.
  * Opened from the repo or the vault there is no store, so the replies stay in
    the browser (localStorage) and the bar at the foot of the page carries a
    "Copy replies" button that builds the numbered reply line the how-to box
    describes. The words are the same either way.

Every sheet builder imports this rather than carrying its own copy: the chips,
the store and the reply line have to agree with the session that executes
them, and one module is how they keep agreeing. Every control is a word.
"""
import html

E = html.escape

def _chip(c):
    """A chip is the word a reader sees, or a (label, value) pair when that word
    and the word the session stores differ. ⚠️ **THE VALUE NAMES THE OUTCOME,
    NEVER AGREEMENT** (Sam, 2026-09-20). The 51-item Jev sheet defined Yes as
    "take the proposal" and its review band proposed hold-separate, so a Yes
    there meant keep by the sheet and fold to Sam: items 26-41 all carried a Yes
    and then a flip to Keep. A value of `fold` means fold whatever was proposed,
    so the reply line cannot be read two ways."""
    if isinstance(c, (tuple, list)):
        return str(c[0]), str(c[1])
    return str(c), str(c).lower()


CHIPS_DEFAULT = ["Yes", "Keep", "Retire", "Edit", "Later"]
CHIPS_CLASS = ["Yes", "No", "Later"]
CHIPS_GROUP = ["Yes", "Keep", "Later"]
CHIPS_DONE = ["Undo"]
# A sheet that asks what to BUILD, not what a memory row is worth. Keep/Retire
# read as verdicts on a claim; a plan is accepted, reshaped, deferred or dropped.
CHIPS_BUILD = ["Yes", "Edit", "Later", "Dismiss"]

# ── the reference sheets: fold by default, faculty pull out ──────────────────
# Sam, 2026-09-20: "It is better to over merge and give faculty the chance to
# pull them out rather than the other way around. It's easier to respond to a
# decision than to make one." So a reference item PROPOSES the fold, and the
# first chip confirms it by naming the action. Neither word is a bare Yes.
CHIPS_FOLD = [("Keep the fold", "fold"), ("Pull out", "keep"), ("Later", "later")]
# ── a LADDER sheet: what to do next, not what one row is worth ──────────────
# A reference sheet proposes a fold and its chips say fold or pull out. A sheet
# that proposes a PLAN — which center runs next, which step comes first — has no
# fold in it, and `chips_for` would hand every item CHIPS_DEFAULT, whose first
# word is the bare Yes Sam's 2026-09-20 ruling retired. The value names the
# outcome the same way: `adopt` means this step becomes the plan.
CHIPS_PLAN = [("Adopt", "adopt"), ("Drop", "drop"), ("Later", "later")]
# The rarer verdicts sit behind Other so the two that carry the sheet are the
# two a reader sees. Sam, 2026-09-20: "Edit behind Other."
CHIPS_OTHER = [("Edit", "edit"), ("Dismiss", "dismiss")]


# Under a single memory the first chip NAMES the batch's action instead of
# saying Yes. Sam, 2026-09-05, on "Keep the $1 million noncredit funding…"
# under a retire batch: "unclear if I am saying Yes to Keep $1M NC funding…
# Or… Yes that it is no longer true." A memory's title is often itself a
# claim, so a Yes beneath it reads both ways; Verify and Retire read one way.
# (Replies saved before this change carry v="yes": on an entry that is the
# batch's recommendation for that memory, exactly as Verify or Retire now say.)
CHIPS_ENTRY_VERIFY = ["Verify", "Hold out", "Rewrite", "Later"]
CHIPS_ENTRY_RETIRE = ["Retire", "Keep", "Later"]


def replies_block(item, ref="", chips=None, title="", compact=False, kind="item",
                  parent="", rec="", other=None, rows=0, reach=None, preselect=None):
    """The reply controls for one item. `item` is the number a reply names
    ("3", "D7", or "2.o3" for one memory inside item 2); `ref` is what the
    session needs to act (a slug, an id, a class key); `chips` are the verdict
    words offered, the one that confirms the proposal first; `kind` is
    item / entry / done, `parent` the item an entry belongs to.

    `rec` is the PROPOSED DISPOSITION, and it renders as a highlighted callout
    directly above the chips. Sam, 2026-09-20: *"make your recommendation line
    more visually a focal point. I found myself saying yes to things that I
    later had to flip keep because I didn't pay attention to your rec."* On the
    51-item sheet the proposal was a `dd` in the same gray as the facts and he
    read past it sixteen times.

    `preselect` is the verdict the item ARRIVES with — Sam, 2026-09-21: *"set
    the decision button for each item to your recommended and I will change only
    if needed -- opt-out approach"*. ⚠️ **A pre-selected chip looks exactly like
    an answered one**, so the page never conflates the two: an item with a
    stored reply was ruled on by a person, an item without one is carrying the
    proposal, and Complete commits the second kind marked `by: "default"`. A
    sheet abandoned at item 30 therefore hands over 21 items the reader never
    read, SAID SO, rather than 21 silent agreements.

    `other` are the rarer verdicts, folded behind an Other toggle so the two
    words that carry the sheet are the two a reader sees. `rows` and `reach`
    are what settling this item is WORTH — articulation rows collapsed, and the
    COLLEGE IDS it reaches — which the bar totals in those terms rather than in
    clicks. `reach` is a collection, never a count: colleges repeat across
    items, so the bar unions the ids instead of summing numbers that would
    over-report a sitting.

    Sam, 2026-09-05: "I need the response controls on each memory, not just on
    the whole batch" — an entry block sits under every memory a batch item
    lists, and its first chip names the batch's action for that one memory
    (Verify, Retire) rather than saying Yes."""
    chips = [_chip(c) for c in (chips or CHIPS_DEFAULT)]
    other = [_chip(c) for c in (other or [])]
    n = str(item)

    # ⚠️ OPT-OUT: the recommended chip ARRIVES SELECTED (Sam, 2026-09-21: "set
    # the decision button for each item to your recommended and I will change
    # only if needed"). The pressed state is rendered in the MARKUP, not painted
    # by script, so a reader with JS still loading never sees an unset sheet.
    def btn(label, value, cls="reply-chip"):
        on = "true" if preselect is not None and value == preselect else "false"
        return (f'<button type="button" class="{cls}" data-v="{E(value)}" '
                f'aria-pressed="{on}">{E(label)}</button>')

    btns = "".join(btn(l, v) for l, v in chips)
    more = ""
    if other:
        mid = "more-" + _re_id(n)
        more = (
            f'<button type="button" class="reply-chip reply-more" aria-expanded="false" '
            f'aria-controls="{E(mid)}">Other</button>'
            f'<div class="reply-more-row" id="{E(mid)}" role="group" '
            f'aria-label="Other replies to item {E(n)}" hidden>'
            + "".join(btn(l, v) for l, v in other) + '</div>')

    # The proposal, above the chips and not in the facts' gray. The word
    # "propose" stays: it is a proposal until the reader rules on it.
    callout = ""
    if rec:
        callout = (f'<p class="reply-rec"><span class="reply-rec-lbl">What I propose</span>'
                   f'<span class="reply-rec-text">{rec}</span></p>')

    ph = ("Why, or what to do instead" if compact
          else "A condition, a rewrite, a name to hold out, what to follow up on")
    worth = ""
    if preselect is not None:
        # The page distinguishes an item the reader TOUCHED from one they let
        # ride: this attribute is the proposal, and a stored reply is a person.
        worth += f' data-default="{E(preselect)}"'
    if rows:
        worth += f' data-rows="{int(rows)}"'
    if reach is not None and not isinstance(reach, (list, tuple, set, frozenset)):
        # ⚠️ A COUNT CANNOT BE TOTALED. Colleges repeat across items, so summing
        # per-item college counts over-reports the reach of a sitting — the
        # number Sam would read as progress. Pass the ids and the bar unions
        # them; there is no honest way to do it from counts alone.
        raise TypeError("reach takes the college ids this item reaches, not a count")
    if reach:
        worth += f' data-reach="{E(" ".join(sorted(str(r) for r in reach)))}"'
    return (
        f'<div class="reply{" reply-compact" if compact else ""}" data-item="{E(n)}" data-ref="{E(ref)}" '
        f'data-title="{E(title)}" data-kind="{E(kind)}" data-parent="{E(parent)}"{worth}>'
        f'{callout}'
        f'<div class="reply-row" role="group" aria-label="Your reply to item {E(n)}">'
        f'<span class="reply-lbl">Your reply</span>{btns}{more}'
        f'<button type="button" class="reply-chip reply-fu" aria-pressed="false" '
        f'title="Mark this for the session to follow up on, whatever the verdict">Follow up</button>'
        f'</div>'
        f'<label class="reply-notelbl" for="note-{E(n)}">Notes for the session</label>'
        f'<textarea id="note-{E(n)}" class="reply-note" rows="{1 if compact else 2}" placeholder="{E(ph)}"></textarea>'
        f'<p class="reply-state" aria-live="polite"></p>'
        f'</div>')


def _re_id(n):
    """An item number as an id fragment: item ids carry dots and colons."""
    import re
    return re.sub(r'[^A-Za-z0-9_-]', '-', str(n))


REST_EVERY = 20


def rest_stop(through, note=""):
    """A stopping point, `through` items into the sheet.

    Sam, 2026-09-20: *"Making decisions is taxing and only so many can be made
    before people bail out."* Every twenty items the sheet offers the exit in
    plain words and says the replies are already saved, so stopping reads as a
    sitting that ended rather than work abandoned. ⚠️ The marker names the
    POSITION, never a total: what is settled changes as the reader works, and a
    number frozen into the page would be wrong the moment it was read. The live
    total is the bar's job."""
    body = E(note) if note else (
        f"{through} items behind you. A good place to stop — every reply above is "
        f"already saved, and the sheet picks up here when you come back.")
    return (f'<p class="reply-rest" role="note"><span class="reply-rest-lbl">Rest</span>'
            f'<span>{body}</span></p>')


REPLIES_HOWTO = (
    '<p><strong>Each item arrives set to what I propose — change only the ones you disagree with.</strong> '
    'The proposal is in the panel above the chips and the chip naming it is already chosen: '
    '<em>Keep the fold</em> takes the merge, <em>Pull out</em> holds the wording separate. '
    'Anything you press is recorded as your own call; anything you leave stands as proposed, and I am told '
    'which is which. '
    'Under a single memory the first chip names what the batch would do to it — <em>Verify</em> or '
    '<em>Retire</em>; Hold out and Rewrite keep one back from a verify batch, Keep holds one back from a '
    'retire batch. <em>Other</em> opens the rarer replies. Press a chip again to undo it. '
    'Follow up marks an item the session should come back to whatever the verdict; the note '
    'is for anything a word cannot carry. The line under each reply says what was saved. On the artifact your replies save to the sheet itself '
    'and the session reads them from there. Opened anywhere else they stay in this browser, and '
    '<em>Copy replies</em> at the foot of the page builds the numbered line for you to paste. '
    'Stop wherever you like — the sheet marks a resting point every twenty items and everything above it is already saved.</p>')


# ⚠️ THE FRAMING SITS IN THE HEADER, IN SAM'S WORDS (2026-09-20). A reader
# ruling on four hundred wordings needs the reason in front of them, not in a
# lane file. His: no student repeats a course they have already mastered;
# credit mobility and articulation adoptability across the system.
FRAMING = (
    "Every fold here means one recommendation where there were several, so a student carries "
    "their credit from one college to the next and no one repeats a course they have already "
    "mastered. Faculty can pull any wording back out; responding to a decision is easier than "
    "making one, so each item proposes the fold and tells you the one reason it might be wrong.")


def framing_block(text=None, curator="", counts=""):
    """The framing sentence for the top of a sheet, above the first item.

    `curator` names who is ruling — the curator of record travels with the
    decision into the reference, so the judgment is attributed rather than
    laundered into an anonymous value. `counts` is what the sitting is worth in
    outcome terms (rows, colleges), measured, never guessed."""
    out = f'<p class="sheet-framing">{text or FRAMING}</p>'
    tail = " · ".join(x for x in (E(counts) if counts else "",
                                  f"Curator of record: {E(curator)}" if curator else "") if x)
    if tail:
        out += f'<p class="sheet-framing-worth">{tail}</p>'
    return out


# ── Complete: one click that tells the session ──────────────────────────────
# Sam, 2026-09-21: "Add a Complete or Submit button at the end that alerts you
# in the chat that it's done." Before this the session learned a sheet was
# finished only by being told in chat, which is the habit the decision-sheet
# flow exists to remove.
#
# The mechanism is the `comments` capability's sendToClaude(): it posts a
# comment AND notifies the Claude sessions watching this artifact, which is the
# one page-side route to Claude (writing "@Claude" in page text does nothing).
# It needs the FULL declaration — under composer_only, canSendToClaude() reads
# "off" — and the full form makes the artifact organization-internal, which a
# decision sheet already is.
#
# ⚠️ THE DB WRITE IS THE RECORD; THE SEND IS THE DOORBELL. A send can be
# refused (consent, a viewer who is not an editor, no session listening) and
# none of those mean the sheet is unfinished, so the completion is written to
# the store FIRST and the page says plainly which of the two happened. Reading
# `submissions/done` is how a session knows a sheet was declared finished —
# the counterpart to "an item with no reply has no verdict."
SUBMIT_BLOCK = (
    '<section class="submit" aria-labelledby="submit-h">'
    '<h2 id="submit-h">Done?</h2>'
    '<p class="submit-note" id="submit-note">Every reply is saved as you make it. '
    'Press Complete when you have finished, and the session is told the sheet is done.</p>'
    '<button type="button" class="submit-btn" id="submit-btn">Complete</button>'
    '<p class="submit-state" id="submit-state" aria-live="polite"></p>'
    '</section>')

SUBMIT_CSS = r"""
  .submit { background: var(--surface-opaque, #FFFFFF); border: 1px solid var(--border-strong, rgba(28,28,26,.30));
    border-radius: 14px; padding: 18px 20px; margin: 28px 0 8px; }
  .submit h2 { margin: 0 0 4px; font-size: 1.15rem; }
  .submit-note { margin: 0 0 12px; color: var(--text-body, #3A3A36); font-size: .95rem; }
  /* #FFFFFF on #002F6D is 12.90:1. The fallback is load-bearing: without it an
     undefined token leaves the background transparent and paints white on the
     card's white, the 2026-09-06 failure. */
  .submit-btn { font: inherit; font-size: 1rem; font-weight: 700; min-height: 44px; padding: 10px 22px;
    border: 1px solid var(--seal-blue, #002F6D); border-radius: 8px;
    background: var(--seal-blue, #002F6D); color: #FFFFFF; cursor: pointer; }
  .submit-btn:hover { background: var(--cobalt, #0047AB); border-color: var(--cobalt, #0047AB); }
  .submit-btn[disabled] { opacity: .6; cursor: default; }
  .submit-state { margin: 10px 0 0; font-size: .9rem; color: var(--text-body, #3A3A36); min-height: 1em; }
  /* A send that did not land gets its own rule and weight — the reader has to
     be able to tell "it reached Claude" from "it did not" without reading
     carefully. #1C1C1A on #FDF6E3 is 15.82:1. Color is never the only signal:
     the words say it too, and the button relabels itself. */
  .submit-state.missed { background: var(--rest-tint, #FDF6E3); color: var(--text-strong, #1C1C1A);
    border-left: 4px solid var(--mustard-text, #8B6800); border-radius: 6px;
    padding: 8px 12px; font-weight: 600; }
"""

REPLIES_BAR = (
    '<div class="reply-bar" id="reply-bar" role="region" aria-label="Your replies so far">'
    '<span class="reply-count" id="reply-count">0 replied</span>'
    '<span class="reply-outcome" id="reply-outcome"></span>'
    '<span class="reply-where" id="reply-where"></span>'
    '<button type="button" class="reply-chip reply-copy" id="reply-copy">Copy replies</button>'
    '<details class="reply-show"><summary>Show the reply line</summary>'
    '<textarea id="reply-line" class="reply-line" rows="4" readonly aria-label="The reply line, ready to paste"></textarea>'
    '</details>'
    '</div>')

REPLIES_CSS = SUBMIT_CSS + r"""
  /* ── replies: chips, a note, a follow-up flag (Sam, 2026-09-05) ── */
  .reply { margin: 12px 0 0; padding-top: 10px; border-top: 1px dashed var(--border); }
  .reply-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .reply-lbl { font-size: .72rem; text-transform: uppercase; letter-spacing: .08em; font-weight: 700;
    color: var(--text-muted); margin-right: 4px; }
  .reply-chip { font: inherit; font-size: .86rem; font-weight: 600; min-height: 30px; padding: 3px 12px;
    border: 1px solid var(--border-strong); border-radius: 6px; background: var(--surface-opaque);
    color: var(--text-body); cursor: pointer; }
  .reply-chip:hover { background: var(--surface-subtle); }
  /* ⚠️ --seal-blue is a First Light token the HOST SHEET may not define — this
     block has to stand on its own. Without the fallback the declaration is
     invalid at computed-value time, background falls back to transparent, and
     `color:#fff` paints white on the card's white: 1.00:1, so the SELECTED
     chip is invisible and the reader cannot see which verdict they picked.
     Measured 2026-09-06 on the seven-open-calls sheet. #002F6D on white is
     12.90:1. */
  .reply-chip[aria-pressed="true"] { background: var(--seal-blue, #002F6D); border-color: var(--seal-blue, #002F6D); color: #fff; }
  .reply-chip.reply-fu { margin-left: auto; }

  /* ── the proposal, above the chips ───────────────────────────────────────
     Sam, 2026-09-20: "make your recommendation line more visually a focal
     point. I found myself saying yes to things that I later had to flip keep
     because I didn't pay attention to your rec." On the 51-item sheet the
     proposal was a <dd> in the same gray as the facts, and he read past it
     sixteen times. Here it is a tinted panel with its own rule and its own
     label word, so the eye lands on it before it reaches the chips.
     ⚠️ Every token carries a LITERAL FALLBACK: this block travels with the
     module into sheets that may define none of them, and a declaration that
     is invalid at computed-value time falls back to transparent — the same
     failure that painted a selected chip white on white in 2026-09-06.
     Measured on the fallbacks: #1C1C1A on #E8EFF8 is 14.74:1, the label
     #002F6D on #E8EFF8 is 11.14:1. The rule and the label word are both
     non-color signals, so the callout never depends on the tint alone. */
  .reply-rec { margin: 0 0 10px; padding: 9px 13px; border-radius: 8px;
    background: var(--rec-tint, #E8EFF8); border-left: 4px solid var(--seal-blue, #002F6D);
    color: var(--text-strong, #1C1C1A); font-size: 1rem; line-height: 1.5; }
  .reply-rec-lbl { display: block; font-size: .72rem; text-transform: uppercase;
    letter-spacing: .08em; font-weight: 700; color: var(--seal-blue, #002F6D); margin-bottom: 2px; }
  .reply-rec-text { font-weight: 600; }
  .reply-rec strong { font-weight: 700; }
  /* The promoted pair inside a <dl>: an HTML5 dl may group dt/dd in a div, so
     the panel is the group itself and the two rows lose their own margins. */
  .reply-rec-dl { margin: 14px 0 0; }
  .reply-rec-dl dt.reply-rec-lbl, .reply-rec-dl dd.reply-rec-text { margin: 0; padding: 0; }
  .reply-rec-dl dd.reply-rec-text { font-weight: 600; margin-left: 0; }

  /* Other: the rarer verdicts, out of the way until they are wanted. */
  .reply-more-row { flex: 1 1 100%; display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
  .reply-more-row[hidden] { display: none; }

  /* A stopping point every twenty items (Sam, 2026-09-20: "Making decisions
     is taxing and only so many can be made before people bail out"). It says
     the replies are saved, so leaving reads as a sitting that ended. */
  .reply-rest { margin: 26px 0; padding: 11px 15px; border-radius: 8px;
    background: var(--rest-tint, #FDF6E3); border: 1px solid var(--border-strong, rgba(28,28,26,.30));
    color: var(--text-strong, #1C1C1A); font-size: .95rem; }
  .sheet-framing { font-size: 1.05rem; color: var(--text-strong, #1C1C1A); margin: 0 0 6px; }
  .sheet-framing-worth { font-size: .9rem; color: var(--text-muted, #5C5C55); margin: 0 0 18px; }
  .reply-rest-lbl { display: block; font-size: .72rem; text-transform: uppercase;
    letter-spacing: .08em; font-weight: 700; color: var(--mustard-text, #8B6800); margin-bottom: 2px; }
  .reply-notelbl { display: block; font-size: .78rem; color: var(--text-muted); margin: 8px 0 3px; }
  .reply-note { width: 100%; box-sizing: border-box; font: inherit; font-size: .92rem; padding: 7px 9px;
    border: 1px solid var(--border-strong); border-radius: 6px; background: var(--surface-opaque);
    color: var(--text-body); resize: vertical; min-height: 34px; }
  .reply-state { margin: 4px 0 0; font-size: .76rem; color: var(--text-muted); min-height: 1em; }
  .reply-compact { margin-top: 8px; padding-top: 8px; }
  .glist li .reply { margin: 6px 0 4px; padding-top: 6px; border-top: 1px dotted var(--border); }
  .glist li .reply-chip { font-size: .8rem; min-height: 26px; padding: 2px 9px; }
  .glist li .reply-note { font-size: .86rem; min-height: 30px; }
  .glist li .reply-lbl { font-size: .66rem; }
  .reply-compact .reply-notelbl { position: absolute; left: -9999px; }
  .reply-compact .reply-note { margin-top: 6px; }
  .reply-compact .reply-rec { font-size: .92rem; padding: 7px 10px; margin-bottom: 7px; }
  ol.done li { position: relative; }
  .reply-bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 5; background: var(--surface-opaque);
    border-top: 1px solid var(--border-strong); padding: 8px 16px; display: flex; flex-wrap: wrap;
    gap: 6px 14px; align-items: center; font-size: .9rem; box-shadow: 0 -6px 18px rgba(28,28,26,.08); }
  .reply-count { font-weight: 700; color: var(--text-strong); font-variant-numeric: tabular-nums; }
  .reply-outcome { font-weight: 600; color: var(--seal-blue, #002F6D); font-variant-numeric: tabular-nums;
    font-size: .88rem; }
  .reply-where { color: var(--text-muted); font-size: .82rem; flex: 1 1 240px; }
  .reply-show { margin: 0; flex: 1 1 100%; }
  .reply-show summary { font-size: .82rem; padding: 2px 0; }
  .reply-line { width: 100%; box-sizing: border-box; font: inherit; font-size: .86rem; padding: 6px 8px;
    border: 1px solid var(--border-strong); border-radius: 6px; background: var(--surface-subtle); color: var(--text-body); }
  body { padding-bottom: 120px; }
  @media (max-width: 560px) { .reply-chip { padding: 3px 9px; } .reply-chip.reply-fu { margin-left: 0; } }
"""


def replies_js(sheet_id):
    """The script. `sheet_id` keys the browser copy so two sheets never share one."""
    return r"""
<script>
(function(){
  "use strict";
  var SHEET = %s;
  var LS = "sheet-replies:" + SHEET;
  var els = Array.prototype.slice.call(document.querySelectorAll(".reply[data-item]"));
  if (!els.length) return;
  var state = {};        // item -> {item, ref, title, v, note, fu, t}; always this page's own objects
  var col = null;        // the artifact's shared store, once this view can reach it
  var where = "local";   // "db" once the store answers
  var pending = {};      // item -> "saving" | "failed" | ""
  var saved = {};        // item -> the `t` the store is known to hold

  // What a snapshot delivers is FROZEN (the store's contract: "clone a body
  // before editing it for a write"). The first version adopted the echoed body
  // as state and assigned into it; outside strict mode the assignment is
  // silently ignored, so from an item's first save on, every click painted
  // nothing and wrote the unchanged document back (Sam, 2026-09-05: "I click
  // Follow Up and it doesn't turn blue but does say response was saved").
  // copy() means state is never the store's object; strict mode makes any
  // such write throw instead of pass.
  function copy(r){ var o = {}; if (r) for (var k in r) if (Object.prototype.hasOwnProperty.call(r, k)) o[k] = r[k]; return o; }

  function read(){ try { var s = JSON.parse(localStorage.getItem(LS) || "{}"); if (s && typeof s === "object") state = s; } catch (e) {} }
  function keep(){ try { localStorage.setItem(LS, JSON.stringify(state)); } catch (e) {} }
  function byItem(item){ for (var i = 0; i < els.length; i++) if (els[i].getAttribute("data-item") === item) return els[i]; return null; }
  function rec(item){
    if (state[item]) return copy(state[item]);
    var el = byItem(item);
    return { item: item, ref: el ? el.getAttribute("data-ref") : "", title: el ? el.getAttribute("data-title") : "", v: "", note: "", fu: false };
  }
  function empty(r){ return !r || (!r.v && !r.fu && !r.note); }
  // ⚠️ TWO STATES PER ITEM, AND THEY MUST NEVER COLLAPSE (Sam's opt-out, 2026-09-21).
  // An item CARRYING THE PROPOSAL has no stored reply; an item a person RULED ON
  // has one. They look the same on screen — that is the point of opt-out — so
  // everything that counts, reports or hands over reads `state`, never the
  // painted chip. Collapsing them is how a sheet stopped at item 30 would hand
  // over 21 verdicts nobody read.
  function dflt(item){ var el = byItem(item); return el ? (el.getAttribute("data-default") || "") : ""; }
  function verdict(item){ var r = state[item]; return r && r.v ? r.v : dflt(item); }
  function ruled(item){ var r = state[item]; return !!(r && !empty(r)); }
  function chipWord(el, v){
    var bs = el ? el.querySelectorAll(".reply-chip[data-v]") : [];
    for (var i = 0; i < bs.length; i++) if (bs[i].getAttribute("data-v") === v) return bs[i].textContent;
    return v;
  }
  function words(el, r){
    var w = [];
    if (r.v) w.push(chipWord(el, r.v));
    if (r.fu) w.push("follow up");
    if (r.note) w.push("a note");
    return w.join(", ");
  }
  function stateWords(el, item, r){
    if (empty(r)) {
      var d = dflt(item);
      // Say it is the proposal and not an answer, or the reader cannot tell
      // a chip they set from one that was set for them.
      return d ? "Proposed: " + chipWord(el, d) + ". Change it if needed — it stands as it is." : "";
    }
    if (pending[item] === "saving") return "Saving…";
    if (pending[item] === "failed") return "Could not save to the sheet; kept in this browser. Use Copy replies.";
    var w = words(el, r);
    // Undo is the same chip pressed again -- say so, or it is not discoverable.
    var undo = r.v ? " Press it again to undo." : "";
    return where === "db" ? "Your call: " + w + "." + undo
                          : "Your call, in this browser only: " + w + ". Use Copy replies to send it." + undo;
  }
  function paint(el){
    if (!el) return;
    var item = el.getAttribute("data-item"), r = state[item] || {};
    var shown = r.v || (empty(r) ? dflt(item) : "");
    Array.prototype.forEach.call(el.querySelectorAll(".reply-chip[data-v]"), function(b){
      b.setAttribute("aria-pressed", shown && shown === b.getAttribute("data-v") ? "true" : "false");
    });
    var fu = el.querySelector(".reply-fu"); if (fu) fu.setAttribute("aria-pressed", r.fu ? "true" : "false");
    // A verdict that lives behind Other has to be VISIBLE once it is chosen --
    // a selected chip inside a hidden row is a reply the reader cannot see, the
    // same failure as the chip that painted white on white.
    var moreRow = el.querySelector(".reply-more-row"), moreBtn = el.querySelector(".reply-more");
    if (moreRow && moreBtn && r.v && moreRow.querySelector('.reply-chip[data-v="' + r.v + '"]')) {
      moreRow.hidden = false; moreBtn.setAttribute("aria-expanded", "true");
    }
    var note = el.querySelector(".reply-note");
    if (note && document.activeElement !== note && (r.note || "") !== note.value) note.value = r.note || "";
    var st = el.querySelector(".reply-state"); if (st) st.textContent = stateWords(el, item, r);
  }
  function paintAll(){ els.forEach(paint); bar(); }
  // ⚠️ QUALITY GOES IN THE SCORE, NEVER CLICKS (Sam, 2026-09-20, agreeing with
  // the pushback: "Good pushback--agree!"). A reversal is a verdict REPLACED by
  // a different verdict -- the sixteen flips on the Jev sheet were the signal
  // that the proposal was not being read. Clearing a chip is an undo and is not
  // a reversal; neither is a first answer. The count rides with the reply, so
  // the session reads which items the reader changed their mind on.
  function set(item, patch){
    var r = rec(item), was = r.v || "";
    for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) r[k] = patch[k];
    if (Object.prototype.hasOwnProperty.call(patch, "v") && was && patch.v && patch.v !== was) {
      r.flips = (r.flips || 0) + 1;
      r.was = was;
    }
    r.t = new Date().toISOString();
    r.by = "sam";                       // a stored reply is always a person's
    // Undoing the last thing on an item returns it to CARRYING THE PROPOSAL,
    // rather than leaving a stored reply with an empty verdict — which would
    // read as a deliberate blank and is a different claim.
    if (empty(r) && dflt(item)) { del(item); return; }
    state[item] = r; keep();
    paint(byItem(item)); bar(); push(item);
  }
  function del(item){
    delete state[item]; keep();
    if (col) { try { col.doc(item).delete(); } catch (e) {} }
    paint(byItem(item)); bar();
  }
  function push(item){
    if (!col) return;
    var r = state[item]; if (!r) return;
    var t = r.t;
    pending[item] = "saving"; paint(byItem(item));
    col.doc(item).set(copy(r)).then(function(){
      // A newer change may have gone up meanwhile; its own callbacks settle it.
      if (state[item] && state[item].t === t) { pending[item] = ""; saved[item] = t; }
      paint(byItem(item)); bar();
    }, function(){ pending[item] = "failed"; paint(byItem(item)); bar(); });
  }

  /* ── the bar: how many, where they are, the line to paste ── */
  function line(){
    var parts = [];
    els.forEach(function(el){
      var item = el.getAttribute("data-item"), r = state[item];
      if (empty(r)) {
        // An item carrying the proposal is reported AS the proposal, marked so
        // — never as a verdict the reader gave.
        var d = el.getAttribute("data-default");
        if (d) parts.push(item + " " + d + " (as proposed)");
        return;
      }
      // ⚠️ The provenance rides the PASTE LINE too. This line is the fallback
      // when the send is refused, which is precisely the path where "he ruled
      // on it" and "it rode the proposal" would otherwise become the same.
      var s = item + " " + (r.v ? r.v : "(no verdict)") + (r.by === "default" ? " (as proposed)" : "");
      if (r.fu) s += ", follow up";
      if (r.note) s += " — “" + String(r.note).replace(/\s+/g, " ").trim() + "”";
      parts.push(s);
    });
    return parts.length ? parts.join(" · ") : "No replies yet.";
  }
  // ⚠️ THE RUNNING TOTAL IS IN OUTCOME TERMS (Sam, 2026-09-20). What a sitting
  // is worth is articulation rows collapsed and colleges reached, never clicks
  // logged. Rows are this item's own and add up; COLLEGES REPEAT across items,
  // so the ids are unioned -- a sum of per-item college counts would report a
  // reach the sitting did not have, which is the one number a reader takes at
  // face value. An item that carries neither stays out of the outcome clause
  // rather than contributing a zero.
  function outcome(){
    var rows = 0, colleges = {}, any = false;
    els.forEach(function(el){
      if (empty(state[el.getAttribute("data-item")])) return;
      var rv = parseInt(el.getAttribute("data-rows") || "0", 10);
      if (rv > 0) { rows += rv; any = true; }
      var ids = (el.getAttribute("data-reach") || "").split(/\s+/);
      ids.forEach(function(id){ if (id) { colleges[id] = 1; any = true; } });
    });
    if (!any) return "";
    var out = [], nc = Object.keys(colleges).length;
    if (rows) out.push(rows + (rows === 1 ? " articulation row" : " articulation rows") + " settled");
    if (nc) out.push(nc + (nc === 1 ? " college" : " colleges") + " reached");
    return out.join(" · ");
  }
  function bar(){
    var n = { item: [0, 0], entry: [0, 0], done: [0, 0] }, fu = 0, flips = 0;
    els.forEach(function(el){
      var k = el.getAttribute("data-kind") || "item"; if (!n[k]) n[k] = [0, 0];
      var r = state[el.getAttribute("data-item")];
      n[k][1]++; if (!empty(r)) n[k][0]++; if (r && r.fu) fu++;
      if (r && r.flips) flips += r.flips;
    });
    var parts = [], proposed = 0;
    els.forEach(function(el){
      if ((el.getAttribute("data-kind") || "item") !== "item") return;
      if (el.getAttribute("data-default") && !ruled(el.getAttribute("data-item"))) proposed++;
    });
    if (n.item[1]) parts.push(n.item[0] + " of " + n.item[1] + " items");
    if (n.entry[1]) parts.push(n.entry[0] + " of " + n.entry[1] + " memories");
    if (n.done[1]) parts.push(n.done[0] + " of " + n.done[1] + " retired rows");
    var c = document.getElementById("reply-count");
    if (c) c.textContent = parts.join(" · ") + " your call"
      + (proposed ? " · " + proposed + " as proposed" : "")
      + (fu ? " · " + fu + " to follow up" : "");
    var o = document.getElementById("reply-outcome");
    if (o) {
      var text = outcome();
      if (flips) text += (text ? " · " : "") + flips + (flips === 1 ? " changed" : " changed");
      o.textContent = text;
    }
    var w = document.getElementById("reply-where");
    if (w) w.textContent = where === "db"
      ? "Replies save to this sheet; the session reads them from here."
      : "Replies stay in this browser until you copy them into the session.";
    var t = document.getElementById("reply-line"); if (t) t.value = line();
  }
  var copyBtn = document.getElementById("reply-copy");
  if (copyBtn) copyBtn.addEventListener("click", function(){
    var text = line(), done = function(ok){
      copyBtn.textContent = ok ? "Copied" : "Select the line below and copy it";
      setTimeout(function(){ copyBtn.textContent = "Copy replies"; }, 2200);
      if (!ok) { var d = document.querySelector(".reply-show"); if (d) d.open = true; }
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function(){ done(true); }, function(){ done(false); });
      else done(false);
    } catch (e) { done(false); }
  });

  /* ── wire each item ── */
  els.forEach(function(el){
    var item = el.getAttribute("data-item");
    Array.prototype.forEach.call(el.querySelectorAll(".reply-chip[data-v]"), function(b){
      b.addEventListener("click", function(){
        var v = b.getAttribute("data-v"), cur = state[item] && state[item].v;
        set(item, { v: cur === v ? "" : v });          // the pressed chip clears on a second click
      });
    });
    var fu = el.querySelector(".reply-fu");
    if (fu) fu.addEventListener("click", function(){ set(item, { fu: !(state[item] && state[item].fu) }); });
    var more = el.querySelector(".reply-more"), moreRow = el.querySelector(".reply-more-row");
    if (more && moreRow) more.addEventListener("click", function(){
      var open = more.getAttribute("aria-expanded") === "true";
      more.setAttribute("aria-expanded", open ? "false" : "true");
      moreRow.hidden = open;
    });
    var note = el.querySelector(".reply-note"), tm = null;
    if (note) {
      note.addEventListener("input", function(){ clearTimeout(tm); tm = setTimeout(function(){ set(item, { note: note.value }); }, 500); });
      note.addEventListener("blur", function(){ clearTimeout(tm); if ((state[item] ? state[item].note : "") !== note.value) set(item, { note: note.value }); });
    }
  });

  /* ── the artifact's store, when this view has one ── */
  function light(){
    var C = window.claude;
    if (!C || typeof C.use !== "function") return;
    var p; try { p = C.use("db"); } catch (e) { return; }
    if (!p || typeof p.then !== "function") return;
    p.then(function(db){
      if (!db) return;
      col = db.collection("replies"); where = "db";
      col.onSnapshot(function(snap){
        var seen = {};
        snap.docs.forEach(function(d){
          var r = d.data(); if (!r || !r.item) return;
          seen[r.item] = 1;
          var cur = state[r.item];
          // The store's copy wins when it is at least as new as this page's;
          // COPIED, because the delivered body is frozen and stays the store's.
          if (!cur || String(r.t || "") >= String(cur.t || "")) {
            state[r.item] = copy(r); saved[r.item] = r.t || "";
            if (pending[r.item] !== "saving") pending[r.item] = "";
          }
        });
        // Anything this browser holds that the store does not: send it up once.
        Object.keys(state).forEach(function(item){
          if (!seen[item] && !pending[item] && !empty(state[item]) && saved[item] !== state[item].t) push(item);
        });
        keep(); paintAll();
      }, function(){ where = "local"; col = null; paintAll(); });
      paintAll();
    }, function(){});
  }

  /* ── Complete: write the record, then ring the doorbell ── */
  var sbtn = document.getElementById("submit-btn"), sstate = document.getElementById("submit-state");
  var snote = document.getElementById("submit-note");

  // ⚠️ SAY IT BEFORE THE PRESS, NOT AFTER (Sam, 2026-09-21). He pressed
  // Complete, the send found no session listening, and he had to come and ask
  // whether it had worked. canSendToClaude() posts nothing and never prompts —
  // the capability notes call it cheap on each render of the control — so the
  // button can know its own reach at load and say so in the note above it.
  // A reachable session is the common case, so the note only changes when the
  // answer is that nothing is listening.
  function reach(){
    if (!snote || !sbtn) return;
    var C = window.claude, p;
    try { p = C && typeof C.use === "function" ? C.use("comments") : null; } catch (e) { return; }
    if (!p || typeof p.then !== "function") return;
    p.then(function(cm){
      if (!cm || typeof cm.canSendToClaude !== "function") return;
      cm.canSendToClaude().then(function(can){
        if (can === "available") return;               // the button can ring; say nothing
        snote.textContent = "Every reply is saved as you make it. Press Complete when you have "
          + "finished — it records that this sheet is done, and a session reads the record "
          + "straight off the sheet. To have it picked up right away, say \u201cdecisions "
          + "done\u201d in the chat.";
        sbtn.textContent = "Complete";
      }, function(){});
    }, function(){});
  }
  reach();
  function tally(){
    var done = 0, total = 0, asProposed = [], blank = 0;
    els.forEach(function(el){
      if ((el.getAttribute("data-kind") || "item") !== "item") return;
      total++;
      var item = el.getAttribute("data-item");
      if (ruled(item)) { done++; return; }
      if (el.getAttribute("data-default")) asProposed.push(item); else blank++;
    });
    return { done: done, total: total, asProposed: asProposed, blank: blank };
  }
  function say(t, missed){
    if (!sstate) return;
    sstate.textContent = t;
    sstate.className = "submit-state" + (missed ? " missed" : "");
  }
  if (sbtn) sbtn.addEventListener("click", function(){
    var n = tally();
    sbtn.disabled = true;
    // ⚠️ COMMIT THE PROPOSALS, AND SAY THEY ARE PROPOSALS. Under opt-out the
    // reader only touches what they disagree with, so the untouched items DO
    // carry a verdict — but `by: "default"` records that nobody ruled on them
    // individually, and the message says how many. An item with neither a
    // reply nor a proposal is still a blank, and is still named as one.
    var now = new Date().toISOString();
    n.asProposed.forEach(function(item){
      var r = { item: item, ref: (byItem(item) || {getAttribute:function(){return "";}}).getAttribute("data-ref"),
                title: byItem(item) ? byItem(item).getAttribute("data-title") : "",
                v: dflt(item), note: "", fu: false, by: "default", t: now };
      state[item] = r;
      if (col) { try { col.doc(item).set(copy(r)); } catch (e) {} }
    });
    keep(); paintAll();
    var text = "Decisions done on " + SHEET + " — " + n.done + " of " + n.total + " items your own call"
      + (n.asProposed.length ? ", " + n.asProposed.length + " taken as proposed (not individually reviewed)" : "")
      + (n.blank ? ", " + n.blank + " left blank (no verdict on those)" : "") + ". " + line();
    var rec = { sheet: SHEET, ruled: n.done, as_proposed: n.asProposed.length, blank: n.blank,
                items: n.total, at: now, sent: false };
    function finish(sent, why){
      rec.sent = sent;
      if (col) { try { col.doc("done").set(copy(rec)); } catch (e) {} }
      // ⚠️ A FAILED DOORBELL MUST NOT READ LIKE A DELIVERED ONE (Sam,
      // 2026-09-21: "I hit complete on the new decision sheet but I don't know
      // if it alerted you in context"). The send failed silently enough that he
      // had to come and ask. It says so plainly now, and it says the thing that
      // is actually true: the replies are ON the sheet and the session reads
      // them from here, so a refused send costs a sentence in chat, never the
      // work.
      say(sent ? "Sent. The session has it — " + n.done + " of " + n.total + " your own call"
                 + (n.asProposed.length ? ", " + n.asProposed.length + " as proposed." : ".")
               : "Recorded on the sheet — " + n.done + " of " + n.total + " your own call"
                 + (n.asProposed.length ? ", " + n.asProposed.length + " as proposed" : "")
                 + ". No session was listening just now"
                 + (why && why !== "no session is listening" ? " (" + why + ")" : "")
                 + ", so say \u201cdecisions done\u201d in the chat and Claude reads them "
                 + "straight off this sheet.", !sent);
      sbtn.textContent = sent ? "Completed — sent" : "Completed — tell Claude";
      // ⚠️ MEASURED 2026-09-21: sendToClaude() reports "no session is listening"
      // for a Claude Code session in a remote container even with a live,
      // confirmed artifact watch. Sam pressed Complete a minute after the watch
      // was re-registered and got the same answer. The button therefore records
      // and offers the send; the RELIABLE path is the session reading
      // `replies/done` off this sheet, which needs nothing from this page.
    }
    // The store is the record and is written whether or not the send lands.
    var C = window.claude, p;
    try { p = C && typeof C.use === "function" ? C.use("comments") : null; } catch (e) { p = null; }
    if (!p || typeof p.then !== "function") { finish(false, "commenting is off here"); return; }
    say("Sending…");
    p.then(function(cm){
      if (!cm || typeof cm.sendToClaude !== "function") { finish(false, "commenting is off here"); return; }
      cm.canSendToClaude().then(function(can){
        if (can !== "available") { finish(false, can === "writers_only" ? "you are not an editor of this sheet" : "no session is listening"); return; }
        cm.anchorFor(sbtn).then(function(anchor){
          // One deliberate send, from the viewer's own click. Never retried:
          // a rejected write is not proof nothing was written.
          cm.sendToClaude({ anchor: anchor, text: text.slice(0, 3800) })
            .then(function(){ finish(true); }, function(err){ finish(false, (err && err.code) || "it could not be sent"); });
        }, function(){ finish(false, "the button could not be anchored"); });
      }, function(){ finish(false, "commenting is off here"); });
    }, function(){ finish(false, "commenting is off here"); });
  });

  read(); paintAll(); light();
})();
</script>
""" % _js_string(sheet_id)


def _js_string(s):
    import json
    return json.dumps(str(s))


# ── injecting into a sheet that already exists ──────────────────────────────
# The 2026-09-05 memory sheet's committed builder predates the sheet it is
# named for (S229 evolved the builder in-session and the final version was
# never committed — it lacks item 2 and the section order the sheet has), so
# re-running it would REGRESS the sheet. The reply controls are therefore
# added as a pass over the finished HTML, guarded by markers so a second run
# replaces the first instead of stacking (the same shape as Rule 2's CSS
# guard in excel_to_dashboard.py). A future builder can call replies_block()
# directly, or just run this over its output.
MARK_S, MARK_E = "<!-- replies:start -->", "<!-- replies:end -->"
CSS_S, CSS_E = "/* replies:css:start */", "/* replies:css:end */"

import re as _re

# `data-rows` / `data-reach` on the article are what settling the item is worth;
# the pass copies them onto the reply block, where the bar totals them.
_CARD = _re.compile(
    r'(<article class="card(?: lift)?" id="(i\d+)"(?P<attrs>[^>]*)>)(?P<body>.*?)(</article>)', _re.S)
_DONE = _re.compile(r'(<li id="(d\d+)">)(.*?)(</li>)', _re.S)
_SECTION = _re.compile(r'<section class="group">\s*<h2>(.*?)</h2>', _re.S)


def _strip(html_text):
    """Remove every earlier injection so the pass is idempotent.

    ⚠️ **THE MARKERS NEST, SO A NON-GREEDY MATCH LEAVES WRECKAGE.** The
    2026-09-20 sheet shipped with the how-to paragraph injected INSIDE item 1's
    reply block (see `_howto_end` for why), which put one marked region inside
    another. `MARK_S.*?MARK_E` then matched the INNER pair, deleting the how-to
    text and the outer block's closing marker while leaving its opening `<div
    class="reply">` behind — a stray chip row and an orphaned div in the card,
    on every re-run. Count the depth and cut the OUTERMOST region instead, so a
    sheet carrying a nested injection strips clean the first time."""
    out, i = [], 0
    while True:
        a = html_text.find(MARK_S, i)
        if a < 0:
            out.append(html_text[i:])
            break
        out.append(html_text[i:a])
        pos, depth = a + len(MARK_S), 1
        while depth:
            nxt_s, nxt_e = html_text.find(MARK_S, pos), html_text.find(MARK_E, pos)
            if nxt_e < 0:               # unterminated: drop the rest of the region
                pos = len(html_text); break
            if 0 <= nxt_s < nxt_e:
                depth += 1; pos = nxt_s + len(MARK_S)
            else:
                depth -= 1; pos = nxt_e + len(MARK_E)
        i = pos
    html_text = ''.join(out)
    html_text = _re.sub(_re.escape(CSS_S) + r'.*?' + _re.escape(CSS_E), '', html_text, flags=_re.S)
    return html_text


def _text(fragment):
    return _re.sub(r'\s+', ' ', _re.sub(r'<.*?>', '', fragment or '')).strip()


_ENTRY = _re.compile(r'(<li>)(<span class="gt">(.*?)</span>.*?<span class="ref">reference: (.*?)</span>)(</li>)', _re.S)


def _ask_text(card_html):
    """The card's proposed disposition, before or after it is promoted."""
    m = (_re.search(r'<dd class="ask">(.*?)</dd>', card_html, _re.S)
         or _re.search(r'<dd class="reply-rec-text">(.*?)</dd>', card_html, _re.S))
    return _text(m.group(1)).lower() if m else ''


def entry_chips(card_html):
    """What one memory inside a batch can be told, read off the batch's ask."""
    ask = _ask_text(card_html)
    if 'verified' in ask:
        return CHIPS_ENTRY_VERIFY
    if 'retire' in ask:
        return CHIPS_ENTRY_RETIRE
    return CHIPS_DEFAULT


def chips_for(section_title, card_html):
    """Which words a card offers, by the section it sits in and its shape."""
    t = (section_title or '').lower()
    h3 = _text((_re.search(r'<h3[^>]*>(.*?)</h3>', card_html, _re.S) or [None, ''])[1])
    ask = _ask_text(card_html)
    if 'older only' in ask:
        return ["Yes", "Older only", "No", "Later"]
    # A reference sheet proposes the fold; the chips name the two outcomes.
    # Sam, 2026-09-20: the first chip confirms the proposal and its label names
    # the action, never a bare Yes.
    if _re.search(r'\bfold\b|\bmerge\b', ask):
        return CHIPS_FOLD
    # 'what to check' is a REVIEW section — a rule already shipped and the ask is
    # whether it stays. Keep/Retire read as verdicts on a claim and are wrong
    # there too: what is on offer is accept, reshape, defer or drop.
    if t.startswith(('what to build', 'what to check', 'the data underneath',
                     'how a rule fires', 'still open')):
        return CHIPS_BUILD
    if t.startswith('rulings that cover') or t.startswith('your own earlier rulings'):
        return CHIPS_CLASS
    if _re.search(r'entries replaced by one newer ruling', h3, _re.I):
        return CHIPS_GROUP
    return CHIPS_DEFAULT


_ASK_PAIR = _re.compile(r'<dt>[^<]*</dt>\s*<dd class="ask">(.*?)</dd>\s*', _re.S)


def promote_rec(body):
    """Move the card's proposed disposition to the foot of its `<dl>` and give
    it the callout's look, so it sits directly above the chips.

    Sam, 2026-09-20: *"make your recommendation line more visually a focal
    point. I found myself saying yes to things that I later had to flip keep
    because I didn't pay attention to your rec."* On the 51-item sheet the
    proposal was `<dd class="ask">` — the same gray as the two facts around it,
    with *Why* sitting between it and the chips — and sixteen items came back
    with a verdict he had to reverse.

    A sheet BUILT to this template passes `rec=` to `replies_block()` and needs
    none of this. This is the pass over a sheet that already exists.

    ⚠️ Idempotent by construction, not by a guard: the promoted pair no longer
    carries `class="ask"`, so a second run finds nothing to move. That matters
    because `_strip()` removes the injected block, and a lift that depended on
    the block to survive would lose the proposal on the second run."""
    m = _ASK_PAIR.search(body)
    if not m:
        return body
    close = body.find('</dl>', m.end())   # the dl that HELD it, never the card's last
    if close < 0:
        return body
    # An HTML5 `<dl>` may group a dt/dd pair in a `<div>`; that is what lets the
    # pair be painted as one panel.
    panel = ('<div class="reply-rec reply-rec-dl">'
             '<dt class="reply-rec-lbl">What I propose</dt>'
             '<dd class="reply-rec-text">' + m.group(1) + '</dd></div>')
    body = body[:m.start()] + body[m.end():]
    i = close - (m.end() - m.start())
    return body[:i] + panel + body[i:]


def _howto_end(html_text):
    """Where the how-to box closes, whatever element it is.

    ⚠️ **THIS LOOKED FOR `</div>` AND THE BOX IS A `<ul>`.** On the 2026-09-20
    Jev sheet the how-to box is `<ul class="howto">`, so the first `</div>`
    after it was item 1's reply row and the how-to paragraph — the text that
    explains what the chips mean — shipped BURIED INSIDE THE FIRST ITEM'S
    CHIPS, where no reader would look for it. Read the box's own tag and close
    on its match, counting nesting, so the paragraph lands in the box.

    Returns the index just before the box's closing tag, or -1."""
    m = _re.search(r'<(\w+)([^>]*?)class="howto"', html_text)
    if not m:
        return -1
    tag = m.group(1)
    pos, depth = m.end(), 1
    pat = _re.compile(r'<(/?)%s\b[^>]*?(/?)>' % _re.escape(tag), _re.I)
    while True:
        mm = pat.search(html_text, pos)
        if not mm:
            return -1
        if mm.group(1):
            depth -= 1
            if depth == 0:
                return mm.start()
        elif not mm.group(2):
            depth += 1
        pos = mm.end()


def _rest_stops(html_text):
    """A stopping point after every twentieth item card. Counted over the cards
    the reader actually answers, in document order, and never after the last one
    — the foot of the sheet is already a stopping point."""
    ends, pos = [], 0
    for m in _CARD.finditer(html_text):
        ends.append(m.end())
    out, last, n = [], 0, 0
    for i, e in enumerate(ends):
        n += 1
        out.append(html_text[last:e])
        last = e
        if n % REST_EVERY == 0 and i < len(ends) - 1:
            out.append(MARK_S + rest_stop(n) + MARK_E)
    out.append(html_text[last:])
    return ''.join(out)


def _submit_block(html_text):
    """Complete, after the last item — where a reader arrives when they are
    finished (Sam, 2026-09-21: "at the end"). The fixed bar carries the running
    total and stays on screen; this is the deliberate end of the sitting."""
    last = None
    for m in _CARD.finditer(html_text):
        last = m
    if not last:
        return html_text
    i = last.end()
    return html_text[:i] + MARK_S + SUBMIT_BLOCK + MARK_E + html_text[i:]


def other_for(chips):
    """The verdicts that go behind Other: the rarer ones, so the words carrying
    the sheet are the words a reader sees (Sam, 2026-09-20: "Edit behind
    Other"). A set that already offers one keeps it in the open."""
    have = {_chip(c)[1] for c in chips}
    return [c for c in CHIPS_OTHER if _chip(c)[1] not in have]


def inject(html_text, sheet_id):
    """Return the sheet with reply controls on every numbered item and every
    retired row, the CSS in the page's <style>, the bar and the script before
    </body> (or at the end), and the how-to box extended. Idempotent."""
    html_text = _strip(html_text)
    # Which section each card sits in: walk the sections in order.
    bounds = [(m.start(), _text(m.group(1))) for m in _SECTION.finditer(html_text)]

    def section_at(pos):
        title = ''
        for start, t in bounds:
            if start <= pos: title = t
            else: break
        return title

    def card_sub(m):
        open_tag, cid = m.group(1), m.group(2)
        body, close = m.group('body'), m.group(5)
        attrs = m.group('attrs') or ''
        worth_rows = (_re.search(r'data-rows="(\d+)"', attrs) or [None, 0])[1]
        worth_reach = (_re.search(r'data-reach="([^"]*)"', attrs) or [None, ''])[1]
        n = cid[1:]
        title = _text((_re.search(r'<h3[^>]*>(.*?)</h3>', body, _re.S) or [None, ''])[1])
        ref = (_re.search(r'<p class="ref">reference: (.*?)</p>', body, _re.S) or [None, ''])[1]
        ref = _text(ref) or title
        body = promote_rec(body)
        # The card's OWN words win. `chips_for` guesses from the ask text, which
        # is right for a hand-written sheet and wrong for a built one whose
        # builder already said which two outcomes the item has.
        worth_chips = (_re.search(r'data-chips="([^"]*)"', attrs) or [None, ''])[1]
        ch = _chips_from_attr(html.unescape(worth_chips)) or chips_for(section_at(m.start()), body)
        # ⚠️ ONLY A CARD THAT STATES A PROPOSAL ARRIVES SELECTED. The first chip
        # is the one that confirms the proposal, so it is the default — but a
        # card with nothing proposed has nothing to opt out OF, and pre-selecting
        # there would invent a recommendation the sheet never made.
        pre = _chip(ch[0])[1] if (ch and _ask_text(body)) else None
        block = replies_block(n, ref, ch, title, kind="item", other=other_for(ch),
                              rows=int(worth_rows or 0),
                              reach=(worth_reach.split() if worth_reach else None),
                              preselect=pre)
        # Every memory the batch lists gets its own compact block (Sam,
        # 2026-09-05: "the response controls on each memory, not just on the
        # whole batch"); its id is <item>.<reference>, so the reply line and
        # the store both say which memory under which item.
        ech = entry_chips(body)
        def entry_sub(em):
            e_title = _text(em.group(3)); e_ref = _text(em.group(4))
            e_item = n + "." + _re.sub(r'[^A-Za-z0-9_\-.~:@+]', '-', e_ref)
            e_block = replies_block(e_item, e_ref, ech, e_title, compact=True, kind="entry", parent=n)
            return em.group(1) + em.group(2) + MARK_S + e_block + MARK_E + em.group(5)
        body = _ENTRY.sub(entry_sub, body)
        return open_tag + body + MARK_S + block + MARK_E + close

    def done_sub(m):
        open_tag, did, body, close = m.group(1), m.group(2), m.group(3), m.group(4)
        n = 'D' + did[1:]
        title = _text((_re.search(r'<span class="gt">(.*?)</span>', body, _re.S) or [None, ''])[1])
        ref = _text((_re.search(r'<span class="ref">reference: (.*?)</span>', body, _re.S) or [None, ''])[1]) or title
        block = replies_block(n, ref, CHIPS_DONE, title, compact=True, kind="done")
        return open_tag + body + MARK_S + block + MARK_E + close

    html_text = _CARD.sub(card_sub, html_text)
    html_text = _DONE.sub(done_sub, html_text)
    html_text = _rest_stops(html_text)
    html_text = _submit_block(html_text)
    # CSS into the page's first </style>.
    css = CSS_S + REPLIES_CSS + CSS_E
    if '</style>' in html_text:
        html_text = html_text.replace('</style>', css + '</style>', 1)
    else:
        html_text = '<style>' + css + '</style>\n' + html_text
    # The how-to box learns about the chips.
    hi = _howto_end(html_text)
    if hi >= 0:
        html_text = html_text[:hi] + MARK_S + REPLIES_HOWTO + MARK_E + html_text[hi:]
    # The bar and the script at the foot.
    foot = MARK_S + REPLIES_BAR + replies_js(sheet_id) + MARK_E
    if '</body>' in html_text:
        html_text = html_text.replace('</body>', foot + '</body>', 1)
    else:
        html_text = html_text.rstrip() + "\n" + foot + "\n"
    return html_text


# ── building a sheet to the template ────────────────────────────────────────
# Every sheet before this one was hand-assembled, and the 2026-09-20 sheet is
# what that cost: the proposal in the facts' gray, a bare Yes that read two
# ways, and sixteen verdicts Sam had to reverse. A builder that calls this
# cannot make those three mistakes, which is the point of having one.

SHEET_HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%(title)s</title>
<style>
  /* First Light v1.6 tokens — values from prototype/first_light_theme_v1.html.
     A light identity, painted explicitly; every surface and color is a token. */
  :root {
    --paper: #F4F2ED; --text-strong: #1C1C1A; --text-body: #3A3A36; --text-muted: #5C5C55;
    --surface-opaque: #FFFFFF; --surface-subtle: #F7F5F1;
    --border: rgba(28,28,26,.14); --border-strong: rgba(28,28,26,.30);
    --cobalt: #0047AB; --seal-blue: #002F6D; --mustard-text: #8B6800;
    --rec-tint: #E8EFF8; --rest-tint: #FDF6E3;
    --focus-ring: var(--cobalt); --radius: 14px;
  }
  html { color-scheme: light; }
  body { background: var(--paper); color: var(--text-body);
    font-family: 'Source Sans 3', Arial, sans-serif; font-size: 16px; line-height: 1.55;
    margin: 0; padding: 0 16px 64px; }
  .wrap { max-width: var(--cpl-measure, 780px); margin: 0 auto; }
  a { color: var(--cobalt); }
  :focus-visible { outline: 3px solid var(--focus-ring); outline-offset: 2px; border-radius: 4px; }
  .skip { position: absolute; left: -9999px; top: 0; background: var(--surface-opaque);
    color: var(--cobalt); padding: 8px 14px; z-index: 10; }
  .skip:focus { left: 8px; }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
  h1 { font-family: 'Playfair Display', Georgia, serif; color: var(--text-strong); text-wrap: balance;
    font-size: clamp(1.7rem, 5vw, 2.4rem); line-height: 1.15; margin: 34px 0 8px; }
  h2 { font-family: 'Playfair Display', Georgia, serif; color: var(--text-strong);
    font-size: 1.25rem; margin: 36px 0 4px; }
  h3 { font-size: 1.05rem; font-weight: 700; color: var(--text-strong); margin: 0; }
  .card { background: var(--surface-opaque); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 16px 20px; margin: 16px 0; }
  .card .ref { color: var(--text-muted); font-size: .84rem; margin: 2px 0 10px; }
  .card dl { margin: 0; }
  .card dt { font-size: .72rem; text-transform: uppercase; letter-spacing: .08em;
    font-weight: 700; color: var(--text-muted); margin-top: 10px; }
  .card dd { margin: 2px 0 0; }
  .howto { background: var(--surface-opaque); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 16px 20px; margin: 22px 0 8px; }
  .howto p { margin: 6px 0; }
  @media (max-width: 560px) { .card { padding: 14px; } }
</style>
</head>
<body>
<a class="skip" href="#items">Skip to the decisions</a>
<main class="wrap">
<h1>%(title)s</h1>
%(intro)s
<section class="group" id="items">
"""

# ⚠️ THE SHEET OPENS ON THE DECISIONS (Sam, 2026-09-21): "You can delete the
# intro part of the decision sheet and start directly with the decisions." The
# framing, the how-to box and the section heading are gone by default; the
# title stays, because a page with no h1 has no outline and nothing to name it.
# His 2026-09-20 ruling that "the framing sits in the header, in his words"
# still holds where a sheet wants it — pass `framing=` to put it back — but a
# reader who has to scroll past preamble to reach item 1 pays that cost on
# every sitting, and the chips now name their own outcomes, so the how-to has
# little left to explain.
INTRO_BLOCK = """%(framing)s
<div class="howto"><p>%(howto)s</p></div>
"""


_CHIP_BAD = ';|"<>&'


def _chips_attr(chips):
    """Serialize a card's chips onto the card itself, so the inject pass uses
    THE WORDS THE BUILDER CHOSE rather than guessing them from the ask text.

    ⚠️ `build_sheet` documented a `chips` argument from the day it was written
    and never used one: every card's words came from `chips_for`, which reads
    the ask for "fold" or "merge" and otherwise falls back to CHIPS_DEFAULT —
    whose first word is the bare `Yes` that produced sixteen reversals on the
    2026-09-20 sheet. A sheet whose items propose a PLAN cannot honestly put
    the word fold in its ask to buy better chips, so the argument had to become
    real. A card with no `data-chips` still falls back to `chips_for`, so every
    sheet built before this keeps the words it shipped with."""
    out = []
    for c in chips:
        label, value = _chip(c)
        bad = [ch for ch in _CHIP_BAD if ch in label + value]
        if bad:
            raise ValueError(
                "a chip label or value cannot carry %s: %r/%r" % (" ".join(bad), label, value))
        out.append(label + "|" + value)
    return ";".join(out)


def _chips_from_attr(s):
    """Read back what `_chips_attr` wrote. An empty or malformed attribute
    returns nothing, so the caller falls back to `chips_for` rather than
    rendering a card with no way to answer it."""
    out = []
    for part in (s or "").split(";"):
        if not part:
            continue
        label, sep, value = part.partition("|")
        if not label or not sep or not value:
            return []
        out.append((label, value))
    return out


def _worth(it):
    """What settling this item is worth, as attributes on its card. `reach` is a
    collection of college ids — never a count, for the reason `replies_block`
    refuses one."""
    out = ''
    if it.get('rows'):
        out += f' data-rows="{int(it["rows"])}"'
    reach = it.get('reach')
    if reach is not None and not isinstance(reach, (list, tuple, set, frozenset)):
        raise TypeError("reach takes the college ids this item reaches, not a count")
    if reach:
        out += f' data-reach="{E(" ".join(sorted(str(x) for x in reach)))}"'
    if it.get('chips'):
        out += f' data-chips="{E(_chips_attr(it["chips"]))}"'
    return out


def build_sheet(title, items, framing=None, curator="", counts="", sheet_id=None,
                howto="", chips=None):
    """A whole sheet, built to the template. `items` are dicts carrying `title`,
    `ref`, `facts`, `rec`, `why`, and optionally `rows`, `reach` and `chips`.

    The proposal goes in as `rec` and lands in the callout above the chips; the
    chips default to CHIPS_FOLD with Edit and Dismiss behind Other; a stopping
    point falls every REST_EVERY items; the framing and the curator of record
    sit in the header. Returns the finished HTML, reply controls already in."""
    chips = chips or CHIPS_FOLD
    intro_html = ''
    if framing or curator or counts or howto:
        intro_html = INTRO_BLOCK % {
            'framing': framing_block(framing, curator=curator, counts=counts),
            'howto': E(howto) if howto else E(
                "Each item says what I propose, in the panel above the chips. "
                "Click a reply under each one."),
        }
    head = SHEET_HEAD % {'title': E(title), 'intro': intro_html}
    body = []
    for i, it in enumerate(items, 1):
        # The sheet's chips are every item's default; an item may override.
        it = dict(it, chips=it.get('chips') or chips)
        body.append(
            f'<article class="card" id="i{i}"{_worth(it)}>\n<h3>{i} &middot; {E(it["title"])}</h3>\n'
            f'<p class="ref">reference: {E(it.get("ref", ""))}</p>\n<dl>\n'
            f'<dt>What this is</dt><dd>{it["facts"]}</dd>\n'
            f'<dt>Why</dt><dd>{it.get("why", "")}</dd>\n'
            f'<dt>What I propose</dt><dd class="ask">{it["rec"]}</dd>\n'
            f'</dl>\n</article>')
    html_text = head + "\n".join(body) + "\n</section>\n</main>\n</body>\n</html>"
    return inject(html_text, sheet_id or 'sheet')


def main(argv=None):
    import argparse, os, sys
    ap = argparse.ArgumentParser(description="Add reply chips, notes and a follow-up flag to a decision sheet (idempotent).")
    ap.add_argument('--inject', metavar='SHEET.html', required=True, help='the sheet to add reply controls to, in place')
    ap.add_argument('--sheet-id', help='keys the browser copy of the replies (default: the file name)')
    a = ap.parse_args(argv)
    sid = a.sheet_id or os.path.splitext(os.path.basename(a.inject))[0]
    src = open(a.inject, encoding='utf-8').read()
    out = inject(src, sid)
    open(a.inject, 'w', encoding='utf-8').write(out)
    n_items = out.count('class="reply" data-item=') + out.count('class="reply reply-compact" data-item=')
    print(f"{a.inject}: {n_items} reply blocks · sheet id {sid} · {len(out.encode())} bytes")


if __name__ == '__main__':
    main()

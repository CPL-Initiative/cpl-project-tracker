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

CHIPS_DEFAULT = ["Yes", "Keep", "Retire", "Edit", "Later"]
CHIPS_CLASS = ["Yes", "No", "Later"]
CHIPS_GROUP = ["Yes", "Keep", "Later"]
CHIPS_DONE = ["Undo"]


CHIPS_ENTRY_VERIFY = ["Yes", "Hold out", "Rewrite", "Later"]
CHIPS_ENTRY_RETIRE = ["Yes", "Keep", "Later"]


def replies_block(item, ref="", chips=None, title="", compact=False, kind="item", parent=""):
    """The reply controls for one item. `item` is the number a reply names
    ("3", "D7", or "2.o3" for one memory inside item 2); `ref` is what the
    session needs to act (a slug, an id, a class key); `chips` are the verdict
    words offered, Yes first; `kind` is item / entry / done, `parent` the item
    an entry belongs to. Sam, 2026-09-05: "I need the response controls on each
    memory, not just on the whole batch" — an entry block sits under every
    memory a batch item lists, and Yes there means the batch's recommendation
    for that one memory."""
    chips = list(chips or CHIPS_DEFAULT)
    n = str(item)
    btns = "".join(
        f'<button type="button" class="reply-chip" data-v="{E(c.lower())}" aria-pressed="false">{E(c)}</button>'
        for c in chips)
    ph = ("Why, or what to do instead" if compact
          else "A condition, a rewrite, a name to hold out, what to follow up on")
    return (
        f'<div class="reply{" reply-compact" if compact else ""}" data-item="{E(n)}" data-ref="{E(ref)}" '
        f'data-title="{E(title)}" data-kind="{E(kind)}" data-parent="{E(parent)}">'
        f'<div class="reply-row" role="group" aria-label="Your reply to item {E(n)}">'
        f'<span class="reply-lbl">Your reply</span>{btns}'
        f'<button type="button" class="reply-chip reply-fu" aria-pressed="false" '
        f'title="Mark this for the session to follow up on, whatever the verdict">Follow up</button>'
        f'</div>'
        f'<label class="reply-notelbl" for="note-{E(n)}">Notes for the session</label>'
        f'<textarea id="note-{E(n)}" class="reply-note" rows="{1 if compact else 2}" placeholder="{E(ph)}"></textarea>'
        f'<p class="reply-state" aria-live="polite"></p>'
        f'</div>')


REPLIES_HOWTO = (
    '<p><strong>Or click your reply under each item — and under each memory a batch item lists.</strong> Yes takes the recommendation '
    '(on a single memory, the batch\'s recommendation for that one); Hold out and Rewrite keep a memory back from a batch verdict; '
    'Follow up marks an item the session should come back to whatever the verdict; the note '
    'is for anything a word cannot carry. On the artifact your replies save to the sheet itself '
    'and the session reads them from there. Opened anywhere else they stay in this browser, and '
    '<em>Copy replies</em> at the foot of the page builds the numbered line for you to paste.</p>')

REPLIES_BAR = (
    '<div class="reply-bar" id="reply-bar" role="region" aria-label="Your replies so far">'
    '<span class="reply-count" id="reply-count">0 replied</span>'
    '<span class="reply-where" id="reply-where"></span>'
    '<button type="button" class="reply-chip reply-copy" id="reply-copy">Copy replies</button>'
    '<details class="reply-show"><summary>Show the reply line</summary>'
    '<textarea id="reply-line" class="reply-line" rows="4" readonly aria-label="The reply line, ready to paste"></textarea>'
    '</details>'
    '</div>')

REPLIES_CSS = r"""
  /* ── replies: chips, a note, a follow-up flag (Sam, 2026-09-05) ── */
  .reply { margin: 12px 0 0; padding-top: 10px; border-top: 1px dashed var(--border); }
  .reply-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .reply-lbl { font-size: .72rem; text-transform: uppercase; letter-spacing: .08em; font-weight: 700;
    color: var(--text-muted); margin-right: 4px; }
  .reply-chip { font: inherit; font-size: .86rem; font-weight: 600; min-height: 30px; padding: 3px 12px;
    border: 1px solid var(--border-strong); border-radius: 6px; background: var(--surface-opaque);
    color: var(--text-body); cursor: pointer; }
  .reply-chip:hover { background: var(--surface-subtle); }
  .reply-chip[aria-pressed="true"] { background: var(--seal-blue); border-color: var(--seal-blue); color: #fff; }
  .reply-chip.reply-fu { margin-left: auto; }
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
  ol.done li { position: relative; }
  .reply-bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 5; background: var(--surface-opaque);
    border-top: 1px solid var(--border-strong); padding: 8px 16px; display: flex; flex-wrap: wrap;
    gap: 6px 14px; align-items: center; font-size: .9rem; box-shadow: 0 -6px 18px rgba(28,28,26,.08); }
  .reply-count { font-weight: 700; color: var(--text-strong); font-variant-numeric: tabular-nums; }
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
  var SHEET = %s;
  var LS = "sheet-replies:" + SHEET;
  var els = Array.prototype.slice.call(document.querySelectorAll(".reply[data-item]"));
  if (!els.length) return;
  var state = {};        // item -> {item, ref, title, v, note, fu, t}
  var col = null;        // the artifact's shared store, once this view can reach it
  var where = "local";   // "db" once the store answers
  var pending = {};

  function read(){ try { var s = JSON.parse(localStorage.getItem(LS) || "{}"); if (s && typeof s === "object") state = s; } catch (e) {} }
  function keep(){ try { localStorage.setItem(LS, JSON.stringify(state)); } catch (e) {} }
  function byItem(item){ for (var i = 0; i < els.length; i++) if (els[i].getAttribute("data-item") === item) return els[i]; return null; }
  function rec(item){
    if (state[item]) return state[item];
    var el = byItem(item);
    return { item: item, ref: el ? el.getAttribute("data-ref") : "", title: el ? el.getAttribute("data-title") : "", v: "", note: "", fu: false };
  }
  function empty(r){ return !r || (!r.v && !r.fu && !r.note); }
  function stateWords(item, r){
    if (empty(r)) return "";
    if (pending[item] === "saving") return "Saving…";
    if (pending[item] === "failed") return "Could not save to the sheet; kept in this browser. Use Copy replies.";
    return where === "db" ? "Saved to the sheet." : "Saved in this browser only — use Copy replies to send it.";
  }
  function paint(el){
    if (!el) return;
    var item = el.getAttribute("data-item"), r = state[item] || {};
    Array.prototype.forEach.call(el.querySelectorAll(".reply-chip[data-v]"), function(b){
      b.setAttribute("aria-pressed", r.v && r.v === b.getAttribute("data-v") ? "true" : "false");
    });
    var fu = el.querySelector(".reply-fu"); if (fu) fu.setAttribute("aria-pressed", r.fu ? "true" : "false");
    var note = el.querySelector(".reply-note");
    if (note && document.activeElement !== note && (r.note || "") !== note.value) note.value = r.note || "";
    var st = el.querySelector(".reply-state"); if (st) st.textContent = stateWords(item, r);
  }
  function paintAll(){ els.forEach(paint); bar(); }
  function set(item, patch){
    var r = rec(item); for (var k in patch) r[k] = patch[k];
    r.t = new Date().toISOString();
    state[item] = r; keep();
    paint(byItem(item)); bar(); push(item);
  }
  function push(item){
    if (!col) return;
    var r = state[item]; if (!r) return;
    pending[item] = "saving"; paint(byItem(item));
    col.doc(item).set(r).then(function(){ pending[item] = ""; paint(byItem(item)); bar(); },
                          function(){ pending[item] = "failed"; paint(byItem(item)); bar(); });
  }

  /* ── the bar: how many, where they are, the line to paste ── */
  function line(){
    var parts = [];
    els.forEach(function(el){
      var item = el.getAttribute("data-item"), r = state[item];
      if (empty(r)) return;
      var s = item + " " + (r.v ? r.v : "(no verdict)");
      if (r.fu) s += ", follow up";
      if (r.note) s += " — “" + String(r.note).replace(/\s+/g, " ").trim() + "”";
      parts.push(s);
    });
    return parts.length ? parts.join(" · ") : "No replies yet.";
  }
  function bar(){
    var n = { item: [0, 0], entry: [0, 0], done: [0, 0] }, fu = 0;
    els.forEach(function(el){
      var k = el.getAttribute("data-kind") || "item"; if (!n[k]) n[k] = [0, 0];
      var r = state[el.getAttribute("data-item")];
      n[k][1]++; if (!empty(r)) n[k][0]++; if (r && r.fu) fu++;
    });
    var parts = [];
    if (n.item[1]) parts.push(n.item[0] + " of " + n.item[1] + " items");
    if (n.entry[1]) parts.push(n.entry[0] + " of " + n.entry[1] + " memories");
    if (n.done[1]) parts.push(n.done[0] + " of " + n.done[1] + " retired rows");
    var c = document.getElementById("reply-count");
    if (c) c.textContent = parts.join(" · ") + " replied" + (fu ? " · " + fu + " to follow up" : "");
    var w = document.getElementById("reply-where");
    if (w) w.textContent = where === "db"
      ? "Replies save to this sheet; the session reads them from here."
      : "Replies stay in this browser until you copy them into the session.";
    var t = document.getElementById("reply-line"); if (t) t.value = line();
  }
  var copy = document.getElementById("reply-copy");
  if (copy) copy.addEventListener("click", function(){
    var text = line(), done = function(ok){
      copy.textContent = ok ? "Copied" : "Select the line below and copy it";
      setTimeout(function(){ copy.textContent = "Copy replies"; }, 2200);
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
          if (!cur || String(r.t || "") >= String(cur.t || "")) state[r.item] = r;
        });
        // Anything this browser holds that the sheet does not: send it up once.
        Object.keys(state).forEach(function(item){ if (!seen[item] && !pending[item] && !empty(state[item])) push(item); });
        keep(); paintAll();
      }, function(){ where = "local"; col = null; paintAll(); });
      paintAll();
    }, function(){});
  }

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

_CARD = _re.compile(r'(<article class="card(?: lift)?" id="(i\d+)">)(.*?)(</article>)', _re.S)
_DONE = _re.compile(r'(<li id="(d\d+)">)(.*?)(</li>)', _re.S)
_SECTION = _re.compile(r'<section class="group">\s*<h2>(.*?)</h2>', _re.S)


def _strip(html_text):
    """Remove every earlier injection so the pass is idempotent."""
    html_text = _re.sub(_re.escape(MARK_S) + r'.*?' + _re.escape(MARK_E), '', html_text, flags=_re.S)
    html_text = _re.sub(_re.escape(CSS_S) + r'.*?' + _re.escape(CSS_E), '', html_text, flags=_re.S)
    return html_text


def _text(fragment):
    return _re.sub(r'\s+', ' ', _re.sub(r'<.*?>', '', fragment or '')).strip()


_ENTRY = _re.compile(r'(<li>)(<span class="gt">(.*?)</span>.*?<span class="ref">reference: (.*?)</span>)(</li>)', _re.S)


def entry_chips(card_html):
    """What one memory inside a batch can be told, read off the batch's ask."""
    ask = _text((_re.search(r'<dd class="ask">(.*?)</dd>', card_html, _re.S) or [None, ''])[1]).lower()
    if 'verified' in ask:
        return CHIPS_ENTRY_VERIFY
    if 'retire' in ask:
        return CHIPS_ENTRY_RETIRE
    return CHIPS_DEFAULT


def chips_for(section_title, card_html):
    """Which words a card offers, by the section it sits in and its shape."""
    t = (section_title or '').lower()
    h3 = _text((_re.search(r'<h3[^>]*>(.*?)</h3>', card_html, _re.S) or [None, ''])[1])
    ask = _text((_re.search(r'<dd class="ask">(.*?)</dd>', card_html, _re.S) or [None, ''])[1]).lower()
    if 'older only' in ask:
        return ["Yes", "Older only", "No", "Later"]
    if t.startswith('rulings that cover') or t.startswith('your own earlier rulings'):
        return CHIPS_CLASS
    if _re.search(r'entries replaced by one newer ruling', h3, _re.I):
        return CHIPS_GROUP
    return CHIPS_DEFAULT


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
        open_tag, cid, body, close = m.group(1), m.group(2), m.group(3), m.group(4)
        n = cid[1:]
        title = _text((_re.search(r'<h3[^>]*>(.*?)</h3>', body, _re.S) or [None, ''])[1])
        ref = (_re.search(r'<p class="ref">reference: (.*?)</p>', body, _re.S) or [None, ''])[1]
        ref = _text(ref) or title
        block = replies_block(n, ref, chips_for(section_at(m.start()), body), title, kind="item")
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
    # CSS into the page's first </style>.
    css = CSS_S + REPLIES_CSS + CSS_E
    if '</style>' in html_text:
        html_text = html_text.replace('</style>', css + '</style>', 1)
    else:
        html_text = '<style>' + css + '</style>\n' + html_text
    # The how-to box learns about the chips.
    hi = html_text.find('class="howto"')
    if hi >= 0:
        end = html_text.find('</div>', hi)
        if end >= 0:
            html_text = html_text[:end] + MARK_S + REPLIES_HOWTO + MARK_E + html_text[end:]
    # The bar and the script at the foot.
    foot = MARK_S + REPLIES_BAR + replies_js(sheet_id) + MARK_E
    if '</body>' in html_text:
        html_text = html_text.replace('</body>', foot + '</body>', 1)
    else:
        html_text = html_text.rstrip() + "\n" + foot + "\n"
    return html_text


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

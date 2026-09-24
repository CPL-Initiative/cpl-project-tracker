#!/usr/bin/env python3
"""Build the Implementation Funding tab review sheet from capture.json.

The capture (capture.js) is the tab as the live config paints it, with every
section numbered as an item and every block of text inside it tagged N.k. This
wraps it in the decision-sheet reply mechanics from kb/_decision_sheet_replies.py
so a note per section lands in the artifact's `replies` store.
"""
import json
import re
import sys
from datetime import datetime, timezone

sys.path.insert(0, '/home/user/cpl-project-tracker/kb')
import _decision_sheet_replies as m  # noqa: E402

E = m.E
HERE = '/tmp/claude-0/-home-user/ba2ba479-7554-5d85-b850-79f4702ec144/scratchpad'
SHEET_ID = '2026-09-24-funding-tab-review'
CHIPS = [('Leave as is', 'leave'), ('Change it', 'change')]
NOTE_PH = 'Cite the reference (for example 5.12) and give the wording or format you want'

cap = json.load(open(f'{HERE}/fs/capture.json'))
snap = json.load(open(f'{HERE}/fs/snapshot.json'))
items = cap['items']
cfg_at = snap['config']['updated_at'][:16].replace('T', ' ')
now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')


def card(it):
    n, title, k = it['n'], it['title'], it['refs']
    refs = f'References {n}.1 to {n}.{k}' if k else 'No references inside'
    block = m.replies_block(str(n), ref=f"implementation-funding#{it['id']}", chips=CHIPS, title=title)
    block = block.replace('A condition, a rewrite, a name to hold out, what to follow up on', NOTE_PH)
    return (f'<section class="rv-card" id="item-{n}" aria-labelledby="rv-h-{n}">'
            f'<h2 class="rv-card-h" id="rv-h-{n}"><span class="rv-num">Item {n}</span> {E(title)}</h2>'
            f'<p class="rv-card-sub">Your notes on this section · {refs}</p>{block}</section>')


pane = cap['pane']
pane = re.sub(r'<span class="rv-ref">(\d+\.\d+)</span>(?=<(?:textarea|input|table)\b)',
              r'<span class="rv-ref" data-rv-to="next" data-ref="\1">\1</span>', pane)
pane = re.sub(r'<span class="rv-ref">(\d+\.\d+)</span>',
              r'<span class="rv-ref" data-rv-to="parent" data-ref="\1">\1</span>', pane)
by_n = {str(it['n']): it for it in items}
pane, hits = re.subn(r'<div class="rv-slot" data-n="(\d+)"[^>]*></div>', lambda mm: card(by_n[mm.group(1)]), pane)
assert hits == len(items), (hits, len(items))

jump = ''.join(f'<li><a href="#item-{it["n"]}"><span class="rv-num">{it["n"]}</span> {E(it["title"])}</a></li>' for it in items)

CHROME_CSS = r"""
:root {
  --rv-tag-bg: #E6ECF5; --rv-tag-fg: #002F6D;
  --rv-card-bg: #EEF3FA; --rv-card-rule: #002F6D;
  --rec-tint: #E8EFF8; --rest-tint: #FDF6E3;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --rv-tag-bg: #1E2B3F; --rv-tag-fg: #C3D3EA;
    --rv-card-bg: #1A2433; --rv-card-rule: #7DA1D4;
    --rec-tint: #1E2B3F; --rest-tint: #2E2816;
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --rv-tag-bg: #1E2B3F; --rv-tag-fg: #C3D3EA;
  --rv-card-bg: #1A2433; --rv-card-rule: #7DA1D4;
  --rec-tint: #1E2B3F; --rest-tint: #2E2816;
  color-scheme: dark;
}
body { background-color: var(--bg-off-white, #F7F5F1); }
.rv-wrap { padding-inline: 16px; padding-block: 20px 140px; max-width: 1200px; margin: 0 auto; }
.rv-wrap .cpl-layout { display: block; }
.rv-wrap .cpl-main { min-width: 0; }
.rv-wrap .cpl-tab-pane { display: block; }
.rv-head { display: grid; gap: 10px; margin: 0 0 18px; }
.rv-head h1 { font-family: "Playfair Display", Georgia, serif; font-size: clamp(1.4rem, 3vw, 1.9rem);
  line-height: 1.2; margin: 0; color: var(--text-strong, #1C1C1A); text-wrap: balance; }
.rv-head p { margin: 0; color: var(--text-body, #3A3A36); max-width: var(--cpl-measure, none); }
.rv-head .rv-fine { font-size: .88rem; color: var(--text-muted, #5E5E58); }
.rv-jump { list-style: none; padding: 0; margin: 4px 0 0; display: flex; flex-wrap: wrap; gap: 6px 8px; }
.rv-jump a { display: inline-flex; align-items: center; gap: 6px; min-height: 32px; padding: 4px 10px;
  border: 1px solid var(--border-strong, rgba(28,28,26,.30)); border-radius: 999px; text-decoration: none;
  color: var(--text-strong, #1C1C1A); background: var(--surface-opaque, #FFFFFF); font-size: .88rem; }
.rv-jump a:hover { border-color: var(--rv-card-rule); }
.rv-jump a:focus-visible, .rv-card :focus-visible { outline: 2px solid var(--rv-card-rule); outline-offset: 2px; }
.rv-num { font-variant-numeric: tabular-nums; font-weight: 700; color: var(--rv-tag-fg); }
/* The reference tags: the quietest thing on the line, readable when looked for. */
.rv-ref { display: inline-block; font: 600 11px/1.5 "Source Sans 3", Arial, sans-serif; font-variant-numeric: tabular-nums;
  letter-spacing: .02em; color: var(--rv-tag-fg); background: var(--rv-tag-bg); border-radius: 4px;
  padding: 0 5px; margin: 0 6px 0 0; vertical-align: 1px; text-transform: none; white-space: nowrap;
  user-select: all; }
.rv-sec { display: inline-block; font: 700 12px/1.6 "Source Sans 3", Arial, sans-serif; letter-spacing: .03em;
  color: #FFFFFF; background: #002F6D; border-radius: 4px; padding: 0 7px; margin-right: 10px; vertical-align: 2px; }
.rv-card { background: var(--rv-card-bg); border-left: 4px solid var(--rv-card-rule); border-radius: 8px;
  padding: 14px 16px 12px; margin: 10px 0 26px; scroll-margin-top: 16px; }
.rv-card-h { margin: 0; font: 700 1.05rem/1.3 "Source Sans 3", Arial, sans-serif; color: var(--text-strong, #1C1C1A); }
.rv-card-sub { margin: 2px 0 0; font-size: .86rem; color: var(--text-muted, #5E5E58); }
.rv-card .reply { border-top: none; padding-top: 4px; }
/* The tab's own formula line runs past 390px (a known a11y finding); wrap it here so the page never scrolls sideways. */
.rv-wrap code { white-space: normal; overflow-wrap: anywhere; }
/* Editable lines: a quiet dotted rule until focused, a tint once edited. */
.rv-edit { outline: none; border-radius: 4px; box-shadow: inset 0 -1px 0 transparent; }
.rv-edit[contenteditable]:hover { box-shadow: inset 0 -1px 0 var(--rv-card-rule); cursor: text; }
.rv-edit[contenteditable]:focus-visible, .rv-edit[contenteditable]:focus { box-shadow: 0 0 0 2px var(--rv-card-rule); }
.rv-edited { background: var(--rest-tint); box-shadow: inset 3px 0 0 var(--mustard-text, #8B6800); }
.rv-mark { display: inline-flex; align-items: center; gap: 6px; margin: 0 6px 0 0; font: 600 11px/1.5 "Source Sans 3", Arial, sans-serif;
  color: var(--text-strong, #1C1C1A); vertical-align: 1px; user-select: none; }
.rv-undo { font: inherit; min-height: 24px; padding: 0 8px; border: 1px solid var(--border-strong, rgba(28,28,26,.30));
  border-radius: 6px; background: var(--surface-opaque, #FFFFFF); color: var(--text-strong, #1C1C1A); cursor: pointer; }
.rv-undo:focus-visible { outline: 2px solid var(--rv-card-rule); outline-offset: 1px; }
.rv-edits-state { font-size: .9rem; color: var(--text-body, #3A3A36); min-height: 1em; }
.reply-bar { padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px)); }
@media (max-width: 560px) { .rv-wrap { padding-inline: 12px; } .rv-card { padding-inline: 12px; } }
@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto !important; } }
"""

EDIT_JS = r'''
<script>
(function(){
  "use strict";
  var SHEET = %s, LS = "sheet-edits:" + SHEET;
  var lines = {};                       // ref -> {ref, el, field, orig, tag}
  var saved = {};                       // ref -> the "after" the store holds
  var col = null, timers = {};
  var BAD = "button, input, select, textarea, details, table, summary";
  function norm(t){ return String(t || "").replace(/\s+/g, " ").trim(); }
  function textOf(el){
    var c = el.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll(".rv-ref, .rv-mark"), function(x){ x.parentNode.removeChild(x); });
    return norm(c.textContent);
  }
  function current(L){ return L.field ? norm(L.el.value) : textOf(L.el); }
  Array.prototype.forEach.call(document.querySelectorAll(".rv-ref[data-rv-to]"), function(tag){
    var ref = tag.getAttribute("data-ref"), el, field = false;
    if (tag.getAttribute("data-rv-to") === "next") {
      el = tag.nextElementSibling;
      if (!el || !/^(TEXTAREA|INPUT)$/.test(el.tagName)) return;      // a table is not a line
      field = true;
    } else {
      el = tag.parentElement;
      if (!el || el.closest("summary") || el.querySelector(BAD)) return;   // controls inside: the note carries it
    }
    tag.setAttribute("contenteditable", "false");
    var L = { ref: ref, el: el, field: field, tag: tag };
    L.orig = current(L);
    lines[ref] = L;
    el.classList.add("rv-edit");
    if (!field) { try { el.contentEditable = "plaintext-only"; } catch (e) { el.contentEditable = "true"; }
      if (el.contentEditable !== "plaintext-only") el.contentEditable = "true";
      el.setAttribute("spellcheck", "true"); el.setAttribute("aria-label", "Line " + ref + ", editable"); }
    el.addEventListener("input", function(){ keepTag(L); clearTimeout(timers[ref]); mark(L, "saving"); timers[ref] = setTimeout(function(){ commit(L); }, 700); });
    el.addEventListener("blur", function(){ clearTimeout(timers[ref]); commit(L); });
  });
  function keepTag(L){
    if (L.field || L.el.contains(L.tag)) return;
    L.el.insertBefore(L.tag, L.el.firstChild);      // an edit that swallowed the tag gets it back
  }
  function mark(L, state, why){
    var m = L.el.querySelector(":scope > .rv-mark") || (L.field && L.tag.nextElementSibling && L.tag.nextElementSibling.classList &&
      L.tag.nextElementSibling.classList.contains("rv-mark") ? L.tag.nextElementSibling : null);
    if (!state) { if (m) m.parentNode.removeChild(m); L.el.classList.remove("rv-edited"); return; }
    if (!m) {
      m = document.createElement("span"); m.className = "rv-mark"; m.setAttribute("contenteditable", "false");
      m.innerHTML = '<span class="rv-mark-txt"></span><button type="button" class="rv-undo">Undo</button>';
      m.querySelector(".rv-undo").addEventListener("click", function(ev){ ev.preventDefault(); undo(L); });
      if (L.field) L.tag.parentNode.insertBefore(m, L.tag.nextSibling); else L.tag.parentNode.insertBefore(m, L.tag.nextSibling);
    }
    L.el.classList.add("rv-edited");
    m.querySelector(".rv-mark-txt").textContent = state === "saved" ? "Edited, saved" :
      state === "saving" ? "Edited, saving" : state === "local" ? "Edited, saved in this browser only" : "Edited, not saved: " + (why || "try again");
  }
  function setText(L, t){
    if (L.field) { L.el.value = t; return; }
    var m = L.el.querySelector(":scope > .rv-mark");
    L.el.textContent = "";
    L.el.appendChild(L.tag); if (m) L.el.appendChild(m);
    L.el.appendChild(document.createTextNode(t));
  }
  function local(){ try { return JSON.parse(localStorage.getItem(LS) || "{}") || {}; } catch (e) { return {}; } }
  function keepLocal(ref, rec){ try { var o = local(); if (rec) o[ref] = rec; else delete o[ref]; localStorage.setItem(LS, JSON.stringify(o)); } catch (e) {} }
  function commit(L){
    var now = current(L);
    if (now === L.orig) { if (saved[L.ref] !== undefined || local()[L.ref]) drop(L); else mark(L, null); return; }
    if (saved[L.ref] === now) { mark(L, col ? "saved" : "local"); return; }
    var rec = { ref: L.ref, item: L.ref.split(".")[0], before: L.orig, after: now, t: new Date().toISOString() };
    keepLocal(L.ref, rec);
    if (!col) { mark(L, "local"); count(); return; }
    col.doc(L.ref).set(rec).then(function(){ saved[L.ref] = now; mark(L, "saved"); count(); },
      function(e){ mark(L, "failed", e && e.code ? e.code : ""); });
  }
  function drop(L){
    keepLocal(L.ref, null); delete saved[L.ref]; mark(L, null); count();
    if (col) { try { col.doc(L.ref).delete(); } catch (e) {} }
  }
  function undo(L){ setText(L, L.orig); clearTimeout(timers[L.ref]); drop(L); }
  function count(){
    var n = Object.keys(lines).filter(function(r){ return lines[r].el.classList.contains("rv-edited"); }).length;
    var s = document.getElementById("rv-edits-state");
    if (s) s.textContent = n ? (n + (n === 1 ? " line" : " lines") + " edited in place" + (col ? ", saved to this sheet." : ", kept in this browser.")) : "";
  }
  function apply(rec){
    var L = rec && lines[rec.ref]; if (!L || typeof rec.after !== "string") return;
    if (current(L) !== rec.after && document.activeElement !== L.el) setText(L, rec.after);
    saved[rec.ref] = rec.after; mark(L, col ? "saved" : "local");
  }
  var lo = local(); Object.keys(lo).forEach(function(r){ apply(lo[r]); }); count();
  var C = window.claude;
  if (!C || typeof C.use !== "function") return;
  var p; try { p = C.use("db"); } catch (e) { return; }
  if (!p || typeof p.then !== "function") return;
  p.then(function(db){
    if (!db) return;
    col = db.collection("edits");
    col.get().then(function(snap){
      var seen = {};
      snap.docs.forEach(function(d){ var r = d.data(); if (r && r.ref) { seen[r.ref] = 1; apply(r); } });
      Object.keys(lo).forEach(function(r){ if (!seen[r] && lines[r]) commit(lines[r]); });   // this browser's edits go up once
      count();
    }, function(){});
  }, function(){});
})();
</script>
'''

page = f"""<title>Funding Tab Review</title>
{''.join(f'<link rel="stylesheet" href="{E(h)}">' for h in cap['links'])}
<style>
{cap['css']}
</style>
<style>
{CHROME_CSS}
{m.REPLIES_CSS}
</style>
<div class="rv-wrap">
<header class="rv-head">
<h1>Implementation Funding tab review</h1>
<p>This page is the tab as the live model paints it: the configuration saved {E(cfg_at)} UTC, Scenario 1, captured {E(now)} UTC.
Each section is an item with its own number. Every paragraph, line, field and heading inside it carries a reference such as <span class="rv-ref">5.12</span>.</p>
<p><strong>Edit any tagged line in place:</strong> click into it and type. The change saves to this sheet with the original kept,
and the line shows it was edited, with Undo beside it.</p>
<p>For anything a line edit cannot say, such as a title, a move or a format change, choose <strong>Change it</strong> under the section
and write it in the note. Saying the numbers in chat works too. Press Complete at the foot when you finish.</p>
<p class="rv-edits-state" id="rv-edits-state" aria-live="polite"></p>
<p class="rv-fine">Buttons and menus show what the tab displays and do nothing here, and section titles and tables are not editable in place.
The College Dashboard has the statewide row and Allan Hancock open to show the drill-in. The capture ran without a reviewer
sign-in, so the reviewer-only confirmation controls are absent. Funding window and Funding Breakdown are marked hidden on the
public page; the internal tab shows them, so they appear here.</p>
<ul class="rv-jump" aria-label="Jump to an item">{jump}</ul>
</header>
<div class="cpl-layout"><main class="cpl-main">
{pane}
</main></div>
{m.SUBMIT_BLOCK}
</div>
{m.REPLIES_BAR}
{m.replies_js(SHEET_ID)}
{EDIT_JS % json.dumps(SHEET_ID)}
"""
out = f'{HERE}/funding-tab-review.html'
open(out, 'w').write(page)
print(out, len(page.encode()) // 1024, 'KB', hits, 'items')

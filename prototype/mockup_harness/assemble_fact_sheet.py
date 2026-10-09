#!/usr/bin/env python3
"""The Fact Sheet on First Light, round 1 (S352, 2026-10-09).

Sam, Open Asks Sheet 56 card 1: "Mock it up". The mock-up is the public Fact
Sheet as capture_fact_sheet.mjs received it from the page's own code (today's
figures, the curator's live overrides), dressed two ways on one page:

  First Light  prototype/fact_sheet_first_light.css, the stylesheet the port
               would copy over fact-sheet/factsheet.css
  Today        fact-sheet/factsheet.css as it ships

A strip above the page switches the look and the theme. The page's own folds
(section headings, Collapse all, the statewide rec lists) are re-wired by a
small script, since the capture carries markup and no listeners; Save as Word,
Print, Ask Sierra and Curate are inert here and the strip says so.

    python3 assemble_fact_sheet.py <tree> <capture.json> <out.html>

The output is one self-contained file: an artifact page loads nothing from
another host, so the fonts and the page's four images are data URIs, and the
story photos (served from staging2.map.rccd.edu) are left out with a note.
Measure it with scripts/a11y.js over a copy wrapped in a document (see
README.md).
"""
import base64
import html
import json
import os
import re
import sys

tree, cap_path, out_path = sys.argv[1:4]
cap = json.load(open(cap_path, encoding="utf-8"))
E = html.escape


def data_uri(path, mime):
    with open(path, "rb") as f:
        return "data:%s;base64,%s" % (mime, base64.b64encode(f.read()).decode("ascii"))


today_css = open(os.path.join(tree, "fact-sheet/factsheet.css"), encoding="utf-8").read()
fl_css = open(os.path.join(tree, "prototype/fact_sheet_first_light.css"), encoding="utf-8").read()

# The proposed stylesheet names the fonts where the port would serve them.
fonts = re.findall(r"url\('\.\./sierra/fonts/([\w.-]+\.woff2)'\)", fl_css)
assert len(fonts) == 4, fonts
for name in fonts:
    fl_css = fl_css.replace("url('../sierra/fonts/%s')" % name,
                            "url('%s')" % data_uri(os.path.join(tree, "sierra/fonts", name), "font/woff2"))

body = cap["body"]
MIME = {".png": "image/png", ".jpg": "image/jpeg"}
for name in sorted(set(re.findall(r'src="\./img/([\w.-]+)"', body))):
    uri = data_uri(os.path.join(tree, "fact-sheet/img", name), MIME[os.path.splitext(name)[1]])
    body = body.replace('src="./img/%s"' % name, 'src="%s"' % uri)
# Story photos: an artifact may not load another host's image, so drop the tag
# rather than paint a broken one. The card was built to stand without it.
body, photos = re.subn(r'<img class="cpl-story-photo"[^>]*>', "", body)
body = re.sub(r"<!--[\s\S]*?-->", "", body)

injected = "\n".join('<style id="%s">%s</style>' % (E(s["id"]), s["css"]) for s in cap["styles"] if s["id"])

stamp = cap["as_of"].replace("data current as of ", "")
built = cap["captured_at"][:10]

MOCK_CSS = """
/* The mock-up's own strip: not part of the design. It reads the page's tokens,
   so it follows whichever look and theme are showing. */
.mock { background: var(--surface-subtle); border-bottom: 1px dashed var(--border-strong);
  color: var(--muted); font: 15px/1.5 var(--font-body); padding-inline: 16px; padding-block: 12px; }
.mock-in { max-width: var(--maxw); margin: 0 auto; display: grid; gap: 10px; }
.mock p { margin: 0; }
.mock b { color: var(--ink); }
.mock-row { display: flex; flex-wrap: wrap; gap: 8px 22px; align-items: center; }
.seg { display: inline-flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.seg > span { font-weight: 700; color: var(--ink); margin-right: 2px; }
.seg button { font: inherit; font-size: 14px; color: var(--ink); background: var(--surface);
  border: 1px solid var(--border-strong); border-radius: var(--radius-sm); min-height: 32px; padding: 3px 12px; cursor: pointer; }
.seg button[aria-pressed="true"] { background: var(--ink); color: var(--paper); border-color: var(--ink); }
.seg button:focus-visible { outline: 2px solid var(--cobalt); outline-offset: 2px; }
.mock details summary { cursor: pointer; color: var(--ink); font-weight: 600; min-height: 24px; }
.mock details summary:focus-visible { outline: 2px solid var(--cobalt); outline-offset: 2px; }
.mock ul { margin: 6px 0 0; padding-left: 20px; }
.mock li { margin: 3px 0; }
.mock-say { color: var(--ink); font-weight: 600; }
@media print { .mock { display: none; } }
"""

STRIP = """
<div class="mock" role="region" aria-label="About this mock-up">
  <div class="mock-in">
    <p><b>Mock-up, round 1: the Fact Sheet on First Light.</b> Drawn from the public page itself on {built},
      with its own figures ({stamp}) and the curator's live edits. Switch the look to compare it with today's page.</p>
    <div class="mock-row">
      <div class="seg" role="group" aria-label="Look">
        <span>Look</span>
        <button type="button" data-look="fl" aria-pressed="true">First Light</button>
        <button type="button" data-look="today" aria-pressed="false">Today</button>
      </div>
      <div class="seg" role="group" aria-label="Theme">
        <span>Theme</span>
        <button type="button" data-theme-set="" aria-pressed="true">Your device</button>
        <button type="button" data-theme-set="light" aria-pressed="false">Light</button>
        <button type="button" data-theme-set="dark" aria-pressed="false">Dark</button>
      </div>
      <span class="mock-say" id="mock-say" role="status" aria-live="polite"></span>
    </div>
    <details>
      <summary>What changes, and what stays</summary>
      <ul>
        <li>The masthead, the section and card headings and the headline figures take Playfair Display; everything else takes Source Sans 3. Both are served with the page, so it calls no other site.</li>
        <li>Dark mode, with COBI's dark values. The page follows the theme a reader chose in COBI, or the device when there is no choice. Seal navy stays the fill under white text and lifts to a lighter blue where it is text.</li>
        <li>The logo is drawn on white, so in dark it sits on a white plate.</li>
        <li>Print, Save as PDF and Save as Word keep Cambria and Calibri on a light page.</li>
        <li>The colors, the layout, the sections and the words are unchanged.</li>
        <li>Inert here: Save as Word, Print, Ask Sierra and Curate. The four student story photos load from map.rccd.edu on the live page and are left out of this copy.</li>
      </ul>
    </details>
  </div>
</div>
""".format(built=E(built), stamp=E(stamp))

SCRIPT = """
<script>
(function () {
  var root = document.documentElement, say = document.getElementById('mock-say');
  function press(sel, on) {
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (b) { b.setAttribute('aria-pressed', on(b) ? 'true' : 'false'); });
  }
  var look = 'fl';
  function note() {
    var dark = root.getAttribute('data-theme') === 'dark' ||
      (!root.getAttribute('data-theme') && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    say.textContent = look === 'today' && dark ? 'Today has no dark mode, so it stays light.' : '';
  }
  function setLook(l) {
    look = l;
    document.getElementById('css-fl').media = l === 'fl' ? 'all' : 'not all';
    document.getElementById('css-today').media = l === 'today' ? 'all' : 'not all';
    press('[data-look]', function (b) { return b.getAttribute('data-look') === l; });
    note();
  }
  function setTheme(t) {
    if (t) root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');
    press('[data-theme-set]', function (b) { return b.getAttribute('data-theme-set') === t; });
    note();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null;
    if (!b) return;
    if (b.hasAttribute('data-look')) return setLook(b.getAttribute('data-look'));
    if (b.hasAttribute('data-theme-set')) return setTheme(b.getAttribute('data-theme-set'));
    if (/^(btn-word|btn-print|btn-sierra|btn-curate)$/.test(b.id)) {
      say.textContent = '"' + b.textContent.trim() + '" works on the live page; it is inert in this mock-up.';
      return;
    }
    if (b.classList.contains('sw-rec-tg')) {
      var open = b.getAttribute('aria-expanded') === 'true', list = b.parentNode.querySelector('.sw-rec-list');
      b.setAttribute('aria-expanded', open ? 'false' : 'true');
      if (list) { if (open) list.setAttribute('hidden', ''); else list.removeAttribute('hidden'); }
    }
  });
  // The page's folds, as factsheet.js wires them.
  var secs = document.querySelectorAll('main > section');
  Array.prototype.forEach.call(secs, function (sec) {
    var h = sec.querySelector('h2.sec-toggle');
    if (!h || h.parentNode !== sec) return;
    function toggle() { var c = sec.classList.toggle('collapsed'); h.setAttribute('aria-expanded', c ? 'false' : 'true'); }
    h.addEventListener('click', toggle);
    h.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });
  var all = document.getElementById('btn-collapse-all');
  if (all) all.addEventListener('click', function () {
    var anyOpen = !!document.querySelector('main > section:not(.collapsed) > h2.sec-toggle');
    Array.prototype.forEach.call(secs, function (s) {
      var th = s.querySelector('h2.sec-toggle');
      if (th && th.parentNode === s) { s.classList.toggle('collapsed', anyOpen); th.setAttribute('aria-expanded', anyOpen ? 'false' : 'true'); }
    });
    all.textContent = anyOpen ? 'Expand all' : 'Collapse all';
  });
  if (window.matchMedia) { var mq = matchMedia('(prefers-color-scheme: dark)'); if (mq.addEventListener) mq.addEventListener('change', note); }
})();
</script>
"""

# The skip link stays the first thing a keyboard reaches; the strip follows it.
skip = re.search(r'<a class="skip-link"[^>]*>[\s\S]*?</a>', body)
assert skip, "the capture lost the skip link"
body = body[:skip.end()] + STRIP + body[skip.end():]

page = """<title>Fact Sheet on First Light</title>
<style id="css-fl" media="all">{fl}</style>
<style id="css-today" media="not all">{today}</style>
{injected}
<style>{mock}</style>
{body}
{script}""".format(fl=fl_css, today=today_css, injected=injected, mock=MOCK_CSS, body=body, script=SCRIPT)
open(out_path, "w", encoding="utf-8").write(page)
print("wrote %s: %d KB, %d story photos left out, figures %s" % (out_path, len(page) // 1024, photos, stamp))

#!/usr/bin/env python3
"""Round 8 of the College Dashboard mockup: Mockup and Today, drawn by COBI's own code."""
import datetime
import html
import json
import re
import sys

HERE = sys.path[0]
today = json.load(open(HERE + "/today.json", encoding="utf-8"))
mock = json.load(open(HERE + "/mock.json", encoding="utf-8"))
frame_css = open(HERE + "/frame.css", encoding="utf-8").read()

# One rule set: Today's rules in order, then any rule only the mockup has.
seen, css = set(), []
for r in today["css"] + mock["css"]:
    if r not in seen:
        seen.add(r)
        css.append(r)


def scope_inline_styles(markup, view_id):
    """The Columns menu writes page-wide nth-child rules inside the section; scope them to one copy."""
    def fix(m):
        body = m.group(2)
        def pre(rule):
            sel, _, rest = rule.partition("{")
            sels = ",".join("#%s %s" % (view_id, s.strip()) for s in sel.split(",") if s.strip())
            return sels + "{" + rest
        rules = [x + "}" for x in body.split("}") if x.strip()]
        return m.group(1) + "".join(pre(x) for x in rules) + m.group(3)
    return re.sub(r"(<style[^>]*>)([\s\S]*?)(</style>)", fix, markup)


def open_row(markup, row_id):
    """Open one institution's drill-in: unhide its rows and mark its caret expanded."""
    markup = markup.replace('data-for="%s" hidden=""' % row_id, 'data-for="%s"' % row_id)
    pat = re.compile(r'(<tr class="cplfund-row[^"]*)(" data-id="%s">[\s\S]*?aria-expanded=")false"' % re.escape(row_id))
    return pat.sub(lambda m: m.group(1) + " cplfund-open" + m.group(2) + 'true"', markup, count=1)


mock_html = open_row(mock["html"], "c:Alameda")
today_html = open_row(today["html"], "c:Alameda")

# The Reporting sketch (Sam's NOVA question, 2026-09-29), in Alameda's drill-in only.
SKETCH = (
    '<div class="cplfund-notewrap mk-sketch"><span class="dk">Reporting (internal):</span> '
    '<span class="mk-sketch-tag">Sketch for your NOVA question. Nothing here saves.</span>'
    '<div class="mk-rep">'
    '<label>Period <select id="mk-rep-period" disabled><option>2026-27</option></select></label>'
    '<label>Status <select id="mk-rep-status" disabled><option>TBA</option></select></label>'
    '<label>Submitted <input id="mk-rep-date" type="text" value="TBA" disabled></label>'
    '<label>NOVA record <input id="mk-rep-nova" type="text" value="TBA" disabled></label>'
    "</div>"
    '<textarea class="cplfund-note" rows="2" id="mk-rep-note" placeholder="Reporting note, visible to signed-in reviewers only" disabled></textarea>'
    '<button type="button" class="cplfund-optbtn" disabled>Save reporting</button></div>')
anchor = '<button type="button" class="cplfund-optbtn" data-notesave="Alameda">Save note</button></div>'
assert anchor in mock_html, "Alameda's note row not found"
mock_html = mock_html.replace(anchor, anchor + SKETCH, 1)

mock_html = scope_inline_styles(mock_html, "view-mock")
today_html = scope_inline_styles(today_html, "view-today")

now = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=7)
stamp = now.strftime("%-I:%M %p").lower().replace("am", "am").replace("pm", "pm") + " PT, Sep 29"

CHANGES = [
    ("The Curr CR, Curr NC and Curr Total Funds figures read gray for every institution that has yet to meet all its minimum conditions.",
     "Hover a Curr header for why. The figures keep what they read today, $0 until the conditions are met, and the gray is the lightest that stays readable at AA contrast."),
    ("The drill-in uses the row's own columns and lines up under them: each priority is a row of the table, under Max CR Funds, Curr CR Funds, Max NC Funds, Curr NC Funds, Total Funds and Curr Total Funds, with its FTES beneath each figure.",
     "Difference moves into the Curr figure's hover. The noncredit columns keep the lighter blue header, and the Columns menu hides a column in the drill-in as it does in the rows. The Statewide drill-in reads the same way."),
    ("The drill-in's Curr figures and their Actual FTES read gray the same way until the conditions are met.", ""),
    ("Under the met first condition, in small type: the CPL Coordinator, the primary CPL contact, and a link to the college's CPL landing page.",
     "From MAP's directory for signed-in reviewers. Open Alameda, Antelope Valley or Canyons; Canyons has no primary contact in MAP. The public explainer names the coordinator and the page alone, from the list My College already publishes."),
    ("A sketch of a Reporting box under the CO Monitor's note, in Alameda's drill-in, for your NOVA question.",
     "Period, Status, Submitted, NOVA record and a note, with TBA where NOVA would fill a field later. It is drawn here only; nothing saves."),
]
QUESTIONS = [
    "Gray cells keep $0, as today, since your 28 September ruling shows no held figure. Should a gray cell show what the institution's outcomes add up to so far instead, in gray, until it meets the conditions?",
    "The first condition's check reads the coordinator alone: 49 institutions meet it that way. Read as the condition now says (coordinator, primary contact and landing page), 43 do. The six that would move each have a coordinator and a landing page but no primary contact in MAP: Canyons, Crafton Hills, Folsom Lake, Foothill, Grossmont and Palomar. Should the check require all three?",
    "If the Reporting box is right, what does a college report for this funding: spending, progress, or both? That decides its fields and the NOVA question.",
]
chg = "".join('<li><span class="mk-what">%s</span><span class="mk-new">New this round</span>%s</li>'
              % (html.escape(w), ('<span class="mk-why">%s</span>' % html.escape(y)) if y else "") for w, y in CHANGES)
qs = "".join("<li>%s</li>" % html.escape(q) for q in QUESTIONS)

page = """<title>College Dashboard Mockup</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@400;600;700&display=swap">
<style>
/* ── COBI's own rules for this section, captured from the running tab (Today and round 8) ── */
%s

%s
/* ── Round 8 page furniture ── */
:root { color-scheme: light; }
.mk-sketch { border: 1px dashed var(--border-strong); border-radius: 8px; padding: 8px 10px; margin-top: 6px; }
.mk-sketch-tag { font-size: .75rem; color: var(--text-muted); margin-left: 6px; }
.mk-rep { display: flex; flex-wrap: wrap; gap: 6px 14px; margin: 6px 0; font-size: .8rem; color: var(--text-body); }
.mk-rep label { display: inline-flex; align-items: center; gap: 6px; }
.mk-rep input, .mk-rep select { font: inherit; min-height: 28px; padding: 2px 6px; border: 1px solid var(--border-strong); border-radius: 6px;
  background: var(--surface-opaque); color: var(--text-body); max-width: 11ch; }
.mk-view { min-width: 0; }
</style>
<div class="mk-frame">
  <header class="mk-head">
    <div>
      <p class="mk-round">Round 8 &middot; updated %s</p>
      <h1>College Dashboard mockup</h1>
      <p class="mk-lede">A working copy of the College Dashboard on the Implementation Funding tab, drawn by COBI's own code from the published model (Scenario 1, as saved at 6:58 am PT today). Rounds 1 to 7 are live in COBI; this round carries your three requests of this morning.</p>
    </div>
    <div class="mk-show" role="group" aria-label="Version shown">
      <span class="mk-show-l">Show</span>
      <button type="button" data-view="mock" aria-pressed="true">Mockup</button>
      <button type="button" data-view="today" aria-pressed="false">Today</button>
    </div>
  </header>
  <section class="mk-changes" aria-labelledby="mk-ch-h">
    <h2 id="mk-ch-h">Changes in this round</h2>
    <ol class="mk-list">%s</ol>
    <h2 class="mk-q-h">Questions for you</h2>
    <ol class="mk-list mk-q">%s</ol>
    <p class="mk-note">The table lists the first 13 of 118 institutions. Click a name to open its detail; Alameda is open. Search, Group by district, Columns and Download as Excel work only in COBI. Contacts are MAP's directory as of Sep 28.</p>
  </section>
  <div id="view-mock" class="mk-view"><div class="cplfund mk-mount">%s</div></div>
  <div id="view-today" class="mk-view" hidden><div class="cplfund mk-mount">%s</div></div>
</div>
<script>
(function () {
  function toggle(b) {
    var tr = b.closest("tr[data-id]");
    if (!tr) return;
    var tb = tr.parentElement, id = tr.getAttribute("data-id");
    var opening = b.getAttribute("aria-expanded") !== "true";
    tb.querySelectorAll(":scope > tr[data-for]").forEach(function (x) { x.hidden = true; });
    tb.querySelectorAll(":scope > tr[data-id]").forEach(function (x) {
      x.classList.remove("cplfund-open");
      var c = x.querySelector("button.cplfund-caret");
      if (c) c.setAttribute("aria-expanded", "false");
    });
    if (!opening) return;
    tb.querySelectorAll(":scope > tr[data-for]").forEach(function (x) { if (x.getAttribute("data-for") === id) x.hidden = false; });
    tr.classList.add("cplfund-open");
    b.setAttribute("aria-expanded", "true");
  }
  document.addEventListener("click", function (e) {
    var v = e.target.closest("[data-view]");
    if (v) {
      var want = v.getAttribute("data-view");
      document.querySelectorAll("[data-view]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === v)); });
      document.getElementById("view-mock").hidden = want !== "mock";
      document.getElementById("view-today").hidden = want !== "today";
      return;
    }
    var b = e.target.closest("button.cplfund-caret");
    if (b) toggle(b);
  });
})();
</script>
""" % ("\n".join(css), frame_css, stamp, chg, qs, mock_html, today_html)
open(HERE + "/college_dashboard_mockup.html", "w", encoding="utf-8").write(page)
print("wrote", len(page), "bytes; css rules", len(css), "; stamp", stamp)

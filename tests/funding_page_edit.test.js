// The one public funding page, edited in place and shown in the tab (Sam,
// 2026-10-15, calls 1, 2, 3 and 8 on the one public funding page).
//
//   call 1: funding-model/ is the one public page; a signed-in curator edits it
//           with Edit this page, and the tab's Public page view frames it;
//   call 2: the page keeps its own order, titles (pubTitles), hidden blocks
//           and text (x_table_intro, x_faq, x_timing_note), and its Timeline
//           takes its own id; the Contents moves with the blocks;
//   call 3: the page adds the Timeline note and the Introduction (x_about);
//   call 8: the masthead's My CPL Funding button is gone.
//
// Run from repo root: `npm test` (or `node tests/funding_page_edit.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const html = read("funding-model/index.html");

function session() {
  return { get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
           isFresh: function () { return true; }, onChange: function () {} };
}
function page(opts) {
  opts = opts || {};
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/funding-model/" });
  const w = dom.window;
  w.CPL_FUNDING_NO_REMOTE = true;
  w.scrollTo = function () {};
  w.Element.prototype.scrollIntoView = function () {};
  if (opts.signedIn) w.CPL_SESSION = session();
  ["cpl_funding_data.js", "funding_model_payload.js", "cpl_funding.js"].forEach((f) => w.eval(read(f)));
  Array.from(w.document.querySelectorAll("script:not([src])")).forEach((s) => w.eval(s.textContent));
  // A curator edits inside COBI's Public page view, which frames this page (Sam, 2026-10-26).
  // jsdom has no frame, so a replaced self stands in for one, set after the funding module has
  // taken its global from self and before edit_page.js reads it.
  if (opts.signedIn && opts.framed !== false) w.eval("self = {}");
  w.eval(read("funding-model/edit_page.js"));
  return { w, doc: w.document, T: w.CPL_FUNDING_TAB };
}
const click = (w, el) => el && el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));

// ── Edit this page lives in COBI alone (Sam, 2026-10-26) ──────────────────
{
  const { doc } = page({ signedIn: true, framed: false });
  check("1z: at the public address, even a signed-in curator gets no Edit this page (Sam: hide it from the public view)",
    doc.getElementById("edit-page-btn").hidden && !doc.querySelector(".pe-x"));
}

// ── the page's structure (calls 2, 3, 8) ──────────────────────────────────
{
  const { doc, T } = page();
  check("8a: the masthead carries no My CPL Funding button, and nothing handles one",
    !doc.getElementById("my-funding-btn") && !/my-funding-btn"\)/.test(html));
  const kids = Array.from(doc.querySelector("main").children);
  check("2a: <main> holds the page's blocks and nothing else, the Contents first",
    kids.length > 8 && kids.every((k) => k.hasAttribute("data-fsec")) && kids[0].id === "contents");
  const ids = kids.map((k) => k.getAttribute("data-fsec"));
  const pub = T.publicSections().map((x) => x.id);
  check("2b: every block's public id is declared, and every declared id is a block, once",
    ids.length === pub.length && pub.every((id) => ids.filter((x) => x === id).length === 1));
  check("2c: the Timeline takes its own id, timeline, and the house title Timeline",
    doc.getElementById("disbursement").getAttribute("data-fsec") === "timeline" &&
    doc.querySelector("#disbursement summary h2").textContent === "Timeline");
  check("3a: the Introduction is a block, folded, just before the Overview",
    ids.indexOf("intro") === ids.indexOf("lede") - 1 &&
    !doc.querySelector("#introduction details.fold").hasAttribute("open") &&
    !!doc.querySelector('#introduction [data-ptext="x_about"]'));
  check("3b: the Introduction reads Sam's tab Introduction until the page saves its own (the statute quoted)",
    /\(d\)\(1\) Upon appropriation/.test(doc.querySelector('[data-ptext="x_about"]').textContent) &&
    !!doc.querySelector('[data-ptext="x_about"] blockquote'));
  check("3c: the Timeline ends with its note, the page's own passage",
    /CPL data is housed in the MAP platform/.test(doc.querySelector('#disbursement [data-ptext="x_timing_note"]').textContent));
  check("1a: a reader who cannot curate gets no Edit this page and no curator control",
    doc.getElementById("edit-page-btn").hidden && !doc.querySelector(".pe-x"));
  // .btn's display beat [hidden], so the word showed to every reader until the
  // page's own stylesheet carried this rule (measured by the a11y run).
  check("1a2: the page's own stylesheet hides a hidden button, so a reader never sees Edit this page",
    /\.btn\[hidden\]\{display:none\}/.test(html.slice(0, html.indexOf("</style>"))));
  check("1b: the page loads the reviewer session keeper COBI loads, so a curator is signed in here too",
    /<script src="\.\.\/cpl_session\.js"><\/script>/.test(html));

  // The page's copies are its own (call 2).
  T._setShared({ text: { faq: "Q: Internal only?\n\nYes.", college_intro: "Internal intro.", timing_note: "Internal note.",
    about: "An Internal Introduction." }, titles: { timing: "The tab's Timing" }, secHidden: { timing: true } });
  T.render(); window_paint(doc);
  check("2d: the tab's FAQ, table introduction and Timeline note no longer reach the page",
    !/Internal only/.test(doc.getElementById("faq-body").textContent) &&
    !/Internal intro/.test(doc.getElementById("cplFundingMount").textContent) &&
    !/Internal note/.test(doc.querySelector('[data-ptext="x_timing_note"]').textContent));
  check("2e: the tab's Timing title and Hide no longer reach the page's Timeline",
    doc.querySelector("#disbursement summary h2").textContent === "Timeline" && !doc.getElementById("disbursement").hidden);
  check("3d: until it is saved here, the Introduction follows the tab's",
    /An Internal Introduction/.test(doc.querySelector('[data-ptext="x_about"]').textContent) && T.textMeta("x_about").followsTab);
  T._setShared({ text: { about: "An Internal Introduction.", x_about: "The page's own Introduction." } });
  T.render(); window_paint(doc);
  check("3e: once saved here, it is the page's own", /page's own Introduction/.test(doc.querySelector('[data-ptext="x_about"]').textContent) &&
    !T.textMeta("x_about").followsTab);
  T._setShared({});
  T.render(); window_paint(doc);
}
function window_paint(doc) { doc.defaultView.CPL_REPAINT(); }

// ── Edit this page, signed in (call 1) ─────────────────────────────────────
{
  const { w, doc, T } = page({ signedIn: true });
  const btn = doc.getElementById("edit-page-btn");
  check("1c: a signed-in curator gets Edit this page in the masthead", !btn.hidden && btn.textContent === "Edit this page");
  click(w, btn);
  check("1d: editing puts words under every block's title, Contents included, and none inside a <summary>",
    doc.body.classList.contains("page-editing") &&
    T.publicSections().every((x) => !!doc.querySelector('.pe-blk[data-pe-for="' + x.id + '"]')) &&
    !doc.querySelector("summary .pe-x"));
  check("1e: Contents moves and hides but is never renamed; every other block can be",
    !doc.querySelector('[data-pe-rename="contents"]') && !!doc.querySelector('[data-pe-rename="lede"]'));
  check("1f: Step 1 says it stays first", /Step 1 stays first/.test(doc.querySelector(".step1-wrap").textContent));
  check("1g: every passage carries the word Edit, the table's introduction and the questions included",
    ["x_lede", "x_about", "x_timing_note", "x_table_intro", "x_faq"].every((k) => !!doc.querySelector('[data-pe-edit="' + k + '"]')));

  // Rename
  click(w, doc.querySelector('[data-pe-rename="lede"]'));
  const ti = doc.getElementById("pe-ti-lede");
  ti.value = "The overview, briefly";
  click(w, doc.querySelector('[data-pe-titlesave="lede"]'));
  check("2f: Rename saves under pubTitles, the page shows it, and the Internal view's titles are untouched",
    (T._getShared().pubTitles || {}).lede === "The overview, briefly" && !(T._getShared().titles || {}).lede &&
    doc.querySelector("#overview summary h2").textContent === "The overview, briefly" &&
    Array.from(doc.querySelectorAll("#toc-list a")).some((a) => a.textContent === "The overview, briefly"));
  click(w, doc.querySelector('[data-pe-rename="lede"]'));
  click(w, doc.querySelector('[data-pe-titlereset="lede"]'));
  check("2g: Restore the default title stores nothing", !(T._getShared().pubTitles || {}).lede &&
    doc.querySelector("#overview summary h2").textContent === "Overview");

  // Hide
  click(w, doc.querySelector('[data-pe-hide="choices"]'));
  const choices = doc.getElementById("choices");
  check("2h: Hide on this page hides the block by its public id, and the curator still sees it, marked",
    !!(T._getShared().secHidden || {}).choices && !choices.hidden && choices.classList.contains("is-curator-hidden") &&
    /Colleges do not see this block/.test(choices.textContent) &&
    doc.querySelector('[data-pe-hide="choices"]').getAttribute("aria-pressed") === "true");
  // Position
  const pos = doc.querySelector('[data-pe-pos="questions"]');
  pos.value = "0";
  pos.dispatchEvent(new w.Event("change", { bubbles: true }));
  check("2i: Position moves a block, and the page follows the stored order",
    T.publicSectionOrder()[0] === "questions" && doc.querySelector("main").firstElementChild.id === "questions");
  // Done: a reader's view
  click(w, doc.querySelector('[data-pe-done]'));
  check("1h: Done removes every curator control and hides the hidden block",
    !doc.querySelector(".pe-x") && choices.hidden && !doc.body.classList.contains("page-editing"));
  check("2j: the Contents lists no hidden block", !Array.from(doc.querySelectorAll("#toc-list a")).some((a) => a.getAttribute("href") === "#choices"));

  // A passage
  click(w, btn);
  click(w, doc.querySelector('[data-pe-edit="x_timing_note"]'));
  const ta = doc.getElementById("pe-ta-x_timing_note");
  check("1i: Edit opens the passage's plain text, with Bold, Italic, Link, Save and Cancel",
    !!ta && /CPL data is housed/.test(ta.value) && doc.activeElement === ta &&
    ["data-pe-mark", "data-pe-link", "data-pe-save", "data-pe-cancel"].every((a) => !!doc.querySelector(".pe-ed [" + a + "]")));
  ta.value = "Note: MAP holds the CPL data.";
  ta.setSelectionRange(6, 9);
  click(w, doc.querySelector('.pe-ed [data-pe-mark="**"]'));
  check("1j: Bold wraps the selected words", ta.value === "Note: **MAP** holds the CPL data.");
  ta.setSelectionRange(28, 32);   // "data"
  click(w, doc.querySelector(".pe-ed [data-pe-link]"));
  check("1k: Link writes [words](https://) around the selection", /\[data\]\(https:\/\/\)/.test(ta.value));
  ta.value = "Note: **MAP** holds the [CPL data](https://example.org/map).";
  click(w, doc.querySelector('.pe-ed [data-pe-save]'));
  const note = doc.querySelector('[data-ptext="x_timing_note"]');
  check("1l: Save stores the page's own copy and the page paints it, bold and link",
    /MAP\*\* holds/.test((T._getShared().text || {}).x_timing_note || "") &&
    !!note.querySelector("strong") && note.querySelector("a").getAttribute("href") === "https://example.org/map" &&
    !(T._getShared().text || {}).timing_note);
  click(w, doc.querySelector('[data-pe-edit="x_timing_note"]'));
  click(w, doc.querySelector(".pe-ed [data-pe-restore]"));
  check("1m: Restore the default text returns the house words and stores nothing",
    !(T._getShared().text || {}).x_timing_note && /CPL data is housed/.test(note.textContent));
  // The Introduction's editor says what it follows
  click(w, doc.querySelector('[data-pe-edit="x_about"]'));
  check("1n: the Introduction's editor says it shows the Internal view's until saved here",
    /Until you save it here, this passage shows the Internal view/.test(doc.querySelector('.pe-ed[data-pe-ed="x_about"]').textContent));
  // A redraw while typing keeps the draft
  const ta2 = doc.getElementById("pe-ta-x_about");
  ta2.value = "Half typed";
  ta2.dispatchEvent(new w.Event("input", { bubbles: true }));
  T.render();
  check("1o: a model redraw while the curator types keeps what they typed",
    doc.getElementById("pe-ta-x_about") && doc.getElementById("pe-ta-x_about").value === "Half typed");
}

// ── the tab's Public page view (call 1) ───────────────────────────────────
function tab(url) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-implementation-funding"><div><h2>x</h2>' +
    '<span id="cplFundTitleLink"></span></div><div id="cplFundingMount"></div></div></body></html>',
    { url: url || "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.scrollTo = function () {};
  w.CPL_FUNDING_NO_REMOTE = true;
  w.fetch = function () { return new Promise(function () {}); };
  w.CPL_SESSION = session();
  ["college_short_names.js", "cpl_funding_data.js", "cpl_funding.js"].forEach((f) => {
    const s = w.document.createElement("script"); s.textContent = read(f); w.document.body.appendChild(s);
  });
  w.CPL_FUNDING_TAB.boot();
  return { w, doc: w.document, T: w.CPL_FUNDING_TAB };
}
{
  const { w, doc, T } = tab();
  const views = Array.from(doc.querySelectorAll("[data-viewmode]")).map((b) => b.textContent);
  check("1p: the View control reads Internal and Public page", views.join("|") === "Internal|Public page");
  click(w, doc.querySelector('[data-viewmode="public"]'));
  const frame = doc.querySelector("#cplFundingMount iframe");
  check("1q: Public page frames funding-model/ in place of the tab's own sections",
    !!frame && frame.getAttribute("src") === "funding-model/" && !doc.querySelector("#cplFundingMount details.cplfund-sec") &&
    !!frame.getAttribute("title"));
  T.render(); T.render();
  check("1r: a model redraw keeps the same frame (a frame taken out of the page reloads)",
    doc.querySelector("#cplFundingMount iframe") === frame &&
    doc.querySelector('[data-viewmode="public"]').getAttribute("aria-pressed") === "true");
  check("1s: the retired preview controls are gone: no Exclude chips, no section list, no As colleges see it",
    !doc.querySelector("[data-secpvhide], [data-pubsechide], #cplFundPublicEye, .cplfund-pubsec"));
  click(w, doc.querySelector('[data-viewmode="internal"]'));
  check("1t: Internal brings the tab's sections back, with no Hide on the public page on them",
    !doc.querySelector("#cplFundingMount iframe") && !!doc.querySelector("details.cplfund-sec") &&
    !doc.querySelector("[data-sechide], [data-secshow]") && !/Hidden on the public page/.test(doc.getElementById("cplFundingMount").textContent));
}
{
  const { doc } = tab("https://example.org/?fundview=public#implementation-funding");
  check("1u: ?fundview=public opens the Public page view", !!doc.querySelector('#cplFundingMount iframe[src="funding-model/"]'));
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);

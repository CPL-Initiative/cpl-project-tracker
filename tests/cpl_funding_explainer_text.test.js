// The explainer's own passages, edited on the tab (Sam, 2026-10-09).
//
// He could edit the tab's Internal page and press Refresh everything, and
// still could not change a word of How This Model Works (funding-model/),
// because most of that page's prose was typed into its own markup. Asked, he
// chose to make the typed passages editable blocks like the FAQ. This guards
// the four ways that can quietly go wrong:
//
//   1. THE TWO COPIES DRIFT. The page keeps its typed markup inside each
//      [data-ftext] block, as the reading for a browser without script, and
//      cpl_funding.js keeps the same words as the block's default. Each page
//      copy, converted, must equal its default, and each block must exist once
//      on each side.
//   2. A FIGURE FREEZES. A passage names a figure in braces ({base award}); the
//      page must paint every copy from the model, the first copy must carry the
//      id the painter and the older tests read, and no known name may be left
//      showing as typed.
//   3. A CURATOR'S EDIT DOES NOT ARRIVE, or arrives as markup. An override in
//      the shared layer must reach the page on the next model change, with
//      bold, italic and a bulleted list, figures still live, an unknown name
//      left as typed, and anything that looks like a tag escaped.
//   4. THE EDITOR IS MISSING OR LEAKS. Signed in, the tab lists every passage
//      with the word Edit, and the textarea shows the default as rich plain
//      text; signed out, and on every public rendering, the section is absent.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_explainer_text.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { check, freshDom, boot, click, finish } = require("./lib/cpl_funding_harness.js");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const html = read("funding-model/index.html");

function pageDom() {
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/funding-model/" });
  const win = dom.window;
  win.CPL_FUNDING_NO_REMOTE = true;
  win.scrollTo = function () {};
  win.eval(read("cpl_funding_data.js"));
  win.eval(read("funding_model_payload.js"));
  win.eval(read("cpl_funding.js"));
  return { dom, win };
}
function runInline(win) {
  Array.from(win.document.querySelectorAll("script:not([src])"))
    .map(function (s) { return s.textContent; })
    .forEach(function (code) { win.eval(code); });
}
const money = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };

// ── 1. the page's typed copy and the block's default agree ──────────────────
{
  const { win } = pageDom();            // inline scripts NOT run: the markup as shipped
  const T = win.CPL_FUNDING_TAB;
  const blocks = T._explainerBlocks();
  const boxes = Array.from(win.document.querySelectorAll("[data-ftext]"));
  const keysOnPage = boxes.map(function (b) { return b.getAttribute("data-ftext"); });
  check("every passage block exists once on the page, and the page holds no block the tab does not know",
    blocks.length >= 11 && blocks.every(function (b) { return keysOnPage.filter(function (k) { return k === b.key; }).length === 1; }) &&
    keysOnPage.every(function (k) { return blocks.some(function (b) { return b.key === k; }); }));
  const drift = blocks.filter(function (b) {
    const box = win.document.querySelector('[data-ftext="' + b.key + '"]');
    return !box || T._explainerHtmlToPlain(box.innerHTML) !== b.plain;
  }).map(function (b) { return b.key; });
  check("each page copy, converted, equals its default in cpl_funding.js (edit both or neither) — " +
    (drift.length ? "drifted: " + drift.join(", ") : "clean"), drift.length === 0);
  check("each block sits in the explainer section it names",
    blocks.every(function (b) {
      const box = win.document.querySelector('[data-ftext="' + b.key + '"]');
      const sec = box && box.closest("section[data-fsec]");
      return !!sec && sec.getAttribute("data-fsec") === b.sec;
    }));
  check("the defaults carry their figures as names, never as typed numbers",
    /\{base award\}/.test(blocks[0].plain) && /\{cap\}/.test(blocks[0].plain) && !/\$150,000/.test(blocks[0].plain));
}

// ── 2. the page paints every passage, figures live ──────────────────────────
{
  const { win } = pageDom();
  runInline(win);
  const doc = win.document;
  const D = win.CPL_FUNDING_EXPLAINER.buildPayload(win.CPL_FUNDING_TAB, win.CPL_FUNDING);
  const lede = doc.querySelector('[data-ftext="x_lede"]');
  check("the Overview passage is painted from the block: its figures are data-fig spans",
    !!lede && !!lede.querySelector('[data-fig="f-floorv"]') && !!lede.querySelector('[data-fig="f-capv"]'));
  check("the first copy of a figure carries its id, and the painter fills it from the model",
    !!doc.getElementById("f-floorv") && doc.getElementById("f-floorv").getAttribute("data-fig") === "f-floorv" &&
    doc.getElementById("f-floorv").textContent === money(D.pool.floor));
  check("every copy of the base award reads the model's figure, in the Overview and in the allocation steps",
    Array.from(doc.querySelectorAll('[data-fig="f-floorv"]')).length >= 2 &&
    Array.from(doc.querySelectorAll('[data-fig="f-floorv"]')).every(function (e) { return e.textContent === money(D.pool.floor); }));
  const passages = Array.from(doc.querySelectorAll("[data-ftext]")).map(function (b) { return b.textContent; }).join(" ");
  check("no figure is left showing its name in braces", !/\{[a-z][a-z ]*\}/i.test(passages));
  check("bold and the bulleted lists survive the round trip (the allocation steps, the disbursement settings)",
    !!doc.querySelector('[data-ftext="x_lede"] strong') &&
    doc.querySelectorAll('[data-ftext="x_alloc"] ul > li').length === 2 &&
    doc.querySelectorAll('[data-ftext="x_timing"] ul > li').length === 2 &&
    !!doc.querySelector('[data-ftext="x_count_factor"] em'));
  check("the funding factor sentence is the painter's, in the passage",
    /factor/i.test(doc.getElementById("l-factors").textContent) &&
    !!doc.getElementById("l-factors").closest('[data-ftext="x_count_target"]'));
}

// ── 3. a curator's edit reaches the page, escaped ───────────────────────────
{
  const { win } = pageDom();
  runInline(win);
  const doc = win.document;
  const T = win.CPL_FUNDING_TAB;
  const D = win.CPL_FUNDING_EXPLAINER.buildPayload(T, win.CPL_FUNDING);
  T._setShared({ text: { x_timing: "Set by the **Chancellor's Office**, with a cap of {cap} and again {Cap}.\n\n" +
    "- first setting, *in italics*\n- second setting\n\nAn {unknown figure} stays as typed. <script>bad()</script>" } });
  T.render();      // a model change: the page's paint follows (onModelChange)
  const box = doc.querySelector('[data-ftext="x_timing"]');
  check("the override replaces the house text on the page",
    !!box && /Set by the/.test(box.textContent) && !/Two timing settings/.test(box.textContent));
  check("bold, italic and the bulleted list render",
    !!box.querySelector("strong") && /Chancellor/.test(box.querySelector("strong").textContent) &&
    box.querySelectorAll("ul > li").length === 2 && !!box.querySelector("li em"));
  check("both copies of {cap} paint the model's cap (a name matches in any case)",
    box.querySelectorAll('[data-fig="f-capv"]').length === 2 &&
    Array.from(box.querySelectorAll('[data-fig="f-capv"]')).every(function (e) { return e.textContent === money(D.pool.cap); }));
  check("an unknown name stays as typed, so the curator sees the slip", /\{unknown figure\}/.test(box.textContent));
  check("a typed tag is text, never markup", !box.querySelector("script") && /<script>bad\(\)<\/script>/.test(box.textContent));
  T._setShared({});
  T.render();
  check("clearing the override brings the house text back on the next paint",
    /Two timing settings are in effect/.test(doc.querySelector('[data-ftext="x_timing"]').textContent));
}

// ── 4. the tab: one curator-only section, every passage editable ───────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const blocks = T._explainerBlocks();
  check("signed out, the tab shows no explainer section", !doc.querySelector('[data-sec="explainer_text"]'));
  window.CPL_SESSION = {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; }
  };
  T.render();
  const sec = doc.querySelector('details.cplfund-sec[data-sec="explainer_text"]');
  check("signed in, the tab ends with The explainer's text, marked Curator only",
    !!sec && /The explainer’s text/.test(sec.querySelector("summary").textContent) &&
    /Curator only/.test(sec.querySelector("summary").textContent));
  check("every passage is listed there with the word Edit",
    !!sec && blocks.every(function (b) { return !!sec.querySelector('[data-textedit="' + b.key + '"]'); }));
  check("a figure reads as its name on the tab", !!sec && !!sec.querySelector(".cplfund-fig-token"));
  check("the section lists the names a passage can use", !!sec && /\{base award\}/.test(sec.textContent) && /\{effective rate\}/.test(sec.textContent));
  const edit = doc.querySelector('[data-textedit="x_alloc"]');
  if (edit) click(window, edit);
  const ta = doc.querySelector('[data-textarea="x_alloc"]');
  check("Edit opens the passage as rich plain text: bold marks, bullets, figure names",
    !!ta && /\*\*The base award, \{base award\}\*\*/.test(ta.value) && /\n- \*\*The cap, \{cap\}\*\*/.test(ta.value));
  check("...with the rich hint beside it", !!sec && /Two asterisks/.test(doc.querySelector('[data-sec="explainer_text"]').textContent));
  ta.value = ta.value.replace("two adjustments", "two changes");
  const save = doc.querySelector('[data-textsave="x_alloc"]');
  if (save) click(window, save);
  const shared = T._getShared();
  check("Save stores the passage under text.x_alloc in the shared layer",
    !!shared.text && /two changes/.test(shared.text.x_alloc || ""));
  const again = doc.querySelector('[data-textedit="x_alloc"]');
  if (again) click(window, again);
  const ta2 = doc.querySelector('[data-textarea="x_alloc"]');
  if (ta2) ta2.value = blocks.filter(function (b) { return b.key === "x_alloc"; })[0].plain;
  const save2 = doc.querySelector('[data-textsave="x_alloc"]');
  if (save2) click(window, save2);
  check("saving the house words back stores nothing (unchanged is not an override)",
    !(T._getShared().text && T._getShared().text.x_alloc));
}
{
  // Every public rendering: the tab's Public view and the explainer's embed.
  const { win } = pageDom();
  win.CPL_SESSION = {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function () { return {}; }
  };
  runInline(win);
  check("the explainer's embed never carries the curator's section or an Edit control",
    !win.document.querySelector('[data-sec="explainer_text"]') && !win.document.querySelector("[data-textedit]"));
}

finish();

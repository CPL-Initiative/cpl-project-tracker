// Noncredit's portion, the explainer's three boxes, and Bold / Italic
// (Sam, 2026-10-14).
//
// He asked five things in one message: where to give noncredit a bigger
// percentage of the total to institutions, how to make words bold when editing
// the explainer, the credit and noncredit split in the institutions box, the
// three boxes on one row at equal width, and their words editable. This guards
// the ways each can quietly go wrong:
//
//   1. THE DIAL MOVES A FIGURE WHILE UNSET. Blank is the default and must leave
//      every award exactly where the teaching mix put it, so a release that
//      ships the dial changes nothing a college sees until a curator types.
//   2. THE DIAL MISSES ITS PERCENTAGE, or reaches it by breaking the bounds:
//      set, the noncredit shares sum to the percentage, the awards still sum to
//      the total, every award stays between the base award and the cap, and
//      an institution with no noncredit teaching never gains from it. A
//      percentage the bounds cannot reach is reported, never silently missed.
//   3. THE TAB'S CONTROL DOES NOT STORE, or stores what it should bounce.
//   4. THE BOXES DRIFT: the credit and noncredit figures must add up to the
//      institutions box, the three boxes share one row, and the explainer
//      says the noncredit weight out loud only while it is set.
//   5. BOLD AND ITALIC WRAP THE WRONG TEXT: spaces at a selection's edge stay
//      outside the marks, a second press unwraps, italic never eats bold.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_nc_portion.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { check, freshDom, boot, click, commit, finish } = require("./lib/cpl_funding_harness.js");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const moneyNum = function (t) { return Number(String(t).replace(/[^0-9.\-]/g, "")); };
const signIn = function (win) {
  win.CPL_SESSION = {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; }
  };
};

// ── 1–2. the model ─────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const e0 = T._effective();
  const W0 = Object.assign({}, T._model().W);
  const names = Object.keys(W0);
  const net = e0.pool.net_college;
  const ncOf = function (e) { return e.pool.nc_college_shares + e.pool.nc_only_held_by_origination; };
  check("unset, the dial reports no percentage and a weight of exactly 1",
    e0.pool.nc_portion_set === null && e0.pool.nc_weight === 1);
  check("unset, the portion reached is the teaching mix's own",
    Math.abs(e0.pool.nc_portion_reached - ncOf(e0) / net) < 1e-9 &&
    e0.pool.nc_portion_reached === e0.pool.nc_portion_natural);

  // Every institution's FTES, to find who teaches no noncredit and who teaches most.
  const roster = names.map(function (n) {
    const a = T._alloc(n);
    return { n: n, nc: a ? a.nc_award : 0 };
  });
  const noNc = roster.filter(function (r) { return r.nc === 0; }).map(function (r) { return r.n; });

  const pct = Math.round(e0.pool.nc_portion_natural * 100 * 2 + 3);   // about twice today's, a whole number
  T._setShared(Object.assign({}, T._getShared(), { pool: Object.assign({}, T._getShared().pool, { nc_portion_pct: pct }) }));
  const e1 = T._effective();
  const m1 = T._model();
  const W1 = m1.W;
  const sum1 = names.reduce(function (s, n) { return s + (W1[n] || 0); }, 0);
  check("set to " + pct + "%, the noncredit shares sum to " + pct + "% of the total to institutions",
    Math.abs(ncOf(e1) / net - pct / 100) < 1e-6 && e1.pool.nc_portion_set === pct && !e1.pool.nc_portion_unreachable);
  check("...by counting each noncredit FTES above 1 (" + e1.pool.nc_weight.toFixed(3) + ")", e1.pool.nc_weight > 1);
  check("...while the awards still sum to the whole total", Math.abs(sum1 - net) < 0.01);
  check("...and every award stays between the base award and the cap",
    names.every(function (n) { return W1[n] >= m1.floor - 0.01 && (!(m1.cap > 0) || W1[n] <= m1.cap + 0.01); }));
  check("an institution that teaches no noncredit never gains from a larger noncredit portion (" + noNc.length + " of them)",
    noNc.length > 0 && noNc.every(function (n) { return W1[n] <= W0[n] + 0.01; }));
  check("each award's two shares still add up to the award",
    names.every(function (n) { const a = T._alloc(n); return !a || Math.abs(a.cr_award + a.nc_award - a.total) < 0.01; }));

  T._setShared(Object.assign({}, T._getShared(), { pool: Object.assign({}, T._getShared().pool, { nc_portion_pct: 1 }) }));
  const eLow = T._effective();
  check("a percentage below what the base award holds for the noncredit-only institutions is reported as unreachable",
    eLow.pool.nc_portion_unreachable === "low" && eLow.pool.nc_portion_reached > 0.01);
  T._setShared(Object.assign({}, T._getShared(), { pool: Object.assign({}, T._getShared().pool, { nc_portion_pct: 99 }) }));
  const eHigh = T._effective();
  check("a percentage above what the cap and the credit-only institutions allow is reported as unreachable",
    eHigh.pool.nc_portion_unreachable === "high" && eHigh.pool.nc_portion_reached < 0.99);

  const pool = Object.assign({}, T._getShared().pool); delete pool.nc_portion_pct;
  T._setShared(Object.assign({}, T._getShared(), { pool: pool }));
  T._effective();
  const W2 = T._model().W;
  check("cleared, every award returns exactly to where the teaching mix put it",
    names.every(function (n) { return W2[n] === W0[n]; }));

  // ── 5. Bold / Italic, the pure edit ──
  const wm = T._wrapMark;
  check("Bold wraps the selected words", wm("make this bold", 5, 9, "**") === "make **this** bold");
  check("a space at the selection's edge stays outside the marks", wm("make this bold", 5, 10, "**") === "make **this** bold");
  check("a second press unwraps", wm("make **this** bold", 7, 11, "**") === "make this bold");
  check("Italic inside bold adds italic rather than eating a bold mark", wm("**this**", 2, 6, "*") === "***this***");
  check("Italic unwraps its own mark", wm("an *idea* here", 4, 8, "*") === "an idea here");
  check("with nothing selected, the marks go in at the cursor", wm("ab", 1, 1, "**") === "a****b");
}

// ── 3. the tab's control ───────────────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  check("signed out, the dial shows the portion as a figure, with no field",
    !!doc.querySelector(".cplfund-ncportion") && !doc.querySelector('[data-edit="ncportion"]'));
  signIn(window);
  T.render();
  const box = doc.querySelector(".cplfund-ncportion");
  const field = doc.querySelector('[data-edit="ncportion"]');
  check("signed in, the dial sits under its own heading, Credit and noncredit, with a blank field",
    !!box && /Credit and noncredit/.test(box.querySelector("h4").textContent) && !!field && field.value === "" &&
    /follows each institution/.test(box.textContent));
  check("the field is labeled for a screen reader", !!field && /Noncredit portion/.test(field.getAttribute("aria-label") || ""));
  commit(window, field, "15");
  check("typing 15 stores 15 in the shared layer", T._getShared().pool && T._getShared().pool.nc_portion_pct === 15);
  const box2 = doc.querySelector(".cplfund-ncportion");
  check("...and the card says what it took: the weight on each noncredit FTES",
    !!box2 && /counts each noncredit FTES as/.test(box2.textContent) && doc.querySelector('[data-edit="ncportion"]').value === "15");
  commit(window, doc.querySelector('[data-edit="ncportion"]'), "150");
  check("a percentage outside 0 to 100 bounces, and the stored one stands", T._getShared().pool.nc_portion_pct === 15);
  commit(window, doc.querySelector('[data-edit="ncportion"]'), "");
  check("clearing the field removes the setting, so the teaching mix decides again",
    !("nc_portion_pct" in (T._getShared().pool || {})));

  // ── 5. Bold / Italic, the buttons ──
  const edit = doc.querySelector('[data-textedit="x_fig_inst"]');
  check("the institutions box's words are a passage on the tab, with Edit", !!edit);
  if (edit) click(window, edit);
  const ta = doc.querySelector('[data-textarea="x_fig_inst"]');
  const bold = doc.querySelector('[data-textwrap="**"][data-textfor="x_fig_inst"]');
  check("a passage's editor carries Bold and Italic",
    !!ta && !!bold && !!doc.querySelector('[data-textwrap="*"][data-textfor="x_fig_inst"]'));
  if (ta && bold) {
    ta.value = "allocated to the institutions";
    ta.setSelectionRange(17, 29);
    click(window, bold);
    check("Bold puts the marks around the selected words in the field",
      ta.value === "allocated to the **institutions**");
  }
  check("the hint names the buttons and the marks they type",
    /press Bold or Italic/.test(doc.querySelector('[data-sec="explainer_text"]').textContent));
}

// ── 4. the explainer's three boxes ─────────────────────────────────────────
{
  const html = read("funding-model/index.html");
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/funding-model/" });
  const win = dom.window;
  win.CPL_FUNDING_NO_REMOTE = true;
  win.scrollTo = function () {};
  win.eval(read("cpl_funding_data.js"));
  win.eval(read("funding_model_payload.js"));
  win.eval(read("cpl_funding.js"));
  Array.from(win.document.querySelectorAll("script:not([src])"))
    .map(function (s) { return s.textContent; })
    .forEach(function (code) { win.eval(code); });
  const doc = win.document;
  const T = win.CPL_FUNDING_TAB;
  const row = doc.querySelector(".figs.three");
  const figs = row ? Array.from(row.children).filter(function (el) { return el.classList.contains("fig"); }) : [];
  check("the appropriation and its two destinations are one row of three boxes",
    figs.length === 3 && !!figs[0].querySelector("#f-total") && !!figs[1].querySelector("#f-inst") &&
    !!figs[2].querySelector("#f-proj") && figs[0].classList.contains("top") && !doc.querySelector(".topline"));
  const css = Array.from(doc.querySelectorAll("style")).map(function (s) { return s.textContent; }).join("\n");
  check("at full width the three share equal columns; below 820px the appropriation takes its own row",
    /\.figs\{display:grid; grid-template-columns:repeat\(3,1fr\)/.test(css) &&
    /@media \(max-width:820px\)\{[^@]*\.figs\.three \.fig\.top\{grid-column:1 \/ -1\}/.test(css));
  check("each box's words are an editable passage",
    ["x_fig_total", "x_fig_inst", "x_fig_proj"].every(function (k, i) {
      return !!figs[i] && !!figs[i].querySelector('[data-ftext="' + k + '"]');
    }));
  const sumOk = function () {
    return moneyNum(doc.getElementById("f-cr").textContent) + moneyNum(doc.getElementById("f-nc").textContent) ===
      moneyNum(doc.getElementById("f-inst").textContent);
  };
  check("the institutions box splits into credit and noncredit, and the two add up to its figure",
    !!figs[1] && !!figs[1].querySelector("#f-cr") && !!figs[1].querySelector("#f-nc") && sumOk());
  check("unset, the explainer says nothing about a noncredit weight",
    doc.getElementById("nc-portion-note").hidden && doc.getElementById("nc-weight-note").hidden);

  T._setShared(Object.assign({}, T._getShared(), { pool: Object.assign({}, T._getShared().pool, { nc_portion_pct: 15 }) }));
  T.render();
  const inst = moneyNum(doc.getElementById("f-inst").textContent);
  const nc = moneyNum(doc.getElementById("f-nc").textContent);
  check("set to 15%, the box's noncredit figure is 15% of the total to institutions, and the pair still adds up",
    Math.abs(nc - inst * 0.15) <= 1 && sumOk());
  const pn = doc.getElementById("nc-portion-note"), wn = doc.getElementById("nc-weight-note");
  check("...and the Overview and the allocation steps each say so, with the weight",
    !pn.hidden && /15 percent/.test(pn.textContent) && /counts each noncredit FTES as \d+\.\d\d credit FTES/.test(pn.textContent) &&
    !wn.hidden && /counts as \d+\.\d\d in that total/.test(wn.textContent));
  check("the two examples state the weight beside the share they print",
    Array.from(doc.querySelectorAll("#cards .who")).every(function (p) { return /noncredit FTES counted at \d+\.\d\d/.test(p.textContent); }));

  T._setShared(Object.assign({}, T._getShared(), { text: { x_fig_inst: "Custom words: **{credit total}** for credit" } }));
  T.render();
  const lab = doc.querySelector('[data-ftext="x_fig_inst"]');
  check("a curator's words for a box reach the page, its figure still live",
    /Custom words/.test(lab.textContent) && !!lab.querySelector('strong [data-fig="f-cr"]') &&
    /^\$[0-9,]+$/.test(lab.querySelector('[data-fig="f-cr"]').textContent));
}

// ── 6. Refresh everything carries both (Sam, 2026-10-14: "Keep in mind to
//    wire in the Refresh Everything procedure") ────────────────────────────
// Two windows of one browser: COBI's tab and the explainer, a shared channel,
// one served config. The curator saves the dial and a box's words elsewhere;
// Refresh in COBI must land both on the open explainer, and the splash must
// name what it redrew there.
(async function () {
  const tick = (ms) => new Promise((r) => setTimeout(r, ms || 0));
  const bus = [];
  class FakeBC {
    constructor(name) { this.name = name; this.onmessage = null; bus.push(this); }
    postMessage(m) {
      const data = JSON.parse(JSON.stringify(m));
      bus.filter((x) => x !== this && x.name === this.name).forEach((x) => setTimeout(() => x.onmessage && x.onmessage({ data }), 0));
    }
    close() {}
  }
  const base = JSON.parse(read("tests/fixtures/cpl_funding_config_e21658f9.json"));
  const pub = function (c) { const p = c.projects["cpl-implementation"]; return p.scenarios[p.published]; };
  let served = { config: base, updated_at: "2026-10-14T21:00:00+00:00" };
  const fetchStub = (url) => Promise.resolve({ ok: true, status: 200,
    json: () => Promise.resolve(/cpl_funding_config/.test(String(url)) ? [served] : []) });

  // A: COBI's tab, signed in.
  const dA = freshDom();
  const wA = dA.window;
  wA.CPL_FUNDING_NO_REMOTE = false; wA.fetch = fetchStub; wA.BroadcastChannel = FakeBC;
  const docA = boot(wA);
  signIn(wA);
  const TA = wA.CPL_FUNDING_TAB;
  TA.render();

  // B: the explainer.
  const dom = new JSDOM(read("funding-model/index.html"), { runScripts: "outside-only", url: "https://example.org/funding-model/" });
  const wB = dom.window;
  wB.scrollTo = function () {};
  wB.CPL_FUNDING_NO_REMOTE = false; wB.fetch = fetchStub; wB.BroadcastChannel = FakeBC;
  wB.eval(read("cpl_funding_data.js"));
  wB.eval(read("funding_model_payload.js"));
  wB.eval(read("cpl_funding.js"));
  Array.from(wB.document.querySelectorAll("script:not([src])"))
    .map(function (s) { return s.textContent; })
    .forEach(function (code) { wB.eval(code); });
  await tick(50);
  const docB = wB.document;
  const ncB = function () { return moneyNum(docB.getElementById("f-nc").textContent); };
  const instB = function () { return moneyNum(docB.getElementById("f-inst").textContent); };
  check("6a: before the save, the explainer shows the teaching mix and no weight sentence",
    docB.getElementById("nc-portion-note").hidden && Math.abs(ncB() / instB() - 0.15) > 0.01);

  // Saved elsewhere: the dial at 15% and new words for the institutions box.
  const next = JSON.parse(JSON.stringify(base));
  const sc = pub(next);
  sc.pool = Object.assign({}, sc.pool, { nc_portion_pct: 15 });
  sc.text = Object.assign({}, sc.text, { x_fig_inst: "to the {institutions} institutions\n\n**{credit total}** credit and **{noncredit total}** noncredit, refreshed" });
  served = { config: next, updated_at: "2026-10-14T21:30:00+00:00" };
  click(wA, docA.getElementById("cplFundRefresh"));
  for (let i = 0; i < 100 && !(TA._splash().replies.length && TA._splash().waited); i++) await tick(100);

  check("6b: Refresh lands the dial on the open explainer: noncredit is 15% of the institutions box, and the pair adds up",
    Math.abs(ncB() - instB() * 0.15) <= 1 &&
    moneyNum(docB.getElementById("f-cr").textContent) + ncB() === instB());
  check("6c: ...and the sentence that states the weight appears",
    !docB.getElementById("nc-portion-note").hidden && /15 percent/.test(docB.getElementById("nc-portion-note").textContent));
  check("6d: ...and the box's new words, figures live",
    /refreshed/.test(docB.querySelector('[data-ftext="x_fig_inst"]').textContent) &&
    !/\{credit total\}/.test(docB.querySelector('[data-ftext="x_fig_inst"]').textContent));
  const splashText = docA.querySelector("#cplFundSplash .cplfund-splash").textContent;
  check("6e: the splash names the explainer and what it redrew there",
    /The funding explainer \(funding-model\/\) — redrawn: .*the three boxes and their words, the credit and noncredit split and the noncredit portion/.test(splashText));
  check("6f: COBI's own tab holds the refreshed dial too",
    TA._effective().pool.nc_portion_set === 15);

  // A save posted on the channel reaches the open explainer without a press.
  const back = JSON.parse(JSON.stringify(next));
  delete pub(back).pool.nc_portion_pct;
  served = { config: back, updated_at: "2026-10-14T21:45:00+00:00" };
  bus[0].postMessage({ type: "saved", from: "elsewhere" });
  for (let i = 0; i < 50 && !docB.getElementById("nc-portion-note").hidden; i++) await tick(100);
  check("6g: a cleared dial, saved elsewhere, returns the open explainer to the teaching mix without a press",
    docB.getElementById("nc-portion-note").hidden && Math.abs(ncB() / instB() - 0.15) > 0.01);

  finish();
})();

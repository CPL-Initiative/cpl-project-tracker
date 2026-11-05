// Implementation Funding: every view has an address (SkyJujube, 2026-11-04).
//
// Asked in session, 2026-11-04: "make sure that the sign in link from the emails takes the user back to the view they
// logged in from", then "Should remember to make that fix on all COBI views". A magic link opens a new browser tab, so
// only the address survives. The tab's sub-tabs (2026-28 Funding, 2025-26 Funding, Report) and the View control's
// Public page open from #implementation-funding/<model|grants|report|public>, and the tab reports what is on screen.
// No funding figure or word changes; only which view is drawn.
//
// WHAT THIS GUARDS:
//   (1) ⭐ #implementation-funding/grants opens 2025-26 Funding, and reports it;
//   (2) switching sub-tabs, and to the Public page and back, reports each view; the address can stay stale;
//   (3) a later visit by an address opens its view (tabs.js fires onActivate once);
//   (4) a bare #implementation-funding opens 2026-28 Funding on the Internal view, and ?fundview=public still opens
//       the Public page (the address adds nothing, so it changes nothing);
//   (5) a public page never reads or reports a COBI view.
//
// Kept to a handful of booted windows (tests/lib/cpl_funding_harness.js: ~44 MB each).
// Run from repo root: `npm test` (or `node tests/cpl_funding_view_address.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const H = require("./lib/cpl_funding_harness.js");
const { check, finish, consumerSrc, dataSrc } = H;

const SESSION = fs.readFileSync(path.join(__dirname, "..", "cpl_session.js"), "utf8");

function bootAt(url, opts) {
  opts = opts || {};
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body>' +
    '<div class="cpl-tab-pane" id="tab-implementation-funding"><div class="main-container">' +
    '<div><h2>CPL Implementation Funding</h2><span id="cplFundTitleLink"></span></div>' +
    '<div id="cplFundingMount">placeholder</div></div></div></body></html>',
    { runScripts: "outside-only", url: url });
  const w = dom.window, local = {}, per = {};
  const bag = (o) => ({ getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; },
    key: (i) => Object.keys(o)[i] || null, get length() { return Object.keys(o).length; } });
  Object.defineProperty(w, "localStorage", { value: bag(local), configurable: true });
  Object.defineProperty(w, "sessionStorage", { value: bag(per), configurable: true });
  w.scrollTo = function () {};
  w.CPL_FUNDING_NO_REMOTE = true;
  w.fetch = function () { return new Promise(function () {}); };
  if (opts.publicPage) w.CPL_FUNDING_PUBLIC = true;
  w.eval(SESSION);
  w.eval(dataSrc);
  w.eval(consumerSrc);
  w.CPL_FUNDING_TAB.boot();
  const doc = w.document, S = w.CPL_FUNDING_TAB._state;
  const stash = () => { w.CPL_SESSION.stashReturnTab("implementation-funding"); return (JSON.parse(local.cpl_sb_return_tab || "{}")).tab; };
  const subOn = () => { const b = doc.querySelector("#cplFundingMount .cplfund-subtabs button.on"); return b ? b.getAttribute("data-subview") : null; };
  const framed = () => !!doc.querySelector("#cplFundingMount iframe.cplfund-pv-frame");
  return { w, doc, S, stash, subOn, framed };
}
const click = (w, el) => el && el.dispatchEvent(new w.Event("click", { bubbles: true }));

{
  const a = bootAt("https://example.org/index.html#implementation-funding/grants");
  check("(1) ⭐ #implementation-funding/grants opens 2025-26 Funding", a.S.subview === "grants" && a.subOn() === "grants" && !a.framed());
  check("(1) and reports it", a.stash() === "implementation-funding/grants");
  click(a.w, a.doc.querySelector('#cplFundingMount [data-subview="report"]'));
  check("(2) Report reports its own address (the address still says grants)",
    a.S.subview === "report" && a.stash() === "implementation-funding/report" && a.w.location.hash === "#implementation-funding/grants");
  click(a.w, a.doc.querySelector('#cplFundingMount [data-subview="model"]'));
  check("(2) 2026-28 Funding reports the bare tab", a.S.subview === "model" && a.stash() === "implementation-funding");
  click(a.w, a.doc.querySelector('#cplFundingMount [data-viewmode="public"]'));
  check("(2) the Public page reports public", a.framed() && a.stash() === "implementation-funding/public");
  // (3) a later visit by an address
  a.w.location.hash = "#implementation-funding/report";
  a.w.dispatchEvent(new a.w.CustomEvent("cpl-tab-activated", { detail: { tab: "implementation-funding" } }));
  check("(3) a later visit by an address opens its view on the Internal view", !a.framed() && a.subOn() === "report" && a.stash() === "implementation-funding/report");
  a.w.location.hash = "#implementation-funding";
  a.w.dispatchEvent(new a.w.CustomEvent("cpl-tab-activated", { detail: { tab: "implementation-funding" } }));
  check("(3) a bare later visit leaves the view as it is", a.subOn() === "report");
}
{
  const b = bootAt("https://example.org/index.html#implementation-funding/public");
  check("(1) #implementation-funding/public opens the Public page", b.framed() && b.S.previewPublic === true && b.stash() === "implementation-funding/public");
}
{
  const c = bootAt("https://example.org/index.html#implementation-funding");
  check("(4) a bare #implementation-funding opens 2026-28 Funding on the Internal view", c.S.subview === "model" && !c.S.previewPublic && c.subOn() === "model");
  check("(4) and reports the bare tab", c.stash() === "implementation-funding");
}
{
  const d = bootAt("https://example.org/index.html?fundview=public#implementation-funding");
  check("(4) ?fundview=public still opens the Public page", d.framed() && d.stash() === "implementation-funding/public");
}
{
  const e = bootAt("https://example.org/funding-model/#implementation-funding/report", { publicPage: true });
  check("(5) a public page never opens the Report from an address", e.S.subview !== "report");
  check("(5) and reports no COBI view", e.stash() === "implementation-funding");
}

finish();

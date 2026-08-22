// Shared harness for the CPL Implementation Funding suites.
//
// WHY THIS EXISTS — it is not "tidiness". `tests/cpl_funding.test.js` grew to
// 2,955 lines and 61 jsdom windows in ONE process, and on 2026-08-20 it stopped
// fitting: PR #1268 went red not on an assertion but on a V8 heap-limit abort,
// against a cap that had already been raised 8,192 -> 12,288 MB. The file was
// at ~95% of its ceiling and any addition tipped it. It is now split into nine
// suites, each of which requires this module.
//
// WHAT WAS ACTUALLY MEASURED (Session 176), because the previous reading was
// wrong in a way that sent two fixes down the wrong path:
//
//   * A booted window retains ~44 MB and is NEVER released for the rest of the
//     run. Fifteen windows that are created but NOT booted cost 57 MB in total —
//     so it is not "jsdom windows are unreclaimable"; jsdom collects fine. It is
//     what boot() leaves behind.
//   * `window.close()` changes nothing. Twenty iterations with and without it
//     produce the same curve to one decimal place. (This is why #1268's attempt
//     to close stale windows was reverted — it was right that the windows were
//     the mass, wrong that close() could free them.)
//   * Heap snapshots name the retainers. While the suite's top-level frame is
//     still running, every window is rooted from "(Stack roots)" — the frame's
//     own live registers, which are never cleared as one sibling block after
//     another exits. Wrapping each block in an IIFE removes that root and the
//     memory still does not come back: the DOM is then rooted from
//     "(Micro tasks)" — a PromiseFulfillReactionJobTask holding boot()'s
//     `onDOMContentLoad` closure, on a microtask queue a single long
//     synchronous test file never drains.
//
// So NO discipline inside the file can free a window: not close(), not nulling
// the reference, not scoping. The only thing that reclaims one is the PROCESS
// ENDING — which is exactly what `tests/run.js` already gives every file. That
// is the whole argument for the split: peak memory is set by the number of
// windows in the LARGEST file, so the cure is fewer windows per file, and there
// is no cheaper cure to find.
//
// Budget for anyone adding to these suites: ~44 MB per booted window plus a
// ~40 MB floor. Keep a file under ~15 windows (≈700 MB) and add a NEW suite
// rather than growing one past that.
//
// Full write-up: docs/kb-notes/methodology-a-test-file-is-a-memory-budget.md
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..", "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

// The two HTMLs (Rule 4 — they must stay identical) and the tab's own sources.
const cpl = read("CPL_Dashboard.html");
const idx = read("index.html");
const consumerSrc = read("cpl_funding.js");
const dataSrc = read("cpl_funding_data.js");

// The data artifact, evaluated once per process.
const sandbox = { window: {} };
new Function("window", dataSrc)(sandbox.window);
const D = sandbox.window.CPL_FUNDING;

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// Every suite ends with finish(): same output shape the monolith printed, so a
// failing line still reads identically in the CI log.
function finish() {
  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
}

// NO_REMOTE keeps the shared-config fetch out of the tests (the sandbox is
// egress-blocked anyway).
function freshDom() {
  const dom = new JSDOM(
    '<!DOCTYPE html><html><head></head><body>' +
    '<div class="cpl-tab-pane" id="tab-implementation-funding"><div class="main-container">' +
    // Mirrors the real tab shell's title row, including the slot cpl_funding.js
    // paints the "How this funding model works" link into (paintTitleLink) —
    // the link lives OUTSIDE the mount since 2026-08-22, so a test DOM without
    // this span cannot see it at all.
    '<div><h2>CPL Implementation Funding</h2><span id="cplFundTitleLink"></span></div>' +
    '<div id="cplFundingMount">placeholder</div>' +
    "</div></div></body></html>",
    { runScripts: "outside-only", url: "https://example.org/" });
  dom.window.scrollTo = function () {};
  dom.window.CPL_FUNDING_NO_REMOTE = true;   // no Supabase fetch in tests
  return dom;
}
function boot(window) {
  window.eval(dataSrc);
  window.eval(consumerSrc);
  window.CPL_FUNDING_TAB.boot();
  return window.document;
}
function click(window, el) { el.dispatchEvent(new window.Event("click", { bubbles: true })); }
function commit(window, el, v) { el.value = v; el.dispatchEvent(new window.Event("change")); }
// Per-browser what-if overlay (v3): the local override for the CPL project's
// given scenario (default "Scenario 1"), read straight from localStorage.
function scenSlot(window, name) {
  const raw = window.localStorage.getItem("cpl_funding_whatif_v3");
  if (!raw) return null;
  const wf = JSON.parse(raw);
  return wf["cpl-implementation::" + (name || "Scenario 1")] || null;
}
// There can be >1 .cplfund-foot (the feeder note + the main footer); scan all.
function footText(doc) {
  return Array.from(doc.querySelectorAll(".cplfund-foot")).map(function (e) { return e.textContent; }).join(" ");
}
// The Elig column is a numbered pie: count met (green-filled) slices in an
// element's pie glyph (met requirements) and its total slice count.
function greenSlices(el) {
  const pie = el && el.querySelector(".cf-eligpie");
  return pie ? (pie.innerHTML.match(/var\(--green-progress\)/g) || []).length : -1;
}
function pieSlices(el) {
  const pie = el && el.querySelector(".cf-eligpie");
  return pie ? pie.querySelectorAll("path, circle").length : -1;
}

module.exports = {
  cpl, idx, consumerSrc, dataSrc, D,
  results, check, finish,
  freshDom, boot, click, commit, scenSlot, footText, greenSlices, pieSlices,
};

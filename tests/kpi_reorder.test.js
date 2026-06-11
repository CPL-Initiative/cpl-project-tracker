// KPI card reorder (kpi_reorder.js) — login-free drag-to-rearrange on the
// headline KPI grid, persisted per-browser in localStorage so users can grab
// audience-tailored screenshots.
//
// Guards the FAILURE MODES:
//   (a) a saved order must be re-applied on load by LABEL identity (the KPI
//       section markup is regenerated daily — node identity never survives);
//   (b) a card added AFTER an order was saved must re-enter at its default
//       position, not vanish or get buried at the end;
//   (c) stale keys (renamed/removed cards) must be ignored without breaking
//       the rest of the order;
//   (d) Reset must restore the default order, clear storage, and hide itself;
//   (e) reordering must persist exactly the on-screen order;
//   (f) both HTMLs ship the script tag (Rule 4) and stay identical.
//
// jsdom can't do layout, so the drag geometry (insertionPoint) isn't simulated
// here — the persistence/apply/reset core is exercised via the exposed
// window.CPL_KPI_REORDER API plus synthetic dragstart/dragend events.
//
// Run from repo root: `npm test` (or `node tests/kpi_reorder.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — static invariants on the shipped HTML ──
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
const tag = '<script src="kpi_reorder.js"></script>';
check("script tag present exactly once", cpl.split(tag).length === 2);

// ── Part B — behavior in jsdom ──
const SRC = fs.readFileSync("kpi_reorder.js", "utf8");

function card(label) {
  return '<div class="kpi-card"><div class="kpi-number">1</div>' +
         '<div class="kpi-label">' + label + "</div></div>";
}

function boot(cards, savedOrder) {
  const dom = new JSDOM(
    "<!doctype html><html><head></head><body>" +
    '<div class="kpi-section">' + cards.map(card).join("") + "</div>" +
    "</body></html>",
    { runScripts: "outside-only", url: "https://example.org/" }
  );
  if (savedOrder) {
    dom.window.localStorage.setItem("cplKpiOrder.v1", JSON.stringify(savedOrder));
  }
  dom.window.eval(SRC);
  // jsdom (outside-only) sits at readyState "loading" — fire init directly,
  // like the browser's DOMContentLoaded would. init() is idempotent, so the
  // real listener firing later is a no-op.
  dom.window.CPL_KPI_REORDER.init();
  return dom;
}

function labels(dom) {
  return Array.from(
    dom.window.document.querySelectorAll(".kpi-section .kpi-label")
  ).map((el) => el.textContent);
}

// (a) saved order re-applied on load by label identity
let dom = boot(["Alpha", "Beta", "Gamma", "Delta"], ["delta", "beta", "alpha", "gamma"]);
check("saved order applied on init", labels(dom).join(",") === "Delta,Beta,Alpha,Gamma");
check("reset affordance visible when an order is saved",
  dom.window.document.querySelector(".kpi-reorder-reset").style.display !== "none");

// (b) a NEW card (not in the saved order) re-enters at its default index
dom = boot(["Alpha", "Beta", "New Card", "Gamma"], ["gamma", "beta", "alpha"]);
check("unknown card keeps its default position",
  labels(dom).join(",") === "Gamma,Beta,New Card,Alpha");

// (c) stale keys in the saved order are ignored
dom = boot(["Alpha", "Beta"], ["renamed away", "beta", "alpha"]);
check("stale saved keys ignored", labels(dom).join(",") === "Beta,Alpha");

// no saved order → untouched DOM, no reset link shown
dom = boot(["Alpha", "Beta", "Gamma"], null);
check("no saved order: default order kept", labels(dom).join(",") === "Alpha,Beta,Gamma");
check("no saved order: reset hidden",
  dom.window.document.querySelector(".kpi-reorder-reset").style.display === "none");
check("cards are draggable",
  dom.window.document.querySelectorAll('.kpi-section > [draggable="true"]').length === 3);
check("grab-cursor CSS injected",
  !!dom.window.document.getElementById("kpi-reorder-css"));

// (e) a reorder persists exactly the on-screen order: simulate by moving a
// node then firing dragstart+dragend (the geometry-dependent dragover is
// layout-bound; the persistence path is what we guard).
{
  const w = dom.window, doc = w.document;
  const grid = doc.querySelector(".kpi-section");
  const first = grid.children[0];
  const start = new w.Event("dragstart", { bubbles: true });
  first.dispatchEvent(start);
  grid.appendChild(first); // Alpha to the end: Beta, Gamma, Alpha
  first.dispatchEvent(new w.Event("dragend", { bubbles: true }));
  const saved = JSON.parse(w.localStorage.getItem("cplKpiOrder.v1"));
  check("dragend persists on-screen order", saved.join(",") === "beta,gamma,alpha");
  check("reset appears after a reorder",
    doc.querySelector(".kpi-reorder-reset").style.display !== "none");

  // (d) reset restores default order, clears storage, hides itself
  doc.querySelector(".kpi-reorder-reset button").click();
  check("reset restores default order", labels(dom).join(",") === "Alpha,Beta,Gamma");
  check("reset clears storage", w.localStorage.getItem("cplKpiOrder.v1") === null);
  check("reset hides itself",
    doc.querySelector(".kpi-reorder-reset").style.display === "none");
}

// missing grid → clean no-op
{
  const dom2 = new JSDOM("<!doctype html><body><p>no grid</p></body>",
    { runScripts: "outside-only", url: "https://example.org/" });
  let threw = false;
  try { dom2.window.eval(SRC); } catch (e) { threw = true; }
  check("no grid: script no-ops without throwing", !threw);
}

// ── report ──
let failed = 0;
for (const [name, ok] of results) {
  console.log((ok ? "PASS  " : "FAIL  ") + name);
  if (!ok) failed++;
}
console.log(failed ? failed + " FAILURE(S)" : "All " + results.length + " assertions passed");
process.exit(failed ? 1 : 0);

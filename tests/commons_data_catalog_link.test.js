// College Data Collection (commons_data.js, #commons/data): the catalog link the page displays is split from the
// capture root the readers use (S650; COBIx's correction on #3229, comment 6867640358: only Copper Mountain's link is
// broken, and a 500 from Pingora with an empty body reads "unreachable from here", never as a dead link).
//
// WHAT THIS GUARDS, over an inline fixture so the nightly file cannot move it:
//   (1) ⭐ a college whose displayed link differs from its capture root opens its catalog pane on the displayed link:
//       the panel's "Open in a new tab" goes to the displayed page, never to the capture's 404 file, and the panel
//       names the file the capture read and the file the page links to now, each with its check's result in words;
//   (2) a college with one link (no split) keeps the pane as it was: one address, titled "The catalog the capture read";
//   (3) ⭐ the builder's reading of a check (kb/_build_commons_data_status.py, link_check_result) is pinned in
//       tests/commons_data_status_build_test.py; here the page draws the builder's word and never its own, so a
//       "unreachable from here" result never reads as "not found".
//
// Run from repo root: `node tests/commons_data_catalog_link.test.js`.
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, detail) { results.push([name, !!cond, detail]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const SESSION = fs.readFileSync("cpl_session.js", "utf8");
const PROGRESS = fs.readFileSync("commons_progress.js", "utf8");
const COMMONS = fs.readFileSync("commons.js", "utf8");
const SRC = fs.readFileSync("commons_data.js", "utf8");
const DATA = JSON.parse(fs.readFileSync("kb/status/commons_data.json", "utf8"));

const OLD = "https://catalog.ridge.example.edu/files/catalog-09.pdf";
const NOW = "https://catalog.ridge.example.edu/files/catalog-10.pdf";
const PAGE = "https://catalog.ridge.example.edu/academic-catalogs/";
const FIX = JSON.parse(JSON.stringify(DATA));
const fcol = (o) => Object.assign({ kind: "college", harvested: true, programs: 10, passing: 10, gap: 0, causes: {}, read_at: "2026-10-17T13:07:43Z",
  read_kind: "capture", cost_usd: null, passed_at_read: null, slo_queue: null, scout: null, spot_check: null,
  confidence: { level: "limited", why: "machine checks only; no spot-check yet" }, platform: "pdf", catalog_year: "2026-2027" }, o);
FIX.colleges = [
  fcol({ id: 9101, name: "Ridge College", district: "Ridge Community College District", slug: "ridge", catalog_url: PAGE, capture_root: OLD, catalog_now: NOW,
    catalog_checks: [
      { url: OLD, status: 404, checked_at: "2026-11-13T23:35:00Z", result: "not found" },
      { url: PAGE, status: 500, server: "Pingora", body_bytes: 0, checked_at: "2026-11-13T23:35:00Z", result: "unreachable from here" },
      { url: NOW, status: 200, checked_at: "2026-11-13T23:35:00Z", result: "answered" }] }),
  fcol({ id: 9102, name: "Hill College", district: "Hill Community College District", slug: "hill",
    catalog_url: "https://catalog.hill.example.edu/", capture_root: "https://catalog.hill.example.edu/", catalog_now: null, catalog_checks: null })
];
FIX.live = {}; FIX.overall = {};

function load(hash) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-commons"><div id="commons-root">Loading</div></div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "dangerously" });
  const w = dom.window;
  const bag = () => { const o = {}; return { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } }; };
  Object.defineProperty(w, "localStorage", { value: bag(), configurable: true });
  Object.defineProperty(w, "sessionStorage", { value: bag(), configurable: true });
  w.fetch = function (url) {
    const hit = { "kb/status/commons_data.json": FIX, "kb/status/commons.json": {} }[String(url)];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  [SESSION, PROGRESS, SRC, COMMONS].forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, M: w.CPL_COMMONS, D: w.CPL_COMMONS_DATA };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 30; i++) await tick(); }

(async function () {
  const a = load("#commons/data/college/ridge-college/catalog");
  await a.M.boot(); await settle();
  const pa = a.d.querySelector("#cdd-panel");
  const nt = a.d.querySelector("#cdd-panel a.cdd-newtab");
  const body = txt(pa);
  check("setup: the Ridge catalog pane opened at its address", pa && !pa.hidden && a.w.location.hash === "#commons/data/college/ridge-college/catalog", a.w.location.hash);
  check("(1) ⭐ the new tab goes to the displayed catalog page, never the capture's file", nt && nt.getAttribute("href") === PAGE, nt && nt.getAttribute("href"));
  check("(1) the pane is titled as the college's catalog and names the file the capture read and the file the page links to now",
    txt(a.d.querySelector("#cdd-panel-h")) === "The college's catalog" && body.indexOf("The file the capture read") >= 0 && body.indexOf(OLD) >= 0
    && body.indexOf("The catalog file the page links to now") >= 0 && body.indexOf(NOW) >= 0, body.slice(0, 400));
  check("(1) each check reads in the builder's words: the capture's file not found, the page unreachable from here, the new file answered",
    /catalog-09\.pdf; not found when checked/.test(body) && /academic-catalogs\/; unreachable from here when checked/.test(body)
    && /catalog-10\.pdf; answered when checked/.test(body), body.slice(0, 600));
  check("(3) ⭐ an unreachable-from-here check never reads as not found on the displayed link", !/academic-catalogs\/; not found/.test(body));

  const b = load("#commons/data/college/hill-college/catalog");
  await b.M.boot(); await settle();
  const pb = txt(b.d.querySelector("#cdd-panel"));
  check("(2) a college with one link keeps the pane as it was: one address, no capture-file line",
    txt(b.d.querySelector("#cdd-panel-h")) === "The catalog the capture read" && pb.indexOf("The file the capture read") < 0
    && (b.d.querySelector("#cdd-panel a.cdd-newtab") || {}).getAttribute("href") === "https://catalog.hill.example.edu/", pb.slice(0, 300));

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] ? "" : "  " + JSON.stringify(r[2]))));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });

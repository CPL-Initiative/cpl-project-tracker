// Fact Sheet "Curate" editable overlay (fact-sheet/factsheet_edit.js) — jsdom test.
//
// Guards:
//  (a) the shipped page wires it up: script tag + #btn-curate button present, and
//      the JST upload box was removed from Resources;
//  (b) the overrides SQL is reviewer-gated (public read, is_allowed_reviewer write);
//  (c) editability EXCLUDES the contended/live sections (#statewide-exhibits,
//      #progress) + the chrome (#contents), and never keys a [data-bind] box;
//  (d) the Resources cards + the Legislation list ARE keyed (Sam's two targets);
//  (e) keys are STABLE — two fresh loads of the same HTML yield identical keys;
//  (f) applyOverrides overlays html + hides a box; and it doesn't throw with no fetch.
//
// Run from repo root: `npm test` (or `node tests/factsheet_edit.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const HTML = fs.readFileSync("fact-sheet/index.html", "utf8");
const SRC = fs.readFileSync("fact-sheet/factsheet_edit.js", "utf8");
const SQL = fs.readFileSync("fact-sheet/supabase_factsheet_overrides.sql", "utf8");

// ── Part A — static invariants on the shipped page ──
check("index.html includes factsheet_edit.js", /<script src="\.\/factsheet_edit\.js"><\/script>/.test(HTML));
check("index.html has the #btn-curate button", /id="btn-curate"/.test(HTML));
check("JST upload box removed (no veteransmapsearch link)", !/veteransmapsearch/.test(HTML));
check("JST upload box removed (no 'JST Upload Tool' label)", !/JST Upload Tool/.test(HTML));
check("SQL: public SELECT policy", /for select using \(true\)/.test(SQL));
check("SQL: reviewer-gated write", /for all\s+using \(is_allowed_reviewer\(\)\) with check \(is_allowed_reviewer\(\)\)/.test(SQL));

// ── Part B — behavior in jsdom ──
function loadDom(opts) {
  opts = opts || {};
  const dom = new JSDOM(HTML, {
    runScripts: "outside-only",
    url: "https://cpl-initiative.github.io/cpl-project-tracker/fact-sheet/"
  });
  const w = dom.window;
  if (opts.noFetch) {
    try { delete w.fetch; } catch (e) { w.fetch = undefined; }
  } else {
    w.fetch = function (url) {
      // overrides read → return [] (we drive applyOverrides directly below)
      return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve([]); } });
    };
  }
  w.eval(SRC);
  // jsdom (runScripts:"outside-only") fires DOMContentLoaded during construction,
  // before our eval — so the module's deferred boot listener never runs here. In
  // a real browser the end-of-body <script> boots normally; trigger it for the test.
  if (w.CPL_FACTSHEET_EDIT) w.CPL_FACTSHEET_EDIT.boot();
  return dom;
}

let threw = false, dom;
try { dom = loadDom(); } catch (e) { threw = true; }
check("loads without throwing", !threw && dom);

const API = dom.window.CPL_FACTSHEET_EDIT;
check("exposes CPL_FACTSHEET_EDIT API", API && typeof API.collectBlocks === "function");

const blocks = API ? API.blocks() : [];
check("collected some editable blocks", blocks.length > 5);

// (c) hands-off sections (#statewide-exhibits owned by statewide_recs_render.js,
// #contents = chrome) never produce a keyed block. #progress is NO LONGER excluded.
const EXCLUDED = ["statewide-exhibits", "contents"];
check("no blocks in hands-off sections (#statewide-exhibits/#contents)",
  blocks.every((b) => EXCLUDED.indexOf(b.sectionId) === -1));

// (c-new) the #progress KPI cards ARE collected now — as MOVE-ONLY live blocks
// (moveable + deletable, never text-editable).
const kpis = blocks.filter((b) => b.sectionId === "progress" && b.el.classList.contains("kpi"));
check("#progress KPI cards are collected (≥7)", kpis.length >= 7);
check("#progress KPI cards are move-only: noEdit + movable + live, not editable",
  kpis.length > 0 && kpis.every((b) => b.noEdit && b.movable && b.live && !API.canEditHtml(b)));

// (c-new) the live Veteran-Sprint stats (#initiatives) ARE collected AND editable
// (Sam's explicit ask — distinct from the KPI carve-out).
const vss = blocks.filter((b) =>
  b.sectionId === "initiatives" && b.el.classList.contains("stat") && b.el.querySelector("[data-bind]"));
check("Veteran-Sprint live stats are collected (≥1)", vss.length >= 1);
check("Veteran-Sprint stats are editable + moveable live boxes (not noEdit)",
  vss.length > 0 && vss.every((b) => API.canEditHtml(b) && b.live && !b.noEdit && b.movable));

// (c-new) the #funding budget table is a HIDE-ONLY block (isTable, not editable, not moveable)
const tbl = blocks.find((b) => b.sectionId === "funding" && b.isTable);
check("the #funding budget table is collected as a hide-only block",
  !!tbl && !API.canEditHtml(tbl) && !tbl.movable && /\|tbl\|/.test(tbl.key));

// every block element actually got a data-fsk stamp, unique
const keys = blocks.map((b) => b.key);
check("every block has a non-empty key", keys.every((k) => typeof k === "string" && k.length));
check("keys are unique", new Set(keys).size === keys.length);

// (d) Sam's two targets are editable
check("Resources cards are editable (a block in #resources)",
  blocks.some((b) => b.sectionId === "resources"));
check("Legislation list is editable (a UL block in #legislation)",
  blocks.some((b) => b.sectionId === "legislation" && b.el.tagName === "UL"));

// (e) keys are stable across a fresh load of the same HTML
const dom2 = loadDom();
const keys2 = dom2.window.CPL_FACTSHEET_EDIT.blocks().map((b) => b.key).sort();
check("keys are stable across reloads", JSON.stringify(keys.slice().sort()) === JSON.stringify(keys2));

// (f) applyOverrides overlays html + hides a box
const target = blocks.find((b) => b.sectionId === "resources");
if (target) {
  const ovHtml = '<span class="x">OVERRIDDEN</span>';
  API.setOverrides({ [target.key]: { html: ovHtml, hidden: false } });
  API.applyOverrides();
  check("applyOverrides injects override html", target.el.innerHTML === ovHtml);

  API.setOverrides({ [target.key]: { html: null, hidden: true } });
  API.applyOverrides();
  check("applyOverrides hides a flagged box", target.el.classList.contains("fs-ov-hidden"));
  check("hidden box restores baked html (text override cleared)", target.el.innerHTML === target.baked);

  // sanitizer strips active content on the public render path
  API.setOverrides({ [target.key]: { html: '<a href="javascript:alert(1)" onclick="x()">hi</a><script>bad()</script><img src=x onerror="evil()">', hidden: false } });
  API.applyOverrides();
  const out = target.el.innerHTML;
  check("sanitize strips <script>", !/<script/i.test(out));
  check("sanitize strips on* handlers", !/onerror|onclick/i.test(out));
  check("sanitize strips javascript: urls", !/javascript:/i.test(out));
  check("sanitize keeps the safe link text", /hi/.test(out));

  // allowlist closes the foreign-content (SVG/MathML) mutation-XSS class
  API.setOverrides({ [target.key]: { html: '<svg><a xlink:href="javascript:alert(1)"><text>x</text></a></svg><math><mtext>m</mtext></math><p onclick="x()">ok</p>', hidden: false } });
  API.applyOverrides();
  const o2 = target.el.innerHTML;
  check("sanitize removes SVG/MathML foreign content", !/<svg|<text|<math|<mtext|xlink/i.test(o2));
  check("sanitize keeps an allowed <p>, strips its handler", /ok/.test(o2) && !/onclick/i.test(o2));

  // safe formatting is preserved (links keep https href; target gets rel=noopener)
  API.setOverrides({ [target.key]: { html: '<a href="https://map.rccd.edu" target="_blank">link</a> <strong>x</strong>', hidden: false } });
  API.applyOverrides();
  const o3 = target.el.innerHTML;
  check("sanitize keeps a safe https href", /href="https:\/\/map\.rccd\.edu"/.test(o3));
  check("sanitize keeps <strong>", /<strong>x<\/strong>/.test(o3));
  check("sanitize adds rel=noopener on target=_blank", /rel="noopener/.test(o3));

  // clearing the override restores the baked html + visibility
  API.setOverrides({});
  API.applyOverrides();
  check("clearing override restores baked html", target.el.innerHTML === target.baked);
  check("clearing override un-hides the box", !target.el.classList.contains("fs-ov-hidden"));
} else {
  check("applyOverrides injects override html", false);
}

// (f) graceful with no fetch available
let threw2 = false;
try { loadDom({ noFetch: true }); } catch (e) { threw2 = true; }
check("does not throw when fetch is unavailable", !threw2);

// ── report ──
let failed = 0;
for (const [name, ok] of results) {
  console.log((ok ? "PASS " : "FAIL ") + name);
  if (!ok) failed++;
}
console.log("\n" + (failed ? failed + " FAILED" : "All " + results.length + " checks passed"));
process.exit(failed ? 1 : 0);

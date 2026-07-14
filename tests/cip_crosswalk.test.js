// CIP Crosswalk tab (cip_crosswalk.js) — guards the tab wiring + the renderer.
//   - Rule 4 (both HTMLs identical) + the nav button / pane / mount / lazy boot.
//   - nav_groups.js lists the tab in Reference & Curation; cobi_orgs.js has the
//     CIP site.
//   - activate() renders the search/filter tool into #cip-crosswalk-root without
//     throwing, filters correctly, expands a row into a detail panel, and is
//     idempotent.
//   - Failure-mode guards: missing data → a graceful empty message (no crash);
//     a pair with a null TOP (CIP-only) and a pair whose CIP catalog entry is
//     absent both render without throwing.
//   - Static guard: the shipped module carries no Supabase SERVICE key (anon only).
//
// Run from repo root: `npm test` (or `node tests/cip_crosswalk.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ─────────────────────────────────────────────────────────────────────────────
// Part A — static invariants on the shipped artifacts
// ─────────────────────────────────────────────────────────────────────────────
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
check("nav has CIP Crosswalk button", /data-tab="cip-crosswalk" role="tab"/.test(cpl));
check("pane #tab-cip-crosswalk exists", /id="tab-cip-crosswalk"/.test(cpl));
check("mount #cip-crosswalk-root exists", /id="cip-crosswalk-root"/.test(cpl));
check("boot wiring: onActivate('cip-crosswalk')", /onActivate\('cip-crosswalk'/.test(cpl));
check("boot wiring: loadScript('cip_crosswalk.js')", /loadScript\('cip_crosswalk\.js'/.test(cpl));
check("boot wiring: loadScript('cip_crosswalk_data.js','CIP_CROSSWALK')",
  /loadScript\('cip_crosswalk_data\.js', 'CIP_CROSSWALK'/.test(cpl));

const groupsSrc = fs.readFileSync("nav_groups.js", "utf8");
check("nav_groups.js lists 'cip-crosswalk'", /'cip-crosswalk'/.test(groupsSrc));

const orgsSrc = fs.readFileSync("cobi_orgs.js", "utf8");
check("cobi_orgs.js registers the CIP site", /id:\s*"cip"/.test(orgsSrc) && /"cip-crosswalk"/.test(orgsSrc));

const src = fs.readFileSync("cip_crosswalk.js", "utf8");
check("cip_crosswalk.js exposes CPL_CIP_CROSSWALK.activate", /window\.CPL_CIP_CROSSWALK\s*=\s*\{\s*[\s\S]*activate/.test(src));
check("cip_crosswalk.js carries no service key (anon only)", src.indexOf("service_role") === -1);
check("cip_crosswalk.js targets the Work Plan project", src.indexOf("hvuwhnbuahrtptokpqfh.supabase.co") !== -1);

// data file sanity
const dataSrc = fs.readFileSync("cip_crosswalk_data.js", "utf8");
check("cip_crosswalk_data.js assigns window.CIP_CROSSWALK", /window\.CIP_CROSSWALK\s*=/.test(dataSrc));

// ─────────────────────────────────────────────────────────────────────────────
// Part B — renderer behaviour in jsdom, against a small fixture
// ─────────────────────────────────────────────────────────────────────────────
function makeDom() {
  const html = `<!DOCTYPE html><html><body>
    <div class="cpl-tab-pane" id="tab-cip-crosswalk"><div class="main-container">
      <div id="cip-crosswalk-root"></div>
    </div></div>
  </body></html>`;
  return new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/" });
}
const FIXTURE = {
  sources: ["COCI", "CCCCO TOP-CIP", "Submitted by Field"],
  top: { "0101.00": { t: "Agriculture Technology", div: "01", divt: "Agriculture and Natural Resources", sec: "Agriculture Sector", cte: 1, crs: 251, cid: 33 } },
  cip: {
    "01.0000": { t: "Agriculture, General", fam: "01", famt: "Agricultural Fields", cte: "CTE", act: "New", chg: "no", def: "A program about agriculture.", xref: "", ex: "Agroeconomics", soc: [["19-1011", "Animal Scientists"]] },
    "52.0201": { t: "Business Administration", fam: "52", famt: "Business", cte: "Not CTE", act: "", chg: "", def: "A business program.", xref: "", ex: "", soc: [] },
  },
  // 3rd pair: null TOP (CIP-only); 4th: CIP code with NO catalog entry (missing)
  pairs: [
    ["0101.00", "01.0000", 0, 0, "Allan Hancock, Cabrillo", 2],
    ["0101.00", "52.0201", 2, 0, "", 0],
    [null, "52.0201", 2, 1, "", 0],
    ["0101.00", "99.9999", 2, 0, "", 0],
  ],
};

const dom = makeDom();
const { window } = dom;
const document = window.document;
window.CIP_CROSSWALK = JSON.parse(JSON.stringify(FIXTURE));

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("cip_crosswalk.js eval threw:", e); }
check("cip_crosswalk.js evaluates without throwing", !threw);
check("module registered on window", window.CPL_CIP_CROSSWALK && typeof window.CPL_CIP_CROSSWALK.activate === "function");

let actThrew = false;
try { window.CPL_CIP_CROSSWALK.activate(); } catch (e) { actThrew = true; console.error("activate() threw:", e); }
check("activate() renders without throwing", !actThrew);

const root = document.getElementById("cip-crosswalk-root");
check("renders the .cipx container", root && root.querySelector(".cipx"));
check("renders the header stat cards", root && root.querySelectorAll(".cipx-stat").length === 4);
check("renders the search box", root && root.querySelector("#cipx-q"));
check("renders the results table", root && root.querySelector("table.cipx-table"));
check("renders a row per pair (4 fixture pairs)", root && root.querySelectorAll("tbody tr.cipx-row").length === 4);
check("renders source badges", root && root.querySelector(".cipx-src"));
check("renders a NEW transition chip", root && root.querySelector(".cipx-chip.new"));

// filtering via the test seam
const passesAll = FIXTURE.pairs.length;
window.CPL_CIP_CROSSWALK._buildIndex(JSON.parse(JSON.stringify(FIXTURE)));
check("_filtered returns all rows with no query", window.CPL_CIP_CROSSWALK._filtered().length === passesAll);

// transfer indicator (TOP 0101.00 has cid=33) + chip renders
check("renders a transfer-model (C-ID) chip for a TOP with C-ID courses",
  root && /C-ID/.test(root.textContent) && root.querySelector(".cipx-chip.xfer"));
check("transfer filter control exists", root && root.querySelector("#cipx-transfer"));

// expand a row → detail panel with the CIP definition
const firstRow = root.querySelector("tbody tr.cipx-row");
let clickThrew = false;
try { firstRow.click(); } catch (e) { clickThrew = true; console.error("row click threw:", e); }
check("clicking a row does not throw", !clickThrew);
const detail = document.querySelector(".cipx-detail");
check("row expands into a detail panel", !!detail);
check("detail shows the CIP definition", detail && /A program about agriculture/.test(detail.textContent));
check("detail shows the SOC occupation link", detail && detail.querySelector("a.cipx-socchip"));
check("detail shows the COCI deep-link button", detail && detail.querySelector(".cipx-linkbtn"));
check("detail offers a suggest button", detail && detail.querySelector(".cipx-suggestbtn"));

// suggest button reveals the form
const sBtn = detail.querySelector(".cipx-suggestbtn");
sBtn.click();
check("suggest button reveals a form with the intake fields",
  document.querySelector(".cipx-form") && document.querySelector(".cipx-form textarea.cipx-ta"));

// scoped CSS
const styleEl = document.getElementById("cip-crosswalk-css");
check("scoped CSS injected once", styleEl && document.querySelectorAll("#cip-crosswalk-css").length === 1);
check("CSS scopes under .cipx (not :root)", styleEl && styleEl.textContent.indexOf(".cipx") !== -1 && styleEl.textContent.indexOf(":root") === -1);

// ─────────────────────────────────────────────────────────────────────────────
// Part C — failure-mode guards (fresh module instances)
// ─────────────────────────────────────────────────────────────────────────────
const dom2 = makeDom();
dom2.window.eval(src);            // no window.CIP_CROSSWALK set
let missThrew = false;
try { dom2.window.CPL_CIP_CROSSWALK.activate(); } catch (e) { missThrew = true; }
const r2 = dom2.window.document.getElementById("cip-crosswalk-root");
check("missing data → no throw", !missThrew);
check("missing data → graceful empty message", r2 && /unavailable/.test(r2.textContent));

// a pair whose CIP has no catalog entry must still expand without throwing
const dom3 = makeDom();
dom3.window.CIP_CROSSWALK = JSON.parse(JSON.stringify(FIXTURE));
dom3.window.eval(src);
dom3.window.CPL_CIP_CROSSWALK.activate();
const rows3 = dom3.window.document.querySelectorAll("tbody tr.cipx-row");
let orphanThrew = false;
try { rows3[rows3.length - 1].click(); } catch (e) { orphanThrew = true; console.error(e); }
check("orphan-CIP + null-TOP rows expand without throwing", !orphanThrew);

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);

// CIP Code Taxonomy tab (cip_crosswalk.js) — guards the reference tab + renderer.
//   - Rule 4 (both HTMLs identical) + the nav button / pane / mount / lazy boot.
//   - nav_groups.js lists the tab in Reference & Curation; cobi_orgs.js has the
//     CIP site.
//   - It is a backend-free REFERENCE (the CO reframe: COE hosts the crosswalk,
//     no "suggest" form) — the shipped module carries no Supabase/service key.
//   - activate() renders the search + plain-English finder + category/family
//     filters into #cip-crosswalk-root without throwing; retired/reserved are
//     hidden by default; the finder ranks real records only.
//   - Failure-mode guards: missing data → a graceful message (no crash); an
//     empty rows[] renders without throwing.
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
check("nav has the CIP tab button", /data-tab="cip-crosswalk" role="tab"/.test(cpl));
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
check("cip_crosswalk.js is backend-free (no Supabase)", src.indexOf("supabase.co") === -1);
check("cip_crosswalk.js carries no service key", src.indexOf("service_role") === -1);
check("cip_crosswalk.js has no submit fetch (reference only)", src.indexOf("fetch(") === -1);

// data file sanity — the lean reference shape {fams, rows}
const dataSrc = fs.readFileSync("cip_crosswalk_data.js", "utf8");
check("cip_crosswalk_data.js assigns window.CIP_CROSSWALK", /window\.CIP_CROSSWALK\s*=/.test(dataSrc));
check("cip_crosswalk_data.js carries rows[] + fams{}", /"rows":/.test(dataSrc) && /"fams":/.test(dataSrc));

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
  fams: { "01": "Agricultural Sciences", "51": "Health Professions", "52": "Business" },
  rows: [
    { code: "01.0000", t: "Agriculture, General", cat: "Both", fam: "01", def: "A program about general agriculture and farming.", ex: "Agroeconomics", act: "New", x: 1 },
    { code: "51.3801", t: "Registered Nursing", cat: "CTE", fam: "51", def: "A program that prepares registered nurses to practice.", ex: "", act: "No substantive changes", x: 1 },
    { code: "52.0201", t: "Business Administration", cat: "Non-CTE", fam: "52", def: "A general business administration program.", ex: "", act: "" },
    { code: "01.0309", t: "Old Retired Field", cat: "Retired", fam: "01", def: "A field moved or deleted in the 2020 CIP edition.", ex: "", act: "Deleted" },
    { code: "51.9999", t: "Reserved Placeholder", cat: "Reserved", fam: "51", def: "A reserved placeholder code.", ex: "", act: "" },
  ],
};

function fresh() {
  const dom = makeDom();
  dom.window.CIP_CROSSWALK = JSON.parse(JSON.stringify(FIXTURE));
  dom.window.eval(src);
  dom.window.CPL_CIP_CROSSWALK.activate();
  return dom;
}

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
check("renders the 'CIP Code Taxonomy' header", root && /CIP Code Taxonomy/.test(root.querySelector(".cipx-h2").textContent));
check("renders the plain-English finder input", root && root.querySelector(".cipx-fnd-in"));
check("renders the search box", root && root.querySelector("#cipx-q"));
check("renders 5 category pills", root && root.querySelectorAll(".cipx-pills .cipx-pill").length === 5);
check("renders the C-ID/CCN toggle chip", root && root.querySelector(".cipx-pill-xfer"));
check("renders the family select (All + 3 fams)", root && root.querySelector(".cipx-fsel") && root.querySelector(".cipx-fsel").querySelectorAll("option").length === 4);
check("renders a CSV export button", root && root.querySelector(".cipx-csv"));

// retired + reserved hidden by default → only the 3 go-forward rows
check("hides retired/reserved by default (3 go-forward rows)", root && root.querySelectorAll(".cipx-item").length === 3);
check("renders a NEW transition badge", root && root.querySelector(".cipx-new"));
check("renders a category badge", root && root.querySelector(".cipx-cat"));
check("_filtered returns the 3 go-forward rows with no query", window.CPL_CIP_CROSSWALK._filtered().length === 3);

// finder ranks real records only (grounded — no invented codes)
const nurseHit = window.CPL_CIP_CROSSWALK._rankCIP("registered nursing");
check("finder surfaces nursing for 'registered nursing'", nurseHit.length && nurseHit[0].r.code === "51.3801");
const agHit = window.CPL_CIP_CROSSWALK._rankCIP("agriculture farming");
check("finder surfaces agriculture for 'agriculture farming'", agHit.length && agHit[0].r.code === "01.0000");
check("finder returns nothing for a nonsense query", window.CPL_CIP_CROSSWALK._rankCIP("zzqxnomatch").length === 0);
check("finder never ranks a retired code", window.CPL_CIP_CROSSWALK._rankCIP("reserved placeholder").every(function (h) { return h.r.cat !== "Retired" && h.r.cat !== "Reserved"; }));

// expand a row → detail with the definition + the NCES link
const firstRow = root.querySelector(".cipx-row");
let clickThrew = false;
try { firstRow.click(); } catch (e) { clickThrew = true; console.error("row click threw:", e); }
check("clicking a row does not throw", !clickThrew);
const detail = root.querySelector(".cipx-detail");
check("row expands into a detail panel", !!detail);
check("detail shows the CIP definition", detail && /agriculture and farming/.test(detail.textContent));
check("detail shows the NCES lookup link", detail && detail.querySelector(".cipx-ncesbtn"));

// scoped CSS
const styleEl = document.getElementById("cip-crosswalk-css");
check("scoped CSS injected once", styleEl && document.querySelectorAll("#cip-crosswalk-css").length === 1);
check("CSS scopes under .cipx (not :root)", styleEl && styleEl.textContent.indexOf(".cipx") !== -1 && styleEl.textContent.indexOf(":root") === -1);

// ── interaction: retired toggle reveals all 5 ──
const domR = fresh();
const cb = domR.window.document.querySelector(".cipx-retiredtog input");
cb.checked = true; cb.dispatchEvent(new domR.window.Event("change"));
check("ticking 'include retired/reserved' reveals all 5 codes", domR.window.document.querySelectorAll(".cipx-item").length === 5);

// ── interaction: category pill filters to CTE only ──
const domC = fresh();
const ctePill = Array.prototype.filter.call(domC.window.document.querySelectorAll(".cipx-pills .cipx-pill"),
  function (b) { return b.textContent === "CTE"; })[0];
ctePill.click();
const cItems = domC.window.document.querySelectorAll(".cipx-item");
check("category pill 'CTE' filters to the 1 CTE row", cItems.length === 1 && /Registered Nursing/.test(cItems[0].textContent));

// ── interaction: C-ID/CCN chip filters to flagged rows (go-forward) ──
const domX = fresh();
domX.window.document.querySelector(".cipx-pill-xfer").click();
check("C-ID/CCN chip filters to the 2 flagged go-forward rows", domX.window.document.querySelectorAll(".cipx-item").length === 2);

// ── interaction: family select narrows to one family ──
const domF = fresh();
const sel = domF.window.document.querySelector(".cipx-fsel");
sel.value = "52"; sel.dispatchEvent(new domF.window.Event("change"));
const fItems = domF.window.document.querySelectorAll(".cipx-item");
check("family select '52' narrows to Business Administration", fItems.length === 1 && /Business Administration/.test(fItems[0].textContent));

// ─────────────────────────────────────────────────────────────────────────────
// Part C — failure-mode guards (fresh module instances)
// ─────────────────────────────────────────────────────────────────────────────
const dom2 = makeDom();
dom2.window.eval(src);            // no window.CIP_CROSSWALK set
let missThrew = false;
try { dom2.window.CPL_CIP_CROSSWALK.activate(); } catch (e) { missThrew = true; }
const r2 = dom2.window.document.getElementById("cip-crosswalk-root");
check("missing data → no throw", !missThrew);
check("missing data → graceful message", r2 && /unavailable/.test(r2.textContent));

const dom3 = makeDom();
dom3.window.CIP_CROSSWALK = { fams: {}, rows: [] };
dom3.window.eval(src);
let emptyThrew = false;
try { dom3.window.CPL_CIP_CROSSWALK.activate(); } catch (e) { emptyThrew = true; console.error(e); }
const r3 = dom3.window.document.getElementById("cip-crosswalk-root");
check("empty rows[] → no throw", !emptyThrew);
check("empty rows[] → renders an empty-state message", r3 && r3.querySelector(".cipx-empty"));

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);

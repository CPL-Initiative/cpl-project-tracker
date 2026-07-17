// CIP Code Taxonomy tab (cip_crosswalk.js) — guards the reference tab + renderer.
//   - Rule 4 (both HTMLs identical) + nav button / pane / mount / lazy boot.
//   - Backend-free REFERENCE (no Supabase/service key); COE hosts the crosswalk.
//   - Browse: search + finder + filters; retired/reserved hidden by default.
//   - Inline "Check a course against this CIP": a remembered college selector +,
//     inside each expanded code, the college's courses (lazy-loaded) sorted
//     best-fit-first for that CIP; selecting one runs an IDF-weighted confidence
//     read against its COCI description. Grounded — the engine ranks real records
//     only, never invents a code.
//   - Failure guards: missing data / empty rows / a college with no courses all
//     render without throwing.
//
// Run from repo root: `npm test` (or `node tests/cip_crosswalk.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const tick = () => new Promise((r) => setTimeout(r, 0));

const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
const src = fs.readFileSync("cip_crosswalk.js", "utf8");
const dataSrc = fs.readFileSync("cip_crosswalk_data.js", "utf8");
const orgsSrc = fs.readFileSync("cobi_orgs.js", "utf8");
const groupsSrc = fs.readFileSync("nav_groups.js", "utf8");

// ── Part A — static invariants ──────────────────────────────────────────────
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
check("nav has the CIP tab button", /data-tab="cip-crosswalk" role="tab"/.test(cpl));
check("pane #tab-cip-crosswalk exists", /id="tab-cip-crosswalk"/.test(cpl));
check("mount #cip-crosswalk-root exists", /id="cip-crosswalk-root"/.test(cpl));
check("boot wiring: onActivate('cip-crosswalk')", /onActivate\('cip-crosswalk'/.test(cpl));
check("boot wiring: loadScript('cip_crosswalk_data.js','CIP_CROSSWALK')", /loadScript\('cip_crosswalk_data\.js', 'CIP_CROSSWALK'/.test(cpl));
check("nav_groups.js lists 'cip-crosswalk'", /'cip-crosswalk'/.test(groupsSrc));
check("cobi_orgs.js registers the CIP site", /id:\s*"cip"/.test(orgsSrc) && /"cip-crosswalk"/.test(orgsSrc));
check("cip_crosswalk.js exposes CPL_CIP_CROSSWALK.activate", /window\.CPL_CIP_CROSSWALK\s*=\s*\{\s*[\s\S]*activate/.test(src));
check("cip_crosswalk.js is backend-free (no Supabase)", src.indexOf("supabase.co") === -1);
check("cip_crosswalk.js carries no service key", src.indexOf("service_role") === -1);
check("cip_crosswalk.js carries a scoped dark theme", src.indexOf(".cipx-theme-dark") !== -1);
check("cip_crosswalk.js has the inline college selector", /cipx-collegebar/.test(src) && /cip_fitcheck_colleges\.json/.test(src));
check("cip_crosswalk.js lazy-fetches per-college courses", /cip_fitcheck\/" \+ slug/.test(src));
check("cip_crosswalk.js sanitizes the college slug before fetch", /replace\(\/\[\^a-z0-9_\]/.test(src));
check("cip_crosswalk.js has a mobile breakpoint", /@media \(max-width:640px\)/.test(src));
check("cip_crosswalk_data.js carries rows[] + fams{}", /"rows":/.test(dataSrc) && /"fams":/.test(dataSrc));
// the fitcheck data pipeline exists
check("kb/_build_cip_fitcheck.py exists", fs.existsSync("kb/_build_cip_fitcheck.py"));
check("cip_fitcheck_colleges.json exists", fs.existsSync("cip_fitcheck_colleges.json"));

// ── Part B — jsdom fixtures ─────────────────────────────────────────────────
function makeDom() {
  const html = `<!DOCTYPE html><html><body>
    <div class="cpl-tab-pane" id="tab-cip-crosswalk"><div class="main-container"><div id="cip-crosswalk-root"></div></div></div>
  </body></html>`;
  return new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/" });
}
const FIXTURE = {
  fams: { "01": "Agricultural Sciences", "51": "Health Professions", "52": "Business" },
  rows: [
    { code: "01.0000", t: "Agriculture, General", cat: "Both", fam: "01", def: "A program about general agriculture and farming and crop cultivation.", ex: "Agroeconomics", act: "New", x: 1 },
    { code: "51.3801", t: "Registered Nursing", cat: "CTE", fam: "51", def: "A program that prepares registered nurses to practice nursing.", ex: "", act: "No substantive changes", x: 1 },
    { code: "52.0201", t: "Business Administration", cat: "Non-CTE", fam: "52", def: "A general business administration program covering management and organization and accounting.", ex: "", act: "" },
    { code: "01.0309", t: "Old Retired Field", cat: "Retired", fam: "01", def: "A field moved or deleted in the 2020 CIP edition.", ex: "", act: "Deleted" },
    { code: "51.9999", t: "Reserved Placeholder", cat: "Reserved", fam: "51", def: "A reserved placeholder code.", ex: "", act: "" },
  ],
};
const MANIFEST = [{ name: "Test College", slug: "test_college", n: 3 }];
const COURSES = [
  ["BUS 101 — Business Basics", "A general business administration program covering management and organization and accounting operations.", "0505.00"],
  ["WELD 100 — Welding", "A welding course covering MIG and TIG welding of metal and fabrication.", "0956.50"],
  ["AGRI 100 — Intro to Agriculture", "A course about general agriculture, farming, and crop cultivation.", "0101.00"],
];

function fresh(withCollege) {
  const dom = makeDom();
  dom.window.CIP_CROSSWALK = JSON.parse(JSON.stringify(FIXTURE));
  dom.window.eval(src);
  const api = dom.window.CPL_CIP_CROSSWALK;
  api._setColleges(JSON.parse(JSON.stringify(MANIFEST)));
  api._setCourses && api._setCourses("test_college", JSON.parse(JSON.stringify(COURSES)));
  if (withCollege) { try { dom.window.localStorage.setItem("cipx_college", "test_college"); } catch (e) {} }
  api.activate();
  return dom;
}

(async () => {
  const dom = makeDom();
  const { window } = dom;
  const document = window.document;
  window.CIP_CROSSWALK = JSON.parse(JSON.stringify(FIXTURE));

  let threw = false;
  try { window.eval(src); } catch (e) { threw = true; console.error("eval threw:", e); }
  check("cip_crosswalk.js evaluates without throwing", !threw);
  const api = window.CPL_CIP_CROSSWALK;
  check("module registered on window", api && typeof api.activate === "function");
  check("exposes the fit test seams", api && typeof api._setColleges === "function" && typeof api._setCourses === "function" && typeof api._courseScore === "function");
  api._setColleges(JSON.parse(JSON.stringify(MANIFEST)));

  let actThrew = false;
  try { api.activate(); } catch (e) { actThrew = true; console.error("activate threw:", e); }
  check("activate() renders without throwing", !actThrew);

  const root = document.getElementById("cip-crosswalk-root");
  check("renders the .cipx container", root && root.querySelector(".cipx"));
  check("renders the 'CIP Code Taxonomy' header", root && /CIP Code Taxonomy/.test(root.querySelector(".cipx-h2").textContent));
  check("renders the theme toggle", root && root.querySelector(".cipx-themetog"));
  check("renders the search box", root && root.querySelector(".cipx-panel #cipx-q"));
  check("renders 5 category pills", root && root.querySelectorAll(".cipx-pills .cipx-pill").length === 5);
  check("renders the family select (All + 3 fams)", root && root.querySelector(".cipx-fsel") && root.querySelector(".cipx-fsel").querySelectorAll("option").length === 4);
  check("renders the college selector bar", root && root.querySelector(".cipx-collegebar .cipx-college-sel"));
  check("college selector is populated (placeholder + 1 college)", root && root.querySelector(".cipx-college-sel").querySelectorAll("option").length === 2);
  check("hides retired/reserved by default (3 go-forward rows)", root && root.querySelectorAll(".cipx-item").length === 3);
  check("_filtered returns the 3 go-forward rows", api._filtered().length === 3);

  // engine seams
  const nurse = api._score("registered nursing").ranked;
  check("engine surfaces nursing for 'registered nursing'", nurse.length && nurse[0].r.code === "51.3801");
  check("engine never ranks a retired/reserved code", api._score("reserved placeholder field").ranked.every((h) => h.r.cat !== "Retired" && h.r.cat !== "Reserved"));
  check("engine returns a margin (discrimination signal)", typeof api._score("business administration management").margin === "number");
  // course-vs-cip alignment: the business course scores higher against 52.0201
  // than nursing. (Pull the tab's OWN row objects — they carry the token sets.)
  const bizToks = api._courseToks(COURSES[0].slice());
  const bizRow = api._score("business administration management organization").ranked.filter((x) => x.r.code === "52.0201")[0].r;
  const nurseRow = api._score("registered nursing").ranked.filter((x) => x.r.code === "51.3801")[0].r;
  check("course-vs-CIP scores an aligned pairing above a mismatch",
    api._courseScore(bizToks, bizRow).score > api._courseScore(bizToks, nurseRow).score);

  // expand a row WITHOUT a college set → the fit block nudges to pick one
  const firstRow = root.querySelector(".cipx-row");
  let clickThrew = false;
  try { firstRow.click(); } catch (e) { clickThrew = true; console.error(e); }
  check("expanding a row does not throw", !clickThrew);
  const det = root.querySelector(".cipx-detail");
  check("row expands to a detail panel with the definition", det && /agriculture and farming/.test(det.textContent));
  check("detail shows the NCES lookup link", det && det.querySelector(".cipx-ncesbtn"));
  check("detail shows the inline fit block", det && det.querySelector(".cipx-fit"));
  check("no college set → fit block nudges to pick a college", det && det.querySelector(".cipx-fit-nudge"));

  // scoped CSS
  const styleEl = document.getElementById("cip-crosswalk-css");
  check("scoped CSS injected once, no :root", styleEl && document.querySelectorAll("#cip-crosswalk-css").length === 1 && styleEl.textContent.indexOf(":root") === -1 && styleEl.textContent.indexOf(".cipx") !== -1);

  // ── inline fit flow: college set + course pick → verdict ──
  const domF = fresh(true);
  const fdoc = domF.window.document;
  check("remembered college pre-selects in the bar", fdoc.querySelector(".cipx-college-sel").value === "test_college");
  // expand the Business Administration row (52.0201)
  const bizItemRow = Array.prototype.filter.call(fdoc.querySelectorAll(".cipx-row"), (r) => /52\.0201/.test(r.textContent))[0];
  bizItemRow.click();
  await tick(); await tick();  // let loadCollege() resolve + populate the picker
  const wrap = Array.prototype.filter.call(fdoc.querySelectorAll(".cipx-item"), (it) => /52\.0201/.test(it.textContent))[0].querySelector(".cipx-cbwrap");
  const input = wrap && wrap.querySelector(".cipx-fit-cb");
  check("with a college set, the course combobox renders (custom, not native select)", !!input && !wrap.querySelector("select"));
  // open the panel + confirm it opens BELOW the input (absolute, top:100%) — the #3 fix
  input.focus();
  const panel = wrap.querySelector(".cipx-fit-panel");
  check("focusing the combobox opens the options panel", panel && panel.style.display !== "none");
  check("the panel has a 'Best matches' group", panel && Array.prototype.some.call(panel.querySelectorAll(".cipx-cb-group"), (g) => /Best matches/.test(g.textContent)));
  check("best-fit-first: the business course is the first option", panel && /Business Basics/.test(panel.querySelector(".cipx-cb-opt").textContent));
  // typing filters the full list (the #2 "leave it to faculty" search)
  input.value = "welding"; input.dispatchEvent(new domF.window.Event("input"));
  check("typing filters the course list", panel && /Welding/.test(panel.textContent) && !/Business Basics/.test(panel.textContent));
  // pick the business course from the (rebuilt) best matches
  input.value = ""; input.dispatchEvent(new domF.window.Event("input"));
  const bizOpt = Array.prototype.filter.call(panel.querySelectorAll(".cipx-cb-opt"), (o) => /Business Basics/.test(o.textContent))[0];
  bizOpt.dispatchEvent(new domF.window.MouseEvent("mousedown"));
  const fitResult = wrap.querySelector(".cipx-fit-result");
  check("picking a course closes the panel", panel.style.display === "none");
  check("picking a course renders a verdict card", fitResult && fitResult.querySelector(".cipx-verdict"));
  check("the verdict shows a confidence tier pill", fitResult && fitResult.querySelector(".cipx-vpill"));
  check("a well-aligned course reads as a Strong fit", fitResult && fitResult.querySelector(".cipx-vpill-ok"));
  check("the verdict lists closest CIP candidates", fitResult && fitResult.querySelectorAll(".cipx-cand-card").length >= 1);
  check("a paste-a-description fallback is offered", wrap.parentNode.parentNode.querySelector(".cipx-fit-pastelink"));

  // ── Part C — failure guards ──
  const dom2 = makeDom(); dom2.window.eval(src);
  let missThrew = false;
  try { dom2.window.CPL_CIP_CROSSWALK.activate(); } catch (e) { missThrew = true; }
  check("missing data → no throw", !missThrew);
  check("missing data → graceful message", /unavailable/.test(dom2.window.document.getElementById("cip-crosswalk-root").textContent));

  const dom3 = makeDom(); dom3.window.CIP_CROSSWALK = { fams: {}, rows: [] }; dom3.window.eval(src);
  let emptyThrew = false;
  try { dom3.window.CPL_CIP_CROSSWALK.activate(); } catch (e) { emptyThrew = true; console.error(e); }
  check("empty rows[] → no throw", !emptyThrew);
  check("empty rows[] → renders an empty-state message", dom3.window.document.querySelector(".cipx-empty"));

  // college with no courses → nudge, no throw
  const dom4 = makeDom();
  dom4.window.CIP_CROSSWALK = JSON.parse(JSON.stringify(FIXTURE));
  dom4.window.eval(src);
  dom4.window.CPL_CIP_CROSSWALK._setColleges(JSON.parse(JSON.stringify(MANIFEST)));
  dom4.window.CPL_CIP_CROSSWALK._setCourses("test_college", []);
  try { dom4.window.localStorage.setItem("cipx_college", "test_college"); } catch (e) {}
  let noCoursesThrew = false;
  try { dom4.window.CPL_CIP_CROSSWALK.activate(); dom4.window.document.querySelector(".cipx-row").click(); await tick(); } catch (e) { noCoursesThrew = true; console.error(e); }
  check("a college with no courses does not throw", !noCoursesThrew);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();

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
  topcip: { "0505.00": { t: "Business", c: [["52.0201", "o"]] } },
  boiler: [],
};
const MANIFEST = [{ name: "Test College", slug: "test_college", n: 3 }];
const COURSES = [
  ["BUS 101 — Business Basics", "A general business administration program covering management and organization and accounting operations.", "0505.00"],
  ["WELD 100 — Welding", "A welding course covering MIG and TIG welding of metal and fabrication.", "0956.50"],
  ["AGRI 100 — Intro to Agriculture", "A course about general agriculture, farming, and crop cultivation.", "0101.00"],
];

// A richer fixture for the "Find my course's code" (TOP→CIP easy button) mode:
// a TOP (0505.00) whose crosswalk lists business/accounting CIPs + two universal
// noncredit boilerplate codes, plus a nursing CIP reachable only by description
// (never listed for the business TOP → the "outside the crosswalk" case).
const RFIXTURE = {
  fams: { "51": "Health Professions", "52": "Business", "32": "Basic Skills", "49": "Transportation", "27": "Mathematics" },
  rows: [
    { code: "49.0205", t: "Truck and Bus Driver/Commercial Vehicle Operator and Instructor", cat: "CTE", fam: "49", def: "A program that prepares individuals to drive trucks and buses and other commercial motor vehicles.", ex: "", act: "" },
    { code: "27.0101", t: "Mathematics, General", cat: "Non-CTE", fam: "27", def: "A general program that focuses on mathematics and statistics.", ex: "", act: "" },
    { code: "32.0202", t: "High School Equivalent Exam Preparation", cat: "Noncredit", fam: "32", def: "A noncredit program preparing students for high school equivalent examinations.", ex: "", act: "" },
    { code: "52.0201", t: "Business Administration and Management", cat: "Non-CTE", fam: "52", def: "A general business administration program covering management and organization and accounting.", ex: "", act: "" },
    { code: "52.0301", t: "Accounting", cat: "CTE", fam: "52", def: "A program that prepares individuals to practice accounting and auditing and bookkeeping.", ex: "", act: "" },
    { code: "52.0302", t: "Accounting Technology", cat: "CTE", fam: "52", def: "A program in accounting technology and bookkeeping and payroll clerical work.", ex: "", act: "" },
    { code: "52.9001", t: "Managerial Economics (outside the crosswalk)", cat: "Non-CTE", fam: "52", def: "A program in business administration and management and organization and accounting and economics and econometrics and quantitative analysis for managers.", ex: "", act: "" },
    { code: "51.3801", t: "Registered Nursing", cat: "CTE", fam: "51", def: "A program that prepares registered nurses to practice nursing and patient care.", ex: "", act: "" },
    { code: "32.0107", t: "Career Exploration", cat: "Noncredit", fam: "32", def: "A noncredit program in career exploration and awareness.", ex: "", act: "" },
    { code: "32.0111", t: "Workforce Development", cat: "Noncredit", fam: "32", def: "A noncredit program in workforce development and training.", ex: "", act: "" },
    { code: "01.0000", t: "Agriculture, General", cat: "Both", fam: "01", def: "A program about general agriculture and farming.", ex: "", act: "" },
  ],
  topcip: {
    "0505.00": { t: "Accounting", c: [["52.0201", "o"], ["52.0301", "o"], ["52.0302", "o"], ["32.0107", "n"], ["32.0111", "n"]] },
    "1701.00": { t: "Mathematics", c: [["27.0101", "o"], ["32.0202", "n"]] },
    "1230.00": { t: "Registered Nursing", c: [["51.3801", "o"]] },
  },
  boiler: ["32.0107", "32.0111"],
};
const RCOURSES = [
  ["BUS 101 — Business Basics", "A general business administration program covering management and organization and accounting operations.", "0505.00"],
  ["NURS 101 — Nursing", "A program that prepares registered nurses to practice nursing and patient care.", "0505.00"],
  ["MYST 1 — Mystery", "Short.", "0505.00"],
  ["ORPH 1 — Orphan Course", "A program that prepares registered nurses to practice nursing and patient care.", "7777.00"],
];
// cross-college consensus fixture: peers overwhelmingly code "Nursing" under a Registered
// Nursing TOP (1230.00); this college used 0505.00 (Accounting) — the lone outlier.
const RCONSENSUS = {
  colleges: ["Alpha College", "Beta College", "Gamma College", "Delta College", "Test College"],
  titles: {
    "nursing": { n: 5, t: [["1230.00", [0, 1, 2, 3]], ["0505.00", [4]]] },
    "business basics": { n: 6, t: [["0505.00", [0, 1, 2, 3, 4]]] },
  },
};
function freshR(mode) {
  const dom = makeDom();
  dom.window.CIP_CROSSWALK = JSON.parse(JSON.stringify(RFIXTURE));
  try { dom.window.localStorage.setItem("cipx_college", "test_college"); } catch (e) {}
  if (mode) { try { dom.window.localStorage.setItem("cipx_mode", mode); } catch (e) {} }
  dom.window.eval(src);
  const api = dom.window.CPL_CIP_CROSSWALK;
  api._setColleges(JSON.parse(JSON.stringify(MANIFEST)));
  api._setCourses("test_college", JSON.parse(JSON.stringify(RCOURSES)));
  api.activate();
  return dom;
}

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

  // ── a11y (WCAG pass) ──
  check("a11y: recommend result host is an aria-live region", /"cipx-rec-host", "aria-live": "polite"/.test(src));
  check("a11y: expandable rows carry aria-expanded (browse + recommend + review)", /"cipx-row"[\s\S]{0,90}aria-expanded/.test(src) && /"cipx-rec-row"[\s\S]{0,110}aria-expanded/.test(src) && /"cipx-rev-row"[\s\S]{0,60}aria-expanded/.test(src));
  check("a11y: the ✓ Recommended badge uses an accessible (darker) bg token", /--cipx-recbadge-bg:#3f6b4e/.test(src) && /cipx-recbadge\{[^}]*var\(--cipx-recbadge-bg\)/.test(src));
  check("a11y: combobox options report aria-selected when active", /setAttribute\("aria-selected", "true"\)/.test(src) && /removeAttribute\("aria-selected"\)/.test(src));
  check("a11y: no boiler code can appear in a fallback ranked display", /function nonBoiler/.test(src) && !/m\.res\.ranked\.slice\(0, 6\)/.test(src));

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

  // no-anchor inline picker: 51.3801 has no crosswalk-mapped course at this college →
  // an honest "none map" notice + the full A–Z list (Sam's call), NOT lexical guesses
  const nurseItemRow = Array.prototype.filter.call(fdoc.querySelectorAll(".cipx-row"), (rr) => /51\.3801/.test(rr.textContent))[0];
  nurseItemRow.click();
  await tick(); await tick();
  const nurseWrap = Array.prototype.filter.call(fdoc.querySelectorAll(".cipx-item"), (it) => /51\.3801/.test(it.textContent))[0].querySelector(".cipx-cbwrap");
  const nurseInput = nurseWrap && nurseWrap.querySelector(".cipx-fit-cb");
  nurseInput.focus();
  const nursePanel = nurseWrap.querySelector(".cipx-fit-panel");
  check("no-anchor picker shows the honest 'none of your courses map' notice", nursePanel && Array.prototype.some.call(nursePanel.querySelectorAll(".cipx-cb-group"), (g) => /None of your courses map/.test(g.textContent)));
  check("no-anchor picker still offers the full course list to choose from", nursePanel && nursePanel.querySelectorAll(".cipx-cb-opt").length >= 1);
  check("no-anchor picker does NOT present a 'Best matches' group", nursePanel && !Array.prototype.some.call(nursePanel.querySelectorAll(".cipx-cb-group"), (g) => /Best matches/.test(g.textContent)));

  // ── Part B2 — "Find my course's code" (TOP→CIP easy button) ──
  check("cip_crosswalk_data.js carries topcip{} + boiler[]", /"topcip":/.test(dataSrc) && /"boiler":/.test(dataSrc));
  check("cip_crosswalk.js has the two-mode toggle", /cipx-modebar/.test(src) && /Find my course/.test(src));
  check("cip_crosswalk.js exposes the recommend seam", /_recommend:/.test(src));

  // logic (via the _recommend seam — no DOM)
  const rApi = freshR().window.CPL_CIP_CROSSWALK;
  rApi._setConsensus(RCONSENSUS);
  const mBiz = rApi._recommend(RCOURSES[0]);
  check("recommend resolves the course's TOP + title", mBiz.top === "0505.00" && /Accounting/.test(mBiz.topTitle) && mBiz.hasCross);
  check("recommend ranks the crosswalk candidates by fit", mBiz.cands.length && mBiz.cands[0].r.code === "52.0201");
  check("recommend flags a two-signals-agree winner (✓ Recommended)", mBiz.recommended === "52.0201");
  check("recommend splits out the boiler candidates", mBiz.boiler.length === 2 && mBiz.boiler.every((b) => b.r.code.indexOf("32.01") === 0));
  check("boiler codes never sit in the main ranked list", mBiz.cands.every((c) => c.r.code.indexOf("32.01") !== 0));
  check("recommend carries a provenance tier per candidate", mBiz.cands[0].prov === "o");
  // a nursing description under the business TOP → strong match OUTSIDE the crosswalk, no false winner
  const mNur = rApi._recommend(RCOURSES[1]);
  check("recommend surfaces a strong match outside the crosswalk (⚠)", mNur.beyond.some((o) => o.r.code === "51.3801"));
  check("recommend withholds a winner when the signals disagree", mNur.recommended === null);
  // a TOP absent from the crosswalk → falls back to description matches, no crash
  const mOrphan = rApi._recommend(RCOURSES[3]);
  check("recommend handles a TOP absent from the crosswalk", mOrphan.hasCross === false && mOrphan.res.ranked.length >= 1);
  // too-thin description → flagged honestly
  check("recommend flags a too-thin description", rApi._recommend(RCOURSES[2]).thin === true);

  // ── Fix A: the subject-code prefix no longer leaks into the lexical match ──
  const busToks = rApi._courseToks(["BUS 103 — Advertising", "media campaign design"]);
  check("Fix A: _courseToks drops the SUBJ + course-number prefix", busToks.indexOf("bus") < 0 && busToks.indexOf("103") < 0 && busToks.indexOf("advertis") >= 0);
  const truckRow = rApi._score("truck bus driver commercial vehicle").ranked.find((o) => o.r.code === "49.0205").r;
  check("Fix A: a 'BUS …' course no longer matches 'Truck and Bus Driver'", rApi._courseScore(rApi._courseToks(["BUS 103 — Advertising", "media campaign design"]), truckRow).score === 0);

  // ── Fix B: the inline "best matches" anchor on the crosswalk (TOP→CIP) ──
  const bizCip = rApi._score("business administration management organization").ranked.find((o) => o.r.code === "52.0201").r;
  // TOP 0505.00 maps to 52.0201 in RFIXTURE, so a 0505.00 course is anchored; a
  // lexically STRONGER course on a TOP that doesn't map here must NOT be anchored.
  const bmCourses = [
    ["MGMT 50 — Management", "A course covering organization.", "0505.00"],
    ["ZZ 1 — Strong Lexical Match", "A general business administration program covering management and organization and accounting.", "9999.00"],
  ];
  const bm = rApi._bestMatches(bizCip, bmCourses);
  check("Fix B: anchored group leads with a crosswalk-anchored course", bm.anchored.length === 1 && bm.anchored[0][2] === "0505.00" && /MGMT 50/.test(bm.anchored[0][0]));
  check("Fix B: a lexically-stronger non-anchored course stays in the lexical (not anchored) group", bm.lexical.some((c) => /ZZ 1/.test(c[0])) && !bm.anchored.some((c) => /ZZ 1/.test(c[0])));
  // 51.3801 is NOT in the crosswalk fixture → anchored empty → lexical fallback
  const nurCip = rApi._score("registered nursing").ranked.find((o) => o.r.code === "51.3801").r;
  const bmFallback = rApi._bestMatches(nurCip, [["NURS 1 — Nursing", "registered nurses practice nursing and patient care", "0505.00"]]);
  check("Fix B: no anchored courses → empty anchored, lexical fallback present", bmFallback.anchored.length === 0 && bmFallback.lexical.length === 1 && /NURS 1/.test(bmFallback.lexical[0][0]));

  // ── Fix A: a crosswalk-anchored course that shares NO description vocabulary
  // (a catch-all "Cooperative Education" course on a broad TOP) is not "best matched" ──
  const bmCatchall = rApi._bestMatches(bizCip, [["COOP 1 — Cooperative Education", "independent study internship field placement hours", "0505.00"]]);
  check("Fix A: a zero-overlap catch-all course is excluded from the anchored best matches", bmCatchall.anchored.length === 0);

  // ── Fix C: a Noncredit CIP must not out-rank / be recommended over a credit one ──
  // "equivalent" hits 32.0202 (Noncredit) lexically; 27.0101 (credit) is the official.
  const mMath = rApi._recommend(["MATH 3F — Differential Equations", "A course in differential equations, equivalent to advanced study.", "1701.00"]);
  check("Fix C: the credit candidate leads over a lexically-stronger Noncredit one", mMath.cands.length >= 2 && mMath.cands[0].r.code === "27.0101");
  check("Fix C: a Noncredit CIP is never the green ✓ recommendation when a credit one exists", mMath.recommended !== "32.0202");

  // ── Crosswalk-relative confidence (Sam's "Accounting should read ~100%, not 77%") ──
  const mBizConf = rApi._recommend(RCOURSES[0]);
  check("recommend candidates carry a crosswalk-relative confidence (conf)", mBizConf.cands.length && typeof mBizConf.cands[0].conf === "number");
  check("the top candidate's conf is never below its global rel (crosswalk-relative lifts)", mBizConf.cands[0].conf >= mBizConf.cands[0].rel);
  // 52.9001 is NOT in TOP 0505.00's crosswalk but out-scores every candidate globally;
  // the crosswalk winner (52.0201) must still read high (crosswalk-relative), not be
  // dragged down by an option that isn't even valid for this TOP.
  const mOut = rApi._recommend(["OUT 1 — Managerial Analysis", "business administration and management and organization and accounting and econometrics", "0505.00"]);
  check("a clear crosswalk winner reads high conf even when the GLOBAL best is outside the crosswalk", mOut.cands[0].r.code === "52.0201" && mOut.cands[0].conf >= 85);
  check("crosswalk-relative lifts the winner above its (depressed) global rel", mOut.cands[0].conf > mOut.cands[0].rel);
  check("the outside global best surfaces in the ⚠ beyond drawer, not as a candidate", mOut.beyond.some((o) => o.r.code === "52.9001"));
  // an all-weak TOP is NOT falsely inflated: a course matching none of its candidates' vocab
  const mWeak = rApi._recommend(["ZZZ 1 — Unrelated", "quilting macrame origami calligraphy pottery", "0505.00"]);
  check("an all-weak TOP is not falsely recommended", mWeak.recommended === null);

  // ── Fix D: the boiler codes never leak into the ⚠ "outside the crosswalk" drawer ──
  const mBoiler = rApi._recommend(["WKX 1 — Workplace Intro", "Career exploration and workforce development awareness training.", "1701.00"]);
  check("Fix D: boiler codes are excluded from the outside-the-crosswalk (beyond) list", mBoiler.beyond.every((o) => o.r.code !== "32.0107" && o.r.code !== "32.0111"));

  // ── work-experience courses stay in their discipline (no outside-crosswalk nudge) ──
  // Same description as mOut (which DOES surface 52.9001 in `beyond`), but a work-
  // experience label suppresses the drawer — the units belong to the course's discipline.
  const mWE = rApi._recommend(["ACCT 200 — Accounting Work Experience", "business administration and management and organization and accounting and econometrics", "0505.00"]);
  check("work-experience courses stay in discipline — outside-crosswalk drawer suppressed", mWE.beyond.length === 0);
  const mWEcoop = rApi._recommend(["BUS 90 — Cooperative Work Experience Education", "business administration and management and organization and accounting and econometrics", "0505.00"]);
  check("cooperative work experience education is treated the same", mWEcoop.beyond.length === 0);

  // ── cross-college TOP consensus (the corroborating "how do peers code this?" signal) ──
  check("exposes the consensus seams", typeof rApi._consensus === "function" && typeof rApi._consensusKey === "function");
  check("consensusKey normalizes a course label to its bare title", rApi._consensusKey("NURS 101 — Nursing") === "nursing");
  const consN = rApi._consensus("NURS 101 — Nursing");
  check("consensus finds the modal peer TOP", consN && consN.modal.top === "1230.00" && consN.n === 5);
  check("consensus reports the honest (M use, K differ) split", consN.modal.n === 4 && consN.differ === 1);
  check("consensus carries the college breakdown for the differ hover", consN.others.length === 1 && consN.others[0].colleges.indexOf("Test College") >= 0);
  check("consensus is null for an unknown course title", rApi._consensus("XYZ 1 — Nonexistent Course Title") === null);

  // DOM: recommend mode renders + picking a course produces a recommendation card
  const domR = freshR("recommend");
  const rdoc = domR.window.document;
  check("recommend mode: the toggle shows all three modes", rdoc.querySelectorAll(".cipx-modebar .cipx-modetab").length === 3);
  check("recommend mode: the recommend tab is selected", rdoc.querySelector(".cipx-modetab.on") && /Find my course/.test(rdoc.querySelector(".cipx-modetab.on").textContent));
  check("recommend mode: shows the course-first panel, not the browse list", rdoc.querySelector(".cipx-rec .cipx-panel") && !rdoc.querySelector(".cipx-list"));
  await tick(); await tick();  // let loadCollege() resolve
  const rInput = rdoc.querySelector(".cipx-rec-combohost .cipx-cbwrap .cipx-fit-cb");
  check("recommend mode: the course combobox renders once courses load", !!rInput);
  rInput.focus();
  const rPanel = rdoc.querySelector(".cipx-rec-combohost .cipx-fit-panel");
  const rBizOpt = Array.prototype.filter.call(rPanel.querySelectorAll(".cipx-cb-opt"), (o) => /Business Basics/.test(o.textContent))[0];
  rBizOpt.dispatchEvent(new domR.window.MouseEvent("mousedown"));
  const rHost = rdoc.querySelector(".cipx-rec-host");
  check("recommend mode: picking a course shows its current TOP", rHost && /0505\.00/.test(rHost.querySelector(".cipx-rec-ctop").textContent));
  check("recommend mode: a two-signals-agree winner gets a ✓ Recommended badge", rHost && rHost.querySelector(".cipx-recbadge"));
  check("recommend mode: the winner is the highlighted recommended card", rHost && rHost.querySelector(".cipx-rec-card-rec"));
  check("recommend mode: boiler codes are collapsed behind an expander", rHost && rHost.querySelector(".cipx-boiler-btn"));
  check("recommend mode: a finder-not-decider footer is shown", rHost && /not a determination/.test(rHost.querySelector(".cipx-fitfoot").textContent));
  // switching a course to a misfiled one opens the ⚠ outside-the-crosswalk drawer
  rInput.focus();
  const nurOpt = Array.prototype.filter.call(rdoc.querySelector(".cipx-rec-combohost .cipx-fit-panel").querySelectorAll(".cipx-cb-opt"), (o) => /Nursing/.test(o.textContent))[0];
  nurOpt.dispatchEvent(new domR.window.MouseEvent("mousedown"));
  check("recommend mode: a signal-disagreement opens the outside-the-crosswalk section", rHost.querySelector(".cipx-beyond-btn") && /outside the crosswalk/.test(rHost.querySelector(".cipx-beyond-btn").textContent));
  // changing the college IN recommend mode must rebuild the course-first view —
  // NOT call the browse render() (which throws on the absent countHost).
  let recSelThrew = false;
  try {
    const csel = rdoc.querySelector(".cipx-college-sel");
    csel.value = ""; csel.dispatchEvent(new domR.window.Event("change"));
    csel.value = "test_college"; csel.dispatchEvent(new domR.window.Event("change"));
    await tick(); await tick();
  } catch (e) { recSelThrew = true; console.error(e); }
  check("recommend mode: changing the college rebuilds without throwing", !recSelThrew && rdoc.querySelector(".cipx-rec-combohost"));

  // recommend mode surfaces the peer-consensus block too (extended from review mode). A fresh
  // instance WITH the consensus fixture, so the block renders on pick.
  const domRC = freshR("recommend");
  domRC.window.CPL_CIP_CROSSWALK._setConsensus(RCONSENSUS);
  const rcdoc = domRC.window.document;
  await tick(); await tick();
  const rcInput = rcdoc.querySelector(".cipx-rec-combohost .cipx-cbwrap .cipx-fit-cb");
  rcInput.focus();
  const rcNur = Array.prototype.filter.call(rcdoc.querySelector(".cipx-rec-combohost .cipx-fit-panel").querySelectorAll(".cipx-cb-opt"), (o) => /Nursing/.test(o.textContent))[0];
  rcNur.dispatchEvent(new domRC.window.MouseEvent("mousedown"));
  const rcHost = rcdoc.querySelector(".cipx-rec-host");
  check("recommend mode: shows the peer-consensus block for a course", rcHost && rcHost.querySelector(".cipx-rev-peer") && /how peers code/i.test(rcHost.querySelector(".cipx-rev-peer").textContent));
  check("recommend mode: the consensus block names the peer field's CIP", rcHost && /51\.3801/.test(rcHost.querySelector(".cipx-rev-peer").textContent));

  // ── Part B3 — "Review my catalog" (Phase 2 whole-catalog triage) ──
  check("cip_crosswalk.js has the review-catalog mode", /Review my catalog/.test(src) && /cipx-rev-list/.test(src));
  check("exposes the review seams", typeof rApi._reviewRows === "function" && typeof rApi._parseSubject === "function");
  check("parseSubject strips the course number to the department", rApi._parseSubject("BUS 101 — Business Basics") === "BUS" && rApi._parseSubject("NC ES140 — Esthetician I") === "NC");
  const revRows = rApi._reviewRows(RCOURSES);
  check("review classifies a two-signals-agree course as ready/clear", revRows.find((r) => /Business Basics/.test(r.label)).status === "clear");
  check("review row carries the suggested CIP + parsed subject", (function () { var r = revRows.find((x) => /Business Basics/.test(x.label)); return r.sug && r.sug.code === "52.0201" && r.subj === "BUS"; })());
  check("review flags a no-crosswalk course as manual", revRows.find((r) => /Orphan/.test(r.label)).status === "manual");

  // ── consensus PRE-FILL + the SUGGESTED-CHANGE two-box (Sam's points 1, 2, 6) ──
  // NURS 101 is coded under a business TOP (0505.00), but 4 of 5 peer colleges teaching
  // "Nursing" code it under a Registered Nursing TOP → the peer field points at a DIFFERENT
  // code (51.3801) than the crosswalk-from-TOP pick (52.0201). That's a "Suggested change":
  // both codes are kept + the row is surfaced for a glance, not silently marked Ready.
  const revNurse = revRows.find((r) => /Nursing/.test(r.label));
  check("consensus outlier → 'Suggested change' (peers point elsewhere than the TOP)", revNurse.status === "suggest" && revNurse.suggestChange === true);
  check("suggested-change row keeps BOTH codes: crosswalk-from-TOP + the peer code", revNurse.crosswalk && /^52\./.test(revNurse.crosswalk.code) && revNurse.crosswalk.code !== "51.3801" && revNurse.sug && revNurse.sug.code === "51.3801");
  check("the suggested CIP is the peer-consensus code (not the crosswalk pick)", revNurse.sug.code === "51.3801" && revNurse.sugKind === "consensus");
  check("the row carries the consensus provenance + outlier flag", !!revNurse.cons && revNurse.cons.outlier === true);
  // a WEAK / split consensus (no clear majority of peers) must NOT pre-fill — falls back to
  // the crosswalk. Fresh instance so we don't disturb rApi's fixture: modal is 3 of 7 (43%).
  const wApi = freshR().window.CPL_CIP_CROSSWALK;
  wApi._setConsensus({ colleges: ["A", "B", "C", "D", "E", "F", "G"], titles: { "business basics": { n: 7, t: [["1230.00", [0, 1, 2]], ["0505.00", [3, 4]], ["1701.00", [5, 6]]] } } });
  const wRow = wApi._reviewRows([RCOURSES[0]])[0];
  check("weak consensus (no majority) does not pre-fill — falls back to the crosswalk", wRow.status === "clear" && wRow.sug.code === "52.0201" && wRow.sugKind === "crosswalk");

  // ── SUBJECT-SCOPED consensus (Sam's BIO 35 "Health Science" catch) ──
  // The same title can be a HEALTH course at most colleges and a BIOLOGY course at a few. A
  // title-only consensus lets the health majority override a biology college's coding. Scoping
  // to same-discipline peers fixes it: a BIO course is compared only against other BIO/BIOL peers.
  const sApi = freshR().window.CPL_CIP_CROSSWALK;
  sApi._setConsensus({
    colleges: ["H1", "H2", "H3", "H4", "B1", "B2", "B3"], subjects: ["HED", "BIOL"],
    titles: { "health science": { n: 7, t: [["1230.00", [0, 1, 2, 3], [0, 0, 0, 0]], ["0505.00", [4, 5, 6], [1, 1, 1]]] } },
  });
  const csFull = sApi._consensus("HED 1 — Health Science");
  check("subject-scoping: unscoped consensus pools all departments (modal = the health-dept TOP)", csFull && csFull.modal.top === "1230.00" && csFull.n === 7 && !csFull.scoped);
  const csBio = sApi._consensus("BIO 1 — Health Science", "BIO");
  check("subject-scoping: scoped to BIO peers, the modal is the Biology TOP (health depts excluded)", csBio && csBio.modal.top === "0505.00" && csBio.n === 3 && csBio.scoped === true);
  const csHed = sApi._consensus("HED 1 — Health Science", "HED");
  check("subject-scoping: scoped to HED peers, the modal is the Health TOP", csHed && csHed.modal.top === "1230.00" && csHed.n === 4 && csHed.scoped === true);
  check("subjMatch folds BIO/BIOL/BIOSC but keeps unrelated codes apart", sApi._subjMatch("BIO", "BIOL") && sApi._subjMatch("BIO", "BIOSC") && sApi._subjMatch("BIOL", "BIO") && !sApi._subjMatch("BIO", "HED") && !sApi._subjMatch("BIO", "BUS"));
  // too few same-subject peers → fall back to the full-title consensus (never a scoped consensus of 1)
  const csThin = sApi._consensus("ZOO 1 — Health Science", "ZOO");
  check("subject-scoping: too few same-subject peers → falls back to the full-title consensus", csThin && csThin.scoped === false && csThin.n === 7);
  // legacy consensus data (no subjects[]) still works — scoping simply never engages
  check("subject-scoping: legacy data without subjects[] degrades to the full consensus", (function () { var c = rApi._consensus("NURS 101 — Nursing", "NURS"); return c && c.scoped === false && c.modal.top === "1230.00"; })());

  const domRev = freshR("review");
  domRev.window.CPL_CIP_CROSSWALK._setConsensus(RCONSENSUS);   // peer-consensus fixture (fetch is a no-op in jsdom)
  const revdoc = domRev.window.document;
  check("review mode: three tabs, review selected", revdoc.querySelectorAll(".cipx-modebar .cipx-modetab").length === 3 && /Review my catalog/.test(revdoc.querySelector(".cipx-modetab.on").textContent));
  check("mode tabs use hairline SVG glyphs, not cliparty emoji", revdoc.querySelectorAll(".cipx-modetab .cipx-tabico").length === 3 && !/📖|🎯|📋/.test(revdoc.querySelector(".cipx-modebar").textContent));
  check("review mode: shows the trust banner", revdoc.querySelector(".cipx-rev-banner") && /starting point you confirm/.test(revdoc.querySelector(".cipx-rev-banner").textContent));
  await tick(); await tick();  // dept picker populates from loadCollege
  const deptSel = revdoc.querySelector(".cipx-rev-deptsel");
  check("review mode: department picker populates from the catalog", deptSel && Array.prototype.some.call(deptSel.options, (o) => o.value === "BUS"));
  check("review mode: the Department picker sits up in the college bar (beside college)", !!revdoc.querySelector(".cipx-collegebar .cipx-rev-deptsel"));
  deptSel.value = "BUS"; deptSel.dispatchEvent(new domRev.window.Event("change"));
  await tick(); await tick();
  check("review mode: selecting a department renders triage tiles", !!revdoc.querySelector(".cipx-rev-tiles .cipx-rev-tile"));
  const revRow = revdoc.querySelector(".cipx-rev-list .cipx-rev-item");
  check("review mode: renders a course row with a suggested CIP chip", revRow && revRow.querySelector(".cipx-rev-chip .cipx-code"));
  revRow.querySelector(".cipx-rev-row").click();
  await tick();
  const cand = revRow.querySelector(".cipx-rev-cand");
  check("review mode: a row expands to selectable candidate codes", !!cand);
  check("crosswalk candidates carry a 'from TOP' tag so the lineage is apparent", cand.querySelector(".cipx-rev-candtop") && /0505\.00/.test(cand.querySelector(".cipx-rev-candtop").textContent));
  cand.click();
  await tick();
  check("review mode: picking a candidate persists the decision (localStorage, as an array)", (function () { try { var v = JSON.parse(domRev.window.localStorage.getItem("cipx_rev_test_college") || "{}")["BUS 101 — Business Basics"]; return Array.isArray(v) && v.indexOf("52.0201") >= 0; } catch (e) { return false; } })());
  // multi-CIP: a course can carry more than one code; toggling a second adds it, toggling again removes it
  const bus2 = revRow.querySelectorAll(".cipx-rev-cand")[1];
  if (bus2) { bus2.click(); await tick(); }
  check("review mode: a course can carry more than one CIP (multi-select)", (function () { try { var v = JSON.parse(domRev.window.localStorage.getItem("cipx_rev_test_college") || "{}")["BUS 101 — Business Basics"]; return Array.isArray(v) && v.length >= 2; } catch (e) { return false; } })());
  if (bus2) { bus2.click(); await tick(); }
  check("review mode: toggling a picked CIP off removes it", (function () { try { var v = JSON.parse(domRev.window.localStorage.getItem("cipx_rev_test_college") || "{}")["BUS 101 — Business Basics"]; return Array.isArray(v) && v.length === 1; } catch (e) { return false; } })());
  check("review row shows the TOP → CIP transition (current TOP beside the CIP box)", revRow.querySelector(".cipx-rev-tocip .cipx-rev-fromtop") && /0505\.00/.test(revRow.querySelector(".cipx-rev-tocip .cipx-rev-fromtop").textContent) && !!revRow.querySelector(".cipx-rev-tocip .cipx-rev-gbox .cipx-rev-chip"));
  // a stronger match OUTSIDE the crosswalk is a selectable candidate (assignable)
  deptSel.value = "NURS"; deptSel.dispatchEvent(new domRev.window.Event("change"));
  await tick(); await tick();
  const nurItem = revdoc.querySelector(".cipx-rev-list .cipx-rev-item");
  // NURS is a SUGGESTED-CHANGE row: two aligned CIP boxes (Sam's point 1) — the crosswalk-from-TOP
  // pick (52.0201, muted "was") and the peer-suggested code (51.3801, emphasized) — a calm "?"
  // glyph (point 3), and the detail EXPANDED by default (point 6).
  check("suggested-change row shows TWO aligned CIP boxes", !!nurItem.querySelector(".cipx-rev-2box") && !!nurItem.querySelector(".cipx-rev-chip-was .cipx-code") && !!nurItem.querySelector(".cipx-rev-chip-rec .cipx-code"));
  check("box A = the crosswalk-from-TOP code (a business 52.* code, muted 'was'), distinct from the peer code", (function () { var w = nurItem.querySelector(".cipx-rev-chip-was"); return w && /52\.\d{4}/.test(w.textContent) && !/51\.3801/.test(w.textContent); })());
  check("box B = the peer-suggested code (emphasized 'rec')", /51\.3801/.test(nurItem.querySelector(".cipx-rev-chip-rec").textContent));
  check("the peer line reports the agreement metric (4 of 5)", (function () { var l = nurItem.querySelector(".cipx-rev-reclabel"); return l && /4 of 5/.test(l.textContent); })());
  check("the status glyph is a calm '?' (not the old ⚠⚑)", (function () { var s = nurItem.querySelector(".cipx-rev-stat-suggest"); return s && /\?/.test(s.textContent) && !/⚑|⚠/.test(nurItem.querySelector(".cipx-rev-row").textContent); })());
  check("suggested-change rows land in the '? Suggested' triage bucket", (function () { var t = Array.prototype.filter.call(revdoc.querySelectorAll(".cipx-rev-tile"), (x) => /Suggested/.test(x.textContent))[0]; return t && /1/.test(t.querySelector(".cipx-rev-tilen").textContent); })());
  check("progress line reports the peer-corroborated count", (function () { var p = revdoc.querySelector(".cipx-rev-peercount"); return p && /1 peer-corroborated/.test(p.textContent); })());
  // default-expanded (point 6): the detail is already open — no click needed
  const outCand = nurItem.querySelector(".cipx-rev-cand-out");
  check("suggested-change row is EXPANDED by default (detail + outside-crosswalk candidate visible)", !!nurItem.querySelector(".cipx-rev-detail") && !!outCand);
  // peer-consensus block (before we click anything that re-renders)
  const peer = nurItem.querySelector(".cipx-rev-peer");
  check("peer-consensus block renders how other colleges code this course", !!peer && /how peers code/i.test(peer.textContent));
  check("peer block shows the honest (M use, K differ) strength metric", peer && /\(4 use, 1 differ\)/.test(peer.textContent));
  check("peer differ-metric hover lists the differing colleges", (function () { var m = peer && peer.querySelector(".cipx-rev-peermetric"); return m && /Test College/.test(m.getAttribute("title") || ""); })());
  const peerCand = nurItem.querySelector(".cipx-rev-cand-peer");
  check("peer block offers the consensus CIP as a selectable candidate", !!peerCand && /51\.3801/.test(peerCand.textContent));
  check("candidate rows use a Select button, not a checkbox (Sam's point 4)", !!peerCand.querySelector(".cipx-rev-selbtn") && !nurItem.querySelector(".cipx-rev-check"));
  outCand.click();
  await tick();
  check("review mode: assigning an outside-crosswalk code persists it", (function () { try { var v = JSON.parse(domRev.window.localStorage.getItem("cipx_rev_test_college") || "{}")["NURS 101 — Nursing"]; return Array.isArray(v) && v.indexOf("51.3801") >= 0; } catch (e) { return false; } })());

  // ── new Review UI affordances on a FRESH, unmutated instance (Sam's points 1, 4, 5, 6) ──
  const domU = freshR("review");
  domU.window.CPL_CIP_CROSSWALK._setConsensus(RCONSENSUS);
  const udoc = domU.window.document;
  await tick(); await tick();
  const uSel = udoc.querySelector(".cipx-rev-deptsel");
  uSel.value = "__all__"; uSel.dispatchEvent(new domU.window.Event("change"));
  await tick(); await tick();
  const xall = udoc.querySelector(".cipx-rev-utils .cipx-rev-expand");
  check("Expand-all control is present (point 6)", !!xall && /Expand all|Collapse all/.test(xall.textContent));
  check("suggested-change rows are expanded by default, others collapsed", udoc.querySelectorAll(".cipx-rev-detail").length >= 1 && udoc.querySelectorAll(".cipx-rev-detail").length < udoc.querySelectorAll(".cipx-rev-item").length);
  xall.click(); await tick();
  check("Expand all opens every row", udoc.querySelectorAll(".cipx-rev-detail").length === udoc.querySelectorAll(".cipx-rev-item").length);
  const uNur = Array.prototype.filter.call(udoc.querySelectorAll(".cipx-rev-item"), (it) => /Nursing/.test(it.textContent))[0];
  const uChg = uNur.querySelector(".cipx-rev-chip-rec .cipx-rev-chipchg");
  check("the CIP box carries a ▾ 'change to any code' affordance (point 5)", !!uChg);
  uChg.click(); await tick();
  check("clicking ▾ opens a change-to-any-code dropdown", !!uNur.querySelector(".cipx-rev-chgpanel .cipx-cbwrap"));
  uNur.querySelector(".cipx-rev-chip-rec").click(); await tick();
  check("clicking the emphasized peer box uses that code (one-click accept — point 1)", (function () { try { var v = JSON.parse(domU.window.localStorage.getItem("cipx_rev_test_college") || "{}")["NURS 101 — Nursing"]; return Array.isArray(v) && v.indexOf("51.3801") >= 0; } catch (e) { return false; } })());

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

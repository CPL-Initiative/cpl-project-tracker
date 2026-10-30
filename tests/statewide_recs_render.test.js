// Fact Sheet "consumer wedge" — statewide_recs_render.js.
//
// Guards: (a) under a matching exhibit <li> a collapsible "N statewide credit
// recs" wedge appears with course title / units / C-ID; (b) recs are de-duped;
// (c) a non-matching <li> is left alone; (d) the toggle shows/hides the list;
// (e) re-running is idempotent (no double-append); (f) all text is escaped;
// (g) unit pluralization; (h) a rec carrying a MAP exhibit ID gets a Request
// Quick Adopt link from map_links.js's one URL builder (Sam, 2026-10-30), a rec
// without one gets none, and the renderer holds no copy of the MAP address.
//
// Run from repo root: `npm test` (or `node tests/statewide_recs_render.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const HTML = fs.readFileSync("fact-sheet/index.html", "utf8");
const SRC = fs.readFileSync("fact-sheet/statewide_recs_render.js", "utf8");
const MAPLINKS = fs.readFileSync("map_links.js", "utf8");

// A real exhibit present in #statewide-exhibits (CIS sector) → keyed recs (with a
// deliberate duplicate to exercise de-dupe). "CompTIA A+" is also a real <li> but
// is intentionally absent from the map → must get no wedge.
const RECS = {
  "Cisco Certified Network Associate (CCNA)": [
    { t: "Computer Network Fundamentals", u: "3", cid: "ITIS 150" },
    { t: "Network Fundamentals (Network+)", u: "4", cid: "" },
    { t: "Computer Network Fundamentals", u: "3", cid: "ITIS 150" } // dup → dropped
  ],
  "CompTIA Server+": [
    { t: "Systems and Network Administration", u: "1", cid: "ITIS 155" }
  ]
};

function load(recs, opts) {
  opts = opts || {};
  const dom = new JSDOM(HTML, { runScripts: "outside-only",
    url: "https://cpl-initiative.github.io/cpl-project-tracker/fact-sheet/" });
  const w = dom.window;
  if (opts.mapLinks) w.eval(MAPLINKS);
  w.CPL_STATEWIDE_RECS = recs; // set BEFORE eval so the module's auto-render sees it
  w.eval(SRC);
  // jsdom's readyState can be "loading" at eval time (deferring the auto-render to
  // a DOMContentLoaded that fires after this synchronous test) — render explicitly.
  if (w.CPL_STATEWIDE_RECS_RENDER) w.CPL_STATEWIDE_RECS_RENDER.render();
  return { w: w, API: w.CPL_STATEWIDE_RECS_RENDER };
}

function liByText(w, text) {
  const lis = w.document.querySelectorAll("#statewide-exhibits ul.sw-list > li");
  return Array.prototype.find.call(lis, function (li) {
    // The li now may contain the wedge span; match on the leading text node.
    return (li.childNodes[0] && li.childNodes[0].textContent.trim()) === text;
  });
}

(function () {
  const { w, API } = load(RECS);

  // ── (a) matching exhibit gets a wedge ──
  const ccna = liByText(w, "Cisco Certified Network Associate (CCNA)");
  check("CCNA <li> exists in the rendered HTML", !!ccna);
  const wedge = ccna && ccna.querySelector(".sw-rec");
  check("matching exhibit gets a .sw-rec wedge", !!wedge);
  const btn = wedge && wedge.querySelector(".sw-rec-tg");
  check("wedge toggle reads the DE-DUPED count (3 recs → 2)",
    btn && /\b2 statewide credit recs\b/.test(btn.textContent));
  const list = wedge && wedge.querySelector(".sw-rec-list");
  check("rec list starts collapsed (hidden)", list && list.hasAttribute("hidden"));
  check("rec list has 2 items after de-dupe", list && list.querySelectorAll("li").length === 2);
  const listHtml = list ? list.innerHTML : "";
  check("a C-ID badge is shown", /sw-rec-cid">ITIS 150</.test(listHtml));
  check("course title is shown", /Computer Network Fundamentals/.test(listHtml));
  check("units shown + pluralized", /3 units/.test(listHtml));
  check("a rec with no C-ID still renders its title", /Network Fundamentals \(Network\+\)/.test(listHtml));

  // ── (g) singular unit ──
  const srv = liByText(w, "CompTIA Server+");
  const srvList = srv && srv.querySelector(".sw-rec-list");
  check("'1' renders as '1 unit' (singular)", srvList && /1 unit\b/.test(srvList.innerHTML) && !/1 units/.test(srvList.innerHTML));

  // ── (c) non-matching exhibit untouched ──
  const aplus = liByText(w, "CompTIA A+");
  check("CompTIA A+ <li> exists", !!aplus);
  check("an exhibit with NO statewide rec gets no wedge", aplus && !aplus.querySelector(".sw-rec"));

  // ── (d) toggle ──
  if (btn && list) {
    btn.dispatchEvent(new w.Event("click"));
    check("clicking the toggle expands the list", btn.getAttribute("aria-expanded") === "true" && !list.hasAttribute("hidden"));
    btn.dispatchEvent(new w.Event("click"));
    check("clicking again collapses it", btn.getAttribute("aria-expanded") === "false" && list.hasAttribute("hidden"));
  } else { check("toggle present", false); }

  // ── (e) idempotent ──
  API.render(); API.render();
  check("re-render does not double-append the wedge", ccna.querySelectorAll(".sw-rec").length === 1);

  // ── (f) escaping + helpers ──
  check("esc neutralizes HTML", API._esc('<img src=x onerror=1>') === "&lt;img src=x onerror=1&gt;");
  check("dedupe collapses identical (t,u,cid)",
    API._dedupe([{ t: "X", u: "3", cid: "A 1" }, { t: "X", u: "3", cid: "A 1" }]).length === 1);
  check("dedupe keeps differing units", API._dedupe([{ t: "X", u: "3", cid: "" }, { t: "X", u: "4", cid: "" }]).length === 2);
  check("unitLabel singular/plural", API._unitLabel("1") === "1 unit" && API._unitLabel("4") === "4 units");
  // The builder's span (Sam, 2026-09-27: units never split an identity) reads as a range.
  check("unitLabel prints the builder's span as a range", API._unitLabel("6\u20137") === "6\u20137 units"
    && API._unitLabel("0.5\u20131") === "0.5\u20131 units");
  check("buildIndex drops empty rec arrays + lowercases keys",
    Object.keys(API._buildIndex({ "Foo": [], "Bar": [{ t: "t", u: "3", cid: "" }] })).join() === "bar");

  // ── escaping in a rendered rec (malicious title/cid) ──
  {
    const { w: w2 } = load({
      "Cisco Certified Network Associate (CCNA)": [{ t: '<b>x</b>', u: "3", cid: '"><img>' }]
    });
    const li2 = liByText(w2, "Cisco Certified Network Associate (CCNA)");
    const inner = li2.querySelector(".sw-rec-list").innerHTML;
    check("a malicious rec title is escaped (no raw <b>)", /&lt;b&gt;x&lt;\/b&gt;/.test(inner) && !/<b>x<\/b>/.test(inner));
    check("a malicious C-ID is escaped (no raw <img>)", !/<img>/.test(inner));
  }

  // ── (h) Request Quick Adopt ──
  {
    const ID = "MAPICI-CCNA-1-001";
    const R = { "Cisco Certified Network Associate (CCNA)": [
      { t: "Computer Network Fundamentals", u: "3", cid: "ITIS 150", id: ID },
      { t: "Network Fundamentals (Network+)", u: "4", cid: "" },
    ] };
    const { w: w3 } = load(R, { mapLinks: true });
    const li3 = liByText(w3, "Cisco Certified Network Associate (CCNA)");
    const links = li3 ? li3.querySelectorAll(".sw-rec-list a.sw-rec-adopt") : [];
    check("a rec with a MAP exhibit ID gets one Request Quick Adopt link", links.length === 1);
    const a = links[0];
    check("the link opens MAP's card for that exhibit, from map_links.js",
      a && a.getAttribute("href") === w3.CPL_MAP_LINKS.url(ID) &&
      a.getAttribute("href") === "https://cpldashboardcccco.azurewebsites.net/insights/exhibit-courses?Exhibit=" + ID + "&View=Non-Military");
    check("the link reads Request Quick Adopt", a && a.childNodes[0].textContent === "Request Quick Adopt");
    check("its screen-reader text names the course and the exhibit",
      a && /for Computer Network Fundamentals in MAP, exhibit MAPICI-CCNA-1-001 \(opens in a new tab\)/.test(a.textContent));
    check("the link opens a new tab with rel=noopener", a && a.target === "_blank" && /noopener/.test(a.rel));
    check("the screen-reader span sits inside a positioned link", /\.sw-rec-adopt\{position:relative/.test(SRC));
    check("the link is hidden in print", /@media print\{.*\.sw-rec-adopt\{display:none/.test(SRC));
    check("the renderer holds no copy of the MAP address", !/azurewebsites|exhibit-courses|View=Non-Military/.test(SRC));
    const { w: w4 } = load(R);
    const li4 = liByText(w4, "Cisco Certified Network Associate (CCNA)");
    check("without map_links.js, no link", li4 && !li4.querySelector(".sw-rec-adopt"));
    check("the page loads map_links.js before the renderer",
      HTML.indexOf('src="../map_links.js"') !== -1 && HTML.indexOf('src="../map_links.js"') < HTML.indexOf('src="./statewide_recs_render.js"'));
    check("the lede says Request Quick Adopt needs no sign-in",
      /Request Quick\s+Adopt<\/strong> opens its exhibit in MAP, where you can ask a college initiator to adopt it without signing in/.test(HTML));
    const { w: w5 } = load({ "Cisco Certified Network Associate (CCNA)": [{ t: "x", u: "3", cid: "", id: '"><b>z</b>' }] },
      { mapLinks: true });
    const a5 = liByText(w5, "Cisco Certified Network Associate (CCNA)").querySelector(".sw-rec-adopt");
    check("a hostile id stays inside the href", a5 && !a5.parentNode.querySelector("b") &&
      a5.getAttribute("href").indexOf("Exhibit=%22%3E%3Cb%3Ez%3C%2Fb%3E") !== -1);
  }

  // ── (i) each program area's list comes from the catalog: only exhibits with a recommendation (Sam, 2026-10-30) ──
  {
    const CAT = { sectors: [
      { sector: "Construction Technology", items: [
        { title: "Building Plans Examiner", lines: [{ t: "International Building Code I Structural", u: "3", cid: "" }] },
        { title: "Carpenters Apprenticeship — Acoustical Installer", lines: [{ t: "Acoustical Ceilings", u: "1", cid: "" }] },
        { title: "Mechanical Plans Examiner", lines: [] },
      ] },
    ] };
    const RR = { "Building Plans Examiner": [{ t: "International Building Code I Structural", u: "3", cid: "" }],
      "Carpenters Apprenticeship — Acoustical Installer": [{ t: "Acoustical Ceilings", u: "1", cid: "" }] };
    const { w: w6, API: A6 } = load(RR);
    const det = w6.document.querySelector('#statewide-exhibits details[data-sector="Construction Technology"]');
    const other = w6.document.querySelector('#statewide-exhibits details[data-sector]:not([data-sector="Construction Technology"])');
    const otherBefore = other.querySelector("ul.sw-list").innerHTML;
    check("applyCatalog rebuilds the areas the catalog carries", A6.applyCatalog(CAT) === 1);
    A6.render();
    const titles = Array.prototype.map.call(det.querySelectorAll("ul.sw-list > li"), (li) => li.childNodes[0].textContent.trim());
    check("the area lists only exhibits that carry a recommendation, under MAP's titles",
      titles.join("|") === "Building Plans Examiner|Carpenters Apprenticeship — Acoustical Installer");
    check("an exhibit with no recommendation leaves the list", titles.indexOf("Mechanical Plans Examiner") === -1 &&
      titles.indexOf("Acoustical Installer Apprenticeship") === -1);
    check("every listed exhibit gets its recommendations", det.querySelectorAll("ul.sw-list > li .sw-rec").length === 2);
    check("the area's Exhibits figure follows its list", det.querySelector('summary .sw-col[data-col="ex"]').textContent === "2" &&
      det.getAttribute("data-listed") === "2");
    check("an area the catalog omits keeps its list", other.querySelector("ul.sw-list").innerHTML === otherBefore);
    const tcol = w6.document.querySelector('#statewide-exhibits .sw-total .sw-col[data-tcol="ex"]');
    const expect = Array.prototype.reduce.call(w6.document.querySelectorAll("#statewide-exhibits ul.sw-list"), (n, ul) => n + ul.children.length, 0);
    check("the total row counts the lists shown", tcol && Number(tcol.textContent.replace(/,/g, "")) === expect);
    check("a missing or empty catalog changes nothing", A6.applyCatalog(null) === 0 && A6.applyCatalog({ sectors: [] }) === 0);
    const FS = fs.readFileSync("fact-sheet/factsheet.js", "utf8");
    check("the live snapshot leaves a drawn list's count alone",
      /if \(!dets\[j\]\.hasAttribute\('data-listed'\)\) setCol\(dets\[j\], 'ex'/.test(FS) && /if \(!tot\.hasAttribute\('data-listed'\)\) setTCol\(tot, 'ex'/.test(FS));
    check("the renderer reads the daily catalog beside the page", /fetch\('\.\/statewide_catalog\.json'\)/.test(SRC));
    const real = JSON.parse(fs.readFileSync("fact-sheet/statewide_catalog.json", "utf8"));
    const { w: w7, API: A7 } = load({});
    A7.applyCatalog(real);
    const shown = w7.document.querySelectorAll("#statewide-exhibits ul.sw-list > li").length;
    const withLines = real.sectors.reduce((n, s) => n + s.items.filter((i) => (i.lines || []).length).length, 0);
    check("on today's catalog the lists show every exhibit with a recommendation, and no other", shown === withLines && shown < real.exhibits,
      shown + " of " + real.exhibits);
  }

  let failed = 0;
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); if (!r[1]) failed++; });
  console.log("\n" + (failed ? failed + " FAILED" : "All " + results.length + " checks passed"));
  process.exit(failed ? 1 : 0);
})();

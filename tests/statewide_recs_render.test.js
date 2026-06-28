// Fact Sheet "consumer wedge" — statewide_recs_render.js.
//
// Guards: (a) under a matching exhibit <li> a collapsible "N statewide credit
// recs" wedge appears with course title / units / C-ID; (b) recs are de-duped;
// (c) a non-matching <li> is left alone; (d) the toggle shows/hides the list;
// (e) re-running is idempotent (no double-append); (f) all text is escaped;
// (g) unit pluralization.
//
// Run from repo root: `npm test` (or `node tests/statewide_recs_render.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const HTML = fs.readFileSync("fact-sheet/index.html", "utf8");
const SRC = fs.readFileSync("fact-sheet/statewide_recs_render.js", "utf8");

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

function load(recs) {
  const dom = new JSDOM(HTML, { runScripts: "outside-only",
    url: "https://cpl-initiative.github.io/cpl-project-tracker/fact-sheet/" });
  const w = dom.window;
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

  let failed = 0;
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); if (!r[1]) failed++; });
  console.log("\n" + (failed ? failed + " FAILED" : "All " + results.length + " checks passed"));
  process.exit(failed ? 1 : 0);
})();

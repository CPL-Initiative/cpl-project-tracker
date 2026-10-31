// The public adoption page (library/adopt/; Sam, Open Asks Sheet 147, 2026-10-31).
//
// Guards what can go wrong on the page itself (the builder's file is guarded by
// tests/adopt_page_build_test.py):
//   - a college pick opens on what the college has not adopted, and "Adopted here" and "Every
//     credential" read the same scope; the college filters (District, SW Region, ASCCC Area) scope
//     the same way, and a content filter (Field, CPL type, Search) never drops a matrix column;
//   - the college's own course comes first, then the most colleges;
//   - a college is never offered a Request Quick Adopt chip for its own exhibit;
//   - every MAP link is Request Quick Adopt's address with View=Non-Military (map_links.js);
//   - the CSV quotes what needs quoting and marks a could-adopt cell C;
//   - Create Handout opens the college's CPL opportunity visual;
//   - the page remembers no filter (Sam, 2026-10-21): no storage write but the theme's;
//   - Malone's look: the Library's tokens, Light unless the reader picks Dark, noindex until linked;
//   - a failed read says so and paints no list.
// Run from repo root: `npm test` (or `node tests/public_adopt.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const PAGE = fs.readFileSync("library/adopt/index.html", "utf8");
const JS = fs.readFileSync("library/adopt/adopt.js", "utf8");
const MAPLINKS = fs.readFileSync("map_links.js", "utf8");

const DATA = {
  written_at: "2026-10-31T12:00:00Z",
  counts: { settled: 3, held: 1, in_reference: 4 },
  colleges: [
    ["Alpha College", "Alpha", "Alpha CCD", "Bay Area (Region 3)", "B"],
    ["Beta College", "Beta", "Beta CCD", "Inland Empire/Desert (Region 9)", "D"],
    ["Gamma College", "Gamma", "Alpha CCD", "Bay Area (Region 3)", "B"],
  ],
  sectors: { "11": "Computer Sciences", "51": "Health" },
  types: ["Credit By Exam", "Industry Certification"],
  credentials: [
    { t: "CompTIA Security+", i: "CompTIA", y: [1], s: "11", p: 3,
      a: [[1, 3, "CIS 75: 3 hours, in \"Security\""], [2, 3, "CNT 69: 3 hours"]], c: [[0, "CIS 9"]],
      m: [["MAP-B", 1, ""], ["MAP-G", 2, ""]] },
    { t: "EMT", i: "NREMT", y: [1], s: "51", p: 4, a: [[0, 4, "EMS 1: 4 hours"], [1, 4, "EMS 2: 4 hours"], [2, 4, "EMS 3"]],
      m: [["MAP-A", 0, ""]] },
    { t: "AP Biology", i: "College Board", y: [0], s: "11", p: 4, a: [[1, 4, "BIO 1"]], m: [["MAP-X", -1, "Delta University"]] },
  ],
};

function load(query, opts) {
  opts = opts || {};
  const writes = [];
  const dom = new JSDOM(PAGE, {
    url: "https://cpl-initiative.github.io/cpl-project-tracker/library/adopt/" + (query || ""),
    runScripts: "outside-only", pretendToBeVisual: true,
  });
  const w = dom.window;
  const real = w.localStorage;
  w.Storage.prototype._set = w.Storage.prototype.setItem;
  w.Storage.prototype.setItem = function (k, v) { writes.push(k); return this._set(k, v); };
  w.fetch = function () {
    if (opts.fail) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, json: () => Promise.resolve(JSON.parse(JSON.stringify(DATA))) });
  };
  w.requestAnimationFrame = (f) => setTimeout(f, 0);
  w.eval(JS);
  return new Promise((res) => setTimeout(() => res({ w, d: w.document, writes, real }), 30));
}

function change(d, id, v) {
  const el = d.getElementById(id);
  el.value = v;
  el.dispatchEvent(new d.defaultView.Event("change"));
}
function titles(d) { return Array.from(d.querySelectorAll("#ad-list .cred h3")).map((h) => h.textContent); }

(async function () {
  // The pure parts.
  const A = (await load()).w.CPL_ADOPT;
  check("no college filter: every credential, no scope", A.scope(DATA, { college: "" }) === null && A.rows(DATA, { q: "", show: "all" }).length === 3);
  const open = A.rows(DATA, { college: "Alpha College", show: "open", q: "" }).map((c) => c.t);
  check("open: what the college has not adopted, its own course first", JSON.stringify(open) === JSON.stringify(["CompTIA Security+", "AP Biology"]));
  check("here: what the college adopted", A.rows(DATA, { college: "Alpha College", show: "here", q: "" }).map((c) => c.t).join() === "EMT");
  check("district scopes two colleges", Object.keys(A.scope(DATA, { district: "Alpha CCD" })).join() === "0,2");
  check("a district's open list drops what any of its colleges adopted",
    A.rows(DATA, { district: "Alpha CCD", show: "open", q: "" }).map((c) => c.t).join() === "AP Biology");
  check("Area scopes like SW Region", Object.keys(A.scope(DATA, { area: "D" })).join() === "1");
  check("a content filter never drops a matrix column", A.cols(DATA, { sector: "51", type: "0", q: "zz" }).length === 3);
  check("search reads title and issuer, every word", A.rows(DATA, { q: "nremt emt", show: "all" }).length === 1);
  check("CPL type filters by index", A.rows(DATA, { type: "0", show: "all", q: "" }).map((c) => c.t).join() === "AP Biology");
  check("MAP link is Request Quick Adopt's, Non-Military card",
    A.mapUrl("MAP-B") === "https://cpldashboardcccco.azurewebsites.net/insights/exhibit-courses?Exhibit=MAP-B&View=Non-Military");
  const page = /var MAP_PAGE = "([^"]+)"/.exec(MAPLINKS);
  check("the MAP page matches map_links.js", page && A.mapUrl("X").indexOf(page[1] + "?Exhibit=") === 0);
  const odd = [Object.assign({}, DATA.credentials[2], { t: 'Spanish, "Level 2"' })];
  check("list CSV quotes a cell with a quote or comma", A.csvList(DATA, odd).split("\r\n")[1].indexOf('"Spanish, ""Level 2"""') === 0);
  const mx = A.csvMatrix(DATA, DATA.credentials, [0, 1, 2]).split("\r\n");
  check("matrix CSV: units, and C where the college teaches a matching course", mx[1] === "CompTIA Security+,C,3,3");

  // The page.
  const one = await load("?college=Alpha%20College");
  let d = one.d;
  check("?college= opens on that college", d.getElementById("ad-college").value === "Alpha College");
  check("a college pick opens on Not adopted yet", d.getElementById("ad-show").value === "open");
  check("the status names the college", /2 credentials not yet adopted at Alpha College/.test(d.getElementById("ad-state").textContent));
  check("cards in order", titles(d).join("|") === "CompTIA Security+|AP Biology");
  const sec = d.querySelector("#ad-list .cred");
  check("the college's own course is named", /Already teaches CIS 9/.test(sec.textContent));
  const chips = Array.from(sec.querySelectorAll("a.chip"));
  check("Request Quick Adopt chips name the builders", chips.map((a) => a.textContent.replace(/ built.*/, "")).join() === "Beta,Gamma");
  check("every chip opens MAP in a new tab", chips.every((a) => /View=Non-Military$/.test(a.href) && a.target === "_blank" && /noopener/.test(a.rel)));
  const hand = d.getElementById("ad-handout");
  check("Create Handout opens the college's visual", !hand.hidden && /cpl-opportunity\/\?college=Alpha%20College$/.test(hand.href));
  change(d, "ad-show", "here");
  const emt = d.querySelector("#ad-list .cred");
  check("Adopted here shows the college's units", emt && /Adopted here: 4 units/.test(emt.textContent));
  check("a college is never offered its own exhibit", emt && !Array.from(emt.querySelectorAll("a.chip")).some((a) => /MAP-A/.test(a.href)));
  change(d, "ad-college", "");
  check("no college: Show is Every credential and disabled", d.getElementById("ad-show").value === "all" && d.getElementById("ad-show").disabled);
  check("no college: no handout", d.getElementById("ad-handout").hidden);
  check("no college: the address drops ?college=", one.w.location.search === "");
  change(d, "ad-region", "Bay Area (Region 3)");
  check("a region newly picked opens on Not adopted yet", d.getElementById("ad-show").value === "open");
  check("a builder outside the columns is named", /Delta University/.test(d.getElementById("ad-list").textContent));
  // The matrix.
  change(d, "ad-show", "all");
  d.querySelector('[data-view="matrix"]').click();
  check("the matrix shows and the list hides", !d.getElementById("ad-matrix-view").hidden && d.getElementById("ad-list-view").hidden);
  const heads = Array.from(d.querySelectorAll(".mx thead th.ch")).map((t) => t.textContent);
  check("a region narrows the columns", heads.join() === "Alpha,Gamma");
  check("column headers are scoped", d.querySelectorAll('.mx thead th[scope="col"]').length === 3);
  check("row headers are scoped", d.querySelectorAll('.mx tbody th[scope="row"]').length === 3);
  check("an awarded cell shows units", d.querySelectorAll(".mx td.art").length === 3);
  check("a could-adopt cell says so in words", /already teaches a matching course/.test(d.querySelector(".mx td.could").textContent));
  check("the matrix sits in a labelled region", d.getElementById("ad-mx-wrap").getAttribute("role") === "region" && d.getElementById("ad-mx-wrap").getAttribute("aria-label"));
  check("one cell is in the tab order", d.querySelectorAll('.mx td[tabindex="0"]').length === 1);
  check("the page remembers no filter", one.writes.every((k) => k === "cpl_theme"));

  const bad = await load("", { fail: true });
  check("a failed read says so", /could not be read/.test(bad.d.getElementById("ad-state").textContent) && !bad.d.querySelector("#ad-list .cred"));

  // Malone's look, Light by default, unlisted.
  check("the Library's tokens", /--heading: #082B61/.test(PAGE) && /--gold: #F4B300/.test(PAGE));
  check("dark only when picked", !/prefers-color-scheme/.test(PAGE));
  check("noindex until Sam links it", /<meta name="robots" content="noindex">/.test(PAGE));
  check("a skip link and one h1", /class="skip-link"/.test(PAGE) && (PAGE.match(/<h1/g) || []).length === 1);
  check("in the a11y sweep", /"public-adopt"/.test(fs.readFileSync("a11y.config.js", "utf8")));
  check("the daily run builds the data", /kb\/_build_adopt_page\.py/.test(fs.readFileSync(".github/workflows/daily-dashboard.yml", "utf8")));

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0]));
  console.log((results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})();

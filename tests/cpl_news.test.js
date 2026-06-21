// CPL News tab (cpl_news.js) — jsdom test.
//
// Guards: (a) Rule 4 (both HTMLs identical) + nav button / pane / boot wiring;
// (b) the CA-first sort (featured → CA before national → newest); (c) the
// filter matcher; (d) the failure mode — a row with null topics/summary/date
// must render without throwing.
//
// Run from repo root: `npm test` (or `node tests/cpl_news.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — static invariants on the shipped HTML ──
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
check("nav button present", /data-tab="cpl-news" role="tab"[^>]*>CPL News</.test(cpl));
check("tab pane present", /id="tab-cpl-news" data-tab="cpl-news"/.test(cpl));
check("mount div present", /id="cplNewsMount"/.test(cpl));
check("lazy boot wiring present", /onActivate\('cpl-news'/.test(cpl) && /loadScript\('cpl_news\.js', 'CPL_NEWS_TAB'/.test(cpl));

// ── Part B — behavior, loaded into jsdom ──
const SRC = fs.readFileSync("cpl_news.js", "utf8");
function boot() {
  const dom = new JSDOM("<!doctype html><html><head></head><body><div id='cplNewsMount'></div></body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  dom.window.eval(SRC);
  return dom;
}

const dom = boot();
const T = dom.window.CPL_NEWS_TAB;
check("module exposes CPL_NEWS_TAB", !!T && typeof T.boot === "function");

// (b) scope rank — CA outranks national outranks other
check("scopeRank CA < national < other",
  T._scopeRank("ca") < T._scopeRank("national") && T._scopeRank("national") < T._scopeRank("other"));

// CA-first sort: featured first; then CA before national; then newest within.
{
  const rows = [
    { id: 1, scope: "national", featured: false, published_at: "2026-06-20T00:00:00Z", title: "nat new" },
    { id: 2, scope: "ca", featured: false, published_at: "2026-06-01T00:00:00Z", title: "ca old" },
    { id: 3, scope: "ca", featured: false, published_at: "2026-06-18T00:00:00Z", title: "ca new" },
    { id: 4, scope: "national", featured: true, published_at: "2026-05-01T00:00:00Z", title: "featured nat" },
  ];
  const sorted = T._sortNews(rows, "ca").map((r) => r.id);
  check("featured pinned first", sorted[0] === 4);
  check("CA before national (after featured)", sorted[1] === 3 && sorted[2] === 2);
  check("national last", sorted[3] === 1);

  const byNew = T._sortNews(rows, "new").map((r) => r.id);
  check("Newest mode: featured still first, then pure date", byNew[0] === 4 && byNew[1] === 1 && byNew[2] === 3 && byNew[3] === 2);
}

// (c) filters
{
  const row = { scope: "ca", source_type: "news", title: "Prior learning bill", summary: "AB 123", publisher: "CalMatters", topics: ["CPL", "Budget"], related_system: "Budget" };
  check("scope filter matches CA", T._matchFilters(row, { scope: "ca", stype: "all", q: "" }));
  check("scope filter rejects national-only", !T._matchFilters(row, { scope: "national", stype: "all", q: "" }));
  check("type filter matches news", T._matchFilters(row, { scope: "all", stype: "news", q: "" }));
  check("type filter rejects social", !T._matchFilters(row, { scope: "all", stype: "social", q: "" }));
  check("search matches topic", T._matchFilters(row, { scope: "all", stype: "all", q: "budget" }));
  check("search rejects miss", !T._matchFilters(row, { scope: "all", stype: "all", q: "welding" }));
}

// (d) failure mode — null topics / summary / date must render, not throw
{
  const d2 = boot();
  const T2 = d2.window.CPL_NEWS_TAB;
  T2._setRows([
    { id: 10, url: "https://x.test/a", title: "Good row", scope: "ca", source_type: "news", summary: "ok", topics: ["CPL"], published_at: "2026-06-10T00:00:00Z" },
    { id: 11, url: "https://x.test/b", title: "Broken row", scope: "other", source_type: "manual", summary: null, topics: null, published_at: null },
  ]);
  let threw = false;
  try { T2._render(d2.window.document.getElementById("cplNewsMount")); } catch (e) { threw = true; }
  check("render with null topics/summary/date does not throw", !threw);
  const cards = d2.window.document.querySelectorAll(".cplnews-card");
  check("both rows rendered as cards", cards.length === 2);
  check("suggest-a-story box present", !!d2.window.document.querySelector(".cplnews-suggest"));
  check("scoped CSS injected once", d2.window.document.querySelectorAll("#cpl-news-css").length === 1);
}

let failed = 0;
for (const [name, ok] of results) {
  console.log((ok ? "PASS" : "FAIL") + "  " + name);
  if (!ok) failed++;
}
console.log(failed === 0 ? `All ${results.length} checks passed.` : `${failed} of ${results.length} checks FAILED.`);
process.exit(failed === 0 ? 0 : 1);

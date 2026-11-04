// CPL News: every view has an address (2026-11-04).
//
// Asked in session, 2026-11-04: "make sure that the sign in link from the emails takes the user back to the view they
// logged in from", then "Should remember to make that fix on all COBI views". A magic link opens a new browser tab, so
// only the address survives. The Scope words (All, California, National) open from #cpl-news/<all|ca|national>, and
// the tab reports the scope on screen. The sort, the source type and the search are filters and are not carried.
//
// WHAT THIS GUARDS:
//   (1) ⭐ #cpl-news/ca opens the California scope (its word pressed, only CA rows), and reports it;
//   (2) pressing All reports the bare tab, though the address still says ca;
//   (3) a later visit by an address opens its scope (the shell boots once), keeping the rows already read;
//   (4) a bare #cpl-news opens All, and an unknown word leaves it; the sign-in fragment is still captured.
//
// Run from repo root: `npm test` (or `node tests/cpl_news_view_address.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const SRC = fs.readFileSync("cpl_news.js", "utf8");
const SESSION = fs.readFileSync("cpl_session.js", "utf8");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const tick = () => new Promise((r) => setTimeout(r, 20));

const ROWS = [
  { id: 1, scope: "ca", source_type: "news", title: "A California story", url: "https://example.org/1", published_at: "2026-11-01T00:00:00Z" },
  { id: 2, scope: "national", source_type: "news", title: "A national story", url: "https://example.org/2", published_at: "2026-11-02T00:00:00Z" },
];

async function bootAt(hash) {
  const dom = new JSDOM("<!doctype html><html><head></head><body><div id='cplNewsMount'></div></body></html>",
    { runScripts: "outside-only", url: "https://example.org/index.html" + hash });
  const w = dom.window, local = {}, per = {};
  const bag = (o) => ({ getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } });
  Object.defineProperty(w, "localStorage", { value: bag(local), configurable: true });
  Object.defineProperty(w, "sessionStorage", { value: bag(per), configurable: true });
  w.__reads = 0;
  w.fetch = (url) => {
    if (/cpl_news\?/.test(String(url))) w.__reads++;
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(ROWS))) });
  };
  w.eval(SESSION);
  w.eval(SRC);
  w.CPL_NEWS_TAB.boot();
  await tick();
  const doc = w.document;
  const stash = () => { w.CPL_SESSION.stashReturnTab("cpl-news"); return (JSON.parse(local.cpl_sb_return_tab || "{}")).tab; };
  const scopeBtns = () => Array.prototype.slice.call(doc.querySelectorAll('.cplnews-seg[aria-label="Scope"] button'));
  const lit = () => { const b = scopeBtns().filter((x) => x.getAttribute("aria-pressed") === "true")[0]; return b ? b.textContent : ""; };
  const titles = () => Array.prototype.map.call(doc.querySelectorAll(".cplnews-card h3"), (h) => h.textContent);
  const word = (t) => scopeBtns().filter((x) => x.textContent === t)[0];
  return { w, doc, stash, lit, titles, word };
}
const click = (w, el) => el && el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));

(async function () {
  {
    const a = await bootAt("#cpl-news/ca");
    check("(1) ⭐ #cpl-news/ca opens the California scope", a.lit() === "California" && a.titles().join() === "A California story",
      a.lit() + " " + a.titles().join());
    check("(1) and reports it", a.stash() === "cpl-news/ca", a.stash());
    click(a.w, a.word("All"));
    check("(2) All reports the bare tab (the address still says ca)", a.lit() === "All" && a.titles().length === 2 &&
      a.stash() === "cpl-news" && a.w.location.hash === "#cpl-news/ca", a.stash() + " " + a.w.location.hash);
    click(a.w, a.word("National"));
    check("(2) National reports cpl-news/national", a.stash() === "cpl-news/national", a.stash());
    // (3) a later visit
    a.w.location.hash = "#cpl-news/ca";
    a.w.dispatchEvent(new a.w.CustomEvent("cpl-tab-activated", { detail: { tab: "cpl-news" } }));
    check("(3) a re-fired activation on the same address keeps the scope picked since", a.lit() === "National", a.lit());
    a.w.dispatchEvent(new a.w.CustomEvent("cpl-tab-activated", { detail: { tab: "dashboard" } }));
    a.w.dispatchEvent(new a.w.CustomEvent("cpl-tab-activated", { detail: { tab: "cpl-news" } }));
    check("(3) a later visit by an address opens its scope", a.lit() === "California" && a.titles().join() === "A California story" &&
      a.stash() === "cpl-news/ca", a.lit() + " " + a.titles().join());
    check("(3) and keeps the rows already read", a.w.__reads === 1, String(a.w.__reads));
  }
  {
    const b = await bootAt("#cpl-news");
    check("(4) a bare #cpl-news opens All", b.lit() === "All" && b.titles().length === 2 && b.stash() === "cpl-news", b.lit());
    const c = await bootAt("#cpl-news/elsewhere");
    check("(4) an unknown word leaves All", c.lit() === "All" && c.stash() === "cpl-news", c.lit());
  }

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();

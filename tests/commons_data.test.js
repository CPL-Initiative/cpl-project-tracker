// The Commons data dashboard, slice 1 (#3215): the statewide figures and the college list (commons_data.js, opened by
// commons.js at #commons/data).
//
// WHAT THIS GUARDS (each a way the page could mislead):
//   (1) ⭐ a figure that is a button counts exactly the list it opens (CLAUDE.md: a figure card opens what it counts);
//   (2) ⭐ a figure's filter: each opens only its colleges, an unread college reads "Not read yet" (never 0%);
//   (3) ⭐ the address: #commons/data and #commons/data/<filter> open the view, the view reports its address, a later
//       visit on #commons draws the first view again, and the filter is never stored;
//   (4) ⭐ TBA where no committed file supplies the figure (overall, confidence, APIs, the JST funnel), never a number;
//   (5) the age cue reads its thresholds from the file; the sort words; the search;
//   (6) static: tokens only, no write path, no storage, th scope and a labeled scrolling region, no mock values.
// The committed file itself is guarded by tests/commons_data_status_build_test.py.
//
// Run from repo root: `npm test` (or `node tests/commons_data.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const SESSION = fs.readFileSync("cpl_session.js", "utf8");
const PROGRESS = fs.readFileSync("commons_progress.js", "utf8");
const COMMONS = fs.readFileSync("commons.js", "utf8");
const SRC = fs.readFileSync("commons_data.js", "utf8");

const NOW = Date.now();
const ago = (d) => new Date(NOW - d * 86400000).toISOString();
function college(o) {
  return Object.assign({ id: 0, name: "", district: "A CCD", kind: "college", harvested: false, slug: null, programs: null, passing: null, gap: null,
    causes: null, read_at: null, read_kind: null, cost_usd: null, passed_at_read: null, slo_queue: null, scout: null, spot_check: null }, o);
}
const COLLEGES = [
  college({ id: 1, name: "Alpha College", district: "Alpha CCD", harvested: true, slug: "alpha", programs: 100, passing: 80, gap: 20, causes: { no_closed_list: 20 },
    read_at: ago(3), read_kind: "capture", cost_usd: 8, passed_at_read: 80 }),
  college({ id: 2, name: "Beta College", district: "Beta CCD", harvested: true, slug: "beta", programs: 50, passing: 50, gap: 0, causes: {},
    read_at: ago(20), read_kind: "capture_preview", cost_usd: 2, passed_at_read: 40, slo_queue: { state: "held", why: "a parser", on: "2026-11-12" } }),
  college({ id: 3, name: "Gamma College", district: "Beta CCD", harvested: true, slug: "gamma", programs: 40, passing: 10, gap: 30, causes: { page_not_found: 30 },
    read_at: ago(60), read_kind: "capture", cost_usd: 4, passed_at_read: 10, scout: { recommendation: "blocked", challenge: "firewall", checked_at: ago(1), wave: "w" } }),
  college({ id: 4, name: "Delta College", district: "Delta CCD" }),
  college({ id: 5, name: "Epsilon Continuing Education", district: "Delta CCD", kind: "continuing_education" })
];
const DATA = {
  schema: 1, written_at: "2026-11-13T12:00:00Z",
  sources: { universe: "kb/college_identity/2026-11-10/crosswalk.json", harvest: "kb/program_requirements_college/<slug>/" },
  rule: { basis: "committed files only", passing: "the tab's test", overall: "the whole-harvest rule", confidence: "strong, partial, limited", age_days: { fresh: 7, recent: 30 } },
  fields: {}, tba: { confidence: "No spot-check receipt is committed yet.", overall: "Catalog source, SLOs and PLOs are live tables.", apis: "Not a committed file yet.", jst: "Waits on a feed." },
  statewide: { colleges: 5, continuing_education: 1, districts: 3, harvested: 3, unread: 2, programs: 190, passing: 140, gap: 50, with_gap: 2,
    cost_usd: 14, passed_at_read: 130, cost_receipts: 3, slo_waiting: 1, scouted: 1, scout_barrier: 1, spot_checked: 0 },
  colleges: COLLEGES
};
const STATUS = { schema: 1, written_at: "2026-11-12T06:00:00Z", rows: [] };

function load(hash) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-commons"><div id="commons-root">Loading</div></div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "dangerously" });
  const w = dom.window, calls = [];
  const bag = () => { const o = {}; return { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; }, _o: o }; };
  Object.defineProperty(w, "localStorage", { value: bag(), configurable: true });
  Object.defineProperty(w, "sessionStorage", { value: bag(), configurable: true });
  const files = { "kb/status/commons_data.json": DATA, "kb/status/commons.json": STATUS };
  w.fetch = function (url, init) {
    calls.push([String(url), (init && init.method) || "GET"]);
    const hit = files[String(url)];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  [SESSION, PROGRESS, SRC, COMMONS].forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, calls, M: w.CPL_COMMONS, D: w.CPL_COMMONS_DATA };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 30; i++) await tick(); }
function reported(x) { x.w.CPL_SESSION.stashReturnTab("commons"); return (JSON.parse(x.w.localStorage.getItem("cpl_sb_return_tab")) || {}).tab; }
function rows(x) { return Array.from(x.d.querySelectorAll("#cdd-colleges tbody tr[data-college]")).map((r) => r.getAttribute("data-college")); }
function tile(x, f) { return x.d.querySelector('.cdd-tile[data-filter="' + f + '"]'); }
function plain(x, label) { return x.d.querySelector('.cdd-tile[data-tile="' + label + '"]'); }

(async function () {
  // ── (6) static ──
  const css = SRC.slice(SRC.indexOf("var CSS = ["), SRC.indexOf("].join(", SRC.indexOf("var CSS = [")));
  check("static: the injected CSS names no raw hex color and uses the tab's --cmn tokens", !/#[0-9a-fA-F]{3,8}\b/.test(css) && /var\(--cmn-link\)/.test(css));
  check("static: a scrolling table sits in a labeled region; th scope on every header", /role: "region", "aria-label"/.test(SRC) && !/el\("th", \{ (?!scope)/.test(SRC));
  check("static: no write path and no browser storage", !/method:\s*"POST"|\/rpc\/|kb_curation|localStorage|sessionStorage|REST \+/.test(SRC));
  check("static: no mock value ships (the mock's sample figures)", !/14,?525|20,?282|130,?793|141,?738|103,?088|7,?082|1 of 15/.test(SRC));
  check("static: focus-visible and reduced motion in the CSS; one column under 560px", /:focus-visible/.test(css) && /prefers-reduced-motion/.test(css) && /max-width: 560px/.test(css));
  check("static: American spelling", !/\b(colour|behaviour|organisation|analyse|centre|catalogue|whilst|amongst)\b/i.test(SRC));

  // ── (3) the address ──
  const o = load("#commons/data");
  await o.M.boot(); await settle();
  check("address 1 ⭐: #commons/data opens the dashboard", txt(o.d.querySelector("#cdd-h")) === "How complete each college's data is");
  check("address 2 ⭐: the view reports commons/data", reported(o) === "commons/data");
  check("address 3: it read only its one file", o.calls.every((c) => c[1] === "GET") && o.calls.some((c) => c[0] === "kb/status/commons_data.json"));

  // ── (1) every figure that is a button counts exactly the list it opens ──
  const D = o.D, M = D.model(DATA);
  Object.keys(D.FILTERS).filter((f) => tile(o, f)).forEach(function (f) {
    tile(o, f).click();
    const shown = rows(o).length, figure = Number(txt(tile(o, f).querySelector(".cdd-v")).replace(/,/g, ""));
    check("figure " + f + " ⭐: the figure (" + figure + ") equals the list it opens (" + shown + ") and the model's count", figure === shown && shown === D.listFor(M, f).length);
    check("figure " + f + ": pressed, and the address carries it", tile(o, f).getAttribute("aria-pressed") === "true"
      && o.w.location.hash === (f === "all" ? "#commons/data" : "#commons/data/" + f) && reported(o) === (f === "all" ? "commons/data" : "commons/data/" + f));
  });
  check("figure: six figures open a list", o.d.querySelectorAll("button.cdd-tile").length === 6);

  // ── (2) each filter's colleges ──
  tile(o, "unread").click();
  check("filter unread ⭐: only the colleges with no committed harvest, and each reads Not read yet, never 0%",
    JSON.stringify(rows(o)) === JSON.stringify(["Delta College", "Epsilon Continuing Education"])
    && Array.from(o.d.querySelectorAll("#cdd-colleges tbody tr")).every((r) => /Not read yet/.test(txt(r)) && !/0%/.test(txt(r))));
  tile(o, "gaps").click();
  check("filter gaps: the harvested colleges with programs still to pass, most first", JSON.stringify(rows(o)) === JSON.stringify(["Gamma College", "Alpha College"]));
  tile(o, "slo").click();
  check("filter slo: the colleges in the SLO queue", JSON.stringify(rows(o)) === JSON.stringify(["Beta College"]) && /SLO read held/.test(txt(o.d.querySelector("#cdd-colleges tbody"))));
  tile(o, "scouted").click();
  check("filter scouted: the scouted colleges, with the barrier named", JSON.stringify(rows(o)) === JSON.stringify(["Gamma College"]) && /firewall/.test(txt(o.d.querySelector("#cdd-colleges tbody"))));
  check("filter: the count line says what is shown", /^Showing 1 of 5: Scouted for a wave$/.test(txt(o.d.querySelector("#cdd-shown"))));
  o.d.querySelector("#cdd-all").click();
  check("filter: Show all colleges returns the whole universe", rows(o).length === 5 && o.w.location.hash === "#commons/data");

  // ── (4) TBA where no committed file supplies it; summed figures stay plain ──
  ["Overall completeness", "Confidence", "APIs connected", "JST funnel"].forEach(function (l) {
    const t = plain(o, l);
    check("TBA ⭐: " + l + " reads TBA with its reason and opens nothing", t && txt(t.querySelector(".cdd-v")) === "TBA" && t.tagName === "DIV" && txt(t.querySelector(".cdd-d")).length > 0);
  });
  check("plain: program requirements passing is the file's sum, shown, not a button",
    plain(o, "Program requirements passing") && txt(plain(o, "Program requirements passing").querySelector(".cdd-v")) === "74%"
    && /140 of 190 listed programs/.test(txt(plain(o, "Program requirements passing"))));
  check("plain: read cost per passing program from the receipts", txt(plain(o, "Read cost per passing program").querySelector(".cdd-v")) === "$0.108");
  check("TBA: every college's confidence reads TBA without a spot-check receipt",
    Array.from(o.d.querySelectorAll('#cdd-colleges td[data-label="Confidence"]')).every((td) => txt(td) === "TBA"));

  // ── (5) the age cue, the sort, the search ──
  const rowOf = (n) => o.d.querySelector('#cdd-colleges tr[data-college="' + n + '"]');
  check("age: fresh, recent and stale from the file's thresholds", /fresh/.test(txt(rowOf("Alpha College"))) && /recent/.test(txt(rowOf("Beta College"))) && /stale/.test(txt(rowOf("Gamma College"))));
  check("age: a read on a pull request branch says so", /Read on a pull request branch/.test(txt(rowOf("Beta College"))));
  check("age: the thresholds are read, not restated", D.age(ago(10), { age_days: { fresh: 14, recent: 30 } }) === "fresh" && D.age(ago(10), DATA.rule) === "recent");
  const sortBtn = (k) => o.d.querySelector('button.cdd-sort[data-sort="' + k + '"]');
  sortBtn("pr").click();
  check("sort 1: program requirements low first, unread at the top, with the words on the heading",
    rows(o)[0] === "Delta College" && rows(o)[2] === "Gamma College" && /low first/.test(txt(sortBtn("pr")))
    && sortBtn("pr").parentNode.getAttribute("aria-sort") === "ascending");
  sortBtn("pr").click();
  check("sort 2: a second click reverses", rows(o)[0] === "Beta College" && sortBtn("pr").parentNode.getAttribute("aria-sort") === "descending");
  check("sort 3: sorting is no part of the address", o.w.location.hash === "#commons/data");
  const q = o.d.querySelector("#cdd-q");
  q.value = "beta ccd"; q.dispatchEvent(new o.w.Event("input"));
  check("search: by district too", JSON.stringify(rows(o).sort()) === JSON.stringify(["Beta College", "Gamma College"]));

  // ── (3) continued: a filter in the address, a later visit, nothing stored ──
  const g = load("#commons/data/gaps");
  await g.M.boot(); await settle();
  check("address 4 ⭐: #commons/data/gaps opens the gaps list", tile(g, "gaps").getAttribute("aria-pressed") === "true" && rows(g).length === 2 && reported(g) === "commons/data/gaps");
  g.w.history.replaceState(null, "", "#commons");
  g.w.dispatchEvent(new g.w.CustomEvent("cpl-tab-activated", { detail: { tab: "commons" } }));
  await settle();
  check("address 5: a later visit on #commons draws the first view, with the line that opens the dashboard",
    !g.d.querySelector("#cdd-h") && g.d.querySelector('#cmn-data-line a[href="#commons/data"]') && reported(g) === "commons");
  g.w.dispatchEvent(new g.w.CustomEvent("cpl-tab-activated", { detail: { tab: "other" } }));
  g.w.history.replaceState(null, "", "#commons/data");
  g.w.dispatchEvent(new g.w.CustomEvent("cpl-tab-activated", { detail: { tab: "commons" } }));
  await settle();
  check("address 6 ⭐: a new visit on #commons/data starts on All, the old filter not remembered",
    txt(g.d.querySelector("#cdd-h")) === "How complete each college's data is" && tile(g, "all").getAttribute("aria-pressed") === "true" && rows(g).length === 5);
  check("storage: nothing in local or session storage names the filter",
    !/gaps|commons\/data/.test(Object.values(g.w.localStorage._o || {}).filter((v) => !/^\{"tab"/.test(v)).join(" ")));
  const u = load("#commons/data/nonsense");
  await u.M.boot(); await settle();
  check("address 7: an unknown filter opens All", tile(u, "all").getAttribute("aria-pressed") === "true" && reported(u) === "commons/data");

  const failed = results.filter((x) => !x[1]);
  results.forEach((x) => console.log((x[1] ? "PASS " : "FAIL ") + x[0]));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });

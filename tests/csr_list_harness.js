// A small harness for the Common Subjects Reference's List, shared by the suites that once drove the Reference table
// (alias names, authority codes, the language split, the UI tweaks). The Reference view retired into the List on
// 2026-11-04; these suites now read the same guards off the List. Not a test file itself (no .test.js), so the runner
// skips it.
const fs = require("fs");
const vm = require("vm");
const { JSDOM } = require("jsdom");

const SRC = fs.readFileSync("canonical_subj4.js", "utf8");
const LIST_SRC = fs.readFileSync("commons_list.js", "utf8");

function txt(n) { return (n && n.textContent || "").replace(/\s+/g, " ").trim(); }

/* Boot the tab on #canonical-subj4/list with the given files; every other read answers empty. */
function boot(opts) {
  opts = opts || {};
  const posts = [];
  const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body><div id="tab-canonical-subj4">${opts.intro || ""}<div id="cs-mount"></div></div></body></html>`,
    { runScripts: "outside-only", pretendToBeVisual: true, url: "https://localhost/" + (opts.hash || "#canonical-subj4/list") });
  const w = dom.window;
  // opts.local presets the reader's storage (the Commons top fold, 2026-11-05).
  Object.keys(opts.local || {}).forEach((k) => w.localStorage.setItem(k, opts.local[k]));
  w.fetch = function (url, init) {
    const u = String(url);
    if (u.indexOf("kb_curation") >= 0 && init && init.method === "POST") { posts.push(JSON.parse(init.body)); return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve([]) }); }
    if (u.indexOf("kb/status/commons.json") >= 0) return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
    const body =
      u.indexOf("csr_out/latest.json") >= 0 ? (opts.scan || null) :
      u.indexOf("discipline_canonical_subj4.json") >= 0 ? opts.seed :
      u.indexOf("discipline_aliases.json") >= 0 ? (opts.aliases || { aliases: {} }) :
      u.indexOf("foreign_language_subj4.json") >= 0 ? (opts.flsplit || null) :
      u.indexOf("cid_descriptors") >= 0 ? (opts.cid || { descriptors: [] }) :
      u.indexOf("ccn_courses") >= 0 ? (opts.ccn || { courses: [] }) :
      u.indexOf("discipline_cpl_rollup.json") >= 0 ? { byDiscipline: opts.cpl || {} } :
      u.indexOf("kb_curation") >= 0 ? (opts.overlay || []) : {};
    if (body == null) return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve(null) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(body))) });
  };
  w.matchMedia = w.matchMedia || function () { return { matches: false, addListener() {}, removeListener() {} }; };
  w.HTMLElement.prototype.scrollIntoView = function () {};
  if (opts.signedIn) w.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: "aaa.bbb.ccc", refresh_token: "rrr", email: "curator@rccd.edu", exp: Date.now() + 9e6 }));
  w.confirm = function () { return !!opts.confirmYes; };
  const ctx = dom.getInternalVMContext ? dom.getInternalVMContext() : vm.createContext(w);
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    if (s === "commons_list.js") vm.runInContext(LIST_SRC, ctx, { filename: "commons_list.js" });
    setTimeout(cb, 0);
  } };
  vm.runInContext(SRC, ctx, { filename: "canonical_subj4.js" });
  const d = w.document;
  const api = {
    w: w, d: d, posts: posts, M: () => w.CPL_CANONICAL_SUBJ4,
    rows: () => Array.from(d.querySelectorAll("#cs-list .csl-table tbody tr:not(.csl-editrow):not(.csl-band)")),
    /* The title cell carries its lines under the title, so a row is named by its title word. */
    titles: () => api.rows().map((r) => txt(r.querySelector(".csl-title .csl-open") || r.querySelector(".csl-title"))),
    heads: () => Array.from(d.querySelectorAll("#cs-list .csl-table thead tr:first-child th")).map(txt)
      .map((h) => h.replace(/ \(\d+\)/, "").replace(/, (A to Z|Z to A|low to high|high to low)$/, "")),
    cell: (disc, name) => { const r = api.rows().find((x) => txt(x.querySelector(".csl-title .csl-open") || x.querySelector(".csl-title")) === disc); return r ? txt(r.children[api.heads().indexOf(name)]) : null; },
    find: async (q) => { const i = d.getElementById("csl-find"); i.value = q; i.dispatchEvent(new w.Event("input")); await settle(); return api.titles(); },
    /* Open an MQ discipline's panel; its text carries the title's drawer (the MQ handbook, other names, the split). */
    panel: async (disc) => {
      const b = Array.from(d.querySelectorAll("#cs-list .csl-table tbody tr button.csl-open")).find((x) => txt(x) === disc);
      if (!b) return null;
      b.click(); await settle();
      return d.getElementById("csl-panel");
    },
    word: (t) => Array.from(d.querySelectorAll("#cs-list button")).find((b) => txt(b) === t || txt(b).replace(/ \([\d,]+\)$/, "") === t),
  };
  return api;
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 15; i++) await tick(); }

/* The suites' shared report: PASS/FAIL per check, then N/M passed, exit 1 on any failure. */
function report(results) {
  let pass = 0;
  results.forEach(([n, ok, why]) => { console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why)); if (ok) pass++; });
  console.log("\n" + pass + "/" + results.length + " checks passed");
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
}

module.exports = { boot, settle, txt, report };

// Team & RACI: every view has an address (2026-11-04).
//
// Asked in session, 2026-11-04: "make sure that the sign in link from the emails takes the user back to the view they
// logged in from", then "Should remember to make that fix on all COBI views". A magic link opens a new browser tab, so
// only the address survives. The tab's two views (RACI Matrix, Team Directory) and the matrix's scope (an Activity or
// one sub-activity) open from #raci/<directory|matrix>[/<scope>], and the tab reports what is on screen.
//
// WHAT THIS GUARDS:
//   (1) ⭐ #raci/directory opens the Team Directory, and reports it;
//   (2) switching to the matrix reports the bare tab, though the address still says directory;
//   (3) ⭐ #raci/matrix/activity-4 and #raci/matrix/4.1 open the matrix on that scope, and report it;
//   (4) a later visit by an address opens its view (tabs.js fires onActivate once);
//   (5) a bare #raci opens the matrix on every row, and an unknown word leaves it there.
//
// Run from repo root: `npm test` (or `node tests/raci_view_address.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const SRC = fs.readFileSync("raci.js", "utf8");
const SESSION = fs.readFileSync("cpl_session.js", "utf8");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const tick = () => new Promise((r) => setTimeout(r, 20));

const DATA = {
  activity_kpis: [
    { activity_id: "Activity 1", activity_name: "Build AI-Enhanced CPL Infrastructure", kpis: [{ id: "1.1", name: "MAP Platform Development" }] },
    { activity_id: "Activity 4", activity_name: "Sprints, Projects & Partnerships", kpis: [{ id: "4.1", name: "Sprints" }] },
  ],
  projects: [
    { id: "1.1", name: "MAP Platform Development", activity: "Activity 1: Build AI-Enhanced CPL Infrastructure" },
    { id: "4.1", name: "Sprints and Projects", activity: "Activity 4: Sprints, Projects & Partnerships" },
    { id: "4.1.1", name: "Veteran Sprint", activity: "Activity 4: Sprints, Projects & Partnerships" },
  ],
};

async function bootAt(hash) {
  const dom = new JSDOM("<!doctype html><html><head></head><body><div id='raci-root'></div></body></html>",
    { runScripts: "outside-only", url: "https://example.org/index.html" + hash });
  const w = dom.window, local = {}, per = {};
  const bag = (o) => ({ getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } });
  Object.defineProperty(w, "localStorage", { value: bag(local), configurable: true });
  Object.defineProperty(w, "sessionStorage", { value: bag(per), configurable: true });
  w.CPL_DATA = JSON.parse(JSON.stringify(DATA));
  w.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  w.eval(SESSION);
  w.eval(SRC);
  w.CPL_RACI_TAB.boot();
  await tick();
  const doc = w.document;
  const stash = () => { w.CPL_SESSION.stashReturnTab("raci"); return (JSON.parse(local.cpl_sb_return_tab || "{}")).tab; };
  const on = () => { const b = doc.querySelector(".raci-tg.on"); return b ? b.textContent : ""; };
  const scope = () => { const s = doc.querySelector(".raci-filter-sel"); return s ? s.value : null; };
  const keys = () => Array.prototype.map.call(doc.querySelectorAll("[data-raci-key]"), (r) => r.getAttribute("data-raci-key"));
  const toggle = (label) => Array.prototype.filter.call(doc.querySelectorAll(".raci-tg"), (b) => b.textContent === label)[0];
  return { w, doc, stash, on, scope, keys, toggle };
}
const click = (w, el) => el && el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));

(async function () {
  {
    const a = await bootAt("#raci/directory");
    check("(1) ⭐ #raci/directory opens the Team Directory", a.on() === "Team Directory" && !a.doc.querySelector(".raci-filter-sel"), a.on());
    check("(1) and reports it", a.stash() === "raci/directory", a.stash());
    click(a.w, a.toggle("RACI Matrix"));
    check("(2) the matrix reports the bare tab (the address still says directory)",
      a.on() === "RACI Matrix" && a.stash() === "raci" && a.w.location.hash === "#raci/directory", a.stash() + " " + a.w.location.hash);
    // (4) a later visit
    a.w.location.hash = "#raci/matrix/activity-4";
    a.w.dispatchEvent(new a.w.CustomEvent("cpl-tab-activated", { detail: { tab: "raci" } }));
    check("(4) a later visit by an address opens its view", a.on() === "RACI Matrix" && a.scope() === "act:4" && a.stash() === "raci/matrix/activity-4",
      a.scope() + " " + a.stash());
    a.w.location.hash = "#raci/directory";
    a.w.dispatchEvent(new a.w.CustomEvent("cpl-tab-activated", { detail: { tab: "raci" } }));
    check("(4) and back to the directory", a.on() === "Team Directory" && a.stash() === "raci/directory", a.on());
  }
  {
    const b = await bootAt("#raci/matrix/activity-4");
    check("(3) ⭐ #raci/matrix/activity-4 opens the matrix on Activity 4", b.on() === "RACI Matrix" && b.scope() === "act:4" &&
      b.keys().indexOf("activity:1") < 0 && b.keys().indexOf("project:4.1.1") >= 0, b.scope() + " " + b.keys().join());
    check("(3) and reports it", b.stash() === "raci/matrix/activity-4", b.stash());
    const sel = b.doc.querySelector(".raci-filter-sel");
    sel.value = "sub:1.1"; sel.dispatchEvent(new b.w.Event("change"));
    check("(3) a sub-activity scope reports raci/matrix/<id>", b.stash() === "raci/matrix/1.1", b.stash());
    sel.value = "all"; sel.dispatchEvent(new b.w.Event("change"));
    check("(3) every row reports the bare tab", b.stash() === "raci", b.stash());
  }
  {
    const c = await bootAt("#raci/matrix/4.1");
    check("(3) ⭐ #raci/matrix/4.1 opens the matrix on that sub-activity", c.scope() === "sub:4.1" && c.keys().indexOf("project:1.1") < 0 &&
      c.keys().indexOf("project:4.1.1") >= 0, c.scope());
    check("(3) and reports it", c.stash() === "raci/matrix/4.1", c.stash());
  }
  {
    const d = await bootAt("#raci");
    check("(5) a bare #raci opens the matrix on every row", d.on() === "RACI Matrix" && d.scope() === "all" && d.stash() === "raci", d.on() + " " + d.scope());
    const e = await bootAt("#raci/matrix/9.9");
    check("(5) an unknown sub-activity leaves every row", e.on() === "RACI Matrix" && e.scope() === "all" && e.stash() === "raci", e.scope());
    const f = await bootAt("#raci/elsewhere");
    check("(5) an unknown view word leaves the matrix", f.on() === "RACI Matrix" && f.stash() === "raci", f.on());
  }

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();

// GR Priorities: every view has an address (2026-11-04).
//
// Asked in session, 2026-11-04: "make sure that the sign in link from the emails takes the user back to the view they
// logged in from", then "Should remember to make that fix on all COBI views". A magic link opens a new browser tab, so
// only the address survives. The register's view is its priority area: #gr-priorities/<area id> opens that area, and
// the tab reports the area on screen. The pathway, status, section and search filters are not carried.
//
// WHAT THIS GUARDS:
//   (1) ⭐ #gr-priorities/<area> opens that area once the area list is read (the picker and the revisions read), and reports it;
//   (2) picking the first area reports the bare tab, though the address still names the other one;
//   (3) a later visit by an address opens its area (the shell fires onActivate once); a re-fired activation on the
//       same address keeps the area picked since;
//   (4) a bare #gr-priorities opens the first area; an area the list does not hold leaves it.
//
// Run from repo root: `npm test` (or `node tests/gr_priorities_view_address.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const SRC = fs.readFileSync("gr_priorities.js", "utf8");
const SESSION = fs.readFileSync("cpl_session.js", "utf8");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const tick = () => new Promise((r) => setTimeout(r, 20));

const AREAS = [
  { id: "cpl", title: "Credit for Prior Learning", status: "active", sort: 1, narrative: {} },
  { id: "dual-enrollment", title: "Dual Enrollment", status: "active", sort: 2, narrative: {} },
];

async function bootAt(hash) {
  const dom = new JSDOM("<!doctype html><html><head></head><body><div id='gr-priorities-root'></div></body></html>",
    { runScripts: "outside-only", url: "https://example.org/index.html?org=gr" + hash });
  const w = dom.window, local = {}, per = {};
  const bag = (o) => ({ getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } });
  Object.defineProperty(w, "localStorage", { value: bag(local), configurable: true });
  Object.defineProperty(w, "sessionStorage", { value: bag(per), configurable: true });
  local.cpl_gr_pass = "gr-secret";
  w.__areaReads = [];
  w.fetch = (url) => {
    const u = String(url);
    let body = [];
    if (/gr_areas\?/.test(u)) body = AREAS;
    const m = /gr_revisions\?select=\*&area_id=eq\.([^&]+)/.exec(u);
    if (m) { const id = decodeURIComponent(m[1]); w.__areaReads.push(id); body = [{ id: "r-" + id, area_id: id, n: 1, title: "Row of " + id, citations: [] }]; }
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(body))) });
  };
  w.eval(SESSION);
  w.eval(SRC);
  w.CPL_GR.activate();
  await tick();
  const doc = w.document;
  const S = w.CPL_GR._state;
  const stash = () => { w.CPL_SESSION.stashReturnTab("gr-priorities"); return (JSON.parse(local.cpl_sb_return_tab || "{}")).tab; };
  const picked = () => { const s = doc.getElementById("gx-area"); return s ? s.value : null; };
  const rows = () => doc.body.textContent;
  return { w, doc, S, stash, picked, rows };
}
function revisit(t, hash, other) {
  if (other) t.w.dispatchEvent(new t.w.CustomEvent("cpl-tab-activated", { detail: { tab: "dashboard" } }));
  t.w.location.hash = hash;
  t.w.dispatchEvent(new t.w.CustomEvent("cpl-tab-activated", { detail: { tab: "gr-priorities" } }));
  return tick();
}

(async function () {
  {
    const a = await bootAt("#gr-priorities/dual-enrollment");
    check("(1) ⭐ #gr-priorities/dual-enrollment opens that area", a.S.areaId === "dual-enrollment" && a.picked() === "dual-enrollment" &&
      a.w.__areaReads.join() === "dual-enrollment" && /Row of dual-enrollment/.test(a.rows()), a.S.areaId + " " + a.w.__areaReads.join());
    check("(1) and reports it", a.stash() === "gr-priorities/dual-enrollment", a.stash());
    const sel = a.doc.getElementById("gx-area");
    sel.value = "cpl"; sel.dispatchEvent(new a.w.Event("change"));
    await tick();
    check("(2) the first area reports the bare tab (the address still names the other)", a.S.areaId === "cpl" &&
      a.stash() === "gr-priorities" && /dual-enrollment/.test(a.w.location.hash), a.stash() + " " + a.w.location.hash);
    // (3)
    await revisit(a, "#gr-priorities/dual-enrollment");
    check("(3) a re-fired activation on the same address keeps the area picked since", a.S.areaId === "cpl" && a.picked() === "cpl", a.S.areaId);
    await revisit(a, "#gr-priorities/dual-enrollment", true);
    check("(3) a later visit by an address opens its area", a.S.areaId === "dual-enrollment" && a.picked() === "dual-enrollment" &&
      a.stash() === "gr-priorities/dual-enrollment", a.S.areaId);
    await revisit(a, "#gr-priorities", true);
    check("(3) a later visit on the bare tab leaves the area as it is", a.S.areaId === "dual-enrollment", a.S.areaId);
  }
  {
    const b = await bootAt("#gr-priorities");
    check("(4) a bare #gr-priorities opens the first area", b.S.areaId === "cpl" && b.picked() === "cpl" && b.stash() === "gr-priorities", b.S.areaId);
    const c = await bootAt("#gr-priorities/no-such-area");
    check("(4) an area the list does not hold leaves the first area", c.S.areaId === "cpl" && c.stash() === "gr-priorities", c.S.areaId);
  }

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();

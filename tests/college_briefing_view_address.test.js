// My College (college_briefing.js): every view has an address (2026-11-04).
//
// Asked in session, 2026-11-04: "make sure that the sign in link from the emails takes the user back to the view they
// logged in from", then "Should remember to make that fix on all COBI views". A magic link opens a new browser tab, so
// only the address survives. The tab's scopes (college, district, Strong Workforce region, statewide) and the one
// college, district or region picked in them open from #college-briefing/<scope>[/<name>], and the tab reports what
// is on screen. Tabs never remember a chosen college across visits (Sam, 2026-10-21): the address carries it, and
// nothing is stored.
//
// WHAT THIS GUARDS:
//   (1) ⭐ #college-briefing/college/<name> opens that college's briefing once the list is read, and reports it;
//   (2) "Change view" reports the bare tab, though the address still names the college;
//   (3) ⭐ district and region addresses open that district or region, checked against the tab's own rosters;
//   (4) a scope alone opens its second question; statewide opens the statewide view;
//   (5) a later visit by an address opens its view; a re-fired activation on the same address keeps a pick made since;
//   (6) a bare #college-briefing asks first, as today; a name the lists do not hold opens the scope's own question;
//   (7) nothing about the view is written to browser storage.
//
// Run from repo root: `npm test` (or `node tests/college_briefing_view_address.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const SRC = fs.readFileSync("college_briefing.js", "utf8");
const SESSION = fs.readFileSync("cpl_session.js", "utf8");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const tick = () => new Promise((r) => setTimeout(r, 20));

const COLLEGES = [
  { college_id: 1, college_name: "Santa Ana College", variants: [] },
  { college_id: 2, college_name: "Santiago Canyon College", variants: [] },
  { college_id: 3, college_name: "Berkeley City College", variants: [] },
];
const FUNDING = { colleges: [
  { college: "Santa Ana College", district: "Rancho Santiago Community College District" },
  { college: "Santiago Canyon College", district: "Rancho Santiago Community College District" },
  { college: "Berkeley City College", district: "Peralta Community College District" },
] };
const SWP = { regions: {
  OC: { name: "Orange County", colleges: ["Santa Ana College", "Santiago Canyon College"] },
  Bay: { name: "Bay Area", colleges: ["Berkeley City College"] },
} };

async function bootAt(hash) {
  const dom = new JSDOM("<!doctype html><html><head></head><body><div id='college-briefing-root'></div></body></html>",
    { runScripts: "outside-only", url: "https://example.org/index.html" + hash });
  const w = dom.window, local = {}, per = {};
  const bag = (o) => ({ getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } });
  Object.defineProperty(w, "localStorage", { value: bag(local), configurable: true });
  Object.defineProperty(w, "sessionStorage", { value: bag(per), configurable: true });
  w.CPL_FUNDING = JSON.parse(JSON.stringify(FUNDING));
  w.CPL_SWP_REGIONS = JSON.parse(JSON.stringify(SWP));
  w.CPL_FUNDING_TAB = {};   // the model: present, so a college pick never pulls a script
  w.fetch = (url) => {
    const u = String(url);
    const body = /map_colleges\?/.test(u) ? COLLEGES : /cpl_funding_config/.test(u) ? [{ config: {} }] : [];
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(body))) });
  };
  w.eval(SESSION);
  w.eval(SRC);
  const writes = [];
  const set = w.localStorage.setItem, sset = w.sessionStorage.setItem;
  w.localStorage.setItem = (k, v) => { writes.push(k); set(k, v); };
  w.sessionStorage.setItem = (k, v) => { writes.push(k); sset(k, v); };
  w.CPL_COLLEGE_BRIEFING.activate();
  await tick();
  const root = w.document.getElementById("college-briefing-root");
  const S = w.CPL_COLLEGE_BRIEFING._state;
  const stash = () => { w.CPL_SESSION.stashReturnTab("college-briefing"); return (JSON.parse(local.cpl_sb_return_tab || "{}")).tab; };
  const title = () => ((root.querySelector(".cb-welcome-t") || {}).textContent || "");
  const question = () => ((root.querySelector(".cb-scope-q") || {}).textContent || "");
  const asksScope = () => !!root.querySelector("[data-scope='college']") && !root.querySelector(".cb-welcome-t");
  return { w, root, S, stash, title, question, asksScope, writes };
}
const click = (w, el) => el && el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
function revisit(t, hash) {
  t.w.location.hash = hash;
  t.w.dispatchEvent(new t.w.CustomEvent("cpl-tab-activated", { detail: { tab: "college-briefing" } }));
  return tick();
}

(async function () {
  {
    const a = await bootAt("#college-briefing/college/Santa%20Ana%20College");
    check("(1) ⭐ #college-briefing/college/<name> opens that college", a.S.scope === "college" && a.S.college === "Santa Ana College" &&
      a.title() === "Welcome, Santa Ana College", a.S.scope + " " + a.S.college + " " + a.title());
    check("(1) and reports it, encoded", a.stash() === "college-briefing/college/Santa%20Ana%20College", a.stash());
    click(a.w, a.root.querySelector("[data-scope-clear]"));
    check("(2) Change view reports the bare tab (the address still names the college)", a.asksScope() &&
      a.stash() === "college-briefing" && /Santa%20Ana/.test(a.w.location.hash), a.stash() + " " + a.w.location.hash);
    // (5) a re-fired activation on the same address (a phrase unlock) keeps the pick made since
    await revisit(a, "#college-briefing/college/Santa%20Ana%20College");
    check("(5) a re-fired activation on the same address keeps what the reader picked since", a.asksScope() && a.stash() === "college-briefing", a.stash());
    // (5) a later visit by another address
    a.w.dispatchEvent(new a.w.CustomEvent("cpl-tab-activated", { detail: { tab: "dashboard" } }));
    await revisit(a, "#college-briefing/district/Peralta%20Community%20College%20District");
    check("(5) a later visit by an address opens its view", a.S.scope === "district" && a.S.district === "Peralta Community College District" &&
      a.title() === "Welcome, Peralta Community College District", a.title());
    check("(5) and reports it", a.stash() === "college-briefing/district/Peralta%20Community%20College%20District", a.stash());
    a.w.dispatchEvent(new a.w.CustomEvent("cpl-tab-activated", { detail: { tab: "dashboard" } }));
    await revisit(a, "#college-briefing/college/Santiago%20Canyon%20College");
    check("(5) a later visit to a college replaces the district", a.S.scope === "college" && a.S.college === "Santiago Canyon College" &&
      a.S.district === "" && a.stash() === "college-briefing/college/Santiago%20Canyon%20College", a.stash());
    check("(7) nothing about the view is stored", a.writes.filter((k) => k !== "cpl_sb_return_tab").length === 0, a.writes.join());
  }
  {
    const b = await bootAt("#college-briefing/swp/OC");
    check("(3) ⭐ #college-briefing/swp/OC opens the Orange County region", b.S.scope === "swp" && b.S.swpRegion === "OC" &&
      b.title() === "Welcome, Orange County", b.title());
    check("(3) and reports it", b.stash() === "college-briefing/swp/OC", b.stash());
    const c = await bootAt("#college-briefing/district/Rancho%20Santiago%20Community%20College%20District");
    check("(3) ⭐ a district address opens that district", c.S.scope === "district" && c.S.district === "Rancho Santiago Community College District",
      c.S.district);
  }
  {
    const d = await bootAt("#college-briefing/district");
    check("(4) a scope alone opens its second question", d.S.scope === "district" && /Choose your district/.test(d.question()) &&
      d.stash() === "college-briefing/district", d.question() + " " + d.stash());
    const e = await bootAt("#college-briefing/statewide");
    check("(4) statewide opens the statewide view", e.S.scope === "statewide" && e.title() === "Statewide CPL view" &&
      e.stash() === "college-briefing/statewide", e.title());
    const f = await bootAt("#college-briefing/college");
    check("(4) college alone opens the college picker", f.S.scope === "college" && !f.S.college && /Choose your college/.test(f.question()) &&
      f.stash() === "college-briefing/college", f.question());
  }
  {
    const g = await bootAt("#college-briefing");
    check("(6) a bare #college-briefing asks first", g.asksScope() && g.S.scope === null && g.stash() === "college-briefing", String(g.S.scope));
    const h = await bootAt("#college-briefing/college/Nowhere%20College");
    check("(6) a college the list does not hold opens the college picker", h.S.scope === "college" && !h.S.college &&
      /Choose your college/.test(h.question()), h.question());
    const i = await bootAt("#college-briefing/swp/XX");
    check("(6) a region the roster does not hold opens the region question", i.S.scope === "swp" && !i.S.swpRegion &&
      /Strong Workforce region/.test(i.question()), i.question());
    const j = await bootAt("#college-briefing/senate");
    check("(6) a scope that is not ready leaves the question", j.asksScope() && j.stash() === "college-briefing", j.stash());
  }

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();

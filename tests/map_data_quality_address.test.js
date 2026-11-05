// MAP Data Quality: every view has an address (2026-11-04, "make that fix on all COBI views").
//
// Two modules paint the tab: map_cleanup_views.js (the CSM worklist's class words, the Credit by Exam guidance's tier
// words) and map_data_quality.js (the register's status words). The keeper (cpl_session.js) holds one view provider
// per tab, so both register the same one, and each reads only its own words from the address:
//   #map-data-quality/<p1..p5>/<tier-1..3>/<open|reported|in-progress|fixed|verified|wontfix>, each part optional.
//
// WHAT THIS GUARDS:
//   (1) an address opens the class, the tier (with the guidance open) and the status it names;
//   (2) the provider reports what is on screen after a switch, whichever module registered last;
//   (3) the bare #map-data-quality opens every default, as before, and reports the bare tab;
//   (4) a later visit on an address that names a view opens it; an unknown word changes nothing;
//   (5) nothing about the view is kept in browser storage.
//
// Run from repo root: `npm test` (or `node tests/map_data_quality_address.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const tick = () => new Promise((r) => setTimeout(r, 0));
const SESSION = fs.readFileSync("cpl_session.js", "utf8");
const MCV = fs.readFileSync("map_cleanup_views.js", "utf8");
const MDQ = fs.readFileSync("map_data_quality.js", "utf8");

const WORK = [
  { college_id: 1, college_name: "Big College", priority: 1, class: "cannot yield credit", rows: 9, action: "Rule these." },
  { college_id: 1, college_name: "Big College", priority: 5, class: "Credit by Exam", rows: 4, action: "Present these." },
];
const GUIDE = [
  { exhibit_id: "MOS-1", exhibit_title: "One", rows_n: 3, colleges_n: 2, tier: 1, peer_courses: [], map_action: "IN MAP: one." },
  { exhibit_id: "MOS-3", exhibit_title: "Three", rows_n: 1, colleges_n: 1, tier: 3, peer_courses: [], map_action: "IN MAP: three." },
];
const ISSUES = [
  { id: "a1", title: "Open thing", category: "other", severity: "low", status: "open" },
  { id: "a2", title: "Moving thing", category: "other", severity: "low", status: "in_progress" },
];

function page(hash) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-map-data-quality"><div id="mcw-root"></div><div id="mdq-root"></div></div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "outside-only" });
  const w = dom.window, local = {}, per = {};
  const bag = (o) => ({ getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } });
  Object.defineProperty(w, "localStorage", { value: bag(local), configurable: true });
  Object.defineProperty(w, "sessionStorage", { value: bag(per), configurable: true });
  w.fetch = (url) => {
    const u = String(url);
    const body = u.indexOf("map_cleanup_worklist") >= 0 ? WORK : u.indexOf("map_cx_exhibit_guidance") >= 0 ? GUIDE : ISSUES;
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(body))) });
  };
  w.eval(SESSION);
  w.CPL_TEAM_PHRASE = {
    session: () => ({ teamPass: "x", email: "(team)" }), decorateHeaders: (h) => { h["x-team-pass"] = "x"; },
    unlockRow: () => w.document.createElement("div"), sessionFor: () => ({ teamPass: "x", email: "(team)" }),
    isAuthError: () => false
  };
  return { w, local };
}
async function boot(hash) {
  const p = page(hash);
  p.w.eval(MDQ);
  p.w.eval(MCV);
  p.w.CPL_MAP_DQ.activate();
  p.w.CPL_CLEANUP_VIEWS.mount();
  for (let i = 0; i < 5; i++) await tick();
  return p;
}
function ask(p) { p.w.CPL_SESSION.stashReturnTab("map-data-quality"); return (JSON.parse(p.local.cpl_sb_return_tab) || {}).tab; }
function onChip(w, cls) { const b = w.document.querySelector("." + cls + ".on"); return b ? b.textContent : ""; }

(async function () {
  // (1) an address opens the views it names
  {
    const p = await boot("#map-data-quality/p5/tier-3/in-progress");
    const st = p.w.CPL_CLEANUP_VIEWS._state;
    check("(1) the class word opens P5", st.f.priority === "5" && /^P5/.test(onChip(p.w, "mcw-chip")), onChip(p.w, "mcw-chip"));
    const det = p.w.document.querySelector("details.mcw-guide");
    check("(1) the tier word opens the guidance on tier 3", det && det.open && st.guideTier === "3"
      && /^3 · title only/.test(det.querySelector(".mcw-chip.on").textContent));
    const cards = p.w.document.querySelectorAll("#mdq-root .mdq-card");
    check("(1) the status word opens In progress", cards.length === 1 && /Moving thing/.test(cards[0].textContent)
      && /^In progress/.test(onChip(p.w, "mdq-chip")));
    check("(2) ⭐ the provider reports all three words", ask(p) === "map-data-quality/p5/tier-3/in-progress", ask(p));

    // (2) switch views and the provider follows
    const all = Array.from(p.w.document.querySelectorAll(".mcw-chips")[0].querySelectorAll(".mcw-chip")).find((b) => /^All classes/.test(b.textContent));
    all.click();
    check("(2) All classes drops the class word", ask(p) === "map-data-quality/tier-3/in-progress", ask(p));
    det.open = false; det.dispatchEvent(new p.w.Event("toggle"));
    check("(2) a closed guidance drops the tier word (its words are out of sight)", ask(p) === "map-data-quality/in-progress", ask(p));
    const open = Array.from(p.w.document.querySelectorAll(".mdq-chip")).find((b) => /^Open/.test(b.textContent));
    open.click();
    check("(2) the Open status reports open", ask(p) === "map-data-quality/open", ask(p));
    open.click();
    check("(2) clearing the status reports the bare tab", ask(p) === "map-data-quality", ask(p));
    check("(5) nothing about the view is stored", !Object.keys(p.local).some((k) => k !== "cpl_sb_return_tab" && /view|filter|status|tier|prio/i.test(k)), Object.keys(p.local).join(","));
  }

  // (3) the bare address: every default, as before
  {
    const p = await boot("#map-data-quality");
    const st = p.w.CPL_CLEANUP_VIEWS._state;
    const det = p.w.document.querySelector("details.mcw-guide");
    check("(3) the bare tab opens All classes, the guidance closed, All statuses",
      st.f.priority === "" && det && !det.open && st.guideTier === ""
      && p.w.document.querySelectorAll("#mdq-root .mdq-card").length === 2 && /^All/.test(onChip(p.w, "mdq-chip")));
    check("(3) the bare tab reports itself", ask(p) === "map-data-quality", ask(p));

    // (4) a later visit on an address that names a view opens it
    p.w.history.replaceState(null, "", "#map-data-quality/p1/fixed");
    p.w.dispatchEvent(new p.w.CustomEvent("cpl-tab-activated", { detail: { tab: "map-data-quality" } }));
    check("(4) a later visit on #map-data-quality/p1/fixed opens P1 and Fixed",
      st.f.priority === "1" && /^Fixed/.test(onChip(p.w, "mdq-chip")) && ask(p) === "map-data-quality/p1/fixed", ask(p));
  }
  {
    const p = await boot("#map-data-quality/nonsense/p9/tier-7");
    const st = p.w.CPL_CLEANUP_VIEWS._state;
    check("(4) unknown words change nothing", st.f.priority === "" && st.guideTier === "" && ask(p) === "map-data-quality", ask(p));
  }
  // either module alone still answers (a load failure in one must not blank the other's word)
  {
    const p = page("#map-data-quality/reported");
    p.w.eval(MDQ);
    p.w.CPL_MAP_DQ.activate();
    for (let i = 0; i < 4; i++) await tick();
    check("(2) the register alone opens and reports its word", ask(p) === "map-data-quality/reported", ask(p));
  }

  let pass = 0;
  for (const [n, ok, why] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : "")); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });

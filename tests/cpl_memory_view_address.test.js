// Memory tab: every view has an address (SkyJujube, 2026-11-04).
//
// Asked in session, 2026-11-04: "make sure that the sign in link from the emails takes the user back to the view they
// logged in from", then "Should remember to make that fix on all COBI views". A magic link opens a new browser tab, so
// only the address survives. The tab's two views (Curate, Report) and an entry open in the ripple inspector open from
// #memory/<curate|report> and #memory/entry/<slug>, and the tab reports what is on screen.
//
// WHAT THIS GUARDS:
//   (1) ⭐ #memory/report opens the Report view, and reports it;
//   (2) switching to Curate reports the bare tab, though the address still says report;
//   (3) ⭐ #memory/entry/<slug> opens Curate on that entry once the rows load, and reports it; Back reports the bare tab;
//   (4) a later visit by an address opens its view (tabs.js fires onActivate once);
//   (5) a bare #memory opens Curate, and an unknown slug or word leaves the index.
//
// Run from repo root: `npm test` (or `node tests/cpl_memory_view_address.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const SRC = fs.readFileSync("cpl_memory.js", "utf8");
const TEAM = fs.readFileSync("team_phrase.js", "utf8");
const SESSION = fs.readFileSync("cpl_session.js", "utf8");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const tick = () => new Promise((r) => setTimeout(r, 0));

const ROWS = [
  { id: "11111111-1111-1111-1111-111111111111", slug: "pr1", kind: "procedure", status: "verified",
    summary: "Change the generator, not the HTML", detail: "Edit excel_to_dashboard.py.", tags: ["dashboard"],
    source: "CLAUDE.md Rule 1", affects: ["excel_to_dashboard.py"], related: [] },
  { id: "22222222-2222-2222-2222-222222222222", slug: "f1", kind: "fact", status: "verified",
    summary: "index.html and CPL_Dashboard.html must stay identical", detail: "The workflow copies one to the other.",
    tags: ["dashboard"], source: "CLAUDE.md Rule 4", affects: ["index.html"], related: [] }
];

async function bootAt(hash) {
  const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body><div id="tab-memory"><div id="memory-root"></div></div></body></html>`,
    { runScripts: "outside-only", url: "https://example.org/index.html" + hash });
  const w = dom.window, local = {}, per = {};
  const bag = (o) => ({ getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } });
  Object.defineProperty(w, "localStorage", { value: bag(local), configurable: true });
  Object.defineProperty(w, "sessionStorage", { value: bag(per), configurable: true });
  local.cpl_team_pass = "team-secret";
  w.fetch = (url) => Promise.resolve({ ok: true, status: 200,
    json: () => Promise.resolve(/cpl_memory\?/.test(String(url)) ? JSON.parse(JSON.stringify(ROWS)) : []) });
  w.eval(SESSION);
  w.eval(TEAM);
  w.eval(SRC);
  w.CPL_MEMORY.activate();
  await tick(); await tick();
  const root = w.document.getElementById("memory-root");
  const stash = () => { w.CPL_SESSION.stashReturnTab("memory"); return (JSON.parse(local.cpl_sb_return_tab || "{}")).tab; };
  const reportShown = () => { const r = root.querySelector(".mem-report"); return !!r && r.style.display !== "none"; };
  const seg = (label) => Array.prototype.filter.call(root.querySelectorAll(".mem-viewseg .mem-seg-btn"), (b) => b.textContent.trim() === label)[0];
  const entryShown = () => ((root.querySelector(".rp-slug") || {}).textContent || "");
  return { w, root, stash, reportShown, seg, entryShown };
}
const click = (w, el) => el && el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));

(async function () {
  {
    const a = await bootAt("#memory/report");
    check("(1) ⭐ #memory/report opens the Report view", a.reportShown() && a.seg("Report").getAttribute("aria-pressed") === "true");
    check("(1) and reports it", a.stash() === "memory/report", a.stash());
    click(a.w, a.seg("Curate"));
    check("(2) Curate reports the bare tab (the address still says report)", !a.reportShown() && a.stash() === "memory" &&
      a.w.location.hash === "#memory/report", a.stash() + " " + a.w.location.hash);
    // (4) a later visit
    a.w.location.hash = "#memory/report";
    a.w.dispatchEvent(new a.w.CustomEvent("cpl-tab-activated", { detail: { tab: "memory" } }));
    check("(4) a later visit by an address opens its view", a.reportShown() && a.stash() === "memory/report");
    a.w.location.hash = "#memory/entry/f1";
    a.w.dispatchEvent(new a.w.CustomEvent("cpl-tab-activated", { detail: { tab: "memory" } }));
    check("(4) a later visit to an entry opens it in Curate", !a.reportShown() && a.entryShown() === "f1" && a.stash() === "memory/entry/f1", a.entryShown());
  }
  {
    const b = await bootAt("#memory/entry/pr1");
    check("(3) ⭐ #memory/entry/<slug> opens Curate on that entry", !b.reportShown() && b.entryShown() === "pr1" &&
      !!b.root.querySelector(".mem-item.is-sel"), b.entryShown());
    check("(3) and reports it", b.stash() === "memory/entry/pr1", b.stash());
    click(b.w, b.root.querySelector(".rp-back"));
    check("(3) Back to targets reports the bare tab", b.entryShown() === "" && b.stash() === "memory", b.stash());
  }
  {
    const c = await bootAt("#memory");
    check("(5) a bare #memory opens Curate on the index", !c.reportShown() && c.entryShown() === "" && c.stash() === "memory");
    const u = await bootAt("#memory/entry/no-such-row");
    check("(5) an unknown slug leaves the index", !u.reportShown() && u.entryShown() === "" && u.stash() === "memory");
    const x = await bootAt("#memory/nonsense");
    check("(5) an unknown word leaves Curate", !x.reportShown() && x.stash() === "memory");
  }

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();

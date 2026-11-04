// Exhibit Adoption: every view has an address (SkyJujube, 2026-11-04).
//
// Asked in session, 2026-11-04: "make sure that the sign in link from the emails takes the user back to the view they
// logged in from", then "Should remember to make that fix on all COBI views". A magic link opens a new browser tab, so
// only the address survives. The tab's three sub-tabs (Credentials, Adoption table, Adoption matrix) and the matrix's
// Show in cells word open from #exhibit-adoption/<view>[/<cells>] and report what is on screen.
//
// WHAT THIS GUARDS:
//   (1) ⭐ #exhibit-adoption/matrix/opportunity opens the matrix showing opportunity only, and reports that address;
//   (2) switching sub-tabs reports the new view, though the address still names the old one;
//   (3) a later visit by an address opens its view (tabs.js fires onActivate once);
//   (4) a bare #exhibit-adoption opens Credentials, and #exhibit-adoption/adoption (the side menu's scroll target)
//       changes nothing;
//   (5) nothing is written to browser storage for the view.
//
// Run from repo root: `npm test` (or `node tests/eacr_view_address.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const SRC = fs.readFileSync("statewide_interactive.js", "utf8");
const SESSION = fs.readFileSync("cpl_session.js", "utf8");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function val(fn) { try { return fn(); } catch (e) { return undefined; } }

const exhibits = [
  { exhibit_id: "x1", exhibit_ids: ["x1"], title: "CompTIA A+", unified_title: "CompTIA A+",
    issuing_agency: "CompTIA", is_classified: true, cpl_type: "Industry Certification",
    collaborative_type: "CCC Collaborative", adopters: 2, adopter_names: ["Norco College", "Chaffey College"],
    adopter_units: { "Norco College": 4, "Chaffey College": 3 },
    potential: 0, potential_names: [], raw_titles: ["CompTIA A+"],
    credit_recs: [{ course: "CIS 110", credit: "4 hours in ICT" }] }
];

function bootAt(hash) {
  const html = `<!DOCTYPE html><html><head></head><body><div id="statewide-interactive-container"></div></body></html>`;
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/index.html" + hash });
  const w = dom.window, store = {};
  const bag = (o) => ({ getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; },
    get length() { return Object.keys(o).length; } });
  const local = {}, per = {};
  Object.defineProperty(w, "localStorage", { value: bag(local), configurable: true });
  Object.defineProperty(w, "sessionStorage", { value: bag(per), configurable: true });
  w.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  w.eval(SESSION);
  w.CPL_STATEWIDE = { exhibits };
  w.CPL_STATEWIDE_PRESCRIPTIVE = {};
  w.CCC_COLLEGE_LOOKUP = { "Norco College": { district: "Riverside CCD" }, "Chaffey College": { district: "Chaffey CCD" } };
  w.eval(SRC);   // no tabs.js: the tab starts at once, as its fallback does
  const doc = w.document;
  const stash = () => { w.CPL_SESSION.stashReturnTab("exhibit-adoption"); return (JSON.parse(local.cpl_sb_return_tab || "{}")).tab; };
  const on = () => val(() => doc.querySelector(".sw-subtab.on").getAttribute("data-view"));
  const shown = () => ["credentials", "table", "matrix"].filter((v) => !doc.getElementById("sw-view-" + v).hidden);
  return { w, doc, stash, on, shown, local, store };
}
const click = (w, el) => el && el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));

(async function () {
  // (1) the matrix on a cells word
  {
    const a = bootAt("#exhibit-adoption/matrix/opportunity");
    check("(1) ⭐ #exhibit-adoption/matrix/opportunity opens the matrix", a.on() === "matrix" && a.shown().join() === "matrix", a.on() + " " + a.shown());
    check("(1) on Opportunity only", val(() => a.doc.getElementById("mx-cells-opp").checked) === true);
    check("(1) and reports that address", a.stash() === "exhibit-adoption/matrix/opportunity", a.stash());
    // (2) switching
    click(a.w, a.doc.querySelector('.sw-subtab[data-view="table"]'));
    check("(2) the Adoption table reports its own address (the address still says the matrix)",
      a.stash() === "exhibit-adoption/table" && a.w.location.hash === "#exhibit-adoption/matrix/opportunity", a.stash() + " " + a.w.location.hash);
    click(a.w, a.doc.querySelector('.sw-subtab[data-view="matrix"]'));
    const both = a.doc.getElementById("mx-cells-both");
    both.checked = true; both.dispatchEvent(new a.w.Event("change", { bubbles: true }));
    check("(2) the matrix on Both reports the bare matrix", a.stash() === "exhibit-adoption/matrix", a.stash());
    click(a.w, a.doc.querySelector('.sw-subtab[data-view="credentials"]'));
    check("(2) Credentials reports the bare tab", a.stash() === "exhibit-adoption", a.stash());
    // (3) a later visit
    a.w.location.hash = "#exhibit-adoption/matrix/adopted";
    a.w.dispatchEvent(new a.w.CustomEvent("cpl-tab-activated", { detail: { tab: "exhibit-adoption" } }));
    check("(3) a later visit by an address opens its view", a.on() === "matrix" && val(() => a.doc.getElementById("mx-cells-got").checked) === true &&
      a.stash() === "exhibit-adoption/matrix/adopted", a.on() + " " + a.stash());
    check("(5) nothing is stored for the view but the sign-in return itself",
      Object.keys(a.local).filter((k) => k !== "cpl_sb_return_tab").length === 0, Object.keys(a.local).join());
  }
  // (4) the defaults
  {
    const b = bootAt("#exhibit-adoption");
    check("(4) a bare #exhibit-adoption opens Credentials", b.on() === "credentials" && b.shown().join() === "credentials");
    check("(4) and reports the bare tab", b.stash() === "exhibit-adoption", b.stash());
    const c = bootAt("#exhibit-adoption/adoption");
    check("(4) #exhibit-adoption/adoption (the side menu's scroll target) keeps Credentials", c.on() === "credentials", c.on());
    const t = bootAt("#exhibit-adoption/table");
    check("(4) #exhibit-adoption/table opens the Adoption table", t.on() === "table" && t.shown().join() === "table", t.on());
  }

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();

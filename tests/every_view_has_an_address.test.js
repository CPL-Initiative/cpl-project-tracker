// Every COBI view a person can switch to inside a tab has an address (SkyJujube, 2026-11-04).
//
// Asked in session, 2026-11-04: "make sure that the sign in link from the emails takes the user back to the view they
// logged in from", then "Should remember to make that fix on all COBI views". A magic link opens a new browser tab, so
// only the address survives the trip. Each tab with more than one view (1) opens the view its address names as a
// visit starts (CPL_SESSION.arrival) and (2) reports the view it shows (CPL_SESSION.viewAddress), as the address (1)
// opens. Only the address carries a view; nothing is stored, so tabs still never remember a filter across visits.
//
// WHAT THIS GUARDS:
//   (A) the keeper's arrival(): the parts after the tab, decoded; null for another tab, a bare tab or a sign-in link;
//   (B) ⭐ every tab below registers both halves under its own id. A tab added to COBI with views joins this list;
//   (C) ⭐ any file that reads an arrival also reports a view, so a new view cannot skip half the pair;
//   (D) no tab writes a view into browser storage for this (the address is the only carrier).
//
// Run from repo root: `npm test` (or `node tests/every_view_has_an_address.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const SESSION = fs.readFileSync("cpl_session.js", "utf8");

/* Each tab with views: its id and the module(s) holding the pair. The six Commons tabs reported first (#2775) and
   read their own sub-addresses through routeFromHash, so for them (C) asks only the report. */
const TABS = [
  ["exhibits", ["exhibits.js"]], ["cr-reference", ["cr_reference.js"]], ["program-requirements", ["program_requirements.js"]],
  ["credential-reference", ["credential_reference.js"]], ["canonical-subj4", ["canonical_subj4.js"]], ["coci-lookup", ["coci_lookup.js"]],
  ["letters", ["comms.js"]], ["implementation-funding", ["cpl_funding.js"]], ["csm-workspace", ["csm_workspace.js"]],
  ["tmc-builder", ["tmc_builder.js"]], ["exhibit-adoption", ["statewide_interactive.js"]], ["cip-crosswalk", ["cip_crosswalk.js"]],
  ["memory", ["cpl_memory.js"]], ["raci", ["raci.js"]], ["map-users", ["map_users.js"]], ["sierra-training", ["sierra_training.js"]],
  ["college-briefing", ["college_briefing.js"]], ["cpl-pathways", ["cpl_pathways.js"]], ["cpl-news", ["cpl_news.js"]],
  ["nc-learning-partners", ["nc_learning_partners.js"]], ["gr-priorities", ["gr_priorities.js"]], ["commons", ["commons.js"]],
  ["map-data-quality", ["map_data_quality.js", "map_cleanup_views.js"]], ["admin", ["admin.js"]],
  ["activities-projects", ["dashboard_filters.js"]], ["contracts", ["contracts.js"]], ["map-queue", ["map_team_queue.js"]]
];
const READS_OWN_ROUTE = { "exhibits": 1, "cr-reference": 1, "program-requirements": 1, "credential-reference": 1, "canonical-subj4": 1, "coci-lookup": 1, "letters": 1 };

(function () {
  // ── (A) the keeper ───────────────────────────────────────────────────────
  function at(hash) {
    const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://example.org/index.html" + hash, runScripts: "outside-only" });
    const w = dom.window, bag = () => { const o = {}; return { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } }; };
    Object.defineProperty(w, "localStorage", { value: bag(), configurable: true });
    Object.defineProperty(w, "sessionStorage", { value: bag(), configurable: true });
    w.fetch = () => Promise.resolve({ ok: false, status: 400 });
    w.eval(SESSION);
    return w;
  }
  check("(A) ⭐ the parts after the tab", JSON.stringify(at("#csm-workspace/due").CPL_SESSION.arrival("csm-workspace")) === '["due"]');
  check("(A) several parts, decoded", JSON.stringify(at("#college-briefing/college/Santa%20Ana%20College").CPL_SESSION.arrival("college-briefing")) === '["college","Santa Ana College"]');
  check("(A) a bare tab has no view", at("#csm-workspace").CPL_SESSION.arrival("csm-workspace") === null);
  check("(A) another tab's address is not this tab's", at("#csm-workspace-old/due").CPL_SESSION.arrival("csm-workspace") === null);
  check("(A) a sign-in link is never a view", at("#access_token=x.y.z").CPL_SESSION.arrival("access_token=x.y.z") === null);

  // ── (B), (C), (D) every tab ──────────────────────────────────────────────
  TABS.forEach(function (t) {
    const id = t[0], srcs = t[1].map((f) => fs.existsSync(f) ? fs.readFileSync(f, "utf8") : "");
    const all = srcs.join("\n");
    const reports = new RegExp("CPL_SESSION\\.viewAddress\\(\\s*(?:[\"']" + id.replace(/-/g, "\\-") + "[\"']|[A-Z_]+)").test(all);
    const reads = READS_OWN_ROUTE[id] || new RegExp("CPL_SESSION\\.arrival\\(\\s*(?:[\"']" + id.replace(/-/g, "\\-") + "[\"']|[A-Z_]+)").test(all);
    check("(B) ⭐ " + id + " reports the view it shows", reports, t[1].join(", "));
    check("(B) ⭐ " + id + " opens the view its address names", reads, t[1].join(", "));
    check("(D) " + id + " keeps no view in browser storage for the return",
      !/(local|session)Storage\.setItem\([^)]*(?:view_?addr|return_?view|cpl_view)/i.test(all));
  });
  const files = fs.readdirSync(".").filter((f) => /\.js$/.test(f) && f !== "cpl_session.js");
  files.forEach(function (f) {
    const s = fs.readFileSync(f, "utf8");
    if (/CPL_SESSION\.arrival\(/.test(s)) check("(C) ⭐ " + f + " reads an arrival, so it reports a view too", /CPL_SESSION\.viewAddress\(/.test(s));
  });

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();

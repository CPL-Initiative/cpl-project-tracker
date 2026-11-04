// A sign-in link returns to the VIEW it was asked from, not just the tab.
//
// Asked in session, 2026-11-04 (SkyJujube): "make sure that the sign in link from the emails takes the user back to
// the view they logged in from". Most Commons tabs switch views without writing the address, so the address alone
// would send a person from Exhibits' List back to the tab's first view. Each such tab tells the keeper its view
// (cpl_session.js viewAddress), as the address its own routeFromHash opens.
//
// WHAT THIS GUARDS:
//   (A) the keeper asks the tab's provider first, and the provider wins over a stale address;
//   (B) a provider's answer outside its tab, or one that throws, falls back to the address, then the name;
//   (C) ⭐ every Commons tab registers one, reading state.ls without listState() (which creates or consumes state);
//   (D) ⭐ end to end on COCI Lookup: the Courses List on a filter, then Progress, each stash the address that view
//       opens from, and the address opens it again.
//
// Run from repo root: `npm test` (or `node tests/signin_returns_to_view.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const SESSION = fs.readFileSync("cpl_session.js", "utf8");
function json(s) { try { return JSON.parse(s); } catch (e) { return null; } }

function page(hash, runScripts) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div class="main-container"><div id="coci-lookup-root"></div></div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: runScripts || "outside-only" });
  const w = dom.window, local = {}, per = {};
  const bag = (o) => ({ getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } });
  Object.defineProperty(w, "localStorage", { value: bag(local), configurable: true });
  Object.defineProperty(w, "sessionStorage", { value: bag(per), configurable: true });
  w.fetch = () => Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
  return { w, local };
}
function stashed(local) { return (json(local.cpl_sb_return_tab) || {}).tab; }

(async function () {
  // ── (A) and (B): the keeper ──────────────────────────────────────────────
  {
    const { w, local } = page("#exhibits/list/left");
    w.eval(SESSION);
    w.CPL_SESSION.viewAddress("exhibits", () => "exhibits/progress");
    w.CPL_SESSION.stashReturnTab("exhibits");
    check("(A) ⭐ the tab's own view wins over a stale address", stashed(local) === "exhibits/progress", stashed(local));
  }
  {
    const { w, local } = page("#exhibits/list/left");
    w.eval(SESSION);
    w.CPL_SESSION.viewAddress("exhibits", () => "memory/elsewhere");
    w.CPL_SESSION.stashReturnTab("exhibits");
    check("(B) an answer outside the tab is ignored; the address stands", stashed(local) === "exhibits/list/left", stashed(local));
  }
  {
    const { w, local } = page("");
    w.eval(SESSION);
    w.CPL_SESSION.viewAddress("exhibits", () => { throw new Error("boom"); });
    w.CPL_SESSION.stashReturnTab("exhibits");
    check("(B) a provider that throws keeps the tab's name", stashed(local) === "exhibits", stashed(local));
  }
  {
    const { w, local } = page("#cr-reference");
    w.eval(SESSION);
    w.CPL_SESSION.viewAddress("exhibits", () => "exhibits/progress");
    w.CPL_SESSION.stashReturnTab("cr-reference");
    check("(B) another tab's provider is never asked", stashed(local) === "cr-reference", stashed(local));
  }

  // ── (C) every Commons tab registers its view ─────────────────────────────
  const TABS = [["exhibits.js", '"exhibits"'], ["cr_reference.js", '"cr-reference"'], ["program_requirements.js", '"program-requirements"'],
    ["credential_reference.js", '"credential-reference"'], ["canonical_subj4.js", "QS_TAB"], ["coci_lookup.js", "TAB"]];
  TABS.forEach(function (t) {
    const s = fs.readFileSync(t[0], "utf8");
    const i = s.indexOf("CPL_SESSION.viewAddress(" + t[1]);
    check("(C) ⭐ " + t[0] + " tells the keeper its view", i > 0);
    const body = i > 0 ? s.slice(i, s.indexOf("});", i)) : "";
    check("(C) " + t[0] + "'s provider never calls listState()", body && !/listState\(\)/.test(body), body.slice(0, 120));
  });

  // ── (D) end to end on COCI Lookup ────────────────────────────────────────
  {
    const { w, local } = page("#coci-lookup/list/nomid", "dangerously");
    w.eval(SESSION);
    w.CPL_COCI_LOOKUP = { _built_at: "2026-07-09", colleges: ["American River College"],
      rows: [[0, "CCC1", "ENGL", "300", "College Composition", 4, "C", "1501.00: English", "", "", "ENGL M1001"],
             [0, "CCC3", "ENGL", "100", "Freshman Composition", 4, "C", "1501.00: English", "", "", ""]] };
    w.CPL_TABS = { loadScript: function (s, name, cb) {
      if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = fs.readFileSync("commons_list.js", "utf8"); w.document.body.appendChild(e); }
      if (s === "unified_courses_members.js") w.CPL_UC_MEMBERS = { generated_at: "2026-11-01", colleges: ["American River College"], members: { "ENGL M1001": [{ c: 0, cn: "CCC1" }] } };
      setTimeout(cb, 0);
    } };
    const e = w.document.createElement("script"); e.textContent = fs.readFileSync("coci_lookup.js", "utf8"); w.document.body.appendChild(e);
    w.CPL_COCI_LOOKUP_TAB.activate();
    await new Promise((r) => setTimeout(r, 60));
    w.CPL_SESSION.stashReturnTab("coci-lookup");
    check("(D) ⭐ on the Courses List, filter No M-ID, the stash is that view", stashed(local) === "coci-lookup/list/nomid", stashed(local));
    const prog = Array.from(w.document.querySelectorAll("button")).find((b) => b.textContent.trim() === "Progress");
    check("(D) the Progress word is on the page", !!prog);
    if (prog) prog.click();
    await new Promise((r) => setTimeout(r, 20));
    w.CPL_SESSION.stashReturnTab("coci-lookup");
    check("(D) ⭐ after moving to Progress, the stash follows (the address still says the List)",
      stashed(local) === "coci-lookup/progress" && w.location.hash === "#coci-lookup/list/nomid", stashed(local) + " " + w.location.hash);
    // The stash is an address the tab opens: land on it and the tab shows Progress again.
    const back = page("#" + stashed(local), "dangerously");
    back.w.CPL_COCI_LOOKUP = w.CPL_COCI_LOOKUP; back.w.CPL_TABS = { loadScript: function (s, n, cb) { setTimeout(cb, 0); } };
    const e2 = back.w.document.createElement("script"); e2.textContent = fs.readFileSync("coci_lookup.js", "utf8"); back.w.document.body.appendChild(e2);
    back.w.CPL_COCI_LOOKUP_TAB.activate();
    await new Promise((r) => setTimeout(r, 30));
    const on = back.w.document.querySelector(".cplcoci-viewbtn.on");
    check("(D) ⭐ the stashed address opens the same view", on && on.textContent.trim() === "Progress", on && on.textContent);
  }

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();

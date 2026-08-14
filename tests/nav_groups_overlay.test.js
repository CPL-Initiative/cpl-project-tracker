// nav_groups.js × nav_overlay.js — does the RAIL actually change, and does it
// survive the overlay failing? (Session 156) — jsdom test.
//
// tests/nav_overlay.test.js proves the arrangement MODEL is right. This proves
// the DOM half honours it, and — the part that matters — that every failure mode
// still leaves a working menu.
//
// The nav is the entry point for every visitor including anonymous ones, so the
// asymmetry is deliberate: a feature that silently does nothing is an annoyance,
// a menu that silently disappears is an outage.
//
// Also guards two things that would break the rest of the app invisibly:
//  * REBUILDING MOVES THE EXISTING BUTTONS. tabs.js derives VALID_TABS from
//    these elements and other modules hold references and bound listeners, so a
//    rebuild that recreated them would break navigation on click only.
//  * A HIDDEN TAB STAYS IN THE DOM. Hiding is a menu setting; the pane and its
//    deep link still work, and removing the button would break tabs.js's routing
//    for a tab that was merely tidied out of the menu.
//
// Run from repo root: `npm test` (or `node tests/nav_groups_overlay.test.js`).

const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const OVERLAY_SRC = fs.readFileSync("nav_overlay.js", "utf8");
const NAVGROUPS_SRC = fs.readFileSync("nav_groups.js", "utf8");
const ORGS_SRC = fs.readFileSync("cobi_orgs.js", "utf8");

const NAV = `
  <div class="header"><div class="cobi-brand"><div class="cobi-brandtext"><h1>COBI</h1></div></div></div>
  <nav class="cpl-tabs">
    <button class="cpl-tab active" data-tab="dashboard">Dashboard</button>
    <button class="cpl-tab" data-tab="admin">Admin</button>
    <button class="cpl-tab" data-tab="contracts">Contracts</button>
    <button class="cpl-tab" data-tab="budget">Budget</button>
    <button class="cpl-tab" data-tab="implementation-funding">Implementation Funding</button>
    <button class="cpl-tab" data-tab="sierra-training">Sierra Training</button>
    <button class="cpl-tab" data-tab="governance">Governance</button>
    <button class="cpl-tab" data-tab="cpl-news">CPL News</button>
  </nav>`;

function makeWin(opts) {
  opts = opts || {};
  const dom = new JSDOM(`<!doctype html><html><body>${NAV}</body></html>`,
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.fetch = function () {
    // `pending` never settles — the only way to observe the state a real visitor
    // sees while the overlay read is still in flight.
    if (opts.pending) return new Promise(function () {});
    if (opts.fetchFails) return Promise.reject(new Error("offline"));
    return Promise.resolve({ ok: true, json: () => Promise.resolve(opts.nav || []) });
  };
  [OVERLAY_SRC, NAVGROUPS_SRC, ORGS_SRC].forEach((src) => {
    const el = w.document.createElement("script"); el.textContent = src;
    w.document.body.appendChild(el);
  });
  return w;
}
const railOrder = (w) => Array.prototype.slice
  .call(w.document.querySelectorAll("nav.cpl-tabs .cpl-tab[data-tab]"))
  .map((b) => b.getAttribute("data-tab"));
const groupIds = (w) => Array.prototype.slice
  .call(w.document.querySelectorAll("nav.cpl-tabs .cpl-nav-group"))
  .map((g) => g.getAttribute("data-nav-group"));

// ── The menu builds from code WHILE the read is still in flight ─────────────
// The overlay fetch here NEVER resolves, so this is exactly what a visitor on a
// slow or blocked connection sees. It has to be a complete, usable menu.
(async function () {
  const w = makeWin({ pending: true });
  await new Promise((r) => setTimeout(r, 40));
  check("the rail is grouped from code defaults while the overlay is still loading",
    groupIds(w).length > 0);
  check("every tab is present with the read still pending", railOrder(w).length === 8);
  check("the funding group carries its shipped order",
    (function () {
      const g = w.document.querySelector('[data-nav-group="funding"]');
      return g && Array.prototype.slice.call(g.querySelectorAll(".cpl-tab"))
        .map((b) => b.getAttribute("data-tab")).join(",") === "contracts,budget,implementation-funding";
    })());
  check("a never-resolving overlay never blanks the menu", railOrder(w).length === 8);
})();

// ── An overlay that arrives rearranges the LIVE rail ────────────────────────
(async function () {
  const w = makeWin({
    nav: [
      { kind: "tab", key: "implementation-funding", parent: "funding", sort_order: 0 },
      { kind: "tab", key: "budget", parent: "funding", sort_order: 1 },
      { kind: "tab", key: "contracts", parent: "funding", sort_order: 2 },
      { kind: "group", key: "funding", label: "Money", sort_order: 0 },
      { kind: "tab", key: "cpl-news", label: "Newsroom" },
    ],
  });
  const before = railOrder(w).join(",");
  await new Promise((r) => setTimeout(r, 40));
  const g = w.document.querySelector('[data-nav-group="funding"]');
  check("the overlay reorders the live rail without a reload",
    g && Array.prototype.slice.call(g.querySelectorAll(".cpl-tab"))
      .map((b) => b.getAttribute("data-tab")).join(",") === "implementation-funding,budget,contracts");
  check("a renamed group shows its new heading",
    /Money/.test(w.document.querySelector('[data-nav-group="funding"] .cpl-nav-group-head').textContent));
  check("a renamed tab shows its new label",
    w.document.querySelector('.cpl-tab[data-tab="cpl-news"]').textContent === "Newsroom");
  check("the rearrangement actually changed something", railOrder(w).join(",") !== before);
  check("no tab is lost in the rebuild", railOrder(w).length === 8);
  check("groups are not duplicated by the rebuild",
    groupIds(w).length === new Set(groupIds(w)).size);
})();

// ── Rebuilding must MOVE the buttons, never recreate them ───────────────────
(async function () {
  const w = makeWin({ nav: [{ kind: "tab", key: "budget", parent: "funding", sort_order: 0 }] });
  const btn = w.document.querySelector('.cpl-tab[data-tab="budget"]');
  let clicked = 0;
  btn.addEventListener("click", function () { clicked++; });
  await new Promise((r) => setTimeout(r, 40));
  const after = w.document.querySelector('.cpl-tab[data-tab="budget"]');
  check("the rebuild reuses the SAME button element", after === btn);
  after.dispatchEvent(new w.MouseEvent("click"));
  check("listeners bound by other modules survive the rebuild", clicked === 1);
})();

// ── A hidden tab leaves the menu but stays routable ─────────────────────────
(async function () {
  const w = makeWin({ nav: [{ kind: "tab", key: "governance", hidden: true }] });
  await new Promise((r) => setTimeout(r, 40));
  const btn = w.document.querySelector('.cpl-tab[data-tab="governance"]');
  check("a hidden tab is still IN the DOM, so tabs.js can still route to it", !!btn);
  check("a hidden tab is not visible in the menu", btn.style.display === "none");
  check("a hidden tab is marked for other modules to read",
    btn.getAttribute("data-nav-hidden") === "1");
  check("tabs that were not hidden are untouched",
    w.document.querySelector('.cpl-tab[data-tab="budget"]').style.display !== "none");
})();

// ── Every failure mode still leaves a working menu ──────────────────────────
(async function () {
  {
    const w = makeWin({ fetchFails: true });
    await new Promise((r) => setTimeout(r, 40));
    check("an offline overlay leaves the full shipped menu", railOrder(w).length === 8);
    check("an offline overlay leaves the groups intact", groupIds(w).length > 0);
    // Scoped to non-EXCLUSIVE tabs: cobi_orgs.js legitimately hides `contracts`
    // in the default CPL view, and that is the site filter doing its job, not
    // the overlay. Conflating the two would make this assertion meaningless.
    const exclusive = w.CPL_ORGS.EXCLUSIVE || [];
    check("an offline overlay hides nothing of its own",
      railOrder(w).filter((t) => exclusive.indexOf(t) === -1)
        .every((t) => w.document.querySelector(`.cpl-tab[data-tab="${t}"]`).style.display !== "none"));
  }
  {
    // The nastiest case: plan() itself throwing. nav_groups.js catches it and
    // falls back, because a thrown error mid-build would leave a half-built rail.
    const w = makeWin({ nav: [{ kind: "tab", key: "budget" }] });
    await new Promise((r) => setTimeout(r, 40));
    w.CPL_NAV_OVERLAY.plan = function () { throw new Error("boom"); };
    w.CPL_NAV_GROUPS.build({ rebuild: true });
    check("a throwing plan() falls back to the shipped menu, fully intact",
      railOrder(w).length === 8 && groupIds(w).length > 0);
  }
  {
    // An overlay that hides everything must still leave Admin and Dashboard.
    const w = makeWin({
      nav: ["dashboard", "admin", "contracts", "budget", "implementation-funding",
        "sierra-training", "governance", "cpl-news"]
        .map((k) => ({ kind: "tab", key: k, hidden: true })),
    });
    await new Promise((r) => setTimeout(r, 40));
    const visible = railOrder(w).filter(
      (t) => w.document.querySelector(`.cpl-tab[data-tab="${t}"]`).style.display !== "none");
    check("an overlay hiding EVERY tab still leaves Admin reachable", visible.indexOf("admin") !== -1);
    check("…and Dashboard", visible.indexOf("dashboard") !== -1);
    check("…and hides the rest, so the control is not a lie", visible.length === 2);
  }
})();

setTimeout(function () {
  let pass = 0;
  results.forEach(([n, ok]) => { console.log((ok ? "  ok   " : "  FAIL ") + n); if (ok) pass++; });
  console.log(`\nnav_groups_overlay.test.js: ${pass}/${results.length} checks passed`);
  if (pass !== results.length) process.exit(1);
}, 400);

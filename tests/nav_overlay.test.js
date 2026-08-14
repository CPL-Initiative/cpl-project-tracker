// nav_overlay.js — the side menu as data (Session 156, Sam: "let's build the
// drag and drop now") — jsdom test.
//
// THIS IS THE HIGHEST-BLAST-RADIUS CHANGE IN THE PROJECT. The nav is the entry
// point for every visitor, including anonymous ones. A nav that fails closed is
// a site with no navigation at all, so most of this file is about the FAIL-SAFE
// rather than the feature:
//
//  (a) NO OVERLAY, A FAILED READ, A MALFORMED ROW, A THROWING plan() — every one
//      of those must land on exactly the shipped menu.
//  (b) THE LOCKOUT GUARD. `admin` cannot be hidden, cannot lose its pin, cannot
//      be dragged into a group, and is LIFTED OUT of a group that gets hidden.
//      One row hiding Admin would remove the only surface that can un-hide it,
//      from every browser at once, with nothing to deploy in between.
//  (c) ORDERING IS DETERMINISTIC. Ties decide menu order, so the sort is
//      explicitly stable rather than trusting the engine.
//  (d) AN OVERLAY THAT OUTLIVES THE CODE degrades: a tab that no longer exists
//      is ignored, a parent naming a deleted group falls back to top level.
//
// Run from repo root: `npm test` (or `node tests/nav_overlay.test.js`).

const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("nav_overlay.js", "utf8");

// The real code defaults, so the fixtures cannot drift from the shipped menu.
const NAV_GROUPS_SRC = fs.readFileSync("nav_groups.js", "utf8");
const GROUPS = (function () {
  const m = NAV_GROUPS_SRC.match(/var GROUPS = (\[[\s\S]*?\n  \]);/);
  // eslint-disable-next-line no-eval
  return eval(m[1]);
})();

function makeWin(opts) {
  opts = opts || {};
  const dom = new JSDOM("<!doctype html><html><body></body></html>",
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.fetch = function () {
    if (opts.fetchFails) return Promise.reject(new Error("offline"));
    if (opts.httpError) return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve(null) });
    return Promise.resolve({ ok: true, json: () => Promise.resolve(opts.rows || []) });
  };
  const el = w.document.createElement("script"); el.textContent = SRC;
  w.document.body.appendChild(el);
  return w;
}
const TABS = ["dashboard", "admin", "sierra-training", "team-phrases", "governance",
  "budget", "contracts", "implementation-funding", "cpl-news", "our-process"];

// ── (a) the fail-safe ───────────────────────────────────────────────────────
(async function () {
  {
    const w = makeWin({ rows: [] });
    const ov = w.CPL_NAV_OVERLAY;
    const p = ov.plan(GROUPS, TABS);
    // With no overlay rows the plan must reproduce the code defaults exactly.
    const codeFunding = GROUPS.filter((g) => g.id === "funding")[0].tabs.filter((t) => TABS.indexOf(t) !== -1);
    const planFunding = p.groups.filter((g) => g.id === "funding")[0].tabs;
    check("an empty overlay reproduces the shipped grouping exactly",
      planFunding.join(",") === codeFunding.join(","));
    check("an empty overlay hides nothing", p.hidden.length === 0);
    // plan() keeps EMPTY groups on purpose: the rail drops them (makeGroup
    // returns null for no members) but the editor needs them as drop targets.
    check("group order matches the shipped order",
      p.groups.map((g) => g.id).join(",") === GROUPS.map((g) => g.id).join(","));
    check("ungrouped tabs stay top level", p.top.indexOf("dashboard") !== -1 && p.top.indexOf("admin") !== -1);
  }
  {
    const w = makeWin({ fetchFails: true });
    await new Promise((r) => setTimeout(r, 20));
    const ov = w.CPL_NAV_OVERLAY;
    check("a failed fetch leaves NO overlay rather than a broken one", ov.rows() === null);
    check("a failed fetch still returns the shipped plan", ov.plan(GROUPS, TABS).groups.length > 0);
    check("a failed fetch is not treated as 'everything hidden'", ov.plan(GROUPS, TABS).hidden.length === 0);
  }
  {
    const w = makeWin({ httpError: true });
    await new Promise((r) => setTimeout(r, 20));
    check("an HTTP error is the same as no overlay", w.CPL_NAV_OVERLAY.rows() === null);
  }
  {
    // The shape guard: garbage must be dropped, not thrown on. A TypeError
    // inside the nav build takes out the whole rail.
    const w = makeWin({ rows: [null, 42, { kind: "nope", key: "x" }, { kind: "tab" }, "str",
      { kind: "tab", key: "budget", sort_order: "first", orgs: "cpl", hidden: "yes" }] });
    await new Promise((r) => setTimeout(r, 20));
    const ov = w.CPL_NAV_OVERLAY;
    const rows = ov.rows();
    check("malformed overlay rows are dropped, not trusted", rows.length === 1 && rows[0].key === "budget");
    check("a non-numeric sort_order degrades to null", rows[0].sort_order === null);
    check("a non-array orgs degrades to null", rows[0].orgs === null);
    check("a non-boolean hidden degrades to false", rows[0].hidden === false);
    check("the plan still builds over garbage input", ov.plan(GROUPS, TABS).groups.length > 0);
  }
  {
    // plan() must survive nonsense arguments — nav_groups.js wraps the call in a
    // try/catch, but the module should not need it.
    const w = makeWin({ rows: [] });
    const ov = w.CPL_NAV_OVERLAY;
    let ok = true;
    try { ov.plan(null, null); ov.plan(undefined, TABS); ov.plan(GROUPS, "nope"); } catch (e) { ok = false; }
    check("plan() tolerates missing or wrong-typed arguments", ok);
  }
})();

// ── (b) the lockout guard ───────────────────────────────────────────────────
(async function () {
  const w = makeWin({
    rows: [
      { kind: "tab", key: "admin", hidden: true, parent: "sierra", pinned: false },
      { kind: "tab", key: "dashboard", hidden: true },
      { kind: "group", key: "sierra", hidden: true },
    ],
  });
  await new Promise((r) => setTimeout(r, 20));
  const ov = w.CPL_NAV_OVERLAY;
  const p = ov.plan(GROUPS, TABS);

  check("a row hiding Admin is ignored", p.hidden.indexOf("admin") === -1);
  check("Admin stays reachable at the top level", p.top.indexOf("admin") !== -1);
  check("a row hiding Dashboard is ignored", p.hidden.indexOf("dashboard") === -1);
  check("Admin is LIFTED OUT of a hidden group rather than vanishing with it",
    p.groups.filter((g) => g.id === "sierra").length === 0 && p.top.indexOf("admin") !== -1);
  check("Admin keeps its pin even when a row unsets it", ov.isPinned("admin") === true);
  check("isHidden() refuses to report a protected tab as hidden",
    ov.isHidden("admin") === false && ov.isHidden("dashboard") === false);
  // The non-protected members of that hidden group SHOULD disappear — otherwise
  // hiding a group does nothing and the control is a lie.
  check("hiding a group does hide its ordinary members", p.hidden.indexOf("sierra-training") !== -1);
})();

// ── (c) ordering ────────────────────────────────────────────────────────────
(async function () {
  const w = makeWin({
    rows: [
      { kind: "tab", key: "contracts", parent: "funding", sort_order: 0 },
      { kind: "tab", key: "budget", parent: "funding", sort_order: 1 },
      { kind: "tab", key: "implementation-funding", parent: "funding", sort_order: 2 },
      { kind: "group", key: "funding", sort_order: 0, label: "Money" },
      { kind: "group", key: "workplan", sort_order: 1 },
    ],
  });
  await new Promise((r) => setTimeout(r, 20));
  const ov = w.CPL_NAV_OVERLAY;
  const p = ov.plan(GROUPS, TABS);
  const funding = p.groups.filter((g) => g.id === "funding")[0];
  check("tabs honour their saved order", funding.tabs.join(",") === "contracts,budget,implementation-funding");
  check("a renamed group shows its new name", funding.label === "Money");
  check("groups honour their saved order", p.groups[0].id === "funding");
  check("a group with no saved order still appears", p.groups.some((g) => g.id === "reference"));

  // Ties must resolve to code order, deterministically, in every engine.
  const w2 = makeWin({
    rows: [
      { kind: "tab", key: "budget", parent: "funding", sort_order: 5 },
      { kind: "tab", key: "contracts", parent: "funding", sort_order: 5 },
      { kind: "tab", key: "implementation-funding", parent: "funding", sort_order: 5 },
    ],
  });
  await new Promise((r) => setTimeout(r, 20));
  const tied = w2.CPL_NAV_OVERLAY.plan(GROUPS, TABS).groups.filter((g) => g.id === "funding")[0].tabs;
  const codeOrder = GROUPS.filter((g) => g.id === "funding")[0].tabs.filter((t) => TABS.indexOf(t) !== -1);
  check("equal sort orders fall back to the shipped order, stably",
    tied.join(",") === codeOrder.join(","));
})();

// ── (d) an overlay that outlives the code ───────────────────────────────────
(async function () {
  const w = makeWin({
    rows: [
      { kind: "tab", key: "a-tab-that-no-longer-exists", parent: "funding", sort_order: 0 },
      { kind: "tab", key: "governance", parent: "a-group-that-was-deleted" },
      { kind: "tab", key: "cpl-news", parent: "funding" },
    ],
  });
  await new Promise((r) => setTimeout(r, 20));
  const p = w.CPL_NAV_OVERLAY.plan(GROUPS, TABS);
  const flat = p.groups.reduce((a, g) => a.concat(g.tabs), []).concat(p.top);
  check("an overlay row for a tab that no longer exists is ignored",
    flat.indexOf("a-tab-that-no-longer-exists") === -1);
  check("a parent naming a deleted group degrades to top level, never vanishing",
    p.top.indexOf("governance") !== -1);
  check("every present tab still appears exactly once",
    TABS.every((t) => flat.filter((x) => x === t).length === 1));
  check("a tab moved into another group lands there",
    p.groups.filter((g) => g.id === "funding")[0].tabs.indexOf("cpl-news") !== -1);
})();

// ── the editor view shares one placement with the rail ──────────────────────
(async function () {
  const w = makeWin({ rows: [{ kind: "tab", key: "cpl-news", hidden: true }] });
  await new Promise((r) => setTimeout(r, 20));
  const p = w.CPL_NAV_OVERLAY.plan(GROUPS, TABS);
  const railFlat = p.groups.reduce((a, g) => a.concat(g.tabs), []).concat(p.top);
  const editFlat = p.all.groups.reduce((a, g) => a.concat(g.tabs.map((e) => e.tab)), [])
    .concat(p.all.top.map((e) => e.tab));
  check("the rail omits a hidden tab", railFlat.indexOf("cpl-news") === -1);
  check("the EDITOR still shows it, in position — otherwise it can never be unhidden",
    editFlat.indexOf("cpl-news") !== -1);
  check("the editor marks it as hidden",
    p.all.groups.concat([{ tabs: p.all.top }])
      .reduce((a, g) => a.concat(g.tabs), [])
      .filter((e) => e.tab === "cpl-news")[0].hidden === true);
  check("the editor sees every present tab", TABS.every((t) => editFlat.indexOf(t) !== -1));
})();

// ── cache behaviour ─────────────────────────────────────────────────────────
(async function () {
  const w = makeWin({ rows: [{ kind: "tab", key: "budget", label: "Money" }] });
  await new Promise((r) => setTimeout(r, 20));
  check("a successful read is cached for the next visit",
    /budget/.test(w.localStorage.getItem("cplNavOverlay.v1") || ""));
  check("the label lookup returns the override", w.CPL_NAV_OVERLAY.labelFor("budget") === "Money");
  check("an untouched tab has no label override", w.CPL_NAV_OVERLAY.labelFor("governance") === null);

  // A poisoned cache must not survive sanitising, and must never be fatal.
  const w2 = makeWin({ fetchFails: true });
  w2.localStorage.setItem("cplNavOverlay.v1", "{not json");
  let ok = true;
  try { await w2.CPL_NAV_OVERLAY.load(); } catch (e) { ok = false; }
  check("a corrupt cache is survivable and leaves the shipped menu",
    ok && w2.CPL_NAV_OVERLAY.plan(GROUPS, TABS).groups.length > 0);
})();

setTimeout(function () {
  let pass = 0;
  results.forEach(([n, ok]) => { console.log((ok ? "  ok   " : "  FAIL ") + n); if (ok) pass++; });
  console.log(`\nnav_overlay.test.js: ${pass}/${results.length} checks passed`);
  if (pass !== results.length) process.exit(1);
}, 400);

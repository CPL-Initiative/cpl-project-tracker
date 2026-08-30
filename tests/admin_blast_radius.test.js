// Admin tab — Blast Radius (Sam's Open Verdicts item 19, 2026-08-30: "blast
// away"). The impact map's human face: pick a dataset, see every surface that
// touches it, who WRITES it, and whether the daily cron commits it straight to
// main. Ported from the S209 mock he approved; reads kb/dependency_map.json
// LIVE, never a carried copy.
//
// What these tests pin, and why each is a way the pane could lie:
//   * HONEST UNLOADED — a map that failed to load must say so, never render
//     an empty-but-confident list (an absent measurement is not a clean bill).
//   * THE BYPASS STRIP — main_committers is the whole warning: a dataset the
//     cron commits to main ships to the public site without review, and a
//     pane that hides that is worse than no pane.
//   * WRITES ARE MARKED — "consumed by 12 surfaces" without saying which one
//     WRITES is the question Sam actually asks before a bulk write.
//   * SERVED IS DERIVED FROM not_served — and when a pattern can't be read,
//     the pane claims nothing (a missing "Public" chip is the safe error).
//   * STALE-RISK cautions surface on the dataset they name.
//
// Run from repo root: `npm test` (or `node tests/admin_blast_radius.test.js`).

const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const ADMIN_SRC = fs.readFileSync("admin.js", "utf8");
const SURFACE_SRC = fs.readFileSync("cobi_admin_surface.js", "utf8");
const ORGS_SRC = fs.readFileSync("cobi_orgs.js", "utf8");
const OVERLAY_SRC = fs.readFileSync("nav_overlay.js", "utf8");
const NAVGROUPS_SRC = fs.readFileSync("nav_groups.js", "utf8");

function makeWin() {
  const dom = new JSDOM(`<!doctype html><html><body>
    <nav class="cpl-tabs"><button class="cpl-tab" data-tab="admin">Admin</button></nav>
    <div id="admin-root"></div></body></html>`,
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.sessionStorage.setItem("cpl_sb", JSON.stringify({
    access_token: "aaaaaaaaaaaaaaaaaaaa.bbbbbbbbbbbbbbbbbbbb.cccccccccccccccccccc",
    email: "sam@x",
  }));
  w.fetch = function (url) {
    if (/cobi_rls_gates/.test(String(url))) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(
        [{ tbl: "cpl_memory", rls_enabled: true, select_gate: "is_allowed_reviewer()", policy_count: 1 }]) });
    }
    // Everything else — the dependency map included — answers with junk, so
    // loadBlast's error path is what a fetchless environment exercises.
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  };
  [OVERLAY_SRC, NAVGROUPS_SRC, ORGS_SRC, SURFACE_SRC, ADMIN_SRC].forEach((src) => {
    const el = w.document.createElement("script"); el.textContent = src;
    w.document.body.appendChild(el);
  });
  return w;
}

const FIXTURE = {
  not_served: ["*.xlsx", "docs"],
  stale_risk: ["ghost.js rebuilt by kb/_x.py under daily-dashboard.yml but not in its commit list"],
  stats: { supabase_tables: 2, rpcs: 1, edge_functions: 0, file_datasets: 3, workflows: 1, tabs: 2 },
  datasets: {
    "supabase:kb_curation": {
      consumers: [
        { id: "module:canonical_subj4.js", kind: "module", direction: "read", tabs: ["canonical-subj4"] },
        { id: "module:canonical_subj4.js", kind: "module", direction: "write", tabs: ["canonical-subj4"] },
        { id: "script:kb/_apply.py", kind: "script", direction: "read", tabs: [] },
      ], producers: [], main_committers: [] },
    "file:live_metrics.json": {
      consumers: [
        { id: "edgefn:cpl-chat", kind: "edgefn", direction: "read", tabs: [] },
        { id: "script:excel_to_dashboard.py", kind: "script", direction: "read", tabs: [] },
      ], producers: [{ by: "workflow:daily-dashboard.yml", how: "commit-to-main" }],
      main_committers: ["workflow:daily-dashboard.yml"] },
    "file:ghost.js": {
      consumers: [{ id: "tab:cpl-pathways", kind: "tab", direction: "read", tabs: [] }],
      producers: [{ by: "script:kb/_x.py", how: "rebuild" }], main_committers: [] },
    "file:secret.xlsx": {
      consumers: [{ id: "script:excel_to_dashboard.py", kind: "script", direction: "read", tabs: [] }],
      producers: [], main_committers: [] },
    "rpc:team_pass_ok": {
      consumers: [{ id: "page:CPL_Dashboard.html", kind: "page", direction: "call", tabs: [] }],
      producers: [], main_committers: [] },
  },
};

const tick = () => new Promise((r) => setTimeout(r, 0));

(async function main() {
  const w = makeWin();
  const api = w.CPL_ADMIN_TAB;
  const doc = w.document;
  api.activate();
  await tick(); await tick(); await tick();

  // ── the shell + the honest unloaded state ─────────────────────────────────
  const root = doc.getElementById("admin-root");
  check("the reviewer view carries a Blast Radius section",
    /Blast Radius/.test(root.textContent) && !!doc.getElementById("admBlast"));
  check("a map that failed to load says so — no confident empty list",
    /Could not load the impact map/.test(doc.getElementById("admBlast").textContent));

  // ── loaded: the list, grouped and counted ─────────────────────────────────
  api._setBlastMap(FIXTURE);
  api._renderBlast();
  const host = doc.getElementById("admBlast");
  check("datasets render grouped by kind",
    /Supabase tables/.test(host.textContent) && /Generated JS artifacts/.test(host.textContent) &&
    /JSON, Excel and other files/.test(host.textContent) && /RPCs/.test(host.textContent));
  const rows = host.querySelectorAll(".adm-blast-ds");
  check("all five fixture datasets are listed with consumer counts",
    rows.length === 5 && /3/.test(rows[0].textContent));
  check("the first dataset (kind order: Supabase first) is selected by default",
    rows[0].getAttribute("aria-pressed") === "true" &&
    /kb_curation/.test(rows[0].textContent));

  // ── the detail card: writes marked, tabs surfaced ─────────────────────────
  let card = host.querySelector(".adm-blast-card");
  check("the summary counts distinct surfaces and names how many write",
    /Consumed by 2 surfaces/.test(card.textContent) && /1 of them writes/.test(card.textContent));
  check("the touched tab is surfaced with its writes mark",
    /Tabs that touch it/.test(card.textContent) && /canonical-subj4/.test(card.textContent) &&
    !!card.querySelector(".adm-blast-cons li .w"));
  check("no bypass strip on a dataset nothing commits to main",
    !card.querySelector(".adm-blast-strip:not(.caution)"));

  // ── the bypass strip + producers ──────────────────────────────────────────
  api._state.blast.sel = "file:live_metrics.json";
  api._renderBlast();
  card = doc.querySelector("#admBlast .adm-blast-card");
  check("a cron-committed dataset gets the bypasses-pull-requests strip, naming the workflow",
    /Bypasses pull requests/.test(card.textContent) && /daily-dashboard\.yml/.test(card.textContent) &&
    /without review/.test(card.textContent));
  check("it carries the Public-on-Pages chip (not matched by not_served)",
    /Public on GitHub Pages/.test(card.textContent));
  check("producers render with how they produce",
    /Produced by/.test(card.textContent) && /commit-to-main/.test(card.textContent));

  // ── stale-risk caution ────────────────────────────────────────────────────
  api._state.blast.sel = "file:ghost.js";
  api._renderBlast();
  card = doc.querySelector("#admBlast .adm-blast-card");
  check("a stale-risk finding surfaces on the dataset it names",
    /Stale-copy risk/.test(card.textContent) && /not in its commit list/.test(card.textContent));

  // ── servedness derives from not_served ────────────────────────────────────
  check("*.xlsx is matched by not_served, so no Public chip",
    api._blastServed("file:live_metrics.json") === true &&
    api._blastServed("file:secret.xlsx") === false &&
    api._blastServed("supabase:kb_curation") === false);

  // ── filters ───────────────────────────────────────────────────────────────
  api._state.blast.sel = null;
  api._state.blast.kind = "rpc";
  api._renderBlast();
  let listed = doc.querySelectorAll("#admBlast .adm-blast-ds");
  check("the kind filter narrows the list", listed.length === 1 && /team_pass_ok/.test(listed[0].textContent));
  api._state.blast.kind = "all";
  api._state.blast.q = "ghost";
  api._renderBlast();
  listed = doc.querySelectorAll("#admBlast .adm-blast-ds");
  check("search narrows the list", listed.length === 1 && /ghost\.js/.test(listed[0].textContent));
  api._state.blast.q = "zzz-nothing";
  api._renderBlast();
  check("an empty result says so instead of rendering a bare pane",
    /Nothing matches/.test(doc.getElementById("admBlast").textContent));

  // ── kind classification sanity ────────────────────────────────────────────
  check("kinds classify: datajs / file / other",
    api._blastKindOf("file:ghost.js") === "datajs" &&
    api._blastKindOf("file:secret.xlsx") === "file" &&
    api._blastKindOf("storage:foo") === "other" &&
    api._blastKindOf("external:api.github.com") === "external");

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();

// Fact Sheet "Curate" overlay — section policy (SkyFlyer):
//   • #progress KPI cards: MOVE + DELETE only (never text-editable; live data).
//   • Veteran-Sprint live stats (#initiatives): EDITABLE + moveable (Sam's ask).
//   • #funding budget table: HIDE-ONLY.
//   • per-GRID Add box (a section with several grids — #what-is-cpl's CPL-Bump
//     .stat-grid is distinct from its .cols-2 cards) + grid-targeted materialize.
//
// Run from repo root: `npm test` (or `node tests/factsheet_edit_sections.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const HTML = fs.readFileSync("fact-sheet/index.html", "utf8");
const SRC = fs.readFileSync("fact-sheet/factsheet_edit.js", "utf8");

function b64url(o) {
  return Buffer.from(JSON.stringify(o)).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}
const TOKEN = "h." + b64url({ email: "map@rccd.edu", exp: Math.floor(Date.now() / 1000) + 3600 }) + ".s";
const SESSION = { access_token: TOKEN, refresh_token: "r", email: "map@rccd.edu" };

function loadDom(opts) {
  opts = opts || {};
  const dom = new JSDOM(HTML, { runScripts: "outside-only",
    url: "https://cpl-initiative.github.io/cpl-project-tracker/fact-sheet/" });
  const w = dom.window;
  const writes = [];
  if (opts.signedIn !== false) w.sessionStorage.setItem("cpl_sb", JSON.stringify(SESSION));
  w.confirm = function () { return opts.confirm !== false; };
  w.alert = function () {};
  w.fetch = function (url, init) {
    const method = (init && init.method) || "GET";
    if (/\/auth\/v1\/token/.test(url))
      return Promise.resolve({ ok: true, status: 200, json: function () {
        return Promise.resolve({ access_token: TOKEN, refresh_token: "r", expires_in: 3600 }); } });
    if (method === "GET")
      return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(opts.rows || []); } });
    writes.push({ method: method, url: String(url), body: init && init.body });
    return Promise.resolve({ ok: true, status: 200, text: function () { return Promise.resolve(""); } });
  };
  w.eval(SRC);
  if (w.CPL_FACTSHEET_EDIT) w.CPL_FACTSHEET_EDIT.boot();
  return { dom: dom, w: w, API: w.CPL_FACTSHEET_EDIT, writes: writes };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

(async function () {
  // ── (a) grid map: multi-grid sections are enumerated ──
  {
    const { w, API } = loadDom(); await tick(); await tick();
    const sec = w.document.getElementById("what-is-cpl");
    const grids = API.gridContainers(sec);
    check("#what-is-cpl has 2 grids (.cols-2 + the CPL-Bump .stat-grid)",
      grids.length === 2 && grids[0].classList.contains("cols-2") && grids[1].classList.contains("stat-grid"));
    check("#vision-goals has 2 .stat-grid grids",
      API.gridContainers(w.document.getElementById("vision-goals")).length === 2);
    check("#teams has 3 .team-grid grids",
      API.gridContainers(w.document.getElementById("teams")).length === 3);
  }

  // ── (b) per-grid Add box: CPL-Bump grid gets its own Add box ──
  {
    const { w, API } = loadDom(); await tick(); await tick();
    API.setCurating(true);
    const adds = w.document.querySelectorAll("#what-is-cpl .fs-add");
    check("#what-is-cpl renders one ＋Add box PER grid (2 total)", adds.length === 2);
    // Add a box to the SECOND grid (CPL Bump .stat-grid).
    const grids = API.gridContainers(w.document.getElementById("what-is-cpl"));
    const bl = API.addBox("what-is-cpl", grids[1]);
    check("adding to the CPL-Bump grid yields a .stat box keyed to grid g1",
      bl && bl.el.classList.contains("stat") && /\|add\|stat\|g1\|/.test(bl.key) && bl.el.parentElement === grids[1]);
    check("the new CPL-Bump box is editable + moveable",
      bl && API.canEditHtml(bl) && bl.movable);
  }

  // ── (c) grid-targeted materialize: an add-key with g1 lands in the right grid ──
  {
    const KEY = "what-is-cpl|add|stat|g1|btok9";
    const rows = [{ block_key: KEY, html: '<div class="big">42%</div><div class="cap">Sample</div>', hidden: false }];
    const { w } = loadDom({ rows: rows }); await tick(); await tick();
    const el = w.document.querySelector('[data-fsk="' + KEY + '"]');
    check("g1 add-key materializes into the .stat-grid (not the .cols-2)",
      !!el && el.parentElement.classList.contains("stat-grid"));
  }

  // ── (d) #progress KPI cards: move + delete only ──
  {
    const { w, API, writes } = loadDom(); await tick(); await tick();
    API.setCurating(true);
    const kpi = API.blocks().filter((b) => b.sectionId === "progress" && b.el.classList.contains("kpi"))[0];
    check("a KPI card is draggable in curate mode", kpi.el.getAttribute("draggable") === "true");
    check("a KPI card is NOT text-editable", !API.canEditHtml(kpi));
    check("a KPI card has a ✕ (delete/hide) affordance", !!kpi.el.querySelector(".fs-del"));
    API.deleteBox(kpi);                                   // baked → hide
    await tick(); await tick();
    check("deleting (hiding) a KPI card POSTs hidden:true + ghosts it",
      writes.some((x) => x.method === "POST" && /"hidden":true/.test(x.body || "")) && kpi.el.classList.contains("fs-ov-hidden"));
    API.toggleHidden(kpi, false);                         // un-hide path (click the ghost)
    await tick(); await tick();
    check("un-hiding a KPI restores it", !kpi.el.classList.contains("fs-ov-hidden"));
    check("addBox refuses the move-only #progress section", API.addBox("progress") === undefined);
  }

  // ── (e) Veteran-Sprint live stats: editable, with the live binding preserved ──
  {
    const { w, API, writes } = loadDom(); await tick(); await tick();
    const vs = API.blocks().filter((b) =>
      b.sectionId === "initiatives" && b.el.classList.contains("stat") && b.el.querySelector("[data-bind]"))[0];
    check("a Veteran-Sprint stat is an editable LIVE block", vs && API.canEditHtml(vs) && vs.live);

    // No override + live: applyOverrides must NOT clobber a live value with baked.
    vs.el.innerHTML = '<div class="big">LIVE-9999</div><div class="cap">x</div>';
    API.setOverrides({});
    API.applyOverrides();
    check("un-overridden live box keeps its live innerHTML (binding preserved)",
      /LIVE-9999/.test(vs.el.innerHTML));

    // An html override wins (box goes static).
    API.setOverrides({ [vs.key]: { html: "<strong>Edited outcome</strong>", hidden: false } });
    API.applyOverrides();
    check("editing a Veteran-Sprint stat overrides the live value", /Edited outcome/.test(vs.el.innerHTML));
  }

  // ── (f) #funding budget table: hide-only ──
  {
    const { w, API, writes } = loadDom(); await tick(); await tick();
    API.setCurating(true);
    const tbl = API.blocks().filter((b) => b.sectionId === "funding" && b.isTable)[0];
    check("the budget table is a hide-only block (not editable, not moveable)",
      tbl && !API.canEditHtml(tbl) && !tbl.movable && tbl.el.classList.contains("tbl-wrap"));
    check("the budget table shows only a ✕ (hide) — no ＋Add box in #funding",
      !!tbl.el.querySelector(".fs-del") && !w.document.querySelector("#funding .fs-add"));
    API.deleteBox(tbl);
    await tick(); await tick();
    check("hiding the budget table POSTs hidden:true + ghosts the wrapper",
      writes.some((x) => x.method === "POST" && /\|tbl\|/.test(decodeURIComponent(x.body || "")) || writes.some((x) => /"hidden":true/.test(x.body || ""))
      ) && tbl.el.classList.contains("fs-ov-hidden"));
  }

  let failed = 0;
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); if (!r[1]) failed++; });
  console.log("\n" + (failed ? failed + " FAILED" : "All " + results.length + " checks passed"));
  process.exit(failed ? 1 : 0);
})();

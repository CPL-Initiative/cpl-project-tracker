// Fact Sheet "Curate" overlay — Phase 1: add / delete / reorder boxes (StarFarout).
//
// Guards:
//  (a) a signed-in reviewer can ADD a box to a grid section (e.g. Resources): it
//      clones the section's box format, carries a stable add-key, sample text, a
//      ✕ chrome, and persists an override (innerHTML, no chrome) + the section order;
//  (b) an added box MATERIALIZES from its override row on a fresh load;
//  (c) ✕ DELETE removes an added box (true delete) and HIDES a baked one;
//  (d) applyOrder reorders a section's boxes; persistOrder writes the order key;
//  (e) curate mode decorates boxes (✕ + draggable) + renders ＋Add buttons; off clears them;
//  (f) excluded/live sections never get an Add button and addBox refuses them.
//
// Run from repo root: `npm test` (or `node tests/factsheet_edit_boxes.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const HTML = fs.readFileSync("fact-sheet/index.html", "utf8");
const SRC = fs.readFileSync("fact-sheet/factsheet_edit.js", "utf8");

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64")
    .replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function jwt(payload) { return "h." + b64url(payload) + ".s"; }
const TOKEN = jwt({ email: "map@rccd.edu", exp: Math.floor(Date.now() / 1000) + 3600 });
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
  // ── (a) Add a box to Resources ──
  {
    const { w, API, writes } = loadDom();
    await tick(); await tick();                       // let boot's fetch.then settle
    API.setCurating(true);
    const before = API.blocks().filter((b) => b.sectionId === "resources").length;
    const bl = API.addBox("resources");
    check("addBox returns a block with a resources add-key",
      bl && /^resources\|add\|res\|/.test(bl.key) && API.isAddedKey(bl.key));
    check("added box is a .res in the DOM under #resources",
      bl && bl.el.classList.contains("res") && w.document.querySelector('#resources [data-fsk="' + bl.key + '"]'));
    check("added box carries sample text (matches the section format)",
      bl && /New item/.test(bl.el.textContent) && /Sample text/.test(bl.el.textContent));
    check("added box is in the blocks list (count grew)",
      API.blocks().filter((b) => b.sectionId === "resources").length === before + 1);
    check("added box has a ✕ delete chrome (curating)", bl && !!bl.el.querySelector(".fs-del"));
    await tick(); await tick();
    const post = writes.filter((x) => x.method === "POST");
    check("addBox persisted an override POST", post.length >= 1);
    check("persisted html does NOT include the ✕ chrome",
      post.some((x) => /res-title/.test(x.body || "") && !/fs-del/.test(x.body || "")));
    check("addBox also persisted the section order key",
      post.some((x) => /resources\\u007c__order|resources\|__order/.test(x.body || "")));
  }

  // ── (b) Materialize an added box from an override on fresh load ──
  {
    const KEY = "resources|add|res|btok1";
    const rows = [
      { block_key: KEY, html: '<a class="res-title" href="#">Reloaded Resource</a><div class="res-desc">desc</div>', hidden: false },
      { block_key: "resources|__order", html: JSON.stringify([KEY]), hidden: false },
    ];
    const { w, API } = loadDom({ rows: rows });
    await tick(); await tick();
    const el = w.document.querySelector('[data-fsk="' + KEY + '"]');
    check("added box materialized from its override row", !!el && /Reloaded Resource/.test(el.textContent));
    check("materialized box is adopted as a block", API.blocks().some((b) => b.key === KEY && b.added));
    check("materialized box lives in #resources", !!(el && el.closest("#resources")));
  }

  // ── (c) ✕ delete: added → remove, baked → hide ──
  {
    const { w, API, writes } = loadDom();
    await tick(); await tick();
    API.setCurating(true);
    const added = API.addBox("resources");
    await tick();
    const key = added.key;
    API.deleteBox(added);
    await tick(); await tick();
    check("deleting an added box removes it from the DOM", !w.document.querySelector('[data-fsk="' + key + '"]'));
    check("deleting an added box removes it from blocks", !API.blocks().some((b) => b.key === key));
    check("delete issued a DELETE for the added key",
      writes.some((x) => x.method === "DELETE" && x.url.indexOf(encodeURIComponent(key)) !== -1));

    const baked = API.blocks().filter((b) => b.sectionId === "resources" && !b.added)[0];
    API.deleteBox(baked);
    await tick(); await tick();
    check("deleting a BAKED box hides it (not removed from DOM)",
      !!w.document.querySelector('[data-fsk="' + baked.key + '"]') && baked.el.classList.contains("fs-ov-hidden"));
    check("hiding a baked box issued a POST (hidden), not a DELETE",
      writes.some((x) => x.method === "POST" && /"hidden":true/.test(x.body || "")));
  }

  // ── (d) Reorder: applyOrder moves boxes; persistOrder writes the order ──
  {
    const { w, API, writes } = loadDom();
    await tick(); await tick();
    const resBlocks = API.blocks().filter((b) => b.sectionId === "resources");
    const k0 = resBlocks[0].key, k1 = resBlocks[1].key;
    const cont = resBlocks[0].el.parentElement;
    const firstBefore = cont.querySelector("[data-fsk]").getAttribute("data-fsk");
    check("sanity: first box is k0 before reorder", firstBefore === k0);
    // Put k1 before k0 via a saved order (k1 first, then the rest).
    const order = [k1, k0].concat(resBlocks.slice(2).map((b) => b.key));
    API.applyOrder({ "resources|__order": { html: JSON.stringify(order), hidden: false } });
    check("applyOrder moved k1 to the front", cont.querySelector("[data-fsk]").getAttribute("data-fsk") === k1);

    API.persistOrder("resources");
    await tick();
    const orderPost = writes.filter((x) => x.method === "POST" && /resources\|__order/.test(x.body || "")).pop();
    check("persistOrder wrote a resources|__order override (POST)", !!orderPost);
    let savedOrder = [];
    try { savedOrder = JSON.parse(JSON.parse(orderPost.body).html); } catch (e) {}
    check("saved order is grid-scoped (contains the .res box keys)",
      savedOrder.indexOf(k0) !== -1 && savedOrder.indexOf(k1) !== -1);
    check("saved order excludes the section-level intro <p> (not in the grid)",
      !savedOrder.some((k) => /all-resources-below/.test(k)));
  }

  // ── (e) Curate chrome on/off ──
  {
    const { w, API } = loadDom();
    await tick(); await tick();
    API.setCurating(true);
    const anyRes = API.blocks().filter((b) => b.sectionId === "resources")[0];
    check("curating: a box gets draggable + ✕", anyRes.el.getAttribute("draggable") === "true" && !!anyRes.el.querySelector(".fs-del"));
    check("curating: an ＋Add box button appears in #resources", !!w.document.querySelector("#resources .fs-add"));
    API.setCurating(false);
    check("done: ✕ chrome removed", !anyRes.el.querySelector(".fs-del") && !anyRes.el.getAttribute("draggable"));
    check("done: ＋Add buttons removed", !w.document.querySelector(".fs-add"));
  }

  // ── (f) Excluded/live sections never get add affordances ──
  {
    const { w, API } = loadDom();
    await tick(); await tick();
    API.setCurating(true);
    check("no ＋Add button in #progress (live KPIs)", !w.document.querySelector("#progress .fs-add"));
    check("no ＋Add button in #statewide-exhibits", !w.document.querySelector("#statewide-exhibits .fs-add"));
    const r = API.addBox("progress");
    check("addBox refuses an excluded section", r === undefined && !w.document.querySelector('#progress [data-fsk*="|add|"]'));
  }

  let failed = 0;
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); if (!r[1]) failed++; });
  console.log("\n" + (failed ? failed + " FAILED" : "All " + results.length + " checks passed"));
  process.exit(failed ? 1 : 0);
})();

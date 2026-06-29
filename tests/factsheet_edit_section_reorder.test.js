// Fact Sheet "Curate" overlay — whole-section drag-reorder (SkyFarer).
//
// Guards:
//  (a) reorderable list = content sections only — excludes #contents (no-print chrome);
//  (b) curate mode injects a draggable handle per reorderable section; off clears them;
//  (c) the section handle survives section collapse (stays draggable when collapsed);
//  (d) applySectionOrder reorders <main>'s sections to a saved order (vision above KPIs)
//      while the pinned #contents TOC stays first;
//  (e) persistSectionOrder POSTs the reserved __section_order__ key with all
//      reorderable ids (no box-order churn; #contents excluded);
//  (f) the reserved key is inert to the box machinery (not an order/add/img key);
//  (g) a saved order materializes on a fresh public load (no sign-in required).
//
// Run from repo root: `npm test` (or `node tests/factsheet_edit_section_reorder.test.js`).
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
function sectionIds(w) {
  return Array.from(w.document.querySelector("main").children)
    .filter((n) => n.tagName === "SECTION").map((n) => n.id);
}

(async function () {
  // ── (a) reorderable list ──
  {
    const { API } = loadDom(); await tick(); await tick();
    const ids = API.reorderableSectionIds();
    check("reorderable list EXCLUDES the #contents TOC (no-print chrome)", ids.indexOf("contents") === -1);
    check("reorderable list includes #progress, #vision-goals, #statewide-exhibits",
      ids.indexOf("progress") !== -1 && ids.indexOf("vision-goals") !== -1 && ids.indexOf("statewide-exhibits") !== -1);
    check("reorderable list is many sections (≥10)", ids.length >= 10);
  }

  // ── (b) handles on/off ──
  {
    const { w, API } = loadDom(); await tick(); await tick();
    API.setCurating(true);
    const prog = w.document.getElementById("progress");
    check("curate mode injects a draggable handle on #progress",
      !!prog.querySelector(".fs-sec-handle") && prog.querySelector(".fs-sec-handle").getAttribute("draggable") === "true");
    check("the handle carries an aria-label (a11y)", /aria-label/.test(prog.querySelector(".fs-sec-handle").outerHTML));
    check("no handle on the pinned #contents TOC", !w.document.querySelector("#contents .fs-sec-handle"));
    const n = w.document.querySelectorAll(".fs-sec-handle").length;
    check("one handle per reorderable section", n === API.reorderableSectionIds().length);
    API.setCurating(false);
    check("done clears all section handles + the .fs-sec-reorder class",
      !w.document.querySelector(".fs-sec-handle") && !w.document.querySelector(".fs-sec-reorder"));
  }

  // ── (c) handle is injected even when the section is collapsed ──
  {
    const { w, API } = loadDom(); await tick(); await tick();
    const vg = w.document.getElementById("vision-goals");
    vg.classList.add("collapsed");                       // simulate a collapsed section
    API.setCurating(true);
    check("a collapsed section still gets its drag handle", !!vg.querySelector(".fs-sec-handle"));
  }

  // ── (d) applySectionOrder reorders main; TOC pinned on top ──
  {
    const { w, API } = loadDom(); await tick(); await tick();
    const ids = API.reorderableSectionIds().filter((x) => x !== "vision-goals");
    ids.splice(ids.indexOf("progress"), 0, "vision-goals");   // vision-goals right before progress
    API.applySectionOrder({ "__section_order__": { html: JSON.stringify(ids), hidden: false } });
    const order = sectionIds(w);
    check("applySectionOrder moved #vision-goals above #progress",
      order.indexOf("vision-goals") !== -1 && order.indexOf("vision-goals") < order.indexOf("progress"));
    check("the #contents TOC is still the FIRST section after reorder", order[0] === "contents");
    check("applySectionOrder ignores a malformed payload",
      (function () { try { API.applySectionOrder({ "__section_order__": { html: "{bad" } }); return true; } catch (e) { return false; } })());
  }

  // ── (e) persistSectionOrder writes the reserved key ──
  {
    const { w, API, writes } = loadDom(); await tick(); await tick();
    const main = w.document.querySelector("main");
    main.insertBefore(w.document.getElementById("vision-goals"), w.document.getElementById("progress"));
    API.persistSectionOrder(); await tick(); await tick();
    const post = writes.filter((x) => x.method === "POST" && /__section_order__/.test(x.body || "")).pop();
    check("persistSectionOrder POSTs the reserved __section_order__ key", !!post);
    let saved = []; try { saved = JSON.parse(JSON.parse(post.body).html); } catch (e) {}
    check("saved order lists vision-goals before progress",
      saved.indexOf("vision-goals") !== -1 && saved.indexOf("vision-goals") < saved.indexOf("progress"));
    check("saved order EXCLUDES the pinned #contents", saved.indexOf("contents") === -1);
    check("the override body targets block_key=__section_order__ (page-level, not <sid>|__order)",
      /"block_key":"__section_order__"/.test(post.body || ""));
  }

  // ── (f) the reserved key is inert to the box machinery ──
  {
    const { API } = loadDom(); await tick(); await tick();
    const K = API.SECTION_ORDER_KEY;
    check("SECTION_ORDER_KEY is a single token (no pipe)", K === "__section_order__" && K.indexOf("|") === -1);
    check("SECTION_ORDER_KEY is NOT a box order key", !API.isOrderKey(K));
    check("SECTION_ORDER_KEY is NOT an added-box key", !API.isAddedKey(K));
    check("SECTION_ORDER_KEY is NOT an image key", !API.isImgKey(K));
  }

  // ── (g) a saved order materializes for a public visitor (no sign-in) ──
  {
    const ids = ["vision-goals", "exec-summary", "what-is-cpl", "progress"];
    const rows = [{ block_key: "__section_order__", html: JSON.stringify(ids), hidden: false }];
    const { w } = loadDom({ rows: rows, signedIn: false }); await tick(); await tick();
    const order = sectionIds(w);
    check("public load applies the saved section order (vision-goals before exec-summary)",
      order.indexOf("vision-goals") < order.indexOf("exec-summary"));
    check("public load keeps #contents pinned first", order[0] === "contents");
  }

  let failed = 0;
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); if (!r[1]) failed++; });
  console.log("\n" + (failed ? failed + " FAILED" : "All " + results.length + " checks passed"));
  process.exit(failed ? 1 : 0);
})();

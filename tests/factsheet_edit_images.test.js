// Fact Sheet "Curate" overlay — Phase 2: images (add / delete / resize).
//
// Guards:
//  (a) the sanitizer allows <img> with an allowlisted https src (our Storage
//      bucket / map.rccd.edu / ./img/) and DROPS data:/foreign-host/oversized;
//  (b) safeImgSrc accepts only the allowlist;
//  (c) each baked <figure> is an IMAGE block (resize/replace/hide), and an
//      in-figure <figcaption> is NOT a separate text box;
//  (d) curate mode decorates a figure with the .fs-imgbar (size + replace + ✕)
//      and adds a 🖼 Add image affordance per section;
//  (e) setImgWidth sets <img width> + persists (POST); the bar isn't persisted;
//  (f) ✕ hides a baked figure (POST hidden) and deletes an added one (DELETE);
//  (g) an "<sid>|img|<token>" override materializes a figure on load.
//
// Run from repo root: `npm test` (or `node tests/factsheet_edit_images.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const HTML = fs.readFileSync("fact-sheet/index.html", "utf8");
const SRC = fs.readFileSync("fact-sheet/factsheet_edit.js", "utf8");
const SQL = fs.readFileSync("fact-sheet/supabase_factsheet_images.sql", "utf8");

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
  // ── Static: the Storage bucket migration is reviewer-gated ──
  check("img bucket schema exists (factsheet-images, reviewer write)",
    /factsheet-images/.test(SQL) && /is_allowed_reviewer\(\)/.test(SQL));

  const { API } = loadDom();
  await tick(); await tick();
  const PUB = API.IMG_PUBLIC;

  // ── (a) sanitizer ──
  check("sanitize keeps an <img> from our Storage bucket",
    /<img/i.test(API.sanitize('<img src="' + PUB + 'a.png">')));
  check("sanitize keeps an <img> from ./img/", /<img/i.test(API.sanitize('<img src="./img/x.png">')));
  check("sanitize DROPS a data: <img>", !/<img/i.test(API.sanitize('<img src="data:image/png;base64,AAAA">')));
  check("sanitize DROPS a foreign-host <img> (+ its onerror)", (function () {
    const o = API.sanitize('<img src="https://evil.example/x.png" onerror="boom()">');
    return !/<img/i.test(o) && !/onerror/i.test(o);
  })());
  check("sanitize keeps width=400, drops width=9999", (function () {
    return /width="400"/.test(API.sanitize('<img src="' + PUB + 'a.png" width="400">'))
      && !/width="9999"/.test(API.sanitize('<img src="' + PUB + 'a.png" width="9999">'));
  })());

  // ── (b) safeImgSrc ──
  check("safeImgSrc: bucket OK", API.safeImgSrc(PUB + "a.png"));
  check("safeImgSrc: map.rccd.edu OK", API.safeImgSrc("https://staging2.map.rccd.edu/x.png"));
  check("safeImgSrc: ./img OK", API.safeImgSrc("./img/x.png"));
  check("safeImgSrc: data: rejected", !API.safeImgSrc("data:image/png;base64,AAAA"));
  check("safeImgSrc: foreign host rejected", !API.safeImgSrc("https://evil.example/x.png"));

  // ── (c) figures are image blocks; in-figure captions aren't separate boxes ──
  const figBlocks = API.blocks().filter((b) => b.isImg);
  check("baked <figure>s are collected as image blocks", figBlocks.length >= 1);
  check("image blocks carry a |fig| (or |img|) key", figBlocks.every((b) => API.isImgBlock(b) && /\|fig\||\|img\|/.test(b.key)));
  check("no <figcaption> is a separate text box",
    API.blocks().every((b) => b.el.tagName !== "FIGCAPTION"));

  // ── (d) curate chrome ──
  {
    const { w, API: A } = loadDom();
    await tick(); await tick();
    A.setCurating(true);
    const fig = A.blocks().filter((b) => b.isImg)[0];
    const bar = fig.el.querySelector(".fs-imgbar");
    check("curating: a figure gets the .fs-imgbar", !!bar);
    check("imgbar has size buttons + replace + ✕",
      bar && bar.querySelectorAll(".fs-imgw").length === 4 && bar.querySelector(".fs-imgrep") && bar.querySelector(".fs-del"));
    check("curating: a 🖼 Add image affordance appears", !!w.document.querySelector(".fs-add-img"));
    A.setCurating(false);
    check("done: imgbar removed", !fig.el.querySelector(".fs-imgbar") && !w.document.querySelector(".fs-add-img"));
  }

  // ── (e) resize ──
  {
    const { A, writes } = (function () { const d = loadDom(); return { A: d.API, writes: d.writes }; })();
    await tick(); await tick();
    A.setCurating(true);
    const fig = A.blocks().filter((b) => b.isImg)[0];
    A.setImgWidth(fig, 240);
    const img = fig.el.querySelector("img");
    check("setImgWidth sets the <img width>", img && img.getAttribute("width") === "240");
    await tick(); await tick();
    const post = writes.filter((x) => x.method === "POST");
    check("resize persisted a POST", post.length >= 1);
    check("persisted figure html has the width, NOT the .fs-imgbar chrome",
      post.some((x) => /width=\\?"240\\?"/.test(x.body || "") && !/fs-imgbar/.test(x.body || "")));
  }

  // ── (f) delete: baked hides, added deletes ──
  {
    const { A, writes } = (function () { const d = loadDom(); return { A: d.API, writes: d.writes }; })();
    await tick(); await tick();
    A.setCurating(true);
    const baked = A.blocks().filter((b) => b.isImg && !b.added)[0];
    A.deleteBox(baked);
    await tick(); await tick();
    check("hiding a baked figure → POST hidden:true (not removed)",
      writes.some((x) => x.method === "POST" && /"hidden":true/.test(x.body || "")) && baked.el.classList.contains("fs-ov-hidden"));
  }

  // ── (g) an |img| override materializes a figure ──
  {
    const KEY = "stories|img|imgtok1";
    const rows = [{ block_key: KEY, html: '<img src="' + PUB + 'a.png" alt="x" width="360">', hidden: false }];
    const { w, A } = (function () { const d = loadDom({ rows: rows }); return { w: d.w, A: d.API }; })();
    await tick(); await tick();
    const fig = w.document.querySelector('[data-fsk="' + KEY + '"]');
    check("|img| override materialized a <figure> with the image",
      !!fig && fig.tagName === "FIGURE" && !!fig.querySelector("img"));
    check("materialized image is adopted as an added image block",
      A.blocks().some((b) => b.key === KEY && b.isImg && b.added));
    // deleting the added image issues a DELETE
    const bl = A.blocks().filter((b) => b.key === KEY)[0];
    const w2 = (function () { return null; })();
    A.setCurating(true);
    A.deleteBox(bl);
    await tick(); await tick();
    check("deleting an added image removes it from the DOM", !w.document.querySelector('[data-fsk="' + KEY + '"]'));
  }

  let failed = 0;
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); if (!r[1]) failed++; });
  console.log("\n" + (failed ? failed + " FAILED" : "All " + results.length + " checks passed"));
  process.exit(failed ? 1 : 0);
})();

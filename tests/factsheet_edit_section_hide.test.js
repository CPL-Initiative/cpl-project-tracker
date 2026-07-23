// Fact Sheet "Curate" overlay — whole-section Hide/Show toggle.
//
// Guards:
//  (a) a saved "<sid>|__hidden" override marks the section + its Contents link
//      .fs-ov-hidden on a fresh PUBLIC load (no sign-in) — so it's display:none
//      for visitors and stripped from the Print / Word reports;
//  (b) curate mode injects a "🙈 Hide section" button per reorderable section
//      (one each, none on the pinned #contents TOC); "Done" clears them;
//  (c) the button label reflects state — "Hide section" when shown, "Show
//      section" (+ aria-pressed / .is-hidden) when the section is hidden;
//  (d) toggleSectionHidden (signed in) POSTs the reserved "<sid>|__hidden" key
//      with hidden:true and marks the section + TOC link .fs-ov-hidden;
//  (e) toggling again un-hides (removes .fs-ov-hidden) and POSTs hidden:false;
//  (f) the reserved key is inert to the box machinery (not an order/add/img key).
//
// Run from repo root: `npm test` (or `node tests/factsheet_edit_section_hide.test.js`).
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
  // ── (a) public load applies a saved section hide (section + TOC link) ──
  {
    const rows = [{ block_key: "map|__hidden", html: null, hidden: true }];
    const { w } = loadDom({ rows: rows, signedIn: false }); await tick(); await tick();
    const sec = w.document.getElementById("map");
    const link = w.document.querySelector('#contents a[href="#map"]');
    check("public load hides the section (section.fs-ov-hidden)", sec.classList.contains("fs-ov-hidden"));
    check("public load hides its Contents link too", !!link && link.classList.contains("fs-ov-hidden"));
    const other = w.document.getElementById("partnerships");
    check("a NON-hidden section is untouched", !other.classList.contains("fs-ov-hidden"));
  }

  // ── (b) curate mode injects one Hide button per reorderable section ──
  {
    const { w, API } = loadDom(); await tick(); await tick();
    API.setCurating(true);
    const map = w.document.getElementById("map");
    check("curate mode injects a .fs-sec-hide button on #map", !!map.querySelector(".fs-sec-hide"));
    check("no Hide button on the pinned #contents TOC", !w.document.querySelector("#contents .fs-sec-hide"));
    const n = w.document.querySelectorAll(".fs-sec-hide").length;
    check("one Hide button per reorderable section", n === API.reorderableSectionIds().length);
    const btn = map.querySelector(".fs-sec-hide");
    check("the button is a real <button> (keyboard-operable)", btn.tagName === "BUTTON");
    check("the button carries an aria-label + aria-pressed (a11y)",
      /aria-label/.test(btn.outerHTML) && btn.getAttribute("aria-pressed") === "false");
    API.setCurating(false);
    check("Done clears all Hide buttons", !w.document.querySelector(".fs-sec-hide"));
  }

  // ── (c) the button label reflects a currently-hidden section ──
  {
    const rows = [{ block_key: "map|__hidden", html: null, hidden: true }];
    const { w, API } = loadDom({ rows: rows }); await tick(); await tick();
    API.setCurating(true);
    const btn = w.document.getElementById("map").querySelector(".fs-sec-hide");
    check("a hidden section's button reads “Show section”", /Show section/.test(btn.textContent));
    check("a hidden section's button is aria-pressed + .is-hidden",
      btn.getAttribute("aria-pressed") === "true" && btn.classList.contains("is-hidden"));
  }

  // ── (d) toggle hides: POSTs the reserved key + marks section/TOC hidden ──
  {
    const { w, API, writes } = loadDom(); await tick(); await tick();
    await API.toggleSectionHidden("map"); await tick(); await tick();
    const sec = w.document.getElementById("map");
    const link = w.document.querySelector('#contents a[href="#map"]');
    check("toggle marks the section .fs-ov-hidden", sec.classList.contains("fs-ov-hidden"));
    check("toggle marks the Contents link .fs-ov-hidden", link.classList.contains("fs-ov-hidden"));
    const post = writes.filter((x) => x.method === "POST" && /"block_key":"map\|__hidden"/.test(x.body || "")).pop();
    check("toggle POSTs the reserved map|__hidden key", !!post);
    check("the POST sets hidden:true", !!post && /"hidden":true/.test(post.body));
    check("API.isSectionHidden reflects the new state", API.isSectionHidden("map") === true);
  }

  // ── (e) toggling again un-hides ──
  {
    const rows = [{ block_key: "map|__hidden", html: null, hidden: true }];
    const { w, API, writes } = loadDom({ rows: rows }); await tick(); await tick();
    const sec = w.document.getElementById("map");
    check("starts hidden", sec.classList.contains("fs-ov-hidden"));
    await API.toggleSectionHidden("map"); await tick(); await tick();
    check("toggle removes .fs-ov-hidden from the section", !sec.classList.contains("fs-ov-hidden"));
    const post = writes.filter((x) => x.method === "POST" && /"block_key":"map\|__hidden"/.test(x.body || "")).pop();
    check("the un-hide POST sets hidden:false", !!post && /"hidden":false/.test(post.body));
  }

  // ── (f) the reserved key is inert to the box machinery ──
  {
    const { API } = loadDom(); await tick(); await tick();
    const K = API.sectionHiddenKey("map");
    check("sectionHiddenKey builds <sid>|__hidden", K === "map|__hidden");
    check("isSectionHiddenKey recognizes it", API.isSectionHiddenKey(K));
    check("it is NOT a box order key", !API.isOrderKey(K));
    check("it is NOT an added-box key", !API.isAddedKey(K));
    check("it is NOT an image key", !API.isImgKey(K));
  }

  let failed = 0;
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); if (!r[1]) failed++; });
  console.log("\n" + (failed ? failed + " FAILED" : "All " + results.length + " checks passed"));
  process.exit(failed ? 1 : 0);
})();

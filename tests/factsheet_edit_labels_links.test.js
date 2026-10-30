// Fact Sheet "Curate" overlay — the Contents labels and the prose the section
// rules held back become editable; the links and the section headings never do.
//
// Sam, 2026-10-30 (S528, at the Summit): edit the Fact Sheet's content and its
// Contents labels, never the section headings or the links.
//
// Guards:
//  (a) every #contents link is a text-only block keyed by its href, and two
//      loads give the same keys;
//  (b) a label edit saves plain text, changes the words and leaves the href,
//      and markup typed into a label never reaches the page;
//  (c) a label stays hidden while its section is hidden;
//  (d) the #progress lede and the #statewide-exhibits prose are editable, the KPI
//      cards stay move-only, and the exhibit grid gives no block;
//  (e) a box save keeps every link's address, and a save that adds or drops a
//      link is refused;
//  (f) no block holds an <h2>, and sanitize drops one typed into a box.
//
// Run from repo root: `npm test` (or `node tests/factsheet_edit_labels_links.test.js`).
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
const TOKEN = "h." + b64url({ email: "map@rccd.edu", exp: Math.floor(Date.now() / 1000) + 3600 }) + ".s";
const SESSION = { access_token: TOKEN, refresh_token: "r", email: "map@rccd.edu" };

function loadDom(opts) {
  opts = opts || {};
  const dom = new JSDOM(HTML, { runScripts: "outside-only",
    url: "https://cpl-initiative.github.io/cpl-project-tracker/fact-sheet/" });
  const w = dom.window;
  const writes = [];
  w.sessionStorage.setItem("cpl_sb", JSON.stringify(SESSION));
  w.confirm = function () { return true; };
  w.alert = function () {};
  w.fetch = function (url, init) {
    const method = (init && init.method) || "GET";
    if (method === "GET")
      return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(opts.rows || []); } });
    writes.push({ method: method, url: String(url), body: init && init.body ? JSON.parse(init.body) : null });
    return Promise.resolve({ ok: true, status: 200, text: function () { return Promise.resolve(""); } });
  };
  w.eval(SRC);
  w.CPL_FACTSHEET_EDIT.boot();
  return { w: w, API: w.CPL_FACTSHEET_EDIT, writes: writes };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
function click(w, el) { el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true })); }

(async function () {
  // ── (a) the labels are text-only blocks keyed by href ──
  {
    const { w, API } = loadDom();
    await tick(); await tick();
    const links = w.document.querySelectorAll("#contents nav.toc a[href]");
    const toc = API.blocks().filter((b) => b.isToc);
    check("every Contents link is a label block", links.length > 10 && toc.length === links.length);
    check("label keys come from the href", toc.every((b) => /^contents\|toc\|/.test(b.key)) &&
      toc.some((b) => b.key === "contents|toc|exec-summary"));
    check("the video link keys by its file name", toc.some((b) => b.key === "contents|toc|funding-in-motion-n2"));
    check("label keys are unique", new Set(toc.map((b) => b.key)).size === toc.length);
    const again = loadDom();
    await tick(); await tick();
    check("label keys are stable across loads",
      JSON.stringify(toc.map((b) => b.key)) === JSON.stringify(again.API.blocks().filter((b) => b.isToc).map((b) => b.key)));
  }

  // ── (b) a label edit changes the words, never the href ──
  {
    const { w, API, writes } = loadDom();
    await tick(); await tick();
    API.setCurating(true);
    const a = w.document.querySelector('#contents a[href="#exec-summary"]');
    check("curate mode puts no ✕ inside a Contents link", !a.querySelector(".fs-del"));
    click(w, a);
    const dock = w.document.querySelector(".fs-dock");
    const ta = dock && dock.querySelector(".fs-dock-ta");
    check("a label click opens the editor on its words", dock && dock.classList.contains("open") && ta.value === "Executive summary");
    check("the label editor offers no Hide", dock.querySelector(".fs-hide").hidden);
    ta.value = '<a href="https://evil.example">Summary</a> <strong>of the work</strong>';
    click(w, dock.querySelector(".fs-save"));
    await tick(); await tick();
    const post = writes.find((x) => x.method === "POST");
    check("the save writes plain text under the label key",
      post && post.body.block_key === "contents|toc|exec-summary" && post.body.html === "Summary of the work");
    check("the label shows the new words", a.textContent === "Summary of the work");
    check("the label's href is unchanged", a.getAttribute("href") === "#exec-summary");
    check("no markup reaches the label", a.children.length === 0);
  }

  // ── (b2) a saved label applies for every visitor; markup in a row is text ──
  {
    const { w } = loadDom({ rows: [
      { block_key: "contents|toc|progress", html: "Our <b>KPIs</b>", hidden: false },
    ] });
    await tick(); await tick();
    const a = w.document.querySelector('#contents a[href="#progress"]');
    check("a saved label applies on load", a.textContent === "Our KPIs" && a.children.length === 0);
    check("the loaded label keeps its href", a.getAttribute("href") === "#progress");
  }

  // ── (c) a hidden section keeps its label hidden ──
  {
    const { w } = loadDom({ rows: [
      { block_key: "map|__hidden", html: null, hidden: true },
      { block_key: "contents|toc|map", html: "MAP", hidden: false },
    ] });
    await tick(); await tick();
    const a = w.document.querySelector('#contents a[href="#map"]');
    check("a relabeled link stays hidden with its section", a.classList.contains("fs-ov-hidden") && a.textContent === "MAP");
  }

  // ── (d) the prose the section rules held back ──
  {
    const { w, API } = loadDom();
    await tick(); await tick();
    const blocks = API.blocks();
    const lede = w.document.querySelector("#progress > p.lede");
    const lb = API.blockByEl(lede);
    check("the #progress lede is an editable block", lb && API.canEditHtml(lb));
    const kpis = blocks.filter((b) => b.sectionId === "progress" && b.el.classList.contains("kpi"));
    check("the KPI cards stay move-only", kpis.length >= 7 && kpis.every((b) => !API.canEditHtml(b)));
    const sw = blocks.filter((b) => b.sectionId === "statewide-exhibits");
    check("#statewide-exhibits prose is editable (ledes, note, closing line)",
      sw.length >= 4 && sw.every((b) => API.canEditHtml(b)) &&
      sw.some((b) => b.el.classList.contains("note")) && sw.some((b) => b.el.classList.contains("lede")));
    check("the exhibit grid gives no block", sw.every((b) => !b.el.closest(".sw-grid")) &&
      !w.document.querySelector("#statewide-exhibits .sw-grid [data-fsk]"));
    API.setCurating(true);
    check("#statewide-exhibits still gets no Add button", !w.document.querySelector("#statewide-exhibits .fs-add"));
    check("#statewide-exhibits prose is not draggable", sw.every((b) => !b.movable));
  }

  // ── (e) a box save keeps every link's address ──
  {
    const { w, API, writes } = loadDom();
    await tick(); await tick();
    API.setCurating(true);
    const p = Array.prototype.find.call(w.document.querySelectorAll("#exec-summary > p"), (x) => x.querySelector("a[href]"));
    const href = p.querySelector("a").getAttribute("href");
    click(w, p);
    const dock = w.document.querySelector(".fs-dock");
    const ta = dock.querySelector(".fs-dock-ta");
    ta.value = ta.value.replace(href, "https://evil.example/").replace("Vision 2030", "Vision 2030, the system's plan,");
    click(w, dock.querySelector(".fs-save"));
    await tick(); await tick();
    const post = writes.find((x) => x.method === "POST");
    check("a box save keeps the link's address", post && post.body.html.indexOf(href) !== -1 &&
      post.body.html.indexOf("evil.example") === -1);
    check("the box's words change", post && /the system's plan/.test(post.body.html));
    check("the page shows the original address", p.querySelector("a").getAttribute("href") === href);

    // add a link → refused, nothing written
    const n = writes.length;
    click(w, p);
    ta.value = ta.value + ' <a href="https://other.example">more</a>';
    click(w, dock.querySelector(".fs-save"));
    await tick(); await tick();
    check("a save that adds a link is refused", writes.length === n && /keeps its place and address/.test(dock.querySelector(".fs-dock-msg").textContent));
    // drop the link → refused
    ta.value = "<strong>no links here</strong>";
    click(w, dock.querySelector(".fs-save"));
    await tick(); await tick();
    check("a save that drops a link is refused", writes.length === n);
  }

  // lockLinks directly
  {
    const { API } = loadDom();
    const r = API.lockLinks('<a href="x" target="_self">new words</a>', '<a href="https://a.example" target="_blank" rel="noopener">old</a>');
    check("lockLinks copies href, target and rel", r.ok && /href="https:\/\/a\.example"/.test(r.html) &&
      /target="_blank"/.test(r.html) && /rel="noopener"/.test(r.html) && /new words/.test(r.html));
    check("lockLinks refuses a changed link count", !API.lockLinks("<a href='y'>a</a><a href='z'>b</a>", "<a href='y'>a</a>").ok);
  }

  // ── (f) the section headings stay out of reach ──
  {
    const { w, API } = loadDom();
    await tick(); await tick();
    check("no block holds a section <h2>", API.blocks().every((b) => !b.el.querySelector("h2") && b.el.tagName !== "H2"));
    check("sanitize drops an <h2> typed into a box", !/<h2/i.test(API.sanitize("<h2>Heading</h2><p>ok</p>")));
    check("every section heading is outside every block",
      Array.prototype.every.call(w.document.querySelectorAll("main > section > h2"), (h) => !h.closest("[data-fsk]")));
  }

  let failed = 0;
  for (const [name, ok] of results) {
    console.log((ok ? "PASS " : "FAIL ") + name);
    if (!ok) failed++;
  }
  console.log("\n" + (failed ? failed + " FAILED" : "All " + results.length + " checks passed"));
  process.exit(failed ? 1 : 0);
})();

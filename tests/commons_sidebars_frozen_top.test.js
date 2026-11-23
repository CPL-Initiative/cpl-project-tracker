// Every sidebar resizes, and its top row stays frozen (Sam, 2026-11-22, in session, S705: "the sidebar needs to be
// adjustable width and the top row, including the close button, should be frozen to the tope as you scroll--this is a
// rule to apply to all side bars"; cpl_memory r-sidebars-resize-and-frozen-top-sam-2026-11-22). The Subjects panel was
// first (tests/commons_subjects_tools.test.js); S712 converts the two other Commons side panels.
//
// WHAT THIS GUARDS:
//   (1) College Data Collection's panel (commons_data.js, #collect/...): the top row, Close included, sits in one
//       sticky head inside the panel's one scroller, and the panel keeps its grip;
//   (2) the course panel on the CPL Commons front page (commons_handover.js, #commons/course/<key>): a grip on its
//       left edge, a focusable separator with its value; Left widens, Right narrows, Home returns its own width; the
//       width lasts the visit, nothing is stored, and the page beside it keeps its list in view at that width;
//   (3) that panel's top row (the eyebrow, Close, Previous and Next) sits in one sticky head inside its scroller, and
//       a narrow window keeps the full-row panel with no grip.
//
// Run from repo root: `npm test` (or `node tests/commons_sidebars_frozen_top.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, detail) { results.push([name, !!cond, detail]); }

const SESSION = fs.readFileSync("cpl_session.js", "utf8");
const PROGRESS = fs.readFileSync("commons_progress.js", "utf8");
const COMMONS = fs.readFileSync("commons.js", "utf8");
const DATA_JS = fs.readFileSync("commons_data.js", "utf8");
const HANDOVER = fs.readFileSync("commons_handover.js", "utf8");
const DATA = JSON.parse(fs.readFileSync("kb/status/commons_data.json", "utf8"));
const STATUS = fs.existsSync("kb/status/commons.json") ? JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8")) : {};

function dom(hash) {
  const d = new JSDOM('<!doctype html><html><head></head><body><div id="tab-commons"><div id="commons-root">Loading</div></div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "dangerously" });
  const w = d.window;
  const bag = () => { const o = {}; return { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } }; };
  Object.defineProperty(w, "localStorage", { value: bag(), configurable: true });
  Object.defineProperty(w, "sessionStorage", { value: bag(), configurable: true });
  return w;
}
function run(w, srcs) { srcs.forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); }); }
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 30; i++) await tick(); }
function css(w, id) { const s = w.document.getElementById(id); return s ? s.textContent : ""; }

(async () => {
  {
    const college = (DATA.colleges || [])[0];
    const slug = String(college && college.name || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const w = dom("#collect/college/" + slug);
    const files = { "kb/status/commons_data.json": DATA, "kb/status/commons.json": STATUS };
    w.fetch = (url) => files[String(url)] ? Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(files[String(url)]))) })
      : Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    run(w, [SESSION, PROGRESS, DATA_JS, COMMONS]);
    await w.CPL_COMMONS.boot(); await settle();
    const d = w.document, panel = d.querySelector("#cdd-panel:not([hidden])"), head = d.getElementById("cdd-panel-head"), C = css(w, "cdd-css");
    check("(1) a college's panel opens from its address", !!panel, w.location.hash);
    check("(1) ⭐ the head holds the title and Close, inside the panel's one scroller",
      !!head && !!head.querySelector("#cdd-panel-h") && !!head.querySelector("#cdd-panel-close") && head.parentNode.classList.contains("cdd-panel-in"));
    check("(1) ⭐ the head is sticky at the top and the scroller is the panel body",
      /\.cdd-panel-head \{ position:sticky; top:0;/.test(C) && /\.cdd-panel-in \{[^}]*overflow-y:auto/.test(C) && /\.cdd-panel-head \{[^}]*background:var\(/.test(C));
    check("(1) the panel keeps its grip, a separator with its value", !!panel && !!panel.querySelector('.cdd-grip[role="separator"][aria-valuenow]'));
  }
  {
    const w = dom("#commons");
    w.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    run(w, [HANDOVER]);
    const H = w.CPL_HANDOVER, host = w.document.getElementById("tab-commons");
    const list = [{ course: "BRDC 127A", title: "Broadcast One", control_number: "CCC000111", college: "Ohlone College", college_slug: "ohlone" },
      { course: "BRDC 127B", title: "Broadcast Two", control_number: "CCC000112", college: "Ohlone College", college_slug: "ohlone" }];
    H.panel.set(list, { host: host });
    H.panel.open("CCC000111"); await settle();
    const d = w.document, aside = d.getElementById("cho-panel"), grip = () => d.getElementById("cho-grip"), head = d.getElementById("cho-panel-head");
    check("(2) ⭐ the course panel carries a grip on its left edge: a focusable separator with its label and value",
      !!grip() && grip().getAttribute("role") === "separator" && grip().getAttribute("tabindex") === "0" && grip().getAttribute("aria-label") === "Resize the panel"
      && grip().getAttribute("aria-orientation") === "vertical" && grip().getAttribute("aria-valuenow") === "476" && aside.firstChild === grip());
    const key = (k) => grip().dispatchEvent(new w.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
    key("ArrowLeft");
    check("(2) ⭐ Left widens the panel a step, and the page beside it follows",
      aside.style.width === "516px" && grip().getAttribute("aria-valuenow") === "516" && host.style.getPropertyValue("--cho-pw") === "516px", aside.style.width);
    key("ArrowRight"); key("ArrowRight");
    check("(2) Right narrows it", aside.style.width === "436px", aside.style.width);
    H.panel.step(1); await settle();
    check("(2) the width lasts the visit: the next course keeps it", d.getElementById("cho-panel").style.width === "436px" && grip().getAttribute("aria-valuenow") === "436");
    key("Home");
    check("(2) Home returns the panel's own width", aside.style.width === "" && host.style.getPropertyValue("--cho-pw") === "" && grip().getAttribute("aria-valuenow") === "476");
    check("(2) nothing is stored", (w.localStorage.length || 0) === 0 && (w.sessionStorage.length || 0) === 0);
    const C = css(w, "cho-css");
    check("(3) ⭐ the head holds the eyebrow, Close, Previous and Next, inside the panel's one scroller",
      !!head && !!head.querySelector("#cho-panel-close") && !!head.querySelector("#cho-prev") && !!head.querySelector("#cho-next") && head.parentNode.classList.contains("cho-panel-in"));
    check("(3) ⭐ the head is sticky at the top, over its own background",
      /\.cho-panel-head \{ position:sticky; top:0;/.test(C) && /\.cho-panel-in \{[^}]*overflow-y:auto/.test(C) && /\.cho-panel-head \{[^}]*background:var\(/.test(C));
    check("(3) a narrow window keeps the full-row panel and hides the grip", /@media \(max-width: 560px\) \{[^\n]*\.cho-grip \{ display:none; \}/.test(C));
    check("(3) the page's reserve beside the panel reads the panel's width", /padding-right:calc\(var\(--cho-pw, 476px\) \+ 24px\)/.test(C));
  }
  let fail = 0;
  for (const [n, ok, d] of results) { console.log((ok ? "PASS " : "FAIL ") + n + (ok ? "" : "  " + JSON.stringify(d))); if (!ok) fail++; }
  console.log("\n" + (fail ? fail + " FAILED" : "all passed"));
  process.exit(fail ? 1 : 0);
})();

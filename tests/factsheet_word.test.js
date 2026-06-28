// Fact Sheet "⬇ Word" export (fact-sheet/factsheet_word.js) — jsdom test.
//
// Guards:
//  (a) the page wires it: a #btn-word button + the <script> tag are present;
//  (b) buildDoc() returns an mso-namespaced .doc string + a dated filename;
//  (c) it STRIPS chrome (TOC, curate controls, the live chip, .no-print) and
//      reviewer-hidden boxes (.fs-ov-hidden);
//  (d) it EXPANDS content (the statewide CSS-grid becomes a real <table>) and
//      rewrites images to ABSOLUTE URLs;
//  (e) it reflects the live/edited DOM (a box's current innerHTML is included);
//  (f) it does NOT mutate the on-screen DOM (clone-not-mutate).
//
// Run from repo root: `npm test` (or `node tests/factsheet_word.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const HTML = fs.readFileSync("fact-sheet/index.html", "utf8");
const SRC = fs.readFileSync("fact-sheet/factsheet_word.js", "utf8");

// ── Part A — static wiring on the shipped page ──
check("index.html includes factsheet_word.js", /<script src="\.\/factsheet_word\.js"><\/script>/.test(HTML));
check("index.html has the #btn-word button", /id="btn-word"/.test(HTML));

// ── Part B — behavior in jsdom ──
const dom = new JSDOM(HTML, { runScripts: "outside-only",
  url: "https://cpl-initiative.github.io/cpl-project-tracker/fact-sheet/" });
const w = dom.window;
w.eval(SRC);
const API = w.CPL_FACTSHEET_WORD;
check("exposes CPL_FACTSHEET_WORD API", API && typeof API.buildDoc === "function");

const beforeMain = w.document.querySelector("main").innerHTML;
const out = API.buildDoc();
check("buildDoc returns { html, filename }", out && typeof out.html === "string" && typeof out.filename === "string");
check("filename is California_CPL_Fact_Sheet_<date>.doc",
  /^California_CPL_Fact_Sheet_\d{4}-\d{2}-\d{2}\.doc$/.test(out.filename));

const h = out.html;
check("doc carries the mso Word namespace", /urn:schemas-microsoft-com:office:word/.test(h));
check("doc declares a WordSection1 @page", /@page WordSection1/.test(h));
check("doc starts with a UTF-8 BOM", h.charCodeAt(0) === 0xFEFF);
check("doc carries a synthesized masthead title", /Credit for Prior Learning \(CPL\) Fact Sheet/.test(h));
check("doc includes real content (Executive summary)", /Executive summary/.test(h));

// (c) chrome + hidden boxes stripped
check("strips the Curate button", !/id="btn-curate"/.test(h));
check("strips the table of contents", !/class="toc"/.test(h));
check("strips the live-data chip", !/id="live-chip"/.test(h));
check("strips .no-print controls", !/btn-print/.test(h));

// (d) statewide grid → real table; images absolute
check("statewide grid is rebuilt as a real <table>", /<table class="data sw-tbl">/.test(h) && /Welding/.test(h));
check("images are rewritten to absolute URLs", /<img[^>]+src="https?:\/\//.test(h) && !/src="\.\/img/.test(h));

// (e) reflects the edited/live DOM
{
  const dom2 = new JSDOM(HTML, { runScripts: "outside-only", url: "https://x/cpl-project-tracker/fact-sheet/" });
  const w2 = dom2.window; w2.eval(SRC);
  // Simulate a Curate edit (box innerHTML) + a reviewer-hidden box.
  const card = w2.document.querySelector("#resources .res");
  card.innerHTML = '<a class="res-title" href="#">MARKER-EDIT</a>';
  const exec = w2.document.querySelector("#exec-summary p");
  exec.textContent = "HIDDENMARKER12345";
  exec.classList.add("fs-ov-hidden");
  const out2 = w2.CPL_FACTSHEET_WORD.buildDoc();
  check("doc reflects a Curate edit (current innerHTML)", /MARKER-EDIT/.test(out2.html));
  check("doc excludes a reviewer-hidden (.fs-ov-hidden) box", !/HIDDENMARKER12345/.test(out2.html));
}

// (f) clone-not-mutate
check("buildDoc does not mutate the on-screen <main>", w.document.querySelector("main").innerHTML === beforeMain);

// ── report ──
let failed = 0;
for (const [name, ok] of results) { console.log((ok ? "PASS " : "FAIL ") + name); if (!ok) failed++; }
console.log("\n" + (failed ? failed + " FAILED" : "All " + results.length + " checks passed"));
process.exit(failed ? 1 : 0);

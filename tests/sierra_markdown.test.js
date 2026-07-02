// Sierra markdown renderer + Sierra-mark avatar — jsdom test (SkySierra, 2026-07-02).
//
// The three self-contained chat surfaces (sierra/sierra.js, cpl_chat.js,
// fact-sheet/factsheet_sierra.js) each carry an identical markdown-lite
// renderer. Session 94 upgraded it: Sierra's answers routinely include
// ## / ### headings, | pipe | tables |, --- rules, and 1. numbered lists,
// which the old paragraph/bullet-only pass showed as RAW TEXT (Sam's POST/AJ
// answer paste — the motivating failure mode). This test guards:
//  (a) tables render as <table> with th/td (and inline md inside cells);
//  (b) headings map # / ## → h3, ### → h4, #### → h5;
//  (c) --- becomes <hr>; numbered lists become <ol>; bullets stay <ul>;
//  (d) a paragraph followed by list items in the SAME block splits correctly
//      (the old renderer required a block to be all-list);
//  (e) XSS stays impossible — escape-first survives inside cells/headings;
//  (f) all three surfaces expose the SAME renderer behavior (kept in sync);
//  (g) the 🏔️/🎓 emoji avatars are replaced by the inline Whitney-roundel
//      SIERRA_MARK (safe static SVG) in all three files + both HTMLs' rail.
//
// Run from repo root: `npm test` (or `node tests/sierra_markdown.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Load each surface in a bare DOM and grab its exposed helpers ──
function loadHelpers(src, globalKey, opts) {
  const dom = new JSDOM("<!doctype html><html><head></head><body>" + ((opts && opts.body) || "") + "</body></html>", {
    runScripts: "outside-only",
    url: "https://cpl-initiative.github.io/cpl-project-tracker/",
  });
  const w = dom.window;
  w.fetch = () => Promise.reject(new Error("no network in test"));
  w.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  w.eval(src);
  return w[globalKey];
}

const SIERRA = loadHelpers(fs.readFileSync("sierra/sierra.js", "utf8"), "CPL_SIERRA_PAGE");
const CHAT = loadHelpers(fs.readFileSync("cpl_chat.js", "utf8"), "CPL_CHAT");
const FS = loadHelpers(fs.readFileSync("fact-sheet/factsheet_sierra.js", "utf8"), "CPL_FACTSHEET_SIERRA");

check("all three surfaces expose renderMarkdown",
  SIERRA && typeof SIERRA.renderMarkdown === "function" &&
  CHAT && typeof CHAT.renderMarkdown === "function" &&
  FS && typeof FS.renderMarkdown === "function");

const md = (t) => SIERRA.renderMarkdown(t);

// ── (a) tables ──
{
  const table = "| College | CPL Landing Page |\n|---|---|\n| Norco College | [Link](https://example.com/norco) |\n| Chabot College | none |";
  const h = md(table);
  check("pipe table renders as <table>", /<table>/.test(h) && /<\/table>/.test(h));
  check("table header cells become <th>", /<th>College<\/th><th>CPL Landing Page<\/th>/.test(h));
  check("table body rows become <td>", /<td>Norco College<\/td>/.test(h) && /<td>Chabot College<\/td>/.test(h));
  check("inline markdown works inside cells",
    /<td><a href="https:\/\/example\.com\/norco"[^>]*>Link<\/a><\/td>/.test(h));
  check("separator row is consumed, not rendered", !/---/.test(h.replace(/<[^>]+>/g, "")));

  const spaced = "| A | B |\n| :--- | ---: |\n| 1 | 2 |";
  check("padded/aligned separator row also detected", /<table>/.test(md(spaced)) && /<td>1<\/td>/.test(md(spaced)));

  const headerOnly = "| A | B |\n|---|---|";
  check("header-only table renders without a tbody", /<thead>/.test(md(headerOnly)) && !/<tbody>/.test(md(headerOnly)));

  const partial = "| A | B |"; // streaming: separator not arrived yet
  check("a lone pipe line (mid-stream) degrades to a paragraph", /<p>/.test(md(partial)) && !/<table>/.test(md(partial)));
}

// ── (b) headings ──
{
  check("## maps to h3", /<h3>Big Section<\/h3>/.test(md("## Big Section")));
  check("# also maps to h3 (bubble scale)", /<h3>Top<\/h3>/.test(md("# Top")));
  check("### maps to h4", /<h4>Sub<\/h4>/.test(md("### Sub")));
  check("#### maps to h5", /<h5>Tiny<\/h5>/.test(md("#### Tiny")));
  check("inline md works inside a heading", /<h4>The <strong>Opportunity<\/strong><\/h4>/.test(md("### The **Opportunity**")));
  check("a #hashtag without a space is NOT a heading", !/<h\d/.test(md("#nospace")));
}

// ── (c) hr + lists ──
{
  check("--- becomes <hr>", /<hr>/.test(md("above\n\n---\n\nbelow")));
  const ol = md("1. Review the existing statewide CR\n2. Map it to local courses\n3. Ratify locally");
  check("numbered list becomes <ol> with 3 items", /<ol>/.test(ol) && (ol.match(/<li>/g) || []).length === 3);
  check("ol item text survives", /<li>Map it to local courses<\/li>/.test(ol));
  const ul = md("- one\n- two");
  check("bullet list still becomes <ul>", /<ul><li>one<\/li><li>two<\/li><\/ul>/.test(ul));
  const mixed = md("1. first\n- switch");
  check("list type switch splits into ol then ul", /<\/ol><ul>/.test(mixed));
}

// ── (d) paragraph + list in the same block (single newline apart) ──
{
  const h = md("Some notable examples:\n- Mt. San Antonio College\n- Chabot College");
  check("paragraph then list in one block renders both",
    /<p>Some notable examples:<\/p><ul>/.test(h) && (h.match(/<li>/g) || []).length === 2);
}

// ── (e) XSS: escape-first survives the new block paths ──
{
  const evil = "| <script>alert(1)</script> | b |\n|---|---|\n| <img src=x onerror=alert(2)> | c |\n\n## <script>alert(3)</script>";
  const h = md(evil);
  check("script/img tags stay escaped inside tables + headings",
    h.indexOf("<script>") === -1 && h.indexOf("<img") === -1 && /&lt;script&gt;/.test(h));
  const dom = new JSDOM("<div id='x'></div>", { runScripts: "dangerously" });
  dom.window.document.getElementById("x").innerHTML = h;
  check("rendered HTML contains no live script/img nodes",
    dom.window.document.querySelectorAll("script, img").length === 0);
}

// ── italics + existing inline features intact ──
{
  const h = md("see **bold**, *ital*, `code` and https://map.rccd.edu now");
  check("bold/code/bare-URL links intact", /<strong>bold<\/strong>/.test(h) && /<code>code<\/code>/.test(h) &&
    /<a href="https:\/\/map\.rccd\.edu"[^>]*rel="noopener/.test(h));
  check("*single asterisks* render as <em>", /<em>ital<\/em>/.test(h));
  check("a lone mid-sentence asterisk pair around spaces is left alone", !/<em>/.test(md("3 * 4 * 5")));
}

// ── (f) the three surfaces render identically ──
{
  const sample = "## H\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n1. one\n2. two\n\n---\n\n- bullet\n\n**bold** *em* `c` [t](https://x.example/) https://y.example/";
  const a = SIERRA.renderMarkdown(sample), b = CHAT.renderMarkdown(sample), c = FS.renderMarkdown(sample);
  check("sierra page + COBI tab renderers agree byte-for-byte", a === b);
  check("fact-sheet drawer renderer agrees byte-for-byte", a === c);
}

// ── (g) the Sierra mark replaces the emoji avatars ──
{
  check("all three surfaces expose SIERRA_MARK (Whitney roundel SVG)",
    typeof SIERRA.SIERRA_MARK === "string" && /<svg/.test(SIERRA.SIERRA_MARK) && /circle/.test(SIERRA.SIERRA_MARK) &&
    typeof CHAT.SIERRA_MARK === "string" && typeof FS.SIERRA_MARK === "string");
  const srcs = {
    "sierra/sierra.js": fs.readFileSync("sierra/sierra.js", "utf8"),
    "cpl_chat.js": fs.readFileSync("cpl_chat.js", "utf8"),
    "fact-sheet/factsheet_sierra.js": fs.readFileSync("fact-sheet/factsheet_sierra.js", "utf8"),
  };
  Object.keys(srcs).forEach(function (f) {
    check(f + " no longer renders the \u{1F3D4} emoji avatar", srcs[f].indexOf("\u{1F3D4}") === -1);
  });
  check("cpl_chat.js no longer uses the \u{1F393} avatar", srcs["cpl_chat.js"].indexOf("'\u{1F393}'") === -1);
  ["CPL_Dashboard.html", "index.html"].forEach(function (f) {
    const html = fs.readFileSync(f, "utf8");
    const anchor = html.match(/<a[^>]*href="sierra\/"[\s\S]*?<\/a>/);
    check(f + " rail anchor carries the Sierra-mark SVG, not the emoji",
      anchor && /<svg/.test(anchor[0]) && anchor[0].indexOf("\u{1F3D4}") === -1);
  });
  // The mark renders as real, safe SVG in a DOM.
  const dom = new JSDOM("<div id='m'></div>");
  dom.window.document.getElementById("m").innerHTML = SIERRA.SIERRA_MARK;
  const svg = dom.window.document.querySelector("#m svg");
  check("SIERRA_MARK parses to an <svg> with a roundel + ridge paths",
    svg && svg.querySelectorAll("circle").length === 1 && svg.querySelectorAll("path").length === 2);
}

// ── report ──
let pass = 0;
for (const [name, ok] of results) { console.log((ok ? "  ok  " : "FAIL  ") + name); if (ok) pass++; }
console.log("\nsierra_markdown.test.js: " + pass + "/" + results.length + " checks passed");
if (pass !== results.length) process.exit(1);

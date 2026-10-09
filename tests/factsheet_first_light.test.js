/* The Fact Sheet on First Light (S352).
 *
 * Sam, Open Asks Sheet 56 card 1 (2026-10-09): "Mock it up"; on the mock-up
 * (https://claude.ai/artifact/VLgB5mNnRCYVYdhneEeLus), in chat the same day:
 * "Fact Sheet looks great!" The proposal was ported into fact-sheet/factsheet.css.
 * These checks pin what the cards promised him: First Light's type on screen, a
 * dark palette that never reaches paper and follows COBI's theme control, and
 * print that keeps Cambria and Calibri. Text checks, because jsdom computes no
 * cascade across media.
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const CSS = fs.readFileSync(path.join(ROOT, "fact-sheet/factsheet.css"), "utf8");
const HTML = fs.readFileSync(path.join(ROOT, "fact-sheet/index.html"), "utf8");
const code = CSS.replace(/\/\*[\s\S]*?\*\//g, "");

let pass = 0, total = 0;
function check(name, cond, why) {
  total++; if (cond) pass++;
  console.log((cond ? "PASS " : "FAIL ") + name + (cond ? "" : "  — " + (why || "")));
}

// Find the body of an at-rule block by its prelude, matching braces.
function block(src, prelude) {
  const at = src.indexOf(prelude);
  if (at < 0) return null;
  let i = src.indexOf("{", at), depth = 0, start = i;
  for (; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) return src.slice(start + 1, i);
  }
  return null;
}

// ── type ──
check("the four faces are Sierra's self-hosted files, and each exists",
  [...code.matchAll(/url\('\.\.\/sierra\/fonts\/([\w.-]+)'\)/g)].map((m) => m[1])
    .filter((f) => fs.existsSync(path.join(ROOT, "sierra/fonts", f))).length === 4);
check("no font is fetched from another host", !/fonts\.googleapis|fonts\.gstatic|https?:\/\//.test(code));
check("the screen's body face is Source Sans 3", /--font-body:\s*'Source Sans 3'/.test(code));
check("the display face is Playfair Display", /--font-display:\s*'Playfair Display'/.test(code));

// ── dark never reaches paper ──
const darkOs = block(code, "@media screen and (prefers-color-scheme: dark)");
const darkPick = block(code, "@media screen {");
check("the OS dark block is screen-only and yields to an explicit light choice",
  !!darkOs && /:root:not\(\[data-theme="light"\]\)/.test(darkOs));
check("the explicit dark block is screen-only", !!darkPick && /:root\[data-theme="dark"\]/.test(darkPick));
check("no dark block outside @media screen",
  (code.match(/data-theme="dark"\]/g) || []).length === 1 &&
  (code.match(/prefers-color-scheme:\s*dark/g) || []).length === 1);
const decls = (b) => (b || "").replace(/\s+/g, " ").match(/--[\w-]+:\s*[^;]+/g) || [];
check("both dark blocks set the same values", JSON.stringify(decls(darkOs)) === JSON.stringify(decls(darkPick)));

// ── print keeps the document pair ──
const print = block(code, "@media print");
check("print restores Cambria for prose and headings",
  !!print && /--font-body:\s*'Cambria'/.test(print) && /--font-display:\s*'Cambria'/.test(print));
check("print restores Calibri for data", !!print && /--font-data:\s*'Calibri'/.test(print));
check("print sets the figures back to the data face at 800",
  !!print && /\.kpi \.kpi-value, \.stat \.big \{ font-family: var\(--font-data\); font-weight: 800; \}/.test(print));

// ── seal navy: a fill everywhere, ink only through --seal-blue-text ──
const screenOnly = code.replace(print || "", "");
check("seal navy is never screen text except as --seal-blue-text",
  !/(^|[;{\s])color:\s*var\(--seal-blue\)/m.test(screenOnly));
check("dark lifts the seal ink to the on-dark grade", /--seal-blue-text:\s*#7DA1D4/.test(darkOs || ""));

// ── the page follows COBI's one theme control ──
check("index.html reads cpl_theme before the stylesheet, and follows a change in another tab",
  HTML.indexOf('localStorage.getItem("cpl_theme")') > -1 &&
  HTML.indexOf('localStorage.getItem("cpl_theme")') < HTML.indexOf('href="./factsheet.css"') &&
  /addEventListener\("storage",function\(e\)\{if\(e&&e\.key==="cpl_theme"\)/.test(HTML));
check("index.html preloads the two faces the first screen paints, and both files exist",
  [...HTML.matchAll(/<link rel="preload" href="\.\.\/(sierra\/fonts\/[\w.-]+)" as="font"/g)]
    .filter((m) => fs.existsSync(path.join(ROOT, m[1]))).length === 2);
// The drawer and the editor write seal navy as text through the ink token, so
// it lifts in dark; the fallback keeps the funding explainer, which hosts the
// drawer and defines only --seal-blue, as it was.
for (const f of ["fact-sheet/factsheet_sierra.js", "fact-sheet/factsheet_edit.js"]) {
  const src = fs.readFileSync(path.join(ROOT, f), "utf8");
  check(`${f} writes no seal navy text except through --seal-blue-text`,
    !/(^|[^-\w])color:var\(--seal-blue\)/m.test(src) && /color:var\(--seal-blue-text,var\(--seal-blue\)\)/.test(src));
}

// ── no phantom tokens ──
const defined = new Set(code.match(/--[\w-]+(?=\s*:)/g) || []);
const bare = [...code.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)].map((m) => m[1]).filter((t) => !defined.has(t));
check("every bare var() it reads is defined", bare.length === 0, [...new Set(bare)].join(", "));
check("no raw hex outside the token blocks",
  !/:[^;{}]*#[0-9a-fA-F]{3,8}\b/.test(code.replace(/:root[^{]*\{[^}]*\}/g, "")));

console.log("\n" + (pass === total ? "All " + total + " checks passed" : (total - pass) + " FAILED"));
process.exit(pass === total ? 0 : 1);

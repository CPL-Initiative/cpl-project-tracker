// The accessibility line on every Library page (#3560 part 2; S688).
//
// Sam's go of Nov 19, 2026 (8:23 AM PT, via COBIx on #3560): "Every Library document going forward carries a footer
// line generated from that piece's own check record, never boilerplate. It names the standard, the check date, the tool
// or reviewer, and a link to the check record. Example shape: 'Accessibility: WCAG 2.1 AA and Section 508, checked Nov
// 19, 2026, report linked.' Existing pieces, until they are re-checked, show 'Not yet certified' in that line."
//
// scripts/library_check.py writes the line; this reads a real Library page it stamped, in jsdom, and guards:
//   A. One line, in Sam's shape, built from the check record given: the standard, the date, the report linked.
//   B. A piece with no passing check reads the division's Not yet certified, with no link.
//   C. The line sits before the Ask Sierra script, which stays last in <body>; a second stamp replaces it in place.
//   D. Presentation: plain words and no glyph; the link is an underlined word; the colors are the public header's
//      tokens (no raw hex), and those tokens meet AA 4.5:1 on the page's own background in Light and in Dark.
//
// Run: node tests/library_check_footer.test.js
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const ROOT = path.resolve(__dirname, "..");
const SRC_PAGE = path.join(ROOT, "library", "cable-splicer-cpl-opportunities-mwmo31a1", "index.html");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "libfoot-"));

function stamp(file, checkJson) {
  const code = "import json, sys; sys.path.insert(0, 'scripts'); import library_check as lc\n" +
    "p = sys.argv[1]; c = json.loads(sys.argv[2])\n" +
    "t = open(p).read(); open(p, 'w').write(lc.stamp(t, lc.footer_block(c, lc.DEFAULT_SETTINGS)))";
  execFileSync("python3", ["-c", code, file, JSON.stringify(checkJson)], { cwd: ROOT, stdio: "pipe" });
  return fs.readFileSync(file, "utf8");
}
const PASS = { result: "pass", standard: "WCAG 2.1 AA and Section 508", tool_or_reviewer: "axe-core automated check",
  checked_at: "2026-11-19T20:00:00+00:00",
  report_url: "https://cpl-initiative.github.io/cpl-project-tracker/library/cable-splicer-cpl-opportunities-mwmo31a1/accessibility/20261119-200000Z.txt" };

const file = path.join(tmp, "index.html");
fs.copyFileSync(SRC_PAGE, file);
const passed = stamp(file, PASS);
const d = new JSDOM(passed).window.document;
const lines = d.querySelectorAll(".cpl-check-line");
const p = lines[0] && lines[0].querySelector("p");
check("A ⭐ one accessibility line, in Sam's shape, from the check record", lines.length === 1 && !!p &&
  p.textContent === "Accessibility: WCAG 2.1 AA and Section 508, checked Nov 19, 2026, report linked.", p && p.textContent);
const a = p && p.querySelector("a");
check("A ⭐ the words report linked link the check's own report, at its https address", !!a && a.textContent === "report linked" &&
  a.getAttribute("href") === PASS.report_url);

const none = stamp(file, null);
const d2 = new JSDOM(none).window.document;
const p2 = d2.querySelector(".cpl-check-line p");
check("B ⭐ with no passing check the line reads Not yet certified, with no link",
  d2.querySelectorAll(".cpl-check-line").length === 1 && !!p2 && p2.textContent === "Accessibility: Not yet certified." && !p2.querySelector("a"));
const failed = stamp(file, Object.assign({}, PASS, { result: "fail" }));
check("B a failed check reads Not yet certified too", /Accessibility: Not yet certified\./.test(failed) && !/report linked/.test(failed));

const body = d.body.innerHTML;
const scripts = d.body.querySelectorAll("script[src]");
check("C ⭐ the line sits before the Ask Sierra script, which stays last in <body>",
  body.indexOf("cpl-check-line") < body.indexOf("sierra/sidebar.js") && /sidebar\.js/.test(scripts[scripts.length - 1].getAttribute("src")) &&
  /<\/script>\n<\/body>\n<\/html>\n$/.test(passed));
check("C ⭐ a second stamp replaces the line in place: one block, never two", (none.match(/cpl-library-check:/g) || []).length === 1 &&
  (failed.match(/cpl-check-line"/g) || []).length === 1);

const block = (passed.match(/<!-- cpl-library-check:[\s\S]*?<!-- \/cpl-library-check -->/) || [""])[0];
check("D ⭐ plain words: no glyph or symbol in the line", /^[\x20-\x7E]*$/.test(p.textContent));
check("D the link is an underlined word", /\.cpl-check-line a\{color:var\(--cplh-link,inherit\);text-decoration:underline\}/.test(block));
check("D ⭐ its colors are the public header's tokens, never a raw hex, and no style attribute",
  /color:var\(--cplh-muted,inherit\)/.test(block) && !/#[0-9a-f]{3,8}\b/i.test(block) && !/\sstyle=/.test(block));
check("D the line's width follows the page's measure lever", /max-width:var\(--cpl-measure,none\)/.test(block));

// The tokens the line uses, on the page's own background, in both palettes (prototype/check_contrast.py's math).
function lum(hex) {
  const v = hex.replace("#", ""), c = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const vals = (name) => Array.from(new Set((passed.match(new RegExp("--" + name + ":\\s*(#[0-9A-Fa-f]{6})", "g")) || [])
  .map((m) => m.replace(/.*:\s*/, "").toUpperCase())));
const bg = vals("cplh-bg").sort((x, y) => lum(y) - lum(x)), muted = vals("cplh-muted").sort((x, y) => lum(x) - lum(y)),
  link = vals("cplh-link").sort((x, y) => lum(x) - lum(y));
const pairs = bg.length === 2 && muted.length === 2 && link.length === 2
  ? [[muted[0], bg[0]], [link[0], bg[0]], [muted[1], bg[1]], [link[1], bg[1]]] : [];
check("D ⭐ the line's text and link meet AA 4.5:1 on the page's background in Light and in Dark",
  pairs.length === 4 && pairs.every((x) => ratio(x[0], x[1]) >= 4.5), JSON.stringify(pairs.map((x) => [x[0], x[1], ratio(x[0], x[1]).toFixed(2)])));

fs.rmSync(tmp, { recursive: true, force: true });
let failedN = 0;
results.forEach(function (r) { if (!r[1]) failedN++; console.log((r[1] ? "ok   " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n       " + r[2])); });
console.log("\nlibrary_check_footer.test.js: " + (results.length - failedN) + "/" + results.length + " checks passed");
process.exit(failedN ? 1 : 0);

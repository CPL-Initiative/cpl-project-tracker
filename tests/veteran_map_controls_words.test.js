// The veteran map's controls are underlined words (S435's UI pass).
//
// First Light's Controls rule (Sam, 2026-10-09): a control that acts is an
// underlined cobalt word with no border and no fill; a toggle in a set marks
// its pick with weight and aria-pressed, never color alone. The map's Zoom in,
// Zoom out, Reset and region buttons were pills with a seal-blue fill on the
// pick until this pass.
//
// A pill still works and still passes AA, so nothing errors when a border or
// fill comes back. jsdom has no layout, so this reads the built page's CSS;
// `npm run a11y veteran-map` measures the painted targets.
//
// Run from repo root: `npm test` (or `node tests/veteran_map_controls_words.test.js`).
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "veteran-sprint-map", "ca_cpl_map_selfcontained.html"), "utf8");
const css = (html.match(/<style>([\s\S]*?)<\/style>/g) || []).join("\n").replace(/\/\*[\s\S]*?\*\//g, "");
const results = [];
function check(name, ok, detail) { results.push({ name, ok: !!ok, detail }); }

function rule(sel) {
  const re = new RegExp("(^|\\})\\s*" + sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\{([^}]*)\\}", "g");
  let m, body = "";
  while ((m = re.exec(css))) body += m[2];
  return body;
}

const b = rule(".btn");
check(".btn has a base rule", b.length > 0, "no rule found");
check(".btn draws no border", /border:\s*(0|none)\s*;/.test(b) && !/border:\s*1px/.test(b), b.trim());
check(".btn paints no fill", /background:\s*(none|transparent)\s*;/.test(b), b.trim());
check(".btn is a cobalt word", /color:\s*var\(--cobalt\)/.test(b), b.trim());
check(".btn is underlined at rest", /text-decoration:\s*underline/.test(b), b.trim());
check(".btn has no pill radius", !/border-radius/.test(b), b.trim());
const mh = /min-height:\s*(\d+)px/.exec(b);
check(".btn keeps the 24px target", mh && +mh[1] >= 24, mh ? mh[0] : "no min-height");
const on = rule('.btn[aria-pressed="true"]');
check("the pick is marked by weight", /font-weight:\s*700/.test(on), on.trim());
check("the pick paints no fill", !/background/.test(on), on.trim());
const gap = /gap:\s*\d+px\s+(\d+)px/.exec(rule(".group"));
check(".group spaces its words 18px apart", gap && +gap[1] >= 18, gap ? gap[0] : rule(".group").trim());

let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log((r.ok ? "  ok   " : "  FAIL ") + r.name + (r.ok ? "" : "  -- " + r.detail));
}
console.log(`\nveteran_map_controls_words: ${results.length - failed}/${results.length} passed`);
if (failed) process.exit(1);

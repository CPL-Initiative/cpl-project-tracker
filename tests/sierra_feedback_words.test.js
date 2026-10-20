// Sierra's public page — Copy, Helpful and Not helpful are underlined words (S434).
//
// First Light's Controls rule (Sam, 2026-10-09): a control that acts is an
// underlined cobalt-or-ink word with no border and no fill. My College's Sierra
// took it in S405 (cpl_chat.js); the public page kept its three pills and the
// note composer's filled Send until this pass (lane sierra-page-redesign, NEXT).
//
// The failure is silent: a pill still works and still passes AA, so nothing
// errors when a border or fill comes back. jsdom has no layout, so this reads
// the CSS rules; `npm run a11y sierra-asking` measures the painted targets.
//
// Run from repo root: `npm test` (or `node tests/sierra_feedback_words.test.js`).
const fs = require("fs");
const path = require("path");

const css = fs.readFileSync(path.join(__dirname, "..", "sierra", "sierra.css"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "");
const results = [];
function check(name, ok, detail) { results.push({ name, ok: !!ok, detail }); }

// Every declaration block whose selector list is exactly `sel` (base rules only).
function rule(sel) {
  const re = new RegExp("(^|\\})\\s*" + sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\{([^}]*)\\}", "g");
  let m, body = "";
  while ((m = re.exec(css))) body += m[2];
  return body;
}

for (const sel of [".s-fb-btn", ".s-fb-copy", ".s-fb-note button"]) {
  const b = rule(sel);
  check(sel + " has a base rule", b.length > 0, "no rule found");
  check(sel + " draws no border", /border:\s*(0|none)\s*;/.test(b) && !/border:\s*1px/.test(b), b.trim());
  check(sel + " paints no fill", /background:\s*(none|transparent)\s*;/.test(b), b.trim());
  check(sel + " is underlined at rest", /text-decoration:\s*underline/.test(b), b.trim());
  const mh = /min-height:\s*(\d+)px/.exec(b);
  check(sel + " keeps the 24px target", mh && +mh[1] >= 24, mh ? mh[0] : "no min-height");
}
// The pick is weight, never color alone.
for (const sel of [".s-fb-btn.on", ".s-fb-copy.on"]) {
  check(sel + " marks the pick by weight", /font-weight:\s*700/.test(rule(sel)), rule(sel).trim());
}
// Words at least 18px apart along the row (2.5.8 spacing, the rule's table).
const gap = /gap:\s*\d+px\s+(\d+)px/.exec(rule(".s-fb"));
check(".s-fb spaces its words 18px apart", gap && +gap[1] >= 18, gap ? gap[0] : rule(".s-fb").trim());

let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log((r.ok ? "  ok   " : "  FAIL ") + r.name + (r.ok ? "" : "  -- " + r.detail));
}
console.log(`\nsierra_feedback_words: ${results.length - failed}/${results.length} passed`);
if (failed) process.exit(1);

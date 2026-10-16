// tests/cpl_memory_first_light.test.js
//
// Memory on First Light (S398 UI pass). The tab is team-gated, so the signed-out cobi
// sweep measured its lock and masthead; the seeded sweep (a11y.config.js memory-add,
// memory-entry, memory-report and their -dark twins) renders synthetic rows and found
// these, each guarded here:
//  (a) twelve labels, hints and counts painted --text-faint, which First Light keeps for
//      decoration only: 3.24:1 on the light ground, 4.01:1 on the dark
//  (b) boxed and filled controls (Sam, 2026-10-09: controls are underlined words), the
//      filled primary and danger buttons among them; the two toggle sets mark the chosen
//      word by weight and aria-pressed
//  (c) targets under 24px: tag chips (23.3), the row's status control (16.5), a record's
//      tags, the "All" toggle (15.2 wide), and the two checkboxes' wrapping labels
//  (d) a zero-count tag chip faded to 1.99:1; its "0" already says it, a dashed edge marks it
//  (e) the kind pill printed white on the kind color, 2.65:1 on dark's light kinds
//  (f) emoji in rendered text (Sam, 2026-09-09: remove all emoji glyphs)
//
// Run from repo root: `npm test` (or `node tests/cpl_memory_first_light.test.js`).
const fs = require("fs");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const SRC = fs.readFileSync("cpl_memory.js", "utf8");
const at = SRC.indexOf("function ensureCss()");
const css = SRC.slice(at, SRC.indexOf("].join(", at));
function rule(sel) {
  const i = css.indexOf('"' + sel + "{");
  return i < 0 ? "" : css.slice(i, css.indexOf('}"', i) + 1);
}
check("the tab's CSS is found", css.length > 5000);

// (a)
check("(a) no text is painted --text-faint (decoration only in First Light)", !/color:var\(--text-faint\)/.test(css));

// (b)
const WORDS = [".cpl-mem .mem-btn", ".cpl-mem .mem-addbtn", ".cpl-mem .rp-toolbtn", ".cpl-mem .mr-btn",
  ".cpl-mem .mem-errbtn", ".cpl-mem .mem-seg-btn", ".cpl-mem .mi-curate"];
WORDS.forEach(function (sel) {
  const r = rule(sel);
  check("(b) " + sel + " is an underlined word: no border, no fill, 24px",
    /border:0;/.test(r) && /background:none;/.test(r) && /text-decoration:underline;/.test(r) &&
    /min-height:24px;/.test(r) && /min-width:24px;/.test(r));
});
check("(b) the filled primary is retired: weight carries the lead",
  !/background/.test(rule(".cpl-mem .mem-btn-primary")) && /font-weight:700/.test(rule(".cpl-mem .mem-btn-primary")));
check("(b) the danger word is red text, never a red fill", rule(".cpl-mem .mem-btn-danger") === '".cpl-mem .mem-btn-danger{color:var(--st-danger);}');
check("(b) the toggle sets lose their box", !/border:1px/.test(rule(".cpl-mem .mem-status-seg")) && !/border:1px/.test(rule(".cpl-mem .mem-viewseg")));
check("(b) the chosen toggle is marked by weight and by losing its underline",
  /font-weight:800/.test(rule(".cpl-mem .mem-seg-btn.is-active")) && /text-decoration:none/.test(rule(".cpl-mem .mem-seg-btn.is-active")));
check("(b) both toggle sets set aria-pressed", (SRC.match(/setAttribute\("aria-pressed"/g) || []).length >= 2);
check("(b) words in a row sit at least 18px apart",
  [".cpl-mem .mem-form-actions", ".cpl-mem .rp-tools", ".cpl-mem .mem-writeerr-acts", ".cpl-mem .mem-status-seg", ".cpl-mem .mem-viewseg"]
    .every(function (sel) { return / 18px;/.test(rule(sel)); }));

// (c)
[".cpl-mem .mf-tagchip", ".cpl-mem .mi-tag-btn", ".cpl-mem .mem-field-check", ".cpl-mem .mr-ctl"].forEach(function (sel) {
  check("(c) " + sel + " is at least 24px tall", /min-height:24px;/.test(rule(sel)));
});

// (d)
check("(d) a zero-count tag chip is not faded", !/opacity/.test(rule(".cpl-mem .mf-tagchip.is-zero")) && /dashed/.test(rule(".cpl-mem .mf-tagchip.is-zero")));

// (e)
check("(e) the kind pill's text is the opaque surface, never white", /color:var\(--surface-opaque\)/.test(rule(".cpl-mem .rp-kindpill")) && !/color:#fff[;}]/i.test(css));

// (f)
const rendered = SRC.split("\n").filter(function (l) { return !/^\s*(\/\/|\/\*|\*)/.test(l); }).map(function (l) {
  const c = l.indexOf("  // "); return c < 0 ? l : l.slice(0, c);
}).join("\n");
check("(f) no emoji in rendered text", !/[\u{1F300}-\u{1FAFF}\u{2728}]/u.test(rendered));

const failed = results.filter((r) => !r[1]);
results.forEach((r) => console.log((r[1] ? "ok   " : "FAIL ") + r[0]));
console.log(failed.length ? failed.length + " of " + results.length + " checks failed" : results.length + "/" + results.length + " checks passed");
process.exit(failed.length ? 1 : 0);

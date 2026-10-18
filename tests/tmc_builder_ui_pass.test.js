// TMC Builder — the S410 UI pass (tmc_builder.js).
//
// The sweep measures the directory, the view's first screen. Before the pass it found:
//  (a) the "official" and "PDF" source links were 15px tall, 90 targets under 24px;
//  (b) at 390px the college picker's 260px floor pushed the page 38px sideways;
//  (c) in light, the empty-ADT dash was #9CA3AF on the page ground, 2.27:1;
//  (d) in dark, the count and degree chips kept a light #EEF2FB fill under the themed
//      navy text (1.08:1), and the TMC names kept #1F2937 on the night ground (1.24:1).
// And First Light: (e) the action buttons were boxed and filled; controls are
// underlined words (Sam, 2026-10-09). (f) The neutral layer (lines, hovers, the review
// bar, the seal-blue heads' text) used raw hex where the theme has a token.
// Layout and color are invisible to jsdom, so each check reads the source; each fails
// on the old file. Remaining raw hex, measured and named in the cobi-dark-mode lane:
// the status-chip palettes and the GE panel's gold tints.
//
// Run from repo root: `npm test` (or `node tests/tmc_builder_ui_pass.test.js`).
const fs = require("fs");
const SRC = fs.readFileSync("tmc_builder.js", "utf8");
const CODE = SRC.replace(/^\s*\/\/.*$/gm, "");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why || ""]); }
const rule = (sel) => {
  const m = CODE.match(new RegExp("#tab-tmc-builder " + sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\{([^}]*)\\}"));
  return m ? m[1] : "";
};

const src = rule(".tmc-srclink");
check("(a) a source link is a 24px target", /min-height:24px/.test(src) && /inline-flex/.test(src), src);
check("(b) the college picker shrinks to its column", /min-width:min\(260px,100%\)/.test(rule(".tmc-pick select"))
  && /min-width:0/.test(rule(".tmc-pick")));
check("(c) the empty and off ADT states read in the muted text grade",
  /color:var\(--text-muted\)/.test(rule(".tmc-adt.adt-off,#tab-tmc-builder .tmc-adt.adt-none")));
for (const sel of [".tmc-listcount", ".tmc-deg-sm", ".tmc-left .tmc-cid", ".tmc-totals"]) {
  check("(d) " + sel + " fills from the theme", /background:var\(--surface-2\)/.test(rule(sel)), rule(sel).slice(0, 120));
}
check("(d) the TMC and course names take the strong text token",
  /var\(--text-strong\)/.test(rule(".tmc-lt-name")) && /var\(--text-strong\)/.test(rule(".tmc-left .tmc-ctitle")));
const btn = rule(".tmc-btn");
check("(e) .tmc-btn is an underlined word, no border or fill, 24px",
  /border:0/.test(btn) && /background:none/.test(btn) && /text-decoration:underline/.test(btn)
    && /min-height:24px/.test(btn) && /var\(--cobalt\)/.test(btn), btn);
check("(e) no filled primary and no fill on hover",
  !/\.tmc-btn\.primary\{[^}]*background/.test(CODE) && !/\.tmc-btn:hover\{[^}]*background/.test(CODE));
check("(e) a button shows keyboard focus", /\.tmc-btn:focus-visible\{/.test(CODE));
check("(e) the action words sit at least 18px apart", /gap:18px/.test(rule(".tmc-actions")));
const NEUTRAL = /#eef2fb|#d6e0f5|#eef2f7|#eef6ff|#1f2937|#9ca3af|#cfe3ff|#0d2c52|#e5e7eb|#f1f5f9|#c7ddff|#1e3a5f/i;
check("(f) none of the neutral raw colors remains in the view's CSS", !NEUTRAL.test(CODE), (CODE.match(NEUTRAL) || [""])[0]);
check("(f) the seal-blue heads' text takes --on-seal-blue", !/color:#fff[;}]/i.test(CODE));

let fail = 0;
for (const [name, ok, why] of results) {
  console.log((ok ? "  ok   " : "  FAIL ") + name + (ok || !why ? "" : "  [" + why + "]"));
  if (!ok) fail++;
}
console.log(fail ? `\n${fail} of ${results.length} failed` : `\nall ${results.length} pass`);
process.exit(fail ? 1 : 0);

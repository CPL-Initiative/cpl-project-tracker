// Noncredit & Learning Partners — the S365 UI pass (nc_learning_partners.js).
//
// `npm run a11y` on cobi:nc-learning-partners (light and dark) found:
//  (a) the section headings were h3 under the page's h1 (an h1 -> h3 skip);
//  (b) the section chip at 4.38:1 in light: --text-muted dimmed by opacity .85;
//  (c) the dormant-exhibits table scrolls at 390px and was not keyboard reachable.
// A seeded sweep (nc-partners-editor, with -dark: the team phrase, notes and an
// artifact, which no unseeded sweep paints) found:
//  (d) an artifact's title link, standing alone, 20px tall.
// And First Light: (e) the toolbar, Add insight, Attach artifact and Revise were
// boxed and dashed pills; controls are underlined words (Sam, 2026-10-09). (f) The
// labels led with glyphs (refresh, copy, download arrows, a printer, a paperclip).
// jsdom has no layout or color, so these read the source; each fails on the old file.
//
// Run from repo root: `npm test` (or `node tests/nc_learning_partners_ui_pass.test.js`).
const fs = require("fs");
const SRC = fs.readFileSync("nc_learning_partners.js", "utf8");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why || ""]); }
const rule = (sel) => { const i = SRC.indexOf(sel + "{"); if (i < 0) return ""; return SRC.slice(i, SRC.indexOf("}", i)).replace(/",\s*"/g, ""); };

check("(a) a section heading is an h2", /s\.appendChild\(el\("h2", null, title\)\)/.test(SRC) && /summary h2\{/.test(SRC));
check("(a) nothing under it skips to h4", !/el\("h4"/.test(SRC) && !/\bh4[{ :.]/.test(SRC.replace(/\/\/.*$/gm, "")));
check("(b) the section chip's ink is not dimmed by opacity", /\.nclp-chip\.sec2\{[^}]*\}/.test(SRC) && !/\.nclp-chip\.sec2\{[^}]*opacity/.test(SRC));
check("(c) the scrolling table is a named, focusable region",
  /w\.setAttribute\("tabindex", "0"\); w\.setAttribute\("role", "region"\);/.test(SRC) && /w\.setAttribute\("aria-label", "Dormant statewide exhibits"\)/.test(SRC));
check("(d) an artifact's title link clears 24px", /min-height:24px/.test(rule(" a.nclp-artlink")));
for (const sel of [" .nclp-btn", " button.nclp-addnote,#\" + ROOT_ID + \" button.nclp-revise", " a.nclp-jl"]) {
  const r = rule(sel);
  check("(e) " + sel.trim().split(",")[0] + " is an underlined word, no border or fill, 24px",
    !!r && /text-decoration:underline/.test(r) && /min-height:24px/.test(r) && !/border:1px/.test(r) && !/border-radius:999px/.test(r), r.slice(0, 120));
}
const labels = (SRC.match(/btn\("[^"]*"/g) || []).concat(SRC.match(/el\("button", "nclp-addnote", "[^"]*"/g) || []);
const GLYPH = /[\u{1F300}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{29C9}]/u;
check("(f) toolbar and add-buttons are words (no arrow, copy, printer or paperclip glyphs)",
  labels.length >= 8 && labels.every((l) => !GLYPH.test(l)), labels.filter((l) => GLYPH.test(l)).join(" | "));

let failed = 0;
results.forEach(([n, ok, why]) => { if (!ok) failed++; console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "  — " + why)); });
console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
process.exit(failed ? 1 : 0);

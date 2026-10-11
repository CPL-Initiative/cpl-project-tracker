// tests/contracts_first_light.test.js
//
// Contracts on First Light (S364 UI pass). The register is gated, so the signed-out cobi
// sweep measured its gate; the seeded sweep (a11y.config.js contracts, contracts-dark)
// renders the V0718 fixture and found these, each guarded here:
//  (a) the band's ground flipped: --navy-primary turns light in dark, and the band's faint
//      labels read 3.56:1 on it. The band is --seal-blue in both themes, with --white and
//      --on-seal-blue-muted, inks that do not flip either
//  (b) text in --text-faint, which the theme reserves for decoration: the item number, the
//      caret, the "executed" note (3.62:1 in light)
//  (c) a status chip with no ground of its own took the browser's dark button face
//      (#6B6B6B), and "Complete" read 1.99:1
//  (d) boxed and filled controls, and a raw #fff on a hover over a cobalt that flips
//
// Run from repo root: `npm test` (or `node tests/contracts_first_light.test.js`).
const fs = require("fs");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const SRC = fs.readFileSync("contracts.js", "utf8");
const css = SRC.slice(SRC.indexOf('st.textContent = ['), SRC.indexOf('].join(', SRC.indexOf('st.textContent = [')));
function rule(sel) {
  const i = css.indexOf('"' + sel + '{');
  return i < 0 ? "" : css.slice(i, css.indexOf('}"', i) + 1);
}
check("the tab's CSS is found", css.length > 5000);

// (a)
check("(a) the band is --seal-blue with --white ink", /background:var\(--seal-blue\)/.test(rule(".ctr-band"))
  && /color:var\(--white\)/.test(rule(".ctr-band")));
[".ctr-eyebrow", ".ctr-vend", ".ctr-idc .k", ".ctr-idc .v small", ".ctr-sharekey"].forEach(function (s) {
  check("(a) " + s + " is --on-seal-blue-muted", /color:var\(--on-seal-blue-muted\)/.test(rule(s)));
});
[".ctr-band h2", ".ctr-idc .v"].forEach(function (s) {
  check("(a) " + s + " is --white", /color:var\(--white\)/.test(rule(s)));
});

// (b)
[".ctr-dnum", ".ctr-icaret", ".ctr-fylab em"].forEach(function (s) {
  check("(b) " + s + " is text, so not --text-faint", rule(s) && !/--text-faint/.test(rule(s)));
});

// (c)
check("(c) the chip sets its own ground", /background:none/.test(rule(".ctr-chip")));

// (d)
const btn = rule(".ctr-btn,.ctr-btn-p");
check("(d) the controls are underlined cobalt words, 24px tall, no border, no fill",
  /border:0/.test(btn) && /background:none/.test(btn) && /color:var\(--cobalt\)/.test(btn)
    && /min-height:24px/.test(btn) && /text-decoration:underline/.test(btn));
check("(d) no rule fills the lead control", !/"\.ctr-btn-p\{background:var\(--cobalt\)/.test(css));
const hex = css.replace(/var\(--[a-z-]+, ?#[0-9A-Fa-f]{3,6}\)/g, "").match(/#[0-9A-Fa-f]{3,6}\b/g) || [];
check("(d) no raw hex in the tab's CSS: " + (hex.join(" ") || "none"), !hex.length);

let pass = 0;
results.forEach(function (r) { if (r[1]) pass++; else console.log("FAIL " + r[0]); });
console.log("contracts_first_light: " + pass + "/" + results.length + " passed");
if (pass !== results.length) process.exit(1);

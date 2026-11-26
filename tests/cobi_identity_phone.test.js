// The Sign in pane fits a phone, upright or turned (Sam, 2026-11-26: "couldn't login because the screen is outside phone
// screen and won't resize or change orientation when turned"). The pane hung from the right edge of a Sign in word that
// sits at the left on a phone, so it opened off the left of the screen (measured left -219px at 390px wide).
//
// jsdom measures no geometry, so this guards the rule itself: on a narrow or short screen the pane is fixed inside the
// screen, with gutters, below the menu button, and scrolls inside itself. The geometry was checked in Chromium at
// 390x664, 750x342 and 1280x800 (Unlock in view at each).
//
// Run from repo root: `npm test` (or `node tests/cobi_identity_phone.test.js`).
const fs = require("fs");
const SRC = fs.readFileSync("cobi_identity.js", "utf8");
const results = [];
function check(name, ok) { results.push([name, !!ok]); }
const m = SRC.match(/@media \(max-width:900px\),\(max-height:520px\)\{\.cobi-ident-pane\{([^}]*)\}\}/) ||
  SRC.replace(/",\s*\n\s*"/g, "").match(/@media \(max-width:900px\),\(max-height:520px\)\{\.cobi-ident-pane\{([^}]*)\}\}/);
const rule = m ? m[1] : "";
check("⭐ a narrow or short screen has its own Sign in pane rule", !!m);
check("the pane is fixed to the screen, not hung from the Sign in word", /position:fixed/.test(rule));
check("⭐ it keeps a gutter on both sides", /left:max\(12px/.test(rule) && /right:max\(12px/.test(rule) && /width:auto/.test(rule));
check("it starts below the menu button", /top:76px/.test(rule));
check("⭐ it scrolls inside itself when the screen is short (a phone turned sideways)", /max-height:calc\(100dvh/.test(rule) && /overflow-y:auto/.test(rule));
let fail = 0;
for (const [n, ok] of results) { console.log((ok ? "ok   " : "FAIL ") + n); if (!ok) fail++; }
console.log("\ncobi_identity_phone.test.js: " + (results.length - fail) + "/" + results.length + " checks passed");
process.exit(fail ? 1 : 0);

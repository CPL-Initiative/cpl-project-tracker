// Military Partnerships tab — the S365 UI pass (the shell in both HTMLs and the
// veteran map it frames, veteran-sprint-map/build_selfcontained.py).
//
// `npm run a11y` passed the tab and the map in light and dark before the pass.
// Measured at 320, 390 and 1280 px it found:
//  (a) below a 981px frame the map printed its own h1 and lede under the tab's
//      heading and paragraph, which say the same thing; on a phone they pushed
//      the map below the frame's fold (content 2,094px at 320, 1,715 at 390).
//      The embed hides them at every width now (1,843 and 1,547).
//  (b) the paragraph's "new tab" link painted the browser's default ink
//      (#0000EE light, #9E9EFF dark), not --accent-link; and its arrow glyph
//      said again what the words say.
// Remainder, named: below a 981px frame (a 1280 laptop beside the sidebar, any
// phone) the map is its ordinary page and scrolls inside the frame by design;
// its stage is sized in vh, so a frame sized to its content would feed back.
//
// Run from repo root: `npm test` (or `node tests/military_partnerships_ui_pass.test.js`).
const fs = require("fs");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why || ""]); }

const HIDE = ".embed header h1,.embed header .lede{position:absolute;width:1px;height:1px;";
function topLevelHide(css) {
  // The rule must sit outside every @media block: walk the braces and record
  // the depth at which the selector starts.
  const i = css.indexOf(HIDE);
  if (i < 0) return false;
  let depth = 0;
  for (let k = 0; k < i; k++) { if (css[k] === "{") depth++; else if (css[k] === "}") depth--; }
  return depth === 0;
}
const built = fs.readFileSync("veteran-sprint-map/ca_cpl_map_selfcontained.html", "utf8");
const style = (built.match(/<style>([\s\S]*?)<\/style>/g) || []).join("\n").replace(/<\/?style>/g, "");
check("(a) the built map hides its h1 and lede in the frame at every width (outside any @media)", topLevelHide(style));
const src = fs.readFileSync("veteran-sprint-map/build_selfcontained.py", "utf8");
check("(a) the builder carries the same rule outside the min-width block",
  src.includes(HIDE) && src.indexOf(HIDE) < src.indexOf("@media (min-width:981px){\n  .embed .wrap"));

for (const f of ["index.html", "CPL_Dashboard.html"]) {
  const h = fs.readFileSync(f, "utf8");
  const a = h.slice(h.indexOf('id="tab-military-partnerships"'), h.indexOf("<!-- /tab-military-partnerships -->"))
    .match(/<a href="veteran-sprint-map\/ca_cpl_map_selfcontained\.html"[^>]*>([^<]*)<\/a>/);
  check(f + ": (b) the paragraph's link paints --accent-link", !!a && /color:\s*var\(--accent-link\)/.test(a[0]));
  check(f + ": (b) the link is the words alone, no arrow glyph", !!a && a[1] === "new tab");
}

let failed = 0;
results.forEach(([n, ok, why]) => { if (!ok) failed++; console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "  — " + why)); });
console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
process.exit(failed ? 1 : 0);

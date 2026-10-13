// The Common Course Reference UI pass (S378, checkpoint step 9): the list view a
// curator works in, and the map view's heading. Guards what npm run a11y measured
// (ccr-list, ccr-list-dark): tokens only in the tab's own CSS, controls as
// underlined words with no emoji, the row's two controls at 24px, the id column
// free to wrap, and an h1 for the full-window map, whose COBI header is not painted.
const fs = require("fs");
const path = require("path");
const ROOT = path.dirname(__dirname);
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const results = [];
const check = (name, ok) => results.push([name, !!ok]);

for (const f of ["index.html", "CPL_Dashboard.html"]) {
  const s = read(f);
  const i = s.indexOf('id="tab-unified-courses"');
  const css = s.slice(s.indexOf("<style>", i), s.indexOf("</style>", i));
  check(f + ": the tab's CSS uses tokens only, no raw hex", css.length > 1000 && !/#[0-9a-fA-F]{3,6}\b/.test(css));
  check(f + ": the id column may wrap (no nowrap on .uc-id)", !/\.uc-id \{[^}]*nowrap/.test(css));
  check(f + ": the caret and the info mark reach 24px",
    /\.uc-info, #tab-unified-courses \.uc-caret \{[^}]*min-width:24px; min-height:24px/.test(css));
  check(f + ": toolbar words are underlined, with no fill", /\.uc-word \{[^}]*background:none; border:0;[^}]*text-decoration:underline/.test(css));
  const head = s.slice(i, s.indexOf('class="uc-intro"', i));
  check(f + ": no emoji in the banner or the launcher", !/[\u{1F300}-\u{1FAFF}✨✦]|⚠️/u.test(head));
}

const js = read("unified_courses.js");
const toolbar = js.slice(js.indexOf('var search = el("input", { id: "uc-search"'), js.indexOf("impactBtn.onclick"));
check("toolbar labels carry no emoji", toolbar.length > 500 && !/[\u{1F300}-\u{1FAFF}✨✓]/u.test(toolbar));
check("toolbar controls are words, not filled buttons",
  /id: "uc-impact", type: "button", class: "uc-word"/.test(toolbar) && !/background:#/.test(toolbar));
check("Cleanup impact says its state with aria-pressed, not a color",
  /impactBtn\.setAttribute\("aria-pressed"/.test(js) && !/impactBtn\.style\.background/.test(js));
check("the Verified chip is a token chip, with no check glyph",
  /class: "uc-badge ok",[\s\S]{0,300}\["Verified"\]/.test(js) && !/✔ Verified/.test(js));
check("the view toggle is underlined words", /\.uc-vbtn\{[\s\S]{0,200}border:0;background:none;color:var\(--cobalt\)/.test(js));
check("the full-window map carries its own h1",
  /mapH1 = document\.createElement\("h1"\)/.test(js) && /body\.cpl-skyview-solo #tab-unified-courses \.uc-map-h1\{display:block/.test(js));

let fail = 0;
results.forEach(([n, ok]) => { console.log((ok ? "PASS  " : "FAIL  ") + n); if (!ok) fail++; });
console.log("\n" + (results.length - fail) + "/" + results.length + " checks passed");
process.exit(fail ? 1 : 0);

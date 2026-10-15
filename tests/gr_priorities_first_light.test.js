// tests/gr_priorities_first_light.test.js
//
// GR Priorities on First Light (S394 UI pass). The register is gated, so the signed-out
// cobi sweep measured its lock; the seeded sweep (a11y.config.js gr-priorities-gr and
// gr-priorities-gr-dark) renders a synthetic register and found these, each guarded here:
//  (a) --gx-accent was --seal-blue, a fill that stays #002F6D in dark: the citations, the
//      artifact kinds and the ghost buttons read 1.17-1.29:1 on the dark ground. The accent
//      is a text and line role, so it is --seal-blue-text, which the dark theme lifts
//  (b) boxed and filled controls (Sam, 2026-10-09: controls are underlined words), the lock's
//      button among them: white on the accent reads 2.65:1 once the accent is lifted
//  (c) a revision's summary went into the row as bare text, so its links were standalone
//      targets under 24px; it is a paragraph now, and an artifact's title link is 24px tall
//  (d) the root's placeholder style centered every row title and paragraph
//  (e) the analysis box named variables nothing defines (--gx-b, --gx-mut, --gx-soft), so
//      its ground was a light fallback under the dark theme's light ink
//
// Run from repo root: `npm test` (or `node tests/gr_priorities_first_light.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const SRC = fs.readFileSync("gr_priorities.js", "utf8");
const css = SRC.slice(SRC.indexOf("st.textContent = ["), SRC.indexOf("].join(", SRC.indexOf("st.textContent = [")));
function rule(sel) {
  const i = css.indexOf('"' + sel + "{");
  return i < 0 ? "" : css.slice(i, css.indexOf('}"', i) + 1);
}
check("the tab's CSS is found", css.length > 5000);

// (a)
check("(a) the accent is --seal-blue-text", /--gx-accent:var\(--seal-blue-text,/.test(css));

// (b)
const ctl = rule(".grx .gx-chip,.grx .gx-btn");
check("(b) the controls are underlined cobalt words, 24px, no border, no fill",
  /border:0/.test(ctl) && /background:none/.test(ctl) && /color:var\(--cobalt/.test(ctl)
    && /min-height:24px/.test(ctl) && /min-width:24px/.test(ctl) && /text-decoration:underline/.test(ctl));
check("(b) a filter in use reads heavier, never filled",
  /font-weight:700/.test(rule(".grx .gx-chip[aria-pressed=true]")) && !/background/.test(rule(".grx .gx-chip[aria-pressed=true]")));
const lock = rule(".grx .gx-lock button");
check("(b) the lock's button is an underlined word", /background:none/.test(lock) && /text-decoration:underline/.test(lock));
check("(b) no rule paints white text", !/color:#fff/i.test(css));
check("(b) no filled lead control", !/gx-chip\.primary\{/.test(css) && !/gx-btn\.ghost\{/.test(css));

// (c)
check("(c) an artifact's title link is 24px tall", /min-height:24px/.test(rule(".grx .gx-art .t a")));
const dom = new JSDOM("<!doctype html><body></body>", { runScripts: "outside-only" });
const w = dom.window;
w.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
w.eval(SRC);
const GR = w.CPL_GR;
GR._state.areas = [{ id: "cpl", title: "Credit for Prior Learning" }];
GR._state.areaId = "cpl";
GR._state.revisions = [{ id: "1", area_id: "cpl", n: 1, title: "Item one", grp: "Scope",
  summary: '<p>One <a href="https://x.example.org/a">§55050</a>.</p>', pathway: ["g"], citations: ["T5 §55050"],
  status: "proposed" }];
GR._state.artifacts = [];
const root = w.document.createElement("div");
GR._renderRegister(root, GR._state.revisions);
const a = root.querySelector('.gx-desc a[href="https://x.example.org/a"]');
check("(c) the summary's link sits in a paragraph", a && a.parentNode.tagName === "P");

// (d)
check("(d) the register is left-aligned", /text-align:left/.test(rule(".grx")));

// (e)
check("(e) no variable the tab never defines", !/var\(--gx-(b|mut|soft)[,)]/.test(css));
const hex = css.replace(/var\(--[a-z-]+, ?#[0-9A-Fa-f]{3,6}\)/g, "").match(/#[0-9A-Fa-f]{3,6}\b/g) || [];
check("(e) no raw hex in the tab's CSS: " + (hex.join(" ") || "none"), !hex.length);

// the seeded targets that measure the register
const CFG = require("../a11y.config.js");
check("the seeded sweep measures the register in both themes",
  !!(CFG.targets["gr-priorities-gr"] && CFG.targets["gr-priorities-gr-dark"]));

let pass = 0;
results.forEach(function (r) { if (r[1]) pass++; else console.log("FAIL " + r[0]); });
console.log("gr_priorities_first_light: " + pass + "/" + results.length + " passed");
if (pass !== results.length) process.exit(1);

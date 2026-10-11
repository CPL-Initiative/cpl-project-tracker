// Governance — the S366 UI pass (governance.js).
//
// The unseeded sweep measures only the locked banner: the register is gated on the
// read. A seeded sweep (governance-editor, with -dark: the team phrase held and the
// four gated reads stubbed) found:
//  (a) the drift box's heading was an h4 under the page's h2 (an h2 -> h4 skip);
//  (b) at 390px and 320px the three register tables scrolled and were not keyboard
//      reachable; their header cells carried no scope;
//  (c) reopening Docs & doctrine after a repaint showed an empty panel
//      (governance_docs_panel.test.js guards that one).
// Read at five widths by hand, the screenshots showed what no check measures:
//  (0) the shell's loading placeholder stayed on the root, so the register sat in a
//      dashed box with every cell, paragraph and list item centered.
// And First Light: (d) Refresh, Copy as Markdown and the dialog's words were boxed
// buttons; controls are underlined words (Sam, 2026-10-09). (e) The labels led with
// glyphs (a magnifier, a refresh arrow, a copy mark). (f) The "authoritative" stance
// chip was a green fill: green is for a state the reader must act on. (g) Raw hex
// fallbacks sat in the view's CSS. (h) The owner dialog had no Escape, left focus on the
// page behind it, painted on glass (the page's text showed through in dark) and sat
// under the masthead at 390px.
// Most of this is layout or color, which jsdom cannot see, so (a)-(g) read the source;
// (h) runs in jsdom. Each fails on the old file.
//
// Run from repo root: `npm test` (or `node tests/governance_ui_pass.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const SRC = fs.readFileSync("governance.js", "utf8");
const CODE = SRC.replace(/^\s*\/\/.*$/gm, "");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why || ""]); }
const rule = (sel) => {
  const m = CODE.match(new RegExp('"' + sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ' \\{([^}]*)\\}'));
  return m ? m[1] : "";
};

check("(0) the shell's dashed, centered placeholder comes off the root when the view paints",
  /function render\(root\) \{\s*ensureCss\(\);[\s\S]{0,400}root\.removeAttribute\("style"\)/.test(SRC));
check("(a) the drift box's heading is an h3", /<div class="gov-cand"><h3>/.test(CODE));
check("(a) nothing in the view renders an h4", !/<h4|"h4"/.test(CODE));

const regions = CODE.match(/<div class="gov-scroll" role="region" tabindex="0" aria-label="[^"]+">/g) || [];
check("(b) each register table sits in a named, focusable scroll region", regions.length === 3, regions.length + " found");
check("(b) the narrow-screen rule no longer turns the table itself into a scroller",
  !/\.gov-table \{ display:block/.test(CODE));
const ths = CODE.match(/<th[ >]/g) || [];
check("(b) every header cell carries scope", ths.length >= 12 && ths.every((t) => t === "<th "), ths.length + " th");

const btn = rule(".gov-btn");
check("(d) .gov-btn is an underlined word, no border or fill, 24px",
  /text-decoration:underline/.test(btn) && /min-height:24px/.test(btn) && /border:0/.test(btn)
    && /background:none/.test(btn) && /var\(--cobalt\)/.test(btn), btn.slice(0, 160));
check("(d) the dialog's Save is a word like the others, not bold", !/data-own-save><b>/.test(CODE));
check("(d) a control shows keyboard focus", /\.gov-btn:focus-visible/.test(CODE) && /\.gov-ownbtn:focus-visible/.test(CODE));
check("(d) the owner cell clears 24px", /min-height:24px/.test(rule(".gov-ownbtn")));

const GLYPH = /\\u\{1F50E\}|\\u21BB|\\u2139|\u{1F50E}|↻|⧉/u;
check("(e) no magnifier, refresh arrow, copy mark or info mark in a rendered string", !GLYPH.test(CODE));

check("(f) the authoritative chip carries no green", !/gov-chip\.auth \{[^}]*hunter/.test(CODE));
check("(g) no raw hex in the view's CSS", !/#[0-9a-fA-F]{3,8}\b/.test((CODE.match(/var css = \[[\s\S]*?\]\.join/g) || []).join("")));

check("(h) the dialog is opaque (a data surface, never glass)", /var\(--surface-opaque\)/.test(rule(".gov-dlg")));
check("(h) the dialog's backdrop sits above the masthead", /z-index:9999/.test(rule(".gov-ov")));

// (h) the dialog, in jsdom
function dialogPath() {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="governance-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.localStorage.setItem("cpl_team_pass", "seed-phrase");
  const REG = { _principle: "p", decision_rights: [{ id: "DR-01", element: "Student contact", drives: "routing",
    decides: "the college", when_empty: "nowhere" }], acceptance_standards: [], cadences: [], open_questions: [] };
  w.fetch = function (url) {
    const u = String(url);
    const body = /governance_register\.json/.test(u) ? REG : /governance_candidates/.test(u) ? null : [];
    return Promise.resolve({ ok: body !== null, status: 200, json: () => Promise.resolve(body) });
  };
  w.eval(SRC);
  w.CPL_GOVERNANCE.activate();
  return new Promise((res) => setTimeout(res, 50)).then(() => {
    const root = w.document.getElementById("governance-root");
    const cell = root.querySelector('[data-own="DR-01"]');
    check("(h) precondition: the owner cell renders", !!cell);
    if (!cell) return;
    cell.focus();
    cell.click();
    const dlg = w.document.querySelector("#gov-own-dlg [role=dialog]");
    check("(h) the dialog is marked modal", !!dlg && dlg.getAttribute("aria-modal") === "true");
    check("(h) the dialog takes focus", w.document.activeElement && w.document.activeElement.id === "gov-own-name");
    w.document.getElementById("gov-own-name").dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    check("(h) Escape closes the dialog", !w.document.getElementById("gov-own-dlg"));
    check("(h) …and focus returns to the cell that opened it", w.document.activeElement === cell);
  });
}

dialogPath().then(report, (e) => { check("(h) dialog path completed", false, String(e)); report(); });

function report() {
  let failed = 0;
  results.forEach(([n, ok, why]) => { if (!ok) failed++; console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "  — " + why)); });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
}

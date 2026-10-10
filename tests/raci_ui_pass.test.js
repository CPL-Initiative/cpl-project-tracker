// Team & RACI tab — the S356 UI pass (raci.js + mission_control.js) — jsdom test.
//
// `npm run a11y -- cobi:raci` measured the tab before this pass:
//   light  36 targets under 24px ("Update", 15px tall) + 6 contrast findings
//   dark   the same 36 targets + 4 contrast findings
// and a signed-in measurement (seeded members) found the Team Directory pushing
// the page 223px sideways at 390px, and every nudge checkbox a 16x16 target.
// jsdom has no layout, so this file cannot re-measure any of that. It pins the
// CAUSES, each of which reads as harmless in a diff:
//
//  (a) --text-faint as text. Its own token comment says "decorative only"; it
//      is 3.24:1 light / 4.23:1 dark on every ground. The intro paragraph sat on
//      it at 3.32:1 and 3.51:1.
//  (b) --text, a phantom defined nowhere, so its #243b53 fallback painted in
//      BOTH themes: 1.29:1 on the dark Mission Control card.
//  (c) --gold-accent as TEXT. It is the bright mustard FILL (1.75:1 on light);
//      the text grade is --mustard-text.
//  (d) opacity on a whole row. .72 on a pending Mission Control task took its
//      badge to 1.49:1 and its lane chip to 4.41:1 — every ink inside dims.
//  (e) raw hex inks in the injected CSS. The modal's close mark was #fff on a
//      header that is light in dark mode: 1.21:1.
//  (f) controls as boxes and glyphs. Controls are underlined words, 24px
//      (Sam, 2026-10-09); every control is a word (the glyph rule).
//  (g) a sortable <th role="button">: the role replaced the column header, so a
//      screen reader lost which column a cell belongs to. A header cell keeps
//      scope="col" + aria-sort and holds a real <button>.
//  (h) the directory table outside a scroll region, and its checkboxes with no
//      accessible name and no 24px hit area.
//  (i) the shell's dashed loading placeholder left on the finished tab, which
//      centered every matrix cell (the tree's indent included).
//  (j) "across 4 Activities" as a literal while the rows come from the data.
//
// Run from repo root: `npm test` (or `node tests/raci_ui_pass.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why || ""]); }

const RACI = fs.readFileSync("raci.js", "utf8");
const MC = fs.readFileSync("mission_control.js", "utf8");

// The CSS each module injects, comments stripped so prose ABOUT a defect is not
// read as the defect.
function injectedCss(src) {
  const a = src.indexOf("function ensureCss");
  const b = src.indexOf("document.head.appendChild", a);
  return src.slice(a, b).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}
const CSS = { "raci.js": injectedCss(RACI), "mission_control.js": injectedCss(MC) };

for (const [f, css] of Object.entries(CSS)) {
  check(f + ": (a) no text painted in --text-faint", !/color:\s*var\(--text-faint/.test(css));
  check(f + ": (b) no use of the phantom --text token", !/var\(--text[,)]/.test(css));
  check(f + ": (c) --gold-accent is never a text color", !/(^|[;{"])\s*color:\s*var\(--gold-accent/.test(css));
  // (e) the only raw hex left is --gold-soft's fallback, which light keeps on
  // purpose (the token is dark-only; see the dark :root in index.html).
  const hex = (css.replace(/var\(--gold-soft,\s*#[0-9a-fA-F]{3,6}\)/g, "").match(/#[0-9a-fA-F]{3,6}\b/g) || []);
  check(f + ": (e) no raw hex in the injected CSS", hex.length === 0, hex.join(" "));
}
check("mission_control.js: (d) a pending task row is not dimmed with opacity",
  !/\.mc-state-pending\{[^}]*opacity/.test(CSS["mission_control.js"]));
check("mission_control.js: (d) an archived task row is not dimmed with opacity",
  !/\.mc-state-archived\{[^}]*opacity/.test(CSS["mission_control.js"]));
check("raci.js: (d) a held-out directory row is not dimmed with opacity",
  !/\.raci-row-muted\{[^}]*opacity/.test(CSS["raci.js"]));

// (f) the control rule: underlined, no box, 24px both ways.
(function () {
  const m = /\.raci-btn,\.raci-upd-btn[^{]*\{([^}]*)\}/.exec(CSS["raci.js"]);
  const d = m ? m[1] : "";
  check("raci.js: (f) one control rule covers every button this tab draws",
    !!m && /\.raci-copy-btn/.test(m[0]) && /\.raci-tree-reset/.test(m[0]) && /\.raci-upd-act/.test(m[0]) && /\.raci-itemnudge-btn/.test(m[0]));
  check("raci.js: (f) controls are underlined words with no border or fill",
    /border:0/.test(d) && /background:none/.test(d) && /text-decoration:underline/.test(d) && /color:var\(--cobalt\)/.test(d));
  check("raci.js: (f) controls clear 24x24 (WCAG 2.2 SC 2.5.8)", /min-height:24px/.test(d) && /min-width:24px/.test(d));
  check("raci.js: (f) no later rule re-boxes a control",
    !/\.raci-(btn|btn-go|upd-btn|copy-btn|tree-reset|upd-act|itemnudge-btn|filter-nudge)(:hover)?\{[^}]*(border:1px|background:var\(--(navy|surface|gold))/.test(CSS["raci.js"]));
  const c = /\.mc-choose\{([^}]*)\}/.exec(CSS["mission_control.js"]);
  check("mission_control.js: (f) Choose is an underlined word, 24px",
    !!c && /border:0/.test(c[1]) && /text-decoration:underline/.test(c[1]) && /min-height:24px/.test(c[1]));
})();

// ── DOM ──────────────────────────────────────────────────────────────────────
// Emoji and pictographs; the arrows and marks Sam ruled to keep (2026-09-09)
// are outside these ranges.
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2900}-\u{297F}\u{29C9}]/u;

function makeDom() {
  const dom = new JSDOM(
    "<!doctype html><html><head></head><body><div id='raci-root' style='border:1px dashed;text-align:center;'>Loading</div></body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/#raci" });
  const w = dom.window;
  // THREE activities, so a literal "4" in the count line cannot pass.
  w.CPL_DATA = {
    activity_kpis: [
      { activity_id: "Activity 1", activity_name: "Build", kpis: [{ id: "1.1", name: "MAP Platform" }] },
      { activity_id: "Activity 2", activity_name: "Workgroups", kpis: [{ id: "2.1", name: "Convene" }] },
      { activity_id: "Activity 3", activity_name: "Data", kpis: [{ id: "3.1", name: "Feeds" }] },
    ],
    projects: [
      { id: "1.1", name: "MAP Platform", activity: "Activity 1: Build" },
      { id: "2.1", name: "Convene", activity: "Activity 2: Workgroups" },
      { id: "3.1", name: "Feeds", activity: "Activity 3: Data" },
    ],
  };
  const MEMBERS = [
    { id: "m1", name: "Zara Quinn", email: "z@x.edu", role: "Ops", nudge: true, last_nudged_at: "2026-06-20T00:00:00Z", last_response_at: null },
    { id: "m2", name: "Aaron Blake", email: "a@x.edu", role: "Lead", nudge: false, last_nudged_at: null, last_response_at: null },
  ];
  const RACI_ROWS = [{ item_type: "project", item_id: "1.1", raci: { R: [{ name: "Zara Quinn" }], A: [], C: [], I: [] } }];
  w.fetch = function (url) {
    let body = [];
    if (/team_members/.test(url)) body = JSON.parse(JSON.stringify(MEMBERS));
    else if (/item_raci/.test(url)) body = JSON.parse(JSON.stringify(RACI_ROWS));
    return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(body); } });
  };
  w.localStorage.setItem("cpl_team_pass", "test-phrase");   // signed in: every control renders
  w.eval(RACI);
  return dom;
}

(async function () {
  const dom = makeDom();
  const w = dom.window, doc = w.document;
  w.CPL_RACI_TAB.boot();
  await new Promise((r) => setTimeout(r, 30));

  const root = doc.getElementById("raci-root");
  check("(i) the loading placeholder's inline style is dropped on render", !root.hasAttribute("style"));

  const mths = Array.from(doc.querySelectorAll(".raci-table th"));
  check("(g) matrix: every header cell has scope=col", mths.length >= 5 && mths.every((th) => th.getAttribute("scope") === "col"));
  check("(g) matrix: no header cell is role=button", mths.every((th) => !th.hasAttribute("role")));
  check("(g) matrix: each sortable header holds a <button> and an aria-sort",
    Array.from(doc.querySelectorAll(".raci-table .raci-th-sort")).every((th) =>
      th.querySelector("button.raci-th-btn") && /^(none|ascending|descending)$/.test(th.getAttribute("aria-sort") || "")));
  check("(g) the header row sits in a <thead>", !!doc.querySelector(".raci-table thead tr th"));
  check("(j) the count names the Activities the data has (3), not a literal",
    /across 3 Activities/.test(doc.querySelector(".raci-count").textContent));
  check("the toggle pair carries aria-pressed",
    Array.from(doc.querySelectorAll(".raci-tg")).map((b) => b.getAttribute("aria-pressed")).sort().join() === "false,true");

  const buttons = () => Array.from(doc.querySelectorAll("#raci-root button"));
  const glyphed = buttons().filter((b) => EMOJI.test(b.textContent)).map((b) => b.textContent.trim());
  check("(f) every matrix control is a word, no glyph", buttons().length > 5 && glyphed.length === 0, glyphed.join(" | "));
  check("(f) the per-row nudge is the word Nudge", !!doc.querySelector(".raci-itemnudge-btn") &&
    Array.from(doc.querySelectorAll(".raci-itemnudge-btn")).every((b) => b.textContent.trim() === "Nudge"));

  // The update modal: its close mark is named, and its controls are words.
  doc.querySelector('[data-raci-key="project:1.1"] .raci-upd-btn').click();
  await new Promise((r) => setTimeout(r, 10));
  const x = doc.querySelector(".raci-x");
  check("(e) the modal's close control has an accessible name", !!x && x.getAttribute("aria-label") === "Close");
  const hist = doc.querySelector(".raci-upd-hist");
  check("(h) the capped update history is a named, focusable region",
    !!hist && hist.getAttribute("tabindex") === "0" && hist.getAttribute("role") === "region" && !!hist.getAttribute("aria-label"));
  const modalGlyphs = Array.from(doc.querySelectorAll(".raci-modal button")).filter((b) => EMOJI.test(b.textContent));
  check("(f) every modal control is a word, no glyph", modalGlyphs.length === 0, modalGlyphs.map((b) => b.textContent).join(" | "));
  x.click();

  // Directory.
  Array.from(doc.querySelectorAll(".raci-tg")).find((b) => /Directory/.test(b.textContent)).click();
  await new Promise((r) => setTimeout(r, 10));
  const dir = doc.querySelector(".raci-dir");
  const holder = dir && dir.parentElement;
  check("(h) the directory scrolls inside a named, focusable region",
    !!holder && holder.classList.contains("raci-table-holder") && holder.getAttribute("role") === "region" &&
    holder.getAttribute("tabindex") === "0" && /directory/i.test(holder.getAttribute("aria-label") || ""));
  check("(g) directory: every header cell has scope=col",
    Array.from(dir.querySelectorAll("th")).every((th) => th.getAttribute("scope") === "col"));
  const cbs = Array.from(dir.querySelectorAll("tbody .raci-nudge-cb, tr .raci-nudge-cb")).filter((c) => !c.classList.contains("raci-nudge-all"));
  check("(h) each nudge checkbox is named and sits in a 24px label",
    cbs.length === 2 && cbs.every((c) => /^Nudge .+ for updates$/.test(c.getAttribute("aria-label") || "") &&
      c.parentElement.tagName === "LABEL" && c.parentElement.classList.contains("raci-nudge-hit")));
  check("(h) the hit-area label is 24px in the injected CSS",
    /\.raci-nudge-hit\{[^}]*min-width:24px[^}]*min-height:24px/.test(CSS["raci.js"]));
  const dirGlyphs = Array.from(doc.querySelectorAll("#raci-root button, .raci-status-cell")).filter((b) => EMOJI.test(b.textContent));
  check("(f) directory controls and status words carry no glyph", dirGlyphs.length === 0, dirGlyphs.map((b) => b.textContent).join(" | "));

  // ── Mission Control (mounts below the matrix in the same tab) ──
  const mdom = new JSDOM("<!doctype html><html><head></head><body><div id='raci-root'></div></body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  mdom.window.eval(MC);
  const MCAPI = mdom.window.CPL_MISSION_CONTROL;
  const PLAN = JSON.parse(fs.readFileSync("kb/liftoff_plan.json", "utf8"));
  const sec = MCAPI.buildSection(mdom.window.document, PLAN, {}, { signedIn: true, email: "r@x.edu", onStatus() {}, onChoose() {} });
  const mcText = sec.textContent;
  // U+2605, the recommended-option star, is left out of the range on purpose:
  // star designations are among the glyphs Sam ruled to keep (2026-09-09).
  check("Mission Control: no emoji in rendered text (the rocket, flag and hourglass are gone)",
    !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{2604}\u{2606}-\u{26FF}\u{2300}-\u{23FF}]/u.test(mcText),
    (mcText.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{2604}\u{2606}-\u{26FF}\u{2300}-\u{23FF}]/gu) || []).join(" "));
  check("Mission Control: the decision card carries no icon span (the word Decision names it)",
    !sec.querySelector(".mc-decision-icon") && /Decision: /.test(mcText));
  check("Mission Control: a pending task says so in words", /Waiting on decision: /.test(mcText));

  let failed = 0;
  results.forEach(([n, ok, why]) => { if (!ok) failed++; console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "  — " + why)); });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

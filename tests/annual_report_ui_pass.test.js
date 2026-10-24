// Annual Report tab: the S377 UI pass (annual_report.js) — jsdom.
//
// First audit of the view (ui_pass ledger: never passed). npm run a11y found one fault in
// both themes (the preview scrolled with no keyboard reach at 390px); reading the screen
// found the rest. What this pins:
//   (a) controls are underlined words (Sam, 2026-10-09): no glyph in a label, a button of
//       type "button", no border and no fill, 24px tall;
//   (b) the editor has a label, the preview is a named region a keyboard can reach, and
//       the status line is announced;
//   (c) a failure reads in --danger-text and every other status is muted (green and red
//       are for a state the reader must act on);
//   (d) the view's CSS is First Light tokens only: no hex, not even as a fallback, and no
//       inline hex in the boot placeholder;
//   (e) the report reads as a document: left-aligned (the pane centers), and the
//       _data date_ line renders in italics, as the Word export prints it.
//
// Run from repo root: `npm test` (or `node tests/annual_report_ui_pass.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("annual_report.js", "utf8");
const WRITER = fs.readFileSync("cpl_writer.js", "utf8");   // static in both HTMLs, before this lazy tab
const DATA = {
  last_updated: "October 12, 2026", data_as_of: "October 12, 2026",
  kpis: { cumulative_students: { value: "55,020", label: "Cumulative CPL Students" } },
  vision2030: { goals: [] }, activity_kpis: [], projects: []
};

function makeDom(proxy) {
  const dom = new JSDOM("<!doctype html><html><head></head><body><div id='annual-report-root'></div></body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
  if (proxy) w.CPL_REPORT_PROXY_URL = proxy;
  w.CPL_DATA = DATA;
  w.confirm = () => true;
  w.eval(WRITER);
  w.eval(SRC);
  w.CPL_ANNUAL_REPORT.boot();
  return dom;
}

(async () => {
  const dom = makeDom("https://proxy.example/");
  const doc = dom.window.document;
  const btns = Array.from(doc.querySelectorAll(".car-toolbar button"));

  // (a)
  check("(a) four controls, each a plain word",
    btns.map(b => b.textContent).join("|") === "Rebuild from data|AI polish|Word|Print");
  check("(a) no control label carries a glyph",
    btns.every(b => !/[←-⇿☀-➿\u{1F300}-\u{1FAFF}]/u.test(b.textContent)));
  check("(a) every control is a button of type button", btns.every(b => b.getAttribute("type") === "button"));
  const css = (doc.getElementById("car-css") || {}).textContent || "";
  const btnRule = (css.match(/\.car-btn\{[^}]*\}/) || [""])[0];
  check("(a) the control rule: no border, no fill, CO blue, underlined, 24px",
    /border:0/.test(btnRule) && /background:none/.test(btnRule) && /color:var\(--cobalt\)/.test(btnRule)
      && /text-decoration:underline/.test(btnRule) && /min-height:24px/.test(btnRule));
  check("(a) no filled primary button remains", !/car-btn-go/.test(SRC));
  check("(a) a keyboard focus ring on the controls and the preview",
    /\.car-btn:focus-visible,\.car-preview:focus-visible\{outline:2px solid var\(--focus-ring\)/.test(css));

  // (b)
  const ta = doc.querySelector("textarea.car-edit");
  check("(b) the editor is labeled", ta && ta.labels && ta.labels.length === 1 && ta.labels[0].textContent === "Edit");
  const pv = doc.querySelector(".car-preview");
  check("(b) the preview is a keyboard-reachable region named Preview",
    pv && pv.getAttribute("tabindex") === "0" && pv.getAttribute("role") === "region"
      && doc.getElementById(pv.getAttribute("aria-labelledby")).textContent === "Preview");
  const st = doc.querySelector(".car-status");
  check("(b) the status line is announced", st && st.getAttribute("role") === "status" && st.getAttribute("aria-live") === "polite");

  // (c)
  btns[0].click();   // Rebuild (confirm stubbed true)
  check("(c) a success reads muted, not green", st.textContent === "Rebuilt from live data." && !st.classList.contains("car-status-err") && !st.style.color);
  dom.window.fetch = () => Promise.resolve({ ok: false, status: 502, text: () => Promise.resolve("bad gateway"), json: () => Promise.resolve({}) });
  btns[1].click();   // AI polish fails
  for (let i = 0; i < 10; i++) await new Promise(r => setTimeout(r, 0));
  check("(c) a failure reads in --danger-text", st.classList.contains("car-status-err") && /\.car-status-err\{color:var\(--danger-text\);\}/.test(css));

  // (d)
  check("(d) the view's CSS has no hex, not even a fallback", !/#[0-9A-Fa-f]{3,6}\b/.test(css));
  check("(d) the boot placeholder carries no inline hex", /<p class="car-empty">Building the Annual Report draft/.test(SRC)
    && !/style="color:#/.test(SRC));
  check("(d) no status call passes a color", !/setStatus\([^)]*"#[0-9A-Fa-f]{3,6}"/.test(SRC) && !/setStatus\([^)]*var\(--/.test(SRC));

  // (e)
  check("(e) the report is left-aligned", /\.car-wrap\{[^}]*text-align:left/.test(css));
  const html = dom.window.CPL_ANNUAL_REPORT._mdToHtml("_Data as of October 12, 2026_\n\nplain _word_ here");
  check("(e) the data-date line renders in italics", /<p><em>Data as of October 12, 2026<\/em><\/p>/.test(html));
  check("(e) an underscore inside a line stays as written", /<p>plain _word_ here<\/p>/.test(html));

  let pass = 0;
  results.forEach(([n, ok]) => { console.log((ok ? "PASS  " : "FAIL  ") + n); if (ok) pass++; });
  console.log("\n" + pass + "/" + results.length + " checks passed");
  process.exit(pass === results.length ? 0 : 1);
})();

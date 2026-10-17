// Exhibit Adoption's UI pass (S409, 2026-10-17) — guards what the pass fixed.
//
// Measured by `npm run a11y` before the fix (S408 and S409):
//  1. Two focus rings never showed. The search field had outline:none, and the
//     generator's `.sw-action-btn{transition:all}` animated the handout
//     button's ring width up from 0px, so the ring read as absent when focus
//     landed. The table's three actions and Matrix CSV failed the same way.
//  2. Two badges below AA: "Suggested standard" 4.27:1 on its tinted fill
//     (light), "Statewide CCC standard" 4.05:1 on its green fill (dark).
//  3. Controls were boxed and filled; Sam's rule (2026-10-09) makes every
//     control an underlined word, the lead carried by order, never a fill.
//  4. Two emoji (the building and the light bulb), "1 colleges", and a
//     matrix that counted 3,120 credentials beside the other views' 3,189
//     without saying it shows only titles some college has adopted.
//  5. The table's row checkboxes were 13px with no name.
//
// Run from repo root: `npm test` (or `node tests/eacr_ui_pass.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("statewide_interactive.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function val(fn) { try { return fn(); } catch (e) { return undefined; } }

// One title a college adopted, one no college has adopted.
const exhibits = [
  { exhibit_id: "x1", exhibit_ids: ["x1"], title: "CompTIA A+", unified_title: "CompTIA A+",
    issuing_agency: "CompTIA", is_classified: true, cpl_type: "Industry Certification",
    collaborative_type: "CCC Collaborative", adopters: 1, adopter_names: ["College A"],
    adopter_units: { "College A": 4 }, adopter_lines: { "College A": 1 },
    potential: 2, potential_names: ["College B", "College C"],
    raw_titles: ["CompTIA A plus"], credit_recs: [{ course: "CIS 110", credit: "4 hours in ICT" }] },
  { exhibit_id: "x2", exhibit_ids: ["x2"], title: "Business Law", unified_title: "Business Law",
    issuing_agency: "", is_classified: true, cpl_type: "Credit By Exam",
    collaborative_type: "Local", adopters: 0, adopter_names: [], adopter_units: {}, adopter_lines: {},
    potential: 3, potential_names: ["College A", "College B", "College C"],
    raw_titles: ["Business Law"], credit_recs: [{ course: "BUS 18", credit: "3 units" }] }
];
const lookup = {};
["A", "B", "C"].forEach(function (k) { lookup["College " + k] = { district: "D1", swRegion: "R1", ascccArea: "A" }; });

const html = `<!DOCTYPE html><html><head></head><body>
<div id="statewide-interactive-container"></div>
<script>
  window.CPL_STATEWIDE = ${JSON.stringify({ exhibits })};
  window.CCC_COLLEGE_LOOKUP = ${JSON.stringify(lookup)};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
try { window.eval(src); } catch (e) { console.error("init threw:", e); }
const doc = window.document;
function click(el) { if (!el) return false; el.dispatchEvent(new window.MouseEvent("click", { bubbles: true })); return true; }

setTimeout(function () {
  try { run(); }
  catch (e) { check("the harness ran to completion (it threw: " + e.message + ")", false); }
  report();
}, 80);

function run() {
  // ── 1. Focus rings show the moment focus lands ──────────────────────────
  check("the word controls carry no transition (a transition animated the ring up from 0px)",
    /\.sw-filter-btn,\.sw-action-btn,\.sw-action-btn\.primary,\.sw-page-btn\{[^}]*transition:none;/.test(src));
  check("every sw-* control shows a ring on keyboard focus",
    /\.sw-filter-btn:focus-visible,\.sw-action-btn:focus-visible,\.sw-page-btn:focus-visible\{[^}]*outline:3px solid var\(--accent-link\)/.test(src));
  check("the search field shows a ring (the generator sets outline:none)",
    /\.sw-toolbar input\[type=text\]:focus-visible\{outline:2px solid var\(--accent-link\)/.test(src));

  // ── 2. Badges are categories: no fill, an outline, the role's token ─────
  check("a badge paints no fill and an outline",
    /\.cv-badge\{[^}]*\}'\s*\+\s*'background:none;border:1px solid var\(--border-strong\);\}'/.test(src) ||
    /\.cv-badge\{[^}]*background:none;border:1px solid var\(--border-strong\);/.test(src));
  check("the Statewide and Suggested badges carry no tinted fill",
    !/\.cv-ccc\{[^}]*background/.test(src) && !/\.cv-synth\{[^}]*background/.test(src));

  // ── 3. Controls are underlined words; no filled lead ───────────────────
  check("the lead action is a word like the others, never a fill",
    /\.sw-action-btn\.primary,\.sw-page-btn\{[^}]*background:none;border:0;/.test(src) &&
    /\.sw-action-btn\.primary:hover,[^{]*\{[^}]*background:none;/.test(src));
  check("the view switch is underlined words, the view in use heavier and darker",
    /\.sw-subtabs button\{[^}]*background:none;border:0;[^}]*text-decoration:underline;/.test(src) &&
    /\.sw-subtabs button\.on\{color:var\(--text-strong\);font-weight:700;/.test(src));
  check("the matrix's cell choice is underlined words, the choice in use heavier and darker",
    /\.mx-seg input:checked \+ label\{color:var\(--text-strong\);font-weight:700;text-decoration-thickness:2px;\}/.test(src));

  // ── 4. Words, counts and the matrix's reconciliation ───────────────────
  const cv = () => doc.getElementById("sw-cv-body");
  const cvText = () => val(() => cv().textContent) || "";
  check("the credentials view rendered", /CompTIA A\+/.test(cvText()));
  check("one adopting college reads '1 college'", /\b1 college\b/.test(cvText()) && !/\b1 colleges\b/.test(cvText()));
  check("the Statewide badge is a word with no building emoji",
    /Statewide CCC standard/.test(cvText()) && !/\u{1F3DB}/u.test(src));
  check("no light-bulb emoji in Typical CPL", !/\u{1F4A1}/u.test(src));

  check("the matrix tab exists to switch to", click(doc.querySelector('.sw-subtab[data-view="matrix"]')));
  const stats = val(() => doc.querySelector(".mx-stats").textContent) || "";
  check("the matrix counts the one adopted title", /^1 credentials? ×/.test(stats));
  check("...and says the title no college adopted carries no row",
    /1 of the 2 common titles has no adopting college and carries no row\./.test(stats));

  // ── 5. The table's row checkboxes: a 24px label that names the row ──────
  check("the adoption table exists to switch to", click(doc.querySelector('.sw-subtab[data-view="table"]')));
  const chk = () => doc.querySelector("#sw-tbody .sw-row-chk");
  check("a row checkbox sits inside its own label (the label is the hit area)",
    val(() => chk().parentElement.classList.contains("sw-chk-hit")) === true);
  check("...and is named for its row", /^Select /.test(val(() => chk().getAttribute("aria-label")) || ""));
  check("...whose label is at least 24px", /\.sw-chk-hit\{[^}]*min-width:24px;min-height:24px;/.test(src));
}

function report() {
  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "  ok   " : "  FAIL ") + r[0]));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  if (failed.length) process.exit(1);
}

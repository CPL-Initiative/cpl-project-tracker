// Common Subjects Reference, UI pass (S386, 2026-10-14; Sam's one-view-per-checkpoint rule).
//
// The sweep found five color pairs below AA and 159 controls under 24px:
//   light  #9ca3af on the page (the "(CCCCO MAP only)" tag, the CIP "—"), #cbd5e1 dashes at 1.33:1
//   dark   a light-blue scope note and light TOP-category rows behind dark-theme text (1.11:1),
//          and the modal variant held at #000 on the dark ground (1.15:1)
// Each now reads a First Light token, so the theme swap carries it; and every control is at
// least 24px tall. The tab's own <style> sits in the body, after the head-injected sheet, so a
// color fix lives in that rule (both HTMLs, Rule 4) and the injected sheet only adds properties
// the HTML leaves unset.
//
// Run from repo root: `npm test` (or `node tests/csr_ui_pass.test.js`).
const fs = require("fs");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const js = fs.readFileSync("canonical_subj4.js", "utf8");
const htmls = ["CPL_Dashboard.html", "index.html"].map((f) => [f, fs.readFileSync(f, "utf8")]);

function rule(src, sel) {
  const i = src.indexOf(sel + " {");
  if (i < 0) return null;
  return src.slice(i, src.indexOf("}", i) + 1);
}
const RULES = [
  ["#tab-canonical-subj4 .cs-auth-tag", /color:var\(--text-muted\)/],
  ["#tab-canonical-subj4 .cs-muted-dash", /color:var\(--text-muted\)/],
  ["#tab-canonical-subj4 .cs-variants .cs-var-modal", /color:var\(--text-body\)/],
  ["#tab-canonical-subj4 tr.cs-cat-header td", /background:var\(--surface-muted\)/],
  ["#tab-canonical-subj4 tr.cs-cat-header.collapsed td", /background:var\(--surface-subtle\)/],
  ["#tab-canonical-subj4 .cs-scope-note", /background:var\(--surface-subtle\)[^}]*color:var\(--text-body\)/],
  ["#tab-canonical-subj4 .cs-scope-note strong", /color:var\(--navy-primary\)/],
];

// ── (1) the six rules read tokens, in both HTMLs ──────────────────────────
for (const [f, src] of htmls) {
  for (const [sel, want] of RULES) {
    const r = rule(src, sel);
    check(`(1) ${f}: ${sel.replace("#tab-canonical-subj4 ", "")} reads its token`, r && want.test(r), r);
    check(`(1) ⭐ ${f}: ${sel.replace("#tab-canonical-subj4 ", "")} holds no raw hex`, r && !/#[0-9a-fA-F]{3,8}\b/.test(r), r);
  }
}
check("(1) the two HTMLs stay identical (Rule 4)", htmls[0][1] === htmls[1][1]);

// ── (2) the tab's own script paints no raw gray ───────────────────────────
check("(2) ⭐ canonical_subj4.js paints no #9ca3af (the CIP placeholder and the reviewer line read --text-muted)",
  !/#9ca3af/i.test(js));
check("(2) the CIP placeholder cell reads --text-muted",
  /class: "cs-mono", style: "color:var\(--text-muted\)"/.test(js));

// ── (3) every control is at least 24px tall (WCAG 2.2 target size) ─────────
const injected = (js.match(/function ensureCsrUiCss\(\)[\s\S]*?\]\)\);/) || [""])[0];
for (const sel of [".cs-check-btn", ".cs-var-show", "input.cs-canon", "label.cs-flag-toggle", "a.cs-auth-link"]) {
  const re = new RegExp("#tab-canonical-subj4 " + sel.replace(".", "\\.") + "[^{]*\\{[^}]*min-height:24px");
  const inGroup = new RegExp("#tab-canonical-subj4 " + sel.replace(".", "\\.") + "[,{][^}]*min-height:24px");
  check(`(3) ⭐ ${sel} is at least 24px tall`, re.test(injected) || inGroup.test(injected));
}

let pass = 0;
for (const [n, ok, why] of results) {
  console.log((ok ? "PASS" : "FAIL") + "  " + n + (ok || !why ? "" : "  — " + String(why).slice(0, 160)));
  if (ok) pass++;
}
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);

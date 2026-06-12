// First Light retheme (Session 49) — token regression test.
//
// The live :root in both HTMLs IS the spec (prototype/first_light_theme_v1.html
// v1.6, Sam-blessed 2026-06-12; AA math in prototype/check_contrast.py --live).
// This test pins the palette flip so neither a hand edit nor the daily regen
// can silently reintroduce the pre-retheme navy/gold era:
//   (a) Rule 4 — both HTMLs byte-identical;
//   (b) the :root carries the First Light spec hexes;
//   (c) NO legacy brand hex appears anywhere in either HTML or in the
//       generator-owned college_activity_template.html (the generator emits
//       tokens now — a legacy hex means a missed emission site crept back);
//   (d) the undefined-token bug class (var(--mustard-deep)) stays dead;
//   (e) the KPI drag-reorder hooks survive the retheme (kpi_reorder.js
//       re-matches cards by label — its grid + script tag must stay).
//
// Run from repo root: `npm test` (or `node tests/retheme_tokens.test.js`).
const fs = require("fs");

const results = [];
function check(name, cond, detail) { results.push([name, !!cond, detail]); }

const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");

// ── (a) Rule 4 ──
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);

// ── (b) spec tokens pinned in :root ──
const rootM = cpl.match(/:root\s*\{([\s\S]*?)\}/);
check(":root block present", !!rootM);
const root = rootM ? rootM[1] : "";
const SPEC = {
  "--paper": "#F4F2ED",
  "--text-strong": "#1C1C1A",
  "--text-body": "#3A3A36",
  "--text-muted": "#5C5C55",
  "--crimson": "#920000",
  "--cobalt": "#0047AB",
  "--hunter": "#2C601A",
  "--violet": "#6D28D9",
  "--mustard-fill": "#E3B341",
  "--mustard-text": "#8B6800",
  "--mustard-on-dark": "#E3B341",
  "--surface-opaque": "#FFFFFF",
};
for (const [tok, hex] of Object.entries(SPEC)) {
  const re = new RegExp(tok.replace(/[-]/g, "\\-") + "\\s*:\\s*" + hex + "\\s*;", "i");
  check(`:root pins ${tok}: ${hex}`, re.test(root));
}

// ── (c) legacy brand hexes are extinct ──
// (#128206/#128196 are emoji entities, not colors — they contain no hex risk
// because the legacy list below never matches them.)
const LEGACY = [
  "#C9A84C", "#0A2240", "#163A5F", "#D4AF37", "#C73E3E",
  "#9BBCD8", "#B8860B", "#B89540",
];
const SURFACES = {
  "CPL_Dashboard.html": cpl,
  "index.html": idx,
  "college_activity_template.html": fs.readFileSync("college_activity_template.html", "utf8"),
};
for (const [fname, body] of Object.entries(SURFACES)) {
  const found = LEGACY.filter((h) => body.toUpperCase().includes(h.toUpperCase()));
  check(`${fname}: no legacy brand hex`, found.length === 0, found.join(", "));
}

// ── (d) no references to undefined tokens ──
for (const [fname, body] of Object.entries(SURFACES)) {
  check(`${fname}: no var(--mustard-deep)`, !body.includes("var(--mustard-deep)"));
}

// ── (e) KPI drag-reorder survives ──
check("kpi-section grid present", cpl.includes('class="kpi-section"') || /class="kpi-section[" ]/.test(cpl));
check("kpi-card class present", cpl.includes("kpi-card"));
check("kpi_reorder.js script tag shipped", /<script[^>]*src="kpi_reorder\.js/.test(cpl));

// ── (f) PR-2 glass chrome + ghost layer pins ──
check("glass base class defined", /\.glass\s*\{[^}]*backdrop-filter/.test(cpl));
check("no-backdrop-filter fallback present", cpl.includes("@supports not (backdrop-filter: blur(1px))"));
check("prefers-reduced-transparency honored", cpl.includes("prefers-reduced-transparency"));
check("prefers-contrast honored", cpl.includes("prefers-contrast: more"));
check("masthead is glass (header bg = --surface)", /\.header\s*\{[^}]*background:\s*var\(--surface\)/.test(cpl));
check("KPI hero cards are glass", /\.kpi-card\s*\{[^}]*background:\s*var\(--surface\)/.test(cpl));
check("filter bar is glass", /\.filter-bar\s*\{[^}]*background:\s*var\(--surface\)/.test(cpl));
check("algo light variant scoped to .kpi-card", cpl.includes(".kpi-card .algo-details summary"));
const fl = fs.readFileSync("first_light.js", "utf8");
check("first_light injects the ghost layer", fl.includes("ensureBgArt") && fl.includes(".cplfl-bg{position:fixed"));
check("ghost layer honors reduced transparency", fl.includes("prefers-reduced-transparency: reduce){.cplfl-bg{display:none}"));
check("First Light dialog stays opaque", fl.includes(".cplfl-dialog{background:var(--surface-opaque"));

// ── data surfaces stay opaque in the repointed JS assets ──
for (const f of ["cpl_funding.js", "cpl_todos.js", "canonical_subj4.js", "first_light.js"]) {
  const js = fs.readFileSync(f, "utf8");
  check(`${f}: no data surface on glass (var(--surface) bg)`, !/background:\s*var\(--surface\)\s*[;}"]/.test(js));
}

// ── report ──
let failed = 0;
for (const [name, ok, detail] of results) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail ? "  → " + detail : ""}`);
  if (!ok) failed++;
}
console.log(failed === 0
  ? `\nAll ${results.length} retheme token checks passed.`
  : `\n${failed} of ${results.length} retheme token checks FAILED.`);
process.exit(failed === 0 ? 0 : 1);

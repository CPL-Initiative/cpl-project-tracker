// The third axe pass (S495): the serious findings on internal tabs from the S494 sweep,
// fixed at the source and pinned here so a later edit cannot quietly undo them.
//
//   nested-interactive  TMC Builder's list rows: a row with role="button" held its
//                       official and PDF links. The row is a plain row now; its
//                       name is the native button that opens it.
//   color-contrast      the Activities cards: a metric with no figure yet showed its
//                       unit at opacity 0.5, below 4.5:1. It takes --text-muted.
//                       Memory: the ripple count (4.04:1 on a chosen row) and the
//                       verified status in dark (4.09:1) mix their hue 80% with
//                       --text-strong, which darkens in light and lightens in dark.
//   target-size         EACR's card summaries, its Select All box, and the Program
//                       Requirements filter's boxes: each target is 24px now.
//
// Run: node tests/axe_serious_pass.test.js
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

const results = [];
const check = (name, cond, msg) => results.push([!!cond, name + (cond ? "" : " — " + (msg || ""))]);

// ── TMC Builder: a plain row, a native button on the name ───────────────────
{
  const src = read("tmc_builder.js");
  check("TMC Builder's list row carries no role=\"button\" and no tabIndex",
    !/tr\.setAttribute\("role", "button"\)/.test(src) && !/tr\.tabIndex = 0/.test(src));
  check("the row's name is a native button that names what it opens",
    /<td class='tmc-lt-name'><button type='button' class='tmc-lt-open' aria-label='Open "/.test(src));
  check("the open button is an underlined word, 24px tall, with a focus ring",
    /\.tmc-lt-open\{[\s\S]{0,200}?min-height:24px[\s\S]{0,200}?text-decoration:underline/.test(src) && /\.tmc-lt-open:focus-visible\{outline:2px/.test(src));
  check("a click anywhere on the row still opens it", /tr\.onclick = function \(\) \{ openTmc\(t\.id\); \};/.test(src));
}

// ── Activities: the unit of a metric with no figure yet ─────────────────────
{
  const gen = read("excel_to_dashboard.py");
  check("the generator dims no metric unit with opacity", !/akpi-metric-unit" style="opacity/.test(gen) &&
    /<span class="akpi-metric-unit akpi-metric-unit-none">/.test(gen));
  for (const f of ["index.html", "CPL_Dashboard.html"]) {
    const html = read(f);
    check(`${f}: no metric unit at opacity 0.5, and the none state takes --text-muted`,
      !/akpi-metric-unit" style="opacity:0\.5/.test(html) && /\.akpi-metric-unit-none \{\s*color: var\(--text-muted\);/.test(html));
  }
}

// ── Memory: two chips mixed toward the ink ──────────────────────────────────
{
  const src = read("cpl_memory.js");
  check("Memory's ripple count mixes its hue toward --text-strong",
    /\.cpl-mem \.mi-ripple\{[^}]*color:color-mix\(in srgb,var\(--k-procedure\) 80%, var\(--text-strong\)\)/.test(src));
  check("Memory's verified status mixes its hue toward --text-strong",
    /\.cpl-mem \.st-verified\{color:color-mix\(in srgb,var\(--st-ok\) 80%, var\(--text-strong\)\)/.test(src));
}

// ── 24px targets ────────────────────────────────────────────────────────────
{
  const sw = read("statewide_interactive.js");
  check("EACR's card summaries are 24px targets",
    /\.cv-ex>summary,\.cv-rx>summary,\.sw-also-entered>summary,\.algo-details>summary\{min-height:24px;/.test(sw));
  check("EACR's Select All box is 24px", /\.sw-chk-all #sw-select-all\{width:24px;height:24px;/.test(sw));
  check("Program Requirements' filter boxes are 24px",
    /\.prh-dd-list input\[type=\\"checkbox\\"\] \{ width:24px; height:24px;/.test(read("program_requirements.js")));
}

let fail = 0;
for (const [ok, name] of results) { console.log(`${ok ? "  ok " : "  FAIL"} ${name}`); if (!ok) fail++; }
console.log(`\n${results.length - fail}/${results.length} checks passed`);
process.exit(fail ? 1 : 0);

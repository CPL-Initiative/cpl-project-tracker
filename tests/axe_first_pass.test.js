// The first axe pass (S494): what axe-core 4.10.2 found that the geometry runner
// cannot, fixed at the source, and pinned here so a later edit cannot quietly undo it.
//
//   select-name        COBI dashboard's three filters, TMC Builder's College and Show
//   aria-required-attr SkyView's resize grip, a focusable separator with no value
//   list               the veteran map's directories: li role="button" made each list hold
//                      no items, and a college row was a button holding a link
//
// Run: node tests/axe_first_pass.test.js
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

const results = [];
const check = (name, cond, msg) => results.push([!!cond, name + (cond ? "" : " — " + (msg || ""))]);

// ── COBI dashboard filters: named in both HTMLs (Rule 4) ─────────────────────
for (const f of ["index.html", "CPL_Dashboard.html"]) {
  const doc = new JSDOM(read(f)).window.document;
  const unnamed = ["caDistrictFilter", "tierFilter", "caDisciplineFilter"].filter((id) => {
    const el = doc.getElementById(id);
    return !el || !(el.getAttribute("aria-label") || "").trim();
  });
  check(`${f}: the dashboard's three filter selects carry a name`, unnamed.length === 0, unnamed.join(", "));
}

// ── TMC Builder: each label is tied to its select ─────────────────────────────
const tmc = read("tmc_builder.js");
check("TMC Builder ties College to #tmc-college-sel", /htmlFor = "tmc-college-sel"/.test(tmc));
check("TMC Builder ties Show to #tmc-status-filter", /htmlFor = "tmc-status-filter"/.test(tmc));

// ── SkyView's grip states its value ──────────────────────────────────────────
const sky = read("prototype/ccr_universe.js");
check("the grip ships aria-valuenow, -min and -max", /id="u-insp-grip" role="separator"[^']*aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"/.test(sky));
check("paintGripValue keeps it current on resize and on open/close",
  /function paintGripValue\(\)/.test(sky) && (sky.match(/paintGripValue\(\);/g) || []).length >= 2);

// ── The veteran map's directories: list items holding native buttons ────────
const build = read("veteran-sprint-map/build_selfcontained.py");
const page = read("veteran-sprint-map/ca_cpl_map_selfcontained.html");
for (const [label, src] of [["builder", build], ["built page", page]]) {
  check(`${label}: no directory row (li) is given role="button"`, !/li\.setAttribute\("role","button"\)/.test(src));
  check(`${label}: each directory row is a button.row inside its li`,
    (src.match(/<li data-n="\$\{esc\([cb]\.n\)\}"><button type="button" class="row"/g) || []).length === 2);
  check(`${label}: the college link sits beside the button, not inside it`,
    /<\/span><\/button>\s*<a href="\$\{esc\(c\.u\)\}"/.test(src));
}
check("the built page matches its builder (python3 build_selfcontained.py)",
  page.includes('function rowKeys(li,fn){ const b=li.querySelector("button.row"); if(b) b.onclick=fn; }') &&
  build.includes('function rowKeys(li,fn){ const b=li.querySelector("button.row"); if(b) b.onclick=fn; }'));

let fail = 0;
for (const [ok, name] of results) { console.log(`${ok ? "  ok " : "  FAIL"} ${name}`); if (!ok) fail++; }
console.log(`\n${results.length - fail}/${results.length} checks passed`);
process.exit(fail ? 1 : 0);

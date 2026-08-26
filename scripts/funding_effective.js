#!/usr/bin/env node
// What the CPL Implementation Funding model is ACTUALLY using.
//
// WHY THIS EXISTS.  Sam, 2026-08-26, after a session read
// `yearPriorities["2"].factor = 1` out of the live Supabase config and reported
// it as the model's Year-2 factor:
//
//     "Check your data ... Never rely on the config, Sky"
//
// The model uses 0.5.  The stored value was not stale and not missing — it was
// sitting there, saved, authoritative-looking, and completely inert, because
// `mirrorYears` makes `prioSlot()` return "1" for EVERY year so that block is
// never read.  A MISSING value sends you looking.  A PRESENT but dormant one
// does not.  That is what makes it the mistake this project keeps repeating.
//
// The repo already says "never re-derive an allocation, call the model"
// (_alloc/ncModel).  This is the same rule for DIALS, made runnable: the model
// answers, and this script only prints.  Nothing here computes a funding
// figure.  See cpl_memory: a-saved-setting-is-not-the-effective-value.
//
//   node scripts/funding_effective.js --config live.json
//   node scripts/funding_effective.js --config live.json --nc-sweep 15000,25000,50000
//   node scripts/funding_effective.js --baked          # baked defaults, STALE by design
//
// Getting live.json: the sandbox cannot reach *.supabase.co, so dump it with
// the Supabase MCP and write it to a file —
//   select config from cpl_funding_config where id='default';
// The `config` value IS the file.  Never hand-transcribe it; that is the bug
// this script exists to prevent.
"use strict";

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
};
const has = (name) => argv.includes(name);

const configPath = flag("--config");
const baked = has("--baked");

// REFUSING is the feature.  With no config this would print the baked defaults,
// which `cpl_funding_data.js` says in its own header are stale by design — and
// a stale number printed under the heading "effective" is worse than no number
// at all.  `--baked` is the deliberate escape hatch, and it still says so.
if (!configPath && !baked) {
  console.error(
    "REFUSING: no config supplied.\n" +
    "  The baked defaults in cpl_funding_data.js are STALE BY DESIGN — the live\n" +
    "  model is the Supabase overlay. Printing them under the heading\n" +
    "  \"effective\" would reproduce the exact error this script exists to stop.\n\n" +
    "  Dump the live config, then pass it:\n" +
    "    select config from cpl_funding_config where id='default';   (Supabase MCP)\n" +
    "    node scripts/funding_effective.js --config live.json\n\n" +
    "  Or --baked to read the baked defaults on purpose.");
  process.exit(2);
}

const dom = new JSDOM(
  '<!DOCTYPE html><html><head></head><body>' +
  '<div class="cpl-tab-pane" id="tab-implementation-funding"><div class="main-container">' +
  '<div><h2>CPL Implementation Funding</h2><span id="cplFundTitleLink"></span></div>' +
  '<div id="cplFundingMount">placeholder</div>' +
  "</div></div></body></html>",
  { runScripts: "outside-only", url: "https://example.org/" });
const { window } = dom;
window.scrollTo = function () {};
window.CPL_FUNDING_NO_REMOTE = true;   // no network; the config comes from the file

window.eval(read("cpl_funding_data.js"));
window.eval(read("cpl_funding.js"));
const T = window.CPL_FUNDING_TAB;

let source = "cpl_funding_data.js (BAKED — stale by design)";
if (configPath) {
  const raw = fs.readFileSync(configPath, "utf8");
  let cfg = JSON.parse(raw);
  // A `select config from ...` dump may arrive as the row, as an array of rows,
  // or as the bare config object. Accept all three rather than making the
  // caller reshape it by hand — reshaping by hand is transcription.
  if (Array.isArray(cfg)) cfg = cfg[0];
  if (cfg && !cfg.projects && cfg.config) cfg = cfg.config;
  if (typeof cfg === "string") cfg = JSON.parse(cfg);
  if (!cfg || !cfg.projects) {
    console.error("REFUSING: " + configPath + " has no `projects` key — that is not a funding config.");
    process.exit(2);
  }
  T._setConfig(cfg);
  source = configPath;
}
T.boot();

const money = (v) => "$" + Math.round(Number(v) || 0).toLocaleString("en-US");
const num = (v, d) => Number(v || 0).toLocaleString("en-US",
  { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });

const e = T._effective();

console.log("EFFECTIVE FUNDING DIALS — what the model uses, not what is stored");
console.log("  config source   " + source);
console.log("  project         " + e.project + " / " + e.scenario + "   window " + e.window);
console.log("  basis           " + e.basis);
console.log("  disbursement    " + e.disbursement + (e.disbursement === "frontload"
  ? "   (every year after 1 is CARRYOVER — zero cap)" : ""));
console.log("  mirrorYears     " + e.mirrorYears + (e.mirrorYears
  ? "   <-- later years READ YEAR 1; their stored blocks are INERT" : ""));
console.log("  priorityOrder   [" + e.priorityOrder.join(", ") + "]" +
  (e.priorityOrder.some((v, i) => v !== i)
    ? "   <-- screen ordinal != stored index" : "   (identity)"));

console.log("\nCREDIT POOL");
console.log("  to institutions " + money(e.pool.net_before_feeder));
console.log("  college pool    " + money(e.pool.net_college) + "   (after the noncredit carve-out)");
console.log("  floor / cap     " + money(e.pool.floor_window) + " / " + money(e.pool.cap_window));

console.log("\nNONCREDIT LANE");
console.log("  carve-out       " + money(e.nc.pool));
console.log("  entry threshold " + num(e.nc.threshold_ftes) + " FTES  ->  " + e.nc.institutions + " institutions");
console.log("  floor / cap     " + money(e.nc.floor_window) + " / " + money(e.nc.cap_window));
console.log("  at floor / cap  " + e.nc.at_floor + " / " + e.nc.at_cap);
console.log("  break-even      " + (e.nc.floor_infeasible ? "— (not meaningful: the floor is infeasible)"
  : num(e.nc.break_even_ftes) + " FTES   (below this, another noncredit FTES earns nothing)"));
if (e.nc.unspent > 0.5) console.log("  UNSPENT         " + money(e.nc.unspent) + "  <-- the dials strand this");
if (e.nc.floor_infeasible) console.log("  FLOOR INFEASIBLE — the pool cannot pay this minimum to every institution");
if (e.nc.cap_below_floor) console.log("  CAP BELOW FLOOR — check the dials");

for (const y of e.years) {
  const tags = [];
  if (y.mirroredFrom) tags.push("MIRRORED from year " + y.mirroredFrom);
  if (y.carryover) tags.push("CARRYOVER — zero cap");
  console.log("\nYEAR " + y.slot + (y.year ? " (" + y.year + ")" : "") +
    (tags.length ? "   [" + tags.join("; ") + "]" : ""));
  for (const p of y.priorities) {
    console.log("  P" + p.pos + " " + (p.title || "(untitled)") +
      "   share " + (p.share * 100).toFixed(0) + "%" +
      "   factor " + p.factor +
      "   unit " + (p.unit || "-") +
      "   [stored index " + p.srcIndex + "]");
    if (p.metric) console.log("       metric: " + p.metric);
  }
}

// ── optional: what a different noncredit floor would do ────────────────────
// The open decision as of 2026-08-23. The model is re-solved at each floor —
// the numbers are not interpolated, because a bounded solve is not linear.
const sweep = flag("--nc-sweep");
if (sweep) {
  const floors = sweep.split(",").map((s) => Number(s.trim())).filter((v) => v > 0);
  console.log("\nNONCREDIT FLOOR SWEEP — model re-solved at each floor");
  console.log("  floor        in lane   at floor   at cap   break-even FTES   unspent");
  const shared = T._getShared();
  const original = JSON.parse(JSON.stringify(shared.pool || {}));
  for (const f of floors) {
    shared.pool = Object.assign({}, original, { nc_floor_window: f });
    const nc = T._nc();
    console.log("  " + money(f).padEnd(12) +
      String(nc.rows.length).padStart(7) +
      String(Object.keys(nc.floored).length).padStart(11) +
      String(Object.keys(nc.capped).length).padStart(9) +
      // An infeasible floor puts EVERY institution on the minimum, so the
      // proportional rate the break-even is derived from no longer describes
      // anything. Printing the number anyway would be a figure with no referent.
      (nc.floorInfeasible ? "—" : num(nc.breakEven)).padStart(18) +
      money(nc.unspent).padStart(12) +
      (nc.floorInfeasible ? "   INFEASIBLE" : ""));
  }
  shared.pool = original;   // leave the loaded config as we found it
}

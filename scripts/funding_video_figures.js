#!/usr/bin/env node
// The figures CPL Funding in Motion shows, read from the model.
//
// WHY THIS EXISTS. Sam, 2026-10-19: "Can you add to the refresh all procedure
// the ability to revise the video and other text based on live info rather
// than hard coded data?" The introductions' figures were typed into
// prototype/funding_video/build.py from the engine under one config (md5
// e21658f9, 2026-10-01) and went stale the day the published scenario moved
// (Scenario 3, noncredit at 15%). This script asks the model for every figure
// the films show, per scenario, and writes them beside the films as
// prototype/funding_video/figures.json, stamped with the config they came
// from. build.py reads that file for the introductions (the narrated cuts keep
// the figures their voice speaks), and Refresh everything on the tab compares
// the stamp with the live model and says which film to rebuild.
//
//   node scripts/funding_video_figures.js --config live.json --write
//   node scripts/funding_video_figures.js --config live.json --check   # exit 1 when the stamped file differs
//   node scripts/funding_video_figures.js --config live.json           # print
//
// Getting live.json: the sandbox cannot reach *.supabase.co, so dump it with
// the Supabase MCP (select config from cpl_funding_config where id='default')
// and write the `config` value to a file; tests/fixtures/ keeps dated copies.
// Nothing here computes a funding figure: the model answers (T._videoFigures),
// this script only files what it says. See scripts/funding_effective.js.
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const OUT = path.join(ROOT, "prototype", "funding_video", "figures.json");

const argv = process.argv.slice(2);
const flag = (name) => { const i = argv.indexOf(name); return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null; };
const has = (name) => argv.includes(name);
const configPath = flag("--config");
const outPath = flag("--out") || OUT;

if (!configPath) {
  console.error("REFUSING: no config supplied. The baked defaults are stale by design.\n" +
    "  Dump the live config (Supabase MCP: select config from cpl_funding_config where id='default')\n" +
    "  and pass it: node scripts/funding_video_figures.js --config live.json --write");
  process.exit(2);
}

// A `select config from ...` dump may arrive as the row, as an array of rows,
// or as the bare config object.
const raw = fs.readFileSync(configPath, "utf8");
let cfg = JSON.parse(raw);
if (Array.isArray(cfg)) cfg = cfg[0];
if (cfg && !cfg.projects && cfg.config) cfg = cfg.config;
if (typeof cfg === "string") cfg = JSON.parse(cfg);
if (!cfg || !cfg.projects) { console.error("REFUSING: " + configPath + " has no `projects` key."); process.exit(2); }
// jsonb prints an object's keys sorted by length, then bytes, with ", " and
// ": " as separators; reproduced here so the stamp is the one a SQL read gives
// (tests/fixtures/cpl_funding_config_de95c290.json hashes to de95c290).
function pgJsonbText(v) {
  if (v === null || v === undefined) return "null";
  if (Array.isArray(v)) return "[" + v.map(pgJsonbText).join(", ") + "]";
  if (typeof v === "object") {
    const keys = Object.keys(v).map((k) => [k, Buffer.from(k, "utf8")])
      .sort((a, b) => a[1].length - b[1].length || Buffer.compare(a[1], b[1]));
    return "{" + keys.map(([k]) => JSON.stringify(k) + ": " + pgJsonbText(v[k])).join(", ") + "}";
  }
  if (typeof v === "string") return JSON.stringify(v);
  return String(v);
}
const md5 = crypto.createHash("md5").update(pgJsonbText(cfg), "utf8").digest("hex").slice(0, 8);

const dom = new JSDOM('<!DOCTYPE html><html><head></head><body>' +
  '<div class="cpl-tab-pane" id="tab-implementation-funding"><div class="main-container">' +
  '<div><h2>CPL Implementation Funding</h2><span id="cplFundTitleLink"></span></div>' +
  '<div id="cplFundingMount">placeholder</div></div></div></body></html>',
  { runScripts: "outside-only", url: "https://example.org/" });
const { window } = dom;
window.scrollTo = function () {};
window.CPL_FUNDING_NO_REMOTE = true;
window.eval(read("college_short_names.js"));
window.eval(read("cpl_funding_data.js"));
// The performance feed: the veterans' JST condition the film counts (T._videoFigures().vet).
window.eval(read("cpl_funding_performance.js"));
window.eval(read("cpl_funding.js"));
const T = window.CPL_FUNDING_TAB;
T._setConfig(cfg);
T.boot();

const project = Object.keys(cfg.projects)[0];
const scenarios = Object.keys(cfg.projects[project].scenarios || {});
const out = { source: path.relative(ROOT, configPath), config_md5: md5, read_at: new Date().toISOString(),
  project: project, published: cfg.projects[project].published || scenarios[0], scenarios: {} };
scenarios.forEach((name) => {
  T._switchScenario(name);
  out.scenarios[name] = T._videoFigures();
});

const text = JSON.stringify(out, null, 1) + "\n";
if (has("--check")) {
  if (!fs.existsSync(outPath)) { console.error("DIFFERS: " + path.relative(ROOT, outPath) + " does not exist yet (--write it)."); process.exit(1); }
  const old = JSON.parse(fs.readFileSync(outPath, "utf8"));
  const diffs = [];
  Object.keys(out.scenarios).forEach((name) => {
    const a = old.scenarios && old.scenarios[name];
    if (!a) { diffs.push(name + ": not in the file"); return; }
    const b = out.scenarios[name];
    const flat = (o, pre, acc) => { Object.keys(o).forEach((k) => {
      const v = o[k], key = pre ? pre + "." + k : k;
      if (v && typeof v === "object") flat(v, key, acc); else acc[key] = v; }); return acc; };
    const fa = flat(a, "", {}), fb = flat(b, "", {});
    Object.keys(fb).forEach((k) => { if (String(fa[k]) !== String(fb[k])) diffs.push(name + " " + k + ": " + fa[k] + " -> " + fb[k]); });
  });
  if (diffs.length) { console.log("DIFFERS from " + path.relative(ROOT, outPath) + " (stamped " + old.config_md5 + "):\n  " + diffs.slice(0, 40).join("\n  ")); process.exit(1); }
  console.log("MATCHES " + path.relative(ROOT, outPath) + " (config " + md5 + ")");
} else if (has("--write")) {
  fs.writeFileSync(outPath, text);
  console.log("wrote " + path.relative(ROOT, outPath) + " (config " + md5 + ", " + scenarios.length + " scenarios, published " + out.published + ")");
} else {
  process.stdout.write(text);
}

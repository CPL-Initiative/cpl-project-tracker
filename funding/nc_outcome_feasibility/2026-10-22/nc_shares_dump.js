#!/usr/bin/env node
// Each institution's award and its credit and noncredit shares, from the model under one config dump.
// Prints what the model answers; computes no funding figure (the standing rule: call the model).
//   node funding/nc_outcome_feasibility/2026-10-22/nc_shares_dump.js <config.json> <out.json>
"use strict";
const fs = require("fs"); const path = require("path");
const ROOT = path.join(__dirname, "..", "..", "..");
const { JSDOM } = require(path.join(ROOT, "node_modules", "jsdom"));
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><div class="cpl-tab-pane" id="tab-implementation-funding"><div class="main-container"><div><h2>CPL Implementation Funding</h2><span id="cplFundTitleLink"></span></div><div id="cplFundingMount">placeholder</div></div></div></body></html>', { runScripts: "outside-only", url: "https://example.org/" });
const { window } = dom; window.scrollTo = function () {}; window.CPL_FUNDING_NO_REMOTE = true;
window.eval(read("cpl_funding_data.js")); window.eval(read("cpl_funding.js"));
const T = window.CPL_FUNDING_TAB;
let cfg = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
if (Array.isArray(cfg)) cfg = cfg[0]; if (cfg && !cfg.projects && cfg.config) cfg = cfg.config;
T._setConfig(cfg); T.boot();
const e = T._effective();
const out = { scenario: e.scenario, window: e.window, pool: e.pool, rows: [] };
const names = window.CPL_FUNDING.colleges.map(c => c.college).concat(["NOCE", "SD Cont. Ed", "Calbright"]);
names.forEach(n => {
  const a = T._alloc(n); if (!a) { out.rows.push({ college: n, missing: true }); return; }
  const ncp = T._ncPrios(n, "1") || [];
  const row = window.CPL_FUNDING.colleges.find(c => c.college === n);
  out.rows.push({ college: n, nc_only: !row, credit_ftes: row ? row.credit_ftes : 0, noncredit_ftes: row ? row.noncredit_ftes : null,
    district: row ? row.district : null, award: a.total, cr_award: a.cr_award, nc_award: a.nc_award, floored: a.floored, capped: a.capped,
    nc_prios: ncp.map(p => ({ key: p.key, label: p.label, title: p.title, src: p.src, share: p.share, cap: p.cap, target: p.target, status: p.status, earned: p.earned })) });
});
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
console.log("rows", out.rows.length, "noncredit shares", out.rows.reduce((s, r) => s + (r.nc_award || 0), 0).toFixed(0));

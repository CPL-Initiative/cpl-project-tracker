#!/usr/bin/env node
/* Build cip_status_counts.json — the CIP Review tool's baseline progress counts.
 *
 * Runs the SHIPPED review classifier (cip_crosswalk.js) over EVERY college's COCI courses and tallies
 * how the tool classifies each course (Ready / Review / Suggested / Manual) — per subject, per college,
 * and system-wide. This is the "engine baseline" (how much work exists), NOT human progress: it is
 * deterministic and identical for every viewer, so we precompute it once here instead of freezing the
 * browser on a ~1,500-course (per college) or ~150k-course (statewide) live compute.
 *
 * Single source of truth: it loads the real engine (no re-implementation) via the seams _setData /
 * _setConsensus / _reviewRows, in a bare vm context (the engine seams never touch the DOM), so the
 * counts always match what the tab shows. The work is split across a small pool of short-lived worker
 * processes (each classifies a few colleges then exits) — fast, and no single long/heavy process.
 *
 * Inputs (committed):  cip_crosswalk_data.js · course_top_consensus.json · cip_fitcheck_colleges.json ·
 *                      cip_fitcheck/<slug>.json
 * Output (committed):  cip_status_counts.json   (fetched on tab open; a few hundred KB)
 * Rebuild:  npm install && node kb/build_cip_status_counts.js   (re-run when any input above changes)
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const cp = require("child_process");
const os = require("os");

const ROOT = path.dirname(__dirname);
const R = (p) => path.join(ROOT, p);
const STATUS = { clear: "ready", review: "review", suggest: "suggest", manual: "manual" };
const zero = () => ({ n: 0, ready: 0, review: 0, suggest: 0, manual: 0 });

function loadEngine() {
  const win = {};
  const ctx = { window: win, self: win, console: console,
    document: { createElement: () => ({}), head: { appendChild: () => {} }, getElementById: () => null },
    localStorage: { getItem: () => null, setItem: () => {} } };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(R("cip_crosswalk_data.js"), "utf8"), ctx);
  vm.runInContext(fs.readFileSync(R("cip_crosswalk.js"), "utf8"), ctx);
  const api = win.CPL_CIP_CROSSWALK;
  api._setData(win.CIP_CROSSWALK);
  api._setConsensus(JSON.parse(fs.readFileSync(R("course_top_consensus.json"), "utf8")));
  return api;
}

function classifyCollege(api, c) {
  const fp = R(path.join("cip_fitcheck", c.slug + ".json"));
  if (!fs.existsSync(fp)) return null;
  const rows = api._reviewRows(JSON.parse(fs.readFileSync(fp, "utf8")));
  const col = zero(); col.name = c.name; col.subjects = {};
  rows.forEach((r) => {
    const k = STATUS[r.status] || "manual";
    col.n++; col[k]++;
    const s = col.subjects[r.subj] || (col.subjects[r.subj] = zero());
    s.n++; s[k]++;
  });
  return col;
}

// ── worker: classify the batch of slugs sent over IPC, reply, exit ──────────────────────────────────
if (process.argv[2] === "--worker") {
  const api = loadEngine();
  const bySlug = {};
  JSON.parse(fs.readFileSync(R("cip_fitcheck_colleges.json"), "utf8")).forEach((c) => { bySlug[c.slug] = c; });
  process.on("message", (slugs) => {
    const res = {};
    slugs.forEach((sl) => { if (bySlug[sl]) { const col = classifyCollege(api, bySlug[sl]); if (col) res[sl] = col; } });
    process.send(res);
    process.exit(0);
  });
  return;
}

// ── orchestrator: a pool of N workers, each handed small batches, spawned fresh as slots free ───────
const t0 = Date.now();
const colleges = JSON.parse(fs.readFileSync(R("cip_fitcheck_colleges.json"), "utf8"));
const BATCH = 3, N = Math.min(6, Math.max(1, os.cpus().length - 1));
const queue = [];
for (let i = 0; i < colleges.length; i += BATCH) queue.push(colleges.slice(i, i + BATCH).map((c) => c.slug));
const out = { built: "engine-baseline (deterministic); progress + last-active come from the Phase-B backend",
  systemwide: Object.assign(zero(), { colleges: 0, subjects: 0 }), colleges: {} };
let active = 0;

function finish() {
  fs.writeFileSync(R("cip_status_counts.json"), JSON.stringify(out));
  const sw = out.systemwide;
  console.log(`colleges ${sw.colleges} · subjects ${sw.subjects} · courses ${sw.n.toLocaleString()}`);
  console.log(`ready ${sw.ready.toLocaleString()} · review ${sw.review.toLocaleString()} · suggest ${sw.suggest.toLocaleString()} · manual ${sw.manual.toLocaleString()}`);
  console.log(`wrote cip_status_counts.json (${(fs.statSync(R("cip_status_counts.json")).size / 1024).toFixed(0)} KB) in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
function merge(res) {
  Object.keys(res).forEach((sl) => {
    const col = res[sl]; out.colleges[sl] = col;
    ["n", "ready", "review", "suggest", "manual"].forEach((k) => { out.systemwide[k] += col[k]; });
    out.systemwide.colleges++; out.systemwide.subjects += Object.keys(col.subjects).length;
  });
}
function pump() {
  while (active < N && queue.length) {
    const batch = queue.shift(); active++;
    const w = cp.fork(__filename, ["--worker"]);
    w.on("message", (res) => { merge(res); w.kill(); active--; if (queue.length) pump(); else if (active === 0) finish(); });
    w.send(batch);
  }
}
pump();

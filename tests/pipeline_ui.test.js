// Pipeline tab (pipeline.js) — the UI pass of S415 (2026-10-18), guarded.
//   - Rule 4, and the tab's CSS lives in pipeline.js (no <style> in the pane),
//     tokens only: no raw hex anywhere in pipeline.js.
//   - Mermaid is pinned to an exact version (a floating @10 changed what painted).
//   - The two diagram boxes are named, keyboard-reachable regions.
//   - Statuses are words: no check marks or ≥ in what the tab writes.
//   - Wiring: every audit tag the Unified Courses triage filter names is counted
//     here under the same label, so a count names the filter that lists its rows.
//   - Failure mode: dark COBI kept a light diagram. The diagrams draw their
//     theme from the tokens and render again on cpl:themechange.
//
// Run from repo root: `npm test` (or `node tests/pipeline_ui.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ─────────────────────────────────────────────────────────────────────────────
// Part A — static invariants
// ─────────────────────────────────────────────────────────────────────────────
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);

const a = idx.indexOf('id="tab-pipeline"');
const b = idx.indexOf("<!-- /tab-pipeline -->", a);
const pane = a > 0 && b > a ? idx.slice(a, b) : "";
check("the Pipeline pane exists", pane.length > 0);
check("the pane carries no <style> block (CSS lives in pipeline.js)", pane.indexOf("<style") === -1);
["pl-lifecycle", "pl-workflow"].forEach(function (id) {
  const m = new RegExp('<div id="' + id + '"[^>]*>').exec(pane);
  const tag = m ? m[0] : "";
  check(id + " is a region", /role="region"/.test(tag));
  check(id + " has an accessible name", /aria-label="[^"]+"/.test(tag));
  check(id + " is keyboard-reachable", /tabindex="0"/.test(tag));
});

const src = fs.readFileSync("pipeline.js", "utf8");
check("pipeline.js holds no raw hex (tokens only)", !/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/.test(src));
check("Mermaid pinned to an exact version", /mermaid@\d+\.\d+\.\d+\//.test(src));
check("no check mark in pipeline.js", src.indexOf("✓") === -1);
check("no ≥ in pipeline.js", src.indexOf("≥") === -1);

// The Unified Courses triage filter: label → tag.
const uc = fs.readFileSync("unified_courses.js", "utf8");
const ucPairs = [];
const re = /"([^"]+)":\s*function \(c\) \{ return c\.tags\.indexOf\("([a-z_]+)"\) >= 0; \}/g;
let mm;
while ((mm = re.exec(uc))) ucPairs.push({ label: mm[1], tag: mm[2] });
check("read the Unified Courses triage tags (at least 10)", ucPairs.length >= 10);

// ─────────────────────────────────────────────────────────────────────────────
// Part B — behaviour in jsdom, with Mermaid and the audit file stubbed
// ─────────────────────────────────────────────────────────────────────────────
const html = `<!DOCTYPE html><html><head></head><body>
  <div class="cpl-tab-pane" id="tab-pipeline"><div class="main-container">
    <div id="pl-roadmap" class="pl-roadmap pl-loading"></div>
    <div id="pl-lifecycle" class="pl-card pl-mermaid pl-loading"></div>
    <div id="pl-lifecycle-status"></div>
    <div id="pl-receipt" class="pl-receipt pl-loading"></div>
    <div id="pl-receipt-status"></div>
    <div id="pl-workflow" class="pl-card pl-mermaid pl-loading"></div>
  </div></div>
</body></html>`;
const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/" });
const { window } = dom;
const document = window.document;
document.documentElement.style.setProperty("--text-strong", "rgb(1, 2, 3)");

let theme = "light";
window.CPL_THEME = { effective: function () { return theme; } };
const inits = [];
const renders = [];
window.mermaid = {
  initialize: function (cfg) { inits.push(cfg); },
  render: function (id, text) { renders.push(text); return Promise.resolve({ svg: "<svg></svg>" }); },
};
const rows = [
  { tags: ["subject_collision_signal", "unit_anomaly"] },
  { tags: ["mid_id_off_scheme", "blank_discipline"] },
  { tags: ["member_top_divergence"] },
  { tags: ["subject_discipline_outlier", "seed_untouched_discipline"] },
  { tags: [] },
];
window.fetch = function () {
  return Promise.resolve({ ok: true, json: function () {
    return Promise.resolve({ _generated_at: "2026-10-18T11:15:51+00:00", rows: rows });
  } });
};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("pipeline.js eval threw:", e); }
check("pipeline.js evaluates without throwing", !threw);
check("CSS injected once into <head>", document.querySelectorAll("style#pl-css").length === 1);
const api = window.CPL_PIPELINE || {};

// Wiring, against the module's own list.
const supporting = api.SUPPORTING_RULES || [];
const byTag = {};
supporting.forEach(function (r) { byTag[r.tag] = r.label; });
const receiptLabel = "Subject collision (Phase 1e re-mint target)";
ucPairs.forEach(function (p) {
  const here = p.tag === "subject_collision_signal" ? receiptLabel : byTag[p.tag];
  check("UC's \"" + p.label + "\" is counted here under the same label", here === p.label);
});

function settle() { return new Promise(function (r) { setTimeout(r, 30); }); }

(async function () {
  // Activate the way a reader does: by the tab's hash (pipeline.js listens for it).
  window.location.hash = "#pipeline";
  await settle();

  const cards = document.querySelectorAll("#pl-roadmap .pl-phase");
  check("roadmap renders one card per phase", cards.length >= 10);
  const statuses = Array.from(document.querySelectorAll("#pl-roadmap .pl-phase-status")).map(function (n) { return n.textContent; });
  check("every status is a word (Done, In progress, Queued, Parked)",
    statuses.length === cards.length && statuses.every(function (s) { return /^(Done \d{4}-\d{2}-\d{2}|In progress|Queued|Parked)$/.test(s); }));

  const stats = Array.from(document.querySelectorAll("#pl-receipt .pl-stat"));
  const collision = stats[0];
  check("an invariant above its target is marked by class AND word",
    collision && collision.classList.contains("above") && /Above target 0/.test(collision.textContent));
  const offScheme = stats[1];
  check("the off-scheme row with a blank discipline is not counted, in words",
    offScheme && offScheme.classList.contains("at") && /At target 0; 1 more with a blank discipline is not counted/.test(offScheme.textContent));
  const labels = stats.map(function (s) { return s.querySelector(".pl-stat-label").textContent; });
  check("supporting cards use UC's labels", labels.indexOf("Cross-discipline over-merge (member TOP)") >= 0 &&
    labels.indexOf("Subject-code outlier (likely mis-mint)") >= 0 && labels.indexOf("Unit anomaly (high member-unit variance)") >= 0);
  const status = document.getElementById("pl-receipt-status").textContent;
  check("status line in words, time in UTC", /2026-10-18, 11:15 UTC/.test(status) && /with at least one flag/.test(status));

  check("both diagrams rendered", renders.length === 2);
  check("Mermaid's theme is 'base' with token-drawn variables",
    inits.length >= 1 && inits[0].theme === "base" && inits[0].themeVariables && inits[0].themeVariables.darkMode === false);
  check("diagrams carry an accessible title", renders.every(function (t) { return /accTitle: /.test(t); }));
  check("diagram sources hold no hex fill", renders.every(function (t) { return !/fill:#/.test(t); }));
  check("lifecycle runs top to bottom (legible on a phone)", /^flowchart TD/.test(renders[0]));

  theme = "dark";
  window.dispatchEvent(new window.CustomEvent("cpl:themechange", { detail: { choice: "dark", theme: "dark" } }));
  await settle();
  check("a theme change renders both diagrams again", renders.length === 4);
  check("the repaint uses the dark theme", inits.length >= 2 && inits[inits.length - 1].themeVariables.darkMode === true);

  let failed = 0;
  results.forEach(function (r) {
    console.log((r[1] ? "PASS" : "FAIL") + "  " + r[0]);
    if (!r[1]) failed++;
  });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})();

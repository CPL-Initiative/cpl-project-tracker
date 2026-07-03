// Session 97 — sidebar nav groups (nav_groups.js) — jsdom test.
//
// Guards:
//  (a) the flat rail wraps into labeled collapsible groups, Dashboard pinned
//      top-level, external launchers under Share;
//  (b) tabs.js compatibility: every button keeps its data-tab and remains
//      query-able under nav.cpl-tabs (VALID_TABS derivation unaffected);
//  (c) unlisted tabs stay top-level (future tabs never disappear);
//  (d) the active tab's group force-opens on cpl-tab-activated;
//  (e) collapse state persists to localStorage.
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const src = fs.readFileSync("nav_groups.js", "utf8");

const NAV = `
<nav class="cpl-tabs" role="tablist">
  <button class="cpl-tab active" data-tab="dashboard">Dashboard</button>
  <button class="cpl-tab" data-tab="activities-projects">Activities</button>
  <button class="cpl-tab" data-tab="raci">Team &amp; RACI</button>
  <button class="cpl-tab" data-tab="map-users">MAP Users</button>
  <button class="cpl-tab" data-tab="workplan-goals">Annual Workplan Goals</button>
  <button class="cpl-tab" data-tab="budget">Budget</button>
  <button class="cpl-tab" data-tab="implementation-funding">Implementation Funding</button>
  <button class="cpl-tab" data-tab="vision-2030">Vision 2030</button>
  <button class="cpl-tab" data-tab="military-partnerships">Military Partnerships</button>
  <button class="cpl-tab" data-tab="annual-report">Annual Report</button>
  <button class="cpl-tab" data-tab="unified-courses">Common Course Reference</button>
  <button class="cpl-tab" data-tab="canonical-subj4">Common Subjects Reference</button>
  <button class="cpl-tab" data-tab="credential-reference">Common Exhibit Reference</button>
  <button class="cpl-tab" data-tab="exhibit-adoption">Exhibit Adoption</button>
  <button class="cpl-tab" data-tab="tmc-builder">TMC Builder</button>
  <button class="cpl-tab" data-tab="pipeline">Pipeline</button>
  <button class="cpl-tab" data-tab="letters">Letters</button>
  <button class="cpl-tab" data-tab="cpl-news">CPL News</button>
  <button class="cpl-tab" data-tab="chatbot">CPL Assistant</button>
  <button class="cpl-tab" data-tab="sierra-training">Sierra Training</button>
  <button class="cpl-tab" data-tab="knowledge-base">Knowledge Base</button>
  <button class="cpl-tab" data-tab="future-unlisted-tab">Future Tab</button>
  <a class="cpl-tab cpl-tab-external" href="fact-sheet/">Fact Sheet</a>
  <a class="cpl-tab cpl-tab-external" href="sierra/">Ask Sierra</a>
</nav>`;

function makeWin() {
  const dom = new JSDOM("<!doctype html><html><head></head><body>" + NAV + "</body></html>",
    { url: "https://cpl-initiative.github.io/cpl-project-tracker/", runScripts: "dangerously" });
  const w = dom.window;
  const el = w.document.createElement("script");
  el.textContent = src;
  w.document.body.appendChild(el);
  // jsdom sits at readyState "loading" here — fire the event init waits for
  // (build() is idempotent, so the real event firing later is harmless).
  w.document.dispatchEvent(new w.Event("DOMContentLoaded", { bubbles: true }));
  return w;
}

(function () {
  const w = makeWin();
  const doc = w.document;
  const nav = doc.querySelector("nav.cpl-tabs");

  // (a) groups exist
  const groups = nav.querySelectorAll(".cpl-nav-group");
  check("groups render", groups.length >= 5);
  check("Dashboard stays pinned top-level (not inside a group)",
    doc.querySelector('[data-tab="dashboard"]').closest(".cpl-nav-group") === null);
  check("Activities lands in the Workplan group",
    doc.querySelector('[data-tab="activities-projects"]').closest('[data-nav-group="workplan"]') !== null);
  check("CCR lands in Reference & Curation",
    doc.querySelector('[data-tab="unified-courses"]').closest('[data-nav-group="reference"]') !== null);
  check("externals land in Share",
    doc.querySelector('a[href="sierra/"]').closest('[data-nav-group="share"]') !== null);

  // (b) tabs.js derivation still sees every button
  const btns = nav.querySelectorAll(".cpl-tab[data-tab]");
  check("all 22 data-tab buttons remain query-able under nav.cpl-tabs", btns.length === 22);

  // (c) unlisted tab stays top-level
  check("unlisted future tab stays top-level (never disappears)",
    doc.querySelector('[data-tab="future-unlisted-tab"]').closest(".cpl-nav-group") === null);

  // default state: workplan open, others collapsed
  check("Workplan open by default",
    !nav.querySelector('[data-nav-group="workplan"]').classList.contains("collapsed"));
  check("Reference collapsed by default",
    nav.querySelector('[data-nav-group="reference"]').classList.contains("collapsed"));

  // (d) activation force-opens the group
  w.dispatchEvent(new w.CustomEvent("cpl-tab-activated", { detail: { tab: "unified-courses" } }));
  check("activating CCR opens Reference & Curation",
    !nav.querySelector('[data-nav-group="reference"]').classList.contains("collapsed"));

  // (e) header click persists state
  const head = nav.querySelector('[data-nav-group="funding"] .cpl-nav-group-head');
  head.dispatchEvent(new w.Event("click", { bubbles: true }));
  const stored = JSON.parse(w.localStorage.getItem("cplNavGroups.v1") || "{}");
  check("toggle persists to localStorage", stored.funding === true);
})();

// idempotency — a second build() is a no-op
(function () {
  const w = makeWin();
  const before = w.document.querySelectorAll(".cpl-nav-group").length;
  w.CPL_NAV_GROUPS.build();
  check("second build() is a no-op",
    w.document.querySelectorAll(".cpl-nav-group").length === before);
})();

let failed = 0;
results.forEach(function (r) {
  console.log((r[1] ? "PASS " : "FAIL ") + r[0]);
  if (!r[1]) failed++;
});
console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
process.exit(failed ? 1 : 0);

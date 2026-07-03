// Session 97 — slim actions bar + Where To reset — jsdom + template guards.
//
// Guards:
//  (a) applyFilters() survives the removed Activity/Vision/Goal/Status selects
//      (null-guarded reads) and still filters by Lead + search;
//  (b) the template carries the slim bar at the TOP of the Activities pane,
//      keeps the generator's <!-- Filter Bar --> anchor comment in place, and
//      both HTMLs stay identical (Rule 4);
//  (c) the sidebar label reads "Activities";
//  (d) quickstart.js clears the Where To box after a suggestion jump.
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── (a) applyFilters with the slim control set ──
(function () {
  const html = `<!doctype html><html><body>
    <div class="filter-bar" id="activitiesActionsBar">
      <select id="filterLead"><option value="">All</option><option value="Samuel Lee">Samuel Lee</option></select>
      <input type="text" id="searchBox">
      <div id="filterButtons" class="filter-buttons"></div>
    </div>
    <div id="projectsGrid">
      <div class="project-card" data-activity="Activity 4" data-lead="Samuel Lee" data-goal="Goal 1" data-status="On Track" data-v2030="">Veteran Sprint</div>
      <div class="project-card" data-activity="Activity 4" data-lead="Crystal Nasio" data-goal="Goal 1" data-status="On Track" data-v2030="">Apprenticeship Sprint</div>
    </div>
    <span id="projectCount"></span>
  </body></html>`;
  const dom = new JSDOM(html, { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  const el = w.document.createElement("script");
  el.textContent = fs.readFileSync("dashboard_filters.js", "utf8");
  w.document.body.appendChild(el);

  let threw = false;
  try { w.applyFilters(); } catch (e) { threw = true; }
  check("applyFilters does not throw without the retired selects", !threw);
  check("no filters → both cards visible", w.document.getElementById("projectCount").textContent === "(2)");

  w.document.getElementById("filterLead").value = "Samuel Lee";
  w.applyFilters();
  const cards = w.document.querySelectorAll(".project-card");
  check("Lead filter still works", cards[0].style.display !== "none" && cards[1].style.display === "none");

  w.document.getElementById("filterLead").value = "";
  w.document.getElementById("searchBox").value = "apprenticeship";
  w.applyFilters();
  check("search still works", cards[0].style.display === "none" && cards[1].style.display !== "none");
})();

// ── (b+c) template guards ──
(function () {
  const a = fs.readFileSync("CPL_Dashboard.html", "utf8");
  const b = fs.readFileSync("index.html", "utf8");
  check("Rule 4: CPL_Dashboard.html === index.html", a === b);

  const paneStart = a.indexOf('id="tab-activities-projects"');
  const barPos = a.indexOf('id="activitiesActionsBar"');
  const wrapperPos = a.indexOf('id="workplanProjectsWrapper"');
  check("slim bar sits inside the Activities pane ABOVE the workplan wrapper",
    paneStart > 0 && barPos > paneStart && wrapperPos > barPos);
  check("generator anchor <!-- Filter Bar --> is still present exactly once",
    a.split("<!-- Filter Bar -->").length === 2);
  check("retired selects are gone from the template",
    a.indexOf('id="filterActivity"') === -1 && a.indexOf('id="filterVision"') === -1
    && a.indexOf('id="filterGoal"') === -1 && a.indexOf('id="filterStatus"') === -1);
  check("Apply/Reset buttons are gone", a.indexOf('id="applyBtn"') === -1 && a.indexOf('id="resetBtn"') === -1);
  check("Element Map anchor survives in the slim bar", a.indexOf('id="elementMapBtn"') > 0);
  check("sidebar label reads Activities",
    /data-tab="activities-projects"[^>]*>Activities<\/button>/.test(a));
  check("nav_groups.js is script-loaded", a.indexOf('src="nav_groups.js"') > 0);
})();

// ── (d) Where To resets after a suggestion jump ──
(async function () {
  const dom = new JSDOM('<!doctype html><html><body><div id="cobiQsSlot"></div><nav class="cpl-tabs"></nav></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.CPL_REPORT_PROXY_URL = "";
  w.CPL_DATA = { projects: [{ id: "4.1.1", name: "Apprenticeship Sprint", activity: "Activity 4" }] };
  const el = w.document.createElement("script");
  el.textContent = fs.readFileSync("quickstart.js", "utf8");
  w.document.body.appendChild(el);
  w.document.dispatchEvent(new w.Event("DOMContentLoaded"));

  const input = w.document.getElementById("qs-input");
  check("quickstart mounts in the masthead slot", !!input);
  input.value = "appren";
  input.dispatchEvent(new w.Event("input", { bubbles: true }));
  const item = w.document.querySelector(".qs-suggest-item");
  check("typeahead suggests the project", !!item);
  item.dispatchEvent(new w.Event("mousedown", { bubbles: true }));
  await new Promise(function (r) { setTimeout(r, 350); });
  check("Where To box resets (empty) after the jump", input.value === "");

  // report
  let failed = 0;
  results.forEach(function (r) {
    console.log((r[1] ? "PASS " : "FAIL ") + r[0]);
    if (!r[1]) failed++;
  });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})();

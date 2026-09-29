// Activities tab reorg — the Sprint filter (dashboard_filters.js).
//
// Post-reorg, every project renders as an .activity-kpi-card nested under its
// .activity-group, each carrying data-sprint (one of "Veteran Sprint" /
// "Apprenticeship Sprint" / "Statewide Adoption Sprint", empty when none).
// The static actions bar gained a #filterSprint select. Guards:
//  - selecting a sprint shows only cards whose data-sprint matches;
//  - an .activity-group with zero surviving cards collapses (display:none);
//  - resetting to "All" restores every card + group.
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const html = `<!doctype html><html><body>
  <div class="filter-bar" id="activitiesActionsBar">
    <select id="filterSprint">
      <option value="">All</option>
      <option value="Veteran Sprint">Veteran Sprint</option>
      <option value="Apprenticeship Sprint">Apprenticeship Sprint</option>
      <option value="Statewide Adoption Sprint">Statewide Adoption Sprint</option>
    </select>
    <input type="text" id="searchBox">
  </div>

  <div class="activity-group" id="grp1">
    <div class="activity-group-header"><h3>Activity 1: Infrastructure</h3></div>
    <div class="activity-kpi-grid">
      <div class="activity-kpi-card" id="c1" data-pid="1.1" data-activity="Activity 1" data-goal="Goal 2" data-sprint="Veteran Sprint" data-depth="0">1.1 platform</div>
      <div class="activity-kpi-card" id="c2" data-pid="1.2" data-activity="Activity 1" data-goal="Goal 2" data-sprint="" data-depth="0">1.2 registry</div>
    </div>
  </div>

  <div class="activity-group" id="grp2">
    <div class="activity-group-header"><h3>Activity 2: Adoption</h3></div>
    <div class="activity-kpi-grid">
      <div class="activity-kpi-card" id="c3" data-pid="2.1" data-activity="Activity 2" data-goal="Goal 1" data-sprint="Apprenticeship Sprint" data-depth="0">2.1 outreach</div>
    </div>
  </div>

  <div class="activity-group" id="grp3">
    <div class="activity-group-header"><h3>Activity 4: Sprints</h3></div>
    <div class="activity-kpi-grid">
      <div class="activity-kpi-card" id="c4" data-pid="4.1" data-activity="Activity 4" data-goal="" data-sprint="Veteran Sprint" data-depth="0">4.1 veteran sprint</div>
    </div>
  </div>
</body></html>`;

const dom = new JSDOM(html, { url: "https://example.org/", runScripts: "dangerously" });
const w = dom.window;
const el = w.document.createElement("script");
el.textContent = fs.readFileSync("dashboard_filters.js", "utf8");
w.document.body.appendChild(el);

const shown = (id) => w.document.getElementById(id).style.display !== "none";

// baseline — no sprint selected → everything visible
let threw = false;
try { w.applyFilters(); } catch (e) { threw = true; }
check("applyFilters does not throw", !threw);
check("All → every card visible", shown("c1") && shown("c2") && shown("c3") && shown("c4"));
check("All → every group visible", shown("grp1") && shown("grp2") && shown("grp3"));

// select Veteran Sprint
w.document.getElementById("filterSprint").value = "Veteran Sprint";
w.applyFilters();
check("Veteran → matching card in a mixed group shows (c1)", shown("c1"));
check("Veteran → non-matching card hides (c2 empty sprint)", !shown("c2"));
check("Veteran → Apprenticeship-only group collapses (grp2)", !shown("grp2"));
check("Veteran → group with a surviving card stays (grp3)", shown("grp3") && shown("c4"));

// back to All
w.document.getElementById("filterSprint").value = "";
w.applyFilters();
check("All restores every card", shown("c1") && shown("c2") && shown("c3") && shown("c4"));
check("All restores every group", shown("grp1") && shown("grp2") && shown("grp3"));

let failed = 0;
results.forEach(function (r) {
  console.log((r[1] ? "PASS " : "FAIL ") + r[0]);
  if (!r[1]) failed++;
});
console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
process.exit(failed ? 1 : 0);

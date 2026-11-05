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

// ── every view has an address (2026-11-04): #activities-projects/sprint/<v>/lead/<v> ──
// The page loads dashboard_filters.js before cpl_session.js and tabs.js, so the pair wires as the tab activates.
const LEAD = '<select id="filterLead"><option value="">All</option><option value="Samuel Lee">Samuel Lee</option>'
  + '<option value="Samuel Lee / Crystal Nasio">Samuel Lee / Crystal Nasio</option></select>';
function page(hash) {
  const d = new JSDOM(html.replace('<input type="text" id="searchBox">', LEAD + '<input type="text" id="searchBox">'),
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "dangerously" });
  const x = d.window;
  const bag = () => { const o = {}; return { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } }; };
  Object.defineProperty(x, "localStorage", { value: bag(), configurable: true });
  Object.defineProperty(x, "sessionStorage", { value: bag(), configurable: true });
  x.fetch = () => Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
  [fs.readFileSync("dashboard_filters.js", "utf8"), fs.readFileSync("cpl_session.js", "utf8")].forEach((src) => {
    const s = x.document.createElement("script"); s.textContent = src; x.document.body.appendChild(s);
  });
  x.dispatchEvent(new x.CustomEvent("cpl-tab-activated", { detail: { tab: "activities-projects" } }));
  return x;
}
function ask(x) { x.CPL_SESSION.stashReturnTab("activities-projects"); return (JSON.parse(x.localStorage.getItem("cpl_sb_return_tab")) || {}).tab; }
const vis = (x, id) => x.document.getElementById(id).style.display !== "none";
{
  const a = page("#activities-projects/sprint/veteran");
  check("address 1: #activities-projects/sprint/veteran opens on Veteran Sprint",
    a.document.getElementById("filterSprint").value === "Veteran Sprint" && vis(a, "c1") && !vis(a, "c2") && !vis(a, "grp2"));
  check("address 2: the view reports activities-projects/sprint/veteran", ask(a) === "activities-projects/sprint/veteran");
  a.document.getElementById("filterSprint").value = "Statewide Adoption Sprint";
  a.document.getElementById("filterLead").value = "Samuel Lee / Crystal Nasio";
  check("address 3: switched, it reports both parts as slugs",
    ask(a) === "activities-projects/sprint/statewide-adoption/lead/samuel-lee-crystal-nasio", ask(a));
  a.document.getElementById("filterSprint").value = "";
  a.document.getElementById("filterLead").value = "";
  check("address 4: no filter reports the bare tab, not the stale address", ask(a) === "activities-projects");
}
{
  const b = page("#activities-projects/lead/samuel-lee");
  check("address 5: a lead alone opens on that lead", b.document.getElementById("filterLead").value === "Samuel Lee"
    && b.document.getElementById("filterSprint").value === "");
  const c = page("#activities-projects");
  check("address 6: the bare tab opens every card, both selects on All",
    c.document.getElementById("filterSprint").value === "" && c.document.getElementById("filterLead").value === ""
    && ["c1", "c2", "c3", "c4"].every((id) => vis(c, id)) && ask(c) === "activities-projects");
  c.history.replaceState(null, "", "#activities-projects/sprint/apprenticeship");
  c.dispatchEvent(new c.CustomEvent("cpl-tab-activated", { detail: { tab: "activities-projects" } }));
  check("address 7: a later visit on /sprint/apprenticeship opens it", c.document.getElementById("filterSprint").value === "Apprenticeship Sprint"
    && vis(c, "c3") && !vis(c, "c1"));
  const d = page("#activities-projects/card-1.1");
  check("address 8: a card link is not a filter; nothing is narrowed and the card address is kept",
    d.document.getElementById("filterSprint").value === "" && ["c1", "c2", "c3", "c4"].every((id) => vis(d, id))
    && ask(d) === "activities-projects/card-1.1");
  const e = page("#activities-projects/sprint/nonsense/lead/nobody");
  check("address 9: unknown values leave All", e.document.getElementById("filterSprint").value === "" && e.document.getElementById("filterLead").value === "");
  check("address 10: nothing about the view is stored",
    !Object.keys(e.localStorage).some((k) => k !== "cpl_sb_return_tab" && /sprint|lead|filter|view/i.test(k)));
}

let failed = 0;
results.forEach(function (r) {
  console.log((r[1] ? "PASS " : "FAIL ") + r[0]);
  if (!r[1]) failed++;
});
console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
process.exit(failed ? 1 : 0);

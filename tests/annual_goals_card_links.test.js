// Annual Workplan Goals → the Activity cards (S438). Sam, 2026-10-20: "Add links to go
// directly to the Activity cards." Each sub-activity row prints "Activity card"
// (#activities-projects/card-<id>) and each Activity header "Activity cards"
// (#activities-projects/activity-<N>); card_actions.js lands them on the Activities tab.
//
// Both ends come from the real renderers (python3, openpyxl stubbed): the Annual table
// and the Activities tab's cards. The failure modes guarded:
//   (a) a link whose target the Activities tab does not print (an href that drifted from
//       the card's data-pid, a group without its data-activity-id);
//   (b) the link opens the tab but not the card: no scroll, the Activities section left
//       folded, a filter left hiding the card, nothing to show which card it was;
//   (c) a hash that is not a card link sets nothing off.
//
// Run from repo root: `npm test` (or `node tests/annual_goals_card_links.test.js`).
const fs = require("fs");
const { spawnSync } = require("child_process");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const PY = `
import sys, types, json
sys.modules.setdefault("openpyxl", types.SimpleNamespace(load_workbook=None))
sys.path.insert(0, ".")
import excel_to_dashboard as gen
YK = ["yr_2025_26", "yr_2026_27", "yr_2027_28", "yr_2028_29", "yr_2029_30"]
ACTS = {"1": "Activity 1: Infrastructure", "3": "Activity 3: Scale CPL Access"}
PROJ = [("1.1", "Platform build", "1"), ("1.1.1", "Certification matching", "1"),
        ("3.1", "Students served", "3")]
def pair(aid, name, kind, vals):
    out = []
    for rt in ("GOAL", "STRETCH"):
        r = dict(zip(YK, vals)); r.update({"activity_id": aid, "name": name, "row_type": rt,
                  "kind": kind, "description": "", "current": None})
        out.append(r)
    return out
rows = []
for aid, nm in ACTS.items():
    rows += pair(aid, nm, "activity", [0] * 5)
for pid, nm, _ in PROJ:
    rows += pair(pid, nm, "project", [1, 2, 3, 4, 5])
projects = [{"id": p, "name": n, "activity": ACTS[h], "description": "", "kpi_metric": 0, "status": "On Track"}
            for p, n, h in PROJ]
assoc = [{"project_id": p, "activity_id": h, "is_primary": True} for p, _, h in PROJ]
_, _, ag = gen.build_workplan_goals_from_supabase(rows, assoc, projects)
acts = [{"id": k, "name": v} for k, v in ACTS.items()]
annual = gen.render_annual_goals_table_html(ag, acts, fy="2026-27")
cards = gen.render_activity_kpis_html(gen.build_activity_kpis(projects, acts), ag)
print(json.dumps({"annual": annual, "cards": cards}))
`;
const run = spawnSync("python3", ["-c", PY], { encoding: "utf8" });
let OUT = {};
try { OUT = JSON.parse((run.stdout || "").trim().split("\n").pop()); } catch (e) { /* reported below */ }
check("both renderers run (python3, openpyxl stubbed)", run.status === 0 && /wpg-annual/.test(OUT.annual || "") &&
  /activity-kpi-card/.test(OUT.cards || ""));
if (run.status !== 0) console.log(run.stderr);

const SRC = fs.readFileSync("card_actions.js", "utf8");

// The two tabs as the page has them: the Activities section folded, the Annual table beside it.
function makeDom(hash) {
  const dom = new JSDOM("<!doctype html><html><head></head><body>" +
    '<div class="cpl-tab-pane" id="tab-activities-projects" data-tab="activities-projects">' +
      '<div class="kpi-section-wrapper collapsed" id="workplanProjectsWrapper"><div class="workplan-projects-body">' +
      (OUT.cards || "") + "</div></div></div>" +
    '<div class="cpl-tab-pane" id="tab-workplan-goals" data-tab="workplan-goals">' + (OUT.annual || "") + "</div>" +
    "</body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" + (hash || "") });
  const w = dom.window;
  w._scrolled = [];
  w.Element.prototype.scrollIntoView = function (o) { w._scrolled.push({ el: this, opts: o }); };
  w.requestAnimationFrame = function (f) { return setTimeout(f, 0); };
  w.eval(SRC);
  return w;
}
function activate(w, tab) {
  w.dispatchEvent(new w.CustomEvent("cpl-tab-activated", { detail: { tab: tab } }));
}
const settle = () => new Promise((r) => setTimeout(r, 5));

(async function () {
  // ── (a) every link the Annual table prints names something the Activities tab prints ──
  const w0 = makeDom();
  const API = w0.CPL_CARD_ACTIONS;
  const links = Array.prototype.slice.call(w0.document.querySelectorAll("#tab-workplan-goals a.wpg-card-link"));
  check("(a) the Annual table prints a card link per sub-activity and one per Activity",
    links.filter((a) => /\/card-/.test(a.getAttribute("href"))).length === 3 &&
    links.filter((a) => /\/activity-/.test(a.getAttribute("href"))).length === 2);
  check("(a) each link parses as a card target", links.every((a) => !!API.cardTargetFromHash(a.getAttribute("href"))));
  check("(a) each sub-activity link names a card the Activities tab prints",
    links.filter((a) => /\/card-/.test(a.getAttribute("href"))).every((a) => {
      const t = API.cardTargetFromHash(a.getAttribute("href"));
      return !!w0.document.querySelector('#tab-activities-projects .activity-kpi-card[data-pid="' + t.id + '"]');
    }));
  check("(a) each Activity link names a group the Activities tab prints",
    links.filter((a) => /\/activity-/.test(a.getAttribute("href"))).every((a) => {
      const t = API.cardTargetFromHash(a.getAttribute("href"));
      return !!w0.document.querySelector('#tab-activities-projects .activity-group[data-activity-id="' + t.id + '"]');
    }));

  // ── (b) a card link lands on its card ──
  let w = makeDom("#activities-projects/card-1.1.1");
  activate(w, "activities-projects");
  await settle();
  let card = w.document.querySelector('.activity-kpi-card[data-pid="1.1.1"]');
  check("(b) the folded Activities section opens", !w.document.getElementById("workplanProjectsWrapper").classList.contains("collapsed"));
  check("(b) the card scrolls to the top of the view (a long card centered hid its own name)",
    w._scrolled.length === 1 && w._scrolled[0].el === card && w._scrolled[0].opts.block === "start");
  check("(b) the card takes focus without a second scroll", w.document.activeElement === card && card.getAttribute("tabindex") === "-1");
  check("(b) it lands clear of the sticky actions bar (a scroll margin is set)", /^\d+px$/.test(card.style.scrollMarginTop));
  check("(b) the card is marked for a moment", card.classList.contains("cpl-card-target") &&
    /\.activity-kpi-card\.cpl-card-target[^{]*\{[^}]*outline:3px solid var\(--focus-ring\)/.test(
      (w.document.getElementById("cpl-card-target-css") || {}).textContent || ""));
  await new Promise((r) => setTimeout(r, 2600));
  check("(b) ...and the mark leaves", !card.classList.contains("cpl-card-target"));

  // A filter hiding the card is cleared (dashboard_filters.js's resetFilters).
  w = makeDom("#activities-projects/card-3.1");
  card = w.document.querySelector('.activity-kpi-card[data-pid="3.1"]');
  card.style.display = "none";
  let reset = 0;
  w.resetFilters = function () { reset++; card.style.display = ""; };
  activate(w, "activities-projects");
  await settle();
  check("(b) a filter that hides the card is cleared, and the card is the one shown", reset === 1 && w._scrolled.length === 1 &&
    w._scrolled[0].el === card);

  // An Activity link lands on its group, at the top.
  w = makeDom("#activities-projects/activity-3");
  activate(w, "activities-projects");
  await settle();
  const group = w.document.querySelector('.activity-group[data-activity-id="3"]');
  check("(b) an Activity link lands on its group, at the top", w._scrolled.length === 1 && w._scrolled[0].el === group &&
    w._scrolled[0].opts.block === "start" && w.document.activeElement === group);

  // A page built before the group carried data-activity-id: its RACI link names it.
  w = makeDom("#activities-projects/activity-1");
  const g1 = w.document.querySelector('.activity-group[data-activity-id="1"]');
  g1.removeAttribute("data-activity-id");
  activate(w, "activities-projects");
  await settle();
  check("(b) an older page's group is found by its RACI link", w._scrolled.length === 1 && w._scrolled[0].el === g1);

  // ── (c) nothing else sets it off ──
  w = makeDom("#activities-projects");
  activate(w, "activities-projects");
  await settle();
  check("(c) the tab's own hash scrolls nothing", w._scrolled.length === 0 &&
    w.document.getElementById("workplanProjectsWrapper").classList.contains("collapsed"));
  w = makeDom("#activities-projects/card-9.9");
  activate(w, "activities-projects");
  await settle();
  check("(c) a card that does not exist scrolls nothing", w._scrolled.length === 0);
  w = makeDom("#activities-projects/card-1.1");
  activate(w, "workplan-goals");
  await settle();
  check("(c) another tab's activation scrolls nothing", w._scrolled.length === 0);

  let fail = 0;
  results.forEach(([n, ok]) => { console.log((ok ? "PASS  " : "FAIL  ") + n); if (!ok) fail++; });
  console.log("\n" + (results.length - fail) + "/" + results.length + " checks passed");
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  results.forEach(([n, ok]) => console.log((ok ? "PASS  " : "FAIL  ") + n));
  console.log("FAIL  the run stopped early: " + (e && e.message));
  process.exit(1);
});

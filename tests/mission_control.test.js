// Mission Control (mission_control.js) — the "Lift Off" program tracker — jsdom test.
//
// Guards:
//  (a) Rule 4 (both HTMLs identical) + the script is included in both;
//  (b) kb/liftoff_plan.json is valid and every decision option's activates/archives
//      ids resolve to a real node (a dangling branch ref = a silently broken fork);
//  (c) the BRANCH MODEL: a `needs` task under an undecided decision is 'pending';
//      choosing the activating option makes it 'active'; the other branch is 'archived';
//  (d) phaseStats counts only ACTIVE tasks, and an overlay status 'done' counts;
//  (e) buildSection renders phases/decisions/tasks; signed-OUT is read-only (no
//      <select>, no Choose buttons); signed-IN exposes them;
//  (f) XSS — a reviewer-entered email is escaped (textContent, no raw markup);
//  (g) failure mode — a task whose `needs` points at a missing decision does NOT
//      throw (resolves to 'pending'); and mount() with no data leaves no crash.
//
// Run from repo root: `npm test` (or `node tests/mission_control.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — static invariants ──
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
check("mission_control.js included in CPL_Dashboard.html", /<script src="mission_control\.js"><\/script>/.test(cpl));
check("mission_control.js included in index.html", /<script src="mission_control\.js"><\/script>/.test(idx));
check("schema-of-record file exists", fs.existsSync("mission/supabase_liftoff_state.sql"));
check("schema gates writes on is_allowed_reviewer()", /is_allowed_reviewer\(\)/.test(fs.readFileSync("mission/supabase_liftoff_state.sql", "utf8")));

const PLAN = JSON.parse(fs.readFileSync("kb/liftoff_plan.json", "utf8"));
(function validatePlanRefs() {
  const ids = new Set();
  PLAN.phases.forEach((p) => p.nodes.forEach((n) => ids.add(n.id)));
  let dangling = [];
  PLAN.phases.forEach((p) => p.nodes.forEach((n) => {
    if (n.type === "decision") (n.options || []).forEach((o) => {
      ["activates", "archives"].forEach((k) => (o[k] || []).forEach((t) => { if (!ids.has(t)) dangling.push(n.id + ":" + o.id + ":" + t); }));
    });
  }));
  check("every decision branch ref resolves to a node (no dangling)", dangling.length === 0);
  check("plan has the 3 phases + decision forks", PLAN.phases.length === 3 &&
    PLAN.phases.some((p) => p.nodes.some((n) => n.type === "decision")));
})();

(function forwardOnly() {
  const ids = [];
  PLAN.phases.forEach((p) => p.nodes.forEach((n) => ids.push(n.id)));
  check("plan is forward-only (no PII / breach nodes)", !ids.some((id) => /^pii|^breach|^d-breach$/.test(id)));
})();

const SRC = fs.readFileSync("mission_control.js", "utf8");

function makeDom(hash, fetchImpl) {
  const dom = new JSDOM(
    "<!doctype html><html><head></head><body>" +
      '<div id="tab-raci"><div class="main-container">' +
      '<div id="raci-root">Loading…</div></div></div>' +
      "</body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" + (hash || "") });
  const w = dom.window;
  w.fetch = fetchImpl || function () { return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve([]) }); };
  w.eval(SRC);
  return dom;
}

(async function () {
  // Pure-helper dom (no #raci hash → no auto-run / no fetch needed).
  const pdom = makeDom("");
  const API = pdom.window.CPL_MISSION_CONTROL;
  const doc = pdom.window.document;
  check("module exposes CPL_MISSION_CONTROL", !!API && typeof API.buildSection === "function" && typeof API.taskState === "function");

  // (c) the branch model — drive taskState with overlay choices.
  const ownerTask = API._findNode(PLAN, "owner-identity");        // needs: d-ownership, activated by both options
  const cccco = API._findNode(PLAN, "engage-cccco-cdt");          // needs: d-ownership, activated only by 'cccco'
  check("plan has the d-ownership fork wired", !!ownerTask && ownerTask.needs === "d-ownership" && !!cccco);

  let undecided = API.taskState(ownerTask, PLAN, {});
  check("undecided fork → branch task is 'pending'", undecided.state === "pending" && undecided.status === "pending_decision");

  const chooseRccd = { "d-ownership": { id: "d-ownership", chosen: "rccd" } };
  check("choose RCCD → owner-identity becomes 'active'", API.taskState(ownerTask, PLAN, chooseRccd).state === "active");
  check("choose RCCD → engage-cccco-cdt is 'archived' (other branch)", API.taskState(cccco, PLAN, chooseRccd).state === "archived");

  const chooseCccco = { "d-ownership": { id: "d-ownership", chosen: "cccco" } };
  check("choose CCCCO → engage-cccco-cdt becomes 'active'", API.taskState(cccco, PLAN, chooseCccco).state === "active");

  // (d) phaseStats — NOW phase has the done pii-purge; choosing a fork raises active count.
  const now = PLAN.phases[0];
  const base = API.phaseStats(now, PLAN, {});
  check("no tasks done by default (forward plan, no PII items)", base.done === 0);
  const withRccd = API.phaseStats(now, PLAN, chooseRccd);
  check("choosing a fork activates more tasks (active count rises)", withRccd.active > base.active);
  // overlay status 'done' on an active task counts toward done.
  const ovlDone = { "a11y-ci": { id: "a11y-ci", status: "done" } };
  check("an overlay 'done' status increments done", API.phaseStats(now, PLAN, ovlDone).done === base.done + 1);

  // (g) failure mode — a needs pointing at a missing decision must not throw.
  let threw = false, badState = null;
  try { badState = API.taskState({ id: "x", type: "task", title: "x", needs: "no-such-decision" }, PLAN, {}); } catch (e) { threw = true; }
  check("a dangling `needs` resolves to 'pending' (no throw)", !threw && badState && badState.state === "pending");

  // (e) buildSection — signed-OUT is read-only.
  const outSec = API.buildSection(doc, PLAN, {}, { signedIn: false });
  check("buildSection outer is a collapsible <details> with a summary", outSec.tagName === "DETAILS" && !!outSec.querySelector("summary.mc-sumhead"));
  check("the collapsible block is open by default", outSec.hasAttribute("open"));
  check("buildSection renders 3 phase <details>", outSec.querySelectorAll("details.mc-phase").length === 3);
  check("signed-out: no status <select>", outSec.querySelectorAll("select.mc-status-sel").length === 0);
  check("signed-out: no Choose buttons", outSec.querySelectorAll("button.mc-choose").length === 0);
  check("renders decision cards", outSec.querySelectorAll(".mc-decision").length >= 1);

  // signed-IN exposes editing affordances.
  const inSec = API.buildSection(doc, PLAN, {}, { signedIn: true, email: "map@rccd.edu", onStatus: function () {}, onChoose: function () {} });
  check("signed-in: status <select> present on active tasks", inSec.querySelectorAll("select.mc-status-sel").length > 0);
  check("signed-in: Choose buttons present on undecided decisions", inSec.querySelectorAll("button.mc-choose").length > 0);

  // a chosen decision shows the chosen option + flips its branch tasks visible/active.
  const decidedSec = API.buildSection(doc, PLAN, chooseRccd, { signedIn: true, email: "map@rccd.edu", onStatus: function () {}, onChoose: function () {} });
  check("a decided fork marks an option chosen", decidedSec.querySelectorAll(".mc-option-chosen").length >= 1);
  check("a decided fork archives the other branch (mc-state-archived present)", decidedSec.querySelectorAll(".mc-task.mc-state-archived").length >= 1);

  // (f) XSS — a reviewer-entered email must be escaped (textContent).
  const xssSec = API.buildSection(doc, PLAN, {}, { signedIn: true, email: "<img src=x onerror=alert(1)>" });
  check("reviewer email is escaped (no raw <img>, escaped &lt;img present)", xssSec.innerHTML.indexOf("<img") === -1 && xssSec.innerHTML.indexOf("&lt;img") !== -1);

  // (a/g) mount path — with mocked fetch, run() injects #mission-control-root above #raci-root, no throw.
  const mdom = makeDom("#raci", function (url) {
    if (/liftoff_plan\.json/.test(url)) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(PLAN) });
    if (/liftoff_state/.test(url)) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve([]) });
  });
  await new Promise((r) => setTimeout(r, 40));
  const mdoc = mdom.window.document;
  const host = mdoc.getElementById("mission-control-root");
  check("mount injects #mission-control-root BELOW #raci-root", !!host && host.previousElementSibling && host.previousElementSibling.id === "raci-root");
  check("mounted section renders the Mission Control header", !!host && /Mission Control/.test(host.textContent));
  check("mounted CSS injected once (#mc-css)", !!mdoc.getElementById("mc-css"));

  // ── report ──
  let failed = 0;
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); if (!r[1]) failed++; });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})();

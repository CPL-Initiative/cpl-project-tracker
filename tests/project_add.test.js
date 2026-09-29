// Add Project overlay (project_add.js) — jsdom test.
//
// Guards:
//  (a) Rule 4 (both HTMLs identical) + the script is included in both;
//  (b) suggestId picks the next free N.x under the chosen Activity, numerically
//      (3.9 → 3.10, not lexical 3.1x; falsy/invalid Activity → "");
//  (c) the "+ Add project" button mounts next to #projectCount AND in the AWG
//      #awgProjectsAddSlot — and mounting is idempotent (no duplicates);
//  (d) signed out → the modal offers the team-phrase unlock, no form fields;
//  (e) with a team phrase → the form renders, the ID prefills from the LIVE
//      id list (includes tabled rows CPL_DATA lacks), and Save POSTs to
//      /rest/v1/projects with the x-team-pass header + the typed fields
//      (empty optionals land as null, percent_complete 0);
//  (f) a duplicate ID is rejected client-side before any write;
//  (g) the optimistic card ESCAPES user text (no XSS) and carries data-pid;
//  (h) clicks INSIDE the modal don't dismiss it; a true backdrop click does
//      (the Session-95 project_lifecycle.js lesson, applied from birth here).
//
// Run from repo root: `npm test` (or `node tests/project_add.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — static invariants ──
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
check("project_add.js included in CPL_Dashboard.html", /<script src="project_add\.js"><\/script>/.test(cpl));
check("project_add.js included in index.html", /<script src="project_add\.js"><\/script>/.test(idx));

const SRC = fs.readFileSync("project_add.js", "utf8");

// ── Part B — behavior in jsdom ──
function makeDom(opts) {
  opts = opts || {};
  const dom = new JSDOM(
    "<!doctype html><html><head></head><body>" +
      '<h2>Projects <span id="projectCount">(11)</span></h2>' +
      '<div id="projectsGrid"><div class="projects-grid goal-project-group"></div></div>' +
      '<div id="awgProjectsSection"><h2>Projects <span id="awgProjectsAddSlot"></span></h2></div>' +
      "</body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
  dom._writes = [];
  w.CPL_DATA = { projects: [
    { id: "3.6", activity: "Activity 3: Scale CPL Access, Awards, and Procedures" },
    { id: "4.1.1", activity: "Activity 4: Sprints, Projects & Partnerships" },
  ] };
  w.fetch = function (url, fopts) {
    fopts = fopts || {};
    if (/rest\/v1\/projects\?select=id/.test(url)) {
      // live id list INCLUDES a tabled 3.9 + up through 3.10 (CPL_DATA lacks them)
      return Promise.resolve({ ok: true, status: 200, json: function () {
        return Promise.resolve([{ id: "3.1" }, { id: "3.6" }, { id: "3.9" }, { id: "3.10" }, { id: "4.1.1" }]); } });
    }
    if (/rpc\/team_pass_ok/.test(url)) {
      return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(true); } });
    }
    dom._writes.push({ url: url, opts: fopts });
    return Promise.resolve({ ok: true, status: 201,
      text: function () { return Promise.resolve(""); }, json: function () { return Promise.resolve([{}]); } });
  };
  if (opts.teamPass) w.localStorage.setItem("cpl_team_pass", opts.teamPass);
  w.eval(SRC);
  return dom;
}

(async function () {
  // (b) suggestId
  const probe = makeDom({});
  const API = probe.window.CPL_PROJECT_ADD;
  check("module exposes CPL_PROJECT_ADD", !!API && typeof API.openModal === "function");
  check("suggestId: max 3.6 under Activity 3 → 3.7", API.suggestId(["3.1", "3.6", "4.1"], "3") === "3.7");
  check("suggestId: numeric, 3.10 → 3.11 (not lexical)", API.suggestId(["3.9", "3.10"], "3") === "3.11");
  check("suggestId: empty list under Activity 4 → 4.1", API.suggestId([], "4") === "4.1");
  check("suggestId: no activity → no suggestion", API.suggestId(["3.1"], "") === "");

  // (c) mounts in both slots, idempotent
  API.mountButtons();
  const d0 = probe.window.document;
  check("button next to #projectCount", !!d0.querySelector("#projectCount ~ .padd-btn") ||
    !!(d0.getElementById("projectCount").parentNode.querySelector(".padd-btn")));
  check("button in #awgProjectsAddSlot", !!d0.querySelector("#awgProjectsAddSlot .padd-btn"));
  check("mount is idempotent", d0.querySelectorAll(".padd-btn").length === 2);

  // (d) signed out → unlock, no form
  API.openModal();
  check("signed out: unlock input shown", !!d0.querySelector('.padd-modal input[type="password"]'));
  check("signed out: no form fields", !d0.querySelector(".padd-field"));

  // (e) team phrase → form + POST
  const dom2 = makeDom({ teamPass: "cpl-team-2026" });
  const w2 = dom2.window, d2 = w2.document;
  w2.CPL_PROJECT_ADD.openModal();
  await new Promise((r) => setTimeout(r, 20));  // let the id fetch resolve
  const fields = d2.querySelectorAll(".padd-field");
  check("authed: form fields render", fields.length >= 7);
  const idInput = d2.querySelector(".padd-field input");
  // No Activity chosen yet → no suggestion (the N.x contract needs an Activity).
  check("ID is empty until an Activity is picked", idInput && idInput.value === "");
  // Pick Activity 3 → the id auto-suggests the next free 3.x from the LIVE list
  // (3.10 is the max direct child; the tabled 3.9 is counted) → 3.11.
  const actSelect = d2.querySelectorAll(".padd-field select")[0];
  actSelect.value = "Activity 3: Scale CPL Access, Awards, and Procedures";
  actSelect.dispatchEvent(new w2.Event("change"));
  check("ID auto-suggests 3.11 under Activity 3 (numeric max; tabled 3.9 counted)", idInput.value === "3.11");

  // (h) inner click doesn't dismiss; fill + save
  idInput.click();
  check("clicking inside the modal keeps it open", !!d2.querySelector(".padd-modal-overlay"));
  const nameInput = d2.querySelectorAll(".padd-field input")[1];
  nameInput.value = 'New Pilot <img src=x onerror=alert(1)>';
  d2.querySelector(".padd-save").click();
  await new Promise((r) => setTimeout(r, 20));
  const post = dom2._writes.find(function (x) { return /rest\/v1\/projects$/.test(x.url) && x.opts.method === "POST"; });
  check("Save POSTs to /rest/v1/projects", !!post);
  const body = post ? JSON.parse(post.opts.body) : {};
  check("POST carries the id + name", body.id === "3.11" && /^New Pilot/.test(body.name));
  check("POST sends x-team-pass header", post && post.opts.headers["x-team-pass"] === "cpl-team-2026");
  check("empty optionals land as null", body.description === null && body.lead === null && body.start_date === null);
  check("percent_complete starts at 0", body.percent_complete === 0);

  // (g) optimistic card, escaped
  const newCard = d2.querySelector('.project-card.padd-new[data-pid="3.11"]');
  check("optimistic card added with data-pid", !!newCard);
  check("optimistic card escapes the name (no raw <img>)",
    newCard && newCard.innerHTML.indexOf("<img") === -1 && newCard.innerHTML.indexOf("&lt;img") !== -1);

  // (f) duplicate id rejected client-side
  w2.CPL_PROJECT_ADD.openModal();
  await new Promise((r) => setTimeout(r, 20));
  const idIn2 = d2.querySelector(".padd-field input");
  idIn2.value = "3.9";  // exists in the live list
  d2.querySelectorAll(".padd-field input")[1].value = "Dup";
  const writesBefore = dom2._writes.length;
  d2.querySelector(".padd-save").click();
  await new Promise((r) => setTimeout(r, 20));
  check("duplicate ID blocked before any write",
    dom2._writes.length === writesBefore && /already exists/.test(d2.querySelector(".padd-status").textContent));

  // (h2) backdrop click closes
  const backdrop = d2.querySelector(".padd-modal-overlay");
  backdrop.click();
  check("true backdrop click closes the modal", !d2.querySelector(".padd-modal-overlay"));

  // ── report ──
  let failed = 0;
  results.forEach(function (r) {
    console.log((r[1] ? "PASS " : "FAIL ") + r[0]);
    if (!r[1]) failed++;
  });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
})();

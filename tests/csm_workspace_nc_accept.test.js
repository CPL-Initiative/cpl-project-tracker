// tests/csm_workspace_nc_accept.test.js
//
// THE ROLE THE REVIEWER CONFIRMED, ON A NONCREDIT ATTESTATION. Sam, 2026-11-10: "I meant for the reviewer to add".
// #3014 put the field on the Sent by a senior administrator check and wrote it into the acceptance's csm_log entry.
// Its tests ran a participation Accept and pinned the noncredit path by reading the source. COBIx on #3014 asked
// for one assertion that a noncredit Accept carries the role too. This runs one, with its own fixture: a credit
// college whose attestation waits, sent under the title Other.
//
// Guards the failure mode: the field drawing on the noncredit review while its Accept logs without the role, or
// the two kinds sharing one typed role.
//
// Run from repo root: `npm test` (or `node tests/csm_workspace_nc_accept.test.js`).
const fs = require("fs");
const path = require("path");
const H = require("./lib/cpl_funding_harness.js");
const { check, freshDom, boot, finish } = H;

const ROOT = path.join(__dirname, "..");
const SRC = fs.readFileSync(path.join(ROOT, "csm_workspace.js"), "utf8");
const COLLEGE = "Pasadena";

// Scenario 4's lane: a credit college's award carries a noncredit share, so its attestation is shown.
const OUTCOMES = { ncLane: "outcomes", ncOutcomes: { "1": [
  { key: "exh", title: "Exhibits built or adopted", share: 0.5, goals: ["A"], unit_word: "exhibits", metric: "Exhibits", metric_src: "nc_exh",
    target_rule: { kind: "pct_floor_cap", of: "nc_cdcp", pct: 0.05, floor: 2, cap: 10 } },
  { key: "course", title: "A noncredit CPL course", share: 0.5, goals: ["A"], unit_word: "courses", metric: "A course", metric_src: "nc_course",
    target_rule: { kind: "fixed", n: 1 } }] } };

const flat = (el) => (el ? el.textContent : "").replace(/\s+/g, " ").trim();
const clickEl = (window, el) => el && el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
const tick = () => new Promise((r) => setTimeout(r, 0));

(async function () {
  const { window } = freshDom();
  window.CPL_SESSION = Object.assign(window.CPL_SESSION || {}, {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; }
  });
  // No observer in jsdom: the module's fallback would open the gate at once, so stand one in that has seen nothing.
  window.IntersectionObserver = function () { this.observe = function () {}; this.disconnect = function () {}; };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared(OUTCOMES);
  T._setElig({ coordOk: true, coord: { [COLLEGE]: true },
    optin: { [COLLEGE]: true },
    optinRow: { [COLLEGE]: { college: COLLEGE, status: "confirmed", requested_at: "2026-10-30T04:00:00Z" } },
    ncAttestOk: true,
    ncAttest: { [COLLEGE]: { college: COLLEGE, status: "self_attested", fiscal_year: "2026-27", requested_at: "2026-11-04T04:00:00Z" } },
    ncAttestReview: [{ key: COLLEGE, college: COLLEGE, fiscal_year: "2026-27", status: "self_attested",
      attestor_name: "Ivy Cho", attestor_title: "Other", attestor_email: "ivy@pasadena.edu",
      lead_name: "Sol Ortiz", lead_title: "Noncredit CPL Lead", lead_assignment: "20% reassigned time", lead_meets: "Monthly",
      requested_at: "2026-11-04T04:00:00Z" }] });
  T.render();
  const pane = doc.createElement("div");
  pane.id = "tab-csm-workspace";
  pane.innerHTML = '<div id="csm-workspace-root"></div>';
  doc.body.appendChild(pane);
  window.eval(fs.readFileSync(path.join(ROOT, "college_short_names.js"), "utf8"));
  window.eval(SRC);
  const W = window.CPL_CSM_WORKSPACE;
  W.boot();
  const root = doc.getElementById("csm-workspace-root");

  const row = T.csm.snapshot().rows.find((r) => r.key === COLLEGE);
  check("1: fixture: the attestation waits for review, and its sender gave the title Other",
    !!row && !!row.nc && row.nc.waiting === true && !!row.req && !!row.req.nc && row.req.nc.attestor_title === "Other",
    JSON.stringify(row && { nc: row.nc, req: row.req && row.req.nc }).slice(0, 300));

  W._state.sel = COLLEGE; W._state.seen[COLLEGE + "|nc"] = true; W.paint();
  const role = () => root.querySelector('.review input[data-role="nc"]');
  check("2: the noncredit review's senior administrator check carries the role field",
    !!role() && /Their role, as you confirmed it/.test(flat(role().closest("label"))) &&
    /Sent by a senior administrator/.test(flat(role().closest(".req"))) && !!role().closest(".req").querySelector('input[data-check][data-kind="nc"]'));
  check("3: the participation review, already confirmed, draws no role field of its own", !root.querySelector('.review input[data-role="part"]'));

  role().value = "Dean of Continuing Education"; role().dispatchEvent(new window.Event("input", { bubbles: true }));
  Array.from(root.querySelectorAll('.review input[data-check][data-kind="nc"]')).forEach((b) => {
    b.checked = true; b.dispatchEvent(new window.Event("change", { bubbles: true }));
  });
  check("4: the role survives the repaint a tick causes", !!role() && role().value === "Dean of Continuing Education");
  check("5: the role is kept under the noncredit key alone", W._state.roles[COLLEGE + "|nc"] === "Dean of Continuing Education" &&
    W._state.roles[COLLEGE + "|part"] === undefined);

  const accept = root.querySelector('[data-verdict="nc"] [data-act="accept"]');
  check("6: every check ticked opens Accept", !!accept && !accept.disabled, flat(root.querySelector('[data-verdict="nc"]')).slice(0, 200));

  const before = W._log().length, acted = [];
  T.csm.act = function (action, kind, key) { acted.push([action, kind, key].join("|")); return Promise.resolve({ ok: true }); };
  clickEl(window, accept);
  await tick(); await tick();
  const entry = W._log().find((x) => x.college === COLLEGE && /^Accepted the noncredit attestation/.test(String(x.body || ""))) || {};
  check("7: Accept went to the funding tab as the noncredit decision", acted.join() === "accept|nc|" + COLLEGE, acted.join());
  check("8: ⭐ the noncredit Accept logs once, and the entry says the sender's role as checked",
    W._log().length === before + 1 && /Sender's role, as checked: Dean of Continuing Education\.$/.test(String(entry.body || "")),
    JSON.stringify(W._log()[0] || {}).slice(0, 240));

  finish("csm_workspace_nc_accept.test.js");
})();

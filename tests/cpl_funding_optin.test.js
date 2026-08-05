// tests/cpl_funding_optin.test.js
//
// Self-service administrator opt-in (SkyOptIn, 2026-08-05).
// A college's VPAA / VP of Student Services / President opts the institution in
// from its own row — on the PUBLIC page as well as the private tab. Sam's ruling
// was ATTEST-FIRST: the request satisfies the participation gate the moment it is
// submitted; the Chancellor's Office confirms or revokes in a reviewer-only lane.
// The attestor's name/email are PII and must never reach the public page.
//
// Own file (not tests/cpl_funding.test.js) — that file is already heap-heavy with
// ~30 JSDOM instances. Run from repo root: `npm test`
// (or `node tests/cpl_funding_optin.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const dataSrc = fs.readFileSync("cpl_funding_data.js", "utf8");
const consumerSrc = fs.readFileSync("cpl_funding.js", "utf8");
const D = (function () {
  var sandbox = { window: {} };
  new Function("window", dataSrc).call(sandbox, sandbox.window);
  return sandbox.window.CPL_FUNDING;
})();
const COL = D.colleges[0].college;   // a real roster college name

function freshDom() {
  const dom = new JSDOM(
    '<!DOCTYPE html><html><head></head><body>' +
    '<div class="cpl-tab-pane" id="tab-implementation-funding"><div class="main-container">' +
    '<div id="cplFundingMount">placeholder</div>' +
    "</div></div></body></html>",
    { runScripts: "outside-only", url: "https://example.org/" });
  dom.window.scrollTo = function () {};
  dom.window.CPL_FUNDING_NO_REMOTE = true;
  return dom;
}
function boot(window) {
  window.eval(dataSrc);
  window.eval(consumerSrc);
  window.CPL_FUNDING_TAB.boot();
  return window.document;
}
function click(window, el) { el.dispatchEvent(new window.MouseEvent("click", { bubbles: true })); }
// A reviewer session: unlocked() === !!(tp() && tp().session()).
function teamPhrase() {
  return {
    session: function () { return { user: "co@cccco.edu" }; },
    decorateHeaders: function () {},
    checkWrite: function (r) { return { ok: !!(r && r.ok), status: r ? r.status : 200 }; },
    handleWriteFailure: function () {}
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Part A — the PUBLIC page: the opt-in button is present and survives the public
// curate-affordance sweep; the CO lane and the attestor PII never render.
// ─────────────────────────────────────────────────────────────────────────────
{
  const pub = freshDom();
  pub.window.CPL_FUNDING_PUBLIC = true;
  const doc = boot(pub.window);
  const B = pub.window.CPL_FUNDING_TAB;
  // Deliberately hand the client PII in optinReview — the live RPC returns [] for
  // anon, but this proves the RENDER gate (not just the RPC) withholds it.
  B._setElig({ coordOk: true, coord: {}, optinRow: {}, optinReview: [
    { college: COL, name: "Jane Admin", title: "VPAA", email: "jane@college.edu",
      status: "self_attested", requested_at: "2026-08-05" }
  ] });
  B.render();

  const mountHtml0 = doc.getElementById("cplFundingMount").innerHTML;
  check("A0: public page does NOT render the CO review lane (reviewer-gated)",
    !/cplfund-colane/.test(mountHtml0));
  check("A0: public page leaks NO attestor PII even when handed some",
    !/Jane Admin/.test(mountHtml0) && !/jane@college\.edu/.test(mountHtml0));

  click(pub.window, doc.querySelector("#cplFundTable tr.cplfund-row"));   // expand a row
  const t1 = doc.getElementById("cplFundTable").innerHTML;
  check("A1: a public college row offers the self-service opt-in button",
    /data-optinbtn=/.test(t1));

  click(pub.window, doc.querySelector("[data-optinbtn]"));                // open the form
  const t2 = doc.getElementById("cplFundTable").innerHTML;
  check("A2: the opt-in form (name/title/email + submit) survives stripCurateAffordances in public mode",
    /data-optinfield="name"/.test(t2) && /data-optinfield="title"/.test(t2) &&
    /data-optinfield="email"/.test(t2) && /data-optinsubmit=/.test(t2));
}

// ─────────────────────────────────────────────────────────────────────────────
// Part B — the private, UNLOCKED reviewer view renders the CO confirm lane with
// the attestor identity and Confirm / Reject actions.
// ─────────────────────────────────────────────────────────────────────────────
{
  const priv = freshDom();
  priv.window.CPL_TEAM_PHRASE = teamPhrase();
  const doc = boot(priv.window);
  const P = priv.window.CPL_FUNDING_TAB;
  P._setElig({ coordOk: true, coord: {}, optinRow: {}, optinReview: [
    { college: COL, name: "Jane Admin", title: "VPAA", email: "jane@college.edu",
      status: "self_attested", requested_at: "2026-08-05" }
  ] });
  P.render();
  const html = doc.getElementById("cplFundingMount").innerHTML;
  check("B1: the CO review lane renders for a reviewer", /cplfund-colane/.test(html));
  check("B2: the lane shows the attestor identity (reviewer-only PII)",
    /Jane Admin/.test(html) && /jane@college\.edu/.test(html));
  check("B3: the lane offers Confirm and Reject",
    /data-optinconfirm=/.test(html) && /data-optinrevoke=/.test(html));
}

// ─────────────────────────────────────────────────────────────────────────────
// Part C — ATTEST-FIRST gate semantics (the load-bearing policy decision).
// ─────────────────────────────────────────────────────────────────────────────
{
  const dom = freshDom();
  boot(dom.window);
  const T = dom.window.CPL_FUNDING_TAB;
  const coord = {}; coord[COL] = true;   // coordinator satisfied, so only opt-in is in question

  T._setElig({ coordOk: true, coord: coord, optinRow: {} });
  check("C1: with no opt-in, the participation gate withholds earned funding",
    T._gate(COL).blocked === true);

  const selfRow = {}; selfRow[COL] = { college: COL, status: "self_attested" };
  T._setElig({ coordOk: true, coord: coord, optinRow: selfRow });
  check("C2: a SELF-ATTESTED opt-in clears the gate on submit (attest-first, no CO step)",
    T._gate(COL).blocked === false && T._optinActive(COL) === true);

  const confRow = {}; confRow[COL] = { college: COL, status: "confirmed" };
  T._setElig({ coordOk: true, coord: coord, optinRow: confRow });
  check("C3: a CO-confirmed opt-in also clears the gate", T._gate(COL).blocked === false);

  const revRow = {}; revRow[COL] = { college: COL, status: "revoked" };
  T._setElig({ coordOk: true, coord: coord, optinRow: revRow });
  check("C4: a REVOKED opt-in drops back out of the gate", T._gate(COL).blocked === true &&
    T._optinActive(COL) === false);

  T._setElig({ coordOk: false, coord: {}, optinRow: {} });
  check("C5: the gate is FAIL-OPEN while the coordinator feed is still loading",
    T._gate(COL).pending === true && T._gate(COL).blocked === false);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part D — the local submit → revoke flow drives the gate end-to-end.
// ─────────────────────────────────────────────────────────────────────────────
{
  const dom = freshDom();
  boot(dom.window);
  const T = dom.window.CPL_FUNDING_TAB;
  const coord = {}; coord[COL] = true;
  T._setElig({ coordOk: true, coord: coord, optinRow: {} });
  check("D1: gate blocked before opt-in", T._gate(COL).blocked === true);

  T._submitOptin(COL, { name: "Jane Admin", title: "VPAA", email: "jane@college.edu" });
  check("D2: after a self-submit the gate clears immediately (attest-first)",
    T._gate(COL).blocked === false && T._optinActive(COL) === true);

  T._revokeOptin(COL);
  check("D3: after a CO revoke the gate re-blocks and the opt-in goes inactive",
    T._gate(COL).blocked === true && T._optinActive(COL) === false);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part E — the form validates before writing: a bad email records nothing, a
// valid submission records the opt-in and clears the gate. Exercises the real
// DOM wiring (open → fill → submit).
// ─────────────────────────────────────────────────────────────────────────────
{
  const dom = freshDom();
  const doc = boot(dom.window);
  const T = dom.window.CPL_FUNDING_TAB;
  T._setElig({ coordOk: true, coord: {}, optinRow: {} });
  T.render();

  click(dom.window, doc.querySelector("#cplFundTable tr.cplfund-row"));   // expand
  const btn = doc.querySelector("[data-optinbtn]");
  const rowCollege = btn.getAttribute("data-optinbtn");
  click(dom.window, btn);                                                 // open the form

  const wrap = doc.querySelector("[data-optinwrap]");
  wrap.querySelector('[data-optinfield="name"]').value = "Jane Admin";
  wrap.querySelector('[data-optinfield="title"]').value = "VPAA";
  wrap.querySelector('[data-optinfield="email"]').value = "not-an-email";
  click(dom.window, doc.querySelector("[data-optinsubmit]"));
  check("E1: an invalid email is rejected client-side — no opt-in recorded",
    T._optinActive(rowCollege) === false);
  check("E1b: an inline validation error is shown",
    /valid college email/i.test(doc.querySelector("[data-optinerr]").textContent || ""));

  wrap.querySelector('[data-optinfield="email"]').value = "jane@college.edu";
  click(dom.window, doc.querySelector("[data-optinsubmit]"));
  check("E2: a valid submission records the opt-in and clears the gate",
    T._optinActive(rowCollege) === true);
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);

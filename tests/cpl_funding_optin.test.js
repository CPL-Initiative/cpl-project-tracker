// tests/cpl_funding_optin.test.js
//
// Self-service administrator opt-in (SkyOptIn, 2026-08-05).
// A college's VPAA / VP of Student Services / President opts the institution in
// from its own row — on the PUBLIC page as well as the private tab. Since Sam's
// 2026-10-27 ruling (replacing 2026-08-05's attest-first) the request WAITS for a
// MAP team reviewer: it meets the condition once a signed-in reviewer accepts it,
// which opens the confirmation email; Deny removes it.
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
// EMAIL FIRST (Sam, 2026-10-28): the form opens on the address; Continue checks
// its domain and opens the rest. Returns the row's form after the check.
function passEmail(window, doc, college, email) {
  const wrapOf = () => Array.from(doc.querySelectorAll("[data-optinwrap]")).find((w) => w.getAttribute("data-optinwrap") === college);
  wrapOf().querySelector('[data-optinfield="email"]').value = email;
  click(window, wrapOf().querySelector("[data-optinemailgo]"));
  return wrapOf();
}
// A reviewer session: unlocked() === !!(tp() && tp().session()).
// ⚠️ THE CREDENTIAL CHANGED, THE INTENT DID NOT (2026-08-28). These blocks have
// always meant "the private, UNLOCKED reviewer view" — the team phrase was just
// what unlocked it at the time. Curating funding now requires a magic-link
// reviewer (RLS narrowed to is_allowed_reviewer() alone), so the fixture supplies
// what unlocked() actually reads. Swapping this back to a phrase turns all seven
// of these red, which is the point.
function reviewerSession() {
  return {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function (extra) {
      var h = { apikey: "anon", Authorization: "Bearer header.payload.sig" };
      if (extra) for (var k in extra) h[k] = extra[k];
      return h;
    }
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

  // The row carries the one Confirm Participation button (Sam, 2026-09-23,
  // funding review item 3: the drill-in's second copy is gone).
  const t1 = doc.getElementById("cplFundTable").innerHTML;
  check("A1: a public college row offers the self-service opt-in button",
    /data-optinjump=/.test(t1) && !/data-optinbtn=/.test(t1));

  const jumpCollege = doc.querySelector("[data-optinjump]").getAttribute("data-optinjump");
  click(pub.window, doc.querySelector("[data-optinjump]"));               // open the form
  const t2 = doc.getElementById("cplFundTable").innerHTML;
  check("A2: the opt-in form opens on the email alone, with Continue and the support address, in public mode",
    /data-optinfield="email"/.test(t2) && /data-optinemailgo=/.test(t2) && /mailto:map@rccd\.edu/.test(t2) &&
    !/data-optinfield="name"/.test(t2) && !/data-optinsubmit=/.test(t2));
  passEmail(pub.window, doc, jumpCollege, "jane@college.edu");
  const t3 = doc.getElementById("cplFundTable").innerHTML;
  check("A2b: an allowed address opens name, title and submit, which survive stripCurateAffordances in public mode",
    /data-optinfield="name"/.test(t3) && /data-optinfield="title"/.test(t3) && /data-optinsubmit=/.test(t3));
}

// ─────────────────────────────────────────────────────────────────────────────
// Part B — the private, UNLOCKED reviewer view renders the CO review lane with
// the attestor identity and the Reject action (Confirm retired 2026-09-28).
// ─────────────────────────────────────────────────────────────────────────────
{
  const priv = freshDom();
  priv.window.CPL_SESSION = reviewerSession();
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
  // Sam, 2026-09-28: a self-attestation stands (attest-first), so the CO acts
  // only to reject one; the CO Confirm is gone.
  check("B3: the lane offers Accept and Deny on a waiting request (Sam, 2026-10-27)",
    /data-optinaccept=/.test(html) && /data-optindeny=/.test(html) && /Awaiting review \(1\)/.test(html));
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
  check("C2: a SELF-ATTESTED request waits for a MAP team reviewer: the gate stays closed (Sam, 2026-10-27)",
    T._gate(COL).blocked === true && T._optinActive(COL) === false && T._optinPending(COL) === true);

  const confRow = {}; confRow[COL] = { college: COL, status: "confirmed" };
  T._setElig({ coordOk: true, coord: coord, optinRow: confRow });
  check("C3: an accepted (confirmed) request clears the gate", T._gate(COL).blocked === false && T._optinActive(COL) === true);

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
  check("D2: after a self-submit the gate stays closed and the request waits",
    T._gate(COL).blocked === true && T._optinActive(COL) === false && T._optinPending(COL) === true);

  T._acceptOptin(COL);
  check("D2b: a reviewer's Accept clears the gate", T._gate(COL).blocked === false && T._optinActive(COL) === true);

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

  const btn = doc.querySelector("[data-optinjump]");
  const rowCollege = btn.getAttribute("data-optinjump");
  click(dom.window, btn);                                                 // expand + open the form

  let wrap = passEmail(dom.window, doc, rowCollege, "not-an-email");
  check("E1: an invalid email is rejected client-side — no opt-in recorded, and the form stays on the address",
    T._optinActive(rowCollege) === false && T._optinPending(rowCollege) === false &&
    !wrap.querySelector('[data-optinfield="name"]'));
  check("E1b: an inline validation error is shown",
    /valid college email/i.test(doc.querySelector("[data-optinerr]").textContent || ""));

  wrap = passEmail(dom.window, doc, rowCollege, "jane@college.edu");
  wrap.querySelector('[data-optinfield="name"]').value = "Jane Admin";
  wrap.querySelector('[data-optinfield="title"]').value = "VPAA";
  click(dom.window, doc.querySelector("[data-optinsubmit]"));
  check("E2: a valid submission records a waiting request and leaves the gate closed",
    T._optinActive(rowCollege) === false && T._optinPending(rowCollege) === true);
  check("E2b: the thank-you says CPL Initiative staff review it and confirm to the address given",
    /CPL Initiative staff will review the request and send a confirmation to jane@college\.edu\. Once they approve it, the confirmation shows as complete on this dashboard\./.test(
      doc.getElementById("cplFundTable").textContent));
}

// ─────────────────────────────────────────────────────────────────────────────
// Part F — row-level ergonomics (Sam, 2026-08-05): a one-click "Opt in" chip on
// the collapsed row that opens the form focused, and the CO confirm/reject shown
// INLINE in the reviewer's row drill-in (where he looked), not only the aggregate
// Baseline-section lane.
// ─────────────────────────────────────────────────────────────────────────────
{
  // F1 — a not-opted-in row offers the one-click chip; it opens THAT row's form.
  const dom = freshDom();
  const doc = boot(dom.window);
  const T = dom.window.CPL_FUNDING_TAB;
  T._setElig({ coordOk: true, coord: {}, optinRow: {} });
  T.render();
  const chip = doc.querySelector("[data-optinjump]");
  check("F1: a not-opted-in row offers the one-click Opt-in chip", !!chip);
  const chipCollege = chip ? chip.getAttribute("data-optinjump") : null;
  if (chip) click(dom.window, chip);
  const t1 = doc.getElementById("cplFundTable").innerHTML;
  const wrap = doc.querySelector('[data-optinwrap="' + (chipCollege || "") + '"]');
  // Was KNOWN-RED for a real product bug (found by this port, 2026-08-31):
  // the chip's handler set state.open["c:" + c.order] while rows key their
  // open state by "c:" + c.college — the drill-in never opened, so Sam's
  // one-click "✎ Confirm" (2026-08-05) was a dead click. Fixed same day
  // (handler re-keyed by name); this check is the regression guard.
  check("F1b: clicking the chip opens that row's attestation form, on its email field",
    !!wrap && !!wrap.querySelector('[data-optinfield="email"]'));

  // F2 — the chip disappears once the college has opted in.
  const selfRow2 = {}; selfRow2[COL] = { college: COL, status: "self_attested", source: "self" };
  T._setElig({ coordOk: true, coord: {}, optinRow: selfRow2 });
  T.render();
  const stillThere = Array.from(doc.querySelectorAll("[data-optinjump]"))
    .map(function (b) { return b.getAttribute("data-optinjump"); });
  check("F2: the Opt-in chip is hidden once the college's request is waiting", stillThere.indexOf(COL) === -1);
  check("F2b: other (not-opted-in) colleges still show the chip", stillThere.length > 0);
}
{
  // F3/F4 — a reviewer sees Reject INLINE in the row drill-in, with the
  // attestor identity; and clicking inline Reject actually withdraws it — proving
  // the holder-scoped binding survives the expand's refreshTable (a dead button
  // here was the real risk of moving the action onto the row). The CO Confirm
  // left both surfaces on 2026-09-28 (Sam's mockup).
  // Rows key by NAME since one-pool adoption (data-id "c:<college>", 2026-08-31).
  const priv = freshDom();
  priv.window.CPL_SESSION = reviewerSession();
  const doc = boot(priv.window);
  const P = priv.window.CPL_FUNDING_TAB;
  const selfRow = {}; selfRow[COL] = { college: COL, status: "self_attested", source: "self" };
  P._setElig({ coordOk: true, coord: {}, optinRow: selfRow, optinReview: [
    { college: COL, name: "Jane Admin", title: "VPAA", email: "jane@college.edu",
      status: "self_attested", requested_at: "2026-08-05" }
  ] });
  P.render();
  const row = doc.querySelector('#cplFundTable tr.cplfund-row[data-id="c:' + COL + '"]');
  click(priv.window, row);   // expand COL's drill-in (it's opted in → no chip)
  const t = doc.getElementById("cplFundTable").innerHTML;
  check("F3: the row drill-in shows the CO confirm block inline (where Sam looked)",
    /cplfund-corow/.test(t));
  check("F3b: the inline block offers Accept and Deny on a waiting request, with the requester's identity",
    /data-optinaccept=/.test(t) && /data-optindeny=/.test(t) && !/data-optinrevoke=/.test(t) &&
    /Jane Admin/.test(t) && /jane@college\.edu/.test(t));

  const mails = [];
  priv.window.CPL_FUNDING_OPEN_MAIL = function (href) { mails.push(href); };
  const acceptBtn = doc.querySelector("#cplFundTable [data-optinaccept]");
  check("F4: the inline Accept button is present in the drill-in", !!acceptBtn && acceptBtn.textContent === "Accept");
  if (acceptBtn) click(priv.window, acceptBtn);
  const t2 = doc.getElementById("cplFundTable").textContent;
  check("F4b: clicking inline Accept confirms the request (holder-scoped binding survives refreshTable)",
    P._optinActive(COL) === true && /Confirmation on file/.test(t2));
  const m = mails[0] || "";
  // To the requester alone: this module never reads a coordinator's address
  // (tests/cpl_funding_equity.test.js's PII guard).
  check("F4c: …and opens the confirmation email to the requester alone, with the reply line",
    mails.length === 1 && m.indexOf("mailto:jane%40college.edu?") === 0 && !/cc=/.test(m) &&
    decodeURIComponent(m).indexOf("If you did not send this request, please reply to this email.") >= 0);
  const revokeBtn = doc.querySelector("#cplFundTable [data-optinrevoke]");
  check("F4d: a confirmed request offers Revoke", !!revokeBtn && revokeBtn.textContent === "Revoke");
}
{
  // F4e — Deny removes a waiting request, so the college may send another.
  const priv = freshDom();
  priv.window.CPL_SESSION = reviewerSession();
  const doc = boot(priv.window);
  const P = priv.window.CPL_FUNDING_TAB;
  const selfRow = {}; selfRow[COL] = { college: COL, status: "self_attested", source: "self" };
  P._setElig({ coordOk: true, coord: {}, optinRow: selfRow, optinReview: [
    { college: COL, name: "Jane Admin", title: "VPAA", email: "jane@college.edu",
      status: "self_attested", requested_at: "2026-08-05" }
  ] });
  P.render();
  click(priv.window, doc.querySelector('#cplFundTable tr.cplfund-row[data-id="c:' + COL + '"]'));
  const denyBtn = doc.querySelector("#cplFundTable [data-optindeny]");
  if (denyBtn) click(priv.window, denyBtn);
  const t = doc.getElementById("cplFundTable").textContent;
  check("F4e: Deny removes the request and the row offers the Confirm chip again",
    !!denyBtn && P._optinPending(COL) === false && P._optinActive(COL) === false && /Confirmation not yet on file/.test(t) &&
    Array.from(doc.querySelectorAll("[data-optinjump]")).some((b) => b.getAttribute("data-optinjump") === COL));
}
{
  // F5 — a LOCKED (public / non-reviewer) drill-in never shows the CO controls,
  // but still shows the college-facing opted-in status.
  const dom = freshDom();
  const doc = boot(dom.window);
  const T = dom.window.CPL_FUNDING_TAB;
  const selfRow = {}; selfRow[COL] = { college: COL, status: "self_attested", source: "self" };
  T._setElig({ coordOk: true, coord: {}, optinRow: selfRow });
  T.render();
  const row = doc.querySelector('#cplFundTable tr.cplfund-row[data-id="c:' + COL + '"]');
  click(dom.window, row);
  const t = doc.getElementById("cplFundTable").innerHTML;
  check("F5: a locked (non-reviewer) drill-in shows NO CO confirm controls",
    !/cplfund-corow/.test(t) && !/data-optinconfirm/.test(t));
  check("F5b: the locked drill-in shows the request waiting for review",
    /Minimum Conditions:[\s\S]*Confirmation received, awaiting MAP team review/.test(t.replace(/<[^>]+>/g, " ")));
}

// ── the participation-requirement join (2026-08-27) ─────────────────────────
// `partLabel()` is curator-editable and TWO of its three call sites appended
// their own " by ", so the live label "Opt-in participation by" rendered
// "Opt-in participation by by 2026-11-01" in the eligibility hover and the
// baseline-gate text. The third site appended nothing, so NO single label value
// could be correct in all three places. The joiner adapts to the label now.
//
// ⚠️ Tested through a hook rather than the screen: both render surfaces need
// live eligibility data (baselineGate() short-circuits to "pending" when the
// coordinator feed has not loaded), so this join is unreachable from jsdom —
// which is exactly why it shipped wrong and stayed wrong.
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const withLabel = (l) => { T._setScenario({ partLabel: l }); return T._partReqText(); };

  const endsInBy = withLabel("Opt-in participation by");
  check("a label already ending in 'by' is not given a second one",
    /participation by \d{4}-\d{2}-\d{2}$/.test(endsInBy) && !/by\s+by/i.test(endsInBy));
  const noBy = withLabel("Participation confirmed");
  check("a label NOT ending in 'by' still reads as a deadline, not two facts jammed together",
    /^Participation confirmed by \d{4}-\d{2}-\d{2}$/.test(noBy));
  check("Sam's new label composes cleanly (2026-08-27)",
    /^Participation confirmed by \d{4}-\d{2}-\d{2}$/.test(withLabel("Participation confirmed by")));
  check("case does not defeat it — 'By' is the same word",
    !/by\s+by/i.test(withLabel("Participation confirmed By")));
  check("an empty label degrades to the bare deadline, not a dangling 'by'",
    !/\bby\b/i.test(withLabel("")) && /\d{4}-\d{2}-\d{2}/.test(withLabel("")));
  check("every call site composes through partReqText() — none keeps its own concatenation",
    !/partLabel\(\)\s*\+\s*" by "/.test(consumerSrc) &&
    (consumerSrc.match(/partReqText\(\)/g) || []).length >= 4);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part G — EMAIL FIRST (Sam, 2026-10-28): "start with the email field and give an
// acknowledgement once an allowed email is entered that the user may complete the
// action and, once approved by CPL Initiative staff will show as complete on the
// dashboard. Provide an email contact (map@rccd.edu) for technical support." Only
// an address on the institution's or its district's domains opens the form; the
// database's own check (cfp_insert_self) stays the gate behind it.
// ─────────────────────────────────────────────────────────────────────────────
{
  const dom = freshDom();
  const doc = boot(dom.window);
  const T = dom.window.CPL_FUNDING_TAB;
  dom.window.CPL_FUNDING_TEST_DOMAINS = { [COL]: ["peralta.edu"] };
  T._setElig({ coordOk: true, coord: {}, optinRow: {} });
  T.render();
  const jump = Array.from(doc.querySelectorAll("[data-optinjump]")).find((b) => b.getAttribute("data-optinjump") === COL);
  click(dom.window, jump);
  let wrap = passEmail(dom.window, doc, COL, "dean@gmail.com");
  const errText = (wrap.querySelector("[data-optinerr]").textContent || "");
  check("G1: an address off the institution's domains is refused, names the domain that passes, and opens nothing",
    /ending in @peralta\.edu/.test(errText) && !wrap.querySelector('[data-optinfield="name"]') &&
    !wrap.querySelector("[data-optinsubmit]") && !wrap.querySelector(".cplfund-optin-ack"));
  check("G2: the email step names the support address as a mail link",
    !!wrap.querySelector('.cplfund-support a[href="mailto:map@rccd.edu"]'));
  // Enter in the field is Continue.
  wrap.querySelector('[data-optinfield="email"]').value = "Dean@Peralta.edu";
  wrap.querySelector('[data-optinfield="email"]').dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  wrap = Array.from(doc.querySelectorAll("[data-optinwrap]")).find((w) => w.getAttribute("data-optinwrap") === COL);
  const ack = wrap.querySelector(".cplfund-optin-ack");
  check("G3: an allowed address (any case, by Enter) is acknowledged: it may confirm, and shows as complete once CPL Initiative staff approve",
    !!ack && ack.getAttribute("role") === "status" &&
    /Dean@Peralta\.edu may confirm .+'s participation\. Once CPL Initiative staff approve the request, the confirmation shows as complete on this dashboard\./.test(ack.textContent));
  check("G4: the rest of the form opens with the support address still under it, and the address field is gone",
    !!wrap.querySelector('[data-optinfield="name"]') && !!wrap.querySelector("[data-optinsubmit]") &&
    !wrap.querySelector('[data-optinfield="email"]') && !!wrap.querySelector('.cplfund-support a[href="mailto:map@rccd.edu"]'));
  wrap.querySelector('[data-optinfield="name"]').value = "Dean Ortiz";
  wrap.querySelector('[data-optinfield="title"]').value = "VPAA";
  click(dom.window, wrap.querySelector("[data-optinsubmit]"));
  check("G5: the request carries the address the check passed", T._optinPending(COL) === true &&
    /send a confirmation to Dean@Peralta\.edu/.test(doc.getElementById("cplFundTable").textContent));
}
{
  const dom = freshDom();
  const doc = boot(dom.window);
  const T = dom.window.CPL_FUNDING_TAB;
  dom.window.CPL_FUNDING_TEST_DOMAINS = { [COL]: ["peralta.edu"] };
  T._setElig({ coordOk: true, coord: {}, optinRow: {} });
  T.render();
  click(dom.window, Array.from(doc.querySelectorAll("[data-optinjump]")).find((b) => b.getAttribute("data-optinjump") === COL));
  let wrap = passEmail(dom.window, doc, COL, "dean@peralta.edu");
  click(dom.window, wrap.querySelector("[data-optinemailchange]"));
  wrap = Array.from(doc.querySelectorAll("[data-optinwrap]")).find((w) => w.getAttribute("data-optinwrap") === COL);
  check("G6: Use a different address returns to the email step, the address kept for editing",
    !!wrap.querySelector('[data-optinfield="email"]') && wrap.querySelector('[data-optinfield="email"]').value === "dean@peralta.edu" &&
    !wrap.querySelector('[data-optinfield="name"]'));
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);

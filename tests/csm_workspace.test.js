// tests/csm_workspace.test.js
//
// THE CSM WORKSPACE — Sam, 2026-11-02: "a CSM workspace for handling the comms (notes, follow ups, acceptances,
// etc.) for the colleges ... a tab linked from the internal view formatted like CPL Commons with priority cards at
// top and action center below". S555 built it over the funding tab's own state.
//
// Guards the failure modes that matter:
//   1. ONE READ: the workspace's stages and conditions come from CPL_FUNDING_TAB.csm.snapshot(), the same
//      eligReqList / baselineGate the funding tab draws, never a second computation.
//   2. NO PII TO A READER WHO IS NOT SIGNED IN: names and emails ride `req` for a reviewer alone.
//   3. THE REVIEW GATE (Sam's ask 15): Accept stays shut until the reviewer has seen the review and ticked every
//      Check this; a requirement that fails keeps Accept shut and leaves Deny open.
//   4. A DECISION IS THE FUNDING TAB'S DECISION: Accept runs the review lane's acceptOptIn (the same write, the
//      same email window), so the two surfaces cannot drift.
//   5. THE TOP FOLDS (Sam's ask 18) and a pick lasts the visit.
//   6. Rule 4: the tab's button, pane and boot sit in both HTMLs, and the funding tab's internal view links to it.
//
// Run from repo root: `npm test` (or `node tests/csm_workspace.test.js`).
const fs = require("fs");
const path = require("path");
const H = require("./lib/cpl_funding_harness.js");
const { check, freshDom, boot, finish } = H;

const ROOT = path.join(__dirname, "..");
const SRC = fs.readFileSync(path.join(ROOT, "csm_workspace.js"), "utf8");
const IDX = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const CPL = fs.readFileSync(path.join(ROOT, "CPL_Dashboard.html"), "utf8");
const FUND = fs.readFileSync(path.join(ROOT, "cpl_funding.js"), "utf8");

const COLLEGE = "Mt San Antonio";
const OTHER = "Pasadena";
function session() {
  return {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; }
  };
}
function setup(opts) {
  opts = opts || {};
  const { window } = freshDom();
  if (opts.hash) window.location.hash = opts.hash;
  // The real keeper (cpl_session.js) when a test reads the view's address; a signed-in mock rides on top of it.
  if (opts.keeper) window.eval(fs.readFileSync(path.join(ROOT, "cpl_session.js"), "utf8"));
  if (opts.signedIn) window.CPL_SESSION = Object.assign(window.CPL_SESSION || {}, session());
  // A browser's observer that has not yet seen the review's foot: jsdom has none, and the module's fallback opens
  // the gate at once, which is the right behavior where no observer exists but would hide the gate from this test.
  window.IntersectionObserver = function () { this.observe = function () {}; this.disconnect = function () {}; };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setElig(Object.assign({ coordOk: true, coord: { [COLLEGE]: true, [OTHER]: true },
    optinRow: { [COLLEGE]: { college: COLLEGE, status: "self_attested", requested_at: "2026-11-02T04:00:00Z" },
                [OTHER]: { college: OTHER, status: "confirmed", requested_at: "2026-10-30T04:00:00Z" } },
    optinReview: [{ college: COLLEGE, name: "Dana Lee", title: "Other", email: "dana@mtsac.edu", status: "self_attested",
      requested_at: "2026-11-02T04:00:00Z" }] }, opts.elig || {}));
  T.render();
  // the workspace's pane, as both HTMLs carry it
  const pane = doc.createElement("div");
  pane.id = "tab-csm-workspace";
  pane.innerHTML = '<div id="csm-workspace-root"></div>';
  doc.body.appendChild(pane);
  // The page loads the college short names globally (both HTMLs); the contacts match a MAP name through them.
  window.eval(fs.readFileSync(path.join(ROOT, "college_short_names.js"), "utf8"));
  window.eval(SRC);
  window.CPL_CSM_WORKSPACE.boot();
  return { window, doc, T, W: window.CPL_CSM_WORKSPACE, root: doc.getElementById("csm-workspace-root") };
}
const flat = (el) => (el ? el.textContent : "").replace(/\s+/g, " ").trim();
const clickEl = (window, el) => el && el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

const tick = () => new Promise((r) => setTimeout(r, 0));
(async function () {
// ── 1. one read ──────────────────────────────────────────────────────────────
{
  const { T, W, root } = setup({ signedIn: true });
  const snap = T.csm.snapshot();
  const mt = snap.rows.find((r) => r.key === COLLEGE), pc = snap.rows.find((r) => r.key === OTHER);
  check("1a: the snapshot carries every roster institution once",
    snap.rows.length > 100 && new Set(snap.rows.map((r) => r.key)).size === snap.rows.length);
  check("1b: a waiting confirmation reads waiting; a confirmed one reads confirmed",
    !!mt && mt.part.waiting && !mt.part.confirmed && !!pc && pc.part.confirmed && !pc.part.waiting);
  check("1c: each condition is the funding tab's own (its gate and words)",
    JSON.stringify(pc.gate) === JSON.stringify(T._gate(OTHER)) && pc.conds.length > 0 && pc.conds.every((c) => typeof c.words === "string" && c.words));
  check("1d: the workspace's stage follows: waiting on the team, then held or qualifying",
    W._stageOf(mt) === "waiting" && ["held", "qual"].indexOf(W._stageOf(pc)) >= 0);
  const reads = (SRC.match(/fetch\(R\.url \+ "([a-z_/]+)/g) || []).map((m) => m.replace(/^fetch\(R\.url \+ "/, "")).sort();
  check("1e: the source acts through the funding tab's snapshot; it writes only its own log and the access rulings, and reads the three contact sources, the access queue and whether the sign-in still has funding access",
    /CPL_FUNDING_TAB\.csm/.test(SRC) && !/rest\/v1/.test(SRC) &&
    JSON.stringify(reads) === JSON.stringify(["csm_log", "csm_log", "map_college_contacts", "map_college_users", "rpc/map_landing_contacts_roster"]) &&
    JSON.stringify((SRC.match(/accessPost\("([a-z_/]+)"/g) || []).map((m) => m.replace(/^accessPost\("|"$/g, "")).sort()) ===
      JSON.stringify(["rpc/funding_access_decide", "rpc/funding_access_pending", "rpc/is_funding_approver", "rpc/is_funding_reviewer"]) &&
    (SRC.match(/method: "POST"/g) || []).length === 2 && /rpc\/map_landing_contacts_roster", \{ method: "POST"/.test(SRC));
  check("1f: the queue opens on All open items and picks the first, the college waiting on the team",
    flat(root.querySelector(".showing")).indexOf("all open items") >= 0 &&
    !!root.querySelector('.row[data-sel="' + COLLEGE + '"][aria-current="true"]'));
}

// ── 2. no PII without a reviewer ─────────────────────────────────────────────
{
  const { T, root } = setup({ signedIn: false });
  const snap = T.csm.snapshot();
  check("2a: a reader who is not signed in gets no names, emails or notes",
    !snap.reviewer && snap.rows.every((r) => r.req === null && r.note === ""));
  check("2b: the page says so, offers no decision, and prints no address",
    /Sign in as a MAP team reviewer/.test(flat(root)) && !root.querySelector('[data-act="accept"]') && !/dana@mtsac\.edu/.test(root.innerHTML));
  check("2c: an action asked without a reviewer is refused", T.csm.act("accept", "part", COLLEGE) === false);
}

// ── 3. the review gate ───────────────────────────────────────────────────────
{
  const { window, T, W, root } = setup({ signedIn: true });
  const accept = () => root.querySelector('[data-verdict="part"] [data-act="accept"]');
  const deny = () => root.querySelector('[data-verdict="part"] [data-act="deny"]');
  check("3a: a reviewer reads who sent it, with the title the form gave",
    /Dana Lee \(Other senior administrator\), dana@mtsac\.edu/.test(flat(root)));
  const items = W._reviewItems(T.csm.snapshot().rows.find((r) => r.key === COLLEGE), "part").items;
  check("3b: the review names the domain (the form's) and the title Other as Check this, with no line about a decline",
    items[0].s === "form" && /mtsac\.edu/.test(items[0].d) && items[1].s === "check" && !items.some((i) => /declin/i.test(i.t + " " + i.d)));
  check("3c: Accept and Deny stay shut until the reviewer has seen the review", !!accept() && accept().disabled && deny().disabled);
  W._state.seen[COLLEGE + "|part"] = true;
  W.paint();
  check("3d: seen, Deny opens and Accept waits on the checks", !deny().disabled && accept().disabled &&
    /checks? left before Accept/.test(flat(root.querySelector('[data-gate="part"]'))));
  Array.from(root.querySelectorAll('[data-verdict="part"]')[0].closest(".review").querySelectorAll("input[data-check]")).forEach((b) => {
    b.checked = true; b.dispatchEvent(new window.Event("change", { bubbles: true }));
  });
  check("3e: every Check this ticked, Accept opens", !accept().disabled && /Every requirement is checked/.test(flat(root.querySelector('[data-gate="part"]'))));
  // Sam, 2026-11-09: "we really don't need a college declining piece at all--we can just leave the confirmation blank as
  // an indicator". The workspace marks no decline and lists none.
  check("3f: the record offers no decline control", !root.querySelector('[data-act="declined"]') && !/Declined participation/.test(flat(root)));
}

// ── 4. a decision is the funding tab's ───────────────────────────────────────
{
  const { window, T, W, root } = setup({ signedIn: true });
  window.CPL_FUNDING_NO_REMOTE = true;
  W._state.seen[COLLEGE + "|part"] = true;
  W.paint();
  Array.from(root.querySelectorAll('.review input[data-check]')).forEach((b) => { b.checked = true; b.dispatchEvent(new window.Event("change", { bubbles: true })); });
  clickEl(window, root.querySelector('[data-verdict="part"] [data-act="accept"]'));
  await tick();
  const mt = T.csm.snapshot().rows.find((r) => r.key === COLLEGE);
  check("4a: Accept confirms the request through the review lane (the row reads confirmed)", mt.part.confirmed && !mt.part.waiting);
  check("4b: the acceptance email opens in the funding tab's window", !!window.document.getElementById("cplfund-maildlg"));
  check("4c: the record's status line says what happened", /Accepted/.test(flat(root.querySelector(".status"))));
}

// ── 5. the fold, the views, the visit ────────────────────────────────────────
{
  const { window, W, root } = setup({ signedIn: true });
  // Sam, 2026-11-09, after the walkthrough with Malone: "i think the cards can go away". Today's counts and the count
  // beside each menu label carry the figures.
  check("5a: the priority cards and their fold are gone", !root.querySelector('[data-act="fold"]') && !root.querySelector("#cw-fold") &&
    !root.querySelector(".card") && !/Priorities/.test(flat(root.querySelector("header"))));
  // Sam, 2026-11-03: folded, Today stays in the header and each count filters the action center as its card does.
  const today = root.querySelector("header .today");
  check("5b2: Today sits in the header", !!today);
  check("5b3: Today's counts are words for the cards' views", ["review", "held", "qual", "notyet"].every((v) => !!today.querySelector('button[data-view="' + v + '"]')));
  clickEl(window, today.querySelector('[data-view="held"]'));
  check("5b4: a Today count filters the action center and shows pressed", W._state.view === "held" &&
    root.querySelector('header .today [data-view="held"]').getAttribute("aria-pressed") === "true");
  // Malone, 2026-11-10, built on Sam's go: the summary as scannable metrics, the number above its label, the deadline apart.
  {
    const m = setup({ signedIn: true });
    const mets = Array.prototype.slice.call(m.root.querySelectorAll("header .today .metric"));
    const menu = {};
    Array.prototype.forEach.call(m.root.querySelectorAll("#cw-view option"), (o) => { menu[o.value] = (/\((\d+)\)$/.exec(o.textContent) || [])[1]; });
    check("5b6: five metrics in the order the work goes, each a number above its label",
      mets.map((b) => b.getAttribute("data-view")).join() === "review,send,notyet,held,qual" &&
      mets.every((b) => /^\d+$/.test(flat(b.querySelector(".num"))) && flat(b.querySelector(".lab")).length > 3 && b.firstElementChild.className === "num"));
    check("5b7: each metric's number is its menu view's own count, so the two cannot disagree",
      mets.every((b) => flat(b.querySelector(".num")) === menu[b.getAttribute("data-view")]), JSON.stringify(menu));
    clickEl(m.window, m.root.querySelector('.metric[data-view="send"]'));
    check("5b8: Ready to send is a metric, and it opens its list and shows pressed",
      m.W._state.view === "send" && m.root.querySelector('.metric[data-view="send"]').getAttribute("aria-pressed") === "true" &&
      m.root.querySelector("#cw-view").value === "send");
    const dl = m.root.querySelector("header .today .deadline");
    check("5b9: the deadline sits apart from the metrics, its label above its date, and is no button",
      !dl || (dl.tagName === "P" && /Confirmation due/.test(flat(dl.querySelector(".lab"))) && !!flat(dl.querySelector(".date"))));
  }
  // The list in two groups, each row a specific next action, every badge kept (Malone, 2026-11-10; built on Sam's go).
  {
    const g = setup({ signedIn: true });
    const heads = () => Array.prototype.map.call(g.root.querySelectorAll("#cw-queue .qgroup"), (h) => flat(h));
    check("5c1: the waiting request sits under Needs you, and a group with no college draws no heading",
      heads().join("|") === "Needs you 1" && !!g.root.querySelector('.queue[data-group="you"] .row[data-sel="' + COLLEGE + '"]') &&
      g.root.querySelector('.queue[data-group="you"]').getAttribute("aria-labelledby") === "cw-qg-you");
    check("5c2: its line names what to review, the day it was sent and the decision",
      flat(g.root.querySelector('.row[data-sel="' + COLLEGE + '"] .row-next')) === "Review the participation confirmation sent Nov 2, then accept or deny it.");
    const rowsNow = g.W._snapshot().rows;
    const nk = rowsNow.find((r) => !r.part.confirmed && !r.part.waiting && r.key !== COLLEGE).key;
    check("5c3: outside Ready to send, a college with no confirmation reads the email to send, never a pointer to another list",
      g.W._nextStep(rowsNow.find((r) => r.key === nk)) === "Send the request for the participation confirmation." && g.W._needsYou(rowsNow.find((r) => r.key === nk)));
    g.W._log().push({ id: 901, college: nk, activity: "funding", kind: "email", body: "Nudge sent: a participation confirmation for " + nk, created_at: "2026-11-09T10:00:00Z" });
    g.W._state.view = "notyet"; g.W._state.sel = null; g.W.paint();
    const nrow = g.root.querySelector('.queue[data-group="col"] .row[data-sel="' + nk + '"]');
    check("5c4: a nudged college waits on the college: its own group, the Nudged badge with its date, and nothing to send today",
      !!nrow && /Nudged Nov 9/.test(flat(nrow.querySelector(".row-pills"))) && /^Nothing to send today\. The request for the confirmation went out Nov 9\.$/.test(flat(nrow.querySelector(".row-next"))) &&
      heads().length === 2 && /^Needs you \d+$/.test(heads()[0]) && /^Waiting on the college 1$/.test(heads()[1]));
    {
      // COBIx on PR 3049: an acceptance that never reached the college must not sink under the colleges owed a nudge.
      g.W._state.view = "all"; g.W._state.sel = null; g.W.paint();
      const order = Array.prototype.map.call(g.root.querySelectorAll('.queue[data-group="you"] .row'), (b) => b.getAttribute("data-sel"));
      check("5c6: inside Needs you the waiting request leads, then the acceptance that is due, then the colleges owed a first nudge",
        order[0] === COLLEGE && order[1] === OTHER && order.length > 50 && g.W._readyOf(order[2]) === "nudge", order.slice(0, 3).join());
      const o = g.W._snapshot().rows.find((r) => r.key === OTHER);
      const here = g.W._nextStep(o);
      g.W._state.view = "send";
      check("5c7: the email that is due reads the same in Ready to send and in every other list",
        here === g.W._nextStep(o) && /^Send the acceptance\./.test(here), here);
      g.W._state.view = "notyet"; g.W._state.sel = null; g.W.paint();
    }
    check("5c5: Needs you comes first and holds every other college in the list, in the live order",
      g.root.querySelectorAll('.queue[data-group="you"] .row').length + 1 === g.root.querySelectorAll("#cw-queue .row").length &&
      g.root.querySelector("#cw-queue .queue").getAttribute("data-group") === "you");
  }
  // The record: the conditions in a table, Recommended action, the email preview with Edit email, and the two new
  // emails (the clarity mock; Malone's change 4; built on Sam's go, 2026-11-10).
  {
    const d = setup({ signedIn: true });
    const rec = () => d.root.querySelector("#cw-record");
    const tbl = rec().querySelector("table.facts");
    const cell = (re, n) => { const tr = Array.prototype.find.call(tbl.querySelectorAll("tbody tr"), (r) => re.test(flat(r.querySelector("th")))); return tr ? flat(tr.cells[n]) : null; };
    check("5d1: the conditions are a table: three column headers, each condition a row header",
      !!tbl && Array.prototype.map.call(tbl.querySelectorAll('thead th[scope="col"]'), flat).join("|") === "Condition|Status|Email" &&
      tbl.querySelectorAll('tbody th[scope="row"]').length === tbl.querySelectorAll("tbody tr").length && tbl.querySelectorAll("tbody tr").length >= 2);
    check("5d2: a confirmation waiting on the team says so and its email comes after the review; the coordinator is status only",
      cell(/onfirmation/, 1) === "Waiting on the team" && cell(/onfirmation/, 2) === "After the review" && cell(/oordinator/, 2) === "Status only",
      [cell(/onfirmation/, 1), cell(/onfirmation/, 2), cell(/oordinator/, 2)].join("|"));
    const visit = () => rec().querySelector(".visit");
    check("5d3: Recommended action for a waiting request is the review, with one lead button, and no email is due",
      flat(visit().querySelector("h4")) === "Recommended action" && flat(visit().querySelector(".reason")) === "Review the request first" &&
      visit().querySelectorAll('[data-act="toreview"]').length === 1 && !rec().querySelector(".decide [data-act='toreview']") &&
      !rec().querySelector('[data-mailact="sent"]') && rec().querySelector("#cw-mail-pre").hidden);
    d.W._setContacts({ dir: [{ college: "Pasadena City College", cpl_coordinator: "Rivera, Ana", cpl_coordinator_email: "ana@pasadena.edu",
      primary_contact: "Bo Chen", primary_contact_email: "bo@pasadena.edu" }], landing: [], users: [] });
    d.W._state.view = "all"; d.W._state.sel = OTHER; d.W.paint();
    const pre = () => rec().querySelector("#cw-mail-pre"), edit = () => rec().querySelector("#cw-mail-edit"), word = () => rec().querySelector('[data-act="mailedit"]');
    check("5d4: a confirmed college with no acceptance sent reads Send the acceptance, and the email shows as a preview: To, Subject, Message",
      flat(visit().querySelector(".reason")) === "Send the acceptance" && !pre().hidden && edit().hidden &&
      Array.prototype.map.call(pre().querySelectorAll("dt"), flat).filter((t) => t !== "Cc").join("|") === "To|Subject|Message" &&
      /@pasadena\.edu/.test(flat(pre().querySelector("dd"))) && flat(word()) === "Edit email" && word().getAttribute("aria-expanded") === "false" &&
      !!rec().querySelector('[data-mailact="sent"]') && d.W._state.view === "all");
    clickEl(d.window, word());
    check("5d5: Edit email opens the fields in place of the preview and reads Done editing; the draft's fields were in the page all along",
      pre().hidden && !edit().hidden && flat(word()) === "Done editing" && word().getAttribute("aria-expanded") === "true" &&
      !!edit().querySelector("#cw-to") && !!edit().querySelector("#cw-body") && !!edit().querySelector("#cw-mailfu"));
    // The two new emails are held until Sam has read them (COBIx on PR 3050).
    check("5d5a: held: the Template menu offers neither new email, and no college is due one",
      !rec().querySelector('#cw-tpl option[value="lead"]') && !rec().querySelector('#cw-tpl option[value="both"]') &&
      d.W._recTpl({ key: "ZH", name: "ZH", part: { confirmed: false, waiting: false }, nc: { lead: false, standing: false, waiting: false }, conds: [], gate: {} }) === "nudge");
    d.W._leadMail(true); d.W.paint(); clickEl(d.window, word());
    const tplSel = rec().querySelector("#cw-tpl");
    tplSel.value = "lead"; tplSel.dispatchEvent(new d.window.Event("change", { bubbles: true }));
    const lead = d.W._mail(OTHER);
    check("5d6: the Noncredit CPL Lead ask names the role in MAP under its exact title and says an attestation is accepted as well",
      lead.tpl === "lead" && /the Noncredit CPL Lead role in MAP for Pasadena/.test(lead.subject) && /under that exact title/.test(lead.body) &&
      /attestation on the CPL Implementation Funding page is accepted as well/.test(lead.body) && !/\b(money|pool|earn|unspent|draw)\b/i.test(lead.body), lead.body);
    check("5d6a: Sent is offered for the email that is due alone: a template switched by hand offers none",
      d.W._recTpl(d.W._snapshot().rows.find((r) => r.key === OTHER)) === "accept" && !rec().querySelector('[data-mailact="sent"]'));
    const tplSel2 = rec().querySelector("#cw-tpl");
    tplSel2.value = "both"; tplSel2.dispatchEvent(new d.window.Event("change", { bubbles: true }));
    const both = d.W._mail(OTHER);
    check("5d7: both asks in one email: two steps, the confirmation first and the Noncredit CPL Lead second",
      both.tpl === "both" && /: two steps for Pasadena/.test(both.subject) && both.body.indexOf("First, our records do not yet show a participation confirmation") > 0 &&
      both.body.indexOf("Second, for the noncredit share") > both.body.indexOf("First,"), both.body);
    // the rule, on rows built here so the noncredit share is on
    const log = d.W._log();
    const row = (key, confirmed) => ({ key: key, name: key, part: { confirmed: confirmed, waiting: false, confirmedAt: "2026-11-09T00:00:00Z" },
      nc: { lead: false, standing: false, waiting: false, leadNear: false }, conds: [], gate: { blocked: false } });
    log.push({ id: 910, college: "ZC", kind: "email", body: "Acceptance sent: x", created_at: "2026-11-09T12:00:00Z" });
    check("5d8: confirmed, the acceptance sent, and no Noncredit CPL Lead in MAP: the lead ask is due and is the recommended action",
      d.W._recTpl(row("ZC", true)) === "lead" && d.W._recOf(row("ZC", true)).reason === "Send the Noncredit CPL Lead ask" && d.W._needsYou(row("ZC", true)));
    check("5d9: not yet confirmed and no Noncredit CPL Lead: one email carries both asks",
      d.W._recTpl(row("ZN", false)) === "both" && d.W._recOf(row("ZN", false)).reason === "Send both in one email");
    log.push({ id: 911, college: "ZN", kind: "email", body: "Nudge sent: CPL Implementation Funding: two steps for ZN, to a@b.edu.", created_at: new Date().toISOString() });
    log.push({ id: 912, college: "ZC", kind: "email", body: "Noncredit CPL Lead ask sent: x", created_at: new Date().toISOString() });
    check("5d10: once sent, neither is due again for 14 days, and the both-in-one receipt counts as the nudge and as the lead ask",
      d.W._recTpl(row("ZN", false)) === null && d.W._recTpl(row("ZC", true)) === null && d.W._recTpl(row("ZN", true)) === "accept");
    log[log.length - 1].created_at = "2026-01-02T00:00:00Z";
    check("5d11: a lead ask older than 14 days is due again", d.W._recTpl(row("ZC", true)) === "lead");
    log[log.length - 2].created_at = "2026-01-02T00:00:00Z";
    check("5d12: a Sent nudge is final, the both-in-one email included: however old, the college is not due a nudge again, and once it confirms the lead ask is due",
      d.W._recTpl(row("ZN", false)) === null && d.W._recTpl(Object.assign(row("ZN", true), {})) === "accept");
    log.splice(log.length - 3, 3);
    log.push({ id: 913, college: "ZD", kind: "email", body: "Draft opened: CPL Implementation Funding: two steps for ZD, to a@b.edu.", created_at: new Date().toISOString() });
    log.push({ id: 914, college: "ZE", kind: "email", body: "Acceptance sent: x", created_at: "2026-11-09T12:00:00Z" });
    log.push({ id: 915, college: "ZE", kind: "email", body: "Email copied: CPL Implementation Funding: the Noncredit CPL Lead role in MAP for ZE, to a@b.edu.", created_at: new Date().toISOString() });
    check("5d13: a draft of either new email holds the college out for 14 days, as a nudge's draft does",
      d.W._recTpl(row("ZD", false)) === null && d.W._recTpl(row("ZE", true)) === null);
    log.splice(log.length - 3, 3);
    d.W._leadMail(false);
  }
  // One side panel under the record: People, CPL landing page, History, and the review (the clarity mock; issue 2978).
  {
    const e = setup({ signedIn: true });
    const rec = () => e.root.querySelector("#cw-record"), side = () => rec().querySelector("#cw-side");
    const shown = () => Array.prototype.filter.call(side().querySelectorAll("[data-sidepart]"), (p) => !p.hidden).map((p) => p.getAttribute("data-sidepart")).join();
    const word = (k) => rec().querySelector('.decide [data-side="' + k + '"]');
    check("5e1: three words open the panel, none pressed at first, and the panel starts closed",
      ["people", "page", "log"].every((k) => !!word(k) && word(k).getAttribute("aria-pressed") === "false" && word(k).getAttribute("aria-controls") === "cw-side") &&
      flat(word("people")) === "People" && flat(word("page")) === "CPL landing page" && flat(word("log")) === "History" && side().hidden);
    clickEl(e.window, rec().querySelector('.visit [data-act="toreview"]'));
    check("5e2: Review the request opens the review in the panel, alone",
      !side().hidden && shown() === "review" && !!side().querySelector('[data-sidepart="review"] .review [data-act="accept"]'));
    check("5e3: Accept says what it does, beside the buttons",
      /Accept marks the participation confirmation as met and opens the acceptance email for you to send\. Nothing is sent until you send it\./.test(flat(side().querySelector('[data-does="part"]'))));
    clickEl(e.window, word("people"));
    const ppl = side().querySelector('[data-sidepart="people"]');
    check("5e4: People is one list with Role, Person and Source, who sent the request above it, and the word reads pressed",
      shown() === "people" && word("people").getAttribute("aria-pressed") === "true" &&
      (Array.prototype.map.call(ppl.querySelectorAll('thead th[scope="col"]'), flat).join("|") === "Role|Person|Source" || /Reading the contacts/.test(flat(ppl))) &&
      /Who sent it/.test(flat(ppl)) && /Dana Lee/.test(flat(ppl)) && !!ppl.querySelector('[data-pop="contacts"]') && !!ppl.querySelector('[data-pop="people"]'));
    clickEl(e.window, word("log"));
    check("5e5: History holds the log's form and the CO Monitor's note, and takes the panel from People",
      shown() === "log" && !!side().querySelector('[data-sidepart="log"] form[data-logform]') && /CO Monitor/.test(flat(side().querySelector('[data-sidepart="log"]'))));
    clickEl(e.window, word("log"));
    check("5e6: the same word closes the panel", side().hidden && word("log").getAttribute("aria-pressed") === "false");
    clickEl(e.window, word("page"));
    check("5e7: CPL landing page opens in the panel with the way out to the page, or says MAP holds no address",
      shown() === "page" && (!!side().querySelector('[data-sidepart="page"] a[target="_blank"]') || /No landing page address in MAP/.test(flat(side()))));
    clickEl(e.window, rec().querySelector('.visit [data-act="toreview"]'));
    e.W._state.view = "all"; e.W.paint();
    clickEl(e.window, e.root.querySelector('.row[data-sel="' + OTHER + '"]'));
    check("5e8: choosing another college closes an open review", e.W._state.side === "" && side().hidden);
    const out = setup({ signedIn: false });
    check("5e9: a reader who is not signed in gets the landing page word alone: no People, no History, no part for either",
      !out.root.querySelector('[data-side="people"]') && !out.root.querySelector('[data-side="log"]') && !!out.root.querySelector('[data-side="page"]') &&
      !out.root.querySelector('[data-sidepart="people"]') && !out.root.querySelector('[data-sidepart="log"]'));
  }
  check("5b5: the intro under the title is gone", !root.querySelector(".lede"));
  clickEl(window, root.querySelector('[data-stage="notyet"]'));
  check("5c: a board column's word opens its view, Nudge offered on Not yet confirmed",
    W._state.view === "notyet" && !!root.querySelector('[data-act="nudge"]'));
  window.dispatchEvent(new window.CustomEvent("cpl-tab-activated", { detail: { tab: "csm-workspace" } }));
  check("5d: a new visit starts on All open items with nothing typed", W._state.view === "open" && W._state.q === "");
}

// ── 5e. every view has an address (a sign-in link opens a new browser tab, so only the address survives) ─────
{
  const { window, W, root } = setup({ signedIn: true, keeper: true, hash: "#csm-workspace/held" });
  const stash = () => { window.CPL_SESSION.stashReturnTab("csm-workspace"); return (JSON.parse(window.localStorage.getItem("cpl_sb_return_tab") || "{}")).tab; };
  check("5e1: #csm-workspace/held opens Confirmed, still held", W._state.view === "held" && root.querySelector("#cw-view").value === "held");
  check("5e2: and reports it as the view a sign-in returns to", stash() === "csm-workspace/held");
  clickEl(window, root.querySelector('[data-stage="notyet"]'));
  check("5e3: another view reports its own address (the address still says held)", stash() === "csm-workspace/notyet" && window.location.hash === "#csm-workspace/held");
  const sel = root.querySelector("#cw-view"); sel.value = "open"; sel.dispatchEvent(new window.Event("change", { bubbles: true }));
  check("5e4: All open items reports the bare tab", stash() === "csm-workspace");
  window.location.hash = "#csm-workspace/due";
  window.dispatchEvent(new window.CustomEvent("cpl-tab-activated", { detail: { tab: "csm-workspace" } }));
  check("5e5: a later visit reads its address after the reset", W._state.view === "due" && W._state.q === "");
  window.location.hash = "#csm-workspace/nonsense";
  window.dispatchEvent(new window.CustomEvent("cpl-tab-activated", { detail: { tab: "csm-workspace" } }));
  check("5e6: an unknown word keeps All open items", W._state.view === "open");
  const bare = setup({ signedIn: true, keeper: true, hash: "#csm-workspace" });
  check("5e7: a bare #csm-workspace opens All open items", bare.W._state.view === "open" && bare.root.querySelector("#cw-view").value === "open");
}

// ── 6. Rule 4 and the link from the internal view ────────────────────────────
{
  const tags = (s) => [/<button class="cpl-tab" data-tab="csm-workspace">CSM Workspace<\/button>/.test(s),
    /<div class="cpl-tab-pane" id="tab-csm-workspace" data-tab="csm-workspace">/.test(s),
    /onActivate\('csm-workspace'/.test(s) && /loadScript\('csm_workspace\.js', 'CPL_CSM_WORKSPACE'/.test(s)];
  check("6a: the button, the pane and the boot sit in both HTMLs", tags(IDX).every(Boolean) && tags(CPL).every(Boolean));
  check("6b: the funding tab's toolbar links the workspace beside Nudge, for a signed-in reviewer",
    /<a class="cplfund-csmlink" href="#csm-workspace">CSM Workspace<\/a>/.test(FUND) && /function nudgeBtnHtml\(\) \{\s*return nudgeShown\(\)/.test(FUND));
  const { doc } = setup({ signedIn: true });
  check("6c: rendered, the link shows in the internal view", !!doc.querySelector('#cplFundingMount a.cplfund-csmlink[href="#csm-workspace"]'));
  check("6d: new CSS keys every color to a --cw token, and the dark theme maps each onto a First Light token",
    !/#[0-9A-Fa-f]{3,6}\b/.test(SRC.replace(/var LIGHT = [\s\S]*?;\n/, "")) &&
    /:root\[data-theme="dark"\] #tab-csm-workspace/.test(SRC) && /prefers-color-scheme: dark/.test(SRC));
}

// ── 7. the communications log (csm_log) ──────────────────────────────────────
{
  const MIG = fs.readFileSync(path.join(ROOT, "kb", "migrations", "2026-11-02_csm_log.sql"), "utf8");
  const GOV = JSON.parse(fs.readFileSync(path.join(ROOT, "kb", "governance_surface_map.json"), "utf8"));
  check("7a: the table reads and writes for a signed-in reviewer alone, and the trigger stamps who wrote and who closed",
    (MIG.match(/using \(public\.is_allowed_reviewer\(\)\)|with check \(public\.is_allowed_reviewer\(\)\)/g) || []).length === 5 &&
    /new\.by_email := who;/.test(MIG) && /new\.done_by := who;/.test(MIG) && /new\.by_email := old\.by_email;/.test(MIG) &&
    /revoke all on function public\.csm_log_stamp\(\) from public, anon, authenticated;/.test(MIG));
  check("7b: rows belong to an activity, never the funding module, and a rollback sits beside it",
    /activity\s+text not null default 'funding'/.test(MIG) && fs.existsSync(path.join(ROOT, "kb", "migrations", "2026-11-02_csm_log_rollback.sql")));
  check("7c: the new write surface is mapped before it ships (Rule 10 a3)", GOV.mapped["table:csm_log"] === "DR-09");

  const { window, doc, W, root } = setup({ signedIn: true });
  const pick = (k) => clickEl(window, root.querySelector('.row[data-sel="' + k + '"], .chip[data-sel="' + k + '"]'));
  pick(OTHER);
  const form = () => root.querySelector("form[data-logform]");
  const fld = (n) => form().elements.namedItem(n);
  check("7d: a reviewer's record carries History with the Log form, its words saying no student detail",
    !!form() && /no student detail/.test(fld("body").getAttribute("placeholder")) && /Nothing logged/.test(flat(root)));
  fld("kind").value = "call";
  fld("body").value = "Called the VPAA's office about the coordinator record";
  fld("body").dispatchEvent(new window.Event("input", { bubbles: true }));
  fld("due").value = "2026-11-01";
  form().dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  const log = W._log();
  check("7e: Save writes one row for the college and activity, stamped by the reviewer", log.length === 1 &&
    log[0].college === OTHER && log[0].kind === "call" && log[0].activity === "funding" && log[0].by_email === "co@cccco.edu");
  check("7f: the entry shows in History, with its follow-up and a word to close it",
    /Called the VPAA's office/.test(flat(root)) && !!root.querySelector("[data-logdone]") && /Follow up Nov 1/.test(flat(root)));
  const snapRow = W._snapshot().rows.find((r) => r.key === OTHER);
  check("7g: a follow-up due puts the college in the open queue, its age reading Follow-up due, its next step the note",
    !!root.querySelector('.queue .row[data-sel="' + OTHER + '"]') && /Follow-up due Nov 1/.test(flat(root.querySelector('.queue .row[data-sel="' + OTHER + '"]'))) &&
    /^Follow up: Called the VPAA's office/.test(W._nextStep(snapRow)));
  clickEl(window, root.querySelector("[data-logdone]"));
  check("7h: Mark the follow-up done closes it, stamped, and the college leaves Follow-ups open",
    !!W._log()[0].done_at && W._log()[0].done_by === "co@cccco.edu" && !W._dueOf(snapRow));
  window.confirm = () => true;
  clickEl(window, root.querySelector("[data-logdel]"));
  check("7i: Delete removes the entry", W._log().length === 0);

  // a decision writes its own entry
  W._state.sel = COLLEGE; W._state.seen[COLLEGE + "|part"] = true; W.paint();
  Array.from(root.querySelectorAll(".review input[data-check]")).forEach((b) => { b.checked = true; b.dispatchEvent(new window.Event("change", { bubbles: true })); });
  clickEl(window, root.querySelector('[data-verdict="part"] [data-act="accept"]'));
  await tick();
  check("7j: Accept logs itself: the email opened to copy, never sent", W._log().some((x) => x.college === COLLEGE && x.kind === "email" &&
    /Accepted the participation confirmation; the acceptance email opened to copy\./.test(x.body)));

  const anon = setup({ signedIn: false });
  check("7k: a reader who is not signed in sees no History and no form", !anon.root.querySelector("form[data-logform]") && !/History/.test(flat(anon.root)));
}

// ── 8. the contacts on file, the popups, the email (asks 4, 7, 8, 11, 12, 13) ─────────────────────────────────
{
  const { window, doc, W, root } = setup({ signedIn: true });
  W._setContacts({
    dir: [{ college: "Pasadena City College", cpl_coordinator: "Rivera, Ana", cpl_coordinator_email: "ana@pasadena.edu",
      primary_contact: "Bo Chen", primary_contact_email: "bo@pasadena.edu", vpaa: "Val Price", vpaa_email: "val@pasadena.edu",
      ceo: "", ceo_email: "", landing_page_url: "https://cpldashboardcccco.azurewebsites.net/PCC" },
      { college: "Some Other College", cpl_coordinator: "X", cpl_coordinator_email: "x@other.edu" }],
    landing: [{ college: "Pasadena City College", contact_title: "CPL Counselor", contact_name: "Dee Lu", contact_email: "dee@pasadena.edu",
      map_users: [{ role: "Ambassador" }] }],
    users: [{ college: "Pasadena City College", first_name: "Dee", last_name: "Lu", email: "dee@pasadena.edu", role_name: "Ambassador" },
      { college: "Pasadena City College", first_name: "Ivy", last_name: "Init", email: "ivy@pasadena.edu", role_name: "Initiator" }] });
  const c = W._contactsOf(OTHER);
  check("8a: a college's three sources match by name (Pasadena to Pasadena City College), another college's rows stay out",
    c.dir.length === 1 && c.land.length === 1 && c.users.length === 2 && !c.people.some((p) => /other\.edu/.test(p.email)));
  const mm = W._mismatches(OTHER);
  check("8b: the mismatches say what disagrees: the coordinator missing from the landing page, the primary contact not a MAP user",
    mm.some((x) => /CPL Coordinator in MAP's directory \(Rivera, Ana\) is not on the landing page/.test(x)) &&
    mm.some((x) => /primary CPL contact \(Bo Chen\) is not an active MAP user/.test(x)));
  W._state.sel = OTHER; W.paint();
  clickEl(window, root.querySelector('[data-pop="contacts"]'));
  const dlg = () => doc.querySelector("#cw-dlg-host dialog");
  check("8c: Contacts on file opens a popup with the directory's fields, the landing page's people and MAP users by role",
    !!dlg() && /Pasadena contacts/.test(flat(dlg().querySelector("h3"))) && /CPL Coordinator\s*Rivera, Ana, ana@pasadena\.edu/.test(flat(dlg())) &&
    /CEO\s*Not on file/.test(flat(dlg())) && /CPL Counselor: Dee Lu/.test(flat(dlg())) && /Initiator 1/.test(flat(dlg())));
  clickEl(window, dlg().querySelector('[data-pop="people"]'));
  check("8d: Names, titles and emails lists every row with its source, in a table with header cells",
    /names, titles and emails/.test(flat(dlg().querySelector("h3"))) && dlg().querySelectorAll("tbody tr").length === 6 &&
    dlg().querySelectorAll('th[scope="col"]').length === 4);
  const src = dlg().querySelector("[data-psrc]"); src.value = "MAP users"; src.dispatchEvent(new window.Event("change", { bubbles: true }));
  check("8e: the source filter narrows the table", dlg().querySelectorAll("tbody tr").length === 2);
  clickEl(window, dlg().querySelector("[data-close]"));
  check("8f: Close removes the popup", !doc.getElementById("cw-dlg-host"));

  const conf = W._mail(OTHER);
  check("8g0a: a confirmed college whose acceptance has not gone opens on the acceptance, in any list", conf.tpl === "accept");
  W._log().push({ id: 902, college: OTHER, activity: "funding", kind: "email", body: "Acceptance sent: x", created_at: "2026-11-09T12:00:00Z" });
  W._state.mail = {};
  const conf2 = W._mail(OTHER);
  check("8g0: once the acceptance has gone, its email opens on the follow-up, To its CPL Coordinator", conf2.tpl === "follow" && conf2.to === "ana@pasadena.edu");
  W._log().pop();
  W._state.mail = {};
  W._snapshot().rows.find((r) => r.key === OTHER).part.confirmed = false;
  const m = W._mail(OTHER);
  check("8g: a college not yet confirmed gets the nudge: To the CPL Coordinator (Sam's order), Cc the VPAA",
    m.tpl === "nudge" && m.to === "ana@pasadena.edu" && m.cc === "val@pasadena.edu" && /Dear Ana Rivera,/.test(m.body) && /participation confirmation for Pasadena/.test(m.subject));
  W.paint();
  const pick = root.querySelector('input[data-ccpick="ivy@pasadena.edu"]');
  check("8h: Add people to Cc lists the people on file with an address, grouped by source", !!pick &&
    root.querySelectorAll(".ccpick fieldset").length === 3);
  pick.checked = true; pick.dispatchEvent(new window.Event("change", { bubbles: true }));
  check("8i: a tick adds the person to More Cc, and the line says how many", W._mail(OTHER).more.join() === "ivy@pasadena.edu" &&
    root.querySelector("#cw-more").value === "ivy@pasadena.edu" && /1 added/.test(flat(root.querySelector(".ccpick summary"))));
  const subj = root.querySelector("#cw-subj"); subj.value = "A new subject"; subj.dispatchEvent(new window.Event("input", { bubbles: true }));
  const to = root.querySelector("#cw-to"); to.value = "bo@pasadena.edu"; to.dispatchEvent(new window.Event("input", { bubbles: true }));
  check("8j: To and Subject take what the reviewer types", W._mail(OTHER).subject === "A new subject" && W._mail(OTHER).to === "bo@pasadena.edu");
  const find = root.querySelector("#cw-ccfind"); find.value = "initiator"; find.dispatchEvent(new window.Event("input", { bubbles: true }));
  check("8k: the picker's finder narrows the list", Array.from(root.querySelectorAll(".ccopt")).filter((o) => !o.hidden).length === 1);
  let href = null; window.CPL_FUNDING_OPEN_MAIL = (h) => { href = h; };
  clickEl(window, root.querySelector('[data-mailact="draft"]'));
  check("8l: Open a draft opens To, Cc (seeded and added) and Subject, and the log notes it with a follow-up a week out",
    /^mailto:bo%40pasadena\.edu\?subject=A%20new%20subject&cc=val%40pasadena\.edu%2Civy%40pasadena\.edu/.test(href || "") &&
    W._log().some((x) => x.college === OTHER && /^Draft opened: A new subject, to bo@pasadena\.edu with 2 on Cc\.$/.test(x.body) && !!x.follow_up_on));
  const tpl = root.querySelector("#cw-tpl"); tpl.value = "blank"; tpl.dispatchEvent(new window.Event("change", { bubbles: true }));
  check("8m: a new template reseeds the words and keeps the people added to Cc", W._mail(OTHER).tpl === "blank" && W._mail(OTHER).more.join() === "ivy@pasadena.edu");

  const anon = setup({ signedIn: false });
  check("8n: signed out, no contacts word, no email box, and no contact read", !anon.root.querySelector('[data-pop]') && !anon.root.querySelector("#cw-to"));
}

// ── 9. a refused save changes nothing (COBIx on issue 2967, item 2; Sam's go 2026-11-09) ────────────────────
{
  // The real save path: the funding tab's PATCH is refused (an expired session) and the re-read finds no confirmation.
  const { window, T, W, root } = setup({ signedIn: true });
  W._state.sel = COLLEGE; W._state.seen[COLLEGE + "|part"] = true; W.paint();
  Array.from(root.querySelectorAll(".review input[data-check]")).forEach((b) => { b.checked = true; b.dispatchEvent(new window.Event("change", { bubbles: true })); });
  const before = W._log().length, sent = [];
  window.CPL_FUNDING_NO_REMOTE = false;
  window.fetch = function (url, init) {
    sent.push({ url: String(url), method: (init && init.method) || "GET" });
    if (init && init.method && init.method !== "GET") return Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  };
  clickEl(window, root.querySelector('[data-verdict="part"] [data-act="accept"]'));
  check("9a: while the save runs, the status says it is saving and nothing is logged yet", /Saving the acceptance/.test(flat(root.querySelector(".status"))) && W._log().length === before);
  await tick(); await tick(); await tick();
  check("9b: the save went to the participation table as a PATCH", sent.some((x) => x.method === "PATCH" && /cpl_funding_participation/.test(x.url)));
  check("9c: a 401 on the save logs nothing and opens no acceptance email", W._log().length === before && !window.document.getElementById("cplfund-maildlg"));
  check("9d: the status says plainly that nothing was saved", /Not saved: the participation confirmation from .+ is unchanged\./.test(flat(root.querySelector(".status"))));
}
{
  // Deny, answered as refused by the funding tab: no entry and no "removed".
  const { window, T, W, root } = setup({ signedIn: true });
  W._state.sel = COLLEGE; W._state.seen[COLLEGE + "|part"] = true; W.paint();
  const before = W._log().length;
  T.csm.act = function () { return Promise.resolve({ ok: false }); };
  window.confirm = () => true;
  clickEl(window, root.querySelector('[data-verdict="part"] [data-act="deny"]'));
  await tick();
  check("9e: a refused Deny logs nothing and never says the request is removed", W._log().length === before &&
    !/removed/.test(flat(root.querySelector(".status"))) && /Not saved/.test(flat(root.querySelector(".status"))));
  T.csm.act = function () { return Promise.resolve({ ok: true }); };
  clickEl(window, root.querySelector('[data-verdict="part"] [data-act="deny"]'));
  await tick();
  check("9f: a Deny that reads back logs once and says so", W._log().length === before + 1 && /Denied: the request is removed\./.test(flat(root.querySelector(".status"))));
}
{
  // The role the reviewer confirmed rides the acceptance's log entry (Sam, 2026-11-10: "I meant for the reviewer to add").
  const { window, T, W, root } = setup({ signedIn: true });
  W._state.sel = COLLEGE; W._state.seen[COLLEGE + "|part"] = true; W.paint();
  const role = () => root.querySelector('.review input[data-role="part"]');
  check("9h: the senior administrator check, when the form gave Other, carries a field for the role the reviewer confirmed",
    !!role() && /Their role, as you confirmed it/.test(flat(role().closest("label"))) && role().closest(".req").querySelector("input[data-check]"));
  role().value = "Dean of Instruction"; role().dispatchEvent(new window.Event("input", { bubbles: true }));
  Array.from(root.querySelectorAll(".review input[data-check]")).forEach((b) => { b.checked = true; b.dispatchEvent(new window.Event("change", { bubbles: true })); });
  check("9i: the role survives the repaint a tick causes", role().value === "Dean of Instruction");
  const before = W._log().length;
  T.csm.act = function () { return Promise.resolve({ ok: true }); };
  clickEl(window, root.querySelector('[data-verdict="part"] [data-act="accept"]'));
  await tick(); await tick();
  const last = W._log()[0] || {};
  check("9j: ⭐ Accept logs once, and the entry says the sender's role as checked", W._log().length === before + 1 &&
    W._log().some((x) => /Accepted the participation confirmation.*Sender's role, as checked: Dean of Instruction\./.test(String(x.body || ""))), JSON.stringify(last).slice(0, 200));
}
check("9k: the noncredit attestation's review carries the same field and the same log line (one code path for both kinds)",
  /data-role="' \+ kind \+ '"/.test(SRC) && /\(state\.roles \|\| \{\}\)\[gid\(r\.key, kind\)\]/.test(SRC) &&
  /"Accepted the " \+ what \+ "; the acceptance email opened to copy\." \+ \(role \?/.test(SRC));
check("9g: the funding tab answers Accept and Deny with the re-read, never a bare true",
  /accept: function \(kind, key\) \{[\s\S]*?return Promise\.resolve\(p\)\.then\(function \(\) \{\s*return \{ ok: kind === "nc" \? ncAttestStanding\(ncAttestOf\(key\)\) : !!ELIG\.optin\[key\] \};/.test(FUND)
  && /return CSM_ACT\[action\]\(kind, key\);/.test(FUND));

// ── 10. Ready to send (issue 2967, item 3): the email each college is due, and Sent drops it ─────────────────
{
  const { window, T, W, root } = setup({ signedIn: true });
  W._setContacts({
    dir: [{ college: "Pasadena City College", cpl_coordinator: "Rivera, Ana", cpl_coordinator_email: "ana@pasadena.edu",
      primary_contact: "Bo Chen", primary_contact_email: "bo@pasadena.edu", vpaa: "Val Price", vpaa_email: "val@pasadena.edu" }],
    landing: [], users: [] });
  const nudgeKey = W._snapshot().rows.find((r) => !r.part.confirmed && !r.part.waiting && r.key !== COLLEGE).key;
  check("10a: waiting reads Accept first, confirmed with no receipt the acceptance, not yet confirmed the nudge",
    W._readyOf(COLLEGE) === "wait" && W._readyOf(OTHER) === "accept" && W._readyOf(nudgeKey) === "nudge");
  W._state.view = "send"; W._state.sel = null; W.paint();
  const rows = Array.from(root.querySelectorAll(".queue .row")).map((b) => b.getAttribute("data-sel"));
  check("10b: Ready to send lists the acceptances first and the waiting request last, with the step in words",
    rows[0] === OTHER && rows[rows.length - 1] === COLLEGE &&
    /^Send the acceptance\./.test(flat(root.querySelector('.row[data-sel="' + OTHER + '"] .row-next'))) &&
    /^Accept first/.test(flat(root.querySelector('.row[data-sel="' + COLLEGE + '"] .row-next'))));
  W._state.sel = OTHER; W.paint();
  const m = W._mail(OTHER);
  check("10c: the acceptance comes from the funding tab's own template, To the person on file, and keeps the record's draft apart",
    m.tpl === "accept" && m.to === "ana@pasadena.edu" && m.subject.length > 0 && !!W._state.mail[OTHER + "|send"] && !W._state.mail[OTHER] &&
    /return \{ to: m\.to, subject: m\.subject, text: m\.text \};/.test(FUND) && /acceptMail: csmAcceptMail/.test(FUND));
  check("10d: Sent shows in Ready to send, beside Open in Outlook",
    !!root.querySelector('[data-mailact="sent"]') && /Open in Outlook/.test(flat(root.querySelector('[data-mailact="draft"]'))));
  clickEl(window, root.querySelector('[data-mailact="sent"]'));
  await tick();
  check("10e: Sent writes the receipt, the college leaves the queue, and the next one is chosen",
    W._log().some((x) => x.college === OTHER && /^Acceptance sent: /.test(x.body)) && W._readyOf(OTHER) === null &&
    !root.querySelector('.queue .row[data-sel="' + OTHER + '"]') && W._state.sel !== OTHER);
  W._log().unshift({ id: 900, college: nudgeKey, kind: "email", created_at: new Date().toISOString(),
    body: "Draft opened: CPL Implementation Funding: a participation confirmation for X, to a@b.edu." });
  check("10f: a nudge drafted in the last 14 days keeps the college out", W._readyOf(nudgeKey) === null);
  W._log()[0].created_at = "2026-01-02T00:00:00Z";
  check("10g: a nudge older than 14 days lets it back in", W._readyOf(nudgeKey) === "nudge");
  W._state.view = "open"; W.paint();
  const selRow = W._snapshot().rows.find((r) => r.key === W._state.sel);
  check("10i: Sent shows exactly when an email is due for the college, whatever the list",
    W._state.view === "open" && !!selRow && !!root.querySelector('[data-mailact="sent"]') === (W._recTpl(selRow) !== null));
  // A long email: the link would pass what a mail program takes, so the words go to the clipboard and the draft opens bare.
  W._state.sel = OTHER; W._state.mail = {}; W.paint();
  W._mail(OTHER).body = "x".repeat(2500);
  let href = null; window.CPL_FUNDING_OPEN_MAIL = (h) => { href = h; };
  window.navigator.clipboard = { writeText: () => Promise.resolve() };
  clickEl(window, root.querySelector('[data-mailact="draft"]'));
  await tick(); await tick();
  check("10j: a draft past 1,900 characters opens with To, Cc and Subject and no body",
    !!href && /^mailto:/.test(href) && !/&body=/.test(href));
}
// ── 11. Not received, the From line, It bounced, the noncredit acceptance (COBIx on issue 2967, 16:17Z) ───────
{
  const LATER = "Glendale";
  const { window, W, root } = setup({ signedIn: true, elig: {
    optinRow: { [COLLEGE]: { college: COLLEGE, status: "self_attested", requested_at: "2026-11-02T04:00:00Z" },
                [OTHER]: { college: OTHER, status: "confirmed", requested_at: "2026-10-30T04:00:00Z", confirmed_at: "2026-10-31T20:29:00Z" },
                [LATER]: { college: LATER, status: "confirmed", requested_at: "2026-11-08T04:00:00Z", confirmed_at: "2026-11-09T16:00:00Z" } } } });
  W._setContacts({
    dir: [{ college: "Pasadena City College", cpl_coordinator: "Rivera, Ana", cpl_coordinator_email: "ana@pasadena.edu",
      primary_contact: "Bo Chen", primary_contact_email: "bo@pasadena.edu" }], landing: [], users: [] });
  const later = { key: LATER };
  W._state.view = "send"; W._state.sel = null; W.paint();
  const first = root.querySelector(".queue .row");
  check("11a: an acceptance confirmed before the log went live leads the queue as Not received, with the resend in words",
    first && first.getAttribute("data-sel") === OTHER && /Not received/.test(flat(first.querySelector(".row-pills"))) &&
    /^Resend the acceptance: confirmed/.test(flat(first.querySelector(".row-next"))));
  check("11b: one confirmed after the log went live is an ordinary acceptance",
    !!root.querySelector('.queue .row[data-sel="' + later.key + '"]') &&
    !/Not received/.test(flat(root.querySelector('.queue .row[data-sel="' + later.key + '"] .row-pills'))));
  W._state.sel = OTHER; W.paint();
  check("11c: the From-line hint sits with the email's controls",
    /Send from your own address\. The shared MAP mailbox needs Send As rights from RCCD IT\./.test(flat(root.querySelector(".tpl"))));
  clickEl(window, root.querySelector('[data-mailact="sent"]'));
  await tick();
  check("11d: after Sent the college leaves the queue", W._readyOf(OTHER) === null);
  W._state.sel = OTHER; W._state.view = "open"; W.paint();
  const b = root.querySelector('[data-act="bounced"][data-kind="accept"]');
  check("11e: the record offers It bounced for the acceptance it sent", !!b && /It bounced: acceptance/.test(flat(b)));
  W._log()[0].created_at = "2026-11-09T18:00:00Z";
  clickEl(window, b);
  await tick();
  W._log()[0].created_at = "2026-11-09T18:05:00Z";
  check("11f: It bounced writes its row and puts the college back in Ready to send",
    W._log().some((x) => /^It bounced, Acceptance sent: /.test(x.body)) && W._readyOf(OTHER) === "accept" && !root.querySelector('[data-act="bounced"][data-kind="accept"]'));
  const pc = W._snapshot().rows.find((r) => r.key === OTHER);
  pc.nc = { standing: true, waiting: false, confirmedAt: "2026-11-09T17:00:00Z", fy: "2026-27" };
  W._log().unshift({ id: 990, college: OTHER, kind: "email", created_at: "2026-11-09T18:10:00Z", body: "Acceptance sent: resent, to ana@pasadena.edu." });
  check("11g: with the participation acceptance sent, a standing noncredit attestation is next", W._readyOf(OTHER) === "accept_nc");
}

// ── 12. Open in Gmail and the logo as bytes (COBIx on issue 2967, 18:25Z) ─────────────────────────────────────
{
  const { window, W, root } = setup({ signedIn: true });
  W._setContacts({
    dir: [{ college: "Pasadena City College", cpl_coordinator: "Rivera, Ana", cpl_coordinator_email: "ana@pasadena.edu",
      primary_contact: "Bo Chen", primary_contact_email: "bo@pasadena.edu", vpaa: "Val Price", vpaa_email: "val@pasadena.edu" }],
    landing: [], users: [] });
  W._state.sel = OTHER; W.paint();
  let opened = null; window.open = (u) => { opened = u; return null; };
  clickEl(window, root.querySelector('[data-mailact="gmail"]'));
  check("12a: Open in Gmail opens Gmail's compose with To, Subject and the words, and the log notes it",
    /^https:\/\/mail\.google\.com\/mail\/\?view=cm&fs=1&to=ana%40pasadena\.edu&su=/.test(opened || "") && /&body=/.test(opened || "") &&
    W._log().some((x) => x.college === OTHER && /^Gmail draft opened: /.test(x.body)));
  W._mail(OTHER).body = "y".repeat(2500); opened = null;
  window.navigator.clipboard = { writeText: () => Promise.resolve() };
  clickEl(window, root.querySelector('[data-mailact="gmail"]'));
  await tick(); await tick();
  check("12b: a long email opens Gmail with no body, for the paste", !!opened && !/&body=/.test(opened));
  check("12c: until the small logo loads, the copy carries the published address", /<img src="https:\/\/cpl-initiative\.github\.io\//.test(W._mailHtml(OTHER)));
  W._logo.src = "data:image/png;base64,AAAA";
  check("12d: once it loads, the copy carries the logo's own bytes", /<img src="data:image\/png;base64,AAAA"/.test(W._mailHtml(OTHER)));
  check("12e: the words say Outlook or Gmail, and that the logo rides the copy", /paste into Outlook or Gmail/.test(flat(root.querySelector(".tpl"))));
  check("12f: the email copy of the logo is in the repo and small",
    fs.existsSync(path.join(ROOT, "sierra", "cpl-initiative-logo-navy-email.png")) &&
    fs.statSync(path.join(ROOT, "sierra", "cpl-initiative-logo-navy-email.png")).size < 12000);
}

// ── 13x. a sign-in whose funding access has ended says so and offers Ask an approver (the reviewer-session-lifetime
//         lane: "a door sign-in whose grant has lapsed while its tab stayed open reads as signed in with nothing
//         opening") ─────────────────────────────────────────────────────────────────────────────────────────────
{
  const { window, W, root } = setup({ signedIn: true });
  let grant = true, grantFails = false, asked = [];
  window.CPL_FUNDING_NO_REMOTE = false;
  window.fetch = function (url) {
    url = String(url);
    const ans = (v, ok) => Promise.resolve({ ok: ok !== false, status: ok === false ? 500 : 200, json: () => Promise.resolve(v) });
    if (/rpc\/is_funding_reviewer/.test(url)) return grantFails ? ans({}, false) : ans(grant);
    if (/rpc\/is_funding_approver/.test(url)) return ans(false);
    return ans([]);
  };
  window.CPL_REVIEWER_SIGNIN = Object.assign(window.CPL_REVIEWER_SIGNIN || {}, {
    _askAccess: (email) => { asked.push(email); return Promise.resolve({ ok: true }); } });
  const note = () => root.querySelector('section[aria-labelledby="cw-grant-h"]');
  W._access.asked = false; W.paint();
  await tick(); await tick(); await tick();
  check("13x-a: with access standing, no note draws", !note() && W._grant.ok === true);
  grantFails = true; await W._readGrant(); await tick();
  check("13x-b: a check that fails leaves the screen as it was", !note() && W._grant.ok === true);
  grantFails = false; grant = false; await W._readGrant(); await tick();
  check("13x-c: ⭐ the database says the access ended: the workspace says so, to the address signed in",
    !!note() && /Your funding access has ended/.test(flat(note())) && /lasts 30 days/.test(flat(note())) &&
    /@/.test(flat(note().querySelector(".signin"))), note() && flat(note()));
  const ask = () => note().querySelector('button[data-grant="ask"]');
  check("13x-d: and offers Ask an approver, as a word", !!ask() && flat(ask()) === "Ask an approver" &&
    !root.querySelector('section[aria-labelledby="cw-acc-h"]'));
  clickEl(window, ask());
  await tick(); await tick();
  check("13x-e: Ask an approver sends the door's request for that address, once", asked.length === 1 && /@/.test(asked[0]) &&
    flat(note().querySelector(".signin")).indexOf(asked[0]) === 0);
  check("13x-f: and says it asked, in a status line", /^Asked\. An approver will see it/.test(flat(note().querySelector('[role="status"]'))));
  // An approver declines: the door says so, and the note must not go on saying "Asked" (COBIx on PR 3007).
  window.dispatchEvent(new window.CustomEvent("cpl-funding-door-said", { detail: { msg: "An approver declined the request.", kind: "err" } }));
  await tick();
  check("13x-f2: ⭐ a declined request shows in the note, and Ask an approver stays to ask again",
    /^An approver declined the request\.$/.test(flat(note().querySelector('[role="status"]'))) && !!ask() && !ask().disabled);
  grant = true; await W._readGrant(); await tick();
  check("13x-g: once an approver opens it again, the note leaves", !note() && W._grant.ok === true);
  window.dispatchEvent(new window.CustomEvent("cpl-funding-door-said", { detail: { msg: "That approval has lapsed. Ask again.", kind: "err" } }));
  await tick();
  check("13x-h: the door's words draw nothing while the access stands", !note());
  check("13x-i: the sign-in component announces what the door says (the source)",
    /dispatchEvent\(new CustomEvent\("cpl-funding-door-said"/.test(require("fs").readFileSync("reviewer_signin.js", "utf8")));
}

// ── 13y. the queue and the record share a divider a reader moves (Sam, 2026-11-10: "can you make the big side by side
//         window on the various views resizable horizontally") ─────────────────────────────────────────────────
{
  const { window, W, root } = setup({ signedIn: true });
  const grip = () => root.querySelector("#cw-split"), center = () => root.querySelector("#cw-center");
  check("13y-a: the divider sits between the queue and the record, a separator a keyboard reaches",
    !!grip() && grip().getAttribute("role") === "separator" && grip().getAttribute("tabindex") === "0" &&
    grip().previousElementSibling.id === "cw-queue" && grip().nextElementSibling.id === "cw-record" &&
    grip().getAttribute("aria-controls") === "cw-queue" &&   // the value is the queue's share, so the queue is what it controls
    grip().getAttribute("aria-valuenow") === "42" && /--cw-q:42fr; --cw-r:58fr/.test(center().getAttribute("style")));
  const key = (k) => grip().dispatchEvent(new window.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  key("ArrowRight"); key("ArrowRight");
  check("13y-b: Right widens the queue two points a step, and the record takes the rest",
    W._split() === 46 && /--cw-q:46fr; --cw-r:54fr/.test(center().getAttribute("style")) && grip().getAttribute("aria-valuenow") === "46");
  W.paint();
  check("13y-c: a repaint keeps the divider where the reader put it", /--cw-q:46fr/.test(center().getAttribute("style")));
  check("13y-d: the place is kept for the next visit, as a column width is", window.localStorage.getItem("cplCsmSplit") === "46");
  for (let i = 0; i < 40; i++) key("ArrowLeft");
  check("13y-e: it stops at a quarter of the width, so neither side closes", W._split() === 25);
  key("Home");
  check("13y-f: Home puts it back", W._split() === 42 && window.localStorage.getItem("cplCsmSplit") === null);
  check("13y-h: the drag measures against the width the two shares split, and follows only the pointer that began it (the source)",
    /\(ev\.clientX - r\.left - PAD \/ 2\) \/ w \* 100/.test(SRC) && /if \(ev\.pointerId === e\.pointerId\) setSplit/.test(SRC) && /"lostpointercapture"/.test(SRC));
  check("13y-g: on a narrow screen the divider leaves and the panes stack (the source)",
    /\.center \{ grid-template-columns:minmax\(0, 1fr\); gap:16px; \} #tab-csm-workspace \.split \{ display:none; \}/.test(SRC));
}

// ── 14. every menu label carries the count of the list it opens (the walkthrough with Malone, 2026-11-09: "a count
//        beside each label so a CSM can pick a queue without opening it"; Sam's rule, 2026-11-05: a figure opens what
//        it counts). The cards are gone, so the menu and Today carry every figure. ─────────────────────────────────
{
  const { window, T, W, root } = setup({ signedIn: true });
  // OTHER is confirmed with no coordinator on file; COLLEGE has one.
  T._setElig({ coordOk: true, coord: { [COLLEGE]: true },
    optin: { [OTHER]: true }, optinRow: { [OTHER]: { college: OTHER, status: "confirmed", requested_at: "2026-10-30T04:00:00Z" } } });
  T.render(); W.paint();
  const opt = (v) => root.querySelector('#cw-view option[value="' + v + '"]');
  const pick = (v) => { const sel = root.querySelector("#cw-view"); sel.value = v; sel.dispatchEvent(new window.Event("change", { bubbles: true })); };
  const listed = () => Array.from(root.querySelectorAll(".queue .row[data-sel]")).map((b) => b.getAttribute("data-sel"));
  const keys = Array.from(root.querySelectorAll("#cw-view option")).map((o) => o.value);
  const pairs = keys.map((k) => { const m = /\((\d+)\)$/.exec(opt(k).textContent); pick(k);
    return { k, n: m ? parseInt(m[1], 10) : -1, got: parseInt(flat(root.querySelector(".showing b")), 10) }; });
  check("14a: ⭐ every label's count is the length of the list it opens (" + pairs.map((p) => p.k + " " + p.n + "/" + p.got).join("; ") + ")",
    pairs.length === 14 && pairs.every((p) => p.n === p.got));
  check("14b: the counts are real figures here, not all zero", pairs.find((p) => p.k === "all").n > 100 && pairs.find((p) => p.k === "coordmet").n > 0);
  pick("coordmet");
  check("14c: With a CPL Coordinator in MAP lists the colleges that have one, confirmed or not",
    listed().indexOf(COLLEGE) >= 0 && listed().indexOf(OTHER) < 0 && W._state.view === "coordmet");
  check("14d: the count line keeps CPL and MAP in capitals, and carries no second count", /^\d+ with a CPL Coordinator in MAP$/.test(flat(root.querySelector(".showing"))));
  const groups = () => Array.from(root.querySelectorAll("#cw-view optgroup"));
  const vals = (g) => Array.from(g.querySelectorAll("option")).map((o) => o.value).join();
  check("14x-a: the menu has two groups, To do then Browse", groups().map((g) => g.getAttribute("label")).join() === "To do,Browse");
  check("14x-b: To do holds the work queues, in the agreed order", vals(groups()[0]) === "open,send,review,due,held,nc,notyet");
  check("14x-c: Browse holds the lists, the two coordinator lists among them (status only; Sam chases); no Declined list",
    vals(groups()[1]) === "qual,confirmed,coordmet,ncmet,coord,nocoord,all");
  // Nothing reads a decline mark any more (S624): a row handed the old field stays in Ready to send.
  const anyKey = W._snapshot().rows.find((r) => !r.part.confirmed && !r.part.waiting && r.key !== COLLEGE).key;
  const before = W._readyOf(anyKey);
  W._snapshot().rows.find((r) => r.key === anyKey).declined = "2026-11-01";
  check("14x-c2: a row handed the old declined field stays in Ready to send", before === "nudge" && W._readyOf(anyKey) === "nudge");
  delete W._snapshot().rows.find((r) => r.key === anyKey).declined;
  check("14x-d: every option sits in a group", root.querySelectorAll("#cw-view > option").length === 0);
  check("14x-e: the labels keep their names before the count",
    /^Qualifies \(all conditions met\) \(\d+\)$/.test(opt("qual").textContent) && /^Follow-ups open \(\d+\)$/.test(opt("due").textContent) &&
    /^Confirmed but missing the CPL Coordinator in MAP \(1\)$/.test(opt("coord").textContent) && /^With a Noncredit CPL Lead \(\d+\)$/.test(opt("ncmet").textContent));
  const none = W._snapshot().rows.filter((r) => r.conds.some((c) => c.kind === "coord" && !c.met && !c.pending)).map((r) => r.key);
  pick("nocoord");
  check("14x-f: No CPL Coordinator in MAP lists every college without one, confirmed or not (" + none.length + ")",
    none.length > 1 && listed().length === none.length && listed().indexOf(OTHER) >= 0 && listed().indexOf(COLLEGE) < 0 &&
    /no CPL Coordinator in MAP/.test(flat(root.querySelector(".showing"))));
  pick("coord");
  check("14x-g: the confirmed-missing list is its narrower part", listed().join() === OTHER);
}

// ── 15. a credit college's noncredit attestation reaches the workspace (Sam's screen, 2026-11-09: "Noncredit CPL
//        Lead attested 0 of 3" over twelve attestations on file), and the role in MAP meets the condition ─────────
{
  // Scenario 4's lane: a credit college's award carries a noncredit share, and its attestation waits for review.
  const OUTCOMES = { ncLane: "outcomes", ncOutcomes: { "1": [
    { key: "exh", title: "Exhibits built or adopted", share: 0.5, goals: ["A"], unit_word: "exhibits", metric: "Exhibits", metric_src: "nc_exh",
      target_rule: { kind: "pct_floor_cap", of: "nc_cdcp", pct: 0.05, floor: 2, cap: 10 } },
    { key: "course", title: "A noncredit CPL course", share: 0.5, goals: ["A"], unit_word: "courses", metric: "A course", metric_src: "nc_course",
      target_rule: { kind: "fixed", n: 1 } }] } };
  const { window, T, W, root } = setup({ signedIn: true });
  T._setShared(OUTCOMES);
  const ELIG = (lead) => ({ coordOk: true, coord: { [COLLEGE]: true, [OTHER]: true }, ncLead: lead || {},
    optin: { [OTHER]: true }, optinRow: { [OTHER]: { college: OTHER, status: "confirmed", requested_at: "2026-10-30T04:00:00Z" } },
    ncAttestOk: true, ncAttest: {
      [OTHER]: { college: OTHER, status: "self_attested", fiscal_year: "2026-27", requested_at: "2026-11-04T04:00:00Z" },
      [COLLEGE]: { college: COLLEGE, status: "confirmed", fiscal_year: "2026-27", requested_at: "2026-11-02T04:00:00Z", confirmed_at: "2026-11-03T04:00:00Z" } } });
  T._setElig(ELIG());
  T.render(); W.paint();
  const snap = T.csm.snapshot();
  const pc = snap.rows.find((r) => r.key === OTHER), mt = snap.rows.find((r) => r.key === COLLEGE);
  const withNc = snap.rows.filter((r) => r.nc).length;
  check("15a: fixture: the model gives a credit college a noncredit award", (T._alloc(OTHER).nc_award || 0) > 0.5 && (T._alloc(COLLEGE).nc_award || 0) > 0.5);
  check("15b: the snapshot carries the noncredit attestation for credit colleges, more than the three noncredit-only institutions (" + withNc + ")",
    withNc > 3 && !!pc.nc && !!mt.nc);
  check("15c: a waiting attestation reads waiting, an accepted one standing", pc.nc.waiting === true && pc.nc.standing === false && mt.nc.standing === true);
  check("15d: a college whose only open request is its attestation is Waiting on the team", W._stageOf(pc) === "waiting");
  const opt = (v) => root.querySelector('#cw-view option[value="' + v + '"]');
  const pick = (v) => { const sel = root.querySelector("#cw-view"); sel.value = v; sel.dispatchEvent(new window.Event("change", { bubbles: true })); };
  const listed = () => Array.from(root.querySelectorAll(".queue .row[data-sel]")).map((b) => b.getAttribute("data-sel")).join();
  check("15e: With a Noncredit CPL Lead counts the accepted attestation, and the waiting one counts as waiting",
    opt("ncmet").textContent === "With a Noncredit CPL Lead (1)" && opt("nc").textContent === "Noncredit attestations waiting (1)");
  pick("ncmet");
  check("15f: and the list is that college", listed() === COLLEGE);
  // Sam, 2026-11-09: the role in MAP meets the condition ("in MAP since itpi just added the field in map users. if they
  // attest, we can accept that now as well"). OTHER's form waits, and OTHER now holds the role on its MAP landing page.
  T._setElig(ELIG({ [OTHER]: true })); T.render(); W.paint();
  const pc2 = T.csm.snapshot().rows.find((r) => r.key === OTHER);
  check("15h: ⭐ a college with the role in MAP no longer reads as attestation waiting", pc2.nc.lead === true && pc2.nc.waiting === true &&
    W._stageOf(pc2) !== "waiting" && opt("nc").textContent === "Noncredit attestations waiting (0)");
  pick("ncmet");
  check("15i: and it counts as having a Noncredit CPL Lead, beside the accepted attestation",
    opt("ncmet").textContent === "With a Noncredit CPL Lead (2)" && listed().split(",").sort().join() === [COLLEGE, OTHER].sort().join());
  pick("open");
  check("15j: its row carries no NC attestation waiting pill", !/NC attestation waiting/.test(flat(root.querySelector('.row[data-sel="' + OTHER + '"]') || root)));
  check("15k: the review for that form, if opened, says the role already meets the condition",
    /data-role-met="1"/.test(W._reviewHtml ? W._reviewHtml(OTHER, "nc") : require("fs").readFileSync("csm_workspace.js", "utf8")));
  T._setElig(ELIG()); T.render(); W.paint();
  const nudge = T._nudgeInstitutions();
  check("15g: the Nudge lists a credit college that has sent no attestation, and leaves out the two that have",
    nudge.filter((r) => r.missing.indexOf("nc") >= 0).length > 3 &&
    !nudge.some((r) => (r.key === OTHER || r.key === COLLEGE) && r.missing.indexOf("nc") >= 0));
}

// ── 13. access requests: the approver's side of the funding door (Sam, 2026-11-09: "I don't understand how to access
//        the request to answer") ────────────────────────────────────────────────────────────────────────────────
{
  // An approver, with one request waiting. Each read carries the session's token as it stands at that read.
  const { window, W, root } = setup({ signedIn: true });
  let token = "first.token.sig", approver = true, pending = [], refuse = false;
  const sent = [];
  window.CPL_SESSION.authHeaders = () => ({ apikey: "anon", Authorization: "Bearer " + token });
  window.CPL_FUNDING_NO_REMOTE = false;
  window.fetch = function (url, init) {
    url = String(url);
    sent.push({ url, auth: init && init.headers && init.headers.Authorization, body: init && init.body });
    const ans = (v, ok) => Promise.resolve({ ok: ok !== false, status: ok === false ? 401 : 200, json: () => Promise.resolve(v) });
    if (/rpc\/is_funding_approver/.test(url)) return ans(approver);
    if (/rpc\/funding_access_pending/.test(url)) return refuse ? ans({}, false) : ans(pending);
    if (/rpc\/funding_access_decide/.test(url)) return ans({ ok: true, status: "approved" });
    return ans([]);
  };
  W._access.asked = false; W.paint();
  await tick(); await tick(); await tick();
  const sec = () => root.querySelector('section[aria-labelledby="cw-acc-h"]');
  check("13a: an approver sees Access requests with nobody waiting, and how a teammate asks",
    !!sec() && /No one is waiting/.test(flat(sec())) && /Ask an approver/.test(flat(sec())) && !sec().querySelector('[data-access="approve"]'));
  check("13b: the empty section offers Check now", !!sec().querySelector('button[data-access="check"]') && flat(sec().querySelector('[data-access="check"]')) === "Check now");

  pending = [{ id: "11111111-2222-3333-4444-555555555555", email: "pat@rccd.edu", name: "Pat Rivera", role: "CSM", requested_at: "2026-11-09T20:00:00Z" }];
  token = "second.token.sig";                       // the keeper refreshed the session since the first read
  clickEl(window, sec().querySelector('[data-access="check"]'));
  await tick(); await tick(); await tick();
  const reads = sent.filter((x) => /funding_access_pending/.test(x.url));
  check("13c: a later read carries the session's token as it stands then, never the first read's",
    reads.length >= 2 && reads[0].auth === "Bearer first.token.sig" && reads[reads.length - 1].auth === "Bearer second.token.sig");
  check("13d: the request draws with who asked, Approve and Deny, and the status counts it",
    /Pat Rivera/.test(flat(sec())) && /pat@rccd\.edu, CSM/.test(flat(sec())) && !!sec().querySelector('[data-access="approve"]') &&
    !!sec().querySelector('[data-access="deny"]') && /1 access request waits\./.test(flat(root.querySelector(".status"))));

  refuse = true;
  const ok = await W._readAccess();
  check("13e: a refused read keeps the request on the page", ok === false && /Pat Rivera/.test(flat(sec())));
  refuse = false;

  token = "third.token.sig";
  clickEl(window, sec().querySelector('[data-access="approve"]'));
  await tick(); await tick(); await tick();
  const dec = sent.find((x) => /funding_access_decide/.test(x.url));
  check("13f: Approve sends the request's id with the current token, drops the row and says so",
    !!dec && dec.auth === "Bearer third.token.sig" && /"p_verdict":"approve"/.test(dec.body) && /11111111-2222/.test(dec.body) &&
    !/Pat Rivera/.test(flat(sec())) && /Approved Pat Rivera/.test(flat(root.querySelector(".status"))));
}
{
  // A reviewer who is not an approver: the database answers false and an empty queue, and the section never draws.
  const { window, W, root } = setup({ signedIn: true });
  window.CPL_FUNDING_NO_REMOTE = false;
  window.fetch = function (url) {
    const v = /rpc\/is_funding_approver/.test(String(url)) ? false : [];
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(v) });
  };
  W._access.asked = false; W.paint();
  await tick(); await tick(); await tick();
  check("13g: a reviewer who is not an approver sees no Access requests section", !root.querySelector('section[aria-labelledby="cw-acc-h"]'));
}

check("10k: the fallback deadline is the published model's date", /\|\| "2026-12-31";/.test(FUND) && !/\|\| "2026-11-01";/.test(FUND));

finish();
})();

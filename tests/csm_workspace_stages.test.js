// tests/csm_workspace_stages.test.js
//
// THE SEVEN STAGES OF THE FUNDING FOLLOW-UP DASHBOARD. Malone, 2026-11-13: "we need a different filter structure....
// because what we have is very confusing ... Ideally, it would be clean and sequential", then his answers the same
// day: the credit share qualifies while the noncredit share waits (Sam's Sheet 113 card 1 stands); an email may go at
// each step and an acceptance needs none of its own; To send apart from Waiting on the college; three look-up lists.
//
// The failure modes this guards:
//   1. A COLLEGE IN TWO LISTS, OR IN NONE. The lists of 2026-11-12 overlapped; a stage list must hold each
//      institution exactly once.
//   2. A STEP THAT SHOULD HAVE BEEN SKIPPED. A college with no noncredit share, or with the role in MAP, never
//      sits at stage 3 or 4, so it is never asked for a lead it does not owe.
//   3. AN EMAIL THE STAGE DOES NOT CALL FOR. One email a stage; an acceptance is never due.
//   4. A STAGE THAT READS FROM SOMETHING STORED. The stage is computed from the snapshot and the log; the only write
//      is the Sent receipt the page already wrote.
//
// Run from repo root: `npm test` (or `node tests/csm_workspace_stages.test.js`).
const fs = require("fs");
const path = require("path");
const H = require("./lib/cpl_funding_harness.js");
const { check, freshDom, boot, finish } = H;
const ROOT = path.join(__dirname, "..");
const SRC = fs.readFileSync(path.join(ROOT, "csm_workspace.js"), "utf8");
const flat = (el) => (el ? el.textContent : "").replace(/\s+/g, " ").trim();
const clickEl = (window, el) => el && el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

function setup(hash) {
  const { window } = freshDom();
  if (hash) window.location.hash = hash;
  window.eval(fs.readFileSync(path.join(ROOT, "cpl_session.js"), "utf8"));
  window.CPL_SESSION = Object.assign(window.CPL_SESSION || {}, {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; } });
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setElig({ coordOk: true, coord: {}, optinRow: {}, optinReview: [] });
  T.render();
  const pane = doc.createElement("div");
  pane.id = "tab-csm-workspace";
  pane.innerHTML = '<div id="csm-workspace-root"></div>';
  doc.body.appendChild(pane);
  window.eval(fs.readFileSync(path.join(ROOT, "college_short_names.js"), "utf8"));
  window.eval(SRC);
  const W = window.CPL_CSM_WORKSPACE;
  W.boot();
  return { window, doc, T, W, root: doc.getElementById("csm-workspace-root") };
}
// One sample college for each stage, over the funding tab's own snapshot (the shape the guide's capture.js uses).
const day = (n) => new Date(Date.now() + n * 864e5).toISOString();
const NC = { status: "", waiting: false, standing: false, lead: false, leadNear: false, fy: "", at: "", confirmedAt: "" };
function mk(name, o) {
  const cond = (kind, met, words) => ({ kind, met, pending: false, label: words, words, counts: "" });
  const conds = [cond("coord", o.coord !== false, "CPL Coordinator"), cond("part", !!o.confirmed, "Confirmation"), cond("vetstar", o.vet !== false, "Veteran JSTs")];
  return { key: name, name, district: "", total: 1, ncShare: !!o.nc, gate: { blocked: conds.some((c) => !c.met), pending: false, missing: [] }, conds,
    part: { status: "", waiting: !!o.waiting, confirmed: !!o.confirmed, at: o.at || "", confirmedAt: o.confirmed ? day(-3) : "" },
    nc: o.nc === undefined ? null : o.nc, landing: "", coordMissing: "", note: "", req: null, prios: [] };
}
const ROWS = () => [
  mk("S1 To Send", { nc: NC }),
  mk("S1 Asked", { nc: NC }),
  mk("S1 Attested Early", { nc: Object.assign({}, NC, { waiting: true, at: day(-1) }) }),
  mk("S2 Review", { waiting: true, at: day(-1), nc: NC }),
  mk("S3 No Lead", { confirmed: true, nc: NC }),
  mk("S3 No Lead Held Too", { confirmed: true, coord: false, nc: NC }),
  mk("S4 Lead Review", { confirmed: true, nc: Object.assign({}, NC, { waiting: true, at: day(-1) }) }),
  mk("S5 Held", { confirmed: true, coord: false, nc: Object.assign({}, NC, { lead: true }) }),
  mk("S5 Held No Noncredit", { confirmed: true, vet: false }),
  mk("S6 Ready Role", { confirmed: true, nc: Object.assign({}, NC, { lead: true }) }),
  mk("S6 Ready Attested", { confirmed: true, nc: Object.assign({}, NC, { standing: true }) }),
  mk("S6 Ready No Noncredit", { confirmed: true }),
  mk("S7 Qualifies", { confirmed: true, nc: Object.assign({}, NC, { lead: true }) })];
const LOG = () => [
  { id: 1, college: "S1 Asked", kind: "email", by_email: "r@x.edu", created_at: day(-2), body: "Nudge sent: CPL Implementation Funding: Participation Confirmation for S1 Asked, to a@x.edu.", follow_up_on: null, done_at: null },
  { id: 2, college: "S7 Qualifies", kind: "email", by_email: "r@x.edu", created_at: day(-1), body: "Qualifying email sent: CPL Implementation Funding: Minimum Conditions Met for S7 Qualifies, to a@x.edu.", follow_up_on: null, done_at: null }];
function sample(g) {
  const rows = ROWS(), real = g.T.csm.snapshot();
  const snap = { reviewer: true, loaded: true, coordOk: true, deadline: real.deadline, ncTitles: real.ncTitles, partTitles: real.partTitles, rows };
  g.T.csm.snapshot = () => snap;
  const log = g.W._log(); log.length = 0; LOG().forEach((x) => log.push(x));
  g.W._state.view = "open"; g.W._state.sel = null; g.W.paint();
  return rows;
}

{
  const g = setup(), rows = sample(g), W = g.W, V = W._views, by = (k) => rows.find((r) => r.key === k);
  const stage = (k) => W._stageNum(by(k));
  // ── 1. every institution in exactly one stage ──
  const ids = ["notyet", "partreview", "nolead", "ncreview", "held", "ready", "qual"];
  check("1a: ⭐ the seven stage lists hold every institution exactly once",
    rows.every((r) => ids.filter((id) => V[id].keep(r)).length === 1) && ids.reduce((n, id) => n + rows.filter(V[id].keep).length, 0) === rows.length);
  check("1b: the menu is the seven stages in order under Every stage, then three look-up lists and no other",
    Object.keys(V).join() === "open,notyet,partreview,nolead,ncreview,held,ready,qual,coord,emails,all" &&
    ids.every((id, i) => V[id].label.indexOf((i + 1) + ". ") === 0 && V[id].g === "stage") && ["coord", "emails", "all"].every((id) => V[id].g === "look"));
  check("1c: on the live roster too, every institution has one stage", (function () {
    const g2 = setup(), live = g2.T.csm.snapshot().rows;
    return live.length > 100 && live.every((r) => { const n = g2.W._stageNum(r); return n >= 1 && n <= 7; }) &&
      ids.reduce((n, id) => n + live.filter(g2.W._views[id].keep).length, 0) === live.length;
  })());

  // ── 2. the order, and the steps a college skips ──
  check("2a: nothing on file is stage 1; a confirmation under review is stage 2",
    stage("S1 To Send") === 1 && stage("S1 Asked") === 1 && stage("S2 Review") === 2);
  check("2b: confirmed with a noncredit share and no lead is stage 3, whatever else is open; an attestation under review is stage 4",
    stage("S3 No Lead") === 3 && stage("S3 No Lead Held Too") === 3 && stage("S4 Lead Review") === 4);
  check("2c: ⭐ the role in MAP, an accepted attestation, or no noncredit share: stages 3 and 4 never apply",
    stage("S5 Held") === 5 && stage("S5 Held No Noncredit") === 5 && stage("S6 Ready Role") === 6 && stage("S6 Ready Attested") === 6 && stage("S6 Ready No Noncredit") === 6);
  check("2d: an attestation that arrives before the confirmation waits at stage 1, and the row says it is on file",
    stage("S1 Attested Early") === 1 && /A noncredit attestation is already on file and waits for review\./.test(W._nextStep(by("S1 Attested Early"))));
  check("2e: ⭐ stage 7 is stage 6 with the qualifying email marked sent, read from the log and stored nowhere else",
    stage("S7 Qualifies") === 7 && (function () { const log = W._log(), keep = log.splice(1, 1); const n = stage("S7 Qualifies"); log.push(keep[0]); return n === 6; })());
  // D1 (Sam, Sheet 113 card 1): the stages are the order of work and change nothing about what qualifies.
  check("2f: ⭐ at stage 3 or 4 with the credit conditions met, the row says the credit share qualifies; held too, it does not",
    W._pillsOf(by("S3 No Lead")).some((p) => p[1] === "Credit share qualifies") && W._pillsOf(by("S4 Lead Review")).some((p) => p[1] === "Credit share qualifies") &&
    !W._pillsOf(by("S3 No Lead Held Too")).some((p) => p[1] === "Credit share qualifies") && !W._pillsOf(by("S6 Ready Role")).some((p) => p[1] === "Credit share qualifies") &&
    /credit share qualifies now/.test(W._recOf(by("S3 No Lead")).why));

  // ── 3. one email a stage ──
  const due = (k) => W._recTpl(by(k));
  check("3a: ⭐ stage 1 the participation request, 3 the Noncredit CPL Lead request, 5 the held follow-up, 6 the qualifying email; a review and stage 7 call for none",
    due("S1 To Send") === "nudge" && due("S3 No Lead") === "lead" && due("S5 Held No Noncredit") === "held" && due("S6 Ready Role") === "qualify" &&
    due("S2 Review") === null && due("S4 Lead Review") === null && due("S7 Qualifies") === null);
  check("3b: ⭐ an acceptance is never due: a confirmed college with no acceptance sent is owed its stage's email alone",
    rows.every((r) => ["accept", "accept_nc"].indexOf(W._recTpl(r)) < 0) && !/accept/.test(JSON.stringify(rows.map((r) => W._readyOf2(r)))));
  check("3c: an email already sent is not due again, and the college waits on the college",
    due("S1 Asked") === null && W._subOf(by("S1 Asked")) === "wait" && /^Waiting on the college\. The participation request went out /.test(W._nextStep(by("S1 Asked"))));
  check("3d: each stage's sub-state: a review, an email to send, waiting, done",
    W._subOf(by("S1 To Send")) === "send" && W._subOf(by("S2 Review")) === "review" && W._subOf(by("S4 Lead Review")) === "review" &&
    W._subOf(by("S6 Ready Role")) === "send" && W._subOf(by("S7 Qualifies")) === "done");
  {
    const log = W._log();
    log.push({ id: 9, college: "S5 Held No Noncredit", kind: "email", by_email: "r@x.edu", created_at: day(-1), body: "Email copied: CPL Implementation Funding: Remaining Conditions for S5 Held No Noncredit, to a@x.edu.", follow_up_on: null, done_at: null });
    const d = W._draftedOf(by("S5 Held No Noncredit"));
    check("3e: a held follow-up copied and never marked Sent stays to send, with Sent offered for it",
      !!d && d.tpl === "held" && W._subOf(by("S5 Held No Noncredit")) === "send" && /not yet marked as sent/.test(W._nextStep(by("S5 Held No Noncredit"))));
    log.push({ id: 10, college: "S1 To Send", kind: "email", by_email: "r@x.edu", created_at: day(-1), body: "Email copied: CPL Implementation Funding: Participation Confirmation for S1 To Send, to a@x.edu.", follow_up_on: null, done_at: null });
    check("3f: a copy is found by its subject in any letter case (the wording saved 2026-11-12 capitalizes it)",
      !!W._draftedOf(by("S1 To Send")) && W._draftedOf(by("S1 To Send")).tpl === "nudge");
    log.splice(log.length - 2, 2);
  }

  // COBIx on PR 3253. Each of these would have put an email in front of a reviewer that should not go.
  {
    const pend = mk("ZP Pending", { confirmed: true }); pend.gate = { blocked: false, pending: true, missing: [] };
    const pend2 = mk("ZP Pending Cond", { confirmed: true }); pend2.conds[2].pending = true; pend2.conds[2].met = false; pend2.gate = { blocked: false, pending: false, missing: [] };
    check("3g: ⭐ a condition still being read never makes the qualifying email due: the college waits at stage 5 with nothing to send",
      [pend, pend2].every((r) => W._stageNum(r) === 5 && W._recTpl(r) === null && /^Nothing to send yet\. A condition is still being read\.$/.test(W._nextStep(r)) && !W._needsYou(r)));
    check("3h: ⭐ a college held by the CPL Coordinator alone is owed no email (Sam follows those up), and an email that lists what remains leaves the coordinator out",
      W._recTpl(by("S5 Held")) === null && /^No email from the team\./.test(W._nextStep(by("S5 Held"))) && due("S5 Held No Noncredit") === "held" &&
      W._condLines(by("S3 No Lead Held Too"), true).join("|") === "A Noncredit CPL Lead, for the noncredit share" &&
      W._condLines(by("S5 Held"), false).some((l) => /^CPL Coordinator: not yet met$/.test(l)));
    W._leadMail(false);
    check("3i: ⭐ with the lead emails switched off, stage 3 calls for no email", due("S3 No Lead") === null && W._stageNum(by("S3 No Lead")) === 3);
    W._leadMail(true);
  }

  // ── 4. the page ──
  const heads = () => Array.prototype.map.call(g.root.querySelectorAll("#cw-queue .qgroup"), flat);
  check("4a: Every stage draws each stage that holds a college under its number and name, in order, with its count",
    heads().join("|") === "1. No confirmation received 3|2. Confirmation to review 1|3. Noncredit CPL Lead not received 2|4. Noncredit CPL Lead to review 1|5. Held by a condition 2|6. All conditions met 3|7. Qualifies 1" &&
    g.root.querySelectorAll("#cw-queue .row").length === rows.length, heads().join("|"));
  check("4b: the summary is the seven stages in order, each count its list's own",
    Array.prototype.map.call(g.root.querySelectorAll(".today .metric"), (b) => b.getAttribute("data-view") + ":" + flat(b.querySelector(".num"))).join() ===
    "notyet:3,partreview:1,nolead:2,ncreview:1,held:2,ready:3,qual:1");
  clickEl(g.window, g.root.querySelector('.today .metric[data-view="notyet"]'));
  check("4c: ⭐ a stage list keeps the email to send apart from the colleges already asked (D3)",
    heads().join("|") === "To send or follow up 2|Waiting on the college 1" && /at stage 1: no confirmation received/.test(flat(g.root.querySelector(".showing"))) &&
    flat(g.root.querySelector('.queue[data-group="wait"]')).indexOf("S1 Asked") === 0, heads().join("|"));
  g.W._state.view = "open"; g.W._state.sel = "S6 Ready Role"; g.W.paint();
  check("4d: the record recommends the stage's email and says no separate acceptance is needed",
    flat(g.root.querySelector(".visit .reason")) === "Send the qualifying email" && /no separate acceptance is needed/.test(flat(g.root.querySelector(".visit"))));
  check("4e: every row carries its stage as a word", rows.every((r) => W._pillsOf(r).some((p) => /^Stage [1-7]: /.test(p[1]))));
  check("4f: no stage is stored: the source writes no stage, and the stage rule reads the snapshot and the log",
    !/stage["']?\s*:\s*stageNum|localStorage[^;]*stage/i.test(SRC) && /function stageNum\(r\) \{[\s\S]{0,700}isSent\(r, "qualify"\)/.test(SRC));
}
// ── 5. an address saved for a retired list opens the stage that now holds its colleges ──
{
  const was = { review: "partreview", nc: "ncreview", request: "notyet", accept: "open", follow: "open", confirmed: "emails", ncnamed: "all", nocoord: "coord" };
  check("5a: ⭐ every retired list's address opens its successor", Object.keys(was).every((k) => { const g = setup("#csm-workspace/" + k); return g.W._state.view === was[k]; }));
  const g = setup("#csm-workspace/ready");
  check("5b: a stage has its own address", g.W._state.view === "ready");
}
finish();

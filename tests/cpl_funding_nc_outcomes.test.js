// tests/cpl_funding_nc_outcomes.test.js
//
// THE NONCREDIT OUTCOMES LANE (Scenario 4; Sam's Sheet 113 and 114 rulings,
// 2026-10-22). MAP will not carry a reliable noncredit-origin flag (LocID2)
// for a while, so a scenario may release the noncredit share of each award on
// outcomes a noncredit program controls: its own minimum conditions (a
// noncredit CPL coordinator named and published; a strike-team attestation
// renewed each year), and two counted outcomes, 50/50 — NC-1 exhibits built or
// adopted (the greater of 2 and 5% of the program's CDCP noncredit courses,
// capped at 10) and NC-2 a noncredit CPL portfolio-development course
// chaptered in a CDCP program (1). The student award count is REPORTED, never
// funded. The share keeps its FTES sizing; what changes is what releases it.
//
// What this pins, in order of how expensive each would be to get wrong:
//
//   ⚠️ 1. THE MODE IS A SCENARIO SETTING. Scenarios 1 to 3 (origination) keep
//   the twins — nc_<credit key>, FTES, pinned to the nc_*_u units — and the
//   public page keeps reading Scenario 3 until Sam publishes 4. A regression
//   here changes the published page.
//
//   ⚠️ 2. NEVER AN ADVANCE. A count outcome whose measure the daily feed does
//   not carry yet, or whose target waits on a denominator the feed has not
//   carried for that institution, reads TBA and $0 — never the floor, never
//   the full cap (N2 b, the noncredit lane's standing rule).
//
//   ⚠️ 3. THE GATE IS PER LANE. The noncredit conditions hold the noncredit
//   share alone; a credit college's credit share never waits on a strike
//   team, and its noncredit share never waits on the veteran JSTs. A standalone
//   noncredit institution's whole award is its noncredit share, so its
//   conditions ARE the noncredit lane's.
//
//   ⚠️ 4. THE TARGET IS THE RULE, per institution, and the statewide target is
//   the institutions' targets summed (Sam's "sum" ruling, the FTES lanes'
//   too), never a statewide ratio.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_nc_outcomes.test.js`).
const fs = require("fs");
const path = require("path");
const { check, freshDom, boot, consumerSrc, finish, openDrill, colKeys, readCells, D } = require("./lib/cpl_funding_harness.js");

const ROOT = path.join(__dirname, "..");
const flat = (el) => (el ? el.textContent : "").replace(/\s+/g, " ").trim();

// ── A. the wiring, read out of the source ────────────────────────────────────
check("A1: ncPriorities() returns the scenario's own outcomes under the outcomes lane, before any twin pairing",
  /function ncPriorities\(slot\) \{\s*\n\s*\/\/[^\n]*\n\s*if \(ncOutcomesMode\(\)\) return ncOutcomes\(slot\);/.test(consumerSrc));
check("A2: an outcome without a pin is pinned to an UNKNOWN key (the loud bad_src branch), never the prose path",
  /metric_src: String\(o\.metric_src \|\| ""\)\.trim\(\) \|\| "nc_unmapped"/.test(consumerSrc));
check("A3: a count outcome's target is its rule, read before the FTES price path",
  /function prioTarget\(c, p\) \{\s*\n\s*if \(p && p\.unit === "count"\) return countTarget\(c, p\);/.test(consumerSrc));
check("A4: the pay loop holds the noncredit lane on the noncredit share's own gate, the credit lane on the institution's",
  /if \(lane === "nc" \? ncGate\.blocked : gate\.blocked\)/.test(consumerSrc));
check("A5: the count sources are declared on lane nc with unit count, and nc_cdcp is a denominator, never a measure",
  /nc_exh:\s*\{ label: "[^"]+", unit: "count", lane: "nc", milestone: "exhibit", outcome: true,/.test(consumerSrc) &&
  /nc_course: \{ label: "[^"]+", unit: "count", lane: "nc", milestone: "course", outcome: true,/.test(consumerSrc) &&
  /nc_cdcp:\s*\{ label: "[^"]+", unit: "count", lane: "nc", denominator: true,/.test(consumerSrc));
check("A6: a count outcome whose denominator has not arrived is undelivered — never none, never met",
  /p && p\.unit === "count" && countTargetPending\(c, p\)\) return \{ f: 0, status: "undelivered", target: 0, meas: meas \};/.test(consumerSrc));
check("A7: the measure picker still offers units on the credit lane alone (no count source reaches a credit card)",
  /return r && r\.unit === "units" && r\.lane !== "nc";/.test(consumerSrc));

// ── B. the model, one window ─────────────────────────────────────────────────
// A feed carrying the count measures for four institutions (three colleges and
// one standalone through its scoped record) and nothing for the rest.
const PERF = {
  as_of: "2026-10-22", suppress_below: 10,
  statewide: { pe: 1, pa_u: 10, p3_u: 10, nc_exh: 12, nc_cdcp: 500, nc_course: 1 },
  colleges: {
    "Mt San Antonio": { pa_u: 100, p3_u: 50, nc_exh: 5, nc_cdcp: 196, nc_course: 0 },
    "Alameda": { pa_u: 20, p3_u: 5, nc_exh: 0, nc_cdcp: 30, nc_course: 0 },
    "Santa Barbara": { pa_u: 20, p3_u: 5, nc_exh: 7, nc_cdcp: 310, nc_course: 1 }
  },
  feeders: {}, unmatched: {}, vet_star: {},
  origination: { in_scope: { "NOCE": { nc_exh: 3, nc_cdcp: 120, nc_course: 0 } } }
};
const OUTCOMES = {
  ncLane: "outcomes",
  ncOutcomes: { "1": [
    { key: "exh", title: "Exhibits built or adopted", share: 0.5, goals: ["A"], unit_word: "exhibits",
      metric: "Exhibits in MAP built or adopted for the noncredit program's learning", metric_src: "nc_exh",
      target_rule: { kind: "pct_floor_cap", of: "nc_cdcp", pct: 0.05, floor: 2, cap: 10 },
      description: "Standing CPL opportunities for what the noncredit program teaches.",
      strategies: ["Adopt a statewide exhibit for a course the program mirrors"] },
    { key: "course", title: "Noncredit CPL portfolio-development course", share: 0.5, goals: ["A"], unit_word: "courses",
      metric: "A noncredit CPL portfolio-development course chaptered in a CDCP program", metric_src: "nc_course",
      target_rule: { kind: "fixed", n: 1 }, description: "The program's own course." }
  ] },
  ncReported: [{ key: "students", title: "Former noncredit students awarded CPL credit",
    text: "Reported on the annual attestation from the college's SIS." }]
};

const dom = freshDom();
const win = dom.window;
win.CPL_FUNDING_PERF = JSON.parse(JSON.stringify(PERF));
const doc = boot(win);
const T = win.CPL_FUNDING_TAB;

// B0: origination first — the default scenario, as Scenarios 1 to 3 are.
const twins = T._ncPrios("Mt San Antonio", "1");
check("B0: under origination the noncredit lane is still the twins: nc_<credit key>, FTES, pinned to an nc_*_u unit source",
  T._ncLaneMode() === "origination" && Array.isArray(twins) && twins.length > 0 &&
  twins.every((p) => /^nc_p\d$/.test(p.key) && p.unit === "FTES" && /^nc_\w+_u$/.test(p.metric_src)));
const before = T._publicProgress();
check("B0b: under origination there are no noncredit outcome lines, no section and no rows",
  (before.ncPrios || []).length === 0 && doc.querySelectorAll("[data-nccard], .cplfund-ncout, .cplfund-ncoutrow").length === 0);
const beforeSum = before.prios.reduce((s, p) => s + (p.totalPossible || 0), 0);

// Switch the scenario to the outcomes lane.
const shared = T._getShared();
T._setShared(Object.assign({}, shared, OUTCOMES, { pool: Object.assign({}, shared.pool, { nc_portion_pct: 15 }) }));
T.render();
check("B1: the mode is read from the scenario", T._ncLaneMode() === "outcomes" && /releases on the noncredit outcomes/.test(T._ncLaneRule()));

const mtsac = T._ncPrios("Mt San Antonio", "1");
const alloc = T._alloc("Mt San Antonio");
check("B2: two outcomes, counted in their own units, 50/50 of the institution's noncredit share",
  mtsac.length === 2 && mtsac[0].key === "nc_exh" && mtsac[1].key === "nc_course" &&
  mtsac[0].unit === "exhibits" && mtsac[1].unit === "courses" && mtsac.every((p) => p.count === true) &&
  Math.abs(mtsac[0].cap - mtsac[1].cap) < 1 && Math.abs(mtsac[0].cap + mtsac[1].cap - alloc.nc_award) < 1);
const tgt = (name, i) => T._ncPrios(name, "1")[i].target;
check("B3: the exhibits target is the greater of 2 and 5% of CDCP courses, capped at 10 — 196 → 10, 30 → 2 (the floor), 310 → 10 (the cap)",
  tgt("Mt San Antonio", 0) === 10 && tgt("Alameda", 0) === 2 && tgt("Santa Barbara", 0) === 10);
check("B4: a standalone's target reads its scoped record — NOCE 120 CDCP courses → 6",
  tgt("NOCE", 0) === 6 && T._ncPrios("NOCE", "1")[0].status === "earned");
check("B5: the course target is 1 for every institution with a noncredit share",
  ["Mt San Antonio", "Alameda", "Santa Barbara", "NOCE"].every((n) => tgt(n, 1) === 1));
check("B6: earned = cap × actual ÷ target, capped at 100%: 5 of 10 → half; 7 of 10 → 70%; 1 of 1 → the whole",
  Math.abs(mtsac[0].earned - mtsac[0].cap / 2) < 1 && mtsac[1].earned === 0 &&
  (function () { const s = T._ncPrios("Santa Barbara", "1"); return Math.abs(s[0].earned - s[0].cap * 0.7) < 1 && Math.abs(s[1].earned - s[1].cap) < 1; })());
const noRec = T._ncPrios("Allan Hancock", "1");
check("B7: an institution the feed has no denominator for reads TBA — target pending, undelivered, $0 — never the floor, never an advance",
  noRec[0].status === "undelivered" && noRec[0].targetPending === true && noRec[0].earned === 0);
// The measure itself absent from the feed: undelivered for everyone.
const saved = win.CPL_FUNDING_PERF;
win.CPL_FUNDING_PERF = JSON.parse(JSON.stringify(PERF));
delete win.CPL_FUNDING_PERF.statewide.nc_exh;
Object.keys(win.CPL_FUNDING_PERF.colleges).forEach((k) => { delete win.CPL_FUNDING_PERF.colleges[k].nc_exh; });
const absent = T._ncPrios("Mt San Antonio", "1");
check("B8: a measure the feed does not carry at all reads undelivered and $0 for an institution that would otherwise qualify — never an advance",
  absent[0].status === "undelivered" && absent[0].earned === 0 && absent[1].status === "earned");
win.CPL_FUNDING_PERF = saved;
const outs = T._ncOutcomes("1");
const after = T._publicProgress();
check("B9: the statewide target is the institutions' targets summed (10 + 2 + 10 + 6 = 28), and the course target is one per institution with a noncredit share",
  outs[0].statewideTarget === 28 && after.ncPrios[0].target === 28 && after.ncPrios[0].unitWord === "exhibits" &&
  outs[1].statewideTarget === after.ncPrios[1].target && outs[1].statewideTarget > 100);
check("B9b: the course target counts exactly the institutions whose award carries a noncredit share",
  (function () {
    let n = 0;
    D.colleges.forEach((c) => { if (T._ncAward(c.college) > 0) n++; });
    (D.feeders || []).forEach((f) => { if (f.short !== "Mt. SAC NC" && T._ncAward(f.short) > 0) n++; });
    return n === outs[1].statewideTarget;
  })());
const afterCredit = after.prios.reduce((s, p) => s + (p.totalPossible || 0), 0);
const afterNc = after.ncPrios.reduce((s, p) => s + (p.totalPossible || 0), 0);
check("B10: the credit cards' Total Possible is the credit slice alone, and the noncredit outcomes carry the rest — the two together are the whole, as before",
  afterCredit < beforeSum && afterNc > 0 && Math.abs(afterCredit + afterNc - beforeSum) < 2);
check("B11: the explainer's lines carry the mode, the rule, the reported figure and the conditions in words",
  after.ncMode === "outcomes" && /releases on the noncredit outcomes/.test(after.ncRule) &&
  after.ncReported.length === 1 && /noncredit CPL coordinator/.test(after.ncCondWords) &&
  after.ncPrios[0].rule.indexOf("the greater of 2 and 5%") >= 0);

// ── C. the gate, per lane ────────────────────────────────────────────────────
check("C1: before the attestation is read, the noncredit conditions are pending — the share is not held and not met",
  alloc.nc_gate_pending === true && alloc.nc_gate_blocked === false);
T._setElig({
  coordOk: true,
  coord: { "Mt San Antonio": true, "Santa Barbara": true },
  optin: { "Mt San Antonio": { status: "self_attested" }, "Santa Barbara": { status: "self_attested" } },
  ncAttest: { "Mt San Antonio": { college: "Mt San Antonio", fiscal_year: "2026-27", status: "self_attested",
    coordinator_name: "Jane Doe", coordinator_title: "Dean" } }
});
T.render();
const a1 = T._alloc("Mt San Antonio"), a2 = T._alloc("Santa Barbara"), an = T._alloc("NOCE");
check("C2: the confirmation, a published noncredit coordinator and a standing attestation release the noncredit share",
  a1.nc_gate_blocked === false && a1.held_nc === 0 && Math.abs(a1.earned_nc - mtsac[0].earned) < 1);
check("C3: an institution whose credit conditions hold but whose strike team has not attested: the credit share releases, the noncredit share is held",
  a2.gate_blocked === false && a2.earned_cr > 0 && a2.nc_gate_blocked === true && a2.earned_nc === 0 && a2.held_nc > 0);
check("C4: a standalone noncredit institution without the confirmation or the attestation is held whole",
  an.gate_blocked === true && an.nc_gate_blocked === true && an.earned_total === 0 && an.held_nc > 0);
const cm = T._conditions("Mt San Antonio"), cn = T._conditions("NOCE");
check("C5: a credit college lists the noncredit conditions beside its own, for its noncredit share alone",
  cm.items.map((i) => i.kind).indexOf("nc_coord") < 0 && cm.ncItems.map((i) => i.kind).join(",") === "nc_coord,nc_team" &&
  cm.ncItems.every((i) => i.met) && cm.ncBlocked === false && cm.ncMode === "outcomes");
check("C6: a standalone's conditions ARE the noncredit lane's — the confirmation, the coordinator and the strike team; the MAP coordinator and the certificates condition retire",
  cn.items.map((i) => i.kind).join(",") === "part,nc_coord,nc_team" && cn.ncItems.length === 0 && cn.blocked === true);

// ── D. the surfaces ──────────────────────────────────────────────────────────
const keys = colKeys(doc);
const d1 = openDrill(win, doc, "c:Mt San Antonio");
const outRows = d1.rows.filter((r) => r.classList.contains("cplfund-ncoutrow"));
check("D1: the institution's drill-in carries one row an outcome after the credit rows, in the table's own columns",
  outRows.length === 2 && d1.rows.indexOf(outRows[0]) === d1.rows.length - 2);
const c1 = readCells(keys, outRows[0]);
check("D2: NC-1 reads Max NC Funds with its target beneath, Curr NC Funds with its actual beneath, the credit cells a dash",
  /^NC-1: Exhibits built or adopted/.test(c1.college.text) && c1.nc_award.fig === "$52,389" && c1.nc_award.line === "Target 10 exhibits" &&
  c1.nc_current.fig === "$26,195" && c1.nc_current.line === "Actual 5 exhibits" && c1.cr_award.text === "—" &&
  c1.total.fig === "$52,389" && c1.current_total.line === "Actual 5 exhibits" && !c1.nc_current.gated);
check("D3: the hovers say how the target was reached and what remains",
  /the greater of 2 and 5% of its CDCP noncredit courses, capped at 10 \(196 courses in COCI\)/.test(c1.nc_award.tip) &&
  /5 exhibits to the target/.test(c1.nc_current.tip));
check("D4: the reported figure is a note under the rows, funded by nothing",
  d1.notes.some((n) => /Reported, not funded: Former noncredit students awarded CPL credit/.test(flat(n))));
check("D5: the conditions line shows the noncredit share's own, with the published coordinator's name and title",
  /Noncredit share:/.test(flat(d1.first)) && /Noncredit CPL coordinator published/.test(flat(d1.first)) &&
  /Noncredit CPL Coordinator: Jane Doe \(Dean\)/.test(flat(d1.first)) && /Strike team attested for 2026-27/.test(flat(d1.first)));
const d2 = openDrill(win, doc, "c:Santa Barbara");
const c2 = readCells(keys, d2.rows.filter((r) => r.classList.contains("cplfund-ncoutrow"))[0]);
check("D6: a held noncredit share reads gray in its Curr cells while the credit cells do not",
  c2.nc_current.gated === true && c2.current_total.gated === true && !readCells(keys, d2.rows[0]).cr_current.gated);
const dn = openDrill(win, doc, "c:NOCE");
check("D7: a standalone's expand is its noncredit outcomes under a band of their own, its conditions the noncredit lane's",
  /^Noncredit outcomes/.test(flat(dn.band)) && dn.rows.length === 2 && dn.rows.every((r) => r.classList.contains("cplfund-ncoutrow")) &&
  /Confirmation not yet on file/.test(flat(dn.first)) && /Noncredit CPL coordinator not yet attested/.test(flat(dn.first)) &&
  /Strike-team attestation not yet on file/.test(flat(dn.first)));
const ds = openDrill(win, doc, "sys");
const sysOut = ds.rows.filter((r) => r.classList.contains("cplfund-ncoutrow"));
const s1 = sysOut.length ? readCells(keys, sysOut[0]) : null;
check("D8: the Statewide expand sums the institutions: the target 28 exhibits, the actual the feed's statewide figure, the funds what institutions receive",
  !!s1 && s1.nc_award.line === "Target 28 exhibits" && s1.nc_current.line === "Actual 12 exhibits" && s1.nc_current.fig === "$26,195");
const feet = Array.from(doc.querySelectorAll(".cplfund-dtl-foot")).map(flat);
check("D9: the drill-ins' closing line states the outcomes rule, never the origination one",
  feet.some((f) => /releases on the noncredit outcomes/.test(f)) && !feet.some((f) => /originate/.test(f)));
const cards = doc.querySelectorAll("[data-nccard]");
const section = doc.querySelector(".cplfund-ncout");
check("D10: the outcome cards stand in their own section under the priority cards, two of them, with the rule and the conditions in words",
  cards.length === 2 && !!section && /Noncredit outcomes/.test(flat(section)) &&
  /waits on its own minimum conditions: the institution's confirmation, a noncredit CPL coordinator assigned, published and on the college CPL Strike Team, which meets regularly to support CPL procedures and students and a strike-team attestation renewed each year/.test(flat(section)) &&
  /Reported, not funded: Former noncredit students awarded CPL credit/.test(flat(section)));
check("D11: NC-1's card names its target as the institutions' sum and its share of the noncredit share; NC-2 counts courses",
  /NC-1/.test(flat(cards[0])) && /28 exhibits/.test(flat(cards[0])) && /50% of each institution's noncredit share/.test(flat(cards[0])) &&
  /NC-2/.test(flat(cards[1])) && /courses/.test(flat(cards[1])));
check("D12: the credit cards are untouched in number", doc.querySelectorAll("[data-priocard]").length === before.prios.length);
const csv = T._csv();
const head = csv.split("\n")[1] || "";
const line = csv.split("\n").find((l) => /^\d+,Mt San Antonio,/.test(l)) || "";
check("D13: the CSV carries a target and an actual per outcome, in the outcome's unit, after the credit priorities' columns",
  /NC-1 target \(exhibits\),NC-1 actual,NC-2 target \(courses\),NC-2 actual/.test(head) && /,10,5,1,0,/.test(line));
check("D13b: the Noncredit Funding Rules fold is gone under the outcomes lane; the cards carry the rules (Sam, 2026-10-23)",
  !doc.querySelector(".cplfund-ncrules") && /releases on the noncredit outcomes/.test(flat(section)));
check("D14: no origination sentence anywhere on the tab under the outcomes lane",
  !/originat/i.test(doc.body.textContent));

// ── E. the curator's edits write the scenario's own list ─────────────────────
win.CPL_SESSION = {
  get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
  isFresh: function () { return true; },
  authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; }
};
T.render();
const ta = doc.querySelector('textarea[data-edit="nc-description"][data-idx="0"]');
check("E1: signed in, the outcome card's description, title, metric and share are editable in place",
  !!ta && !!doc.querySelector('input[data-edit="nc-title"][data-idx="0"]') &&
  !!doc.querySelector('textarea[data-edit="nc-metric"][data-idx="1"]') && !!doc.querySelector('input[data-edit="nc-share"][data-idx="1"]'));
if (ta) {
  ta.value = "The program's standing CPL opportunities, counted in MAP.";
  ta.dispatchEvent(new win.Event("change", { bubbles: true }));
}
const storedRows = (T._getShared().ncOutcomes || {})["1"] || [];
check("E2: the edit lands on the scenario's list, the other fields and the other outcome untouched",
  storedRows.length === 2 && storedRows[0].description === "The program's standing CPL opportunities, counted in MAP." &&
  storedRows[0].metric_src === "nc_exh" && storedRows[0].target_rule.cap === 10 && storedRows[1].key === "course");
win.CPL_SESSION = null;

// ── F. back to origination: the mode is the scenario's, nothing leaks ────────
const back = Object.assign({}, T._getShared());
delete back.ncLane; delete back.ncOutcomes; delete back.ncReported;
T._setShared(back);
T.render();
const twins2 = T._ncPrios("Mt San Antonio", "1");
check("F1: without the setting the lane is origination again — the twins, no section, no rows, the origination rule back",
  T._ncLaneMode() === "origination" && twins2.every((p) => /^nc_p\d$/.test(p.key) && p.unit === "FTES") &&
  doc.querySelectorAll("[data-nccard], .cplfund-ncout, .cplfund-ncoutrow").length === 0 &&
  /originate from a noncredit landing page/.test(T._ncLaneRule()));
// The committed Scenario 3 (the published one) renders as it did.
const fx = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/fixtures/cpl_funding_config_de95c290.json"), "utf8"));
const s3 = fx.projects["cpl-implementation"].scenarios["Scenario 3"];
T._setShared(JSON.parse(JSON.stringify(s3)));
T.render();
const pp3 = T._publicProgress();
check("F2: the committed Scenario 3 is origination: twins pinned to the nc_* units, no outcome lines, the credit cards carry both shares",
  T._ncLaneMode() === "origination" && (pp3.ncPrios || []).length === 0 && pp3.ncMode === "origination" &&
  T._ncPrios("Mt San Antonio", "1").every((p) => /^nc_\w+_u$/.test(p.metric_src) && p.status === "undelivered") &&
  doc.querySelectorAll("[data-nccard]").length === 0);

// ── G. the explainer paints the lane from the payload ───────────────────────
(function () {
  const html = fs.readFileSync(path.join(ROOT, "funding-model/index.html"), "utf8");
  const { JSDOM } = require("jsdom");
  const d2 = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/funding-model/" });
  const w2 = d2.window;
  w2.CPL_FUNDING_NO_REMOTE = true;
  w2.scrollTo = function () {};
  w2.CPL_FUNDING_PERF = JSON.parse(JSON.stringify(PERF));
  w2.eval(fs.readFileSync(path.join(ROOT, "cpl_funding_data.js"), "utf8"));
  w2.eval(fs.readFileSync(path.join(ROOT, "funding_model_payload.js"), "utf8"));
  w2.eval(fs.readFileSync(path.join(ROOT, "cpl_funding.js"), "utf8"));
  Array.from(d2.window.document.querySelectorAll("script:not([src])")).forEach((s) => { w2.eval(s.textContent); });
  const doc2 = w2.document, T2 = w2.CPL_FUNDING_TAB;
  const paint = () => w2.CPL_PAINT_EXPLAINER(w2.CPL_FUNDING_EXPLAINER.buildPayload(T2, w2.CPL_FUNDING));
  paint();
  check("G1: under origination the explainer's noncredit passage says origination and paints no outcome block",
    /originates in the noncredit program/.test(flat(doc2.getElementById("nc-body"))) &&
    doc2.querySelectorAll("#nc-outcomes .prio").length === 0);
  const sh2 = T2._getShared();
  T2._setShared(Object.assign({}, sh2, OUTCOMES, { pool: Object.assign({}, sh2.pool, { nc_portion_pct: 15 }) }));
  paint();
  const D2 = w2.CPL_FUNDING_EXPLAINER.buildPayload(T2, w2.CPL_FUNDING);
  check("G2: the payload carries the lane: the mode, the outcomes with their statewide targets, the rule, the reported figure, the conditions in words",
    D2.ncMode === "outcomes" && D2.ncOutcomes.length === 2 && D2.ncOutcomes[0].statewideTarget === 28 &&
    /releases on the noncredit outcomes/.test(D2.ncRule) && D2.ncReported.length === 1 && /strike-team/.test(D2.ncCondWords) &&
    D2.progress.ncPrios.length === 2);
  const blocks = doc2.querySelectorAll("#nc-outcomes .prio");
  check("G3: the page paints one block an outcome under the priority cards, with the target, the rule and the progress",
    blocks.length === 2 && /NC-1 · Exhibits built or adopted/.test(flat(blocks[0])) && /50% of the noncredit share/.test(flat(blocks[0])) &&
    /Target: 28 exhibits statewide\. The institutions' targets added up; each is the greater of 2 and 5% of its CDCP noncredit courses, capped at 10\./.test(flat(blocks[0])) &&
    /Progress: MAP records demonstrate/.test(flat(blocks[0])) && /Target: 1[0-9][0-9] courses statewide/.test(flat(blocks[1])));
  check("G4: the noncredit passage follows the mode — the outcomes rule and the conditions, no origination sentence, the reported line in its list",
    /releases on the noncredit outcomes/.test(flat(doc2.getElementById("nc-body"))) &&
    /waits on its own minimum conditions: the institution's confirmation, a noncredit CPL coordinator assigned, published and on the college CPL Strike Team, which meets regularly to support CPL procedures and students and a strike-team attestation renewed each year/.test(flat(doc2.getElementById("nc-body"))) &&
    !/originat/i.test(flat(doc2.getElementById("nc-body"))) && !/originat/i.test(flat(doc2.getElementById("nc-list"))) &&
    /Reported, not funded — Former noncredit students awarded CPL credit/.test(flat(doc2.getElementById("nc-list"))));
  const reqs = Array.from(doc2.querySelectorAll("#req-list li")).map(flat);
  check("G5: the minimum conditions list ends with the noncredit share's two, each with its count line once the attestation is read",
    reqs.length >= 2 && /For the noncredit share of an award: a noncredit CPL coordinator assigned, published and on the college CPL Strike Team/.test(reqs[reqs.length - 2]) &&
    /For the noncredit share of an award: a strike-team attestation renewed each year/.test(reqs[reqs.length - 1]));
  T2._setElig({ coordOk: true, coord: {}, optin: {}, ncAttest: { "Mt San Antonio": { status: "self_attested", coordinator_name: "Jane Doe" } } });
  paint();
  const reqs2 = Array.from(doc2.querySelectorAll("#req-list li")).map(flat);
  check("G6: the count lines name the institutions with a noncredit share — one published, one attested",
    /1 of \d+ institutions with a noncredit share have one published\./.test(reqs2[reqs2.length - 2]) &&
    /1 of \d+ institutions with a noncredit share have attested\./.test(reqs2[reqs2.length - 1]));
})();

finish();

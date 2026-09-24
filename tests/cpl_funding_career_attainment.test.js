// CPL Implementation Funding — Priority 4 (career attainment) and the three
// card rulings Sam made beside it, 2026-09-22.
//
// His words, verbatim:
//   "1. Change P2 B&C Completion to B Completion with Counseling (read from
//    live tab--also designated where the metric is derived) 2. Change P3 to
//    Completion with Transcription (read from live tab) 3. Add P4 with the same
//    ability to edit as other P cards. Note the Designate Activities button on
//    this card isn't working for me"
// and earlier the same day, on goal (C): "we can use EDD wage data to measure
// this ... This would not be reported by the colleges but instead measured by
// the CO and reflected on our funding model with periodic updates (imports) of
// the data."
//
// What each block protects:
//   1. P4 is a real priority with every control the other cards carry, and it
//      changes no award until Sam gives it a share.
//   2. The live shape: his stored order [0, 2, 1] predates P4 and must survive
//      its arrival; each card is named by its own live title; the counselor
//      measure serves (B) alone and the career measure serves (C).
//   3. The Chancellor's Office measure never reads as MAP's daily feed, counts
//      $0 until its first import, and is measured the day the import lands.
//   4. Designate: the button reads its OWN card's list, a signed-in write is
//      not shadowed by this browser's held layer, and a click with nothing
//      chosen says so. The API logs for 2026-09-22 show Sam's Designate clicks
//      sent no save at all, so the silent return is the likeliest thing he met.
//
// Run from repo root: `node tests/cpl_funding_career_attainment.test.js`.
const { check, freshDom, boot, commit, click, D, consumerSrc, finish } = require("./lib/cpl_funding_harness.js");

const flat = (el) => (el ? el.textContent : "").replace(/\s+/g, " ").trim();
const cardAt = (doc, i) => doc.querySelector('#cplFundingMount .cplfund-prio .p[data-priocard="' + i + '"]');

function reviewerSession() {
  return {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; }
  };
}
// A small stand-in for the Activities register (the harness carries none).
function registerStub() {
  return { projects: [
    { id: "1.1", name: "MAP Platform Development", activity: "Activity 1", status: "On Track", pct: 70, update: "" },
    { id: "1.4", name: "California Credential Registry", activity: "Activity 1", status: "Foundational Year", pct: 15, update: "" },
    { id: "4.2", name: "Apprenticeship Sprint", activity: "Activity 4", status: "In Progress", pct: 35, update: "" }
  ] };
}
// The LIVE SHAPE on the day P4 shipped, read from cpl_funding_config
// (2026-09-23): Sam's three relabelled, pinned priorities at 33 / 33 / 34 and
// factor 0.5, the [0, 2, 1] order, and NO entry for Priority 4 — which
// inherits the bake (0%, factor 1.0) until a curator edits it.
function liveShape() {
  return {
    priorityOrder: [0, 2, 1],
    yearPriorities: { "1": {
      "0": { title: "Outreach", share: 0.33, factor: 0.5, metric_src: "ppa_u",
             metric: "Applied CPL Units (FTES) originating from either CPL Portal, College CPL Landing Page, or batch upload" },
      "1": { title: "Completion with Transcription", share: 0.33, factor: 0.5, metric_src: "p3_u",
             metric: "Transcribed CPL Units measured in FTES" },
      "2": { title: "Completion with Counseling", share: 0.34, factor: 0.5, metric_src: "pac_u",
             metric: "Applied CPL units (FTES) for students  with Counselor step checked" }
    } }
  };
}
function mount(opts) {
  opts = opts || {};
  const { window } = freshDom();
  if (opts.perf) window.CPL_FUNDING_PERF = opts.perf;
  if (opts.register) window.CPL_DATA = registerStub();
  const doc = boot(window);
  if (opts.signedIn) window.CPL_SESSION = reviewerSession();
  const T = window.CPL_FUNDING_TAB;
  T._setShared(Object.assign(liveShape(), opts.shared || {}));
  if (opts.scenario) T._setScenario(opts.scenario);
  T.render();
  return { window, doc, T };
}
// The college drill-in, read BY HEADER (the metric-pin suite's rule).
function openDetail(window, doc, name) {
  const find = () => Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
    .find((r) => r.textContent.indexOf(name) !== -1);
  const row = find();
  if (!row) return null;
  row.querySelector(".cplfund-caret").dispatchEvent(new window.Event("click", { bubbles: true }));
  const row2 = find();
  const det = row2 && row2.nextElementSibling;
  return det && det.classList.contains("cplfund-detail") ? det : null;
}
// The CREDIT table: since 2026-09-24 the drill-in carries one table per lane
// (Sam's CR / NC 7.9a/b), and the checks below read the credit measures.
function detRows(det) {
  if (!det) return [];
  const trs = Array.from(det.querySelectorAll(".cplfund-dtl-table.cplfund-dtl-cr tr"));
  const keys = Array.from(trs[0].querySelectorAll("th")).map((th) => flat(th).toLowerCase());
  return trs.slice(1).map((tr) => {
    const out = {};
    Array.from(tr.querySelectorAll("td")).forEach((td, i) => { out[keys[i]] = flat(td); });
    return out;
  });
}
const goalPickText = (card) => {
  const sel = card && card.querySelector("select.cplfund-cardgoal-sel");
  return sel && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex].text : "";
};
// ⭐ THE CARD HEAD SAYS EACH THING ONCE (Sam, 2026-09-24: "I like your
// simplified priority card!"). In the internal view the outcome IS the picker
// in the heading ("Priority 1 · (A) Access"), so its key and name are read
// from the picker's face; the reader view keeps a key span beside the name.
const goalKeyText = (card) => {
  const key = card && card.querySelector(".cplfund-cardgoal-key");
  const src = key ? flat(key) : goalPickText(card);
  return (src.match(/\([A-D]\)/g) || []).join(" + ");
};
// A card's title: the custom title's field when it has one; otherwise the
// outcome's own name, which the heading shows in place of a matching title.
const titleText = (card) => {
  const inp = card && card.querySelector('h4 input[data-edit="prio-title"]');
  if (inp) return inp.value;
  const name = card && card.querySelector(".cplfund-cardhead-name");
  return name ? flat(name) : goalPickText(card).replace(/^(\([A-D]\)\s*\+?\s*)+/, "");
};

// ── 1. P4 is a real priority, and it moves no award until it has a share ────
{
  ["1", "2"].forEach(function (slot) {
    const p4 = (D.year_priorities[slot] || [])[3];
    check("1a: the data carries Priority 4 in Year " + slot + " — career attainment, 0% share, pinned to ca_u in CPL FTES",
      !!p4 && p4.key === "p4" && p4.title === "Career attainment" && p4.share === 0 &&
      p4.metric_src === "ca_u" && p4.unit === "ftes");
  });
  check("1b: ca_u and its noncredit twin are declared, CO-measured, on their own career milestone",
    /ca_u:\s*\{[^}]*milestone: "career",\s*origin: "co"/.test(consumerSrc) &&
    /nc_ca_u: \{ unit: "units", lane: "nc", milestone: "career", origin: "co"/.test(consumerSrc));

  const { window, doc, T } = mount({ signedIn: true, register: true });
  const p1 = cardAt(doc, 0), p4 = cardAt(doc, 3);
  check("1c: four priority cards render on the live shape", doc.querySelectorAll(".cplfund-prio .p").length === 4);
  // "the same ability to edit as other P cards": every kind of control the
  // first card carries, the fourth carries too.
  const controls = (card) => {
    const out = new Set();
    Array.from(card.querySelectorAll("[data-edit]")).forEach((el) => out.add("edit:" + el.getAttribute("data-edit")));
    // The title control is Rename when the card has no custom title, and the
    // field itself once it has one — the same control in two states.
    if (out.delete("edit:prio-title") || card.querySelector("[data-cardrename]")) out.add("title");
    ["data-priosrc", "data-stratadd", "data-priogoal", "data-priodrag", "data-priopos", "data-projsel", "data-projadd"]
      .forEach((a) => { if (card.querySelector("[" + a + "]")) out.add(a); });
    return out;
  };
  const c1 = controls(p1), c4 = controls(p4);
  const missing = Array.from(c1).filter((k) => !c4.has(k));
  check("1d: Priority 4 carries every control Priority 1 does (title, share, factor, measure, outcome, strategies, order, designate)",
    c1.size >= 6 && missing.length === 0);
  check("1e: its heading names Career attainment, with Rename for a title of its own", !!p4 &&
    titleText(p4) === "Career attainment" && !!p4.querySelector("[data-cardrename]"));
  // A 0% share holds no funding, so every institution's award is what the
  // three funded priorities make it.
  const ps = T._prios(D.colleges[0].college, "1");
  check("1f: at 0% it caps at $0 for every institution", D.colleges.every((c) => {
    const p = T._prios(c.college, "1").find((x) => x.src === 3);
    return p && p.cap === 0;
  }));
  check("1g: and the shares still balance at 100% — no award moves", Math.abs(ps.reduce((s, p) => s + p.share, 0) - 1) < 1e-9);
  // An edit lands on P4's SOURCE index, whatever position it holds.
  commit(window, cardAt(window.document, 3).querySelector('[data-edit="share"]'), "10");
  const stored = T._getShared().yearPriorities["1"]["3"];
  check("1h: editing P4's share writes to its own stored slot (index 3)", !!stored && Math.abs(stored.share - 0.1) < 1e-9);
}

// ── 2. the live shape: order, names, and which goal each measure serves ──────
{
  const { doc, T } = mount({ signedIn: true });
  const srcs = T._prios(D.colleges[0].college, "1").map((p) => p.src).join("");
  check("2a: Sam's stored [0, 2, 1] keeps its order and Priority 4 joins at the end", srcs === "0213");
  const names = [0, 1, 2, 3].map((i) => titleText(cardAt(doc, i)));
  check("2b: each card is named by its own live title",
    names.join("|") === "Outreach|Completion with Counseling|Completion with Transcription|Career attainment");
  check("2b2: the head never repeats the outcome's name — the picker says it, and no name span or matching title sits beside it",
    [0, 1, 2, 3].every((i) => !cardAt(doc, i).querySelector(".cplfund-cardhead .cplfund-cardhead-name")) &&
    !cardAt(doc, 3).querySelector('.cplfund-cardhead input[data-edit="prio-title"]'));
  check("2c: Completion with Counseling serves (B) alone — the counselor step no longer claims (C)",
    goalKeyText(cardAt(doc, 1)) === "(B)");
  check("2d: Completion with Transcription serves (B)", goalKeyText(cardAt(doc, 2)) === "(B)");
  check("2e: Career attainment serves (C), derived from its measure",
    goalKeyText(cardAt(doc, 3)) === "(C)" && goalPickText(cardAt(doc, 3)) === "(C) Career attainment" &&
    (cardAt(doc, 3).querySelector("select.cplfund-cardgoal-sel") || {}).value === "derived");
  check("2f: the source says so — accepted is (B), career is (C)",
    /ms === "accepted"\) return \{ keys: \["B"\], derived: true \}/.test(consumerSrc) &&
    /ms === "career"\) return \{ keys: \["C"\], derived: true \}/.test(consumerSrc));
  // A card with no title keeps the statute's short name for its goal.
  const T2 = mount({ shared: { yearPriorities: { "1": Object.assign(liveShape().yearPriorities["1"],
    { "0": { title: "", share: 0.33, factor: 0.5, metric: "Eligible CPL Units measured in FTES", metric_src: "pe_u" } }) } } });
  check("2g: an untitled card keeps the goal's statutory short name", /Access/.test(goalPickText(cardAt(T2.doc, 0))));
}

// ── 3. the Chancellor's Office measure, before and after its first import ────
{
  // Before: MAP's artifact is loaded and carries no ca_u.
  const perf = { as_of: "2026-09-22", suppress_below: 5,
    statewide: { ppa_u: 900, p3_u: 70000, pac_u: 20000 },
    colleges: { "Laney": { ppa_u: 30, p3_u: 700, pac_u: 200 } }, unmatched: {} };
  const { window, doc, T } = mount({ perf: perf, signedIn: true });
  const rows = detRows(openDetail(window, window.document, "Laney"));
  const r4 = rows[3] || {};
  check("3a: before the first import, P4's drill-in row reads awaiting measurement at $0 — never a full cap",
    rows.length === 4 && /awaiting measurement/i.test(r4["actual ftes"] || "") && r4["actual funds"] === "$0");
  const t4 = flat(cardAt(doc, 3));
  check("3b: its card says who measures it", /Awaiting measurement\. The Chancellor.s Office measures this outcome from EDD wage records/.test(t4));
  check("3c: and never points at MAP's refresh or a MAP feed key",
    !/daily data refresh|Awaiting actuals/i.test(t4) &&
    !/MAP feed key: ca_u/.test(cardAt(doc, 3).innerHTML));
  const diag = flat(doc.querySelector(".cplfund-metricdiag") || doc.getElementById("cplFundingMount"));
  check("3d: the curator's metric diagnostic names the Chancellor's Office, not the daily feed, for ca_u",
    /Awaiting measurement\. The Chancellor.s Office measures it from EDD wage records/.test(diag) &&
    !/daily MAP feed does not carry this measure/.test(diag));
  // After: the import lands in the published artifact, beside MAP's keys.
  const perf2 = JSON.parse(JSON.stringify(perf));
  perf2.statewide.ca_u = 30000;
  perf2.colleges.Laney.ca_u = 600;
  // The block funding/_build_funding_performance.py writes beside the units.
  perf2.career_attainment = { as_of: "2027-02-01", source: "CCCCO Research, EDD wage records",
    definition: "Employed in the second fiscal quarter after the CPL award", colleges: 1, unmatched: [] };
  const m2 = mount({ perf: perf2 });
  const q4 = m2.T._prios("Laney", "1").find((p) => p.src === 3);
  check("3e: the day the import lands, P4 is measured with no code change", !!q4 && q4.status !== "undelivered" && q4.lane !== "nc");
  const t4b = flat(cardAt(m2.doc, 3));
  check("3e2: the card dates the figure by the Chancellor's Office import, never MAP's pull",
    /per the Chancellor.s Office import \(as of 2027-02-01\)/.test(t4b) && !/per MAP/.test(t4b));
  const cEvid = flat(m2.doc.getElementById("cplfund-goal-C"));
  check("3f: and goal (C) reads performance-measured per the Chancellor's Office import, never the daily MAP feed",
    /Performance-measured/.test(cEvid) && /per the Chancellor.s Office import/.test(cEvid) && !/daily MAP feed/.test(cEvid));
}

// ── 4. Designate ──────────────────────────────────────────────────────────────
{
  const { window, doc, T } = mount({ signedIn: true, register: true });
  // (a) two cards serve (B); the SECOND card's button reads the second list.
  const bSels = Array.from(doc.querySelectorAll('[data-projsel="B"]'));
  check("4a: two cards serve (B), so two (B) pickers render", bSels.length === 2);
  Array.from(bSels[1].options).forEach((o) => { o.selected = o.value === "4.2"; });
  click(window, bSels[1].closest(".cplfund-rprio-add").querySelector('[data-projadd="B"]'));
  check("4b: the second card's Designate designates from ITS OWN list",
    ((T._getShared().projectGoals || {})["4.2"] || []).indexOf("B") >= 0);
  // (c) a click with nothing chosen says so, and saves nothing.
  const before = JSON.stringify(T._getShared().projectGoals || {});
  const dBox = doc.querySelector('[data-rprio="D"] .cplfund-rprio-add');
  click(window, dBox.querySelector('[data-projadd="D"]'));
  const dHint = doc.querySelector('[data-rprio="D"] .cplfund-multihint');
  check("4c: Designate with nothing chosen says what to do, on that card",
    !!dHint && /Choose one or more activities in the list, then Designate selected/.test(dHint.textContent));
  check("4d: ...announced to a screen reader, and nothing is saved",
    dHint && dHint.getAttribute("role") === "status" && JSON.stringify(T._getShared().projectGoals || {}) === before);
  const hids = Array.from(doc.querySelectorAll(".cplfund-multihint")).map((h) => h.id);
  check("4e: every picker's hint has its own id", hids.length >= 4 && new Set(hids).size === hids.length);
}
{
  // (b) the browser's held layer: signed out, this browser released 1.1;
  // signed in, designating 1.1 must show — the newest write wins.
  const { window, doc, T } = mount({ signedIn: true, register: true,
    scenario: { projectGoals: { "1.1": [] } } });
  const dSel = doc.querySelector('[data-rprio="D"] [data-projsel="D"]');
  Array.from(dSel.options).forEach((o) => { o.selected = o.value === "1.1"; });
  click(window, doc.querySelector('[data-rprio="D"] [data-projadd="D"]'));
  const list = window.document.querySelector('[data-rprio="D"] .cplfund-rprio-list');
  check("4f: a signed-in designation is not shadowed by this browser's held release",
    !!list && /MAP Platform Development/.test(list.textContent));
  const held = (T._getScenario() || {}).projectGoals || {};
  check("4g: ...because the held copy for that one project is dropped, and the write lands in the shared layer",
    !("1.1" in held) && (T._getShared().projectGoals["1.1"] || []).indexOf("D") >= 0);
}

finish();

// CPL Implementation Funding — the College Dashboard (Sam's mockup rounds,
// 2026-09-28; mockup https://claude.ai/artifact/2V1aWwtjwob5gSM6TEkfyQ).
//
// What Sam approved, and what each block below guards:
//
//   1. THE COLUMNS. Institution · Max CR Funds · Curr CR Funds · Max NC Funds ·
//      Curr NC Funds · Total Funds · Curr Total Funds. #, District, the FTES
//      pair and Working adults stay in the Columns menu, hidden by default,
//      under a NEW store key: Sam's browser held v1 prefs hiding "total", which
//      would have hidden the new Total Funds on arrival.
//   2. THE CURR FIGURES ARE THE RELEASED ONES — what an institution meeting all
//      three minimum conditions receives, $0 for one meeting none — coarse on
//      the public page, and the Statewide row's detail adds the SAME figure
//      (methodology-a-summary-must-share-the-unit-of-its-detail: before this
//      port the statewide tables summed held funding and read $758,725 beneath
//      a row reading $338).
//   3. THE CONDITIONS SPEAK ONE LANGUAGE: the pie's slice hovers and the
//      drill-in's Minimum Conditions line come from one wording, so they cannot
//      disagree; the noncredit-only institutions name their own third
//      condition; no reserve words anywhere.
//   4. THE CO'S CONTROLS: Reject on a self-attestation, Revoke on a legacy
//      confirmed row, nothing else — Mark confirmed and the CO Confirm are gone
//      — and a curator previewing Public sees none of them.
//   5. The Confirm chip follows the curator's deadline; TBA reads wherever a
//      measure has yet to arrive; district subtotals keep one cell per column;
//      the CSV carries the Curr twins.
//
// ⚠️ THE GATE CHANGED WHILE THIS FILE WAS WRITTEN (#1726, 2026-09-28): funding
// now waits on all three conditions, where it waited on the coordinator and the
// confirmation alone. No assertion here depends on an institution that meets
// exactly two: the qualifying one meets all three and the held one meets none,
// so both readings hold.
//
// Windows: 8 booted (≈ 400 MB; the harness budget note).
// Run from repo root: `npm test` (or `node tests/cpl_funding_college_dashboard.test.js`).
const H = require("./lib/cpl_funding_harness.js");
const { freshDom, boot, click, check, finish, consumerSrc, greenSlices, pieSlices } = H;

const QUAL = "Laney";      // meets all three conditions, measured CPL
const HELD = "Butte";      // meets none, measured CPL (its funding is held)
const NCO = "Calbright";   // noncredit-only: its third condition is certificates
const VET_REQ = "Minimum of 75% of enrolled veteran Joint Services Transcripts uploaded in MAP";

function reviewerSession() {
  return {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; }
  };
}
// One fixture for every block: three credit priorities pinned to a unit
// measure both institutions report, the veteran condition switched on, and
// eligibility seeded so QUAL meets all three and HELD none.
function setup(opts) {
  opts = opts || {};
  const { window } = freshDom();
  if (opts.public) window.CPL_FUNDING_PUBLIC = true;
  if (opts.signedIn) window.CPL_SESSION = reviewerSession();
  if (opts.seedV1) window.localStorage.setItem("cplfund_cols_v1", JSON.stringify({ college: { total: true } }));
  window.CPL_FUNDING_PERF = { as_of: "2026-09-28", suppress_below: 10,
    statewide: { pa_u: 300000 },
    colleges: { [QUAL]: { pa_u: 900 }, [HELD]: { pa_u: 600 } },
    feeders: { [NCO]: { pe: 12 } },
    unmatched: {},
    vet_star: { [QUAL]: true, [HELD]: false }, vet_star_as_of: "2026-09-28", vet_star_threshold: 0.75 };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared(Object.assign({
    // Combined funding, as the live model runs: a cell reads the window.
    disbursement: "frontload",
    participationDeadline: opts.deadline || "2099-11-01",
    extraReqs: [VET_REQ],
    yearPriorities: { "1": {
      "0": { metric: "Applied CPL Units as FTES", metric_src: "pa_u" },
      "1": { metric: "Applied CPL Units as FTES", metric_src: "pa_u" },
      "2": { metric: "Applied CPL Units as FTES", metric_src: "pa_u" } } }
  }, opts.shared || {}));
  T._setElig({ coordOk: true, coord: { [QUAL]: true },
    optinRow: Object.assign({ [QUAL]: { college: QUAL, status: "self_attested", requested_at: "2026-09-28T21:00:00Z" } }, opts.optinRow || {}),
    optinReview: opts.optinReview || [
      { college: QUAL, name: "Sample Attester", title: "VPAA", email: "attester@example.edu",
        status: "self_attested", requested_at: "2026-09-28T21:00:00Z" }],
    asOf: "2026-09-28" });
  if (opts.group) T._state.group = "district";
  T.render();
  return { window, doc, T };
}
const rowOf = (doc, name) => doc.querySelector('#cplFundTable tr[data-id="c:' + name + '"]');
const headKeys = (doc) => Array.from(doc.querySelectorAll("#cplFundTable thead th")).map((th) => th.getAttribute("data-sort"));
const cellByKey = (doc, tr, key) => tr && tr.cells[headKeys(doc).indexOf(key)];
const money = (v) => "$" + Math.round(v).toLocaleString("en-US");
const num = (t) => Number(String(t || "").replace(/[^\d.]/g, "")) || 0;
// Opens a row's drill-in and returns it. Idempotent: the caret TOGGLES and the
// open set survives a render, so a second call on an open row must not click
// (it would close the drill-in and leave every check after it reading nothing).
function openRow(window, doc, id) {
  const find = () => doc.querySelector('#cplFundTable tr[data-id="' + id + '"]');
  const detOf = (tr) => {
    const det = tr && tr.nextElementSibling;
    return det && det.classList.contains("cplfund-detail") ? det : null;
  };
  const tr = find();
  if (!tr) return null;
  if (!detOf(tr)) click(window, tr.querySelector(".cplfund-caret"));
  return detOf(find());
}
// A lane table's Actual Funds column, summed: header lookup, never position.
function laneActualSum(det, cls) {
  const tbl = det && det.querySelector("table." + cls);
  if (!tbl) return null;
  const trs = Array.from(tbl.querySelectorAll("tr"));
  const heads = Array.from(trs[0].querySelectorAll("th")).map((th) => th.textContent.trim().toLowerCase());
  const i = heads.indexOf("actual funds");
  return trs.slice(1).reduce((s, tr) => s + num((tr.querySelectorAll("td")[i] || {}).textContent), 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. The column set, its order, the default hides and the v2 store
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window, doc } = setup({ seedV1: true });
  const keys = headKeys(doc);
  check("1a: the columns in Sam's order, the Elig column gone",
    JSON.stringify(keys) === JSON.stringify(["order", "college", "district", "cr_ftes", "nc_ftes",
      "cr_award", "cr_current", "nc_award", "nc_current", "total", "current_total", "working_adults"]));
  const th = (k) => doc.querySelector('#cplFundTable th[data-sort="' + k + '"]');
  check("1b: the headers read Max CR Funds · Max NC Funds · Total Funds",
    th("cr_award").textContent.trim() === "Max CR Funds" && th("nc_award").textContent.trim() === "Max NC Funds" &&
    th("total").textContent.trim() === "Total Funds");
  check("1c: a Curr header shows Curr and gives a screen reader the whole word",
    ["cr_current", "nc_current", "current_total"].every((k) => {
      const h = th(k);
      return h && h.querySelector('span[aria-hidden="true"]').textContent === "Curr" &&
        h.querySelector(".cplfund-sr-only").textContent === "Current";
    }) && /Curr\s*Current CR Funds/.test(th("cr_current").textContent));
  check("1d: every header sorts and carries its hover",
    keys.slice(1).every((k) => th(k).getAttribute("tabindex") === "0" && (k === "college" || k === "district" || k === "working_adults" || !!th(k).getAttribute("title"))));
  const style = (doc.querySelector("#cplFundTable style") || {}).textContent || "";
  const hiddenAt = (k) => style.indexOf("th:nth-child(" + (keys.indexOf(k) + 1) + ")") !== -1;
  check("1e: #, District, the FTES pair and Working adults are hidden by default",
    ["order", "district", "cr_ftes", "nc_ftes", "working_adults"].every(hiddenAt));
  check("1f: a v1 store that hid the old Max award column hides nothing new — Total Funds and the funding columns show",
    ["college", "cr_award", "cr_current", "nc_award", "nc_current", "total", "current_total"].every((k) => !hiddenAt(k)));
  check("1g: the store is v2, and the retired v1 entry is cleared",
    /var COLS_STORE = "cplfund_cols_v2"/.test(consumerSrc) && window.localStorage.getItem("cplfund_cols_v1") === null);
  const items = Array.from(doc.querySelectorAll(".cplfund-colmenu-item")).map((l) => l.textContent.trim());
  check("1h: the Columns menu names the Curr columns in full",
    items.indexOf("Current CR Funds") !== -1 && items.indexOf("Current Total Funds") !== -1 && !items.some((t) => /Curr(?!ent)/.test(t)));
  // Hiding a column reaches the colgroup too, so the fixed layout sizes the
  // columns actually shown.
  const cols = () => Array.from(doc.querySelectorAll("#cplFundTable colgroup col")).map((c) => c.getAttribute("data-colw"));
  check("1i: the fixed layout's colgroup holds one <col> per shown column, in order",
    JSON.stringify(cols()) === JSON.stringify(["college", "cr_award", "cr_current", "nc_award", "nc_current", "total", "current_total"]));
  const cb = doc.querySelector('.cplfund-colmenu input[data-colkey="district"]');
  cb.checked = true; cb.dispatchEvent(new window.Event("change"));
  let v2 = null;
  try { v2 = JSON.parse(window.localStorage.getItem("cplfund_cols_v2")); } catch (e) { v2 = null; }
  check("1j: showing District adds its <col> in place, and the store remembers it under v2",
    JSON.stringify(cols().slice(0, 2)) === JSON.stringify(["college", "district"]) &&
    !!v2 && !!v2.college && v2.college.district === undefined);
  const table = doc.querySelector("#cplFundTable table.cplfund-table");
  check("1k: the table states a minimum width, below which its wrap scrolls",
    /min-width:\s*\d+px/.test(table.getAttribute("style") || ""));
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Curr figures, Total Funds and its chip, Statewide — curator view
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window, doc, T } = setup({ signedIn: true });
  const q = T._alloc(QUAL), h = T._alloc(HELD);
  check("2a: the fixture holds (QUAL qualifies for funding; HELD's measured funding is held)",
    q.earned_cr > 1000 && h.earned_cr === 0 && h.earned_withheld > 0);
  const qr = rowOf(doc, QUAL), hr = rowOf(doc, HELD);
  check("2b: Curr CR Funds reads what an institution meeting all three conditions qualifies for",
    cellByKey(doc, qr, "cr_current").textContent.trim() === money(q.earned_cr));
  check("2c: …with the hover 'Credit funding qualifying so far: $X of $Y'",
    cellByKey(doc, qr, "cr_current").getAttribute("title") ===
      "Credit funding qualifying so far: " + money(q.earned_cr) + " of " + money(q.cr_award));
  check("2d: Curr Total Funds adds the lanes; an institution meeting no condition reads $0 in every Curr column",
    cellByKey(doc, qr, "current_total").textContent.trim() === money(q.earned_total) &&
    ["cr_current", "nc_current", "current_total"].every((k) => cellByKey(doc, hr, k).textContent.trim() === "$0"));
  check("2e: the Curr cells are .cf-cur, never .cf-award (the award pair keeps its class to itself)",
    Array.from(qr.querySelectorAll("td.cf-cur")).length === 3 && !qr.querySelector("td.cf-cur.cf-award"));
  // Total Funds: the max award, a plain chip, no qualifying line.
  const floored = D_names(T).find((n) => T._alloc(n).floored);
  const capped = D_names(T).find((n) => T._alloc(n).capped);
  const ft = cellByKey(doc, rowOf(doc, floored), "total"), ct = cellByKey(doc, rowOf(doc, capped), "total");
  check("2f: Total Funds is the max award with a plain Base chip at the base…",
    ft.childNodes[0].textContent.trim() === money(T._alloc(floored).total) &&
    ft.querySelector(".cf-boundchip").textContent === "Base" && /base award/.test(ft.querySelector(".cf-boundchip").getAttribute("title")));
  check("2g: …and a Cap chip at the cap",
    ct.querySelector(".cf-boundchip").textContent === "Cap" && /cap/.test(ct.querySelector(".cf-boundchip").getAttribute("title")));
  check("2h: Total Funds carries no sub-line and names no reserve",
    !ft.querySelector(".sub") && !/qualifying|held|reserve/i.test(ft.textContent + " " + ft.getAttribute("title")));
  check("2i: every funding cell is centered (class c)",
    ["cr_award", "cr_current", "nc_award", "nc_current", "total", "current_total"].every((k) => cellByKey(doc, qr, k).classList.contains("c")));
  check("2j: no row cell names held or reserved funding, in its text or its hover",
    !Array.from(doc.querySelectorAll("#cplFundTable tbody > tr:not(.cplfund-detail) > td")).some((td) =>
      /held|reserve/i.test(td.textContent + " " + (td.getAttribute("title") || ""))));
  // Statewide.
  const sys = doc.querySelector("#cplFundTable tr.cplfund-systemrow");
  const btn = sys.querySelector(".cplfund-caret");
  check("2k: the statewide row reads Statewide, its accessible name unchanged",
    btn.textContent === "Statewide" && btn.getAttribute("aria-label") === "Statewide totals, per-priority detail" &&
    !/SYSTEM/.test(sys.textContent));
  const n = doc.querySelectorAll("#cplFundTable tr.cplfund-row").length;
  check("2l: beside it, the count in words: 1 of " + n + " meet all conditions",
    sys.querySelector(".cf-sys-elig").textContent === "1 of " + n + " meet all conditions" &&
    /minimum condition/.test(sys.querySelector(".cf-sys-elig").getAttribute("title")));
  check("2m: the Statewide Curr cells add every institution's released figure",
    cellByKey(doc, sys, "cr_current").textContent.trim() === money(q.earned_cr + h.earned_cr) &&
    cellByKey(doc, sys, "current_total").textContent.trim() === money(q.earned_total + h.earned_total));
  // Sorting a Curr column puts the qualifying institution first.
  click(window, doc.querySelector('#cplFundTable th[data-sort="cr_current"]'));
  check("2n: Curr CR Funds sorts by its figure (highest first)",
    doc.querySelector("#cplFundTable tr.cplfund-row").getAttribute("data-id") === "c:" + QUAL &&
    doc.querySelector('#cplFundTable th[data-sort="cr_current"]').getAttribute("aria-sort") === "descending");
  click(window, doc.querySelector('#cplFundTable th[data-sort="college"]'));

  // 2o–2t: the statewide drill-in adds what the row adds.
  const sd = openRow(window, doc, "sys");
  check("2o: the statewide drill-in opens, with no Max Funds summary line",
    !!sd && !sd.querySelector(".cplfund-dtl-sum") && !/Max Funds:/.test(sd.textContent));
  check("2p: its credit Actual Funds add to the Statewide row's Curr CR Funds (released, never held)",
    laneActualSum(sd, "cplfund-dtl-cr") !== null &&
    Math.abs(laneActualSum(sd, "cplfund-dtl-cr") - num(cellByKey(doc, doc.querySelector("#cplFundTable tr.cplfund-systemrow"), "cr_current").textContent)) <= 3);
  check("2q: and exclude HELD's measured funding, which the row excludes too",
    laneActualSum(sd, "cplfund-dtl-cr") < q.earned_cr + h.earned_withheld - 1);
  const ncSum = laneActualSum(sd, "cplfund-dtl-nc");
  check("2r: its noncredit Actual Funds add to the Statewide row's Curr NC Funds",
    ncSum !== null && Math.abs(ncSum - num(cellByKey(doc, doc.querySelector("#cplFundTable tr.cplfund-systemrow"), "nc_current").textContent)) <= 3);
  // A college's own drill-in adds to its own row, the same unit.
  const qd = openRow(window, doc, "c:" + QUAL);
  check("2s: a college's credit Actual Funds add to its row's Curr CR Funds",
    Math.abs(laneActualSum(qd, "cplfund-dtl-cr") - q.earned_cr) <= 3);
  check("2t: and no Max Funds summary line in the college drill-in either",
    !qd.querySelector(".cplfund-dtl-sum"));
  // Annual funding: every cell reads the viewed year, and the statewide
  // drill-in (the viewed year's priorities) still adds to the row.
  T._getShared().disbursement = "even";
  T._state.open = { sys: true };
  T.render();
  const sys2 = doc.querySelector("#cplFundTable tr.cplfund-systemrow");
  const sd2 = sys2.nextElementSibling;
  check("2u: under Annual funding a Curr cell reads the viewed year's figure",
    cellByKey(doc, rowOf(doc, QUAL), "cr_current").textContent.trim() === money(T._alloc(QUAL).ecy1) &&
    T._alloc(QUAL).ecy1 > 0 && T._alloc(QUAL).ecy1 < T._alloc(QUAL).earned_cr);
  check("2v: …and the statewide drill-in still adds to the Statewide row's Curr CR Funds",
    Math.abs(laneActualSum(sd2, "cplfund-dtl-cr") - num(cellByKey(doc, sys2, "cr_current").textContent)) <= 3);
}
function D_names(T) { return H.D.colleges.map((c) => c.college); }

// ─────────────────────────────────────────────────────────────────────────────
// 3. The public page: coarse Curr figures, a coarse sort, a coarse CSV
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window, doc, T } = setup({ public: true });
  const q = T._alloc(QUAL);
  const cell = cellByKey(doc, rowOf(doc, QUAL), "cr_current").textContent.trim();
  check("3a: the public Curr CR Funds figure coarsens to the nearest $1,000 (or reads <$1,000)",
    cell === "<$1,000" || (/^\$[\d,]+$/.test(cell) && num(cell) % 1000 === 0 && Math.abs(num(cell) - q.earned_cr) <= 500));
  check("3b: the cap beside it stays exact",
    cellByKey(doc, rowOf(doc, QUAL), "cr_award").textContent.trim() === money(q.cr_award));
  const csv = T._csv().split("\r\n");
  const head = csv[1].split(",");
  const line = csv.find((l) => l.split(",")[1] === QUAL).split(",");
  const iCur = head.findIndex((x) => /^Current credit /.test(x));
  check("3c: the public CSV's Current credit column coarsens the same way",
    iCur > 0 && (line[iCur] === "<1000" || Number(line[iCur]) % 1000 === 0));
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. The pie and the Minimum Conditions line agree, word for word
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window, doc } = setup({ signedIn: true });
  const qr = rowOf(doc, QUAL);
  const lead = qr.querySelector("td.t > .cf-lead");
  check("4a: the Institution cell leads with the pie slot, then the star slot, then the name button",
    !!lead && lead.children[0].classList.contains("cf-elig") && lead.children[1].classList.contains("cf-starslot") &&
    lead.nextElementSibling && lead.nextElementSibling.classList.contains("cplfund-caret"));
  check("4b: the pie and the star sit OUTSIDE the name button (print flattens it to its text)",
    !qr.querySelector(".cplfund-caret .cf-eligpie") && !qr.querySelector(".cplfund-caret .cplfund-vstar") &&
    qr.querySelector(".cplfund-caret").textContent === QUAL);
  check("4c: the star fills its slot for a Veteran Star institution; the slot stays for one without",
    !!qr.querySelector(".cf-starslot .cplfund-vstar") && !!rowOf(doc, HELD).querySelector(".cf-starslot") &&
    !rowOf(doc, HELD).querySelector(".cf-starslot .cplfund-vstar"));
  const pie = qr.querySelector("svg.cf-eligpie");
  const titles = Array.from(pie.querySelectorAll("g.cf-slice > title")).map((t) => t.textContent);
  check("4d: one hover per slice, numbered, in the conditions' words",
    JSON.stringify(titles) === JSON.stringify(["1. Coordinator on file", "2. Confirmation on file",
      "3. Veteran JSTs at 75% (Veteran Star)"]));
  check("4e: the pie keeps its role, summary and slices; the wrapper's all-in-one title is gone",
    pie.getAttribute("role") === "img" && pie.getAttribute("aria-label") === "3 of 3 requirements met" &&
    pieSlices(qr) === 3 && greenSlices(qr) === 3 && !qr.querySelector(".cf-elig").getAttribute("title"));
  const hTitles = Array.from(rowOf(doc, HELD).querySelectorAll("svg.cf-eligpie g.cf-slice > title")).map((t) => t.textContent);
  check("4f: an unmet slice says what is missing, the confirmation with its due date (MM-DD-YYYY)",
    JSON.stringify(hTitles) === JSON.stringify(["1. Coordinator not yet on file",
      "2. Confirmation not yet on file (due 11-01-2099)", "3. Veteran JSTs not yet at 75%"]));
  // The drill-in line.
  const det = openRow(window, doc, "c:" + QUAL);
  const line = det.querySelector(".cplfund-basestatus.cf-conds");
  const items = Array.from(line.querySelectorAll(".cf-cond"));
  check("4g: the drill-in opens on Minimum Conditions, three boxed items",
    line.querySelector(".cf-conds-h").textContent === "Minimum Conditions:" && items.length === 3 &&
    items.every((it) => it.querySelector('.cf-box[aria-hidden="true"]')));
  check("4h: the line's words are the pie's words (the pie adds only the star's name)",
    JSON.stringify(items.map((it) => it.textContent.replace("★", "").trim())) ===
      JSON.stringify(titles.map((t) => t.replace(/^\d+\. /, "").replace(" (Veteran Star)", ""))));
  check("4i: met items are checked; the veteran item carries the Veteran Star",
    items.every((it) => it.classList.contains("cf-met")) &&
    !!items[2].querySelector('.cplfund-vstar[role="img"][aria-label="Veteran Star"]'));
  check("4j: each item's hover is the curator's full requirement text",
    items[2].getAttribute("title") === VET_REQ && /Participation request by 2099-11-01/.test(items[1].getAttribute("title")));
  check("4k: the Baseline words and the reserve are gone from the drill-in",
    !/Baseline:|baseline met|reserved until|held in reserve/i.test(det.textContent) && !det.querySelector(".cplfund-basegate"));
  const hd = openRow(window, doc, "c:" + HELD);
  const hItems = Array.from(hd.querySelectorAll(".cf-conds .cf-cond"));
  check("4l: an institution meeting none reads three open boxes, no star",
    hItems.length === 3 && hItems.every((it) => !it.classList.contains("cf-met")) && !hd.querySelector(".cf-conds .cplfund-vstar"));
  // The noncredit-only variant: the third condition is certificates in MAP.
  const nt = Array.from(rowOf(doc, NCO).querySelectorAll("svg.cf-eligpie g.cf-slice > title")).map((t) => t.textContent);
  check("4m: a noncredit-only institution's third slice names noncredit certificates",
    nt[2] === "3. Noncredit certificates posted in MAP");
  const nd = openRow(window, doc, "c:" + NCO);
  const nItems = Array.from(nd.querySelectorAll(".cf-conds .cf-cond"));
  check("4n: …and so does its line, with no Veteran Star",
    nItems.length === 3 && nItems[2].textContent.trim() === "Noncredit certificates posted in MAP" &&
    nItems[2].classList.contains("cf-met") && !nd.querySelector(".cf-conds .cplfund-vstar"));
  check("4o: its origination sentence states the rule, the figures left to its row",
    /Qualifies by origination/.test(nd.querySelector(".cplfund-ncorigin").textContent) &&
    !/Current Total|Total Possible|max award/.test(nd.querySelector(".cplfund-ncorigin").textContent));
  check("4p: the CSS draws the boxes (no checkbox glyph) and prints their state",
    /\.cf-met \.cf-box::after \{/.test(consumerSrc) && /\.cf-box \{[^}]*print-color-adjust: exact/.test(consumerSrc) &&
    !/[☐☑☒✓✔]/.test(line.textContent));
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. The CO's controls: Reject or Revoke, never Confirm or Mark confirmed; the
//    public preview shows none of them
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window, doc, T } = setup({ signedIn: true,
    optinRow: { "Alameda": { college: "Alameda", status: "confirmed", confirmed_at: "2026-09-20T00:00:00Z" } } });
  const qd = openRow(window, doc, "c:" + QUAL);
  const corow = qd.querySelector(".cf-conds .cplfund-corow");
  check("5a: a self-attestation shows the attester and Reject alone",
    !!corow && /Attested by Sample Attester \(VPAA\) · attester@example\.edu · 09-28-2026/.test(corow.textContent) &&
    corow.querySelectorAll("button").length === 1 && corow.querySelector("button[data-optinrevoke]").textContent === "Reject");
  check("5b: no CO Confirm and no Mark confirmed anywhere in the table",
    !doc.querySelector("#cplFundTable [data-optinconfirm]") && !doc.querySelector("#cplFundTable [data-optin]") &&
    !/Mark confirmed/.test(doc.getElementById("cplFundTable").textContent));
  const ad = openRow(window, doc, "c:Alameda");
  check("5c: a legacy CO-confirmed row offers Revoke",
    ad.querySelector(".cf-conds button[data-optinrevoke]") && ad.querySelector(".cf-conds button[data-optinrevoke]").textContent === "Revoke");
  const hd = openRow(window, doc, "c:" + HELD);
  check("5d: an institution with no row shows no CO control at all",
    !hd.querySelector(".cf-conds button") && !hd.querySelector(".cplfund-corow"));
  check("5e: the Mark confirmed writer is deleted, with its wiring",
    !/function setOptIn\(/.test(consumerSrc) && !/\[data-optin\]/.test(consumerSrc));
  const lane = doc.querySelector(".cplfund-colane");
  check("5f: the Minimum Conditions section's CO lane offers Reject on a self-attestation, and no Confirm",
    !!lane && !!lane.querySelector('[data-optinrevoke="' + QUAL + '"]') &&
    !Array.from(lane.querySelectorAll("button")).some((b) => b.textContent === "Confirm"));
  check("5g: the note's placeholder names who can read it",
    qd.querySelector("textarea.cplfund-note").getAttribute("placeholder") === "Visible to signed-in reviewers only");
  // The public preview.
  T._state.previewPublic = true;
  T.render();
  const pq = openRow(window, doc, "c:" + QUAL);
  const mount = doc.getElementById("cplFundingMount");
  check("5h: previewing Public, the self-attested institution's drill-in is open, and no Reject, Revoke or Confirm shows",
    !!pq && !mount.querySelector("[data-optinrevoke], [data-optinconfirm], [data-optinremove], [data-optin]"));
  check("5i: …no attester, no CO lane and no CO Monitor's note",
    !!pq && !/Attested by|attester@example\.edu/.test(pq.textContent) && !pq.querySelector(".cplfund-corow") &&
    !mount.querySelector(".cplfund-colane") && !mount.querySelector(".cplfund-notewrap"));
  check("5j: …while its Minimum Conditions line itself still reads",
    !!pq && !!pq.querySelector(".cf-conds .cf-cond"));
  T._state.previewPublic = false;
  T.render();
  check("5k: back in the internal view, the controls return",
    !!doc.querySelector("#cplFundTable .cf-conds [data-optinrevoke]"));
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. The Confirm chip follows the curator's deadline; after it, "Confirm now"
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window, doc, T } = setup({ deadline: "2099-12-15" });
  const chip = () => rowOf(doc, HELD).querySelector("button.cplfund-optin-jump");
  check("6a: the chip reads Confirm by MM-DD-YY from the deadline",
    chip().textContent === "Confirm by 12-15-99");
  // WCAG 2.5.3 (label in name): the visible words are the whole accessible
  // name, so a speech-input user can say what they see; the date spelled out
  // rides the hover.
  check("6b: its name is its visible words (no aria-label), and the hover spells the date",
    !chip().hasAttribute("aria-label") &&
    (chip().getAttribute("title") || "").indexOf("Confirm participation by December 15, 2099. Opens ") === 0);
  check("6c: an institution that has confirmed carries no chip", !rowOf(doc, QUAL).querySelector("button.cplfund-optin-jump"));
  const shared = T._getShared();
  shared.participationDeadline = "2099-03-07";
  T.render();
  check("6d: a changed deadline moves every chip and every due date",
    chip().textContent === "Confirm by 03-07-99" &&
    Array.from(doc.querySelectorAll("#cplFundTable button.cplfund-optin-jump")).every((b) => b.textContent === "Confirm by 03-07-99") &&
    rowOf(doc, HELD).querySelector("g.cf-slice:nth-of-type(2) > title").textContent === "2. Confirmation not yet on file (due 03-07-2099)");
  shared.participationDeadline = "2020-01-15";
  T.render();
  check("6e: after the deadline the chip reads Confirm now",
    chip().textContent === "Confirm now" && !chip().hasAttribute("aria-label") &&
    (chip().getAttribute("title") || "").indexOf("Confirm participation now. Opens ") === 0);
  check("6f: the chip takes the page's 6px corners",
    /\.cplfund-optin-jump \{[^}]*border-radius: 6px/.test(consumerSrc));
  click(window, chip());
  check("6g: the chip still opens the row's attestation form",
    !!doc.querySelector('[data-optinwrap="' + HELD + '"]'));
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. TBA, the lane tables' names, and the card's actual line
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window, doc, T } = setup({ shared: { yearPriorities: { "1": {
    "0": { metric: "Applied CPL Units as FTES", metric_src: "pa_u" },
    "1": { metric: "Headcount with Eligible CPL Based on Statewide Credit Recommendations" },
    "2": { metric: "Applied CPL Units as FTES", metric_src: "pa_u" } } } } });
  const det = openRow(window, doc, "c:" + QUAL);
  const cr = det.querySelector("table.cplfund-dtl-cr"), nc = det.querySelector("table.cplfund-dtl-nc");
  check("7a: the credit table has no caption; its first header names the lane",
    !cr.querySelector("caption") && cr.querySelector("th").textContent === "Credit outcomes");
  check("7b: the noncredit table's caption is its rule alone; its first header names the lane",
    !!nc && nc.querySelector("caption").textContent === "Noncredit counts CPL for students who originate from a noncredit landing page." &&
    nc.querySelector("th").textContent === "Noncredit outcomes");
  check("7c: both lane tables keep their region names",
    det.querySelector('[role="region"][aria-label="Credit priority funding"]') && det.querySelector('[role="region"][aria-label="Noncredit priority funding"]'));
  const heads = Array.from(cr.querySelectorAll("tr")[0].querySelectorAll("th")).map((th) => th.textContent.trim().toLowerCase());
  const actCell = (tbl, i) => tbl.querySelectorAll("tr")[i + 1].querySelectorAll("td")[heads.indexOf("actual ftes")];
  check("7d: a measure with no source reads TBA, its meaning on hover",
    actCell(cr, 1).textContent === "TBA" && actCell(cr, 1).getAttribute("title") === "To be announced once measured");
  check("7e: an undelivered noncredit measure reads TBA too",
    actCell(nc, 0).textContent === "TBA" && actCell(nc, 0).getAttribute("title") === "To be announced once measured");
  check("7f: no drill-in cell reads 'awaiting measurement'",
    !/awaiting measurement/.test(det.textContent));
  check("7g: the priority card's actual line reads 'Actual: TBA.'",
    /Actual: TBA\./.test(doc.getElementById("cplFundingMount").textContent) &&
    !/Actual: awaiting measurement/.test(doc.getElementById("cplFundingMount").textContent));
  check("7h: the credit header fills seal blue, with fallbacks for the public explainer",
    /\.cplfund-dtl-tscroll > \.cplfund-dtl-table\.cplfund-dtl-cr th \{ background: var\(--seal-blue, #002F6D\); color: var\(--white, #FFFFFF\); \}/.test(consumerSrc));
  check("7i: the college intro is Sam's new text",
    /^The Dashboard lists the potential funding and FTES for each institution\. Total Funds is its max award/.test(
      doc.querySelector(".cplfund-college-intro").textContent.trim()) && !/Alphabetical/.test(doc.querySelector(".cplfund-college-intro").textContent));
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. District subtotals keep one cell per column; the CSV carries Curr twins
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window, doc, T } = setup({ group: true });
  const keys = headKeys(doc);
  const hdrs = Array.from(doc.querySelectorAll("#cplFundTable tr.cplfund-grouphdr"));
  check("8a: every district subtotal row has one cell per column, no spanning cell",
    hdrs.length > 50 && hdrs.every((tr) => tr.cells.length === keys.length &&
      Array.from(tr.cells).every((td) => !td.hasAttribute("colspan"))));
  // The subtotal sits under the figure it totals: Peralta's Max CR Funds and
  // Curr CR Funds equal its members' sums, read from the same columns.
  const hdr = hdrs.find((tr) => /Laney|Peralta/.test(tr.textContent)) || hdrs[0];
  let members = [], tr = hdr.nextElementSibling;
  while (tr && !tr.classList.contains("cplfund-grouphdr")) {
    if (tr.classList.contains("cplfund-row")) members.push(tr);
    tr = tr.nextElementSibling;
  }
  const sumCol = (k) => members.reduce((s, r) => s + num(cellByKey(doc, r, k).childNodes[0].textContent), 0);
  check("8b: the subtotal's Max CR, Curr CR, Max NC, Curr NC, Total and Curr Total sit under their columns",
    members.length > 1 && ["cr_award", "cr_current", "nc_award", "nc_current", "total", "current_total"].every((k) =>
      Math.abs(num(cellByKey(doc, hdr, k).childNodes[0].textContent) - sumCol(k)) <= members.length));
  check("8c: the subtotal carries its FTES in the FTES columns",
    num(cellByKey(doc, hdr, "cr_ftes").textContent) > 0 && num(cellByKey(doc, hdr, "nc_ftes").textContent) >= 0 &&
    !/\$/.test(cellByKey(doc, hdr, "cr_ftes").textContent));
  check("8d: each header labels itself a district subtotal", /district subtotal/.test(hdr.textContent));
  // The CSV.
  const csv = T._csv().split("\r\n");
  const head = csv[1].split(",");
  const iCr = head.findIndex((x) => /^Current credit /.test(x));
  const iNc = head.findIndex((x) => /^Current noncredit /.test(x));
  const iTot = head.findIndex((x) => /^Current total /.test(x));
  check("8e: the CSV carries Current credit / noncredit / total beside Max award",
    iCr > 0 && iNc === iCr + 1 && iTot === iCr + 2 && /^Max award /.test(head[iCr - 1]));
  const q = T._alloc(QUAL);
  const qLine = csv.find((l) => l.split(",")[1] === QUAL).split(",");
  check("8f: the curator CSV's Curr twins are the exact released figures",
    Number(qLine[iCr]) === Math.round(q.earned_cr) && Number(qLine[iNc]) === Math.round(q.earned_nc) &&
    Number(qLine[iTot]) === Math.round(q.earned_total));
  const sysLine = csv.find((l) => l.split(",")[1] === "Statewide");
  check("8g: the statewide line is labelled Statewide", !!sysLine && !csv.some((l) => /SYSTEM \(statewide\)/.test(l)));
  check("8h: the Withheld column still carries the reserve (the one place it reads)",
    head.some((x) => /^Withheld/.test(x)));
}

finish();

// CPL Implementation Funding — the College Dashboard, as Sam locked it on
// 2026-09-28 ("It all looks beautiful!!! Let's roll with it", seven mockup
// rounds: https://claude.ai/artifact/2V1aWwtjwob5gSM6TEkfyQ, round 7).
//
// What this file guards, in the order a reader meets it:
//   1. the row: the Elig pie, then the Veteran Star, then the name, each in a
//      fixed slot; Max CR · Curr CR · Max NC · Curr NC · Total · Curr Total;
//      the # column, the FTES pair and the Elig column gone; "Curr" on screen
//      and "Current" for a screen reader;
//   2. the Confirm chip: "Confirm by MM-DD-YY" from the deadline a curator
//      sets, "Confirm now" once it passes;
//   3. "Statewide", with its count in words;
//   4. no reserve figure anywhere on screen (his ruling, same day), the one
//      the port could most easily let back in through a hover;
//   5. the drill-in: a Minimum Conditions line of three boxes in the pie's own
//      words, no Max Funds line, no credit caption, TBA where a measure has yet
//      to arrive, and Reject as the CO's one control;
//   6. statewide Actual Funds as the sum of what institutions QUALIFY for;
//   7. the plumbing a redesign breaks quietly: the column-prefs key, the
//      colgroup and the full-width colspan, the grants table's layout.
//
// Memory budget (tests/lib/cpl_funding_harness.js): ~44 MB per booted window;
// this suite uses 4.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_college_dashboard.test.js`).
const H = require("./lib/cpl_funding_harness.js");
const { freshDom, boot, click, check, finish, consumerSrc, D } = H;

const VET_REQ = "Minimum of 75% of enrolled veteran Joint Services Transcripts uploaded in MAP";
// Laney posts plenty against its targets, so a gated Laney has demonstrated
// funding that the model holds; Alameda meets all three conditions.
function perf(window) {
  window.CPL_FUNDING_PERF = { as_of: "2026-09-28", suppress_below: 10,
    statewide: { pa_u: 300000 },
    colleges: { "Laney": { pa_u: 90000 }, "Alameda": { pa_u: 9000 } },
    feeders: { NOCE: { pe: 8 } }, unmatched: {},
    vet_star: { "Alameda": true, "Laney": true }, vet_star_as_of: "2026-09-28", vet_star_threshold: 0.75 };
}
function pin(T, deadline) {
  T._setShared({ extraReqs: [VET_REQ], yearPriorities: { "1": {
    "0": { metric: "Applied CPL Units as FTES", metric_src: "pa_u" },
    "1": { metric: "Applied CPL Units as FTES", metric_src: "pa_u" },
    "2": { metric: "Applied CPL Units as FTES", metric_src: "pa_u" } } } });
  T._setScenario({ participationDeadline: deadline, disbursement: "frontload" });
}
function elig(T, reviewRows) {
  T._setElig({ coordOk: true, coord: { "Alameda": true, "Laney": true },
    optinRow: { "Alameda": { college: "Alameda", status: "self_attested", requested_at: "2026-09-28T10:00:00Z" } },
    optinReview: reviewRows || [] });
}
function heads(doc) { return Array.from(doc.querySelectorAll("#cplFundTable thead th")); }
function keys(doc) { return heads(doc).map((th) => th.getAttribute("data-sort")); }
function rowOf(doc, name) {
  return Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
    .find((r) => r.querySelector(".cplfund-instname") && r.querySelector(".cplfund-instname").textContent === name) || null;
}
function cell(doc, row, key) {
  const i = keys(doc).indexOf(key);
  return row && i >= 0 ? row.children[i] : null;
}
const money = (el) => { const m = el && el.textContent.match(/\$([\d,]+)/); return m ? Number(m[1].replace(/,/g, "")) : NaN; };
// Everything a reader can see, hovers included: a figure moved into a title
// is still on screen.
const onScreen = (el) => el ? el.textContent + " " + Array.from(el.querySelectorAll("[title]"))
  .map((x) => x.getAttribute("title")).join(" ") + " " + Array.from(el.querySelectorAll("title"))
  .map((x) => x.textContent).join(" ") : "";
function reviewer() {
  return { get: function () { return { access_token: "h.p.s", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function (x) { var h = { apikey: "anon", Authorization: "Bearer h.p.s" }; for (var k in x || {}) h[k] = x[k]; return h; } };
}

// ── Window 1: the public reader, deadline ahead ─────────────────────────────
{
  const { window } = freshDom();
  perf(window);
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  pin(T, "2026-11-01");
  elig(T);
  T.render();

  // 1 — the columns
  const visible = heads(doc).map((th) => th.textContent.replace(/\s+/g, " ").trim());
  check("1a: the header reads Institution, then each lane's Max beside its Curr, then Total and Curr Total",
    keys(doc).join(",") === "college,district,cr_award,cr_current,nc_award,nc_current,total,current_total,working_adults" &&
    visible[2] === "Max CR Funds" && visible[4] === "Max NC Funds" && /^Total Funds/.test(visible[6]));
  check("1b: the # column, the FTES pair and the Elig column are gone",
    ["order", "cr_ftes", "nc_ftes", "elig"].every((k) => keys(doc).indexOf(k) === -1));
  const curTh = heads(doc)[keys(doc).indexOf("cr_current")];
  check("1c: a Curr header says Curr on screen and Current to a screen reader",
    curTh.querySelector('[aria-hidden="true"]').textContent === "Curr" &&
    curTh.querySelector(".cplfund-sr-only").textContent === "Current" &&
    /qualifying so far/.test(curTh.getAttribute("title") || ""));
  const hideCss = (doc.querySelector("#cplFundTable style") || { textContent: "" }).textContent;
  check("1d: District and the county context stay in the Columns menu, hidden by default",
    hideCss.indexOf("nth-child(2)") !== -1 && hideCss.indexOf("nth-child(9)") !== -1 &&
    Array.from(doc.querySelectorAll(".cplfund-colmenu input[data-colkey]")).filter((c) => !c.checked)
      .map((c) => c.getAttribute("data-colkey")).sort().join(",") === "district,working_adults");

  const ala = rowOf(doc, "Alameda");
  const lead = ala && ala.querySelector("td.t > .cf-lead");
  check("1e: the name cell leads with the pie, then the star, then the name",
    !!lead && lead === ala.children[0].firstElementChild &&
    !!lead.children[0].querySelector("svg.cf-eligpie") && lead.children[1].classList.contains("cf-starslot") &&
    !!lead.children[1].querySelector(".cplfund-vstar") &&
    lead.nextElementSibling.classList.contains("cplfund-caret"));
  const noStar = rowOf(doc, "Berkeley City");
  check("1f: a row without the star keeps the empty slot, so the names line up",
    !!noStar && !!noStar.querySelector(".cf-starslot") && !noStar.querySelector(".cf-starslot").children.length);
  const slices = Array.from(ala.querySelectorAll(".cf-eligpie .cf-slice title")).map((t) => t.textContent);
  check("1g: each pie slice answers for itself: its number and its condition's words",
    slices.join(" | ") === "1. Coordinator on file | 2. Confirmation on file | 3. Veteran JSTs at 75% (Veteran Star)");
  const noce = rowOf(doc, "NOCE");
  const noceSlices = noce ? Array.from(noce.querySelectorAll(".cf-eligpie title")).map((t) => t.textContent) : [];
  check("1h: a noncredit-only institution's third slice counts noncredit certificates, never the veteran JSTs",
    noceSlices[2] === "3. Noncredit certificates posted in MAP" && !noceSlices.some((t) => /Veteran/.test(t)));

  // 2 — the Confirm chip
  const chip = noStar.querySelector(".cplfund-optin-jump");
  check("2a: before the deadline the chip reads Confirm by the date, MM-DD-YY",
    !!chip && chip.textContent === "Confirm by 11-01-26");
  check("2b: a college with its confirmation on file carries no chip", !ala.querySelector(".cplfund-optin-jump"));
  const pending = Array.from(noStar.querySelectorAll(".cf-eligpie title")).map((t) => t.textContent)[1];
  check("2c: the pie's hover dates the pending confirmation MM-DD-YYYY", pending === "2. Confirmation not yet on file (due 11-01-2026)");

  // 3 — Statewide
  const sys = doc.querySelector("#cplFundTable tr.cplfund-systemrow");
  check("3a: the statewide row reads Statewide, with its count in words",
    sys.querySelector(".cplfund-caret").textContent === "Statewide" &&
    sys.querySelector(".cf-sys-elig").textContent === "1 of " + (D.colleges.length + 3) + " meet all conditions");

  // Curr Total is the two Curr figures, on every row and statewide.
  const rows = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row")).concat([sys]);
  const bad = rows.filter((r) => {
    const cr = money(cell(doc, r, "cr_current")), tot = money(cell(doc, r, "current_total"));
    const ncEl = cell(doc, r, "nc_current"), nc = /\$/.test(ncEl.textContent) ? money(ncEl) : 0;
    return Math.abs(cr + nc - tot) > 1;
  });
  check("3b: Curr Total Funds is Curr CR plus Curr NC on every row (" + rows.length + ", ±$1)", bad.length === 0);
  check("3c: Total Funds is Max CR plus Max NC on the statewide row",
    Math.abs(money(cell(doc, sys, "cr_award")) + money(cell(doc, sys, "nc_award")) - money(cell(doc, sys, "total"))) <= 1);
  const aQual = T._alloc("Alameda");
  check("3d: a qualifying college's Curr Total reads the model's qualifying figure",
    aQual.earned_total > 0 && money(cell(doc, ala, "current_total")) === Math.round(aQual.earned_total));

  // 4 — no reserve figure anywhere on screen
  const la = T._alloc("Laney");
  check("4a: fixture: Laney has demonstrated funding the gate holds", la.gate_blocked === true && la.earned_withheld > 1000);
  const laRow = rowOf(doc, "Laney");
  click(window, laRow.querySelector(".cplfund-caret"));
  click(window, doc.querySelector("#cplFundTable tr.cplfund-systemrow .cplfund-caret"));
  const table = doc.getElementById("cplFundTable");
  check("4b: the table names no reserve, in text, hovers or the pie's titles, with a gated drill-in open",
    !/\breserve[ds]?\b|\bheld\b|\bwithheld\b|\brolls? forward\b/i.test(onScreen(table)));
  check("4c: and the gated college's Curr Total reads $0", cell(doc, rowOf(doc, "Laney"), "current_total").textContent === "$0");

  // 5 — the drill-in
  const det = rowOf(doc, "Laney").nextElementSibling;
  const conds = det.querySelector(".cplfund-detail-grid").firstElementChild;
  check("5a: the drill-in opens on the Minimum Conditions line",
    conds.classList.contains("cf-conds") && /^Minimum Conditions:/.test(conds.textContent));
  const words = Array.from(conds.querySelectorAll(".cf-cond")).map((c) => c.textContent.trim());
  const pieWords = Array.from(rowOf(doc, "Laney").querySelectorAll(".cf-eligpie title"))
    .map((t) => t.textContent.replace(/^\d+\. /, "").replace(/ \(Veteran Star\)$/, ""));
  check("5b: three boxes, in the pie's own words",
    words.length === 3 && conds.querySelectorAll(".cf-box[aria-hidden='true']").length === 3 &&
    words.map((w) => w.replace(/★$/, "")).join("|") === pieWords.join("|"));
  check("5c: a met condition checks its box, and the third carries the Veteran Star once met",
    conds.querySelectorAll(".cf-cond.cf-met").length === 2 &&
    !!conds.querySelector(".cf-cond.cf-met.cf-vet .cplfund-vstar") &&
    !conds.querySelectorAll(".cf-cond")[1].classList.contains("cf-met"));
  check("5d: no Max Funds line above the lane tables", !det.querySelector(".cplfund-dtl-sum"));
  const cr = det.querySelector(".cplfund-dtl-table.cplfund-dtl-cr"), nc = det.querySelector(".cplfund-dtl-table.cplfund-dtl-nc");
  check("5e: the credit table has no caption and its first header names the lane",
    !!cr && !cr.caption && cr.rows[0].cells[0].textContent === "Credit outcomes");
  check("5f: the noncredit table keeps only its rule as a caption, and names its lane",
    !!nc && nc.caption.textContent === "Noncredit counts CPL for students who originate from a noncredit landing page." &&
    nc.rows[0].cells[0].textContent === "Noncredit outcomes");
  const tba = Array.from(nc.querySelectorAll("td")).filter((td) => td.textContent === "TBA");
  check("5g: an undelivered measure reads TBA, and its hover spells it out",
    tba.length > 0 && tba.every((td) => td.getAttribute("title") === "To be announced once measured"));
  check("5h: a gated college still shows what it posted, with $0 in Actual Funds",
    /^[\d,.]+$/.test(cr.rows[1].cells[3].textContent) && cr.rows[1].cells[4].textContent === "$0");

  // 6 — statewide Actual Funds is what institutions QUALIFY for
  const sysDet = doc.querySelector("#cplFundTable tr.cplfund-systemrow").nextElementSibling;
  const sysCr = sysDet.querySelector(".cplfund-dtl-table.cplfund-dtl-cr");
  const sumActual = Array.from(sysCr.rows).slice(1).reduce((s, r) => s + money(r.cells[4]), 0);
  check("6a: statewide credit Actual Funds sums to the Statewide row's Curr CR Funds (±$3)",
    Math.abs(sumActual - money(cell(doc, doc.querySelector("#cplFundTable tr.cplfund-systemrow"), "cr_current"))) <= 3);
  check("6b: …which leaves out the funding the gate holds for Laney",
    sumActual < la.earned_withheld + aQual.earned_total && Math.abs(sumActual - aQual.earned_cr) <= 3);

  // 7 — the plumbing
  const vis = heads(doc).length - 2;
  check("7a: the colgroup carries one column per visible column",
    doc.querySelectorAll("#cplFundTable table.cplfund-coltable > colgroup > col").length === vis);
  check("7b: a full-width drill-in cell spans the visible columns, never past them",
    det.firstElementChild.getAttribute("colspan") === String(vis));
  check("7c: the intro opens with Sam's sentence",
    /^The Dashboard lists the potential funding and FTES for each institution\./
      .test(doc.querySelector('[data-textblock="college_intro"]').textContent.trim()));
}

// ── Window 2: the deadline has passed ───────────────────────────────────────
{
  const { window } = freshDom();
  perf(window);
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  pin(T, "2026-09-01");
  elig(T);
  T.render();
  const chip = rowOf(doc, "Berkeley City").querySelector(".cplfund-optin-jump");
  check("8a: after the deadline the chip reads Confirm now", !!chip && chip.textContent === "Confirm now");
  check("8b: and the chip keeps the page's button corners, in place of the pill",
    /\.cplfund-optin-jump \{[^}]*border-radius: 6px;/.test(consumerSrc));
}

// ── Window 3: a signed-in reviewer ──────────────────────────────────────────
{
  const { window } = freshDom();
  perf(window);
  window.CPL_SESSION = reviewer();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  pin(T, "2026-11-01");
  elig(T, [{ college: "Alameda", name: "Sample Attester", title: "VPAA", email: "attester@example.edu",
    status: "self_attested", requested_at: "2026-09-28T10:00:00Z" }]);
  T.render();
  click(window, rowOf(doc, "Alameda").querySelector(".cplfund-caret"));
  const det = rowOf(doc, "Alameda").nextElementSibling;
  const ctl = det.querySelector(".cf-conds .cplfund-corow");
  check("9a: after a college attests, the CO sees Reject alone, beside the attester",
    !!ctl && ctl.querySelectorAll("button").length === 1 && ctl.querySelector("button").textContent === "Reject" &&
    /Attested by Sample Attester \(VPAA\) · attester@example\.edu · 09-28-2026/.test(ctl.textContent));
  check("9b: Mark confirmed and the CO's Confirm are gone from the drill-in",
    !/Mark confirmed/.test(det.textContent) && !det.querySelector("[data-optinconfirm], [data-optin]"));
  click(window, rowOf(doc, "Laney").querySelector(".cplfund-caret"));
  const laDet = rowOf(doc, "Laney").nextElementSibling;
  check("9c: a college that has not attested offers the CO no control at all",
    !laDet.querySelector(".cplfund-corow") && !laDet.querySelector(".cf-conds button"));
  check("9d: the CO Monitor's note says who can read it",
    (laDet.querySelector(".cplfund-note") || { getAttribute: () => "" }).getAttribute("placeholder") ===
      "Visible to signed-in reviewers only");
}

// ── Window 4: a browser that saved the OLD column prefs ─────────────────────
{
  const { window } = freshDom();
  // v1 hid the old Max award under `total`, the key Total Funds holds now.
  window.localStorage.setItem("cplfund_cols_v1", JSON.stringify({ college: { total: true, district: true } }));
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const hideCss = (doc.querySelector("#cplFundTable style") || { textContent: "" }).textContent;
  const totPos = keys(doc).indexOf("total") + 1;
  check("10a: a v1 setting cannot hide Total Funds (the prefs key moved to v2)",
    totPos > 0 && hideCss.indexOf("nth-child(" + totPos + ")") === -1);
  // Showing District grows the colgroup and the full-width span together.
  const cb = doc.querySelector('.cplfund-colmenu input[data-colkey="district"]');
  cb.checked = true; cb.dispatchEvent(new window.Event("change", { bubbles: true }));
  T._state.open["sys"] = true;
  T.render();
  const sysDet = doc.querySelector("#cplFundTable tr.cplfund-systemrow").nextElementSibling;
  check("10b: showing District adds its column to the colgroup and to the drill-in's span",
    doc.querySelectorAll("#cplFundTable table.cplfund-coltable > colgroup > col").length === 8 &&
    sysDet.firstElementChild.getAttribute("colspan") === "8");
  check("10c: the District cell on the statewide row keeps the college and Veteran Star counts",
    /colleges/.test(doc.querySelector("#cplFundTable tr.cplfund-systemrow .cplfund-syscounts").textContent));
  // The fixed layout is the College Dashboard's alone: the grants table
  // shares the base class and sizes its own columns.
  check("10d: the fixed layout is scoped to the College Dashboard's table",
    consumerSrc.indexOf('"table.cplfund-table.cplfund-coltable { table-layout: fixed; min-width: 720px; }"') !== -1 &&
    !/"table\.cplfund-table \{[^"]*table-layout: fixed/.test(consumerSrc));
  // The public explainer embeds this table and defines only its own tokens.
  check("10e: the credit header's colors carry fallbacks for the explainer, which defines no --seal-blue",
    /\.cplfund-dtl-cr th \{ background: var\(--seal-blue, #002F6D\); color: var\(--white, #FFFFFF\); \}/.test(consumerSrc));
}

finish();

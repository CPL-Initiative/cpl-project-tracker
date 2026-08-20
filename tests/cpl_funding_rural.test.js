// CPL Implementation Funding tab — the rural allowance and the readability/equity/a11y pass (Parts K–N).
//
// PR4's guaranteed rural earmark (no ≥50% earning gate), SkyHigh's readability +
// equity + a11y pass, the rural allowance folded into each rural college's row,
// and the floor combined with the rural bump.
//
// One of nine suites the 2,955-line cpl_funding.test.js was split into on
// 2026-08-20, after it stopped fitting in a 12 GB heap. Shared setup + the
// jsdom helpers live in tests/lib/cpl_funding_harness.js, which also carries the
// measurements behind the split and the per-window memory budget for anyone
// adding to these files.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_rural.test.js`).
const {
  check,
  freshDom,
  boot,
  click,
  D,
  consumerSrc,
  finish,
} = require("./lib/cpl_funding_harness.js");

// Part K — PR4 (SkyHighness, 2026-07-28) replaced SkyMore's ≥50% rural earning
// with the GUARANTEED floor-fill model: (1) the rural section shows a Floor-fill
// + On-top bonus split, guaranteed; (2) the drill-in rural line reflects it.
// (K4 = the unrelated noncredit feeder measurables ladder, unchanged.)
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const ruralTable = doc.querySelectorAll(".cplfund-table")[2];
  check("K1: rural table headers switched to Floor-fill + On-top bonus + Window total",
    ruralTable.querySelector("thead").textContent.indexOf("Floor-fill") !== -1 &&
    ruralTable.querySelector("thead").textContent.indexOf("On-top bonus") !== -1 &&
    ruralTable.querySelector("thead").textContent.indexOf("Window total") !== -1);
  check("K1: rural intro explains funding the college's own floor first (guaranteed)",
    /funds the college.{0,6}s own minimum-viable floor first/.test(ruralTable.parentNode.parentNode.textContent) &&
    /guaranteed/.test(ruralTable.parentNode.parentNode.textContent));
  check("K2: rural tfoot reports the floor-fill / bonus split + funding-floor count",
    ruralTable.querySelector("tfoot").textContent.indexOf("funding their floor") !== -1);
  // Drill-in reflects the guaranteed allowance + floor-fill/bonus split (no chips).
  // NOTE: click triggers a full re-render, so re-query the detail from the fresh DOM.
  const shastaMain = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row")).find(function (tr) { return /Shasta/.test(tr.textContent); });
  click(window, shastaMain);
  const detail = Array.from(doc.querySelectorAll("#cplFundTable tr.cplfund-detail")).find(function (tr) { return tr.textContent.indexOf("Rural allowance") !== -1; });
  check("K3: the college drill-in rural line reflects the guaranteed allowance (no ≥50% chips)",
    !!detail && /guaranteed/.test(detail.textContent) &&
    /rides on top|funds this college&#39;s floor/.test(detail.innerHTML) &&
    !detail.querySelector(".cf-rchip"));
}
{
  // K4 — feeder measurables ladder: F1 (eligible headcount) + F2 (NC-cert waivers).
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const feederSec = doc.querySelector('details.cplfund-sec[data-sec="feeder"]');
  check("K4: feeder section renders the F1 + F2 measurables ladder",
    feederSec.textContent.indexOf("F1") !== -1 && feederSec.textContent.indexOf("Eligible headcount") !== -1 &&
    feederSec.textContent.indexOf("F2") !== -1 && feederSec.textContent.indexOf("waiver") !== -1);
  check("K4: F1 is pending until the feed carries feeder eligible counts",
    feederSec.textContent.indexOf("measurable once campuses attach exhibits") !== -1);
  check("K4: the ladder documents what is NOT tracked (transcription + JST/Veteran Star)",
    /aren.{0,3}t obligated to collect JST/.test(feederSec.textContent));
  // With a feeder F1 feed, the count surfaces (per-feeder + the ladder total).
  window.CPL_FUNDING_PERF = { as_of: "2026-07-27", suppress_below: 5,
    statewide: { pe: 0, p2: 0, p3: 0, pp: 0 }, colleges: {}, unmatched: {},
    feeders: { "NOCE": { pe: 42 }, "Calbright": { pe: null, pe_suppressed: true } } };
  T.render();
  const fSec2 = doc.querySelector('details.cplfund-sec[data-sec="feeder"]');
  check("K5: a feeder with an F1 count shows it in its row (eligible in MAP)",
    fSec2.textContent.indexOf("42 eligible in MAP") !== -1);
  check("K5: the F1 ladder line surfaces the eligible total once the feed lands",
    fSec2.textContent.indexOf("eligible NC students identified across the feeders") !== -1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part L — SkyHigh (2026-07-28): the readability + equity + a11y pass. (1) the
// "How an allocation is computed" box is a left-justified bulleted list; (2) the
// tab uses the FULL container width + left-aligns (cards stay centered); (3) the
// college P-cell drops the inline per-student rate for an equitable "% of target"
// yardstick, real dollars bold, with the effective $/student + floor reason in the
// HOVER; (4) accessibility: keyboard-operable sortable headers, labelled segmented
// toggles, a table region + caption, keyboard-expandable rows; (5) mobile CSS.
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  // L1 — the formula explainer is a bulleted, left-justified list.
  const formula = doc.querySelector(".cplfund-formula");
  check("L1: the formula box is a bulleted list (≥4 bullets)",
    formula.querySelectorAll("ul.cplfund-formula-list > li").length >= 4);
  check("L1: the formula list still explains the core basis×share formula",
    formula.textContent.indexOf("credit FTES share") !== -1);
  // L2 — full width: the shared 1400px container cap is dropped for THIS pane only.
  check("L2: full-width CSS drops the .main-container cap for the funding tab only",
    /#tab-implementation-funding \.main-container \{ max-width: none; \}/.test(consumerSrc));
  // L3 — the tab left-justifies; stat cards stay centered.
  check("L3: the tab left-justifies (.cplfund text-align:left)",
    /\.cplfund \{ color: var\(--text-body\); text-align: left; \}/.test(consumerSrc));
  check("L3: stat cards remain centered (.cplfund-card text-align:center)",
    /\.cplfund-card \{ text-align: center; \}/.test(consumerSrc));
  // L4 — the P-cell: Tgt/Now labels, a bold cap dollar, no inline rate, "stu" unit.
  const pcell = doc.querySelector("#cplFundTable tbody tr.cplfund-row td.cf-prio");
  check("L4: the P-cell has both Tgt and Now labels (.cf-lbl)",
    pcell.querySelectorAll(".cf-lbl").length === 2);
  check("L4: the target line shows a bold funding cap (.cf-cap)", !!pcell.querySelector(".cf-cap"));
  check("L4: the per-student rate is NOT inline (.cf-rate absent)", pcell.querySelector(".cf-rate") === null);
  check("L4: the target line labels the count as students (stu)",
    pcell.querySelector(".cf-t").textContent.indexOf("stu") !== -1);
  // L10 — real dollars bold, % normal weight (Sam, 2026-07-28).
  check("L10: the cap dollar is bold (.cf-cap font-weight:700)",
    /\.cf-prio \.cf-cap \{ font-weight: 700;/.test(consumerSrc));
  check("L10: the % stays normal weight (.cf-pct font-weight:400)",
    /\.cf-prio \.cf-pct \{ color: var\(--green-progress\); font-weight: 400; \}/.test(consumerSrc));
  // L5 — the effective rate + WHY it differs lives in the cell hover: a floored
  // college explains the floor top-up; a large one cites the statewide base.
  function firstPrioTitle(name) {
    const row = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
      .find(function (tr) { return tr.textContent.indexOf(name) !== -1; });
    return row ? (row.querySelector("td.cf-prio").getAttribute("title") || "") : "";
  }
  // Alameda is floored but NOT rural — a clean floor-only hover (Copper Mountain
  // is now both floored AND federally rural, so it would mention both).
  const cmTitle = firstPrioTitle("Alameda");
  check("L5: a floored college's cell hover explains the minimum-viable floor top-up + a /student rate",
    /minimum-viable floor/.test(cmTitle) && /\/student/.test(cmTitle));
  // A non-floored college's effective rate sits BELOW the statewide base: the
  // $150K top-ups are funded by renormalising the split over exactly these
  // colleges. The hover used to assert "at the statewide base rate" regardless,
  // which the cell's own cap ÷ target contradicted by ~10% (caught 2026-07-31 by
  // tests/cpl_funding_basis.test.js Part H). It must now name the renormalisation.
  {
    const elaTitle = firstPrioTitle("East LA");
    check("L5: a non-floored college's cell hover reconciles its rate to the statewide base",
      /statewide base/.test(elaTitle) &&
      (/statewide base rate\./.test(elaTitle) || /renormalised over the colleges above the/.test(elaTitle)));
  }
  // L6 — sortable headers are keyboard-operable (aria-sort + tabindex).
  const th = doc.querySelector("#cplFundTable th[data-sort]");
  check("L6: sortable headers carry tabindex + aria-sort (keyboard-operable)",
    th.getAttribute("tabindex") === "0" && th.hasAttribute("aria-sort"));
  check("L6: the active sort column reports its direction via aria-sort",
    !!doc.querySelector('#cplFundTable th[aria-sort="ascending"], #cplFundTable th[aria-sort="descending"]'));
  // L7 — segmented toggles: role=group + aria-pressed reflecting the choice.
  const seg = doc.querySelector("#cplFundGroup");
  check("L7: segmented control is a labelled group",
    seg.getAttribute("role") === "group" && !!seg.getAttribute("aria-label"));
  check("L7: exactly one segment button is aria-pressed=true",
    seg.querySelectorAll('button[aria-pressed="true"]').length === 1);
  // L8 — the table is an accessible region with an sr-only caption.
  check("L8: the table wrapper is a labelled region",
    !!doc.querySelector('.cplfund-tablewrap[role="region"][aria-label]'));
  check("L8: the table carries an sr-only caption",
    !!doc.querySelector("table.cplfund-table > caption.cplfund-sr-only"));
  // L9 — the expand control is a real <button> on the caret: keyboard-focusable
  // + announced, WITHOUT overriding the row's table semantics. aria-expanded
  // tracks state; activating it (native click, bubbles to the row) toggles.
  const caret0 = doc.querySelector("#cplFundTable tbody tr.cplfund-row .cplfund-caret");
  check("L9: the caret is a keyboard <button> carrying aria-expanded",
    caret0.tagName === "BUTTON" && caret0.hasAttribute("aria-expanded"));
  check("L9: a collapsed row's caret reports aria-expanded=false",
    caret0.getAttribute("aria-expanded") === "false");
  check("L9: the row keeps its table semantics (no role override on the <tr>)",
    doc.querySelector("#cplFundTable tbody tr.cplfund-row").getAttribute("role") === null);
  click(window, caret0);   // native button activation bubbles to the row toggle
  check("L9: activating the caret expands the row (aria-expanded=true)",
    doc.querySelector("#cplFundTable tbody tr.cplfund-row .cplfund-caret").getAttribute("aria-expanded") === "true");
  // L11 — mobile CSS present.
  check("L11: a mobile (≤640px) media query tightens the dense table",
    /@media \(max-width: 640px\)/.test(consumerSrc));
  // L12 — keyboard focus survives the innerHTML re-render that sort/expand
  // trigger (WCAG 2.4.3): the sorted header + the toggled caret stay focused.
  const th12 = doc.querySelector("#cplFundTable th[data-sort]");
  const thKey = th12.getAttribute("data-sort");
  th12.focus();
  th12.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  check("L12: focus stays on the sorted header after the table re-renders",
    doc.activeElement && doc.activeElement.getAttribute &&
    doc.activeElement.getAttribute("data-sort") === thKey);
  const caret12 = doc.querySelector("#cplFundTable tbody tr.cplfund-row .cplfund-caret");
  caret12.focus();
  click(window, caret12);   // activation bubbles to the row toggle → refreshTable
  check("L12: focus stays on the caret after the row expand re-renders",
    doc.activeElement && String(doc.activeElement.className || "").indexOf("cplfund-caret") !== -1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part M — SkyHigh (2026-07-28): the rural allowance is FOLDED into each rural
// college's row. The row cap/rate/Yr/Total include it and the SYSTEM total rises
// to match. (M4/M5 updated for PR4: the fold is now GUARANTEED — no ≥50% unlock,
// and the Rural section shows a floor-fill / on-top-bonus split.)
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const D = window.CPL_FUNDING;
  const rc = T._alloc("Shasta");     // rural (federally categorized)
  const pc = T._alloc("Alameda");    // not rural
  // M1 — a rural college carries a positive rural window; a plain one carries none.
  check("M1: a rural college's alloc carries a positive rural_w", rc.rural_w > 0);
  check("M1: a non-rural college has no rural_w", !pc.rural_w);
  // M2 — the folded window total = main entitlement + rural window (shares sum to 100%).
  check("M2: rural college total = main entitlement + rural window",
    Math.abs(rc.total - (rc.main_w + rc.rural_w)) < 1 && rc.total > rc.main_w);
  // M3 — the whole college pool now = main net + the rural carve-out (folded into
  // rural rows), and the SYSTEM total row matches Σ college rows.
  const sumTotals = D.colleges.reduce(function (s, c) { return s + T._alloc(c.college).total; }, 0);
  check("M3: Σ college totals = net college pool + rural carve-out",
    Math.abs(sumTotals - (T._netCollege() + D.pool.rural_carveout)) < 5);
  const sysTot = doc.querySelector("#cplFundTable tr.cplfund-systemrow td.tot");
  check("M3: the SYSTEM total row equals Σ college totals (rural included consistently)",
    sysTot && sysTot.textContent.indexOf(Math.round(sumTotals).toLocaleString("en-US")) !== -1);
  // M4 — the rural college's cell hover discloses the GUARANTEED folded allowance (PR4).
  const bRow = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
    .find(function (tr) { return /Shasta/.test(tr.textContent); });
  const bTitle = bRow.querySelector("td.cf-prio").getAttribute("title") || "";
  check("M4: a rural college's cell hover names the GUARANTEED rural allowance (no ≥50% unlock)",
    /rural allowance/.test(bTitle) && /guaranteed/.test(bTitle) && !/unlock/.test(bTitle));
  // M5 — the Rural section notes the fold and shows the guaranteed floor-fill/bonus split.
  const ruralSec = doc.querySelector('details.cplfund-sec[data-sec="rural"]');
  check("M5: the Rural section notes the allowance is folded into the table above",
    ruralSec && ruralSec.textContent.indexOf("folded into") !== -1);
  check("M5: the Rural section shows the guaranteed floor-fill / on-top-bonus split (no ≥50% chips)",
    !!ruralSec && ruralSec.textContent.indexOf("Floor-fill") !== -1 &&
    ruralSec.textContent.indexOf("On-top bonus") !== -1 && !ruralSec.querySelector(".cf-rchip"));
}

// ─────────────────────────────────────────────────────────────────────────────
// Part N — PR4 (SkyHighness, 2026-07-28): "combine the floor with the rural bump."
// The GUARANTEED rural allowance funds each rural college's floor FIRST (reduced
// main-pool floor), freeing main-pool dollars for non-rural colleges; the split
// (floor-fill + on-top bonus) conserves the carve-out; and — Option B — the
// allowance is guaranteed in Earned mode (only the MAIN allocation flexes).
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const m = T._model();
  const floor = m.floor;
  const per = D.pool.rural_carveout / 13;                       // ~76,923 per rural college
  const ruralNames = D.colleges.filter(function (c) { return c.rural; }).map(function (c) { return c.college; });

  // N1 — reduced floor: a rural college's MAIN entitlement can dip below the full
  // floor (never below floor − per), while its TOTAL always meets the floor.
  check("N1: every rural college's main entitlement ≥ the reduced floor (floor − per)",
    ruralNames.every(function (n) { return m.W[n] >= (floor - per) - 1; }));
  check("N1: every rural college's TOTAL window (main + guaranteed rural) ≥ the floor",
    ruralNames.every(function (n) { return T._alloc(n).total >= floor - 1; }));
  check("N1: at least one rural college sits at the REDUCED floor (its main < the full floor)",
    ruralNames.some(function (n) { return m.W[n] < floor - 1 && m.W[n] >= (floor - per) - 1; }));

  // N2 — the carve-out is conserved: Σ (floor-fill + on-top bonus) = the $1M rural pool.
  let fill = 0, bonus = 0;
  ruralNames.forEach(function (n) {
    const gap = Math.max(0, floor - m.W[n]);
    const ff = Math.min(per, gap);
    fill += ff; bonus += (per - ff);
  });
  check("N2: rural floor-fill + on-top bonus conserve the carve-out ($1M)",
    Math.abs((fill + bonus) - D.pool.rural_carveout) < 5);
  // Both parts must be REAL — the guard is against a degenerate split (all
  // floor-fill or all bonus), not a fixed dollar level. Under credit FTES more
  // rural colleges sit at the floor, so the mix shifted toward fill
  // ($917K fill / $83K bonus) without either part vanishing.
  check("N2: both parts are non-trivial (the split is not degenerate)",
    fill > 10000 && bonus > 10000 &&
    fill < D.pool.rural_carveout - 10000 && bonus < D.pool.rural_carveout - 10000);

  // N3 — the freed main pool flows to non-rural colleges: a floored rural college's
  // main top-up is measured against its REDUCED floor (main pool pays less for it
  // than a full-floor top-up would), while non-rural small colleges keep the full floor.
  const cmMain = m.W["Copper Mountain"];                        // rural + floored
  check("N3: a floored rural college's main entitlement = the reduced floor (main pool saves ~per)",
    Math.abs(cmMain - (floor - per)) < 1 && cmMain < floor - 1);
  const nonRuralFloored = D.colleges.find(function (c) {
    return !c.rural && m.floored[c.college] && Math.abs(m.W[c.college] - floor) < 1;
  });
  check("N3: a non-rural floored college is still topped to the FULL floor", !!nonRuralFloored);
  // Main pool is still fully conserved across all colleges (rural reduced floors just
  // change the split, never the total the main pool distributes).
  check("N3: Σ main entitlements still = the net main pool (freed dollars re-split, none lost)",
    Math.abs(Object.values(m.W).reduce(function (s, w) { return s + w; }, 0) - T._netCollege()) < 1);
}
{
  // N4 — GUARANTEED in Earned mode: a rural college underperforming on its MAIN
  // allocation still receives its full rural allowance (it does not flex).
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-07-28", suppress_below: 5,
    statewide: { p3: 999999 },
    colleges: { "Shasta": { p3: 10 } }, unmatched: {} };   // Shasta far under its P1 target
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const per_ = D.pool.rural_carveout / 13;   // guaranteed rural window allowance per college
  // Hold P3-slot as a data gap so only Year-1 P1 (any-transcribed → p3) flexes.
  T._setShared({ yearPriorities: { "1": { "2": { metric: "Headcount with CPL Matched in MAP and MIS" } } } });
  T.render();
  const rc = T._alloc("Shasta");
  check("N4: Shasta is rural (positive rural_w)", rc.rural_w > 0);
  check("N4: its MAIN allocation flexes down (earned < cap when underperforming)",
    rc.earned_total < rc.total - 1);
  check("N4: its rural allowance is paid in FULL — earned ≥ the guaranteed rural window",
    rc.earned_total >= rc.rural_w - 0.01);
  // Sharp guard against re-folding rural into the earn fraction: toggling the rural
  // flag off (same underperforming feed) drops earned by ~the full rural allowance.
  // Sharp guard against re-folding rural into the earn fraction, stated as an
  // invariant rather than a before/after delta: if the rural allowance were flexed
  // on achievement, an underperforming college's UNEARNED amount would exceed its
  // MAIN allocation. (The old delta form assumed the college stays unfloored with
  // rural off, which stops holding once the pool shrinks enough to floor it.)
  check("N4: guaranteed rural is never flexed — unearned can never exceed the MAIN allocation",
    (rc.total - rc.earned_total) > 1 && (rc.total - rc.earned_total) <= rc.main_w + 0.01);
  T._setScenario({ ruralOverrides: { "Shasta": false } });
  T.render();
  const nr = T._alloc("Shasta");
  check("N4: clearing the rural flag removes the guaranteed allowance from the row",
    rc.rural_w > per_ - 1 && nr.rural_w === 0);
  delete window.CPL_FUNDING_PERF;
}

// ─────────────────────────────────────────────────────────────────────────────

finish();

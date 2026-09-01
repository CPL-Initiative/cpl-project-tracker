// CPL Implementation Funding tab — per-student funding rate, the veteran-JST qualifier, and SkyMore (Parts H, I, J).
//
// The curator-typed per-student rate; the JST qualifier feeding the Veteran Star
// sector; and the "How an allocation is computed" box. Ported to the one-pool
// model (adopted 2026-08-31): the P1/P2/P3 table columns are retired (the
// per-priority detail lives in each row's expand), the noncredit feeder section
// and its two-batch table are retired (R9 — the trio are ordinary rows earning
// by origination), and the retired NC second solve (_ncModel) is pinned absent.
//
// One of nine suites the 2,955-line cpl_funding.test.js was split into on
// 2026-08-20, after it stopped fitting in a 12 GB heap. Shared setup + the
// jsdom helpers live in tests/lib/cpl_funding_harness.js, which also carries the
// measurements behind the split and the per-window memory budget for anyone
// adding to these files.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_rate.test.js`).
const {
  check,
  freshDom,
  boot,
  click,
  greenSlices,
  pieSlices,
  D,
  consumerSrc,
  idx,
  finish,
} = require("./lib/cpl_funding_harness.js");

// Part H — per-student funding rate (Sam, 2026-07-27): the curator types a
// $/student rate; the # students + % of headcount are DERIVED. Plus collapsible
// sections and the reworded P1 (eligible→pe) / P3 (portal→pp) metric wiring.
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;

  // H1 — the priority card takes a per-student $ input, not a % input.
  check("H1: priority card renders a per-student ($/student) input",
    !!doc.querySelector('input[data-edit="perstudent"][data-slot="1"][data-idx="0"]'));
  check("H1: no legacy 'target' (% of headcount) input is rendered",
    !doc.querySelector('input[data-edit="target"]'));
  // The reach percentage is now computed against STATEWIDE HEADCOUNT explicitly.
  // It used to render p.target_rate, which since 2026-07-31 denominates on the
  // allocation basis and is therefore no longer a headcount %.
  check("H1: the priority line reads 'per student' + shows the derived reach % of statewide headcount",
    doc.querySelector(".cplfund-prio .p").textContent.indexOf("per student") !== -1 &&
    doc.querySelector(".cplfund-prio .p").textContent.indexOf("of statewide headcount") !== -1);
  check("H1: the default (legacy target_rate) shows a positive implied $/student",
    Number(doc.querySelector('input[data-edit="perstudent"][data-slot="1"][data-idx="0"]').value) > 0);

  // H2 — per_student is the source of truth; the student target is INVERSE to it,
  // and it moves no dollars (the allocation is share-based).
  T._setShared({ yearPriorities: { "1": { "0": { per_student: 100 } } } });
  T.render();
  check("H2: the per-student input round-trips the stored $/student",
    Math.abs(Number(doc.querySelector('input[data-edit="perstudent"][data-slot="1"][data-idx="0"]').value) - 100) < 0.01);
  const a100 = T._alloc(D.colleges[0].college);
  T._setShared({ yearPriorities: { "1": { "0": { per_student: 50 } } } });
  T.render();
  const a50 = T._alloc(D.colleges[0].college);
  // The clamp bound is the ALLOCATION BASIS (combined FTES since one-pool
  // adoption) — target_rate caps at 100% of it, not of headcount.
  const basis0 = (D.colleges[0].credit_ftes || 0) + (Number(D.colleges[0].noncredit_ftes) || 0);
  check("H2: halving $/student ~doubles the student target (inverse), unless clamped at 100%",
    Math.abs(a50.p1_heads - 2 * a100.p1_heads) < 1 || a50.p1_heads >= basis0 - 1);
  check("H2: changing the per-student rate moves NO dollars (allocation is share-based)",
    Math.abs(a50.total - a100.total) < 1);

  // H3 — the per-priority P-cells (and the per-student hover that had moved
  // into them, Sam 2026-07-28) are RETIRED with the one-pool columns
  // (2026-08-31): the per-priority math lives in each row's expand, and the
  // rate stays visible on the priority card's own line (H1 above).
  check("H3: no per-priority P-cells survive in the table (the expand carries the detail)",
    !doc.querySelector("#cplFundTable td.cf-prio") &&
    !doc.querySelector('#cplFundTable th[data-sort="prio0"]'));
}
{
  // H4 — collapsible sections: native <details>; default COLLAPSED except the
  // college table (Sam, 2026-07-28); explicit toggles persist across re-render.
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const secs = doc.querySelectorAll("#cplFundingMount details.cplfund-sec");
  check("H4: top-level sections render as collapsible <details> (>=6)", secs.length >= 6);
  check("H4: every section has an <h3> summary",
    Array.from(secs).every(function (s) { return !!s.querySelector("summary h3"); }));
  check("H4: only the college table is open by default; the policy/model sections collapse",
    doc.querySelector('details.cplfund-sec[data-sec="college"]').open === true &&
    doc.querySelector('details.cplfund-sec[data-sec="window"]').open === false &&
    doc.querySelector('details.cplfund-sec[data-sec="priorities"]').open === false &&
    doc.querySelector('details.cplfund-sec[data-sec="formula"]').open === false);
  check("H4: the college table lives inside its section and still renders rows",
    !!doc.querySelector('details.cplfund-sec[data-sec="college"] #cplFundTable tbody tr.cplfund-row'));
  // A user OPENING a collapsed section persists across the re-render an edit triggers.
  const win = doc.querySelector('details.cplfund-sec[data-sec="window"]');
  win.open = true;
  win.dispatchEvent(new window.Event("toggle"));
  T.render();
  check("H4: a user-opened section stays open across a re-render (persisted)",
    doc.querySelector('details.cplfund-sec[data-sec="window"]').open === true);
}
{
  // H5 — reworded metrics: P1 'eligible' → the eligible (pe) count; P3 'portal'
  // → the portal-origin (pp) count, now a NORMAL achievement-based metric (Sam,
  // 2026-07-27): a college earns on its actual portal count, and one with none
  // earns $0 (no more full-cap "advancing").
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-07-27", suppress_below: 5,
    statewide: { pe: 42962, p2: 5000, p3: 16811, pp: 8 },
    colleges: { "Laney": { pe: 44, p2: 0, p3: 0, pp: 3 }, "Ohlone": { pe: 10, p2: 0, p3: 0, pp: 0 } }, unmatched: {} };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ yearPriorities: { "1": {
    "0": { metric: "Headcount of students eligible for at least one course offered through CPL" },
    "2": { metric: "Headcount of students with transcribed Credit from either CPL Student Portal or CPL Landing Page" }
  } } });
  T.render();
  const cards = doc.querySelectorAll(".cplfund-prio .p");
  check("H5: the reworded P1 'eligible' metric is wired to the eligible (pe) count",
    cards[0].textContent.indexOf("42,962") !== -1 && cards[0].textContent.indexOf("of target") !== -1);
  check("H5: the P3 Portal metric shows the portal-origin (pp) count vs target, NOT 'advancing'",
    cards[2].textContent.indexOf("portal-origin") !== -1 &&
    cards[2].textContent.indexOf("of target") !== -1 &&
    cards[2].textContent.indexOf("advancing") === -1);
  // Achievement-based P3: a college with 0 portal students earns $0 on P3 (its
  // full P3 cap is unearned; the P-caps ride the CREDIT share of the one
  // award since 2026-08-31, so the bound is cr_award, not the combined total).
  const oh = T._alloc("Ohlone");     // pp = 0 → P3 fully unearned
  check("H5: P3 earns $0 for a college with no portal students (P3 cap fully unearned, no advance)",
    oh.earned_total <= oh.cr_award - oh.p3 + 1);
  // The P-cells are retired — the same detail now reads from each row's
  // expand: the dtl-table's P3 row stacks Target and Actual.
  T._state.open["c:Ohlone"] = true;
  T._state.open["c:Laney"] = true;
  T.render();
  const p3ActOf = function (name) {
    const row = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
      .find(function (r) { return r.getAttribute("data-id") === "c:" + name; });
    const dtl = row.nextElementSibling.querySelector(".cplfund-dtl-table");
    const trs = Array.from(dtl.querySelectorAll("tr"));
    return trs[3].querySelectorAll("td")[4].textContent;   // P3 row, Actual cell
  };
  check("H5: P3 reads 0 (a measured none) for a college with no portal students — not 'gap'/'…'",
    p3ActOf("Ohlone").indexOf("0") !== -1 &&
    p3ActOf("Ohlone").indexOf("gap") === -1 && p3ActOf("Ohlone").indexOf("…") === -1);
  check("H5: P3 surfaces the portal count for a college WITH portal students",
    p3ActOf("Laney").indexOf("3") !== -1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part I — the veteran-JST qualifier → Veteran Star sector (Sam, 2026-07-27). A
// free-text "75% veteran JSTs uploaded" requirement is AUTO-scored off the daily
// pf.vet_star flag; it adds a 3rd pie sector, a fully-green glyph = all 3 met,
// and the SYSTEM Elig count = institutions meeting all. Since one-pool adoption
// the roster is 118 (the noncredit-only trio ride it, their JST sector replaced
// by exhibits-in-MAP — N1 a), so the denominator is the ONE roster.
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-07-27", suppress_below: 5,
    statewide: { pe: 100, p2: 0, p3: 0, pp: 0 }, colleges: {}, unmatched: {},
    vet_star: { "Alameda": true, "Butte": false }, vet_star_as_of: "2026-07-27T06:00:00Z",
    vet_star_threshold: 0.75, vet_star_n: 1 };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ extraReqs: ["Minimum of 75% of enrolled veteran Joint Services Transcripts uploaded in MAP"] });
  T._setElig({ coordOk: true, coord: { "Alameda": true, "Butte": true },
    optin: { "Alameda": { college: "Alameda" }, "Butte": { college: "Butte" } }, asOf: "2026-07-27" });
  T.render();
  const eligCell = function (name) {
    const tr = Array.from(doc.querySelectorAll("#cplFundTable tbody tr")).find(function (t) { return t.textContent.indexOf(name) !== -1; });
    return Array.from(tr.querySelectorAll("td")).find(function (td) { return (td.getAttribute("title") || "").indexOf("participation gate") !== -1; });
  };
  check("I: the veteran-JST requirement adds a 3rd pie sector (auto-scored via Veteran Star)",
    pieSlices(eligCell("Alameda")) === 3);
  check("I: a Veteran Star college meeting all 3 → a FULLY green glyph (3 of 3)",
    greenSlices(eligCell("Alameda")) === 3);
  check("I: a non-star college is 2 of 3 (JST sector not green)",
    pieSlices(eligCell("Butte")) === 3 && greenSlices(eligCell("Butte")) === 2);
  check("I: SYSTEM Elig counts institutions meeting ALL 3 (only Alameda) → 1 of the 118-row roster",
    doc.querySelector("#cplFundTable .cplfund-systemrow").textContent.indexOf("1/" + (D.colleges.length + 3)) !== -1);
  check("I: the eligibility section shows the Veteran Star auto-score status line",
    doc.querySelector(".cplfund-elig").textContent.indexOf("Veteran Star") !== -1 &&
    doc.querySelector(".cplfund-elig").textContent.indexOf("qualify") !== -1);
  // Without the vet_star feed, the JST sector still shows but reads pending (not green).
  const dom2 = freshDom(); const w2 = dom2.window;   // no CPL_FUNDING_PERF
  const doc2 = boot(w2); const T2 = w2.CPL_FUNDING_TAB;
  T2._setShared({ extraReqs: ["75% of enrolled veteran JSTs uploaded in MAP"] });
  T2._setElig({ coordOk: true, coord: { "Alameda": true }, optin: { "Alameda": { college: "Alameda" } }, asOf: "2026-07-27" });
  T2.render();
  const aCell = Array.from(doc2.querySelectorAll("#cplFundTable tbody tr")).find(function (t) { return t.textContent.indexOf("Alameda") !== -1; });
  const aElig = Array.from(aCell.querySelectorAll("td")).find(function (td) { return (td.getAttribute("title") || "").indexOf("participation gate") !== -1; });
  check("I: feed-less → the JST sector shows but isn't green (pending), so no college is all-3",
    pieSlices(aElig) === 3 && greenSlices(aElig) === 2);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part J — SkyMore (2026-07-27): (1) the "How an allocation is computed" box is
// RESPONSIVE to the Even ⇄ Front-load toggle; (2) the money cell re-weights so
// the max award reads first and the earning line recedes; (3) the retired
// noncredit-feeder cadence surfaces are pinned absent (R9) while the invariant
// they carried — front-load is TIMING, never money — survives on the trio rows.
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  // J1 — even mode: the formula box explains EQUAL annual tranches, not front-load.
  const fEven = doc.querySelector(".cplfund-formula").textContent;
  check("J1: even mode — formula box says the tranche disburses in equal annual amounts",
    fEven.indexOf("equal annual amounts") !== -1);
  check("J1: even mode — formula box does NOT describe front-loading",
    fEven.indexOf("up front in Year 1") === -1 && fEven.toLowerCase().indexOf("front-load") === -1);
  // J2 — click Front-load: the SAME box now tells the front-load story.
  click(window, doc.querySelector('#cplFundDisb button[data-val="frontload"]'));
  const fFL = doc.querySelector(".cplfund-formula").textContent;
  check("J2: front-load mode — formula box explains the full window disbursed up front in Year 1",
    fFL.indexOf("up front in Year 1") !== -1 && fFL.toLowerCase().indexOf("front-load") !== -1);
  check("J2: front-load mode — formula box states timing-only (window total unchanged)",
    fFL.indexOf("window total is unchanged") !== -1);
  check("J2: front-load mode — formula box drops the even-tranche phrasing",
    fFL.indexOf("equal annual amounts") === -1);
}
{
  // J3 — money-cell weighting under one pool: the MAX AWARD is the cell's first
  // read; the earning line (.sub — count, %, adv chip) recedes (smaller, muted,
  // normal weight). Guarded on the injected CSS (Sam: "get the focus in the
  // right place"). The retired .cf-prio cell weights went with the P-columns.
  check("J3: the award cell's earning sub-line recedes (block, .68rem, muted, weight 400)",
    /\.cf-award \.sub, \.cplfund-table td \.sub \{ display: block; font-size: \.68rem; color: var\(--text-muted\); font-weight: 400; \}/.test(consumerSrc));
  check("J3: the advance chip is a quiet ghosted tag, never a shout (muted on surface-muted)",
    /\.cf-adv \{[^}]*color: var\(--text-muted\); background: var\(--surface-muted\);/.test(consumerSrc));
  check("J3: the award figures read in tabular numerals so the column scans",
    /\.cf-award \{ font-variant-numeric: tabular-nums;/.test(consumerSrc));
}
{
  // J4/J5 — the noncredit feeder section, its standalone table and the
  // two-batch cadence readout are RETIRED (R9, ruled 2026-08-31): NOCE /
  // SD Cont. Ed / Calbright are ordinary rows in the one institution table,
  // earning by ORIGINATION with no advances (N2 b). The second solve
  // (_ncModel/_nc) is gone from the API. What SURVIVES is the invariant the
  // batch arithmetic used to carry: disbursement timing never moves an award.
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  check("J4: the noncredit feeder section is gone (R9)",
    !doc.querySelector('details.cplfund-sec[data-sec="feeder"]') &&
    doc.getElementById("cplFundingMount").textContent.indexOf("2 batches") === -1);
  check("J4: ONE table — no standalone-noncredit second table survives",
    doc.querySelectorAll(".cplfund-table").length === 1);
  check("J4: the retired NC second solve is gone from the API (_ncModel/_nc)",
    T._ncModel === undefined && T._nc === undefined && !doc.querySelector("#cplFundLane"));
  check("J4: the trio ride the one table as ordinary rows (NC only chip)",
    !!Array.from(doc.querySelectorAll(".cplfund-row")).find(function (r) { return /NOCE/.test(r.textContent) && /NC only/.test(r.textContent); }));
  // J5 — front-load is timing, not money: a noncredit-only institution's award
  // is unchanged; only the year placement moves. And origination pays no
  // advance in EITHER mode (N2 b).
  const noceEven = T._alloc("NOCE");
  click(window, doc.querySelector('#cplFundDisb button[data-val="frontload"]'));
  const noceFl = T._alloc("NOCE");
  check("J5: front-load doubles nothing for the trio — the award itself is unchanged",
    Math.round(noceFl.total) === Math.round(noceEven.total));
  check("J5: only the timing moves (even: half per year; front-load: all in Year 1)",
    Math.abs(noceEven.y1 - noceEven.total / 2) < 1 &&
    Math.abs(noceFl.y1 - noceFl.total) < 1 && Math.abs(noceFl.y2) < 1);
  check("J5: origination pays no advance in either mode (earned stays $0 — N2 b)",
    noceEven.earned_total === 0 && noceFl.earned_total === 0);
}

// ─────────────────────────────────────────────────────────────────────────────

finish();

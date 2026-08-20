// CPL Implementation Funding tab — per-student funding rate, the veteran-JST qualifier, and SkyMore (Parts H, I, J).
//
// The curator-typed per-student rate; the JST qualifier feeding the Veteran Star
// sector; and the "How an allocation is computed" box.
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
  // allocation basis (credit FTES) and is therefore no longer a headcount %.
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
  check("H2: halving $/student ~doubles the student target (inverse), unless clamped at 100%",
    Math.abs(a50.p1_heads - 2 * a100.p1_heads) < 1 || a50.p1_heads >= D.colleges[0].headcount - 1);
  check("H2: changing the per-student rate moves NO dollars (allocation is share-based)",
    Math.abs(a50.total - a100.total) < 1);

  // H3 — the per-student rate moved from the P-cell to its HOVER (Sam,
  // 2026-07-28): it varies per college once the $150k floor tops up small
  // colleges, so showing it inline reads as inequitable. It's now in the title.
  const pcell = doc.querySelector("#cplFundTable tbody tr.cplfund-row td.cf-prio");
  check("H3: the per-student rate is no longer shown inline (.cf-rate removed)",
    !!pcell && pcell.querySelector(".cf-rate") === null);
  check("H3: the P-cell hover explains the per-student rate ($/student)",
    !!pcell && /\/student/.test(pcell.getAttribute("title") || ""));
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
  // full P3 cap is unearned); a college with a portal count shows it in the cell.
  T.render();
  const oh = T._alloc("Ohlone");     // pp = 0 → P3 fully unearned
  check("H5: P3 earns $0 for a college with no portal students (P3 cap fully unearned, no advance)",
    oh.earned_total <= oh.total - oh.p3 + 1);
  const rowsE = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"));
  const ohP3 = rowsE.find(function (r) { return /Ohlone/.test(r.textContent); }).querySelectorAll("td.cf-prio")[2];
  const laP3 = rowsE.find(function (r) { return /Laney/.test(r.textContent); }).querySelectorAll("td.cf-prio")[2];
  check("H5: P3 cell reads 0 (none) for a college with no portal students — not 'gap'/'…'",
    ohP3.querySelector(".cf-a").textContent.indexOf("0") !== -1 &&
    ohP3.textContent.indexOf("gap") === -1 && ohP3.textContent.indexOf("…") === -1);
  check("H5: P3 cell surfaces the portal count for a college WITH portal students",
    laP3.querySelector(".cf-a").textContent.indexOf("3") !== -1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part I — the veteran-JST qualifier → Veteran Star sector (Sam, 2026-07-27). A
// free-text "75% veteran JSTs uploaded" requirement is AUTO-scored off the daily
// pf.vet_star flag; it adds a 3rd pie sector, a fully-green glyph = all 3 met,
// and the SYSTEM Elig count = colleges meeting all.
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
  check("I: SYSTEM Elig counts colleges meeting ALL 3 (only Alameda) → 1 of N",
    doc.querySelector("#cplFundTable .cplfund-systemrow").textContent.indexOf("1/" + D.colleges.length) !== -1);
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
// RESPONSIVE to the Even ⇄ Front-load toggle; (2) the priority cell re-weights so
// the earned DOLLAR is bold and the count/% recede; (3) the noncredit feeder rows
// reflect the 2-batch-per-year disbursement cadence.
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
  // J3 — priority cell weighting: the earned dollar (.cf-u) is bold; the actual
  // line (.cf-a, holds the student count) and the % (.cf-pct) recede. Guarded on
  // the injected CSS (Sam: "get the focus in the right place").
  check("J3: earned dollar (.cf-u) is bold navy",
    /\.cf-prio \.cf-u \{ font-weight: 700; color: var\(--navy-primary\); \}/.test(consumerSrc));
  check("J3: the actual line (.cf-a, student count) is de-bolded (normal weight)",
    /\.cf-prio \.cf-a \{ font-weight: 400;/.test(consumerSrc));
  check("J3: the % of target (.cf-pct) is de-bolded (normal weight)",
    /\.cf-prio \.cf-pct \{ color: var\(--green-progress\); font-weight: 400; \}/.test(consumerSrc));
}
{
  // J4 — feeder rows reflect the 2-batch-per-year disbursement (like the colleges,
  // Timing section). Even mode: pool per-year = $500,000 → $250,000 per batch.
  const { window } = freshDom();
  const doc = boot(window);
  const feederSec = doc.querySelector('details.cplfund-sec[data-sec="feeder"]');
  check("J4: feeder section explains the two-batch-per-year cadence",
    feederSec.textContent.indexOf("two batches per funding year") !== -1);
  const feederTable = doc.querySelectorAll(".cplfund-table")[1];
  check("J4: feeder rows surface a per-batch amount (2 batches · $X ea)",
    feederTable.textContent.indexOf("2 batches") !== -1 && feederTable.textContent.indexOf(" ea") !== -1);
  check("J4: even mode — FEEDER POOL per-batch = half the per-year pool ($250,000 ea)",
    feederTable.querySelector("tfoot").textContent.indexOf("$250,000 ea") !== -1);
  // J5 — front-load: whole carve-out lands in Year 1, still 2 batches ($500,000 ea).
  click(window, doc.querySelector('#cplFundDisb button[data-val="frontload"]'));
  check("J5: front-load — FEEDER POOL per-batch = half the full carve-out ($500,000 ea)",
    doc.querySelectorAll(".cplfund-table")[1].querySelector("tfoot").textContent.indexOf("$500,000 ea") !== -1);
}

// ─────────────────────────────────────────────────────────────────────────────

finish();

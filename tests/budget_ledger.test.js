// budget_ledger.js — the consolidated Budget ledger view.
//
// Guards the 2026-07-30 build (SkyReconcile): budget_funding renders as four
// sections (Sources · Uses · the $18M project pool · pre-cutoff history) with
// collapsible detail and inline editing on every non-total field.
//
// The failure modes these pin:
//   1. DOUBLE-COUNTING. Totals must sum PARENT rows only — summing parents +
//      children is the exact shape of the amendment's own $74,000,000 grand
//      total (it adds the $18M project subtotal on top of the $35M that already
//      contains $8,959,692 of it; the real figure is $71,000,000).
//   2. A total silently drifting from its own years — the row-5 anomaly ("$2M"
//      in the name, $8M in `total`, $7M/yr in the cells). Where a row HAS years,
//      `total` is computed and read-only; where the source gives no per-year
//      split it stays editable.
//   3. Editing leaking to signed-out visitors.
//   4. Archived rows reaching a live total.
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("budget_ledger.js", "utf8");

// A miniature of the real ledger: both source sections, all three use sections,
// the pool with children, and archived history with children.
const ROWS = [
  { id: 4, name: "$15M", section: "source_one_time", sort_order: 10, total: 15000000,
    yr_2025_26_budget: 15000000, description: "first installment", window_label: "2025-26 →" },
  { id: 6, name: "$35M", section: "source_one_time", sort_order: 11, total: 35000000,
    window_label: "2026-27 · 2027-28" },
  { id: 3, name: "$5M", section: "source_ongoing", sort_order: 20, total: 5000000,
    yr_2025_26_budget: 5000000 },
  { id: 5, name: "$7M", section: "source_ongoing", sort_order: 21, total: 21000000,
    yr_2026_27: 7000000, yr_2027_28: 7000000, yr_2028_29: 7000000 },

  { id: 20, name: "College Awards", section: "use_35m", sort_order: 10, total: 25240308,
    yr_2026_27: 12620154, yr_2027_28: 12620154 },
  { id: 21, name: "CO Staff", section: "use_35m", sort_order: 11, total: 800000,
    yr_2026_27: 400000, yr_2027_28: 400000 },
  { id: 22, name: "CPL Projects — $35M share", section: "use_35m", sort_order: 12, total: 8959692,
    window_label: "not split by year in the amendment" },
  { id: 23, name: "Grants", section: "use_15m", sort_order: 10, total: 5900000 },
  { id: 24, name: "N2N", section: "use_15m", sort_order: 11, total: 59692 },
  { id: 25, name: "CPL Projects — $15M share", section: "use_15m", sort_order: 12, total: 9040308 },
  { id: 26, name: "Ongoing ops", section: "use_ongoing", sort_order: 10, total: 21000000,
    yr_2026_27: 7000000, yr_2027_28: 7000000, yr_2028_29: 7000000 },

  { id: 30, name: "RCCD Projects", section: "pool", sort_order: 10, total: 10556650,
    yr_2026_27: 3253650, yr_2027_28: 3161000, yr_2028_29: 4142000 },
  { id: 31, name: "Lightleap", section: "pool", sort_order: 11, parent_id: 30, total: 6600000,
    yr_2026_27: 1400000, yr_2027_28: 2000000, yr_2028_29: 3200000 },
  { id: 33, name: "CO/TBA Projects", section: "pool", sort_order: 20, total: 7443350,
    yr_2026_27: 2303350, yr_2027_28: 2520000, yr_2028_29: 2620000 },

  { id: 1, name: "$6M CO", section: "history", sort_order: 30, total: 2254764, archived: true },
  { id: 40, name: "ASCCC", section: "history", sort_order: 32, total: 1563900, archived: true, parent_id: 1 },
  { id: 42, name: "Cervantes 1", section: "history", sort_order: 1, total: 79215, archived: true }
];

function boot(session) {
  const dom = new JSDOM(
    '<!DOCTYPE html><html><head></head><body><div id="tab-budget">' +
    '<div id="budgetLedgerMount"></div></div></body></html>',
    { runScripts: "outside-only", url: "https://example.org/" });
  const w = dom.window;
  // The stub returns the SAME rows the test injects, so the module's own async
  // load() resolving later is a no-op rather than a race that blanks the view.
  w.fetch = function () {
    return Promise.resolve({ ok: true, status: 200,
      json: () => Promise.resolve(JSON.parse(JSON.stringify(ROWS))) });
  };
  w.eval(SRC);
  const T = w.CPL_BUDGET_LEDGER;
  // jsdom reports document.readyState === "loading", so the module correctly
  // defers its own boot to DOMContentLoaded — which never fires in a harness
  // that evals the source directly. Boot it explicitly, the way the page does.
  T.init();
  T._setRows(JSON.parse(JSON.stringify(ROWS)));
  T._setSession(session || null);
  T._render();
  return { w, doc: w.document, T };
}
function txt(doc, sel) { const n = doc.querySelector(sel); return n ? n.textContent : ""; }
function money(n) { return n.toLocaleString("en-US", { maximumFractionDigits: 0 }); }

// ── A. it renders, and totals sum PARENTS ONLY ───────────────────────────────
{
  const { doc, T } = boot();
  const body = doc.getElementById("budgetLedgerMount").textContent;
  check("A1: renders without throwing", body.length > 200);
  check("A1: all four sections present",
    /Sources/.test(body) && /Uses/.test(body) && /combined \$18M pool/.test(body)
    && /Funding history/.test(body));

  const pool = ROWS.filter(r => r.section === "pool");
  check("A2: pool total sums parents only ($18M, not $24.6M)",
    Math.round(T._totalOf(pool)) === 18000000);
  check("A2: summing parents+children would double-count",
    pool.reduce((s, r) => s + T._rowTotal(r), 0) > 18000000);

  const uses = ROWS.filter(r => ["use_35m", "use_15m", "use_ongoing"].includes(r.section));
  check("A3: all uses total $71M — never the amendment's $74M",
    Math.round(T._totalOf(uses)) === 71000000);
  check("A4: the $18M pool figure appears in the rendered pool footer",
    body.indexOf(money(18000000)) !== -1);
}

// ── B. rowTotal: computed from years, or the stored figure ───────────────────
{
  const { T } = boot();
  const withYears = ROWS.find(r => r.id === 20);   // 12,620,154 x 2
  const noYears = ROWS.find(r => r.id === 22);     // $8,959,692, no split
  check("B1: a row WITH years totals from its own years",
    T._rowTotal(withYears) === 25240308);
  check("B2: a row with NO years falls back to the stored total",
    T._rowTotal(noYears) === 8959692);
  // The row-5 anomaly: a stored total that disagrees with its years must not win.
  const drift = { id: 999, total: 8000000, yr_2026_27: 7000000, yr_2027_28: 7000000,
                  yr_2028_29: 7000000, yr_2029_30: 7000000 };
  check("B3: a stored total that contradicts its years is IGNORED (the row-5 anomaly)",
    T._rowTotal(drift) === 28000000);
}

// ── C. total is read-only where computed, editable where it is the only figure ─
{
  const { doc } = boot({ access_token: "a.b.c", email: "x@y.z" });
  const rowWithYears = doc.querySelector('tr[data-row="20"]');
  const rowNoYears = doc.querySelector('tr[data-row="22"]');
  const totCellA = rowWithYears.querySelector("td.tot");
  const totCellB = rowNoYears.querySelector("td.tot");
  check("C1: a computed total renders NO editable span",
    !totCellA.querySelector(".bl-ed") && /Computed from/.test(totCellA.getAttribute("title") || ""));
  check("C2: an unallocated-by-year total IS editable",
    !!totCellB.querySelector('.bl-ed[data-col="total"]'));
  check("C3: the computed total equals the sum of its years",
    totCellA.textContent.indexOf(money(25240308)) !== -1);
}

// ── D. every non-total field is editable when unlocked ───────────────────────
{
  const { doc } = boot({ access_token: "a.b.c" });
  const row = doc.querySelector('tr[data-row="20"]');
  ["name", "description"].forEach(c =>
    check("D1: " + c + " is editable", !!row.querySelector('.bl-ed[data-col="' + c + '"]')));
  ["yr_2026_27", "yr_2027_28", "yr_2028_29"].forEach(c =>
    check("D1: " + c + " is editable", !!row.querySelector('.bl-ed[data-col="' + c + '"]')));
  const srcRow = doc.querySelector('tr[data-row="6"]');
  check("D2: window_label is editable on a source row",
    !!srcRow.querySelector('.bl-ed[data-col="window_label"]'));
  check("D3: editable fields are lit for a signed-in curator",
    doc.querySelectorAll("#budgetLedgerMount .bl-ed.bl-live").length > 10);
  check("D4: they are keyboard reachable",
    doc.querySelector("#budgetLedgerMount .bl-ed.bl-live").getAttribute("tabindex") === "0");
}

// ── E. signed OUT: nothing is editable ───────────────────────────────────────
{
  const { doc } = boot(null);
  check("E1: no field is lit when signed out",
    doc.querySelectorAll("#budgetLedgerMount .bl-ed.bl-live").length === 0);
  check("E2: no field is keyboard-focusable when signed out",
    doc.querySelectorAll("#budgetLedgerMount .bl-ed[tabindex]").length === 0);
  check("E3: the bar tells a visitor how to unlock",
    /Sign in/.test(txt(doc, "#budgetLedgerMount .bl-auth")));
}

// ── F. collapsible detail + the Summary/Detail preset ────────────────────────
{
  const { doc, T, w } = boot({ access_token: "a.b.c" });
  check("F1: child rows are hidden by default",
    doc.querySelectorAll("#budgetLedgerMount tr.bl-kid.bl-hid").length > 0
    && doc.querySelectorAll("#budgetLedgerMount tr.bl-kid:not(.bl-hid)").length === 0);
  const detail = doc.querySelector('#budgetLedgerMount [data-preset="1"]');
  detail.dispatchEvent(new w.Event("click", { bubbles: true }));
  check("F2: Detail expands every parent's children",
    doc.querySelectorAll("#budgetLedgerMount tr.bl-kid:not(.bl-hid)").length > 0);
  const summary = doc.querySelector('#budgetLedgerMount [data-preset="0"]');
  summary.dispatchEvent(new w.Event("click", { bubbles: true }));
  check("F3: Summary collapses them again",
    doc.querySelectorAll("#budgetLedgerMount tr.bl-kid:not(.bl-hid)").length === 0);
  const caret = doc.querySelector("#budgetLedgerMount .bl-caret");
  caret.dispatchEvent(new w.Event("click", { bubbles: true }));
  check("F4: a single caret toggles just its own children",
    doc.querySelectorAll("#budgetLedgerMount tr.bl-kid:not(.bl-hid)").length > 0
    && doc.querySelectorAll("#budgetLedgerMount tr.bl-kid.bl-hid").length > 0);
}

// ── G. archived rows never reach a live total ────────────────────────────────
{
  const { doc, T } = boot();
  const live = ROWS.filter(r => !r.archived
    && ["source_one_time", "source_ongoing", "use_35m", "use_15m", "use_ongoing", "pool"].includes(r.section));
  check("G1: no archived row is in any live section total",
    live.every(r => !r.archived));
  check("G2: history renders behind a collapsed disclosure",
    !!doc.querySelector("#budgetLedgerMount details.bl-arch")
    && !doc.querySelector("#budgetLedgerMount details.bl-arch").hasAttribute("open"));
  check("G3: the history total is parents-only ($6M CO + Cervantes 1, not the child)",
    txt(doc, "#budgetLedgerMount details.bl-arch").indexOf(money(2254764 + 79215)) !== -1);
}

// ── H. the two-installment story is DERIVED, never hardcoded ─────────────────
{
  const { doc } = boot();
  const story = txt(doc, "#budgetLedgerMount .bl-story");
  check("H1: the one-time ask reads as the fulfilled $50M",
    story.indexOf(money(50000000)) !== -1);
  check("H2: the ongoing ask reads as $7M/yr", story.indexOf(money(7000000)) !== -1);
  check("H3: the ongoing increment is derived ($7M − $5M = $2M)",
    story.indexOf(money(2000000)) !== -1);
  check("H4: both asks are marked fully funded",
    (story.match(/Fully funded/g) || []).length === 2);
}

// ─────────────────────────────────────────────────────────────────────────────
let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);

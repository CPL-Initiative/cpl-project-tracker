// CPL Implementation Funding tab — the Combined COLUMN is RETIRED; the pair's
// sum IS the one award (one-pool adoption, R6/R7, ruled 2026-08-31).
//
// This file used to pin Sam's item-2 ruling (2026-08-30): a Combined cell
// spanning each CR/NC row pair, with nth-child compensation for the NC rows'
// missing cell. One pool retired the whole mechanism: ONE row per institution
// (R6), a CR award / NC award column pair instead of Total/Combined (the Award
// range section went with it — R7), and ONE solve whose decomposition the pair
// displays. What survives is the INVARIANT the column existed to show, now
// structural: **the CR share + the NC share sum to the institution's one
// combined max award, on every surface** — the row, the SYSTEM row, the CSV,
// and the memo. A pair that renders but sums past its award would be the old
// column's defect (re-printing one lane's figure) reborn, so the sums are
// pinned everywhere the pair appears, and the retired surfaces are pinned
// absent (the repo's retirement-guard pattern — tests/cpl_funding_rural.test.js).
//
// Memory budget (tests/lib/cpl_funding_harness.js): ~44 MB per booted window —
// this suite uses 2.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_combined.test.js`).
const {
  check,
  freshDom,
  boot,
  D,
  finish,
} = require("./lib/cpl_funding_harness.js");

// First $-figure in a cell (the max award; the earning sub-line's figure comes after).
function firstMoney(el) {
  const m = (el ? el.textContent : "").match(/\$[\d,]+/);
  return m ? Number(m[0].replace(/[$,]/g, "")) : NaN;
}
// Minimal CSV line splitter honoring double-quoted fields (csvEscape's shape).
function splitCsv(line) {
  const out = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

const NET = 25240308;   // the one pool (A2 of the anchor suite pins it to the model)
const TRIO = ["NOCE", "SD Cont. Ed", "Calbright"];

// ── Window 1: default boot — retirement guards + the pair-sum invariant ─────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const table = doc.querySelector(".cplfund-table");

  // The retired mechanism, pinned absent (R6/R7, 2026-08-31).
  const ths = Array.from(table.querySelectorAll("thead th"));
  check("R7: no Combined column in the header (the pair's sum IS the one award)",
    !ths.some(function (th) { return (th.getAttribute("data-sort") || "") === "combined"; }));
  check("R6/R7: no Total column either — the money columns are the CR/NC award pair",
    !ths.some(function (th) { return (th.getAttribute("data-sort") || "") === "total"; }) &&
    !!table.querySelector('th[data-sort="cr_award"]') && !!table.querySelector('th[data-sort="nc_award"]'));
  check("R7: no spanning combined cell survives anywhere", !table.querySelector("td.cf-combined"));
  check("R6: no paired NC rows and no NC SYSTEM row — one row per institution",
    !table.querySelector(".cplfund-ncrow") && !table.querySelector(".cplfund-ncout") &&
    !table.querySelector(".cplfund-ncsysrow"));
  check("R6: exactly ONE SYSTEM row, carrying the CR/NC award pair",
    table.querySelectorAll("tr.cplfund-systemrow").length === 1 &&
    table.querySelector("tr.cplfund-systemrow").querySelectorAll("td.cf-award").length === 2);

  // THE SUM, at the model: cr_award + nc_award == the one combined award, for
  // every institution on the roster (trio included), and Σ awards == the pool.
  const names = D.colleges.map(function (c) { return c.college; }).concat(TRIO);
  let worst = 0, sumW = 0;
  names.forEach(function (n) {
    const a = T._alloc(n);
    worst = Math.max(worst, Math.abs((a.cr_award + a.nc_award) - a.total));
    sumW += a.total;
  });
  check("model: CR share + NC share == the combined max award for all 118 institutions (max err < $0.01)",
    names.length === 118 && worst < 0.01);
  check("model: Σ combined awards == the $25,240,308 pool (conservation)",
    Math.abs(sumW - NET) < 1);
  check("model: a noncredit-only institution's whole award is its NC share (cr_award = $0)",
    TRIO.every(function (n) { const a = T._alloc(n); return a.cr_award === 0 && Math.abs(a.nc_award - a.total) < 0.01; }));

  // THE SUM, on a rendered row (Mt. San Antonio — at the cap, both lanes live).
  // Default view is Annual funding, so the cells carry the per-year figures:
  // the pair must sum to total ÷ years, never to one lane's figure re-printed.
  const crRows = Array.from(table.querySelectorAll("tbody tr.cplfund-row"));
  check("institution rows render, one per institution", crRows.length === 118);
  const mtRow = crRows.find(function (r) { return /Mt San Antonio/.test(r.textContent); });
  const mtCells = mtRow.querySelectorAll("td.cf-award");
  const mt = T._alloc("Mt San Antonio");
  check("row: the CR + NC award cells sum to the combined max award (per-year view; ±$2 rounding)",
    mtCells.length === 2 &&
    Math.abs((firstMoney(mtCells[0]) + firstMoney(mtCells[1])) - mt.total / 2) <= 2 &&
    firstMoney(mtCells[1]) > 0);
  // A no-noncredit institution: the pair is CR + an explicit $0 — never NaN,
  // never doubled, and the zero is a CHECKABLE CLAIM (Sam's data-quality
  // instrument, 2026-08-28), not a blank.
  const taftRow = crRows.find(function (r) { return /Taft/.test(r.textContent); });
  const taftCells = taftRow.querySelectorAll("td.cf-award");
  const taft = T._alloc("Taft");
  check("row: a no-noncredit institution's pair is CR + $0 'none on record' (combined = CR alone)",
    taft.nc_award === 0 &&
    Math.abs(firstMoney(taftCells[0]) - taft.total / 2) <= 1 &&
    firstMoney(taftCells[1]) === 0 && /none on record/.test(taftCells[1].textContent));

  // THE SUM, on the SYSTEM row: the statewide pair must reconstitute the pool.
  const sysCells = table.querySelector("tr.cplfund-systemrow").querySelectorAll("td.cf-award");
  check("SYSTEM row: the statewide CR + NC pair sums to the pool's annual tranche (±$2)",
    Math.abs((firstMoney(sysCells[0]) + firstMoney(sysCells[1])) - NET / 2) <= 2);

  // Under Combined (front-loaded) funding the same cells carry the window
  // figures — the pair must still reconstitute, now to the full pool.
  doc.querySelector('#cplFundDisb button[data-val="frontload"]')
    .dispatchEvent(new window.Event("click", { bubbles: true }));
  const sysCellsFl = doc.querySelector("tr.cplfund-systemrow").querySelectorAll("td.cf-award");
  check("SYSTEM row under Combined funding: the pair sums to the full $25,240,308 pool (±$2)",
    Math.abs((firstMoney(sysCellsFl[0]) + firstMoney(sysCellsFl[1])) - NET) <= 2);
  doc.querySelector('#cplFundDisb button[data-val="even"]')
    .dispatchEvent(new window.Event("click", { bubbles: true }));

  // Sortable for real: the award pair's headers engage the sort.
  const crTh = doc.querySelector('.cplfund-table thead th[data-sort="cr_award"]');
  crTh.dispatchEvent(new window.Event("click", { bubbles: true }));
  const after = doc.querySelector('.cplfund-table thead th[data-sort="cr_award"]');
  const sorted = Array.from(doc.querySelectorAll(".cplfund-table tbody tr.cplfund-row"))
    .slice(0, 2).map(function (r) { return firstMoney(r.querySelectorAll("td.cf-award")[0]); });
  check("clicking the CR award header engages the sort (descending money first)",
    !!after && after.getAttribute("aria-sort") !== "none" && sorted[0] >= sorted[1]);

  // THE SUM, in the CSV: one line per institution; Credit share + Noncredit
  // share == Max award on every line, SYSTEM included (cells round to whole
  // dollars independently, so ±$1).
  const csv = T._csv().split("\r\n");
  const head = splitCsv(csv[1]);
  const iCr = head.findIndex(function (h) { return /^Credit share /.test(h); });
  const iNc = head.findIndex(function (h) { return /^Noncredit share /.test(h); });
  const iMax = head.findIndex(function (h) { return /^Max award /.test(h); });
  check("CSV: the header carries the Credit share / Noncredit share / Max award columns",
    iCr >= 0 && iNc === iCr + 1 && iMax === iCr + 2);
  check("CSV: no Combined column survives in the header",
    !head.some(function (h) { return /^Combined/.test(h); }));
  const dataLines = csv.slice(2).filter(function (l) { return l.trim(); }).map(splitCsv);
  const badSum = dataLines.filter(function (f) {
    return Math.abs((Number(f[iCr]) + Number(f[iNc])) - Number(f[iMax])) > 1;
  });
  check("CSV: Credit + Noncredit == Max award on every line (118 institutions + SYSTEM; ±$1 rounding)",
    dataLines.length >= 119 && badSum.length === 0);
  const sysLine = dataLines.find(function (f) { return /SYSTEM/.test(f[1]); });
  check("CSV: the SYSTEM line's pair reconstitutes the pool exactly",
    !!sysLine && Number(sysLine[iCr]) + Number(sysLine[iNc]) === NET && Number(sysLine[iMax]) === NET);
  check("CSV: the trio ride as ordinary institution lines",
    TRIO.every(function (n) { return dataLines.some(function (f) { return f[1] === n || f[1].indexOf(n) === 0; }); }));

  // THE SUM, in the memo (the exported document — it leaves the tab, so the
  // conservation matters most there).
  const mm = T._memoModel();
  const memoWorst = (mm.instRows || []).reduce(function (mx, r) {
    return Math.max(mx, Math.abs((r.cr + r.nc) - r.total));
  }, 0);
  check("memo model: every institution row's CR + NC == its one award (max err < $0.01)",
    mm.instRows.length === 118 && memoWorst < 0.01);
  check("memo model: Credit shares + Noncredit shares == the pool total",
    Math.abs((mm.crSum + mm.ncSum) - mm.collegePool) < 1 && Math.abs(mm.collegePool - NET) < 1);
  const memoHtml = T._buildMemo("memo");
  check("memo: the allocation table is the share pair + Max award — no Combined column",
    /Credit share/.test(memoHtml) && /Noncredit share/.test(memoHtml) &&
    /Max award/.test(memoHtml) && !/<th[^>]*>Combined/.test(memoHtml));
}

// ── Window 2: hidden columns — the simple one-shape rule (R6) ───────────────
// The old generator compensated the NC rows' missing Combined cell with p−1
// nth-child selectors. One row shape per institution retired that whole class
// of misalignment: the guard is now that the SIMPLE rule is back — one
// selector per hidden column, detail rows spared, and NO row-class
// compensation selectors anywhere.
{
  const dom = freshDom();
  // Hide the NC award column and the county column from stored prefs — the
  // adjacent-column state that used to shear the paired rows.
  dom.window.localStorage.setItem("cplfund_cols_v1",
    JSON.stringify({ college: { nc_award: true, working_adults: true } }));
  const doc = boot(dom.window);
  const table = doc.querySelector(".cplfund-table");
  const ths = Array.from(table.querySelectorAll("thead th"));
  const pos = function (key) { return ths.findIndex(function (th) { return th.getAttribute("data-sort") === key; }) + 1; };
  const styles = Array.from(doc.querySelectorAll("#cplFundTable style"))
    .map(function (s) { return s.textContent; }).join("\n");
  check("hiding NC award + county injects one plain nth-child rule per column",
    styles.indexOf("td:nth-child(" + pos("nc_award") + ")") >= 0 &&
    styles.indexOf("td:nth-child(" + pos("working_adults") + ")") >= 0);
  check("the hide rules spare detail rows (a drill-in never collapses)",
    /tr:not\(\.cplfund-detail\)/.test(styles));
  check("no NC-row compensation selectors survive (R6 — one row shape)",
    styles.indexOf("cplfund-ncrow") === -1 && styles.indexOf("cplfund-ncsysrow") === -1);
  // The DOM keeps the cells even when CSS hides them — the nth-child
  // arithmetic for every later column depends on them existing.
  check("a hidden NC award column still emits its DOM cell on every row",
    table.querySelector("tbody tr.cplfund-row").querySelectorAll("td.cf-award").length === 2);
  check("the CSV still exports the hidden pair member (scope, not shape)",
    /Noncredit share /.test(dom.window.CPL_FUNDING_TAB._csv()));
}

finish();

// CPL Implementation Funding tab — the Combined award column (Sam's item-2
// ruling, 2026-08-30): the institution's ONE total (CR cap + NC cap) as a cell
// that spans the CR/NC pair from the credit row, centered, sortable — a column,
// not a third Award-range row.
//
// What these tests pin, and why each is the failure mode rather than the
// feature:
//   * The SUM — a combined cell that renders but adds the wrong halves (or
//     re-prints one row's figure, the retired NC $ column's defect) would pass
//     any render-smoke test.
//   * The SPAN — the cell must sit on the CR row with rowspan=2 and the NC row
//     shapes must emit NO cell in the column, or every column to the right
//     shears one position on half the table's rows.
//   * The HIDE MACHINERY — colHideStyleHtml() addresses columns by nth-child,
//     which counts DOM cells; with the NC rows one td short, a hidden column
//     right of Combined needs the p−1 selector on NC rows and the Combined
//     rule must not touch them. This is exactly the kind of misalignment a
//     reviewer's eye misses in a 230-row table.
//
// Memory budget (tests/lib/cpl_funding_harness.js): ~44 MB per booted window —
// this suite uses 2.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_combined.test.js`).
const {
  check,
  freshDom,
  boot,
  finish,
} = require("./lib/cpl_funding_harness.js");

// First $-figure in a cell (the cap; the earned sub-line's figure comes after).
function firstMoney(el) {
  const m = (el ? el.textContent : "").match(/\$[\d,]+/);
  return m ? Number(m[0].replace(/[$,]/g, "")) : NaN;
}

// ── Window 1: default boot — structure, sums, span, sortability ─────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const table = doc.querySelector(".cplfund-table");

  // The header: one sortable Combined column, sitting right after Total.
  const ths = Array.from(table.querySelectorAll("thead th"));
  const combinedTh = ths.find((th) => (th.getAttribute("data-sort") || "") === "combined");
  check("header carries a sortable Combined column", !!combinedTh);
  check("Combined header names the window (label parallel to Total's)",
    !!combinedTh && /^Combined /.test(combinedTh.textContent.trim()));
  const totalIdx = ths.findIndex((th) => (th.getAttribute("data-sort") || "") === "total");
  check("Combined sits directly after the Total column",
    totalIdx >= 0 && ths.indexOf(combinedTh) === totalIdx + 1);

  // An in-lane pair: combined = CR total + NC total, once, spanning both rows.
  const crRows = Array.from(table.querySelectorAll("tbody tr.cplfund-row"));
  check("college rows render", crRows.length > 100);
  const inLanePair = crRows.map((cr) => {
    const nc = cr.nextElementSibling;
    return nc && nc.classList.contains("cplfund-ncrow") && !nc.classList.contains("cplfund-ncout")
      ? { cr, nc } : null;
  }).filter(Boolean)[0];
  check("an in-lane CR/NC pair exists to measure", !!inLanePair);
  if (inLanePair) {
    const tots = inLanePair.cr.querySelectorAll("td.tot");
    check("CR row carries Total then Combined (two .tot cells)", tots.length === 2);
    const combinedCell = inLanePair.cr.querySelector("td.cf-combined");
    check("combined cell spans the pair (rowspan=2)",
      !!combinedCell && combinedCell.getAttribute("rowspan") === "2");
    const crTotal = firstMoney(tots[0]);
    const ncTotal = firstMoney(inLanePair.nc.querySelector("td.tot"));
    const combined = firstMoney(combinedCell);
    check("combined = CR total + NC total (in-lane pair)",
      isFinite(crTotal) && isFinite(ncTotal) && ncTotal > 0 &&
      Math.abs(combined - (crTotal + ncTotal)) <= 1);
    check("NC row emits NO combined cell (the span covers it)",
      !inLanePair.nc.querySelector("td.cf-combined"));
    check("NC row carries exactly one fewer td than its CR row",
      inLanePair.nc.querySelectorAll("td").length ===
      inLanePair.cr.querySelectorAll("td").length - 1);
  }

  // A pair whose NC half earns nothing (below threshold or none on record):
  // combined = the CR total alone — never NaN, never doubled.
  const outPair = crRows.map((cr) => {
    const nc = cr.nextElementSibling;
    return nc && nc.classList.contains("cplfund-ncout") ? { cr, nc } : null;
  }).filter(Boolean)[0];
  check("an out-of-lane pair exists to measure", !!outPair);
  if (outPair) {
    const tots = outPair.cr.querySelectorAll("td.tot");
    check("out-of-lane pair: combined = CR total alone",
      Math.abs(firstMoney(outPair.cr.querySelector("td.cf-combined")) - firstMoney(tots[0])) <= 1);
  }

  // The statewide pair mirrors the college pairs: statewide CR total + the
  // whole carve-out's caps, spanning its two rows.
  const sysCr = table.querySelector("tbody tr.cplfund-systemrow:not(.cplfund-ncsysrow)");
  const sysNc = table.querySelector("tbody tr.cplfund-ncsysrow");
  check("system pair renders with a spanning combined cell",
    !!sysCr && !!sysNc && !!sysCr.querySelector("td.cf-combined") &&
    sysCr.querySelector("td.cf-combined").getAttribute("rowspan") === "2" &&
    !sysNc.querySelector("td.cf-combined"));
  if (sysCr && sysNc) {
    const sysTotal = firstMoney(sysCr.querySelectorAll("td.tot")[0]);
    const sysNcTotal = firstMoney(sysNc.querySelector("td.tot"));
    const sysCombined = firstMoney(sysCr.querySelector("td.cf-combined"));
    check("system combined = statewide CR total + statewide NC total",
      isFinite(sysTotal) && isFinite(sysNcTotal) && sysNcTotal > 0 &&
      Math.abs(sysCombined - (sysTotal + sysNcTotal)) <= 1);
  }

  // The cell reads as the pair's figure: centered both ways (Sam's words),
  // via the scoped stylesheet the consumer injects.
  const css = doc.getElementById("cpl-funding-css");
  check("combined cell is centered both ways in the injected CSS",
    !!css && /td\.cf-combined\s*\{[^}]*vertical-align:\s*middle[^}]*text-align:\s*center/.test(css.textContent));

  // Sortable for real: activating the header sorts on a key every row carries.
  combinedTh.dispatchEvent(new window.Event("click", { bubbles: true }));
  const after = doc.querySelector('.cplfund-table thead th[data-sort="combined"]');
  check("clicking the Combined header engages the sort",
    !!after && after.getAttribute("aria-sort") !== "none");
}

// ── Window 2: hidden columns — the nth-child compensation ───────────────────
{
  const dom = freshDom();
  // Hide the one column right of Combined AND Combined itself, from stored
  // prefs — the state where the old one-rule-per-column generator would shear
  // the NC rows.
  dom.window.localStorage.setItem("cplfund_cols_v1",
    JSON.stringify({ college: { working_adults: true, combined: true } }));
  const doc = boot(dom.window);
  const table = doc.querySelector(".cplfund-table");
  const len = table.querySelectorAll("thead th").length;   // combined at len−1, working_adults at len

  const styles = Array.from(doc.querySelectorAll(".cplfund-tablewrap style, style"))
    .map((s) => s.textContent).join("\n");
  check("hiding a column right of Combined also targets the NC rows one index earlier",
    styles.indexOf("tr.cplfund-ncrow td:nth-child(" + (len - 1) + ")") >= 0 &&
    styles.indexOf("tr.cplfund-ncsysrow td:nth-child(" + (len - 1) + ")") >= 0 &&
    styles.indexOf(":not(.cplfund-ncrow):not(.cplfund-ncsysrow) td:nth-child(" + len + ")") >= 0);
  check("hiding Combined itself leaves the NC rows untouched",
    styles.indexOf(":not(.cplfund-ncrow):not(.cplfund-ncsysrow) td:nth-child(" + (len - 1) + ")") >= 0 &&
    styles.indexOf("tr.cplfund-ncrow td:nth-child(" + (len - 2) + ")") < 0);
  // The DOM keeps the cell even when CSS hides it — the nth-child arithmetic
  // for every later column depends on it existing.
  check("a hidden Combined column still emits its DOM cell",
    !!table.querySelector("tbody tr.cplfund-row td.cf-combined"));
}

finish();

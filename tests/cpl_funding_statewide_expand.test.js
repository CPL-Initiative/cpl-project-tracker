// CPL Implementation Funding — the SYSTEM (statewide) row's expand, and the
// one invariant a column shift breaks.
//
// TWO THINGS LAND HERE TOGETHER because they are the same lesson.
//
// 1. Sam, 2026-09-14: "Add the same college detail dropdown at the system
//    level." The statewide expand is the college expand with statewide
//    figures — so it is the SAME FUNCTION (prioSubRowsHtml), and §2 below
//    is what keeps it that way. A second copy is how this repo got a statewide
//    surface reading 193,700% of target while the per-college cells beside it
//    read correctly (see actualLineHtml's UNIT AGREEMENT note).
//
// 2. Sam reported the detail table's NC funding column showing FTES where it
//    should show funding. On this source it shows funding — but every value in
//    his screenshot matched the table SHIFTED ONE COLUMN LEFT, with the
//    noncredit cell absent and the last column empty. That shape is a row
//    emitting one fewer <td> than the header row emits <th>.
//
// ⚠️ MEASURED, not assumed: deleting that <td> and re-running DOES turn the
//    existing suites red — cpl_funding_detail_trim 16/21, cpl_funding_metric_pin
//    36/44. So this shift could not have shipped through CI, which is itself
//    evidence about where the reported rendering came from. What those suites
//    do NOT do is NAME it. They key cells by header, zipping headers to cells
//    positionally, so a row one cell short reads every value under the wrong
//    name and still parses: the failures surface as "To go says target met" and
//    "a cleared pin returns to the prose matcher" — eight assertions pointing at
//    To-go logic and metric pins, none at a missing cell. A maintainer chases
//    the wrong thing.
//
// So §3 earns its place by DIAGNOSIS, not by coverage: it counts cells instead
// of reading them, and fails in one line that says what is actually wrong.
//
// Since 2026-09-29 (Sam's round 8: "Line up and use the same column fields in
// drill down as the college row") the expand's priorities are ROWS OF THE
// INSTITUTION TABLE ITSELF, under a header band, one cell per column: Max CR
// Funds · Curr CR Funds · Max NC Funds · Curr NC Funds · Total Funds · Curr
// Total Funds, each figure with its FTES beneath it. The Difference column of
// the 2026-09-24 lane tables rides each Curr cell's hover. The invariants below
// are the same ones, read by column key (the harness's drillOf()).
const H = require("./lib/cpl_funding_harness.js");
const { freshDom, boot, click, check, finish, consumerSrc, colKeys, drillOf, openDrill, remainingOf } = H;

const FUND_KEYS = ["cr_award", "cr_current", "nc_award", "nc_current", "total", "current_total"];
function openCollege(window, doc, name) {
  const row = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
    .find((r) => r.querySelector(".cplfund-instname") &&
      r.querySelector(".cplfund-instname").textContent.indexOf(name) !== -1);
  return row ? openDrill(window, doc, row.getAttribute("data-id")) : drillOf(doc, null);
}
function openSystem(window, doc) { return openDrill(window, doc, "sys"); }
// A money figure: "$1,234", "$0", or the public floor "<$1,000". NEVER a bare
// number and never a unit figure ("8.0 FTES" / "156 stu") — which is exactly
// what lands under a header when a row is one cell short.
const MONEY = /^(\$[\d,]+|<\$[\d,]+|>\$[\d,]+)$/;
// An FTES line: a figure with its unit ("8.0 FTES", "156 stu") or the privacy
// mask ("<10 (privacy)").
const FIGURE = /^(<?[\d,]+(\.\d+)?( FTES| stu| \(privacy\)))$/;
// The undelivered and unknown-measure branches print a status, not a number:
// TBA since 2026-09-28 (Sam: "show TBA everywhere"), and the bad-source words.
const STATUS = /^(TBA|awaiting a known measure)$/;
const num = (v) => Number(String(v || "").replace(/[^\d.]/g, ""));
// A Curr hover names the Actual FTES share: "… · Actual FTES 112.5% of Max FTES".
const SHARE = /Actual FTES ([\d.]+)% of Max FTES/;
const pctOf = (tip) => { const m = SHARE.exec(tip || ""); return m ? Number(m[1]) : NaN; };
// A credit-only scope's noncredit pair reads a dash.
const moneyOrDash = (c, k) => MONEY.test(c[k].fig) || ((k === "nc_award" || k === "nc_current") && c[k].fig === "—");

// ─────────────────────────────────────────────────────────────────────────────
// §1 — the statewide row expands at all (Sam's ask)
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-09-14", suppress_below: 10,
    statewide: { pa_u: 300000 }, colleges: { "Laney": { pa_u: 9000 } }, unmatched: {} };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ yearPriorities: { "1": {
    "0": { metric: "Applied CPL Units as FTES", metric_src: "pa_u" },
    "1": { metric: "Applied CPL Units as FTES", metric_src: "pa_u" },
    "2": { metric: "Applied CPL Units as FTES", metric_src: "pa_u" } } } });
  T.render();

  const sysRow = doc.querySelector("#cplFundTable tbody tr.cplfund-systemrow");
  check("1a: the statewide row is expandable — it carries a data-id, which is what the toggle keys on",
    !!sysRow && sysRow.getAttribute("data-id") === "sys");
  // ⚠️ THE NEGATIVE IS THE POINT. Reaching the toggle by borrowing .cplfund-row
  // works and turns nine suites red: that class means "is an INSTITUTION row" to
  // eleven selectors and to the suites that count institutions and forbid a bold
  // cell. The statewide row is not an institution. Measured, not theorized —
  // "all 118 institutions render up front" counted 119.
  // See cpl_memory: a-styling-class-is-an-api.
  check("1a2: …and it does NOT borrow .cplfund-row, which means 'is an institution'",
    !!sysRow && !sysRow.classList.contains("cplfund-row"));
  check("1a3: institution rows are still exactly the institutions — the statewide row is not among them",
    Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
      .every((r) => r.getAttribute("data-id") !== "sys"));
  const btn = sysRow && sysRow.querySelector(".cplfund-caret");
  check("1b: its NAME is the toggle, as a button, with the collapsed state announced",
    !!btn && btn.textContent === "Statewide" && btn.getAttribute("aria-expanded") === "false");
  check("1c: it keeps .cplfund-systemrow, so the sticky pin and fill are untouched",
    !!sysRow && sysRow.classList.contains("cplfund-systemrow"));

  const sys = openSystem(window, doc);
  check("1d: expanding it renders the per-priority rows", sys.rows.length > 0 && !!sys.band);
  // The priority rows are rows OF the table, and none of them is an
  // institution or the pinned Statewide row.
  check("1e: and neither its detail row nor its priority rows are sticky or institution rows",
    !!sys.first && sys.all.every((tr) => !tr.classList.contains("cplfund-systemrow") &&
      !tr.classList.contains("cplfund-row") && !tr.hasAttribute("data-id")));
  check("1f: re-expanded state is announced",
    doc.querySelector("#cplFundTable tbody tr.cplfund-systemrow .cplfund-caret")
      .getAttribute("aria-expanded") === "true");

  // ───────────────────────────────────────────────────────────────────────────
  // §2 — ONE renderer, not two copies
  // ───────────────────────────────────────────────────────────────────────────
  const col = openCollege(window, doc, "Laney");
  check("2a: the college expand still renders its rows", col.rows.length > 0 && !!col.band);
  const keys = colKeys(doc);
  const bandLabels = (d) => FUND_KEYS.map((k) => d.bandCells[k].text);
  check("2b: statewide and college bands declare the SAME funding columns, in the same order",
    !!sys.band && !!col.band && bandLabels(sys).join("|") === bandLabels(col).join("|"));
  // The band repeats the table's own headers for the funding columns, so a
  // figure reads under the label it answers, and names the scope first.
  const headText = (k) => doc.querySelector('#cplFundTable thead th[data-sort="' + k + '"]').textContent.trim();
  check("2b2: …and they are the table's own headers, the first naming the scope",
    !!col.band && FUND_KEYS.every((k) => col.bandCells[k].text === headText(k)) &&
    col.bandCells.college.text === "Priority outcomes" && sys.bandCells.college.text === "Statewide priority outcomes");
  // One template, used for every scope: a second copy is how the statewide
  // surface once read 193,700% of target.
  check("2c: there is exactly ONE priority-row template in the source, and the lane tables are gone",
    (consumerSrc.match(/'<tr class="cplfund-subrow">'/g) || []).length === 1 && !/cplfund-dtl-table/.test(consumerSrc));
  check("2d: …and exactly one header band for it",
    (consumerSrc.match(/'<tr class="cplfund-subhead">'/g) || []).length === 1);

  // ───────────────────────────────────────────────────────────────────────────
  // §3 — THE PARITY GUARD (the reported defect)
  // ───────────────────────────────────────────────────────────────────────────
  [["statewide", sys], ["college", col]].forEach(([which, d]) => {
    check("3a/" + which + ": the band and every priority row emit exactly one cell per column, none spanning",
      d.rows.length > 0 && [d.band].concat(d.rows).every((tr) => tr.cells.length === keys.length &&
        Array.from(tr.cells).every((td) => !td.hasAttribute("colspan"))));
    check("3b/" + which + ": no funding cell is empty — an emptied last column is how a shift shows",
      d.cells.length > 0 && d.cells.every((c) => FUND_KEYS.every((k) => c[k].fig !== "")) &&
      d.cells.every((c) => c.college.text !== ""));
  });

  // ───────────────────────────────────────────────────────────────────────────
  // §4 — the funding columns carry FUNDING (Sam's report)
  // ───────────────────────────────────────────────────────────────────────────
  [["statewide", sys], ["college", col]].forEach(([which, d]) => {
    // The six funding cells are currency, the FTES rides the line beneath;
    // a unit figure in a funding cell is exactly what a row one cell short
    // produces, and it is what Sam's screenshot showed.
    check("4a/" + which + ": every funding cell's figure is currency on every row",
      d.cells.length > 0 && d.cells.every((c) => FUND_KEYS.every((k) => moneyOrDash(c, k))));
    check("4b/" + which + ": each Curr hover's remaining funding is its Max less its Curr",
      d.cells.length > 0 && d.cells.every((c) => ["cr", "nc"].every((l) => {
        const cur = c[l + "_current"], max = c[l + "_award"];
        if (cur.fig === "—") return true;
        return remainingOf(cur) !== null && Math.abs(num(max.fig) - num(cur.fig) - num(remainingOf(cur))) <= 2;
      })));
    // The FTES lines carry a FIGURE with its unit or a status word — an
    // undelivered measure reads TBA, never a number — and never currency.
    check("4c/" + which + ": every FTES line carries a figure or a status word, never currency",
      d.cells.length > 0 && d.cells.every((c) => ["cr_award", "nc_award", "total"].every((k) =>
        c[k].fig === "—" || FIGURE.test(c[k].line)) &&
        ["cr_current", "nc_current", "current_total"].every((k) =>
          c[k].fig === "—" || FIGURE.test(c[k].line) || STATUS.test(c[k].line))));
    check("4d/" + which + ": a measured row's Curr hover reads its Actual FTES share of Max FTES",
      d.cells.some((c) => FIGURE.test(c.cr_current.line)) &&
        d.cells.filter((c) => FIGURE.test(c.cr_current.line)).every((c) => SHARE.test(c.cr_current.tip)));
  });
  // The noncredit lane keeps columns of its own under the lighter band cells
  // (Sam: "I don't want the NCs to get lost in the shuffle"), or dashes where
  // the scope holds no noncredit funding — never a column of zeros — and the
  // closing line states the lane's rule, or says the scope is credit only.
  [["statewide", sys], ["college", col]].forEach(([which, d]) => {
    const foot = d.detail[d.detail.length - 1];
    const ncBand = !!d.band && d.bandCells.nc_award.td.classList.contains("cf-nchead") &&
      d.bandCells.nc_current.td.classList.contains("cf-nchead") && !d.bandCells.cr_award.td.classList.contains("cf-nchead");
    const ncOn = d.cells.length > 0 && d.cells.every((c) => MONEY.test(c.nc_award.fig));
    const ncOff = d.cells.length > 0 && d.cells.every((c) => c.nc_award.fig === "—" && c.nc_current.fig === "—");
    check("4e/" + which + ": the noncredit lane has its own lighter-banded columns, or dashes and a Credit only line",
      ncBand && !!foot && ((ncOn && /^Noncredit counts CPL for students who originate/.test(foot.textContent.trim())) ||
        (ncOff && /Credit only/.test(foot.textContent))));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// §5 — the Actual percent is the TRUE ratio, not the capped one
//
// Sam, 2026-09-14, on Alameda: "I doubt (though it's possible) that Alameda has
// achieved 17 FTES on P1." The measure was real; the CELL was not. It printed
// "17.6 FTES · 100%" against "Target 8.0 FTES" — two cells of one row
// contradicting each other, because the percent was Math.min(1, actual/target)
// while the figure beside it was raw. The cap belongs to the MONEY, and the
// money already shows it. The percent rides the Curr cell's hover.
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  // ONE college far past its target; everyone else at nothing. That split is
  // what §6 needs too — see there.
  window.CPL_FUNDING_PERF = { as_of: "2026-09-14", suppress_below: 10,
    statewide: { pa_u: 4000000 }, colleges: { "Laney": { pa_u: 400000 } }, unmatched: {} };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ yearPriorities: { "1": {
    "0": { metric: "Applied CPL Units as FTES", metric_src: "pa_u" },
    "1": { metric: "Applied CPL Units as FTES", metric_src: "pa_u" },
    "2": { metric: "Applied CPL Units as FTES", metric_src: "pa_u" } } } });
  T.render();
  const col = openCollege(window, doc, "Laney");
  const r0 = col.cells[0];
  check("5a: a college past its target reports a percent ABOVE 100, not a flat 100%",
    !!r0 && pctOf(r0.cr_current.tip) > 100);
  check("5b: its hover reads Max FTES met, and no funding remains (the distance, not the ratio, is what closes)",
    !!r0 && /Max FTES met/.test(r0.cr_current.tip) && remainingOf(r0.cr_current) === "$0");
  check("5c: and the MONEY is still capped — a Curr figure never exceeds its Max",
    col.cells.length > 0 && col.cells.every((c) => !(num(c.cr_current.fig) > num(c.cr_award.fig))));
  check("5d: the capped ratio is gone from the source — no Math.min(1, …) in the Actual FTES share",
    !/fmtPctTrim\(\s*Math\.min\(\s*1\s*,/.test(consumerSrc));

  // ───────────────────────────────────────────────────────────────────────────
  // §6 — statewide Curr is the SUM of institutions, never a ratio
  //
  // The fixture above is the discriminator: statewide pa_u is far past the
  // statewide target, so a statewide-cap × statewide-fraction reading would pay
  // the priority its FULL Max Funds — while the truth is that one college
  // qualified and the rest posted nothing. Same class as the figure that was
  // claimed under two goals at once (2026-09-14): every row correct alone, and
  // nothing ever added them up.
  // ───────────────────────────────────────────────────────────────────────────
  const sys = openSystem(window, doc);
  check("6a: the statewide expand renders", sys.rows.length === col.rows.length && sys.rows.length > 0);
  // The FUNDED rows: a priority at a 0% share (Priority 4 until Sam sets one,
  // 2026-09-22) has $0 of Max Funds and nothing for either claim to test.
  const fundedRows = (d) => d.cells.filter((c) => num(c.cr_award.fig) > 0);
  check("6b: statewide Actual FTES is past Max FTES, so a ratio reading would pay the full cap",
    fundedRows(sys).length >= 3 && fundedRows(sys).every((c) => pctOf(c.cr_current.tip) > 100));
  check("6c: …but Curr CR Funds is well under Max CR Funds, because it SUMS institutions",
    fundedRows(sys).length >= 3 && fundedRows(sys).every((c) =>
      num(c.cr_award.fig) > 0 && num(c.cr_current.fig) < num(c.cr_award.fig)));
  check("6d: the scope supplies the Curr figure rather than the renderer deriving it",
    /THE SCOPE SUPPLIES `actualFunds`; IT IS NEVER DERIVED HERE/.test(consumerSrc));
}

// ─────────────────────────────────────────────────────────────────────────────
// §7 — the printed table keeps its NAMES
//
// Found by this run's change rather than looked for: making the statewide label
// a toggle button turned scenarios' "the college table content survives" red,
// and the reason it had been green was that SYSTEM (statewide) was the ONE row
// label that was not already a button. Every institution name is the text of a
// .cplfund-caret button, and buildPrintHtml's sweep deleted `button` outright —
// so on main all 118 printed rows carried an EMPTY name cell. A funding table
// printed for a reader, with no institutions on it, passed CI for as long as
// the caret has been a button.
//
// The rule: a control's text can be CONTENT. Flatten before you sweep.
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const ph = T._printHtml();
  check("7a: the statewide row keeps its label in print (it is a toggle button now)",
    /<span>Statewide<\/span>/.test(ph));
  check("7b: …and so does every INSTITUTION name — the defect the statewide row was hiding",
    ph.indexOf("Alameda") !== -1 && ph.indexOf("American River") !== -1);
  check("7c: no printed institution row has an empty name cell",
    (function () {
      const rows = Array.from(doc.createElement("div"), () => 0) && null;
      const D2 = require("jsdom");
      const d2 = new D2.JSDOM(ph);
      const trs = Array.from(d2.window.document.querySelectorAll("table.cplfund-table tbody tr"))
        .filter((r) => r.querySelectorAll("td").length > 2);
      return trs.length > 100 && trs.every((r) => r.querySelectorAll("td")[1].textContent.trim() !== "");
    })());
  check("7d: the CONTROL is still gone — print carries no form chrome",
    ph.indexOf("<button") === -1 && ph.indexOf("<input") === -1 &&
    ph.indexOf("<select") === -1 && ph.indexOf("<textarea") === -1);
  check("7e: the caret is flattened BEFORE the button sweep, not removed with it",
    /cplfund-caret"\)\.forEach[\s\S]{0,260}replaceChild[\s\S]{0,400}querySelectorAll\("textarea, button/.test(consumerSrc));
  // An open drill-in prints too. The print window has its own stylesheet, so
  // a figure and the FTES line beneath it must stay two phrases in the markup
  // itself ("$1,234 5.0 FTES", never "$1,2345.0 FTES"), and the print CSS
  // stacks them.
  T._state.open = { "c:Laney": true };
  T.render();
  const JSDOM = require("jsdom").JSDOM;
  const pd = new JSDOM(T._printHtml()).window.document;
  const pRows = Array.from(pd.querySelectorAll("tr.cplfund-subrow"));
  check("7f: an open drill-in prints each figure and its FTES line as two phrases, stacked by the print CSS",
    pRows.length > 0 && pRows.every((tr) => !/\$[\d,]+\d\.\d FTES/.test(tr.textContent)) &&
    /\.cplfund-table td \.cf-ftes\{display:block;/.test(T._printHtml()));
}

finish();

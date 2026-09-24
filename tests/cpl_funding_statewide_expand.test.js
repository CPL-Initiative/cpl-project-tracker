// CPL Implementation Funding — the SYSTEM (statewide) row's expand, and the
// one invariant a column shift breaks.
//
// TWO THINGS LAND HERE TOGETHER because they are the same lesson.
//
// 1. Sam, 2026-09-14: "Add the same college detail dropdown at the system
//    level." The statewide expand is the college expand with statewide
//    figures — so it is the SAME FUNCTION (prioDetailTableHtml), and §2 below
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
// Since 2026-09-24 (Sam, review sheet item 7) the expand holds ONE TABLE PER
// LANE in his six columns — Outcomes · Max FTES · Max Funds · Actual FTES ·
// Actual Funds · Difference — credit first, then noncredit (or one line saying
// the scope is credit only). The percent that used to sit in the Actual cell
// rides the Actual FTES hover, and "To go" became the Difference column with
// the FTES gap in its hover. The invariants below are the same ones, read off
// the new columns.
const H = require("./lib/cpl_funding_harness.js");
const { freshDom, boot, click, check, finish, consumerSrc } = H;

// Read a detail table STRUCTURALLY — counts first, values second.
function readTable(tbl) {
  if (!tbl) return null;
  const trs = Array.from(tbl.querySelectorAll("tr"));
  const heads = Array.from(trs[0].querySelectorAll("th"))
    .map((th) => th.textContent.replace(/\s+/g, " ").trim());
  const rows = trs.slice(1).map((tr) =>
    Array.from(tr.querySelectorAll("td")).map((td) => td.textContent.replace(/\s+/g, " ").trim()));
  // Each cell's hover rides beside it as "<header> tip": the share of Max FTES
  // sits in the Actual FTES hover and the FTES gap in the Difference hover.
  const tips = trs.slice(1).map((tr) =>
    Array.from(tr.querySelectorAll("td")).map((td) => td.getAttribute("title") || ""));
  const keyed = rows.map((cells, j) => {
    const o = {};
    heads.forEach((h, i) => { o[h.toLowerCase()] = cells[i]; o[h.toLowerCase() + " tip"] = tips[j][i]; });
    return o;
  });
  return { heads, rows, keyed, caption: tbl.querySelector("caption").textContent.replace(/\s+/g, " ").trim() };
}
// The CREDIT table — the first lane table of an expand.
function tableOf(det) {
  return readTable(det && det.querySelector(".cplfund-dtl-table"));
}
function openCollege(window, doc, name) {
  const find = () => Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
    .find((r) => r.querySelector(".cplfund-instname") &&
      r.querySelector(".cplfund-instname").textContent.indexOf(name) !== -1);
  const row = find();
  if (!row) return null;
  click(window, row.querySelector(".cplfund-caret"));
  const det = find().nextElementSibling;
  return det && det.classList.contains("cplfund-detail") ? det : null;
}
function openSystem(window, doc) {
  const find = () => doc.querySelector("#cplFundTable tbody tr.cplfund-systemrow");
  const row = find();
  if (!row) return null;
  click(window, row.querySelector(".cplfund-caret"));
  const det = find().nextElementSibling;
  return det && det.classList.contains("cplfund-detail") ? det : null;
}
// A money cell: "$1,234", "$0", or the public floor "<$1,000". NEVER a bare
// number and never a unit figure ("8.0 FTES" / "156 stu") — which is exactly
// what lands here when a row is one cell short.
const MONEY = /^(\$[\d,]+|<\$[\d,]+|>\$[\d,]+)$/;
// An FTES-column figure: fmtNum1 on an FTES priority ("8.0", "1,234.5"), a
// headcount with its unit ("156 stu"), or the privacy mask ("<10 (privacy)").
const FIGURE = /^(<?[\d,]+(\.\d+)?( stu| \(privacy\))?)$/;
// The undelivered and unknown-measure branches print a status, not a number.
const STATUS = /^awaiting (measurement|a known measure)$/;
const num = (v) => Number(String(v || "").replace(/[^\d.]/g, ""));
// The Actual FTES hover: "112.5% of Max FTES".
const SHARE = /% of Max FTES$/;
const pctOf = (tip) => Number(String(tip || "").replace(SHARE, "").replace(/[^\d.]/g, ""));

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
    !!btn && /SYSTEM \(statewide\)/.test(btn.textContent) && btn.getAttribute("aria-expanded") === "false");
  check("1c: it keeps .cplfund-systemrow, so the sticky pin and fill are untouched",
    !!sysRow && sysRow.classList.contains("cplfund-systemrow"));

  const det = openSystem(window, doc);
  const sys = tableOf(det);
  check("1d: expanding it renders the per-priority detail table", !!sys && sys.rows.length > 0);
  check("1e: and the detail row is NOT itself sticky (a separate, plain detail row)",
    !!det && !det.classList.contains("cplfund-systemrow"));
  check("1f: re-expanded state is announced",
    doc.querySelector("#cplFundTable tbody tr.cplfund-systemrow .cplfund-caret")
      .getAttribute("aria-expanded") === "true");

  // ───────────────────────────────────────────────────────────────────────────
  // §2 — ONE renderer, not two copies
  // ───────────────────────────────────────────────────────────────────────────
  const colDet = openCollege(window, doc, "Laney");
  const col = tableOf(colDet);
  check("2a: the college expand still renders its table", !!col && col.rows.length > 0);
  check("2b: statewide and college declare the SAME columns, in the same order",
    !!sys && !!col && sys.heads.join("|") === col.heads.join("|"));
  check("2b2: …and they are Sam's six (2026-09-24)",
    !!sys && sys.heads.join("|") === "Outcomes|Max FTES|Max Funds|Actual FTES|Actual Funds|Difference");
  // One template, used once per lane: a second copy is how the statewide
  // surface once read 193,700% of target.
  check("2c: there is exactly ONE detail-table definition in the source",
    (consumerSrc.match(/<table class="cplfund-dtl-table/g) || []).length === 1);
  check("2d: …and exactly one header row for it",
    (consumerSrc.match(/>Difference<\/th>/g) || []).length === 1);

  // ───────────────────────────────────────────────────────────────────────────
  // §3 — THE PARITY GUARD (the reported defect)
  // ───────────────────────────────────────────────────────────────────────────
  [["statewide", sys], ["college", col]].forEach(([which, t]) => {
    check("3a/" + which + ": every priority row emits exactly as many cells as there are headers",
      !!t && t.rows.length > 0 && t.rows.every((cells) => cells.length === t.heads.length));
    check("3b/" + which + ": no cell is empty — an emptied last column is how a shift shows",
      !!t && t.rows.every((cells) => cells.every((v) => v !== "")));
  });

  // ───────────────────────────────────────────────────────────────────────────
  // §4 — the funding columns carry FUNDING (Sam's report)
  // ───────────────────────────────────────────────────────────────────────────
  [["statewide", sys], ["college", col]].forEach(([which, t]) => {
    // The three funding columns are currency and the two FTES columns carry
    // the unit; a unit figure in a funding column is exactly what a row one
    // cell short produces, and it is what Sam's screenshot showed.
    check("4a/" + which + ": Max Funds, Actual Funds and Difference are currency on every row",
      !!t && t.keyed.length > 0 && t.keyed.every((r) =>
        MONEY.test(r["max funds"]) && MONEY.test(r["actual funds"]) && MONEY.test(r.difference)));
    check("4b/" + which + ": Difference is Max Funds less Actual Funds",
      !!t && t.keyed.every((r) =>
        Math.abs(num(r["max funds"]) - num(r["actual funds"]) - num(r.difference)) <= 2));
    // The two FTES columns carry a FIGURE ("8.0", "1,234.5", "156 stu" on a
    // headcount priority) or a status word — an undelivered measure reads
    // "awaiting measurement", never a number — and never currency.
    check("4c/" + which + ": Max FTES and Actual FTES carry a figure or a status word, never currency",
      !!t && t.keyed.every((r) => FIGURE.test(r["max ftes"]) &&
        (FIGURE.test(r["actual ftes"]) || STATUS.test(r["actual ftes"]))));
    check("4d/" + which + ": a measured row's Actual FTES hover reads its share of Max FTES",
      !!t && t.keyed.some((r) => FIGURE.test(r["actual ftes"])) &&
        t.keyed.filter((r) => FIGURE.test(r["actual ftes"])).every((r) => SHARE.test(r["actual ftes tip"])));
  });
  // The noncredit lane is a table of its own in the same six columns (Sam:
  // "I don't want the NCs to get lost in the shuffle"), or one plain line
  // where the scope holds no noncredit funding — never a table of zeros.
  [["statewide", det, sys], ["college", colDet, col]].forEach(([which, d, t]) => {
    const nc = d && d.querySelector(".cplfund-dtl-table.cplfund-dtl-nc");
    const none = d && d.querySelector(".cplfund-dtl-ncnone");
    check("4e/" + which + ": the noncredit lane has its own six-column table, or one line saying the scope is credit only",
      !!d && !!t && ((!!nc && readTable(nc).heads.join("|") === t.heads.join("|") &&
        d.querySelector(".cplfund-dtl-table").classList.contains("cplfund-dtl-cr")) ||
        (!nc && !!none && /Credit only/.test(none.textContent))));
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
// money already shows it. The percent now rides the Actual FTES hover.
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
  const col = tableOf(openCollege(window, doc, "Laney"));
  const r0 = col && col.keyed[0];
  check("5a: a college past its target reports a percent ABOVE 100, not a flat 100%",
    !!r0 && SHARE.test(r0["actual ftes tip"]) && pctOf(r0["actual ftes tip"]) > 100);
  check("5b: its Difference reads Max FTES met (the distance, not the ratio, is what closes)",
    !!r0 && /Max FTES met/.test(r0["difference tip"]) && r0.difference === "$0");
  check("5c: and the MONEY is still capped — Actual Funds never exceeds Max Funds",
    !!col && col.keyed.every((r) => !(num(r["actual funds"]) > num(r["max funds"]))));
  check("5d: the capped ratio is gone from the source — no Math.min(1, …) in the Actual cell",
    !/fmtPctTrim\(\s*Math\.min\(\s*1\s*,/.test(consumerSrc));

  // ───────────────────────────────────────────────────────────────────────────
  // §6 — statewide Actual Funds is the SUM of institutions, never a ratio
  //
  // The fixture above is the discriminator: statewide pa_u is far past the
  // statewide target, so a statewide-cap × statewide-fraction reading would pay
  // the priority its FULL Max Funds — while the truth is that one college
  // qualified and the rest posted nothing. Same class as the figure that was
  // claimed under two goals at once (2026-09-14): every row correct alone, and
  // nothing ever added them up.
  // ───────────────────────────────────────────────────────────────────────────
  const sys = tableOf(openSystem(window, doc));
  check("6a: the statewide expand renders", !!sys && sys.rows.length === col.rows.length);
  // The FUNDED rows: a priority at a 0% share (Priority 4 until Sam sets one,
  // 2026-09-22) has $0 of Max Funds and nothing for either claim to test.
  const fundedRows = (t) => t.keyed.filter((r) => num(r["max funds"]) > 0);
  check("6b: statewide Actual FTES is past Max FTES, so a ratio reading would pay the full cap",
    !!sys && fundedRows(sys).length >= 3 &&
    fundedRows(sys).every((r) => pctOf(r["actual ftes tip"]) > 100));
  check("6c: …but Actual Funds is well under Max Funds, because it SUMS institutions",
    !!sys && fundedRows(sys).length >= 3 && fundedRows(sys).every((r) =>
      num(r["max funds"]) > 0 && num(r["actual funds"]) < num(r["max funds"])));
  check("6d: the scope supplies `earned` rather than the renderer deriving it",
    /THE SCOPE SUPPLIES `earned`; IT IS NEVER DERIVED HERE/.test(consumerSrc));
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
    ph.indexOf("SYSTEM (statewide)") !== -1);
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
}

finish();

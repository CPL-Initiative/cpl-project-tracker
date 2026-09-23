// CPL Implementation Funding — the Columns menu must not reach into the drill-in.
//
// THE DEFECT, reported by Sam 2026-09-14 as "the NC Funding column shows FTEs
// and should show $", and diagnosed only when he showed a second screenshot with
// the District column switched back ON and the money correctly in place.
//
// colHideStyleHtml() emitted, for a hidden main-table column at position p:
//
//   .cplfund-table tbody tr:not(.cplfund-detail) td:nth-child(p) { display:none }
//
// DESCENDANT combinators. The per-priority detail table is nested inside the
// detail row's own <td>, so its rows are descendants of `.cplfund-table tbody`
// and are not themselves `.cplfund-detail` — the rule matched THEIR p-th cell
// too. Hiding District (main column 3) therefore hid NC funding (detail column
// 3); every later cell slid one column left under the wrong header and Total
// Possible rendered empty. What appeared under "NC FUNDING" was the Target cell,
// which is why the report was "it shows FTES".
//
// ⚠️ THE `:not(.cplfund-detail)` LOOKS LIKE IT COVERS THIS AND CANNOT. It
// excludes the detail ROW; the damage is to rows INSIDE that row. A guard placed
// on the wrong generation of descendant is not a guard — it is the appearance of
// one, which is worse, because it stops anyone looking.
//
// ⚠️ AND NO DOM-READING TEST CAN SEE IT. The markup is correct: every row emits
// all 8 cells, and cpl_funding_statewide_expand's parity guard passes on this
// exact defect because it counts <td> elements. The corruption happens at PAINT,
// from CSS, and jsdom does no layout. The one question jsdom CAN answer is
// "does this selector match this element" — so that is what this file asks.
const H = require("./lib/cpl_funding_harness.js");
const { freshDom, boot, click, check, finish, consumerSrc } = H;

// Every selector the hide <style> declares, one per rule. Splitting matters:
// joining the rules into one string concatenates `td:nth-child(3)` with the next
// rule's leading `.cplfund-table` into a compound selector that matches nothing,
// which reads as "the bug is fixed". (Cost the first run of this diagnosis.)
function hideSelectors(doc) {
  const style = doc.querySelector("#cplFundTable style");
  if (!style) return [];
  return style.textContent.split("}").filter(Boolean)
    .map((r) => r.split("{")[0].trim()).filter(Boolean);
}
function matchCount(els, selectors) {
  return els.filter((el) => selectors.some((s) => { try { return el.matches(s); } catch (e) { return false; } })).length;
}

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

  // ⚠️ NOBODY HAS TO TOUCH THE COLUMNS MENU FOR THIS TO BITE. COL_PREFS ships
  // `{ district: true, working_adults: true }` as its DEFAULT, so a fresh
  // browser hides main column 3 before anyone clicks anything — which is why
  // this was never "a setting Sam chose" but the state every reader gets, on
  // the COBI tab and on the public explainer that embeds the same table. The
  // fixture therefore asserts the DEFAULT rather than arranging one.
  const bootSels = hideSelectors(doc);
  check("0a: the shipped default already hides two columns, with no user action",
    bootSels.length === 2);
  check("0b: and District is one of them — main column 3, the position that collides",
    bootSels.join(",").indexOf("nth-child(3)") !== -1);
  check("0c: the Columns menu shows both as unchecked, so the default is visible to a curator",
    Array.from(doc.querySelectorAll(".cplfund-colmenu input[data-colkey]"))
      .filter((c) => !c.checked).map((c) => c.getAttribute("data-colkey")).sort().join(",")
      === "district,working_adults");

  const sels = bootSels;
  check("1a: hiding a column emits a hide rule", sels.length >= 1);
  check("1b: District is main-table column 3, so the rule targets :nth-child(3)",
    sels.join(",").indexOf("nth-child(3)") !== -1);

  const openRow = () => {
    const find = () => Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
      .find((r) => r.querySelector(".cplfund-instname") &&
        r.querySelector(".cplfund-instname").textContent.indexOf("Laney") !== -1);
    click(window, find().querySelector(".cplfund-caret"));
    return find();
  };
  const row = openRow();
  const det = row.nextElementSibling;

  // The hide must KEEP WORKING on the table it is for — a fix that scopes the
  // selector into uselessness would pass §3 and break the feature.
  const mainCells = Array.from(row.querySelectorAll(":scope > td"));
  check("2a: the rules still hide exactly TWO cells on the institution row",
    matchCount(mainCells, sels) === 2);
  // The positions come from the header, not from a typed number: the Max award
  // column (2026-09-23) moved the county context one place right, and a typed
  // "2,8" would have failed for a reason unrelated to the scope it guards.
  const headKeys = Array.from(doc.querySelectorAll("#cplFundTable thead th"))
    .map((th) => th.getAttribute("data-sort") || "");
  const want = [headKeys.indexOf("district"), headKeys.indexOf("working_adults")].join(",");
  check("2b: and they are the District and county-context columns (" + want + ")",
    headKeys.indexOf("district") === 2 && headKeys.indexOf("working_adults") > 2 &&
    mainCells.filter((td) => sels.some((sl) => td.matches(sl)))
      .map((td) => td.cellIndex).sort(function (a, b) { return a - b; }).join(",") === want);

  // ── THE REGRESSION ────────────────────────────────────────────────────────
  const dtlCells = Array.from(det.querySelectorAll(".cplfund-dtl-table td"));
  check("3a: the detail table renders cells to test", dtlCells.length >= 8);
  check("3b: ⭐ NO cell of the nested detail table is matched by the hide rule",
    matchCount(dtlCells, sels) === 0);
  check("3c: specifically, the NC funding cell survives — it is detail column 3",
    Array.from(det.querySelectorAll(".cplfund-dtl-table tr")).slice(1).every((tr) => {
      const td = tr.querySelectorAll("td")[2];
      return td && !sels.some((s) => { try { return td.matches(s); } catch (e) { return false; } });
    }));

  // The statewide expand added 2026-09-14 renders the SAME table, so it inherits
  // the same exposure and needs the same guarantee.
  const sysRow = doc.querySelector("#cplFundTable tbody tr.cplfund-systemrow");
  click(window, sysRow.querySelector(".cplfund-caret"));
  const sysDet = doc.querySelector("#cplFundTable tbody tr.cplfund-systemrow").nextElementSibling;
  const sysCells = Array.from(sysDet.querySelectorAll(".cplfund-dtl-table td"));
  check("4a: the statewide expand renders its own detail cells", sysCells.length >= 8);
  check("4b: and none of them is matched either",
    matchCount(sysCells, sels) === 0);

  // ── SOURCE GUARD ──────────────────────────────────────────────────────────
  // The DOM checks above pass the moment the selector is scoped ANY way that
  // works today. This one states the rule that has to hold for selectors nobody
  // has written yet: the walk from .cplfund-table to the cell is child-only, so
  // nothing nested can ever be reached, whatever gets nested there later.
  const fn = consumerSrc.slice(consumerSrc.indexOf("function colHideStyleHtml"),
    consumerSrc.indexOf("function colMenuHtml"));
  const emitted = (fn.match(/"\.cplfund-table[^"]*"/g) || []).join(" ");
  check("5a: the emitted selector uses child combinators from .cplfund-table onward",
    /\.cplfund-table > thead > tr > th/.test(emitted) &&
    /\.cplfund-table > tbody > tr:not\(\.cplfund-detail\) > td/.test(emitted));
  check("5b: and declares no descendant hop that could re-enter a nested table",
    !/\.cplfund-table (thead|tbody)/.test(emitted));
}

finish();

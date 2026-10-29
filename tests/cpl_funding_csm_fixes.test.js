// The CSM team's funding test fixes before the Summit (Sam, 2026-10-29, relaying
// their testing; S519). The header rename and the sums that add the rows are
// guarded in cpl_funding_college_dashboard; this file guards the rest:
//   · "When search used for college, no way to clear it": a Clear word beside
//     the search box, shown only while it holds a search, that brings every row
//     back and returns focus to the box.
//   · "Link led to error": the Sources line's FTES citation at DataMart's current
//     address (/Students/FTES_Summary.aspx; /Outcomes/ answers 404).
//   · "public college totals are wrong for curr": the public page rounds what
//     qualifies to the nearest $1,000 (the 2026-09-03 ADR), and its Sources line
//     now says so; the curator view, which shows exact dollars, does not.
//   · The table's short names: Cañada with its tilde, Mt. San Antonio with its
//     period, and College off Coalinga, Norco, Imperial Valley and Reedley.
const H = require("./lib/cpl_funding_harness.js");
const { check, freshDom, boot, click, footText, finish } = H;

const rowsText = (doc) => Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row")).map((r) => r.textContent);

{
  const { window } = freshDom();
  const doc = boot(window);
  const input = doc.getElementById("cplFundSearch");
  const clear = doc.getElementById("cplFundSearchClear");
  const all = rowsText(doc).length;
  check("1a: a Clear word sits beside the search box, hidden while the box is empty",
    !!input && !!clear && clear.tagName === "BUTTON" && clear.textContent === "Clear" && clear.hidden);
  input.value = "Norco";
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  const shown = doc.getElementById("cplFundSearchClear");
  check("1b: a search narrows the rows and shows Clear", rowsText(doc).length < all && !shown.hidden);
  click(window, shown);
  check("1c: Clear empties the box, brings every row back, hides itself and returns focus to the box",
    input.value === "" && rowsText(doc).length === all && shown.hidden && doc.activeElement === input);

  const links = Array.from(doc.querySelectorAll(".cplfund-foot a")).map((a) => a.getAttribute("href"));
  check("2: the Sources line links DataMart's FTES Summary at its current address",
    links.some((h) => h === "https://datamart.cccco.edu/Students/FTES_Summary.aspx") &&
    !links.some((h) => /\/Outcomes\/FTES_Summary/.test(h)));
  check("3a: the curator view names no rounding (its dollars are exact)", !/rounds to the nearest/.test(footText(doc)));

  const names = rowsText(doc).join(" | ");
  check("4: the short names read Cañada, Mt. San Antonio, Coalinga, Imperial Valley, Norco and Reedley",
    /Cañada/.test(names) && /Mt\. San Antonio/.test(names) && /Coalinga/.test(names) &&
    /Imperial Valley/.test(names) && /Norco/.test(names) && /Reedley/.test(names) &&
    !/Norco College|Reedley College|Coalinga College|Imperial Valley College|Mt San Antonio/.test(names));
}

{
  const { window } = freshDom();
  window.CPL_FUNDING_PUBLIC = true;
  const doc = boot(window);
  check("3b: the public page's Sources line says Funds Qualified So Far rounds to the nearest $1,000",
    /Funds Qualified So Far rounds to the nearest \$1,000/.test(footText(doc)) && /Max awards are exact/.test(footText(doc)));
}

finish();

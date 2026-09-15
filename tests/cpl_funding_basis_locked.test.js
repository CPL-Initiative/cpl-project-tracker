// tests/cpl_funding_basis_locked.test.js
//
// CREDIT FTES IS THE ONLY ALLOCATION BASIS (Sam, 2026-09-15, decision sheet
// item 4 — "yes").
//
// He ruled headcount dead for this tab on 2026-09-15: "we do not use student
// headcount for any metrics in this tab." The control that switched the whole
// model onto it survived that ruling by two sessions, sitting one click from
// Credit FTES in the curator chrome.
//
// ⚠️ WHY THIS NEEDED A GUARD AND NOT JUST A DELETION. Measured on the live
// config the day it was removed: flipping the basis to headcount moved 69 of
// 118 awards, the largest single change $110,391 (Saddleback $224,394 ->
// $334,785). That is most of the allocation, from one segmented control, with
// no confirmation step. A ruling the code does not enforce is one misclick from
// being undone — and the misclick would look like a working feature.
//
// THE STORED VALUE IS THE REAL RISK, which is why section 3 exists.
// allocationBasis() used to read SCENARIO.allocationBasis, then
// SHARED.allocationBasis, then the bake. Deleting only the CONTROL would leave
// every one of those layers live: a config carrying allocationBasis:"headcount"
// — saved before the removal, or written by another session — would keep
// re-sizing the allocation with nothing on screen offering the choice. So
// allocationBasis() is a constant now, and a stored value is inert.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_basis_locked.test.js`).
const fs = require("fs");
const { check, freshDom, boot, consumerSrc, finish } = require("./lib/cpl_funding_harness.js");

// ── 1. the control is gone, and so is its writer ─────────────────────────────
check("1a: the Allocation basis segmented control is no longer rendered",
  !/segHtml\("cplFundAllocBasis"/.test(consumerSrc));
check("1b: its change handler is gone too — a live writer is how a retired dial returns",
  !/wireSeg\("cplFundAllocBasis"/.test(consumerSrc));
check("1c: setAllocationBasis() is removed — a writer with no reader stores and is ignored",
  !/function setAllocationBasis/.test(consumerSrc));
check("1d: and the control's label is out of the seg-label map",
  !/cplFundAllocBasis:/.test(consumerSrc));

// ── 2. allocationBasis() is a constant ───────────────────────────────────────
check("2a: allocationBasis() no longer reads any stored layer",
  /function allocationBasis\(\) \{ return "ftes"; \}/.test(consumerSrc));
check("2b: the ruling is named at the seam, so the next reader knows why",
  /CREDIT FTES IS THE ONLY BASIS/.test(consumerSrc));

// ── 3. ⚠️ a STORED headcount value is inert ──────────────────────────────────
// The assertion that matters: same config, same awards, with and without a
// stored basis. Before the lock these two runs differed on 69 of 118 rows.
function awardsWith(basis) {
  const { window } = freshDom();
  new Function("window", fs.readFileSync("cpl_funding_performance.js", "utf8")).call(window, window);
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const shared = { mirrorYears: true, disbursement: "frontload" };
  if (basis) shared.allocationBasis = basis;
  T._setShared(shared);
  T.render();
  const rows = String(T._csv()).split("\n");
  const head = rows[1].split(",");
  const iN = head.indexOf("Institution");
  const iA = head.indexOf("Max award 2026–2028");
  const out = {};
  rows.slice(2).forEach((l) => {
    if (!l) return;
    const c = l.split(",");
    const n = c[iN];
    if (!n || /SYSTEM/i.test(n)) return;
    out[n] = c[iA];
  });
  return out;
}
{
  const plain = awardsWith(null);
  const stored = awardsWith("headcount");
  const names = Object.keys(plain);
  check("3a: the fixture produced a real roster to compare", names.length > 100);
  const differing = names.filter((n) => plain[n] !== stored[n]);
  check("3b: a stored allocationBasis:\"headcount\" changes NO award — it is inert",
    differing.length === 0);
  check("3c: and the awards are still real figures, not an empty comparison",
    names.some((n) => /\d/.test(String(plain[n] || ""))));
}

// ── 4. headcount survives as CONTEXT, which it always was ────────────────────
{
  const { window } = freshDom();
  new Function("window", fs.readFileSync("cpl_funding_performance.js", "utf8")).call(window, window);
  const doc = boot(window);
  window.CPL_FUNDING_TAB.render();
  const txt = doc.getElementById("cplFundingMount").textContent.replace(/\s+/g, " ");
  check("4a: headcount still appears somewhere as context",
    /[Hh]eadcount/.test(txt));
  // ⚠️ The claim that had to go: the metrics are NOT headcount-denominated, and
  // a sentence saying so outlived the ruling that made it false.
  check("4b: nothing claims the metrics are headcount-denominated",
    !/headcount-denominated/.test(txt) && !/headcount-denominated/.test(consumerSrc));
  check("4c: the basis the page names is the FTES one",
    !/allocation basis is headcount/i.test(txt));
}

finish();

// tests/cpl_funding_reorder.test.js
//
// Priority REORDER + Year-2 MIRRORING on the Implementation Funding tab
// (Sam, 2026-08-20: "moving Priority 3 to the Priority 1 position … rather than
// copying and pasting everything for both years … drag and drop them into
// position", plus "auto copy the details for each priority from Year 1 to
// Year 2").
//
// What these guard, in order of how badly they would fail:
//
//  1. AN EDIT LANDING ON THE WRONG PRIORITY. The reorder is a permutation
//     stored beside the config, so every read and write has to translate the
//     DISPLAY index the card carries into the SOURCE index the config is keyed
//     on. The translation lives in one seam (prioField / prioMetricSource /
//     prioUnit / setPrio, plus priorities()); a call site that skipped it would
//     silently retype another priority's metric or move its money.
//  2. THE MONEY MOVING. Reordering is presentation. Every allocation, cap and
//     target must come back byte-identical.
//  3. MY COLLEGE PAIRING THE WRONG ADVICE WITH THE MONEY. That tab nests each
//     priority's strategies inside its cap, and both lists hold three entries —
//     so a count gate cannot see a reorder. The join is by identity now.
//
// Lives in its own file: each test file gets a fresh process, and ending the
// process is the ONLY thing that reclaims a booted jsdom window — which is why
// the 2,955-line cpl_funding.test.js was itself split into nine suites on
// 2026-08-20. Budget + measurements: tests/lib/cpl_funding_harness.js.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_reorder.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const dataSrc = fs.readFileSync("cpl_funding_data.js", "utf8");
const consumerSrc = fs.readFileSync("cpl_funding.js", "utf8");
const briefSrc = fs.readFileSync("college_briefing.js", "utf8");
const D = (function () {
  const sb = { window: {} };
  new Function("window", dataSrc)(sb.window);
  return sb.window.CPL_FUNDING;
})();

function freshDom() {
  const dom = new JSDOM(
    "<!doctype html><html><body><div id='tab-implementation-funding'>" +
    "<div id='cplFundingMount'></div></div></body></html>",
    { runScripts: "outside-only", url: "https://example.org/" });
  dom.window.scrollTo = function () {};
  dom.window.CPL_FUNDING_NO_REMOTE = true;
  return dom;
}
function boot(window) {
  window.eval(dataSrc);
  window.eval(consumerSrc);
  window.CPL_FUNDING_TAB.boot();
  return window.document;
}
function cardText(doc, i) {
  const cards = doc.querySelectorAll("#cplFundingMount .cplfund-prio .p");
  return cards[i] ? cards[i].textContent.replace(/\s+/g, " ") : "";
}
function cardValue(doc, i, edit) {
  const cards = doc.querySelectorAll("#cplFundingMount .cplfund-prio .p");
  const el = cards[i] && cards[i].querySelector('[data-edit="' + edit + '"]');
  return el ? el.value : null;
}
function totalOf(T) {
  return D.colleges.reduce(function (s, c) {
    const a = T._alloc(c.college);
    return s + (a ? a.total : 0);
  }, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part A — the seam is a SEAM (every indexing site translates, exactly once)
// ─────────────────────────────────────────────────────────────────────────────
check("A: priorityOrder resolves through the config layers with an identity fallback",
  /function priorityOrder\(slot\)/.test(consumerSrc) &&
  /isPermutation\(v, n\) \? v\.map\(Number\) : identityOrder\(n\)/.test(consumerSrc));
["prioField", "prioMetricSource", "prioUnit", "setPrio"].forEach(function (fn) {
  const body = (consumerSrc.match(new RegExp("function " + fn + "\\([^)]*\\) \\{[\\s\\S]*?\\n  \\}")) || [""])[0];
  check("A: " + fn + " translates display → source before touching yearPriorities",
    /srcIdx\(slot, (idx|i)\)/.test(body));
});
check("A: priorities() walks the ORDER, not the raw config array",
  /return priorityOrder\(slot\)\.map\(function \(sIdx, i\)/.test(consumerSrc));
check("A: the ordinal label is positional and the key stays the identity",
  /label: "Priority " \+ \(i \+ 1\)/.test(consumerSrc));
check("A: nothing else indexes the raw priority list any more",
  (consumerSrc.match(/base\(\)\.year_priorities\[slot\]/g) || []).length <= 1);
check("A: reorderList is pure, so the DOM handlers are a thin shell over it",
  /function reorderList\(order, from, to\)/.test(consumerSrc) &&
  !/document|querySelector/.test((consumerSrc.match(/function reorderList[\s\S]*?\n  \}/) || [""])[0]));

// ─────────────────────────────────────────────────────────────────────────────
// Part B — content travels with the card; money does not move
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;

  const natural = T._prios(D.colleges[0].college, "1");
  const naturalTotal = totalOf(T);
  const naturalCaps = natural.map(function (p) { return Math.round(p.cap); });
  const naturalCard0 = cardText(doc, 0);

  check("B: natural order labels the priorities 1..3 in config order",
    natural.map(function (p) { return p.label; }).join("|") === "Priority 1|Priority 2|Priority 3" &&
    natural.map(function (p) { return p.src; }).join("") === "012");

  // Sam's actual ask: Priority 3 into the Priority 1 position.
  T._setScenario({ priorityOrder: [2, 0, 1] });
  T.render();
  const moved = T._prios(D.colleges[0].college, "1");

  check("B: the third priority now sits first, carrying its own identity",
    moved[0].src === 2 && moved[0].key === natural[2].key &&
    moved[0].label === "Priority 1");
  check("B: title, description and metric travel with the card",
    moved[0].title === natural[2].title &&
    moved[0].description === natural[2].description &&
    moved[0].metric === natural[2].metric);
  check("B: share and unit travel with the card",
    moved[0].share === natural[2].share && moved[0].unit === natural[2].unit);
  check("B: the cap and the target travel with it too — a reorder is not a re-price",
    Math.round(moved[0].cap) === naturalCaps[2] &&
    Math.round(moved[0].target * 100) === Math.round(natural[2].target * 100));
  check("B: the other two keep their own money, one position later",
    Math.round(moved[1].cap) === naturalCaps[0] && Math.round(moved[2].cap) === naturalCaps[1]);
  check("B: the statewide total is untouched by the reorder",
    Math.abs(totalOf(T) - naturalTotal) < 0.5);
  check("B: the rendered first card is the old third card",
    cardText(doc, 0).indexOf(String(natural[2].metric).slice(0, 30)) !== -1 &&
    cardText(doc, 0) !== naturalCard0);
  check("B: the card still reads 'Priority 1:' in its heading",
    /Priority 1:/.test(cardText(doc, 0)));

  // The failure this whole design exists to prevent.
  const share0 = cardValue(doc, 0, "share");
  check("B: the first card's editable share is the MOVED priority's share",
    share0 != null && Math.abs(Number(share0) / 100 - natural[2].share) < 1e-9);

  const el = doc.querySelectorAll("#cplFundingMount .cplfund-prio .p")[0]
    .querySelector('[data-edit="metric"]');
  el.value = "Units of transcribed CPL — retyped in position 1";
  el.dispatchEvent(new window.Event("change", { bubbles: true }));
  const after = T._prios(D.colleges[0].college, "1");
  check("B: an edit made in position 1 lands on the priority SHOWN there, not on source 0",
    /retyped in position 1/.test(String(after[0].metric)) &&
    after[1].metric === natural[0].metric && after[2].metric === natural[1].metric);
  check("B: that edit did not disturb the other priorities' money",
    Math.round(after[1].cap) === naturalCaps[0] && Math.round(after[2].cap) === naturalCaps[1]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part C — a malformed order is a fallback, never a dropped priority
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const n = T._prios(D.colleges[0].college, "1").length;
  [[0, 1, 5], [0, 1], [1, 1, 2], "nonsense", null, [0, 1, 2]].forEach(function (bad) {
    T._setScenario({ priorityOrder: bad });
    T.render();
    const got = T._prios(D.colleges[0].college, "1");
    const label = JSON.stringify(bad);
    check("C: order " + label + " still renders all " + n + " priorities exactly once",
      got.length === n &&
      got.map(function (p) { return p.src; }).sort().join("") === "012");
  });
  T._setScenario({ priorityOrder: [0, 1, 5] });
  T.render();
  check("C: an out-of-range order falls back to the natural order (not a partial one)",
    T._prios(D.colleges[0].college, "1").map(function (p) { return p.src; }).join("") === "012");
}

// ─────────────────────────────────────────────────────────────────────────────
// Part D — the affordances: mouse, keyboard, and not for colleges
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const cards = doc.querySelectorAll("#cplFundingMount .cplfund-prio .p");
  check("D: every priority card is a drop target", cards.length === 3 &&
    Array.prototype.every.call(cards, function (c) { return c.hasAttribute("data-priocard"); }));
  check("D: each card carries a drag handle", doc.querySelectorAll('[data-priodrag][draggable="true"]').length === 3);
  const sels = doc.querySelectorAll("[data-priopos]");
  check("D: each card carries a keyboard-reachable position picker with every position",
    sels.length === 3 && sels[0].querySelectorAll("option").length === 3);
  check("D: the position picker is labelled for a screen reader",
    Array.prototype.every.call(sels, function (s) { return (s.getAttribute("aria-label") || "").indexOf("Position of") === 0; }));
  check("D: the drag handle is a WORD, not a bare glyph (Admin-tab ruling)",
    /Drag<\/span>/.test(doc.querySelector("#cplFundingMount .cplfund-prio").innerHTML));
  check("D: the toolbar says the order applies to every year",
    /order applies to every year/.test(doc.getElementById("cplFundingMount").textContent));

  // Changing the picker reorders — the same path a drop takes.
  const before = window.CPL_FUNDING_TAB._prios(D.colleges[0].college, "1").map(function (p) { return p.src; }).join("");
  const sel = doc.querySelectorAll("[data-priopos]")[2];
  sel.value = "0";
  sel.dispatchEvent(new window.Event("change", { bubbles: true }));
  check("D: choosing position 1 for the third card moves it there",
    before === "012" &&
    window.CPL_FUNDING_TAB._prios(D.colleges[0].college, "1").map(function (p) { return p.src; }).join("") === "201");
  const doc2 = window.document;
  check("D: a Reset order button appears once the order is custom",
    !!doc2.getElementById("cplFundOrderReset"));
  doc2.getElementById("cplFundOrderReset").dispatchEvent(new window.Event("click", { bubbles: true }));
  check("D: Reset order restores the config's own order",
    window.CPL_FUNDING_TAB._prios(D.colleges[0].college, "1").map(function (p) { return p.src; }).join("") === "012" &&
    !window.document.getElementById("cplFundOrderReset"));
}
{
  const { window } = freshDom();
  window.CPL_FUNDING_PUBLIC = true;
  const doc = boot(window);
  check("D: a college-facing page gets no reorder affordance at all",
    doc.querySelectorAll("[data-priodrag], [data-priopos], #cplFundOrderReset, #cplFundMirror").length === 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part E — "Funding factor" (Sam, 2026-08-20). The LABEL moves; the dial does not.
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  // The factor is the dial for a CPL-FTES priority, which is what all three of
  // the LIVE ones are (shares .5/.3/.2, factors .5/1/2) — the baked defaults in
  // the repo are still the older headcount set, so put one on FTES first.
  T._setScenario({ yearPriorities: { "1": { "0": { unit: "ftes" } } } });
  T.render();
  const txt = doc.getElementById("cplFundingMount").textContent;
  check("E: the priority cards say Funding factor", /Funding factor/.test(txt));
  check("E: nothing on the page still says Price factor", !/Price factor/i.test(txt));
  check("E: the stored field and the edit key are unchanged — only the label moved",
    doc.querySelectorAll('[data-edit="priofactor"]').length === 1 &&
    D.year_priorities["1"].every(function (p) { return p.factor != null; }));
  // The recalculation Sam asked about: change the factor, the target follows.
  const before = T._prios(D.colleges[0].college, "1");
  const beforeTotal = totalOf(T);
  const el = doc.querySelectorAll("#cplFundingMount .cplfund-prio .p")[0]
    .querySelector('[data-edit="priofactor"]');
  const was = before[0].target;
  el.value = String(Number(el.value) * 2);
  el.dispatchEvent(new window.Event("change", { bubbles: true }));
  const now = T._prios(D.colleges[0].college, "1")[0];
  check("E: doubling the funding factor halves the target, live, with no reload",
    was > 0 && Math.abs(now.target - was / 2) < 0.01 &&
    Math.abs(now.cap - before[0].cap) < 0.5);
  check("E: and it moves the TARGET, never the money — the share sets the dollars",
    Math.abs(totalOf(T) - beforeTotal) < 0.5 && Math.abs(now.cap - before[0].cap) < 0.5);
}

// ─────────────────────────────────────────────────────────────────────────────
// Part F — Year-2 mirroring: the NON-destructive answer to "auto copy"
// ─────────────────────────────────────────────────────────────────────────────
check("F: front-load does not trigger a copy — the mirror is its own switch",
  !/setDisbursement[\s\S]{0,300}(copyYear1|mirrorYears)/.test(consumerSrc));
check("F: mirroring is a RESOLUTION seam, so nothing is written over",
  /function prioSlot\(slot\) \{ return mirrorYears\(\) \? "1" : String\(slot\); \}/.test(consumerSrc));
check("F: the flatten is explicit, and it asks first",
  /function copyYear1ToLaterYears\(\)/.test(consumerSrc) &&
  /cplFundCopyYear1[\s\S]{0,400}confirm\(/.test(consumerSrc));
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;

  check("F: mirroring is OFF by default — shipping it changes nothing",
    !doc.getElementById("cplFundMirror").checked);
  const y1 = T._prios(D.colleges[0].college, "1").map(function (p) { return p.metric; }).join("|");
  const y2 = T._prios(D.colleges[0].college, "2").map(function (p) { return p.metric; }).join("|");
  check("F: the baked years genuinely differ, so this is not a vacuous test", y1 !== y2);

  const box = doc.getElementById("cplFundMirror");
  box.checked = true;
  box.dispatchEvent(new window.Event("change", { bubbles: true }));
  const T2 = window.CPL_FUNDING_TAB;
  check("F: with the mirror on, Year 2 resolves to the Year-1 set",
    T2._prios(D.colleges[0].college, "2").map(function (p) { return p.metric; }).join("|") === y1);
  check("F: Year 1 itself is unchanged",
    T2._prios(D.colleges[0].college, "1").map(function (p) { return p.metric; }).join("|") === y1);

  // The reversal is the whole argument for a mirror over a copy.
  const box2 = window.document.getElementById("cplFundMirror");
  box2.checked = false;
  box2.dispatchEvent(new window.Event("change", { bubbles: true }));
  check("F: clearing the mirror restores Year 2's OWN values — nothing was overwritten",
    window.CPL_FUNDING_TAB._prios(D.colleges[0].college, "2")
      .map(function (p) { return p.metric; }).join("|") === y2);

  check("F: while the years differ, the tab offers the one-time copy",
    !!window.document.getElementById("cplFundCopyYear1"));
}
{
  // The mirrored year has to SAY it is mirrored, or a Year-2 edit silently
  // lands on both years with nothing on screen admitting it.
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setScenario({ mirrorYears: true });
  T._state.viewSlot = "2";
  T.render();
  const txt = doc.getElementById("cplFundingMount").textContent;
  check("F: the Year-2 view discloses that it is mirrored from Year 1",
    /mirrored from Year 1/.test(txt));
  check("F: with the mirror on, the copy button is not offered as well",
    !doc.getElementById("cplFundCopyYear1"));
}

// ─────────────────────────────────────────────────────────────────────────────
// Part G — My College joins the money to the right advice
// ─────────────────────────────────────────────────────────────────────────────
check("G: _prios publishes the source index consumers join on",
  /key: p\.key, src: p\.src, label: p\.label/.test(consumerSrc));
{
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { runScripts: "outside-only" });
  dom.window.eval(briefSrc);
  const B = dom.window.CPL_COLLEGE_BRIEFING;
  const prog = {
    priorities: [
      { index: 0, key: "0", share: 0.5, title: "Access", strategies: ["a"], items: ["a"] },
      { index: 1, key: "1", share: 0.3, title: "Success", strategies: ["b"], items: ["b"] },
      { index: 2, key: "2", share: 0.2, title: "Capacity", strategies: ["c"], items: ["c"] }
    ]
  };
  const reordered = B._applyPriorityOrder(prog.priorities, [2, 0, 1]);
  check("G: applyPriorityOrder puts the config's priorities into the display order",
    reordered.map(function (p) { return p.key; }).join("") === "201");
  check("G: it renumbers `index` to the position the curator sees, keeping `key` as the identity",
    reordered.map(function (p) { return p.index; }).join("") === "012" &&
    reordered[0].key === "2");
  check("G: it does not mutate the list it was given",
    prog.priorities.map(function (p) { return p.key; }).join("") === "012" &&
    prog.priorities[0].index === 0);
  [[0, 1, 5], [0, 1], [1, 1, 2], null, "x"].forEach(function (bad) {
    check("G: a malformed order " + JSON.stringify(bad) + " falls back to the natural order",
      B._applyPriorityOrder(prog.priorities, bad).map(function (p) { return p.key; }).join("") === "012");
  });

  // THE failure: money from one priority, advice from another.
  const prios = [{ src: 2, cap: 100 }, { src: 0, cap: 300 }, { src: 1, cap: 200 }];
  check("G: a funding priority joins its strategies by identity, not by position",
    B._programPriorityFor(prog, prios[0], 0).key === "2" &&
    B._programPriorityFor(prog, prios[1], 1).key === "0");
  check("G: the alignment gate accepts a reordered pair",
    B._prioritiesAlign(prios, prog) === true);
  check("G: the gate REJECTS a source index that resolves to nothing",
    B._prioritiesAlign([{ src: 7 }, { src: 0 }, { src: 1 }], prog) === false);
  check("G: a funding module with no src still joins by position (backwards compatible)",
    B._programPriorityFor(prog, { cap: 1 }, 1).key === "1" &&
    B._prioritiesAlign([{}, {}, {}], prog) === true);
  check("G: a count mismatch is still refused",
    B._prioritiesAlign([{ src: 0 }, { src: 1 }], prog) === false);

  // The identity has to SURVIVE buildBriefing's remap. It did not — `key` was
  // dropped there, so the join resolved to nothing and the strategies silently
  // left the funding box (caught by college_briefing.test.js Part P, 2026-08-20).
  const CFG = { projects: { "cpl-implementation": {
    label: "CPL Implementation Funding",
    scenarios: { "Scenario 1": { yearPriorities: { "1": {
      "0": { share: 0.5, description: "Access.", metric: "Applied CPL Units measured in FTES",
             strategies: ["Act on all JST credit recommendations in MAP"] },
      "1": { share: 0.3, description: "Success.", metric: "Transcribed CPL Units measured in FTES",
             strategies: ["Complete Transcribe step in MAP for each student record with CPL"] },
      "2": { share: 0.2, title: "Capacity", metric: "Transcribed Units measured in FTES",
             strategies: ["Document Student CPL Stories in MAP"] }
    } } } } } } };
  const built = B._buildBriefing({ config: CFG, college: null }, { scenario: "Scenario 1", year: "1" });
  const builtPrios = (built.programs[0] || {}).priorities || [];
  check("G: buildBriefing carries the identity through its remap",
    builtPrios.length === 3 && builtPrios.map(function (p) { return p.key; }).join("") === "012");
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);

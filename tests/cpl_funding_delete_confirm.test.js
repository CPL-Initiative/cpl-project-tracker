// tests/cpl_funding_delete_confirm.test.js
//
// WHILE A DELETE IS CONFIRMED, THE CARD IS THE QUESTION — Sam, 2026-09-23:
// "Clicked delete and it deleted the header (I think) but not the whole card."
//
// Nothing had been deleted. The confirmation opened inside the full card, under
// the Delete button that opened it, with the share, metric and measure editors
// still below it, so the card read as one that had half gone. His screenshot
// also said "from Scenario 1" while Scenario 3 was the published one: the strip
// at the top of the tab named it, and nothing near the card did.
//
// So while the question is open the card shows only the question and its
// choices; the question names the published scenario when the curator is in
// another; focus moves into it (the Delete that opened it is gone) and returns
// to that Delete on Keep it.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_delete_confirm.test.js`).
const { check, finish, freshDom, boot } = require("./lib/cpl_funding_harness.js");

function reviewerSession() {
  return {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; }
  };
}
function scenario() {
  return {
    mirrorYears: true, disbursement: "frontload", priorityOrder: [0, 2, 1],
    yearPriorities: { "1": {
      "0": { goals: ["A"], share: 0.33, title: "Access", factor: 0.5, metric_src: "ppa_u",
             metric: "Applied CPL Units (FTES) originating from either CPL Portal, College CPL Landing Page, or batch upload" },
      "1": { share: 0.33, title: "Completion with Transcription", factor: 0.5, metric_src: "p3_u",
             metric: "Transcribed CPL Units measured in FTES" },
      "2": { goals: ["B"], share: 0.34, title: "Completion", factor: 0.5, metric_src: "ptc_u",
             metric: "Transcribed CPL units (FTES) for students  with Counselor step checked" },
      "3": { goals: ["C"] }
    } }
  };
}
const { window } = freshDom();
const doc = boot(window);
window.CPL_SESSION = reviewerSession();
const T = window.CPL_FUNDING_TAB;
T._setConfig({ projects: { "cpl-implementation": {
  area: "cpl", label: "CPL Implementation and Project Funding", published: "Scenario 3",
  scenarios: { "Scenario 1": scenario(), "Scenario 3": scenario() } } } });
T.render();

const q = (sel) => doc.querySelector("#cplFundingMount " + sel);
const card = (id) => q('[data-cardid="' + id + '"]');
const click = (el) => el && el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, button: 0 }));

// ── 1. in the published scenario ──────────────────────────────────────────
check("1a: the tab opens on the published scenario", T._scenario().name === "Scenario 3");
click(card("m1") && card("m1").querySelector("[data-priodel]"));
const c1 = card("m1");
check("1b: Delete turns its card into the question",
  !!c1 && c1.classList.contains("cplfund-card-confirm") && !!c1.querySelector(".cplfund-delpanel"));
check("1c: the question card carries no editor, measure or tool from the card it replaces",
  !!c1 && !c1.querySelector('input[data-edit="share"], [data-priosrc], [data-priodel], .cplfund-grip, [data-priorows]'));
check("1d: the other cards keep their editors and their Delete",
  !!card("m0") && !!card("m0").querySelector('input[data-edit="share"]') && !!card("m0").querySelector("[data-priodel]"));
check("1e: in the published scenario the question names no other scenario",
  !!c1 && !c1.querySelector("[data-delscen]"));
check("1f: focus moves to the question's first choice, where the share goes",
  doc.activeElement && doc.activeElement.matches("[data-priodelinto]") && c1.contains(doc.activeElement));
click(q("[data-priodelcancel]"));
const back = card("m1");
check("1g: Keep it brings the whole card back",
  !!back && !back.classList.contains("cplfund-card-confirm") && !!back.querySelector('input[data-edit="share"]') &&
    !q(".cplfund-delpanel"));
check("1h: and focus returns to that card's Delete",
  doc.activeElement && doc.activeElement.matches("[data-priodel]") && back.contains(doc.activeElement));

// ── 2. in a scenario colleges do not see ──────────────────────────────────
const sel = q("#cplFundScenSel");
if (sel) { sel.value = "Scenario 1"; sel.dispatchEvent(new window.Event("change", { bubbles: true })); }
check("2a: the curator switches to Scenario 1", T._scenario().name === "Scenario 1");
click(card("m1") && card("m1").querySelector("[data-priodel]"));
const note = q('[data-cardid="m1"] [data-delscen]');
check("2b: the question says the delete stays in Scenario 1 and names the scenario colleges see",
  !!note && /This deletes it from Scenario 1 only\. Colleges see Scenario 3, the published scenario\./.test(note.textContent),
  note && note.textContent);
check("2c: the question still asks about Scenario 1",
  /from Scenario 1\?/.test((q('[data-cardid="m1"] .cplfund-delpanel-q') || {}).textContent || ""));

finish();

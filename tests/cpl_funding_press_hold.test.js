// tests/cpl_funding_press_hold.test.js
//
// A REDRAW WAITS FOR THE PRESS IN PROGRESS — Sam, 2026-09-23: "I tried to
// delete the P3 to assign P3 to Career Attainment but the Delete button doesn't
// fire."
//
// WHAT HAPPENED. He had just typed Career attainment's share. Pressing Delete
// moved focus off that field, the field committed on the way out (its `change`
// fired, and the tab saved), and the commit redrew the tab while the mouse
// button was still down. The release landed on a NEW Delete button. A browser
// sends `click` only to the element the press began on, so the handler never
// ran: the share saved and the Delete did nothing. Reproduced in Chromium
// against the live Scenario 3 configuration; a second press worked, which is
// why it read as a dead button rather than a lost edit.
//
// jsdom has no press-and-release targeting, so this suite asks the question the
// browser asks: is the element the press began on still the element in the
// document when the release comes? A redraw during the press makes the answer
// no, and that is the failure, whatever a click dispatched afterward does.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_press_hold.test.js`).
const { check, finish, freshDom, boot } = require("./lib/cpl_funding_harness.js");

function reviewerSession() {
  return {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; }
  };
}
// Scenario 3 as it stood when Sam pressed Delete: Career attainment at 0% and
// Completion with Transcription holding the 33% he meant to move.
function scenario3() {
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
function mount() {
  const { window } = freshDom();
  const doc = boot(window);
  window.CPL_SESSION = reviewerSession();
  const T = window.CPL_FUNDING_TAB;
  T._setShared(scenario3());
  T.render();
  return { window, doc, T };
}
const q = (doc, sel) => doc.querySelector("#cplFundingMount " + sel);
// Null-safe on purpose: a regression must print its FAIL lines, not stop the
// file on a TypeError before the count.
const pointer = (window, el, type) => el && el.dispatchEvent(new window.PointerEvent(type,
  { bubbles: true, cancelable: true, button: 0, pointerId: 1, isPrimary: true, pointerType: "mouse" }));
// The blur commit: what the browser fires on the field as the press takes focus.
const commit = (window, el, v) => { if (!el) return; el.value = v; el.dispatchEvent(new window.Event("change", { bubbles: true })); };
const tick = (ms) => new Promise((r) => setTimeout(r, ms || 0));
const careerShare = (doc) => q(doc, '[data-cardid="m3"] input[data-edit="share"]');
const delBtn = (doc) => q(doc, '[data-cardid="m1"] [data-priodel]');

(async function () {
  // ── 1. Sam's sequence: a typed share, then a press on Delete ─────────────
  {
    const { window, doc, T } = mount();
    const share = careerShare(doc), del = delBtn(doc);
    check("1a: the fixture renders Career attainment's share field and the Delete on Completion with Transcription",
      !!share && !!del);
    pointer(window, del, "pointerdown");
    commit(window, share, "33");
    check("1b: the field's commit during the press leaves the pressed Delete button in the document",
      !!del && doc.contains(del) && delBtn(doc) === del);
    pointer(window, del, "pointerup");
    if (del && doc.contains(del)) del.dispatchEvent(new window.MouseEvent("click", { bubbles: true, button: 0 }));
    check("1c: the release's click reaches Delete and opens its confirmation",
      T._state.prioDeleting === "m1" && !!q(doc, '[data-cardid="m1"] .cplfund-delpanel'));
    check("1d: the share committed on the way out is kept and painted",
      careerShare(doc) && careerShare(doc).value === "33");
    await tick(5);
    check("1e: the held redraw that follows the click leaves the confirmation open",
      !!q(doc, '[data-cardid="m1"] .cplfund-delpanel'));
    // The confirmation's own button, pressed straight after choosing where the
    // share goes: the same trap one level down, so the same path through it.
    const into = q(doc, "[data-priodelinto]");
    const career = into && Array.from(into.options).find((o) => /Career attainment/.test(o.textContent));
    if (career) { into.value = career.value; }
    const ok = q(doc, "[data-priodelok]");
    pointer(window, ok, "pointerdown");
    pointer(window, ok, "pointerup");
    if (ok && doc.contains(ok)) ok.dispatchEvent(new window.MouseEvent("click", { bubbles: true, button: 0 }));
    const cards = Array.from(doc.querySelectorAll("#cplFundingMount [data-priocard]")).map((c) => c.getAttribute("data-cardid"));
    const sh = T._getShared();
    check("1f: Delete priority removes Completion with Transcription and moves its 33% to Career attainment (0.33 + 0.33)",
      cards.indexOf("m1") < 0 && JSON.stringify(sh.prioRemoved) === "[1]" &&
        Math.abs(Number(sh.yearPriorities["1"]["3"].share) - 0.66) < 1e-9,
      JSON.stringify({ cards, removed: sh.prioRemoved, career: sh.yearPriorities["1"]["3"] }));
  }

  // ── 2. a release with no click still draws what the press held ───────────
  {
    const { window, doc } = mount();
    const share = careerShare(doc), del = delBtn(doc);
    pointer(window, del, "pointerdown");
    commit(window, share, "12");
    check("2a: held during the press", !!del && doc.contains(del));
    pointer(window, doc.body, "pointerup");            // released off the button: no click
    await tick(5);
    check("2b: after the release the held redraw runs (the tab is rebuilt with the committed share)",
      !doc.contains(del) && careerShare(doc) && careerShare(doc).value === "12");
  }

  // ── 3. a select is left out, and a lost release does not freeze the tab ──
  {
    const { window, doc } = mount();
    const share = careerShare(doc);
    const pos = q(doc, '[data-cardid="m3"] select[data-priopos]');
    const before = delBtn(doc);
    pointer(window, pos, "pointerdown");
    commit(window, share, "20");
    check("3a: a press on a select holds nothing (its native list takes the release)",
      !!pos && !doc.contains(before) && careerShare(doc).value === "20");
    pointer(window, doc.body, "pointerup");
    const del = delBtn(doc);
    pointer(window, del, "pointerdown");                // and never released
    commit(window, careerShare(doc), "21");
    check("3b: a press whose release never arrives holds the redraw at first", !!del && doc.contains(del));
    await tick(1700);
    check("3c: the fallback releases it, and the tab draws the committed share",
      !doc.contains(del) && careerShare(doc) && careerShare(doc).value === "21");
  }

  finish();
})().catch(function (e) {
  check("the suite ran to the end without throwing (" + (e && e.message) + ")", false);
  finish();
});

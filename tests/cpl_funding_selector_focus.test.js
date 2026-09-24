// CPL Implementation Funding — focus survives the redraw a control asks for,
// and Sam's house titles and timeline labels (2026-09-24).
//
// Sam, 2026-09-24: "The scenario selector freezes after first use." Measured
// in Chromium on the live config: the first ArrowDown on the selector changed
// the scenario, then focus read BODY, and the second keystroke went to the
// page. render() rebuilds the mount's HTML, so the control that asked for the
// redraw is gone by the time it finishes; a mouse click re-focuses the new
// element, which is why it read as intermittent. The fix: render() notes the
// focused control's id and wire() puts focus back on its rebuilt namesake.
//
// Guarded from both sides — the focus that must come back, and the focus
// that must NOT be taken (a field outside the mount, or nothing at all).
const H = require("./lib/cpl_funding_harness.js");
const { freshDom, boot, check, finish, consumerSrc } = H;

function reviewer(window) {
  window.CPL_SESSION = {
    get: () => ({ access_token: "x", email: "reviewer@example.org", expires_at: Math.floor(Date.now() / 1000) + 3600 }),
    isFresh: () => true,
  };
}
function withSecondScenario(T) {
  const cfg = JSON.parse(JSON.stringify(T._config()));
  const proj = cfg.projects["cpl-implementation"];
  if (!proj.scenarios["Scenario 3"]) proj.scenarios["Scenario 3"] = JSON.parse(JSON.stringify(proj.scenarios["Scenario 1"] || {}));
  T._setConfig(cfg); T.boot(); T.render();
}
function change(window, sel, value) {
  sel.value = value;
  sel.dispatchEvent(new window.Event("change", { bubbles: true }));
}

// ── 1. the selector keeps focus across the redraw its own change triggers ──
{
  const { window } = freshDom();
  reviewer(window);
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  withSecondScenario(T);
  const before = doc.getElementById("cplFundScenSel");
  check("1a: the scenario selector renders for a curator", !!before);
  before.focus();
  check("1b: it can take focus", doc.activeElement === before);
  change(window, before, "Scenario 3");
  const after = doc.getElementById("cplFundScenSel");
  check("1c: the change redrew the tab (the selector is a new element)", !!after && after !== before);
  check("1d: and the scenario switched", !!after && after.value === "Scenario 3");
  check("1e: FOCUS CAME BACK to the rebuilt selector — the second keystroke has somewhere to go",
    doc.activeElement === after);
  // The second change: the failure Sam saw was this one going nowhere.
  change(window, after, "Scenario 1");
  const third = doc.getElementById("cplFundScenSel");
  check("1f: a second change lands too, and focus follows again",
    !!third && third.value === "Scenario 1" && doc.activeElement === third);
}

// ── 2. focus is restored, never taken ────────────────────────────────────
{
  const { window } = freshDom();
  reviewer(window);
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T.render();
  const outside = doc.createElement("input");
  outside.id = "outsideTheMount";
  doc.body.appendChild(outside);
  outside.focus();
  T.render();
  check("2a: a field outside the mount keeps focus through a redraw", doc.activeElement === outside);
  outside.blur();
  check("2b: (control) nothing is focused now", doc.activeElement === doc.body);
  T.render();
  check("2c: a redraw with nothing focused focuses nothing", doc.activeElement === doc.body);
  // A control without an id cannot be found again; the redraw must not throw.
  const btn = doc.querySelector("#cplFundingMount button:not([id])");
  let threw = false;
  if (btn) { btn.focus(); try { T.render(); } catch (e) { threw = true; } }
  check("2d: a focused control with no id is simply let go (no throw)", !!btn && !threw);
}

// ── 3. Sam's titles and timeline labels are the house defaults ───────────
// (Review sheet 2026-09-24, items 2 and 3, and the five in-place edits.) A
// stored rename still wins; these are what a fresh scenario shows.
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const cfg = JSON.parse(JSON.stringify(T._config()));
  Object.values(cfg.projects["cpl-implementation"].scenarios).forEach((s) => { delete s.titles; delete s.timing; });
  T._setConfig(cfg); T.boot(); T.render();
  const titles = Array.from(doc.querySelectorAll("#cplFundingMount details[data-sec] > summary, #cplFundingMount [data-sec] h3"))
    .map((el) => el.textContent.replace(/\s+/g, " ").trim());
  check("3a: the first section is titled Introduction", titles.some((t) => /^Introduction\b/.test(t)));
  check("3b: the baseline section is titled Minimum Conditions", titles.some((t) => /^Minimum Conditions\b/.test(t)));
  check("3c: the retired house titles are gone", !titles.some((t) => /About this funding model|Eligibility Requirements/.test(t)));
  // The internal view renders each label as an editable field, so read its
  // value; the public view renders the text.
  const rows = Array.from(doc.querySelectorAll(".cplfund-timing-label"))
    .map((el) => String(el.tagName === "INPUT" || el.tagName === "TEXTAREA" ? el.value : el.textContent).trim());
  check("3d: the timeline names the Confirmation Deadline", rows.some((r) => /^Confirmation Deadline/.test(r)));
  check("3e: no timeline line says 'in MAP' any more", rows.length > 0 && !rows.some((r) => /\bin MAP\b/.test(r)));
  const block = (consumerSrc.split("var DEFAULT_TIMING = [")[1] || "").split("];")[0];
  check("3f: (source) DEFAULT_TIMING names the Confirmation Deadline and carries no 'in MAP' label",
    /Confirmation Deadline/.test(block) && !/in MAP/.test(block));
}

finish();

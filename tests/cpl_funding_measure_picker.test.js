// tests/cpl_funding_measure_picker.test.js
//
// THE MEASURE PICKER — the last funding dial that had no control.
//
// Share, factor, title, metric text, goals, pool figures, strategies and card
// positions are all curator edits on the tab. `metric_src` alone was not: it
// could only be changed by a session writing to the shared Supabase row, which
// is exactly what Sam's 2026-09-01 ruling was against ("I don't want you to fix
// it; I want the tab to save it"). Worse, the lane file and two handoffs called
// it "one dial in the tab", so a session reading them would believe the control
// existed. One did, and told Sam so twice before checking the screen.
//
// WHAT THIS GUARDS, in the order the failures would actually happen:
//
//   1. THE LIST IS DERIVED, NOT TYPED. A hand-maintained option list is how a
//      measure added to METRIC_SOURCES goes unofferable and a measure removed
//      lingers as a dead option that pays $0. Section 2 asserts the offer set
//      equals the registry's own filter, so adding a measure needs no edit here.
//   2. HEADCOUNT AND NONCREDIT STAY OUT. Sam ruled headcount dead for this tab
//      (2026-09-15, "we do not use student headcount for any metrics in this
//      tab"); offering one would re-open a policy he closed. The NC measures
//      belong to the NC cards, which have their own write path.
//   3. WORDS, NOT FEED KEYS. His 2026-08-28 reaction to the key on the card
//      face — "what does this mean? Metric - pinned to ppa_u" — is why the key
//      lives in the tooltip. A picker listing `pac_u` would undo that.
//   4. ⚠️ UN-PINNING STORES "", IT DOES NOT DELETE. firstDefined() skips null
//      and undefined, so a deleted key lets a LOWER override layer's pin
//      resurface — the curator would appear to un-pin and silently inherit
//      someone else's measure. Section 5 proves the lower layer stays buried.
//   5. NO CONTROL REACHES A PUBLIC READER. Same rule as every other dial.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_measure_picker.test.js`).
const fs = require("fs");
const { check, freshDom, boot, consumerSrc, finish } = require("./lib/cpl_funding_harness.js");

const LIVE_P2 = "Applied CPL units (FTES) for students  with Counselor checked and " +
  "originating from either CPL Portal, College CPL Landing Page, or batch upload";

// The registry, rebuilt out of the consumer so the expected offer set is the
// model's own rather than a copy that can drift from it.
const METRIC_SOURCES = (function () {
  const start = consumerSrc.indexOf("var METRIC_SOURCES = {");
  const end = consumerSrc.indexOf("\n  };", start) + 4;
  return eval("(" + consumerSrc.slice(start + "var METRIC_SOURCES = ".length, end) + ")");
})();
const EXPECTED = Object.keys(METRIC_SOURCES).filter(function (k) {
  const r = METRIC_SOURCES[k];
  return r && r.unit === "units" && r.lane !== "nc";
});

function mount(opts) {
  opts = opts || {};
  const { window } = freshDom();
  new Function("window", fs.readFileSync("cpl_funding_performance.js", "utf8")).call(window, window);
  if (opts.public) window.CPL_FUNDING_PUBLIC = true;
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const P = {
    "0": { metric: "Applied CPL Units (FTES) included", share: 0.33, factor: 0.5, title: "Outreach" },
    "1": { metric: "Transcribed CPL Units measured in FTES", share: 0.33, factor: 0.5, title: "Completion" },
    "2": { metric: LIVE_P2, share: 0.34, factor: 0.5, title: "Awards", metric_src: opts.pin || "ppa_u" }
  };
  // The pin goes in SHARED so section 5 can prove an un-pin does not let it
  // resurface from underneath the scenario layer.
  T._setShared({ yearPriorities: { "1": P, "2": P }, mirrorYears: true, disbursement: "frontload" });
  T.render();
  return { T, window, doc };
}
const sels = (doc) => Array.from(doc.querySelectorAll("[data-priosrc]"));
// ⚠️ LOCATE THE PINNED CARD BY ITS CONTENT, NOT BY DOM ORDINAL. priorityOrder
// is a permutation — [0,1,2] in the bake, [0,2,1] live — so the Nth select in
// the document is not stored priority N, and an ordinal-indexed assertion tests
// the wrong card while looking correct. This suite read DOM#1 for a pin stored
// at index 2 and produced six confident failures against working code.
// The same lesson cpl_funding_metric_pin.test.js carries at the top.
function pickerForCounselor(doc) {
  return sels(doc).find((s) => /Counselor checked/.test(s.closest(".metric").textContent));
}
function cardForCounselor(doc) {
  const s = pickerForCounselor(doc);
  return s ? s.closest(".p") : null;
}
function fire(window, sel, v) {
  sel.value = v;
  sel.dispatchEvent(new window.Event("change", { bubbles: true }));
}

// ── 1. it exists, one per credit priority ────────────────────────────────────
{
  const { doc } = mount();
  check("1a: a measure picker renders on every credit priority card", sels(doc).length === 3);
  check("1b: each is a <select>", sels(doc).every((s) => s.tagName === "SELECT"));
  check("1c: it sits inside the METRIC block, with the metric text it resolves",
    sels(doc).every((s) => !!s.closest(".metric")));
  check("1d: each carries an aria-label naming its priority",
    sels(doc).every((s) => /Measure for Priority \d/.test(s.getAttribute("aria-label") || "")));
}

// ── 2. the offer set IS the registry's own filter ────────────────────────────
{
  const { doc } = mount();
  const vals = Array.from(sels(doc)[0].options).map((o) => o.value).filter(Boolean);
  check("2a: every offered measure is a real METRIC_SOURCES key",
    vals.every((v) => !!METRIC_SOURCES[v]));
  check("2b: the offer set equals the registry filter — a new measure needs no edit here",
    vals.slice().sort().join("|") === EXPECTED.slice().sort().join("|") && vals.length >= 5);
  check("2c: the un-pin option is offered first and carries the empty-string sentinel",
    sels(doc)[0].options[0].value === "");
  // 2d/2e are the two rulings the filter enforces.
  check("2d: NO headcount measure is offered (Sam: headcount is not a metric in this tab)",
    vals.every((v) => METRIC_SOURCES[v].unit === "units"));
  check("2e: NO noncredit measure is offered (the NC cards have their own write path)",
    vals.every((v) => METRIC_SOURCES[v].lane !== "nc") && !vals.some((v) => /^nc_/.test(v)));
  check("2f: the counselor measure IS offered — the one this control was built for",
    vals.indexOf("pac_u") >= 0);
}

// ── 3. words, not feed keys ──────────────────────────────────────────────────
{
  const { doc } = mount();
  const opts = Array.from(sels(doc)[0].options);
  check("3a: no option TEXT exposes a raw feed key",
    opts.every((o) => !/\b(p[ae]c?_u|pp[ae]?_u|p3_u|nc_\w+)\b/.test(o.text)));
  check("3b: every option reads as words a curator can choose between",
    opts.every((o) => /[a-z]{3}\s+[a-z]{2}/i.test(o.text)));
  // ⚠️ THE LABELS NAME THE ROUTE, NOT THE COHORT (2026-09-15, Sam: "add the
  // elements of the P1 metric to the drop down list so I can set it from
  // there"). They used to read "portal-origin students", which is how the CODE
  // thinks about the Potential Student split — a curator matching an option
  // against the sentence they typed had nothing to match on. The picker exists
  // to be recognised from the metric text, so the text's own words win.
  check("3e: the origin options name the ROUTES, not the internal cohort",
    opts.some((o) => /CPL Portal/.test(o.text) && /Landing Page/.test(o.text)) &&
    !opts.some((o) => /portal-origin/i.test(o.text)));
  // ⚠️ BATCH UPLOAD IS NAMED ON PURPOSE though the measure cannot see it yet
  // (Sam, 2026-09-15: "Include batch in P1. It will have an indicator in the
  // origination dataset later."). Pinned so a later reader does not "correct"
  // the label back to what Potential Student currently counts — the label is
  // written for what the measure becomes, as his P1 pin is.
  check("3g: the origin options name batch upload, the third route",
    opts.filter((o) => /batch upload/.test(o.text)).length === 3);
  check("3f: the counselor option echoes the wording Sam writes on the card",
    opts.some((o) => /Counselor step checked/.test(o.text)));
  check("3c: the feed key still rides the metric block's tooltip, where Sam put it",
    /Measured from the MAP feed key ppa_u/.test(
      pickerForCounselor(doc).closest(".metric").getAttribute("title") || ""));
  check("3d: the current pin is the selected option",
    pickerForCounselor(doc).value === "ppa_u");
}

// ── 4. choosing a measure moves the card ─────────────────────────────────────
{
  const { T, window, doc } = mount();
  const before = cardForCounselor(doc).textContent.replace(/\s+/g, " ");
  const targetOf = (t) => (t.match(/Target [\d,]+\.\d CPL FTES/) || [""])[0];
  const targetBefore = targetOf(before);
  check("4a: before — P2 reads the portal measure and serves (A) Access",
    /\(A\)/.test(before) && /portal-origin/.test(before));
  fire(window, pickerForCounselor(doc), "pac_u");
  const after = cardForCounselor(doc).textContent.replace(/\s+/g, " ");
  check("4b: after — the Actual line names the counselor measure",
    /counselor-accepted/.test(after));
  check("4c: and the actual FIGURE moves with it (826.8 CPL FTES, not 22.2)",
    /826\.8 CPL FTES/.test(after) && !/22\.2 CPL FTES/.test(after));
  // The outcome row derives from the measure's milestone, so it follows.
  check("4d: the statutory outcome follows the measure to (B) and (C)",
    /\(B\)/.test(after) && /\(C\)/.test(after));
  // Read it back through _effective() — the model's own answer to "what are you
  // using", which is where a dial belongs. It carries BOTH the curator's pin and
  // the measure actually resolved, so an un-pin is distinguishable from a pin
  // that happens to agree with the wording.
  const ep = T._effective().years[0].priorities;
  check("4e: the model reports the new pin, and reports it as the resolved measure",
    ep.some((p) => p.metric_src === "pac_u" && p.measure === "pac_u"));
  // Target and Total Possible are size-derived — the measure must not touch
  // them. Asserted as UNCHANGED rather than as a literal: the figure comes from
  // the fixture's FTES, so a hardcoded number tests the fixture, not the rule.
  check("4f: the target holds — a measure change is not a target change",
    !!targetBefore && targetOf(after) === targetBefore);
}

// ── 5. ⚠️ un-pinning stores "", so a lower layer cannot resurface ────────────
{
  const { T, window, doc } = mount();
  fire(window, pickerForCounselor(doc), "");
  // Read the layer the write actually went to, rather than naming one: setPrio
  // addresses activeOverride(), and which layer that is depends on whether a
  // scenario is selected. What matters is that SOME layer stores "".
  const layers = [T._getScenario(), T._getShared()].filter(Boolean);
  const stored = layers.map((o) => (((o.yearPriorities || {})["1"] || {})["2"] || {}))
    .find((e) => "metric_src" in e && e.metric_src === "");
  check("5a: the un-pin STORES the empty string rather than deleting the key", !!stored);
  const shared = T._getShared();
  check("5b: the lower layer still holds its own pin — this is the resurfacing risk",
    shared.yearPriorities["1"]["2"].metric_src === "ppa_u");
  // ⚠️ Scope to the ACTUAL line, not the whole card: the picker's own option
  // list sits inside the card and names "portal-origin students", so a
  // card-wide search for that phrase matches the control rather than the figure.
  const card = cardForCounselor(doc).textContent.replace(/\s+/g, " ");
  const actual = (card.match(/Actual [^|]{0,200}?\(units of [^)]*\)/) || [""])[0];
  check("5c: ...and it does NOT resurface — the ACTUAL reads the WORDING, not ppa_u",
    /counselor-accepted/.test(actual) && !/portal-origin/.test(actual));
  check("5d: the picker shows the un-pinned state back to the curator",
    pickerForCounselor(doc).value === "");
  check("5e: and the footnote names what the wording resolves to",
    /The wording decides/.test(pickerForCounselor(doc)
      .closest(".cplfund-cardsrc").querySelector(".cplfund-cardsrc-foot").textContent));
}

// ── 6. a bad pin says so rather than reading as fine ─────────────────────────
{
  const { doc } = mount({ pin: "not_a_feed" });
  const foot = pickerForCounselor(doc).closest(".cplfund-cardsrc")
    .querySelector(".cplfund-cardsrc-foot").textContent;
  check("6a: an unknown pin names itself in the picker's own footnote",
    /not_a_feed/.test(foot) && /outside the known MAP feeds/.test(foot));
  check("6b: and says the priority stays at $0 — never that it is fine",
    /\$0/.test(foot));
}

// ── 7. no control reaches a public reader ────────────────────────────────────
{
  const { doc } = mount({ public: true });
  check("7a: public mode renders NO measure picker", sels(doc).length === 0);
  const html = doc.getElementById("cplFundingMount").innerHTML;
  // ⚠️ NOT a "Measured from" text search: that phrase also opens the metric
  // block's TOOLTIP ("Measured from the MAP feed key ppa_u"), which is Sam's
  // own 2026-08-28 placement and must survive. Assert on the control itself.
  check("7b: and leaves no orphan wrapper or attribute behind it",
    html.indexOf("cplfund-cardsrc") === -1 && html.indexOf("data-priosrc") === -1);
  check("7c: data-priosrc is registered for the curate sweep as a backstop",
    /"data-priosrc"/.test(consumerSrc));
}

finish();

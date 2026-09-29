// tests/cpl_funding_gate_ledger_public.test.js
//
// Split out of cpl_funding.test.js on 2026-07-31: that file had accumulated 70
// JSDOM instances and was sitting on the process memory ceiling — any further
// growth OOM'd it. Each test file gets a fresh process, so splitting is the fix
// (raising --max-old-space-size is not: the limit is the container cgroup, and
// asking for more heap made it worse).
//
// Contents, moved VERBATIM (re-aimed at the one-pool table 2026-08-31 — the
// gate/ledger/public MACHINERY is unchanged; what moved is the table shape:
// one row per institution, data-id "c:<college>", the money story on the
// CR award / NC award pair's .cf-award cells, and the reserve readout in the
// consolidated Summary rather than its own pool card — R6/R11):
//   Part S — the baseline participation gate (Sam, 2026-07-30)
//   Part T — single-source: the Budget ledger is the pool authority
//   Part U — public mode (the lean college-audience page)
//   Part V — the two defects the post-build self-review caught
//
// Run from repo root: `npm test`.
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const consumerSrc = fs.readFileSync("cpl_funding.js", "utf8");
const dataSrc = fs.readFileSync("cpl_funding_data.js", "utf8");
const D = (function () {
  const sb = { window: {} };
  new Function("window", dataSrc)(sb.window);
  return sb.window.CPL_FUNDING;
})();
// The one-pool roster: 115 colleges + the noncredit-only rows (Mt. SAC
// Noncredit rides the Mt San Antonio row, so it is not one of them).
const ROSTER_N = D.colleges.length +
  D.feeders.filter(function (f) { return !f.nc_ftes_on_credit_row; }).length;

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
function click(window, el) { el.dispatchEvent(new window.Event("click", { bubbles: true })); }
function footText(doc) {
  return Array.from(doc.querySelectorAll(".cplfund-foot")).map(function (e) { return e.textContent; }).join(" ");
}
// The gate's money story lives in the CR award cell's stacked sub-line now
// (one row per institution — the old td.tot money column is retired, R6).

// Part S — the BASELINE PARTICIPATION GATE (Sam, 2026-07-30): "actual funding
// total should only be above 0 if they've met all of the quals as well."
// Sam's four rulings, each with an assertion here:
//   (1) only the 2 baseline reqs gate (coordinator + participation request);
//   (2) the gate is a prompt, not a penalty — dollars are HELD, never lost;
//   (3) the base/cap window is NOT gated (nothing unconditional survives to
//       pass through — the rural allowance retired 2026-08-22);
//   (4) withheld dollars are held in reserve, never redistributed.
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-07-30", suppress_below: 5,
    statewide: { p2: 9000, p3: 16807 },
    colleges: { "Laney": { p2: 120, p3: 200 }, "Berkeley City": { p2: 90, p3: 150 } },
    unmatched: {} };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  // Pin the phase: the row wording is deadline-dependent (Sam, 2026-08-23),
  // and the baked 2026-09-01 deadline is about to pass in real time — a test
  // that reads the clock through the default would flip red on Sept 2 for a
  // reason that has nothing to do with the gate.
  T._setScenario({ participationDeadline: "2026-11-01" });

  // Fail-open first: with no coordinator feed, NOTHING is gated (the standing
  // rule — never a false "not qualified" from missing data).
  T._setElig({ coordOk: false });
  T.render();
  check("S1: gate fails open — no coordinator feed means nothing is withheld",
    (T._alloc("Laney").earned_withheld || 0) === 0 && !T._alloc("Laney").gate_blocked);

  // Now load the feed: Laney fully qualified, Berkeley City missing the opt-in.
  T._setElig({ coordOk: true,
    coord: { "Laney": true, "Berkeley City": true },
    optin: { "Laney": true } });
  T.render();

  const ok = T._alloc("Laney"), gated = T._alloc("Berkeley City");
  check("S2: a fully qualified college is not gated", !ok.gate_blocked && (ok.earned_withheld || 0) === 0);
  check("S2: a college missing the participation request IS gated", gated.gate_blocked === true);
  check("S2: the gate names WHICH requirement is missing (not a bare failure)",
    gated.gate_missing.length === 1 && /particip/i.test(gated.gate_missing[0]));

  // (3) The CAP is untouched — the gate withholds earning, not the allocation.
  const capBefore = gated.total;
  check("S3: the gated college's allocation CAP is unchanged",
    capBefore > 0 && Math.abs(capBefore - (gated.w * shareSumAll(T))) < 1);
  check("S3: the gated college earns nothing on its performance-based main allocation",
    Math.abs(gated.earned_measured + gated.earned_advance) < 0.5);
  check("S3: what it would have earned is tracked as WITHHELD, not silently dropped",
    gated.earned_withheld > 0);

  // (4) Held, never redistributed — the qualified college's allocation is
  // completely unaffected by its neighbour being gated.
  check("S4: withheld dollars are NOT redistributed to qualified colleges",
    Math.abs(ok.total - T._alloc("Laney").total) < 0.01 &&
    ok.earned_total > 0);

  // The row says what to DO. Sam, 2026-08-23: "a little worried about the
  // message we're sending with the Held label"; 2026-08-27: the call to action
  // is "confirm participation", never "opt in" (mailing-list language that
  // presumes a default of OUT). His College Dashboard redesign (locked
  // 2026-09-28) put the call on the row's one control, with its date, and took
  // every reserve figure off the screen: the Curr columns read the qualifying
  // figure, and the pie and the chip carry the gate without a hover.
  const gatedRow = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
    .find(function (r) { return /Berkeley City/.test(r.textContent); });
  const chip = gatedRow && gatedRow.querySelector(".cplfund-optin-jump");
  const hovers = function (el) {
    return el ? el.textContent + " " + Array.from(el.querySelectorAll("[title]"))
      .map(function (x) { return x.getAttribute("title"); }).join(" ") : "";
  };
  check("S5: before the deadline the row's control says what to DO, with its date, never 'opt in'",
    !!chip && chip.textContent.trim() === "Confirm by 11-01-26" &&
    /confirm .*participation/i.test(chip.getAttribute("title") || "") &&
    !/\bopt[- ]?in\b/i.test(chip.textContent));
  check("S5: ...and the row names no held figure, in its text or its hovers",
    !!gatedRow && !/\bheld\b|\breserve[ds]?\b|\bwithheld\b/i.test(hovers(gatedRow)) &&
    hovers(gatedRow).indexOf(String(Math.round(gated.earned_withheld)).replace(/\B(?=(\d{3})+(?!\d))/g, ",")) === -1);
  check("S5: the gate is visible WITHOUT a hover — the Elig pie plus the Confirm chip",
    !!gatedRow.querySelector("svg.cf-eligpie") && !!chip);
  check("S5: …and the ⛔ chip that duplicated the pie is gone (Sam, 2026-09-01)",
    !gatedRow.querySelector(".cf-gatechip") && gatedRow.innerHTML.indexOf("⛔") === -1);
  const curTh = doc.querySelector('#cplFundTable th[data-sort="current_total"]');
  check("S5: the Curr header explains the gate: the model counts the funding once the conditions are met",
    !!curTh && /The model counts it once the institution meets its minimum conditions\./.test(curTh.getAttribute("title") || ""));

  // AFTER the deadline the chip's words change; the row still names no held
  // figure (the redesign's ruling holds in both phases). Driven by moving the
  // deadline into the past rather than by mocking a clock — the deadline is a
  // real editable dial, so this is the same path a curator takes.
  (function () {
    T._setScenario({ participationDeadline: "2020-01-01" });
    T.render();
    const lateRow = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
      .find(function (r) { return /Berkeley City/.test(r.textContent); });
    const lateChip = lateRow && lateRow.querySelector(".cplfund-optin-jump");
    check("S5: after the deadline the chip reads Confirm now, and the row still names no held figure",
      !!lateChip && lateChip.textContent.trim() === "Confirm now" &&
      !/\bheld\b|\breserve[ds]?\b/i.test(hovers(lateRow)));
    T._setScenario({ participationDeadline: "2026-11-01" });
    T.render();
  })();

  // The parked total surfaces in the consolidated SUMMARY (R11, 2026-08-31 —
  // the standalone "held in reserve" pool card folded into it), stating the
  // dollars are never redistributed.
  const summary = doc.querySelector(".cplfund-summary");
  // Sam, 2026-09-22: the reserve bullet folds into the allocation bullet, which
  // counts the held funding as demonstrated and ends on local confirmation.
  check("S6: the Summary folds the held funding into the demonstrated figure", !!summary &&
    !/held in reserve/i.test(summary.textContent) &&
    /demonstrate \$[1-9]/.test(summary.textContent));
  check("S6: ...and ends that line on local confirmation",
    !!summary && /receives its demonstrated funding once it confirms local participation/.test(summary.textContent));
  check("S6: the standalone reserve pool card is retired into the Summary (R11)",
    !doc.querySelector(".cplfund-card.withheld"));

  const csv = T._csv().split("\r\n");
  check("S7: CSV carries the withheld column",
    csv[1].indexOf("Withheld (baseline not met)") !== -1);
}
function shareSumAll(T) {
  // Σ of the viewed window's per-year share sums ÷ nYears — the same factor
  // collegeAlloc applies; derived, never hardcoded.
  const s = T._alloc("Laney");
  return s.total / s.w;
}

// ─────────────────────────────────────────────────────────────────────────────
// Part T — SINGLE-SOURCE: the Budget ledger is the authority for the
// appropriation figures (Sam, 2026-07-30 — "they're wired together"). The
// funding model no longer keeps its own copy of the $35M; it reads the
// budget_funding row whose `model_field` names the pool field. Joining on that
// column (never the row NAME) is what makes it rename-proof.
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;

  // Fail-soft FIRST: no ledger ⇒ the committed value stands. This is the
  // property that keeps an unreachable Supabase from rendering a $0 pool.
  T._setLedger(null); T.render();
  const committed = D.pool.one_time_2026_27;
  check("T1: with no ledger the committed appropriation stands (fail-soft)",
    T._pool("one_time_2026_27") === committed && committed > 0);
  check("T1: no ledger ⇒ no drift and no ledger note",
    T._ledgerDrift().length === 0 && !doc.querySelector(".cplfund-ledgernote"));

  // The ledger REPLACES the committed literal.
  T._setLedger({ one_time_2026_27: committed + 1000000 }); T.render();
  check("T2: the ledger figure overrides the committed data-file copy",
    T._pool("one_time_2026_27") === committed + 1000000);
  check("T2: the pool section states the figure is sourced from the ledger",
    !!doc.querySelector(".cplfund-ledgernote"));

  // A garbage ledger value must NOT poison the model.
  T._setLedger({ one_time_2026_27: NaN }); T.render();
  check("T3: a non-finite ledger value falls back to the committed figure",
    T._pool("one_time_2026_27") === committed);

  // A scenario what-if still WINS — it is a deliberate modelling choice, not
  // drift — but the disagreement is surfaced rather than left silent.
  T._setLedger({ one_time_2026_27: 35000000 });
  T._setScenario({ pool: { one_time_2026_27: 40000000 } });
  T.render();
  check("T4: a scenario override still beats the ledger (what-ifs keep working)",
    T._pool("one_time_2026_27") === 40000000);
  const drift = T._ledgerDrift();
  check("T4: the override is reported as drift against the ledger",
    drift.length === 1 && drift[0].field === "one_time_2026_27" &&
    drift[0].ledger === 35000000 && drift[0].effective === 40000000);
  check("T4: the drift is shown in the pool section, not just computed",
    !!doc.querySelector(".cplfund-ledgerdrift"));
  check("T4: the drift notice frames an override as deliberate, not an error",
    /deliberate what-if/.test(doc.querySelector(".cplfund-ledgerdrift").textContent));

  // Agreement is not drift.
  T._setScenario({ pool: { one_time_2026_27: 35000000 } }); T.render();
  check("T5: an override that AGREES with the ledger is not reported as drift",
    T._ledgerDrift().length === 0 && !doc.querySelector(".cplfund-ledgerdrift"));
  T._setScenario({});
}

// ─────────────────────────────────────────────────────────────────────────────
// Part U — PUBLIC MODE (Sam's ask #3, 2026-07-30): the lean college-audience
// render served by cpl_funding_public.html. This is AUDIENCE SEPARATION, NOT
// SECURITY (the data files are already public on Pages and PII-free by design),
// so what these assertions actually protect is that a college never sees — or
// worse, operates — a curate affordance meant for the CO.
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  window.CPL_FUNDING_PUBLIC = true;
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T.render();

  // The registry sweep is the load-bearing guarantee: every curate attribute is
  // gone from the DOM, so a missed emitter cannot leak one.
  const CURATE = ["data-edit", "data-note", "data-notesave", "data-reqdel", "data-reqhide",
    "data-reqshow", "data-stratadd", "data-stratdel", "data-timingdel",
    "data-pooladd", "data-pooldel", "data-poolhide", "data-poolshow", "data-poolkind"];
  const leaked = CURATE.filter(function (a) { return !!doc.querySelector("[" + a + "]"); });
  check("U1: no curate/edit affordance survives in public mode (" + CURATE.length + " attrs swept)",
    leaked.length === 0);
  check("U1: no editable inputs at all (the anonymous what-if path is closed too)",
    doc.querySelectorAll("#cplFundingMount input:not([type=search]):not([type=checkbox]), " +
      "#cplFundingMount textarea, #cplFundingMount select").length === 0);

  // The three chrome surfaces a college should not see.
  check("U2: no project/scenario control strip", !doc.querySelector("#cplFundProjSel, #cplFundScenSel"));
  check("U2: no team-editing / unlock bar", !doc.querySelector("#cplFundLock, #cplFundUnlockSlot"));
  check("U2: the internal Report sub-tab is not offered",
    !doc.querySelector('[data-subview="report"]'));
  check("U2: the two public sub-views ARE still offered",
    !!doc.querySelector('[data-subview="model"]') && !!doc.querySelector('[data-subview="grants"]'));

  // The actual product still works — this is a lean render, not a crippled one.
  check("U3: every institution row still renders (the one-pool roster of " + ROSTER_N + ")",
    doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row").length === ROSTER_N);
  check("U3: the funding cells still render, each max figure beside its Curr figure",
    !!doc.querySelector("#cplFundTable tbody tr.cplfund-row td.cf-total") &&
    doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row td.cf-cur").length === ROSTER_N * 3);
  check("U3: grouping still works for a public reader",
    !!doc.querySelector("#cplFundGroup"));

  // Public mode must not even ASK for the reviewer-gated notes table. (It is
  // gated server-side too — cpl_funding_notes SELECT requires
  // is_allowed_reviewer() OR team_pass_ok() — but not asking is the honest form.)
  check("U4: no CO Monitor note textarea is rendered", !doc.querySelector(".cplfund-note"));
}
{
  // ?college= deep link — a college mostly wants its own row.
  const { window } = freshDom();
  window.CPL_FUNDING_PUBLIC = true;
  const target = D.colleges[3].college;
  window.history.replaceState({}, "", "/?college=" + encodeURIComponent(target));
  const doc = boot(window);
  // Was KNOWN-RED for a real product bug (found by this port, 2026-08-31):
  // rows keyed data-id "c:<college>" since one-pool adoption while
  // applyCollegeDeepLink()/scrollToDeepLink() still used "c:<order>", so the
  // deep-linked drill-in never opened. Fixed same day (both sites re-keyed by
  // name); this check is the regression guard.
  check("U5: ?college= opens that college's drill-in",
    !!doc.querySelector("tr.cplfund-detail"));
  const hl = doc.querySelector("tr.cplfund-deeplink");
  check("U5: ?college= highlights the row", !!hl && hl.textContent.indexOf(target) !== -1);
  window.CPL_FUNDING_TAB.render();
  check("U5: the highlight SURVIVES a re-render (sidecar loads re-render the tab)",
    !!doc.querySelector("tr.cplfund-deeplink"));
}
{
  // An unknown ?college= must be ignored, never an error state.
  const { window } = freshDom();
  window.CPL_FUNDING_PUBLIC = true;
  window.history.replaceState({}, "", "/?college=Hogwarts");
  const doc = boot(window);
  check("U6: an unknown ?college= is ignored, not an error",
    doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row").length === ROSTER_N &&
    !doc.querySelector("tr.cplfund-deeplink"));
}
{
  // The DEFAULT (dashboard) render must be completely unaffected.
  const { window } = freshDom();
  const doc = boot(window);
  check("U7: without the flag the curate affordances are still present (no regression)",
    !!doc.querySelector("[data-edit]") && !!doc.querySelector('[data-subview="report"]'));
}

// U8 — the ONE public page, and the redirect standing where the old one was.
//
// RE-AIMED 2026-09-09 (Sam's decision sheet, item 9). Until then two URLs
// rendered this model: funding-model/ (the explainer, hosting the tab's own
// institution section in embed mode) and cpl_funding_public.html (the tab in
// public mode). That was untidy until a curator gained "Hide on the public
// page" — hiding rides sectionShell(), which only the second page passes
// through, so a section the CO held back stayed visible on the first. Two
// renderings of one model is a correctness problem once either can be edited.
//
// So the contract these checks guard did not disappear; it moved. They now
// assert it where it lives, plus that the retired URL still lands a reader
// somewhere useful — it was handed to colleges, and Pages cannot issue a 301.
{
  const pub = fs.readFileSync(path.join(__dirname, "..", "cpl_funding_public.html"), "utf8");
  check("U8: the retired URL redirects to the one public page, by meta refresh AND script",
    /http-equiv="refresh"[^>]*url=funding-model\//i.test(pub) &&
    /location\.replace\("funding-model\/"\)/.test(pub));
  check("U8: it names funding-model/ as canonical and asks not to be indexed",
    /rel="canonical"[^>]*funding-model\//.test(pub) && /name="robots"[^>]*noindex/.test(pub));
  check("U8: a reader whose refresh is blocked still gets a link they can click",
    /<a href="funding-model\/">/.test(pub));
  check("U8: it still points at the full dashboard for anyone who wanted that instead",
    /index\.html#implementation-funding/.test(pub));
  check("U8: it no longer boots the tab (no data, no consumer, no mount)",
    !/src="cpl_funding_data\.js"/.test(pub) && !/src="cpl_funding\.js"/.test(pub) &&
    !/id="cplFundingMount"/.test(pub));

  const exp = fs.readFileSync(path.join(__dirname, "..", "funding-model", "index.html"), "utf8");
  check("U8: the explainer is the public rendering — public mode, embed mode, college section",
    /window\.CPL_FUNDING_PUBLIC\s*=\s*true/.test(exp) &&
    /window\.CPL_FUNDING_EMBED\s*=\s*"college"/.test(exp));
  check("U8: it loads ONLY the funding data + consumer (no dashboard bundle)",
    /src="\.\.\/cpl_funding_data\.js"/.test(exp) && /src="\.\.\/cpl_funding\.js"/.test(exp) &&
    !/CPL_Data\.js|dashboard_filters\.js|cobi_orgs\.js/.test(exp));
  check("U8: it mounts where the consumer looks (#cplFundingMount)", /id="cplFundingMount"/.test(exp));
  check("U8: it states plainly that this is a draft model, not adopted policy",
    /Draft model &mdash; not adopted policy/.test(exp) &&
    /working model for discussion, not adopted policy/.test(exp));
}

// ─────────────────────────────────────────────────────────────────────────────
// Part V — the two defects the post-build self-review caught (2026-07-30).
// (The adversarial-review workflow errored out on tool plumbing, so these came
// from reading the code by hand — worth naming, because "0 findings" from a
// failed reviewer is not a clean bill of health.)
// ─────────────────────────────────────────────────────────────────────────────
{
  // V1 — the withheld figure must be the WHOLE window's under FRONT-LOAD.
  // The defect this pinned: a flat 1/nYears split showed the full cap over
  // HALF the withheld. The Yr-1/Yr-2 columns are retired (R6), so the guard
  // now reads the ONE award pair: under Combined funding the CR award cell
  // carries the whole window, and its held sub-line must carry the WHOLE
  // withheld figure — not half of it.
  const { window } = freshDom();
  // Berkeley City is given actuals well past its target, so it WOULD earn its
  // full window — then it is gated, making the whole window withheld. (Before
  // 2026-07-31 this fixture fed only p2/p3 and the withheld money came entirely
  // from the Year-2 gap metrics advancing into the Yr-1 cell. That advance was
  // the defect the front-load seam removed, so the fixture had to stop relying
  // on it — see tests/cpl_funding_frontload.test.js.)
  window.CPL_FUNDING_PERF = { as_of: "2026-07-30", suppress_below: 5,
    statewide: { pe: 43000, p2: 9000, p3: 16807, pp: 5 },
    colleges: { "Laney": { pe: 400, p2: 120, p3: 200, pp: 3 },
      "Berkeley City": { pe: 999999, p2: 999999, p3: 999999, pp: 999999 } },
    unmatched: {} };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  // Gate a college so there IS withheld money, and turn front-load ON.
  T._setElig({ coordOk: true, coord: { "Laney": true }, optin: { "Laney": true } });
  // The deadline is in the PAST here on purpose. This block tests arithmetic —
  // that a front-loaded award cell reports the WHOLE window's withheld amount
  // and not half of it — and that figure only renders once the deadline has
  // passed (before it, the row says "confirm participation" and names no money,
  // per Sam's 2026-08-23 wording call). Wrong phase, nothing to measure.
  T._setScenario({ disbursement: "frontload", participationDeadline: "2020-01-01" });
  T.render();

  const gated = T._alloc("Berkeley City");   // no opt-in ⇒ gated
  check("V1: front-load setup — the gated college has withheld money",
    gated.gate_blocked === true && gated.earned_withheld > 0);

  const row = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
    .find(function (r) { return /Berkeley City/.test(r.textContent); });
  // Until the College Dashboard redesign (Sam, locked 2026-09-28) the gated
  // cell read "held $X" after the deadline, and this block pinned that the
  // front-loaded figure was the WHOLE window's. The redesign took every
  // reserve figure off the screen, so the arithmetic is pinned at the model
  // (above) and the row is pinned to name none of it: the Curr columns read
  // the qualifying figure, $0 for a gated college, over the whole window.
  check("V1: the model still holds the WHOLE window's withheld amount in Year 1 under front-load",
    gated.earned_withheld > 0 && Math.abs((gated.hy1 || 0) - gated.earned_withheld) < 1 && (gated.hy2 || 0) === 0);
  // By its words: this fixture demonstrates the whole credit share, so the
  // held figure equals Max CR Funds and a dollar match would find the share.
  const rowWords = row ? row.textContent + " " + Array.from(row.querySelectorAll("[title]"))
    .map(function (x) { return x.getAttribute("title"); }).join(" ") : "";
  check("V1: the front-loaded gated row names no held figure, in text or hover",
    !!row && !/\bheld\b|\bwithheld\b|\breserve/i.test(rowWords));
  const ths = Array.from(doc.querySelectorAll("#cplFundTable thead th"));
  const curTot = row && row.children[ths.findIndex(function (th) { return th.getAttribute("data-sort") === "current_total"; })];
  check("V1: its Curr Total Funds reads $0 over the window, with the window's wording",
    !!curTot && curTot.textContent.trim() === "$0" &&
    /qualifying so far, credit and noncredit together: \$0 of \$/.test(curTot.getAttribute("title") || ""));
  T._setScenario({});
}
{
  // V2 — public mode must refuse to RENDER the Report body, not merely hide its
  // tab. A hidden tab is not a guarantee if state reaches "report" another way.
  const { window } = freshDom();
  window.CPL_FUNDING_PUBLIC = true;
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setSubview("report");
  check("V2: public mode refuses to render the internal Report body",
    !doc.querySelector(".cplfund-memo, #cplFundMemo") &&
    doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row").length > 0);
  check("V2: it falls back to the model view rather than blanking the page",
    !!doc.querySelector('[data-subview="model"].on'));
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);

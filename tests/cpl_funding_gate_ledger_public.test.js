// tests/cpl_funding_gate_ledger_public.test.js
//
// Split out of cpl_funding.test.js on 2026-07-31: that file had accumulated 70
// JSDOM instances and was sitting on the process memory ceiling — any further
// growth OOM'd it. Each test file gets a fresh process, so splitting is the fix
// (raising --max-old-space-size is not: the limit is the container cgroup, and
// asking for more heap made it worse).
//
// Contents, moved VERBATIM:
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

// Part S — the BASELINE PARTICIPATION GATE (Sam, 2026-07-30): "actual funding
// total should only be above 0 if they've met all of the quals as well."
// Sam's four rulings, each with an assertion here:
//   (1) only the 2 baseline reqs gate (coordinator + participation request);
//   (2) the gate is a prompt, not a penalty — dollars are HELD, never lost;
//   (3) the guaranteed rural allowance and the cap are NOT gated;
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

  // The cell must say "withheld", never a bare $0 — a plain zero would read as
  // "posted no CPL", a different and unfairer claim.
  const gatedRow = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
    .find(function (r) { return /Berkeley City/.test(r.textContent); });
  const gatedSub = gatedRow.querySelector("td.tot .sub");
  // Sam, 2026-08-23: "a little worried about the message we're sending with the
  // Held label". Before the deadline EVERY college is gated — nobody has opted
  // in yet — so a dollar figure labelled "held" on all 115 rows says the state
  // is withholding from the whole system, when the requirement is not yet due.
  // The rule is now phase-dependent, and the never-a-bare-$0 ruling still holds
  // in both phases.
  // Sam, 2026-08-27: the call to action is "confirm participation", not "opt in"
  // — "opt in" is mailing-list language that presumes a default of OUT and makes
  // declining look like a normal choice, when nothing here is conditional on a
  // choice. Asserted BOTH ways so a revert is a failure, not a silent pass.
  check("S5: before the deadline the row says what to DO, and names no held figure",
    !!gatedSub && /confirm participation/i.test(gatedSub.textContent) &&
    !/\bopt[- ]?in\b/i.test(gatedSub.textContent) &&
    !/held/i.test(gatedSub.textContent) && !/\$/.test(gatedSub.textContent) &&
    !/^\s*\$0\s*$/.test(gatedSub.textContent));
  check("S5: ...and its hover says plainly that nothing is withheld yet",
    /nothing is withheld yet/i.test(gatedSub.getAttribute("title") || ""));
  check("S5: the gated row carries a visible ⛔ chip so it needs no hover",
    !!gatedRow.querySelector(".cf-gatechip"));
  check("S5: the gated cell's hover explains the dollars roll forward",
    /roll forward|held in reserve/i.test(gatedRow.querySelector("td.tot").getAttribute("title") || "") ||
    /roll forward|reserve/i.test(gatedRow.querySelector("td.tot .sub").getAttribute("title") || ""));

  // AFTER the deadline the money genuinely is being held back, so the figure
  // returns. Driven by moving the deadline into the past rather than by mocking
  // a clock — the deadline is a real editable dial, so this is the same path a
  // curator takes.
  (function () {
    const prev = T._shared ? null : null;
    T._setScenario({ participationDeadline: "2020-01-01" });
    T.render();
    const lateRow = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
      .find(function (r) { return /Berkeley City/.test(r.textContent); });
    const lateSub = lateRow.querySelector("td.tot .sub");
    check("S5: after the deadline the row DOES name the held figure",
      !!lateSub && /^held \$/.test(lateSub.textContent.trim()) &&
      /was due/i.test(lateSub.getAttribute("title") || ""));
    T._setScenario({ participationDeadline: "2026-11-01" });
    T.render();
  })();

  // The reserve pool card exists and equals the sum of what was withheld.
  const heldCard = doc.querySelector(".cplfund-card.withheld");
  check("S6: a 'held in reserve' pool card surfaces the parked total", !!heldCard);
  check("S6: the reserve card states the dollars are not redistributed",
    /NOT redistributed|held, NOT/i.test(heldCard.textContent) ||
    /qualifying later/i.test(heldCard.textContent));

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
  check("U3: every college row still renders",
    doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row").length === D.colleges.length);
  check("U3: the money cells still stack cap over earned",
    !!doc.querySelector("#cplFundTable td.tot .sub"));
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
    doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row").length === D.colleges.length &&
    !doc.querySelector("tr.cplfund-deeplink"));
}
{
  // The DEFAULT (dashboard) render must be completely unaffected.
  const { window } = freshDom();
  const doc = boot(window);
  check("U7: without the flag the curate affordances are still present (no regression)",
    !!doc.querySelector("[data-edit]") && !!doc.querySelector('[data-subview="report"]'));
}

// U8 — the standalone page itself (static greps: it is hand-maintained HTML).
{
  const pub = fs.readFileSync(path.join(__dirname, "..", "cpl_funding_public.html"), "utf8");
  check("U8: the public page sets the public-mode flag", /window\.CPL_FUNDING_PUBLIC\s*=\s*true/.test(pub));
  check("U8: it loads ONLY the funding data + consumer (no dashboard bundle)",
    /src="cpl_funding_data\.js"/.test(pub) && /src="cpl_funding\.js"/.test(pub) &&
    !/CPL_Data\.js|dashboard_filters\.js|cobi_orgs\.js/.test(pub));
  check("U8: it provides the CPL_TABS.loadScript contract so the sidecars still load",
    /CPL_TABS\s*=\s*\{[\s\S]*loadScript/.test(pub));
  check("U8: the sidecar loader FAILS OPEN (onerror still calls back)",
    /onerror[\s\S]{0,80}cb\(\)/.test(pub));
  check("U8: it mounts where the consumer looks (#cplFundingMount)", /id="cplFundingMount"/.test(pub));
  check("U8: it states plainly that this is a draft model, not an award notice",
    /not an award notice/i.test(pub));
  check("U8: it documents that this is audience separation, NOT security",
    /audience separation, NOT security/i.test(pub));
  check("U8: it links back to the full dashboard rather than pretending to be the whole site",
    /index\.html#implementation-funding/.test(pub));
}

// ─────────────────────────────────────────────────────────────────────────────
// Part V — the two defects the post-build self-review caught (2026-07-30).
// (The adversarial-review workflow errored out on tool plumbing, so these came
// from reading the code by hand — worth naming, because "0 findings" from a
// failed reviewer is not a clean bill of health.)
// ─────────────────────────────────────────────────────────────────────────────
{
  // V1 — WITHHELD must be pro-rated by the cell's share of the WINDOW CAP, not
  // by 1/nYears. Those differ under FRONT-LOAD, where the year-1 cell carries
  // the whole window: a flat split showed the full cap over HALF the withheld.
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
  // that a front-loaded Yr-1 cell reports the WHOLE window's withheld amount and
  // not half of it — and that figure only renders once the deadline has passed
  // (before it, the row says "opt in to start earning" and names no money, per
  // Sam's 2026-08-23 wording call). Wrong phase, nothing to measure.
  T._setScenario({ disbursement: "frontload", participationDeadline: "2020-01-01" });
  T.render();

  const gated = T._alloc("Berkeley City");   // no coordinator ⇒ gated
  check("V1: front-load setup — the gated college has withheld money",
    gated.gate_blocked === true && gated.earned_withheld > 0);

  const row = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
    .find(function (r) { return /Berkeley City/.test(r.textContent); });
  const cells = row.querySelectorAll("td");
  // The Yr-1 cell under front-load carries the WHOLE window, so its withheld
  // must be the WHOLE withheld — not half of it.
  // Sam, 2026-07-30: the cell reads "held $X" — "withheld · $X held" was redundant.
  // NB: target the .sub span, not the cell text — textContent concatenates the
  // stacked lines with no separator ("$150,000held $106,500"), so a \b anchor
  // never matches.
  const subText = function (td) { var el = td.querySelector(".sub"); return el ? el.textContent : ""; };
  const y1 = Array.from(cells).find(function (td) {
    return /held/i.test(subText(td)) && !td.classList.contains("tot");
  });
  const heldDigits = String(Math.round(gated.earned_withheld));
  // `y1` missing is a FAILURE, not a crash. `subText(undefined)` threw a
  // TypeError before finish() ever ran, so a regression here printed NOTHING —
  // no passes, no failures, no summary — and looked like a broken harness
  // rather than a broken guard. A test that dies takes every other result with
  // it.
  check("V1: a front-loaded window cell reporting a held figure exists at all", !!y1);
  check("V1: the front-loaded window cell reports the FULL held amount",
    !!y1 && subText(y1).replace(/[^0-9]/g, "") === heldDigits);
  // And it must agree with the window Total cell, which carries the same window.
  const tot = row.querySelector("td.tot");
  check("V1: the front-loaded window cell agrees with the window Total cell",
    subText(tot).replace(/[^0-9]/g, "") === heldDigits);
  check("V1: the cell says 'held', not the redundant 'withheld · held'",
    !!y1 && !/withheld/i.test(subText(y1)));
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

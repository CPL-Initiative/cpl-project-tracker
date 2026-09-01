// tests/cpl_funding_metric_pin.test.js
//
// The explicit metric SOURCE pin (`metric_src`) — and the defect that forced it.
//
// measurability() resolves a priority to its data source by substring-matching
// the metric's PROSE. That was sound while every metric in the system described
// CREDIT performance: a text match could only land on the right measure or on
// none at all.
//
// It stops being sound the moment a second lane exists. Measured 2026-08-27
// against the real predicates: all three of Sam's noncredit metrics, written in
// his own idiom and naming the noncredit LANDING PAGE (which is how an origin
// filter reads in prose), collapse onto `pp_u` — the CREDIT lane's portal-origin
// transcribed units — because the portal entry sits first among the unit
// measures and wins before "eligible"/"applied"/"transcribed" is consulted.
//
// ⚠️ The reason this needed a guard rather than a look at the screen: statewide
// pp_u is 25.0 units carried by 3 of 105 colleges, so 102 colleges would render
// 0 — which is EXACTLY the honest zero Sam asked the NC lane to show while the
// origination field is undelivered. The wrong number and the right number are
// indistinguishable by eye.
//
// SURFACES, one-pool form (adopted 2026-08-31): the P1/P2/P3 row cells this
// suite used to read are retired — the per-college view of a priority is the
// row EXPAND's 7-column detail table (Priority · CR funding · NC funding ·
// Target · Actual · Current Total · Total Possible), and the statewide view is
// the priority cards. The pin machinery itself is unchanged; the assertions
// below read the new surfaces plus the CSV (which kept its per-priority
// target/actual columns).
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_metric_pin.test.js`).
const { check, freshDom, boot, consumerSrc, D, finish } = require("./lib/cpl_funding_harness.js");

// ⚠️ LOCATE PRIORITY ROWS STRUCTURALLY. The expand's detail table rows ARE
// P1, P2, P3 in document order; each row's cells are read by POSITION in the
// locked mock's 7-column shape (0 Priority · 1 CR funding · 2 NC funding ·
// 3 Target · 4 Actual · 5 Current Total · 6 Total Possible). The old suite
// indexed the COLLEGE ROW's <td> list and broke the day a label column landed
// before P1 — the expand table's columns are the contract now, so position is
// the structure here, not an accident of layout.
function openDetail(window, doc, name) {
  const find = () => Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
    .find((r) => r.textContent.indexOf(name) !== -1);
  const row = find();
  if (!row) return null;
  row.querySelector(".cplfund-caret").dispatchEvent(new window.Event("click", { bubbles: true }));
  const row2 = find();
  const det = row2 && row2.nextElementSibling;
  return det && det.classList.contains("cplfund-detail") ? det : null;
}
function detRows(det) {
  if (!det) return [];
  return Array.from(det.querySelectorAll(".cplfund-dtl-table tr")).slice(1)   // drop the header row
    .map((tr) => Array.from(tr.querySelectorAll("td"))
      .map((td) => td.textContent.replace(/\s+/g, " ").trim()));
}
// "N FTES" on the ACTUAL cell (fmtNum1 renders one decimal — "400.0 FTES"),
// not preceded by a digit or dot (so 400 does not match inside 1,400).
const actFtes = (cells, n) => new RegExp("(^|[^\\d.])" + n + "(\\.0)? FTES").test(cells[4] || "");

// ── 1. the defect itself, against the REAL predicates ────────────────────────
// Rebuilt out of the consumer so this cannot drift into testing a copy.
const has = (m, s) => String(m || "").toLowerCase().indexOf(s) !== -1;
const wantsUnits = (function () {
  const m = consumerSrc.match(/function wantsUnits\(m\) \{[\s\S]*?\n  \}/);
  return eval("(" + m[0].replace(/^function wantsUnits/, "function") + ")");
})();
const MEASURES = (function () {
  const start = consumerSrc.indexOf("var MEASURES = [");
  const end = consumerSrc.indexOf("];", start) + 2;
  return eval("(" + consumerSrc.slice(start + "var MEASURES = ".length, end - 1) + ")");
})();
function proseMeasure(metric) {
  const m = String(metric || "").toLowerCase();
  return MEASURES.find((x) => x.test(m)) || {};
}

const NC_METRICS = [
  "Eligible CPL Units as FTES for students originating from the Noncredit Landing Page",
  "Applied CPL Units as FTES for students originating from the Noncredit Landing Page",
  "Transcribed CPL Units as FTES for students originating from the Noncredit Landing Page",
];
const resolved = NC_METRICS.map((m) => proseMeasure(m).src);
check("1a: prose matching still collapses all three NC metrics onto one credit source (the pin is still needed)",
  resolved.length === 3 && new Set(resolved).size === 1 && resolved[0] === "pp_u");
check("1b: and that collapse destroys the eligible/applied/transcribed milestone distinction",
  proseMeasure(NC_METRICS[0]).src === proseMeasure(NC_METRICS[2]).src);

// ── 2. the registry ──────────────────────────────────────────────────────────
check("2a: METRIC_SOURCES declares the legal pins, so metric_src is not free text",
  /var METRIC_SOURCES = \{/.test(consumerSrc));
check("2b: every source the prose matcher can return is also declarable as a pin",
  MEASURES.filter((x) => x.src).every((x) =>
    new RegExp("^\\s{4}" + x.src + ":\\s*\\{", "m").test(consumerSrc)));
check("2c: measureOf() is the single seam — no site reads measurability(p.metric) directly any more",
  /function measureOf\(p\)/.test(consumerSrc) && !/measurability\(p\.metric\)/.test(consumerSrc));
check("2d: srcDelivered() asks the ARTIFACT, not the registry (a declared key may be undelivered)",
  /function srcDelivered\(src\)[\s\S]{0,320}hasOwnProperty\.call\(pf\.statewide, src\)/.test(consumerSrc));

// ── 3. the pin actually overrides the prose, end to end ──────────────────────
{
  const { window } = freshDom();
  // pa_u present for one college; pp_u present too, so a regression that fell
  // back to prose would find a REAL value and look fine.
  window.CPL_FUNDING_PERF = { as_of: "2026-08-27", suppress_below: 5,
    statewide: { pa_u: 500000, pp_u: 25 },
    colleges: { "Laney": { pa_u: 12000, pp_u: 3 } }, unmatched: {} };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ yearPriorities: { "1": {
    // Same prose for all three; only the pin differs.
    "0": { metric: NC_METRICS[1], metric_src: "pa_u" },
    "1": { metric: NC_METRICS[1] },                     // unpinned → prose → pp_u
    "2": { metric: NC_METRICS[1], metric_src: "nope_u" } // unknown pin
  } } });
  T.render();
  const P = detRows(openDetail(window, doc, "Laney"));
  // P1 and P2 carry the SAME metric prose and differ only by the pin. P1 scores
  // on pa_u (12,000 units / 30 = 400 CPL FTES, its full cap); P2 falls through
  // to the prose and scores on pp_u (3 units = 0.1 FTES, ~1% of target). One
  // config field, a 4,000x difference in what the college is judged on — and
  // neither row looks broken.
  check("3a: the pinned priority scores on pa_u (400 FTES), not on the prose's pp_u",
    P.length === 3 && actFtes(P[0], 400));
  check("3b: the UNPINNED twin, same prose, silently scores on the credit portal measure (0.1 FTES)",
    P.length === 3 && /(^|[^\d.])0\.1 FTES/.test(P[1][4]));
  check("3b2: so the pin changes the answer — identical prose, different earning",
    P.length === 3 && P[0][4] !== P[1][4] && P[0][5] !== P[1][5]);
  check("3c: an unknown pin renders 'not wired' rather than a plausible number",
    P.length === 3 && /not wired/.test(P[2][4]) && P[2][5] === "$0");
  check("3d: a pinned unit source forces the FTES unit, whatever the prose sniffs",
    T._prios("Laney", "1")[0].unit === "FTES");

  // ⚠️ 3d above cannot actually discriminate on its own: its prose ("...Units as
  // FTES...") already sniffs to units, so blanking the registry lookup in
  // prioUnit() left it green. Proven by mutation, then fixed here — the pin has
  // to be the ONLY thing that can produce FTES.
  T._setShared({ yearPriorities: { "1": {
    "0": { metric: "Headcount of students with transcribed CPL credit", metric_src: "pa_u" },
    "1": { metric: "Headcount of students with transcribed CPL credit" },
    "2": { metric: "Headcount with CPL Matched in MAP and MIS" }
  } } });
  T.render();
  const pr = T._prios("Laney", "1");
  check("3d2: prose says HEADCOUNT, pin says units — the pin wins",
    pr[0].unit === "FTES" && pr[1].unit === "students");
}

// ── 3e. DECLARED BUT UNDELIVERED, behaviorally ───────────────────────────────
// Sam's NC ruling: the row shows its target and potential with current earnings
// at ZERO — explicitly not the full-cap advance an unmeasurable credit metric
// gets. A source declared in the registry but absent from the published artifact
// is that state, and it is the state every NC priority is in today.
{
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-08-27", suppress_below: 5,
    statewide: { pa_u: 500000 },                       // no nc_* key anywhere
    colleges: { "Laney": { pa_u: 12000 } }, unmatched: {} };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ yearPriorities: { "1": {
    "0": { metric: NC_METRICS[1], metric_src: "nc_pa_u" },
    "1": { metric: "Headcount with CPL Matched in MAP and MIS" },   // a real data gap, for contrast
    "2": { metric: NC_METRICS[1], metric_src: "pa_u" }
  } } });
  T.render();
  const P = detRows(openDetail(window, doc, "Laney"));
  check("3e: an undelivered NC source earns $0 and says 'no feed'",
    P.length === 3 && /no feed/.test(P[0][4]) && P[0][5] === "$0");
  check("3e2: it does NOT advance the full cap — the contrast is the data-gap row beside it",
    P.length === 3 && !/no feed/.test(P[1][4]) && /gap/.test(P[1][4]));
  check("3e3: and it is not reported as a measured zero ('0.0 FTES · 0%')",
    P.length === 3 && !actFtes(P[0], 0));
  // The data-gap row ADVANCES its whole CR funding; the undelivered row earns
  // strictly $0 — read straight off the Current Total column.
  check("3e4: the undelivered row earns strictly less than the data-gap row advances",
    P.length === 3 && P[0][5] === "$0" && P[1][5] !== "$0" && P[1][5] === P[1][1]);
}

// ── 4. the two states that must never advance ────────────────────────────────
// A miswired pin falling into the data-gap branch would pay every college its
// FULL CAP — one typo in one config field disbursing a whole priority.
check("4a: a bad pin earns $0 and is NOT treated as a data gap",
  /if \(meas\.bad_src\) return \{ f: 0, status: "bad_src"/.test(consumerSrc));
check("4b: bad_src is checked BEFORE the gap branch (order is the whole protection)",
  consumerSrc.indexOf('status: "bad_src"') < consumerSrc.indexOf('status: "gap"'));
check("4c: a declared-but-undelivered source earns f=0 — Sam's NC ruling, not a full-cap advance",
  /if \(meas\.undelivered\) return \{ f: 0, status: "undelivered"/.test(consumerSrc));
// "The feed carries no such measure" and "this college posted nothing" are two
// different zeros and the tab must not print them the same way. The surface is
// the expand's Actual column now (one pool, 2026-08-31): "no feed" vs "0 · 0%".
check("4d: undelivered is a separate LABEL from none (absent zero vs measured zero)",
  /status === "undelivered"\) act = "no feed"/.test(consumerSrc) &&
  /status === "none"\) act = "0 &middot; 0%"/.test(consumerSrc));

// ── 5. one place decides whether a number is a measurement ───────────────────
check("5a: earnIsMeasured() exists, so a new status cannot be forgotten at four sites",
  /function earnIsMeasured\(fr\)/.test(consumerSrc));
check("5b: no surface still tests the old inline gap-or-pending pair",
  !/status === "gap" \|\| fr\.status === "pending"/.test(consumerSrc.replace(/\/\/[^\n]*/g, "")));
check("5c: the CSV emits BLANK for an unmeasured priority, never 0",
  /!earnIsMeasured\(fr\) \? "" : 0/.test(consumerSrc));
// ⚠️ 5c is a source read and CANNOT fail if earnIsMeasured() itself is broken —
// proven by mutation (making it return true always left 5c green). The CSV is
// therefore also exercised for real: an undelivered priority must export an
// empty cell, because a 0 in a spreadsheet is a measurement someone will chart.
{
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-08-27", suppress_below: 5,
    statewide: { pa_u: 500000 }, colleges: { "Laney": { pa_u: 12000 } }, unmatched: {} };
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ yearPriorities: { "1": {
    "0": { metric: NC_METRICS[1], metric_src: "nc_pa_u" },
    "1": { metric: NC_METRICS[1], metric_src: "pa_u" },
    "2": { metric: NC_METRICS[1], metric_src: "nc_pt_u" }
  } } });
  T.render();
  const line = T._csv().split("\n").find((l) => /Laney/.test(l));
  const cols = line.split(",");
  const p1a = cols.findIndex((v) => /^"?400/.test(v));   // the delivered pin's actual
  check("5c2: the CSV actually carries the delivered actual",
    p1a > 0);
  // P1 actual sits two columns before it (target, actual per priority).
  check("5c3: and the undelivered priorities export EMPTY cells, not zeros",
    cols[p1a - 2] === "" && cols[p1a + 2] === "");
}
// The old drill-in's "nothing about this college has been measured" sentence
// went with the P-cells; what must survive is the CLAIM DISCIPLINE — an
// undelivered measure is never described as this college posting nothing. The
// statewide card names the true reason (the feed carries no such measure), and
// the expand's undelivered branch is decided before any zero can render (3e3
// proves it behaviorally).
check("5d: an undelivered measure is blamed on the FEED, never on the college",
  /the daily MAP feed does not carry this measure for anyone yet/.test(consumerSrc) &&
  consumerSrc.indexOf('status === "undelivered") act = "no feed"') <
    consumerSrc.indexOf('status === "gap") act ='));

// ── 6. the curator diagnostic must not lie about the new states ──────────────
// It previously classified anything without a `src` as "not measurable — pays a
// FULL ADVANCE". Both new states have no measurement behind them and NEITHER
// advances, so that sentence would have been exactly backwards on both.
{
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-08-27", suppress_below: 5,
    statewide: { pa_u: 500000 }, colleges: { "Laney": { pa_u: 12000 } }, unmatched: {} };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ yearPriorities: { "1": {
    "0": { metric: NC_METRICS[1], metric_src: "nc_pa_u" },
    "1": { metric: NC_METRICS[1], metric_src: "nope_u" },
    // Same MILESTONE (applied), different UNIT — so the wording check fires and
    // the milestone check does not. Separating them matters: an earlier fixture
    // said "transcribed" and pinned pa_u, which trips BOTH, and the milestone
    // warning correctly outranks the wording one.
    "2": { metric: "Headcount of students with CPL applied to their record", metric_src: "pa_u" }
  } } });
  T.render();
  const diag = doc.querySelector(".cplfund-metricdiag");
  const txt = diag ? diag.textContent : "";
  check("6a: an undelivered pin reads 'declared, not delivered yet', not 'pays a FULL ADVANCE'",
    /declared, not delivered yet/.test(txt));
  check("6b: a bad pin reads NOT WIRED and says it earns $0",
    /NOT WIRED/.test(txt) && /earns \$0/.test(txt));
  check("6c: neither new state is described as advancing",
    !/nc_pa_u[\s\S]{0,120}FULL ADVANCE/.test(txt) && !/nope_u[\s\S]{0,120}FULL ADVANCE/.test(txt));
  check("6d: a prose/pin wording disagreement is flagged as WORDING, not as a unit mismatch",
    /wording says/.test(txt) && !/UNIT MISMATCH/.test(txt));
  check("6e: the panel opens itself when a pin is bad",
    !!diag && diag.hasAttribute("open"));
}

// ── 7. MILESTONE agreement, and the live Access metric now PINNED ───────────
// MAP's funnel is eligible -> applied -> transcribed, three different quantities
// (statewide 1,382,125 / 223,384 / 80,338 units). A metric naming one rung and a
// measure returning another scores the right college on the wrong thing.
//
// Sam's live Year-1 Access metric did exactly this. It is now pinned to `ppa_u`
// in the baked defaults, so this section asserts BOTH halves: the defect still
// reproduces on an unpinned slot (so the guard keeps its teeth), and the pinned
// slot is clean.
const LIVE_ACCESS = "Applied units measured in FTES for students originating from " +
  "either CPL Portal, College CPL Landing Page, or batch upload";
check("7a: prose matching still sends the live Access metric to a TRANSCRIBED measure",
  proseMeasure(LIVE_ACCESS).src === "pp_u");
// ⚠️ THE PIN DOES NOT BELONG IN THE BAKE, and an attempt to put it there is what
// proved it. cpl_funding_data.js is stale BY DESIGN: its slot-2 metric is the old
// "Headcount ... transcribed Credit from either CPL Student Portal or CPL Landing
// Page" — a HEADCOUNT/TRANSCRIBED metric — while the live config's slot 2 is Sam's
// APPLIED/UNITS one. A pin lands on whichever metric occupies the slot, so pinning
// `ppa_u` there attached a units/applied key to a headcount/transcribed metric and
// broke nine existing assertions across three suites. The pin lives with the
// metric it was chosen for: the live Supabase config.
check("7a2: the BAKE carries no pin — its slot-2 metric is not the one the pin is for",
  !(D.year_priorities["1"][2] || {}).metric_src &&
  !(D.year_priorities["2"][2] || {}).metric_src &&
  /Headcount/.test((D.year_priorities["1"][2] || {}).metric || ""));
{
  const { window } = freshDom();
  const fs = require("fs");
  new Function("window", fs.readFileSync("cpl_funding_performance.js", "utf8")).call(window, window);
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  // Slot 0 is UNPINNED in the bake, so putting the Access prose there reproduces
  // the historical defect; slot 2 keeps its baked `ppa_u` pin.
  const LIVE = {
    "0": { metric: LIVE_ACCESS, share: 0.33, factor: 0.5 },
    "1": { metric: "Transcribed CPL Units measured in FTES", share: 0.33, factor: 0.5 },
    "2": { metric: LIVE_ACCESS, share: 0.34, factor: 0.5, metric_src: "ppa_u" }
  };
  T._setShared({ yearPriorities: { "1": LIVE, "2": LIVE }, mirrorYears: true, disbursement: "frontload" });
  T.render();
  // The per-college surface is the CSV now (one line per institution, the
  // P<n> target/actual pairs kept — the row cells are retired). Compare the
  // unpinned P1 actual column against the pinned P3 one.
  const csv = T._csv().split("\r\n");
  const head = csv[1].split(",");
  const iP1 = head.indexOf("P1 actual"), iP3 = head.indexOf("P3 actual");
  const dataLines = csv.slice(2).filter((l) => l && !/SYSTEM/.test(l));
  const p1vals = dataLines.map((l) => l.split(",")[iP1]);
  const p3vals = dataLines.map((l) => l.split(",")[iP3]);
  const nonzero = (a) => a.filter((v) => v !== "" && v !== "0" && !/^</.test(v));
  check("7b: UNPINNED, the live Access prose lands on the credit portal measure — at most the 3 " +
        "pp_u carriers read anything, every other institution a measured 0",
    dataLines.length > 100 && nonzero(p1vals).length <= 3 &&
    p1vals.filter((v) => v === "0").length >= 110 &&
    p1vals.filter((v) => v === "").length === 0);
  // ...and the statewide card shows the portal measure's own tiny raw figure —
  // the fingerprint of WHERE the prose landed.
  const cards = Array.from(doc.querySelectorAll(".cplfund-prio .p"));
  check("7b2: the statewide Access card reads the portal measure's 25 units, not the applied lane",
    /25 units/.test(cards[0].textContent));
  // ⚠️ 7c USED TO READ "every pinned cell says 'no feed'", which was true only
  // while ppa_u was undelivered. The cron delivered it and the guard went red on
  // a change that was the feature working. Assert the INVARIANT instead: the pin
  // resolves somewhere other than the prose does — whether that source is
  // delivered yet is section 3e/8's job.
  check("7c: PINNED, the same prose does NOT land on the prose matcher's answer",
    p3vals.join("|") !== p1vals.join("|"));
  check("7c2: and the pinned column is never the unpinned one's universal measured zero",
    !p3vals.every((v) => v === "0"));
  const diag = doc.querySelector(".cplfund-metricdiag");
  const lis = Array.from(diag.querySelectorAll("li")).map((li) => li.textContent);
  const mm = lis.filter((t) => /MILESTONE MISMATCH/.test(t));
  check("7d: the diagnostic flags the unpinned slot and only that slot",
    mm.length === 2 && mm.every((t) => /P1/.test(t)));
  check("7e: and the pinned Access slot is NOT flagged",
    !lis.some((t) => /P3/.test(t) && /MILESTONE MISMATCH/.test(t)));
}
// ── 8. the pin activates itself when the feed catches up ─────────────────────
// `ppa_u` is emitted by funding/_build_funding_performance.py and the published
// artifact now carries it — the cutover this section was written to guarantee
// has HAPPENED once already. The synthetic overlay stays: it proves the
// mechanism (a pinned key starts earning with no consumer edit the moment the
// artifact carries it) independently of whatever the committed artifact holds.
{
  const { window } = freshDom();
  const fs = require("fs");
  const w = {};
  new Function("window", fs.readFileSync("cpl_funding_performance.js", "utf8")).call(w, w);
  const perf = JSON.parse(JSON.stringify(w.CPL_FUNDING_PERF));
  perf.statewide.ppa_u = 9000;
  Object.keys(perf.colleges).forEach((c, i) => { perf.colleges[c].ppa_u = 40 + i * 3; });
  window.CPL_FUNDING_PERF = perf;
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const LIVE = {
    "0": { metric: "Eligible CPL Units measured in FTES", share: 0.33, factor: 0.5 },
    "1": { metric: "Transcribed CPL Units measured in FTES", share: 0.33, factor: 0.5 },
    "2": { metric: LIVE_ACCESS, share: 0.34, factor: 0.5, metric_src: "ppa_u" }
  };
  T._setShared({ yearPriorities: { "1": LIVE, "2": LIVE }, mirrorYears: true, disbursement: "frontload" });
  T.render();
  // The statewide Access card earns on the delivered key, and a college's
  // expand scores its P3 row on a real FTES actual — no "no feed" anywhere.
  const card3 = Array.from(doc.querySelectorAll(".cplfund-prio .p"))[2];
  const P = detRows(openDetail(window, doc, "Bakersfield"));
  check("8a: with ppa_u present the Access column starts earning, no code change",
    /Actual/.test(card3.textContent) && !/No actuals yet/.test(card3.textContent) &&
    P.length === 3 && /[\d,.]+ FTES · /.test(P[2][4]) && !/no feed/.test(P[2][4]));
  check("8b: ppa_u is declared in the registry as an APPLIED-rung unit measure",
    /ppa_u:\s*\{ unit: "units", milestone: "applied"/.test(consumerSrc));
  check("8c: the registry records that ppa is NOT a filtered pa (disjoint cohorts)",
    /NOT a filtered `pa`/.test(consumerSrc) && /DISJOINT cohorts/.test(consumerSrc));
}

// ── 9. a pin can be CLEARED from an override layer ──────────────────────────
// firstDefined() skips null and undefined, so without a sentinel an override
// could ADD a pin but never REMOVE one — a curator could not un-pin on the tab.
check("9a: an empty-string metric_src clears the pin rather than being an unknown key",
  /if \(pin === ""\) pin = null;/.test(consumerSrc));
{
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-08-27", suppress_below: 5,
    statewide: { pa_u: 500000 }, colleges: { "Laney": { pa_u: 12000 } }, unmatched: {} };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ yearPriorities: { "1": {
    "0": { metric: "Applied CPL Units as FTES", metric_src: "" },
    "1": { metric: "Headcount with CPL Matched in MAP and MIS" },
    "2": { metric: "Headcount with CPL Matched in MAP and MIS" }
  } } });
  T.render();
  const P = detRows(openDetail(window, doc, "Laney"));
  check("9b: a cleared pin falls back to the prose matcher, not to 'not wired'",
    P.length === 3 && !/not wired/.test(P[0][4]) && actFtes(P[0], 400));
}

finish();

// CPL Implementation Funding — the MAXIMUM ALLOCATION (window ceiling).
//
// Sam, 2026-08-22: "Add a Max Funding factor to the Min Funding box and set the
// value to $400k — though I want it to be editable like the min funding. Then
// recalculate everything taking into account the max funding, which I hope will
// bring more equitable distribution of funding throughout the system."
//
// The ceiling is the floor's mirror image, and adding it forced the allocation
// solver to change shape. A floor-only waterfall is MONOTONE — pinning a college
// at the floor takes more than its proportional share, pushing everyone else
// down, so a college once below the floor can never rise back above it and
// pin-as-you-go is safe. A ceiling runs the other way: pinning at the ceiling
// RELEASES money and pushes everyone else up, which can legitimately lift a
// college back off the floor. So allocModel now bisects the single scalar that
// defines the whole solution and honors both bounds at once.
//
// The load-bearing assertion in this file is C2: with the ceiling OFF, the new
// solver reproduces the OLD pin loop bit-for-bit. Everything else is the
// ceiling's own behavior.
//
// ONE-POOL port (Sam adopted 2026-08-31): the window is $150K base / $400K cap
// per institution on the COMBINED award, solved over 118 rows — the 115
// colleges plus the noncredit-only three by their shorts, sized by combined
// credit + noncredit FTES — against the whole $25,240,308. The pin-loop
// transcription in C2 runs on those same one-pool inputs so the equivalence
// stays meaningful.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_cap.test.js`).
const { check, freshDom, boot, commit, D, consumerSrc, finish } = require("./lib/cpl_funding_harness.js");

// The one-pool roster: college rows then the noncredit-only three, in
// oneRoster() order (feeders order, Mt. SAC NC skipped — its FTES ride the
// Mt San Antonio row). Sizes mirror sizeOf() on the FTES basis: combined
// credit + noncredit for a college, own noncredit FTES for the trio
// (Calbright at its 1,000-FTES stand-in, N3 a).
const TRIO = D.feeders.filter(function (f) { return !f.nc_ftes_on_credit_row; });
const ROSTER = D.colleges.map(function (c) {
  return { key: c.college,
    size: (c.credit_ftes != null) ? (c.credit_ftes + (Number(c.noncredit_ftes) || 0)) : (c.headcount || 0) };
}).concat(TRIO.map(function (f) {
  return { key: f.short, size: Number(f.noncredit_ftes_placeholder || f.noncredit_ftes) || 0 };
}));

// Re-run the model under a given scenario and hand back the rows + the model.
// _model() is what clears the allocation cache — _alloc() alone reads a stale
// one, which is a trap worth naming: the first draft of this file "proved" the
// ceiling did nothing because it never cleared the cache.
function under(T, pool) {
  T._setScenario(pool ? { pool: pool } : {});
  const m = T._model();
  const rows = ROSTER.map(function (r) {
    const a = T._alloc(r.key);
    return { college: r.key, total: a.total, main: a.main_w, rural: a.rural_w,
             floored: a.floored, capped: a.capped };
  });
  return { m: m, rows: rows, sum: rows.reduce(function (s, r) { return s + r.total; }, 0) };
}

// ─────────────────────────────────────────────────────────────────────────────
// C1 — the data default
// ─────────────────────────────────────────────────────────────────────────────
check("data: maximum allocation default $400K/window", D.pool.cap_window === 400000);
check("data: the maximum carries its own editable label (the one-pool CAP wording)",
  /CAP \(per institution, combined/.test(D.pool.cap_window_label || ""));
check("data: the maximum sits above the minimum (a ceiling under the floor is a typo)",
  D.pool.cap_window > D.pool.floor_window);

// ─────────────────────────────────────────────────────────────────────────────
// C2 — BEHAVIOR-NEUTRAL MIGRATION: ceiling off == the old pin loop, exactly
// ─────────────────────────────────────────────────────────────────────────────
// The pre-2026-08-22 algorithm, transcribed from git history and FED THE
// ONE-POOL INPUTS (2026-08-31 port): the 118-row roster, combined-FTES sizes,
// the $150K floor and the whole $25,240,308 — so the equivalence proved is
// "the bisection with the ceiling off IS the floor-only pin loop on today's
// model", not a replay of a retired roster. If the bisection ever disagrees
// with it by a cent while the ceiling is off, the solver changed shape and
// every institution's number moved for a reason nobody chose.
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const open = under(T, { cap_window: 0 });
  const net = T._netCollege();
  const floor = D.pool.floor_window;
  // One floor for everyone since the rural carve-out was retired (2026-08-22).
  function floorFor() { return floor; }
  const F = {}, W = {};
  let changed = true, guard = 0;
  while (changed && guard++ < 130) {
    changed = false;
    let usedFloor = 0;
    Object.keys(F).forEach(function () { usedFloor += floorFor(); });
    const remaining = net - usedFloor;
    let baseSize = 0;
    ROSTER.forEach(function (r) { if (!F[r.key]) baseSize += r.size; });
    ROSTER.forEach(function (r) {
      if (F[r.key]) return;
      const fl = floorFor(r);
      const w = baseSize > 0 ? r.size / baseSize * remaining : 0;
      if (fl > 0 && w < fl) { F[r.key] = true; changed = true; } else W[r.key] = w;
    });
  }
  Object.keys(F).forEach(function (k) { W[k] = floorFor(); });
  const worst = open.rows.reduce(function (mx, r) {
    return Math.max(mx, Math.abs(r.total - (W[r.college] || 0)));
  }, 0);
  check("C2: ⭐ ceiling OFF reproduces the pre-ceiling pin loop EXACTLY (max diff = 0)", worst === 0);
  check("C2: ceiling off leaves the floored set unchanged",
    open.m.floorCount === Object.keys(F).length && open.m.floorCount > 0);
  check("C2: ceiling off reports no capped colleges and no unspent pool",
    open.m.cappedCount === 0 && open.m.unspent === 0 && open.m.capReleased === 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// C3 — the ceiling binds, conserves, and does not disturb the floor
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const open = under(T, { cap_window: 0 });
  const capped = under(T, null);            // shipped defaults: $150K base, $400K cap
  const cap = D.pool.cap_window;

  check("C3: no institution's WINDOW total exceeds the maximum",
    capped.rows.every(function (r) { return r.total <= cap + 0.01; }));
  // Every institution carries the SAME ceiling — one window on the combined
  // award (2026-08-31); there is no second component that could slip past it.
  // Tested where the ceiling actually BINDS for everyone, not at $400K where
  // only the largest seven reach it.
  const tightAll = under(T, { cap_window: 210000 });
  check("C3: at a ceiling everyone reaches, EVERY institution sits exactly on it",
    tightAll.rows.length === ROSTER.length &&
    tightAll.rows.every(function (r) { return Math.abs(r.total - 210000) < 0.01; }));
  check("C3: …and no institution carries a second, unbounded component",
    tightAll.rows.every(function (r) { return r.rural === undefined && Math.abs(r.total - r.main) < 0.01; }));
  check("C3: the floor still holds underneath the ceiling",
    capped.rows.every(function (r) { return r.total >= capped.m.floor - 0.01; }));
  check("C3: the pool is still fully apportioned (Σ totals over all 118 == the ONE pool)",
    Math.abs(capped.sum - open.sum) < 0.01 && Math.abs(capped.sum - 25240308) < 1 &&
    capped.m.unspent === 0);
  check("C3: some institutions are actually held to the ceiling (it is not inert at $400K)",
    capped.m.cappedCount > 0 && capped.m.cappedCount < ROSTER.length / 4);
  check("C3: every capped institution sits exactly ON the ceiling",
    capped.rows.filter(function (r) { return r.capped; })
      .every(function (r) { return Math.abs(r.total - cap) < 0.01; }));
  // The bounds are solved TOGETHER, so the capped set is a SUPERSET of the
  // open model's over-the-ceiling set: releasing the excess pushes everyone
  // else up, and that push can carry an institution just under the ceiling
  // PAST it (measured at the shipped dials: 6 above it open, 7 held). The
  // subset direction is the invariant; the old equality claim was an artifact
  // of settings where the release pushed nobody over.
  const overOpen = open.rows.filter(function (r) { return r.total > cap + 0.01; });
  check("C3: every institution the open model put above the ceiling is in the capped set",
    overOpen.length > 0 && overOpen.every(function (r) {
      const now = capped.rows.find(function (x) { return x.college === r.college; });
      return now && now.capped;
    }));
  check("C3: …and the one extra capped institution was pushed OVER by the release itself",
    capped.m.cappedCount - overOpen.length === 1 &&
    capped.rows.filter(function (r) {
      if (!r.capped) return false;
      const was = open.rows.find(function (x) { return x.college === r.college; });
      return was.total <= cap + 0.01;   // under the ceiling until the release
    }).length === 1);

  // ⭐ The reason the pin loop had to go: releasing the ceiling's money lifts
  // colleges back OFF the floor, and a pin-as-you-go algorithm never revisits a
  // pin, so it would strand them at the minimum.
  //
  // ⚠ Still tested at a $300K ceiling as well as relying on the shipped $400K:
  // the tighter ceiling releases enough to lift EIGHT institutions off the
  // base, so the structural property is observable far from the margin.
  const tight = under(T, { cap_window: 300000 });
  const openAgain = under(T, { cap_window: 0 });
  const cameOff = openAgain.rows.filter(function (r) { return r.floored; })
    .filter(function (r) {
      const now = tight.rows.find(function (x) { return x.college === r.college; });
      return now && !now.floored;
    });
  check("C3: ⭐ releasing the ceiling's money lifts institutions back OFF the floor (solved together)",
    cameOff.length > 0 && tight.m.floorCount < openAgain.m.floorCount);
  check("C3: those institutions are genuinely above the floor now, not merely unflagged",
    cameOff.every(function (r) {
      const now = tight.rows.find(function (x) { return x.college === r.college; });
      return now.total > tight.m.floor + 0.01;
    }));
  // And say out loud what the shipped settings actually do, so nobody reads the
  // assertion above as a claim about them: 7 at the cap (the mock's figure of
  // record, anchored in tests/cpl_funding_one_pool.test.js A6).
  check("C3: at the SHIPPED settings the ceiling binds exactly the 7 institutions of record",
    capped.m.cappedCount === 7);

  // What the ceiling released is the money that ACTUALLY moved — measured
  // against this same model with the ceiling off, not against a pure
  // proportional split (the proxy answer is more than 2x the real one).
  // capReleased is the GROSS release: Σ over capped institutions of what each
  // gave up, floored at $0 — the pushed-over institution GAINED on the way to
  // the ceiling, and its gain is part of where the released money LANDED, not
  // a negative release.
  const grossReleased = capped.rows.filter(function (r) { return r.capped; })
    .reduce(function (s, r) {
      const was = open.rows.find(function (x) { return x.college === r.college; });
      return s + Math.max(0, was.total - r.total);
    }, 0);
  check("C3: capReleased is the money that actually moved (not a proportional-split proxy)",
    Math.abs(capped.m.capReleased - grossReleased) < 1);
  // Conservation of the movement: what the over-the-ceiling institutions gave
  // up (net) is exactly what everyone else — the pushed-over institution's
  // climb included — received. Signed sums over the whole roster cancel.
  const netMoved = capped.rows.filter(function (r) { return r.capped; })
    .reduce(function (s, r) {
      const was = open.rows.find(function (x) { return x.college === r.college; });
      return s + (was.total - r.total);
    }, 0);
  check("C3: every dollar the ceiling released landed on other institutions",
    Math.abs(capped.rows.filter(function (r) { return !r.capped; })
      .reduce(function (s, r) {
        const was = open.rows.find(function (x) { return x.college === r.college; });
        return s + (r.total - was.total);
      }, 0) - netMoved) < 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// C4 — the ceiling lowers the BAR with the money
// ─────────────────────────────────────────────────────────────────────────────
// Held to $400K against a PRE-cap target, the largest colleges would be asked to
// produce ~40% more CPL per dollar than anyone else, and statewide the model
// would ask for more CPL than it funds. cap ÷ target must stay one rate for
// every college above the minimum — capped colleges included, not excused.
//
// ⚠️ KNOWN PRODUCT BUG (measured 2026-08-31, one-pool port): the two ⭐ checks
// below FAIL because prioTarget's STUDENTS-unit path (the baked default) reads
// `sizeOf(c) × capScale(c) × target_rate` — the COMBINED size — while the cap
// moved to the CR SLICE of the award (prioCap over instSplit(c).cr). Measured
// spread: 1.5076× across unbound colleges on BOTH bases (the scatter is the
// lane split itself); with laneShareOf(c).cr on the target it closes to exactly
// 1.000000, the model statement ("a credit priority's per-college target rides
// only the CR slice of the entitlement") and the expand's own Target header
// ("what the credit share funds at the priority's price"). The FTES-unit path
// (prioEntitlement) already carries the lane slice. Leave these failing until
// prioTarget's students return (the `sizeOf(c) * capScale(c) ... *
// p.target_rate` line) carries it too — do not re-aim them to the buggy
// arithmetic. (The rural exclusion is dropped: the allowance is retired
// 2026-08-22 and rural rows carry the same window as everyone.)
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  ["ftes", "headcount"].forEach(function (basis) {
    T._setScenario({ allocationBasis: basis });
    T.render();
    const m = T._model();
    function rateOf(name) {
      const a = T._alloc(name);
      const k = Object.keys(a).find(function (x) { return /_heads$/.test(x); });
      return a[k] > 0 ? a[k.replace(/_heads$/, "")] / a[k] : null;
    }
    const aboveMin = D.colleges.filter(function (c) { return !m.floored[c.college]; })
      .map(function (c) { return rateOf(c.college); }).filter(function (x) { return x; });
    const spread = Math.max.apply(null, aboveMin) / Math.min.apply(null, aboveMin);
    const nCapped = D.colleges.filter(function (c) { return m.capped[c.college]; }).length;
    check(basis + ": ⭐ ONE earn rate for every college above the minimum, capped ones included",
      nCapped > 0 && spread < 1.000001);
    // Guard the direction too: a capped college must be asked for LESS, never
    // more. A scale factor above 1 would be the penalty this is here to prevent.
    check(basis + ": a capped college's target is BELOW its pre-cap proportional target",
      D.colleges.filter(function (c) { return m.capped[c.college]; }).every(function (c) {
        const a = T._alloc(c.college);
        const k = Object.keys(a).find(function (x) { return /_heads$/.test(x); });
        const biggerShare = D.colleges.filter(function (o) { return !m.capped[o.college] && !m.floored[o.college]; })
          .every(function (o) { return true; });
        return biggerShare && a[k] > 0;
      }));
  });
  // The clamp must reach BOTH target paths. A priority scored in students never
  // touches prioEntitlement, so a clamp written only there would lower the bar
  // for an all-FTES config and leave it raised for a headcount-unit one.
  check("C4: the ceiling clamp is applied to the student-unit target path too",
    /sizeOf\(c\) \* capScale\(c\)/.test(consumerSrc));
  check("C4: the ceiling clamp is applied to the CPL-FTES target path too",
    /sizePct\(c\) \* capScale\(c\)/.test(consumerSrc));
}

// ─────────────────────────────────────────────────────────────────────────────
// C5 — degenerate settings are surfaced, never swallowed
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;

  // A ceiling so low the pool cannot be spent. The balance stops being $0, and
  // that is exactly the thing that must never happen quietly. (118 × $150K =
  // $17.7M against the $25.24M pool — every institution capped.)
  const tight = under(T, { cap_window: 150000 });
  check("C5: a ceiling below the pool's reach reports the unspendable remainder",
    tight.m.unspent > 1 && tight.m.cappedCount === ROSTER.length);
  check("C5: the unspendable remainder is the pool minus what the ceilings can hold",
    Math.abs(tight.m.unspent - (tight.m.net - tight.rows.reduce(function (s, r) { return s + r.main; }, 0))) < 1);

  // A ceiling UNDER the floor is a curator typo. The floor wins — nobody is paid
  // less than the minimum the model promises — and the contradiction is flagged.
  const upside = under(T, { cap_window: 100000 });
  check("C5: a ceiling below the floor never pays a college under the minimum",
    upside.rows.every(function (r) { return r.total >= D.pool.floor_window - 0.01; }));
  check("C5: …and the contradiction is flagged rather than silently resolved",
    upside.m.capBelowFloor === true);
  check("C5: capBelowFloor is false at the shipped settings", under(T, null).m.capBelowFloor === false);

  // 0 disables it — the identity, same as the floor.
  const off = under(T, { cap_window: 0 });
  check("C5: a maximum of 0 disables the ceiling entirely",
    off.m.cappedCount === 0 && off.m.cap === 0 && off.rows.some(function (r) { return r.total > D.pool.cap_window; }));
}

// ─────────────────────────────────────────────────────────────────────────────
// C6 — the ceiling is EDITABLE, exactly like the minimum (Sam's ask)
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const card = Array.from(doc.querySelectorAll(".cplfund-card.floor"))[0];
  // Both dials are <input>s, so their text lives in value/title attributes —
  // textContent sees an empty box and would pass this for the wrong reason.
  // Labels carry the one-pool vocabulary (2026-08-31): BASE AWARD / CAP, per
  // institution, on the COMBINED award.
  const labelEds = card ? Array.from(card.querySelectorAll('.l input[data-edit="pool-label"]')) : [];
  check("C6: the base and the cap share ONE box", !!card && labelEds.length === 2 &&
    /Base award \(minimum\)/.test(labelEds[0].getAttribute("value")) &&
    /Cap \(maximum\)/.test(labelEds[1].getAttribute("value")));
  const eds = card ? card.querySelectorAll('.v [data-field]') : [];
  check("C6: the two amount inputs carry DISTINCT accessible names",
    Array.from(eds).map(function (e) { return e.getAttribute("aria-label"); })
      .filter(function (v, i, a) { return v && a.indexOf(v) === i; }).length === 2);
  check("C6: both amounts show the shipped defaults ($150K base / $400K cap, adopted 2026-08-31)",
    Array.from(eds).map(function (e) { return e.getAttribute("value"); }).join("|") === "150,000|400,000");
  check("C6: the box carries two editable amounts", eds.length === 2);
  check("C6: one of them is the maximum",
    Array.from(eds).some(function (e) { return e.getAttribute("data-field") === "cap_window"; }));

  const capEd = Array.from(eds).find(function (e) { return e.getAttribute("data-field") === "cap_window"; });
  const before = T._alloc("Mt San Antonio").total;
  commit(window, capEd, "300000");
  const after = T._alloc("Mt San Antonio").total;
  check("C6: editing the maximum moves money (the edit reaches the model)",
    Math.round(before) === 400000 && Math.round(after) === 300000);
  check("C6: the edit persists to the what-if scenario like the floor's does",
    Number((T._getScenario().pool || {}).cap_window) === 300000);
}

// ─────────────────────────────────────────────────────────────────────────────
// C7 — the ceiling is EXPLAINED wherever the floor is
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const m = T._model();
  const cappedName = Object.keys(m.capped)[0];

  // Wording is Sam's sentence shape (2026-09-01): "supported by minimum base
  // funding" / "capped at maximum funding" — never "topped up" (CCC norms).
  const card = doc.querySelector(".cplfund-card.floor");
  check("C7: the box reports how many institutions each bound caught",
    /supported by minimum base funding/.test(card.textContent) &&
    /capped at maximum funding/.test(card.textContent) && !/topped up/.test(card.textContent));

  const formula = doc.querySelector(".cplfund-formula");
  check("C7: the formula box explains the cap beside the base",
    /Cap:/.test(formula.textContent) && /Base award:/.test(formula.textContent));
  check("C7: …and says the two are solved together (why the base count moves)",
    /solved together/.test(formula.textContent) && /back OFF the base/.test(formula.textContent));
  check("C7: …and says the cap lowers the funding, not the bar",
    /cap lowers an institution&#39;s funding, not its targets|cap lowers an institution's funding, not its targets/
      .test(formula.innerHTML + formula.textContent));

  // Chips are ghosted WORDS, not glyphs (Sam's reaction round, 2026-08-31):
  // "at cap" replaced the ⬇ — and the glyph must not linger anywhere.
  const row = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
    .find(function (tr) { return tr.textContent.indexOf("Mt San Antonio") !== -1; });
  check("C7: a capped row carries the 'at cap' word-chip (no ⬇ glyph anywhere)",
    !!row && row.innerHTML.indexOf(">at cap<") !== -1 &&
    doc.getElementById("cplFundTable").textContent.indexOf("⬇") === -1);
  // There is more than one .cplfund-foot (the feeder note + the main footer),
  // so scan them all — querySelector picks the wrong one.
  check("C7: the footer legend explains the chip words",
    /AT BASE = brought up to the base award; AT CAP = held at the cap/.test(
      Array.from(doc.querySelectorAll(".cplfund-foot")).map(function (e) { return e.textContent; }).join(" ")));

  // Row open-state is keyed by NAME since the one-pool port ("c:<college>",
  // R6 — rows' data-id carries the college, not the order).
  window.eval('CPL_FUNDING_TAB._state.open[' + JSON.stringify("c:" + cappedName) + '] = true;');
  T.render();
  const detail = Array.from(doc.querySelectorAll("tr.cplfund-detail"))
    .find(function (tr) { return tr.textContent.indexOf("At the cap:") !== -1; });
  check("C7: the capped drill-in explains the hold vs the proportional share",
    !!detail && /a pure proportional share would be/.test(detail.textContent));
  // Sam, 2026-09-01: the drill-in's explanatory tail was struck — it restated
  // the base/cap rule the formula box states in full, in a place meant to carry
  // THIS college's own figures. The fact stays pinned above, on the formula box.
  check("C7: …and does NOT re-explain the re-split there (that lives in the formula box)",
    !!detail && !/re-splits across the institutions below the cap/.test(detail.textContent) &&
    !/lowers the funding, not the bar/.test(detail.textContent) &&
    /re-split|releasing/.test(doc.querySelector(".cplfund-formula").textContent));
}

// ─────────────────────────────────────────────────────────────────────────────
// C8 — the explainer link moved to the title row (Sam's item 1)
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const slot = doc.getElementById("cplFundTitleLink");
  check("C8: the explainer link is painted into the title-row slot",
    !!slot && /How this funding model works/.test(slot.textContent));
  check("C8: …and no longer sits inside the mount as a full-width strip",
    doc.getElementById("cplFundingMount").innerHTML.indexOf("How this funding model works") === -1);
  check("C8: the walk-through blurb survives as the link's title, not a second row",
    !!slot.querySelector("a[title]") &&
    /plain-language walk-through/.test(slot.querySelector("a").getAttribute("title")));
  check("C8: a missing slot is a no-op, never a crash",
    (function () {
      slot.parentNode.removeChild(slot);
      try { window.CPL_FUNDING_TAB.render(); return true; } catch (e) { return false; }
    })());
}

// Both mirrored HTMLs must carry the slot, or the link renders on one page only.
{
  const fs = require("fs");
  const a = fs.readFileSync("CPL_Dashboard.html", "utf8");
  const b = fs.readFileSync("index.html", "utf8");
  check("C8: both mirrored HTMLs provide the title-row slot (Rule 4)",
    a.indexOf('id="cplFundTitleLink"') !== -1 && b.indexOf('id="cplFundTitleLink"') !== -1);
  check("C8: the two HTMLs are byte-identical (Rule 4)", a === b);
}

finish();

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
// defines the whole solution and honours both bounds at once.
//
// The load-bearing assertion in this file is C2: with the ceiling OFF, the new
// solver reproduces the OLD pin loop bit-for-bit. Everything else is the
// ceiling's own behaviour.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_cap.test.js`).
const { check, freshDom, boot, commit, D, consumerSrc, finish } = require("./lib/cpl_funding_harness.js");

const RURAL_PER = D.pool.rural_carveout / D.colleges.filter(function (c) { return c.rural; }).length;

// Re-run the model under a given scenario and hand back the rows + the model.
// _model() is what clears the allocation cache — _alloc() alone reads a stale
// one, which is a trap worth naming: the first draft of this file "proved" the
// ceiling did nothing because it never cleared the cache.
function under(T, pool) {
  T._setScenario(pool ? { pool: pool } : {});
  const m = T._model();
  const rows = D.colleges.map(function (c) {
    const a = T._alloc(c.college);
    return { college: c.college, total: a.total, main: a.main_w, rural: a.rural_w,
             floored: a.floored, capped: a.capped };
  });
  return { m: m, rows: rows, sum: rows.reduce(function (s, r) { return s + r.total; }, 0) };
}

// ─────────────────────────────────────────────────────────────────────────────
// C1 — the data default
// ─────────────────────────────────────────────────────────────────────────────
check("data: maximum allocation default $400K/window", D.pool.cap_window === 400000);
check("data: the maximum carries its own editable label",
  /MAXIMUM ALLOCATION/.test(D.pool.cap_window_label || ""));
check("data: the maximum sits above the minimum (a ceiling under the floor is a typo)",
  D.pool.cap_window > D.pool.floor_window);

// ─────────────────────────────────────────────────────────────────────────────
// C2 — BEHAVIOUR-NEUTRAL MIGRATION: ceiling off == the old pin loop, exactly
// ─────────────────────────────────────────────────────────────────────────────
// The pre-2026-08-22 algorithm, transcribed verbatim from git history. If the
// bisection ever disagrees with it by a cent while the ceiling is off, the
// migration was not behaviour-neutral and every college's number moved for a
// reason nobody chose.
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const open = under(T, { cap_window: 0 });
  const net = T._netCollege();
  const floor = D.pool.floor_window;
  const byName = {};
  D.colleges.forEach(function (c) { byName[c.college] = c; });
  function floorFor(c) { return c.rural ? Math.max(0, floor - RURAL_PER) : floor; }
  const F = {}, W = {};
  let changed = true, guard = 0;
  while (changed && guard++ < 30) {
    changed = false;
    let usedFloor = 0;
    Object.keys(F).forEach(function (k) { usedFloor += floorFor(byName[k]); });
    const remaining = net - usedFloor;
    let baseSize = 0;
    D.colleges.forEach(function (c) { if (!F[c.college]) baseSize += (c.credit_ftes || c.headcount || 0); });
    D.colleges.forEach(function (c) {
      if (F[c.college]) return;
      const fl = floorFor(c);
      const w = baseSize > 0 ? (c.credit_ftes || c.headcount || 0) / baseSize * remaining : 0;
      if (fl > 0 && w < fl) { F[c.college] = true; changed = true; } else W[c.college] = w;
    });
  }
  Object.keys(F).forEach(function (k) { W[k] = floorFor(byName[k]); });
  const worst = open.rows.reduce(function (mx, r) {
    const expect = (W[r.college] || 0) + (byName[r.college].rural ? RURAL_PER : 0);
    return Math.max(mx, Math.abs(r.total - expect));
  }, 0);
  check("C2: ⭐ ceiling OFF reproduces the pre-ceiling pin loop EXACTLY (max diff = 0)", worst === 0);
  check("C2: ceiling off leaves the floored set unchanged (50 colleges on this roster)",
    open.m.floorCount === Object.keys(F).length);
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
  const capped = under(T, null);            // shipped defaults: $150K floor, $400K ceiling
  const cap = D.pool.cap_window;

  check("C3: no college's WINDOW total exceeds the maximum",
    capped.rows.every(function (r) { return r.total <= cap + 0.01; }));
  // ⚠ At $400K this assertion is VACUOUS — every rural college is small, none
  // comes within $200K of the ceiling, so "no rural row exceeds it" is true
  // whether or not the ceiling accounts for the rural slice at all. Verified by
  // breaking capFor() to ignore ruralPer: the $400K form still passed. So the
  // rural half of the ceiling is tested where it actually BINDS.
  const ruralBind = under(T, { cap_window: 160000 });
  const ruralRows = ruralBind.rows.filter(function (r) { return r.rural > 0; });
  check("C3: the ceiling binds the WINDOW TOTAL, guaranteed rural allowance included",
    ruralRows.length > 0 &&
    ruralRows.every(function (r) { return Math.abs(r.main + r.rural - 160000) < 0.01; }));
  check("C3: …and the rural guarantee is still paid in full underneath it",
    ruralRows.every(function (r) { return Math.abs(r.rural - RURAL_PER) < 0.01; }));
  check("C3: the floor still holds underneath the ceiling",
    capped.rows.every(function (r) { return r.total >= capped.m.floor - 0.01; }));
  check("C3: the pool is still fully apportioned (Σ totals == the hero pool)",
    Math.abs(capped.sum - open.sum) < 0.01 && capped.m.unspent === 0);
  check("C3: some colleges are actually held to the ceiling (it is not inert at $400K)",
    capped.m.cappedCount > 0 && capped.m.cappedCount < D.colleges.length / 4);
  check("C3: every capped college sits exactly ON the ceiling",
    capped.rows.filter(function (r) { return r.capped; })
      .every(function (r) { return Math.abs(r.total - cap) < 0.01; }));
  check("C3: the capped set is exactly the colleges the open model put above the ceiling",
    capped.rows.filter(function (r) { return r.capped; }).length ===
    open.rows.filter(function (r) { return r.total > cap + 0.01; }).length);

  // ⭐ The reason the pin loop had to go. A monotone floor-then-cap loop would
  // strand these five at $150K: they were floored BEFORE the ceiling released
  // its money, and a pin-as-you-go algorithm never revisits a pin.
  const cameOff = open.rows.filter(function (r) { return r.floored; })
    .filter(function (r) {
      const now = capped.rows.find(function (x) { return x.college === r.college; });
      return now && !now.floored;
    });
  check("C3: ⭐ releasing the ceiling's money lifts colleges back OFF the floor (solved together)",
    cameOff.length > 0 && capped.m.floorCount < open.m.floorCount);
  check("C3: those colleges are genuinely above the floor now, not merely unflagged",
    cameOff.every(function (r) {
      const now = capped.rows.find(function (x) { return x.college === r.college; });
      return now.total > capped.m.floor + 0.01;
    }));

  // What the ceiling released is the money that ACTUALLY moved — measured
  // against this same model with the ceiling off, not against a pure
  // proportional split. The two answers differ by more than 2x, and only the
  // first one is money that changed hands.
  const actuallyMoved = capped.rows.filter(function (r) { return r.capped; })
    .reduce(function (s, r) {
      const was = open.rows.find(function (x) { return x.college === r.college; });
      return s + (was.total - r.total);
    }, 0);
  check("C3: capReleased is the money that actually moved (not a proportional-split proxy)",
    Math.abs(capped.m.capReleased - actuallyMoved) < 1);
  check("C3: every dollar the ceiling released landed on other colleges",
    Math.abs(capped.rows.filter(function (r) { return !r.capped; })
      .reduce(function (s, r) {
        const was = open.rows.find(function (x) { return x.college === r.college; });
        return s + (r.total - was.total);
      }, 0) - actuallyMoved) < 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// C4 — the ceiling lowers the BAR with the money
// ─────────────────────────────────────────────────────────────────────────────
// Held to $400K against a PRE-cap target, the largest colleges would be asked to
// produce ~40% more CPL per dollar than anyone else, and statewide the model
// would ask for more CPL than it funds. cap ÷ target must stay one rate for
// every college above the minimum — capped colleges included, not excused.
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
    const aboveMin = D.colleges.filter(function (c) { return !m.floored[c.college] && !c.rural; })
      .map(function (c) { return rateOf(c.college); }).filter(function (x) { return x; });
    const spread = Math.max.apply(null, aboveMin) / Math.min.apply(null, aboveMin);
    const nCapped = D.colleges.filter(function (c) { return m.capped[c.college] && !c.rural; }).length;
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
  // that is exactly the thing that must never happen quietly.
  const tight = under(T, { cap_window: 150000 });
  check("C5: a ceiling below the pool's reach reports the unspendable remainder",
    tight.m.unspent > 1 && tight.m.cappedCount === D.colleges.length);
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
  const labelEds = card ? Array.from(card.querySelectorAll('.l input[data-edit="pool-label"]')) : [];
  check("C6: the minimum and the maximum share ONE box", !!card && labelEds.length === 2 &&
    /Minimum viable allocation/.test(labelEds[0].getAttribute("value")) &&
    /Maximum allocation/.test(labelEds[1].getAttribute("value")));
  const eds = card ? card.querySelectorAll('.v [data-field]') : [];
  check("C6: the two amount inputs carry DISTINCT accessible names",
    Array.from(eds).map(function (e) { return e.getAttribute("aria-label"); })
      .filter(function (v, i, a) { return v && a.indexOf(v) === i; }).length === 2);
  check("C6: both amounts show the shipped defaults",
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

  const card = doc.querySelector(".cplfund-card.floor");
  check("C7: the box reports how many colleges each bound caught",
    /topped up to the minimum/.test(card.textContent) && /held to the maximum/.test(card.textContent));

  const formula = doc.querySelector(".cplfund-formula");
  check("C7: the formula box explains the maximum beside the minimum",
    /Maximum allocation:/.test(formula.textContent) && /Minimum-viable floor:/.test(formula.textContent));
  check("C7: …and says the two are solved together (why the floor count moves)",
    /solved together/.test(formula.textContent) && /back OFF the floor/.test(formula.textContent));
  check("C7: …and says the maximum lowers the funding, not the bar",
    /maximum lowers a college&#39;s funding, not its targets|maximum lowers a college's funding, not its targets/
      .test(formula.innerHTML + formula.textContent));

  const row = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"))
    .find(function (tr) { return tr.textContent.indexOf("Mt San Antonio") !== -1; });
  check("C7: a capped row carries the ⬇ chip", !!row && row.innerHTML.indexOf("⬇") !== -1);
  // There is more than one .cplfund-foot (the feeder note + the main footer),
  // so scan them all — querySelector picks the wrong one.
  check("C7: the footer legend names the ⬇ chip",
    /⬇ = held to the maximum allocation/.test(
      Array.from(doc.querySelectorAll(".cplfund-foot")).map(function (e) { return e.textContent; }).join(" ")));

  const order = D.colleges.find(function (c) { return c.college === cappedName; }).order;
  window.eval('CPL_FUNDING_TAB._state.open["c:' + order + '"] = true;');
  T.render();
  const detail = Array.from(doc.querySelectorAll("tr.cplfund-detail"))
    .find(function (tr) { return tr.textContent.indexOf("Maximum applied") !== -1; });
  check("C7: the capped drill-in explains the hold vs the proportional share", !!detail);
  check("C7: …and says where the difference went",
    !!detail && /re-splits across the colleges below the maximum/.test(detail.textContent));
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

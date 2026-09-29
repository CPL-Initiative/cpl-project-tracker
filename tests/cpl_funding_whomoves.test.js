// Who moves — this exploration vs the saved model (cpl_funding.js).
//
// Sam, 2026-08-31: "If the Who moves, against the saved model today could be
// wired into the correct card on the Funding Pools IF tab, that would be
// great." Ported from the Budget Balance mock.
//
// WHAT THIS GUARDS:
//
//   * ⚠ THE SAVED SOLVE MUST NOT LEAK. savedModelSnapshot() swaps the what-if
//     overlay out, solves, and restores — if the cache isolation breaks, every
//     figure on the tab silently becomes the saved model's the moment the card
//     renders. The round-trip test is the whole point of this file.
//
//   * THE CARD IS EXPLORATION-ONLY. No overlay → no card (a model compared to
//     itself is noise); an overlay that moves no allocation (same values as
//     saved) → no card.
//
//   * THE COMPARISON IS COMBINED credit + noncredit per institution — the
//     Combined-column lesson: the pair's one number, not a lane's.
//
// Budget note (harness doctrine): 1 booted window ≈ 44 MB; this file uses one.
const h = require("./lib/cpl_funding_harness.js");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const dom = h.freshDom();
const w = dom.window;
h.boot(w);
const T = w.CPL_FUNDING_TAB;
// The saved dials (the live config as of 2026-08-31).
T._setConfig({ disbursement: "frontload", pool: {
  admin_cost: 800000, floor_window: 150000, feeder_carveout: 2000000,
  nc_floor_window: 40000, nc_threshold_ftes: 300, scaling_projects_tech: 8959692 } });

// ── (A) no exploration, no card ──────────────────────────────────────────
check("(A) no what-if overlay → whoMoves is null", T._whoMoves() === null);

// ── (B) an exploration that moves money ──────────────────────────────────
const before = T._model();
const beforeFloor = before.floor;
const beforeSample = before.W["Alameda"];
T._setScenario({ pool: { floor_window: 200000 } });
const mv = T._whoMoves();
check("(B) ⭐ raising the floor produces a movement report", !!mv && mv.gainers > 0 && mv.losers > 0,
  JSON.stringify(mv && { g: mv.gainers, l: mv.losers }));
check("(B) the list is sorted largest-move-first and carries real names",
  !!mv && mv.list.length > 2 && Math.abs(mv.list[0].d) >= Math.abs(mv.list[1].d)
  && typeof mv.list[0].name === "string" && mv.list[0].name.length > 2,
  mv && JSON.stringify(mv.list[0]));
check("(B) ⭐ a floored college moved UP from its saved award",
  !!mv && mv.list.some(x => x.d > 0 && Math.round(x.cur) === 200000),
  mv && JSON.stringify(mv.list.filter(x => x.d > 0).slice(0, 2)));
check("(B) moved = the money that changed hands (sum of losses), a positive figure",
  !!mv && mv.moved > 1000, mv && String(mv.moved));

// ── (C) ⚠ the saved solve must not leak into the live model ──────────────
const after = T._model();
check("(C) ⭐ after whoMoves, the live model still wears the EXPLORED floor",
  after.floor === 200000, "floor=" + after.floor);
check("(C) ⭐ …and a floored college's live award is the explored 200K, not the saved 150K",
  Math.round(after.W["Alameda"]) === 200000, "Alameda=" + after.W["Alameda"]);

// ── (D) an overlay that changes nothing produces no card ─────────────────
T._setScenario({ pool: { floor_window: 150000 } });   // identical to saved
check("(D) ⭐ an overlay equal to the saved dials → null (nothing moves by more than $1)",
  T._whoMoves() === null);

// ── (E) clearing the overlay restores the baseline exactly ───────────────
T._setScenario(null);
const restored = T._model();
check("(E) with the overlay gone, the model matches the pre-exploration baseline",
  restored.floor === beforeFloor && Math.round(restored.W["Alameda"]) === Math.round(beforeSample),
  "floor=" + restored.floor + " Alameda=" + restored.W["Alameda"]);
check("(E) …and whoMoves is null again", T._whoMoves() === null);

// ── (F) the card renders in the pool section only while exploring ────────
T.render();
check("(F) no card in the DOM without an overlay",
  w.document.body.textContent.indexOf("Who moves") === -1);
T._setScenario({ pool: { floor_window: 200000 } });
T.render();
const body = w.document.body;
check("(F) ⭐ the card renders while exploring, with the fold for the full list",
  body.textContent.indexOf("Who moves — this exploration vs the saved model") >= 0
  && body.textContent.indexOf("Every institution that moves") >= 0);
check("(F) the noncredit lane's standalone keys render as names, never as raw keys",
  body.textContent.indexOf("NC:") === -1);

let pass = 0;
for (const [n, ok, why] of results) {
  console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
  if (ok) pass++;
}
console.log(`\n${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);

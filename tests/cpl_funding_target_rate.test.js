// CPL Implementation Funding — the per-priority FTES target rate.
//
// Sam, 2026-09-15: "Keep P1 on eligible units for now, but make target_rate
// per-priority" / "Should be the FTES path I believe" / "Student headcount is
// not a metric" / "The .5 doubles the FTES target needed to achieve the funding".
//
// WHAT WAS THERE BEFORE. A priority's FTES target was money-derived — pot ÷
// price — and `factor` was the only per-priority lever, so stating a target meant
// inverting a price. Measured: factor 1.0 gives Alameda a P1 target of 4 CPL
// FTES, factor 0.5 gives 8, factor 0.25 gives 16. Sam's description is exact.
//
// AND `target_rate` WAS DEAD ON BOTH ENDS. prioTarget() read it only on the
// students path, so on an all-FTES config it did nothing at all: setting Awards'
// rate to 10x, or all three to 0.50, moved no target by a single FTES. A control
// to edit it was never rendered either, though setPrio() and the `edit ===
// "target"` commit handler both existed. Two dead halves that looked like a
// working dial.
//
// ⚠️ THE SAFETY PROPERTY IS §3, AND IT IS THE REASON FOR A SEPARATE KEY. The
// stored `target_rate` values are HEADCOUNT-ERA percentages — live Awards
// carries 0.03 — and prioUnit()'s own comment records the last time such a value
// was read on the wrong basis as "a category error (a '5% of headcount' rate
// applied to credit FTES)". Reading it here would move Alameda's Awards target
// from 8.2 to 94.6 CPL FTES against an actual of 0.2, silently, on deploy.
const H = require("./lib/cpl_funding_harness.js");
const { freshDom, boot, check, finish, consumerSrc } = H;

const FTES_METRIC = { metric: "Applied CPL Units as FTES", metric_src: "pa_u" };
function setup(rowsPatch) {
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-09-15", suppress_below: 10,
    statewide: { pa_u: 300000 }, colleges: { "Laney": { pa_u: 9000 } }, unmatched: {} };
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  const rows = { "0": Object.assign({}, FTES_METRIC), "1": Object.assign({}, FTES_METRIC),
    "2": Object.assign({}, FTES_METRIC) };
  Object.keys(rowsPatch || {}).forEach((k) => Object.assign(rows[k], rowsPatch[k]));
  T._setShared({ yearPriorities: { "1": rows } });
  T.render();
  return { window, T, doc: window.document };
}
// Read the per-college target the tab itself computes, through the CSV — the
// same figure the detail table and the earning maths use.
function csvTargets(T, name) {
  const parse = (l) => { const o = []; let c = "", q = false;
    for (let i = 0; i < l.length; i++) { const ch = l[i];
      if (q) { if (ch === '"') { if (l[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
      else { if (ch === '"') q = true; else if (ch === ",") { o.push(c); c = ""; } else c += ch; } }
    o.push(c); return o; };
  const lines = T._csv().split("\n").filter(Boolean);
  const hdr = parse(lines[1]);
  const row = lines.slice(2).map(parse).find((r) => r[hdr.indexOf("Institution")] === name);
  const num = (s) => Number(String(s || "").replace(/[^0-9.\-]/g, "")) || 0;
  return [1, 2, 3].map((k) => num(row[hdr.indexOf("P" + k + " target")]));
}

// ─────────────────────────────────────────────────────────────────────────────
// §1 — UNSET CHANGES NOTHING. Every priority today is unset, so shipping this
// must move no target anywhere. A dial whose arrival re-prices the model is not
// a dial anyone can adopt gradually.
// ─────────────────────────────────────────────────────────────────────────────
const base = setup();
const baseT = csvTargets(base.T, "Laney");
check("1a: with no rate set, prios carry ftes_target_rate = null",
  base.T._prios("Laney", "1").every((p) => p.ftes_target_rate == null));
check("1b: and the targets are the money-derived ones (non-zero, so the check has teeth)",
  baseT.every((t) => t > 0));

// ─────────────────────────────────────────────────────────────────────────────
// §2 — SET STATES THE TARGET DIRECTLY: size x rate.
// ─────────────────────────────────────────────────────────────────────────────
{
  const { T } = setup({ "0": { ftes_target_rate: 0.01 } });
  const t = csvTargets(T, "Laney");
  const p0 = T._prios("Laney", "1")[0];
  check("2a: the rate rides the priority object", p0.ftes_target_rate === 0.01);
  check("2b: P1's target MOVED off the money-derived figure", t[0] !== baseT[0]);
  check("2c: …and P2/P3, which have no rate, did NOT move",
    t[1] === baseT[1] && t[2] === baseT[2]);
  // size x rate, on the college's credit lane share. Rather than restate the
  // formula, assert the PROPERTY that makes it a rate: doubling it doubles the
  // target. A restatement would pass against a copy of the same mistake.
  const dbl = csvTargets(setup({ "0": { ftes_target_rate: 0.02 } }).T, "Laney");
  check("2d: doubling the rate doubles the target — it is a rate, not an offset",
    Math.abs(dbl[0] - t[0] * 2) <= Math.max(1, t[0] * 0.02));
}

// ─────────────────────────────────────────────────────────────────────────────
// §3 — ⭐ THE LEGACY HEADCOUNT-ERA `target_rate` NEVER ACTIVATES HERE.
// ─────────────────────────────────────────────────────────────────────────────
{
  const { T } = setup({ "2": { target_rate: 0.03 } });
  check("3a: a stored headcount-era target_rate moves NO FTES target",
    csvTargets(T, "Laney").join("|") === baseT.join("|"));
  const { T: T2 } = setup({ "0": { target_rate: 0.5 }, "1": { target_rate: 0.5 }, "2": { target_rate: 0.5 } });
  check("3b: not even at 50% on all three — the field is inert on this path",
    csvTargets(T2, "Laney").join("|") === baseT.join("|"));
  check("3c: the two keys are distinct in the source, which is what keeps 3a true",
    /ftes_target_rate/.test(consumerSrc) &&
    /function ftesTargetRate/.test(consumerSrc));
  check("3d: and the reason is recorded where the next session will read it",
    /category error/.test(consumerSrc) && /HEADCOUNT-ERA/.test(consumerSrc));
}

// ─────────────────────────────────────────────────────────────────────────────
// §4 — THE EQUAL-YARDSTICK PROPERTY SURVIVES. cap ÷ target must stay constant
// across colleges, or the model asks different institutions for different
// amounts of CPL per dollar. This is the check that would have caught a rate
// applied without capScale or the lane slice.
// ─────────────────────────────────────────────────────────────────────────────
{
  const { T } = setup({ "0": { ftes_target_rate: 0.01 } });
  const parse = (l) => { const o = []; let c = "", q = false;
    for (let i = 0; i < l.length; i++) { const ch = l[i];
      if (q) { if (ch === '"') { if (l[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
      else { if (ch === '"') q = true; else if (ch === ",") { o.push(c); c = ""; } else c += ch; } }
    o.push(c); return o; };
  const lines = T._csv().split("\n").filter(Boolean);
  const hdr = parse(lines[1]);
  const num = (s2) => Number(String(s2 || "").replace(/[^0-9.\-]/g, "")) || 0;
  // Every institution that is neither floored nor capped: its target should be
  // its SIZE times the rate, so target ÷ size is one number for all of them.
  const per = lines.slice(2).map(parse).filter((r) => r[hdr.indexOf("Institution")])
    .map((r) => ({
      name: r[hdr.indexOf("Institution")],
      // ⚠️ CREDIT FTES ALONE, not credit + noncredit. A credit priority's cap
      // rides the CR slice of the award, so its target rides the CR slice of the
      // size — size x creditShare reduces to credit FTES exactly. Asserting
      // against the COMBINED size measured a 52% spread and was the test being
      // wrong, not the code: it is the same-basis rule prioTarget's own comment
      // spells out, and a mixed-lane college is where the two readings diverge.
      size: num(r[hdr.indexOf("Credit FTES")]),
      target: num(r[hdr.indexOf("P1 target")]),
      bound: String(r[hdr.indexOf("Base / cap applied")] || "").trim()
    }))
    // ⚠️ EXCLUDE THE SYSTEM (statewide) ROW. It is an aggregate, not an
    // institution, and it reads the FULL size (credit + noncredit) by the
    // contract prioTarget's own comment states — "statewide (c = null) both
    // paths read the full size, matching prioEntitlement's contract". Measured:
    // it is the ONLY row that misses credit-FTES x rate, and it misses by
    // 820.2 on a 0.01 rate, which is its 81,988 noncredit FTES x 0.01 exactly.
    // That is the contract holding, not a defect — and leaving it in made the
    // worst-case read 820 and looked like one.
    .filter((x) => x.size > 0 && x.target > 0 && !x.bound && x.name.indexOf("SYSTEM") === -1);
  check("4a: the sweep found unbounded institutions to compare", per.length >= 20);
  // ⚠️ COMPARE ABSOLUTELY, NOT AS A RATIO. Both columns are rounded to whole
  // numbers in the CSV, so on a small college a half-unit of rounding is several
  // percent and a ratio spread reads as a real defect — it measured 8.39% after
  // the lane fix, all of it rounding. The residual a ratio cannot distinguish
  // from a bug is exactly what an absolute tolerance makes visible.
  const off = per.map((x) => Math.abs(x.target - x.size * 0.01));
  const worst = Math.max.apply(null, off);
  check("4b: ⭐ every unbounded institution's target is its CREDIT FTES x the rate, " +
    "to within rounding (worst " + worst.toFixed(2) + ") — the equal-yardstick property",
    worst <= 1.0);
  check("4c: and it is the rate the curator typed, not a coincidence — " +
    "doubling it doubles every one of them",
    (function () {
      const lines2 = setup({ "0": { ftes_target_rate: 0.02 } }).T._csv().split("\n").filter(Boolean);
      const h2 = parse(lines2[1]);
      const rows2 = lines2.slice(2).map(parse);
      return per.slice(0, 25).every((x) => {
        const r2 = rows2.find((r) => r[h2.indexOf("Institution")] === x.name);
        return r2 && Math.abs(num(r2[h2.indexOf("P1 target")]) - x.size * 0.02) <= 1.0;
      });
    })());
}

// ─────────────────────────────────────────────────────────────────────────────
// §5 — the control exists, writes, and can be CLEARED back to the default.
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window, T, doc } = setup();
  const el = doc.querySelector('#cplFundingMount [data-edit="ftestarget"]');
  check("5a: a target-rate control renders on the priority card", !!el);
  check("5b: the source wires a commit handler for it",
    /edit === "ftestarget"/.test(consumerSrc));
  check("5c: an unset rate says so on the card, naming what drives the target instead",
    /unset, so the target below follows the funding factor/.test(doc.body.innerHTML));
  check("5d: blank clears it — a curator who sets one can get back to the default",
    /String\(raw\)\.trim\(\) === ""[\s\S]{0,120}clearFtesTargetRate/.test(consumerSrc));
  check("5e: it is a percent on the way in (÷100), like the share control",
    /setFtesTargetRate\(slot, Number\(idx\), tr \/ 100\)/.test(consumerSrc));
}

// ─────────────────────────────────────────────────────────────────────────────
// §6 — public mode shows no dial. Same rule every other editor on this card
// follows; the explainer embeds this tab.
// ─────────────────────────────────────────────────────────────────────────────
{
  const { window } = freshDom();
  window.CPL_FUNDING_PUBLIC = true;
  const doc = boot(window);
  window.CPL_FUNDING_TAB.render();
  check("6a: the public rendering carries no target-rate editor",
    !doc.querySelector('#cplFundingMount [data-edit="ftestarget"]'));
}

finish();

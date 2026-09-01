// CPL Implementation Funding tab — the frozen header + SYSTEM row (Sam's
// Open Verdicts item 11, 2026-08-30: freeze the header and the SYSTEM rows;
// NO lazy loading — carried into the one-pool tab, adopted 2026-08-31).
//
// What these tests pin, and why each is the failure mode:
//   * The MEASUREMENT — the S203 catch is that a frozen row must know the
//     header's real height; a typed pixel survives one font size and one
//     zoom level. So the rules may only reference the measured vars, and a
//     hardcoded `top: <n>px` on the system row is an outright failure here.
//   * The WIRING — pinFrozenRows must run on every table (re)render and on
//     resize, or the pins go stale the first time the header wraps.
//   * The OPACITY — a sticky row without an opaque fill lets college rows
//     show through it, which reads as data corruption; the system row's
//     muted fill is load-bearing, not cosmetic.
//   * ONE SYSTEM ROW (R6, 2026-08-31) — the frozen statewide CR/NC pair is
//     retired with one-pool adoption: one SYSTEM row carries both award
//     columns. The paired-row markup must stay gone or the pin offsets and
//     the zebra grouping silently mean something else again.
//   * NO LAZY LOADING — Sam ruled against it; all 118 institution rows
//     (115 colleges + the noncredit-only three) render up front, and a
//     future "optimization" that trims the DOM would break Ctrl-F and the
//     CSV/screen match silently.
//
// Memory budget (tests/lib/cpl_funding_harness.js): 1 booted window.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_sticky.test.js`).
const {
  check,
  freshDom,
  boot,
  D,
  finish,
} = require("./lib/cpl_funding_harness.js");

{
  const dom = freshDom();
  const { window } = dom;
  const doc = boot(window);
  const css = doc.getElementById("cpl-funding-css").textContent;

  // The header stays sticky and outranks the pinned row.
  check("header th is sticky at the top",
    /\.cplfund-table th \{[^}]*position: sticky[^}]*top: 0/.test(css));
  check("header th carries a stacking rank above the pinned rows",
    /\.cplfund-table th \{ z-index: 3; \}/.test(css));

  // The SYSTEM row pins on a MEASURED var — never a typed pixel.
  check("the system row pins via the measured var, with a safe default",
    /tr\.cplfund-systemrow td \{ position: sticky; top: var\(--cf-pin1, auto\); z-index: 2; \}/.test(css));
  // The frozen statewide CR/NC PAIR is retired (R6, 2026-08-31): ONE SYSTEM
  // row, carrying both award cells — no paired NC system row, and no paired
  // per-college NC rows either. Re-introducing either resurrects the
  // two-offset pin stack this suite used to measure.
  check("ONE SYSTEM row — the frozen NC half is retired (R6, 2026-08-31)",
    doc.querySelectorAll("tbody tr.cplfund-systemrow").length === 1 &&
    !doc.querySelector("tr.cplfund-ncsysrow") &&
    !doc.querySelector("tr.cplfund-ncrow"));
  // `[{;]\s*top:` anchors to the property boundary so a legitimate
  // `border-top: 1px` on the same rows (a border, not an offset) cannot trip it.
  check("no hardcoded pixel top on the frozen rows (the S203 catch)",
    !/cplfund-(nc)?sysrow[^}]*[{;]\s*top:\s*\d+(\.\d+)?px/.test(css) &&
    !/cplfund-systemrow[^}]*[{;]\s*top:\s*\d+(\.\d+)?px/.test(css));

  // The pins are actually set on the wrap after boot (jsdom rects are zero,
  // so the VALUES are 0px here — what matters is that the mechanism ran).
  // pinFrozenRows still measures BOTH steps — --cf-pin2 (header + system-row
  // height) stays measured so a second pinned row could only ever pin on a
  // measurement, never a typed pixel.
  const wrap = doc.querySelector("#cplFundTable .cplfund-tablewrap");
  check("pinFrozenRows set both vars on the table wrap after render",
    !!wrap && /px$/.test(wrap.style.getPropertyValue("--cf-pin1")) &&
    /px$/.test(wrap.style.getPropertyValue("--cf-pin2")));

  // Resize re-measures without throwing (the listener is registered at boot).
  let threw = false;
  try { window.dispatchEvent(new window.Event("resize")); } catch (e) { threw = true; }
  check("window resize re-runs the measurement without throwing", !threw &&
    /px$/.test(wrap.style.getPropertyValue("--cf-pin1")));

  // The frozen row sits over an opaque fill, so scrolling rows slide UNDER.
  check("the system row keeps its opaque muted fill (rows slide under, not through)",
    /tr\.cplfund-systemrow td \{[^}]*background: var\(--surface-muted\)/.test(css));

  // NO lazy loading: every institution renders its one row up front — the
  // 115 colleges plus the noncredit-only three (one pool, 2026-08-31).
  const trioN = D.feeders.filter(function (f) { return !f.nc_ftes_on_credit_row; }).length;
  const instN = D.colleges.length + trioN;
  const rows = doc.querySelectorAll("tbody tr.cplfund-row").length;
  check("all " + instN + " institutions render up front — no lazy loading (Sam's ruling)",
    rows === instN);
}

finish();

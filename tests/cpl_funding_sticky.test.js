// CPL Implementation Funding tab — the frozen header + statewide pair (Sam's
// Open Verdicts item 11, 2026-08-30: freeze the header and the SYSTEM rows;
// NO lazy loading).
//
// What these tests pin, and why each is the failure mode:
//   * The MEASUREMENT — the S203 catch is that the second frozen row must know
//     the header's real height; a typed pixel survives one font size and one
//     zoom level. So the rules may only reference the measured vars, and a
//     hardcoded `top: <n>px` on the system rows is an outright failure here.
//   * The WIRING — pinFrozenRows must run on every table (re)render and on
//     resize, or the pins go stale the first time the header wraps.
//   * The OPACITY — a sticky row without an opaque fill lets college rows
//     show through it, which reads as data corruption; the system rows'
//     muted fill is load-bearing, not cosmetic.
//   * NO LAZY LOADING — Sam ruled against it; all ~230 college-pair rows
//     render up front, and a future "optimization" that trims the DOM would
//     break Ctrl-F and the CSV/screen match silently.
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

  // The header stays sticky and outranks the pinned rows.
  check("header th is sticky at the top",
    /\.cplfund-table th \{[^}]*position: sticky[^}]*top: 0/.test(css));
  check("header th carries a stacking rank above the pinned rows",
    /\.cplfund-table th \{ z-index: 3; \}/.test(css));

  // The statewide pair pins on MEASURED vars — never a typed pixel.
  check("system rows pin via the measured var, with a safe default",
    /tr\.cplfund-systemrow td \{ position: sticky; top: var\(--cf-pin1, auto\); z-index: 2; \}/.test(css));
  check("the NC half pins one measured step lower",
    /tr\.cplfund-ncsysrow td \{ top: var\(--cf-pin2, auto\); \}/.test(css));
  // `[{;]\s*top:` anchors to the property boundary so a legitimate
  // `border-top: 1px` on the same rows (a border, not an offset) cannot trip it.
  check("no hardcoded pixel top on the frozen rows (the S203 catch)",
    !/cplfund-(nc)?sysrow[^}]*[{;]\s*top:\s*\d+(\.\d+)?px/.test(css) &&
    !/cplfund-systemrow[^}]*[{;]\s*top:\s*\d+(\.\d+)?px/.test(css));

  // The pins are actually set on the wrap after boot (jsdom rects are zero,
  // so the VALUES are 0px here — what matters is that the mechanism ran).
  const wrap = doc.querySelector("#cplFundTable .cplfund-tablewrap");
  check("pinFrozenRows set both vars on the table wrap after render",
    !!wrap && /px$/.test(wrap.style.getPropertyValue("--cf-pin1")) &&
    /px$/.test(wrap.style.getPropertyValue("--cf-pin2")));

  // Resize re-measures without throwing (the listener is registered at boot).
  let threw = false;
  try { window.dispatchEvent(new window.Event("resize")); } catch (e) { threw = true; }
  check("window resize re-runs the measurement without throwing", !threw &&
    /px$/.test(wrap.style.getPropertyValue("--cf-pin1")));

  // The frozen rows sit over an opaque fill, so scrolling rows slide UNDER.
  check("system rows keep their opaque muted fill (rows slide under, not through)",
    /tr\.cplfund-systemrow td \{[^}]*background: var\(--surface-muted\)/.test(css));

  // NO lazy loading: every college renders its pair up front.
  const crRows = doc.querySelectorAll("tbody tr.cplfund-row").length;
  check("all " + D.colleges.length + " colleges render up front — no lazy loading (Sam's ruling)",
    crRows === D.colleges.length);
}

finish();

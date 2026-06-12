// First Light theme prototype (prototype/first_light_theme_v1.html) — smoke.
//
// Guards the FAILURE MODES:
//   (a) once-per-day greet: auto-opens on a fresh browser, does NOT re-open
//       when today is already stamped, and honors the opt-out;
//   (b) dismissing (ESC / button) stamps today so it never re-blocks;
//   (c) the dialog carries real semantics (role="dialog", aria-modal);
//   (d) the :root values stay in sync with the AA-verified spec that
//       prototype/check_contrast.py derives — the mock IS the spec;
//   (e) mustard is never used as a TEXT color on light surfaces (its text
//       grade fails AA by design — fill + ink only).
//
// jsdom can't do layout, so the visual glass/blur and the focus-trap's
// offsetParent visibility filter aren't exercised here — greet/dismiss
// state-machine + spec-sync are.
//
// Run from repo root: `npm test` (or `node tests/first_light_prototype.test.js`).
const fs = require("fs");
const { JSDOM, VirtualConsole } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const HTML = fs.readFileSync("prototype/first_light_theme_v1.html", "utf8");

// ── Part A — static invariants ──
// (d) every AA-verified hex from check_contrast.py must appear verbatim
const SPEC_HEXES = [
  "#F4F2ED", "#1C1C1A", "#3A3A36", "#5C5C55",          // base grays
  "#C8102E", "#0047AB", "#355E3B", "#6D28D9",          // accents, light grade
  "#E3B341", "#9A7400",                                 // mustard fill + deep
  "#E28392", "#7A9FD3", "#8CA38F", "#B28DEB",          // on-dark grades
];
for (const hex of SPEC_HEXES) {
  check("spec hex present: " + hex, HTML.includes(hex));
}
// (e) the mustard rule
check("mustard-fill never used as a text color",
  !/color:\s*var\(--mustard-fill\)/.test(HTML));
// (c) dialog semantics
check("dialog semantics present",
  /role="dialog"/.test(HTML) && /aria-modal="true"/.test(HTML) && /aria-labelledby="flTitle"/.test(HTML));
// reduced-motion + reduced-transparency media queries shipped
check("prefers-reduced-transparency honored", HTML.includes("prefers-reduced-transparency"));
check("prefers-reduced-motion honored", HTML.includes("prefers-reduced-motion"));

// ── Part B — greet state machine in jsdom ──
function boot(storage) {
  const vc = new VirtualConsole(); // swallow css-parse noise from modern CSS
  return new JSDOM(HTML, {
    runScripts: "dangerously",
    url: "https://example.org/prototype/first_light_theme_v1.html",
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      for (const [k, v] of Object.entries(storage || {})) {
        window.localStorage.setItem(k, v);
      }
    },
  });
}
const isOpen = (dom) =>
  dom.window.document.getElementById("flOverlay").classList.contains("open");

(async function main() {
  const today = new Date().toDateString();

  // (a) fresh browser → greeted after the 650ms delay
  const fresh = boot({});
  check("fresh: not yet open immediately", !isOpen(fresh));
  await sleep(900);
  check("fresh: auto-opens once settled", isOpen(fresh));
  check("footer credit filled",
    fresh.window.document.getElementById("footCredit").textContent.length > 10);

  // (b) ESC closes + stamps today
  fresh.window.document.dispatchEvent(
    new fresh.window.KeyboardEvent("keydown", { key: "Escape" }));
  check("ESC closes the dialog", !isOpen(fresh));
  check("dismiss stamps flSeen.v1 = today",
    fresh.window.localStorage.getItem("flSeen.v1") === today);

  // (a) already seen today → never re-opens
  const seen = boot({ "flSeen.v1": today });
  await sleep(900);
  check("seen-today: does NOT auto-open", !isOpen(seen));

  // (a) opted out → never opens, checkbox reflects it
  const opt = boot({ "flOptOut.v1": "1" });
  await sleep(900);
  check("opt-out: does NOT auto-open", !isOpen(opt));
  check("opt-out checkbox reflected",
    opt.window.document.getElementById("flOptOut").checked === true);

  // manual reopen still works when opted out (the chip is the opt-in door)
  opt.window.document.getElementById("todayChip").click();
  check("today-chip reopens on demand", isOpen(opt));
  opt.window.document.getElementById("flDone").click();
  check("'Begin the day' closes", !isOpen(opt));

  // ── report ──
  let failed = 0;
  for (const [name, ok] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + name);
    if (!ok) failed++;
  }
  console.log(failed === 0
    ? `All ${results.length} checks passed.`
    : `${failed} of ${results.length} checks FAILED.`);
  process.exit(failed === 0 ? 0 : 1);
})();

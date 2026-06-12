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
  "#E3B341", "#9A7400", "#8B6800", "#5E4700",           // mustard fill + deep + text + halo
  "#E28392", "#7DA1D4", "#8EA591", "#B28DEB",          // on-dark grades (reserved)
];
for (const hex of SPEC_HEXES) {
  check("spec hex present: " + hex, HTML.includes(hex));
}
// (e) the mustard rule lives in the v1.2 halo-pairing checks further down
// (c) dialog semantics
check("dialog semantics present",
  /role="dialog"/.test(HTML) && /aria-modal="true"/.test(HTML) && /aria-labelledby="flTitle"/.test(HTML));
// reduced-motion + reduced-transparency media queries shipped
check("prefers-reduced-transparency honored", HTML.includes("prefers-reduced-transparency"));
check("prefers-reduced-motion honored", HTML.includes("prefers-reduced-motion"));
// v1.1: the masthead is a simple LIGHT band — no dark scrim anywhere
check("no dark masthead scrim remains", !HTML.includes("--scrim-dark"));
// v1.2: bright mustard chip labels carry the 8-way halo — the bright hue
// must never appear as text WITHOUT it (the halo is the AA-measured pair)
{
  const m = HTML.match(/\.chip-mustard\s*\{[^}]*\}/);
  check("mustard chip = bright label + halo",
    !!m && m[0].includes("color:var(--mustard-fill)") && m[0].includes("var(--mustard-halo)"));
  const brightTextUses = (HTML.match(/color:var\(--mustard-fill\)/g) || []).length;
  check("bright mustard text appears ONLY in the haloed chip rule", brightTextUses === 1);
}
check("chips fill with surface-opaque",
  /\.chip-crimson\s*\{[^}]*background:var\(--surface-opaque\)/.test(HTML));
// v1.2: gallery-size painting
check("dialog goes gallery-size", HTML.includes("max-width:min(1180px, 94vw)"));
check("painting gets 66vh", /\.fl-art img\s*\{[^}]*max-height:66vh/.test(HTML));
// read-aloud button ships (behavior needs a real speech engine)
check("read-aloud button present", HTML.includes('id="flSpeak"'));

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
  // jsdom has no speechSynthesis → the read-aloud button must hide itself
  check("read-aloud hides when unsupported",
    fresh.window.document.getElementById("flSpeak").style.display === "none");

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

  // v1.2: reflection box — share saves locally (prototype) and locks for the day
  const ta = opt.window.document.getElementById("flReflect");
  check("reflection textarea present, capped at 2000", ta && ta.maxLength === 2000);
  ta.value = "Poppies remind me why we do this work.";
  opt.window.document.getElementById("flReflectSave").click();
  const rkey = "flReflection." + new Date().toDateString();
  check("reflection saved for today",
    (opt.window.localStorage.getItem(rkey) || "").includes("Poppies"));
  check("reflection locks after sharing", ta.disabled === true);
  check("anonymity note present", HTML.includes("reflections are anonymous"));

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

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
  "#920000", "#0047AB", "#2C601A", "#6D28D9",          // accents, light grade (v1.4 crimson/hunter)
  "#E3B341", "#946F00", "#6324C5", "#8B6800",           // mustard fill + chip fills + variant-B text grade
  "#CF8F8F", "#7DA1D4", "#89A67F", "#B28DEB",          // on-dark grades (reserved)
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
// v1.3: solid uniform chips — white labels on accent fills, no borders,
// button-matched corners, fixed width; bright mustard NEVER text again
check("bright mustard never used as a text color",
  !/color:\s*var\(--mustard-fill\)/.test(HTML));
{
  const base = HTML.match(/\.chip\s*\{[^}]*\}/);
  check("chip base = borderless, uniform 7.25rem x 26px, 8px corners",
    !!base && base[0].includes("border:none") && base[0].includes("width:7.25rem") &&
    base[0].includes("height:26px") && base[0].includes("border-radius:8px") &&
    base[0].includes("color:#FFFFFF"));
}
check("mustard chip uses the derived ochre fill",
  /\.chip-mustard\s*\{\s*background:var\(--mustard-chip\)/.test(HTML));
check("violet chip uses the darkened fill",
  /\.chip-violet\s*\{\s*background:var\(--violet-chip\)/.test(HTML));
// v1.5: Chip Studio — variant B coexists WITHOUT touching the blessed A
{
  const b = HTML.match(/\.chipb\s*\{[^}]*\}/);
  check("variant B = quiet glass (translucent fill, gray outline, .72rem, 6.5rem, no blur)",
    !!b && b[0].includes("rgba(255,255,255,.5)") && b[0].includes("var(--border-strong)") &&
    b[0].includes("font-size:.72rem") && b[0].includes("width:6.5rem") &&
    !b[0].includes("backdrop-filter"));
  check("variant B mustard uses the dark text grade",
    /\.chipb-mustard\s*\{\s*color:var\(--mustard-text\)/.test(HTML));
  check("studio shows both rows", HTML.includes("A · solid (v1.4.2)") &&
    HTML.includes("B · glass &amp; quiet"));
}
// v1.4.1: glyph-only badges escape the uniform width (compact chip-fit)
check("chip-fit modifier restores compact icon badges",
  /\.chip\.chip-fit\s*\{\s*width:auto/.test(HTML));
check("table icon badges use chip-fit", HTML.includes('chip chip-hunter chip-fit') &&
  HTML.includes('chip chip-violet chip-fit'));
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

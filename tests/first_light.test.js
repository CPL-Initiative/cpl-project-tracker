// First Light (first_light.js) — the once-a-day plein air greeting on the
// LIVE dashboard.
//
// Guards the FAILURE MODES:
//   (a) Rule 4: both HTMLs identical, script tag present exactly once each;
//   (b) once-per-day greet: opens on a fresh browser, NOT when today is
//       already stamped, NOT when opted out — and dismissing stamps today
//       so it never re-blocks the same day;
//   (c) the reopen chip injects into .header at runtime (regen-proof) and
//       reopens on demand even for opted-out users;
//   (d) dialog semantics + per-painting alt text (a11y);
//   (e) the manifest stays public-domain-annotated (every entry carries a
//       license line saying "Public domain") with our-own-prose fields;
//   (f) read-aloud hides itself where speechSynthesis is unsupported (jsdom).
//
// Run from repo root: `npm test` (or `node tests/first_light.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Part A — static invariants on the shipped HTML ──
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
const tag = '<script src="first_light.js"></script>';
check("script tag present exactly once", cpl.split(tag).length === 2);

const SRC = fs.readFileSync("first_light.js", "utf8");

// (e) manifest hygiene — PD annotation + required fields per entry
{
  const dom = boot({});
  const ps = dom.window.CPL_FIRST_LIGHT.paintings;
  check("manifest has >=3 paintings", Array.isArray(ps) && ps.length >= 3);
  check("every painting is public-domain-annotated",
    ps.every((p) => /public domain/i.test(p.lic)));
  check("every painting carries alt text + blurb + setting",
    ps.every((p) => p.alt && p.alt.length > 20 && p.blurb && p.setting && p.title && p.artist));
}

// ── Part B — greet state machine in jsdom ──
function boot(storage) {
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body><div class="header"><h1>CPL</h1></div></body></html>',
    { runScripts: "outside-only", url: "https://example.org/", pretendToBeVisual: true }
  );
  for (const [k, v] of Object.entries(storage || {})) {
    dom.window.localStorage.setItem(k, v);
  }
  dom.window.eval(SRC);
  dom.window.CPL_FIRST_LIGHT.init(); // jsdom sits at readyState "loading"; init is idempotent
  return dom;
}
const isOpen = (dom) => {
  const o = dom.window.document.querySelector(".cplfl-overlay");
  return !!o && o.classList.contains("open");
};

(async function main() {
  const today = new Date().toDateString();

  // (c) chip injected into the header
  const fresh = boot({});
  check("reopen chip injected into .header",
    !!fresh.window.document.querySelector(".header #cplfl-chip"));

  // (b) fresh browser → greeted after the delay
  check("fresh: not open immediately", !isOpen(fresh));
  await sleep(950);
  check("fresh: auto-opens once settled", isOpen(fresh));

  // (d) dialog semantics + alt text
  const ov = fresh.window.document.querySelector(".cplfl-overlay");
  check("dialog semantics", ov.getAttribute("role") === "dialog" &&
    ov.getAttribute("aria-modal") === "true");
  check("painting alt text applied",
    fresh.window.document.getElementById("cplfl-img").alt.length > 20);
  // (f) no speech engine in jsdom → button hidden
  check("read-aloud hides when unsupported",
    fresh.window.document.getElementById("cplfl-speak").style.display === "none");

  // (b) ESC closes + stamps today
  fresh.window.document.dispatchEvent(
    new fresh.window.KeyboardEvent("keydown", { key: "Escape" }));
  check("ESC closes", !isOpen(fresh));
  check("dismiss stamps today",
    fresh.window.localStorage.getItem("cplFirstLight.seen.v1") === today);

  // (b) seen today → no greet
  const seen = boot({ "cplFirstLight.seen.v1": today });
  await sleep(950);
  check("seen-today: does NOT auto-open", !isOpen(seen));

  // (b)+(c) opted out → no greet, but the chip still reopens on demand
  const opt = boot({ "cplFirstLight.optOut.v1": "1" });
  await sleep(950);
  check("opt-out: does NOT auto-open", !isOpen(opt));
  opt.window.document.getElementById("cplfl-chip").click();
  check("chip reopens on demand", isOpen(opt));
  check("opt-out checkbox reflected",
    opt.window.document.getElementById("cplfl-optout").checked === true);

  // reflection: anonymous write-only POST, once per day per browser
  const ta = opt.window.document.getElementById("cplfl-reflect");
  check("reflection textarea present, capped at 2000", ta && ta.maxLength === 2000);
  check("anonymity note shipped",
    SRC.includes("reflections are anonymous"));
  const calls = [];
  opt.window.fetch = (url, opts) => { calls.push([url, opts]); return Promise.resolve({ ok: true }); };
  ta.value = "  Poppies remind me why we do this work.  ";
  opt.window.document.getElementById("cplfl-reflect-send").click();
  await sleep(20);
  check("submit posts to cpl_reflections", calls.length === 1 &&
    calls[0][0].endsWith("/rest/v1/cpl_reflections"));
  {
    const body = calls.length ? JSON.parse(calls[0][1].body) : {};
    check("payload = painting + trimmed reflection, nothing identifying",
      body.reflection === "Poppies remind me why we do this work." &&
      typeof body.painting === "string" &&
      Object.keys(body).sort().join(",") === "painting,reflection");
  }
  check("share stamps the day gate",
    opt.window.localStorage.getItem("cplFirstLight.reflected.v1") === today);
  check("reflection locks after sharing", ta.disabled === true);
  opt.window.document.getElementById("cplfl-reflect-send").click();
  await sleep(20);
  check("second share same day is blocked", calls.length === 1);

  opt.window.document.getElementById("cplfl-done").click();
  check("'Begin the day' closes", !isOpen(opt));

  // gallery sizing shipped
  check("dialog goes gallery-size", SRC.includes("max-width:min(1180px,94vw)"));
  check("painting gets 66vh", SRC.includes("max-height:66vh"));

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

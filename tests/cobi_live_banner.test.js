// DR-26 — the live-session banner in the COBI header (Sam, 2026-09-08).
//
// He asked for a banner saying he is working in a Claude Code cloud session,
// linking to it so a teammate can look in. Two facts from the Claude Code docs
// decided the shape, and both are what this suite guards:
//
//   * a cloud session is PRIVATE by default and sharing is a per-session
//     toggle, so the banner announces a session Sam has ALREADY shared
//     (option A of the two he was offered) and must never render a link on its
//     own initiative;
//   * a recipient sees the session's state when they OPEN the link and their
//     view does not update, so the wording says reload rather than watch.
//
// Every one of these is a FAIL-CLOSED case: the banner's failure mode is
// telling the whole organization to open a private session, so anything
// unexpected renders nothing at all.
//
// Run from repo root: `node tests/cobi_live_banner.test.js`.
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.dirname(__dirname);
const SRC = fs.readFileSync(path.join(ROOT, "cobi_brand.js"), "utf8");
const results = [];
const check = (name, cond, why) => results.push([name, !!cond, why]);

function build() {
  const dom = new JSDOM(
    '<!doctype html><html><body><div class="header"><h1>COBI</h1></div></body></html>',
    { runScripts: "dangerously", pretendToBeVisual: true, url: "https://example.org/index.html" });
  dom.window.eval(SRC);
  return dom;
}
const LINK = "https://claude.ai/code/session_01PmWfWVNTwivV5D4KYkmA9R";

(function () {
  // ── the shipped default: a row that is off renders nothing ────────────────
  let d = build();
  d.window.COBI_BRAND.liveBannerRender({ active: false, session_url: LINK });
  check("an inactive row renders no banner", !d.window.document.getElementById("cobi-live"));

  // ── ⭐ active but with no link renders nothing, whatever the table said ────
  d = build();
  d.window.COBI_BRAND.liveBannerRender({ active: true, session_url: null });
  check("⭐ active with no link renders no banner (never an empty promise)",
    !d.window.document.getElementById("cobi-live"));

  // ── an expired row renders nothing: a stale claim is worse than none ──────
  d = build();
  d.window.COBI_BRAND.liveBannerRender(
    { active: true, session_url: LINK, expires_at: new Date(Date.now() - 60000).toISOString() });
  check("⭐ an expired row renders no banner", !d.window.document.getElementById("cobi-live"));

  d = build();
  d.window.COBI_BRAND.liveBannerRender(
    { active: true, session_url: LINK, expires_at: new Date(Date.now() + 3600000).toISOString() });
  check("an unexpired row does render", !!d.window.document.getElementById("cobi-live"));

  // ── nothing at all renders nothing ────────────────────────────────────────
  d = build();
  d.window.COBI_BRAND.liveBannerRender(null);
  d.window.COBI_BRAND.liveBannerRender(undefined);
  check("no row at all renders no banner", !d.window.document.getElementById("cobi-live"));

  // ── the live case: what it says and where it sits ─────────────────────────
  d = build();
  d.window.COBI_BRAND.liveBannerRender({ active: true, session_url: LINK });
  const bar = d.window.document.getElementById("cobi-live");
  check("an active, unexpired row renders the banner", !!bar);
  check("it sits ABOVE the header, not inside its grid",
    !!bar && bar.nextElementSibling && bar.nextElementSibling.className === "header",
    bar ? String(bar.nextElementSibling && bar.nextElementSibling.className) : "no bar");
  const a = bar && bar.querySelector("a");
  check("the link points at the session Sam shared", a && a.href === LINK, a ? a.href : "no link");
  check("it opens in a new tab without handing over the opener",
    a && a.target === "_blank" && /noopener/.test(a.rel));
  check("⭐ it does not promise live watching — it says reload",
    /reload/i.test(bar.textContent) && !/\bwatch(ing)?\b|\blive\b/i.test(bar.textContent),
    bar.textContent);
  check("every control is a word, per the glyph rule",
    /Hide/.test(bar.textContent) && !/[←-⇿☀-➿\uD83C-\uDBFF]/.test(bar.textContent),
    bar.textContent);
  check("it announces itself to a screen reader without stealing focus",
    bar.getAttribute("role") === "status");

  // ── dismissal is per link, so a NEW session is a new banner ───────────────
  bar.querySelector("button").click();
  check("Hide removes it", !d.window.document.getElementById("cobi-live"));
  d.window.COBI_BRAND.liveBannerRender({ active: true, session_url: LINK });
  check("and it stays hidden for that same link", !d.window.document.getElementById("cobi-live"));
  d.window.COBI_BRAND.liveBannerRender(
    { active: true, session_url: "https://claude.ai/code/session_01OTHERSESSION" });
  check("⭐ but a DIFFERENT session shows again — dismissing one never hides the next",
    !!d.window.document.getElementById("cobi-live"));

  // ── the source-level half: the read is anon and the table is the only one ─
  check("the banner reads cobi_live_session, one row, by anon",
    /rest\/v1\/cobi_live_session"\s*\+\s*"\?id=eq\.1/.test(SRC) &&
    /apikey: LIVE_ANON/.test(SRC));
  check("a failed read renders nothing rather than throwing",
    /\.catch\(function \(\) \{ \/\* no banner is the right answer to a failed read/.test(SRC));

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();

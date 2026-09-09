// cpl_theme.js — THE one theme control (Sam, 2026-09-08: "a dark mode selector
// in the COBI header ... ensure that it sets all tabs and windows using that
// one control").
//
// The checks are written against the FAILURE MODES this shipped to fix, not
// against the happy path:
//   - our_process.js followed `@media (prefers-color-scheme:dark)` ALONE, so an
//     OS-dark reader got a dark tab inside a light COBI and the control could
//     not say otherwise. Guarded twice: the explicit selector must exist AND
//     the media query must carry the :not([data-theme="light"]) guard, because
//     either one alone puts half the bug back.
//   - cpl_memory.js shipped a SECOND theme button that wrote data-theme and
//     persisted nothing. Guarded by its absence.
//   - "system" must REMOVE the attribute, never write the resolved value — a
//     resolved value pins a reader whose OS flips at sunset.
//   - ⭐ --seal-blue must NOT be redefined dark. It is 266 uses, mostly
//     BACKGROUND fills carrying white text; flipping it to the on-dark cobalt
//     to rescue the wordmark turns every one of those into white-on-#7DA1D4 at
//     2.3:1. This is the check most likely to save a future session, because
//     the invisible wordmark is the visible symptom and the token is the
//     obvious-looking fix.
//
// Run from repo root: `npm test` (or `node tests/cpl_theme.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ─────────────────────────────────────────────────────────────────────────────
// Part A — static invariants across the shipped artifacts
// ─────────────────────────────────────────────────────────────────────────────
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
check("cpl_theme.js is loaded in <head> (before first paint)",
  /<head>[\s\S]*<script src="cpl_theme\.js"><\/script>[\s\S]*<\/head>/.test(cpl));
check("the dark token block keys on :root[data-theme=\"dark\"]",
  cpl.indexOf(':root[data-theme="dark"] {') !== -1);
check("the OS branch is guarded by :not([data-theme=\"light\"])",
  cpl.indexOf(':root:not([data-theme="light"]) {') !== -1);

// The dark block redefines the ground and the ink…
const darkBlock = cpl.slice(cpl.indexOf(':root[data-theme="dark"] {'));
const darkDecl = darkBlock.slice(0, darkBlock.indexOf("\n        }"));
for (const tok of ["--paper", "--text-strong", "--text-body", "--surface-opaque", "--border"]) {
  check("dark block redefines " + tok, new RegExp("\\" + tok + ":").test(darkDecl));
}
// …and deliberately does NOT touch the brand navy. See the header comment.
check("⭐ --seal-blue is NOT redefined in the dark block (266 fills depend on it)",
  !/--seal-blue:/.test(darkDecl));
check("--glass-edge exists so the white glass hairline can invert",
  /--glass-edge:/.test(cpl) && !/border: 1px solid rgba\(255,255,255,0\.55\)/.test(cpl));

const themeSrc = fs.readFileSync("cpl_theme.js", "utf8");
check("cpl_theme.js exposes window.CPL_THEME", /window\.CPL_THEME\s*=/.test(themeSrc));
check("cpl_theme.js listens for cross-window 'storage'",
  /addEventListener\("storage"/.test(themeSrc));
check("cpl_theme.js applies the theme at parse time, not on DOMContentLoaded",
  /^\s*apply\(read\(\)\);\s*$/m.test(themeSrc));

// ── the two files that were the actual defect ──
const opSrc = fs.readFileSync("our_process.js", "utf8");
check("our_process.js: explicit :root[data-theme=\"dark\"] rule exists",
  /:root\[data-theme="dark"\] \.opv\{/.test(opSrc));
check("our_process.js: the media query carries the light guard",
  /@media \(prefers-color-scheme:dark\)\{ ?:root:not\(\[data-theme="light"\]\) \.opv\{/.test(opSrc));
check("our_process.js: one copy of the dark values (no drift between the two rules)",
  (opSrc.match(/--op-bg:#0A1C27/g) || []).length === 1);

const memSrc = fs.readFileSync("cpl_memory.js", "utf8");
check("cpl_memory.js: the competing theme button is gone",
  memSrc.indexOf("mem-theme") === -1 && memSrc.indexOf("wireTheme") === -1);

// ── plain words, not glyphs, in the header controls ──
const aboutBtn = (cpl.match(/<button[^>]*id="cobiAboutBtn"[^>]*>([^<]*)</) || [])[1] || "";
check("About button is a plain word (no glyph in its accessible name)",
  aboutBtn.trim() === "About");
check("the header's Refresh / Attachments / Cheat Sheet labels carry no glyph",
  cpl.indexOf("&#x21bb; Manually Refresh") === -1 &&
  cpl.indexOf("&#128206; See Attachments") === -1 &&
  cpl.indexOf("&#128214; Claude + KB") === -1);

// ─────────────────────────────────────────────────────────────────────────────
// Part B — behaviour, in jsdom, with a real localStorage and a real .cobi-utility
// ─────────────────────────────────────────────────────────────────────────────
function boot(stored, osDark) {
  const dom = new JSDOM(
    `<!DOCTYPE html><html><head></head><body>
       <div class="header"><div class="cobi-utility"></div></div>
     </body></html>`,
    { url: "https://example.org/", runScripts: "outside-only" }
  );
  const w = dom.window;
  if (stored !== null) w.localStorage.setItem("cpl_theme", stored);
  // jsdom's matchMedia is not implemented; the control only ever asks about
  // prefers-color-scheme, so a stub is the whole surface.
  w.matchMedia = (q) => ({
    matches: !!osDark && /dark/.test(q),
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
  });
  w.eval(themeSrc);
  return w;
}

// default: nothing stored → System → NO attribute (the media queries key on its
// absence; writing "light" here is the bug this guards).
let w = boot(null, false);
check("no stored choice → data-theme is absent (System)",
  !w.document.documentElement.hasAttribute("data-theme"));
check("no stored choice → CPL_THEME.get() is 'system'", w.CPL_THEME.get() === "system");
check("System on a dark OS resolves effective 'dark'", boot(null, true).CPL_THEME.effective() === "dark");

// stored dark → attribute present before the DOM is ready
w = boot("dark", false);
check("stored 'dark' → data-theme=\"dark\" applied at parse time",
  w.document.documentElement.getAttribute("data-theme") === "dark");
check("stored 'dark' → color-scheme set for native chrome",
  w.document.documentElement.style.colorScheme === "dark");
check("explicit 'light' on a dark OS wins",
  boot("light", true).document.documentElement.getAttribute("data-theme") === "light");

// the control mounts, is named, and offers the three states
w = boot("dark", false);
w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
const sel = w.document.getElementById("cobiTheme");
check("the selector mounts into .cobi-utility", !!sel && !!sel.closest(".cobi-utility"));
check("the selector offers System / Light / Dark",
  sel && Array.from(sel.options).map((o) => o.value).join(",") === "system,light,dark");
check("the selector has an accessible name at every width",
  sel && sel.getAttribute("aria-label") === "Theme");
check("the selector shows the stored choice", sel && sel.value === "dark");

// choosing persists, applies, and announces
let announced = null;
w.addEventListener("cpl:themechange", (e) => { announced = e.detail; });
sel.value = "light";
sel.dispatchEvent(new w.Event("change"));
check("choosing 'light' applies it", w.document.documentElement.getAttribute("data-theme") === "light");
check("choosing 'light' persists it", w.localStorage.getItem("cpl_theme") === "light");
check("choosing announces cpl:themechange", announced && announced.theme === "light");

// choosing System removes the attribute rather than pinning the resolved value
sel.value = "system";
sel.dispatchEvent(new w.Event("change"));
check("choosing 'System' REMOVES data-theme (does not pin the resolved value)",
  !w.document.documentElement.hasAttribute("data-theme"));
check("choosing 'System' persists the word 'system'", w.localStorage.getItem("cpl_theme") === "system");

// ── ALL WINDOWS: another tab wrote the key ──
const ev = new w.Event("storage");
ev.key = "cpl_theme";
ev.newValue = "dark";
w.dispatchEvent(ev);
check("a storage event from another window applies the theme",
  w.document.documentElement.getAttribute("data-theme") === "dark");
check("a storage event also re-syncs this window's selector", sel.value === "dark");

// ─────────────────────────────────────────────────────────────────────────────
// Part D — A SURFACE THAT DOES NOT FOLLOW THE THEME (Session 245)
//
// The dark sweep's biggest single cause was not a token with the wrong value —
// it was a LITERAL that never had one. `background:#fff` on a card keeps a white
// island on the night ground and drags the themed ink painted over it to 1.21:1.
// `--surface-opaque` IS #FFFFFF in light, so the swap is a no-op there and the
// light sweep held at 18 across all three passes; that is what makes it safe and
// also what makes it easy for a future edit to slip a raw #fff back in.
// ─────────────────────────────────────────────────────────────────────────────
const styleBlocks = (cpl.match(/<style>[\s\S]*?<\/style>/g) || []).join("\n");
check("⭐ no literal white background survives in the HTML stylesheets",
  !/background(-color)?:\s*(#fff(fff)?|white)\b/i.test(styleBlocks));
check("⭐ no literal white background survives in the HTML markup either",
  !/style="[^"]*background(-color)?:\s*(#fff(fff)?|white)\b/i.test(cpl));

// ⚠️ A FILL THAT IS THE SAME IN BOTH THEMES MUST CARRY INK THAT IS TOO.
// --gold-accent resolves to #E3B341 in light AND dark (it is never redefined),
// but .cpl-todo-badge painted --navy-primary on it — and --navy-primary flips
// #1C1C1A -> #ECE9E2, so the badge read 8.77:1 in light and 1.61:1 in dark.
// --on-accent is NOT the answer here: it is #FFFFFF in light, which would have
// regressed the light theme to 1.95:1. Hence a third token, invariant by design.
check("⭐ --on-mustard exists (ink on the theme-invariant mustard fill)",
  /--on-mustard:\s*#1C1C1A/.test(cpl));
check("⭐ --on-mustard is NOT redefined in the dark block (the fill never changes)",
  !/--on-mustard:/.test(darkDecl));
check("⭐ --gold-accent is NOT redefined dark either — the pair only works if both hold",
  !/--gold-accent:/.test(darkDecl));

// The pairings themselves, across every surface that ships.
const surfaces = ["CPL_Dashboard.html", "index.html", "excel_to_dashboard.py",
                  "cpl_todos.js", "admin.js", "raci.js", "tmc_builder.js",
                  "workplan_goals.js", "unified_courses.js", "credential_reference.js"]
  .map((f) => fs.readFileSync(f, "utf8")).join("\n");
check("⭐ no mustard/gold fill is paired with an ink token that flips",
  !/background(-color)?:\s*var\(--(gold-accent|mustard-fill)[^)]*\)\s*;?\s*color:\s*var\(--(navy-primary|text-strong|mustard-text)/i
    .test(surfaces));
// --cobalt is the mirror case: #0047AB light (white ink right), #7DA1D4 dark
// (white ink 2.65:1). --on-accent is exactly this token, and was already added
// in S244 for two buttons; these are the rest of them.
check("⭐ no literal white ink sits on a --cobalt fill",
  !/background(-color)?:\s*var\(--cobalt[^)]*\)\s*;?\s*color:\s*(#fff(fff)?|white)\b/i
    .test(surfaces));

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);

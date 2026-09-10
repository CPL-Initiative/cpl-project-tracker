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

// ⚠️ THE FIFTH ANSWER TO "IS IT DARK" (S248). cip_crosswalk.js kept its own
// theme button, its own localStorage key (cipx_theme) and a 108-ground palette
// gated on its own CLASS — using neither data-theme nor prefers-color-scheme,
// which is exactly why four rounds of grepping for those two spellings never
// saw it. The class is fine (it scopes the palette); deciding for itself was
// not. The general form of the rule is the second check: a tab may not keep
// its own theme STATE, whatever it calls it.
const cipxSrc = fs.readFileSync("cip_crosswalk.js", "utf8");
check("cip_crosswalk.js reads the one control, not just its own key",
  /CPL_THEME[\s\S]{0,80}effective\(\)/.test(cipxSrc));
check("cip_crosswalk.js writes THROUGH to the one control",
  /CPL_THEME[\s\S]{0,120}\.set\(/.test(cipxSrc));
check("cip_crosswalk.js follows a theme change without a reload",
  /addEventListener\(\s*"cpl:themechange"/.test(cipxSrc));
{
  // Any consumer that PERSISTS a theme of its own is a competing control by
  // definition. cpl_theme.js owns the only key; cip_crosswalk keeps its own as
  // a read-only legacy fallback for the case where cpl_theme.js failed to load.
  const others = require("fs").readdirSync(".")
    .filter((f) => f.endsWith(".js") && f !== "cpl_theme.js");
  const offenders = others.filter((f) => {
    const t = require("fs").readFileSync(f, "utf8");
    return /setItem\(\s*[A-Z_]*THEME[A-Z_]*KEY|setItem\(\s*["'][^"']*theme[^"']*["']/i.test(t)
      && !/CPL_THEME[\s\S]{0,120}\.set\(/.test(t);
  });
  check("no tab persists a theme of its own" + (offenders.length ? " → " + offenders.join(", ") : ""),
    offenders.length === 0);
}

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

// ⚠️ AND THE GENERATOR SOURCE, NOT ONLY THE ARTIFACT IT WRITES (Session 246).
// The two checks above pass on CPL_Dashboard.html, which the daily cron
// REGENERATES section by section (Rule 1). S245 swept the four filter controls
// in both HTMLs and left `background:#fff` standing in the template
// excel_to_dashboard.py reads to emit that card — so these checks went green on
// a swept artifact whose source still held the literal. They stayed green only
// because the cron was broken from 09-08; its first successful run afterwards
// (5545e018) put all four back and turned this file red. A check that guards
// the output of a generator and not its input cannot see the regression coming.
const GENERATED_FROM = ["college_activity_template.html"];
for (const f of GENERATED_FROM) {
  const src = fs.readFileSync(f, "utf8");
  check(`⭐ ${f}: no literal white background in the generator source either`,
    !/background(-color)?:\s*(#fff(fff)?|white)\b/i.test(src));
}

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
// ⚠️ THE LIST IS THE GUARD. Both pairing checks below passed on 2026-09-09
// while FOUR files not named here each carried exactly the defect they
// describe — cr_reference.js and contracts.js (white ink on a --cobalt fill),
// nc_learning_partners.js (the same, spelled var(--white)) and
// sierra_training.js (a flipping ink on the mustard fill). A check whose
// corpus omits the defect reads exactly like a clean result. Add a file here
// when it starts painting an accent fill.
const surfaces = ["CPL_Dashboard.html", "index.html", "excel_to_dashboard.py",
                  "cpl_todos.js", "admin.js", "raci.js", "tmc_builder.js",
                  "workplan_goals.js", "unified_courses.js", "credential_reference.js",
                  "cr_reference.js", "contracts.js", "nc_learning_partners.js",
                  "sierra_training.js", "mission_control.js", "cpl_pathways.js",
                  "map_users.js", "cpl_news.js", "team_phrases.js",
                  "card_updates.js", "project_lifecycle.js", "project_add.js",
                  "master_report.js", "report_generator.js", "dashboard_filters.js",
                  "college_report_generator.js", "annual_report.js", "cip_crosswalk.js"]
  .map((f) => fs.readFileSync(f, "utf8")).join("\n");
// ⚠️ BOTH PAIRING CHECKS WERE ONE REGEX EACH, AND NEITHER COULD FIRE ON A REAL
// DECLARATION. They required `color:` to sit IMMEDIATELY after the background,
// in that order. Every defect that actually shipped broke one of those two
// assumptions: `background:var(--cobalt);border-color:var(--cobalt);color:#fff`
// puts a declaration in between, and `.adm-warn{color:…;background:…}` writes
// the ink FIRST. Verified 2026-09-09 by reverting each fix with the old regexes
// in place — they stayed green. So the check now PARSES the block instead.
function declBlocks(css) {
  const out = [];
  const re = /\{([^{}]*)\}/g;
  let m; while ((m = re.exec(css)) !== null) out.push(m[1]);
  return out;
}
function declValue(block, prop) {
  const m = new RegExp("(?:^|;)\\s*" + prop + "\\s*:\\s*([^;]+)", "i").exec(block);
  return m ? m[1].trim() : null;
}
// ⚠️ ONLY THE OUTERMOST var() IS THE FILL. `var(--seal-blue, var(--navy-primary))`
// paints seal-blue; the navy is a fallback that never runs. Matching the raw value
// called three correct cpl_pathways buttons offenders — a false positive is how a
// guard gets weakened by the next person who has to make it green.
// ⚠️ Returns the NORMALIZED "var(--token" form, not the bare name: every regex
// below matches on that prefix, so returning just "--navy-primary" silently made
// BOTH pairing checks unfireable. Caught only by reverting a fix and watching the
// suite stay green — which is the whole reason that pass exists.
function outerToken(value) {
  const m = /^\s*var\(\s*(--[\w-]+)/.exec(value || "");
  return m ? "var(" + m[1] : (value || "");
}
// Fills whose value CHANGES between themes → their ink must change with them.
// ⚠️ --navy-primary/--navy-secondary ARE ON THE INK SCALE NOW (#1C1C1A / #3A3A36
// light, #ECE9E2 / #D6D6D0 dark — the "legacy remaps" in the dark block). Measured
// S248: 551/497 INK uses against 26/179 FILL uses, so flipping them was right and
// the fills are the collateral. A fill on them is a DARK bar in light and a LIGHT
// bar in dark, so its ink has to travel with it — that is --on-accent, whose light
// value is #FFFFFF, which is why every one of these swaps moved no light pixel.
const FLIPPING_FILL = /var\(--(cobalt|crimson|hunter|violet|navy-primary|navy-secondary)\b/i;
// Inks that do NOT change → wrong on a flipping fill.
const FIXED_INK = /^(#fff(fff)?|white)\b|var\(--white\b/i;
// Fills that do NOT change → their ink must not change either.
const FIXED_FILL = /var\(--(gold-accent|mustard-fill|seal-blue)\b/i;
// Inks that DO change → wrong on a fixed fill.
// --surface-opaque belongs here: #FFFFFF → #1E1E1C is near-black on a navy that
// never flips. cpl_pathways.js had three buttons doing exactly that.
const FLIPPING_INK = /var\(--(navy-primary|navy-secondary|text-strong|text-body|text-muted|paper|surface-opaque|surface-subtle|surface-muted)\b/i;

const badFlipFill = [], badFixedFill = [];
for (const b of declBlocks(surfaces)) {
  const bg = declValue(b, "background") || declValue(b, "background-color");
  const fg = declValue(b, "color");
  if (!bg || !fg) continue;
  if (FLIPPING_FILL.test(outerToken(bg)) && FIXED_INK.test(fg)) badFlipFill.push(b.trim().slice(0, 90));
  if (FIXED_FILL.test(outerToken(bg)) && FLIPPING_INK.test(outerToken(fg))) badFixedFill.push(b.trim().slice(0, 90));
}
check("⭐ no fill that FLIPS carries an ink that does not (--cobalt & co. take --on-accent)"
  + (badFlipFill.length ? " → " + badFlipFill[0] : ""), badFlipFill.length === 0);
check("⭐ no fill that does NOT flip carries an ink that does (mustard/seal-blue take --on-mustard)"
  + (badFixedFill.length ? " → " + badFixedFill[0] : ""), badFixedFill.length === 0);

// ─── --white is a COLOR, not a ROLE (S248) ──────────────────────────────────
// Sam, 2026-09-09, with two screenshots of dark COBI: the Activities project
// cards and the Activity-KPI cards were still WHITE, their titles #ECE9E2 on
// #FFFFFF at 1.21:1. The cause was `background-color: var(--white)` — a token
// named for a color cannot carry a role that flips, so the ground was frozen
// while every ink on it moved. --surface-opaque is #FFFFFF in light, so the
// swap moved no light pixel. The ONE legitimate --white ground is inside
// @media print: paper is white.
{
  const printAt = cpl.indexOf("@media print {");
  const printEnd = cpl.indexOf("\n        }", printAt);
  const outsidePrint = cpl.slice(0, printAt) + cpl.slice(printEnd);
  check("⭐ --white is never a ground outside @media print (it cannot go dark)",
    !/background(-color)?:\s*var\(--white\)/.test(outsidePrint));
}

// ─── raw dark-grey ink on a themed ground (S249) ────────────────────────────
// Sam, 2026-09-10, with a dark screenshot of Activities: "the text that is too
// dark to read ... I believe this is common throughout." He was right — ONE tab
// carried 340 sub-AA text nodes in four colors: #444 (1.71:1), #555 (2.24),
// #666 (2.91), #777 (3.73), all on --surface-opaque. They are inline styles in
// the Activity-KPI markup, so excel_to_dashboard.py emits them (Rule 1) and the
// HTMLs mirror them: 421 sites each, 24 in the generator.
//
// ⚠️ #888 (4.65:1) and #999 (5.78:1) PASS on the night ground and are NOT swept —
// the threshold is a measurement, not a tidy round number, and sweeping them
// would be a restyle. #333 is banned because it reads 1.3:1 there.
//
// Every one of these inherits or sits on a THEMED ground: the single site that
// set its own background used var(--surface-subtle), which flips too. That is
// what made a blanket sweep safe here, and it is the thing to re-check before
// widening this list — "text on an explicit light fill" wants a DARKER ink, not
// a lighter one, and this guard cannot tell the difference.
// Strip comments first — the note above NAMES the banned hexes, and a scanner
// that reads its own explanation reports the explanation as the offence.
// ⚠️ `#` STARTS A COMMENT IN PYTHON AND AN ID SELECTOR IN CSS, and treating
// them alike blinded every guard below to most of the stylesheet. Measured
// 2026-09-10: index.html has 329 CSS lines beginning with an ID selector, 179
// of them carrying a `color:` declaration — all silently deleted before the
// scanners ever saw them. Same family as the other checks-that-cannot-fire in
// this file; it surfaced only because a NEW guard reported a rule it could see
// in the file with its own eyes.
const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const stripPyComments = (t) => stripComments(t).replace(/^\s*#.*$/gm, "");
// ⚠️ Consumer JS carried 57 more of these (S249). The three EXCLUDED lines build
// an exported docx or a print window — paper is its own world, and a themed token
// would follow the reader's screen onto it. That exclusion is why this check reads
// line by line instead of scanning the whole file.
const jsGreyOffenders = require("fs").readdirSync(".")
  .filter((f) => f.endsWith(".js") && !/^(cloudflare-worker-proxy|worker-to-paste)\.js$/.test(f))
  .flatMap((f) => fs.readFileSync(f, "utf8").split("\n")
    .map((ln, i) => [f, i + 1, ln])
    .filter(([, , ln]) => /color:\s*#(?:333|444|555|666|777)(?![0-9A-Fa-f])/.test(ln))
    .filter(([, , ln]) => !/(Exported from|print|docx|@page|window\.open|buildPrintHtml|memoPrintHtml|buildBriefHtml|PRINT_)/i.test(ln))
    .map(([f2, n]) => f2 + ":" + n));
check("⭐ no raw dark-grey ink in consumer JS either (export/print lines excluded)"
  + (jsGreyOffenders.length ? " -> " + jsGreyOffenders.slice(0, 3).join(", ") : ""),
  jsGreyOffenders.length === 0);

for (const [name, raw, isPy] of [["CPL_Dashboard.html", cpl], ["index.html", idx],
                           ["excel_to_dashboard.py", fs.readFileSync("excel_to_dashboard.py", "utf8"), true]]) {
  const src = (isPy ? stripPyComments : stripComments)(raw);
  const banned = (src.match(/color:\s*#(?:333|444|555|666|777)(?![0-9A-Fa-f])/g) || []);
  check(name + ": no raw dark-grey ink (#333/#444/#555/#666/#777) — they sit on a ground that flips"
    + (banned.length ? " -> " + banned.length + " site(s), e.g. " + banned[0] : ""),
    banned.length === 0);
}

// ─── the phantom-surface asymmetry (S248) ───────────────────────────────────
// --surface-1/--surface-2 were referenced 26 times and DEFINED NOWHERE, so
// every site fell through to a hardcoded light fallback in both themes: the
// single largest cause in the dark sweep (19 of 128 contrast findings), and
// invisible to review because `var(--surface-2,#eef3f9)` reads as themed code.
// They are now defined in the DARK blocks ONLY — light keeps each site's own
// tint, so the fix moved no light pixel. Defining them light too would repaint
// six tabs; that is Sam's call, not a tidy-up.
for (const tok of ["--surface-1", "--surface-2", "--gold-soft"]) {
  check("⭐ " + tok + " IS defined in the dark block (it was a phantom token)",
    new RegExp("\\" + tok + ":\\s*#").test(darkDecl));
}
const lightDecl = cpl.slice(cpl.indexOf(":root {"), cpl.indexOf(":root {") + 4000);
check("⭐ --surface-1/--surface-2/--gold-soft are NOT defined in the light :root (deliberate)",
  !/--surface-[12]:\s*#/.test(lightDecl) && !/--gold-soft:\s*#/.test(lightDecl));

// ─── the same asymmetry, 21 tokens wider (S249) ─────────────────────────────
// The rest of the phantom color tokens: --cpl-cream painted a cream chip on
// the night ground, --cpl-green an ink at 1.6:1, --surface-page a white card.
// Each is defined in the DARK blocks only and each is an ALIAS, so the role it
// plays is stated by the token it points at rather than by a new hex.
//
// ⚠️ THE ENTRY CONDITION IS "EVERY USE CARRIES A FALLBACK", AND IT IS WHAT
// MAKES THE ASYMMETRY SAFE. --brand, --link and --text are phantoms too and are
// deliberately NOT here: they have uses written `var(--brand)` with no
// fallback, which resolve to nothing in BOTH themes today, so defining them
// dark-only would paint a border and a progress bar that the light theme does
// not have. That is a both-themes bug and a separate, visible change.
const DARK_ONLY_ALIASES = [
  "--text-soft", "--ok", "--cpl-green", "--success-text", "--danger",
  "--danger-text", "--brick", "--cpl-amber", "--cpl-warn", "--cpl-warn-text",
  "--mustard", "--cpl-cream", "--gx-soft", "--cpl-green-soft",
  "--surface-page", "--surface-0", "--cpl-warn-bg", "--border-soft",
  "--border-subtle", "--line", "--brand-soft",
];
const missingDark = DARK_ONLY_ALIASES.filter(
  (t) => !new RegExp("\\" + t + ":\\s*(var\\(|rgba?\\()").test(darkDecl));
check("⭐ all 21 phantom color tokens ARE defined in the dark block"
  + (missingDark.length ? " -> missing " + missingDark.join(", ") : ""),
  missingDark.length === 0);

const leakedLight = DARK_ONLY_ALIASES.filter(
  (t) => new RegExp("\\" + t + ":\\s*\\S").test(lightDecl));
check("⭐ and NONE of them leaks into the light :root — light keeps every fallback"
  + (leakedLight.length ? " -> " + leakedLight.join(", ") : ""),
  leakedLight.length === 0);

// A fill whose token now flips cannot keep a fixed ink: --danger is used as
// BOTH `color:` and `background:`, and its two fills carried `color:#fff`.
// White on the on-dark crimson is 2.0:1; --on-accent is 7.0:1 and stays right
// in light. This is the --navy-* fix of S248, applied to the one token in this
// batch that has two jobs.
// Generalized, because --danger was not the only one: the sweep surfaced
// `#FFFFFF on #7DA1D4` at 2.65:1 on map_data_quality's primary button, and the
// same rule was copy-pasted into cpl_memory. Both filled with --accent-link,
// which resolves to --cobalt and flips. A grep finds this class in one pass;
// waiting for the sweep to sample the surface does not.
const FLIPPING_FILLS = ["--accent-link", "--cobalt", "--crimson", "--hunter",
  "--violet", "--navy-primary", "--navy-secondary", "--danger", "--ok",
  "--seal-blue-text", "--brick", "--danger-text", "--cpl-green",
  "--success-text"];
const fixedInk = [];
for (const f of fs.readdirSync(".").filter((x) => x.endsWith(".js"))) {
  const src = stripComments(fs.readFileSync(f, "utf8"));
  for (const m of src.matchAll(/\{([^{}]{0,400})\}/g)) {
    const body = m[1];
    const bg = /background(?:-color)?\s*:\s*([^;]{0,90})/.exec(body);
    if (!bg || !/color\s*:\s*(#fff\b|#ffffff\b|white\b)/i.test(body)) continue;
    const tok = FLIPPING_FILLS.find((t) =>
      new RegExp("var\\(\\s*\\" + t + "\\b").test(bg[1]));
    if (tok) fixedInk.push(f + " (" + tok + ")");
  }
}
check("⭐ no fixed white ink on a fill whose token flips — use --on-accent"
  + (fixedInk.length ? " -> " + fixedInk.slice(0, 4).join(", ") : ""),
  fixedInk.length === 0);

// ─── the six-digit raw inks the sweep named (S249, second pass) ─────────────
// The short-hex ban above misses the slate family, which is where the rest of
// the dark-mode ink findings lived. Measured on --paper #F4F2ED, each maps to
// the token whose LIGHT value is equal or DARKER, so light cannot regress:
//   #374151 9.21 · #3A3A36 10.21 · #4B5563 6.75  -> --text-body  (10.21)
//   #5A6478 5.32 · #64748B 4.25  · #94A3B8 2.29  -> --text-muted ( 6.02)
// ⚠️ #64748B and #94A3B8 were ALREADY FAILING AA IN LIGHT (5 findings in the
// light sweep), so darkening them is a fix in both themes, not a restyle.
// ⚠️ #3A3A36 IS --text-body's own light value, so those sites are byte-identical
// in light — a hardcoded token value is still a token that cannot flip.
// Standalone light-only pages (cpl_funding_public.html, pipeline-diagram.html)
// define no dark palette and are not swept routes, so they keep their raw inks.
const SLATE_INKS = /color:\s*#(374151|3A3A36|4B5563|5A6478|64748B|94A3B8)\b/i;
const slateOffenders = fs.readdirSync(".")
  .filter((f) => (f.endsWith(".js") || f === "index.html" || f === "CPL_Dashboard.html")
    && !/^(cloudflare-worker-proxy|worker-to-paste)\.js$/.test(f))
  .flatMap((f) => stripComments(fs.readFileSync(f, "utf8")).split("\n")
    .map((ln, i) => [f, i + 1, ln]))
  .filter(([, , ln]) => SLATE_INKS.test(ln))
  .filter(([, , ln]) => !/(Exported from|print|docx|@page|window\.open|buildPrintHtml|memoPrintHtml|buildBriefHtml|PRINT_)/i.test(ln))
  .map(([f, n]) => f + ":" + n);
check("⭐ no raw slate ink on a themed ground (#374151/#3A3A36/#4B5563/#5A6478/#64748B/#94A3B8)"
  + (slateOffenders.length ? " -> " + slateOffenders.length + " site(s), e.g. " + slateOffenders[0] : ""),
  slateOffenders.length === 0);

// ⭐ A TRANSLUCENT WHITE FILL IS A LIGHT-ONLY CONSTRUCT, and it was the single
// biggest remaining color pair: over the night ground rgba(255,255,255,.5)
// composites to a mid grey (#8A8A8A and #8F8F8E, measured) that fights every
// themed ink laid on it — SEVEN findings from THREE declarations, .uc-badge,
// .cs-badge and .cr-chip.
// ⚠️ THE RECIPE IS DELIBERATE — First Light spec v1.6's "glass-quiet chip",
// pinned by tests/retheme_tokens.test.js. It needed a DARK BRANCH, not a
// removal, so the light value moved into the fallback slot of
// `var(--glass-quiet, rgba(255,255,255,.5))` and light renders unchanged.
// This guard is the general form: a BARE translucent white must not come back
// on any of the three, whatever the recipe is called next.
for (const [file, sel] of [["index.html", ".uc-badge {"],
                           ["index.html", ".cs-badge {"],
                           ["credential_reference.js", ".cr-chip{"]]) {
  const src = stripComments(fs.readFileSync(file, "utf8"));
  const rule = src.split("\n").find((ln) => ln.includes(sel) && /background/.test(ln)) || "";
  check("⭐ " + file + " " + sel.trim() + " does not fill with a BARE translucent white"
    + (rule === "" ? " -> the rule was not found at all" : ""),
    rule !== "" && !/background:\s*rgba\(255,\s*255,\s*255/.test(rule));
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);

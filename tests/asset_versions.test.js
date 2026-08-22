// Cache-busting — scripts/stamp_asset_versions.py + CPL_TABS.loadScript.
//
// ⭐ WHY. Sam, 2026-08-22: "Since we are constantly making changes to COBI views,
// I fear users may be looking at stale screens." He proposed a splash screen
// telling people to press Ctrl+Shift+R. Measured instead: index.html shipped 38
// local <script> tags and NOT ONE version query, and COBI lazy-loads 34 more tab
// modules by name — so a browser could hold a stale `college_briefing.js`
// indefinitely. Versioned URLs make that impossible with nothing to remember.
//
// ⚠ THE HTML TAGS ARE THE SHELL, NOT THE SUBSTANCE. A first cut stamped only the
// tags and claimed every UI module was covered. It wasn't: `college_briefing.js`
// — the file whose staleness prompted this — is lazy-loaded and appears in no
// tag. Hence the manifest, and hence (2) below.
//
// ⚠ AND IDEMPOTENCY IS NOT A NICETY. The first draft left the separator newline
// outside the marker block, so every deploy added one byte — an accumulating
// diff that no single run looks wrong. That is CLAUDE.md Rule 2's 34-stacked-CSS
// -copies failure wearing a query string, and only a repeat-run check finds it.
//
// Run from repo root: `npm test` (or `node tests/asset_versions.test.js`).
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const SCRIPT = "scripts/stamp_asset_versions.py";
const TABS = fs.readFileSync("tabs.js", "utf8");
const PAGES = fs.readFileSync(".github/workflows/pages.yml", "utf8");

function run(dir) {
  return execFileSync("python3", [SCRIPT, dir], { encoding: "utf8" });
}

/* A fixture with the shapes that actually bit: a subdirectory page (fact-sheet/
 * and sierra/ resolve ./ against their OWN directory), an external URL, and a
 * reference to a file that does not exist. */
function fixture() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "assetv-"));
  fs.writeFileSync(path.join(d, "tabs.js"), "// tabs\n");
  fs.writeFileSync(path.join(d, "app.js"), "// app v1\n");
  fs.writeFileSync(path.join(d, "lazy_tab.js"), "// lazy\n");
  fs.writeFileSync(path.join(d, "index.html"),
    '<html><head><title>t</title></head><body>'
    + '<script src="tabs.js"></script>'
    + '<script src="app.js"></script>'
    + '<script src="https://cdn.example.com/x.js"></script>'
    + '<script src="gone.js"></script>'
    + "</body></html>");
  fs.mkdirSync(path.join(d, "sub"));
  fs.writeFileSync(path.join(d, "sub", "only_here.js"), "// sub\n");
  fs.writeFileSync(path.join(d, "sub", "index.html"),
    '<html><body><script src="./only_here.js"></script></body></html>');
  return d;
}

// ── (1) It stamps, and stamps the right things ──────────────────────────────
block("(1)", function () {
  const d = fixture();
  run(d);
  const h = fs.readFileSync(path.join(d, "index.html"), "utf8");
  check("(1) a local script gains a content stamp",
    /src="app\.js\?v=[0-9a-f]{8}"/.test(h));
  check("(1) ⚠ an EXTERNAL url is untouched",
    /src="https:\/\/cdn\.example\.com\/x\.js"/.test(h)
    && !/cdn\.example\.com\/x\.js\?v=/.test(h));
  check("(1) ⚠ a reference to a MISSING file is left unstamped, not given a fake hash",
    /src="gone\.js"/.test(h) && !/gone\.js\?v=/.test(h),
    "a wrong hash is worse than none — it reads as deliberate");
  const sub = fs.readFileSync(path.join(d, "sub", "index.html"), "utf8");
  check("(1) ⭐ a SUBDIRECTORY page resolves ./ against its own directory",
    /src="\.\/only_here\.js\?v=[0-9a-f]{8}"/.test(sub),
    "fact-sheet/ and sierra/ both do this, and the one documented stale-asset "
    + "incident in this repo was a cached factsheet_edit.js");
  fs.rmSync(d, { recursive: true, force: true });
});

// ── (2) The manifest — what actually covers the lazy tabs ───────────────────
block("(2)", function () {
  const d = fixture();
  run(d);
  const h = fs.readFileSync(path.join(d, "index.html"), "utf8");
  const m = /window\.CPL_ASSET_V=(\{.*?\});/.exec(h);
  check("(2) ⭐ a manifest is emitted", !!m);
  if (!m) { fs.rmSync(d, { recursive: true, force: true }); return; }
  const man = JSON.parse(m[1]);
  check("(2) ⭐ it covers a LAZY module that appears in no <script> tag",
    !!man["lazy_tab.js"] && /^[0-9a-f]{8}$/.test(man["lazy_tab.js"]),
    "this is the whole point — college_briefing.js is loaded this way");
  check("(2) ⭐ the manifest precedes the first real <script src>",
    h.indexOf("CPL_ASSET_V") < h.indexOf('src="tabs.js'),
    "a manifest loading after tabs.js is a manifest loadScript cannot see, and "
    + "the failure is silent");
  const sub = fs.readFileSync(path.join(d, "sub", "index.html"), "utf8");
  check("(2) ⚠ a subdirectory page gets NO manifest",
    sub.indexOf("CPL_ASSET_V") < 0,
    "loadScript resolves root-relative, so it could not use one — 4 KB it never reads");
  fs.rmSync(d, { recursive: true, force: true });
});

// ── (3) Idempotency, over THREE runs ────────────────────────────────────────
block("(3)", function () {
  const d = fixture();
  run(d);
  const a = fs.readFileSync(path.join(d, "index.html"), "utf8");
  run(d);
  const b = fs.readFileSync(path.join(d, "index.html"), "utf8");
  run(d);
  const c = fs.readFileSync(path.join(d, "index.html"), "utf8");
  check("(3) ⭐ three runs produce a byte-identical file",
    a === b && b === c,
    "the first draft accumulated one newline per run: len " + a.length
    + " / " + b.length + " / " + c.length);
  check("(3) ⚠ no stamp stacking (?v=..?v=..)", !/\?v=[0-9a-f]+\?v=/.test(c));
  check("(3) ⚠ exactly one manifest block",
    (c.match(/CPL-ASSET-VERSIONS/g) || []).length === 2, "open + close markers");
  fs.rmSync(d, { recursive: true, force: true });
});

// ── (4) A changed file moves ONLY its own stamp ─────────────────────────────
block("(4)", function () {
  const d = fixture();
  run(d);
  const before = fs.readFileSync(path.join(d, "index.html"), "utf8");
  const appBefore = /app\.js\?v=([0-9a-f]{8})/.exec(before)[1];
  const tabsBefore = /tabs\.js\?v=([0-9a-f]{8})/.exec(before)[1];
  fs.writeFileSync(path.join(d, "app.js"), "// app v2 — changed\n");
  run(d);
  const after = fs.readFileSync(path.join(d, "index.html"), "utf8");
  check("(4) ⭐ the changed file's stamp moves",
    /app\.js\?v=([0-9a-f]{8})/.exec(after)[1] !== appBefore);
  check("(4) ⭐ …and an UNCHANGED file's stamp does not",
    /tabs\.js\?v=([0-9a-f]{8})/.exec(after)[1] === tabsBefore,
    "a per-file hash is why the daily cron does not bust every cache in the site");
  fs.rmSync(d, { recursive: true, force: true });
});

// ── (5) A silent no-op must fail the deploy ─────────────────────────────────
block("(5)", function () {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "assetv-empty-"));
  fs.writeFileSync(path.join(d, "index.html"), "<html><body>nothing here</body></html>");
  let failed = false;
  try { run(d); } catch (e) { failed = true; }
  check("(5) ⭐ stamping NOTHING exits non-zero",
    failed,
    "otherwise a refactor of how assets are referenced ships every page "
    + "unversioned again, exiting 0 — indistinguishable from working");
  fs.rmSync(d, { recursive: true, force: true });
});

// ── (6) The consumer, and the deploy wiring ─────────────────────────────────
block("(6)", function () {
  check("(6) ⭐ loadScript versions its injected src",
    /s\.src = assetUrl\(src\);/.test(TABS));
  check("(6) ⚠ …and the DEDUPE key stays the unversioned name",
    /s\.setAttribute\('data-lazy-src', src\);/.test(TABS),
    "keying on the stamped URL would make a second loadScript() miss the tag it "
    + "just injected and load the module twice");
  check("(6) ⚠ assetUrl FAILS OPEN when there is no manifest",
    /return src;\s*\n\s*\}/.test(TABS) && /catch \(e\) \{[^}]*\}\s*\n\s*return src;/.test(TABS),
    "a local file:// open or an older deploy must get the plain name, never a "
    + "broken src");
  check("(6) it is exposed for other runtime loaders",
    /assetUrl: assetUrl,/.test(TABS));
  check("(6) ⭐ the deploy runs it against _site",
    /python3 scripts\/stamp_asset_versions\.py _site/.test(PAGES));
  check("(6) ⚠ …AFTER the site is assembled and BEFORE the served-path assertion",
    PAGES.indexOf("Assemble lean site") < PAGES.indexOf("Stamp asset versions")
    && PAGES.indexOf("Stamp asset versions") < PAGES.indexOf("Assert every browser-served"),
    "stamping before assembly would have nothing to stamp");
});

const failed = results.filter((r) => !r[1]);
results.forEach(([name, ok, why]) =>
  console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\nasset_versions.test.js: "
  + (results.length - failed.length) + "/" + results.length + " checks passed");
if (failed.length) process.exit(1);

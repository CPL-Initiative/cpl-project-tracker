// CPL Knowledge Base tab — guards the wiring of the self-contained kb-portal/
// bundle into its own dashboard tab.
//
// The tab embeds kb-portal/ in an iframe; the bundle's OWN Supabase magic-link
// auth (allowlist enforced server-side: Sam + Malone) is what gates access — no
// auth is duplicated in the dashboard. This test guards the failure modes that
// would silently break it:
//   (1) the nav button + pane exist in BOTH HTMLs and stay byte-identical (Rule 4),
//   (2) the iframe points at the DIRECTORY "kb-portal/" — NOT "kb-portal/index.html".
//       The bundle's auth redirect is location.origin + location.pathname, so the
//       directory form resolves to .../cpl-project-tracker/kb-portal/, the exact URL
//       registered in Supabase Redirect URLs; "index.html" would NOT match and
//       sign-in would never complete. This is the subtle one — guard it hard.
//   (3) tabs.js (which auto-derives VALID_TABS from the rendered nav) treats
//       knowledge-base as a valid tab and activates its pane on navigate,
//   (4) the embedded bundle files actually exist.
//
// Run from repo root: `npm test` (or `node tests/kb_portal_tab.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");

// (1) present + paired in both HTMLs
for (const [label, html] of [["CPL_Dashboard.html", cpl], ["index.html", idx]]) {
  check(label + ": nav button for knowledge-base",
    /<button class="cpl-tab" data-tab="knowledge-base"[^>]*>Knowledge Base<\/button>/.test(html));
  check(label + ": pane for knowledge-base",
    /<div class="cpl-tab-pane" id="tab-knowledge-base" data-tab="knowledge-base"/.test(html));
  check(label + ": pane close comment present", html.indexOf("<!-- /tab-knowledge-base -->") !== -1);
  // (2) iframe DIRECTORY src — the redirect-match guarantee
  check(label + ': iframe src is the directory "kb-portal/"', /src="kb-portal\/"/.test(html));
  check(label + ": iframe does NOT hard-code index.html (would break the auth redirect match)",
    html.indexOf('src="kb-portal/index.html"') === -1);
}
check("Rule 4: the two HTMLs remain byte-identical", cpl === idx);

// (4) the embedded bundle exists
["index.html", "app.js", "config.js", "styles.css"].forEach(function (f) {
  check("kb-portal/" + f + " exists", fs.existsSync("kb-portal/" + f));
});

// (3) tabs.js treats knowledge-base as valid + activates its pane (jsdom)
const tabsSrc = fs.readFileSync("tabs.js", "utf8");
const domHtml = `<!DOCTYPE html><html><body>
  <nav class="cpl-tabs">
    <button class="cpl-tab" data-tab="dashboard">Dashboard</button>
    <button class="cpl-tab" data-tab="knowledge-base">Knowledge Base</button>
  </nav>
  <div class="cpl-tab-pane" data-tab="dashboard">D</div>
  <div class="cpl-tab-pane" data-tab="knowledge-base"><iframe src="kb-portal/"></iframe></div>
</body></html>`;
const dom = new JSDOM(domHtml, { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
const { window } = dom;
window.scrollTo = function () {};  // jsdom no-op

let threw = false;
try { window.eval(tabsSrc); } catch (e) { threw = true; console.error("tabs.js eval threw:", e); }
check("tabs.js evaluates without throwing", !threw);
try { window.document.dispatchEvent(new window.Event("DOMContentLoaded")); } catch (e) {}

const T = window.CPL_TABS;
check("CPL_TABS is exposed", !!T);
check("knowledge-base is a valid tab (auto-derived from the nav)",
  T && T.valid().indexOf("knowledge-base") !== -1);
T.navigate("knowledge-base");
const pane = window.document.querySelector('.cpl-tab-pane[data-tab="knowledge-base"]');
check("activating knowledge-base marks its pane active", pane && pane.classList.contains("active"));
check("activating knowledge-base marks its nav button active",
  window.document.querySelector('.cpl-tab[data-tab="knowledge-base"]').classList.contains("active"));

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);

// The CPL Knowledge Base, folded into the Library tab as its second view (Sam, Open
// Asks Sheet 121 card 1, 2026-10-23: fold-rule; S459). Before S459 it was its own tab.
//
// The Library pane embeds the self-contained kb-portal/ bundle in #library-kb; the
// bundle's OWN Supabase magic-link auth (allowlist enforced server-side: Sam + Malone)
// is what gates access, so the view opens without the team phrase. Guards:
//   (1) no Knowledge Base nav button or pane remains in either HTML; the Library pane
//       holds #library-kb with the frame; the two HTMLs stay byte-identical (Rule 4),
//   (2) the iframe points at the DIRECTORY "kb-portal/", NOT "kb-portal/index.html".
//       The bundle's auth redirect is location.origin + location.pathname, so the
//       directory form resolves to .../cpl-project-tracker/kb-portal/, the exact URL
//       registered in Supabase Redirect URLs; "index.html" would never match,
//   (3) tabs.js routes an old #knowledge-base link to the Library tab (FOLDED), and
//       library.js reads that hash as the Knowledge Base view,
//   (4) the embedded bundle files exist.
//
// Run from repo root: `npm test` (or `node tests/kb_portal_tab.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");

// (1) folded, in both HTMLs
for (const [label, html] of [["CPL_Dashboard.html", cpl], ["index.html", idx]]) {
  check(label + ": no nav button for knowledge-base", !/data-tab="knowledge-base"/.test(html));
  check(label + ": no pane for knowledge-base", html.indexOf('id="tab-knowledge-base"') === -1 && html.indexOf("<!-- /tab-knowledge-base -->") === -1);
  const lib = html.slice(html.indexOf('id="tab-library"'), html.indexOf("<!-- /tab-library -->"));
  check(label + ": the Library pane holds #library-kb, hidden until the view is chosen", /<div id="library-kb" hidden>/.test(lib));
  // (2) iframe DIRECTORY src — the redirect-match guarantee
  check(label + ': the frame src is the directory "kb-portal/"', /src="kb-portal\/"/.test(lib));
  check(label + ": the frame does NOT hard-code index.html (would break the auth redirect match)", html.indexOf('src="kb-portal/index.html"') === -1);
}
check("Rule 4: the two HTMLs remain byte-identical", cpl === idx);

// (4) the embedded bundle exists
["index.html", "app.js", "config.js", "styles.css"].forEach(function (f) {
  check("kb-portal/" + f + " exists", fs.existsSync("kb-portal/" + f));
});

// (3) tabs.js routes #knowledge-base to the Library tab (jsdom)
const tabsSrc = fs.readFileSync("tabs.js", "utf8");
const domHtml = `<!DOCTYPE html><html><body>
  <nav class="cpl-tabs">
    <button class="cpl-tab" data-tab="dashboard">Dashboard</button>
    <button class="cpl-tab" data-tab="library">Library</button>
  </nav>
  <div class="cpl-tab-pane" data-tab="dashboard">D</div>
  <div class="cpl-tab-pane" data-tab="library"><div id="library-root"></div><div id="library-kb" hidden><iframe src="kb-portal/"></iframe></div></div>
</body></html>`;
const dom = new JSDOM(domHtml, { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/#knowledge-base" });
const { window } = dom;
window.scrollTo = function () {};  // jsdom no-op

let threw = false;
try { window.eval(tabsSrc); } catch (e) { threw = true; console.error("tabs.js eval threw:", e); }
check("tabs.js evaluates without throwing", !threw);
try { window.document.dispatchEvent(new window.Event("DOMContentLoaded")); } catch (e) {}

const T = window.CPL_TABS;
check("CPL_TABS is exposed", !!T);
check("knowledge-base is no longer a tab (derived from the nav)", T && T.valid().indexOf("knowledge-base") === -1);
check("an old #knowledge-base link lands on the Library pane", window.document.querySelector('.cpl-tab-pane[data-tab="library"]').classList.contains("active"));
check("and marks the Library's nav button active", window.document.querySelector('.cpl-tab[data-tab="library"]').classList.contains("active"));

// library.js reads that hash as the Knowledge Base view
const libSrc = fs.readFileSync("library.js", "utf8");
const d2 = new JSDOM('<!doctype html><html><body><div id="library-root"></div></body></html>', { runScripts: "dangerously", url: "https://example.org/#knowledge-base" });
const s2 = d2.window.document.createElement("script"); s2.textContent = libSrc; d2.window.document.body.appendChild(s2);
check("library.js reads #knowledge-base as the Knowledge Base view", d2.window.CPL_LIBRARY && d2.window.CPL_LIBRARY._viewFromHash() === "kb");
const d3 = new JSDOM('<!doctype html><html><body><div id="library-root"></div></body></html>', { runScripts: "dangerously", url: "https://example.org/#library/knowledge-base" });
const s3 = d3.window.document.createElement("script"); s3.textContent = libSrc; d3.window.document.body.appendChild(s3);
check("library.js reads #library/knowledge-base the same way", d3.window.CPL_LIBRARY && d3.window.CPL_LIBRARY._viewFromHash() === "kb");

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);

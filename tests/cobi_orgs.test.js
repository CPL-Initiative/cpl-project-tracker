// COBI site-switcher / org layer (cobi_orgs.js) — the pilot org view.
//   - Rule 4 (both HTMLs identical) + the <script> is loaded in both, after
//     cobi_brand.js so it re-asserts last.
//   - Default view = CPL: EVERY tab stays visible (regression guard — the
//     flagship must be unchanged for CPL/default users), tag = "CPL".
//   - C&I view: nav filtered to its tabs only, all-hidden groups hidden, tag
//     = "C&I"; no gating (panes/routing untouched).
//   - ?org=<id> deep-links into a site; switcher injected once (idempotent).
//
// Run from repo root: `npm test` (or `node tests/cobi_orgs.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function shown(el) { return el && el.style.display !== "none"; }

// ─────────────────────────────────────────────────────────────────────────────
// Part A — static invariants
// ─────────────────────────────────────────────────────────────────────────────
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
check("cobi_orgs.js is loaded in the HTML", /<script src="cobi_orgs\.js"><\/script>/.test(cpl));
check("cobi_orgs.js loads AFTER cobi_brand.js (re-asserts last)",
  cpl.indexOf('src="cobi_orgs.js"') > cpl.indexOf('src="cobi_brand.js"'));

const src = fs.readFileSync("cobi_orgs.js", "utf8");
check("cobi_orgs.js exposes window.CPL_ORGS", /window\.CPL_ORGS\s*=/.test(src));
check("cobi_orgs.js carries no service key (presentation only, no Supabase)", src.indexOf("service_role") === -1);
check("CSS uses design tokens, not raw hex accents", /var\(--seal-blue/.test(src) && /var\(--border/.test(src));

// ─────────────────────────────────────────────────────────────────────────────
// Part B — behaviour in jsdom
// ─────────────────────────────────────────────────────────────────────────────
const HEADER_NAV = `
  <div class="header"><div class="cobi-brand"><div class="cobi-brandtext"><h1>COBI</h1></div></div></div>
  <nav class="cpl-tabs">
    <button class="cpl-tab active" data-tab="dashboard">Dashboard</button>
    <button class="cpl-tab" data-tab="our-process">Our Process</button>
    <button class="cpl-tab" data-tab="tmc-builder">TMC Builder</button>
    <div class="cpl-nav-group" data-nav-group="funding">
      <button class="cpl-nav-group-head">Funding</button>
      <div class="cpl-nav-group-body">
        <button class="cpl-tab" data-tab="budget">Budget</button>
      </div>
    </div>
  </nav>`;

function makeDom(url) {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>${HEADER_NAV}</body></html>`,
    { runScripts: "outside-only", url: url || "https://example.org/" });
  let threw = false;
  // eval registers window.CPL_ORGS; call init() explicitly (jsdom's manual-eval
  // path doesn't drive the DOMContentLoaded lifecycle the real <script> uses).
  try { dom.window.eval(src); dom.window.CPL_ORGS.init(); } catch (e) { threw = true; console.error("eval/init threw:", e); }
  return { dom, window: dom.window, document: dom.window.document, threw };
}

function btn(document, tab) { return document.querySelector('.cpl-tab[data-tab="' + tab + '"]'); }
function tagText(document) {
  const s = document.querySelector(".header h1 .cobi-num");
  return s ? s.textContent : null;
}

// ── default load (no ?org) = CPL, everything visible ──
{
  const { document, window, threw } = makeDom("https://example.org/");
  check("init does not throw on default load", !threw);
  check("default site is CPL", window.CPL_ORGS.current().id === "cpl");
  check("switcher injected into the masthead", !!document.querySelector(".cobi-brand .cobi-orgswitch-sel"));
  check("switcher lists both sites (CPL, C&I)",
    document.querySelectorAll(".cobi-orgswitch-sel option").length === 2);
  check("REGRESSION GUARD: default CPL view shows Dashboard", shown(btn(document, "dashboard")));
  check("REGRESSION GUARD: default CPL view shows Budget (all tabs)", shown(btn(document, "budget")));
  check("REGRESSION GUARD: default CPL view shows the Funding group",
    shown(document.querySelector('.cpl-nav-group[data-nav-group="funding"]')));
  check("default identity tag reads CPL", tagText(document) === "CPL");

  // ── switch to C&I ──
  window.CPL_ORGS.setOrg("ci");
  check("C&I: Our Process stays visible", shown(btn(document, "our-process")));
  check("C&I: TMC Builder stays visible", shown(btn(document, "tmc-builder")));
  check("C&I: Dashboard is hidden from the rail", !shown(btn(document, "dashboard")));
  check("C&I: Budget is hidden from the rail", !shown(btn(document, "budget")));
  check("C&I: the all-hidden Funding group is hidden",
    !shown(document.querySelector('.cpl-nav-group[data-nav-group="funding"]')));
  check("C&I: identity tag flips to C&I", tagText(document) === "C&I");
  check("C&I: switcher reflects the selection", document.querySelector(".cobi-orgswitch-sel").value === "ci");

  // ── back to CPL restores everything ──
  window.CPL_ORGS.setOrg("cpl");
  check("back to CPL: Budget visible again", shown(btn(document, "budget")));
  check("back to CPL: Funding group visible again",
    shown(document.querySelector('.cpl-nav-group[data-nav-group="funding"]')));
  check("back to CPL: tag reads CPL again", tagText(document) === "CPL");

  // ── idempotent init: no duplicate switcher ──
  window.CPL_ORGS.init();
  check("init is idempotent (single switcher)",
    document.querySelectorAll(".cobi-orgswitch").length === 1);
}

// ── shareable deep-link: ?org=ci opens the C&I view directly ──
{
  const { document, window } = makeDom("https://example.org/?org=ci");
  check("?org=ci deep-links into the C&I site", window.CPL_ORGS.current().id === "ci");
  check("?org=ci filters the rail on load (Budget hidden)", !shown(btn(document, "budget")));
  check("?org=ci sets the C&I tag on load", tagText(document) === "C&I");
}

// ── unknown ?org falls back to the default site ──
{
  const { window } = makeDom("https://example.org/?org=zzz");
  check("unknown ?org falls back to CPL", window.CPL_ORGS.current().id === "cpl");
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);

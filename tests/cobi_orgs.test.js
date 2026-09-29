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
    <button class="cpl-tab" data-tab="cip-crosswalk">CIP Codes</button>
    <button class="cpl-tab" data-tab="gr-priorities">GR Priorities</button>
    <div class="cpl-nav-group" data-nav-group="funding">
      <button class="cpl-nav-group-head">Funding</button>
      <div class="cpl-nav-group-body">
        <button class="cpl-tab" data-tab="contracts">Contracts</button>
        <button class="cpl-tab" data-tab="budget">Budget</button>
        <button class="cpl-tab" data-tab="implementation-funding">Implementation Funding</button>
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
// The per-site wordmark tag was removed 2026-09-04 (Sam: "delete the CPL
// superscript and all the other org tags for the logo"). This helper now guards
// its ABSENCE: switching sites must leave the <h1> alone.
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
  // Derived from ORGS rather than hardcoded: a fixed count breaks every time a
  // site is added (it did, when FIN landed) and then gets bumped without thought,
  // which is exactly when a silently-dropped site would slip through. `unlisted`
  // orgs are reachable via ?org= but deliberately kept out of the switcher.
  check("switcher lists every listed site",
    document.querySelectorAll(".cobi-orgswitch-sel option").length ===
      window.CPL_ORGS.ORGS.filter((o) => !o.unlisted).length);
  check("GR is listed in the switcher (selecting it is open; content is phrase-gated)",
    document.querySelectorAll(".cobi-orgswitch-sel option[value='gr']").length === 1);
  check("FIN is listed in the switcher",
    document.querySelectorAll(".cobi-orgswitch-sel option[value='fin']").length === 1);

  // ⭐ Sam, 2026-09-04: "add the org titles next to the org codes (e.g., CPL
  // Credit for Prior Learning Initiative)". Codes alone tell a reader nothing.
  // Derived from ORGS, never a hardcoded list — a site added later must carry a
  // title too, and a fixed list would pass while saying nothing about it.
  {
    const opts = Array.from(document.querySelectorAll(".cobi-orgswitch-sel option"));
    const listed = window.CPL_ORGS.ORGS.filter((o) => !o.unlisted);
    check("every option reads '<code> — <full title>'",
      listed.every((o) => {
        const el = opts.find((x) => x.value === o.id);
        return el && el.textContent === o.label + " \u2014 " + o.full;
      }));
    check("the code still leads, so a width-capped control truncates gracefully",
      opts.every((x) => /^[A-Z&]+ \u2014 /.test(x.textContent)));
    check("CPL expands to the acronym, not back to 'CPL Initiative'",
      opts.find((x) => x.value === "cpl").textContent ===
        "CPL \u2014 Credit for Prior Learning Initiative");
    check("every site has a full title to show", listed.every((o) => !!o.full));
  }

  // The control is width-capped so a 40-character option cannot widen the brand
  // cluster until it overlaps its neighbour — the zoom failure cobi_brand.js
  // documents. The OPEN list is sized by the browser, which is where titles read.
  {
    const css = Array.from(document.querySelectorAll("head style")).map((x) => x.textContent).join("");
    check("switcher control is width-capped",
      /\.cobi-orgswitch-sel\{[^}]*max-width:/.test(css));
    check("switcher control may shrink and ellipsize",
      /\.cobi-orgswitch-sel\{[^}]*min-width:0/.test(css) &&
      /\.cobi-orgswitch-sel\{[^}]*text-overflow:ellipsis/.test(css));
  }
  check("default view HIDES the EXCLUSIVE gr-priorities tab (content gated, tab off the flagship nav)",
    !shown(btn(document, "gr-priorities")));
  // The same property for Contracts, and the one that matters most: vendor
  // payment terms and staff contacts must not sit in the flagship nav. This
  // failure is invisible from inside the FIN site, where it always looks right.
  check("⚠ default view HIDES the EXCLUSIVE contracts tab (vendor terms off the flagship nav)",
    !shown(btn(document, "contracts")));
  check("REGRESSION GUARD: default CPL view shows Dashboard", shown(btn(document, "dashboard")));
  check("REGRESSION GUARD: default CPL view shows Budget (all tabs)", shown(btn(document, "budget")));
  check("REGRESSION GUARD: default CPL view shows the Funding group",
    shown(document.querySelector('.cpl-nav-group[data-nav-group="funding"]')));
  check("no identity tag on the wordmark by default", tagText(document) === null);

  // ── switch to C&I ──
  window.CPL_ORGS.setOrg("ci");
  check("C&I: Our Process stays visible", shown(btn(document, "our-process")));
  check("C&I: TMC Builder stays visible", shown(btn(document, "tmc-builder")));
  check("C&I: Dashboard is hidden from the rail", !shown(btn(document, "dashboard")));
  check("C&I: Budget is hidden from the rail", !shown(btn(document, "budget")));
  check("C&I: the all-hidden Funding group is hidden",
    !shown(document.querySelector('.cpl-nav-group[data-nav-group="funding"]')));
  check("C&I: still no identity tag on the wordmark", tagText(document) === null);
  check("C&I: switcher reflects the selection", document.querySelector(".cobi-orgswitch-sel").value === "ci");

  // ── switch to CIP: only the crosswalk site's tabs show ──
  window.CPL_ORGS.setOrg("cip");
  check("CIP: CIP Codes tab stays visible", shown(btn(document, "cip-crosswalk")));
  check("CIP: Dashboard is hidden from the rail", !shown(btn(document, "dashboard")));
  check("CIP: Budget is hidden from the rail", !shown(btn(document, "budget")));
  check("CIP: still no identity tag on the wordmark", tagText(document) === null);

  // ── switch to GR: the EXCLUSIVE GR Priorities tab shows only under its site ──
  window.CPL_ORGS.setOrg("gr");
  check("GR: GR Priorities tab is visible under the GR site", shown(btn(document, "gr-priorities")));
  check("GR: Dashboard is hidden from the rail", !shown(btn(document, "dashboard")));
  check("GR: Budget is hidden from the rail", !shown(btn(document, "budget")));
  check("GR: still no identity tag on the wordmark", tagText(document) === null);

  // ── switch to FIN: Contracts is EXCLUSIVE so it shows ONLY here, and the
  //    site is a real three-tab Finance view rather than a one-tab site ──
  window.CPL_ORGS.setOrg("fin");
  check("FIN: the EXCLUSIVE Contracts tab is visible under its own site",
    shown(btn(document, "contracts")));
  check("FIN: Budget stays visible (listing it in FIN does not move it)",
    shown(btn(document, "budget")));
  check("FIN: Implementation Funding stays visible",
    shown(btn(document, "implementation-funding")));
  check("FIN: the Funding group is visible",
    shown(document.querySelector('.cpl-nav-group[data-nav-group="funding"]')));
  check("FIN: Dashboard is hidden from the rail", !shown(btn(document, "dashboard")));
  check("FIN: GR Priorities stays hidden (one EXCLUSIVE tab does not unlock another)",
    !shown(btn(document, "gr-priorities")));
  check("FIN: still no identity tag on the wordmark", tagText(document) === null);
  check("FIN: home tab is Contracts", window.CPL_ORGS.current().home === "contracts");

  // ── back to CPL restores everything ──
  window.CPL_ORGS.setOrg("cpl");
  check("back to CPL: Budget visible again", shown(btn(document, "budget")));
  check("back to CPL: Funding group visible again",
    shown(document.querySelector('.cpl-nav-group[data-nav-group="funding"]')));
  check("back to CPL: EXCLUSIVE gr-priorities hidden again", !shown(btn(document, "gr-priorities")));
  check("back to CPL: still no identity tag on the wordmark", tagText(document) === null);

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
  check("?org=ci writes no tag on load", tagText(document) === null);
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

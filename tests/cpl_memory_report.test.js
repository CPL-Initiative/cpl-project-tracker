// 🧠 Memory tab — the "Everything We Know" REPORT view (cpl_memory.js, 2nd view mode).
//   - A view-mode toggle (🧠 Curate / 📄 Report) lives in the masthead; report mode
//     hides the curate chrome (tiles/filters/curate bar/list/ripple) and renders a
//     plain-language briefing grouped into fixed sections.
//   - Filtering: verified-only by DEFAULT (matching the pane's verified-default trust
//     rule); an "Include proposed" checkbox reveals proposed; superseded is NEVER shown;
//     an org scope <select> narrows by COBI area.
//   - Sections render only when they hold ≥1 entry (empty sections omitted); each rendered
//     section carries a plain-language lead-in, and every entry renders as prose (the
//     reader-facing `plain` field when present, else a summary+detail fallback). There is
//     deliberately NO filename "touches:" dump and NO "source:" citation in the report —
//     that jargon lives in the Curate view only.
//   - Deterministic: seeds via the _setData seam + switches via _setViewMode — no real
//     Date dependency, no fetch timing in the assertions.
//
// Run from repo root: `npm test` (or `node tests/cpl_memory_report.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const tick = () => new Promise((r) => setTimeout(r, 0));

const src = fs.readFileSync("cpl_memory.js", "utf8");
const teamSrc = fs.readFileSync("team_phrase.js", "utf8");

function makeDom() {
  const html = `<!DOCTYPE html><html><head></head><body>
    <div id="tab-memory"><div id="memory-root"></div></div>
  </body></html>`;
  return new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/" });
}

// Fixture: a verified decision, a verified milestone (with `when`), a verified procedure
// (with affects[]), a PROPOSED fact (hidden by default), and a SUPERSEDED row (never shown).
const FIXTURE = [
  { id: "d1", slug: "d1", kind: "decision", status: "verified", org: "cpl",
    title: "Edit the generator",
    summary: "Change the generator, not the HTML", detail: "Hand-edits to the HTML are overwritten on the next daily run.",
    tags: ["dashboard"], source: "CLAUDE.md Rule 1", affects: [], related: [], updated_at: "2026-07-24T10:00:00Z" },
  { id: "m1", slug: "m1", kind: "milestone", status: "verified", org: "cip",
    summary: "CIP Coder (Beta) shipped to production", detail: "Live on COBI for faculty testing.",
    when: "2026-07-20", tags: ["cip"], source: "PR #851", affects: [], related: [], updated_at: "2026-07-20T10:00:00Z" },
  { id: "pr1", slug: "pr1", kind: "procedure", status: "verified", org: "cpl",
    summary: "Re-mints follow the mandatory playbook", detail: "Dry-run first, alias map committed, fresh-read at write-time.",
    plain: "When we renumber course IDs, every related file has to be renumbered in the same pass — miss one and the links silently break.",
    tags: ["remint"], source: "docs/coursecontrolnumber_remint.md", affects: ["kb_curation", "promotions.json", "articulations"], related: [] },
  { id: "f1", slug: "f1", kind: "fact", status: "proposed", org: "cpl",
    summary: "TOP codes are notoriously unreliable", detail: "About 52% of consolidated M-IDs are TOP-mixed.",
    tags: ["top"], source: "methodology-top-is-a-last-in-line-signal", affects: [], related: [] },
  { id: "x0", slug: "x0", kind: "decision", status: "superseded", org: "cpl",
    summary: "Old superseded decision that must never surface", detail: "Replaced.", tags: [], source: "x", affects: [], related: [], superseded_by: "d1" },
];

function boot(dom, { withPhrase } = {}) {
  const { window } = dom;
  if (withPhrase) { try { window.localStorage.setItem("cpl_team_pass", "team-secret"); } catch (e) {} }
  else { try { window.localStorage.removeItem("cpl_team_pass"); } catch (e) {} }
  // stub fetch: everything → [] (we seed deterministically via _setData, not the network)
  window.fetch = function () {
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  };
  window.eval(teamSrc);
  window.eval(src);
  return window.CPL_MEMORY;
}

(async () => {
  const dom = makeDom();
  let api, threw = false;
  try { api = boot(dom, { withPhrase: true }); } catch (e) { threw = true; console.error("eval threw:", e); }
  check("cpl_memory.js evaluates without throwing", !threw);
  check("exposes the _setViewMode seam", api && typeof api._setViewMode === "function");

  let actThrew = false;
  try { api.activate(); } catch (e) { actThrew = true; console.error("activate threw:", e); }
  await tick(); await tick();
  api._setData(FIXTURE);
  check("activate() + seed renders without throwing", !actThrew);

  const doc = dom.window.document;
  const root = doc.getElementById("memory-root");

  // ── the masthead view-mode toggle exists in curate mode (default) ──
  check("masthead carries the 🧠 Curate / 📄 Report toggle", (function () {
    const seg = root.querySelector(".mem-viewseg");
    if (!seg) return false;
    const labels = Array.prototype.map.call(seg.querySelectorAll(".mem-seg-btn"), (b) => b.textContent);
    return /Curate/.test(labels.join("")) && /Report/.test(labels.join(""));
  })());
  check("default view is curate — the list is present, the report host hidden", (function () {
    const list = root.querySelector(".mem-list");
    const report = root.querySelector(".mem-report");
    return !!list && report && report.style.display === "none";
  })());

  // ── switch to the report view ──
  let repThrew = false;
  try { api._setViewMode("report"); } catch (e) { repThrew = true; console.error("report render threw:", e); }
  check("_setViewMode('report') renders without throwing", !repThrew);

  const report = root.querySelector(".mem-report");
  check("report mode reveals the report host", report && report.style.display !== "none");
  check("report mode HIDES the curate chrome (tiles/filters/curate bar/list body)", (function () {
    return root.querySelector(".mem-tiles").style.display === "none" &&
      root.querySelector(".mem-filters").style.display === "none" &&
      root.querySelector(".mem-curatebar").style.display === "none" &&
      root.querySelector(".mem-body").style.display === "none";
  })());
  check("masthead (title + theme + toggle) stays visible in report mode", (function () {
    return !!root.querySelector(".mem-title h1") && !!root.querySelector(".mem-theme") &&
      !!root.querySelector(".mem-viewseg");
  })());
  check("report has a title block ('Everything We Know')", (function () {
    const t = report.querySelector(".mr-title");
    return t && /Everything We Know/.test(t.textContent);
  })());

  // helper: the .mr-section whose heading text equals `name` (or null)
  function sectionByHeading(name) {
    return Array.prototype.filter.call(report.querySelectorAll(".mr-section"),
      (s) => s.querySelector(".mr-h") && s.querySelector(".mr-h").textContent.trim() === name)[0] || null;
  }
  function reportText() { return report.textContent; }

  // ── (1) the decision lands under "What we've decided" ──
  check("(1) 'What we've decided' section holds the decision summary", (function () {
    const s = sectionByHeading("What we've decided");
    return s && /Change the generator, not the HTML/.test(s.textContent);
  })());

  // ── (2) the PROPOSED fact is NOT present by default (verified-only) ──
  check("(2) the proposed fact is HIDDEN by default", !/TOP codes are notoriously unreliable/.test(reportText()));
  check("(2) 'What we know' section is absent while only a proposed fact exists", !sectionByHeading("What we know"));

  // ── (3) the superseded row is NEVER shown ──
  check("(3) the superseded row never appears", !/must never surface/.test(reportText()));

  // ── (4) the milestone renders under 'What we've shipped' with its date in PROSE ──
  check("(4) 'What we've shipped' holds the milestone + a prose 'Reached <date>'", (function () {
    const s = sectionByHeading("What we've shipped");
    return s && /CIP Coder \(Beta\) shipped/.test(s.textContent) && /Reached July 20, 2026/.test(s.textContent);
  })());
  check("(4b) the milestone uses prose, not the old 'shipped <iso>' format", (function () {
    const s = sectionByHeading("What we've shipped");
    return s && !/shipped 2026-07-20/.test(s.textContent);
  })());

  // ── (5) the procedure renders as PROSE (its `plain` text), with NO 'touches:' filename dump ──
  check("(5) the procedure shows its plain prose under 'How we do things'", (function () {
    const s = sectionByHeading("How we do things");
    return s && /renumber course IDs/.test(s.textContent) && !!s.querySelector(".mr-p");
  })());
  check("(5b) NO monospace 'touches:' filename line appears in the report", (function () {
    return !report.querySelector(".mr-touch") && !/touches:/.test(reportText());
  })());

  // ── (5c) every rendered section carries a plain-language lead-in ──
  check("(5c) each rendered section has a .mr-lead intro", (function () {
    const secs = report.querySelectorAll(".mr-section");
    if (!secs.length) return false;
    return Array.prototype.every.call(secs, (s) => !!s.querySelector(".mr-lead"));
  })());

  // ── (5d) no jargon 'source:' citation in the reader report ──
  check("(5d) no 'source:' citation appears in the reader report", !/source:/.test(reportText()));

  // ── (5e) an item with a `title` renders a bold title line above the prose ──
  check("(5e) the decision renders its short title as .mr-ptitle", (function () {
    const s = sectionByHeading("What we've decided");
    if (!s) return false;
    const t = s.querySelector(".mr-ptitle");
    return t && /Edit the generator/.test(t.textContent) && !!s.querySelector(".mr-p");
  })());
  check("(5e) an item WITHOUT a title renders no .mr-ptitle (title is as-needed)", (function () {
    // the procedure fixture (pr1) has no title → its item has a prose para but no title line
    const s = sectionByHeading("How we do things");
    return s && !s.querySelector(".mr-ptitle") && !!s.querySelector(".mr-p");
  })());

  // ── (5f) the report body is left-justified (the mount is center-aligned for its loading state) ──
  check("(5f) .mem-report CSS forces text-align:left", /\.mem-report\{[^}]*text-align:left/.test(src));

  // ── (6) empty sections are omitted (no question/pitfall/risk/opportunity entries) ──
  check("(6) empty sections are omitted (no 'Open questions' / 'Traps to avoid' / 'What we're watching')", (function () {
    return !sectionByHeading("Open questions") && !sectionByHeading("Traps to avoid") &&
      !sectionByHeading("What we're watching") && !sectionByHeading("What's next");
  })());

  // ── (7) toggling "Include proposed" reveals the fact under "What we know" ──
  const inc = report.querySelector(".mr-inc");
  check("(7) the Include-proposed checkbox exists and defaults OFF", inc && inc.checked === false);
  let incThrew = false;
  try { inc.click(); } catch (e) { incThrew = true; console.error(e); }
  check("(7) toggling include-proposed does not throw", !incThrew);
  check("(7) after toggle, the fact appears under 'What we know'", (function () {
    const s = sectionByHeading("What we know");
    return s && /TOP codes are notoriously unreliable/.test(s.textContent);
  })());
  check("(7) the superseded row is STILL never shown after toggle", !/must never surface/.test(reportText()));

  // ── (8) the org scope <select> narrows by area (cip milestone drops when scope=cpl) ──
  const scope = report.querySelector(".mr-scope-sel");
  check("(8) the area-scope select renders with an 'All areas' + org options", (function () {
    if (!scope) return false;
    const vals = Array.prototype.map.call(scope.options, (o) => o.value);
    return vals[0] === "all" && vals.indexOf("cpl") >= 0 && vals.indexOf("cip") >= 0;
  })());
  let scopeThrew = false;
  try { scope.value = "cpl"; scope.onchange(); } catch (e) { scopeThrew = true; console.error(e); }
  check("(8) scoping to cpl does not throw", !scopeThrew);
  check("(8) scoping to cpl drops the cip milestone but keeps the cpl decision", (function () {
    return !/CIP Coder \(Beta\) shipped/.test(report.textContent) &&
      /Change the generator, not the HTML/.test(report.textContent);
  })());

  // ── (9) switching back to curate restores the list ──
  api._setViewMode("curate");
  check("(9) switching back to curate restores the list + hides the report", (function () {
    return root.querySelector(".mem-list").style.display !== "none" &&
      root.querySelector(".mem-report").style.display === "none";
  })());

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();

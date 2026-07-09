// Regression tests for the Session-104 originating-college chips (2026-07-07):
// Sam: "It would also help to have a chip that listed the originating college
// for the exhibits — especially since many are Cx and knowing their local
// title could help determine the common course title to use."
//
// kb/_audit_exhibits.py now stamps `colleges` (the CustomReport "College"
// column — the ORIGINATING college) on each unclassified card; the worklist
// renders them as chips inside the raw-title cell (short name on the chip via
// window.cplCollegeShort when loaded, full name in the tooltip). Failure modes
// guarded: cards without the field (pre-Session-104 audit snapshots) must
// render chip-free, and the resolver being absent must fall back to the full
// name — never a blank chip.
//
// Run from repo root: `npm test` (or `node tests/cer_worklist_college_chip.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("credential_reference.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

const auditStub = {
  _generated_at: "2026-07-07T00:00:00+00:00",
  title_cards: [
    { raw_title: "Raw With Colleges", unified_title: null, tags: ["unclassified_in_map"],
      band: "<0.40", colleges: ["Mt. San Jacinto College", "Cabrillo College"] },
    { raw_title: "Raw Without Colleges", unified_title: null, tags: ["unclassified_in_map"],
      band: "<0.40" },  // pre-Session-104 card shape — no `colleges` key at all
  ],
  stats: {},
};

function makeDom(opts) {
  const html = `<!DOCTYPE html><html><body>
  <div id="tab-credential-reference">
    <div id="cr-toolbar"></div><div id="cr-summary"></div><div id="cr-table-wrap"></div>
  </div></body></html>`;
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
  const { window } = dom;
  window.CPL_CREDENTIAL_REFERENCE = { _generated_at: "t", top_categories: {}, unified_titles: [] };
  if (opts.shortNames) {
    window.cplCollegeShort = function (name) {
      return { "Mt. San Jacinto College": "Mt. San Jacinto" }[name] || null;
    };
  }
  window.fetch = function (url) {
    url = String(url);
    const respond = (body, status) => Promise.resolve({
      ok: !status || status < 400, status: status || 200,
      json: () => Promise.resolve(body),
    });
    if (url.indexOf("exhibit_audit/latest.json") >= 0) return respond(auditStub);
    if (url.indexOf("unclassified_preseed.json") >= 0) return respond(null, 404);
    if (url.indexOf("unclassified_suggestions.json") >= 0) return respond({ suggestions: {} });
    if (url.indexOf("kb_curation") >= 0) return respond([]);
    return respond([]);
  };
  try { window.eval(src); } catch (e) { check("eval threw: " + e.message, false); }
  return { window };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(opts) {
  const ctx = makeDom(opts || {});
  await sleep(80);
  Array.from(ctx.window.document.querySelectorAll(".cr-lane")).find((b) => /Unclassified/.test(b.textContent)).click();
  await sleep(80);
  return ctx;
}

async function scenarioChips() {
  const { window } = await open({ shortNames: true });
  const doc = window.document;
  const rows = Array.from(doc.querySelectorAll(".cr-wl-table tbody tr"));
  const withRow = rows.find((r) => txt(r.querySelector(".cr-wl-rawt")) === "Raw With Colleges");
  const without = rows.find((r) => txt(r.querySelector(".cr-wl-rawt")) === "Raw Without Colleges");
  const chips = Array.from(withRow.querySelectorAll(".cr-wl-college"));
  check("chips: one chip per originating college", chips.length === 2);
  check("chips: short name shown when the resolver knows the college",
    txt(chips[0]) === "Mt. San Jacinto");
  check("chips: resolver miss falls back to the full name",
    txt(chips[1]) === "Cabrillo College");
  check("chips: full name always in the tooltip",
    chips[0].getAttribute("title") === "Originating college: Mt. San Jacinto College"
    && chips[1].getAttribute("title") === "Originating college: Cabrillo College");
  check("chips: rendered inside the raw-title cell (no new column)",
    withRow.querySelector(".cr-wl-raw .cr-wl-colleges") !== null
    && doc.querySelectorAll(".cr-wl-table thead th").length === 4);
  check("chips: a card without the field renders chip-free (soft-absent)",
    without.querySelectorAll(".cr-wl-college").length === 0
    && without.querySelector(".cr-wl-colleges") === null);
}

async function scenarioNoResolver() {
  const { window } = await open({ shortNames: false });
  const doc = window.document;
  const rows = Array.from(doc.querySelectorAll(".cr-wl-table tbody tr"));
  const withRow = rows.find((r) => txt(r.querySelector(".cr-wl-rawt")) === "Raw With Colleges");
  const chips = Array.from(withRow.querySelectorAll(".cr-wl-college"));
  check("no-resolver: full names shown when cplCollegeShort is not loaded",
    chips.length === 2 && txt(chips[0]) === "Mt. San Jacinto College");
}

(async () => {
  await scenarioChips();
  await scenarioNoResolver();
  let fails = 0;
  for (const [name, ok] of results) {
    console.log(`  ${ok ? "✓" : "✗"} ${name}`);
    if (!ok) fails++;
  }
  console.log(`${results.length} checks, ${fails} failed`);
  process.exit(fails ? 1 : 0);
})();

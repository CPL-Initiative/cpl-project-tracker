// Regression test for the Session-104 row-level error isolation (2026-07-07):
// Sam reported the main CER list vanishing around an expand/collapse of the
// first row ('10-Key Data Entry' orphaned at the top). The investigation found
// render() is all-or-nothing — it clears the wrap up front and re-attaches at
// the end — so ONE row whose render throws (a malformed field in the
// daily-regenerated credential_reference_data.js) destroyed the entire table.
// appendRowSafe now isolates each row: a throwing row degrades to an inline ⚠
// placeholder and every other row still renders + stays interactive.
//
// The injected failure mode is real: a non-string quality_flag (numbers pass
// adaptBakedRow's `b.quality_flag || null` untouched) throws at
// `flag_label.replace(...)` in renderRow.
//
// Run from repo root: `npm test` (or `node tests/cer_row_error_isolation.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("credential_reference.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

const payload = {
  _generated_at: "t",
  top_categories: {},
  unified_titles: [
    { ut: "Alpha Credential", raw_count: 1, conf_title: 0.9, audit_tags: {},
      audit_tag_total: 0, raw_variants: [{ r: "Alpha Raw", c: 0.9 }], articulations: [] },
    { ut: "Broken Row", raw_count: 1, conf_title: 0.5, audit_tags: {},
      audit_tag_total: 0, quality_flag: 5, articulations: [] },  // numeric flag → renderRow throws
    { ut: "Gamma Credential", raw_count: 1, conf_title: 0.8, audit_tags: {},
      audit_tag_total: 0, articulations: [] },
  ],
};

function makeDom() {
  const html = `<!DOCTYPE html><html><body>
  <div id="tab-credential-reference">
    <div id="cr-toolbar"></div><div id="cr-summary"></div><div id="cr-table-wrap"></div>
  </div></body></html>`;
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
  const { window } = dom;
  window.CPL_CREDENTIAL_REFERENCE = payload;
  window.console.error = function () {};  // the placeholder path logs; keep test output clean
  window.fetch = function () {
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  };
  try { window.eval(src); } catch (e) { check("eval threw: " + e.message, false); }
  return { window };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const { window } = makeDom();
  await sleep(120);
  const doc = window.document;
  const wrap = doc.getElementById("cr-table-wrap");

  const rows = () => Array.from(wrap.querySelectorAll("tr.cr-row:not(.cr-row-error)"));
  const errs = () => Array.from(wrap.querySelectorAll("tr.cr-row-error"));

  check("good rows all render despite the broken sibling", rows().length === 2);
  check("the broken row degrades to ONE inline placeholder", errs().length === 1);
  check("the placeholder names the broken row",
    txt(errs()[0]).indexOf("Broken Row") >= 0);
  check("the placeholder spans the full table width",
    errs()[0].querySelector("td") && errs()[0].querySelector("td").getAttribute("colspan"));

  // Expand + collapse a healthy row with the broken sibling present — the
  // reported symptom (list lost around a collapse) must be impossible.
  const caret = () => Array.from(wrap.querySelectorAll(".cr-title-toggle"))
    .find((b) => txt(b).indexOf("Alpha") >= 0);
  caret().click();
  await sleep(20);
  check("expand still works next to a broken row",
    wrap.querySelectorAll("tr.cr-expanded").length === 1 && rows().length === 2);
  caret().click();
  await sleep(20);
  check("collapse re-renders the FULL list (no orphaned first row)",
    wrap.querySelectorAll("tr.cr-expanded").length === 0
    && rows().length === 2 && errs().length === 1);

  let fails = 0;
  for (const [name, ok] of results) {
    console.log(`  ${ok ? "✓" : "✗"} ${name}`);
    if (!ok) fails++;
  }
  console.log(`${results.length} checks, ${fails} failed`);
  process.exit(fails ? 1 : 0);
})();

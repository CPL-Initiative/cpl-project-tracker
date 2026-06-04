// Regression test for the CER arts-table column-width tweak (2026-06-04):
// the "Common Course (CCR)" identity column was widened (table-layout:fixed,
// 42/40/18) so the one-line identity wraps to fewer lines → shorter rows.
// jsdom can't compute layout, so we guard the FAILURE MODE = the width rule
// silently getting dropped from ensureCerScopeCss(): assert the injected
// stylesheet carries table-layout:fixed + the 42% identity-column width, and
// that the arts table still renders with its three columns.
//
// Run from repo root: `npm test` (or `node tests/cer_arts_width.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("credential_reference.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

// Minimal credential with one M-ID identity → guarantees an arts table renders.
const row = {
  ut: "ZZZ Width Test Credential", raw_count: 1, audit_tags: {}, audit_tag_total: 0,
  n_articulation_lines: 1,
  articulations: [
    { cid: "EMST M1064", sys: "M-ID",
      title: "Emergency Medical Technician", disc: "Emergency Medical Technologies", top: "1250.00",
      local: [{ subj: "EMT", num: "100", t: "Emergency Medical Technician", u: 8,
                colleges: ["City College of San Francisco"] }] },
  ],
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-credential-reference">
  <div id="cr-toolbar"></div><div id="cr-summary"></div><div id="cr-table-wrap"></div>
</div>
<script>window.CPL_CREDENTIAL_REFERENCE = ${JSON.stringify({
  _generated_at: "test", top_categories: {}, unified_titles: [row],
})};</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });

let threwOnInit = false;
try { window.eval(src); } catch (e) { threwOnInit = true; console.error("init threw:", e); }
check("init does not throw", !threwOnInit);

setTimeout(function () {
  const doc = window.document;
  const wrap = doc.getElementById("cr-table-wrap");

  // Expand the row so ensureCerScopeCss() has definitely run and the arts table exists.
  const tog = Array.from(wrap.querySelectorAll(".cr-title-toggle"))
    .find((b) => txt(b).indexOf("ZZZ Width Test Credential") >= 0);
  if (tog) tog.click();

  const css = doc.getElementById("cr-scope-css");
  check("cr-scope-css stylesheet injected", !!css);
  const cssText = css ? css.textContent : "";
  check("arts table uses table-layout:fixed",
    /table\.cr-arts-table\{table-layout:fixed;\}/.test(cssText));
  check("identity (CCR) column widened to 42%",
    /td\.cr-art-ident\{width:42%;\}/.test(cssText) && /th:nth-child\(1\)/.test(cssText));
  check("local + colleges columns sized (40/18)",
    /td\.cr-art-local\{width:40%;\}/.test(cssText) && /td\.cr-art-colleges\{width:18%;\}/.test(cssText));
  check("cells overflow-wrap so a long code can't overflow a fixed column",
    /table\.cr-arts-table td\{overflow-wrap:anywhere;\}/.test(cssText));

  const trRow = Array.from(wrap.querySelectorAll("tr.cr-row"))
    .find((tr) => txt(tr).indexOf("ZZZ Width Test Credential") >= 0);
  const sib = trRow && trRow.nextElementSibling;
  const body = (sib && sib.classList && sib.classList.contains("cr-expanded"))
    ? sib.querySelector(".cr-expanded-body") : null;
  check("row expanded with an arts table", !!body && !!body.querySelector("table.cr-arts-table"));
  const ths = body ? body.querySelectorAll("table.cr-arts-table thead th") : [];
  check("arts table still has its 3 columns", ths.length === 3);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
}, 80);

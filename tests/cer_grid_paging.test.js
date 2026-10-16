// The CER grid paints in pages (2026-10-16). A cold load used to paint all
// ~2,000 rows three or four times; on a laptop each paint froze the page for
// seconds and Chrome offered "Page unresponsive" (Sam: "the CER seems to be
// timing out when I hard refresh"). Guarded here: the first paint is one page;
// Show more and Show all reveal the rest; any change to the filtered view
// starts again at one page; grouped mode respects the same budget; and the
// two after-paint overlays (COS, the industry catalog) share one re-render.
//
// Run from repo root: `npm test` (or `node tests/cer_grid_paging.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("credential_reference.js", "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

const N = 450;
const rows = [];
for (let i = 0; i < N; i++) {
  rows.push({ ut: "Credential " + String(i).padStart(3, "0"), raw_count: 1, conf_title: 0.9,
    issuer: i % 2 ? "Issuer Odd" : "Issuer Even", cpl_types: ["Industry Certification"],
    audit_tags: {}, audit_tag_total: 0, articulations: [], disc_modal: i < 150 ? "Agriculture" : i < 300 ? "Business" : "Zoology" });
}
const payload = { _generated_at: "t", top_categories: {}, unified_titles: rows };

function makeDom() {
  const html = `<!DOCTYPE html><html><body>
  <div id="tab-credential-reference" class="cpl-tab-pane">
    <div id="cr-toolbar"></div><div id="cr-summary"></div><div id="cr-table-wrap"></div>
  </div></body></html>`;
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
  const { window } = dom;
  window.CPL_CREDENTIAL_REFERENCE = payload;
  const log = { urls: [] };
  window.fetch = function (url) {
    url = String(url); log.urls.push(url);
    const respond = (body) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
    if (url.indexOf("it_ai_credential_catalog.json") >= 0) return respond({ credentials: [], _inputs: {}, _stats: {} });
    if (url.indexOf("cos_matches.json") >= 0) return respond({ matches: { "Credential 000": { name: "X", tier: "exact" } } });
    if (url.indexOf("preseed") >= 0) return respond({ staged: {} });
    if (url.indexOf("suggestions") >= 0) return respond({ suggestions: {} });
    if (url.indexOf("exhibit_audit") >= 0) return respond({ title_cards: [] });
    return respond([]);
  };
  window.eval(src);
  return { window, log };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const click = (doc, sel) => { const b = doc.querySelector(sel); if (b) b.click(); return !!b; };
const painted = (doc) => doc.querySelectorAll("#cr-table-wrap tr .cr-title-toggle").length;

(async () => {
  const { window } = makeDom();
  const doc = window.document;
  await sleep(150);

  check("first paint: one page of 200 rows, not all " + N, painted(doc) === 200);
  check("first paint: the bar says what is held back",
    /Showing 200 of 450/.test(txt(doc.querySelector(".cr-grid-morewrap"))));
  check("first paint: the COS overlay still landed (one shared re-render)",
    !!Array.from(doc.querySelectorAll(".cr-chip-cos")).length);

  click(doc, "button.cr-grid-more");
  await sleep(20);
  check("Show more: adds a page", painted(doc) === 400);
  click(doc, "button.cr-grid-more");
  await sleep(20);
  check("Show more: the last page is the remainder, and the bar leaves",
    painted(doc) === N && !doc.querySelector(".cr-grid-morewrap"));

  const search = doc.getElementById("cr-search");
  search.value = "credential"; search.oninput();
  await sleep(20);
  check("a changed view starts again at one page", painted(doc) === 200);

  click(doc, "button.cr-grid-all");
  await sleep(20);
  check("Show all paints every row", painted(doc) === N && !doc.querySelector(".cr-grid-morewrap"));

  search.value = "credential 1"; search.oninput();
  await sleep(20);
  check("a filtered view under one page paints whole, with no bar",
    painted(doc) === 100 && !doc.querySelector(".cr-grid-morewrap"));
  search.value = ""; search.oninput();
  await sleep(20);

  const grp = doc.getElementById("cr-group-by");
  if (grp) {
    grp.value = "disc"; grp.onchange();
    await sleep(20);
    const hdrs = Array.from(doc.querySelectorAll(".cr-group-hdr")).map(txt);
    check("grouped: the budget holds across groups", painted(doc) === 200);
    // Agriculture (150) + 50 of Business fill the page; Zoology's header must not paint.
    check("grouped: no header is painted past the page",
      hdrs.length === 2 && /Agriculture/.test(hdrs[0]) && /Business/.test(hdrs[1]));
  } else {
    check("grouped: the group control exists", false);
  }

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();

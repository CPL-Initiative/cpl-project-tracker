// Session 107 (2026-07-08) — Sam's ask 4: the issuer lookup affordances.
// 🔎 opens his exact manual web-search question in a new tab (built from the
// CURRENT title input); ✨ asks Claude via the existing report proxy
// (window.CPL_REPORT_PROXY_URL) and offers the answer as a click-to-fill
// chip — a RECOMMENDATION, never auto-saved. ✨ renders only when the proxy
// is configured.
//
// Run from repo root: `npm test` (or `node tests/cer_issuer_lookup.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("credential_reference.js", "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

const payload = { _generated_at: "t", top_categories: {}, unified_titles: [
  { ut: "Aspects of Building and Safety", raw_count: 1, conf_title: 0.6,
    issuer: null, cpl_types: ["Credit By Exam"], audit_tags: {},
    audit_tag_total: 0, articulations: [],
    raw_variants: [{ r: "INSPEC 030 - Aspects of Building and Safety", c: 0.6 }] },
] };

function makeDom(opts) {
  opts = opts || {};
  const html = `<!DOCTYPE html><html><body>
  <div id="tab-credential-reference">
    <div id="cr-toolbar"></div><div id="cr-summary"></div><div id="cr-table-wrap"></div>
  </div></body></html>`;
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
  const { window } = dom;
  window.CPL_CREDENTIAL_REFERENCE = payload;
  if (opts.proxy) window.CPL_REPORT_PROXY_URL = "https://proxy.example.org/";
  const log = { writes: [], opened: [], proxyCalls: [] };
  window.confirm = () => true;
  window.open = function (url) { log.opened.push(url); return null; };
  window.fetch = function (url, o) {
    url = String(url); const method = (o && o.method) || "GET";
    const respond = (body, status) => Promise.resolve({
      ok: !status || status < 400, status: status || 200,
      json: () => Promise.resolve(body),
    });
    if (url.indexOf("proxy.example.org") >= 0) {
      log.proxyCalls.push(JSON.parse(o.body));
      return respond({ content: [{ text: opts.proxyAnswer || "International Code Council (ICC)" }] });
    }
    if (url.indexOf("exhibit_audit/latest.json") >= 0) return respond({ title_cards: [] });
    if (url.indexOf("issuer_preseed.json") >= 0) return respond({ staged: {} });
    if (url.indexOf("unclassified_preseed.json") >= 0) return respond({ staged: {} });
    if (url.indexOf("unclassified_suggestions.json") >= 0) return respond({ suggestions: {} });
    if (method === "POST" || method === "DELETE") {
      log.writes.push({ url, body: o.body && JSON.parse(o.body) });
      return respond([], 201);
    }
    return respond([]);
  };
  const jwt = "eyJhbGciOiJIUzI1NiJ9."
    + Buffer.from(JSON.stringify({ email: "map@rccd.edu" })).toString("base64") + ".x";
  window.sessionStorage.setItem("cpl_sb", JSON.stringify({
    access_token: jwt, refresh_token: "rt", email: "map@rccd.edu",
    exp: Date.now() + 3600000 }));
  window.eval(src);
  return { window, log };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // ── A. 🔎 web search — no proxy configured ──
  {
    const { window, log } = makeDom({});
    const doc = window.document;
    await sleep(120);
    doc.querySelector(".cr-triage-btn").click();
    await sleep(120);
    const row = doc.querySelector(".cr-ni-row");
    check("🔎 renders on the lane row", !!row.querySelector(".cr-ni-search"));
    check("✨ does NOT render without CPL_REPORT_PROXY_URL",
      !row.querySelector(".cr-ni-suggest"));
    row.querySelector(".cr-ni-title-input").value = "Aspects of Building & Safety";
    row.querySelector(".cr-ni-search").click();
    check("🔎 opens Sam's exact question with the CURRENT title input, CA-scoped",
      log.opened.length === 1
      && log.opened[0].indexOf("google.com/search") >= 0
      && decodeURIComponent(log.opened[0]).indexOf(
           'who is the agency that issues a "Aspects of Building & Safety" certificate in CA?') >= 0);
    // Sam (2026-07-08 late): course-lead decoration is dropped from the query
    row.querySelector(".cr-ni-title-input").value = "Introduction to Warehouse Management";
    row.querySelector(".cr-ni-search").click();
    check("🔎 strips 'Introduction to' from the search question",
      log.opened.length === 2
      && decodeURIComponent(log.opened[1]).indexOf(
           'who is the agency that issues a "Warehouse Management" certificate in CA?') >= 0);
  }

  // ── B. ✨ suggestion via the proxy — chip fills the issuer input ──
  {
    const { window, log } = makeDom({ proxy: true });
    const doc = window.document;
    await sleep(120);
    doc.querySelector(".cr-triage-btn").click();
    await sleep(120);
    const row = doc.querySelector(".cr-ni-row");
    const aiBtn = row.querySelector(".cr-ni-suggest");
    check("✨ renders when the proxy is configured", !!aiBtn);
    aiBtn.click();
    await sleep(120);
    check("✨ POSTs the exhibit title + raw variant to the proxy",
      log.proxyCalls.length === 1
      && log.proxyCalls[0].messages[0].content.indexOf("Aspects of Building and Safety") >= 0
      && log.proxyCalls[0].messages[0].content.indexOf("INSPEC 030") >= 0);
    const chip = row.querySelector(".cr-ni-suggest-chip");
    check("✨ answer renders as a click-to-fill chip",
      !!chip && /International Code Council \(ICC\)/.test(txt(chip)));
    check("✨ nothing auto-saved (recommendation only)", log.writes.length === 0);
    chip.click();
    check("chip click fills the issuer input (still not saved)",
      row.querySelector(".cr-ni-input").value === "International Code Council (ICC)"
      && log.writes.length === 0);
  }

  // ── C. honest handling of the unknown verdict ──
  {
    const { window, log } = makeDom({ proxy: true, proxyAnswer: "unknown" });
    const doc = window.document;
    await sleep(120);
    doc.querySelector(".cr-triage-btn").click();
    await sleep(120);
    const row = doc.querySelector(".cr-ni-row");
    row.querySelector(".cr-ni-suggest").click();
    await sleep(120);
    check("'unknown' renders the honest no-suggestion line, no chip",
      /no confident suggestion/.test(txt(row.querySelector(".cr-ni-suggest-out")))
      && !row.querySelector(".cr-ni-suggest-chip"));
    check("issuer input untouched on unknown",
      row.querySelector(".cr-ni-input").value === "");
  }

  const failed = results.filter(([, ok]) => !ok);
  results.forEach(([name, ok]) => console.log((ok ? "  ✓ " : "  ✗ ") + name));
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) process.exit(1);
})();

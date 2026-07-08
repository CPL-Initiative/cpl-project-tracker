// Session 108 (2026-07-08) — Sam's ask: the TITLE lookup affordances for
// exhibits titled by a bare course code ("CD-005", "Cinema 24"). The #701
// issuer-lookup pattern applied to the unified-title column of the
// missing-issuer lane: 🔎 opens a code-plus-college web search in a new tab
// (his manual workflow — "CD-005 West Hills Lemoore"); ✨ asks Claude via the
// report proxy and offers the answer as a click-to-fill chip that fills the
// TITLE input — a RECOMMENDATION, never auto-saved. ✨ renders only when the
// proxy is configured. Distinct classes (cr-ni-tsearch / cr-ni-tsuggest) so
// the issuer lookup's hooks never collide.
//
// Run from repo root: `npm test` (or `node tests/cer_title_lookup.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("credential_reference.js", "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

const payload = { _generated_at: "t", top_categories: {}, unified_titles: [
  { ut: "CD-005 — Lemoore High School Articulation", raw_count: 1,
    conf_title: 0.6, issuer: null, cpl_types: ["Credit By Exam"],
    audit_tags: {}, audit_tag_total: 0,
    articulations: [{ local: [{ colleges: ["Lemoore College"] }] }],
    raw_variants: [{ r: "CD-005 articulation Lemoore High  (FA25-SU27)", c: 0.6 }] },
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
      return respond({ content: [{ text: opts.proxyAnswer || "Child Development" }] });
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
    check("🔎 what-is-this renders in the TITLE column",
      !!row.querySelector(".cr-ni-tsearch")
      && row.querySelector(".cr-ni-tsearch").closest("td")
         === row.querySelector(".cr-ni-title-input").closest("td"));
    check("✨ title suggest does NOT render without CPL_REPORT_PROXY_URL",
      !row.querySelector(".cr-ni-tsuggest"));
    check("the issuer lookup keeps its own hooks (no class collision)",
      !!row.querySelector(".cr-ni-search")
      && !row.querySelector(".cr-ni-search.cr-ni-tsearch"));
    row.querySelector(".cr-ni-title-input").value = "CD-005";
    row.querySelector(".cr-ni-tsearch").click();
    check("🔎 opens the code-plus-college search from the CURRENT title input",
      log.opened.length === 1
      && log.opened[0].indexOf("google.com/search") >= 0
      && decodeURIComponent(log.opened[0]).indexOf('"CD-005" Lemoore College course') >= 0);
  }

  // ── B. ✨ suggestion via the proxy — chip fills the TITLE input ──
  {
    const { window, log } = makeDom({ proxy: true });
    const doc = window.document;
    await sleep(120);
    doc.querySelector(".cr-triage-btn").click();
    await sleep(120);
    const row = doc.querySelector(".cr-ni-row");
    const aiBtn = row.querySelector(".cr-ni-tsuggest");
    check("✨ renders when the proxy is configured", !!aiBtn);
    aiBtn.click();
    await sleep(120);
    check("✨ POSTs the current title + raw variant + college to the proxy",
      log.proxyCalls.length === 1
      && log.proxyCalls[0].messages[0].content.indexOf("CD-005 articulation Lemoore High") >= 0
      && log.proxyCalls[0].messages[0].content.indexOf("Lemoore College") >= 0);
    const chip = row.querySelector(".cr-ni-title-input")
      .closest("td").querySelector(".cr-ni-suggest-chip");
    check("✨ answer renders as a click-to-fill chip",
      !!chip && /Child Development/.test(txt(chip)));
    check("✨ nothing auto-saved (recommendation only)", log.writes.length === 0);
    chip.click();
    check("chip click fills the TITLE input (still not saved)",
      row.querySelector(".cr-ni-title-input").value === "Child Development"
      && log.writes.length === 0);
    check("chip click re-arms the row's Save (input event fired)",
      !row.querySelector(".cr-ni-save").disabled);
  }

  // ── C. honest handling of the unknown verdict ──
  {
    const { window, log } = makeDom({ proxy: true, proxyAnswer: "unknown" });
    const doc = window.document;
    await sleep(120);
    doc.querySelector(".cr-triage-btn").click();
    await sleep(120);
    const row = doc.querySelector(".cr-ni-row");
    row.querySelector(".cr-ni-tsuggest").click();
    await sleep(120);
    const out = row.querySelector(".cr-ni-title-input")
      .closest("td").querySelector(".cr-ni-tsuggest-out");
    check("'unknown' renders the honest no-suggestion line, no chip",
      /no confident suggestion/.test(txt(out))
      && !row.querySelector(".cr-ni-title-input").closest("td")
            .querySelector(".cr-ni-suggest-chip"));
    check("title input untouched on unknown",
      row.querySelector(".cr-ni-title-input").value
        === "CD-005 — Lemoore High School Articulation");
  }

  const failed = results.filter(([, ok]) => !ok);
  results.forEach(([name, ok]) => console.log((ok ? "  ✓ " : "  ✗ ") + name));
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) process.exit(1);
})();

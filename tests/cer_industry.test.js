// The industry catalog in the Common Exhibit Reference (2026-10-16), and the
// tab's First Light UI pass.
//
// kb/it_ai_credential_catalog.json (built by kb/_build_it_ai_credential_catalog.py,
// kept current by the weekly credential watch) reaches the CER two ways:
//   1. the "Industry credentials" lane — the whole catalog, read-only, filterable;
//   2. on a CER row MAP has articulated — the issuer's record in the expanded
//      body, and a chip when the issuer retired or renamed the credential.
// The failure modes guarded here: the join keyed on a display override instead
// of the KB key; the catalog failing to load taking the grid down with it; a
// rename or retirement reaching nobody; the lane rendering 1,167 rows at once;
// and the UI pass regressing (a raw hex in the tab's injected CSS, a link that
// acts, a lane toggle with no pressed state).
//
// Run from repo root: `npm test` (or `node tests/cer_industry.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const { cerLane } = require("./_cer_views");

const src = fs.readFileSync("credential_reference.js", "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

const payload = { _generated_at: "t", top_categories: {}, unified_titles: [
  { ut: "AWS Certified SysOps Administrator - Associate", raw_count: 2, conf_title: 0.9,
    issuer: "Amazon Web Services", cpl_types: ["Industry Certification"],
    audit_tags: {}, audit_tag_total: 0, articulations: [] },
  { ut: "Microsoft Certified: Azure AI Engineer Associate", raw_count: 1, conf_title: 0.9,
    issuer: "Microsoft", cpl_types: ["Industry Certification"],
    audit_tags: {}, audit_tag_total: 0, articulations: [] },
  { ut: "CompTIA Security+", raw_count: 5, conf_title: 0.95, issuer: "CompTIA",
    cpl_types: ["Industry Certification"], audit_tags: {}, audit_tag_total: 0, articulations: [] },
  { ut: "ServSafe Manager", raw_count: 3, conf_title: 0.9,
    issuer: "National Restaurant Association", audit_tags: {}, audit_tag_total: 0, articulations: [] },
] };

function cat(id, o) {
  return Object.assign({ id: id, kind: "certification", emerging: false, sources: ["CareerOneStop"],
    domain: "Cloud, networks and systems", map_status: "not in MAP",
    cip: { code: "11.0901", title: "Computer Systems Networking", sector: "11",
      sector_title: "Computer and Information Sciences and Support Services", source: "rule" } }, o);
}
const catalog = {
  _attribution: "CareerOneStop (www.careeronestop.org), sponsored by the U.S. Department of Labor.",
  _inputs: { watch_verified_on: "2026-10-12" },
  _stats: { articulated: 3 },
  credentials: [
    // A rename: MAP's exhibit still carries the old name.
    cat("ITC1", { issuer: "Amazon Web Services", name: "AWS Certified CloudOps Engineer - Associate",
      code: "SOA-C03", status: "active", sources: ["issuer site", "MAP"], verified_on: "2026-10-12",
      formerly: ["AWS Certified SysOps Administrator - Associate"], map_status: "articulated",
      url: "https://aws.amazon.com/certification/certified-cloudops-engineer-associate/",
      map: { titles: ["AWS Certified SysOps Administrator - Associate"], colleges: ["A College", "B College"],
        colleges_n: 2, units_min: 3, units_max: 4 } }),
    // A retirement.
    cat("ITC2", { issuer: "Microsoft", name: "Microsoft Certified: Azure AI Engineer Associate",
      code: "AI-102", status: "retired", map_status: "articulated", verified_on: "2026-10-12",
      notes: "Retired 2026-06-30 and replaced by AI-103.",
      map: { titles: ["Microsoft Certified: Azure AI Engineer Associate"], colleges: ["C College"], colleges_n: 1 } }),
    // Articulated, unchanged, with issuer skills.
    cat("ITC3", { issuer: "CompTIA", name: "CompTIA Security+", code: "SY0-701", status: "active",
      domain: "Cybersecurity", map_status: "articulated",
      ctid: "ce-f89c44b1-b408-4805-8653-8c92da175e31",
      ctdl: { ctdl_type: "ceterms:Certification", rank: 2, collection_count: 8,
        registry_url: "https://credentialengineregistry.org/resources/ce-f89c44b1-b408-4805-8653-8c92da175e31",
        occupation_type: [{ framework: "Standard Occupational Classification", code: "15-1122.00", name: "Information Security Analysts" }],
        industry_type: [{ framework: "NAICS", code: "541519", name: "Other Computer Related Services" }],
        owned_by: [{ ctid: "ce-186fbc60-47e3-4616-b160-72cac9e78f54", name: "CompTIA" }] },
      skills: { kind: "exam domains", exam_version: "SY0-701", source_url: "https://www.comptia.org/",
        domains: [{ domain: "General Security Concepts", weight: 12, skills: ["Compare security controls"] },
                  { domain: "Security Operations", weight: 28 }] },
      map: { titles: ["CompTIA Security+"], colleges: ["D College"], colleges_n: 1 } }),
    // Emerging, not in MAP.
    // Outside IT, no field assigned yet (the CIP is null, never a guess).
    cat("ITC5", { issuer: "National Registry of Example Professionals", name: "Certified Example Technician",
      kind: "license", domain: "Not yet assigned", sources: ["CareerOneStop"], status: null,
      cip: { code: null, title: null, sector: null, sector_title: "Not yet assigned", source: null } }),
    cat("ITC4", { issuer: "CompTIA", name: "CompTIA SecOT+", code: "SOT-001", status: "new",
      emerging: true, domain: "Cybersecurity", sources: ["issuer site"] }),
  ],
};
// Registry-only filler: enough rows to need a second page.
for (let i = 0; i < 130; i++) {
  catalog.credentials.push(cat("ITCX" + i, { issuer: "Vendor " + (i % 7),
    name: "Registry Credential " + String(i).padStart(3, "0") }));
}

function makeDom(opts) {
  opts = opts || {};
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
    const respond = (body, status) => Promise.resolve({
      ok: !status || status < 400, status: status || 200, json: () => Promise.resolve(body) });
    if (url.indexOf("it_ai_credential_catalog.json") >= 0) {
      return opts.catalogFails ? respond(null, 404) : respond(catalog);
    }
    if (url.indexOf("issuer_preseed.json") >= 0) return respond({ staged: {} });
    if (url.indexOf("unclassified_preseed.json") >= 0) return respond({ staged: {} });
    if (url.indexOf("unclassified_suggestions.json") >= 0) return respond({ suggestions: {} });
    if (url.indexOf("exhibit_audit/latest.json") >= 0) return respond({ title_cards: [] });
    return respond([]);
  };
  window.eval(src);
  return { window, log };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lane = (doc, re) => cerLane(doc, re);
const gridRow = (doc, name) => Array.from(doc.querySelectorAll("tr"))
  .find((tr) => tr.querySelector(".cr-title-toggle") && txt(tr.querySelector(".cr-title-toggle")) === name);

(async () => {
  const { window, log } = makeDom({});
  const doc = window.document;
  await sleep(150);

  // ── 1. Load: after the first render, never blocking it ──
  check("load: the catalog is fetched once at init",
    log.urls.filter((u) => u.indexOf("it_ai_credential_catalog.json") >= 0).length === 1);
  const indLane = lane(doc, /Industry credentials/);
  check("lane: Industry credentials chip carries the catalog count",
    !!indLane && /\(135\)/.test(txt(indLane)));

  // ── 2. The join on a CER row: chips on the collapsed row ──
  const sysops = gridRow(doc, "AWS Certified SysOps Administrator - Associate");
  check("chip: a renamed credential says so on the CER row",
    !!sysops && /Renamed by issuer/.test(txt(sysops.querySelector(".cr-chip-indchange"))));
  const ai102 = gridRow(doc, "Microsoft Certified: Azure AI Engineer Associate");
  check("chip: a retired credential says so on the CER row",
    !!ai102 && /Retired by issuer/.test(txt(ai102.querySelector(".cr-chip-indchange"))));
  const secplus = gridRow(doc, "CompTIA Security+");
  check("chip: an unchanged articulated credential carries no change chip",
    !!secplus && !secplus.querySelector(".cr-chip-indchange"));
  check("chip: a credential outside the catalog carries none",
    !gridRow(doc, "ServSafe Manager").querySelector(".cr-chip-indchange"));

  // ── 3. The industry record in the expanded CER row ──
  sysops.querySelector(".cr-caret").click();
  await sleep(30);
  const rec = doc.querySelector(".cr-ind-inrow");
  check("record: the expanded CER row shows the industry record", !!rec && /Industry record/.test(txt(rec)));
  check("record: a rename names the issuer's current title",
    /now names this credential AWS Certified CloudOps Engineer - Associate/.test(txt(rec)));
  check("record: MAP colleges and the units range", /A College, B College \(3 to 4 units\)/.test(txt(rec)));
  const link = rec && rec.querySelector("a.cr-ind-link");
  check("record: the issuer's page opens in a new tab without opener",
    !!link && link.getAttribute("target") === "_blank" && /noopener/.test(link.getAttribute("rel")));

  // ── 4. The lane ──
  lane(doc, /Industry credentials/).click();
  await sleep(30);
  check("lane: pressed state is exposed, not color alone",
    lane(doc, /Industry credentials/).getAttribute("aria-pressed") === "true"
    && lane(doc, /^All/).getAttribute("aria-pressed") === "false");
  const table = doc.querySelector("table.cr-ind-table");
  check("lane: renders the catalog table", !!table);
  check("lane: every header cell carries scope=col",
    Array.from(table.querySelectorAll("th")).every((th) => th.getAttribute("scope") === "col"));
  const rows = () => Array.from(doc.querySelectorAll("tr.cr-ind-row"));
  check("lane: pages at 100 rows rather than painting the whole catalog", rows().length === 100);
  check("lane: what MAP carries sorts first",
    rows().slice(0, 3).every((tr) => /Articulated/.test(txt(tr.querySelector(".cr-ind-map")))));
  check("lane: a registry-only row says so in words",
    rows().some((tr) => txt(tr.querySelector(".cr-ind-status")) === "Registry only"));
  check("summary: carries the CareerOneStop attribution",
    /Department of Labor/.test(txt(doc.getElementById("cr-summary"))));
  doc.querySelector("button.cr-ind-more").click();
  await sleep(30);
  check("lane: Show more reveals the rest", rows().length === 135);

  // Filters: status, emerging, and the toolbar search.
  const st = doc.getElementById("cr-ind-status");
  st.value = "retired"; st.onchange();
  await sleep(30);
  check("filter: status narrows to the retired credential",
    rows().length === 1 && /Azure AI Engineer/.test(txt(rows()[0])));
  st.value = "all"; st.onchange();
  const em = doc.getElementById("cr-ind-emerging");
  em.checked = true; em.onchange();
  await sleep(30);
  check("filter: emerging only", rows().length === 1 && /SecOT\+/.test(txt(rows()[0])));
  em.checked = false; em.onchange();
  const search = doc.getElementById("cr-search");
  search.value = "sysops"; search.oninput();
  await sleep(30);
  check("search: a former name finds the renamed credential",
    rows().length === 1 && /CloudOps/.test(txt(rows()[0])));
  search.value = ""; search.oninput();
  await sleep(30);

  // Expanded catalog row: issuer skills with weights.
  const sec = rows().find((tr) => /CompTIA Security\+/.test(txt(tr)));
  sec.querySelector(".cr-title-toggle").click();
  await sleep(30);
  const tog = rows().find((tr) => /CompTIA Security\+/.test(txt(tr))).querySelector(".cr-title-toggle");
  check("detail: the toggle reports aria-expanded", tog.getAttribute("aria-expanded") === "true");
  const skills = doc.querySelector(".cr-ind-skills");
  check("detail: issuer skills list domains with weights",
    !!skills && /General Security Concepts \(12%\)/.test(txt(skills)) && /Compare security controls/.test(txt(skills)));

  const ctdlRec = doc.querySelector(".cr-ind-record");
  check("detail: a CTID links to its Registry record and shows the CTDL terms",
    !!ctdlRec && !!ctdlRec.querySelector('a[href$="ce-f89c44b1-b408-4805-8653-8c92da175e31"]')
    && /Certification/.test(txt(ctdlRec)) && /rank 2 of 50/.test(txt(ctdlRec))
    && /Occupation 15-1122\.00 Information Security Analysts/.test(txt(ctdlRec))
    && /Industry \(NAICS\) 541519/.test(txt(ctdlRec)));

  // A credential outside IT with no field assigned says so in words, not a blank code.
  const search2 = doc.getElementById("cr-search");
  search2.value = "example technician"; search2.oninput();
  await sleep(30);
  const unassigned = rows().find((tr) => /Certified Example Technician/.test(txt(tr)));
  check("lane: an unassigned field is a word, not a blank CIP code",
    !!unassigned && /Not yet assigned/.test(txt(unassigned)) && !/null|undefined/.test(txt(unassigned)));
  unassigned.querySelector(".cr-title-toggle").click();
  await sleep(30);
  check("detail: an unassigned CIP is explained in words",
    /CIP: not yet assigned/.test(txt(doc.querySelector(".cr-ind-record"))));
  search2.value = ""; search2.oninput();
  await sleep(30);

  // Open in the reference: back to the grid, on that row, expanded.
  rows().find((tr) => /CompTIA Security\+/.test(txt(tr))).querySelector("button.cr-ind-open").click();
  await sleep(30);
  check("open: returns to the grid filtered to the credential",
    !doc.querySelector("table.cr-ind-table") && !!gridRow(doc, "CompTIA Security+")
    && !gridRow(doc, "ServSafe Manager"));

  // ── 5. The UI pass ──
  const css = (doc.getElementById("cr-scope-css") || {}).textContent || "";
  const ind = (doc.getElementById("cr-ind-css") || {}).textContent || "";
  const bareHex = (s) => (s.replace(/var\(--[a-z0-9-]+,\s*#[0-9a-fA-F]{3,8}\)/g, "")
    .match(/#[0-9a-fA-F]{3,8}\b/g) || []);
  check("First Light: no raw hex in the tab's injected CSS (a token fallback is allowed)",
    css.length > 1000 && bareHex(css).length === 0 && bareHex(ind).length === 0);
  check("First Light: controls are underlined words",
    /button\.cr-saveall[^{]*\{border:0;border-radius:0;background:none;color:var\(--cobalt\)[^}]*text-decoration:underline/.test(css));
  check("First Light: the tab ground is a theme token", css.indexOf("background:var(--cer-cream)") >= 0);
  check("a11y: sign-in is a button, not a link that acts",
    !!doc.querySelector("button.cr-auth-link") && !doc.querySelector("a.cr-auth-link"));

  // ── 6. A catalog that fails to load leaves the grid standing ──
  const b = makeDom({ catalogFails: true });
  await sleep(150);
  const bdoc = b.window.document;
  check("failure: the grid still renders", !!gridRow(bdoc, "CompTIA Security+"));
  check("failure: the lane says unavailable", /\(unavailable\)/.test(txt(lane(bdoc, /Industry credentials/))));
  check("failure: no change chips without a catalog", !bdoc.querySelector(".cr-chip-indchange"));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();

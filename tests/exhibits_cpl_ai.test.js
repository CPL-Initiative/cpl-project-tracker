// The CPL-AI recommendations in the Exhibits tab (SkyLantern, 2026-11-06; Sam: "connect CPL-AI in the Exhibits tab and
// make sure we can host all the data, which for now will not have any further updates"). These checks pin:
//   - the views row names CPL-AI recommendations; exhibits_cpl_ai.js loads on first open, never before;
//   - the list: every certification with its pairs by evidence tier, the credit and caveat word for word; a college
//     pick narrows the counts to that college; search and sort;
//   - a certification opens its gzipped shard (a college picked on the list stays picked), its pairs one line each, all three tiers, the tier words filter, a pair
//     opens its full report (domains with evidence, the course outline, sources) and links the same report on CPL-AI;
//   - #exhibits/cpl-ai/<code> opens one certification and the address reads back; a failed read says so;
//   - the hosted files are whole (kb/_build_cpl_ai_hosted.py --check) when present, and the builder keeps one copy
//     of the credit and caveat (it imports them from kb/_build_cpl_ai.py).
//
// Run from repo root: `npm test` (or `node tests/exhibits_cpl_ai.test.js`).
const fs = require("fs");
const zlib = require("zlib");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

const src = fs.readFileSync("exhibits.js", "utf8");
const mod = fs.readFileSync("exhibits_cpl_ai.js", "utf8");
const builder = fs.readFileSync("kb/_build_cpl_ai_hosted.py", "utf8");
check("the builder imports the credit and caveat, never a second copy", /from _build_cpl_ai import CREDIT, CAVEAT/.test(builder) && !/College Futures Foundation/.test(builder.replace(/^"""[\s\S]*?"""/, "")));
check("the view writes nothing", !/method:\s*"(POST|PATCH|DELETE)"/.test(mod) && mod.indexOf("supabase") === -1);
check("no source glyph reaches the screen: the tier is our word, never the source's label", !/source_tier_label/.test(mod.replace(/\/\*[\s\S]*?\*\//g, "")) || !/text:\s*p\.source_tier_label/.test(mod));

// ── fixtures: a two-certification hosted snapshot ──
const CREDIT = "These recommendations were developed through the statewide Credit for Prior Learning & Artificial Intelligence Initiative.";
const CAVEAT = "These recommendations are intended to support local review and decision-making.";
const INDEX = {
  page: "https://map.rccd.edu/CPL-AI/", fetched_at: "2026-11-06T18:08:00Z", credit: CREDIT, caveat: CAVEAT,
  tiers: { "1": "Strong evidence", "2": "Faculty interpretation", "3": "Limited evidence" },
  counts: { pairs: 4, reports: 4, certifications: 2, colleges: 2, courses: 3, by_tier: { "1": 2, "2": 1, "3": 1 } },
  colleges: ["Alpha College", "Beta College"],
  credentials: [
    { code: "ase4", file: "ase4.json.gz", title: "ASE A4: Suspension and Steering", pairs: 3, by_tier: { "1": 1, "2": 1, "3": 1 }, colleges: 2, courses: 2,
      disciplines: ["Automotive Technology"], by_college: { "0": [1, 1, 0], "1": [0, 0, 1] } },
    { code: "ace1", file: "ace1.json.gz", title: "ACE Certified Personal Trainer", pairs: 1, by_tier: { "1": 1, "2": 0, "3": 0 }, colleges: 1, courses: 1,
      disciplines: ["Kinesiology"], by_college: { "1": [1, 0, 0] } }],
};
const SHARD = {
  credential: { code: "ase4", title: "ASE A4: Suspension and Steering", description: "Assesses suspension and steering repair.", competencies: ["Diagnose steering columns", "Service wheel alignment"] },
  courses: {
    c1: { college: "Alpha College", code: "AT 311", title: "Suspension and Steering Systems", discipline: "Automotive Technology", description: "An introduction to suspension.",
      units: { display: "3.0", value: 3 }, outcomes: ["Analyze unsafe conditions"], skills: ["Practice safe work"] },
    c2: { college: "Beta College", code: "AUTO 50", title: "Brakes and Chassis", discipline: "Automotive Technology", description: "", units: null, outcomes: [], skills: [] } },
  sources: ["Certification Document | skills extracted via AI.", "COCI Course Outline of Record | skills extracted via AI."],
  pairs: [
    { id: "ase4_c1", course: "c1", tier: 1, relevance: "RELEVANT", cosine: 0.85, ratio: 1, domains_n: 2, matched_n: 2, explicit: true,
      snapshot: ["Course and certificate evidence was identified for 2 of 2 domains."], disclaimer: "AI-supported evidence summary for faculty review; not a CPL determination.",
      source_tier_label: "Strong Evidence for Review (70%+)",
      domains: [{ name: "Steering systems", courseCovered: true, credentialCovered: true, courseEvidence: ["disassemble and reassemble steering"], credentialEvidence: ["diagnose rack and pinion noise"] },
        { name: "Wheel alignment", courseCovered: true, credentialCovered: true, courseEvidence: ["align wheels"], credentialEvidence: ["perform alignment"] }],
      scope_note: "The certification may include additional domains.", sources: [[1, 0], [2, 1]], report: true },
    { id: "ase4_c1b", course: "c1", tier: 2, relevance: "RELEVANT", cosine: 0.6, ratio: 0.5, domains_n: 2, matched_n: 1, explicit: false, snapshot: [], disclaimer: "", source_tier_label: "",
      domains: [], scope_note: "", sources: [], report: true },
    { id: "ase4_c2", course: "c2", tier: 3, relevance: "PARTIAL", cosine: 0.4, ratio: 0.25, domains_n: 4, matched_n: 1, explicit: false, snapshot: [], disclaimer: "", source_tier_label: "",
      domains: [], scope_note: "", sources: [], report: false }],
};
const GZ = zlib.gzipSync(Buffer.from(JSON.stringify(SHARD)));

function load(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/" + (opts.hash || "#exhibits"), runScripts: "dangerously" });
  const w = dom.window;
  const calls = [];
  // Node's own gzip stream stands in for the browser's.
  w.DecompressionStream = DecompressionStream; w.Response = Response; w.Blob = Blob; w.TextDecoder = TextDecoder;
  w.fetch = function (url) {
    url = String(url); calls.push(url);
    function ok(obj) { return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(obj))) }); }
    function bad(status) { return Promise.resolve({ ok: false, status: status, json: () => Promise.resolve({}) }); }
    if (url === "kb/exhibits_review.json") return ok({ schema: 1, written_at: "2026-11-01T07:50:00Z", sources: {}, tiles: { names: { n: 1, of: 1, waiting: 0 }, aligned: { n: 0, of: 0 } }, steps: {}, colleges: [], held: [] });
    if (url === "kb/cpl_ai/hosted/index.json") return opts.indexFail ? bad(404) : ok(INDEX);
    if (url === "kb/cpl_ai/hosted/shards/ase4.json.gz") {
      const ab = GZ.buffer.slice(GZ.byteOffset, GZ.byteOffset + GZ.byteLength);
      return Promise.resolve({ ok: true, status: 200, arrayBuffer: () => Promise.resolve(ab) });
    }
    if (/\/rest\/v1\//.test(url)) return ok([]);
    return bad(404);
  };
  w.CPL_SESSION = { ensureFresh: () => Promise.resolve(null), authHeaders: (x) => Object.assign({ apikey: "anon" }, x || {}), viewAddress: (tab, fn) => { w.__addr = fn; } };
  w.CPL_TABS = { loadScript: function (file, name, cb) {
    calls.push("loadScript:" + file);
    const files = { "exhibits_cpl_ai.js": mod, "commons_page.js": fs.existsSync("commons_page.js") ? fs.readFileSync("commons_page.js", "utf8") : "" };
    if (files[file]) { const e = w.document.createElement("script"); e.textContent = files[file]; w.document.body.appendChild(e); }
    setTimeout(cb, 0);
  } };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w, d: w.document, M: w.CPL_EXHIBITS, calls };
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms || 0));
async function settle() { for (let i = 0; i < 12; i++) await wait(5); }
function viewBtn(d, name) { return Array.from(d.querySelectorAll(".exh-views button")).find((b) => txt(b).indexOf(name) === 0); }
function btn(d, words) { return Array.from(d.querySelectorAll("#exh-cplai button")).find((b) => txt(b) === words); }

(async function () {
  let t = load();
  await t.M.boot(); await settle();
  check("the module is not read until the view opens", !t.calls.includes("loadScript:exhibits_cpl_ai.js") && !t.calls.includes("kb/cpl_ai/hosted/index.json"));
  const vb = viewBtn(t.d, "CPL-AI recommendations");
  check("the views row names CPL-AI recommendations", !!vb);
  vb.click(); await settle();
  check("it is current, counting every pair", /^CPL-AI recommendations/.test(txt(t.d.querySelector('.exh-views [aria-current="page"]'))) && txt(t.d.querySelector('.exh-views [aria-current="page"] .exh-n')) === "4");
  const root = t.d.getElementById("exh-cplai");
  check("the credit and caveat, word for word", txt(root).indexOf(CREDIT) >= 0 && txt(root).indexOf(CAVEAT) >= 0);
  check("the counts line names all three tiers", /4 pairs: 2 certifications, 2 colleges, 3 courses; 2 strong evidence, 1 faculty interpretation, 1 limited evidence\./.test(txt(root)));
  let trs = Array.from(root.querySelectorAll("tbody tr"));
  check("every certification, A to Z, its pairs by tier", trs.length === 2 && /^ACE Certified/.test(txt(trs[0].querySelector("th")))
    && Array.from(trs[1].querySelectorAll("td")).slice(0, 5).map(txt).join("|") === "1|1|1|2|2");
  check("a labeled region, row and column headers", root.querySelector('.exh-tblwrap[role="region"][aria-label="CPL-AI certifications"]') && root.querySelectorAll('th[scope="col"]').length === 7);
  check("the address reads exhibits/cpl-ai", t.w.__addr() === "exhibits/cpl-ai");
  const sel = t.d.getElementById("cai-college");
  sel.value = "Beta College"; sel.dispatchEvent(new t.w.Event("change")); await settle();
  trs = Array.from(t.d.querySelectorAll("#exh-cplai tbody tr"));
  check("a college pick narrows the counts to that college", trs.length === 2 && Array.from(trs[1].querySelectorAll("td")).slice(0, 3).map(txt).join("|") === "0|0|1"
    && /paired at Beta College/.test(txt(t.d.getElementById("exh-cplai"))));
  sel.value = "Alpha College"; sel.dispatchEvent(new t.w.Event("change")); await settle();
  check("a college with no pair for a certification drops it", t.d.querySelectorAll("#exh-cplai tbody tr").length === 1);
  btn(t.d, "Most strong evidence first").click(); await settle();
  check("a sort word is pressed", btn(t.d, "Most strong evidence first").getAttribute("aria-pressed") === "true");

  // A certification.
  btn(t.d, "ASE A4: Suspension and Steering").click(); await settle(); await settle();
  let r2 = t.d.getElementById("exh-cplai");
  check("the shard is read once, gzipped, and unpacked", t.calls.filter((c) => c === "kb/cpl_ai/hosted/shards/ase4.json.gz").length === 1 && /Assesses suspension and steering repair/.test(txt(r2)));
  check("the address reads exhibits/cpl-ai/ase4", t.w.__addr() === "exhibits/cpl-ai/ase4");
  check("the competencies fold", r2.querySelector("details.cai-more summary") && /Competencies the certification names \(2\)/.test(txt(r2.querySelector("details.cai-more summary"))));
  let prs = Array.from(r2.querySelectorAll("#cai-pairs-wrap tbody tr"));
  check("a college picked on the list carries into the certification: its pairs first, every tier", prs.length === 2 && /2 of 3 pairs/.test(txt(r2))
    && t.d.getElementById("cai-college2").value === "Alpha College" && prs.every((tr) => txt(tr.children[0]) === "Alpha College"));
  check("a pair is one line: college, course, discipline, evidence, matched, alignment, units", prs[0].children.length === 7
    && Array.from(prs[0].children).map(txt).join("|") === "Alpha College|AT 311 Suspension and Steering Systems|Automotive Technology|Strong evidence|2 of 2|100%|3.0");
  btn(t.d, "Limited evidence").click(); await settle();
  prs = Array.from(t.d.querySelectorAll("#cai-pairs-wrap tbody tr"));
  check("a tier word filters", prs.length === 2 && btn(t.d, "Limited evidence").getAttribute("aria-pressed") === "false" && !prs.some((tr) => /Limited/.test(txt(tr))));
  btn(t.d, "AT 311 Suspension and Steering Systems").click(); await settle();
  const rep = t.d.querySelector(".cai-report");
  check("a pair opens its report", rep && txt(t.d.getElementById("cai-rep-h")) === "Alpha College, AT 311 Suspension and Steering Systems");
  check("the report: evidence, scores, snapshot, the CPL-AI disclaimer", /Strong evidence/.test(txt(rep)) && /Alignment ratio100%/.test(txt(rep)) && /2 of 2 domains/.test(txt(rep)) && /not a CPL determination/.test(txt(rep)));
  const dom = Array.from(rep.querySelectorAll(".cai-dom tbody tr"));
  check("the domains with both sides' evidence, in words", dom.length === 2 && Array.from(dom[0].children).map(txt).join("|") === "Steering systems|Covered|Covered|disassemble and reassemble steering|diagnose rack and pinion noise");
  check("the course outline and the sources fold under the report", /Analyze unsafe conditions/.test(txt(rep)) && /COCI Course Outline of Record/.test(txt(rep)));
  const link = rep.querySelector('a[href*="?report="]');
  check("the same report on the CPL-AI page, in a new tab", link && link.href === "https://map.rccd.edu/CPL-AI/?report=ase4_c1#recommendations" && link.target === "_blank" && /noopener/.test(link.rel));
  check("the source's colored label never shows", !/70%\+/.test(txt(rep)));
  btn(t.d, "Close the report").click(); await settle();
  check("Close the report", !t.d.querySelector(".cai-report"));
  btn(t.d, "All certifications").click(); await settle();
  check("All certifications returns to the list, the filters reset", t.d.querySelectorAll("#exh-cplai tbody tr").length === 2 && t.d.getElementById("cai-college").value === "");

  // The pure parts.
  const C = t.w.CPL_EXHIBITS_CPLAI;
  check("pure: pairRows by college and search", C._pairRows(SHARD, { q: "brakes", college: "", tiers: { 1: true, 2: true, 3: true } }).map((p) => p.id).join() === "ase4_c2"
    && C._pairRows(SHARD, { q: "", college: "Alpha College", tiers: { 1: true, 2: false, 3: true } }).map((p) => p.id).join() === "ase4_c1");
  const csv = C._pairCsv(INDEX, SHARD, SHARD.pairs).split("\r\n");
  check("pure: the CSV, one line a pair, with its CPL-AI report", csv[0].indexOf("Certification,College,Course") === 0 && csv.length === 5 && /\?report=ase4_c2#recommendations$/.test(csv[3]));
  const plain = Buffer.from(JSON.stringify({ a: 1 }));
  const fromPlain = await C._decode(plain.buffer.slice(plain.byteOffset, plain.byteOffset + plain.byteLength));
  check("decode: a file Pages already unpacked reads as is", fromPlain.a === 1);

  // The route, and a failed read.
  t = load({ hash: "#exhibits/cpl-ai/ase4" });
  await t.M.boot(); await settle(); await settle();
  check("#exhibits/cpl-ai/ase4 opens the certification", txt(t.d.getElementById("cai-cert-h")) === "ASE A4: Suspension and Steering" && t.d.querySelectorAll("#cai-pairs-wrap tbody tr").length === 3);
  t = load({ hash: "#exhibits/cpl-ai", indexFail: true });
  await t.M.boot(); await settle();
  check("a failed read says so", /The CPL-AI data could not be read \(HTTP 404\)/.test(txt(t.d.getElementById("exh-cplai"))));

  // The hosted files, when present, are whole.
  if (fs.existsSync("kb/cpl_ai/hosted/index.json")) {
    const out = require("child_process").spawnSync("python3", ["kb/_build_cpl_ai_hosted.py", "--check"], { encoding: "utf8" });
    check("the hosted snapshot is whole: " + (out.stdout || out.stderr).trim(), out.status === 0);
    const ix = JSON.parse(fs.readFileSync("kb/cpl_ai/hosted/index.json", "utf8"));
    check("the hosted index carries all three tiers and no missing report", Object.keys(ix.tiers).length === 3 && ix.missing_reports.length === 0 && ix.counts.reports === ix.counts.pairs);
  }

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0]));
  console.log((results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });

// The Exhibits tab's read-only side by side (exhibits.js exhSbsBody; S678, COBIx's item 7 on #3464,
// exhibits/ask-sky-side-by-side.md): one row per MAP exhibit with its local title, canonical title, official source
// and CPL type, in the List's side panel (under Members) and on the Review card (under its Source line).
//
// WHAT THIS GUARDS:
//   (1) the List panel and the Review card each carry a "Side by side" view, closed, and kb/exhibit_side_by_side.json
//       is read only when one opens, and once;
//   (2) ⭐ one row per MAP exhibit: the id (a link to MAP), the local title as the college entered it, the canonical
//       title (the proposed one on a Review card), the official source, and the CPL type with where it came from
//       (MAP's cpl_type_description, or the path in the exhibit id when MAP's type is not on the record);
//   (3) a certification's missing official name and a college course the Review builder set aside are said on the
//       row, in words;
//   (4) ⭐ read-only: opening it sends no POST, PATCH or DELETE, and it holds no button, input or select;
//   (5) the table scrolls inside its own named region, with th scope on every header, and its CSS names no raw hex.
//
// The view reads the committed kb/exhibit_side_by_side.json, so a rebuild that loses a fixture's figures fails here.
// Run from repo root: `npm test` (or `node tests/exhibits_side_by_side.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) {
  if (!el) return "";
  const parts = [], walk = el.ownerDocument.createTreeWalker(el, 4);
  while (walk.nextNode()) parts.push(walk.currentNode.nodeValue);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}
const src = fs.readFileSync("exhibits.js", "utf8");
const SBS = JSON.parse(fs.readFileSync("kb/exhibit_side_by_side.json", "utf8"));
const css = src.slice(src.indexOf('".exh-sbs {'), src.indexOf('"@media (prefers-reduced-motion: reduce) { .exh-wrap'));
check("(5) the view's CSS names no raw hex color", css.length > 50 && !/#[0-9a-fA-F]{3,8}\b/.test(css), css.slice(0, 120));

const CANON = "ASE Bundle — A6 or T6 + L3";
const CREDREF = { _generated_at: "2026-11-17T03:09:28Z", unified_titles: [
  { ut: CANON, issuer: "National Institute for Automotive Service Excellence", trainer: null, students_served: null, served_suppressed: true,
    raw_variants: [{ r: "ASE Certifications: A6 or T6, L3 + Residency Units" }], articulations: [], potential_colleges: [],
    cpl_types: ["Credit By Exam", "Industry Certification"], gen_rec: "", ccc_rec: "", disc_modal: "Automotive Technology", raw_count: 1 }] };
const ADOPT = { schema: 1, written_at: "2026-11-17T03:09:28Z", colleges: ["Rio Hondo College"], cip_sectors: {},
  credentials: { [CANON]: { a: {}, c: {},
    x: [["MAPCXI-ACAO-1-001", "ASE Certifications: A6 or T6, L3 + Residency Units", 3], ["MAPICI-ACAO-1-001", "ASE Certifications: A6 or T6, L3 + Residency Units", 3],
        ["MAPCXS-B0BL-1-001", "BUS 018: Business Law", 4]], s: "47", p: 3 } } };
const AATA = "American Aerospace Technical Academy Non Destructive Testing Technician Apprenticeship Journeyperson";
const REVIEW = { schema: 1, written_at: "2026-11-17T07:50:00Z", sources: { procedures_run: "2026-11-17T07:47:00Z" },
  tiles: { names: { n: 10, of: 12, waiting: 2 }, aligned: { n: 0, of: 2 }, saved_not_folded: 0 }, steps: {},
  colleges: ["Foothill College"],
  held: [{ raw: AATA, step: "Proposed", why: "the classifier is unsure (0.65)", colleges: [0],
    title: "Nondestructive Testing Technician Apprenticeship — Journeyperson", issuer: "American Aerospace Technical Academy (AATA)",
    from: "the classifier", ids: ["MAPICA-AATA-1-001"], art: [0], could: [], basis: "M-ID INDT M1154", same: true, under: [], under_count: 0,
    needs_official_name: true,
    course_title_set_aside: { title: "Ultrasonic Testing Level One", basis: "M-ID INDT M1154", why: "industry certification, not credit by exam" },
    course: "AATA 103A", course_college: "Foothill College" }] };

function load(hash) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/" + hash, runScripts: "dangerously" });
  const w = dom.window, calls = [];
  const files = { "kb/exhibits_review.json": REVIEW, "kb/exhibits_adoption.json": ADOPT, "kb/exhibit_side_by_side.json": SBS,
    "kb/exhibits_related.json": { schema: 1, issuers: [], paths: {}, titles: [], pending: {}, batches: [], families: {} } };
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    calls.push({ url: url, method: String(init.method || "GET").toUpperCase() });
    function ok(obj) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(obj))); } }); }
    if (Object.prototype.hasOwnProperty.call(files, url)) return ok(files[url]);
    if (/\/rest\/v1\/(kb_curation|rpc)/.test(url)) return ok([]);
    return Promise.resolve({ ok: false, status: 404, json: function () { return Promise.resolve({}); } });
  };
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve(null); }, authHeaders: function () { return { apikey: "anon" }; } };
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    if (s === "credential_reference_data.js") w[name] = JSON.parse(JSON.stringify(CREDREF));
    if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = fs.readFileSync("commons_list.js", "utf8"); w.document.body.appendChild(e); }
    setTimeout(cb, 0);
  } };
  w.cplCollegeShort = function (n) { return n.replace(/ College$/, ""); };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS, calls: calls };
}
function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
async function settle() { for (let i = 0; i < 10; i++) await tick(); }
function sbsReads(t) { return t.calls.filter((c) => /exhibit_side_by_side/.test(c.url)).length; }
function rows(node) { return Array.from(node.querySelectorAll(".exh-sbs-table tbody tr")).map((tr) => Array.from(tr.children).map(txt)); }
async function openIt(t, sel) {
  const f = t.d.querySelector(sel);
  f.open = true; f.dispatchEvent(new t.w.Event("toggle"));
  await settle(); await settle();
  return t.d.querySelector(sel);
}

(async function () {
  // ── the List's side panel ──
  {
    const t = load("#exhibits/list");
    await t.M.boot(); await settle(); await settle();
    const btn = Array.from(t.d.querySelectorAll("td.exh-l-title .exh-l-open")).find((b) => txt(b) === CANON);
    check("the List shows the fixture credential", !!btn);
    if (btn) btn.click();
    await settle(); await settle();
    let f = t.d.querySelector("#exh-l-panel details.exh-sbs");
    check("(1) ⭐ the List panel carries the side by side, closed", !!f && !f.open && /^Side by side/.test(txt(f.querySelector("summary"))), f && txt(f.querySelector("summary")));
    // Opening the panel reads the file once, for each member's CPL type (issue 3510, C1); the fold reuses it.
    check("(1) the panel reads its file once, for the members' CPL types", sbsReads(t) === 1, String(sbsReads(t)));
    const before = t.calls.length;
    f = await openIt(t, "#exh-l-panel details.exh-sbs");
    const r = rows(f);
    check("(2) ⭐ one row per MAP exhibit", r.length === 3, JSON.stringify(r));
    const cx = r.find((x) => x[0] === "MAPCXI-ACAO-1-001"), ic = r.find((x) => x[0] === "MAPICI-ACAO-1-001"), bl = r.find((x) => x[0] === "MAPCXS-B0BL-1-001");
    check("(2) the local title as the college entered it, and the canonical title", ic && ic[1] === "ASE Certifications: A6 or T6, L3 + Residency Units" && ic[2] === CANON, JSON.stringify(ic));
    check("(2) ⭐ a certification's official source: the issuer's official names, with the issuer",
      ic && /Automobile & Light Truck Certification - A6 Electrical\/Electronic Systems, issued by National Institute for Automotive Service Excellence/.test(ic[3])
        && /Light Duty Hybrid\/Electric Vehicle Specialist Certification - L3/.test(ic[3]), ic && ic[3]);
    check("(2) ⭐ graded credit's official source: the official course, its id in parentheses",
      cx && cx[3] === "Official course: Introduction to Alternative Fuels & Hybrid and Electric Vehicle Technology (AUTO M10IS).", cx && cx[3]);
    check("(2) the CPL type from MAP's own record, with graded or cert-based", cx && cx[4] === "Credit By Exam, graded" && ic && ic[4] === "Industry Certification, cert-based", JSON.stringify([cx && cx[4], ic && ic[4]]));
    check("(2) ⭐ the CPL type from the exhibit id when MAP's type is not on the record",
      bl && bl[4] === "Credit by exam, graded (read from the exhibit id; MAP's type is not on the record)", bl && bl[4]);
    const link = f.querySelector("tbody a.exh-pn-id");
    check("(2) the exhibit id opens it in MAP", link && /MAP/.test(link.getAttribute("aria-label") || "") && link.getAttribute("target") === "_blank");
    check("(4) ⭐ no button, input or select in the view", f.querySelectorAll("button, input, select, textarea").length === 0);
    const wrap = f.querySelector(".exh-sbs-wrap");
    check("(5) the table scrolls inside its own named region", wrap && wrap.getAttribute("role") === "region" && /side by side/.test(wrap.getAttribute("aria-label") || ""));
    check("(5) th scope on every header", Array.from(f.querySelectorAll("th")).every((th) => th.getAttribute("scope") === "col"));
    check("(4) ⭐ opening it sends no POST, PATCH or DELETE", t.calls.slice(before).every((c) => c.method === "GET") && t.calls.every((c) => c.method === "GET"), JSON.stringify(t.calls.filter((c) => c.method !== "GET")));
    check("(1) its file is read once", sbsReads(t) === 1, String(sbsReads(t)));
  }
  // ── the Review card ──
  {
    const t = load("#exhibits");
    await t.M.boot(); await settle();
    let f = t.d.getElementById("exh-sbs");
    check("(1) ⭐ the Review card carries the side by side, closed", !!f && !f.open, f ? txt(f) : "none");
    check("(1) its file is not read before it opens", sbsReads(t) === 0, String(sbsReads(t)));
    if (f) {
      f = await openIt(t, "#exh-sbs");
      const r = rows(f);
      check("(2) one row per exhibit behind the card", r.length === 1 && r[0][0] === "MAPICA-AATA-1-001", JSON.stringify(r));
      const x = r[0] || [];
      check("(2) the local title and the proposed canonical", x[1] === AATA && x[2] === "Nondestructive Testing Technician Apprenticeship — Journeyperson", JSON.stringify(x));
      check("(2) the header says the canonical is proposed", /Proposed canonical title/.test(txt(f.querySelector("thead"))));
      check("(3) ⭐ the missing official name and the set-aside course, in words",
        x[3] === "The official certification name is not on file. Foothill College AATA 103A (Ultrasonic Testing Level One) was set aside: this exhibit is an industry certification, not credit by exam.", x[3]);
      check("(2) its CPL type read from the id", x[4] === "Industry certification, cert-based (read from the exhibit id; MAP's type is not on the record)", x[4]);
      check("(4) ⭐ opening it sends no POST, PATCH or DELETE", t.calls.every((c) => c.method === "GET"), JSON.stringify(t.calls.filter((c) => c.method !== "GET")));
      check("(4) and it holds no control", f.querySelectorAll("button, input, select, textarea").length === 0);
      check("(1) its file is read once", sbsReads(t) === 1, String(sbsReads(t)));
    }
  }
  const failed = results.filter(function (r) { return !r[1]; });
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n     " + r[2])); });
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });

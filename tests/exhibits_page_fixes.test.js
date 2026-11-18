// The Exhibits page fixes of issue 3510, section C (S683). Guards:
//   (1) every canonical title on the List's rows carries its CPL type in plain words, under the title and outside its
//       control (so the button's name stays the title); a credential the reference gives no type (no articulation yet)
//       takes its local titles' types from the side by side file, and says "not recorded" only when both are empty;
//       a self-recall floor on the committed data holds "not recorded" to the rows where both really are empty;
//       each local title carries its CPL type too: the panel's Members table has a CPL type column, and the Title
//       drawer's local titles each name theirs (Sam: "I need to have the Cpl type for each canon and local title nearby");
//   (2) each of the renamed titles to look at has its action: a title still in the reference opens in the List's side
//       panel (where the List's own Rename and Flag save it), a dead end says the List has no row for it; the action is
//       keyed on the reference itself, else the list's in_reference field, never on the words; a self-recall check on
//       the committed kb/exhibits_review.json and credential_reference_data.js; no new kb_curation field, and drawing
//       the list writes nothing;
//   (3) the No Common SUBJ filter reads kb/exhibit_subject_out/worklist.json once, only when chosen, says why EVERY row
//       is there (the fill's reason, the subject it would give, or why its list leaves the title out), states the
//       filter's own count beside the fill's, and the file is on the Pages allowlist so the live site serves it;
//   (4) tokens only, no raw hex, no glyph, American spelling in the new words.
// Run from repo root: `npm test` (or `node tests/exhibits_page_fixes.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const src = fs.readFileSync("exhibits.js", "utf8");

const CREDREF = { _generated_at: "2026-11-18T05:19:00+00:00", unified_titles: [
  { ut: "Heating and Air Conditioning", issuer: "ASE", cpl_types: ["Industry Certification"], raw_count: 2,
    raw_variants: [{ r: "HVAC Cert", c: 0.9 }, { r: "Heating and AC exam", c: 0.8 }], articulations: [{ cid: "HVAC M10", sys: "M-ID" }] },
  { ut: "Water Supply", issuer: "", cpl_types: ["Credit By Exam", "Portfolio Review"], raw_count: 1, articulations: [{ cid: "WATR M10", sys: "M-ID" }] },
  { ut: "3D Digital Modeling", issuer: "Corona-Norco Unified School District", cpl_types: [], raw_count: 1, articulations: [] },
  { ut: "Nothing Yet", issuer: "", cpl_types: ["Military"], raw_count: 1, articulations: [] },
  { ut: "Bare Cert", issuer: "", cpl_types: [], raw_count: 1, raw_variants: [{ r: "HVAC Cert", c: 0.7 }], articulations: [] },
  { ut: "Brand New", issuer: "", cpl_types: [], raw_count: 1, articulations: [] }
] };
const ADOPT = { schema: 1, cip_sectors: {}, colleges: [], credentials: {
  "Heating and Air Conditioning": { x: [["MAPICI-HVAC-1-001", "HVAC Cert", 3], ["MAPCXS-HVAC-1-002", "Heating and AC exam", 2]] } } };
const SBS = { schema: 1, exhibits: {
  "MAPICI-HVAC-1-001": { l: "HVAC Cert", c: "Heating and Air Conditioning", t: "Industry Certification", ts: "map", k: "cert-based" },
  "MAPCXS-HVAC-1-002": { l: "Heating and AC exam", c: "Heating and Air Conditioning", t: "Credit By Exam", ts: "id", k: "graded" } } };
const WORKLIST = { schema: 1, written_at: "2026-11-17T17:10:05Z", mode: "preview", not_yet_written: 132, no_subject: 499, items: [
  { title: "3D Digital Modeling", why: "no signal", issuer: "Corona-Norco Unified School District", exhibits: ["MAPCxH-3DMH-1-001"], suggested: "MAKR", suggested_from: "title words (a suggestion, never a decision)" },
  { title: "Nothing Yet", why: "courses split", issuer: "", exhibits: [] }],
  pending: [{ title: "Bare Cert", subject: "HVAC", source: "courses, one college" }] };
const REVIEW_LIST = [
  { title: "Water Supply", kind: "dead retire", words: "Retired into “Credit by Exam”, which is no longer in the reference, so it is no search alias. It is in the reference again itself." },
  { title: "Old Carpentry", kind: "dead end", words: "Renamed to “Gone Title”, which is no longer in the reference." },
  { title: "Heating and Air Conditioning", kind: "brought back", words: "Renamed once and back in the reference, so it reads as itself. Brought back by a curator on 2026-10-18." }
];

function load(hash, opt) {
  opt = opt || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/" + (hash || "#exhibits/list"), runScripts: "dangerously" });
  const w = dom.window, calls = [];
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    calls.push({ url: url, method: (init.method || "GET").toUpperCase() });
    const ok = function (o) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(o))); } }); };
    if (url === "kb/exhibits_review.json") return ok({ schema: 1, written_at: "2026-11-18T05:22:00Z", sources: {},
      tiles: { names: { n: 1, of: 2, waiting: 1 }, aligned: { n: 0, of: 0 }, review_list: { n: REVIEW_LIST.length, unacknowledged: 0 } },
      steps: {}, colleges: [], held: [], review_list: opt.review || REVIEW_LIST });
    if (url === "kb/exhibits_adoption.json") return ok(ADOPT);
    if (url === "kb/exhibit_side_by_side.json") return ok(SBS);
    if (url === "kb/exhibit_subject_out/worklist.json") return ok(WORKLIST);
    if (/\/rest\/v1\/kb_curation/.test(url)) return ok([]);
    return Promise.resolve({ ok: false, status: 404, json: function () { return Promise.resolve({}); } });
  };
  const sess = { access_token: "a.b.c", email: "reviewer@example.org" };
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve(sess); },
    authHeaders: function () { return { apikey: "anon-key", Authorization: "Bearer anon-key" }; } };
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = fs.readFileSync("commons_list.js", "utf8"); w.document.body.appendChild(e); }
    calls.push({ url: s, method: "SCRIPT" });
    if (s === "credential_reference_data.js") w[name] = opt.realRef ? REAL_REF() : JSON.parse(JSON.stringify(CREDREF));
    setTimeout(cb, 0); } };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS, calls: calls };
}
let realRef = null;
function REAL_REF() {
  if (!realRef) { const w = {}; new Function("window", fs.readFileSync("credential_reference_data.js", "utf8"))(w); realRef = w.CPL_CREDENTIAL_REFERENCE; }
  return realRef;
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 14; i++) await tick(); }
function rows(d) { return Array.from(d.querySelectorAll(".exh-l-table tbody tr:not(.exh-l-editrow)")); }
function rowOf(d, title) { return rows(d).find((tr) => Array.from(tr.querySelectorAll("button")).some((b) => txt(b) === title)); }
function reads(t, re) { return t.calls.filter((c) => re.test(c.url)).length; }
function writes(t) { return t.calls.filter((c) => c.method !== "GET" && /kb_curation/.test(c.url)); }

(async function () {
  // ── (1) the CPL type beside every canonical and local title ──
  const t = load("#exhibits/list");
  await t.M.boot(); await settle();
  const hv = rowOf(t.d, "Heating and Air Conditioning");
  check("the List shows the fixture credentials", rows(t.d).length === 6 && !!hv, rows(t.d).map(txt).join(" | "));
  const ty = hv && hv.querySelector("[data-cpl-type]");
  check("(1) ⭐ a canonical title's row names its CPL type under the title", ty && txt(ty) === "CPL type: Industry Certification", ty && txt(ty));
  check("(1) the type sits outside the title's control, so the button's name stays the title",
    ty && !ty.closest("button") && Array.from(hv.querySelectorAll("button")).some((b) => txt(b) === "Heating and Air Conditioning"));
  check("(1) two types read in words", txt(rowOf(t.d, "Water Supply").querySelector("[data-cpl-type]")) === "CPL type: Credit By Exam and Portfolio Review");
  check("(1) no type on the credential or its local titles says so, never a blank", txt(rowOf(t.d, "3D Digital Modeling").querySelector("[data-cpl-type]")) === "CPL type: not recorded");
  check("(1) ⭐ a credential the reference gives no type takes its local titles' types, and says where they came from",
    txt(rowOf(t.d, "Bare Cert").querySelector("[data-cpl-type]")) === "CPL type: Industry Certification (from its local titles)", txt(rowOf(t.d, "Bare Cert")));
  check("(1) every row carries one", rows(t.d).every((tr) => !!tr.querySelector("[data-cpl-type]")));
  check("(1) the List reads the side by side file once", reads(t, /exhibit_side_by_side/) === 1);
  check("(3) the subject worklist is not read before its filter is chosen", reads(t, /exhibit_subject_out/) === 0);

  // the panel: the Members table's CPL type column
  Array.from(hv.querySelectorAll("button")).find((b) => txt(b) === "Heating and Air Conditioning").click(); await settle();
  const pn = t.d.getElementById("exh-l-panel");
  const mt = pn && Array.from(pn.querySelectorAll("table")).find((tb) => Array.from(tb.querySelectorAll("th")).some((th) => /^Local title/.test(txt(th))));
  const heads = mt ? Array.from(mt.querySelectorAll("th")).map(txt) : [];
  check("(1) ⭐ the panel's Members table has a CPL type column beside the local title", heads.indexOf("CPL type") === heads.findIndex((h) => /^Local title/.test(h)) + 1, heads.join(","));
  const mrows = mt ? Array.from(mt.querySelectorAll("tbody tr")).map((tr) => Array.from(tr.children).map(txt)) : [];
  const ti = heads.indexOf("CPL type"), li = heads.findIndex((h) => /^Local title/.test(h));
  const byLocal = {}; mrows.forEach((r) => { byLocal[r[li]] = r[ti]; });
  check("(1) each member's CPL type is its own exhibit's", byLocal["HVAC Cert"] === "Industry Certification"
    && byLocal["Heating and AC exam"] === "Credit By Exam (read from the exhibit id)", JSON.stringify(byLocal));
  check("(1) the panel reads no second copy of the side by side file", reads(t, /exhibit_side_by_side/) === 1);
  check("(1) the panel's bar keeps focus while the file arrives", t.d.activeElement && t.d.activeElement.id === "exh-l-panel-t", t.d.activeElement && t.d.activeElement.outerHTML.slice(0, 120));

  // the Title drawer, which the List moves into the panel: each local title names its type
  const dr = pn && pn.querySelector(".exh-l-pdrawer");
  check("(1) ⭐ the panel's local titles each name their CPL type", !!dr && /HVAC Cert \(title 90%\)\. CPL type: Industry Certification\./.test(txt(dr))
    && /Heating and AC exam \(title 80%\)\. CPL type: Credit By Exam\./.test(txt(dr)), dr && txt(dr).slice(0, 300));

  // ── (3) the No Common SUBJ filter says why ──
  const s3 = load("#exhibits/list/nosubj");
  await s3.M.boot(); await settle();
  check("(3) the filter shows the credentials with no subject", rows(s3.d).length === 4, rows(s3.d).map(txt).join(" | "));
  check("(3) ⭐ the filter reads the subject fill's worklist, once", reads(s3, /^kb\/exhibit_subject_out\/worklist\.json$/) === 1);
  const why = rowOf(s3.d, "3D Digital Modeling").querySelector("[data-subj-why]");
  check("(3) ⭐ each row says why it is there, with the title words' suggestion marked as one",
    txt(why) === "Why no Common SUBJ: no course colleges credit for it and no issuer family names a subject; its title words suggest MAKR, a suggestion only.", txt(why));
  check("(3) a split reads in words", txt(rowOf(s3.d, "Nothing Yet").querySelector("[data-subj-why]")) === "Why no Common SUBJ: the courses colleges credit for it split between subjects.");
  check("(3) ⭐ a title the fill would fill says the subject it would give",
    txt(rowOf(s3.d, "Bare Cert").querySelector("[data-subj-why]")) === "Why no Common SUBJ: the subject fill would give it HVAC, from the courses one college credits for it, once the nightly fill is turned on.",
    txt(rowOf(s3.d, "Bare Cert").querySelector("[data-subj-why]")));
  check("(3) ⭐ a title the fill's list leaves out says why",
    /^Why no Common SUBJ: the subject fill's list of Nov 17, 2026 does not name it; .*new or renamed since then/.test(txt(rowOf(s3.d, "Brand New").querySelector("[data-subj-why]"))),
    txt(rowOf(s3.d, "Brand New").querySelector("[data-subj-why]")));
  check("(3) ⭐ every row on the filter carries a reason", rows(s3.d).every((tr) => !!tr.querySelector("[data-subj-why]")));
  const note = s3.d.querySelector("[data-subj-note]");
  check("(3) the note states the filter's own count beside the fill's, what waits and what the fill would take",
    note && /^4 credentials have no Common SUBJ in the List today, and each says why under its title\. The subject fill counted 499 when it last looked \(Nov 17, 2026\): 2 wait for a person, and the fill would take 132 more from the courses colleges credit for them, once the nightly fill is turned on; today it only previews, so it has written none\.$/.test(txt(note)), txt(note));
  check("(3) the reason shows only on that filter", !t.d.querySelector("[data-subj-why]"));
  const allow = fs.readFileSync(".github/pages_allowlist.txt", "utf8");
  check("(3) ⭐ the Pages allowlist publishes the worklist", /^publish kb\/exhibit_subject_out\/worklist\.json$/m.test(allow));
  const wl = JSON.parse(fs.readFileSync("kb/exhibit_subject_out/worklist.json", "utf8"));
  const flat = JSON.stringify(wl);
  check("(3) the published worklist carries no email address or reviewer", !/@/.test(flat) && !/reviewer|email/i.test(flat));
  check("(3) the committed worklist carries the fields the page reads", Array.isArray(wl.items) && wl.items.every((x) => typeof x.title === "string" && typeof x.why === "string"));

  // ── (2) the renamed titles' actions ──
  const rv = load("#exhibits/renamed");
  await rv.M.boot(); await settle();
  const box = rv.d.getElementById("exh-renamed");
  const lis = box ? Array.from(box.querySelectorAll("li[data-rl-title]")) : [];
  check("(2) the renamed titles list draws", lis.length === 3, box && txt(box));
  const act = (title) => lis.find((li) => li.getAttribute("data-rl-title") === title);
  check("(2) ⭐ a title still in the reference has its action", !!act("Water Supply").querySelector('button[data-rl-act="open"]')
    && !!act("Heating and Air Conditioning").querySelector('button[data-rl-act="open"]'));
  check("(2) a dead end says the List has no row for it", !act("Old Carpentry").querySelector("button")
    && txt(act("Old Carpentry").querySelector('[data-rl-act="none"]')) === "The List has no row for it.");
  check("(2) the list says what each action does, and Rename only what it does", /its Rename changes the name the List shows/.test(txt(box))
    && !/undoes or redoes/.test(txt(box)));
  check("(2) drawing the list writes nothing", writes(rv).length === 0, JSON.stringify(writes(rv)));
  act("Water Supply").querySelector('button[data-rl-act="open"]').click(); await settle();
  check("(2) ⭐ the action opens the title in the List's side panel", rv.M._state.view === "list"
    && /(^|: )Water Supply$/.test(txt(rv.d.getElementById("exh-l-panel-t"))), txt(rv.d.getElementById("exh-l-panel-t")));
  check("(2) opening it writes nothing", writes(rv).length === 0);
  const fn = src.slice(src.indexOf("function reviewListLive"), src.indexOf("function stepTile"));
  const fnAll = src.slice(src.indexOf("function reviewListRef"), src.indexOf("function stepTile"));
  check("(2) the action never reads the words", fnAll.length > fn.length && !/\.words|in the reference again/.test(fnAll));

  // the list's own in_reference field decides before the reference is read, and the reference is not read for it
  const fl = load("#exhibits/renamed", { review: REVIEW_LIST.map((r) => Object.assign({}, r, { in_reference: r.title !== "Old Carpentry" })) });
  await fl.M.boot(); await settle();
  const flBox = fl.d.getElementById("exh-renamed");
  const flAct = (title) => flBox && flBox.querySelector('li[data-rl-title="' + title + '"]');
  check("(2) a list that carries in_reference does not read the reference for it", reads(fl, /credential_reference_data/) === 0);
  check("(2) the field decides the action", !!flAct("Water Supply").querySelector('button[data-rl-act="open"]')
    && !!flAct("Old Carpentry").querySelector('[data-rl-act="none"]'));

  // self-recall on the committed data: the action is there exactly when the title is in the reference
  const review = JSON.parse(fs.readFileSync("kb/exhibits_review.json", "utf8")).review_list || [];
  const uts = new Set(REAL_REF().unified_titles.map((r) => r.ut));
  const sr = load("#exhibits/renamed", { review: review, realRef: true });
  await sr.M.boot(); await settle();
  const srBox = sr.d.getElementById("exh-renamed");
  const srLis = srBox ? Array.from(srBox.querySelectorAll("li[data-rl-title]")) : [];
  const miss = srLis.filter((li) => !!li.querySelector('button[data-rl-act="open"]') !== uts.has(li.getAttribute("data-rl-title")))
    .map((li) => li.getAttribute("data-rl-title"));
  check("(2) ⭐ self-recall: on the committed list, every renamed title has the action exactly when the reference holds it",
    review.length > 0 && srLis.length === review.length && miss.length === 0, srLis.length + "/" + review.length + " " + miss.join("; "));
  const fieldMiss = review.filter((r) => typeof r.in_reference === "boolean" && r.in_reference !== uts.has(r.title)).map((r) => r.title);
  check("(2) where the committed list carries in_reference, it agrees with the reference", fieldMiss.length === 0, fieldMiss.join("; "));
  check("(2) the action adds no kb_curation field and no write of its own", fn.length > 100 && !/FIELD_|kb_curation|postRows|saveCredRow|method: "POST"/.test(fn));

  // ── (4) the look ──
  const added = [src.slice(src.indexOf("function listTitleTypeSubs"), src.indexOf("function listCollision")),
    src.slice(src.indexOf("function sbsByLocal"), src.indexOf("/* rows: [{ id, title }]")),
    src.slice(src.indexOf("function exhibitTypeWords"), src.indexOf("function exhSbsBody")), fn].join("\n");
  check("(4) the new code names no raw hex color", added.length > 1000 && !/#[0-9a-fA-F]{3,8}\b/.test(added));
  check("(4) no glyph in the new rendered words", !/[←-⇿☀-➿\u{1F300}-\u{1FAFF}]/u.test(added));
  check("(4) American spelling in the new words", !/\b(colour|behaviour|catalogue|organisation|analyse|centre|grey)\b/i.test(added));

  let failed = 0;
  results.forEach(([n, ok, why]) => { if (!ok) failed++; console.log((ok ? "PASS " : "FAIL ") + n + (ok || why == null ? "" : " — " + why)); });
  console.log((results.length - failed) + "/" + results.length + " checks passed");
  process.exit(failed ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });

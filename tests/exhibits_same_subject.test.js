// Same subject in a Review card's Related titles (Sam, 3:16 PM PT 2026-11-18, relayed by COBIx on #3358 comment
// 6994477511). The Las Positas card for MAPCXH-HSA(7-1-001, "High School Articulation (Emerald)- Developmental
// Psychology of Children I", behind ECE 64 Play: Materials and Environments, showed three related titles, and the
// widely used ECE titles were a tab away. Pinned here, on that card as kb/_build_exhibits_review.py wrote it
// (tests/fixtures/exhibits_same_subject_las_positas.json):
//   (1) the panel leads with Same subject, the card's subject named, above today's related titles;
//   (2) Child Growth and Development (C-ID CDEV 100) is in the top 10 with its college count in parentheses;
//   (3) the top 10 show first; Show all in this subject reveals the rest, and Show the top 10 folds them back;
//   (4) Use this title fills the canonical title box through the panel's own path and keeps the issuer;
//   (5) nothing is written on render, on show all or on a pick; the subjects file is read once, and never for a
//       card that names no subject;
//   (6) a11y: a labeled section, words for every control, the list an ordered list, and no raw hex in its CSS.
// Run from repo root: `node tests/exhibits_same_subject.test.js` (or `npm test`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }
const src = fs.readFileSync("exhibits.js", "utf8");
const FX = JSON.parse(fs.readFileSync("tests/fixtures/exhibits_same_subject_las_positas.json", "utf8"));
const SUBJ = FX.subject;
const OTHER = { raw: "CompTIA Security Plus exam", step: "Proposed", title: "CompTIA Security+", issuer: "CompTIA", ids: ["X-2"],
  art: [0], could: [], colleges: [0], under: [], under_count: 0, exists: true };
function review(held) {
  return { schema: 1, written_at: "2026-11-18T23:00:00Z", sources: { procedures_run: "2026-11-18T07:47:00Z" },
    tiles: { names: { n: 10, of: 12, waiting: 2 }, aligned: { n: 0, of: 2 }, saved_not_folded: 0 }, steps: {},
    colleges: FX.colleges, held: held };
}
const RELATED = { schema: 1, generated_at: "2026-11-18T07:55:00Z", issuers: ["Emerald High School", "CompTIA"], paths: {},
  titles: [["Developmental Psychology of Children 1", 0, 1, 0, 1], ["Child Development Associate", 0, 2, 1, 0],
    ["Psychology of Children", 0, 1, 1, 0], ["CompTIA Security+", 1, 6, 12, 0]], pending: {}, batches: [], families: {} };
const SUBJECTS = { schema: 1, subjects: {} };
SUBJECTS.subjects[SUBJ] = FX.rows;

function load(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/#exhibits", runScripts: "dangerously" });
  const w = dom.window;
  const calls = [];
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    calls.push({ url: url, method: init.method || "GET" });
    function ok(obj) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(obj))); } }); }
    function bad(st) { return Promise.resolve({ ok: false, status: st, json: function () { return Promise.resolve({}); } }); }
    if (url === "kb/exhibits_review.json") return ok(review(opts.held || [FX.card, OTHER]));
    if (url === "kb/exhibits_related.json") return ok(RELATED);
    if (url === "kb/exhibits_review_subjects.json") return opts.noSubjects ? bad(404) : ok(SUBJECTS);
    if (/\/rest\/v1\/kb_curation\?select=/.test(url)) return ok([]);
    return bad(404);
  };
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve({ access_token: "a.b.c", email: "reviewer@example.org" }); },
    authHeaders: function () { return { apikey: "anon-key", Authorization: "Bearer anon-key" }; } };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS, calls: calls };
}
function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
async function settle() { for (let i = 0; i < 10; i++) await tick(); }
function section(d) { return d.querySelector("aside.exh-rel section.exh-ss"); }
function items(d) { return Array.from(section(d).querySelectorAll(".exh-ss-list li")); }
function labels(d) { return items(d).map(function (li) { return txt(li.querySelector(".exh-ss-t")); }); }
// A write is any non-GET to a table; the students count is a read through an RPC POST.
function writes(t) { return t.calls.filter(function (c) { return c.method !== "GET" && !/\/rest\/v1\/rpc\/exhibit_title_students$/.test(c.url); }); }
function byText(root, sel, t) { return Array.from(root.querySelectorAll(sel)).find(function (b) { return txt(b) === t; }); }

(async function () {
  const t = load();
  await t.M.boot(); await settle();
  const d = t.d;
  check("the card under test is the Las Positas exhibit", d.getElementById("exh-title").value === FX.card.title && FX.card.ids[0] === "MAPCXH-HSA(7-1-001");
  const sec = section(d);
  check("(1) Related titles leads with Same subject, the subject named", !!sec && txt(sec.querySelector("h5")) === "Same subject: " + SUBJ
    && sec.parentNode.firstChild === sec, sec && sec.outerHTML.slice(0, 200));
  check("(1) it says which course it comes from", /^From ECE 64 Play: Materials and Environments at Las Positas College\./.test(txt(sec.querySelector("p"))),
    txt(sec.querySelector("p")));
  const top = labels(d);
  console.log("top 10:\n  " + top.join("\n  "));
  const cdev = FX.rows.rows.find(function (r) { return r[0] === "CDEV 100"; });
  const want = "Child Growth and Development (C-ID CDEV 100) (" + cdev[2] + " colleges)";
  check("(2) Child Growth and Development, C-ID CDEV 100, is in the top 10 with its college count", top.length === 10 && top.indexOf(want) >= 0, top);
  check("(2) the count is the identities map's, never an estimate", cdev[2] > 1 && /\(\d+ colleges\)$/.test(want));
  check("(2) every label names its system and id, and its colleges", top.every(function (l) { return /\((?:C-ID|CCN|M-ID) [^()]+\) \(\d[\d,]* colleges?\)$/.test(l); }), top);
  const all = byText(sec, "button.exh-w", "Show all " + FX.rows.rows.length + " in this subject");
  check("(3) Show all names how many, as a word control", !!all && all.getAttribute("aria-expanded") === "false" && all.getAttribute("aria-controls") === "exh-ss-list");
  check("(5) nothing is written on render", writes(t).length === 0, writes(t));
  check("(5) the subjects file is read once", t.calls.filter(function (c) { return c.url === "kb/exhibits_review_subjects.json"; }).length === 1);
  all.click(); await settle();
  check("(3) Show all reveals the rest", items(d).length === FX.rows.rows.length);
  check("(3) the top 10 stay first", labels(d).slice(0, 10).join("|") === top.join("|"));
  const fewer = byText(section(d), "button.exh-w", "Show the top 10");
  check("(3) and Show the top 10 folds them back", !!fewer && fewer.getAttribute("aria-expanded") === "true");
  fewer.click(); await settle();
  check("(3) folded back to ten", items(d).length === 10);
  // (4) the pick.
  const li = items(d).find(function (x) { return txt(x.querySelector(".exh-ss-t")) === want; });
  const use = li && li.querySelector("button.exh-w");
  check("(4) each title has Use this title, labeled with the title", !!use && txt(use) === "Use this title" && use.getAttribute("aria-label") === "Use this title: " + want);
  const issuer0 = d.getElementById("exh-issuer").value;
  use.click(); await settle();
  check("(4) the pick fills the canonical title box with the title", d.getElementById("exh-title").value === "Child Growth and Development");
  check("(4) the card's issuer stays", d.getElementById("exh-issuer").value === issuer0 && issuer0 === "Emerald High School", issuer0);
  check("(4) the picked row now says it is the proposed title", /This is the proposed title\./.test(txt(items(d).find(function (x) { return txt(x.querySelector(".exh-ss-t")) === want; }))));
  check("(5) nothing is written by show all or a pick", writes(t).length === 0, writes(t));
  check("(5) and the subjects file is still read once", t.calls.filter(function (c) { return c.url === "kb/exhibits_review_subjects.json"; }).length === 1);
  check("(1) today's related titles still follow", !!d.querySelector("aside.exh-rel .exh-rel-list"));

  // A card that names no subject reads no subjects file and shows no section.
  const t2 = load({ held: [OTHER] });
  await t2.M.boot(); await settle();
  check("(5) a card with no subject reads no subjects file", !section(t2.d)
    && t2.calls.filter(function (c) { return c.url === "kb/exhibits_review_subjects.json"; }).length === 0);
  // The file missing: the section says so in words, and the related titles still draw.
  const t3 = load({ noSubjects: true });
  await t3.M.boot(); await settle();
  check("a subjects file that cannot be read says so", /could not be read \(HTTP 404\)/.test(txt(section(t3.d))) && !!t3.d.querySelector("aside.exh-rel .exh-rel-list"));

  // (6) the CSS uses tokens.
  const css = src.slice(src.indexOf('".exh-ss {'), src.indexOf('".exh-ss-t {'));
  check("(6) the section's CSS names no raw hex color", css.length > 0 && !/#[0-9a-fA-F]{3,8}\b/.test(css));
  check("(6) the list is an ordered list in a labeled section", sec.getAttribute("aria-labelledby") === "exh-ss-h" && !!sec.querySelector("ol.exh-ss-list"));

  let failed = 0;
  results.forEach(function (r) { console.log((r[1] ? "ok   " : "FAIL ") + r[0] + (r[1] || r[2] === undefined ? "" : "  " + JSON.stringify(r[2]).slice(0, 300))); if (!r[1]) failed++; });
  console.log("\n" + (results.length - failed) + "/" + results.length + " checks passed");
  process.exit(failed ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });

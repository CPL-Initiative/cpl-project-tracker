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
// A second subject to look in (S705; Sam, 2026-11-22: "Need to be able to change the Subject in the Course Sidebar").
SUBJECTS.subjects["Computer Information Systems"] = { disc: "Computer Information Systems", total: 2,
  rows: [["ITIS M1113", "Introduction to Computer Applications", 4, 3, 3, "M-ID"], ["ITIS M1197", "Introduction to Cloud Computing", 26, 3, 3, "M-ID"]] };
// Find a subject (S709; Sam, 2026-11-22: "I need to see subjects with 'computer' and 'information tech'").
SUBJECTS.subjects["Computer Science"] = { disc: "Computer Science", total: 1, rows: [["COMP 122", "Programming Concepts", 90, 3, 4, "C-ID"]] };
SUBJECTS.subjects["Health Information Technology"] = { disc: "Health Information Technology", total: 1, rows: [["HITE M1001", "Medical Terminology", 12, 3, 3, "M-ID"]] };
SUBJECTS.subjects["Journalism"] = { disc: "Journalism", total: 1, rows: [["JOUR 110", "Newswriting", 80, 3, 3, "C-ID"]] };

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
  const want = "Child Growth and Development (C-ID CDEV 100) (" + cdev[2] + " colleges teach the course)";
  check("(2) Child Growth and Development, C-ID CDEV 100, is in the top 10 with its college count", top.length === 10 && top.indexOf(want) >= 0, top);
  check("(2) the count is the identities map's, never an estimate", cdev[2] > 1 && /\(\d+ colleges teach the course\)$/.test(want));
  check("(2) every label names its system and id, and its colleges", top.every(function (l) { return /\((?:C-ID|CCN|M-ID) [^()]+\) \(\d[\d,]* (?:college teaches|colleges teach) the course\)$/.test(l); }), top);
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
  const use = li && Array.from(li.querySelectorAll("button.exh-w")).find(function (b) { return txt(b) === "Use this title"; });
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

  // (7) S705: look in another subject. The pick changes the list for the visit; nothing is written.
  {
    const t4 = load();
    await t4.M.boot(); await settle();
    const pick = t4.d.getElementById("exh-ss-pick");
    check("(7) ⭐ a labelled picker names this course's subject first and lists the others", pick && t4.d.querySelector('label[for="exh-ss-pick"]')
      && pick.options[0].value === SUBJ && /\(this course's subject\)$/.test(pick.options[0].textContent) && Array.from(pick.options).some(function (o) { return o.value === "Computer Information Systems"; }));
    const before = writes(t4).length;
    pick.value = "Computer Information Systems"; pick.dispatchEvent(new t4.w.Event("change")); await settle();
    const ls = labels(t4.d);
    check("(7) ⭐ picking another subject lists its titles, ranked against this course, and says nothing changes until the card is saved",
      txt(section(t4.d).querySelector("h5")) === "Subject: Computer Information Systems" && ls.length === 2 && ls.every(function (l) { return /ITIS M11/.test(l); })
      && /nothing changes until you save the card/.test(txt(t4.d.getElementById("exh-ss-pick-note"))), ls);
    check("(7) ⭐ the pick writes nothing", writes(t4).length === before);
    const again = t4.d.getElementById("exh-ss-pick");
    again.value = SUBJ; again.dispatchEvent(new t4.w.Event("change")); await settle();
    check("(7) picking this course's subject again returns the list as it was", txt(section(t4.d).querySelector("h5")) === "Same subject: " + SUBJ && !t4.d.getElementById("exh-ss-pick-note"));
  }

  // (8) S709: Find a subject narrows the picker by words that start a word of the name; the pick and this course's
  // subject stay; the count says how many match; typing writes nothing.
  {
    const t5 = load();
    await t5.M.boot(); await settle();
    const find = t5.d.getElementById("exh-ss-find");
    const opts = function () { return Array.from(t5.d.getElementById("exh-ss-pick").options).map(function (o) { return o.value; }); };
    check("(8) ⭐ a labelled Find a subject box sits beside the picker", !!find && !!t5.d.querySelector('label[for="exh-ss-find"]') && opts().length === 5, opts());
    const before = writes(t5).length;
    find.value = "computer"; find.dispatchEvent(new t5.w.Event("input")); await settle();
    check("(8) ⭐ \"computer\" keeps this course's subject and the two computer subjects",
      JSON.stringify(opts()) === JSON.stringify([SUBJ, "Computer Information Systems", "Computer Science"]), opts());
    find.value = "information tech"; find.dispatchEvent(new t5.w.Event("input")); await settle();
    check("(8) ⭐ \"information tech\" finds every name holding both words' starts",
      JSON.stringify(opts()) === JSON.stringify([SUBJ, "Health Information Technology"]), opts());
    check("(8) the count says how many match", /^1 of 4 other subjects match$/.test(txt(t5.d.getElementById("exh-ss-find-count"))), txt(t5.d.getElementById("exh-ss-find-count")));
    find.value = "sci"; find.dispatchEvent(new t5.w.Event("input")); await settle();
    const pick = t5.d.getElementById("exh-ss-pick");
    pick.value = "Computer Science"; pick.dispatchEvent(new t5.w.Event("change")); await settle();
    check("(8) picking from the narrowed list lists that subject, and the find box keeps its words",
      txt(section(t5.d).querySelector("h5")) === "Subject: Computer Science" && t5.d.getElementById("exh-ss-find").value === "sci");
    const f2 = t5.d.getElementById("exh-ss-find");
    f2.value = "journal"; f2.dispatchEvent(new t5.w.Event("input")); await settle();
    check("(8) the picked subject stays listed while the words no longer match it",
      opts().indexOf("Computer Science") >= 0 && opts().indexOf("Journalism") >= 0, opts());
    check("(8) ⭐ finding writes nothing", writes(t5).length === before);
  }

  // (6) the CSS uses tokens.
  const css = src.slice(src.indexOf('".exh-ss {'), src.indexOf('".exh-ss-t {'));
  check("(6) the section's CSS names no raw hex color", css.length > 0 && !/#[0-9a-fA-F]{3,8}\b/.test(css));
  check("(6) the list is an ordered list in a labeled section", sec.getAttribute("aria-labelledby") === "exh-ss-h" && !!sec.querySelector("ol.exh-ss-list"));

  let failed = 0;
  results.forEach(function (r) { console.log((r[1] ? "ok   " : "FAIL ") + r[0] + (r[1] || r[2] === undefined ? "" : "  " + JSON.stringify(r[2]).slice(0, 300))); if (!r[1]) failed++; });
  console.log("\n" + (results.length - failed) + "/" + results.length + " checks passed");
  process.exit(failed ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });

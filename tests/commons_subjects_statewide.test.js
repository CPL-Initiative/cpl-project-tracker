// Every local subject code statewide, on the Subjects page at #commons/subjects/statewide (S712).
// Sam, 2026-11-23: "what's settled-3019 unique list with the colleges that uses", "all colleges count", and "always
// provide a recommendation based on your best available data and always provide a confidence score, even if it's 5%".
//
// WHAT THIS GUARDS (each a way the view would mislead the person settling codes, or write the wrong row):
//   (1) ⭐ the address opens the view, which reads its file only then, and reports the address;
//   (2) ⭐ the default shows the calls at 90% or better that a person can file and has not, each with its colleges,
//       its call, its confidence in words, the runner-up and why; a chip shows every code, and the counts are on the
//       chips;
//   (3) ⭐ signed out, no control writes and the page says to sign in;
//   (4) ⭐ signed in, Confirm writes one statewide filing: course_id _SUBJ_DISC::<CODE>, field
//       subject_discipline_confirm, the MQ discipline as plain text, under the reviewer's own email;
//   (5) ⭐ the bulk confirm asks first, names its count, and writes every shown 90%+ call in batches of 200;
//   (6) a noncredit code offers no statewide filing (its category settles it at each college); a filed code shows
//       Filed and its discipline; another code can be filed from the row's list of the common codes;
//   (7) the table carries th scope, a labelled region, and the view stores nothing.
// A count in a row (Colleges past three, Courses) is a word that opens a sidebar and writes nothing (S719), so the
// checks for a writing control set those aside.
//
// Run from repo root: `npm test` (or `node tests/commons_subjects_statewide.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, detail) { results.push([name, !!cond, detail]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const SCRIPTS = ["commons_progress.js", "commons_program_records.js", "commons_front.js", "commons_subjects.js", "commons.js"].map((f) => fs.readFileSync(f, "utf8"));
function code(k, cls, conf, extra) {
  return Object.assign({ code: k, spellings: [k], colleges: [["Alpha College", 3], ["Beta College", 2]], courses: 5, credit: 5, noncredit: 0,
    titles: ["Intro " + k], local_titles: [], draft: null, filing: null, peers: { votes: 4, lead: "MATH", share: 1, tally: [["MATH", 4]] },
    title_call: "MATH", hint: null, "class": cls,
    recommend: { common: "MATH", discipline: "Mathematics", confidence: conf, why: "100% of 4 peer votes say MATH", next: { common: "PHYS", confidence: 0.01 } } }, extra || {});
}
const BIG = [];
for (let i = 0; i < 205; i++) BIG.push(code("Z" + String(i).padStart(3, "0"), "peers", 0.97));
const SW = {
  _rule: "A code is the state list's subject code in the subject map's key form.",
  totals: { codes: 210, colleges: 118, pairs: 420, courses: 1050, one_college: 0, by_class: {} },
  self_recall: [{ confidence_from: 0.9, confidence_to: 1, tried: 573, right: 554, accuracy: 0.967 }],
  common_codes: [["MATH", "Mathematics"], ["PHYS", "Physics/Astronomy"]],
  codes: [code("MAT", "confirm", 0.995), code("LOW", "titles", 0.05, { recommend: { common: "PHYS", discipline: "Physics/Astronomy", confidence: 0.05, why: "the course titles read most like PHYS", next: { common: "MATH", confidence: 0.04 } } }),
    code("ESLNC", "noncredit", 0.9, { recommend: { common: "ESLN", discipline: "English as a Second Language (ESL): Noncredit", confidence: 0.9, why: "139 of its 155 noncredit courses are English as a Second Language (ESL)", next: null } }),
    code("DONE", "settled", 1, { filing: { common: "MATH", discipline: "Mathematics", who: "Sam", at: "2026-11-04" } }),
    code("ONE", "peers", 0.92, { colleges: [["Gamma College", 7]] })].concat(BIG)
};
const FILES = {
  "kb/status/commons.json": JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8")),
  "kb/status/program-requirements.json": JSON.parse(fs.readFileSync("kb/status/program-requirements.json", "utf8")),
  "kb/status/commons_data.json": JSON.parse(fs.readFileSync("kb/status/commons_data.json", "utf8")),
  "kb/reference/industry_credential_skills.json": JSON.parse(fs.readFileSync("kb/reference/industry_credential_skills.json", "utf8")),
  "kb/status/local_subject_titles.json": JSON.parse(fs.readFileSync("tests/fixtures/local_subject_titles_fixture.json", "utf8")),
  "kb/status/statewide_subject_codes.json": SW
};
const REST = "https://hvuwhnbuahrtptokpqfh.supabase.co/rest/v1/kb_curation";
const ME = { email: "a@rccd.edu", access_token: "tok.en.x", refresh_token: "r" };

function load(hash, opt) {
  opt = opt || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-commons"><div id="commons-root">Loading</div></div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "dangerously" });
  const w = dom.window, o = {}, calls = [], fetched = [];
  let writes = 0;
  const sess = opt.sess || null;
  Object.defineProperty(w, "localStorage", { value: { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { writes++; o[k] = String(v); }, removeItem: (k) => { delete o[k]; } }, configurable: true });
  w.CPL_SESSION = {
    get: () => sess, isFresh: () => !!sess, ensureFresh: () => Promise.resolve(sess),
    authHeaders: (extra) => Object.assign({ apikey: "ANON", Authorization: "Bearer " + (sess ? sess.access_token : "ANON") }, extra || {}),
    viewAddress: () => {}
  };
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    fetched.push(url);
    if (url.indexOf(REST) === 0) {
      const method = init.method || "GET";
      calls.push({ url, method, body: init.body });
      if (method === "GET") return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
      return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(null) });
    }
    const hit = Object.assign({}, FILES, opt.files || {})[url];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  SCRIPTS.forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, M: w.CPL_COMMONS, calls, fetched, writes: () => writes };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 40; i++) await tick(); }
const posts = (x) => x.calls.filter((c) => c.method === "POST");
const rowCodes = (d) => Array.from(d.querySelectorAll(".csw-table tbody tr")).map((r) => r.getAttribute("data-code"));

(async function () {
  /* (1), (2), (3), (7) signed out */
  let x = load("#commons/subjects/statewide");
  await x.M.boot(); await settle();
  let d = x.d;
  check("(1) ⭐ the address opens the statewide list", txt(d.getElementById("csb-h")) === "Every local subject code, statewide");
  check("(1) ⭐ the view reports its address", x.w.CPL_COMMONS_SUBJECTS.address() === "commons/subjects/statewide" && x.w.location.hash === "#commons/subjects/statewide");
  const top = rowCodes(d);
  check("(2) ⭐ the default shows the 90%+ calls a person can file and has not, 200 at a time",
    top.length === 200 && top.indexOf("MAT") >= 0 && top.indexOf("ONE") >= 0 && top.indexOf("LOW") < 0 && top.indexOf("ESLNC") < 0 && top.indexOf("DONE") < 0, top.slice(0, 6));
  check("(2) the chips carry their counts", /Calls at 90% or better \(207\)/.test(txt(d.getElementById("csw-f-top"))) && /All \(210\)/.test(txt(d.getElementById("csw-f-all"))));
  const mat = d.querySelector('.csw-table tr[data-code="MAT"]');
  check("(2) ⭐ a row shows its colleges, its call, its confidence in words, the runner-up and why",
    /Alpha College; Beta College/.test(txt(mat.children[1])) && /MATH/.test(txt(mat.children[3])) && /Mathematics/.test(txt(mat.children[3]))
    && txt(mat.children[4]) === "100% Confident" && txt(mat.children[5]) === "PHYS 1%" && /100% of 4 peer votes say MATH/.test(txt(mat.children[6])), txt(mat));
  check("(2) the pairs are counted by the four confidence levels, a filed code as Confident",
    /Confident 417 · Likely 0 · Leaning 0 · Unsure 2/.test(txt(d.getElementById("csw-levels"))), txt(d.getElementById("csw-levels")));
  check("(2) the summary names the scale and the measured accuracy", /210 local subject codes at 118 colleges/.test(txt(d.getElementById("csw-sum"))) && /right 97% of the time/.test(txt(d.getElementById("csw-sum"))));
  check("(3) ⭐ signed out, no control writes and the page says to sign in", !d.querySelector(".csw-table tbody button:not([data-csb-second]), .csw-table tbody select") && !d.getElementById("csw-bulk")
    && /Sign in as a reviewer/.test(txt(d.querySelector(".csw"))) && posts(x).length === 0);
  d.getElementById("csw-f-all").click(); await settle();
  const low = d.querySelector('.csw-table tr[data-code="LOW"]');
  check("(2) All shows every code, a 5% call with its confidence", rowCodes(d).length === 200 && !!low && txt(low.children[4]) === "5% Unsure");
  d.getElementById("csw-more").click(); await settle();
  check("(2) Show more shows the rest", rowCodes(d).length === 210);
  check("(7) every header cell carries a scope; the table scrolls inside a labelled region; nothing is stored",
    Array.from(d.querySelectorAll(".csw-table th")).every((th) => th.getAttribute("scope")) && d.querySelector(".csw-table").parentNode.getAttribute("role") === "region" && x.writes() === 0);

  /* (4), (5), (6) signed in */
  x = load("#commons/subjects/statewide", { sess: ME });
  await x.M.boot(); await settle();
  d = x.d;
  d.querySelector('#csw-MAT-ok').click(); await settle();
  let p = posts(x);
  const body = p.length === 1 ? JSON.parse(p[0].body) : null;
  check("(4) ⭐ Confirm writes one statewide filing: the key, the field, the discipline as plain text, the reviewer's email",
    body && body.length === 1 && body[0].course_id === "_SUBJ_DISC::MAT" && body[0].field === "subject_discipline_confirm"
    && body[0].value === "Mathematics" && body[0].reviewer_email === "a@rccd.edu" && /on_conflict=course_id,field/.test(p[0].url), body);
  check("(4) the save is said, and the row leaves the 90%+ list", /Saved 1 statewide filing under your name/.test(txt(d.getElementById("csw-msg"))) && rowCodes(d).indexOf("MAT") < 0);
  d.getElementById("csw-bulk").click(); await settle();
  check("(5) ⭐ the bulk confirm asks first and names its count", /Save 206 statewide filings under your name/.test(txt(d.getElementById("csw-bulk-ask"))) && posts(x).length === 1);
  d.getElementById("csw-bulk-yes").click(); await settle();
  p = posts(x).slice(1);
  const sizes = p.map((c) => JSON.parse(c.body).length);
  check("(5) ⭐ it writes every 90%+ call in batches of 200", JSON.stringify(sizes) === "[200,6]"
    && p.every((c) => JSON.parse(c.body).every((r) => /^_SUBJ_DISC::/.test(r.course_id) && r.value === "Mathematics")), sizes);
  d.getElementById("csw-f-all").click(); await settle();
  d.getElementById("csw-more").click(); await settle();
  const nc = d.querySelector('.csw-table tr[data-code="ESLNC"]');
  check("(6) a noncredit code offers no statewide filing and says why", nc && !nc.querySelector("button:not([data-csb-second]), select") && /Settled by its noncredit category at each college/.test(txt(nc)));
  const done = d.querySelector('.csw-table tr[data-code="DONE"]');
  check("(6) a filed code shows Filed and its discipline", done && txt(done.children[4]) === "Filed" && /Filed under Mathematics/.test(txt(done.children[7])));
  const pick = d.getElementById("csw-LOW-pick");
  pick.value = "Mathematics";
  d.getElementById("csw-LOW-other").click(); await settle();
  const last = JSON.parse(posts(x).slice(-1)[0].body);
  check("(6) another code is filed from the row's list", last.length === 1 && last[0].course_id === "_SUBJ_DISC::LOW" && last[0].value === "Mathematics", last);

  let fail = 0;
  for (const [n, ok, det] of results) { console.log((ok ? "PASS " : "FAIL ") + n + (ok ? "" : "  " + JSON.stringify(det))); if (!ok) fail++; }
  console.log("\n" + (fail ? fail + " FAILED" : results.length + "/" + results.length + " checks passed"));
  process.exit(fail ? 1 : 0);
})();

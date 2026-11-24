// The Subjects figures answer their own edits (S715; Sam, 2026-11-23: "when I make edits or decisions, they are
// immediately reflected in the numbers (going in the right direction) shown in the links").
//
// WHAT THIS GUARDS (each a way a save would leave a figure behind the list it opens):
//   (1) ⭐ with no save since the build, every figure equals the file's own totals;
//   (2) ⭐ a Save of a local title and a common code moves the stamp at once: local titles +1, codes with no title -1
//       (and its reason), codes with a common subject code +1, codes settled by a save +1; the college's row moves
//       the same way, and each figure still equals the rows its list shows;
//   (3) ⭐ Take it back moves every one of them back;
//   (4) ⭐ the held codes subtract the held courses a fresh save releases by the mint's rule: ordinary titles only,
//       a shell title stays held; a save the build already carried subtracts nothing;
//   (5) ⭐ the statewide view's level counts raise the saved college-and-code pair to Confident;
//   (6) ⭐ the Commons front's Subjects card reads the same live figures as the tab, its headline (the share of courses
//       under a Confident common code) included;
//   (7) ⭐ a college the statewide list spells with other punctuation is the same college to levels() (S719).
// Run from repo root: `npm test` (or `node tests/commons_subjects_live_figures.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const SCRIPTS = ["commons_progress.js", "commons_program_records.js", "commons_front.js", "commons_subjects.js", "commons.js"].map((f) => fs.readFileSync(f, "utf8"));
const LIVE = JSON.parse(fs.readFileSync("kb/status/local_subject_titles.json", "utf8"));
const FIX = JSON.parse(fs.readFileSync("tests/fixtures/local_subject_titles_fixture.json", "utf8"));
FIX.common_codes = { BIOL: "Biology", ENGL: "English", KINE: "Kinesiology", MATH: "Mathematics", WELD: "Welding" };
FIX.title_case = LIVE.title_case;
const HELD = {
  _rule: "held rule", _sources: { plan_date: "2026-11-22" },
  totals: { held: 9, codes: 2, pairs: 2, top_20_release: 9 },
  codes: [
    { key: "MATH", code: "MATH", held: 5, pairs: 1, spellings: ["MATH"], printed_names: [],
      colleges: [{ college: "Alpha College", held: 5, reasons: ["shell_title_no_convention", "shell_title_no_convention", "shell_title_no_convention", "no_route_gives_a_subj4", "no_route_gives_a_subj4"] }] },
    { key: "WELD", code: "WELD", held: 4, pairs: 1, spellings: ["WELD"], printed_names: [],
      colleges: [{ college: "Beta College", held: 4, reasons: ["no_route_gives_a_subj4", "no_route_gives_a_subj4", "no_route_gives_a_subj4", "no_route_gives_a_subj4"] }] }]
};
const SW = {
  _rule: "sw", totals: { codes: 1, colleges: 2, pairs: 2, courses: 10, one_college: 0 }, self_recall: [],
  common_codes: [["MATH", "Mathematics"], ["ENGL", "English"]],
  codes: [{ code: "MATH", spellings: ["MATH"], colleges: [["Alpha College", 3], ["Beta College", 2]], filing: null, "class": "titles",
    recommend: { common: "MATH", discipline: "Mathematics", confidence: 0.4, why: "titles", next: null } }]
};
const FILES = {
  "kb/status/commons.json": JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8")),
  "kb/status/program-requirements.json": JSON.parse(fs.readFileSync("kb/status/program-requirements.json", "utf8")),
  "kb/status/commons_data.json": JSON.parse(fs.readFileSync("kb/status/commons_data.json", "utf8")),
  "kb/reference/industry_credential_skills.json": JSON.parse(fs.readFileSync("kb/reference/industry_credential_skills.json", "utf8")),
  "kb/status/local_subject_titles.json": FIX,
  "kb/status/held_subject_codes.json": HELD,
  "kb/status/statewide_subject_codes.json": SW,
  "kb/status/subject_courses/alpha.json": { college: "Alpha College", slug: "alpha", columns: ["number", "title", "band", "listed", "units", "cid", "ccn", "mid"],
    codes: { MATH: [["1", "Algebra", "C", "Both", 4, "", "", ""]] } },
  "kb/status/local_subject_recommendations.json": { colleges: [{ slug: "alpha", rows: [{ code: "MATH",
    title: { title: "Mathematics", level: "High", from: "other_colleges", why: "other colleges agree." },
    common: { code: "MATH", discipline: "Mathematics", level: "Medium", from: "own_courses", why: "its courses sit under MATH." } }] }] }
};
const REST = "https://hvuwhnbuahrtptokpqfh.supabase.co/rest/v1/kb_curation";
const ME = { email: "a@rccd.edu", access_token: "tok.en.x", refresh_token: "r" };

function load(hash, opt) {
  opt = opt || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-commons"><div id="commons-root">Loading</div></div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "dangerously" });
  const w = dom.window, o = {}, calls = [];
  const sess = opt.sess || null;
  Object.defineProperty(w, "localStorage", { value: { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } }, configurable: true });
  w.CPL_SESSION = {
    get: () => sess, isFresh: () => !!sess, ensureFresh: () => Promise.resolve(sess),
    authHeaders: (extra) => Object.assign({ apikey: "ANON", Authorization: "Bearer " + (sess ? sess.access_token : "ANON") }, extra || {}),
    viewAddress: () => {}
  };
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    if (url.indexOf(REST) === 0) {
      const method = init.method || "GET";
      calls.push({ url, method, body: init.body });
      if (method === "GET") {
        const rows = /field=eq\.subject_decision&/.test(url) ? (opt.saves || []) : [];
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(rows))) });
      }
      if (method === "POST") return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(null) });
      if (method === "DELETE") return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([{ course_id: "x" }]) });
    }
    const hit = FILES[url];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  SCRIPTS.forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, M: w.CPL_COMMONS, X: () => w.CPL_COMMONS_SUBJECTS, calls };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 30; i++) await tick(); }

/* The stamp's figures, read off the words a person sees. */
function stamp(x) {
  const s = txt(x.d.querySelector(".csb-stamp"));
  const n = (re) => { const m = re.exec(s); return m ? Number(m[1].replace(/,/g, "")) : null; };
  return { named: n(/^([\d,]+) local titles/), untitled: n(/([\d,]+) codes with no title/), nic: n(/\(([\d,]+) not in catalog/),
    common: n(/([\d,]+) codes have a common subject code/), saved: n(/([\d,]+) codes? carr(?:y|ies) a person’s save/) || 0, text: s };
}
function alphaTitled(x) {
  const tr = x.d.querySelector('.csb-table tr[data-college="alpha"]');
  return tr ? Number(txt(tr.children[3]).split(" ")[0]) : null;
}
/* A figure opens what it counts: press it, then count the rows its list shows. */
async function listed(x, pick) {
  const b = x.d.querySelector('.csb-stamp button[data-csb-pick="' + pick + '"]');
  if (!b) return null;
  b.click(); await settle();
  return x.d.querySelectorAll(".csb-codes tbody tr[data-code]").length;
}

(async function () {
  /* (1) no save since the build */
  let x = load("#commons/subjects", { sess: ME });
  await x.M.boot(); await settle();
  let a = stamp(x);
  check("(1) ⭐ with no save, the figures equal the file's totals", a.named === FIX.totals.named && a.untitled === 3 && a.nic === FIX.totals.not_in_catalog
    && a.common === FIX.totals.with_common && a.saved === 0 && alphaTitled(x) === 3, JSON.stringify(a));
  check("(1) each figure equals the rows its list shows", (await listed(x, "titled")) === a.named && (await listed(x, "common")) === a.common, a.text);

  /* (2) a Save moves every figure at once */
  x = load("#commons/subjects/alpha/MATH", { sess: ME });
  await x.M.boot(); await settle();
  const before = stamp(x);
  x.d.getElementById("csb-ed-save").click(); await settle();
  const after = stamp(x);
  check("(2) ⭐ a Save moves the stamp at once: titles +1, no title -1, not in catalog -1, common +1, saved +1",
    after.named === before.named + 1 && after.untitled === before.untitled - 1 && after.nic === before.nic - 1
    && after.common === before.common + 1 && after.saved === before.saved + 1, JSON.stringify([before, after]));
  check("(2) ⭐ the college's row moves the same way", alphaTitled(x) === 4, String(alphaTitled(x)));
  x.X().open("disagree"); await settle();
  check("(2) the list of codes with no title drops the saved code and equals its figure",
    !x.d.querySelector('.csb-codes tr[data-code="MATH"]') && x.d.querySelectorAll(".csb-codes tbody tr[data-code]").length === after.untitled);

  /* (4) the held codes, in the same visit */
  x.X().open("held"); await settle();
  const note = txt(x.d.getElementById("csb-held-note"));
  const mrow = x.d.querySelector('.csb-held tr[data-code="MATH"]');
  check("(4) ⭐ the held total drops by the two ordinary titles the save releases; the three shell titles stay held",
    /^7 courses the M-ID mint holds wait on 2 local subject codes/.test(note) && /2 courses are released by decisions saved since the build/.test(note)
    && mrow && mrow.getAttribute("data-held") === "3" && /2 released at Alpha College by a save since the build\./.test(txt(mrow.children[1])), note);
  check("(4) a code no save touched keeps its held count", x.d.querySelector('.csb-held tr[data-code="WELD"]').getAttribute("data-held") === "4");

  /* (5) the statewide levels */
  x.X().open("statewide"); await settle();
  check("(5) ⭐ the saved college-and-code pair counts as Confident; the other keeps its level",
    /Confident 1 · Likely 0 · Leaning 0 · Unsure 1/.test(txt(x.d.getElementById("csw-levels"))), txt(x.d.getElementById("csw-levels")));

  /* (6) the Commons front card, same visit */
  const F = await x.X().liveFigures();
  check("(6) ⭐ the figures the Commons card reads are the tab's own", F.named === after.named && F.untitled === after.untitled && F.held === 7, JSON.stringify(F));
  x.w.history.replaceState(null, "", "#commons");
  await x.M.boot(); await settle();
  const fm = x.d.querySelector("#cmf-subj-titles"), fh = x.d.querySelector("#cmf-subj-held");
  check("(6) ⭐ the Commons front's Subjects card shows the live counts",
    fm && /^4 local titles at 1 of 2 colleges/.test(txt(fm)) && /2 codes with no title/.test(txt(fm))
    && fh && /^7 courses the M-ID mint holds wait on 2 local subject codes/.test(txt(fh)), txt(fm) + " | " + txt(fh));
  const card = x.d.querySelector('.cmf-card[data-key="subjects"]');
  check("(6) ⭐ the card's headline and level line read the live levels: the saved pair is Confident",
    txt(card.querySelector(".cmf-big")) === "60%" && /of courses sit under a local code with a Confident common code/.test(txt(card.querySelector(".cmf-rest")))
    && txt(x.d.getElementById("cmf-subj-levels")) === "Confident 1 · Likely 0 · Leaning 0 · Unsure 1", txt(card.querySelector(".cmf-headline")) + " | " + txt(x.d.getElementById("cmf-subj-levels")));

  /* (3) Take it back */
  x = load("#commons/subjects/alpha/MATH", { sess: ME });
  await x.M.boot(); await settle();
  const b0 = stamp(x);
  x.d.getElementById("csb-ed-save").click(); await settle();
  x.d.getElementById("csb-ed-undo").click(); await settle();
  const b2 = stamp(x);
  check("(3) ⭐ Take it back moves every figure back", b2.named === b0.named && b2.untitled === b0.untitled && b2.common === b0.common && b2.saved === b0.saved && alphaTitled(x) === 3,
    JSON.stringify([b0, b2]));

  /* (4) a save the build already carried subtracts nothing */
  const carried = JSON.parse(JSON.stringify(FIX));
  const C = carried.columns;
  const alpha = carried.colleges.find((c) => c.slug === "alpha");
  carried.columns = C.concat(["decision"]);
  alpha.rows.forEach((r) => r.push(null));
  const mi = alpha.rows.findIndex((r) => r[C.indexOf("code")] === "MATH");
  alpha.rows[mi][C.indexOf("common")] = "MATH";
  alpha.rows[mi][carried.columns.indexOf("decision")] = { from: "subject_decision", key: "SUBJ:alpha|MATH|credit", common: true, title: false, at: "2026-11-22",
    was: { common: null } };
  carried.colleges.find((c) => c.slug === "beta").rows.forEach((r) => r.push(null));
  FILES["kb/status/local_subject_titles.json"] = carried;
  x = load("#commons/subjects/held", { sess: ME, saves: [{ course_id: "SUBJ:alpha|MATH|credit", value: JSON.stringify({ common_code: "MATH" }), reviewed_at: "2026-11-22T10:00:00Z", reviewer_email: "b@rccd.edu", reviewer_label: "b" }] });
  await x.M.boot(); await settle();
  check("(4) ⭐ a save the build already carried releases nothing a second time", /^9 courses the M-ID mint holds/.test(txt(x.d.getElementById("csb-held-note"))),
    txt(x.d.getElementById("csb-held-note")));
  FILES["kb/status/local_subject_titles.json"] = FIX;

  /* (7) one college-name match (S719): the statewide list spells the college with punctuation the titles file does not
     ("Alpha-College" for "Alpha College", as "Trade-Technical" for "Trade Technical"). The college table matched the
     name with its punctuation set aside and levels() matched it exactly, so the card's headline left that college's
     saves out. A save there now lifts its pair on the statewide view and on the Commons card alike. */
  const SWP = JSON.parse(JSON.stringify(SW));
  SWP.codes[0].colleges[0][0] = "Alpha-College";
  FILES["kb/status/statewide_subject_codes.json"] = SWP;
  x = load("#commons/subjects/alpha/MATH", { sess: ME });
  await x.M.boot(); await settle();
  x.d.getElementById("csb-ed-save").click(); await settle();
  x.X().open("statewide"); await settle();
  check("(7) ⭐ a save at a college the statewide list spells with punctuation lifts its pair to Confident",
    /Confident 1 · Likely 0 · Leaning 0 · Unsure 1/.test(txt(x.d.getElementById("csw-levels"))), txt(x.d.getElementById("csw-levels")));
  x.w.history.replaceState(null, "", "#commons");
  await x.M.boot(); await settle();
  check("(7) ⭐ the Commons card's level line agrees with the statewide view",
    txt(x.d.getElementById("cmf-subj-levels")) === "Confident 1 · Likely 0 · Leaning 0 · Unsure 1", txt(x.d.getElementById("cmf-subj-levels")));
  FILES["kb/status/statewide_subject_codes.json"] = SW;

  let fail = 0;
  results.forEach(([n, ok, why]) => { if (!ok) fail++; console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why)); });
  console.log(fail ? fail + " failed" : "all " + results.length + " passed");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

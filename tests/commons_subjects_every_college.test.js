// One Save that settles a code's common subject code at every college on file using it (#3655 item 0, S705,
// d-subjects-one-save-every-college-credit-forms-s705). Sam, 2026-11-22: "I don't see how I can take action on subjects
// that need edit, such as all the AEDs that are in ELEC erroneously" (r-subjects-edit-counts-full-width-sam-2026-11-22).
//
// WHAT THIS GUARDS (each a way one press would misfile decisions at many colleges):
//   (1) ⭐ signed out, the block is absent and nothing is written;
//   (2) ⭐ one Save posts one row per eligible college, each keyed as that college's credit form keys it (credit, or
//       whole where COCI lists no course), field subject_decision, under the reviewer's own email;
//   (3) ⭐ a college whose code another person settled (or a filing for Sam) keeps it: no request touches its key;
//   (4) ⭐ a noncredit-only code at a college is left to its own category forms: no request touches it;
//   (5) ⭐ the reviewer's own earlier save keeps its local title in the new value, and a college already holding the
//       reviewer's save of the same code is not written again;
//   (6) an unknown common code makes no request; a refused write says which colleges were not saved;
//   (7) after the save, the status names every college saved.
// Run from repo root: `npm test` (or `node tests/commons_subjects_every_college.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const SCRIPTS = ["commons_progress.js", "commons_program_records.js", "commons_front.js", "commons_subjects.js", "commons.js"].map((f) => fs.readFileSync(f, "utf8"));
const LIVE = JSON.parse(fs.readFileSync("kb/status/local_subject_titles.json", "utf8"));
const C = LIVE.columns;
function row(o) { return C.map((k) => (k in o ? o[k] : null)); }
const CR = (n, extra) => Object.assign({ code: "AED", printed_name: null, catalog_courses: n, state_courses: n, side: "both", title_state: "catalog",
  common: "ELEC", discipline: "Electronics", credit_courses: n, noncredit_courses: 0 }, extra || {});
const college = (slug, name, rows) => ({ slug, college: name, catalog_year: "2026-2027", read_at: "2026-11-20T10:00:00Z", rows: rows.map(row) });
const FIX = {
  _rule: "rule", totals: { colleges: 6, named: 1, colleges_named: 1 }, columns: C,
  common_codes: { ELEC: "Electronics", AUTO: "Automotive Technology", KINE: "Kinesiology", VOCE: "Vocational" },
  title_case: LIVE.title_case, noncredit_mq: LIVE.noncredit_mq, noncredit_slugs: LIVE.noncredit_slugs,
  colleges: [
    college("alpha", "Alpha College", [CR(4, { printed_name: "Automotive Electronics" })]),
    college("beta", "Beta College", [CR(3)]),
    college("gamma", "Gamma College", [CR(0, { side: "catalog", state_courses: 0, credit_courses: 0 })]),   /* COCI lists none: whole */
    college("delta", "Delta College", [CR(2)]),                                                              /* another person's save */
    college("eps", "Epsilon College", [{ code: "AED", printed_name: null, catalog_courses: 0, side: "state", title_state: "not_in_catalog", credit_courses: 0,
      noncredit_courses: 5, state_courses: 5, categories: [["Short-term Vocational", 5]] }]),                 /* noncredit only */
    college("zeta", "Zeta College", [CR(1)])]                                                                /* my own earlier save */
};
const FILES = {
  "kb/status/commons.json": JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8")),
  "kb/status/program-requirements.json": JSON.parse(fs.readFileSync("kb/status/program-requirements.json", "utf8")),
  "kb/status/commons_data.json": JSON.parse(fs.readFileSync("kb/status/commons_data.json", "utf8")),
  "kb/reference/industry_credential_skills.json": JSON.parse(fs.readFileSync("kb/reference/industry_credential_skills.json", "utf8")),
  "kb/status/local_subject_titles.json": FIX,
  "kb/status/subject_courses/alpha.json": { college: "Alpha College", slug: "alpha", columns: ["number", "title", "band", "listed", "units", "cid", "ccn", "mid"], codes: {} }
};
const REST = "https://hvuwhnbuahrtptokpqfh.supabase.co/rest/v1/kb_curation";
const ME = { email: "a@rccd.edu", access_token: "tok.en.x", refresh_token: "r" };
const AT = "2026-11-22T12:00:00Z";
const SAVES = [
  { course_id: "SUBJ:delta|AED|credit", value: JSON.stringify({ common_code: "KINE" }), reviewed_at: AT, reviewer_email: "b@rccd.edu", reviewer_label: "a reviewer" },
  { course_id: "SUBJ:zeta|AED|credit", value: JSON.stringify({ local_title: "Apprentice Electrical", common_code: "ELEC" }), reviewed_at: AT, reviewer_email: ME.email, reviewer_label: "a reviewer" }];

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
      calls.push({ url, method, headers: init.headers || {}, body: init.body });
      if (method === "GET") {
        const sel = /reviewer_email/.test(url);
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(opt.saves || [])).map((r) => { if (!sel) delete r.reviewer_email; return r; })) });
      }
      if (method === "POST") {
        const b = JSON.parse(init.body), st = (opt.refuse || []).indexOf(b.course_id) >= 0 ? 403 : 201;
        return Promise.resolve({ ok: st < 300, status: st, json: () => Promise.resolve(null) });
      }
    }
    const hit = FILES[url];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  SCRIPTS.forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, M: w.CPL_COMMONS, calls };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 40; i++) await tick(); }
const posts = (x) => x.calls.filter((c) => c.method !== "GET");

(async function () {
  /* (1) signed out */
  let x = load("#commons/subjects/alpha/AED", { saves: SAVES });
  await x.M.boot(); await settle();
  check("(1) the panel opens and names the other colleges", !!x.d.getElementById("csb-panel") && !!x.d.getElementById("csb-elsewhere"));
  check("(1) ⭐ signed out, there is no every-college Save and nothing is written", !x.d.getElementById("csb-all") && posts(x).length === 0);

  /* (2)-(5) signed in */
  x = load("#commons/subjects/alpha/AED", { sess: ME, saves: SAVES });
  await x.M.boot(); await settle();
  const box = x.d.getElementById("csb-all"), co = x.d.getElementById("csb-all-code");
  check("(2) signed in, the block names the colleges it writes and is filled with this college's code",
    box && co && co.value === "ELEC" && /Alpha College; Beta College; Gamma College; Zeta College\./.test(txt(x.d.getElementById("csb-all-rule"))), txt(box));
  check("(3) the block names the college a person settled, with its code", /Kept as a person settled them: Delta College \(KINE\)\./.test(txt(x.d.getElementById("csb-all-other"))));
  check("(4) the block names the noncredit-only college as settled on its own forms", /Epsilon College\./.test(txt(x.d.getElementById("csb-all-nc"))));
  check("(2) the field has its label and Save is a word button", x.d.querySelector('label[for="csb-all-code"]') && x.d.getElementById("csb-all-save").tagName === "BUTTON"
    && x.d.getElementById("csb-all-save").classList.contains("csb-word"));
  co.value = "zzzz"; x.d.getElementById("csb-all-save").click(); await settle();
  check("(6) ⭐ an unknown common code makes no request", posts(x).length === 0 && /ZZZZ is not a common subject code/.test(txt(x.d.getElementById("csb-all-code-msg"))));
  x.d.getElementById("csb-all-code").value = "auto"; x.d.getElementById("csb-all-save").click(); await settle();
  const P = posts(x), bodies = P.map((p) => JSON.parse(p.body)), keys = bodies.map((b) => b.course_id);
  check("(2) ⭐ one row per eligible college, keyed by that college's own band", JSON.stringify(keys) === JSON.stringify(["SUBJ:alpha|AED|credit", "SUBJ:beta|AED|credit", "SUBJ:gamma|AED|whole", "SUBJ:zeta|AED|credit"]), keys.join(","));
  check("(2) ⭐ each is an upsert of subject_decision under the reviewer's own email", P.every((p) => p.method === "POST" && p.url === REST + "?on_conflict=course_id,field")
    && bodies.every((b) => b.field === "subject_decision" && b.reviewer_email === ME.email && JSON.parse(b.value).common_code === "AUTO"));
  check("(3) ⭐ no request touches the key another person settled", keys.indexOf("SUBJ:delta|AED|credit") < 0);
  check("(4) ⭐ no request touches the noncredit-only college", !keys.some((k) => /^SUBJ:eps\|/.test(k)));
  const zv = JSON.parse(bodies[3].value), av = JSON.parse(bodies[0].value);
  check("(5) ⭐ the reviewer's own earlier save keeps its title; a college with no save gets the code alone",
    zv.local_title === "Apprentice Electrical" && zv.common_code === "AUTO" && JSON.stringify(Object.keys(av)) === JSON.stringify(["common_code"]));
  check("(7) the status names every college saved", /Saved AUTO at 4 colleges: Alpha College; Beta College; Gamma College; Zeta College\./.test(txt(x.d.getElementById("csb-all-status"))), txt(x.d.getElementById("csb-all-status")));
  x.d.getElementById("csb-all-save").click(); await settle();
  check("(5) a second press with every college already holding the reviewer's save writes nothing", posts(x).length === 4 && /Nothing to save/.test(txt(x.d.getElementById("csb-all-status"))));

  /* (5) a college already holding the reviewer's save of the same code */
  x = load("#commons/subjects/alpha/AED", { sess: ME, saves: SAVES });
  await x.M.boot(); await settle();
  x.d.getElementById("csb-all-save").click(); await settle();
  check("(5) ⭐ Zeta, already holding the reviewer's ELEC, is not written again", JSON.stringify(posts(x).map((p) => JSON.parse(p.body).course_id)) === JSON.stringify(["SUBJ:alpha|AED|credit", "SUBJ:beta|AED|credit", "SUBJ:gamma|AED|whole"]));

  /* (6) a refused write */
  x = load("#commons/subjects/alpha/AED", { sess: ME, saves: SAVES, refuse: ["SUBJ:beta|AED|credit"] });
  await x.M.boot(); await settle();
  x.d.getElementById("csb-all-code").value = "AUTO"; x.d.getElementById("csb-all-save").click(); await settle();
  check("(6) a refused write names the college not saved and keeps the others", /Saved AUTO at 3 colleges: Alpha College; Gamma College; Zeta College\. Not saved at Beta College\./.test(txt(x.d.getElementById("csb-all-status"))), txt(x.d.getElementById("csb-all-status")));

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "  [" + r[2] + "]")));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

// Noncredit saves on the Commons Subjects page (#3655): a code's noncredit courses save one kb_curation row per COCI
// noncredit category, course_id SUBJ:<college>|<code>|nc:<category slug> (d-subject-save-key-three-part-s698), beside
// the credit band's row (r-subject-save-path-kb-curation-sam-2026-11-22; r-noncredit-disciplines-separate-in-mqs-
// sam-2026-11-21).
//
// WHAT THIS GUARDS (each a way a noncredit save would misfile a person's decision):
//   (1) ⭐ a noncredit-only code in one category saves its title and code under nc:<slug>, one row, the reviewer's email;
//   (2) ⭐ a code spanning several categories shows one form each, most courses first, the title on the dominant one
//       only, and each saves under its own key; a category with no code and no title to hold takes no save;
//   (3) ⭐ a category with no common code saves a title and asks for no code, in words;
//   (4) ⭐ a code with credit and noncredit courses saves the two bands under separate keys, and neither overwrites
//       the other;
//   (5) ⭐ Take it back on a noncredit row filters on the signed-in owner; another's save offers none;
//   (6) a category name with spaces, a slash or an ampersand takes the slug the titles file lists, and the key
//       round-trips back into that category's form;
//   (7) ⭐ signed out makes no write and shows no input;
//   (8) a title saved under another category stands on the dominant form, marked moved; a save whose category the
//       code no longer holds shows apart and settles no course, and says so where its title stands as the code's;
//       a failed read falls back to the build's decisions;
//   (9) ⭐ a form with no title field writes no title, and a title saved there earlier shows read-only with where the
//       code's title lives now (its category lost the most courses, or the code gained credit courses).
// Run from repo root: `npm test` (or `node tests/commons_subjects_nc_save.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const SCRIPTS = ["commons_progress.js", "commons_program_records.js", "commons_front.js", "commons_subjects.js", "commons.js"].map((f) => fs.readFileSync(f, "utf8"));
const LIVE = JSON.parse(fs.readFileSync("kb/status/local_subject_titles.json", "utf8"));
const C = LIVE.columns;
function row(o) { return C.map((k) => (k in o ? o[k] : null)); }
const NC = (cats, extra) => Object.assign({ printed_name: null, catalog_courses: 0, side: "state", title_state: "not_in_catalog", credit_courses: 0,
  noncredit_courses: cats.reduce((n, p) => n + p[1], 0), state_courses: cats.reduce((n, p) => n + p[1], 0), categories: cats }, extra || {});
const SLASH = "Arts/Crafts & Design";        /* a fixture category; tests/subject_decisions_noncredit_test.py checks its slug */
const FIX = {
  _rule: "rule", totals: { colleges: 1, named: 1, colleges_named: 1 }, columns: C,
  common_codes: { BSKL: "Interdisciplinary-Basic Skills: Noncredit", ESLN: "English as a Second Language (ESL): Noncredit", ENGL: "English", VOCE: "Vocational", KINE: "Kinesiology", HLSN: "Health and Safety: Noncredit" },
  title_case: LIVE.title_case, noncredit_mq: LIVE.noncredit_mq,
  noncredit_slugs: Object.assign({}, LIVE.noncredit_slugs, { [SLASH]: "arts-crafts-and-design" }),
  colleges: [{ slug: "alpha", college: "Alpha College", catalog_year: "2026-2027", read_at: "2026-11-20T10:00:00Z", rows: [
    row(Object.assign({ code: "NCV" }, NC([["Short-term Vocational", 4]]))),
    row(Object.assign({ code: "AED" }, NC([["Short-term Vocational", 48], ["Elementary and Secondary Basic Skills", 32], ["Workforce Preparation", 19], ["Health & Safety", 2], ["(no category in the export)", 1]]))),
    row(Object.assign({ code: "WFP" }, NC([["Workforce Preparation", 3]]))),
    row(Object.assign({ code: "HSN" }, NC([["Health & Safety", 2]]))),
    row(Object.assign({ code: "ARTN" }, NC([[SLASH, 1]]))),
    row({ code: "MIX", printed_name: "English", catalog_courses: 3, state_courses: 5, side: "both", title_state: "catalog", common: "ENGL", discipline: "English",
      credit_courses: 3, noncredit_courses: 2, categories: [["English as a Second Language (ESL)", 2]] })] }]
};
FIX.noncredit_slugs = Object.keys(FIX.noncredit_slugs).sort().reduce((o, k) => { o[k] = FIX.noncredit_slugs[k]; return o; }, {});
const FILES = {
  "kb/status/commons.json": JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8")),
  "kb/status/program-requirements.json": JSON.parse(fs.readFileSync("kb/status/program-requirements.json", "utf8")),
  "kb/status/commons_data.json": JSON.parse(fs.readFileSync("kb/status/commons_data.json", "utf8")),
  "kb/reference/industry_credential_skills.json": JSON.parse(fs.readFileSync("kb/reference/industry_credential_skills.json", "utf8")),
  "kb/status/local_subject_titles.json": FIX,
  "kb/status/subject_courses/alpha.json": { college: "Alpha College", slug: "alpha", columns: ["number", "title", "band", "listed", "units", "cid", "ccn", "mid"], codes: {} },
  "kb/status/local_subject_recommendations.json": { colleges: [{ slug: "alpha", rows: [{ code: "AED",
    title: { title: "Electrical Apprenticeship", level: "Medium", from: "noncredit_list", why: "noncredit list." } }] }] }
};
const REST = "https://hvuwhnbuahrtptokpqfh.supabase.co/rest/v1/kb_curation";
const ME = { email: "a@rccd.edu", access_token: "tok.en.x", refresh_token: "r" };

function load(hash, opt) {
  opt = opt || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-commons"><div id="commons-root">Loading</div></div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "dangerously" });
  const w = dom.window, o = {}, calls = [];
  let sess = opt.sess || null;
  Object.defineProperty(w, "localStorage", { value: { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } }, configurable: true });
  w.CPL_SESSION = {
    get: () => sess, isFresh: () => !!sess, ensureFresh: () => Promise.resolve(sess),
    authHeaders: (extra) => Object.assign({ apikey: "ANON", Authorization: "Bearer " + (sess ? sess.access_token : "ANON") }, extra || {}),
    viewAddress: () => {}
  };
  const all = Object.assign({}, FILES, opt.files || {});
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    if (url.indexOf(REST) === 0) {
      const method = init.method || "GET";
      calls.push({ url, method, headers: init.headers || {}, body: init.body });
      if (method === "GET") {
        if (opt.readStatus) return Promise.resolve({ ok: false, status: opt.readStatus, json: () => Promise.resolve([]) });
        const sel = /reviewer_email/.test(url);
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(opt.saves || [])).map((r) => { if (!sel) delete r.reviewer_email; return r; })) });
      }
      if (method === "POST") return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(null) });
      if (method === "DELETE") return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([{ course_id: "x" }]) });
    }
    const hit = all[url];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  SCRIPTS.forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, M: w.CPL_COMMONS, calls };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 30; i++) await tick(); }
const writesOf = (x) => x.calls.filter((c) => c.method !== "GET");
const bodies = (x) => writesOf(x).filter((c) => c.method === "POST").map((c) => JSON.parse(c.body));
const g = (x, id) => x.d.getElementById(id);
function typeIn(x, id, v) { const i = g(x, id); i.value = v; return i; }
const VOC = "csb-nc-short-term-vocational", BSK = "csb-nc-elementary-and-secondary-basic-skills", WP = "csb-nc-workforce-preparation";
const AT = "2026-11-22T10:00:00Z";
const save = (key, v, email) => ({ course_id: key, value: JSON.stringify(v), reviewed_at: AT, reviewer_email: email || ME.email, reviewer_label: "a reviewer" });

(async function () {
  /* (7) signed out */
  let x = load("#commons/subjects/alpha/AED");
  await x.M.boot(); await settle();
  let panel = x.d.querySelector("#csb-panel");
  check("(7) ⭐ signed out, a noncredit code shows no input and says to sign in", panel && !panel.querySelector("input, fieldset")
    && /Edit opens once you sign in/.test(txt(g(x, "csb-edit-signin"))));
  check("(7) ⭐ signed out, nothing is written", writesOf(x).length === 0);

  /* (1) a noncredit-only code under one category */
  x = load("#commons/subjects/alpha/NCV", { sess: ME });
  await x.M.boot(); await settle();
  const sets1 = x.d.querySelectorAll("#csb-panel fieldset.csb-nc-form");
  check("(1) one category, one form, named with its course count, and no credit form", sets1.length === 1
    && txt(sets1[0].querySelector("legend")) === "Short-term Vocational, 4 noncredit courses" && !g(x, "csb-ed-title") && !g(x, "csb-ed-save"));
  check("(1) the form names the category's noncredit MQ discipline and its common code, prefilled as a recommendation",
    /Noncredit MQ discipline: Vocational\. Its common subject code is VOCE\./.test(txt(g(x, VOC + "-mq"))) && g(x, VOC + "-code").value === "VOCE"
    && /Filled in from the recommendation: the common subject code/.test(txt(g(x, VOC + "-rec"))) && g(x, VOC + "-title").value === "");
  check("(1) the panel says in one line where the code's title lives", /keeps its title on the form of the category with the most courses, Short-term Vocational/.test(txt(g(x, "csb-nc-title-rule"))));
  typeIn(x, VOC + "-title", "Vocational Training");
  g(x, VOC + "-save").click(); await settle();
  let b = bodies(x);
  check("(1) ⭐ the save posts one row under nc:<slug>: title and code, the field, the reviewer's own email",
    b.length === 1 && b[0].course_id === "SUBJ:alpha|NCV|nc:short-term-vocational" && b[0].field === "subject_decision"
    && b[0].value === JSON.stringify({ local_title: "Vocational Training", common_code: "VOCE" }) && b[0].reviewer_email === ME.email
    && writesOf(x)[0].url === REST + "?on_conflict=course_id,field", JSON.stringify(b));
  const ncvRow = x.d.querySelector('.csb-codes tr[data-code="NCV"]');
  check("(1) after the save the row shows the title and the code from the person's save, and Take it back is offered",
    ncvRow.getAttribute("data-saved") === "yes" && /^Vocational Training Saved by a person/.test(txt(ncvRow.children[2])) && /^VOCE Vocational Saved by a person/.test(txt(ncvRow.children[3]))
    && !!g(x, VOC + "-undo") && /^Saved\./.test(txt(g(x, VOC + "-status"))));

  /* (2) a code spanning several categories */
  x = load("#commons/subjects/alpha/AED", { sess: ME });
  await x.M.boot(); await settle();
  const sets = Array.from(x.d.querySelectorAll("#csb-panel fieldset.csb-nc-form"));
  check("(2) ⭐ one form per category, most courses first", sets.map((s) => s.getAttribute("data-slug")).join(",")
    === "short-term-vocational,elementary-and-secondary-basic-skills,workforce-preparation,health-and-safety,uncategorized", sets.map((s) => s.getAttribute("data-slug")).join(","));
  check("(2) ⭐ the title field is on the dominant category's form only", x.d.querySelectorAll('#csb-panel input[id$="-title"]').length === 1 && !!g(x, VOC + "-title")
    && g(x, VOC + "-title").value === "Electrical Apprenticeship" && /the local title and the common subject code/.test(txt(g(x, VOC + "-rec"))));
  check("(2) the other category with a code takes a code only", !g(x, BSK + "-title") && g(x, BSK + "-code").value === "BSKL" && !!g(x, BSK + "-save"));
  check("(2) a category with no code and no title to hold takes no save and says so; Health and Safety takes HLSN since S705", !g(x, WP + "-save") && !g(x, WP + "-code")
    && /takes no save: its title is the code’s, and it has no common subject code yet/.test(txt(g(x, WP + "-code-none")))
    && !!g(x, "csb-nc-health-and-safety-save") && g(x, "csb-nc-health-and-safety-code").value === "HLSN" && !g(x, "csb-nc-uncategorized-save")
    && /COCI names no noncredit category for these courses/.test(txt(g(x, "csb-nc-uncategorized-mq"))));
  typeIn(x, VOC + "-code", "voce");
  g(x, VOC + "-save").click(); await settle();
  g(x, BSK + "-save").click(); await settle();
  b = bodies(x);
  check("(2) ⭐ each form saves under its own key, the title only with the dominant category",
    b.length === 2 && b[0].course_id === "SUBJ:alpha|AED|nc:short-term-vocational" && b[0].value === JSON.stringify({ local_title: "Electrical Apprenticeship", common_code: "VOCE" })
    && b[1].course_id === "SUBJ:alpha|AED|nc:elementary-and-secondary-basic-skills" && b[1].value === JSON.stringify({ common_code: "BSKL" }), JSON.stringify(b));
  check("(2) after both saves, the other forms show the code's title read-only", /Local title: Electrical Apprenticeship/.test(txt(g(x, BSK + "-title-ro")))
    && /Local title: Electrical Apprenticeship/.test(txt(g(x, WP + "-title-ro"))));

  /* (3) a category with no common code */
  x = load("#commons/subjects/alpha/WFP", { sess: ME });
  await x.M.boot(); await settle();
  check("(3) ⭐ a category with no common code offers a title and no code field, and says so in words", !!g(x, WP + "-title") && !g(x, WP + "-code")
    && /Workforce Preparation has no common subject code yet, so this form takes a title and no code\./.test(txt(g(x, WP + "-code-none"))));
  g(x, WP + "-save").click(); await settle();
  check("(3) an empty title asks for a title, and nothing is sent", writesOf(x).length === 0 && txt(g(x, WP + "-status")) === "Type a local title, then save.");
  typeIn(x, WP + "-title", "Career Readiness");
  g(x, WP + "-save").click(); await settle();
  b = bodies(x);
  check("(3) ⭐ the save carries the title and no code", b.length === 1 && b[0].course_id === "SUBJ:alpha|WFP|nc:workforce-preparation"
    && b[0].value === JSON.stringify({ local_title: "Career Readiness" }), JSON.stringify(b));

  /* (4) credit and noncredit apart */
  x = load("#commons/subjects/alpha/MIX", { sess: ME });
  await x.M.boot(); await settle();
  const ESL = "csb-nc-english-as-a-second-language-esl";
  check("(4) a code with both bands shows the credit form and one noncredit form, the title on the credit form",
    !!g(x, "csb-ed-title") && !!g(x, "csb-ed-code") && !!g(x, ESL + "-code") && !g(x, ESL + "-title")
    && /keeps its title with its credit courses above/.test(txt(g(x, "csb-nc-title-rule"))) && /each noncredit category below has its own form/.test(txt(g(x, "csb-edit-band"))));
  g(x, "csb-ed-save").click(); await settle();
  g(x, ESL + "-save").click(); await settle();
  b = bodies(x);
  check("(4) ⭐ the two bands save under separate keys", b.length === 2 && b[0].course_id === "SUBJ:alpha|MIX|credit" && b[0].value === JSON.stringify({ local_title: "English", common_code: "ENGL" })
    && b[1].course_id === "SUBJ:alpha|MIX|nc:english-as-a-second-language-esl" && b[1].value === JSON.stringify({ common_code: "ESLN" }), JSON.stringify(b));
  const mixRow = x.d.querySelector('.csb-codes tr[data-code="MIX"]');
  check("(4) ⭐ the noncredit save does not overwrite the credit one: the row shows the credit code", /^ENGL English Saved by a person/.test(txt(mixRow.children[3]))
    && g(x, "csb-ed-code").value === "ENGL" && g(x, ESL + "-code").value === "ESLN");
  const BOTH = [save("SUBJ:alpha|MIX|credit", { common_code: "KINE" }), save("SUBJ:alpha|MIX|nc:english-as-a-second-language-esl", { common_code: "ESLN" }, "b@rccd.edu")];
  x = load("#commons/subjects/alpha/MIX", { sess: ME, saves: BOTH });
  await x.M.boot(); await settle();
  check("(4) ⭐ read back, each form opens on its own band's save", g(x, "csb-ed-code").value === "KINE" && g(x, ESL + "-code").value === "ESLN"
    && /^KINE Kinesiology/.test(txt(x.d.querySelector('.csb-codes tr[data-code="MIX"]').children[3])));

  /* (5) Take it back on a noncredit row */
  check("(5) ⭐ another reviewer's noncredit save offers no Take it back and says a new Save replaces it", !g(x, ESL + "-undo")
    && txt(g(x, ESL + "-others")) === "Another reviewer saved this decision. A new Save replaces it." && !!g(x, "csb-ed-undo"));
  x = load("#commons/subjects/alpha/AED", { sess: ME, saves: [save("SUBJ:alpha|AED|nc:elementary-and-secondary-basic-skills", { common_code: "BSKL" })] });
  await x.M.boot(); await settle();
  g(x, BSK + "-undo").click(); await settle();
  const dels = writesOf(x);
  check("(5) ⭐ Take it back sends one DELETE for the noncredit key, filtered to the signed-in reviewer's email",
    dels.length === 1 && dels[0].method === "DELETE"
    && dels[0].url === REST + "?course_id=eq.SUBJ%3Aalpha%7CAED%7Cnc%3Aelementary-and-secondary-basic-skills&field=eq.subject_decision&reviewer_email=eq.a%40rccd.edu&select=course_id", dels[0] && dels[0].url);
  check("(5) the form reads from the files again", !g(x, BSK + "-undo") && /Taken back/.test(txt(g(x, BSK + "-status"))) && g(x, BSK + "-code").value === "BSKL");

  /* (6) slugs from the titles file, round-tripped */
  x = load("#commons/subjects/alpha/HSN", { sess: ME });
  await x.M.boot(); await settle();
  typeIn(x, "csb-nc-health-and-safety-title", "First Aid");
  g(x, "csb-nc-health-and-safety-save").click(); await settle();
  const x2 = load("#commons/subjects/alpha/ARTN", { sess: ME });
  await x2.M.boot(); await settle();
  typeIn(x2, "csb-nc-arts-crafts-and-design-title", "Arts and Crafts");
  g(x2, "csb-nc-arts-crafts-and-design-save").click(); await settle();
  const k1 = bodies(x)[0] && bodies(x)[0].course_id, k2 = bodies(x2)[0] && bodies(x2)[0].course_id;
  check("(6) ⭐ an ampersand and a slash in a category name give the listed slug: lower-case letters, digits and hyphens",
    k1 === "SUBJ:alpha|HSN|nc:health-and-safety" && k2 === "SUBJ:alpha|ARTN|nc:arts-crafts-and-design" && /^nc:[a-z0-9]+(-[a-z0-9]+)*$/.test(k2.split("|").pop()), k1 + " " + k2);
  const back = x2.w.CPL_COMMONS_SUBJECTS.savesModel([save(k2, { local_title: "Arts and Crafts" })]);
  x = load("#commons/subjects/alpha/ARTN", { sess: ME, saves: [save(k2, { local_title: "Arts and Crafts" })] });
  await x.M.boot(); await settle();
  check("(6) ⭐ the key round-trips: read back, it opens that category's form on the saved title",
    back["alpha|ARTN|nc:arts-crafts-and-design"] && g(x, "csb-nc-arts-crafts-and-design-title").value === "Arts and Crafts" && !!g(x, "csb-nc-arts-crafts-and-design-undo")
    && !x.d.querySelector('fieldset[data-gone="yes"]'));

  /* (8) moved, gone, and the build's fallback */
  const MOV = [save("SUBJ:alpha|AED|nc:elementary-and-secondary-basic-skills", { local_title: "Electronics", common_code: "BSKL" }, "b@rccd.edu"),
    save("SUBJ:alpha|AED|nc:parenting", { common_code: "PARN" })];
  x = load("#commons/subjects/alpha/AED", { sess: ME, saves: MOV });
  await x.M.boot(); await settle();
  check("(8) ⭐ a title saved under another category stands on the dominant form, marked moved", g(x, VOC + "-title").value === "Electronics"
    && /The title Electronics was saved on the Elementary and Secondary Basic Skills form/.test(txt(g(x, VOC + "-moved")))
    && /^Electronics Saved by a person/.test(txt(x.d.querySelector('.csb-codes tr[data-code="AED"]').children[2])));
  const gone = x.d.querySelector('fieldset[data-gone="yes"]');
  check("(8) ⭐ a save under a category the code no longer holds shows apart, settles nothing, and its owner may take it back",
    gone && gone.getAttribute("data-slug") === "parenting" && /COCI lists no course of AED in it now\. It settles no course: the common subject code PARN\./.test(txt(gone))
    && !gone.querySelector("input") && !!g(x, "csb-nc-gone-parenting-undo"));
  check("(8) the row's common code is the dominant category's, never a moved category's", !/BSKL|PARN/.test(txt(x.d.querySelector('.csb-codes tr[data-code="AED"]').children[3])));
  x = load("#commons/subjects/alpha/AED", { sess: ME, saves: [save("SUBJ:alpha|AED|nc:parenting", { local_title: "Parenting Classes", common_code: "PARN" })] });
  await x.M.boot(); await settle();
  const gone2 = x.d.querySelector('fieldset[data-gone="yes"]');
  check("(8) ⭐ a gone save whose title is the code's title says so, as the list row and the dominant form do",
    /Its title, Parenting Classes, stands as the code’s title until the Short-term Vocational form saves one\. It settles no course: the common subject code PARN\./.test(txt(gone2))
    && !/the title Parenting Classes/.test(txt(gone2)) && g(x, VOC + "-title").value === "Parenting Classes"
    && /^Parenting Classes Saved by a person/.test(txt(x.d.querySelector('.csb-codes tr[data-code="AED"]').children[2])));

  /* (9) a form with no title field never writes a title */
  const FLIP = [save("SUBJ:alpha|AED|nc:elementary-and-secondary-basic-skills", { local_title: "Old Basic Skills", common_code: "BSKL" }, ME.email),
    save("SUBJ:alpha|AED|nc:short-term-vocational", { local_title: "Electrical Apprenticeship", common_code: "VOCE" }, ME.email)];
  x = load("#commons/subjects/alpha/AED", { sess: ME, saves: FLIP });
  await x.M.boot(); await settle();
  check("(9) ⭐ a title saved when its category held most courses shows read-only, saying where the code's title lives now",
    !g(x, BSK + "-title") && /^Saved here earlier: Old Basic Skills\. It was saved as this form’s title when Elementary and Secondary Basic Skills held most of the courses\. The code’s title now lives on the Short-term Vocational form, and a Save here writes no title\.$/.test(txt(g(x, BSK + "-stale")))
    && /Local title: Electrical Apprenticeship/.test(txt(g(x, BSK + "-title-ro"))));
  g(x, BSK + "-save").click(); await settle();
  b = bodies(x);
  check("(9) ⭐ saving that form's code writes no title, so the old one is never stamped anew",
    b.length === 1 && b[0].course_id === "SUBJ:alpha|AED|nc:elementary-and-secondary-basic-skills" && b[0].value === JSON.stringify({ common_code: "BSKL" }), JSON.stringify(b));
  x = load("#commons/subjects/alpha/MIX", { sess: ME, saves: [save("SUBJ:alpha|MIX|nc:english-as-a-second-language-esl", { local_title: "ESL Noncredit", common_code: "ESLN" })] });
  await x.M.boot(); await settle();
  const ESL2 = "csb-nc-english-as-a-second-language-esl";
  check("(9) ⭐ a code that gained credit courses says its noncredit-only title now lives on the credit form",
    /^Saved here earlier: ESL Noncredit\. It was saved as this form’s title when MIX held noncredit courses only\. The code’s title now lives on the credit form above, and a Save here writes no title\.$/.test(txt(g(x, ESL2 + "-stale")))
    && g(x, "csb-ed-title").value === "English");
  g(x, ESL2 + "-save").click(); await settle();
  b = bodies(x);
  check("(9) and its Save writes the code alone", b.length === 1 && b[0].value === JSON.stringify({ common_code: "ESLN" }), JSON.stringify(b));
  const BUILT = JSON.parse(JSON.stringify(FIX));
  BUILT.colleges[0].rows.forEach((r) => { if (r[0] === "AED") r[C.indexOf("noncredit_decisions")] = [{ key: "SUBJ:alpha|AED|nc:elementary-and-secondary-basic-skills", category: "Elementary and Secondary Basic Skills",
    common_code: "BSKL", discipline: "Interdisciplinary-Basic Skills: Noncredit", local_title: null, who: "Sam", at: "2026-11-22T09:00:00Z", holds: true }]; });
  x = load("#commons/subjects/alpha/AED", { sess: ME, readStatus: 500, files: { "kb/status/local_subject_titles.json": BUILT } });
  await x.M.boot(); await settle();
  check("(8) where the live read fails, the build's noncredit decision fills its form", g(x, BSK + "-code").value === "BSKL" && !g(x, BSK + "-rec") && !g(x, BSK + "-undo"));
  x = load("#commons/subjects/alpha/AED", { sess: ME, files: { "kb/status/local_subject_titles.json": BUILT } });
  await x.M.boot(); await settle();
  check("(8) where the live read holds no such save, the form reads the files again", !!g(x, BSK + "-rec") && !g(x, BSK + "-others"));

  /* (9) S705, Sam: "the appearance makes it seem like I am changing all the listed courses to AED, even though I maybe
     be just moving the AED out and associating them with the common subject VOCE". The panel's noncredit courses stand
     under their COCI category, each heading saying the code its form's save sets and that the local subject stays. */
  const COURSES = { college: "Alpha College", slug: "alpha", columns: ["number", "title", "band", "listed", "units", "cid", "ccn", "mid", "category"],
    codes: { AED: [["10.07", "Fitness for Older Adults", "N", "COCI", 0, "", "", "ELEC M9008", "Courses for Older Adults"],
      ["36.02", "Intro to Construction", "E", "COCI", 0, "", "", "ELEC M90CY", "Short-term Vocational"],
      ["39.01", "Painting Trades", "N", "COCI", 0, "", "", "ELEC M90CK", "Short-term Vocational"],
      ["42.03A", "ESL Conversation A", "N", "COCI", 0, "", "", "ELEC M90CZ", "English as a Second Language (ESL)"],
      ["50.1", "Old Course", "N", "COCI", 0, "", "", "ELEC M90ZZ", ""]] } };
  x = load("#commons/subjects/alpha/AED", { sess: ME, saves: [save("SUBJ:alpha|AED|nc:short-term-vocational", { local_title: "Adult Education", common_code: "VOCE" })],
    files: { "kb/status/subject_courses/alpha.json": COURSES } });
  await x.M.boot(); await settle();
  const heads = Array.from(x.d.querySelectorAll("#csb-panel .csb-band")).map((h) => txt(h));
  check("(9) ⭐ the noncredit courses stand under their category, the most courses first, the uncategorized last",
    JSON.stringify(heads) === JSON.stringify(["Noncredit, Short-term Vocational (2)", "Noncredit, Courses for Older Adults (1)", "Noncredit, English as a Second Language (ESL) (1)", "Noncredit, no category in COCI’s export (1)"]), heads.join(" | "));
  const lines = Array.from(x.d.querySelectorAll("#csb-panel .csb-cat-code")).map((p) => txt(p));
  check("(9) ⭐ the saved category says its code applies to its own courses only and the local subject stays",
    /^Common subject code VOCE, from a person’s save on the Short-term Vocational form\. It applies to these 2 courses only: their local subject stays AED, and their M-IDs move to VOCE at the next re-mint\.$/.test(lines[0]), lines[0]);
  check("(9) ⭐ an unsaved category names its MQ code and says a Save on its form applies it to its courses only",
    /^Not settled yet\. Courses for Older Adults’s noncredit MQ discipline, Older Adults: Noncredit, has the common subject code OLAD; a Save on that form above applies it to this course only\. The local subject stays AED\.$/.test(lines[1]), lines[1]);
  check("(9) the uncategorized courses say no category's save reaches them", /no category’s save reaches it\. Move it/.test(lines[3]));
  check("(9) an M-ID minted under another code than its category's says so; an enhanced course says so",
    /M-ID ELEC M90CY \(minted under ELEC\)/.test(txt(x.d.querySelector('#csb-panel tr[data-number="36.02"]'))) && /COCI, enhanced/.test(txt(x.d.querySelector('#csb-panel tr[data-number="36.02"]'))));

  let pass = 0;
  results.forEach(([n, ok, why]) => { if (ok) pass++; else console.log("FAIL", n, why ? "\n     " + String(why).slice(0, 400) : ""); });
  console.log(pass + "/" + results.length + " checks passed");
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });

// Edit and Save on the Commons Subjects page (S701, #3655 item 6; Sam, 2026-11-22, to the save path: "Fine.",
// r-subject-save-path-kb-curation-sam-2026-11-22).
//
// WHAT THIS GUARDS (each a way a save would misfile a person's decision, or a read would mislead):
//   (1) ⭐ signed out, the panel shows no inputs and the page makes no write; the saves are read with the label only;
//   (2) ⭐ a save posts exactly one row: course_id SUBJ:<college>|<code>|<band>, field subject_decision, value JSON text
//       with local_title and or common_code, under the reviewer's own email, as an upsert on (course_id, field);
//       credit for a code with credit courses in COCI, whole for a code COCI does not list;
//   (3) ⭐ a code whose COCI courses are all noncredit, with no COCI noncredit category on file, offers no form
//       (the noncredit forms, one per category, are guarded in commons_subjects_nc_save.test.js);
//   (4) ⭐ an unknown common code and an all-capitals title make no request, and the title offers its Title Case form;
//   (5) ⭐ Take it back shows only on the signed-in reviewer's own save, and its DELETE names that reviewer's email;
//       on another's save, a filed decision included, the page says a new Save replaces it;
//   (6) ⭐ a saved row wins over the file's title, its common code and every recommendation;
//   (7) a failed read of the saves still draws the list and says so;
//   (8) a code holding a slash or an ampersand (ES/A, A&P) round-trips through the key and the URL encoding;
//   (9) the page's Title Case gives what kb/subject_title_case.py gives, from the word lists the titles file carries;
//  (10) a refused token marks the sign-in ended, and the page stores nothing;
//  (11) ⭐ a code whose band moved since its save still shows the save, says the band changed, and saves anew under
//       the current band;
//  (12) ⭐ a save the daily build carries (the titles file's `decision`, #3655) shows one line: the live save where the
//       read holds it, the file's where the read failed, and the files' own values where the save was taken back.
// Run from repo root: `npm test` (or `node tests/commons_subjects_save.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const SCRIPTS = ["commons_progress.js", "commons_program_records.js", "commons_front.js", "commons_subjects.js", "commons.js"].map((f) => fs.readFileSync(f, "utf8"));
const LIVE = JSON.parse(fs.readFileSync("kb/status/local_subject_titles.json", "utf8"));
const FIX = JSON.parse(fs.readFileSync("tests/fixtures/local_subject_titles_fixture.json", "utf8"));
const C = FIX.columns;
function row(o) { return C.map((k) => (k in o ? o[k] : null)); }
const alpha = FIX.colleges.find((c) => c.slug === "alpha");
alpha.rows.push(
  row({ code: "ES/A", printed_name: "Exercise Science Activities", catalog_courses: 1, state_courses: 1, side: "both", title_state: "catalog", credit_courses: 1, noncredit_courses: 0 }),
  row({ code: "A&P", printed_name: "Anatomy and Physiology", catalog_courses: 2, state_courses: 2, side: "both", title_state: "catalog", credit_courses: 2, noncredit_courses: 0 }),
  row({ code: "NCX", printed_name: null, catalog_courses: 0, state_courses: 3, side: "state", title_state: "not_in_catalog", credit_courses: 0, noncredit_courses: 3 }),
  row({ code: "AP", printed_name: "Anatomy and Physiology", catalog_courses: 1, state_courses: 0, side: "catalog", title_state: "catalog", credit_courses: 0, noncredit_courses: 0 }));
FIX.common_codes = { BIOL: "Biology", ENGL: "English", KINE: "Kinesiology", MATH: "Mathematics", WELD: "Welding" };
FIX.title_case = LIVE.title_case;
const FILES = {
  "kb/status/commons.json": JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8")),
  "kb/status/program-requirements.json": JSON.parse(fs.readFileSync("kb/status/program-requirements.json", "utf8")),
  "kb/status/commons_data.json": JSON.parse(fs.readFileSync("kb/status/commons_data.json", "utf8")),
  "kb/reference/industry_credential_skills.json": JSON.parse(fs.readFileSync("kb/reference/industry_credential_skills.json", "utf8")),
  "kb/status/local_subject_titles.json": FIX,
  "kb/status/subject_courses/alpha.json": { college: "Alpha College", slug: "alpha", columns: ["number", "title", "band", "listed", "units", "cid", "ccn", "mid"],
    codes: { MATH: [["1", "Algebra", "C", "Both", 4, "", "", ""]], "ES/A": [["5", "Yoga", "C", "Both", 1, "", "", ""]] } },
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
  let writes = 0, sess = opt.sess || null;
  Object.defineProperty(w, "localStorage", { value: { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { writes++; o[k] = String(v); }, removeItem: (k) => { delete o[k]; } }, configurable: true });
  w.CPL_SESSION = {
    get: () => sess, isFresh: () => !!sess && opt.fresh !== false, ensureFresh: () => Promise.resolve(sess),
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
        /* As the live grants do: a read that does not select reviewer_email gets no reviewer_email. */
        const sel = /reviewer_email/.test(url);
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(opt.saves || [])).map((r) => { if (!sel) delete r.reviewer_email; return r; })) });
      }
      if (method === "POST") { const st = opt.postStatus || 201; return Promise.resolve({ ok: st < 300, status: st, json: () => Promise.resolve(null) }); }
      if (method === "DELETE") return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(opt.deleted === undefined ? [{ course_id: "x" }] : opt.deleted) });
    }
    const hit = all[url];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  SCRIPTS.forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, M: w.CPL_COMMONS, calls, writes: () => writes, signIn: (s) => { sess = s; } };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 30; i++) await tick(); }
const writesOf = (x) => x.calls.filter((c) => c.method !== "GET");
function typeIn(x, id, v) { const i = x.d.getElementById(id); i.value = v; return i; }

(async function () {
  /* (1) signed out */
  let x = load("#commons/subjects/alpha/MATH");
  await x.M.boot(); await settle();
  let panel = x.d.querySelector("#csb-panel");
  check("(1) ⭐ signed out, the panel offers no inputs and says to sign in", panel && !panel.querySelector("input") && !panel.querySelector("#csb-ed-save")
    && /Edit opens once you sign in as a reviewer/.test(txt(panel.querySelector("#csb-edit-signin"))));
  check("(1) ⭐ signed out, nothing is written", writesOf(x).length === 0);
  const read = x.calls.filter((c) => c.method === "GET")[0];
  check("(1) the saves are read once, with the label only and no reviewer's token, Range-paged",
    read && /select=course_id,value,reviewed_at,reviewer_label&/.test(read.url) && !/reviewer_email/.test(read.url) && read.headers.Authorization === "Bearer ANON"
    && /&field=eq\.subject_decision&/.test(read.url) && /&course_id=like\.SUBJ%3A\*&order=course_id$/.test(read.url) && read.headers.Range === "0-999", read && read.url);

  /* (2) a save on a credit code */
  x = load("#commons/subjects/alpha/MATH", { sess: ME });
  await x.M.boot(); await settle();
  panel = x.d.querySelector("#csb-panel");
  const ti = x.d.getElementById("csb-ed-title"), co = x.d.getElementById("csb-ed-code");
  check("(2) signed in, the form is filled from the recommendation and says so", ti && ti.value === "Mathematics" && co.value === "MATH"
    && /Filled in from the recommendation: the local title and the common subject code/.test(txt(x.d.getElementById("csb-edit-rec"))));
  const CSSX = x.w.CPL_COMMONS_SUBJECTS.CSS, WORD24 = /\.csb-word \{[^}]*min-width:24px; min-height:24px/.test(CSSX);
  check("(2) each field has its label and a 24px target at least, and Save is a 24px underlined word", x.d.querySelector('label[for="csb-ed-title"]') && x.d.querySelector('label[for="csb-ed-code"]')
    && /\.csb-input \{[^}]*min-height:32px/.test(CSSX) && WORD24 && x.d.getElementById("csb-ed-save").classList.contains("csb-word") && x.d.getElementById("csb-ed-save").tagName === "BUTTON");
  check("(2) the signed-in read asks for the email beside the label, with the token",
    /reviewer_email,reviewer_label/.test(x.calls[0].url) && x.calls[0].headers.Authorization === "Bearer " + ME.access_token);
  typeIn(x, "csb-ed-code", "math");
  x.d.getElementById("csb-ed-save").click(); await settle();
  let posts = writesOf(x);
  const body = posts[0] && JSON.parse(posts[0].body);
  check("(2) ⭐ a save posts exactly one row: the key, the field, the value JSON and the reviewer's email",
    posts.length === 1 && posts[0].method === "POST" && posts[0].url === REST + "?on_conflict=course_id,field"
    && JSON.stringify(Object.keys(body)) === JSON.stringify(["course_id", "field", "value", "reviewer_email"])
    && body.course_id === "SUBJ:alpha|MATH|credit" && body.field === "subject_decision"
    && body.value === JSON.stringify({ local_title: "Mathematics", common_code: "MATH" }) && body.reviewer_email === "a@rccd.edu", posts[0] && posts[0].body);
  check("(2) it is an upsert on the primary key, under the reviewer's token", posts[0].headers.Prefer === "resolution=merge-duplicates,return=minimal"
    && posts[0].headers.Authorization === "Bearer " + ME.access_token);
  const mrow = x.d.querySelector('.csb-codes tr[data-code="MATH"]');
  check("(2) after the save the row shows the decision and who saved it, and Take it back is offered",
    mrow.getAttribute("data-saved") === "yes" && /^Mathematics Saved by a person, a@rccd\.edu/.test(txt(mrow.children[2]))
    && /^MATH Mathematics Saved by a person/.test(txt(mrow.children[3])) && !!x.d.getElementById("csb-ed-undo")
    && /^Saved\./.test(txt(x.d.getElementById("csb-ed-status"))));
  check("(2) Take it back is a 24px underlined word too", WORD24 && x.d.getElementById("csb-ed-undo").classList.contains("csb-word") && x.d.getElementById("csb-ed-undo").tagName === "BUTTON");

  /* (2) a catalog-only code is keyed whole; (3) a noncredit-only code has no form */
  x = load("#commons/subjects/alpha/ZZZ", { sess: ME });
  await x.M.boot(); await settle();
  check("(2) a code COCI does not list says a save settles the whole code", /settles the whole code/.test(txt(x.d.getElementById("csb-edit-band"))));
  typeIn(x, "csb-ed-code", "KINE");
  x.d.getElementById("csb-ed-save").click(); await settle();
  posts = writesOf(x);
  check("(2) ⭐ a catalog-only code saves under the whole band", posts.length === 1 && JSON.parse(posts[0].body).course_id === "SUBJ:alpha|ZZZ|whole"
    && JSON.parse(posts[0].body).value === JSON.stringify({ local_title: "Catalog Only Studies", common_code: "KINE" }));
  x = load("#commons/subjects/alpha/NCX", { sess: ME });
  await x.M.boot(); await settle();
  panel = x.d.querySelector("#csb-panel");
  check("(3) ⭐ a noncredit-only code with no noncredit category on file offers no form and says why",
    panel && !panel.querySelector("input") && !x.d.getElementById("csb-ed-save") && /is noncredit, and no COCI noncredit category is on file for them, so this code has no Edit yet/.test(txt(x.d.getElementById("csb-edit-hold"))));

  /* (4) refusals make no request */
  x = load("#commons/subjects/alpha/MATH", { sess: ME });
  await x.M.boot(); await settle();
  typeIn(x, "csb-ed-code", "XXXX");
  x.d.getElementById("csb-ed-save").click(); await settle();
  check("(4) ⭐ an unknown common code makes no request and says why beside the field",
    writesOf(x).length === 0 && /XXXX is not a common subject code on the Common Subjects Reference\. .*Nothing was saved\./.test(txt(x.d.getElementById("csb-ed-code-msg"))));
  typeIn(x, "csb-ed-code", "MATH");
  typeIn(x, "csb-ed-title", "SPEECH PATHOLOGY");
  x.d.getElementById("csb-ed-save").click(); await settle();
  const use = x.d.getElementById("csb-ed-use");
  check("(4) ⭐ an all-capitals title makes no request and offers its Title Case form",
    writesOf(x).length === 0 && /not in capitals\. Nothing was saved\./.test(txt(x.d.getElementById("csb-ed-title-msg"))) && use && txt(use) === "Use “Speech Pathology”");
  use.click();
  check("(4) the offer fills the field; a save then posts the Title Case title", x.d.getElementById("csb-ed-title").value === "Speech Pathology");
  x.d.getElementById("csb-ed-save").click(); await settle();
  check("(4) the corrected title saves", writesOf(x).length === 1 && JSON.parse(writesOf(x)[0].body).value === JSON.stringify({ local_title: "Speech Pathology", common_code: "MATH" }));
  x = load("#commons/subjects/alpha/MATH", { sess: ME });
  await x.M.boot(); await settle();
  typeIn(x, "csb-ed-title", ""); typeIn(x, "csb-ed-code", "");
  x.d.getElementById("csb-ed-save").click(); await settle();
  check("(4) an empty form makes no request", writesOf(x).length === 0 && /Type a local title or a common subject code/.test(txt(x.d.getElementById("csb-ed-status"))));

  /* (6) the overlay wins; (5) Take it back */
  const OTHER = "b@rccd.edu", AT = "2026-11-22T10:00:00Z";
  const SAVES = [
    { course_id: "SUBJ:alpha|MATH|credit", value: JSON.stringify({ local_title: "Maths Saved", common_code: "KINE" }), reviewed_at: AT, reviewer_email: OTHER, reviewer_label: "a reviewer" },
    { course_id: "SUBJ:alpha|ENGL|credit", value: JSON.stringify({ common_code: "BIOL" }), reviewed_at: AT, reviewer_email: OTHER, reviewer_label: "a reviewer" },
    { course_id: "SUBJ:alpha|ZZZ|whole", value: JSON.stringify({ common_code: "KINE", decided_by: "Sam", decided_at: "2026-11-21T21:11:00Z" }), reviewed_at: "2026-11-22T11:00:00Z", reviewer_email: "subjects-s701@bot", reviewer_label: "subjects-s701@bot" },
    { course_id: "SUBJ:alpha|A&P|credit", value: JSON.stringify({ common_code: "BIOL" }), reviewed_at: AT, reviewer_email: ME.email, reviewer_label: "a reviewer" },
    { course_id: "SUBJ:alpha|ES/A|credit", value: JSON.stringify({ local_title: "Exercise Science" }), reviewed_at: AT, reviewer_email: ME.email, reviewer_label: "a reviewer" },
    { course_id: "SUBJ:alpha|WELD|credit", value: JSON.stringify({ common_code: "WELD" }), reviewed_at: AT, reviewer_email: ME.email, reviewer_label: "a reviewer" },
    { course_id: "SUBJ:alpha|AP|whole", value: JSON.stringify({ common_code: "BIOL", decided_by: "Sam", decided_at: "2026-11-21T21:11:00Z" }), reviewed_at: AT, reviewer_email: "subjects-s701@bot", reviewer_label: "subjects-s701@bot" },
    /* a credit-band row for a code that is noncredit-only today: no row shows it, so the count leaves it out */
    { course_id: "SUBJ:alpha|NCX|credit", value: JSON.stringify({ common_code: "KINE" }), reviewed_at: AT, reviewer_email: OTHER, reviewer_label: "a reviewer" }];
  x = load("#commons/subjects/alpha", { saves: SAVES });
  await x.M.boot(); await settle();
  const m = x.d.querySelector('.csb-codes tr[data-code="MATH"]'), e = x.d.querySelector('.csb-codes tr[data-code="ENGL"]');
  check("(6) ⭐ a saved title replaces the chip and the recommended title", txt(m.children[2]) === "Maths Saved Saved by a person, November 22, 2026."
    && !m.children[2].querySelector(".csb-chip") && !m.children[2].querySelector(".csb-rec"));
  check("(6) ⭐ a saved common code replaces the recommended one and shows its discipline", txt(m.children[3]) === "KINE Kinesiology Saved by a person, November 22, 2026."
    && !m.children[3].querySelector(".csb-rec"));
  check("(6) ⭐ a saved common code wins over the subject map's", /^BIOL Biology Saved by a person/.test(txt(e.children[3])) && txt(e.children[2]) === "English");
  check("(6) a signed-out read names no reviewer", !/a reviewer|@/.test(txt(m.children[2])));
  check("(6) a filed decision reads Filed for Sam with its decision date, never the cohort id",
    txt(x.d.querySelector('.csb-codes tr[data-code="ZZZ"]').children[3]) === "KINE Kinesiology Filed for Sam, November 21, 2026." && !/@bot/.test(txt(x.d.querySelector(".csb-codes"))));
  check("(6) ⭐ the page counts the rows that show a save: 7 of the 8 saved rows (the noncredit-only code's credit row shows nowhere)",
    /7 codes carry a person’s save\./.test(txt(x.d.querySelector(".csb-stamp"))) && x.d.querySelectorAll('.csb-codes tr[data-saved="yes"]').length === 7);
  check("(6) a noncredit-only row takes no saved value", !x.d.querySelector('.csb-codes tr[data-code="NCX"]').getAttribute("data-saved"));
  x = load("#commons/subjects/alpha/ZZZ", { sess: ME, saves: SAVES });
  await x.M.boot(); await settle();
  check("(6) the form opens on the saved values", x.d.getElementById("csb-ed-code").value === "KINE" && !x.d.getElementById("csb-edit-rec"));
  /* (5) Take it back only on the signed-in reviewer's own save, and the delete names that reviewer. */
  check("(5) ⭐ a decision filed for Sam offers no Take it back and says a new Save replaces it",
    !x.d.getElementById("csb-ed-undo") && txt(x.d.getElementById("csb-edit-others")) === "This decision was filed for Sam. A new Save replaces it." && !/@bot/.test(txt(x.d.querySelector("#csb-panel"))));
  x = load("#commons/subjects/alpha/MATH", { sess: ME, saves: SAVES });
  await x.M.boot(); await settle();
  check("(5) ⭐ another reviewer's save offers no Take it back and says a new Save replaces it",
    !x.d.getElementById("csb-ed-undo") && txt(x.d.getElementById("csb-edit-others")) === "Another reviewer saved this decision. A new Save replaces it."
    && /^Maths Saved Saved by a person, b@rccd\.edu, November 22, 2026\.$/.test(txt(x.d.querySelector('.csb-codes tr[data-code="MATH"]').children[2])));
  x = load("#commons/subjects/alpha/WELD", { sess: ME, saves: SAVES });
  await x.M.boot(); await settle();
  check("(5) the reviewer's own save offers Take it back and no line about another's", !!x.d.getElementById("csb-ed-undo") && !x.d.getElementById("csb-edit-others"));
  x.d.getElementById("csb-ed-undo").click(); await settle();
  let dels = writesOf(x);
  check("(5) ⭐ Take it back sends one DELETE for that course_id and field, filtered to the signed-in reviewer's email",
    dels.length === 1 && dels[0].method === "DELETE"
    && dels[0].url === REST + "?course_id=eq.SUBJ%3Aalpha%7CWELD%7Ccredit&field=eq.subject_decision&reviewer_email=eq.a%40rccd.edu&select=course_id"
    && dels[0].headers.Authorization === "Bearer " + ME.access_token, dels[0] && dels[0].url);
  check("(5) the row reads from the files again", !x.d.querySelector('.csb-codes tr[data-code="WELD"]').getAttribute("data-saved")
    && !x.d.getElementById("csb-ed-undo") && /Taken back/.test(txt(x.d.getElementById("csb-ed-status"))));

  /* (11) the band moves with COCI's counts: AP was saved whole and gains a credit course */
  const MOVED = JSON.parse(JSON.stringify(FIX));
  MOVED.colleges.find((c) => c.slug === "alpha").rows.forEach((r) => { if (r[0] === "AP") { r[C.indexOf("state_courses")] = 1; r[C.indexOf("credit_courses")] = 1; r[C.indexOf("side")] = "both"; } });
  x = load("#commons/subjects/alpha/AP", { sess: ME, saves: SAVES, files: { "kb/status/local_subject_titles.json": MOVED } });
  await x.M.boot(); await settle();
  const apRow = Array.from(x.d.querySelectorAll(".csb-codes tbody tr")).find((r) => r.getAttribute("data-code") === "AP");
  check("(11) ⭐ a save under the other band still shows, and says the band changed since it was saved",
    apRow.getAttribute("data-saved") === "yes" && /^BIOL Biology Filed for Sam, November 21, 2026\. Saved under the whole band; the code’s band is now credit, so a new Save writes under credit\.$/.test(txt(apRow.children[3]))
    && /saved under the whole band\. COCI’s counts have changed since, and the code’s band is now credit/.test(txt(x.d.getElementById("csb-edit-moved"))));
  check("(11) the stamp still counts it", /7 codes carry a person’s save\./.test(txt(x.d.querySelector(".csb-stamp"))));
  x.d.getElementById("csb-ed-save").click(); await settle();
  check("(11) ⭐ a new Save writes under the current band", writesOf(x).length === 1 && JSON.parse(writesOf(x)[0].body).course_id === "SUBJ:alpha|AP|credit");

  /* (7) a failed read of the saves */
  x = load("#commons/subjects", { readStatus: 500 });
  await x.M.boot(); await settle();
  check("(7) ⭐ a failed read still draws the list from the files and says the saves could not be read",
    x.d.querySelectorAll(".csb-codes tbody tr").length === 10 && /The saves people made could not be read \(kb_curation answered 500\)/.test(txt(x.d.getElementById("csb-save-err"))));

  /* (8) slash and ampersand */
  x = load("#commons/subjects/alpha", { sess: ME, saves: SAVES });
  await x.M.boot(); await settle();
  const apBtn = Array.from(x.d.querySelectorAll(".csb-codes tbody tr")).find((r) => r.getAttribute("data-code") === "A&P").querySelector("th button"); apBtn.click(); await settle();
  check("(8) an ampersand code's panel has an address the page reads back", x.w.location.hash === "#commons/subjects/alpha/A%26P"
    && /^A&P, Anatomy and Physiology$/.test(txt(x.d.getElementById("csb-panel-h"))));
  x.d.getElementById("csb-ed-undo").click(); await settle();
  dels = writesOf(x);
  check("(8) ⭐ A&P round-trips: read from its key, deleted by its encoded key", dels.length === 1
    && dels[0].url === REST + "?course_id=eq.SUBJ%3Aalpha%7CA%26P%7Ccredit&field=eq.subject_decision&reviewer_email=eq.a%40rccd.edu&select=course_id", dels[0] && dels[0].url);
  x = load("#commons/subjects/alpha/A%26P", { sess: ME });
  await x.M.boot(); await settle();
  check("(8) the encoded address opens the A&P panel on arrival", !!x.d.getElementById("csb-ed-save") && /^A&P/.test(txt(x.d.getElementById("csb-panel-h"))));
  x = load("#commons/subjects/alpha/ES/A", { sess: ME, saves: SAVES });
  await x.M.boot(); await settle();
  check("(8) ES/A reads its saved title from its key", x.d.getElementById("csb-ed-title").value === "Exercise Science"
    && /^Exercise Science Saved by a person/.test(txt(x.d.querySelector('.csb-codes tr[data-code="ES/A"]').children[2])));
  typeIn(x, "csb-ed-code", "KINE");
  x.d.getElementById("csb-ed-save").click(); await settle();
  posts = writesOf(x);
  check("(8) ⭐ ES/A saves under its key with the slash intact", posts.length === 1 && JSON.parse(posts[0].body).course_id === "SUBJ:alpha|ES/A|credit");
  const SM = x.w.CPL_COMMONS_SUBJECTS.savesModel([{ course_id: "SUBJ:alpha|ES/A|credit", value: "{\"common_code\":\"KINE\"}" }, { course_id: "SUBJ:alpha|A&P|whole", value: "not json" }]);
  check("(8) the saves model splits a key at its first and last bar, and skips a value that is not JSON",
    SM["alpha|ES/A|credit"] && SM["alpha|ES/A|credit"].common === "KINE" && !SM["alpha|A&P|whole"]);

  /* (9) Title Case agrees with kb/subject_title_case.py (expected values printed by that module) */
  const TC = [["ADMINISTRATION OF JUSTICE", "Administration of Justice"], ["anatomy and physiology", "Anatomy and Physiology"], ["ESL for adults", "ESL for Adults"],
    ["HISTORY II", "History II"], ["child development/early childhood", "Child Development/Early Childhood"], ["HiSET prep", "HiSET Prep"],
    ["Women's and Gender Studies", "Women's and Gender Studies"], ["Art: a survey", "Art: A Survey"], ["speech-language pathology", "Speech-Language Pathology"],
    ["Anatomy And Physiology", "Anatomy and Physiology"], ["(CAD) drafting", "(CAD) Drafting"], ["Speech Pathology", "Speech Pathology"],
    /* A code in parentheses keeps its capitals, and a note word there stays as typed (Sam, 2026-11-23, Clovis's COTR). */
    ["Work Experience Education (formerly COTR)", "Work Experience Education (formerly COTR)"], ["ANTHROPOLOGY (ANTH, Formerly ANTHRO)", "Anthropology (ANTH, Formerly ANTHRO)"],
    ["WORK EXPERIENCE (formerly (COTR) cooperative work)", "Work Experience (formerly (COTR) cooperative work)"], ["ART (I) studio", "Art (I) Studio"]];
  const bad = TC.filter((p) => x.w.CPL_COMMONS_SUBJECTS.titleCase(p[0]) !== p[1]);
  check("(9) ⭐ the page's Title Case gives what the Python rule gives", bad.length === 0, bad.map((p) => p[0] + " -> " + x.w.CPL_COMMONS_SUBJECTS.titleCase(p[0])).join("; "));
  check("(9) the word lists come from the titles file the builder writes", Array.isArray(LIVE.title_case.kept) && LIVE.title_case.kept.indexOf("ESL") >= 0
    && LIVE.common_codes && LIVE.common_codes.KINE === "Kinesiology" && !/"HVACR"|"ROTC"/.test(fs.readFileSync("commons_subjects.js", "utf8")));

  /* (10) a refused token; nothing stored */
  x = load("#commons/subjects/alpha/MATH", { sess: ME, postStatus: 401 });
  await x.M.boot(); await settle();
  x.d.getElementById("csb-ed-save").click(); await settle();
  check("(10) a 401 says the sign-in has ended", /Not saved: your sign-in has ended\. Sign in again, then save\./.test(txt(x.d.getElementById("csb-ed-status"))));
  x = load("#commons/subjects/alpha/MATH", { sess: null });
  await x.M.boot(); await settle();
  x.signIn(ME); x.w.dispatchEvent(new x.w.CustomEvent("cpl-session-changed", { detail: { signedIn: true } })); await settle();
  check("(10) a sign-in while the panel is open brings the form without a reload", !!x.d.getElementById("csb-ed-save"));
  check("(10) the page stores nothing", x.writes() === 0);
  check("(10) tokens only: no raw hex in the CSS", !/#[0-9a-fA-F]{3,8}\b/.test(x.w.CPL_COMMONS_SUBJECTS.CSS));
  check("(10) every header cell carries a scope with the form open", Array.from(x.d.querySelectorAll("#csb-panel th")).every((th) => th.getAttribute("scope")));

  /* (12) the daily build honors a save (kb/_sync_subject_decisions.py, #3655): the titles file carries it in `decision`
     with what the files gave in `was`, and the page shows one line for it whichever way the live read goes. */
  const DEC = JSON.parse(JSON.stringify(FIX));
  DEC.columns = C.concat(["common_source", "decision"]);
  const DC = DEC.columns;
  const drow = (o) => DC.map((k) => (k in o ? o[k] : null));
  const PEXD = { key: "SUBJ:alpha|PEX|credit", from: "subject_decision", who: "Sam", at: "2026-11-21T21:11:00Z", title: false, common: true,
    band: "credit", moved: false, was: { printed_name: "Physical Education", common: null, discipline: null, title_state: "catalog", title_source: "course pages", common_source: null } };
  DEC.colleges.find((c) => c.slug === "alpha").rows.push(
    drow({ code: "PEX", printed_name: "Physical Education", catalog_courses: 4, state_courses: 4, side: "both", common: "KINE", discipline: "Kinesiology",
      title_state: "catalog", title_source: "course pages", credit_courses: 4, noncredit_courses: 0, common_source: "person", decision: PEXD }),
    drow({ code: "ATHL", printed_name: "Athletics", catalog_courses: 2, state_courses: 2, side: "both", common: "KINE", discipline: "Kinesiology",
      title_state: "catalog", title_source: "course pages", credit_courses: 2, noncredit_courses: 0, common_source: "statewide_filing",
      decision: { key: "_SUBJ_DISC::ATHL", from: "local_subjects_list", who: "a reviewer", at: "2026-11-20", title: false, common: true, was: {} } }));
  const PEXLIVE = [{ course_id: "SUBJ:alpha|PEX|credit", value: JSON.stringify({ common_code: "KINE", decided_by: "Sam", decided_at: "2026-11-21T21:11:00Z" }),
    reviewed_at: "2026-11-22T04:45:00Z", reviewer_email: "subjects-s701@bot", reviewer_label: "subjects-s701@bot" }];
  const pexCell = (x) => x.d.querySelector('.csb-codes tr[data-code="PEX"]').children[3];
  x = load("#commons/subjects/alpha", { saves: PEXLIVE, files: { "kb/status/local_subject_titles.json": DEC } });
  await x.M.boot(); await settle();
  check("(12) ⭐ the file and the live save agree: the row shows one line, not two",
    txt(pexCell(x)) === "KINE Kinesiology Filed for Sam, November 21, 2026." && pexCell(x).querySelectorAll(".csb-saved").length === 1, txt(pexCell(x)));
  x = load("#commons/subjects/alpha", { readStatus: 500, files: { "kb/status/local_subject_titles.json": DEC } });
  await x.M.boot(); await settle();
  check("(12) ⭐ a failed live read shows the save the daily build carried, once, and says the live read failed",
    txt(pexCell(x)) === "KINE Kinesiology Filed for Sam, November 21, 2026." && pexCell(x).querySelectorAll(".csb-saved").length === 1
    && x.d.querySelector('.csb-codes tr[data-code="PEX"]').getAttribute("data-saved") === "yes"
    && /the saves the daily build carried/.test(txt(x.d.getElementById("csb-save-err"))), txt(pexCell(x)));
  x = load("#commons/subjects/alpha", { saves: [], files: { "kb/status/local_subject_titles.json": DEC } });
  await x.M.boot(); await settle();
  check("(12) ⭐ a save taken back since the build: the live read wins and the row reads the files' own values again",
    txt(pexCell(x)) === "" && !x.d.querySelector('.csb-codes tr[data-code="PEX"]').getAttribute("data-saved"), txt(pexCell(x)));
  check("(12) a statewide filing says a person filed it in the Local subjects List",
    /^KINE Kinesiology Filed statewide by a person in the Local subjects List\.$/.test(txt(x.d.querySelector('.csb-codes tr[data-code="ATHL"]').children[3])));
  x = load("#commons/subjects/alpha/PEX", { sess: ME, saves: [{ course_id: "SUBJ:alpha|PEX|credit", value: JSON.stringify({ common_code: "KINE" }),
    reviewed_at: "2026-11-22T05:00:00Z", reviewer_email: ME.email, reviewer_label: "a reviewer" }], files: { "kb/status/local_subject_titles.json": DEC } });
  await x.M.boot(); await settle();
  x.d.getElementById("csb-ed-undo").click(); await settle();
  check("(12) ⭐ taking back a save the file carries returns the row to the files' own values at once",
    txt(pexCell(x)) === "" && /Taken back/.test(txt(x.d.getElementById("csb-ed-status"))), txt(pexCell(x)));

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "  [" + r[2] + "]")));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

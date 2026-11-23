// The Subjects page's tools from Sam's four asks of 2026-11-22 (S705), each a way the page would fail him again:
//   (1) ⭐ the course panel resizes from its left edge (drag or arrow keys), and its top row (Close and the heading)
//       sits in one sticky header above the scrolling body (r-sidebars-resize-and-frozen-top-sam-2026-11-22);
//   (2) ⭐ every Subjects table sorts by a header word (a second press reverses it, aria-sort says which) and each
//       header's edge is a separator that resizes its column (r-subjects-columns-sort-resize-sam-2026-11-22);
//   (3) ⭐ a course or a group is moved to another common subject code from the panel: one kb_curation row per checked
//       course, CRS:<college>|<code>|<number>, field course_subject_decision, under the reviewer's own email; a course
//       another person moved is held; the reviewer's own move shows Take it back, whose DELETE names the email
//       (r-subjects-move-courses-sam-2026-11-22);
//   (5) ⭐ where a code's courses hold M-IDs minted under another Common SUBJ, the panel says the courses are listed
//       under the local code and the M-ID letters name the code they were minted under, so the column never reads as
//       a filing (r-mid-prefix-is-not-the-local-subject-sam-2026-11-22);
//   (4) ⭐ the Edit form takes a source link, saved with the decision, refused when it is not a web address, and the
//       saved line links it (r-subject-title-source-link-sam-2026-11-22).
// Run from repo root: `npm test` (or `node tests/commons_subjects_tools.test.js`).
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
  "kb/status/subject_courses/alpha.json": { college: "Alpha College", slug: "alpha", columns: ["number", "title", "band", "listed", "units", "cid", "ccn", "mid"],
    codes: { AED: [["10.07", "Fitness for Older Adults", "C", "Both", 0, "", "", "ELEC M9008"], ["14.11", "Quilting for Seniors", "C", "COCI", 0, "", "", "ELEC M90EV"],
      ["2", "Arc Basics", "C", "Both", 3, "", "", "ELEC M1001"], ["30", "Wiring", "C", "Both", 3, "", "", "ELEC M1002"]] } }
};
const REST = "https://hvuwhnbuahrtptokpqfh.supabase.co/rest/v1/kb_curation";
const ME = { email: "a@rccd.edu", access_token: "tok.en.x", refresh_token: "r" };
const AT = "2026-11-22T12:00:00Z";
const MOVES = [{ course_id: "CRS:alpha|AED|30", field: "course_subject_decision", value: JSON.stringify({ common_code: "KINE", from_mid: "ELEC M1002" }), reviewed_at: AT, reviewer_email: "b@rccd.edu", reviewer_label: "a reviewer" }];
const SAVES = [
  { course_id: "SUBJ:delta|AED|credit", value: JSON.stringify({ common_code: "KINE" }), reviewed_at: AT, reviewer_email: "b@rccd.edu", reviewer_label: "a reviewer" },
  { course_id: "SUBJ:zeta|AED|credit", value: JSON.stringify({ local_title: "Apprentice Electrical", common_code: "ELEC" }), reviewed_at: AT, reviewer_email: ME.email, reviewer_label: "a reviewer" }];

function load(hash, opt) {
  opt = Object.assign({ moves: MOVES }, opt || {});
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
        const all = JSON.parse(JSON.stringify((opt.saves || []).concat(opt.moves || [])));
        const want = /field=eq\.course_subject_decision/.test(url) ? "course_subject_decision" : "subject_decision";
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(all.filter((r) => (r.field || "subject_decision") === want).map((r) => { if (!sel) delete r.reviewer_email; return r; })) });
      }
      if (method === "DELETE") return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([{ course_id: "x" }]) });
      if (method === "POST") {
        const b = JSON.parse(init.body), st = (opt.refuse || []).indexOf(b.course_id) >= 0 ? 403 : 201;
        return Promise.resolve({ ok: st < 300, status: st, json: () => Promise.resolve(null) });
      }
    }
    const hit = Object.assign({}, FILES, (opt && opt.files) || {})[url];
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
  /* (1) the panel */
  let x = load("#commons/subjects/alpha/AED", { sess: ME, saves: SAVES });
  await x.M.boot(); await settle();
  const panel = x.d.getElementById("csb-panel"), head = x.d.getElementById("csb-panel-head"), grip = x.d.getElementById("csb-panel-grip");
  check("(1) ⭐ Close and the heading sit in one header at the panel's top", head && head.contains(x.d.getElementById("csb-panel-close")) && head.contains(x.d.getElementById("csb-panel-h"))
    && head.parentNode.firstChild === head);
  check("(1) ⭐ the header is sticky inside the panel's scroller", /\.csb-panel-head \{ position:sticky; top:0;/.test(x.w.CPL_COMMONS_SUBJECTS.CSS) && /\.csb-panel-in \{[^}]*overflow-y:auto/.test(x.w.CPL_COMMONS_SUBJECTS.CSS));
  check("(1) the grip is a labelled separator on the panel's left edge", grip && grip.getAttribute("role") === "separator" && grip.getAttribute("aria-label") === "Resize the panel" && panel.firstChild === grip);
  grip.dispatchEvent(new x.w.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
  const w1 = panel.style.width;
  check("(1) ⭐ Left widens the panel from the keyboard", /^\d+px$/.test(w1) && parseInt(w1, 10) > 620, "[" + w1 + "] " + grip.getAttribute("aria-valuenow"));
  grip.dispatchEvent(new x.w.KeyboardEvent("keydown", { key: "Home", bubbles: true }));
  check("(1) Home returns it to its own width", panel.style.width === "");

  /* (3) move courses */
  const boxes = Array.from(x.d.querySelectorAll("#csb-panel input.csb-move"));
  check("(3) signed in, each course carries a labelled checkbox and the table one for all", boxes.length === 4 && boxes.every((b) => /^Move /.test(b.getAttribute("aria-label")))
    && !!x.d.querySelector("#csb-panel input.csb-move-all") && !!x.d.getElementById("csb-move-save"));
  check("(3) ⭐ the panel says how to move a course before its tables, and the move box rests unpinned while nothing is checked",
    /check its box, choose the common subject code it belongs under from the list at the top of its group/.test(txt(x.d.getElementById("csb-move-how"))) && !x.d.getElementById("csb-move").classList.contains("csb-move-live"));
  const held = boxes.find((b) => b.getAttribute("data-move-number") === "30");
  check("(3) ⭐ a course another person moved is held, and says so", held && held.disabled && /Moved to KINE Kinesiology by a person/.test(txt(held.closest("tr"))), held && (held.disabled + " " + txt(held.closest("tr"))));
  x.d.querySelector("#csb-panel input.csb-move-all").checked = true;
  x.d.querySelector("#csb-panel input.csb-move-all").dispatchEvent(new x.w.Event("change", { bubbles: true }));
  check("(3) ⭐ once a course is checked the move box pins to the panel's foot (Sam, 2026-11-23: \"I don't see a way to fix them from here\")",
    x.d.getElementById("csb-move").classList.contains("csb-move-live"));
  check("(3) the all box checks every course it may move", boxes.filter((b) => b.checked).length === 3 && !held.checked && /3 courses are checked/.test(txt(x.d.getElementById("csb-move-n"))));
  const pick = x.d.getElementById("csb-move-code");
  const groups = Array.from(pick.querySelectorAll("optgroup")).map((g) => g.getAttribute("label") + ": " + Array.from(g.querySelectorAll("option")).map((o) => o.textContent).join(", "));
  check("(6) ⭐ the picker lists credit codes, then noncredit codes, each by discipline name (Sam, 2026-11-23)",
    JSON.stringify(groups) === JSON.stringify(["Credit: Automotive Technology (AUTO), Electronics (ELEC), Kinesiology (KINE)", "Noncredit: Vocational: Noncredit (VOCE)"]), groups);
  const dl = Array.from(x.d.querySelectorAll("#csb-ed-codes option")).map((o) => o.value + "=" + o.getAttribute("label"));
  check("(6) ⭐ the code box's suggestions run credit then noncredit, VOCE labeled noncredit (Sam, 2026-11-23)",
    JSON.stringify(dl) === JSON.stringify(["AUTO=Automotive Technology", "ELEC=Electronics", "KINE=Kinesiology", "VOCE=Vocational: Noncredit"]), dl);
  check("(6) ⭐ each course group carries its own move row at its top, with the same picker",
    x.d.querySelectorAll("#csb-panel .csb-group .csb-move-top select.csb-move-pick").length === x.d.querySelectorAll("#csb-panel .csb-group").length
    && x.d.querySelectorAll("#csb-panel .csb-group").length > 0);
  pick.value = ""; x.d.getElementById("csb-move-save").click(); await settle();
  check("(3) no code chosen makes no request", posts(x).length === 0 && /Choose the common subject code/.test(txt(x.d.getElementById("csb-move-status"))));
  pick.value = "KINE"; x.d.getElementById("csb-move-save").click(); await settle();
  const P = posts(x), B = P.map((p) => JSON.parse(p.body));
  check("(3) ⭐ one row per checked course, keyed by college, code and number, field course_subject_decision, under the reviewer's email",
    JSON.stringify(B.map((b) => b.course_id)) === JSON.stringify(["CRS:alpha|AED|10.07", "CRS:alpha|AED|14.11", "CRS:alpha|AED|2"])
    && B.every((b) => b.field === "course_subject_decision" && b.reviewer_email === ME.email), B.map((b) => b.course_id).join(","));
  const v0 = JSON.parse(B[0].value);
  check("(3) the value names the code, the M-ID it moves from, the title and the band", v0.common_code === "KINE" && v0.from_mid === "ELEC M9008" && v0.title === "Fitness for Older Adults" && v0.band === "C");
  await settle();
  check("(3) ⭐ the moved courses show the move, and the status counts them", /Moved 3 courses to KINE/.test(txt(x.d.getElementById("csb-move-said")))
    && x.d.querySelectorAll('#csb-panel tr[data-moved="KINE"]').length === 4);
  const undo = x.d.querySelector('#csb-panel button[data-move-undo="CRS:alpha|AED|10.07"]');
  check("(3) the reviewer's own move shows Take it back; another's does not", !!undo && !x.d.querySelector('#csb-panel button[data-move-undo="CRS:alpha|AED|30"]'));
  undo.click(); await settle();
  const del = x.calls.filter((c) => c.method === "DELETE")[0];
  check("(3) ⭐ Take it back deletes by key, field and the reviewer's email", del && /course_id=eq\.CRS%3Aalpha%7CAED%7C10\.07/.test(del.url) && /field=eq\.course_subject_decision/.test(del.url)
    && /reviewer_email=eq\.a%40rccd\.edu/.test(del.url), del && del.url);

  /* (6) a group's own move row moves that group's checked courses only; Collapse all and Expand all fold every section */
  const TWO = JSON.parse(JSON.stringify(FILES["kb/status/subject_courses/alpha.json"]));
  TWO.columns = TWO.columns.concat(["category"]);
  TWO.codes.AED.push(["40.07", "Ironworker Orientation", "N", "COCI", 0, "", "", "ELEC M90AA", "Short-term Vocational"]);
  x = load("#commons/subjects/alpha/AED", { sess: ME, files: { "kb/status/subject_courses/alpha.json": TWO } });
  await x.M.boot(); await settle();
  const firstGroup = x.d.querySelector("#csb-panel .csb-group");
  const allBoxes = Array.from(x.d.querySelectorAll("#csb-panel input.csb-move:not([disabled])"));
  allBoxes.forEach((b) => { b.checked = true; });
  const mine0 = Array.from(firstGroup.querySelectorAll("input.csb-move:not([disabled])")).map((b) => b.getAttribute("data-move-number"));
  firstGroup.querySelector("select.csb-move-pick").value = "AUTO";
  firstGroup.querySelector(".csb-move-top button").click(); await settle();
  const G = posts(x).map((p) => JSON.parse(p.body));
  check("(6) ⭐ a group's move row moves that group's checked courses only", G.length === mine0.length && G.length < allBoxes.length
    && G.every((b) => b.field === "course_subject_decision" && JSON.parse(b.value).common_code === "AUTO" && mine0.indexOf(b.course_id.split("|")[2]) >= 0), [G.length, mine0, allBoxes.length]);
  const folds = () => Array.from(x.d.querySelectorAll("#csb-panel details.csb-fold"));
  check("(6) the course groups and the edit section each fold, open at first", folds().length >= x.d.querySelectorAll("#csb-panel .csb-group").length + 1 && folds().every((d) => d.open));
  x.d.getElementById("csb-fold-all").click();
  check("(6) ⭐ Collapse all folds every section, from the panel's frozen top row (Sam, 2026-11-23)", folds().every((d) => !d.open) && !!x.d.querySelector("#csb-panel-head #csb-fold-all"));
  x.d.getElementById("csb-unfold-all").click();
  check("(6) Expand all opens them again", folds().every((d) => d.open));

  /* (5) an M-ID's prefix never reads as the course's local subject (Sam, 2026-11-22, r-mid-prefix-is-not-the-local-subject-sam-2026-11-22) */
  x = load("#commons/subjects/alpha/AED", { saves: SAVES.concat([{ course_id: "SUBJ:alpha|AED|credit", value: JSON.stringify({ common_code: "AUTO" }), reviewed_at: AT, reviewer_label: "a reviewer" }]) });
  await x.M.boot(); await settle();
  const note = x.d.getElementById("csb-mint");
  check("(5) ⭐ the panel says the courses are listed under the local code and the M-ID letters name the code they were minted under",
    note && /Every course below is listed under AED at Alpha College\./.test(txt(note)) && /not the course’s local subject/.test(txt(note))
    && /4 of these 4 courses hold M-IDs minted under another code: 4 under ELEC \(Electronics\)/.test(txt(note)) && /common subject code is AUTO, from a person’s save, so those M-IDs move at the next re-mint/.test(txt(note)), txt(note));
  check("(5) each such course says its M-ID was minted under another code", /M-ID ELEC M9008 \(minted under ELEC\)/.test(txt(x.d.getElementById("csb-panel-body"))));
  x = load("#commons/subjects/alpha/AED", { saves: SAVES });
  await x.M.boot(); await settle();
  check("(5) no note where the M-IDs sit under the code's own common subject code", !x.d.getElementById("csb-mint") && !/minted under/.test(txt(x.d.getElementById("csb-panel-body"))));

  /* (2) sort and resize */
  x = load("#commons/subjects", { saves: SAVES });
  await x.M.boot(); await settle();
  const tbl = x.d.querySelector(".csb-codes"), sorts = Array.from(tbl.querySelectorAll("thead button.csb-sort"));
  check("(2) ⭐ every header but Settle is a sort word, and every header has a resize separator", sorts.length === 6 && tbl.querySelectorAll("thead .csb-grip[role=separator]").length === 7);
  const colleges = () => Array.from(tbl.querySelectorAll("tbody tr")).map((r) => txt(r.children[0]));
  sorts[0].click();
  const asc = colleges();
  check("(2) ⭐ a press sorts A to Z and aria-sort says so", asc.join("|") === asc.slice().sort().join("|") && sorts[0].closest("th").getAttribute("aria-sort") === "ascending" && /, A to Z$/.test(txt(sorts[0])), asc.join("|"));
  sorts[0].click();
  check("(2) a second press reverses it", colleges().join("|") === asc.slice().reverse().join("|") && sorts[0].closest("th").getAttribute("aria-sort") === "descending");
  const g0 = tbl.querySelector("thead .csb-grip");
  g0.dispatchEvent(new x.w.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  check("(2) ⭐ a separator resizes its column from the keyboard", /px$/.test(tbl.querySelector("col").style.width) && /px$/.test(tbl.style.width));

  /* (4) the source link */
  x = load("#commons/subjects/beta/AED", { sess: ME, saves: SAVES });
  await x.M.boot(); await settle();
  const src = x.d.getElementById("csb-ed-source");
  check("(4) the Edit form has a labelled source link and an Open the link word", src && x.d.querySelector('label[for="csb-ed-source"]') && x.d.getElementById("csb-ed-source-open"));
  src.value = "not a link"; x.d.getElementById("csb-ed-save").click(); await settle();
  check("(4) ⭐ a source that is not a web address makes no request", posts(x).length === 0 && /not a web address/.test(txt(x.d.getElementById("csb-ed-source-msg"))));
  let opened = null; x.w.open = (u) => { opened = u; return {}; };
  src.value = "https://secure.cerritos.edu/schedule/index.cgi"; x.d.getElementById("csb-ed-source-open").click();
  check("(4) Open the link opens it in a new tab", opened === "https://secure.cerritos.edu/schedule/index.cgi");
  x.d.getElementById("csb-ed-title").value = "Adult Education"; x.d.getElementById("csb-ed-save").click(); await settle();
  const sv = posts(x)[0] && JSON.parse(JSON.parse(posts(x)[0].body).value);
  check("(4) ⭐ the link is saved with the decision", sv && sv.source_url === "https://secure.cerritos.edu/schedule/index.cgi" && sv.local_title === "Adult Education", JSON.stringify(sv));
  await settle();
  const a = x.d.querySelector('#csb-panel a[data-saved="source"], .csb-codes a[data-saved="source"]');
  check("(4) the saved line links the source", a && a.getAttribute("href") === "https://secure.cerritos.edu/schedule/index.cgi" && a.getAttribute("rel") === "noopener");

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "  [" + r[2] + "]")));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

// The Courses List's Discipline in doubt job (Sam, 2026-11-09: "Can you put these in the appropriate part of the commons
// process and make a built in way for me to rule on them so our procedures can be adjusted to handle similar edge
// cases?"). Guards:
//   (1) #coci-lookup/list/doubt lists the local courses of the common courses kb/ccr_doubt.json names, and the note
//       says how many, which signal put each there, and what a ruling teaches;
//   (2) a course's panel shows both signals in words: where the description reads, where TOP points;
//   (3) signed out, the evidence shows and the ruling form does not;
//   (4) signed in, the ruling offers keep, the signals' disciplines, not sure, and every other discipline;
//   (5) ⭐ a ruling writes its reason first (a new ccr_procedure_request key per save, with the signals), then the
//       discipline through the List's one write: move sets it, keep confirms it, not sure writes nothing more;
//   (6) a reason marked for similar cards must say why; a refused write says so and writes no discipline;
//   (7) a ruling read back shows on the card and in the note; the file failing says so;
//   (8) COBIx on #2948: signed out, the rulings read asks for no email and the card says "by a reviewer"; signed in,
//       it reads with the reviewer's token and names who ruled; "Use this reason for similar cards" starts unticked;
//       the panel's trail reads CPL Commons / Courses / the job / the course, and the job's word returns to the List.
//  (10) ⭐ issue 2981 (Sam, 2026-11-09): a ruling can keep the home discipline and also list a second one. It writes
//       the reason (ruling "crosslist"), then one cross_listed_disciplines row; the home discipline is never changed,
//       an unconfirmed home is confirmed in the same write, a second choice adds to the first, and one choice clears.
// Run from repo root: `npm test` (or `node tests/coci_list_doubt.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").trim().replace(/\s+/g, " "); }
const SRC = fs.readFileSync("coci_lookup.js", "utf8");
const LIST_SRC = fs.readFileSync("commons_list.js", "utf8");

const LOOKUP = {
  _built_at: "2026-07-09",
  colleges: ["American River College", "Rio Hondo College", "Cypress College "],
  rows: [
    [0, "CCC1", "ENGL", "300", "College Composition", 4, "C", "1501.00: English", "ENGL 100", "ENGL C1000", "ENGL M1001"],
    [1, "CCC2", "ENGL", "101", "Composition and Reading", 3, "C", "1501.00: English", "ENGL 100", "", "ENGL M1999"],
    [2, "CCC3", "ENGL", "100", "Freshman Composition", 4, "C", "1501.00: English", "", "", ""],
    [0, "CCC4", "CARPT", "111", "Tool and Equipment Applications", 1.5, "C", "0952.10: Carpentry", "", "", "CNST M1009"],
    [1, "CCC5", "CARP", "040K", "Rigging", 2, "C", "0952.10: Carpentry", "", "", ""],
    [1, "CCC6", "ESL", "010", "English Fundamentals", 0, "N", "4930.87: English as a Second Language", "", "", ""],
    [0, "CCC7", "WELD", "110", "Welding I", 3, "C", "0956.50: Welding Technology", "", "", ""],
    [1, "CCC8", "WELD", "101", "Intro to Welding", 3, "C", "0956.50: Welding Technology", "", "", ""],
    [1, "CCC9", "ESL", "020", "Conversation", 0, "E", "4930.87: English as a Second Language", "", "", ""]
  ]
};
const MEMBERS = {
  generated_at: "2026-11-01 05:18",
  colleges: ["American River College", "Rio Hondo College", "Cypress College", "Allan Hancock College"],
  members: {
    "ENGL M1001": [{ c: 0, cn: "CCC1" }, { c: 1, cn: "CCC2" }, { c: 2, cn: "CCC3" }],
    "CNST M1009": [{ c: 0, cn: "CCC4" }],
    "WELD M1109": [{ c: 0, cn: "CCC7" }, { c: 1, cn: "CCC8" }, { c: 3, cn: "CCCX" }],
    "MANF M1200": [{ c: 1, cn: "CCC8" }]
  }
};



const UC = { generated_at: "2026-11-04 17:00", mq_disciplines: ["Construction", "English", "Welding"], rows: [
  { kind: "Course", id: "ENGL M1001", title: "College Composition", disc: "English", credit: "Credit", units: 4, umin: 3, umax: 4, conf: 0.91,
    id_system: "M-ID", locked: false, flags: { reviewed: false }, reviewed_by: null, reviewed_at: "", dsrc: "subject_map" },
  { kind: "Course", id: "CNST M1009", title: "Tool and Equipment Applications", disc: "Construction", credit: "Credit", units: 1.5, conf: 0.6,
    id_system: "M-ID", locked: false, flags: { reviewed: false }, reviewed_by: null, reviewed_at: "", mt: 2, dsrc: "top_code" },
  { kind: "Course", id: "WELD M1109", title: "Welding I", disc: "Welding", credit: "Credit", units: 3, conf: 0.95,
    id_system: "C-ID", locked: true, flags: { reviewed: true }, reviewed_by: "curator@rccd.edu", reviewed_at: "2026-09-01" },
  // Check alignment's neighbors (7): common courses that share ENGL M1001's local subject code.
  { kind: "Course", id: "ENGL M1002", title: "Critical Thinking and Writing", disc: "English", subj: ["ENGL"], id_system: "M-ID" },
  { kind: "Course", id: "ENGL M1003", title: "Technical Writing", disc: "English", subj: ["ENGL"], id_system: "M-ID" },
  { kind: "Course", id: "CNST M1010", title: "Blueprint Reading", disc: "Construction", subj: ["ENGL", "CARP"], id_system: "M-ID" }] };
UC.rows[0].subj = ["ENGL"];


const DOUBT = { schema: 1, discipline: "English", counts: { description: 1, top_only: 1 }, cards: [
  { id: "ENGL M1001", title: "College Composition", discipline: "English", colleges: 3, members: 3, verdict: "for_a_curator",
    why: ["description"], desc: [["Communication Studies", 0.21], ["Journalism", 0.12]], desc_kind: "desc_differs_clear", votes: {} },
  { id: "CNST M1009", title: "Tool and Equipment Applications", discipline: "Construction", colleges: 1, members: 1, verdict: "unsettled",
    why: ["top"], desc: [["Construction", 0.3]], desc_kind: "desc_agrees_clear", votes: { Welding: 2, Construction: 1 } }] };
const RULED = [{ course_id: "_CCR_PROCEDURE_REQUEST::2026-11-09T03:00:00Z-CNST_M1009", reviewer_email: "sam@rccd.edu", reviewed_at: "2026-11-09T03:00:00Z",
  value: JSON.stringify({ mid: "CNST M1009", discipline_was: "Construction", ruling: "keep", words: "Shop tools are taught for the trade.", similar: true }) }];

function tab(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div class="main-container"><div id="coci-lookup-root">Loading…</div></div></body></html>',
    { url: "https://example.org/" + (opts.hash || "#coci-lookup/list/doubt"), runScripts: "dangerously" });
  const w = dom.window, writes = [], reads = [];
  w.CPL_COCI_LOOKUP = JSON.parse(JSON.stringify(LOOKUP));
  const ok = (v) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(v))) });
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    if (/kb_curation/.test(url) && init.method) {
      const body = JSON.parse(init.body || "null");
      writes.push({ url: url, method: init.method, body: body });
      const refused = opts.refuse && body && body.field === "ccr_procedure_request";
      return Promise.resolve({ ok: !refused, status: refused ? 403 : 201, json: () => Promise.resolve(null) });
    }
    if (/kb_curation/.test(url) && /ccr_procedure_request/.test(url)) {
      reads.push({ url: url, auth: (init.headers || {}).Authorization || "" });
      return ok((opts.ruled || []).map((x) => { const y = Object.assign({}, x); if (!/reviewer_email/.test(url)) delete y.reviewer_email; return y; }));
    }
    if (/kb_curation/.test(url)) return ok([]);
    if (/ccr_doubt\.json/.test(url)) {
      if (opts.doubtFail) return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
      const D = JSON.parse(JSON.stringify(DOUBT));
      if (opts.nohome) D.cards.find((c) => c.id === opts.nohome).discipline = "";
      return ok(D);
    }
    if (/row_audit\/latest\.json/.test(url)) return ok({ rows: [] });
    if (/csr_out\/latest\.json/.test(url)) return ok({ _mid_codes: { strays: [] } });
    return ok([]);
  };
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = LIST_SRC; w.document.body.appendChild(e); }
    if (s === "unified_courses_members.js") w.CPL_UC_MEMBERS = JSON.parse(JSON.stringify(MEMBERS));
    if (s === "unified_courses_data.js") {
      w.CPL_UNIFIED_COURSES = JSON.parse(JSON.stringify(UC));
      Object.keys(opts.xdisc || {}).forEach((id) => { w.CPL_UNIFIED_COURSES.rows.find((r) => r.id === id).xdisc = opts.xdisc[id]; });
      if (opts.mq) w.CPL_UNIFIED_COURSES.mq_disciplines = opts.mq.slice();
      if (opts.nohome) w.CPL_UNIFIED_COURSES.rows.find((r) => r.id === opts.nohome).disc = "";
    }
    setTimeout(cb, 0);
  } };
  const sess = opts.signedIn ? { email: "reviewer@rccd.edu", access_token: "tok.en.x" } : null;
  w.CPL_SESSION = { get: () => sess, isFresh: () => !!sess, ensureFresh: () => Promise.resolve(sess) };
  w.CPL_REVIEWER_SIGNIN = { mountInto: function (m) { m.appendChild(w.document.createElement("form")); } };
  const e = w.document.createElement("script"); e.textContent = SRC; w.document.body.appendChild(e);
  w.CPL_COCI_LOOKUP_TAB.activate();
  return { w, d: w.document, writes, reads };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const P = "ccl-";
function bodyRows(d) { return Array.from(d.querySelectorAll("." + P + "table tbody tr")); }
function dataRows(d) { return bodyRows(d).filter((tr) => !tr.classList.contains(P + "band") && !tr.classList.contains(P + "editrow")); }
function heads(d) { return Array.from(d.querySelectorAll("." + P + "table thead th")).map((th) => txt(th.querySelector("." + P + "sort"))).filter(Boolean); }
function colOf(d, name) { return heads(d).findIndex((h) => h.indexOf(name) === 0); }
// The cell under a column, found by its name (the select box comes first).
function cell(tr, d, name) { return tr.children[colOf(d, name) + 1]; }
function titles(d) { return dataRows(d).map((tr) => txt(cell(tr, d, "Title"))); }
function word(d, re) { return Array.from(d.querySelectorAll("button")).find((b) => re.test(txt(b))); }
function input(w, node, v) { node.value = v; node.dispatchEvent(new w.Event("input")); }



async function until(fn, ms) { const end = Date.now() + (ms || 5000); while (!fn() && Date.now() < end) await sleep(10); return fn(); }
function panel(d) { return d.getElementById(P + "panel"); }
function titleBtn(d, title) { const tr = dataRows(d).find((x) => txt(cell(x, d, "Title")).indexOf(title) === 0); return tr && cell(tr, d, "Title").querySelector("button"); }
function pword(d, re) { const p = panel(d); return p && Array.from(p.querySelectorAll("button")).find((b) => re.test(txt(b))); }
async function openPanel(t, title, re) {
  await until(() => titleBtn(t.d, title));
  titleBtn(t.d, title).click();
  await until(() => panel(t.d) && re.test(txt(panel(t.d))));
}

function rule(t, value, words, similar) {
  const s = t.d.getElementById("ccl-rule-choice"); s.value = value; s.dispatchEvent(new t.w.Event("change"));
  const ta = t.d.getElementById("ccl-rule-words"); ta.value = words; ta.dispatchEvent(new t.w.Event("input"));
  const cb = t.d.getElementById("ccl-rule-similar"); cb.checked = similar; cb.dispatchEvent(new t.w.Event("change"));
  pword(t.d, /^Save the ruling$/).click();
}

(async () => {
  {
    const t = tab();
    await until(() => dataRows(t.d).length > 0 && /Discipline in doubt, English/.test(txt(t.d.body)));
    check("(1) ⭐ #coci-lookup/list/doubt lists the courses of the common courses in doubt",
      titles(t.d).sort().join("|") === "College Composition|Composition and Reading|Freshman Composition|Tool and Equipment Applications", titles(t.d).join("|"));
    const note = txt(t.d.body);
    check("(1) the note counts the cards and says which signal put them there",
      /2 common courses the daily re-check could not settle\. On 1 the catalog description reads as another discipline; on 1 only the colleges' TOP codes do/.test(note), note.slice(0, 400));
    check("(1) and what a ruling teaches", /A reason marked for similar cards becomes a proposed procedure/.test(note));
    await openPanel(t, "College Composition", /Why its discipline is in doubt/);
    const p = txt(panel(t.d));
    check("(2) the description's reading, in words", /Its catalog description reads closest to Communication Studies, then Journalism\./.test(p), p.slice(0, 500));
    check("(2) a card with no TOP vote says so", /None of its colleges' TOP codes maps to a discipline\./.test(p));
    check("(3) signed out: the evidence shows, the ruling form does not", !t.d.getElementById("ccl-rule-choice") && /sign in to rename it/.test(p));
  }
  {
    const t = tab({ signedIn: true });
    await openPanel(t, "Tool and Equipment Applications", /Why its discipline is in doubt/);
    const p = txt(panel(t.d));
    check("(2) TOP's votes, most first", /Its colleges' TOP codes point to Welding \(2\), Construction \(1\)\./.test(p), p.slice(0, 500));
    const opts = Array.from(t.d.getElementById("ccl-rule-choice").querySelectorAll("option")).map((o) => o.value + "=" + txt(o));
    check("(4) the ruling offers keep, the signals' disciplines, not sure, then every other discipline",
      opts.join("|") === "=Choose a ruling|keep=Keep Construction|move:Welding=Move to Welding|unsure=Not sure yet|move:English=English|also:Welding=Welding|also:English=English", opts.join("|"));
    const groups = Array.from(t.d.getElementById("ccl-rule-choice").querySelectorAll("optgroup")).map((g) => g.getAttribute("label"));
    check("(10) the second-discipline choices sit in their own group, named for the home it keeps",
      groups.join("|") === "Move to another discipline|Keep Construction, and also list as", groups.join("|"));
    rule(t, "move:Welding", "", true);
    await sleep(20);
    check("(6) a reason for similar cards must say why, and nothing is written", t.writes.length === 0 && /Say why, so a session can write the rule/.test(txt(panel(t.d))));
    rule(t, "move:Welding", "Hand tools for welding belong to Welding.", true);
    await until(() => t.writes.length >= 2);
    const [w1, w2] = t.writes, v = w1 && JSON.parse(w1.body.value);
    check("(5) ⭐ the reason is written first, under a new key, with the signals",
      w1.method === "POST" && /^_CCR_PROCEDURE_REQUEST::\d{4}-\d\d-\d\dT[\d:]+Z-CNST_M1009$/.test(w1.body.course_id) && w1.body.field === "ccr_procedure_request"
      && v.mid === "CNST M1009" && v.ruling === "move" && v.to === "Welding" && v.discipline_was === "Construction" && v.similar === true
      && v.words === "Hand tools for welding belong to Welding." && v.signals.votes.Welding === 2 && w1.body.reviewer_email === "reviewer@rccd.edu", JSON.stringify(w1));
    check("(5) ⭐ then a move sets the discipline through the List's one write",
      w2 && w2.method === "POST" && w2.body.course_id === "CNST M1009" && w2.body.field === "discipline" && w2.body.value === "Welding", JSON.stringify(w2));
    await until(() => /Set the discipline to Welding/.test(txt(panel(t.d))));
    check("(5) the panel says what happened", /Set the discipline to Welding/.test(txt(panel(t.d))));
  }
  {
    const t = tab({ signedIn: true });
    await openPanel(t, "College Composition", /Why its discipline is in doubt/);
    rule(t, "keep", "Composition stays English.", false);
    await until(() => t.writes.length >= 2);
    check("(5) keep confirms the discipline as it stands",
      t.writes[0].body.field === "ccr_procedure_request" && JSON.parse(t.writes[0].body.value).ruling === "keep" && JSON.parse(t.writes[0].body.value).similar === false
      && t.writes[1].body.field === "discipline" && t.writes[1].body.value === "English", JSON.stringify(t.writes));
  }
  {
    const t = tab({ signedIn: true });
    await openPanel(t, "College Composition", /Why its discipline is in doubt/);
    rule(t, "unsure", "", false);
    await until(() => /Marked not sure/.test(txt(panel(t.d))));
    check("(5) not sure writes the reason row alone", t.writes.length === 1 && JSON.parse(t.writes[0].body.value).ruling === "unsure", JSON.stringify(t.writes));
  }
  {
    const t = tab({ signedIn: true, refuse: true });
    await openPanel(t, "College Composition", /Why its discipline is in doubt/);
    rule(t, "move:Journalism", "Reads as reporting.", true);
    await until(() => /Not saved/.test(txt(panel(t.d))));
    check("(6) a refused write says so and writes no discipline", t.writes.length === 1 && /server answered 403/.test(txt(panel(t.d))), txt(panel(t.d)).slice(0, 300));
  }
  {
    const t = tab({ ruled: RULED });
    await until(() => /1 ruled so far, 1 with a reason marked for similar cards/.test(txt(t.d.body)));
    check("(7) the note counts the rulings read back", /1 ruled so far, 1 with a reason marked for similar cards/.test(txt(t.d.body)));
    await openPanel(t, "Tool and Equipment Applications", /Why its discipline is in doubt/);
    check("(7) ⭐ a ruling read back shows on the card",
      /Kept Construction by a reviewer on 2026-11-09\. Why: Shop tools are taught for the trade\. Marked for similar cards\./.test(txt(panel(t.d))), txt(panel(t.d)).slice(0, 500));
    check("(8) ⭐ signed out, the rulings read asks for no email and the card names none",
      t.reads.length >= 1 && t.reads.every((r) => !/reviewer_email/.test(r.url)) && !/sam@rccd\.edu/.test(txt(t.d.body)), JSON.stringify(t.reads));
    const trail = panel(t.d).querySelector("nav[aria-label='Trail']");
    check("(8) the panel's trail: CPL Commons / Courses / the job / the course",
      !!trail && /^CPL Commons \/ Courses \/ Discipline in doubt \/ /.test(txt(trail)) && trail.querySelector("a[href='#commons']"), trail && txt(trail));
  }
  {
    const t = tab({ ruled: RULED, signedIn: true });
    await until(() => /1 ruled so far/.test(txt(t.d.body)));
    await openPanel(t, "Tool and Equipment Applications", /Why its discipline is in doubt/);
    check("(8) signed in, the read carries the reviewer's token and the card names who ruled",
      t.reads.some((r) => /reviewer_email/.test(r.url) && r.auth === "Bearer tok.en.x") && /Kept Construction by sam@rccd\.edu on 2026-11-09/.test(txt(panel(t.d))), JSON.stringify(t.reads));
    t.w.dispatchEvent(new t.w.Event("cpl-session-changed"));
    await until(() => t.reads.length >= 2);
    check("(8) a sign-in change reads the rulings again", t.reads.length >= 2);
    check("(8) Use this reason for similar cards starts unticked", t.d.getElementById("ccl-rule-similar") && t.d.getElementById("ccl-rule-similar").checked === false);
  }
  {
    // (9) issue 2995 (Sam, 2026-11-09): "the list view shifts focus to the top row every time you take action in the
    // sidebar and the listview is not obviously highlighted as to which row you're acting on. the save ruling and
    // other buttons are a bit jumbled together."
    const t = tab({ signedIn: true });
    await openPanel(t, "College Composition", /Why its discipline is in doubt/);
    const cur = () => t.d.querySelector("tr.ccl-cur");
    check("(9) ⭐ the row whose panel is open is marked current, in class and for a screen reader",
      !!cur() && cur().getAttribute("aria-current") === "true" && /College Composition/.test(txt(cur())) && t.d.querySelectorAll("tr.ccl-cur").length === 1);
    check("(9) and its M-ID band is marked with it", t.d.querySelectorAll("tr.ccl-band.ccl-bandcur").length === 1 &&
      /ENGL M1001/.test(txt(t.d.querySelector("tr.ccl-bandcur"))), txt(t.d.querySelector("tr.ccl-bandcur")));
    const p0 = panel(t.d);
    const save = pword(t.d, /^Save the ruling$/);
    check("(9) Save the ruling sits on its own line inside the ruling's box", !!save.closest(".ccl-rule-save") && !!save.closest(".ccl-rule") &&
      save.closest(".ccl-rule-save").querySelectorAll("button, a").length === 1);
    const edit = p0.querySelector(".ccl-pn-edit");
    check("(9) the edits sit apart under their own words", !!edit && !edit.closest(".ccl-rule") && /Or edit the common course/.test(txt(p0.querySelector(".ccl-pn-edit-h"))) &&
      Array.from(edit.querySelectorAll("button")).some((b) => /Change the discipline/.test(txt(b))) && !/Save the ruling|SkyView/.test(txt(edit)));
    const sky = p0.querySelector(".ccl-pn-sky");
    check("(9) and Open in SkyView has a line of its own", !!sky && /^Open ENGL M1001 in SkyView$/.test(txt(sky)));
    t.d.querySelector(".ccl-wrap").scrollTop = 140;
    rule(t, "unsure", "", false);
    await until(() => /Marked not sure/.test(txt(panel(t.d))));
    check("(9) ⭐ after a save the list stays where it was, never back at its top row", t.d.querySelector(".ccl-wrap").scrollTop === 140,
      "scrollTop " + t.d.querySelector(".ccl-wrap").scrollTop);
    check("(9) and the row acted on is still the current one", !!cur() && /College Composition/.test(txt(cur())));
  }
  {
    // (10) an unconfirmed, unmerged common course: the reason, then one write of two rows.
    const t = tab({ signedIn: true });
    await openPanel(t, "College Composition", /Why its discipline is in doubt/);
    rule(t, "also:Journalism", "Taken as English or as Journalism, by major.", false);
    await until(() => t.writes.length >= 2);
    const v = JSON.parse(t.writes[0].body.value), rows = t.writes[1].body;
    check("(10) ⭐ the reason is written first, as a cross-list ruling that names the second discipline and the home it keeps",
      t.writes[0].body.field === "ccr_procedure_request" && v.ruling === "crosslist" && v.to === "Journalism" && v.discipline_was === "English"
      && JSON.stringify(v.also) === '["Journalism"]' && JSON.stringify(v.also_was) === "[]", JSON.stringify(t.writes[0]));
    check("(10) ⭐ then one write: the second discipline, and the home confirmed as it stands",
      t.writes.length === 2 && Array.isArray(rows) && rows.length === 2
      && rows[0].course_id === "ENGL M1001" && rows[0].field === "cross_listed_disciplines" && rows[0].value === "Journalism" && rows[0].reviewer_email === "reviewer@rccd.edu"
      && rows[1].field === "discipline" && rows[1].value === "English", JSON.stringify(t.writes[1]));
    await until(() => /Kept English and listed it also as Journalism/.test(txt(panel(t.d))));
    const p = txt(panel(t.d));
    check("(10) the panel says what happened, and shows the second discipline with the evidence",
      /Kept English and listed it also as Journalism\. The daily sync folds it into the reference\./.test(p) && /It is also listed as Journalism\./.test(p)
      && /Kept English, also listed as Journalism by reviewer@rccd\.edu/.test(p), p.slice(0, 700));
  }
  {
    // (10) a merged common course (its confirmation is a stamp): the second discipline alone, and never a discipline write.
    const t = tab({ signedIn: true });
    await openPanel(t, "Tool and Equipment Applications", /Why its discipline is in doubt/);
    rule(t, "also:Welding", "", false);
    await until(() => t.writes.length >= 2);
    await sleep(30);
    const rows = t.writes[1].body;
    check("(10) ⭐ a cross-list never changes the home discipline: no discipline row names another one",
      t.writes.length === 2 && Array.isArray(rows) && rows.length === 1 && rows[0].field === "cross_listed_disciplines" && rows[0].value === "Welding"
      && !t.writes.some((w) => [].concat(w.body).some((r) => r && r.field === "discipline" && r.value !== "Construction")), JSON.stringify(t.writes));
  }
  {
    // (10) a course that already lists a second discipline: a new one adds to it, and one choice clears them.
    const t = tab({ signedIn: true, xdisc: { "ENGL M1001": ["Communication Studies"] } });
    await openPanel(t, "College Composition", /Why its discipline is in doubt/);
    const opts = Array.from(t.d.getElementById("ccl-rule-choice").querySelectorAll("option")).map((o) => o.value);
    check("(10) what it already lists is said, is not offered again, and can be cleared",
      /It is also listed as Communication Studies\./.test(txt(panel(t.d))) && opts.indexOf("also:Communication Studies") < 0 && opts.indexOf("also:") >= 0
      && opts.indexOf("also:English") < 0 && opts.indexOf("also:Journalism") >= 0, opts.join("|"));
    rule(t, "also:Journalism", "", false);
    await until(() => t.writes.length >= 2);
    check("(10) ⭐ a second choice adds to the first", t.writes[1].body[0].value === "Communication Studies, Journalism"
      && JSON.stringify(JSON.parse(t.writes[0].body.value).also_was) === '["Communication Studies"]', JSON.stringify(t.writes[1]));
    await until(() => /listed it also as Communication Studies, Journalism/.test(txt(panel(t.d))));
    rule(t, "also:", "", false);
    await until(() => t.writes.length >= 4);
    const v = JSON.parse(t.writes[2].body.value);
    check("(10) clearing writes the reason with what was listed, then an empty value",
      v.ruling === "crosslist" && v.to === "" && JSON.stringify(v.also) === "[]" && JSON.stringify(v.also_was) === '["Communication Studies","Journalism"]'
      && t.writes[3].body[0].field === "cross_listed_disciplines" && t.writes[3].body[0].value === "", JSON.stringify(t.writes.slice(2)));
    await until(() => /cleared its second discipline/.test(txt(panel(t.d))));
    check("(10) and the panel stops saying it is listed elsewhere", !/It is also listed as/.test(txt(panel(t.d))) && /Kept English, second discipline cleared/.test(txt(panel(t.d))));
  }
  {
    // (10) COBIx on #3025: two MQ names carry commas of their own. The name is kept whole in the panel and the reason row.
    const t = tab({ signedIn: true, mq: ["Construction", "English", "Sign Language, American", "Welding"], xdisc: { "ENGL M1001": ["Journalism"] } });
    await openPanel(t, "College Composition", /Why its discipline is in doubt/);
    rule(t, "also:Sign Language, American", "", false);
    await until(() => t.writes.length >= 2);
    const v = JSON.parse(t.writes[0].body.value);
    check("(10) ⭐ a discipline whose name carries a comma stays one name in the reason row",
      JSON.stringify(v.also) === '["Journalism","Sign Language, American"]' && v.to === "Sign Language, American", JSON.stringify(v.also));
    check("(10) the row's value is the comma-separated list the daily fold splits against the MQ names",
      t.writes[1].body[0].value === "Journalism, Sign Language, American", JSON.stringify(t.writes[1].body[0]));
    await until(() => /listed it also as Journalism; Sign Language, American/.test(txt(panel(t.d))));
    const p = txt(panel(t.d));
    check("(10) ⭐ and the panel reads it back as two disciplines, never three",
      /It is also listed as Journalism; Sign Language, American\./.test(p) && /No second discipline \(clear Journalism; Sign Language, American\)/.test(p), p.slice(0, 600));
    rule(t, "also:Welding", "", false);
    await until(() => t.writes.length >= 4);
    check("(10) a later choice adds to the two, with the comma name still whole",
      JSON.stringify(JSON.parse(t.writes[2].body.value).also) === '["Journalism","Sign Language, American","Welding"]', t.writes[2].body.value);
  }
  {
    // (10) a course with no home discipline has nothing to keep: no second-discipline group, and never "Keep undefined".
    const t = tab({ signedIn: true, nohome: "ENGL M1001" });
    await openPanel(t, "College Composition", /Why its discipline is in doubt/);
    const sel = t.d.getElementById("ccl-rule-choice");
    check("(10) with no home discipline the group is left out", !!sel && !Array.from(sel.querySelectorAll("optgroup")).some((g) => /also list as/.test(g.getAttribute("label")))
      && !/undefined/.test(txt(panel(t.d))), sel && Array.from(sel.querySelectorAll("optgroup")).map((g) => g.getAttribute("label")).join("|"));
  }
  {
    const t = tab({ ruled: [Object.assign({}, RULED[0], { value: JSON.stringify({ mid: "CNST M1009", discipline_was: "Construction", ruling: "crosslist", to: "Welding", words: "", similar: false }) })] });
    await until(() => /1 ruled so far/.test(txt(t.d.body)));
    await openPanel(t, "Tool and Equipment Applications", /Why its discipline is in doubt/);
    check("(10) a cross-list ruling read back shows on the card", /Kept Construction, also listed as Welding by a reviewer on 2026-11-09\./.test(txt(panel(t.d))), txt(panel(t.d)).slice(0, 400));
  }
  {
    const t = tab({ doubtFail: true });
    await until(() => /ccr_doubt\.json answered 404/.test(txt(t.d.body)));
    check("(7) the file failing says so, never an empty list as a zero", /kb\/ccr_doubt\.json answered 404, so this filter shows nothing/.test(txt(t.d.body)));
  }
  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "  ✓ " : "  ✗ ") + r[0] + (r[1] || !r[2] ? "" : "\n     " + r[2])));
  console.log("coci_list_doubt: " + (results.length - failed.length) + "/" + results.length + " passed");
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

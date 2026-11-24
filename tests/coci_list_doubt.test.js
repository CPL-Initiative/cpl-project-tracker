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
// The MQ view's file (kb/status/mq_view.json): Welding carries a license provision; its regulation numbers never render.
const MQVIEW = { types: {}, provisions: { license_53410_1: { disciplines: {}, words: "Professional license as an alternative (CCR 53410.1): a bachelor's plus a valid California license." } },
  rows: [{ key: "Welding", our_name: "Welding", types: ["any"], provisions: ["license_53410_1"], noncredit: false },
    { key: "English", our_name: "English", types: ["masters"], provisions: [], noncredit: false }] };
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
      const refused = (opts.refuse && body && body.field === "ccr_procedure_request") || (opts.refuseDisc && body && !Array.isArray(body) && body.field === "discipline");
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
    if (/mq_view\.json/.test(url)) return ok(MQVIEW);
    if (/row_audit\/latest\.json/.test(url)) return ok({ rows: [] });
    if (/csr_out\/latest\.json/.test(url)) return ok({ _mid_codes: { strays: [] } });
    return ok([]);
  };
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = LIST_SRC; w.document.body.appendChild(e); }
    if (s === "unified_courses_details.js") w.CPL_UC_DETAILS = { "WELD M1109": { d: "Shielded metal arc welding in flat and horizontal positions." } };
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
  // A ruled card has left Discipline in doubt (#3510 B3); its panel still opens from All, where its ruling shows.
  if (!(await until(() => titleBtn(t.d, title), 1500))) {
    const all = Array.from(t.d.querySelectorAll("[id$='filters'] button")).find((b) => /^All\b/.test(txt(b)));
    if (all) all.click();
    await until(() => titleBtn(t.d, title));
  }
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
    await until(() => dataRows(t.d).length > 0 && /Common subject in doubt, English/.test(txt(t.d.body)));
    check("(1) ⭐ #coci-lookup/list/doubt lists the courses of the common courses in doubt",
      titles(t.d).sort().join("|") === "College Composition|Composition and Reading|Freshman Composition|Tool and Equipment Applications", titles(t.d).join("|"));
    const note = txt(t.d.body);
    check("(1) the note counts the cards and says which signal put them there",
      /2 common courses the daily re-check could not settle\. On 1 the catalog description reads as another discipline; on 1 only the colleges' TOP codes do/.test(note), note.slice(0, 400));
    check("(1) and what a ruling teaches", /A reason marked for similar cards becomes a proposed procedure/.test(note));
    /* S724 (the S723 NEXT): each band in doubt says in one line which signal put it there; the panel keeps the rest. */
    const bandOf = (re) => Array.from(t.d.querySelectorAll("tr.ccl-band")).filter((tr) => re.test(txt(tr)))[0];
    const bE = bandOf(/ENGL M1001/);
    check("(13) ⭐ a band in doubt by its description says where the description reads",
      bE && /Common subject in doubt: its catalog description reads closest to Communication Studies\./.test(txt(bE)), bE && txt(bE));
    await openPanel(t, "College Composition", /Why its common subject is in doubt/);
    const p = txt(panel(t.d));
    check("(2) the description's reading, in words", /Its catalog description reads closest to Communication Studies, then Journalism\./.test(p), p.slice(0, 500));
    check("(2) a card with no TOP vote says so", /None of its colleges' TOP codes maps to a common subject\./.test(p));
    /* S723 (Sam, 2026-11-24): the ruling assigns the common course to a common subject, never a local subject. */
    check("(2) ⭐ the panel says a ruling assigns a common subject and never changes a local subject code",
      /A ruling assigns this common course to a common subject: an MQ discipline and its common subject code\. It never changes a college's local subject code/.test(p));
    check("(2) ⭐ a common subject reads with its code once the Common Subjects Reference seed answers", /function ccName\(d\) \{ var k = d && CC\.code && CC\.code\[d\]; return k \? k \+ " " \+ d : d \|\| ""; \}/.test(fs.readFileSync("coci_lookup.js", "utf8"))
      && /fetch\("kb\/discipline_canonical_subj4\.json"\)/.test(fs.readFileSync("coci_lookup.js", "utf8")));
    check("(3) signed out: the evidence shows, the ruling form does not", !t.d.getElementById("ccl-rule-choice") && /sign in to rename it/.test(p));
  }
  {
    const t = tab({ signedIn: true });
    await openPanel(t, "Tool and Equipment Applications", /Why its common subject is in doubt/);
    const p = txt(panel(t.d));
    check("(2) TOP's votes, most first", /Its colleges' TOP codes point to Welding \(2\), Construction \(1\)\./.test(p), p.slice(0, 500));
    const opts = Array.from(t.d.getElementById("ccl-rule-choice").querySelectorAll("option")).map((o) => o.value + "=" + txt(o));
    check("(4) the ruling offers keep, the signals' disciplines, not sure, then every common subject but its own (S723)",
      opts.join("|") === "=Choose a ruling|keep=Keep Construction|move:Welding=Move to Welding|unsure=Not sure yet|move:English=English|move:Welding=Welding|also:Welding=Welding|also:English=English", opts.join("|"));
    const groups = Array.from(t.d.getElementById("ccl-rule-choice").querySelectorAll("optgroup")).map((g) => g.getAttribute("label"));
    check("(10) the second-discipline choices sit in their own group, named for the home it keeps",
      groups.join("|") === "Move to another common subject|Keep Construction, and also list under", groups.join("|"));
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
    await openPanel(t, "College Composition", /Why its common subject is in doubt/);
    rule(t, "keep", "Composition stays English.", false);
    await until(() => t.writes.length >= 2);
    check("(5) keep confirms the discipline as it stands",
      t.writes[0].body.field === "ccr_procedure_request" && JSON.parse(t.writes[0].body.value).ruling === "keep" && JSON.parse(t.writes[0].body.value).similar === false
      && t.writes[1].body.field === "discipline" && t.writes[1].body.value === "English", JSON.stringify(t.writes));
  }
  {
    const t = tab({ signedIn: true });
    await openPanel(t, "College Composition", /Why its common subject is in doubt/);
    rule(t, "unsure", "", false);
    await until(() => /Marked not sure/.test(txt(panel(t.d))));
    check("(5) not sure writes the reason row alone", t.writes.length === 1 && JSON.parse(t.writes[0].body.value).ruling === "unsure", JSON.stringify(t.writes));
  }
  {
    const t = tab({ signedIn: true, refuse: true });
    await openPanel(t, "College Composition", /Why its common subject is in doubt/);
    rule(t, "move:Journalism", "Reads as reporting.", true);
    await until(() => /Not saved/.test(txt(panel(t.d))));
    check("(6) a refused write says so and writes no discipline", t.writes.length === 1 && /server answered 403/.test(txt(panel(t.d))), txt(panel(t.d)).slice(0, 300));
  }
  {
    const t = tab({ ruled: RULED });
    await until(() => /1 ruled so far, 1 with a reason marked for similar cards/.test(txt(t.d.body)));
    check("(7) the note counts the rulings read back", /1 ruled so far, 1 with a reason marked for similar cards/.test(txt(t.d.body)));
    await openPanel(t, "Tool and Equipment Applications", /Why its common subject is in doubt/);
    check("(7) ⭐ a ruling read back shows on the card",
      /Kept Construction by a reviewer on 2026-11-09\. Why: Shop tools are taught for the trade\. Marked for similar cards\./.test(txt(panel(t.d))), txt(panel(t.d)).slice(0, 500));
    check("(8) ⭐ signed out, the rulings read asks for no email and the card names none",
      t.reads.length >= 1 && t.reads.every((r) => !/reviewer_email/.test(r.url)) && !/sam@rccd\.edu/.test(txt(t.d.body)), JSON.stringify(t.reads));
    // The trail names the job when the panel opens from it: an unruled card, still on the in-doubt list (#3510 B3).
    const back = Array.from(t.d.querySelectorAll("[id$='filters'] button")).find((b) => /^Common subject in doubt/.test(txt(b)));
    if (back) back.click();
    await openPanel(t, "College Composition", /Why its common subject is in doubt/);
    const trail = panel(t.d).querySelector("nav[aria-label='Trail']");
    check("(8) the panel's trail: CPL Commons / Courses / the job / the course",
      !!trail && /^CPL Commons \/ Courses \/ Common subject in doubt \/ /.test(txt(trail)) && trail.querySelector("a[href='#commons']"), trail && txt(trail));
  }
  {
    const t = tab({ ruled: RULED, signedIn: true });
    await until(() => /1 ruled so far/.test(txt(t.d.body)));
    await openPanel(t, "Tool and Equipment Applications", /Why its common subject is in doubt/);
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
    await openPanel(t, "College Composition", /Why its common subject is in doubt/);
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
    await openPanel(t, "College Composition", /Why its common subject is in doubt/);
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
    // (10) a merged common course: the second discipline and, since issue 3447, the home discipline row as it stands
    // (a merged card's confirmation is a POST; the overlay fold stamps validated_at from it), never another discipline.
    const t = tab({ signedIn: true });
    await openPanel(t, "Tool and Equipment Applications", /Why its common subject is in doubt/);
    rule(t, "also:Welding", "", false);
    await until(() => t.writes.length >= 2);
    await sleep(30);
    const rows = t.writes[1].body;
    check("(10) ⭐ a cross-list never changes the home discipline: no discipline row names another one",
      t.writes.length === 2 && Array.isArray(rows) && rows.length === 2 && rows[0].field === "cross_listed_disciplines" && rows[0].value === "Welding"
      && rows[1].field === "discipline" && rows[1].value === "Construction"
      && !t.writes.some((w) => w.method === "PATCH")
      && !t.writes.some((w) => [].concat(w.body).some((r) => r && r.field === "discipline" && r.value !== "Construction")), JSON.stringify(t.writes));
  }
  {
    // (11) ⭐ issue 3447: a Keep on a merged card POSTs field=discipline and sends no PATCH (6 of Sam's 13 Keeps were
    // merged cards whose PATCH the row policy refused, so they never saved).
    const t = tab({ signedIn: true });
    await openPanel(t, "Tool and Equipment Applications", /Why its common subject is in doubt/);
    rule(t, "keep", "Shop tools stay Construction.", false);
    await until(() => t.writes.length >= 2);
    await sleep(30);
    const w2 = t.writes[1] || {};
    check("(11) ⭐ a Keep on a merged card POSTs the discipline as it stands, and never a PATCH",
      t.writes.length === 2 && w2.method === "POST" && w2.body.course_id === "CNST M1009" && w2.body.field === "discipline"
      && w2.body.value === "Construction" && !t.writes.some((w) => w.method === "PATCH"), JSON.stringify(t.writes));
  }
  {
    // (11) a discipline write that fails says the discipline did not save, and the ruling is not shown as landed.
    const t = tab({ signedIn: true, refuseDisc: true });
    await openPanel(t, "Tool and Equipment Applications", /Why its common subject is in doubt/);
    rule(t, "keep", "Shop tools stay Construction.", false);
    await until(() => /did not save/.test(txt(panel(t.d))));
    const p = txt(panel(t.d));
    check("(11) ⭐ a failed discipline write says plainly that the discipline did not save",
      /the discipline did not save, so the ruling has not landed/.test(p) && /Not saved: the server answered 403/.test(p), p.slice(0, 600));
    check("(11) and the ruling is not recorded as landed", !/Kept Construction by reviewer@rccd\.edu/.test(p) && !/1 ruled so far/.test(txt(t.d.body)), p.slice(0, 600));
  }
  {
    // (10) a course that already lists a second discipline: a new one adds to it, and one choice clears them.
    const t = tab({ signedIn: true, xdisc: { "ENGL M1001": ["Communication Studies"] } });
    await openPanel(t, "College Composition", /Why its common subject is in doubt/);
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
    await openPanel(t, "College Composition", /Why its common subject is in doubt/);
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
    await openPanel(t, "College Composition", /Why its common subject is in doubt/);
    const sel = t.d.getElementById("ccl-rule-choice");
    check("(10) with no home discipline the group is left out", !!sel && !Array.from(sel.querySelectorAll("optgroup")).some((g) => /also list as/.test(g.getAttribute("label")))
      && !/undefined/.test(txt(panel(t.d))), sel && Array.from(sel.querySelectorAll("optgroup")).map((g) => g.getAttribute("label")).join("|"));
  }
  {
    const t = tab({ ruled: [Object.assign({}, RULED[0], { value: JSON.stringify({ mid: "CNST M1009", discipline_was: "Construction", ruling: "crosslist", to: "Welding", words: "", similar: false }) })] });
    await until(() => /1 ruled so far/.test(txt(t.d.body)));
    await openPanel(t, "Tool and Equipment Applications", /Why its common subject is in doubt/);
    check("(10) a cross-list ruling read back shows on the card", /Kept Construction, also listed as Welding by a reviewer on 2026-11-09\./.test(txt(panel(t.d))), txt(panel(t.d)).slice(0, 400));
  }
  {
    // (12) ⭐ #3447 items 1 and 6, #3510 B3: a card someone has ruled on leaves Discipline in doubt at once, its count
    // and note follow, and the List says its counts are local courses (B2).
    const t = tab({ ruled: RULED });
    await until(() => /1 ruled so far/.test(txt(t.d.body)) && dataRows(t.d).length);
    const titles = dataRows(t.d).map((r) => txt(cell(r, t.d, "Title")));
    check("(12) ⭐ the ruled card's local course is off the in-doubt list; the unruled card's stay",
      !titles.some((x) => x.indexOf("Tool and Equipment Applications") === 0) && titles.some((x) => x.indexOf("College Composition") === 0), titles);
    const cur = t.d.querySelector("[id$='filters'] [aria-current]");
    check("(12) the filter's count follows: 3 local courses, the ruled card's 1 gone", cur && /^Common subject in doubt \(3\)$/.test(txt(cur)), cur && txt(cur));
    check("(12) the note says a ruled card leaves and how many common courses wait",
      /a ruled card leaves this list, and its ruling stays on its panel\. 1 common course waits for a ruling/.test(txt(t.d.body)), txt(t.d.querySelector(".ccl-doubt-note")));
    const note = t.d.querySelector("[data-doubt-desc-open]");
    check("(12) ⭐ the note carries the waiting and ruled description cards the nightly click-through compares with the Commons",
      note && note.getAttribute("data-doubt-open") === "1" && note.getAttribute("data-doubt-desc") === "1" &&
      note.getAttribute("data-doubt-desc-open") === "1" && note.getAttribute("data-doubt-desc-ruled") === "0",
      note && [note.getAttribute("data-doubt-open"), note.getAttribute("data-doubt-desc"), note.getAttribute("data-doubt-desc-open"), note.getAttribute("data-doubt-desc-ruled")]);
    const unit = t.d.querySelector("[id$='filters'] [data-unit]");
    check("(12) ⭐ the List says its counts are local courses and the Commons' are common courses", unit && /local courses/.test(txt(unit)) && /common courses/.test(txt(unit)), unit && txt(unit));
  }
  {
    // (12) a Keep saved in the panel takes its card off the list in the same visit.
    const t = tab({ signedIn: true });
    await openPanel(t, "College Composition", /Why its common subject is in doubt/);
    rule(t, "keep", "Composition is English.", false);
    await until(() => t.writes.length >= 2);
    await until(() => !dataRows(t.d).some((r) => txt(cell(r, t.d, "Title")).indexOf("College Composition") === 0));
    check("(12) ⭐ a ruling saved in the panel drops its card's rows from Discipline in doubt at once",
      !dataRows(t.d).some((r) => txt(cell(r, t.d, "Title")).indexOf("College Composition") === 0), dataRows(t.d).map((r) => txt(cell(r, t.d, "Title"))));
  }
  {
    // (13) ⭐ Sam, S723, 2026-11-24: "the courses should be curated individually under their mid course heading ...
    // move the accept button to the course row, not the mid row"; "accept and move are good to have on the course rows";
    // "would be nice if the move gave me the dropdown right in the row".
    const t = tab({ signedIn: true });
    await until(() => t.d.querySelectorAll(".ccl-row-acts button").length > 0);
    const bodies = () => [].concat(...t.writes.map((w) => Array.isArray(w.body) ? w.body : [w.body])).filter(Boolean);
    const rowOf = (title) => dataRows(t.d).find((r) => txt(cell(r, t.d, "Title")).indexOf(title) === 0);
    const wordsIn = (r) => Array.from(r.querySelectorAll(".ccl-row-acts button")).map(txt);
    check("(13) ⭐ each course row in doubt carries Accept and Move; the M-ID heading carries none",
      wordsIn(rowOf("College Composition")).join("|") === "Accept|Move" && wordsIn(rowOf("Tool and Equipment Applications")).join("|") === "Accept|Move"
      && !Array.from(t.d.querySelectorAll("tr[class*='band'] .ccl-band-accept")).length, wordsIn(rowOf("College Composition")).join("|"));
    // S724 (Sam, 2026-11-24, on the mock): "layout b looks good"; "add the description in small font next to the
    // title"; "it's unclear to me which of the 2 courses I'm moving"; "add a selector box to each and one on the mid";
    // "note which of the 3 mq quals they are"; "take off the CCR citations". No id is typed.
    const band = () => Array.from(t.d.querySelectorAll("tr.ccl-band")).find((tr) => /ENGL M1001/.test(txt(tr)));
    const bandBox = () => band().querySelector("input.ccl-bandbox");
    check("(13) ⭐ a band in doubt carries a box that ticks every course under it", !!bandBox(), band() && band().innerHTML.slice(0, 300));
    Array.from(rowOf("College Composition").querySelectorAll(".ccl-row-acts button")).find((b) => txt(b) === "Move").click();
    await until(() => !!t.d.querySelector(".ccl-move-panel"));
    const panelH = () => txt(t.d.querySelector(".ccl-move-h"));
    // S724 (Sam, 2026-11-24, on the tabbed mock: "looks great, let's go with it"): the selected course's views sit in a
    // bottom bar of tabs under the List, at its full width; Move is one tab, opened by the row's own Move.
    const bar = () => t.d.querySelector("section.ccl-panel.ccl-below");
    const tabsNow = () => Array.from(t.d.querySelectorAll(".ccl-ptabs [role=tab]")).map(txt);
    check("(14) ⭐ Move on a row opens the bottom bar under the List, on its Move tab",
      !!bar() && !t.d.querySelector("aside.ccl-panel") && tabsNow().join("|") === "Course|Move|Its common course|Catalog|History"
      && txt(t.d.querySelector(".ccl-ptabs [aria-selected=true]")) === "Move" && bar().previousElementSibling && /ccl-wrap/.test(bar().previousElementSibling.className), tabsNow().join("|"));
    check("(13) ⭐ Move on a row opens the panel under the band, naming that one course with its college and units",
      /^Moving ENGL 300 College Composition at American River College \(4 units\) to:$/.test(panelH()), panelH());
    check("(13) and it ticks that row's box alone", bandBox().indeterminate && !bandBox().checked);
    await until(() => /Any degree; a California license can substitute/.test(txt(t.d.querySelector(".ccl-move-subj"))));
    const subj = t.d.querySelector(".ccl-move-subj");
    const groups = Array.from(subj.querySelectorAll("optgroup")).map((g) => g.label + ": " + Array.from(g.querySelectorAll("option")).map((o) => o.value).join(","));
    check("(13) ⭐ the common subject comes first: the card's signals, then every other common subject",
      groups.join(" | ") === "Suggested by this course: Communication Studies,Journalism,English | Every other common subject: Construction,Welding", groups.join(" | "));
    const wOpt = txt(subj.querySelector("option[value='Welding']"));
    check("(13) ⭐ each common subject names its minimum qualifications list and provision, with no regulation number",
      /Welding, Any degree; a California license can substitute$/.test(wOpt) && /\(its common subject now\), Master's$/.test(txt(subj.querySelector("option[value='English']"))) && !/CCR|5341/.test(txt(subj)), wOpt);
    subj.value = "Welding"; subj.dispatchEvent(new t.w.Event("change"));
    await until(() => /Shielded metal arc/.test(txt(t.d.querySelector(".ccl-move-table") || t.d.body)));
    const mq = txt(t.d.querySelector(".ccl-move-mq"));
    check("(13) ⭐ the chosen subject shows its handbook line and the provision's own words, no citation",
      /Minimum qualifications: Any degree list, as Welding in the 20th-edition handbook\./.test(mq) && /Professional license as an alternative a bachelor's/.test(mq) && !/CCR|5341/.test(mq) && /Apprenticeship and a required California license/.test(mq), mq);
    const trs = () => Array.from(t.d.querySelectorAll(".ccl-move-table tbody tr")).map(txt);
    check("(13) ⭐ then a table of that subject's common courses: id, title with its description in small type, units, local courses",
      trs().join("|") === "WELD M1109Welding IShielded metal arc welding in flat and horizontal positions.3 units3", trs().join("|"));
    const words = t.d.querySelector(".ccl-move-words");
    words.value = "pipe"; words.dispatchEvent(new t.w.Event("input"));
    check("(13) words typed narrow the table", trs().length === 0 && /0 common courses in WELD Welding|0 common courses in Welding/.test(txt(t.d.querySelector(".ccl-move-ctrls"))), txt(t.d.querySelector(".ccl-move-ctrls")));
    const w2 = t.d.querySelector(".ccl-move-words"); w2.value = ""; w2.dispatchEvent(new t.w.Event("input"));
    t.d.querySelector(".ccl-move-table tbody tr td:nth-child(3)").click();
    await until(() => !!t.d.querySelector(".ccl-move-table tr.ccl-move-on"));
    const moveBtn = () => Array.from(t.d.querySelectorAll(".ccl-move-acts button")).find((b) => /^Move /.test(txt(b)));
    check("(13) the button names the course it moves", txt(moveBtn()) === "Move ENGL 300 here", txt(moveBtn()));
    moveBtn().click();
    await until(() => bodies().some((b) => b.field === "merge_into"));
    const mv = bodies().find((b) => b.field === "merge_into");
    check("(13) ⭐ Move here writes the course's own re-home, never the card's common subject", mv.course_id === "CN:CCC1" && mv.value === "WELD M1109"
      && !bodies().some((b) => b.field === "ccr_procedure_request"), JSON.stringify(mv));
    // The band's box ticks the courses left; one press moves them together, one saved move each.
    await until(() => /Moved ENGL 300 to WELD M1109/.test(txt(t.d.body)));
    bandBox().click();
    await until(() => /2 courses chosen/.test(txt(t.d.querySelector(".ccl-move-bar") || t.d.body)));
    check("(13) ⭐ the band's box chooses every course still to settle", /2 courses chosen/.test(txt(t.d.querySelector(".ccl-move-bar"))), txt(t.d.querySelector(".ccl-move-bar") || t.d.body).slice(0, 200));
    await until(() => !!t.d.querySelector(".ccl-move-panel"));
    check("(13) ⭐ the panel names every course it will move",
      /^Moving ENGL 101 Composition and Reading at Rio Hondo College \(3 units\) and ENGL 100 Freshman Composition at Cypress College \(4 units\) to:$/.test(panelH()), panelH());
    const s2 = t.d.querySelector(".ccl-move-subj"); s2.value = "Welding"; s2.dispatchEvent(new t.w.Event("change"));
    await until(() => !!t.d.querySelector(".ccl-move-table tbody tr"));
    t.d.querySelector(".ccl-move-table tbody tr input[type=radio]").click();
    await until(() => /^Move these 2 courses here$/.test(txt(moveBtn() || t.d.body)));
    moveBtn().click();
    await until(() => bodies().filter((b) => b.field === "merge_into").length >= 3);
    const mvs = bodies().filter((b) => b.field === "merge_into").map((b) => b.course_id + ">" + b.value).sort();
    // The tabs act as well as inform (r-bottom-bar-tabs-act-and-inform): History shows the move with Take it back;
    // Its common course lists every local course with its state; the tab chosen follows the reader from row to row.
    Array.from(t.d.querySelectorAll(".ccl-ptabs [role=tab]")).find((b) => txt(b) === "History").click();
    await until(() => /Moved to WELD M1109/.test(txt(bar())));
    check("(14) ⭐ History shows the saved move with Take it back", /Moved to WELD M1109/.test(txt(bar())) && Array.from(bar().querySelectorAll("button")).some((b) => txt(b) === "Take it back"), txt(bar()).slice(0, 300));
    check("(14) and its table sorts, filters and resizes (r-lists-sort-resize-filter-act-on-row)",
      !!bar().querySelector(".ccl-pn-f input[type=search]") && !!bar().querySelector(".ccl-pn-grip[role=separator]") && !!bar().querySelector("th button"));
    Array.from(t.d.querySelectorAll(".ccl-ptabs [role=tab]")).find((b) => txt(b) === "Its common course").click();
    await until(() => /Local courses under ENGL M1001/.test((bar().querySelector("[role=region]") || {}).getAttribute ? bar().querySelector("[role=region]").getAttribute("aria-label") : ""));
    check("(14) ⭐ Its common course lists each local course with what was done to it", /Moved to WELD M1109/.test(txt(bar())), txt(bar()).slice(0, 300));
    rowOf("Tool and Equipment Applications").querySelector("button.ccl-tlink, td button").click();
    await until(() => /Tool and Equipment Applications/.test(txt(t.d.querySelector(".ccl-pt"))));
    check("(14) the tab chosen stays as the reader selects another row", txt(t.d.querySelector(".ccl-ptabs [aria-selected=true]")) === "Its common course", tabsNow().join("|"));
    check("(13) ⭐ Move these 2 courses here writes one move per course", mvs.join(",") === "CN:CCC1>WELD M1109,CN:CCC2>WELD M1109,CN:CCC3>WELD M1109", mvs.join(","));
    // Accept on the only course of a card: its own row, then the card's Keep, and the card leaves the list.
    Array.from(rowOf("Tool and Equipment Applications").querySelectorAll(".ccl-row-acts button")).find((b) => txt(b) === "Accept").click();
    await until(() => bodies().some((b) => b.field === "mid_member_confirm"));
    const ac = bodies().find((b) => b.field === "mid_member_confirm");
    check("(13) ⭐ Accept writes that one course's place under its common course", ac.course_id === "CN:CCC4" && ac.value === "CNST M1009" && !!ac.reviewer_email, JSON.stringify(ac));
    const keepOf = (id) => bodies().filter((b) => b.field === "ccr_procedure_request").map((b) => JSON.parse(b.value)).find((v) => v.mid === id);
    await until(() => !!keepOf("CNST M1009"));
    const kp = keepOf("CNST M1009");
    check("(13) ⭐ a card whose every course moved saves its own Keep too", !!keepOf("ENGL M1001"));
    check("(13) ⭐ with every course of the card accepted, the card's own Keep is saved", kp.mid === "CNST M1009" && kp.ruling === "keep", JSON.stringify(kp));
    await until(() => !rowOf("Tool and Equipment Applications"));
    check("(13) and the card leaves the list", !rowOf("Tool and Equipment Applications"));
  }
  {
    const t = tab({});
    await until(() => dataRows(t.d).length > 0);
    await sleep(30);
    check("(13) signed out, no course row carries Accept or Move", !t.d.querySelector(".ccl-row-acts"));
  }
  {
    // (12) ⭐ COBIx on #3517 finding 1: a "not sure" changed to a Keep replaces its card's ruling without changing how
    // many rulings there are; the in-doubt count still drops with the card's rows.
    const unsure = [Object.assign({}, RULED[0], { value: JSON.stringify({ mid: "CNST M1009", discipline_was: "Construction", ruling: "unsure", words: "", similar: false }) })];
    const t = tab({ ruled: unsure, signedIn: true });
    await until(() => { const c = t.d.querySelector("[id$='filters'] [aria-current]"); return c && /^Common subject in doubt \(4\)$/.test(txt(c)); });
    const before = t.d.querySelector("[id$='filters'] [aria-current]");
    check("(12) a not-sure card stays in doubt: 4 local courses", before && /\(4\)$/.test(txt(before)), before && txt(before));
    await openPanel(t, "Tool and Equipment Applications", /Why its common subject is in doubt/);
    rule(t, "keep", "Shop tools are taught for the trade.", false);
    await until(() => t.writes.length >= 2);
    await until(() => { const c = t.d.querySelector("[id$='filters'] [aria-current]"); return c && /\(3\)$/.test(txt(c)); });
    const after = t.d.querySelector("[id$='filters'] [aria-current]");
    check("(12) ⭐ a changed ruling moves the in-doubt count with its rows: 4 becomes 3", after && /^Common subject in doubt \(3\)$/.test(txt(after)), after && txt(after));
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

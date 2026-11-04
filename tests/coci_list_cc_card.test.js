// The common course's card and its edits in the Courses List's panel (coci_lookup.js ccCard).
//
// Carried from the Common Course Reference tab (unified_courses.js) before it retires into this List (SkyJujube,
// 2026-11-04; Sam 2026-11-03: the List is each reference's one workspace). The tab's edits curators still used carry:
// Rename (kb_curation unified_title), Set the discipline (discipline), Confirm (the discipline as it stands; a merged
// course's confirmation stamps validated_at). Moving a course stays in SkyView, under the re-mint playbook.
//
// WHAT THIS GUARDS:
//   (1) a course's panel reads its common course from the reference's file, once, and shows it: name, discipline and
//       where it came from, credit, the units it joins, whether a person confirmed it;
//   (2) signed out: no edit words, a sign-in fold that returns to this tab;
//   (3) ⭐ signed in: each edit writes the row the tab wrote, under the reviewer's own token and email, and says so;
//   (4) a merged course's confirmation stamps its rows; an official C-ID or CCN course keeps its authority's title;
//   (5) a refused save says so with the server's answer; a save since the file was built is shown as said;
//   (6) the file failing says which file; and the carry writes only the two fields named above.
//
// Run from repo root: `npm test` (or `node tests/coci_list_cc_card.test.js`).
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
    id_system: "C-ID", locked: true, flags: { reviewed: true }, reviewed_by: "curator@rccd.edu", reviewed_at: "2026-09-01" }] };

function tab(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div class="main-container"><div id="coci-lookup-root">Loading…</div></div></body></html>',
    { url: "https://example.org/#coci-lookup", runScripts: "dangerously" });
  const w = dom.window, calls = [], writes = [], reads = [];
  w.CPL_COCI_LOOKUP = JSON.parse(JSON.stringify(LOOKUP));
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    if (/kb_curation/.test(url) && init.method) {
      writes.push({ url: url, method: init.method, headers: init.headers || {}, body: JSON.parse(init.body || "null") });
      return Promise.resolve({ ok: !opts.refuse, status: opts.refuse || 201, json: () => Promise.resolve(null) });
    }
    if (/kb_curation/.test(url)) {
      reads.push(url);
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(opts.live || []))) });
    }
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  };
  w.CPL_TABS = { loadScript: function (s, name, cb) {
    calls.push(s);
    if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = LIST_SRC; w.document.body.appendChild(e); }
    if (s === "unified_courses_members.js") w.CPL_UC_MEMBERS = JSON.parse(JSON.stringify(MEMBERS));
    if (s === "unified_courses_data.js" && !opts.noFile) w.CPL_UNIFIED_COURSES = JSON.parse(JSON.stringify(UC));
    setTimeout(cb, 0);
  } };
  const sess = opts.signedIn ? { email: "reviewer@rccd.edu", access_token: "tok.en.x" } : null;
  w.CPL_SESSION = { get: () => sess, isFresh: () => !!sess, ensureFresh: () => Promise.resolve(sess) };
  w.__mounts = [];
  w.CPL_REVIEWER_SIGNIN = { mountInto: function (m, o) { w.__mounts.push(o); m.appendChild(w.document.createElement("form")); } };
  const e = w.document.createElement("script"); e.textContent = SRC; w.document.body.appendChild(e);
  w.CPL_COCI_LOOKUP_TAB.activate();
  return { w, d: w.document, calls, writes, reads };
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

(async () => {
  // ── (1) the card ──
  {
    const t = tab();
    await openPanel(t, "College Composition", /Confidence/);
    const p = txt(panel(t.d));
    check("(1) ⭐ the panel names the common course as the reference holds it", /Its common course: ENGL M1001\s*College Composition/.test(p), p.slice(0, 300));
    check("(1) its discipline and where it came from", /English, from its subject code/.test(p));
    check("(1) the units it joins", /3 to 4 units/.test(p));
    check("(1) whether a person confirmed it", /Not confirmed by a person/.test(p));
    check("(1) SkyView stays one word away", !!Array.from(panel(t.d).querySelectorAll("a")).find((a) => /Open ENGL M1001 in SkyView/.test(txt(a))));
    await openPanel(t, "Freshman Composition", /Freshman Composition/);
    await openPanel(t, "Tool and Equipment Applications", /Confidence/);
    check("(1) the reference's file is read once across panels", t.calls.filter((s) => s === "unified_courses_data.js").length === 1, t.calls.join(","));
    check("(1) a TOP-sourced discipline says it waits on a second signal", /from its TOP code, a last-in-line signal/.test(txt(panel(t.d))));
    // ── (2) signed out ──
    check("(2) ⭐ signed out, no edit words", !pword(t.d, /^Rename$|discipline$|^Confirm /));
    const fold = Array.from(panel(t.d).querySelectorAll("details")).find((x) => /sign in to rename it/.test(txt(x.querySelector("summary"))));
    check("(2) a sign-in fold says what signing in allows", !!fold);
    if (fold) { fold.open = true; fold.dispatchEvent(new t.w.Event("toggle")); }
    const kids = Array.from(panel(t.d).querySelector("." + P + "pbody").children);
    const iDrawer = kids.findIndex((k) => k.classList.contains(P + "pdrawer")), iWrap = kids.findIndex((k) => k.classList.contains("ccl-cc-signin-wrap"));
    check("(2) the sign-in fold never pulls the Title drawer into the common course", iWrap >= 0 && iDrawer > iWrap, iWrap + " " + iDrawer);
    check("(2) it returns to this tab", t.w.__mounts.length === 1 && t.w.__mounts[0].returnTab === "coci-lookup", JSON.stringify(t.w.__mounts));
  }

  // ── (3) signed in: rename, discipline, confirm ──
  {
    const t = tab({ signedIn: true });
    await openPanel(t, "College Composition", /Confidence/);
    pword(t.d, /^Rename$/).click(); await until(() => t.d.getElementById("ccl-cc-name-in"));
    const inp = t.d.getElementById("ccl-cc-name-in");
    check("(3) Rename opens the name, filled", inp && inp.value === "College Composition");
    inp.value = "Composition I";
    pword(t.d, /^Save the name$/).click(); await until(() => /Renamed/.test(txt(panel(t.d))));
    const w1 = t.writes[0] || {};
    check("(3) ⭐ Rename writes unified_title for the common course",
      w1.method === "POST" && w1.body && w1.body.course_id === "ENGL M1001" && w1.body.field === "unified_title" && w1.body.value === "Composition I", JSON.stringify(w1));
    check("(3) …under the reviewer's own email and token", w1.body && w1.body.reviewer_email === "reviewer@rccd.edu" && w1.headers.Authorization === "Bearer tok.en.x");
    check("(3) …as an upsert, the tab's Prefer", /resolution=merge-duplicates/.test(w1.headers.Prefer || ""));
    check("(3) the card shows the new name and says the sync folds it in", /Composition I/.test(txt(panel(t.d))) && /daily sync folds it into the reference/.test(txt(panel(t.d))));
    pword(t.d, /^Change the discipline$/).click(); await until(() => t.d.getElementById("ccl-cc-disc-in"));
    const sel = t.d.getElementById("ccl-cc-disc-in");
    check("(3) the discipline choices are the MQ disciplines", sel && Array.from(sel.options).map((o) => o.value).filter(Boolean).join("|") === "Construction|English|Welding");
    sel.value = "Construction";
    pword(t.d, /^Save the discipline$/).click(); await until(() => t.writes.length === 2 && /Set the discipline/.test(txt(panel(t.d))));
    const w2 = t.writes[1] || {};
    check("(3) ⭐ Set the discipline writes discipline", w2.body && w2.body.field === "discipline" && w2.body.value === "Construction", JSON.stringify(w2.body));
    check("(3) a saved discipline reads as confirmed by the reviewer", /Confirmed by reviewer@rccd\.edu/.test(txt(panel(t.d))));
    check("(3) …so Confirm leaves", !pword(t.d, /^Confirm /));
  }
  {
    const t = tab({ signedIn: true });
    await openPanel(t, "College Composition", /Confidence/);
    const c = pword(t.d, /^Confirm English$/);
    check("(3) Confirm names the discipline it confirms", !!c && c.getAttribute("aria-label") === "Confirm English as the discipline of ENGL M1001");
    c.click(); await until(() => t.writes.length === 1 && /Confirmed English/.test(txt(panel(t.d))));
    const w3 = t.writes[0] || {};
    check("(3) ⭐ Confirm writes the discipline as it stands", w3.method === "POST" && w3.body.field === "discipline" && w3.body.value === "English");
  }

  // ── (4) merged and official ──
  {
    const t = tab({ signedIn: true });
    await openPanel(t, "Tool and Equipment Applications", /Confidence/);
    pword(t.d, /^Confirm Construction$/).click(); await until(() => t.writes.length === 1);
    const w4 = t.writes[0] || {};
    check("(4) ⭐ a merged course's confirmation stamps its rows", w4.method === "PATCH" && /course_id=eq\.CNST%20M1009/.test(w4.url)
      && w4.body.validated_by === "reviewer@rccd.edu" && !!w4.body.validated_at, JSON.stringify(w4));
    await openPanel(t, "Welding I", /Confidence/);
    check("(4) an official C-ID course keeps its authority's title", !pword(t.d, /^Rename$/) && /An official C-ID course keeps its authority's title/.test(txt(panel(t.d))));
    check("(4) a confirmed course offers no Confirm", !pword(t.d, /^Confirm /) && /Confirmed by curator@rccd\.edu on 2026-09-01/.test(txt(panel(t.d))));
  }

  // ── (5) refused, and saved since the file ──
  {
    const t = tab({ signedIn: true, refuse: 403 });
    await openPanel(t, "College Composition", /Confidence/);
    pword(t.d, /^Confirm English$/).click(); await until(() => /Not saved/.test(txt(panel(t.d))));
    check("(5) ⭐ a refused save says so, with the server's answer", /Not saved: the server answered 403/.test(txt(panel(t.d))));
    check("(5) …and the card still reads unconfirmed", /Not confirmed by a person/.test(txt(panel(t.d))));
  }
  {
    const t = tab({ live: [{ field: "unified_title", value: "Composition One", reviewer_email: "x@rccd.edu", reviewed_at: "2026-11-04" }] });
    await openPanel(t, "College Composition", /Saved in COBI/);
    check("(5) a save since the file was built shows as said", /Saved in COBI since this file was built: the name Composition One/.test(txt(panel(t.d))));
    check("(5) one read of the live rows per common course", t.reads.length === 1 && /course_id=eq\.ENGL%20M1001/.test(t.reads[0]), t.reads.join(" "));
  }

  // ── (6) the file fails; the fields written ──
  {
    const t = tab({ noFile: true });
    await openPanel(t, "College Composition", /did not arrive/);
    check("(6) a missing file names itself", /unified_courses_data\.js\) did not arrive/.test(txt(panel(t.d))));
  }
  {
    const fields = (SRC.match(/field = kind === "rename" \? "unified_title" : "discipline"/) || []).length;
    check("(6) ⭐ the carry writes two fields, unified_title and discipline", fields === 1 && !/"merge_note"|"description", value|anchor_discipline_proposal|merge_dismissed/.test(SRC));
  }

  let pass = 0;
  for (const [n, ok, why] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : "")); if (ok) pass++; }
  console.log("\ncoci_list_cc_card: " + pass + "/" + results.length + " passed");
  process.exit(pass === results.length ? 0 : 1);
})();

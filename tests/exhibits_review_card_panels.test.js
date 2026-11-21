// The Exhibits Review card's chips, two panels and in-place details (Sam, 2026-11-21, in session), on the card he
// named: MAPICI-CFBF-1-001, "Cal Fire Basic Firefighter (219 hour) Training", as kb/_build_exhibits_review.py wrote it.
//   (1) chips open every Review card: Cert-based or Course-based (the course_title_fits rule, read from the MAP id),
//       Statewide when a statewide exhibit carries the title, CPL-AI recommendation when the join file names one;
//   (2) one plain line names the course title set aside under the November 12 industry certification rule, and the
//       Same subject figure says the colleges teach the course;
//   (3) two panels show together, Course details (the related course titles) and Exhibits (the related exhibit
//       titles with colleges, issuer and statewide status), with no switch between them;
//   (4) a title in either panel is a button that opens its details under its own row, the card and its boxes
//       untouched, and Use this title stays;
//   (5) Exhibits lifts the 1400px page cap in its own CSS;
//   (6) the canonical title is a box that wraps: a textarea that takes no line break;
//   (7) Side by side opens expanded, and a card a person closed stays closed;
//   (8) Possible duplicate: CDF and CAL FIRE are one agency, flagged in words on the card and on the Exhibits row,
//       with no checkbox checked and no write. The matcher's self-recall runs over the shipped reference titles.
// Also: no "fold" in the words the two panels draw, no label opening with What, When, How or Why.
// Run from repo root: `node tests/exhibits_review_card_panels.test.js` (or `npm test`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }
// A details box read as "term value term value".
function ftxt(box) { return Array.from(box.querySelectorAll("dt, dd, p")).map(txt).join(" "); }
const src = fs.readFileSync("exhibits.js", "utf8");

const CFBF = { raw: "Cal Fire Basic Firefighter (219 hour) Training", step: "Proposed", why: "the classifier is unsure (0.80)", colleges: [0],
  title: "CAL FIRE Basic Firefighter Training (219-hour)", issuer: "California Department of Forestry and Fire Protection (CAL FIRE)",
  from: "the classifier", ids: ["MAPICI-CFBF-1-001"], art: [0], could: [1], basis: "M-ID FIRE M1297", same: true,
  local_courses: [[0, "F SC 55", "Wildland Fire Control", 3, "CCC000378240", "3 hours in Wildland Fire Control", "A critical study of wildland fire line safety, fire behavior, fire prevention and fire extinguishment methods."]],
  subject: "Fire Technology", subject_course: 0, needs_official_name: true,
  course_title_set_aside: { title: "Wildland Fire Control", basis: "M-ID FIRE M1297", why: "industry certification, not credit by exam" },
  course: "F SC 55", course_college: "City College of San Francisco", under: [], under_count: 0 };
const CBE = { raw: "Credit by Exam HIST 1001", step: "Proposed", why: "x", colleges: [1], title: "United States History Since 1877", issuer: "California Community Colleges",
  from: "the course", ids: ["MAPCXH-HIST-1-001"], art: [1], could: [], local_courses: [[1, "HIST 12", "United States History Since 1877", 3, "CCC000111111", "3 hours in History", ""]],
  under: [], under_count: 0, exists: true };
const SW = { raw: "Fire Fighter I", step: "Proposed", why: "x", colleges: [1], title: "Firefighter 1", issuer: "California State Fire Training (SFT)",
  from: "the classifier", ids: ["MAPICI-FF1C-1-001"], art: [1], could: [], local_courses: [], under: [], under_count: 0, exists: true };
function review(held) {
  return { schema: 1, written_at: "2026-11-21T07:00:00Z", sources: { procedures_run: "2026-11-21T07:47:00Z" },
    tiles: { names: { n: 10, of: 12, waiting: 2 }, aligned: { n: 0, of: 2 }, saved_not_folded: 0 }, steps: {},
    colleges: ["City College of San Francisco", "Cabrillo College"], held: held };
}
const RELATED = { schema: 1, generated_at: "2026-11-21T07:55:00Z",
  issuers: ["California Department of Forestry and Fire Protection (CAL FIRE)", "California State Fire Training (SFT)"],
  paths: { ic: { words: "industry certification", assessed_by: "issuer" } },
  titles: [["CAL FIRE Basic Firefighter Training (219-hour)", 0, 0, 0, 1], ["CAL FIRE Ethical Leadership in the Classroom", 0, 1, 1, 0, [], [["ic", 1]]],
    ["Fire CDF Academy", 0, 1, 1, 0, [], [["ic", 1]]], ["Firefighter 1", 1, 12, 20, 0, [], [["ic", 13]]]], pending: {}, batches: [], families: {} };
const SUBJECTS = { schema: 1, subjects: { "Fire Technology": { disc: "Fire Technology", total: 2,
  rows: [["FIRE M1297", "Wildland Fire Control", 17, 3, 4.5, "M-ID"], ["FIRE 100 X", "Fire Protection Organization", 40, 3, 3, "C-ID"]] } } };
const CPLAI = { by_exhibit: { "Firefighter 1": [{ code: "ff1", title: "Fire Fighter 1", kind: "same", pairs: 12, strong_colleges: 3 }] } };
const STATEWIDE = { exhibits: [
  { exhibit_id: "MAPICI-CWFA-1-001", exhibit_ids: ["MAPICI-CWFA-1-001"], title: "Fire CDF Academy", unified_title: "Fire CDF Academy", adopter_names: ["Cabrillo College"],
    credit_recs: [{ course: "FT 192", credit: "2.25 hours in CDF Wildland Firefighter 1 Academy" }], adopter_rec_idx: { "Cabrillo College": [0] },
    exhibit_records: [{ id: "MAPICI-CWFA-1-001", title: "CDF Wildland Fire Academy" }], peer_units_median: 2.25 }] };
const MEMBERS = { colleges: ["City College of San Francisco", "Cabrillo College"], topmap: { "2133.00": "Fire Technology" },
  members: { "FIRE M1297": [{ c: 0, n: "F SC 55", t: "Wildland Fire Control", u: 3, p: "2133.00", cn: "CCC000378240" }, { c: 1, n: "FT 192", t: "Wildland Fire Control", u: 3, p: "2133.00", cn: "CCC000294189" }] } };

function load(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/#exhibits", runScripts: "dangerously" });
  const w = dom.window, calls = [], loaded = [];
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    calls.push({ url: url, method: init.method || "GET" });
    function ok(obj) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(obj))); } }); }
    function bad(st) { return Promise.resolve({ ok: false, status: st, json: function () { return Promise.resolve({}); } }); }
    if (url === "kb/exhibits_review.json") return ok(review(opts.held || [CFBF, CBE, SW]));
    if (url === "kb/exhibits_related.json") return ok(RELATED);
    if (url === "kb/exhibits_review_subjects.json") return ok(SUBJECTS);
    if (url === "kb/cpl_ai/exhibit_join.json") return ok(CPLAI);
    if (/\/rest\/v1\/kb_curation\?select=/.test(url)) return ok([]);
    return bad(404);
  };
  w.CPL_STATEWIDE_RECS = { "Firefighter 1": [{ t: "3 hours in Fire Protection Organization", id: "MAPICI-FF1C-1-001" }] };
  w.CPL_TABS = { loadScript: function (file, global, cb) {
    loaded.push(file);
    if (file === "statewide_data.js") w.CPL_STATEWIDE = STATEWIDE;
    if (file === "unified_courses_members.js" && !(opts.failMembers && opts.failMembers-- > 0)) w.CPL_UC_MEMBERS = MEMBERS;
    if (/^coci_lookup_desc_/.test(file)) { w.CPL_COCI_DESC = w.CPL_COCI_DESC || {}; w.CPL_COCI_DESC.F = { CCC000378240: "Wildland fire line safety and behavior." }; }
    setTimeout(cb, 0);
  } };
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve({ access_token: "a.b.c", email: "reviewer@example.org" }); },
    authHeaders: function () { return { apikey: "anon-key", Authorization: "Bearer anon-key" }; } };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS, calls: calls, loaded: loaded };
}
function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
async function settle() { for (let i = 0; i < 12; i++) await tick(); }
function aside(d, name) { return Array.from(d.querySelectorAll("aside")).find(function (a) {
  return a.getAttribute("aria-label") === name || txt(d.getElementById(a.getAttribute("aria-labelledby") || "-")) === name; }); }
function byText(root, sel, re) { return Array.from(root.querySelectorAll(sel)).find(function (b) { return re.test(txt(b)); }); }
function writes(t) { return t.calls.filter(function (c) { return c.method !== "GET" && !/\/rest\/v1\/rpc\/exhibit_title_students$/.test(c.url); }); }
function chipsOf(d) { return Array.from(d.querySelectorAll(".exh-card .exh-chiprow .exh-chip")).filter(function (c) { return !c.hidden; }).map(txt); }

(async function () {
  const t = load();
  await t.M.boot(); await settle();
  const d = t.d;
  const title = d.getElementById("exh-title");
  check("the card under test is MAPICI-CFBF-1-001", title && title.value === CFBF.title);

  // (1) chips
  let chips = chipsOf(d);
  check("(1) the card opens with the Cert-based chip, ahead of the CER step", chips[0] === "Cert-based" && /^CER step:/.test(chips[chips.length - 1]), chips.join(" | "));
  check("(1) the basis chip says the CPL type and which panel to read first",
    /CPL type: industry certification\./.test(d.getElementById("exh-chip-basis").getAttribute("aria-label"))
    && /Read the Exhibits panel first\./.test(d.getElementById("exh-chip-basis").getAttribute("aria-label")));
  check("(1) no Statewide or CPL-AI chip where neither holds", chips.indexOf("Statewide") < 0 && chips.indexOf("CPL-AI recommendation") < 0, chips.join(" | "));
  check("(1) the CPL-AI join file is read for the card", t.calls.some(function (c) { return c.url === "kb/cpl_ai/exhibit_join.json"; }));

  // (2) the set-aside line and the relabel
  const sa = d.getElementById("exh-set-aside");
  check("(2) one line names the course title set aside and the November 12 rule", sa && sa.tagName === "P"
    && /^Course title set aside: Wildland Fire Control \(M-ID FIRE M1297\)\./.test(txt(sa)) && /industry certification rule of November 12/.test(txt(sa)), txt(sa));
  const course = aside(d, "Course details"), exhibits = aside(d, "Exhibits");
  const ssT = course && Array.from(course.querySelectorAll(".exh-ss-list .exh-ss-t")).map(txt);
  check("(2) the Same subject figure says the colleges teach the course",
    ssT && ssT[0] === "Wildland Fire Control (M-ID FIRE M1297) (17 colleges teach the course)" && !/\(\d+ colleges?\)/.test(txt(course)), ssT && ssT.join(" | "));

  // (3) two panels, together, no switch
  check("(3) Course details and Exhibits both show beside the card", !!course && !!exhibits && course.parentNode === exhibits.parentNode
    && course.parentNode.className === "exh-side" && /exh-two/.test(course.parentNode.parentNode.className));
  check("(3) no control switches one panel for the other", !d.getElementById("exh-cd-btn") && !byText(d, ".exh-card button", /^Course details$/)
    && !byText(d, "button", /^Close$/) && !aside(d, "Related titles"));
  check("(3) Course details holds the card's course and the related course titles", /Wildland Fire Control/.test(txt(course.querySelector(".exh-cd-course")))
    && !!course.querySelector("section.exh-ss") && !exhibits.querySelector("section.exh-ss"));
  const cdfRow = Array.from(exhibits.querySelectorAll(".exh-rel-list li")).find(function (li) { return /^Fire CDF Academy/.test(txt(li)); });
  check("(3) an Exhibits row names its colleges, issuer and statewide status", cdfRow
    && /California Department of Forestry and Fire Protection \(CAL FIRE\) · 1 college articulates it · 1 local title · In the reference · Not statewide/.test(txt(cdfRow)), txt(cdfRow));

  // (8) possible duplicate, on the card and on the row; a flag only
  const dup = d.getElementById("exh-dup");
  check("(8) the card flags Fire CDF Academy as a possible duplicate, in words", dup && !dup.hidden
    && txt(dup) === "Possible duplicate of Fire CDF Academy: CAL FIRE and CDF are one agency. A flag only; nothing is merged.", txt(dup));
  check("(8) the Exhibits row carries the same flag", cdfRow && /Possible duplicate: CAL FIRE and CDF are one agency\./.test(txt(cdfRow.querySelector(".exh-rel-dup"))));
  check("(8) another CAL FIRE title written the same way is not flagged",
    !/Possible duplicate/.test(txt(Array.from(exhibits.querySelectorAll(".exh-rel-list li")).find(function (li) { return /^CAL FIRE Ethical/.test(txt(li)); }))));
  check("(8) the flag checks no box and writes nothing", !Array.from(exhibits.querySelectorAll("input[type=checkbox]")).some(function (c) { return c.checked; })
    && writes(t).length === 0);

  // (4) a title opens its details in place
  const before = t.loaded.slice();
  check("(4) nothing reads the large files before a title is opened", !before.some(function (f) { return /statewide_data|unified_courses_members/.test(f); }));
  title.value = CFBF.title + " "; title.dispatchEvent(new t.w.Event("input"));   // a typed edit that must outlive the details
  let btn = byText(exhibits, "button.exh-det-t", /^Fire CDF Academy$/);
  check("(4) an exhibit title is a button, closed", btn && btn.getAttribute("aria-expanded") === "false");
  btn.click(); await settle();
  btn = byText(aside(d, "Exhibits"), "button.exh-det-t", /^Fire CDF Academy$/);
  let box = btn && d.getElementById(btn.getAttribute("aria-controls"));
  check("(4) its details open under its row: colleges, issuer, statewide status, units, credit recommendations, exhibits",
    btn && btn.getAttribute("aria-expanded") === "true" && box && btn.closest("li").contains(box)
    && /Colleges 1: Cabrillo College/.test(ftxt(box)) && /Statewide Not statewide/.test(ftxt(box)) && /2\.25 units at the median/.test(ftxt(box))
    && /Credit recommendations 1 on 1 course: 2\.25 hours in CDF Wildland Firefighter 1 Academy/.test(ftxt(box))
    && /Exhibits CDF Wildland Fire Academy, MAPICI-CWFA-1-001/.test(ftxt(box)), ftxt(box));
  check("(4) the card stays: the same title box, the typed edit kept, focus on the title's button",
    d.getElementById("exh-title") === title && title.value === CFBF.title + " " && d.activeElement === btn,
    [d.getElementById("exh-title") === title, JSON.stringify(title.value), d.activeElement && d.activeElement.tagName + "#" + d.activeElement.id].join(" "));
  check("(4) Use this title stays beside the title", !!byText(btn.closest("li"), "button", /^Use this title$/));
  let cbtn = byText(aside(d, "Course details"), "button.exh-det-t", /^Wildland Fire Control \(M-ID FIRE M1297\)/);
  cbtn.click(); await settle();
  cbtn = byText(aside(d, "Course details"), "button.exh-det-t", /^Wildland Fire Control \(M-ID FIRE M1297\)/);
  box = d.getElementById(cbtn.getAttribute("aria-controls"));
  check("(4) a course title opens its colleges, units, COCI description, credit recommendations and exhibits",
    box && /Colleges 2: City College of San Francisco \(F SC 55\); Cabrillo College \(FT 192\)/.test(ftxt(box)) && /Units 3 to 4\.5/.test(ftxt(box))
    && /COCI description Wildland fire line safety and behavior\. \(City College of San Francisco, F SC 55\)/.test(ftxt(box))
    && /Credit recommendations 2\.25 hours in CDF Wildland Firefighter 1 Academy/.test(ftxt(box)) && /Exhibits Fire CDF Academy \(MAPICI-CWFA-1-001\)/.test(ftxt(box)), ftxt(box));
  let lbtn = byText(aside(d, "Course details"), ".exh-cd-course button.exh-det-t", /^Wildland Fire Control$/);
  lbtn.click(); await settle();
  lbtn = byText(aside(d, "Course details"), ".exh-cd-course button.exh-det-t", /^Wildland Fire Control$/);
  box = d.getElementById(lbtn.getAttribute("aria-controls"));
  check("(4) the card's own course opens its TOP code, M-ID and control number", box && /TOP 2133\.00, Fire Technology/.test(ftxt(box))
    && /M-ID FIRE M1297/.test(ftxt(box)) && /Control number CCC000378240/.test(ftxt(box)), ftxt(box));
  lbtn.click(); await settle();
  check("(4) pressing the title again closes its details",
    byText(aside(d, "Course details"), ".exh-cd-course button.exh-det-t", /^Wildland Fire Control$/).getAttribute("aria-expanded") === "false");
  check("(4) opening details wrote nothing", writes(t).length === 0);

  // (5) full width, (6) the title box
  check("(5) Exhibits lifts the page's 1400px cap in its own CSS", /#tab-exhibits \.main-container \{ max-width:none;/.test(src));
  check("(6) the canonical title is a textarea of one row that wraps", title.tagName === "TEXTAREA" && title.getAttribute("rows") === "1"
    && /textarea\.exh-edit \{[^}]*resize:none;[^}]*overflow-wrap:anywhere;/.test(src));
  title.value = "CAL FIRE Basic\nFirefighter"; title.dispatchEvent(new t.w.Event("input"));
  check("(6) a pasted line break becomes a space", title.value === "CAL FIRE Basic Firefighter", JSON.stringify(title.value));
  const ev = new t.w.KeyboardEvent("keydown", { key: "Enter", cancelable: true, bubbles: true });
  title.dispatchEvent(ev);
  check("(6) Enter adds no line", ev.defaultPrevented);

  // (7) side by side
  let sbs = d.getElementById("exh-sbs");
  check("(7) Side by side opens expanded", sbs && sbs.open);
  sbs.open = false; sbs.dispatchEvent(new t.w.Event("toggle")); await settle();
  title.dispatchEvent(new t.w.Event("input"));
  byText(d, ".exh-card button", /^Teach a rule$/).click(); await settle();   // a redraw of the same card
  check("(7) a card a person closed stays closed for the visit", d.getElementById("exh-sbs") && !d.getElementById("exh-sbs").open);

  // (1) the other chips, on the cards where they hold
  const t2 = load({ held: [SW, CBE] });
  await t2.M.boot(); await settle();
  chips = chipsOf(t2.d);
  check("(1) a statewide title with a CPL-AI recommendation carries both chips", chips.join(" | ") === "Cert-based | Statewide | CPL-AI recommendation | CER step: Proposed", chips.join(" | "));
  check("(1) the CPL-AI chip says what it found", /Fire Fighter 1: 12 pairs, 3 colleges hold a Strong evidence course\./.test(t2.d.getElementById("exh-chip-cai").getAttribute("aria-label")));
  const tt = t2.d.getElementById("exh-title");
  tt.value = "Firefighter 9"; tt.dispatchEvent(new t2.w.Event("input"));
  check("(1) the chips follow the title as it is edited", chipsOf(t2.d).join(" | ") === "Cert-based | CER step: Proposed", chipsOf(t2.d).join(" | "));
  const t3 = load({ held: [CBE] });
  await t3.M.boot(); await settle();
  check("(1) a single credit by exam course is Course-based, and reads the Course details panel first", chipsOf(t3.d)[0] === "Course-based"
    && /Read the Course details panel first\./.test(t3.d.getElementById("exh-chip-basis").getAttribute("aria-label")) && !t3.d.getElementById("exh-set-aside"));

  // the matcher's self-recall, on pairs whose answer is held
  const P = t.M._possibleDuplicate;
  const yes = [["CAL FIRE Basic Firefighter Training (219-hour)", "Fire CDF Academy"], ["CDF Wildland Fire Academy", "Cal Fire Wildland Fire Academy"],
    ["California Department of Forestry Fire Academy", "CDF Fire Academy"]];
  const no = [["CAL FIRE Basic Firefighter Training (219-hour)", "CAL FIRE Ethical Leadership in the Classroom"], ["Firefighter 1", "Fire CDF Academy"],
    ["Firefighter 1", "Firefighter 1A"], ["CDFA Pesticide Applicator", "CAL FIRE Basic Firefighter Training (219-hour)"], ["Fire CDF Academy", "Fire CDF Academy"]];
  // Two programs of one agency under two of its names are left alone (COBIx on #3643).
  no.push(["Fire CDF Academy", "CAL FIRE Ethical Leadership in the Classroom"], ["CDF Firefighter I", "CAL FIRE Company Officer"]);
  const right = yes.filter(function (p) { return P(p[0], p[1]); }).length + no.filter(function (p) { return !P(p[0], p[1]); }).length;
  check("(8) self-recall: " + right + " of " + (yes.length + no.length) + " held pairs read right", right === yes.length + no.length);
  // On the shipped reference: every flagged pair names one agency two ways, and Sam's example is among them.
  const REL = JSON.parse(fs.readFileSync("kb/exhibits_related.json", "utf8")).titles.map(function (r) { return r[0]; });
  let flagged = [];
  for (let i = 0; i < REL.length; i++) if (/CDF|Cal\s?Fire|Department of Forestry/i.test(REL[i]))
    for (let j = 0; j < REL.length; j++) if (j !== i && P(REL[i], REL[j])) flagged.push(REL[i] + " ~ " + REL[j]);
  check("(8) on the shipped titles the matcher flags Sam's pair and stays small (" + flagged.length + " ordered pairs)",
    flagged.indexOf("CAL FIRE Basic Firefighter Training (219-hour) ~ Fire CDF Academy") >= 0 && flagged.length <= 12, flagged.join(" || "));

  check("(8) on the shipped titles the CDF title and the CAL FIRE leadership course are not a pair",
    flagged.indexOf("Fire CDF Academy ~ CAL FIRE Ethical Leadership in the Classroom") < 0 && flagged.length === 2, flagged.join(" || "));

  // (1) each chip that carries a label has a role, so a screen reader reads the label (COBIx on #3643)
  const labeled = Array.from(d.querySelectorAll(".exh-chip[aria-label], .exh-chip[tabindex]"));
  check("(1) every chip a person can reach is a note", labeled.length >= 2 && labeled.every(function (c) { return c.getAttribute("role") === "note"; }),
    labeled.filter(function (c) { return c.getAttribute("role") !== "note"; }).map(txt).join(" | "));

  // (4) a read that failed is tried again when a person opens a title, and a draw alone never retries (COBIx on #3643)
  const tf = load({ failMembers: 1 });
  await tf.M.boot(); await settle();
  const fEx = function () { return aside(tf.d, "Exhibits"); };
  const reads = function () { return tf.loaded.filter(function (f) { return f === "unified_courses_members.js"; }).length; };
  byText(fEx(), "button.exh-det-t", /^Fire CDF Academy$/).click(); await settle();
  const n1 = reads();
  check("(4) a failed read says so in the details", /Part of the data could not be read/.test(txt(fEx())) && n1 >= 1, txt(fEx()).slice(0, 300));
  byText(tf.d, ".exh-card button", /^Teach a rule$/).click(); await settle();
  check("(4) a redraw alone does not read again", reads() === n1);
  byText(fEx(), "button.exh-det-t", /^Fire CDF Academy$/).click(); await settle();   // closes
  byText(fEx(), "button.exh-det-t", /^Fire CDF Academy$/).click(); await settle();   // opens: the retry
  check("(4) opening a title again reads the file again, and the details are whole", reads() === n1 + 1
    && !/Part of the data could not be read/.test(txt(fEx())), reads() + " reads; " + txt(fEx()).slice(0, 300));

  // words
  const panelWords = txt(aside(d, "Course details")) + " " + txt(aside(d, "Exhibits"));
  check("no 'fold' in the words the two panels draw", !/\bfold/i.test(panelWords), (panelWords.match(/.{30}\bfold.{30}/i) || [""])[0]);
  const labels = Array.from(d.querySelectorAll(".exh-with-rel h4, .exh-with-rel h5, .exh-with-rel button, .exh-with-rel label, .exh-with-rel summary, .exh-with-rel .exh-chip, .exh-with-rel dt")).map(txt);
  check("no label opens with What, When, How or Why", !labels.some(function (l) { return /^(What|When|How|Why)\b/.test(l); }),
    labels.filter(function (l) { return /^(What|When|How|Why)\b/.test(l); }).join(" | "));
  check("no raw hex in the new CSS", !/#[0-9a-fA-F]{3,8}\b/.test(src.slice(src.indexOf('"textarea.exh-edit {'), src.indexOf('".exh-inbox {'))));

  let failed = 0;
  results.forEach(function (r) { if (!r[1]) { failed++; console.log("FAIL " + r[0] + (r[2] ? "\n     " + r[2] : "")); } });
  console.log((results.length - failed) + "/" + results.length + " checks passed");
  process.exit(failed ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });

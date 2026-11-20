// Hand it over in place (Sam, 2026-11-20, on the locked Commons order mock: "yes, build it!"; cpl_memory
// r-hand-over-in-place-sam-2026-11-20). commons_handover.js: a course or a college opens beside the page, and a
// signed-in reviewer drops a file, gives a link to try, pastes the data or saves an API procedure.
//
// WHAT THIS GUARDS (each a way the hand-over could mislead a person or leak what it must keep):
//   (1) ⭐ a name with nowhere to act: every still-taught course in Needs you is a link at an address of its own
//       (#commons/course/<control number>) and every college there opens its own College Data Collection panel;
//   (2) the panel opens in place: the address follows with no page move, Previous and Next step through the courses,
//       Close and Escape put the address and the focus back where they were;
//   (3) ⭐ a hand-over with no name on it: signed out, the box offers the sign-in and no drop box, and nothing is sent;
//   (4) ⭐ the page naming the person: a file goes to the private store with the reviewer's own token, then one row
//       through rpc/commons_handover_add, and the page never sends who handed it over (the database stamps it);
//   (5) a file the store does not take, or one over 50 MB, is refused before any request;
//   (6) Try the link: a bad address sends nothing; a good one saves the row, asks the reader to look now, and reads the
//       reader's answer back (reads, or a bot check, in plain words); with the reader unreachable it says the link
//       waits for the nightly run, never that it was read;
//   (7) pasted data: nothing typed sends nothing; outcomes go one per line; in the panel a save steps to the next
//       course and carries the saved words;
//   (8) the API procedure box: no address sends nothing; Save sends the procedure under the right dataset, and no key
//       field exists anywhere in the box;
//   (9) the public counts read as words beside a college, and carry no person;
//  (10) College Data Collection: #collect/outlines-blocked/college/<slug>/handover opens the college's own panel on the
//       hand-over pane, the address round-trips, and each college on the to-do carries the word that opens it;
//  (11) a direct arrival at a course's address opens its panel, and the tab reports that address for a sign-in link;
//  (12) Term Reports Needed sits in Needs you with the same box under the term-reports dataset;
//  (13) the module's CSS holds no raw hex color.
//
// Run from repo root: `npm test` (or `node tests/commons_handover.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const HO_SRC = fs.readFileSync("commons_handover.js", "utf8");
const SCRIPTS = [fs.readFileSync("commons_progress.js", "utf8"), fs.readFileSync("commons_program_records.js", "utf8"), HO_SRC,
  fs.readFileSync("commons_front.js", "utf8"), fs.readFileSync("commons_data.js", "utf8"), fs.readFileSync("commons.js", "utf8")];
const FILES = {};
["kb/status/commons.json", "kb/status/program-requirements.json", "kb/status/commons_data.json", "kb/reference/industry_credential_skills.json"]
  .forEach((f) => { FILES[f] = JSON.parse(fs.readFileSync(f, "utf8")); });
const HUNT = FILES["kb/status/commons_data.json"].blocked_hunt;
const OPEN = HUNT.colleges.filter((c) => c.hunted && !c.filed);
const COURSES = [].concat(...OPEN.map((c) => c.still_taught.map((x) => Object.assign({ college: c.college, slug: c.slug }, x))));
const REVIEWER = { email: "reviewer@example.org", access_token: "reviewer-token", refresh_token: "r" };

// A page: the Commons tab, a fetch that answers the committed files and records every other call, and (optionally) a
// signed-in reviewer. `answers` maps a URL fragment to a function (call) -> { status, body }.
function load(hash, opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-commons"><div class="main-container"><div id="commons-root">Loading</div></div></div></body></html>',
    { url: "https://example.org/index.html" + (hash || "#commons"), runScripts: "dangerously", pretendToBeVisual: true });
  const w = dom.window, o = {}, calls = [];
  Object.defineProperty(w, "localStorage", { value: { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } }, configurable: true });
  const answers = Object.assign({}, opts.answers || {});
  const summary = opts.summary || [];
  let reported = null;
  w.CPL_SESSION = {
    get: () => (opts.signedIn ? REVIEWER : null), isFresh: () => true, ensureFresh: () => Promise.resolve(REVIEWER),
    authHeaders: (extra) => Object.assign({ apikey: "anon-key", Authorization: "Bearer " + (opts.signedIn ? REVIEWER.access_token : "anon-key") }, extra || {}),
    viewAddress: (tab, fn) => { if (tab === "commons") reported = fn; }
  };
  w.fetch = function (url, init) {
    url = String(url);
    if (FILES[url]) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(FILES[url]))) });
    const call = { url, method: (init && init.method) || "GET", headers: (init && init.headers) || {}, body: init && init.body };
    if (/supabase\.co/.test(url)) calls.push(call);
    if (/rpc\/commons_handover_summary/.test(url)) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(summary.slice()) });
    const hit = Object.keys(answers).filter((k) => url.indexOf(k) >= 0)[0];
    if (hit) { const r = answers[hit](call); return Promise.resolve({ ok: r.status < 300, status: r.status, json: () => Promise.resolve(r.body) }); }
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
  };
  SCRIPTS.forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  w.CPL_HANDOVER.POLL.every = 0;
  return { w, d: w.document, M: w.CPL_COMMONS, H: w.CPL_HANDOVER, calls, address: () => (reported ? reported() : null),
    writes: () => calls.filter((c) => !/commons_handover_summary/.test(c.url) && /commons_handover|storage\/v1|functions\/v1\/handover/.test(c.url)) };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle(n) { for (let i = 0; i < (n || 30); i++) await tick(); }
function press(w, el) { el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true })); }
function submit(w, form) { form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true })); }
function choose(w, input, file) { Object.defineProperty(input, "files", { value: [file], configurable: true }); input.dispatchEvent(new w.Event("change", { bubbles: true })); }
const ADDED = { "rpc/commons_handover_add": () => ({ status: 200, body: { id: "11111111-2222-3333-4444-555555555555", status: "waiting" } }) };
const STORED = { "storage/v1/object/commons-handover": () => ({ status: 200, body: { Key: "ok" } }) };

(async function () {
  // ── (1) every name is a place to act ──
  let x = load("#commons");
  await x.M.boot(); await settle();
  const rows = x.d.querySelector("#cmf-need-rows");
  const links = Array.from(rows.querySelectorAll("a[data-course]"));
  check("(1) ⭐ every still-taught course in Needs you is a link", links.length === COURSES.length && COURSES.length > 0, links.length + " links for " + COURSES.length + " courses");
  check("(1) each course's address is its own control number",
    links.every((l, i) => l.getAttribute("href") === "#commons/course/" + COURSES[i].control_number && txt(l) === COURSES[i].course), links.map((l) => l.getAttribute("href")).join(" "));
  const collegeLinks = Array.from(rows.querySelectorAll("a[data-college-panel]"));
  check("(1) ⭐ every college there opens its own College Data Collection panel at the hand-over",
    collegeLinks.length === OPEN.length && collegeLinks.every((l) => /^#collect\/outlines-blocked\/college\/[a-z0-9-]+\/handover$/.test(l.getAttribute("href"))),
    collegeLinks.map((l) => l.getAttribute("href")).join(" "));
  check("(1) the line still reads as it did: the college, then its courses",
    OPEN.every((c) => txt(rows.querySelector('li[data-hunt-college="' + c.slug + '"] p')) === c.college + ": " + c.still_taught.map((s) => s.course).join(", ") + "."),
    txt(rows.querySelector("li[data-hunt-college] p")));
  check("(1) the other route stays, word for word", txt(rows).includes("Send the PDF to COBIx in your Grok Bot chat."));

  // ── (2) the panel opens in place ──
  check("(2) no panel shows before a course is chosen", !x.d.querySelector("#cho-panel") || x.d.querySelector("#cho-panel").hasAttribute("hidden"));
  links[0].focus();
  press(x.w, links[0]); await settle();
  let panel = x.d.querySelector("#cho-panel");
  check("(2) pressing a course opens the panel beside the list", panel && !panel.hasAttribute("hidden") && panel.getAttribute("role") === "dialog" && !panel.hasAttribute("aria-modal"));
  check("(2) the panel names the course, its college and its M-ID card",
    txt(panel.querySelector("#cho-panel-h")) === COURSES[0].course + ", " + COURSES[0].title && txt(panel).includes(COURSES[0].college) && txt(panel).includes("M-ID card " + HUNT.courses[0].mid_card_at_filing),
    txt(panel.querySelector("#cho-panel-h")));
  check("(2) the address follows, with no page move", x.w.location.hash === "#commons/course/" + COURSES[0].control_number, x.w.location.hash);
  check("(2) the focus lands on the panel's heading", x.d.activeElement === panel.querySelector("#cho-panel-h"));
  check("(2) the position reads Course 1 of " + COURSES.length, txt(panel.querySelector("#cho-pos")) === "Course 1 of " + COURSES.length, txt(panel.querySelector("#cho-pos")));
  check("(11) the tab reports the course's address for a sign-in link", x.address() === "commons/course/" + COURSES[0].control_number, String(x.address()));
  press(x.w, panel.querySelector("#cho-next")); await settle();
  check("(2) Next steps to the second course and its address",
    txt(x.d.querySelector("#cho-panel-h")).indexOf(COURSES[1].course) === 0 && x.w.location.hash === "#commons/course/" + COURSES[1].control_number, x.w.location.hash);
  press(x.w, x.d.querySelector("#cho-prev")); press(x.w, x.d.querySelector("#cho-prev")); await settle();
  check("(2) Previous from the first course wraps to the last", txt(x.d.querySelector("#cho-panel-h")).indexOf(COURSES[COURSES.length - 1].course) === 0, txt(x.d.querySelector("#cho-panel-h")));
  press(x.w, x.d.querySelector("#cho-panel-close")); await settle();
  check("(2) Close hides the panel and puts the address back", x.d.querySelector("#cho-panel").hasAttribute("hidden") && x.w.location.hash === "#commons", x.w.location.hash);
  check("(2) Close returns the focus to the course that opened it", x.d.activeElement === links[0], x.d.activeElement && x.d.activeElement.outerHTML.slice(0, 80));
  check("(11) after Close the tab reports the front page", x.address() === "commons", String(x.address()));
  press(x.w, links[2]); await settle();
  x.d.dispatchEvent(new x.w.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })); await settle();
  check("(2) Escape closes the panel", x.d.querySelector("#cho-panel").hasAttribute("hidden"));

  // ── (3) signed out: the sign-in, no drop box, nothing sent ──
  press(x.w, links[0]); await settle();
  panel = x.d.querySelector("#cho-panel");
  check("(3) ⭐ signed out, the box offers the sign-in and no drop box",
    panel.querySelector(".cho-signin") && !panel.querySelector(".cho-drop") && !panel.querySelector("input[type=file]") && !panel.querySelector("form"), txt(panel.querySelector(".cho-box")));
  check("(3) it says the name goes on the hand-over", /Sign in as a reviewer/.test(txt(panel)) && /Your name goes on what you hand over/.test(txt(panel)));
  check("(3) ⭐ signed out, nothing is written", x.writes().length === 0, JSON.stringify(x.writes().map((c) => c.url)));

  // ── (4) a file: the private store with the reviewer's own token, then one row; never the person's name ──
  x = load("#commons", { signedIn: true, answers: Object.assign({}, ADDED, STORED) });
  await x.M.boot(); await settle();
  press(x.w, x.d.querySelector('a[data-course="' + COURSES[0].control_number + '"]')); await settle();
  panel = x.d.querySelector("#cho-panel");
  const fileInput = panel.querySelector(".cho-drop input[type=file]");
  check("(4) signed in, the box shows the drop box, the link and the pasted data", !!fileInput && !!panel.querySelector(".cho-drop label[for='" + fileInput.id + "']") && panel.querySelectorAll("form").length === 2 && !!panel.querySelector(".cho-paste"));
  choose(x.w, fileInput, new x.w.File(["%PDF-1.4 outline"], "HLTH 167 outline (final).pdf", { type: "application/pdf" }));
  await settle();
  let up = x.writes().filter((c) => /storage\/v1\/object\/commons-handover\//.test(c.url))[0];
  let addCall = x.writes().filter((c) => /rpc\/commons_handover_add/.test(c.url))[0];
  check("(4) ⭐ the file goes to the private store, under a dated folder and a safe name",
    up && /commons-handover\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\/HLTH-167-outline-final-\.pdf$/.test(up.url) && up.method === "POST", up && up.url);
  check("(4) ⭐ the upload carries the reviewer's own token and the file's type",
    up && up.headers.Authorization === "Bearer reviewer-token" && up.headers["Content-Type"] === "application/pdf" && up.headers["x-upsert"] === "false", up && JSON.stringify(up.headers));
  const sent = addCall ? JSON.parse(addCall.body).p : {};
  check("(4) one row follows through rpc/commons_handover_add, naming the file and the course",
    addCall && sent.kind === "file" && sent.dataset === "course_outlines" && sent.subject_kind === "course" && sent.college === COURSES[0].college && sent.course_code === COURSES[0].course
      && sent.control_number === COURSES[0].control_number && up.url.endsWith(sent.file_path) && sent.file_name === "HLTH 167 outline (final).pdf" && sent.file_type === "application/pdf",
    JSON.stringify(sent));
  check("(4) ⭐ the page never sends who handed it over", addCall && !/handed_by|reviewer@example\.org/.test(addCall.body), addCall && addCall.body);
  check("(4) the row follows the upload, never the other way", x.writes().indexOf(up) < x.writes().indexOf(addCall));
  check("(4) the box says where the file went and what happens next",
    /Sent: HLTH 167 outline \(final\)\.pdf\. It is in the private store under your name\. Our reader opens it at its next run/.test(txt(panel.querySelector(".cho-msg"))), txt(panel.querySelector(".cho-msg")));
  check("(4) the message is a live status", panel.querySelector(".cho-msg").getAttribute("role") === "status" && panel.querySelector(".cho-msg").getAttribute("aria-live") === "polite");

  // a dropped file takes the same path
  let before = x.writes().length;
  const dropEv = new x.w.Event("drop", { bubbles: true, cancelable: true });
  dropEv.dataTransfer = { files: [new x.w.File(["<html>outline</html>"], "outline.html", { type: "text/html" })] };
  panel.querySelector(".cho-drop").dispatchEvent(dropEv); await settle();
  check("(4) a dropped file is sent the same way", x.writes().length === before + 2 && /\/outline\.html$/.test(x.writes()[before].url), x.writes().slice(before).map((c) => c.url).join(" "));

  // ── (5) refused before any request ──
  before = x.writes().length;
  choose(x.w, fileInput, new x.w.File(["MZ"], "setup.exe", { type: "application/x-msdownload" })); await settle();
  check("(5) a file the store does not take is refused before any request", x.writes().length === before && /The store takes a PDF/.test(txt(panel.querySelector(".cho-msg"))), txt(panel.querySelector(".cho-msg")));
  const big = new x.w.File(["x"], "packet.pdf", { type: "application/pdf" });
  Object.defineProperty(big, "size", { value: 52428801 });
  choose(x.w, fileInput, big); await settle();
  check("(5) a file over 50 MB is refused before any request, with the way through", x.writes().length === before && /larger than 50 MB\. Give a link to it instead/.test(txt(panel.querySelector(".cho-msg"))), txt(panel.querySelector(".cho-msg")));

  // ── (6) Try the link ──
  const linkForm = panel.querySelectorAll("form")[0], linkInput = linkForm.querySelector("input[type=url]");
  check("(6) the link field has a label and the Try the link word", !!panel.querySelector("label[for='" + linkInput.id + "']") && txt(linkForm.querySelector("button[type=submit]")) === "Try the link");
  linkInput.value = "not a link"; submit(x.w, linkForm); await settle();
  check("(6) a bad address sends nothing", x.writes().length === before && /full web address that starts with https/.test(txt(panel.querySelector(".cho-msg"))), txt(panel.querySelector(".cho-msg")));

  // the reader is reachable: saved, asked to look now, answer read back
  x = load("#commons", { signedIn: true, answers: Object.assign({}, ADDED, {
    "functions/v1/handover-try-link": () => ({ status: 200, body: { ok: true, queued: true } }),
    "rest/v1/commons_handover?id=eq.": () => ({ status: 200, body: [{ id: "11111111-2222-3333-4444-555555555555", kind: "link", status: "reads", status_note: null, found: { outcomes: 4, objectives: 7 } }] })
  }) });
  await x.M.boot(); await settle();
  press(x.w, x.d.querySelector('a[data-course="' + COURSES[0].control_number + '"]')); await settle();
  panel = x.d.querySelector("#cho-panel");
  let lf = panel.querySelectorAll("form")[0];
  lf.querySelector("input[type=url]").value = "https://outlines.example.edu/hlth167"; submit(x.w, lf); await settle(60);
  let w0 = x.writes();
  const linkAdd = w0.filter((c) => /rpc\/commons_handover_add/.test(c.url))[0], tried = w0.filter((c) => /handover-try-link/.test(c.url))[0];
  check("(6) a good address saves one link row", linkAdd && JSON.parse(linkAdd.body).p.kind === "link" && JSON.parse(linkAdd.body).p.link_url === "https://outlines.example.edu/hlth167", linkAdd && linkAdd.body);
  check("(6) then asks the reader to look at that row now, as the reviewer",
    tried && JSON.parse(tried.body).id === "11111111-2222-3333-4444-555555555555" && tried.headers.Authorization === "Bearer reviewer-token" && w0.indexOf(linkAdd) < w0.indexOf(tried), tried && tried.body);
  check("(6) ⭐ the reader's answer is read back in plain words",
    /Our reader read this address with no challenge\. It found 4 outcomes and 7 objectives on the page\./.test(txt(panel.querySelector(".cho-msg"))), txt(panel.querySelector(".cho-msg")));

  // a bot check
  x = load("#commons", { signedIn: true, answers: Object.assign({}, ADDED, {
    "functions/v1/handover-try-link": () => ({ status: 200, body: { ok: true, queued: true } }),
    "rest/v1/commons_handover?id=eq.": () => ({ status: 200, body: [{ id: "x", kind: "link", status: "bot_check", status_note: null, found: {} }] })
  }) });
  await x.M.boot(); await settle();
  press(x.w, x.d.querySelector('a[data-course="' + COURSES[0].control_number + '"]')); await settle();
  panel = x.d.querySelector("#cho-panel"); lf = panel.querySelectorAll("form")[0];
  lf.querySelector("input[type=url]").value = "https://blocked.example.edu/outlines"; submit(x.w, lf); await settle(60);
  check("(6) a bot check reads as one: the reader stopped, and a file is the way through",
    /answered our reader with a bot check, so the reader stopped\..*A file dropped here is the way through\./.test(txt(panel.querySelector(".cho-msg"))), txt(panel.querySelector(".cho-msg")));

  // the reader is unreachable (the function answers 503): the link waits for the nightly run
  x = load("#commons", { signedIn: true, answers: Object.assign({}, ADDED, { "functions/v1/handover-try-link": () => ({ status: 503, body: { ok: false, reason: "not_configured" } }) }) });
  await x.M.boot(); await settle();
  press(x.w, x.d.querySelector('a[data-course="' + COURSES[0].control_number + '"]')); await settle();
  panel = x.d.querySelector("#cho-panel"); lf = panel.querySelectorAll("form")[0];
  lf.querySelector("input[type=url]").value = "https://outlines.example.edu/hlth167"; submit(x.w, lf); await settle(60);
  check("(6) ⭐ with the reader unreachable the link waits for the nightly run, and nothing says it was read",
    /Saved under your name\. Our reader tries this address at its nightly run/.test(txt(panel.querySelector(".cho-msg"))) && !/with no challenge/.test(txt(panel.querySelector(".cho-msg")))
      && !x.writes().some((c) => /rest\/v1\/commons_handover\?id=/.test(c.url)), txt(panel.querySelector(".cho-msg")));

  // ── (7) pasted data ──
  const pasteForm = panel.querySelector(".cho-paste form");
  before = x.writes().length;
  submit(x.w, pasteForm); await settle();
  check("(7) nothing typed sends nothing", x.writes().length === before && /Paste a description, hours or outcomes first/.test(txt(panel.querySelector(".cho-msg"))), txt(panel.querySelector(".cho-msg")));
  check("(7) every pasted field has a label", Array.from(pasteForm.querySelectorAll("textarea, input")).every((f) => !!pasteForm.querySelector("label[for='" + f.id + "']")));
  const areas = pasteForm.querySelectorAll("textarea");
  areas[1].value = "Identify the changes of normal aging.\n\n  Practice three memory strategies.  \n";
  pasteForm.querySelector("input[type=url]").value = "https://catalog.example.edu/hlth/";
  submit(x.w, pasteForm); await settle();
  const pasteCall = x.writes().slice(before).filter((c) => /rpc\/commons_handover_add/.test(c.url))[0];
  const pasted = pasteCall ? JSON.parse(pasteCall.body).p : {};
  check("(7) outcomes go one per line, trimmed, with where they were found",
    pasted.kind === "paste" && JSON.stringify(pasted.pasted.slos) === JSON.stringify(["Identify the changes of normal aging.", "Practice three memory strategies."])
      && pasted.pasted.source_url === "https://catalog.example.edu/hlth/" && !("description" in pasted.pasted), JSON.stringify(pasted));
  panel = x.d.querySelector("#cho-panel");
  check("(7) in the panel a save steps to the next course and carries the saved words",
    txt(panel.querySelector("#cho-panel-h")).indexOf(COURSES[1].course) === 0 && /Saved HLTH 167 under your name\. A person's entry wins over a later machine read\./.test(txt(panel.querySelector("[data-carried]"))),
    txt(panel.querySelector("#cho-panel-h")) + " | " + txt(panel.querySelector("[data-carried]")));

  // ── (9) the public counts as words ──
  const SUMMARY = [
    { dataset: "course_outlines", subject_kind: "course", college: OPEN[0].college, course_code: OPEN[0].still_taught[0].course, kind: "file", status: "waiting", n: 1, newest: "2026-11-20" },
    { dataset: "course_outlines", subject_kind: "college", college: OPEN[0].college, course_code: null, kind: "link", status: "reads", n: 2, newest: "2026-11-20" },
    { dataset: "catalog", subject_kind: "college", college: OPEN[1].college, course_code: null, kind: "api", status: "waiting", n: 1, newest: "2026-11-20" },
    { dataset: "term_reports", subject_kind: "dataset", college: null, course_code: null, kind: "file", status: "waiting", n: 1, newest: "2026-11-20" }
  ];
  x = load("#commons", { signedIn: true, summary: SUMMARY, answers: Object.assign({}, ADDED) });
  await x.M.boot(); await settle();
  const li0 = x.d.querySelector('li[data-hunt-college="' + OPEN[0].slug + '"] .cmf-standing');
  check("(9) what was handed over reads as words beside its college",
    txt(li0) === "Handed over: 1 file to be opened by our reader; 2 links read by our reader.", txt(li0));
  check("(9) a college with nothing handed over shows no line", txt(x.d.querySelector('li[data-hunt-college="' + OPEN[2].slug + '"] .cmf-standing')) === "");
  check("(9) the counts carry no person", !/@|handed_by/.test(JSON.stringify(x.H._state.summary.rows)));
  check("(9) a course's own line counts only that course",
    x.H.standing(SUMMARY, { subject_kind: "course", college: OPEN[0].college, course_code: OPEN[0].still_taught[0].course }).join("; ") === "1 file to be opened by our reader");

  // ── (12) Term Reports Needed ──
  const terms = x.d.querySelector("#cmf-need-terms");
  check("(12) Term Reports Needed sits in Needs you, naming the three terms", terms && txt(terms.querySelector("h4")) === "Term Reports Needed" && /Spring 2026, Spring 2025 and Fall 2024/.test(txt(terms)), txt(terms));
  check("(12) its standing line reads the term hand-overs", txt(x.d.querySelector("#cmf-term-standing")) === "Handed over: 1 file to be opened by our reader.", txt(x.d.querySelector("#cmf-term-standing")));
  const fold = terms.querySelector("details");
  fold.open = true; fold.dispatchEvent(new x.w.Event("toggle")); await settle();
  const termBox = terms.querySelector(".cho-box");
  check("(12) opening it draws the same box under the term-reports dataset, with a Term report API box",
    termBox && termBox.getAttribute("data-handover") === "term_reports" && termBox.getAttribute("data-subject") === "dataset" && /Drop a term report here/.test(txt(termBox))
      && /Term report API: none yet/.test(txt(termBox)) && !termBox.querySelector(".cho-paste"), txt(termBox).slice(0, 200));

  // ── (10) College Data Collection: the college's own panel on the hand-over pane ──
  const slug = OPEN[0].college.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  check("(10) the college link's slug is College Data Collection's own", x.d.querySelector('a[data-college-panel="' + OPEN[0].slug + '"]').getAttribute("href") === "#collect/outlines-blocked/college/" + slug + "/handover");
  x = load("#collect/outlines-blocked/college/" + slug + "/handover", { signedIn: true, summary: SUMMARY, answers: Object.assign({}, ADDED, { "functions/v1/handover-try-link": () => ({ status: 503, body: {} }) }) });
  await x.M.boot(); await settle(60);
  const cdd = x.d.querySelector("#cdd-panel");
  check("(10) ⭐ the address opens the college's own panel on the hand-over pane",
    cdd && !cdd.hasAttribute("hidden") && txt(cdd.querySelector("#cdd-panel-h")) === "Hand over course outlines" && txt(cdd).includes(OPEN[0].college) && !!cdd.querySelector('[data-handover-college="' + OPEN[0].college + '"] .cho-drop'),
    cdd ? txt(cdd).slice(0, 200) : "no panel");
  check("(10) the address stands as it arrived", x.w.location.hash === "#collect/outlines-blocked/college/" + slug + "/handover", x.w.location.hash);
  check("(10) the tab reports it for a sign-in link", x.address() === "commons/collect/outlines-blocked/college/" + slug + "/handover", String(x.address()));
  check("(10) the pane says what stands and what was handed over", /Handed over/.test(txt(cdd)) && /1 file to be opened by our reader; 2 links read by our reader/.test(txt(cdd)), txt(cdd.querySelector(".cho-have")));
  check("(10) the pane goes back to the college", !!cdd.querySelector("#cdd-pane-back") && txt(cdd.querySelector("#cdd-pane-back")) === "Back to " + OPEN[0].college);
  const todo = x.d.querySelector("#cdd-blocked");
  const words = todo ? Array.from(todo.querySelectorAll('button[data-pane="handover"]')) : [];
  check("(10) each college on the to-do carries the word that opens it", words.length === OPEN.length && words.every((b) => txt(b) === "Hand over its outlines"), words.length + " words for " + OPEN.length + " colleges");

  // ── (8) the API procedure box, on the college's pane ──
  const apiBoxes = Array.from(cdd.querySelectorAll("details.cho-api"));
  check("(8) the college's pane carries a Catalog API box and a Course outline API box",
    apiBoxes.length === 2 && /^Catalog API: none yet$/.test(txt(apiBoxes[0].querySelector("summary"))) && /^Course outline API: none yet$/.test(txt(apiBoxes[1].querySelector("summary"))),
    apiBoxes.map((b) => txt(b.querySelector("summary"))).join(" | "));
  check("(8) ⭐ no field in the box takes a key", !cdd.querySelector("input[type=password]") && !Array.from(cdd.querySelectorAll("label")).some((l) => /\b(key|token|password|secret)\b/i.test(txt(l)))
    && /A key, when one is needed, is kept in the secure store and never typed here\./.test(txt(cdd)));
  before = x.writes().length;
  const cat = apiBoxes[0], saveBtn = Array.from(cat.querySelectorAll("button")).filter((b) => txt(b) === "Save the procedure")[0], testBtn = Array.from(cat.querySelectorAll("button")).filter((b) => txt(b) === "Test the API")[0];
  press(x.w, saveBtn); await settle();
  check("(8) no address sends nothing", x.writes().length === before && /Give the API address first/.test(txt(cdd.querySelector(".cho-msg"))), txt(cdd.querySelector(".cho-msg")));
  cat.querySelector("input[type=url]").value = "https://api.example.edu/v1/courses";
  cat.querySelector("textarea").value = "GET, one page per subject";
  press(x.w, saveBtn); await settle();
  const apiCall = x.writes().slice(before).filter((c) => /rpc\/commons_handover_add/.test(c.url))[0], api = apiCall ? JSON.parse(apiCall.body).p : {};
  check("(8) Save sends the procedure under the catalog dataset, for the college",
    api.kind === "api" && api.dataset === "catalog" && api.subject_kind === "college" && api.college === OPEN[0].college && api.api.which === "catalog"
      && api.api.address === "https://api.example.edu/v1/courses" && api.api.procedure === "GET, one page per subject" && !("test" in api.api), JSON.stringify(api));
  check("(8) the box then reads procedure saved", txt(cat.querySelector("summary")) === "Catalog API: procedure saved", txt(cat.querySelector("summary")));
  check("(8) Test the API is offered beside Save", !!testBtn);

  // ── (11) a direct arrival at a course's address ──
  x = load("#commons/course/" + COURSES[3].control_number, { signedIn: true });
  await x.M.boot(); await settle();
  panel = x.d.querySelector("#cho-panel");
  check("(11) ⭐ a direct arrival opens that course's panel on the front page",
    panel && !panel.hasAttribute("hidden") && txt(panel.querySelector("#cho-panel-h")).indexOf(COURSES[3].course) === 0 && !!x.d.querySelector("#cmf-needs"), panel ? txt(panel.querySelector("#cho-panel-h")) : "no panel");
  check("(11) no Back to Needs you link shows over the front page", !x.d.querySelector("#cpl-back-needs"));
  x = load("#commons/course/NOT-A-COURSE");
  await x.M.boot(); await settle();
  check("(11) an address that names no course draws the front page with no panel", !!x.d.querySelector("#cmf-needs") && (!x.d.querySelector("#cho-panel") || x.d.querySelector("#cho-panel").hasAttribute("hidden")));

  // ── (13) the module's CSS ──
  const css = HO_SRC.slice(HO_SRC.indexOf("var CSS = ["), HO_SRC.indexOf("function ensureCss"));
  check("(13) the module's CSS holds no raw hex color", css.length > 500 && !/#[0-9a-fA-F]{3,8}\b/.test(css.replace(/#tab-commons/g, "")), (css.match(/#[0-9a-fA-F]{3,8}\b/g) || []).join(" "));
  check("(13) every dataset the table takes has its words", ["course_outlines", "catalog", "programs", "term_reports", "exhibits", "credit_recommendations", "credentials"].every((k) => x.H.DATASETS[k] && x.H.DATASETS[k].drop && x.H.DATASETS[k].link));

  let failed = 0;
  results.forEach(([name, ok, why]) => { if (!ok) failed++; console.log((ok ? "ok   " : "FAIL ") + name + (ok || why == null ? "" : "\n       " + String(why).slice(0, 500))); });
  console.log("\n" + results.length + " checks, " + failed + " failed");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

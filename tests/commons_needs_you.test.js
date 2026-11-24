// Commons Needs you: one path per item, a way back, and live updates (issue 3566; Sam on the live page, 10:34 AM PT
// Nov 19, 2026, relayed by COBIx; built in S687).
//
// WHAT THIS GUARDS (each a way Sam got lost that morning):
//   (A) ⭐ a settled decision shown as open. The Nov 18 slash-titles ruling ("they stay as printed") shows exactly once,
//       as decided, in the decision record, with Change it; never as "Your next batch", in "One decision waits on you",
//       as a Needs you pill on Common Exhibits, or under Decisions waiting. The details view and the front page read one
//       decisions list (CPL_COMMONS.decisions).
//   (A) ⭐ the college wording rule leads Decisions waiting while it has no answer, linked to #cr-reference/names with
//       the POST Basic Academy example, and leaves the list (into the record) once an answer is fixtured.
//   (B) ⭐ every Needs you link resolves to a view whose address is in the router, and that view carries one
//       "Back to Needs you" link to #commons/needs-you, gone again once the person is back; #commons/needs-you
//       scrolls to the section and focuses its heading.
//   (C) ⭐ the held exhibit titles read live: with the 36 saves in kb_curation the line reads as saved by a person and
//       waiting for the nightly fold, with no link to work, and the five titles COBIx could not find are listed under it;
//       with no live read the status file's count stands, named with its time in Pacific time.
//   (6) ⭐ #collect and the Commons show one program-records date and count from one input, computed in one file.
//
// Run from repo root: `npm test` (or `node tests/commons_needs_you.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }
const J = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

const PROGRESS = fs.readFileSync("commons_progress.js", "utf8");
const COMMONS = fs.readFileSync("commons.js", "utf8");
const FRONT = fs.readFileSync("commons_front.js", "utf8");
const PRG = fs.readFileSync("commons_program_records.js", "utf8");
const DATA = fs.readFileSync("commons_data.js", "utf8");
const ETA = fs.readFileSync("commons_eta_clock.js", "utf8");
const SHARE = fs.readFileSync("commons_data_sharing.js", "utf8");
const INTEG = fs.readFileSync("commons_data_integrations.js", "utf8");
const HTML = fs.readFileSync("CPL_Dashboard.html", "utf8");

const SLASH = "Eight titles that join two whole names with a slash: write and, or keep the slash?";
const WORDING = "cr-college-wording-rule";
const STATUS = J("kb/status/commons.json");
/* The status file as it stood at 8:53 AM PT (16:53Z): its batches still carried the slash decision. */
const STALE = JSON.parse(JSON.stringify(STATUS));
STALE.written_at = "2026-11-19T16:53:24Z";
STALE.batches = [{ kind: "decision", project: "exhibit", n: 1, title: SLASH, open: null, chosen: "They stay as printed.", stop: "It stands unless you change it." }]
  .concat((STATUS.batches || []).filter((b) => b.kind !== "decision"));
/* The held queue as the 8:53 AM PT build left it: 36 titles, the reasons in the owner's order. Fixed here, so the nightly
   fold or a later build never moves these checks. */
STALE.queue = { reasons: [{ key: "unsure", items: [{ ref: "exhibit", title: "Common Exhibit Reference", n: 36, words: "titles held for a person",
  owner: "a curator (a merge would join two issuers 19, the classifier is unsure 12, the classifier's title has a course code left in 5)", open: "#exhibits/held" }] }] };
const REVIEW = { written_at: "2026-11-19T16:53:14Z", tiles: {}, held: [{ raw: "Completed NC.NURSNG-089 at College of the Canyons", step: "Wording check" }]
  .concat(Array.from({ length: 35 }, (_, i) => ({ raw: "Held fixture title " + (i + 1), step: i < 19 ? "Two issuers" : "Proposed" }))) };
/* The run logs: the slash call answered (Sam, Nov 18), the wording rule open, whatever later checkpoints write. */
function runLog(key) {
  const q = J("kb/status/" + key + ".json");
  if (key === "exhibit") {
    q.calls = q.calls.filter((c) => c.todo_id !== "slash-whole-name-titles-s679").concat([{ title: SLASH, text: "The eight titles.", if_no_reply: "They stay as printed.",
      view: { href: "#exhibits", text: "Open the Exhibits List" }, todo_id: "slash-whole-name-titles-s679", answer: { by: "Sam", at: "2026-11-18", words: "They stay as printed." } }]);
  }
  if (key === "cr") {
    q.calls = q.calls.filter((c) => c.todo_id !== WORDING);
    q.calls.unshift({ title: "The college wording rule: keep the colleges' wording where an official number reaches a group whose title shares no word with it?",
      text: "36 groups. One example: the POST Basic Academy wording \"3 hours in Physical Training and Health Education (CSU GE Area E)\" is tied to C-ID AJ 110, \"Introduction to Criminal Justice.\" These 36 are a different list from the 36 exhibit titles a person saved this morning; they share only the count.",
      if_no_reply: "The 36 groups wait for a check.", view: { href: "#cr-reference/names", text: "Open the 36 groups" }, todo_id: WORDING });
  }
  return q;
}
const HELD = REVIEW.held.filter((h) => h.raw && h.step !== "Conflict with the reference");
/* Sam's saves of Nov 19 (9:37 to 9:55 AM PT): every held title has a unified_title_assignment; one named as COBIx gave it. */
const NAMED = { "Completed NC.NURSNG-089 at College of the Canyons": "Success in Fundamental Nursing" };
const SAVES = HELD.map((h) => ({ course_id: "_UNCLASSIFIED::" + h.raw, field: "unified_title_assignment", value: NAMED[h.raw] || h.raw + " (saved)" }));

function baseFiles() {
  const f = {
    "kb/status/commons.json": STALE,
    "kb/status/program-requirements.json": J("kb/status/program-requirements.json"),
    "kb/status/commons_data.json": J("kb/status/commons_data.json"),
    "kb/reference/industry_credential_skills.json": J("kb/reference/industry_credential_skills.json"),
    "kb/exhibits_review.json": REVIEW
  };
  ["exhibit", "cr", "course", "subjects"].forEach((k) => { f["kb/status/" + k + ".json"] = runLog(k); });
  return f;
}
/* A COBI page with the panes a Needs you link opens, as both HTMLs draw them: a pane, its main container, its root. */
const PANES = ["commons", "exhibits", "cr-reference", "coci-lookup", "program-requirements", "canonical-subj4"];
function load(hash, opts) {
  opts = opts || {};
  const body = PANES.map((t) => '<div class="cpl-tab-pane" id="tab-' + t + '" data-tab="' + t + '"><div class="main-container"><div id="' + t + '-root">Loading</div></div></div>').join("");
  const dom = new JSDOM("<!doctype html><html><head></head><body>" + body + "</body></html>", { url: "https://example.org/index.html" + (hash || ""), runScripts: "dangerously" });
  const w = dom.window, store = {}, calls = [];
  Object.defineProperty(w, "localStorage", { value: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } }, configurable: true });
  w.scrolled = [];
  w.Element.prototype.scrollIntoView = function () { w.scrolled.push(this.id || this.tagName); };
  if (opts.session !== false) w.CPL_SESSION = { authHeaders: (x) => Object.assign({ apikey: "anon-key" }, x || {}) };
  /* A reviewer signed in: the done marks are read (queue_todo_done), as cpl_session.js would hand them over. */
  if (opts.reviewer) Object.assign(w.CPL_SESSION, { get: () => ({ email: "reviewer@example.org", refresh_token: "r" }), isFresh: () => true });
  const files = Object.assign(baseFiles(), opts.files || {});
  w.fetch = function (url, init) {
    url = String(url); calls.push([url, init]);
    if (url.indexOf("/queue_todo_done?") >= 0) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(opts.marks || []) });
    if (url.indexOf("/rest/v1/kb_curation") >= 0) {
      if (opts.liveFails) return Promise.resolve({ ok: false, status: 503, json: () => Promise.resolve([]) });
      const ids = decodeURIComponent((/course_id=in\.\((.*)\)&order/.exec(url) || [])[1] || "").split(/","/).map((s) => s.replace(/^"|"$/g, ""));
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(SAVES.filter((r) => ids.indexOf(r.course_id) >= 0)) });
    }
    const hit = files[url.split("?")[0]];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  [PROGRESS, PRG, FRONT, COMMONS].forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, M: w.CPL_COMMONS, F: w.CPL_COMMONS_FRONT, calls };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 30; i++) await tick(); }
async function go(x, hash) { x.w.location.hash = hash; await settle(); x.w.dispatchEvent(new x.w.CustomEvent("cpl-tab-activated", { detail: { tab: hash.replace(/^#/, "").split("/")[0] === "collect" ? "commons" : hash.replace(/^#/, "").split("/")[0] } })); await settle(); }
const count = (hay, needle) => hay.split(needle).length - 1;

(async function () {
  // ── (A) the front page's Needs you ──
  const f = load("#commons");
  await f.M.boot(); await settle();
  const needs = f.d.getElementById("cmf-needs");
  /* S723 (Sam, 2026-11-24): Needs you is the ranked links to what waits on you; a decision is one of them, and its
     link opens the decision itself. Its words are the decision record's, one press away. */
  const decList = f.d.querySelectorAll("#cmf-rank li[data-todo]");
  check("(A) ⭐ the college wording rule leads the decisions in Needs you while it has no answer", decList.length >= 1 && decList[0].getAttribute("data-todo") === WORDING
    && decList[0].querySelector('a[href="#cr-reference/names"]') && /^Decision waiting: /.test(txt(decList[0])));
  check("(A) ⭐ Needs you shows only what waits: no None waiting, no empty box", !/None waiting|No college waits|No still-taught course waits|No term report waits/.test(txt(needs))
    && !f.d.getElementById("cmf-need-decisions") && !f.d.getElementById("cmf-need-rows") && !f.d.getElementById("cmf-need-catalogs") && !f.d.getElementById("cmf-need-titles"));
  check("(A) ⭐ the slash ruling is nowhere on Needs you, open or closed", needs && !/slash/i.test(txt(needs)));
  check("(A) ⭐ Decision record opens its own address, not the bare details", !!needs.querySelector('a[href="#commons/details/decisions"]') && !needs.querySelector('a[href="#commons/details"]'));
  check("the wording rule is not applied: nothing is written anywhere", !f.calls.some((c) => c[1] && c[1].method && c[1].method !== "GET"));
  const rec0 = load("#commons/details/decisions");
  await rec0.M.boot(); await settle();
  const recLi = rec0.d.querySelector('#cmn-rec-open li[data-todo="' + WORDING + '"]');
  check("the decision's words sit in the record: the examples, and the two 36s kept apart", recLi && /POST Basic Academy/.test(txt(recLi)) && /C-ID AJ 110/.test(txt(recLi))
    && /different list from the 36 exhibit titles a person saved/.test(txt(recLi)));

  // ── (C) the held titles, live ──
  /* S723: the held titles live on the Exhibit titles card's held check; Needs you links to it only while one waits. */
  const heldCheck = (x) => x.d.querySelector('.cmf-card[data-key="exhibit"] .cmf-check[data-ref="held"]');
  const heldRank = (x) => Array.from(x.d.querySelectorAll("#cmf-rank li")).filter((l) => /^Exhibit titles to name/.test(txt(l)))[0] || null;
  const held = heldCheck(f);
  check("(C) ⭐ with the saves in kb_curation, the held check reads as saved by a person, waiting for the nightly build",
    held && new RegExp(HELD.length + " saved titles wait for the nightly build, which adds them to the reference; no one needs to act\\.").test(txt(held.querySelector(".cmf-check-line"))));
  check("(C) and it is work for no one: no Needs you link, and the held figure reads 0", !heldRank(f) && /^0 held for a person/.test(txt(held.querySelector(".cmf-check-fig"))));
  check("(C) ⭐ the five titles COBIx could not find are findable from the check", /Completed NC\.NURSNG-089 at College of the Canyons is saved as Success in Fundamental Nursing/.test(txt(held)) && held.querySelectorAll(".cmf-saved-list li").length === HELD.length);
  const live = f.calls.filter((c) => c[0].indexOf("/rest/v1/kb_curation") >= 0);
  check("(C) the read is Range-paged and read-only, in chunks of 40", live.length === Math.ceil(HELD.length / 40)
    && live.every((c) => c[1] && c[1].headers && c[1].headers.Range === "0-999" && c[1].headers["Range-Unit"] === "items" && !c[1].method));
  const off = load("#commons", { liveFails: true });
  await off.M.boot(); await settle();
  check("(C) ⭐ a failed live read leaves the status file's count, named with its time in Pacific time",
    /^36 held for a person/.test(txt(heldCheck(off).querySelector(".cmf-check-fig"))) && /\(it is unsure on 12, a merge would join two issuers on 19, a course code is left in the title on 5\); this count is as of 8:53 AM PT on November 19 until the live read answers\./.test(txt(heldCheck(off).querySelector(".cmf-check-line")))
    && /frees 36 exhibit titles/.test(txt(heldRank(off))));
  const some = load("#commons", { files: { "kb/exhibits_review.json": Object.assign({}, REVIEW, { held: REVIEW.held.concat([{ raw: "A title no one saved", step: "Proposed" }]) }) } });
  await some.M.boot(); await settle();
  check("(C) a title still unsaved keeps its Needs you link, landing on the held check's link", /frees 1 exhibit title$/.test(txt(heldRank(some)))
    && heldRank(some).querySelector("a").getAttribute("data-onpage-to") === "#exhibits/held" && /^1 held for a person/.test(txt(heldCheck(some).querySelector(".cmf-check-fig"))));
  const folded = load("#commons", { files: { "kb/exhibits_review.json": Object.assign({}, REVIEW, { held: [] }) } });
  await folded.M.boot(); await settle();
  check("(C) once the fold lands the Needs you link goes", !heldRank(folded));

  // ── (A) the details view ──
  const dv = load("#commons/details");
  await dv.M.boot(); await settle();
  const next = dv.d.getElementById("cmn-next-sec"), band = dv.d.querySelector(".cmn-band");
  check("(A) ⭐ the details view never offers the slash ruling as Your next batch, even from a status file that still lists it", !next || !/slash/i.test(txt(next)));
  check("(A) ⭐ nor as a decision that waits on you", !band || !/slash/i.test(txt(band)));
  check("(A) the band leads with the college wording rule", band && /^Common Credit Recommendations: The college wording rule/.test(txt(band.querySelector("li"))));
  const exCard = dv.d.querySelector('.cmn-card[data-card="exhibit"]');
  check("(A) ⭐ Common Exhibits carries no Needs you pill and no Your decision line", exCard && exCard.getAttribute("data-kind") !== "needs"
    && txt(exCard.querySelector(".cmn-pill")) !== "Needs you" && !exCard.querySelector(".cmn-card-ask"));
  const first = dv.M.decisions(STALE, { exhibit: { Q: runLog("exhibit") }, cr: { Q: runLog("cr") }, course: { Q: runLog("course") }, subjects: { Q: runLog("subjects") } });
  check("(A) ⭐ one decisions list: the front page's decision links are decisions()'s open list, in its order",
    Array.from(decList).map((li) => li.getAttribute("data-todo") || "").join("|") === first.open.map((x) => x.call.todo_id || "").join("|"));

  // ── (A) the decision record at its own address ──
  const rec = load("#commons/details/decisions");
  await rec.M.boot(); await settle();
  const root = rec.d.getElementById("commons-root");
  check("(A) ⭐ #commons/details/decisions draws the decision record", txt(rec.d.getElementById("cmn-rec-h")) === "Decision record" && rec.d.activeElement === rec.d.getElementById("cmn-rec-h"));
  check("(A) ⭐ the slash ruling shows exactly once, as decided", count(txt(root), SLASH) === 1 && /slash/.test(txt(rec.d.getElementById("cmn-rec-done"))) && !/slash/.test(txt(rec.d.getElementById("cmn-rec-open"))));
  const slashLi = Array.from(rec.d.querySelectorAll("#cmn-rec-done li")).find((li) => li.getAttribute("data-todo") === "slash-whole-name-titles-s679");
  check("(A) with the words decided, by whom and when, and a control to change it", slashLi && /Decided by Sam on November 18, 2026: They stay as printed/.test(txt(slashLi))
    && txt(slashLi.querySelector("a.cmn-rec-change")) === "Change it" && slashLi.querySelector("a.cmn-rec-change").getAttribute("href") === "#exhibits");
  check("(A) the wording rule waits first in the record too", (rec.d.querySelector("#cmn-rec-open li") || { getAttribute: () => "" }).getAttribute("data-todo") === WORDING);

  // the wording rule leaves Decisions waiting once a decision is fixtured
  const crRuled = runLog("cr");
  crRuled.calls.filter((c) => c.todo_id === WORDING)[0].answer = { by: "Sam", at: "2026-11-20", words: "Keep the colleges' wording." };
  /* S701 checkpoint: the Subjects run log carries an open call of its own (aligning 192 Cerritos courses' M-IDs), so
     this fixture keeps only its answered calls; the open-list order above is checked against the committed files. */
  const subjAnswered = runLog("subjects");
  subjAnswered.calls = subjAnswered.calls.filter((c) => c.answer);
  const ruled = load("#commons", { files: { "kb/status/cr.json": crRuled, "kb/status/subjects.json": subjAnswered } });
  await ruled.M.boot(); await settle();
  check("(A) ⭐ once a decision is fixtured, the wording rule leaves Needs you", !ruled.d.querySelector('#cmf-rank li[data-todo="' + WORDING + '"]')
    && !/None waiting/.test(txt(ruled.d.getElementById("cmf-needs"))));
  /* S701: Sam answered the noncredit subject title list (r-noncredit-title-list-go-sam-2026-11-22), so the Subjects
     run log waits on nothing and the list is empty again once the wording rule is answered. */
  const ruledRec = load("#commons/details/decisions", { files: { "kb/status/cr.json": crRuled, "kb/status/subjects.json": subjAnswered } });
  await ruledRec.M.boot(); await settle();
  /* Newest first: Sam's answer on the noncredit list (2026-11-22) sits above the fixtured wording ruling (2026-11-20). */
  const doneLis = Array.from(ruledRec.d.querySelectorAll("#cmn-rec-done li"));
  /* S707: Sam's answer on the 192 Cerritos courses (2026-11-22) is a second Subjects answer of that day, so the
     wording ruling's place is found, never pinned: every answer of 2026-11-22 sits above it. */
  const wi = doneLis.findIndex(function (li) { return li.getAttribute("data-todo") === WORDING; });
  const above = doneLis.slice(0, Math.max(wi, 0)).map(txt);
  check("(A) and the record lists it as decided, newest first", wi >= 1
    && above.some(function (t) { return /noncredit subject title list/i.test(t); })
    && above.some(function (t) { return /192 Cerritos courses/i.test(t); }), doneLis.map(txt).join(" | ").slice(0, 400));

  // ── COBIx's review of #3570, item 1: a call's address is checked before it becomes a link ──
  const crBad = runLog("cr");
  crBad.calls.push({ title: "A call whose address is a script", text: "x", view: { href: "javascript:alert(1)", text: "x" }, todo_id: "bad-href-fixture" });
  const bad = load("#commons", { files: { "kb/status/cr.json": crBad } });
  await bad.M.boot(); await settle();
  const badLi = bad.d.querySelector('#cmf-rank li[data-todo="bad-href-fixture"]');
  check("⭐ a call whose view.href is javascript:alert(1) links to the decision record instead on Needs you", badLi && /A call whose address is a script/.test(txt(badLi))
    && badLi.querySelector("a").getAttribute("href") === "#commons/details/decisions" && !bad.d.querySelector('a[href^="javascript"]'));
  const badRec = load("#commons/details/decisions", { files: { "kb/status/cr.json": crBad } });
  await badRec.M.boot(); await settle();
  check("and none in the decision record", !badRec.d.querySelector('a[href^="javascript"]') && /A call whose address is a script/.test(txt(badRec.d.getElementById("cmn-rec-open"))));

  // ── COBIx's review of #3570, item 2: Mark done's closings are read behind a reviewer sign-in only ──
  check("⭐ signed out, Needs you says signing in also hides the items already marked done",
    /Signing in as a reviewer also hides the items already marked done\./.test(txt(f.d.getElementById("cmf-needs")))
    && /Signing in as a reviewer also hides the items already marked done\./.test(txt(rec.d.getElementById("cmn-rec-open").parentNode)));
  const mark = [{ project: "cr", todo_id: WORDING, by_email: "reviewer@example.org", at: "2026-11-19T20:00:00Z", note: "keep the wording", reopen: false }];
  const rv = load("#commons", { reviewer: true, marks: mark });
  await rv.M.boot(); await settle();
  check("⭐ signed in, a call closed by Mark done leaves Needs you, and the line goes",
    !rv.d.querySelector('#cmf-rank li[data-todo="' + WORDING + '"]') && !/Signing in as a reviewer/.test(txt(rv.d.getElementById("cmf-needs"))));
  const rvRec = load("#commons/details/decisions", { reviewer: true, marks: mark });
  await rvRec.M.boot(); await settle();
  check("and the record lists it as decided by its mark", /Marked done: keep the wording/.test(txt(rvRec.d.getElementById("cmn-rec-done")))
    && !rvRec.d.querySelector('#cmn-rec-open li[data-todo="' + WORDING + '"]'));
  const rvNone = load("#commons", { reviewer: true, marks: [] });
  await rvNone.M.boot(); await settle();
  check("signed in with no marks, the rule still waits and the line is not shown", !!rvNone.d.querySelector('#cmf-rank li[data-todo="' + WORDING + '"]')
    && !/Signing in as a reviewer/.test(txt(rvNone.d.getElementById("cmf-needs"))));

  // ── (B) every Needs you link: a view in the router, and the way back ──
  const tabs = new Set(Array.from(HTML.matchAll(/class="cpl-tab[^"]*" data-tab="([a-z0-9-]+)"/g)).map((m) => m[1]).concat(["collect"]));
  const SUBVIEWS = {
    "commons/subjects/noncredit": true,   // S700: the noncredit subject title list, a view of the Subjects list
    "commons/subjects/held": /var HELD = "held";/.test(fs.readFileSync("commons_subjects.js", "utf8")),   // the held codes, a view of the Subjects list
    "commons/details/decisions": /RECORD\.on = !!\(a && a\[0\] === "details" && a\[1\] === "decisions"\)/.test(COMMONS),
    "collect/outlines-blocked": /"outlines-blocked": "Course outlines blocked"/.test(DATA),
    "collect/unread": /unread: \{ word: "Not collected yet"/.test(DATA),
    "exhibits/held": /ROUTE_WORDS = \{ held:/.test(fs.readFileSync("exhibits.js", "utf8")),
    "cr-reference/names": /FILTERS = \[[^\]]*"names"/.test(fs.readFileSync("cr_reference.js", "utf8")),
    "coci-lookup/list/doubt": /\["doubt", "Common subject in doubt", null\]/.test(fs.readFileSync("coci_lookup.js", "utf8"))   // Fixes owed's list (S723)
  };
  /* Sam, 2026-11-21 (item 1): the ranked links jump to a card on this page (data-onpage); they are guarded in
     tests/commons_page_clarity.test.js. Every other Needs you link opens a view in the router. */
  const links = Array.from(f.d.querySelectorAll("#cmf-needs a")).filter((l) => /^#/.test(l.getAttribute("href")) && !l.hasAttribute("data-onpage"));
  /* Sam, 2026-11-20 (his work order): the catalog addresses in Course Outline and Catalog Fixes Needed are links that
     open in a new tab. They are the one exception (a.cmf-out inside #cmf-need-rows, guarded in
     tests/commons_outline_fixes.test.js); every other Needs you link stays in the site. */
  /* S723: Fixes owed's Ask COBI opens a new issue in the tracker, already written, in a new tab (Sam: "something queued
     up for me to do to prompt COBI"); it is Needs you's one off-site link. */
  const offSite = (l) => l.closest("#cmf-need-owed") && /^https:\/\/github\.com\/CPL-Initiative\/cpl-project-tracker\/issues\/new\?title=/.test(l.getAttribute("href"))
    && l.getAttribute("target") === "_blank" && /noopener/.test(l.getAttribute("rel") || "");
  check("(B) Needs you carries in-site links only, but for Fixes owed's Ask COBI, which opens in a new tab",
    Array.from(f.d.querySelectorAll("#cmf-needs a")).every((l) => /^#/.test(l.getAttribute("href")) || offSite(l)));
  for (const l of links) {
    const href = l.getAttribute("href"), h = href.slice(1), tab = h.split("/")[0];
    if (/^#?(commons\/?|commons\/needs-you)?$/.test(href)) continue;
    check("(B) ⭐ " + href + " is an address in the router", tabs.has(tab) && (h.indexOf("/") < 0 || SUBVIEWS[h] === true), Array.from(tabs).length + " tabs");
    const x = load("#commons");
    await x.M.boot(); await settle();
    const same = x.d.querySelector('#cmf-needs a[href="' + href + '"]');
    same.dispatchEvent(new x.w.MouseEvent("click", { bubbles: true, cancelable: true }));
    await go(x, href);
    const pane = x.d.getElementById("tab-" + (tab === "collect" ? "commons" : tab));
    const back = pane && pane.querySelector(":scope > #cpl-back-needs a");
    check("(B) ⭐ " + href + " carries Back to Needs you at its top", back && txt(back) === "Back to Needs you" && back.getAttribute("href") === "#commons/needs-you"
      && x.d.querySelectorAll("#cpl-back-needs").length === 1);
    if (href === "#commons/details/decisions") {
      check("(B) the link survives the view drawing its own root", !!x.d.querySelector("#tab-commons > #cpl-back-needs") && !!x.d.getElementById("cmn-rec-h"));
    }
    back.dispatchEvent(new x.w.MouseEvent("click", { bubbles: true, cancelable: true }));
    await go(x, "#commons/needs-you");
    check("(B) back at Needs you, the link is gone (" + href + ")", !x.d.getElementById("cpl-back-needs"));
  }
  const plain = load("#exhibits/held");
  await settle();
  plain.w.dispatchEvent(new plain.w.CustomEvent("cpl-tab-activated", { detail: { tab: "exhibits" } }));
  check("(B) a view opened without Needs you carries no back link, and nothing is stored for it", !plain.d.getElementById("cpl-back-needs") && !/localStorage\.setItem|sessionStorage/.test(FRONT.slice(FRONT.indexOf("var BACK = "), FRONT.indexOf("function ensureBackCss"))));
  const away = load("#commons");
  await away.M.boot(); await settle();
  away.d.querySelector('#cmf-needs a[href="#cr-reference/names"]').dispatchEvent(new away.w.MouseEvent("click", { bubbles: true, cancelable: true }));
  await go(away, "#cr-reference/names");
  await go(away, "#exhibits");
  check("(B) leaving the tab a Needs you link opened drops the link", !away.d.getElementById("cpl-back-needs"));

  /* Sam, 2026-11-24 (S723): "the 417 link goes to Courses and Programs, which is good, but there's no link back to
     commons, so user gets stranded". Every link from a Commons card into another tab carries the way back. */
  {
    const cx = load("#commons");
    await cx.M.boot(); await settle();
    const outs = Array.from(cx.d.querySelectorAll(".cmf-card a[href^='#']")).filter((l) => !l.hasAttribute("data-onpage") && !/^#(commons|collect)(\/|$)/.test(l.getAttribute("href")));
    const bad = [];
    for (const href of Array.from(new Set(outs.map((l) => l.getAttribute("href"))))) {
      const y = load("#commons");
      await y.M.boot(); await settle();
      const l = Array.from(y.d.querySelectorAll(".cmf-card a")).find((a) => a.getAttribute("href") === href);
      l.dispatchEvent(new y.w.MouseEvent("click", { bubbles: true, cancelable: true }));
      await go(y, href);
      const tab = href.slice(1).split("/")[0], pane = y.d.getElementById("tab-" + tab);
      const back = pane && pane.querySelector(":scope > #cpl-back-needs a");
      if (!back || txt(back) !== "Back to CPL Commons" || back.getAttribute("href") !== "#commons") { bad.push(href); continue; }
      /* The tab draws itself on arrival and clears its pane: the link comes back. */
      pane.innerHTML = '<div class="main-container"><div id="' + tab + '-root">Drawn</div></div>';
      await settle();
      if (!pane.querySelector(":scope > #cpl-back-needs a")) bad.push(href + " (lost on the tab's redraw)");
    }
    check("(B) ⭐ every Commons card link into another tab carries Back to CPL Commons at its top", outs.length > 5 && !bad.length, bad.join(" "));
  }

  // #commons/needs-you
  const ny = load("#commons/needs-you");
  await ny.M.boot(); await settle();
  check("(B) ⭐ #commons/needs-you draws the front page scrolled to Needs you, its heading focused", ny.w.scrolled.indexOf("cmf-needs") >= 0 && ny.d.activeElement === ny.d.getElementById("cmf-needs-h"));
  /* The course panel's address joins the same line (commons_handover.js, 2026-11-20). */
  check("(B) the address stays reported", /return FRONT\.course \? "commons\/course\/" \+ FRONT\.course : FRONT\.focus \? "commons\/needs-you" : "commons"/.test(COMMONS));
  const bare = load("#commons");
  await bare.M.boot(); await settle();
  check("(B) the bare #commons does not scroll", bare.w.scrolled.indexOf("cmf-needs") < 0);

  // ── (6) one program-records date and count ──
  const PR = J("kb/status/program-requirements.json");
  const fr = load("#commons");
  await fr.M.boot(); await settle();
  const cd = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', { url: "https://example.org/index.html#collect", runScripts: "dangerously" });
  const cw = cd.window;
  const cfiles = Object.assign(baseFiles(), { "kb/status/cdc_integrations.json": { integrations: [] } });
  cw.fetch = (u) => { const hit = cfiles[String(u).split("?")[0]]; return Promise.resolve(hit ? { ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) } : { ok: false, status: 404, json: () => Promise.reject(new Error("404")) }); };
  cw.scrollTo = () => {};
  [PRG, SHARE, INTEG, ETA, DATA].forEach((s) => cw.eval(s));
  await cw.CPL_COMMONS_ETA.ready(cw.fetch);
  await cw.CPL_COMMONS_DATA.boot(cw.document.getElementById("root"), "");
  for (let i = 0; i < 10; i++) await tick();
  const R = fr.w.CPL_PROGRAM_RECORDS.compute(PR);
  const longDate = (n) => new Date(n * 86400000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  const tile = Array.from(cw.document.querySelectorAll(".cdd-tile")).find((t) => /Active programs complete/.test(txt(t)));
  const pair = R.complete.toLocaleString("en-US") + " of " + R.active.toLocaleString("en-US");
  check("(6) ⭐ #collect's Active programs tile shows the Commons' count (" + pair + ")", tile && txt(tile).indexOf(pair) === 0 && txt(fr.d.querySelector(".cmf-date .cmf-more-body")).indexOf(pair + " Active programs are complete") >= 0, txt(tile));
  const E = cw.CPL_COMMONS_ETA, B = E.base(cw.CPL_COMMONS_DATA.model(cfiles["kb/status/commons_data.json"]), PR, cfiles["kb/reference/industry_credential_skills.json"]);
  const progDay = E.phase1(B, E.freshState(), null).parts.filter((p) => p.id === "programs")[0].now.day;
  check("(6) ⭐ #collect's program-records date is the Commons' date (" + longDate(R.doneN) + ")", progDay === R.doneN && txt(fr.d.querySelector(".cmf-date-v")) === longDate(R.doneN) + " estimated" && B.remaining === R.left);
  check("(6) ⭐ computed in one file: no page keeps its own COCI-only count or its own target",
    !/\b713\b/.test(FRONT) && !/\b713\b/.test(ETA) && !/\b713\b/.test(DATA) && /COCI_ONLY = 713/.test(PRG) && !/h\.active - h\.complete/.test(ETA));
  check("(6) the shared module is published and loaded before both pages", /^publish commons_program_records\.js$/m.test(fs.readFileSync(".github/pages_allowlist.txt", "utf8"))
    && /need\("commons_program_records\.js", "CPL_PROGRAM_RECORDS"\)/.test(COMMONS) && /\["commons_program_records\.js", "CPL_PROGRAM_RECORDS"\]/.test(DATA));

  // ── the plain words ──
  const page = txt(f.d.querySelector(".cmf"));
  check("plain words: no discipline-in-doubt file on main, no Backfill fix, no off-site link on Needs you but Ask COBI", !/discipline-in-doubt file|on main|Backfill fix/.test(txt(needs)) && Array.from(needs.querySelectorAll('a[href^="http"]')).every(offSite));
  check("no glyph on Needs you", !/[\u2190-\u21FF\u2600-\u27BF\u{1F300}-\u{1FAFF}]/u.test(txt(needs)));
  check("American spelling", !/\b(colour|behaviour|organisation|analyse|centre|catalogue|whilst|amongst)\b/i.test(FRONT + PRG));
  check("the back link's CSS uses tokens only", !/#[0-9a-fA-F]{3,8}\b/.test(FRONT.slice(FRONT.indexOf("var BACK_CSS"), FRONT.indexOf("function ensureBackCss"))));
  check("page text has no UTC stamp", !/\d\d:\d\dZ\b/.test(page));

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "  [" + r[2] + "]")));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });

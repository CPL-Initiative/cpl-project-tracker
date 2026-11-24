// The Commons cards' figures answer their own edits (S719; Sam, 2026-11-23: "when I make edits or decisions, they are
// immediately reflected in the numbers (going in the right direction) shown in the links. Then I will want to apply the
// same process and principles to the other commons cards"; 2026-11-24: "apply the design from the subject card to the
// other commons cards"). The Subjects card's rule (d-subjects-figures-live-s715, guarded by
// tests/commons_subjects_live_figures.test.js) on the cards that have a save to read: a figure is the committed count
// plus the live saves the build has not carried, by the test its own list applies (commons_front.js exhibitsNow,
// needsModel, crLive), and the card draws again in place when the person comes back to the tab (againLive).
//
// WHAT THIS GUARDS, per card (each a way a save would leave a figure behind the list it opens):
//   Exhibit titles (a held title a person names on the Exhibits tab):
//     (E1) with no save since the build, the headline, the stamp check and the held link read the committed counts;
//     (E2) ⭐ a save moves them at once on the return to the tab: one more reviewed, one fewer unstamped, one fewer held,
//          and the held link equals the titles Needs you's held line says are still to name;
//     (E3) ⭐ Take it back (the save's row removed) moves every one of them back;
//     (E4) ⭐ a save made before the fold's last report adds no second stamp.
//   Courses data (a course outline handed over):
//     (H1) with no hand-over, the outlines a person must find equal the hunt file's still-taught courses;
//     (H2) ⭐ a hand-over moves the figure and its quick link at once, and Needs you's list and College Data
//          Collection's to-do (the list the check opens) show the same number;
//     (H3) ⭐ Take it back moves it back;
//     (H4) ⭐ a course the build already counts as answered is not taken off a second time.
//   Credit Recommendations (a wording decision on the tab, for a signed-in reviewer):
//     (C1) with no decision newer than the last receipt, the committed count stands and the worklist is not read;
//          signed out, the decisions table is not read at all;
//     (C2) ⭐ a confirmed decision moves the settled wordings at once, an excluded wording left out;
//     (C3) ⭐ clearing it moves the count back;
//     (C4) ⭐ a wording the build already counts is not counted a second time.
//   (R) a redraw keeps the card's fold, its open stage and its open "...(more)", and a card whose figures did not move
//       is not drawn again.
// Fixtures: every figure is injected here (commons.json's exhibit and CR facts, a review file, a hunt file, a worklist,
// the live rows); the committed files only give the page its shape, and no check reads a committed value.
// Run from repo root: `npm test` (or `node tests/commons_cards_live_figures.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }
const J = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

const SCRIPTS = ["commons_progress.js", "commons_program_records.js", "commons_handover.js", "commons_data.js", "commons_front.js", "commons.js"]
  .map((f) => fs.readFileSync(f, "utf8"));
const BASE = {};
["kb/status/commons.json", "kb/status/program-requirements.json", "kb/status/commons_data.json", "kb/reference/industry_credential_skills.json"]
  .forEach((f) => { BASE[f] = J(f); });
BASE["kb/status/local_subject_titles.json"] = J("tests/fixtures/local_subject_titles_fixture.json");
BASE["kb/status/held_subject_codes.json"] = { totals: { held: 9, codes: 2, pairs: 2 }, codes: [] };
BASE["kb/status/commons_data.json"].blocked_hunt = J("tests/fixtures/commons_hunt_open.json");
const HUNT = BASE["kb/status/commons_data.json"].blocked_hunt;
const HUNT_OPEN = HUNT.colleges.filter((c) => c.hunted && !c.filed).reduce((n, c) => n + c.still_taught.length, 0);
const FIRST = HUNT.colleges.filter((c) => c.hunted && !c.filed)[0];

/* The figures, injected: 50 local titles, 30 stamped (10 a person's), the fold's last report on November 23; five CR
   wordings, three settled (two by a rule, one by a receipt's decision). */
const FOLD_AT = "2026-11-23T06:19:46Z";
const C = JSON.parse(JSON.stringify(BASE["kb/status/commons.json"]));
const facts = (k) => (C.rows || []).concat(C.building || []).find((x) => x.key === k).facts;
Object.assign(facts("exhibit"), { titles: 50, backlog: 0, stamped: 30, person: 10, cohort: 20, fold_at: FOLD_AT });
Object.assign(facts("cr"), { wordings: 5, settled: 3, rule_wordings: 2, curator_only: 1, decisions_through: "Nov 19, 2026", live_rows: 0 });
BASE["kb/status/commons.json"] = C;
BASE["kb/exhibits_review.json"] = { written_at: "2026-11-23T07:50:00Z", held: [
  { raw: "Alpha Welding Certificate", step: "Proposed" }, { raw: "Beta Nursing Card", step: "Proposed" }, { raw: "Gamma EMT Card", step: "Proposed" }] };
BASE["kb/cr_reference_worklist.json"] = { _stats: { total_rows: 50 }, groups: [
  { key: "G1", acts_automatically: true, wordings: 2, members: [{ rec: "w-a", rows: 10 }, { rec: "w-b", rows: 8 }] },
  { key: "G2", acts_automatically: false, wordings: 2, members: [{ rec: "w-c", rows: 6 }, { rec: "w-d", rows: 4 }] },
  { key: "G3", acts_automatically: false, wordings: 1, members: [{ rec: "w-e", rows: 2 }] }] };
/* The receipt's decision, already in the build's count: G2 confirmed, w-d split out. */
const CARRIED = { group_key: "G2", decision: "confirmed", members: ["w-c", "w-d"], excluded: ["w-d"], updated_at: "2026-11-18T20:00:00Z" };
const REVIEWER = { email: "reviewer@example.org", access_token: "tok.en.reviewer", refresh_token: "r" };
const NOW = "2026-11-24T02:00:00Z";
const saveOf = (raw, at) => ({ course_id: "_UNCLASSIFIED::" + raw, field: "unified_title_assignment", value: raw + " (named)", reviewed_at: at });

function load(hash, live) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div class="cpl-tab-pane" id="tab-commons"><div class="main-container"><div id="commons-root">Loading</div></div></div></body></html>',
    { url: "https://example.org/index.html" + (hash || "#commons"), runScripts: "dangerously", pretendToBeVisual: true });
  const w = dom.window, store = {}, calls = [];
  Object.defineProperty(w, "localStorage", { value: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } }, configurable: true });
  w.Element.prototype.scrollIntoView = function () {};
  w.CPL_SESSION = { get: () => (live.signedIn ? REVIEWER : null), isFresh: () => true, ensureFresh: () => Promise.resolve(live.signedIn ? REVIEWER : null),
    authHeaders: (x) => Object.assign({ apikey: "anon-key", Authorization: "Bearer " + (live.signedIn ? REVIEWER.access_token : "anon-key") }, x || {}) };
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    calls.push({ url, method: init.method || "GET", headers: init.headers || {} });
    const ok = (body) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(body))) });
    if (/rpc\/commons_handover_summary/.test(url)) return ok(live.handed || []);
    if (/rest\/v1\/kb_curation/.test(url)) return ok(/field=eq\.unified_title_assignment/.test(url) ? (live.saves || []) : []);
    if (/rest\/v1\/cr_reference_decisions/.test(url)) {
      const m = /^(\d+)-(\d+)$/.exec((init.headers || {}).Range || "");
      const all = live.decisions || [];
      return ok(m ? all.slice(+m[1], +m[2] + 1) : all);
    }
    const hit = BASE[url.split("?")[0]];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return ok(hit);
  };
  SCRIPTS.forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, M: w.CPL_COMMONS, calls };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 40; i++) await tick(); }
/* The person comes back to the Commons tab from the tab where the save was made. */
async function comeBack(x) { x.w.dispatchEvent(new x.w.CustomEvent("cpl-tab-activated", { detail: { tab: "commons" } })); await settle(); }
const cardOf = (x, k) => x.d.querySelector('.cmf-card[data-key="' + k + '"]');
const num = (s) => { const m = /([\d,]+)/.exec(s || ""); return m ? Number(m[1].replace(/,/g, "")) : null; };
const fig = (x, k, n) => txt(x.d.querySelector("#cmf-" + k + "-check-" + n + " .cmf-check-fig"));
const quick = (x, k, re) => { const a = Array.from(cardOf(x, k).querySelectorAll(".cmf-quick a")).map(txt).filter((t) => re.test(t))[0]; return a ? num(a) : 0; };
function exhibit(x) {
  const c = cardOf(x, "exhibit"), heldLink = Array.from(c.querySelectorAll(".cmf-links a")).filter((a) => a.getAttribute("href") === "#exhibits/held")[0];
  return { big: txt(c.querySelector(".cmf-big")), stamp: fig(x, "exhibit", 1), unstamped: quick(x, "exhibit", /no review stamp/),
    held: heldLink ? num(txt(heldLink)) : null, line: txt(x.d.querySelector("#cmf-exhibit-check-1 .cmf-check-line")) };
}
/* Needs you's held line: the titles still to name, or 0 when the line says none is left. */
function needsHeld(x) { const t = txt(x.d.getElementById("cmf-held")); const m = /^([\d,]+) exhibit titles? held for a person to name/.exec(t); return m ? num(m[1]) : 0; }
function outlines(x) { return { fig: num(fig(x, "courses-data", 3)), quick: quick(x, "courses-data", /outline needs a person/) }; }
/* Needs you's Course Outline Fixes: one link a course still to find. */
function needsOutlines(x) { return x.d.querySelectorAll("#cmf-outline-list a[data-course]").length; }

(async function () {
  /* ── Exhibit titles ── */
  const ex = { saves: [] };
  let x = load("#commons", ex);
  await x.M.boot(); await settle();
  let e0 = exhibit(x);
  check("(E1) with no save, the Exhibit titles card reads the committed counts: 30 of 50 reviewed, 20 unstamped, 3 held",
    e0.big === "30 of 50" && num(e0.stamp) === 30 && e0.unstamped === 20 && e0.held === 3 && needsHeld(x) === 3, JSON.stringify(e0));
  ex.saves = [saveOf("Beta Nursing Card", NOW)];
  await comeBack(x);
  let e1 = exhibit(x);
  check("(E2) ⭐ a save moves the card at once: 31 of 50 reviewed, 19 unstamped, 2 held",
    e1.big === "31 of 50" && num(e1.stamp) === 31 && e1.unstamped === 19 && e1.held === 2, JSON.stringify(e1));
  check("(E2) ⭐ the held link equals the titles Needs you's held line says are still to name, and the stamp line names the person's save",
    e1.held === needsHeld(x) && /11 carry a person’s stamp/.test(e1.line) && /holds 1 held title a person named since the last nightly build/.test(e1.line), needsHeld(x) + " | " + e1.line);
  ex.saves = [];
  await comeBack(x);
  let e2 = exhibit(x);
  check("(E3) ⭐ Take it back moves every figure back", e1.big !== e0.big && e2.big === e0.big && e2.stamp === e0.stamp && e2.unstamped === e0.unstamped && e2.held === e0.held && needsHeld(x) === 3,
    JSON.stringify(e2));
  ex.saves = [saveOf("Alpha Welding Certificate", "2026-11-22T18:00:00Z"), saveOf("Gamma EMT Card", NOW)];
  await comeBack(x);
  let e3 = exhibit(x);
  check("(E4) ⭐ a save made before the fold's last report adds no second stamp: only the later save counts (31, not 32), and both leave the held count",
    e3.big === "31 of 50" && e3.unstamped === 19 && e3.held === 1 && needsHeld(x) === 1, JSON.stringify(e3));

  /* ── Courses data: the outlines a person must find ── */
  const ho = { handed: [] };
  x = load("#commons", ho);
  await x.M.boot(); await settle();
  let h0 = outlines(x);
  check("(H1) with no hand-over, the outlines a person must find equal the hunt file's still-taught courses (" + HUNT_OPEN + ")",
    h0.fig === HUNT_OPEN && h0.quick === HUNT_OPEN && needsOutlines(x) === HUNT_OPEN, JSON.stringify(h0) + " needs " + needsOutlines(x));
  const handed = [{ subject_kind: "course", dataset: "course_outlines", college: FIRST.college, course_code: FIRST.still_taught[0].course, kind: "file", status: "waiting", n: 1 }];
  ho.handed = handed;
  await comeBack(x);
  let h1 = outlines(x);
  check("(H2) ⭐ a hand-over moves the check's figure and its quick link at once, and Needs you's list shows the same number",
    h1.fig === HUNT_OPEN - 1 && h1.quick === HUNT_OPEN - 1 && needsOutlines(x) === h1.fig, JSON.stringify(h1) + " needs " + needsOutlines(x));
  const act = Array.from(x.d.querySelectorAll("#cmf-courses-data-check-3 .cmf-act a")).map((a) => a.getAttribute("href"));
  const cdd = load("#collect/outlines-blocked", { handed: handed });
  await cdd.M.boot(); await settle();
  if (cdd.w.CPL_HANDOVER) { await cdd.w.CPL_HANDOVER.summary(true); cdd.w.dispatchEvent(new cdd.w.CustomEvent("cpl-tab-activated", { detail: { tab: "commons" } })); await settle(); }
  const todo = cdd.d.querySelectorAll("#cdd-blocked .cdd-todo-list:not([data-todo-answered]) li[data-todo-course]").length;
  check("(H2) ⭐ the list the check opens, College Data Collection's to-do, shows the same number", act.indexOf("#collect/outlines-blocked") >= 0 && todo === h1.fig,
    act.join(",") + " | to-do " + todo + " | card " + h1.fig);
  ho.handed = [];
  await comeBack(x);
  let h2 = outlines(x);
  check("(H3) ⭐ Take it back moves it back", h1.fig !== h0.fig && h2.fig === h0.fig && h2.quick === h0.quick, JSON.stringify(h2));
  const answeredHunt = JSON.parse(JSON.stringify(HUNT));
  const fc = answeredHunt.colleges.filter((c) => c.slug === FIRST.slug)[0];
  fc.answered = (fc.answered || []).concat([Object.assign({ what: "outline filed" }, fc.still_taught[0])]);
  fc.still_taught = fc.still_taught.slice(1);
  answeredHunt.still_taught_open -= 1;
  const savedData = BASE["kb/status/commons_data.json"];
  BASE["kb/status/commons_data.json"] = Object.assign({}, savedData, { blocked_hunt: answeredHunt });
  /* That course's hand-over, which the build already carried, and a fresh one for a course still open. */
  const other = FIRST.still_taught[1] || HUNT.colleges.filter((c) => c.hunted && !c.filed)[1].still_taught[0];
  const handedTwo = handed.concat([{ subject_kind: "course", dataset: "course_outlines", college: FIRST.still_taught[1] ? FIRST.college : HUNT.colleges.filter((c) => c.hunted && !c.filed)[1].college,
    course_code: other.course, kind: "link", status: "reads", n: 1 }]);
  x = load("#commons", { handed: handedTwo });
  await x.M.boot(); await settle();
  let h3 = outlines(x);
  check("(H4) ⭐ a course the build already counts as answered is not taken off a second time; the fresh hand-over is (" + (HUNT_OPEN - 2) + ", not " + (HUNT_OPEN - 3) + ")",
    h3.fig === HUNT_OPEN - 2 && h3.quick === HUNT_OPEN - 2 && needsOutlines(x) === h3.fig, JSON.stringify(h3));
  BASE["kb/status/commons_data.json"] = savedData;

  /* ── Credit Recommendations: the wordings settled ── */
  const crFig = (x) => num(fig(x, "cr", 4));
  const worklistReads = (x) => x.calls.filter((c) => c.url.indexOf("kb/cr_reference_worklist.json") === 0).length;
  const decisionReads = (x) => x.calls.filter((c) => /cr_reference_decisions/.test(c.url));
  const out = { signedIn: false, decisions: [CARRIED] };
  x = load("#commons", out);
  await x.M.boot(); await settle();
  check("(C1) signed out, the committed count stands and the decisions table is not read", crFig(x) === 3 && decisionReads(x).length === 0, crFig(x) + " | " + decisionReads(x).length);
  const cr = { signedIn: true, decisions: [CARRIED] };
  x = load("#commons", cr);
  await x.M.boot(); await settle();
  check("(C1) signed in, with no decision newer than the last receipt, the committed count stands (3 of 5) and the worklist is not read",
    crFig(x) === 3 && /^3 of 5$/.test(fig(x, "cr", 4)) && worklistReads(x) === 0 && decisionReads(x).length === 1, fig(x, "cr", 4) + " | worklist " + worklistReads(x));
  const reads = decisionReads(x);
  check("(C1) the decisions read is Range-paged and read-only", reads.length >= 1 && reads.every((c) => c.method === "GET" && c.headers.Range === "0-999" && c.headers["Range-Unit"] === "items"));
  const crLine = (x) => txt(x.d.querySelector("#cmf-cr-check-4 .cmf-check-line"));
  cr.decisions = [CARRIED, { group_key: "G3", decision: "confirmed", members: ["w-e"], excluded: [], updated_at: NOW }];
  await comeBack(x);
  const c2 = fig(x, "cr", 4);
  check("(C2) ⭐ a confirmed decision moves the settled wordings at once: 4 of 5", /^4 of 5$/.test(c2), c2);
  check("(C2) the line counts the rule's 2 and the curators' 2, and names the decision newer than the last receipt",
    /^2 settled by a rule and 2 more by a curator\. The curator count reads the decisions table, 1 decision newer than the last receipt among them\.$/.test(crLine(x)), crLine(x));
  cr.decisions = [CARRIED, { group_key: "G3", decision: "confirmed", members: ["w-e"], excluded: ["w-e"], updated_at: NOW }];
  await comeBack(x);
  check("(C2) an excluded wording is not settled: 4 of 5 goes to 3 of 5", /^4 of 5$/.test(c2) && /^3 of 5$/.test(fig(x, "cr", 4)), fig(x, "cr", 4));
  cr.decisions = [CARRIED, { group_key: "G3", decision: "confirmed", members: ["w-e"], excluded: [], updated_at: NOW }];
  await comeBack(x);
  const c3a = fig(x, "cr", 4);
  cr.decisions = [CARRIED, { group_key: "G3", decision: "cleared", members: ["w-e"], excluded: [], updated_at: NOW }];
  await comeBack(x);
  check("(C3) ⭐ clearing the decision moves the count back: 4 of 5, then 3 of 5", /^4 of 5$/.test(c3a) && /^3 of 5$/.test(fig(x, "cr", 4)), c3a + " then " + fig(x, "cr", 4));
  cr.decisions = [Object.assign({}, CARRIED, { updated_at: NOW })];
  await comeBack(x);
  check("(C4) ⭐ a decision saved again for a wording the build already counts counts once: 3 of 5, not 4, read live",
    /^3 of 5$/.test(fig(x, "cr", 4)) && /1 decision newer than the last receipt/.test(crLine(x)), fig(x, "cr", 4) + " | " + crLine(x));
  check("(C4) the worklist is read once a page load", worklistReads(x) === 1, String(worklistReads(x)));

  /* ── (R) a redraw keeps what the person opened ── */
  const r = { saves: [] };
  x = load("#commons", r);
  await x.M.boot(); await settle();
  let card = cardOf(x, "exhibit");
  card.querySelector(".cmf-stage-b").click();
  card.querySelector(":scope > .cmf-x > .cmf-more").click();
  card._fold.click(); card._fold.click();
  const same = cardOf(x, "exhibit");
  await comeBack(x);
  check("(R) a card whose figures did not move is not drawn again", cardOf(x, "exhibit") === same);
  r.saves = [saveOf("Beta Nursing Card", NOW)];
  await comeBack(x);
  card = cardOf(x, "exhibit");
  check("(R) ⭐ the redrawn card keeps its open stage and its open \"...(more)\", and only one card carries its key",
    card !== same && card.querySelector(".cmf-stage-b").getAttribute("aria-expanded") === "true" && !card.querySelector(".cmf-stage-x").hasAttribute("hidden")
    && card.querySelector(":scope > .cmf-x > .cmf-more").getAttribute("aria-expanded") === "true" && x.d.querySelectorAll('.cmf-card[data-key="exhibit"]').length === 1);
  const before = card;
  card._fold.click();
  r.saves = [];
  await comeBack(x);
  card = cardOf(x, "exhibit");
  check("(R) the redrawn card keeps its fold, and its fold word still works",
    card !== before && card.classList.contains("cmf-folded") && (card._fold.click(), !card.classList.contains("cmf-folded")));
  check("(R) every id on the page is still unique", (function () { const seen = {}; return Array.from(x.d.querySelectorAll("[id]")).every((n) => !seen[n.id] && (seen[n.id] = true)); })());

  let fail = 0;
  results.forEach(([n, ok, why]) => { if (!ok) fail++; console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why)); });
  console.log((results.length - fail) + "/" + results.length + " checks passed");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });

// MAP Team Queue (map_team_queue.js) — jsdom test. SkyDesk (Session 131), 2026-08-09.
//
// Guards the properties that make this page worth having rather than harmful:
//  (a) Rule 4 + nav / pane / lazy-boot present in BOTH HTMLs;
//  (b) TEAM-GATED — internal working material must not render logged out;
//  (c) THE ENGINE. buildQueue() is pure (sources + `now` in, ranked items out),
//      so the ranking is tested against fixed dates with no network and no clock;
//  (d) ⭐ A FAILED READ IS NOT AN EMPTY QUEUE. This is the property the whole
//      page turns on. If a source does not load, its item must render "unknown"
//      and float to the TOP — never count 0, which would report the queue clear
//      using data it could not fetch. Same failure family as "not in this
//      dataset" being read as zero, and as the STUDENT GRAIN LEAKED false
//      positive that a PostgREST timeout produced (see
//      docs/kb-notes/methodology-a-guard-that-fails-on-truth-gets-muted.md);
//  (e) a CLEARED item stays visible rather than vanishing, so "nothing waiting"
//      and "nothing measured" never look the same;
//  (f) a person waiting outranks a bigger, older number — Sam's ordering rule;
//  (g) the contacts three-way split, which is the finding this tab was built on:
//      proposal-ready / looked-up-and-empty / NEVER LOOKED UP are three
//      different actions and must not collapse into one "unroutable" count;
//  (h) XSS — college names and register text are escaped (they reach here from
//      Supabase and from committed JSON).
//
// Run from repo root: `npm test` (or `node tests/map_team_queue.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — static invariants on the shipped HTML ──
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
[["CPL_Dashboard.html", cpl], ["index.html", idx]].forEach(function (p) {
  check("nav button in " + p[0], /data-tab="map-queue"[^>]*>📥 MAP Team Queue</.test(p[1]));
  check("pane #map-queue-root in " + p[0], /id="map-queue-root"/.test(p[1]));
  check("lazy boot loadScript in " + p[0],
    /loadScript\('map_team_queue\.js', 'CPL_MAP_QUEUE'/.test(p[1]));
});

// ── Part B — behaviour, loaded into jsdom ──
const SRC = fs.readFileSync("map_team_queue.js", "utf8");
function makeWin(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><body><div id="map-queue-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  if (opts.teamPass) w.localStorage.setItem("cpl_team_pass", opts.teamPass);
  w.fetch = function () { return new Promise(function () {}); };
  const el = w.document.createElement("script");
  el.textContent = SRC;
  w.document.body.appendChild(el);
  return w;
}
const NOW = "2026-08-09T12:00:00Z";

// ── Fixtures: the real shapes, with the real 2026-08-09 measurements ──
const REGISTER = {
  _as_of: "2026-08-07",
  decision_rights: [{ id: "DR-01" }, { id: "DR-02" }],
  cadences: [
    { id: "CA-01", loop: "Daily dashboard rebuild", owner: "Automation (GitHub Actions)", live: null },
    { id: "CA-03", loop: "College contact-refresh nudge", owner: null, live: "nudge" }
  ]
};
const OWNERS = { "DR-01": { owner: "Sam" }, "DR-02": { owner: "Natalie" }, "CA-03": { owner: "Natalie" } };
const GAPS = [
  // MAP holds a contact — not in any queue.
  { college: "Chaffey College", primary_contact_email: "a@b.edu", synced_at: "2026-08-05T00:00:00Z" },
  // Blank + we have a proposal.
  { college: "Gavilan College", primary_contact_email: null, synced_at: "2026-08-05T00:00:00Z" },
  { college: "Foothill College", primary_contact_email: "", synced_at: "2026-08-05T00:00:00Z" },
  // Blank + looked up + nothing usable.
  { college: "Mission College", primary_contact_email: null, synced_at: "2026-08-05T00:00:00Z" },
  // Blank + NEVER looked up (absent from FALLBACK_CONTACTS entirely).
  { college: "Palomar College", primary_contact_email: null, synced_at: "2026-08-05T00:00:00Z" },
  { college: "Yuba College", primary_contact_email: null, synced_at: "2026-08-05T00:00:00Z" }
];
const FALLBACK = {
  "Gavilan College": { via: "curator", contacts: [{ name: "J", email: "j@gavilan.edu" }] },
  "Foothill College": { via: "website", contacts: [{ name: "K", email: "k@foothill.edu" }] },
  "Mission College": { via: "website", contacts: [{ name: "L", email: "" }] },
  // A college MAP already covers — present here, but must NOT count as waiting.
  "Chaffey College": { via: "website", contacts: [{ name: "M", email: "m@chaffey.edu" }] }
};
const FEEDBACK = [
  { created_at: "2026-07-02T00:00:00Z", status: "new", page: "sierra", rating: "down" },
  { created_at: "2026-07-17T00:00:00Z", status: "new", page: "sierra", rating: "up" },
  { created_at: "2026-08-06T00:00:00Z", status: "addressed", page: "sierra", rating: "down" },
  // CI rows — excluded by BOTH markers.
  { created_at: "2026-08-09T00:00:00Z", status: "ci", page: "smoke", rating: "down" },
  { created_at: "2026-07-01T00:00:00Z", status: "new", page: "smoke", rating: "down" }
];
const FULL = {
  gaps: GAPS, fallback: FALLBACK, feedback: FEEDBACK, owners: OWNERS, register: REGISTER,
  nudges: [], loads: [{ table_name: "map_student_credit", loaded_at: "2026-08-08T00:00:00Z" }],
  tracked: { items: [{ id: "t1", title: "Ask Malone for the view name", detail: "d",
                       since: "2026-08-07", last_confirmed: "2026-06-01", owner: "Sam",
                       waiting_on: "Malone", where: null }] }
};

function byId(items) {
  const m = {};
  items.forEach(function (i) { m[i.id] = i; });
  return m;
}

// (g) the contacts three-way split
(function () {
  const q = makeWin().CPL_MAP_QUEUE._buildQueue(FULL, NOW);
  const m = byId(q);
  check("contacts: 2 proposals ready (blank in MAP AND we have an email)", m["contacts-proposed"].count === 2);
  check("contacts: proposals do NOT include colleges MAP already covers",
    m["contacts-proposed"].names.indexOf("Chaffey College") === -1);
  check("contacts: 1 looked up and empty", m["contacts-empty"].count === 1
    && m["contacts-empty"].names[0] === "Mission College");
  check("contacts: 2 never looked up ⭐ the finding this tab was built on",
    m["contacts-never-looked"].count === 2
    && m["contacts-never-looked"].names.sort().join(",") === "Palomar College,Yuba College");
  check("contacts: the three states are separate items, not one 'unroutable' number",
    m["contacts-proposed"] && m["contacts-empty"] && m["contacts-never-looked"]);
  check("contacts: age measured from the MAP sync (2026-08-05 → 4 days)",
    m["contacts-proposed"].ageDays === 4);
})();

// (c) the other measured items
(function () {
  const m = byId(makeWin().CPL_MAP_QUEUE._buildQueue(FULL, NOW));
  check("feedback: counts 2 open real rows, CI excluded by both markers", m.feedback.count === 2);
  check("feedback: age is the OLDEST open row (2026-07-02 → 38 days)", m.feedback.ageDays === 38);
  check("governance: 0 unowned — CA-01 owned in the file, the rest in the overlay",
    m["gov-owners"].count === 0 && m["gov-owners"].state === "clear");
  check("cadence: CA-03 decided but never run (map_college_nudges empty)",
    m["cadence-nudge"].count === 1 && /contact-refresh/.test(m["cadence-nudge"].names[0]));
  check("data age: 1 day since the last hand-run load, so not yet flagged",
    m["data-age"].count === 1 && m["data-age"].state === "clear");
  check("tracked lane: separated from measured", m["tracked-t1"].lane === "tracked");
  check("tracked lane: staleness carried (last confirmed 2026-06-01 → 69 days)",
    m["tracked-t1"].confirmedDays === 69);
})();

// (d) ⭐ a failed read is UNKNOWN, never zero — and it outranks everything
(function () {
  const API = makeWin().CPL_MAP_QUEUE;
  const q = API._buildQueue({ gaps: null, feedback: null, owners: null, register: null,
                              nudges: null, loads: null, fallback: null, tracked: null }, NOW);
  check("null sources: every item is 'unknown'", q.length > 0 && q.every(function (i) { return i.state === "unknown"; }));
  check("null sources: NOT reported as zero", q.every(function (i) { return i.count !== 0; }));
  check("null sources: nothing claims to be clear", !q.some(function (i) { return i.state === "clear"; }));

  // Partial failure is the realistic case: one source 500s, the rest are fine.
  const partial = API._buildQueue(Object.assign({}, FULL, { feedback: null }), NOW);
  const pm = byId(partial);
  check("partial failure: the failed source is unknown", pm.feedback.state === "unknown");
  check("partial failure: the healthy sources still measure", pm["contacts-proposed"].count === 2);
  check("partial failure: the unknown sorts ABOVE everything else",
    partial[0].state === "unknown");
  // POSITIVE CONTROL — with all sources healthy nothing is unknown, so the
  // checks above are detecting failure rather than always firing.
  check("positive control: a fully-loaded queue has no unknowns",
    !API._buildQueue(FULL, NOW).some(function (i) { return i.state === "unknown"; }));
})();

// (f) a person waiting outranks a bigger, older number
(function () {
  const API = makeWin().CPL_MAP_QUEUE;
  const q = API._buildQueue(FULL, NOW).filter(function (i) { return i.state === "waiting"; });
  const firstNonPerson = q.findIndex(function (i) { return !i.personWaiting; });
  const lastPerson = q.map(function (i) { return i.personWaiting; }).lastIndexOf(true);
  check("ranking: every person-waiting item sorts above every other open item",
    firstNonPerson === -1 || lastPerson < firstNonPerson);
  // …and within a rank, oldest first.
  const people = q.filter(function (i) { return i.personWaiting && i.ageDays != null; });
  const ages = people.map(function (i) { return i.ageDays; });
  check("ranking: within a rank, oldest first",
    ages.every(function (a, i) { return i === 0 || ages[i - 1] >= a; }));
})();

// (e) cleared items are kept, not removed
(function () {
  const API = makeWin().CPL_MAP_QUEUE;
  const q = API._buildQueue(FULL, NOW);
  check("cleared: a zero-count item is still present, marked clear",
    q.some(function (i) { return i.id === "gov-owners" && i.state === "clear"; }));
  check("cleared: it sorts below the open items",
    q.findIndex(function (i) { return i.state === "clear"; }) >
    q.findIndex(function (i) { return i.state === "waiting"; }));
})();

// (b) gating
(function () {
  const w = makeWin();                       // logged out
  const r = w.document.getElementById("map-queue-root");
  w.CPL_MAP_QUEUE.render(r);
  check("gate: logged out sees a sign-in prompt", /Team sign-in required/.test(r.innerHTML));
  check("gate: logged out renders no queue items", !/mtq-item/.test(r.innerHTML));
  check("gate: logged out is not told the queue is clear", !/items waiting/.test(r.innerHTML));

  const w2 = makeWin({ teamPass: "p" });     // signed in
  const r2 = w2.document.getElementById("map-queue-root");
  w2.CPL_MAP_QUEUE._state.items = w2.CPL_MAP_QUEUE._buildQueue(FULL, NOW);
  w2.CPL_MAP_QUEUE.render(r2);
  check("signed in: the queue renders", /mtq-item/.test(r2.innerHTML));
  check("signed in: the measured/hand-tracked split is visible",
    /Measured/.test(r2.innerHTML) && /Hand-tracked/.test(r2.innerHTML));
  check("signed in: 'someone is waiting' badge appears on person items",
    /someone is waiting/.test(r2.innerHTML));
})();

// (h) XSS — names arrive from Supabase and committed JSON, both untrusted here
(function () {
  const API = makeWin({ teamPass: "p" }).CPL_MAP_QUEUE;
  const evil = '<img src=x onerror=alert(1)>';
  const q = API._buildQueue({
    gaps: [{ college: evil, primary_contact_email: null, synced_at: "2026-08-05T00:00:00Z" }],
    fallback: {}, feedback: [], owners: {}, register: REGISTER, nudges: [], loads: [],
    tracked: { items: [{ id: "x", title: evil, detail: evil, since: "2026-08-01",
                         last_confirmed: "2026-08-01", where: null }] }
  }, NOW);
  const html = q.map(API._itemHtml).join("");
  check("xss: college name is escaped", !/<img src=x/.test(html) && /&lt;img/.test(html));
  check("xss: hand-tracked title is escaped", (html.match(/&lt;img/g) || []).length >= 2);
})();

// ── Report ──
let failed = 0;
results.forEach(function (r) {
  if (!r[1]) failed++;
  console.log((r[1] ? "  ok   " : "  FAIL ") + r[0]);
});
console.log((results.length - failed) + "/" + results.length + " checks passed");
if (failed) process.exit(1);
